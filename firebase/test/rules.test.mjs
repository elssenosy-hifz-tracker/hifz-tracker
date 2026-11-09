// Security rules tests. Run from firebase/:  npm run test:rules   (starts the Firestore emulator; needs Java 11+)
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';

const RULES = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
const OWNERS = JSON.parse(readFileSync(new URL('../owners.json', import.meta.url), 'utf8')).owners;
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-hifz',
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'students/s1'), { name: 'Yusuf', cls: 'c1' });
    await setDoc(doc(db, 'students/s2'), { name: 'Omar', cls: 'c2' });
    await setDoc(doc(db, 'classes/c1'), { name: 'Group 1', teacher: 't1' });
    await setDoc(doc(db, 'classes/c2'), { name: 'Group 2', teacher: 't5' });
    await setDoc(doc(db, 'events/own'), { sid: 's1', type: 'session' });
    await setDoc(doc(db, 'events/other'), { sid: 's2', type: 'session' });
    await setDoc(doc(db, 'teachers/t1'), { name: 'Bilal', role: 'teacher', email: 'bilal@example.com', active: true });
    await setDoc(doc(db, 'members/bilal@example.com'), { tid: 't1', role: 'teacher', active: true });
    await setDoc(doc(db, 'members/sami@example.com'), { tid: 't2', role: 'supervisor', active: true });
    await setDoc(doc(db, 'members/aisha@example.com'), { tid: 't3', role: 'admin', active: true });
    await setDoc(doc(db, 'members/old@example.com'), { tid: 't4', role: 'teacher', active: false });
  });
});

