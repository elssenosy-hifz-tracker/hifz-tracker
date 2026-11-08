const {chromium}=require('playwright');
const T=new Date().toISOString().slice(0,10);const D=k=>{const d=new Date();d.setDate(d.getDate()-k);return d.toISOString().slice(0,10)};
(async()=>{const b=await chromium.launch();const res=[];const ok=(n,c,x='')=>{res.push((c?'PASS ':'FAIL ')+n+(x?' — '+x:''))};
const open=async(role='owner')=>{const p=await b.newPage({viewport:{width:390,height:844}});p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto('file://'+process.cwd()+'/test3.html?seed#'+role);await p.waitForTimeout(2500);await p.evaluate(()=>{delete __store.events.e1;__fireAll()});await p.waitForTimeout(400);return p};
const evs=p=>p.evaluate(T=>Object.entries(__store.events).filter(([k,v])=>v.sid==='s1'&&v.type==='session'&&v.date===T).map(([k,v])=>({id:k,...v})),T);
const save=async p=>{await p.evaluate(()=>{const f=document.querySelector('form');f.requestSubmit()});};
// T1 double tap
let p=await open();await p.evaluate(()=>window.__lat=800);await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);
await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit();f.requestSubmit();});await p.waitForTimeout(2500);
let e=await evs(p);ok('T1 double tap makes one record',e.length===1,'records='+e.length);
ok('T1b record stamped uid/pv',e[0]&&e[0].pv===2&&e[0].uid==='u1',JSON.stringify(e[0]&&{pv:e[0].pv,uid:e[0].uid}));await p.close();
// T2 position update fails then retry
p=await open();await p.evaluate(()=>{window.__fail=(op,c)=>op==='update'&&c==='students'});await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);
await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
let m=await p.evaluate(()=>document.querySelector('#s_msg').textContent);ok('T2 partial failure message honest',/position was not updated/.test(m),m);
await p.evaluate(()=>{window.__fail=null;const f=document.querySelector('form');f.requestSubmit()});await p.waitForTimeout(800);
e=await evs(p);let pos=await p.evaluate(()=>__store.students.s1.pos);ok('T2b retry no duplicate, pos advanced',e.length===1&&pos>40,'records='+e.length+' pos='+pos);await p.close();
// T3 all review skipped -> no grade/points
p=await open();await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);
await p.evaluate(()=>{document.querySelectorAll('#qChips [data-qi]').forEach(b=>b.click())});await p.waitForTimeout(200);
await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
e=await evs(p);let pts=await p.evaluate(id=>ptsBreak({...__store.events[id],sid:'s1'}).map(x=>x[0]).join('|'),e[0]&&e[0].id);
ok('T3 unheard review: no grade, no review points',e[0]&&e[0].revGrade===''&&!/Review/.test(pts),JSON.stringify({rg:e[0]&&e[0].revGrade,pts}));await p.close();
// T4 juz test blank
p=await open();await p.evaluate(()=>go({name:'session',id:'s1',pre:'test'}));await p.waitForTimeout(600);
await p.evaluate(()=>{const t=document.querySelector('#s_type');if(t){t.value='test';t.dispatchEvent(new Event('change'))}});
await p.evaluate(()=>{const f=document.querySelector('form');f.requestSubmit()});await p.waitForTimeout(600);
let tests=await p.evaluate(()=>Object.values(__store.events).filter(v=>v.type==='test').length);m=await p.evaluate(()=>document.querySelector('#s_msg').textContent);
ok('T4 blank juz test refused',tests===0&&/mistakes/.test(m),m);await p.close();
// T5 auto-absent on break day / not held
p=await open();await p.evaluate(T=>{__store.breaks={b1:{cls:'all',from:T,to:T,mode:'pause'}};__fireAll()},T);await p.waitForTimeout(300);
await p.evaluate(()=>autoAbsent('x'));await p.waitForTimeout(500);let ab=await p.evaluate(T=>Object.values(__store.events).filter(v=>v.auto&&v.date===T).length,T);ok('T5 no auto-absent on break day',ab===0,'auto='+ab);
await p.evaluate(()=>{__store.breaks={};__fireAll()});await p.waitForTimeout(300);await p.evaluate(()=>{autoAbsBusy=false;return autoAbsent('x')});await p.waitForTimeout(500);
ab=await p.evaluate(T=>Object.values(__store.events).filter(v=>v.auto&&v.date===T).length,T);ok('T5b no auto-absent when class not held',ab===0,'auto='+ab);
await p.evaluate(()=>{autoAbsBusy=false;return autoAbsent('c1')});await p.waitForTimeout(500);ab=await p.evaluate(T=>Object.values(__store.events).filter(v=>v.auto&&v.date===T).length,T);ok('T5c End class (force) still marks absent',ab>=1,'auto='+ab);await p.close();
// T6 back-dated record does not move position
p=await open();await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
let pos1=await p.evaluate(()=>__store.students.s1.pos);
await p.evaluate(()=>go({name:'session',id:'s1',addMore:1}));await p.waitForTimeout(600);await p.evaluate(D=>{const d=document.querySelector('#s_date');d.value=D;d.dispatchEvent(new Event('change'))},D(3));
await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=false;f.requestSubmit()});await p.waitForTimeout(400);m=await p.evaluate(()=>document.querySelector('#s_msg').textContent);
await p.evaluate(()=>{const y=document.querySelector('#oddYes');y&&y.click()});await p.waitForTimeout(400);await p.evaluate(()=>{const y=document.querySelector('#oddYes');y&&y.click()});await p.waitForTimeout(800);
let pos2=await p.evaluate(()=>__store.students.s1.pos);let bd=await p.evaluate(D=>Object.values(__store.events).filter(v=>v.sid==='s1'&&v.date===D&&v.noAdvance).length,D(3));
ok('T6 back-dated record keeps position',pos1===pos2&&bd===1,`pos ${pos1}->${pos2} noAdvance=${bd} msg=${m.slice(0,80)}`);await p.close();
// T7 change date while editing today's record -> replaced
p=await open();await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);await p.evaluate(D=>{const d=document.querySelector('#s_date');d.value=D;d.dispatchEvent(new Event('change'))},D(1));
await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(400);await p.evaluate(()=>{const y=document.querySelector('#oddYes');y&&y.click()});await p.waitForTimeout(800);
let n7=await p.evaluate(D=>Object.values(__store.events).filter(v=>v.sid==='s1'&&v.type==='session'&&!v.auto&&v.hifzLines>0&&v.t>Date.now()-60000).length,D(1));
ok('T7 date change replaces, no duplicate',n7===1,'new records='+n7);await p.close();
// T8 buddy
p=await open();await p.evaluate(T=>{__store.events.bd1={sid:'s1',type:'buddy',helper:'s2',helperName:'Omar',rows:[{s:112,a1:1,a2:4,m:3}],date:T,t:Date.now()};__fireAll()},T);await p.waitForTimeout(400);
await p.evaluate(()=>go({name:'session',id:'s1'}));await p.waitForTimeout(600);await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
e=await evs(p);ok('T8 buddy kept separate',e[0]&&(e[0].revMist||0)===0&&(e[0].revBuddy||[]).length===1&&!(e[0].revRows||[]).some(r=>r.s===112&&r.m===3),JSON.stringify({rm:e[0]&&e[0].revMist,rb:e[0]&&e[0].revBuddy}));await p.close();
// T9 second record does not recount earlier marks
p=await open();await p.evaluate(T=>{__store.marks={mk1:{sid:'s1',w:100,k:'forgot',date:T,t:1000,src:'session',part:'h'}};__store.events.r1={sid:'s1',type:'session',date:T,att:'present',hifzLines:3,hifzMist:1,t:2000,from:38,to:40};__fireAll()},T);await p.waitForTimeout(400);
await p.evaluate(()=>go({name:'session',id:'s1',addMore:1}));await p.waitForTimeout(600);await p.evaluate(()=>{const f=document.querySelector('form');f._oddOk=true;f.requestSubmit()});await p.waitForTimeout(800);
let sec=await p.evaluate(T=>Object.entries(__store.events).filter(([k,v])=>k!=='r1'&&v.sid==='s1'&&v.date===T&&v.type==='session').map(([k,v])=>v.hifzMist),T);ok('T9 second record does not recount marks',sec.length===1&&sec[0]===0,JSON.stringify(sec));await p.close();
// T10 SUB fail-closed initially
p=await b.newPage();await p.goto('file://'+process.cwd()+'/test3.html?seed#owner');let early=await p.evaluate(()=>document.body.classList.contains('sub'));await p.waitForTimeout(2500);let late=await p.evaluate(()=>document.body.classList.contains('sub'));ok('T10 role: starts restricted, owner unlocked after check',early&&!late,`early=${early} late=${late}`);await p.close();
console.log(res.join('\n'));await b.close()})()
