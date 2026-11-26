/* =====================================================================
   XMAS LIGHTS  ·  fx.js  (team 2: motion)
   The "rush": points pop where you scored, burst into glints that arc
   into the Glow Jar, every landing ticks the counter up with a rising
   bell, the jar gulps, the star meter fills. Plus callouts, encore,
   stars slam, confetti, count-ups, screen shake.

   Works over any board (canvas or DOM). Coordinates are CLIENT px
   (use canvas.getBoundingClientRect() to convert board coords).

   NLFX.init({ pot: el, score: el, meter: el?, stars:[score2,score3]? , sfx: NLSfx? })
   NLFX.score(clientX, clientY, points, {label, tint, big})  -> Promise
   NLFX.callout('MERRY MATCH!', {tier:1..6, sub:'x3'})
   NLFX.encore(fromEls|points[], perCord, targets[[x,y]])
   NLFX.stars(cardEl, n)  // fills .nl-star elements one by one
   NLFX.countUp(el, from, to, ms)
   NLFX.confetti(x, y, n)
   NLFX.shake(el, px)
   NLFX.welcomeGift({title,line,rewards,taps,onClaim})  // v4.2 welcome-back Santa present
   NLFX.guide(title, {sub, tone, icon, target, action, place, ms})  // v4 big guide messages
   ===================================================================== */
(function(){
'use strict';
const F = {};
let cv, cx, W, H, DPR, parts=[], running=false, S=null;
const st = { pot:null, score:null, meter:null, value:0, shown:0, thresholds:[1000,2000,3000], max:3000 };
const GOLD=['#fff7c2','#ffe066','#ffc23d','#ffb01f'];
const PAL=['#ff4b55','#ffc23d','#4fd873','#55a6ff','#ff6fcf','#ff923a'];

function ensure(){
  if(cv) return;
  cv=document.createElement('canvas'); cv.className='nl-fx-canvas';
  Object.assign(cv.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:9000});
  document.body.appendChild(cv); cx=cv.getContext('2d'); resize(); addEventListener('resize',resize);
}
function resize(){ DPR=Math.min(2,devicePixelRatio||1); W=innerWidth; H=innerHeight; cv.width=W*DPR; cv.height=H*DPR; cx.setTransform(DPR,0,0,DPR,0,0); }
function loop(){
  if(!running) return;
  cx.clearRect(0,0,W,H);
  const t=performance.now();
  cx.globalCompositeOperation='lighter';
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; if(p.update(t)===false){parts.splice(i,1); continue;} p.draw(cx,t); }
  cx.globalCompositeOperation='source-over';
  if(parts.length) requestAnimationFrame(loop); else { running=false; cx.clearRect(0,0,W,H); }
}
function add(p){ parts.push(p); if(!running){running=true; requestAnimationFrame(loop);} }
const rnd=(a,b)=>a+Math.random()*(b-a);
const ease={ outBack:(t,s=1.7)=>1+(s+1)*Math.pow(t-1,3)+s*Math.pow(t-1,2), outCubic:t=>1-Math.pow(1-t,3), inOutCubic:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, inQuad:t=>t*t };

function starPath(c,r,inner=.38,n=4){ c.beginPath(); for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2, rr=i%2?r*inner:r; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);} c.closePath(); }
/* perf v4.4: one pre-drawn glow sprite per colour, stamped with drawImage. Building a new radial gradient for
   every dot on every frame (hundreds per frame while coins fly) made phones stutter at each win. */
const GLOWS=new Map();
function glowSprite(col){ let s=GLOWS.get(col); if(s) return s; s=document.createElement('canvas'); s.width=s.height=64; const g2=s.getContext('2d');
  const g=g2.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,col.replace('A',1)); g.addColorStop(1,col.replace('A',0)); g2.fillStyle=g; g2.fillRect(0,0,64,64); GLOWS.set(col,s); return s; }
function glowDot(c,x,y,r,col,a){ if(r<=0||a<=0) return; const ga=c.globalAlpha; c.globalAlpha=ga*Math.min(1,a); c.drawImage(glowSprite(col),x-r,y-r,r*2,r*2); c.globalAlpha=ga; }

