// ---------- mushaf: Madinah page and line layout, KFGQPC Hafs text and font ----------
const MUS=/*MUSDATA*/;
const HAFS_B64="/*HAFSFONT*/";
let MW=null,AEND=null;
const mw=()=>MW||(MW=MUS.w.split(" "));
function aend(){if(AEND)return AEND;const n=mw().length;AEND=new Uint16Array(n);for(let i=0;i<MUS.a.length;i++){const last=(i+1<MUS.a.length?MUS.a[i+1]:n)-1;AEND[last]=i-SURAH_FIRST[AY_SURAH[i]]+1}return AEND}
const bsr=(arr,x)=>{let lo=0,hi=arr.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(arr[m]<=x)lo=m;else hi=m-1}return lo};
const wordAyah=w=>bsr(MUS.a,w);
const wordPlace=w=>{const i=wordAyah(w),s=AY_SURAH[i];return {s,a:i-SURAH_FIRST[s]+1,n:w-MUS.a[i]+1}};
const ayahWord=(s,a)=>MUS.a[SURAH_FIRST[s]+Math.max(1,Math.min(QD.verses[s],a))-1];
const pageOfWord=w=>bsr(MUS.p,w)+1;
const pageOfAyah=(s,a)=>pageOfWord(ayahWord(s,a));
const toAr=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const BASMALA="بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
const FONT_CSS=()=>`@font-face{font-family:"KFGQPC Hafs";src:url(data:font/ttf;base64,${HAFS_B64}) format("truetype");font-display:block}`;
let fontOn=false;function injectFont(){if(fontOn)return;fontOn=true;const st=document.createElement("style");st.textContent=FONT_CSS()+MUSHAF_CSS;document.head.append(st)}
const MUSHAF_CSS=`.mpage{font-family:"KFGQPC Hafs",serif;direction:rtl;line-height:1.95;color:#1b1b1b;background:#fffdf6;border:1px solid #d9cfae;border-radius:6px;padding:.5em .7em .2em;box-sizing:border-box}
.ml{display:flex;justify-content:space-between;align-items:baseline;white-space:nowrap;gap:.1em}
.ml.c{justify-content:center;gap:.28em}
.ml .w{border-radius:.2em;padding:0 .02em;cursor:pointer}
.ml .w.m{background:rgba(220,60,40,.18);box-shadow:inset 0 -.12em 0 #c0392b}
.ml .w.m.k-tajweed{background:rgba(40,110,200,.16);box-shadow:inset 0 -.12em 0 #2a6fc9}
.ml .w.m.k-mix{background:rgba(200,140,0,.2);box-shadow:inset 0 -.12em 0 #c48a00}
.ml .w.m.k-prompt{background:rgba(214,100,20,.2);box-shadow:inset 0 -.12em 0 #d35400}
.ml .w.m.k-hesitate{background:rgba(120,80,170,.16);box-shadow:inset 0 -.12em 0 #7a4fb0}
.ml .w.m.fx{opacity:.55;box-shadow:none}
.ml .w.sel{outline:2px solid #0d6b5e}
.ae{position:relative;display:inline-block;color:#8a6d1f}
.ae b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:600 .36em/1 system-ui,sans-serif;color:#1b1b1b;padding-top:.15em}
.sh{justify-content:center;border:1px solid #c9b47a;border-radius:.3em;background:#f5edd3;margin:.15em 0;line-height:1.6}
.bs{justify-content:center}
.pno{text-align:center;font-size:.55em;color:#7a6a3a;line-height:1.6}`;
function pageHTML(pg,markMap,tj){
  const W=mw(),E=aend(),a=MUS.p[pg-1],b=pg<604?MUS.p[pg]:W.length,c=pg<=2,T=tj?(tjInject(),tjRange(W,w=>!!E[w],a,b,null,null,tj==="all")):null;
  let html="",li=bsr(MUS.l,a);
  for(;li<MUS.l.length&&MUS.l[li]<b;li++){
    const x=MUS.l[li],y=li+1<MUS.l.length?MUS.l[li+1]:W.length;
    const s=MUS.s.indexOf(x);
    if(s>=0){html+=`<div class="ml sh"><span>سُورَةُ ${MUS.n[s]}</span></div>`;if(s!==0&&s!==8)html+=`<div class="ml bs"><span>${BASMALA}</span></div>`}
    let row="";
    for(let w=x;w<y;w++){const mk=markMap&&markMap.get(w);
      row+=`<span class="w${mk?` m k-${mk.k}${mk.fx?" fx":""}`:""}" data-w="${w}">${T?T[w-a]:W[w]}</span>`;
      if(E[w])row+=`<span class="ae">۝<b>${toAr(E[w])}</b></span>`}
    html+=`<div class="ml${c?" c":""}">${row}</div>`}
  return `<div class="mpage">${html}<div class="pno">${toAr(pg)}</div></div>`;
}
// shrink only the lines that are too long for the page width, so the rest stay large
function fitPage(root){root.querySelectorAll(".ml").forEach(l=>{l.style.fontSize="";for(let k=0;k<2;k++){const sw=l.scrollWidth,cw=l.clientWidth;if(sw>cw+1)l.style.fontSize=(parseFloat(l.style.fontSize||"100")*cw/sw*0.995).toFixed(2)+"%"}})}
const FIT_JS=`(${fitPage.toString()})(document);`;

