// ---------- Quran heart: vector drawing with one region per surah (traced from Ahmed's picture) ----------
const HV=/*HEARTVEC*/;
const HEART={W:874,H:1213,paths:null};
function heartPaths(){if(!HEART.paths)HEART.paths=HV.p.map(d=>new Path2D(d));return HEART.paths}
let heartFontP=null;
function heartFont(){if(!heartFontP){injectFont();heartFontP=document.fonts.load('20px "KFGQPC Hafs"').catch(()=>null)}return heartFontP}
const HC={few:"#e6ece9",full:"#3fa27a",part:"#f4c452",newm:"#4a8fd9",strong:"#1f7a4a",good:"#7cc79a",weak:"#f0a04b",bad:"#e0604f",stale:"#cfe7d8",gold:"#d4a017"};
// share of each surah memorized (0..1) at a given pos in the student's sequence (earlier hifz counts in full)
function surahFrac(st,pos){useOrder(st);const f=new Array(114).fill(0);
  for(let s=0;s<114;s++)f[s]=covered(PREV_R,SURAH_A[s],SURAH_B[s]);
  pos=pos==null?Number(st.pos)||0:pos;for(const g of SEGS){if(pos<=g.s)break;f[g.surah]+=Math.min(pos,g.e)-g.s}
  return f.map((v,s)=>Math.min(1,v/Math.max(0.01,SURAH_B[s]-SURAH_A[s])))}
// where the student stood on a date: the "from" of the first hifz session on or after it
function posAt(st,date){const e=events.filter(x=>x.sid===st.id&&x.type==="session"&&x.from!=null&&x.date>=date).sort((a,b)=>a.date.localeCompare(b.date))[0];return e?Number(e.from):Number(st.pos)||0}
const monthStart=()=>iso(today()).slice(0,8)+"01";
// surahs lying wholly inside juz that passed their test
function passedSurahs(st){const s=status(st,events),out=new Set();if(!s.passed.size)return out;
  const R=[...s.passed].map(juzLines);for(let k=0;k<114;k++)if(covered(R,SURAH_A[k],SURAH_B[k])>=SURAH_B[k]-SURAH_A[k]-0.2)out.add(k);return out}
// strength: mistakes per page in the last 60 days (review and hifz rows, plus mistakes marked on the mushaf or listed in a session)
function surahStrength(st){const from=iso(addDays(today(),-60)),m=new Array(114).fill(0),pg=new Array(114).fill(0);
  for(const e of events){if(e.sid!==st.id||e.date<from)continue;
    let hr=e.hifzRows||[];if(e.pv>=2&&e.type==="session"&&!hr.length&&e.from!=null&&e.to!=null)try{hr=pieces(e.from,e.to)}catch(_){hr=[]}
    for(const r of [...(e.revRows||[]),...hr]){if(r.s==null)continue;pg[r.s]+=rowLines(r)/LINES;m[r.s]+=Number(r.m)||0}
    if(e.pv>=2)for(const [rows,mu0] of [[hr,e.hifzMu],[e.revRows||[],e.revMu]]){const mu=Number(mu0)||0;if(!mu||!rows.length)continue;const L=rows.map(r=>rowLines(r)),T=L.reduce((a,b)=>a+b,0)||1;rows.forEach((r,i)=>{if(r.s!=null)m[r.s]+=mu*L[i]/T})}
    if(Array.isArray(e.errs))for(const x of e.errs)if(x.s!=null)m[x.s]++}
  try{for(const k of marksOf(st))if(k.date>=from&&!k.fixed&&k.k!=="hesitate"){const p=wordPlace(k.w);m[p.s]++}}catch(_){}
  return m.map((v,s)=>{if(!(pg[s]>0||v>0))return null;v=Math.round(v*10)/10;const sp=rowLines({s,a1:1,a2:QD.verses[s]})/LINES;return {m:v,pg:pg[s],sp,few:pg[s]<Math.min(1,0.5*sp),rate:v/Math.max(0.5,pg[s])}})}
function strengthLevel(x){if(!x)return "stale";if(x.few&&!(x.m>0))return "few";return x.rate<0.5?"strong":x.rate<1.5?"good":x.rate<3?"weak":"bad"}
const STR_TEXT={few:"Too little heard to judge",strong:"Strong",good:"Good",weak:"Needs review",bad:"Weak",stale:"Not heard in 60 days"};
// colours for one view: progress | strength | month
function heartView(st,mode){const fr=surahFrac(st),col=new Array(115).fill(null),info=[];
  if(mode==="strength"){const S=surahStrength(st);for(let s=0;s<114;s++){if(fr[s]<0.005){info[s]="not memorized yet";continue}const l=strengthLevel(S[s]);col[s]=HC[l];info[s]=`${STR_TEXT[l]}${S[s]?` · ${S[s].m} ${S[s].m===1?"mistake":"mistakes"} in ${Math.round(S[s].pg*10)/10} of ${Math.round(S[s].sp*10)/10} pages heard (last 60 days)`:""}`}}
  else if(mode==="month"){const f0=surahFrac(st,posAt(st,monthStart()));for(let s=0;s<114;s++){const p=Math.round(fr[s]*100);
    if(fr[s]>=0.98&&f0[s]<0.98){col[s]=HC.newm;info[s]="completed this month"}else if(fr[s]>=0.98){col[s]=HC.full;info[s]="memorized before this month"}else if(fr[s]>0.005){col[s]=HC.part;info[s]=`${p}% memorized${fr[s]-f0[s]>0.005?` (+${Math.round((fr[s]-f0[s])*100)}% this month)`:""}`}else info[s]="not memorized yet"}}
  else for(let s=0;s<114;s++){const p=Math.round(fr[s]*100);col[s]=fr[s]>=0.98?HC.full:fr[s]>0.005?HC.part:null;info[s]=p>=98?"memorized":p>0?p+"% memorized":"not memorized yet"}
  return {col,info,gold:passedSurahs(st),fr}}
