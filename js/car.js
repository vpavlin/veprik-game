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
    // Big rear wheels (from behind, at bottom)
    var rw = 28 * s;
    drawWheel(ctx, -rw*1.2, rw*0.2, rw*1.1, wheelStyle, 0);
    drawWheel(ctx, rw*1.2, rw*0.2, rw*1.1, wheelStyle, 0);
    // Rear body panel
    var bw = 54*s, rh = 30*s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw/2, -rh/2, bw, rh, 4*s); ctx.fill();
    // Rear panel details - horizontal ribs
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1.5*s;
    for (var ri = 0; ri < 3; ri++) {
      ctx.beginPath();
      ctx.moveTo(-bw*0.4, -rh*0.3 + ri*rh*0.3);
      ctx.lineTo(bw*0.4, -rh*0.3 + ri*rh*0.3);
      ctx.stroke();
    }
    // Taillights (red, on left and right of rear)
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(-bw*0.38, 0, 5*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bw*0.38, 0, 5*s, 0, Math.PI*2); ctx.fill();
    // Taillight glow
    ctx.fillStyle = 'rgba(255,100,50,0.3)';
    ctx.beginPath(); ctx.arc(-bw*0.38, 0, 8*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bw*0.38, 0, 8*s, 0, Math.PI*2); ctx.fill();
    // License plate
    ctx.fillStyle = '#ffffcc'; ctx.fillRect(-bw*0.12, -rh*0.1, bw*0.24, rh*0.25);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-bw*0.12, -rh*0.1, bw*0.24, rh*0.25);
    // Exhaust pipes (top)
    ctx.fillStyle = '#666';
    ctx.fillRect(-bw*0.3, -rh*1.8, 5*s, rh*0.8);
    ctx.fillRect(bw*0.2, -rh*2.0, 5*s, rh*0.9);
    // Exhaust smoke
    ctx.fillStyle = 'rgba(150,150,150,0.3)';
    ctx.beginPath(); ctx.arc(-bw*0.28, -rh*2.2, 6*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-bw*0.25, -rh*2.6, 8*s, 0, Math.PI*2); ctx.fill();
    // Cab (visible above rear body from behind going uphill, or just below)
    ctx.fillStyle = p.accent; roundRect(ctx, -bw*0.42, -rh*1.5, bw*0.84, rh*1.4, 4*s); ctx.fill();
    // Rear window of cab
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-bw*0.35, -rh*1.3, bw*0.7, rh*0.5);
    // Vepřík ears peeking from cab
    drawVepriksEars(ctx, -2*s, -rh*1.35, 3.5*s);
    // Small front wheels (barely visible from behind)
    var fw = 16 * s;
    drawWheel(ctx, -fw*1.3, -fw*1.4, fw, wheelStyle, 0);
    drawWheel(ctx, fw*1.3, -fw*1.4, fw, wheelStyle, 0);

  } else if (type === CAR_TYPES.RACING) {
    // Rear wheels
    var rw2 = 14*s;
    drawWheel(ctx, -rw2*1.6, rw2*0.8, rw2*1.1, wheelStyle, 0);
    drawWheel(ctx, rw2*1.6, rw2*0.8, rw2*1.1, wheelStyle, 0);
    // Rear body - wide and low
    var rw3 = 58*s, rh2 = 22*s;
    ctx.fillStyle = p.body; roundRect(ctx, -rw3/2, -rh2/2, rw3, rh2, 6*s); ctx.fill();
    // Center diffuser
    ctx.fillStyle = p.detail; ctx.fillRect(-rw3*0.15, rh2*0.2, rw3*0.3, rh2*0.3);
    // Rear spoiler (big, at the back - bottom of screen)
    ctx.fillStyle = p.detail;
    ctx.fillRect(-rw3*0.5, rh2*0.15, rw3, 7*s);
    // Spoiler supports
    ctx.fillRect(-rw3*0.38, rh2*0.05, 5*s, 12*s);
    ctx.fillRect(rw3*0.38-5*s, rh2*0.05, 5*s, 12*s);
    // Taillights (full-width LED strip style)
    ctx.fillStyle = '#ff1111';
    ctx.fillRect(-rw3*0.42, -rh2*0.15, rw3*0.15, rh2*0.4);
    ctx.fillRect(rw3*0.27, -rh2*0.15, rw3*0.15, rh2*0.4);
    // Taillight glow
    ctx.fillStyle = 'rgba(255,50,50,0.35)';
    ctx.fillRect(-rw3*0.46, -rh2*0.2, rw3*0.22, rh2*0.5);
    ctx.fillRect(rw3*0.23, -rh2*0.2, rw3*0.22, rh2*0.5);
    // Exhaust pipes (center dual)
    ctx.fillStyle = '#444';
    ctx.beginPath(); ctx.arc(-rw3*0.08, rh2*0.3, 4*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rw3*0.08, rh2*0.3, 4*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(-rw3*0.08, rh2*0.3, 2*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(rw3*0.08, rh2*0.3, 2*s, 0, Math.PI*2); ctx.fill();
    // Rear window
    ctx.fillStyle = '#6699bb'; ctx.beginPath();
    ctx.moveTo(-rw3*0.22, -rh2*0.1); ctx.lineTo(rw3*0.22, -rh2*0.1);
    ctx.lineTo(rw3*0.15, -rh2*0.55); ctx.lineTo(-rw3*0.15, -rh2*0.55);
    ctx.closePath(); ctx.fill();
    // Vepřík visible through rear window
    drawVepriksEars(ctx, 0, -rh2*0.35, 3*s);
    // Small front wheels (barely visible from behind)
    var fw2 = 12*s;
    drawWheel(ctx, -fw2*1.4, -fw2*1.3, fw2, wheelStyle, 0);
    drawWheel(ctx, fw2*1.4, -fw2*1.3, fw2, wheelStyle, 0);

  } else if (type === CAR_TYPES.TRUCK) {
    // Rear wheels (dual wheels)
    var rw4 = 16*s;
    drawWheel(ctx, -rw4*1.3, rw4*0.2, rw4, wheelStyle, 0);
    drawWheel(ctx, -rw4*1.3, rw4*1.6, rw4, wheelStyle, 0);
    drawWheel(ctx, rw4*1.3, rw4*0.2, rw4, wheelStyle, 0);
    drawWheel(ctx, rw4*1.3, rw4*1.6, rw4, wheelStyle, 0);
    // Cargo bed rear panel
    var tw = 40*s, th = 34*s;
    ctx.fillStyle = p.accent; roundRect(ctx, -tw/2, -th/2, tw, th, 3*s); ctx.fill();
    // Cargo bed door lines
    ctx.strokeStyle = p.detail; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(-tw/2, 0); ctx.lineTo(tw/2, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -th/2); ctx.lineTo(0, th/2); ctx.stroke();
    // Bumper
    ctx.fillStyle = '#555'; ctx.fillRect(-tw*0.55, th*0.35, tw*1.1, 6*s);
    // Taillights
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(-tw*0.48, -th*0.35, 6*s, 10*s);
    ctx.fillRect(tw*0.42, -th*0.35, 6*s, 10*s);
    // Taillight glow
    ctx.fillStyle = 'rgba(255,80,50,0.3)';
    ctx.fillRect(-tw*0.52, -th*0.38, 10*s, 14*s);
    ctx.fillRect(tw*0.38, -th*0.38, 10*s, 14*s);
    // License plate
    ctx.fillStyle = '#ffffcc'; ctx.fillRect(-tw*0.12, th*0.42, tw*0.24, 8*s);
    // Cab (visible above/behind cargo from distance)
    ctx.fillStyle = p.body; roundRect(ctx, -tw*0.42, -th*2.2, tw*0.84, th*1.6, 4*s); ctx.fill();
    // Cab rear window
    ctx.fillStyle = '#88bbdd'; ctx.fillRect(-tw*0.32, -th*2.0, tw*0.64, th*0.5);
    // Vepřík ears
    drawVepriksEars(ctx, 0, -th*1.75, 3*s);
    // Small front wheels
    var fw3 = 14*s;
    drawWheel(ctx, -fw3*1.2, -fw3*1.5, fw3, wheelStyle, 0);
    drawWheel(ctx, fw3*1.2, -fw3*1.5, fw3, wheelStyle, 0);

  } else if (type === CAR_TYPES.BUS) {
    // Rear wheels
    var rw5 = 18*s;
    drawWheel(ctx, -rw5*1.3, rw5*0.3, rw5, wheelStyle, 0);
    drawWheel(ctx, rw5*1.3, rw5*0.3, rw5, wheelStyle, 0);
    // Rear body
    var bw2 = 54*s, rh3 = 38*s;
    ctx.fillStyle = p.body; roundRect(ctx, -bw2/2, -rh3/2, bw2, rh3, 8*s); ctx.fill();
    // Rear window
    ctx.fillStyle = '#77aacc'; ctx.beginPath();
    ctx.moveTo(-bw2*0.38, -rh3*0.4); ctx.lineTo(bw2*0.38, -rh3*0.4);
    ctx.lineTo(bw2*0.33, -rh3*0.75); ctx.lineTo(-bw2*0.33, -rh3*0.75);
    ctx.closePath(); ctx.fill();
    // Window frame
    ctx.strokeStyle = p.detail; ctx.lineWidth = 2*s;
    ctx.beginPath();
    ctx.moveTo(-bw2*0.38, -rh3*0.4); ctx.lineTo(bw2*0.38, -rh3*0.4);
    ctx.lineTo(bw2*0.33, -rh3*0.75); ctx.lineTo(-bw2*0.33, -rh3*0.75);
    ctx.closePath(); ctx.stroke();
    // Vepřík ears visible through rear window
    drawVepriksEars(ctx, 0, -rh3*0.55, 3.5*s);
    // Destination sign
    ctx.fillStyle = '#222'; ctx.fillRect(-bw2*0.3, -rh3*0.85, bw2*0.6, 10*s);
    ctx.fillStyle = '#ffcc44'; ctx.font = (8*s)+'px sans-serif'; ctx.textAlign='center';
    ctx.fillText('VEPÍK', 0, -rh3*0.77);
    // Taillights
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(-bw2*0.36, -rh3*0.15, 6*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bw2*0.36, -rh3*0.15, 6*s, 0, Math.PI*2); ctx.fill();
    // Taillight glow
    ctx.fillStyle = 'rgba(255,60,50,0.3)';
    ctx.beginPath(); ctx.arc(-bw2*0.36, -rh3*0.15, 10*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bw2*0.36, -rh3*0.15, 10*s, 0, Math.PI*2); ctx.fill();
    // Bumper
    ctx.fillStyle = '#555'; ctx.fillRect(-bw2*0.45, rh3*0.35, bw2*0.9, 7*s);
    // License plate
    ctx.fillStyle = '#ffffcc'; ctx.fillRect(-bw2*0.1, rh3*0.15, bw2*0.2, 10*s);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.strokeRect(-bw2*0.1, rh3*0.15, bw2*0.2, 10*s);
    // Small front wheels
    var fw4 = 16*s;
    drawWheel(ctx, -fw4*1.2, -fw4*1.3, fw4, wheelStyle, 0);
    drawWheel(ctx, fw4*1.2, -fw4*1.3, fw4, wheelStyle, 0);
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

  // Dashboard - dark rectangle across bottom ~30% with curved top edge
  var dashY = height * 0.7;
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.moveTo(0, dashY);
  ctx.quadraticCurveTo(width*0.5, dashY - 18*s, width, dashY);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
  ctx.fill();

  // Dashboard surface highlight
  ctx.fillStyle = 'rgba(60,60,60,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, dashY + 2*s);
  ctx.quadraticCurveTo(width*0.5, dashY - 16*s, width, dashY + 2*s);
  ctx.lineTo(width, dashY + 8*s);
  ctx.quadraticCurveTo(width*0.5, dashY - 10*s, 0, dashY + 8*s);
  ctx.closePath(); ctx.fill();

  // Dashboard detail line
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, dashY + 4*s);
  ctx.quadraticCurveTo(width*0.5, dashY - 14*s, width, dashY + 4*s);
  ctx.stroke();

  // Glove box
  ctx.fillStyle = '#333'; ctx.fillRect(width*0.6, dashY + 10*s, width*0.25, 30*s);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
  ctx.strokeRect(width*0.6, dashY + 10*s, width*0.25, 30*s);
  ctx.font = (8*s)+'px sans-serif'; ctx.fillStyle = '#555'; ctx.textAlign = 'center';
  ctx.fillText('VEPÍK', width*0.725, dashY + 28*s);

  // Speed gauge
  var gx = width*0.28, gy = dashY + height*0.22, gr = 30*s;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI*0.75, Math.PI*2.25); ctx.stroke();
  // Speed numbers
  ctx.fillStyle = '#666'; ctx.font = (7*s)+'px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('0', gx - gr*0.6, gy + gr*0.5);
  ctx.fillText('120', gx + gr*0.5, gy + gr*0.5);
  ctx.fillText('60', gx, gy - gr*0.7);
  // Needle (pointing to random speed based on game state)
  var speedFrac = 0.3 + Math.abs(steerAngle)*0.5;
  var needleAngle2 = Math.PI*1.0 + speedFrac * Math.PI * 1.1;
  ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(needleAngle2)*gr*0.75, gy + Math.sin(needleAngle2)*gr*0.75);
  ctx.stroke();
  // Center dot
  ctx.beginPath(); ctx.arc(gx, gy, 3*s, 0, Math.PI*2);
  ctx.fillStyle = '#888'; ctx.fill();

  // Fuel bar
  var fx = width*0.62, fy = dashY + height*0.22;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(fx, fy, 22*s, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#333'; ctx.fillRect(fx-18*s, fy-6*s, 36*s, 12*s);
  ctx.fillStyle = '#44cc44'; ctx.fillRect(fx-17*s, fy-5*s, 24*s, 10*s);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.strokeRect(fx-18*s, fy-6*s, 36*s, 12*s);
  ctx.font = (7*s)+'px sans-serif'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
  ctx.fillText('FUEL', fx, fy + 18*s);

  // Steering wheel - rotates with steerAngle
  var swCX = width*0.5, swCY = dashY + height*0.38, swR = 60*s;
  ctx.save();
  ctx.translate(swCX, swCY);
  ctx.rotate(steerAngle * 1.5);
  // Outer rim
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 10*s;
  ctx.beginPath(); ctx.arc(0, 0, swR, 0, Math.PI*2); ctx.stroke();
  // Inner grip texture
  ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 7*s;
  ctx.beginPath(); ctx.arc(0, 0, swR, 0, Math.PI*2); ctx.stroke();
  // Grip bumps
  for (var gb = 0; gb < 12; gb++) {
    var ga = (gb / 12) * Math.PI * 2;
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(Math.cos(ga)*swR, Math.sin(ga)*swR, 2*s, 0, Math.PI*2);
    ctx.fill();
  }
  // Spokes
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 6*s;
  for (var si = 0; si < 3; si++) {
    var sa = (si / 3) * Math.PI * 2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sa)*swR*0.88, Math.sin(sa)*swR*0.88);
    ctx.stroke();
  }
  // Center hub
  ctx.beginPath(); ctx.arc(0, 0, swR*0.35, 0, Math.PI*2);
  ctx.fillStyle = '#333'; ctx.fill();
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.stroke();
  // Horn button
  ctx.beginPath(); ctx.arc(0, 0, swR*0.2, 0, Math.PI*2);
  ctx.fillStyle = '#444'; ctx.fill();
  // Vepřík logo on horn
  ctx.beginPath(); ctx.arc(0, 0, swR*0.1, 0, Math.PI*2);
  ctx.fillStyle = '#ff8899'; ctx.fill();
  ctx.restore();

  // Side mirrors with road reflection (drawn over road)
  var mh = 34*s, mw = 26*s;
  // Mirror housings
  ctx.fillStyle = '#222';
  roundRect(ctx, 2*s, height*0.22, mw+4*s, mh+4*s, 5*s); ctx.fill();
  roundRect(ctx, width-mw-6*s, height*0.22, mw+4*s, mh+4*s, 5*s); ctx.fill();
  // Mirror glass (shows simplified road colors - shifted based on steer)
  var mirrorOffset = steerAngle * 15 * s;
  ctx.fillStyle = '#7799bb';
  ctx.fillRect(4*s, height*0.22+2*s, mw, mh*0.4);
  ctx.fillStyle = '#666';
  ctx.fillRect(4*s, height*0.22+mh*0.4+2*s, mw, mh*0.55);
  ctx.fillStyle = '#88aa44';
  ctx.fillRect(4*s, height*0.22+mh*0.9+2*s, mw, mh*0.08);
  // Right mirror
  ctx.fillStyle = '#7799bb';
  ctx.fillRect(width-mw+4*s, height*0.22+2*s, mw, mh*0.4);
  ctx.fillStyle = '#666';
  ctx.fillRect(width-mw+4*s, height*0.22+mh*0.4+2*s, mw, mh*0.55);
  ctx.fillStyle = '#88aa44';
  ctx.fillRect(width-mw+4*s, height*0.22+mh*0.9+2*s, mw, mh*0.08);
  // Mirror glass border
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
  ctx.strokeRect(4*s, height*0.22+2*s, mw, mh);
  ctx.strokeRect(width-mw+4*s, height*0.22+2*s, mw, mh);

  // Vepřík - head and ears peeking over dash on LEFT side
  var vpX = width*0.3, vpY = dashY - 12*s;
  // Head
  ctx.beginPath(); ctx.arc(vpX, vpY, 18*s, 0, Math.PI*2);
  ctx.fillStyle = '#ff8899'; ctx.fill();
  ctx.strokeStyle = '#ee7788'; ctx.lineWidth = 1.5*s; ctx.stroke();
  // Floppy ears
  ctx.fillStyle = '#ff7788';
  ctx.beginPath(); ctx.ellipse(vpX - 22*s, vpY - 16*s, 11*s, 18*s, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(vpX + 20*s, vpY - 16*s, 11*s, 18*s, 0.4, 0, Math.PI*2); ctx.fill();
  // Inner ears
  ctx.fillStyle = '#ffaaBB';
  ctx.beginPath(); ctx.ellipse(vpX - 22*s, vpY - 15*s, 6*s, 10*s, -0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(vpX + 20*s, vpY - 15*s, 6*s, 10*s, 0.4, 0, Math.PI*2); ctx.fill();
  // Snout
  ctx.fillStyle = '#ff9999';
  ctx.beginPath(); ctx.ellipse(vpX + 3*s, vpY + 5*s, 7*s, 5*s, 0, 0, Math.PI*2); ctx.fill();
  // Nostrils
  ctx.fillStyle = '#ee8888';
  ctx.beginPath(); ctx.arc(vpX, vpY + 5*s, 1.5*s, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(vpX + 5*s, vpY + 5*s, 1.5*s, 0, Math.PI*2); ctx.fill();

  // Windshield frame / pillars
  ctx.fillStyle = '#1a1a1a';
  // Left pillar (A-pillar)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width*0.05, 0);
  ctx.lineTo(width*0.07, dashY-18*s); ctx.lineTo(0, dashY); ctx.closePath(); ctx.fill();
  // Right pillar (A-pillar)
  ctx.beginPath(); ctx.moveTo(width, 0); ctx.lineTo(width-width*0.05, 0);
  ctx.lineTo(width-width*0.07, dashY-18*s); ctx.lineTo(width, dashY); ctx.closePath(); ctx.fill();
  // Top frame (visor area)
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, width, 6*s);
  // Sun visor left
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 6*s, width*0.15, 4*s);
  // Sun visor right
  ctx.fillRect(width-width*0.15, 6*s, width*0.15, 4*s);

  // Vignette - darker edges around windshield
  var vigGrad = ctx.createRadialGradient(width/2, height*0.35, height*0.25, width/2, height*0.35, height*1.0);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.08)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // Windshield glare
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.moveTo(width*0.1, 0); ctx.lineTo(width*0.4, 0);
  ctx.lineTo(width*0.35, dashY*0.6); ctx.lineTo(width*0.05, dashY*0.6);
  ctx.closePath(); ctx.fill();
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
