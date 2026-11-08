
// ================= goals.js (v27): student goal, progress charts, class challenge =================
function memRanges(st){useOrder(st);const r=PREV_R.map(x=>[x[0],x[1]]);for(const g of SEGS){const d=Math.max(0,Math.min(st.pos,g.e)-g.s);if(d>0.01)r.push([g.a,g.a+d])}return r}
function goalTarget(gl){if(!gl)return null;if(gl.kind==="khatm")return {a:0,b:ALL,label:"Whole Quran"};const [a,b]=juzLines(gl.juz);return {a,b,label:"Juz "+gl.juz}}
function paceLines(st,days=28){const from=iso(addDays(today(),-days));const by=new Map();events.filter(e=>e.sid===st.id&&e.type==="session"&&e.date>=from).forEach(e=>{const o=by.get(e.date);if(!o||(e.t||0)>(o.t||0))by.set(e.date,e)});return [...by.values()].reduce((t,e)=>t+(e.hifzLines||0),0)/(days/7)}
function goalState(st){const gl=st.goal;const T=goalTarget(gl);if(!T)return null;const cur=allStudents.find(x=>x.id===view.id);
  const done=covered(memRanges(st),T.a,T.b),tot=T.b-T.a;if(cur)useOrder(cur);
  const left=Math.max(0,tot-done),pw=paceLines(st),wk=gl.by?Math.max(0,daysBetween(today(),parse(gl.by))/7):null;
  const eta=pw>0.5?addDays(today(),Math.ceil(left/pw*7)):null,need=wk?left/Math.max(wk,0.14):null;
  let st8="none";if(left<0.5)st8="done";else if(gl.by&&eta){const diff=Math.round(daysBetween(eta,parse(gl.by))/7);st8=diff>=1?"ahead":diff<=-1?"behind":"ontrack";st8={k:st8,w:Math.abs(diff)}}else if(gl.by)st8={k:"behind",w:null};
  return {T,done,tot,left,pct:tot?Math.min(100,Math.round(done/tot*100)):0,pw,eta,need,wk,state:st8}}
function ringSVG(pct,top,bot){const C=2*Math.PI*50,off=C*(1-pct/100);return `<svg width="120" height="120" viewBox="0 0 120 120" class="ring" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent-soft)" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 60 60)"/><text x="60" y="60" text-anchor="middle" font-size="24" font-weight="700" fill="var(--accent)">${top}</text><text x="60" y="80" text-anchor="middle" font-size="11" fill="var(--muted)">${bot}</text></svg>`}
function goalPanel(st){const g=goalState(st);
  if(!g)return `<div class="panel goalp"><div class="head"><h3>Goal</h3></div><p class="small muted">No goal yet. A goal like "finish Juz 30 by March" shows a progress ring and the date ${esc(st.name)} will reach it at the current pace.</p><div class="actions adminonly"><button data-gset>Set a goal</button></div>${goalForm(st)}</div>`;
  const s=g.state,chip=s==="done"?'<span class="chip ok">✓ Reached</span>':s.k==="ahead"?`<span class="chip ok">✓ ${s.w} ${s.w===1?"week":"weeks"} ahead</span>`:s.k==="ontrack"?'<span class="chip ok">On track</span>':s.k==="behind"?`<span class="chip warn">${s.w?s.w+" "+(s.w===1?"week":"weeks")+" behind":"Behind"}</span>`:"";
  return `<div class="panel goalp"><div class="head"><h3>Goal</h3>${chip}</div>
   <div class="gring">${ringSVG(g.pct,g.pct+"%",`${pagesOf(g.done)} of ${pagesOf(g.tot)} p`)}<div><div class="gt">Finish ${esc(g.T.label)}</div>${st.goal.by?`<div class="small muted">by <b>${fmt(parse(st.goal.by))}</b>${g.wk!=null?` · ${Math.ceil(g.wk)} ${Math.ceil(g.wk)===1?"week":"weeks"} left`:""}</div>`:""}</div></div>
   ${s==="done"?`<p class="small">Goal reached. Set the next one.</p>`:`<p class="small">${g.pw>0.5?`At the pace of the last 4 weeks (about <b>${pagesOf(g.pw)} pages a week</b>) ${esc(st.name)} reaches it on <b>${fmt(g.eta)}</b>.`:"Not enough new hifz in the last 4 weeks to estimate a date."}${g.need!=null&&g.left>0?` To make the date: <b>${pagesOf(g.need)} pages a week</b>.`:""}</p>`}
   <div class="actions adminonly"><button data-gset>Change goal</button><button data-gdel>Remove goal</button></div>${goalForm(st)}</div>`}
