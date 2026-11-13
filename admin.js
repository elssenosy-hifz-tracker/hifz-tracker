// ---------- admin: school dashboard and teachers today on Today, people search, month report ----------
const adT=(en,ar)=>typeof AR!=="undefined"&&AR?ar:en;
// numbers for the school (only the schools on show when there are several)
function adStats(from,to){const act=students.filter(s=>typeof schVisible!=="function"||schVisible(classes.find(c=>c.id===s.cls)||{id:""})||!s.cls),ids=new Set(act.map(s=>s.id));
  const ses=events.filter(e=>e.type==="session"&&ids.has(e.sid)&&e.date>=from&&e.date<=to);
  const att=ses.filter(e=>e.att&&attended(e)).length,abs=ses.filter(e=>e.att==="absent").length,lines=ses.reduce((a,e)=>a+(e.hifzLines||0),0);
  const tests=events.filter(e=>e.type==="test"&&ids.has(e.sid)&&e.date>=from&&e.date<=to&&e.result==="pass");
  return {act,ids,ses,attPct:att+abs?Math.round(att*100/(att+abs)):null,pages:Math.round(lines/LINES*10)/10,tests}}
function adFollow(t){const d14=iso(addDays(t,-13)),d=iso(t);return students.filter(s=>{const mine=events.filter(e=>e.type==="session"&&e.sid===s.id);
  const abs=mine.filter(e=>e.date>=d14&&e.date<=d&&e.att==="absent").length,last=mine.filter(e=>attended(e)).sort((a,b)=>b.date.localeCompare(a.date))[0];
  return abs>=2||!last||last.date<d14}).map(s=>{const mine=events.filter(e=>e.type==="session"&&e.sid===s.id);const abs=mine.filter(e=>e.date>=d14&&e.date<=d&&e.att==="absent").length;return {s,why:abs>=2?adT(`absent ${abs} times in 2 weeks`,`غاب ${abs} مرات في أسبوعين`):adT("no recitation in 2 weeks","لم يسمّع منذ أسبوعين")}})}
