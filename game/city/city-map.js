// Xmas Lights: night city map (three.js r128). Built from the V1 isometric world tiles, lit like the V4 night town.
(function(){
'use strict';
if(!window.THREE){window.XLCity={ok:false};return}
const T=THREE;let R;
try{R=new T.WebGLRenderer({antialias:true,alpha:true});}catch(e){window.XLCity={ok:false};return}
R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.08;R.setClearColor(0x000000,0);
let SEED=5;const rnd=()=>{SEED=(SEED*16807)%2147483647;return (SEED-1)/2147483646;};

/* ---------- environment for glossy reflections ---------- */
const ENV=(()=>{const s=new T.Scene(),c=document.createElement('canvas');c.width=16;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
 g.addColorStop(0,'#d9c8f4');g.addColorStop(.45,'#8a6ad8');g.addColorStop(1,'#2a1470');x.fillStyle=g;x.fillRect(0,0,16,128);
 s.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.BackSide})));
 const mm=new T.MeshBasicMaterial();mm.color.setRGB(4,4,4);const b=new T.Mesh(new T.BoxGeometry(16,16,1),mm);b.position.set(-14,24,18);b.lookAt(0,0,0);s.add(b);
 const b2=new T.Mesh(new T.BoxGeometry(8,8,1),mm);b2.position.set(20,10,10);b2.lookAt(0,0,0);s.add(b2);
 const p=new T.PMREMGenerator(R),e=p.fromScene(s,.04).texture;p.dispose();return e;})();

/* ---------- material + geometry helpers ---------- */
const mats={};
function M(c,o={}){const k=c+JSON.stringify(o);if(mats[k])return mats[k];
 const P=(o.clear!==undefined)?T.MeshPhysicalMaterial:T.MeshStandardMaterial;
 const m=new P({color:c,roughness:o.r===undefined?.78:o.r,metalness:o.m||0,envMapIntensity:o.env===undefined?.3:o.env*.7});m.color.convertSRGBToLinear();
 if(o.e){m.emissive=new T.Color(o.e).convertSRGBToLinear();m.emissiveIntensity=o.ei===undefined?1:o.ei;}
 if(o.clear!==undefined){m.clearcoat=o.clear;m.clearcoatRoughness=.1;}
 if(o.op!==undefined){m.transparent=true;m.opacity=o.op;m.depthWrite=o.op>.6;}
 if(o.flat)m.flatShading=true;if(o.map)m.map=o.map;if(o.side)m.side=T.DoubleSide;
 return mats[k]=m;}
function mesh(g,m,p,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;if(p)p.add(o);return o;}
function rboxG(w,h,d,r=.12,b=.06){b=Math.min(b,h/2-.001,w/2-.01,d/2-.01);const W=w/2-b,D=d/2-b;r=Math.max(.001,Math.min(r,W-.001,D-.001));const s=new T.Shape();
 s.moveTo(-W+r,-D);s.lineTo(W-r,-D);s.quadraticCurveTo(W,-D,W,-D+r);s.lineTo(W,D-r);s.quadraticCurveTo(W,D,W-r,D);s.lineTo(-W+r,D);s.quadraticCurveTo(-W,D,-W,D-r);s.lineTo(-W,-D+r);s.quadraticCurveTo(-W,-D,-W+r,-D);
 const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:6});g.rotateX(-Math.PI/2);g.translate(0,b,0);return g;}
const box=(p,w,h,d,m,x=0,y=0,z=0,r,b)=>mesh(rboxG(w,h,d,r,b),m,p,x,y,z);
const SG=new T.SphereGeometry(1,28,18);
function sph(p,r,m,x=0,y=0,z=0,sx=1,sy=1,sz=1){const o=mesh(SG,m,p,x,y,z);o.scale.set(r*sx,r*sy,r*sz);return o;}
function cyl(p,rt,rb,h,m,x=0,y=0,z=0,seg=24){const g=new T.CylinderGeometry(rt,rb,h,seg);g.translate(0,h/2,0);return mesh(g,m,p,x,y,z);}
function cone(p,r,h,m,x=0,y=0,z=0,seg=24){const g=new T.ConeGeometry(r,h,seg);g.translate(0,h/2,0);return mesh(g,m,p,x,y,z);}
function torus(p,R_,t,m,x=0,y=0,z=0,arc=Math.PI*2){const o=mesh(new T.TorusGeometry(R_,t,10,28,arc),m,p,x,y,z);o.rotation.x=Math.PI/2;return o;}
function tube(p,pts,r,m,seg=24){const c=new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(a[0],a[1],a[2])));return mesh(new T.TubeGeometry(c,seg,r,8,false),m,p);}
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);})();
function glow(p,col,s,x=0,y=0,z=0,op=.7){const sp=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:new T.Color(col).convertSRGBToLinear(),blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:op}));sp.scale.set(s,s,1);sp.position.set(x,y,z);p.add(sp);return sp;}
const stripeTex=(a='#e8263b',b='#ffffff')=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=b;x.fillRect(0,0,64,64);x.fillStyle=a;for(let k=-1;k<=1;k++){x.beginPath();x.moveTo(k*64,0);x.lineTo(k*64+30,0);x.lineTo(k*64+94,64);x.lineTo(k*64+64,64);x.fill();}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;return t;};
const STRIPE=stripeTex();
function candyMat(ru,rv){const t=STRIPE.clone();t.needsUpdate=true;t.repeat.set(ru,rv);return new T.MeshStandardMaterial({map:t,roughness:.35,envMapIntensity:.3});}
function textTex(txt,fg='#fff3d6',bg='#8a4a2a',w=512,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';let fs=h*.62;x.font=fs+'px "Lilita One",Fredoka,sans-serif';while(x.measureText(txt).width>w*.9){fs-=2;x.font=fs+'px "Lilita One",Fredoka,sans-serif';}x.fillText(txt,w/2,h/2+2);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t;}
const starGeo=(()=>{const s=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.46:1;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.16,bevelEnabled:true,bevelThickness:.1,bevelSize:.1,bevelSegments:3});g.translate(0,0,-.08);return g;})();
function star(p,r,x,y,z,ry=0,lit=true){const m=mesh(starGeo,M('#ffd23a',{r:.3,m:.3,env:1,e:'#ffb000',ei:lit?.9:.1}),p,x,y,z);m.scale.setScalar(r);m.rotation.y=ry;if(lit)glow(p,'#ffd98a',r*5,x,y,z,.8);return m;}
const COL={red:'#ff3048',gold:'#ffc21a',green:'#2fd46a',blue:'#3a8dff',pink:'#ff5cc8',orange:'#ff8a2a',purple:'#9b5cff'};
const CN=['red','gold','green','blue','pink','orange'];

/* ---------- characters ---------- */
const bulbGeo=(()=>{const pts=[[.001,0],[.2,.015],[.34,.1],[.42,.25],[.41,.4],[.34,.56],[.22,.74],[.1,.89],[.001,1]].map(p=>new T.Vector2(p[0],p[1]));
 const sp=new T.SplineCurve(pts).getPoints(40);sp.forEach(p=>{p.x=Math.max(.001,p.x);});return new T.LatheGeometry(sp,40);})();
function bulb(c,o={}){const g=new T.Group(),col=COL[c],lit=o.lit!==false,ink=M('#24103a',{r:.2,env:.8});
 const gm=M('#f2b630',{m:.9,r:.28,env:1.3});cyl(g,.19,.17,.24,gm,0,0,0);torus(g,.195,.028,gm,0,.07,0);torus(g,.195,.028,gm,0,.16,0);
 const glass=mesh(bulbGeo,M(col,{clear:1,r:.18,env:1.1,e:col,ei:lit?.38:0}),g,0,.2,0);if(!lit)glass.material=M(new T.Color(col).multiplyScalar(.45).getStyle(),{clear:1,r:.25,env:.9});
 if(lit)glow(g,col,2.0,0,.62,0,.28);
 if(o.face!==false){const f=o.face||'happy';
  if(f==='sleepy'){[-1,1].forEach(s=>{const t=mesh(new T.TorusGeometry(.055,.014,6,12,Math.PI),ink,g,s*.15,.56,.385);t.rotation.z=Math.PI;});}
  else{[-1,1].forEach(s=>{sph(g,.06,ink,s*.15,.55,.365,1,f==='wow'?1.35:1.15,.6);sph(g,.02,M('#fff',{e:'#fff',ei:.6}),s*.15+.02,.58,.405);});}
  if(f==='joy'||f==='wow')sph(g,f==='wow'?.05:.085,M('#6a1030',{r:.4}),0,.43,.4,1,f==='wow'?1.2:.75,.4);
  else if(f!=='sleepy'){const t=mesh(new T.TorusGeometry(.07,.018,6,14,Math.PI),M('#6a1030',{r:.4}),g,0,.46,.405);t.rotation.z=Math.PI;}
  [-1,1].forEach(s=>sph(g,.05,M('#ff8ab0',{r:.6,op:.75}),s*.26,.46,.31,1,.65,.3));}
 const am=M(new T.Color(col).multiplyScalar(.7).getStyle(),{r:.4}),hm=M('#ffffff',{r:.35,e:'#ffffff',ei:.15});
 const arm=(s,up)=>{const pts=up?[[s*.38,.52,.05],[s*.6,.62,.1],[s*.62,1.0,.1]]:[[s*.38,.5,.05],[s*.6,.46,.12],[s*.66,.3,.14]];tube(g,pts,.03,am,12);const e=pts[2];sph(g,.075,hm,e[0],e[1],e[2]);};
 const a=o.arms||'none';if(a==='up'){arm(-1,1);arm(1,1);}if(a==='wave'){arm(-1,0);arm(1,1);}if(a==='down'){arm(-1,0);arm(1,0);}
 g.scale.setScalar(o.s||1);g.rotation.y=o.ry||0;return g;}
