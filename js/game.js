var WORLD_W=1100,WORLD_H=750;

function Game(){
  this.state='menu';this.veprik=null;this.thieves=[];this.obstacles=[];
  this.vegetables=[];this.particles=[];this.camera=new Vec();this.joystick=null;
  this.score=0;this.stealAlertTimer=0;this.stealAlertText='';
  this.menuPulse=0;this.lastTime=0;this.gameTime=0;
  this.thiefSpawnQueue=[];this.thiefSpawnTimer=0;this.thiefSpawnedCount=0;
  this.currentWave=0;this.waveAlertTimer=0;this.waveAlertText='';
  this._setupWorld();this._handleResize();this._setupInput();
  window.addEventListener('resize',this._handleResize.bind(this));
  requestAnimationFrame(this._loop.bind(this));
}

Game.prototype._setupWorld=function(){
  this.veprik=new Veprik(WORLD_W*0.3,WORLD_H*0.5);
  this.thieves=[];
  var types=['fox','rabbit','mouse'];
  this.thiefSpawnQueue=[];
  for(var i=0;i<types.length;i++){
    var spawnEdge=Math.floor(Math.random()*4);
    var sx,sy;
    if(spawnEdge===0){sx=Math.random()*WORLD_W;sy=-30}
    else if(spawnEdge===1){sx=WORLD_W+30;sy=Math.random()*WORLD_H}
    else if(spawnEdge===2){sx=Math.random()*WORLD_W;sy=WORLD_H+30}
    else{sx=-30;sy=Math.random()*WORLD_H}
    this.thiefSpawnQueue.push({type:types[i],spawnTime:0+i*8,sx:sx,sy:sy})
  }
  this.thiefSpawnQueue.sort(function(a,b){return a.spawnTime-b.spawnTime});
  this.thiefSpawnTimer=0;this.thiefSpawnedCount=0;
  this.currentWave=0;this.waveAlertTimer=0;this.waveAlertText='';
  this.obstacles.push(new Obstacle(180,120,70,100,'tree'),new Obstacle(500,80,80,110,'tree'),
    new Obstacle(800,150,75,105,'tree'),new Obstacle(300,420,65,95,'tree'),
    new Obstacle(700,500,70,100,'tree'),new Obstacle(950,400,80,110,'tree'),
    new Obstacle(150,620,70,100,'tree'));
  this.obstacles.push(new Obstacle(420,300,55,50,'crate'),new Obstacle(490,310,50,45,'crate'),new Obstacle(870,280,60,55,'crate'));
  this.obstacles.push(new Obstacle(600,380,90,70,'wagon'),new Obstacle(100,280,85,65,'wagon'));
  var vt=['carrot','cabbage','tomato','potato'];
  var vp=[{x:250,y:180},{x:310,y:190},{x:370,y:175},{x:560,y:160},{x:620,y:155},{x:680,y:170},
    {x:830,y:210},{x:890,y:200},{x:350,y:350},{x:410,y:360},{x:470,y:345},
    {x:750,y:320},{x:810,y:330},{x:870,y:340},{x:200,y:520},{x:260,y:530},{x:320,y:510},
    {x:550,y:560},{x:610,y:545},{x:670,y:555},{x:980,y:250},{x:1030,y:260},
    {x:950,y:550},{x:1010,y:540},{x:80,y:450},{x:140,y:460}];
  this.vegetables=[];
  for(var i=0;i<vp.length;i++){this.vegetables.push(new Veg(vp[i].x,vp[i].y,vt[i%vt.length]))}
  this._gardenFlowers=[];
  for(var i=0;i<12;i++){this._gardenFlowers.push({i:(i*97)%1000,yi:(i*61)%1000})}
};

Game.prototype._handleResize=function(){
  var dpr=window.devicePixelRatio||1;canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  var joyR=Math.max(50,Math.min(70,window.innerWidth*0.12));
  this.joystick=new Joystick(window.innerWidth*0.12,window.innerHeight*0.82,joyR);
};

