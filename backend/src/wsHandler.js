'use strict';

const { EVENTS, PHASES, TIMERS, ROLES } = require('./types');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function send(ws, event, payload = {}) {
  if (ws && ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify({ event, ...payload }));
  }
}

function broadcast(room, event, payload = {}, excludeId = null) {
  for (const player of Object.values(room.players)) {
    if (excludeId && player.id === excludeId) continue;
    send(player.ws, event, payload);
  }
}

/** Broadcasts room state (lobby view) to all players */
function broadcastRoomUpdate(room) {
  const publicPlayers = publicPlayersView(room);
  broadcast(room, EVENTS.ROOM_UPDATE, {
    roomCode: room.code,
    players:  publicPlayers,
    settings: room.settings,
    phase:    room.phase,
    hostId:   room.hostId,
    round:    room.round,
  });
}

/** Strips private info (role) from players for public broadcast */
function publicPlayersView(room) {
  return Object.values(room.players).map((p) => ({
    id:          p.id,
    nick:        p.nick,
    isAlive:     p.isAlive,
    isHost:      p.isHost,
    isConnected: p.isConnected,
  }));
}

/** Sends role info privately to each player */
function sendRoles(room) {
  const mafiaIds = Object.values(room.players)
    .filter((p) => p.role === ROLES.MAFIA).map((p) => ({ id: p.id, nick: p.nick }));

  for (const player of Object.values(room.players)) {
    const allies = player.role === ROLES.MAFIA ? mafiaIds.filter((m) => m.id !== player.id) : [];
    const loverNick = player.loverId ? (room.players[player.loverId]?.nick ?? null) : null;
    const loverId = player.loverId || null;
    send(player.ws, EVENTS.ROLE_ASSIGNED, {
      role:        player.role,
      description: require('./types').ROLE_DESCRIPTIONS[player.role],
      allies,
      loverNick,
      loverId,
    });
  }
}

// ─── Phase flow ───────────────────────────────────────────────────────────────

function clearPhaseTimer(room) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

/**
 * Central phase scheduler.
 * After role reveal → triggers NIGHT automatically.
 * After night result → triggers DAY.
 * After vote result → checks win or goes to NIGHT.
 */
function scheduleNextPhase(room, gameManager) {
  clearPhaseTimer(room);
  const dayDuration = room.settings?.dayDuration || TIMERS.DAY_DURATION;
  const nightDuration = room.settings?.nightDuration || TIMERS.NIGHT_ACTION_TIMEOUT;

  switch (room.phase) {
    case PHASES.ROLE_REVEAL:
      room.phaseTimer = setTimeout(() => {
        triggerNight(room, gameManager);
      }, TIMERS.ROLE_REVEAL_DURATION);
      break;

    case PHASES.NIGHT_RESULT:
      room.phaseTimer = setTimeout(() => {
        const winner = gameManager.checkWinCondition(room.code);
        if (winner) {
          broadcastGameOver(room, winner);
        } else {
          triggerDay(room, gameManager);
        }
      }, TIMERS.NIGHT_RESULT_DURATION);
      break;

    case PHASES.VOTE_RESULT:
      room.phaseTimer = setTimeout(() => {
        const winner = gameManager.checkWinCondition(room.code);
        if (winner) {
          broadcastGameOver(room, winner);
        } else {
          triggerNight(room, gameManager);
        }
      }, TIMERS.VOTE_RESULT_DURATION);
      break;

    case PHASES.VOTE_SUMMARY:
      room.phaseTimer = setTimeout(() => {
        // Show vote result after summary
        room.phase = PHASES.VOTE_RESULT;
        broadcast(room, EVENTS.PLAYER_ELIMINATED, {
          phase:               PHASES.VOTE_RESULT,
          eliminatedId:        room.voteResult.eliminatedId,
          eliminatedNick:      room.voteResult.eliminatedNick,
          role:                room.voteResult.role,
          tie:                 room.voteResult.tie,
          tally:               room.voteResult.tally,
          loverEliminatedId:   room.voteResult.loverEliminatedId   ?? null,
          loverEliminatedNick: room.voteResult.loverEliminatedNick ?? null,
          loverEliminatedRole: room.voteResult.loverEliminatedRole ?? null,
        });
        scheduleNextPhase(room, gameManager);
      }, 10_000); // 10s to show vote summary
      break;

    case PHASES.NIGHT:
      // AFK safety net: auto-resolve after timeout
      room.phaseTimer = setTimeout(() => {
        autoFillNightActions(room, gameManager);
        doResolveNight(room, gameManager);
      }, nightDuration);
      break;

    case PHASES.DAY:
      room.phaseTimer = setTimeout(() => {
        triggerVoting(room, gameManager);
      }, dayDuration);
      break;

    case PHASES.VOTING:
      room.phaseTimer = setTimeout(() => {
        doResolveVoting(room, gameManager);
      }, TIMERS.VOTING_DURATION);
      break;
  }
}

