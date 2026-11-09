// Demo mode: the app with made-up sample data, kept in this browser only.
//
// Used for pull-request previews (hifz-tracker-demo.web.app) and local development (`npm run dev`).
// It gives the app the same claude.use("db" | "user" | "downloads") objects as boot.js, but backed by an
// in-memory store saved to localStorage. There is NO Firebase code here: a demo build cannot read or
// change the real school's data. build_firebase.py --demo checks the output for Firebase endpoints.
//
// The banner at the top says it is a preview, lets you view the app as each role, and resets the sample data.

import { sampleData, DEMO_USERS } from './sample-data.js';

window.HIFZ_DEMO = true;
const KEY = 'hifzDemo.v1';
const ROLE_KEY = 'hifzDemo.role';
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} },
  del: (k) => { try { localStorage.removeItem(k); } catch (_) {} },
};

let store;
try { store = JSON.parse(ls.get(KEY)) || null; } catch (_) { store = null; }
if (!store || typeof store !== 'object') store = sampleData();

let saveTimer = null;
const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => ls.set(KEY, JSON.stringify(store)), 150); };
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); ls.set(KEY, JSON.stringify(store)); });

// Same value rules as the real store: plain JSON (undefined dropped), copies in and out.
const plain = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const coll = (c) => store[c] || (store[c] = {});
const listeners = {};
const snap = (c) => {
  const docs = Object.entries(coll(c)).map(([id, d]) => ({ id, exists: true, data: () => plain(d) }));
  return { docs, size: docs.length, empty: !docs.length };
};
const notify = (c) => { save(); setTimeout(() => (listeners[c] || []).forEach((f) => f(snap(c))), 0); };
let nextId = Date.now();
const newId = () => `d${(nextId++).toString(36)}`;

function docApi(path) {
  const i = path.indexOf('/');
  const c = path.slice(0, i);
  const id = path.slice(i + 1);
  return {
    id,
    set: async (d) => { coll(c)[id] = plain(d); notify(c); },
    update: async (d) => {
      if (!coll(c)[id]) throw Object.assign(new Error(`No document to update: ${path}`), { code: 'not-found' });
      Object.assign(coll(c)[id], plain(d)); // top-level keys replace whole fields, like Firestore with FieldPath
      notify(c);
    },
    delete: async () => { delete coll(c)[id]; notify(c); },
    get: async () => ({ id, exists: !!coll(c)[id], data: () => (coll(c)[id] ? plain(coll(c)[id]) : undefined) }),
  };
}

const dbApi = {
  collection: (c) => ({
    onSnapshot: (next) => {
      const list = listeners[c] || (listeners[c] = []);
      list.push(next);
      setTimeout(() => next(snap(c)), 0);
      return () => { const k = list.indexOf(next); if (k >= 0) list.splice(k, 1); };
    },
    add: async (d) => { const id = newId(); coll(c)[id] = plain(d); notify(c); return { id }; },
    get: async () => snap(c),
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

// each preview link is a new site to the browser, so the first-visit tour would show every time; Help still shows it,
// and ?tour shows it as a new device would
if (!new URLSearchParams(location.search).has('tour')) ls.set('hifz.tour', '1');

const urlRole = new URLSearchParams(location.search).get('as');
const roleId = DEMO_USERS[urlRole] ? urlRole : DEMO_USERS[ls.get(ROLE_KEY)] ? ls.get(ROLE_KEY) : 'owner';
const me = DEMO_USERS[roleId];
const userApi = {
  me: async () => ({ id: me.id, email: me.email, name: me.name, avatarUrl: '', color: '#888', isOwner: me.isOwner }),
  canEdit: async () => me.canEdit,
  isOwner: async () => me.isOwner,
};

function showBanner() {
  const style = document.createElement('style');
  style.textContent = `
#hifzDemo{background:#7A4B00;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:8px 16px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;text-align:center}
#hifzDemo b{font-weight:700}
#hifzDemo label{color:#fff;display:inline-flex;gap:6px;align-items:center;margin:0;font-size:14px;font-weight:400}
#hifzDemo select,#hifzDemo button{font:inherit;font-size:13px;border-radius:8px;border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.15);color:#fff;padding:4px 8px;cursor:pointer}
#hifzDemo option{color:#000}`;
  document.head.append(style);
  const bar = document.createElement('div');
  bar.id = 'hifzDemo';
  bar.innerHTML = `<span><b>Preview</b> with made-up sample data. Nothing here touches the real school.</span>
    <label>View as <select id="hifzDemoRole">${Object.entries(DEMO_USERS)
    .map(([k, u]) => `<option value="${k}"${k === roleId ? ' selected' : ''}>${u.label}</option>`).join('')}</select></label>
    <button type="button" id="hifzDemoReset">Reset sample data</button>`;
  document.body.prepend(bar);
  bar.querySelector('#hifzDemoRole').onchange = (ev) => {
    ls.set(ROLE_KEY, ev.target.value);
    const u = new URL(location.href);
    u.searchParams.delete('as');
    location.replace(u);
  };
  bar.querySelector('#hifzDemoReset').onclick = () => {
    if (!confirm('Put the sample data back the way it started? Changes made in this preview are lost.')) return;
    clearTimeout(saveTimer);
    store = sampleData(); // the pagehide save then writes the fresh sample data
    ls.set(KEY, JSON.stringify(store));
    location.reload();
  };
}

window.HIFZ_BOOT = function boot(init) {
  window.claude = { use: async (n) => ({ db: dbApi, downloads: downloadsApi, user: userApi })[n] || null };
  showBanner();
  init();
};
