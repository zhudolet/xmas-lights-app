/* =====================================================================
   XMAS LIGHTS  ·  art.js  (team 2: graphics) · v4 new path (own cast: Puff the cloud, Snips the scissors)
   Modern soft-3D toy look: no ink outlines, glossy gradients, rim light,
   contact shadows. Everything sits on a dark night board so the additive
   light of the bulbs reads.

   SCALE RULE: every draw function takes `size` = the width of the
   object's main body in px. Recommended on the 1000 px board:
     U = 66 (bulb) · present 1.15U · hat 1.4U · snowball 1.0U
     Rudolph nose 1.08U · blockers 1.1U · coal 0.9U · topper 1.3U · plug 1.1U
   NLArt.U is the unit; NLArt.scale has the multipliers.

   Bulbs:
     NLArt.drawBulbBody(ctx,x,y,size,ci,{lit,hover,scared,eyeX,eyeY,blink,face,bright})
        glass + cap + face only (no glow). For engines that own the light.
     NLArt.drawBulb(ctx,x,y,size,ci,state,t,litT,opt)
        full bulb with glow pool, halo, incandescent shimmer, light-up burst.
        state 'unlit'|'lit'|'hover'|'dim'|'near' ('near' = a cord is coming:
        erratic flicker + surges). opt: {flicker:0..1 (overrides), look:[x,y],
        scared, seed}
   ===================================================================== */
(function(){
'use strict';
const INK = '#2a1640';   // deep plum, used only for faces and small text
const PAL = ['#ff3b4e','#ffc21a','#33d17a','#3d9bff','#ff5fc8','#ff8a1f'];
const PAL_NAMES = ['red','gold','green','blue','pink','orange'];
const HAT = { red:'#f0283c', green:'#1fb35c', blue:'#2f86ff' };

function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]}
function mix(a,b,t){const A=hex(a),B=hex(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const dark=(c,t)=>mix(c,'#12082a',t), light=(c,t)=>mix(c,'#ffffff',t);
const rgba=(c,a)=>{const h=hex(c);return `rgba(${h[0]},${h[1]},${h[2]},${a})`};
const desat=(c,t)=>{const h=hex(c),g=(h[0]*.3+h[1]*.55+h[2]*.15)|0;return mix(c,'#'+[g,g,g].map(v=>v.toString(16).padStart(2,'0')).join(''),t)};

/* ---------------------------------------------------------------
   SVG sources. Each returns {svg, w, h, bw, ax, ay}:
   viewBox w×h, bw = body width in viewBox units (maps to `size`),
   ax/ay = anchor (the point drawn at x,y).
   --------------------------------------------------------------- */
const S = {};
const wrap=(w,h,inner,defs='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w*4}" height="${h*4}"><defs>${defs}</defs>${inner}</svg>`;
const LG=(id,stops,x2=0,y2=1)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}"${a!=null?` stop-opacity="${a}"`:''}/>`).join('')}</linearGradient>`;
const RG=(id,stops,cx='40%',cy='35%',r='65%')=>`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o,c,a])=>`<stop offset="${o}" stop-color="${c}"${a!=null?` stop-opacity="${a}"`:''}/>`).join('')}</radialGradient>`;
const BLUR=`<filter id="bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>`;

/* bulb glass + gold screw cap, no face (the face is drawn live) */
const GLASS='M50 6 C29 23 21 44 23 60 C25 75 36 82 50 82 C64 82 75 75 77 60 C79 44 71 23 50 6Z';
S.bulb = (ci, state) => {
  const c = PAL[ci%6], lit = state==='lit';
  const defs = RG('g', lit
      ? [[0,'#ffffff'],[.28,light(c,.55)],[.7,c],[1,dark(c,.25)]]
      : [[0,light(desat(c,.25),.25)],[.55,dark(desat(c,.2),.25)],[1,dark(c,.62)]], '42%','38%','66%')
    + LG('cap',[[0,'#fff3c4'],[.35,'#f2c14e'],[.7,'#b9781c'],[1,'#7a4a12']],1,0)
    + RG('core',[[0,'#fff',lit?.95:.0],[1,'#fff',0]],'50%','58%','50%') + BLUR
    + `<clipPath id="k"><path d="${GLASS}"/></clipPath>`;
  const inner = `
    <path d="${GLASS}" fill="url(#g)"/>
    <g clip-path="url(#k)">
      <ellipse cx="50" cy="58" rx="20" ry="24" fill="url(#core)"/>
      <path d="M44 80 L44 62 Q50 50 56 62 L56 80" fill="none" stroke="${lit?'#fff8d0':'#e8c070'}" stroke-width="${lit?2.6:1.6}" opacity="${lit?.9:.45}" ${lit?'filter="url(#bl)"':''}/>
      <path d="M44 62 Q47 56 50 60 Q53 56 56 62" fill="none" stroke="${lit?'#fff':'#f0d090'}" stroke-width="1.4" opacity="${lit?1:.55}"/>
      <ellipse cx="74" cy="64" rx="16" ry="30" fill="${dark(c,.7)}" opacity="${lit?.10:.28}"/>
      <path d="${GLASS}" fill="none" stroke="${light(c,.7)}" stroke-width="3" opacity="${lit?.55:.3}" transform="translate(-1.5 -1)"/>
    </g>
    <ellipse cx="37" cy="33" rx="6" ry="13" transform="rotate(26 37 33)" fill="#fff" opacity="${lit?.85:.6}"/>
    <ellipse cx="33" cy="52" rx="2.6" ry="4" fill="#fff" opacity="${lit?.7:.4}"/>
    <path d="M36 80 H64 L62 96 Q50 100 38 96Z" fill="url(#cap)"/>
    <path d="M37 84.5 H63 M37.6 89.5 H62.4" stroke="#7a4a12" stroke-width="1.6" opacity=".55"/>
    <path d="M37 82.2 H63" stroke="#fff6d0" stroke-width="1.4" opacity=".8"/>`;
  return {svg:wrap(100,100,inner,defs), w:100,h:100,bw:54,ax:50,ay:48};
};

/* ice cube (translucent, glossy) */
const ICE_BODY=(id)=>`
  <rect x="8" y="12" width="84" height="84" rx="18" fill="url(#${id})"/>
  <rect x="8" y="12" width="84" height="84" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".75" stroke-width="2.5"/>
  <path d="M18 26 Q30 18 52 19" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85" fill="none"/>
  <path d="M84 40 L84 74" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>
  <path d="M30 70 L44 58 L41 50 M44 58 L58 62" stroke="#ffffff" stroke-width="1.6" opacity=".55" fill="none"/>
  <circle cx="72" cy="28" r="2.5" fill="#fff"/>`;
S.frozen = (ci) => {
  const b=S.bulb(ci,'unlit');
  const defs=LG('ic',[[0,'#e8fbff',.78],[.5,'#9fdcff',.55],[1,'#5aa8f0',.7]],.4,1);
  const bulbImg=`<image href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(b.svg)}" x="22" y="16" width="56" height="56" opacity=".9"/>`;
  return {svg:wrap(100,104,bulbImg+ICE_BODY('ic'),defs),w:100,h:104,bw:68,ax:50,ay:48};
};
S.ice = () => ({svg:wrap(100,104,ICE_BODY('ic'),LG('ic',[[0,'#e8fbff',.55],[.5,'#9fdcff',.32],[1,'#5aa8f0',.5]],.4,1)),w:100,h:104,bw:68,ax:50,ay:48});

/* presents: glossy box + lid with a satin bow */
S.giftBox = (box, rib) => {
  const defs=LG('b',[[0,light(box,.15)],[.6,box],[1,dark(box,.35)]])+LG('s',[[0,dark(box,.25)],[1,dark(box,.45)]])+LG('r',[[0,light(rib,.45)],[.5,rib],[1,dark(rib,.25)]],1,0);
  const inner=`
    <path d="M14 42 H86 V84 Q86 92 78 92 H22 Q14 92 14 84Z" fill="url(#b)"/>
    <path d="M62 42 H86 V84 Q86 92 78 92 H62Z" fill="url(#s)" opacity=".45"/>
    <rect x="43" y="42" width="14" height="50" fill="url(#r)"/>
    <path d="M18 48 Q20 70 18 86" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45" fill="none"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:76,ax:50,ay:60};
};
S.giftLid = (box, rib) => {
  const defs=LG('l',[[0,light(box,.35)],[.6,light(box,.05)],[1,dark(box,.25)]])+LG('r',[[0,light(rib,.5)],[.5,rib],[1,dark(rib,.3)]],1,0)+RG('bw',[[0,light(rib,.6)],[.6,rib],[1,dark(rib,.3)]],'40%','35%','70%');
  const inner=`
    <rect x="8" y="30" width="84" height="16" rx="6" fill="url(#l)"/>
    <rect x="42" y="30" width="16" height="16" fill="url(#r)"/>
    <path d="M12 33 H88" stroke="#fff" stroke-width="2.5" opacity=".6" stroke-linecap="round"/>
    <path d="M50 30 C36 12 20 16 26 26 C30 32 42 31 50 30Z" fill="url(#bw)"/>
    <path d="M50 30 C64 12 80 16 74 26 C70 32 58 31 50 30Z" fill="url(#bw)"/>
    <path d="M30 22 C34 19 40 21 44 26" stroke="#fff" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="29" r="6.5" fill="url(#bw)"/><circle cx="48" cy="27" r="2" fill="#fff" opacity=".7"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:88,ax:50,ay:60};
};

/* Santa hat lying on its side: opening (fur trim) faces right, tip + pom-pom on the left */
S.hat = (col, glow) => {
  const c=HAT[col]||col;
  const defs=LG('h',[[0,light(c,.25)],[.55,c],[1,dark(c,.4)]])+LG('f',[[0,'#ffffff'],[.6,'#f1f4ff'],[1,'#c9d2ef']],1,0)
    +RG('p',[[0,'#fff'],[.65,'#f3f5ff'],[1,'#c6cfee']],'38%','32%','70%')+RG('in',[[0,glow?'#fff6c8':dark(c,.75)],[1,glow?'#ffcc4a':dark(c,.85)]],'30%','50%','70%');
  const fur=(x)=>`<path d="M${x} 16 Q${x+9} 14 ${x+12} 22 Q${x+18} 30 ${x+13} 40 Q${x+19} 50 ${x+13} 60 Q${x+18} 70 ${x+12} 78 Q${x+9} 86 ${x} 84 Q${x-7} 78 ${x-4} 68 Q${x-9} 58 ${x-4} 50 Q${x-9} 42 ${x-4} 32 Q${x-8} 22 ${x} 16Z" fill="url(#f)"/>`;
  const inner=`
    <ellipse cx="98" cy="50" rx="10" ry="30" fill="url(#in)"/>
    <path d="M92 20 C70 22 44 26 28 34 C20 38 16 44 18 48 C30 46 46 52 60 62 C72 70 84 78 92 80Z" fill="url(#h)"/>
    <path d="M90 24 C70 26 48 30 32 37" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>
    <path d="M60 62 C72 70 84 78 92 80 L92 60 C80 60 70 58 60 62Z" fill="${dark(c,.5)}" opacity=".35"/>
    ${fur(94)}
    <circle cx="16" cy="44" r="12" fill="url(#p)"/><circle cx="12" cy="40" r="3.4" fill="#fff"/>`;
  return {svg:wrap(120,100,inner,defs),w:120,h:100,bw:100,ax:66,ay:50};
};

/* snowball: glossy, a bit cheeky */
S.snowball = () => {
  const defs=RG('s',[[0,'#ffffff'],[.55,'#eef4ff'],[1,'#a9bde8']],'38%','32%','70%');
  const inner=`<circle cx="50" cy="50" r="42" fill="url(#s)"/>
    <path d="M22 70 Q40 86 66 82" stroke="#8ea6dc" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="30" rx="10" ry="6" transform="rotate(-30 34 30)" fill="#fff"/>
    <circle cx="62" cy="34" r="2.2" fill="#c8d6f5"/><circle cx="70" cy="58" r="2.6" fill="#c8d6f5"/><circle cx="40" cy="62" r="1.8" fill="#c8d6f5"/>
    <path d="M37 47 L46 51 M63 47 L54 51" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
    <ellipse cx="42" cy="55" rx="3" ry="3.6" fill="${INK}"/><ellipse cx="58" cy="55" rx="3" ry="3.6" fill="${INK}"/>
    <path d="M45 66 Q50 63 55 66" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:84,ax:50,ay:50};
};

/* coal: faceted lump with glowing ember cracks */
S.coal = () => {
  const defs=LG('c',[[0,'#5a5470'],[.5,'#2c2838'],[1,'#141019']],.4,1)+LG('e',[[0,'#ffe27a'],[1,'#ff5a1f']]);
  const inner=`<path d="M20 44 L34 22 L60 18 L80 32 L86 58 L72 80 L42 84 L18 68Z" fill="url(#c)"/>
    <path d="M34 22 L46 40 L60 18 M46 40 L80 32 M46 40 L42 84 M46 40 L18 68" stroke="#6c6684" stroke-width="1.5" opacity=".5" fill="none"/>
    <path d="M28 58 L38 54 L44 62 M58 66 L66 58 L74 62" stroke="url(#e)" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M36 26 L56 22" stroke="#fff" stroke-width="2.4" opacity=".45" stroke-linecap="round"/>
    <path d="M34 44 L44 47 M66 44 L56 47" stroke="#ffb36a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="51" r="3" fill="#ffcf6a"/><circle cx="60" cy="51" r="3" fill="#ffcf6a"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:70,ax:50,ay:52};
};

S.cane = () => {
  const defs=LG('w',[[0,'#ffffff'],[1,'#dfe4f5']],1,0);
  const inner=`<path d="M58 92 V36 C58 20 34 18 32 34" fill="none" stroke="url(#w)" stroke-width="16" stroke-linecap="round"/>
    <path d="M58 92 V36 C58 20 34 18 32 34" fill="none" stroke="#f0283c" stroke-width="16" stroke-linecap="round" stroke-dasharray="7 9"/>
    <path d="M54 88 V38 C54 26 40 24 37 32" fill="none" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:60,ax:48,ay:54};
};
S.snowman = () => {
  const defs=RG('s',[[0,'#fff'],[.6,'#eef3ff'],[1,'#b4c4ea']],'38%','32%','70%');
  const inner=`<circle cx="50" cy="70" r="24" fill="url(#s)"/><circle cx="50" cy="36" r="17" fill="url(#s)"/>
    <rect x="34" y="12" width="32" height="7" rx="3" fill="#2c2838"/><rect x="39" y="0" width="22" height="15" rx="3" fill="#2c2838"/><rect x="39" y="10" width="22" height="3" fill="#f0283c"/>
    <path d="M30 52 Q50 60 70 52 L70 58 Q50 66 30 58Z" fill="#f0283c"/><path d="M60 56 L66 72 L58 70Z" fill="#c81d30"/>
    <circle cx="44" cy="33" r="2.6" fill="${INK}"/><circle cx="56" cy="33" r="2.6" fill="${INK}"/><path d="M50 37 L62 40 L50 41Z" fill="#ff8a1f"/>
    <circle cx="50" cy="70" r="2.4" fill="${INK}"/><circle cx="50" cy="80" r="2.4" fill="${INK}"/>
    <ellipse cx="42" cy="28" rx="4" ry="2.5" fill="#fff" opacity=".9"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:52,ax:50,ay:56};
};
S.ginger = () => {
  const defs=LG('g',[[0,'#e9a25a'],[1,'#a85e22']]);
  const inner=`<path d="M50 8 C62 8 66 18 64 26 C76 26 90 30 88 40 C86 48 72 44 66 46 L72 84 C74 92 64 96 58 88 L50 74 L42 88 C36 96 26 92 28 84 L34 46 C28 44 14 48 12 40 C10 30 24 26 36 26 C34 18 38 8 50 8Z" fill="url(#g)"/>
    <path d="M22 36 Q24 34 26 36 M74 36 Q76 34 78 36 M36 80 Q38 78 40 80 M60 80 Q62 78 64 80" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="44" cy="18" r="2.6" fill="${INK}"/><circle cx="56" cy="18" r="2.6" fill="${INK}"/><path d="M45 24 Q50 28 55 24" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="44" r="3.4" fill="#33d17a"/><circle cx="50" cy="56" r="3.4" fill="#f0283c"/>
    <path d="M42 12 Q46 9 50 10" stroke="#fff" stroke-width="2.4" opacity=".5" fill="none" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:72,ax:50,ay:50};
};
S.mitten = (col='#f0283c') => {
  const defs=LG('m',[[0,light(col,.2)],[.6,col],[1,dark(col,.35)]])+LG('c',[[0,'#fff'],[1,'#d9def2']]);
  const inner=`<path d="M30 74 L28 40 C28 22 40 12 54 14 C68 16 74 28 72 44 L72 52 C80 46 90 50 86 60 C82 68 74 70 70 74Z" fill="url(#m)"/>
    <path d="M36 30 Q50 24 64 30 M34 44 Q50 38 66 44 M34 58 Q50 52 68 58" stroke="#fff" stroke-width="3" stroke-dasharray="3 5" opacity=".55" fill="none" stroke-linecap="round"/>
    <rect x="24" y="72" width="50" height="18" rx="8" fill="url(#c)"/>
    <path d="M38 20 Q46 16 54 17" stroke="#fff" stroke-width="3" opacity=".55" fill="none" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:64,ax:50,ay:54};
};
S.rock = () => {
  const defs=LG('r',[[0,'#a7b0cc'],[.6,'#6d7596'],[1,'#454b66']],.3,1);
  const inner=`<path d="M12 78 C10 60 20 40 38 34 C52 28 70 30 82 44 C92 56 92 74 86 82 Q50 90 12 78Z" fill="url(#r)"/>
    <path d="M14 70 C24 70 30 64 34 58 C40 50 30 44 22 52" fill="#fff" opacity=".9"/>
    <path d="M40 36 C56 30 70 34 78 42" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/>
    <path d="M30 32 C44 22 66 22 80 36 C70 30 50 28 30 32Z" fill="#fff"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:80,ax:50,ay:58};
};

S.star = (state) => {
  const locked = state==='locked';
  const st='M50 5 C53 5 55 7 56.5 10.5 L64 28 L83 30 C90 31 92 38 87 42.5 L73 56 L77 75 C78.5 82 72.5 86 66.5 82.5 L50 73 L33.5 82.5 C27.5 86 21.5 82 23 75 L27 56 L13 42.5 C8 38 10 31 17 30 L36 28 L43.5 10.5 C45 7 47 5 50 5Z';
  const defs=RG('s',locked?[[0,'#f2f5ff'],[.6,'#aab4d6'],[1,'#69739a']]:[[0,'#fffbe0'],[.45,'#ffd84a'],[1,'#f08a00']],'42%','35%','70%');
  const inner=`<path d="${st}" fill="url(#s)"/>
    <path d="M50 14 L56 30 L50 44 L44 30Z" fill="#fff" opacity="${locked?.35:.6}"/>
    <ellipse cx="38" cy="32" rx="6" ry="3.5" transform="rotate(-30 38 32)" fill="#fff" opacity=".85"/>
    ${locked?`<rect x="39" y="47" width="22" height="18" rx="5" fill="#ffc21a"/><path d="M44 47 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke="#ffc21a" stroke-width="4"/><circle cx="50" cy="55.5" r="2.6" fill="#8a5a10"/>`
      :`<ellipse cx="43" cy="48" rx="2.8" ry="3.4" fill="${INK}"/><ellipse cx="57" cy="48" rx="2.8" ry="3.4" fill="${INK}"/><path d="M45 56 Q50 61 55 56" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`}`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:88,ax:50,ay:50};
};

S.plug = (powered) => {
  const defs=LG('p',[[0,'#ffffff'],[1,'#cdd4ec']])+LG('s',[[0,powered?'#ffe066':'#3a3150'],[1,powered?'#ff9a1a':'#1c1630']]);
  const inner=`<rect x="14" y="14" width="72" height="72" rx="20" fill="url(#p)"/>
    <rect x="22" y="22" width="56" height="56" rx="16" fill="#eef1fb"/>
    <rect x="35" y="36" width="8" height="20" rx="4" fill="url(#s)"/><rect x="57" y="36" width="8" height="20" rx="4" fill="url(#s)"/>
    <path d="M42 66 Q50 72 58 66" stroke="url(#s)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M20 26 Q22 18 32 18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:72,ax:50,ay:50};
};

