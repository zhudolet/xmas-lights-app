/* =====================================================================
   XMAS LIGHTS  ·  sfx.js  (team 2: sound)
   Event-keyed UI and reward sounds, all synthesised (no files).
   Glockenspiel and sleigh-bell partials, a small room reverb and a
   bus compressor so everything sits together and sounds "expensive".
   It does NOT touch the surface/cord ASMR in index.html (Snow and
   Window are signed off by Zeljko).

   Usage:
     NLSfx.init(existingAudioContext?, destinationNode?)  // call on first user gesture
     NLSfx.triangleLit(chain)   NLSfx.coinLand(i)   NLSfx.starFill(n) ...
     NLSfx.volume = 0.8; NLSfx.muted = false;
   ===================================================================== */
(function(){
'use strict';
let AC=null, OUT=null, VERB=null, BUS=null;
const X = { volume:.8, muted:false };

/* pentatonic ladder in C major, for rising coin / chain pitches */
const PENTA=[0,2,4,7,9];
const midi=n=>440*Math.pow(2,(n-69)/12);
const ladder=(i,base=84)=>midi(base+PENTA[i%5]+12*Math.floor(i/5));

function impulse(sec,decay){
  const n=Math.floor(AC.sampleRate*sec), b=AC.createBuffer(2,n,AC.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c); for(let i=0;i<n;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)*(i<AC.sampleRate*.01?i/(AC.sampleRate*.01):1);} }
  return b;
}
X.init=(ctx,dest)=>{
  if(AC && (!ctx || ctx===AC)) return AC;
  if(AC && ctx!==AC){ try{ AC.close(); }catch(e){} AC=null; } // the game's context arrived: move over so there is one output path
  AC = ctx || new (window.AudioContext||window.webkitAudioContext)();
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-18; comp.knee.value=12; comp.ratio.value=3.5; comp.attack.value=.004; comp.release.value=.18;
  OUT=AC.createGain(); OUT.gain.value=X.volume;
  BUS=AC.createGain();
  VERB=AC.createConvolver(); VERB.buffer=impulse(2.2,3.2);
  const vg=AC.createGain(); vg.gain.value=.28;
  BUS.connect(comp); VERB.connect(vg); vg.connect(comp); comp.connect(OUT); OUT.connect(dest||AC.destination);
  return AC;
};
const ok=()=>{ if(!AC) X.init(); if(AC.state==='suspended') AC.resume(); OUT.gain.value=X.muted?0:X.volume; return !X.muted; };
const now=()=>AC.currentTime;

