// Contracts/routes. `requiredLicense` gates availability; `requiredTier` is the
// minimum aircraft tier the leg expects. `landingTol` scales landing tolerance
// (lower = stricter). `weather`: 'clear' | 'wind' | 'storm'. `checkRide` routes
// are the qualifying flights that promote you to the next license.

export const ROUTES = [
  // --- Student (tier 1) ---
  {
    id: 'r_bayhop', name: 'Bay Hop', from: 'SFO', to: 'SJC',
    requiredLicense: 'student', requiredTier: 1,
    distance: 1500, baseReward: 900, difficulty: 0, weather: 'clear',
    gates: 4, landingTol: 1.35,
  },
  {
    id: 'r_coast', name: 'Coastal Run', from: 'SJC', to: 'MRY',
    requiredLicense: 'student', requiredTier: 1,
    distance: 2100, baseReward: 1400, difficulty: 1, weather: 'clear',
    gates: 5, landingTol: 1.2,
  },
  // --- PPL (tier 2) ---
  {
    id: 'r_valley', name: 'Valley Crossing', from: 'MRY', to: 'FAT',
    requiredLicense: 'ppl', requiredTier: 2,
    distance: 2800, baseReward: 2600, difficulty: 1, weather: 'wind',
    gates: 6, landingTol: 1.0,
  },
  {
    id: 'r_ridge', name: 'Ridge Line', from: 'FAT', to: 'BFL',
    requiredLicense: 'ppl', requiredTier: 2,
    distance: 3200, baseReward: 3200, difficulty: 2, weather: 'clear',
    gates: 6, landingTol: 1.0,
  },
  // --- CPL (tier 3) ---
  {
    id: 'r_cargo', name: 'Cargo Express', from: 'BFL', to: 'LAX',
    requiredLicense: 'cpl', requiredTier: 3,
    distance: 4200, baseReward: 6800, difficulty: 2, weather: 'wind',
    gates: 7, landingTol: 0.92,
  },
  {
    id: 'r_desert', name: 'Desert Charter', from: 'LAX', to: 'LAS',
    requiredLicense: 'cpl', requiredTier: 3,
    distance: 4800, baseReward: 8200, difficulty: 3, weather: 'storm',
    gates: 7, landingTol: 0.85,
  },
  // --- IR / regional jet (tier 4) ---
  {
    id: 'r_redeye', name: 'Red-Eye Regional', from: 'LAS', to: 'PHX',
    requiredLicense: 'ir', requiredTier: 4,
    distance: 5600, baseReward: 13500, difficulty: 3, weather: 'storm',
    gates: 8, landingTol: 0.82,
  },
  // --- ATPL / airliner (tier 5) ---
  {
    id: 'r_transcon', name: 'Transcon Hop', from: 'PHX', to: 'DEN',
    requiredLicense: 'atpl', requiredTier: 5,
    distance: 6800, baseReward: 24000, difficulty: 3, weather: 'wind',
    gates: 9, landingTol: 0.8,
  },

  // --- Check-rides (qualifying flights, tougher; reward is modest) ---
  {
    id: 'cr_ppl', name: 'PPL Check-Ride', from: 'SJC', to: 'SJC',
    requiredLicense: 'student', requiredTier: 1,
    distance: 2400, baseReward: 600, difficulty: 1, weather: 'wind',
    gates: 6, landingTol: 0.95, checkRide: true,
  },
  {
    id: 'cr_cpl', name: 'CPL Check-Ride', from: 'FAT', to: 'FAT',
    requiredLicense: 'ppl', requiredTier: 2,
    distance: 3400, baseReward: 1200, difficulty: 2, weather: 'wind',
    gates: 7, landingTol: 0.82, checkRide: true,
  },
  {
    id: 'cr_ir', name: 'Instrument Check-Ride', from: 'LAX', to: 'LAX',
    requiredLicense: 'cpl', requiredTier: 3,
    distance: 4400, baseReward: 2400, difficulty: 3, weather: 'storm',
    gates: 8, landingTol: 0.68, checkRide: true,
  },
  {
    id: 'cr_atpl', name: 'ATPL Check-Ride', from: 'LAS', to: 'LAS',
    requiredLicense: 'ir', requiredTier: 4,
    distance: 5200, baseReward: 4800, difficulty: 3, weather: 'storm',
    gates: 9, landingTol: 0.64, checkRide: true,
  },
];

export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map(r => [r.id, r]));
export const getRoute = (id) => ROUTE_BY_ID[id];