S.cocoa = () => {
  const defs=LG('m',[[0,'#ff6a6a'],[.5,'#f0283c'],[1,'#a8122a']],1,0)+LG('c',[[0,'#a0603a'],[1,'#5a2f18']]);
  const inner=`<path d="M38 22 C34 14 44 12 40 4 M54 22 C50 14 60 12 56 4" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    <path d="M72 42 C90 40 90 66 72 66" fill="none" stroke="#c81d30" stroke-width="9" stroke-linecap="round"/>
    <path d="M16 30 L78 30 L72 84 C71 91 65 95 58 95 L36 95 C29 95 23 91 22 84Z" fill="url(#m)"/>
    <ellipse cx="47" cy="30" rx="31" ry="8" fill="url(#c)"/>
    <circle cx="37" cy="27" r="6" fill="#fff"/><circle cx="51" cy="25" r="6" fill="#ffe0ea"/><circle cx="61" cy="29" r="5" fill="#fff"/>
    <path d="M28 44 L30 80" stroke="#fff" stroke-width="4" opacity=".4" stroke-linecap="round"/>
    <path d="M36 58 C36 52 44 52 47 57 C50 52 58 52 58 58 C58 64 47 70 47 70 C47 70 36 64 36 58Z" fill="#fff" opacity=".9"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:80,ax:50,ay:52};
};
S.spool = () => {
  /* v3.1 cord icon: a fat green light-string swoop, one big hanging bulb, a gold wall plug.
     Built to read at 20 px in the HUD chip. */
  const defs=LG('cd',[[0,'#6af5a2'],[1,'#12904a']])+LG('pl',[[0,'#fffaf0'],[1,'#e2c890']])+LG('pr',[[0,'#ffe37a'],[1,'#c88200']])
    +RG('bb',[[0,'#ffffff'],[.28,'#ffe98a'],[.75,'#ffbe1a'],[1,'#e88a00']],'38%','62%','70%')+RG('gw',[[0,'#ffd34a',.55],[1,'#ffd34a',0]],'50%','50%','50%');
  const P='M28 40 C26 16 50 8 58 26 C64 40 84 42 86 26 C87 20 86 16 84 13';
  const inner=`<circle cx="28" cy="70" r="26" fill="url(#gw)"/>
    <path d="${P}" fill="none" stroke="#0a4a24" stroke-width="14" stroke-linecap="round" opacity=".35" transform="translate(0 3)"/>
    <path d="${P}" fill="none" stroke="url(#cd)" stroke-width="11" stroke-linecap="round"/>
    <path d="M30 26 C34 16 46 12 53 18" fill="none" stroke="#d8ffe6" stroke-width="3" stroke-linecap="round" opacity=".85"/>
    <g transform="translate(84 10) rotate(18)"><rect x="-7" y="-18" width="4.5" height="10" rx="2" fill="url(#pr)"/><rect x="2.5" y="-18" width="4.5" height="10" rx="2" fill="url(#pr)"/>
      <rect x="-11" y="-10" width="22" height="20" rx="7" fill="url(#pl)"/><rect x="-7" y="-7" width="8" height="3.4" rx="1.7" fill="#fff"/></g>
    <g transform="translate(28 46) rotate(180)">
      <rect x="-10" y="-8" width="20" height="16" rx="4" fill="url(#pr)"/><path d="M-10 -2 H10 M-10 3 H10" stroke="#a86a00" stroke-width="1.6" opacity=".6"/>
      <path d="M0 -50 C16 -38 22 -24 18 -14 C15 -6 -15 -6 -18 -14 C-22 -24 -16 -38 0 -50Z" fill="url(#bb)"/>
      <ellipse cx="7" cy="-22" rx="4" ry="8" fill="#fff" opacity=".9" transform="rotate(-15 7 -22)"/></g>`;
  return {svg:wrap(104,104,inner,defs),w:104,h:104,bw:92,ax:54,ay:52};
};
S.jar = () => {
  const defs=LG('gl',[[0,'#d8ecff',.55],[.35,'#ffffff',.12],[1,'#8ec3f0',.45]],1,0)+LG('lid',[[0,'#ff6a6a'],[1,'#b0122a']]);
  const inner=`<path d="M22 30 C18 40 16 52 16 66 C16 86 26 96 50 96 C74 96 84 86 84 66 C84 52 82 40 78 30Z" fill="url(#gl)"/>
    <path d="M22 30 C18 40 16 52 16 66 C16 86 26 96 50 96 C74 96 84 86 84 66 C84 52 82 40 78 30Z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/>
    <path d="M26 40 C24 52 24 70 30 82" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
    <rect x="20" y="16" width="60" height="16" rx="6" fill="url(#lid)"/>
    <path d="M26 20 H74" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>`;
  return {svg:wrap(100,100,inner,defs),w:100,h:100,bw:68,ax:50,ay:56};
};
/* Rudolph's antlers + ears, drawn behind the nose bulb */
S.antlers = () => {
  const defs=LG('a',[[0,'#d9a36a'],[.6,'#9a6436'],[1,'#6a3e1c']])+LG('e',[[0,'#c88a56'],[1,'#7a4a24']]);
  const one=`<path d="M44 58 C40 44 38 34 30 24 C26 18 20 16 18 10 M33 28 C26 30 18 28 12 22 M37 40 C30 42 24 42 18 38" fill="none" stroke="url(#a)" stroke-width="7" stroke-linecap="round"/>
    <path d="M42 52 C38 42 36 34 30 26" fill="none" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>
    <path d="M38 64 C26 60 18 64 14 70 C22 74 32 72 40 68Z" fill="url(#e)"/><path d="M36 66 C28 64 22 66 19 69 C25 70 31 69 36 67Z" fill="#ffb3a6" opacity=".8"/>`;
  return {svg:wrap(120,100,`<g>${one}</g><g transform="translate(120 0) scale(-1 1)">${one}</g>`,defs),w:120,h:100,bw:120,ax:60,ay:74};
};

/* ---------------------------------------------------------------
   Raster cache: SVG -> Image, keyed by source+params.
   --------------------------------------------------------------- */
const cache = new Map();
function img(key, make){
  let e = cache.get(key);
  if(!e){
    const d = make(); const im = new Image(); e = {d, im, ok:false};
    im.onload = ()=>{ e.ok = true; };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d.svg);
    cache.set(key, e);
  }
  return e;
}
function blit(ctx, e, x, y, size, rot=0, sx=1, sy=1, alpha=1){
  if(!e.ok) return;
  const d=e.d, k=size/d.bw;
  ctx.save(); ctx.translate(x,y); if(rot) ctx.rotate(rot); if(sx!==1||sy!==1) ctx.scale(sx,sy);
  if(alpha!==1) ctx.globalAlpha*=alpha;
  ctx.drawImage(e.im, -d.ax*k, -d.ay*k, d.w*k, d.h*k);
  ctx.restore();
}
function glow(ctx,x,y,r,col,a){
  if(r<=0||a<=0) return;
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,rgba(col,a)); g.addColorStop(.35,rgba(col,a*.45)); g.addColorStop(1,rgba(col,0));
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill();
}
/* cached additive light sprite (fast, used for every bulb every frame) */
const spr=new Map();
function lightSprite(col){
  let c=spr.get(col); if(c) return c;
  c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,rgba(light(col,.35),1)); g.addColorStop(.18,rgba(col,.75)); g.addColorStop(.45,rgba(col,.25)); g.addColorStop(1,rgba(col,0));
  x.fillStyle=g; x.fillRect(0,0,128,128); spr.set(col,c); return c;
}
function addLight(ctx,x,y,r,col,a){ if(a<=0.003||r<=0) return; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=Math.min(1,a); ctx.drawImage(lightSprite(col),x-r,y-r,r*2,r*2); ctx.restore(); }
function shadow(ctx,x,y,w,a=.35){
  ctx.save(); ctx.fillStyle=`rgba(6,2,20,${a})`; ctx.beginPath(); ctx.ellipse(x,y,w*.5,w*.16,0,0,6.2832); ctx.fill(); ctx.restore();
}
const ease = {
  outBack:(t,s=1.7)=>1+(s+1)*Math.pow(t-1,3)+s*Math.pow(t-1,2),
  outCubic:t=>1-Math.pow(1-t,3),
  inCubic:t=>t*t*t,
  outElastic:t=>t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.0944)+1,
};
/* cheap deterministic noise for flicker */
const hash=n=>{ n=Math.sin(n*127.1+311.7)*43758.5453; return n-Math.floor(n); };
const noise=(t)=>{ const i=Math.floor(t), f=t-i, u=f*f*(3-2*f); return hash(i)*(1-u)+hash(i+1)*u; };

/* v4: no borrowed characters. drawChar kept as a no-op so old callers don't crash. */
const chars = {};
function drawChar(){}

/* ===============================================================
   PUBLIC DRAW FUNCTIONS
   =============================================================== */
const A = {};
A.U = 66;
A.scale = { bulb:1, gift:1.15, hat:1.4, snowball:1, nose:1.08, blocker:1.1, coal:.9, topper:1.3, plug:1.1, troll:3.5, biker:3, cloud:2.6, scissors:1.6, splat:1 };
A.PAL = PAL; A.PAL_NAMES = PAL_NAMES; A.INK = INK; A.HAT = HAT;

/* live face, drawn on top of the glass. (x,y) = bulb anchor, s = size */
function face(ctx,x,y,s,ci,o){
  const lit=!!o.lit, scared=!!o.scared, blink=!!o.blink;
  const ex=s*.15, ey=y+s*.2, er=Math.max(s<40?2.2:0, s*(scared?.085:.075));
  const lx=(o.eyeX||0)*s*.05, ly=(o.eyeY||0)*s*.04;
  ctx.save();
  for(const sx of [-1,1]){
    const cx=x+sx*ex+lx, cy=ey+ly;
    if(blink){ ctx.strokeStyle=INK; ctx.lineWidth=Math.max(1.5,s*.04); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx-er,cy); ctx.lineTo(cx+er,cy); ctx.stroke(); continue; }
    if(!lit&&!scared){ ctx.strokeStyle=INK; ctx.lineWidth=Math.max(1.6,s*.045); ctx.lineCap='round'; ctx.beginPath(); ctx.arc(cx,cy-er*.3,er*1.05,.35,Math.PI-.35); ctx.stroke(); continue; }
    ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(cx,cy,er*.95,er*1.25,0,0,6.2832); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-er*.3,cy-er*.45,er*.38,0,6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+er*.35,cy+er*.4,er*.16,0,6.2832); ctx.fill();
  }
  const my=ey+s*.13;
  if(scared){ ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(x+lx,my+ly,s*.045,s*.06,0,0,6.2832); ctx.fill(); }
  else if(lit){ ctx.fillStyle=INK; ctx.beginPath(); ctx.moveTo(x-s*.075+lx,my-s*.01); ctx.quadraticCurveTo(x+lx,my+s*.11,x+s*.075+lx,my-s*.01); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff6f8a'; ctx.beginPath(); ctx.ellipse(x+lx,my+s*.035,s*.035,s*.02,0,0,6.2832); ctx.fill();
    ctx.fillStyle='rgba(255,90,130,.45)'; for(const sx of [-1,1]){ ctx.beginPath(); ctx.ellipse(x+sx*s*.28,ey+s*.08,s*.07,s*.04,0,0,6.2832); ctx.fill(); } }
  else { ctx.strokeStyle=INK; ctx.lineWidth=Math.max(1.4,s*.035); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-s*.04,my); ctx.quadraticCurveTo(x,my+s*.025,x+s*.04,my); ctx.stroke(); }
  ctx.restore();
}

/** body only (glass, cap, face) - no glow. For engines that own the light.
    o: {lit, hover, scared, eyeX, eyeY (-1..1 look direction), blink, face:false to skip, bright 0..1 (cross-fade unlit->lit)} */
A.drawBulbBody = (ctx,x,y,size,ci,o={})=>{
  ci=((ci|0)%6+6)%6;
  const b = o.bright!=null ? o.bright : (o.lit?1:0);
  if(b<1) blit(ctx,img('bulb'+ci+'U',()=>S.bulb(ci,'unlit')),x,y,size);
  if(b>0) blit(ctx,img('bulb'+ci+'L',()=>S.bulb(ci,'lit')),x,y,size,0,1,1,b);
  if(o.face!==false) face(ctx,x,y,size,ci,{lit:b>.5,scared:o.scared,blink:o.blink,eyeX:o.eyeX,eyeY:o.eyeY});
};

/** full bulb with live light. state: 'unlit'|'lit'|'hover'|'dim'|'near'
    opt: {flicker 0..1 (engine-driven level), look:[x,y], scared, seed} */
A.drawBulb = (ctx,x,y,size,ci,state='unlit',t=0,litT,opt={})=>{
  ci=((ci|0)%6+6)%6; const col=PAL[ci], seed=opt.seed!=null?opt.seed:ci*7.3+x*.013+y*.007;
  const lit = state==='lit';
  let s=size, bright=lit?1:0, scared=!!opt.scared;
  if(lit){ bright = .88+.12*noise(t*6+seed*3); if(hash(Math.floor(t*3)+seed)>.985) bright*=.45; }
  let surge=0;
  if(state==='near'||opt.flicker!=null){
    let lv;
    if(opt.flicker!=null) lv=opt.flicker;
    else { const slot=Math.floor(t*14), r=hash(slot+seed*13), burst=noise(t*2.3+seed)>.55;
      lv = burst ? (r>.45?(r>.85?1:.55+r*.4):r*.08) : (r>.93?.4:.03); }
    bright=Math.max(bright,lv); surge=lv>.9?1:0; scared=true;
  }
  const blink=((t+seed*1.37)%4.2)<.12;
  let burstK=null; if(lit&&litT!=null&&litT<.7){ burstK=litT/.7; s=size*(1+.32*Math.sin(Math.min(1,burstK*1.4)*Math.PI)*(1-burstK)); }
  if(bright>0){
    addLight(ctx,x,y+size*.25,size*3.4,col,.45*bright);
    addLight(ctx,x,y,size*1.5,col,.8*bright);
    if(surge) addLight(ctx,x,y,size*2.6,'#ffffff',.5);
  }
  if(state==='hover'){
    const r=size*(.92+.05*Math.sin(t*8));
    ctx.save(); ctx.strokeStyle='rgba(255,240,190,.9)'; ctx.lineWidth=size*.06; ctx.setLineDash([size*.14,size*.12]); ctx.lineDashOffset=-t*size*.6;
    ctx.beginPath(); ctx.arc(x,y+size*.05,r,0,6.2832); ctx.stroke(); ctx.restore(); s*=1.06;
    addLight(ctx,x,y,size*1.4,col,.25);
  }
  if(state==='near'){ const p=bright; ctx.save(); ctx.strokeStyle=`rgba(255,240,205,${.15+.8*p})`; ctx.lineWidth=size*(.03+.05*p); ctx.beginPath(); ctx.arc(x,y,size*1.1,0,6.2832); ctx.stroke(); ctx.restore(); }
  shadow(ctx,x,y+size*.82,size*.8, bright>.5?.22:.4);
  const bob=Math.sin(t*2.1+seed)*size*.012;
  let ex=0, ey=0; if(opt.look){ const a=Math.atan2(opt.look[1]-y,opt.look[0]-x), d=Math.min(1,Math.hypot(opt.look[0]-x,opt.look[1]-y)/(size*3)); ex=Math.cos(a)*d; ey=Math.sin(a)*d; }
  ctx.save(); if(state==='dim') ctx.globalAlpha*=.45;
  A.drawBulbBody(ctx,x,y+bob,s,ci,{bright,scared,blink,eyeX:ex,eyeY:ey});
  ctx.restore();
  if(bright>0) addLight(ctx,x,y-size*.05,size*.75,'#ffffff',.22*bright);
  if(burstK!=null){
    addLight(ctx,x,y,size*(1+2.4*burstK),'#ffffff',.9*(1-burstK));
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=rgba(light(col,.5),.9*(1-burstK)); ctx.lineWidth=size*.08*(1-burstK);
    ctx.beginPath(); ctx.arc(x,y,size*(.6+1.6*ease.outCubic(burstK)),0,6.2832); ctx.stroke();
    for(let i=0;i<8;i++){ const a=i*.785+seed, d=size*(.5+1.5*ease.outCubic(burstK)); ctx.fillStyle=rgba('#fff8d0',1-burstK);
      ctx.beginPath(); ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,size*.05*(1-burstK),0,6.2832); ctx.fill(); }
    ctx.restore();
  }
};

/** "old bulb" badge: a pill with the cord icon and how many more cords this bulb takes.
    Sits on the bulb's top-right shoulder. Min 18 px tall on phones. */
A.drawCapBadge = (ctx,x,y,size,cap,used)=>{
  const left=Math.max(0,cap-used); A.drawCountBadge(ctx,x+size*.46,y-size*.5,size,String(left),{icon:'spool',warn:left<=0});
};
/** generic count badge (cap, gift layers, star unlock). icon: art key or null. */
A.drawCountBadge = (ctx,bx,by,size,text,opt={})=>{
  const h=Math.max(18,size*.46), r=h/2, ic=opt.icon?h*1.05:0;
  ctx.save(); ctx.font=`700 ${Math.round(h*.72)}px "Fredoka","Baloo 2",sans-serif`;
  const tw=ctx.measureText(text).width, w=Math.max(h, ic+tw+h*.55), x0=bx-w/2;
  const pill=(yy)=>{ ctx.beginPath(); ctx.moveTo(x0+r,yy-r); ctx.lineTo(x0+w-r,yy-r); ctx.arc(x0+w-r,yy,r,-1.5708,1.5708); ctx.lineTo(x0+r,yy+r); ctx.arc(x0+r,yy,r,1.5708,4.7124); ctx.closePath(); };
  ctx.fillStyle='rgba(6,2,20,.45)'; pill(by+h*.12); ctx.fill();
  const g=ctx.createLinearGradient(0,by-r,0,by+r);
  if(opt.warn){ g.addColorStop(0,'#ff7a88'); g.addColorStop(1,'#c4142c'); } else { g.addColorStop(0,'#7a5cff'); g.addColorStop(1,'#3a24a0'); }
  ctx.fillStyle=g; pill(by); ctx.fill();
  ctx.lineWidth=Math.max(1.5,h*.09); ctx.strokeStyle=opt.warn?'#ffd0d6':'#b8a6ff'; ctx.stroke();
  if(opt.icon) blit(ctx,img(opt.icon,S[opt.icon]),x0+r*.2+ic/2,by,ic*.95);
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, opt.icon? x0+ic+(w-ic)/2-h*.06 : bx, by+h*.04); ctx.restore();
};

A.drawFrozen = (ctx,x,y,size,ci,state='frozen',t=0,k=0)=>{
  if(state==='thawing'){
    A.drawBulb(ctx,x,y,size,ci,'unlit',t);
    const a=1-k; if(a<=0) return;
    blit(ctx,img('ice',S.ice),x,y,size*1.3*(1+k*.25),0,1,1,a);
    for(let i=0;i<8;i++){const ang=i*.785+.3, d=size*(.6+k*1.4);
      ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#dff6ff'; ctx.translate(x+Math.cos(ang)*d,y+Math.sin(ang)*d); ctx.rotate(ang+k*4);
      ctx.beginPath(); ctx.moveTo(0,-size*.1); ctx.lineTo(size*.07,size*.06); ctx.lineTo(-size*.06,size*.05); ctx.closePath(); ctx.fill(); ctx.restore();}
    return;
  }
  shadow(ctx,x,y+size*.85,size*.95,.35);
  addLight(ctx,x,y,size*1.2,'#7fd0ff',.25);
  blit(ctx,img('frz'+ci,()=>S.frozen(ci)),x,y,size*1.3);
  const tw=(Math.sin(t*1.3+x)*.5+.5);
  ctx.save(); ctx.globalAlpha=.9*tw; ctx.fillStyle='#fff'; ctx.translate(x+size*.34,y-size*.5);
  ctx.beginPath(); for(let i=0;i<8;i++){const r=i%2?size*.025:size*.11, a=i*.785; ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} ctx.fill(); ctx.restore();
};

A.drawGift = (ctx,x,y,size,state='closed',t=0,opt={})=>{
  const ribbon = opt.ribbon || (opt.ribbonCi!=null ? PAL[opt.ribbonCi] : '#ffc21a');
  const box = opt.box || (opt.ribbonCi!=null ? (opt.ribbonCi===0||opt.ribbonCi===5?'#2f86ff':'#f0283c') : '#f0283c');
  const kb = 'g'+box+ribbon;
  const eB=img(kb+'b',()=>S.giftBox(box,ribbon)), eL=img(kb+'l',()=>S.giftLid(box,ribbon));
  if(state==='gone') return;
  if(state==='open'){ shadow(ctx,x,y+size*.45,size*.9,.18); blit(ctx,eB,x,y,size); return; } // v4.3: box with the lid off (welcome gift after the burst)
  if(state==='closed'){
    const hop = Math.max(0,Math.sin(t*2.4+x*.01)-.93)/.07;
    const wig = hop>0 ? Math.sin(t*40)*.07*hop : 0;
    shadow(ctx,x,y+size*.45,size*1.05*(1-hop*.1));
    blit(ctx,eB,x,y-hop*size*.06,size,wig);
    blit(ctx,eL,x,y-hop*size*.12,size,wig);
    if(opt.layers>1) A.drawLayerBadge(ctx,x,y,size,opt.layers);
    return;
  }
  const kk = opt.k ?? 0;
  const shake = kk<.25 ? Math.sin(kk*120)*.12*(1-kk*4) : 0;
  const lidK = Math.min(1,Math.max(0,(kk-.22)/.5));
  shadow(ctx,x,y+size*.45,size*1.05*(1-Math.max(0,kk-.7)*2));
  if(kk>.22){ addLight(ctx,x,y-size*.2,size*(1.2+lidK*1.6),'#ffd76a',1-Math.max(0,kk-.6)*2.5);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.5*(1-lidK); ctx.translate(x,y-size*.1); { const rg=ctx.createRadialGradient(0,0,0,0,0,size*2*Math.max(.05,lidK)); rg.addColorStop(0,'rgba(255,243,192,1)'); rg.addColorStop(1,'rgba(255,200,80,0)'); ctx.fillStyle=rg; }
    for(let i=0;i<7;i++){ ctx.save(); ctx.rotate((i-3)*.28); ctx.beginPath(); ctx.moveTo(-size*.05,0); ctx.lineTo(size*.05,0); ctx.lineTo(size*.12,-size*2*lidK); ctx.lineTo(-size*.12,-size*2*lidK); ctx.fill(); ctx.restore(); } ctx.restore(); }
  const boxA = kk<.7?1:Math.max(0,1-(kk-.7)/.3);
  blit(ctx,eB,x,y+size*.3*Math.max(0,kk-.7)/.3,size*(1+.08*Math.sin(kk*30)*(kk<.25?1:0)),shake,1,1,boxA);
  if(lidK<1) blit(ctx,eL,x+size*.5*ease.outCubic(lidK),y-size*1.6*ease.outCubic(lidK)+size*1.2*lidK*lidK,size,shake+lidK*2.4,1,1,1-lidK*.9);
  if(kk>.22&&kk<1){ for(let i=0;i<12;i++){const a=i*.524+1, d=size*(.3+lidK*1.4), c=PAL[i%6];
    ctx.save(); ctx.globalAlpha=1-lidK; ctx.fillStyle=c; ctx.translate(x+Math.cos(a)*d,y-size*.2+Math.sin(a)*d*.8+lidK*lidK*size*.6); ctx.rotate(a+lidK*8);
    ctx.fillRect(-size*.06,-size*.025,size*.12,size*.05); ctx.restore(); } }
};
A.drawLayerBadge=(ctx,x,y,size,n)=>A.drawCountBadge(ctx,x+size*.5,y-size*.5,size,'\u00d7'+n);

A.drawHat = (ctx,x,y,size,colour='red',dir=0,t=0,state='idle',k=0)=>{
  const hot = state==='in'||state==='out';
  const rot = dir*Math.PI/180, flipY = Math.cos(rot)<-.01 ? -1 : 1;
  const breathe = 1+Math.sin(t*2+x)*.02;
  shadow(ctx,x,y+size*.32,size*.9,.3);
  addLight(ctx,x+Math.cos(rot)*size*.32,y+Math.sin(rot)*size*.32,size*(hot?.9+.5*Math.sin(k*Math.PI):.45),HAT[colour]||'#fff',hot?.9:.35+.15*Math.sin(t*3));
  if(state==='out'){ const kick=Math.sin(Math.min(1,k*3)*Math.PI)*.12; blit(ctx,img('hat'+colour+'1',()=>S.hat(colour,true)),x,y,size*(1+kick),rot,1,flipY); return; }
  const sq = state==='in' ? 1+Math.sin(k*Math.PI)*.12 : breathe;
  blit(ctx,img('hat'+colour+(hot?1:0),()=>S.hat(colour,hot)),x,y,size,rot,sq,flipY/sq, state==='spent'?.5:1);
  const tw=(Math.sin(t*3+(colour==='red'?0:colour==='green'?2:4))*.5+.5);
  ctx.save(); ctx.globalAlpha=.9*tw; ctx.fillStyle='#fff'; const px=x-Math.cos(rot)*size*.42, py=y-Math.sin(rot)*size*.42-size*.05*flipY;
  ctx.translate(px,py); ctx.beginPath(); for(let i=0;i<8;i++){const r=i%2?size*.022:size*.08,a=i*.785;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} ctx.fill(); ctx.restore();
};

A.drawSpark = (ctx,x,y,size,t=0,trail)=>{
  if(trail&&trail.length>1){
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
    for(let i=1;i<trail.length;i++){const a=i/trail.length; ctx.strokeStyle=`rgba(255,${200+40*a|0},${120*a|0},${a*.7})`; ctx.lineWidth=size*.35*a;
      ctx.beginPath(); ctx.moveTo(trail[i-1][0],trail[i-1][1]); ctx.lineTo(trail[i][0],trail[i][1]); ctx.stroke();}
    ctx.restore();
  }
  addLight(ctx,x,y,size*1.4,'#ffc21a',1); addLight(ctx,x,y,size*.5,'#ffffff',1);
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.translate(x,y); ctx.rotate(t*6); ctx.fillStyle='#fff';
  ctx.beginPath(); for(let i=0;i<8;i++){const r=i%2?size*.08:size*.55*(1+.2*Math.sin(t*20)),a=i*.785;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);} ctx.fill();
  ctx.restore();
};

/** Rudolph: antlers + ears behind a round nose bulb. (x,y) = nose centre, size = nose width */
A.drawRudolph = (ctx,x,y,size,noseLit=false,t=0,litT,opt={})=>{
  const bob=Math.sin(t*1.6)*size*.03, wig=Math.sin(t*2.2)*.04;
  shadow(ctx,x,y+size*.62,size*1.1,.35);
  blit(ctx,img('antlers',S.antlers),x,y-size*.1+bob,size*1.9,wig);
  if(!opt.noNose) A.drawNose(ctx,x,y+bob,size,noseLit,t,litT);
};
/** the glowing round nose bulb (draw over a bulb to make it Rudolph's nose) */
A.drawNose = (ctx,x,y,size,lit=false,t=0,litT)=>{
  const r=size*.44;
  let pop=1; if(lit&&litT!=null&&litT<.5) pop=1+.3*Math.sin(litT/.5*Math.PI);
  if(lit){ const p=.85+.15*Math.sin(t*4); addLight(ctx,x,y+size*.2,size*3,'#ff2a3a',.5*p); addLight(ctx,x,y,size*1.4,'#ff4050',.9*p); }
  else { const p=.8+.2*Math.sin(t*1.7); addLight(ctx,x,y,size*1.25,'#ff3a4a',.22*p); }
  ctx.save(); ctx.translate(x,y); ctx.scale(pop,pop);
  const g=ctx.createRadialGradient(-r*.3,-r*.35,0,0,0,r*1.05);
  if(lit){ g.addColorStop(0,'#ffffff'); g.addColorStop(.25,'#ff8a8a'); g.addColorStop(.7,'#f01c34'); g.addColorStop(1,'#a00c22'); }
  else { g.addColorStop(0,'#ffb0b8'); g.addColorStop(.3,'#e04858'); g.addColorStop(.75,'#a81a30'); g.addColorStop(1,'#6a0c1e'); }
  ctx.fillStyle='rgba(6,2,20,.3)'; ctx.beginPath(); ctx.ellipse(0,r*.12,r,r*.95,0,0,6.2832); ctx.fill();
  ctx.globalAlpha=lit?1:.92; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,r,0,6.2832); ctx.fill(); ctx.globalAlpha=1;
  if(!lit){ const ig=ctx.createRadialGradient(0,r*.15,0,0,r*.15,r*.6); ig.addColorStop(0,'rgba(255,120,110,.55)'); ig.addColorStop(1,'rgba(255,120,110,0)'); ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(0,0,r,0,6.2832); ctx.fill(); }
  ctx.strokeStyle=lit?'rgba(255,220,220,.5)':'rgba(255,190,200,.45)'; ctx.lineWidth=Math.max(1,r*.06); ctx.beginPath(); ctx.arc(0,0,r*.97,0,6.2832); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(-r*.38,-r*.42,r*.22,r*.13,-.6,0,6.2832); ctx.fill();
  face(ctx,0,-r*.55,size*.95,0,{lit,blink:((t+1.3)%4.6)<.12});
  ctx.restore();
};

A.drawSnowball = (ctx,x,y,r,t=0,state='idle',k=0,from)=>{
  const e=img('snowball',S.snowball), size=r*2;
  if(state==='shadow'){
    const p=.5+.5*Math.sin(t*10);
    shadow(ctx,x,y,size*(.6+.5*k),.2+.2*k);
    ctx.save(); ctx.strokeStyle=`rgba(255,80,100,${.35+.45*p})`; ctx.lineWidth=r*.12; ctx.setLineDash([r*.3,r*.2]); ctx.lineDashOffset=t*r*2;
    ctx.beginPath(); ctx.ellipse(x,y,r*1.05,r*.42,0,0,6.2832); ctx.stroke(); ctx.restore(); return;
  }
  if(state==='flying'){
    const fx=from?from[0]:x, fy=from?from[1]:y-r*12;
    const px=fx+(x-fx)*k, py=fy+(y-fy)*k - Math.sin(k*Math.PI)*r*6;
    shadow(ctx,x,y,size*(.4+.7*k),.12+.2*k);
    blit(ctx,e,px,py,size*(1+(1-k)*.6),t*9); return;
  }
  if(state==='land'){
    const sq=Math.sin(k*Math.PI)*(1-k);
    shadow(ctx,x,y+r*.8,size*1.1);
    blit(ctx,e,x,y+r*.25*sq,size,0,1+.35*sq,1-.3*sq);
    if(k<.6){ for(let i=0;i<10;i++){const a=Math.PI+i*.35-.1, d=r*(1+k*2.2); ctx.save(); ctx.globalAlpha=1-k/.6; ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(x+Math.cos(a)*d,y+r*.6+Math.sin(a)*d*.5-k*r*.6,r*.12*(1-k),0,6.2832); ctx.fill(); ctx.restore(); } }
    return;
  }
  if(state==='melt'){
    ctx.save(); ctx.fillStyle=`rgba(140,200,255,${.4*(1-k*.6)})`;
    ctx.beginPath(); ctx.ellipse(x,y+r*.75,r*(.9+k*.9),r*(.3+k*.25),0,0,6.2832); ctx.fill(); ctx.restore();
    if(k<1) blit(ctx,e,x,y+r*.75*k,size*(1-k*.7),Math.sin(t*20)*.04*(1-k),1+k*.3,1-k*.85,1-k*k);
    addLight(ctx,x,y,r*2*(1-k),'#ffd36a',.5*(1-k));
    return;
  }
  shadow(ctx,x,y+r*.85,size*1.05);
  blit(ctx,e,x,y,size);
};

A.drawCoal = (ctx,x,y,size,t=0)=>{
  shadow(ctx,x,y+size*.45,size*1.1);
  addLight(ctx,x,y+size*.1,size*.9,'#ff6a1f',.25+.15*noise(t*3+x));
  const huff = Math.sin(t*1.5+x)>.96 ? 1.06 : 1;
  blit(ctx,img('coal',S.coal),x,y,size*huff);
};

A.drawBlocker = (ctx,x,y,r,kind='rock',t=0)=>{
  const make={cane:S.cane,snowman:S.snowman,ginger:S.ginger,mitten:()=>S.mitten(),rock:S.rock}[kind]||S.rock;
  const size=r*2*(kind==='snowman'?.62:kind==='cane'?.72:1);
  shadow(ctx,x,y+r*.85,r*2);
  const sway = kind==='snowman'||kind==='ginger' ? Math.sin(t*1.8+x)*.03 : 0;
  blit(ctx,img('blk'+kind,make),x,y,size,sway);
};

A.drawTopper = (ctx,x,y,size,state='locked',t=0,unlockK)=>{
  if(state==='lit'){ const p=.85+.15*Math.sin(t*2.5); addLight(ctx,x,y,size*2.2*p,'#ffc21a',.8);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.3; ctx.translate(x,y); ctx.rotate(t*.3); ctx.fillStyle='#fff6c0';
    for(let i=0;i<8;i++){ctx.rotate(.785); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(size*.09,-size*1.7); ctx.lineTo(-size*.09,-size*1.7); ctx.fill();} ctx.restore(); }
  let s=size; if(unlockK!=null&&unlockK<1) s=size*(1+.4*Math.sin(unlockK*Math.PI));
  shadow(ctx,x,y+size*.55,size*.8);
  blit(ctx,img('star'+state,()=>S.star(state)),x,y+Math.sin(t*2)*size*.02,s,state==='lit'?Math.sin(t*1.5)*.06:0);
};

A.drawPlug = (ctx,x,y,size,powered=false,t=0)=>{
  if(powered) addLight(ctx,x,y,size*1.7,'#ffc21a',.6+.2*Math.sin(t*6));
  shadow(ctx,x,y+size*.62,size*.9);
  blit(ctx,img('plug'+(powered?1:0),()=>S.plug(powered)),x,y,size);
};

/** pts [[x,y]x3], cis corner colour indexes. state 'lit'|'dark'|'flash' (k 0..1) */
A.drawTriangle = (ctx,pts,cis,state='lit',t=0,k=1)=>{
  const cx=(pts[0][0]+pts[1][0]+pts[2][0])/3, cy=(pts[0][1]+pts[1][1]+pts[2][1])/3;
  ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[1][0],pts[1][1]); ctx.lineTo(pts[2][0],pts[2][1]); ctx.closePath();
  if(state==='dark'){
    ctx.fillStyle='rgba(10,6,30,.35)'; ctx.fill();
    ctx.setLineDash([8,8]); ctx.lineDashOffset=-t*20; ctx.strokeStyle='rgba(170,180,255,.5)'; ctx.lineWidth=3; ctx.stroke(); ctx.restore(); return;
  }
  ctx.clip(); ctx.globalCompositeOperation='lighter';
  const R=Math.max(...pts.map(p=>Math.hypot(p[0]-cx,p[1]-cy)));
  const pulse=.85+.15*Math.sin(t*2.2+cx*.02);
  pts.forEach((p,i)=>{ const g=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],R*1.7); const c=PAL[cis[i]%6];
    g.addColorStop(0,rgba(c,.6*pulse)); g.addColorStop(1,rgba(c,0)); ctx.fillStyle=g; ctx.fillRect(cx-R*2,cy-R*2,R*4,R*4); });
  ctx.fillStyle='rgba(255,250,220,.8)';
  for(let i=0;i<6;i++){ const a=hash(i+cx)*6.28, d=R*.6*hash(i*3+cy), tw=Math.max(0,Math.sin(t*3+i*2.1)); if(tw<.2) continue;
    const px=cx+Math.cos(a+t*.2)*d, py=cy+Math.sin(a+t*.2)*d, s=R*.04*tw; ctx.beginPath(); ctx.moveTo(px,py-s*2); ctx.lineTo(px+s*.5,py); ctx.lineTo(px,py+s*2); ctx.lineTo(px-s*.5,py); ctx.fill(); ctx.beginPath(); ctx.moveTo(px-s*2,py); ctx.lineTo(px,py+s*.5); ctx.lineTo(px+s*2,py); ctx.lineTo(px,py-s*.5); ctx.fill(); }
  if(state==='flash'){ ctx.fillStyle=`rgba(255,255,255,${.75*(1-k)})`; ctx.fillRect(cx-R*2,cy-R*2,R*4,R*4); }
  ctx.restore();
};

/** cord between bulbs: glossy green wire. state 'idle'|'lit'|'drag'|'snapped' (k 0..1) */
A.drawCord = (ctx,x1,y1,x2,y2,state='idle',t=0,k=0,size=A.U)=>{
  const w=size*.11, len=Math.hypot(x2-x1,y2-y1), ang=Math.atan2(y2-y1,x2-x1);
  ctx.save(); ctx.translate(x1,y1); ctx.rotate(ang); ctx.lineCap='round';
  if(state==='snapped'){
    const r=len*.5*ease.outCubic(k); ctx.globalAlpha=1-k;
    ctx.strokeStyle='#1d8a4a'; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(len*.25-r*.3,size*.3*k,len*.5-r,size*.2*k); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(len,0); ctx.quadraticCurveTo(len*.75+r*.3,-size*.3*k,len*.5+r,-size*.2*k); ctx.stroke();
    ctx.restore(); return;
  }
  if(state==='lit'){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='rgba(255,210,110,.28)'; ctx.lineWidth=w*4.5; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len,0); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle='rgba(6,2,20,.45)'; ctx.lineWidth=w*1.3; ctx.beginPath(); ctx.moveTo(0,w*.6); ctx.lineTo(len,w*.6); ctx.stroke();
  const g=ctx.createLinearGradient(0,-w/2,0,w/2); g.addColorStop(0,state==='drag'?'#8af0b0':'#5fe08f'); g.addColorStop(.5,state==='drag'?'#2fc46a':'#1fa357'); g.addColorStop(1,'#0e6634');
  ctx.strokeStyle=g; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len,0); ctx.stroke();
  ctx.strokeStyle='rgba(220,255,230,.6)'; ctx.lineWidth=w*.25; ctx.setLineDash([w*1.6,w*1.4]); ctx.lineDashOffset=state==='lit'?-t*30:0;
  ctx.beginPath(); ctx.moveTo(0,-w*.22); ctx.lineTo(len,-w*.22); ctx.stroke(); ctx.setLineDash([]);
  if(state==='lit'){ const n=Math.max(1,len/(size*1.2)|0); for(let i=0;i<n;i++){ const p=((t*.45+i/n)%1)*len; addLight(ctx,p,0,w*2.2,'#ffe7a0',.9); } }
  ctx.restore();
};

/* hazards that still use Zeljko's character art */
/* v4: Troll and Biker removed (his characters). Old names now draw the new cast. */
A.drawTroll = (ctx,x,y,size,phase='peek',t=0,k=1)=>A.drawCloud(ctx,x,y,size,t,{mood:phase==='throw'?'puff':phase==='gloat'?'laugh':phase==='sulk'?'sleep':'smug',squeeze:phase==='throw'?Math.sin(Math.min(1,k)*Math.PI):0});
A.drawBiker = (ctx,x1,y1,x2,y2,size,t=0,k=0)=>A.drawSnipRun(ctx,x1,y1,x2,y2,size*.6,t,k);

A.drawIce = (ctx,x,y,size,alpha=1)=>blit(ctx,img('ice',S.ice),x,y,size*1.3,-.05,1,1,alpha);
A.drawMitten = (ctx,x,y,size,press=0,alpha=1)=>{
  /* v3.1: fingertip touches the bulb's lower-right edge; the mitten hangs below-right so the bulb stays visible */
  blit(ctx,img('mit',()=>S.mitten()),x+size*.5,y+size*.88,size*.9,-.5,1-press*.08,1-press*.12,alpha);
};

/* ===============================================================
   v3 SCENE: a dark winter night so the light pops, and a rounded
   evergreen tray as the board (fairy lights twinkle round its rim).
   =============================================================== */
const R0=seed=>()=>((seed=Math.imul(seed^seed>>>15,1|seed)+0x6D2B79F5|0)>>>0)/4294967296;
/** night backdrop. opts.light = [x,y] 0..1 where the soft glow sits, opts.seed */
A.paintBackdrop = (ctx,w,h,opts={})=>{
  const L=opts.light||[.5,.38], R=R0(opts.seed||7);
  ctx.save();
  let g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1a1145'); g.addColorStop(.55,'#2a1a63'); g.addColorStop(1,'#140b33');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  g=ctx.createRadialGradient(w*L[0],h*L[1],0,w*L[0],h*L[1],Math.max(w,h)*.7);
  g.addColorStop(0,'rgba(140,90,255,.38)'); g.addColorStop(.5,'rgba(90,50,200,.14)'); g.addColorStop(1,'rgba(40,20,120,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<18;i++){ const x=R()*w,y=R()*h,r=8+R()*30,c=PAL[(R()*6)|0]; const bg=ctx.createRadialGradient(x,y,0,x,y,r);
    bg.addColorStop(0,rgba(c,.16)); bg.addColorStop(.7,rgba(c,.06)); bg.addColorStop(1,rgba(c,0)); ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }
  for(let i=0;i<(w*h)/2600;i++){ const x=R()*w,y=R()*h,r=.6+R()*1.6; ctx.fillStyle=`rgba(255,255,255,${.15+R()*.4})`; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }
  ctx.globalCompositeOperation='source-over';
  g=ctx.createRadialGradient(w/2,h*.45,Math.min(w,h)*.3,w/2,h*.5,Math.max(w,h)*.8);
  g.addColorStop(0,'rgba(8,4,24,0)'); g.addColorStop(1,'rgba(8,4,24,.6)'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.restore();
};
const bdCache=new Map();
A.backdrop = (w,h,opts={})=>{
  const d=Math.min(2,(typeof devicePixelRatio!=='undefined'?devicePixelRatio:1)||1), key=[w,h,d,JSON.stringify(opts)].join();
  let c=bdCache.get(key); if(c) return c;
  c=document.createElement('canvas'); c.width=Math.round(w*d); c.height=Math.round(h*d);
  const x=c.getContext('2d'); x.scale(d,d); A.paintBackdrop(x,w,h,opts); bdCache.set(key,c); return c;
};

/** The board: a rounded evergreen tray with a deep night well. (x,y) top-left, w/h size.
    glow 0..1 warms the well as triangles light. Cache it per glow step (pass t=0),
    then call drawTrayLights each frame for the twinkling rim lights. */
A.drawBoardTray = (ctx,x,y,w,h,t=0,glow=0,opt={})=>{
  const rim=Math.min(w,h)*(opt.rim||.045), r=Math.min(w,h)*.09;
  const rr=(p,i,rad)=>{ p.moveTo(x+i+rad,y+i); p.arcTo(x+w-i,y+i,x+w-i,y+h-i,rad); p.arcTo(x+w-i,y+h-i,x+i,y+h-i,rad); p.arcTo(x+i,y+h-i,x+i,y+i,rad); p.arcTo(x+i,y+i,x+w-i,y+i,rad); p.closePath(); };
  const outer=new Path2D(); rr(outer,0,r);
  const well=new Path2D(); rr(well,rim,Math.max(4,r-rim));
  ctx.save();
  ctx.save(); ctx.translate(0,rim*.5); ctx.fillStyle='rgba(4,2,16,.55)'; ctx.filter='blur(10px)'; ctx.fill(outer); ctx.restore();
  let g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#3fcf7f'); g.addColorStop(.08,'#1e9a56'); g.addColorStop(.92,'#137a42'); g.addColorStop(1,'#0b5a30');
  ctx.fillStyle=g; ctx.fill(outer);
  ctx.save(); ctx.clip(outer); ctx.strokeStyle='rgba(200,255,220,.55)'; ctx.lineWidth=rim*.35; ctx.translate(0,rim*.12); ctx.stroke(outer); ctx.restore();
  g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#0c0828'); g.addColorStop(1,'#1b1248');
  ctx.fillStyle=g; ctx.fill(well);
  ctx.save(); ctx.clip(well);
  const gg=ctx.createRadialGradient(x+w/2,y+h*.5,0,x+w/2,y+h*.5,Math.max(w,h)*.65);
  gg.addColorStop(0,`rgba(${110+90*glow|0},${70+60*glow|0},${200-40*glow|0},${.35+.25*glow})`); gg.addColorStop(1,'rgba(40,20,100,0)');
  ctx.fillStyle=gg; ctx.fillRect(x,y,w,h);
  const R=R0(9); ctx.strokeStyle='rgba(180,170,255,.07)'; ctx.lineWidth=1.5; ctx.lineCap='round';
  for(let i=0;i<Math.round(w*h/9000);i++){ const fx=x+R()*w, fy=y+R()*h, fs=6+R()*10; for(let k=0;k<3;k++){ const a=k*1.047; ctx.beginPath(); ctx.moveTo(fx-Math.cos(a)*fs,fy-Math.sin(a)*fs); ctx.lineTo(fx+Math.cos(a)*fs,fy+Math.sin(a)*fs); ctx.stroke(); } }
  ctx.strokeStyle='rgba(0,0,10,.55)'; ctx.lineWidth=rim*1.2; ctx.filter='blur(4px)'; ctx.translate(0,rim*.25); ctx.stroke(well);
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1.5; ctx.stroke(well);
  ctx.restore();
  if(t) A.drawTrayLights(ctx,x,y,w,h,t,opt);
};
/** fairy lights twinkling along the tray rim (cheap; call every frame over a cached tray) */
A.drawTrayLights = (ctx,x,y,w,h,t=0,opt={})=>{
  const rim=Math.min(w,h)*(opt.rim||.045), m=rim*.5, n=Math.max(8,Math.round((w+h)*2/(rim*3.2)));
  const W=w-2*m, H=h-2*m, per=2*(W+H);
  for(let i=0;i<n;i++){ let d=(i/n)*per, px, py;
    if(d<W){px=x+m+d;py=y+m;} else if((d-=W)<H){px=x+w-m;py=y+m+d;} else if((d-=H)<W){px=x+w-m-d;py=y+h-m;} else {d-=W;px=x+m;py=y+h-m-d;}
    const c=PAL[i%6], tw=.5+.5*Math.sin(t*2.6+i*1.9), r=rim*.2;
    addLight(ctx,px,py,rim*(.7+.5*tw),c,.55*tw+.15);
    ctx.fillStyle=light(c,.35*tw); ctx.beginPath(); ctx.arc(px,py,r,0,6.2832); ctx.fill();
  }
};
/* v2 names kept so merged code keeps working: both now draw the tray */
A.drawTreeBoard = (ctx,cx,top,w,h,t=0,glow=0)=>A.drawBoardTray(ctx,cx-w/2,top,w,h,t,glow);
A.drawFeltMat = (ctx,x,y,w,h,t=0,glow=0)=>A.drawBoardTray(ctx,x,y,w,h,t,glow);

/** v4.1 card mascot: a bulb that ACTS. No stick arms; the whole body squashes, hops and sulks,
    and a little curly cord tail with a plug wags or droops behind it.
    mood 'happy' (level card, win dance): hop cycle with anticipation squash, stretch, twirl, landing sparkles, light pulse.
    mood 'sad' (so close / fail): unlit, keeps trying to switch on (sputtering flickers + tiny zap), droopy worried face,
             a tear now and then, slumps with a sigh, then looks up hopefully.
    mood 'wow': wide eyes, little shiver. */
A.drawMascot = (ctx,x,y,size,ci,mood='happy',t=0)=>{
  ci=((ci|0)%6+6)%6; const col=PAL[ci], s=size, T=6.2832;
  let dy=0, sx=1, sy=1, rot=0, bright=1, eyes='open', look=0, tear=0, zap=0, land=0, tail=0;
  if(mood==='happy'){
    const P=1.15, ph=((t+ci*.21)%P)/P;
    if(ph<.14){ const k=ph/.14; sx=1+.14*Math.sin(k*Math.PI/2); sy=1-.16*Math.sin(k*Math.PI/2); }
    else if(ph<.62){ const k=(ph-.14)/.48; dy=-s*.42*Math.sin(k*Math.PI); sy=1+.12*(1-k*2)*(k<.5?1:-.4); sx=2-sy; rot=Math.sin(k*Math.PI)*.22*((Math.floor((t+ci*.21)/P)%2)?1:-1); if(k>.25&&k<.75) eyes='joy'; }
    else if(ph<.74){ const k=(ph-.62)/.12; sx=1+.16*Math.sin(k*Math.PI); sy=1-.18*Math.sin(k*Math.PI); land=k; }
    else { rot=Math.sin((ph-.74)/.26*Math.PI*2)*.05; }
    bright=.85+.15*Math.sin(t*9)+(dy<0?.1:0); tail=Math.sin(t*14)*.5;
  } else if(mood==='sad'){
    const P=3.4, ph=((t+ci*.5)%P)/P;
    // sigh: slump down and squash, lean
    const sigh=Math.max(0,Math.sin(ph*T));
    sy=1-.05*sigh; sx=1+.03*sigh; rot=.14+.04*Math.sin(t*1.3); dy=s*.03*sigh;
    // sputter: around ph .55-.72 it tries to light up
    bright=0;
    if(ph>.55&&ph<.72){ const k=(ph-.55)/.17, n=hash(Math.floor(t*22)+ci); bright=n>.45?(.25+.4*n)*(1-k*.6):0; zap=n>.8?1:0; look=-1; eyes='hope'; }
    else if(ph>.72&&ph<.82){ eyes='open'; look=-.6; }
    else eyes='droop';
    const tp=((t+ci*.7)%4.6)/4.6; if(tp<.45) tear=tp/.45;
    tail=-1;
  } else { sx=1+.03*Math.sin(t*40); bright=.8; eyes='wow'; tail=Math.sin(t*20)*.3; }
  const yy=y+dy;
  // contact shadow stays on the ground while the bulb hops
  const hgt=Math.max(0,-dy)/(s*.42);
  ctx.save(); ctx.fillStyle=`rgba(6,2,20,${.35-.18*hgt})`; ctx.beginPath(); ctx.ellipse(x,y+s*.72,s*.34*(1-.3*hgt)*sx,s*.07,0,0,T); ctx.fill(); ctx.restore();
  if(bright>0) addLight(ctx,x,yy,s*(1+.25*bright),col,.75*bright);
  // the cord tail with a little plug
  ctx.save(); ctx.translate(x,yy); ctx.rotate(rot);
  const cy=s*.6; ctx.lineCap='round'; ctx.lineWidth=s*.09; ctx.strokeStyle='#1fa858';
  ctx.beginPath(); ctx.moveTo(0,cy);
  let ex, ey;
  if(tail===-1){ ex=s*.72; ey=s*.7-dy; ctx.bezierCurveTo(s*.05,cy+s*.22,s*.35,s*.84-dy,ex,ey); }
  else { const w=tail; ex=s*(.68+.12*w); ey=cy-s*(.12+.3*w); ctx.bezierCurveTo(s*.12,cy+s*.26,s*.5,cy+s*.26,s*.52,cy+s*.04); ctx.bezierCurveTo(s*.54,cy-s*.14,s*.36,cy-s*.16,s*.4,cy-s*.03); ctx.quadraticCurveTo(s*.48,cy+s*.1,ex,ey); }
  ctx.stroke(); ctx.strokeStyle='rgba(200,255,220,.6)'; ctx.lineWidth=s*.02; ctx.stroke();
  ctx.save(); ctx.translate(ex,ey); ctx.rotate(tail===-1?.2:-.6+tail*.6);
  const pg=ctx.createLinearGradient(0,-s*.08,0,s*.08); pg.addColorStop(0,'#fffaf0'); pg.addColorStop(1,'#d9bd84');
  ctx.fillStyle='#e0a400'; ctx.fillRect(s*.1,-s*.06,s*.09,s*.035); ctx.fillRect(s*.1,s*.025,s*.09,s*.035);
  ctx.fillStyle=pg; ctx.beginPath(); ctx.roundRect?ctx.roundRect(-s*.03,-s*.1,s*.14,s*.2,s*.05):ctx.rect(-s*.03,-s*.1,s*.14,s*.2); ctx.fill(); ctx.restore();
  ctx.restore();
  // body
  ctx.save(); ctx.translate(x,yy+s*.6); ctx.rotate(rot); ctx.scale(sx,sy); ctx.translate(0,-s*.6);
  A.drawBulbBody(ctx,0,0,s,ci,{bright:Math.min(1,bright),face:false});
  if(zap){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='#fff6b0'; ctx.lineWidth=s*.03; ctx.beginPath(); ctx.moveTo(-s*.1,s*.05); ctx.lineTo(-s*.02,-s*.05); ctx.lineTo(s*.03,s*.04); ctx.lineTo(s*.11,-s*.06); ctx.stroke(); ctx.restore(); }
  // face
  const fy=s*.2, ex2=s*.15, er=s*.085, lk=look*s*.03;
  ctx.fillStyle=INK; ctx.strokeStyle=INK; ctx.lineCap='round'; ctx.lineJoin='round';
  for(const d of [-1,1]){ const cx=d*ex2, cy=fy+lk;
    if(eyes==='joy'){ ctx.lineWidth=s*.05; ctx.beginPath(); ctx.arc(cx,cy+er*.4,er,Math.PI+.35,-.35); ctx.stroke(); continue; }
    const open = eyes==='wow'?1.35 : 1;
    if(eyes==='droop'){ // heavy-lidded: bottom half of the eye, flat lid on top, glint low
      ctx.beginPath(); ctx.ellipse(cx,cy,er,er*1.1,0,0,Math.PI); ctx.closePath(); ctx.fill();
      ctx.lineWidth=s*.03; ctx.beginPath(); ctx.moveTo(cx-er*1.15,cy-er*.1*d); ctx.lineTo(cx+er*1.15,cy+er*.1*d); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-er*.35,cy+er*.35,er*.3,0,T); ctx.fill(); ctx.fillStyle=INK;
      ctx.lineWidth=s*.03; ctx.beginPath(); ctx.moveTo(cx+d*er*1.1,cy-er*1.0); ctx.lineTo(cx-d*er*.8,cy-er*1.55); ctx.stroke(); continue; }
    ctx.beginPath(); ctx.ellipse(cx,cy,er,er*1.3*open,0,0,T); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-er*.32,cy-er*.5*open,er*.42,0,T); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+er*.38,cy+er*.35*open,er*.18,0,T); ctx.fill(); ctx.fillStyle=INK;
    if(eyes==='hope'){ // worried brows: high in the middle
      ctx.lineWidth=s*.03; ctx.beginPath(); ctx.moveTo(cx+d*er*1.1,cy-er*1.5); ctx.lineTo(cx-d*er*.9,cy-er*(eyes==='hope'?2.3:2)); ctx.stroke();
    }
  }
  const my=fy+s*.16;
  if(mood==='happy'){ ctx.beginPath(); ctx.moveTo(-s*.1,my-s*.02); ctx.quadraticCurveTo(0,my+s*.16,s*.1,my-s*.02); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ff6f8a'; ctx.beginPath(); ctx.ellipse(0,my+s*.06,s*.045,s*.025,0,0,T); ctx.fill();
    ctx.fillStyle='rgba(255,90,130,.5)'; for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*s*.29,fy+s*.1,s*.075,s*.045,0,0,T); ctx.fill(); } }
  else if(mood==='sad'){ ctx.lineWidth=s*.035; ctx.beginPath(); ctx.moveTo(-s*.07,my+s*.04); ctx.quadraticCurveTo(-s*.035,my-s*.01,0,my+s*.02); ctx.quadraticCurveTo(s*.035,my-s*.01,s*.07,my+s*.04); ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(0,my+s*.02,s*.045,s*.06,0,0,T); ctx.fill(); }
  if(tear>0){ const tx=ex2+er*.6, ty=fy+er*.8+tear*tear*s*.45, tr=s*.035*(tear<.2?tear/.2:1);
    ctx.fillStyle='rgba(170,220,255,.95)'; ctx.beginPath(); ctx.moveTo(tx,ty-tr*1.8); ctx.quadraticCurveTo(tx+tr*1.1,ty,tx,ty+tr); ctx.quadraticCurveTo(tx-tr*1.1,ty,tx,ty-tr*1.8); ctx.fill(); }
  ctx.restore();
  if(mood==='sad'&&zap){ for(let i=0;i<4;i++){ const a=hash(Math.floor(t*22)+i)*T; ctx.fillStyle='#fff3a0'; ctx.beginPath(); ctx.arc(x+Math.cos(a)*s*.45,yy-s*.05+Math.sin(a)*s*.35,s*.025,0,T); ctx.fill(); } }
  // landing sparkles
  if(land>0&&land<1){ ctx.save(); ctx.globalAlpha=1-land; for(let i=0;i<6;i++){ const a=Math.PI+(i+.5)/6*Math.PI, d=s*(.35+.5*land);
      ctx.fillStyle=i%2?'#fff6c0':col; ctx.save(); ctx.translate(x+Math.cos(a)*d,y+s*.66+Math.sin(a)*d*.5); ctx.rotate(land*3); ctx.beginPath();
      for(let k=0;k<8;k++){ const rr=k%2?s*.015:s*.06, aa=k*.785; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);} ctx.fill(); ctx.restore(); } ctx.restore(); }
  if(bright>0) addLight(ctx,x,yy,s*.6,'#ffffff',.18*bright);
};


/* ===============================================================
   v4 "XMAS LIGHTS" NEW PATH (2026-11-24): original cast, no
   borrowed characters.
   - Puff: a smug little snow cloud. Drifts over a bulb, squeezes,
     and drops a snowball.
   - Falling snowball: shadow warning grows, ball falls with stretch,
     SPLATS into a flat snow pile with flecks, pile melts to a puddle.
   - Snips: living golden scissors with a face on the pivot. Fly a
     line, blades snip open/closed, glint on each snip.
   Engine time is ms in the hooks; these functions take seconds.
   =============================================================== */
const TAU=6.2832;
function blob(ctx,pts){ ctx.beginPath(); for(const [x,y,r] of pts){ ctx.moveTo(x+r,y); ctx.arc(x,y,r,0,TAU); } }
const CLOUD=[[-.34,.06,.24],[-.13,-.1,.3],[.15,-.13,.27],[.36,.05,.22],[0,.1,.28],[-.2,.14,.2],[.22,.14,.2]];
/** Puff the snow cloud. size = body width. o: {squeeze 0..1, mood 'smug'|'puff'|'laugh'|'sleep', alpha, look:-1..1} */
A.drawCloud=(ctx,x,y,size,t=0,o={})=>{
  const sq=o.squeeze||0, mood=o.mood||'smug', bob=Math.sin(t*2.1)*size*.03;
  ctx.save(); ctx.globalAlpha*=o.alpha??1; ctx.translate(x,y+bob); ctx.scale(1+sq*.12,1-sq*.16);
  const pts=CLOUD.map(([a,b,r],i)=>[a*size,b*size+Math.sin(t*3+i*1.7)*size*.008,r*size*(1+(mood==='puff'?.04*Math.sin(t*14+i):0))]);
  // soft under-glow so it reads on the night board
  addLight(ctx,0,0,size*.9,'#b8c6ff',.18);
  ctx.fillStyle='rgba(40,20,110,.55)'; blob(ctx,pts.map(([a,b,r])=>[a,b+size*.05,r])); ctx.fill();
  const g=ctx.createLinearGradient(0,-size*.4,0,size*.4); g.addColorStop(0,'#ffffff'); g.addColorStop(.55,'#e6e6ff'); g.addColorStop(1,'#a9a6e8');
  ctx.fillStyle=g; blob(ctx,pts); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-size*.16,-size*.26,size*.12,size*.05,-.3,0,TAU); ctx.fill();
  // face
  const ex=size*.11, ey=-size*.01, lk=(o.look||0)*size*.02, s=size;
  ctx.fillStyle=INK; ctx.strokeStyle=INK; ctx.lineCap='round'; ctx.lineWidth=s*.028;
  if(mood==='puff'||mood==='laugh'||mood==='sleep'){ for(const d of [-1,1]){ ctx.beginPath(); ctx.arc(d*ex,ey+s*.01,s*.035,mood==='sleep'?.2:Math.PI+.2,mood==='sleep'?Math.PI-.2:-.2); ctx.stroke(); } }
  else { for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*ex+lk,ey,s*.03,s*.04,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(d*ex+lk+s*.01,ey-s*.015,s*.011,0,TAU); ctx.fill(); ctx.fillStyle=INK; }
    // smug half-lids
    ctx.fillStyle='#e9e8ff'; for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*ex+lk,ey-s*.028,s*.04,s*.026,0,Math.PI,TAU); ctx.fill(); } ctx.fillStyle=INK; }
  ctx.fillStyle='rgba(255,110,150,.45)'; for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*s*.19,s*.05,s*.045,s*.026,0,0,TAU); ctx.fill(); }
  ctx.fillStyle=INK;
  if(mood==='puff'){ ctx.beginPath(); ctx.ellipse(0,s*.07,s*.026,s*.032,0,0,TAU); ctx.fill(); }
  else if(mood==='laugh'){ ctx.beginPath(); ctx.ellipse(0,s*.06,s*.06,s*.045,0,0,Math.PI); ctx.fill(); ctx.fillStyle='#ff6a8a'; ctx.beginPath(); ctx.ellipse(0,s*.085,s*.03,s*.015,0,0,TAU); ctx.fill(); }
  else if(mood==='sleep'){ ctx.beginPath(); ctx.arc(0,s*.06,s*.02,0,Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-s*.04,s*.06); ctx.quadraticCurveTo(s*.01,s*.1,s*.06,s*.045); ctx.stroke(); }
  ctx.restore();
  // a few flakes drifting under him
  ctx.save(); ctx.fillStyle='rgba(255,255,255,.85)';
  for(let i=0;i<5;i++){ const ph=(t*.6+i*.37)%1, fx=x+(hash(i+3)-.5)*size*.7+Math.sin(t*2+i)*size*.04, fy=y+size*.25+ph*size*.6;
    ctx.globalAlpha=(o.alpha??1)*(1-ph)*.9; ctx.beginPath(); ctx.arc(fx,fy,size*.018,0,TAU); ctx.fill(); }
  ctx.restore();
};

/** falling snowball. (x,y) = where it lands, r = ball radius, p 0..1.
    0..0.22 Puff appears above and squeezes the ball out; 0.22..1 it falls.
    The landing shadow and a pulsing ring warn the player the whole time. */
A.drawFallingSnowball=(ctx,x,y,r,p,t=0,o={})=>{
  const H=o.height??r*9, top=Math.max(r*2.2,y-H), size=r*2;
  const warn=.5+.5*Math.sin(t*12);
  // landing shadow grows as it falls
  const fk=p<.22?0:(p-.22)/.78;
  shadow(ctx,x,y+r*.3,size*(.5+.8*fk),.12+.3*fk);
  ctx.save(); ctx.strokeStyle=`rgba(255,90,110,${.3+.5*warn})`; ctx.lineWidth=Math.max(2,r*.1); ctx.setLineDash([r*.32,r*.22]); ctx.lineDashOffset=t*r*3;
  ctx.beginPath(); ctx.ellipse(x,y+r*.3,r*1.1,r*.42,0,0,TAU); ctx.stroke(); ctx.restore();
  // the cloud: pops in, squeezes, then floats off laughing
  const cIn=Math.min(1,p/.12), cOut=p>.6?Math.min(1,(p-.6)/.4):0;
  const cs=size*1.9*(.6+.4*ease.outBack(cIn));
  A.drawCloud(ctx,x+cOut*size*1.5,top-r*.6-cOut*r,cs,t,{squeeze:p>.1&&p<.24?Math.sin((p-.1)/.14*Math.PI):0,mood:p<.1?'smug':p<.3?'puff':'laugh',alpha:Math.min(cIn,1-cOut)});
  // the ball
  const e=img('snowball',S.snowball);
  if(p<.22){ const k=Math.max(0,(p-.1)/.12); if(k>0) blit(ctx,e,x,top+r*.2+k*r*.6,size*(.4+.6*k),0,1,1,1); return; }
  const fy=top+r*.8+(y-top-r*.8)*fk*fk, vel=fk;
  blit(ctx,e,x,fy,size,Math.sin(t*5)*.15,1-vel*.12,1+vel*.25);
  // speed streaks
  ctx.save(); ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=Math.max(1.5,r*.08); ctx.lineCap='round';
  for(const d of [-.5,0,.5]){ ctx.globalAlpha=vel*.7; ctx.beginPath(); ctx.moveTo(x+d*r,fy-r*1.1); ctx.lineTo(x+d*r,fy-r*(1.1+vel*2.2)); ctx.stroke(); } ctx.restore();
};

/** the splat. age = seconds since impact, meltP 0..1 (1 = gone).
    0..0.5 s impact squash, splat grows with overshoot, flecks fly; then a flat snow pile with a dazed face. */
A.drawSplat=(ctx,x,y,r,age=1,meltP=0,t=0)=>{
  const seed=Math.round(x*7+y*13), R=r*1.3;
  const grow=age<.35?ease.outBack(Math.min(1,age/.35)):1, mk=1-meltP;
  if(meltP>0){ // meltwater puddle
    ctx.save(); ctx.globalAlpha=Math.min(1,meltP*2)*(1-Math.max(0,meltP-.7)/.3);
    const pg=ctx.createRadialGradient(x,y,0,x,y,R*1.2); pg.addColorStop(0,'rgba(170,210,255,.55)'); pg.addColorStop(1,'rgba(120,160,255,0)');
    ctx.fillStyle=pg; ctx.beginPath(); ctx.ellipse(x,y+r*.15,R*1.25,R*.5,0,0,TAU); ctx.fill();
    ctx.strokeStyle='rgba(220,240,255,.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(x-R*.3,y,R*.3,R*.08,0,0,TAU); ctx.stroke(); ctx.restore();
  }
  if(mk<=0.01) return;
  ctx.save(); ctx.translate(x,y); ctx.scale(grow*(.35+.65*mk),grow*(.35+.65*mk));
  // flat splash: a lumpy star of snow on the ground (drawn in squashed ground space) + loose droplets
  const N=18, sp=[]; for(let i=0;i<N;i++){ const a=i/N*TAU, q=i%2? .72+hash(seed+i)*.18 : 1+hash(seed+i*3)*.35; sp.push([Math.cos(a)*R*q,Math.sin(a)*R*q]); }
  const splash=(dy)=>{ ctx.beginPath(); for(let i=0;i<N;i++){ const P=sp[i], Q=sp[(i+1)%N], m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2]; if(!i) ctx.moveTo(m[0],m[1]+dy); else ctx.quadraticCurveTo(P[0],P[1]+dy,m[0],m[1]+dy); }
    const P=sp[0], Q=sp[1]; ctx.quadraticCurveTo(P[0],P[1]+dy,(P[0]+Q[0])/2,(P[1]+Q[1])/2+dy); ctx.closePath(); };
  ctx.save(); ctx.scale(1,.42);
  ctx.fillStyle='rgba(30,14,90,.5)'; splash(r*.35); ctx.fill();
  const g=ctx.createRadialGradient(0,0,R*.2,0,0,R*1.3); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#bccbff');
  ctx.fillStyle=g; splash(0); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=r*.06; ctx.beginPath(); ctx.arc(0,0,R*.55,Math.PI*1.1,Math.PI*1.6); ctx.stroke();
  for(let i=0;i<6;i++){ const a=hash(seed+i*7)*TAU, d=R*(1.45+hash(seed+i*13)*.5), rr=r*(.08+hash(seed+i*19)*.1);
    ctx.fillStyle='rgba(30,14,90,.45)'; ctx.beginPath(); ctx.arc(Math.cos(a)*d,Math.sin(a)*d+r*.25,rr,0,TAU); ctx.fill();
    ctx.fillStyle='#eef2ff'; ctx.beginPath(); ctx.arc(Math.cos(a)*d,Math.sin(a)*d,rr,0,TAU); ctx.fill(); }
  ctx.restore();
  // the squashed mound in the middle
  const sq=age<.12?1.5-age/.12*.5:1;
  const mg=ctx.createRadialGradient(-r*.25,-r*.35,0,0,-r*.1,r*.95); mg.addColorStop(0,'#ffffff'); mg.addColorStop(.7,'#e4ebff'); mg.addColorStop(1,'#a9b6f0');
  ctx.fillStyle=mg; ctx.beginPath(); ctx.ellipse(0,-r*.12,r*.78*sq,r*.5/sq,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-r*.3,-r*.38,r*.18,r*.07,-.3,0,TAU); ctx.fill();
  // sparkle glints in the snow
  for(let i=0;i<4;i++){ const tw=Math.max(0,Math.sin(t*3+i*2.1+seed)); if(tw<.6) continue; const a=hash(seed+i*9)*TAU, d=R*.6*hash(seed+i*11);
    ctx.save(); ctx.globalAlpha=(tw-.6)*2.5; ctx.fillStyle='#fff'; ctx.translate(Math.cos(a)*d,Math.sin(a)*d*.4-r*.1); ctx.beginPath();
    for(let k=0;k<8;k++){ const rr=k%2?r*.025:r*.11, aa=k*.785; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);} ctx.fill(); ctx.restore(); }
  // dazed face: swirly eyes for the first 1.5 s, then sleepy
  ctx.strokeStyle=INK; ctx.fillStyle=INK; ctx.lineWidth=Math.max(1.4,r*.07); ctx.lineCap='round';
  const fy=-r*.16;
  if(age<1.5){ for(const d of [-1,1]){ ctx.beginPath(); for(let k=0;k<14;k++){ const a=k*.6+t*8*d, rr=r*.012*k; ctx.lineTo(d*r*.24+Math.cos(a)*rr,fy+Math.sin(a)*rr); } ctx.stroke(); } }
  else { for(const d of [-1,1]){ ctx.beginPath(); ctx.arc(d*r*.24,fy,r*.08,.25,Math.PI-.25); ctx.stroke(); } }
  ctx.beginPath(); ctx.ellipse(0,fy+r*.2,r*.07,r*.05,0,0,TAU); ctx.fill();
  ctx.restore();
  // flecks flying out on impact
  if(age<.7){ const k=age/.7; ctx.save(); ctx.fillStyle='#fff';
    for(let i=0;i<12;i++){ const a=hash(seed+i*17)*TAU, sp=r*(1.6+hash(seed+i)*2.2);
      const fx=x+Math.cos(a)*sp*k, fy2=y+Math.sin(a)*sp*k*.45-Math.sin(k*Math.PI)*r*(1+hash(i)*1.2);
      ctx.globalAlpha=1-k; ctx.beginPath(); ctx.arc(fx,fy2,r*(.06+hash(seed+i*2)*.09)*(1-k*.5),0,TAU); ctx.fill(); }
    // impact ring
    ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.globalAlpha=1-k; ctx.lineWidth=r*.08*(1-k); ctx.beginPath(); ctx.ellipse(x,y+r*.1,R*(1+k*1.2),R*.42*(1+k*1.2),0,0,TAU); ctx.stroke();
    ctx.restore(); }
};

/** Snips: living golden scissors. angle = direction the tips point (radians), open 0..1. */
A.drawScissors=(ctx,x,y,size,angle=0,open=.5,t=0,o={})=>{
  const a=open*.42, L=size*.62, hl=size*.36;
  ctx.fillStyle='rgba(6,2,20,.3)'; ctx.beginPath(); ctx.ellipse(x,y+size*.3,size*.45,size*.09,0,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  // speed trail
  if(o.trail!==false){ ctx.save(); ctx.globalCompositeOperation='lighter'; for(let i=1;i<4;i++){ ctx.globalAlpha=.12/i; ctx.fillStyle='#ffd76a'; ctx.beginPath(); ctx.ellipse(-size*.35-i*size*.18,0,size*.2,size*.13*(1-i*.15),0,0,TAU); ctx.fill(); } ctx.restore(); }
  addLight(ctx,0,0,size*.9,'#ffd06a',.22);
  const blade=(s)=>{ ctx.save(); ctx.rotate(s*a);
      // handle ring
      const hg=ctx.createLinearGradient(0,-size*.2,0,size*.2); hg.addColorStop(0,s<0?'#ff6a7a':'#5be38f'); hg.addColorStop(1,s<0?'#b0122a':'#128a44');
      ctx.strokeStyle=hg; ctx.lineWidth=size*.075; ctx.beginPath(); ctx.ellipse(-hl,s*size*.09,size*.15,size*.11,s*.25,0,TAU); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=size*.02; ctx.beginPath(); ctx.ellipse(-hl,s*size*.09-size*.02,size*.13,size*.09,s*.25,Math.PI*1.1,Math.PI*1.7); ctx.stroke();
      ctx.fillStyle=hg; ctx.beginPath(); ctx.moveTo(-hl+size*.12,s*size*.04); ctx.lineTo(0,s*size*.025); ctx.lineTo(0,-s*size*.02); ctx.lineTo(-hl+size*.14,s*size*.0); ctx.fill();
      // blade
      const bg=ctx.createLinearGradient(0,-s*size*.06,0,s*size*.03); bg.addColorStop(0,'#fff6c8'); bg.addColorStop(.45,'#ffc21a'); bg.addColorStop(1,'#b86e00');
      ctx.fillStyle=bg; ctx.beginPath(); ctx.moveTo(-size*.04,s*size*.07); ctx.quadraticCurveTo(L*.45,s*size*.11,L,-s*size*.005); ctx.lineTo(L*.94,-s*size*.03); ctx.quadraticCurveTo(L*.5,-s*size*.05,-size*.04,-s*size*.04); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(120,60,0,.5)'; ctx.lineWidth=size*.012; ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=size*.012; ctx.beginPath(); ctx.moveTo(size*.04,-s*size*.022); ctx.quadraticCurveTo(L*.5,-s*size*.028,L*.9,-s*size*.012); ctx.stroke();
      ctx.restore(); };
  blade(1); blade(-1);
  // pivot face
  const pg=ctx.createRadialGradient(-size*.03,-size*.04,0,0,0,size*.14); pg.addColorStop(0,'#fff8d8'); pg.addColorStop(.6,'#ffc21a'); pg.addColorStop(1,'#c07800');
  ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(0,0,size*.13,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(120,60,0,.45)'; ctx.lineWidth=size*.012; ctx.stroke();
  ctx.rotate(-angle); // keep the face upright
  const blink=((t+.7)%3.4)<.12, s=size*1.25;
  ctx.fillStyle=INK; ctx.strokeStyle=INK; ctx.lineCap='round'; ctx.lineWidth=s*.016;
  for(const d of [-1,1]){ if(blink){ ctx.beginPath(); ctx.moveTo(d*s*.04-s*.015,-s*.015); ctx.lineTo(d*s*.04+s*.015,-s*.015); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(d*s*.04,-s*.015,s*.017,s*.023,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(d*s*.04+s*.006,-s*.024,s*.006,0,TAU); ctx.fill(); ctx.fillStyle=INK; } }
  // mischievous brows + grin that snaps with the blades
  ctx.beginPath(); ctx.moveTo(-s*.065,-s*.05); ctx.lineTo(-s*.02,-s*.04); ctx.moveTo(s*.065,-s*.05); ctx.lineTo(s*.02,-s*.04); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,s*.03,s*.035,s*.012+open*s*.02,0,0,Math.PI); ctx.fill();
  ctx.restore();
  // glint at the tips on each snip
  if(open<.12){ const tx=x+Math.cos(angle)*L, ty=y+Math.sin(angle)*L, k=1-open/.12;
    addLight(ctx,tx,ty,size*.35,'#fff4c0',.6*k);
    ctx.save(); ctx.globalAlpha=k; ctx.fillStyle='#fff'; ctx.translate(tx,ty); ctx.rotate(t*4); ctx.beginPath();
    for(let i=0;i<8;i++){ const rr=i%2?size*.02:size*.12, aa=i*.785; ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);} ctx.fill(); ctx.restore(); }
};
/** one snip-snip run along a line, k 0..1. Handy for showcases and the old Biker hook. */
A.drawSnipRun=(ctx,x1,y1,x2,y2,size,t=0,k=0)=>{
  const x=x1+(x2-x1)*k, y=y1+(y2-y1)*k, ang=Math.atan2(y2-y1,x2-x1);
  const open=.5+.5*Math.cos(t*TAU*3.2); // ~3 snips a second
  // faint cut line already travelled
  ctx.save(); ctx.strokeStyle='rgba(255,215,110,.35)'; ctx.lineWidth=2; ctx.setLineDash([6,8]); ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x,y); ctx.stroke(); ctx.restore();
  A.drawScissors(ctx,x,y+Math.sin(t*9)*size*.03,size,ang,open,t);
};

/** "Xmas Lights" logo strand: a sagging green wire with n bulbs (inline SVG; bulbs have class b for CSS twinkle) */
S.strand=(n=7,w=320)=>{
  const h=70, cols=['#ff3b4e','#ffc21a','#33d17a','#3d9bff','#ff5fc8','#ff8a1f'];
  const yAt=x=>14+28*Math.sin(Math.PI*x/w);
  let bulbs='';
  for(let i=0;i<n;i++){ const x=w*(i+.5)/n, y=yAt(x), c=cols[i%6], r=(i%2?-1:1)*8;
    bulbs+=`<g class="b" style="--c:${c};animation-delay:${(i*.37)%1.6}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r})"><rect x="-4" y="0" width="8" height="7" rx="2" fill="#e9b02a"/><path d="M0 30 C9 23 11 15 8 9 C6 5 -6 5 -8 9 C-11 15 -9 23 0 30Z" fill="${c}"/><ellipse cx="-3" cy="14" rx="2" ry="4.5" fill="#fff" opacity=".8"/></g>`; }
  const inner=`<path d="M0 14 Q${w/2} ${14+56} ${w} 14" fill="none" stroke="#1d7a44" stroke-width="3.5" stroke-linecap="round"/>${bulbs}`;
  return {svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="xl-strand">${inner}</svg>`,w,h,bw:w,ax:w/2,ay:0};
};



