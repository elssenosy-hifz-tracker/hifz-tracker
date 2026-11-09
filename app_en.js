
// ---------- Quran data (Madinah mushaf, 604 pages, 15 lines; ayah line positions are estimates) ----------
const QD=/*QDATA*/;
const SURAH_NAMES="Al-Fatihah|Al-Baqarah|Al Imran|An-Nisa|Al-Ma'idah|Al-An'am|Al-A'raf|Al-Anfal|At-Tawbah|Yunus|Hud|Yusuf|Ar-Ra'd|Ibrahim|Al-Hijr|An-Nahl|Al-Isra|Al-Kahf|Maryam|Ta-Ha|Al-Anbiya|Al-Hajj|Al-Mu'minun|An-Nur|Al-Furqan|Ash-Shu'ara|An-Naml|Al-Qasas|Al-Ankabut|Ar-Rum|Luqman|As-Sajdah|Al-Ahzab|Saba|Fatir|Ya-Sin|As-Saffat|Sad|Az-Zumar|Ghafir|Fussilat|Ash-Shura|Az-Zukhruf|Ad-Dukhan|Al-Jathiyah|Al-Ahqaf|Muhammad|Al-Fath|Al-Hujurat|Qaf|Adh-Dhariyat|At-Tur|An-Najm|Al-Qamar|Ar-Rahman|Al-Waqi'ah|Al-Hadid|Al-Mujadilah|Al-Hashr|Al-Mumtahanah|As-Saff|Al-Jumu'ah|Al-Munafiqun|At-Taghabun|At-Talaq|At-Tahrim|Al-Mulk|Al-Qalam|Al-Haqqah|Al-Ma'arij|Nuh|Al-Jinn|Al-Muzzammil|Al-Muddaththir|Al-Qiyamah|Al-Insan|Al-Mursalat|An-Naba|An-Nazi'at|Abasa|At-Takwir|Al-Infitar|Al-Mutaffifin|Al-Inshiqaq|Al-Buruj|At-Tariq|Al-A'la|Al-Ghashiyah|Al-Fajr|Al-Balad|Ash-Shams|Al-Layl|Ad-Duha|Ash-Sharh|At-Tin|Al-Alaq|Al-Qadr|Al-Bayyinah|Az-Zalzalah|Al-Adiyat|Al-Qari'ah|At-Takathur|Al-Asr|Al-Humazah|Al-Fil|Quraysh|Al-Ma'un|Al-Kawthar|Al-Kafirun|An-Nasr|Al-Masad|Al-Ikhlas|Al-Falaq|An-Nas".split("|");
const JUZ_START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
const LINES=15, ALL=604*LINES, AY=QD.ayStart, NAY=AY.length;
const SURAH_FIRST=[];{let g=0;for(const v of QD.verses){SURAH_FIRST.push(g);g+=v}}
const AY_SURAH=new Int16Array(NAY);for(let s=0;s<114;s++)for(let k=0;k<QD.verses[s];k++)AY_SURAH[SURAH_FIRST[s]+k]=s;
const hdrOf=s=>(s===0||s===8)?1:2;
const SURAH_A=SURAH_FIRST.map((g,s)=>Math.max(0,AY[g]-hdrOf(s)));
const SURAH_B=SURAH_A.map((a,s)=>s<113?SURAH_A[s+1]:ALL);
const pageOf=line=>Math.min(604,Math.floor(line/LINES)+1);
const juzOfPage=p=>{let j=1;for(let i=0;i<30;i++)if(JUZ_START[i]<=p)j=i+1;return j};
const surahStartJuz=s=>juzOfPage(pageOf(SURAH_A[s]+0.01));

// Hifz order per student: "nas" (An-Nas, Al-Falaq … up to Al-Fatihah, each surah from its start) or "fatiha" (mushaf order)
const ORDER_NAMES={nas:"Toward Al-Fatihah (An-Nas, Al-Falaq …)",fatiha:"Toward An-Nas (mushaf order)"};
const ORDER_SHORT={nas:"toward Al-Fatihah",fatiha:"toward An-Nas"};
const defStart=k=>k==="fatiha"?0:113;
const startOf=st=>{const k=(st&&st.order)==="fatiha"?"fatiha":"nas";const v=st&&st.startS!=null?Number(st.startS):defStart(k);return v>=0&&v<114?v:defStart(k)};
let SEGS,JUZ_SEQ,TOTAL,JUZ_ORDER,BOUND,SEQ_SURAHS,ORDER_KEY=null;const ORD={};
const juzLines=j=>[(JUZ_START[j-1]-1)*LINES,j===30?ALL:(JUZ_START[j]-1)*LINES];
// prevR: global line ranges memorized before the program (whole surahs; legacy students may have whole juz); skipped in new hifz and reviewed in the far review straight away
function mergeRanges(rs){rs=rs.filter(r=>r[1]-r[0]>0.05).sort((x,y)=>x[0]-y[0]);const out=[];for(const r of rs){const l=out[out.length-1];if(l&&r[0]<=l[1]+0.05)l[1]=Math.max(l[1],r[1]);else out.push([r[0],r[1]])}return out}
function prevRangesOf(st){if(!st)return [];
  if(Array.isArray(st.prevS))return mergeRanges(st.prevS.map(Number).filter(x=>x>=0&&x<114).map(x=>[SURAH_A[x],SURAH_B[x]]));
  return mergeRanges((st.prev||[]).map(Number).filter(j=>j>=1&&j<=30).map(juzLines))}
const covered=(ex,a,b)=>{let t=0;for(const[xa,xb]of ex)t+=Math.max(0,Math.min(b,xb)-Math.max(a,xa));return t};
// the student's own hifz sequence: from the start surah in the chosen direction, then wrapping round to the rest of the Quran
function buildOrder(key,ex,st0){
  const segs=[],list=[];if(st0==null)st0=defStart(key);
  if(key==="fatiha"){for(let s=st0;s<114;s++)list.push(s);for(let s=0;s<st0;s++)list.push(s)}else{for(let s=st0;s>=0;s--)list.push(s);for(let s=113;s>st0;s--)list.push(s)}
  for(const s of list){let parts=[[SURAH_A[s],SURAH_B[s]]];
    for(const[xa,xb]of ex)parts=parts.flatMap(([a,b])=>b<=xa||a>=xb?[[a,b]]:[[a,Math.min(b,xa)],[Math.max(a,xb),b]].filter(([p,q])=>q-p>0.05));
    for(const[a,b]of parts){const p0=segs.length?segs[segs.length-1].e:0;segs.push({a,b,s:p0,e:p0+(b-a),surah:s})}}
  const total=segs.length?segs[segs.length-1].e:0;
  const prev=[];for(let j=1;j<=30;j++){const[ja,jb]=juzLines(j);if(covered(ex,ja,jb)>=jb-ja-0.1)prev.push(j)}
  const juzSeq=[];for(let j=1;j<=30;j++){if(prev.includes(j))continue;const[ja,jb]=juzLines(j);let end=0;
    for(const g of segs){const a=Math.max(g.a,ja),b=Math.min(g.b,jb);if(b-a>0.05)end=Math.max(end,g.s+(b-g.a))}juzSeq.push({juz:j,end})}
  juzSeq.sort((x,y)=>x.end-y.end);
  const bound=[];
  for(const g of segs){bound.push(g.s);const s=g.surah;for(let k=1;k<QD.verses[s];k++){const at=AY[SURAH_FIRST[s]+k];if(at>g.a+0.05&&at<g.b-0.05)bound.push(g.s+at-g.a)}bound.push(g.e)}
  bound.sort((x,y)=>x-y);
  const prevSorted=prev.slice().sort((a,b)=>key==="fatiha"?a-b:b-a);
  const prevR=ex.slice().sort((x,y)=>key==="fatiha"?x[0]-y[0]:y[0]-x[0]);
  return {segs,juzSeq,total,juzOrder:[...prevSorted,...juzSeq.map(x=>x.juz)],bound,surahs:list,prev:prevSorted,prevR,prevLines:ex.reduce((t,r)=>t+r[1]-r[0],0)};
}
let PREV=[],PREV_R=[],PREV_LINES=0;
function useOrder(st){const k0=(st&&st.order)==="fatiha"?"fatiha":"nas";const ex=prevRangesOf(st);
  const s0=startOf(st);const key=k0+"|"+s0+"|"+ex.map(r=>r[0].toFixed(2)+"-"+r[1].toFixed(2)).join(",");if(key===ORDER_KEY)return;
  const o=ORD[key]||(ORD[key]=buildOrder(k0,ex,s0));ORDER_KEY=key;SEGS=o.segs;JUZ_SEQ=o.juzSeq;TOTAL=o.total;JUZ_ORDER=o.juzOrder;BOUND=o.bound;SEQ_SURAHS=o.surahs;PREV=o.prev;PREV_R=o.prevR;PREV_LINES=o.prevLines}
// short text for what was memorized before: whole juz first, then other surahs
function prevSummary(){if(!PREV_R.length)return "";const full=PREV.slice().sort((a,b)=>a-b);const fullR=full.map(juzLines);
  const others=[];for(const[a,b]of PREV_R)for(const p of globalPieces(a,b,[])){const ga=SURAH_A[p.s];if(covered(fullR,ga+0.1,ga+0.2)>0)continue;others.push(pieceText(p))}
  const parts=[];if(full.length)parts.push("juz "+full.join(", "));if(others.length)parts.push(others.length>6?others.slice(0,6).join(", ")+` and ${others.length-6} more surahs`:others.join(", "));
  return parts.join(" + ")+` (${pagesOf(PREV_LINES)} p)`}
const orderName=()=>{const[k,s0]=ORDER_KEY.split("|");return Number(s0)===defStart(k)?(k==="fatiha"?"From Al-Fatihah":"From An-Nas"):`From ${SURAH_NAMES[Number(s0)]}, ${ORDER_SHORT[k]}`};
useOrder(null);
function nearestBound(x){if(!BOUND.length)return 0;let lo=0,hi=BOUND.length-1;while(lo<hi){const m=(lo+hi)>>1;if(BOUND[m]<x)lo=m+1;else hi=m}
  const c=BOUND[lo],p=lo>0?BOUND[lo-1]:c;return Math.abs(p-x)<=Math.abs(c-x)?p:c}
const nextBound=x=>{for(const b of BOUND)if(b>x+0.01)return b;return TOTAL};
function portionEnd(pos,amt){if(pos>=TOTAL)return TOTAL;let e=nearestBound(Math.min(TOTAL,pos+amt));if(e<=pos+0.01)e=nextBound(pos);return e}
// amount units: -1 = one surah, -4 = one rub' (quarter of a hizb, 240 in the Quran)
const RUB_ID=[1,33,51,67,82,99,113,131,149,165,184,196,210,226,240,250,260,270,279,290,308,326,345,368,386,406,426,446,464,479,494,505,517,529,551,567,581,593,607,628,641,656,670,681,696,710,720,736,751,766,778,802,825,848,863,884,900,916,930,940,955,985,1001,1019,1042,1071,1096,1110,1125,1143,1161,1182,1201,1221,1236,1254,1269,1281,1295,1310,1328,1346,1357,1375,1390,1417,1435,1454,1479,1497,1514,1534,1557,1581,1603,1626,1649,1673,1697,1712,1726,1742,1760,1778,1803,1852,1902,1931,1952,1976,1991,2012,2030,2052,2079,2099,2128,2157,2172,2191,2215,2239,2272,2309,2349,2403,2431,2459,2484,2512,2534,2566,2596,2614,2633,2655,2674,2709,2748,2792,2812,2826,2844,2856,2876,2908,2933,2984,3043,3113,3160,3186,3215,3241,3264,3281,3303,3328,3341,3366,3386,3410,3440,3463,3491,3514,3534,3551,3564,3584,3593,3616,3630,3652,3675,3701,3733,3765,3810,3871,3933,3991,4022,4066,4090,4111,4134,4154,4174,4199,4227,4243,4265,4285,4299,4323,4349,4382,4431,4485,4511,4531,4555,4578,4601,4613,4626,4657,4706,4759,4810,4855,4902,4980,5054,5091,5105,5118,5137,5157,5178,5192,5218,5230,5242,5272,5324,5394,5448,5495,5552,5610,5673,5759,5830,5885,5949,6024,6091,6155],RUB_L=RUB_ID.map(i=>AY[i-1]);
const segAt=pos=>{for(const g of SEGS)if(pos>=g.s-0.001&&pos<g.e-0.001)return g;return null};
function unitEnd(pos,code){if(pos>=TOTAL)return TOTAL;const g=segAt(pos);if(!g)return TOTAL;
  if(code===-1){let k=SEGS.indexOf(g);while(k+1<SEGS.length&&SEGS[k+1].surah===g.surah&&Math.abs(SEGS[k+1].s-SEGS[k].e)<0.01)k++;return SEGS[k].e}
  const g0=g.a+(pos-g.s),Q=RUB_L.find(q=>q>g0+0.05);
  if(Q!=null&&Q<=g.b+0.05&&Q-g0>=0.4*ALL/240)return Math.min(g.e,g.s+(Q-g.a));
  const i=RUB_L.findIndex(q=>q>g0+0.05),len=(i<0?ALL:RUB_L[i])-(i<=0?0:RUB_L[i-1]);return portionEnd(pos,len)}
function unitStart(pos,code){if(pos<=0)return 0;const g=segAt(pos-0.01);if(!g)return 0;
  if(code===-1){let k=SEGS.indexOf(g);while(k>0&&SEGS[k-1].surah===g.surah&&Math.abs(SEGS[k].s-SEGS[k-1].e)<0.01)k--;return SEGS[k].s}
  const g0=g.a+(pos-0.01-g.s);let Q=null;for(const q of RUB_L)if(q<=g0)Q=q;return Q!=null&&Q>=g.a?g.s+(Q-g.a):g.s}
const stEnd=(pos,amt,n=1)=>{if(amt<0){for(let i=0;i<n&&pos<TOTAL;i++)pos=unitEnd(pos,amt);return pos}return portionEnd(pos,amt*n)};
const stBack=(pos,amt,n=1)=>{if(amt===-4)return snap(Math.max(0,pos-n*ALL/240));if(amt<0){for(let i=0;i<n&&pos>0;i++)pos=unitStart(pos,amt);return pos}return snap(Math.max(0,pos-amt*n))};
const snap=x=>x<=0?0:x>=TOTAL?TOTAL:nearestBound(x);
function seqToGlobal(x){for(const g of SEGS)if(x>=g.s&&x<g.e)return g.a+(x-g.s);return ALL}
function ayahAt(line){let lo=0,hi=NAY-1;while(lo<hi){const m=(lo+hi+1)>>1;if(AY[m]<=line)lo=m;else hi=m-1}return lo}
function pieces(x,y){ // [x,y) in sequence -> [{s,a1,a2}] in reading order
  const out=[];
  for(const g of SEGS){const a=Math.max(x,g.s),b=Math.min(y,g.e);if(b-a<0.05)continue;globalPieces(g.a+(a-g.s),g.a+(b-g.s),out)}
  return out;
}
function globalPieces(ga,gb,out){
    let i0=ayahAt(ga+0.06);const i1=ayahAt(gb-0.06);
    if(i0+1<NAY&&AY_SURAH[i0+1]!==AY_SURAH[i0]&&SURAH_A[AY_SURAH[i0+1]]<=ga+0.06)i0++;
    for(let i=i0;i<=i1;){const s=AY_SURAH[i];const last=Math.min(i1,SURAH_FIRST[s]+QD.verses[s]-1);
      const p=out[out.length-1],a1=i-SURAH_FIRST[s]+1,a2=last-SURAH_FIRST[s]+1;
      if(p&&p.s===s&&p.a2+1>=a1)p.a2=Math.max(p.a2,a2);else out.push({s,a1,a2});i=last+1}
  return out;
}
const pieceText=p=>(p.a1===1&&p.a2===QD.verses[p.s])?SURAH_NAMES[p.s]:p.a1===p.a2?`${SURAH_NAMES[p.s]} ${p.a1}`:`${SURAH_NAMES[p.s]} ${p.a1}–${p.a2}`;
function rangeText(x,y){
  if(y-x<0.05)return "—";
  const ps=pieces(x,y);if(!ps.length)return "—";
  const lines=y-x, size=lines>=LINES*0.9?` (${Math.round(lines/LINES*10)/10} p)`:"";
  if(ps.length<=3)return ps.map(pieceText).join(", ")+size;
  const f=ps[0],l=ps[ps.length-1];
  return `${SURAH_NAMES[f.s]} ${f.a1} to ${SURAH_NAMES[l.s]} ${l.a2}${size}`;
}
const juzDoneList=pos=>[...PREV,...JUZ_SEQ.filter(x=>x.end<=pos+0.05).map(x=>x.juz)];
const currentJuz=pos=>pos>=TOTAL-0.05?null:juzOfPage(pageOf(seqToGlobal(pos+0.06)));
function posAfterAyah(s,a){ // sequence position right after ayah a of surah s
  const i=SURAH_FIRST[s]+a-1, gEnd=(a<QD.verses[s])?AY[i+1]:SURAH_B[s];
  const probe=gEnd-0.05;let g=SEGS.find(g=>g.surah===s&&probe>=g.a&&probe<g.b);if(g)return snap(g.s+gEnd-g.a);
  g=SEGS.filter(g=>g.surah===s&&g.b<=probe).pop();return g?g.e:0;
}
function lastAyahOf(pos){if(pos<=0)return null;const ps=pieces(Math.max(0,pos-0.5),pos);return ps.length?ps[ps.length-1]:null}

// ---------- helpers ----------
const DAY_NAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FAR_DAYS=[3,5,7,10,15];const farDaysOf=st=>FAR_DAYS.includes(Number(st&&st.farDays))?Number(st.farDays):7;
const AMOUNTS=[[1,"1 line"],[2,"2 lines"],[3,"3 lines"],[4,"4 lines"],[5,"5 lines"],[6,"6 lines"],[7.5,"Half a page"],[10,"10 lines"],[15,"1 page"],[22.5,"1.5 pages"],[30,"2 pages"],[-4,"1 rub' (quarter hizb)"],[-1,"1 surah"]];
const amountLabel=v=>(AMOUNTS.find(a=>a[0]===v)||[0,v+" lines"])[1];
const GRADES=["Excellent","Very good","Good","Pass","Repeat"];
const GRADE_AR={"ممتاز":"Excellent","جيد جدًا":"Very good","جيد جدا":"Very good","جيد":"Good","مقبول":"Pass","يُعاد":"Repeat","يعاد":"Repeat"};
const gradeEn=g=>GRADE_AR[g]||g||"";
const READS=[[0,"No daily reading"],[1,"1 page"],[2,"2 pages"],[3,"3 pages"],[4,"4 pages"],[5,"5 pages"],[10,"Half a juz (10 pages)"],[20,"1 juz (20 pages)"],[40,"2 juz (40 pages)"],[60,"3 juz (60 pages)"]];
const readLabel=v=>(READS.find(r=>r[0]===v)||[0,v+" pages"])[1];
const clsRead=c=>c&&c.readDef!=null?Number(c.readDef):20;
const readOf=st=>st.readPages!=null?Number(st.readPages):clsRead(classes.find(c=>c.id===st.cls));
function readText(st,dn,date){const rp=readOf(st);if(!rp)return "—";if(st.readFrom&&date){dn=daysBetween(parse(st.readFrom),date);if(dn<0)return `Starts on ${fmtShort(st.readFrom)}`}
  const start=Math.max(1,Math.min(604,Number(st.readStart)||1));const a=((start-1+dn*rp)%604+604)%604+1,b=Math.min(604,a+rp-1);
  const pl=wordPlace(MUS.p[a-1]);return `Pages ${a}${b>a?"–"+b:""} · from ${SURAH_NAMES[pl.s]} ${pl.a}`}