function miniBulb(p,c,s,x,y,z,rz=0){const g=new T.Group();cyl(g,.12,.12,.16,M('#2f7a3a'),0,-.16,0,10);const m=mesh(bulbGeo,M(COL[c],{clear:1,r:.2,e:COL[c],ei:1.1}),g);m.rotation.x=Math.PI;glow(g,COL[c],2.0,0,-.5,0,.3);g.scale.setScalar(s);g.position.set(x,y,z);g.rotation.z=rz;p.add(g);return g;}
function coal(o={}){const g=new T.Group();const b=mesh(new T.IcosahedronGeometry(.5,0),M('#2a2740',{r:.55,flat:true,env:.9}),g,0,.46,0);b.rotation.set(.3,.4,.1);b.scale.set(1.1,.95,1);
 [-1,1].forEach(s=>{sph(g,.075,M('#ffd23a',{e:'#ffb000',ei:1.6}),s*.17,.5,.42,1,.8,.5);const br=box(g,.22,.06,.06,M('#0c0a14'),s*.17,.59,.45,.02,.02);br.rotation.z=-s*.45;});
 glow(g,'#ff9a2a',1.1,0,.5,.45,.5);g.scale.setScalar(o.s||1);g.rotation.y=o.ry||0;return g;}
function santa(o={}){const g=new T.Group(),red=M('#e3192e',{r:.6}),wh=M('#fff8fb',{r:.9}),skin=M('#ffc9a8',{r:.6}),blk=M('#231826',{r:.35,env:.8});
 [-1,1].forEach(s=>sph(g,.22,blk,s*.26,.14,.12,1,.65,1.45));
 sph(g,.75,red,0,.95,0,1,.95,.95);torus(g,.66,.13,wh,0,.42,0);torus(g,.745,.075,blk,0,.92,0);box(g,.24,.2,.08,M('#ffc21a',{m:.8,r:.3,env:1.2}),0,.82,.74,.03,.02);
 box(g,.2,.62,.1,wh,0,1.0,.68,.05,.04).rotation.x=-.25;
 sph(g,.42,skin,0,1.85,0);
 [[0,1.58,.3,.3],[-.22,1.68,.26,.24],[.22,1.68,.26,.24],[0,1.42,.34,.22],[-.36,1.84,.1,.18],[.36,1.84,.1,.18]].forEach(b=>sph(g,b[3],wh,b[0],b[1],b[2]));
 [-1,1].forEach(s=>{sph(g,.12,wh,s*.13,1.75,.45,1.5,.7,.7);sph(g,.045,blk,s*.14,1.96,.37,1,1.2,.6);sph(g,.07,M('#ff8a9a',{r:.6,op:.7}),s*.27,1.86,.3,1,.7,.4);});
 sph(g,.075,M('#ff8c84',{r:.4}),0,1.85,.44);
 const hb=torus(g,.4,.11,wh,0,2.12,0);hb.rotation.z=.12;const hc=cone(g,.38,.75,red,-.03,2.14,0);hc.rotation.z=.4;sph(g,.13,wh,-.32,2.82,0);
 const arm=(s,up)=>{const pts=up?[[s*.6,1.3,0],[s*.95,1.5,.12],[s*1.0,2.05,.2]]:[[s*.6,1.3,0],[s*.92,1.1,.25],[s*.8,.85,.5]];tube(g,pts,.15,red,12);const e=pts[2];sph(g,.15,wh,e[0],e[1]-(up?.12:-.1),e[2]-(up?0:.08),1,.7,1);sph(g,.17,M('#1f8a44',{r:.6}),e[0],e[1]+(up?.08:-.06),e[2]+(up?0:.08));};
 arm(-1,o.arms==='up');arm(1,o.arms==='up'||o.arms==='one');
 g.scale.setScalar(o.s||1);g.rotation.y=o.ry||0;return g;}
function deer(o={}){const g=new T.Group(),br=M('#b06a34',{r:.7}),lt=M('#f4d8b0',{r:.8}),dk=M('#5a2f14',{r:.6}),ink=M('#24103a',{r:.2,env:.8});
 sph(g,.45,br,0,.62,0,1.05,.9,1.3);sph(g,.3,lt,0,.52,.22,.9,.75,1);[[-.22,.25],[.22,.25],[-.22,-.3],[.22,-.3]].forEach(l=>{cyl(g,.085,.075,.42,br,l[0],0,l[1],10);cyl(g,.09,.09,.1,dk,l[0],0,l[1],10);});
 sph(g,.1,M('#fff',{r:.9}),0,.75,-.58);
 sph(g,.36,br,0,1.22,.42);sph(g,.21,lt,0,1.1,.7,1,.85,1);sph(g,.095,M('#ff3048',{clear:1,r:.2,e:'#ff3048',ei:1.2}),0,1.16,.9);glow(g,'#ff5060',1.3,0,1.16,.92,.6);
 [-1,1].forEach(s=>{sph(g,.06,ink,s*.15,1.3,.72,1,1.2,.6);sph(g,.02,M('#fff',{e:'#fff',ei:.6}),s*.15+.02,1.33,.765);sph(g,.14,br,s*.36,1.42,.3,1.3,.5,.6);
  const tan=M('#f0d09a',{r:.6});tube(g,[[s*.16,1.5,.36],[s*.26,1.8,.34],[s*.22,2.08,.34]],.04,tan,10);tube(g,[[s*.25,1.74,.34],[s*.44,1.86,.34],[s*.5,2.0,.34]],.035,tan,8);
  if(o.lights){miniBulb(g,CN[(s+1)],.22,s*.22,2.02,.38,s*.4);miniBulb(g,CN[s+4],.22,s*.5,1.94,.38,s*.6);}});
 g.scale.setScalar(o.s||1);g.rotation.y=o.ry||0;return g;}

/* ---------- props ---------- */
function gift(w,h,d,c,rc='#ffd23a'){const g=new T.Group();box(g,w,h*.74,d,M(c,{r:.5,env:.6}),0,0,0,.06,.04);box(g,w*1.08,h*.28,d*1.08,M(c,{r:.5,env:.6}),0,h*.72,0,.06,.04);
 const rm=M(rc,{r:.35,m:.2,env:.9});box(g,w*.2,h*1.01,d*1.1,rm,0,0,0,.02,.01);box(g,w*1.1,h*1.01,d*.2,rm,0,0,0,.02,.01);
 [-1,1].forEach(s=>{const t=mesh(new T.TorusGeometry(w*.16,w*.055,8,16),rm,g,s*w*.17,h+w*.1,0);t.rotation.set(0,0,s*.5);});sph(g,w*.08,rm,0,h+.04,0);return g;}
function snowTree(h=2.6,o={}){const g=new T.Group(),k=h/2.6,cm=M(o.c||'#fff3fa',{r:.9}),bm=M(o.ball||'#e9a23a',{m:.9,r:.25,env:1.4});cyl(g,.16*k,.2*k,.4*k,M(o.pot||'#c2264a'),0,0,0);
 for(let i=0;i<3;i++){const r=(.98-.25*i)*k,hh=1.1*k,y=(.32+i*.62)*k;cone(g,r,hh,cm,0,y,0);torus(g,r*.8,r*.21,cm,0,y+.05*k,0);
  const nb=7-i;for(let j=0;j<nb;j++){const a=j/nb*6.283+i*.7;sph(g,.085*k,bm,Math.cos(a)*r*.99,y+.1*k,Math.sin(a)*r*.99);}}
 if(o.star!==false)star(g,.22*k,0,2.72*k,0,Math.PI/4,true);return g;}
function candyPole(h=1.4,ball=true){const g=new T.Group();cyl(g,.11,.11,h,candyMat(1,h*1.6),0,0,0,16);if(ball)sph(g,.17,M('#e9a23a',{m:.9,r:.25,env:1.4}),0,h+.12,0);return g;}
function cane(h=1.6){const g=new T.Group();const c=new T.CatmullRomCurve3([[0,0,0],[0,h*.6,0],[0,h,0],[.1,h+.24,0],[.32,h+.32,0],[.54,h+.24,0],[.62,h+.02,0]].map(a=>new T.Vector3(a[0],a[1],a[2])));mesh(new T.TubeGeometry(c,40,.12,10,false),candyMat(h*3,1),g);return g;}
function snowman(s=1){const g=new T.Group(),wh=M('#fff6fb',{r:.9}),ink=M('#24103a');sph(g,.55,wh,0,.45,0);sph(g,.4,wh,0,1.12,0);sph(g,.3,wh,0,1.62,0);
 cyl(g,.3,.3,.05,ink,0,1.84,0);cyl(g,.2,.2,.32,ink,0,1.86,0);cyl(g,.205,.205,.08,M('#e3192e'),0,1.9,0);
 const n=cone(g,.06,.26,M('#ff8a2a'),0,1.62,.28,10);n.rotation.x=Math.PI/2;[-1,1].forEach(s2=>{sph(g,.04,ink,s2*.1,1.7,.26);tube(g,[[s2*.36,1.15,0],[s2*.7,1.4,.05],[s2*.85,1.55,.05]],.03,M('#6b3a1a'),6);});
 torus(g,.3,.08,M('#e3192e'),0,1.38,0);sph(g,.045,ink,0,1.2,.39);sph(g,.045,ink,0,1.0,.39);g.scale.setScalar(s);return g;}