/* ---- glint: flies along a bezier into the pot ---------------- */
function Glint(x0,y0,x1,y1,delay,dur,onLand,tint){
  const t0=performance.now()+delay, mx=(x0+x1)/2+rnd(-160,160), my=Math.min(y0,y1)-rnd(60,220);
  const burstA=rnd(0,6.283), burstD=rnd(30,70);
  const bx=x0+Math.cos(burstA)*burstD, by=y0+Math.sin(burstA)*burstD;
  const trail=[]; let landed=false; const size=rnd(7,11); const col=tint||GOLD[(Math.random()*4)|0];
  return {
    update(t){ const k=(t-t0)/dur; if(k<0) return true; if(k>=1){ if(!landed){landed=true; onLand&&onLand();} return false; } return true; },
    draw(c,t){
      const k=(t-t0)/dur; if(k<0) return;
      let x,y;
      if(k<.18){ const q=ease.outCubic(k/.18); x=x0+(bx-x0)*q; y=y0+(by-y0)*q; }               // burst outwards
      else { const q=ease.inOutCubic((k-.18)/.82), u=1-q; x=u*u*bx+2*u*q*mx+q*q*x1; y=u*u*by+2*u*q*my+q*q*y1; } // arc to pot
      trail.push([x,y]); if(trail.length>9) trail.shift();
      for(let i=0;i<trail.length;i++){ const a=i/trail.length; glowDot(c,trail[i][0],trail[i][1],size*1.2*a,'rgba(255,200,80,A)',.35*a); }
      glowDot(c,x,y,size*2.6,'rgba(255,214,110,A)',.65);
      c.save(); c.translate(x,y); c.rotate(t/120); c.fillStyle='#fff'; starPath(c,size,.3,4); c.fill();
      c.fillStyle=col; starPath(c,size*.55,.4,4); c.fill(); c.restore();
    }
  };
}
/* ---- spark burst (landing, stars, unwrap) -------------------- */
function Spark(x,y,vx,vy,life,col,size,grav=400){
  const t0=performance.now();
  return { update(t){ return (t-t0)<life; },
    draw(c,t){ const a=(t-t0)/life, dt=(t-t0)/1000; const px=x+vx*dt, py=y+vy*dt+grav*dt*dt*.5;
      glowDot(c,px,py,size*2.2*(1-a),col,.7*(1-a)); c.fillStyle=`rgba(255,255,255,${1-a})`; c.beginPath(); c.arc(px,py,size*.5*(1-a),0,6.283); c.fill(); } };
}
function burst(x,y,n=14,col='rgba(255,210,90,A)',spd=320,size=6){ for(let i=0;i<n;i++){ const a=rnd(0,6.283), v=rnd(spd*.4,spd); add(Spark(x,y,Math.cos(a)*v,Math.sin(a)*v,rnd(380,700),col,rnd(size*.6,size*1.3))); } }
F.burst=burst;
/* ---- confetti (paper, drawn normal blend) -------------------- */
function Confetti(x,y){
  const t0=performance.now(), a=rnd(-2.6,-.5), v=rnd(350,800), col=PAL[(Math.random()*6)|0], w=rnd(6,11), h=rnd(10,16), spin=rnd(-12,12), life=rnd(1600,2600), drift=rnd(-40,40);
  return { update(t){return t-t0<life}, draw(c,t){ const dt=(t-t0)/1000, k=(t-t0)/life;
    const px=x+Math.cos(a)*v*dt*Math.exp(-dt*1.4)+drift*dt+Math.sin(dt*6+w)*12, py=y+Math.sin(a)*v*dt*Math.exp(-dt*1.4)+180*dt*dt;
    c.save(); c.globalCompositeOperation='source-over'; c.globalAlpha=k>.8?(1-k)/.2:1; c.translate(px,py); c.rotate(dt*spin); c.scale(1,Math.cos(dt*spin*1.3));
    c.fillStyle=col; c.fillRect(-w/2,-h/2,w,h); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(-w/2,-h/2,w,h*.3); c.restore(); } };
}
F.confetti=(x,y,n=60)=>{ ensure(); for(let i=0;i<n;i++) add(Confetti(x,y)); };

