// ---------- v28: ideas taken from Tarteel (test mode, mistake kinds, smart review, strength, buddy, alerts, class map, session message) ----------
const keepOrder=fn=>{try{return fn()}finally{const cur=allStudents.find(x=>x.id===view.id);if(cur)useOrder(cur)}};
const rr1=v=>Math.round(v*10)/10;
const ayEndWord=(s,a)=>{const i=SURAH_FIRST[s]+a-1;return (i+1<MUS.a.length?MUS.a[i+1]:mw().length)-1};
const flameChip=st=>{try{const n=streakOf(st).cur;return n>=2?` <span class="flamec" title="Ready ${n} classes in a row">${FLAME}${n}</span>`:""}catch(_){return ""}};

// ----- memorized ayahs of a student: [{s,a1,a2}] -----
function memAyahs(st){return keepOrder(()=>{const fr=surahFrac(st),la=lastAyahOf(st.pos),out=[];
  for(let s=0;s<114;s++){if(fr[s]>=0.98)out.push({s,a1:1,a2:QD.verses[s]});else if(la&&la.s===s&&fr[s]>0.005)out.push({s,a1:1,a2:la.a2})}
  return out})}

// ===== 1 + 5. test mode: hidden mushaf from a random place =====
const TK=[["forgot","Forgot"],["prompt","Prompted"],["mix","Mixed up"],["tajweed","Tajweed"],["hesitate","Self-corrected"]];
function newTest(st,len){const m=memAyahs(st);if(!m.length)return null;
  const tot=m.reduce((t,r)=>t+r.a2-r.a1+1,0);let k=Math.floor(Math.random()*tot);let r=m[0];
  for(const x of m){const n=x.a2-x.a1+1;if(k<n){r=x;break}k-=n}
  const a=r.a1+k,b=Math.min(r.a2,a+len-1);const w0=ayahWord(r.s,a),w1=ayEndWord(r.s,b);
  return {s:r.s,a1:a,a2:b,len,w0,w1,rev:w0-1,ids:{},kind:"forgot",saved:false}}
function renderTestMode(el,sub,st){SIM_REDRAW=()=>render(true);
  injectFont();
  if(!view.tm||view.tm.sid!==st.id){const t=newTest(st,5);view.tm=t?{...t,sid:st.id}:null}
  const T=view.tm;sub.textContent="Test mode · "+st.name;
  if(!T){el.innerHTML=`${backBtn(esc(st.name),{name:"student",id:st.id})}<div class="panel empty"><p>Nothing memorized yet to test.</p></div>`;wireBack(el);return}
  const pg=pageOfWord(Math.min(T.rev+1,T.w1)),marked=Object.keys(T.ids).map(Number);
  const mm=new Map();for(const w of marked)mm.set(w,{k:T.ids[w].k,fx:false});
  const total=T.w1-T.w0+1,shown=Math.max(0,Math.min(T.rev,T.w1)-T.w0+1),done=T.rev>=T.w1;
  const kinds={};for(const w of marked){const k=T.ids[w].k;kinds[k]=(kinds[k]||0)+1}
  const nm=marked.filter(w=>T.ids[w].k!=="hesitate").length;
  el.innerHTML=`${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel tm">
   <div class="head"><h3>🎲 Start here: ${esc(SURAH_NAMES[T.s])}, ayah ${T.a1}</h3><button class="sm" id="tmNew">New place ↻</button></div>
   <p class="small">The student recites <b>${esc(SURAH_NAMES[T.s])} ${T.a1}${T.a2>T.a1?"–"+T.a2:""}</b> from memory. Length <select id="tmLen">${[1,3,5,10].map(n=>`<option value="${n}" ${n===T.len?"selected":""}>${n} ${n===1?"ayah":"ayahs"}</option>`).join("")}</select></p>
   <div class="tmk"><span class="small muted">Tap a shown word to mark it as:</span>${TK.map(([k,l])=>`<button type="button" class="sm mk k-${k}${k===T.kind?" on":""}" data-tk="${k}">${l}</button>`).join("")}${simToggleBtn()}</div>
  </div>
  <div class="mwrap"><div class="mbox tmode">${pageHTML(pg,mm,null,st)}</div></div>
  <div class="actions tmbar"><button class="primary" id="tmW" ${done?"disabled":""}>Next word</button><button id="tmA" ${done?"disabled":""}>Next ayah</button><button id="tmAll" ${done?"disabled":""}>Show all</button></div>
  <div class="panel tight"><div class="kv"><span>Shown</span><b>${shown} of ${total} words</b></div>
   <div class="kv"><span>Mistakes</span><b>${nm}${marked.length?` <span class="small muted">(${TK.filter(([k])=>kinds[k]).map(([k,l])=>`${kinds[k]} ${l.toLowerCase()}`).join(", ")})</span>`:""}</b></div>
   <p class="small muted">Tap a grey word to show everything up to it. Marks go to the mushaf and the mistakes list. Self-corrected is not counted as a mistake.</p>
   <div class="actions"><button class="primary" id="tmSave" ${T.saved?"disabled":""}>${T.saved?"✓ Saved to history":"Save result to history"}</button><button id="tmNext">Another test</button></div></div>`;
  wireBack(el);
  const pageEl=el.querySelector(".mpage");
  pageEl.querySelectorAll(".w").forEach(sp=>{const w=Number(sp.dataset.w);
    if(w<T.w0)sp.classList.add("pre");else if(w>T.w1)sp.classList.add("hid","post");else if(w>T.rev)sp.classList.add("hid")});
  pageEl.querySelectorAll(".ae").forEach(a=>{const p=a.previousElementSibling;if(p&&p.classList.contains("hid"))a.classList.add("hid")});
  const re=()=>{busy=false;render(true)};
  const setRev=w=>{T.rev=Math.max(T.rev,Math.min(T.w1,w));re()};
  el.querySelector("#tmW").onclick=()=>setRev(T.rev+1);
  el.querySelector("#tmA").onclick=()=>{const p=wordPlace(Math.min(T.w1,T.rev+1));setRev(ayEndWord(p.s,p.a))};
  el.querySelector("#tmAll").onclick=()=>setRev(T.w1);
  el.querySelectorAll("[data-tk]").forEach(b=>b.onclick=()=>{T.kind=b.dataset.tk;re()});
  const fresh=len=>{const t=newTest(st,len||T.len);view.tm=t?{...t,sid:st.id}:null;re()};
  el.querySelector("#tmNew").onclick=()=>fresh();el.querySelector("#tmNext").onclick=()=>fresh();
  el.querySelector("#tmLen").onchange=e=>fresh(Number(e.target.value));
  pageEl.querySelectorAll(".w").forEach(sp=>sp.onclick=async()=>{const w=Number(sp.dataset.w);if(w<T.w0||w>T.w1)return;
    if(w>T.rev)return setRev(w);
    const ex=T.ids[w];
    if(ex){delete T.ids[w];re();try{await db.doc("marks/"+ex.id).delete()}catch(_){}return}
    T.ids[w]={k:T.kind,id:null};re();
    try{const ref=await db.collection("marks").add({sid:st.id,w,k:T.kind,date:iso(today()),t:Date.now(),src:"test"});if(T.ids[w])T.ids[w].id=ref&&ref.id}catch(_){}});
  el.querySelector("#tmSave").onclick=async()=>{const b=el.querySelector("#tmSave");b.disabled=true;
    const d={sid:st.id,type:"rtest",date:iso(today()),t:Date.now(),s:T.s,a1:T.a1,a2:T.a2,mistakes:nm,kinds};
    try{const ref=await db.collection("events").add(d);T.saved=true;undoToast("Saved to history",async()=>{if(ref&&ref.id)await db.doc("events/"+ref.id).delete();T.saved=false})}catch(_){b.disabled=false}re()};
  fitPage(el);document.fonts.load('20px "KFGQPC Hafs"').then(()=>fitPage(el)).catch(()=>{});
}
const mkText=o=>{if(!o)return "";const p=TK.concat([["other","other"]]).filter(([k])=>o[k]).map(([k,l])=>`${o[k]} ${l.toLowerCase()}`);return p.length?` (${p.join(", ")})`:""};
function rtestBody(e){return `<b>Random test:</b> ${esc(SURAH_NAMES[e.s])} ${e.a1}${e.a2>e.a1?"–"+e.a2:""} · ${e.mistakes||0} ${e.mistakes===1?"mistake":"mistakes"}${esc(mkText(e.kinds))}`}

