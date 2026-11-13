// ---------- class tools: quick attendance, end-of-class summary, parent messages for a whole class ----------
// Quick attendance: one screen with every student of the group; a tap moves on time → late → absent → excused; one Save.
// It writes the same attendance records as the Today page (events, type "session", id a_<sid>_<date> when new).
let ROLL=null;
const ROLL_A=["present","late","absent","excused"],ROLL_L={present:"On time",late:"Late",absent:"Absent",excused:"Excused"};
function rollEv(sid,d){return events.filter(e=>e.type==="session"&&e.sid===sid&&e.date===d).sort((a,b)=>(b.t||0)-(a.t||0))[0]}
async function rollSave(st,d,att){const ex=rollEv(st.id,d),hm=d===iso(today())?nowHM():"",arr=(att==="present"||att==="late")&&hm?{arr:hm}:{};
  if(ex)await db.doc("events/"+ex.id).update({att,...(ex.arr?{}:arr)});
  else await db.doc("events/a_"+st.id+"_"+d).set({sid:st.id,type:"session",date:d,att,...arr,t:Date.now(),hifzLines:0,hifzMist:0,revMist:0,...stampRec()})}
function renderRoll(el,sub){const c=classes.find(x=>x.id===view.id);if(!c||(typeof canEditCls==="function"&&!canEditCls(c.id))){view={name:"today"};return render(true)}
  const d=view.date||iso(today()),kids=classOrder(c.id);sub.textContent="Quick attendance · "+c.name;
  if(!ROLL||ROLL.cid!==c.id||ROLL.d!==d){ROLL={cid:c.id,d,st:{}};for(const s of kids){const e=rollEv(s.id,d);if(e&&e.att)ROLL.st[s.id]=e.att}ROLL.orig={...ROLL.st}}
  const cnt=k=>kids.filter(s=>ROLL.st[s.id]===k).length,changed=kids.filter(s=>ROLL.st[s.id]&&ROLL.st[s.id]!==ROLL.orig[s.id]).length;
  el.innerHTML=`${backBtn("Today",{name:"today",cls:c.id})}<div class="panel"><h2>Quick attendance · <bdi>${esc(c.name)}</bdi></h2>
    <p class="small muted">Tap a name to change it: on time → late → absent → excused.</p>
    <div class="rollg">${kids.map(s=>{const a=ROLL.st[s.id]||"";return `<button type="button" class="rollt ${a}" data-roll="${s.id}"><b><bdi>${esc(s.name)}</bdi></b><span>${a?ROLL_L[a]:"—"}</span></button>`}).join("")||'<p class="muted">No students in this group yet.</p>'}</div>
    <div class="actions"><button type="button" class="sm" id="rollAll">All others on time</button></div>
    <p class="small rollc">${ROLL_A.map(k=>`<span class="chip roll-${k}">${ROLL_L[k]}: ${cnt(k)}</span>`).join(" ")}</p>
    <div class="actions"><button class="primary" id="rollSave" ${changed?"":"disabled"}>Save attendance</button><span class="small muted" id="rollMsg"></span></div></div>`;
  wireBack(el);
  el.querySelectorAll("[data-roll]").forEach(b=>b.onclick=()=>{const id=b.dataset.roll,a=ROLL.st[id]||"";ROLL.st[id]=ROLL_A[(ROLL_A.indexOf(a)+1)%ROLL_A.length];busy=true;render(true)});
  el.querySelector("#rollAll").onclick=()=>{for(const s of kids)if(!ROLL.st[s.id])ROLL.st[s.id]="present";busy=true;render(true)};
  el.querySelector("#rollSave").onclick=async()=>{const m=el.querySelector("#rollMsg"),b=el.querySelector("#rollSave");b.disabled=true;m.textContent="Saving…";let fail=0;
    for(const s of kids){const a=ROLL.st[s.id];if(!a||a===ROLL.orig[s.id])continue;try{await rollSave(s,d,a);ROLL.orig[s.id]=a}catch(_){fail++}}
    busy=false;if(fail){m.textContent=`${fail} not saved. Try again.`;b.disabled=false;return}ROLL=null;go({name:"today",cls:c.id})}}