function lamp(h=1.9){const g=new T.Group(),dk=M('#2a2260',{r:.5});cyl(g,.16,.2,.14,dk,0,0,0);cyl(g,.055,.065,h,dk,0,0,0,10);sph(g,.21,M('#ffe9a8',{e:'#ffc45a',ei:1.5}),0,h+.16,0);cone(g,.25,.2,dk,0,h+.32,0,12);glow(g,'#ffc45a',2,0,h+.16,0,.6);torus(g,.1,.04,M('#e3192e'),0,h*.72,0);return g;}
function fence(n,ax='z'){const g=new T.Group(),wh=M('#fff6fb',{r:.8});for(let i=0;i<n;i++){const p=box(g,.16,.62,.16,wh,ax==='z'?0:i*.48,0,ax==='z'?i*.48:0,.04,.03);cone(g,.11,.14,wh,p.position.x,.6,p.position.z,4).rotation.y=Math.PI/4;}
 const L=(n-1)*.48;[.2,.42].forEach(y=>box(g,ax==='z'?.08:L,.08,ax==='z'?L:.08,wh,ax==='z'?0:L/2,y,ax==='z'?L/2:0,.02,.02));return g;}
function sign(txt,o={}){const g=new T.Group();const p=candyPole(.95,false);g.add(p);const w=o.w||2;box(g,w,.5,.14,M('#8a4a2a',{r:.7}),0,.62,0,.06,.04);
 const pl=mesh(new T.PlaneGeometry(w*.92,.4),new T.MeshStandardMaterial({map:textTex(txt),roughness:.7}),g,0,.87,.075);pl.castShadow=false;sph(g,.15,M('#e9a23a',{m:.9,r:.25,env:1.4}),0,1.22,0);
 sph(g,.09,M('#e3192e',{r:.3}),-.06,.52,.1);sph(g,.09,M('#e3192e',{r:.3}),.07,.5,.1);return g;}
function house(o={}){const g=new T.Group(),w=o.w||3,d=o.d||2.4,h=o.h||1.45,wall=M(o.wall||'#e8364f',{r:.7}),rise=o.rise||1.25,y0=.38,roofM=M(o.roof||'#fff6fb',{r:.9}),trim=M('#fff6fb',{r:.8});
 box(g,w+.3,.42,d+.3,M('#bdb6e0',{r:.85}),0,0,0,.1,.06);for(let i=0;i<5;i++){box(g,.5,.2,.06,M('#a59fd0'),-w/2+.4+i*(w-.6)/4,.1+(i%2)*.02,d/2+.14,.03,.02);}
 box(g,w,h,d,wall,0,y0,0,.05,.03);
 const tri=new T.Shape();tri.moveTo(-d/2+.03,0);tri.lineTo(0,rise);tri.lineTo(d/2-.03,0);tri.closePath();const tg=new T.ExtrudeGeometry(tri,{depth:w-.08,bevelEnabled:false});tg.translate(0,0,-(w-.08)/2);tg.rotateY(Math.PI/2);mesh(tg,wall,g,0,y0+h-.01,0);
 const ov=.42,rs=new T.Shape();rs.moveTo(-d/2-ov,-.14);rs.lineTo(-.25,rise+.2);rs.quadraticCurveTo(0,rise+.46,.25,rise+.2);rs.lineTo(d/2+ov,-.14);rs.quadraticCurveTo(d/2+ov+.06,-.4,d/2+ov-.2,-.42);rs.lineTo(0,rise-.06);rs.lineTo(-d/2-ov+.2,-.42);rs.quadraticCurveTo(-d/2-ov-.06,-.4,-d/2-ov,-.14);
 const rg=new T.ExtrudeGeometry(rs,{depth:w+.5,bevelEnabled:true,bevelThickness:.1,bevelSize:.1,bevelSegments:3,curveSegments:10});rg.translate(0,0,-(w+.5)/2);rg.rotateY(Math.PI/2);mesh(rg,roofM,g,0,y0+h,0);
 const dots=o.dots||['#ff3048','#ffc21a','#2fd46a','#3a8dff','#ff5cc8'];let di=0;[-1,1].forEach(s=>{for(let i=0;i<4;i++)for(let j=0;j<3;j++){const t=.2+j*.27,x=-w/2+.25+i*(w-.1)/3.4+(j%2)*.3;if(x>w/2+.15)continue;
   const zz=s*(d/2+ov)*(1-t),yy=y0+h-.14+(rise+.46)*t+.1;{const dc=dots[di++%dots.length];sph(g,.085,M(dc,{r:.3,e:dc,ei:1.6}),x,yy,zz+s*.06);}}});
 const cx=-w*.24,cz=-d*.2;box(g,.52,1.3,.52,M(o.chim||'#1f5a4a',{r:.7}),cx,y0+h+rise*.25,cz,.05,.03);box(g,.66,.2,.66,M(o.chim||'#1f5a4a',{r:.7}),cx,y0+h+rise*.25+1.2,cz,.05,.03);
 sph(g,.26,trim,cx,y0+h+rise*.25+1.52,cz,1,.8,1);sph(g,.34,trim,cx+.1,y0+h+rise*.25+2.0,cz-.05);sph(g,.24,trim,cx-.12,y0+h+rise*.25+2.5,cz+.05);
 const wy=y0+h*.5,wx=-w*.14;box(g,.95,.95,.1,trim,wx,wy-.47,d/2+.01,.05,.03);box(g,.72,.72,.12,M('#ffe2a0',{e:'#ffb347',ei:1.3}),wx,wy-.36,d/2+.03,.03,.02);box(g,.06,.72,.14,trim,wx,wy-.36,d/2+.04,.01,.01);box(g,.72,.06,.14,trim,wx,wy-.03,d/2+.04,.01,.01);glow(g,'#ffb347',1.8,wx,wy,d/2+.3,.45);
 for(let i=0;i<6;i++){const c=CN[i%6];sph(g,.07,M(COL[c],{e:COL[c],ei:1.4}),-w/2+.2+i*(w-.4)/5,y0+h-.1,d/2+ov-.06);}
 const dz=o.doorZ===undefined?d*.12:o.doorZ;box(g,.12,1.08,.66,M(o.door||'#1f5a4a',{r:.6}),w/2+.02,y0,dz,.05,.03);box(g,.1,1.2,.82,trim,w/2-.02,y0,dz,.05,.03);
 const wr=mesh(new T.TorusGeometry(.17,.06,8,18),M('#1f8a44',{r:.8}),g,w/2+.11,y0+.72,dz);wr.rotation.y=Math.PI/2;sph(g,.055,M('#e3192e',{r:.3}),w/2+.16,y0+.56,dz);
 sph(g,.2,M('#ffe2a0',{e:'#ffb347',ei:1.2}),w/2+.02,y0+h+rise*.3,0,.2,1,1);
 box(g,.5,.14,.9,M('#f2c9a8',{r:.8}),w/2+.4,0,dz,.05,.03);
 if(o.poles!==false)[-1,1].forEach(s=>{const p=candyPole(1.25);p.position.set(w/2+.5,0,dz+s*.62);g.add(p);});
 return g;}
function igloo(){const g=new T.Group(),wh=M('#f4fbff',{r:.85});mesh(new T.SphereGeometry(1.45,28,14,0,Math.PI*2,0,Math.PI/2),wh,g);const e=new T.Group();box(e,1.0,.85,.9,wh,0,0,0,.3,.1);sph(e,.33,M('#2a2a6a'),0,.3,.44,1,1.05,.25);e.position.set(.95,0,.95);e.rotation.y=Math.PI/4;g.add(e);
 for(let i=0;i<7;i++){const a=i/7*6.28;sph(g,.02,M('#c9e6ff'),0,0,0);box(g,.3,.03,.03,M('#cfe8fa'),Math.cos(a)*1.35,.5,Math.sin(a)*1.35,.01,.01).rotation.y=-a+Math.PI/2;}return g;}
function crystals(n=4,s=1){const g=new T.Group(),m=M('#a9ecff',{clear:1,r:.08,env:1.6,e:'#58ccff',ei:.45,flat:true});for(let i=0;i<n;i++){const hh=(.8+rnd()*1.3)*s,c=mesh(new T.ConeGeometry(.22*s+rnd()*.1,hh,6),m,g,(rnd()-.5)*.9*s,hh/2-.05,(rnd()-.5)*.9*s);c.rotation.set((rnd()-.5)*.5,rnd()*3,(rnd()-.5)*.5);}glow(g,'#8fe6ff',2.2*s,0,.7*s,0,.35);return g;}
function iceBlock(c){const g=new T.Group();const b=bulb(c,{lit:false,face:'sleepy',s:.72});g.add(b);box(g,.86,1.12,.86,M('#c8f2ff',{clear:1,r:.05,env:1.6,op:.42}),0,0,0,.1,.06);sph(g,.3,M('#fff',{r:.9}),.1,1.1,0,1.3,.35,1.2);return g;}
function spool(s=1){const g=new T.Group(),br=M('#b06a34',{r:.7});cyl(g,.52,.52,.09,br,0,0,0);cyl(g,.4,.4,.6,M('#2fae5e',{r:.6}),0,.09,0);for(let i=0;i<5;i++)torus(g,.405,.03,M('#1f8a44'),0,.16+i*.115,0);cyl(g,.52,.52,.09,br,0,.69,0);g.scale.setScalar(s);return g;}
function lolli(h=2.2,c='#ff5cc8'){const g=new T.Group();cyl(g,.05,.05,h,M('#fff',{r:.5}),0,0,0,10);const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,128,128);x.strokeStyle=c;x.lineWidth=13;x.lineCap='round';x.beginPath();for(let a=0;a<22;a+=.1){const r=a*2.8;x.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}x.stroke();const t=new T.CanvasTexture(cv);t.encoding=T.sRGBEncoding;
 const cm=new T.MeshPhysicalMaterial({map:t,roughness:.2,clearcoat:1,envMapIntensity:1}),sm=new T.MeshPhysicalMaterial({color:c,roughness:.2,clearcoat:1,envMapIntensity:1});
 const hd=new T.Group(),m=mesh(new T.CylinderGeometry(.62,.62,.2,32),[sm,cm,cm],hd);m.rotation.x=Math.PI/2;hd.position.y=h+.45;hd.rotation.y=Math.PI/4;g.add(hd);return g;}