/* --- voices ---------------------------------------------------- */
function env(g,t,a,peak,d){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
function send(node,wet=.5,pan=0){
  const p=AC.createStereoPanner? AC.createStereoPanner():null;
  if(p){p.pan.value=pan; node.connect(p); p.connect(BUS); if(wet>0){const w=AC.createGain(); w.gain.value=wet; p.connect(w); w.connect(VERB);} }
  else { node.connect(BUS); if(wet>0){const w=AC.createGain(); w.gain.value=wet; node.connect(w); w.connect(VERB);} }
}
/* glockenspiel / celesta: inharmonic bar partials */
function bell(f,t,vol=.3,len=1.2,pan=0,wet=.5,bright=1){
  const parts=[[1,1,1],[2.76,.42*bright,.45],[5.4,.2*bright,.22],[8.93,.09*bright,.12]];
  const g=AC.createGain(); g.gain.value=1; send(g,wet,pan);
  if(KV>=KMAX) return;
  parts.forEach(([r,a,dl])=>{ if(f*r>18000) return; const o=AC.createOscillator(), e=AC.createGain(); live(o); o.type='sine'; o.frequency.value=f*r;
    env(e,t,.002,vol*a,len*dl); o.connect(e); e.connect(g); o.start(t); o.stop(t+len*dl+.05); });
  // mallet tick
  noiseBurst(t,.006,vol*.25,f*3,pan,wet*.3);
}
/* v4.4 voice cap: scoring fires many jingles at once; past this many live voices new pellets are skipped (dense piles of tiny blips crackle and overload phones) */
let KV=0; const KMAX=56; const live=n=>{ KV++; n.onended=()=>{ KV--; }; };
function noiseBuf(){ if(noiseBuf.b) return noiseBuf.b; const n=AC.sampleRate, b=AC.createBuffer(1,n,n), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; return noiseBuf.b=b; }
function noiseBurst(t,dur,vol,hp=2000,pan=0,wet=.2,bp){
  if(KV>=KMAX) return;
  const s=AC.createBufferSource(); live(s); s.buffer=noiseBuf(); const f=AC.createBiquadFilter(); f.type=bp?'bandpass':'highpass'; f.frequency.value=Math.min(16000,bp||hp); if(bp) f.Q.value=bp>3000?4:1.5;
  const e=AC.createGain(); env(e,t,.001,vol,dur); s.connect(f); f.connect(e); send(e,wet,pan); s.start(t,Math.random()*.5); s.stop(t+dur+.05);
}
/* one sleigh-bell "jingle": a few tiny metal pellets rattling */
function jingle(t,vol=.18,pan=0,n=5,tone=1){
  if(KV>KMAX*.5) n=Math.min(n,2); if(KV>=KMAX) return;
  for(let i=0;i<n;i++){ const tt=t+i*(.006+Math.random()*.012);
    const f=(3200+Math.random()*2600)*tone;
    [1,1.47,2.09].forEach((r,j)=>{ const o=AC.createOscillator(), e=AC.createGain(); live(o); o.type='sine'; o.frequency.value=f*r; env(e,tt,.001,vol*(j?.35:.6)*(1-i/n*.5),.09+Math.random()*.08); o.connect(e); send(e,.35,pan); o.start(tt); o.stop(tt+.25); });
    noiseBurst(tt,.012,vol*.4,7000,pan,.1);
  }
}
function thump(t,vol=.5,f0=120,f1=45,len=.25){
  const o=AC.createOscillator(), e=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+len);
  env(e,t,.003,vol,len); o.connect(e); send(e,.15); o.start(t); o.stop(t+len+.05);
}
function whoosh(t,dur=.35,vol=.12,up=true,pan=0){
  const s=AC.createBufferSource(); s.buffer=noiseBuf(); const f=AC.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.2;
  f.frequency.setValueAtTime(up?500:3500,t); f.frequency.exponentialRampToValueAtTime(up?4500:400,t+dur);
  const e=AC.createGain(); e.gain.setValueAtTime(0.0001,t); e.gain.exponentialRampToValueAtTime(vol,t+dur*.6); e.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(e); send(e,.4,pan); s.start(t,Math.random()*.4); s.stop(t+dur+.05);
}
function pad(freqs,t,dur=1.6,vol=.06){
  freqs.forEach(fq=>[-6,6].forEach(dt=>{ const o=AC.createOscillator(), f=AC.createBiquadFilter(), e=AC.createGain(); o.type='sawtooth'; o.frequency.value=fq; o.detune.value=dt;
    f.type='lowpass'; f.frequency.setValueAtTime(600,t); f.frequency.linearRampToValueAtTime(2400,t+dur*.4); f.frequency.linearRampToValueAtTime(900,t+dur);
    e.gain.setValueAtTime(0.0001,t); e.gain.linearRampToValueAtTime(vol,t+dur*.25); e.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(f); f.connect(e); send(e,.6); o.start(t); o.stop(t+dur+.05); }));
}
function sparkleRun(t,n=8,vol=.08,base=96,spread=.03){
  for(let i=0;i<n;i++) bell(ladder(i,base-12)*(1+Math.random()*.003),t+i*spread+Math.random()*.01,vol*(1-i/n*.5),.5,(Math.random()*2-1)*.6,.7,.6);
}

