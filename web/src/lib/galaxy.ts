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
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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
     // Le tablier et ses poutres dépassent du sol : chaque passerelle a une épaisseur visible.
     p.fillStyle='#092015b8';p.fillRect(-70,-438,140,16);
     p.fillStyle='#3e3327';p.fillRect(-59,-443,118,12);
     p.fillStyle='#9f8552';p.fillRect(-56,-442,112,3);
     p.fillStyle='#253329';p.fillRect(-72,-478,8,52);p.fillRect(64,-478,8,52);
     p.fillStyle='#665d3e';p.fillRect(-63,-512,5,69);p.fillRect(58,-512,5,69);p.fillStyle='#c3b580';p.fillRect(-65,-456,9,11);p.fillRect(56,-456,9,11);p.restore();
   }
 }
 const hash=(z,i)=>{const n=Math.sin(z*127.1+i*311.7)*43758.5453;return n-Math.floor(n);};
 function drawParcelRelief(a,d,z){
   const edge=36*cam.z,depth=22*cam.z;
   ctx.save();
   let g=ctx.createLinearGradient(0,a.y+edge,0,a.y+edge+depth*2);
   g.addColorStop(0,'rgba(255,231,164,.26)');g.addColorStop(.16,'rgba(179,211,140,.13)');g.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=g;ctx.fillRect(a.x+edge,a.y+edge,d-edge*2,depth*2);
   g=ctx.createLinearGradient(0,a.y+d-edge-depth*2,0,a.y+d-edge);
   g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(5,20,15,.48)');
   ctx.fillStyle=g;ctx.fillRect(a.x+edge,a.y+d-edge-depth*2,d-edge*2,depth*2);
   g=ctx.createLinearGradient(a.x+d-edge-depth*2,0,a.x+d-edge,0);
   g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(6,24,17,.32)');
   ctx.fillStyle=g;ctx.fillRect(a.x+d-edge-depth*2,a.y+edge,depth*2,d-edge*2);
   ctx.strokeStyle='rgba(228,220,157,.25)';ctx.lineWidth=Math.max(1,2*cam.z);
   ctx.beginPath();ctx.moveTo(a.x+edge,a.y+d-edge);ctx.lineTo(a.x+edge,a.y+edge);ctx.lineTo(a.x+d-edge,a.y+edge);ctx.stroke();
   ctx.restore();
 }
 function drawLife(a,z){
   const scale=cam.z,theme=sceneAt(z);
   ctx.save();ctx.translate(a.x,a.y);ctx.scale(scale,scale);
   if(theme==='ewok'||theme==='wild'||theme==='jedi'){
     // Rayons mobiles sous la canopée : ils ajoutent de la profondeur sans masquer le pixel art.
     ctx.save();ctx.beginPath();ctx.rect(37,37,950,950);ctx.clip();ctx.globalCompositeOperation='screen';
     for(let i=0;i<2;i++){
       const sway=reducedMotion?0:Math.sin(t*.32+z+i*2)*24;
       const x=215+i*515+hash(z,i+730)*80+sway;
       const ray=ctx.createLinearGradient(x,110,x+105,810);
       ray.addColorStop(0,'rgba(255,236,164,.02)');ray.addColorStop(.45,'rgba(255,230,151,.07)');ray.addColorStop(1,'rgba(255,229,149,0)');
       ctx.fillStyle=ray;ctx.beginPath();ctx.moveTo(x,90);ctx.lineTo(x+65,90);ctx.lineTo(x+195,820);ctx.lineTo(x-80,820);ctx.fill();
     }ctx.restore();
   }
   // Petites touches propres à chaque parcelle, sur les lisières pour laisser les clairières libres.
   for(let i=0;i<20;i++){
     const side=i%2,x=side?70+hash(z,i)*260:690+hash(z,i)*260,y=115+hash(z,i+81)*780;
     const k=hash(z,i+41);ctx.globalAlpha=.4+k*.4;
     if(i%4===0){ctx.fillStyle='#4d593a';ctx.fillRect(x,y,10+k*9,3);ctx.fillStyle='#b0a783';ctx.fillRect(x+3,y-2,5,2);}
     else{ctx.fillStyle=i%3?'#c2a568':'#7b9e60';ctx.fillRect(x,y,3+k*3,3);ctx.fillStyle='#44683d';ctx.fillRect(x+2,y+3,8,2);}
   }
   if(!reducedMotion){
     for(let i=0;i<15;i++){
       const p=(t*(.023+i%3*.006)+hash(z,i+200))%1;
       const x=48+(i*173+z*67+p*145)%928,y=45+p*925;
       ctx.globalAlpha=Math.sin(p*Math.PI)*.55;ctx.fillStyle=i%3?'#e3c471':'#9cbc70';
       ctx.fillRect(Math.round(x+Math.sin(t*1.5+i)*13),Math.round(y),i%2?4:3,2);
     }
     // Lucioles près du village et du refuge, dispersées différemment dans chaque région.
     if(theme==='ewok'||theme==='jedi'||theme==='wild')for(let i=0;i<9;i++){
       const x=100+hash(z,i+310)*824,y=180+hash(z,i+410)*660;
       const glow=.2+.5*Math.pow(Math.sin(t*1.6+i*2.3+z),2);
       ctx.globalAlpha=glow;ctx.fillStyle=theme==='jedi'?'#a9e9dc':'#f2d67f';
       ctx.fillRect(Math.round(x+Math.sin(t+i)*5),Math.round(y+Math.cos(t*.8+i)*6),3,3);
     }
     if(theme==='cascade')drawWaterLife();
     if(theme==='ewok'){
       const pulse=.75+Math.sin(t*5+z)*.14;
       const fire=ctx.createRadialGradient(512,609,3,512,609,120);
       fire.addColorStop(0,`rgba(255,175,67,${.17*pulse})`);fire.addColorStop(1,'rgba(255,130,40,0)');
       ctx.globalAlpha=1;ctx.fillStyle=fire;ctx.fillRect(392,489,240,240);
       for(let i=0;i<5;i++){const h=9+Math.sin(t*8+i*1.7+z)*5;
         ctx.globalAlpha=.65+Math.sin(t*7+i)*.2;ctx.fillStyle=i%2?'#ffc46c':'#f58b43';
         ctx.fillRect(501+i*5,606-h,3,h);
       }
     }
     if(theme==='base'||theme==='bunker'){
       ctx.globalAlpha=.4+.25*Math.sin(t*2+z);ctx.fillStyle='#9be9eb';
       for(const [x,y] of [[298,380],[726,380],[390,748],[638,748]])ctx.fillRect(x,y,4,4);
     }
   }
   ctx.restore();
 }
 function drawWaterLife(){
   for(const [x,y,w,h,drift] of [[876,19,28,59,-19],[887,155,38,97,-38]]){
     ctx.save();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w+drift,y+h);ctx.lineTo(x+drift,y+h);ctx.closePath();ctx.clip();
     for(let i=0;i<24;i++){
       const p=(t*(.7+i%4*.13)+i*.137)%1;ctx.globalAlpha=.22+Math.sin(p*Math.PI)*.48;
       ctx.fillStyle=i%3?'#ddffff':'#7edbdc';ctx.fillRect(Math.round(x+(i*13)%w+drift*p),Math.round(y+p*h),2,5+i%7);
     }ctx.restore();
   }
   ctx.save();ctx.beginPath();ctx.moveTo(815,287);ctx.lineTo(865,283);ctx.lineTo(892,318);ctx.lineTo(875,348);ctx.lineTo(902,385);ctx.lineTo(851,410);ctx.lineTo(825,370);ctx.lineTo(784,352);ctx.lineTo(768,316);ctx.closePath();ctx.clip();
   for(let i=0;i<30;i++){const p=(t*.22+i*.113)%1;ctx.globalAlpha=Math.sin(p*Math.PI)*.48;ctx.fillStyle='#bdf9e8';ctx.fillRect(772+(i*29)%122,288+p*122,3+i%7,2);}
   ctx.restore();
 }
 function drawMap(){
   ctx.fillStyle='#193222';ctx.fillRect(0,0,W,Hh);ctx.imageSmoothingEnabled=false;
   const left=Math.max(0,Math.floor((cam.x-W/(2*cam.z))/TS)),right=Math.min(4,Math.floor((cam.x+W/(2*cam.z))/TS));
   const top=Math.max(0,Math.floor((cam.y-Hh/(2*cam.z))/TS)),bottom=Math.min(4,Math.floor((cam.y+Hh/(2*cam.z))/TS));
   for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
     const z=row*GRID+col,a=w2s(col*TS,row*TS),d=TS*cam.z,tile=scenes[sceneAt(z)];
     if(tile){ctx.drawImage(tile,a.x,a.y,d+.5,d+.5);drawParcelRelief(a,d,z);}
     else{ctx.fillStyle='#274934';ctx.fillRect(a.x,a.y,d,d);}
     if(!isOpen(z)){
       ctx.fillStyle='rgba(9,35,25,.91)';ctx.fillRect(a.x,a.y,d,d);
       ctx.strokeStyle='rgba(135,165,114,.25)';ctx.lineWidth=1;ctx.strokeRect(a.x+.5,a.y+.5,d-1,d-1);
     }else if(tile)drawLife(a,z);
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
 function fit(){cam.x=WORLD/2;cam.y=WORLD/2;cam.z=Math.min(.95,Math.max(.38,Math.min(W/1450,Hh/1120)));}
 function clampCamera(){const pad=TS*.2;cam.x=Math.max(-pad,Math.min(WORLD+pad,cam.x));cam.y=Math.max(-pad,Math.min(WORLD+pad,cam.y));}
 function zoomBy(factor){cam.z=Math.max(.12,Math.min(2.5,cam.z*factor));clampCamera();}
 function goHome(){fit();}
 function overview(){cam.x=WORLD/2;cam.y=WORLD/2;cam.z=Math.max(.12,Math.min(W,Hh)/(WORLD+TS*.2));}
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;cam.x-=(e.clientX-drag.x)/cam.z;cam.y-=(e.clientY-drag.y)/cam.z;clampCamera();drag.x=e.clientX;drag.y=e.clientY;});
 const end=()=>{drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wp=s2w(mx,my);zoomBy(Math.exp(-e.deltaY*0.0016));cam.x=wp.x-(mx-W/2)/cam.z;cam.y=wp.y-(my-Hh/2)/cam.z;clampCamera();},{passive:false});
 return {start(dpr,cw,ch){resize(dpr||1,cw||canvas.width,ch||canvas.height);spawnUnits();fit();for(let i=0;i<2;i++)spawnShip();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);},
   setUnlocked(set,label){unlocked=set;if(label)lockLabel=label;spawnUnits();},resize,zoomBy,goHome,overview,stop(){cancelAnimationFrame(raf);},_cam:cam};
};