const BEH=[["focus","Focused","good"],["helpful","Helped others","good"],["polite","Polite and respectful","good"],["effort","Extra effort","good"],["sleepy","Sleepy","bad"],["talk","Talking, distracting others","bad"],["disrupt","Interrupted the class","bad"],["playing","Playing or on the phone","bad"]];
const PTS_DEF={onTime:2,late:0,absent:-2,homework:3,hwNot:-2,hifz0:5,hifz12:3,hifz3:1,rev0:3,rev13:2,rev4:1,hifzNR:-2,revNR:-2,b_focus:2,b_helpful:2,b_polite:1,b_effort:2,b_sleepy:-2,b_talk:-2,b_disrupt:-3,b_playing:-2,juzTest:20,monthly5:10,monthly4:5};
const PTS_GROUPS=[["Attendance",[["onTime","Came on time"],["late","Came late"],["absent","Absent without excuse"]]],["Homework",[["homework","Homework done"],["hwNot","Homework not done"]]],["Recitation",[["hifz0","New hifz: Excellent"],["hifz12","New hifz: Very good or Good"],["hifz3","New hifz: Pass or Repeat"],["rev0","Review: Excellent"],["rev13","Review: Very good or Good"],["rev4","Review: Pass or Repeat"],["hifzNR","New hifz: not ready"],["revNR","Review: not ready"]]],["Behaviour (good)",BEH.filter(b=>b[2]==="good").map(b=>["b_"+b[0],b[1]])],["Behaviour (needs work, minus points)",BEH.filter(b=>b[2]==="bad").map(b=>["b_"+b[0],b[1]])],["Tests",[["juzTest","Passed a juz test"],["monthly5","Monthly test, all correct"],["monthly4","Monthly test, one wrong"]]]];
const PTS_LABELS=PTS_GROUPS.flatMap(g=>g[1]);
const PTS=()=>{const p={...PTS_DEF,...((settings.main||{}).points||{})};for(const b of BEH)if(b[2]==="bad")p["b_"+b[0]]=-Math.abs(p["b_"+b[0]]);p.hwNot=-Math.abs(p.hwNot);p.hifzNR=-Math.abs(p.hifzNR);p.revNR=-Math.abs(p.revNR);p.absent=-Math.abs(p.absent);return p};
const attended=e=>e.att==="present"||e.att==="late";
// every line of points with its reason, so the teacher sees where a total comes from
// from 6 Nov 2026 recitation points follow the grade (mistakes per page), like the grade itself; older records keep the old count rule
const PTS_GRADE_FROM="2026-11-06";
const gBand=g=>{g=gradeEn(g);return g==="Excellent"?0:g==="Very good"||g==="Good"?1:g==="Pass"||g==="Repeat"?2:null};
// a class can be set to "no minus points": minus values are left out for its students
const noNegFor=sid=>{const st=allStudents.find(s=>s.id===sid);const c=st&&classes.find(c=>c.id===st.cls);return !!(c&&c.noNeg)};
function ptsBreak(e){const p=PTS(),o=[],nn=noNegFor(e.sid),add=(k,l)=>{if(p[k]&&!(nn&&p[k]<0))o.push([l,p[k]])};
  if(e.type==="session"){if(e.att==="present")add("onTime","On time");else if(e.att==="late")add("late","Late");else if(e.att==="absent")add("absent","Absent");
    if(attended(e)){if(e.hw===true)add("homework","Homework done");else if(e.hw===false)add("hwNot","Homework not done");
      const byG=e.date>=PTS_GRADE_FROM;if(e.hifzLines>0){const m=e.hifzMist||0,b=byG?gBand(e.hifzGrade):null;if(b!=null)add(["hifz0","hifz12","hifz3"][b],["Hifz, excellent","Hifz, very good or good","Hifz, pass or repeat"][b]);else m===0?add("hifz0","Hifz, no mistakes"):m<=2?add("hifz12","Hifz, 1–2 mistakes"):add("hifz3","Hifz, 3+ mistakes")}
      if(e.revType&&e.revType!=="none"&&!(e.pv>=2&&!(e.revRows||[]).length)){const m=e.revMist||0,b=byG?gBand(e.revGrade):null;if(b!=null)add(["rev0","rev13","rev4"][b],["Review, excellent","Review, very good or good","Review, pass or repeat"][b]);else m===0?add("rev0","Review, no mistakes"):m<=3?add("rev13","Review, 1–3 mistakes"):add("rev4","Review, 4+ mistakes")}
      if(e.hifzNR)add("hifzNR","Hifz not ready");if(e.revNR)add("revNR","Review not ready");
      for(const b of e.beh||[]){const d=BEH.find(x=>x[0]===b);if(d)add("b_"+b,d[1])}}}
  if(e.type==="test"&&e.result==="pass")add("juzTest","Juz test passed");
  if(e.type==="monthly"){const L=(e.places||[]).length;if(L&&e.score===L)add("monthly5","Monthly test, all correct");else if(L&&e.score===L-1)add("monthly4","Monthly test, one wrong")}
  if(e.type==="points"&&Number(e.pts))o.push([e.reason||"From the teacher",Number(e.pts)]);
  return o}
const ptsOf=e=>ptsBreak(e).reduce((t,x)=>t+x[1],0);
const sgn=n=>(n>0?"+":n<0?"−":"")+Math.abs(n);
const breakText=e=>ptsBreak(e).map(([l,n])=>`${l} ${sgn(n)}`).join(" · ");
const ptsSum=(sid,from,to)=>events.filter(e=>e.sid===sid&&(!from||e.date>=from)&&(!to||e.date<=to)).reduce((t,e)=>t+ptsOf(e),0);
const hm2min=t=>{if(!t)return null;const[h,m]=String(t).split(":").map(Number);return h*60+(m||0)};
const nowHM=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
function lateMin(st,e){const c=classes.find(c=>c.id===st.cls);const a=hm2min(e.arr),b=hm2min(c&&c.time);return a!=null&&b!=null?Math.max(0,a-b):null}
const ATT={present:["ok","On time"],late:["warn","Late"],absent:["bad","Absent"],excused:["info","Excused"]};
const REV={near:"Near",far:"Far",both:"Near and far","القريب":"Near","البعيد":"Far","القريب والبعيد":"Near and far"};
const pad=n=>String(n).padStart(2,"0");
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=String(s).split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const daysBetween=(a,b)=>Math.round((parse(iso(b))-parse(iso(a)))/864e5);
const fmt=d=>new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long"}).format(d);
const fmtShort=s=>new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short"}).format(parse(s));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>parse(iso(new Date()));
const pagesOf=l=>Math.round(l/LINES*10)/10;

// ---------- plan ----------
// Near review: what was memorized on the last 10 hifz days (10 × daily amount). Far review: everything before it, split over the student's review cycle (3, 5, 7, 10 or 15 days; 7 by default).
function dayPlan(st,date,pos){
  useOrder(st);
  const amt=st.amount,br=breakFor(st,date),isHifz=st.days.includes(date.getDay())&&!(br&&br.mode==="pause");
  const newAmt=br&&br.mode==="half"?Math.max(1,amt/2):amt;
  const nearStart=realNearStart(st,pos)??stBack(pos,amt,10),farTotal=nearStart+PREV_LINES;
  const FD=farDaysOf(st),dn=daysBetween(parse(st.start),date),idx=((dn%FD)+FD)%FD;
  const fa=farSnap(farTotal*idx/FD),fb=idx===FD-1?farTotal:farSnap(farTotal*(idx+1)/FD);
  const end=amt<0?stEnd(pos,amt):portionEnd(pos,newAmt);
  return {isHifz,end,brk:br?(br.note||"Break")+" · "+(BREAK_MODES[br.mode]||""):"",
    neu:isHifz&&pos<TOTAL?rangeText(pos,end):"No new hifz",
    yest:pos>0?rangeText(stBack(pos,amt,1),pos):"—",
    near:pos>nearStart?rangeText(nearStart,pos):"—",
    nearLines:pos-nearStart,
    far:farTotal>0.5?farText(fa,fb):"Nothing yet",farPart:idx+1,farDays:FD,farLines:fb-fa,
    nearP:[...(pos>nearStart?pieces(nearStart,pos):[]),...(Math.abs(pos-Number(st.pos||0))<0.01?failedJuz(st).flatMap(j=>{const[a,b]=juzLines(j);return globalPieces(a,b,[])}):[])],
    holdJuz:Math.abs(pos-Number(st.pos||0))<0.01?failedJuz(st):[],farP:farTotal>0.5?farPieces(fa,fb):[],
    prep:pos<TOTAL?rangeText(pos,stEnd(pos,amt,7)):"—",
    read:readText(st,dn,date)};
}
// Juz whose latest test was not passed: kept in the near review until a pass (guide: "stays in near review")
function failedJuz(st){const last={};for(const e of events){if(e.sid!==st.id||e.type!=="test"||e.juz==null)continue;const k=Number(e.juz),o=last[k];if(!o||e.date>o.date||(e.date===o.date&&(e.t||0)>(o.t||0)))last[k]=e}
  return Object.keys(last).map(Number).filter(j=>last[j].result&&last[j].result!=="pass").sort((a,b)=>a-b)}
// Daily load estimate from the plan's own assumptions: 1 minute per page of review, 30 minutes per juz read (1.5 min a page). New hifz time is not counted.
function loadLine(st,p){const nearPg=Math.max(0,p.nearLines||0)/LINES+(p.holdJuz||[]).length*20,farPg=Math.max(0,p.farLines||0)/LINES,rd=Number(readOf(st))||0;
  const min=Math.round(nearPg+farPg+rd*1.5);if(!(min>0))return "";const big=min>120;
  return `<p class="small ${big?"":"muted"}" id="loadL">${big?'<span class="chip warn">Heavy day</span> ':""}Estimated home review time: about ${min} min (near ${Math.round(nearPg*10)/10} p, far ${Math.round(farPg*10)/10} p, reading ${rd} p). New hifz not included.${big?" More than 2 hours: consider a longer far-review cycle or less reading.":""}</p>`}
// Near review from real sessions: where the last 10 hifz days actually started (only for today's position; projections keep the formula)
function realNearStart(st,pos){if(Math.abs(pos-Number(st.pos||0))>0.01||!(pos>0))return null;
  const ds=new Map();for(const e of events){if(e.sid!==st.id||e.type!=="session"||e.noAdvance||e.from==null||e.to==null)continue;const a=Number(e.from),b=Number(e.to);if(!(b>a)||b>pos+0.5)continue;if(!ds.has(e.date)||a<ds.get(e.date))ds.set(e.date,a)}
  const last=[...ds.keys()].sort().reverse().slice(0,10);if(last.length<3)return null;
  const ns=Math.min(...last.map(d=>ds.get(d)));const f=stBack(pos,st.amount,10);
  if(!(ns<pos)||pos-ns>3*Math.max(1,pos-f))return null;return snap(ns)}
// Back after absence: more than 3 missed days in a row since the last attended session. Ahmed's guide: the first day back is review only.
function backInfo(st,date){const ds=iso(date||today());let n=0,since=null;
  const mine=events.filter(e=>e.sid===st.id&&e.date<ds&&(e.type==="session"||e.type==="emergency")).sort((a,b)=>b.date<a.date?-1:b.date>a.date?1:0);
  for(const e of mine){if(e.type==="session"&&attended(e))break;if(e.type==="emergency"||e.att==="absent"||e.att==="excused"){n++;since=e.date}}
  if(n<=3)return null;const backDone=events.some(e=>e.sid===st.id&&e.date===ds&&e.type==="session"&&attended(e)&&e.to!=null&&e.from!=null&&Number(e.to)>Number(e.from));
  return {n,since,backDone}}
const backBanner=st=>{const b=backInfo(st);return b?`<div class="banner info" id="backB">Back after ${b.n} missed days (since ${fmtShort(b.since)}). Suggestion from the guide: today is review only, no new hifz. Near review and yesterday's portion first. The teacher decides.</div>`:""};
// Far review: earlier juz first, then what has left the near review, on one axis of length PREV_LINES + near start
const GBOUND=(()=>{const b=[];for(let i=0;i<NAY;i++){const s=AY_SURAH[i];b.push(i===SURAH_FIRST[s]?SURAH_A[s]:AY[i])}b.push(ALL);return b.sort((x,y)=>x-y)})();
function farSnap(x){if(x>=PREV_LINES)return PREV_LINES+snap(x-PREV_LINES);let acc=0;
  for(const[a,b]of PREV_R){if(x<=acc+(b-a)){const g=a+(x-acc);let best=a;for(const v of GBOUND){if(v<a)continue;if(v>b)break;if(Math.abs(v-g)<Math.abs(best-g))best=v}return acc+(best-a)}acc+=b-a}return x}
function farText(x,y){const parts=[];let acc=0;
  for(const[a,b]of PREV_R){const L=b-a;const pa=Math.max(x,acc),pb=Math.min(y,acc+L);
    const j=PREV.find(j=>{const[ja,jb]=juzLines(j);return Math.abs(ja-a)<0.1&&Math.abs(jb-b)<0.1});
    if(pb-pa>0.05){if(j&&pb-pa>=L-0.05)parts.push(`Juz ${j}`);else{const ps=globalPieces(a+pa-acc,a+pb-acc,[]);if(ps.length)parts.push(ps.length<=3?ps.map(pieceText).join(", "):`${SURAH_NAMES[ps[0].s]} ${ps[0].a1} to ${SURAH_NAMES[ps[ps.length-1].s]} ${ps[ps.length-1].a2}`)}}acc+=L}
  if(y>PREV_LINES+0.05)parts.push(rangeText(Math.max(0,x-PREV_LINES),y-PREV_LINES).replace(/ \([\d.]+ p\)$/,""));
  return parts.length?parts.join(" + ")+` (${pagesOf(y-x)} p)`:"—"}
function farPieces(x,y){const out=[];let acc=0;
  for(const[a,b]of PREV_R){const L=b-a;const pa=Math.max(x,acc),pb=Math.min(y,acc+L);if(pb-pa>0.05)globalPieces(a+pa-acc,a+pb-acc,out);acc+=L}
  if(y>PREV_LINES+0.05)out.push(...pieces(Math.max(0,x-PREV_LINES),y-PREV_LINES));return out}
function weekPlan(st,start,n){useOrder(st);let pos=st.pos;const out=[];
  for(let i=0;i<(n||7);i++){const d=addDays(start,i);const p=dayPlan(st,d,pos);out.push({date:d,pos,...p});if(p.isHifz)pos=p.end}
  return out}
function plannedEnds(st){ // cumulative ends for 1..7 hifz days from current position
  useOrder(st);let pos=st.pos;const out=[];for(let k=1;k<=7&&pos<TOTAL;k++){pos=stEnd(pos,st.amount);out.push(pos)}return out}

function status(st,evs){
  useOrder(st);
  const chips=[];const mine=evs.filter(e=>e.sid===st.id).sort((a,b)=>String(b.date).localeCompare(String(a.date))||((b.t||0)-(a.t||0)));
  const sessions=mine.filter(e=>e.type==="session");
  const lastS=sessions[0], lastPresent=sessions.find(e=>e.att!=="absent");
  const lastHifz=sessions.find(e=>e.att!=="absent"&&e.hifzLines>0);
  const done=juzDoneList(st.pos);
  const passed=new Set(mine.filter(e=>e.type==="test"&&e.result==="pass").map(e=>e.juz));
  const untested=done.filter(j=>!passed.has(j));
  const consolDone=new Set(mine.filter(e=>e.type==="consol").map(e=>e.block));
  const block=Math.floor(done.filter(j=>!PREV.includes(j)).length/5)*5;
  const abs30=sessions.filter(e=>e.att==="absent"&&daysBetween(parse(e.date),today())<30).length;
  if(lastS&&lastS.att==="absent")chips.push(["bad","Absent last session"]);
  const cl=classes.find(c=>c.id===st.cls),since=lastPresent?lastPresent.date:"0000";
  const cancelled=meetings.filter(m=>m.cls===st.cls&&m.status==="cancelled"&&m.date>since).length;
  const allow=(clsDays(cl).length===1?15:8)+7*cancelled+breakDaysSince(st,since);
  if(!lastPresent||daysBetween(parse(lastPresent.date),today())>allow)chips.push(["bad",lastPresent?`No recitation for ${daysBetween(parse(lastPresent.date),today())} days`:"Not heard yet"]);
  if(lastHifz&&lastHifz.hifzMist/Math.max(1,pagesOf(lastHifz.hifzLines))>3)chips.push(["warn","Reduce amount"]);
  if(untested.length)chips.push(["info",`Test juz ${untested[0]}${PREV.includes(untested[0])?" (earlier hifz)":""}`]);
  if(block>=5&&!consolDone.has(block))chips.push(["info",`Consolidation week (${block} juz)`]);
  const recentEm=mine.filter(e=>e.type==="emergency"&&daysBetween(parse(e.date),today())<7).length;
  if(recentEm)chips.push(["warn",`${recentEm} emergency ${recentEm===1?"day":"days"} this week`]);
  const book=errorBook(st),needRule=book.filter(r=>r.count>=2&&!r.fixed).length;
  if(needRule)chips.push(["warn",`${needRule} mistake ${needRule===1?"place needs":"places need"} a rule`]);
  if(monthlyDue(st,mine))chips.push(["info","Monthly test due"]);
  const brNow=breakFor(st,today());if(brNow)chips.push(["plain",`On break: ${esc(brNow.note||"holiday")}`]);
  if(!chips.some(c=>c[0]!=="plain"))chips.push(["ok","On track"]);
  return {chips,mine,sessions,lastHifz,done,passed,untested,block,consolDone,abs30};
}

// ---------- state & store ----------
let db=null,downloads=null,students=[],allStudents=[],events=[],classes=[],meetings=[],breaks=[],marks=[],settings={},view={name:"list"},loaded=false,storeMissing=false;
async function init(){
  render();
  try{if(window.claude&&claude.use){db=await claude.use("db");downloads=await claude.use("downloads")}}catch(e){}
  if(!db){storeMissing=true;loaded=true;render();return}
  detectRole();moreInit();schoolInit();
  db.collection("students").onSnapshot(s=>{allStudents=s.docs.map(d=>({...d.data(),id:d.id}));students=allStudents.filter(x=>!x.archived);loaded=true;render()},()=>{loaded=true;storeMissing=true;render()});
  db.collection("events").onSnapshot(s=>{events=s.docs.map(d=>({...d.data(),id:d.id}));READY.add("events");render()});
  db.collection("settings").onSnapshot(s=>{settings={};s.docs.forEach(d=>settings[d.id]=d.data());READY.add("settings");render()});
  db.collection("marks").onSnapshot(s=>{marks=s.docs.map(d=>({...d.data(),id:d.id}));READY.add("marks");render()});
  db.collection("breaks").onSnapshot(s=>{breaks=s.docs.map(d=>({...d.data(),id:d.id}));READY.add("breaks");render()});
  db.collection("meetings").onSnapshot(s=>{meetings=s.docs.map(d=>({...d.data(),id:d.id}));READY.add("meetings");render()});
  db.collection("classes").onSnapshot(s=>{classes=s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(a.n||0)-(b.n||0)||String(a.name).localeCompare(String(b.name)));READY.add("classes");render()});
}
const go=v=>{view=v;render();scrollTo(0,0)};
let busy=false; // don't re-render while a form is being filled
let navInit=false;
function render(force){if(busy&&!force)return;if(!navInit&&loaded&&!storeMissing){navInit=true;if(view.name==="list"&&liveClass())view={name:"today"}}const r=renderCore(force);try{afterRender()}catch(e){console.error(e)}return r}
function renderCore(force){
  if(busy&&!force)return;
  const el=document.getElementById("view"),sub=document.getElementById("sub"),ta=document.getElementById("topActions");
  ta.innerHTML="";
  if(!loaded){sub.textContent="Loading students…";el.innerHTML=`<div class="empty">Loading the student list…</div>`;return}
  if(storeMissing){sub.textContent="";el.innerHTML=`<div class="banner bad">The student records can't be reached from this window. Open the page while signed in to your account.</div>`;return}
  if(SUB&&["classes","edit","add","fees","place","settings","school","waitlist"].includes(view.name)&&!(view.name==="add"&&myAddCls().length))view={name:"list"};
  try{schoolGuard()}catch(e){console.error(e)}
  if(view.name==="schools")return renderSchools(el,sub);if(view.name==="schoolv")return renderSchoolV(el,sub);if(view.name==="teacher")return renderTeacher(el,sub);if(view.name==="gmove")return renderGMove(el,sub);if(view.name==="handover")return renderHandover(el,sub);if(view.name==="school")return renderSchool(el,sub);if(view.name==="sover")return renderSover(el,sub);if(view.name==="waitlist")return renderWaitlist(el,sub);
  if(view.name==="today")return renderToday(el,sub,ta);if(view.name==="reports")return renderReports(el,sub);if(view.name==="settings")return renderSettings(el,sub);if(view.name==="wsum")return renderWsum(el,sub);if(view.name==="star")return renderStar(el,sub);if(view.name==="buddy")return renderBuddy(el,sub);
  if(view.name==="tajweed")return renderTajweed(el,sub);
  if(view.name==="feedback")return renderFeedback(el,sub);if(view.name==="inbox")return renderInbox(el,sub);
  if(view.name==="list")return renderList(el,sub,ta);
  if(view.name==="add")return renderForm(el,sub,null);
  if(view.name==="classes")return renderClasses(el,sub);
  if(view.name==="class")return renderClass(el,sub);
  if(view.name==="grading")return renderGrading(el,sub);
  if(view.name==="crep")return renderClassReport(el,sub);
  if(view.name==="screen")return renderScreen(el,sub);
  if(view.name==="fees")return renderFees(el,sub);
  if(view.name==="place")return renderPlace(el,sub);
  const st=allStudents.find(s=>s.id===view.id);
  if(!st){view={name:"list"};return render(true)}
  useOrder(st);
  ({edit:renderForm,student:renderStudent,week:renderWeek,session:renderSession,saved:renderSaved,test:renderTestMode,history:renderHistory,report:renderReport,mushaf:renderMushaf,mprint:renderMPrint,wa:renderParentMsg,year:renderYear})[view.name](el,sub,st);
  if(view.name==="session"&&view.pre)applyPre(el);
}
const trackForm=f=>{f.addEventListener("input",()=>busy=true);f.addEventListener("change",()=>busy=true)};
const backBtn=(label,to)=>`<div class="actions"><button class="link" id="back" data-to='${JSON.stringify(to)}'>← ${label}</button></div>`;
function wireBack(el){const b=el.querySelector("#back");if(b)b.onclick=()=>{busy=false;go(JSON.parse(b.dataset.to))}}
const chipsHTML=cs=>cs.map(c=>`<span class="chip ${c[0]}">${c[1]}</span>`).join("");

