function Particle(x,y,c,l,s,vx,vy){
  this.x=x;this.y=y;this.color=c;this.life=l;this.maxLife=l;this.size=s;
  this.vx=vx||(Math.random()-0.5)*2;this.vy=vy||(Math.random()-0.5)*2-1;
}
Particle.prototype.update=function(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;this.vy+=0.5*dt};
Particle.prototype.draw=function(c,cx,cy){
  var a=Math.max(0,this.life/this.maxLife);
  c.globalAlpha=a;c.beginPath();c.arc(this.x-cx,this.y-cy,this.size*a,0,Math.PI*2);
  c.fillStyle=this.color;c.fill();c.globalAlpha=1;
};
