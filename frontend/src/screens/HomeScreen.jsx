import { useState, useEffect, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

const BelowFoldContent = lazy(() => import('../components/BelowFoldContent'))

export default function HomeScreen({ state, actions }) {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [nick, setNick]         = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode]         = useState('home') // 'home' | 'create' | 'join'

  useEffect(() => {
    const joinCode = searchParams.get('join')
    if (joinCode) {
      setRoomCode(joinCode.toUpperCase())
      setMode('join')
    }
  }, [])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!nick.trim()) return
    actions.setNick(nick.trim())
    actions.createRoom(nick.trim())
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (!nick.trim() || !roomCode.trim()) return
    actions.setNick(nick.trim())
    actions.joinRoom(roomCode.trim().toUpperCase(), nick.trim())
  }

  if (mode === 'create') {
    return (
      <div className="screen">
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 'auto', alignSelf: 'flex-start' }}
            onClick={() => setMode('home')}
          >
            {t.back}
          </button>
          <div>
            <p className="label-cap" style={{ marginBottom: '4px' }}>{t.home.newGame}</p>
            <h2 style={{ fontSize: '1.6rem' }}>{t.home.createRoom}</h2>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p className="label-cap" style={{ marginBottom: '6px' }}>{t.home.nickname}</p>
              <input
                type="text"
                placeholder={t.home.nickPlaceholder}
                value={nick}
                maxLength={20}
                onChange={e => setNick(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={!nick.trim()} style={{ marginTop: '4px' }}>
              {t.home.createGame}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="screen">
        <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: 'auto', alignSelf: 'flex-start' }}
            onClick={() => setMode('home')}
          >
            {t.back}
          </button>
          <div>
            <p className="label-cap" style={{ marginBottom: '4px' }}>{t.home.join}</p>
            <h2 style={{ fontSize: '1.6rem' }}>{t.home.joinTitle}</h2>
          </div>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p className="label-cap" style={{ marginBottom: '6px' }}>{t.home.nickname}</p>
              <input
                type="text"
                placeholder={t.home.nickPlaceholder}
                value={nick}
                maxLength={20}
                onChange={e => setNick(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <p className="label-cap" style={{ marginBottom: '6px' }}>{t.home.roomCode}</p>
              <input
                type="text"
                placeholder={t.home.roomCodePlaceholder}
                value={roomCode}
                maxLength={6}
                style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800, fontSize: '1.2rem' }}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={!nick.trim() || !roomCode.trim()} style={{ marginTop: '4px' }}>
              {t.home.joinBtn}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="screen home-hero">
      {/* Dark overlay for readability */}
      <div className="home-overlay" />
      {/* Additional atmospheric overlay */}
      <div className="home-overlay-atmo" />

      <div className="home-content">

        {/* Hero Title */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 className="home-title">
            MAFIA
          </h1>
          <p className="home-subtitle">
            Online
          </p>
        </div>

        {/* Tagline */}
        <p className="home-tagline">
          {t.home.tagline}
        </p>

        {/* Role info - subtle */}
        <div className="home-roles">
          {[
            { key: 'mafia' },
            { key: 'doctor' },
            { key: 'detective' },
            { key: 'villager' },
          ].map(({ key }, i) => (
            <span key={key}>
              {i > 0 && (
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.3)', 
                  margin: '0 8px'
                }}>·</span>
              )}
              {t.roles[key]}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
          <button 
            className="btn home-btn-create" 
            onClick={() => setMode('create')}
          >
            {t.home.createRoom}
          </button>
          <button 
            className="btn home-btn-join" 
            onClick={() => setMode('join')}
          >
            {t.home.joinGame}
          </button>
        </div>

        {/* Below-fold content: How to Play + FAQ (lazy loaded) */}
        <Suspense fallback={null}>
          <BelowFoldContent t={t} />
        </Suspense>
      </div>
    </div>
    </>
  )
}