Game.prototype._setupInput=function(){
  var self=this;
  var gp=function(e){if(e.touches&&e.touches.length>0)return Array.from(e.touches).map(function(t){return{x:t.clientX,y:t.clientY,id:t.identifier}});
    return[{x:e.clientX,y:e.clientY,id:'mouse'}]};
  canvas.addEventListener('touchstart',function(e){e.preventDefault();
    gp(e).forEach(function(t){self.joystick.handleStart(t.x,t.y,t.id)});
    self._handleTap(gp(e)[0])});
  canvas.addEventListener('touchmove',function(e){e.preventDefault();
    gp(e).forEach(function(t){self.joystick.handleMove(t.x,t.y,t.id)})});
  canvas.addEventListener('touchend',function(e){e.preventDefault();
    gp(e).forEach(function(t){self.joystick.handleEnd(t.id)})});
  canvas.addEventListener('touchcancel',function(e){e.preventDefault();self.joystick.handleEnd('cancelled')});
  var md=false;
  canvas.addEventListener('mousedown',function(e){md=true;self.joystick.handleStart(e.clientX,e.clientY,'mouse');self._handleTap({x:e.clientX,y:e.clientY})});
  canvas.addEventListener('mousemove',function(e){if(md&&self.joystick)self.joystick.handleMove(e.clientX,e.clientY,'mouse')});
  canvas.addEventListener('mouseup',function(){md=false});
};

Game.prototype._handleTap=function(tap){
  var w=window.innerWidth,h=window.innerHeight;
  if(this.state==='menu'){
    var py=h*0.1,ph=h*0.6,bw=Math.min(200,w*0.42),bh=55,gap=15;
    var gy1=py+ph-60;
    if(tap.y>gy1&&tap.y<gy1+bh){
      this.state='playing';
    }
    return;
  }
  if(this.state==='drivingComplete'){this.state='menu'}
};

Game.prototype._update=function(dt){
  this.menuPulse+=dt*2;this.gameTime+=dt;
  if(this.state!=='playing')return;
  var w=window.innerWidth,h=window.innerHeight;
  if(this.joystick)this.joystick.resetPos(w*0.12,h*0.82);
  if(this.stealAlertTimer>0)this.stealAlertTimer-=dt;
  if(this.thiefSpawnedCount<this.thiefSpawnQueue.length){
    this.thiefSpawnTimer+=dt;
    while(this.thiefSpawnedCount<this.thiefSpawnQueue.length&&this.thiefSpawnTimer>=this.thiefSpawnQueue[this.thiefSpawnedCount].spawnTime){
      var info=this.thiefSpawnQueue[this.thiefSpawnedCount];
      this.thieves.push(new Thief(info.sx,info.sy,info.type));
      this.thiefSpawnedCount++;
      if(this.thiefSpawnedCount>1){this.stealAlertText='Nov\u00fd zlod\u011bj: '+this.thieves[this.thieves.length-1].name+'!';this.stealAlertTimer=2.5}
      this.waveAlertText='';this.waveAlertTimer=0}
  }
  for(var i=0;i<this.vegetables.length;i++){var v=this.vegetables[i];if(!v.collected)v.update(dt)}
  for(var i=0;i<this.thieves.length;i++){var t=this.thieves[i];
    t.update(dt,this.veprik.pos,this.obstacles,this.vegetables);
    if(t.checkCatch(this.veprik)&&t.state!=='hiding')this._catchThief(t)}
  var jd=new Vec(this.joystick?this.joystick.dx:0,this.joystick?this.joystick.dy:0);
  if(jd.len()<0.1)jd.x=0;this.veprik.update(dt,jd,this.obstacles);
  var cw2=window.innerWidth,ch2=window.innerHeight,tcx=this.veprik.pos.x-cw2/2,tcy=this.veprik.pos.y-ch2/2;
  var tnx=Math.max(0,Math.min(WORLD_W-cw2,tcx)),tny=Math.max(0,Math.min(WORLD_H-ch2,tcy));
  this.camera.x+=(tnx-this.camera.x)*5*dt;this.camera.y+=(tny-this.camera.y)*5*dt;
  var uc=this.thieves.filter(function(t){return t.state!=='caught'});
  if(uc.length===0&&this.state==='playing'&&this.thiefSpawnedCount>=this.thiefSpawnQueue.length){
    this.currentWave++;this.waveAlertText='Vlna '+this.currentWave+1+' hotova! +'+(this.currentWave*50)+' bodu';
    this.score+=this.currentWave*50;this.waveAlertTimer=3;this._spawnCelebration();
    this._setupNextWave()}
  else if(uc.length===0&&this.state==='playing'&&this.thiefSpawnedCount<this.thiefSpawnQueue.length){
    this.waveAlertText='Vsechny chyceny! Cekam na dalsiho...';this.waveAlertTimer=2}
  else{this.waveAlertText='';this.waveAlertTimer=0}
  for(var i=this.particles.length-1;i>=0;i--){this.particles[i].update(dt);if(this.particles[i].life<=0)this.particles.splice(i,1)}
  if(Math.random()<dt*0.3){var vx=Math.random()*WORLD_W,vy=Math.random()*WORLD_H;
    var hue=45+Math.random()*30;this.particles.push(new Particle(vx,vy,'hsl('+hue+',80%,75%)',2+Math.random(),2,(Math.random()-0.5)*15,-Math.random()*10));}
  for(var i=0;i<this.thieves.length;i++){var t=this.thieves[i];
    if(t.state==='stealing'&&this.stealAlertTimer<=0){this.stealAlertText=t.name+' krade!';this.stealAlertTimer=2;break}}
};

