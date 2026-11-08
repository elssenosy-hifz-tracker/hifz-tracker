// ---------- tajweed: rules worked out from the signs in the Uthmani Hafs text (KFGQPC), no outside data ----------
// The text already writes most rules: bare noon / open tanween = ikhfa or idgham, small meem = iqlab, maddah = long madd,
// circle (U+0652) = silent letter. Rules follow continuous reading (wasl) and stop at the end of an ayah (qalqalah there too).
const TJ_COL={madd6:"#990014",madd5:"#d4141c",madd4:"#e06800",ghun:"#0b8a2a",ikhfa:"#8a17b8",idgG:"#007f6e",idgN:"#4c7a00",iqlab:"#0a6ad8",qlq:"#0a3aa8",sil:"#8e8e8e"};
// rule id: [group, Arabic name, English name, colour, Arabic explanation, English explanation, letters]
const TJ_R={
  izhar:["nun","الإظهار الحلقي","Iẓhār","","تُنطق النون الساكنة أو التنوين واضحة من غير غنة زائدة إذا جاء بعدها حرف من حروف الحلق.","Noon sakinah or tanween is said clearly, without extra ghunnah, before a throat letter.","ء هـ ع ح غ خ"],
  idgG:["nun","الإدغام بغنة","Idghām with ghunnah","idgG","تُدغم النون الساكنة أو التنوين في الحرف التالي مع غنة بمقدار حركتين.","Noon sakinah or tanween merges into the next letter, with ghunnah of two counts.","ي ن م و"],
  idgN:["nun","الإدغام بغير غنة","Idghām without ghunnah","idgN","تُدغم النون الساكنة أو التنوين في اللام أو الراء إدغامًا كاملًا من غير غنة.","Noon sakinah or tanween merges fully into lam or ra, without ghunnah.","ل ر"],
  iqlab:["nun","الإقلاب","Iqlāb","iqlab","تُقلب النون الساكنة أو التنوين ميمًا مخفاة مع الغنة إذا جاء بعدها باء، وتُكتب فوقها ميم صغيرة.","Before ba, noon sakinah or tanween turns into a hidden meem with ghunnah (written as a small meem).","ب"],
  ikhfa:["nun","الإخفاء الحقيقي","Ikhfāʾ","ikhfa","تُنطق النون الساكنة أو التنوين بحالة بين الإظهار والإدغام مع غنة، عند باقي الحروف.","Noon sakinah or tanween is said between clear and merged, with ghunnah, before the remaining letters.","ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك"],
  ikhfaS:["mim","الإخفاء الشفوي","Ikhfāʾ shafawī","ikhfa","تُخفى الميم الساكنة عند الباء مع غنة.","Meem sakinah is hidden before ba, with ghunnah.","ب"],
  idgM:["mim","إدغام المثلين الصغير","Idghām mithlayn","ghun","تُدغم الميم الساكنة في الميم المتحركة بعدها مع غنة.","Meem sakinah merges into the next meem, with ghunnah.","م"],
  izharS:["mim","الإظهار الشفوي","Iẓhār shafawī","","تُنطق الميم الساكنة واضحة عند باقي الحروف.","Meem sakinah is said clearly before all other letters.","كل الحروف عدا ب م"],
  ghun:["ghun","الغنة","Ghunnah","ghun","النون والميم المشددتان تُنطقان بغنة كاملة بمقدار حركتين.","Noon and meem with shaddah are said with full ghunnah of two counts.","نّ مّ"],
  tabii:["madd","المد الطبيعي","Madd ṭabīʿī","","حرف مد (ألف بعد فتح، واو ساكنة بعد ضم، ياء ساكنة بعد كسر، والألف الصغيرة) ليس بعده همز ولا سكون، ويُمد حركتين.","A madd letter (alif after fatha, waw after damma, ya after kasra, or the small alif) with no hamzah or sukun after it: 2 counts.","ا و ي ـٰ"],
  madd5:["madd","المد الواجب المتصل","Madd muttaṣil","madd5","حرف مد بعده همزة في الكلمة نفسها، ويُمد ٤ أو ٥ حركات.","A madd letter followed by hamzah in the same word: 4 or 5 counts.","حرف مد + همزة في كلمة واحدة"],
  madd4:["madd","المد الجائز المنفصل","Madd munfaṣil","madd4","حرف مد في آخر الكلمة والهمزة في أول الكلمة التي بعدها، ويُمد ٢ أو ٤ أو ٥ حركات.","A madd letter at the end of a word and hamzah at the start of the next: 2, 4 or 5 counts.","حرف مد + همزة في الكلمة التالية"],
  madd6:["madd","المد اللازم","Madd lāzim","madd6","حرف مد بعده سكون أصلي أو شدة، وفي حروف فواتح بعض السور، ويُمد ٦ حركات.","A madd letter followed by a fixed sukun or shaddah, and the opening letters of some surahs: 6 counts.","حرف مد + سكون أو شدة"],
  silaS:["madd","مد الصلة الصغرى","Ṣilah ṣughrā","","هاء الضمير بين حرفين متحركين تُمد حركتين (تُكتب بعدها واو أو ياء صغيرة)، ولا تُمد عند الوقف.","The pronoun ha between two vowelled letters is lengthened 2 counts (written with a small waw or ya); not when stopping.","هُۥ هِۦ"],
  silaK:["madd","مد الصلة الكبرى","Ṣilah kubrā","madd4","صلة هاء الضمير إذا جاء بعدها همزة، وتُمد ٤ أو ٥ حركات مثل المد المنفصل.","Ṣilah of the pronoun ha when hamzah follows: 4 or 5 counts, like madd munfaṣil.","هُۥٓ هِۦٓ + همزة"],
  arid:["madd","المد العارض للسكون","Madd ʿāriḍ lis-sukūn","","حرف مد بعده حرف سُكّن للوقف في آخر الآية، ويُمد ٢ أو ٤ أو ٦ حركات.","A madd letter before the last letter of an ayah when stopping on it: 2, 4 or 6 counts.","حرف مد + حرف موقوف عليه"],
  leen:["madd","مد اللين","Madd līn","","واو أو ياء ساكنة قبلها فتح، تُمد عند الوقف على الحرف الذي بعدها في آخر الكلمة ٢ أو ٤ أو ٦ حركات.","Waw or ya with sukun after a fatha, when stopping on the last letter of the word after it: 2, 4 or 6 counts.","وْ يْ بعد فتح"],
  iwad:["madd","مد العوض","Madd ʿiwaḍ","","عند الوقف على تنوين الفتح يُنطق ألفًا تُمد حركتين.","When stopping on tanween with fatha, it is said as an alif of 2 counts.","ـًا"],
  qlq:["qlq","القلقلة","Qalqalah","qlq","اضطراب الحرف الساكن عند النطق به حتى يُسمع له صوت قوي، وتكون أوضح عند الوقف.","The letter bounces when it has sukun, more strongly when stopping on it.","ق ط ب ج د"],
  lamS:["lam","اللام الشمسية","Lām shamsiyyah","sil","لام «ال» لا تُنطق، وتُدغم في الحرف المشدد بعدها.","The lam of «al» is not said; it merges into the doubled letter after it.","ت ث د ذ ر ز س ش ص ض ط ظ ل ن"],
  lamQ:["lam","اللام القمرية","Lām qamariyyah","","لام «ال» تُنطق ساكنة واضحة قبل الحروف القمرية.","The lam of «al» is said clearly before the moon letters.","ء ب ج ح خ ع غ ف ق ك م هـ و ي"],
  tafkhim:["tfk","التفخيم","Tafkhīm","","تسمين صوت الحرف: حروف الاستعلاء دائمًا، والراء المفتوحة والمضمومة والساكنة بعد فتح أو ضم، ولام لفظ الجلالة بعد فتح أو ضم.","A heavy sound: the raised letters always, ra with fatha or damma (or after them), and the lam of «Allah» after fatha or damma.","خ ص ض غ ط ق ظ ر اللَّه"],
  tarqiq:["tfk","الترقيق","Tarqīq","","ترقيق صوت الحرف: الراء المكسورة، والساكنة بعد كسر أو ياء ساكنة، ولام لفظ الجلالة بعد كسر.","A light sound: ra with kasra, ra with sukun after a kasra or ya, and the lam of «Allah» after a kasra.","ر اللَّه"],
  idgX:["sil","إدغام حرف ساكن في المشدد بعده","Other idghām","sil","حرف ساكن لا يُنطق لأنه أُدغم في الحرف المشدد بعده، مثل: قَد تَّبَيَّنَ.","A letter with no vowel that merges into the doubled letter after it, e.g. قَد تَّبَيَّنَ.","حرف ساكن + حرف مشدد"],
  wasl:["sil","همزة الوصل","Hamzat al-waṣl","sil","تسقط في النطق عند وصل الكلام بما قبلها، وتُنطق عند البدء بها.","Not said when joined to what comes before; said when starting with it.","ٱ"],
  silent:["sil","حروف تُكتب ولا تُنطق","Silent letters","sil","حروف عليها الدائرة الصغيرة (أو الصفر المستطيل في «أنا») لا تُنطق عند الوصل.","Letters with the small circle (or the oval zero in «أنا») are not said when reading on.","اْ وْ يْ"]};
