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
  // the first-visit tour is tested on its own; other checks start with it already seen
  await ctx.addInitScript(() => { try { localStorage.setItem('hifz.tour', '1'); } catch (_) {} });
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
  ok('starts as owner (not substitute mode)', !(await page.evaluate(() => document.body.classList.contains('sub'))));

  // a change survives a reload (saved in this browser)
  await page.evaluate(async () => { await (await claude.use('db')).doc('students/s1').update({ name: 'Yusuf Changed' }); });
  await page.waitForTimeout(400);
  await page.reload();
  await ready();
  ok('changes are kept after reload', await page.evaluate(() => students.find((s) => s.id === 's1').name === 'Yusuf Changed'));

  // student mushaf: A+ makes the text larger without making the page wider than the screen
  await page.evaluate(() => { go({ name: 'mushaf', id: 's1' }); view.page = 2; render(true); });
  await page.waitForSelector('#mZi');
  const size = () => page.evaluate(() => { const w = document.querySelector('.mwrap'); return { font: parseFloat(getComputedStyle(document.querySelector('.mpage')).fontSize), over: w.scrollWidth - w.clientWidth }; });
  const s0 = await size();
  await page.click('#mZi'); await page.waitForTimeout(200); await page.click('#mZi'); await page.waitForTimeout(300);
  const s2 = await size();
  ok('A+ makes the mushaf text larger without sideways scrolling', s2.font > s0.font * 1.6 && s2.over <= 1, JSON.stringify({ s0, s2 }));
  await page.click('#mZo'); await page.waitForTimeout(200); await page.click('#mZo'); await page.waitForTimeout(200);

  // Tajweed page: rules index, a rule with its examples, search, coloured mushaf
  await page.click('#nav [data-nav="tajweed"]');
  await page.waitForSelector('.tjrule');
  ok('Tajweed page lists the rules', await page.evaluate(() => document.querySelectorAll('.tjrule').length >= 25 && ['tabii', 'silaS', 'silaK', 'arid', 'leen', 'iwad', 'tafkhim', 'tarqiq'].every((r) => document.querySelector('.tjrule[data-tr=' + r + ']'))));
  await page.click('.tjrule[data-tr="iwad"]');
  await page.waitForSelector('.tjres .tjsel');
  ok('madd iwad page finds examples', await page.evaluate(() => +document.querySelector('.tjstat b').textContent > 500));
  await page.click('[data-tr=""]');
  await page.waitForSelector('.tjrule[data-tr="iqlab"]');
  await page.click('.tjrule[data-tr="iqlab"]');
  await page.waitForSelector('.tjres .tjay');
  const iq = await page.evaluate(() => ({ places: +document.querySelector('.tjstat b').textContent, shown: document.querySelectorAll('.tjres .tjay').length, hl: document.querySelectorAll('.tjres .tjsel').length }));
  ok('a rule page shows its count and highlighted examples', iq.places > 500 && iq.shown === 20 && iq.hl >= 20, JSON.stringify(iq));
  await page.selectOption('#tjScope', 's1');
  await page.waitForTimeout(300);
  const iqB = await page.evaluate(() => +document.querySelector('.tjstat b').textContent);
  ok('examples can be limited to one surah', iqB > 0 && iqB < iq.places, String(iqB));
  // practice: a marked letter, four choices, the score counts, a rule group can be chosen
  await page.click('[data-tv="practice"]');
  await page.waitForSelector('.tjopt');
  const q1 = await page.evaluate(() => ({ opts: document.querySelectorAll('.tjopt').length, marks: document.querySelectorAll('.tjay .tjq').length, hints: document.querySelectorAll('.tjay [data-tj], .tjay [class^="tj-"]').length, right: TJ_Q.r }));
  ok('practice shows one marked letter and four choices, without colours', q1.opts === 4 && q1.marks === 1 && q1.hints === 0, JSON.stringify(q1));
  await page.click(`.tjopt[data-ans="${q1.right}"]`);
  await page.waitForSelector('.tjfb.ok');
  ok('a right answer is marked correct and counted', /1 \/ 1/.test(await page.textContent('.tjscore')));
  await page.click('#tjNextQ');
  await page.waitForSelector('.tjopt:not([disabled])');
  const wrong = await page.evaluate(() => TJ_Q.opts.find((r) => r !== TJ_Q.r));
  await page.click(`.tjopt[data-ans="${wrong}"]`);
  await page.waitForSelector('.tjfb.bad');
  ok('a wrong answer shows the right one', /1 \/ 2/.test(await page.textContent('.tjscore')) && !!(await page.$('.tjopt.ok')));
  ok('every rule can be chosen for practice', await page.evaluate(() => Object.keys(TJ_R).every((r) => document.querySelector('#tjPG option[value="r:' + r + '"]'))));
  await page.selectOption('#tjPG', 'g:madd');
  await page.waitForSelector('.tjopt:not([disabled])');
  ok('practice can be limited to one group of rules', await page.evaluate(() => TJ_R[TJ_Q.r][0] === 'madd'));
  await page.selectOption('#tjPG', 'r:iqlab');
  await page.waitForSelector('.tjopt:not([disabled])');
  ok('practice can be limited to one rule', await page.evaluate(() => TJ_Q.r === 'iqlab' && TJ_Q.opts.length === 4));
  await page.click('[data-tv="search"]');
  await page.fill('#tjQ', 'من بعد');
  await page.click('#tjSF button[type=submit]');
  await page.waitForSelector('.tjres .tjay');
  const sr = await page.evaluate(() => ({ found: parseInt(document.querySelector('.tjres').previousElementSibling.querySelector('p b').textContent, 10), coloured: document.querySelectorAll('.tjres [class^="tj-"]').length }));
  ok('search finds ayahs without diacritics and shows colours', sr.found > 100 && sr.coloured > 20, JSON.stringify(sr));
  await page.click('[data-tv="mushaf"]');
  await page.evaluate(() => { view.tp = 2; render(true); });
  await page.waitForSelector('.mpage .tj-madd6');
  const tj = await page.evaluate(() => ({
    // page 2: الٓمٓ is madd lazim, هُدࣰى لِّلۡمُتَّقِينَ is idgham without ghunnah
    lazim: [...document.querySelectorAll('.mpage .tj-madd6')].some((e) => e.textContent.includes('لٓمٓ')),
    idgN: [...document.querySelectorAll('.mpage .tj-idgN')].some((e) => e.textContent.startsWith('د')),
    key: !!document.querySelector('.tjkey'),
  }));
  ok('coloured mushaf colours the rules and shows the key', tj.lazim && tj.idgN && tj.key, JSON.stringify(tj));
  await page.hover('.mpage .tj-madd6');
  await page.waitForSelector('#tjTip:not([hidden])');
  ok('pointing at a coloured letter shows the rule name', /المد اللازم/.test(await page.textContent('#tjTip')));
  await page.mouse.move(5, 5);
  // "All rules" also colours madd tabii etc. and underlines tafkhim / tarqiq
  await page.click('#tjAll');
  await page.waitForSelector('.mpage .tjF');
  ok('All rules colours the extra rules and extends the key', await page.evaluate(() => document.querySelectorAll('.mpage .tj-madd2').length > 5 && document.querySelectorAll('.mpage .tjF').length > 5 && document.querySelectorAll('.tjkey .ul').length === 2));
  await page.click('#tjAll');
  await page.waitForTimeout(200);

  // student page: practice results (weakest first) and tajweed mistakes by rule; practise the weakest rule with that student
  await page.evaluate(() => { go({ name: 'student', id: 's1' }); });
  await page.click('details[data-sf="tajweed"] > summary');
  await page.waitForSelector('.tjstud');
  const sp = await page.evaluate(() => ({ first: document.querySelector('.tjstud .tjweak .tjar').textContent, text: document.querySelector('.tjstud').textContent }));
  ok('student page shows the weakest practised rule and marked tajweed mistakes', sp.first === 'الإقلاب' && /1 \/ 4/.test(sp.text) && /الإدغام بغير غنة/.test(sp.text), JSON.stringify(sp));
  await page.click('#tjPractise');
  await page.waitForSelector('.tjopt:not([disabled])');
  ok('Practise weakest rule opens practice for that student and rule', await page.evaluate(() => view.pst === 's1' && TJ_Q.r === 'iqlab' && document.querySelector('#tjPS').value === 's1'));
  await page.click('.tjopt[data-ans="iqlab"]');
  await page.waitForTimeout(400);
  ok('a practice answer is saved to the student', await page.evaluate(() => { const t = allStudents.find((s) => s.id === 's1').tjp; return t && t.iqlab[0] === 2 && t.iqlab[1] === 5; }));

  // a tajweed mistake mark offers the rules in that word first, and keeps the chosen rule
  await page.evaluate(() => { go({ name: 'mushaf', id: 's1' }); view.page = pageOfWord(117); render(true); });
  await page.waitForSelector('.mtr');
  const mk = await page.evaluate(() => { const s = [...document.querySelectorAll('.mtr')].find((x) => x.value === 'iqlab'); return { chosen: !!s, opts: s ? [...s.options].map((o) => o.value).filter(Boolean) : [], inWord: tjWordRules(117) }; });
  ok('a tajweed mistake offers only the rules in that word (plus "Another rule")', mk.chosen && mk.opts.join() === [...mk.inWord, '__all'].join() && mk.opts.length < 6, JSON.stringify(mk));
  const sel = await page.$$eval('.mtr', (l) => l.findIndex((x) => x.value === 'iqlab'));
  await page.locator('.mtr').nth(sel).selectOption('__all');
  ok('"Another rule" opens the full list', await page.evaluate((i) => document.querySelectorAll('.mtr')[i].options.length === Object.keys(TJ_R).length + 1, sel));
  // marking a word that has exactly one rule as a tajweed mistake saves that rule straight away
  const one = await page.evaluate(() => { const ws = [...document.querySelectorAll('.mpage .w')].map((e) => +e.dataset.w); return ws.find((w) => tjWordRules(w).length === 1 && !marks.some((m) => m.w === w)); });
  await page.check('input[name=mk][value=tajweed]');
  await page.click(`.mpage .w[data-w="${one}"]`);
  await page.waitForTimeout(400);
  ok('a word with one rule gets that rule automatically', await page.evaluate((w) => { const m = marks.find((x) => x.w === w); return !!m && m.k === 'tajweed' && m.tr === tjWordRules(w)[0]; }, one), String(one));
  await page.check('input[name=mk][value=forgot]');
  await page.evaluate(() => { go({ name: 'list' }); });

  // simpler layout: 5 buttons in the bottom bar, Help instead of Backup/Settings in the header
  await page.evaluate(() => { go({ name: 'list' }); });
  await page.waitForSelector('.slist .row');
  const lay = await page.evaluate(() => ({ nav: [...document.querySelectorAll('#nav button')].filter((b) => !b.hidden).map((b) => b.dataset.nav), help: !!document.getElementById('helpTop'), oldTop: !!document.getElementById('bkTop'), rows: document.querySelectorAll('.slist .row').length, att: document.querySelectorAll('#view .att, #view [data-att]').length }));
  ok('bottom bar has 5 buttons and the header has Help', lay.nav.join() === 'today,list,tajweed,reports,settings' && lay.help && !lay.oldTop, JSON.stringify(lay));
  ok('Students page is search, class tabs and the list', lay.rows === 6 && lay.att === 0 && !!(await page.$('#srch')), JSON.stringify(lay));
  await page.evaluate(() => { go({ name: 'settings' }); });
  await page.waitForSelector('[data-hub="backup"]');
  ok('Backup and Schools are in Settings', !!(await page.$('[data-hub="schools"]')));
  // student page: two main buttons, the rest under More, long sections folded
  await page.evaluate(() => { go({ name: 'student', id: 's1' }); });
  await page.waitForSelector('#sesBtn');
  const sv = await page.evaluate(() => { const v = (s) => { const e = document.querySelector(s); return !!e && !e.closest('details:not([open])') && e.getBoundingClientRect().height > 0; }; return { ses: v('#sesBtn'), mus: v('#musBtn'), test: v('#tmBtn'), folds: document.querySelectorAll('details[data-sf]').length, open: document.querySelectorAll('details[data-sf][open]').length }; });
  await page.click('#sMore > summary');
  const tmAfter = await page.evaluate(() => document.querySelector('#tmBtn').getBoundingClientRect().height > 0);
  ok('student page shows two main buttons; the rest are under More', sv.ses && sv.mus && !sv.test && tmAfter, JSON.stringify(sv));
  ok('long sections on the student page start folded', sv.folds >= 8 && sv.open <= 1, JSON.stringify(sv));
  // session: mistake counters stay hidden until "Mistakes and details"
  await page.evaluate(() => { go({ name: 'session', id: 's2' }); });
  await page.waitForSelector('[data-qx="qHC"]');
  const vis = (s) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && e.getBoundingClientRect().height > 0; }, s);
  const before = await vis('#qHm');
  await page.click('[data-qx="qHC"]');
  ok('session hides mistake counters until "Mistakes and details"', !before && (await vis('#qHm')));
  // marking a tajweed mistake in the session mushaf asks which rule (rules of that word only)
  await page.click('#qMusH');
  await page.waitForSelector('.qmus .mpage .w');
  await page.click('.qmus [data-qk="tajweed"]');
  const tw = await page.evaluate(() => [...document.querySelectorAll('.qmus .mpage .w:not(.out)')].map((e) => +e.dataset.w).find((w) => tjWordRules(w).length > 1 && !marks.some((m) => m.w === w)));
  await page.click(`.qmus .mpage .w[data-w="${tw}"]`);
  await page.waitForSelector('.qmtj [data-tjr]');
  const want = await page.evaluate((w) => { const b = document.querySelectorAll('.qmtj [data-tjr]'); return { n: b.length, rules: tjWordRules(w), first: b[0].dataset.tjr }; }, tw);
  await page.click('.qmtj [data-tjr]');
  await page.waitForTimeout(500);
  ok('session mushaf asks which tajweed rule and saves it', want.n === want.rules.length && (await page.evaluate(([w, r]) => { const m = marks.find((x) => x.w === w && x.src === 'session'); return !!m && m.k === 'tajweed' && m.tr === r; }, [tw, want.first])), JSON.stringify({ tw, ...want }));
  await page.click('#qmX');
  // first-visit tour: a preview starts with it seen; ?tour shows it as a new device would, Skip ends it, Help shows it again
  const p0 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p0.goto(BASE);
  await p0.waitForSelector('#helpTop', { timeout: 15000 });
  await p0.waitForTimeout(1500);
  ok('preview does not start the first-visit tour', !(await p0.$('#tour')));
  await p0.close();
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p2.goto(BASE + '?tour');
  await p2.waitForSelector('#tour .tcard', { timeout: 15000 });
  const t1 = await p2.textContent('#tour .tt');
  await p2.click('#tSkip');
  const gone = !(await p2.$('#tour')) && (await p2.evaluate(() => localStorage.getItem('hifz.tour') === '1'));
  await p2.click('#helpTop');
  await p2.waitForSelector('#tour .tcard');
  ok('first-visit tour shows once, Skip ends it, Help shows it again', t1 === 'Today' && gone, t1);
  await p2.close();

  // view as teacher
  await reloadBy(() => page.selectOption('#hifzDemoRole', 'teacher'));
  await ready();
  ok('view as teacher gives teacher mode', await page.evaluate(() => document.body.classList.contains('sub') && meTeacher() && meTeacher().id === 't2'));
  await page.evaluate(() => { localStorage.removeItem('hifz.cls'); go({ name: 'list' }); });
  await page.waitForSelector('.slist .row');
  ok('a teacher starts on their own class in Students', await page.evaluate(() => document.querySelectorAll('.slist .row').length === 3 && document.querySelector('[data-cls].on').dataset.cls === 'c1'));
  await page.evaluate(() => { go({ name: 'reports' }); });
  await page.waitForSelector('.hubs');
  ok('a teacher does not see the school overview', !(await page.$('[data-hub="sover"]')));
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
