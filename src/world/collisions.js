// Frame-rate-independent crossing checks: when the aircraft passes an entity's
// distance this frame, test lateral + vertical proximity. Used for gate scoring
// and hazard hits.
import { CONFIG } from '../data/config.js';
import { isHazard } from './Spawner.js';

export function processCrossings(world, plane, prevDist, planeDist) {
  const events = { gates: [], hazards: [] };
  for (const e of world.entities) {
    if (!e.active || e.scored || e.hit) continue;
    if (prevDist < e.dist && e.dist <= planeDist) {
      const dl = Math.abs(e.x - plane.x);
      const dv = Math.abs(e.y - plane.altitude);
      if (e.type === 'gate') {
        const passed = dl <= CONFIG.gateHalfWidth && dv <= CONFIG.gateHalfHeight;
        e.scored = true;
        e.state = passed ? 'done' : 'miss';
        events.gates.push({ gate: e, passed });
      } else if (isHazard(e.type) && dl <= e.r && dv <= e.r) {
        e.hit = true;
        events.hazards.push(e);
      }
    }
  }
  return events;
}

// Promote the earliest un-scored gate to the 'next' highlight.
export function advanceNextGate(gates) {
  let found = false;
  for (const g of gates) {
    if (!g.scored && !found) { g.state = 'next'; found = true; }
    else if (!g.scored) g.state = 'upcoming';
  }
}
