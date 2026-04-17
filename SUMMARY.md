# Vepřík a Zlodějů — Garden Chase Game

A mobile/tablet game based on the Czech children's book "Čtení o vepříkovi a kůzleti" by Božena Benešová.

**Live demo:** https://vpavlin.github.io/veprik-game/

## What it is

Player controls Vepřík (a little pig) in a garden chase mode. Thieves (fox, rabbit, mouse) spawn from screen edges and steal vegetables. Catch them all to complete each wave.

## Tech

- Single HTML file, vanilla ES5 JavaScript, Canvas 2D
- Responsive viewport with devicePixelRatio support
- Virtual joystick for mobile touch + mouse input
- No frameworks, no build tools

## File structure

```
index.html          — entry point (HTML + CSS + script tags)
js/
  vec.js            — Vec vector math class
  joystick.js       — Virtual joystick input handler
  particle.js       — Particle system
  obstacle.js       — Garden obstacles (tree, crate, wagon)
  vegetable.js      — Vegetables (carrot, cabbage, tomato, potato)
  entity.js         — Base Entity class
  veprik.js         — Vepřík (player pig) character
  thief.js          — Thief characters: fox, rabbit, mouse
  game.js           — Main game controller
```

## Game features

- 3 thief types with unique AI behaviors (fox chases directly, rabbit runs away, mouse hides)
- 4 vegetable types at 27 spawn locations
- 10 obstacles that block movement
- Wave-based progression with increasing difficulty
- Score tracking + wave bonuses
- Off-screen red arrow indicators for thieves
- Catch celebration particles
- Ambient garden sparkles
- HUD with score, progress bar, alerts

## Controls

Virtual joystick on bottom-left. Drag to move Vepřík into thieves.
