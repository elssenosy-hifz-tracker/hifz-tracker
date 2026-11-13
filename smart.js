
// ================= smart.js (v25): undo, odd-entry warning, bottom bar + search, class now, amount suggestions, weekly summary, journey map, star of the month, voice notes, Arabic interface =================
// ---------- 1. undo ----------
let undoT=null;
function undoToast(label,fn){let t=document.getElementById("undoT");if(!t){t=document.createElement("div");t.id="undoT";t.className="undoT";document.body.append(t)}
  clearTimeout(undoT);t.innerHTML=`<span>${esc(label)}</span><button type="button" id="undoB">Undo</button><i class="undobar"></i>`;t.hidden=false;t.classList.remove("go");void t.offsetWidth;t.classList.add("go");
  t.querySelector("#undoB").onclick=async()=>{t.hidden=true;clearTimeout(undoT);try{await fn();t.innerHTML="<span>Undone</span>";t.hidden=false;undoT=setTimeout(()=>t.hidden=true,1800)}catch(e){t.innerHTML="<span>Could not undo. Check your connection.</span>";t.hidden=false;undoT=setTimeout(()=>t.hidden=true,3000)}};
  undoT=setTimeout(()=>{t.hidden=true},10000)}
const plain=e=>{const {id,...d}=e;return d};
function errToast(label){let t=document.getElementById("errT");if(!t){t=document.createElement("div");t.id="errT";t.className="errT";t.setAttribute("role","alert");document.body.append(t)}t.textContent=label;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,7000);t.onclick=()=>t.hidden=true;try{if(AR)arWalk(t)}catch(_){}}

// ---------- 2. odd-entry warning ----------
function oddChecks(st,d,usual){const w=[];
  if(attended(d)&&d.hifzLines>0&&usual>0&&d.hifzLines>Math.max(usual*2.5,usual+15))w.push(`New hifz is ${pagesOf(d.hifzLines)} pages, about ${Math.round(d.hifzLines/usual)} times ${st.name}'s usual ${pagesOf(usual)} pages.`);
  if((d.hifzMist||0)>15)w.push(`${d.hifzMist} hifz mistakes is a lot.`);
  if((d.revMist||0)>25)w.push(`${d.revMist} review mistakes is a lot.`);
  if(d.date>iso(today()))w.push("The date is in the future.");
  if(d.date<iso(addDays(today(),-14)))w.push("The date is more than two weeks ago.");
  return w}

// ---------- 3. bottom bar + search ----------
const NAV=[["today",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',"Today"],["list",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="7" r="2.5"/><path d="M16.5 12.5c2.6.2 4.4 1.9 5 4.5"/></svg>',"Students"],["tajweed",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5z"/><path d="M12 6v14"/></svg>',"Tajweed"],["reports",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><rect x="5" y="11" width="3" height="7" rx="1"/><rect x="10.5" y="6" width="3" height="12" rx="1"/><rect x="16" y="9" width="3" height="9" rx="1"/></svg>',"Reports"],["settings",'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',"Settings"]];
const navOf=v=>({tajweed:"tajweed",today:"today",list:"list",reports:"reports",crep:"reports",wsum:"reports",star:"reports",grading:"reports",screen:"reports",settings:"settings",classes:"settings",fees:"settings",place:"settings",schools:"settings",schoolv:"settings",teacher:"settings",gmove:"settings",handover:"settings",class:"today",buddy:"today",school:"settings",waitlist:"settings",sover:"reports",inbox:"settings"})[v]||"list";
function afterRender(){
  let n=document.getElementById("nav");
  if(!n){n=document.createElement("nav");n.id="nav";n.className="bnav";n.innerHTML=NAV.map(([k,i,l])=>`<button type="button" data-nav="${k}"><i>${i}</i><span>${l}</span></button>`).join("");document.body.append(n);
    n.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{busy=false;go({name:b.dataset.nav})})}
  const cur=navOf(view.name);n.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("on",b.dataset.nav===cur));
  const hide=view.name==="session"||view.name==="screen";n.hidden=hide;document.body.classList.toggle("hasnav",!hide);
  n.querySelector('[data-nav="settings"]').hidden=!!SUB;
  try{schoolAfter()}catch(e){console.error(e)}
  try{feedbackAfter()}catch(e){console.error(e)}
  if(typeof tourMaybe==="function")tourMaybe();
  {const h=document.querySelector(".topfix");if(h&&!document.getElementById("langTop")){h.insertAdjacentHTML("afterbegin",`<button type="button" id="langTop" class="link" data-noar lang="${AR?"en":"ar"}">${AR?"English":"العربية"}</button>`);document.getElementById("langTop").onclick=()=>setLang(AR?"en":"ar")}}
  arApply();
}
let listQ="";
function searchBox(){return `<div class="srch"><input type="search" id="srch" placeholder="${typeof isAdminV==="function"&&isAdminV()&&typeof schoolOn==="function"&&schoolOn()?"Search a student, teacher or group":"Search a student by name"}" value="${esc(listQ)}" autocomplete="off" aria-label="Search a student"></div>`}
function wireSearch(el){const i=el.querySelector("#srch");if(!i)return;const f=()=>{listQ=i.value;const q=listQ.trim().toLowerCase();let n=0;el.querySelectorAll(".list .row").forEach(r=>{const st=allStudents.find(s=>s.id===r.dataset.id);const ok=!q||(st&&String(st.name).toLowerCase().includes(q));r.hidden=!ok;if(ok)n++});let m=el.querySelector("#srchNone");if(!m){m=document.createElement("p");m.id="srchNone";m.className="muted";i.parentElement.after(m)}m.textContent=q&&!n?"No student with that name.":"";if(typeof peopleSearch==="function")peopleSearch(el,q)};i.oninput=f;if(listQ)f()}