function gumdrop(c,s=1){const g=new T.Group();const m=mesh(new T.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2),M(c,{r:.55,env:.8,e:c,ei:.12}),g);m.scale.set(s,s*1.15,s);return g;}
function strand(p,a,b,sag,n,s=.16){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(t*Math.PI)*sag,a[2]+(b[2]-a[2])*t]);}tube(p,pts,.022,M('#1f6a34',{r:.6}),24);
 for(let i=0;i<n;i++){const t=(i+.5)/n;miniBulb(p,CN[i%6],s,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(t*Math.PI)*sag-.02,a[2]+(b[2]-a[2])*t,(i%2?.3:-.3));}}

const SNOWN=M('#c9d0f4',{r:.95});
function facade(o){const fl=o.floors||3,cl=o.cols||3,W=cl*64,H=fl*72+(o.shop?100:0),c=document.createElement('canvas'),e=document.createElement('canvas');c.width=e.width=W;c.height=e.height=H;
 const x=c.getContext('2d'),y=e.getContext('2d');x.fillStyle=o.wall||'#8a3a3a';x.fillRect(0,0,W,H);y.fillStyle='#000';y.fillRect(0,0,W,H);
 x.globalAlpha=.16;x.fillStyle='#000';for(let r=0;r<H/8;r++){x.fillRect(0,r*8,W,1);for(let k=0;k<W/20+1;k++)x.fillRect(k*20+(r%2)*10,r*8,1,8);}x.globalAlpha=1;
 const lit=o.lit===undefined?.65:o.lit,trim=o.trim||'#dcd6ff';
 for(let f=0;f<fl;f++)for(let k=0;k<cl;k++){const wx=k*64+16,wy=f*72+16,on=rnd()<lit;
  x.fillStyle=trim;x.fillRect(wx-4,wy-4,40,50);x.fillRect(wx-7,wy+44,46,5);
  const col=on?['#ffd27a','#ffbe5a','#ffe2a0','#ffc46a','#9fe6ff'][Math.floor(rnd()*4.3)]:'#1a2260';x.fillStyle=col;x.fillRect(wx,wy,32,42);
  if(on){y.fillStyle=col;y.fillRect(wx,wy,32,42);x.fillStyle='rgba(150,60,20,.4)';x.fillRect(wx,wy,7,42);x.fillRect(wx+25,wy,7,42);y.fillStyle='rgba(0,0,0,.35)';y.fillRect(wx,wy,7,42);y.fillRect(wx+25,wy,7,42);}
  x.fillStyle=trim;x.fillRect(wx+15,wy,2,42);x.fillRect(wx,wy+20,32,2);y.fillStyle='#000';y.fillRect(wx+15,wy,2,42);y.fillRect(wx,wy+20,32,2);
  x.fillStyle='#fff';x.fillRect(wx-7,wy+41,46,4);}
 if(o.shop){const sy=fl*72,ww=W-58,son=lit>.4;x.fillStyle='#161a4a';x.fillRect(0,sy,W,100);x.fillStyle=son?'#ffd98a':'#222a70';x.fillRect(10,sy+36,ww,54);if(son){y.fillStyle='#ffcf7a';y.fillRect(10,sy+36,ww,54);}
  for(let k=0;k<(ww-10)/26;k++){const cc=['#e3192e','#2fbf6a','#3a8dff','#ff5cc8'][k%4];x.fillStyle=cc;x.beginPath();x.arc(24+k*26,sy+76,8,0,7);x.fill();if(son){y.fillStyle=cc;y.globalAlpha=.7;y.beginPath();y.arc(24+k*26,sy+76,8,0,7);y.fill();y.globalAlpha=1;}}
  x.fillStyle=o.door||'#c2264a';x.fillRect(W-40,sy+34,30,66);x.fillStyle=son?'#ffd98a':'#222a70';x.fillRect(W-34,sy+40,18,22);if(son){y.fillStyle='#ffcf7a';y.fillRect(W-34,sy+40,18,22);}}
 const mk=cv=>{const t=new T.CanvasTexture(cv);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;};
 return new T.MeshStandardMaterial({map:mk(c),emissiveMap:mk(e),emissive:new T.Color(0xffffff),emissiveIntensity:o.ei||1.15,roughness:.85,envMapIntensity:.12});}
function signPlane(g,txt,w,h,x,y,z,fg='#ffe9b8',bg='#161a4a'){box(g,w+.2,h+.12,.1,M(bg,{r:.6}),x,y-h/2-.06,z-.06,.04,.03);const p=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTex(txt,fg,bg)}),g,x,y,z+.05);p.castShadow=false;return p;}
function brick(o={}){const g=new T.Group(),w=o.w||3,d=o.d||2.6,fl=o.floors||3,sh=o.shop!==false,h=fl*.95+(sh?1.3:0);
 const fo=Object.assign({},o,{shop:sh,floors:fl}),fm=facade(Object.assign({},fo,{cols:Math.max(2,Math.round(w/.95))})),sm=facade(Object.assign({},fo,{cols:Math.max(2,Math.round(d/.95))})),top=M('#2a2f6a',{r:.9});
 const b=new T.Mesh(new T.BoxGeometry(w,h,d),[sm,sm,top,top,fm,fm]);b.position.y=h/2;b.castShadow=b.receiveShadow=true;g.add(b);
 box(g,w+.22,.24,d+.22,M(o.cor||'#2c2a6e',{r:.8}),0,h-.12,0,.04,.03);box(g,w+.06,.34,d+.06,SNOWN,0,h+.08,0,.3,.14);
 if(sh){const aw=box(g,w*.92,.1,.85,M(o.awn||'#c2264a',{r:.7}),0,0,0,.04,.03);aw.position.set(0,1.0,d/2+.36);aw.rotation.x=.38;const as=box(g,w*.94,.14,.55,SNOWN,0,0,0,.1,.06);as.position.set(0,1.14,d/2+.22);as.rotation.x=.38;
  if(o.sign)signPlane(g,o.sign,Math.min(w*.78,3.2),.42,0,1.56,d/2+.06,o.sfg,o.sbg);}
 if(o.tank){[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(p=>cyl(g,.04,.04,.6,M('#2a2f6a'),p[0]-w*.2,h+.3,p[1],6));cyl(g,.5,.5,.8,M('#6a4a3a',{r:.8}),-w*.2,h+.85,0,14);cone(g,.6,.45,SNOWN,-w*.2,h+1.65,0,14);}
 g.rotation.y=o.ry||0;return g;}
function pineN(h=2.4){const g=new T.Group(),k=h/2.4;cyl(g,.12*k,.15*k,.5*k,M('#4a2f1a'),0,0,0,8);for(let i=0;i<3;i++){const r=(.85-.22*i)*k,y=(.35+i*.6)*k;cone(g,r,1.0*k,M('#1c5a50',{r:.9}),0,y,0,14);const sn=cone(g,r*.8,.62*k,SNOWN,0,y+.42*k,0,14);sn.castShadow=false;}return g;}
function lampN(h=2.2,on=true){const g=new T.Group(),dk=M('#1a1c4a',{r:.5});cyl(g,.14,.18,.14,dk,0,0,0);cyl(g,.05,.06,h,dk,0,0,0,10);sph(g,.2,on?M('#ffe9a8',{e:'#ffc45a',ei:1.8}):M('#3a4390',{r:.5}),0,h+.16,0);cone(g,.24,.2,SNOWN,0,h+.3,0,12);if(on)glow(g,'#ffc45a',2.6,0,h+.16,0,.6);return g;}
function bigTree(h=5,lit=true){const g=new T.Group(),k=h/5;cyl(g,.25*k,.32*k,.7*k,M('#5a3418'),0,0,0,10);const gm=M('#157a4a',{r:.7}),gm2=M('#0f5f3a',{r:.8});
 for(let i=0;i<5;i++){const r=(1.8-.3*i)*k,y=(.5+i*.82)*k;cone(g,r,1.45*k,i%2?gm2:gm,0,y,0,22);}
 const rad=y=>Math.max(.1,1.8-(y/k-.5)*.345)*k;for(let j=0;j<48;j++){const y=(.7+rnd()*3.9)*k,a=rnd()*6.283,r=rad(y)*.9,c=COL[CN[j%6]];sph(g,.09*k,M(c,{e:c,ei:lit?1.6:.1,r:.3}),Math.cos(a)*r,y-.1*k,Math.sin(a)*r);if(lit&&j%3===0)glow(g,c,.9*k,Math.cos(a)*r,y-.1*k,Math.sin(a)*r,.55);}
 star(g,.42*k,0,5.35*k,0,0,lit);if(lit)glow(g,'#ffe2a0',5.5*k,0,3*k,.4,.28);return g;}
function garageN(lit){const g=new T.Group();box(g,3.8,2.0,2.8,M('#7a5a9a',{r:.8}),0,0,0,.06,.04);box(g,4.0,.36,3.0,SNOWN,0,1.96,0,.3,.14);
 box(g,2.2,1.45,.1,lit?M('#ffd98a',{e:'#ffb347',ei:1.2}):M('#1a2260'),-.5,0,1.38,.05,.03);box(g,.6,1.2,.1,M('#c2264a'),1.3,0,1.38,.04,.02);signPlane(g,'GARAGE',2.4,.42,-.2,2.62,1.2);if(lit)glow(g,'#ffb347',3.6,-.5,.8,1.9,.45);return g;}
function truck(){const g=new T.Group(),rd=M('#c2264a',{r:.4,env:.8}),bk=M('#1a1838',{r:.6});box(g,1.2,.55,2.6,rd,0,.3,0,.1,.06);box(g,1.14,.6,.95,rd,0,.82,.35,.14,.08);box(g,1.0,.34,.1,M('#bfe6ff',{e:'#ffd98a',ei:.5}),0,.98,.84,.03,.02);
 [[-.6,.85],[.6,.85],[-.6,-.85],[.6,-.85]].forEach(p=>{sph(g,.3,bk,p[0],.3,p[1],.5,1,1);});
 const t=pineN(1.5);t.rotation.x=-1.25;t.position.set(0,1.0,-.1);g.add(t);[-.4,.4].forEach(x=>{sph(g,.1,M('#fff3c0',{e:'#ffe2a0',ei:2}),x,.55,1.3);glow(g,'#ffe2a0',1.6,x,.55,1.45,.6);});box(g,1.1,.12,.9,SNOWN,0,1.4,.35,.2,.05);return g;}
function waterTower(){const g=new T.Group(),st=M('#2a2f6a',{r:.6});[[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]].forEach(p=>cyl(g,.06,.08,3.2,st,p[0],0,p[1],8));torus(g,.99,.04,st,0,1.6,0);
 cyl(g,1.15,1.15,1.4,M('#8fa0e8',{r:.6}),0,3.1,0,28);cone(g,1.3,.7,SNOWN,0,4.5,0,28);const p=mesh(new T.PlaneGeometry(1.7,.42),new T.MeshStandardMaterial({map:textTex('BULBVILLE','#161a4a','#8fa0e8'),roughness:.6}),g,0,3.8,1.16);p.castShadow=false;sph(g,.1,M('#ff5a5a',{e:'#ff2a2a',ei:2}),0,5.25,0);glow(g,'#ff4a4a',1.2,0,5.25,0,.7);return g;}
function church(lit){const g=new T.Group();g.add(house({wall:'#cfd4ff',door:'#5a4ad8',chim:'#8a90d0',poles:false,w:3.4,d:2.2,h:1.7,rise:1.5,dots:['#eef2ff']}));
 box(g,1.15,4.4,1.15,M('#cfd4ff',{r:.7}),-1.95,0,0,.05,.03);const c1=cone(g,1.0,2.0,M('#3b4bb8',{r:.7}),-1.95,4.4,0,4);c1.rotation.y=Math.PI/4;const c2=cone(g,.62,1.0,SNOWN,-1.95,5.45,0,4);c2.rotation.y=Math.PI/4;
 [[0,.6],[.6,0]].forEach(q=>sph(g,.26,M('#ffe2a0',{e:'#ffb347',ei:lit?1.5:.25}),-1.95+q[1],3.4,q[0],q[1]?.2:1,1,q[0]?.2:1));star(g,.3,-1.95,6.7,0,0,lit);return g;}
function gazebo(){const g=new T.Group();cyl(g,1.5,1.6,.3,M('#cfd6ff'),0,0,0,8);for(let i=0;i<8;i++){const a=i/8*6.283;cyl(g,.06,.06,1.5,M('#fff6fb'),Math.cos(a)*1.3,.3,Math.sin(a)*1.3,8);}
 cone(g,1.8,1.0,M('#b83a5a',{r:.7}),0,1.8,0,8);cone(g,1.25,.7,SNOWN,0,2.25,0,8);sph(g,.2,M('#ffe2a0',{e:'#ffb347',ei:1.6}),0,1.5,0);glow(g,'#ffb347',3.4,0,1.2,0,.55);return g;}
function diner(lit){const g=new T.Group();box(g,4.4,1.5,2.4,M('#3fb0b8',{r:.5,env:.6}),0,0,0,.5,.08);box(g,3.9,.6,.1,M('#ffe2a0',{e:'#ffc86a',ei:lit?1.3:.15}),0,.62,1.2,.05,.03);box(g,4.5,.16,2.5,M('#c2264a'),0,1.36,0,.5,.05);box(g,4.3,.3,2.3,SNOWN,0,1.5,0,.5,.12);
 signPlane(g,'DINER',2.2,.5,0,2.1,.5,'#ff8ad0');if(lit){glow(g,'#ff6ad0',2.6,0,2.1,.9,.4);glow(g,'#ffc86a',4,0,.8,1.6,.35);}return g;}

/* ====================== XMAS LIGHTS CITY MAP (night) ====================== */
// V1 isometric diorama tiles, lit like the V4 night town. Every district has "light units"
// that switch on as its levels are cleared, so the city lights up as you play.
const NIGHT_ENV=(()=>{const s=new T.Scene(),c=document.createElement('canvas');c.width=16;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
 g.addColorStop(0,'#8a9cff');g.addColorStop(.45,'#2a3290');g.addColorStop(1,'#0a0c30');x.fillStyle=g;x.fillRect(0,0,16,128);
 s.add(new T.Mesh(new T.SphereGeometry(50,32,16),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),side:T.BackSide})));
 const mm=new T.MeshBasicMaterial();mm.color.setRGB(1.2,1.3,1.8);const b=new T.Mesh(new T.BoxGeometry(16,16,1),mm);b.position.set(-14,24,18);b.lookAt(0,0,0);s.add(b);
 const p=new T.PMREMGenerator(R),e=p.fromScene(s,.04).texture;p.dispose();return e;})();

