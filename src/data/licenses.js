// Pilot license tiers. Each license unlocks an aircraft tier and is earned by
// meeting flight-hour + cash thresholds and then passing a stricter check-ride.

export const LICENSES = [
  {
    id: 'student', name: 'Student Pilot', abbr: 'SPL', order: 1, unlocksTier: 1,
    blurb: 'Your first solo. Short hops in calm air.',
    requires: null,            // starting license
    checkRide: null,
  },
  {
    id: 'ppl', name: 'Private Pilot', abbr: 'PPL', order: 2, unlocksTier: 2,
    blurb: 'Carry passengers for fun. Longer cross-country legs.',
    requires: { hours: 0.6, cash: 6000, prevLicense: 'student' },
    checkRide: { routeId: 'cr_ppl' },
  },
  {
    id: 'cpl', name: 'Commercial Pilot', abbr: 'CPL', order: 3, unlocksTier: 3,
    blurb: 'Get paid to fly. Charter and cargo in turboprops.',
    requires: { hours: 2.5, cash: 28000, prevLicense: 'ppl' },
    checkRide: { routeId: 'cr_cpl' },
  },
  {
    id: 'ir', name: 'Instrument / Multi', abbr: 'IR', order: 4, unlocksTier: 4,
    blurb: 'Fly in weather and at night. Step up to regional jets.',
    requires: { hours: 6, cash: 95000, prevLicense: 'cpl' },
    checkRide: { routeId: 'cr_ir' },
  },
  {
    id: 'atpl', name: 'Airline Transport', abbr: 'ATPL', order: 5, unlocksTier: 5,
    blurb: 'The top ticket. Command narrow-body airliners.',
    requires: { hours: 12, cash: 240000, prevLicense: 'ir' },
    checkRide: { routeId: 'cr_atpl' },
  },
];

export const LICENSE_BY_ID = Object.fromEntries(LICENSES.map(l => [l.id, l]));
export const getLicense = (id) => LICENSE_BY_ID[id];
export const licenseOrder = (id) => (LICENSE_BY_ID[id]?.order ?? 0);
