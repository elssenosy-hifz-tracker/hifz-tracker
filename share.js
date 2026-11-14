// ---------- the student's page at home: a private read-only link for one student ----------
// Off until an admin turns it on (Settings). A teacher who can record for the student makes the link; it shows only a
// snapshot made for the family: today's tasks, points, streak, the similar verses to watch and places to practise.
// No phone numbers, notes or other students. The snapshot is the document share/<token> (anyone with the link may read
// that one document); sharekeys/<student id> keeps the token so the school can update or stop the link.
let SHAREKEYS={};const SH_DONE=new Set();
const shareOn=()=>!!((typeof settings!=="undefined"&&settings.main)||{}).shareOn;
const shareUrl=tok=>`${location.origin}${location.pathname}#s/${tok}`;
function shareTok(){const a=new Uint8Array(18);crypto.getRandomValues(a);return [...a].map(b=>"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b%62]).join("")+"x"+Date.now().toString(36)}
function shareLang(st){let l="";try{l=localStorage.getItem("hifz.plang."+st.id)||""}catch(_){}return l||(typeof AR!=="undefined"&&AR?"ar":"en")}
// the family's snapshot, ready to show, in their language
function shareSnap(st,lang){const ar=lang==="ar",T=(en,a)=>ar?a:en,txt=x=>{const s=String(x||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();return ar?arRange(s):s};
  useOrder(st);const p=dayPlan(st,today(),st.pos),sk=streakOf(st),cj=currentJuz(st.pos),school=((settings.main||{}).school||{}).name||"";
  const tasks=[[T("New hifz","الحفظ الجديد"),p.isHifz?txt(p.neu):T("Not a hifz day","ليس يوم حفظ")],[T("Yesterday's portion, by heart","حفظ الأمس غيبًا"),txt(p.yest)],[T("Near review","المراجعة القريبة"),txt(p.near)],[T("Far review","المراجعة البعيدة"),txt(p.far)]].filter(x=>x[1]);
  const stats=[[T("Points","النقاط"),String(ptsSum(st.id))],[T("Ready in a row","جاهز متتاليًا"),String(sk.cur||0)],[T("Memorized","المحفوظ"),`${pagesOf(st.pos+PREV_LINES)} ${T("p","ص")}`],[T("Now in juz","الجزء الحالي"),cj?String(cj):T("Whole Quran","القرآن كاملًا")]];
  let watch=[];try{const h=p.isHifz&&p.end!=null?pieces(st.pos,p.end):[];watch=similarIn(st,[...h,...(p.nearP||[])]).slice(0,6).map(x=>{const l=g=>{const s=AY_SURAH[g[0]],a=g[0]-SURAH_FIRST[s]+1;return ar?`${SURAH_AR[s]} ${a}`:`${SURAH_NAMES[s]} ${a}`};return T(`${l(x.o)} looks like ${l(x.m)}`,`${l(x.o)} تشبه ${l(x.m)}`)})}catch(_){}
  let note="";try{const rep=errorBook(st).filter(r=>r.count>=2&&!r.fixed).slice(0,4);if(rep.length)note=txt(rep.map(errPlace).join(ar?"، ":", "))}catch(_){}
  return {sid:st.id,title:String(st.name).slice(0,100),school:String(school).slice(0,100),lang:ar?"ar":"en",updated:iso(today()),tasks,stats,watch,note:note.slice(0,300)}}
async function shareWrite(st,tok){await db.doc("share/"+tok).set(shareSnap(st,shareLang(st)))}
// the box under the Reports tab of the student page
function shareBoxHTML(st){if(!shareOn()||(typeof canEditSid==="function"&&!canEditSid(st.id)))return "";const k=SHAREKEYS[st.id],ar=typeof AR!=="undefined"&&AR,T=(en,a)=>ar?a:en;
  if(k&&!SH_DONE.has(st.id)){SH_DONE.add(st.id);setTimeout(()=>shareWrite(st,k.tok).catch(()=>{}),300)} // keep the family's page up to date
  const ph=typeof seesPersonal==="function"&&seesPersonal(st.id)?phoneDigits(st.phone):"";
  return `<div class="shbox" data-noar><b>${T("Student page at home","صفحة الطالب في البيت")}</b><p class="small muted">${T("A private link for the student and family: today's tasks, points and the similar verses to watch. Read only, no phone numbers or notes.","رابط خاص للطالب وأهله: مهام اليوم والنقاط والمتشابهات. للقراءة فقط، بلا أرقام هواتف ولا ملاحظات.")}</p>
    ${k?`<input readonly class="shurl" value="${esc(shareUrl(k.tok))}"><div class="actions"><button type="button" class="sm" data-shcp="${st.id}">${T("Copy link","انسخ الرابط")}</button>${ph?`<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${ph}?text=${encodeURIComponent(T(`${st.name}'s page for home: `,`صفحة ${st.name} في البيت: `)+shareUrl(k.tok))}">${T("Send in WhatsApp","أرسل في واتساب")}</a>`:""}<button type="button" class="sm" data-shup="${st.id}">${T("Update now","حدّث الآن")}</button><button type="button" class="sm neg" data-shstop="${st.id}">${T("Stop the link","أوقف الرابط")}</button><span class="small muted" data-shmsg></span></div>`
      :`<div class="actions"><button type="button" class="sm primary" data-shmk="${st.id}">${T("Make a link for home","أنشئ رابطًا للبيت")}</button><span class="small muted" data-shmsg></span></div>`}</div>`}
document.addEventListener("click",async e=>{if(e.target.classList&&e.target.classList.contains("shurl")){e.target.select();return}const b=e.target.closest&&e.target.closest("[data-shmk],[data-shcp],[data-shup],[data-shstop]");if(!b)return;
  const sid=b.dataset.shmk||b.dataset.shcp||b.dataset.shup||b.dataset.shstop,st=allStudents.find(s=>s.id===sid);if(!st)return;const m=b.parentElement.querySelector("[data-shmsg]"),ar=typeof AR!=="undefined"&&AR,T=(en,a)=>ar?a:en,say=t=>{if(m)m.textContent=t};
  try{if(b.dataset.shmk){const tok=shareTok();say(T("Saving…","جارٍ الحفظ…"));await shareWrite(st,tok);await db.doc("sharekeys/"+sid).set({tok,by:typeof myByName==="function"?myByName():"",at:Date.now()});SHAREKEYS[sid]={id:sid,tok};SH_DONE.add(sid);busy=false;render(true)}
    else if(b.dataset.shcp){const k=SHAREKEYS[sid];await navigator.clipboard.writeText(shareUrl(k.tok));say(T("Copied.","نُسخ."))}
    else if(b.dataset.shup){say(T("Saving…","جارٍ الحفظ…"));await shareWrite(st,SHAREKEYS[sid].tok);say(T("Updated.","حُدّث."))}
    else if(b.dataset.shstop){if(b.dataset.c!=="1"){b.dataset.c="1";b.textContent=T("Tap again to stop it","اضغط مرة أخرى للإيقاف");return}const k=SHAREKEYS[sid];await db.doc("share/"+k.tok).delete();await db.doc("sharekeys/"+sid).delete();delete SHAREKEYS[sid];busy=false;render(true)}}
  catch(_){say(T("Not saved. Try again.","لم يُحفظ. حاول مرة أخرى."))}});
// Settings: an admin turns the student links on or off for the school
function shareSettingHTML(){if(typeof isAdminV!=="function"||!isAdminV())return "";const on=shareOn(),ar=typeof AR!=="undefined"&&AR,T=(en,a)=>ar?a:en;
  return `<div class="panel" data-noar><h3>${T("Student page at home","صفحة الطالب في البيت")}</h3><p class="small muted">${T("When on, teachers can make a private read-only link for a student's family. Each link can be stopped at any time.","عند التفعيل يستطيع المعلّم إنشاء رابط خاص للقراءة فقط لأسرة الطالب، ويمكن إيقاف أي رابط في أي وقت.")}</p>
    <div class="actions"><button type="button" class="${on?"":"primary"}" data-shon="${on?"0":"1"}">${on?T("Turn off","أوقف"):T("Turn on","فعّل")}</button><span class="small">${on?T("On","مفعّل"):T("Off","موقوف")}</span></div></div>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-shon]");if(!b)return;try{await db.doc("settings/main").set({...(settings.main||{}),shareOn:b.dataset.shon==="1"});busy=false;render(true)}catch(_){}});
// what the family sees: started by the sign-in gate when the address ends in #s/<token>, with no sign-in
function renderSharePage(d){const g=document.getElementById("hifzGate");if(g)g.remove();document.body.classList.remove("sub","hasnav");const nav=document.getElementById("nav");if(nav)nav.remove();
  const ar=d?d.lang==="ar":/^ar/.test(navigator.language||""),T=(en,a)=>ar?a:en,app=document.getElementById("app")||document.body;
  document.documentElement.setAttribute("lang",ar?"ar":"en");document.documentElement.setAttribute("dir",ar?"rtl":"ltr");app.setAttribute("dir",ar?"rtl":"ltr");document.title=d?d.title:"Hifz Tracker";
  if(!d){app.innerHTML=`<div class="panel"><h2>${T("This link does not work","هذا الرابط لا يعمل")}</h2><p>${T("It may have been stopped. Ask the teacher for a new one.","ربما أوقفه المعلّم. اطلب من المعلّم رابطًا جديدًا.")}</p></div>`;return}
  const L=(a)=>(Array.isArray(a)?a:[]).filter(x=>Array.isArray(x)&&x.length>=2);
  app.innerHTML=`<div class="panel shp"><span class="small muted">${esc(d.school||"")}</span><h1 style="margin:2px 0">${esc(d.title||"")}</h1><span class="small muted">${T("Updated","آخر تحديث")} ${esc(d.updated||"")}</span></div>
    <div class="panel"><h3>${T("Today","اليوم")}</h3>${L(d.tasks).map(([k,v])=>`<div class="shrow"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>
    <div class="panel"><div class="kpis">${L(d.stats).map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div></div>
    ${(d.watch||[]).length?`<div class="panel"><h3>≈ ${T("Similar verses to watch","متشابهات انتبه لها")}</h3>${d.watch.map(w=>`<div class="shrow">${esc(w)}</div>`).join("")}</div>`:""}
    ${d.note?`<div class="panel"><h3>${T("Places to practise at home","مواضع يتدرّب عليها في البيت")}</h3><p>${esc(d.note)}</p></div>`:""}
    <p class="small muted" style="text-align:center">${T("Read only. Made by the school with Hifz Tracker.","للقراءة فقط. من المدرسة عبر برنامج متابعة الحفظ.")}</p>`}
(()=>{const st=document.createElement("style");st.textContent=`.shbox{border-top:1px solid var(--line);margin-top:10px;padding-top:10px;display:flex;flex-direction:column;gap:6px}.shbox input{font-size:13px}
.shrow{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.shrow b{text-align:end}.shp h1{font-size:28px}`;document.head.appendChild(st)})();