// ===== 3. mistake kinds for the quick session counters =====
const QK=[["forgot","Forgot"],["prompt","Prompted"],["mix","Mixed up"],["tajweed","Tajweed"],["other","Other"],["hesitate","Self-corrected"]];
const kindSum=o=>QK.reduce((t,[k])=>t+(k==="hesitate"?0:Number(o[k])||0),0);
function kindRows(o){return QK.map(([k,l])=>k==="other"&&!o.other?"":`<div class="qcnt qk k-${k}"><span>${l}${k==="hesitate"?' <small class="muted">not counted</small>':""}</span><span class="qctl"><button type="button" class="qpm" data-k="${k}" data-d="-1" aria-label="One less">−</button><b class="qnum">${o[k]||0}</b><button type="button" class="qpm" data-k="${k}" data-d="1" aria-label="One more">+</button></span></div>`).join("")}
function kindsFrom(dupMk,total){const o={forgot:0,prompt:0,mix:0,tajweed:0,other:0,hesitate:0};if(dupMk)for(const k in o)o[k]=Number(dupMk[k])||0;const rest=(Number(total)||0)-kindSum(o);if(rest>0)o.other+=rest;return o}
const cleanKinds=o=>{const r={};for(const[k]of QK)if(Number(o[k]))r[k]=Number(o[k]);return Object.keys(r).length?r:null};

// ===== 7. smart review: what to add today =====
function lastSeenMap(st){const m=new Array(114).fill(null);
  for(const e of events){if(e.sid!==st.id)continue;let rows=[...(e.revRows||[]),...(e.hifzRows||[])];
    if(e.type==="session"&&e.from!=null&&e.to!=null&&!(e.hifzRows||[]).length)try{rows=rows.concat(pieces(e.from,e.to))}catch(_){}
    if(e.type==="rtest"&&e.s!=null)rows.push({s:e.s});/* buddy recitations are not teacher-heard: they do not reset "last heard" */
    for(const r of rows)if(r.s!=null&&(!m[r.s]||m[r.s]<e.date))m[r.s]=e.date}
  return m}
const REV_EVERY={few:7,bad:3,weak:5,good:10,strong:14,stale:7};
function smartReview(st,exclude){return keepOrder(()=>{useOrder(st);const fr=surahFrac(st),S=surahStrength(st),seen=lastSeenMap(st),t=today(),ex=new Set(exclude||[]);
  const fo=st.focus&&Array.isArray(st.focus.list)?st.focus:null,out=[];
  for(let s=0;s<114;s++){if(fr[s]<0.98||ex.has(s))continue;if(SURAH_B[s]-SURAH_A[s]>48)continue;
    const lv=strengthLevel(S[s]),days=seen[s]?daysBetween(parse(seen[s]),t):(st.start?Math.max(7,daysBetween(parse(st.start),t)):30);
    let score=days/REV_EVERY[lv];const chosen=fo&&fo.list.includes(s)&&!(seen[s]&&seen[s]>fo.set);
    if(chosen)score+=10;if(score<1)continue;
    if(!chosen&&lv==="stale"&&!seen[s]){out.push({s,lv,score,why:"Not recorded in the app yet"});continue}
    const why=[chosen?"You chose it":STR_TEXT[lv]];if(S[s]&&S[s].m)why.push(`${rr1(S[s].rate)} mistakes / page`);why.push(seen[s]?(days===0?"today":days===1?"1 day ago":`${days} days ago`):"not recorded yet");
    out.push({s,lv,score,why:why.join(" · ")})}
  return out.sort((a,b)=>b.score-a.score).slice(0,6)})}
const LV_DOT={few:"#c9d3cf",bad:"var(--bad,#b3342b)",weak:"#c8860b",good:"#7fb069",strong:"#2e7d4f",stale:"#9aa5a3"};
function smartBox(all,rows){const has=new Set(rows.map(r=>r.s)),list=all.filter(x=>!has.has(x.s)).slice(0,3);if(!list.length)return "";
  return `<div class="qsmart"><div class="qh2">Suggested to add today <span class="sbadge">SMART</span></div>${list.map(x=>`<div class="qsr"><span><b><i class="ldot" style="background:${LV_DOT[x.lv]}"></i>${esc(SURAH_NAMES[x.s])}</b><small>${esc(x.why)}</small></span><button type="button" class="sm" data-qsa="${x.s}">＋ Add</button></div>`).join("")}<p class="small muted">Weak surahs come back sooner, strong ones wait longer.</p></div>`}

// ===== 6. surah strength list on the student page =====
function strengthPanel(st){return keepOrder(()=>{const fr=surahFrac(st),S=surahStrength(st),rows=[];
  for(let s=0;s<114;s++){if(fr[s]<0.005)continue;rows.push({s,lv:strengthLevel(S[s]),x:S[s]})}
  if(!rows.length)return "";
  const bad=rows.filter(r=>r.lv==="bad"||r.lv==="weak").sort((a,b)=>b.x.rate-a.x.rate),good=rows.filter(r=>r.lv==="good"||r.lv==="strong"),stale=rows.filter(r=>r.lv==="stale"),few=rows.filter(r=>r.lv==="few");
  const fo=st.focus&&Array.isArray(st.focus.list)&&st.focus.list.length?st.focus:null;
  const row=r=>`<div class="srow"><span><i class="ldot" style="background:${LV_DOT[r.lv]}"></i>${esc(SURAH_NAMES[r.s])}</span><span class="small muted">${rr1(r.x.rate)} mistakes / page</span></div>`;
  return `<div class="panel tight strp"><div class="head"><h3>Surah strength</h3><span class="small muted">last 60 days</span></div>
   ${bad.length?bad.slice(0,6).map(row).join(""):'<p class="small">No weak surahs right now. ✓</p>'}
   ${good.length?`<div class="srow"><span><i class="ldot" style="background:${LV_DOT.strong}"></i>${good.length} ${good.length===1?"surah":"surahs"} strong or good</span><span class="small muted">under 1.5 / page</span></div>`:""}
   ${few.length?`<div class="srow"><span><i class="ldot" style="background:${LV_DOT.few}"></i>${few.length} too little heard to judge</span><span class="small muted">${few.slice(0,3).map(r=>esc(SURAH_NAMES[r.s])).join(", ")}${few.length>3?"…":""}</span></div>`:""}
   ${stale.length?`<div class="srow"><span><i class="ldot" style="background:${LV_DOT.stale}"></i>${stale.length} not heard in 60 days</span><span class="small muted">${stale.slice(0,3).map(r=>esc(SURAH_NAMES[r.s])).join(", ")}${stale.length>3?"…":""}</span></div>`:""}
   <div class="actions">${bad.length?`<button class="sm primary" id="stFocus">Add weak ones to next review</button>`:""}${fo?`<span class="small">✓ Next review will suggest: ${fo.list.map(s=>esc(SURAH_NAMES[s])).join(", ")} <button class="link sm" id="stFocusX">clear</button></span>`:""}</div></div>`})}