// ---------- mushaf view: tap a word to mark a mistake ----------
const MK_ORDER=["forgot","prompt","mix","tajweed","hesitate","other"];
let MK_KIND="forgot";
const marksOf=st=>marks.filter(m=>m.sid===st.id);
function markMapFor(list){const m=new Map();for(const x of list.slice().sort((a,b)=>(a.t||0)-(b.t||0)))m.set(x.w,{k:x.k,fx:!!x.fixed});return m}
const markPlace=m=>{const p=wordPlace(m.w);return `${SURAH_NAMES[p.s]} ${p.a}`};
const markRange=(list,from,to)=>list.filter(m=>m.date>=from&&m.date<=to);
function renderMushaf(el,sub,st){
  injectFont();
  const la=lastAyahOf(st.pos);
  const pg=Math.min(604,Math.max(1,view.page||(la?pageOfAyah(la.s,la.a2):1)));view.page=pg;
  const flt=view.mf||"all",z=view.mz||0,t=iso(today());
  const all=marksOf(st),shown=all.filter(m=>flt==="all"||(flt==="today"?m.date===t:daysBetween(parse(m.date),today())<30));
  const onPage=shown.filter(m=>pageOfWord(m.w)===pg).sort((a,b)=>a.w-b.w);
  const ps=wordPlace(MUS.p[pg-1]);
  sub.textContent=`Mushaf · ${st.name}`;
  el.innerHTML=`${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel mtools">
    <div class="mnav"><button id="mNext" ${pg>=604?"disabled":""}>← Next</button>
      <label class="inl">Page<input type="number" id="mPg" min="1" max="604" value="${pg}" inputmode="numeric"></label>
      <button id="mPrev" ${pg<=1?"disabled":""}>Previous →</button></div>
    <div class="mnav"><select id="mSurah" aria-label="Go to surah">${SURAH_NAMES.map((n,s)=>`<option value="${s}" ${s===ps.s?"selected":""}>${s+1}. ${n}</option>`).join("")}</select>
      <button id="mHere" class="small">Today's hifz</button>
      <span class="zoom"><button id="mZo" class="small" ${z<=0?"disabled":""} aria-label="Smaller">A−</button><button id="mZi" class="small" ${z>=2?"disabled":""} aria-label="Larger">A+</button></span></div>
    <div class="mkinds" role="radiogroup" aria-label="Mistake kind"><span class="small muted">Tap a word to mark:</span>${MK_ORDER.map(k=>`<label class="mk k-${k}"><input type="radio" name="mk" value="${k}" ${k===MK_KIND?"checked":""}> ${ERR_KINDS[k]}</label>`).join("")}</div>
    <div class="filters">${[["all","All marks"],["30","Last 30 days"],["today","Today"]].map(([k,l])=>`<button class="fbtn ${k===flt?"on":""}" data-mf="${k}">${l}</button>`).join("")}</div>
  </div>
  <div class="mwrap"><div class="mbox${z?" big"+z:""}">${pageHTML(pg,markMapFor(shown))}</div></div>
  <p class="small muted mcap">Page ${pg} · juz ${juzOfPage(pg)} · ${SURAH_NAMES[ps.s]}. ${z?"Large text: long lines continue on the next row; dotted lines show where each mushaf line ends. ":""}Swipe or use the arrow keys to turn pages.</p>
  <div class="panel"><div class="head"><h3>Marks on this page</h3><button id="mPrint">Print mistakes</button></div>
    <div class="log">${onPage.length?onPage.map(m=>markRow(m)).join(""):'<p class="muted">No marks on this page. Tap a word in the page above to mark it.</p>'}</div></div>
  <div class="wsheet" id="wsheet" hidden></div>`;
  wireBack(el);
  const goPg=n=>{view.page=Math.min(604,Math.max(1,n));busy=false;render(true)};
  el.querySelector("#mNext").onclick=()=>goPg(pg+1);el.querySelector("#mPrev").onclick=()=>goPg(pg-1);
  el.querySelector("#mPg").onchange=e=>goPg(Number(e.target.value)||pg);
  el.querySelector("#mSurah").onchange=e=>goPg(pageOfAyah(Number(e.target.value),1));
  el.querySelector("#mHere").onclick=()=>{const p=dayPlan(st,today(),st.pos);goPg(st.pos<TOTAL?pageOfWord(ayahWord(...(()=>{const ps=pieces(st.pos,p.end);return ps.length?[ps[0].s,ps[0].a1]:[0,1]})())):pg)};
  el.querySelector("#mZo").onclick=()=>{view.mz=Math.max(0,z-1);render(true)};el.querySelector("#mZi").onclick=()=>{view.mz=Math.min(2,z+1);render(true)};
  el.querySelectorAll("input[name=mk]").forEach(r=>r.onchange=()=>{MK_KIND=r.value});
  el.querySelectorAll("[data-mf]").forEach(b=>b.onclick=()=>{view.mf=b.dataset.mf;render(true)});
  el.querySelector("#mPrint").onclick=()=>go({name:"mprint",id:st.id});
  const wrap=el.querySelector(".mwrap");let tx=null,ty=null;
  wrap.addEventListener("touchstart",e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
  wrap.addEventListener("touchend",e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;tx=null;if(Math.abs(dx)>70&&Math.abs(dy)<60)goPg(dx>0?pg+1:pg-1)});
  el.querySelectorAll(".mpage .w").forEach(sp=>sp.onclick=()=>{const w=Number(sp.dataset.w);const ex=all.filter(m=>m.w===w);if(ex.length)openSheet(el,st,w);else addMark(st,w,MK_KIND)});
  wireMarkRows(el);
  fitPage(el);document.fonts.load('20px "KFGQPC Hafs"').then(()=>fitPage(el)).catch(()=>{});
}
async function addMark(st,w,k){const tr=k==="tajweed"?tjAutoRule(w):"";try{await db.collection("marks").add({sid:st.id,w,k,...(tr?{tr}:{}),date:iso(today()),t:Date.now()})}catch(_){}}
const markRow=(m,withDate=true)=>`<div class="ev" data-mid="${m.id}"><time>${withDate?fmtShort(m.date):""}</time><div class="evb"><span class="mword">${mw()[m.w]}</span> <b>${markPlace(m)}</b> · <select class="mkind" aria-label="Kind">${MK_ORDER.map(k=>`<option value="${k}" ${k===m.k?"selected":""}>${ERR_KINDS[k]}</option>`).join("")}</select>${m.k==="tajweed"?tjMarkSel(m):""}${m.fixed?' <span class="chip ok">Fixed</span>':""}<input class="mnote" value="${esc(m.note||"")}" placeholder="Note for this mistake"></div><span class="evx"><button class="link small" data-mfix>${m.fixed?"Undo fixed":"Fixed"}</button><button class="link small" data-mdel>Delete</button></span></div>`;
function wireMarkRows(el){el.querySelectorAll("[data-mid]").forEach(r=>{const id=r.dataset.mid,m=marks.find(x=>x.id===id);if(!m)return;const ref=db.doc("marks/"+id);
  r.querySelector(".mkind").onchange=e=>{const k=e.target.value,tr=k==="tajweed"&&!m.tr?tjAutoRule(m.w):"";ref.update({k,...(tr?{tr}:{})}).catch(()=>{})};
  const tr=r.querySelector(".mtr");if(tr){tr.addEventListener("focus",()=>busy=true);tr.addEventListener("blur",()=>busy=false);tr.onchange=e=>{if(e.target.value==="__all"){tr.innerHTML=tjMarkOpts({...m,tr:""},true);tr.focus();return}busy=false;ref.update({tr:e.target.value}).catch(()=>{})}}
  const n=r.querySelector(".mnote");n.addEventListener("focus",()=>busy=true);n.onchange=e=>{busy=false;ref.update({note:e.target.value.trim()}).catch(()=>{})};n.addEventListener("blur",()=>{busy=false});
  r.querySelector("[data-mfix]").onclick=()=>ref.update({fixed:!m.fixed}).catch(()=>{});
  const d=r.querySelector("[data-mdel]");d.onclick=()=>{if(d.dataset.confirm!=="1"){d.dataset.confirm="1";d.textContent="Confirm delete?";return}ref.delete().catch(()=>{})}})}