/* ===============================================================
   v4.4 WELCOME GIFT OPENING (daily gift card only; board presents keep drawGift 'unwrap').
   The lid pops off, tumbles and lands leaning on the box, the box is drawn OPEN
   (dark inside, glowing rim), and one of the game's own bulbs rises out of it, lights
   up and bobs. No hands, same glossy bulb as on the board.
   A.drawGiftOpening(ctx,x,y,size,k,t,{ribbonCi, bulbCi})  k = 0..1 opening, >1 = settled
   =============================================================== */
A.drawGiftOpening=(ctx,x,y,size,k,t=0,opt={})=>{
  const ribbon = opt.ribbonCi!=null ? PAL[opt.ribbonCi] : '#ffc21a';
  const box = opt.ribbonCi!=null ? (opt.ribbonCi===0||opt.ribbonCi===5?'#2f86ff':'#f0283c') : '#f0283c';
  const kb='g'+box+ribbon, eB=img(kb+'b',()=>S.giftBox(box,ribbon)), eL=img(kb+'l',()=>S.giftLid(box,ribbon));
  const u=size/76, cl=v=>Math.max(0,Math.min(1,v));
  const topY=y-18*u, botY=y+32*u, halfW=36*u, backY=topY-11*u, backW=31*u;
  const pop=cl(k/.12), open=cl((k-.04)/.18);                 // box squashes, lid leaves
  const squash=k<.12?Math.sin(pop*Math.PI)*.07:0;
  shadow(ctx,x,y+size*.45,size*1.05);
  // light pouring out of the opening
  if(open>0){ addLight(ctx,x,topY-size*.25,size*(1.1+.25*open),'#ffd76a',.9*open);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.55*open*(k<1?1:.6+.15*Math.sin(t*2.4)); ctx.translate(x,backY+4*u);
    const len=size*(1.1+.5*open), rg=ctx.createRadialGradient(0,0,0,0,0,len); rg.addColorStop(0,'rgba(255,240,180,.95)'); rg.addColorStop(.4,'rgba(255,214,100,.35)'); rg.addColorStop(1,'rgba(255,200,80,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.moveTo(-backW,0); ctx.lineTo(backW,0); ctx.lineTo(len*.75,-len); ctx.lineTo(-len*.75,-len); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(x,botY); ctx.scale(1+squash,1-squash); ctx.translate(-x,-botY);
  // the inside of the box: back wall, dark floor, a warm glow from below
  if(open>0){
    const ig=ctx.createLinearGradient(0,backY,0,topY); ig.addColorStop(0,dark(box,.5)); ig.addColorStop(1,dark(box,.78));
    ctx.fillStyle=ig; ctx.beginPath(); ctx.moveTo(x-halfW,topY); ctx.lineTo(x-backW,backY); ctx.lineTo(x+backW,backY); ctx.lineTo(x+halfW,topY); ctx.closePath(); ctx.fill();
    addLight(ctx,x,topY-3*u,size*.42,'#ffe08a',.85*open);
    // rim: the top edges of the four walls
    ctx.lineJoin='round'; ctx.lineCap='round'; ctx.lineWidth=3.2*u; ctx.strokeStyle=light(box,.12);
    ctx.beginPath(); ctx.moveTo(x-halfW,topY); ctx.lineTo(x-backW,backY); ctx.lineTo(x+backW,backY); ctx.lineTo(x+halfW,topY); ctx.stroke();
    ctx.lineWidth=1.4*u; ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(x-backW+2*u,backY); ctx.lineTo(x+backW-2*u,backY); ctx.stroke();
    // ribbon runs over the back wall too
    ctx.fillStyle=dark(ribbon,.15); ctx.fillRect(x-7*u*.86,backY-1.5*u,14*u*.86,4*u);
  }
  // the bulb: a real game bulb, rises out of the box, switches on, then bobs
  const rise=cl((k-.12)/.5), on=cl((k-.38)/.2), bs=size*.5;
  if(rise>0){
    const restY=backY-bs*.95, startY=botY+bs*.2;
    const by=startY+(restY-startY)*ease.outBack(rise,1.4)+(k>=.6?Math.sin(t*2.6)*bs*.06:0), bx=x+(k>=.6?Math.sin(t*1.3)*bs*.03:0);
    ctx.save(); ctx.beginPath(); ctx.rect(x-size,y-size*3,size*2,(topY+1.5*u)-(y-size*3)); ctx.clip();
    if(on>0){ addLight(ctx,bx,by+bs*.25,bs*3.2,PAL[opt.bulbCi??1],.5*on); addLight(ctx,bx,by,bs*1.5,PAL[opt.bulbCi??1],.6*on); }
    A.drawBulbBody(ctx,bx,by,bs,opt.bulbCi??1,{bright:on,blink:((t+.7)%3.6)<.12});
    ctx.restore();
    if(on>0&&on<1){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=(1-on); ctx.fillStyle='#fff8d8';
      ctx.beginPath(); ctx.arc(bx,by,bs*(.4+on*.9),0,6.2832); ctx.fill(); ctx.restore(); }
  }
  // front of the box (same art as the closed present)
  blit(ctx,eB,x,y,size);
  if(open<=0) blit(ctx,eL,x,y,size);
  ctx.restore();
  // the lid: pops up, spins, falls and lands leaning against the right side of the box
  if(open>0){
    const fly=cl((k-.04)/.26), fall=cl((k-.3)/.32);
    const lx0=x, ly0=y, upX=x+size*.32, upY=y-size*.95, endX=x+size*.34, endY=y+size*.06;
    let lx,ly,lr;
    if(fall<=0){ const e=ease.outCubic(fly); lx=lx0+(upX-lx0)*e; ly=ly0+(upY-ly0)*e; lr=.9*e; }
    else { const e=fall*fall; lx=upX+(endX-upX)*e; ly=upY+(endY-upY)*e; lr=.9+(1.22-.9)*ease.outCubic(fall); }
    const land=k>.62&&k<.8?Math.sin((k-.62)/.18*Math.PI)*.06:0;
    blit(ctx,eL,lx,ly,size,lr-land);
  }
};

/* ===============================================================
   v4.3 SANTA BULB: Santa is one of the cast, a glossy warm-gold bulb in a red
   Santa hat with a fluffy beard over his socket and a curly moustache.
   A.drawSanta(ctx,x,y,size,t,{laugh:0..1, wink, look:-1..1})
   (x,y) = bulb anchor like drawBulbBody, size = bulb width.
   =============================================================== */
A.drawSanta=(ctx,x,y,size,t=0,o={})=>{
  const s=size, T=6.2832, L=o.laugh||0;
  const ho=L>0?Math.abs(Math.sin(t*Math.PI*3.2)):0;           // three "ho"s a second
  const dy=-ho*L*s*.06, rot=Math.sin(t*1.6)*.05+(L?Math.sin(t*Math.PI*3.2)*.04:0)+(o.look||0)*.06;
  const sq=1-ho*L*.05;
  addLight(ctx,x,y+dy,s*1.5,'#ffc21a',.75);
  ctx.save(); ctx.translate(x,y+dy+s*.6); ctx.rotate(rot); ctx.scale(2-sq,sq); ctx.translate(0,-s*.6);
  A.drawBulbBody(ctx,0,0,s,1,{lit:true,face:false});
  // face
  const fy=s*.17, ex=s*.15, er=s*.08;
  ctx.fillStyle=INK; ctx.strokeStyle=INK; ctx.lineCap='round';
  for(const d of [-1,1]){ const cx=d*ex;
    if(ho*L>.35||(o.wink&&d===1)){ ctx.lineWidth=Math.max(1.6,s*.045); ctx.beginPath(); ctx.arc(cx,fy+er*.5,er*.95,Math.PI+.35,-.35); ctx.stroke(); }
    else { ctx.beginPath(); ctx.ellipse(cx,fy,er,er*1.25,0,0,T); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-er*.3,fy-er*.45,er*.4,0,T); ctx.fill(); ctx.beginPath(); ctx.arc(cx+er*.35,fy+er*.35,er*.16,0,T); ctx.fill(); ctx.fillStyle=INK; } }
  ctx.fillStyle='rgba(255,120,150,.55)'; for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*s*.29,fy+s*.1,s*.075,s*.045,0,0,T); ctx.fill(); }
  // bushy white brows
  ctx.fillStyle='#fff'; for(const d of [-1,1]){ ctx.beginPath(); ctx.ellipse(d*ex,fy-er*1.9-ho*L*s*.02,er*1.1,er*.45,d*.22,0,T); ctx.fill(); }
  // beard: fluffy cloud over the lower glass and the socket
  const bl=[[0,.54,.22],[-.2,.46,.15],[.2,.46,.15],[-.12,.64,.15],[.12,.64,.15],[0,.72,.13],[-.28,.36,.1],[.28,.36,.1]];
  ctx.fillStyle='rgba(60,10,30,.28)'; ctx.beginPath(); for(const [a,b,r] of bl){ ctx.moveTo(a*s+r*s,b*s+s*.03); ctx.arc(a*s,b*s+s*.03,r*s,0,T);} ctx.fill();
  const bg=ctx.createLinearGradient(0,s*.25,0,s*.85); bg.addColorStop(0,'#ffffff'); bg.addColorStop(1,'#d3dbf6');
  ctx.fillStyle=bg; ctx.beginPath(); for(const [a,b,r] of bl){ ctx.moveTo(a*s+r*s,b*s); ctx.arc(a*s,b*s,r*s,0,T);} ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-s*.1,s*.44,s*.07,s*.025,-.3,0,T); ctx.fill();
  // mouth, opens on each ho
  const mo=s*(.025+.06*L*ho);
  ctx.fillStyle='#5a1020'; ctx.beginPath(); ctx.ellipse(0,s*.46,s*.06,mo,0,0,T); ctx.fill();
  if(mo>s*.045){ ctx.fillStyle='#ff7a8a'; ctx.beginPath(); ctx.ellipse(0,s*.46+mo*.45,s*.04,mo*.4,0,0,T); ctx.fill(); }
  // curly moustache
  ctx.fillStyle='#fff';
  for(const d of [-1,1]){ ctx.save(); ctx.translate(d*s*.08,s*.38); ctx.rotate(d*(.2+L*ho*.18));
    ctx.beginPath(); ctx.ellipse(0,0,s*.1,s*.045,0,0,T); ctx.fill(); ctx.beginPath(); ctx.arc(d*s*.1,-s*.025,s*.032,0,T); ctx.fill(); ctx.restore(); }
  // Santa hat on the tip, pompom flopping
  const flop=(Math.sin(t*2.2)*4+ho*L*10)*Math.PI/180;
  // v4.3.1: the hat is drawn right on the glass: fur band hugs the bulb just under the tip, cone covers the tip and flops to the side
  ctx.save(); ctx.rotate(-.1+flop*.5);
  const hx=s*(.5+Math.sin(t*2.2)*.03), hy=-s*(.66-ho*L*.04);           // flopped tip / pompom
  const hg2=ctx.createLinearGradient(-s*.4,-s*1.05,s*.4,-s*.35); hg2.addColorStop(0,'#ff6a76'); hg2.addColorStop(.55,'#e01e34'); hg2.addColorStop(1,'#9e0c22');
  ctx.fillStyle='rgba(60,0,20,.25)'; ctx.beginPath(); ctx.ellipse(0,-s*.3,s*.4,s*.07,0,0,T); ctx.fill();   // soft shadow on the glass
  ctx.fillStyle=hg2; ctx.beginPath(); ctx.moveTo(-s*.38,-s*.4);
  ctx.bezierCurveTo(-s*.36,-s*.8,-s*.12,-s*1.06,s*.12,-s*1.02);
  ctx.bezierCurveTo(s*.38,-s*.98,hx+s*.06,hy-s*.22,hx,hy);
  ctx.bezierCurveTo(hx-s*.08,hy-s*.12,s*.22,-s*.78,s*.38,-s*.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-s*.14,-s*.78,s*.06,s*.16,.5,0,T); ctx.fill();
  const fg2=ctx.createLinearGradient(0,-s*.5,0,-s*.26); fg2.addColorStop(0,'#ffffff'); fg2.addColorStop(1,'#cfd7f4');
  ctx.fillStyle=fg2; ctx.beginPath(); for(let i=0;i<=6;i++){ const xx=-s*.42+i*s*.14, r=s*.095; ctx.moveTo(xx+r,-s*.38); ctx.arc(xx,-s*.38+Math.sin(i*1.7)*s*.008,r,0,T); } ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(-s*.18,-s*.43,s*.12,s*.03,0,0,T); ctx.fill();
  const pg2=ctx.createRadialGradient(hx-s*.03,hy-s*.03,0,hx,hy,s*.11); pg2.addColorStop(0,'#ffffff'); pg2.addColorStop(1,'#cdd5f2');
  ctx.fillStyle=pg2; ctx.beginPath(); ctx.arc(hx,hy+s*.02,s*.1,0,T); ctx.fill();
  ctx.restore();
  ctx.restore();
};

