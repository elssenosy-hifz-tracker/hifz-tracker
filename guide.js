// ---------- grading rules and help for a substitute teacher ----------
const GRADING_DEF={vg:1,g:2,p:3,teacher:"Ahmed",
  def:"Count as one mistake: a wrong word, a missed word or line, an added word, a wrong vowel that changes the meaning, or anything the student cannot correct alone after one prompt. A hesitation that the student corrects alone is not a mistake.",
  notes:""};
const GRD=()=>({...GRADING_DEF,...((settings.main||{}).grading||{})});
const teacherName=()=>GRD().teacher||"Teacher";
// grade from mistakes and lines recited: mistakes per page against the teacher's limits
function gradeFor(m,lines){const g=GRD();m=Number(m)||0;if(!(lines>0))return null;const r=m/Math.max(0.5,lines/LINES);
  return r===0?"Excellent":r<=g.vg?"Very good":r<=g.g?"Good":r<=g.p?"Pass":"Repeat"}
const gradeScale=()=>{const g=GRD();return [["Excellent","No mistakes"],["Very good",`Up to ${g.vg} per page`],["Good",`Up to ${g.g} per page`],["Pass",`Up to ${g.p} per page`],["Repeat",`More than ${g.p} per page: recite it again next time, and lower the new amount until it settles`]]};
const SESSION_STEPS=["Mark attendance. If the student is late, the arrival time fills in by itself.",
  "Last week's homework: tick Done or Not done.",
  "New hifz: the student recites today's portion from memory (shown under \"Recited\"). Count the mistakes and type the number. The grade fills in by itself.",
  "Review: the surahs are already filled from today's plan. The student recites them; type the mistakes next to each surah. The grade fills in by itself.",
  "Tick any behaviour you saw, write a short note if needed, then Save."];
const TYPE_GUIDE={
  session:SESSION_STEPS,
  test:["Pick the juz (the one waiting for its test is already chosen).","The student recites the whole juz from memory. Then open 5 random places in it: read the start of an ayah and the student continues.","Count every mistake. 1 mistake or fewer = Passed, more = Not passed (the result fills in by itself).","If not passed, the juz stays in the near review for one more week and is tested again."],
  monthly:["Five places are picked at random from everything the student has memorized.","Read the start of each ayah; the student continues and says the surah name.","Tick the ones recited well. Fewer than 4 of 5 means that area needs extra far review this month."],
  consol:["Use this when the student has finished a consolidation week (no new hifz, the last five juz reviewed)."],
  emergency:["Emergency day: near review only. The far review moves to the next day."],
  makeup:["Makeup day for a missed day."],
  note:["Write a note for the teacher. It is saved on the student's page."]};
function guideBox(){const g=GRD();return `<details class="guide" id="g_box"><summary>Guide: how to test and grade${g.notes?" · includes notes from "+esc(teacherName()):""}</summary>
  <ol id="g_steps"></ol>
  <p class="small"><b>What counts as a mistake:</b> ${esc(g.def)}</p>
  <p class="small"><b>Grades</b> (mistakes per page): ${gradeScale().slice(0,4).map(([a,b])=>`${a}: ${b.toLowerCase()}`).join(" · ")} · Repeat: more than ${g.p}.</p>
  ${g.notes?`<p class="small note"><b>Notes from ${esc(teacherName())}:</b> ${esc(g.notes)}</p>`:""}
  <button type="button" class="link small" id="g_full">Full grading rules</button></details>`}
const lastBy=()=>{const tb=typeof lastByTeacher==="function"&&lastByTeacher();if(tb)return tb;try{return localStorage.getItem("hifz_by")||teacherName()}catch(_){return teacherName()}};
const saveBy=v=>{try{localStorage.setItem("hifz_by",v)}catch(_){}};
const byNames=()=>[...new Set([teacherName(),...events.map(e=>e.by).filter(Boolean)])];
const byText=e=>e.by&&e.by!==teacherName()?` <span class="chip plain">by ${esc(e.by)}</span>`:"";

// wire auto grades, the guide and help into the session form
function wireGuide(f,st,hRows,rRows){
  const typ=f.querySelector("#s_type"),hs=f.querySelector("#s_hifz"),rt=f.querySelector("#s_rt");
  const steps=()=>{f.querySelector("#g_steps").innerHTML=(TYPE_GUIDE[typ.value]||[]).map(s=>`<li>${esc(s)}</li>`).join("")};
  f.querySelector("#g_full").onclick=()=>{busy=false;go({name:"grading",back:{name:"session",id:st.id}})};
  const man={};["s_hg","s_rg","t_res"].forEach(id=>{const s=f.querySelector("#"+id);s.addEventListener("change",ev=>{if(ev.isTrusted)man[id]=true;upd()})});
  const set=(id,val,txt)=>{const s=f.querySelector("#"+id),x=f.querySelector("#"+id+"x");if(val&&!man[id])s.value=val;if(x)x.textContent=txt||""};
  const upd=()=>{
    const hl=hs.value==="custom"?hRows.reduce((t,r)=>t+rowLines(r),0):Math.max(0,Number(hs.value)-st.pos);
    const hm=Number(f.querySelector("#s_hm").value)||0,hg=gradeFor(hm,hl);
    set("s_hg",hg,hg?`${man.s_hg?"Suggested":"Auto"}: ${hm} in ${pagesOf(hl)} p → ${hg}`:"");
    const rl=rt.value==="none"?0:rRows.filter(r=>!r.skip&&!r.buddy).reduce((t,r)=>t+rowLines(r),0),rm=Number(f.querySelector("#s_rm").value)||0,rg=gradeFor(rm,rl);
    set("s_rg",rg,rg?`${man.s_rg?"Suggested":"Auto"}: ${rm} in ${pagesOf(rl)} p → ${rg}`:"");
    const tm=Number(f.querySelector("#t_m").value)||0;set("t_res",tm<=1?"pass":"fail",`${man.t_res?"Suggested":"Auto"}: ${tm<=1?"Passed":"Not passed"} (pass = 1 mistake or fewer)`);
    steps()};
  f.addEventListener("input",upd);f.addEventListener("change",upd);typ.addEventListener("change",upd);upd();
}