function openSheet(el,st,w){
  const sh=el.querySelector("#wsheet"),p=wordPlace(w),list=marksOf(st).filter(m=>m.w===w).sort((a,b)=>b.date.localeCompare(a.date));
  sh.hidden=false;busy=true;
  sh.innerHTML=`<div class="head"><div><span class="mword big">${mw()[w]}</span> <b>${SURAH_NAMES[p.s]} ${p.a}</b> <span class="small muted">word ${p.n}</span></div><button class="link" id="wsClose">Close</button></div>
    <p class="small muted">This word was marked ${list.length} ${list.length===1?"time":"times"}.</p>
    <div class="log">${list.map(m=>markRow(m)).join("")}</div>
    <div class="actions"><span class="small muted">Mark it again as:</span>${MK_ORDER.map(k=>`<button class="small mk k-${k}" data-again="${k}">${ERR_KINDS[k]}</button>`).join("")}</div>`;
  sh.querySelector("#wsClose").onclick=()=>{sh.hidden=true;busy=false;render(true)};
  sh.querySelectorAll("[data-again]").forEach(b=>b.onclick=async()=>{await addMark(st,w,b.dataset.again);busy=false;render(true)});
  wireMarkRows(sh);
}

// ---------- print mistakes ----------
function mistakesIn(st,from,to){
  const W=mw(),out=[];
  for(const m of markRange(marksOf(st),from,to)){const p=wordPlace(m.w);out.push({date:m.date,s:p.s,a:p.a,word:W[m.w],k:m.k,tr:m.tr||"",note:m.note||"",fixed:!!m.fixed,w:m.w})}
  for(const e of events)if(e.sid===st.id&&e.date>=from&&e.date<=to&&Array.isArray(e.errs))for(const x of e.errs)out.push({date:e.date,s:x.s,a:x.a,word:"",k:x.k,note:"",w:null});
  return out.sort((x,y)=>x.s-y.s||x.a-y.a||x.date.localeCompare(y.date))}