const TJ_G=[["nun","أحكام النون الساكنة والتنوين","Noon sakinah and tanween"],["mim","أحكام الميم الساكنة","Meem sakinah"],["ghun","الغنة","Ghunnah"],["madd","المدود","Madd"],["qlq","القلقلة","Qalqalah"],["lam","لام التعريف","The lam of «al»"],["tfk","التفخيم والترقيق","Heavy and light letters"],["sil","حروف لا تُنطق","Letters not said"]];
const TJ_KEY=[["madd6","مد لازم","6"],["madd5","مد متصل","4–5"],["madd4","مد منفصل","2/4/5"],["ghun","غنة"],["ikhfa","إخفاء"],["idgG","إدغام بغنة"],["idgN","إدغام بغير غنة"],["iqlab","إقلاب"],["qlq","قلقلة"],["sil","لا يُنطق"]];
const TJ_CSS=Object.entries(TJ_COL).map(([k,c])=>`.tj-${k}{color:${c}${k==="sil"?"":";-webkit-text-stroke:.03em "+c}}`).join("")+`.tj-hl{color:#7a4a00}.tjsel{background:rgba(255,200,40,.32);border-radius:.15em}
.tjkey{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.tjkey span{white-space:nowrap;display:inline-flex;align-items:center;gap:6px}.tjkey i,.tjdot{display:inline-block;width:12px;height:12px;border-radius:3px;flex:none}.tjkey b,.tjar{font-family:"KFGQPC Hafs",serif;font-weight:400;font-size:1.15em}
.tjtabs{margin-top:6px}.tjrules{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.tjrule{text-align:start;display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);cursor:pointer;font:inherit;color:inherit}
.tjrule .tjn{display:flex;align-items:center;gap:8px;font-weight:700;flex-wrap:wrap}.tjrule .tjn .tjar{font-size:1.25em}.tjlet{font-family:"KFGQPC Hafs",serif;color:var(--muted);direction:rtl}
.tjay{font-family:"KFGQPC Hafs",serif;direction:rtl;font-size:24px;line-height:2.1;margin:0;color:#1b1b1b}.tjres .ev{display:block}.tjres .tjplace{font-size:13px;color:var(--muted);font-weight:600}
.tjstat{display:flex;gap:10px;flex-wrap:wrap}.tjstat div{flex:1;min-width:120px;border:1px solid var(--line);border-radius:12px;padding:8px 12px;text-align:center}.tjstat b{display:block;font-size:22px}
.tjexp{direction:rtl;font-size:17px;line-height:1.8;margin:.3em 0}`;
let tjCssOn=false;function tjInject(){if(tjCssOn)return;tjCssOn=true;const st=document.createElement("style");st.textContent=TJ_CSS;document.head.append(st)}
const tjIsL=c=>(c>=0x621&&c<=0x63A)||(c>=0x641&&c<=0x64A)||c===0x671||c===0x640;
const TJ_QQ=new Set([0x642,0x637,0x628,0x62C,0x62F]),TJ_THROAT=new Set([0x621,0x623,0x625,0x624,0x626,0x647,0x639,0x62D,0x63A,0x62E]);
const TJ_HEAVY=new Set([0x62E,0x635,0x636,0x63A,0x637,0x642,0x638]),TJ_HAMZA=new Set([0x621,0x623,0x624,0x625,0x626]),TJ_MADDL=new Set([0x627,0x648,0x64A,0x649]);
const TJ_VOWEL=[0x64B,0x64C,0x64D,0x64E,0x64F,0x650,0x651,0x652,0x653,0x670,0x6E1,0x6E2,0x6ED,0x8F0,0x8F1,0x8F2];
function tjClusters(word,w){const out=[];for(const ch of word){const c=ch.codePointAt(0);if(tjIsL(c)||!out.length)out.push({b:c,L:tjIsL(c),m:new Set(),t:ch,w});else{const k=out[out.length-1];k.m.add(c);k.t+=ch}}return out}
// W: word list, isEnd(w): last word of an ayah. Works out the rule of every letter in words a..b-1 (word b is read for look-ahead).
function tjAnalyze(W,isEnd,a,b){
  const C=[],first=new Map();
  for(let w=a;w<Math.min(b+1,W.length);w++){first.set(w,C.length);for(const k of tjClusters(W[w],w))C.push(k)}
  const lastL=new Map();C.forEach((k,i)=>{if(k.L)lastL.set(k.w,i)});
  const silent=k=>k.m.has(0x652)||k.m.has(0x6E0);
  const nextL=(i,later)=>{for(let j=i+1;j<C.length;j++){if(C[j].w!==C[j-1].w&&isEnd(C[j-1].w))return null;const k=C[j];if(k.L&&!silent(k)&&(!later||k.w!==C[i].w))return k}return null};
  const isH=n=>n&&(TJ_HAMZA.has(n.b)||n.m.has(0x654)||n.m.has(0x655));
  const nun=n=>{if(!n)return "";const c=n.b;if(c===0x644||c===0x631)return "idgN";if(c===0x64A||c===0x646||c===0x645||c===0x648)return "idgG";if(c===0x628)return "iqlab";return TJ_THROAT.has(c)||c===0x671?"":"ikhfa"};
  const alPre=i=>{const p=C[i-1];if(!p||p.w!==C[i].w)return false;if(p.b===0x671)return true;const f=first.get(C[i].w);return p.b===0x644&&p.m.has(0x650)&&(i-1===f||(i-2===f&&(C[f].b===0x648||C[f].b===0x641)))};
  const rule=i=>{const k=C[i],m=k.m,b=k.b,has=x=>m.has(x);
    const tReg=has(0x64B)||has(0x64C)||has(0x64D),tOpen=has(0x8F0)||has(0x8F1)||has(0x8F2);
    const sh=has(0x651),suk=has(0x6E1),bare=!TJ_VOWEL.some(x=>m.has(x)),n=nextL(i,false);
    if(silent(k))return "silent";
    if(b===0x671)return "wasl";
    if(has(0x653)){
      const carrier=TJ_MADDL.has(b)||TJ_HAMZA.has(b)||has(0x670)||has(0x6E5)||has(0x6E6)||has(0x6E7);
      const nida=i===first.get(k.w)&&/^(?:وَ)?[يه]َٰٓ/.test(W[k.w]);
      if(!carrier)return "madd6";
      if(b===0x647&&(has(0x6E5)||has(0x6E6)))return isH(n)?"silaK":"";
      if(n&&n.w===k.w&&(n.m.has(0x651)||n.m.has(0x6E1)||(!TJ_MADDL.has(n.b)&&!TJ_VOWEL.some(x=>n.m.has(x)))))return "madd6";
      if(isH(n))return n.w===k.w&&!nida?"madd5":"madd4";
      return ""}
    if((b===0x646||b===0x645)&&sh)return "ghun";
    if(has(0x6E2)||has(0x6ED))return "iqlab";
    if(b===0x646&&bare)return nun(n);
    if(tOpen)return nun(nextL(i,true));
    if(b===0x646&&suk&&n&&TJ_THROAT.has(n.b))return "izhar";
    if(tReg){const n2=nextL(i,true);if(n2&&TJ_THROAT.has(n2.b))return "izhar"}
    if(b===0x645&&bare&&n){if(n.b===0x628)return "ikhfaS";if(n.b===0x645)return "idgM"}
    if(b===0x645&&suk&&n)return "izharS";
    if(TJ_QQ.has(b)&&(suk||(isEnd(k.w)&&lastL.get(k.w)===i)))return "qlq";
    if(b===0x644&&suk&&alPre(i))return "lamQ";
    if(bare&&!TJ_MADDL.has(b)&&b!==0x640&&n&&n.m.has(0x651))return b===0x644&&alPre(i)?"lamS":"idgX";
    return ""};
  const prevI=i=>{for(let t=i-1;t>=0&&C[t].w===C[i].w;t--)if(C[t].L)return t;return -1};
  const nextI=i=>{for(let t=i+1;t<C.length&&C[t].w===C[i].w;t++)if(C[t].L)return t;return -1};
  const vow=k=>!k?"":k.m.has(0x64E)||k.m.has(0x64B)||k.m.has(0x8F0)?"a":k.m.has(0x64F)||k.m.has(0x64C)||k.m.has(0x8F1)?"u":k.m.has(0x650)||k.m.has(0x64D)||k.m.has(0x8F2)?"i":k.m.has(0x6E1)?"s":"";
  const isBare=k=>!TJ_VOWEL.some(x=>k.m.has(x));
  const raRule=i=>{const k=C[i],stop=isEnd(k.w)&&lastL.get(k.w)===i,v=vow(k);
    if(!stop&&(v==="a"||v==="u"))return "tafkhim";if(!stop&&v==="i")return "tarqiq";
    let p=prevI(i);if(p<0)return "tafkhim";let P=C[p];
    if(P.b===0x64A&&(P.m.has(0x6E1)||isBare(P)))return "tarqiq";
    if(isBare(P)&&(P.b===0x627||P.b===0x648||P.b===0x649))return "tafkhim";
    if(vow(P)==="s"&&stop){p=prevI(p);if(p<0)return "tafkhim";P=C[p]}
    if(vow(P)==="i"){const n=nextI(i);return n>=0&&TJ_HEAVY.has(C[n].b)?"tafkhim":"tarqiq"}
    return "tafkhim"};
  const lamJ=i=>{const k=C[i],n=nextI(i);if(k.b!==0x644||!k.m.has(0x651)||n<0||C[n].b!==0x647||C[n].m.has(0x6E1))return "";const p=prevI(i);if(p>=0&&!(C[p].b===0x644||C[p].b===0x671))return "";
    for(let t=i-1;t>=0;t--){if(C[t].w!==C[t+1].w&&isEnd(C[t].w))return "tafkhim";const v=vow(C[t]);if(v==="i")return "tarqiq";if(v==="a"||v==="u")return "tafkhim";if(v==="s")return "tafkhim"}return "tafkhim"};
  const extras=(i,r)=>{const k=C[i],b=k.b,has=x=>k.m.has(x),out=[],end=isEnd(k.w),last=lastL.get(k.w),p=prevI(i),P=p>=0?C[p]:null,n=nextI(i);
    if(r==="silent"||r==="wasl")return out;
    if(TJ_HEAVY.has(b))out.push("tafkhim");
    else if(b===0x631&&r!=="idgX")out.push(raRule(i));
    else{const j=lamJ(i);if(j)out.push(j)}
    if(r)return out;
    if(b===0x647&&(has(0x6E5)||has(0x6E6))&&!has(0x653)){if(!end||i!==last)out.push("silaS");return out}
    const madd=has(0x670)&&!has(0x653)||(isBare(k)&&P&&(((b===0x627||b===0x649)&&P.m.has(0x64E))||(b===0x648&&P.m.has(0x64F))||(b===0x64A&&P.m.has(0x650))));
    if(madd){if(end&&n>=0&&n===last)out.push("arid");else if(!(n<0&&!end&&nextL(i,true)&&nextL(i,true).b===0x671))out.push("tabii");return out}
    if(n>=0&&n===last&&(b===0x648||b===0x64A)&&has(0x6E1)&&P&&P.m.has(0x64E)){out.push("leen");return out}
    if(end&&i===last&&isBare(k)&&(b===0x627||b===0x649)&&P&&(P.m.has(0x64B)||P.m.has(0x8F0)))out.push("iwad");
    return out};
  const rid=new Array(C.length).fill(""),part=new Array(C.length).fill(""),ext=new Array(C.length).fill(null);
  for(let i=0;i<C.length;i++){if(!C[i].L)continue;const r=rule(i),x=extras(i,r);if(x.length)ext[i]=x;if(!r)continue;rid[i]=r;
    if(r==="idgG"){const n=C[i].b===0x646?nextL(i,false):nextL(i,true);if(n&&n.m.has(0x651)&&!n.m.has(0x653)){const j=C.indexOf(n);if(j>=0)part[j]=r}}}
  return {C,first,rid,part,ext}}