// ---------- "How we grade" page ----------
function gradingHTML(){const g=GRD(),P=PTS();
  return `<h2>Steps in a normal session</h2><ol>${SESSION_STEPS.map(s=>`<li>${esc(s)}</li>`).join("")}</ol>
  <h2>What counts as a mistake</h2><p>${esc(g.def)}</p>
  <h2>Grades for new hifz and review</h2><p>The grade comes from the mistakes per page recited, so a long portion is not judged more harshly than a short one.</p>
  <table><tr><th>Grade</th><th>Mistakes</th></tr>${gradeScale().map(([a,b])=>`<tr><td><b>${a}</b></td><td>${esc(b)}</td></tr>`).join("")}</table>
  <h2>Juz test</h2><ul>${TYPE_GUIDE.test.slice(1).map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
  <h2>Monthly random test</h2><ul>${TYPE_GUIDE.monthly.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>
  <h2>Review plan</h2><ul><li>Near review: the last 10 hifz days, every day.</li><li>Far review: everything older, split over the student's review cycle (3 to 15 days, chosen in the student's details; 7 by default).</li><li>Mistakes tapped on the mushaf are saved to the student's page and shown in the mistakes notebook.</li></ul>
  <h2>Points</h2>${PTS_GROUPS.map(([gn,items])=>`<p><b>${esc(gn)}:</b> ${items.map(([k,l])=>`${esc(l)} ${sgn(P[k])}`).join(" · ")}</p>`).join("")}
  ${g.notes?`<h2>Notes from ${esc(teacherName())}</h2><p>${esc(g.notes)}</p>`:""}`}
function renderGrading(el,sub){const g=GRD(),back=view.back||{name:"list"};sub.textContent="How we grade";
  el.innerHTML=`${backBtn(back.name==="session"?"Back to the session":"All students",back)}
  <div class="panel"><div class="head"><h2>How we grade</h2><button class="primary" id="gr_dl" ${downloads?"":"hidden"}>Download PDF</button></div><span class="small muted" id="gr_msg"></span>
    <div class="report">${gradingHTML()}</div></div>
  <form class="panel" id="grForm"><h3>Change the rules</h3>
    <div class="fields"><label>Teacher's name<input id="gr_t" value="${esc(g.teacher)}"></label>
      <label>Very good: up to … per page<input type="number" step="0.5" min="0" id="gr_vg" value="${g.vg}"></label>
      <label>Good: up to … per page<input type="number" step="0.5" min="0" id="gr_g" value="${g.g}"></label>
      <label>Pass: up to … per page<input type="number" step="0.5" min="0" id="gr_p" value="${g.p}"></label></div>
    <label>What counts as a mistake<textarea id="gr_def" rows="3">${esc(g.def)}</textarea></label>
    <label>Notes for a substitute teacher (shown in the session guide)<textarea id="gr_n" rows="3" placeholder="e.g. Omar needs more time on Al-Mulk; be gentle with the new students">${esc(g.notes)}</textarea></label>
    <div class="actions"><button class="primary" type="submit">Save rules</button><button type="button" id="gr_reset">Back to defaults</button><span class="small muted" id="gr_m"></span></div></form>`;
  wireBack(el);const f=el.querySelector("#grForm");trackForm(f);
  el.querySelector("#gr_dl").onclick=()=>saveFile(`how-we-grade-${iso(today())}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>How we grade</title><style>${PRINT_CSS}</style></head><body><h1>How we grade</h1><p class="muted">${esc(teacherName())}'s hifz class · ${fmt(today())} ${today().getFullYear()}</p>${gradingHTML()}</body></html>`,el.querySelector("#gr_msg"));
  const save=async gr=>{try{await db.doc("settings/main").set({...(settings.main||{}),grading:gr});busy=false;render(true)}catch(_){el.querySelector("#gr_m").textContent="Not saved. Try again."}};
  f.onsubmit=e=>{e.preventDefault();const n=id=>Math.max(0,Number(f.querySelector(id).value)||0);let vg=n("#gr_vg"),gg=n("#gr_g"),p=n("#gr_p");
    if(!(vg<=gg&&gg<=p)){el.querySelector("#gr_m").textContent="Very good ≤ Good ≤ Pass, please.";return}
    save({teacher:f.querySelector("#gr_t").value.trim()||"Teacher",vg,g:gg,p,def:f.querySelector("#gr_def").value.trim()||GRADING_DEF.def,notes:f.querySelector("#gr_n").value.trim()})};
  el.querySelector("#gr_reset").onclick=()=>save({...GRADING_DEF,teacher:g.teacher,notes:g.notes})}
