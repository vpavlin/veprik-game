var WORLD_W=1100,WORLD_H=750;
var DRIVE_ROAD_LENGTH=3000*200;

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
  this.driveConfig={type:'tractor',paletteIndex:0,wheelStyle:'standard'};
  this.driveTimer=90;this.driveSpeed=0;this.roadPosition=0;this.steerInput=0;
  this.viewMode='behind';this.collectibles=[];this.obstaclesList=[];
  this.goals=[];this.driveScore=0;this.driveDistance=0;
  this.cameraOffset=new Vec();this.carX=0;this.roadMap=null;
  this.accelerationMode='auto';this.touchAccel=false;
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
};

Game.prototype._setupDriveWorld=function(){
  var seed=Math.floor(Math.random()*99999);
  this.roadMap=generateRoad(seed);
  this.collectibles=[];this.obstaclesList=[];this.goals=[];this.driveScore=0;this.driveDistance=0;
  var vTypes=['carrot','cabbage','tomato','potato'];
  for(var z=500;z<this.roadMap.totalLength;z+=500){
    var t=vTypes[Math.floor(Math.random()*4)];
    this.collectibles.push({type:t,worldZ:z,collected:false,offset:(Math.random()*2-1)*0.3});
  }
  for(var z=800;z<this.roadMap.totalLength;z+=800){
    var oType=Math.random()>0.5?'rock':'puddle';
    var side=(Math.random()*2-1)*0.4;
    this.obstaclesList.push({type:oType,worldZ:z,hit:false,side:side});
  }
  var gTypes=vTypes.slice(0,2);
  for(var gi=0;gi<gTypes.length;gi++){
    this.goals.push({type:gTypes[gi],target:5,current:0,bonus:200});
  }
};

Game.prototype._handleResize=function(){
  var dpr=window.devicePixelRatio||1;canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  this.joystick=new Joystick(window.innerWidth*0.15,window.innerHeight*0.78,Math.min(55,window.innerWidth*0.1));
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
    gp(e).forEach(function(t){self.joystick.handleEnd(t.id)});
    if(self.state==='playingDriving')self.steerInput=0});
  canvas.addEventListener('touchcancel',function(e){e.preventDefault();self.joystick.handleEnd('cancelled');
    if(self.state==='playingDriving')self.steerInput=0});
  var md=false;
  canvas.addEventListener('mousedown',function(e){md=true;self.joystick.handleStart(e.clientX,e.clientY,'mouse');self._handleTap({x:e.clientX,y:e.clientY})});
  canvas.addEventListener('mousemove',function(e){if(md&&self.joystick)self.joystick.handleMove(e.clientX,e.clientY,'mouse')});
  canvas.addEventListener('mouseup',function(){md=false;if(self.state==='playingDriving')self.steerInput=0});
};

Game.prototype._handleTap=function(tap){
  var w=window.innerWidth,h=window.innerHeight;
  if(this.state==='menu'){
    var py=h*0.1,ph=h*0.6,bw=Math.min(200,w*0.42),bh=45,gap=15;
    this.bwPad=gap/2;
    var gy1=py+ph-60;
    if(tap.y>gy1&&tap.y<gy1+bh){
      if(tap.x<w/2-this.bwPad)this.state='playing';
      else this.state='drivingMenu';
  }
   return;
 }
 if(this.state==='drivingMenu'){
    var cy=h*0.45,bw2=Math.min(60,w*0.1);
    if(tap.y>cy-60&&tap.y<cy+60){
      var types=['tractor','racing','truck','bus'];var ci=types.indexOf(this.driveConfig.type);
      if(tap.x<w/2-bw2-10)this.driveConfig.type=types[(ci-1+types.length)%types.length];
      else if(tap.x>w/2+bw2+10)this.driveConfig.type=types[(ci+1)%types.length];
    }
    var swY=h*0.58;
    for(var si=0;si<6;si++){
      var sx=w/2-135+si*45;
      if(tap.x>sx&&tap.x<sx+35&&tap.y>swY&&tap.y<swY+35)this.driveConfig.paletteIndex=si;
    }
    var wsY=h*0.7;var wsTypes=['standard','terrain','chrome'];
    for(var wi=0;wi<3;wi++){
      var wx=w/2-120+wi*80;
      if(tap.x>wx&&tap.x<wx+65&&tap.y>wsY&&tap.y<wsY+30)this.driveConfig.wheelStyle=wsTypes[wi];
    }
    if(tap.y>h*0.82&&tap.y<h*0.82+45&&tap.x>w/2-100&&tap.x<w/2+100){this.state='drivingSettings';return}
    if(tap.y>h*0.9&&tap.y<h*0.9+50){this._startDriving();return}
    return;
  }
  if(this.state==='drivingSettings'){
    var ay=h*0.4;if(tap.y>ay-20&&tap.y<ay+60)this.accelerationMode=this.accelerationMode==='auto'?'touch':'auto';
    var cy=h*0.55;if(tap.y>cy-20&&tap.y<cy+60)this.viewMode=this.viewMode==='behind'?'cockpit':'behind';
    if(tap.y>h*0.8&&tap.y<h*0.8+45){this.state='drivingMenu'}
    return;
  }
  if(this.state==='playingDriving'){
    var camBtnX=w-70,camBtnY=55,camBtnS=40;
    if(tap.x>camBtnX-camBtnS&&tap.x<camBtnX+camBtnS&&tap.y>camBtnY-camBtnS&&tap.y<camBtnY+camBtnS){
      this.viewMode=this.viewMode==='behind'?'cockpit':'behind';return;
    }
    if(tap.x<w/2)this.steerInput=-1;else this.steerInput=1;
    return;
  }
  if(this.state==='drivingComplete'){this.state='drivingMenu'}
};

