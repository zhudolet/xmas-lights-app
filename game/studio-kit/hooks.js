/* =====================================================================
   XMAS LIGHTS  ·  hooks.js v4  (team 2 -> core gameplay bridge)
   Replaces index.html's placeholder art (GAMEPLAY-SPEC "Art and sound
   hooks", engine v21) WITHOUT touching rule code.

   The engine runs inside a closure, so it opts in with ONE line at the
   top of each placeholder function, e.g.
     function drawGift(gf,t){ if(window.NL_HOOKS&&NL_HOOKS.drawGift) return NL_HOOKS.drawGift(gf,t);  ...old code... }
   for: drawGift drawSantaHat drawRudolph drawCoal drawSnowball drawGhostHand
        drawBulbExtras, and v4: drawFallingSnowball drawSplat drawScissors
   (drawTroll / drawBiker are NOT installed in v4)
   and exposes the canvas: add  get ctx(){return ctx}  to window.__nl.

   Load order at the end of <body>, AFTER the main game script:
     <script src="studio-kit/art.js"></script>
     <script src="studio-kit/sfx.js"></script>
     <script src="studio-kit/fx.js"></script>
     <script src="studio-kit/hooks.js"></script>
   then `await NLArt.ready('studio-kit/')` (hooks.js calls it for you and
   only swaps a function in once the art has loaded).

   Engine time t is in ms; kit time is in seconds. Board space 1000,
   bulb radius 33 (U = 66). If the engine changes BR, set NL_HOOKS.BR.
   Turn any hook off by listing it:  window.NL_KEEP_HOOKS = ['drawSplat']
   ===================================================================== */