Game.prototype._catchThief=function(t){
  if(t.state==='caught')return;t.state='caught';t.vel=new Vec();this.veprik.caughtCount++;this.score+=100;this.veprik.catchAnim=1.5;
  for(var i=0;i<20;i++){var hue=Math.random()*360,sz=3+Math.random()*3;
    this.particles.push(new Particle(t.pos.x,t.pos.y,'hsl('+hue+',80%,65%)',1+Math.random(),sz,(Math.random()-0.5)*100,(Math.random()-0.5)*100-40));}
  this.stealAlertText=t.name+' p\u0159ist\u00ed\u017een! +100';this.stealAlertTimer=2
};

Game.prototype._spawnCelebration=function(){
  var self=this;
  for(var i=0;i<30;i++){(function(idx){setTimeout(function(){
    var x=Math.random()*WORLD_W,y=Math.random()*WORLD_H;
    var hue=Math.random()*360,sz=4+Math.random()*4;
    self.particles.push(new Particle(x,y,'hsl('+hue+',85%,65%)',2+Math.random()*2,sz,(Math.random()-0.5)*60,-Math.random()*50-20));}, idx*50)
  })(i)}}

Game.prototype._setupNextWave=function(){
  var types=['fox','rabbit','mouse'];
  this.thiefSpawnQueue=[];
  for(var i=0;i<types.length;i++){
    var spawnEdge=Math.floor(Math.random()*4);
    var sx,sy;
    if(spawnEdge===0){sx=Math.random()*WORLD_W;sy=-30}
    else if(spawnEdge===1){sx=WORLD_W+30;sy=Math.random()*WORLD_H}
    else if(spawnEdge===2){sx=Math.random()*WORLD_W;sy=WORLD_H+30}
    else{sx=-30;sy=Math.random()*WORLD_H}
    this.thiefSpawnQueue.push({type:types[i],spawnTime:2+i*6,sx:sx,sy:sy})
  }
  this.thiefSpawnQueue.sort(function(a,b){return a.spawnTime-b.spawnTime});
  this.thiefSpawnTimer=0;this.thiefSpawnedCount=0;
  this.thieves=[];
};