// ---------- list ----------
function classBar(cur){
  const t=today(),dow=t.getDay(),d=iso(t);
  const item=c=>{const m=meetingOf(c.id,d),isDay=clsDays(c).includes(dow);
    const st=m?(m.status==="cancelled"?'<span class="chip bad">Cancelled</span>':'<span class="chip ok">Logged</span>'):'<span class="chip info">Not logged yet</span>';
    return `<div class="cbar"><div><b><bdi>${esc(c.name)}</bdi></b> <span class="small muted">${scheduleText(c)}</span></div><div class="cbar-r">${isDay||m?st:""}${classTimeChip(c,m)}${isDay||m?classTimeButtons(c,m):""}<button class="${isDay?"primary":""}" data-openc="${c.id}">${isDay?"Today's class log":"Class log"}</button><button data-crep="${c.id}">Class report</button></div></div>`};
  if(cur!=="all"&&cur!=="none"){const c=classes.find(c=>c.id===cur);return c?`<div class="panel tight">${item(c)}</div>`:""}
  const todays=classes.filter(c=>clsDays(c).includes(dow));
  return todays.length?`<div class="panel tight"><p class="small muted lbl">Classes today</p>${todays.map(item).join("")}</div>`:"";
}

const clsName=id=>{const c=classes.find(c=>c.id===id);return c?c.name:""};
function getListCls(){try{return localStorage.getItem("hifz.cls")||myClsDefault()}catch(e){return "all"}}
function myClsDefault(){try{const t=typeof meTeacher==="function"&&meTeacher();if(t&&SUB){const c=classes.find(x=>x.teacher===t.id&&schVisible(x));if(c)return c.id}}catch(_){}return "all"}
function setListCls(v){try{localStorage.setItem("hifz.cls",v)}catch(e){}}
function renderList(el,sub,ta){
  let cur=getListCls();
  const valid=new Set(classes.map(c=>c.id)),orphans=students.filter(s=>!valid.has(s.cls));
  const arch=allStudents.filter(s=>s.archived);if(cur==="arch"&&!arch.length)cur="all";
  if(cur!=="all"&&cur!=="none"&&cur!=="arch"&&!valid.has(cur))cur="all";if(cur==="none"&&!orphans.length)cur="all";
  const memL=s=>{useOrder(s);return (Number(s.pos)||0)+PREV_LINES};
  const shown=(cur==="all"?students.filter(s=>{const c=classes.find(x=>x.id===s.cls);return !c||schVisible(c)}):cur==="none"?orphans:students.filter(s=>s.cls===cur)).map(s=>[memL(s),s]).sort((a,b)=>a[0]-b[0]||String(a[1].name).localeCompare(String(b[1].name))).map(x=>x[1]);
  sub.textContent=`${shown.length} ${shown.length===1?"student":"students"}${cur!=="all"&&cur!=="none"?" in "+clsName(cur):""} · ${fmt(today())}`;
  const b=document.createElement("button");b.className=SUB&&myAddCls().length?"primary":"primary adminonly";b.textContent="Add student";b.onclick=()=>go({name:"add",cls:cur});ta.append(b);

  const tabs=`<div class="filters" role="tablist">${[["all","All students",students.length],...classes.filter(schVisible).map(c=>[c.id,c.name,students.filter(s=>s.cls===c.id).length]),...(orphans.length?[["none","No class",orphans.length]]:[]),...(arch.length?[["arch","Archived",arch.length]]:[])].map(([k,n,c])=>`<button class="fbtn ${k===cur?"on":""}" data-cls="${k}" role="tab" aria-selected="${k===cur}">${esc(n)} <span class="cnt">${c}</span></button>`).join("")}</div>`;
  const wireTabs=()=>{el.querySelectorAll("[data-openc]").forEach(b=>b.onclick=()=>go({name:"class",id:b.dataset.openc,date:iso(today())}));el.querySelectorAll("[data-crep]").forEach(b=>b.onclick=()=>go({name:"crep",id:b.dataset.crep}));el.querySelectorAll("[data-cls]").forEach(b=>b.onclick=()=>{setListCls(b.dataset.cls);render(true)});wireAlerts(el);wireSearch(el);{const g=el.querySelector("[data-gows]");if(g)g.onclick=()=>go({name:"wsum",cls:cur!=="all"?cur:undefined});const h=el.querySelector("[data-gostar]");if(h)h.onclick=()=>go({name:"star",cls:cur!=="all"?cur:undefined})}wireClassSign(el);wireTests(el)};
  if(cur==="arch"){sub.textContent=`${arch.length} archived`;el.innerHTML=subBanner()+tabs+archivedList();wireTabs();wireArchived(el);return}
  if(!shown.length){el.innerHTML=subBanner()+tabs+`<div class="panel empty"><h3>No students yet</h3><p>Add your first student: name, daily amount, and hifz days per week. Then choose where they start: from An-Nas or from Al-Fatihah.</p></div>`;wireTabs();return}
  const rank=s=>s.chips.some(c=>c[0]==="bad")?0:s.chips.some(c=>c[0]==="warn")?1:s.chips.some(c=>c[0]==="info")?2:3;
  const rows=shown.map(st=>({st,s:status(st,events)}));
  const counts=[0,0,0,0];rows.forEach(r=>counts[rank(r.s)]++);
  const todayIso=iso(today());
  const attToday=new Map(events.filter(e=>e.type==="session"&&e.date===todayIso).map(e=>[e.sid,e.att]));
  el.innerHTML=subBanner()+searchBox()+tabs+`
  <div class="list slist">${rows.map(({st,s})=>{useOrder(st);const pl=planShort(st);return `
    <div class="row" data-id="${st.id}" role="button" tabindex="0">
      <span class="name">${esc(st.name)}${st.example?' <span class="chip plain">example</span>':""}</span>
      <span class="chips">${chipsHTML(s.chips.slice(0,2))}</span>
      <span class="meta">${cur==="all"&&clsName(st.cls)?"<bdi>"+esc(clsName(st.cls))+"</bdi>"+(pl?" · ":""):""}${esc(pl)}</span>
    </div>`}).join("")}</div>`;
  wireTabs();
  el.querySelectorAll(".row").forEach(r=>{const open=()=>go({name:"student",id:r.dataset.id});r.onclick=e=>{if(!e.target.closest(".att"))open()};r.onkeydown=e=>{if(e.key==="Enter"&&e.target===r)open()}});
}
async function setAttendance(sid,date,att,arr){
  const ex=events.find(e=>e.type==="session"&&e.sid===sid&&e.date===date);
  const extra=att==="late"?{arr:arr||(date===iso(today())?nowHM():"")}:{};
  try{if(ex)await db.doc("events/"+ex.id).update({att,...extra});else await db.collection("events").add({sid,type:"session",date,att,...extra,t:Date.now(),hifzLines:0,hifzMist:0,revMist:0})}catch(e){}
}

// ---------- student ----------
function renderStudent(el,sub,st){
  const s=status(st,events),p=dayPlan(st,today(),st.pos);
  const pct=Math.round((st.pos+PREV_LINES)/ALL*1000)/10,cj=currentJuz(st.pos),la=lastAyahOf(st.pos);
  sub.textContent=`${clsName(st.cls)?clsName(st.cls)+" · ":""}${orderName()} · ${amountLabel(st.amount)} · review all in ${farDaysOf(st)} days · hifz days: ${[6,0,1,2,3,4,5].filter(d=>st.days.includes(d)).map(d=>DAY_NAMES[d]).join(", ")}`;
  const pres=s.sessions.filter(e=>daysBetween(parse(e.date),today())<30);
  el.innerHTML=`
  ${backBtn("All students",{name:"list"})}${subBanner()}
  <div class="panel">
    <div class="head"><h2>${esc(st.name)}</h2><div class="chips">${chipsHTML(s.chips)}</div></div>
    <div class="bar" aria-label="Share memorized"><i style="width:${pct}%"></i></div>
    <p class="small muted">${PREV_R.length?`Memorized before: ${prevSummary()} · `:""}${pagesOf(st.pos+PREV_LINES)} of 604 pages memorized (${pct}%)${la?` · last memorized: ${pieceText({...la,a1:la.a2})}`:""}${cj?` · now in juz ${cj}`:" · completed the Quran"}</p>
    <details class="sfold sjuz"><summary>Juz map and attendance</summary><div class="juzgrid">${JUZ_ORDER.map(j=>`<span class="${s.passed.has(j)?"tested":s.done.includes(j)?"done":j===cj?"cur":""}" title="Juz ${j}">${j}</span>`).join("")}</div>
    <p class="small muted">Green: juz passed its test. Teal: memorized, not tested yet. Last 30 days: present ${pres.filter(attended).length} (late ${pres.filter(e=>e.att==="late").length}), absent ${pres.filter(e=>e.att==="absent").length}, excused ${pres.filter(e=>e.att==="excused").length}.</p></details>
    <div class="bigacts"><button class="primary" id="sesBtn">✎ Record session</button><button class="primary" id="musBtn">📖 Mushaf</button></div>
    <details class="smore" id="sMore"><summary>More</summary><div class="smenu"><b class="small muted">Tests</b><div class="actions"><button id="tmBtn">Test mode</button><button id="jtBtn">Juz test</button><button id="mtBtn">Monthly test</button><button id="otBtn">Other record</button></div><b class="small muted">Reports and parents</b><div class="actions"><button id="repBtn">Report</button><button id="yrBtn">Year report</button><button id="weekBtn">Plan sheet</button><button id="mprBtn">Print mistakes</button><button id="waBtn">Message parents</button></div><b class="small muted">Student</b><div class="actions"><button id="histBtn">Student history</button><button id="editBtn">Edit details</button></div></div></details>
  </div>
  ${st.archived?`<div class="banner warn">${esc(st.name)} is archived since ${fmtShort(st.archived)}: hidden from the lists and reports. <button class="primary adminonly" id="unarchBtn">Restore student</button></div>`:""}
  ${s.done.length>=30?`<div class="banner ok">${esc(st.name)} has completed the whole Quran. <button class="primary" id="khatmCert" ${downloads?"":"hidden"}>Download khatm certificate</button> <span class="small muted" id="k_msg"></span></div>`:""}
  ${backBanner(st)}
  ${p.brk?`<div class="banner info">On break: ${esc(p.brk)}. Near and far review carry on as usual.</div>`:""}
  ${s.lastHifz&&s.lastHifz.hifzMist/Math.max(1,pagesOf(s.lastHifz.hifzLines))>3?`<div class="banner warn">Last recitation had ${s.lastHifz.hifzMist} mistakes in ${pagesOf(s.lastHifz.hifzLines)} pages, more than 3 per page. Reduce the new amount until it settles.</div>`:""}
  ${s.untested.length?`<div class="banner info">${PREV.includes(s.untested[0])?`Juz ${s.untested[0]} is from earlier hifz: the student recites it all to you to confirm it. If it fails, untick its surahs in "Edit details" so they are memorized again.`:`Juz ${s.untested[0]} is complete: the student recites it all to you. If it fails, it stays in the near review for another week.`}</div>`:""}
  ${s.block>=5&&!s.consolDone.has(s.block)?`<div class="banner info">${s.block} juz complete: a consolidation week with no new hifz. The last five juz are reviewed and recited to you.</div>`:""}
  <div class="panel">
    <h3>Today's tasks · ${fmt(today())}</h3>
    <div class="tasks">
      <div class="task new"><span class="k">New hifz${p.isHifz?"":" (not a hifz day)"}</span><span class="v">${s.block>=5&&!s.consolDone.has(s.block)&&p.isHifz?'<span class="chip info">Consolidation week: suggested no new hifz</span> ':""}${p.isHifz?p.neu:p.brk&&p.brk.includes("no new hifz")?'<span class="muted">Paused for the break</span>':rangeText(st.pos,p.end)+' <span class="muted small">on the next hifz day</span>'}${st.pos<TOTAL?listenBtn(pieces(st.pos,p.end),"New hifz"):""}</span></div>
      <div class="task"><span class="k">Yesterday's portion, by heart</span><span class="v">${p.yest}${st.pos>0?listenBtn(pieces(stBack(st.pos,st.amount,1),st.pos),"Yesterday's portion"):""}</span></div>
      <div class="task"><span class="k">Near review · last 10 hifz days</span><span class="v">${p.near}${p.holdJuz.length?` <b>+ ${p.holdJuz.map(j=>"Juz "+j).join(", ")}</b> <span class="muted small">(test not passed yet)</span>`:""}${listenBtn(p.nearP,"Near review")}</span></div>
      <div class="task"><span class="k">Far review · day ${p.farPart} of ${p.farDays}</span><span class="v">${p.far}</span></div>
      <div class="task"><span class="k">Preparation · next 7 portions</span><span class="v">${p.prep}</span></div>
      <div class="task"><span class="k">Reading from the mushaf</span><span class="v">${p.read}</span></div>
      ${repeatTask(st)}
    </div>
    ${loadLine(st,p)}
  </div>
  <div class="panel">
    <div class="head"><h3>Recent sessions</h3><button class="link" id="histBtn2">Full history</button></div>
    <div class="log">${s.mine.length?s.mine.slice(0,3).map(evRow).join(""):'<p class="muted">Nothing recorded yet. Tap "Record session" to add the first one.</p>'}</div>
  </div>
  ${sFold("sugg","Amount suggestion",suggPanel(st))}${sFold("streak","Streak",streakPanel(st))}${sFold("strength","Surah strength",strengthPanel(st))}${typeof coveragePanel==="function"?sFold("cover","Coverage",coveragePanel(st)):""}${sFold("heart","Quran heart",heartPanel(st))}${sFold("goal","Goal",goalPanel(st))}${sFold("progress","Progress",progressPanel(st))}${sFold("journey","Journey",journeyPanel(st))}${sFold("tajweed","Tajweed",tjStudentPanel(st))}${sFold("cert","Certificates",certPanel(st))}${sFold("points","Points",pointsPanel(st))}
  ${sFold("book","Mistakes to fix",`<div id="bookWrap">${errorBookPanel(st)}</div>`,/data-|class="bk/.test(errorBookPanel(st)))}`;
  wireFolds(el);
  wireBack(el);wireHeart(el,st);
  el.querySelector("#sesBtn").onclick=()=>go({name:"session",id:st.id});
  wireSugg(el,st);wireGoal(el,st);wireStrength(el,st);el.querySelector("#tmBtn").onclick=()=>go({name:"test",id:st.id});el.querySelector("#jtBtn").onclick=()=>go({name:"session",id:st.id,pre:{type:"test"}});el.querySelector("#mtBtn").onclick=()=>go({name:"session",id:st.id,pre:{type:"monthly"}});el.querySelector("#otBtn").onclick=()=>go({name:"session",id:st.id,pre:{type:"makeup"}});
  el.querySelector("#histBtn").onclick=el.querySelector("#histBtn2").onclick=()=>go({name:"history",id:st.id});
  el.querySelector("#weekBtn").onclick=()=>go({name:"week",id:st.id});
  el.querySelector("#editBtn").onclick=()=>go({name:"edit",id:st.id});
  el.querySelector("#repBtn").onclick=()=>go({name:"report",id:st.id});
  el.querySelector("#musBtn").onclick=()=>go({name:"mushaf",id:st.id});
  el.querySelector("#mprBtn").onclick=()=>go({name:"mprint",id:st.id});
  el.querySelector("#waBtn").onclick=()=>go({name:"wa",id:st.id});
  el.querySelector("#yrBtn").onclick=()=>go({name:"year",id:st.id});wireListen(el);
  const ub=el.querySelector("#unarchBtn");if(ub)ub.onclick=()=>setArchived(st,false);
  wireFix(el,st);wirePoints(el,st);
  wireDeletes(el,st);
}
// folded sections on the student page; which ones are open is remembered on this device. Opening one redraws the page so charts get their size.
let S_OPEN=null;const sOpen=()=>S_OPEN||(S_OPEN=(()=>{try{return new Set(JSON.parse(localStorage.getItem("hifz.sfold")||"[]"))}catch(_){return new Set()}})());
function sFold(k,title,html,show=true){if(!html||!String(html).trim()||!show)return "";const t=(String(html).match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/)||[])[1];const label=t?t.replace(/<[^>]+>/g,"").trim()||title:title;return `<details class="sfold" data-sf="${k}" ${sOpen().has(k)?"open":""}><summary>${esc(label)}</summary><div class="sfb">${html}</div></details>`}
function wireFolds(el){el.querySelectorAll("details[data-sf]").forEach(d=>d.addEventListener("toggle",()=>{const s=sOpen();if(d.open===s.has(d.dataset.sf))return;if(d.open)s.add(d.dataset.sf);else s.delete(d.dataset.sf);try{localStorage.setItem("hifz.sfold",JSON.stringify([...s]))}catch(_){}if(d.open){busy=false;render(true)}}))}
function skipText(e){return (e.revSkip||[]).map(r=>SURAH_NAMES[r.s]).join(", ")}
function evBody(e){
  if(e.type==="session"){
    const a=ATT[e.att]||ATT.present;let t=`<span class="chip ${a[0]}">${a[1]}${e.att==="late"&&e.arr?" · "+esc(e.arr):""}</span>${e.left?" "+leftChip(e):""}`;
    const pn=ptsOf(e);if(ptsBreak(e).length)t+=` <span class="chip pts" title="${esc(breakText(e))}">${sgn(pn)} pts</span>`;
    if(e.hw!=null)t+=` <span class="chip ${e.hw?"ok":"bad"}">Homework ${e.hw?"done":"not done"}</span>`;
    if((e.beh||[]).length)t+=` ${e.beh.map(b=>{const d=BEH.find(x=>x[0]===b);return d?`<span class="chip ${d[2]==="good"?"ok":"warn"}">${d[1]}</span>`:""}).join(" ")}`;
    if(attended(e)){
      if(e.hifzNR)t+=` <span class="chip warn">Hifz: not ready</span>`;if(e.revNR)t+=` <span class="chip warn">Review: not ready</span>`;
      if(e.hifzRepeat)t+=` <span class="chip warn">↻ Repeat next class</span> <b>Hifz:</b> ${esc(hifzShown(e))} · ${e.hifzMist||0} ${e.hifzMist===1?"mistake":"mistakes"}${esc(mkText(e.hifzMk))}`;
      if(e.hifzLines>0)t+=` <b>Hifz:</b> ${esc(hifzShown(e))} · ${e.hifzMist||0} ${e.hifzMist===1?"mistake":"mistakes"}${esc(mkText(e.hifzMk))}${e.hifzGrade?" · "+esc(gradeEn(e.hifzGrade)):""}${e.hifzStop==="stuck"?' <span class="chip warn">Could not continue</span>':e.hifzStop==="time"?' <span class="chip plain">Stopped: time</span>':""}`;
      if(e.revType&&e.revType!=="none")t+=`<br><b>Review (${esc(REV[e.revType]||e.revType)}):</b> ${esc(revShown(e))} · ${e.revMist||0} ${e.revMist===1?"mistake":"mistakes"}${esc(mkText(e.revMk))}${e.revGrade?" · "+esc(gradeEn(e.revGrade)):""}`;
      if((e.revSkip||[]).length)t+=` <span class="chip warn">Not recited: ${esc(skipText(e))}</span>`;
    }
    if(e.errs&&e.errs.length)t+=`<br><b>Mistake places:</b> ${e.errs.map(x=>`${errPlace(x)} (${ERR_KINDS[x.k]||x.k})`).join(", ")}`;
    if(ptsBreak(e).length)t+=`<br><span class="small muted">Points: ${esc(breakText(e))}</span>`;
    if(e.note)t+=`<br><span class="muted">Note: ${esc(e.note)}</span>`;
    return t;
  }
  if(e.type==="test")return `<b>Juz ${esc(e.juz)} test${examinerText(e)}:</b> ${e.result==="pass"?'<span class="chip ok">Passed</span>':'<span class="chip bad">Not passed, stays in near review for a week</span>'}${e.mistakes!=null?` · ${esc(e.mistakes)} ${e.mistakes===1?"mistake":"mistakes"}`:""}${e.note?`<br><span class="muted">${esc(e.note)}</span>`:""}`;
  if(e.type==="monthly")return `<b>Monthly random test:</b> ${esc(e.score)}/${(e.places||[]).length} correct${(e.places||[]).length?` · ${(e.places||[]).map(x=>`${x.ok?"✓":"✗"} ${errPlace(x)}`).join(", ")}`:""}${e.note?`<br><span class="muted">${esc(e.note)}</span>`:""}`;
  if(e.type==="consol")return `<b>Consolidation week</b> after ${e.block} juz`;
  if(e.type==="emergency")return `<span class="chip warn">Emergency day</span> near review only${e.note?" · "+esc(e.note):""}`;
  if(e.type==="makeup")return `<span class="chip info">Makeup day</span>${e.note?" "+esc(e.note):""}`;
  if(e.type==="note")return `<b>Note:</b> ${esc(e.text)}`;
  if(e.type==="points")return `<span class="chip ${e.pts<0?"bad":"pts"}">${sgn(Number(e.pts)||0)} pts</span> ${esc(e.reason||"Points from the teacher")}`;
  if(e.type==="tasmee")return `Recitation ${pagesOf(e.lines||0)} p · ${e.mistakes||0} mistakes${e.note?" · "+esc(e.note):""}`;
  if(e.type==="rtest")return rtestBody(e);
  if(e.type==="buddy")return buddyBody(e);
  return esc(e.type);
}
const evRow=e=>`<div class="ev"><time>${fmtShort(e.date)}</time><div class="evb">${evBody(e)}${byText(e)}</div><span class="evx">${e.type==="test"&&e.result==="pass"&&downloads?`<button class="link small" data-cert="${e.id}">Certificate</button>`:""}<button class="link small del" data-del="${e.id}">Delete</button></span></div>`;
function wireDeletes(el,st){
  wireCerts(el,st);
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{
    if(b.dataset.confirm!=="1"){b.dataset.confirm="1";b.textContent="Confirm delete?";setTimeout(()=>{b.dataset.confirm="";b.textContent="Delete"},4000);return}
    const e=events.find(x=>x.id===b.dataset.del);if(!e)return;
    try{await db.doc("events/"+e.id).delete();let rp=null;
      if(e.type==="session"&&e.hifzLines>0&&e.from!=null&&Math.abs(st.pos-(e.to??(e.from+e.hifzLines)))<0.1){rp=st.pos;await db.doc("students/"+st.id).update({pos:e.from})}
      undoToast("Record deleted",async()=>{await db.doc("events/"+e.id).set(plain(e));if(rp!=null)await db.doc("students/"+st.id).update({pos:rp})})}catch(_){}
  });
}