function rowMistakesIn(st,from,to){const map=new Map();
  for(const e of events)if(e.sid===st.id&&e.date>=from&&e.date<=to)for(const r of [...(e.revRows||[]),...(e.hifzRows||[])])if(r.m>0){const k=r.s;const v=map.get(k)||{s:r.s,m:0,parts:[]};v.m+=r.m;v.parts.push(`${fmtShort(e.date)}: ${pieceText(r)} (${r.m})`);map.set(k,v)}
  return [...map.values()].sort((a,b)=>b.m-a.m)}
function notesIn(st,from,to){return events.filter(e=>e.sid===st.id&&e.date>=from&&e.date<=to&&(e.type==="note"||e.note)).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>({date:e.date,text:e.text||e.note}))}
function mistakesHTML(st,from,to,o){
  const ms=mistakesIn(st,from,to),rows=rowMistakesIn(st,from,to),notes=notesIn(st,from,to);
  let h="";
  if(o.list){h+=`<h2>Mistakes</h2>${ms.length?`<table class="mlist"><tr><th>Place</th><th>Word</th><th>Kind</th><th>Date</th><th>Note</th></tr>${ms.map(x=>`<tr><td>${SURAH_NAMES[x.s]} ${x.a}</td><td class="mword">${x.word}</td><td>${ERR_KINDS[x.k]||x.k}${x.tr&&TJ_R[x.tr]?" · "+TJ_R[x.tr][1]:""}${x.fixed?" (fixed)":""}</td><td>${fmtShort(x.date)}</td><td>${esc(x.note)}</td></tr>`).join("")}</table>`:'<p class="muted">No mistakes marked in this period.</p>'}`;
    if(rows.length)h+=`<h2>Review mistakes by surah</h2><table><tr><th>Surah</th><th>Mistakes</th><th>When</th></tr>${rows.map(r=>`<tr><td>${SURAH_NAMES[r.s]}</td><td>${r.m}</td><td>${r.parts.join("<br>")}</td></tr>`).join("")}</table>`}
  if(o.notes)h+=`<h2>Teacher's notes</h2>${notes.length?notes.map(n=>`<p>${fmtShort(n.date)}: ${esc(n.text)}</p>`).join(""):'<p class="muted">No notes in this period.</p>'}`;
  let pages=[];
  if(o.pages){const set=new Set(ms.map(x=>x.w!=null?pageOfWord(x.w):pageOfAyah(x.s,x.a)));pages=[...set].sort((a,b)=>a-b).slice(0,40)}
  return {h,pages,count:ms.length,mm:markMapFor(markRange(marksOf(st),from,to))}}
