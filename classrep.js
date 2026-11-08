// ---------- class report: what a class memorized, reviewed and studied in a date range ----------
function classData(c,from,to){
  const kids=students.filter(s=>s.cls===c.id),ids=new Set(kids.map(s=>s.id)),last=to<iso(today())?to:iso(today());
  const evs=events.filter(e=>ids.has(e.sid)&&e.date>=from&&e.date<=to);
  const ses=evs.filter(e=>e.type==="session");
  const mts=meetings.filter(m=>m.cls===c.id&&m.date>=from&&m.date<=to);
  // class days in the range: scheduled days up to today, plus any logged day
  const days=new Set(mts.map(m=>m.date));for(let d=parse(from);iso(d)<=last;d=addDays(d,1))if(clsDays(c).includes(d.getDay()))days.add(iso(d));
  for(const e of ses)days.add(e.date);
  const dayList=[...days].sort();
  const revL=e=>(e.revRows||[]).reduce((t,r)=>t+rowLines(r),0);
  const per=kids.map(st=>{const m=ses.filter(e=>e.sid===st.id),att=m.filter(attended);
    const hl=m.reduce((t,e)=>t+(Number(e.hifzLines)||0),0),rl=m.reduce((t,e)=>t+revL(e),0),mist=m.reduce((t,e)=>t+(Number(e.hifzMist)||0)+(Number(e.revMist)||0),0);
    const pts=evs.filter(e=>e.sid===st.id).reduce((t,e)=>t+ptsOf(e),0);
    return {st,n:m.length,att:att.length,late:m.filter(e=>e.att==="late").length,left:m.filter(e=>e.left).length,abs:m.filter(e=>e.att==="absent").length,exc:m.filter(e=>e.att==="excused").length,
      hp:hl/LINES,rp:rl/LINES,mist,rate:mist/Math.max(0.5,(hl+rl)/LINES),nr:m.filter(e=>e.hifzNR).length+m.filter(e=>e.revNR).length,
      tests:evs.filter(e=>e.sid===st.id&&e.type==="test"&&e.result==="pass").map(e=>e.juz),pts}});
  const held=dayList.filter(d=>{const m=mts.find(x=>x.date===d);return m?m.status!=="cancelled":ses.some(e=>e.date===d)}).length;
  const cancelled=mts.filter(m=>m.status==="cancelled").length;
  const tot=k=>per.reduce((t,p)=>t+p[k],0);
  const nSes=tot("n"),nAtt=tot("att");
  return {kids,evs,ses,mts,dayList,per,held,cancelled,hp:tot("hp"),rp:tot("rp"),mist:tot("mist"),nr:tot("nr"),
    attPct:nSes?Math.round(nAtt/nSes*100):null,rate:tot("mist")/Math.max(0.5,tot("hp")+tot("rp")),tests:per.flatMap(p=>p.tests.map(j=>[p.st.name,j]))}}
// flags: star of the period (most points, then most pages) and who needs follow-up
function classFlags(per){const g=GRD();const star=per.filter(p=>p.n).slice().sort((a,b)=>b.pts-a.pts||b.hp-a.hp)[0];
  const need=new Map();for(const p of per){const r=[];if(p.abs>=2)r.push(`${p.abs} absences`);if(p.nr>=2)r.push(`not ready ${p.nr} times`);if(p.hp+p.rp>0&&p.rate>g.p)r.push(`${Math.round(p.rate*10)/10} mistakes per page`);if(!p.n)r.push("no sessions recorded");if(r.length)need.set(p.st.id,r)}
  return {star:star&&star.pts>0?star.st.id:null,need}}