// ---------- 4. class now ----------
const minsOf=t=>{if(!t)return null;const [h,m]=String(t).split(":").map(Number);return h*60+(m||0)};
const nowMins=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
function classesToday(){const wd=today().getDay();return classes.filter(c=>(c.days||[]).includes(wd)).sort((a,b)=>(minsOf(a.time)||0)-(minsOf(b.time)||0))}
function liveClass(){const n=nowMins();return classesToday().find(c=>{const s=minsOf(c.time),e=minsOf(c.end)||((s||0)+90);return s!=null&&n>=s-20&&n<=e+30})||null}
function nextClassText(){for(let k=1;k<=7;k++){const d=addDays(today(),k),wd=d.getDay();const c=classes.filter(c=>(c.days||[]).includes(wd)).sort((a,b)=>(minsOf(a.time)||0)-(minsOf(b.time)||0))[0];if(c)return `${c.name}, ${fmt(d)}${c.time?" at "+c.time:""}`}return ""}
function renderToday(el,sub,ta){
  const td=classesToday().filter(schVisible),live=liveClass(),pick=view.cls?classes.find(c=>c.id===view.cls):myPick(td)||live||td.find(c=>(minsOf(c.time)||0)>=nowMins())||td[td.length-1];
  sub.textContent="Today · "+fmt(today());
  if(!classes.length){el.innerHTML=`<div class="panel empty"><p>No classes yet. Add them in Settings.</p></div>`;return}
  const mine=todayMine(td);
  if(!view.cls&&mine.length>=2)return renderTodayPick(el,mine,live);
  const tabs=td.length?"":`<div class="filters">${classes.filter(schVisible).map(c=>`<button class="fbtn ${pick&&c.id===pick.id?"on":""}" data-tcls="${c.id}">${esc(c.name)}${c.time?" · "+esc(c.time):""}</button>`).join("")}</div>`;
  const c=pick||classes[0];const isToday=td.some(x=>x.id===c.id);
  const list=classOrder(c.id),m=meetingOf(c.id,iso(today()));
  const done=list.filter(s=>doneToday(s.id)).length;
  const ses=sid=>events.filter(e=>e.type==="session"&&e.sid===sid&&e.date===iso(today())).sort((a,b)=>(b.t||0)-(a.t||0))[0];
  const line=e=>{if(!e)return "";const A={present:"On time",late:"Late",absent:"Absent",excused:"Excused"};const p=[A[e.att]||""];if(attended(e)){if(e.hifzNR)p.push("hifz not recited");else if(e.hifzText)p.push(e.hifzText);if(e.revNR)p.push("review not recited");else if(e.revType&&e.revType!=="none")p.push("review "+(e.revRows||[]).length+((e.revSkip||[]).length?" of "+((e.revRows||[]).length+(e.revSkip||[]).length):""))}return p.join(" · ")};
  const nx=list.find(s=>!doneToday(s.id));
  el.innerHTML=`${subBanner()}${typeof adminDashHTML==="function"&&!view.cls?adminDashHTML():""}${starBanner()}${wsumBanner()}${view.cls&&mine.length>=2?backBtn("Today's classes",{name:"today"}):""}${!isToday?`<div class="banner info">No class today.${nextClassText()?" Next: "+esc(nextClassText())+".":""}</div>`:""}${tabs}
   <div class="panel tnow" data-cid="${c.id}">
    <div class="head"><h2>${esc(c.name)}</h2><button type="button" class="link small" data-openc="${c.id}">Class log</button><span class="chip ${live&&live.id===c.id?"ok":"plain"}">${live&&live.id===c.id?"Now":esc(c.time||"")}${c.end?"–"+esc(c.end):""}</span></div>
    ${isToday?`<div class="actions">${classTimeChip(c,m)}${classTimeButtons(c,m)}</div>`:""}
    <div class="tprog"><div class="bar"><i style="width:${list.length?Math.round(done/list.length*100):0}%"></i></div><span class="small"><b>${done} of ${list.length}</b> recorded</span></div>
    ${nx?`<button class="primary qnext" data-trec="${nx.id}">Record next › ${esc(nx.name)}</button>`:list.length?`<div class="banner ok">Everyone is recorded for today.</div>`:""}
    ${list.length&&isToday&&(typeof canEditCls!=="function"||canEditCls(c.id))?`<button type="button" class="qnext tbud" data-simgo='${JSON.stringify({name:"roll",id:c.id})}'>📋 Quick attendance</button>`:""}
    ${list.length>=2?`<button type="button" class="qnext tbud" id="tBuddy">👥 Buddy recitation</button>`:""}
    <div class="tlist">${list.map(s=>{const e=ses(s.id);return `<div class="trow ${doneToday(s.id)?"done":""}"><button type="button" class="tname" data-tst="${s.id}"><b>${esc(s.name)}${flameChip(s)}</b><span class="small muted">${e?esc(line(e)):esc(planShort(s))}</span></button><span class="tatt">${isToday?attCtl(s,iso(today())):""}</span><button type="button" class="${doneToday(s.id)?"":"primary"} sm" data-trec="${s.id}">${doneToday(s.id)?"Edit":"Record"}</button></div>`}).join("")}</div>
   </div>${isToday&&typeof endSummaryHTML==="function"?endSummaryHTML(c,m,list):""}${alertsPanel(list)}${testsPanel()}${challengeCard(c)}`;
  wireBack(el);wireChallenge(el);{const bb=el.querySelector("#tBuddy");if(bb)bb.onclick=()=>go({name:"buddy",cls:c.id})}el.querySelectorAll("[data-tcls]").forEach(b=>b.onclick=()=>go({name:"today",cls:b.dataset.tcls}));
  el.querySelectorAll("[data-trec]").forEach(b=>b.onclick=()=>go({name:"session",id:b.dataset.trec}));
  el.querySelectorAll("[data-tst]").forEach(b=>b.onclick=()=>go({name:"student",id:b.dataset.tst}));
  wireClassSign(el);wireAtt(el,iso(today()));wireAlerts(el);wireTests(el);
  el.querySelectorAll("[data-openc]").forEach(b=>b.onclick=()=>go({name:"class",id:b.dataset.openc,date:iso(today())}));
  {const g=el.querySelector("[data-gows]");if(g)g.onclick=()=>go({name:"wsum",cls:c.id});const h=el.querySelector("[data-gostar]");if(h)h.onclick=()=>go({name:"star",cls:c.id})}
}
// Today's classes as cards: a teacher sees the groups they teach (or substitute in) today, an admin sees every group. Tap one to open its students.
function todayMine(td){try{if(schoolOn()&&!isAdminV()&&!isSupervisor()){const t=meTeacher();if(t){const m=td.filter(c=>c.teacher===t.id||subsFor(c.id).some(a=>a.tid===t.id));if(m.length)return m}}}catch(_){}return td}
function renderTodayPick(el,list,live){const d=iso(today()),n=nowMins(),adm=!SUB||isAdminV()||isSupervisor();
  const info=c=>{const ss=classOrder(c.id),done=ss.filter(s=>doneToday(s.id)).length,m=meetingOf(c.id,d),end=minsOf(c.end)||((minsOf(c.time)||0)+90);
    return {c,ss,done,m,full:ss.length>0&&done===ss.length,now:live&&live.id===c.id,past:minsOf(c.time)!=null&&n>end+30}};
  const rows=list.map(info).sort((a,b)=>(a.full-b.full)||((minsOf(a.c.time)||0)-(minsOf(b.c.time)||0)));
  const card=r=>{const c=r.c,pct=r.ss.length?Math.round(r.done/r.ss.length*100):0;
    const chip=r.m&&r.m.status==="cancelled"?'<span class="chip bad">Cancelled</span>':r.full?'<span class="chip ok">All recorded ✓</span>':r.now?'<span class="chip ok">Now</span>':r.past?'<span class="chip warn">Finished</span>':'<span class="chip plain">Later today</span>';
    let tn="";if(adm&&c.teacher)try{tn=tName(c.teacher)}catch(_){}
    return `<button type="button" class="tpick ${r.now?"now":""} ${r.full?"full":""}" data-tcls="${c.id}"><span class="tp-h"><b><bdi>${esc(c.name)}</bdi></b>${chip}</span>
     <span class="small muted">${c.time?"🕒 "+esc(c.time)+(c.end?"–"+esc(c.end):""):""}${tn?" · "+esc(tn):""} · ${r.ss.length} ${r.ss.length===1?"student":"students"}</span>
     <span class="tprog"><span class="bar"><i style="width:${pct}%"></i></span><span class="small"><b>${r.done} of ${r.ss.length}</b> recorded</span></span><span class="tp-go">›</span></button>`};
  el.innerHTML=`${subBanner()}${typeof adminDashHTML==="function"&&!view.cls?adminDashHTML():""}${starBanner()}${wsumBanner()}<p class="small muted lbl"><span>Today's classes</span> · ${list.length}</p><div class="tpicks">${rows.map(card).join("")}</div>${testsPanel()}`;
  el.querySelectorAll("[data-tcls]").forEach(b=>b.onclick=()=>go({name:"today",cls:b.dataset.tcls}));wireTests(el)}
function planShort(s){try{useOrder(s);const ends=plannedEnds(s);const wk=s.days.length;const e=ends.length?ends[Math.min(wk,ends.length)-1]:null;const t=e!=null?"Today: "+rangeText(s.pos,e):"";const cur=allStudents.find(x=>x.id===view.id);if(cur)useOrder(cur);return t}catch(_){return ""}}
async function autoStartClass(st){try{const c=classes.find(x=>x.id===st.cls);if(!c||!classesToday().some(x=>x.id===c.id))return;const m=meetingOf(c.id,iso(today()));if(m&&(m.started||m.status==="cancelled"))return;const s=minsOf(c.time),n=nowMins();if(s!=null&&(n<s-30||n>(minsOf(c.end)||s+90)+30))return;await classSign(c.id,"start")}catch(_){}}

// ---------- 5. amount suggestion ----------
function amountSuggestion(st){
  const ses=events.filter(e=>e.sid===st.id&&e.type==="session"&&attended(e)).sort((a,b)=>b.date.localeCompare(a.date)||((b.t||0)-(a.t||0)));
  const seen=new Set(),last=[];for(const e of ses){if(seen.has(e.date))continue;seen.add(e.date);last.push(e);if(last.length>=8)break}
  if(last.length<6)return null;
  const good=e=>!e.hifzNR&&e.hifzLines>0&&["Excellent","Very good"].includes(e.hifzGrade);
  const hard=e=>e.hifzNR||["Pass","Repeat"].includes(e.hifzGrade);
  const a=Number(st.amount)||0;
  if(last.slice(0,8).length>=8&&last.every(good))return {dir:"up",why:`${last.length} strong sessions in a row (Excellent or Very good, no "not ready").`,to:a>0?Math.round(a*1.5):null};
  const h=last.slice(0,6).filter(hard).length;
  if(h>=3)return {dir:"down",why:`${h} of the last 6 sessions were "not ready", Pass or Repeat.`,to:a>0?Math.max(3,Math.round(a*0.67)):null};
  return null}
