// road.js — OutRun-style pseudo-3D road rendering engine (ES5)

var SEGMENT_LENGTH = 200;
var ROAD_WIDTH = 2000;
var LANES = 3;
var CAMERA_HEIGHT = 1000;
var CAMERA_DEPTH = 200;
var DRAW_DISTANCE = 200;

var COLORS = {
    SKY_TOP: '#72D7EE',
    SKY_BOTTOM: '#F0F8FF',
    TREE_TRUNK: '#6B4226',
    TREE_LEAVES: ['#1a5c1a', '#2d7a2d', '#3a9a3a'],
    GRASS_LIGHT: '#8ed63f',
    GRASS_DARK: '#6abf2e',
    ROAD_LIGHT: '#6B6B6B',
    ROAD_DARK: '#696969',
    RUMBLE_LIGHT: '#ff4444',
    RUMBLE_DARK: '#ffffff',
    LANE_MARK: '#cccccc'
};

function prng(seed) {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function buildSegment(i) {
    var s = {};
    s.index = i;
    s.p1 = {x: 0, y: 0, w: 0, scale: 0};
    s.p2 = {x: 0, y: 0, w: 0, scale: 0};
    s.curve = 0;
    s.y = 0;
    s.color = {};
    s.sprites = [];
    s.collectibles = [];
    s.obstacles = [];
    return s;
}

function RoadMap() {
    this.segments = [];
    this.totalLength = 0;
    this.springs = [];
}

RoadMap.prototype.getSegment = function(worldZ) {
    var idx = Math.floor(worldZ / SEGMENT_LENGTH) % this.segments.length;
    if (idx < 0) idx += this.segments.length;
    return this.segments[idx];
};

RoadMap.prototype.project = function(camZ, camH, camD) {
    var baseSegIdx = Math.floor(camZ / SEGMENT_LENGTH) % this.segments.length;
    if (baseSegIdx < 0) baseSegIdx += this.segments.length;
    var basePercent = (camZ % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    var playerY = this.segments[baseSegIdx].y +
        (this.segments[(baseSegIdx + 1) % this.segments.length].y -
         this.segments[baseSegIdx].y) * basePercent;

    var cumulativeCurve = 0;
    var minY = Infinity;
    var prevY = playerY;

    for (var n = 0; n < DRAW_DISTANCE; n++) {
        var segIdx = (baseSegIdx + n) % this.segments.length;
        var seg = this.segments[segIdx];
        var worldZ = (seg.index * SEGMENT_LENGTH);
        if (n === 0) worldZ = camZ;

        var looped = (baseSegIdx + n) >= this.segments.length;
        var adjustedZ = worldZ - (looped ? this.totalLength : 0);

        seg.p1.x = cumulativeCurve;
        seg.p1.y = prevY;
        seg.p1.w = ROAD_WIDTH;

        var nextIdx = (segIdx + 1) % this.segments.length;
        var nextSeg = this.segments[nextIdx];
        var nextWorldZ = (nextSeg.index * SEGMENT_LENGTH);
        if (n === DRAW_DISTANCE - 1) nextWorldZ += this.totalLength;

        var dz = (nextWorldZ - adjustedZ) || SEGMENT_LENGTH;
        seg.p2.x = cumulativeCurve + seg.curve;
        seg.p2.y = nextSeg.y;
        seg.p2.w = ROAD_WIDTH;

        prevY = nextSeg.y;
        cumulativeCurve += seg.curve;

        var scale = camD / (adjustedZ - (camZ));
        if (scale <= 0) scale = 0;
        seg.p1.scale = scale;
        seg.p2.scale = (n === DRAW_DISTANCE - 1) ? 0 : camD / ((nextWorldZ - adjustedZ) || SEGMENT_LENGTH);

        var screenX = 0;
        var screenY = 0;
        var screenW = 0;

        if (seg.p1.scale > 0) {
            screenX = width / 2 + (seg.p1.x - camX) * seg.p1.scale;
            screenY = (camH - seg.p1.y) * seg.p1.scale + height / 2;
            screenW = seg.p1.w * seg.p1.scale;
        }

        seg._screenX = screenX;
        seg._screenY = screenY;
        seg._screenW = screenW;

        var projectedY = (camH - seg.y) * seg.p1.scale + height / 2;
        if (projectedY < minY) minY = projectedY;

        seg.sprites = [];
        seg.collectibles = [];
        seg.obstacles = [];

        if (n >= 2 && n <= DRAW_DISTANCE - 3 && scale > 0.005) {
            var spriteRoll = prng(segIdx * 7 + 13);
            if (spriteRoll < 0.45) {
                var types = ['tree', 'pine', 'bush', 'sunflower', 'barn', 'windmill', 'house', 'fence'];
                var sType = types[Math.floor(prng(segIdx * 31) * types.length)];
                var side = (prng(segIdx * 17) > 0.5 ? 1 : -1) * (1.2 + prng(segIdx * 41) * 3);
                seg.sprites.push({type: sType, offset: side, scale: scale});
            }

            if (spriteRoll > 0.7 && n >= 5) {
                var vTypes = ['carrot', 'cabbage', 'tomato', 'potato'];
                var vType = vTypes[Math.floor(prng(segIdx * 53) * vTypes.length)];
                var vSide = (prng(segIdx * 67) > 0.5 ? 1 : -1) * (0.4 + prng(segIdx * 73) * 0.8);
                seg.collectibles.push({type: vType, offset: vSide});
            }

            if (spriteRoll > 0.9 && n >= 10) {
                var oTypes = ['rock', 'puddle'];
                var oType = oTypes[Math.floor(prng(segIdx * 89) * oTypes.length)];
                var oSide = (prng(segIdx * 97) > 0.5 ? 1 : -1) * (0.3 + prng(segIdx * 101) * 0.6);
                seg.obstacles.push({type: oType, offset: oSide});
            }
        }

        for (var si = 0; si < seg.sprites.length; si++) {
            var spr = seg.sprites[si];
            spr.x = screenX + spr.offset * ROAD_WIDTH * seg.p1.scale * 0.5;
            spr.y = screenY;
            spr.w = 80 * scale;
            spr.h = 120 * scale;
        }

        for (var ci = 0; ci < seg.collectibles.length; ci++) {
            var col = seg.collectibles[ci];
            col.x = screenX + col.offset * ROAD_WIDTH * seg.p1.scale * 0.5;
            col.y = screenY - 20 * scale;
            col.w = 30 * scale;
            col.h = 30 * scale;
        }

        for (var oi = 0; oi < seg.obstacles.length; oi++) {
            var obs = seg.obstacles[oi];
            obs.x = screenX + obs.offset * ROAD_WIDTH * seg.p1.scale * 0.5;
            obs.y = screenY;
            obs.w = 40 * scale;
            obs.h = 25 * scale;
        }
    }

    return {horizonY: minY, baseScale: this.segments[baseSegIdx] ? this.segments[baseSegIdx].p1.scale : 0};
};

function addCurve(roadMap, curve, startSeg, endSeg) {
    roadMap.springs.push({type: 'curve', power: curve, start: startSeg, end: endSeg});
}

function addHill(roadMap, hill, startSeg, endSeg) {
    roadMap.springs.push({type: 'hill', power: hill, start: startSeg, end: endSeg});
}

function generateRoad(seed) {
    var roadMap = new RoadMap();
    var numSegments = 3000;
    roadMap.segments = [];
    for (var i = 0; i < numSegments; i++) {
        roadMap.segments.push(buildSegment(i));
    }
    roadMap.totalLength = numSegments * SEGMENT_LENGTH;

    var rng = seed || 1;
    var segPos = 0;

    while (segPos < numSegments) {
        var roll = prng(rng++);
        if (roll < 0.45) {
            var len = Math.floor(20 + prng(rng++) * 20);
            addCurve(roadMap, 0, segPos, segPos + len);
        } else if (roll < 0.75) {
            var curvePower = (prng(rng++) - 0.5) * 0.1;
            var curveLen = Math.floor(15 + prng(rng++) * 15);
            addCurve(roadMap, curvePower, segPos, segPos + curveLen);
        } else {
            var hillPower = (prng(rng++) - 0.5) * 0.04;
            var hillLen = Math.floor(10 + prng(rng++) * 10);
            addHill(roadMap, hillPower, segPos, segPos + hillLen);
        }
        segPos += Math.floor(20 + prng(rng++) * 20);
    }

    for (var j = 0; j < roadMap.segments.length; j++) {
        var totalCurve = 0;
        var totalHill = 0;
        for (var si = 0; si < roadMap.springs.length; si++) {
            var sp = roadMap.springs[si];
            if (j >= sp.start && j <= sp.end) {
                var t = (j - sp.start) / Math.max(1, (sp.end - sp.start));
                var smoothT = t * Math.PI;
                var blend = Math.sin(smoothT);
                if (sp.type === 'curve') totalCurve += sp.power * blend;
                if (sp.type === 'hill') totalHill += sp.power * blend;
            }
        }
        roadMap.segments[j].curve = totalCurve;
        roadMap.segments[j].y = totalHill * SEGMENT_LENGTH * 50;
    }

    var isLight = true;
    for (var c = 0; c < roadMap.segments.length; c++) {
        if (c % 3 === 0) isLight = !isLight;
        if (isLight) {
            roadMap.segments[c].color.road = COLORS.ROAD_LIGHT;
            roadMap.segments[c].color.grass = COLORS.GRASS_LIGHT;
            roadMap.segments[c].color.rumble = COLORS.RUMBLE_LIGHT;
            roadMap.segments[c].color.lane = COLORS.LANE_MARK;
        } else {
            roadMap.segments[c].color.road = COLORS.ROAD_DARK;
            roadMap.segments[c].color.grass = COLORS.GRASS_DARK;
            roadMap.segments[c].color.rumble = COLORS.RUMBLE_DARK;
            roadMap.segments[c].color.lane = '';
        }
    }

    return roadMap;
}

var width, height, camX, camH, camZ;

function drawSky(ctx, w, h) {
    var grad = ctx.createLinearGradient(0, 0, 0, h / 2);
    grad.addColorStop(0, COLORS.SKY_TOP);
    grad.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h / 2);

    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.15, 35, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    var cloudOffset = (camX || 0) * 0.01;
    var clouds = [{x: 0.15, y: 0.1, speed: 0.3}, {x: 0.45, y: 0.2, speed: 0.5},
                  {x: 0.7, y: 0.08, speed: 0.2}, {x: 0.85, y: 0.25, speed: 0.4}];
    for (var ci = 0; ci < clouds.length; ci++) {
        var cl = clouds[ci];
        var cx = ((cl.x * w + cloudOffset * cl.speed) % (w + 100)) - 50;
        var cy = cl.y * h;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy - 10, 30, 0, Math.PI * 2);
        ctx.arc(cx + 45, cy, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround(ctx, w, h, horizonY) {
    ctx.fillStyle = COLORS.GRASS_LIGHT;
    ctx.fillRect(0, horizonY || (h / 2), w, h - (horizonY || (h / 2)));
}

function drawSegment(ctx, baseX, baseY, baseW, depth, p1, p2, curve) {
    var x1 = baseX;
    var y1 = baseY;
    var w1 = baseW;
    var p2Scale = p2.scale || 0.001;
    var x2 = baseX + (p2.x - p1.x) * p2Scale;
    var y2 = (camH - p2.y) * p2Scale + height / 2;
    var w2 = p2.w * p2Scale;

    var grassColor = (depth % 2 === 0) ? COLORS.GRASS_LIGHT : COLORS.GRASS_DARK;
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, y2, width, y1 - y2);

    var rumbleW1 = w1 * 1.15;
    var rumbleW2 = w2 * 1.15;
    var roadCol = (depth % 2 === 0) ? COLORS.ROAD_LIGHT : COLORS.ROAD_DARK;
    var rumbleCol = (depth % 2 === 0) ? COLORS.RUMBLE_LIGHT : COLORS.RUMBLE_DARK;

    drawPoly(ctx, x1 - rumbleW1, y1, x1 + rumbleW1, y1, x2 + rumbleW2, y2, x2 - rumbleW2, y2, rumbleCol);
    drawPoly(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, roadCol);

    var laneMark = (depth % 4 < 2) ? COLORS.LANE_MARK : '';
    if (laneMark) {
        var lw1 = w1 * 0.01;
        var lw2 = w2 * 0.01;
        for (var la = -1; la <= 1; la += 2) {
            drawPoly(ctx, x1 + la * w1 * 0.33 - lw1, y1,
                     x1 + la * w1 * 0.33 + lw1, y1,
                     x2 + la * w2 * 0.33 + lw2, y2,
                     x2 + la * w2 * 0.33 - lw2, y2, laneMark);
        }
    }
}

function drawPoly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
}

function drawSprite(ctx, type, x, y, scale, time) {
    var s = Math.max(1, scale * 80);
    if (type === 'tree') {
        ctx.fillStyle = COLORS.TREE_TRUNK;
        ctx.fillRect(x - s * 0.05, y - s * 0.6, s * 0.1, s * 0.4);
        var leafCol = COLORS.TREE_LEAVES[Math.floor(Math.abs(x) % 3)];
        ctx.fillStyle = leafCol;
        ctx.beginPath();
        ctx.arc(x, y - s * 0.7, s * 0.25, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'pine') {
        ctx.fillStyle = COLORS.TREE_TRUNK;
        ctx.fillRect(x - s * 0.04, y - s * 0.4, s * 0.08, s * 0.3);
        ctx.fillStyle = '#1a6b1a';
        for (var pi = 0; pi < 3; pi++) {
            var triY = y - s * (0.4 + pi * 0.2);
            var triW = s * (0.25 - pi * 0.05);
            ctx.beginPath();
            ctx.moveTo(x, triY - s * 0.15);
            ctx.lineTo(x - triW, triY);
            ctx.lineTo(x + triW, triY);
            ctx.closePath();
            ctx.fill();
        }
    } else if (type === 'bush') {
        ctx.fillStyle = '#2d8a2d';
        ctx.beginPath();
        ctx.arc(x - s * 0.1, y - s * 0.15, s * 0.12, 0, Math.PI * 2);
        ctx.arc(x + s * 0.1, y - s * 0.12, s * 0.1, 0, Math.PI * 2);
        ctx.arc(x, y - s * 0.18, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'sunflower') {
        ctx.strokeStyle = '#3a8a3a';
        ctx.lineWidth = Math.max(1, s * 0.03);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - s * 0.4);
        ctx.stroke();
        ctx.fillStyle = '#FFA500';
        for (var pgi = 0; pgi < 8; pgi++) {
            var ga = (pgi / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(x + Math.cos(ga) * s * 0.1, y - s * 0.45 + Math.sin(ga) * s * 0.1, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#DAA520';
        ctx.beginPath();
        ctx.arc(x, y - s * 0.45, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'barn') {
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(x - s * 0.3, y - s * 0.5, s * 0.6, s * 0.4);
        ctx.beginPath();
        ctx.moveTo(x - s * 0.35, y - s * 0.5);
        ctx.lineTo(x, y - s * 0.75);
        ctx.lineTo(x + s * 0.35, y - s * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#882222';
        ctx.fillRect(x - s * 0.1, y - s * 0.3, s * 0.2, s * 0.2);
    } else if (type === 'windmill') {
        ctx.fillStyle = '#e8e8e8';
        drawPoly(ctx, x - s * 0.12, y, x + s * 0.12, y, x + s * 0.06, y - s * 0.5, x - s * 0.06, y - s * 0.5, '#e8e8e8');
        ctx.save();
        ctx.translate(x, y - s * 0.5);
        ctx.rotate(time * 2);
        for (var wi = 0; wi < 4; wi++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#cccccc';
            ctx.fillRect(-s * 0.02, -s * 0.35, s * 0.04, s * 0.35);
        }
        ctx.restore();
    } else if (type === 'house') {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x - s * 0.25, y - s * 0.35, s * 0.5, s * 0.35);
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.3, y - s * 0.35);
        ctx.lineTo(x, y - s * 0.6);
        ctx.lineTo(x + s * 0.3, y - s * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(x - s * 0.1, y - s * 0.25, s * 0.1, s * 0.1);
    } else if (type === 'fence') {
        ctx.fillStyle = '#A0824A';
        var postCount = Math.max(2, Math.floor(s / 15));
        for (var fi = 0; fi < postCount; fi++) {
            var fx = x - s * 0.3 + fi * (s * 0.6 / (postCount - 1 || 1));
            ctx.fillRect(fx - s * 0.02, y - s * 0.25, s * 0.04, s * 0.25);
        }
        ctx.fillRect(x - s * 0.3, y - s * 0.18, s * 0.6, s * 0.03);
        ctx.fillRect(x - s * 0.3, y - s * 0.08, s * 0.6, s * 0.03);
    }
}

function drawCollectible(ctx, type, x, y, scale, bobPhase) {
    var s = Math.max(25, scale * 200);
    var bob = Math.sin(bobPhase || 0) * 5 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 2, s * 0.6, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'carrot') {
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(x, y - s + bob, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(x - 3, y - s * 1.5 + bob);
        ctx.lineTo(x + 3, y - s * 1.5 + bob);
        ctx.lineTo(x, y - s * 1.1 + bob);
        ctx.fill();
    } else if (type === 'cabbage') {
        ctx.fillStyle = '#22AA22';
        ctx.beginPath();
        ctx.arc(x, y - s + bob, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#118811';
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.beginPath();
        ctx.arc(x, y - s + bob, s * 0.35, 0, Math.PI * 2);
        ctx.stroke();
    } else if (type === 'tomato') {
        ctx.fillStyle = '#FF2222';
        ctx.beginPath();
        ctx.arc(x, y - s + bob, s * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22AA22';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.4 + bob);
        ctx.lineTo(x + 5, y - s * 1.3 + bob);
        ctx.lineTo(x + 3, y - s * 1.1 + bob);
        ctx.fill();
    } else if (type === 'potato') {
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.ellipse(x, y - s + bob, s * 0.55, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawObstacle(ctx, type, x, y, scale) {
    var s = Math.max(2, scale * 20);
    if (type === 'rock') {
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(x - s * 0.5, y);
        ctx.lineTo(x - s * 0.4, y - s * 0.4);
        ctx.lineTo(x + s * 0.1, y - s * 0.6);
        ctx.lineTo(x + s * 0.5, y - s * 0.3);
        ctx.lineTo(x + s * 0.4, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = Math.max(1, s * 0.08);
        ctx.stroke();
    } else if (type === 'puddle') {
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.ellipse(x, y - s * 0.15, s * 0.5, s * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(135,206,235,0.5)';
        ctx.beginPath();
        ctx.ellipse(x - s * 0.1, y - s * 0.18, s * 0.15, s * 0.05, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderRoad(ctx, w, h, cx, cy, cz, roadMap, time) {
    width = w;
    height = h;
    camX = cx;
    camH = cy || CAMERA_HEIGHT;
    camZ = cz;

    drawSky(ctx, w, h);

    var proj = roadMap.project(camZ, camH, CAMERA_DEPTH);
    var horizonY = proj.horizonY;
    drawGround(ctx, w, h, horizonY);

    var baseSegIdx = Math.floor(camZ / SEGMENT_LENGTH) % roadMap.segments.length;
    if (baseSegIdx < 0) baseSegIdx += roadMap.segments.length;

    var minY = horizonY;
    var x = 0;
    var dx = 0;

    for (var n = DRAW_DISTANCE - 1; n > 0; n--) {
        var segIdx = (baseSegIdx + n) % roadMap.segments.length;
        var seg = roadMap.segments[segIdx];

        if (!seg._screenY && !seg.p1.scale) continue;

        x += dx;
        dx += seg.curve;

        var clipped = false;

        var baseX = w / 2 + x * (seg.p1.scale || 0.001);
        var baseY = (camH - seg.p1.y) * (seg.p1.scale || 0.001) + height / 2;

        drawSegment(ctx, baseX, baseY, seg.p1.w * (seg.p1.scale || 0.001),
                    n, seg.p1, seg.p2, seg.curve);

        if (n < DRAW_DISTANCE - 5) {
            for (var si = 0; si < seg.sprites.length; si++) {
                var spr = seg.sprites[si];
                var sprScale = seg.p1.scale;
                var sprScreenX = w / 2 + x + spr.offset * ROAD_WIDTH * 0.5 * sprScale;
                var sprScreenY = seg._screenY || (camH - seg.p1.y) * sprScale + height / 2;
                drawSprite(ctx, spr.type, sprScreenX, sprScreenY, sprScale, time);
            }

            for (var ci2 = 0; ci2 < seg.collectibles.length; ci2++) {
                var col = seg.collectibles[ci2];
                var colScale = seg.p1.scale;
                var colScreenX = w / 2 + x + col.offset * ROAD_WIDTH * 0.5 * colScale;
                var colScreenY = seg._screenY || (camH - seg.p1.y) * colScale + height / 2;
                drawCollectible(ctx, col.type, colScreenX, colScreenY, colScale, time * 3 + ci2);
            }

            for (var oi = 0; oi < seg.obstacles.length; oi++) {
                var obs = seg.obstacles[oi];
                var obsScale = seg.p1.scale;
                var obsScreenX = w / 2 + x + obs.offset * ROAD_WIDTH * 0.5 * obsScale;
                var obsScreenY = seg._screenY || (camH - seg.p1.y) * obsScale + height / 2;
                drawObstacle(ctx, obs.type, obsScreenX, obsScreenY, obsScale);
            }
        }

        if (seg._screenY && seg._screenY > minY) {
            minY = seg._screenY;
        }
    }

    return {horizonY: horizonY, baseSegmentScale: proj.baseScale};
}
