// Run a Python script with whichever Python this computer has (Windows often has `py` or `python`, not `python3`).
//   node scripts/py.mjs <script.py> [args...]
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []], ['python3', []]]
  : [['python3', []], ['python', []]];
for (const [cmd, pre] of candidates) {
  const probe = spawnSync(cmd, [...pre, '-c', 'import sys; sys.exit(sys.version_info < (3, 8))'], { stdio: 'ignore' });
  if (probe.status !== 0) continue; // missing, too old, or the Windows Store placeholder
  const run = spawnSync(cmd, [...pre, ...args], { stdio: 'inherit' });
  process.exit(run.status ?? 1);
}
console.error('Python 3 was not found. Install it (Windows: winget install Python.Python.3.12), then open a new terminal.');
process.exit(1);
