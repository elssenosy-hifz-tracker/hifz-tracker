// Checks this computer has what the project needs, and says how to install anything missing.
//   npm run check-setup            (from firebase/) prints every check
//   node firebase/scripts/check-setup.mjs --session
//       used by the Claude Code SessionStart hook (.claude/settings.json): installs npm packages on a fresh
//       checkout, then prints only problems, so a working setup costs the agent no context.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const session = process.argv.includes('--session');
const win = process.platform === 'win32';
const FIREBASE_DIR = fileURLToPath(new URL('..', import.meta.url));
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win && /^(npm|npx)$/.test(cmd), ...opts });
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
};
const install = (winget, other) => (win ? `winget install ${winget}` : other);
const checks = [];
const check = (name, ok, fix, needed) => checks.push({ name, ok, fix, needed });

const nodeMajor = Number(process.versions.node.split('.')[0]);
check('Node.js 22+', nodeMajor >= 22, install('OpenJS.NodeJS.LTS', 'install Node.js 22 or newer from https://nodejs.org'), 'everything');
check('Git', run('git', ['--version']).ok, install('Git.Git', 'install Git'), 'everything');

const pyCandidates = win ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
const python = pyCandidates.some(([c, pre]) => run(c, [...pre, '-c', 'import sys; sys.exit(sys.version_info < (3, 8))']).ok);
check('Python 3', python, install('Python.Python.3.12', 'install Python 3'), 'building the app');

const gh = run('gh', ['--version']).ok;
check('GitHub CLI (gh)', gh, install('GitHub.cli', 'install the GitHub CLI: https://cli.github.com'), 'opening pull requests, reading preview links');
if (gh) check('GitHub CLI signed in', run('gh', ['auth', 'status']).ok, 'run `gh auth login` (GitHub.com, HTTPS, sign in with a web browser)', 'opening pull requests');
const name = run('git', ['config', 'user.name']).out;
const email = run('git', ['config', 'user.email']).out;
check('Git name and email set', !!(name && email), 'run `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`', 'committing');

const java = run('java', ['-version']);
const javaMajor = Number((java.out.match(/version "(\d+)(?:\.(\d+))?/) || []).slice(1).find((v) => v && v !== '1') || 0);
check('Java 11+', java.ok && javaMajor >= 11, install('EclipseAdoptium.Temurin.21.JDK', 'install Java 21 (macOS: brew install openjdk@21, then export JAVA_HOME=/opt/homebrew/opt/openjdk@21)'),
  'the rules and app tests, run before every pull request');

const chromePaths = win
  ? [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean).map((p) => join(p, 'Google', 'Chrome', 'Application', 'chrome.exe'))
  : process.platform === 'darwin' ? ['/Applications/Google Chrome.app'] : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
check('Google Chrome', chromePaths.some((p) => existsSync(p)) || !!process.env.PW_BUNDLED,
  'install Chrome, or run `npx playwright install chromium` in firebase/ and set PW_BUNDLED=1', 'the browser tests');

let deps = existsSync(join(FIREBASE_DIR, 'node_modules', 'esbuild'));
if (!deps && session && nodeMajor >= 22) {
  deps = run('npm', ['ci', '--no-audit', '--no-fund'], { cwd: FIREBASE_DIR }).ok;
  if (deps) console.log('Installed the npm packages in firebase/ (npm ci).');
}
check('npm packages installed', deps, 'run `npm ci` in firebase/', 'building and testing');

const missing = checks.filter((c) => !c.ok);
if (session) {
  if (missing.length) {
    console.log('Project setup is incomplete (see AGENTS.md, Setup):');
    for (const c of missing) console.log(`- ${c.name} missing, needed for ${c.needed}: ${c.fix}`);
  }
} else {
  for (const c of checks) console.log(`${c.ok ? 'OK     ' : 'MISSING'} ${c.name}${c.ok ? '' : ` (needed for ${c.needed}): ${c.fix}`}`);
  console.log(missing.length ? '\nAfter installing anything, open a new terminal (and restart Claude) so it is found.' : '\nAll set.');
}
process.exit(0);