function goalForm(st){useOrder(st);const gl=st.goal||{};const s=status(st,events);
  const def=gl.juz||JUZ_ORDER.find(j=>!s.done.includes(j))||30;const by=gl.by||iso(addDays(today(),120));
  return `<form class="gform" hidden><div class="fields"><label>Finish<select id="g_kind">${JUZ_ORDER.map(j=>`<option value="juz:${j}" ${gl.kind!=="khatm"&&j===def?"selected":""}>Juz ${j}${s.done.includes(j)?" (done)":""}</option>`).join("")}<option value="khatm" ${gl.kind==="khatm"?"selected":""}>Whole Quran</option></select></label><label>By<input type="date" id="g_by" value="${by}"></label></div><div class="actions"><button class="primary" type="submit">Save goal</button><span class="small muted" id="g_msg"></span></div></form>`}
function wireGoal(el,st){const p=el.querySelector(".goalp");if(!p)return;const f=p.querySelector(".gform");
  p.querySelectorAll("[data-gset]").forEach(b=>b.onclick=()=>{f.hidden=!f.hidden;busy=!f.hidden});
  const d=p.querySelector("[data-gdel]");if(d)d.onclick=async()=>{const old=st.goal;try{await db.doc("students/"+st.id).update({goal:null})}catch(_){}undoToast("Goal removed",()=>db.doc("students/"+st.id).update({goal:old}))};
  f.onsubmit=async e=>{e.preventDefault();const k=f.querySelector("#g_kind").value,by=f.querySelector("#g_by").value;const gl=k==="khatm"?{kind:"khatm",by,set:iso(today())}:{kind:"juz",juz:Number(k.split(":")[1]),by,set:iso(today())};
    try{await db.doc("students/"+st.id).update({goal:gl});busy=false;render(true)}catch(_){f.querySelector("#g_msg").textContent="Not saved. Try again."}}}

// ---------- progress charts ----------
function monthsBack(n){const out=[];const d=today();for(let k=n-1;k>=0;k--){out.push(iso(new Date(d.getFullYear(),d.getMonth()-k,1)).slice(0,7))}return out}
function progressData(st,n=6){const ms=monthsBack(n);const by=new Map();events.filter(e=>e.sid===st.id&&e.type==="session").forEach(e=>{const o=by.get(e.date);if(!o||(e.t||0)>(o.t||0))by.set(e.date,e)});
  const ses=[...by.values()];
  return ms.map(m=>{const xs=ses.filter(e=>String(e.date).slice(0,7)===m&&attended(e));const hl=xs.reduce((t,e)=>t+(e.hifzLines||0),0),hm=xs.reduce((t,e)=>t+(e.hifzMist||0),0);
    const rl=xs.reduce((t,e)=>t+(e.revRows||[]).reduce((u,r)=>u+rowLines(r),0),0),rm=xs.reduce((t,e)=>t+(e.revMist||0),0);
    return {m,pages:hl/LINES,hmp:hl>0?hm/(hl/LINES):null,rmp:rl>0?rm/(rl/LINES):null,n:xs.length}})}
