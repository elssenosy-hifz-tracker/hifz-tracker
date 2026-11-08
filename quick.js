
// ---------- quick session page (v24) ----------
function classOrder(cls){const ml=s=>{useOrder(s);return (Number(s.pos)||0)+PREV_LINES};const r=students.filter(s=>s.cls===cls).map(s=>[ml(s),s]).sort((a,b)=>a[0]-b[0]||String(a[1].name).localeCompare(String(b[1].name))).map(x=>x[1]);const cur=allStudents.find(s=>s.id===view.id);if(cur)useOrder(cur);return r}
const sesWork=e=>!attended(e)||Number(e.hifzLines)>0||e.hifzRepeat||(e.revType&&e.revType!=="none")||e.hifzNR||e.revNR;
const doneToday=sid=>events.some(e=>e.type==="session"&&e.sid===sid&&e.date===iso(today())&&sesWork(e));
function quickSession(el,f,st,c){
  const {hs,rt,hR,rR,hRows,rRows,planRows,ends,wk,sync,errs,errDraw}=c;let dup=c.dup;
  f.dataset.quick="1";f.classList.add("quick");
  const defEnd=ends.length?ends[Math.min(wk,ends.length)-1]:null;
  const horizon=ends.length?ends[ends.length-1]:null;
  const ps=st.pos<TOTAL-0.05?pieces(st.pos,Math.min(TOTAL,Math.max(horizon||0,st.pos+300))):[];
  const q={att:f.querySelector("input[name=att]:checked").value,h:defEnd!=null?"all":"none",hm:0,rm:0,stopK:0,stopA:0,hk:kindsFrom(null,0),rk:kindsFrom(null,0)};const smartL=(()=>{try{return smartReview(st,[])}catch(_){return []}})();const SM=sessionMarks(st);
  if(ps.length){const dp=defEnd!=null?pieces(st.pos,defEnd):ps;const l=dp[dp.length-1];q.stopK=Math.max(0,ps.findIndex(x=>x.s===l.s&&x.a1===l.a1));q.stopA=l.a2}
  // ---- prefill from today's record ----
  const dupAtt=dup&&!sesWork(dup)?dup:null;if(dupAtt){q.att=dupAtt.att||"present";const ar=f.querySelector("#s_arr");if(dupAtt.arr)ar.value=dupAtt.arr;dup=null}
  if(dup){
    q.att=dup.att||"present";
    const ar=f.querySelector("#s_arr");if(dup.arr)ar.value=dup.arr;
    if(dup.left){f.querySelector("#s_left").value=dup.left;f.querySelector("#s_leftw").value=dup.leftWhy||""}
    if(dup.hifzNR)q.h="nr";
    else if(dup.to!=null||(dup.hifzRows||[]).length){
      const rows=(dup.hifzRows||[]).length?dup.hifzRows:pieces(dup.from!=null?dup.from:st.pos,dup.to);
      if(defEnd!=null&&dup.to!=null&&Math.abs(dup.to-defEnd)<0.05&&!(dup.hifzRows||[]).length)q.h="all";
      else{q.h="part";const l=rows[rows.length-1];let k=ps.findIndex(x=>x.s===l.s);if(k<0){q.h="custom";q.rows=rows}else{q.stopK=k;q.stopA=l.a2}}
    }else q.h="none";
    q.rep=!!dup.hifzRepeat;f._rep=q.rep;q.hk=kindsFrom(dup.hifzMk,dup.hifzMist);q.rk=kindsFrom(dup.revMk,dup.revMist);q.hm=kindSum(q.hk);q.rm=kindSum(q.rk);
    if(dup.revNR)rt.value="nr";else if(dup.revType)rt.value=dup.revType;
    if(rt.value!=="nr"&&rt.value!=="none"){const rr=[...(dup.revRows||[]).map(r=>({...r,m:0})),...(dup.revSkip||[]).map(r=>({...r,m:0,skip:true}))];if(rr.length)rR.set(rr);else rR.set(planRows(rt.value))}else rR.set([]);
    if(dup.hw!=null){const r=f.querySelector(`input[name=hw][value="${dup.hw?1:0}"]`);if(r)r.checked=true}
    (dup.beh||[]).forEach(b=>{const x=f.querySelector(`[data-beh="${b}"]`);if(x)x.checked=true});
    if(dup.note)f.querySelector("#s_note").value=dup.note;
    if((dup.errs||[]).length&&!errs.length){errs.push(...dup.errs);errDraw&&errDraw()}
  }
  if(!dup&&rt.value!=="nr"&&rt.value!=="none"){const bt=(()=>{try{return buddyToday(st)}catch(_){return []}})();
    for(const b of bt){const r=rRows.find(x=>x.s===b.s&&!x.buddy);if(r){r.bm=Number(b.m)||0;r.buddy=b.helper||"a classmate"}else rRows.push({s:b.s,a1:b.a1,a2:b.a2,m:0,bm:Number(b.m)||0,added:true,buddy:b.helper||"a classmate"})}
    if(bt.length)rR.draw()}
  // ---- build quick UI ----
  const planH=defEnd!=null?rangeText(st.pos,defEnd):"Nothing planned";
  const box=document.createElement("div");box.id="q";
  const recAt=dup&&dup.t?new Date(dup.t).toTimeString().slice(0,5):"";
  box.innerHTML=`
   ${dup?`<div class="banner warn" id="qDup">Already recorded today${recAt?" at "+recAt:""}. Changes here <b>update</b> that record, they don't add a new one. <button type="button" class="link sm" id="qAdd">Add a second record instead</button></div>`:""}
   ${(()=>{try{return backBanner(st)}catch(_){return ""}})()}
   <div class="qplan"><b>Today's hifz:</b> <span id="qPlanH">${esc(planH)}</span><br><b>Review:</b> <span id="qPlanR"></span><div><button type="button" class="sm qmall" id="qMusAll">📖 Recite all in order in the mushaf</button></div></div>
   <div class="qcard" id="qAttC"><div class="qh">1 · Attendance</div>
    <div class="qg q4">${[["present","✓","On time"],["late","⏰","Late"],["absent","✕","Absent"],["excused","✉","Excused"]].map(([k,i,l])=>`<button type="button" class="qb" data-qatt="${k}"><i>${i}</i>${l}</button>`).join("")}</div>
    <div id="qArr"></div></div>
   <div id="qWork">
   <div class="qcard"><div class="qh">2 · New hifz <span class="n">${esc(planH)}</span></div>
    <div class="qg q4"><button type="button" class="qb" data-qh="all" ${defEnd==null?"disabled":""}><i>✓</i>Recited all</button><button type="button" class="qb" data-qh="part" ${!ps.length?"disabled":""}><i>½</i>Part of it</button><button type="button" class="qb" data-qh="more" ${!ps.length?"disabled":""}><i>＋</i>More</button><button type="button" class="qb" data-qh="nr"><i>✕</i>Did not recite</button></div>
    <div class="qwr"><button type="button" class="link sm" id="qWrite">✎ Write what he recited</button></div><div class="qcust" id="qCust" hidden></div>
    <button type="button" class="qb wide qrep" id="qRep"><i>↻</i><span class="qrt">Repeat next class</span><small class="qrs">Saves his mistakes, keeps the same portion for next class</small></button>
    <div class="qstop" id="qStop" hidden><span id="qStopL">Stopped at</span> <select id="qStopS">${ps.map((x,i)=>`<option value="${i}">${SURAH_NAMES[x.s]}</option>`).join("")}</select> ayah <input type="number" id="qStopA" min="1" inputmode="numeric"> <span class="small muted" id="qStopOf"></span><div class="qwhy" id="qWhy"><button type="button" class="qt" data-qwhy="time">⏱ Time ran out</button><button type="button" class="qt" data-qwhy="stuck">✋ Could not continue</button></div></div>
    <button type="button" class="sm qmh1" id="qMusH">📖 Open in mushaf, tap the mistakes</button><div class="qkinds" id="qHm"></div>
    <div class="qgr" id="qHg"></div>
    <button type="button" class="link sm" id="qNone">No new hifz today</button></div>
   <div class="qcard"><div class="qh">3 · Review <span class="n">tap a surah not read</span></div>
    <div class="qtype">${[["near","Near"],["far","Far"],["both","Near and far"]].map(([k,l])=>`<button type="button" class="qt" data-qrt="${k}">${l}</button>`).join("")}</div>
    <div id="qSmart"></div><div class="qchips" id="qChips"></div><button type="button" class="sm qmh1" id="qMusR">📖 Open review in mushaf, tap the mistakes</button>
    <div class="qadd"><button type="button" class="sm" id="qRadd">＋ Add surah</button><div class="qstop" id="qRaddF" hidden><select id="qRaS">${errSurahs(st).map(x=>`<option value="${x}">${SURAH_NAMES[x]}</option>`).join("")}</select> ayah <input type="number" id="qRa1" min="1" inputmode="numeric" aria-label="From ayah"> to <input type="number" id="qRa2" min="1" inputmode="numeric" aria-label="To ayah"> <button type="button" class="primary sm" id="qRaOk">Add</button></div></div>
    <div class="qkinds" id="qRm"></div>
    <div class="qgr" id="qRg"></div>
    <button type="button" class="qb wide" id="qRnr">Did not recite review at all</button></div>
   </div>`;
  f.prepend(box);
  // move old parts into "More details"
  const more=document.createElement("details");more.id="qMore";more.className="qcard";
  more.innerHTML=`<summary><b>＋ More details</b> <span class="small muted">homework · behaviour · left early · mistake places · note · date</span></summary><div class="qmb"></div>`;
  const mb=more.querySelector(".qmb");
  const dupBox=f.querySelector("#dupBox");if(dupBox)dupBox.remove();
  const g=f.querySelector("#g_box"),flds=f.querySelector(".fields"),fbeh=f.querySelector("#f_beh"),fl=f.querySelector("#f_left"),fe=f.querySelector("#f_errs"),nt=f.querySelector("#f_noteL"),fs=f.querySelector("#f_session");
  [fbeh,fl,fe,nt].forEach(x=>x&&mb.appendChild(x));
  const adv=document.createElement("details");adv.className="qadv";adv.innerHTML=`<summary>Advanced: choose surahs and ayahs by hand, date, recorded by, guide</summary>`;
  [flds,fs,g].forEach(x=>x&&adv.appendChild(x));mb.appendChild(adv);
  box.after(more);
  f.querySelector("#qArr").appendChild(f.querySelector("#f_arr"));
  // sticky save bar
  const act=f.querySelector("button.primary[type=submit]").parentElement,sbar=document.createElement("div");sbar.className="qsave";sbar.innerHTML=`<div class="qsum" id="qSum"></div>`;
  sbar.appendChild(act);f.appendChild(sbar);const sv=act.querySelector("button.primary");sv.textContent=dup?"Save changes":"Save";
  const hint=f.querySelector("#s_hint");if(hint)hint.hidden=true;
  // ---- logic ----
  const hm=f.querySelector("#s_hm"),rm=f.querySelector("#s_rm");
  const fire=i=>{i.dispatchEvent(new Event("input",{bubbles:true}));i.dispatchEvent(new Event("change",{bubbles:true}))};
  const applyCounts=()=>{q.hm=kindSum(q.hk);q.rm=kindSum(q.rk);f._mk={h:q.hk,r:q.rk};hm.value=q.h==="nr"||q.h==="none"?0:q.hm;rm.value=rt.value==="nr"||rt.value==="none"?0:q.rm;fire(hm);fire(rm)};
  const stopRows=()=>{const k=Math.min(q.stopK,ps.length-1),p=ps[k];const a=Math.max(p.a1,Math.min(p.a2,q.stopA||p.a2));q.stopA=a;return [...ps.slice(0,k).map(x=>({s:x.s,a1:x.a1,a2:x.a2,m:0})),{s:p.s,a1:p.a1,a2:a,m:0}]};
  const setH=m=>{q.h=m;f.dataset.hmode=m;
    if(m==="all"){hs.value=String(defEnd)}
    else if(m==="nr")hs.value="nr";
    else if(m==="none")hs.value="0";
    else if(m==="part"||m==="more"){hs.value="custom";hR.set(stopRows())}
    else if(m==="custom"){hs.value="custom";hR.set(q.rows.map(r=>({...r,m:0})))}
    if(hs.value!=="custom"&&hs.value!==String(defEnd)){/* keep select valid */}
    hs.dispatchEvent(new Event("change"));busy=true;draw()};
  const setAtt=k=>{q.att=k;const r=f.querySelector(`input[name=att][value="${k}"]`);if(r){r.checked=true;r.dispatchEvent(new Event("change"))}draw()};
  const draw=()=>{
    f.querySelectorAll("[data-qatt]").forEach(b=>{const on=b.dataset.qatt===q.att;b.className="qb"+(on?(q.att==="present"?" on":q.att==="late"?" onw":q.att==="absent"?" onb":" oni"):"")});
    f.querySelector("#qArr").hidden=q.att!=="late";
    const att=["present","late"].includes(q.att);f.querySelector("#qWork").hidden=!att;
    f.querySelectorAll("[data-qh]").forEach(b=>{const on=b.dataset.qh===q.h||(b.dataset.qh==="part"&&q.h==="custom");b.className="qb"+(on?(q.h==="all"?" on":q.h==="nr"?" onb":" onw"):"")});
    const stp=f.querySelector("#qStop");stp.hidden=q.h!=="part"&&q.h!=="more";f.querySelector("#qStopL").textContent=q.h==="more"?"Reached":"Stopped at";{const w=f.querySelector("#qWhy");if(w)w.hidden=q.h!=="part"}
    if(q.h==="part"||q.h==="more"){f.querySelector("#qStopS").value=String(q.stopK);const p=ps[q.stopK];const ai=f.querySelector("#qStopA");if(document.activeElement!==ai)ai.value=q.stopA;ai.min=p.a1;ai.max=p.a2;f.querySelector("#qStopOf").textContent=`(${p.a1}–${p.a2})`}
    f.querySelector("#qCust").hidden=q.h!=="custom";f.querySelector("#qWrite").hidden=q.h==="custom";
    {const rb=f.querySelector("#qRep");rb.hidden=q.h==="nr"||q.h==="none";rb.classList.toggle("onw",!!q.rep);rb.querySelector(".qrt").textContent=q.rep?"Repeat next class ✓":"Repeat next class"}
    f.querySelector("#qNone").textContent=q.h==="none"?"No new hifz today ✓":"No new hifz today";
    f.querySelector("#qHm").hidden=q.h==="nr"||q.h==="none";f.querySelector("#qMusH").hidden=q.h==="nr"||q.h==="none";f.querySelector("#qMusAll").hidden=!["present","late"].includes(q.att);f.querySelector("#qHm").innerHTML=`<div class="qkt">Mistakes <b>${q.hm}</b></div>`+kindRows(q.hk);
    const rnr=rt.value==="nr",rnone=rt.value==="none";
    f.querySelectorAll("[data-qrt]").forEach(b=>b.classList.toggle("on",b.dataset.qrt===rt.value));
    f.querySelector(".qtype").hidden=rnr;
    const live=rRows.filter(r=>!r.skip&&!r.buddy).length;
    f.querySelector("#qChips").innerHTML=rnr?"":rRows.length?rRows.map((r,i)=>`<span class="qcw"><button type="button" class="qsc${r.skip?" x":""}${r.added?" add":""}${r.buddy?" bud":""}" data-qi="${i}" ${r.buddy?`title="Heard by ${esc(r.buddy)}. Tap if you heard it too."`:""}>${r.buddy?"":r.added?"＋":r.skip?"✕":"✓"} ${esc(SURAH_NAMES[r.s])}${r.buddy?` <span title="Recited to ${esc(r.buddy)}">👥</span>`:""}${r.a1>1||r.a2<QD.verses[r.s]?` <small>${r.a1}–${r.a2}</small>`:""}${(()=>{const n=smCount("r",r);return n?` <em class="qmc">${n}</em>`:""})()}</button>${r.skip?"":`<button type="button" class="qmi" data-qmus="${i}" aria-label="Open ${esc(SURAH_NAMES[r.s])} in the mushaf">📖</button>`}</span>`).join(""):'<span class="small muted">No review planned for this type.</span>';
    f.querySelectorAll("[data-qi]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.qi),r=rRows[i];if(r.buddy){delete r.buddy;delete r.bm;r.added=false;rR.draw();busy=true;applyCounts();draw();return}if(r.added){rRows.splice(i,1);rR.draw();busy=true;applyCounts();draw();return}r.skip=!r.skip;rR.draw();busy=true;applyCounts();draw()});
    f.querySelector("#qRm").hidden=rnr||rnone||!live;f.querySelector("#qMusR").hidden=rnr||rnone||!live;f.querySelector("#qRm").innerHTML=`<div class="qkt">Mistakes <b>${q.rm}</b></div>`+kindRows(q.rk);f.querySelector("#qSmart").innerHTML=rnr?"":smartBox(smartL,rRows);
    const rb=f.querySelector("#qRnr");rb.className="qb wide"+(rnr?" onb":"");rb.innerHTML=rnr?"<i>✕</i>Did not recite review · tap to undo":"Did not recite review at all";
    f.querySelector("#qPlanR").textContent=rRows.length?rRows.map(r=>SURAH_NAMES[r.s]).join(" · "):"—";
    setTimeout(summary,0)};
  const grTxt=id=>{const x=f.querySelector("#"+id+"x");return x&&x.textContent?x.textContent.replace(/^(Auto|Suggested): /,"Grade: ").replace(/^.*→\s*/,"Grade: ")+" (auto)":""};
  const summary=()=>{
    {const g=q.h==="nr"||q.h==="none"?"":grTxt("s_hg");f.querySelector("#qHg").textContent=q.rep&&g?"Grade: Repeat · same portion next class":g;f.querySelector("#qRep").classList.toggle("hint",!q.rep&&/Repeat/.test(g))}
    f.querySelector("#qRg").textContent=rt.value==="nr"||rt.value==="none"?"":grTxt("s_rg")+(rRows.some(r=>r.skip)?` · ${rRows.filter(r=>!r.skip&&!r.buddy).length} of ${rRows.length} surahs`:"");
    const pt=(f.querySelector("#s_pts").textContent.match(/([+−-]?\d+)/)||[])[1];
    let s=[];const A={present:"On time",late:"Late",absent:"Absent",excused:"Excused"};s.push(A[q.att]);
    if(["present","late"].includes(q.att)){
      if(q.h==="all")s.push(`Hifz <b>full</b>, ${q.hm} ${q.hm===1?"mistake":"mistakes"}`);
      else if(q.h==="part"||q.h==="more"){const p=ps[q.stopK];s.push(`Hifz <b>to ${esc(SURAH_NAMES[p.s])} ${q.stopA}</b>, ${q.hm} ${q.hm===1?"mistake":"mistakes"}`)}
      else if(q.h==="custom")s.push(hRows.length?`Hifz <b>${esc(rowsText(hRows))}</b>, ${q.hm} ${q.hm===1?"mistake":"mistakes"}`:`Hifz <b>write the surah</b>`);
      else if(q.h==="nr")s.push(`Hifz <b>not recited</b>`);
      if(q.rep&&q.h!=="nr"&&q.h!=="none")s.push(`<b>Repeat</b> next class`);
      if(rt.value==="nr")s.push("Review <b>not recited</b>");else if(rRows.length)s.push(`Review <b>${rRows.filter(r=>!r.skip&&!r.buddy).length} of ${rRows.length}</b>`);
    }
    if(pt!=null)s.push(`<b>${esc(pt)} pts</b>`);
    f.querySelector("#qSum").innerHTML=s.join(" · ")};
  f.querySelectorAll("[data-qatt]").forEach(b=>b.onclick=()=>setAtt(b.dataset.qatt));
  {const cw=f.querySelector("#qCust"),hw=f.querySelector("#h_rowsW");if(hw)cw.appendChild(hw);
    const sync2=()=>setTimeout(()=>{q.rows=hRows.map(r=>({s:r.s,a1:r.a1,a2:r.a2}));busy=true;applyCounts();draw()},0);
    cw.addEventListener("change",sync2);cw.addEventListener("click",e=>{if(e.target.closest("button"))sync2()});
    f.querySelector("#qWrite").onclick=()=>{let rows;
      if(q.h==="part"||q.h==="more")rows=stopRows();else if(q.h==="all"&&defEnd!=null)rows=pieces(st.pos,defEnd);else rows=ps.length?[{s:ps[0].s,a1:ps[0].a1,a2:ps[0].a2}]:[];
      q.rows=rows.map(r=>({s:r.s,a1:r.a1,a2:r.a2}));setH("custom");applyCounts();const a=cw.querySelector(".a2");if(a)a.focus()}}
  f.querySelector("#qRep").onclick=()=>{q.rep=!q.rep;f._rep=q.rep;busy=true;draw()};
  f.querySelectorAll("[data-qh]").forEach(b=>b.onclick=()=>{const m=b.dataset.qh;
    if(m==="more"&&ps.length){const dp=defEnd!=null?pieces(st.pos,defEnd):[];const l=dp[dp.length-1];let k=l?ps.findIndex(x=>x.s===l.s&&x.a1===l.a1):-1;if(k<0){q.stopK=0;q.stopA=ps[0].a2}else if(l.a2<ps[k].a2){q.stopK=k;q.stopA=ps[k].a2}else{q.stopK=Math.min(ps.length-1,k+1);q.stopA=ps[q.stopK].a2}}
    if(m==="part"&&q.h==="more"){const dp=defEnd!=null?pieces(st.pos,defEnd):ps;const l=dp[dp.length-1];q.stopK=Math.max(0,ps.findIndex(x=>x.s===l.s&&x.a1===l.a1));q.stopA=l.a2}
    setH(m);applyCounts()});
  const raS=f.querySelector("#qRaS"),ra1=f.querySelector("#qRa1"),ra2=f.querySelector("#qRa2"),raF=f.querySelector("#qRaddF");
  const raFill=()=>{const x=Number(raS.value);ra1.value=1;ra2.value=QD.verses[x];ra2.max=ra1.max=QD.verses[x]};
  f.querySelector("#qRadd").onclick=()=>{raF.hidden=!raF.hidden;if(!raF.hidden)raFill()};raS.onchange=raFill;
  f.querySelector("#qRaOk").onclick=()=>{const x=Number(raS.value),v=QD.verses[x];let a=Math.max(1,Math.min(v,Number(ra1.value)||1)),z=Math.max(a,Math.min(v,Number(ra2.value)||v));
    if(rt.value==="nr"||rt.value==="none")rt.value="near";rRows.push({s:x,a1:a,a2:z,m:0,added:true});rR.draw();raF.hidden=true;busy=true;applyCounts();draw()};
  const smCount=(part,r)=>{let n=0;const a=ayahWord(r.s,r.a1),b=ayEndWord(r.s,r.a2);for(const[w,v]of SM)if(v.part===part&&v.k!=="hesitate"&&w>=a&&w<=b)n++;return n};
  const musItems=()=>{const it=[];let hr=null;if(["present","late"].includes(q.att)){if(q.h==="all"&&defEnd!=null)hr=pieces(st.pos,defEnd);else if((q.h==="part"||q.h==="more")&&ps.length)hr=stopRows();else if(q.h==="custom")hr=q.rows;
    if(hr&&hr.length)it.push({part:"h",rows:hr.map(r=>({s:r.s,a1:r.a1,a2:r.a2}))});
    if(rt.value!=="nr"&&rt.value!=="none")rRows.forEach((r,i)=>{if(!r.skip)it.push({part:"r",ri:i,rows:[{s:r.s,a1:r.a1,a2:r.a2}]})})}return it};
  const onMark=(part,k,d)=>{const o=part==="h"?q.hk:q.rk;o[k]=Math.max(0,(o[k]||0)+d);busy=true;applyCounts();draw()};
  const onRange=(it,rows)=>{
    if(it.part==="h"){q.rows=rows.map(r=>({...r}));setH("custom")}
    else{const old=rRows[it.ri]||{};rRows.splice(it.ri,1,...rows.map(r=>({...r,m:0,added:old.added})));rR.draw()}
    busy=true;applyCounts();draw();const items=musItems();return {items,idx:items.findIndex(x=>x.part===it.part&&(it.part==="h"||x.ri===it.ri))}};
  const openAt=fn=>{const it=musItems();if(!it.length)return;let i=it.findIndex(fn);openQMus(st,it,i<0?0:i,SM,onMark,onRange)};
  f.querySelector("#qMusAll").onclick=()=>openAt(()=>true);
  f.querySelector("#qMusH").onclick=()=>openAt(x=>x.part==="h");
  f.querySelector("#qMusR").onclick=()=>{const it=musItems().filter(x=>x.part==="r");if(it.length)openQMus(st,it,0,SM,onMark,(a,b)=>{const r=onRange(a,b);const its=r.items.filter(x=>x.part==="r");return {items:its,idx:its.findIndex(x=>x.ri===a.ri)}})};
  f.querySelector("#qChips").addEventListener("click",ev=>{const b=ev.target.closest("[data-qmus]");if(!b)return;ev.stopPropagation();const i=Number(b.dataset.qmus);openAt(x=>x.part==="r"&&x.ri===i)});
  if(SM.size)for(const[,v]of SM){if(dup&&dup.t&&!(v.t>dup.t))continue;if(!dup){const pv=events.filter(e=>e.type==="session"&&e.sid===st.id&&e.date===iso(today())).reduce((x,e)=>Math.max(x,e.t||0),0);if(pv&&!(v.t>pv))continue}const o=v.part==="h"?q.hk:q.rk;o[v.k]=(o[v.k]||0)+1}
  f.querySelectorAll("[data-qwhy]").forEach(b=>b.onclick=()=>{f._stopWhy=f._stopWhy===b.dataset.qwhy?null:b.dataset.qwhy;f.querySelectorAll("[data-qwhy]").forEach(x=>x.classList.toggle("on",x.dataset.qwhy===f._stopWhy));busy=true});

  f.querySelector("#qNone").onclick=()=>{setH(q.h==="none"?(defEnd!=null?"all":"none"):"none");applyCounts()};
  f.querySelector("#qStopS").onchange=e=>{q.stopK=Number(e.target.value);q.stopA=ps[q.stopK].a2;setH("part");applyCounts()};
  f.querySelector("#qStopA").oninput=e=>{const v=Number(e.target.value);if(v>0){q.stopA=v;const p=ps[q.stopK];if(v>=p.a1&&v<=p.a2){hs.value="custom";hR.set(stopRows());hs.dispatchEvent(new Event("change"));applyCounts();setTimeout(summary,0)}}};
  f.querySelector("#qStopA").onblur=()=>draw();
  const pm=(wrap,key)=>wrap.addEventListener("click",ev=>{const b=ev.target.closest(".qpm");if(!b)return;const o=q[key],k=b.dataset.k;o[k]=Math.max(0,(o[k]||0)+Number(b.dataset.d));busy=true;applyCounts();draw()});
  pm(f.querySelector("#qHm"),"hk");pm(f.querySelector("#qRm"),"rk");
  f.querySelector("#qSmart").addEventListener("click",ev=>{const b=ev.target.closest("[data-qsa]");if(!b)return;const x=Number(b.dataset.qsa);if(rt.value==="nr"||rt.value==="none"){rt.value="near";rt.dispatchEvent(new Event("change"))}rRows.push({s:x,a1:1,a2:QD.verses[x],m:0,added:true});rR.draw();busy=true;applyCounts();draw()});
  f.querySelectorAll("[data-qrt]").forEach(b=>b.onclick=()=>{rt.value=b.dataset.qrt;rt.dispatchEvent(new Event("change"));busy=true;applyCounts();draw()});
  let rBack=rt.value==="nr"?"near":rt.value;
  f.querySelector("#qRnr").onclick=()=>{if(rt.value!=="nr"){rBack=rt.value;rt.value="nr"}else rt.value=rBack;rt.dispatchEvent(new Event("change"));busy=true;applyCounts();draw()};
  const qa=f.querySelector("#qAdd");if(qa)qa.onclick=()=>{busy=false;go({...view,addMore:true})};
  f.addEventListener("input",()=>setTimeout(summary,0));f.addEventListener("change",()=>setTimeout(summary,0));
  // initial state
  const r0=f.querySelector(`input[name=att][value="${q.att}"]`);if(r0){r0.checked=true;sync()}
  if(dup||q.h!=="all")setH(q.h);
  applyCounts();draw();busy=false;
}
function renderSaved(el,sub,st){
  const d=view.d||{};sub.textContent="Saved · "+st.name;
  const list=st.cls?classOrder(st.cls):[];const i=list.findIndex(s=>s.id===st.id);
  const rest=[...list.slice(i+1),...list.slice(0,Math.max(0,i))];const nx=rest.find(s=>!doneToday(s.id))||null;
  const cl=classes.find(c=>c.id===st.cls);const done=list.filter(s=>doneToday(s.id)).length;
  const A={present:"On time",late:"Late",absent:"Absent",excused:"Excused"};
  const lines=[A[d.att]||""];
  if(attended(d)){if(d.hifzNR)lines.push("Hifz not recited");else if(d.hifzText)lines.push(`Hifz ${d.hifzText} · ${d.hifzMist||0} ${d.hifzMist===1?"mistake":"mistakes"}`);
    if(d.revNR)lines.push("Review not recited");else if(d.revType&&d.revType!=="none")lines.push(`Review ${(d.revRows||[]).length} of ${(d.revRows||[]).length+(d.revSkip||[]).length} · ${d.revMist||0} ${d.revMist===1?"mistake":"mistakes"}`)}
  lines.push(`${sgn(ptsOf(d))} points`);
  el.innerHTML=`<div class="qdone"><div class="ck">✓</div><div class="t">${esc(st.name)} saved</div><div class="d">${lines.map(esc).join("<br>")}</div></div>
   <div class="actions qcol">${nx?`<button class="primary qnext" id="qNext">Next student › ${esc(nx.name)}<small>${list.indexOf(nx)+1} of ${list.length}${cl?" in "+esc(cl.name):""}</small></button>`:`<div class="banner ok">Everyone in ${cl?esc(cl.name):"the class"} is recorded for today.</div>`}
   <button id="qBackSt">Back to ${esc(st.name)}'s page</button><button id="qBackList">Main list</button></div>
   ${msgPanel(st,d)}
   ${list.length?`<div class="panel"><div class="qh">${cl?esc(cl.name):"Class"} today <span class="n">${done} of ${list.length} done</span></div>
   <div class="qlst">${list.map(s=>`<button type="button" class="qrow" data-go="${s.id}"><span>${esc(s.name)}${flameChip(s)}</span>${doneToday(s.id)?'<span class="ok">✓ done</span>':s===nx?'<span class="muted">next</span>':'<span class="muted">—</span>'}</button>`).join("")}</div></div>`:""}`;
  const n=el.querySelector("#qNext");if(n)n.onclick=()=>go({name:"session",id:nx.id});
  el.querySelector("#qBackSt").onclick=()=>go({name:"student",id:st.id});
  el.querySelector("#qBackList").onclick=()=>go({name:"list"});wireMsg(el,st,d);
  el.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go({name:doneToday(b.dataset.go)?"student":"session",id:b.dataset.go}));
}