// ── Trigger helpers ────────────────────────────────────────────────────────────

function triggerNight(room, gameManager) {
  gameManager.startNight(room.code);
  broadcast(room, EVENTS.PHASE_CHANGE, {
    phase: PHASES.NIGHT,
    round: room.round,
    alivePlayers: publicPlayersView(room),
  });
  scheduleNextPhase(room, gameManager);
}

function triggerDay(room, gameManager) {
  gameManager.startDay(room.code);
  broadcast(room, EVENTS.PHASE_CHANGE, {
    phase: PHASES.DAY,
    round: room.round,
    alivePlayers: publicPlayersView(room),
  });
  scheduleNextPhase(room, gameManager);
}

function triggerVoting(room, gameManager) {
  gameManager.startVoting(room.code);
  broadcast(room, EVENTS.PHASE_CHANGE, {
    phase: PHASES.VOTING,
    alivePlayers: publicPlayersView(room),
  });
  scheduleNextPhase(room, gameManager);
}

function doResolveNight(room, gameManager) {
  if (room.phase !== PHASES.NIGHT) return; // guard: prevent double-resolve
  clearPhaseTimer(room);
  const { killed, detectiveResult, loverKilled, wasRandom, mafiaTarget } = gameManager.resolveNight(room.code);

  // Prywatna wiadomość do mafii gdy głosy były podzielone i wylosowano ofiarę
  if (wasRandom && mafiaTarget) {
    const aliveMafia = Object.values(room.players).filter(
      (p) => p.role === ROLES.MAFIA
    );
    for (const mafioso of aliveMafia) {
      send(mafioso.ws, EVENTS.MAFIA_RANDOM_KILL, {
        targetNick: mafiaTarget.nick,
        saved: killed === null,
      });
    }
  }

  // Send shared detective result to all alive detectives
  if (detectiveResult) {
    const aliveDetectives = Object.values(room.players).filter(
      (p) => p.role === ROLES.DETECTIVE && p.isAlive
    );
    for (const det of aliveDetectives) {
      send(det.ws, EVENTS.NIGHT_RESULT, {
        personal:   true,
        isMafia:    detectiveResult.isMafia,
        targetNick: detectiveResult.target.nick,
      });
    }
  }

  // Everyone gets public night result
  broadcast(room, EVENTS.NIGHT_RESULT, {
    personal:        false,
    killedId:        killed      ? killed.id       : null,
    killedNick:      killed      ? killed.nick      : null,
    loverKilledId:   loverKilled ? loverKilled.id   : null,
    loverKilledNick: loverKilled ? loverKilled.nick : null,
    phase: PHASES.NIGHT_RESULT,
  });

  scheduleNextPhase(room, gameManager);
}

