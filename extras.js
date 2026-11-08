// ---------- extras: parent message, repeated mistakes, morning alerts, certificates, full backup, archive, substitute mode ----------
let SUB=true; // true when the viewer is a substitute (Contributor): records sessions, never edits or deletes
document.body.classList.add("sub");
async function detectRole(k=0){try{const u=await claude.use("user");if(u&&typeof u.canEdit==="function"){const ce=await u.canEdit();SUB=ce===false;document.body.classList.toggle("sub",SUB);render();return}throw 0}catch(e){if(k<3)setTimeout(()=>detectRole(k+1),2000);else{SUB=false;document.body.classList.remove("sub");render()}}}

// ----- 1. weekly message for parents -----
const phoneDigits=s=>String(s||"").replace(/[^\d]/g,"");
function parentMsg(st,from,to){
  useOrder(st);const g=GRD();
  const evs=events.filter(e=>e.sid===st.id&&e.date>=from&&e.date<=to);
  const ses=evs.filter(e=>e.type==="session").sort((a,b)=>a.date.localeCompare(b.date));
  const att=ses.filter(attended),late=ses.filter(e=>e.att==="late").length,abs=ses.filter(e=>e.att==="absent").length,exc=ses.filter(e=>e.att==="excused").length;
  const hl=ses.reduce((t,e)=>t+(Number(e.hifzLines)||0),0);
  const revL=e=>(e.revRows||[]).reduce((t,r)=>t+rowLines(r),0),rl=ses.reduce((t,e)=>t+revL(e),0);
  const hm=ses.reduce((t,e)=>t+(Number(e.hifzMist)||0),0),rm=ses.reduce((t,e)=>t+(Number(e.revMist)||0),0);
  const hifzParts=ses.filter(e=>Number(e.hifzLines)>0&&((e.hifzRows&&e.hifzRows.length)||e.hifzText)).map(e=>e.hifzRows&&e.hifzRows.length?rowsText(e.hifzRows):e.hifzText);
  const grades=ses.map(e=>gradeEn(e.hifzGrade)).filter(Boolean);
  const hw=ses.filter(e=>e.hw!=null),hwDone=hw.filter(e=>e.hw).length;
  const nr=ses.filter(e=>e.hifzNR).length+ses.filter(e=>e.revNR).length;
  const tests=evs.filter(e=>e.type==="test"),pts=evs.reduce((t,e)=>t+ptsOf(e),0);
  const notes=ses.filter(e=>e.note).map(e=>e.note);const lastNote=notes[notes.length-1];
  const pct=Math.round((st.pos+PREV_LINES)/ALL*1000)/10,cj=currentJuz(st.pos);
  const plan=weekPlan(st,addDays(today(),1),7).filter(d=>d.isHifz&&d.neu&&!/Paused/.test(d.neu));
  const goal=plan.length?`${plan.length} hifz ${plan.length===1?"day":"days"}, up to ${(()=>{const la=lastAyahOf(plan[plan.length-1].end);return la?pieceText({...la,a1:la.a2}):""})()}`:"";
  const L=[];
  L.push(`Assalamu alaikum. Here is ${st.name}'s update for ${fmtShort(from)} – ${fmtShort(to)}:`);L.push("");
  if(ses.length)L.push(`• Attendance: ${att.length} of ${ses.length} ${ses.length===1?"class":"classes"}${late?` (${late} late)`:""}${ses.filter(e=>e.left).length?`, left early ${ses.filter(e=>e.left).length}×`:""}${abs?`, ${abs} absent`:""}${exc?`, ${exc} excused`:""}`);
  else L.push("• No classes recorded in this period.");
  if(hl>0)L.push(`• New hifz: ${pagesOf(hl)} ${pagesOf(hl)===1?"page":"pages"}${hifzParts.length?` (${hifzParts.join("; ")})`:""}, ${hm} ${hm===1?"mistake":"mistakes"}`);
  else if(ses.length)L.push("• New hifz: none recited this period.");
  if(rl>0)L.push(`• Review: ${pagesOf(rl)} ${pagesOf(rl)===1?"page":"pages"}, ${rm} ${rm===1?"mistake":"mistakes"}`);
  if(grades.length)L.push(`• Grades: ${grades.join(", ")}`);
  if(hw.length)L.push(`• Homework done: ${hwDone} of ${hw.length}`);
  if(nr)L.push(`• Came not ready to recite: ${nr} ${nr===1?"time":"times"}. Please help with practice at home.`);
  for(const t of tests)L.push(`• Juz ${t.juz} test: ${t.result==="pass"?"passed":"not passed yet"}${t.mistakes!=null?` (${t.mistakes} ${t.mistakes===1?"mistake":"mistakes"})`:""}`);
  {const sk=streakOf(st);if(sk.cur>=2)L.push(`• Came ready ${sk.cur} classes in a row (best ${sk.best})`)}
  L.push(`• Points: ${pts>=0?"+":""}${pts} this period, ${ptsSum(st.id)} in total`);
  L.push(`• Memorized so far: ${pagesOf(st.pos+PREV_LINES)} of 604 pages (${pct}%)${cj?`, now in juz ${cj}`:", the whole Quran"}`);
  const rep=errorBook(st).filter(r=>r.count>=2&&!r.fixed).slice(0,4);
  if(rep.length)L.push(`• Places to practise at home: ${rep.map(errPlace).join(", ")}`);
  if(goal)L.push(`• Goal for next week: ${goal}`);
  if(lastNote)L.push(`• Teacher's note: ${lastNote}`);
  L.push("");L.push(`Jazakum Allahu khairan. ${g.teacher||""}`.trim());
  return L.join("\n");
}
function renderParentMsg(el,sub,st){
  const t=iso(today());view.from=view.from||iso(addDays(today(),-6));view.to=view.to||t;
  sub.textContent="Message for parents · "+st.name;
  const msg=parentMsg(st,view.from,view.to),ph=phoneDigits(st.phone);
  const wa=`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`;
  el.innerHTML=`${backBtn(st.name,{name:"student",id:st.id})}
  <div class="panel">
    <h3>Weekly message for parents</h3>
    <div class="fields"><label>From<input type="date" id="pm_from" value="${view.from}"></label><label>To<input type="date" id="pm_to" value="${view.to}"></label></div>
    <div class="filters"><button type="button" class="fbtn" data-pf="${iso(addDays(today(),-6))}">Last 7 days</button><button type="button" class="fbtn" data-pf="${iso(addDays(today(),-13))}">Last 2 weeks</button><button type="button" class="fbtn" data-pf="${t.slice(0,8)}01">This month</button></div>
    <label class="lbl small muted" for="pm_txt">You can change the text before sending</label>
    <textarea id="pm_txt" rows="16" dir="auto" style="width:100%;font:inherit;line-height:1.5">${esc(msg)}</textarea>
    <div class="actions"><button class="primary" id="pm_copy">Copy message</button><button id="pm_card" ${downloads?"":"hidden"}>Download progress card (PDF)</button><a class="btn" id="pm_wa" href="${wa}" target="_blank" rel="noopener">Open in WhatsApp</a><span class="small muted" id="pm_msg"></span></div>
    <p class="note">${ph?`WhatsApp opens a chat with ${esc(st.phone)}.`:`No parent number saved yet, so WhatsApp asks you to pick the chat. Add the number in "Edit details".`} If WhatsApp does not open, tap "Copy message" and paste it in the chat.</p>
  </div>`;
  wireBack(el);wireParentCard(el,st);
  const txt=el.querySelector("#pm_txt"),a=el.querySelector("#pm_wa");
  txt.oninput=()=>{busy=true;a.href=`https://wa.me/${ph}?text=${encodeURIComponent(txt.value)}`};
  const setR=(f,to)=>{busy=false;view={...view,from:f,to:to||view.to};render(true)};
  el.querySelector("#pm_from").onchange=e=>setR(e.target.value);el.querySelector("#pm_to").onchange=e=>setR(view.from,e.target.value);
  el.querySelectorAll("[data-pf]").forEach(b=>b.onclick=()=>setR(b.dataset.pf,t));
  el.querySelector("#pm_copy").onclick=async()=>{const m=el.querySelector("#pm_msg");try{await navigator.clipboard.writeText(txt.value);m.textContent="Copied. Paste it in WhatsApp."}catch(e){txt.select();try{document.execCommand("copy");m.textContent="Copied. Paste it in WhatsApp."}catch(_){m.textContent="Select the text and copy it."}}};
}