const as = (email, verified = true) =>
  env.authenticatedContext(email.replace(/\W/g, '_'), { email, email_verified: verified }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('owner list in the rules matches firebase/owners.json', () => {
  const m = RULES.match(/function owners\(\)\s*\{\s*return\s*\[([^\]]*)\]/);
  const inRules = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
  assert.deepEqual(inRules, OWNERS.map((e) => e.toLowerCase()).sort());
});

test('signed-out visitors get nothing', async () => {
  await assertFails(getDoc(doc(anon(), 'students/s1')));
  await assertFails(setDoc(doc(anon(), 'students/x'), { name: 'x' }));
});

test('owners read and write everything, any email case', async () => {
  const db = as(OWNERS[0].toUpperCase());
  await assertSucceeds(getDoc(doc(db, 'students/s1')));
  await assertSucceeds(setDoc(doc(db, 'events/e1'), { sid: 's1' }));
  await assertSucceeds(setDoc(doc(db, 'teachers/t9'), { name: 'New', role: 'admin', email: 'n@example.com' }));
  await assertSucceeds(setDoc(doc(db, 'members/n@example.com'), { tid: 't9', role: 'admin', active: true }));
  await assertSucceeds(getDocs(collection(db, 'members')));
});

test('an unverified owner email is refused', async () => {
  await assertFails(getDoc(doc(as(OWNERS[0], false), 'students/s1')));
});

test('strangers are refused but may look up their own (missing) access entry', async () => {
  const db = as('stranger@example.com');
  await assertFails(getDoc(doc(db, 'students/s1')));
  await assertFails(getDocs(collection(db, 'students')));
  await assertSucceeds(getDoc(doc(db, 'members/stranger@example.com')));
  await assertFails(getDoc(doc(db, 'members/bilal@example.com')));
  await assertFails(setDoc(doc(db, 'members/stranger@example.com'), { role: 'admin', active: true, tid: 'x' }));
});

test('teachers read everything and record in their own group', async () => {
  const db = as('Bilal@Example.com');
  await assertSucceeds(getDocs(collection(db, 'students')));
  await assertSucceeds(setDoc(doc(db, 'events/e2'), { sid: 's1', type: 'session' }));
  await assertSucceeds(updateDoc(doc(db, 'events/e2'), { att: 'late' }));
  await assertSucceeds(deleteDoc(doc(db, 'events/e2')));
  await assertSucceeds(setDoc(doc(db, 'marks/m1'), { sid: 's1', w: 5, k: 'hifz' }));
  await assertSucceeds(updateDoc(doc(db, 'students/s1'), { pos: 10, fixed: ['a'], focus: null, tjp: {} }));
  await assertSucceeds(updateDoc(doc(db, 'students/s1'), { order: 'fatiha', startS: 0, prevS: [113, 112], prev: [], pos: 40, posLog: [{ at: 1, from: 10, to: 40, why: 'edit' }] }));
  await assertSucceeds(setDoc(doc(db, 'meetings/c1_2026-11-09'), { cls: 'c1', date: '2026-11-09', status: 'held' }));
  await assertSucceeds(setDoc(doc(db, 'events/a_s1_2026-11-09'), { sid: 's1', date: '2026-11-09', type: 'session', att: 'present' }));
  await assertSucceeds(updateDoc(doc(db, 'classes/c1'), { tajweed: { 0: '2026-11-09' } }));
  await assertSucceeds(setDoc(doc(db, 'groupnotes/c1'), { text: 'Page 20', by: 't1', at: 1 }));
  await assertSucceeds(setDoc(doc(db, 'access/c1_t6'), { cid: 'c1', tid: 't6', kind: 'day', from: '2026-11-09', until: '2026-11-09' }));
  await assertSucceeds(deleteDoc(doc(db, 'access/c1_t6')));
  await assertSucceeds(setDoc(doc(db, 'absences/a1'), { cid: 'c1', tid: 't1', date: '2026-11-10' }));
  await assertSucceeds(setDoc(doc(db, 'requests/r1'), { sid: 's1', from: 'c1', to: 'c2', status: 'open' }));
  await assertSucceeds(setDoc(doc(db, 'hours/t1_2026-11-09'), { tid: 't1', date: '2026-11-09', start: '09:00' }));
  await assertSucceeds(setDoc(doc(db, 'links/Bilal_Example_com'), { tid: 't1' }));
  await assertSucceeds(getDoc(doc(db, 'members/bilal@example.com')));
});

test('teachers cannot write in other groups or change the school setup', async () => {
  const db = as('bilal@example.com');
  await assertFails(setDoc(doc(db, 'events/e5'), { sid: 's2', type: 'session' }));
  await assertFails(updateDoc(doc(db, 'events/other'), { att: 'absent' }));
  await assertFails(deleteDoc(doc(db, 'events/other')));
  await assertFails(updateDoc(doc(db, 'events/own'), { sid: 's2' }));
  await assertFails(setDoc(doc(db, 'events/e6'), { type: 'session' }));
  await assertFails(setDoc(doc(db, 'marks/m2'), { sid: 's2', w: 5 }));
  await assertFails(updateDoc(doc(db, 'students/s2'), { pos: 10 }));
  await assertFails(updateDoc(doc(db, 'students/s2'), { prevS: [113] })); // another group's student
  await assertFails(updateDoc(doc(db, 'students/s1'), { prevS: [113], amount: 20 })); // surahs plus another detail
  await assertFails(updateDoc(doc(db, 'students/s1'), { prevS: 'all' }));
  await assertFails(updateDoc(doc(db, 'students/s1'), { name: 'Changed' }));
  await assertFails(updateDoc(doc(db, 'students/s1'), { cls: 'c2' }));
  await assertFails(setDoc(doc(db, 'students/s9'), { name: 'New', cls: 'c2' })); // a new student in another group
  await assertFails(setDoc(doc(db, 'students/s1'), { name: 'Someone else', cls: 'c1', pos: 0 })); // overwriting an existing student
  await assertFails(deleteDoc(doc(db, 'students/s1')));
  await assertFails(setDoc(doc(db, 'meetings/c2_2026-11-09'), { cls: 'c2', date: '2026-11-09' }));
  await assertFails(setDoc(doc(db, 'meetings/c2_2026-11-10'), { cls: 'c1', date: '2026-11-10' })); // another group's log id
  await assertFails(setDoc(doc(db, 'events/a_s2_2026-11-10'), { sid: 's1', date: '2026-11-10', type: 'session' })); // another student's attendance id
  await assertFails(updateDoc(doc(db, 'classes/c1'), { teacher: 't9' }));
  await assertFails(updateDoc(doc(db, 'classes/c2'), { tajweed: {} }));
  await assertFails(setDoc(doc(db, 'access/c2_t1'), { cid: 'c2', tid: 't1', kind: 'always' }));
  await assertFails(setDoc(doc(db, 'access/x1'), { cid: 'c1', tid: 't6', kind: 'always' }));
  await assertFails(setDoc(doc(db, 'absences/a2'), { cid: 'c2', tid: 't1' }));
  await assertFails(setDoc(doc(db, 'groupnotes/c2'), { text: 'x' }));
  await assertFails(setDoc(doc(db, 'hours/t5_2026-11-09'), { tid: 't5', date: '2026-11-09' }));
  await assertFails(setDoc(doc(db, 'links/Bilal_Example_com'), { tid: 't5' }));
  await assertFails(setDoc(doc(db, 'links/someone_else'), { tid: 't1' }));
  await assertFails(setDoc(doc(db, 'settings/main'), { school: { name: 'x' } }));
  await assertFails(setDoc(doc(db, 'fees/f1'), { sid: 's1' }));
  await assertFails(setDoc(doc(db, 'anything/x'), { a: 1 }));
});

test('teachers add new students only to a group they teach, with only the Add student fields', async () => {
  const db = as('bilal@example.com');
  const form = { name: 'Zaid', cls: 'c1', order: 'nas', startS: 113, prevS: [], prev: [], amount: 5, farDays: 30,
    readPages: 1, readStart: 1, readFrom: null, start: '2026-11-09', phone: '', days: [6, 0, 1], pos: 0, created: '2026-11-09' };
  await assertSucceeds(addDoc(collection(db, 'students'), form));
  await assertFails(addDoc(collection(db, 'students'), { ...form, cls: 'c2' }));
  await assertFails(addDoc(collection(db, 'students'), { ...form, cls: '' }));
  await assertFails(addDoc(collection(db, 'students'), { ...form, archived: true }));
  await assertFails(addDoc(collection(db, 'students'), { ...form, name: '' }));
  await assertFails(setDoc(doc(db, 'students/x"><b>'), form));
  // substitute access is for recording, not for adding students to someone else's group
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'access/c2_t1'), { cid: 'c2', tid: 't1', kind: 'always' }));
  await assertFails(addDoc(collection(db, 'students'), { ...form, cls: 'c2' }));
  // supervisors and inactive teachers add nobody
  await assertFails(addDoc(collection(as('sami@example.com'), 'students'), form));
  await assertFails(addDoc(collection(as('old@example.com'), 'students'), form));
});

