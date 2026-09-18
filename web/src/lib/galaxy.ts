// @ts-nocheck
// Galaxie Endor — îles carrées flottantes qui se rejoignent (style Nihondex), Canvas 2D.
export function createGalaxy(canvas, opts){
 opts=opts||{};
 const ctx=canvas.getContext('2d');
 const THEMES=['wild','jedi','wild','base','bunker','wild','ewok','wild','base','bunker','wild','wild','ewok','base','bunker','wild','base','jedi','ewok','wild','wild','wild','jedi','base','bunker'];
 const CASCADE=new Set([10,19,21]); const sceneAt=z=>CASCADE.has(z)?'cascade':THEMES[z];
 const GRID=5, TS=300, H=54;                 // tuiles adjacentes (pas de gap) + épaisseur
 const WORLD=GRID*TS;
 const base=(opts.baseUrl||'')+'assets/';
 const IMG={},names=['wild','ewok','base','bunker','jedi','cascade'];
 names.forEach(n=>{const i=new Image();i.src=base+'zone_'+n+'.jpg';IMG['zone_'+n]=i;});
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
 function place(k,z){const p=zonePos(z);units.push({k,zx:p.x,zy:p.y,x:p.x+rng(70,TS-70),y:p.y+rng(110,TS-60),
   tx:0,ty:0,face:Math.random()<.5?-1:1,run:false,ph:rng(0,7),
   speed:(k==='atat'||k==='tie')?rng(8,13):(DROIDS.has(k)?rng(34,50):rng(15,26)),wait:rng(0,3),roll:0});}
 function spawnShip(){const k=Math.random()<.5?'xwing':'tie',fl=Math.random()<.5,y=rng(-100,WORLD+100),sp=rng(150,230);
   ships.push({k,x:fl?-200:WORLD+200,y,vx:(fl?1:-1)*sp,vy:rng(-26,26),size:k==='xwing'?74:58});}

 function water(){const g=ctx.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'#0c2f40');g.addColorStop(1,'#061a26');
   ctx.fillStyle=g;ctx.fillRect(0,0,W,Hh);ctx.save();ctx.globalAlpha=.08;ctx.strokeStyle='#a7ecff';ctx.lineWidth=2;
   for(let i=0;i<46;i++){const yy=((i*34+t*12)%(Hh+40))-20;ctx.beginPath();for(let x=0;x<=W;x+=28)ctx.lineTo(x,yy+Math.sin(x*0.028+i+t*0.5)*3);ctx.stroke();}ctx.restore();}

 function landmassShadow(){
   // grosse ombre douce sous l'ensemble des zones ouvertes
   let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;unlocked.forEach(z=>{const p=zonePos(z);minx=Math.min(minx,p.x);miny=Math.min(miny,p.y);maxx=Math.max(maxx,p.x+TS);maxy=Math.max(maxy,p.y+TS);});
   if(minx>maxx)return;const a=w2s(minx,miny),b=w2s(maxx,maxy),off=(H+26)*cam.z;
   ctx.save();ctx.fillStyle='rgba(0,0,0,.46)';ctx.filter='blur('+(22*cam.z)+'px)';
   const r=26*cam.z;const x=a.x+8*cam.z,y=a.y+off,w=b.x-a.x-16*cam.z,h=b.y-a.y;
   rr(x,y,w,h+off*0.4,r);ctx.fill();ctx.restore();
 }
 function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

 function drawLocked(z){const p=zonePos(z),s=w2s(p.x,p.y),size=TS*cam.z;
   ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#0c2230';ctx.fillRect(s.x,s.y,size,size);
   // reflets d'eau dans la case immergée
   ctx.globalAlpha=.06;ctx.strokeStyle='#8fd6ff';ctx.lineWidth=1.5;
   for(let i=0;i<5;i++){const yy=s.y+((i*20+t*10)%size);ctx.beginPath();ctx.moveTo(s.x+6,yy);ctx.lineTo(s.x+size-6,yy);ctx.stroke();}
   ctx.globalAlpha=1;ctx.strokeStyle='rgba(90,120,150,.28)';ctx.lineWidth=1;ctx.strokeRect(s.x+.5,s.y+.5,size-1,size-1);
   ctx.fillStyle='#b9c6d2';ctx.textAlign='center';ctx.font=`${52*cam.z}px sans-serif`;ctx.fillText('🔒',s.x+size/2,s.y+size/2+4*cam.z);
   ctx.fillStyle='#93a6b4';ctx.font=`600 ${17*cam.z}px sans-serif`;wrap(lockLabel,s.x+size/2,s.y+size/2+40*cam.z,size*0.82,20*cam.z);
   ctx.restore();}
 function wrap(txt,cx,cy,maxw,lh){const words=txt.split(' ');let line='';const lines=[];for(const w of words){const tst=line?line+' '+w:w;if(ctx.measureText(tst).width>maxw&&line){lines.push(line);line=w;}else line=tst;}if(line)lines.push(line);const start=cy-(lines.length-1)*lh/2;lines.forEach((l,i)=>ctx.fillText(l,cx,start+i*lh));}

 function drawOpen(z){const p=zonePos(z),s=w2s(p.x,p.y),size=TS*cam.z,h=H*cam.z;
   // falaises (épaisseur) uniquement sur les bords extérieurs de l'île connectée
   const southOpen=isOpen(z+GRID),westOpen=(z%GRID!==0)&&isOpen(z-1),eastOpen=(z%GRID!==GRID-1)&&isOpen(z+1);
   // face sud
   if(!southOpen){const fg=ctx.createLinearGradient(0,s.y+size,0,s.y+size+h);fg.addColorStop(0,'#6f4c2d');fg.addColorStop(.5,'#563a22');fg.addColorStop(1,'#33230f');ctx.fillStyle=fg;ctx.fillRect(s.x,s.y+size-1,size,h);
     ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(s.x,s.y+size+h-4*cam.z,size,4*cam.z);}
   if(!eastOpen){const eg=ctx.createLinearGradient(s.x+size,0,s.x+size+h*0.5,0);eg.addColorStop(0,'#4a3319');eg.addColorStop(1,'#2c1d0c');ctx.fillStyle=eg;ctx.fillRect(s.x+size-1,s.y+4*cam.z,h*0.5,size);}
   if(!westOpen){const wg=ctx.createLinearGradient(s.x-h*0.5,0,s.x,0);wg.addColorStop(0,'#2c1d0c');wg.addColorStop(1,'#4a3319');ctx.fillStyle=wg;ctx.fillRect(s.x-h*0.5,s.y+4*cam.z,h*0.5,size);}
   // dessus (image)
   const im=IMG['zone_'+sceneAt(z)];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,s.x,s.y,size,size);
   else{ctx.fillStyle='#3a5733';ctx.fillRect(s.x,s.y,size,size);}
   // liseré haut (nord/ouest) = rebord d'île éclairé ; ombre douce interne au sud
   if(!isOpen(z-GRID)){ctx.fillStyle='rgba(255,244,210,.22)';ctx.fillRect(s.x,s.y,size,3*cam.z);}
   if(!westOpen){ctx.fillStyle='rgba(255,244,210,.14)';ctx.fillRect(s.x,s.y,3*cam.z,size);}
   if(!southOpen){const sg=ctx.createLinearGradient(0,s.y+size-22*cam.z,0,s.y+size);sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,10,20,.22)');ctx.fillStyle=sg;ctx.fillRect(s.x,s.y+size-22*cam.z,size,22*cam.z);}
   // biseau par tuile (chaque carré = un bloc)
   ctx.lineWidth=Math.max(1.4,2*cam.z);
   ctx.strokeStyle='rgba(255,240,205,.18)';ctx.beginPath();ctx.moveTo(s.x+1.5,s.y+size-2);ctx.lineTo(s.x+1.5,s.y+1.5);ctx.lineTo(s.x+size-2,s.y+1.5);ctx.stroke();
   ctx.strokeStyle='rgba(0,8,16,.28)';ctx.beginPath();ctx.moveTo(s.x+size-1.5,s.y+2);ctx.lineTo(s.x+size-1.5,s.y+size-1.5);ctx.lineTo(s.x+2,s.y+size-1.5);ctx.stroke();
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
     if(u.wait<=0&&Math.hypot(u.tx-u.x,u.ty-u.y)<4){u.tx=u.zx+rng(70,TS-70);u.ty=u.zy+rng(110,TS-60);u.wait=rng(1.5,5);u.run=Math.random()<.3;}
     const dx=u.tx-u.x,dy=u.ty-u.y,d=Math.hypot(dx,dy);
     if(d>3){const sp=u.speed*(u.run?1.9:1);u.x+=dx/d*sp*dt;u.y+=dy/d*sp*dt;if(Math.abs(dx)>1)u.face=dx<0?-1:1;if(DROIDS.has(u.k))u.roll+=sp*dt*0.06;}}
   shipTimer-=dt;if(shipTimer<=0&&ships.length<3){spawnShip();shipTimer=rng(2.5,5.5);}
   for(let i=ships.length-1;i>=0;i--){const sh=ships[i];sh.x+=sh.vx*dt;sh.y+=sh.vy*dt;if(sh.x<-400||sh.x>WORLD+400)ships.splice(i,1);}}
 function render(){water();landmassShadow();
   // cases verrouillées (immergées) d'abord
   for(let z=0;z<25;z++)if(!isOpen(z))drawLocked(z);
   // îles ouvertes, de l'arrière vers l'avant (falaises correctes)
   const open=[...unlocked].sort((a,b)=>(a/GRID|0)-(b/GRID|0)||(a%GRID)-(b%GRID));for(const z of open)drawOpen(z);
   const ents=[...units.map(u=>({y:u.y,d:()=>drawUnit(u)})),...ships.map(sh=>({y:1e9,d:()=>drawShip(sh)}))];ents.sort((a,b)=>a.y-b.y);ents.forEach(e=>e.d());}
 let raf=0;function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;t+=dt;update(dt);ctx.setTransform(DPR,0,0,DPR,0,0);render();raf=requestAnimationFrame(frame);}
 function resize(dpr,cw,ch){DPR=dpr;W=cw;Hh=ch;canvas.width=cw*dpr;canvas.height=ch*dpr;}
 function fit(){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;unlocked.forEach(z=>{const p=zonePos(z);mnx=Math.min(mnx,p.x);mny=Math.min(mny,p.y);mxx=Math.max(mxx,p.x+TS);mxy=Math.max(mxy,p.y+TS);});
 if(mnx>mxx){cam.x=WORLD/2;cam.y=WORLD/2;cam.z=.55;return;}
 const bw=mxx-mnx,bh=mxy-mny;cam.x=(mnx+mxx)/2;cam.y=(mny+mxy)/2+H*0.5;
 cam.z=Math.min(W/(bw+TS*1.25),Hh/(bh+TS*1.25));cam.z=Math.max(0.34,Math.min(0.95,cam.z));}
 let drag=null;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;cam.x-=(e.clientX-drag.x)/cam.z;cam.y-=(e.clientY-drag.y)/cam.z;drag.x=e.clientX;drag.y=e.clientY;});
 const end=()=>{drag=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,wp=s2w(mx,my);cam.z=Math.max(0.28,Math.min(1.6,cam.z*Math.exp(-e.deltaY*0.0016)));cam.x=wp.x-(mx-W/2)/cam.z;cam.y=wp.y-(my-Hh/2)/cam.z;},{passive:false});
 return {start(dpr,cw,ch){resize(dpr||1,cw||canvas.width,ch||canvas.height);spawnUnits();fit();for(let i=0;i<2;i++)spawnShip();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);},
   setUnlocked(set,label){unlocked=set;if(label)lockLabel=label;spawnUnits();},resize,stop(){cancelAnimationFrame(raf);},_cam:cam};
};