// HTML of words a..b-1. Without `only`: every rule in its colour. With `only`: just that rule, highlighted.
function tjRange(W,isEnd,a,b,only){
  const {C,first,rid,part,ext}=tjAnalyze(W,isEnd,a,b),out=[];
  const cls=i=>{const r=rid[i],p=part[i];if(only){if(r!==only&&p!==only&&!(ext[i]&&ext[i].includes(only)))return "";return `tj-${TJ_R[only][3]||"hl"} tjsel`}
    const c=(r&&TJ_R[r][3])||(p&&!r&&TJ_R[p][3])||"";return c?"tj-"+c:""};
  for(let w=a;w<b;w++){let h="",cur=null,buf="";const s=first.get(w),e=first.has(w+1)?first.get(w+1):C.length;
    for(let i=s;i<e;i++){const c=cls(i);if(c!==cur){if(buf)h+=cur?`<span class="${cur}">${buf}</span>`:buf;buf="";cur=c}buf+=C[i].t}
    if(buf)h+=cur?`<span class="${cur}">${buf}</span>`:buf;out.push(h)}
  return out}
const tjKeyHTML=()=>`<div class="tjkey small">${TJ_KEY.map(([k,ar,n])=>`<span><i style="background:${TJ_COL[k]}"></i><b>${ar}</b>${n?` ${n}`:""}</span>`).join("")}</div>`;

