'use strict';

/**
 * Targeted test: voting must NOT resolve until EVERY alive player has voted.
 *
 * Scenario:
 *   7 players → 2 mafia, 2 doctors, 1 detective, 2 villagers
 *   Doctor + detective vote → voting must NOT be resolved yet
 *   Only after ALL 7 alive players vote → voting resolves
 *
 * Also tests that a disconnected player still counts as eligible
 * (voting waits for them or the timer).
 */

const GameManager = require('./src/GameManager');
const { PHASES, ROLES } = require('./src/types');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.error(`  ✗ ${label}`); failed++; }
}
function section(title) { console.log(`\n── ${title} ─────────────────────────`); }

// ── Helper: replicate wsHandler's voting-complete check (the FIXED version) ──
function checkVotingComplete(room) {
  const eligibleVoters = Object.values(room.players).filter(p => p.isAlive);
  const votedCount = Object.keys(room.votes).filter(voterId => {
    const voter = room.players[voterId];
    return voter && voter.isAlive;
  }).length;
  return { eligibleVoters: eligibleVoters.length, votedCount, complete: votedCount >= eligibleVoters.length };
}

// ── Helper: replicate the OLD buggy check ──
function checkVotingCompleteBuggy(room) {
  const eligibleVoters = Object.values(room.players).filter(p => p.isAlive && p.isConnected !== false);
  const votedCount = Object.keys(room.votes).filter(voterId => {
    const voter = room.players[voterId];
    return voter && voter.isAlive && voter.isConnected !== false;
  }).length;
  return { eligibleVoters: eligibleVoters.length, votedCount, complete: votedCount >= eligibleVoters.length };
}

// ── Build room ──
function buildRoom(settings) {
  const gm = new GameManager();
  const { room, player: host } = gm.createRoom('Host');
  const total = settings.mafiaCount + settings.doctorCount + settings.detectiveCount + 2;
  for (let i = 1; i < total; i++) gm.joinRoom(room.code, `P${i}`);
  gm.updateSettings(room.code, host.id, settings);
  gm.startGame(room.code, host.id);

  const all = Object.values(room.players);
  const byRole = {
    mafia:     all.filter(p => p.role === ROLES.MAFIA),
    doctor:    all.filter(p => p.role === ROLES.DOCTOR),
    detective: all.filter(p => p.role === ROLES.DETECTIVE),
    villager:  all.filter(p => p.role === ROLES.VILLAGER),
  };
  return { gm, room, byRole, all };
}