const SZ=13,TOP=SZ+.55,HALF=TOP/2;
const KZ=[1,-1,1,-1,1],CT=[[0,0]];KZ.forEach(k=>{const p=CT[CT.length-1];CT.push(k>0?[p[0]-.65*SZ,p[1]-(SZ+4.95)]:[p[0]-(SZ+4.95),p[1]-.65*SZ]);});
const S2=Math.SQRT1_2;
// local tile frame: u runs along the path (entry -> exit, up the screen), v to the right of the screen
const UV0=(u,v)=>[(-u+v)*S2,(-u-v)*S2];const DS=1;const UV=(u,v)=>UV0(u*DS,v*DS);

/* ---- light units ---- */
const POOL_GEO=new T.PlaneGeometry(1,1);
function unitOf(D,build,o={}){
 const g=new T.Group();build(g);D.g.add(g);
 const u={g,mats:[],sprites:[],pools:[],k:-1,order:o.order||0,at:o.at};
 const clones=new Map();
 g.traverse(ob=>{
  if(ob.isSprite){u.sprites.push({s:ob,op:ob.material.opacity,sc:ob.scale.x});ob.material=ob.material.clone();return}
  if(!ob.isMesh)return;
  const one=m=>{if(!m||!m.emissive||!(m.emissiveIntensity>0)||(m.emissive.r+m.emissive.g+m.emissive.b)<.01)return m;
   if(clones.has(m))return clones.get(m);const c=m.clone();clones.set(m,c);u.mats.push({m:c,ei:m.emissiveIntensity,col:m.color.clone()});return c};
  ob.material=Array.isArray(ob.material)?ob.material.map(one):one(ob.material);
 });
 (o.pools||[]).forEach(p=>{const m=new T.Mesh(POOL_GEO,new T.MeshBasicMaterial({map:glowTex,color:new T.Color(p[3]||'#ffb860').convertSRGBToLinear(),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.scale.set(p[2]*1.25,p[2]*1.25,1);m.position.set(p[0],.06,p[1]);m.renderOrder=2;D.g.add(m);u.pools.push({m,op:Math.min(1,(p[4]||.5)*1.15)});});
 D.units.push(u);return u;}
function tileGlow(D,f){D.lights.forEach(l=>l.intensity=3.4*f);D.topMat.color.copy(D.topCol).multiplyScalar(.55+.3*f);D.topMat.emissiveIntensity=.16*f;}
function setUnit(u,k){if(u.k===k)return;u.k=k;
 for(const q of u.mats){q.m.emissiveIntensity=q.ei*k;q.m.color.copy(q.col).multiplyScalar(.22+.78*Math.min(1,k));}
 for(const q of u.sprites){q.s.material.opacity=q.op*Math.min(1.4,k);q.s.visible=k>.01;}
 for(const q of u.pools){q.m.material.opacity=q.op*Math.min(1.2,k);q.m.visible=k>.01;}}

/* ---- districts ---- */
function tileBase(D,W){const g=D.g;
 box(g,SZ,1.0,SZ,M(W.low||'#1c1a5a',{r:.85}),0,-2.3,0,.7,.1);box(g,SZ+.2,.95,SZ+.2,M(W.mid||'#3a3a8a',{r:.85}),0,-1.5,0,.75,.1);
 const tm=M(W.top||'#7d88d0',W.topM||{r:.95,env:.2}).clone();D.topMat=tm;D.topCol=tm.color.clone();tm.emissive=new T.Color('#ff9a40').convertSRGBToLinear();tm.emissiveIntensity=0;
 const top=box(g,TOP,.8,TOP,tm,0,-.8,0,1,.22);
 SEED=3+D.i*5;if(!W.topM)for(let k=0;k<10;k++){const e=k%4,t=(rnd()-.5)*(TOP-2);sph(g,.5+rnd()*.5,tm,e===0?HALF-.5:e===1?-HALF+.5:t,-.22,e===2?HALF-.5:e===3?-HALF+.5:t,1,.4,1);}
 // little lit windows in the cliff face, lit with the district
 return top;}
const _bx=new T.Box3();
const put=(D,o,u,v,ry=0,y=0)=>{const [x,z]=UV(u,v);o.position.set(x,y,z);o.rotation.y+=ry;o.updateMatrixWorld(true);_bx.setFromObject(o);const L=SZ/2-.25;
 if(_bx.max.x-_bx.min.x<2*L){if(_bx.max.x>L)o.position.x-=_bx.max.x-L;if(_bx.min.x<-L)o.position.x+=-L-_bx.min.x;}if(_bx.max.z-_bx.min.z<2*L){if(_bx.max.z>L)o.position.z-=_bx.max.z-L;if(_bx.min.z<-L)o.position.z+=-L-_bx.min.z;}
 D.cur.add(o);return o;};
const at=(u,v)=>UV(u,v);
// the house front faces +x in house(); this turns it to face the path/camera
const FACE=Math.PI/4;

function district(i,D){
 const s=i%2?-1:1; // which side the path bulges to; slots below sit on the free side
 const U=(build,o)=>unitOf(D,g=>{D.cur=g;build(g);D.cur=D.g;},o);
 D.cur=D.g;SEED=40+i*11;
 const P2=(u,v)=>UV(u,v*s);
 const pl=(o,u,v,ry=0,y=0)=>put(D,o,u,v*s,ry,y);
 const pool=(u,v,r,c,op)=>[...P2(u,v),r,c||'#ffb347',op||.5];
 const lampAt=(u,v,h=2.2)=>U(()=>{pl(lampN(h,true),u,v);},{pools:[pool(u,v,5.5,'#ffb860',.55)]});
 const pines=list=>list.forEach(q=>pl(pineN(q[2]),q[0],q[1]));
 const P=(u,v,y)=>{const [x,z]=P2(u,v);return [x,y,z]};
 const strandU=(a,b,sag,n)=>U(g=>strand(g,a,b,sag,n,.17),{pools:[[(a[0]+b[0])/2,(a[2]+b[2])/2,4,'#ff8ad0',.3]]});
 // Slots (u along the path, v across). Tall things only go where they cannot hide a level button:
 // B, C, Dd sit behind or beside the path. A is in front of it, so it only gets low props.
 const A=[-3.9,-3.6],B=[.3,5.7],C=[4.2,-3.4],Dd=[-1.2,-6.6],E=[-3.9,4.3],F=[3.9,4.3],L1=[-2.7,6.4],L2=[2.9,6.2];
 const homeAt=(q,o,pc)=>U(()=>{pl(house(Object.assign({poles:false},o)),q[0],q[1],0);},{pools:[pool(q[0]-1.3,q[1],6.5,pc||'#ffb347',.6)]});
 const shopAt=(q,o)=>U(()=>{pl(brick(o),q[0],q[1],0);},{pools:[pool(q[0]-1.4,q[1],6.5,'#ffc86a',.6)]});
 if(i===0){ // The Front Yard: houses on Hollyberry Lane
  pines([[2.4,-7,2.0],[0,8.6,2.0]]);
  lampAt(...E);
  homeAt(Dd,{wall:'#e8364f',poles:true});
  U(()=>{pl(snowTree(2.2,{c:'#eef2ff'}),-4.3,-3.9);pl(snowman(.8),-3,-3.2,.7);},{pools:[pool(-4,-3.6,4.4,'#ffd27a',.5)]});
  lampAt(...L1);
  homeAt(B,{w:2.6,d:2.2,h:1.3,rise:1.1,wall:'#47b8e8',door:'#7a3ab8',chim:'#7a3ab8'});
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,7);
  U(g=>{pl(gift(.6,.55,.6,'#3a8dff','#ff5cc8'),-5.2,-2,.3);pl(gift(.45,.4,.45,'#2fd46a','#e3192e'),-4.6,-1.6,-.4);const [x,z]=P2(-4.9,-1.8);glow(g,'#ff6ad0',2.4,x,.6,z,.5);},{});
  lampAt(...F);
  homeAt(C,{w:2.6,d:2.2,h:1.3,rise:1.1,wall:'#ffc94a',door:'#c2264a',chim:'#c2264a'});
  strandU(P(F[0],F[1],2.4),P(L2[0],L2[1]+.6,2.4),.5,6);
 }
 if(i===1){ // The Big Window: Main Street shops
  pines([[2.6,-7,2.0],[0,8.6,2.0]]);
  lampAt(...E);
  U(()=>{const d=diner(true);d.scale.setScalar(.72);pl(d,...A,0);},{pools:[pool(A[0]-1,A[1],6,'#ff6ad0',.5)]});
  shopAt(Dd,{w:3,d:2.4,floors:2,wall:'#8a3a3a',sign:'TOYS',awn:'#1f8a5a',lit:.9});
  lampAt(...L1);
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,8);
  shopAt(B,{w:3,d:2.4,floors:2,wall:'#9a5a3a',sign:'BOOKS',awn:'#3a8dff',lit:.85});
  lampAt(...F);
  shopAt(C,{w:3,d:2.4,floors:3,wall:'#6a4a8a',sign:'BAKERY',awn:'#ffb21a',lit:.9,tank:true});
  strandU(P(F[0],F[1],2.4),P(1.9,4.4,3.2),.5,6);
 }
 if(i===2){ // Rudy's Big Night: the town square
  {const [x,z]=P2(...B);cyl(D.g,2.5,2.7,.2,M('#aab4ea',{r:.9}),x,0,z,36);}
  pines([[2.6,-7,2.0]]);
  lampAt(...E);
  U(()=>{pl(deer({s:.95}),...A,FACE);pl(gift(.5,.45,.5,'#ff5cc8'),-5,-2.4,.4);},{pools:[pool(A[0],A[1],4,'#ff5060',.6)]});
  U(()=>{const g=gazebo();g.scale.setScalar(.9);pl(g,...Dd);},{pools:[pool(Dd[0],Dd[1],5.5,'#ffb347',.6)]});
  lampAt(...L1);
  U(()=>{const c=brick({w:3.4,d:2.4,floors:2,wall:'#7a3a5a',shop:true,lit:.85});box(c,3,.7,1.0,M('#161a4a'),0,1.95,1.5,.06,.04);signPlane(c,"RUDY'S BIG NIGHT",2.8,.44,0,2.3,2.02,'#fff3d0','#c2264a');for(let k=0;k<7;k++)sph(c,.06,M('#fff3c0',{e:'#ffe2a0',ei:2.2}),-1.3+k*.43,1.98,2.03);glow(c,'#ffc86a',4,0,2.2,2.4,.4);pl(c,...C,0);},{pools:[pool(C[0]-1.6,C[1],6.5,'#ffc86a',.6)]});
  lampAt(...F);
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,7);
  U(()=>{pl(bigTree(4.2,true),...B,0,.2);},{pools:[pool(B[0],B[1],8,'#ffd27a',.6)]});
 }
 if(i===3){ // The Attic: tall old houses with lit attic windows, a workshop
  pines([[2.6,-7,2.0],[0,8.6,2.0]]);
  lampAt(...E);
  U(()=>{const t=truck();t.scale.setScalar(.85);pl(t,...A,.9);pl(spool(.7),-5.2,-2.2);},{pools:[pool(A[0],A[1],4,'#ffe2a0',.5)]});
  homeAt(Dd,{w:2.6,d:2.2,h:2.2,rise:1.6,wall:'#6b5bd6',door:'#ffd23a',chim:'#3d3577'});
  lampAt(...L1);
  U(()=>{const g=garageN(true);g.scale.setScalar(.8);pl(g,...B,0);},{pools:[pool(B[0]-1.4,B[1],6,'#ffb347',.6)]});
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,7);
  lampAt(...F);
  homeAt(C,{w:2.6,d:2.2,h:2.4,rise:1.7,wall:'#3fb0b8',door:'#c2264a',chim:'#1f5a4a'});
  strandU(P(F[0],F[1],2.4),P(1.8,4.6,2.4),.5,6);
 }
 if(i===4){ // The Frozen Pond
  {const [x,z]=P2(...B);const p=cyl(D.g,2.3,2.3,.06,M('#8fc8ff',{clear:1,r:.05,env:1.6,e:'#3a78e8',ei:.15}),x,.02,z,44);p.castShadow=false;torus(D.g,2.3,.18,SNOWN,x,.04,z);}
  pines([[2.6,-7,2.0]]);
  lampAt(...E);
  U(g=>{pl(igloo(),...A,0);const [x,z]=P2(...A);glow(g,'#ffb347',2.6,x+1.1,.5,z+1.1,.7);},{pools:[pool(A[0]-1,A[1],5.5,'#ffb347',.5)]});
  U(()=>{pl(bulb('pink',{s:.8,face:'joy',ry:FACE}),...B,0,.06);},{pools:[pool(B[0],B[1],5.4,'#ff6ad0',.5)]});
  homeAt(Dd,{w:2.4,d:2.1,h:1.2,rise:1.05,wall:'#3a6ac8',door:'#ffd23a',chim:'#1c2a7a'});
  lampAt(...L1);
  U(g=>{const [x,z]=P2(...B);for(let k=0;k<12;k++){const a=k/12*6.283;const b=miniBulb(g,CN[k%6],.2,x+Math.cos(a)*2.6,.5,z+Math.sin(a)*2.6);b.rotation.x=Math.PI;}},{pools:[pool(B[0],B[1],7,'#9fe6ff',.4)]});
  lampAt(...F);
  U(()=>{pl(crystals(5,1),...C);pl(iceBlock('blue'),2.6,-4.6,.5);pl(iceBlock('orange'),5.2,-1.9,.9);},{pools:[pool(C[0],C[1],5.5,'#58ccff',.6)]});
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,7);
 }
 if(i===5){ // The Midnight Switch-On: the church, the clock shop and the big star
  pines([[2.6,-7,2.0],[0,8.6,2.0]]);
  lampAt(...E);
  U(g=>{pl(snowman(.85),-4.4,-3.8,.6);pl(gift(.6,.55,.6,'#ff3048'),-3.2,-3.2,.3);pl(gift(.45,.4,.45,'#2fd46a','#e3192e'),-5,-2.2,-.4);const [x,z]=P2(-4,-3.2);glow(g,'#ff6ad0',2.6,x,.6,z,.5);},{pools:[pool(-4,-3.2,4,'#ff8ad0',.4)]});
  U(()=>{const c=church(true);c.scale.setScalar(.78);pl(c,...Dd,0);},{pools:[pool(Dd[0]-1.4,Dd[1],6.5,'#ffb347',.6)]});
  lampAt(...L1);
  shopAt(B,{w:2.8,d:2.4,floors:3,wall:'#4a5a9a',sign:'CLOCKS',awn:'#c2264a',lit:.9});
  strandU(P(E[0],E[1],2.4),P(L1[0],L1[1],2.4),.5,8);
  lampAt(...F);
  U(g=>{const [x,z]=P2(...C);cyl(g,1.0,1.15,.3,M('#c9d0f4',{r:.9}),x,0,z,28);cyl(g,.7,.8,.5,M('#e9a23a',{m:.9,r:.3,env:1.4}),x,.28,z,28);star(g,1.1,x,2.1,z,FACE,true);glow(g,'#ffd98a',8,x,2.1,z,.6);},{pools:[pool(C[0],C[1],9,'#ffd98a',.65)]});
 }
}

