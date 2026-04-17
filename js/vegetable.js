function Veg(x,y,type){this.x=x;this.y=y;this.type=type;this.collected=false;
  this.growTime=Math.random()*2+1;this.grown=false;this.bobPhase=Math.random()*Math.PI*2}
Veg.prototype.update=function(dt){this.growTime-=dt;if(this.growTime<=0)this.grown=true;this.bobPhase+=dt*2};
Veg.prototype.draw=function(c,cx,cy){
  if(this.collected)return;var sx=this.x-cx,sy=this.y-cy+Math.sin(this.bobPhase)*2;
  if(sx<-30||sx>canvas.width+30||sy<-30||sy>canvas.height+30)return;
  c.globalAlpha=this.grown?1:0.4;
  switch(this.type){
    case 'carrot':c.beginPath();c.arc(sx,sy,8,0,Math.PI*2);c.fillStyle='#ff7733';c.fill();
      c.fillStyle='#44aa44';c.beginPath();c.moveTo(sx-3,sy-6);c.lineTo(sx,sy-14);c.lineTo(sx+3,sy-6);c.fill();break;
    case 'cabbage':c.beginPath();c.arc(sx,sy,10,0,Math.PI*2);c.fillStyle='#55aa55';c.fill();
      c.strokeStyle='#338833';c.lineWidth=1;c.stroke();
      for(var i=0;i<6;i++){var a=(i/6)*Math.PI*2;c.beginPath();c.arc(sx+Math.cos(a)*5,sy+Math.sin(a)*5,4,0,Math.PI*2);c.fillStyle='#66cc66';c.fill()}break;
    case 'tomato':c.beginPath();c.arc(sx,sy,7,0,Math.PI*2);c.fillStyle='#ee3333';c.fill();
      c.fillStyle='#44aa44';c.fillRect(sx-2,sy-10,4,5);break;
    case 'potato':c.beginPath();c.ellipse(sx,sy,9,7,0,0,Math.PI*2);c.fillStyle='#bb8833';c.fill();
      c.strokeStyle='#996622';c.lineWidth=1;c.stroke();break;
  }
  c.globalAlpha=1;
};