// ---------- surah rows (several surahs in one recitation) ----------
const rowLines=r=>{const f=SURAH_FIRST[r.s];const a=r.a1<=1?SURAH_A[r.s]:AY[f+r.a1-1],b=r.a2<QD.verses[r.s]?AY[f+r.a2]:SURAH_B[r.s];return Math.max(0,b-a)};
const rowsText=rs=>rs.map(pieceText).join(", ");
function seqStartOf(s,a){if(a>1)return posAfterAyah(s,a-1);const g=SEGS.find(g=>g.surah===s);return g?g.s:null}
const rowsTextM=rs=>rs.map(r=>pieceText(r)+(r.m?` (${r.m} ${r.m===1?"mistake":"mistakes"})`:"")).join(", ");
const revShown=e=>e.revRows&&e.revRows.length?rowsTextM(e.revRows):(e.revText||"");
const hifzShown=e=>e.hifzRows&&e.hifzRows.length?rowsTextM(e.hifzRows):(e.hifzText||pagesOf(e.hifzLines)+" p");
function focusList(st,days=30){const map=new Map(),t=today();
  for(const e of events)if(e.sid===st.id&&daysBetween(parse(e.date),t)<days){for(const r of [...(e.revRows||[]),...(e.hifzRows||[])])if(r.m>0)map.set(r.s,(map.get(r.s)||0)+r.m);for(const x of e.errs||[])map.set(x.s,(map.get(x.s)||0)+1)}
  for(const m of marks)if(m.sid===st.id&&!m.fixed&&daysBetween(parse(m.date),t)<days){const p=wordPlace(m.w);map.set(p.s,(map.get(p.s)||0)+1)}
  return [...map.entries()].sort((a,b)=>b[1]-a[1])}
function focusPanel(st){const f=focusList(st);if(!f.length)return "";
  return `<div class="panel"><div class="head"><h3>Surahs to focus on</h3><span class="small muted">mistakes in the last 30 days</span></div><div class="chips">${f.slice(0,12).map(([s,n])=>`<span class="chip ${n>=5?"bad":n>=3?"warn":"plain"}">${SURAH_NAMES[s]} · ${n}</span>`).join("")}</div></div>`}
function rowsBox(id){return `<div class="rows" id="${id}"></div><div class="actions"><button type="button" class="small" data-addrow="${id}">+ Add surah</button><span class="small muted" data-rowsum="${id}"></span></div>`}
function wireRows(f,id,rows,surahs,onSum,canSkip){
  const box=f.querySelector("#"+id),sum=f.querySelector(`[data-rowsum="${id}"]`);
  const opts=sel=>surahs.map(x=>`<option value="${x}" ${x===sel?"selected":""}>${SURAH_NAMES[x]}</option>`).join("");
  const total=()=>{const live=rows.filter(r=>!r.skip),l=live.reduce((t,r)=>t+rowLines(r),0),m=live.reduce((t,r)=>t+(r.m||0),0),sk=rows.length-live.length;sum.textContent=rows.length?`${live.length} ${live.length===1?"surah":"surahs"} recited · ${pagesOf(l)} p · ${m} ${m===1?"mistake":"mistakes"}${sk?` · ${sk} not recited`:""}`:"";if(onSum)onSum(m,live.length)};
  const draw=()=>{box.innerHTML=rows.length?`<div class="rhead small muted"><span>Surah</span><span>From ayah</span><span>To ayah</span><span>Mistakes</span><span></span></div>`+rows.map((r,i)=>`<div class="rrow${r.skip?" skipped":""}" data-i="${i}"><select aria-label="Surah">${opts(r.s)}</select><input type="number" class="a1" min="1" max="${QD.verses[r.s]}" value="${r.a1}" aria-label="From ayah" inputmode="numeric"><input type="number" class="a2" min="1" max="${QD.verses[r.s]}" value="${r.a2}" aria-label="To ayah" inputmode="numeric"><input type="number" class="mm" min="0" value="${r.m||0}" aria-label="Mistakes in ${SURAH_NAMES[r.s]}" inputmode="numeric" ${r.skip?"disabled":""}>${canSkip?`<button type="button" class="sm skp ${r.skip?"on":""}">${r.skip?"Not recited ↺":"Not recited"}</button>`:""}<button type="button" class="x" aria-label="Remove">×</button></div>`).join(""):'<p class="small muted">No surahs added.</p>';
    box.querySelectorAll(".rrow").forEach(el=>{const r=rows[Number(el.dataset.i)];
      el.querySelector("select").onchange=e=>{r.s=Number(e.target.value);r.a1=1;r.a2=QD.verses[r.s];busy=true;draw()};
      const clamp=v=>Math.min(QD.verses[r.s],Math.max(1,Number(v)||1));
      el.querySelector(".a1").onchange=e=>{r.a1=clamp(e.target.value);if(r.a2<r.a1)r.a2=r.a1;busy=true;draw()};
      el.querySelector(".a2").onchange=e=>{r.a2=clamp(e.target.value);if(r.a2<r.a1)r.a1=r.a2;busy=true;draw()};
      const mm=el.querySelector(".mm");mm.oninput=()=>{r.m=Math.max(0,Number(mm.value)||0);busy=true;total()};mm.onfocus=()=>mm.select();
      el.querySelector(".x").onclick=()=>{rows.splice(Number(el.dataset.i),1);busy=true;draw()};const sk=el.querySelector(".skp");if(sk)sk.onclick=()=>{r.skip=!r.skip;if(r.skip)r.m=0;busy=true;draw()}});
    total()};
  f.querySelector(`[data-addrow="${id}"]`).onclick=()=>{const l=rows[rows.length-1];let ns=surahs[0];if(l){const k=surahs.indexOf(l.s);ns=surahs[Math.min(surahs.length-1,k+1)]}rows.push({s:ns,a1:1,a2:QD.verses[ns]});busy=true;draw()};
  return {draw,set:rs=>{rows.splice(0,rows.length,...rs.map(r=>({s:r.s,a1:r.a1,a2:r.a2,m:r.m||0,...(r.skip?{skip:true}:{})})));draw()}};
}

// ---------- session ----------
function renderSession(el,sub,st){
  busy=false;
  const dupOf=events.filter(x=>x.type==="session"&&x.sid===st.id&&x.date===iso(today())&&(x.hifzLines||x.revType)).sort((a,b)=>(b.t||0)-(a.t||0))[0];
  const dup=dupOf&&!view.addMore?dupOf:null;
  if(dup&&dup.from!=null)st={...st,pos:dup.from};
  const exToday=events.find(x=>x.type==="session"&&x.sid===st.id&&x.date===iso(today())&&!x.hifzLines&&!x.revType);
  const p=dayPlan(st,today(),st.pos), ends=plannedEnds(st), wk=st.days.length;
  sub.textContent="Record session · "+st.name;
  el.innerHTML=`
  ${backBtn(esc(st.name),{name:"student",id:st.id})}
  <form class="panel" id="sForm">
    ${dup?`<div class="banner warn" id="dupBox"><b>Already recorded today:</b> ${esc([dup.hifzText&&"Hifz "+dup.hifzText,dup.revText&&"Review "+dup.revText].filter(Boolean).join(" · ")||"session")}. Saving this form <b>replaces</b> that record and puts the hifz position back to where it was before it. <button type="button" class="sm" id="dupAdd">Add a second record instead</button></div>`:""}
    ${guideBox()}
    <div class="fields">
      <label>Date<input type="date" id="s_date" value="${iso(today())}" required></label>
      <label>Recorded by<input id="s_by" list="s_byl" value="${esc(lastBy())}" autocomplete="off"><datalist id="s_byl">${byNames().map(n=>`<option value="${esc(n)}">`).join("")}</datalist></label>
      <label>Type<select id="s_type">
        <option value="session">Session (attendance and recitation)</option><option value="test">Juz test</option><option value="monthly">Monthly random test</option>
        <option value="consol">Consolidation week done</option><option value="emergency">Emergency day</option>
        <option value="makeup">Makeup day</option><option value="note">Note only</option></select></label>
    </div>
    <fieldset id="f_session" class="grp">
      <legend>Attendance</legend>
      <div class="seg">${Object.entries(ATT).map(([k,v],i)=>`<label><input type="radio" name="att" value="${k}" ${(exToday?exToday.att===k:i===0)?"checked":""}> ${v[1]}</label>`).join("")}</div>
      <div class="fields" id="f_arr"><label>Arrived at<input type="time" id="s_arr" value="${esc(exToday&&exToday.arr||"")}"></label><span class="small muted" id="s_latemsg"></span></div><div class="fields" id="f_left"><label>Left early at (leave empty if stayed)<input type="time" id="s_left" value="${esc(exToday&&exToday.left||"")}"></label><label>Reason for leaving early<input id="s_leftw" value="${esc(exToday&&exToday.leftWhy||"")}" placeholder="e.g. doctor's appointment"></label></div>
      <div id="f_work">
        <h3 class="sec">New hifz <button type="button" class="sm nrbtn" data-nrb="s_hifz">Did not recite</button></h3>
        <div class="fields">
          <label>Recited<select id="s_hifz"><option value="0">Nothing new</option><option value="nr">Not ready (did not recite)</option>${ends.map((e,i)=>`<option value="${e}" ${i===Math.min(wk,ends.length)-1?"selected":""}>${i+1===1?"1 day's portion":`${i+1} days' portions`}: ${rangeText(st.pos,e)}</option>`).join("")}<option value="custom">Other: choose surahs…</option></select></label>
          <label>Hifz mistakes<input type="number" id="s_hm" min="0" value="0" inputmode="numeric"></label>
          <label>Grade<select id="s_hg">${GRADES.map(g=>`<option>${g}</option>`).join("")}</select><span class="small muted autog" id="s_hgx"></span></label>
        </div>
        <p class="small" id="h_editW"><button type="button" class="sm listen" id="h_edit">Recited less? Set where they stopped</button></p>
        <div id="h_rowsW" hidden><p class="small muted lbl">Change "To ayah" to where the student stopped, or remove a surah they did not recite.</p>${rowsBox("h_rows")}</div>
        <h3 class="sec">Review <button type="button" class="sm nrbtn" data-nrb="s_rt">Did not recite</button></h3>
        <div class="fields">
          <label>Type<select id="s_rt"><option value="near">Near</option><option value="far">Far</option><option value="both">Near and far</option><option value="none">No review</option><option value="nr">Not ready (did not recite)</option></select></label>
          <label>Review mistakes<input type="number" id="s_rm" min="0" value="0" inputmode="numeric"></label>
          <label>Grade<select id="s_rg">${GRADES.map(g=>`<option>${g}</option>`).join("")}</select><span class="small muted autog" id="s_rgx"></span></label>
        </div>
        <div id="r_rowsW"><p class="small muted lbl">Surahs recited, filled from today's plan. If the student recited less, change "To ayah". Tap "Not recited" under any surah they did not read (for example 1 of 4).</p>${rowsBox("r_rows")}</div>
        ${errsBlock(st)}
      </div>
    </fieldset>
    <fieldset id="f_monthly" class="grp" hidden>
      <legend>Monthly random test</legend>
      <p class="small muted">Five random places from everything memorized. Read the start of each ayah and the student continues. Tick the ones recited well.</p>
      <div id="mt_list"></div>
      <div class="actions"><button type="button" id="mt_new">Pick other places</button></div>
    </fieldset>
    <fieldset id="f_test" class="grp" hidden>
      <div class="fields">
        <label>Juz<select id="t_juz">${JUZ_ORDER.map(j=>`<option value="${j}" ${j===status(st,events).untested[0]?"selected":""}>${j}</option>`).join("")}</select></label>
        <label>Mistakes<input type="number" id="t_m" min="0" value="" placeholder="Write the number, 0 if none" inputmode="numeric"></label>
        <label>Result<select id="t_res"><option value="pass">Passed (1 mistake or fewer)</option><option value="fail">Not passed</option></select><span class="small muted autog" id="t_resx"></span></label>
        ${examinerField(st)}
      </div>
    </fieldset>
    <fieldset id="f_beh" class="grp"><legend>Homework and behaviour</legend>
      <div class="seg" role="radiogroup" aria-label="Homework"><span class="small muted">Last week's homework:</span><label><input type="radio" name="hw" value="" checked> Not checked</label><label><input type="radio" name="hw" value="1"> Done</label><label><input type="radio" name="hw" value="0"> Not done</label></div>
      <div class="behs">${BEH.map(([k,l,g])=>`<label class="beh ${g}"><input type="checkbox" data-beh="${k}"> ${l} <span class="bp">${sgn(PTS()["b_"+k])}</span></label>`).join("")}</div>
      <p class="small muted" id="s_pts"></p>
    </fieldset>
    <label id="f_noteL">Note<textarea id="s_note" rows="2" placeholder="e.g. mixes up similar verses in Al-A'la and Al-Ghashiyah"></textarea>${micBtn("s_note")}</label>
    <div class="actions"><button class="primary" type="submit">Save</button><span class="small muted" id="s_msg"></span></div>
    <p class="note" id="s_hint"></p>
  </form>`;
  wireBack(el);
  const f=el.querySelector("#sForm");trackForm(f);wireMic(f);
  const dA=f.querySelector("#dupAdd");if(dA)dA.onclick=()=>{busy=false;go({...view,addMore:true})};
  const typ=f.querySelector("#s_type"),rt=f.querySelector("#s_rt"),hs=f.querySelector("#s_hifz");
  const hRows=[],rRows=[],allS=SEQ_SURAHS.slice();
  const sumTo=(sel,cond)=>(m,n)=>{const i=f.querySelector(sel);if(!i)return;if(n&&cond()){i.value=m;i.readOnly=true;i.title="Sum of the mistakes per surah"}else i.readOnly=false};
  const hR=wireRows(f,"h_rows",hRows,allS,sumTo("#s_hm",()=>hs.value==="custom")),rR=wireRows(f,"r_rows",rRows,allS,sumTo("#s_rm",()=>rt.value!=="none"),true);
  const nextRow=()=>{const la=lastAyahOf(st.pos);if(!la)return {s:allS[0],a1:1,a2:QD.verses[allS[0]]};if(la.a2<QD.verses[la.s])return {s:la.s,a1:la.a2+1,a2:QD.verses[la.s]};const k=allS.indexOf(la.s),n=allS[Math.min(allS.length-1,k+1)];return {s:n,a1:1,a2:QD.verses[n]}};
  const hEdit=f.querySelector("#h_edit"),hEditW=f.querySelector("#h_editW");
  hEdit.onclick=()=>{const e=Number(hs.value);if(!(e>st.pos))return;const ps=pieces(st.pos,e);hs.value="custom";hR.set(ps.map(p=>({s:p.s,a1:p.a1,a2:p.a2,m:0})));f.querySelector("#h_rowsW").hidden=false;hEditW.hidden=true;busy=true;hs.dispatchEvent(new Event("change"))};
  hs.onchange=()=>{const c=hs.value==="custom";hEditW.hidden=c||!(Number(hs.value)>st.pos);f.querySelector("#h_rowsW").hidden=!c;if(c&&!hRows.length)hR.set([nextRow()]);else hR.draw()};
  hEditW.hidden=!(Number(hs.value)>st.pos);
  const planRows=v=>v==="near"?p.nearP:v==="far"?p.farP:v==="both"?[...p.nearP,...p.farP]:[];
  rR.set(planRows("near"));
  wireGuide(f,st,hRows,rRows);
  const errs=[];wireErrs(f,errs);const errDraw=f._errDraw;
  let mt=[];const drawMt=()=>{mt=randomPlaces(st,5);useOrder(st);f.querySelector("#mt_list").innerHTML=mt.length?mt.map((x,i)=>`<label class="chk mt"><input type="checkbox" data-mt="${i}"> <span><b>${i+1}.</b> ${errPlace(x)}</span></label>`).join(""):'<p class="muted">Nothing memorized yet to test.</p>'};
  drawMt();f.querySelector("#mt_new").onclick=drawMt;
  const hints={session:"What you pick under \"Recited\" is added to the student's hifz, and the next portion is worked out from it.",test:"Pass: 1 mistake or fewer. If not passed, the juz stays in the near review for another week.",monthly:"Once a month: if fewer than 4 of 5 are correct, give that area extra far review this month.",consol:"",emergency:"Emergency day: near review only, and the far review moves to the next day. After more than 3 emergency days in a row, the first day back is review only.",makeup:"Makeup day: catch up on missed hifz or far review.",note:""};
  const sync=()=>{const t=typ.value,att=f.querySelector("input[name=att]:checked").value;
    f.querySelector("#f_session").hidden=t!=="session";f.querySelector("#f_test").hidden=t!=="test";f.querySelector("#f_monthly").hidden=t!=="monthly";
    f.querySelector("#f_work").hidden=!["present","late"].includes(att);f.querySelector("#f_beh").hidden=t!=="session"||!["present","late"].includes(att);
    f.querySelector("#f_arr").hidden=t!=="session"||att!=="late";f.querySelector("#f_left").hidden=t!=="session"||att==="absent"||att==="excused";
    if(att==="late"&&!f.querySelector("#s_arr").value&&f.querySelector("#s_date").value===iso(today()))f.querySelector("#s_arr").value=nowHM();
    const lm=lateMin(st,{arr:f.querySelector("#s_arr").value});f.querySelector("#s_latemsg").textContent=lm>0?`${lm} minutes late`:"";
    f.querySelector("#s_hint").textContent=hints[t]||"";showPts()};
  const draft=()=>{const att=f.querySelector("input[name=att]:checked").value,hwv=f.querySelector("input[name=hw]:checked").value,hsv=hs.value;
    const hm=Number(f.querySelector("#s_hm").value)||0,hl=hsv==="custom"?hRows.length:Number(hsv)>0;
    return {type:"session",att,hw:hwv===""?undefined:hwv==="1",hifzLines:hl?1:0,hifzMist:hm,hifzNR:hsv==="nr",revNR:rt.value==="nr",revType:rt.value==="nr"?"none":rt.value,revMist:Number(f.querySelector("#s_rm").value)||0,beh:[...f.querySelectorAll("[data-beh]:checked")].map(c=>c.dataset.beh)}};
  const showPts=()=>{const el2=f.querySelector("#s_pts");if(typ.value!=="session"){el2.textContent="";return}const d=draft(),n=ptsOf(d);el2.innerHTML=`<b>Points for this session: ${sgn(n)}</b>${ptsBreak(d).length?"<br>"+esc(breakText(d)):""}`};
  f.addEventListener("input",showPts);f.addEventListener("change",showPts);f.querySelector("#s_arr").addEventListener("change",sync);
  f.querySelectorAll("input[name=att]").forEach(r=>r.onchange=sync);typ.onchange=sync;sync();
  const nrSync=()=>f.querySelectorAll("[data-nrb]").forEach(b=>{const sel=f.querySelector("#"+b.dataset.nrb);const on=sel.value==="nr";b.classList.toggle("on",on);b.textContent=on?"Did not recite ✓ (tap to undo)":"Did not recite"});
  f.querySelectorAll("[data-nrb]").forEach(b=>{const sel=f.querySelector("#"+b.dataset.nrb);const def=sel.value==="nr"?(b.dataset.nrb==="s_rt"?"near":"0"):sel.value;let back=def;b.onclick=()=>{if(sel.value!=="nr"){back=sel.value;sel.value="nr"}else sel.value=back;busy=true;sel.dispatchEvent(new Event("change"));nrSync()};sel.addEventListener("change",nrSync)});setTimeout(nrSync,0);
  rt.onchange=()=>{rR.set(planRows(rt.value));f.querySelector("#r_rowsW").hidden=rt.value==="none"||rt.value==="nr"};
  f.onsubmit=async ev=>{ev.preventDefault();
    const t=typ.value,date=f.querySelector("#s_date").value,note=f.querySelector("#s_note").value.trim(),msg=f.querySelector("#s_msg");
    const d={sid:st.id,type:t,date,t:Date.now()};
    const by=f.querySelector("#s_by").value.trim();if(by){d.by=by;saveBy(by)}
    if(note)d.note=note;
    if(t==="note"){if(!note){msg.textContent="Write the note first.";return}d.text=note;delete d.note}
    let newPos=null;
    if(t==="session"){
      d.att=f.querySelector("input[name=att]:checked").value;
      if(d.att==="late"){d.arr=f.querySelector("#s_arr").value||""}
      if(attended(d)){const hwv=f.querySelector("input[name=hw]:checked").value;if(hwv!=="")d.hw=hwv==="1";const bh=[...f.querySelectorAll("[data-beh]:checked")].map(c=>c.dataset.beh);if(bh.length)d.beh=bh}
      if(attended(d)){
        d.from=st.pos;let any;
        if(hs.value==="custom"){
          if(!hRows.length){msg.textContent="Add the surahs recited, or pick a planned portion.";return}
          d.hifzRows=hRows.map(r=>({...r}));d.hifzText=rowsText(hRows);d.hifzLines=Math.round(hRows.reduce((t,r)=>t+rowLines(r),0)*100)/100;any=true;
          let cur=st.pos;const sp=hRows.map(r=>[seqStartOf(r.s,r.a1),posAfterAyah(r.s,r.a2)]).filter(x=>x[0]!=null).sort((a,b)=>a[0]-b[0]);
          const norm=x=>{const l=lastAyahOf(x);return l?Math.max(x,posAfterAyah(l.s,l.a2)):x};
          for(const[a,b]of sp)if(a<=norm(cur)+0.1&&b>cur)cur=b;
          if(cur>st.pos+0.01){newPos=cur;d.to=cur}
        }else{const e=Number(hs.value);
          d.hifzLines=e>0?Math.round((e-st.pos)*100)/100:0;d.hifzText=e>0?rangeText(st.pos,e):"";any=e>0;if(e>0){newPos=e;d.to=e}}
        d.hifzMist=hs.value==="nr"?0:Number(f.querySelector("#s_hm").value)||0;d.hifzGrade=any?f.querySelector("#s_hg").value:"";if(hs.value==="nr")d.hifzNR=true;
        const rv=rt.value==="nr"?"none":rt.value;if(rt.value==="nr")d.revNR=true;
        const rLive=rRows.filter(r=>!r.skip&&!r.buddy),rSkip=rRows.filter(r=>r.skip);d.revType=rv;if(rv!=="none"&&rLive.length)d.revRows=rLive.map(({skip,added,buddy,...r})=>r);if(rv!=="none"&&rSkip.length)d.revSkip=rSkip.map(({skip,m,buddy,added,...r})=>r);d.revText=rv==="none"?"":rowsText(rLive);d.revMist=rv==="none"?0:Number(f.querySelector("#s_rm").value)||0;d.revGrade=rv==="none"||!rLive.length?"":f.querySelector("#s_rg").value;if(rv!=="none"&&!rLive.length)d.revMist=0;{const bd=rRows.filter(r=>r.buddy&&!r.skip);if(bd.length)d.revBuddy=bd.map(r=>({s:r.s,a1:r.a1,a2:r.a2,m:Number(r.bm)||0,helper:r.buddy}))}
        if(f._rep&&any&&!d.hifzNR){d.hifzRepeat=true;d.hifzGrade="Repeat";if(!(d.hifzRows||[]).length&&d.to!=null)d.hifzRows=pieces(st.pos,d.to).map(p=>({s:p.s,a1:p.a1,a2:p.a2,m:0}));d.hifzText=rowsText(d.hifzRows||[]);d.hifzLines=0;delete d.to;newPos=null}
        if(f._mk){if(!d.hifzNR&&any){const k=cleanKinds(f._mk.h);if(k)d.hifzMk=k}if(rv!=="none"){const k=cleanKinds(f._mk.r);if(k)d.revMk=k}}
        if(errs.length)d.errs=errs.slice();
        {const prevT=events.filter(e=>e.type==="session"&&e.sid===st.id&&e.date===date&&!(dup&&e.id===dup.id)&&(!dup||(e.t||0)<(dup.t||0))).reduce((x,e)=>Math.max(x,e.t||0),0);const mk=part=>marks.filter(x=>x.sid===st.id&&x.date===date&&x.src==="session"&&(x.part||"r")===part&&(x.t||0)>prevT).length;
          if(any&&!d.hifzNR)d.hifzMu=Math.max(0,(d.hifzMist||0)-mk("h"));if(rv!=="none"&&rLive.length)d.revMu=Math.max(0,(d.revMist||0)-mk("r"));
          if(f._stopWhy&&f.dataset.hmode==="part"&&any)d.hifzStop=f._stopWhy}
      }else{d.hifzLines=0;d.hifzMist=0;d.revMist=0}
      const ex=events.find(x=>x.type==="session"&&x.sid===st.id&&x.date===date&&!x.hifzLines&&!x.revType);
      if(ex)d._replace=ex.id;
      if(dup){d._replace=dup.id;if(newPos==null&&dup.to!=null)newPos=st.pos}
    }
    if(t==="test"){const tm=f.querySelector("#t_m").value.trim();if(tm===""){msg.textContent="Write how many mistakes there were in the juz test (0 if none).";return}d.juz=Number(f.querySelector("#t_juz").value);d.mistakes=Number(tm)||0;d.result=f.querySelector("#t_res").value;const ex=f.querySelector("#t_ex");if(ex)d.examiner=ex.value}
    if(t==="consol")d.block=status(st,events).block||5;
    if(t==="monthly"){if(!mt.length){msg.textContent="Nothing memorized yet to test.";return}d.places=mt.map((x,i)=>({...x,ok:f.querySelector(`[data-mt="${i}"]`).checked}));d.score=d.places.filter(x=>x.ok).length}
    if(t==="session"&&newPos!=null){const later=events.filter(e=>e.type==="session"&&e.sid===st.id&&e.date>date&&(e.to!=null||e.hifzLines>0)&&!e.noAdvance&&!(dup&&e.id===dup.id)).sort((x,y)=>y.date.localeCompare(x.date))[0];
      if(later){newPos=null;d.noAdvance=true;if(!f._oddOk){msg.innerHTML=`<span class="oddw"><b>Check before saving:</b> there is a later record (${esc(fmtShort(later.date))}). This one is saved as history and does not move the student's position. <button type="button" class="sm" id="oddYes">Save anyway</button></span>`;msg.querySelector("#oddYes").onclick=()=>{f._oddOk=true;f.requestSubmit?f.requestSubmit():f.querySelector("button.primary[type=submit]").click()};return}}}
    if(t==="session"&&!f._oddOk){const w=oddChecks(st,d,["more","custom"].includes(f.dataset.hmode)?0:ends.length?ends[0]-st.pos:0);if(w.length){msg.innerHTML=`<span class="oddw"><b>Check before saving:</b> ${w.map(esc).join(" ")} <button type="button" class="sm" id="oddYes">Save anyway</button></span>`;msg.querySelector("#oddYes").onclick=()=>{f._oddOk=true;f.requestSubmit?f.requestSubmit():f.querySelector("button.primary[type=submit]").click()};return}}
    if(f._saving)return;f._saving=true;busy=true;const sbtns=[...f.querySelectorAll("button[type=submit]")];sbtns.forEach(b=>b.disabled=true);
    msg.textContent="Saving…";msg.classList.remove("errm");const origPos=f._origPos!=null?f._origPos:(f._origPos=(allStudents.find(x=>x.id===st.id)||st).pos);let nid=null,prevDoc=null,evOk=false;
    Object.assign(d,stampRec());
    try{
      const rep=d._replace;delete d._replace;prevDoc=rep?(f._prevDoc||(f._prevDoc=events.find(x=>x.id===rep)||null)):null;
      if(t==="session"){const lv=f.querySelector("#s_left").value;if(lv){d.left=lv;d.leftWhy=f.querySelector("#s_leftw").value.trim()}}
      if(rep)await db.doc("events/"+rep).set(d);else{if(!f._eid)f._eid="e"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);nid=f._eid;await db.doc("events/"+nid).set(d)}
      evOk=true;
      if(newPos!=null)await db.doc("students/"+st.id).update({pos:newPos});
      const pd=prevDoc,np=newPos;undoToast(pd?"Record updated":"Saved",async()=>{if(pd)await db.doc("events/"+pd.id).set(plain(pd));else if(nid)await db.doc("events/"+nid).delete();if(np!=null)await db.doc("students/"+st.id).update({pos:origPos})});
      if(t==="session"&&attended(d))autoStartClass(st);
    }catch(e){f._saving=false;sbtns.forEach(b=>b.disabled=false);msg.classList.add("errm");msg.setAttribute("role","alert");msg.textContent=evOk?"The record was saved, but the student's position was not updated. Tap Save again (it will not make a second record).":"Not saved. Check your connection and try again.";return}
    busy=false;if(f.dataset.quick&&t==="session")go({name:"saved",id:st.id,d});else go({name:"student",id:st.id});
  };
  if(!view.pre)quickSession(el,f,st,{hs,rt,hR,rR,hRows,rRows,planRows,ends,wk,dup,sync,errs,errDraw});
}