const dismissKey=(st,s)=>`hifz.sugg.${st.id}.${s.dir}`;
function suggPanel(st){const s=amountSuggestion(st);if(!s)return "";try{const d=localStorage.getItem(dismissKey(st,s));if(d&&daysBetween(parse(d),today())<14)return ""}catch(_){}
  return `<div class="panel sugg ${s.dir}"><div class="head"><h3>${s.dir==="up"?"Ready for more?":"Make it lighter?"}</h3></div>
   <p class="small">${esc(st.name)}: ${esc(s.why)} ${s.dir==="up"?"Try a bigger daily amount":"Try a smaller daily amount for a while"}${s.to?`: <b>${esc(amountLabel(s.to))}</b> instead of ${esc(amountLabel(st.amount))}`:""}.</p>
   <div class="actions">${s.to?`<button class="primary adminonly" data-sgo="${s.to}">Use ${esc(amountLabel(s.to))}</button>`:`<button class="adminonly" data-sedit>Change the amount</button>`}<button data-sno>Not now</button></div></div>`}
function wireSugg(el,st){const s=amountSuggestion(st);if(!s)return;
  const b=el.querySelector("[data-sgo]");if(b)b.onclick=async()=>{const old=st.amount;try{await db.doc("students/"+st.id).update({amount:Number(b.dataset.sgo)});undoToast(`Daily amount is now ${amountLabel(Number(b.dataset.sgo))}`,()=>db.doc("students/"+st.id).update({amount:old}))}catch(_){}};
  const e=el.querySelector("[data-sedit]");if(e)e.onclick=()=>go({name:"edit",id:st.id});
  const n=el.querySelector("[data-sno]");if(n)n.onclick=()=>{try{localStorage.setItem(dismissKey(st,s),iso(today()))}catch(_){}n.closest(".panel").remove()}}

// ---------- 6. weekly summary ----------
function weekData(cid,endIso){const end=parse(endIso),start=addDays(end,-6),si=iso(start);
  const list=classOrder(cid);const evs=events.filter(e=>e.date>=si&&e.date<=endIso);
  const rows=list.map(st=>{const ses=evs.filter(e=>e.sid===st.id&&e.type==="session");const byDay=new Map();ses.forEach(e=>{const o=byDay.get(e.date);if(!o||(e.t||0)>(o.t||0))byDay.set(e.date,e)});const ds=[...byDay.values()];
    const att=ds.filter(attended).length,abs=ds.filter(e=>e.att==="absent").length,nr=ds.filter(e=>e.hifzNR||e.revNR).length;
    const lines=ds.reduce((t,e)=>t+(e.hifzLines||0),0),mist=ds.reduce((t,e)=>t+(e.hifzMist||0),0);
    const pts=evs.filter(e=>e.sid===st.id).reduce((t,e)=>t+ptsOf(e),0);
    return {st,att,abs,nr,lines,mist,pts,days:ds.length,sugg:amountSuggestion(st)}});
  return {start:si,end:endIso,rows,held:meetings.filter(m=>m.id.startsWith(cid+"_")&&m.id.slice(cid.length+1)>=si&&m.id.slice(cid.length+1)<=endIso&&m.status!=="cancelled").length}}
function renderWsum(el,sub){
  const c=classes.find(x=>x.id===view.cls)||classes[0];if(!c){el.innerHTML='<div class="panel empty">No classes yet.</div>';return}
  const end=view.end||iso(today());const w=weekData(c.id,end);sub.textContent="Weekly summary · "+c.name;
  const r=w.rows,top=r.filter(x=>x.lines>0).sort((a,b)=>b.lines-a.lines).slice(0,3);
  const follow=r.filter(x=>x.abs>=2||x.nr>=2||(x.lines>0&&x.mist/Math.max(1,x.lines/15)>4));
  const absent=r.filter(x=>x.days===0);
  const attPct=(()=>{const t=r.reduce((s,x)=>s+x.days,0),a=r.reduce((s,x)=>s+x.att,0);return t?Math.round(a/t*100):0})();
  const best=r.slice().sort((a,b)=>b.pts-a.pts)[0];
  el.innerHTML=`${backBtn("Reports",{name:"reports"})}
   <div class="filters">${classes.map(x=>`<button class="fbtn ${x.id===c.id?"on":""}" data-wc="${x.id}">${esc(x.name)}</button>`).join("")}<button class="fbtn" data-wprev>‹ Week before</button>${end<iso(today())?`<button class="fbtn" data-wnext>Week after ›</button>`:""}</div>
   <div class="panel"><div class="head"><h2>${esc(c.name)}</h2><span class="small muted">${fmtShort(w.start)} – ${fmtShort(w.end)}</span></div>
    <div class="stats3"><div><b>${w.held}</b><span>classes held</span></div><div><b>${attPct}%</b><span>attendance</span></div><div><b>${pagesOf(r.reduce((t,x)=>t+x.lines,0))}</b><span>pages memorized</span></div></div>
    ${best&&best.pts>0?`<p>⭐ <b>Most points this week:</b> ${esc(best.st.name)} (${sgn(best.pts)})</p>`:""}
    <h3 class="sec">Moved ahead most</h3>${top.length?`<ol class="wl">${top.map(x=>`<li><b>${esc(x.st.name)}</b> · ${pagesOf(x.lines)} pages</li>`).join("")}</ol>`:'<p class="muted small">No new hifz this week.</p>'}
    <h3 class="sec">Needs follow-up</h3>${follow.length?`<ul class="wl">${follow.map(x=>`<li><b>${esc(x.st.name)}</b> · ${[x.abs>=2?`absent ${x.abs} times`:"",x.nr>=2?`not ready ${x.nr} times`:"",x.lines>0&&x.mist/Math.max(1,x.lines/15)>4?"many mistakes per page":""].filter(Boolean).join(", ")}</li>`).join("")}</ul>`:'<p class="muted small">Nobody this week. Well done.</p>'}
    ${absent.length?`<h3 class="sec">Not recorded at all this week</h3><p>${absent.map(x=>esc(x.st.name)).join(", ")}</p>`:""}
    ${r.some(x=>x.sugg)?`<h3 class="sec">Daily amount suggestions</h3><ul class="wl">${r.filter(x=>x.sugg).map(x=>`<li><b>${esc(x.st.name)}</b> · ${x.sugg.dir==="up"?"ready for more":"make it lighter"}${x.sugg.to?` (${esc(amountLabel(x.sugg.to))})`:""}</li>`).join("")}</ul>`:""}
    <div class="actions"><button data-wcopy>Copy as text</button><span class="small muted" id="wmsg"></span></div>
   </div>`;
  wireBack(el);
  el.querySelectorAll("[data-wc]").forEach(b=>b.onclick=()=>go({name:"wsum",cls:b.dataset.wc,end}));
  el.querySelector("[data-wprev]").onclick=()=>go({name:"wsum",cls:c.id,end:iso(addDays(parse(end),-7))});
  const nb=el.querySelector("[data-wnext]");if(nb)nb.onclick=()=>{const n=addDays(parse(end),7);go({name:"wsum",cls:c.id,end:iso(n>today()?today():n)})};
  el.querySelector("[data-wcopy]").onclick=async()=>{const t=el.querySelector(".panel").innerText;try{await navigator.clipboard.writeText(t);el.querySelector("#wmsg").textContent="Copied."}catch(_){el.querySelector("#wmsg").textContent="Could not copy here. Select the text instead."}};
}
function wsumBanner(){const wd=today().getDay();if(![5,6].includes(wd)||!classes.length)return "";return `<div class="banner info">This week's summary is ready. <button class="link" data-gows>Open it</button></div>`}