// ----- 2. repeated mistakes go into today's review -----
function repeatList(st,n=6){return errorBook(st).filter(r=>r.count>=2&&!r.fixed).slice(0,n)}
function repeatTask(st){const r=repeatList(st);if(!r.length)return `<div class="task rep"><span class="k">Repeated mistakes · go over before the review</span><span class="v muted small">None yet. A place shows here once it goes wrong twice.</span></div>`;
  return `<div class="task rep"><span class="k">Repeated mistakes · go over before the review</span><span class="v">${r.map(x=>`${errPlace(x)} <span class="muted small">×${x.count}</span>`).join(", ")}</span></div>`}

// ----- 3. morning alerts on the main page -----
function behindPlan(st){
  const t=today(),from=addDays(t,-14),start=st.start?parse(st.start):from;
  if(daysBetween(start,t)<14)return null;
  let n=0;for(let d=from;d<t;d=addDays(d,1)){if(!(st.days||[]).includes(d.getDay()))continue;const b=breakFor(st,d);if(b&&b.mode!=="half")continue;n++}
  if(n<3)return null;
  useOrder(st);const p0=posAt(st,iso(from));if(p0>=TOTAL-0.5)return null;
  const exp=stEnd(p0,st.amount,n)-p0,got=(Number(st.pos)||0)-p0;
  if(exp<=0||got>=exp*0.5)return null;
  return {got:pagesOf(got),exp:pagesOf(exp)}}
