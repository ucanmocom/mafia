'use strict';

const { v4: uuidv4 } = require('uuid');
const { ROLES, ROLE_DESCRIPTIONS, PHASES, TIMERS } = require('./types');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── GameManager ─────────────────────────────────────────────────────────────
class GameManager {
  constructor() {
    /** @type {Map<string, Room>} roomCode → room */
    this.rooms = new Map();
  }

  // ── Room lifecycle ──────────────────────────────────────────────────────────

  /**
   * Creates a new room.
   * @param {string} hostNick
   * @returns {{ room: Room, player: Player }}
   */
  createRoom(hostNick) {
    let code;
    do { code = generateRoomCode(); } while (this.rooms.has(code));

    const playerId = uuidv4();
    const player = {
      id: playerId,
      nick: hostNick,
      role: null,
      isAlive: true,
      isConnected: true,
      isHost: true,
      ws: null,            // transient – not serialised
      afkTimer: null,      // transient
    };

    const room = {
      code,
      hostId: playerId,
      players: { [playerId]: player },
      settings: {
        mafiaCount: 1,
        doctorCount: 1,
        detectiveCount: 1,
        loversCount: 0,       // 0 = off, 1 = one pair of lovers
        dayDuration: 120_000, // ms
        nightDuration: 60_000, // ms
      },
      phase: PHASES.LOBBY,
      round: 0,
      nightActions: this._emptyNightActions(),
      votes: {},           // playerId → targetId
      nightResult: null,   // { killed: id | null }
      voteResult: null,    // { eliminated: id | null, role: string | null, tie: bool }
      winner: null,
      createdAt: Date.now(),
      phaseTimer: null,       // transient handle
      hostMigrateTimer: null, // transient handle
      skipDayVotes: {},       // playerId → true
      loverIds: null,           // [id1, id2] or null
    };

    this.rooms.set(code, room);
    return { room, player };
  }

