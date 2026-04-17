var CAR_TYPES = { TRACTOR: 'tractor', RACING: 'racing', TRUCK: 'truck', BUS: 'bus' };
var PALETTES = { tractor: [{body:'#cc4444',accent:'#aa2222',detail:'#881111'},{body:'#4477cc',accent:'#3366bb',detail:'#2255aa'},{body:'#44aa44',accent:'#339933',detail:'#228822'},{body:'#ddaa33',accent:'#cc9922',detail:'#bb8811'},{body:'#8844aa',accent:'#773399',detail:'#662288'},{body:'#ee8833',accent:'#dd7722',detail:'#cc6611'}], racing: [{body:'#ff2222',accent:'#cc0000',detail:'#990000'},{body:'#2244ff',accent:'#1133dd',detail:'#0022bb'},{body:'#22cc22',accent:'#11aa11',detail:'#008800'},{body:'#ffcc00',accent:'#eebb00',detail:'#ddaa00'},{body:'#ff6600',accent:'#ee5500',detail:'#dd4400'},{body:'#ffffff',accent:'#dddddd',detail:'#aaaaaa'}], truck: [{body:'#888888',accent:'#666666',detail:'#555555'},{body:'#cc4444',accent:'#aa3333',detail:'#882222'},{body:'#4477cc',accent:'#3366bb',detail:'#2255aa'},{body:'#ddaa33',accent:'#cc9922',detail:'#bb8811'},{body:'#558855',accent:'#447744',detail:'#336633'},{body:'#6666aa',accent:'#555599',detail:'#444488'}], bus: [{body:'#ddcc22',accent:'#ccbb11',detail:'#aa9900'},{body:'#cc4444',accent:'#bb3333',detail:'#aa2222'},{body:'#4488cc',accent:'#3377bb',detail:'#2266aa'},{body:'#55aa55',accent:'#449944',detail:'#338833'},{body:'#dd8844',accent:'#cc7733',detail:'#bb6622'},{body:'#8866bb',accent:'#7755aa',detail:'#664499'}] };
var WHEEL_STYLES = { standard: 'standard', terrain: 'terrain', chrome: 'chrome' };

