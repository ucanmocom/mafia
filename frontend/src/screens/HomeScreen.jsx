import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function HomeScreen({ state, actions }) {
  const { t } = useLanguage()
  const [nick, setNick]         = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode]         = useState('home') // 'home' | 'create' | 'join'

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
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '200px', overflow: 'auto' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* Hero title */}
        <div style={{ marginBottom: '28px' }}>
          <p className="label-cap" style={{ marginBottom: '10px', color: 'var(--red-bright)' }}>
            {t.home.partyGame}
          </p>
          <h1 style={{
            fontSize: '4.8rem',
            fontWeight: 900,
            letterSpacing: '0.22em',
            color: 'var(--text)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            MAFIA
          </h1>
        </div>

        {/* Role strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '36px' }}>
          {[
            { emoji: '🔪', key: 'mafia' },
            { emoji: '💊', key: 'doctor' },
            { emoji: '🔍', key: 'detective' },
            { emoji: '🏘️', key: 'villager' },
          ].map(({ emoji, key }, i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              {i > 0 && (
                <span style={{ color: 'var(--border2)', margin: '0 10px', fontSize: '0.7rem' }}>│</span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {emoji} {t.roles[key]}
              </span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
          <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '15px 20px' }} onClick={() => setMode('create')}>
            {t.home.createRoom}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '15px 20px' }} onClick={() => setMode('join')}>
            {t.home.joinGame}
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '48px', textAlign: 'center' }}>
          {t.home.tagline}
        </p>

        {/* How to play section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>
            {t.home.howToPlay}
          </h2>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
            {t.home.rulesIntro}
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px', marginTop: '16px' }}>
            {t.home.winCondition}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '16px' }}>
            {t.home.winConditionDesc}
          </p>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px', marginTop: '16px' }}>
            {t.home.gamble}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: t.home.rolesDesc }} />

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', marginTop: '16px' }}>
            {t.home.gameFlow}
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              {t.home.nightPhase}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {t.home.nightPhaseDesc}
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              {t.home.dayPhase}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {t.home.dayPhaseDesc}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              {t.home.votingPhase}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {t.home.votingPhaseDesc}
            </p>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6, marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {t.home.conclusion}
          </p>
        </div>
      </div>
    </div>
  )
}