  /**
   * Adds a player to existing room.
   * @returns {{ room: Room, player: Player } | { error: string }}
   */
  joinRoom(roomCode, nick) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.phase !== PHASES.LOBBY) return { error: 'Gra już trwa.' };

    const nickTaken = Object.values(room.players).some(
      (p) => p.nick.toLowerCase() === nick.toLowerCase()
    );
    if (nickTaken) return { error: 'Nick jest już zajęty.' };

    if (Object.keys(room.players).length >= 20) return { error: 'Pokój jest pełny.' };

    const playerId = uuidv4();
    const player = {
      id: playerId,
      nick,
      role: null,
      isAlive: true,
      isConnected: true,
      isHost: false,
      ws: null,
      afkTimer: null,
    };

    room.players[playerId] = player;
    return { room, player };
  }

  /**
   * Reconnects a player by existing playerId.
   * @returns {{ room: Room, player: Player } | { error: string }}
   */
  rejoinRoom(roomCode, playerId) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return { error: 'Pokój nie istnieje.' };
    const player = room.players[playerId];
    if (!player) return { error: 'Gracz nie znaleziony.' };
    player.isConnected = true;
    return { room, player };
  }

  // ── Kick player ─────────────────────────────────────────────────────────────

  kickPlayer(roomCode, hostId, targetId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.hostId !== hostId) return { error: 'Tylko host może wyrzucać graczy.' };
    if (room.phase !== PHASES.LOBBY) return { error: 'Można wyrzucać tylko w poczekalni.' };
    if (targetId === hostId) return { error: 'Nie możesz wyrzucić samego siebie.' };
    const target = room.players[targetId];
    if (!target) return { error: 'Gracz nie znaleziony.' };
    delete room.players[targetId];
    return { room, kickedPlayer: target };
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  updateSettings(roomCode, playerId, settings) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.hostId !== playerId) return { error: 'Tylko host może zmieniać ustawienia.' };
    if (room.phase !== PHASES.LOBBY) return { error: 'Gra już trwa.' };

    const { mafiaCount, doctorCount, detectiveCount, loversCount, dayDuration, nightDuration } = settings;
    const playerCount = Object.keys(room.players).length;
    const newMafia = mafiaCount ?? room.settings.mafiaCount;
    const total = newMafia
                + (doctorCount  ?? room.settings.doctorCount)
                + (detectiveCount ?? room.settings.detectiveCount);

    if (total >= playerCount) {
      return { error: 'Za mało mieszkańców. Zmniejsz liczbę ról specjalnych.' };
    }
    if (newMafia > 1 && playerCount < 6) {
      return { error: 'Przy więcej niż 1 mafiozie potrzeba co najmniej 6 graczy.' };
    }
    if (loversCount !== undefined && loversCount !== 0 && loversCount !== 1) {
      return { error: 'Zakochani: max 1 para (0 lub 1).' };
    }

    if (mafiaCount     !== undefined) room.settings.mafiaCount     = mafiaCount;
    if (doctorCount    !== undefined) room.settings.doctorCount    = doctorCount;
    if (detectiveCount !== undefined) room.settings.detectiveCount = detectiveCount;
    if (loversCount    !== undefined) room.settings.loversCount    = loversCount;
    if (dayDuration    !== undefined) room.settings.dayDuration    = dayDuration;
    if (nightDuration  !== undefined) room.settings.nightDuration  = nightDuration;

    return { room };
  }

  // ── Game start ──────────────────────────────────────────────────────────────

  startGame(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.hostId !== playerId) return { error: 'Tylko host może rozpocząć grę.' };
    if (room.phase !== PHASES.LOBBY) return { error: 'Gra już trwa.' };

    const playerList = Object.values(room.players);
    if (playerList.length < 4) return { error: 'Potrzeba co najmniej 4 graczy.' };

    const { mafiaCount, doctorCount, detectiveCount } = room.settings;
    const total = mafiaCount + doctorCount + detectiveCount;
    if (total >= playerList.length) {
      return { error: 'Za mało mieszkańców. Dostosuj ustawienia.' };
    }

    // Assign roles
    const roles = [
      ...Array(mafiaCount).fill(ROLES.MAFIA),
      ...Array(doctorCount).fill(ROLES.DOCTOR),
      ...Array(detectiveCount).fill(ROLES.DETECTIVE),
      ...Array(playerList.length - total).fill(ROLES.VILLAGER),
    ];
    const shuffled = shuffle(roles);
    playerList.forEach((p, i) => {
      p.role = shuffled[i];
      p.isAlive = true;
      p.loverId = null;
    });

    // Assign lovers pair (if enabled)
    room.loverIds = null;
    const { loversCount } = room.settings;
    if (loversCount >= 1 && playerList.length >= 2) {
      const shuffledForLovers = shuffle([...playerList]);
      const l1 = shuffledForLovers[0];
      const l2 = shuffledForLovers[1];
      l1.loverId = l2.id;
      l2.loverId = l1.id;
      room.loverIds = [l1.id, l2.id];
    }

    room.phase = PHASES.ROLE_REVEAL;
    room.round = 0;

    return { room };
  }

  // ── Reset to lobby ──────────────────────────────────────────────────────────

  resetToLobby(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };

    // Reset all players
    Object.values(room.players).forEach(p => {
      p.role = null;
      p.isAlive = true;
      p.loverId = null;
    });

    // Reset room state
    room.phase = PHASES.LOBBY;
    room.round = 0;
    room.nightActions = this._emptyNightActions();
    room.votes = {};
    room.nightResult = null;
    room.voteResult = null;
    room.winner = null;
    room.skipDayVotes = {};
    room.loverIds = null;

    return { room };
  }

  // ── Night phase ─────────────────────────────────────────────────────────────

  startNight(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    room.phase = PHASES.NIGHT;
    room.round += 1;
    room.nightActions = this._emptyNightActions();
    return { room };
  }

  /**
   * Records a night action.
   * role: detective → { targetId } → respond with { isMafia }
   * role: doctor    → { targetId }
   * role: mafia     → { targetId } (vote, majority decides)
   */
  recordNightAction(roomCode, playerId, targetId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.phase !== PHASES.NIGHT) return { error: 'Nie jest teraz noc.' };

    const player = room.players[playerId];
    if (!player || !player.isAlive) return { error: 'Nie możesz działać.' };

    const target = room.players[targetId];
    if (!target || !target.isAlive) return { error: 'Cel nie istnieje lub nie żyje.' };

    switch (player.role) {
      case ROLES.DETECTIVE:
        room.nightActions.detectiveTargets[playerId] = targetId;
        break;
      case ROLES.DOCTOR:
        room.nightActions.doctorTarget = targetId;
        break;
      case ROLES.MAFIA:
        room.nightActions.mafiaVotes[playerId] = targetId;
        break;
      default:
        return { error: 'Twoja rola nie ma akcji nocnej.' };
    }

    return { room, player, target };
  }

  /**
   * Checks if all required night actions are done.
   * Mafia: majority vote (>50%) among alive mafia members.
   */
  isNightComplete(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const alive = Object.values(room.players).filter((p) => p.isAlive);

    const aliveMafia     = alive.filter((p) => p.role === ROLES.MAFIA);
    const aliveDoctor    = alive.filter((p) => p.role === ROLES.DOCTOR);
    const aliveDetective = alive.filter((p) => p.role === ROLES.DETECTIVE);

    // Mafia majority
    if (aliveMafia.length > 0) {
      const mafiaChoice = this._getMafiaMajorityTarget(room);
      if (!mafiaChoice) return false;
    }

    // Doctor must act
    if (aliveDoctor.length > 0 && !room.nightActions.doctorTarget) return false;

    // All alive detectives must act
    if (aliveDetective.length > 0) {
      const picked = Object.keys(room.nightActions.detectiveTargets).length;
      if (picked < aliveDetective.length) return false;
    }

    return true;
  }

  /**
   * Resolves the night: applies kills / heals and advances to NIGHT_RESULT.
   * @returns {{ room, killed: Player|null, detectiveResult: {target: Player, isMafia: bool}|null }}
   */
  resolveNight(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };

    const { targetId: mafiaTargetId, wasRandom } = this._getMafiaMajorityTarget(room);
    const doctorTarget = room.nightActions.doctorTarget;
    const detectiveTargets = room.nightActions.detectiveTargets; // { detectiveId → targetId }

    let killed = null;
    if (mafiaTargetId && mafiaTargetId !== doctorTarget) {
      room.players[mafiaTargetId].isAlive = false;
      killed = room.players[mafiaTargetId];
    }

    // Per-detective private results
    const detectiveResults = [];
    for (const [detId, targetId] of Object.entries(detectiveTargets)) {
      const t = room.players[targetId];
      if (t) detectiveResults.push({ detectiveId: detId, target: t, isMafia: t.role === ROLES.MAFIA });
    }

    // Lover chain death — if killed has a lover, they die too
    const loverKilled = killed ? this._killLoverOf(room, killed.id) : null;

    const mafiaTarget = mafiaTargetId ? room.players[mafiaTargetId] : null;
    room.nightResult = { killedId: killed ? killed.id : null };
    room.phase = PHASES.NIGHT_RESULT;

    return { room, killed, detectiveResults, loverKilled, wasRandom, mafiaTarget };
  }

  // ── Day phase ───────────────────────────────────────────────────────────────

  startDay(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    room.phase = PHASES.DAY;
    room.votes = {};
    room.skipDayVotes = {};
    return { room };
  }
  // ── Day skip ───────────────────────────────────────────────────────────────

  /**
   * Records a vote to skip the day discussion.
   * Returns { room, skipCount, needed, triggered } where triggered=true when threshold hit.
   */
  recordSkipDayVote(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.phase !== PHASES.DAY) return { error: 'Nie trwa dzień.' };
    const player = room.players[playerId];
    if (!player || !player.isAlive) return { error: 'Nie możesz głosować.' };

    room.skipDayVotes[playerId] = true;

    const alive = Object.values(room.players).filter((p) => p.isAlive).length;
    const skipCount = Object.keys(room.skipDayVotes).length;
    const needed = Math.ceil(alive * 0.6);
    const triggered = skipCount >= needed;

    if (triggered) {
      room.phase = PHASES.VOTING;
      room.votes = {};
      room.skipDayVotes = {};
    }

    return { room, skipCount, needed, triggered };
  }
  // ── Voting ──────────────────────────────────────────────────────────────────

  startVoting(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    room.phase = PHASES.VOTING;
    room.votes = {};
    return { room };
  }

  recordVote(roomCode, voterId, targetId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };
    if (room.phase !== PHASES.VOTING) return { error: 'Głosowanie nie jest aktywne.' };

    const voter = room.players[voterId];
    if (!voter || !voter.isAlive) return { error: 'Nie możesz głosować.' };

    // 'skip' is a valid vote (abstain)
    if (targetId !== 'skip') {
      const target = room.players[targetId];
      if (!target || !target.isAlive) return { error: 'Cel nie istnieje lub nie żyje.' };
      // Lovers cannot vote for each other
      if (voter.loverId && voter.loverId === targetId) {
        return { error: 'Nie możesz głosować na swojego ukochanego. 💔' };
      }
    }

    room.votes[voterId] = targetId;
    return { room };
  }

  /**
   * Resolves voting: plurality wins.
   * 'skip' votes count as abstain – if skip has the most votes, nobody is eliminated.
   */
  resolveVoting(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Pokój nie istnieje.' };

    const tally = {};
    for (const targetId of Object.values(room.votes)) {
      tally[targetId] = (tally[targetId] || 0) + 1;
    }

    let maxVotes = 0;
    let topCandidates = [];
    for (const [id, count] of Object.entries(tally)) {
      if (count > maxVotes) { maxVotes = count; topCandidates = [id]; }
      else if (count === maxVotes) topCandidates.push(id);
    }

    // tie among multiple real players, or skip wins/ties → no elimination
    const tie = topCandidates.length > 1;
    const skipWins = topCandidates.includes('skip');
    let eliminated = null;

    if (!tie && !skipWins && topCandidates.length === 1) {
      const candidate = room.players[topCandidates[0]];
      if (candidate) {
        candidate.isAlive = false;
        eliminated = candidate;
      }
    }

    // Lover chain death — if eliminated has a lover, they die too
    const loverEliminated = eliminated ? this._killLoverOf(room, eliminated.id) : null;

    room.voteResult = {
      eliminatedId:       eliminated      ? eliminated.id      : null,
      eliminatedNick:     eliminated      ? eliminated.nick     : null,
      role:               eliminated      ? eliminated.role     : null,
      tie:                tie || skipWins,
      tally,
      loverEliminatedId:   loverEliminated ? loverEliminated.id   : null,
      loverEliminatedNick: loverEliminated ? loverEliminated.nick : null,
      loverEliminatedRole: loverEliminated ? loverEliminated.role : null,
    };
    room.phase = PHASES.VOTE_RESULT;

    return { room, eliminated, tie: tie || skipWins, loverEliminated };
  }

  // ── Win condition ───────────────────────────────────────────────────────────

  checkWinCondition(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const alive = Object.values(room.players).filter((p) => p.isAlive);
    const aliveMafia     = alive.filter((p) => p.role === ROLES.MAFIA).length;
    const aliveNonMafia  = alive.length - aliveMafia;

    if (aliveMafia === 0) {
      room.winner = 'villagers';
      room.phase  = PHASES.GAME_OVER;
      return 'villagers';
    }
    if (aliveMafia >= aliveNonMafia) {
      room.winner = 'mafia';
      room.phase  = PHASES.GAME_OVER;
      return 'mafia';
    }
    return null;
  }

  // ── Host migration ──────────────────────────────────────────────────────────

  migrateHost(room) {
    const connected = Object.values(room.players).filter(
      (p) => p.isConnected && p.id !== room.hostId
    );
    if (connected.length === 0) return null;
    const newHost = connected[0];
    room.players[room.hostId].isHost = false; // old host flag off first
    newHost.isHost = true;
    room.hostId = newHost.id;
    return newHost;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _emptyNightActions() {
    return { detectiveTargets: {}, doctorTarget: null, mafiaVotes: {} };
  }

  /**
   * If the killed player has a living lover, kill the lover too and return them.
   * @returns {Player|null}
   */
  _killLoverOf(room, killedId) {
    const dead = room.players[killedId];
    if (!dead || !dead.loverId) return null;
    const lover = room.players[dead.loverId];
    if (!lover || !lover.isAlive) return null;
    lover.isAlive = false;
    return lover;
  }

  _getMafiaMajorityTarget(room) {
    const aliveMafia = Object.values(room.players).filter(
      (p) => p.isAlive && p.role === ROLES.MAFIA
    );
    if (aliveMafia.length === 0) return { targetId: null, wasRandom: false };

    const tally = {};
    for (const vote of Object.values(room.nightActions.mafiaVotes)) {
      tally[vote] = (tally[vote] || 0) + 1;
    }
    const needed = Math.floor(aliveMafia.length / 2) + 1;
    for (const [id, count] of Object.entries(tally)) {
      if (count >= needed) return { targetId: id, wasRandom: false };
    }

    // Brak większości – losuj spośród głosowanych
    const votedTargets = Object.keys(tally);
    if (votedTargets.length === 0) return { targetId: null, wasRandom: false };
    const randomTarget = votedTargets[Math.floor(Math.random() * votedTargets.length)];
    return { targetId: randomTarget, wasRandom: true };
  }

  // ── Public helpers ──────────────────────────────────────────────────────────

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase()) || null;
  }

  getRoleInfo(role) {
    return { role, description: ROLE_DESCRIPTIONS[role] };
  }

  /** Returns serialisable snapshot (strips transient ws / timers) */
  serialise() {
    const data = {};
    for (const [code, room] of this.rooms.entries()) {
      const r = { ...room, phaseTimer: undefined };
      const players = {};
      for (const [id, p] of Object.entries(room.players)) {
        players[id] = { ...p, ws: undefined, afkTimer: undefined };
      }
      r.players = players;
      data[code] = r;
    }
    return data;
  }

  /** Loads rooms from deserialised JSON, pruning stale rooms */
  deserialise(data) {
    const cutoff = Date.now() - TIMERS.ROOM_MAX_AGE_MS;
    for (const [code, room] of Object.entries(data)) {
      if (room.createdAt < cutoff) continue;          // prune old rooms
      if (room.phase === PHASES.GAME_OVER) continue;  // finished games
      // Restore transient fields
      for (const p of Object.values(room.players)) {
        p.ws = null;
        p.afkTimer = null;
        p.isConnected = false; // all offline until they reconnect
      }
      room.phaseTimer = null;
      room.hostMigrateTimer = null;
      room.skipDayVotes = room.skipDayVotes || {};
      this.rooms.set(code, room);
    }
  }
}

module.exports = GameManager;