Game.prototype._draw=function(){
  var w=window.innerWidth,h=window.innerHeight;ctx.clearRect(0,0,w,h);
  if(this.state==='menu'){this._drawMenu(w,h);return}
  if(this.state==='drivingComplete'){this._drawDrivingComplete(w,h);return}
  this._drawGarden(w,h);this._drawOffScreenIndicators(w,h);var ds=[];
  for(var i=0;i<this.vegetables.length;i++){var v=this.vegetables[i];if(!v.collected)ds.push({y:v.y,d:bindMethod(v,'draw',ctx,this.camera.x,this.camera.y)})}
  for(var i=0;i<this.obstacles.length;i++){var o=this.obstacles[i];ds.push({y:o.y+o.h,d:bindMethod(o,'draw',ctx,this.camera.x,this.camera.y)})}
  for(var i=0;i<this.thieves.length;i++){var t=this.thieves[i];ds.push({y:t.pos.y,d:bindMethod(t,'draw',ctx,this.camera.x,this.camera.y)})}
  ds.push({y:this.veprik.pos.y,d:bindMethod(this.veprik,'draw',ctx,this.camera.x,this.camera.y)});
  for(var i=0;i<this.particles.length;i++){var p=this.particles[i];ds.push({y:p.y,d:bindMethod(p,'draw',ctx,this.camera.x,this.camera.y)})}
  ds.sort(function(a,b){return a.y-b.y});for(var i=0;i<ds.length;i++)ds[i].d();
  this._drawHUD(w,h);if(this.joystick&&this.state==='playing')this.joystick.draw(ctx);
  if(this.waveAlertTimer>0){var a=Math.min(1,this.waveAlertTimer);ctx.globalAlpha=a;
    ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=3;
    var ay=h*0.22;ctx.strokeText(this.waveAlertText,w/2,ay);ctx.fillText(this.waveAlertText,w/2,ay);ctx.globalAlpha=1}
};

function bindMethod(obj,method){var args=Array.prototype.slice.call(arguments,2);
  return function(){obj[method].apply(obj,args)}}

