// Test of the demo build (public-demo/): sample data, roles, saving, reset, and no Firebase traffic.
// Run from firebase/:  npm run test:demo   (builds the demo first; needs Chrome, or PW_BUNDLED=1 for Playwright's Chromium)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { serve } from '../scripts/serve.mjs';

const PORT = 5174;
const BASE = `http://127.0.0.1:${PORT}/`;
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`); };
// Anything Firebase-shaped is forbidden; fonts and other public assets the app uses are fine.
const FIREBASE = /firebaseio|firebaseapp|firestore\.googleapis|identitytoolkit|securetoken|firebaseinstallations|hifz-tracker-cd6d0/;

const server = await serve(fileURLToPath(new URL('../../public-demo', import.meta.url)), PORT);
const browser = await chromium.launch(process.env.PW_BUNDLED ? {} : { channel: 'chrome' });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  const firebaseCalls = [];
  page.on('pageerror', (e) => errs.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on('request', (r) => { if (FIREBASE.test(r.url())) firebaseCalls.push(r.url()); });
  const reloadBy = (act) => Promise.all([page.waitForEvent('load'), act()]);
  const ready = () => page.waitForFunction(() => typeof loaded !== 'undefined' && loaded && students.length > 0, null, { timeout: 20000 });

  await page.goto(BASE);
  await ready();
  ok('demo app starts with the sample school', await page.evaluate(() => students.length === 6 && events.length > 20 && TEACHERS.length === 4));
  ok('preview banner is shown', /made-up sample data/i.test(await page.textContent('#hifzDemo')));
  ok('home screen greets with Welcome', /^Welcome · 6 students/.test(await page.textContent('#sub')));
  ok('starts as owner (not substitute mode)', !(await page.evaluate(() => document.body.classList.contains('sub'))));

  // a change survives a reload (saved in this browser)
  await page.evaluate(async () => { await (await claude.use('db')).doc('students/s1').update({ name: 'Yusuf Changed' }); });
  await page.waitForTimeout(400);
  await page.reload();
  await ready();
  ok('changes are kept after reload', await page.evaluate(() => students.find((s) => s.id === 's1').name === 'Yusuf Changed'));

  // view as teacher
  await reloadBy(() => page.selectOption('#hifzDemoRole', 'teacher'));
  await ready();
  ok('view as teacher gives teacher mode', await page.evaluate(() => document.body.classList.contains('sub') && meTeacher() && meTeacher().id === 't2'));
  await reloadBy(() => page.selectOption('#hifzDemoRole', 'owner'));
  await ready();

  // reset
  page.once('dialog', (d) => d.accept());
  await reloadBy(() => page.click('#hifzDemoReset'));
  await ready();
  ok('reset puts the sample data back', await page.evaluate(() => students.find((s) => s.id === 's1').name === 'Yusuf'));

  ok('no requests to Firebase', firebaseCalls.length === 0, firebaseCalls.slice(0, 3).join(' '));
  ok('no script errors', errs.length === 0, errs.slice(0, 3).join(' | '));
} catch (e) {
  ok('test run', false, e.stack);
} finally {
  await browser.close();
  server.close();
}
console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
