// Bootstrap: assemble the scene registry, start the game, register the SW.
import { Game } from './core/Game.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { HubScene } from './scenes/HubScene.js';
import { HangarScene } from './scenes/HangarScene.js';
import { LicenseScene } from './scenes/LicenseScene.js';
import { BriefingScene } from './scenes/BriefingScene.js';
import { FlightScene } from './scenes/FlightScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';

const registry = {
  Boot: BootScene,
  Menu: MenuScene,
  Hub: HubScene,
  Hangar: HangarScene,
  License: LicenseScene,
  Briefing: BriefingScene,
  Flight: FlightScene,
  Results: ResultsScene,
  Settings: SettingsScene,
};

const canvasEl = document.getElementById('game');
const game = new Game(canvasEl, registry);
window.__game = game;            // handy for debugging from the console
game.start('Boot');

// Reveal the canvas now that the first frame is scheduled.
document.getElementById('boot')?.remove();

// PWA service worker (only in a secure context — localhost or HTTPS).
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW failed', err));
  });
}