const WORLDS=[
 {},{},{},{},
 {top:'#8fb8f0',topM:{clear:1,r:.12,env:1.2},mid:'#4a7ac8',low:'#1c2a7a'},
 {top:'#7d88d0',mid:'#2a2f7e',low:'#141a52'},
];

/* ---- scene ---- */
let scene,cam,camW=22,view={w:360,h:640},tiles=[],NODES=[],pan=0,panMin=0,panMax=0,dirty=true,el=null,opts=null,raf=0,anim=[];
function build(){
 scene=new T.Scene();scene.environment=NIGHT_ENV;
 scene.add(new T.HemisphereLight('#7f90ff','#1a1450',.16));
 const moon=new T.DirectionalLight('#b4c8ff',.34);moon.position.set(-24-30,60,-28-10);moon.target.position.set(-24,0,-28);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);
 Object.assign(moon.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:1,far:200});moon.shadow.bias=-.0006;moon.shadow.normalBias=.05;moon.shadow.radius=3;scene.add(moon,moon.target);
 const rim=new T.DirectionalLight('#6a7cff',.25);rim.position.set(30,10,30);scene.add(rim);
 tiles=[];NODES=[];
 for(let i=0;i<6;i++){
  const g=new T.Group();g.position.set(CT[i][0],0,CT[i][1]);scene.add(g);
  const D={i,g,units:[],cur:g};tileBase(D,WORLDS[i]);district(i,D);
  // path through the tile: entry and exit sit where the bridges land
  const a1=.325*SZ,a2=SZ/2;const E=(i===0||KZ[i-1]>0)?[a1,a2]:[a2,a1],X=i===5?[-1.4,-1.4]:(KZ[i]>0?[-a1,-a2]:[-a2,-a1]);
  const toUV=p=>[-(p[0]+p[1])*S2,(p[0]-p[1])*S2];const e=toUV(E),x=toUV(X);
  const sw=i%2?-2.3:2.3,pts=[[e[0],e[1]],[-3.9,sw],[0,-sw],[3.9,sw],[x[0],x[1]]].map(q=>{const [a,b]=UV0(q[0],q[1]);return new T.Vector3(a,0,b)});
  const curve=new T.CatmullRomCurve3(pts);
  const np=[];for(let j=0;j<10;j++)np.push(curve.getPointAt(.04+j*.92/9));
  for(let s=0;s<=70;s++){const p=curve.getPointAt(s/70);if(np.some(n=>n.distanceTo(p)<.75))continue;const st=cyl(g,.16+rnd()*.05,.18,.06,M('#ffd98a',{r:.8,e:'#ffb347',ei:.0}),p.x+(rnd()-.5)*.2,.0,p.z+(rnd()-.5)*.2,8);st.castShadow=false;}
  np.forEach((p,j)=>{const idx=i*10+j;
   cyl(g,.66,.7,.12,M('#e8ecff',{r:.6}),p.x,0,p.z,28).castShadow=false;
   const pad=cyl(g,.54,.58,.26,M('#3a4390',{r:.5}),p.x,.08,p.z,28);pad.castShadow=false;
   const halo=glow(g,'#ffb347',2.6,p.x,.45,p.z,.0);
   let gf=null;if(j===9){gf=gift(.6,.55,.6,'#4a55b0','#8a94e0');gf.position.set(p.x,.34,p.z);gf.rotation.y=.5;g.add(gf);}
   NODES.push({idx,tile:i,j,pad,halo,gf,pos:new T.Vector3(p.x+CT[i][0],.34,p.z+CT[i][1])});});
  if(i<5){const z=KZ[i]>0,L=SZ/2+.05;for(let b=0;b<10;b++){const o=L-.1+b*.515,y=-.12+Math.sin(b/8*Math.PI)*.16;box(g,z?1.5:.4,.14,z?.4:1.5,M(b%2?'#8a7ab8':'#6a5aa0',{r:.8}),z?-.325*SZ:-o,y,z?-o:-.325*SZ,.05,.03);}
   [[.75,L],[-.75,L],[.75,L+4.85],[-.75,L+4.85]].forEach(q=>{const l=lampN(1.2,true);l.position.set(z?-.325*SZ+q[0]:-q[1],-.1,z?-q[1]:-.325*SZ+q[0]);g.add(l);});}
  D.lights=[[-2.5,0],[2.5,0]].map(q=>{const [x,z]=UV(q[0],q[1]);const pl=new T.PointLight('#ffa850',0,13,1.6);pl.position.set(x,2.4,z);g.add(pl);return pl;});
  D.units.forEach((u,k)=>setUnit(u,0));
  tiles.push(D);
 }
 scene.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.castShadow=o.castShadow!==false;o.receiveShadow=true;}});
}
const MAT={done:M('#ffc21a',{clear:1,r:.3,env:.5,e:'#ffa000',ei:.7}),cur:M('#ff4fa8',{clear:1,r:.25,e:'#ff3aa8',ei:.9}),open:M('#8fa0ff',{r:.5,e:'#4a5aff',ei:.25}),lock:M('#2a3070',{r:.6})};
function camFor(){const aspect=view.w/view.h,h=camW/aspect;if(!cam)cam=new T.OrthographicCamera(-camW/2,camW/2,h/2,-h/2,.1,500);
 cam.left=-camW/2;cam.right=camW/2;cam.top=h/2;cam.bottom=-h/2;
 const c=new T.Vector3((CT[0][0]+CT[5][0])/2,0,(CT[0][1]+CT[5][1])/2);cam.position.set(c.x+90,90,c.z+90);cam.up.set(0,1,0);cam.lookAt(c);cam.updateMatrixWorld();
 // pan along the screen's up direction
 const up=new T.Vector3(0,1,0).applyQuaternion(cam.quaternion);cam.position.addScaledVector(up,pan);cam.updateMatrixWorld();cam.updateProjectionMatrix();}
