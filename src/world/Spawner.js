// Builds the world for a route: scored gates, collision hazards, and scenery.
// Entities use absolute `dist` along the route; FlightScene derives z each frame.
import { CONFIG } from '../data/config.js';

const rand = (a, b) => a + Math.random() * (b - a);
const HAZARDS = new Set(['traffic', 'bird', 'storm']);

export function isHazard(type) { return HAZARDS.has(type); }

export function buildWorld(route) {
  const D = route.distance;
  const entities = [];
  const gates = [];

  // --- Gates: evenly spaced through the cruise band, alternating offsets ---
  const gStart = D * 0.2, gEnd = D * 0.72;
  for (let i = 0; i < route.gates; i++) {
    const t = route.gates === 1 ? 0.5 : i / (route.gates - 1);
    const dist = gStart + (gEnd - gStart) * t;
    // first couple of gates sit gently near the flight path so they're easy to read
    const spread = i < 2 ? 0.35 : 0.6;
    const e = {
      type: 'gate', dist,
      x: rand(-CONFIG.lateralMax * spread, CONFIG.lateralMax * spread),
      y: CONFIG.cruiseAlt + rand(-26, 26),
      active: true, state: i === 0 ? 'next' : 'upcoming', index: i, scored: false,
    };
    entities.push(e); gates.push(e);
  }

  // --- Hazards: scale with difficulty ---
  const hazardCount = Math.round(route.difficulty * 2 + D / 2200);
  for (let i = 0; i < hazardCount; i++) {
    const type = route.weather === 'storm' && Math.random() < 0.5 ? 'storm'
      : (Math.random() < 0.5 ? 'traffic' : 'bird');
    entities.push({
      type, dist: rand(D * 0.2, D * 0.7),
      x: rand(-CONFIG.lateralMax, CONFIG.lateralMax),
      y: CONFIG.cruiseAlt + rand(-50, 50),
      r: CONFIG.hazardRadius, active: true, hit: false,
    });
  }

  // --- Scenery (no collision): clouds + distant mountains ---
  const clouds = Math.round(8 + D / 1500);
  for (let i = 0; i < clouds; i++) {
    entities.push({
      type: 'cloud', dist: rand(0, D),
      x: rand(-CONFIG.lateralMax * 2.2, CONFIG.lateralMax * 2.2),
      y: CONFIG.cruiseAlt + rand(20, 110), active: true,
    });
  }
  for (let i = 0; i < 7; i++) {
    entities.push({
      type: 'mountain', dist: rand(D * 0.1, D),
      x: rand(-CONFIG.lateralMax * 3, CONFIG.lateralMax * 3),
      y: rand(-10, 30), active: true,
    });
  }

  return { entities, gates };
}
