import numpy as np, json, re, cv2, math
from PIL import ImageFont
from scipy import ndimage as nd
from PIL import Image
names=[re.sub('[ً-ْٰ]','',x) for x in json.load(open('/home/claude/hifz/mus.json'))['n']]
g=np.array(Image.open('blank.png').convert('L'))
mask=np.array(Image.open('mask.png'))
F=ImageFont.truetype('hafs.ttf',100)
ext={}
for s in range(114):
  l,t,r,b=F.getbbox(names[s],direction='rtl',language='ar');ext[s]=((r-l)/100,(b-t)/100)
ANG=[0,-8,8,-16,16,-25,25,-35,35,-50,50,-70,70,90,-90]
regs={}
for s in range(114):
  reg=((mask==s+1)&(g>128)).astype(np.uint8)
  ys,xs=np.nonzero(reg);y0,y1,x0,x1=ys.min()-20,ys.max()+20,xs.min()-20,xs.max()+20
  regs[s]=(reg[max(0,y0):y1,max(0,x0):x1],max(0,x0),max(0,y0))
def place(s,f,margin=2):
  r,ox,oy=regs[s];w=ext[s][0]*f+2*margin;h=ext[s][1]*f*0.95+2*margin
  H,W=r.shape;c=(W/2,H/2)
  for a in ANG:
    M=cv2.getRotationMatrix2D(c,a,1.0)
    # enlarge canvas so nothing cut
    D=int(math.hypot(W,H))+4;M[0,2]+=(D-W)/2;M[1,2]+=(D-H)/2
    rr=cv2.warpAffine(r,M,(D,D),flags=cv2.INTER_NEAREST)
    wi,hi=int(math.ceil(w)),int(math.ceil(h))
    if wi>=D or hi>=D:continue
    ii=np.pad(rr.astype(np.int32).cumsum(0).cumsum(1),((1,0),(1,0)))
    sm=ii[hi:,wi:]-ii[:-hi,wi:]-ii[hi:,:-wi]+ii[:-hi,:-wi]
    ok=np.argwhere(sm==wi*hi)
    if not len(ok):continue
    ys,xs=np.nonzero(rr);cy,cx=ys.mean(),xs.mean()
    dd=(ok[:,0]+hi/2-cy)**2+(ok[:,1]+wi/2-cx)**2
    y,x=ok[np.argmin(dd)];px,py=x+wi/2,y+hi/2
    Mi=cv2.invertAffineTransform(M);X=Mi[0,0]*px+Mi[0,1]*py+Mi[0,2];Y=Mi[1,0]*px+Mi[1,1]*py+Mi[1,2]
    return (round(X+ox,1),round(Y+oy,1),a)
  return None
if __name__=="__main__":
  for f in [16,18,20,22,24]:
    bad=[names[s] for s in range(114) if place(s,f) is None];print(f,len(bad),bad)