(function(){
'use strict';
const A = window.NLArt; if(!A){ console.warn('[nl-hooks] art.js missing'); return; }
const keep = new Set(window.NL_KEEP_HOOKS||[]);
const H = {}; let ctx=null, G=null;
const U  = ()=> (H.BR||33)*2;
const W  = 1000;
const env = ()=>{ const n=window.__nl; ctx=n&&n.ctx; G=n&&n.G; return !!ctx; };
const S  = t => t/1000;
const cl = (v,a,b)=>Math.max(a,Math.min(b,v));
function swap(name, fn){
  if(keep.has(name)) return;
  H[name] = function(){ if(!env()) return; ctx.save(); try{ return fn.apply(this,arguments); } finally{ ctx.restore(); } };
}

const install = ()=>{

/* presents: closed, ripping a layer (shake), unwrapping (lid flies, light) */
swap('drawGift', function(gf,t){
  const size=U()*A.scale.gift, open=gf.owner&&t>gf.t;
  if(open){
    const k=(t-gf.t)/1100;
    if(k<1) A.drawGift(ctx,gf.x,gf.y,size,'unwrap',S(t),{k,ribbonCi:gf.ribbon??undefined});
    else { ctx.save(); ctx.globalCompositeOperation='lighter'; A.glow(ctx,gf.x,gf.y,size*1.1,gf.owner==='ai'?'#7fc4ff':'#ffd36a',.35+.1*Math.sin(t*.004)); ctx.restore(); }
    return;
  }
  const rip = gf.rip&&t>gf.rip&&t-gf.rip<450 ? Math.sin((t-gf.rip)*.08)*(1-(t-gf.rip)/450)*.15 : 0;
  ctx.save(); if(rip){ ctx.translate(gf.x,gf.y); ctx.rotate(rip); ctx.translate(-gf.x,-gf.y); }
  A.drawGift(ctx,gf.x,gf.y,size,'closed',S(t),{ribbonCi:gf.ribbon??undefined, layers:(gf.max>1?gf.layers:0)});
  ctx.restore();
});

/* Santa hats: keeps the engine's aim arrow (good affordance), new hat on top */
swap('drawSantaHat', function(h,t){
  const fl=h.flash&&t>h.flash?Math.max(0,1-(t-h.flash)/700):0;
  if(!h.used){ ctx.save(); ctx.translate(h.x,h.y); ctx.rotate(h.dir); const a=.35+.25*Math.sin(t*.004), r=U()*.7;
    ctx.strokeStyle=`rgba(255,240,210,${a})`; ctx.lineWidth=4; ctx.setLineDash([2,10]); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(r*1.05,0); ctx.lineTo(r*2.1,0); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=`rgba(255,240,210,${a})`; ctx.beginPath(); ctx.moveTo(r*2.35,0); ctx.lineTo(r*2.05,-9); ctx.lineTo(r*2.05,9); ctx.closePath(); ctx.fill(); ctx.restore(); }
  const col = typeof h.color==='string' ? h.color : ['red','green','blue'][h.color|0];
  const st = fl>0 ? 'in' : h.used ? 'spent' : 'idle';
  A.drawHat(ctx,h.x,h.y,U()*A.scale.hat,col,h.dir*180/Math.PI,S(t),st,1-fl);
});

/* Snoot (Rudolph): the dog stands behind his nose bulb; the nose itself is painted in drawBulbExtras */
swap('drawRudolph', function(B,t,lit){
  A.drawRudolph(ctx,B.x,B.y,U()*1.08,lit,S(t),null,{noNose:true});
});

swap('drawCoal', function(c,t){ A.drawCoal(ctx,c.x,c.y,U()*A.scale.coal,S(t)); });

swap('drawSnowball', function(x,y,r,t,sc=1){ if(sc<=.01) return;
  // engine draws its own shadow; draw the ball only
  A.drawSnowball(ctx,x,y,r*sc,S(t),'flying',1,[x,y]); });

/* v4 new path: Troll and Biker are gone. Puff the cloud drops snowballs, Snips the scissors cuts cords.
   Engine units: x,y,r board px; p, open, meltP 0..1; age and t in ms. */
swap('drawFallingSnowball', function(x,y,r,p,t){ A.drawFallingSnowball(ctx,x,y,r,cl(p,0,1),S(t)); });
swap('drawSplat', function(x,y,r,age,meltP,t){ A.drawSplat(ctx,x,y,r,S(age),cl(meltP||0,0,1),S(t)); });
swap('drawScissors', function(x,y,angle,open,t,sc){ A.drawScissors(ctx,x,y,U()*A.scale.scissors*(sc||1),angle,cl(open,0,1),S(t)); });

/* ghost hand -> knitted mitten */
swap('drawGhostHand', function(t){
  const J=G.J, gh=J&&J.ghost; if(!gh||G.drag||G.over) return; const Pa=G.bulbs[gh.a], Pb=G.bulbs[gh.b]; if(!Pa||!Pb) return;
  const T=1900, p=((t-gh.t0)%T)/T; let x,y,a=1,press=0;
  const e=q=>q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
  if(p<.18){x=Pa.x;y=Pa.y;a=p/.18;press=p/.18} else if(p<.72){const q=e((p-.18)/.54);x=Pa.x+(Pb.x-Pa.x)*q;y=Pa.y+(Pb.y-Pa.y)*q;press=1} else {x=Pb.x;y=Pb.y;a=1-(p-.72)/.28;press=1-(p-.72)/.28}
  ctx.save(); ctx.strokeStyle=`rgba(255,240,180,${.75*Math.min(1,a+.3)})`; ctx.lineWidth=6; ctx.setLineDash([10,12]); ctx.lineDashOffset=-t*.04; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(Pa.x,Pa.y); ctx.lineTo(Pb.x,Pb.y); ctx.stroke(); ctx.restore();
  for(const P of [Pa,Pb]){ const r=U()*.85+6*Math.sin(t*.008); ctx.save(); ctx.strokeStyle='rgba(255,230,170,.6)'; ctx.lineWidth=4; ctx.setLineDash([12,10]); ctx.lineDashOffset=t*.03; ctx.beginPath(); ctx.arc(P.x,P.y,r,0,6.283); ctx.stroke(); ctx.restore(); }
  if(press>.3){ ctx.save(); ctx.globalCompositeOperation='lighter'; A.glow(ctx,x,y,U()*.8,'#ffffff',.5); ctx.restore(); }
  A.drawMitten(ctx,x,y,U()*1.15,press*.6,cl(a,0,1));
});

/* bulb extras: ice block, cap badge, wall plug, Snoot's nose */
swap('drawBulbExtras', function(b,t,i){
  const J=G.J, u=U();
  if(b.frozen||(b.thawT&&t-b.thawT<500&&t>b.thawT-1)){
    const k=b.frozen?0:cl((t-b.thawT)/500,0,1);
    A.drawIce(ctx,b.x,b.y,u*(1+k*.25),1-k);
  }
  if(b.cap!=null){ A.drawCapBadge(ctx,b.x,b.y,u,b.cap,G.adj[i].size); }
  if(b.plug){ A.drawPlug(ctx,b.x,b.y+u*.95,u*.75,true,S(t)); }
  if(b.nose){ const lit=J&&J.nosesLit.has(i)&&t>(b.noseT||0); A.drawNose(ctx,b.x,b.y,u*1.08,lit,S(t),lit?S(t-(b.noseT||0)):null); }
});

/* v3: bulb body only (glass, cap, live face), no glow. The engine keeps its own flicker, glow pools and light.
   NL_HOOKS.drawBulbBody(ctx,x,y,size,colourIndex,{lit,hover,scared,eyeX,eyeY,blink,face,bright}) */
if(!keep.has('drawBulbBody')) H.drawBulbBody = function(c,x,y,size,ci,o){ return A.drawBulbBody(c,x,y,size,ci,o||{}); };

console.log('[nl-hooks] studio-kit art installed');
};

const base = (document.currentScript && document.currentScript.src || '').replace(/hooks\.js(\?.*)?$/,'');
A.ready(base).then(()=>{ install(); window.NL_HOOKS = H; });
})();