function wireStrength(el,st){const b=el.querySelector("#stFocus");
  if(b)b.onclick=async()=>{const list=keepOrder(()=>{const S=surahStrength(st),fr=surahFrac(st),o=[];for(let s=0;s<114;s++)if(fr[s]>=0.005&&["bad","weak"].includes(strengthLevel(S[s])))o.push(s);return o});
    try{await db.doc("students/"+st.id).update({focus:{list,set:iso(today())}});undoToast("Added to next review",()=>db.doc("students/"+st.id).update({focus:null}))}catch(_){}};
  const x=el.querySelector("#stFocusX");if(x)x.onclick=()=>db.doc("students/"+st.id).update({focus:null}).catch(()=>{})}

// ===== 15. buddy recitation =====
function buddyPairs(c){const t=iso(today());let kids=students.filter(s=>s.cls===c.id);
  const here=kids.filter(s=>events.some(e=>e.type==="session"&&e.sid===s.id&&e.date===t&&attended(e)));if(here.length>=2)kids=here;
  const lvl=keepOrder(()=>kids.map(s=>{useOrder(s);return {st:s,mem:(Number(s.pos)||0)+PREV_LINES}}));
  lvl.sort((a,b)=>b.mem-a.mem);let seed=view.bseed||0;
  const half=Math.floor(lvl.length/2),strong=lvl.slice(0,half),weak=lvl.slice(half);
  if(seed){const rot=seed%Math.max(1,weak.length);weak.push(...weak.splice(0,rot))}
  const pairs=strong.map((h,i)=>({h:h.st,r:weak[i].st}));const left=weak.slice(strong.length).map(x=>x.st);
  return {pairs,left}}
function buddyPortion(st){return keepOrder(()=>{const sm=smartReview(st,[]);if(sm.length)return {s:sm[0].s,why:sm[0].why};
  const la=lastAyahOf(st.pos);return la?{s:la.s,why:"latest hifz"}:null})}
function buddyPlanRows(st){return keepOrder(()=>{useOrder(st);const p=dayPlan(st,today(),st.pos),seen=new Set(),out=[];
  for(const r of [...(p.nearP||[]),...(p.farP||[])]){const k=r.s+":"+r.a1+":"+r.a2;if(seen.has(k))continue;seen.add(k);out.push({s:r.s,a1:r.a1,a2:r.a2,on:false,m:0})}
  if(!out.length)for(const x of smartReview(st,[]).slice(0,4))out.push({s:x.s,a1:1,a2:QD.verses[x.s],on:false,m:0});
  return out})}