// ---------- history ----------
function renderHistory(el,sub,st){
  const s=status(st,events),flt=view.f||"all";
  sub.textContent=st.name+" · history";
  const F={all:["All",()=>true],hifz:["Hifz",e=>e.type==="session"&&e.hifzLines>0],rev:["Review",e=>e.type==="session"&&e.revType&&e.revType!=="none"],att:["Absent or late",e=>e.type==="session"&&e.att!=="present"],beh:["Behaviour",e=>e.type==="session"&&(e.beh||[]).length>0],pts:["Points",e=>e.type==="points"],test:["Tests",e=>e.type==="test"||e.type==="consol"||e.type==="monthly"],note:["Notes",e=>e.type==="note"||!!e.note],other:["Emergency and makeup",e=>e.type==="emergency"||e.type==="makeup"]};
  const list=s.mine.filter(F[flt][1]);
  const ses=s.sessions.filter(e=>e.att!=="absent");
  const hl=ses.reduce((t,e)=>t+(e.hifzLines||0),0),hm=ses.reduce((t,e)=>t+(e.hifzMist||0),0),rm=ses.reduce((t,e)=>t+(e.revMist||0),0);
  el.innerHTML=`
  ${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel">
    <div class="stats">
      <div><b>${new Set(s.sessions.filter(attended).map(e=>e.date)).size}</b><span>sessions attended</span></div>
      <div><b>${s.sessions.filter(e=>e.att==="late").length}</b><span>times late</span></div>
      <div><b>${ptsSum(st.id)}</b><span>points</span></div>
      <div><b>${s.sessions.filter(e=>e.att==="absent").length}</b><span>absences</span></div>
      <div><b>${pagesOf(hl)}</b><span>pages recited</span></div>
      <div><b>${hl?Math.round(hm/Math.max(1,pagesOf(hl))*10)/10:"—"}</b><span>hifz mistakes per page</span></div>
      <div><b>${rm}</b><span>review mistakes</span></div>
      <div><b>${s.passed.size}</b><span>juz tests passed</span></div>
    </div>
  </div>
  <form class="panel" id="nForm"><label>New note on ${esc(st.name)}<textarea id="n_text" rows="2" placeholder="Write your note here"></textarea>${micBtn("n_text")}</label>
    <div class="actions"><button class="primary" type="submit">Add note</button><span class="small muted" id="n_msg"></span></div></form>
  <div class="filters">${Object.entries(F).map(([k,v])=>`<button class="fbtn ${k===flt?"on":""}" data-f="${k}">${v[0]}</button>`).join("")}</div>
  <div class="panel"><div class="log">${list.length?list.map(evRow).join(""):'<p class="muted">Nothing here yet.</p>'}</div></div>
  ${errorBookPanel(st)}`;
  wireBack(el);wireFix(el,st);
  el.querySelectorAll(".fbtn").forEach(b=>b.onclick=()=>{view.f=b.dataset.f;render(true)});
  const nf=el.querySelector("#nForm");trackForm(nf);
  nf.onsubmit=async ev=>{ev.preventDefault();const t=nf.querySelector("#n_text").value.trim();if(!t)return;
    nf.querySelector("#n_msg").textContent="Saving…";
    try{await db.collection("events").add({sid:st.id,type:"note",date:iso(today()),t:Date.now(),text:t});busy=false;render(true)}catch(e){nf.querySelector("#n_msg").textContent="Not saved. Try again."}};
  wireDeletes(el,st);
}

// ---------- add / edit ----------
function prevGroups(st){
  const legacy=Array.isArray(st.prevS)?null:prevRangesOf(st);
  const isOn=x=>legacy?covered(legacy,SURAH_A[x],SURAH_B[x])>(SURAH_B[x]-SURAH_A[x])/2:st.prevS.map(Number).includes(x);
  const nas=(st.order||"nas")!=="fatiha",groups=[];
  for(let j=1;j<=30;j++){const ss=[];for(let x=0;x<114;x++)if(surahStartJuz(x)===j)ss.push(x);if(ss.length)groups.push([j,nas?ss.reverse():ss])}
  if(nas)groups.reverse();
  return groups.map(([j,ss])=>`<div class="pgrp"><label class="chk pj"><input type="checkbox" data-pj="${j}"> Juz ${j}</label><div class="pss">${ss.map(x=>`<label class="chk"><input type="checkbox" data-ps="${x}" data-psj="${j}" ${isOn(x)?"checked":""}> ${SURAH_NAMES[x]}</label>`).join("")}</div></div>`).join("")}
