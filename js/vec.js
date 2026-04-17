function Vec(x,y){this.x=x||0;this.y=y||0}
Vec.prototype.add=function(v){return new Vec(this.x+v.x,this.y+v.y)};
Vec.prototype.sub=function(v){return new Vec(this.x-v.x,this.y-v.y)};
Vec.prototype.mul=function(s){return new Vec(this.x*s,this.y*s)};
Vec.prototype.len=function(){return Math.sqrt(this.x*this.x+this.y*this.y)};
Vec.prototype.norm=function(){var l=this.len();return l>0?this.mul(1/l):new Vec()};
Vec.prototype.dist=function(v){return this.sub(v).len()};