const rowTxt=r=>`${SURAH_NAMES[r.s]}${r.a1===1&&r.a2===QD.verses[r.s]?"":` ${r.a1}–${r.a2}`}`;
function renderBuddy(el,sub){const c=classes.find(x=>x.id===view.cls)||liveClass()||classes[0];
  if(!c){view={name:"today"};return render(true)}
  sub.textContent="Buddy recitation · "+c.name;const t=view.bdate||iso(today());
  const kids=students.filter(s=>s.cls===c.id).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const B=view.bf||(view.bf={r:"",h:"",rows:[],add:false});
  const rSt=kids.find(s=>s.id===B.r);
  const mem=rSt?memAyahs(rSt).map(x=>x.s):[];
  const recs=events.filter(e=>e.type==="buddy"&&e.date===t&&kids.some(k=>k.id===e.sid)).sort((a,b)=>(a.t||0)-(b.t||0));
  const nm=id=>{const s=allStudents.find(x=>x.id===id);return s?s.name:"?"};
  const sug=buddyPairs(c).pairs,on=B.rows.filter(r=>r.on);
  el.innerHTML=`${backBtn("Today",{name:"today",cls:c.id})}
  ${classes.length>1?`<div class="filters">${classes.map(x=>`<button class="fbtn ${x.id===c.id?"on":""}" data-bcls="${x.id}">${esc(x.name)}</button>`).join("")}</div>`:""}
  <div class="panel"><div class="head"><h2>Buddy recitation</h2><input type="date" id="bDate" value="${t}" aria-label="Date"></div>
   <div class="bform">
    <label>Recites<select id="bR"><option value="">Choose student</option>${kids.map(s=>`<option value="${s.id}" ${s.id===B.r?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label>
    <label>To (listens)<select id="bH"><option value="">Choose student</option>${kids.filter(s=>s.id!==B.r).map(s=>`<option value="${s.id}" ${s.id===B.h?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label>
    ${rSt?`<div class="brows"><div class="qh2">${esc(rSt.name)}'s review today · tick what he recited</div>
      ${B.rows.length?B.rows.map((r,i)=>`<div class="brow${r.on?" on":""}"><label><input type="checkbox" data-bon="${i}" ${r.on?"checked":""}> ${esc(rowTxt(r))}</label><span class="qctl"><button type="button" class="qpm" data-bm="${i}" data-d="-1" aria-label="One less">−</button><b class="qnum">${r.m}</b><button type="button" class="qpm" data-bm="${i}" data-d="1" aria-label="One more">+</button></span></div>`).join(""):'<p class="small muted">No review planned today.</p>'}
      ${B.add?`<div class="bayah"><label>Surah<select id="bXs">${[...new Set([...mem,...SURAH_NAMES.map((_,s)=>s)])].map(s=>`<option value="${s}">${s+1}. ${esc(SURAH_NAMES[s])}${mem.includes(s)?"":" (not memorized)"}</option>`).join("")}</select></label></div>
        <div class="bayah"><label>From ayah<input type="number" id="bXa" min="1" inputmode="numeric" placeholder="1"></label><label>To ayah<input type="number" id="bXb" min="1" inputmode="numeric" placeholder="end"></label></div>
        <div class="actions"><button type="button" class="sm primary" id="bXok">Add</button><button type="button" class="sm" id="bXno">Cancel</button></div>`:`<button type="button" class="sm" id="bAdd">＋ Another surah</button>`}</div>`:'<p class="small muted">Choose who recites, then who listens. His review for today appears here.</p>'}
    <button class="primary" id="bSave" ${B.r&&B.h&&on.length?"":"disabled"}>Save${on.length?` · ${on.length} ${on.length===1?"surah":"surahs"}, ${on.reduce((t,r)=>t+r.m,0)} mistakes`:""}</button> <span class="small muted" id="bMsg"></span>
   </div>
   ${sug.length?`<p class="small muted" style="margin-top:10px">Quick pick (stronger listens to one who needs help): ${sug.map(({h,r})=>`<button type="button" class="link sm" data-bsug="${r.id}|${h.id}">${esc(r.name)} → ${esc(h.name)}</button>`).join(" · ")}</p>`:""}
  </div>
  <div class="panel"><div class="head"><h3>${t===iso(today())?"Today":fmtShort(t)} · ${recs.length} ${recs.length===1?"recitation":"recitations"}</h3></div>
   ${recs.length?recs.map(e=>`<div class="brec"><span><b>${esc(nm(e.sid))}</b> → <b>${esc(e.helperName||nm(e.helper))}</b><br><small>${esc(buddyRowsText(e))}</small></span><button class="link small del" data-bdel="${e.id}">Delete</button></div>`).join(""):'<p class="small muted">Nothing recorded yet.</p>'}
   <p class="small muted">Saved in each student's history. When you record his session, these surahs show as already read. The listener gets +1 point once a day.</p></div>`;
  wireBack(el);
  const re=()=>{busy=false;render(true)};
  el.querySelectorAll("[data-bcls]").forEach(b=>b.onclick=()=>{view.bf=null;go({name:"buddy",cls:b.dataset.bcls})});
  el.querySelector("#bDate").onchange=e=>{view.bdate=e.target.value||null;re()};
  const setR=id=>{B.r=id;if(B.h===B.r)B.h="";const s=allStudents.find(x=>x.id===id);B.rows=s?buddyPlanRows(s):[];B.add=false};
  el.querySelector("#bR").onchange=e=>{setR(e.target.value);re()};
  el.querySelector("#bH").onchange=e=>{B.h=e.target.value;re()};
  el.querySelectorAll("[data-bon]").forEach(x=>x.onchange=()=>{const r=B.rows[Number(x.dataset.bon)];r.on=x.checked;re()});
  el.querySelectorAll("[data-bm]").forEach(x=>x.onclick=()=>{const r=B.rows[Number(x.dataset.bm)];r.m=Math.max(0,r.m+Number(x.dataset.d));if(Number(x.dataset.d)>0)r.on=true;re()});
  const ad=el.querySelector("#bAdd");if(ad)ad.onclick=()=>{B.add=true;re()};
  const xn=el.querySelector("#bXno");if(xn)xn.onclick=()=>{B.add=false;re()};
  const xo=el.querySelector("#bXok");if(xo){["#bXa","#bXb"].forEach(id=>{const i=el.querySelector(id);i.addEventListener("focus",()=>busy=true);i.addEventListener("blur",()=>busy=false)});
    xo.onclick=()=>{const s=Number(el.querySelector("#bXs").value),v=QD.verses[s];const a1=Math.max(1,Math.min(v,Number(el.querySelector("#bXa").value)||1)),a2=Math.max(a1,Math.min(v,Number(el.querySelector("#bXb").value)||v));B.rows.push({s,a1,a2,on:true,m:0});B.add=false;re()}}
  el.querySelectorAll("[data-bsug]").forEach(b=>b.onclick=()=>{const[r,h]=b.dataset.bsug.split("|");setR(r);B.h=h;re()});
  el.querySelector("#bSave").onclick=async()=>{const r=allStudents.find(s=>s.id===B.r),h=allStudents.find(s=>s.id===B.h),rows=B.rows.filter(x=>x.on).map(({s,a1,a2,m})=>({s,a1,a2,m}));if(!r||!h||!rows.length)return;
    const d={sid:r.id,type:"buddy",helper:h.id,helperName:h.name,rows,s:rows[0].s,a1:rows[0].a1,a2:rows[0].a2,mistakes:rows.reduce((t,x)=>t+x.m,0),date:t,t:Date.now()};
    try{const ref=await db.collection("events").add(d);
      if(!events.some(e=>e.type==="points"&&e.sid===h.id&&e.date===t&&e.buddy))await db.collection("events").add({sid:h.id,type:"points",pts:1,reason:`Listened to ${r.name} in buddy review`,date:t,t:Date.now(),buddy:true});
      undoToast("Saved",async()=>{if(ref&&ref.id)await db.doc("events/"+ref.id).delete()});
      B.h="";B.rows.forEach(x=>{if(x.on){x.on=false;x.done=true}x.m=0})}catch(_){el.querySelector("#bMsg").textContent="Not saved. Try again."}re()};
  el.querySelectorAll("[data-bdel]").forEach(b=>b.onclick=async()=>{if(b.dataset.confirm!=="1"){b.dataset.confirm="1";b.textContent="Confirm delete?";return}
    const e=events.find(x=>x.id===b.dataset.bdel);if(!e)return;try{await db.doc("events/"+e.id).delete();undoToast("Deleted",()=>db.doc("events/"+e.id).set(plain(e)))}catch(_){}})}
const buddyRows=e=>Array.isArray(e.rows)&&e.rows.length?e.rows:e.s!=null?[{s:e.s,a1:e.a1||1,a2:e.a2||QD.verses[e.s],m:e.mistakes}]:[];
const buddyRowsText=e=>{const r=buddyRows(e);if(!r.length)return buddyMist(e);return r.map(x=>`${rowTxt(x)}${x.m!=null?` · ${x.m} ${x.m===1?"mistake":"mistakes"}`:""}`).join(" | ")};
const buddyMist=e=>e.mistakes!=null?`${e.mistakes} ${e.mistakes===1?"mistake":"mistakes"}`:({good:"Good",some:"Some mistakes",nr:"Not ready"})[e.res]||"";
function buddyBody(e){return `<b>Buddy review</b> to ${esc(e.helperName||"a classmate")}: ${esc(buddyRowsText(e))}`}

// ===== 16. smarter alerts =====
function extraAlerts(st){const out=[],t=today(),ses=events.filter(e=>e.sid===st.id&&e.type==="session"&&attended(e)).sort((a,b)=>b.date.localeCompare(a.date));
  const rec=ses.filter(e=>daysBetween(parse(e.date),t)<14);
  if(rec.length>=3&&rec.every(e=>!(Number(e.hifzLines)>0))&&st.pos<TOTAL-0.05&&!breakFor(st,t)&&!rec.every(e=>e.hifzNR))out.push([1,"warn","Stuck: no new hifz for 2 weeks"]);
  const pg=e=>((Number(e.hifzLines)||0)+(e.revRows||[]).reduce((s,r)=>s+rowLines(r),0))/LINES,mi=e=>(Number(e.hifzMist)||0)+(Number(e.revMist)||0);
  const w=ses.filter(e=>pg(e)>0.2);if(w.length>=8){const rate=a=>a.reduce((s,e)=>s+mi(e),0)/Math.max(0.5,a.reduce((s,e)=>s+pg(e),0));
    const now=rate(w.slice(0,4)),bef=rate(w.slice(4,8));if(now>=bef*1.5&&now-bef>=1)out.push([1,"warn",`Mistakes rising: ${rr1(bef)} → ${rr1(now)} per page`])}
  return out}
function classWeakAlerts(list){const out=[];const by=new Map();for(const st of list){if(!by.has(st.cls))by.set(st.cls,[]);by.get(st.cls).push(st)}
  for(const[cid,kids]of by){if(kids.length<2)continue;const need=kids.length<=5?2:3,cnt=Array.from({length:114},()=>[]);
    keepOrder(()=>{for(const st of kids){const S=surahStrength(st);for(let s=0;s<114;s++)if(["bad","weak"].includes(strengthLevel(S[s])))cnt[s].push(st.name)}});
    const c=classes.find(x=>x.id===cid);
    cnt.map((n,s)=>[s,n]).filter(x=>x[1].length>=need).sort((a,b)=>b[1].length-a[1].length).slice(0,2).forEach(([s,n])=>out.push({cls:c,s,names:n}))}
  return out}

// ===== 17. class strength map (class report) =====
function classStrengthMap(c){const kids=students.filter(s=>s.cls===c.id);if(!kids.length)return "";
  const data=keepOrder(()=>kids.map(st=>{const fr=surahFrac(st),S=surahStrength(st);return {st,fr,S}}));
  const cols=[];for(let s=0;s<114;s++)if(data.some(d=>d.fr[s]>=0.005))cols.push(s);if(!cols.length)return "";
  const sh=n=>{if(typeof AR!=="undefined"&&AR){const i=SURAH_NAMES.indexOf(n);if(i>=0)return SURAH_AR[i].replace(/^ال/,"")}return n.replace(/^(Al|An|At|Ash|Ad|Az|As|Ar|Adh|Ath|Ad-Du|Al-)-/,"").slice(0,7)};
  const C={strong:"#cfe9d9",good:"#e6f2d0",weak:"#fbe3b5",bad:"#f4b9b2",stale:"#dfe5e3"};
  const cell=(d,s)=>{if(d.fr[s]<0.005)return `<td style="background:#f3f5f4" title="${esc(d.st.name)} · ${esc(SURAH_NAMES[s])}: not memorized"></td>`;const lv=strengthLevel(d.S[s]);return `<td style="background:${C[lv]}" title="${esc(d.st.name)} · ${esc(SURAH_NAMES[s])}: ${STR_TEXT[lv]}${d.S[s]?` · ${rr1(d.S[s].rate)} mistakes / page`:""}"></td>`};
  return `<h2>Class strength map</h2><p class="small muted">Each student in each surah, last 60 days. Tap or hover a square for details.</p>
  <div class="tbl smap"><table><tr><th></th>${cols.map(s=>`<th title="${esc(SURAH_NAMES[s])}"><span>${esc(sh(SURAH_NAMES[s]))}</span></th>`).join("")}</tr>
  ${data.map(d=>`<tr><th class="nm">${esc(d.st.name)}</th>${cols.map(s=>cell(d,s)).join("")}</tr>`).join("")}</table></div>
  <p class="small"><span class="lgd" style="background:${C.strong}"></span>Strong <span class="lgd" style="background:${C.good}"></span>Good <span class="lgd" style="background:${C.weak}"></span>Needs review <span class="lgd" style="background:${C.bad}"></span>Weak <span class="lgd" style="background:${C.stale}"></span>Not heard in 60 days <span class="lgd" style="background:#f3f5f4"></span>Not memorized</p>`}

// ===== 19. message to the parent right after a session =====
const GR_AR={"Excellent":"ممتاز","Very good":"جيد جدًا","Good":"جيد","Pass":"مقبول","Repeat":"إعادة"};
function nextClassPlan(st,pos){return keepOrder(()=>{useOrder(st);for(let i=1;i<=14;i++){const d=addDays(today(),i);if(!(st.days||[]).includes(d.getDay()))continue;const p=dayPlan(st,d,pos);return {h:p.isHifz&&pos<TOTAL-0.05?pieces(pos,p.end):[],near:p.nearP||[],far:p.farP||[]}}return {h:[],near:[],far:[]}})}
function sessionMsg(st,d,lang){const ar=lang==="ar",N=s=>ar?SURAH_AR[s]:SURAH_NAMES[s],num=n=>ar?toAr(n):String(n);
  const rt=rows=>rows.map(r=>`${N(r.s)} ${r.a1===1&&r.a2===QD.verses[r.s]?"":num(r.a1)+(r.a2>r.a1?"–"+num(r.a2):"")}`.trim()).join(ar?"، ":", ");
  const hRows=keepOrder(()=>{useOrder(st);return (d.hifzRows||[]).length?d.hifzRows:d.from!=null&&d.to!=null?pieces(d.from,d.to):[]});
  const mist=n=>ar?(n===0?"دون أخطاء":n===1?"خطأ واحد":n===2?"خطآن":n<=10?`${num(n)} أخطاء`:`${num(n)} خطأً`):`${n} ${n===1?"mistake":"mistakes"}`;
  const L=[];const date=ar?"":` (${fmtShort(d.date||iso(today()))})`;
  L.push(ar?`السلام عليكم ورحمة الله، هذا ملخص حصة ${st.name} اليوم:`:`Assalamu alaikum. ${st.name}'s class today${date}:`);
  const A=ar?{present:"حضر في الموعد",late:"تأخر"+(d.arr?" (وصل الساعة "+d.arr+")":""),absent:"غاب اليوم",excused:"غاب بعذر"}:{present:"On time",late:"Late"+(d.arr?" (arrived "+d.arr+")":""),absent:"Absent today",excused:"Excused"};
  L.push(`• ${ar?"الحضور":"Attendance"}: ${A[d.att]||A.present}`);
  if(attended(d)){
    if(d.hifzNR)L.push(ar?"• الحفظ الجديد: لم يُسمِّع اليوم":"• New hifz: not recited today");
    else if(hRows.length){const g=gradeEn(d.hifzGrade);L.push(`• ${ar?"الحفظ الجديد":"New hifz"}: ${rt(hRows)} · ${mist(Number(d.hifzMist)||0)}${g?` (${ar?GR_AR[g]||g:g})`:""}`)}
    if(d.hifzRepeat&&hRows.length)L.push(ar?"• يُعيد تسميع هذا المقطع نفسه في الحصة القادمة لتثبيته":"• He will recite the same portion again next class to make it firm");
    if(d.revNR)L.push(ar?"• المراجعة: لم يُسمِّع":"• Review: not recited");
    else if((d.revRows||[]).length){const g=gradeEn(d.revGrade);L.push(`• ${ar?"المراجعة":"Review"}: ${rt(d.revRows)} · ${mist(Number(d.revMist)||0)}${g?` (${ar?GR_AR[g]||g:g})`:""}`)}
  }
  const pos=d.to!=null?Number(d.to):Number(st.pos)||0,nx=nextClassPlan(st,pos);if(d.hifzRepeat&&hRows.length)nx.h=hRows.map(r=>({s:r.s,a1:r.a1,a2:r.a2}));
  const rs=rows=>{if(rows.length<=4)return rt(rows);const f=rows[0],l=rows[rows.length-1];return ar?`من ${N(f.s)} ${num(f.a1)} إلى ${N(l.s)} ${num(l.a2)}`:`${N(f.s)} ${f.a1} to ${N(l.s)} ${l.a2}`};
  if(nx.h.length||nx.near.length||nx.far.length){L.push(`• ${ar?"المطلوب للحصة القادمة":"For next class"}:`);
    if(nx.h.length)L.push(`   - ${ar?"الحفظ الجديد":"New hifz"}: ${rt(nx.h)}`);
    if(nx.near.length)L.push(`   - ${ar?"المراجعة القريبة":"Near review"}: ${rs(nx.near)}`);
    if(nx.far.length)L.push(`   - ${ar?"المراجعة البعيدة":"Far review"}: ${rs(nx.far)}`)}
  if(d.note)L.push(`• ${ar?"ملاحظة":"Note"}: ${d.note}`);
  try{const n=streakOf(st).cur;if(n>=3)L.push(ar?`🔥 حضر جاهزًا ${num(n)} حصص متتالية، ما شاء الله`:`🔥 Ready ${n} classes in a row, masha'Allah`)}catch(_){}
  L.push("");L.push(ar?"جزاكم الله خيرًا":"Jazakum Allahu khairan");if(schoolName())L.push(schoolName());return L.join("\n")}
function msgPanel(st,d){let lang="ar";try{lang=localStorage.getItem("hifz.msgLang")||"ar"}catch(_){}
  const ph=phoneDigits(st.phone),m=sessionMsg(st,d,lang);
  return `<div class="panel smsg" data-noar><div class="head"><h3>Message to the parent</h3><span class="filters">${[["ar","عربي"],["en","English"]].map(([k,l])=>`<button type="button" class="fbtn ${k===lang?"on":""}" data-ml="${k}">${l}</button>`).join("")}</span></div>
   <textarea id="smTxt" rows="9" dir="${lang==="ar"?"rtl":"ltr"}">${esc(m)}</textarea>
   <div class="actions"><a class="btn primary wa" id="smWa" target="_blank" rel="noopener" href="https://wa.me/${ph}?text=${encodeURIComponent(m)}">Send on WhatsApp</a><button id="smCopy">Copy</button><span class="small muted" id="smMsg">${ph?"":"No parent number saved: WhatsApp will ask you to pick the chat."}</span></div></div>`}
function wireMsg(el,st,d){const box=el.querySelector(".smsg");if(!box)return;const txt=box.querySelector("#smTxt"),a=box.querySelector("#smWa"),ph=phoneDigits(st.phone);
  txt.oninput=()=>{a.href=`https://wa.me/${ph}?text=${encodeURIComponent(txt.value)}`};
  box.querySelectorAll("[data-ml]").forEach(b=>b.onclick=()=>{try{localStorage.setItem("hifz.msgLang",b.dataset.ml)}catch(_){}const n=document.createElement("div");n.innerHTML=msgPanel(st,d);box.replaceWith(n.firstElementChild);wireMsg(el,st,d)});
  box.querySelector("#smCopy").onclick=async()=>{const m=box.querySelector("#smMsg");try{await navigator.clipboard.writeText(txt.value);m.textContent="Copied."}catch(e){txt.select();try{document.execCommand("copy");m.textContent="Copied."}catch(_){m.textContent="Select the text and copy it."}}}}

// ===== v31: mushaf inside Record session =====
// today's mistakes tapped on the session mushaf: Map word -> {id,k,part}
function sessionMarks(st){const t=iso(today()),m=new Map();for(const x of marks.slice().sort((a,b)=>(a.t||0)-(b.t||0)))if(x.sid===st.id&&x.date===t&&x.src==="session")m.set(x.w,{id:x.id,k:x.k,part:x.part||"r",t:x.t||0});return m}
const itemRange=it=>it.rows.map(r=>[ayahWord(r.s,r.a1),ayEndWord(r.s,r.a2)]);
const inRanges=(R,w)=>R.some(([a,b])=>w>=a&&w<=b);
function itemLabel(it){return (it.part==="h"?"New hifz":"Review")+" · "+it.rows.map(r=>`${SURAH_NAMES[r.s]}${r.a1===1&&r.a2===QD.verses[r.s]?"":` ${r.a1}–${r.a2}`}`).join(", ")}
function splitAyahs(g0,g1){if(g1<g0)[g0,g1]=[g1,g0];const rows=[];for(let g=g0;g<=g1;g++){const s=AY_SURAH[g],a=g-SURAH_FIRST[s]+1,l=rows[rows.length-1];if(l&&l.s===s&&l.a2===a-1)l.a2=a;else rows.push({s,a1:a,a2:a})}return rows}
const gAyah=(s,a)=>SURAH_FIRST[s]+a-1;
function openQMus(st,items,idx,SM,onMark,onRange){
  injectFont();busy=true;
  let hide=false;try{hide=localStorage.getItem("hifz.qhide")==="1"}catch(_){}
  let kind="forgot";const rev={},ext={};let sel=null,tjp=null; // tjp: a tajweed mistake waiting for its rule
  const old=new Map();for(const x of marksOf(st))if(!x.fixed&&!(x.src==="session"&&x.date===iso(today())))old.set(x.w,x.k);
  document.querySelectorAll(".qmus").forEach(x=>x.remove());
  const ov=document.createElement("div");ov.className="qmus";document.body.appendChild(ov);document.body.classList.add("qmus-on");
  const close=()=>{ov.remove();document.body.classList.remove("qmus-on");busy=true};
  const draw=(scroll)=>{const it=items[idx];if(!it){close();return}SIM_REDRAW=()=>draw(false);
    const R=itemRange(it),first=R[0][0],last=R[R.length-1][1];
    const E=ext[idx]||(ext[idx]={pre:0,post:0});
    let pages=[...new Set(R.flatMap(([a,b])=>{const o=[];for(let p=pageOfWord(a);p<=pageOfWord(b);p++)o.push(p);return o}))].sort((a,b)=>a-b);
    {const p0=pages[0],p1=pages[pages.length-1];for(let k=1;k<=E.pre&&p0-k>=1;k++)pages.unshift(p0-k);for(let k=1;k<=E.post&&p1+k<=604;k++)pages.push(p1+k)}
    const g0=gAyah(it.rows[0].s,it.rows[0].a1),gl=it.rows[it.rows.length-1],g1=gAyah(gl.s,gl.a2);
    if(rev[idx]==null)rev[idx]=first-1;
    const mm=new Map();for(const[w,k]of old)mm.set(w,{k,fx:true});for(const[w,v]of SM)mm.set(w,{k:v.k,fx:false});
    let anc=null;if(!scroll){const b0=ov.querySelector(".qmb2");if(b0){const bt=b0.getBoundingClientRect().top;const bh=b0.clientHeight,L=[];for(const x of b0.querySelectorAll(".mpage .w")){const t=x.getBoundingClientRect().top-bt;if(t>=0&&t<bh)L.push({w:x.dataset.w,d:t});else if(t>=bh)break}anc=L.length?{L,top:b0.scrollTop}:{top:b0.scrollTop}}}
    const n=[...SM].filter(([w,v])=>inRanges(R,w)&&v.k!=="hesitate").length,ns=[...SM].filter(([w,v])=>inRanges(R,w)&&v.k==="hesitate").length;
    ov.innerHTML=`<div class="qmh"><div class="qmt"><button type="button" class="link" id="qmX">✕ Done</button><b>${esc(itemLabel(it))}</b><span class="small muted">${idx+1} of ${items.length}</span></div>

      ${tjp?`<div class="qmtj"><b>Which tajweed rule?</b> <span class="mword">${mw()[tjp.w]}</span><div class="actions">${tjp.rules.map(r=>`<button type="button" class="sm" data-tjr="${r}">${TJ_R[r][1]}</button>`).join("")}<select id="qmTjO" aria-label="Another rule"><option value="">Another rule…</option>${Object.keys(TJ_R).filter(r=>!tjp.rules.includes(r)).map(r=>`<option value="${r}">${TJ_R[r][1]}</option>`).join("")}</select><button type="button" class="link sm" id="qmTjX">Skip</button></div></div>`:""}
      ${onRange?`<div class="qrng small">${sel!=null?`<b>Start: ${esc(SURAH_NAMES[AY_SURAH[sel]])} ${sel-SURAH_FIRST[AY_SURAH[sel]]+1}</b> · now tap the number of the ayah where he stopped <button type="button" class="link sm" id="qmSelX">cancel</button>`:`Read more or less? Tap the <b>ayah number</b> where he started, then the one where he stopped.`}</div>`:""}
      <div class="small">Mistakes here: <b>${n}</b>${ns?` · self-corrected ${ns}`:""} <span class="muted">· tap a word to mark, tap again to remove · faint = old mistakes</span></div></div>
      <div class="qmb2">${pages[0]>1?`<button type="button" class="sm qmext" id="qmPre">＋ Show the page before</button>`:""}<div class="mbox">${pages.map(p=>pageHTML(p,mm,null,st)).join("")}</div>${pages[pages.length-1]<604?`<button type="button" class="sm qmext" id="qmPost">＋ Show the page after</button>`:""}</div>
      <div class="qmf qmf2"><div class="tmk">${TK.map(([k,l])=>`<button type="button" class="sm mk k-${k}${k===kind?" on":""}" data-qk="${k}">${l}</button>`).join("")}<label class="qhide"><input type="checkbox" id="qmHide" ${hide?"checked":""}> Hide text</label>${simToggleBtn()}</div><div class="qmfb"><button type="button" id="qmP" ${idx<=0?"disabled":""}>‹ Previous</button>${hide?`<button type="button" id="qmA">Next ayah</button>`:""}<button type="button" class="primary" id="qmN">${idx<items.length-1?"Next surah ›":"Finish ✓"}</button></div></div>`;
    ov.querySelectorAll(".mpage .w").forEach(sp=>{const w=Number(sp.dataset.w);if(!inRanges(R,w))sp.classList.add("out");else if(hide&&w>rev[idx])sp.classList.add("hid")});
    ov.querySelectorAll(".mpage .ae").forEach(a=>{const p=a.previousElementSibling;if(p&&p.classList.contains("hid"))a.classList.add("hid");if(p&&p.classList.contains("out"))a.classList.add("out")});
    ov.querySelectorAll(".mpage .ae").forEach(a=>{const p=a.previousElementSibling;if(!p||!p.dataset.w)return;const g=wordAyah(Number(p.dataset.w));a.dataset.g=g;a.classList.add("tap");if(g===sel)a.classList.add("sel");else if(sel==null&&(g===g0||g===g1))a.classList.add("edge")});
    const pr=ov.querySelector("#qmPre");if(pr)pr.onclick=()=>{E.pre++;draw(false)};const po=ov.querySelector("#qmPost");if(po)po.onclick=()=>{E.post++;draw(false)};
    const sx=ov.querySelector("#qmSelX");if(sx)sx.onclick=()=>{sel=null;draw(false)};
    if(onRange)ov.querySelectorAll(".mpage .ae.tap").forEach(a=>a.onclick=ev=>{ev.stopPropagation();const g=Number(a.dataset.g);
      if(sel==null){sel=g;draw(false);return}
      const rows=splitAyahs(sel,g);sel=null;const r=onRange(it,rows);if(r&&r.items&&r.items.length){items=r.items;idx=Math.max(0,r.idx)}draw(false)});
    ov.querySelector("#qmX").onclick=close;
    ov.querySelector("#qmP").onclick=()=>{idx--;draw(true)};
    ov.querySelector("#qmN").onclick=()=>{if(idx<items.length-1){idx++;draw(true)}else close()};
    const qa=ov.querySelector("#qmA");if(qa)qa.onclick=()=>{const nx=R.flatMap(([a,b])=>a>rev[idx]?[a]:b>rev[idx]?[rev[idx]+1]:[])[0];if(nx==null)return;const p=wordPlace(nx);rev[idx]=ayEndWord(p.s,p.a);draw(false)};
    ov.querySelector("#qmHide").onchange=e=>{hide=e.target.checked;try{localStorage.setItem("hifz.qhide",hide?"1":"0")}catch(_){}draw(false)};
    ov.querySelectorAll("[data-qk]").forEach(b=>b.onclick=()=>{kind=b.dataset.qk;draw(false)});
    const setTr=async r=>{if(!tjp||!r)return;const v=tjp.v;v.tr=r;tjp=null;draw(false);try{const id=v.id||await v.p;if(id)await db.doc("marks/"+id).update({tr:r})}catch(_){}};
    ov.querySelectorAll("[data-tjr]").forEach(b=>b.onclick=()=>setTr(b.dataset.tjr));
    {const o=ov.querySelector("#qmTjO");if(o)o.onchange=()=>setTr(o.value);const x=ov.querySelector("#qmTjX");if(x)x.onclick=()=>{tjp=null;draw(false)}}
    ov.querySelectorAll(".mpage .w").forEach(sp=>sp.onclick=async()=>{const w=Number(sp.dataset.w);if(!inRanges(R,w))return;
      if(hide&&w>rev[idx]){rev[idx]=w;draw(false);return}
      const ex=SM.get(w);
      if(ex){if(tjp&&tjp.w===w)tjp=null;SM.delete(w);onMark(ex.part,ex.k,-1);draw(false);try{const id=ex.id||await ex.p;if(id)await db.doc("marks/"+id).delete()}catch(_){}return}
      rev[idx]=Math.max(rev[idx],w);const auto=kind==="tajweed"?tjAutoRule(w):"";const v={k:kind,part:it.part,id:null,t:Date.now(),tr:auto};SM.set(w,v);onMark(it.part,kind,1);
      tjp=kind==="tajweed"&&!auto?{w,v,rules:tjWordRules(w)}:null;draw(false);
      v.p=db.collection("marks").add({sid:st.id,w,k:kind,...(auto?{tr:auto}:{}),date:iso(today()),t:v.t,src:"session",part:it.part}).then(r=>{v.id=r&&r.id;return v.id}).catch(()=>{if(SM.get(w)===v){SM.delete(w);onMark(it.part,kind,-1);draw(false)}errToast("That mistake was not saved. Check your connection and tap the word again.");return null});
      if(kind!=="hesitate"&&typeof simAskMix==="function")simAskMix(st,w,()=>v.id||v.p,()=>{if(SM.get(w)!==v)return;onMark(v.part,v.k,-1);v.k="mix";onMark(v.part,"mix",1);draw(false)})});
    const keep=()=>{if(!anc)return;const b=ov.querySelector(".qmb2");if(!b)return;for(const o of anc.L||[]){const x=b.querySelector(`.mpage .w[data-w="${o.w}"]`);if(x){b.scrollTop+=x.getBoundingClientRect().top-b.getBoundingClientRect().top-o.d;return}}b.scrollTop=anc.top};
    keep();
    const fit=()=>{fitPage(ov);keep();if(scroll){const f=ov.querySelector(`.mpage .w[data-w="${first}"]`);if(f){const b=ov.querySelector(".qmb2");b.scrollTop=Math.max(0,f.offsetTop-b.offsetTop-60)}}};
    requestAnimationFrame(fit);document.fonts.load('20px "KFGQPC Hafs"').then(()=>{fitPage(ov);keep()}).catch(()=>{})};
  draw(true)}

// ===== v36: one-tap attendance, auto absent =====
const graceMins=()=>{const g=(settings.main||{}).grace;return g==null||isNaN(Number(g))?5:Number(g)};
function lateBy(st,hm){const c=classes.find(x=>x.id===st.cls);if(!c||!c.time)return 0;const d=minsOf(hm)-minsOf(c.time);return d>graceMins()?d:0}
async function arrive(sid,date){const st=allStudents.find(s=>s.id===sid);if(!st)return;const hm=nowHM(),lb=lateBy(st,hm),att=lb>0?"late":"present";
  const ex=events.find(e=>e.type==="session"&&e.sid===sid&&e.date===date);
  try{if(ex)await db.doc("events/"+ex.id).update({att,arr:hm});else{const id="a_"+sid+"_"+date;await db.doc("events/"+id).set({sid,type:"session",date,att,arr:hm,t:Date.now(),hifzLines:0,hifzMist:0,revMist:0,...stampRec()});
    undoToast(`${st.name}: ${lb?`arrived ${hm}, ${lb} min late`:`arrived ${hm}, on time`}`,()=>db.doc("events/"+id).delete())}}catch(_){errToast(`${st.name}: arrival was not saved. Check your connection and tap again.`);render(true)}}
function attCtl(st,date){const e=events.filter(x=>x.type==="session"&&x.sid===st.id&&x.date===date).sort((a,b)=>(b.t||0)-(a.t||0))[0];
  if(!e)return `<button type="button" class="attbtn arrive" data-arrive="${st.id}">✓ Arrived</button>`;
  const work=Number(e.hifzLines)>0||e.hifzRepeat||(e.revType&&e.revType!=="none")||e.hifzNR||e.revNR;
  const undo=!work?` <button type="button" class="link small" data-attx="${e.id}">Undo</button>`:"";
  if(e.att==="present")return `<span class="chip ok">✓ ${e.arr?esc(e.arr)+" · ":""}On time</span>${undo}`;
  if(e.att==="late"){const lb=e.arr?lateBy(st,e.arr):0;return `<span class="chip warn">⏰ ${e.arr?esc(e.arr):""}${lb?` · ${lb} min late`:" · Late"}</span>${undo}`}
  if(e.att==="absent")return `<button type="button" class="chip bad attsw" data-attsw="${e.id}" title="Tap to change to excused">✕ Absent${e.auto?" (auto)":""}</button> <button type="button" class="attbtn arrive" data-arrive="${st.id}">✓ Arrived</button>`;
  if(e.att==="excused")return `<button type="button" class="chip info attsw" data-attsw="${e.id}" title="Tap to change to absent">✉ Excused</button>`;
  return ""}
function wireAtt(el,date){
  el.querySelectorAll("[data-arrive]").forEach(b=>b.onclick=e=>{e.stopPropagation();b.disabled=true;arrive(b.dataset.arrive,date)});
  el.querySelectorAll("[data-attsw]").forEach(b=>b.onclick=e=>{e.stopPropagation();const ev=events.find(x=>x.id===b.dataset.attsw);if(!ev)return;db.doc("events/"+ev.id).update({att:ev.att==="absent"?"excused":"absent"}).catch(()=>{})});
  el.querySelectorAll("[data-attx]").forEach(b=>b.onclick=e=>{e.stopPropagation();const ev=events.find(x=>x.id===b.dataset.attx);if(!ev)return;db.doc("events/"+ev.id).delete().then(()=>undoToast("Attendance removed",()=>db.doc("events/"+ev.id).set(plain(ev)))).catch(()=>{})})}
let autoAbsBusy=false;
async function autoAbsent(force){if(autoAbsBusy||!loaded||!allReady())return;autoAbsBusy=true;
  try{const d=iso(today());for(const c of classesToday()){if(typeof canEditCls==="function"&&(!canEditCls(c.id)||(tchMode()&&!isMyCls(c.id))))continue;const m=meetingOf(c.id,d);if(m&&(m.status==="cancelled"||m.autoAbs))continue;if(breaks.some(b=>(b.cls==="all"||b.cls===c.id)&&d>=b.from&&d<=b.to))continue;
    const held=(m&&(m.started||m.ended))||events.some(e=>e.date===d&&e.type==="session"&&!e.auto&&students.some(s=>s.id===e.sid&&s.cls===c.id));if(!held&&force!==c.id)continue;
    const endM=(minsOf(c.end)||((minsOf(c.time)||0)+90))+30;if(!(force===c.id||(m&&m.ended)||nowMins()>=endM))continue;
    const kids=students.filter(s=>s.cls===c.id&&!events.some(e=>(e.type==="session"||e.type==="emergency")&&e.sid===s.id&&e.date===d));
    const ids=[];for(const s of kids){try{const id="a_"+s.id+"_"+d;await db.doc("events/"+id).set({sid:s.id,type:"session",date:d,att:"absent",auto:true,t:Date.now(),hifzLines:0,hifzMist:0,revMist:0,...stampRec()});ids.push(id)}catch(_){}}
    try{if(m)await db.doc(`meetings/${c.id}_${d}`).update({autoAbs:true});else await db.doc(`meetings/${c.id}_${d}`).set({cls:c.id,date:d,status:"held",autoAbs:true,t:Date.now()})}catch(_){}
    if(ids.length)undoToast(`${c.name}: ${ids.length} not recorded, marked absent`,async()=>{for(const id of ids)await db.doc("events/"+id).delete()})}}
  finally{autoAbsBusy=false}}
setInterval(()=>{try{autoAbsent()}catch(_){}},60000);

// buddy recitations of today, to show in the session review
function buddyToday(st){const d=iso(today());return events.filter(e=>e.type==="buddy"&&e.sid===st.id&&e.date===d).flatMap(e=>buddyRows(e).map(r=>({...r,helper:e.helperName||""})))}
// Coverage: memorized surahs the teacher has not heard in 28 days (buddy recitations do not count)
function notHeardList(st,days=28){return keepOrder(()=>{useOrder(st);const fr=surahFrac(st),ls=lastSeenMap(st),lim=iso(addDays(today(),-days)),out=[];
  for(let s=0;s<114;s++){if(fr[s]<0.5)continue;if(!ls[s]||ls[s]<lim)out.push({s,last:ls[s],pg:rowLines({s,a1:1,a2:QD.verses[s]})/LINES*fr[s]})}return out})}
function coveragePanel(st){let L;try{L=notHeardList(st)}catch(_){return ""}if(!L.length)return "";
  const pg=Math.round(L.reduce((a,x)=>a+x.pg,0)*10)/10,sh=L.slice().sort((a,b)=>(a.last||"")<(b.last||"")?-1:1);
  return `<div class="panel" id="covP"><div class="head"><h3>Not heard by the teacher in 28 days</h3><span class="chip warn">${L.length} ${L.length===1?"surah":"surahs"} · ${pg} p</span></div>
  <p class="small muted">Memorized, but not recited to the teacher in the last 28 days (recitation to a classmate does not count). Oldest first: a suggestion for the in-class far review.</p>
  <p class="small">${sh.slice(0,14).map(x=>`${SURAH_NAMES[x.s]}${x.last?` <span class="muted">(${fmtShort(x.last)})</span>`:` <span class="muted">(never)</span>`}`).join(" · ")}${sh.length>14?` <span class="muted">+ ${sh.length-14} more</span>`:""}</p></div>`}
