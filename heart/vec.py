import numpy as np, json, re, potrace, cv2
from PIL import Image, ImageFont
from scipy import ndimage as nd
names=[re.sub('[ً-ْٰ]','',x) for x in json.load(open('/home/claude/hifz/mus.json'))['n']]
g=np.array(Image.open('blank.png').convert('L'))
lab=np.load('lab.npy');R=json.load(open('regs.json'));bg=R['bg']
mask=np.array(Image.open('mask.png'))  # surah+1 on white areas (+grown)
# full label map: 1..114 surahs, 115 the vessel opening
L=np.zeros(lab.shape,np.int32)
for k,reg in enumerate(R['regs']):
  m=lab==reg;vals=mask[m];v=np.bincount(vals).argmax() if vals.max()>0 else 0
  L[m]=v if v>0 else 115
# heart silhouette = not background (fill holes)
outside=lab==bg
# background connected to border only
ob,_=nd.label(outside);border=set(np.unique(np.r_[ob[0],ob[-1],ob[:,0],ob[:,-1]]))-{0}
outer=np.isin(ob,list(border))
inside=~outer
# assign every inside pixel to nearest labelled pixel
d,(iy,ix)=nd.distance_transform_edt(L==0,return_indices=True)
P=np.where(inside,L[iy,ix],0)
S=4
paths={}
for v in range(1,116):
  m=(P==v).astype(np.uint8)
  if not m.any():continue
  big=cv2.resize(m,(m.shape[1]*S,m.shape[0]*S),interpolation=cv2.INTER_NEAREST)
  big=cv2.GaussianBlur(big.astype(np.float32),(0,0),S*0.8)>0.5
  bm=potrace.Bitmap(~big)
  pl=bm.trace(turdsize=20,alphamax=1.1,opticurve=True,opttolerance=0.3)
  out=[]
  f=lambda p:f"{p.x/S:.1f} {p.y/S:.1f}"
  for c in pl:
    out.append("M"+f(c.start_point))
    for seg in c.segments:
      if seg.is_corner: out.append("L"+f(seg.c)+"L"+f(seg.end_point))
      else: out.append("C"+f(seg.c1)+" "+f(seg.c2)+" "+f(seg.end_point))
    out.append("Z")
  paths[v]="".join(out)
json.dump(paths,open('paths.json','w'))
np.save('P.npy',P)
print(len(paths),sum(len(x) for x in paths.values()))