function renderForm(el,sub,st){
  const isNew=!st,tchAdd=isNew&&SUB,cls=tchAdd?myAddCls():classes; // a teacher adds only into their own groups
  st=st||{name:"",amount:5,days:[6,0,1,2,3,4],start:iso(today()),pos:0,order:"nas",cls:view.cls&&cls.some(c=>c.id===view.cls)?view.cls:(cls[0]||{}).id};
  useOrder(st);
  sub.textContent=isNew?"New student":"Edit "+st.name;
  const la=lastAyahOf(st.pos);
  const surahOpts=(sel)=>{let lastJ=null;return SEQ_SURAHS.map(s=>{const j=surahStartJuz(s);let o="";if(j!==lastJ){o+=(lastJ!==null?"</optgroup>":"")+`<optgroup label="Juz ${j}">`;lastJ=j}
    return o+`<option value="${s}" ${sel===s?"selected":""}>${SURAH_NAMES[s]} (${QD.verses[s]} ayahs)</option>`}).join("")+"</optgroup>"};
    el.innerHTML=`
  ${backBtn("Back",isNew?{name:"list"}:{name:"student",id:st.id})}
  <form class="panel" id="fForm">
    <div class="fields">
      <label>Student name<input id="f_name" required value="${esc(st.name)}" autocomplete="off"></label>
      <label>Class<select id="f_cls">${cls.map(c=>`<option value="${c.id}" ${c.id===st.cls?"selected":""}>${esc(c.name)}</option>`).join("")}${tchAdd?"":`<option value="" ${classes.some(c=>c.id===st.cls)?"":"selected"}>No class</option>`}</select></label>
      <label>First surah of new hifz<select id="f_s0">${SURAH_NAMES.map((n,x)=>`<option value="${x}" ${x===Number(ORDER_KEY.split("|")[1])?"selected":""}>${x+1}. ${n}</option>`).join("")}</select></label>
      <label>Then goes<select id="f_order">${Object.entries(ORDER_NAMES).map(([k,v])=>`<option value="${k}" ${k===ORDER_KEY.split("|")[0]?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Daily reading from the mushaf<select id="f_read">${READS.map(r=>`<option value="${r[0]}" ${r[0]===readOf(st)?"selected":""}>${r[1]}</option>`).join("")}</select></label>
      <label>Reading starts at page<input type="number" id="f_rstart" min="1" max="604" value="${Number(st.readStart)||1}" inputmode="numeric"></label>
      <label>Reading starts on<input type="date" id="f_rfrom" value="${st.readFrom||st.start||""}"></label>
      <label>Daily amount Hifz<select id="f_amount">${AMOUNTS.map(a=>`<option value="${a[0]}" ${a[0]===st.amount?"selected":""}>${a[1]}</option>`).join("")}</select></label>
      <label>Review everything memorized in<select id="f_far">${FAR_DAYS.map(d=>`<option value="${d}" ${d===farDaysOf(st)?"selected":""}>${d} days</option>`).join("")}</select></label>
      <label>Start date<input type="date" id="f_start" value="${st.start}"></label>
      <label>Parent's WhatsApp number<input type="tel" id="f_phone" value="${esc(st.phone||"")}" placeholder="with country code, e.g. +20 100 123 4567" autocomplete="off"></label>
    </div>
    <div><p class="small muted lbl">Hifz days each week (near review, far review and reading happen every day)</p>
      <div class="days">${[6,0,1,2,3,4,5].map(d=>`<label><input type="checkbox" value="${d}" ${st.days.includes(d)?"checked":""}> ${DAY_NAMES[d]}</label>`).join("")}</div></div>
    <details class="prevbox" ${PREV_R.length?"open":""}><summary>Surahs memorized before <span class="small muted" id="f_prevn"></span></summary>
      <p class="small muted">They go straight into the far review and are skipped in new hifz. Tick a juz to tick all the surahs that start in it.</p>
      <div class="prevgrid">${prevGroups(st)}</div></details>
    <div><p class="small muted lbl">Last memorized in new hifz</p>
      <div class="fields">
        <label>Surah<select id="f_surah"><option value="-1" ${la?"":"selected"}>New hifz not started</option>${surahOpts(la?la.s:-1)}</select></label>
        <label>Up to ayah<input type="number" id="f_ayah" min="1" value="${la?la.a2:""}" inputmode="numeric"></label>
      </div></div>
    <p class="note" id="f_ordnote"></p>${tchAdd?`<p class="note">After you add the student, only an admin can change these details, move the student to another group or delete them.</p>`:""}
    <div class="actions"><button class="primary" type="submit">${isNew?"Add student":"Save changes"}</button>${isNew?"":`<button type="button" id="archBtn">${st.archived?"Restore student":"Archive student"}</button><button type="button" id="delBtn">Delete student</button>`}<span class="small muted" id="f_msg"></span></div>
  </form>`;
  wireBack(el);
  const f=el.querySelector("#fForm");trackForm(f);
  const sel=f.querySelector("#f_surah"),ay=f.querySelector("#f_ayah");
  sel.onchange=()=>{const s=Number(sel.value);if(s>=0){ay.max=QD.verses[s];ay.value=QD.verses[s]}else ay.value=""};
  const ord=f.querySelector("#f_order"),ordNote=f.querySelector("#f_ordnote");
  const s0el=f.querySelector("#f_s0");
  const noteText=()=>{const[k,x]=ORDER_KEY.split("|");const seq=SEQ_SURAHS.slice(0,4).map(v=>SURAH_NAMES[v]).join(", ");return `Order: ${seq} … each surah memorized from its start, then the rest of the Quran. Only what comes before the last memorized ayah in this order counts as memorized, so the far review covers just that and the surahs ticked below. Each daily portion starts and ends on a full ayah.`};
  ordNote.textContent=noteText();
  const prevVal=()=>[...f.querySelectorAll(".prevgrid input[data-ps]:checked")].map(i=>Number(i.dataset.ps));
  const prevCount=()=>{const v=prevVal();f.querySelector("#f_prevn").textContent=v.length?`· ${v.length} ${v.length===1?"surah":"surahs"}`:"· none";
    f.querySelectorAll("[data-pj]").forEach(j=>{const bs=[...f.querySelectorAll(`[data-psj="${j.dataset.pj}"]`)];j.checked=bs.length>0&&bs.every(b=>b.checked);j.indeterminate=!j.checked&&bs.some(b=>b.checked)})};
  f.querySelectorAll("[data-pj]").forEach(j=>j.addEventListener("change",()=>{f.querySelectorAll(`[data-psj="${j.dataset.pj}"]`).forEach(b=>b.checked=j.checked);ord.onchange()}));
  f.querySelectorAll("[data-ps]").forEach(i=>i.addEventListener("change",()=>ord.onchange()));
  let lastOrd=ord.value;
  ord.onchange=()=>{if(ord.value!==lastOrd){if(Number(s0el.value)===defStart(lastOrd))s0el.value=defStart(ord.value);lastOrd=ord.value}prevCount();useOrder({order:ord.value,prevS:prevVal(),startS:Number(s0el.value)});const keep=Number(sel.value);sel.innerHTML=`<option value="-1">New hifz not started</option>${surahOpts(keep)}`;if(keep<0)sel.value="-1";ordNote.textContent=noteText()};
  s0el.onchange=()=>ord.onchange();
  if(isNew){const fc=f.querySelector("#f_cls"),fr=f.querySelector("#f_read");fc.addEventListener("change",()=>{fr.value=String(clsRead(classes.find(c=>c.id===fc.value)))})}
  prevCount();
  f.onsubmit=async ev=>{ev.preventDefault();
    const days=[...f.querySelectorAll(".days input:checked")].map(i=>Number(i.value)),msg=f.querySelector("#f_msg");
    if(!days.length){msg.textContent="Pick at least one hifz day.";return}
    const s=Number(sel.value);let pos=0;const prevS=prevVal(),startS=Number(s0el.value);useOrder({order:ord.value,prevS,startS});
    if(s>=0){const a=Math.min(QD.verses[s],Math.max(1,Number(ay.value)||QD.verses[s]));pos=posAfterAyah(s,a)}
    const data={name:f.querySelector("#f_name").value.trim(),cls:f.querySelector("#f_cls").value,order:ord.value,startS,prevS,prev:[],amount:Number(f.querySelector("#f_amount").value),farDays:Number(f.querySelector("#f_far").value),readPages:Number(f.querySelector("#f_read").value),readStart:Math.min(604,Math.max(1,Number(f.querySelector("#f_rstart").value)||1)),readFrom:(f.querySelector("#f_rfrom")||{}).value||null,start:f.querySelector("#f_start").value||iso(today()),phone:f.querySelector("#f_phone").value.trim(),days,pos};
    if(isNew)data.created=iso(today());
    if(!isNew){const newL=pos+PREV_LINES;useOrder(st);const oldL=(Number(st.pos)||0)+PREV_LINES;useOrder({order:ord.value,prevS,startS});
      if(s>=0&&prevS.includes(s)&&f.dataset.pc!=="2"){f.dataset.pc="2";msg.textContent=`${SURAH_NAMES[s]} is ticked as memorized before. "Reached" should be the last place memorized in the program. Fix it, or tap Save again to keep it.`;return}
      if(Math.abs(newL-oldL)>LINES&&f.dataset.pc!=="1"&&f.dataset.pc!=="2"){f.dataset.pc="1";msg.textContent=`This changes memorized from ${pagesOf(oldL)} to ${pagesOf(newL)} pages. Tap Save again to confirm.`;return}
      if(Math.abs((Number(st.pos)||0)-pos)>0.01)data.posLog=[...(st.posLog||[]).slice(-19),{at:Date.now(),from:Number(st.pos)||0,to:pos,why:"edit"}]}
    msg.textContent="Saving…";
    try{if(isNew){const r=await db.collection("students").add(data);for(let i=0;i<30&&!allStudents.some(s=>s.id===r.id);i++)await new Promise(w=>setTimeout(w,100));busy=false;go({name:"student",id:r.id})}
      else{await db.doc("students/"+st.id).update(data);busy=false;go({name:"student",id:st.id})}}
    catch(e){msg.textContent="Not saved. Check your connection and try again."}
  };
  const ab=f.querySelector("#archBtn");if(ab)ab.onclick=async()=>{await setArchived(st,!st.archived);busy=false;go(st.archived?{name:"student",id:st.id}:{name:"list"})};
  const del=f.querySelector("#delBtn");
  if(del)del.onclick=async()=>{
    if(del.dataset.confirm!=="1"){del.dataset.confirm="1";del.textContent="Tap again to delete the student and their history";return}
    try{for(const e of events.filter(e=>e.sid===st.id))await db.doc("events/"+e.id).delete();await db.doc("students/"+st.id).delete();busy=false;go({name:"list"})}catch(e){}
  };
}

// ---------- classes ----------
function renderClasses(el,sub){
  sub.textContent="Settings: classes, points, holidays, backup";
  const dayBoxes=(days,name)=>`<div class="days">${[6,0,1,2,3,4,5].map(d=>`<label><input type="checkbox" name="${name}" value="${d}" ${(days||[]).includes(d)?"checked":""}> ${DAY_NAMES[d]}</label>`).join("")}</div>`;
  el.innerHTML=`
  ${backBtn("All students",{name:"list"})}
  <div class="panel">
    <h3>Classes</h3>
    <div class="clslist">${classes.length?classes.map(c=>{const n=allStudents.filter(s=>s.cls===c.id).length;return `
      <form class="clsform" data-id="${c.id}">
        <div class="clsrow"><input class="cname" value="${esc(c.name)}" aria-label="Class name" required><label class="inl">Starts<input class="ctime" type="time" value="${esc(c.time||"")}"></label><label class="inl">Ends<input class="cend" type="time" value="${esc(c.end||"")}"></label><span class="small muted">${n} ${n===1?"student":"students"}</span></div>
        <p class="small muted lbl">Class days</p>${dayBoxes(c.days,"d_"+c.id)}
        <label class="chk"><input type="checkbox" class="cnoneg" ${c.noNeg?"checked":""}> No minus points in this class (absence, behaviour and the rest give 0 instead)</label>
        <label>Daily reading for new students<select class="cread">${READS.map(r=>`<option value="${r[0]}" ${r[0]===clsRead(c)?"selected":""}>${r[1]}</option>`).join("")}</select></label>
        ${n?`<label class="chk"><input type="checkbox" class="creadall"> Also set this reading now for the ${n} ${n===1?"student":"students"} in this class</label>`:""}
        <div class="actions"><button type="submit">Save</button><button type="button" data-open="1">Open class log</button>${n?"":'<button type="button" class="link small" data-delcls="1">Delete</button>'}<span class="small muted cmsg"></span></div>
      </form>`}).join(""):'<p class="muted">No classes yet. Add the first one below.</p>'}</div>
    <p class="note">To move a student to another class, open the student and tap "Edit details". A class can only be deleted when it has no students.</p>
  </div>
  <form class="panel" id="newCls"><label>New class<input id="c_name" placeholder="e.g. Girls' class" required></label>
    <p class="small muted lbl">Class days</p>${dayBoxes([],"d_new")}
    <div class="actions"><button class="primary" type="submit">Add class</button><span class="small muted" id="c_msg"></span></div></form>
  ${pointsSettings()}
  ${breaksPanel()}
  ${backupPanel()}`;
  wireBreaks(el);wirePtsSettings(el);
  wireBackup(el);
  wireBack(el);
  const daysOf=(f,name)=>[...f.querySelectorAll(`input[name="${name}"]:checked`)].map(i=>Number(i.value));
  el.querySelectorAll(".clsform").forEach(f=>{trackForm(f);const id=f.dataset.id;
    f.onsubmit=async e=>{e.preventDefault();const name=f.querySelector(".cname").value.trim();if(!name)return;
      try{const rd=Number(f.querySelector(".cread").value);await db.doc("classes/"+id).update({name,time:f.querySelector(".ctime").value,end:f.querySelector(".cend").value,days:daysOf(f,"d_"+id),noNeg:f.querySelector(".cnoneg").checked,readDef:rd});
        const all=f.querySelector(".creadall");if(all&&all.checked)for(const s of allStudents.filter(s=>s.cls===id))await db.doc("students/"+s.id).update({readPages:rd});busy=false;render(true)}catch(_){f.querySelector(".cmsg").textContent="Not saved. Try again."}};
    f.querySelector("[data-open]").onclick=()=>{busy=false;go({name:"class",id,date:iso(today())})};
    const d=f.querySelector("[data-delcls]");if(d)d.onclick=async()=>{if(d.dataset.confirm!=="1"){d.dataset.confirm="1";d.textContent="Confirm delete?";return}try{await db.doc("classes/"+id).delete();busy=false;render(true)}catch(_){}}});
  const nf=el.querySelector("#newCls");trackForm(nf);
  nf.onsubmit=async e=>{e.preventDefault();const name=nf.querySelector("#c_name").value.trim();if(!name)return;
    try{await db.collection("classes").add({name,n:Date.now(),days:daysOf(nf,"d_new"),time:""});busy=false;render(true)}catch(_){nf.querySelector("#c_msg").textContent="Not added. Try again."}};
}

// ---------- class log (one class meeting) ----------
const ACTIVITIES=[["tajweed","Tajweed lesson","Topic, e.g. Noon sakinah"],["group","Group recitation","Surah or ayahs"],["listen","Listening","Reciter or portion"],["tafsir","Tafsir","Surah or topic"],["adab","Story or adab","Topic"],["quiz","Quiz or competition","What was asked"],["other","Other","Describe it"]];
const meetingOf=(cls,date)=>meetings.find(m=>m.cls===cls&&m.date===date);
const clsDays=c=>(c&&c.days)||[];
function scheduleText(c){const d=clsDays(c);return d.length?[6,0,1,2,3,4,5].filter(x=>d.includes(x)).map(x=>DAY_NAMES[x]).join(", ")+(c.time?" · "+c.time+(c.end?"–"+c.end:""):""):"No class days set"}
function meetingSummary(m){if(!m)return "";if(m.status==="cancelled")return `<span class="chip bad">Cancelled</span>${m.reason?" "+esc(m.reason):""}`;
  const acts=(m.acts||[]).map(a=>{const def=ACTIVITIES.find(x=>x[0]===a.k);return `<b>${def?def[1]:esc(a.k)}</b>${a.d?": "+esc(a.d):""}`}).join(" · ");
  const tt=classTimeText(m);return `<span class="chip ok">Held</span>${tt?` <span class="small muted">${esc(tt)}</span>`:""} ${acts}${m.note?`<br><span class="muted">${esc(m.note)}</span>`:""}`}
function renderClass(el,sub){
  const c=classes.find(c=>c.id===view.id);if(!c){view={name:"list"};return render(true)}
  const date=view.date||iso(today()),m=meetingOf(c.id,date),status=m?m.status:"held";
  const kids=students.filter(s=>s.cls===c.id).sort((a,b)=>a.name.localeCompare(b.name));
  const att=new Map(events.filter(e=>e.type==="session"&&e.date===date).map(e=>[e.sid,e.att]));
  const arrOf=new Map(events.filter(e=>e.type==="session"&&e.date===date&&e.att==="late").map(e=>[e.sid,e.arr||""]));
  const past=meetings.filter(x=>x.cls===c.id).sort((a,b)=>b.date.localeCompare(a.date));
  const onDay=clsDays(c).includes(parse(date).getDay());
  sub.textContent=`${c.name} · ${scheduleText(c)}`;
  el.innerHTML=`
  ${backBtn("All students",{name:"list"})}
  <div class="panel tight"><div class="cbar"><span class="small muted">What this class memorized, reviewed and studied in any period</span><button class="primary" id="crepBtn">Class report</button></div></div>
  <form class="panel" id="mForm">
    <div class="head"><h2><bdi>${esc(c.name)}</bdi></h2><label class="inl">Date<input type="date" id="m_date" value="${date}"></label></div>
    ${onDay?"":`<p class="banner info">${fmt(parse(date))} is not one of this class's days. You can still record it, for example as a makeup class.</p>`}
    <div class="seg" role="radiogroup" aria-label="Class status">
      <label><input type="radio" name="mst" value="held" ${status!=="cancelled"?"checked":""}> Held</label>
      <label><input type="radio" name="mst" value="cancelled" ${status==="cancelled"?"checked":""}> Cancelled</label>
    </div>
    <label id="m_reasonL">Reason for cancelling<input id="m_reason" value="${esc(m&&m.reason||"")}" placeholder="e.g. emergency, travel, public holiday"></label>
    <div id="m_held">
      <h3 class="sec">What we did</h3>
      <div class="acts">${ACTIVITIES.map(([k,label,ph])=>{const a=(m&&m.acts||[]).find(x=>x.k===k);return `
        <div class="act"><label class="chk"><input type="checkbox" data-act="${k}" ${a?"checked":""}> ${label}</label><input type="text" data-actd="${k}" value="${esc(a&&a.d||"")}" placeholder="${ph}" ${a?"":"hidden"} ${k==="tajweed"?'list="tjlist"':""}></div>`}).join("")}</div>
      <datalist id="tjlist">${TAJWEED.map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
      <div class="fields"><label>Class started at<input type="time" id="m_st" value="${esc(m&&m.started||"")}"></label><label>Class ended at<input type="time" id="m_en" value="${esc(m&&m.ended||"")}"></label><label>Teacher<input id="m_by" value="${esc(m&&m.startBy||lastBy()||"")}" autocomplete="off"></label></div>
      <label>Class note<textarea id="m_note" rows="2" placeholder="Anything to remember about this class">${esc(m&&m.note||"")}</textarea></label>
    </div>
    <div class="actions"><button class="primary" type="submit">Save class log</button><span class="small muted" id="m_msg">${m?"Saved":""}</span></div>
  </form>
  <div class="panel" id="attPanel">
    <h3>Attendance · ${fmt(parse(date))}</h3>
    ${status==="cancelled"?'<p class="muted">The class was cancelled, so nobody is marked absent.</p>':kids.length?`<div class="attlist">${kids.map(s=>`<div class="attrow"><span><bdi>${esc(s.name)}</bdi>${att.get(s.id)==="late"?` <input type="time" class="arrin" data-arr="${s.id}" value="${esc(arrOf.get(s.id))}" aria-label="Arrived at">`:""}</span><span class="att" data-sid="${s.id}">${Object.entries(ATT).map(([k,v])=>`<button type="button" class="attbtn ${att.get(s.id)===k?"on "+v[0]:""}" data-att="${k}">${v[1]}</button>`).join("")}</span>${leftCtl(s.id,date,false)}</div>`).join("")}</div>`:'<p class="muted">No students in this class yet.</p>'}
  </div>
  <div class="panel">
    <h3>Past classes</h3>
    <div class="log">${past.length?past.slice(0,40).map(x=>`<div class="ev"><time>${fmtShort(x.date)}</time><div class="evb">${meetingSummary(x)}</div><button class="link small" data-goto="${x.date}">Open</button></div>`).join(""):'<p class="muted">No classes recorded yet.</p>'}</div>
  </div>
  ${boardPanel(c)}
  ${tajweedPanel(c,date)}`;
  wireTajweed(el,c,date);
  wireBack(el);el.querySelector("#crepBtn").onclick=()=>{busy=false;go({name:"crep",id:c.id})};
  const f=el.querySelector("#mForm");
  const sync=()=>{const st=f.querySelector("input[name=mst]:checked").value;f.querySelector("#m_reasonL").hidden=st!=="cancelled";f.querySelector("#m_held").hidden=st==="cancelled"};
  f.querySelectorAll("input[name=mst]").forEach(r=>r.onchange=()=>{busy=true;sync()});sync();
  f.querySelectorAll("[data-act]").forEach(cb=>cb.onchange=()=>{busy=true;const d=f.querySelector(`[data-actd="${cb.dataset.act}"]`);d.hidden=!cb.checked;if(cb.checked)d.focus()});
  f.querySelectorAll("input[type=text],textarea").forEach(i=>i.addEventListener("input",()=>busy=true));
  f.querySelector("#m_date").onchange=e=>{busy=false;view.date=e.target.value||iso(today());render(true)};
  f.onsubmit=async e=>{e.preventDefault();const st=f.querySelector("input[name=mst]:checked").value,msg=f.querySelector("#m_msg");
    const data={cls:c.id,date,status:st,t:Date.now()};
    if(st==="cancelled")data.reason=f.querySelector("#m_reason").value.trim();
    else{data.acts=[...f.querySelectorAll("[data-act]:checked")].map(cb=>({k:cb.dataset.act,d:f.querySelector(`[data-actd="${cb.dataset.act}"]`).value.trim()}));data.note=f.querySelector("#m_note").value.trim();data.started=f.querySelector("#m_st").value;data.ended=f.querySelector("#m_en").value;data.startBy=f.querySelector("#m_by").value.trim()}
    msg.textContent="Saving…";
    try{await db.doc(`meetings/${c.id}_${date}`).set(data);
      const tj=(data.acts||[]).find(a=>a.k==="tajweed"&&a.d);
      if(tj){const q=tj.d.toLowerCase();let i=TAJWEED.findIndex(t=>t.toLowerCase()===q);if(i<0&&q.length>=4)i=TAJWEED.findIndex(t=>t.toLowerCase().includes(q));
        if(i>=0&&!(c.tajweed||{})[i])await db.doc("classes/"+c.id).update({tajweed:{...(c.tajweed||{}),[i]:date}})}
      busy=false;render(true)}catch(_){msg.textContent="Not saved. Check your connection and try again."}};
  el.querySelectorAll("#attPanel .attbtn").forEach(b=>b.onclick=async()=>{await setAttendance(b.parentElement.dataset.sid,date,b.dataset.att)});
  el.querySelectorAll("[data-arr]").forEach(i=>i.onchange=()=>setAttendance(i.dataset.arr,date,"late",i.value));wireLeft(el,date);
  wireBoard(el,c);
  el.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{busy=false;view.date=b.dataset.goto;render(true);scrollTo(0,0)});
}

// ---------- shared: files to save ----------
// printable pages are turned into PDF in the browser (html2pdf: html2canvas + jsPDF), so Arabic and the mushaf font look exactly as on screen
const H2P_URL="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
let h2pP=null;
function loadH2P(){return h2pP||(h2pP=new Promise((res,rej)=>{if(window.html2pdf)return res(window.html2pdf);const sc=document.createElement("script");sc.src=H2P_URL;sc.onload=()=>window.html2pdf?res(window.html2pdf):rej(new Error("no library"));sc.onerror=()=>{h2pP=null;rej(new Error("load failed"))};document.head.append(sc)}))}
function scopeCss(css,root){let out="";css.replace(/([^{}]+)\{([^{}]*)\}/g,(m,sel,body)=>{sel=sel.trim();if(sel.startsWith("@page"))return m;
  if(sel.startsWith("@"))out+=`${sel}{${body}}`;else out+=sel.split(",").map(x=>{x=x.trim();return x==="body"||x==="html"?root:x.startsWith("body ")?root+x.slice(4):`${root} ${x}`}).join(",")+`{${body}}`;return m});return out}
async function htmlToPdf(html){
  const lib=await loadH2P();
  const doc=new DOMParser().parseFromString(html,"text/html");
  const css=[...doc.querySelectorAll("style")].map(x=>x.textContent).join("\n");doc.querySelectorAll("script").forEach(x=>x.remove());
  const land=/landscape/.test(css),W=land?1077:718; // A4 minus the PDF margins, in CSS pixels
  const host=document.createElement("div");host.setAttribute("aria-hidden","true");host.setAttribute("dir",doc.documentElement.getAttribute("dir")||"ltr");host.style.cssText=`position:fixed;left:-${W+4000}px;top:0;width:${W}px;background:#fff;color:#111`;
  host.innerHTML=`<style>${scopeCss(css,".pdfroot")}.pdfroot{margin:0!important;padding:${land?0:"4px"};box-sizing:border-box;width:${W}px;background:#fff}</style><div class="pdfroot">${doc.body.innerHTML}</div>`;
  document.body.append(host);
  const sx=window.scrollX,sy=window.scrollY;window.scrollTo(0,0); // html2canvas captures blank when the page is scrolled
  const hd=document.documentElement.getAttribute("dir");document.documentElement.setAttribute("dir","ltr"); // an RTL page shifts the off-screen copy out of the capture
  try{await document.fonts.ready;fitPage(host);
    return await lib().set({margin:land?[6,6,6,6]:[10,10,12,10],image:{type:"jpeg",quality:0.95},html2canvas:{scale:2,backgroundColor:"#ffffff",windowWidth:Math.max(W,document.documentElement.clientWidth||0),scrollX:0,scrollY:0},jsPDF:{unit:"mm",format:"a4",orientation:land?"landscape":"portrait"},pagebreak:{mode:["css","legacy"],avoid:["tr",".pbox",".mbox","h2",".c",".wkb",".dcard",".stats",".hbox"]}}).from(host.querySelector(".pdfroot")).outputPdf("blob");
  }finally{host.remove();if(hd)document.documentElement.setAttribute("dir",hd);else document.documentElement.removeAttribute("dir");window.scrollTo(sx,sy)}}
async function saveFile(name,html,msg){
  if(!downloads){if(msg)msg.textContent="Downloads are not available in this window.";return}
  if(name.endsWith(".html")){
    if(msg)msg.textContent="Making the PDF…";
    let pdf=null;try{pdf=await htmlToPdf(html)}catch(e){pdf=null}
    if(pdf){try{await downloads.save({filename:name.replace(/\.html$/,".pdf"),data:pdf});if(msg)msg.textContent="Saved as PDF."}catch(e){if(msg)msg.textContent=e&&e.code==="declined"?"":"Download failed. Try again."}return}
    if(msg)msg.textContent="The PDF could not be made, so it was saved as a web page you can print.";
  }
  try{await downloads.save({filename:name,data:new Blob([html],{type:name.endsWith(".xls")?"application/vnd.ms-excel":"text/html"})});if(msg&&!name.endsWith(".html"))msg.textContent="Saved. Open the file on your device."}
  catch(e){if(msg)msg.textContent=e&&e.code==="declined"?"":"Download failed. Try again."}
}
const fileSafe=s=>String(s).replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"");
const PRINT_CSS="body{font-family:Georgia,'Times New Roman',serif;margin:24px;color:#111}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:18px 0 6px}p{margin:0 0 8px;font-size:13px}table{border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px}th,td{border:1px solid #444;padding:5px;text-align:left;vertical-align:top}th{background:#eee}.muted{color:#555}.chip{font-weight:bold}@page{size:A4;margin:14mm}";

// ---------- mistakes notebook ----------
const ERR_KINDS={forgot:"Forgot",prompt:"Prompted",mix:"Mixed up",tajweed:"Tajweed",hesitate:"Hesitation",other:"Other"};
function errSurahs(st){useOrder(st);const set=new Set();
  pieces(0,Math.min(TOTAL,stEnd(st.pos,st.amount,7))).forEach(p=>set.add(p.s));
  for(const[a,b]of PREV_R)globalPieces(a,b,[]).forEach(p=>set.add(p.s));
  return SEQ_SURAHS.filter(s=>set.has(s))}
function errorBook(st){const map=new Map(),fixed=new Set(st.fixed||[]);
  const get=(s,a)=>{const k=s+":"+a;let r=map.get(k);if(!r){r={k,s,a,count:0,kinds:new Set(),last:"",words:new Map()};map.set(k,r)}return r};
  for(const m of marks)if(m.sid===st.id&&!m.fixed){const p=wordPlace(m.w),r=get(p.s,p.a);r.count++;r.kinds.add(m.k);if(m.date>r.last)r.last=m.date;const o=r.words.get(m.w)||{n:0,k:m.k};o.n++;o.k=m.k;r.words.set(m.w,o)}
  events.filter(e=>e.sid===st.id&&Array.isArray(e.errs)).forEach(e=>e.errs.forEach(x=>{const r=get(x.s,x.a);r.count++;r.kinds.add(x.k);if(e.date>r.last)r.last=e.date}));
  return [...map.values()].map(r=>({...r,fixed:fixed.has(r.k)})).sort((a,b)=>(b.count-a.count)||b.last.localeCompare(a.last))}
const errPlace=x=>`${SURAH_NAMES[x.s]} ${x.a}`;
function errsBlock(st){
  const ss=errSurahs(st);
  return `<fieldset class="grp" id="f_errs"><legend>Mistake places (mistakes notebook)</legend>
    <div class="errin"><select id="e_s" aria-label="Surah">${ss.map(s=>`<option value="${s}">${SURAH_NAMES[s]}</option>`).join("")}</select>
    <input type="number" id="e_a" min="1" placeholder="Ayah" aria-label="Ayah" inputmode="numeric">
    <select id="e_k" aria-label="Kind">${Object.entries(ERR_KINDS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
    <button type="button" id="e_add">Add</button></div>
    <div class="errlist" id="e_list"><span class="small muted">No places added.</span></div></fieldset>`}
function wireErrs(f,list){
  const box=f.querySelector("#e_list");
  const draw=()=>{box.innerHTML=list.length?list.map((x,i)=>`<span class="chip plain">${errPlace(x)} · ${ERR_KINDS[x.k]} <button type="button" class="x" data-i="${i}" aria-label="Remove">×</button></span>`).join(""):'<span class="small muted">No places added.</span>';
    box.querySelectorAll(".x").forEach(b=>b.onclick=()=>{list.splice(Number(b.dataset.i),1);draw()})};f._errDraw=draw;
  f.querySelector("#e_add").onclick=()=>{const s=Number(f.querySelector("#e_s").value),a=Number(f.querySelector("#e_a").value);
    if(!(a>=1&&a<=QD.verses[s])){f.querySelector("#e_a").focus();return}
    list.push({s,a,k:f.querySelector("#e_k").value});f.querySelector("#e_a").value="";busy=true;draw()};
  f.querySelector("#e_a").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();f.querySelector("#e_add").click()}});
  draw();
}
function bookAyah(r){const W=mw(),g=SURAH_FIRST[r.s]+r.a-1,a=MUS.a[g],b=(g+1<MUS.a.length?MUS.a[g+1]:W.length)-1;
  const ws=[...r.words.keys()];let from=a,to=b;if(b-a>16&&ws.length){from=Math.max(a,Math.min(...ws)-6);to=Math.min(b,Math.max(...ws)+6)}
  let h=from>a?"… ":"";for(let w=from;w<=to;w++){const o=r.words.get(w);h+=o?`<mark class="bw k-${o.k}" title="${esc(ERR_KINDS[o.k]||o.k)} · ${o.n}×">${W[w]}${o.n>1?`<sup>${toAr(o.n)}</sup>`:""}</mark> `:W[w]+" "}
  return h+(to<b?"…":`<span class="bae">۝${toAr(r.a)}</span>`)}
