import { useState, useCallback, useEffect, useRef } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useLanguage } from './contexts/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'
import HomeScreen       from './screens/HomeScreen'
import LobbyScreen      from './screens/LobbyScreen'
import RoleRevealScreen from './screens/RoleRevealScreen'
import NightScreen      from './screens/NightScreen'
import NightResultScreen from './screens/NightResultScreen'
import DayScreen        from './screens/DayScreen'
import VotingScreen     from './screens/VotingScreen'
import VoteSummaryScreen from './screens/VoteSummaryScreen'
import VoteResultScreen from './screens/VoteResultScreen'
import GameOverScreen   from './screens/GameOverScreen'
import Toast            from './components/Toast'
import RoleChat         from './components/RoleChat'
import GameHUD          from './components/GameHUD'

const STORAGE_KEY = 'mafia_session'

const INITIAL_STATE = {
  screen:      'home',    // current UI screen
  phase:       null,
  roomCode:    null,
  playerId:    null,
  nick:        null,
  isHost:      false,
  hostId:      null,
  players:     [],        // [{id, nick, isAlive, isHost, isConnected}]
  settings:    { mafiaCount: 1, doctorCount: 1, detectiveCount: 1, loversCount: 0, dayDuration: 120000, nightDuration: 60000 },
  dayDuration: 120000, // ms
  nightDuration: 60000, // ms
  round:       0,
  // Private role info
  role:        null,
  roleDescription: null,
  mafiaAllies: [],        // [{id, nick}] for mafia players
  loverNick:   null,      // nick of the partner (if lovers are enabled)
  // Night
  nightActionDone: false,
  mafiaVoteTally: {},     // {voterNick: targetNick}
  detectiveResult: null,  // {targetNick, isMafia}
  // Night result
  nightResult: null,      // {killedNick, killedId}
  // Voting
  votes:       {},        // {targetId: count}
  hasVoted:    false,
  votedCount:  0,
  // Vote summary
  voteDisplay: {},  // {voterNick: targetNick}
  voteTally: {},    // {targetId: count}
  // Vote result
  voteResult:  null,      // {eliminatedNick, role, tie}
  // Game over
  winner:      null,
  finalPlayers: [],
  // Chat
  chatMessages: [],       // [{fromNick, fromId, text, role, ts}]
  // Skip day
  skipDay: { count: 0, needed: 0, hasVoted: false },
}