// ---------- whole-Quran index (worked out once, on first use) ----------
const tjEnd=w=>!!aend()[w];
let TJ_ST=null;
function tjStats(){if(TJ_ST)return TJ_ST;const W=mw(),cnt={},ay={};
  for(let pg=1;pg<=604;pg++){const a=MUS.p[pg-1],b=pg<604?MUS.p[pg]:W.length,{C,rid,ext}=tjAnalyze(W,tjEnd,a,b);let lw=-1,A=0;
    for(let i=0;i<C.length;i++){const w=C[i].w;if(w>=b)break;const rs=rid[i]?[rid[i],...(ext[i]||[])]:ext[i];if(!rs)continue;if(w!==lw){lw=w;A=wordAyah(w)}
      for(const r of rs){cnt[r]=(cnt[r]||0)+1;const m=ay[r]||(ay[r]=new Map());m.set(A,(m.get(A)||0)+1)}}}
  return TJ_ST={cnt,ay}}
const tjAyahRange=i=>[MUS.a[i],i+1<MUS.a.length?MUS.a[i+1]:mw().length];
function tjAyahHTML(i,only){const [a,b]=tjAyahRange(i);return tjRange(mw(),tjEnd,a,b,only).join(" ")+` <span class="ae">۝<b>${toAr(aend()[b-1])}</b></span>`}
const tjPlace=i=>{const s=AY_SURAH[i];return `${MUS.n[s]} ${toAr(i-SURAH_FIRST[s]+1)}`};
const tjInScope=(i,sc)=>sc==="all"||(sc[0]==="s"?AY_SURAH[i]===+sc.slice(1):juzOfPage(pageOfWord(MUS.a[i]))===+sc.slice(1));
const tjAyRow=(i,only)=>`<div class="ev"><div class="tjplace">${tjPlace(i)} · ${SURAH_NAMES[AY_SURAH[i]]} ${i-SURAH_FIRST[AY_SURAH[i]]+1}</div><p class="tjay">${tjAyahHTML(i,only)}</p></div>`;
const tjNum=(n,one,many,ar1,arN)=>AR?`${n} ${n===1?ar1:arN}`:`${n} ${n===1?one:many}`;

