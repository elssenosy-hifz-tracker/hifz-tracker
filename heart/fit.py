import numpy as np, json, re
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
names=[re.sub('[ً-ْٰ]','',x) for x in json.load(open('/home/claude/hifz/mus.json'))['n']]
mask=np.array(Image.open('mask.png'))
g=np.array(Image.open('blank.png').convert('L'))
S=2
def fits(f,verbose=False):
  font=ImageFont.truetype('hafs.ttf',f*S)
  bad=[];pl={}
  for s in range(114):
    reg=(mask==s+1)&(g>128)
    reg=nd.binary_erosion(reg,iterations=3)
    l,t,r,b=font.getbbox(names[s],direction='rtl',language='ar')
    w=int(np.ceil((r-l)/S))+1;h=int(np.ceil((b-t)/S))+1
    ii=np.pad(reg.astype(np.int32).cumsum(0).cumsum(1),((1,0),(1,0)))
    H,W=reg.shape
    if h>=H or w>=W: bad.append(s);continue
    sm=ii[h:,w:]-ii[:-h,w:]-ii[h:,:-w]+ii[:-h,:-w]
    ok=np.argwhere(sm==w*h)
    if not len(ok): bad.append(s);continue
    ys,xs=np.nonzero(reg);cy,cx=ys.mean(),xs.mean()
    d=(ok[:,0]+h/2-cy)**2+(ok[:,1]+w/2-cx)**2
    y,x=ok[np.argmin(d)];pl[s]=(int(x),int(y),w,h,l,t)
  return bad,pl
for f in [10,12,14,16,18]:
  b,_=fits(f);print(f,len(b),[names[s] for s in b][:12])

b16,p16=fits(16);b15,p15=fits(15)
art=Image.open('blank.png').convert('L').resize((874*S,1213*S),Image.LANCZOS)
d=ImageDraw.Draw(art)
for s in range(114):
  f,pl=(16,p16) if s in p16 else (15,p15)
  font=ImageFont.truetype('hafs.ttf',f*S)
  x,y,w,h,l,t=pl[s]
  d.text((x*S-l+ (w*S-(font.getbbox(names[s],direction='rtl',language='ar')[2]-l))//2, y*S-t),names[s],fill=0,font=font,direction='rtl',language='ar')
art=art.quantize(16).convert('L');art.save('art2.png',optimize=True)
import base64,os;open('art2.png.b64','w').write(base64.b64encode(open('art2.png','rb').read()).decode());print(os.path.getsize('art2.png'))
