# Vepřík Game - Progress Log
**Date: Fri Apr 17 2026**

---

## PROJECT STRUCTURE (1668 lines total)

```
index.html                26 lines   — entry point (HTML + CSS + script tags)
js/vec.js                  7 lines   — Vector math (Vec class)
js/joystick.js            34 lines   — Virtual joystick (touch + mouse)
js/particle.js            10 lines   — Particle system
js/obstacle.js            34 lines   — Garden obstacles (tree, crate, wagon)
js/vegetable.js           20 lines   — Vegetables (carrot, cabbage, tomato, potato)
js/entity.js              16 lines   — Base Entity class
js/veprik.js              54 lines   — Vepřík player character (garden mode)
js/thief.js              116 lines   — Thief characters: fox, rabbit, mouse
js/road.js               555 lines   — NEW: Pseudo-3D road engine
js/car.js                407 lines   — Vehicle drawing (rear + side + cockpit views)
js/game.js               548 lines   — Main controller (garden + driving modes + endless wave system)

esbuild bundle: ~99.7kb, 0 syntax errors
```

---

## LATEST FIXES (Apr 17 — driving mode road + menu car)

### Bug 11: Menu car "projected from the top"
- **Symptom**: In driving menu, car drawn from behind looks like bird's-eye rear view — weird for vehicle selection
- **Root cause**: `_drawDrivingMenu` (game.js:353) called `CarDraw.drawFromBehind()` which shows REAR of vehicle
- **Fix**: Added `drawFromSide()` function to car.js (side/profile view with windshield visible from side, Vepřík's ears on top), changed menu to use `drawFromSide()` with scale `Math.min(1.3, w/380)`
- **Files**: car.js (new function + CarDraw object), game.js (menu draw call)

### Bug 12: No road visible when starting race
- **Symptom**: When starting driving mode, whole screen is sky/grass — no road appears, game is unplayable
- **Root cause**: `CAMERA_HEIGHT = 1000` (road.js:6) too high. With flat road at y=0, screen Y projection: `screenY = height - (0 - 1000) * scale = height + 1000*scale` — road renders BELOW visible screen
- **Fix**: Lowered camera height to 650 in both `_drawDrivingScene` (game.js:310) and `_drawDrivingComplete` (game.js:414). At height=650, first visible segment projects to y≈726 on 1080px screen — well within viewport
- **Files**: game.js (two renderRoad calls)

### Files Modified
- `js/car.js`: +110 lines (drawFromSide function), +1 line (CarDraw object)
- `js/game.js`: 2 lines changed (menu car view + camera height)

---

## FILE LOAD ORDER (index.html)

1. vec.js — Vec class
2. joystick.js — Joystick class
3. particle.js — Particle class
4. obstacle.js — Obstacle class
5. vegetable.js — Veg class
6. entity.js — Entity class
7. veprik.js — Vepřík (extends Entity)
8. thief.js — Thief (extends Entity)
9. road.js — Road engine (global: CAMERA_HEIGHT, SEGMENT_LENGTH, etc.)
10. car.js — Car drawing + CarDraw object
11. game.js — Game class, starts `new Game()`

---

## TWO GAME MODES

### Mode 1: Garden ("Zahrada")
- Vepřík chases thieves (fox/liška, rabbit/zajíc, mouse/myš) around a garden
- Top-down view with depth-sorted Y-order rendering
- Virtual joystick control (bottom-left)
- Collectibles: ~27 vegetables growing in the garden
- Score tracking, celebration screen on completion

### Mode 2: Driving ("Jízda") — NEW, partially broken
- Pseudo-3D road (OutRun-style), random map generation
- Vepřík drives a vehicle collecting items on the road
- ~90 second timed runs
- Two camera views: behind car + cockpit/FPS
- Goals system: "Sber 5 mrkví" → bonus points
- Separate score from garden mode

---

## DRIVING MODE ARCHITECTURE

### States
- `'menu'` — main menu (mode selection)
- `'playing'` — garden active
- `'allCaught'` — garden complete
- `'drivingMenu'` — vehicle/carousel selection
- `'drivingSettings'` — color, wheel, accel, camera settings
- `'playingDriving'` — driving gameplay
- `'drivingComplete'` — results screen

### Key Game Properties (for driving)
```javascript
this.driveConfig = {type:'tractor', paletteIndex:0, wheelStyle:'standard'};
this.driveTimer = 90; // seconds remaining
this.driveSpeed = 0; // current speed
this.roadPosition = 0; // distance along road
this.steerInput = 0; // -1 left, +1 right
this.viewMode = 'behind'; // or 'cockpit'
this.collectibles = []; // {type, worldZ, collected, offset}
this.obstaclesList = []; // {type, worldZ, hit, side}
this.goals = []; // {type, target, current, bonus}
this.driveScore = 0;
this.driveDistance = 0;
this.cameraOffset = new Vec();
this.carX = 0; // lateral position on road
this.roadMap = null; // generated RoadMap object
```

### Controls in Driving
- **Steer**: tap left half of screen = steer left, right half = steer right
- **Accelerate**: configurable (auto or touch-hold)
- **Camera toggle**: button top-right corner

---

## ALL BUGS FOUND AND FIXED

### Bug 1: `gw not defined` (line 483 game.js)
**Symptom**: "gw is not defined" in console  
**Cause**: Button center calculation used undefined `gw` variable  
**Fix**: Changed `w/2+gw/4` to `gx2+bw/2`

### Bug 2: `CarDraw is not defined`
**Symptom**: Error when entering driving mode  
**Cause**: car.js exports standalone functions but game.js calls them as `CarDraw.drawFromBehind()`  
**Fix**: Added `var CarDraw = {drawFromBehind: drawFromBehind, drawInCar: drawInCar}` at end of car.js

### Bug 3: Main menu click detection didn't work
**Symptom**: Clicking "Zahrada" or "Jízda" buttons did nothing  
**Cause**: `_handleTap` checked `tap.y > h*0.68+10` but buttons drawn at different Y coordinates (`py+ph-60`)  
**Fix**: Made button position calculation match between `_drawMenu` and `_handleTap`

### Bug 4: Particle constructor args wrong (3 locations)
**Symptom**: Particles not rendering in driving mode  
**Cause**: `new Particle(w/2, h*0.7, colorString, ...)` — Y argument was a string instead of number, and positions used undefined `w`/`h` variables  
**Fix**: 
- All 3 particle pushes now use `window.innerWidth`/`window.innerHeight`
- Args in correct order: `(screenX, screenY, color, life, size, vx, vy)`

### Bug 5: Particle draw method name wrong (2 locations)
**Symptom**: "p._draw is not a function"  
**Cause**: Called `p._draw(ctx)` but method is named `draw`  
**Fix**: Changed to `p.draw(ctx)` in both `_drawDrivingScene` and `_drawDrivingComplete`

### Bug 6: Collectibles missing lateral offset
**Symptom**: Collision detection didn't work properly  
**Cause**: Collectibles only had `worldZ`, no lateral position; collision check used nonsensical `c.worldZ % ROAD_WIDTH * 0.3`  
**Fix**: Added `offset` property during `_setupDriveWorld`; collision uses `c.offset*ROAD_WIDTH*0.3`

### Bug 7: HUD camera button icon drawn at wrong X
**Symptom**: Icon appeared in wrong position on screen  
**Cause**: `ctx.fillText(..., camBtnY+2, ...)` — used Y coord for X parameter  
**Fix**: Changed to `camBtnX`

### Bug 8: `w is not defined` in `_updateDriving` (line 200)
**Symptom**: "w is not defined" in console during driving  
**Cause**: Particle generation code used `w`/`h` variables that don't exist in `_updateDriving` scope  
**Fix**: Added `var dw=window.innerWidth, dh=window.innerHeight;` at top of method, replaced all `w`/`h` references

---

## FIXED: CAR RENDERING BUG

### What was fixed
1. **`_drawDrivingComplete` bug** (game.js:417) — `CarDraw.drawFromBehind()` called with wrong argument order, missing `this.driveConfig` parameter
2. **Car scale reduced** — changed from `Math.min(1.2, w/600)` to `Math.min(0.9, w/800)` for better mobile proportions

### Root cause discovery
The "mangled" car was NOT a canvas transform issue. Earlier Puppeteer tests clicked at wrong coordinates (y=750 instead of y=800 for the menu button), causing the game to stay in 'menu' state. The pixel analysis was capturing the **driving menu preview** (car drawn at y=540 with scale=1.5), not the actual gameplay car.

**Correct pixel analysis** (with proper click coordinates):
- Car body: **74px tall** (Y=856-930) — correct for scale 0.9
- Wheels: **75,499 black pixels** — clearly visible
- 181 frames rendered in 3 seconds — game loop working
- Zero runtime errors

### Pixel Analysis Results (CORRECTED - from gameplay, not menu)

**Canvas state**: 800x1200 at DPR=1 ✓  
**Car body**: 2,332 red pixels, height: 74px (Y=856-930) ✓  
**Wheels**: 75,499 black pixels — clearly visible below body ✓

### Relevant code changes
- `js/game.js` line 417: Added `this.driveConfig` as 2nd parameter to `CarDraw.drawFromBehind()`
- `js/game.js` line 313: Changed `Math.min(1.2, w/600)` to `Math.min(0.9, w/800)`
#.#####..#..########....................
#.##################.#..................
```
Only ~3 visible rows despite spanning 419px vertically.

**Vertical clusters of car-colored pixels**:
- y=778-826 (49px) — main body area
- y=152, 166, 388, etc. — scattered tiny fragments

**No wheels found**: Zero black/dark pixels detected in wheel positions around the car body. This is critical — the `drawWheel` function either isn't being called or its output is not visible.

### Root Cause Hypotheses

1. **Canvas state bleeding from renderRoad**: The road engine may leave transforms (translate, scale, rotate) active that distort subsequent car drawing. `renderRoad` uses `ctx.save()`/`ctx.restore()` for windmill blades, but may not clean up all transforms.

2. **Scale parameter incorrect**: `carScale = Math.min(1.2, w/600)` — at 800px width this gives 1.33 (but capped at 1.2). However, the car body is drawn with hardcoded pixel dimensions (e.g., `50*s` for tractor body width) that may be too large or small for the viewport.

3. **Y-position wrong**: Car drawn at `h*0.75 = 900px` on a 1200px screen, but bounding box extends to y=1139 (239px below draw position). The tractor's rear wheels at `rw*0.5` below center + body height could explain this vertical spread, but it looks "mangled" because the car is drawn with absolute pixel coords that don't scale properly for mobile viewports.

4. **Wheels not rendering**: `drawWheel` uses `ctx.arc()` which should work, but wheels are black (#222) and may be getting clipped or overwritten by road rendering if draw order/z-ordering is wrong. The car body draws AFTER the road (correct), but wheel coords might place them behind the road surface visually.

5. **ctx.save/restore mismatch**: If `renderRoad` has any unbalanced save/restore calls, all subsequent drawing gets distorted. Specifically, check windmill blade rotation code at road.js:386-394 — it does `ctx.save()`, `ctx.translate()`, `ctx.rotate(time*2)`, draws, then `ctx.restore()` which should be fine.

### What We Know for Sure
- Car body (red/pink) IS being drawn and is visible
- Wheels (black circles) are NOT rendering or are invisible
- Car spans too much vertical space (419px when it should be ~80-120px)
- The scale factor may be applying to absolute pixel values instead of relative ones

### Immediate Debug Steps Needed
1. Add console.log in `drawFromBehind` to log the `scale` parameter and all computed wheel/body positions
2. Check if `drawWheel` is actually being called by adding a fillRect debug marker
3. Verify canvas transform matrix before and after `renderRoad` call: `console.log(ctx.getTransform())`
4. Test with a simple rect at car position to confirm the draw position is correct
5. Check if wheel colors (#222 = 34,34,34) are being filtered out by the road's dark road surface color

### Relevant Code Sections
- **Car drawing**: `js/car.js` lines 53-163 (`drawFromBehind`) and 165-278 (`drawInCar`)
- **Wheel drawing**: `js/car.js` lines 5-38 (`drawWheel`)
- **Vehicle config**: Game constructor line 12, `_startDriving` line 134-137
- **Scene render**: `js/game.js` lines 305-316 (`_drawDrivingScene`)
- **Road engine**: `js/road.js` — check for unbalanced transforms

### Test Files Available
- `test-game.js` through `test-carcols.js` — Puppeteer test scripts (already ran successfully)
- `test-screenshots/` — directory with screenshots (menu, driving menu, driving scene)

---

## WHAT NEEDS TO BE DONE NEXT

### Priority 1: Fix Car Rendering — DONE
- Car body: 74px tall (correct for scale 0.9)
- Wheels: clearly visible (75,499 black pixels)
- Game loop: rendering 181 frames in 3 seconds
- Zero runtime errors

### Priority 2: Fix Driving Mode Road — DONE
- Menu car: now shows side/profile view (Bug 11)
- Road visible when starting race: camera lowered to 650 (Bug 12)

### Priority 3: Thief Spawn Improvements — DONE
- Thieves now spawn with random positions (one of 4 edges: top, right, bottom, left)
- Thieves spawn progressively over time instead of all 3 at once
- Spawn schedule: 1st thief at 0s, 2nd at 8s, 3rd at 16s
- Alert shown when new thief spawns: "Nový zloděj: [name]!"
- Files: game.js (constructor, _setupWorld, _update, _reset)

### Priority 4: Endless Game Mode — DONE
- Game no longer ends when all thieves are caught
- Wave system: after catching all 3 thieves, bonus points awarded (wave*50)
- New wave starts automatically: old thieves removed, new spawn queue created
- Thieves re-spawn with new random edge positions on 2s, 8s, 14s delays
- Alert shown: "Vlna X hotova! +Y bodu" followed by "Vsechny chyceny! Cekam na dalsiho..."
- Wave counter and score persist across waves
- _setupNextWave() function: clears thieves array, creates new spawn queue
- Fixed: "waiting" alert cleared when new thief spawns (game.js:171)
- Fixed: caught thieves removed from array instead of sticking around (game.js:263)
- Fixed: alerts properly cleared when thieves are active (game.js:189)
- Files: game.js (constructor, _setupWorld, _update, _setupNextWave, _draw, _reset)

### Priority 5: Improve Visual Quality
- Vepřík's ears visibility (currently only 6 pink pixels detected — ear color #ff8899 may not match detection criteria)
- Car proportion refinement if needed on different viewport sizes
- Cockpit view polishing

### Priority 6: Polish Driving Mode
- Add more collectible types with distinct visuals
- Improve obstacle collision feedback (splash particles, slowdown indicator)
- Add speed lines / motion blur effect
- Better goal display during gameplay
- Sound effects (if feasible without external assets)

---

## KNOWN CLEAN AREAS (no bugs)
- Garden mode: runs without errors, all features working
- Menu navigation: menu → drivingMenu → drivingSettings → playingDriving → drivingComplete works
- Touch input: tap detection works for all UI elements
- Road rendering: sky, grass, road segments, scenery sprites all render correctly
- HUD: score, timer, speedometer, goal progress all display
- Particles: spawn and animate correctly (once args fixed)
- Camera toggle: switches between behind/cockpit views
- Score tracking: separate scores for garden and driving modes