test('teachers start new groups only as their own teacher, with only the new group fields', async () => {
  const db = as('bilal@example.com');
  const g = { name: 'Evening group', teacher: 't1', time: '17:00', end: '18:00', days: [6, 1], school: 'sch1', n: 1 };
  const ref = await assertSucceeds(addDoc(collection(db, 'classes'), g));
  // and then add a student into it
  await assertSucceeds(addDoc(collection(db, 'students'), { name: 'Zaid', cls: ref.id, pos: 0, days: [6] }));
  await assertFails(addDoc(collection(db, 'classes'), { ...g, teacher: 't5' }));
  await assertFails(addDoc(collection(db, 'classes'), { ...g, teacher: '' }));
  await assertFails(addDoc(collection(db, 'classes'), { ...g, name: '' }));
  await assertFails(addDoc(collection(db, 'classes'), { ...g, readDef: 5 }));
  await assertFails(setDoc(doc(db, 'classes/c2'), g)); // taking over an existing group
  await assertFails(updateDoc(doc(db, 'classes/c1'), { name: 'Renamed' }));
  await assertFails(deleteDoc(doc(db, 'classes/c1')));
  await assertFails(addDoc(collection(as('sami@example.com'), 'classes'), { ...g, teacher: 't2' }));
  await assertFails(addDoc(collection(as('old@example.com'), 'classes'), { ...g, teacher: 't4' }));
});

test('teachers cannot change access', async () => {
  const db = as('bilal@example.com');
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { phone: '+61400111222' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { role: 'admin' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { email: 'other@example.com' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { active: false }));
  await assertFails(setDoc(doc(db, 'teachers/t8'), { name: 'Fake', role: 'admin', email: 'x@example.com' }));
  await assertFails(deleteDoc(doc(db, 'teachers/t1')));
  await assertFails(setDoc(doc(db, 'members/bilal@example.com'), { tid: 't1', role: 'admin', active: true }));
  await assertFails(getDocs(collection(db, 'members')));
});

test('substitute access lets a teacher record in another group while it is active', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const grant = (d) => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'access/c2_t1'), { cid: 'c2', tid: 't1', ...d }));
  const db = as('bilal@example.com');
  await grant({ kind: 'day', from: today, until: today });
  await assertSucceeds(setDoc(doc(db, 'events/sub1'), { sid: 's2', type: 'session' }));
  await assertFails(setDoc(doc(db, 'access/c2_t6'), { cid: 'c2', tid: 't6', kind: 'day' })); // only the main teacher passes access on
  await grant({ kind: 'until', from: '2020-01-01', until: '2020-01-31' });
  await assertFails(setDoc(doc(db, 'events/sub2'), { sid: 's2', type: 'session' }));
  await grant({ kind: 'always', from: '2020-01-01', until: '2020-01-01' });
  await assertSucceeds(setDoc(doc(db, 'events/sub3'), { sid: 's2', type: 'session' }));
});