// ---------- 7. journey map ----------
function journeyHTML(st){useOrder(st);
  const prev=(st.prevS||[]).slice();const segs=SEGS.filter(g=>g.e-g.s>0.05);
  const nodes=[...prev.filter(s=>!segs.some(g=>g.surah===s)).map(s=>({s,st:"done",prev:true})),...segs.map(g=>({s:g.surah,st:st.pos>=g.e-0.05?"done":st.pos>g.s+0.01?"cur":"todo",pct:Math.max(0,Math.min(1,(st.pos-g.s)/(g.e-g.s)))}))];
  const seen=new Set(),N=nodes.filter(n=>{if(seen.has(n.s))return false;seen.add(n.s);return true});
  let ci=N.findIndex(n=>n.st==="cur");if(ci<0){ci=N.findIndex(n=>n.st==="todo");if(ci>=0)N[ci].st="cur"}
  const done=N.filter(n=>n.st==="done").length;
  const C=6,W=340,dx=W/C,dy=62,rows=Math.ceil(N.length/C),H=rows*dy+30;
  const P=N.map((n,i)=>{const r=Math.floor(i/C),k=i%C,col=r%2?C-1-k:k;return {x:dx/2+col*dx,y:30+r*dy}});
  let path="";P.forEach((p,i)=>{if(!i){path+=`M${p.x} ${p.y}`;return}const q=P[i-1];if(q.y===p.y)path+=` L${p.x} ${p.y}`;else{const cx=q.x<W/2?q.x-dx/2+4:q.x+dx/2-4;path+=` C${cx} ${q.y} ${cx} ${p.y} ${p.x} ${p.y}`}});
  let lit="";if(ci>0){P.slice(0,ci+1).forEach((p,i)=>{if(!i){lit+=`M${p.x} ${p.y}`;return}const q=P[i-1];if(q.y===p.y)lit+=` L${p.x} ${p.y}`;else{const cx=q.x<W/2?q.x-dx/2+4:q.x+dx/2-4;lit+=` C${cx} ${q.y} ${cx} ${p.y} ${p.x} ${p.y}`}})}
  const nm=s=>SURAH_NAMES[s];
  return `<div class="jmap"><p class="small"><b>${done} / ${N.length}</b> surahs memorized${ci>=0?` · Now: <b>${esc(nm(N[ci].s))}</b>`:" · Path complete!"}</p>
   <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hifz journey map"><path d="${path}" class="jp"/>${lit?`<path d="${lit}" class="jl"/>`:""}
   ${N.map((n,i)=>{const p=P[i];const r=n.st==="cur"?15:11;return `<g class="jn ${n.st}"><title>${esc(nm(n.s))}</title>${n.st==="cur"?`<circle cx="${p.x}" cy="${p.y}" r="21" class="jh"/>`:""}<circle cx="${p.x}" cy="${p.y}" r="${r}"/><text x="${p.x}" y="${p.y+4}">${n.s+1}</text>${n.st==="cur"||i===N.length-1||i===0?`<text class="jt" x="${p.x}" y="${p.y+(n.st==="cur"?32:26)}">${esc(nm(n.s))}</text>`:""}</g>`}).join("")}</svg>
   <div class="jleg small"><span><i class="done"></i>memorized</span><span><i class="cur"></i>now</span><span><i class="todo"></i>still ahead</span></div></div>`}
function journeyPanel(st){return `<details class="panel jpanel"><summary><h3>Hifz journey map</h3><span class="small muted">tap to open</span></summary>${journeyHTML(st)}</details>`}

// ---------- 8. star of the month ----------
function starOf(cid,ym){const list=classOrder(cid);const evs=events.filter(e=>String(e.date).slice(0,7)===ym);
  const sc=list.map(st=>{const mine=evs.filter(e=>e.sid===st.id);const days=new Set(mine.filter(e=>e.type==="session"&&attended(e)).map(e=>e.date)).size;const pts=mine.reduce((t,e)=>t+ptsOf(e),0);const lines=mine.filter(e=>e.type==="session").reduce((t,e)=>t+(e.hifzLines||0),0);return {st,pts,days,lines,score:pts+days*2}}).filter(x=>x.days>0).sort((a,b)=>b.score-a.score||b.lines-a.lines);
  return sc}
const ymLabel=ym=>{const [y,m]=ym.split("-").map(Number);return new Date(y,m-1,1).toLocaleDateString(LOC(),{month:"long",year:"numeric"})};
function prevYm(){const d=today();return iso(new Date(d.getFullYear(),d.getMonth()-1,1)).slice(0,7)}
function renderStar(el,sub){const c=classes.find(x=>x.id===view.cls)||classes[0];if(!c){el.innerHTML='<div class="panel empty">No classes yet.</div>';return}
  const ym=view.ym||prevYm(),sc=starOf(c.id,ym),w=sc[0];sub.textContent="Star of the month · "+c.name;
  const [y,m]=ym.split("-").map(Number),pv=iso(new Date(y,m-2,1)).slice(0,7),nx=iso(new Date(y,m,1)).slice(0,7);
  el.innerHTML=`${backBtn("Reports",{name:"reports"})}
   <div class="filters">${classes.map(x=>`<button class="fbtn ${x.id===c.id?"on":""}" data-sc="${x.id}">${esc(x.name)}</button>`).join("")}<button class="fbtn" data-sm="${pv}">‹ ${esc(ymLabel(pv))}</button>${nx<=iso(today()).slice(0,7)?`<button class="fbtn" data-sm="${nx}">${esc(ymLabel(nx))} ›</button>`:""}</div>
   <div class="panel starp">${w?`<div class="starbig">★</div><p class="small muted">${esc(c.name)} · ${esc(ymLabel(ym))}</p><h2>${esc(w.st.name)}</h2><p>${sgn(w.pts)} points · came ${w.days} ${w.days===1?"day":"days"} · ${pagesOf(w.lines)} pages memorized</p>
     <div class="actions" style="justify-content:center"><button class="primary" data-scert>Download certificate (PDF)</button><span class="small muted cmsg"></span></div>`:`<p class="muted">No sessions recorded in ${esc(ymLabel(ym))}.</p>`}
   </div>
   ${sc.length>1?`<div class="panel"><h3>Ranking</h3><ol class="wl">${sc.slice(0,10).map(x=>`<li><b>${esc(x.st.name)}</b> · ${sgn(x.pts)} pts · ${x.days} days</li>`).join("")}</ol><p class="small muted">Score = points + 2 for each day attended. Ties go to more pages memorized.</p></div>`:""}`;
  wireBack(el);
  el.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>go({name:"star",cls:b.dataset.sc,ym}));
  el.querySelectorAll("[data-sm]").forEach(b=>b.onclick=()=>go({name:"star",cls:c.id,ym:b.dataset.sm}));
  const cb=el.querySelector("[data-scert]");if(cb)cb.onclick=()=>saveFile(`star-of-the-month-${fileSafe(w.st.name)}-${ym}.html`,starCert(w.st,c,ym,w),el.querySelector(".cmsg"));
}
function starCert(st,c,ym,w){const g=GRD();return `<!doctype html><html><head><meta charset="utf-8"><title>Star of the month</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,serif;color:#1b2626}
 .c{box-sizing:border-box;height:196mm;padding:10mm;background:#fff}.b{height:100%;box-sizing:border-box;border-radius:18px;background:linear-gradient(160deg,#0d6b5e,#0a4f46);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;position:relative;overflow:hidden}
 .s{font-size:110px;line-height:1;color:#f2c14e}.k{letter-spacing:.35em;text-transform:uppercase;font-size:14px;color:#f2c14e}h1{font-size:46px;margin:0;font-weight:normal}.n{font-size:54px;margin:8px 0 4px;color:#fff;border-bottom:2px solid #f2c14e;padding:0 40px 8px}
 .l{font-size:19px;opacity:.92;margin:6px 0}.f{margin-top:18px;font-size:14px;opacity:.85}.dot{position:absolute;border-radius:50%;background:rgba(255,255,255,.06)}</style></head><body><div class="c"><div class="b">
 <i class="dot" style="width:300px;height:300px;left:-90px;top:-90px"></i><i class="dot" style="width:220px;height:220px;right:-60px;bottom:-60px"></i>
 <div class="s">★</div><div class="k">${esc(ymLabel(ym))}</div><h1>Star of the Month</h1><div class="n">${esc(st.name)}</div>
 <p class="l">for excellent effort in ${esc(c.name)}: ${sgn(w.pts)} points, ${w.days} days attended, ${pagesOf(w.lines)} pages memorized.</p>
 <p class="l">May Allah bless you and make the Quran the light of your heart.</p>
 <div class="f">${esc(g.teacher||teacherName()||"")}</div></div></div></body></html>`}
