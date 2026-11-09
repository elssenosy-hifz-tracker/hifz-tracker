// ---------- v41: school mode — teachers, groups, substitute access, supervisor, absences, requests, waiting list ----------
// Collections: teachers {name,phone,email,role admin|teacher|supervisor,active,n}; links/<uid> {tid} (who a viewer is);
// access {cid,tid,kind day|until|always,from,until,by,at}; absences {cid,tid,date,note,sub,at}; groupnotes/<cid> {text,by,at};
// requests {sid,from,to,reason,by,status open|done|declined,at}; waiting {name,phone,age,prev,note,date}. School name: settings/main.school.
let TEACHERS=[],ACCESS=[],ABSENCES=[],REQS=[],LINKS={},WAITING=[],GNOTES={};
let TCH_LOADED=false,scFlash="",ME_UID=null,ME_EMAIL=null,ME_OWNER=false,scUser=null;
const SC_ROLES={admin:"Admin",teacher:"Teacher",supervisor:"Supervisor (view only)"};
const schoolOn=()=>TEACHERS.some(t=>t.active!==false);
const schoolName=cid=>{try{if(!cid){const st=allStudents.find(s=>s.id===view.id);cid=st&&st.cls}return schoolNameFor(cid)}catch(_){return ((settings.main||{}).school||{}).name||""}};
function meTeacher(){if(!ME_UID&&!ME_EMAIL)return null;const l=ME_UID&&LINKS[ME_UID];let t=l&&TEACHERS.find(x=>x.id===l.tid);
  if(!t&&ME_EMAIL)t=TEACHERS.find(x=>x.email&&x.email.trim().toLowerCase()===ME_EMAIL.toLowerCase());return t&&t.active!==false?t:null}
const isAdminV=()=>!SUB;                                        // Editors and the owner
const isSupervisor=()=>{const t=meTeacher();return !!(t&&t.role==="supervisor")};
const tName=id=>{const t=TEACHERS.find(x=>x.id===id);return t?t.name:""};
const mainTeacher=cid=>{const c=classes.find(x=>x.id===cid);return c&&c.teacher?TEACHERS.find(t=>t.id===c.teacher&&t.active!==false)||null:null};
function accessActive(a,d){d=d||iso(today());if(a.kind==="always")return true;if(a.kind==="day")return a.from===d;return a.from<=d&&d<=(a.until||a.from)}
// One access record per group and teacher (access/<cid>_<tid>, which the security rules read): a new grant extends a
// current or future one (dates become one span; "always" wins) instead of replacing it.
function accMerge(o,d){if(!o||(o.kind!=="always"&&(o.until||o.from)<iso(today())))return d;if(o.kind==="always"||d.kind==="always")return {...d,kind:"always"};
  const from=o.from<d.from?o.from:d.from,until=[o.until||o.from,d.until||d.from].sort().pop();return {...d,from,until,kind:from===until?"day":"until"}}
const grantAccess=d=>db.doc("access/"+d.cid+"_"+d.tid).set(accMerge(ACCESS.find(a=>a.id===d.cid+"_"+d.tid),d));
function subsFor(cid,d){return ACCESS.filter(a=>a.cid===cid&&accessActive(a,d))}
function canEditCls(cid){if(!schoolOn())return true;if(isSupervisor())return false;if(isAdminV())return true;const t=meTeacher();if(!t)return false;
  const c=classes.find(x=>x.id===cid);if(c&&c.teacher===t.id)return true;return subsFor(cid).some(a=>a.tid===t.id)}
function canEditSid(sid){const st=allStudents.find(s=>s.id===sid);return st?canEditCls(st.cls):true}
const myMainCls=()=>{const t=meTeacher();return t?classes.filter(c=>c.teacher===t.id):[]};
// A teacher may add students to the groups they teach and start a new group of their own (rules: students and classes create).
function tchCanAdd(){return SUB&&schoolOn()&&!isSupervisor()&&!!meTeacher()}
function myAddCls(){return tchCanAdd()?myMainCls():[]}
const tchNewSchool=()=>{const c=myMainCls().find(x=>schOfCls(x.id));if(c)return schOfCls(c.id);if(CUR_SCH!=="all"&&schById(CUR_SCH))return CUR_SCH;return (SCHOOLS[0]||{}).id||""};
function myPick(td){if(!schoolOn()||isAdminV())return null;const t=meTeacher();if(!t)return null;return td.find(c=>c.teacher===t.id)||td.find(c=>subsFor(c.id).some(a=>a.tid===t.id))||null}
function schoolBanner(){if(!schoolOn())return null;const t=meTeacher();
  if(isSupervisor())return `<div class="banner info">Supervisor view: you can see every group and report. Nothing can be changed from this account.</div>`;
  if(t)return `<div class="banner info">Signed in as <b>${esc(t.name)}</b>. You record and edit in your own groups; other groups are view only 🔒 unless you are given substitute access.</div>`;
  return null}
const lastByTeacher=()=>{const t=meTeacher();return t?t.name:null};

function schoolInit(){
  const sub=(c,f,k=0)=>{try{db.collection(c).onSnapshot(s=>{f(s.docs.map(d=>({...d.data(),id:d.id})));render()},()=>{if(k<5)setTimeout(()=>sub(c,f,k+1),3000)})}catch(_){}};
  sub("teachers",a=>{TCH_LOADED=true;TEACHERS=a.sort((x,y)=>(x.n||0)-(y.n||0)||String(x.name).localeCompare(String(y.name)))});
  sub("access",a=>ACCESS=a);sub("absences",a=>ABSENCES=a);sub("requests",a=>REQS=a);sub("waiting",a=>WAITING=a);
  sub("links",a=>{LINKS={};a.forEach(x=>LINKS[x.id]=x)});sub("groupnotes",a=>{GNOTES={};a.forEach(x=>GNOTES[x.id]=x)});
  (async()=>{try{scUser=await claude.use("user");if(!scUser)return;const me=await scUser.me();ME_UID=me.id;ME_EMAIL=me.email;ME_OWNER=!!me.isOwner;render()}catch(_){}})();
  try{schoolsInit()}catch(e){console.error(e)}
}