function alertsFor(st){
  useOrder(st);const out=[],s=status(st,events),ses=s.sessions;
  if(ses.length>=2&&ses[0].att==="absent"&&ses[1].att==="absent"){let k=0;while(k<ses.length&&ses[k].att==="absent")k++;out.push([0,"bad",`Absent ${k} classes in a row`])}
  const nr=ses.filter(e=>daysBetween(parse(e.date),today())<14&&(e.hifzNR||e.revNR)).length;
  if(nr>=2)out.push([1,"warn",`Not ready ${nr} times in 2 weeks`]);
  const bp=behindPlan(st);if(bp)out.push([1,"warn",`Behind plan: ${bp.got} of ${bp.exp} pages in 2 weeks`]);
  if(s.untested.length)out.push([2,"info",`Juz ${s.untested[0]} test due`]);
  else{const cj=currentJuz(st.pos);if(cj&&!breakFor(st,today())){const e3=stEnd(st.pos,st.amount,3);if(juzDoneList(e3).includes(cj))out.push([2,"info",`Juz ${cj} finishes within 3 hifz days: prepare its test`])}}
  if(monthlyDue(st,s.mine))out.push([2,"info","Monthly test due"]);
  out.push(...extraAlerts(st));
  return out}
function alertsPanel(list){
  const rows=[];for(const st of list)for(const a of alertsFor(st))rows.push({st,a});
  const last=(settings.main||{}).lastBackup,bk=!SUB&&(!last||daysBetween(parse(last),today())>=14);
  const cw=classWeakAlerts(list);
  if(!rows.length&&!bk&&!cw.length)return `<div class="panel tight alerts"><span class="chip ok">No alerts today</span> <span class="small muted">Everyone is on plan.</span></div>`;
  rows.sort((x,y)=>x.a[0]-y.a[0]||String(x.st.name).localeCompare(String(y.st.name)));
  let open=true;try{open=localStorage.getItem("hifz.alerts")==="1"}catch(e){}
  return `<details class="panel tight alerts" id="alertsBox" ${open?"open":""}><summary><b>Today's alerts</b> <span class="small muted">${rows.length+cw.length} ${rows.length+cw.length===1?"alert":"alerts"}</span></summary>
    <ul class="alist">${rows.map(({st,a})=>`<li><button class="link" data-al="${st.id}">${esc(st.name)}</button> <span class="chip ${a[1]}">${a[2]}</span></li>`).join("")}
    ${cw.map(x=>`<li><span class="chip info">${esc(x.cls?x.cls.name:"Class")}</span> <b>${esc(SURAH_NAMES[x.s])}</b> is weak for ${x.names.length} students (${x.names.map(esc).join(", ")}): review it together?</li>`).join("")}
    ${bk?`<li><button class="link" data-albk="1">Backup</button> <span class="chip warn">${last?`Last full backup ${daysBetween(parse(last),today())} days ago`:"No full backup yet"}</span></li>`:""}</ul></details>`}
