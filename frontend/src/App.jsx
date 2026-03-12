import { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useLanguage } from './contexts/LanguageContext'
import LanguageSwitcher from './components/LanguageSwitcher'
import HomeScreen       from './screens/HomeScreen'
import LobbyScreen      from './screens/LobbyScreen'
import RoleRevealScreen from './screens/RoleRevealScreen'
// Lazy load game screens
const NightScreen       = lazy(() => import('./screens/NightScreen'))
const NightResultScreen = lazy(() => import('./screens/NightResultScreen'))
const DayScreen        = lazy(() => import('./screens/DayScreen'))
const VotingScreen     = lazy(() => import('./screens/VotingScreen'))
const VoteSummaryScreen = lazy(() => import('./screens/VoteSummaryScreen'))
const VoteResultScreen = lazy(() => import('./screens/VoteResultScreen'))
const GameOverScreen   = lazy(() => import('./screens/GameOverScreen'))
import Toast            from './components/Toast'
import RoleChat         from './components/RoleChat'
import GameHUD          from './components/GameHUD'

const LoadingFallback = () => (
  <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <p>Ładowanie...</p>
    </div>
  </div>
)

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
  loverId:     null,      // id of the partner (if lovers are enabled)
  cannotVoteLoverError: null,  // {targetNick} when trying to vote for lover
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
  const { t, lang } = useLanguage()
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

  // ── Load Google Analytics 4 (lazy) ─────────────────────────────────────────
  useEffect(() => {
    // Załaduj GA4 tylko raz po mountowaniu
    if (window.gtag) return

    // Utwórz window.dataLayer
    window.dataLayer = window.dataLayer || []
    function gtag() { window.dataLayer.push(arguments) }
    gtag('js', new Date())
    gtag('config', 'G-BQKWBED5QG')
    window.gtag = gtag

    // Dynamicznie załaduj skrypt Google Analytics asynchronicznie (nie blokuje)
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-BQKWBED5QG'
    document.head.appendChild(script)
  }, [])

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
          loverId:         data.loverId || null,
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
          cannotVoteLoverError: null,
          detectiveResult: null,
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

      case 'rejoin_failed': {
        localStorage.removeItem(STORAGE_KEY)
        setState(INITIAL_STATE)
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
        loverId: null,
        mafiaAllies: [],
        winner: null,
        voteResult: null,
        nightResult: null,
        votes: {},
        votedCount: 0,
        voteDisplay: {},
        voteTally: {},
        detectiveResult: null,
        mafiaVoteTally: {},
        chatMessages: [],
        skipDay: { count: 0, needed: 0, hasVoted: false },
        cannotVoteLoverError: null,
        finalPlayers: [],
        round: 0,
        hasVoted: false,
        nightActionDone: false,
      }))
    },
    nightAction:(targetId) => send('night_action', { targetId }),
    vote:        (targetId) => {
      const currentState = stateRef.current
      // Cannot vote for self or lover – show error but auto-cast abstain so they're counted as voted
      if (targetId === currentState.playerId || targetId === currentState.loverId) {
        const targetPlayer = currentState.players.find(p => p.id === targetId)
        setState(s => ({ ...s, cannotVoteLoverError: targetPlayer?.nick || 'Unknown' }))
        send('vote', { targetId: 'skip' })
        setState(s => ({ ...s, hasVoted: true }))
        return
      }
      send('vote', { targetId })
      setState(s => ({ ...s, hasVoted: true }))
    },
    leaveRoom:  () => {
      send('leave_room', {})
      localStorage.removeItem(STORAGE_KEY)
      setState(INITIAL_STATE)
    },
    setNick: (nick) => setState(s => ({ ...s, nick })),
  }

  // ── SEO: dynamic lang / title / meta tags ───────────────────────────────
  useEffect(() => {
    if (!t) return

    const currentLang = lang || 'pl'
    document.documentElement.lang = currentLang

    const seo = t.seo || {}

    if (seo.title) {
      document.title = seo.title
    }

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = `${window.location.origin}/${currentLang}`

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && seo.description) {
      metaDescription.setAttribute('content', seo.description)
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords && seo.keywords) {
      metaKeywords.setAttribute('content', seo.keywords)
    }

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle && seo.title) {
      ogTitle.setAttribute('content', seo.title)
    }

    const ogDescription = document.querySelector('meta[property="og:description"]')
    if (ogDescription && seo.description) {
      ogDescription.setAttribute('content', seo.description)
    }

    // Set og:url 
    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (!ogUrl) {
      ogUrl = document.createElement('meta')
      ogUrl.setAttribute('property', 'og:url')
      document.head.appendChild(ogUrl)
    }
    ogUrl.setAttribute('content', `${window.location.origin}/${currentLang}`)

    // Set og:locale based on current language
    let ogLocale = document.querySelector('meta[property="og:locale"]')
    if (!ogLocale) {
      ogLocale = document.createElement('meta')
      ogLocale.setAttribute('property', 'og:locale')
      document.head.appendChild(ogLocale)
    }
    const localeMap = {
      'pl': 'pl_PL',
      'en': 'en_US', 
      'fr': 'fr_FR',
      'de': 'de_DE'
    }
    ogLocale.setAttribute('content', localeMap[currentLang] || 'pl_PL')

    // Update hreflang links
    const baseUrl = window.location.origin
    const languages = ['pl', 'en', 'fr', 'de']
    
    // Remove all existing hreflang links to avoid duplicates
    document.querySelectorAll('link[hreflang]').forEach(link => {
      if (link.hreflang !== 'x-default') {
        link.remove()
      }
    })
    
    // Add fresh hreflang links
    languages.forEach(langCode => {
      const hreflangLink = document.createElement('link')
      hreflangLink.rel = 'alternate'
      hreflangLink.hreflang = langCode
      hreflangLink.href = `${baseUrl}/${langCode}`
      document.head.appendChild(hreflangLink)
    })

    // Update x-default hreflang
    let xDefaultLink = document.querySelector('link[hreflang="x-default"]')
    if (!xDefaultLink) {
      xDefaultLink = document.createElement('link')
      xDefaultLink.rel = 'alternate'
      xDefaultLink.hreflang = 'x-default'
      document.head.appendChild(xDefaultLink)
    }
    xDefaultLink.href = `${baseUrl}/en`

    // Add JSON-LD structured data
    let jsonLdScript = document.querySelector('#json-ld-script')
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script')
      jsonLdScript.id = 'json-ld-script'
      jsonLdScript.type = 'application/ld+json'
      document.head.appendChild(jsonLdScript)
    }
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": seo.title || "Mafia online",
      "description": seo.description,
      "url": `${baseUrl}/${currentLang}`,
      "applicationCategory": "Game",
      "genre": "Social Deduction",
      "gamePlatform": "Web Browser",
      "operatingSystem": "Any",
      "inLanguage": currentLang,
      "isAccessibleForFree": true,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
    
    jsonLdScript.textContent = JSON.stringify(structuredData)
  }, [lang, t])

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
      <Suspense fallback={<LoadingFallback />}>
        {renderScreen()}
      </Suspense>
      {['night', 'day', 'voting'].includes(state.phase) && state.role && state.role !== 'villager' && (
        <RoleChat
          messages={state.chatMessages}
          role={state.role}
          onSend={actions.sendChat}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
