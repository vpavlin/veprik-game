function Entity(x,y,r){this.pos=new Vec(x,y);this.vel=new Vec();this.radius=r;
  this.speed=0;this.dir=1;this.animPhase=0;this.alive=true}
Entity.prototype.update=function(dt){var np=this.pos.add(this.vel.mul(dt));this.pos.x=np.x;this.pos.y=np.y;
  if(this.vel.x!==0)this.dir=Math.sign(this.vel.x);
  if(this.vel.len()>0.1)this.animPhase+=dt*8};
Entity.prototype.pushOutOfObstacles=function(obstacles,margin){
  margin=margin||2;
  for(var k=0;k<obstacles.length;k++){var obs=obstacles[k],cx=this.pos.x,cy=this.pos.y,r=this.radius+margin;
    if(!obs.circleRectCollision(cx,cy,r))continue;
    var bx=Math.max(obs.x,Math.min(cx,obs.x+obs.w)),by=Math.max(obs.y,Math.min(cy,obs.y+obs.h));
    var dx=cx-bx,dy=cy-by,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist===0){this.pos.x-=r;continue}var overlap=r-dist;
    if(overlap>0){this.pos.x+=(dx/dist)*overlap;this.pos.y+=(dy/dist)*overlap}}};
Entity.prototype.pushOutOfWorld=function(w,h,margin){
  margin=margin||10;this.pos.x=Math.max(margin,Math.min(w-margin,this.pos.x));
  this.pos.y=Math.max(margin,Math.min(h-margin,this.pos.y))};
