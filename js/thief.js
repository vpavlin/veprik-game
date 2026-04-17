function Thief(x,y,type){
  var r=type==='fox'?20:type==='rabbit'?17:14;
  Entity.call(this,x,y,r);this.type=type;this.state='wander';this.target=null;
  this.stateTimer=0;this.hideSpot=null;
  if(type==='fox'){this.speed=130;this.color='#e87a20';this.name='Li\u0161ka'}
  else if(type==='rabbit'){this.speed=160;this.color='#999';this.name='Zaj\u00edc'}
  else{this.speed=100;this.color='#8B7355';this.name='My\u0161'}
  this.stateTimer=Math.random()*3+2;
}
Thief.prototype=new Entity();Thief.prototype.constructor=Thief;
Thief.prototype.update=function(dt,vp,obstacles,vegetables){
  this.stateTimer-=dt;
  if(this.state==='wander'){this._wander(dt,obstacles);
    for(var i=0;i<vegetables.length;i++){var v=vegetables[i];
      if(v.grown&&!v.collected&&this.pos.dist(new Vec(v.x,v.y))<35){
        this.state='stealing';this.target=v;this.stateTimer=1.5;break}}
    if(this.pos.dist(vp)<80){this._flee(vp);this.state='moving';this.stateTimer=1}}
  else if(this.state==='stealing'){
    if(this.target&&!this.target.collected){var tp=new Vec(this.target.x,this.target.y),dir=tp.sub(this.pos).norm();
      if(this.pos.dist(tp)>15)this.vel=dir.mul(this.speed*0.8);
      else{this.vel=new Vec();this.stateTimer-=dt;if(this.stateTimer<=0){
        this.target.collected=true;this.state='hiding';this._findHideSpot(obstacles);this.stateTimer=2.5+Math.random()}}}
    else{this.state='wander';this.stateTimer=Math.random()*3+2}}
  else if(this.state==='hiding'){
    if(this.hideSpot){var hp=new Vec(this.hideSpot.x+this.hideSpot.w/2,this.hideSpot.y),dir=hp.sub(this.pos).norm(),dist=this.pos.dist(hp);
      if(dist>5)this.vel=dir.mul(this.speed*0.6);else this.vel=new Vec()}
    if(this.hideSpot&&this.pos.dist(vp)<70){this.state='moving';this.stateTimer=1.5+Math.random();this._findNewTarget(vegetables)}}
  else if(this.state==='moving'){
    if(this.target){var tp=new Vec(this.target.x,this.target.y),dir=tp.sub(this.pos).norm();
      this.vel=dir.mul(this.speed*0.9);if(this.pos.dist(tp)<15){this.state='wander';this.target=null;this.stateTimer=Math.random()*3+2}}
    else{this.vel=new Vec();this.state='wander';this.stateTimer=1}}
  Entity.prototype.update.call(this,dt);this.pushOutOfObstacles(obstacles);this.pushOutOfWorld(WORLD_W,WORLD_H);
};
Thief.prototype._wander=function(dt,obstacles){
  if(this.vel.len()<10||this.stateTimer<=0){var angle=Math.random()*Math.PI*2;
    this.vel.x=Math.cos(angle)*this.speed*(0.3+Math.random()*0.4);
    this.vel.y=Math.sin(angle)*this.speed*(0.3+Math.random()*0.4);
    this.stateTimer=2+Math.random()*3;
    var gc=new Vec(WORLD_W/2,WORLD_H/2),tc=gc.sub(this.pos);
    if(tc.len()>200)this.vel=this.vel.mul(0.5).add(tc.norm().mul(this.speed*0.3))}
  var fp=this.pos.add(this.vel.mul(0.5));
  for(var i=0;i<obstacles.length;i++){if(obstacles[i].circleRectCollision(fp.x,fp.y,this.radius+10)){
    var angle=Math.random()*Math.PI*2;this.vel.x=Math.cos(angle)*this.speed*0.5;this.vel.y=Math.sin(angle)*this.speed*0.5;break}}
};
Thief.prototype._findHideSpot=function(obstacles){var closest=null,md=Infinity;
  for(var i=0;i<obstacles.length;i++){var b=obstacles[i],c=new Vec(b.x+b.w/2,b.y+b.h),d=this.pos.dist(c);
    if(d<md&&d<300){md=d;closest=b}}this.hideSpot=closest};