function errorBookPanel(st){
  const book=errorBook(st);if(!book.length)return "";
  const rep=book.filter(r=>r.count>=2&&!r.fixed).length,open=book.filter(r=>!r.fixed),done=book.filter(r=>r.fixed);
  const card=r=>`<div class="bk${r.fixed?" fx":""}"><div class="bkh"><b>${errPlace(r)}</b><span class="small muted">${r.count} ${r.count===1?"time":"times"} · ${[...r.kinds].map(k=>ERR_KINDS[k]||k).join(", ")} · last ${fmtShort(r.last)}</span></div>
    <div class="bkt" dir="rtl">${bookAyah(r)}</div>${r.words.size?"":`<p class="small muted">Recorded by ayah only, not by word. Tap the word in the mushaf next time to see it here.</p>`}
    <div class="bka">${r.fixed?'<span class="chip ok">Fixed</span>':r.count>=2?'<span class="chip warn">Needs a rule</span>':""}<button class="link small" data-bkmus="${r.s}:${r.a}">📖 Open in mushaf</button><button class="link small" data-fix="${r.k}">${r.fixed?"Undo":"Mark fixed"}</button></div></div>`;
  return `<div class="panel" id="bookP"><div class="head"><h3>Mistakes notebook</h3><span class="small muted">${open.length} places${rep?` · ${rep} need a rule`:""}</span></div>
    <p class="small muted">The exact words he got wrong are coloured: red forgot, yellow mixed up, blue tajweed, purple self-corrected. A small number means it happened more than once.</p>
    ${open.slice(0,40).map(card).join("")}
    ${done.length?`<details><summary class="small">${done.length} fixed places</summary>${done.slice(0,40).map(card).join("")}</details>`:""}
    <p class="note">A place that goes wrong twice gets a rule (dabt): alphabetical order, the only ayah, waw before fa, link to the surah name, or the addition comes in the later place. Mark it fixed once it holds.</p></div>`}
function wireFix(el,st){injectFont();el.querySelectorAll("[data-bkmus]").forEach(b=>b.onclick=()=>{const[x,y]=b.dataset.bkmus.split(":").map(Number);go({name:"mushaf",id:st.id,page:pageOfAyah(x,y)})});el.querySelectorAll("[data-fix]").forEach(b=>b.onclick=async()=>{const k=b.dataset.fix,f=new Set(st.fixed||[]);f.has(k)?f.delete(k):f.add(k);try{await db.doc("students/"+st.id).update({fixed:[...f]})}catch(_){}})}

// ---------- monthly random test ----------
function randomPlaces(st,n){useOrder(st);const total=PREV_LINES+st.pos,out=[],seen=new Set();
  for(let tries=0;out.length<n&&tries<200&&total>1;tries++){let x=Math.random()*total,g;
    if(x<PREV_LINES){let acc=0;for(const[a,b]of PREV_R){if(x<acc+b-a){g=a+x-acc;break}acc+=b-a}}else g=seqToGlobal(x-PREV_LINES);
    let i=ayahAt(g+0.06);const s=AY_SURAH[i],a=i-SURAH_FIRST[s]+1;const k=s+":"+a;if(seen.has(k))continue;seen.add(k);out.push({s,a})}
  return out}
const monthlyDue=(st,mine)=>(st.pos+PREV_LINES)>=LINES*20&&!mine.some(e=>e.type==="monthly"&&daysBetween(parse(e.date),today())<30);

// ---------- Ramadan and holidays ----------
const breakFor=(st,date)=>{const d=iso(date);return breaks.find(b=>(b.cls==="all"||b.cls===st.cls)&&d>=b.from&&d<=b.to)};
const BREAK_MODES={pause:"Review only, no new hifz",half:"Half the new amount"};
function breakDaysSince(st,since){let n=0;for(const b of breaks){if(b.cls!=="all"&&b.cls!==st.cls)continue;const a=b.from>since?b.from:since,z=b.to<iso(today())?b.to:iso(today());if(z>=a)n+=daysBetween(parse(a),parse(z))+1}return n}
function breaksPanel(){
  return `<div class="panel"><h3>Ramadan and holidays</h3>
    <div class="log">${breaks.length?breaks.slice().sort((a,b)=>b.from.localeCompare(a.from)).map(b=>`<div class="ev"><time>${fmtShort(b.from)} – ${fmtShort(b.to)}</time><div class="evb"><b>${esc(b.note||"Break")}</b> · ${b.cls==="all"?"All classes":`<bdi>${esc(clsName(b.cls))}</bdi>`} · ${BREAK_MODES[b.mode]||""}</div><button class="link small" data-delbr="${b.id}">Delete</button></div>`).join(""):'<p class="muted">No breaks set.</p>'}</div>
    <form id="brForm" class="fields">
      <label>Name<input id="b_note" placeholder="e.g. Ramadan" required></label>
      <label>Applies to<select id="b_cls"><option value="all">All classes</option>${classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
      <label>From<input type="date" id="b_from" required></label><label>To<input type="date" id="b_to" required></label>
      <label>During the break<select id="b_mode">${Object.entries(BREAK_MODES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>
      <div class="actions" style="align-self:end"><button class="primary" type="submit">Add break</button><span class="small muted" id="b_msg"></span></div>
    </form>
    <p class="note">During a break the near and far review carry on every day. The new portion stops or halves, then returns on its own when the break ends.</p></div>`}
function wireBreaks(el){
  const f=el.querySelector("#brForm");if(!f)return;trackForm(f);
  f.onsubmit=async e=>{e.preventDefault();const d={note:f.querySelector("#b_note").value.trim(),cls:f.querySelector("#b_cls").value,from:f.querySelector("#b_from").value,to:f.querySelector("#b_to").value,mode:f.querySelector("#b_mode").value};
    if(d.to<d.from){f.querySelector("#b_msg").textContent="The end date is before the start date.";return}
    try{await db.collection("breaks").add(d);busy=false;render(true)}catch(_){f.querySelector("#b_msg").textContent="Not added. Try again."}};
  el.querySelectorAll("[data-delbr]").forEach(b=>b.onclick=async()=>{if(b.dataset.confirm!=="1"){b.dataset.confirm="1";b.textContent="Confirm delete?";return}try{await db.doc("breaks/"+b.dataset.delbr).delete()}catch(_){}})}

// ---------- monthly report ----------
function reportBody(st,from,to){
  useOrder(st);
  const mine=events.filter(e=>e.sid===st.id&&e.date>=from&&e.date<=to).sort((a,b)=>a.date.localeCompare(b.date));
  const ses=mine.filter(e=>e.type==="session"),pres=ses.filter(attended),lates=ses.filter(e=>e.att==="late"),abs=ses.filter(e=>e.att==="absent"),exc=ses.filter(e=>e.att==="excused");
  const hl=ses.reduce((t,e)=>t+(e.hifzLines||0),0),hm=ses.reduce((t,e)=>t+(e.hifzMist||0),0),rm=ses.reduce((t,e)=>t+(e.revMist||0),0);
  const tests=mine.filter(e=>e.type==="test"),mon=mine.filter(e=>e.type==="monthly"),notes=mine.filter(e=>e.type==="note"||e.note);
  const errs=[...mine.flatMap(e=>e.errs||[]),...markRange(marksOf(st),from,to).map(m=>({...wordPlace(m.w),k:m.k}))];const la=lastAyahOf(st.pos);
  const df=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}),label=from===to?df.format(parse(from)):`${df.format(parse(from))} – ${df.format(parse(to))}`;
  return {label,html:`
    <p><b>${esc(st.name)}</b>${clsName(st.cls)?" · "+esc(clsName(st.cls)):""} · ${amountLabel(st.amount)} a day · ${orderName()}</p>
    <table><tr><th>Attended</th><th>Late</th><th>Absent</th><th>Excused</th><th>Points</th><th>Pages memorized</th><th>Hifz mistakes</th><th>Review mistakes</th><th>Juz done in total</th></tr>
    <tr><td>${pres.length}</td><td>${lates.length}${(()=>{const m=lates.map(e=>lateMin(st,e)).filter(x=>x!=null);return m.length?` (avg ${Math.round(m.reduce((a,b)=>a+b,0)/m.length)} min)`:""})()}</td><td>${abs.length}</td><td>${exc.length}</td><td>${mine.reduce((t,e)=>t+ptsOf(e),0)}</td><td>${pagesOf(hl)}</td><td>${hm}${hl?` (${Math.round(hm/Math.max(1,pagesOf(hl))*10)/10} per page)`:""}</td><td>${rm}</td><td>${juzDoneList(st.pos).length}</td></tr></table>
    <p>Last memorized: ${la?pieceText({...la,a1:la.a2}):"not started"}${PREV_R.length?` · memorized before: ${prevSummary()}`:""}</p>
    <h2>Sessions</h2>${ses.length?`<table><tr><th>Date</th><th>Attendance</th><th>Hifz</th><th>Review</th><th>Homework and behaviour</th><th>Points</th></tr>${ses.map(e=>`<tr><td>${fmtShort(e.date)}${e.by&&e.by!==teacherName()?`<br><small>by ${esc(e.by)}</small>`:""}</td><td>${(ATT[e.att]||ATT.present)[1]}${e.att==="late"&&e.arr?` (arrived ${esc(e.arr)}${lateMin(st,e)!=null?`, ${lateMin(st,e)} min late`:""})`:""}</td><td>${e.hifzNR?"<b>Not ready</b>":e.hifzLines>0?`${esc(hifzShown(e))} · ${e.hifzMist||0} mistakes${e.hifzGrade?" · "+esc(gradeEn(e.hifzGrade)):""}`:"—"}</td><td>${e.revNR?"<b>Not ready</b>":e.revType&&e.revType!=="none"?`${esc(REV[e.revType]||e.revType)}: ${esc(revShown(e))} · ${e.revMist||0} mistakes${e.revGrade?" · "+esc(gradeEn(e.revGrade)):""}`:"—"}${(e.revSkip||[]).length?`<br><small>Not recited: ${esc(skipText(e))}</small>`:""}</td><td>${[e.hw==null?"":e.hw?"Homework done":"Homework not done",...(e.beh||[]).map(b=>(BEH.find(x=>x[0]===b)||[0,b])[1])].filter(Boolean).join(", ")||"—"}</td><td>${ptsOf(e)}</td></tr>`).join("")}</table>`:'<p class="muted">No sessions in this period.</p>'}
    ${tests.length||mon.length?`<h2>Tests</h2><table><tr><th>Date</th><th>Test</th><th>Result</th></tr>${tests.map(e=>`<tr><td>${fmtShort(e.date)}</td><td>Juz ${esc(e.juz)}</td><td>${e.result==="pass"?"Passed":"Not passed"}${e.mistakes!=null?` · ${esc(e.mistakes)} mistakes`:""}</td></tr>`).join("")}${mon.map(e=>`<tr><td>${fmtShort(e.date)}</td><td>Monthly random test</td><td>${esc(e.score)}/${(e.places||[]).length}</td></tr>`).join("")}</table>`:""}
    ${(()=>{const c=new Map();ses.forEach(e=>(e.beh||[]).forEach(b=>c.set(b,(c.get(b)||0)+1)));return c.size?`<h2>Behaviour</h2><p>${[...c.entries()].map(([b,n])=>`${(BEH.find(x=>x[0]===b)||[0,b])[1]}: ${n}`).join(" · ")}</p>`:""})()}
    ${errs.length?`<h2>Mistake places</h2><p>${errs.map(x=>`${errPlace(x)} (${ERR_KINDS[x.k]||x.k})`).join(", ")}</p>`:""}
    ${notes.length?`<h2>Teacher's notes</h2>${notes.map(e=>`<p>${fmtShort(e.date)}: ${esc(e.text||e.note)}</p>`).join("")}`:""}`}}
function renderReport(el,sub,st){
  const t=iso(today()),from=view.from||t.slice(0,8)+"01",to=view.to||t,r=reportBody(st,from,to),ym=from+"_"+to;
  r.html+=heartImgHTML(st);
  sub.textContent="Report · "+st.name;
  const pre=(a,b,l)=>`<button type="button" class="fbtn ${a===from&&b===to?"on":""}" data-rf="${a}" data-rt="${b}">${l}</button>`;
  const d0=today(),wk=iso(addDays(d0,-6)),m0=t.slice(0,8)+"01",pm=new Date(d0.getFullYear(),d0.getMonth()-1,1),pmEnd=new Date(d0.getFullYear(),d0.getMonth(),0);
  el.innerHTML=`${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel"><h2>Report · ${r.label}</h2>
    <div class="fields"><label>From<input type="date" id="r_from" value="${from}"></label><label>To<input type="date" id="r_to" value="${to}"></label></div>
    <div class="filters">${pre(wk,t,"Last 7 days")}${pre(m0,t,"This month")}${pre(iso(pm),iso(pmEnd),"Last month")}${pre(iso(addDays(d0,-89)),t,"Last 3 months")}${pre(st.start||"2000-01-01",t,"Since the start")}</div>
    <div class="report">${r.html}</div>
    <div class="actions"><button class="primary" id="r_dl" ${downloads?"":"hidden"}>Download PDF</button><span class="small muted" id="r_msg"></span></div></div>`;
  wireBack(el);
  const setR=(a,b)=>{if(a&&b&&b<a)[a,b]=[b,a];view.from=a||from;view.to=b||to;render(true)};
  el.querySelector("#r_from").onchange=e=>setR(e.target.value,el.querySelector("#r_to").value);
  el.querySelector("#r_to").onchange=e=>setR(el.querySelector("#r_from").value,e.target.value);
  el.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>setR(b.dataset.rf,b.dataset.rt));
  el.querySelector("#r_dl").onclick=()=>saveFile(`report-${fileSafe(st.name)}-${ym}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Report - ${esc(st.name)} - ${r.label}</title><style>${PRINT_CSS}</style></head><body><h1>Report · ${r.label}</h1>${r.html}<p style="margin-top:24px">Teacher's signature: ....................&nbsp;&nbsp; Parent's signature: ....................</p></body></html>`,el.querySelector("#r_msg"));
}

