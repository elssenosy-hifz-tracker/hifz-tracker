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
  // Today page: a card for each class meeting today; tapping one opens its students, with a way back
  await page.evaluate(() => { classes.forEach((c) => { c.days = [0, 1, 2, 3, 4, 5, 6]; }); go({ name: 'today' }); });
  await page.waitForSelector('.tpick');
  const tp = await page.evaluate(() => ({ cards: [...document.querySelectorAll('.tpick')].map((b) => b.dataset.tcls), list: !!document.querySelector('.tnow') }));
  ok('Today lists the classes meeting today as cards, before any student list', tp.cards.length === 2 && !tp.list, JSON.stringify(tp));
  await page.click(`.tpick[data-tcls="${tp.cards[0]}"]`);
  await page.waitForSelector('.tnow .trow');
  const tc = await page.evaluate(() => { const n = document.querySelector('.tnow'), h = document.querySelector('.hpanel'); return { cls: n.dataset.cid, rows: n.querySelectorAll('.trow').length, want: classOrder(n.dataset.cid).length, back: !!document.getElementById('back'), hoursBelow: !h || !!(n.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  ok('tapping a class card opens its students, with Back, and the hours panel below them', tc.cls === tp.cards[0] && tc.rows === tc.want && tc.want > 0 && tc.back && tc.hoursBelow, JSON.stringify(tc));
  await page.click('#back');
  await page.waitForSelector('.tpick');
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
  ok('"Move to another group" is in the More menu, with Move student showing', await page.evaluate(() => { const b = document.querySelector('#sMore .smenu #mvBox'); return !!b && /Move to another group/.test(b.textContent) && document.querySelector('#mvGo').getBoundingClientRect().height > 0; }));
  // moving a student keeps a record: date, from, to and who moved them (shown under "Earlier moves")
  const mv = await page.evaluate(async () => {
    go({ name: 'student', id: 's3' }); document.querySelector('#sMore').open = true;
    const sel = document.querySelector('#mvTo'); sel.value = 'c2'; const g = document.querySelector('#mvGo'); g.click(); g.click();
    for (let i = 0; i < 40 && allStudents.find((s) => s.id === 's3').cls !== 'c2'; i++) await new Promise((r) => setTimeout(r, 100));
    const st = allStudents.find((s) => s.id === 's3'), m = (st.moves || []).slice(-1)[0] || {};
    document.querySelector('#sMore').open = true; const h = document.querySelector('#sMore #mvHist');
    const back = document.querySelector('#mvGo'); back.click(); back.click(); // move back to the Kids class (c1)
    for (let i = 0; i < 40 && allStudents.find((s) => s.id === 's3').cls !== 'c1'; i++) await new Promise((r) => setTimeout(r, 100));
    return { cls: st.cls, m, hist: h ? h.textContent : '', n: (allStudents.find((s) => s.id === 's3').moves || []).length, now: allStudents.find((s) => s.id === 's3').cls };
  });
  const news = await page.evaluate(async () => {
    go({ name: 'today' }); await new Promise((r) => setTimeout(r, 300));
    const p = document.querySelector('#mvNews'), txt = p ? p.textContent : '';
    document.querySelector('#mvSeen').click(); go({ name: 'today' }); await new Promise((r) => setTimeout(r, 300));
    return { txt, gone: !document.querySelector('#mvNews') };
  });
  ok('Today shows an admin the students another admin moved, until "Got it"', /Students moved/.test(news.txt) && /Maryam/.test(news.txt) && /moved by Amina/.test(news.txt) && !/Ibrahim/.test(news.txt) && news.gone, JSON.stringify(news));
  ok('a move saves the date, both groups and who moved the student, and lists it', mv.cls === 'c2' && mv.m.from === 'c1' && mv.m.to === 'c2' && mv.m.by === 'Demo Owner' && mv.m.date === new Date().toLocaleDateString('en-CA') && /Earlier moves/.test(mv.hist) && /moved by Demo Owner/.test(mv.hist) && mv.n === 2 && mv.now === 'c1', JSON.stringify(mv));
  ok("an admin's own moves are not shown to them on Today", await page.evaluate(async () => { localStorage.removeItem('hifz.movesSeen'); go({ name: 'today' }); await new Promise((r) => setTimeout(r, 300)); const t = (document.querySelector('#mvNews') || {}).textContent || ''; return /Maryam/.test(t) && !/Ibrahim/.test(t); }));
  // deleting a group from the school page: an empty one directly, one with students after moving them all (recorded)
  const gd = await page.evaluate(async () => {
    const wait = async (f) => { for (let i = 0; i < 50 && !f(); i++) await new Promise((r) => setTimeout(r, 100)); };
    const sid = SCHOOLS[0].id, a = await db.collection('classes').add({ name: 'Empty group', school: sid, n: Date.now() }), b = await db.collection('classes').add({ name: 'Temp group', school: sid, n: Date.now() });
    await wait(() => classes.some((c) => c.id === a.id) && classes.some((c) => c.id === b.id));
    await moveStudent(allStudents.find((s) => s.id === 's3'), b.id); await wait(() => allStudents.find((s) => s.id === 's3').cls === b.id);
    const open = async () => { go({ name: 'schoolv', id: sid, tab: 'groups' }); await new Promise((r) => setTimeout(r, 300)); document.querySelectorAll('.gdel').forEach((d) => { d.open = true; d.closest('details.panel') && (d.closest('details.panel').open = true); }); };
    await open(); const empty = document.querySelector(`form[data-gid="${a.id}"] .gdel`).textContent;
    let bt = document.querySelector(`[data-gdel="${a.id}"]`); bt.click(); bt.click(); await wait(() => !classes.some((c) => c.id === a.id));
    await open(); const full = document.querySelector(`form[data-gid="${b.id}"] .gdel`).textContent;
    document.querySelector(`form[data-gid="${b.id}"] [data-gmv]`).value = 'c1';
    bt = document.querySelector(`[data-gdel="${b.id}"]`); bt.click(); bt.click(); await wait(() => !classes.some((c) => c.id === b.id));
    const st = allStudents.find((s) => s.id === 's3');
    return { empty: /No students in this group/.test(empty), full: /1 student is in this group/.test(full) && /Move 1 student and delete the group/.test(full), aGone: !classes.some((c) => c.id === a.id), bGone: !classes.some((c) => c.id === b.id), cls: st.cls, last: (st.moves || []).slice(-1)[0] };
  });
  ok('an empty group is deleted from the school page; a group with students moves them first, recorded', gd.empty && gd.full && gd.aGone && gd.bGone && gd.cls === 'c1' && gd.last && gd.last.to === 'c1' && gd.last.by === 'Demo Owner', JSON.stringify(gd));
  const gd2 = await page.evaluate(async () => {
    const wait = async (f) => { for (let i = 0; i < 50 && !f(); i++) await new Promise((r) => setTimeout(r, 100)); };
    const b = await db.collection('classes').add({ name: 'Old page group', school: SCHOOLS[0].id, n: Date.now() });
    await wait(() => classes.some((c) => c.id === b.id));
    await moveStudent(allStudents.find((s) => s.id === 's3'), b.id); await wait(() => allStudents.find((s) => s.id === 's3').cls === b.id);
    go({ name: 'classes' }); await new Promise((r) => setTimeout(r, 300));
    const f = document.querySelector(`form[data-id="${b.id}"]`); f.querySelector('.gdel').open = true; f.querySelector('[data-gmv]').value = 'c1';
    const bt = f.querySelector('[data-gdel]'); bt.click(); bt.click(); await wait(() => !classes.some((c) => c.id === b.id));
    return { gone: !classes.some((c) => c.id === b.id), cls: allStudents.find((s) => s.id === 's3').cls, view: view.name };
  });
  ok('Settings › Classes also deletes a group with students, after moving them', gd2.gone && gd2.cls === 'c1', JSON.stringify(gd2));
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

  // substitute access saved the old way (random id) is moved to access/<cid>_<tid>, where the security rules look
  await page.evaluate(async () => { await (await claude.use('db')).collection('access').add({ cid: 'c1', tid: 't3', kind: 'always', from: '2026-01-01', until: '2026-01-01', at: 1 }); render(true); });
  await page.waitForFunction(() => ACCESS.length === 1 && ACCESS[0].id === 'c1_t3', null, { timeout: 8000 }).catch(() => {});
  ok('old substitute access records move to their fixed id', await page.evaluate(() => ACCESS.length === 1 && ACCESS[0].id === 'c1_t3' && ACCESS[0].kind === 'always'), await page.evaluate(() => JSON.stringify(ACCESS)));
  // a second grant for the same teacher and group extends the first instead of replacing it
  const grants = await page.evaluate(async () => {
    const wait = (f) => new Promise((r) => { const t = setInterval(() => { if (f()) { clearInterval(t); r(); } }, 50); });
    const d0 = iso(today()), d3 = iso(addDays(today(), 3)), d6 = iso(addDays(today(), 6)), out = [];
    await (await claude.use('db')).doc('access/c1_t3').delete(); await wait(() => !ACCESS.length);
    await grantAccess({ cid: 'c1', tid: 't3', kind: 'day', from: d3, until: d3 }); await wait(() => ACCESS.length === 1);
    await grantAccess({ cid: 'c1', tid: 't3', kind: 'day', from: d0, until: d0 }); await wait(() => ACCESS[0].from === d0);
    out.push(ACCESS[0].kind === 'until' && ACCESS[0].from === d0 && ACCESS[0].until === d3 && accessActive(ACCESS[0], d0) && accessActive(ACCESS[0], d3));
    await grantAccess({ cid: 'c1', tid: 't3', kind: 'always', from: d0, until: d0 }); await wait(() => ACCESS[0].kind === 'always');
    await grantAccess({ cid: 'c1', tid: 't3', kind: 'day', from: d6, until: d6 }); await new Promise((r) => setTimeout(r, 200));
    out.push(ACCESS.length === 1 && ACCESS[0].kind === 'always');
    await (await claude.use('db')).doc('access/c1_t3').delete();
    return out;
  });
  ok('a second substitute grant extends the first; "always" stays always', grants.every(Boolean), JSON.stringify(grants));

  // view as teacher
  await reloadBy(() => page.selectOption('#hifzDemoRole', 'teacher'));
  await ready();
  ok('view as teacher gives teacher mode', await page.evaluate(() => document.body.classList.contains('sub') && meTeacher() && meTeacher().id === 't2'));
  await page.evaluate(() => { localStorage.removeItem('hifz.cls'); go({ name: 'list' }); });
  await page.waitForSelector('.slist .row');
  ok('a teacher starts on their own class in Students', await page.evaluate(() => document.querySelectorAll('.slist .row').length === 3 && document.querySelector('[data-cls].on').dataset.cls === 'c1'));
  // a teacher changes a student's surahs in "Edit details" (only in their own groups, only the surahs)
  const sids = await page.evaluate(() => ({ mine: students.find((s) => isMyCls(s.cls)).id, other: students.find((s) => !isMyCls(s.cls)).id }));
  await page.evaluate((id) => go({ name: 'student', id }), sids.other);
  await page.waitForSelector('#editBtn', { state: 'attached' });
  const otherEd = await page.evaluate((id) => { const hid = getComputedStyle(document.getElementById('editBtn')).display === 'none'; go({ name: 'edit', id }); return { hid, view: view.name }; }, sids.other);
  ok('a teacher cannot edit a student in another group', otherEd.hid && otherEd.view !== 'edit', JSON.stringify(otherEd));
  await page.evaluate((id) => go({ name: 'student', id }), sids.mine);
  await page.click('#sMore > summary');
  await page.click('#editBtn');
  await page.waitForSelector('#fForm');
  const pick = await page.evaluate(() => { const b = [...document.querySelectorAll('.prevgrid input[data-ps]')].find((i) => !i.checked); return { s: b && Number(b.dataset.ps), nameOff: document.getElementById('f_name').disabled, amtOff: document.getElementById('f_amount').disabled, surahOn: !document.getElementById('f_surah').disabled }; });
  ok('a teacher edits only the surahs of their own student', pick.s != null && pick.nameOff && pick.amtOff && pick.surahOn, JSON.stringify(pick));
  await page.evaluate(() => { document.querySelector('.prevbox').open = true; });
  await page.check(`.prevgrid input[data-ps="${pick.s}"]`);
  await page.click('#fForm button[type="submit"]');
  await page.waitForFunction(() => view.name === 'student', null, { timeout: 10000 }).catch(() => {});
  if (await page.evaluate(() => view.name === 'edit')) { await page.click('#fForm button[type="submit"]'); await page.waitForFunction(() => view.name === 'student', null, { timeout: 10000 }); }
  ok("the teacher's surah change is saved", await page.evaluate(({ id, s }) => (allStudents.find((x) => x.id === id).prevS || []).includes(s), { id: sids.mine, s: pick.s }));
  ok('a teacher finds "Suggest moving to another group" in the More menu, not Move student', await page.evaluate(() => { const b = document.querySelector('#sMore .smenu #mvBox'); return !!b && /Suggest moving/.test(b.textContent) && !!document.querySelector('#rqGo') && !document.querySelector('#mvGo'); }));
  await page.evaluate(() => go({ name: 'list' }));
  await page.waitForSelector('.slist .row');
  ok('a teacher sees only their own groups and Whole school as tabs', await page.evaluate(() => JSON.stringify([...document.querySelectorAll('[data-cls]')].map((b) => b.dataset.cls)) === '["c1","school"]' && !document.querySelector('#schSw')));
  await page.click('[data-cls="school"]');
  await page.waitForFunction(() => document.querySelectorAll('.slist .row').length === 6);
  ok('Whole school lists every student, none greyed out', await page.evaluate(() => document.querySelectorAll('.slist .row.ro').length === 0 && /whole school/.test(document.querySelector('#sub').textContent)));
  await page.fill('#srch', 'Fat');
  await page.waitForTimeout(200);
  ok('search on Whole school finds a student of another group', await page.evaluate(() => [...document.querySelectorAll('.slist .row')].filter((r) => r.offsetParent).map((r) => r.querySelector('.name').textContent.trim()).join() === 'Fatima'));
  await reloadBy(() => page.reload());
  await ready();
  await page.evaluate(() => go({ name: 'list' }));
  await page.waitForSelector('.slist .row');
  ok('the Students page opens on their own group again after a reload', await page.evaluate(() => document.querySelector('[data-cls].on').dataset.cls === 'c1'));
  // covering: Bilal opens Khalid's student Fatima (Teens class)
  await page.evaluate(() => go({ name: 'student', id: 's4' }));
  await page.waitForSelector('#sesBtn');
  ok('a teacher can record for a student of another group in their school', await page.evaluate(() => canEditSid('s4') && !document.querySelector('#view').classList.contains('ro') && !!document.querySelector('#sesBtn').offsetParent));
  ok('parents\' details are hidden outside their own groups', await page.evaluate(() => !document.querySelector('#waBtn') && (go({ name: 'wa', id: 's4' }), view.name === 'student')));
  ok('the session shows it was recorded by Bilal covering', await page.evaluate(() => { go({ name: 'history', id: 's4' }); return document.querySelector('#view').textContent.includes('recorded by Bilal (covering)'); }));
  ok('their own student shows the parent message and no "covering"', await page.evaluate(() => {
    go({ name: 'student', id: 's1' }); const wa = !!document.querySelector('#waBtn');
    go({ name: 'history', id: 's1' }); const t = document.querySelector('#view').textContent;
    return wa && t.includes('recorded by Bilal') && !t.includes('(covering)');
  }));
  ok('automatic absences run only for their own groups', await page.evaluate(() => tchMode() && isMyCls('c1') && !isMyCls('c2') && canEditCls('c2')));
  ok('a teacher cannot open the teachers\' contact pages', await page.evaluate(() => { go({ name: 'teacher', id: 't3' }); return view.name === 'list'; }));
  // a teacher without a group of their own
  await page.evaluate(async () => { await (await claude.use('db')).doc('classes/c1').update({ teacher: '' }); });
  await page.waitForFunction(() => !classes.find((c) => c.id === 'c1').teacher);
  await page.evaluate(() => go({ name: 'list' }));
  ok('a teacher with no group is told to ask the head teacher', await page.evaluate(() => !!document.querySelector('#noClsMsg') && JSON.stringify([...document.querySelectorAll('[data-cls]')].map((b) => b.dataset.cls)) === '["school"]' && document.querySelectorAll('.slist .row').length === 6));
  await page.evaluate(async () => { await (await claude.use('db')).doc('classes/c1').update({ teacher: 't2' }); });
  await page.waitForFunction(() => classes.find((c) => c.id === 'c1').teacher === 't2');
  await page.evaluate(() => go({ name: 'list' }));
  // a teacher adds a student, only into a group they teach
  await page.click('#topActions button.primary:has-text("Add student")');
  await page.waitForSelector('#fForm');
  const tOpts = await page.evaluate(() => ({ shown: [...document.querySelectorAll('#f_cls option')].map((o) => o.value), mine: myMainCls().map((c) => c.id), all: classes.length }));
  ok('a teacher can only add a student to their own groups', JSON.stringify(tOpts.shown) === JSON.stringify([...tOpts.mine, '__new']) && tOpts.mine.length > 0 && tOpts.all > tOpts.mine.length, JSON.stringify(tOpts));
  await page.fill('#f_name', 'Zaid New');
  await page.click('#fForm button[type="submit"]');
  await page.waitForFunction(() => view.name === 'student' && students.some((s) => s.name === 'Zaid New'), null, { timeout: 10000 });
  ok('a teacher adds a student to their group', await page.evaluate(() => { const s = students.find((x) => x.name === 'Zaid New'); return s && myMainCls().some((c) => c.id === s.cls) && !s.archived; }));
  await page.evaluate(async () => { const s = students.find((x) => x.name === 'Zaid New'); await (await claude.use('db')).doc('students/' + s.id).delete(); });
  // ... or starts a new group of their own while adding the student
  await page.evaluate(() => go({ name: 'add' }));
  await page.waitForSelector('#fForm');
  await page.selectOption('#f_cls', '__new');
  await page.fill('#f_name', 'Hamza New');
  await page.click('#fForm button[type="submit"]');
  ok('a new group needs a name', await page.evaluate(() => document.querySelector('#f_msg').textContent === 'Write the group name.' && !classes.some((c) => c.name === 'Evening group')));
  await page.fill('#ng_name', 'Evening group');
  await page.check('#f_newg [data-ngd][value="1"]');
  await page.click('#fForm button[type="submit"]');
  await page.waitForFunction(() => view.name === 'student' && students.some((s) => s.name === 'Hamza New'), null, { timeout: 10000 });
  ok('a teacher starts a new group and adds the student to it', await page.evaluate(() => {
    const g = classes.find((c) => c.name === 'Evening group'), s = students.find((x) => x.name === 'Hamza New');
    return g && g.teacher === meTeacher().id && JSON.stringify(g.days) === '[1]' && s.cls === g.id && JSON.stringify(s.days) === '[6,0,1,2,3,4]';
  }));
  await page.evaluate(async () => { const d = await claude.use('db'), s = students.find((x) => x.name === 'Hamza New'); await d.doc('students/' + s.id).delete(); await d.doc('classes/' + s.cls).delete(); });
  await page.evaluate(() => { go({ name: 'reports' }); });
  await page.waitForSelector('.hubs');
  ok('a teacher does not see the school overview', !(await page.$('[data-hub="sover"]')));
  // suggestions: a teacher sends one from the header; only admins read them, in Settings
  await page.click('#fbTop');
  await page.click('[data-fbk="problem"]');
  await page.fill('#fbText', 'Test problem from Bilal');
  await page.click('#fbSend');
  await page.waitForSelector('#fbAgain');
  ok('a teacher sends a problem with 💬 Suggest', await page.evaluate(async () => {
    const s = await (await claude.use('db')).collection('feedback').get();
    return s.docs.some((d) => { const f = d.data(); return f.text === 'Test problem from Bilal' && f.kind === 'problem' && f.by === 'Bilal' && f.email === 'bilal@demo.school' && f.status === 'new' && !f.to; });
  }));
  await page.click('#fbAgain');
  await page.check('#fbAnon');
  await page.fill('#fbText', 'Anonymous idea');
  await page.click('#fbSend');
  await page.waitForSelector('#fbAgain');
  ok('a teacher can send without their name', await page.evaluate(async () => {
    const s = await (await claude.use('db')).collection('feedback').get();
    return s.docs.some((d) => { const f = d.data(); return f.text === 'Anonymous idea' && f.anon === true && f.by === '' && f.email === ''; });
  }));
  ok('a teacher does not load the suggestions', await page.evaluate(() => FEEDBACK.length === 0 && !document.querySelector('#nav .fbdot')));
  await reloadBy(() => page.selectOption('#hifzDemoRole', 'owner'));
  await ready();
  await page.evaluate(() => go({ name: 'settings' }));
  await page.waitForSelector('[data-hub="inbox"]');
  ok('settings shows the number of new suggestions', /4 new/.test(await page.textContent('[data-hub="inbox"]')) && (await page.textContent('#nav .fbdot')) === '4');
  await page.click('[data-hub="inbox"]');
  await page.waitForSelector('.fbrow');
  ok('the admin reads the message from the teacher', (await page.textContent('#view')).includes('Test problem from Bilal'));
  ok('a message without a name shows as Anonymous', await page.evaluate(() => [...document.querySelectorAll('.fbrow')].some((r) => r.textContent.includes('Anonymous idea') && r.textContent.includes('Anonymous') && !r.textContent.includes('bilal@'))));
  await page.click('.fbrow [data-v="done"]');
  await page.waitForFunction(() => document.querySelectorAll('.fbrow').length === 3);
  ok('marking a message done takes it off the new list', await page.evaluate(() => fbNew() === 3));
  await page.fill('#fbMailIn', 'head@demo.school');
  await page.click('#fbMailSave');
  await page.waitForFunction(() => (settings.main || {}).feedbackEmail === 'head@demo.school');
  await page.waitForTimeout(300);
  ok('after saving the email address, the page says it is saved and shows the address', await page.evaluate(() => /Saved/.test(document.querySelector('#fbMailMsg').textContent) && document.querySelector('#fbMailBox').open && document.querySelector('#fbMailBox').textContent.includes('Emails go to: head@demo.school')));
  await page.evaluate(() => go({ name: 'feedback' }));
  await page.fill('#fbText', 'Emailed idea');
  await page.click('#fbSend');
  await page.waitForSelector('#fbAgain');
  // the inbox list updates a moment after saving, so wait for the new message to arrive in it
  const emailed = await page.waitForFunction(() => FEEDBACK.find((x) => x.text === 'Emailed idea'), null, { timeout: 5000 })
    .then((h) => h.jsonValue()).catch(() => null);
  ok('with an email address set, a new message carries the email for the extension',
    !!emailed && emailed.to === 'head@demo.school' && /suggestion from Demo Owner/.test(emailed.message.subject) && emailed.message.text.includes('Emailed idea'),
    JSON.stringify(emailed));

  // HTML written into a record (by a teacher, outside the app) is shown as text and never runs
  const XSS = '"><img src=x onerror="window.__xss=1">';
  await page.evaluate(async (x) => {
    const db = await claude.use('db');
    await db.doc('students/s1').update({ id: x });
    await db.collection('events').add({ sid: 's1', type: 'test', date: '2026-01-05', juz: x, result: 'pass', mistakes: x });
    await db.collection('events').add({ sid: 's1', type: 'monthly', date: '2026-01-06', score: x, places: [] });
  }, XSS);
  await page.waitForTimeout(300);
  await page.evaluate(() => { go({ name: 'list' }); });
  await page.waitForSelector('.slist .row');
  const rowId = await page.evaluate(() => students.find((s) => s.name === 'Yusuf Changed').id);
  await page.evaluate(() => { go({ name: 'student', id: 's1' }); });
  await page.waitForTimeout(500);
  ok('HTML in stored records is not run or inserted', rowId === 's1' && await page.evaluate(() => !window.__xss && !document.querySelector('img[src="x"]')));
  const csp = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]', 'content');
  // other script sources must be exact paths: a whole host (e.g. a CDN) would let injected HTML load a library that runs code
  ok('the page has a script Content-Security-Policy without whole-host sources', /script-src 'self' 'sha256-/.test(csp) && !/https:\/\/[^/\s;]+\/?(\s|;|$)/.test(csp), csp);

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
