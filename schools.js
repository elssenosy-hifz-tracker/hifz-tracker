// ---------- v43: several schools — Schools tab, school page (Info | Teachers | Groups | Students), teacher profile, teacher hours ----------
// schools/<id> {name,city,address,head,phone,whatsapp,email,website,days,fees,started,notes,n}; classes.school = school id;
// teachers.schools = [school ids] (a teacher can be in several); waiting.school; hours/<tid>_<date> {tid,date,start,end,by,at}.
let SCHOOLS=[],HOURS=[],SCH_LOADED=false,HRS_LOADED=false,schMigr=false,schFlash="";
const SCH_COL=["#0F6E5C","#2F5D9E","#8A5A12","#7A3E8E","#A23B3B","#3C6E2F"];
const schById=id=>SCHOOLS.find(s=>s.id===id)||null;
const schOfCls=cid=>{const c=classes.find(x=>x.id===cid);if(c&&c.school&&schById(c.school))return c.school;return SCHOOLS.length===1?SCHOOLS[0].id:""};
const schClasses=sid=>classes.filter(c=>schOfCls(c.id)===sid);
const schStudents=sid=>{const ids=new Set(schClasses(sid).map(c=>c.id));return students.filter(s=>ids.has(s.cls))};
const tInSch=(t,sid)=>Array.isArray(t.schools)&&t.schools.length?t.schools.includes(sid):SCHOOLS.length<=1;
const schTeachers=sid=>TEACHERS.filter(t=>tInSch(t,sid));
const schLogo=(s,big)=>{const i=Math.max(0,SCHOOLS.indexOf(s));return `<span class="sclogo${big?" big":""}" style="background:${SCH_COL[i%SCH_COL.length]}">${esc(String(s&&s.name||"م").trim().charAt(0)||"م")}</span>`};
let CUR_SCH="all";try{CUR_SCH=localStorage.getItem("hifz.sch")||"all"}catch(_){}
const schVisible=c=>SCHOOLS.length<2||CUR_SCH==="all"||!schById(CUR_SCH)||schOfCls(c.id)===CUR_SCH;
function schoolNameFor(cid){const sid=cid?schOfCls(cid):"";if(sid)return schById(sid).name||"";if(SCHOOLS.length===1)return SCHOOLS[0].name||"";return ((settings.main||{}).school||{}).name||""}

function schoolsInit(){
  const sub=(c,f,k=0)=>{try{db.collection(c).onSnapshot(s=>{f(s.docs.map(d=>({...d.data(),id:d.id})));render()},()=>{if(k<5)setTimeout(()=>sub(c,f,k+1),3000)})}catch(_){}};
  sub("schools",a=>{SCHOOLS=a.sort((x,y)=>(x.n||0)-(y.n||0)||String(x.name).localeCompare(String(y.name)));SCH_LOADED=true});
  sub("hours",a=>{HOURS=a;HRS_LOADED=true});
}

// ----- one-time move of the existing data under the first school (admin only, safe to repeat) -----
async function schMigrate(){if(schMigr||!isAdminV()||!loaded||!SCH_LOADED||!TCH_LOADED)return;
  // substitute access is stored as access/<cid>_<tid> so the security rules can find it; move older records there
  const oldAcc=ACCESS.filter(a=>a.cid&&a.tid&&a.id!==a.cid+"_"+a.tid).sort((x,y)=>(x.at||0)-(y.at||0));
  if(oldAcc.length){schMigr=true;try{for(const{id,...d}of oldAcc){const k=d.cid+"_"+d.tid,m=accMerge(ACCESS.find(a=>a.id===k),d);await db.doc("access/"+k).set(m);
    ACCESS=ACCESS.filter(a=>a.id!==id&&a.id!==k).concat({...m,id:k});await db.doc("access/"+id).delete()}}catch(e){console.error(e)}setTimeout(()=>schMigr=false,3000);return}
  const one=SCHOOLS.length===1?SCHOOLS[0].id:null;
  const need=!SCHOOLS.length||(one&&(classes.some(c=>!c.school)||TEACHERS.some(t=>!Array.isArray(t.schools))||WAITING.some(w=>!w.school)));if(!need)return;
  schMigr=true;
  try{let sid=one;
    if(!SCHOOLS.length){sid="s1";const nm=((settings.main||{}).school||{}).name||"Allatif Mosque";const d={name:nm,city:"",address:"",head:(TEACHERS.find(t=>t.role==="admin")||{}).name||"",phone:"",whatsapp:"",email:"",website:"",days:"",fees:"",started:"",notes:"",n:1};
      await db.doc("schools/s1").set(d);if(!SCHOOLS.some(s=>s.id==="s1"))SCHOOLS.push({id:"s1",...d})}
    for(const c of classes)if(!c.school){await db.doc("classes/"+c.id).update({school:sid});c.school=sid}
    for(const t of TEACHERS)if(!Array.isArray(t.schools)){await db.doc("teachers/"+t.id).update({schools:[sid]});t.schools=[sid]}
    for(const w of WAITING)if(!w.school){await db.doc("waiting/"+w.id).update({school:sid});w.school=sid}
    setTimeout(()=>schMigr=false,3000);
  }catch(e){console.error(e);setTimeout(()=>schMigr=false,15000)}}

// ----- hours -----
const hMins=h=>{const a=minsOf(h&&h.start),b=minsOf(h&&h.end);return a!=null&&b!=null&&b>a?b-a:0};
const hTxt=m=>{const h=Math.round(m/6)/10;return `${h} ${h===1?"hour":"hours"}`};
const hoursOf=(tid,from,to)=>HOURS.filter(h=>h.tid===tid&&h.date>=from&&h.date<=to);
const minsSum=list=>list.reduce((x,h)=>x+hMins(h),0);
const canEditHours=tid=>isAdminV()||(!isSupervisor()&&meTeacher()&&meTeacher().id===tid);
async function saveHours(tid,date,patch){const id=tid+"_"+date,cur=HOURS.find(h=>h.id===id)||{};const t=meTeacher();
  const d={tid,date,start:cur.start||"",end:cur.end||"",...patch,by:t?t.name:"admin",at:Date.now()};await db.doc("hours/"+id).set(d);
  const i=HOURS.findIndex(h=>h.id===id);if(i>=0)HOURS[i]={id,...d};else HOURS.push({id,...d})}