function drawWheel(ctx, x, y, radius, style, steerAngle) {
  var r = radius || 10;
  ctx.save();
  ctx.translate(x, y);
  if (steerAngle) ctx.rotate(steerAngle);
  // Tire
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (style === 'terrain') {
    var treads = 12;
    for (var i = 0; i < treads; i++) {
      var a = (i / treads) * Math.PI * 2;
      ctx.fillStyle = '#333';
      ctx.save(); ctx.rotate(a);
      ctx.fillRect(r - 2, -2, 4, 4);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#444'; ctx.fill();
  } else if (style === 'chrome') {
    var grad = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
    grad.addColorStop(0, '#eee'); grad.addColorStop(0.7, '#aaa'); grad.addColorStop(1, '#777');
    ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(-r*0.15, -r*0.15, r*0.35, -0.5, 1.2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#888'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#aaa'; ctx.fill();
  }
  ctx.restore();
}

function drawVepriksEars(ctx, x, y, earR) {
  var r = earR || 4;
  ctx.fillStyle = '#ff8899';
  // Left ear - floppy
  ctx.beginPath(); ctx.ellipse(x - r*2.5, y - r*1.5, r*1.2, r*2, -0.3, 0, Math.PI*2); ctx.fill();
  // Right ear - floppy
  ctx.beginPath(); ctx.ellipse(x + r*2.5, y - r*1.5, r*1.2, r*2, 0.3, 0, Math.PI*2); ctx.fill();
  // Inner ear
  ctx.fillStyle = '#ffaaBB';
  ctx.beginPath(); ctx.ellipse(x - r*2.5, y - r*1.5, r*0.6, r*1.2, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + r*2.5, y - r*1.5, r*0.6, r*1.2, 0.3, 0, Math.PI*2); ctx.fill();
}

function drawFromBehind(ctx, config, x, y, scale, steerAngle) {
  var s = scale || 1;
  var type = config.type || CAR_TYPES.RACING;
  var palIdx = config.paletteIndex || 0;
  var wheelStyle = config.wheelStyle || WHEEL_STYLES.standard;
  var p = PALETTES[type][palIdx];
  steerAngle = steerAngle || 0;

  ctx.save();
  ctx.translate(x, y);

  if (type === CAR_TYPES.TRACTOR) {
    // Rear wheels (big, behind body)
    var rw = 28 * s; drawWheel(ctx, -rw*1.3, rw*0.5, rw, wheelStyle, 0);
    drawWheel(ctx, rw*1.3, rw*0.5, rw, wheelStyle, 0);
    // Body
    var bw = 50*s, bh = 68*s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw/2, -bh/2, bw, bh, 6*s); ctx.fill();
    ctx.fillStyle = p.detail; ctx.fillRect(-bw*0.1, -bh*0.35, bw*0.2, bh*0.08); // exhaust
    // Cab / raised front
    var cw = bw*0.7, ch = 25*s;
    ctx.fillStyle = p.accent; roundRect(ctx, -cw/2, -bh/2 - ch*0.6, cw, ch, 4*s); ctx.fill();
    // Windshield
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-cw*0.35, -bh/2 - ch*0.5, cw*0.7, ch*0.4);
    drawVepriksEars(ctx, 0, -bh/2 - ch*0.9, 3*s);
    // Front wheels (smaller)
    var fw = 18 * s; drawWheel(ctx, -fw*1.5, -fw*1.6, fw, wheelStyle, steerAngle);
    drawWheel(ctx, fw*1.5, -fw*1.6, fw, wheelStyle, steerAngle);

  } else if (type === CAR_TYPES.RACING) {
    // Wheels behind body
    var rw2 = 14*s;
    drawWheel(ctx, -rw2*1.7, rw2*0.9, rw2, wheelStyle, 0);
    drawWheel(ctx, rw2*1.7, rw2*0.9, rw2, wheelStyle, 0);
    // Body low and wide
    var rw3 = 56*s, rh = 24*s;
    ctx.fillStyle = p.body; roundRect(ctx, -rw3/2, -rh/2, rw3, rh, 8*s); ctx.fill();
    // Spoiler
    ctx.fillStyle = p.detail;
    ctx.fillRect(-rw3*0.45, rh/2 - 4*s, rw3*0.9, 6*s);
    ctx.fillRect(-rw3*0.4, rh/2, rw3*0.06, 8*s);
    ctx.fillRect(rw3*0.34, rh/2, rw3*0.06, 8*s);
    // Windshield angled polygon
    ctx.fillStyle = '#77aacc'; ctx.beginPath();
    ctx.moveTo(-rw3*0.25, -rh*0.15); ctx.lineTo(rw3*0.25, -rh*0.15);
    ctx.lineTo(rw3*0.18, -rh*0.45); ctx.lineTo(-rw3*0.18, -rh*0.45);
    ctx.closePath(); ctx.fill();
    drawVepriksEars(ctx, 0, -rh*0.32, 2.5*s);
    // Headlights
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath(); ctx.arc(-rw3*0.38, rh/2-4*s, 3*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rw3*0.38, rh/2-4*s, 3*s, 0, Math.PI*2); ctx.fill();
    // Front wheels
    var fw2 = 13*s;
    drawWheel(ctx, -fw2*1.7, -fw2*1.5, fw2, wheelStyle, steerAngle);
    drawWheel(ctx, fw2*1.7, -fw2*1.5, fw2, wheelStyle, steerAngle);

  } else if (type === CAR_TYPES.TRUCK) {
    // Rear wheels (4 total)
    var rw4 = 16*s;
    drawWheel(ctx, -rw4*1.5, rw4*0.3, rw4, wheelStyle, 0);
    drawWheel(ctx, -rw4*1.5, rw4*1.8, rw4, wheelStyle, 0);
    drawWheel(ctx, rw4*1.5, rw4*0.3, rw4, wheelStyle, 0);
    drawWheel(ctx, rw4*1.5, rw4*1.8, rw4, wheelStyle, 0);
    // Trailer bed behind cab
    var tw = 36*s, th = 72*s;
    ctx.fillStyle = p.accent; roundRect(ctx, -tw/2, 10*s, tw, th, 4*s); ctx.fill();
    ctx.fillStyle = p.detail; ctx.fillRect(-tw*0.35, 12*s, tw*0.7, 3*s); // bed lines
    // Cab
    var cw2 = 48*s, ch2 = 46*s;
    ctx.fillStyle = p.body; roundRect(ctx, -cw2/2, -ch2-10*s, cw2, ch2, 5*s); ctx.fill();
    // Windshield
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-cw2*0.32, -ch2-6*s, cw2*0.64, 14*s);
    drawVepriksEars(ctx, 0, -ch2-12*s, 3*s);
    // Front wheels
    var fw3 = 15*s;
    drawWheel(ctx, -fw3*1.5, -fw3*1.6, fw3, wheelStyle, steerAngle);
    drawWheel(ctx, fw3*1.5, -fw3*1.6, fw3, wheelStyle, steerAngle);

  } else if (type === CAR_TYPES.BUS) {
    // Wheels
    var rw5 = 18*s;
    drawWheel(ctx, -rw5*1.5, rw5*0.4, rw5, wheelStyle, 0);
    drawWheel(ctx, rw5*1.5, rw5*0.4, rw5, wheelStyle, 0);
    // Body tall with domed roof
    var bw2 = 52*s, bh2 = 86*s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw2/2, -bh2/2, bw2, bh2, 10*s); ctx.fill();
    // Dome on top
    ctx.beginPath(); ctx.arc(0, -bh2/2, bw2*0.48, Math.PI, 0);
    ctx.fillStyle = p.accent; ctx.fill();
    // Windows row
    ctx.fillStyle = '#99ccee';
    for (var wi = 0; wi < 4; wi++) {
      ctx.fillRect(-bw2*0.38, -bh2*0.15 + wi*bh2*0.16, bw2*0.76, bh2*0.1);
    }
    // Large front windshield
    ctx.fillStyle = '#88bbdd'; ctx.beginPath();
    ctx.moveTo(-bw2*0.3, -bh2/2+14*s); ctx.lineTo(bw2*0.3, -bh2/2+14*s);
    ctx.lineTo(bw2*0.25, -bh2/2-8*s); ctx.lineTo(-bw2*0.25, -bh2/2-8*s);
    ctx.closePath(); ctx.fill();
    drawVepriksEars(ctx, 0, -bh2/2-12*s, 3*s);
    // Stop sign arm folded at side
    ctx.fillStyle = p.detail; ctx.fillRect(bw2/2+1*s, -bh2*0.1, 4*s, 16*s);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(bw2/2+1*s, -bh2*0.1, 4*s, 10*s);
    // Front wheels
    var fw4 = 17*s;
    drawWheel(ctx, -fw4*1.5, -fw4*1.6, fw4, wheelStyle, steerAngle);
    drawWheel(ctx, fw4*1.5, -fw4*1.6, fw4, wheelStyle, steerAngle);
  }
  ctx.restore();
}

