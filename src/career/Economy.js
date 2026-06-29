// Pure economic functions: mission payout and purchase costs.
import { CONFIG, GRADE } from '../data/config.js';

// Compute the result of a finished flight.
//   route, aircraft: data objects
//   outcome: { gradeKey, gatesHit, gatesTotal, fuelUsed, hullDamage, hours }
export function settleFlight(route, aircraft, outcome) {
  const grade = GRADE[outcome.gradeKey] || GRADE.CRASH;
  const base = route.baseReward;
  const landingPay = Math.round(base * grade.mult);
  const gatePay = outcome.gatesHit * CONFIG.gateBonus;
  const fuelCost = Math.round(outcome.fuelUsed * CONFIG.fuelPricePerUnit);
  const repairCost = outcome.hullDamage > 0.01 ? Math.round(CONFIG.hullRepairCost * outcome.hullDamage) : 0;

  const gross = landingPay + gatePay;
  const net = Math.max(0, gross - fuelCost - repairCost);
  const xp = Math.round(route.distance / 100 + outcome.gatesHit * 5 + grade.mult * 30);

  return {
    grade,
    landingPay,
    gatePay,
    fuelCost,
    repairCost,
    gross,
    net,
    xp,
    crashed: outcome.gradeKey === 'CRASH',
  };
}

export const canAfford = (profile, cost) => profile.cash >= cost;