function hoursPanel(){if(!schoolOn()||isSupervisor())return "";const d=iso(today()),me=meTeacher();let list=[];
  if(isAdminV()){const ids=new Set();classesToday().filter(schVisible).forEach(c=>{if(c.teacher)ids.add(c.teacher);subsFor(c.id).forEach(a=>ids.add(a.tid))});HOURS.filter(h=>h.date===d).forEach(h=>ids.add(h.tid));if(me)ids.add(me.id);
    list=TEACHERS.filter(t=>ids.has(t.id)&&t.active!==false)}
  else if(me)list=[me];
  if(!list.length)return "";
  const row=t=>{const h=HOURS.find(x=>x.id===t.id+"_"+d)||{};const m=hMins(h);
    return `<div class="hrow" data-ht="${t.id}"><b>${esc(t.name)}</b>
      <label>Started<input type="time" data-hs value="${esc(h.start||"")}"></label><label>Finished<input type="time" data-he value="${esc(h.end||"")}"></label>
      <span class="hact">${!h.start?`<button class="primary sm" data-hnow="start">▶ Start now</button>`:!h.end?`<button class="primary sm" data-hnow="end">■ Finish now</button>`:`<span class="chip ok">${hTxt(m)}</span>`}</span></div>`};
  return `<div class="panel hpanel"><div class="head"><h3>${isAdminV()&&!(list.length===1&&me&&list[0].id===me.id)?"Teacher hours today":"My hours today"}</h3><span class="small muted">Counted in the teacher report</span></div>${list.map(row).join("")}<span class="small muted" id="hMsg"></span></div>`}
function wireHours(el){const d=iso(today()),msg=el.querySelector("#hMsg");
  el.querySelectorAll(".hrow[data-ht]").forEach(r=>{const tid=r.dataset.ht;const sv=async p=>{try{await saveHours(tid,d,p);busy=false;render(true)}catch(_){if(msg)msg.textContent="Not saved. Try again."}};
    r.querySelectorAll("input").forEach(i=>{i.addEventListener("focus",()=>busy=true);i.onchange=()=>sv(i.hasAttribute("data-hs")?{start:i.value}:{end:i.value})});
    r.querySelectorAll("[data-hnow]").forEach(b=>b.onclick=()=>sv({[b.dataset.hnow]:nowHM()}))})}

// ----- school switcher on Today and Students (only with 2+ schools) -----
function schSwitch(){if(SCHOOLS.length<2)return "";const cur=schById(CUR_SCH)?CUR_SCH:"all";
  return `<div class="schsw"><span class="small muted">School</span><select id="schSw"><option value="all" ${cur==="all"?"selected":""}>All schools</option>${SCHOOLS.map(s=>`<option value="${s.id}" ${s.id===cur?"selected":""}>${esc(s.name)}</option>`).join("")}</select></div>`}
function wireSchSwitch(el){const s=el.querySelector("#schSw");if(s)s.onchange=()=>{CUR_SCH=s.value;try{localStorage.setItem("hifz.sch",CUR_SCH)}catch(_){}busy=false;go({name:view.name})}}

// ----- Schools list -----
function renderSchools(el,sub){sub.textContent="Schools";const t=today(),m0=iso(new Date(t.getFullYear(),t.getMonth(),1)),d=iso(t);
  const st=students,mev=events.filter(e=>e.date>=m0&&e.date<=d);const ses=mev.filter(e=>e.type==="session");
  const pages=Math.round(ses.reduce((x,e)=>x+(Number(e.hifzLines)||0),0)/LINES),att=ses.length?Math.round(ses.filter(attended).length/ses.length*100)+"%":"—";
  const tests=mev.filter(e=>e.type==="test"&&(e.passed||/pass/i.test(String(e.result||e.grade||"")))).length;
  const act=TEACHERS.filter(x=>x.active!==false);
  el.innerHTML=`<p class="small muted">${SCHOOLS.length} ${SCHOOLS.length===1?"school":"schools"} · ${act.length} teachers · ${st.length} students</p>
   ${SCHOOLS.map(s=>`<button type="button" class="schcard" data-sch="${s.id}">${schLogo(s)}<span class="x"><b>${esc(s.name||"School")}</b><span class="small muted">${esc([s.city,s.head].filter(Boolean).join(" · "))}</span><span class="chips"><span class="chip">${schTeachers(s.id).filter(x=>x.active!==false).length} teachers</span><span class="chip">${schClasses(s.id).length} groups</span><span class="chip">${schStudents(s.id).length} students</span></span></span><span class="ar">›</span></button>`).join("")||(SCH_LOADED?'<div class="panel empty"><p>No schools yet.</p></div>':'<div class="empty">Loading…</div>')}
   ${isAdminV()?`<button class="primary wide" id="schAdd">＋ Add school</button>`:""}
   ${movesPanel()}<div class="panel"><h3>${SCHOOLS.length>1?"All schools this month":"This month"}</h3><div class="stats3 four"><div><b>${st.length}</b><span>students</span></div><div><b>${pages}</b><span>pages memorized</span></div><div><b>${att}</b><span>attendance</span></div><div><b>${tests}</b><span>tests passed</span></div></div></div>`;
  el.querySelectorAll("[data-sch]").forEach(b=>b.onclick=()=>go({name:"schoolv",id:b.dataset.sch,tab:"info"}));
  const a=el.querySelector("#schAdd");if(a)a.onclick=()=>go({name:"schoolv",id:"new",tab:"info",edit:1})}

// ----- one school -----
const SCH_F=[["name","School name","text"],["city","Suburb / city","text"],["head","Person in charge","text"],["phone","Phone","tel"],["whatsapp","WhatsApp","tel"],["email","Email","email"],["address","Address","text"],["website","Website","url"],["days","Class days","text"],["fees","Fees (AUD)","text"],["started","Started","date"],["notes","Notes","text"]];
function renderSchoolV(el,sub){const isNew=view.id==="new",s=isNew?{}:schById(view.id);
  if(!isNew&&!s){if(!SCH_LOADED){el.innerHTML='<div class="empty">Loading…</div>';return}go({name:"schools"});return}
  const tab=isNew?"info":(view.tab||"info");sub.textContent=isNew?"New school":(s.name||"School");
  const tabs=isNew?"":`<div class="stabs">${[["info","Info"],["teachers","Teachers"],["groups","Groups"],["students","Students"]].map(([k,l])=>`<button type="button" class="${k===tab?"on":""}" data-stab="${k}">${l}</button>`).join("")}</div>`;
  const head=isNew?"":`<div class="schhead">${schLogo(s,1)}<div><h2>${esc(s.name||"School")}</h2><span class="small muted">${esc(s.city||"")}</span></div></div>`;
  let body="";
  if(tab==="info")body=(view.edit&&isAdminV())?schForm(s,isNew):schInfo(s);
  if(tab==="teachers")body=schTeachersTab(s);
  if(tab==="groups")body=schGroupsTab(s);
  if(tab==="students")body=schStudentsTab(s);
  el.innerHTML=`${backBtn("Schools",{name:"schools"})}${head}${tabs}${body}`;
  wireBack(el);el.querySelectorAll("[data-stab]").forEach(b=>b.onclick=()=>{busy=false;go({name:"schoolv",id:s.id,tab:b.dataset.stab})});
  if(tab==="info")wireSchInfo(el,s,isNew);if(tab==="teachers")wireSchTeachers(el,s);if(tab==="groups"){wireGroupsEditor(el);el.querySelectorAll("[data-gmove]").forEach(b=>b.onclick=()=>go({name:"gmove",id:b.dataset.gmove,sch:s.id}));el.querySelectorAll("[data-gopen]").forEach(b=>b.onclick=()=>go({name:"today",cls:b.dataset.gopen}))}
  if(tab==="students")wireSchStudents(el,s)}