// ---------- search (ignores diacritics and spelling variants of alif, ya, ta marbuta and hamzah seats) ----------
const TJ_MAP={"ٱ":"ا","أ":"ا","إ":"ا","آ":"ا","ى":"ي","ة":"ه","ؤ":"و","ئ":"ي"};
// sup: read the small alif as a letter (ٱلصَّلَوٰةَ → الصلاة, عَلَىٰ → علا) so modern spelling finds Uthmani words
function tjNorm(s,sup){let o="",last="";for(const ch of s){const c=ch.codePointAt(0);if(c===0x670){if(sup){if(last==="و"||last==="ى")o=o.slice(0,-1);o+="ا"}continue}if(tjIsL(c))last=ch;if(c===32||c===0xA0){o+=" ";continue}if(!tjIsL(c)||c===0x640)continue;o+=TJ_MAP[ch]||ch}return " "+o.replace(/ءا/g,"ا").replace(/ +/g," ").trim()+" "}
let TJ_NORM=null;
function tjSearch(q){const n=tjNorm(q,false).trim();if(n.length<2)return [];
  if(!TJ_NORM){const W=mw();TJ_NORM=[];for(let i=0;i<MUS.a.length;i++){const [a,b]=tjAyahRange(i),t=W.slice(a,b).join(" ");TJ_NORM.push([tjNorm(t,false),tjNorm(t,true)])}}
  const out=[];TJ_NORM.forEach(([x,y],i)=>{if(x.includes(n)||y.includes(n))out.push(i)});return out}