function starBanner(){const d=today().getDate();if(d>7||!classes.length)return "";const ym=prevYm();const names=classes.map(c=>{const w=starOf(c.id,ym)[0];return w?`${esc(c.name)}: <b>${esc(w.st.name)}</b>`:""}).filter(Boolean);if(!names.length)return "";return `<div class="banner ok">★ Stars of ${esc(ymLabel(ym))}: ${names.join(" · ")} <button class="link" data-gostar>See</button></div>`}

// ---------- reports + settings hubs ----------
function renderReports(el,sub){sub.textContent="Reports";
  const card=(id,i,t,d)=>`<button type="button" class="hub" data-hub="${id}"><i>${i}</i><b>${t}</b><span>${d}</span></button>`;
  el.innerHTML=`<div class="hubs">${SUB?"":card("sover","🏫","School overview","Every group and teacher, and this week by teacher")}${SUB?"":card("mrep","🗓","Month report","One page for the board: students, juz, attendance, groups")}${card("crep","▤","Class report","Chart, table and diary for any dates")}${card("wsum","☷","Weekly summary","Who moved ahead, who needs follow-up")}${card("star","★","Star of the month","Picked from points and attendance, with a certificate")}${card("screen","▣","Class screen","Big board for the classroom")}${card("buddy","👥","Buddy recitation","Students recite to each other in pairs")}${card("grading","✓","How we grade","Grading rules and guide")}</div>
   <p class="small muted">Student reports, year reports and parent messages are on each student's page.</p>`;
  el.querySelectorAll("[data-hub]").forEach(b=>b.onclick=()=>{const c=(classes.find(x=>x.id===getListCls())||(tchList()&&myCls()[0])||classes[0]||{}).id;const h=b.dataset.hub;go(h==="crep"||h==="screen"?{name:h,id:c}:{name:h,cls:c})})}
function renderSettings(el,sub){if(SUB){go({name:"list"});return}sub.textContent="Settings";
  const card=(id,i,t,d)=>`<button type="button" class="hub" data-hub="${id}"><i>${i}</i><b>${t}</b><span>${d}</span></button>`;
  el.innerHTML=`<div class="panel setlist"><button type="button" class="setrow" data-hub="schools"><i>🏫</i><span><b>Schools, teachers and groups</b><small>Each school: teachers, groups, students, waiting list, fees</small></span><em>‹</em></button><button type="button" class="setrow" data-hub="classes" data-sec="groups"><i>👥</i><span><b>Groups and daily reading</b><small>Class days, times and daily reading per group</small></span><em>‹</em></button><button type="button" class="setrow" data-hub="classes" data-sec="points"><i>★</i><span><b>Grading and points</b><small>Points for attendance, homework, recitation and behaviour</small></span><em>‹</em></button><button type="button" class="setrow" data-hub="classes" data-sec="breaks"><i>🌙</i><span><b>Ramadan and holidays</b><small>Breaks: review only or half the new amount</small></span><em>‹</em></button><button type="button" class="setrow" data-hub="classes" data-sec="backup"><i>💾</i><span><b>Backup</b><small>Download or restore a copy of all records</small></span><em>‹</em></button><button type="button" class="setrow" data-hub="inbox"><i>💬</i><span><b>Suggestions and problems</b><small>${fbNew()?(AR?`${fbNew()} رسالة جديدة`:`${fbNew()} new`):"Messages from teachers to the administration"}</small></span><em>‹</em></button></div>
   <p class="small muted" id="bkSetMsg" aria-live="polite"></p>
   ${typeof shareSettingHTML==="function"?shareSettingHTML():""}<div class="panel"><h3>Attendance</h3><label class="inl">Late after <input type="number" id="graceIn" min="0" max="60" value="${graceMins()}" style="width:70px" inputmode="numeric"> minutes from the class start</label> <span class="small muted" id="graceMsg"></span></div>
   <div class="panel"><h3>Language · اللغة</h3><div class="seg"><button type="button" class="fbtn ${AR?"":"on"}" data-lang="en">English</button><button type="button" class="fbtn ${AR?"on":""}" data-lang="ar">العربية</button></div></div>`;
  el.querySelectorAll("[data-hub]").forEach(b=>b.onclick=()=>{if(b.dataset.hub==="backup")return doBackup(el.querySelector("#bkSetMsg"));go({name:b.dataset.hub,cls:getListCls(),...(b.dataset.sec?{sec:b.dataset.sec}:{})})});
  el.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
  const gi=el.querySelector("#graceIn");if(gi){gi.addEventListener("focus",()=>busy=true);gi.onchange=async()=>{const v=Math.max(0,Math.min(60,Number(gi.value)||0));try{await db.doc("settings/main").set({...(settings.main||{}),grace:v});el.querySelector("#graceMsg").textContent="Saved."}catch(_){el.querySelector("#graceMsg").textContent="Not saved."}busy=false}}}

// ---------- 9. voice notes ----------
function micBtn(target){return `<button type="button" class="sm mic" data-mic="${target}" aria-label="Speak the note">🎤 Speak</button>`}
function wireMic(el){el.querySelectorAll("[data-mic]").forEach(b=>{const t=el.querySelector("#"+b.dataset.mic);const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  b.onclick=()=>{const tip=()=>{let m=b.nextElementSibling;if(!m||!m.classList.contains("mictip")){m=document.createElement("span");m.className="small muted mictip";b.after(m)}m.textContent="Tap the note box, then the 🎤 on your phone's keyboard and speak. It writes in Arabic if your keyboard is Arabic.";t.focus()};
    if(!SR){tip();return}
    try{const r=new SR();r.lang=AR?"ar-EG":"ar-EG";r.interimResults=false;r.onresult=e=>{const x=[...e.results].map(r=>r[0].transcript).join(" ");t.value=(t.value?t.value+" ":"")+x;t.dispatchEvent(new Event("input",{bubbles:true}))};r.onerror=()=>tip();r.onend=()=>{b.classList.remove("on");b.textContent="🎤 Speak"};b.classList.add("on");b.textContent="● Listening…";r.start()}catch(_){tip()}}})}