const telA=(v,kind)=>{const p=phoneDigits(v);if(!p)return "";return kind==="wa"?`<a class="btn sm" target="_blank" href="https://wa.me/${p.replace(/^0/,"61")}">💬 WhatsApp</a>`:`<a class="btn sm" href="tel:${esc(v)}">📞 Call</a>`};
function schInfo(s){const kv=(l,v)=>v?`<div class="kv"><span class="muted">${l}</span><span>${v}</span></div>`:"";
  const any=SCH_F.slice(1).some(([k])=>s[k]);
  return `<div class="panel"><h3>School details</h3>
   ${kv("Person in charge",esc(s.head||""))}${kv("Phone",esc(s.phone||""))}${kv("WhatsApp",esc(s.whatsapp||""))}${kv("Email",s.email?`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`:"")}${kv("Address",esc([s.address,s.city].filter(Boolean).join(", ")))}${kv("Website",s.website?`<a target="_blank" href="${esc(/^https?:/.test(s.website)?s.website:"https://"+s.website)}">${esc(s.website)}</a>`:"")}${kv("Class days",esc(s.days||""))}${kv("Fees",esc(s.fees||""))}${kv("Started",s.started?esc(fmt(parse(s.started))):"")}${kv("Notes",esc(s.notes||""))}
   ${any?"":`<p class="small muted">No details yet.${isAdminV()?" Tap Edit details to add the person in charge, phone, email and address.":""}</p>`}
   <div class="actions">${telA(s.phone)}${telA(s.whatsapp||s.phone,"wa")}${s.email?`<a class="btn sm" href="mailto:${esc(s.email)}">✉ Email</a>`:""}${isAdminV()?`<button class="sm" id="schEd">✎ Edit details</button>`:""}<span class="small muted">${esc(schFlash)}</span></div></div>
   <div class="stats3"><div><b>${schTeachers(s.id).filter(x=>x.active!==false).length}</b><span>teachers</span></div><div><b>${schClasses(s.id).length}</b><span>groups</span></div><div><b>${schStudents(s.id).length}</b><span>students</span></div></div>`}
function schForm(s,isNew){return `<form class="panel" id="schForm"><h3>${isNew?"Add school":"Edit school details"}</h3><div class="fields">
   ${SCH_F.map(([k,l,ty])=>`<label>${l}<input data-sf="${k}" type="${ty}" value="${esc(s[k]||"")}" ${k==="name"?"required":""}></label>`).join("")}</div>
   <div class="actions"><button class="primary" type="submit">${isNew?"Add school":"Save"}</button><button type="button" id="schCancel">Cancel</button>${!isNew&&!schClasses(s.id).length&&SCHOOLS.length>1?`<button type="button" class="link small neg" id="schDel">Delete school</button>`:""}<span class="small muted" id="schMsg"></span></div>
   ${!isNew&&schClasses(s.id).length?`<p class="small muted">A school can be deleted only when it has no groups.</p>`:""}</form>`}
function wireSchInfo(el,s,isNew){const q=x=>el.querySelector(x);const e=q("#schEd");if(e)e.onclick=()=>{schFlash="";go({name:"schoolv",id:s.id,tab:"info",edit:1})};
  const f=q("#schForm");if(!f)return;f.querySelectorAll("input").forEach(i=>i.addEventListener("focus",()=>busy=true));
  q("#schCancel").onclick=()=>{busy=false;go(isNew?{name:"schools"}:{name:"schoolv",id:s.id,tab:"info"})};
  f.onsubmit=async ev=>{ev.preventDefault();const bt=f.querySelector("button[type=submit]");if(bt.disabled)return;const d={};f.querySelectorAll("[data-sf]").forEach(i=>d[i.dataset.sf]=i.value.trim());if(!d.name)return;bt.disabled=true;q("#schMsg").textContent="Saving…";
    try{let id=s.id;if(isNew){d.n=Date.now();const r=await db.collection("schools").add(d);id=r.id;if(!SCHOOLS.some(x=>x.id===id))SCHOOLS.push({id,...d})}else{await db.doc("schools/"+id).update(d);Object.assign(s,d)}
      if(SCHOOLS.length<=1||id===(SCHOOLS[0]||{}).id){try{await db.doc("settings/main").set({...(settings.main||{}),school:{...((settings.main||{}).school||{}),name:d.name}})}catch(_){}}
      schFlash="Saved ✓";busy=false;go({name:"schoolv",id,tab:"info"})}catch(_){q("#schMsg").textContent="Not saved. Try again.";bt.disabled=false}};
  const dl=q("#schDel");if(dl)dl.onclick=async()=>{if(dl.dataset.c!=="1"){dl.dataset.c="1";dl.textContent="Tap again to delete "+s.name;return}try{await db.doc("schools/"+s.id).delete();SCHOOLS=SCHOOLS.filter(x=>x.id!==s.id);busy=false;go({name:"schools"})}catch(_){q("#schMsg").textContent="Not deleted."}}}
const linkedT=t=>Object.values(LINKS).some(l=>l.tid===t.id)||(t.role==="admin"&&ME_OWNER);
function schTeachersTab(s){const L=schTeachers(s.id),others=TEACHERS.filter(t=>!tInSch(t,s.id)&&t.active!==false);
  const row=t=>{const gs=schClasses(s.id).filter(c=>c.teacher===t.id);const n=gs.reduce((x,c)=>x+students.filter(st=>st.cls===c.id).length,0);
    return `<div class="trow2"><button type="button" class="tname" data-tprof="${t.id}"><span class="av">${esc(String(t.name||"?").charAt(0))}</span><span><b>${esc(t.name)}</b> <span class="chip plain">${SC_ROLES[t.role]||"Teacher"}</span>${t.active===false?' <span class="chip bad">Paused</span>':""}<br><span class="small muted">${t.role==="supervisor"?"View only":gs.length?esc(gs.map(c=>c.name).join(", "))+` · ${n} students`:"No group yet"}</span></span></button>
      <span class="qc">${phoneDigits(t.phone)?`<a href="tel:${esc(t.phone)}" aria-label="Call">📞</a><a target="_blank" href="https://wa.me/${phoneDigits(t.phone).replace(/^0/,"61")}" aria-label="WhatsApp">💬</a>`:""}${t.email?`<a href="mailto:${esc(t.email)}" aria-label="Email">✉</a>`:""}</span></div>`};
  return `<div class="panel">${L.length?L.map(row).join(""):'<p class="muted">No teachers in this school yet.</p>'}
    ${isAdminV()?`<div class="actions"><button class="primary" id="tAddS">＋ Add teacher to this school</button></div>${others.length?`<div class="gform"><label>Or add a teacher from another school<select id="tExist">${others.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></label><div class="actions"><button class="sm" id="tExistGo">Add to this school</button><span class="small muted" id="tExMsg"></span></div></div>`:""}`:""}</div>
    ${SCHOOLS.length>1?'<p class="small muted">A teacher can work in more than one school.</p>':""}`}
function wireSchTeachers(el,s){el.querySelectorAll("[data-tprof]").forEach(b=>b.onclick=()=>go({name:"teacher",id:b.dataset.tprof,sch:s.id}));
  const a=el.querySelector("#tAddS");if(a)a.onclick=()=>go({name:"school",tid:"new",sch:s.id});
  const x=el.querySelector("#tExistGo");if(x){el.querySelector("#tExist").addEventListener("focus",()=>busy=true);x.onclick=async()=>{const t=TEACHERS.find(y=>y.id===el.querySelector("#tExist").value);if(!t)return;const sc=[...new Set([...(Array.isArray(t.schools)?t.schools:[]),s.id])];
    try{await db.doc("teachers/"+t.id).update({schools:sc});t.schools=sc;busy=false;render(true)}catch(_){el.querySelector("#tExMsg").textContent="Not saved."}}}}
function schGroupsTab(s){const t=today(),m0=iso(new Date(t.getFullYear(),t.getMonth(),1)),d=iso(t);
  const card=c=>{const ids=new Set(students.filter(x=>x.cls===c.id).map(x=>x.id)),ses=events.filter(e=>e.type==="session"&&ids.has(e.sid)&&e.date>=m0&&e.date<=d);
    const pages=Math.round(ses.reduce((x,e)=>x+(Number(e.hifzLines)||0),0)/LINES),att=ses.length?Math.round(ses.filter(attended).length/ses.length*100):null;
    return `<div class="panel grpw"><button type="button" class="grpc" data-gopen="${c.id}"><span class="head"><b>${esc(c.name)}</b><span class="small muted">${esc(tName(c.teacher)||"No teacher")}</span></span>
      <span class="small muted">${esc(scheduleText(c))} · ${ids.size} students</span><span class="bar"><i style="width:${att==null?0:att}%"></i></span><span class="small muted">${pages} pages this month · ${att==null?"—":att+"%"} attendance</span></button>
      ${isAdminV()?`<div class="actions"><button type="button" class="sm" data-gmove="${c.id}">⇄ Move group</button></div>`:""}</div>`};
  const L=schClasses(s.id);
  return `${L.map(card).join("")||'<div class="panel empty"><p>No groups in this school yet.</p></div>'}
   ${isAdminV()?`<details class="panel" ${L.length?"":"open"}><summary><h3>Add or edit groups</h3></summary>${groupsEditor(s.id)}</details>`:""}`}
function schStudentsTab(s){const L=schStudents(s.id).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name)));const w=WAITING.filter(x=>(x.school||"")===s.id||(!x.school&&SCHOOLS.length===1)).length;
  return `${isAdminV()?`<div class="hubs">
     <button type="button" class="hub" data-sgo="add"><i>＋</i><b>Add student</b><span>Name, group, amount, start</span></button>
     <button type="button" class="hub" data-sgo="waitlist"><i>⏳</i><b>Waiting list</b><span>${w} waiting for a place</span></button>
     <button type="button" class="hub" data-sgo="place"><i>✎</i><b>Placement test</b><span>For a new student</span></button>
     <button type="button" class="hub" data-sgo="fees"><i>$</i><b>Fees</b><span>Monthly fees in AUD</span></button></div>`:""}
   <div class="panel"><h3>Students (${L.length})</h3>${L.map(st=>`<button type="button" class="srow" data-sst="${st.id}"><b>${esc(st.name)}</b><span class="small muted">${esc(clsName(st.cls)||"")}</span></button>`).join("")||'<p class="muted">No students yet.</p>'}</div>`}
function wireSchStudents(el,s){el.querySelectorAll("[data-sst]").forEach(b=>b.onclick=()=>go({name:"student",id:b.dataset.sst}));
  el.querySelectorAll("[data-sgo]").forEach(b=>b.onclick=()=>{const k=b.dataset.sgo,c=(schClasses(s.id)[0]||{}).id;go(k==="waitlist"?{name:"waitlist",sch:s.id}:k==="add"?{name:"add",cls:c}:{name:k,cls:c})})}

// ----- teacher profile -----
function renderTeacher(el,sub){const t=TEACHERS.find(x=>x.id===view.id);if(!t){go({name:"schools"});return}sub.textContent=t.name;
  const td=today(),m0=iso(new Date(td.getFullYear(),td.getMonth(),1)),w0=iso(weekStart()),d=iso(td);
  const gs=classes.filter(c=>c.teacher===t.id),schs=SCHOOLS.filter(s=>tInSch(t,s.id));
  const held=meetings.filter(m=>m.date>=m0&&m.date<=d&&m.startBy===t.name).length,rec=events.filter(e=>e.type==="session"&&!e.auto&&e.by===t.name&&e.date>=m0&&e.date<=d).length;
  const wk=minsSum(hoursOf(t.id,w0,d)),mo=minsSum(hoursOf(t.id,m0,d));
  const days=HOURS.filter(h=>h.tid===t.id&&h.date>=iso(addDays(td,-40))).sort((a,b)=>b.date.localeCompare(a.date));
  const kv=(l,v)=>v?`<div class="kv"><span class="muted">${l}</span><span>${v}</span></div>`:"";
  const back=view.sch&&schById(view.sch)?backBtn(schById(view.sch).name,{name:"schoolv",id:view.sch,tab:"teachers"}):backBtn("Schools",{name:"schools"});
  const share=`${t.name} · ${fmtShort(d)}\nHours this week: ${hTxt(wk)}\nHours this month: ${hTxt(mo)}\nClasses this month: ${held}\nSessions recorded this month: ${rec}`;
  el.innerHTML=`${back}<div class="schhead"><span class="av big">${esc(String(t.name||"?").charAt(0))}</span><div><h2>${esc(t.name)}</h2><span class="chip plain">${SC_ROLES[t.role]||"Teacher"}</span> ${linkedT(t)?'<span class="chip ok">✓ linked</span>':'<span class="chip warn">Not opened yet</span>'}${t.active===false?' <span class="chip bad">Paused</span>':""}</div></div>
   <div class="panel"><h3>Contact</h3>${kv("Phone / WhatsApp",esc(t.phone||""))}${kv("Sign-in email",esc(t.email||""))}${!t.phone&&!t.email?'<p class="small muted">No contact details yet.</p>':""}
    <div class="actions">${telA(t.phone)}${telA(t.phone,"wa")}${t.email?`<a class="btn sm" href="mailto:${esc(t.email)}">✉ Email</a>`:""}</div></div>
   <div class="panel"><h3>Teaching</h3>${kv("Schools",esc(schs.map(s=>s.name).join(", ")))}${kv("Groups",esc(gs.map(c=>c.name).join(", "))||'<span class="muted">None</span>')}${kv("Ijazah / riwayah",esc(t.ijazah||""))}${kv("Started",t.started?esc(fmt(parse(t.started))):"")}${kv("Notes",esc(t.notes||""))}</div>
   <div class="panel"><div class="head"><h3>Hours</h3><a class="btn sm" target="_blank" href="https://wa.me/?text=${encodeURIComponent(share)}">Share on WhatsApp</a></div>
    <div class="stats3"><div><b>${hTxt(wk)}</b><span>this week</span></div><div><b>${hTxt(mo)}</b><span>this month</span></div><div><b>${days.filter(h=>h.date>=m0).length}</b><span>days this month</span></div></div>
    ${days.length?days.map(h=>`<div class="kv"><span>${fmtShort(h.date)}</span><span>${esc(h.start||"?")}–${esc(h.end||"…")} · <b>${hMins(h)?hTxt(hMins(h)):"—"}</b></span></div>`).join(""):'<p class="small muted">No hours yet. Teachers tap ▶ Start now on the Today page.</p>'}
    ${canEditHours(t.id)?`<details class="gsec"><summary class="small"><b>Add or fix a day</b></summary><div class="fields"><label>Date<input type="date" id="hd_d" value="${d}" max="${d}"></label><label>Started<input type="time" id="hd_s"></label><label>Finished<input type="time" id="hd_e"></label></div><div class="actions"><button class="sm" id="hd_go">Save day</button><span class="small muted" id="hd_m"></span></div></details>`:""}</div>
   <div class="stats3"><div><b>${held}</b><span>classes this month</span></div><div><b>${rec}</b><span>sessions recorded</span></div><div><b>${gs.reduce((x,c)=>x+students.filter(s=>s.cls===c.id).length,0)}</b><span>students</span></div></div>
   ${isAdminV()?`<div class="actions"><button class="primary" id="tEd">✎ Edit teacher</button>${gs.length?`<button id="tHand">⇄ Hand over groups</button>`:""}</div>`:""}`;
  wireBack(el);const q=x=>el.querySelector(x);const e=q("#tEd");if(e)e.onclick=()=>go({name:"school",tid:t.id,sch:view.sch});const th=q("#tHand");if(th)th.onclick=()=>go({name:"handover",id:t.id,sch:view.sch});
  const hg=q("#hd_go");if(hg){["#hd_d","#hd_s","#hd_e"].forEach(x=>q(x).addEventListener("focus",()=>busy=true));
    const fill=()=>{const h=HOURS.find(x=>x.id===t.id+"_"+q("#hd_d").value)||{};q("#hd_s").value=h.start||"";q("#hd_e").value=h.end||""};fill();q("#hd_d").onchange=fill;
    hg.onclick=async()=>{try{await saveHours(t.id,q("#hd_d").value,{start:q("#hd_s").value,end:q("#hd_e").value});busy=false;render(true)}catch(_){q("#hd_m").textContent="Not saved."}}}}

Object.assign(AR_DICT,{"Schools":"المدارس","School":"المدرسة","All schools":"كل المدارس","＋ Add school":"＋ أضف مدرسة","Add school":"أضف مدرسة","This month":"هذا الشهر","All schools this month":"كل المدارس هذا الشهر","tests passed":"اختبارًا ناجحًا","pages memorized":"صفحة محفوظة","attendance":"الحضور","teachers":"معلّمون","groups":"مجموعات","students":"طلاب",
 "Info":"البيانات","Teachers":"المعلّمون","Groups":"المجموعات","Students":"الطلاب","School details":"بيانات المدرسة","Person in charge":"المسؤول","Phone":"الهاتف","WhatsApp":"واتساب","Email":"البريد الإلكتروني","Address":"العنوان","Website":"الموقع","Class days":"أيام الحصص","Fees":"الرسوم","Fees (AUD)":"الرسوم (دولار أسترالي)","Started":"بدأ","Notes":"ملاحظات","School name":"اسم المدرسة","Suburb / city":"الضاحية / المدينة",
 "✎ Edit details":"✎ عدّل البيانات","Edit school details":"تعديل بيانات المدرسة","Save":"حفظ","Cancel":"إلغاء","Delete school":"احذف المدرسة","A school can be deleted only when it has no groups.":"لا تُحذف المدرسة إلا إذا لم تكن فيها مجموعات.","No details yet.":"لا توجد بيانات بعد.","Tap Edit details to add the person in charge, phone, email and address.":"اضغط «عدّل البيانات» لإضافة المسؤول والهاتف والبريد والعنوان.",
 "📞 Call":"📞 اتصال","💬 WhatsApp":"💬 واتساب","✉ Email":"✉ بريد","＋ Add teacher to this school":"＋ أضف معلّمًا إلى هذه المدرسة","Or add a teacher from another school":"أو أضف معلّمًا من مدرسة أخرى","Add to this school":"أضفه إلى هذه المدرسة","A teacher can work in more than one school.":"يمكن أن يعمل المعلّم في أكثر من مدرسة.","No teachers in this school yet.":"لا يوجد معلّمون في هذه المدرسة بعد.","No group yet":"لا مجموعة بعد","View only":"للاطلاع فقط",
 "No groups in this school yet.":"لا توجد مجموعات في هذه المدرسة بعد.","Add or edit groups":"أضف المجموعات أو عدّلها","No teacher":"بلا معلّم","Add student":"أضف طالبًا","Name, group, amount, start":"الاسم والمجموعة والمقدار والبداية","Waiting list":"قائمة الانتظار","Placement test":"اختبار تحديد المستوى","For a new student":"لطالب جديد","Monthly fees in AUD":"الرسوم الشهرية بالدولار الأسترالي","No students yet.":"لا يوجد طلاب بعد.",
 "Contact":"التواصل","Phone / WhatsApp":"الهاتف / واتساب","Sign-in email":"بريد الدخول","No contact details yet.":"لا توجد بيانات تواصل بعد.","Teaching":"التدريس","Ijazah / riwayah":"الإجازة / الرواية","None":"لا شيء","Hours":"الساعات","this week":"هذا الأسبوع","this month":"هذا الشهر","days this month":"يومًا هذا الشهر","classes this month":"حصة هذا الشهر","sessions recorded":"تسجيلًا","✎ Edit teacher":"✎ عدّل بيانات المعلّم","Share on WhatsApp":"أرسل عبر واتساب",
 "No hours yet. Teachers tap ▶ Start now on the Today page.":"لا ساعات بعد. يضغط المعلّم «▶ ابدأ الآن» في صفحة اليوم.","Add or fix a day":"أضف يومًا أو صحّحه","Save day":"احفظ اليوم","Finished":"انتهى","My hours today":"ساعاتي اليوم","Teacher hours today":"ساعات المعلّمين اليوم","Counted in the teacher report":"تُحسب في تقرير المعلّم","▶ Start now":"▶ ابدأ الآن","■ Finish now":"■ انتهيت الآن","Not saved. Try again.":"لم يُحفظ. حاول مرة أخرى.",
 "Saved ✓":"تم الحفظ ✓","Saving…":"جارٍ الحفظ…","Not opened yet":"لم يفتح البرنامج بعد","✓ linked":"✓ مرتبط","Paused":"موقوف","New school":"مدرسة جديدة","No schools yet.":"لا توجد مدارس بعد.","Schools, teachers, groups, waiting list":"المدارس والمعلّمون والمجموعات وقائمة الانتظار","Hours this week":"ساعات هذا الأسبوع","Teacher of":"معلّم","Main teacher of":"المعلّم الأساسي لـ","Works in":"يعمل في","← Schools":"← المدارس"});
AR_PAT.push([/^([\d.]+) hours?$/,"$1 ساعة"],[/^(\d+) schools?$/,"$1 مدارس"],[/^Students \((\d+)\)$/,"الطلاب ($1)"],[/^(\d+) waiting for a place$/,"$1 ينتظرون مكانًا"],[/^(\d+) pages this month · (.+) attendance$/,"$1 صفحة هذا الشهر · الحضور $2"],[/^(\d+) schools? · (\d+) teachers · (\d+) students$/,"المدارس $1 · المعلّمون $2 · الطلاب $3"],[/^(\d+) teachers$/,"$1 معلّمين"],[/^(\d+) groups$/,"$1 مجموعات"]);
Object.assign(AR_DICT,{"Grading, points, holidays, backup":"التقدير والنقاط والإجازات والنسخ الاحتياطي","Same rules in every school · daily reading per group · breaks · backup and restore":"قواعد واحدة في كل المدارس · الورد اليومي لكل مجموعة · الإجازات · النسخ الاحتياطي والاستعادة","Moved into each school":"نُقلت إلى داخل كل مدرسة","Teachers · Groups · Add student · Waiting list · Placement test · Fees: open Schools, then a school.":"المعلّمون · المجموعات · إضافة طالب · قائمة الانتظار · اختبار تحديد المستوى · الرسوم: افتح «المدارس» ثم اختر المدرسة.","Teacher profile ›":"ملف المعلّم ›","Add teachers in Schools › a school › Teachers.":"أضف المعلّمين من: المدارس › المدرسة › المعلّمون.","Edit teacher":"تعديل بيانات المعلّم","Add teacher":"إضافة معلّم","Works in":"يعمل في"});

// ----- v44: moving groups between schools and teachers, handing over a teacher's groups, history of moves -----
const tOptsAll=(sel,none)=>(none?`<option value="">No teacher</option>`:"")+TEACHERS.filter(t=>t.active!==false&&t.role!=="supervisor").map(t=>`<option value="${t.id}" ${t.id===sel?"selected":""}>${esc(t.name)}${SCHOOLS.length>1?" · "+esc(SCHOOLS.filter(x=>tInSch(t,x.id)).map(x=>x.name).join(", ")):""}</option>`).join("");
const moveTxt=(c,m)=>{const p=[];if(m.fs!==m.ts)p.push(`${esc(schById(m.fs)?schById(m.fs).name:"?")} → <b>${esc(schById(m.ts)?schById(m.ts).name:"?")}</b>`);if(m.ft!==m.tt)p.push(`${esc(tName(m.ft)||"no teacher")} → <b>${esc(tName(m.tt)||"no teacher")}</b>`);return `${fmtShort(m.date)} · <b>${esc(c.name)}</b>: ${p.join(" · ")}${m.note?` <span class="muted">· ${esc(m.note)}</span>`:""}`};
const allMoves=()=>classes.flatMap(c=>(c.moves||[]).map(m=>({c,m}))).sort((a,b)=>(b.m.at||0)-(a.m.at||0));
async function moveGroup(c,ts,tt,date,note){const fs=schOfCls(c.id),ft=c.teacher||"";if(fs===ts&&ft===tt)return false;
  const m={date,fs,ts,ft,tt,note,at:Date.now()};const moves=[...(c.moves||[]),m];
  await db.doc("classes/"+c.id).update({school:ts,teacher:tt,moves});Object.assign(c,{school:ts,teacher:tt,moves});
  const t=TEACHERS.find(x=>x.id===tt);if(t&&ts&&!tInSch(t,ts)){const sc=[...new Set([...(Array.isArray(t.schools)?t.schools:[]),ts])];await db.doc("teachers/"+t.id).update({schools:sc});t.schools=sc}
  return true}
function renderGMove(el,sub){const c=classes.find(x=>x.id===view.id);if(!c||!isAdminV()){go({name:"schools"});return}sub.textContent="Move group";
  const fs=schOfCls(c.id),n=students.filter(x=>x.cls===c.id).length,back=view.sch&&schById(view.sch)?backBtn(schById(view.sch).name,{name:"schoolv",id:view.sch,tab:"groups"}):backBtn("Schools",{name:"schools"});
  el.innerHTML=`${back}<form class="panel" id="mvForm"><h3>Move ${esc(c.name)}</h3>
    <p class="small"><span class="muted">Now:</span> <b>${esc(schById(fs)?schById(fs).name:"no school")}</b> · <b>${esc(tName(c.teacher)||"no teacher")}</b> · <span>${n} students</span></p><p class="small muted">The students, their records and the class times move with the group.</p>
    <div class="fields">${SCHOOLS.length>1?`<label>To school<select id="mv_s">${SCHOOLS.map(x=>`<option value="${x.id}" ${x.id===fs?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>`:""}
    <label>Teacher<select id="mv_t">${tOptsAll(c.teacher,1)}</select></label><label>From date<input type="date" id="mv_d" value="${iso(today())}"></label><label>Note (optional)<input id="mv_n" placeholder="e.g. Bilal moved to the girls' school"></label></div>
    <p class="small muted">If the new teacher is not in the new school yet, they are added to it.</p>
    <div class="actions"><button class="primary" type="submit">Move group</button><button type="button" id="mv_c">Cancel</button><span class="small muted" id="mv_m"></span></div></form>
    ${(c.moves||[]).length?`<div class="panel"><h3>History of this group</h3>${(c.moves||[]).slice().reverse().map(m=>`<p class="small">${moveTxt(c,m)}</p>`).join("")}</div>`:""}`;
  wireBack(el);const q=x=>el.querySelector(x);const f=q("#mvForm");f.querySelectorAll("input,select").forEach(i=>i.addEventListener("focus",()=>busy=true));
  q("#mv_c").onclick=()=>{busy=false;q("#back").click()};
  f.onsubmit=async e=>{e.preventDefault();const bt=f.querySelector("button[type=submit]");if(bt.disabled)return;const ts=q("#mv_s")?q("#mv_s").value:fs;bt.disabled=true;q("#mv_m").textContent="Moving…";
    try{const ok=await moveGroup(c,ts,q("#mv_t").value,q("#mv_d").value||iso(today()),q("#mv_n").value.trim());if(!ok){q("#mv_m").textContent="Nothing changed.";bt.disabled=false;return}
      busy=false;schFlash="";go({name:"schoolv",id:ts,tab:"groups"})}catch(_){q("#mv_m").textContent="Not moved. Try again.";bt.disabled=false}}}
function renderHandover(el,sub){const t=TEACHERS.find(x=>x.id===view.id);if(!t||!isAdminV()){go({name:"schools"});return}sub.textContent="Hand over groups";const gs=classes.filter(c=>c.teacher===t.id);
  el.innerHTML=`${backBtn(t.name,{name:"teacher",id:t.id,sch:view.sch})}<form class="panel" id="hoForm"><h3>Hand over ${esc(t.name)}'s groups</h3>
    <p class="small muted">Pick the new teacher for each group, e.g. when ${esc(t.name)} leaves or changes school. Old sessions keep "Recorded by ${esc(t.name)}".</p>
    ${gs.length?gs.map(c=>`<label>${esc(c.name)}${SCHOOLS.length>1?` <span class="small muted">· ${esc((schById(schOfCls(c.id))||{}).name||"")}</span>`:""}<select data-ho="${c.id}">${tOptsAll(t.id,1)}</select></label>`).join(""):'<p class="muted">No groups.</p>'}
    <div class="seg" style="margin-top:8px">${TEACHERS.filter(x=>x.active!==false&&x.role!=="supervisor"&&x.id!==t.id).map(x=>`<button type="button" class="fbtn" data-hoall="${x.id}">All to ${esc(x.name)}</button>`).join("")}</div>
    <label>From date<input type="date" id="ho_d" value="${iso(today())}"></label><label>Note (optional)<input id="ho_n"></label>
    <div class="actions"><button class="primary" type="submit">Hand over</button><span class="small muted" id="ho_m"></span></div></form>`;
  wireBack(el);const q=x=>el.querySelector(x);const f=q("#hoForm");f.querySelectorAll("input,select").forEach(i=>i.addEventListener("focus",()=>busy=true));
  f.querySelectorAll("[data-hoall]").forEach(b=>b.onclick=()=>{f.querySelectorAll("[data-ho]").forEach(s=>s.value=b.dataset.hoall);f.querySelectorAll("[data-hoall]").forEach(x=>x.classList.toggle("on",x===b));busy=true});
  f.onsubmit=async e=>{e.preventDefault();const bt=f.querySelector("button[type=submit]");if(bt.disabled)return;bt.disabled=true;q("#ho_m").textContent="Saving…";let n=0;
    try{for(const sl of f.querySelectorAll("[data-ho]")){const c=classes.find(x=>x.id===sl.dataset.ho);if(await moveGroup(c,schOfCls(c.id),sl.value,q("#ho_d").value||iso(today()),q("#ho_n").value.trim()))n++}
      busy=false;go({name:"teacher",id:t.id,sch:view.sch})}catch(_){q("#ho_m").textContent="Not saved. Try again.";bt.disabled=false}}}
function movesPanel(){const L=allMoves().slice(0,8);if(!L.length)return "";return `<div class="panel"><h3>Recent moves</h3>${L.map(({c,m})=>`<p class="small">${moveTxt(c,m)}</p>`).join("")}</div>`}
Object.assign(AR_DICT,{"⇄ Move group":"⇄ انقل المجموعة","Move group":"نقل المجموعة","To school":"إلى مدرسة","Teacher":"المعلّم","From date":"ابتداءً من","Note (optional)":"ملاحظة (اختياري)","If the new teacher is not in the new school yet, they are added to it.":"إذا لم يكن المعلّم الجديد في المدرسة الجديدة، يُضاف إليها.","History of this group":"سجل تنقّلات هذه المجموعة","Nothing changed.":"لم يتغيّر شيء.","Moving…":"جارٍ النقل…","Not moved. Try again.":"لم يتم النقل. حاول مرة أخرى.",
 "⇄ Hand over groups":"⇄ سلّم مجموعاته لمعلّم آخر","Hand over groups":"تسليم المجموعات","Hand over":"سلِّم","No groups.":"لا مجموعات.","Recent moves":"آخر التنقّلات","no teacher":"بلا معلّم","no school":"بلا مدرسة","Now:":"الآن:","The students, their records and the class times move with the group.":"ينتقل مع المجموعة طلابها وسجلاتهم ومواعيد الحصص.","e.g. Bilal moved to the girls' school":"مثلًا: انتقل بلال إلى مدرسة البنات"});
AR_PAT.push([/^Move (.+)$/,"نقل $1"],[/^All to (.+)$/,"الكل إلى $1"],[/^Hand over (.+)'s groups$/,"تسليم مجموعات $1"]);

// ----- v45: data-integrity helpers -----
const READY=new Set();
const allReady=()=>["events","settings","marks","breaks","meetings","classes"].every(k=>READY.has(k));
function stampRec(){let t=null;try{t=meTeacher()}catch(_){}return {uid:ME_UID||"",tid:t?t.id:"",at:Date.now(),pv:2}}
Object.assign(AR_DICT,{"Write how many mistakes there were in the juz test (0 if none).":"اكتب عدد الأخطاء في اختبار الجزء (0 إن لم توجد).","Write the number, 0 if none":"اكتب العدد، 0 إن لم توجد","Not saved. Check your connection and try again.":"لم يُحفظ. تأكد من الاتصال وحاول مرة أخرى.","The record was saved, but the student's position was not updated. Tap Save again (it will not make a second record).":"حُفظ السجل، لكن لم يُحدَّث موضع الطالب. اضغط «حفظ» مرة أخرى (لن يُنشئ سجلًا ثانيًا).","Still loading all records. Wait a few seconds and try again.":"ما زالت السجلات تُحمَّل. انتظر ثوانيَ وحاول مرة أخرى.","First saving a safety copy of the current data…":"يُحفظ أولًا نسخة أمان من البيانات الحالية…","The safety copy was not saved, so nothing was restored. Allow the download and tap Restore again.":"لم تُحفظ نسخة الأمان، فلم يُستعد شيء. اسمح بالتنزيل واضغط «استعادة» مرة أخرى.","Saving…":"جارٍ الحفظ…","Save anyway":"احفظ على أي حال","Check before saving:":"راجع قبل الحفظ:","That mistake was not saved. Check your connection and tap the word again.":"لم يُحفظ هذا الخطأ. تأكد من الاتصال واضغط الكلمة مرة أخرى.","Tap again to restore":"اضغط مرة أخرى للاستعادة"});
AR_PAT.push([/^(.+): arrival was not saved\. Check your connection and tap again\.$/,"$1: لم يُحفظ الوصول. تأكد من الاتصال واضغط مرة أخرى."],[/^there is a later record \((.+)\)\. This one is saved as history and does not move the student's position\.$/,"يوجد سجل أحدث ($1). هذا السجل يُحفظ في السجل فقط ولا يغيّر موضع الطالب."],[/^This changes memorized from ([\d.]+) to ([\d.]+) pages\. Tap Save again to confirm\.$/,"هذا يغيّر المحفوظ من $1 إلى $2 صفحة. اضغط «حفظ» مرة أخرى للتأكيد."],[/^(.+) is ticked as memorized before\. "Reached" should be the last place memorized in the program\. Fix it, or tap Save again to keep it\.$/,"سورة $1 محددة على أنها محفوظة من قبل. «وصل إلى» يجب أن يكون آخر موضع حفظه في البرنامج. صحّحه، أو اضغط «حفظ» مرة أخرى للإبقاء عليه."]);
Object.assign(AR_DICT,{"Too little heard to judge":"سُمع منها قليل لا يكفي للحكم","⏱ Time ran out":"⏱ انتهى الوقت","✋ Could not continue":"✋ لم يستطع الإكمال","Could not continue":"لم يستطع الإكمال","Stopped: time":"توقف: انتهى الوقت"});
AR_PAT.push([/^(\d+) too little heard to judge$/,"$1 سُمع منها قليل لا يكفي للحكم"]);
AR_PAT.push([/^Back after (\d+) missed days \(since (.+)\)\. Suggestion from the guide: today is review only, no new hifz\. Near review and yesterday's portion first\. The teacher decides\.$/,"عاد بعد غياب $1 أيام (منذ $2). اقتراح من الدليل: اليوم مراجعة فقط بلا حفظ جديد، ويبدأ بالمراجعة القريبة وحفظ الأمس. والقرار للمعلّم."]);
Object.assign(AR_DICT,{"💾 Backup":"💾 نسخة احتياطية","⚙ Settings":"⚙ الإعدادات","Saved. Keep the file somewhere safe.":"تم الحفظ. احتفظ بالملف في مكان آمن.","The backup was not saved. Try again.":"لم تُحفظ النسخة الاحتياطية. حاول مرة أخرى.","Downloads are not available here.":"التنزيل غير متاح هنا.","Still loading all records. Wait a few seconds and try again.":"ما زالت السجلات تُحمَّل. انتظر ثوانيَ ثم حاول مرة أخرى."});
Object.assign(AR_DICT,{"Not heard by the teacher in 28 days":"لم يسمعه المعلّم منذ 28 يومًا","Heavy day":"يوم ثقيل","(test not passed yet)":"(لم يُجتز الاختبار بعد)","Consolidation week: suggested no new hifz":"أسبوع التثبيت: يُقترح عدم الحفظ الجديد","Memorized, but not recited to the teacher in the last 28 days (recitation to a classmate does not count). Oldest first: a suggestion for the in-class far review.":"محفوظ، لكنه لم يُسمَّع للمعلّم في آخر 28 يومًا (التسميع للزميل لا يُحتسب). الأقدم أولًا: اقتراح للمراجعة البعيدة في الحلقة.","(never)":"(لم يُسمع)"});
AR_PAT.push([/^(\d+) surahs? · ([\d.]+) p$/,"$1 سورة · $2 ص"],[/^Estimated home review time: about (\d+) min \(near ([\d.]+) p, far ([\d.]+) p, reading (\d+) p\)\. New hifz not included\.( More than 2 hours: consider a longer far-review cycle or less reading\.)?$/,(m,a,b,c,d,e)=>`الوقت التقديري للمراجعة في البيت: نحو ${a} دقيقة (القريب ${b} ص، البعيد ${c} ص، القراءة ${d} ص). لا يشمل الحفظ الجديد.${e?" أكثر من ساعتين: فكّر في دورة مراجعة بعيدة أطول أو قراءة أقل.":""}`]);
Object.assign(AR_DICT,{"Reading starts on":"تبدأ القراءة يوم","After you add the student, you can still change their surahs. Only an admin can change the other details, move the student to another group or delete them.":"بعد إضافة الطالب يمكنك تغيير سوره. ولا يستطيع تعديلَ باقي البيانات أو نقلَه إلى مجموعة أخرى أو حذفَه إلا مسؤول الإدارة.",
 "＋ New group":"＋ مجموعة جديدة","Group name":"اسم المجموعة","Starts":"وقت البدء","Ends":"وقت الانتهاء","Group days":"أيام المجموعة","Write the group name.":"اكتب اسم المجموعة.","e.g. Girls class":"مثلًا: حلقة البنات",
 "You will be the teacher of the new group. Only an admin can rename it, change its days or delete it later.":"ستكون أنت معلّمَ المجموعة الجديدة. ولا يستطيع تغييرَ اسمها أو أيامها أو حذفَها لاحقًا إلا مسؤول الإدارة."});
AR_PAT.push([/^Starts on (.+)$/,"تبدأ يوم $1"]);
AR_PAT.push([/^Download for the whole class \((\d+)\)$/,"تنزيل للفصل كله ($1)"],[/^Preparing (\d+) plan sheets…$/,"جارٍ تجهيز $1 من أوراق الخطة…"]);
