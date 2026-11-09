// End-to-end test of the built app (public/) against the Firebase emulators.
// Run from firebase/:  npm run test:e2e   (builds first; needs Java 11+ and Chrome, or PW_BUNDLED=1)
import { chromium } from 'playwright';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:5050/';
const AUTH = 'http://127.0.0.1:9099/emulator/v1/projects/demo-hifz';
const OWNER = 'edin.livnjak2@gmail.com';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signInByEmailLink(page, email) {
  await page.goto(BASE);
  await page.waitForSelector('#gEmail', { timeout: 20000 });
  await page.fill('#gEmail', email);
  await page.click('#gSend');
  await page.waitForFunction(() => /link sent/i.test(document.querySelector('#hifzGate .msg')?.textContent || ''), null, { timeout: 15000 });
  const codes = await (await fetch(`${AUTH}/oobCodes`)).json();
  const link = codes.oobCodes.filter((c) => c.email === email && c.requestType === 'EMAIL_SIGNIN').at(-1).oobLink;
  await page.goto(link); // the emulator's action page redirects back to the app with the sign-in code
  await page.waitForFunction(() => !document.getElementById('hifzGate') || /do not have access|switched off|could not be checked|no verified email/i.test(document.getElementById('hifzGate').textContent), null, { timeout: 30000 });
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  // the first-visit tour is tested on its own; other checks start with it already seen
  await ctx.addInitScript(() => { try { localStorage.setItem('hifz.tour', '1'); } catch (_) {} });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('pageerror', (e) => page.errs.push(String(e.stack || e.message).split('\n').slice(0, 3).join(' <- ')));
  page.on('console', (m) => { if (m.type() === 'error' && !/PERMISSION_DENIED|Failed to load resource|favicon/.test(m.text())) page.errs.push(m.text()); });
  return page;
}

const T = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const day = (k) => { const d = new Date(T); d.setDate(d.getDate() - k); return iso(d); };
const backup = {
  app: 'hifz-tracker', v: 1, date: iso(T),
  data: {
    classes: { c1: { name: 'Kids class', n: 1, days: [0, 1, 2, 3, 4, 5, 6], time: '15:30', end: '17:00', teacher: 't2' } },
    students: {
      s1: { name: 'Yusuf', cls: 'c1', order: 'nas', startS: 113, prevS: [], amount: 5, readPages: 20, readStart: 1, farDays: 7, days: [0, 1, 2, 3, 4, 5, 6], start: day(20), pos: 40 },
      s2: { name: 'Omar', cls: 'c1', order: 'nas', startS: 113, prevS: [], amount: 15, readPages: 20, readStart: 1, farDays: 7, days: [4], start: day(20), pos: 200 },
    },
    events: {
      e2: { sid: 's1', type: 'session', date: day(1), att: 'present', hw: false, hifzLines: 3, hifzMist: 1, hifzGrade: 'Good', revType: 'near', revMist: 2, revGrade: 'Very good', beh: ['sleepy'] },
      e3: { sid: 's2', type: 'session', date: day(0), att: 'late', hifzLines: 30, hifzMist: 3, hifzGrade: 'Very good' },
    },
    marks: { k1: { sid: 's1', w: 12, k: 'prompt', date: day(1), t: 1 } },
    settings: { main: { school: { name: 'Test school' } } },
    teachers: {
      t1: { name: 'Edin', role: 'admin', active: true, n: 1, email: OWNER },
      t2: { name: 'Bilal', role: 'teacher', active: true, n: 2, email: 'Bilal@Example.com', phone: '+61400111222' },
      t3: { name: 'Sami', role: 'supervisor', active: true, n: 3, email: 'sami@example.com' },
    },
  },
};