function renderMPrint(el,sub,st){
  injectFont();
  const t=iso(today()),from=view.from||t.slice(0,8)+"01",to=view.to||t,o=view.po||{list:true,notes:true,pages:false};
  const r=mistakesHTML(st,from,to,o);
  sub.textContent="Print mistakes · "+st.name;
  const d0=today(),pre=(a,b,l)=>`<button type="button" class="fbtn ${a===from&&b===to?"on":""}" data-rf="${a}" data-rt="${b}">${l}</button>`;
  el.innerHTML=`${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel"><h2>Mistakes to review · ${esc(st.name)}</h2>
    <div class="fields"><label>From<input type="date" id="r_from" value="${from}"></label><label>To<input type="date" id="r_to" value="${to}"></label></div>
    <div class="filters">${pre(t,t,"Today")}${pre(iso(addDays(d0,-6)),t,"Last 7 days")}${pre(t.slice(0,8)+"01",t,"This month")}${pre(st.start||"2000-01-01",t,"Since the start")}</div>
    <div class="days"><label><input type="checkbox" id="o_list" ${o.list?"checked":""}> List of mistakes</label><label><input type="checkbox" id="o_notes" ${o.notes?"checked":""}> My notes</label><label><input type="checkbox" id="o_pages" ${o.pages?"checked":""}> Mushaf pages with the mistakes</label></div>
    <div class="actions"><button class="primary" id="p_dl" ${downloads?"":"hidden"}>Download PDF</button><span class="small muted" id="p_msg"></span></div></div>
  <div class="panel report">${r.h||'<p class="muted">Pick at least one thing to print.</p>'}${r.pages.length?`<h2>Mushaf pages (${r.pages.length})</h2>`+r.pages.map(p=>`<div class="mbox pbox">${pageHTML(p,r.mm)}</div>`).join(""):""}</div>`;
  wireBack(el);fitPage(el);document.fonts.load('20px "KFGQPC Hafs"').then(()=>fitPage(el)).catch(()=>{});
  const setR=(a,b)=>{if(a&&b&&b<a)[a,b]=[b,a];view.from=a||from;view.to=b||to;render(true)};
  el.querySelector("#r_from").onchange=e=>setR(e.target.value,el.querySelector("#r_to").value);
  el.querySelector("#r_to").onchange=e=>setR(el.querySelector("#r_from").value,e.target.value);
  el.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>setR(b.dataset.rf,b.dataset.rt));
  ["list","notes","pages"].forEach(k=>el.querySelector("#o_"+k).onchange=e=>{view.po={...o,[k]:e.target.checked};render(true)});
  el.querySelector("#p_dl").onclick=()=>{const df=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}),label=from===to?df.format(parse(from)):`${df.format(parse(from))} – ${df.format(parse(to))}`;
    const pagesH=r.pages.map(p=>`<div class="mbox pbox">${pageHTML(p,r.mm)}</div>`).join("");
    saveFile(`mistakes-${fileSafe(st.name)}-${from}_${to}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Mistakes - ${esc(st.name)} - ${label}</title><style>${PRINT_CSS}${r.pages.length||r.count?FONT_CSS():""}${MUSHAF_CSS}.mword{font-family:"KFGQPC Hafs",serif;font-size:20px}.mbox{width:150mm;max-width:100%;container-type:inline-size;margin:0 auto 8mm;break-inside:avoid;page-break-inside:avoid}.mpage{font-size:3.7cqw}.mlist td{vertical-align:middle}</style></head><body><h1>Mistakes to review · ${esc(st.name)}</h1><p class="muted">${label}</p>${r.h}${pagesH?`<h2 style="page-break-before:always">Mushaf pages</h2>${pagesH}`:""}<script>document.fonts.ready.then(()=>{${FIT_JS}})<\/script></body></html>`,el.querySelector("#p_msg"))};
}
document.addEventListener("keydown",e=>{if(view.name!=="mushaf"||/INPUT|SELECT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName))return;if(e.key==="ArrowLeft"){view.page=Math.min(604,(view.page||1)+1);render(true)}else if(e.key==="ArrowRight"){view.page=Math.max(1,(view.page||1)-1);render(true)}});
