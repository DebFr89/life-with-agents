// Aircraft roster. `tier` gates against the license's `unlocksTier`.
// Flight constants are in world-units (see config.js). Higher tiers fly faster
// and carry more, but are less forgiving (lower handling, tighter landing).

export const AIRCRAFT = [
  {
    id: 'c172', name: 'Cessna 172', tier: 1, price: 0,
    role: 'Trainer', color: '#dfe7f2', accent: '#c8102e',
    maxSpeed: 95, stallSpeed: 34, accel: 0.9,
    maxBank: 0.55, handling: 4.6, climbRate: 42, durability: 1.6,
    fuelCapacity: 90, idleBurn: 0.18, burnRate: 0.7,
    paxCapacity: 3, cargoCapacity: 60,
  },
  {
    id: 'sr22', name: 'Cirrus SR22', tier: 2, price: 9500,
    role: 'Touring single', color: '#f2f4f7', accent: '#2a6df4',
    maxSpeed: 125, stallSpeed: 42, accel: 1.0,
    maxBank: 0.58, handling: 4.2, climbRate: 46, durability: 1.4,
    fuelCapacity: 120, idleBurn: 0.2, burnRate: 0.9,
    paxCapacity: 4, cargoCapacity: 90,
  },
  {
    id: 'kingair', name: 'King Air 350', tier: 3, price: 42000,
    role: 'Turboprop', color: '#eef1f6', accent: '#1f7a4d',
    maxSpeed: 165, stallSpeed: 55, accel: 0.85,
    maxBank: 0.5, handling: 3.4, climbRate: 50, durability: 1.25,
    fuelCapacity: 180, idleBurn: 0.28, burnRate: 1.25,
    paxCapacity: 9, cargoCapacity: 300,
  },
  {
    id: 'e175', name: 'Embraer E175', tier: 4, price: 145000,
    role: 'Regional jet', color: '#f4f6fa', accent: '#7a3ff2',
    maxSpeed: 215, stallSpeed: 72, accel: 0.7,
    maxBank: 0.46, handling: 2.8, climbRate: 56, durability: 1.15,
    fuelCapacity: 280, idleBurn: 0.4, burnRate: 1.7,
    paxCapacity: 78, cargoCapacity: 1200,
  },
  {
    id: 'a320', name: 'Airbus A320', tier: 5, price: 360000,
    role: 'Narrow-body airliner', color: '#fbfcfe', accent: '#0a66c2',
    maxSpeed: 260, stallSpeed: 88, accel: 0.6,
    maxBank: 0.42, handling: 2.4, climbRate: 60, durability: 1.05,
    fuelCapacity: 380, idleBurn: 0.5, burnRate: 2.1,
    paxCapacity: 180, cargoCapacity: 2500,
  },
];

export const AIRCRAFT_BY_ID = Object.fromEntries(AIRCRAFT.map(a => [a.id, a]));
export const getAircraft = (id) => AIRCRAFT_BY_ID[id];