/* SVG strings for HTML/CSS use (icons) */
A.svg = (name,...args)=>S[name](...args).svg;
A.dataUrl = (name,...args)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(S[name](...args).svg);
A.chars = chars; A.drawChar = drawChar; A.glow = glow; A.light = addLight; A.ease = ease;

A.ready = (base='')=>{
  for(let i=0;i<6;i++){ img('bulb'+i+'L',()=>S.bulb(i,'lit')); img('bulb'+i+'U',()=>S.bulb(i,'unlit')); img('frz'+i,()=>S.frozen(i)); }
  ['red','green','blue'].forEach(c=>{img('hat'+c+'0',()=>S.hat(c,false)); img('hat'+c+'1',()=>S.hat(c,true));});
  const gk=(box,rib)=>{const kb='g'+box+rib; img(kb+'b',()=>S.giftBox(box,rib)); img(kb+'l',()=>S.giftLid(box,rib));};
  gk('#f0283c','#ffc21a'); for(let i=0;i<6;i++) gk(i===0||i===5?'#2f86ff':'#f0283c',PAL[i]);
  img('ice',S.ice); img('snowball',S.snowball); img('coal',S.coal); img('mit',()=>S.mitten()); img('antlers',S.antlers);
  ['cane','snowman','ginger','mitten','rock'].forEach(k=>img('blk'+k,{cane:S.cane,snowman:S.snowman,ginger:S.ginger,mitten:()=>S.mitten(),rock:S.rock}[k]));
  img('starlocked',()=>S.star('locked')); img('starlit',()=>S.star('lit')); img('plug0',()=>S.plug(false)); img('plug1',()=>S.plug(true));
  const waitImgs = ()=>new Promise(res=>{const t0=Date.now(); const chk=()=>{ if([...cache.values()].every(e=>e.ok)||Date.now()-t0>4000) res(); else setTimeout(chk,30); }; chk();});
  return waitImgs();
};

window.NLArt = A;
})();
