// Security rules tests. Run from firebase/:  npm run test:rules   (starts the Firestore emulator; needs Java 11+)
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

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

test('teachers read everything and write class data', async () => {
  const db = as('Bilal@Example.com');
  await assertSucceeds(getDocs(collection(db, 'students')));
  await assertSucceeds(setDoc(doc(db, 'events/e2'), { sid: 's1', type: 'session' }));
  await assertSucceeds(updateDoc(doc(db, 'students/s1'), { pos: 10 }));
  await assertSucceeds(deleteDoc(doc(db, 'events/e2')));
  await assertSucceeds(getDoc(doc(db, 'members/bilal@example.com')));
});

test('teachers cannot change access', async () => {
  const db = as('bilal@example.com');
  await assertSucceeds(updateDoc(doc(db, 'teachers/t1'), { phone: '+61400111222' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { role: 'admin' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { email: 'other@example.com' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { active: false }));
  await assertFails(setDoc(doc(db, 'teachers/t8'), { name: 'Fake', role: 'admin', email: 'x@example.com' }));
  await assertFails(deleteDoc(doc(db, 'teachers/t1')));
  await assertFails(setDoc(doc(db, 'members/bilal@example.com'), { tid: 't1', role: 'admin', active: true }));
  await assertFails(getDocs(collection(db, 'members')));
});

test('supervisors read but cannot write', async () => {
  const db = as('sami@example.com');
  await assertSucceeds(getDoc(doc(db, 'students/s1')));
  await assertFails(setDoc(doc(db, 'events/e3'), { sid: 's1' }));
  await assertFails(updateDoc(doc(db, 'teachers/t1'), { phone: '1' }));
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