function wireAlerts(el){
  el.querySelectorAll("[data-al]").forEach(b=>b.onclick=()=>go({name:"student",id:b.dataset.al}));
  const bk=el.querySelector("[data-albk]");if(bk)bk.onclick=()=>go({name:"classes"});
  const d=el.querySelector("#alertsBox");if(d)d.addEventListener("toggle",()=>{try{localStorage.setItem("hifz.alerts",d.open?"1":"0")}catch(e){}})}

// ----- 4. juz certificates -----
function certPanel(st){
  const passed=events.filter(e=>e.sid===st.id&&e.type==="test"&&e.result==="pass").sort((a,b)=>b.date.localeCompare(a.date));
  if(!passed.length)return `<div class="panel" id="certPanel"><div class="head"><h3>Certificates</h3><span class="small muted">0 juz passed</span></div><p class="small muted">No juz test recorded yet. When the student passes a juz test (Record session, then choose "Juz test" and "Passed"), the certificate for that juz appears here to download.</p></div>`;
  if(!downloads)return "";
  const seen=new Set(),list=passed.filter(e=>!seen.has(e.juz)&&seen.add(e.juz));
  const fresh=list.filter(e=>daysBetween(parse(e.date),today())<=14);
  return `<div class="panel" id="certPanel"><div class="head"><h3>Certificates</h3><span class="small muted">${list.length} juz passed</span></div>
    ${fresh.length?`<div class="banner ok">Juz ${fresh.map(e=>e.juz).join(", ")} passed recently. Download the certificate to print or send to the parents.</div>`:""}
    <div class="chips">${list.map(e=>`<button class="chip plain certbtn" data-cert="${e.id}">Juz ${e.juz} · ${fmtShort(e.date)}</button>`).join("")}</div>
    <p class="small muted cmsg"></p></div>`}
