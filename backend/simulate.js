'use strict';
/**
 * simulate.js – Pelna symulacja gry Mafia z ladnym logiem na konsoli.
 * Uruchom:             node simulate.js
 * Opcjonalnie:         node simulate.js --rounds 5
 */

const GameManager = require('./src/GameManager');
const { ROLES, ROLE_DESCRIPTIONS } = require('./src/types');

// ─── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};

const MAX_ROUNDS = (() => {
  const idx = process.argv.indexOf('--rounds');
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : 10;
})();

const ROLE_COLOR = { mafia: C.red, doctor: C.green, detective: C.cyan, villager: C.white };
const ROLE_ICON  = { mafia: '[MAFIA]', doctor: '[LEKARZ]', detective: '[DETEKTYW]', villager: '[MIESZKANIEC]' };
const rc = (r) => ROLE_COLOR[r] || C.dim;
const ri = (r) => ROLE_ICON[r]  || '[?]';

const HR = C.dim + '-'.repeat(60) + C.reset;

function header(text, color) {
  const pad = ' '.repeat(Math.max(0, Math.floor((58 - text.length) / 2)));
  console.log('\n' + HR);
  console.log((color || '') + C.bold + pad + text + C.reset);
  console.log(HR);
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function printPlayers(players) {
  const alive = players.filter((p) => p.isAlive);
  const dead  = players.filter((p) => !p.isAlive);
  console.log(C.bold + '  Zywi (' + alive.length + '):' + C.reset);
  alive.forEach((p) =>
    console.log('    ' + C.green + 'o' + C.reset + ' ' + C.bold + p.nick + C.reset + (p.isHost ? C.yellow + ' *HOST*' + C.reset : ''))
  );
  if (dead.length) {
    console.log(C.bold + '  Martwi (' + dead.length + '):' + C.reset);
    dead.forEach((p) =>
      console.log('    ' + C.red + 'X' + C.reset + ' ' + C.dim + p.nick + C.reset + ' ' + rc(p.role) + ri(p.role) + C.reset)
    );
  }
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────

function simulate() {
  header('SYMULACJA GRY MAFIA', C.magenta);

  const gm = new GameManager();
  const NICKS = ['Marek', 'Kasia', 'Tomek', 'Ania', 'Piotr', 'Zuzia', 'Bartek', 'Ola'];
  const { room, player: host } = gm.createRoom(NICKS[0]);
  for (let i = 1; i < NICKS.length; i++) gm.joinRoom(room.code, NICKS[i]);

  const cfg = { mafiaCount: 2, doctorCount: 1, detectiveCount: 1 };
  gm.updateSettings(room.code, host.id, cfg);

  console.log('\n  Kod pokoju : ' + C.bold + C.cyan + room.code + C.reset);
  console.log('  Gracze     : ' + C.bold + NICKS.length + C.reset);
  console.log('  Mafia: ' + cfg.mafiaCount + '  Lekarz: ' + cfg.doctorCount + '  Detektyw: ' + cfg.detectiveCount);

  // ── Role reveal ────────────────────────────────────────────────────────────
  header('PRZYDZIELANIE ROL', C.blue);
  gm.startGame(room.code, host.id);

  const all = () => Object.values(room.players);

  for (const p of all()) {
    console.log(
      '  ' + C.bold + p.nick.padEnd(10) + C.reset +
      ' -> ' + rc(p.role) + C.bold + ri(p.role).padEnd(16) + C.reset +
      C.dim + ROLE_DESCRIPTIONS[p.role].slice(0, 52) + '...' + C.reset
    );
  }

  const mafiaTeam = all().filter((p) => p.role === ROLES.MAFIA);
  console.log('\n  ' + C.red + C.bold + 'Mafia zna siebie: ' + mafiaTeam.map((p) => p.nick).join(' & ') + C.reset);

  // ── Game loop ──────────────────────────────────────────────────────────────
  let round  = 0;
  let winner = null;

  while (!winner && round < MAX_ROUNDS) {
    round++;

    // ── NOC ───────────────────────────────────────────────────────────────────
    header('NOC  --  RUNDA ' + round, C.blue);
    gm.startNight(room.code);

    const alive      = all().filter((p) => p.isAlive);
    const aliveMafia = alive.filter((p) => p.role === ROLES.MAFIA);
    const aliveDoc   = alive.filter((p) => p.role === ROLES.DOCTOR);
    const aliveDet   = alive.filter((p) => p.role === ROLES.DETECTIVE);
    const nonMafia   = alive.filter((p) => p.role !== ROLES.MAFIA);

    printPlayers(all());
    console.log();

    // Mafia picks victim
    const victim = randomPick(nonMafia);
    aliveMafia.forEach((m) => gm.recordNightAction(room.code, m.id, victim.id));
    console.log(
      '  ' + C.red + 'MAFIA (' + aliveMafia.map((m) => m.nick).join(' & ') + ')' + C.reset +
      ' celuje w ' + C.bold + victim.nick + C.reset
    );

    // Doctor chooses target (70% saves victim)
    if (aliveDoc.length) {
      const saved = Math.random() < 0.7 ? victim : randomPick(alive);
      gm.recordNightAction(room.code, aliveDoc[0].id, saved.id);
      console.log(
        '  ' + C.green + 'LEKARZ ' + aliveDoc[0].nick + C.reset +
        ' chroni ' + C.bold + saved.nick + C.reset +
        (saved.id === victim.id ? '  ' + C.green + C.bold + '<-- uratuje ofiare!' + C.reset : '')
      );
    } else {
      // no doctor alive – fill stub so isNightComplete() passes
      room.nightActions.doctorTarget = victim.id;
    }

    // Detective inspects someone
    if (aliveDet.length) {
      const suspects = alive.filter((p) => p.id !== aliveDet[0].id);
      const checked  = randomPick(suspects);
      gm.recordNightAction(room.code, aliveDet[0].id, checked.id);
      const isMafia = checked.role === ROLES.MAFIA;
      console.log(
        '  ' + C.cyan + 'DETEKTYW ' + aliveDet[0].nick + C.reset +
        ' sprawdza ' + C.bold + checked.nick + C.reset + ' --> ' +
        (isMafia ? C.red + C.bold + 'TO MAFIA! ALARM!' : C.green + 'NIE MAFIA') + C.reset
      );
    } else {
      if (!room.nightActions.detectiveTarget) room.nightActions.detectiveTarget = victim.id;
    }

    console.log();
    const { killed } = gm.resolveNight(room.code);

    if (killed) {
      console.log(
        '  ' + C.red + C.bold + killed.nick + ' GINIE tej nocy!' + C.reset +
        '  ' + C.dim + '(byl/a: ' + ri(killed.role) + ')' + C.reset
      );
    } else {
      console.log('  ' + C.green + C.bold + 'Nikt nie zginal -- lekarz uratowal ofiare!' + C.reset);
    }

    winner = gm.checkWinCondition(room.code);
    if (winner) break;

    // ── DZIEN ─────────────────────────────────────────────────────────────────
    header('DZIEN  --  RUNDA ' + round, C.yellow);
    gm.startDay(room.code);

    const aliveDay    = all().filter((p) => p.isAlive);
    const aliveMafiaD = aliveDay.filter((p) => p.role === ROLES.MAFIA);
    const aliveDetDay = aliveDay.filter((p) => p.role === ROLES.DETECTIVE);

    printPlayers(all());
    console.log('\n  ' + C.yellow + 'Gracze dyskutuja -- kazdy oskarzja kazdego...' + C.reset);

    // ── GLOSOWANIE ────────────────────────────────────────────────────────────
    console.log('\n  ' + C.bold + 'GLOSOWANIE:' + C.reset);
    gm.startVoting(room.code);

    const tally = {};
    for (const voter of aliveDay) {
      const isDet      = aliveDetDay.some((d) => d.id === voter.id);
      const smartVote  = isDet && Math.random() < 0.6 && aliveMafiaD.length > 0;
      const candidates = aliveDay.filter((p) => p.id !== voter.id);
      const target     = smartVote ? randomPick(aliveMafiaD) : randomPick(candidates);

      gm.recordVote(room.code, voter.id, target.id);
      tally[target.id] = (tally[target.id] || 0) + 1;

      console.log(
        '    ' + C.bold + voter.nick.padEnd(10) + C.reset +
        ' glosuje na ' + C.bold + target.nick + C.reset +
        (smartVote ? '  ' + C.cyan + '<-- detektyw wie!' + C.reset : '')
      );
    }

    // Tally bar chart
    console.log('\n  ' + C.bold + 'Wyniki glosowania:' + C.reset);
    const sorted = Object.entries(tally)
      .map(([id, v]) => ({ p: room.players[id], v }))
      .sort((a, b) => b.v - a.v);
    const maxV = sorted[0] ? sorted[0].v : 1;
    for (const { p, v } of sorted) {
      const bar = '#'.repeat(Math.round((v / maxV) * 14)).padEnd(14);
      console.log('    ' + C.bold + p.nick.padEnd(10) + C.reset + ' ' + C.yellow + bar + C.reset + ' ' + v);
    }

    const { eliminated, tie } = gm.resolveVoting(room.code);
    console.log();

    if (tie) {
      console.log('  ' + C.yellow + C.bold + 'REMIS! Nikt nie ginie.' + C.reset);
    } else if (eliminated) {
      const wasMafia = eliminated.role === ROLES.MAFIA;
      console.log(
        '  ' + C.bold + eliminated.nick + C.reset + ' zostaje wyeliminowany!\n' +
        '  Rola: ' + rc(eliminated.role) + C.bold + ri(eliminated.role) + C.reset + '  ' +
        (wasMafia
          ? C.green + C.bold + '<-- TRAFIONY! Dobra robota!'
          : C.red   + C.bold + '<-- NIEWINNY! Zly wybor...') + C.reset
      );
    } else {
      console.log('  ' + C.yellow + 'Za malo glosow -- nikt nie ginie.' + C.reset);
    }

    winner = gm.checkWinCondition(room.code);
  }

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (!winner && round >= MAX_ROUNDS) {
    header('LIMIT ' + MAX_ROUNDS + ' RUND -- KONIEC DEMO', C.dim);
    console.log('  (W prawdziwej grze trwa do konca.)');
  } else {
    const vill = winner === 'villagers';
    header(vill ? 'MIESZKANCY WYGRYWAJA!' : 'MAFIA ZWYCIEEZA!', vill ? C.green : C.red);
    console.log(
      vill
        ? '\n  ' + C.green + 'Wszystkie mafie wyeliminowane. Spokoj wraca do miasta.' + C.reset
        : '\n  ' + C.red   + 'Mafia przejela kontrole. Nikt nie jest bezpieczny.'    + C.reset
    );
  }

  // Final reveal
  console.log('\n  ' + C.bold + 'Pelne ujawnienie rol:' + C.reset);
  console.log('  ' + C.dim + '.'.repeat(42) + C.reset);
  for (const p of all()) {
    const statusStr = p.isAlive ? C.green + 'zywy  ' : C.red + 'martwy';
    console.log(
      '  ' + statusStr + C.reset + ' ' +
      C.bold + p.nick.padEnd(10) + C.reset + ' ' +
      rc(p.role) + C.bold + ri(p.role) + C.reset +
      (p.isHost ? '  ' + C.yellow + '*HOST*' + C.reset : '')
    );
  }

  console.log('\n' + HR + '\n');
}

simulate();
