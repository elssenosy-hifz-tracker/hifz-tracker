#!/usr/bin/env python3
"""Portable version of build-cloud.py: same steps, relative paths.
Usage:  python3 build_portable.py [output.html]   (default: dist/hifz-tracker-index.html)"""
import os, sys
R = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(R, p), encoding='utf8').read()
h = rd('head_en.html')
s = rd('app_en.js')
assert s.rstrip().endswith('init();')
m = rd('mushaf.js').replace('/*MUSDATA*/', rd('mushaf/mus.json')).replace('/*HAFSFONT*/', rd('mushaf/hafs.b64'))
hj = rd('heart.js').replace('/*HEARTVEC*/', rd('heart/heartvec.json'))
mods = ['guide.js','classrep.js','extras.js','more.js','quick.js','smart.js','goals.js','tarteel.js','tajweed.js','school.js','schools.js']
s = s.rstrip()[:-len('init();')] + m + '\n' + hj + '\n' + '\n'.join(rd(f) for f in mods) + '\ninit();\n'
js = s.replace('/*QDATA*/', rd('qdata.json'))
t = h.index('</style>') + len('</style>')
doc = ('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'
       + h[:t] + '</head><body>' + h[t:] + '<script>\n' + js + '</script>\n</body></html>')
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(R, 'dist', 'hifz-tracker-index.html')
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, 'w', encoding='utf8', newline='\n').write(doc)
print(out, round(len(doc.encode())/1e6, 2), 'MB')
