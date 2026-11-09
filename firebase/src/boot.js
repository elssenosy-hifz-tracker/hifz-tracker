// Hifz Tracker on Firebase.
//
// The app was written for the Claude Artifact runtime: it calls claude.use("db" | "user" | "downloads").
// This module provides the same three objects on top of Firebase, and puts a sign-in gate in front of the
// app. The app code itself is unchanged: the build replaces its final `init();` with `HIFZ_BOOT(init);`.
//
//   db         collection(c).onSnapshot/add/get, doc("c/id").set/update/delete/get  -> Cloud Firestore
//   user       me(), canEdit(), isOwner()                                           -> Firebase Auth + members/<email>
//   downloads  save({filename, data: Blob})                                         -> browser download
//
// Who may use the app (enforced again by firestore.rules):
//   - owners (owners.json): full admin;
//   - everyone in the app's Teachers list with an email address. Owners and admins keep a members/<email>
//     document per teacher in sync with that list (see startMemberSync); the rules read it.

import { initializeApp } from 'firebase/app';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
} from 'firebase/auth';
import {
  initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager,
  memoryLocalCache, collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  FieldPath, terminate, clearIndexedDbPersistence,
} from 'firebase/firestore';
import { FIREBASE_CONFIG, OWNERS, USE_EMULATORS, EMULATOR_PROJECT } from './config.js';

const config = USE_EMULATORS
  ? { ...FIREBASE_CONFIG, projectId: EMULATOR_PROJECT, apiKey: 'demo-key', authDomain: location.host }
  : FIREBASE_CONFIG;
