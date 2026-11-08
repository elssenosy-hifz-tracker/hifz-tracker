(function(){
const store={};let nid=1;const subs={};
const coll=c=>store[c]||(store[c]={});
const snap=c=>({docs:Object.entries(coll(c)).map(([id,d])=>({id,data:()=>JSON.parse(JSON.stringify(d)),exists:true}))});
const fire=c=>setTimeout(()=>(subs[c]||[]).forEach(f=>f(snap(c))),0);
const doc=p=>{const i=p.indexOf('/');const c=p.slice(0,i),id=p.slice(i+1);return{
  id,set:async d=>{await new Promise(r=>setTimeout(r,window.__lat||0));if(window.__fail&&window.__fail('set',c,d))throw new Error('net');coll(c)[id]=JSON.parse(JSON.stringify(d));fire(c)},
  update:async d=>{await new Promise(r=>setTimeout(r,window.__lat||0));if(window.__fail&&window.__fail('update',c,d))throw new Error('net');if(!coll(c)[id])throw new Error('nf');Object.assign(coll(c)[id],JSON.parse(JSON.stringify(d)));fire(c)},
  delete:async()=>{delete coll(c)[id];fire(c)},
  get:async()=>({id,exists:!!coll(c)[id],data:()=>coll(c)[id]&&JSON.parse(JSON.stringify(coll(c)[id]))})}};
const collection=c=>({onSnapshot:(f)=>{(subs[c]||(subs[c]=[])).push(f);setTimeout(()=>f(snap(c)),0);return()=>{}},
  add:async d=>{await new Promise(r=>setTimeout(r,window.__lat||0));if(window.__fail&&window.__fail('add',c,d))throw new Error('net');const id='m'+(nid++);coll(c)[id]=JSON.parse(JSON.stringify(d));fire(c);return{id}},
  get:async()=>snap(c),doc:id=>doc(c+'/'+id)});
const db={collection,doc};
window.__store=store;window.__fireAll=()=>Object.keys(subs).forEach(fire);
window.__dl=[];
window.claude={use:async n=>n==='db'?db:n==='downloads'?{save:async o=>{window.__dl.push({name:o.filename,text:await o.data.text()})}}:n==='user'?(()=>{const R=(location.hash.slice(1)||'owner');const me={owner:{id:'u1',email:'ahmed@x.com',isOwner:true,canEdit:true},teacher:{id:'u2',email:null,isOwner:false,canEdit:false},t3:{id:'u3',email:'t3@x.com',isOwner:false,canEdit:false},sup:{id:'u4',email:'sup@x.com',isOwner:false,canEdit:false},new:{id:'u9',email:null,isOwner:false,canEdit:false}}[R];return {canEdit:async()=>me.canEdit,isOwner:async()=>me.isOwner,me:async()=>({...me,name:'',avatarUrl:'',color:'#888'})}})():null};
const T=new Date();const iso=d=>d.toISOString().slice(0,10);const day=k=>{const d=new Date(T);d.setDate(d.getDate()-k);return iso(d)};
Object.assign(coll('classes'),{c1:{name:'Kids class',n:1,days:[0,1,2,3,4,5,6],time:'15:30',end:'17:00'},c2:{name:'Adults class',n:2,days:[4],time:'17:30'}});
Object.assign(coll('students'),{s1:{name:'Yusuf',cls:'c1',order:'nas',startS:113,prevS:[],amount:5,readPages:20,readStart:1,farDays:7,days:[0,1,2,3,4,5,6],start:day(20),pos:40},
 s2:{name:'Omar',cls:'c2',order:'nas',startS:113,prevS:[],amount:15,readPages:20,readStart:1,farDays:7,days:[4],start:day(20),pos:200}});
Object.assign(coll('events'),{
 e1:{sid:'s1',type:'session',date:day(0),att:'absent'},
 e2:{sid:'s1',type:'session',date:day(1),att:'present',hw:false,hifzLines:3,hifzMist:1,hifzGrade:'Good',revType:'near',revMist:2,revGrade:'Very good',beh:['sleepy','disrupt']},
 e3:{sid:'s2',type:'session',date:day(0),att:'late',hifzLines:30,hifzMist:3,hifzGrade:'Very good',revType:'near',revMist:0,revGrade:'Excellent'},
 e4:{sid:'s2',type:'session',date:'2026-10-20',att:'present',hifzLines:30,hifzMist:3,hifzGrade:'Very good'}});
Object.assign(coll('marks'),{k1:{sid:'s1',w:12,k:'prompt',date:day(1),t:1}});
coll('settings').main={};
if(location.search.includes('seed')){Object.assign(coll('teachers'),{t1:{name:'Ahmed',role:'admin',active:true,n:1},t2:{name:'Bilal',role:'teacher',active:true,n:2,phone:'+61400111222'},t3:{name:'Khalid',role:'teacher',active:true,n:3,email:'t3@x.com',phone:'+61400333444'},t4:{name:'Supervisor Sami',role:'supervisor',active:true,n:4,email:'sup@x.com'}});coll('classes').c1.teacher='t2';coll('classes').c2.teacher='t1';coll('links').u2={tid:'t2'};}
})();