/* --- PUBLIC EVENTS (names match the core gameplay spec) -------- */
X.tap=()=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(420,t+.07); env(e,t,.002,.22,.09); o.connect(e); send(e,.15); o.start(t); o.stop(t+.12); noiseBurst(t,.008,.1,3000,0,.05); };
X.button=()=>{ if(!ok())return; const t=now(); X.tap(); bell(ladder(4,84),t+.03,.12,.5,0,.4); };
X.popIn=()=>{ if(!ok())return; const t=now(); whoosh(t,.28,.12,true); bell(ladder(2,91),t+.16,.1,.8,-.3); bell(ladder(4,91),t+.2,.08,.8,.3); };
X.popOut=()=>{ if(!ok())return; whoosh(now(),.22,.08,false); };
X.countTick=(i=0)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='triangle'; o.frequency.value=ladder(i%10,96); env(e,t,.001,.05,.04); o.connect(e); send(e,.1); o.start(t); o.stop(t+.06); };

/** triangle lights. chain = 1,2,3... pitch climbs with the chain */
X.triangleLit=(chain=1,pan=0)=>{ if(!ok())return; const t=now(); const s=Math.min(chain-1,9);
  // electric "zzt-ting": quick filtered buzz into a bell chord
  const o=AC.createOscillator(),f=AC.createBiquadFilter(),e=AC.createGain(); o.type='sawtooth'; o.frequency.value=120; f.type='bandpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(5000,t+.08); f.Q.value=6;
  env(e,t,.003,.05,.09); o.connect(f); f.connect(e); send(e,.2,pan); o.start(t); o.stop(t+.12);
  const root=ladder(s,79); bell(root,t+.05,.3,1.4,pan,.55); bell(root*1.25,t+.09,.18,1.2,pan,.55); bell(root*1.5,t+.13,.16,1.2,pan,.55);
  jingle(t+.05,.08+.02*Math.min(chain,4),pan,4+Math.min(chain,4));
};
X.double=()=>{ if(!ok())return; const t=now(); [0,4,7,12,16].forEach((n,i)=>bell(midi(84+n),t+i*.05,.2,1,(i-2)*.25,.6)); thump(t,.3,160,60,.2); };
X.merryMatch=()=>{ if(!ok())return; const t=now(); jingle(t,.22,-.4,8); jingle(t+.08,.22,.4,8); [0,4,7,11,14].forEach((n,i)=>bell(midi(79+n),t+.05+i*.07,.2,1.6,0,.7)); pad([midi(55),midi(59),midi(62),midi(66)],t,1.8,.035); };
X.callout=(tier=1)=>{ if(!ok())return; const t=now(); whoosh(t,.3,.14,true); const r=midi(72+Math.min(tier,6)*2); [1,1.25,1.5,2].forEach((m,i)=>bell(r*m,t+.12+i*.025,.16,1.2,(i-1.5)*.3,.6)); };
X.giftUnwrap=(layersLeft=0)=>{ if(!ok())return; const t=now();
  // paper rip (filtered noise crackle) + ribbon zip + reveal chime
  for(let i=0;i<14;i++) noiseBurst(t+i*.012+Math.random()*.008,.02,.12,2500+Math.random()*3000,(Math.random()-.5)*.6,.15,1800+Math.random()*3000);
  whoosh(t+.12,.25,.1,true); if(layersLeft===0){ sparkleRun(t+.25,10,.12,96,.035); thump(t+.25,.25,200,80,.2); } else bell(ladder(3,84),t+.25,.18,.8);
};
X.noseLit=()=>{ if(!ok())return; const t=now(); thump(t,.35,90,40,.3); // "boop" + glow swell
  const o=AC.createOscillator(),e=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(900,t+.18); env(e,t,.01,.22,.25); o.connect(e); send(e,.4); o.start(t); o.stop(t+.3);
  pad([midi(60),midi(64),midi(67),midi(72)],t+.1,2,.04); sparkleRun(t+.2,8,.1,96,.05); jingle(t+.2,.2,0,10);
};
X.hatIn=(pan=0)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(1600,t); o.frequency.exponentialRampToValueAtTime(300,t+.22); env(e,t,.005,.2,.25); o.connect(e); send(e,.5,pan); o.start(t); o.stop(t+.3); noiseBurst(t+.15,.05,.08,800,pan,.3); };
X.hatOut=(pan=0)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(2200,t+.18); env(e,t,.005,.2,.2); o.connect(e); send(e,.5,pan); o.start(t); o.stop(t+.25); jingle(t+.05,.12,pan,5); };
X.sparkHit=(pan=0)=>{ if(!ok())return; const t=now(); bell(ladder(7,84),t,.2,.8,pan,.6); noiseBurst(t,.05,.15,4000,pan,.3); };
X.thaw=(pan=0)=>{ if(!ok())return; const t=now(); for(let i=0;i<10;i++) bell(2500+Math.random()*3500,t+i*.02,.05,.25,pan+(Math.random()-.5)*.4,.4,.3); noiseBurst(t,.25,.08,5000,pan,.4); };
X.snowballWarn=()=>{ if(!ok())return; const t=now(); whoosh(t,.6,.06,true); };
X.trollThrow=()=>{ if(!ok())return; const t=now();
  // cheeky grunt: formant-filtered buzz, "HUP!"
  const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(70,t+.25);
  const f1=AC.createBiquadFilter(), f2=AC.createBiquadFilter(); f1.type='bandpass'; f1.frequency.value=600; f1.Q.value=5; f2.type='bandpass'; f2.frequency.value=1100; f2.Q.value=6;
  const e=AC.createGain(); env(e,t,.02,.35,.25); o.connect(f1); o.connect(f2); f1.connect(e); f2.connect(e); send(e,.25); o.start(t); o.stop(t+.3);
  whoosh(t+.15,.5,.14,false); };
