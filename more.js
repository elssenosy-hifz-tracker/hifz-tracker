// ---------- more: streak, listening, class screen, parent card, test schedule, fees, placement test, year report ----------
let schedule=[],fees=[];
const pref=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}},setPref=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const FLAME=`<svg class="flame" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4-3 6-3 10a3 3 0 0 0 6 0c0-2-1-3-1-5 3 2 5 5 5 8a7 7 0 0 1-14 0c0-6 7-8 7-13z" fill="#E0662B"/></svg>`;
function moreInit(){if(!db)return;
  db.collection("schedule").onSnapshot(s=>{schedule=s.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{});
  db.collection("fees").onSnapshot(s=>{fees=s.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{});}

// ----- 1. ready streak -----
const STREAK_BADGES=[10,25,50,100];
function streakOf(st){const ses=events.filter(e=>e.sid===st.id&&e.type==="session").sort((a,b)=>a.date.localeCompare(b.date)||((a.t||0)-(b.t||0)));
  let cur=0,best=0;const dots=[];
  for(const e of ses){if(e.att==="excused")continue;let k;if(e.att==="absent"){k="gray";cur=0}else if(e.hifzNR||e.revNR){k="bad";cur=0}else{k="ok";cur++;if(cur>best)best=cur}dots.push(k)}
  return {cur,best,dots:dots.slice(-10),next:STREAK_BADGES.find(b=>b>cur)}}
const streakChip=st=>{const s=streakOf(st);return `<span class="chip ${s.cur?"warn":"plain"}" title="Classes ready in a row">${FLAME} ${s.cur}</span>`};
function streakPanel(st){const s=streakOf(st);if(!s.dots.length)return "";
  return `<div class="panel tight streak"><div class="head"><b>${FLAME} ${s.cur} ${s.cur===1?"class":"classes"} ready in a row</b><span class="small muted">Best: ${s.best}${s.next?` · next badge at ${s.next}`:""}</span></div>
  <div class="dots">${s.dots.map(c=>`<i class="${c}"></i>`).join("")}</div><p class="small muted">Last ${s.dots.length} classes: green ready, red not ready, grey absent. Excused days don't count.</p></div>`}

// ----- 2. listen to the portion -----
const RECITERS=[["Husary_Muallim_128kbps","Al-Husary (teaching, slow)"],["Husary_128kbps","Al-Husary"],["Minshawy_Murattal_128kbps","Al-Minshawi"]];
const pad3=n=>String(n).padStart(3,"0");
let PL=null;
function ayahList(ps){const out=[];for(const p of ps)for(let a=p.a1;a<=p.a2;a++)out.push([p.s,a]);return out}
const listenBtn=(ps,label)=>ps&&ps.length?` <button type="button" class="sm listen" data-listen='${JSON.stringify(ps.map(p=>[p.s,p.a1,p.a2]))}' data-ll="${esc(label)}">▶ Listen</button>`:"";
function wireListen(el){el.querySelectorAll("[data-listen]").forEach(b=>b.onclick=e=>{e.stopPropagation();const ps=JSON.parse(b.dataset.listen).map(([s,a1,a2])=>({s,a1,a2}));playList(ayahList(ps),b.dataset.ll,ps)})}
function playerBar(){let bar=document.getElementById("player");if(!bar){bar=document.createElement("div");bar.id="player";document.body.append(bar)}return bar}
function drawPlayer(){const bar=playerBar();if(!PL){bar.hidden=true;return}bar.hidden=false;const[s,a]=PL.list[PL.i]||PL.list[0];
  bar.innerHTML=`<div class="pl1"><b>${esc(PL.label)}</b><span class="small">${SURAH_NAMES[s]} ${a} · ayah ${PL.i+1} of ${PL.list.length}${PL.rep>1?` · time ${PL.r+1} of ${PL.rep}`:""}</span></div>
  <div class="pl2"><button type="button" id="pl_pp">${PL.au.paused?"▶ Play":"❚❚ Pause"}</button><button type="button" id="pl_prev" aria-label="Previous ayah">⏮</button><button type="button" id="pl_next" aria-label="Next ayah">⏭</button>
  <select id="pl_rec" aria-label="Reciter">${RECITERS.map(r=>`<option value="${r[0]}" ${r[0]===PL.rec?"selected":""}>${r[1]}</option>`).join("")}</select>
  <select id="pl_rep" aria-label="Repeat">${[1,3,5].map(n=>`<option value="${n}" ${n===PL.rep?"selected":""}>Repeat ×${n}</option>`).join("")}</select><button type="button" id="pl_x" aria-label="Close">✕</button></div>
  ${PL.err?`<div class="small">The recitation could not load here. <a href="https://quran.com/${PL.ps[0].s+1}/${PL.ps[0].a1}-${PL.ps[0].a2}" target="_blank" rel="noopener">Listen on quran.com</a></div>`:""}`;
  bar.querySelector("#pl_pp").onclick=()=>{if(PL.au.paused)PL.au.play().catch(()=>{});else PL.au.pause();drawPlayer()};
  bar.querySelector("#pl_prev").onclick=()=>{PL.i=Math.max(0,PL.i-1);PL.r=0;loadAyah()};bar.querySelector("#pl_next").onclick=()=>{if(PL.i<PL.list.length-1){PL.i++;PL.r=0;loadAyah()}};
  bar.querySelector("#pl_rec").onchange=e=>{PL.rec=e.target.value;setPref("hifz.rec",PL.rec);loadAyah()};
  bar.querySelector("#pl_rep").onchange=e=>{PL.rep=Number(e.target.value);setPref("hifz.rep",String(PL.rep));drawPlayer()};
  bar.querySelector("#pl_x").onclick=stopPlay}
function loadAyah(){const[s,a]=PL.list[PL.i];PL.err=false;PL.au.src=`https://everyayah.com/data/${PL.rec}/${pad3(s+1)}${pad3(a)}.mp3`;PL.au.play().catch(()=>{});drawPlayer()}
function playList(list,label,ps){stopPlay();if(!list.length)return;const au=new Audio();
  PL={list,ps,label,i:0,r:0,au,rec:(r=>RECITERS.some(x=>x[0]===r)?r:RECITERS[0][0])(pref("hifz.rec",RECITERS[0][0])),rep:Number(pref("hifz.rep","1"))||1,err:false};
  au.onended=()=>{if(!PL)return;if(PL.r+1<PL.rep){PL.r++;au.currentTime=0;au.play().catch(()=>{});drawPlayer();return}PL.r=0;if(PL.i<PL.list.length-1){PL.i++;loadAyah()}else drawPlayer()};
  au.onerror=()=>{if(PL){PL.err=true;drawPlayer()}};au.onplay=au.onpause=()=>drawPlayer();loadAyah()}
function stopPlay(){if(PL){PL.au.pause();PL.au.src=""}PL=null;drawPlayer()}

// ----- 3. class screen -----
function weekStart(){const t=today();return addDays(t,-((t.getDay()+1)%7))} // Saturday
function renderScreen(el,sub){const c=classes.find(x=>x.id===view.id);if(!c){view={name:"list"};return render(true)}
  const from=iso(weekStart()),to=iso(addDays(weekStart(),6)),kids=students.filter(s=>s.cls===c.id);
  const pts=kids.map(st=>({st,p:events.filter(e=>e.sid===st.id&&e.date>=from&&e.date<=to).reduce((t,e)=>t+ptsOf(e),0),s:streakOf(st).cur})).sort((a,b)=>b.p-a.p||String(a.st.name).localeCompare(String(b.st.name)));
  const top=pts.slice(0,5),max=Math.max(1,...top.map(x=>x.p)),star=pts[0]&&pts[0].p>0?pts[0]:null,stk=pts.slice().sort((a,b)=>b.s-a.s)[0];
  const hv=classHeartView(c,from,to),full=hv.fr?null:null;
  sub.textContent="Class screen · "+c.name;
  el.innerHTML=`${backBtn("Class report",{name:"crep",id:c.id})}<div class="actions"><button id="scrFull" class="primary">Full screen</button></div>
  <div class="scr" id="scrBox"><div class="scrhead"><b>${esc(c.name)}</b><span>This week · ${fmtShort(from)} – ${fmtShort(to)}</span></div>${challengeCard(c,true)}
  <div class="scrgrid"><div><h4>Points this week</h4>${top.length?top.map((x,i)=>`<div class="lb"><span class="rk">${i+1}</span><span class="nm">${esc(x.st.name)}${flameChip(x.st)}</span><span class="lbar"><i style="width:${Math.max(0,x.p)/max*100}%"></i></span><b>${x.p}</b></div>`).join(""):'<p>No students yet.</p>'}
  ${star?`<div class="star">★ Star of the week: <b>${esc(star.st.name)}</b></div>`:""}
  ${stk&&stk.s>0?`<div class="star stk">${FLAME} Longest ready streak: <b>${esc(stk.st.name)}</b> · ${stk.s} classes</div>`:""}</div>
  <div class="hc"><h4>Class heart</h4><canvas id="scrHeart" style="width:100%;max-width:520px;border-radius:10px"></canvas><p>${hv.full!=null?"":""}${(()=>{let n=0;for(let s=0;s<114;s++)if(hv.col[s]&&hv.col[s]!==null)n++;return n})()} surahs memorized by someone in the class</p></div></div></div>`;
  wireBack(el);const cv=el.querySelector("#scrHeart");heartFont().then(()=>heartDraw(cv,hv,Math.min(3000,Math.max(600,cv.parentElement.clientWidth*(window.devicePixelRatio||1)*1.5))));
  el.querySelector("#scrFull").onclick=()=>{const b=el.querySelector("#scrBox");try{(b.requestFullscreen||b.webkitRequestFullscreen).call(b)}catch(e){}}}

// ----- 4. parent progress card (PDF) -----
function parentCardHTML(st,img){useOrder(st);const pct=heartPct(st),cj=currentJuz(st.pos),p=dayPlan(st,today(),st.pos);
  const plan=weekPlan(st,today(),7),last=events.filter(e=>e.sid===st.id&&e.type==="session").sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const s=streakOf(st),rep=repeatList(st,5),passed=events.filter(e=>e.sid===st.id&&e.type==="test"&&e.result==="pass").map(e=>e.juz);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(st.name)} progress</title><style>${PRINT_CSS}.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0d6b5e;padding-bottom:6px;margin-bottom:10px}.hd h1{color:#0d6b5e;font-size:26px}.st{display:flex;gap:8px;margin:8px 0}.st div{flex:1;border:1px solid #bbb;border-radius:8px;padding:6px 8px}.st b{display:block;font-size:18px}.st span{font-size:11px;color:#555}.hbox{text-align:center}.hbox img{width:44%}</style></head><body>
  <div class="hd"><div><h1>${esc(st.name)}</h1><p class="muted">${esc(clsName(st.cls))} · progress card · ${fmt(today())} ${today().getFullYear()}</p></div><p class="muted">Teacher: ${esc(GRD().teacher||"")}</p></div>
  <div class="st"><div><b>${pagesOf(st.pos+PREV_LINES)} p</b><span>memorized of 604 (${pct}%)</span></div><div><b>${cj?"Juz "+cj:"Complete"}</b><span>now memorizing</span></div><div><b>${s.cur}</b><span>classes ready in a row</span></div><div><b>${ptsSum(st.id)}</b><span>points</span></div></div>
  <div class="hbox"><img src="${img}" alt="Quran heart"></div>
  <h2>Practice at home today</h2><table><tr><th>New hifz</th><td>${p.neu}</td></tr><tr><th>Yesterday's portion</th><td>${p.yest}</td></tr><tr><th>Near review</th><td>${p.near}</td></tr><tr><th>Far review</th><td>${p.far}</td></tr><tr><th>Reading</th><td>${p.read}</td></tr>${rep.length?`<tr><th>Places to practise</th><td>${rep.map(errPlace).join(", ")}</td></tr>`:""}</table>
  <h2>Plan for the next 7 days</h2><table><tr><th>Day</th><th>New hifz</th></tr>${plan.map(d=>`<tr><td>${fmtShort(iso(d.date))}</td><td>${d.neu}</td></tr>`).join("")}</table>
  <h2>Last classes</h2><table><tr><th>Date</th><th>What happened</th></tr>${last.map(e=>`<tr><td>${fmtShort(e.date)}</td><td>${(ATT[e.att]||[0,""])[1]}${Number(e.hifzLines)>0?` · hifz ${pagesOf(e.hifzLines)} p${e.hifzGrade?" ("+gradeEn(e.hifzGrade)+")":""}`:""}${e.hifzNR?" · hifz not ready":""}${e.revNR?" · review not ready":""}${e.note?` · ${esc(e.note)}`:""}</td></tr>`).join("")||'<tr><td colspan="2">Nothing recorded yet.</td></tr>'}</table>
  ${passed.length?`<p><b>Juz passed:</b> ${passed.join(", ")}</p>`:""}</body></html>`}
function wireParentCard(el,st){const b=el.querySelector("#pm_card");if(!b)return;b.onclick=()=>heartFont().then(()=>saveFile(`progress-${fileSafe(st.name)}-${iso(today())}.html`,parentCardHTML(st,heartImg(st,"progress",1600)),el.querySelector("#pm_msg")))}

// ----- 6. test schedule -----
function juzFinishDate(st){useOrder(st);const cj=currentJuz(st.pos);if(!cj)return null;const plan=weekPlan(st,today(),28);for(const d of plan){if(d.isHifz&&juzDoneList(d.end).includes(cj))return {juz:cj,date:iso(addDays(d.date,1))}}return null}
function testsDue(){const out=[],t=iso(today()),wk=iso(addDays(today(),7));
  const open=schedule.filter(x=>!x.done).filter(x=>{const st=allStudents.find(s=>s.id===x.sid);if(!st||st.archived)return false;if(x.kind==="juz")return !events.some(e=>e.sid===x.sid&&e.type==="test"&&e.juz===x.juz&&e.date>=x.created);return !events.some(e=>e.sid===x.sid&&e.type==="monthly"&&e.date>=x.created)});
  for(const x of open)if(x.date<=wk)out.push({...x,st:allStudents.find(s=>s.id===x.sid),state:x.date<t?"late":x.date===t?"today":"planned"});
  for(const st of students){if(open.some(x=>x.sid===st.id))continue;const s=status(st,events);
    if(s.untested.length)out.push({sid:st.id,st,kind:"juz",juz:s.untested[0],date:t,state:"suggest",earlier:PREV.includes(s.untested[0])});
    else{const f=juzFinishDate(st);if(f&&f.date<=wk)out.push({sid:st.id,st,kind:"juz",juz:f.juz,date:f.date,state:"suggest"})}}
  return out.sort((a,b)=>a.date.localeCompare(b.date))}
const testName=x=>x.kind==="monthly"?"Monthly random test":`Juz ${x.juz}${x.earlier?" (earlier hifz)":""}`;
function testsPanel(){const list=testsDue();
  let open=true;try{open=localStorage.getItem("hifz.tests")!=="0"}catch(e){}
  const st0=students.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return `<details class="panel tight" id="testsBox" ${open?"open":""}><summary><b>Tests this week</b> <span class="small muted">${list.filter(x=>x.state!=="suggest").length} planned · ${list.filter(x=>x.state==="suggest").length} suggested</span></summary>
  ${list.length?`<div class="tbl"><table class="book tt"><thead><tr><th>Day</th><th>Student</th><th>Test</th><th></th></tr></thead><tbody>${list.map(x=>`<tr><td>${fmtShort(x.date)}</td><td><b>${esc(x.st.name)}</b></td><td>${testName(x)}</td><td>
    ${x.state==="suggest"?`<span class="chip plain">Suggested</span> <button class="link small adminonly" data-tsadd='${JSON.stringify({sid:x.sid,kind:x.kind,juz:x.juz||null,date:x.date})}'>Schedule</button>`:`<span class="chip ${x.state==="late"?"bad":x.state==="today"?"info":"ok"}">${x.state==="late"?"Overdue":x.state==="today"?"Today":"Planned"}</span>`}
    <button class="link small" data-tsrec='${JSON.stringify({sid:x.sid,kind:x.kind,juz:x.juz||null})}'>Record</button>${x.id?` <button class="link small adminonly" data-tsdel="${x.id}">Remove</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:'<p class="small muted">No tests due this week.</p>'}
  <form id="tsForm" class="adminonly"><div class="fields"><label>Student<select id="ts_s">${st0.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label>
  <label>Test<select id="ts_k"></select></label><label>Date<input type="date" id="ts_d" value="${iso(addDays(today(),1))}"></label></div><div class="actions"><button type="submit">Schedule test</button><span class="small muted" id="ts_msg"></span></div></form></details>`}
function wireTests(el){const box=el.querySelector("#testsBox");if(!box)return;box.addEventListener("toggle",()=>setPref("hifz.tests",box.open?"1":"0"));
  const add=async x=>{try{await db.collection("schedule").add({...x,created:iso(today()),t:Date.now()})}catch(e){}};
  el.querySelectorAll("[data-tsadd]").forEach(b=>b.onclick=()=>add(JSON.parse(b.dataset.tsadd)));
  el.querySelectorAll("[data-tsdel]").forEach(b=>b.onclick=async()=>{try{await db.doc("schedule/"+b.dataset.tsdel).delete()}catch(e){}});
  el.querySelectorAll("[data-tsrec]").forEach(b=>b.onclick=()=>{const x=JSON.parse(b.dataset.tsrec);go({name:"session",id:x.sid,pre:{type:x.kind==="monthly"?"monthly":"test",juz:x.juz}})});
  const f=el.querySelector("#tsForm");if(!f)return;const ss=f.querySelector("#ts_s"),ks=f.querySelector("#ts_k");
  const fill=()=>{const st=students.find(s=>s.id===ss.value);if(!st){ks.innerHTML="";return}useOrder(st);const s=status(st,events),cj=currentJuz(st.pos);const js=[...new Set([...s.untested,...(cj?[cj]:[]),...s.done])];
    ks.innerHTML=js.map(j=>`<option value="juz:${j}">Juz ${j}${s.passed.has(j)?" (passed before)":""}</option>`).join("")+`<option value="monthly">Monthly random test</option>`};
  ss.onchange=()=>{busy=true;fill()};fill();f.addEventListener("input",()=>busy=true);
  f.onsubmit=async e=>{e.preventDefault();const k=ks.value,d=f.querySelector("#ts_d").value;if(!d)return;await add({sid:ss.value,kind:k==="monthly"?"monthly":"juz",juz:k==="monthly"?null:Number(k.split(":")[1]),date:d});busy=false;render(true)}}
function applyPre(el){const pr=view.pre;if(!pr)return;const t=el.querySelector("#s_type");if(t){t.value=pr.type;t.dispatchEvent(new Event("change"))}const j=el.querySelector("#t_juz");if(j&&pr.juz)j.value=String(pr.juz);view={...view,pre:null}}

// ----- 7. fees -----
const ymNow=()=>iso(today()).slice(0,7);
const feeCfg=()=>({amount:0,cur:"AUD",...((settings.main||{}).fee||{})});
const monthLabel=ym=>new Date(ym+"-01T00:00:00").toLocaleString("en",{month:"long",year:"numeric"});
function renderFees(el,sub){const ym=view.ym||ymNow(),cfg=feeCfg();sub.textContent="Fees · "+monthLabel(ym);
  const rows=students.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name))).map(st=>({st,f:fees.find(x=>x.sid===st.id&&x.ym===ym)}));
  const paid=rows.filter(r=>r.f&&r.f.status==="paid"),ex=rows.filter(r=>r.f&&r.f.status==="exempt"),due=rows.filter(r=>!r.f);
  const sum=paid.reduce((t,r)=>t+(Number(r.f.amount)||0),0);
  const shift=n=>{const d=new Date(ym+"-01T00:00:00");d.setMonth(d.getMonth()+n);return iso(d).slice(0,7)};
  el.innerHTML=`${backBtn("All students",{name:"list"})}
  <div class="panel"><div class="head"><h3>Fees · ${monthLabel(ym)}</h3><span class="actions"><button class="sm" id="fm_prev">← ${monthLabel(shift(-1)).split(" ")[0]}</button><button class="sm" id="fm_next">${monthLabel(shift(1)).split(" ")[0]} →</button></span></div>
  <div class="stats2"><div><b>${sum} ${esc(cfg.cur)}</b><span>collected · ${paid.length} paid</span></div><div><b>${due.length*cfg.amount} ${esc(cfg.cur)}</b><span>still due · ${due.length} not paid${ex.length?` · ${ex.length} exempt`:""}</span></div></div>
  ${cfg.amount?"":`<div class="banner info">Set the monthly fee at the bottom of this page first.</div>`}<div class="list">${rows.map(({st,f})=>`<div class="row fee"><span class="name">${esc(st.name)}</span>
    <span class="chips">${f?f.status==="paid"?`<span class="chip ok">Paid ${fmtShort(f.date)} · ${f.amount} ${esc(cfg.cur)}</span>`:`<span class="chip plain">Exempt</span>`:`<span class="chip bad">Not paid</span>`}</span>
    <span class="att">${f?`<button class="sm" data-fundo="${f.id}">Undo</button>`:`<button class="sm primary" data-fpay="${st.id}">Mark paid</button><button class="sm" data-fex="${st.id}">Exempt</button>${phoneDigits(st.phone)?`<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${phoneDigits(st.phone)}?text=${encodeURIComponent(`Assalamu alaikum. A gentle reminder that ${st.name}'s Quran class fee for ${monthLabel(ym)} (${cfg.amount} ${cfg.cur}) is still due. Jazakum Allahu khairan. ${GRD().teacher||""}`.trim())}">Remind</a>`:""}`}</span></div>`).join("")||'<p class="muted">No students.</p>'}</div></div>
  <form class="panel" id="feeCfg"><h3>Monthly fee</h3><div class="fields"><label>Amount<input type="number" id="fc_a" min="0" value="${cfg.amount}" inputmode="numeric"></label><label>Currency<input id="fc_c" value="${esc(cfg.cur)}"></label></div><div class="actions"><button type="submit">Save</button><span class="small muted" id="fc_msg"></span></div><p class="note">Only you see this page. A substitute teacher can't open it.</p></form>`;
  wireBack(el);
  el.querySelector("#fm_prev").onclick=()=>{view={...view,ym:shift(-1)};render(true)};el.querySelector("#fm_next").onclick=()=>{view={...view,ym:shift(1)};render(true)};
  const put=async(sid,status)=>{try{await db.doc(`fees/${sid}_${ym}`).set({sid,ym,status,amount:status==="paid"?Number(cfg.amount)||0:0,date:iso(today()),t:Date.now()})}catch(e){}};
  el.querySelectorAll("[data-fpay]").forEach(b=>b.onclick=()=>put(b.dataset.fpay,"paid"));el.querySelectorAll("[data-fex]").forEach(b=>b.onclick=()=>put(b.dataset.fex,"exempt"));
  el.querySelectorAll("[data-fundo]").forEach(b=>b.onclick=async()=>{try{await db.doc("fees/"+b.dataset.fundo).delete()}catch(e){}});
  const f=el.querySelector("#feeCfg");trackForm(f);f.onsubmit=async e=>{e.preventDefault();const fee={amount:Number(f.querySelector("#fc_a").value)||0,cur:f.querySelector("#fc_c").value.trim()||"AUD"};
    try{if(settings.main)await db.doc("settings/main").update({fee});else await db.doc("settings/main").set({fee});busy=false;render(true)}catch(_){f.querySelector("#fc_msg").textContent="Not saved."}}}

// ----- 8. placement test -----
function renderPlace(el,sub){const P=view.pl||(view.pl={step:1,name:"",cls:(classes[0]||{}).id||"",prevS:[],places:[],read:"some"});sub.textContent="Placement test for a new student";
  const steps=`<div class="steps">${["Memorized","Listen","Result"].map((t,i)=>`<span class="${i+1<P.step?"on":i+1===P.step?"cur":""}">${i+1} ${t}</span>`).join("")}</div>`;
  let body="";
  if(P.step===1){body=`<form class="panel" id="plf"><div class="fields"><label>Student name<input id="pl_n" required value="${esc(P.name)}" autocomplete="off"></label><label>Class<select id="pl_c">${classes.map(c=>`<option value="${c.id}" ${c.id===P.cls?"selected":""}>${esc(c.name)}</option>`).join("")}<option value="">No class</option></select></label>
    <label>Reading from the mushaf<select id="pl_r"><option value="fluent" ${P.read==="fluent"?"selected":""}>Reads fluently</option><option value="some" ${P.read==="some"?"selected":""}>Reads with some mistakes</option><option value="weak" ${P.read==="weak"?"selected":""}>Reads slowly or weakly</option></select></label></div>
    <p class="small muted lbl">Which surahs does the student say they have memorized? Tick a juz to tick all its surahs.</p><div class="prevgrid">${prevGroups({prevS:P.prevS,order:"nas"})}</div>
    <div class="actions"><button class="primary" type="submit">Next: listen</button><span class="small muted" id="pl_msg"></span></div></form>`}
  else if(P.step===2){body=`<div class="panel"><h3>Listen to these places</h3><p class="small muted">Ask the student to recite about 5 ayahs from each place. Write how many mistakes they made.</p>
    ${P.places.length?P.places.map((x,i)=>`<div class="plrow"><b>${i+1}. ${SURAH_NAMES[x.s]} from ayah ${x.a}</b><label class="inl">Mistakes<input type="number" min="0" class="plm" data-i="${i}" value="${x.m??""}" inputmode="numeric"></label></div>`).join(""):'<p>No surahs ticked, so there is nothing to test. Go to the result.</p>'}
    <div class="actions"><button id="pl_back">Back</button>${P.places.length?'<button id="pl_new">Other places</button>':""}<button class="primary" id="pl_go">See the result</button></div></div>`}
  else{const r=placeResult(P);body=`<div class="panel" style="border-color:var(--accent)"><h3>Suggested plan for ${esc(P.name)}</h3>
    <p>${r.pages} pages memorized before · ${r.mist} ${r.mist===1?"mistake":"mistakes"} in ${P.places.length} places · level: <b>${r.level}</b></p>
    <div class="fields"><label>Daily amount Hifz<select id="pr_a">${AMOUNTS.map(a=>`<option value="${a[0]}" ${a[0]===r.amount?"selected":""}>${a[1]}</option>`).join("")}</select></label>
    <label>Review everything memorized in<select id="pr_f">${FAR_DAYS.map(d=>`<option value="${d}" ${d===r.far?"selected":""}>${d} days</option>`).join("")}</select></label>
    <label>Daily reading<select id="pr_r">${READS.map(x=>`<option value="${x[0]}" ${x[0]===r.read?"selected":""}>${x[1]}</option>`).join("")}</select></label></div>
    ${r.weak.length?`<p class="small"><b>Needs strengthening:</b> ${r.weak.map(s=>SURAH_NAMES[s]).join(", ")}. Consider unticking these so they are memorized again, or watch them in the far review.</p>`:""}
    <p class="small muted">New hifz starts from An-Nas upward and skips the surahs already memorized. You can change anything later in "Edit details".</p>
    <div class="actions"><button id="pl_back2">Back</button><button class="primary" id="pl_add">Add ${esc(P.name)} with this plan</button><span class="small muted" id="pl_amsg"></span></div></div>`}
  el.innerHTML=`${backBtn("All students",{name:"list"})}${steps}${body}`;wireBack(el);
  if(P.step===1){const f=el.querySelector("#plf");trackForm(f);
    f.querySelectorAll("[data-pj]").forEach(j=>j.addEventListener("change",()=>f.querySelectorAll(`[data-psj="${j.dataset.pj}"]`).forEach(b=>b.checked=j.checked)));
    f.onsubmit=e=>{e.preventDefault();P.name=f.querySelector("#pl_n").value.trim();P.cls=f.querySelector("#pl_c").value;P.read=f.querySelector("#pl_r").value;P.prevS=[...f.querySelectorAll("input[data-ps]:checked")].map(i=>Number(i.dataset.ps));P.places=pickPlaces(P.prevS,3);P.step=2;busy=false;render(true)}}
  else if(P.step===2){el.querySelectorAll(".plm").forEach(i=>i.oninput=()=>{busy=true;P.places[Number(i.dataset.i)].m=i.value===""?null:Number(i.value)});
    el.querySelector("#pl_back").onclick=()=>{P.step=1;busy=false;render(true)};const nb=el.querySelector("#pl_new");if(nb)nb.onclick=()=>{P.places=pickPlaces(P.prevS,3);busy=false;render(true)};
    el.querySelector("#pl_go").onclick=()=>{P.step=3;busy=false;render(true)}}
  else{el.querySelector("#pl_back2").onclick=()=>{P.step=2;render(true)};
    el.querySelector("#pl_add").onclick=async()=>{const m=el.querySelector("#pl_amsg");m.textContent="Saving…";
      const data={name:P.name,cls:P.cls,order:"nas",startS:113,prevS:P.prevS,prev:[],amount:Number(el.querySelector("#pr_a").value),farDays:Number(el.querySelector("#pr_f").value),readPages:Number(el.querySelector("#pr_r").value),readStart:1,start:iso(today()),days:[6,0,1,2,3,4],pos:0,created:iso(today()),placement:{date:iso(today()),places:P.places,read:P.read}};
      try{const r=await db.collection("students").add(data);view.pl=null;busy=false;go({name:"student",id:r.id})}catch(e){m.textContent="Not saved. Try again."}}}}
function pickPlaces(prevS,n){const ss=prevS.slice();if(!ss.length)return [];const out=[],used=new Set();
  const w=ss.map(s=>QD.verses[s]),tot=w.reduce((a,b)=>a+b,0);
  for(let k=0;k<n*6&&out.length<n;k++){let r=Math.random()*tot,i=0;while(r>w[i]){r-=w[i];i++}const s=ss[i];if(used.has(s)&&used.size<ss.length)continue;used.add(s);const a=1+Math.floor(Math.random()*Math.max(1,QD.verses[s]-4));out.push({s,a,m:null})}
  return out}
function placeResult(P){useOrder({order:"nas",prevS:P.prevS,startS:113});const pages=pagesOf(PREV_LINES),mist=P.places.reduce((t,x)=>t+(Number(x.m)||0),0),per=P.places.length?mist/P.places.length:0;
  const level=!P.places.length?"new to hifz":per<=0.5?"strong":per<=1.5?"good":"needs care";
  const amount=level==="strong"?10:level==="good"||level==="new to hifz"?5:3;
  const cap=level==="strong"?10:level==="good"?6:4;const far=FAR_DAYS.find(d=>pages/d<=cap)||15;
  const read=P.read==="fluent"?20:P.read==="some"?5:2;
  return {pages,mist,level,amount,far,read,weak:P.places.filter(x=>Number(x.m)>=2).map(x=>x.s)}}

// ----- 9. year report -----
function schoolYearStart(){const t=today(),y=t.getMonth()>=8?t.getFullYear():t.getFullYear()-1;return `${y}-09-01`}
function heartViewAt(st,pos){const v=heartView(st,"progress"),fr=surahFrac(st,pos),col=new Array(115).fill(null);for(let s=0;s<114;s++)col[s]=fr[s]>=0.98?HC.full:fr[s]>0.005?HC.part:null;return {...v,col,fr,gold:new Set()}}
function monthBars(st,from,to){const m=new Map();for(let d=new Date(from+"T00:00:00");iso(d)<=to;d.setMonth(d.getMonth()+1)){m.set(iso(d).slice(0,7),0);d.setDate(1)}
  for(const e of events)if(e.sid===st.id&&e.type==="session"&&e.date>=from&&e.date<=to){const k=e.date.slice(0,7);if(m.has(k))m.set(k,m.get(k)+(Number(e.hifzLines)||0))}
  const ks=[...m.keys()],vals=ks.map(k=>m.get(k)/LINES),max=Math.max(1,...vals),W=Math.max(300,ks.length*60),H=180;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%"><line x1="0" y1="${H-24}" x2="${W}" y2="${H-24}" stroke="#bbb"/>${ks.map((k,i)=>{const h=vals[i]/max*(H-50),x=i*(W/ks.length)+10,w=W/ks.length-20;return `<rect x="${x}" y="${H-24-h}" width="${w}" height="${h}" rx="4" fill="#0D6B5E"/><text x="${x+w/2}" y="${H-8}" font-size="12" text-anchor="middle" fill="#555">${new Date(k+"-01T00:00:00").toLocaleString("en",{month:"short"})}</text><text x="${x+w/2}" y="${H-28-h}" font-size="11" text-anchor="middle" fill="#14302b">${Math.round(vals[i]*10)/10}</text>`}).join("")}</svg>`}
function yearData(st,from,to){useOrder(st);const p0=posAt(st,from),evs=events.filter(e=>e.sid===st.id&&e.date>=from&&e.date<=to),ses=evs.filter(e=>e.type==="session");
  const att=new Set(ses.filter(attended).map(e=>e.date)).size,tests=evs.filter(e=>e.type==="test"&&e.result==="pass").map(e=>e.juz);
  return {p0,gain:pagesOf(st.pos-p0),now:pagesOf(st.pos+PREV_LINES),attPct:ses.length?Math.round(att/ses.length*100):null,tests,pts:evs.reduce((t,e)=>t+ptsOf(e),0),best:streakOf(st).best}}
function renderYear(el,sub,st){view.yf=view.yf||schoolYearStart();view.yt=view.yt||iso(today());const d=yearData(st,view.yf,view.yt);sub.textContent="Year report · "+st.name;
  el.innerHTML=`${backBtn(st.name,{name:"student",id:st.id})}<div class="panel"><h3>Year report</h3>
  <div class="fields"><label>From<input type="date" id="yr_f" value="${view.yf}"></label><label>To<input type="date" id="yr_t" value="${view.yt}"></label></div>
  <div class="stats3"><div><b>+${d.gain} p</b><span>memorized in this period</span></div><div><b>${d.tests.length}</b><span>juz passed</span></div><div><b>${d.attPct==null?"—":d.attPct+"%"}</b><span>attendance</span></div><div><b>${d.pts}</b><span>points</span></div></div>
  <div class="hh"><div><canvas id="yr_h0"></canvas><span>${fmtShort(view.yf)}</span></div><div><canvas id="yr_h1"></canvas><span>${fmtShort(view.yt)}</span></div></div>
  <div>${monthBars(st,view.yf,view.yt)}</div>
  <label>Your word for ${esc(st.name)} (printed at the end)<textarea id="yr_w" rows="3">${esc(view.yw||"")}</textarea></label>
  <div class="actions"><button class="primary" id="yr_dl" ${downloads?"":"hidden"}>Download year report PDF</button><span class="small muted" id="yr_msg"></span></div></div>`;
  wireBack(el);const set=()=>{busy=false;view={...view,yf:el.querySelector("#yr_f").value||view.yf,yt:el.querySelector("#yr_t").value||view.yt};render(true)};
  el.querySelector("#yr_f").onchange=set;el.querySelector("#yr_t").onchange=set;el.querySelector("#yr_w").oninput=e=>{busy=true;view.yw=e.target.value};
  const v0=heartViewAt(st,d.p0),v1=heartViewAt(st,st.pos);heartFont().then(()=>{for(const[id,v]of[["yr_h0",v0],["yr_h1",v1]]){const cv=el.querySelector("#"+id);if(cv)heartDraw(cv,v,700)}});
  el.querySelector("#yr_dl").onclick=()=>heartFont().then(async()=>{const i0=heartDraw(document.createElement("canvas"),v0,1200).toDataURL("image/jpeg",0.9),i1=heartDraw(document.createElement("canvas"),v1,1200).toDataURL("image/jpeg",0.9);
    const svg=monthBars(st,view.yf,view.yt),chart=await svgPng(svg),w=el.querySelector("#yr_w").value.trim();
    saveFile(`year-report-${fileSafe(st.name)}-${view.yt.slice(0,4)}.html`,yearHTML(st,d,i0,i1,chart,w),el.querySelector("#yr_msg"))})}
function yearHTML(st,d,i0,i1,chart,word){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Year report</title><style>${PRINT_CSS}.hd{text-align:center;border-bottom:2px solid #0d6b5e;padding-bottom:8px}.hd h1{font-size:34px;color:#0d6b5e;margin:4px 0}.st{display:flex;gap:8px;margin:14px 0}.st div{flex:1;border:1px solid #bbb;border-radius:8px;padding:8px}.st b{display:block;font-size:20px}.st span{font-size:11px;color:#555}.hh{display:flex;gap:10px;text-align:center}.hh div{flex:1}.hh img{width:100%}.hbox{page-break-inside:avoid}.w{border-left:3px solid #b08a3e;padding:6px 12px;font-size:15px;font-style:italic;margin-top:12px}</style></head><body>
  <div class="hd"><p class="muted">Year report · ${fmtShort(view.yf)} – ${fmtShort(view.yt)} ${view.yt.slice(0,4)}</p><h1>${esc(st.name)}</h1><p class="muted">${esc(clsName(st.cls))} · Teacher ${esc(GRD().teacher||"")}</p></div>
  <div class="st"><div><b>+${d.gain} p</b><span>memorized this period</span></div><div><b>${d.now} p</b><span>memorized in total</span></div><div><b>${d.tests.length}</b><span>juz passed${d.tests.length?": "+d.tests.join(", "):""}</span></div><div><b>${d.attPct==null?"—":d.attPct+"%"}</b><span>attendance</span></div><div><b>${d.pts}</b><span>points · best streak ${d.best}</span></div></div>
  <div class="hbox"><h2>The Quran heart, start and end of the period</h2><div class="hh"><div><img src="${i0}"><p>${fmtShort(view.yf)}</p></div><div><img src="${i1}"><p>${fmtShort(view.yt)}</p></div></div></div>
  ${chart?`<div class="hbox"><h2>Pages memorized each month</h2><img src="${chart}" style="width:70%;max-height:230px;object-fit:contain"></div>`:""}
  ${word?`<p class="w">${esc(word)}<br><span class="muted" style="font-style:normal">${esc(GRD().teacher||"")}</span></p>`:""}</body></html>`}

// ----- teacher sign in / out for each class -----
const minsBetween=(a,b)=>{const x=hm2min(a),y=hm2min(b);return x!=null&&y!=null?y-x:null};
function classTimeChip(c,m){if(!m||!m.started)return "";const late=c&&c.time?minsBetween(c.time,m.started):null;
  if(!m.ended)return `<span class="chip info">Started ${esc(m.started)}${m.startBy?" · "+esc(m.startBy):""}</span>${late>5?` <span class="chip warn">${late} min late</span>`:""}`;
  const d=minsBetween(m.started,m.ended);return `<span class="chip ok">${esc(m.started)}–${esc(m.ended)}${d!=null&&d>=0?` · ${d} min`:""}</span>${late>5?` <span class="chip warn">started ${late} min late</span>`:""}`}
function classTimeText(m){if(!m||!m.started)return "";const d=m.ended?minsBetween(m.started,m.ended):null;return `${m.started}${m.ended?"–"+m.ended:" (not ended)"}${d!=null&&d>=0?` · ${d} min`:""}${m.startBy?` · ${m.startBy}`:""}`}
function classTimeButtons(c,m){if(m&&m.status==="cancelled")return "";if(!m||!m.started)return `<button class="primary" data-cstart="${c.id}">Start class</button>`;if(!m.ended)return `<button class="primary" data-cend="${c.id}">End class</button>`;return ""}
async function classSign(cid,which){const d=iso(today()),m=meetingOf(cid,d),t=nowHM(),by=lastBy()||GRD().teacher||"";
  try{if(which==="start"){if(m)await db.doc(`meetings/${cid}_${d}`).update({started:t,startBy:by,status:m.status||"held"});else await db.doc(`meetings/${cid}_${d}`).set({cls:cid,date:d,status:"held",started:t,startBy:by,t:Date.now()})}
    else if(m){await db.doc(`meetings/${cid}_${d}`).update({ended:t,endBy:by});setTimeout(()=>autoAbsent(cid),800)}}catch(e){}}
function wireClassSign(el){el.querySelectorAll("[data-cstart]").forEach(b=>b.onclick=()=>classSign(b.dataset.cstart,"start"));el.querySelectorAll("[data-cend]").forEach(b=>b.onclick=()=>classSign(b.dataset.cend,"end"))}
const teachMins=mts=>mts.reduce((t,m)=>{const d=m.started&&m.ended?minsBetween(m.started,m.ended):null;return t+(d>0?d:0)},0);

// ----- left early -----
const sesOn=(sid,date)=>events.find(e=>e.type==="session"&&e.sid===sid&&e.date===date);
async function setLeft(sid,date,left,why){const ex=sesOn(sid,date),upd={left:left||"",leftWhy:why==null?(ex&&ex.leftWhy)||"":why};
  try{if(ex)await db.doc("events/"+ex.id).update(upd);else await db.collection("events").add({sid,type:"session",date,att:"present",...upd,t:Date.now(),hifzLines:0,hifzMist:0,revMist:0})}catch(e){}}
const leftChip=e=>e&&e.left?`<span class="chip warn">Left early ${esc(e.left)}${e.leftWhy?" · "+esc(e.leftWhy):""}</span>`:"";
function leftCtl(sid,date,listMode){const e=sesOn(sid,date);if(!e||!attended(e))return "";
  if(listMode)return e.left?`${leftChip(e)} <button class="link small" data-leftx="${sid}">Undo</button>`:`<button class="attbtn" data-left="${sid}">Left early</button>`;
  return `<span class="leftin"><label class="inl">Left at<input type="time" data-lt="${sid}" value="${esc(e.left||"")}"></label><input data-lw="${sid}" value="${esc(e.leftWhy||"")}" placeholder="Reason (optional)" aria-label="Reason for leaving early"></span>`}
function wireLeft(el,date){
  el.querySelectorAll("[data-left]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();setLeft(b.dataset.left,date,nowHM())});
  el.querySelectorAll("[data-leftx]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();setLeft(b.dataset.leftx,date,"","")});
  el.querySelectorAll("[data-lt]").forEach(i=>i.onchange=()=>{busy=false;setLeft(i.dataset.lt,date,i.value)});
  el.querySelectorAll("[data-lw]").forEach(i=>{i.oninput=()=>busy=true;i.onchange=()=>{busy=false;const t=el.querySelector(`[data-lt="${i.dataset.lw}"]`);setLeft(i.dataset.lw,date,t?t.value:"",i.value.trim())}})}
