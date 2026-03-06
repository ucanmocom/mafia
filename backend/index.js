'use strict';

const http       = require('http');
const express    = require('express');
const { WebSocketServer } = require('ws');

const GameManager        = require('./src/GameManager');
const { handleConnection } = require('./src/wsHandler');
const { saveState, loadState } = require('./src/persistence');

const PORT = process.env.PORT || 3001;

// ─── App setup ────────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

app.use(express.json());

// ─── Game state ───────────────────────────────────────────────────────────────

const gameManager = new GameManager();

// Load persisted state on startup
loadState(gameManager);

// ─── REST endpoints (minimal – WebSocket handles everything else) ─────────────

/** Health check */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms:  gameManager.rooms.size,
    uptime: process.uptime(),
  });
});

/** Join via link: GET /join/:roomCode  → returns room info */
app.get('/join/:roomCode', (req, res) => {
  const room = gameManager.getRoom(req.params.roomCode);
  if (!room) return res.status(404).json({ error: 'Pokój nie istnieje.' });
  res.json({
    roomCode:    room.code,
    phase:       room.phase,
    playerCount: Object.keys(room.players).length,
    settings:    room.settings,
  });
});

// ─── WebSocket ────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  handleConnection(ws, gameManager);
});

// ─── Server start ─────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Mafia Backend uruchomiony na porcie ${PORT}`);
  console.log(`[server] WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`[server] Health:    http://0.0.0.0:${PORT}/health`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal) {
  console.log(`\n[server] Odebrano ${signal} – zapisuję stan i zamykam...`);
  saveState(gameManager);

  // Close all WS connections gracefully
  wss.clients.forEach((ws) => ws.close());

  server.close(() => {
    console.log('[server] Serwer zamknięty.');
    process.exit(0);
  });

  // Force exit after 5s
  setTimeout(() => {
    console.error('[server] Force exit po 5s timeout.');
    process.exit(1);
  }, 5_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