function screenOf(v){const p=v.clone().project(cam);return [(p.x+1)/2*view.w,(1-p.y)/2*view.h];}
function panLimits(){pan=0;camFor();const ys=[];const up=view.h/camW*1; // px per world unit vertically on screen
 for(const n of NODES)ys.push(screenOf(n.pos)[1]);const top=Math.min(...ys),bot=Math.max(...ys);
 const ppu=view.w/camW;panMin=-(bot-view.h*.72)/ppu;panMax=(view.h*.28-top)/ppu+3;if(panMax<panMin)panMax=panMin;}
function centerOn(idx){const n=NODES[idx];if(!n)return;const save=pan;pan=0;camFor();const y=screenOf(n.pos)[1];pan=(y-view.h*.56)/(view.w/camW)*-1;pan=Math.max(panMin,Math.min(panMax,pan));camFor();dirty=true;}

/* ---- state from the game ---- */
function litUnits(tile,cleared){const n=tiles[tile].units.length;return cleared>=10?n:Math.round(n*cleared/10);}
function clearedIn(tile){let c=0;for(let j=0;j<10;j++)if((opts.stars(tile*10+j)||0)>0)c++;return c;}
function applyProgress(skip){
 tiles.forEach((D,i)=>{const n=litUnits(i,clearedIn(i));tileGlow(D,n/Math.max(1,D.units.length));D.units.forEach((u,k)=>{if(skip&&skip.tile===i&&k>=skip.from&&k<skip.to)setUnit(u,0);else setUnit(u,k<n?1:0)});});
 NODES.forEach(n=>{const s=opts.stars(n.idx)||0,open=opts.unlocked(n.idx),cur=n.idx===opts.current;
  n.pad.material=cur?MAT.cur:s?MAT.done:open?MAT.open:MAT.lock;n.halo.material.opacity=cur?.55:s?.32:0;n.halo.material.color.set(cur?'#ff6ad0':'#ffb347').convertSRGBToLinear();
  if(n.gf)n.gf.traverse(o=>{});});
 dirty=true;}
function cityPct(){let lit=0,all=0;tiles.forEach((D,i)=>{all+=D.units.length;lit+=litUnits(i,clearedIn(i));});return Math.round(100*lit/Math.max(1,all));}

/* ---- DOM ---- */
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
let labels=[],banners=[];
function makeDom(){
 el.innerHTML='<div class="xc-sky"></div><div class="xc-glow"></div><canvas class="xc-cv"></canvas><canvas class="xc-snow"></canvas><div class="xc-labels"></div>';
 const L=el.querySelector('.xc-labels');labels=NODES.map(n=>{const d=document.createElement('div');d.className='xc-n';L.appendChild(d);return d});
 banners=tiles.map((D,i)=>{const d=document.createElement('div');d.className='xc-b';L.appendChild(d);return d});
 const cv=el.querySelector('.xc-cv');return cv;}