(async () => {
  const browser = await chromium.launch(process.env.PW_BUNDLED ? {} : { channel: 'chrome' }); // installed Chrome; PW_BUNDLED=1 for Playwright's own
  try {
    // ---- stranger ----
    const s = await newPage(browser);
    await signInByEmailLink(s, 'stranger@example.com');
    ok('stranger sees "no access"', /do not have access yet/i.test(await s.textContent('#hifzGate')));
    // "Use a different account" clears the offline copy, which closes the database connection: the page must start again
    const reloaded = await Promise.all([s.waitForEvent('load', { timeout: 15000 }), s.click('#gOut')]).then(() => true, () => false);
    await s.waitForSelector('#gGoogle', { timeout: 15000 }).catch(() => {});
    ok('"Use a different account" signs out and starts again', reloaded && !!(await s.$('#gGoogle')));

    // ---- owner ----
    const o = await newPage(browser);
    await signInByEmailLink(o, OWNER);
    await o.waitForFunction(() => typeof loaded !== 'undefined' && loaded && !storeMissing, null, { timeout: 20000 });
    ok('owner gets into the app', !(await o.$('#hifzGate')));
    ok('owner is not a substitute', !(await o.evaluate(() => document.body.classList.contains('sub'))));
    ok('account bar shows owner', /owner/.test(await o.textContent('#hifzAcct')));

    // data round trip through the db adapter, including arrays inside arrays and undefined values
    // (links: the rules allow only the app's collections; the app looks links up by user id, so these scratch
    // records are never shown; read back through onSnapshot like the app does)
    const rt = await o.evaluate(async () => {
      const db = await claude.use('db');
      await db.doc('links/rt').set({ name: 'Round trip', grid: [[1, 2], [3, [4, 5]]], gone: undefined, n: [1, null] });
      await db.doc('links/rt').update({ 'a.b': 1, nested: { x: [[7]] } });
      const viaListener = await new Promise((res) => {
        const off = db.collection('links').onSnapshot((s) => { const d = s.docs.find((x) => x.id === 'rt'); if (d && d.data().nested) { off(); res(d.data()); } });
      });
      const viaGet = (await db.doc('links/rt').get()).data();
      return { viaListener, same: JSON.stringify(viaListener) === JSON.stringify(viaGet) };
    });
    const d = rt.viaListener;
    ok('nested arrays round-trip', JSON.stringify(d.grid) === '[[1,2],[3,[4,5]]]' && JSON.stringify(d.nested.x) === '[[7]]' && rt.same, JSON.stringify(rt));
    ok('undefined dropped like JSON, dotted key kept as one field', !('gone' in d) && d['a.b'] === 1 && !d.a);
    const added = await o.evaluate(async () => (await (await claude.use('db')).collection('links').add({ type: 'note' })).id);
    ok('add() returns an id', typeof added === 'string' && added.length > 5);
    await o.evaluate(async (id) => { const db = await claude.use('db'); await db.doc('links/' + id).delete(); await db.doc('links/rt').delete(); }, added);

    // restore a backup through the real Settings screen
    await o.evaluate(() => go({ name: 'classes' })); // Settings → Grading, points, holidays, backup
    await o.waitForSelector('#rsFile', { state: 'attached' });
    await o.evaluate(() => document.querySelector('#rsFile').closest('details').open = true);
    const dir = mkdtempSync(join(tmpdir(), 'hifz-'));
    const file = join(dir, 'backup.json');
    writeFileSync(file, JSON.stringify(backup));
    await o.setInputFiles('#rsFile', file);
    await o.waitForFunction(() => !document.querySelector('#rsBtn').disabled, null, { timeout: 5000 });
    await o.click('#rsBtn');
    const dl = o.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await o.click('#rsBtn');
    ok('restore saves a safety copy first', !!(await dl));
    await o.waitForFunction(() => /Restored/.test(document.querySelector('#rs_msg').textContent), null, { timeout: 30000 });
    ok('restore writes every record', /Restored all/.test(await o.textContent('#rs_msg')), await o.textContent('#rs_msg'));
    await o.waitForFunction(() => students.length === 2 && events.length === 2 && TEACHERS.length === 3, null, { timeout: 10000 });
    ok('restored data shows in the app', true);
    await sleep(2000); // members sync (debounced) writes members/<email> from the Teachers list
    await o.evaluate(() => go({ name: 'today' }));
    await sleep(500);

    // ---- teacher (email typed with different case in the Teachers list) ----
    const t = await newPage(browser);
    await signInByEmailLink(t, 'bilal@example.com');
    const tGate = await t.$('#hifzGate');
    ok('teacher gets into the app', !tGate, tGate ? await tGate.textContent() : '');
    if (!tGate) {
      await t.waitForFunction(() => loaded && !storeMissing && students.length === 2, null, { timeout: 20000 });
      ok('teacher is in teacher mode', await t.evaluate(() => document.body.classList.contains('sub') && meTeacher() && meTeacher().id === 't2'));
      ok('teacher can edit own class', await t.evaluate(() => canEditCls('c1')));
      const wrote = await t.evaluate(async () => { try { await (await claude.use('db')).doc('events/tt').set({ sid: 's1', type: 'session', date: '2026-01-01' }); return true; } catch (e) { return e.code; } });
      ok('teacher can record a session', wrote === true, String(wrote));
      const esc = await t.evaluate(async () => { try { await (await claude.use('db')).doc('teachers/t2').update({ role: 'admin' }); return 'allowed'; } catch (e) { return e.code; } });
      ok('teacher cannot make themselves admin', esc === 'permission-denied', esc);
    }

    // ---- supervisor ----
    const v = await newPage(browser);
    await signInByEmailLink(v, 'sami@example.com');
    const vGate = await v.$('#hifzGate');
    ok('supervisor gets into the app', !vGate);
    if (!vGate) {
      await v.waitForFunction(() => loaded && students.length === 2, null, { timeout: 20000 });
      const w = await v.evaluate(async () => { try { await (await claude.use('db')).doc('events/vv').set({ sid: 's1' }); return 'allowed'; } catch (e) { return e.code; } });
      ok('supervisor cannot write', w === 'permission-denied', w);
    }

    // ---- sign out ----
    await o.click('#hifzAcct button');
    await o.waitForSelector('#gGoogle', { timeout: 15000 });
    ok('sign out returns to the sign-in screen', true);

    for (const [who, p] of [['owner', o], ['teacher', t], ['supervisor', v], ['stranger', s]])
      ok(`no script errors (${who})`, p.errs.length === 0, p.errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('test run', false, e.stack);
  } finally {
    await browser.close();
  }
  console.log(results.join('\n'));
  const failed = results.filter((r) => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
