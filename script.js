/* Recruiter Mario — script.js
   Procedural sprites, gameplay:
   - Move, jump, shoot offers
   - Candidates walk; accept/reject
   - Career growth thresholds -> costume changes
   - Bad/Good hiring managers, magnet, projects, flag + fireworks
   - Simple generated sounds
*/

// --- Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let DPR = Math.min(2, window.devicePixelRatio || 1);
function resize() {
  const cssW = Math.min(window.innerWidth - 40, 1000);
  const cssH = Math.round(cssW * 0.562);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * DPR);
  canvas.height = Math.round(cssH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
resize();

// --- Simple sound generator (WebAudio)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq=440, time=0.12, type='sine', gain=0.08){
  const t0 = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t0); o.stop(t0 + time);
}

// --- Input
const keys = new Set();
window.addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); if(e.key === ' ' || e.key === 'ArrowUp') e.preventDefault(); if(e.key.toLowerCase()==='p') paused = !paused; });
window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()); });

// mobile buttons
['m-left','m-right','m-jump','m-shoot','m-pause'].forEach(id=>{
  const el = document.getElementById(id);
  if(!el) return;
});

// convenience for mobile elements added in index
const mleft = document.getElementById('m-left');
const mright = document.getElementById('m-right');
const mjump = document.getElementById('m-jump');
const mshoot = document.getElementById('m-shoot');
const mpause = document.getElementById('m-pause');
let leftHeld=false, rightHeld=false;
if(mleft){ ['touchstart','mousedown'].forEach(ev=>mleft.addEventListener(ev,e=>{e.preventDefault(); leftHeld=true;})); ['touchend','mouseup','mouseleave'].forEach(ev=>mleft.addEventListener(ev,e=>{leftHeld=false;})); }
if(mright){ ['touchstart','mousedown'].forEach(ev=>mright.addEventListener(ev,e=>{e.preventDefault(); rightHeld=true;})); ['touchend','mouseup','mouseleave'].forEach(ev=>mright.addEventListener(ev,e=>{rightHeld=false;})); }
if(mjump){ ['touchstart','mousedown','click'].forEach(ev=>mjump.addEventListener(ev,e=>{e.preventDefault(); playerJump(); })); }
if(mshoot){ ['touchstart','mousedown','click'].forEach(ev=>mshoot.addEventListener(ev,e=>{e.preventDefault(); playerShoot(); })); }
if(mpause){ ['touchstart','mousedown','click'].forEach(ev=>mpause.addEventListener(ev,e=>{e.preventDefault(); paused=!paused; })); }

// --- HUD elements
const hudScore = document.getElementById('score');
const hudCVs = document.getElementById('cvs');
const hudLevel = document.getElementById('level');
const hudTime = document.getElementById('time');

// overlays
const overlay = document.getElementById('overlay');
const how = document.getElementById('how');
const end = document.getElementById('end');
document.getElementById('btn-start').onclick = ()=>{ overlay.style.display='none'; startLevel(); };
document.getElementById('btn-how').onclick = ()=>{ overlay.style.display='none'; how.style.display='grid'; };
document.getElementById('btn-back').onclick = ()=>{ how.style.display='none'; overlay.style.display='grid'; };
document.getElementById('btn-restart').onclick = ()=>{ end.style.display='none'; overlay.style.display='none'; startLevel(); };

// --- Game variables
let paused = true, levelData, player, camX=0, timeLeft=90, randSeed=1;

// role thresholds (cumulative)
const roles = [
  {name:'Associate TA', need:5, color:'#d1fae5'},
  {name:'TA', need:15, color:'#bbf7d0'},
  {name:'Sr TA', need:35, color:'#86efac'},
  {name:'Lead TA', need:65, color:'#4ade80'},
  {name:'Manager TA', need:105, color:'#22c55e'},
  {name:'Sr Manager TA', need:155, color:'#15803d'}
];

// helper: current role by total recruited
function roleFor(total){
  for(let i=roles.length-1;i>=0;i--){ if(total>=roles[i].need) return {index:i,role:roles[i]}; }
  return {index:0,role:roles[0]};
}

// --- Entities & helpers
class Rect{ constructor(x,y,w,h){ this.x=x; this.y=y; this.w=w; this.h=h; } }
const aabb = (A,B) => A.x < B.x + B.w && A.x + A.w > B.x && A.y < B.y + B.h && A.y + A.h > B.y;

