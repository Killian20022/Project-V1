// @ts-nocheck
// Moteur Galaxie Endor (relief + déblocage + locomotion), Canvas 2D.
export function createGalaxy(canvas, opts){
 opts=opts||{};
 const ctx=canvas.getContext('2d');
 const THEMES=['wild','jedi','wild','base','bunker','wild','ewok','wild','base','bunker','wild','wild','ewok','base','bunker','wild','base','jedi','ewok','wild','wild','wild','jedi','base','bunker'];
 const CASCADE=new Set([10,19,21]);
 const sceneAt=z=>CASCADE.has(z)?'cascade':THEMES[z];
 const GRID=5, TS=300, GAP=54, H=52;
 const WORLD=GRID*TS+(GRID-1)*GAP;
 const base=(opts.baseUrl||'')+'assets/';
 const IMG={},names=['wild','ewok','base','bunker','jedi','cascade'];
 names.forEach(n=>{const i=new Image();i.src=base+'zone_'+n+'.jpg';IMG['zone_'+n]=i;});
 const CH={},chipList=['luke','vader','han','leia','chewie','boba','yoda','stormtrooper','r2d2','bb8','rancor','bantha','atat','xwing','tie'];
 chipList.forEach(n=>{const i=new Image();i.src=base+'chip_'+n+'.png';CH[n]=i;});
 const DROIDS=new Set(['r2d2','bb8']);
 let unlocked=opts.unlocked||new Set([6,7,8,11,12,13,16,17,18]);
 let lockLabel=opts.lockLabel||'Termine des missions';

 const cam={x:WORLD/2,y:WORLD/2,z:0.3};let DPR=1,W=canvas.width,Hh=canvas.height;
 function zonePos(z){return{x:(z%GRID)*(TS+GAP),y:((z/GRID|0))*(TS+GAP)};}
 function w2s(x,y){return{x:(x-cam.x)*cam.z+W/2,y:(y-cam.y)*cam.z+Hh/2};}
 function s2w(x,y){return{x:(x-W/2)/cam.z+cam.x,y:(y-Hh/2)/cam.z+cam.y};}
 const rng=(a,b)=>a+Math.random()*(b-a);
 const units=[],ships=[];let shipTimer=1,t=0,last=performance.now();

 function spawnUnits(){
   units.length=0;
   const roster={wild:['chewie','han','stormtrooper','r2d2'],ewok:['leia','han','yoda','bb8','chewie'],
     base:['stormtrooper','stormtrooper','vader','r2d2','atat'],bunker:['stormtrooper','boba','tie'],
     jedi:['luke','yoda','r2d2','bb8'],cascade:['chewie','bb8','rancor']};
   unlocked.forEach(z=>{const p=zonePos(z),th=sceneAt(z),pool=roster[th]||roster.wild,n=3+(Math.random()*3|0);
     for(let i=0;i<n;i++){const k=pool[Math.random()*pool.length|0];addUnit(k,p.x,p.y);}});
   // unités possédées (boutique) dans la zone de départ
   const home=zonePos(12);(opts.owned||[]).forEach(k=>{if(CH[k])addUnit(k,home.x,home.y);});
 }
 function addUnit(k,zx,zy){units.push({k,zx,zy,x:zx+rng(40,TS-40),y:zy+rng(70,TS-30),tx:0,ty:0,
   face:Math.random()<.5?-1:1,run:Math.random()<.25,ph:rng(0,7),
   speed:(k==='atat'||k==='tie')?rng(8,14):(DROIDS.has(k)?rng(34,50):rng(16,30)),wait:rng(0,3),roll:0});}
 function spawnShip(){const k=Math.random()<.5?'xwing':'tie',fl=Math.random()<.5,y=rng(-100,WORLD+100),sp=rng(150,240);
   ships.push({k,x:fl?-200:WORLD+200,y,vx:(fl?1:-1)*sp,vy:rng(-28,28),size:k==='xwing'?70:56});}

 function drawWater(){const g=ctx.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#0b2b3a');g.addColorStop(1,'#061a24');
   ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);ctx.save();ctx.globalAlpha=.09;ctx.strokeStyle='#9fe8ff';ctx.lineWidth=2;
   for(let i=0;i<44;i++){const yy=((i*36+t*13)%(Hh+40))-20;ctx.beginPath();for(let x=0;x<=W;x+=26)ctx.lineTo(x,yy+Math.sin(x*0.03+i+t*0.6)*3);ctx.stroke();}ctx.restore();}
 function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
 function drawZone(z){const p=zonePos(z),s=w2s(p.x,p.y),size=TS*cam.z,h=H*cam.z,open=unlocked.has(z);
   ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(s.x+size/2,s.y+size+h*1.05,size*0.56,h*0.85,0,0,7);ctx.fill();
   const fg=ctx.createLinearGradient(0,s.y+size,0,s.y+size+h);
   if(open){fg.addColorStop(0,'#6b4a2c');fg.addColorStop(1,'#37240f');}else{fg.addColorStop(0,'#26333f');fg.addColorStop(1,'#131c25');}
   ctx.fillStyle=fg;rr(s.x,s.y+size-6*cam.z,size,h+6*cam.z,9*cam.z);ctx.fill();
   ctx.save();rr(s.x,s.y,size,size,11*cam.z);ctx.clip();
   if(open){const im=IMG['zone_'+sceneAt(z)];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,s.x,s.y,size,size);else{ctx.fillStyle='#3a5733';ctx.fillRect(s.x,s.y,size,size);} 
     const tg=ctx.createLinearGradient(0,s.y,0,s.y+size);tg.addColorStop(0,'rgba(255,240,200,.12)');tg.addColorStop(.15,'rgba(255,240,200,0)');tg.addColorStop(1,'rgba(0,10,20,.18)');ctx.fillStyle=tg;ctx.fillRect(s.x,s.y,size,size);}
   else{ctx.fillStyle='#0e1a22';ctx.fillRect(s.x,s.y,size,size);}ctx.restore();
   ctx.strokeStyle=open?'rgba(255,225,150,.4)':'rgba(120,150,180,.3)';ctx.lineWidth=2*cam.z;rr(s.x,s.y,size,size,11*cam.z);ctx.stroke();
   if(!open){ctx.fillStyle='#cdd7e0';ctx.textAlign='center';ctx.font=`${46*cam.z}px sans-serif`;ctx.fillText('🔒',s.x+size/2,s.y+size/2+6*cam.z);
     ctx.fillStyle='#9fb0bd';ctx.font=`bold ${16*cam.z}px sans-serif`;wrap(lockLabel,s.x+size/2,s.y+size/2+38*cam.z,size*0.86,19*cam.z);}
 }
 function wrap(txt,cx,cy,maxw,lh){const words=txt.split(' ');let line='',y=cy;const lines=[];for(const w of words){const test=line?line+' '+w:w;if(ctx.measureText(test).width>maxw&&line){lines.push(line);line=w;}else line=test;}if(line)lines.push(line);const start=y-(lines.length-1)*lh/2;lines.forEach((l,i)=>ctx.fillText(l,cx,start+i*lh));}
 function drawUnit(u){const s=w2s(u.x,u.y),z=cam.z,im=CH[u.k];if(!im||!im.complete||!im.naturalWidth)return;
   const moving=Math.hypot(u.tx-u.x,u.ty-u.y)>3,veh=(u.k==='atat'||u.k==='tie');
   const bh=(u.k==='atat'?150:veh?90:DROIDS.has(u.k)?60:96)*z,w=bh*(im.width/im.height);
   ctx.fillStyle='rgba(0,0,0,.30)';ctx.beginPath();ctx.ellipse(s.x,s.y,w*0.4,Math.max(3,bh*0.09),0,0,7);ctx.fill();
   ctx.save();ctx.translate(s.x,s.y);
   if(DROIDS.has(u.k)){ctx.rotate(Math.sin(u.roll)*0.5);ctx.translate(0,-Math.abs(Math.sin(u.roll))*2*z);}
   else if(!veh){const spd=u.run?16:9,amp=(u.run?5:3)*z;const bob=moving?Math.abs(Math.sin(t*spd+u.ph))*amp:Math.sin(t*2+u.ph)*1.5*z;ctx.translate(0,-bob);if(moving)ctx.rotate(Math.sin(t*spd+u.ph)*(u.run?0.14:0.06)*u.face);}
   else ctx.translate(0,-Math.sin(t*3+u.ph)*2*z);
   if(u.face<0)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-bh,w,bh);ctx.restore();}
 function drawShip(sh){const s=w2s(sh.x,sh.y),z=cam.z,im=CH[sh.k];if(!im||!im.complete||!im.naturalWidth)return;
   const a=Math.atan2(sh.vy,sh.vx),ang=a+Math.PI/2,size=sh.size*z,w=size*(im.width/im.height),dx=Math.cos(a),dy=Math.sin(a);
   const sg=w2s(sh.x,sh.y+130);ctx.fillStyle='rgba(0,0,0,.13)';ctx.beginPath();ctx.ellipse(sg.x,sg.y,size*0.5,size*0.14,0,0,7);ctx.fill();
   const glow=sh.k==='xwing'?'rgba(255,120,40,.95)':'rgba(90,190,255,.95)',streak=sh.k==='xwing'?'rgba(255,175,95,.55)':'rgba(150,215,255,.55)';
   const rx=s.x-dx*size*0.5,ry=s.y-dy*size*0.5;
   const grd=ctx.createLinearGradient(rx,ry,rx-dx*size*3,ry-dy*size*3);grd.addColorStop(0,streak);grd.addColorStop(1,'rgba(0,0,0,0)');
   ctx.strokeStyle=grd;ctx.lineWidth=Math.max(2,size*0.09);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-dx*size*3,ry-dy*size*3);ctx.stroke();
   const rg=ctx.createRadialGradient(rx,ry,1,rx,ry,size*0.6);rg.addColorStop(0,glow);rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(rx,ry,size*0.6,0,7);ctx.fill();
   ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);ctx.drawImage(im,-w/2,-size/2,w,size);ctx.restore();}
 function update(dt){for(const u of units){u.wait-=dt;
     if(u.wait<=0&&Math.hypot(u.tx-u.x,u.ty-u.y)<4){u.tx=u.zx+rng(40,TS-40);u.ty=u.zy+rng(70,TS-30);u.wait=rng(1,4);u.run=Math.random()<.25;}
     const dx=u.tx-u.x,dy=u.ty-u.y,d=Math.hypot(dx,dy);
     if(d>3){const sp=u.speed*(u.run?1.9:1);u.x+=dx/d*sp*dt;u.y+=dy/d*sp*dt;if(Math.abs(dx)>1)u.face=dx<0?-1:1;if(DROIDS.has(u.k))u.roll+=sp*dt*0.06;}}
   shipTimer-=dt;if(shipTimer<=0&&ships.length<4){spawnShip();shipTimer=rng(1.6,4);}
   for(let i=ships.length-1;i>=0;i--){const sh=ships[i];sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;if(sh.x<-400||sh.x>WORLD+400)ships.splice(i,1);}}
 function render(){drawWater();
   const order=[...Array(25).keys()].sort((a,b)=>(a/GRID|0)-(b/GRID|0));for(const z of order)drawZone(z);
   const ents=[...units.map(u=>({y:u.y,d:()=>drawUnit(u)})),...ships.map(sh=>({y:1e9,d:()=>drawShip(sh)}))];ents.sort((a,b)=>a.y-b.y);ents.forEach(e=>e.d());}
 let raf=0;
 function frame(now){const dt=Math.min((now-last)/1000||0,0.05);last=now;t+=dt;update(dt);ctx.setTransform(DPR,0,0,DPR,0,0);render();raf=requestAnimationFrame(frame);}
 function resize(dpr,cw,ch){DPR=dpr;W=cw;Hh=ch;canvas.width=cw*dpr;canvas.height=ch*dpr;}
 function fitUnlocked(){let sx=0,sy=0,n=0,minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;unlocked.forEach(z=>{const p=zonePos(z);sx+=p.x+TS/2;sy+=p.y+TS/2;n++;minx=Math.min(minx,p.x);miny=Math.min(miny,p.y);maxx=Math.max(maxx,p.x+TS);maxy=Math.max(maxy,p.y+TS);});
   if(!n){cam.x=WORLD/2;cam.y=WORLD/2;cam.z=0.3;return;}cam.x=sx/n;cam.y=sy/n;cam.z=Math.min(W/(maxx-minx+GAP*3),Hh/(maxy-miny+GAP*3))*0.95;cam.z=Math.max(0.12,Math.min(0.6,cam.z));}
 // input
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;cam.x-=(e.clientX-drag.x)/cam.z;cam.y-=(e.clientY-drag.y)/cam.z;drag.x=e.clientX;drag.y=e.clientY;});
 const end=e=>{drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const wpt=s2w(mx,my);cam.z=Math.max(0.12,Math.min(1.2,cam.z*Math.exp(-e.deltaY*0.0016)));cam.x=wpt.x-(mx-W/2)/cam.z;cam.y=wpt.y-(my-Hh/2)/cam.z;},{passive:false});
 return {
   start(dpr,cw,ch){resize(dpr||1,cw||canvas.width,ch||canvas.height);spawnUnits();fitUnlocked();for(let i=0;i<3;i++)spawnShip();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);},
   setUnlocked(set,label){unlocked=set;if(label)lockLabel=label;spawnUnits();},
   resize,stop(){cancelAnimationFrame(raf);},
   _cam:cam,_step(dpr,cw,ch,secs){resize(dpr,cw,ch);spawnUnits();fitUnlocked();for(let i=0;i<3;i++)spawnShip();let tt=0;while(tt<secs){update(1/60);t+=1/60;tt+=1/60;}ctx.setTransform(DPR,0,0,DPR,0,0);render();}
 };
};
