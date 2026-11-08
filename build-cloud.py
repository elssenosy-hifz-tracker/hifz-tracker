h=open('/mnt/project-files/website/head_en.html',encoding='utf8').read()
s=open('/mnt/project-files/website/app_en.js',encoding='utf8').read()
m=open('/mnt/project-files/website/mushaf.js',encoding='utf8').read().replace('/*MUSDATA*/',open('/mnt/project-files/website/mushaf/mus.json',encoding='utf8').read()).replace('/*HAFSFONT*/',open('/mnt/project-files/website/mushaf/hafs.b64').read())
assert s.rstrip().endswith('init();')
hj=open('/mnt/project-files/website/heart.js').read().replace('/*HEARTVEC*/',open('/mnt/project-files/website/heart/heartvec.json',encoding='utf8').read())
s=s.rstrip()[:-len('init();')]+m+'\n'+hj+'\n'+open('/mnt/project-files/website/guide.js').read()+'\n'+open('/mnt/project-files/website/classrep.js').read()+'\n'+open('/mnt/project-files/website/extras.js').read()+'\n'+open('/mnt/project-files/website/more.js').read()+'\n'+open('/mnt/project-files/website/quick.js').read()+'\n'+open('/mnt/project-files/website/smart.js').read()+'\n'+open('/mnt/project-files/website/goals.js').read()+'\n'+open('/mnt/project-files/website/tarteel.js').read()+'\n'+open('/mnt/project-files/website/school.js').read()+'\n'+open('/mnt/project-files/website/schools.js').read()+'\ninit();\n'
q=open('/mnt/project-files/website/qdata.json').read()
t=h.index('</style>')+len('</style>')
js=s.replace('/*QDATA*/',q)
doc='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>'+h[:t]+'</head><body>'+h[t:]+'<script>\n'+js+'</script>\n</body></html>'
open('/tmp/claude-0/-home-user/faa1c5f6-c96a-5cd4-a4cb-f0c35dcaa64d/scratchpad/full_en.html','w',encoding='utf8').write(doc)
open('/tmp/claude-0/-home-user/faa1c5f6-c96a-5cd4-a4cb-f0c35dcaa64d/scratchpad/index_en.html','w',encoding='utf8').write(h+'<script>\n'+js+'</script>\n')
print(len(doc.encode())/1e6,'MB')