X.snowballLand=(pan=0)=>{ if(!ok())return; const t=now(); thump(t,.5,140,50,.18); for(let i=0;i<20;i++) noiseBurst(t+Math.random()*.08,.03,.12,1200,pan+(Math.random()-.5)*.5,.15,900+Math.random()*2500); };
X.cordSnap=(pan=0)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='square'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(90,t+.15); env(e,t,.001,.12,.15); o.connect(e); send(e,.2,pan); o.start(t); o.stop(t+.2); noiseBurst(t,.03,.25,2000,pan,.1); };
X.snowballMelt=(pan=0)=>{ if(!ok())return; const t=now(); for(let i=0;i<6;i++){ const o=AC.createOscillator(),e=AC.createGain(); o.type='sine'; const f=500+Math.random()*700; o.frequency.setValueAtTime(f,t+i*.07); o.frequency.exponentialRampToValueAtTime(f*2.2,t+i*.07+.05); env(e,t+i*.07,.003,.12,.06); o.connect(e); send(e,.4,pan); o.start(t+i*.07); o.stop(t+i*.07+.1);} bell(ladder(5,84),t+.4,.15,1,pan); };
X.bikerPass=(dur=1.2)=>{ if(!ok())return; const t=now();
  const o=AC.createOscillator(),o2=AC.createOscillator(),f=AC.createBiquadFilter(),e=AC.createGain(),p=AC.createStereoPanner?AC.createStereoPanner():AC.createGain();
  o.type='sawtooth'; o2.type='square'; o.frequency.setValueAtTime(55,t); o.frequency.linearRampToValueAtTime(95,t+dur*.5); o.frequency.linearRampToValueAtTime(70,t+dur);
  o2.frequency.setValueAtTime(27.5,t); o2.frequency.linearRampToValueAtTime(47,t+dur*.5); o2.frequency.linearRampToValueAtTime(35,t+dur);
  f.type='lowpass'; f.frequency.value=900; e.gain.setValueAtTime(0.0001,t); e.gain.exponentialRampToValueAtTime(.18,t+dur*.45); e.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  if(p.pan){p.pan.setValueAtTime(-1,t); p.pan.linearRampToValueAtTime(1,t+dur);} o.connect(f); o2.connect(f); f.connect(e); e.connect(p); p.connect(BUS);
  o.start(t); o2.start(t); o.stop(t+dur+.05); o2.stop(t+dur+.05); };