Game.prototype._startDriving=function(){
  this.state='playingDriving';this.driveTimer=90;this.driveSpeed=80;this.roadPosition=0;
  this.carX=0;this.steerInput=0;this.gameTime=0;this._setupDriveWorld();this.particles=[];
};

Game.prototype._update=function(dt){
  this.menuPulse+=dt*2;this.gameTime+=dt;
  if(this.state==='playingDriving'){this._updateDriving(dt);return}
  if(this.state==='drivingMenu'||this.state==='drivingSettings'){this.menuPulse+=dt*2;return}
  if(this.state!=='playing')return;
  var w=window.innerWidth,h=window.innerHeight;
  if(this.joystick)this.joystick.resetPos(w*0.15,h*0.78);
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
  if(Math.random()<dt*2){var vx=Math.random()*WORLD_W,vy=Math.random()*WORLD_H;
    var hue=45+Math.random()*30;this.particles.push(new Particle(vx,vy,'hsl('+hue+',80%,75%)',2+Math.random(),2,(Math.random()-0.5)*15,-Math.random()*10));}
  for(var i=0;i<this.thieves.length;i++){var t=this.thieves[i];
    if(t.state==='stealing'&&this.stealAlertTimer<=0){this.stealAlertText=t.name+' krade!';this.stealAlertTimer=2;break}}
};

Game.prototype._updateDriving=function(dt){
  this.driveTimer-=dt;if(this.driveTimer<=0){this.state='drivingComplete';return}
  var speedCurve=Math.min(160,80+(90-Math.max(0,this.driveTimer))*0.7);
  if(this.accelerationMode==='touch')speedCurve+=50;
  this.driveSpeed+=(speedCurve-this.driveSpeed)*2*dt;
  var steerAmt=this.steerInput*this.driveSpeed*0.4*dt;
  this.carX+=steerAmt;var roadHalf=ROAD_WIDTH*0.35;this.carX=Math.max(-roadHalf,Math.min(roadHalf,this.carX));
var dw=window.innerWidth,dh=window.innerHeight;
  this.roadPosition+=this.driveSpeed*100*dt;this.driveDistance+=this.driveSpeed*dt;
  var carSegZ=this.roadPosition%this.roadMap.totalLength;
  for(var i=0;i<this.collectibles.length;i++){
    var c=this.collectibles[i];if(c.collected)continue;
    var cz=c.worldZ%this.roadMap.totalLength;var dz=Math.abs(carSegZ-cz);
  if(dz<SEGMENT_LENGTH*2){
        var seg=this.roadMap.getSegment(carSegZ);
        var roadW=ROAD_WIDTH*(0.5-seg.p1.scale*200);
        if(Math.abs(this.carX-c.offset*ROAD_WIDTH*0.3)<60){
          c.collected=true;this.driveScore+=10;
          for(var p=0;p<8;p++)this.particles.push(new Particle(dw/2+(Math.random()-0.5)*dw*0.4,dh*0.7+Math.random()*dh*0.1,c.type==='carrot'?'#FF8C00':'#44cc44',0.5+Math.random(),3,(Math.random()-0.5)*80,-Math.random()*60));
          for(var g=0;g<this.goals.length;g++){if(this.goals[g].type===c.type){this.goals[g].current++;
            if(this.goals[g].current>=this.goals[g].target)this.driveScore+=this.goals[g].bonus}}}
     }
   }
   for(var i=0;i<this.obstaclesList.length;i++){
     var o=this.obstaclesList[i];if(o.hit)continue;
     var oz=o.worldZ%this.roadMap.totalLength;var dz2=Math.abs(carSegZ-oz);
     if(dz2<SEGMENT_LENGTH*2){
       var sideX=o.side*ROAD_WIDTH*0.3;
       if(Math.abs(this.carX-sideX)<50){o.hit=true;this.driveSpeed*=0.6;
         for(var p=0;p<12;p++)this.particles.push(new Particle(dw/2+(Math.random()-0.5)*dw*0.3,dh*0.7+Math.random()*dh*0.1,'#888',0.8+Math.random(),4,(Math.random()-0.5)*100,-Math.random()*60))}
     }
   }
  this.cameraOffset.x+=(this.carX*0.3-this.cameraOffset.x)*3*dt;
  for(var i=this.particles.length-1;i>=0;i--){this.particles[i].update(dt);if(this.particles[i].life<=0)this.particles.splice(i,1)}
  if(Math.random()<dt*5){this.particles.push(new Particle(window.innerWidth/2+(Math.random()-0.5)*window.innerWidth,window.innerHeight*0.5+Math.random()*window.innerHeight*0.4,'rgba(255,255,255,0.4)',0.3+Math.random(),1,(Math.random()-0.5)*200,-this.driveSpeed*5))}
};