// ----- route guard: no recording where the viewer has no edit right -----
function schoolGuard(){if(!schoolOn())return;
  if(isSupervisor()&&["session","test","buddy","edit","add","classes","fees","place","settings","school","waitlist","saved"].includes(view.name)){view=view.id?{name:"student",id:view.id}:{name:"today"};return}
  if(["session","test","saved"].includes(view.name)&&view.id&&!canEditSid(view.id))view={name:"student",id:view.id,locked:1};
  if(["school","waitlist"].includes(view.name)&&!isAdminV())view={name:"today"}}

// ----- after every render: locks, group panel on Today, student panel, examiner -----
function schoolAfter(){const v=document.getElementById("view");if(!v)return;
  try{schMigrate()}catch(_){}
  if((view.name==="today"||view.name==="list")&&SCHOOLS.length>1&&!v.querySelector("#schSw")){v.insertAdjacentHTML("afterbegin",schSwitch());wireSchSwitch(v)}
  document.body.classList.toggle("roall",schoolOn()&&isSupervisor());
  if(!schoolOn()&&view.name!=="school")return;
  if(view.name==="today"){const p=v.querySelector(".tnow");if(!p)return;const cid=p.dataset.cid;
    p.classList.toggle("ro",!canEditCls(cid));
    v.querySelectorAll("[data-tcls]").forEach(b=>{if(!canEditCls(b.dataset.tcls)&&!b.dataset.lk){b.dataset.lk=1;b.append(" 🔒")}});
    if(!canEditCls(cid))p.insertAdjacentHTML("afterbegin",`<div class="banner info">🔒 View only. ${mainTeacher(cid)?esc(mainTeacher(cid).name)+" is the teacher of this group.":""}</div>`);
    const t=meTeacher(),subNow=t&&subsFor(cid).some(a=>a.tid===t.id)&&!classes.some(c=>c.id===cid&&c.teacher===t.id);
    if(subNow){p.insertAdjacentHTML("afterbegin",`<div class="banner ok">You are the substitute for <b>${esc(clsName(cid))}</b> today. You can record and edit here.</div>${GNOTES[cid]&&GNOTES[cid].text?`<div class="banner warn"><b>Notes for the substitute:</b> ${esc(GNOTES[cid].text)}</div>`:""}`)}
    p.insertAdjacentHTML("afterend",groupPanel(cid));wireGroupPanel(v,cid);
    {const hp=hoursPanel();if(hp){p.insertAdjacentHTML("afterend",hp);wireHours(v)}}
    if(isAdminV())v.insertAdjacentHTML("afterbegin",adminAlerts());wireAdminAlerts(v);
    if(!isAdminV()&&!meTeacher()&&ME_UID)v.insertAdjacentHTML("afterbegin",claimBox());wireClaim(v)}
  if(view.name==="list")v.querySelectorAll(".row[data-id]").forEach(r=>r.classList.toggle("ro",!canEditSid(r.dataset.id)));
  if(view.name==="student"){const st=allStudents.find(s=>s.id===view.id);if(!st)return;const lk=!canEditSid(st.id);v.classList.toggle("ro",lk);
    if(lk)v.insertAdjacentHTML("afterbegin",`<div class="banner info">🔒 ${esc(st.name)} is in ${esc(clsName(st.cls)||"another group")}${mainTeacher(st.cls)?" ("+esc(mainTeacher(st.cls).name)+")":""}. View only.</div>`);
    v.insertAdjacentHTML("beforeend",studentGroupPanel(st));wireStudentGroup(v,st)}
  else v.classList.remove("ro");
  if(view.name==="class"&&view.id)v.classList.toggle("ro",!canEditCls(view.id));
  if(view.name==="add"&&view.wname){const n=v.querySelector("#f_name");if(n&&!n.value)n.value=view.wname;const ph=v.querySelector("#f_phone");if(ph&&view.wphone&&!ph.value)ph.value=view.wphone}
}