/* ---- DOM text pop ------------------------------------------- */
function el(tag,cls,html){ const e=document.createElement(tag); e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function layer(){ let L=document.querySelector('.nl-fx-layer'); if(!L){ L=el('div','nl-fx-layer'); document.body.appendChild(L);} return L; }

F.init=(o={})=>{ ensure(); Object.assign(st,{pot:o.pot||st.pot,score:o.score||st.score,meter:o.meter||st.meter}); if(o.thresholds){st.thresholds=o.thresholds; st.max=o.thresholds[2];} st.pos=o.positions||null; S=o.sfx||window.NLSfx||null; st.value=st.shown=o.start||0; render(); };
F.reset=(v=0)=>{ st.value=st.shown=v; render(); };
F.setThresholds=(th)=>{ st.thresholds=th; st.max=th[2]; render(); };
function potXY(){ if(!st.pot) return [W/2,40]; const r=st.pot.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height*.55]; }
function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function render(){
  if(st.score) st.score.textContent=fmt(st.shown);
  if(st.meter){ let k=Math.min(1,st.shown/st.max);
    // fixed, evenly spaced star marks (st.pos): the fill is piecewise so it reaches each mark exactly at its threshold
    if(st.pos&&st.thresholds){ const T=st.thresholds,P=st.pos,v=st.shown; let lo=0,plo=0; k=P[P.length-1];
      for(let i=0;i<T.length;i++){ if(v<T[i]){ k=plo+(P[i]-plo)*Math.max(0,(v-lo)/Math.max(1,T[i]-lo)); break; } lo=T[i]; plo=P[i]; } }
    st.meter.style.setProperty('--fill',k);
    st.meter.querySelectorAll('[data-star]').forEach((s,i)=>{ const on=st.shown>=st.thresholds[i]; if(on&&!s.classList.contains('on')){ s.classList.add('on'); const r=s.getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,18,'rgba(255,220,100,A)',260,6); S&&S.starFill&&S.starFill(i+1);} if(!on) s.classList.remove('on'); }); }
}
let gulpT=0;
function potGulp(){ if(!st.pot) return; const tn=performance.now(); if(tn-gulpT<110) return; gulpT=tn; // restarting the CSS bounce forces a layout; at most ~9 a second st.pot.classList.remove('gulp'); void st.pot.offsetWidth; st.pot.classList.add('gulp');
  if(st.score){ st.score.classList.remove('tick'); void st.score.offsetWidth; st.score.classList.add('tick'); } }

/** The main event. Score pops at (x,y), then flies to the jar as glints. */
F.score=(x,y,points,opt={})=>new Promise(res=>{
  ensure();
  const L=layer(), big=opt.big||points>=500;
  const pop=el('div','nl-pop'+(big?' big':'')+(opt.tint?' tint-'+opt.tint:''),
    (opt.label?`<span class="nl-pop-label">${opt.label}</span>`:'')+`<span class="nl-pop-num">+${fmt(points)}</span>`);
  pop.style.left=x+'px'; pop.style.top=y+'px'; L.appendChild(pop);
  burst(x,y,big?22:12,'rgba(255,230,140,A)',big?360:260,big?7:5);
  const n=Math.max(5,Math.min(18,Math.round(Math.sqrt(points)*.6)));
  const [px,py]=potXY(); let landed=0; const per=points/n;
  setTimeout(()=>{
    for(let i=0;i<n;i++){
      S&&S.coinFly&&i%3===0&&setTimeout(()=>S.coinFly(),i*38);
      add(Glint(x,y,px,py,i*38,rnd(620,820),()=>{
        st.shown=Math.min(st.value,st.shown+per); if(i===n-1) st.shown=st.value;
        { const tn=performance.now(); if(S&&S.coinLand&&tn-(F._clT||0)>65){ F._clT=tn; S.coinLand(landed); } } landed++; // one coin sound per 65 ms, not one per glint
        burst(px,py-6,4,'rgba(255,220,120,A)',180,4); potGulp(); render();
        if(i===n-1) res();
      },opt.tint?PAL[opt.tint]:null));
    }
  }, 260);
  st.value+=points;
  setTimeout(()=>pop.remove(),1400);
});

const CALLS = ['','Jolly!','Merry!','Festive!','Ho Ho HOLY!','Sleighin\' It!','North Pole Position!'];
F.callWord=(chain)=>CALLS[Math.min(chain,CALLS.length-1)];
/** Big centred callout. tier 1..6 sets size/colour. */
F.callout=(text,opt={})=>{
  ensure(); const L=layer(); const tier=opt.tier||1;
  const c=el('div','nl-callout t'+Math.min(6,tier),`<div class="nl-callout-rays"></div><div class="nl-callout-text" data-text="${text.replace(/"/g,'&quot;')}">${text}</div>`+(opt.sub?`<div class="nl-callout-sub">${opt.sub}</div>`:''));
  if(opt.x!=null){ c.style.left=opt.x+'px'; c.style.top=opt.y+'px'; }
  L.appendChild(c); S&&S.callout&&S.callout(tier);
  // v3.1 fit: long calls ("Encore!") must never run off a 360 px phone. The pop-in peaks at 1.15x.
  const tx=c.querySelector('.nl-callout-text'), maxW=((L.clientWidth||innerWidth)-28)/1.15, tw=tx.scrollWidth;
  if(tw>maxW){ const fs=parseFloat(getComputedStyle(tx).fontSize); tx.style.fontSize=Math.floor(fs*maxW/tw)+'px'; }
  const r=c.getBoundingClientRect(); setTimeout(()=>burst(r.left+r.width/2,r.top+r.height/2,10+tier*4,'rgba(255,240,170,A)',300+tier*40,6),120);
  setTimeout(()=>c.remove(),1500);
};