X.topperUnlock=()=>{ if(!ok())return; const t=now(); noiseBurst(t,.04,.2,3000); bell(ladder(0,84),t+.05,.2,1.5); bell(ladder(2,84),t+.12,.2,1.5); bell(ladder(4,84),t+.19,.2,1.5); jingle(t+.2,.18,0,8); };
X.plugCascade=(n=3)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(60,t); o.frequency.exponentialRampToValueAtTime(240,t+.4); const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1200; env(e,t,.02,.15,.4); o.connect(f); f.connect(e); send(e,.3); o.start(t); o.stop(t+.5); for(let i=0;i<n;i++) X._delay(()=>X.triangleLit(i+1),.35+i*.14); };

/** a single score glint leaves the board (very soft) */
X.coinFly=()=>{ if(!ok())return; const t=now(); noiseBurst(t,.05,.03,6000,(Math.random()-.5)*.6,.2); };
/** glint lands in the pot. i = how many have landed so far this burst (pitch ladder climbs = casino rush) */
X.coinLand=(i=0)=>{ if(!ok())return; const t=now(); const f=ladder(Math.min(i,14),88); bell(f,t,.11,.45,.35,.35,.5); jingle(t,.05,.35,2,1+i*.03); };
/** Encore: a leftover cord fires off */
X.encoreTick=(i=0)=>{ if(!ok())return; const t=now(); whoosh(t,.35,.12,true,(Math.random()-.5)); thump(t+.35,.25,220,70,.15); sparkleRun(t+.36,6,.08,84+Math.min(i,6)*2,.025); };
/** stars on the win card. n = 1,2,3 */
X.starFill=(n=1)=>{ if(!ok())return; const t=now(); thump(t,.45,140-n*15,45,.3); const r=midi(72+[0,4,7][Math.min(n,3)-1]);
  bell(r,t,.32,2,(n-2)*.4,.6); bell(r*1.5,t+.02,.18,1.8,(n-2)*.4,.6); bell(r*2,t+.03,.12,1.6,(n-2)*.4,.6); jingle(t+.02,.16,(n-2)*.4,6+n*2);
  if(n===3){ pad([midi(60),midi(64),midi(67),midi(71),midi(74)],t,2.6,.045); sparkleRun(t+.15,14,.09,96,.03); } };
X.win=()=>{ if(!ok())return; const t=now(); [0,4,7,12,16,19,24].forEach((n,i)=>bell(midi(72+n),t+i*.075,.22,1.6,(i-3)*.15,.6)); pad([midi(48),midi(55),midi(64),midi(67)],t,2.4,.05); jingle(t+.5,.18,-.4,10); jingle(t+.6,.18,.4,10); };
/** cheeky near-miss: muted "wah-wah" then a sympathetic plink */
X.fail=()=>{ if(!ok())return; const t=now();
  [[311,0],[293,.28],[277,.56],[262,.84]].forEach(([fq,d],i)=>{ const o=AC.createOscillator(),f=AC.createBiquadFilter(),e=AC.createGain(),l=AC.createOscillator(),lg=AC.createGain();
    o.type='sawtooth'; o.frequency.value=fq*.5; if(i===3){o.frequency.setValueAtTime(fq*.5,t+d); o.frequency.linearRampToValueAtTime(fq*.46,t+d+.7);} f.type='bandpass'; f.Q.value=3; f.frequency.value=700;
    l.frequency.value=i===3?6:2; lg.gain.value=i===3?450:350; l.connect(lg); lg.connect(f.frequency);
    const len=i===3?.8:.24; env(e,t+d,.02,.16,len); o.connect(f); f.connect(e); send(e,.3); o.start(t+d); l.start(t+d); o.stop(t+d+len+.05); l.stop(t+d+len+.05); });
  bell(midi(79),t+1.75,.12,1.2,0,.6); };