function juzCertificate(st,e){const g=GRD(),c=clsName(st.cls);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Certificate - ${esc(st.name)}</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#14302b}
  .c{box-sizing:border-box;width:100%;height:196mm;padding:7mm;display:flex;background:#fbf8f0}.b{flex:1;position:relative;border:4px double #0d6b5e;outline:2px solid #b08a3e;outline-offset:-12px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:16mm 22mm}
  .orn{position:absolute;width:22mm;height:22mm;border:2px solid #b08a3e;transform:rotate(45deg)}.orn.tl{top:9mm;left:9mm}.orn.tr{top:9mm;right:9mm}.orn.bl{bottom:9mm;left:9mm}.orn.br{bottom:9mm;right:9mm}
  .ar{font-size:30px;color:#0d6b5e;margin:0;display:flex;gap:12px;flex-direction:row}.k{letter-spacing:.3em;text-transform:uppercase;font-size:13px;color:#b08a3e}h1{font-size:44px;margin:2px 0;font-weight:normal;color:#0d6b5e}
  .n{font-size:36px;margin:4px 0;border-bottom:1px solid #b08a3e;padding:0 30px 6px}.l{font-size:18px;max-width:200mm;line-height:1.5;margin:0}.s{font-size:14px;color:#555;margin:0}
  .f{display:flex;gap:50mm;margin-top:14mm;font-size:13px}.f div{border-top:1px solid #14302b;padding-top:4px;min-width:55mm}</style></head>
  <body><div class="c"><div class="b"><span class="orn tl"></span><span class="orn tr"></span><span class="orn bl"></span><span class="orn br"></span>
  <p class="ar" dir="rtl"><span>بارك</span><span>الله</span><span>فيك</span></p><div class="k">Certificate of achievement</div><h1>Juz ${e.juz}</h1><p class="l">This certifies that</p><div class="n">${esc(st.name)}</div>
  <p class="l">has recited Juz ${e.juz} of the Noble Quran from memory and passed its test${e.mistakes!=null?` with ${e.mistakes} ${e.mistakes===1?"mistake":"mistakes"}`:""}.</p>
  <p class="s">${fmt(parse(e.date))} ${parse(e.date).getFullYear()}${c?` · ${esc(c)}`:""} · ${pagesOf(st.pos+PREV_LINES)} pages memorized so far</p>
  <div class="f"><div>${esc(g.teacher||"Teacher")}</div><div>Parent</div></div></div></div></body></html>`}

// ----- 5. full backup and restore -----
let bkFlash="";
const BK_COLLS=["students","events","classes","meetings","breaks","marks","settings","schedule","fees","teachers","access","absences","groupnotes","requests","waiting","links","schools","hours"];
function backupJson(){const pack=(arr)=>Object.fromEntries(arr.map(({id,...d})=>[id,d]));
  return JSON.stringify({app:"hifz-tracker",v:1,date:iso(today()),data:{students:pack(allStudents),events:pack(events),classes:pack(classes),meetings:pack(meetings),breaks:pack(breaks),marks:pack(marks),schedule:pack(schedule),fees:pack(fees),settings:settings,teachers:pack(TEACHERS),access:pack(ACCESS),absences:pack(ABSENCES),requests:pack(REQS),waiting:pack(WAITING),groupnotes:GNOTES_PACK(),links:LINKS_PACK(),schools:pack(SCHOOLS),hours:pack(HOURS)}},null,1)}
function backupPanel(){const last=(settings.main||{}).lastBackup;
  return `<div class="panel" id="bkPanel"><h3>Backup</h3>
    <p class="small muted">${last?`Last full backup: ${fmt(parse(last))}.`:"No full backup yet."} Download one every week or two and keep it on your phone or in Google Drive.</p>
    <div class="actions"><button class="primary" id="jsonBtn" ${downloads?"":"hidden"}>Download full backup</button><button id="xlsBtn" ${downloads?"":"hidden"}>Download Excel copy</button><span class="small muted" id="x_msg">${bkFlash}</span></div>
    <p class="small muted">The full backup is one file with everything (students, sessions, mushaf marks, class logs, holidays, settings) and can be loaded back. The Excel copy is for reading only.</p>
    <details><summary class="small">Restore from a backup file</summary>
      <p class="small muted">Puts every record from the file back. Records added after the backup stay as they are; records in the file replace the current ones with the same id.</p>
      <div class="actions"><input type="file" id="rsFile" accept=".json,application/json"><button id="rsBtn" disabled>Restore</button><span class="small muted" id="rs_msg"></span></div></details></div>`}
function wireBackup(el){
  const m=el.querySelector("#x_msg");
  el.querySelector("#xlsBtn").onclick=()=>saveFile(`hifz-backup-${iso(today())}.xls`,backupXls(),m);
  el.querySelector("#jsonBtn").onclick=async()=>{if(!downloads)return;if(!allReady()){m.textContent="Still loading all records. Wait a few seconds and try again.";return}try{await downloads.save({filename:`hifz-full-backup-${iso(today())}.json`,data:new Blob([backupJson()],{type:"application/json"})});bkFlash="Saved. Keep the file somewhere safe.";m.textContent=bkFlash;try{await db.doc("settings/main").update({lastBackup:iso(today())})}catch(_){try{await db.doc("settings/main").set({...(settings.main||{}),lastBackup:iso(today())})}catch(__){}}}catch(e){m.textContent=e&&e.code==="declined"?"":"Download failed. Try again."}};
  const f=el.querySelector("#rsFile"),b=el.querySelector("#rsBtn"),rm=el.querySelector("#rs_msg");let pack=null;
  f.onchange=async()=>{busy=true;pack=null;b.disabled=true;rm.textContent="";const file=f.files[0];if(!file)return;
    try{const j=JSON.parse(await file.text());if(j.app!=="hifz-tracker"||!j.data)throw 0;pack=j;const n=BK_COLLS.reduce((t,c)=>t+Object.keys(j.data[c]||{}).length,0);
      rm.textContent=`Backup from ${j.date}: ${Object.keys(j.data.students||{}).length} students, ${Object.keys(j.data.events||{}).length} records, ${n} items in all.`;b.disabled=false}
    catch(e){rm.textContent="This is not a Hifz Tracker backup file."}};
  b.onclick=async()=>{if(!pack)return;if(b.dataset.confirm!=="1"){b.dataset.confirm="1";b.textContent="Tap again to restore";return}
    if(!allReady()){rm.textContent="Still loading all records. Wait a few seconds and try again.";return}
    if(downloads&&!b.dataset.safe){rm.textContent="First saving a safety copy of the current data…";try{await downloads.save({filename:`hifz-before-restore-${iso(today())}.json`,data:new Blob([backupJson()],{type:"application/json"})});b.dataset.safe="1"}catch(e){rm.textContent="The safety copy was not saved, so nothing was restored. Allow the download and tap Restore again.";b.dataset.confirm="";b.textContent="Restore";return}}
    b.disabled=true;let done=0,fail=0;const all=BK_COLLS.flatMap(c=>Object.entries(pack.data[c]||{}).map(([id,d])=>[c,id,d]));
    for(const[c,id,d]of all){try{await db.doc(c+"/"+id).set(d);done++}catch(e){fail++}if((done+fail)%20===0)rm.textContent=`Restoring… ${done+fail} of ${all.length}`}
    rm.textContent=fail?`Restored ${done} items; ${fail} could not be written.`:`Restored all ${done} items.`;bkFlash=rm.textContent;b.textContent="Restore";b.dataset.confirm="";busy=false}}

// ----- 6. archive -----
async function setArchived(st,on){try{if(on)await db.doc("students/"+st.id).update({archived:iso(today())});else{const{id,archived,...rest}=allStudents.find(s=>s.id===st.id)||st;await db.doc("students/"+st.id).set(rest)}}catch(e){}}
function archivedList(el,sub,ta){
  const arch=allStudents.filter(s=>s.archived).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  return `<div class="panel"><h3>Archived students</h3><p class="small muted">They are hidden from the lists, class logs and reports. Their history is kept. Restore a student to bring them back.</p>
    <div class="list">${arch.map(st=>`<div class="row arch"><span class="name">${esc(st.name)}</span><span class="meta">${clsName(st.cls)?esc(clsName(st.cls))+" · ":""}archived ${fmtShort(st.archived)} · ${(()=>{useOrder(st);return pagesOf((Number(st.pos)||0)+PREV_LINES)})()} p memorized</span>
      <span class="att"><button data-open="${st.id}">Open</button><button class="primary adminonly" data-unarch="${st.id}">Restore</button></span></div>`).join("")||'<p class="muted">No archived students.</p>'}</div></div>`}
function wireArchived(el){
  el.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>go({name:"student",id:b.dataset.open}));
  el.querySelectorAll("[data-unarch]").forEach(b=>b.onclick=async()=>{const st=allStudents.find(s=>s.id===b.dataset.unarch);if(st)await setArchived(st,false)})}

// ----- 7. substitute mode banner -----
const subBanner=()=>SUB&&typeof schoolBanner==="function"&&schoolBanner()?schoolBanner():SUB?`<div class="banner info">Substitute mode: you can mark attendance, record sessions and fill in the class log. Only ${esc(GRD().teacher||"the teacher")} can change student details or delete anything.</div>`:"";
