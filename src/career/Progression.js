// License gating, aircraft availability, and route unlocks — all derived from
// the saved profile (no extra unlock lists to keep in sync).
import { LICENSES, getLicense, licenseOrder } from '../data/licenses.js';
import { ROUTES, getRoute } from '../data/routes.js';
import { AIRCRAFT, getAircraft } from '../data/aircraft.js';

const GRADE_RANK = { CRASH: 0, HARD: 1, GOOD: 2, PERFECT: 3 };

export function bestGrade(a, b) {
  if (!a) return b; if (!b) return a;
  return (GRADE_RANK[a] >= GRADE_RANK[b]) ? a : b;
}

export function unlockedTier(profile) {
  return getLicense(profile.currentLicense)?.unlocksTier ?? 1;
}

export function ownedAircraft(profile) {
  return profile.ownedAircraft.map(getAircraft).filter(Boolean);
}

export function isOwned(profile, id) { return profile.ownedAircraft.includes(id); }

export function isBuyable(profile, ac) {
  return !isOwned(profile, ac.id) && ac.tier <= unlockedTier(profile);
}

// Contracts the current license permits (excludes check-rides).
export function availableContracts(profile) {
  const curOrder = licenseOrder(profile.currentLicense);
  return ROUTES
    .filter(r => !r.checkRide && licenseOrder(r.requiredLicense) <= curOrder)
    .sort((a, b) => a.requiredTier - b.requiredTier || a.distance - b.distance);
}

// Does the active aircraft meet the route's tier requirement?
export function aircraftMeetsRoute(profile, route) {
  const ac = getAircraft(profile.activeAircraft);
  return ac && ac.tier >= route.requiredTier;
}

// The next license up from the current one, or null at the top.
export function nextLicense(profile) {
  const curOrder = licenseOrder(profile.currentLicense);
  return LICENSES.find(l => l.order === curOrder + 1) || null;
}

// Progress toward the next license.
export function licenseProgress(profile) {
  const next = nextLicense(profile);
  if (!next) return { next: null, maxed: true };
  const req = next.requires;
  const meetsHours = profile.flightHours >= req.hours;
  const meetsCash = profile.cash >= req.cash;
  return {
    next,
    req,
    meetsHours,
    meetsCash,
    canAttempt: meetsHours && meetsCash,
    checkRoute: next.checkRide ? getRoute(next.checkRide.routeId) : null,
  };
}

// Promote on a passed check-ride: deduct the fee, advance the license.
export function promote(profile, license) {
  profile.cash -= license.requires.cash;
  profile.currentLicense = license.id;
  profile.passedCheckRides[license.id] = true;
}

export { LICENSES, AIRCRAFT, getAircraft, getRoute };