X.cocoa=()=>{ if(!ok())return; const t=now(); // slurp + "ahh" chime
  for(let i=0;i<8;i++) noiseBurst(t+i*.03,.04,.08,0,0,.1,500+i*120); bell(ladder(0,79),t+.35,.18,1.2); bell(ladder(2,79),t+.42,.16,1.2); bell(ladder(4,79),t+.49,.16,1.4); };
X.mapUnlock=()=>{ if(!ok())return; const t=now(); noiseBurst(t,.05,.18,2500); thump(t,.25,180,90,.12); sparkleRun(t+.08,10,.1,91,.04); };

/* --- v4 new path: Puff the cloud, falling snowball splat, Snips the scissors --- */
/** Puff appears and squeezes out a snowball: soft "pfff" + a cheeky two-note chime */
X.cloudPuff=(pan=0)=>{ if(!ok())return; const t=now(); whoosh(t,.4,.08,true,pan); noiseBurst(t+.12,.18,.09,0,pan,.3,900); bell(ladder(4,84),t+.18,.07,.6,pan,.6,.5); bell(ladder(2,84),t+.3,.07,.6,pan,.6,.5); };
/** falling whistle, dur in seconds (match the drop) */
X.fallWhistle=(dur=.8,pan=0)=>{ if(!ok())return; const t=now(); const o=AC.createOscillator(),e=AC.createGain(),v=AC.createOscillator(),vg=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(1900,t); o.frequency.exponentialRampToValueAtTime(520,t+dur); v.frequency.value=7; vg.gain.value=18; v.connect(vg); vg.connect(o.frequency);
  e.gain.setValueAtTime(0.0001,t); e.gain.exponentialRampToValueAtTime(.06,t+dur*.3); e.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(e); send(e,.35,pan); o.start(t); v.start(t); o.stop(t+dur+.05); v.stop(t+dur+.05); };
/** the splat: soft wet thump, a puff of powder, a scatter of snow grains, one glint */
X.splat=(pan=0)=>{ if(!ok())return; const t=now(); thump(t,.42,110,38,.22);
  noiseBurst(t,.16,.22,0,pan,.15,650); noiseBurst(t+.01,.09,.12,0,pan,.2,1800);
  for(let i=0;i<14;i++) noiseBurst(t+.03+Math.random()*.18,.018,.05,0,pan+(Math.random()-.5)*.6,.15,2500+Math.random()*4000);
  bell(ladder(7,96),t+.25,.04,.5,pan,.6,.4); };
/** one scissor snip: blade slide + crisp double click + steel ring */
X.snip=(pan=0)=>{ if(!ok())return; const t=now();
  const s=AC.createBufferSource(); s.buffer=noiseBuf(); const f=AC.createBiquadFilter(); f.type='bandpass'; f.Q.value=3; f.frequency.setValueAtTime(2500,t); f.frequency.exponentialRampToValueAtTime(7000,t+.05);
  const e=AC.createGain(); env(e,t,.004,.07,.05); s.connect(f); f.connect(e); send(e,.15,pan); s.start(t,Math.random()*.5); s.stop(t+.08);
  noiseBurst(t+.05,.006,.22,5000,pan,.1); noiseBurst(t+.062,.005,.16,6500,pan,.1);
  [4200,6100,8900].forEach((fq,i)=>{ const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.value=fq*(1+Math.random()*.01); env(g,t+.05,.001,.05/(i+1),.12); o.connect(g); send(g,.4,pan); o.start(t+.05); o.stop(t+.2); }); };
/** a cord is cut: snip + the wire twangs and both halves drop */
X.cordCut=(pan=0)=>{ if(!ok())return; X.snip(pan); const t=now()+.06;
  const o=AC.createOscillator(),e=AC.createGain(); o.type='triangle'; o.frequency.setValueAtTime(320,t); o.frequency.exponentialRampToValueAtTime(110,t+.3); env(e,t,.002,.1,.3); o.connect(e); send(e,.3,pan); o.start(t); o.stop(t+.35);
  noiseBurst(t+.18,.05,.06,0,pan-.2,.2,1200); noiseBurst(t+.22,.05,.06,0,pan+.2,.2,1000); };