// draw at any size: k = pixels per picture unit
function heartDraw(cv,view,widthPx){const P=heartPaths(),k=widthPx/HEART.W;cv.width=Math.round(widthPx);cv.height=Math.round(HEART.H*k);
  const x=cv.getContext("2d");x.setTransform(1,0,0,1,0,0);x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.setTransform(k,0,0,k,0,0);
  for(let i=0;i<P.length;i++){x.fillStyle=view.col[i]||"#fff";x.fill(P[i])}
  x.lineJoin="round";x.lineCap="round";
  for(const s of view.gold){x.save();x.clip(P[s]);x.strokeStyle=view.bandColor||HC.gold;x.lineWidth=15;x.stroke(P[s]);x.restore()}
  x.strokeStyle="#1d2421";x.lineWidth=6.2;for(const p of P)x.stroke(p);
  x.fillStyle="#141a18";x.textAlign="center";x.textBaseline="middle";x.direction="rtl";
  HV.t.forEach(([tx,ty,a,f],s)=>{x.save();x.translate(tx,ty+f*0.08);if(a)x.rotate(a*Math.PI/180);x.font=`${f}px "KFGQPC Hafs",serif`;x.strokeStyle="#141a18";x.lineWidth=0.35;x.strokeText(HV.n[s],0,0);x.fillText(HV.n[s],0,0);x.restore()});
  return cv}
function heartHit(cv,e){const r=cv.getBoundingClientRect(),X=(e.clientX-r.left)/r.width*HEART.W,Y=(e.clientY-r.top)/r.height*HEART.H;
  const x=cv.getContext("2d");x.save();x.setTransform(1,0,0,1,0,0);const P=heartPaths();let hit=-1;for(let i=0;i<114;i++)if(x.isPointInPath(P[i],X,Y)){hit=i;break}x.restore();return hit}
const heartPct=st=>{useOrder(st);return Math.round((Number(st.pos||0)+PREV_LINES)/ALL*1000)/10};
function heartCounts(fr){return {full:fr.filter(v=>v>=0.98).length,part:fr.filter(v=>v>0.005&&v<0.98).length}}
const HKEYS={progress:[["full","Memorized"],["part","Partly memorized"],[null,"Not yet"]],
  strength:[["strong","Strong"],["good","Good"],["weak","Needs review"],["bad","Weak"],["stale","Not heard in 60 days"]],
  month:[["newm","Completed this month"],["full","Memorized before"],["part","Partly memorized"]]};
const keyHTML=mode=>HKEYS[mode].map(([c,l])=>`<span class="hki"><span class="hk" style="background:${c?HC[c]:"#fff"}"></span>${l}</span>`).join("")+`<span class="hki"><span class="hk" style="background:#fff;border:3px solid ${HC.gold}"></span>Juz passed its test</span>`;
const HMODES={progress:"Progress",strength:"Strength",month:"This month"};
function heartPanel(st){const fr=surahFrac(st),c=heartCounts(fr),pc=heartPct(st),mode=view.hmode||"progress";
  return `<div class="panel" id="heartPanel"><div class="head"><h3>Quran heart</h3><span class="chip plain big">${pc}% of the Quran</span></div>
  <div class="bar" aria-label="Progress"><i style="width:${pc}%"></i></div>
  <p class="small muted">${c.full} of 114 surahs memorized${c.part?` · ${c.part} in progress`:""} · ${pagesOf(Number(st.pos||0)+PREV_LINES)} of 604 pages</p>
  <div class="filters" role="group" aria-label="Heart view">${Object.entries(HMODES).map(([k,l])=>`<button type="button" class="fbtn ${k===mode?"on":""}" data-hm="${k}">${l}</button>`).join("")}</div>
  <div class="heartscroll"><div class="heartbox"><canvas id="heartCv" aria-label="Quran heart"></canvas></div></div>
  <p class="small muted heartkey">${keyHTML(mode)}<span>Tap a surah for details.</span></p>
  <p class="small" id="heartInfo" aria-live="polite"></p>
  <div class="actions"><button id="heartZoom">Enlarge</button><button class="primary" id="heartDl" ${downloads?"":"hidden"}>Download PDF for parents</button><button id="heartDlM" ${downloads?"":"hidden"}>Monthly heart PDF</button><span class="small muted" id="heartMsg"></span></div></div>`}