Game.prototype._drawGarden=function(w,h){
  var sh=Math.min(80,h*0.15);ctx.fillStyle='#87CEEB';ctx.fillRect(0,0,w,sh);
  ctx.fillStyle='rgba(255,255,255,0.7)';var co=-this.camera.x*0.1;
  for(var i=0;i<5;i++){var cx=((i*250+co)%(w+200))-100;ctx.beginPath();
    ctx.arc(cx,30+(i%3)*15,25,0,Math.PI*2);ctx.arc(cx+20,25+(i%3)*15,20,0,Math.PI*2);
    ctx.arc(cx-15,28+(i%3)*15,18,0,Math.PI*2);ctx.fill()}
  var gy=sh;ctx.fillStyle='#5a9e3a';ctx.fillRect(0,gy,w,h-gy);
  ctx.fillStyle='#c4a66a';ctx.fillRect(0,gy+20,w,15);ctx.fillStyle='#b89855';
  for(var x=0;x<w;x+=30){ctx.beginPath();ctx.arc(x+Math.random()*15,gy+27,3,0,Math.PI*2);ctx.fill()}
  ctx.strokeStyle='#4d8a2f';ctx.lineWidth=1;for(var i=0;i<40;i++){
    var gx=((i*47+this.camera.x*0.3)%w),ggy=gy+40+((i*31)%(h-gy-80));
    ctx.beginPath();ctx.moveTo(gx,ggy);ctx.lineTo(gx+Math.sin(i)*3,ggy-6-Math.random()*4);ctx.stroke()}
  var fc=['#ff6b8a','#ffaa44','#ff5555','#ffffff','#aa66ff'];for(var i=0;i<12;i++){
    var fi=this._gardenFlowers[i]||{i:i,yi:i};
    var fx=((fi.i*97+this.camera.x*0.2)%w),fy=gy+50+((fi.yi*61)%(h-gy-100));
    ctx.beginPath();ctx.arc(fx,fy,3,0,Math.PI*2);ctx.fillStyle=fc[i%fc.length];ctx.fill();
    ctx.strokeStyle='#4d8a2f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(fx,fy+3);ctx.lineTo(fx,fy+10);ctx.stroke()}
  ctx.fillStyle='#8B6914';ctx.fillRect(0,gy-2,w,5);
  for(var x=0;x<w;x+=30){ctx.fillStyle='#a07828';ctx.fillRect(x-2,gy-12,6,14);
    ctx.beginPath();ctx.moveTo(x-2,gy-12);ctx.lineTo(x+1,gy-18);ctx.lineTo(x+4,gy-12);ctx.fill()}
  var hx=w-100-this.camera.x*0.05,hy=gy+10;
  if(hx>-80&&hx<w+80){
    ctx.fillStyle='#d4a06a';ctx.fillRect(hx,hy,70,50);ctx.strokeStyle='#8B6914';ctx.lineWidth=2;ctx.strokeRect(hx,hy,70,50);
    ctx.beginPath();ctx.moveTo(hx-8,hy);ctx.lineTo(hx+35,hy-30);ctx.lineTo(hx+78,hy);ctx.fillStyle='#cc4444';ctx.fill();
    ctx.strokeStyle='#aa3333';ctx.stroke();ctx.fillStyle='#5C3317';ctx.fillRect(hx+25,hy+20,20,30);
    ctx.fillStyle='#87CEEB';ctx.fillRect(hx+8,hy+12,14,14);ctx.strokeStyle='#8B6914';ctx.lineWidth=1;ctx.strokeRect(hx+8,hy+12,14,14);
    ctx.beginPath();ctx.moveTo(hx+15,hy+12);ctx.lineTo(hx+15,hy+26);ctx.stroke();
    ctx.beginPath();ctx.moveTo(hx+8,hy+19);ctx.lineTo(hx+22,hy+19);ctx.stroke()}
  var ec='rgba(139,105,20,0.4)';ctx.setLineDash([8,8]);ctx.strokeStyle=ec;ctx.lineWidth=2;
  if(this.camera.y>10){ctx.beginPath();ctx.moveTo(Math.max(0,-this.camera.x),gy);ctx.lineTo(Math.min(w,WORLD_W-this.camera.x),gy);ctx.stroke()}
  if(this.camera.y<WORLD_H-h-10){ctx.beginPath();ctx.moveTo(Math.max(0,-this.camera.x),WORLD_H-this.camera.y);ctx.lineTo(Math.min(w,WORLD_W-this.camera.x),WORLD_H-this.camera.y);ctx.stroke()}
  if(this.camera.x>10){ctx.beginPath();ctx.moveTo(0,Math.max(0,gy-this.camera.y));ctx.lineTo(0,Math.min(h,WORLD_H-this.camera.y));ctx.stroke()}
  if(this.camera.x<WORLD_W-w-10){ctx.beginPath();ctx.moveTo(w,Math.max(0,gy-this.camera.y));ctx.lineTo(w,Math.min(h,WORLD_H-this.camera.y));ctx.stroke()}
  ctx.setLineDash([])
};

Game.prototype._drawHUD=function(w,h){
  var bh=40;ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,0,w,bh);
  ctx.font='bold 16px sans-serif';ctx.textAlign='left';ctx.fillStyle='#FFD700';
  ctx.fillText('\u2b50 '+this.score,12,26);
  var caught=this.thieves.filter(function(t){return t.state==='caught'}).length;
  ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.fillText('\ud83d\udc37 Vep\u0159\u00edk: '+caught+'/'+this.thieves.length,w/2,26);
  if(this.stealAlertTimer>0){var a=Math.min(1,this.stealAlertTimer);ctx.globalAlpha=a;
    ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ff4444';ctx.strokeStyle='#fff';ctx.lineWidth=3;
    var ay=h*0.25;ctx.strokeText(this.stealAlertText,w/2,ay);ctx.fillText(this.stealAlertText,w/2,ay);ctx.globalAlpha=1}
  var remaining=this.vegetables.filter(function(v){return!v.collected}).length;
  ctx.font='14px sans-serif';ctx.textAlign='right';ctx.fillStyle='#ccc';
  ctx.fillText('\ud83e\udd6c Zelenina: '+remaining,w-12,26);
  var bw=w*0.4,bx=w/2-bw/2,by=h-20;ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(bx,by,bw,8);
  ctx.fillStyle='#44aa44';ctx.fillRect(bx,by,bw*(caught/this.thieves.length),8);
  ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,8)
};

Game.prototype._drawCelebrationOverlay=function(w,h){
  ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(0,0,w,h);var cy=h/2;
  var ts=Math.min(36,w*0.06);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=4;
  var m1='Vep\u0159\u00edk vy\u010distil zahradu!';
  ctx.strokeText(m1,w/2,cy-30);ctx.fillText(m1,w/2,cy-30);
  var ts2=Math.min(24,w*0.04);ctx.font='bold '+ts2+'px sans-serif';ctx.fillStyle='#fff';
  var m2='Sk\u00fare: '+this.score+' \u2b50';ctx.strokeText(m2,w/2,cy+15);ctx.fillText(m2,w/2,cy+15);
  ctx.font=Math.min(16,w*0.03)+'px sans-serif';ctx.fillStyle='#ddd';
  ctx.fillText('Klepn\u011bte pro novou hru',w/2,cy+50);
};

