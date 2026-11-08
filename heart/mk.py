import numpy as np, json, base64, io
from PIL import Image
from scipy import ndimage as nd
M=[2,0,5,6,3,1,7,4,16,17,10,9,18,11,8,13,15,12,31,-1,30,22,27,21,14,23,24,20,29,26,25,32,28,19,33,41,40,39,37,36,42,34,43,38,53,49,51,35,48,44,47,50,52,46,55,54,45,57,62,64,63,56,61,65,60,58,66,72,69,70,71,59,68,73,74,67,77,81,79,80,78,82,76,75,87,84,88,85,93,86,89,83,92,91,94,95,90,96,97,101,100,102,98,103,106,99,105,109,104,108,107,110,111,113,112]
assert len(M)==115 and sorted(x for x in M if x>=0)==list(range(114))
lab=np.load('lab.npy'); r=json.load(open('regs.json'))
mask=np.zeros(lab.shape,np.uint8)
for k,reg in enumerate(r['regs']):
  if M[k]>=0: mask[lab==reg]=M[k]+1
# grow labels into the dark line pixels (up to 4px)
g=np.array(Image.open('blank.png').convert('L'))
for _ in range(4):
  z=mask==0
  grown=nd.grey_dilation(mask,size=3)
  mask=np.where(z&(g<=128)&(lab!=r['bg']),grown,mask)
Image.fromarray(mask,'L').save('mask.png',optimize=True)
art=Image.open('labeled.png').convert('L')
art=art.quantize(16).convert('L')
art.save('art.png',optimize=True)
for f in ['mask.png','art.png']:
  open(f+'.b64','w').write(base64.b64encode(open(f,'rb').read()).decode())
import os;print({f:os.path.getsize(f) for f in ['mask.png','art.png']})
