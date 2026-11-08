// ---------- tajweed colours: worked out from the signs in the Uthmani Hafs text (KFGQPC), no outside data ----------
// The text already writes most rules: bare noon / open tanween = ikhfa or idgham, small meem = iqlab, maddah = long madd,
// circle (U+0652) = silent letter. Rules follow continuous reading (wasl) and stop at the end of an ayah (qalqalah there too).
const TJ_RULES=[
  ["madd6","#a3001b","مد لازم","Madd lāzim · 6 counts"],
  ["madd5","#e3262e","مد واجب متصل","Madd muttaṣil · 4–5"],
  ["madd4","#ef7d00","مد جائز منفصل","Madd munfaṣil · 2, 4 or 5"],
  ["ghun","#1d8a35","غنة","Ghunnah (نّ مّ)"],
  ["ikhfa","#8e2bb0","إخفاء","Ikhfāʾ"],
  ["idgG","#00897b","إدغام بغنة","Idghām with ghunnah"],
  ["idgN","#5d7f2a","إدغام بغير غنة","Idghām without ghunnah"],
  ["iqlab","#1678d2","إقلاب","Iqlāb"],
  ["qlq","#0b3e91","قلقلة","Qalqalah"],
  ["sil","#9a9a9a","لا يُنطق","Not pronounced"]];
const TJ_CSS=TJ_RULES.map(([k,c])=>`.tj-${k}{color:${c}}`).join("")+`.tjkey{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.tjkey span{white-space:nowrap;display:inline-flex;align-items:center;gap:6px}.tjkey i{display:inline-block;width:12px;height:12px;border-radius:3px}.tjkey b{font-family:"KFGQPC Hafs",serif;font-weight:400;font-size:1.15em}`;
const tjIsL=c=>(c>=0x621&&c<=0x63A)||(c>=0x641&&c<=0x64A)||c===0x671||c===0x640;
const TJ_QQ=new Set([0x642,0x637,0x628,0x62C,0x62F]),TJ_THROAT=new Set([0x621,0x623,0x625,0x624,0x626,0x647,0x639,0x62D,0x63A,0x62E]);
const TJ_HAMZA=new Set([0x621,0x623,0x624,0x625,0x626]),TJ_MADDL=new Set([0x627,0x648,0x64A,0x649]);
const TJ_VOWEL=[0x64B,0x64C,0x64D,0x64E,0x64F,0x650,0x651,0x652,0x653,0x670,0x6E1,0x6E2,0x6ED,0x8F0,0x8F1,0x8F2];
function tjClusters(word,w){const out=[];for(const ch of word){const c=ch.codePointAt(0);if(tjIsL(c)||!out.length)out.push({b:c,L:tjIsL(c),m:new Set(),t:ch,w});else{const k=out[out.length-1];k.m.add(c);k.t+=ch}}return out}
// W: word list, isEnd(w): last word of an ayah. Returns the HTML of words a..b-1 with coloured letters.
function tjRange(W,isEnd,a,b){
  const C=[],first=new Map();
  for(let w=a;w<Math.min(b+1,W.length);w++){first.set(w,C.length);for(const k of tjClusters(W[w],w))C.push(k)}
  const lastL=new Map();C.forEach((k,i)=>{if(k.L)lastL.set(k.w,i)});
  const nextL=(i,laterWord)=>{for(let j=i+1;j<C.length;j++){if(C[j].w!==C[i].w&&isEnd(C[j-1].w)&&C[j-1].w!==C[j].w)return null;if(C[j].L&&!C[j].m.has(0x652)&&!C[j].m.has(0x6E0)&&(!laterWord||C[j].w!==C[i].w))return C[j]}return null};
  const isH=n=>n&&(TJ_HAMZA.has(n.b)||n.m.has(0x654)||n.m.has(0x655));
  const nun=n=>{if(!n)return "";const c=n.b;if(c===0x644||c===0x631)return "idgN";if(c===0x64A||c===0x646||c===0x645||c===0x648)return "idgG";if(c===0x628)return "iqlab";return TJ_THROAT.has(c)||c===0x671?"":"ikhfa"};
  const cls=new Array(C.length).fill("");
  for(let i=0;i<C.length;i++){const k=C[i];if(!k.L)continue;const m=k.m,b=k.b,has=x=>m.has(x);
    const har=has(0x64E)||has(0x64F)||has(0x650),tReg=has(0x64B)||has(0x64C)||has(0x64D),tOpen=has(0x8F0)||has(0x8F1)||has(0x8F2);
    const sh=has(0x651),suk=has(0x6E1),bare=!TJ_VOWEL.some(x=>m.has(x)),n=nextL(i,false);
    let r="";
    if(has(0x652)||has(0x6E0)||b===0x671)r="sil";
    else if(has(0x653)){
      const carrier=TJ_MADDL.has(b)||TJ_HAMZA.has(b)||has(0x670)||has(0x6E5)||has(0x6E6)||has(0x6E7);
      const word=W[k.w],nida=i===first.get(k.w)&&/^(?:وَ)?[يه]َٰٓ/.test(word);
      if(!carrier)r="madd6";
      else if(n&&n.w===k.w&&(n.m.has(0x651)||n.m.has(0x6E1)||(!TJ_MADDL.has(n.b)&&!TJ_VOWEL.some(x=>n.m.has(x)))))r="madd6";
      else if(isH(n))r=n.w===k.w&&!nida?"madd5":"madd4";
      }
    else if((b===0x646||b===0x645)&&sh)r="ghun";
    else if(has(0x6E2)||has(0x6ED))r="iqlab";
    else if(b===0x646&&bare)r=nun(n);
    else if(tOpen)r=nun(nextL(i,true));
    else if(b===0x645&&bare&&n){if(n.b===0x628)r="ikhfa";else if(n.b===0x645)r="ghun"}
    else if(TJ_QQ.has(b)&&(suk||(isEnd(k.w)&&lastL.get(k.w)===i)))r="qlq";
    else if(bare&&!TJ_MADDL.has(b)&&b!==0x640&&n&&n.m.has(0x651))r="sil";
    if(r)cls[i]=r;
    if(r==="idgG"&&n&&n.m.has(0x651)&&!n.m.has(0x653)){const j=C.indexOf(n);if(j>=0&&!cls[j])cls[j]="idgG"}}
  const out=[];
  for(let w=a;w<b;w++){let h="",cur=null,buf="";const s=first.get(w),e=w+1<C.length&&first.has(w+1)?first.get(w+1):C.length;
    for(let i=s;i<e;i++){const c=cls[i]||"";if(c!==cur){if(buf)h+=cur?`<span class="tj-${cur}">${buf}</span>`:buf;buf="";cur=c}buf+=C[i].t}
    if(buf)h+=cur?`<span class="tj-${cur}">${buf}</span>`:buf;out.push(h)}
  return out}
const tjKeyHTML=()=>`<div class="tjkey small">${TJ_RULES.map(([k,c,ar,en])=>`<span><i style="background:${c}"></i><b>${ar}</b> ${en}</span>`).join("")}</div>`;
const tjOn=()=>{try{return localStorage.getItem("hifz.tj")==="1"}catch(e){return false}},tjSet=v=>{try{localStorage.setItem("hifz.tj",v?"1":"0")}catch(e){}};
let tjCssOn=false;function tjInject(){if(tjCssOn)return;tjCssOn=true;const st=document.createElement("style");st.textContent=TJ_CSS;document.head.append(st)}
