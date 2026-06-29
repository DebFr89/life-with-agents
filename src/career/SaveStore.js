// Single source of truth for career state, persisted to localStorage.
// Tiny, versioned blob; corruption or loss falls back to a fresh profile.
import { CONFIG } from '../data/config.js';

const KEY = 'skycareer.save.v1';
const SCHEMA = 1;

function freshProfile() {
  return {
    schemaVersion: SCHEMA,
    cash: CONFIG.startingCash,
    currentLicense: 'student',
    flightHours: 0,
    xp: 0,
    ownedAircraft: ['c172'],
    activeAircraft: 'c172',
    completedRoutes: {},      // routeId -> best grade key ('PERFECT' | 'GOOD' | ...)
    passedCheckRides: {},     // licenseId -> true
    stats: { flights: 0, perfects: 0, crashes: 0 },
    settings: { tiltEnabled: false, sfxVolume: 0.8, musicVolume: 0.5, invertPitch: false },
  };
}

export class SaveStore {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshProfile();
      const parsed = JSON.parse(raw);
      return this._migrate(parsed);
    } catch (e) {
      console.warn('Save load failed, starting fresh', e);
      return freshProfile();
    }
  }

  _migrate(data) {
    // Merge onto a fresh profile so any newly-added fields get defaults.
    const base = freshProfile();
    const merged = { ...base, ...data,
      settings: { ...base.settings, ...(data.settings || {}) },
      stats: { ...base.stats, ...(data.stats || {}) },
      completedRoutes: { ...(data.completedRoutes || {}) },
      passedCheckRides: { ...(data.passedCheckRides || {}) },
    };
    merged.schemaVersion = SCHEMA;
    return merged;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Save failed', e);
    }
  }

  reset() {
    this.data = freshProfile();
    this.save();
  }
}