function adminDashHTML(){if(typeof isAdminV!=="function"||!isAdminV()||typeof schoolOn!=="function"||!schoolOn())return "";
  const t=today(),d=iso(t),w=adStats(iso(addDays(t,-6)),d),m=adStats(d.slice(0,8)+"01",d),fol=adFollow(t),dow=t.getDay(),now=nowHM();
  const todays=classes.filter(c=>clsDays(c).includes(dow)&&(typeof schVisible!=="function"||schVisible(c)));
  const logged=c=>students.some(s=>s.cls===c.id&&events.some(e=>e.type==="session"&&e.sid===s.id&&e.date===d));
  const notLogged=todays.filter(c=>c.end&&now>c.end&&!logged(c));
  const tch=(typeof TEACHERS!=="undefined"?TEACHERS:[]).filter(x=>x.active!==false&&x.role!=="supervisor").map(x=>{const cs=todays.filter(c=>c.teacher===x.id);if(!cs.length)return null;
    const kids=students.filter(s=>cs.some(c=>c.id===s.cls)),rec=kids.filter(s=>doneToday(s.id)).length,ab=(typeof ABSENCES!=="undefined"?ABSENCES:[]).find(a=>a.tid===x.id&&a.date===d),start=cs.map(c=>c.time||"").sort()[0]||"";
    const st=ab?{k:"bad",t:ab.sub?adT(`absent · substitute: ${tName(ab.sub)}`,`غائب · البديل: ${tName(ab.sub)}`):adT("absent, no substitute","غائب، بلا بديل")}
      :kids.length&&rec>=kids.length?{k:"ok",t:adT("all recorded","سجّل الكل")}:rec?{k:"ok",t:adT(`recorded ${rec} of ${kids.length}`,`سجّل ${rec} من ${kids.length}`)}
      :start&&now>start?{k:"warn",t:adT("not started","لم يبدأ")}:{k:"plain",t:start?adT(`starts ${start}`,`يبدأ ${start}`):""};
    const ph=typeof phoneDigits==="function"?phoneDigits(x.phone):"",msg=adT(`Assalamu alaikum ${x.name}, a reminder to record today's class in Hifz Tracker. Jazakum Allahu khairan.`,`السلام عليكم ${x.name}، تذكير بتسجيل حصة اليوم في برنامج متابعة الحفظ. جزاكم الله خيرًا.`);
    return `<div class="adrow"><span><b><bdi>${esc(x.name)}</bdi></b><br><span class="small muted">${cs.map(c=>esc(c.name)+(c.time?" · "+esc(c.time):"")).join("، ")}</span></span><span class="adr"><span class="chip ${st.k}" data-noar>${esc(st.t)}</span>${st.k==="warn"&&ph?` <a class="link small" data-noar href="https://wa.me/${ph}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${adT("Remind","ذكّر")}</a>`:""}</span></div>`}).filter(Boolean);
  const tile=(l,v,k)=>`<div class="adk${k?" "+k:""}"><span data-noar>${l}</span><b>${v}</b></div>`;
  return `<div class="panel addash"><div class="head"><h3 data-noar>${adT("The school this week","المدرسة هذا الأسبوع")}</h3></div>
    <div class="adkpi">${tile(adT("Attendance","الحضور"),w.attPct==null?"—":w.attPct+"%")}${tile(adT("Pages this month","صفحات الشهر"),m.pages)}${tile(adT("Need follow-up","يحتاجون متابعة"),fol.length,fol.length?"warn":"")}${tile(adT("Classes not recorded","حصص لم تُسجَّل"),notLogged.length,notLogged.length?"bad":"")}</div>
    ${tch.length?`<b class="small" data-noar>${adT("Teachers today","المعلمون اليوم")}</b>${tch.join("")}`:""}
    ${fol.length?`<details><summary class="small" data-noar>${adT("Who needs follow-up","من يحتاج متابعة")} (${fol.length})</summary>${fol.slice(0,30).map(f=>`<div class="adrow"><button type="button" class="link" data-simgo='${JSON.stringify({name:"student",id:f.s.id})}'><bdi>${esc(f.s.name)}</bdi></button><span class="small muted" data-noar>${esc(f.why)}</span></div>`).join("")}</details>`:""}
    <div class="actions"><button type="button" class="sm" data-simgo='${JSON.stringify({name:"mrep"})}' data-noar>${adT("Month report","تقرير الشهر")}</button></div></div>`}

// people search: on the Students page an admin's search also finds teachers and groups
function peopleSearch(el,q){if(typeof isAdminV!=="function"||!isAdminV())return;let box=el.querySelector("#srchMore");if(!box){box=document.createElement("div");box.id="srchMore";const l=el.querySelector(".list")||el.lastElementChild;if(l)l.after(box);else el.append(box)}
  if(!q){box.innerHTML="";return}const T=(typeof TEACHERS!=="undefined"?TEACHERS:[]).filter(t=>String(t.name).toLowerCase().includes(q)),C=classes.filter(c=>String(c.name).toLowerCase().includes(q));
  box.innerHTML=(T.length||C.length)?`<div class="panel tight">${T.map(t=>`<div class="adrow"><span><span class="small muted" data-noar>${adT("Teacher","معلّم")}</span> <b><bdi>${esc(t.name)}</bdi></b></span><button type="button" class="sm" data-simgo='${JSON.stringify({name:"teacher",id:t.id})}' data-noar>${adT("Open","افتح")}</button></div>`).join("")}${C.map(c=>`<div class="adrow"><span><span class="small muted" data-noar>${adT("Group","مجموعة")}</span> <b><bdi>${esc(c.name)}</bdi></b></span><button type="button" class="sm" data-simgo='${JSON.stringify({name:"today",cls:c.id})}' data-noar>${adT("Open","افتح")}</button></div>`).join("")}</div>`:""}

// month report for the board or donors: one page, downloads as PDF
function renderMrep(el,sub){if(typeof isAdminV!=="function"||!isAdminV()){view={name:"reports"};return render(true)}
  const t=today(),cur=iso(t).slice(0,7),ym=view.ym||cur,[y,mo]=ym.split("-").map(Number),from=ym+"-01",last=new Date(y,mo,0),to=iso(last)<iso(t)?iso(last):iso(t);
  const prev=iso(new Date(y,mo-2,1)).slice(0,7),next=iso(new Date(y,mo,1)).slice(0,7),title=new Date(y,mo-1,1).toLocaleDateString(LOC(),{month:"long",year:"numeric"});
  const S=adStats(from,to),juzDone=new Set(S.tests.map(e=>e.sid+"|"+e.juz)).size;
  const groups=classes.filter(c=>typeof schVisible!=="function"||schVisible(c)).map(c=>{const ids=new Set(students.filter(s=>s.cls===c.id).map(s=>s.id));return {c,n:ids.size,p:Math.round(S.ses.filter(e=>ids.has(e.sid)).reduce((a,e)=>a+(e.hifzLines||0),0)/LINES*10)/10}}).filter(g=>g.n).sort((a,b)=>b.p-a.p);
  const abs=new Map();S.ses.filter(e=>e.att==="absent").forEach(e=>abs.set(e.sid,(abs.get(e.sid)||0)+1));
  const fol=students.filter(s=>(abs.get(s.id)||0)>=3).map(s=>({s,why:adT(`absent ${abs.get(s.id)} times`,`غاب ${abs.get(s.id)} مرات`)}));
  const body=`<div class="adkpi">${[[adT("Students","الطلاب"),S.act.length],[adT("Juz completed","أجزاء اكتملت"),juzDone],[adT("Juz tests passed","اختبارات ناجحة"),S.tests.length],[adT("Attendance","الحضور"),S.attPct==null?"—":S.attPct+"%"],[adT("Pages memorized","صفحات محفوظة"),S.pages]].map(([l,v])=>`<div class="adk"><span>${l}</span><b>${v}</b></div>`).join("")}</div>
    <h3>${adT("Groups by pages memorized","المجموعات حسب الصفحات المحفوظة")}</h3>${groups.map(g=>`<div class="adrow"><span><bdi>${esc(g.c.name)}</bdi> <span class="small muted">· ${adT(g.n+" students","الطلاب: "+g.n)}</span></span><b>${g.p}</b></div>`).join("")||`<p class="muted">—</p>`}
    <h3>${adT("Students who need follow-up","طلاب يحتاجون متابعة")}</h3>${fol.map(f=>`<div class="adrow"><bdi>${esc(f.s.name)}</bdi><span class="small muted">${esc(f.why)}</span></div>`).join("")||`<p class="muted">${adT("No one this month.","لا أحد هذا الشهر.")}</p>`}`;
  sub.textContent=adT("Month report","تقرير الشهر")+" · "+title;
  el.innerHTML=`${backBtn("Reports",{name:"reports"})}<div class="panel mrep" data-noar><div class="head"><h2>${adT("Month report","تقرير الشهر")} · ${esc(title)}</h2></div>
    <div class="actions"><button type="button" class="sm" data-mrym="${prev}">${adT("‹ Month before","› الشهر السابق")}</button>${ym<cur?`<button type="button" class="sm" data-mrym="${next}">${adT("Month after ›","الشهر التالي ‹")}</button>`:""}</div>
    ${body}<div class="actions"><button class="primary" id="mrDl" ${downloads?"":"hidden"}>${adT("Download PDF","حمّل PDF")}</button><span class="small muted" id="mrMsg"></span></div></div>`;
  wireBack(el);el.querySelectorAll("[data-mrym]").forEach(b=>b.onclick=()=>{view.ym=b.dataset.mrym;render(true)});
  const dl=el.querySelector("#mrDl");if(dl)dl.onclick=()=>{const ar=typeof AR!=="undefined"&&AR;saveFile(`month-report-${ym}.html`,`<!doctype html><html lang="${ar?"ar":"en"}" dir="${ar?"rtl":"ltr"}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}.adkpi{display:flex;gap:8px;flex-wrap:wrap}.adk{border:1px solid #ccc;border-radius:8px;padding:6px 10px}.adk span{display:block;font-size:12px;color:#555}.adk b{font-size:18px}.adrow{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:4px 0}</style></head><body><h1>${adT("Month report","تقرير الشهر")} · ${esc(title)}</h1>${body}</body></html>`,el.querySelector("#mrMsg"))}}
(()=>{const st=document.createElement("style");st.textContent=`.adkpi{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.adk{background:var(--bg);border-radius:10px;padding:6px 10px}.adk span{display:block;font-size:12px;color:var(--muted)}.adk b{font-size:20px}.adk.warn b{color:var(--warn)}.adk.bad b{color:var(--bad)}
.adrow{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)}.adr{text-align:end}.addash summary{cursor:pointer;margin-top:4px}.chip.plain{background:var(--accent-soft);color:var(--accent)}.chip.warn{background:var(--warn-soft);color:var(--warn)}.chip.bad{background:var(--bad-soft);color:var(--bad)}.chip.ok{background:var(--ok-soft);color:var(--ok)}`;document.head.appendChild(st)})();