// ---------- 10. Arabic interface ----------
let AR=false;try{AR=localStorage.getItem("hifz.lang")==="ar"}catch(_){}
function setLang(l){AR=l==="ar";try{localStorage.setItem("hifz.lang",l)}catch(_){}location.reload()}
const SURAH_AR=["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
const AR_DICT={"✎ Write what he recited":"✎ اكتب ما سمّعه","Change \"To ayah\" to where the student stopped, or remove a surah they did not recite.":"اكتب السورة ومن أي آية إلى أي آية سمّع، ويمكنك إضافة سورة أو حذفها.","Surah":"السورة","From ayah":"من آية","To ayah":"إلى آية","+ Add surah":"+ أضف سورة","No surahs added.":"لم تُضف سور.","Repeat next class":"إعادة في الحصة القادمة","Repeat next class ✓":"إعادة في الحصة القادمة ✓","Saves his mistakes, keeps the same portion for next class":"تُحفظ أخطاؤه، ويبقى المقطع نفسه للحصة القادمة","↻ Repeat next class":"↻ إعادة في الحصة القادمة","Grade: Repeat · same portion next class":"التقدير: إعادة · المقطع نفسه في الحصة القادمة","✓ Arrived":"✓ حضر","Attendance":"الحضور","On time":"في الموعد","Late after":"يُحتسب متأخرًا بعد","minutes from the class start":"دقائق من بداية الحصة","Undo":"تراجع","＋ Another surah":"＋ سورة أخرى","Add":"أضف","Cancel":"إلغاء","📖 Open in mushaf":"📖 افتح في المصحف","Mistakes notebook":"دفتر الأخطاء","Mark fixed":"تم الإتقان","Needs a rule":"يحتاج ضابطًا","Fixed":"أُتقن","＋ Show the page before":"＋ اعرض الصفحة السابقة","＋ Show the page after":"＋ اعرض الصفحة التالية","cancel":"إلغاء","📖 Open review in mushaf, tap the mistakes":"📖 افتح المراجعة في المصحف وحدد الأخطاء","📖 Recite all in order in the mushaf":"📖 سمِّع الكل بالترتيب في المصحف","📖 Open in mushaf, tap the mistakes":"📖 افتح في المصحف وحدد الأخطاء","✕ Done":"✕ تم","Hide text":"أخفِ النص","‹ Previous":"‹ السابقة","Next surah ›":"السورة التالية ›","Finish ✓":"انتهيت ✓","Mistakes here:":"الأخطاء هنا:","Recites":"القارئ","To (listens)":"المستمع","Choose student":"اختر الطالب","Other surah…":"سورة أخرى…","Any surah":"أي سورة","From ayah":"من آية","To ayah":"إلى آية","Choose who recites first":"اختر القارئ أولًا","Nothing recorded yet.":"لم يُسجَّل شيء بعد.","Forgot":"نسي","Mixed up":"خلط","Tajweed":"تجويد","Self-corrected":"صحّح نفسه","not counted":"لا تُحتسب","Test mode":"وضع الاختبار","Next word":"الكلمة التالية","Next ayah":"الآية التالية","Show all":"أظهر الكل","New place ↻":"مكان جديد ↻","Another test":"اختبار آخر","Save result to history":"احفظ النتيجة في السجل","✓ Saved to history":"✓ حُفظ في السجل","Length":"الطول","Shown":"الظاهر","Surah strength":"قوة السور","last 60 days":"آخر ٦٠ يومًا","Add weak ones to next review":"أضف السور الضعيفة إلى المراجعة القادمة","Suggested to add today":"مقترح لإضافته اليوم","Not recorded in the app yet":"لم تُسجَّل في البرنامج بعد","Weak surahs come back sooner, strong ones wait longer.":"تعود السور الضعيفة مبكرًا، وتنتظر القوية مدة أطول.","＋ Add":"＋ أضف","Buddy recitation":"تسميع الزميل","👥 Buddy recitation":"👥 تسميع الزميل","Shuffle ↻":"بدِّل ↻","Some mistakes":"به أخطاء","Not ready":"غير جاهز","Class strength map":"خريطة قوة الفصل","Buddy review":"تسميع زميل","Random test:":"اختبار عشوائي:","Hifz Tracker":"متابعة الحفظ","Today":"اليوم","Students":"الطلاب","Reports":"التقارير","Settings":"الإعدادات","Undo":"تراجع","Undone":"أُلغي","Save":"حفظ","Save changes":"حفظ التعديلات","Delete":"حذف","Back":"رجوع","Add":"إضافة","Remove":"احذف","Open":"افتح","Edit":"تعديل","Record":"سجّل","Copy message":"انسخ الرسالة","Download PDF":"تحميل PDF",
"On time":"في الموعد","Late":"متأخر","Absent":"غائب","Excused":"بعذر","Attendance":"الحضور","New hifz":"الحفظ الجديد","Review":"المراجعة","Mistakes":"الأخطاء","Grade":"التقدير","Points":"النقاط","Note":"ملاحظة","Date":"التاريخ","Type":"النوع","Class":"الفصل","Classes":"الفصول","Student":"الطالب","Teacher":"المعلم","Surah":"السورة","Juz":"الجزء","Hifz":"الحفظ","Near":"قريبة","Far":"بعيدة","Near and far":"قريبة وبعيدة","Recited all":"قرأ الكل","Part of it":"قرأ جزءًا","More":"قرأ زيادة","Reached":"وصل إلى","＋ Add surah":"＋ أضف سورة","Did not recite":"لم يقرأ","Did not recite review at all":"لم يقرأ المراجعة إطلاقًا","No new hifz today":"لا يوجد حفظ جديد اليوم","No new hifz today ✓":"لا يوجد حفظ جديد اليوم ✓","＋ More details":"＋ تفاصيل أكثر","Stopped at":"وقف عند","ayah":"آية",
"Record session":"تسجيل حصة","Juz test":"اختبار جزء","Monthly test":"اختبار شهري","Other record":"تسجيل آخر","Mushaf":"المصحف","Student history":"سجل الطالب","Plan sheet":"جدول الخطة","Report":"تقرير","Print mistakes":"طباعة الأغلاط","Message parents":"رسالة لولي الأمر","Year report":"تقرير السنة","Edit details":"تعديل البيانات","Class report":"تقرير الفصل","Weekly summary":"الملخص الأسبوعي","Goal":"الهدف","Set a goal":"حدد هدف","Change goal":"غيِّر الهدف","Remove goal":"احذف الهدف","Save goal":"احفظ الهدف","Finish":"يُنهي","By":"قبل","Whole Quran":"القرآن كله","Progress charts":"رسوم التقدم","last 6 months":"آخر 6 أشهر","Mistakes per page":"الأخطاء في الصفحة","Pages memorized each month":"الصفحات المحفوظة كل شهر","Class challenge":"تحدّي الفصل","Who helped most":"الأكثر مساعدة","Set this month's challenge":"حدد تحدي هذا الشهر","Change":"غيِّر","Save challenge":"احفظ التحدّي","Pages for the class this month":"صفحات الفصل هذا الشهر","On track":"يسير جيدًا","✓ Reached":"✓ وصل","Star of the month":"نجم الشهر","Class screen":"شاشة الفصل","How we grade":"طريقة التقييم","Add student":"إضافة طالب","Placement test":"اختبار تحديد المستوى","Fees":"الرسوم",
"Start class":"ابدأ الحصة","End class":"أنهِ الحصة","All students":"كل الطلاب","Archived":"الأرشيف","Main list":"القائمة الرئيسية","Hifz journey map":"خريطة رحلة الحفظ","tap to open":"اضغط للفتح","memorized":"محفوظ","now":"الآن","still ahead":"لم يُنجز بعد","Now":"الآن","Ready for more?":"هل هو مستعد للزيادة؟","Make it lighter?":"هل نخففه قليلًا؟","Not now":"ليس الآن","Change the amount":"غيِّر المقدار","Needs follow-up":"يحتاج متابعة","Moved ahead most":"الأكثر تقدمًا","classes held":"حصة أُقيمت","attendance":"الحضور","pages memorized":"صفحة حُفظت","Copy as text":"انسخ كنص","Ranking":"الترتيب","Download certificate (PDF)":"تحميل الشهادة (PDF)","Language · اللغة":"اللغة · Language","Search a student by name":"ابحث عن طالب بالاسم","No student with that name.":"لا يوجد طالب بهذا الاسم.","Everyone is recorded for today.":"سُجِّل جميع الطلاب اليوم.",
"Homework and behaviour":"الواجب والسلوك","Last week's homework:":"واجب الأسبوع الماضي:","Not checked":"لم يُسمع","Done":"تم","Not done":"لم يُنجز","Mistake places (mistakes notebook)":"مواضع الأخطاء (دفتر الأخطاء)","Left early at (leave empty if stayed)":"وقت الانصراف المبكر (اتركه فارغًا إن أكمل)","Reason for leaving early":"سبب الانصراف المبكر","Arrived at":"وقت الوصول","Recorded by":"سجّله","Left early":"انصرف مبكرًا","Today:":"اليوم:","Today's hifz:":"حفظ اليوم:","Review:":"المراجعة:","1 · Attendance":"١ · الحضور","2 · New hifz":"٢ · الحفظ الجديد","3 · Review":"٣ · المراجعة","tap a surah not read":"اضغط على السورة التي لم تُقرأ","Next student":"الطالب التالي","Excellent":"ممتاز","Very good":"جيد جدًا","Good":"جيد","Pass":"مقبول","Repeat":"إعادة","Not ready":"غير جاهز","Present":"حاضر","Behaviour":"السلوك","Homework":"الواجب","Sessions":"الحصص","Tests":"الاختبارات","Certificates":"الشهادات","Repeated mistakes":"أخطاء متكررة","Today's alerts":"تنبيهات اليوم","No alerts today":"لا توجد تنبيهات اليوم","Backup":"نسخة احتياطية","Restore":"استرجاع","Speak":"تحدث","🎤 Speak":"🎤 تحدث","Advanced: choose surahs and ayahs by hand, date, recorded by, guide":"متقدم: اختيار السور والآيات يدويًا، التاريخ، من سجّل، الدليل"};
const AR_PAT=[[/^(\d+) students?$/,"$1 طالب"],[/^(\d+) of (\d+) recorded$/,"سُجِّل $1 من $2"],[/^Record next › (.+)$/,"سجّل التالي › $1"],[/^Next student › (.+)$/,"الطالب التالي › $1"],[/^(\d+) of (\d+) done$/,"أنهى $1 من $2"],[/^Back to (.+)'s page$/,"العودة إلى صفحة $1"],[/^(.+) saved$/,"تم حفظ $1"],[/^Today · (.+)$/,"اليوم · $1"],[/^Record session · (.+)$/,"تسجيل حصة · $1"],[/^Saved · (.+)$/,"تم الحفظ · $1"],[/^← (.+)$/,"→ $1"],[/^Grade: (.+) \(auto\)$/,"التقدير: $1 (تلقائي)"],[/^\((\d+)–(\d+)\)$/,"($1–$2)"],[/^Use (.+)$/,"استخدم $1"]];
const AR_MORE={"Classes today":"فصول اليوم","You can change the student's surahs here. An admin changes the other details.":"يمكنك هنا تغيير سور الطالب. أما باقي البيانات فيغيّرها مسؤول الإدارة.","Today's classes":"حلقات اليوم","← Today's classes":"→ حلقات اليوم","All recorded ✓":"سُجِّل الجميع ✓","Later today":"لاحقًا اليوم","Finished":"انتهت","Not logged yet":"لم يُسجَّل بعد","Today's class log":"سجل حصة اليوم","Tests this week":"اختبارات هذا الأسبوع","Schedule test":"حدد اختبار","Suggested":"مقترح","Schedule":"حدد","On track":"يسير جيدًا","Settings: classes, points, holidays, backup":"الإعدادات: الفصول، النقاط، الإجازات، النسخة الاحتياطية","Mark attendance here with one tap. Open a student to record the full session: hifz, review and mistakes.":"سجّل الحضور هنا بضغطة واحدة. افتح صفحة الطالب لتسجيل الحصة كاملة: الحفظ والمراجعة والأخطاء.","Record next":"سجّل التالي","No class today.":"لا توجد حصة اليوم.","Class report":"تقرير الفصل","Chart, table and diary for any dates":"رسم وجدول ومذكرات لأي فترة","Who moved ahead, who needs follow-up":"من تقدّم ومن يحتاج متابعة","Picked from points and attendance, with a certificate":"يُختار حسب النقاط والحضور، مع شهادة","Big board for the classroom":"شاشة كبيرة للفصل","Grading rules and guide":"قواعد التقييم والدليل","Student reports, year reports and parent messages are on each student's page.":"تقارير الطالب وتقرير السنة ورسائل ولي الأمر في صفحة كل طالب.","Name, class, amount, start":"الاسم، الفصل، المقدار، البداية","Classes, points, holidays, backup":"الفصول، النقاط، الإجازات، النسخة الاحتياطية","Class times, points rules, breaks, backup and restore":"مواعيد الفصول، قواعد النقط، الإجازات، النسخ والاسترجاع","For a new student":"لطالب جديد","Monthly fees in AUD":"الرسوم الشهرية بالدولار الأسترالي","Today's tasks":"مهام اليوم","Yesterday's portion, by heart":"حفظ الأمس، غيبًا","Near review":"المراجعة القريبة","Far review":"المراجعة البعيدة","Listen":"استمع","▶ Listen":"▶ استمع","Weekly progress":"التقدم الأسبوعي","Recent sessions":"آخر الحصص","Full history":"السجل كله","Mistakes notebook":"دفتر الأخطاء","Reading from the mushaf":"القراءة من المصحف","Daily reading":"القراءة اليومية","Week before":"الأسبوع السابق","Not recorded at all this week":"لم يُسجَّل إطلاقًا هذا الأسبوع","Daily amount suggestions":"اقتراحات المقدار اليومي","Nobody this week. Well done.":"لا أحد هذا الأسبوع. ما شاء الله.","No new hifz this week.":"لا يوجد حفظ جديد هذا الأسبوع.","Everyone in the class is recorded for today.":"سُجِّل الفصل كله اليوم.","Check before saving:":"راجع قبل الحفظ:","Save anyway":"احفظ على أي حال","Saved":"تم الحفظ","Record updated":"عُدِّل التسجيل","Record deleted":"حُذف التسجيل","Could not undo. Check your connection.":"تعذّر التراجع. تحقق من الاتصال.","Already recorded today":"مُسجَّل اليوم","Add a second record instead":"أضف تسجيلًا آخر بدلًا من ذلك","No review planned for this type.":"لا توجد مراجعة مقررة لهذا النوع.","homework · behaviour · left early · mistake places · note · date":"الواجب · السلوك · الانصراف المبكر · مواضع الأخطاء · ملاحظة · التاريخ","Absent 2 classes in a row":"غاب حصتين متتاليتين","Download progress card (PDF)":"تحميل بطاقة التقدم (PDF)","Delete student":"حذف الطالب","Archive":"أرشفة","Points board":"لوحة النقاط","Levels":"المستويات","Badges":"الأوسمة","Tap the note box, then the 🎤 on your phone's keyboard and speak. It writes in Arabic if your keyboard is Arabic.":"اضغط على خانة الملاحظة، ثم على 🎤 في لوحة مفاتيح الهاتف وتحدث. ستُكتب بالعربية إذا كانت لوحة المفاتيح عربية.","● Listening…":"● أستمع…"};
Object.assign(AR_DICT,AR_MORE);
// Edit details (teachers now open it to change a student's surahs)
Object.assign(AR_DICT,{"Student name":"اسم الطالب","First surah of new hifz":"أول سورة في الحفظ الجديد","Then goes":"ثم يتجه","Toward Al-Fatihah (An-Nas, Al-Falaq …)":"نحو الفاتحة (الناس، الفلق …)","Toward An-Nas (mushaf order)":"نحو الناس (ترتيب المصحف)","Surahs memorized before":"سور محفوظة من قبل","none":"لا شيء","· none":"· لا شيء","Last memorized in new hifz":"آخر ما حُفظ في الحفظ الجديد","Up to ayah":"حتى الآية","New hifz not started":"لم يبدأ الحفظ الجديد","← Back":"→ رجوع","They go straight into the far review and are skipped in new hifz. Tick a juz to tick all the surahs that start in it.":"تدخل مباشرة في المراجعة البعيدة وتُتخطّى في الحفظ الجديد. اختر الجزء لتحديد كل السور التي تبدأ فيه."});
AR_PAT.unshift([/^(.+) \((\d+) ayahs\)$/,"$1 ($2 آية)"],[/^Edit (.+)$/,"تعديل $1"],[/^· (\d+) surahs?$/,"· $1 سورة"],[/^Order: (.+) … each surah memorized from its start, then the rest of the Quran\..*$/,"الترتيب: $1 … تُحفظ كل سورة من أولها، ثم باقي القرآن. لا يُحسب محفوظًا إلا ما قبل آخر آية محفوظة في هذا الترتيب، فتشمل المراجعة البعيدة ذلك والسور المحددة أدناه. يبدأ كل مقدار يومي وينتهي بآية كاملة."]);
Object.assign(AR_DICT,{"Prompted":"لقّنه المعلّم","Interrupted the class":"قاطع الحصة","Sleepy":"ناعس","Focused":"منتبه","Mixed up":"خلط","New hifz: Excellent":"الحفظ الجديد: ممتاز","New hifz: Very good or Good":"الحفظ الجديد: جيد جدًا أو جيد","New hifz: Pass or Repeat":"الحفظ الجديد: مقبول أو إعادة","Review: Excellent":"المراجعة: ممتاز","Review: Very good or Good":"المراجعة: جيد جدًا أو جيد","Review: Pass or Repeat":"المراجعة: مقبول أو إعادة","No minus points in this class (absence, behaviour and the rest give 0 instead)":"لا نقاط سالبة في هذه الحلقة (الغياب والسلوك وغيرهما تُحسب صفرًا)","Daily reading for new students":"ورد القراءة اليومي للطلاب الجدد"});
const AR_SUB=[["not recited","لم يُقرأ"],["not ready","غير جاهز"],["Hifz","الحفظ"],["hifz","حفظ"],["Review","المراجعة"],["review","مراجعة"],["mistakes","أخطاء"],["mistake","خطأ"],["pages memorized","صفحة محفوظة"],["pages","صفحات"],["points","نقاط"],["pts","نقطة"],["Excellent","ممتاز"],["Very good","جيد جدًا"],["Good","جيد"],["Repeat","إعادة"],["On time","في الموعد"],["Late","متأخر"],["Absent","غائب"],["Excused","بعذر"],["full","كامل"],["chosen by hand","مختار يدويًا"],["to","إلى"],["of","من"],["surahs","سور"],["surah","سورة"],["students","طالب"],["student","طالب"],["recorded","سُجِّل"],["days","أيام"],["day","يوم"],["juz","جزء"],["Juz","جزء"],["test due","عليه اختبار"],["Today","اليوم"],["Monday","الاثنين"],["Tuesday","الثلاثاء"],["Wednesday","الأربعاء"],["Thursday","الخميس"],["Friday","الجمعة"],["Saturday","السبت"],["Sunday","الأحد"],["January","يناير"],["February","فبراير"],["March","مارس"],["April","أبريل"],["May","مايو"],["June","يونيو"],["July","يوليو"],["August","أغسطس"],["September","سبتمبر"],["October","أكتوبر"],["November","نوفمبر"],["December","ديسمبر"],["Kids class","فصل الأطفال"],["Adults class","فصل الكبار"],["came","حضر"],["Most points this week","الأكثر نقاطًا هذا الأسبوع"],["absent","غاب"],["times","مرات"],["classes held","حصة أُقيمت"],["surahs memorized","سورة محفوظة"],["Now","الآن"],["Path complete!","اكتمل الطريق!"],["today","اليوم"],["done","اكتمل"],["next","التالي"],["in","في"]].sort((a,b)=>b[0].length-a[0].length);
const AR_SUB_RE=new RegExp("(?<![\\w'’-])("+AR_SUB.map(x=>x[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![\\w'’-])","g");const AR_SUB_M=new Map(AR_SUB);
// Arabic: a whole text is translated from the dictionary, a pattern, or part by part (split at " · " and ", ").
// If any part has no translation, the text stays in English: never half English, half Arabic.
let SURAH_RE=null,SURAH_BY=null,AR_MEMO=new Map(),AR_NK="",AR_NS=new Set(),AR_NA=[];const AR_PAT2=[];
const arLatin=s=>/[A-Za-z]{2,}/.test(s);
function arSurah(r){if(!SURAH_RE){const ns=SURAH_NAMES.map((n,i)=>[n,i]).sort((a,b)=>b[0].length-a[0].length);SURAH_RE=new RegExp("(?<![\\w'])("+ns.map(x=>x[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![\\w'])","g");SURAH_BY=new Map(SURAH_NAMES.map((n,i)=>[n,SURAH_AR[i]]))}
  return r.replace(SURAH_RE,m=>SURAH_BY.get(m)||m)}
// names typed by the school (students, teachers, groups, schools) may stay in Latin letters inside an Arabic text
function arNames(){const S=typeof allStudents!=="undefined"?allStudents:[],T=typeof TEACHERS!=="undefined"?TEACHERS:[],C=typeof classes!=="undefined"?classes:[],K=typeof SCHOOLS!=="undefined"?SCHOOLS:[];
  const k=S.length+"|"+T.length+"|"+C.length+"|"+K.length;if(k!==AR_NK){AR_NK=k;AR_NS=new Set([...S,...T,...C,...K].map(x=>String(x&&x.name||"").trim()).filter(Boolean));AR_NA=[...AR_NS].sort((a,b)=>b.length-a.length);AR_MEMO.clear()}return AR_NS}
function arClean(r){let x=arRange(r);for(const n of arNames())x=x.split(n).join("");return !arLatin(x.replace(/https?:\S+|\S+@\S+/g,""))}
// surah names become Arabic, except inside a name the school typed (a student called Yusuf keeps his name)
const arRange=p=>{let x=String(p);const keep=[];for(const n of AR_NA)if(x.includes(n)){x=x.split(n).join("\u0001"+keep.length+"\u0002");keep.push(n)}
  x=arSurah(x).replace(/ to /g," إلى ").replace(/\((\d+(?:\.\d+)?) p\)/g,"($1 ص)").replace(/(\d) p\b/g,"$1 ص");return keep.length?x.replace(/\u0001(\d+)\u0002/g,(_,j)=>keep[+j]):x};
function arSeg(p){const t=String(p).trim();if(!t||!/[A-Za-z]/.test(t))return p;const r=arCore(t);if(r!=null)return r;const g=arRange(t);if(!arLatin(g))return g;
  if(arNames().has(t)||/^\S+@\S+$|^https?:/.test(t))return t;return null}
function arCore(t){if(AR_DICT[t]!=null)return AR_DICT[t];
  if(t.startsWith("· ")){const r=arSeg(t.slice(2));return r==null?null:"· "+r}
  if(t.endsWith(" ·")){const r=arSeg(t.slice(0,-2));return r==null?null:r+" ·"}
  for(const [re,fn] of AR_PAT2){const m=t.match(re);if(m){const r=fn(m);if(r!=null)return r}}
  for(const [re,to] of AR_PAT)if(re.test(t)){const r=t.replace(re,to);if(arClean(r))return r;break} // older rules: only when they give clean Arabic
  for(const sep of [" · ",", "])if(t.includes(sep)){const ps=t.split(sep).map(arSeg);if(ps.every(x=>x!=null))return ps.join(sep===", "?"، ":sep)}
  return null}
function arText(s){const t=s.trim().replace(/\s+/g," ");if(!t||!/[A-Za-z]/.test(t))return s;arNames();let r=AR_MEMO.get(t);
  if(r===undefined){r=arCore(t);
    if(r==null){const g=arRange(t);if(!arLatin(g))r=g;else{const w=g.replace(AR_SUB_RE,m=>AR_SUB_M.get(m)||m);let left=w;for(const n of AR_NS)left=left.split(n).join("");if(!arLatin(left))r=w}}
    else r=arRange(r);
    if(AR_MEMO.size>8000)AR_MEMO.clear();AR_MEMO.set(t,r)}
  if(r==null||r===t)return s;return s.match(/^\s*/)[0]+r+s.match(/\s*$/)[0]}
let arBusy=false;
function arWalk(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest("script,style,textarea,.mpage,[data-noar],option:not([value]),datalist"))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT}});
  const list=[];while(w.nextNode())list.push(w.currentNode);for(const n of list){const v=arText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}
  root.querySelectorAll&&root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(e=>{["placeholder","aria-label","title"].forEach(a=>{const v=e.getAttribute(a);if(v){const t=arText(v);if(t!==v)e.setAttribute(a,t)}})});
  root.querySelectorAll&&root.querySelectorAll("option[value]").forEach(o=>{const t=arText(o.textContent);if(t!==o.textContent)o.textContent=t})}
let arObs=null;
function arApply(){if(!AR)return;try{document.documentElement.setAttribute("lang","ar");document.documentElement.setAttribute("dir","rtl")}catch(_){}const app=document.getElementById("app");app.setAttribute("dir","rtl");app.setAttribute("lang","ar");document.body.classList.add("ar");
  const nav=document.getElementById("nav");if(nav)nav.setAttribute("dir","rtl");
  arBusy=true;try{arWalk(document.body)}finally{arBusy=false}
  if(!arObs){arObs=new MutationObserver(ms=>{if(arBusy)return;arBusy=true;try{for(const m of ms){if(m.type==="characterData"){const n=m.target;if(n.parentElement&&!n.parentElement.closest("script,style,textarea,.mpage,[data-noar],option:not([value]),datalist")){const v=arText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}else m.addedNodes.forEach(n=>{if(n.nodeType===3){const p=n.parentElement;if(p&&!p.closest("script,style,textarea,.mpage,[data-noar],option:not([value]),datalist")){const v=arText(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}else if(n.nodeType===1&&!n.closest(".pdfroot,[aria-hidden=true]"))arWalk(n)})}}finally{arBusy=false}});
    arObs.observe(document.body,{subtree:true,childList:true,characterData:true})}}

// Backup of all records (Settings → Backup)
async function doBackup(m){if(typeof downloads==="undefined"||!downloads){m.textContent="Downloads are not available here.";return}if(!allReady()){m.textContent="Still loading all records. Wait a few seconds and try again.";return}
    try{await downloads.save({filename:`hifz-full-backup-${iso(today())}.json`,data:new Blob([backupJson()],{type:"application/json"})});m.textContent="Saved. Keep the file somewhere safe.";try{await db.doc("settings/main").update({lastBackup:iso(today())})}catch(_){}}catch(e){m.textContent="The backup was not saved. Try again."}}