/* ---------------------------------------------------------------
   v4 GUIDES: big, friendly "what now?" messages so the player is
   never confused. One guide at a time; a new one replaces the old.
   NLFX.welcomeGift({title,line,rewards,taps,onClaim})  // v4.2 welcome-back Santa present
   NLFX.guide(title, {
     sub:   'what to do next',            // second line, the actual instruction
     tone:  'tip'|'warn'|'good'|'stuck',  // violet | red | green | gold
     icon:  'spool'|'bulb'|'snow'|'scissors'|'cocoa'|'hand'|'star'|url,
     target: element | [clientX,clientY], // glow ring + bouncing arrow on it
     action: {label:'Hot Cocoa +3', onClick}, // optional big button in the guide
     place: 'bottom'|'top'|'center',      // default bottom (above the booster bar)
     host: el,                            // optional: render inside this element (showcase phones)
     ms: 0                                // auto-hide after ms (0 = stays until closed)
   }) -> {close()}
   NLFX.guideClose()
   --------------------------------------------------------------- */
let curGuide=null;
const GICON={ spool:()=>window.NLArt&&NLArt.dataUrl('spool'), cocoa:()=>window.NLArt&&NLArt.dataUrl('cocoa'), star:()=>window.NLArt&&NLArt.dataUrl('star','lit'),
  hand:()=>window.NLArt&&NLArt.dataUrl('mitten'), bulb:()=>window.NLArt&&NLArt.dataUrl('bulb',1,'lit'), snow:()=>window.NLArt&&NLArt.dataUrl('snowball'),
  scissors:()=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="rotate(-30 50 50)"><path d="M48 46 Q70 40 96 50 L94 54 Q70 50 48 54Z" fill="#ffc21a"/><path d="M48 54 Q70 60 96 50 L94 46 Q70 50 48 46Z" fill="#f0a000"/><ellipse cx="28" cy="40" rx="15" ry="11" fill="none" stroke="#f0283c" stroke-width="8"/><ellipse cx="28" cy="62" rx="15" ry="11" fill="none" stroke="#1fb35c" stroke-width="8"/><circle cx="48" cy="50" r="8" fill="#ffd84a"/></g></svg>') };
F.guideClose=()=>{ if(!curGuide) return; const g=curGuide; curGuide=null; g.el.classList.add('out'); g.ring&&g.ring.remove(); clearInterval(g.iv); setTimeout(()=>g.el.remove(),260); };
F.guide=(title,opt={})=>{
  F.guideClose(); const L=opt.host||layer();
  const tone=opt.tone||'tip', place=(opt.place||'bottom')+(opt.host?' in-host':'');
  const ic=opt.icon? (GICON[opt.icon]?GICON[opt.icon]():opt.icon) : null;
  const e=el('div',`nl-guide ${tone} ${place}`,`
    ${ic?`<div class="nl-guide-ico"><img src="${ic}" alt=""></div>`:''}
    <div class="nl-guide-txt"><div class="nl-guide-title">${title}</div>${opt.sub?`<div class="nl-guide-sub">${opt.sub}</div>`:''}</div>
    ${opt.action?`<button class="nl-btn sm ${tone==='warn'?'gold':'green'} nl-guide-act">${opt.action.label}</button>`:''}
    <button class="nl-guide-x" aria-label="Close">&times;</button>`);
  e.setAttribute('role','status'); e.setAttribute('aria-live','polite');
  L.appendChild(e);
  const g={el:e,ring:null,iv:0}; curGuide=g;
  e.querySelector('.nl-guide-x').onclick=()=>{ S&&S.tap&&S.tap(); F.guideClose(); };
  if(opt.action){ e.querySelector('.nl-guide-act').onclick=()=>{ S&&S.button&&S.button(); opt.action.onClick&&opt.action.onClick(); F.guideClose(); }; }
  if(opt.target){
    const ring=el('div','nl-guide-ring '+tone+(opt.host?' in-host':'')); ring.innerHTML='<div class="nl-guide-arrow"></div>'; L.appendChild(ring); g.ring=ring;
    const pos=()=>{ let x,y,w=64,h=64; if(Array.isArray(opt.target)){ [x,y]=opt.target; } else { const r=opt.target.getBoundingClientRect(); x=r.left+r.width/2; y=r.top+r.height/2; w=r.width+18; h=r.height+18; }
      if(opt.host){ const hr=opt.host.getBoundingClientRect(); x-=hr.left; y-=hr.top; }
      ring.style.left=x+'px'; ring.style.top=y+'px'; ring.style.width=w+'px'; ring.style.height=h+'px';
      // arrow sits on the side facing the guide card
      const gr=e.getBoundingClientRect(), hy=opt.host?opt.host.getBoundingClientRect().top:0, below=gr.top-hy>y; ring.classList.toggle('from-below',below); };
    pos(); g.iv=setInterval(pos,250);
  }
  if(S){ if(tone==='warn'&&S.fail) {} S.popIn&&S.popIn(); }
  if(opt.ms) setTimeout(()=>{ if(curGuide===g) F.guideClose(); },opt.ms);
  return {close:()=>{ if(curGuide===g) F.guideClose(); }};
};


/* ---------------------------------------------------------------
   v4.2 WELCOME-BACK GIFT: Santa pops up, "Ho ho ho!", a present
   wiggles until you tap it, it rattles harder with each tap, bursts
   open on the 3rd (or 1st with taps:1), rewards pop out, Claim.
   NLFX.welcomeGift({
     title:'Welcome back!', line:'Ho ho ho! I saved you a present.',
     rewards:[{icon:'cocoa',label:'Hot Cocoa',amount:2},{icon:'bulb',label:'Hints',amount:3},{icon:'star',label:'Stars',amount:1}],
     taps:3, ribbon:0..5 (colour index), host: el (optional, for showcase phones),
     onClaim(rewards) })  -> Promise resolves after Claim
   Reward icons: 'cocoa' | 'bulb' (hint) | 'star' | 'spool' (cords) | 'snow' | any image URL.
   --------------------------------------------------------------- */
F.welcomeGift=(opt={})=>new Promise(done=>{
  // v4.3: a proper kit card. Ribbon on top, a little snowy night stage with the Santa bulb and the
  // present on a glowing spot, tap pips under it, then the rewards pop in the same slot and Claim lights up.
  const A=window.NLArt; const host=opt.host||document.body; const inHost=!!opt.host;
  const rewards=opt.rewards||[{icon:'cocoa',label:'Hot Cocoa',amount:2},{icon:'bulb',label:'Hints',amount:3}];
  const taps=opt.taps||3; let tapN=0, openT=0, state='wait';
  const ico=k=>GICON[k]?GICON[k]():k;
  const tapWords=['Tap the present!','Again!','One more!','Nearly!'];
  const root=el('div','nl-welcome'+(inHost?' in-host':''),`
    <div class="nl-welcome-rays"></div>
    <div class="nl-card gold nl-welcome-card">
      <div class="nl-ribbon red big"><span><small>Ho ho ho</small>${opt.title||'Welcome back!'}</span></div>
      <div class="nl-welcome-stage"><canvas></canvas>
        <div class="nl-welcome-bubble">${opt.line||'Ho ho ho! I saved you a present.'}</div></div>
      <div class="nl-welcome-slot">
        <div class="nl-welcome-tap"><div class="nl-welcome-pips">${'<i></i>'.repeat(taps)}</div><span>${tapWords[0]}</span></div>
        <div class="nl-welcome-rewards">${rewards.map(r=>`<div class="nl-welcome-rw"><img src="${ico(r.icon)}" alt=""><b>+${r.amount}</b><span>${r.label}</span></div>`).join('')}</div>
      </div>
      <button class="nl-btn gold shine nl-welcome-claim" disabled>Claim</button>
    </div>`);
  host.appendChild(root);
  const stage=root.querySelector('.nl-welcome-stage'), cv=stage.querySelector('canvas'), cx=cv.getContext('2d');
  const tapTxt=root.querySelector('.nl-welcome-tap span'), pips=[...root.querySelectorAll('.nl-welcome-pips i')];
  let W=0,H=0; const dpr=Math.min(2,devicePixelRatio||1);
  const fit=()=>{ W=stage.clientWidth; H=stage.clientHeight; cv.width=W*dpr; cv.height=H*dpr; }; fit();
  const rnd=i=>{ const v=Math.sin(i*127.1+311.7)*43758.5453; return v-Math.floor(v); };
  const t0=performance.now(); let shakeT=0, raf=0, lidSnd=0, bulbSnd=0, hoHeard=false;
  const snd=()=>S||opt.sfx||window.NLSfx||null;
  const unlock=()=>{ try{ opt.onTap&&opt.onTap(); }catch(e){} try{ const c=snd()&&snd().ctx&&snd().ctx(); if(c&&c.state!=='running'&&c.resume) c.resume(); }catch(e){} };
  const live=()=>{ try{ const c=snd()&&snd().ctx&&snd().ctx(); return !!c&&c.state==='running'; }catch(e){ return false; } };
  setTimeout(()=>{ if(live()){ hoHeard=true; snd().santaHoHo&&snd().santaHoHo(); } },450);
  const ground=()=>H*.8;
  const santaS=()=>Math.min(W*.28,H*.36,108), santaX=()=>W*.25;
  const giftS=()=>Math.min(W*.32,H*.4,120), giftX=()=>W*.66, giftY=()=>ground()-giftS()*.42;
  function frame(){ const now=performance.now(), t=(now-t0)/1000; cx.setTransform(dpr,0,0,dpr,0,0); cx.clearRect(0,0,W,H);
    // stars
    for(let i=0;i<22;i++){ const a=.35+.65*Math.abs(Math.sin(t*1.3+i*2.1)); cx.globalAlpha=a*.8; cx.fillStyle='#fff';
      cx.beginPath(); cx.arc(rnd(i)*W,rnd(i+50)*H*.55,.7+rnd(i+90)*1.3,0,6.283); cx.fill(); }
    cx.globalAlpha=1;
    // snowy ground: two soft drifts
    const gy=ground();
    let g=cx.createLinearGradient(0,gy-20,0,H); g.addColorStop(0,'#c9d2ff'); g.addColorStop(1,'#7d86d6');
    cx.fillStyle='#5a4fc0'; cx.beginPath(); cx.moveTo(0,gy-6); cx.quadraticCurveTo(W*.3,gy-30,W*.62,gy-12); cx.quadraticCurveTo(W*.85,gy-2,W,gy-22); cx.lineTo(W,H); cx.lineTo(0,H); cx.fill();
    cx.fillStyle=g; cx.beginPath(); cx.moveTo(0,gy+4); cx.quadraticCurveTo(W*.25,gy-12,W*.5,gy+2); cx.quadraticCurveTo(W*.78,gy+14,W,gy-2); cx.lineTo(W,H); cx.lineTo(0,H); cx.fill();
    cx.fillStyle='rgba(255,255,255,.55)'; cx.beginPath(); cx.ellipse(W*.22,gy+4,W*.12,3,-.05,0,6.283); cx.fill();
    // glowing spot under the present
    const px=giftX(), gs=giftS(), py=giftY();
    const glowK=state==='wait'?.55+.2*Math.sin(t*3)+.12*tapN:.9;
    A.light(cx,px,gy-2,gs*1.15,'#ffd76a',glowK);
    cx.fillStyle="rgba(255,214,110,.75)"; cx.beginPath(); cx.ellipse(px,gy+2,gs*.7,gs*.14,0,0,6.283); cx.fill();
    // Santa bulb pops up out of the snow, laughs, then keeps an eye on the present
    const rise=Math.min(1,Math.max(0,(t-.1)/.6)), ss=santaS();
    const sy=gy-ss*.84+(1-A.ease.outBack(rise))*ss*1.4;
    const laugh=(t>.45&&t<2.2)||(state!=='wait'&&now-openT<1800)?1:0;
    cx.save(); cx.beginPath(); cx.rect(0,0,W,gy+8); cx.clip();
    A.drawSanta(cx,santaX(),sy,ss,t,{laugh,wink:state==='done'&&(t%3.2)<.35,look:state==='wait'?.5:0});
    cx.restore();
    cx.fillStyle='rgba(20,10,60,.25)'; cx.beginPath(); cx.ellipse(santaX(),gy+3,ss*.42,ss*.08,0,0,6.283); cx.fill();
    // the present
    if(state==='wait'){
      const k=shakeT?Math.max(0,1-(now-shakeT)/450):0, amp=.08+.08*tapN;
      cx.save(); cx.translate(px,py+gs*.4); cx.rotate(Math.sin(now*.05)*amp*k); cx.scale(1+k*.08,1-k*.06); cx.translate(-px,-py-gs*.4);
      A.drawGift(cx,px,py-k*gs*.1,gs,'closed',t,{ribbonCi:opt.ribbon??1}); cx.restore();
      for(let i=0;i<tapN*5;i++){ const a=rnd(i+tapN*9)*6.283+t*.8, d=gs*(.62+.12*Math.sin(t*5+i)); cx.fillStyle='rgba(255,240,170,.9)';
        cx.beginPath(); cx.arc(px+Math.cos(a)*d,py+Math.sin(a)*d*.75,1.6+rnd(i)*1.4,0,6.283); cx.fill(); }
      // bouncing pointer the first time, so nobody wonders what to do
      if(tapN===0&&t>1.4){ const b=Math.abs(Math.sin(t*4))*8; cx.fillStyle='#fff'; cx.strokeStyle='#2a1640'; cx.lineWidth=3; cx.lineJoin='round';
        const ax=px, ay=py-gs*.62-b; cx.beginPath(); cx.moveTo(ax,ay); cx.lineTo(ax-11,ay-14); cx.lineTo(ax-4,ay-14); cx.lineTo(ax-4,ay-26); cx.lineTo(ax+4,ay-26); cx.lineTo(ax+4,ay-14); cx.lineTo(ax+11,ay-14); cx.closePath(); cx.stroke(); cx.fill(); }
    } else {
      // v4.4: the box really opens, the lid lands beside it and a game bulb rises out and lights up
      const k=(now-openT)/1100;
      A.drawGiftOpening(cx,px,py,gs,k,t,{ribbonCi:opt.ribbon??1,bulbCi:1});
      if(!lidSnd&&k>.62){ lidSnd=1; snd()&&snd().giftLidLand&&snd().giftLidLand(); }
      if(!bulbSnd&&k>.38){ bulbSnd=1; snd()&&snd().giftBulbOn&&snd().giftBulbOn(); }
      if(k>1){ const e=Math.min(1,(k-1)/.3);
        for(let i=0;i<8;i++){ const a=t*.9+i*.785, d=gs*.62; cx.globalAlpha=e; cx.fillStyle=i%2?'#fff6c0':'#ffd24a'; cx.save(); cx.translate(px+Math.cos(a)*d,py-gs*.45+Math.sin(a)*d*.45); cx.rotate(t*2+i);
          cx.beginPath(); for(let j=0;j<8;j++){ const r=j%2?1.5:5, aa=j*.785; cx.lineTo(Math.cos(aa)*r,Math.sin(aa)*r);} cx.fill(); cx.restore(); }
        cx.globalAlpha=1; }
    }
    // a few soft snowflakes drifting over everything
    for(let i=0;i<14;i++){ const sp=10+rnd(i+7)*14, yy=((rnd(i+3)*H+t*sp)%(H+10))-5, xx=rnd(i)*W+Math.sin(t*.8+i)*8;
      cx.globalAlpha=.55+.35*rnd(i+11); cx.fillStyle='#fff'; cx.beginPath(); cx.arc(xx,yy,1.2+rnd(i+20)*1.8,0,6.283); cx.fill(); }
    cx.globalAlpha=1;
    raf=requestAnimationFrame(frame); }
  raf=requestAnimationFrame(frame);
  const tap=e=>{ if(state!=='wait') return; e.preventDefault&&e.preventDefault();
    unlock();   // host wakes the game audio (and resumes it) on every tap
    tapN++; shakeT=performance.now(); snd()&&snd().giftShake&&snd().giftShake(tapN);
    if(!hoHeard){ hoHeard=true; setTimeout(()=>snd()&&snd().santaHoHo&&snd().santaHoHo(),260); }
    pips.forEach((p,i)=>p.classList.toggle('on',i<tapN));
    if(tapN<taps){ tapTxt.textContent=tapWords[Math.min(tapWords.length-1,tapN)]; tapTxt.parentNode.classList.remove('bump'); void tapTxt.offsetWidth; tapTxt.parentNode.classList.add('bump'); return; }
    state='open'; openT=performance.now(); root.classList.add('opened'); snd()&&snd().giftBurst&&snd().giftBurst();
    const r=cv.getBoundingClientRect();
    if(F.confetti&&!inHost) setTimeout(()=>F.confetti(r.left+giftX(),r.top+giftY(),60),260);
    setTimeout(()=>{ root.classList.add('reveal'); snd()&&snd().rewardReveal&&snd().rewardReveal(rewards.length); },650);
    setTimeout(()=>{ state='done'; root.classList.add('claimable'); claim.disabled=false; },650+rewards.length*180+350); };
  stage.addEventListener('pointerdown',tap);
  // v4.4.1: phones only allow audio to start on touchend/click (a touch pointerdown doesn't count), so unlock there too
  ['pointerup','touchend','click'].forEach(ev=>root.addEventListener(ev,unlock,{passive:true}));
  const claim=root.querySelector('.nl-welcome-claim');
  claim.onclick=()=>{ if(state!=='done') return; state='gone'; snd()&&snd().claim&&snd().claim();
    root.querySelectorAll('.nl-welcome-rw').forEach(w=>w.classList.add('fly'));
    opt.onClaim&&opt.onClaim(rewards);
    setTimeout(()=>root.classList.add('out'),250); setTimeout(()=>{ cancelAnimationFrame(raf); removeEventListener('resize',fit); root.remove(); done(rewards); },700); };
  addEventListener('resize',fit);
});

/** Count a number up with ticks (win card) */
F.countUp=(node,from,to,ms=1200,tick=true)=>new Promise(res=>{
  const t0=performance.now(); let lastTick=0, i=0;
  const step=t=>{ const k=Math.max(0,Math.min(1,(t-t0)/ms)), v=from+(to-from)*ease.outCubic(k); node.textContent=fmt(v);
    if(tick&&S&&S.countTick&&t-lastTick>55&&k<1){ lastTick=t; S.countTick(i++); }
    if(k<1) requestAnimationFrame(step); else { node.classList.remove('tick'); void node.offsetWidth; node.classList.add('tick'); res(); } };
  requestAnimationFrame(step);
});

/** Slam stars into a card. Elements with class .nl-star inside root. */
F.stars=(root,n)=>new Promise(res=>{
  const ss=[...root.querySelectorAll('.nl-star')]; ss.forEach(s=>s.classList.remove('on','slam'));
  ss.forEach((s,i)=>{ if(i>=n) return; setTimeout(()=>{ s.classList.add('on','slam'); const r=s.getBoundingClientRect();
    burst(r.left+r.width/2,r.top+r.height/2,26,'rgba(255,220,90,A)',420,8); S&&S.starFill&&S.starFill(i+1);
    if(i===2){ F.confetti(r.left+r.width/2,r.top+r.height/2,50); F.shake(root.closest('.nl-card')||root,6); }
    if(i===n-1) setTimeout(res,400); }, 450+i*520); });
  if(n===0) res();
});

/** Encore: each leftover cord rockets from `from` (client xy) to a spot and bursts into points */
F.encore=async(from,spots,per=500)=>{
  for(let i=0;i<spots.length;i++){
    const [tx,ty]=spots[i];
    await new Promise(r=>{ S&&S.encoreTick&&S.encoreTick(i);
      const t0=performance.now(), dur=420, [fx,fy]=from;
      add({ update(t){ if(t-t0>=dur){ burst(tx,ty,30,'rgba(255,200,120,A)',380,7); burst(tx,ty,14,`rgba(${['255,90,100','90,200,255','120,255,150'][i%3]},A)`,300,6); r(); return false;} return true; },
        draw(c,t){ const k=ease.inQuad((t-t0)/dur), x=fx+(tx-fx)*k, y=fy+(ty-fy)*k-Math.sin(k*Math.PI)*120; glowDot(c,x,y,22,'rgba(255,210,120,A)',.8); c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,4,0,6.283); c.fill(); } });
    });
    F.score(tx,ty,per,{label:'Encore'});
    await new Promise(r=>setTimeout(r,180));
  }
};

F.shake=(node,px=8,ms=380)=>{ if(!node) return; node.animate([{transform:'translate(0,0)'},{transform:`translate(${-px}px,${px*.4}px)`},{transform:`translate(${px*.8}px,${-px*.5}px)`},{transform:`translate(${-px*.5}px,${px*.3}px)`},{transform:`translate(${px*.3}px,0)`},{transform:'translate(0,0)'}],{duration:ms,easing:'ease-out'}); };

/** bounce a DOM element in (cards, toasts) */
F.popIn=(node)=>{ node.classList.remove('nl-out'); node.classList.add('nl-in'); S&&S.popIn&&S.popIn(); };
F.popOut=(node)=>new Promise(r=>{ node.classList.remove('nl-in'); node.classList.add('nl-out'); S&&S.popOut&&S.popOut(); setTimeout(r,260); });

window.NLFX = F;
})();