// ---------- certificates ----------
function certificate(st,title,line,date){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Certificate - ${esc(st.name)}</title><style>@page{size:A4 landscape;margin:0}body{margin:0;font-family:Georgia,'Times New Roman',serif;color:#14302b}
  .c{box-sizing:border-box;width:100%;height:196mm;padding:8mm;display:flex}.b{flex:1;border:3px double #0d6b5e;outline:1px solid #b08a3e;outline-offset:-10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;padding:20mm}
  .k{letter-spacing:.3em;text-transform:uppercase;font-size:13px;color:#b08a3e}h1{font-size:40px;margin:0;font-weight:normal}.n{font-size:34px;margin:6px 0;border-bottom:1px solid #b08a3e;padding:0 24px 6px}.l{font-size:18px;max-width:180mm;line-height:1.5}.f{display:flex;gap:60mm;margin-top:18mm;font-size:13px}.f div{border-top:1px solid #14302b;padding-top:4px;min-width:50mm}</style></head>
  <body><div class="c"><div class="b"><div class="k">${schoolName()?esc(schoolName())+" · ":""}Certificate of achievement</div><h1>${esc(title)}</h1><p class="l">This certifies that</p><div class="n">${esc(st.name)}</div><p class="l">${line}</p><p class="l">${fmt(parse(date))} ${parse(date).getFullYear()}</p><div class="f"><div>Teacher</div><div>Date</div></div></div></div></body></html>`}
function wireCerts(el,st){
  el.querySelectorAll("[data-cert]").forEach(b=>b.onclick=()=>{const e=events.find(x=>x.id===b.dataset.cert);if(!e)return;
    saveFile(`certificate-${fileSafe(st.name)}-juz-${e.juz}.html`,juzCertificate(st,e),(b.closest(".panel")||b.parentElement).querySelector(".cmsg")||null)});
  const k=el.querySelector("#khatmCert");if(k)k.onclick=()=>saveFile(`certificate-${fileSafe(st.name)}-khatm.html`,certificate(st,"Completion of the Quran","has completed the memorization of the whole Noble Quran.",iso(today())),el.querySelector("#k_msg"));
}

// ---------- backup ----------
function xlsSheet(name,rows){const cell=v=>`<Cell><Data ss:Type="${typeof v==="number"?"Number":"String"}">${esc(v??"")}</Data></Cell>`;
  return `<Worksheet ss:Name="${esc(name)}"><Table>${rows.map((r,i)=>`<Row${i===0?' ss:StyleID="h"':""}>${r.map(cell).join("")}</Row>`).join("")}</Table></Worksheet>`}
function backupXls(){
  const sn=id=>{const s=allStudents.find(s=>s.id===id);return s?s.name:id};
  const st=allStudents.map(s=>{useOrder(s);const la=lastAyahOf(s.pos);return [s.name,clsName(s.cls),orderName(),amountLabel(s.amount),[6,0,1,2,3,4,5].filter(d=>(s.days||[]).includes(d)).map(d=>DAY_NAMES[d]).join(" "),s.start||"",la?pieceText({...la,a1:la.a2}):"",juzDoneList(s.pos).join(" "),prevSummary()]});
  const ev=events.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(e=>[e.date,sn(e.sid),e.type,e.att?(ATT[e.att]||[0,e.att])[1]:"",e.arr||"",e.hw==null?"":e.hw?"done":"not done",(e.beh||[]).map(b=>(BEH.find(x=>x[0]===b)||[0,b])[1]).join(", "),ptsOf(e),e.hifzText||"",e.hifzMist??"",gradeEn(e.hifzGrade),e.revType?(REV[e.revType]||e.revType):"",e.revText||"",e.revMist??"",e.juz??"",e.result||"",e.type==="monthly"?`${e.score}/${(e.places||[]).length}`:"",(e.errs||[]).map(errPlace).join(", "),e.text||e.note||""]);
  const mt=meetings.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(m=>[m.date,clsName(m.cls),m.status,m.reason||"",(m.acts||[]).map(a=>{const d=ACTIVITIES.find(x=>x[0]===a.k);return (d?d[1]:a.k)+(a.d?": "+a.d:"")}).join("; "),m.note||""]);
  const cl=classes.map(c=>[c.name,scheduleText(c),students.filter(s=>s.cls===c.id).length]);
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>
  ${xlsSheet("Students",[["Name","Class","Starts from","Daily amount Hifz","Hifz days","Start date","Last memorized","Juz done","Memorized before"],...st])}
  ${xlsSheet("Sessions",[["Date","Student","Type","Attendance","Arrived","Homework","Behaviour","Points","Hifz","Hifz mistakes","Hifz grade","Review","Review portion","Review mistakes","Juz","Result","Monthly score","Mistake places","Note"],...ev])}
  ${xlsSheet("Mushaf marks",[["Date","Student","Place","Word","Kind","Note","Fixed"],...marks.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(m=>[m.date,sn(m.sid),markPlace(m),mw()[m.w]||"",ERR_KINDS[m.k]||m.k,m.note||"",m.fixed?"yes":""])])}
  ${xlsSheet("Class logs",[["Date","Class","Status","Reason","Activities","Note"],...mt])}
  ${xlsSheet("Classes",[["Class","Schedule","Students"],...cl])}</Workbook>`}

// ---------- tajweed curriculum ----------
const TAJWEED=["Etiquette of recitation, isti'adhah and basmalah","Articulation points (makharij)","Letter qualities (sifat)","Noon sakinah and tanween: izhar","Noon sakinah and tanween: idgham","Noon sakinah and tanween: iqlab","Noon sakinah and tanween: ikhfa","Meem sakinah","Ghunnah: noon and meem with shaddah","Qalqalah","Lam of al- (shamsiyyah and qamariyyah)","Lam in the name of Allah","Heavy and light letters (tafkhim and tarqiq)","Rules of ra","Natural madd","Connected and separated madd","Necessary and temporary madd","Idgham of similar and close letters","Hamzat al-wasl","Stopping and starting (waqf and ibtida')","Pauses (sakt)"];
function tajweedPanel(c,date){const done=c.tajweed||{};const n=Object.keys(done).length;
  return `<div class="panel"><div class="head"><h3>Tajweed curriculum</h3><span class="small muted">${n} of ${TAJWEED.length} covered</span></div>
    <div class="bar"><i style="width:${Math.round(n/TAJWEED.length*100)}%"></i></div>
    <div class="tj">${TAJWEED.map((t,i)=>`<label class="chk"><input type="checkbox" data-tj="${i}" ${done[i]?"checked":""}> <span>${t}${done[i]?` <span class="small muted">· ${fmtShort(done[i])}</span>`:""}</span></label>`).join("")}</div>
    <p class="note">Tick a topic when you teach it. Picking a topic in "Tajweed lesson" above ticks it for that class date.</p></div>`}
function wireTajweed(el,c,date){el.querySelectorAll("[data-tj]").forEach(cb=>cb.onchange=async()=>{const t={...(c.tajweed||{})};if(cb.checked)t[cb.dataset.tj]=date;else delete t[cb.dataset.tj];const {id,...rest}=c;try{await db.doc("classes/"+c.id).set({...rest,tajweed:t})}catch(_){}})}

// ---------- points and encouragement ----------
function badgesOf(st){const out=[],ses=events.filter(e=>e.sid===st.id&&e.type==="session").sort((a,b)=>a.date.localeCompare(b.date));
  const t=today(),wk=ses.filter(e=>daysBetween(parse(e.date),t)<7);
  if(wk.length>=2&&wk.every(e=>e.att==="present"))out.push(["On time all week","Came on time to every class in the last 7 days"]);
  let run=0,best=0;for(const e of ses.filter(e=>e.hifzLines>0)){run=(e.hifzMist||0)===0?run+1:0;best=Math.max(best,run)}if(best>=3)out.push([`${best} clean hifz in a row`,"New hifz with no mistakes, several sessions in a row"]);
  let hw=0;for(const e of ses.slice().reverse()){if(e.hw===true)hw++;else if(e.hw===false)break}if(hw>=3)out.push([`Homework ${hw} times in a row`,"Did the homework every time lately"]);
  const att30=ses.filter(e=>daysBetween(parse(e.date),t)<30);if(att30.length>=6&&att30.every(attended))out.push(["No absences this month","Attended every class in the last 30 days"]);
  const good=ses.filter(e=>daysBetween(parse(e.date),t)<30).reduce((n,e)=>n+(e.beh||[]).filter(b=>(BEH.find(x=>x[0]===b)||[])[2]==="good").length,0);if(good>=5)out.push(["Great manners","Many good-behaviour marks this month"]);
  for(const e of events)if(e.sid===st.id&&e.type==="test"&&e.result==="pass")out.push([`Juz ${e.juz} complete`,"Passed the juz test"]);
  return out}
const LEVEL=100;
function pointsPanel(st){const tot=ptsSum(st.id),t=iso(today()),m0=t.slice(0,8)+"01",wk=iso(addDays(today(),-6));
  const lvl=Math.floor(Math.max(0,tot)/LEVEL)+1,into=Math.max(0,tot)%LEVEL,b=badgesOf(st);
  return `<div class="panel"><div class="head"><h3>Points and badges</h3><span class="chip pts big">★ ${tot}</span></div>
    <p class="small muted">Level ${lvl} · ${LEVEL-into} points to level ${lvl+1} · this week ${ptsSum(st.id,wk,t)} · this month ${ptsSum(st.id,m0,t)}</p>
    <div class="bar"><i style="width:${into/LEVEL*100}%"></i></div>
    ${b.length?`<div class="chips badges">${b.map(x=>`<span class="chip badge" title="${esc(x[1])}">🏅 ${esc(x[0])}</span>`).join("")}</div>`:'<p class="small muted">No badges yet. They come from coming on time, clean hifz, homework and good behaviour.</p>'}
    <form class="givepts" id="gpForm"><input id="gp_r" placeholder="Reason, e.g. helped a classmate" aria-label="Reason">
      <div class="actions">${[1,2,5,10,-1,-2].map(n=>`<button type="button" class="small ${n>0?"":"neg"}" data-gp="${n}">${n>0?"+":""}${n}</button>`).join("")}<span class="small muted" id="gp_msg"></span></div></form></div>`}
function wirePoints(el,st){const f=el.querySelector("#gpForm");if(!f)return;const r=f.querySelector("#gp_r");r.addEventListener("focus",()=>busy=true);r.addEventListener("blur",()=>busy=false);
  f.querySelectorAll("[data-gp]").forEach(b=>b.onclick=async()=>{const pts=Number(b.dataset.gp);try{await db.collection("events").add({sid:st.id,type:"points",date:iso(today()),t:Date.now(),pts,reason:r.value.trim()});busy=false;render(true)}catch(_){f.querySelector("#gp_msg").textContent="Not saved. Try again."}})}
function boardPanel(c){const kids=students.filter(s=>s.cls===c.id);if(!kids.length)return "";
  const per=view.bp||"week",t=iso(today()),d0=today();
  const range={week:[iso(addDays(d0,-6)),t],month:[t.slice(0,8)+"01",t],last:[iso(new Date(d0.getFullYear(),d0.getMonth()-1,1)),iso(new Date(d0.getFullYear(),d0.getMonth(),0))],all:[null,null]}[per];
  const rows=kids.map(s=>({s,n:ptsSum(s.id,range[0],range[1])})).sort((a,b)=>b.n-a.n||a.s.name.localeCompare(b.s.name));
  const medal=i=>["🥇","🥈","🥉"][i]||`${i+1}.`;
  return `<div class="panel"><div class="head"><h3>Points board</h3></div>
    <div class="filters">${[["week","This week"],["month","This month"],["last","Last month"],["all","All time"]].map(([k,l])=>`<button class="fbtn ${k===per?"on":""}" data-bp="${k}">${l}</button>`).join("")}</div>
    <div class="board">${rows.map((r,i)=>`<div class="brow"><span class="bm">${medal(i)}</span><bdi>${esc(r.s.name)}</bdi><span class="chip pts">★ ${r.n}</span></div>`).join("")}</div>
    ${rows[0]&&rows[0].n>0&&downloads?`<div class="actions"><button id="somBtn">Certificate for ${esc(rows[0].s.name)} (top of the board)</button><span class="small muted" id="som_msg"></span></div>`:""}</div>`}
function wireBoard(el,c){el.querySelectorAll("[data-bp]").forEach(b=>b.onclick=()=>{view.bp=b.dataset.bp;busy=false;render(true)});
  const b=el.querySelector("#somBtn");if(!b)return;b.onclick=()=>{const kids=students.filter(s=>s.cls===c.id);const per=view.bp||"week",t=iso(today()),d0=today();
    const range={week:[iso(addDays(d0,-6)),t],month:[t.slice(0,8)+"01",t],last:[iso(new Date(d0.getFullYear(),d0.getMonth()-1,1)),iso(new Date(d0.getFullYear(),d0.getMonth(),0))],all:[null,null]}[per];
    const top=kids.map(s=>({s,n:ptsSum(s.id,range[0],range[1])})).sort((a,b)=>b.n-a.n)[0];
    const what={week:"student of the week",month:"student of the month",last:"student of the month",all:"top student"}[per];
    saveFile(`certificate-${fileSafe(top.s.name)}-${what.replace(/ /g,"-")}.html`,certificate(top.s,what.replace(/^./,x=>x.toUpperCase()),`is the ${what} in ${esc(c.name)} with ${top.n} points, for hard work, good manners and coming on time.`,iso(today())),el.querySelector("#som_msg"))}}
function pointsSettings(){const p=PTS();
  return `<form class="panel" id="ptsForm"><h3>Points rules</h3><p class="small muted">Each session adds up these points. Bad behaviour, missed homework and absence always take points away. Change any number and save.</p>
    ${PTS_GROUPS.map(([g,items])=>`<h4 class="ptsg">${g}</h4><div class="ptsgrid">${items.map(([k,l])=>`<label class="inl">${l}<input type="number" data-pk="${k}" value="${p[k]}" inputmode="numeric" ${p[k]<0?'class="negv"':""}></label>`).join("")}</div>`).join("")}
    <div class="actions"><button class="primary" type="submit">Save points rules</button><button type="button" id="ptsReset">Back to defaults</button><span class="small muted" id="pts_msg"></span></div></form>`}
function wirePtsSettings(el){const f=el.querySelector("#ptsForm");if(!f)return;trackForm(f);
  const save=async pts=>{try{await db.doc("settings/main").set({...(settings.main||{}),points:pts});busy=false;render(true)}catch(_){f.querySelector("#pts_msg").textContent="Not saved. Try again."}};
  f.onsubmit=e=>{e.preventDefault();const pts={};f.querySelectorAll("[data-pk]").forEach(i=>pts[i.dataset.pk]=Number(i.value)||0);save(pts)};
  f.querySelector("#ptsReset").onclick=()=>save({...PTS_DEF})}

// ---------- week sheet ----------
// Plan sheet document: one student or a whole class (each student on its own page)
const PS_STYLE=`<style>body{font-family:Tahoma,Arial,sans-serif;margin:16px;color:#000}h1{font-size:18px;margin:0 0 4px}h3.wkh{font-size:13px;margin:14px 0 4px;break-after:avoid;page-break-after:avoid}table.week{break-inside:avoid;page-break-inside:avoid}p{margin:0 0 10px;font-size:12px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #333;padding:4px;vertical-align:middle;text-align:left}thead th{background:#eee}td.ck,th.ck{width:26px;text-align:center}.box{display:inline-block;width:16px;height:16px;border:1.5px solid #000;border-radius:3px}td.sig{width:70px}.small{font-size:10px;color:#444}.foot{margin-top:16px;font-size:13px}.pg+.pg{break-before:page;page-break-before:always}@page{size:A4 landscape;margin:10mm}</style>`;
function planSheetBody(st,start,n){useOrder(st);const end=addDays(start,n-1),prep=dayPlan(st,start,st.pos).prep;
  return `<div class="pg"><h1>Plan sheet: ${esc(st.name)}${clsName(st.cls)?" · "+esc(clsName(st.cls)):""}</h1><p>${amountLabel(st.amount)} a day · ${n} ${n===1?"day":"days"}: ${fmt(start)} – ${fmt(end)}${n>7?"":` · preparation this week: ${prep}`}</p>${weekTable(st,start,'<span class="box"></span>',n)}<p class="foot">Teacher's notes: ................................................................ &nbsp; Teacher's signature: ....................</p></div>`}
function planSheetDoc(list,start,n,title){return keepOrder(()=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>${PS_STYLE}</head><body>${list.map(st=>planSheetBody(st,start,n)).join("")}</body></html>`)}

const TASKS=[["neu","New hifz"],["rep","30 repetitions"],["yest","Yesterday's portion"],["near","Near review"],["far","Far review"],["read","Reading"],["prep","Preparation"]];
function weekTable(st,start,box,n){
  const all=weekPlan(st,start,n||7),blocks=[];for(let i=0;i<all.length;i+=7)blocks.push(all.slice(i,i+7));
  return blocks.map((b,bi)=>`<div class="wkb">${blocks.length>1?`<h3 class="wkh">Week ${bi+1} · ${fmt(b[0].date)} – ${fmt(b[b.length-1].date)} · preparation: ${dayPlan(st,b[0].date,b[0].pos).prep}</h3>`:""}${weekBlock(b,box)}</div>`).join("")}
function weekBlock(days,box){
  const rows=days.map(d=>{
    const cell=(k)=>{let v;
      if(k==="neu")v=d.isHifz?d.neu:"—";
      else if(k==="rep")v=d.isHifz?"20 + 5 + 5":"—";
      else if(k==="prep")v="Listen and read";
      else v=d[k];
      const off=(k==="neu"||k==="rep")&&!d.isHifz;
      return `<td class="tv">${v}</td><td class="ck">${off?"":box}</td>`};
    return `<tr><th class="day">${fmt(d.date)}${d.isHifz?"":'<br><span class="small">no new hifz</span>'}</th>${TASKS.map(t=>cell(t[0])).join("")}<td class="sig"></td></tr>`}).join("");
  return `<table class="week"><thead><tr><th>Day</th>${TASKS.map(t=>`<th>${t[1]}</th><th class="ck">✓</th>`).join("")}<th>Parent's signature</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function renderWeek(el,sub,st){
  const start=view.start?parse(view.start):today();
  const n=Math.max(1,Math.min(120,Number(view.days)||7));
  sub.textContent="Plan sheet · "+st.name;
  const prep=dayPlan(st,start,st.pos).prep,end=addDays(start,n-1);
  const pre=(v,l)=>`<button type="button" class="fbtn ${n===v?"on":""}" data-wd="${v}">${l}</button>`;
  el.innerHTML=`
  ${backBtn(esc(st.name),{name:"student",id:st.id})}
  <div class="panel">
    <div class="fields"><label>Starts on<input type="date" id="w_start" value="${iso(start)}"></label><label>Number of days<input type="number" id="w_days" min="1" max="120" value="${n}" inputmode="numeric"></label></div>
    <div class="filters">${pre(7,"1 week")}${pre(14,"2 weeks")}${pre(30,"1 month")}${pre(60,"2 months")}</div>
    <p class="small muted">${n} ${n===1?"day":"days"}: ${fmt(start)} – ${fmt(end)}</p>
    <div class="tbl">${weekTable(st,start,'<span class="box"></span>',n)}</div>
    <p class="note">${n>7?"":`Preparation this week: ${prep}. `} 30 repetitions: 20 right away, then 5 after one prayer and 5 after another. The student ticks the empty box next to each task they finish.</p>
    <div class="actions"><button class="primary" id="dl" ${downloads?"":"hidden"}>Download PDF</button>${clsName(st.cls)?`<button id="dlCls" ${downloads?"":"hidden"}>Download for the whole class (${students.filter(x=>x.cls===st.cls&&!x.archived).length})</button>`:""}<span class="small muted" id="w_msg"></span></div>
  </div>`;
  wireBack(el);
  el.querySelector("#w_start").onchange=e=>{view.start=e.target.value;render(true)};
  el.querySelector("#w_days").onchange=e=>{view.days=Math.max(1,Math.min(120,Number(e.target.value)||7));render(true)};
  el.querySelectorAll("[data-wd]").forEach(b=>b.onclick=()=>{view.days=Number(b.dataset.wd);render(true)});
  el.querySelector("#dl").onclick=async()=>{
    const msg=el.querySelector("#w_msg");
    const html=planSheetDoc([st],start,n,"Plan sheet - "+st.name);
    await saveFile(`plan-sheet-${fileSafe(st.name)}-${iso(start)}-${n}d.html`,html,msg);
  };
  const dc=el.querySelector("#dlCls");if(dc)dc.onclick=async()=>{const msg=el.querySelector("#w_msg");const list=students.filter(x=>x.cls===st.cls&&!x.archived).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    if(!list.length)return;dc.disabled=true;msg.textContent=`Preparing ${list.length} plan sheets…`;
    try{const html=planSheetDoc(list,start,n,"Plan sheets - "+clsName(st.cls));await saveFile(`plan-sheets-${fileSafe(clsName(st.cls))}-${iso(start)}-${n}d.html`,html,msg)}finally{dc.disabled=false}};
}
init();
