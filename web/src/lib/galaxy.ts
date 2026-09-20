// @ts-nocheck
// Galaxie Endor — les 25 grands territoires du Village des anciens.
export function createGalaxy(canvas, opts){
 opts=opts||{};
 const ctx=canvas.getContext('2d');
 const THEMES=['wild','jedi','wild','base','bunker','wild','ewok','wild','base','bunker','wild','wild','ewok','base','bunker','wild','base','jedi','ewok','wild','wild','wild','jedi','base','bunker'];
 const CASCADE=new Set([10,19,21]); const sceneAt=z=>CASCADE.has(z)?'cascade':THEMES[z];
 const GRID=5, TS=1024;
 const WORLD=GRID*TS;
 const base=(opts.baseUrl||'')+'assets/';
 const scenes={},files={wild:'forest',ewok:'ewok',base:'imperial',bunker:'bunker',jedi:'jedi',cascade:'cascade'};
 Object.entries(files).forEach(([theme,file])=>{
   const image=new Image();image.onload=()=>{
     const tile=document.createElement('canvas');tile.width=tile.height=TS;
     const p=tile.getContext('2d');p.imageSmoothingEnabled=false;
     p.drawImage(image,0,0,TS,TS);paintZoneEdges(p);scenes[theme]=tile;
   };image.src=base+'endor-'+file+'-zone.png';
 });
 const CH={},chipList=['luke','vader','han','leia','chewie','boba','yoda','stormtrooper','r2d2','bb8','rancor','bantha','atat','xwing','tie'];
 chipList.forEach(n=>{const i=new Image();i.src=base+'chip_'+n+'.png';CH[n]=i;});
 const DROIDS=new Set(['r2d2','bb8']);
 let unlocked=opts.unlocked||new Set([6,7,8,11,12,13,16,17,18]);
 let lockLabel=opts.lockLabel||'Termine des missions';
 const isOpen=z=>z>=0&&z<25&&unlocked.has(z);
 const zonePos=z=>({x:(z%GRID)*TS,y:((z/GRID|0))*TS});

 const cam={x:0,y:0,z:0.8};let DPR=1,W=canvas.width,Hh=canvas.height;
 function w2s(x,y){return{x:(x-cam.x)*cam.z+W/2,y:(y-cam.y)*cam.z+Hh/2};}
 function s2w(x,y){return{x:(x-W/2)/cam.z+cam.x,y:(y-Hh/2)/cam.z+cam.y};}
 const rng=(a,b)=>a+Math.random()*(b-a);
 const units=[],ships=[];let shipTimer=1,t=0,last=performance.now();

 function spawnUnits(){
   units.length=0;
   const open=[...unlocked];if(!open.length)return;
   // 1 SEUL de chaque type, réparti sur des zones ouvertes
   const solo=['luke','yoda','chewie','han','leia','r2d2','bb8','stormtrooper','vader','boba'];
   let i=0;for(const k of solo){const z=open[i%open.length];i++;place(k,z);}
   // 1 gros véhicule / créature si la zone existe
   const baseZ=open.find(z=>sceneAt(z)==='base');if(baseZ!=null)place('atat',baseZ);
   const wildZ=open.find(z=>sceneAt(z)==='wild');if(wildZ!=null)place('rancor',wildZ);
   const ewokZ=open.find(z=>sceneAt(z)==='ewok');if(ewokZ!=null)place('bantha',ewokZ);
   (opts.owned||[]).forEach((k,j)=>{if(CH[k])place(k,open[j%open.length]);});
 }
 function place(k,z){const p=zonePos(z),x=p.x+rng(390,650),y=p.y+rng(485,745);units.push({k,zx:p.x,zy:p.y,x,y,
   tx:x,ty:y,face:Math.random()<.5?-1:1,run:false,ph:rng(0,7),
   speed:(k==='atat'||k==='tie')?rng(8,13):(DROIDS.has(k)?rng(34,50):rng(15,26)),wait:rng(0,3),roll:0});}
 function spawnShip(){const k=Math.random()<.5?'xwing':'tie',fl=Math.random()<.5,y=rng(-100,WORLD+100),sp=rng(150,230);
   ships.push({k,x:fl?-200:WORLD+200,y,vx:(fl?1:-1)*sp,vy:rng(-26,26),size:k==='xwing'?74:58});}

 function paintZoneEdges(p){
   for(let side=0;side<4;side++){p.save();p.translate(512,512);p.rotate(side*Math.PI/2);
     p.fillStyle='#0a211ce8';p.fillRect(-512,-512,1024,36);
     p.fillStyle='#2b4636';p.fillRect(-476,-477,952,3);
     p.fillStyle='#a9b58455';p.fillRect(-472,-472,944,1);
     for(let i=0;i<105;i++){p.fillStyle=['#182f23','#244331','#304b36','#38533b'][i%4];p.fillRect(-507+(i*83)%1000,-508+(i*13)%27,3+(i%5),2+(i%4));}
     p.fillStyle='#183326';p.fillRect(-67,-512,134,69);p.fillStyle='#554c36';p.fillRect(-59,-512,118,69);
     for(let y=-511;y<-444;y+=8){p.fillStyle=(y+511)%16?'#ad8d57':'#967a4b';p.fillRect(-56,y,112,6);p.fillStyle='#ccb174';p.fillRect(-54,y,108,1);p.fillStyle='#534d32';p.fillRect(-49,y+3,2,2);p.fillRect(47,y+3,2,2);}
     p.fillStyle='#665d3e';p.fillRect(-63,-512,5,69);p.fillRect(58,-512,5,69);p.fillStyle='#c3b580';p.fillRect(-65,-456,9,11);p.fillRect(56,-456,9,11);p.restore();
   }
 }
 function drawMap(){
   ctx.fillStyle='#193222';ctx.fillRect(0,0,W,Hh);ctx.imageSmoothingEnabled=false;
   const left=Math.max(0,Math.floor((cam.x-W/(2*cam.z))/TS)),right=Math.min(4,Math.floor((cam.x+W/(2*cam.z))/TS));
   const top=Math.max(0,Math.floor((cam.y-Hh/(2*cam.z))/TS)),bottom=Math.min(4,Math.floor((cam.y+Hh/(2*cam.z))/TS));
   for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
     const z=row*GRID+col,a=w2s(col*TS,row*TS),d=TS*cam.z,tile=scenes[sceneAt(z)];
     if(tile)ctx.drawImage(tile,a.x,a.y,d+.5,d+.5);
     else{ctx.fillStyle='#274934';ctx.fillRect(a.x,a.y,d,d);}
     if(!isOpen(z)){
       ctx.fillStyle='rgba(9,35,25,.91)';ctx.fillRect(a.x,a.y,d,d);
       ctx.strokeStyle='rgba(135,165,114,.25)';ctx.lineWidth=1;ctx.strokeRect(a.x+.5,a.y+.5,d-1,d-1);
     }
   }
 }

 function drawUnit(u){const s=w2s(u.x,u.y),z=cam.z,im=CH[u.k];if(!im||!im.complete||!im.naturalWidth)return;
   const moving=Math.hypot(u.tx-u.x,u.ty-u.y)>3,veh=(u.k==='atat'||u.k==='tie');
   const bh=(u.k==='atat'?160:veh?96:DROIDS.has(u.k)?66:104)*z,w=bh*(im.width/im.height);
   ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(s.x,s.y,w*0.4,Math.max(3,bh*0.09),0,0,7);ctx.fill();
   ctx.save();ctx.translate(s.x,s.y);
   if(DROIDS.has(u.k)){ctx.rotate(Math.sin(u.roll)*0.5);ctx.translate(0,-Math.abs(Math.sin(u.roll))*2*z);}
   else if(!veh){const spd=u.run?16:9,amp=(u.run?5:3)*z;const bob=moving?Math.abs(Math.sin(t*spd+u.ph))*amp:Math.sin(t*2+u.ph)*1.5*z;ctx.translate(0,-bob);if(moving)ctx.rotate(Math.sin(t*spd+u.ph)*(u.run?0.14:0.06)*u.face);}
   else ctx.translate(0,-Math.sin(t*3+u.ph)*2*z);
   if(u.face<0)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-bh,w,bh);ctx.restore();}
 function drawShip(sh){const s=w2s(sh.x,sh.y),z=cam.z,im=CH[sh.k];if(!im||!im.complete||!im.naturalWidth)return;
   const a=Math.atan2(sh.vy,sh.vx),ang=a+Math.PI/2,size=sh.size*z,w=size*(im.width/im.height),dx=Math.cos(a),dy=Math.sin(a);
   const glow=sh.k==='xwing'?'rgba(255,120,40,.95)':'rgba(90,190,255,.95)',streak=sh.k==='xwing'?'rgba(255,175,95,.55)':'rgba(150,215,255,.55)';
   const rx=s.x-dx*size*0.5,ry=s.y-dy*size*0.5;
   const grd=ctx.createLinearGradient(rx,ry,rx-dx*size*3,ry-dy*size*3);grd.addColorStop(0,streak);grd.addColorStop(1,'rgba(0,0,0,0)');
   ctx.strokeStyle=grd;ctx.lineWidth=Math.max(2,size*0.09);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-dx*size*3,ry-dy*size*3);ctx.stroke();
   const rg=ctx.createRadialGradient(rx,ry,1,rx,ry,size*0.6);rg.addColorStop(0,glow);rg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(rx,ry,size*0.6,0,7);ctx.fill();
   ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);ctx.drawImage(im,-w/2,-size/2,w,size);ctx.restore();}

 function update(dt){for(const u of units){u.wait-=dt;
     if(u.wait<=0&&Math.hypot(u.tx-u.x,u.ty-u.y)<4){u.tx=u.zx+rng(390,650);u.ty=u.zy+rng(485,745);u.wait=rng(1.5,5);u.run=Math.random()<.3;}
     const dx=u.tx-u.x,dy=u.ty-u.y,d=Math.hypot(dx,dy);
     if(d>3){const sp=u.speed*(u.run?1.9:1);u.x+=dx/d*sp*dt;u.y+=dy/d*sp*dt;if(Math.abs(dx)>1)u.face=dx<0?-1:1;if(DROIDS.has(u.k))u.roll+=sp*dt*0.06;}}
   shipTimer-=dt;if(shipTimer<=0&&ships.length<3){spawnShip();shipTimer=rng(2.5,5.5);}
   for(let i=ships.length-1;i>=0;i--){const sh=ships[i];sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;if(sh.x<-400||sh.x>WORLD+400)ships.splice(i,1);}}
 function render(){drawMap();
   const ents=[...units.map(u=>({y:u.y,d:()=>drawUnit(u)})),...ships.map(sh=>({y:1e9,d:()=>drawShip(sh)}))];ents.sort((a,b)=>a.y-b.y);ents.forEach(e=>e.d());}
 let raf=0;function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;t+=dt;update(dt);ctx.setTransform(DPR,0,0,DPR,0,0);render();raf=requestAnimationFrame(frame);}
 function resize(dpr,cw,ch){DPR=dpr;W=cw;Hh=ch;canvas.width=cw*dpr;canvas.height=ch*dpr;}
 function fit(){cam.x=WORLD/2;cam.y=WORLD/2;cam.z=Math.min(.8,Math.max(.52,Math.min(W/1550,Hh/1400)));}
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;cam.x-=(e.clientX-drag.x)/cam.z;cam.y-=(e.clientY-drag.y)/cam.z;drag.x=e.clientX;drag.y=e.clientY;});
 const end=()=>{drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wp=s2w(mx,my);cam.z=Math.max(0.28,Math.min(1.6,cam.z*Math.exp(-e.deltaY*0.0016)));cam.x=wp.x-(mx-W/2)/cam.z;cam.y=wp.y-(my-Hh/2)/cam.z;},{passive:false});
 return {start(dpr,cw,ch){resize(dpr||1,cw||canvas.width,ch||canvas.height);spawnUnits();fit();for(let i=0;i<2;i++)spawnShip();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);},
   setUnlocked(set,label){unlocked=set;if(label)lockLabel=label;spawnUnits();},resize,stop(){cancelAnimationFrame(raf);},_cam:cam};
};
