h=open('/home/claude/hifz/head_en.html',encoding='utf8').read()
s=open('/home/claude/hifz/app_en.js',encoding='utf8').read()
m=open('/home/claude/hifz/mushaf.js',encoding='utf8').read().replace('/*MUSDATA*/',open('/home/claude/hifz/mus.json',encoding='utf8').read()).replace('/*HAFSFONT*/',open('/home/claude/hifz/hafs.b64').read())
assert s.rstrip().endswith('init();')
hj=open('/home/claude/hifz/heart.js').read().replace('/*HEARTVEC*/',open('/home/claude/heart/heartvec.json',encoding='utf8').read())
s=s.rstrip()[:-len('init();')]+m+'\n'+hj+'\n'+open('/home/claude/hifz/guide.js').read()+'\n'+open('/home/claude/hifz/classrep.js').read()+'\n'+open('/home/claude/hifz/extras.js').read()+'\n'+open('/home/claude/hifz/more.js').read()+'\n'+open('/home/claude/hifz/quick.js').read()+'\n'+open('/home/claude/hifz/smart.js').read()+'\n'+open('/home/claude/hifz/goals.js').read()+'\ninit();\n'
q=open('/home/claude/hifz/qdata.json').read()
t=h.index('</style>')+len('</style>')
js=s.replace('/*QDATA*/',q)
doc='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'+h[:t]+'</head><body>'+h[t:]+'<script>\n'+js+'</script>\n</body></html>'
open('/home/claude/hifz/full_en.html','w',encoding='utf8').write(doc)
open('/home/claude/hifz/index_en.html','w',encoding='utf8').write(h+'<script>\n'+js+'</script>\n')
print(len(doc.encode())/1e6,'MB')