Game.prototype._drawDrivingComplete=function(w,h){
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,w,h);
  var cy=h/2;var ts=Math.min(34,w*0.07);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=3;
  ctx.strokeText('Vlna dokon\u010dena!',w/2,cy-55);ctx.fillText('Vlna dokon\u010dena!',w/2,cy-55);
  ctx.font='bold 22px sans-serif';ctx.fillStyle='#fff';ctx.fillText('Sk\u00f3re: '+this.score+' \u2b50',w/2,cy-15);
  ctx.font='bold 16px sans-serif';ctx.fillStyle='#FFD700';
  ctx.fillText('Klepni pro novou hru',w/2,cy+40)
};

Game.prototype._drawOffScreenIndicators=function(w,h){
   var camX=this.camera.x,camY=this.camera.y,margin=40;
   for(var i=0;i<this.thieves.length;i++){
     var t=this.thieves[i];if(t.state==='caught')continue;
     var sx=t.pos.x-camX,sy=t.pos.y-camY;
     if(sx>-margin&&sx<w+margin&&sy>-margin&&sy<h+margin)continue;
     var cx,cy,dirX=0,dirY=0;
     if(sx<-margin){cx=0;dirX=1}
     else if(sx>w+margin){cx=w;dirX=-1}
     else if(sy>h+margin){cy=h;dirY=-1}
     else if(sy<-margin){cy=0;dirY=1}
     if(dirY){var ty=sy;if(cy===0&&ty>h)continue;if(cy===h&&ty<0)continue}
     if(dirX){var tx=sx;if(cx===0&&tx>w)continue;if(cx===w&&tx<0)continue}
     if(!cy)cy=Math.max(25,Math.min(h-25,sy));
      if(!cx)cx=Math.max(25,Math.min(w-25,sx));
      var flash=Math.sin(this.gameTime*6)*0.3+0.7;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(dirX===-1?Math.PI:dirY===1?Math.PI/2:dirY===-1?-Math.PI/2:0);
     ctx.globalAlpha=flash;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-8,-12);ctx.lineTo(-4,0);ctx.lineTo(-8,12);ctx.closePath();
     ctx.fillStyle='#ff3333';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
     ctx.globalAlpha=flash*0.6;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fillStyle='#ff6666';ctx.fill();
     ctx.restore();ctx.globalAlpha=1}
 };

 Game.prototype._drawMenu=function(w,h){
  ctx.fillStyle='#5a9e3a';ctx.fillRect(0,0,w,h);
  for(var i=0;i<40;i++){var gx=(i*47)%w,gy=h-80+((i*31)%60);
    ctx.strokeStyle='#4d8a2f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx,gy);
    ctx.lineTo(gx+Math.sin(i+this.menuPulse)*5,gy-10-Math.random()*5);ctx.stroke()}
  var fc=['#ff6b8a','#ffaa44','#ff5555'];for(var i=0;i<12;i++){
    var fx=((i*97)%w),fy=h-60+Math.sin(i*1.5)*10;
    ctx.beginPath();ctx.arc(fx,fy,6,0,Math.PI*2);ctx.fillStyle=fc[i%fc.length];ctx.fill()}
  var pw=Math.min(w*0.85,400),ph=h*0.6,px=w/2-pw/2,py=h*0.1;
  ctx.fillStyle='rgba(255,245,220,0.95)';ctx.strokeStyle='#8B6914';ctx.lineWidth=3;
  this._rr(ctx,px,py,pw,ph,15);ctx.fill();ctx.stroke();
  var ts=Math.min(32,w*0.07);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#8B4513';ctx.strokeStyle='#fff';ctx.lineWidth=3;
  var title='Vep\u0159\u00edk a zlod\u011bj\u00ed';
  ctx.strokeText(title,w/2,py+ts+15);ctx.fillText(title,w/2,py+ts+15);
  ctx.font=Math.min(14,w*0.03)+'px sans-serif';ctx.fillStyle='#666';
  ctx.fillText('Insperov\u00e1no \u010cten\u00edm o vep\u0159\u00edkovi a k\u016bzleti',w/2,py+ts+35);
  var cy=py+ph*0.4;
  ctx.beginPath();ctx.arc(w/2-70,cy,20,0,Math.PI*2);var vg=ctx.createRadialGradient(w/2-73,cy-4,2,w/2-70,cy,20);
  vg.addColorStop(0,'#ffb0b0');vg.addColorStop(1,'#e87070');ctx.fillStyle=vg;ctx.fill();
  ctx.strokeStyle='#d45555';ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.arc(w/2-65,cy-3,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.beginPath();ctx.arc(w/2-64.5,cy-3,1.5,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();
  ctx.beginPath();ctx.ellipse(w/2-58,cy+1,5,4,0,0,Math.PI*2);ctx.fillStyle='#f5b0b0';ctx.fill();
  ctx.beginPath();ctx.arc(w/2,cy-5,16,0,Math.PI*2);ctx.fillStyle='#e87a20';ctx.fill();
  ctx.strokeStyle='#c06010';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.moveTo(w/2-8,cy-18);ctx.lineTo(w/2-5,cy-30);ctx.lineTo(w/2+2,cy-18);ctx.fill();
  ctx.beginPath();ctx.moveTo(w/2+2,cy-18);ctx.lineTo(w/2+5,cy-30);ctx.lineTo(w/2+10,cy-18);ctx.fill();
  ctx.beginPath();ctx.arc(w/2-4,cy-7,2.5,0,Math.PI*2);ctx.fillStyle='#ffcc00';ctx.fill();
  ctx.beginPath();ctx.arc(w/2+4,cy-7,2.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(w/2+70,cy-3,14,0,Math.PI*2);ctx.fillStyle='#aaa';ctx.fill();
  ctx.beginPath();ctx.ellipse(w/2+65,cy-20,3,12,-0.1,0,Math.PI*2);ctx.fillStyle='#aaa';ctx.fill();
  ctx.beginPath();ctx.ellipse(w/2+77,cy-20,3,12,0.1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(w/2+65,cy-5,2,0,Math.PI*2);ctx.fillStyle='#cc3333';ctx.fill();
  ctx.beginPath();ctx.arc(w/2+75,cy-5,2,0,Math.PI*2);ctx.fill();
  var iy=py+ph*0.68;ctx.font=Math.min(13,w*0.028)+'px sans-serif';ctx.fillStyle='#555';
  ctx.fillText('\ud83c\udfae Ovl\u00e1dejte Vep\u0159\u00edka joystickem',w/2,iy);
  ctx.fillText('\ud83e\udd8a Chy\u0165te li\u0161ku, zaj\u00edce a my\u0161',w/2,iy+20);
  ctx.fillText('\ud83e\udd55 Hl\u00eddajte zahradu p\u0159ed zlod\u011bji!',w/2,iy+40);
  var bw=Math.min(200,w*0.5),bh=55;
  var pulse=Math.sin(this.menuPulse)*3;ctx.fillStyle='#cc4444';this._rr(ctx,w/2-bw/2-pulse/2,py+ph-60-pulse/2,bw+pulse,bh+pulse,12);ctx.fill();
  ctx.strokeStyle='#aa2222';ctx.lineWidth=2;this._rr(ctx,w/2-bw/2-pulse/2,py+ph-60-pulse/2,bw+pulse,bh+pulse,12);ctx.stroke();
  ctx.font='bold '+Math.min(18,w*0.04)+'px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.fillText('\ud83d\udc37  HR\u00c1T',w/2,py+ph-60+bh/2+6);
};

Game.prototype._rr=function(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,x+r,y);c.closePath()};

Game.prototype._reset=function(){this.score=0;this.stealAlertTimer=0;this.particles=[];this.thieves=[];this.thiefSpawnQueue=[];this.thiefSpawnTimer=0;this.thiefSpawnedCount=0;this.currentWave=0;this.waveAlertTimer=0;this.waveAlertText='';this._setupWorld();this.camera=new Vec();};

Game.prototype._loop=function(timestamp){var dt=Math.min((timestamp-this.lastTime)/1000,0.05);this.lastTime=timestamp;
  this._update(dt);this._draw();requestAnimationFrame(this._loop.bind(this));}

window.gameInstance = new Game();