function doResolveVoting(room, gameManager) {
  clearPhaseTimer(room);
  const { eliminated, tie, loverEliminated } = gameManager.resolveVoting(room.code);

  // Build vote display: voter nick → target nick
  const voteDisplay = {};
  for (const [voterId, targetId] of Object.entries(room.votes)) {
    const voter = room.players[voterId];
    if (!voter) continue;
    if (targetId === 'skip') {
      voteDisplay[voter.nick] = '⏭ Pomiń';
    } else {
      const target = room.players[targetId];
      if (target) voteDisplay[voter.nick] = target.nick;
    }
  }

  // Store result for later (loverEliminated already saved by resolveVoting into room.voteResult)
  room.voteResult.eliminatedId   = eliminated ? eliminated.id   : null;
  room.voteResult.eliminatedNick = eliminated ? eliminated.nick : null;

  // Show vote summary first
  room.phase = PHASES.VOTE_SUMMARY;
  broadcast(room, EVENTS.VOTE_SUMMARY, {
    phase: PHASES.VOTE_SUMMARY,
    votes: voteDisplay,
    tally: room.voteResult.tally,
  });
  scheduleNextPhase(room, gameManager);
}

function broadcastGameOver(room, winner) {
  clearPhaseTimer(room);
  // Reveal all roles on game over
  const reveal = Object.values(room.players).map((p) => ({
    id:      p.id,
    nick:    p.nick,
    role:    p.role,
    isAlive: p.isAlive,
  }));
  broadcast(room, EVENTS.GAME_OVER, { winner, players: reveal });
}