Thief.prototype._flee=function(vp){this.vel=this.pos.sub(vp).norm().mul(this.speed*1.3)};
Thief.prototype._findNewTarget=function(vegetables){var closest=null,md=Infinity;
  for(var i=0;i<vegetables.length;i++){var v=vegetables[i];if(v.grown&&!v.collected){
    var d=this.pos.dist(new Vec(v.x,v.y));if(d<md){md=d;closest=v}}}
  this.target=closest;if(!closest)this.target=new Vec(WORLD_W/2+(Math.random()-0.5)*400,WORLD_H/2+(Math.random()-0.5)*300)};

Thief.prototype.draw=function(c,cx,cy){
  var sx=this.pos.x-cx,sy=this.pos.y-cy;
  c.beginPath();c.ellipse(sx,sy+this.radius+2,this.radius*0.85,this.radius*0.25,0,0,Math.PI*2);
  c.fillStyle='rgba(0,0,0,0.15)';c.fill();
  if(this.type==='fox')this._drawFox(c,sx,sy);
  else if(this.type==='rabbit')this._drawRabbit(c,sx,sy);
  else this._drawMouse(c,sx,sy);
  // State indicator emoji
  var si='';if(this.state==='stealing')si='\ud83e\udd55';else if(this.state==='hiding')si='\ud83d\udc40';
  else if(this.state==='moving'&&this.pos.dist(new Vec(WORLD_W/2,WORLD_H/2))>100)si='\ud83d\udca8';
  if(si){c.font='16px sans-serif';c.textAlign='center';c.fillText(si,sx,sy-this.radius-15)}
  c.font='bold 10px sans-serif';c.textAlign='center';c.fillStyle='#ff6666';c.strokeStyle='#333';c.lineWidth=2;
  var ny=sy-this.radius-(si?30:14);c.strokeText(this.name,sx,ny);c.fillText(this.name,sx,ny);
};
Thief.prototype._drawFox=function(c,sx,sy){
  var bob=this.vel.len()>1?Math.sin(this.animPhase)*2:0,la=Math.sin(this.animPhase);
  c.beginPath();c.moveTo(sx-this.dir*15,sy+bob);c.quadraticCurveTo(sx-this.dir*35,sy-15+bob,sx-this.dir*25,sy-25+bob);
  c.quadraticCurveTo(sx-this.dir*15,sy-20+bob,sx-this.dir*18,sy-5+bob);c.fillStyle='#e87a20';c.fill();
  c.beginPath();c.arc(sx-this.dir*26,sy-24+bob,4,0,Math.PI*2);c.fillStyle='#fff';c.fill();
  c.beginPath();c.ellipse(sx,sy+bob,this.radius,this.radius*0.75,0,0,Math.PI*2);
  var gr=c.createRadialGradient(sx-3,sy-4+bob,2,sx,sy+bob,this.radius);
  gr.addColorStop(0,'#f09030');gr.addColorStop(1,'#d06810');c.fillStyle=gr;c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+s*7+la*3,sy+this.radius*0.5+bob,4,6,0,0,Math.PI*2);c.fillStyle='#d06810';c.fill()}
  c.beginPath();c.ellipse(sx+this.dir*12,sy-5+bob,11,9,0,0,Math.PI*2);c.fillStyle='#e87a20';c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.moveTo(sx+this.dir*10+s*5,sy-13+bob);c.lineTo(sx+this.dir*8+s*8,sy-25+bob);c.lineTo(sx+this.dir*14+s*3,sy-13+bob);c.fillStyle='#e87a20';c.fill();
    c.beginPath();c.moveTo(sx+this.dir*10+s*5,sy-13+bob);c.lineTo(sx+this.dir*8+s*8,sy-24+bob);c.lineTo(sx+this.dir*14+s*3,sy-13+bob);c.fillStyle='#f5b0b0';c.fill()}
  c.beginPath();c.ellipse(sx+this.dir*20,sy-3+bob,5,4,0,0,Math.PI*2);c.fillStyle='#f09030';c.fill();
  c.beginPath();c.arc(sx+this.dir*23,sy-3+bob,2,0,Math.PI*2);c.fillStyle='#222';c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+this.dir*14+s*5,sy-8+bob,3,2.5,0,0,Math.PI*2);c.fillStyle='#ffcc00';c.fill();
    c.beginPath();c.arc(sx+this.dir*14+s*5,sy-8+bob,1.5,0,Math.PI*2);c.fillStyle='#222';c.fill()}
};
Thief.prototype._drawRabbit=function(c,sx,sy){
  var bob=this.vel.len()>1?Math.sin(this.animPhase)*3:0,la=Math.sin(this.animPhase);
  c.beginPath();c.arc(sx-this.dir*16,sy+bob,5,0,Math.PI*2);c.fillStyle='#fff';c.fill();
  c.beginPath();c.ellipse(sx,sy+bob,this.radius,this.radius*0.8,0,0,Math.PI*2);
  var gr=c.createRadialGradient(sx-3,sy-4+bob,2,sx,sy+bob,this.radius);
  gr.addColorStop(0,'#bbb');gr.addColorStop(1,'#888');c.fillStyle=gr;c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+s*8+la*4,sy+this.radius*0.6+bob,6,5,0,0,Math.PI*2);c.fillStyle='#999';c.fill()}
  c.beginPath();c.arc(sx+this.dir*10,sy-8+bob,10,0,Math.PI*2);c.fillStyle='#aaa';c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+this.dir*8+s*5,sy-24+bob,3.5,14,s*0.15,0,Math.PI*2);c.fillStyle='#aaa';c.fill();
    c.beginPath();c.ellipse(sx+this.dir*8+s*5,sy-23+bob,2,10,s*0.15,0,Math.PI*2);c.fillStyle='#f5b0b0';c.fill()}
  for(var s=-1;s<=1;s+=2){c.beginPath();c.arc(sx+this.dir*16+s*4,sy-9+bob,3,0,Math.PI*2);c.fillStyle='#fff';c.fill();
    c.beginPath();c.arc(sx+this.dir*16+s*4.5,sy-9+bob,1.8,0,Math.PI*2);c.fillStyle='#cc3333';c.fill()}
  c.beginPath();c.arc(sx+this.dir*19,sy-5+bob,2,0,Math.PI*2);c.fillStyle='#f5b0b0';c.fill();
};
Thief.prototype._drawMouse=function(c,sx,sy){
  var bob=this.vel.len()>1?Math.sin(this.animPhase)*1.5:0,la=Math.sin(this.animPhase);
  c.beginPath();c.moveTo(sx-this.dir*12,sy+bob);c.quadraticCurveTo(sx-this.dir*30,sy+5+bob,sx-this.dir*35,sy-5+bob);
  c.strokeStyle='#a08060';c.lineWidth=2;c.lineCap='round';c.stroke();
  c.beginPath();c.ellipse(sx,sy+bob,this.radius,this.radius*0.7,0,0,Math.PI*2);
  var gr=c.createRadialGradient(sx-2,sy-3+bob,1,sx,sy+bob,this.radius);
  gr.addColorStop(0,'#a08060');gr.addColorStop(1,'#7a6040');c.fillStyle=gr;c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+s*5+la*2,sy+this.radius*0.5+bob,3,4,0,0,Math.PI*2);c.fillStyle='#8B7355';c.fill()}
  c.beginPath();c.arc(sx+this.dir*10,sy-5+bob,9,0,Math.PI*2);c.fillStyle='#9a8060';c.fill();
  for(var s=-1;s<=1;s+=2){c.beginPath();c.arc(sx+this.dir*6+s*8,sy-13+bob,7,0,Math.PI*2);c.fillStyle='#9a8060';c.fill();
    c.beginPath();c.arc(sx+this.dir*6+s*8,sy-13+bob,4.5,0,Math.PI*2);c.fillStyle='#f5b0b0';c.fill()}
  for(var s=-1;s<=1;s+=2){c.beginPath();c.arc(sx+this.dir*14+s*4,sy-7+bob,2.5,0,Math.PI*2);c.fillStyle='#fff';c.fill();
    c.beginPath();c.arc(sx+this.dir*14+s*4,sy-7+bob,1.5,0,Math.PI*2);c.fillStyle='#222';c.fill()}
  c.strokeStyle='#888';c.lineWidth=0.8;
  for(var s=-1;s<=1;s+=2){for(var i=-1;i<=1;i++){c.beginPath();c.moveTo(sx+this.dir*16,sy-3+bob);c.lineTo(sx+this.dir*24+s*2,sy-5+i*3+bob);c.stroke()}}
  c.beginPath();c.arc(sx+this.dir*18,sy-2+bob,1.5,0,Math.PI*2);c.fillStyle='#f5b0b0';c.fill();
};
Thief.prototype.checkCatch=function(v){return this.pos.dist(v.pos)<(this.radius+v.radius-5)};