function layoutDom(){
 const ppu=view.w/camW;
 NODES.forEach((n,k)=>{const [x,y]=screenOf(n.pos);const d=labels[k];const vis=y>-40&&y<view.h+40;d.style.display=vis?'':'none';if(!vis)return;
  d.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;});
 tiles.forEach((D,i)=>{const right=i%2===1;const c=new T.Vector3(CT[i][0],0,CT[i][1]);const [x,y]=screenOf(c);const d=banners[i];
  d.style.transform=`translate(${(right?view.w*.97:view.w*.03).toFixed(0)}px,${(y-ppu*6.4).toFixed(1)}px) translateX(${right?'-100%':'0'})`;});}
function fillDom(){
 NODES.forEach((n,k)=>{const s=opts.stars(n.idx)||0,open=opts.unlocked(n.idx),cur=n.idx===opts.current,d=labels[k];
  d.className='xc-n'+(cur?' cur':s?' done':open?' open':' lock')+(n.j===9?' boss':'');
  d.innerHTML=(s?`<i class="st">${'<b>★</b>'.repeat(s)}${'<b class="o">★</b>'.repeat(3-s)}</i>`:'')+`<span>${open?n.idx+1:''}</span>`+(cur?'<canvas class="xc-mk"></canvas>':'');});
 tiles.forEach((D,i)=>{const c=clearedIn(i),name=(opts.chapters[i]&&opts.chapters[i].name)||('District '+(i+1));
  banners[i].className='xc-b'+(c>=10?' lit':'');banners[i].innerHTML=`<small>DISTRICT ${i+1} &middot; ${c>=10?'LIT UP':c+'/10'}</small>${esc(name)}`;});
 const mk=el.querySelector('.xc-mk');if(mk&&opts.drawMarker)opts.drawMarker(mk);}

/* ---- falling snow: soft flakes at three depths, drifting on a slow wind ---- */
let flakes=null,snowCv=null,snowT=0,flakeImg=null;
function snowInit(){snowCv=el.querySelector('.xc-snow');if(!snowCv)return;const d=Math.min(2,window.devicePixelRatio||1);snowCv.width=view.w*d;snowCv.height=view.h*d;
 if(!flakeImg){flakeImg=document.createElement('canvas');flakeImg.width=flakeImg.height=32;const x=flakeImg.getContext('2d'),g=x.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(240,245,255,.75)');g.addColorStop(1,'rgba(220,230,255,0)');x.fillStyle=g;x.fillRect(0,0,32,32);}
 const n=Math.round(Math.min(170,Math.max(70,view.w*view.h/5200)));flakes=[];for(let i=0;i<n;i++){const z=Math.random();flakes.push({x:Math.random(),y:Math.random(),z,r:1.2+z*z*4.2,v:.035+z*.085,ph:Math.random()*6.28,sw:.6+Math.random()*1.2});}}
function snowDraw(t){if(!snowCv||!flakes)return;const dt=Math.min(.05,(t-snowT)/1000||0);snowT=t;const x=snowCv.getContext('2d'),W=snowCv.width,H=snowCv.height,d=W/view.w;x.clearRect(0,0,W,H);
 const wind=.012*Math.sin(t/5200)+.008;
 for(const f of flakes){f.y+=f.v*dt;f.x+=(wind*(.4+f.z)+Math.sin(t/1000*f.sw+f.ph)*.006*(.3+f.z))*dt*2.2;if(f.y>1.03){f.y=-.03;f.x=Math.random()}if(f.x>1.03)f.x=-.03;if(f.x<-.03)f.x=1.03;
  const r=f.r*d*(f.z>.85?1.5:1);x.globalAlpha=f.z>.85?.38:.3+f.z*.6;x.drawImage(flakeImg,f.x*W-r,f.y*H-r,r*2,r*2);}
 x.globalAlpha=1;}
/* ---- render loop (on demand) ---- */
let pr=1;
function resize(){const r=el.getBoundingClientRect();if(r.width<10)return;view.w=Math.max(200,r.width);view.h=Math.max(300,r.height);camW=Math.max(21,Math.min(34,24.5*Math.max(1,view.w/view.h/.62)));
 pr=Math.min(2,window.devicePixelRatio||1);R.setPixelRatio(pr);R.setSize(view.w,view.h,false);const keep=pan;panLimits();pan=Math.max(panMin,Math.min(panMax,keep));camFor();dirty=true;snowInit();}
function frame(t){raf=requestAnimationFrame(frame);snowDraw(t);
 if(vel&&!drag){pan+=vel;vel*=.92;if(Math.abs(vel)<.002)vel=0;if(pan<panMin){pan=panMin;vel=0}if(pan>panMax){pan=panMax;vel=0}camFor();dirty=true;}
 if(anim.length){const now=performance.now();anim=anim.filter(a=>a(now)!==false);dirty=true;}
 if(!dirty)return;dirty=false;R.render(scene,cam);layoutDom();}

/* ---- input ---- */
let drag=null,vel=0;
function bindInput(cv){
 const host=el;
 host.onpointerdown=e=>{if(e.target.closest('.xc-ui'))return;drag={y:e.clientY,x:e.clientX,p:pan,t:performance.now(),moved:0,ly:e.clientY,lt:performance.now()};vel=0;};
 host.onpointermove=e=>{if(!drag)return;const dy=e.clientY-drag.y;drag.moved=Math.max(drag.moved,Math.abs(dy)+Math.abs(e.clientX-drag.x));const ppu=view.w/camW;
  pan=Math.max(panMin-1,Math.min(panMax+1,drag.p+dy/ppu));const now=performance.now();vel=(e.clientY-drag.ly)/ppu*Math.min(1,16/Math.max(1,now-drag.lt));drag.ly=e.clientY;drag.lt=now;camFor();dirty=true;};
 host.onpointerup=host.onpointercancel=e=>{if(!drag)return;const d=drag;drag=null;pan=Math.max(panMin,Math.min(panMax,pan));camFor();dirty=true;
  if(d.moved<10){vel=0;const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,bd=34;
   NODES.forEach(n=>{const [nx,ny]=screenOf(n.pos);const dd=Math.hypot(nx-x,(ny-y)*1.2);if(dd<bd){bd=dd;best=n}});
   if(best&&opts.onPick)opts.onPick(best.idx);}};
 host.onwheel=e=>{e.preventDefault();pan=Math.max(panMin,Math.min(panMax,pan-e.deltaY/(view.w/camW)));camFor();dirty=true;};
}

/* ---- the light-up moment ---- */
function flickerCurve(p){ // Stranger Things style: stutters, then holds on
 if(p<.12)return p/.12*.9;if(p<.2)return .15;if(p<.3)return 1;if(p<.36)return .3;if(p<.5)return 1.25;return 1+(.25*(1-(p-.5)/.5));}
function celebrate(tile,from,to,done){
 const D=tiles[tile];let k=from;const play=()=>{if(k>=to){if(done)done();return}const u=D.units[k++];const t0=performance.now();
  if(opts.sfx)opts.sfx('lightOn',k-from);
  anim.push(now=>{const p=(now-t0)/700;if(p>=1){setUnit(u,1);const on=D.units.filter(q=>q.k>=1).length;tileGlow(D,on/D.units.length);return false}setUnit(u,flickerCurve(p));});setTimeout(play,420);};
 play();}
function districtLit(tile){const D=tiles[tile];const t0=performance.now();if(opts.sfx)opts.sfx('districtLit',tile);
 const b=banners[tile];b.classList.add('lit','pop');
 const msg=document.createElement('div');msg.className='xc-callout';msg.innerHTML=`<small>DISTRICT ${tile+1}</small>${esc((opts.chapters[tile]||{}).name||'')}<b>is lit!</b>`;el.appendChild(msg);setTimeout(()=>msg.remove(),2600);
 anim.push(now=>{const p=(now-t0)/1600;if(p>=1){D.units.forEach(u=>setUnit(u,1));return false}D.units.forEach((u,k)=>setUnit(u,1+.6*Math.max(0,Math.sin(p*Math.PI*3+k*.7))*(1-p)));});}

/* ---- public ---- */
let ready=false,cvEl=null,want=null;
function show(container,o){
 opts=o;if(!ready){build();ready=true;}
 if(el!==container||!cvEl||!cvEl.isConnected){el=container;cvEl=makeDom();cvEl.replaceWith(R.domElement);R.domElement.className='xc-cv';cvEl=R.domElement;bindInput(cvEl);}
 el.style.setProperty('--lit',(cityPct()/100).toFixed(2));
 resize();
 if(!el._ro&&window.ResizeObserver){el._ro=new ResizeObserver(()=>{const r=el.getBoundingClientRect();if(r.width>0&&(Math.abs(r.width-view.w)>1||Math.abs(r.height-view.h)>1)){resize();if(want!=null)centerOn(want);}});el._ro.observe(el);}
 const jw=o.justWon;let anim0=null;
 if(jw!=null&&jw>=0){const tile=Math.floor(jw/10),c=clearedIn(tile),before=litUnits(tile,o.wasNew?c-1:c),after=litUnits(tile,c);
  if(o.wasNew&&after>before)anim0={tile,from:before,to:after,complete:c>=10};}
 applyProgress(anim0?{tile:anim0.tile,from:anim0.from,to:anim0.to}:null);fillDom();
 want=jw!=null&&jw>=0?jw:o.current;centerOn(want);requestAnimationFrame(()=>{resize();centerOn(want);});
 if(!raf)raf=requestAnimationFrame(frame);
 if(anim0)setTimeout(()=>celebrate(anim0.tile,anim0.from,anim0.to,()=>{if(anim0.complete)districtLit(anim0.tile);el.style.setProperty('--lit',(cityPct()/100).toFixed(2));if(o.onLit)o.onLit()}),650);
 return {pct:cityPct()};}
function hide(){if(raf)cancelAnimationFrame(raf);raf=0;}
window.XLCity={show,hide,pct:()=>ready?cityPct():0,ok:true};
})();