const app = initializeApp(config);
const auth = getAuth(app);
let leaving = false; // set while signing out (see signOutAndClear)
let fs;
try {
  fs = initializeFirestore(app, {
    localCache: USE_EMULATORS
      ? memoryLocalCache()
      : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (e) {
  console.warn('Offline cache unavailable, using memory cache', e);
  fs = initializeFirestore(app, { localCache: memoryLocalCache() });
}
if (USE_EMULATORS) {
  connectAuthEmulator(auth, `http://${location.hostname}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(fs, location.hostname, 8080);
}

// ---------- data encoding ----------
// The Claude store kept plain JSON. Firestore differs in two ways, both handled here so the app never notices:
//  1. it rejects `undefined` and functions: values go through a JSON round trip first, exactly like before;
//  2. it cannot store an array directly inside an array: inner arrays are stored as {__a: [...]} and unwrapped on read.
const plain = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const enc = (v) => {
  if (Array.isArray(v)) return v.map((x) => (Array.isArray(x) ? { __a: enc(x) } : enc(x)));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, enc(x)]));
  return v;
};
const dec = (v) => {
  if (Array.isArray(v)) return v.map(dec);
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (keys.length === 1 && keys[0] === '__a' && Array.isArray(v.__a)) return dec(v.__a);
    return Object.fromEntries(keys.map((k) => [k, dec(v[k])]));
  }
  return v;
};
export const _codec = { plain, enc, dec }; // for tests

const wrapDoc = (d) => ({ id: d.id, exists: d.exists(), data: () => (d.exists() ? dec(d.data()) : undefined) });
const wrapSnap = (s) => ({ docs: s.docs.map(wrapDoc), size: s.size, empty: s.empty });

function docApi(path) {
  const ref = doc(fs, path);
  return {
    id: ref.id,
    set: async (d) => { await setDoc(ref, enc(plain(d))); },
    // Top-level keys are field names, never dotted paths (FieldPath keeps "a.b" as one field), like the old store.
    update: async (d) => {
      const entries = Object.entries(plain(d) || {});
      if (!entries.length) return;
      const args = entries.flatMap(([k, v]) => [new FieldPath(k), enc(v)]);
      await updateDoc(ref, ...args);
    },
    delete: async () => { await deleteDoc(ref); },
    get: async () => wrapDoc(await getDoc(ref)),
  };
}

const dbApi = {
  collection: (c) => ({
    onSnapshot: (next, error) =>
      onSnapshot(collection(fs, c), (s) => next(wrapSnap(s)), (e) => {
        if (!auth.currentUser || leaving) return; // signing out: listeners lose access just before the page reloads
        console.error(`Listening to "${c}" failed:`, e);
        if (error) error(e);
      }),
    add: async (d) => { const r = await addDoc(collection(fs, c), enc(plain(d))); return { id: r.id }; },
    get: async () => wrapSnap(await getDocs(collection(fs, c))),
    doc: (id) => docApi(`${c}/${id}`),
  }),
  doc: (path) => docApi(path),
};

const downloadsApi = {
  save: async ({ filename, data }) => {
    const url = URL.createObjectURL(data);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'download' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};

// ---------- members sync (owners and admins) ----------
// Mirrors the Teachers list into members/<email> so the security rules can look people up by their sign-in email.
function startMemberSync() {
  let teachers = null;
  let members = null;
  let timer = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(reconcile, 400); };
  onSnapshot(collection(fs, 'teachers'), (s) => { teachers = s.docs.map((d) => ({ ...dec(d.data()), id: d.id })); schedule(); },
    (e) => auth.currentUser && !leaving && console.error('members sync: teachers', e));
  onSnapshot(collection(fs, 'members'), (s) => { members = Object.fromEntries(s.docs.map((d) => [d.id, d.data()])); schedule(); },
    (e) => auth.currentUser && !leaving && console.error('members sync: members', e));
  function reconcile() {
    if (!teachers || !members) return;
    const want = {};
    for (const t of teachers) {
      const email = String(t.email || '').trim().toLowerCase();
      if (!email.includes('@') || email.includes('/')) continue;
      const m = {
        tid: t.id,
        role: ['admin', 'teacher', 'supervisor'].includes(t.role) ? t.role : 'teacher',
        active: t.active !== false,
      };
      if (!want[email] || (!want[email].active && m.active)) want[email] = m; // an active record wins over an old one
    }
    for (const [email, m] of Object.entries(want)) {
      const have = members[email];
      if (!have || have.tid !== m.tid || have.role !== m.role || have.active !== m.active)
        setDoc(doc(fs, 'members', email), m).catch((e) => console.error('members sync: write', email, e));
    }
    for (const email of Object.keys(members))
      if (!want[email]) deleteDoc(doc(fs, 'members', email)).catch((e) => console.error('members sync: delete', email, e));
  }
}

// ---------- sign-in gate ----------
const EMAIL_KEY = 'hifzSignInEmail';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} },
  del: (k) => { try { localStorage.removeItem(k); } catch (_) {} },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const CSS = `
#hifzGate{position:fixed;inset:0;z-index:9999;background:var(--bg,#F5F7F5);color:var(--fg,#1B2626);display:flex;align-items:center;justify-content:center;padding:24px 16px;overflow:auto}
#hifzGate .card{width:100%;max-width:400px;background:var(--surface,#fff);border:1px solid var(--line,#DCE3E0);border-radius:14px;padding:28px 24px;display:flex;flex-direction:column;gap:14px}
#hifzGate h1{font-family:var(--display,serif);font-size:28px;margin:0}
#hifzGate p{margin:0}
#hifzGate .muted{color:var(--muted,#5C6B69);font-size:14px}
#hifzGate button,#hifzGate input{font:inherit;font-size:15px;border-radius:10px;padding:11px 14px;border:1px solid var(--line,#DCE3E0);width:100%}
#hifzGate input{background:var(--bg,#F5F7F5);color:inherit}
#hifzGate button{cursor:pointer;background:var(--surface,#fff);color:inherit;font-weight:600}
#hifzGate button.primary{background:var(--accent,#0D6B5E);border-color:var(--accent,#0D6B5E);color:#fff}
#hifzGate button:disabled{opacity:.6;cursor:default}
#hifzGate .or{display:flex;align-items:center;gap:10px;color:var(--muted,#5C6B69);font-size:13px}
#hifzGate .or::before,#hifzGate .or::after{content:"";flex:1;height:1px;background:var(--line,#DCE3E0)}
#hifzGate .msg{font-size:14px;min-height:1.4em}
#hifzGate .msg.bad{color:var(--bad,#B3342B)} #hifzGate .msg.ok{color:var(--ok,#2E7D4F)}
#hifzGate form{display:flex;flex-direction:column;gap:10px;margin:0}
#hifzAcct{max-width:760px;margin:28px auto 0;font-size:13px;color:var(--muted,#5C6B69);display:flex;gap:10px;justify-content:center;flex-wrap:wrap;align-items:center}
#hifzAcct button{font:inherit;font-size:13px;background:none;border:0;color:var(--accent,#0D6B5E);text-decoration:underline;cursor:pointer;padding:0}
`;

let gate = null;
function showGate(html) {
  if (!gate) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
    gate = document.createElement('div');
    gate.id = 'hifzGate';
    document.body.append(gate);
  }
  gate.hidden = false;
  gate.innerHTML = `<div class="card">${html}</div>`;
  return gate;
}
function hideGate() { if (gate) gate.remove(); gate = null; }
// Signing out also removes this browser's offline copy of the school's records (shared phones). It cannot be removed
// while another tab still has the app open; then it goes at the next sign-out.
async function signOutAndClear() {
  leaving = true;
  try { await terminate(fs); await clearIndexedDbPersistence(fs); } catch (e) { console.warn('Offline copy not removed', e); }
  await signOut(auth);
}
const setMsg = (el, text, kind = '') => { const m = el.querySelector('.msg'); if (m) { m.textContent = text; m.className = `msg ${kind}`; } };

const AUTH_ERRORS = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/invalid-action-code': 'This sign-in link has already been used or has expired. Ask for a new one.',
  'auth/expired-action-code': 'This sign-in link has expired. Ask for a new one.',
  'auth/network-request-failed': 'No internet connection. Check the connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/quota-exceeded': 'Too many sign-in emails were sent today. Try Google sign-in, or try again tomorrow.',
  'auth/unauthorized-domain': 'This web address is not allowed to sign in. Tell the app owner.',
};
const authError = (e) => AUTH_ERRORS[e && e.code] || `Sign-in failed${e && e.code ? ` (${e.code})` : ''}. Try again.`;

function showSignIn(note = '') {
  const el = showGate(`
    <h1>Hifz Tracker</h1>
    <p class="muted">Sign in with the email address your school has on file for you.</p>
    <button class="primary" id="gGoogle">Sign in with Google</button>
    <div class="or">or</div>
    <form id="gEmailForm">
      <input type="email" id="gEmail" autocomplete="email" placeholder="you@example.com" required value="${esc(store.get(EMAIL_KEY) || '')}">
      <button type="submit" id="gSend">Email me a sign-in link</button>
    </form>
    <p class="msg">${esc(note)}</p>
    <p class="muted">If the Google button does nothing (for example inside WhatsApp), use the email link, or open this page in Chrome or Safari.</p>`);
  el.querySelector('#gGoogle').onclick = async (ev) => {
    ev.target.disabled = true;
    setMsg(el, '');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(e.code)) {
        try { await signInWithRedirect(auth, provider); return; } catch (e2) { e = e2; }
      }
      ev.target.disabled = false;
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) setMsg(el, authError(e), 'bad');
    }
  };
  el.querySelector('#gEmailForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const email = el.querySelector('#gEmail').value.trim();
    const btn = el.querySelector('#gSend');
    btn.disabled = true;
    setMsg(el, 'Sending…');
    try {
      await sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
      store.set(EMAIL_KEY, email);
      setMsg(el, `Sign-in link sent to ${email}. Open it on this device. Check the spam folder if it does not arrive in a minute.`, 'ok');
    } catch (e) {
      setMsg(el, authError(e), 'bad');
    }
    btn.disabled = false;
  };
}

async function finishEmailLink() {
  if (!isSignInWithEmailLink(auth, location.href)) return;
  const clean = () => history.replaceState(null, '', location.origin + location.pathname);
  let email = store.get(EMAIL_KEY);
  if (!email) {
    // Link opened on a different device or browser: ask which address it was sent to.
    email = await new Promise((resolve) => {
      const el = showGate(`
        <h1>Hifz Tracker</h1>
        <p class="muted">Confirm the email address this sign-in link was sent to.</p>
        <form id="gConfirm"><input type="email" id="gEmail" autocomplete="email" required placeholder="you@example.com">
        <button class="primary" type="submit">Continue</button></form><p class="msg"></p>`);
      el.querySelector('#gConfirm').onsubmit = (ev) => { ev.preventDefault(); resolve(el.querySelector('#gEmail').value.trim()); };
    });
  }
  showGate('<h1>Hifz Tracker</h1><p class="muted">Signing in…</p>');
  try {
    await signInWithEmailLink(auth, email, location.href);
    store.set(EMAIL_KEY, email);
    clean();
  } catch (e) {
    clean();
    showSignIn(authError(e));
    throw e;
  }
}

function showNoAccess(user, reason) {
  const el = showGate(`
    <h1>Hifz Tracker</h1>
    <p>${reason}</p>
    <p class="muted">Signed in as <b>${esc(user.email || 'unknown')}</b>.</p>
    <button id="gRetry" class="primary">Try again</button>
    <button id="gOut">Use a different account</button>`);
  el.querySelector('#gRetry').onclick = () => location.reload();
  el.querySelector('#gOut').onclick = signOutAndClear;
}

function showAccount(user, roleLabel) {
  const bar = document.createElement('div');
  bar.id = 'hifzAcct';
  bar.innerHTML = `<span>Signed in as <b>${esc(user.email)}</b> (${esc(roleLabel)})</span><button type="button">Sign out</button>`;
  bar.querySelector('button').onclick = signOutAndClear;
  (document.getElementById('app') || document.body).after(bar);
}

// ---------- boot ----------
let started = false;
window.HIFZ_BOOT = function boot(init) {
  showGate('<h1>Hifz Tracker</h1><p class="muted">Loading…</p>');
  getRedirectResult(auth).catch((e) => showSignIn(authError(e)));
  finishEmailLink().catch(() => {});

  onAuthStateChanged(auth, async (user) => {
    if (started) { location.reload(); return; } // signed out (or switched account) after the app started
    if (!user) { if (!isSignInWithEmailLink(auth, location.href)) showSignIn(); return; }

    const email = String(user.email || '').toLowerCase();
    if (!email || !user.emailVerified) {
      showNoAccess(user, 'This account has no verified email address. Sign in with Google or with an email link instead.');
      return;
    }
    const isOwner = OWNERS.includes(email);
    let member = null;
    if (!isOwner) {
      showGate('<h1>Hifz Tracker</h1><p class="muted">Checking your access…</p>');
      try {
        const snap = await getDoc(doc(fs, 'members', email));
        member = snap.exists() ? snap.data() : null;
      } catch (e) {
        console.error('Access check failed', e);
        showNoAccess(user, 'Your access could not be checked. Check the internet connection and try again.');
        return;
      }
      if (!member || member.active === false) {
        showNoAccess(user, member
          ? 'Your teacher account is switched off. Ask the school admin to switch it back on.'
          : 'You do not have access yet. Ask the school admin to add this email address to your teacher record in the app (School → Teachers).');
        return;
      }
    }

    const role = isOwner ? 'owner' : member.role;
    const canEdit = isOwner || role === 'admin';
    const userApi = {
      me: async () => ({
        id: user.uid, email, name: user.displayName || '', avatarUrl: user.photoURL || '', color: '#888', isOwner,
      }),
      canEdit: async () => canEdit,
      isOwner: async () => isOwner,
    };
    window.claude = { use: async (n) => ({ db: dbApi, downloads: downloadsApi, user: userApi })[n] || null };
    if (canEdit) startMemberSync();

    started = true;
    hideGate();
    showAccount(user, { owner: 'owner', admin: 'admin', teacher: 'teacher', supervisor: 'supervisor' }[role] || role);
    init();
  });
};
