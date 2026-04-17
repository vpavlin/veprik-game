function Obstacle(x,y,w,h,type){
  this.x=x;this.y=y;this.w=w;this.h=h;this.type=type||'tree';
}
Obstacle.prototype.draw=function(c,cx,cy){
  var sx=this.x-cx,sy=this.y-cy;
  if(sx+this.w<-50||sx>canvas.width+50||sy+this.h<-50||sy>canvas.height+50)return;
  if(this.type==='tree'){
    c.fillStyle='#6B4226';c.fillRect(sx+this.w*0.35,sy+this.h*0.4,this.w*0.3,this.h*0.6);
    var cols=['#1a5c1a','#2d7a2d','#3a9a3a'];
    for(var i=0;i<3;i++){var r=this.w*(0.4+i*0.08),ccx=sx+this.w/2,ccy=sy+this.h*(0.35-i*0.08);
      c.beginPath();c.arc(ccx,ccy,r,0,Math.PI*2);c.fillStyle=cols[i];c.fill()}
    c.beginPath();c.arc(sx+this.w*0.35,sy+this.h*0.15,this.w*0.12,0,Math.PI*2);
    c.fillStyle='rgba(100,200,100,0.4)';c.fill();
  } else if(this.type==='crate'){
    c.fillStyle='#c4903a';c.fillRect(sx,sy,this.w,this.h);
    c.strokeStyle='#8B6914';c.lineWidth=2;c.strokeRect(sx,sy,this.w,this.h);
    c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+this.w,sy+this.h);
    c.moveTo(sx+this.w,sy);c.lineTo(sx,sy+this.h);
    c.strokeStyle='rgba(139,105,20,0.5)';c.lineWidth=1.5;c.stroke();
    c.fillStyle='rgba(255,255,200,0.15)';c.fillRect(sx+2,sy+2,this.w-4,this.h*0.3);
  } else {
    c.fillStyle='#8B4513';c.fillRect(sx,sy+this.h*0.15,this.w,this.h*0.7);
    c.strokeStyle='#5C3317';c.lineWidth=2;c.strokeRect(sx,sy+this.h*0.15,this.w,this.h*0.7);
    var wY=sy+this.h*0.85;
    c.beginPath();c.arc(sx+this.w*0.2,wY,this.h*0.15,0,Math.PI*2);c.fillStyle='#5C3317';c.fill();
    c.beginPath();c.arc(sx+this.w*0.8,wY,this.h*0.15,0,Math.PI*2);c.fill();
    c.fillStyle='#cc3333';c.fillRect(sx,sy+this.h*0.35,this.w,this.h*0.08);
  }
};
Obstacle.prototype.circleRectCollision=function(cx,cy,r){
  var bx=Math.max(this.x,Math.min(cx,this.x+this.w));
  var by=Math.max(this.y,Math.min(cy,this.y+this.h));
  return Math.sqrt((cx-bx)*(cx-bx)+(cy-by)*(cy-by))<r;
};
