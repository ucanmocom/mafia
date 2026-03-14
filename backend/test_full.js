'use strict';

/**
 * Full integration tests:
 * - kill without doctor (victim dies)
 * - kill with doctor save
 * - detective gets correct result (mafia / not mafia)
 * - multiple detectives each get own result
 * - voting eliminates correct player
 * - plurality voting (abstain / tie / skip wins)
 * - skip-day 60% threshold
 * - dead player cannot act
 * - win condition: villagers win, mafia wins
 * - mafia count rule (>1 needs ≥6 players)
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

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Build room with given role distribution. Returns { gm, room, byRole }. */
function buildRoom(settings, extraPlayers = 0) {
  const gm = new GameManager();
  const { room, player: host } = gm.createRoom('Host');
  const total = settings.mafiaCount + settings.doctorCount + settings.detectiveCount + 2 + extraPlayers;
  for (let i = 1; i < total; i++) gm.joinRoom(room.code, `P${i}`);
  gm.updateSettings(room.code, host.id, settings);
  gm.startGame(room.code, host.id);
  gm.startNight(room.code);

  const all = Object.values(room.players);
  const byRole = {
    mafia:      all.filter(p => p.role === ROLES.MAFIA),
    doctor:     all.filter(p => p.role === ROLES.DOCTOR),
    detective:  all.filter(p => p.role === ROLES.DETECTIVE),
    villager:   all.filter(p => p.role === ROLES.VILLAGER),
  };
  return { gm, room, byRole, all };
}

// ═════════════════════════════════════════════════════════════════════════════
section('1. Kill without doctor save');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const victim = byRole.villager[0];
  const otherVillager = byRole.villager[1];
  const mafia = byRole.mafia[0];
  const doctor = byRole.doctor[0];
  const det = byRole.detective[0];

  gm.recordNightAction(room.code, mafia.id,    victim.id);
  gm.recordNightAction(room.code, doctor.id,   otherVillager.id); // doctor saves someone else
  gm.recordNightAction(room.code, det.id,      mafia.id);

  const { killed } = gm.resolveNight(room.code);
  assert('Victim dies when doctor saves someone else', killed && killed.id === victim.id);
  assert('Victim isAlive=false', room.players[victim.id].isAlive === false);
  assert('Other villager still alive', room.players[otherVillager.id].isAlive === true);
}

// ═════════════════════════════════════════════════════════════════════════════
section('2. Doctor saves the victim');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const victim = byRole.villager[0];
  const mafia = byRole.mafia[0];
  const doctor = byRole.doctor[0];
  const det = byRole.detective[0];

  gm.recordNightAction(room.code, mafia.id,   victim.id);
  gm.recordNightAction(room.code, doctor.id,  victim.id); // doctor saves same
  gm.recordNightAction(room.code, det.id,     mafia.id);

  const { killed } = gm.resolveNight(room.code);
  assert('Victim saved (killed=null)', killed === null);
  assert('Victim still alive', room.players[victim.id].isAlive === true);
}

// ═════════════════════════════════════════════════════════════════════════════
section('3. Detective identifies mafia vs non-mafia');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const mafia = byRole.mafia[0];
  const doctor = byRole.doctor[0];
  const det = byRole.detective[0];
  const villager = byRole.villager[0];

  gm.recordNightAction(room.code, mafia.id,   villager.id);
  gm.recordNightAction(room.code, doctor.id,  villager.id);
  gm.recordNightAction(room.code, det.id,     mafia.id);

  const { detectiveResult } = gm.resolveNight(room.code);
  assert('Detective checks mafia → isMafia=true', detectiveResult.isMafia === true);
  assert('Detective result target is mafia', detectiveResult.target.id === mafia.id);

  // Second room: detective checks villager
  const { gm: gm2, room: room2, byRole: br2 } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const v2 = br2.villager[0];
  gm2.recordNightAction(room2.code, br2.mafia[0].id,   br2.villager[1].id);
  gm2.recordNightAction(room2.code, br2.doctor[0].id,  br2.villager[0].id);
  gm2.recordNightAction(room2.code, br2.detective[0].id, v2.id);

  const { detectiveResult: dr2 } = gm2.resolveNight(room2.code);
  assert('Detective checks villager → isMafia=false', dr2.isMafia === false);
}