test('ids that could carry HTML are refused, even for owners', async () => {
  const db = as(OWNERS[0]);
  await assertFails(setDoc(doc(db, 'students/x"><img src=x>'), { name: 'x' }));
  await assertFails(setDoc(doc(db, 'students/s5'), { id: '"><img src=x>', name: 'x' }));
  await assertSucceeds(setDoc(doc(db, 'students/s5'), { id: 's5', name: 'x' }));
  await assertSucceeds(setDoc(doc(db, 'events/a_s1_2026-11-09'), { sid: 's1' }));
  await assertFails(updateDoc(doc(as('bilal@example.com'), 'events/own'), { id: 'other' }));
});

test('supervisors read but cannot write', async () => {
  const db = as('sami@example.com');
  await assertSucceeds(getDoc(doc(db, 'students/s1')));
  await assertFails(setDoc(doc(db, 'events/e3'), { sid: 's1' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { phone: '1' }));
  await assertFails(updateDoc(doc(db, 'students/s1'), { pos: 3 }));
});

test('admins manage teachers and access', async () => {
  const db = as('aisha@example.com');
  await assertSucceeds(setDoc(doc(db, 'teachers/t7'), { name: 'Khalid', role: 'teacher', email: 'k@example.com' }));
  await assertSucceeds(updateDoc(doc(db, 'teachers/t1'), { role: 'supervisor' }));
  await assertSucceeds(setDoc(doc(db, 'members/k@example.com'), { tid: 't7', role: 'teacher', active: true }));
  await assertSucceeds(deleteDoc(doc(db, 'members/old@example.com')));
  await assertSucceeds(setDoc(doc(db, 'settings/main'), { school: { name: 'Test' } }));
});

test('switched-off teachers are refused', async () => {
  const db = as('old@example.com');
  await assertFails(getDoc(doc(db, 'students/s1')));
  await assertFails(setDoc(doc(db, 'events/e4'), { sid: 's1' }));
});

test('everyone may send a suggestion in their own name; only admins read them', async () => {
  const msg = (email, extra = {}) => ({ kind: 'idea', text: 'More colours', by: 'X', email, page: 'today', at: '2026-01-01T00:00:00Z', date: '2026-01-01', status: 'new', ...extra });
  await assertSucceeds(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('bilal@example.com')));
  await assertSucceeds(addDoc(collection(as('sami@example.com'), 'feedback'), msg('sami@example.com', { kind: 'problem' })));
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('someone@example.com')));      // not in someone else's name
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('bilal@example.com', { status: 'done' })));
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('bilal@example.com', { extra: 1 })));
  await assertSucceeds(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('', { by: '', anon: true })));  // without a name
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('bilal@example.com', { anon: true })));
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('', { by: 'Bilal', anon: true })));
  await assertFails(addDoc(collection(as('bilal@example.com'), 'feedback'), msg('', { by: '' })));
  await assertFails(addDoc(collection(as('old@example.com'), 'feedback'), msg('old@example.com')));
  await assertFails(addDoc(collection(anon(), 'feedback'), msg('x@example.com')));
  await assertFails(getDocs(collection(as('bilal@example.com'), 'feedback')));
  await assertFails(getDocs(collection(as('sami@example.com'), 'feedback')));
  await assertSucceeds(getDocs(collection(as('aisha@example.com'), 'feedback')));
  await assertSucceeds(getDocs(collection(as(OWNERS[0]), 'feedback')));
});

test('a suggestion email copy may only go to the address the admins chose', async () => {
  const msg = (to) => ({ kind: 'problem', text: 'Broken', by: 'Bilal', email: 'bilal@example.com', page: '', at: '2026-01-01T00:00:00Z', date: '2026-01-01', status: 'new', to, message: { subject: 's', text: 't' } });
  const db = as('bilal@example.com');
  await assertFails(addDoc(collection(db, 'feedback'), msg('head@example.com')));                    // no address chosen yet
  await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'settings/main'), { feedbackEmail: 'head@example.com' }));
  await assertSucceeds(addDoc(collection(db, 'feedback'), msg('head@example.com')));
  await assertFails(addDoc(collection(db, 'feedback'), msg('anyone@example.com')));
  const { to, ...noTo } = msg('x'); // a message without "to" is not emailed and is refused
  await assertFails(addDoc(collection(db, 'feedback'), noTo));
  const admin = as('aisha@example.com');
  const r = await addDoc(collection(db, 'feedback'), msg('head@example.com'));
  await assertSucceeds(updateDoc(doc(admin, `feedback/${r.id}`), { status: 'done' }));
  await assertFails(updateDoc(doc(db, `feedback/${r.id}`), { status: 'done' }));
  await assertSucceeds(deleteDoc(doc(admin, `feedback/${r.id}`)));
});