/** Auto-fill missing night actions with random valid targets to prevent stall */
function autoFillNightActions(room, gameManager) {
  const alive = Object.values(room.players).filter((p) => p.isAlive);

  for (const player of alive) {
    if (player.role === ROLES.MAFIA && !room.nightActions.mafiaVotes[player.id]) {
      const targets = alive.filter(
        (p) => p.id !== player.id && p.role !== ROLES.MAFIA
      );
      if (targets.length)
        room.nightActions.mafiaVotes[player.id] = targets[Math.floor(Math.random() * targets.length)].id;
    }
    if (player.role === ROLES.DOCTOR && !room.nightActions.doctorTargets[player.id]) {
      room.nightActions.doctorTargets[player.id] = alive[Math.floor(Math.random() * alive.length)].id;
    }
    if (player.role === ROLES.DETECTIVE && !room.nightActions.detectiveTargets[player.id]) {
      const targets = alive.filter((p) => p.id !== player.id);
      if (targets.length)
        room.nightActions.detectiveTargets[player.id] = targets[Math.floor(Math.random() * targets.length)].id;
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Attaches WebSocket message/close handlers.
 * @param {import('ws').WebSocket} ws
 * @param {import('./GameManager')} gameManager
 */
function handleConnection(ws, gameManager) {
  let currentPlayerId = null;
  let currentRoomCode = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return send(ws, EVENTS.ERROR, { message: 'Nieprawidłowy format wiadomości.' }); }

    const { event, ...data } = msg;

    switch (event) {

      // ── CREATE ROOM ─────────────────────────────────────────────────────────
      case EVENTS.CREATE_ROOM: {
        const nick = (data.nick || '').trim();
        if (!nick) return send(ws, EVENTS.ERROR, { message: 'Nick jest wymagany.' });

        const { room, player } = gameManager.createRoom(nick);
        player.ws = ws;
        currentPlayerId = player.id;
        currentRoomCode = room.code;

        send(ws, EVENTS.ROOM_UPDATE, {
          roomCode: room.code,
          playerId: player.id,
          players:  publicPlayersView(room),
          settings: room.settings,
          phase:    room.phase,
          hostId:   room.hostId,
          round:    room.round,
        });
        break;
      }

      // ── JOIN ROOM ───────────────────────────────────────────────────────────
      case EVENTS.JOIN_ROOM: {
        const nick     = (data.nick || '').trim();
        const roomCode = (data.roomCode || '').trim().toUpperCase();
        if (!nick)     return send(ws, EVENTS.ERROR, { message: 'Nick jest wymagany.' });
        if (!roomCode) return send(ws, EVENTS.ERROR, { message: 'Kod pokoju jest wymagany.' });

        const result = gameManager.joinRoom(roomCode, nick);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });

        const { room, player } = result;
        player.ws = ws;
        currentPlayerId = player.id;
        currentRoomCode = room.code;

        // Confirm to joiner (with playerId for localStorage)
        send(ws, EVENTS.ROOM_UPDATE, {
          roomCode: room.code,
          playerId: player.id,
          players:  publicPlayersView(room),
          settings: room.settings,
          phase:    room.phase,
          hostId:   room.hostId,
          round:    room.round,
        });

        // Notify others
        broadcast(room, EVENTS.ROOM_UPDATE, {
          roomCode: room.code,
          players:  publicPlayersView(room),
          settings: room.settings,
          phase:    room.phase,
          hostId:   room.hostId,
          round:    room.round,
        }, player.id);
        break;
      }

      // ── REJOIN ──────────────────────────────────────────────────────────────
      case EVENTS.REJOIN: {
        const roomCode = (data.roomCode || '').trim().toUpperCase();
        const playerId = (data.playerId || '').trim();

        const result = gameManager.rejoinRoom(roomCode, playerId);
        if (result.error) return send(ws, 'rejoin_failed', { message: result.error });

        const { room, player } = result;
        player.ws = ws;
        currentPlayerId = player.id;
        currentRoomCode = room.code;

        // Cancel pending host migration if host reconnected in time
        if (room.hostId === player.id && room.hostMigrateTimer) {
          clearTimeout(room.hostMigrateTimer);
          room.hostMigrateTimer = null;
        }

        // Private: restore session with role if game in progress
        send(ws, EVENTS.RECONNECTED, {
          roomCode:  room.code,
          playerId:  player.id,
          phase:     room.phase,
          round:     room.round,
          role:      player.role,
          roleDescription: player.role ? require('./types').ROLE_DESCRIPTIONS[player.role] : null,
          settings:  room.settings,
          hostId:    room.hostId,
          players:   publicPlayersView(room),
          nightResult: room.nightResult,
          votes:     room.votes,
          winner:    room.winner,
        });

        // Public: notify room
        broadcastRoomUpdate(room);
        break;
      }

      // ── LEAVE ROOM ─────────────────────────────────────────────────────────
      case EVENTS.LEAVE_ROOM: {
        if (!currentRoomCode) break;
        const leaveRoom = gameManager.getRoom(currentRoomCode);
        if (!leaveRoom) break;

        const leavingPlayer = leaveRoom.players[currentPlayerId];
        if (!leavingPlayer) break;

        // Remove the player from the room entirely
        delete leaveRoom.players[currentPlayerId];

        // If nobody left – clean up the room
        if (Object.keys(leaveRoom.players).length === 0) {
          clearPhaseTimer(leaveRoom);
          gameManager.rooms.delete(currentRoomCode);
          break;
        }

        // If the leaver was the host – migrate immediately
        if (leaveRoom.hostId === currentPlayerId) {
          if (leaveRoom.hostMigrateTimer) {
            clearTimeout(leaveRoom.hostMigrateTimer);
            leaveRoom.hostMigrateTimer = null;
          }
          gameManager.migrateHost(leaveRoom);
        }

        // Always broadcast the updated room to remaining players
        broadcastRoomUpdate(leaveRoom);

        // If an in-progress phase can now complete, resolve it
        if (leaveRoom.phase === PHASES.VOTING) {
          const eligibleVoters = Object.values(leaveRoom.players).filter(
            (p) => p.isAlive && p.isConnected !== false
          );
          const votedCount = Object.keys(leaveRoom.votes).filter((vid) => {
            const v = leaveRoom.players[vid];
            return v && v.isAlive && v.isConnected !== false;
          }).length;
          if (eligibleVoters.length > 0 && votedCount >= eligibleVoters.length) {
            doResolveVoting(leaveRoom, gameManager);
          }
        }

        // Clean up the leaving ws so close handler doesn't double-process
        currentRoomCode = null;
        currentPlayerId = null;
        break;
      }

      // ── KICK PLAYER ────────────────────────────────────────────────────────
      case EVENTS.KICK_PLAYER: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        if (!data.targetId) return send(ws, EVENTS.ERROR, { message: 'Brak ID gracza do wyrzucenia.' });
        console.log('[kick] roomCode=%s hostId=%s targetId=%s', currentRoomCode, currentPlayerId, data.targetId);
        const room0 = gameManager.getRoom(currentRoomCode);
        if (room0) console.log('[kick] players in room:', Object.keys(room0.players));
        const result = gameManager.kickPlayer(currentRoomCode, currentPlayerId, data.targetId);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });
        const { room: kickRoom, kickedPlayer } = result;
        // Tell kicked player they were removed
        send(kickedPlayer.ws, EVENTS.ERROR, { message: 'Zostałeś wyrzucony przez hosta.' });
        send(kickedPlayer.ws, 'kicked', {});
        if (kickedPlayer.ws) try { kickedPlayer.ws.close(); } catch (_) {}
        broadcastRoomUpdate(kickRoom);
        break;
      }

      // ── UPDATE SETTINGS ────────────────────────────────────────────────────
      case EVENTS.UPDATE_SETTINGS: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.updateSettings(currentRoomCode, currentPlayerId, data);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });
        broadcastRoomUpdate(result.room);
        break;
      }

      // ── START GAME ─────────────────────────────────────────────────────────
      case EVENTS.START_GAME: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.startGame(currentRoomCode, currentPlayerId);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });

        const room = result.room;

        // Broadcast phase change to ROLE_REVEAL
        broadcast(room, EVENTS.PHASE_CHANGE, { phase: PHASES.ROLE_REVEAL });

        // Send each player their secret role
        sendRoles(room);

        // Schedule auto-transition to NIGHT after ROLE_REVEAL_DURATION
        scheduleNextPhase(room, gameManager);
        break;
      }

      // ── RESET TO LOBBY ──────────────────────────────────────────────────────
      case EVENTS.RESET_TO_LOBBY: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.resetToLobby(currentRoomCode);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });

        const room = result.room;

        // Broadcast room update to all players in the room
        broadcast(room, EVENTS.ROOM_UPDATE, {
          roomCode: room.code,
          players:  publicPlayersView(room),
          settings: room.settings,
          phase:    room.phase,
          hostId:   room.hostId,
          round:    room.round,
        });
        break;
      }

      // ── NIGHT ACTION ───────────────────────────────────────────────────────
      case EVENTS.NIGHT_ACTION: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.recordNightAction(currentRoomCode, currentPlayerId, data.targetId);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });

        const { room, player, target } = result;

        // ACK to acting player
        send(ws, 'night_action_ack', {
          targetNick: target.nick,
          role:       player.role,
        });

        // For mafia: broadcast updated vote tally to other mafia members
        if (player.role === ROLES.MAFIA) {
          const mafia = Object.values(room.players).filter((p) => p.role === ROLES.MAFIA && p.isAlive);
          const tally = {};
          for (const [id, tid] of Object.entries(room.nightActions.mafiaVotes)) {
            tally[room.players[id]?.nick] = room.players[tid]?.nick;
          }
          for (const m of mafia) {
            send(m.ws, 'mafia_vote_update', { tally });
          }
        }

        // For doctors: broadcast updated vote tally to other doctors
        if (player.role === ROLES.DOCTOR) {
          const doctors = Object.values(room.players).filter((p) => p.role === ROLES.DOCTOR && p.isAlive);
          const tally = {};
          for (const [id, tid] of Object.entries(room.nightActions.doctorTargets)) {
            tally[room.players[id]?.nick] = room.players[tid]?.nick;
          }
          for (const d of doctors) {
            send(d.ws, 'doctor_vote_update', { tally });
          }
        }

        // For detectives: broadcast updated vote tally to other detectives
        if (player.role === ROLES.DETECTIVE) {
          const detectives = Object.values(room.players).filter((p) => p.role === ROLES.DETECTIVE && p.isAlive);
          const tally = {};
          for (const [id, tid] of Object.entries(room.nightActions.detectiveTargets)) {
            tally[room.players[id]?.nick] = room.players[tid]?.nick;
          }
          for (const det of detectives) {
            send(det.ws, 'detective_vote_update', { tally });
          }
        }

        break;
      }
      // ── SKIP DAY ───────────────────────────────────────────────────────────────
      case EVENTS.SKIP_DAY: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.recordSkipDayVote(currentRoomCode, currentPlayerId);
        if (result.error) return send(ws, EVENTS.ERROR, { message: result.error });
        const { room: skipRoom, skipCount, needed, triggered } = result;
        broadcast(skipRoom, EVENTS.SKIP_DAY_UPDATE, { skipCount, needed });
        if (triggered) {
          clearPhaseTimer(skipRoom);
          broadcast(skipRoom, EVENTS.PHASE_CHANGE, {
            phase: PHASES.VOTING,
            alivePlayers: publicPlayersView(skipRoom),
          });
          scheduleNextPhase(skipRoom, gameManager);
        }
        break;
      }

      // ── CHAT MESSAGE ─────────────────────────────────────────────────────────
      case EVENTS.CHAT_MESSAGE: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const chatRoom = gameManager.getRoom(currentRoomCode);
        if (!chatRoom) return;
        const sender = chatRoom.players[currentPlayerId];
        if (!sender || !sender.isAlive || !sender.role || sender.role === ROLES.VILLAGER) return;
        const text = (data.text || '').trim().slice(0, 300);
        if (!text) return;
        // Route only to players with the same role
        for (const p of Object.values(chatRoom.players)) {
          if (p.role === sender.role) {
            send(p.ws, EVENTS.CHAT_RECEIVED, {
              fromNick: sender.nick,
              fromId:   sender.id,
              text,
              role:     sender.role,
            });
          }
        }
        break;
      }
      // ── VOTE ───────────────────────────────────────────────────────────────
      case EVENTS.VOTE: {
        if (!currentRoomCode) return send(ws, EVENTS.ERROR, { message: 'Nie jesteś w pokoju.' });
        const result = gameManager.recordVote(currentRoomCode, currentPlayerId, data.targetId);
        if (result.error) {
          // Send error back to voter - they can try again
          return send(ws, EVENTS.ERROR, { message: result.error });
        }

        const room = result.room;

        // Confirm to the voter that their vote was accepted by the server.
        send(ws, EVENTS.VOTE_ACK, { targetId: data.targetId });

        // Broadcast live vote counts (without revealing who voted for whom)
        const tally = {};
        for (const targetId of Object.values(room.votes)) {
          tally[targetId] = (tally[targetId] || 0) + 1;
        }
        // All alive players must vote (disconnected players are still eligible – timer resolves if they don't return)
        const eligibleVoters = Object.values(room.players).filter((p) => p.isAlive);
        const votedCount = Object.keys(room.votes).filter((voterId) => {
          const voter = room.players[voterId];
          return voter && voter.isAlive;
        }).length;
        console.log(`[vote] Player ${room.players[currentPlayerId]?.nick} voted for ${room.players[data.targetId]?.nick || 'skip'}. Votes: ${votedCount}/${eligibleVoters.length}`);
        broadcast(room, EVENTS.VOTE_UPDATE, { tally, votedCount });

        // If all alive and connected players voted → resolve immediately
        if (votedCount >= eligibleVoters.length) {
          console.log(`[vote] All players voted! Resolving voting.`);
          doResolveVoting(room, gameManager);
        }
        break;
      }

      default:
        send(ws, EVENTS.ERROR, { message: `Nieznane zdarzenie: ${event}` });
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  ws.on('close', () => {
    if (!currentRoomCode || !currentPlayerId) return;

    const room = gameManager.getRoom(currentRoomCode);
    if (!room) return;

    const player = room.players[currentPlayerId];
    if (player && player.ws === ws) {
      player.isConnected = false;
      player.ws = null;
      broadcastRoomUpdate(room);

      // Host migration – delayed 5 min so a brief disconnect / page refresh doesn't transfer host
      if (room.hostId === currentPlayerId && room.phase !== PHASES.GAME_OVER) {
        if (room.hostMigrateTimer) clearTimeout(room.hostMigrateTimer);
        room.hostMigrateTimer = setTimeout(() => {
          room.hostMigrateTimer = null;
          const stillHere = room.players[currentPlayerId];
          if (stillHere && !stillHere.isConnected && room.hostId === currentPlayerId) {
            const newHost = gameManager.migrateHost(room);
            if (newHost) broadcastRoomUpdate(room);
          }
        }, 5 * 60 * 1000);
      }
    }
  });
}

module.exports = { handleConnection };