// class heart: darker = more students memorized the surah; blue band = completed by someone in the period
function classHeartView(c,from,to){const kids=students.filter(s=>s.cls===c.id),N=kids.length||1,cnt=new Array(114).fill(0),newBy=Array.from({length:114},()=>[]);
  for(const st of kids){const f=surahFrac(st),f0=surahFrac(st,posAt(st,from));for(let s=0;s<114;s++){if(f[s]>=0.98){cnt[s]++;if(f0[s]<0.98)newBy[s].push(st.name)}}}
  const shade=r=>{const a=[226,243,234],b=[22,110,72];return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*r)).join(",")})`};
  const col=new Array(115).fill(null),info=[],band=new Set();
  for(let s=0;s<114;s++){if(cnt[s])col[s]=shade(0.25+0.75*cnt[s]/N);if(newBy[s].length)band.add(s);
    info[s]=`${cnt[s]} of ${kids.length} ${kids.length===1?"student":"students"} memorized it${newBy[s].length?` · new in this period: ${newBy[s].join(", ")}`:""}`}
  return {col,info,gold:band,bandColor:HC.newm,fr:cnt.map(v=>v/N),cnt,newBy,N:kids.length}}
// weekly chart: bars = pages reviewed, line = pages memorized
function weekChart(d,from,to){const weeks=[];for(let a=parse(from);iso(a)<=to;a=addDays(a,7)){const b=iso(addDays(a,6))<to?iso(addDays(a,6)):to;weeks.push({a:iso(a),b,h:0,r:0})}
  for(const e of d.ses){const w=weeks.find(w=>e.date>=w.a&&e.date<=w.b);if(!w)continue;w.h+=(Number(e.hifzLines)||0)/LINES;w.r+=(e.revRows||[]).reduce((t,r)=>t+rowLines(r),0)/LINES}
  if(!weeks.length)return "";const W=640,H=220,L=40,B=34,T=14,max=Math.max(1,...weeks.map(w=>Math.max(w.h,w.r))),n=weeks.length,bw=(W-L-10)/n;
  const y=v=>T+(H-T-B)*(1-v/max),ticks=[0,max/2,max].map(v=>Math.round(v*10)/10);
  const bars=weeks.map((w,i)=>`<rect x="${L+i*bw+bw*0.18}" y="${y(w.r)}" width="${bw*0.64}" height="${H-B-y(w.r)}" fill="#bfe0cf" rx="3"><title>${fmtShort(w.a)}: ${Math.round(w.r*10)/10} pages reviewed</title></rect>`).join("");
  const pts=weeks.map((w,i)=>`${L+i*bw+bw/2},${y(w.h)}`).join(" ");
  const dots=weeks.map((w,i)=>`<circle cx="${L+i*bw+bw/2}" cy="${y(w.h)}" r="4" fill="#0d6b5e"><title>${fmtShort(w.a)}: ${Math.round(w.h*10)/10} pages memorized</title></circle>`).join("");
  const labs=weeks.map((w,i)=>n<=10||i%Math.ceil(n/10)===0?`<text x="${L+i*bw+bw/2}" y="${H-B+16}" text-anchor="middle" font-size="11" fill="#5c6b69">${fmtShort(w.a).replace(/^\w+ /,"")}</text>`:"").join("");
  const grid=ticks.map(v=>`<line x1="${L}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="#dce3e0"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#5c6b69">${v}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block" role="img" aria-label="Pages memorized and reviewed each week">${grid}${bars}<polyline points="${pts}" fill="none" stroke="#0d6b5e" stroke-width="2.5"/>${dots}${labs}</svg>
  <p class="small muted"><span style="display:inline-block;width:12px;height:12px;background:#bfe0cf;border-radius:2px;vertical-align:middle"></span> Pages reviewed &nbsp; <span style="display:inline-block;width:14px;height:3px;background:#0d6b5e;vertical-align:middle"></span> Pages memorized · per week (starting ${fmtShort(from)})</p>`}
const r1=v=>Math.round(v*10)/10;
function svgPng(svg){return new Promise(ok=>{const m=svg.match(/viewBox="0 0 (\d+) (\d+)"/),W=+m[1],H=+m[2];const svg2=svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" font-family="Arial,sans-serif" ').replace(/width="100%"/,`width="${W}" height="${H}"`);
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=W*2;c.height=H*2;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);ok(c.toDataURL('image/png'))};img.onerror=()=>ok(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg2)})}
function classReportHTML(c,from,to,d,f,heartImg,chartImg){
  const actName=k=>(ACTIVITIES.find(a=>a[0]===k)||[0,k])[1];
  const sum=`<div class="stats"><div><b>${d.held}</b><span>classes held</span></div><div><b>${d.cancelled}</b><span>cancelled</span></div>${teachMins(d.mts)?`<div><b>${Math.floor(teachMins(d.mts)/60)}h ${teachMins(d.mts)%60}m</b><span>teaching time</span></div>`:""}<div><b>${d.attPct==null?"—":d.attPct+"%"}</b><span>attendance</span></div><div><b>${r1(d.hp)}</b><span>pages memorized</span></div><div><b>${r1(d.rp)}</b><span>pages reviewed</span></div><div><b>${d.hp+d.rp>0?r1(d.rate):"—"}</b><span>mistakes per page</span></div><div><b>${d.tests.length}</b><span>juz tests passed</span></div><div><b>${d.nr}</b><span>times not ready</span></div></div>
  ${d.tests.length?`<p class="small">Juz tests passed: ${d.tests.map(([n,j])=>`${esc(n)} (juz ${j})`).join(", ")}</p>`:""}`;
  const rows=d.per.slice().sort((a,b)=>b.hp-a.hp||a.st.name.localeCompare(b.st.name)).map(p=>`<tr><td><b>${esc(p.st.name)}</b>${f.star===p.st.id?' <span title="Star of the period">⭐</span>':""}${f.need.has(p.st.id)?`<br><small style="color:#a6620b">Follow up: ${f.need.get(p.st.id).join(", ")}</small>`:""}</td><td>${p.att}/${p.n}${p.late?` (${p.late} late)`:""}${p.left?` (left early ${p.left})`:""}</td><td>${r1(p.hp)}</td><td>${r1(p.rp)}</td><td>${p.hp+p.rp>0?r1(p.rate):"—"}</td><td>${p.nr||"—"}</td><td>${p.tests.length?p.tests.map(j=>"juz "+j).join(", "):"—"}</td><td>${sgn(p.pts)}</td></tr>`).join("");
  const table=`<div class="tbl"><table class="crt"><tr><th>Student</th><th>Present</th><th>Pages memorized</th><th>Pages reviewed</th><th>Mistakes / page</th><th>Not ready</th><th>Tests</th><th>Points</th></tr>${rows||'<tr><td colspan="8">No students in this class.</td></tr>'}</table></div>`;
  const empty=d.dayList.filter(day=>!d.mts.some(x=>x.date===day)&&!d.ses.some(e=>e.date===day));
  const diary=d.dayList.filter(day=>!empty.includes(day)).reverse().map(day=>{const m=d.mts.find(x=>x.date===day),es=d.ses.filter(e=>e.date===day);
    const st=m?(m.status==="cancelled"?`<span class="chip bad">Cancelled${m.reason?": "+esc(m.reason):""}</span>`:'<span class="chip ok">Held</span>'):es.length?'<span class="chip ok">Held</span>':'<span class="chip info">Not logged</span>';
    const acts=m&&(m.acts||[]).length?`<p class="small"><b>Activities:</b> ${m.acts.map(a=>`${actName(a.k)}${a.d?": "+esc(a.d):""}`).join(" · ")}</p>`:"";
    const who=d.kids.map(s=>{const e=es.find(x=>x.sid===s.id);if(!e)return null;const a=ATT[e.att]||ATT.present;
      if(!attended(e))return `<li><b>${esc(s.name)}</b>: ${a[1]}</li>`;
      const parts=[];if(e.hifzNR)parts.push("hifz not ready");else if(e.hifzLines>0)parts.push(`hifz ${esc(hifzShown(e))}${e.hifzMist&&!(e.hifzRows||[]).some(r=>r.m)?` (${e.hifzMist} mistakes)`:""}`);
      if(e.revNR)parts.push("review not ready");else if(e.revType&&e.revType!=="none")parts.push(`review ${esc(revShown(e))}${e.revMist&&!(e.revRows||[]).some(r=>r.m)?` (${e.revMist} mistakes)`:""}`);
      return `<li><b>${esc(s.name)}</b>${e.att==="late"?" (late)":""}: ${parts.join(" · ")||"attended"}</li>`}).filter(Boolean);
    return `<div class="dcard"><div class="head"><b>${fmt(parse(day))}</b>${st}</div>${acts}${m&&m.started?`<p class="small muted">${esc(classTimeText(m))}</p>`:""}${m&&m.note?`<p class="small note">${esc(m.note)}</p>`:""}${who.length?`<ul class="small">${who.join("")}</ul>`:'<p class="small muted">No recitations recorded.</p>'}</div>`}).join("");
  const hv=heartImg!==undefined;
  return `<h2>Summary</h2>${sum}
  <h2>Weekly progress</h2>${chartImg?(()=>{const wc=weekChart(d,from,to);return `<img src="${chartImg}" alt="Weekly chart" style="width:100%;max-width:640px;height:auto">`+wc.slice(wc.indexOf('</svg>')+6)})():weekChart(d,from,to)}
  <h2>Students</h2>${table}<p class="small muted">⭐ Star of the period: most points. Follow up: 2+ absences, not ready 2+ times, more than ${GRD().p} mistakes per page, or no sessions.</p>${classStrengthMap(c)}
  ${hv?`<div class="hbox"><h2>Class heart</h2><p class="small">Darker green: more students memorized the surah. Blue border: completed by someone in this period.</p><div style="text-align:center"><img src="${heartImg}" alt="Class heart" style="width:420px;max-width:100%;height:auto"></div></div>`:""}
  <h2>Class diary</h2>${empty.length?`<p class="small muted">${empty.length} class ${empty.length===1?"day":"days"} with nothing logged: ${empty.slice(-8).map(x=>fmtShort(x)).join(", ")}${empty.length>8?" …":""}</p>`:""}${diary||'<p class="muted">Nothing logged in this period.</p>'}`}
function renderClassReport(el,sub){const c=classes.find(x=>x.id===view.id);if(!c){view={name:"list"};return render(true)}
  const t=iso(today()),from=view.from||t.slice(0,8)+"01",to=view.to||t,d=classData(c,from,to),f=classFlags(d.per);
  sub.textContent="Class report · "+c.name;
  const d0=today(),pm=new Date(d0.getFullYear(),d0.getMonth()-1,1),pmEnd=new Date(d0.getFullYear(),d0.getMonth(),0);
  const pre=(a,b,l)=>`<button type="button" class="fbtn ${a===from&&b===to?"on":""}" data-rf="${a}" data-rt="${b}">${l}</button>`;
  el.innerHTML=`${backBtn(esc(c.name),{name:"class",id:c.id,date:t})}
  <div class="panel"><div class="head"><h2>Class report · <bdi>${esc(c.name)}</bdi></h2><span class="actions"><button id="cr_scr">Class screen</button><button class="primary" id="cr_dl" ${downloads?"":"hidden"}>Download PDF</button></span></div><span class="small muted" id="cr_msg"></span>
    <div class="fields"><label>From<input type="date" id="cr_from" value="${from}"></label><label>To<input type="date" id="cr_to" value="${to}"></label></div>
    <div class="filters">${pre(iso(addDays(d0,-6)),t,"Last 7 days")}${pre(t.slice(0,8)+"01",t,"This month")}${pre(iso(pm),iso(pmEnd),"Last month")}${pre(iso(addDays(d0,-89)),t,"Last 3 months")}</div>
    ${classes.length>1?`<div class="filters">${classes.map(x=>`<button type="button" class="fbtn ${x.id===c.id?"on":""}" data-crc="${x.id}">${esc(x.name)}</button>`).join("")}</div>`:""}<p class="small muted">${d.kids.length} ${d.kids.length===1?"student":"students"} · ${fmt(parse(from))} – ${fmt(parse(to))}</p>
    <div class="report crep">${classReportHTML(c,from,to,d,f)}</div></div>
  <div class="panel"><h3>Class heart</h3><p class="small muted">Darker green: more students memorized the surah. Blue border: completed by someone in this period. Tap a surah for details.</p>
    <div class="heartscroll"><div class="heartbox"><canvas id="cHeart" aria-label="Class heart"></canvas></div></div><p class="small" id="cHeartInfo" aria-live="polite"></p></div>`;
  wireBack(el);
  const setR=(a,b)=>{if(a&&b&&b<a)[a,b]=[b,a];view.from=a||from;view.to=b||to;render(true)};
  el.querySelector("#cr_from").onchange=e=>setR(e.target.value,el.querySelector("#cr_to").value);
  el.querySelector("#cr_to").onchange=e=>setR(el.querySelector("#cr_from").value,e.target.value);
  el.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>setR(b.dataset.rf,b.dataset.rt));
  el.querySelectorAll("[data-crc]").forEach(b=>b.onclick=()=>{view={...view,id:b.dataset.crc};render(true)});
  const hv=classHeartView(c,from,to),cv=el.querySelector("#cHeart"),box=cv.parentElement;
  heartFont().then(()=>heartDraw(cv,hv,Math.min(3000,Math.max(600,box.clientWidth*(window.devicePixelRatio||1)*1.5))));
  cv.onclick=e=>{const s=heartHit(cv,e);el.querySelector("#cHeartInfo").textContent=s<0?"":`${s+1}. ${SURAH_NAMES[s]}: ${hv.info[s]}`};
  el.querySelector("#cr_scr").onclick=()=>go({name:"screen",id:c.id});
  el.querySelector("#cr_dl").onclick=()=>heartFont().then(async()=>{const img=heartDraw(document.createElement("canvas"),hv,2000).toDataURL("image/jpeg",0.9);const wc=weekChart(d,from,to),chart=wc?await svgPng(wc.slice(0,wc.indexOf('</svg>')+6)):null;
    saveFile(`class-report-${fileSafe(c.name)}-${from}_${to}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Class report - ${esc(c.name)}</title><style>${PRINT_CSS}${CREP_CSS}</style></head><body><h1>Class report · ${esc(c.name)}</h1><p class="muted">${fmt(parse(from))} – ${fmt(parse(to))} ${parse(to).getFullYear()} · ${d.kids.length} students · ${esc(teacherName())}</p>${classReportHTML(c,from,to,d,f,img,chart)}</body></html>`,el.querySelector("#cr_msg"))})}
const CREP_CSS=`.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:6px 0}.stats div{display:flex;flex-direction:column;border:1px solid #dce3e0;border-radius:8px;padding:6px 8px}.stats b{font-size:20px}.stats span{font-size:11px;color:#5c6b69}
.dcard{border:1px solid #dce3e0;border-radius:8px;padding:8px 10px;margin:0 0 8px;break-inside:avoid;page-break-inside:avoid}.dcard .head{display:flex;justify-content:space-between;gap:8px}.dcard ul{margin:4px 0 0;padding-left:18px}
.chip{display:inline-block;font-size:11px;padding:1px 8px;border-radius:99px;background:#eef2f0}.chip.ok{background:#e3f2e8;color:#2e7d4f}.chip.bad{background:#f9e3e1;color:#b3342b}.chip.info{background:#e3ecf8;color:#2f5d9e}.note{color:#5c6b69}`;
