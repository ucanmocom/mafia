'use strict';

const fs   = require('fs');
const path = require('path');

const STATE_FILE = path.resolve(__dirname, '..', 'state.json');

/**
 * Saves current game state to disk.
 * @param {GameManager} gameManager
 */
function saveState(gameManager) {
  try {
    const data = gameManager.serialise();
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[persistence] Stan zapisany → ${STATE_FILE}`);
  } catch (err) {
    console.error('[persistence] Błąd zapisu stanu:', err.message);
  }
}

/**
 * Loads game state from disk (if exists).
 * Stale rooms (>2h) are pruned inside GameManager.deserialise().
 * @param {GameManager} gameManager
 */
function loadState(gameManager) {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('[persistence] Brak pliku state.json – start od zera.');
    return;
  }
  try {
    const raw  = fs.readFileSync(STATE_FILE, 'utf8');
    const data = JSON.parse(raw);
    gameManager.deserialise(data);
    const count = gameManager.rooms.size;
    console.log(`[persistence] Wczytano ${count} pokoi ze stanu.`);
  } catch (err) {
    console.error('[persistence] Błąd wczytywania stanu:', err.message);
  }
}

module.exports = { saveState, loadState };