function drawFromSide(ctx, config, x, y, scale, steerAngle) {
  var s = scale || 1;
  var type = config.type || CAR_TYPES.RACING;
  var palIdx = config.paletteIndex || 0;
  var p = PALETTES[type][palIdx];
  steerAngle = steerAngle || 0;

  ctx.save();
  ctx.translate(x, y);

  if (type === CAR_TYPES.TRACTOR) {
    var rw = 26 * s;
    drawWheel(ctx, -rw * 1.4, rw * 0.8, rw, 'standard', 0);
    drawWheel(ctx, rw * 1.4, rw * 0.8, rw, 'standard', 0);
    var bw = 55 * s, bh = 52 * s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 5 * s); ctx.fill();
    ctx.fillStyle = p.detail; ctx.fillRect(-bw * 0.1, -bh * 0.35, bw * 0.2, bh * 0.06);
    var cw = bw * 0.65, ch = 28 * s;
    ctx.fillStyle = p.accent; roundRect(ctx, -cw / 2, -bh / 2 - ch, cw, ch, 4 * s); ctx.fill();
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-cw * 0.3, -bh / 2 - ch + 4 * s, cw * 0.6, ch * 0.35);
    drawVepriksEars(ctx, 0, -bh / 2 - ch * 1.1, 3 * s);
    var fw = 16 * s; drawWheel(ctx, -fw * 1.3, -fw * 1.8, fw, 'standard', steerAngle);
    drawWheel(ctx, fw * 1.3, -fw * 1.8, fw, 'standard', steerAngle);
  } else if (type === CAR_TYPES.RACING) {
    var rw2 = 13 * s;
    drawWheel(ctx, -rw2 * 1.5, rw2 * 0.7, rw2, 'standard', 0);
    drawWheel(ctx, rw2 * 1.5, rw2 * 0.7, rw2, 'standard', 0);
    var rw3 = 58 * s, rh = 22 * s;
    ctx.fillStyle = p.body; roundRect(ctx, -rw3 / 2, -rh / 2, rw3, rh, 7 * s); ctx.fill();
    ctx.fillStyle = p.detail;
    ctx.fillRect(-rw3 * 0.42, rh / 2 - 3 * s, rw3 * 0.84, 5 * s);
    ctx.fillRect(-rw3 * 0.38, rh / 2, rw3 * 0.05, 7 * s);
    ctx.fillRect(rw3 * 0.33, rh / 2, rw3 * 0.05, 7 * s);
    ctx.fillStyle = '#77aacc'; ctx.beginPath();
    ctx.moveTo(-rw3 * 0.22, -rh * 0.1); ctx.lineTo(rw3 * 0.22, -rh * 0.1);
    ctx.lineTo(rw3 * 0.16, -rh * 0.48); ctx.lineTo(-rw3 * 0.16, -rh * 0.48);
    ctx.closePath(); ctx.fill();
    drawVepriksEars(ctx, -2 * s, -rh * 0.35, 2.5 * s);
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath(); ctx.arc(-rw3 * 0.42, rh / 2 - 3 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rw3 * 0.42, rh / 2 - 3 * s, 2.5 * s, 0, Math.PI * 2); ctx.fill();
    var fw2 = 12 * s; drawWheel(ctx, -fw2 * 1.3, -fw2 * 1.7, fw2, 'standard', steerAngle);
    drawWheel(ctx, fw2 * 1.3, -fw2 * 1.7, fw2, 'standard', steerAngle);
  } else if (type === CAR_TYPES.TRUCK) {
    var rw4 = 15 * s;
    drawWheel(ctx, -rw4 * 1.3, rw4 * 0.2, rw4, 'standard', 0);
    drawWheel(ctx, -rw4 * 1.3, rw4 * 1.6, rw4, 'standard', 0);
    drawWheel(ctx, rw4 * 1.3, rw4 * 0.2, rw4, 'standard', 0);
    drawWheel(ctx, rw4 * 1.3, rw4 * 1.6, rw4, 'standard', 0);
    var tw = 34 * s, th = 60 * s;
    ctx.fillStyle = p.accent; roundRect(ctx, -tw / 2, 5 * s, tw, th, 3 * s); ctx.fill();
    ctx.fillStyle = p.detail; ctx.fillRect(-tw * 0.3, 7 * s, tw * 0.6, 2 * s);
    var cw2 = 44 * s, ch2 = 42 * s;
    ctx.fillStyle = p.body; roundRect(ctx, -cw2 / 2, -ch2 - 8 * s, cw2, ch2, 5 * s); ctx.fill();
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-cw2 * 0.3, -ch2 - 4 * s, cw2 * 0.55, 12 * s);
    drawVepriksEars(ctx, -2 * s, -ch2 - 11 * s, 3 * s);
    var fw3 = 14 * s; drawWheel(ctx, -fw3 * 1.2, -fw3 * 1.8, fw3, 'standard', steerAngle);
    drawWheel(ctx, fw3 * 1.2, -fw3 * 1.8, fw3, 'standard', steerAngle);
  } else if (type === CAR_TYPES.BUS) {
    var rw5 = 17 * s;
    drawWheel(ctx, -rw5 * 1.3, rw5 * 0.3, rw5, 'standard', 0);
    drawWheel(ctx, rw5 * 1.3, rw5 * 0.3, rw5, 'standard', 0);
    var bw2 = 54 * s, bh2 = 78 * s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw2 / 2, -bh2 / 2, bw2, bh2, 9 * s); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -bh2 / 2, bw2 * 0.48, Math.PI, 0);
    ctx.fillStyle = p.accent; ctx.fill();
    ctx.fillStyle = '#99ccee';
    for (var wi = 0; wi < 4; wi++) {
      ctx.fillRect(-bw2 * 0.36, -bh2 * 0.12 + wi * bh2 * 0.15, bw2 * 0.72, bh2 * 0.09);
    }
    ctx.fillStyle = '#88bbdd'; ctx.beginPath();
    ctx.moveTo(-bw2 * 0.28, -bh2 / 2 + 12 * s); ctx.lineTo(bw2 * 0.28, -bh2 / 2 + 12 * s);
    ctx.lineTo(bw2 * 0.23, -bh2 / 2 - 6 * s); ctx.lineTo(-bw2 * 0.23, -bh2 / 2 - 6 * s);
    ctx.closePath(); ctx.fill();
    drawVepriksEars(ctx, -2 * s, -bh2 / 2 - 10 * s, 3 * s);
    ctx.fillStyle = p.detail; ctx.fillRect(bw2 / 2, -bh2 * 0.08, 3 * s, 14 * s);
    ctx.fillStyle = '#cc2222'; ctx.fillRect(bw2 / 2, -bh2 * 0.08, 3 * s, 8 * s);
    var fw4 = 16 * s; drawWheel(ctx, -fw4 * 1.2, -fw4 * 1.7, fw4, 'standard', steerAngle);
    drawWheel(ctx, fw4 * 1.2, -fw4 * 1.7, fw4, 'standard', steerAngle);
  }
  ctx.restore();
}