export default function App() {
  const [state, setState] = useState(INITIAL_STATE)
  const [toast, setToast] = useState(null)
  const stateRef = useRef(state)
  const { t } = useLanguage()
  stateRef.current = state
  const tRef = useRef(t)
  tRef.current = t

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // ── Save / restore session ────────────────────────────────────────────────
  useEffect(() => {
    if (state.roomCode && state.playerId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        roomCode: state.roomCode,
        playerId: state.playerId,
        nick: state.nick,
      }))
    }
  }, [state.roomCode, state.playerId, state.nick])

  // ── WebSocket message handler ─────────────────────────────────────────────
  const handleMessage = useCallback((event, data) => {
    switch (event) {

      case 'room_update': {
        const pid = data.playerId || stateRef.current.playerId
        const hid = data.hostId   || stateRef.current.hostId
        const rc  = data.roomCode || stateRef.current.roomCode
        // Save session immediately on first room_update with playerId
        if (data.playerId && rc) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            roomCode: rc,
            playerId: data.playerId,
            nick: stateRef.current.nick,
          }))
        }
        setState(s => ({
          ...s,
          screen:      data.phase === 'lobby' ? 'lobby' : s.screen,
          phase:       data.phase,
          roomCode:    rc,
          playerId:    pid,
          players:     data.players  || s.players,
          settings:    data.settings || s.settings,
          dayDuration: data.settings?.dayDuration || s.dayDuration,
          nightDuration: data.settings?.nightDuration || s.nightDuration,
          hostId:      hid,
          round:       data.round    ?? s.round,
          isHost:      pid === hid,
        }))
        break
      }

      case 'reconnected': {
        const pid = data.playerId
        setState(s => ({
          ...s,
          screen:          data.phase === 'lobby' ? 'lobby' : (data.phase || 'lobby'),
          phase:           data.phase,
          roomCode:        data.roomCode || s.roomCode,
          playerId:        pid,
          players:         data.players  || s.players,
          settings:        data.settings || s.settings,
          dayDuration:     data.settings?.dayDuration || s.dayDuration,
          nightDuration:   data.settings?.nightDuration || s.nightDuration,
          hostId:          data.hostId,
          round:           data.round ?? s.round,
          isHost:          pid === data.hostId,
          role:            data.role            || s.role,
          roleDescription: data.roleDescription || s.roleDescription,
          winner:          data.winner,
        }))
        showToast(tRef.current.toast.reconnected, 'success')
        break
      }

      case 'role_assigned': {
        setState(s => ({
          ...s,
          screen:          'role_reveal',
          role:            data.role,
          roleDescription: data.description,
          mafiaAllies:     data.allies || [],
          loverNick:       data.loverNick || null,
        }))
        break
      }

      case 'phase_change': {
        const phaseToScreen = {
          role_reveal:  'role_reveal',
          night:        'night',
          night_result: 'night_result',
          day:          'day',
          voting:       'voting',
          vote_summary: 'vote_summary',
          vote_result:  'vote_result',
          game_over:    'game_over',
        }
        setState(s => ({
          ...s,
          screen:          phaseToScreen[data.phase] || s.screen,
          phase:           data.phase,
          round:           data.round ?? s.round,
          players:         data.alivePlayers || s.players,
          dayDuration:     s.dayDuration,
          nightDuration:   s.nightDuration,
          nightActionDone: false,
          hasVoted:        false,
          votes:           {},
          votedCount:      0,
          mafiaVoteTally:  {},
          // Preserve detectiveResult so it continues showing during voting phase
          nightResult:     null,
          voteResult:      null,
          skipDay:         { count: 0, needed: 0, hasVoted: false },
        }))
        break
      }

      case 'night_result': {
        if (data.personal) {
          // Detective private result
          setState(s => ({
            ...s,
            detectiveResult: { targetNick: data.targetNick, isMafia: data.isMafia },
          }))
          const msg = data.isMafia
            ? `${data.targetNick} ${tRef.current.toast.isMafia}`
            : `${data.targetNick} ${tRef.current.toast.notMafia}`
          showToast(msg, data.isMafia ? 'error' : 'success', 10000)
        } else {
          // Public night result
          setState(s => ({
            ...s,
            screen:      'night_result',
            phase:       'night_result',
            nightResult: { killedNick: data.killedNick, killedId: data.killedId, loverKilledNick: data.loverKilledNick, loverKilledId: data.loverKilledId },
            players:     s.players.map(p =>
              p.id === data.killedId || p.id === data.loverKilledId ? { ...p, isAlive: false } : p
            ),
          }))
          if (data.loverKilledNick) {
            setTimeout(() => showToast(`💔 ${data.loverKilledNick} ${tRef.current.toast.loverDied}`, 'error', 5000), 1500)
          }
        }
        break
      }

      case 'mafia_random_kill': {
        if (data.saved) {
          showToast(`🎲 ${tRef.current.toast.randomKillSaved} ${data.targetNick}${tRef.current.toast.randomKillSavedSuffix}`, 'error', 9000)
        } else {
          showToast(`🎲 ${tRef.current.toast.randomKill} ${data.targetNick}`, 'error', 9000)
        }
        break
      }

      case 'night_action_ack': {
        setState(s => ({ ...s, nightActionDone: true }))
        showToast(`${tRef.current.toast.selected} ${data.targetNick}`, 'success')
        break
      }

      case 'mafia_vote_update': {
        setState(s => ({ ...s, mafiaVoteTally: data.tally || {} }))
        break
      }

      case 'vote_update': {
        setState(s => ({
          ...s,
          votes:      data.tally || {},
          votedCount: data.votedCount || 0,
        }))
        break
      }

      case 'vote_summary': {
        setState(s => ({
          ...s,
          screen: 'vote_summary',
          phase: 'vote_summary',
          voteDisplay: data.votes || {},
          voteTally: data.tally || {},
          detectiveResult: null, // Clear detective result to avoid overlap with vote display
        }))
        break
      }

      case 'player_eliminated': {
        setState(s => ({
          ...s,
          screen: 'vote_result',
          phase: data.phase || 'vote_result',
          voteResult: {
            eliminatedNick: data.eliminatedNick,
            eliminatedId:   data.eliminatedId,
            role:           data.role,
            tie:            data.tie,
            tally:          data.tally || {},
            loverEliminatedNick: data.loverEliminatedNick || null,
            loverEliminatedId:   data.loverEliminatedId   || null,
            loverEliminatedRole: data.loverEliminatedRole || null,
          },
          players: s.players.map(p =>
            p.id === data.eliminatedId || p.id === data.loverEliminatedId ? { ...p, isAlive: false } : p
          ),
        }))
        break
      }

      case 'game_over': {
        setState(s => ({
          ...s,
          screen:       'game_over',
          phase:        'game_over',
          winner:       data.winner,
          finalPlayers: data.players || [],
        }))
        break
      }

      case 'skip_day_update': {
        setState(s => ({
          ...s,
          skipDay: {
            count:    data.skipCount,
            needed:   data.needed,
            hasVoted: s.skipDay.hasVoted || data.votedBy === s.playerId,
          },
        }))
        break
      }

      case 'chat_received': {
        setState(s => ({
          ...s,
          chatMessages: [
            ...s.chatMessages,
            { fromNick: data.fromNick, fromId: data.fromId, text: data.text, role: data.role, ts: Date.now() },
          ],
        }))
        break
      }

      case 'kicked': {
        localStorage.removeItem(STORAGE_KEY)
        setState(INITIAL_STATE)
        showToast(tRef.current.toast.kicked, 'error', 4000)
        break
      }

      case 'error': {
        showToast(data.message || tRef.current.toast.error, 'error')
        break
      }

      default: break
    }
  }, [showToast])

  // Ref used to break circular dep: onOpen needs send, send comes from the hook
  const sendRef = useRef(null)

  const handleOpen = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const { roomCode, playerId } = JSON.parse(saved)
      if (roomCode && playerId) {
        sendRef.current?.('rejoin', { roomCode, playerId })
      }
    } catch { /* ignore */ }
  }, [])

  const { send } = useWebSocket(handleMessage, handleOpen)
  sendRef.current = send

  // ── Action helpers passed to screens ─────────────────────────────────────
  const actions = {
    kickPlayer:  (targetId) => send('kick_player', { targetId }),
    skipDay:     () => { send('skip_day', {}); setState(s => ({ ...s, skipDay: { ...s.skipDay, hasVoted: true } })) },
    sendChat:    (text) => send('chat_message', { text }),
    createRoom: (nick) => send('create_room', { nick }),
    joinRoom:   (roomCode, nick) => send('join_room', { roomCode, nick }),
    updateSettings: (settings) => send('update_settings', settings),
    startGame:  () => send('start_game'),
    resetToLobby: () => {
      send('reset_to_lobby', {})
      setState(s => ({
        ...s,
        screen: 'lobby',
        phase: 'lobby',
        role: null,
        roleDescription: null,
        loverNick: null,
        winner: null,
        voteResult: null,
        nightResult: null,
        hasVoted: false,
        nightActionDone: false,
      }))
    },
    nightAction:(targetId) => send('night_action', { targetId }),
    vote:        (targetId) => { send('vote', { targetId }); setState(s => ({ ...s, hasVoted: true })) },
    leaveRoom:  () => {
      localStorage.removeItem(STORAGE_KEY)
      setState(INITIAL_STATE)
    },
    setNick: (nick) => setState(s => ({ ...s, nick })),
  }

  // ── Screen router ─────────────────────────────────────────────────────────
  const screenProps = { state, actions, showToast }

  const renderScreen = () => {
    switch (state.screen) {
      case 'home':         return <HomeScreen        {...screenProps} />
      case 'lobby':        return <LobbyScreen       {...screenProps} />
      case 'role_reveal':  return <RoleRevealScreen  {...screenProps} />
      case 'night':        return <NightScreen       {...screenProps} />
      case 'night_result': return <NightResultScreen {...screenProps} />
      case 'day':          return <DayScreen         {...screenProps} />
      case 'voting':       return <VotingScreen      {...screenProps} />
      case 'vote_summary': return <VoteSummaryScreen {...screenProps} />
      case 'vote_result':  return <VoteResultScreen  {...screenProps} />
      case 'game_over':    return <GameOverScreen    {...screenProps} />
      default:             return <HomeScreen        {...screenProps} />
    }
  }

  return (
    <>
      <LanguageSwitcher />
      <GameHUD state={state} />
      {/* Logo visible when GameHUD bar is hidden (home, lobby, role_reveal, game_over) */}
      {!['night','night_result','day','voting','vote_summary','vote_result'].includes(state.phase) && (
        <img
          src="/image.png"
          alt="Mafia"
          style={{ position: 'fixed', top: 10, right: 12, height: 108, width: 108, objectFit: 'contain', opacity: 0.8, borderRadius: '10px', zIndex: 900 }}
        />
      )}
      {renderScreen()}
      {['night', 'day', 'voting'].includes(state.phase) && state.role && state.role !== 'villager' && (
        <RoleChat
          messages={state.chatMessages}
          role={state.role}
          onSend={actions.sendChat}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}
