// ---------- first-visit tour: a few short steps pointing at the main places; "Help" in the header shows it again ----------
// Each step: [find the element, English title, English text, Arabic title, Arabic text]. Steps whose element is not on screen are skipped.
const TOUR=[
  [()=>document.querySelector('#nav [data-nav="today"]'),"Today","Your classes for today. Start the class and record each student here.","اليوم","فصول النهارده. من هنا تبدأ الفصل وتسجّل كل طالب."],
  [()=>document.querySelector('#view .qnext[data-trec]')||document.querySelector('#view .tlist'),"Record a student","Tap “Record next” (or “Record” beside a name) to record a session in a few taps.","سجّل طالب","اضغط «سجّل التالي» أو «سجّل» جنب اسم الطالب، وتسجّل الجلسة في دوسات قليلة."],
  [()=>document.querySelector('#nav [data-nav="list"]'),"Students","All your students. Open a student to see their plan, mushaf and reports.","الطلاب","كل طلابك. افتح الطالب علشان تشوف خطته ومصحفه وتقاريره."],
  [()=>document.querySelector('#nav [data-nav="tajweed"]'),"Tajweed","Tajweed rules with examples, practice questions and the coloured mushaf.","التجويد","أحكام التجويد بالأمثلة، وأسئلة التدريب، والمصحف الملون."],
  [()=>document.getElementById("helpTop"),"Help","Tap Help any time to see this tour again.","مساعدة","اضغط «مساعدة» في أي وقت علشان تشوف الجولة دي تاني."]];
const TOUR_CSS=`#tour{position:fixed;inset:0;z-index:90;pointer-events:none}
#tour .tspot{position:fixed;border-radius:12px;box-shadow:0 0 0 9999px rgba(10,20,18,.55),0 0 0 3px #ffd34d;transition:all .2s}
#tour .tcard{position:fixed;left:12px;right:12px;max-width:420px;margin:0 auto;background:var(--surface);color:inherit;border-radius:16px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3);pointer-events:auto;display:flex;flex-direction:column;gap:6px}
#tour .tn{font-size:12px;color:var(--muted)}#tour .tt{font-size:18px}#tour .tb{margin:0;line-height:1.6}#tour .tbtn{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
@media (prefers-reduced-motion:reduce){#tour .tspot{transition:none}}`;
let tourI=-1,tourCss=false;
const tourSeen=()=>{try{return localStorage.getItem("hifz.tour")==="1"}catch(e){return true}};
function tourStart(){tourI=0;if(view.name!=="today")go({name:"today"});setTimeout(tourShow,200)}
function tourEnd(){tourI=-1;try{localStorage.setItem("hifz.tour","1")}catch(e){}const o=document.getElementById("tour");if(o)o.remove()}
function tourShow(){if(tourI<0)return;let st=TOUR[tourI],el=st&&st[0]();while(st&&!el){tourI++;st=TOUR[tourI];el=st&&st[0]()}if(!st)return tourEnd();
  if(!tourCss){tourCss=true;const s=document.createElement("style");s.textContent=TOUR_CSS;document.head.append(s)}
  let o=document.getElementById("tour");
  if(!o){o=document.createElement("div");o.id="tour";o.setAttribute("data-noar","");o.innerHTML='<div class="tspot"></div><div class="tcard" role="dialog" aria-live="polite"><div class="tn"></div><b class="tt"></b><p class="tb"></p><div class="tbtn"><button type="button" class="link" id="tSkip"></button><button type="button" class="primary" id="tNext"></button></div></div>';document.body.append(o);
    o.querySelector("#tSkip").onclick=tourEnd;o.querySelector("#tNext").onclick=()=>{tourI++;tourShow()}}
  if(!el.closest("#nav"))el.scrollIntoView({block:"center"});
  const r=el.getBoundingClientRect(),sp=o.querySelector(".tspot"),c=o.querySelector(".tcard");
  Object.assign(sp.style,{left:r.left-6+"px",top:r.top-6+"px",width:r.width+12+"px",height:r.height+12+"px"});
  c.querySelector(".tn").textContent=AR?`${tourI+1} من ${TOUR.length}`:`${tourI+1} of ${TOUR.length}`;
  c.querySelector(".tt").textContent=AR?st[3]:st[1];c.querySelector(".tb").textContent=AR?st[4]:st[2];c.dir=AR?"rtl":"ltr";
  o.querySelector("#tSkip").textContent=AR?"تخطي":"Skip";o.querySelector("#tNext").textContent=tourI===TOUR.length-1?(AR?"يلا نبدأ":"Done"):(AR?"التالي":"Next");
  const ch=c.offsetHeight,below=r.bottom+14;c.style.top=(below+ch<innerHeight-8?below:Math.max(8,r.top-14-ch))+"px"}
addEventListener("resize",()=>{if(tourI>=0)tourShow()});
// shown once on each device, after the app has loaded, on a normal page
let tourTried=false;
function tourMaybe(){if(tourTried||tourSeen()||!loaded||storeMissing||["session","screen","test"].includes(view.name))return;tourTried=true;setTimeout(tourStart,700)}
{const h=document.getElementById("helpTop");if(h)h.onclick=()=>{busy=false;tourStart()}}
Object.assign(AR_DICT,{"❔ Help":"❔ مساعدة","✎ Record session":"✎ تسجيل جلسة","📖 Mushaf":"📖 المصحف","More":"المزيد","Tests":"الاختبارات","Reports and parents":"التقارير وأولياء الأمور","Student":"الطالب","Juz map and attendance":"خريطة الأجزاء والحضور","Class log":"سجل الفصل","Backup":"نسخة احتياطية","Download a copy of all records to keep somewhere safe":"نزّل نسخة من كل السجلات واحفظها في مكان آمن","✎ Mistakes and details":"✎ الأخطاء والتفاصيل","▴ Hide mistakes and details":"▴ إخفاء الأخطاء والتفاصيل","Amount suggestion":"اقتراح المقدار","Streak":"الاستمرار","Surah strength":"قوة السور","Coverage":"التغطية","Quran heart":"قلب القرآن","Goal":"الهدف","Progress":"التقدم","Journey":"الرحلة","Certificates":"الشهادات","Points":"النقاط","Mistakes to fix":"أخطاء للمراجعة","Which tajweed rule?":"أي حكم تجويد؟","Another rule…":"حكم آخر…","Skip":"تخطي"});