function wireHeart(el,st){const cv=el.querySelector("#heartCv");if(!cv)return;const mode=view.hmode||"progress";const v=heartView(st,mode);
  const box=el.querySelector(".heartbox");const draw=()=>heartFont().then(()=>heartDraw(cv,v,Math.min(4000,Math.max(600,box.clientWidth*(window.devicePixelRatio||1)*1.5))));draw();
  el.querySelectorAll("[data-hm]").forEach(b=>b.onclick=()=>{view.hmode=b.dataset.hm;render(true)});
  const z=el.querySelector("#heartZoom");z.onclick=()=>{const p=el.querySelector("#heartPanel");p.classList.toggle("zoomed");z.textContent=p.classList.contains("zoomed")?"Smaller":"Enlarge";draw()};
  el.querySelector("#heartDl").onclick=()=>heartFont().then(()=>saveFile(`quran-heart-${fileSafe(st.name)}-${iso(today())}.html`,heartDoc(st,"progress"),el.querySelector("#heartMsg")));
  el.querySelector("#heartDlM").onclick=()=>heartFont().then(()=>saveFile(`monthly-heart-${fileSafe(st.name)}-${iso(today()).slice(0,7)}.html`,heartDoc(st,"month"),el.querySelector("#heartMsg")));
  cv.onclick=e=>{const s=heartHit(cv,e),info=el.querySelector("#heartInfo");info.textContent=s<0?"":`${s+1}. ${SURAH_NAMES[s]}: ${v.info[s]}${v.gold.has(s)?" · juz test passed":""}`}}
function heartImg(st,mode,w){return heartDraw(document.createElement("canvas"),heartView(st,mode),w||2200).toDataURL("image/jpeg",0.92)}
function heartDoc(st,mode){const v=heartView(st,mode),fr=v.fr,c=heartCounts(fr),pc=heartPct(st),ms=monthStart();
  const nm=s=>SURAH_NAMES[s],done=[],part=[],neu=[];for(let s=0;s<114;s++){if(fr[s]>=0.98)(mode==="month"&&v.col[s]===HC.newm?neu:done).push(nm(s));else if(fr[s]>0.005)part.push(`${nm(s)} (${Math.round(fr[s]*100)}%)`)}
  const p0=mode==="month"?Math.round((posAt(st,ms)+PREV_LINES)/ALL*1000)/10:null;
  const mName=today().toLocaleString("en",{month:"long",year:"numeric"});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Quran heart - ${esc(st.name)}</title><style>${PRINT_CSS}
  .hh{text-align:center}.hh h1{margin:0 0 2px}.big{font-size:28px;font-weight:700;color:#0d6b5e;margin:4px 0}.bar{height:10px;background:#dce3e0;border-radius:9px;overflow:hidden;margin:6px auto 8px;width:70%}.bar i{display:block;height:100%;background:#0d6b5e}
  .key{font-size:12px}.key span{display:inline-block;width:12px;height:12px;border:1px solid #888;vertical-align:middle;margin:0 4px 0 12px}.lst{font-size:12px;margin-top:6px}.new{color:#2f6db0}</style></head><body>
  <div class="hh"><h1>${esc(st.name)} · ${mode==="month"?`Monthly heart · ${mName}`:"Quran heart"}</h1><p>${fmt(today())} ${today().getFullYear()}</p>
  <div class="big">${pc}% of the Quran memorized</div><div class="bar"><i style="width:${pc}%"></i></div>
  <p>${c.full} of 114 surahs memorized${c.part?`, ${c.part} in progress`:""} · ${pagesOf(Number(st.pos||0)+PREV_LINES)} of 604 pages${p0!=null?` · <b class="new">+${Math.round((pc-p0)*10)/10}% this month</b>`:""}</p>
  <img src="${heartImg(st,mode)}" alt="Quran heart" style="width:480px;height:auto">
  <p class="key">${HKEYS[mode].map(([k,l])=>`<span style="background:${k?HC[k]:"#fff"}"></span>${l}`).join("")}<span style="border:3px solid ${HC.gold}"></span>Juz passed its test</p></div>
  ${neu.length?`<p class="lst new"><b>Completed this month:</b> ${neu.join(", ")}</p>`:mode==="month"?`<p class="lst">No surah completed yet this month.</p>`:""}
  ${done.length?`<p class="lst"><b>${mode==="month"?"Memorized before":"Memorized"}:</b> ${done.join(", ")}</p>`:""}${part.length?`<p class="lst"><b>In progress:</b> ${part.join(", ")}</p>`:""}
  </body></html>`}
function heartImgHTML(st){const fr=surahFrac(st),c=heartCounts(fr);
  return `<h2>Quran heart</h2><p>${heartPct(st)}% of the Quran memorized · ${c.full} of 114 surahs memorized${c.part?`, ${c.part} in progress`:""}. Green: memorized. Yellow: partly memorized. Gold border: juz passed its test.</p><div style="text-align:center"><img src="${heartImg(st,"progress",1400)}" alt="Quran heart" style="width:320px;max-width:100%;height:auto"></div>`}
heartFont();