/* --- v4.2 welcome-back gift --- */
/** Santa's "Ho ho ho!": three warm formant "ho"s (vowel o, voice ~105 Hz) with a breathy h, plus sleigh bells */
X.santaHoHo=()=>{ if(!ok())return; const t0=now();
  [0,.32,.64].forEach((d,i)=>{ const t=t0+d, f0=118-i*7;
    noiseBurst(t,.07,.05,0,0,.2,1200); // the breathy "h"
    const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(f0*1.12,t); o.frequency.exponentialRampToValueAtTime(f0*.9,t+.26);
    const vib=AC.createOscillator(), vg=AC.createGain(); vib.frequency.value=5.5; vg.gain.value=3; vib.connect(vg); vg.connect(o.frequency);
    const mixG=AC.createGain(); mixG.gain.value=1; const e=AC.createGain(); e.gain.setValueAtTime(0.0001,t+.03); e.gain.exponentialRampToValueAtTime(.32,t+.08); e.gain.exponentialRampToValueAtTime(0.0001,t+.3);
    [[480,6,1],[820,7,.55],[2600,8,.08]].forEach(([fq,q,a])=>{ const b=AC.createBiquadFilter(); b.type='bandpass'; b.frequency.value=fq; b.Q.value=q; const g=AC.createGain(); g.gain.value=a*3; o.connect(b); b.connect(g); g.connect(mixG); });
    const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3000; mixG.connect(lp); lp.connect(e); send(e,.35,0);
    o.start(t+.02); vib.start(t); o.stop(t+.35); vib.stop(t+.35); });
  jingle(t0+.05,.1,-.4,6); jingle(t0+.4,.1,.4,6); jingle(t0+.75,.12,0,8); };
/** the present rattles when tapped; n = tap number, gets bigger */
X.giftShake=(n=1)=>{ if(!ok())return; const t=now(); for(let i=0;i<4+n*3;i++) noiseBurst(t+i*.028+Math.random()*.01,.02,.06+.03*n,0,(Math.random()-.5)*.6,.15,700+Math.random()*900); thump(t,.12+.06*n,180,90,.08); jingle(t+.02,.05*n,0,2+n); };
/** the present bursts open: paper rip, pop, a rising sparkle run */
X.giftBurst=()=>{ if(!ok())return; const t=now(); const s=AC.createBufferSource(); s.buffer=noiseBuf(); const f=AC.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.5; f.frequency.setValueAtTime(1200,t); f.frequency.exponentialRampToValueAtTime(5000,t+.18);
  const e=AC.createGain(); env(e,t,.01,.25,.2); s.connect(f); f.connect(e); send(e,.2); s.start(t,Math.random()*.5); s.stop(t+.3);
  thump(t+.16,.4,200,60,.22); sparkleRun(t+.2,12,.11,88,.035); jingle(t+.2,.15,0,8); };
/** each reward card pops in */
X.rewardReveal=(n=2)=>{ if(!ok())return; const t=now(); for(let i=0;i<n;i++){ bell(ladder(4+i*2,84),t+i*.18,.16,1,(i-(n-1)/2)*.4,.6); noiseBurst(t+i*.18,.03,.08,4000,0,.2); } };
/** Claim: coins whoosh away and a happy chord */
X.claim=()=>{ if(!ok())return; const t=now(); whoosh(t,.35,.12,true); [0,4,7,12].forEach((n,i)=>bell(midi(79+n),t+.1+i*.06,.15,1.2,(i-1.5)*.3,.6)); jingle(t+.15,.14,0,8); };
X._delay=(fn,s)=>setTimeout(fn,s*1000);
X.ctx=()=>AC;

window.NLSfx = X;
})();