function drawInCar(ctx, config, width, height, steerAngle) {
  var s = (width || 800) / 800;
  var type = config.type || CAR_TYPES.RACING;
  var palIdx = config.paletteIndex || 0;
  var p = PALETTES[type][palIdx];
  steerAngle = steerAngle || 0;

  // Sky / road background through windshield
  ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, width, height * 0.65);
  ctx.fillStyle = '#55aa55'; ctx.fillRect(0, height*0.48, width, height*0.12);
  ctx.fillStyle = '#666'; ctx.fillRect(0, height*0.56, width, height*0.14);

  // Side mirrors with road reflection
  var mh = 36*s, mw = 28*s;
  ctx.fillStyle = '#333';
  roundRect(ctx, 4*s, height*0.28, mw, mh, 5*s); ctx.fill();
  roundRect(ctx, width-mw-4*s, height*0.28, mw, mh, 5*s); ctx.fill();
  // Mirror reflections (simple road colors)
  ctx.fillStyle = '#7799bb'; ctx.fillRect(6*s, height*0.28+2*s, mw-4*s, mh*0.35);
  ctx.fillStyle = '#666'; ctx.fillRect(6*s, height*0.28+mh*0.35, mw-4*s, mh*0.45);
  ctx.fillStyle = '#7799bb'; ctx.fillRect(width-mw+6*s, height*0.28+2*s, mw-4*s, mh*0.35);
  ctx.fillStyle = '#666'; ctx.fillRect(width-mw+6*s, height*0.28+mh*0.35, mw-4*s, mh*0.45);

  // Dashboard - dark rectangle across bottom ~30% with curved top edge
  var dashY = height * 0.7;
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.moveTo(0, dashY);
  ctx.quadraticCurveTo(width*0.5, dashY - 18*s, width, dashY);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
  ctx.fill();

  // Dashboard detail line
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, dashY + 4*s);
  ctx.quadraticCurveTo(width*0.5, dashY - 14*s, width, dashY + 4*s);
  ctx.stroke();

  // Speed gauge arc
  var gx = width*0.35, gy = dashY + height*0.2, gr = 28*s;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI*0.75, Math.PI*2.25); ctx.stroke();
  // Needle
  var needleAngle = Math.PI*1.5 + (steerAngle * 2);
  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(needleAngle)*gr*0.8, gy + Math.sin(needleAngle)*gr*0.8);
  ctx.stroke();

  // Fuel bar
  var fx = width*0.65, fy = dashY + height*0.2;
  ctx.fillStyle = '#333'; ctx.fillRect(fx-20*s, fy-10*s, 40*s, 8*s);
  ctx.fillStyle = '#44cc44'; ctx.fillRect(fx-19*s, fy-9*s, 28*s, 6*s);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(fx-20*s, fy-10*s, 40*s, 8*s);

  // Steering wheel - rotates with steerAngle
  var swCX = width*0.5, swCY = dashY + height*0.35, swR = 65*s;
  ctx.save();
  ctx.translate(swCX, swCY);
  ctx.rotate(steerAngle * 1.2);
  // Rim
  ctx.strokeStyle = '#444'; ctx.lineWidth = 8*s;
  ctx.beginPath(); ctx.arc(0, 0, swR, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 6*s;
  ctx.beginPath(); ctx.arc(0, 0, swR, 0, Math.PI*2); ctx.stroke();
  // Spokes
  ctx.strokeStyle = '#444'; ctx.lineWidth = 5*s;
  for (var si = 0; si < 3; si++) {
    var sa = (si / 3) * Math.PI * 2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sa)*swR*0.85, Math.sin(sa)*swR*0.85);
    ctx.stroke();
  }
  // Horn button center
  ctx.beginPath(); ctx.arc(0, 0, swR*0.3, 0, Math.PI*2);
  ctx.fillStyle = '#666'; ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.stroke();
  // Vepřík logo on horn button
  ctx.beginPath(); ctx.arc(0, 0, swR*0.15, 0, Math.PI*2);
  ctx.fillStyle = '#ff8899'; ctx.fill();
  ctx.restore();

  // Vepřík - head and ears peeking over dash on LEFT side (small pig in big vehicle)
  var vpX = width*0.32, vpY = dashY - 14*s;
  // Top of head
  ctx.beginPath(); ctx.arc(vpX, vpY, 16*s, 0, Math.PI*2);
  ctx.fillStyle = '#ff8899'; ctx.fill();
  // Floppy ears (larger in cockpit view)
  ctx.fillStyle = '#ff7788';
  ctx.beginPath(); ctx.ellipse(vpX - 20*s, vpY - 14*s, 10*s, 16*s, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(vpX + 18*s, vpY - 14*s, 10*s, 16*s, 0.4, 0, Math.PI*2); ctx.fill();
  // Inner ears
  ctx.fillStyle = '#ffaaBB';
  ctx.beginPath(); ctx.ellipse(vpX - 20*s, vpY - 13*s, 5*s, 9*s, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(vpX + 18*s, vpY - 13*s, 5*s, 9*s, 0.4, 0, Math.PI*2); ctx.fill();
  // Top of snout barely visible
  ctx.fillStyle = '#ff9999';
  ctx.beginPath(); ctx.arc(vpX + 2*s, vpY + 6*s, 5*s, 0, Math.PI*2); ctx.fill();

  // Vignette effect - darker edges around windshield view
  var vigGrad = ctx.createRadialGradient(width/2, height*0.4, height*0.3, width/2, height*0.4, height*1.1);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(0.6, 'rgba(0,0,0,0.1)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // Windshield frame / pillars
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width*0.04, 0);
  ctx.lineTo(width*0.06, dashY-18*s); ctx.lineTo(0, dashY); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(width, 0); ctx.lineTo(width-width*0.04, 0);
  ctx.lineTo(width-width*0.06, dashY-18*s); ctx.lineTo(width, dashY); ctx.closePath(); ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

var CarDraw = {
  drawFromBehind: drawFromBehind,
  drawFromSide: drawFromSide,
  drawInCar: drawInCar
};