// End of class: a short summary on Today once the class has ended, with the students not recorded yet and the parent messages.
function endSummaryHTML(c,m,list){if(!m||!m.ended||m.status==="cancelled")return "";const d=iso(today());let pr=0,ab=0,rec=0;const notRec=[];
  for(const s of list){const e=rollEv(s.id,d),a=e&&e.att;if(a==="absent")ab++;else if(a==="excused"){}else{if(a==="present"||a==="late")pr++;if(doneToday(s.id))rec++;else notRec.push(s)}}
  return `<div class="panel endsum"><div class="head"><h3>Class ended</h3><span class="small muted">${esc(m.ended)}</span></div>
    <div class="kpis"><div><span>Present</span><b>${pr}</b></div><div><span>Absent</span><b>${ab}</b></div><div><span>Recited</span><b>${rec}</b></div><div><span>Not recorded</span><b>${notRec.length}</b></div></div>
    ${notRec.length?`<p class="small">${notRec.map(s=>`<button type="button" class="link" data-trec="${s.id}"><bdi>${esc(s.name)}</bdi></button>`).join(" · ")}</p>`:""}
    <div class="actions"><button class="primary" data-simgo='${JSON.stringify({name:"msgs",id:c.id})}'>Messages to parents</button><button data-simgo='${JSON.stringify({name:"crep",id:c.id})}'>Class report</button></div></div>`}

// Parent messages for a whole group: each one opens the student's weekly message to check and send in WhatsApp.
function renderMsgs(el,sub){const c=classes.find(x=>x.id===view.id);if(!c){view={name:"today"};return render(true)}sub.textContent="Messages to parents · "+c.name;
  const kids=classOrder(c.id),see=s=>typeof seesPersonal!=="function"||seesPersonal(s.id),shown=kids.filter(see),hid=kids.length-shown.length;
  el.innerHTML=`${backBtn("Today",{name:"today",cls:c.id})}<div class="panel"><h2>Messages to parents · <bdi>${esc(c.name)}</bdi></h2>
    <p class="small muted">Open each message, check it and send it in WhatsApp.</p>
    ${shown.map(s=>`<div class="mrow"><span><b><bdi>${esc(s.name)}</bdi></b><br><span class="small muted">${s.phone?esc(s.phone):"No number"}</span></span><button type="button" data-simgo='${JSON.stringify({name:"wa",id:s.id})}'>Open message</button></div>`).join("")||'<p class="muted">No students here.</p>'}
    ${hid?`<p class="small muted">Parents' details show only in your own groups.</p>`:""}</div>`;
  wireBack(el)}
(()=>{const st=document.createElement("style");st.textContent=`.rollg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.rollt{display:flex;flex-direction:column;align-items:center;gap:2px;min-height:64px;border-radius:12px;padding:8px 4px;font-size:14px}.rollt span{font-size:12px;font-weight:500;color:var(--muted)}
.rollt.present{background:var(--ok-soft);border-color:var(--ok);color:var(--ok)}.rollt.present span{color:var(--ok)}
.rollt.late{background:var(--warn-soft);border-color:var(--warn);color:var(--warn)}.rollt.late span{color:var(--warn)}
.rollt.absent{background:var(--bad-soft);border-color:var(--bad);color:var(--bad)}.rollt.absent span{color:var(--bad)}
.rollt.excused{background:var(--info-soft);border-color:var(--info);color:var(--info)}.rollt.excused span{color:var(--info)}
.chip.roll-present{background:var(--ok-soft);color:var(--ok)}.chip.roll-late{background:var(--warn-soft);color:var(--warn)}.chip.roll-absent{background:var(--bad-soft);color:var(--bad)}.chip.roll-excused{background:var(--info-soft);color:var(--info)}
.endsum .kpis,.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.kpis div{background:var(--bg);border-radius:10px;padding:6px 8px;text-align:center}.kpis span{display:block;font-size:12px;color:var(--muted)}.kpis b{font-size:20px}
.mrow{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line)}`;document.head.appendChild(st)})();