// ---------- the Tajweed page ----------
const tjScopeSel=sc=>`<select id="tjScope" aria-label="Where to look"><option value="all">Whole Quran</option><optgroup label="Surah">${SURAH_NAMES.map((n,s)=>`<option value="s${s}" ${sc==="s"+s?"selected":""}>${s+1}. ${n}</option>`).join("")}</optgroup><optgroup label="Juz">${Array.from({length:30},(_,j)=>`<option value="j${j+1}" ${sc==="j"+(j+1)?"selected":""}>Juz ${j+1}</option>`).join("")}</optgroup></select>`;
function tjIndexHTML(){return TJ_G.map(([g,ar,en])=>`<div class="panel"><h3><span class="tjar">${ar}</span>${AR?"":` <span class="small muted">${en}</span>`}</h3><div class="tjrules">${Object.entries(TJ_R).filter(([,r])=>r[0]===g).map(([id,r])=>`<button class="tjrule" data-tr="${id}"><span class="tjn"><i class="tjdot" style="background:${r[3]?TJ_COL[r[3]]:"transparent"};border:1px solid ${r[3]?TJ_COL[r[3]]:"#bbb"}"></i><span class="tjar">${r[1]}</span>${AR?"":`<span class="small muted">${r[2]}</span>`}</span><span class="small muted" dir="auto" data-noar>${AR?r[4]:r[5]}</span><span class="tjlet">${r[6]}</span></button>`).join("")}</div></div>`).join("")+`<p class="small muted">The rules are worked out from the signs written in the Uthmani mushaf text (Hafs). Rules without a colour in the mushaf (such as iẓhār, madd ṭabīʿī, tafkhīm) are shown highlighted on their own pages.</p>`}
function tjRuleHTML(id){const r=TJ_R[id];if(!r)return "";const st=tjStats(),sc=view.ts||"all",n=view.tn||20;
  const all=[...(st.ay[id]||new Map()).entries()].filter(([i])=>tjInScope(i,sc)),places=all.reduce((s,[,c])=>s+c,0);
  let top="";if(sc==="all"){const bys=new Map();for(const [i,c] of all){const s=AY_SURAH[i];bys.set(s,(bys.get(s)||0)+c)}top=[...bys.entries()].sort((x,y)=>y[1]-x[1]).slice(0,5).map(([s,c])=>`<button class="fbtn small" data-tsc="s${s}">${MUS.n[s]} (${c})</button>`).join("")}
  return `<div class="panel"><div class="actions"><button class="link" data-tr="">← All rules</button></div>
    <h2><i class="tjdot" style="background:${r[3]?TJ_COL[r[3]]:"#f5c94a"}"></i> <span class="tjar">${r[1]}</span>${AR?"":` <span class="small muted">${r[2]}</span>`}</h2>
    <p class="tjexp">${r[4]}</p>${AR?"":`<p class="small">${r[5]}</p>`}<p class="small">Letters: <span class="tjlet">${r[6]}</span></p></div>
  <div class="panel"><div class="tjstat"><div><b>${places}</b>${AR?"موضع":"places"}</div><div><b>${all.length}</b>${AR?"آية":"ayahs"}</div></div>
    ${top?`<p class="small muted">Most in:</p><div class="filters">${top}</div>`:""}
    <div class="fields"><label>Show examples from${tjScopeSel(sc)}</label></div></div>
  <div class="panel tjres"><div class="log">${all.slice(0,n).map(([i])=>tjAyRow(i,id)).join("")||'<p class="muted">No examples here.</p>'}</div>
    ${all.length>n?`<div class="actions"><button id="tjMore">${AR?`عرض المزيد (باقي ${all.length-n})`:`Show more (${all.length-n} left)`}</button></div>`:""}</div>`}
function tjSearchHTML(){const q=view.tq||"",n=view.tn||20,res=q?tjSearch(q):[];
  return `<div class="panel"><form id="tjSF" class="fields"><label>Search the mushaf<input id="tjQ" value="${esc(q)}" placeholder="مثال: من بعد" dir="rtl" autocomplete="off"></label><button class="primary" type="submit">Search</button></form>
    <p class="small muted">Type a word or part of an ayah; diacritics are not needed. Results show the tajweed colours.</p>${q?`<p><b>${tjNum(res.length,"ayah","ayahs","آية","آية")}</b></p>`:""}${q?tjKeyHTML():""}</div>
  ${q?`<div class="panel tjres"><div class="log">${res.slice(0,n).map(i=>tjAyRow(i)).join("")||'<p class="muted">Nothing found. Try fewer letters.</p>'}</div>${res.length>n?`<div class="actions"><button id="tjMore">${AR?`عرض المزيد (باقي ${res.length-n})`:`Show more (${res.length-n} left)`}</button></div>`:""}</div>`:""}`}
function tjMushafHTML(){const pg=view.tp||1,z=view.tz||0,ps=wordPlace(MUS.p[pg-1]);
  return `<div class="panel mtools"><div class="mnav"><button id="tjNext" ${pg>=604?"disabled":""}>← Next</button><label class="inl">Page<input type="number" id="tjPg" min="1" max="604" value="${pg}" inputmode="numeric"></label><button id="tjPrev" ${pg<=1?"disabled":""}>Previous →</button></div>
    <div class="mnav"><select id="tjSurah" aria-label="Go to surah">${SURAH_NAMES.map((n,s)=>`<option value="${s}" ${s===ps.s?"selected":""}>${s+1}. ${n}</option>`).join("")}</select>
      <span class="zoom"><button id="tjZo" class="small" ${z<=0?"disabled":""} aria-label="Smaller">A−</button><button id="tjZi" class="small" ${z>=2?"disabled":""} aria-label="Larger">A+</button></span></div></div>
  <div class="mwrap"><div class="mbox${z?" big"+z:""}">${pageHTML(pg,null,true)}</div></div>
  <div class="panel">${tjKeyHTML()}</div><p class="small muted mcap">Page ${pg} · juz ${juzOfPage(pg)} · ${SURAH_NAMES[ps.s]}. Swipe or use the arrow keys to turn pages.</p>`}
function renderTajweed(el,sub){injectFont();tjInject();const tv=view.tv||"rules";sub.textContent="Tajweed";
  const tabs=`<div class="filters tjtabs">${[["rules","Rules"],["search","Search"],["mushaf","Coloured mushaf"]].map(([k,l])=>`<button class="fbtn ${k===tv?"on":""}" data-tv="${k}">${l}</button>`).join("")}</div>`;
  const body=tv==="search"?tjSearchHTML():tv==="mushaf"?tjMushafHTML():view.tr&&TJ_R[view.tr]?tjRuleHTML(view.tr):tjIndexHTML();
  el.innerHTML=`<div class="panel"><h2>Tajweed</h2><p class="small muted">The rules of tajweed with examples from the mushaf.</p>${tabs}</div>${body}`;
  const set=o=>{busy=false;Object.assign(view,o);render(true);if(!("tn" in o)||o.tn===20)scrollTo(0,0)};
  el.querySelectorAll("[data-tv]").forEach(b=>b.onclick=()=>set({tv:b.dataset.tv,tn:20}));
  el.querySelectorAll("[data-tr]").forEach(b=>b.onclick=()=>set({tr:b.dataset.tr,ts:"all",tn:20}));
  el.querySelectorAll("[data-tsc]").forEach(b=>b.onclick=()=>set({ts:b.dataset.tsc,tn:20}));
  const sc=el.querySelector("#tjScope");if(sc)sc.onchange=()=>set({ts:sc.value,tn:20});
  const more=el.querySelector("#tjMore");if(more)more.onclick=()=>set({tn:(view.tn||20)+20});
  const f=el.querySelector("#tjSF");if(f){const q=f.querySelector("#tjQ");q.addEventListener("focus",()=>busy=true);q.addEventListener("blur",()=>busy=false);f.onsubmit=e=>{e.preventDefault();set({tq:q.value.trim(),tn:20})}}
  if(tv==="mushaf"){const pg=view.tp||1,goPg=n=>set({tp:Math.min(604,Math.max(1,n))});
    el.querySelector("#tjNext").onclick=()=>goPg(pg+1);el.querySelector("#tjPrev").onclick=()=>goPg(pg-1);
    el.querySelector("#tjPg").onchange=e=>goPg(Number(e.target.value)||pg);el.querySelector("#tjSurah").onchange=e=>goPg(pageOfAyah(Number(e.target.value),1));
    el.querySelector("#tjZo").onclick=()=>{view.tz=Math.max(0,(view.tz||0)-1);render(true)};el.querySelector("#tjZi").onclick=()=>{view.tz=Math.min(2,(view.tz||0)+1);render(true)};
    const wrap=el.querySelector(".mwrap");let tx=null,ty=null;
    wrap.addEventListener("touchstart",e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
    wrap.addEventListener("touchend",e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;tx=null;if(Math.abs(dx)>70&&Math.abs(dy)<60)goPg(dx>0?pg+1:pg-1)});
    fitPage(el);document.fonts.load('20px "KFGQPC Hafs"').then(()=>fitPage(el)).catch(()=>{})}}
document.addEventListener("keydown",e=>{if(view.name!=="tajweed"||view.tv!=="mushaf"||/INPUT|SELECT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName))return;if(e.key==="ArrowLeft"){view.tp=Math.min(604,(view.tp||1)+1);render(true)}else if(e.key==="ArrowRight"){view.tp=Math.max(1,(view.tp||1)-1);render(true)}});
Object.assign(AR_DICT,{"Tajweed":"التجويد","Rules":"الأحكام","Search":"بحث","Coloured mushaf":"المصحف الملون","← All rules":"← كل الأحكام","Whole Quran":"القرآن كله","Show examples from":"أمثلة من","Most in:":"أكثر السور ورودًا:","Search the mushaf":"ابحث في المصحف","The rules of tajweed with examples from the mushaf.":"أحكام التجويد مع أمثلة من المصحف.","Type a word or part of an ayah; diacritics are not needed. Results show the tajweed colours.":"اكتب كلمة أو جزءًا من آية، ولا حاجة للتشكيل. تظهر النتائج بألوان التجويد.","Nothing found. Try fewer letters.":"لا توجد نتائج. جرّب حروفًا أقل.","No examples here.":"لا توجد أمثلة هنا.","Letters:":"الحروف:","The rules are worked out from the signs written in the Uthmani mushaf text (Hafs). Rules without a colour in the mushaf (such as iẓhār, madd ṭabīʿī, tafkhīm) are shown highlighted on their own pages.":"تُستخرج الأحكام من العلامات المكتوبة في رسم المصحف العثماني (رواية حفص). الأحكام غير الملونة في المصحف (مثل الإظهار والمد الطبيعي والتفخيم) تظهر مظللة في صفحاتها.","Where to look":"مكان البحث"});