const mLabel=m=>{const [y,mo]=m.split("-").map(Number);return new Date(y,mo-1,1).toLocaleDateString("en-GB",{month:"short"})};
function lineChart(data,series){const W=320,H=130,x0=30,x1=310,y0=16,y1=100;const vals=series.flatMap(([k])=>data.map(d=>d[k])).filter(v=>v!=null);const mx=Math.max(1,...vals)*1.15;
  const X=i=>x0+(data.length>1?(x1-x0)*i/(data.length-1):0),Y=v=>y1-(y1-y0)*v/mx;
  const grid=[0,0.5,1].map(f=>{const v=mx/1.15*f;return `<line x1="${x0}" y1="${Y(v)}" x2="${x1}" y2="${Y(v)}" stroke="var(--line)"/><text x="4" y="${Y(v)+4}" font-size="10" fill="var(--muted)">${Math.round(v*10)/10}</text>`}).join("");
  const draw=([key,color])=>{const pts=data.map((d,i)=>d[key]==null?null:[X(i),Y(d[key])]);const seg=[];let cur=[];pts.forEach(p=>{if(p)cur.push(p);else if(cur.length){seg.push(cur);cur=[]}});if(cur.length)seg.push(cur);
    return seg.map(s=>`<polyline fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${s.map(p=>p.join(",")).join(" ")}"/>`).join("")+pts.map((p,i)=>p?`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?5:4}" fill="${color}"><title>${mLabel(data[i].m)}: ${Math.round(data[i][key]*10)/10}</title></circle>`:"").join("")};
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${grid}${series.map(draw).join("")}${data.map((d,i)=>`<text x="${X(i)}" y="${H-6}" font-size="10" fill="var(--muted)" text-anchor="middle">${mLabel(d.m)}</text>`).join("")}</svg>`}
function barChart(data){const W=320,H=130,x0=20,x1=310,y1=100;const mx=Math.max(1,...data.map(d=>d.pages))*1.2;const bw=(x1-x0)/data.length;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${data.map((d,i)=>{const h=(y1-14)*d.pages/mx,x=x0+i*bw+bw*0.2;return `<rect x="${x}" y="${y1-h}" width="${bw*0.6}" height="${Math.max(h,1)}" rx="5" fill="var(--accent)" opacity="${i===data.length-1?0.55:1}"><title>${mLabel(d.m)}: ${Math.round(d.pages*10)/10} pages</title></rect>${d.pages>0?`<text x="${x+bw*0.3}" y="${y1-h-4}" font-size="10" font-weight="700" text-anchor="middle" fill="var(--fg)">${Math.round(d.pages*10)/10}</text>`:""}<text x="${x+bw*0.3}" y="${H-6}" font-size="10" text-anchor="middle" fill="var(--muted)">${mLabel(d.m)}</text>`}).join("")}</svg>`}
function trendText(d){const h=d.filter(x=>x.hmp!=null);const p=d.slice(0,-1);let t=[];
  if(h.length>=2){const a=h.slice(0,Math.ceil(h.length/2)),b=h.slice(Math.ceil(h.length/2));const av=x=>x.reduce((s,y)=>s+y.hmp,0)/x.length;const A=av(a),B=av(b);if(B<A*0.85)t.push("fewer hifz mistakes than before");else if(B>A*1.15)t.push("more hifz mistakes than before");else t.push("hifz mistakes about the same")}
  if(p.length>=2){const l=p[p.length-1].pages,f=p[p.length-2].pages;if(l>f*1.15)t.push("memorizing faster");else if(l<f*0.85)t.push("memorizing slower");}
  return t.length?t.join(" and ")[0].toUpperCase()+t.join(" and ").slice(1)+".":"Not enough sessions yet to show a trend."}
function progressPanel(st){const d=progressData(st);if(!d.some(x=>x.n))return "";
  return `<details class="panel jpanel progp"><summary><h3>Progress charts</h3><span class="small muted">last 6 months</span></summary>
   <div class="pch"><div class="qh">Mistakes per page <span class="n"><i class="lg" style="background:var(--bad)"></i>hifz <i class="lg" style="background:var(--info)"></i>review</span></div>${lineChart(d,[["hmp","var(--bad)"],["rmp","var(--info)"]])}</div>
   <div class="pch"><div class="qh">Pages memorized each month</div>${barChart(d)}</div>
   <p class="small">📈 ${esc(trendText(d))}</p></details>`}