function rnd(min,max){ return Math.random()*(max-min)+min; }

// procedural drawing helpers: recruiter (Mario-like), candidate (green person), envelope, pillar, manager
function drawRecruiter(x,y,size,roleIndex){
  // head
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle = ['#dbeafe','#f8fafc','#fde68a'][roleIndex%3] || '#ffe';
  ctx.fillRect(-size/2, -size, size, size*0.7); // head
  // body
  ctx.fillStyle = (roleIndex>=4)?'#0ea5e9':'#1f2937';
  ctx.fillRect(-size*0.45, -size*0.2, size*0.9, size*0.9);
  // tie
  ctx.fillStyle='#f59e0b';
  ctx.fillRect(-4, 2, 8, 12);
  ctx.restore();
}

function drawCandidate(x,y,size){
  ctx.save();
  ctx.translate(x,y);
  // head
  ctx.fillStyle = '#16a34a';
  ctx.beginPath(); ctx.arc(0, -size*0.6, size*0.22,0,Math.PI*2); ctx.fill();
  // body
  ctx.fillRect(-size*0.25, -size*0.4, size*0.5, size*0.6);
  ctx.restore();
}

function drawEnvelope(x,y,w,h){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='#fff';
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.strokeStyle='#cbd5e1';
  ctx.strokeRect(-w/2, -h/2, w, h);
  ctx.fillStyle='#0ea5e9';
  ctx.beginPath(); ctx.moveTo(-w/2,-h/2); ctx.lineTo(0,0); ctx.lineTo(w/2,-h/2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawPillar(x,y,h){
  ctx.fillStyle='#6b7280';
  ctx.fillRect(x-16,y-h,32,h);
  ctx.fillStyle='#9ca3af55';
  ctx.fillRect(x-14,y-h+8,28,8);
}

function drawManager(x,y,good=false){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle = good? '#f59e0b' : '#ef4444';
  ctx.fillRect(-18,-36,36,36);
  ctx.fillStyle = '#111827';
  ctx.fillRect(-8,-16,16,6);
  ctx.restore();
}

// --- Level builder
function makeLevel(){
  const width = 2600;
  const platforms = [ new Rect(0,520,width,60) ];
  // pillars spaced
  const pillars = [];
  for(let i=0;i<7;i++){
    const px = 220 + i*300;
    pillars.push({x:px, h: rnd(140,260)});
  }
  // initial candidates
  const candidates = [];
  for(let i=0;i<6;i++){
    candidates.push({ x: 600 + i*240, y: 520, w: 28, h: 36, vx: -24 + rnd(-4,4), state:'walk', accept:false, anim:0 });
  }
  const referrals = [];
  const enemies = []; // villain managers
  const goodManagers = [];
  const powerups = [];
  const flag = new Rect(width-120, 520-140, 18, 140);
  return { width, platforms, pillars, candidates, referrals, enemies, goodManagers, powerups, flag, time:90 };
}

// --- Game objects & player
function resetPlayer(){
  player = {
    x: 80, y: 520-46, w: 34, h: 46,
    vx:0, vy:0, onGround:true,
    score:0, recruited:0, shield:0, magnet:0, roleIndex:0,
    shoots: []
  };
}

let level;
function startLevel(){
  level = makeLevel();
  resetPlayer();
  camX = 0;
  paused = false;
  timeLeft = level.time;
  updateHUD();
  beep(660,0.1,'square',0.06);
}

// --- Player controls
function playerJump(){
  if(player && player.onGround && !paused){
    player.vy = -630;
    player.onGround = false;
    beep(880,0.08,'sawtooth',0.06);
  }
}
function playerShoot(){
  if(!player || paused) return;
  // limit fire rate simply
  if(!player._lastShot || (performance.now()-player._lastShot)>250){
    player._lastShot = performance.now();
    const bullet = { x: player.x + player.w/2, y: player.y + player.h/2 - 6, vx: 520, w:16, h:10 };
    player.shoots.push(bullet);
    beep(1200,0.06,'triangle',0.04);
  }
}

// mobile events
if(mleft) { ['touchstart','mousedown'].forEach(ev=>mleft.addEventListener(ev,e=>{e.preventDefault(); leftHeld=true;})); ['touchend','mouseup','mouseleave'].forEach(ev=>mleft.addEventListener(ev,()=>leftHeld=false));}
if(mright){ ['touchstart','mousedown'].forEach(ev=>mright.addEventListener(ev,e=>{e.preventDefault(); rightHeld=true;})); ['touchend','mouseup','mouseleave'].forEach(ev=>mright.addEventListener(ev,()=>rightHeld=false));}
if(mjump){ ['touchstart','mousedown','click'].forEach(ev=>mjump.addEventListener(ev,e=>{e.preventDefault(); playerJump(); }));}
if(mshoot){ ['touchstart','mousedown','click'].forEach(ev=>mshoot.addEventListener(ev,e=>{e.preventDefault(); playerShoot(); }));}
if(mpause){ ['touchstart','mousedown','click'].forEach(ev=>mpause.addEventListener(ev,e=>{e.preventDefault(); paused=!paused; }));}

// keyboard listeners for shoot
window.addEventListener('keydown', e=>{
  if(e.key.toLowerCase()==='s') playerShoot();
  if(e.key==='ArrowUp' || e.key.toLowerCase()==='w' || e.key===' ') { playerJump(); keys.delete(' '); }
});

// --- Main loop
let lastTS = 0;
function loop(ts){
  window.requestAnimationFrame(loop);
  if(!lastTS) lastTS = ts;
  const dt = Math.min(0.033, (ts-lastTS)/1000);
  lastTS = ts;
  if(!paused) update(dt);
  draw(dt);
}
requestAnimationFrame(loop);

// --- update
function update(dt){
  // time
  timeLeft -= dt;
  if(timeLeft<=0){ finish(false); return; }

  // player movement
  const left = keys.has('arrowleft') || keys.has('a') || leftHeld;
  const right = keys.has('arrowright') || keys.has('d') || rightHeld;
  const accel = 1400;
  const maxSpeed = 260 * (player.magnet?1.3:1);
  if(left) player.vx -= accel*dt;
  if(right) player.vx += accel*dt;
  player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  if(!left && !right) player.vx *= 0.86;
  player.vy += 1600 * dt;

  // apply motion + collisions
  player.x += player.vx*dt;
  player.y += player.vy*dt;
  player.onGround = false;
  for(const p of level.platforms){
    if(aabb(new Rect(player.x,player.y,player.w,player.h), p)){
      if(player.vy>0){ player.y = p.y - player.h; player.vy = 0; player.onGround = true; }
    }
  }
  // floor clamp
  if(player.y + player.h > 520){ player.y = 520 - player.h; player.vy = 0; player.onGround = true; }

  // camera
  camX = Math.max(0, Math.min(level.width - canvas.width/DPR, player.x - canvas.width/DPR*0.35));

  // update bullets
  for(let i=player.shoots.length-1;i>=0;i--){
    const b = player.shoots[i];
    b.x += b.vx * dt;
    if(b.x - camX > canvas.width/DPR + 40) player.shoots.splice(i,1);
  }

  // spawn candidates occasionally
  if(Math.random() < 0.012) {
    const x = camX + canvas.width/DPR + rnd(40,300);
    level.candidates.push({ x:x, y:520-36, w:28, h:36, vx: rnd(-28,-18), state:'walk', anim:0, accept:false});
  }

  // candidates move & react
  for(let i=level.candidates.length-1;i>=0;i--){
    const c = level.candidates[i];
    c.x += c.vx * dt;
    c.anim += dt*6;
    // if envelope hits candidate
    // check bullet collisions
    let hitByOffer = null;
    for(let j=player.shoots.length-1;j>=0;j--){
      const b = player.shoots[j];
      if(aabb(new Rect(b.x-8,b.y-6,b.w,b.h), new Rect(c.x-8,c.y-8,c.w,c.h))){
        hitByOffer = b;
        player.shoots.splice(j,1);
        break;
      }
    }
    if(hitByOffer){
      // decide accept or reject
      if(Math.random() < 0.7){ // accept
        player.score += 1;
        player.recruited += 1;
        beep(900,0.06,'sine',0.06);
        // pause candidate and walk to player area (absorb)
        c.state = 'got';
        // remove after small delay
        setTimeout(()=> {
          const idx = level.candidates.indexOf(c);
          if(idx>=0) level.candidates.splice(idx,1);
        }, 350);
      } else {
        // reject: candidate throws back envelope (shoots small paper)
        beep(300,0.08,'triangle',0.05);
        // create enemy projectile
        level.enemies.push({ type:'paper', x: c.x-10, y: c.y+4, vx:  -260 + rnd(-30,30), life:1});
        c.state = 'reject';
      }
    }

    // candidate falling off left
    if(c.x + c.w < camX - 60) level.candidates.splice(i,1);
  }

  // enemies act (managers can shoot or remove candidates)
  // spawn bad/good manager rarely
  if(Math.random() < 0.0025){
    // place near right side
    const x = camX + canvas.width/DPR + rnd(30,200);
    if(Math.random() < 0.6) level.enemies.push({ type:'badManager', x, y:520-36, vx:-40, t:0});
    else level.goodManagers.push({ x, y:520-36, vx:-30, t:0 });
  }

  // update enemies
  for(let i=level.enemies.length-1;i>=0;i--){
    const e = level.enemies[i];
    if(e.type === 'paper'){
      e.x += e.vx * dt; e.life -= dt;
      // collision with player
      if(aabb(new Rect(e.x,e.y,10,10), new Rect(player.x,player.y,player.w,player.h))){
        // player hit
        player.score = Math.max(0, player.score-2);
        player.vx = -200;
        beep(140,0.15,'sawtooth',0.08);
        level.enemies.splice(i,1);
        continue;
      }
      if(e.x < camX - 120 || e.life <= 0) level.enemies.splice(i,1);
    } else if(e.type === 'badManager'){
      e.x += e.vx * dt;
      e.t += dt;
      // every 1.5s shoot meeting invite (slows)
      if(e.t > 1.6){
        e.t = 0;
        // pick a candidate near him to snatch
        const near = level.candidates.find(c=> Math.abs(c.x - e.x) < 120);
        if(near){
          // snatch: remove candidate & reduce player's count if already recruited recently
          const idx = level.candidates.indexOf(near);
          if(idx>=0) level.candidates.splice(idx,1);
          // player penalty if near
          if(Math.abs(player.x - e.x) < 160){ player.score = Math.max(0, player.score-3); beep(160,0.12,'sine',0.06); }
        }
      }
      if(e.x < camX - 120) level.enemies.splice(i,1);
    }
  }

  // good managers
  for(let i=level.goodManagers.length-1;i>=0;i--){
    const g = level.goodManagers[i];
    g.x += g.vx * dt; g.t += dt;
    if(g.t > 3.2){
      g.t = 0;
      // give magnet or +5 candidates
      if(Math.random() < 0.6){
        player.magnet = 5; // draw next 5 candidates quickly
        beep(1200,0.2,'sine',0.06);
      } else {
        // spawn 5 small candidates near player
        for(let k=0;k<5;k++){
          level.candidates.push({ x: player.x + rnd(40,200) + k*18, y:520-36, w:24, h:32, vx: rnd(-36,-10), state:'walk', anim:0 });
        }
        beep(1800,0.18,'triangle',0.06);
      }
    }
    if(g.x < camX - 160) level.goodManagers.splice(i,1);
  }

  // apply magnet: instant recruit of nearest candidates up to magnet count
  if(player.magnet > 0){
    for(let i=level.candidates.length-1;i>=0 && player.magnet>0;i--){
      const c = level.candidates[i];
      // pick those within 400 px
      if(Math.abs(c.x - player.x) < 420){
        level.candidates.splice(i,1);
        player.score += 1;
        player.recruited += 1;
        player.magnet--;
        popText(c.x, c.y, '+1 (magnet)');
        beep(1000,0.06,'square',0.06);
      }
    }
  }

  // projects appear rarely -> bonus points
  if(Math.random() < 0.0012){
    level.powerups.push({ x: camX + canvas.width/DPR + rnd(40,200), y: 520-48, kind:'project' });
  }
  for(let i=level.powerups.length-1;i>=0;i--){
    const p = level.powerups[i];
    p.x += -160 * dt;
    // collision with player gives +5
    if(aabb(new Rect(p.x-8,p.y-8,32,32), new Rect(player.x,player.y,player.w,player.h))){
      player.score += 5;
      popText(p.x,p.y,'Project +5');
      beep(1500,0.12,'sine',0.06);
      level.powerups.splice(i,1);
    }
    if(p.x < camX - 120) level.powerups.splice(i,1);
  }

  // check recruit thresholds role up
  const r = roleFor(player.recruited);
  player.roleIndex = r.index;
  hudLevel.textContent = 'Role: ' + r.role.name;
  // if recruited enough for final top role and reached near flag -> finish
  if(player.recruited >= roles[roles.length-1].need && player.x > level.flag.x - 200) finish(true);
}

// --- drawing
const pops = [];
function popText(x,y,text){
  pops.push({x,y,text,life:1});
}
function draw(dt){
  // clear
  ctx.clearRect(0,0,canvas.width/DPR,canvas.height/DPR);
  // background sky
  ctx.fillStyle = '#8bc6ff';
  ctx.fillRect(0,0,canvas.width/DPR, 240);
  // office skyline rectangle
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(0,240,canvas.width/DPR, 280);

  // draw pillars
  for(const p of level.pillars){
    drawPillar(p.x - camX + 40, 520, p.h);
  }

  // platforms
  ctx.fillStyle = '#0f172a';
  for(const pl of level.platforms){
    ctx.fillRect(pl.x - camX, pl.y, pl.w, pl.h);
  }

  // draw flag
  const f = level.flag;
  ctx.save();
  ctx.translate(f.x - camX + f.w/2, f.y);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-f.w/2, 0, f.w, f.h);
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath(); ctx.moveTo(f.w/2, 16); ctx.lineTo(f.w/2+46, 30); ctx.lineTo(f.w/2,44); ctx.closePath(); ctx.fill();
  ctx.restore();

  // draw candidates
  for(const c of level.candidates){
    drawCandidate(c.x - camX + c.w/2, c.y, 28);
  }

  // draw powerups
  for(const p of level.powerups){
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(p.x - camX, p.y - 10, 28, 20);
    ctx.fillStyle = '#111827';
    ctx.fillText('Proj', p.x - camX + 4, p.y + 4);
  }

  // draw enemies (papers & managers)
  for(const e of level.enemies){
    if(e.type === 'paper'){ ctx.fillStyle='#fff'; ctx.fillRect(e.x - camX, e.y, 12, 8); ctx.strokeStyle='#cbd5e1'; ctx.strokeRect(e.x - camX, e.y, 12, 8); }
    else if(e.type === 'badManager'){ drawManager(e.x - camX, e.y, false); }
  }
  for(const g of level.goodManagers) drawManager(g.x - camX, g.y, true);

  // draw player's bullets
  for(const b of player.shoots) drawEnvelope(b.x - camX, b.y, 20, 12);

  // draw player (size grows by role)
  const sizeMul = 1 + player.roleIndex * 0.12;
  ctx.save();
  drawRecruiter(player.x - camX + player.w/2, player.y + player.h/2, 32 * sizeMul, player.roleIndex);
  ctx.restore();

  // draw pops
  for(const p of pops){
    ctx.globalAlpha = p.life;
    ctx.fillStyle = '#111827';
    ctx.fillText(p.text, p.x - camX, p.y - 16);
    ctx.globalAlpha = 1;
    p.life -= 0.02;
  }
  while(pops.length && pops[0].life <= 0) pops.shift();

  // HUD update every draw
  hudScore.textContent = 'Score: ' + player.score;
  hudCVs.textContent = 'Candidates: ' + player.recruited + ' / ' + roles[Math.min(player.roleIndex, roles.length-1)].need;
  hudTime.textContent = 'Time: ' + Math.max(0, Math.floor(timeLeft));
}

// --- finish and fireworks
function finish(won){
  paused = true;
  end.style.display = 'grid';
  document.getElementById('endTitle').textContent = won? 'Victory! Flag Raised 🎉' : 'Time Up ⏳';
  document.getElementById('endText').textContent = `Final Score: ${player.score}. Recruited: ${player.recruited}. Role: ${roles[player.roleIndex].name}`;
  if(won) {
    // small fireworks animation via sounds
    for(let i=0;i<6;i++) setTimeout(()=>beep(500 + i*150, 0.12, 'sawtooth', 0.06), i*120);
  } else beep(120,0.25,'sine',0.08);
}

// initial start link
startLevel();