// ═════════════════════════════════════════════════════════════════════════════
section('4. Multiple detectives — majority vote decides target');
{
  // Need enough players: 1 mafia + 1 doctor + 2 detectives + 2 villagers = 6
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 2 });
  const [det1, det2] = byRole.detective;
  const mafia = byRole.mafia[0];
  const villager = byRole.villager[0];

  // Both detectives vote for mafia → majority is mafia
  gm.recordNightAction(room.code, mafia.id,          villager.id);
  gm.recordNightAction(room.code, byRole.doctor[0].id, villager.id);
  gm.recordNightAction(room.code, det1.id,           mafia.id);
  gm.recordNightAction(room.code, det2.id,           mafia.id);

  const { detectiveResult } = gm.resolveNight(room.code);
  assert('Single detective result returned', detectiveResult !== null);
  assert('Majority target is mafia → isMafia=true', detectiveResult.isMafia === true);
  assert('Target is mafia player', detectiveResult.target.id === mafia.id);
}

// ═════════════════════════════════════════════════════════════════════════════
section('5. Voting eliminates correct player');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  // Skip night
  const mafia = byRole.mafia[0];
  gm.recordNightAction(room.code, mafia.id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.doctor[0].id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, mafia.id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  // Everyone votes for mafia
  for (const p of all) gm.recordVote(room.code, p.id, mafia.id);
  const { eliminated, tie } = gm.resolveVoting(room.code);
  assert('Mafia eliminated', eliminated && eliminated.id === mafia.id);
  assert('No tie', !tie);
  assert('Mafia isAlive=false', room.players[mafia.id].isAlive === false);
  assert('Phase is vote_result', room.phase === PHASES.VOTE_RESULT);
}

// ═════════════════════════════════════════════════════════════════════════════
section('6. Plurality voting — tie means no elimination');
{
  // Need even count of voters for a clean tie → 6 players (extraPlayers=1)
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 }, 1);
  const mafia = byRole.mafia[0];
  gm.recordNightAction(room.code, mafia.id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.doctor[0].id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, mafia.id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  // Tie: half vote for mafia, half for villager1
  const target1 = byRole.mafia[0];
  const target2 = byRole.villager[0];
  const voters = Object.values(room.players).filter(p => p.isAlive);
  voters.slice(0, Math.floor(voters.length / 2)).forEach(p => gm.recordVote(room.code, p.id, target1.id));
  voters.slice(Math.floor(voters.length / 2)).forEach(p => gm.recordVote(room.code, p.id, target2.id));

  const { eliminated, tie } = gm.resolveVoting(room.code);
  assert('Tie → no elimination', eliminated === null);
  assert('Tie flag set', tie === true);
}

// ═════════════════════════════════════════════════════════════════════════════
section('7. Abstain vote (skip) wins → no elimination');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const mafia = byRole.mafia[0];
  gm.recordNightAction(room.code, mafia.id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.doctor[0].id, byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, mafia.id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);

  for (const p of all) gm.recordVote(room.code, p.id, 'skip');
  const { eliminated, tie } = gm.resolveVoting(room.code);
  assert('All abstain → no elimination', eliminated === null);
  assert('Skip-wins tie flag set', tie === true);
}

// ═════════════════════════════════════════════════════════════════════════════
section('8. Skip day — 60% threshold');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  // Don't need to do night, just start day
  gm.startNight(room.code); // already in night from buildRoom but resolveNight wasn't called
  gm.recordNightAction(room.code, byRole.mafia[0].id,     byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.doctor[0].id,    byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);

  const alive = all.filter(p => p.isAlive);
  const needed = Math.ceil(alive.length * 0.6);

  // Vote one less than needed → not triggered
  for (let i = 0; i < needed - 1; i++) {
    const r = gm.recordSkipDayVote(room.code, alive[i].id);
    assert(`Skip vote ${i + 1} not yet triggered`, r.triggered === false);
  }

  // Vote that tips it over
  const last = gm.recordSkipDayVote(room.code, alive[needed - 1].id);
  assert('Skip triggered at 60%', last.triggered === true);
  assert('Phase moved to voting', room.phase === PHASES.VOTING);
}

