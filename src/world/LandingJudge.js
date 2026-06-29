// Grades a touchdown on three axes — centerline alignment, sink rate, and speed.
// Tolerance widens with route.landingTol and aircraft.durability.
const tierToGrade = ['CRASH', 'HARD', 'GOOD', 'PERFECT'];

function tier(value, perfect, good, hard) {
  if (value <= perfect) return 3;
  if (value <= good) return 2;
  if (value <= hard) return 1;
  return 0;
}

export function judgeLanding(plane, route, aircraft) {
  const tol = route.landingTol * (0.85 + aircraft.durability * 0.18);

  const lateral = Math.abs(plane.x);
  const sink = Math.max(0, -plane.vSpeed);
  const speedTarget = aircraft.stallSpeed * 1.15;
  const fast = Math.max(0, plane.speed - speedTarget);

  const tLat = tier(lateral, 16 * tol, 34 * tol, 60 * tol);
  const tSink = tier(sink, 11 * tol, 22 * tol, 34 * tol);
  const tSpeed = tier(fast, aircraft.stallSpeed * 0.35 * tol, aircraft.stallSpeed * 0.65 * tol, aircraft.stallSpeed * 1.05 * tol);

  const overall = Math.min(tLat, tSink, tSpeed);
  return {
    gradeKey: tierToGrade[overall],
    detail: {
      lateral, sink, fast,
      lateralTier: tLat, sinkTier: tSink, speedTier: tSpeed,
    },
  };
}