// ═══════════════════════════════════════════════════════════════════════════════
section('1. Voting waits for ALL players (2 mafia, 2 doctors, 1 detective)');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 2, doctorCount: 2, detectiveCount: 1 });
  assert('7 players total', all.length === 7);
  assert('2 mafia', byRole.mafia.length === 2);
  assert('2 doctors', byRole.doctor.length === 2);
  assert('1 detective', byRole.detective.length === 1);
  assert('2 villagers', byRole.villager.length === 2);

  // Skip to voting phase
  gm.startNight(room.code);
  // Do night actions so we can resolve
  const victim = byRole.villager[0];
  for (const m of byRole.mafia) gm.recordNightAction(room.code, m.id, victim.id);
  for (const d of byRole.doctor) gm.recordNightAction(room.code, d.id, victim.id);
  gm.recordNightAction(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  assert('Phase is voting', room.phase === PHASES.VOTING);

  const alivePlayers = all.filter(p => p.isAlive);
  assert('All 7 alive (doctor saved victim)', alivePlayers.length === 7);

  // Step 1: Doctors vote
  gm.recordVote(room.code, byRole.doctor[0].id, byRole.mafia[0].id);
  gm.recordVote(room.code, byRole.doctor[1].id, byRole.mafia[0].id);
  let result = checkVotingComplete(room);
  assert(`After 2 doctors vote: ${result.votedCount}/${result.eligibleVoters} → NOT complete`, !result.complete);

  // Step 2: Detective votes
  gm.recordVote(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  result = checkVotingComplete(room);
  assert(`After detective votes: ${result.votedCount}/${result.eligibleVoters} → NOT complete`, !result.complete);

  // Step 3: Villagers vote
  for (const v of byRole.villager) gm.recordVote(room.code, v.id, byRole.mafia[0].id);
  result = checkVotingComplete(room);
  assert(`After villagers vote: ${result.votedCount}/${result.eligibleVoters} → NOT complete`, !result.complete);

  // Step 4: 1 of 2 mafia votes
  gm.recordVote(room.code, byRole.mafia[0].id, 'skip');
  result = checkVotingComplete(room);
  assert(`After 1 mafia votes: ${result.votedCount}/${result.eligibleVoters} → NOT complete`, !result.complete);

  // Step 5: Last mafia votes → NOW complete
  gm.recordVote(room.code, byRole.mafia[1].id, 'skip');
  result = checkVotingComplete(room);
  assert(`After ALL vote: ${result.votedCount}/${result.eligibleVoters} → COMPLETE`, result.complete);
}

// ═══════════════════════════════════════════════════════════════════════════════
section('2. Disconnected player: OLD buggy check resolves early');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 2, doctorCount: 2, detectiveCount: 1 });

  gm.startNight(room.code);
  const victim = byRole.villager[0];
  for (const m of byRole.mafia) gm.recordNightAction(room.code, m.id, victim.id);
  for (const d of byRole.doctor) gm.recordNightAction(room.code, d.id, victim.id);
  gm.recordNightAction(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  // Simulate: 1 mafia disconnects (isConnected = false)
  byRole.mafia[1].isConnected = false;

  // Non-mafia + 1 connected mafia vote (6 out of 7 alive)
  gm.recordVote(room.code, byRole.doctor[0].id, byRole.mafia[0].id);
  gm.recordVote(room.code, byRole.doctor[1].id, byRole.mafia[0].id);
  gm.recordVote(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  for (const v of byRole.villager) gm.recordVote(room.code, v.id, byRole.mafia[0].id);
  gm.recordVote(room.code, byRole.mafia[0].id, 'skip');

  // OLD buggy check: would resolve because disconnected mafia is excluded
  const buggy = checkVotingCompleteBuggy(room);
  assert(`OLD BUG: ${buggy.votedCount}/${buggy.eligibleVoters} → resolves EARLY (6/6)`, buggy.complete);

  // NEW fixed check: does NOT resolve because disconnected mafia still counts
  const fixed = checkVotingComplete(room);
  assert(`FIX: ${fixed.votedCount}/${fixed.eligibleVoters} → does NOT resolve (6/7)`, !fixed.complete);
}

// ═══════════════════════════════════════════════════════════════════════════════
section('3. Voting with 3 mafia, 3 doctors, 2 detectives');
{
  const gm = new GameManager();
  const { room, player: host } = gm.createRoom('Host');
  // 3+3+2+2 villagers = 10 players
  for (let i = 1; i < 10; i++) gm.joinRoom(room.code, `P${i}`);
  gm.updateSettings(room.code, host.id, { mafiaCount: 3, doctorCount: 3, detectiveCount: 2 });
  gm.startGame(room.code, host.id);

  const all = Object.values(room.players);
  const byRole = {
    mafia:     all.filter(p => p.role === ROLES.MAFIA),
    doctor:    all.filter(p => p.role === ROLES.DOCTOR),
    detective: all.filter(p => p.role === ROLES.DETECTIVE),
    villager:  all.filter(p => p.role === ROLES.VILLAGER),
  };

  assert('10 players total', all.length === 10);
  assert('3 mafia', byRole.mafia.length === 3);
  assert('3 doctors', byRole.doctor.length === 3);
  assert('2 detectives', byRole.detective.length === 2);

  gm.startNight(room.code);
  const victim = byRole.villager[0];
  for (const m of byRole.mafia) gm.recordNightAction(room.code, m.id, victim.id);
  for (const d of byRole.doctor) gm.recordNightAction(room.code, d.id, victim.id);
  for (const det of byRole.detective) gm.recordNightAction(room.code, det.id, byRole.mafia[0].id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  // Vote one by one, assert NOT complete until the very last one
  const voteOrder = [...byRole.doctor, ...byRole.detective, ...byRole.villager, ...byRole.mafia];
  const target = byRole.mafia[0].id;

  for (let i = 0; i < voteOrder.length; i++) {
    const p = voteOrder[i];
    if (!p.isAlive) continue;
    gm.recordVote(room.code, p.id, target);
    const r = checkVotingComplete(room);
    if (i < voteOrder.length - 1) {
      assert(`Vote ${i+1}/${voteOrder.length} (${p.role} ${p.nick}): NOT complete (${r.votedCount}/${r.eligibleVoters})`, !r.complete);
    } else {
      assert(`Vote ${i+1}/${voteOrder.length} (${p.role} ${p.nick}): COMPLETE (${r.votedCount}/${r.eligibleVoters})`, r.complete);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
section('4. Dead players do NOT block voting');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 2, doctorCount: 2, detectiveCount: 1 });

  gm.startNight(room.code);
  const victim = byRole.villager[0];
  for (const m of byRole.mafia) gm.recordNightAction(room.code, m.id, victim.id);
  // Doctor saves someone else → victim dies
  for (const d of byRole.doctor) gm.recordNightAction(room.code, d.id, byRole.villager[1].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  const alivePlayers = all.filter(p => p.isAlive);
  assert('1 player dead, 6 alive', alivePlayers.length === 6);

  // All alive players vote
  for (const p of alivePlayers) {
    gm.recordVote(room.code, p.id, byRole.mafia[0].id);
  }

  const r = checkVotingComplete(room);
  assert(`Dead player doesn't count: ${r.votedCount}/${r.eligibleVoters} → COMPLETE`, r.complete);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log(`\n══════════════════════════════════════════════════`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════════\n`);
if (failed > 0) process.exit(1);
