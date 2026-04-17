function Veprik(x,y){Entity.call(this,x,y,22);this.speed=160;this.caughtCount=0;this.catchAnim=0}
Veprik.prototype=new Entity();Veprik.prototype.constructor=Veprik;
Veprik.prototype.update=function(dt,jd,obstacles){
  var md=jd.mul(1),af=new Vec();
  for(var i=0;i<obstacles.length;i++){var obs=obstacles[i],cx=this.pos.x,cy=this.pos.y;
    var bx=Math.max(obs.x,Math.min(cx,obs.x+obs.w)),by=Math.max(obs.y,Math.min(cy,obs.y+obs.h));
    var dx=cx-bx,dy=cy-by,dist=Math.sqrt(dx*dx+dy*dy),ar=60;
    if(dist<ar){var s=(1-dist/ar)*3;af.x+=(dx/(dist||1))*s;af.y+=(dy/(dist||1))*s}}
  this.vel=md.mul(this.speed).add(af.mul(50));
  if(this.vel.len()>this.speed)this.vel=this.vel.norm().mul(this.speed);
  Entity.prototype.update.call(this,dt);this.pushOutOfObstacles(obstacles);this.pushOutOfWorld(WORLD_W,WORLD_H);
  if(this.catchAnim>0)this.catchAnim-=dt;
};
Veprik.prototype.draw=function(c,cx,cy){
  var sx=this.pos.x-cx,sy=this.pos.y-cy;
  c.beginPath();c.ellipse(sx,sy+this.radius+2,this.radius*0.9,this.radius*0.3,0,0,Math.PI*2);
  c.fillStyle='rgba(0,0,0,0.2)';c.fill();
  var bob=this.vel.len()>1?Math.sin(this.animPhase)*2:0;
  // Tail
  c.beginPath();var tx=sx-this.dir*18,ty=sy-5+bob;
  c.moveTo(tx,ty);c.quadraticCurveTo(tx-this.dir*12,ty-10,tx-this.dir*6,ty-15);
  c.quadraticCurveTo(tx-this.dir*2,ty-8,tx-this.dir*8,ty-3);
  c.strokeStyle='#f0a0a0';c.lineWidth=3;c.lineCap='round';c.stroke();
  // Body
  c.beginPath();c.ellipse(sx,sy+bob,this.radius,this.radius*0.85,0,0,Math.PI*2);
  var bg=c.createRadialGradient(sx-4,sy-6+bob,3,sx,sy+bob,this.radius);
  bg.addColorStop(0,'#ffb0b0');bg.addColorStop(1,'#e87070');c.fillStyle=bg;c.fill();
  c.strokeStyle='#d45555';c.lineWidth=1.5;c.stroke();
  // Legs
  var la=Math.sin(this.animPhase);
  for(var s=-1;s<=1;s+=2){var lx=sx+s*8,ly=sy+this.radius*0.6+bob;
    c.beginPath();c.ellipse(lx+la*3*s,ly+5,5,7,0,0,Math.PI*2);c.fillStyle='#e87070';c.fill();
    c.beginPath();c.ellipse(lx+la*3*s,ly+10,4,3,0,0,Math.PI*2);c.fillStyle='#cc6666';c.fill()}
  // Ears
  for(var s=-1;s<=1;s+=2){c.beginPath();c.ellipse(sx+s*14,sy-this.radius*0.7+bob,6,10,s*0.3,0,Math.PI*2);
    c.fillStyle='#f0a0a0';c.fill();c.strokeStyle='#d45555';c.lineWidth=1;c.stroke()}
  // Snout
  c.beginPath();c.ellipse(sx+this.dir*16,sy+2+bob,8,6,0,0,Math.PI*2);
  c.fillStyle='#f5b0b0';c.fill();c.strokeStyle='#d45555';c.lineWidth=1;c.stroke();
  for(var d=-1;d<=1;d+=2){c.beginPath();c.ellipse(sx+this.dir*20+d*3,sy+2+bob,2,2.5,0,0,Math.PI*2);
    c.fillStyle='#cc8888';c.fill()}
  // Eyes
  for(var s=-1;s<=1;s+=2){c.beginPath();c.arc(sx+this.dir*8+s*6,sy-6+bob,3.5,0,Math.PI*2);c.fillStyle='#fff';c.fill();
    c.beginPath();c.arc(sx+this.dir*9+s*6,sy-6+bob,2,0,Math.PI*2);c.fillStyle='#222';c.fill()}
  // Catch sparkles
  if(this.catchAnim>0){for(var i=0;i<5;i++){var a=this.animPhase+i*1.2;
    c.beginPath();c.arc(sx+Math.cos(a)*30,sy+Math.sin(a)*25+bob,3,0,Math.PI*2);
    var hue=(i*60+this.catchAnim*100)%360;c.fillStyle='hsl('+hue+',80%,70%)';c.fill()}}
  // Name
  c.font='bold 12px sans-serif';c.textAlign='center';
  c.fillStyle='#fff';c.strokeStyle='#333';c.lineWidth=2;
  var nameStr='Vep\u0159\u00edk';
  c.strokeText(nameStr,sx,sy-this.radius-8+bob);c.fillText(nameStr,sx,sy-this.radius-8+bob);
};
