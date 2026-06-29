// Global tunables. All gameplay constants live here so balancing is one-file work.
// Units note: distance/speed are in abstract "world units"; altitude (`alt`) is a
// compact 0..~220 band tuned so the projected ground/objects stay on-screen.

export const CONFIG = {
  // --- Pseudo-3D camera / projection ---
  focalLength: 320,        // larger = flatter lens; smaller = more dramatic perspective
  horizonFrac: 0.46,       // base horizon position as a fraction of screen height
  viewDistance: 760,       // max z (distance ahead) that objects render at
  despawnMargin: 60,       // cull objects once z drops below -this
  pitchPixels: 150,        // how many px the horizon shifts per unit of normalized pitch
  rollMax: 0.62,           // max visual world-roll (radians) at full bank

  // --- Loop ---
  maxDt: 1 / 30,           // clamp delta time to survive stalls
  physicsStep: 1 / 120,    // fixed sub-step for the flight model

  // --- Flight feel (shared; per-aircraft values override magnitudes) ---
  cruiseAlt: 150,          // target altitude band centre during cruise
  groundAlt: 0,            // touchdown altitude
  altMax: 220,             // ceiling of the altitude band
  lateralMax: 130,         // how far left/right the plane can stray from centreline
  bankToTurn: 0.85,        // sin(bank) * speed * this = lateral velocity
  pitchResponse: 2.4,      // how quickly vertical speed eases toward target
  gravityWhenStalled: 28,  // sink rate (alt/sec) when out of fuel / stalled

  // --- Phases (fractions of route distance) ---
  takeoffAlt: 60,          // climb above this to leave the takeoff roll
  approachFrac: 0.78,      // begin descent/approach at this fraction of the route
  rotateSpeedFrac: 0.42,   // fraction of maxSpeed needed before the nose lifts

  // --- Gates & hazards ---
  gateHalfWidth: 32,       // lateral tolerance to "pass" a gate cleanly
  gateHalfHeight: 42,      // vertical tolerance to pass a gate
  hazardRadius: 22,        // collision radius for traffic/weather
  hazardDamage: 0.18,      // hull integrity lost per hazard hit (0..1)

  // --- Economy ---
  startingCash: 2500,
  fuelPricePerUnit: 3,     // cost subtracted from payout per fuel unit burned
  gateBonus: 60,           // cash per clean gate
  hullRepairCost: 800,     // flat repair if you land damaged

  // --- Misc ---
  hudColor: '#eaf2ff',
};

export const GRADE = {
  PERFECT: { key: 'PERFECT', label: 'Perfect Landing', mult: 1.3, color: '#5ef2a8' },
  GOOD:    { key: 'GOOD',    label: 'Good Landing',    mult: 1.0, color: '#9fe0ff' },
  HARD:    { key: 'HARD',    label: 'Hard Landing',    mult: 0.55, color: '#ffd166' },
  CRASH:   { key: 'CRASH',   label: 'Crashed',         mult: 0.0, color: '#ff6b6b' },
};
