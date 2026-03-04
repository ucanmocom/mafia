'use strict';

const GameManager  = require('./src/GameManager');
const { PHASES, ROLES } = require('./src/types');
const { saveState, loadState } = require('./src/persistence');
const fs = require('fs');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.error(`  ✗ ${label}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== GameManager tests ===\n');

const gm = new GameManager();

// 1. Create room
const { room, player: host } = gm.createRoom('TestHost');
assert('Room created',         !!room.code);
assert('Phase is lobby',       room.phase === PHASES.LOBBY);
assert('Host set correctly',   room.hostId === host.id);
assert('Host in players map',  !!room.players[host.id]);

// 2. Join players (need 6 total → 1 host + 5 more)
for (let i = 1; i <= 5; i++) gm.joinRoom(room.code, `Player${i}`);
assert('6 players in room', Object.keys(room.players).length === 6);

// 3. Duplicate nick rejected
const dup = gm.joinRoom(room.code, 'Player1');
assert('Duplicate nick rejected', dup.error);

// 4. Update settings
const upd = gm.updateSettings(room.code, host.id, { mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
assert('Settings updated', !upd.error);

// 5. Invalid settings (too many roles)
const badUpd = gm.updateSettings(room.code, host.id, { mafiaCount: 3, doctorCount: 2, detectiveCount: 1 });
assert('Overfull roles rejected', !!badUpd.error);

// 6. Non-host cannot change settings
const notHost = Object.values(room.players).find(p => p.id !== host.id);
const notHostUpd = gm.updateSettings(room.code, notHost.id, { mafiaCount: 1 });
assert('Non-host blocked from settings', !!notHostUpd.error);

// 7. Start game
const start = gm.startGame(room.code, host.id);
assert('Game started', !start.error);
assert('Phase is role_reveal', room.phase === PHASES.ROLE_REVEAL);

// 8. Roles assigned
const allPlayers = Object.values(room.players);
const mafiaPlayers   = allPlayers.filter(p => p.role === ROLES.MAFIA);
const doctorPlayers  = allPlayers.filter(p => p.role === ROLES.DOCTOR);
const detectivePlayers = allPlayers.filter(p => p.role === ROLES.DETECTIVE);
const villagerPlayers = allPlayers.filter(p => p.role === ROLES.VILLAGER);
assert('1 mafia assigned',     mafiaPlayers.length === 1);
assert('1 doctor assigned',    doctorPlayers.length === 1);
assert('1 detective assigned', detectivePlayers.length === 1);
assert('3 villagers assigned', villagerPlayers.length === 3);

// 9. Night phase
gm.startNight(room.code);
assert('Phase is night', room.phase === PHASES.NIGHT);
assert('Round = 1',      room.round === 1);

const mafia   = mafiaPlayers[0];
const victim  = villagerPlayers[0];
const doctor  = doctorPlayers[0];
const detective = detectivePlayers[0];
const safeVictim = villagerPlayers[1];

// 10. Record actions
const mafiaAct = gm.recordNightAction(room.code, mafia.id, victim.id);
assert('Mafia voted', !mafiaAct.error);

const detectAct = gm.recordNightAction(room.code, detective.id, mafia.id);
assert('Detective acted', !detectAct.error);

const docAct = gm.recordNightAction(room.code, doctor.id, victim.id);
assert('Doctor acted', !docAct.error);

// 11. Night complete
assert('Night is complete', gm.isNightComplete(room.code));

// 12. Resolve night – doctor saved victim
const { killed, detectiveResults } = gm.resolveNight(room.code);
assert('Victim saved by doctor (killed=null)', killed === null);
const detectiveResult = detectiveResults && detectiveResults[0];
assert('Detective identified mafia', detectiveResult && detectiveResult.isMafia);
assert('Phase is night_result', room.phase === PHASES.NIGHT_RESULT);

// 13. Day phase
gm.startDay(room.code);
assert('Phase is day', room.phase === PHASES.DAY);

// 14. Voting
gm.startVoting(room.code);
assert('Phase is voting', room.phase === PHASES.VOTING);

for (const p of allPlayers) {
  gm.recordVote(room.code, p.id, mafia.id);
}
assert('All votes recorded', Object.keys(room.votes).length === allPlayers.length);

// 15. Resolve voting – mafia eliminated
const voteRes = gm.resolveVoting(room.code);
assert('Mafia eliminated by vote', voteRes.eliminated && voteRes.eliminated.id === mafia.id);
assert('Phase is vote_result', room.phase === PHASES.VOTE_RESULT);

// 16. Win condition – villagers win
const winner = gm.checkWinCondition(room.code);
assert('Villagers win', winner === 'villagers');
assert('Phase is game_over', room.phase === PHASES.GAME_OVER);

// 17. Serialise / deserialise
const gm2 = new GameManager();
gm2.deserialise(gm.serialise());
assert('Deserialised room count correct', gm2.rooms.size === 0); // game_over rooms are pruned

// Create fresh room and serialise
const gm3 = new GameManager();
const { room: r3 } = gm3.createRoom('Fresh');
const serial = gm3.serialise();
const gm4 = new GameManager();
gm4.deserialise(serial);
assert('Active room survives serialise cycle', gm4.rooms.size === 1);

// ─── Lovers tests ────────────────────────────────────────────────────────────
console.log('\n=== Lovers tests ===\n');

const gm5 = new GameManager();
const { room: lRoom, player: lHost } = gm5.createRoom('Host');
for (let i = 1; i <= 5; i++) gm5.joinRoom(lRoom.code, `P${i}`);

// Enable lovers
const loversSet = gm5.updateSettings(lRoom.code, lHost.id, { mafiaCount: 1, doctorCount: 1, detectiveCount: 1, loversCount: 1 });
assert('Lovers setting accepted', !loversSet.error);
assert('loversCount = 1 saved', lRoom.settings.loversCount === 1);

// Invalid loversCount
const badLovers = gm5.updateSettings(lRoom.code, lHost.id, { loversCount: 2 });
assert('loversCount > 1 rejected', !!badLovers.error);

// Start game with lovers
gm5.startGame(lRoom.code, lHost.id);
const lPlayers = Object.values(lRoom.players);
const loverPlayers = lPlayers.filter(p => p.loverId !== null);
assert('Exactly 2 players are lovers', loverPlayers.length === 2);
assert('Lovers point to each other', loverPlayers[0].loverId === loverPlayers[1].id && loverPlayers[1].loverId === loverPlayers[0].id);
assert('Room has loverIds', Array.isArray(lRoom.loverIds) && lRoom.loverIds.length === 2);

// Lovers cannot vote for each other
gm5.startNight(lRoom.code);
// Pick a non-lover victim
const nonLover = lPlayers.find(p => p.loverId === null && p.role !== ROLES.MAFIA);
const loverA = loverPlayers[0];
const loverB = loverPlayers[1];
const lMafia = lPlayers.find(p => p.role === ROLES.MAFIA);
const lDoctor = lPlayers.find(p => p.role === ROLES.DOCTOR);
const lDetective = lPlayers.find(p => p.role === ROLES.DETECTIVE);
// Simulate night actions
const lKillTarget = lPlayers.find(p => p.id !== lMafia.id && p.role !== ROLES.MAFIA);
gm5.recordNightAction(lRoom.code, lMafia.id, lKillTarget.id);
if (lDoctor) gm5.recordNightAction(lRoom.code, lDoctor.id, lKillTarget.id); // doctor saves same target → no kill
if (lDetective) gm5.recordNightAction(lRoom.code, lDetective.id, lMafia.id);
gm5.resolveNight(lRoom.code);
gm5.startDay(lRoom.code);
gm5.startVoting(lRoom.code);

const voteBlockResult = gm5.recordVote(lRoom.code, loverA.id, loverB.id);
assert('Lover vote for partner is blocked', !!voteBlockResult.error);

// Lover can vote for someone else
const someoneElse = lPlayers.find(p => p.id !== loverA.id && p.id !== loverB.id && p.isAlive);
const validVote = gm5.recordVote(lRoom.code, loverA.id, someoneElse.id);
assert('Lover can vote for non-lover', !validVote.error);

// Lover chain death — eliminate loverA and check loverB dies
// (reset lovers' isAlive to true first to test chain)
loverA.isAlive = true;
loverB.isAlive = true;
const loverKilledResult = gm5._killLoverOf(lRoom, loverA.id);
assert('_killLoverOf returns loverB', loverKilledResult && loverKilledResult.id === loverB.id);
assert('loverB is now dead', !loverB.isAlive);

// resetToLobby clears lover data
gm5.resetToLobby(lRoom.code);
const allClearedLovers = Object.values(lRoom.players).every(p => p.loverId === null || p.loverId === undefined);
assert('resetToLobby clears loverId from players', allClearedLovers);
assert('resetToLobby clears room.loverIds', lRoom.loverIds === null);

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