// ----- the group panel on Today: teacher, notes for the substitute, substitute access, "I'll be absent" -----
function groupPanel(cid){const c=classes.find(x=>x.id===cid);if(!c)return "";const mt=mainTeacher(cid),t=meTeacher(),isMain=t&&mt&&t.id===mt.id,mgr=isAdminV()||isMain;
  const subs=ACCESS.filter(a=>a.cid===cid&&(a.kind==="always"||(a.until||a.from)>=iso(today())));
  const abs=ABSENCES.filter(a=>a.cid===cid&&a.date>=iso(today())).sort((a,b)=>a.date.localeCompare(b.date));
  const others=TEACHERS.filter(x=>x.active!==false&&x.role!=="supervisor"&&(!mt||x.id!==mt.id));
  const kindTxt=a=>a.kind==="always"?"always":a.kind==="day"?(a.from===iso(today())?"today":fmtShort(a.from)):"until "+fmtShort(a.until);
  const note=GNOTES[cid]&&GNOTES[cid].text||"";
  return `<details class="panel gpanel" ${mgr&&(abs.length||subs.length)?"open":""}><summary><h3>Group · ${esc(c.name)}</h3><span class="small muted">${mt?"Teacher: "+esc(mt.name):"No main teacher set"}</span></summary>
    <div class="gsec"><b class="small">Notes for the substitute</b>${mgr?`<textarea id="gNote" rows="2" placeholder="e.g. Yusuf mixes up similar verses. Do not raise Omar's amount.">${esc(note)}</textarea><div class="actions"><button class="sm" id="gNoteSave">Save notes</button><span class="small muted" id="gNoteMsg"></span></div>`:`<p class="small">${note?esc(note):'<span class="muted">No notes.</span>'}</p>`}</div>
    <div class="gsec"><b class="small">Who can edit this group</b>
      ${mt?`<div class="kv"><span>${esc(mt.name)}</span><span class="chip plain">Main teacher</span></div>`:""}
      ${subs.map(a=>`<div class="kv"><span>${esc(tName(a.tid)||"?")}</span><span><span class="chip info">Substitute · ${kindTxt(a)}</span>${mgr?` <button class="sm" data-unsub="${a.id}">Remove</button>`:""}</span></div>`).join("")}
      ${mgr&&others.length?`<div class="gform"><label>Give substitute access to<select id="gSubT">${others.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></label>
        <div class="seg" id="gKind"><button type="button" class="fbtn on" data-k="day">Today</button><button type="button" class="fbtn" data-k="until">Until a date</button><button type="button" class="fbtn" data-k="always">Always</button></div>
        <input type="date" id="gUntil" value="${iso(addDays(today(),7))}" hidden><div class="actions"><button class="primary sm" id="gSubGo">Give access</button><span class="small muted" id="gSubMsg"></span></div></div>`:""}</div>
    <div class="gsec"><b class="small">Teacher absences</b>
      ${abs.length?abs.map(a=>`<div class="kv"><span>${esc(tName(a.tid))} · ${fmtShort(a.date)}${a.note?` · <span class="muted">${esc(a.note)}</span>`:""}</span><span>${a.sub?`<span class="chip ok">Substitute: ${esc(tName(a.sub))}</span>`:'<span class="chip warn">No substitute yet</span>'}${(mgr||a.tid===(t&&t.id))?` <button class="sm" data-unabs="${a.id}">Cancel</button>`:""}</span></div>`).join(""):'<p class="small muted">None coming up.</p>'}
      ${isMain||(isAdminV()&&mt)?`<div class="gform"><label>${isMain?"I will be absent on":"Teacher absent on"}<input type="date" id="gAbsD" value="${iso(nextClassDate(c))}"></label><input id="gAbsN" placeholder="Reason (optional)"><div class="actions"><button class="sm" id="gAbsGo">${isMain?"I'll be absent":"Mark absent"}</button><span class="small muted" id="gAbsMsg"></span></div></div>`:""}</div>
  </details>`}
function nextClassDate(c){for(let k=0;k<=7;k++){const d=addDays(today(),k);if((c.days||[]).includes(d.getDay())&&(k>0||nowMins()<(minsOf(c.time)||0)))return d}return addDays(today(),1)}
function wireGroupPanel(el,cid){const q=s=>el.querySelector(s);const t=meTeacher(),by=t?t.id:"admin";
  const n=q("#gNote");if(n){n.addEventListener("focus",()=>busy=true);q("#gNoteSave").onclick=async()=>{try{await db.doc("groupnotes/"+cid).set({text:n.value.trim(),by,at:Date.now()});q("#gNoteMsg").textContent="Saved.";busy=false}catch(_){q("#gNoteMsg").textContent="Not saved."}}}
  let kind="day";el.querySelectorAll("#gKind [data-k]").forEach(b=>b.onclick=()=>{kind=b.dataset.k;el.querySelectorAll("#gKind [data-k]").forEach(x=>x.classList.toggle("on",x===b));q("#gUntil").hidden=kind!=="until";busy=true});
  const g=q("#gSubGo");if(g)g.onclick=async()=>{const tid=q("#gSubT").value,d=iso(today());try{await grantAccess({cid,tid,kind,from:d,until:kind==="until"?q("#gUntil").value:d,by,at:Date.now()});busy=false;render(true)}catch(_){q("#gSubMsg").textContent="Not saved."}};
  el.querySelectorAll("[data-unsub]").forEach(b=>b.onclick=async()=>{try{await db.doc("access/"+b.dataset.unsub).delete()}catch(_){}});
  el.querySelectorAll("[data-unabs]").forEach(b=>b.onclick=async()=>{try{await db.doc("absences/"+b.dataset.unabs).delete()}catch(_){}});
  const ab=q("#gAbsGo");if(ab){[q("#gAbsD"),q("#gAbsN")].forEach(i=>i.addEventListener("focus",()=>busy=true));ab.onclick=async()=>{const mt=mainTeacher(cid);const tid=t&&classes.some(c=>c.id===cid&&c.teacher===t.id)?t.id:mt&&mt.id;if(!tid)return;
    try{await db.collection("absences").add({cid,tid,date:q("#gAbsD").value,note:q("#gAbsN").value.trim(),sub:"",at:Date.now()});busy=false;render(true)}catch(_){q("#gAbsMsg").textContent="Not saved."}}}}

// ----- admin alerts on Today: absences without a substitute, transfer requests -----
function adminAlerts(){const abs=ABSENCES.filter(a=>!a.sub&&a.date>=iso(today())).sort((a,b)=>a.date.localeCompare(b.date)),rq=REQS.filter(r=>r.status==="open");
  if(!abs.length&&!rq.length)return "";
  return `<div class="panel scal"><h3>Needs your decision</h3>
   ${abs.map(a=>{const ot=TEACHERS.filter(x=>x.active!==false&&x.role!=="supervisor"&&x.id!==a.tid);return `<div class="scrow"><span><b>${esc(tName(a.tid))}</b> is absent ${fmtShort(a.date)} · ${esc(clsName(a.cid))}${a.note?` · <span class="muted">${esc(a.note)}</span>`:""}</span>
     <span class="actions"><select data-absub="${a.id}">${ot.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select><button class="primary sm" data-absgo="${a.id}">Make substitute</button></span></div>`}).join("")}
   ${rq.map(r=>{const st=allStudents.find(s=>s.id===r.sid);return `<div class="scrow"><span><b>${esc(tName(r.by)||"A teacher")}</b> suggests moving <b>${esc(st?st.name:"?")}</b> from ${esc(clsName(r.from))} to ${esc(clsName(r.to))}${r.reason?`: <span class="muted">${esc(r.reason)}</span>`:""}</span>
     <span class="actions"><button class="primary sm" data-rqok="${r.id}">Move</button><button class="sm" data-rqno="${r.id}">Decline</button></span></div>`}).join("")}</div>`}
function wireAdminAlerts(el){
  el.querySelectorAll("[data-absgo]").forEach(b=>b.onclick=async()=>{const a=ABSENCES.find(x=>x.id===b.dataset.absgo);const tid=el.querySelector(`[data-absub="${a.id}"]`).value;
    try{await grantAccess({cid:a.cid,tid,kind:"day",from:a.date,until:a.date,by:"admin",at:Date.now()});await db.doc("absences/"+a.id).update({sub:tid});
      const t=TEACHERS.find(x=>x.id===tid),c=classes.find(x=>x.id===a.cid),ph=phoneDigits(t&&t.phone);
      const msg=`السلام عليكم ${t?t.name:""}،\nأرجو أن تكون بديلًا لحلقة «${c?c.name:""}» يوم ${fmtShort(a.date)}${c&&c.time?" الساعة "+c.time:""}. افتح برنامج متابعة الحفظ، وستجد الحلقة مفتوحة لك للتسجيل.${GNOTES[a.cid]&&GNOTES[a.cid].text?"\nملاحظات المعلم: "+GNOTES[a.cid].text:""}\nجزاك الله خيرًا.`;
      if(ph)window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`,"_blank")}catch(_){}});
  el.querySelectorAll("[data-absub]").forEach(s=>s.addEventListener("focus",()=>busy=true));
  el.querySelectorAll("[data-rqok]").forEach(b=>b.onclick=async()=>{const r=REQS.find(x=>x.id===b.dataset.rqok);try{await db.doc("students/"+r.sid).update({cls:r.to});await db.doc("requests/"+r.id).update({status:"done",done:iso(today())})}catch(_){}});
  el.querySelectorAll("[data-rqno]").forEach(b=>b.onclick=async()=>{try{await db.doc("requests/"+b.dataset.rqno).update({status:"declined",done:iso(today())})}catch(_){}})}

// ----- "Who are you?" for a teacher opening the link the first time -----
function claimBox(){const free=TEACHERS.filter(t=>t.active!==false&&t.role!=="admin"&&!Object.values(LINKS).some(l=>l.tid===t.id));if(!free.length)return "";
  return `<div class="panel"><h3>Who are you?</h3><p class="small muted">Pick your name once. The app then shows your groups.</p><div class="actions">${free.map(t=>`<button class="primary" data-claim="${t.id}">${esc(t.name)}</button>`).join("")}</div></div>`}
function wireClaim(el){el.querySelectorAll("[data-claim]").forEach(b=>b.onclick=async()=>{try{await db.doc("links/"+ME_UID).set({tid:b.dataset.claim,at:Date.now()})}catch(_){b.textContent="Could not save"}})}

// ----- student page: move (admin) or suggest a move (teacher) -----
function studentGroupPanel(st){if(isSupervisor())return "";const others=classes.filter(c=>c.id!==st.cls);if(!others.length)return "";
  const opts=others.map(c=>`<option value="${c.id}">${esc(c.name)}${mainTeacher(c.id)?" — "+esc(mainTeacher(c.id).name):""}${SCHOOLS.length>1&&schById(schOfCls(c.id))?" · "+esc(schById(schOfCls(c.id)).name):""}</option>`).join("");
  const open=REQS.find(r=>r.sid===st.id&&r.status==="open");
  if(isAdminV())return `<details class="panel"><summary><h3>Move to another group</h3></summary><label>New group<select id="mvTo">${opts}</select></label><p class="small muted">The whole history moves with the student. Old sessions keep "Recorded by" the teacher who recorded them.</p><div class="actions"><button class="primary" id="mvGo">Move student</button><span class="small muted" id="mvMsg"></span></div></details>`;
  if(!canEditSid(st.id))return "";
  return `<details class="panel"><summary><h3>Suggest moving to another group</h3></summary>${open?`<p class="small">Waiting for the admin: move to ${esc(clsName(open.to))}.</p>`:`<label>Group<select id="mvTo">${opts}</select></label><input id="mvWhy" placeholder="Why? e.g. ahead of the group"><div class="actions"><button class="primary" id="rqGo">Send to the admin</button><span class="small muted" id="mvMsg"></span></div>`}</details>`}
function wireStudentGroup(el,st){const q=s=>el.querySelector(s);[q("#mvTo"),q("#mvWhy")].forEach(i=>i&&i.addEventListener("focus",()=>busy=true));
  const g=q("#mvGo");if(g)g.onclick=async()=>{if(g.dataset.c!=="1"){g.dataset.c="1";g.textContent="Tap again to move";return}try{await db.doc("students/"+st.id).update({cls:q("#mvTo").value});busy=false;render(true)}catch(_){q("#mvMsg").textContent="Not moved."}};
  const r=q("#rqGo");if(r)r.onclick=async()=>{const t=meTeacher();try{await db.collection("requests").add({sid:st.id,from:st.cls,to:q("#mvTo").value,reason:q("#mvWhy").value.trim(),by:t?t.id:"",status:"open",at:Date.now(),date:iso(today())});busy=false;render(true)}catch(_){q("#mvMsg").textContent="Not sent."}}}

// ----- juz test examiner: another teacher -----
function examinerField(st){const act=TEACHERS.filter(t=>t.active!==false&&t.role!=="supervisor");if(!act.length)return "";const mt=mainTeacher(st.cls);
  const cnt=id=>events.filter(e=>e.type==="test"&&e.examiner===id).length;const others=act.filter(t=>!mt||t.id!==mt.id).sort((a,b)=>cnt(a.id)-cnt(b.id));const sug=others[0];
  return `<label>Examiner<select id="t_ex">${others.map(t=>`<option value="${t.id}" ${sug&&t.id===sug.id?"selected":""}>${esc(t.name)}${t===sug?" (suggested)":""}</option>`).join("")}${mt?`<option value="${mt.id}">${esc(mt.name)} (own teacher)</option>`:""}</select><span class="small muted">Best with a teacher other than the student's own.</span></label>`}
const examinerText=e=>e.examiner?` · examined by ${esc(tName(e.examiner)||"another teacher")}`:"";

// ----- teacher form (add / edit), reached from a school's Teachers tab or a teacher profile -----
function renderSchool(el,sub){
  if(!view.tid){go({name:"schools"});return}
  const ed=view.tid!=="new"?TEACHERS.find(t=>t.id===view.tid):null,t=ed;if(view.tid!=="new"&&!ed){go({name:"schools"});return}
  sub.textContent=t?t.name:"Add teacher";const linked=linkedT;
  const sch0=view.sch&&schById(view.sch)?view.sch:(SCHOOLS[0]||{}).id;
  const tSchools=t&&Array.isArray(t.schools)&&t.schools.length?t.schools:(sch0?[sch0]:[]);
  const back=t?backBtn(t.name,{name:"teacher",id:t.id,sch:view.sch}):view.sch&&schById(view.sch)?backBtn(schById(view.sch).name,{name:"schoolv",id:view.sch,tab:"teachers"}):backBtn("Schools",{name:"schools"});
  const cName=c=>esc(c.name)+(SCHOOLS.length>1&&schById(schOfCls(c.id))?` <span class="small muted">· ${esc(schById(schOfCls(c.id)).name)}</span>`:"");
  el.innerHTML=`${back}<form class="panel" id="tForm"><h3>${t?"Edit teacher":"Add teacher"}</h3>
    <div class="fields"><label>Name<input id="t_name" required value="${esc(t&&t.name||"")}"></label><label>Phone (WhatsApp)<input id="t_ph" type="tel" value="${esc(t&&t.phone||"")}" placeholder="+61 4xx xxx xxx"></label>
    <label>Email they sign in with (gives them access)<input id="t_em" type="email" value="${esc(t&&t.email||"")}" placeholder="name@gmail.com"></label>
    <label>Ijazah / riwayah<input id="t_ij" value="${esc(t&&t.ijazah||"")}" placeholder="e.g. Hafs ʿan ʿAsim"></label><label>Started<input id="t_st" type="date" value="${esc(t&&t.started||"")}"></label><label>Notes<input id="t_no" value="${esc(t&&t.notes||"")}"></label></div>
    <p class="small muted">Share the app link with this email: as <b>Contributor</b> for a teacher, <b>Viewer</b> for a supervisor, <b>Editor</b> for another admin. When they open it the app knows who they are, or they pick their name once.</p>
    <div><p class="small muted lbl">Role</p><div class="seg" id="t_role">${Object.entries(SC_ROLES).map(([k,v])=>`<button type="button" class="fbtn ${(t&&t.role||"teacher")===k?"on":""}" data-r="${k}">${v}</button>`).join("")}</div></div>
    ${SCHOOLS.length>1?`<div><p class="small muted lbl">Works in</p>${SCHOOLS.map(s=>`<label class="chk"><input type="checkbox" data-tsch="${s.id}" ${tSchools.includes(s.id)?"checked":""}> ${esc(s.name)}</label>`).join("")}</div>`:""}
    <div><p class="small muted lbl">Main teacher of</p>${classes.map(c=>`<label class="chk"><input type="checkbox" data-tc="${c.id}" ${t&&c.teacher===t.id?"checked":""}> ${cName(c)} ${c.teacher&&(!t||c.teacher!==t.id)&&tName(c.teacher)?`<span class="small muted">(now ${esc(tName(c.teacher))})</span>`:""}</label>`).join("")}</div>
    <p class="small muted">A teacher sees every group but records and edits only in their own groups, or where they are given substitute access.</p>
    <div class="actions"><button class="primary" type="submit">Save teacher</button><button type="button" id="t_cancel">Cancel</button>${t?`<button type="button" id="t_pause">${t.active===false?"Activate teacher":"Pause teacher (keeps their records)"}</button>${linked(t)?'<button type="button" class="link small" id="t_unlink">Unlink account</button>':""}<button type="button" class="link small neg" id="t_del">Delete teacher</button>`:""}<span class="small muted" id="t_msg"></span></div></form>`;
  wireBack(el);const q=x=>el.querySelector(x);const f=q("#tForm");
  f.querySelectorAll("input").forEach(i=>i.addEventListener("focus",()=>busy=true));let role=(ed&&ed.role)||"teacher";
  f.querySelectorAll("#t_role [data-r]").forEach(b=>b.onclick=()=>{role=b.dataset.r;f.querySelectorAll("#t_role [data-r]").forEach(x=>x.classList.toggle("on",x===b))});
  const done=id=>{busy=false;go(id?{name:"teacher",id,sch:view.sch}:view.sch?{name:"schoolv",id:view.sch,tab:"teachers"}:{name:"schools"})};
  q("#t_cancel").onclick=()=>done(ed&&ed.id);
  f.onsubmit=async e=>{e.preventDefault();const bt=f.querySelector("button[type=submit]");if(bt.disabled)return;
    const schs=SCHOOLS.length>1?[...f.querySelectorAll("[data-tsch]:checked")].map(i=>i.dataset.tsch):tSchools;
    const d={name:q("#t_name").value.trim(),phone:q("#t_ph").value.trim(),email:q("#t_em").value.trim().toLowerCase(),ijazah:q("#t_ij").value.trim(),started:q("#t_st").value,notes:q("#t_no").value.trim(),role,schools:schs};if(!d.name)return;bt.disabled=true;q("#t_msg").textContent="Saving…";
    try{let id=ed&&ed.id;if(ed){await db.doc("teachers/"+id).update(d);Object.assign(ed,d)}else{const r=await db.collection("teachers").add({...d,active:true,n:TEACHERS.length+1});id=r.id;if(!TEACHERS.some(x=>x.id===id))TEACHERS.push({id,...d,active:true})}
      for(const cb of f.querySelectorAll("[data-tc]")){const c=classes.find(x=>x.id===cb.dataset.tc);if(cb.checked&&c.teacher!==id){await db.doc("classes/"+c.id).update({teacher:id});c.teacher=id}else if(!cb.checked&&c.teacher===id){await db.doc("classes/"+c.id).update({teacher:""});c.teacher=""}}
      done(id)}catch(_){q("#t_msg").textContent="Not saved. Try again.";bt.disabled=false}};
  const p=q("#t_pause");if(p)p.onclick=async()=>{try{await db.doc("teachers/"+ed.id).update({active:ed.active===false});ed.active=ed.active===false;busy=false;render(true)}catch(_){}};
  const dl=q("#t_del");if(dl)dl.onclick=async()=>{if(dl.dataset.c!=="1"){dl.dataset.c="1";dl.textContent="Tap again to delete "+ed.name;return}
    try{for(const c of classes.filter(c=>c.teacher===ed.id)){await db.doc("classes/"+c.id).update({teacher:""});c.teacher=""}for(const [uid,l] of Object.entries(LINKS))if(l.tid===ed.id)await db.doc("links/"+uid).delete();await db.doc("teachers/"+ed.id).delete();TEACHERS=TEACHERS.filter(x=>x.id!==ed.id);done(null)}catch(_){q("#t_msg").textContent="Not deleted. Try again."}};
  const u=q("#t_unlink");if(u)u.onclick=async()=>{for(const [uid,l] of Object.entries(LINKS))if(l.tid===ed.id)try{await db.doc("links/"+uid).delete()}catch(_){}}}

// ----- Reports › School overview + weekly report per teacher -----
function renderSover(el,sub){sub.textContent=(schoolName()||"School")+" · overview";const t=today(),m0=iso(new Date(t.getFullYear(),t.getMonth(),1)),w0=iso(addDays(t,-6)),d=iso(t);
  const st=allStudents.filter(s=>!s.archived);
  const att=list=>{const s=list.filter(e=>e.type==="session");const a=s.filter(attended).length;return s.length?Math.round(a/s.length*100)+"%":"—"};
  const mev=events.filter(e=>e.date>=m0&&e.date<=d);
  const card=c=>{const ids=new Set(st.filter(s=>s.cls===c.id).map(s=>s.id)),ev=mev.filter(e=>ids.has(e.sid));const pages=Math.round(ev.reduce((x,e)=>x+(e.type==="session"?Number(e.hifzLines)||0:0),0)/LINES);
    const ms=meetings.filter(x=>x.cls===c.id&&x.started).sort((a,b)=>b.date.localeCompare(a.date))[0];const todayCls=classesToday().some(x=>x.id===c.id),mt=meetingOf(c.id,d);
    return `<div class="panel tight"><div class="head"><b>${esc(c.name)}</b><span class="small muted">${esc(tName(c.teacher)||"no teacher")}</span></div>
     <div class="stats3"><div><b>${ids.size}</b><span>students</span></div><div><b>${pages}</b><span>pages this month</span></div><div><b>${att(ev)}</b><span>attendance</span></div></div>
     <p class="small muted">${todayCls&&!(mt&&mt.started)&&nowMins()>(minsOf(c.time)||0)?`<span class="chip warn">Not started</span> today's class (${esc(c.time||"")})`:ms?`Last class ${fmtShort(ms.date)}: started ${esc(ms.started)}${ms.ended?" · ended "+esc(ms.ended):""}${ms.startBy?" · "+esc(ms.startBy):""}`:"No class signed in yet."}</p></div>`};
  const tw=TEACHERS.filter(x=>x.active!==false&&x.role!=="supervisor").map(x=>{const cls=classes.filter(c=>c.teacher===x.id),ids=new Set(st.filter(s=>cls.some(c=>c.id===s.cls)).map(s=>s.id));
    const rec=events.filter(e=>e.type==="session"&&e.date>=w0&&e.date<=d&&!e.auto&&e.by===x.name).length;
    const held=meetings.filter(m=>m.date>=w0&&m.date<=d&&m.startBy===x.name).length;
    const need=[...ids].map(id=>allStudents.find(s=>s.id===id)).filter(s=>{const se=events.filter(e=>e.sid===s.id&&e.type==="session"&&attended(e)).sort((a,b)=>b.date.localeCompare(a.date));return !se.length||daysBetween(parse(se[0].date),t)>14||gradeEn(se[0].hifzGrade)==="Repeat"});
    const abs=ABSENCES.filter(a=>a.tid===x.id&&a.date>=w0&&a.date<=d).length,hw=minsSum(hoursOf(x.id,w0,d));
    const txt=`${x.name} · week to ${fmtShort(d)}\nClasses signed in: ${held}\nSessions recorded: ${rec}\nHours: ${hTxt(hw)}\nAbsences: ${abs}\nNeed follow-up: ${need.map(s=>s.name).join(", ")||"none"}`;
    return `<div class="panel tight"><div class="head"><b>${esc(x.name)}</b><span class="small muted">${cls.map(c=>esc(c.name)).join(", ")||"no group"}</span></div>
     <div class="stats3"><div><b>${held}</b><span>classes signed in</span></div><div><b>${rec}</b><span>sessions recorded</span></div><div><b>${abs}</b><span>absences</span></div></div>
     <p class="small"><b>${hTxt(hw)}</b> <span class="muted">this week</span> · <button type="button" class="link small" data-tprof="${x.id}">Teacher profile ›</button></p>
     <p class="small">${need.length?`<b>Need follow-up:</b> ${need.map(s=>esc(s.name)).join(", ")} <span class="muted">(no session for 2 weeks, or last hifz was Repeat)</span>`:'<span class="muted">No one needs follow-up.</span>'}</p>
     <div class="actions"><a class="btn sm" target="_blank" href="https://wa.me/?text=${encodeURIComponent(txt)}">Share on WhatsApp</a></div></div>`}).join("");
  el.innerHTML=`${backBtn("Reports",{name:"reports"})}
   <div class="stats3"><div><b>${st.length}</b><span>students</span></div><div><b>${TEACHERS.filter(x=>x.active!==false&&x.role!=="supervisor").length}</b><span>teachers</span></div><div><b>${att(mev)}</b><span>attendance this month</span></div></div>
   <h3 class="wkh">Groups</h3>${classes.map(card).join("")}
   <h3 class="wkh">This week by teacher</h3>${tw||'<p class="muted">Add teachers in Schools › a school › Teachers.</p>'}`;
  wireBack(el);el.querySelectorAll("[data-tprof]").forEach(b=>b.onclick=()=>go({name:"teacher",id:b.dataset.tprof}))}

// ----- Settings › Waiting list -----
function renderWaitlist(el,sub){sub.textContent="Waiting list";const wsch=view.sch&&schById(view.sch)?view.sch:"";const L=WAITING.filter(w=>!wsch||(w.school||"")===wsch||(!w.school&&SCHOOLS.length===1)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const sug=w=>{const kid=Number(w.age)>0&&Number(w.age)<14;const cl0=wsch?schClasses(wsch):classes;const pool=cl0.filter(c=>kid?/kid|child|طفل|أطفال/i.test(c.name):!/kid|child|طفل|أطفال/i.test(c.name));const list=(pool.length?pool:cl0).slice().sort((a,b)=>allStudents.filter(s=>s.cls===a.id&&!s.archived).length-allStudents.filter(s=>s.cls===b.id&&!s.archived).length);return list[0]};
  const added=w=>allStudents.some(s=>String(s.name).trim().toLowerCase()===String(w.name).trim().toLowerCase());
  el.innerHTML=`${wsch?backBtn(schById(wsch).name,{name:"schoolv",id:wsch,tab:"students"}):backBtn("Schools",{name:"schools"})}
   <form class="panel" id="wForm"><h3>Add to the waiting list</h3><div class="fields"><label>Name<input id="w_n" required></label><label>Age<input id="w_a" type="number" min="3" max="99" inputmode="numeric"></label><label>Parent's phone<input id="w_p" type="tel"></label><label>Memorized before<input id="w_v" placeholder="e.g. Juz Amma"></label></div><input id="w_note" placeholder="Note (optional)"><div class="actions"><button class="primary" type="submit">Add</button><span class="small muted" id="w_msg"></span></div></form>
   <div class="panel"><h3>Waiting (${L.length})</h3>${L.length?L.map(w=>{const g=sug(w);return `<div class="scrow"><span><b>${esc(w.name)}</b>${w.age?` · ${esc(String(w.age))} years`:""}${w.prev?` · ${esc(w.prev)}`:""} <span class="small muted">· since ${fmtShort(w.date)}</span>${w.note?`<br><span class="small muted">${esc(w.note)}</span>`:""}${g?`<br><span class="small">Suggested group: <b>${esc(g.name)}</b>${mainTeacher(g.id)?" ("+esc(mainTeacher(g.id).name)+")":""}</span>`:""}</span>
     <span class="actions">${added(w)?'<span class="chip ok">Added ✓</span>':`<button class="sm" data-wpl="${w.id}">Placement test</button><button class="primary sm" data-wadd="${w.id}" data-wc="${g?g.id:""}">Add as student</button>`}<button class="sm" data-wdel="${w.id}">Remove</button></span></div>`}).join(""):'<p class="muted">No one is waiting.</p>'}</div>`;
  wireBack(el);const q=x=>el.querySelector(x);el.querySelectorAll("#wForm input").forEach(i=>i.addEventListener("focus",()=>busy=true));
  q("#wForm").onsubmit=async e=>{e.preventDefault();const n=q("#w_n").value.trim();if(!n)return;try{await db.collection("waiting").add({name:n,age:Number(q("#w_a").value)||"",phone:q("#w_p").value.trim(),prev:q("#w_v").value.trim(),note:q("#w_note").value.trim(),school:wsch||(SCHOOLS.length===1?SCHOOLS[0].id:""),date:iso(today())});busy=false;render(true)}catch(_){q("#w_msg").textContent="Not added."}};
  el.querySelectorAll("[data-wadd]").forEach(b=>b.onclick=()=>{const w=WAITING.find(x=>x.id===b.dataset.wadd);busy=false;go({name:"add",cls:b.dataset.wc||undefined,wname:w.name,wphone:w.phone})});
  el.querySelectorAll("[data-wpl]").forEach(b=>b.onclick=()=>{busy=false;go({name:"place"})});
  el.querySelectorAll("[data-wdel]").forEach(b=>b.onclick=async()=>{if(b.dataset.c!=="1"){b.dataset.c="1";b.textContent="Tap again";return}try{await db.doc("waiting/"+b.dataset.wdel).delete()}catch(_){}})}

const GNOTES_PACK=()=>Object.fromEntries(Object.entries(GNOTES).map(([k,{id,...d}])=>[k,d]));
const LINKS_PACK=()=>Object.fromEntries(Object.entries(LINKS).map(([k,{id,...d}])=>[k,d]));

// ----- groups (classes) under the school: add, rename, teacher, days, times -----
function groupsEditor(sid){const CL=sid?schClasses(sid):classes;const schSel=cur=>SCHOOLS.length>1?`<label>School<select data-gsch>${SCHOOLS.map(s=>`<option value="${s.id}" ${s.id===cur?"selected":""}>${esc(s.name)}</option>`).join("")}</select></label>`:"";const dayBox=(days,k)=>`<div class="days">${[6,0,1,2,3,4,5].map(d=>`<label><input type="checkbox" data-gd="${k}" value="${d}" ${(days||[]).includes(d)?"checked":""}> ${DAY_NAMES[d]}</label>`).join("")}</div>`;
  const tOpts=sel=>`<option value="">No teacher</option>`+TEACHERS.filter(t=>t.active!==false&&t.role!=="supervisor").map(t=>`<option value="${t.id}" ${t.id===sel?"selected":""}>${esc(t.name)}</option>`).join("");
  return `<div class="gedit">
   ${CL.map(c=>`<form class="clsform" data-gid="${c.id}"><div class="fields"><label>Group name<input data-gn value="${esc(c.name)}" required></label><label>Teacher<select data-gt>${tOpts(c.teacher)}</select></label><label>Starts<input type="time" data-gs value="${esc(c.time||"")}"></label><label>Ends<input type="time" data-ge value="${esc(c.end||"")}"></label>${schSel(schOfCls(c.id))}</div>
     <p class="small muted lbl">Days</p>${dayBox(c.days,c.id)}<div class="actions"><button type="submit">Save</button><span class="small muted">${allStudents.filter(s=>s.cls===c.id&&!s.archived).length} students</span><span class="small muted" data-gm></span></div></form>`).join("")}
   <form class="clsform" data-gid="new" data-gs0="${sid||""}"><h3 class="wkh">＋ Add a group</h3><div class="fields"><label>Group name<input data-gn placeholder="e.g. Girls class"></label><label>Teacher<select data-gt>${tOpts("")}</select></label><label>Starts<input type="time" data-gs></label><label>Ends<input type="time" data-ge></label>${schSel(sid)}</div>
     <p class="small muted lbl">Days</p>${dayBox([],"new")}<div class="actions"><button class="primary" type="submit">Add group</button><span class="small muted" data-gm></span></div></form>
   <p class="small muted">Daily reading and "no minus points" for each group are in Settings › Classes. Grading and points rules are the same for every school; only the admin changes them.</p></div>`}
function wireGroupsEditor(el){el.querySelectorAll("form[data-gid]").forEach(f=>{f.querySelectorAll("input,select").forEach(i=>i.addEventListener("focus",()=>busy=true));
  f.onsubmit=async e=>{e.preventDefault();const bt=f.querySelector("button[type=submit]");if(bt.disabled)return;const id=f.dataset.gid,m=f.querySelector("[data-gm]");
    const d={name:f.querySelector("[data-gn]").value.trim(),teacher:f.querySelector("[data-gt]").value,time:f.querySelector("[data-gs]").value,end:f.querySelector("[data-ge]").value,days:[...f.querySelectorAll("[data-gd]:checked")].map(i=>Number(i.value))};{const gs=f.querySelector("[data-gsch]");const sc=gs?gs.value:(f.dataset.gs0||(id==="new"?(SCHOOLS[0]||{}).id:""));if(sc)d.school=sc}
    if(!d.name){m.textContent="Write the group name.";return}bt.disabled=true;m.textContent="Saving…";
    try{if(id==="new"){const r=await db.collection("classes").add({...d,n:Date.now()});if(!classes.some(c=>c.id===r.id))classes.push({id:r.id,...d,n:Date.now()})}else{await db.doc("classes/"+id).update(d);Object.assign(classes.find(c=>c.id===id)||{},d)}
      busy=false;render(true)}catch(_){m.textContent="Not saved. Try again.";bt.disabled=false}}})}
