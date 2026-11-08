#!/usr/bin/env python3
"""Build the Firebase Hosting version.

  python3 build_firebase.py          # the real app      -> public/       (Firebase sign-in + Firestore)
  python3 build_firebase.py --demo   # demo with sample data -> public-demo/  (no Firebase at all; previews, local dev)
Usually run through npm in firebase/ (`npm run build`, `build:app`, `build:demo`), which finds Python on Windows too.

Steps:
  1. Bundle the data layer with esbuild and name it by content hash: fb-<hash>.js.
     Real app: firebase/src/boot.js. Demo: firebase/src/demo.js (in-browser store, sample data, preview banner).
  2. Build the normal single-file app with build_portable.py.
  3. Load the bundle in <head> and start the app through the sign-in gate: the final `init();` becomes `HIFZ_BOOT(init);`.

Needs `npm ci` in firebase/ once. Deploys happen in GitHub Actions (see AGENTS.md), not from here.
"""
import glob, hashlib, os, subprocess, sys

DEMO = '--demo' in sys.argv[1:]
R = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(R, 'public-demo' if DEMO else 'public')
os.makedirs(PUB, exist_ok=True)

# 1. Data layer
fb_tmp = os.path.join(PUB, 'fb.js')
if not os.path.isdir(os.path.join(R, 'firebase', 'node_modules', 'esbuild')):
    sys.exit('esbuild is missing: run `npm ci` in firebase/ first')
subprocess.run(['node', 'scripts/bundle.mjs', 'src/demo.js' if DEMO else 'src/boot.js', fb_tmp],
               cwd=os.path.join(R, 'firebase'), check=True)
code = open(fb_tmp, 'rb').read()
fb_name = 'fb-%s.js' % hashlib.sha256(code).hexdigest()[:10]
for old in glob.glob(os.path.join(PUB, 'fb-*.js')):
    os.remove(old)
os.replace(fb_tmp, os.path.join(PUB, fb_name))

# 2. App
app_tmp = os.path.join(PUB, '.app.html')
subprocess.run([sys.executable, os.path.join(R, 'build_portable.py'), app_tmp], check=True, stdout=subprocess.DEVNULL)
doc = open(app_tmp, encoding='utf8').read()
os.remove(app_tmp)

# 3. Wire them together
start_old, start_new = '\ninit();\n</script>', '\nHIFZ_BOOT(init);\n</script>'
assert doc.count(start_old) == 1, 'expected exactly one final init(); in the built app'
doc = doc.replace(start_old, start_new)
open(os.path.join(PUB, 'favicon.svg'), 'w', encoding='utf8', newline='\n').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0D6B5E"/>'
    '<path d="M14 18c7-3 13-2 18 2v28c-5-4-11-5-18-2zM50 18c-7-3-13-2-18 2v28c5-4 11-5 18-2z" fill="#fff"/></svg>')
head_tag = ('<link rel="icon" href="/favicon.svg" type="image/svg+xml">'
            '<meta name="description" content="Hifz Tracker: Quran memorisation classes, sessions, reviews and reports.">'
            '<meta name="theme-color" content="#0D6B5E">'
            '<script src="/%s"></script>' % fb_name)
head_end = doc.index('</head>')  # the page's own head comes first; later matches are inside print templates in the JS
assert head_end < doc.index('<body>')
doc = doc[:head_end] + head_tag + doc[head_end:]

# 4. Safety: a demo build must never contain Firebase, and the real build must never contain demo mode.
both = doc + code.decode('utf8')
if DEMO:
    bad = [x for x in ('firebaseapp.com', 'firestore.googleapis.com', 'identitytoolkit', 'securetoken', 'hifz-tracker-cd6d0', 'AIzaSy')
           if x in both]
    assert not bad, 'demo build contains Firebase code or config: %s' % bad
    assert 'HIFZ_DEMO' in both
else:
    assert 'HIFZ_DEMO' not in both, 'the real build contains demo mode'
    assert 'hifz-tracker-cd6d0' in both

out = os.path.join(PUB, 'index.html')
open(out, 'w', encoding='utf8', newline='\n').write(doc)
print(os.path.relpath(out, R), 'DEMO' if DEMO else 'REAL APP', round(len(doc.encode()) / 1e6, 2), 'MB;', fb_name, round(len(code) / 1e3), 'kB')