Game.prototype._catchThief=function(t){
  if(t.state==='caught')return;t.state='caught';t.vel=new Vec();this.veprik.caughtCount++;this.score+=100;this.veprik.catchAnim=1.5;
  for(var i=0;i<20;i++){var hue=Math.random()*360,sz=3+Math.random()*3;
    this.particles.push(new Particle(t.pos.x,t.pos.y,'hsl('+hue+',80%,65%)',1+Math.random(),sz,(Math.random()-0.5)*100,(Math.random()-0.5)*100-40));}
  this.stealAlertText=t.name+' p\u0159ist\u00ed\u017een! +100';this.stealAlertTimer=2
};

Game.prototype._spawnCelebration=function(){
  var self=this;
  for(var i=0;i<60;i++){(function(idx){setTimeout(function(){
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
  if(this.state==='playingDriving'){this._drawDrivingScene(w,h);this._drawDriveHUD(w,h);return}
  if(this.state==='drivingMenu'){this._drawDrivingMenu(w,h);return}
  if(this.state==='drivingSettings'){this._drawDriveSettings(w,h);return}
  if(this.state==='drivingComplete'){this._drawDrivingComplete(w,h);return}
  this._drawGarden(w,h);var ds=[];
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
  ctx.strokeStyle='#4d8a2f';ctx.lineWidth=1;for(var i=0;i<80;i++){
    var gx=((i*47+this.camera.x*0.3)%w),ggy=gy+40+((i*31)%(h-gy-80));
    ctx.beginPath();ctx.moveTo(gx,ggy);ctx.lineTo(gx+Math.sin(i)*3,ggy-6-Math.random()*4);ctx.stroke()}
  var fc=['#ff6b8a','#ffaa44','#ff5555','#ffffff','#aa66ff'];for(var i=0;i<25;i++){
    var fx=((i*97+this.camera.x*0.2)%w),fy=gy+50+((i*61)%(h-gy-100));
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

Game.prototype._drawDrivingScene=function(w,h){
  var horizonY=h*0.45;
  if(this.viewMode==='cockpit'){
    ctx.save();CarDraw.drawInCar(ctx,this.driveConfig,w,h,this.steerInput*0.3);ctx.restore();return;
  }
  renderRoad(ctx,w,h,this.carX,650,this.roadPosition,this.roadMap,this.gameTime);
  var carScreenX=w/2+this.cameraOffset.x*1.5;
  var carScreenY=h*0.75;
  var carScale=Math.min(0.9,w/800);
  ctx.save();CarDraw.drawFromBehind(ctx,this.driveConfig,carScreenX,carScreenY,carScale,this.steerInput*0.3);ctx.restore();
  for(var i=0;i<this.particles.length;i++){var p=this.particles[i];p.draw(ctx)}
};

Game.prototype._drawDriveHUD=function(w,h){
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(0,0,w,45);
  ctx.font='bold 16px sans-serif';ctx.textAlign='left';ctx.fillStyle='#FFD700';
  ctx.fillText('\u2b50 '+this.driveScore,12,28);
  var mins=Math.floor(this.driveTimer/60),secs=Math.floor(this.driveTimer%60);
  ctx.textAlign='center';ctx.fillStyle=this.driveTimer<15?'#ff4444':'#fff';
  ctx.fillText(mins+':'+(secs<10?'0':'')+secs,w/2,28);
  var spd=Math.floor(this.driveSpeed*2);ctx.textAlign='right';ctx.fillStyle='#aaa';
  ctx.fillText(spd+' km/h',w-65,28);
  ctx.font='14px sans-serif';ctx.textAlign='left';ctx.fillStyle='#ddd';
  var iconY=h-30;var ix=15;
  for(var g=0;g<this.goals.length;g++){var gl=this.goals[g];
    var emoji=gl.type==='carrot'?'\ud83e\udd55':gl.type==='cabbage'?'\ud83e\udd6c':gl.type==='tomato'?'\ud83c\udf45':'\ud83e\udd54';
    ctx.fillText(emoji+' '+gl.current+'/'+gl.target,ix,iconY);ix+=100}
  var camBtnX=w-70,camBtnY=60;ctx.fillStyle='rgba(255,255,255,0.3)';
  this._rr(ctx,camBtnX-20,camBtnY-20,40,40,8);ctx.fill();
  ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';
  ctx.fillText(this.viewMode==='behind'?'\ud83d\udd0d':'\ud83d\ude97',camBtnX,camBtnY+4);
};

Game.prototype._drawDrivingMenu=function(w,h){
  var grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#5a9e3a');grad.addColorStop(0.5,'#6abf2e');grad.addColorStop(1,'#8ed63f');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#666';ctx.fillRect(w*0.25,h*0.35,w*0.5,h*0.4);
  ctx.strokeStyle='#888';ctx.lineWidth=2;ctx.setLineDash([12,8]);
  ctx.beginPath();ctx.moveTo(w*0.5,h*0.35);ctx.lineTo(w*0.5,h*0.75);ctx.stroke();ctx.setLineDash([]);
  var ts=Math.min(36,w*0.08);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=3;
  ctx.strokeText('Vep\u0159\u00edkova j\u00edzda',w/2,h*0.18);ctx.fillText('Vep\u0159\u00edkova j\u00edzda',w/2,h*0.18);
  var cy=h*0.45,bw2=Math.min(60,w*0.1);
  ctx.font=(ts-4)+'px sans-serif';ctx.fillStyle='#fff';
  ctx.fillText('\u25c0',w/2-bw2-30,cy+5);ctx.fillText('\u25b6',w/2+bw2+30,cy+5);
  var typeNames={tractor:'Traktor',racing:'Z\u00e1vodn\u00ed auto',truck:'N\u00e1kladn\u00ed auto',bus:'Autobus'};
  ctx.font='bold 20px sans-serif';ctx.fillStyle='#fff';ctx.fillText(typeNames[this.driveConfig.type],w/2,cy+45);
  CarDraw.drawFromSide(ctx,this.driveConfig,w/2,cy,Math.min(1.3,w/380),0);
  ctx.font='12px sans-serif';ctx.fillStyle='#ddd';ctx.fillText('Vyber vozidlo',w/2,cy+65);
  var palY=h*0.58;ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.fillText('Barevn\u00e9 sch\u00e9ma',w/2,palY-10);
  var palType=this.driveConfig.type;
  for(var si=0;si<6;si++){var sx=w/2-135+si*45,selected=si===this.driveConfig.paletteIndex;
    ctx.beginPath();ctx.arc(sx+17,palY+17,16,0,Math.PI*2);
    ctx.fillStyle=PALETTES[palType][si].body;if(selected){ctx.strokeStyle='#FFD700';ctx.lineWidth=3;ctx.stroke()}
    ctx.fill();}
  var wsY=h*0.7;var wsTypes=['standard','terrain','chrome'];var wsNames=['Standard','Ter\u00e9n','Chrome'];
  ctx.font='bold 13px sans-serif';ctx.fillStyle='#fff';ctx.fillText('Pneumatiky',w/2,wsY-5);
  for(var wi=0;wi<3;wi++){var wx=w/2-120+wi*80,selected=wi===0&&this.driveConfig.wheelStyle==='standard'||wi===1&&this.driveConfig.wheelStyle==='terrain'||wi===2&&this.driveConfig.wheelStyle==='chrome';
    ctx.fillStyle='rgba(255,255,255,0.15)';this._rr(ctx,wx,wsY,65,30,6);ctx.fill();
    if(selected){ctx.strokeStyle='#FFD700';ctx.lineWidth=2;this._rr(ctx,wx,wsY,65,30,6);ctx.stroke()}
    ctx.font='11px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(wsNames[wi],wx+32,wsY+19)}
  ctx.textAlign='center';var btnY=h*0.82;
  ctx.fillStyle='#4477cc';this._rr(ctx,w/2-100,btnY,200,45,10);ctx.fill();
  ctx.font='bold 16px sans-serif';ctx.fillStyle='#fff';ctx.fillText('\u2699\ufe0f Nastaven\u00ed',w/2,btnY+28);
  ctx.fillStyle='#44aa44';this._rr(ctx,w/2-80,btnY+55,160,50,10);ctx.fill();
  ctx.font='bold 20px sans-serif';ctx.fillStyle='#fff';ctx.fillText('\u25b6 Hr\u00e1t',w/2,btnY+87)
};

Game.prototype._drawDriveSettings=function(w,h){
  var grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#4a8e2a');grad.addColorStop(1,'#7abf3e');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  var ts=Math.min(30,w*0.06);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=2;
  ctx.strokeText('Nastaven\u00ed',w/2,h*0.15);ctx.fillText('Nastaven\u00ed',w/2,h*0.15);
  var cardY=h*0.3,cardH=80,cardW=Math.min(w-60,350);
  ctx.fillStyle='rgba(0,0,0,0.3)';this._rr(ctx,w/2-cardW/2,cardY,cardW,cardH,10);ctx.fill();
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';
  ctx.fillText('Zp\u016fsob zrychlov\u00e1n\u00ed',w/2-cardW/2+20,cardY+30);
  var toggleX=w/2-cardW/2+20,toggleW=cardW-40;
  ctx.font='bold 16px sans-serif';ctx.textAlign='center';
  var autoOn=this.accelerationMode==='auto',touchOn=!autoOn;
  if(autoOn){ctx.fillStyle='#4477cc'}else{ctx.fillStyle='rgba(255,255,255,0.2)'}
  this._rr(ctx,toggleX,cardY+45,toggleW/2-3,30,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillText('Auto',toggleX+toggleW/4-10,cardY+65);
  if(touchOn){ctx.fillStyle='#ff8844'}else{ctx.fillStyle='rgba(255,255,255,0.2)'}
  this._rr(ctx,toggleX+toggleW/2+3,cardY+45,toggleW/2-3,30,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillText('Dotyk',toggleX+toggleW*3/4-10,cardY+65);
  var camY=h*0.55;
  ctx.fillStyle='rgba(0,0,0,0.3)';this._rr(ctx,w/2-cardW/2,camY,cardW,cardH,10);ctx.fill();
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='left';
  ctx.fillText('Pohled kamery',w/2-cardW/2+20,camY+30);
  var camToggleX=w/2-cardW/2+20,camToggleW=cardW-40;
  ctx.font='bold 16px sans-serif';ctx.textAlign='center';
  var behindOn=this.viewMode==='behind',cockpitOn=!behindOn;
  if(behindOn){ctx.fillStyle='#4477cc'}else{ctx.fillStyle='rgba(255,255,255,0.2)'}
  this._rr(ctx,camToggleX,camY+45,camToggleW/2-3,30,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillText('Za vozidlem',camToggleX+camToggleW/4-12,camY+65);
  if(cockpitOn){ctx.fillStyle='#ff8844'}else{ctx.fillStyle='rgba(255,255,255,0.2)'}
  this._rr(ctx,camToggleX+camToggleW/2+3,camY+45,camToggleW/2-3,30,6);ctx.fill();
  ctx.fillStyle='#fff';ctx.fillText('Z kokpitu',camToggleX+camToggleW*3/4-10,camY+65);
  var backY=h*0.8;
  ctx.fillStyle='#888';this._rr(ctx,w/2-80,backY,160,45,10);ctx.fill();
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#fff';ctx.fillText('\u25c0 Zp\u011bt',w/2,backY+29)
};

Game.prototype._drawDrivingComplete=function(w,h){
  renderRoad(ctx,w,h,this.carX,650,this.roadPosition,this.roadMap,this.gameTime);
  var horizonY=h*0.45;
  if(this.viewMode==='cockpit'){CarDraw.drawInCar(ctx,this.driveConfig,w,h,0)}
  else{var carScale=Math.min(1.2,w/600);CarDraw.drawFromBehind(ctx,this.driveConfig,w/2+this.cameraOffset.x*1.5,h*0.75,carScale,0)}
  for(var i=0;i<this.particles.length;i++){var p=this.particles[i];p.draw(ctx)}
  ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,0,w,h);
  var cy=h/2;var ts=Math.min(34,w*0.07);ctx.font='bold '+ts+'px sans-serif';ctx.textAlign='center';
  ctx.fillStyle='#FFD700';ctx.strokeStyle='#333';ctx.lineWidth=3;
  ctx.strokeText('J\u00edzda dokon\u010dena!',w/2,cy-55);ctx.fillText('J\u00edzda dokon\u010dena!',w/2,cy-55);
  ctx.font='bold 22px sans-serif';ctx.fillStyle='#fff';ctx.fillText('Sk\u00f3re: '+this.driveScore+' \u2b50',w/2,cy-15);
  var dist=Math.floor(this.driveDistance*10);ctx.font='16px sans-serif';ctx.fillStyle='#ddd';
  ctx.fillText('Vzd\u00e1lenost: '+dist+' m',w/2,cy+15);
  ctx.font='16px sans-serif';var ix=w/2;
  for(var g=0;g<this.goals.length;g++){var gl=this.goals[g];
    var emoji=gl.type==='carrot'?'\ud83e\udd55':gl.type==='cabbage'?'\ud83e\udd6c':gl.type==='tomato'?'\ud83c\udf45':'\ud83e\udd54';
    ctx.fillText(emoji+' '+gl.current,ix+g*50-75,cy+45)}
  var collected=this.collectibles.filter(function(c){return c.collected}).length;
  ctx.font='14px sans-serif';ctx.fillStyle='#aaa';
  ctx.fillText('Celkem sb\u00edreno: '+collected+'/'+this.collectibles.length,w/2,cy+70);
  ctx.font='bold 16px sans-serif';ctx.fillStyle='#FFD700';
  ctx.fillText('Klepni pro novou j\u00edzdu',w/2,cy+105)
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
  var bw=Math.min(180,w*0.42),bh=45,gap=15;
  this.bwPad=gap/2;
  var gx1=w/2-bw-gap/2,gy1=py+ph-60;
  var pulse=Math.sin(this.menuPulse)*3;ctx.fillStyle='#cc4444';this._rr(ctx,gx1-pulse/2,gy1-pulse/2,bw+pulse,bh+pulse,10);ctx.fill();
  ctx.strokeStyle='#aa2222';ctx.lineWidth=2;this._rr(ctx,gx1-pulse/2,gy1-pulse/2,bw+pulse,bh+pulse,10);ctx.stroke();
  ctx.font='bold '+Math.min(15,w*0.032)+'px sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';
  ctx.fillText('\ud83d\udc37 Zahrada',w/2-bw/2-gap/4,gy1+bh/2+6);
  var gx2=w/2+gap/2;
  ctx.fillStyle='#ee9922';this._rr(ctx,gx2-pulse/2,gy1-pulse/2,bw+pulse,bh+pulse,10);ctx.fill();
  ctx.strokeStyle='#cc7700';ctx.lineWidth=2;this._rr(ctx,gx2-pulse/2,gy1-pulse/2,bw+pulse,bh+pulse,10);ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillText('\ud83d\ude9c J\u00edzda',gx2+bw/2,gy1+bh/2+6)
};

Game.prototype._rr=function(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);
  c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);
  c.quadraticCurveTo(x,y,x+r,y);c.closePath()};

Game.prototype._reset=function(){this.score=0;this.stealAlertTimer=0;this.particles=[];this.thieves=[];this.thiefSpawnQueue=[];this.thiefSpawnTimer=0;this.thiefSpawnedCount=0;this.currentWave=0;this.waveAlertTimer=0;this.waveAlertText='';this._setupWorld();this.camera=new Vec();};

Game.prototype._loop=function(timestamp){var dt=Math.min((timestamp-this.lastTime)/1000,0.05);this.lastTime=timestamp;
  this._update(dt);this._draw();requestAnimationFrame(this._loop.bind(this));}

new Game();