// ---------- class challenge ----------
const ymNow2=()=>iso(today()).slice(0,7);
function challengeOf(c){const ch=c&&c.challenge;return ch&&ch.month===ymNow2()?ch:null}
function challengeData(c){const ch=challengeOf(c);if(!ch)return null;const kids=students.filter(s=>s.cls===c.id);const by=new Map();
  events.filter(e=>e.type==="session"&&String(e.date).slice(0,7)===ch.month&&kids.some(k=>k.id===e.sid)).forEach(e=>{const k=e.sid+"|"+e.date,o=by.get(k);if(!o||(e.t||0)>(o.t||0))by.set(k,e)});
  const per=kids.map(st=>({st,p:[...by.values()].filter(e=>e.sid===st.id).reduce((t,e)=>t+(e.hifzLines||0),0)/LINES})).sort((a,b)=>b.p-a.p);
  const done=per.reduce((t,x)=>t+x.p,0),d=today(),last=new Date(d.getFullYear(),d.getMonth()+1,0),left=last.getDate()-d.getDate();
  const dayN=d.getDate(),rate=done/Math.max(1,dayN),eta=rate>0?Math.ceil((ch.pages-done)/rate):null;
  return {ch,done,per,left,pct:Math.min(100,Math.round(done/ch.pages*100)),etaDay:eta!=null&&done<ch.pages?dayN+eta:null}}
function challengeCard(c,big){const x=challengeData(c);const r1=v=>Math.round(v*10)/10;
  if(!x)return big?"":`<div class="panel chal empty adminonly"><div class="head"><h3>Class challenge</h3></div><p class="small muted">Set a goal the whole class works on together this month, like 50 pages.</p><div class="actions"><button data-chset="${c.id}">Set this month's challenge</button></div>${chForm(c)}</div>`;
  const d=today(),mo=d.toLocaleDateString("en-GB",{month:"long"}),win=x.done>=x.ch.pages,medal=["🥇","🥈","🥉"];
  return `<div class="panel chal ${big?"big":""}"><div class="chb"><div class="small">${esc(mo)} challenge · ${esc(c.name)}</div><div class="cht">${x.ch.pages} pages together</div><div class="small">🏁 <b>${r1(x.done)}</b> done${win?" · 🎉 Reached!":` · ${r1(x.ch.pages-x.done)} to go · ${x.left} ${x.left===1?"day":"days"} left`}</div></div>
   <div class="chbar"><i style="width:${x.pct}%"></i></div><p class="small muted" style="text-align:center;margin:0">${x.pct}%${!win&&x.etaDay?(x.etaDay<=new Date(d.getFullYear(),d.getMonth()+1,0).getDate()?` · on track to finish around the ${x.etaDay}${["th","st","nd","rd"][(x.etaDay%10<4&&Math.floor(x.etaDay/10)!==1)?x.etaDay%10:0]}`:" · needs a faster pace to finish this month"):""}</p>
   ${x.per.some(y=>y.p>0)?`<div class="qh">Who helped most</div><div class="chw">${x.per.filter(y=>y.p>0).slice(0,big?8:5).map((y,i)=>`<div class="chr"><span>${medal[i]||""} ${esc(y.st.name)}</span><span class="mini"><i style="width:${Math.round(y.p/Math.max(0.01,x.per[0].p)*100)}%"></i></span><b>${r1(y.p)} p</b></div>`).join("")}</div>`:""}
   ${big?"":`<div class="actions adminonly"><button class="sm" data-chset="${c.id}">Change</button></div>${chForm(c)}`}</div>`}
function chForm(c){const ch=challengeOf(c);return `<form class="chform" data-chf="${c.id}" hidden><div class="fields"><label>Pages for the class this month<input type="number" min="1" id="ch_p_${c.id}" value="${ch?ch.pages:Math.max(10,students.filter(s=>s.cls===c.id).length*8)}" inputmode="numeric"></label></div><div class="actions"><button class="primary" type="submit">Save challenge</button>${ch?`<button type="button" data-chdel="${c.id}">Remove</button>`:""}</div></form>`}
function wireChallenge(el){el.querySelectorAll("[data-chset]").forEach(b=>b.onclick=()=>{const f=el.querySelector(`[data-chf="${b.dataset.chset}"]`);f.hidden=!f.hidden;busy=!f.hidden});
  el.querySelectorAll("[data-chf]").forEach(f=>f.onsubmit=async e=>{e.preventDefault();const cid=f.dataset.chf,v=Number(f.querySelector("input").value);if(!(v>0))return;try{await db.doc("classes/"+cid).update({challenge:{month:ymNow2(),pages:v}});busy=false;render(true)}catch(_){}});
  el.querySelectorAll("[data-chdel]").forEach(b=>b.onclick=async()=>{try{await db.doc("classes/"+b.dataset.chdel).update({challenge:null});busy=false;render(true)}catch(_){}})}
