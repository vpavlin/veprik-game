function Joystick(x,y,r){
  this.baseX=x||0;this.baseY=y||0;this.stickX=this.baseX;this.stickY=this.baseY;
  this.radius=r||50;this.active=false;this.touchId=null;this.dx=0;this.dy=0;
  this.maxDist=(r||50)*0.7;
}
Joystick.prototype.handleStart=function(x,y,id){
  var d=Math.sqrt((x-this.baseX)*(x-this.baseX)+(y-this.baseY)*(y-this.baseY));
  if(d<this.radius*2.5&&!this.active){this.active=true;this.touchId=id;this._updateStick(x,y);return true}
  return false;
};
Joystick.prototype.handleMove=function(x,y,id){
  if(this.active&&id===this.touchId){this._updateStick(x,y);return true}
  return false;
};
Joystick.prototype.handleEnd=function(id){
  if(this.active&&id===this.touchId){this.active=false;this.touchId=null;this.stickX=this.baseX;this.stickY=this.baseY;this.dx=0;this.dy=0;return true}
  return false;
};
Joystick.prototype._updateStick=function(x,y){
  var dx=x-this.baseX,dy=y-this.baseY,d=Math.sqrt(dx*dx+dy*dy);
  if(d>this.maxDist){dx=dx/d*this.maxDist;dy=dy/d*this.maxDist}
  this.stickX=this.baseX+dx;this.stickY=this.baseY+dy;this.dx=dx/this.maxDist;this.dy=dy/this.maxDist;
};
Joystick.prototype.draw=function(c){
  c.globalAlpha=0.4;
  c.beginPath();c.arc(this.baseX,this.baseY,this.radius,0,Math.PI*2);
  c.fillStyle='rgba(255,255,255,0.3)';c.fill();
  c.strokeStyle='rgba(255,255,255,0.5)';c.lineWidth=2;c.stroke();
  c.beginPath();c.arc(this.stickX,this.stickY,this.radius*0.45,0,Math.PI*2);
  c.fillStyle='rgba(255,255,255,0.6)';c.fill();
  c.strokeStyle='rgba(255,255,255,0.8)';c.stroke();
  c.globalAlpha=1;
};
Joystick.prototype.resetPos=function(x,y){this.baseX=x;this.baseY=y;if(!this.active){this.stickX=x;this.stickY=y}};