// ═════════════════════════════════════════════════════════════════════════════
section('9. Dead player cannot act');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const victim = byRole.villager[0];
  const mafia = byRole.mafia[0];
  const doctor = byRole.doctor[0];
  const det = byRole.detective[0];

  gm.recordNightAction(room.code, mafia.id,   victim.id);
  gm.recordNightAction(room.code, doctor.id,  byRole.villager[1].id); // doesn't save
  gm.recordNightAction(room.code, det.id,     mafia.id);
  gm.resolveNight(room.code); // victim dies
  gm.startDay(room.code);
  gm.startVoting(room.code);

  const deadVote = gm.recordVote(room.code, victim.id, mafia.id);
  assert('Dead player cannot vote', !!deadVote.error);

  // Next night — dead player tries action
  gm.startNight(room.code);
  const deadAct = gm.recordNightAction(room.code, victim.id, mafia.id);
  assert('Dead player cannot act at night', !!deadAct.error);

  // Dead player cannot skip day
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  const deadSkip = gm.recordSkipDayVote(room.code, victim.id);
  assert('Dead player cannot skip day', !!deadSkip.error);
}

// ═════════════════════════════════════════════════════════════════════════════
section('10. Win condition: villagers win');
{
  const { gm, room, byRole, all } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  const mafia = byRole.mafia[0];
  gm.recordNightAction(room.code, mafia.id,               byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.doctor[0].id,    byRole.villager[0].id);
  gm.recordNightAction(room.code, byRole.detective[0].id, mafia.id);
  gm.resolveNight(room.code);
  gm.startDay(room.code);
  gm.startVoting(room.code);
  for (const p of all) gm.recordVote(room.code, p.id, mafia.id);
  gm.resolveVoting(room.code);
  const winner = gm.checkWinCondition(room.code);
  assert('Villagers win after mafia eliminated', winner === 'villagers');
  assert('Phase game_over', room.phase === PHASES.GAME_OVER);
}

// ═════════════════════════════════════════════════════════════════════════════
section('11. Win condition: mafia wins (parity)');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  // Kill everyone except mafia + 1 non-mafia to get parity
  const nonMafia = [...byRole.doctor, ...byRole.detective, ...byRole.villager];
  // Manually eliminate all but one non-mafia
  nonMafia.slice(1).forEach(p => { p.isAlive = false; });
  // Now: 1 mafia alive + 1 non-mafia alive → mafia wins
  const winner = gm.checkWinCondition(room.code);
  assert('Mafia wins at parity', winner === 'mafia');
  assert('Phase game_over on mafia win', room.phase === PHASES.GAME_OVER);
}

// ═════════════════════════════════════════════════════════════════════════════
section('12. Mafia count rule: >1 mafia needs ≥6 players');
{
  const gm = new GameManager();
  const { room, player: host } = gm.createRoom('H');
  // Only 5 players total
  for (let i = 1; i <= 4; i++) gm.joinRoom(room.code, `P${i}`);
  const res = gm.updateSettings(room.code, host.id, { mafiaCount: 2, doctorCount: 1, detectiveCount: 1 });
  assert('2 mafia blocked with 5 players', !!res.error);

  // Add one more (6 total)
  gm.joinRoom(room.code, 'P5');
  const res2 = gm.updateSettings(room.code, host.id, { mafiaCount: 2, doctorCount: 1, detectiveCount: 1 });
  assert('2 mafia ok with 6 players', !res2.error);
}

// ═════════════════════════════════════════════════════════════════════════════
section('13. Night complete only when all actions in');
{
  const { gm, room, byRole } = buildRoom({ mafiaCount: 1, doctorCount: 1, detectiveCount: 1 });
  // isNightComplete counts only connected players (readyState === 1), so mock active sockets.
  for (const p of Object.values(room.players)) {
    p.ws = { readyState: 1 };
  }
  assert('Night not complete at start', !gm.isNightComplete(room.code));
  gm.recordNightAction(room.code, byRole.mafia[0].id,   byRole.villager[0].id);
  assert('Night not complete after 1 action', !gm.isNightComplete(room.code));
  gm.recordNightAction(room.code, byRole.doctor[0].id,  byRole.villager[0].id);
  assert('Night not complete after 2 actions', !gm.isNightComplete(room.code));
  gm.recordNightAction(room.code, byRole.detective[0].id, byRole.mafia[0].id);
  assert('Night complete after all 3 actions', gm.isNightComplete(room.code));
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(`${passed + failed} tests: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(50) + '\n');
if (failed > 0) process.exit(1);
