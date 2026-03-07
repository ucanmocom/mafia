import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

function RoleHintButton({ hint }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '20px',
        }}
        onClick={() => setShowModal(true)}
        title="Informacja o roli"
      >
        i
      </button>
      {showModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              maxWidth: '90%',
              width: '320px',
              maxHeight: '80vh',
              overflow: 'auto',
              zIndex: 1001,
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <p style={{ color: 'var(--text)', lineHeight: '1.6', margin: 0 }}>
              {hint}
            </p>
          </div>
        </>
      )}
    </>
  )
}

export default function LobbyScreen({ state, actions }) {
  const { t } = useLanguage()
  const { roomCode, players, settings, isHost, hostId, playerId } = state
  const [localSettings, setLocalSettings] = useState(settings)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [showNeedPlayersModal, setShowNeedPlayersModal] = useState(false)

  const alivePlayers = players.filter(p => p.isConnected !== false)
  const totalSpecial =
    localSettings.mafiaCount +
    localSettings.detectiveCount +
    localSettings.doctorCount
  const mafiaRuleOk = localSettings.mafiaCount <= 1 || alivePlayers.length >= 6
  const loversOk = (localSettings.loversCount ?? 0) <= 1
  const canStart = alivePlayers.length >= 4 && totalSpecial < alivePlayers.length && mafiaRuleOk && loversOk
  const missingPlayers = Math.max(0, 4 - alivePlayers.length)

  const handleSettingsChange = (key, val) => {
    const updated = { ...localSettings, [key]: Number(val) }
    setLocalSettings(updated)
    if (isHost) actions.updateSettings(updated)
  }

  const copyCode = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`
    navigator.clipboard.writeText(inviteUrl).catch(() => {})
    setIsLinkCopied(true)
    setTimeout(() => setIsLinkCopied(false), 2000)
  }

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`
    navigator.clipboard.writeText(inviteUrl).catch(() => {})
    setIsLinkCopied(true)
    setTimeout(() => setIsLinkCopied(false), 2000)
  }

  const handleStartClick = () => {
    if (missingPlayers > 0) {
      setShowNeedPlayersModal(true)
      return
    }
    actions.startGame()
  }

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '72px' }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Room code hero */}
        <div className="room-code-hero">
          <p className="label-cap room-code-hero-label">{t.lobby.roomCode}</p>
          <div className="room-code" title={t.lobby.copyHint}>
            {roomCode}
          </div>
          <button
            className="copy-room-code-btn"
            onClick={copyCode}
            title={t.lobby.copyHint}
          >
            {isLinkCopied ? 'Skopiowano do schowka...' : 'Zaproś - skopiuj link'}
          </button>
          <p className="room-code-hero-hint">{t.lobby.shareCopy}</p>
        </div>

        {showNeedPlayersModal && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.72)',
                zIndex: 1100,
              }}
              onClick={() => setShowNeedPlayersModal(false)}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(92vw, 360px)',
                background: 'var(--surface)',
                border: '1px solid var(--border2)',
                borderLeft: '3px solid var(--red-bright)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                zIndex: 1101,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <p style={{
                margin: '0 0 8px',
                fontWeight: 800,
                color: '#fff',
                textAlign: 'center',
                letterSpacing: '0.02em',
              }}>
                Potrzeba co najmniej 4 graczy
              </p>
              <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: 'var(--text-dim)', lineHeight: 1.45, textAlign: 'center' }}>
                Brakuje jeszcze {missingPlayers} graczy. Zaproś znajomych linkiem do pokoju.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    copyInviteLink()
                    setShowNeedPlayersModal(false)
                  }}
                >
                  Zaproś znajomych
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setShowNeedPlayersModal(false)}
                >
                  Zamknij
                </button>
              </div>
            </div>
          </>
        )}

        {/* Stats strip */}
        <div className="stats-strip">
          <div className="stat-col">
            <span className="stat-label">{t.lobby.players}</span>
            <span className="stat-value">{players.length}</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.lobby.minimum}</span>
            <span className="stat-value">4</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.lobby.status}</span>
            <span className={`stat-value ${canStart ? 'green' : 'red'}`}>
              {canStart ? 'OK' : '...'}
            </span>
          </div>
        </div>

        {/* Players list */}
        <div>
          <p className="label-cap" style={{ marginBottom: '8px' }}>{t.lobby.playersInRoom}</p>
          <div className="scroll-list">
            {players.map(p => (
              <div key={p.id} className="player-row">
                <div className="avatar">{p.nick[0].toUpperCase()}</div>
                <span style={{ flex: 1, fontWeight: 500 }}>{p.nick}</span>
                {p.id === hostId && <span className="badge">Host</span>}
                {p.id === playerId && p.id !== hostId && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t.you}</span>
                )}
                {p.isConnected === false && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t.offline}</span>
                )}
                {isHost && p.id && p.id !== playerId && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    onClick={() => actions.kickPlayer(p.id)}
                    title={`${t.lobby.kickTitle} ${p.nick}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Role settings (host only) */}
        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="label-cap" style={{ marginBottom: '8px' }}>Role</p>

            <div className="card-sm">
              <SettingRow
                label="Mafiosi"
                value={localSettings.mafiaCount}
                min={1}
                max={Math.max(1, Math.floor(alivePlayers.length / 3))}
                hint={t.roleHints.mafia}
                onChange={v => handleSettingsChange('mafiaCount', v)}
              />
              <SettingRow
                label={t.roles.detective}
                value={localSettings.detectiveCount}
                min={0}
                max={2}
                hint={t.roleHints.detective}
                onChange={v => handleSettingsChange('detectiveCount', v)}
              />
              <SettingRow
                label={t.roles.doctor}
                value={localSettings.doctorCount}
                min={0}
                max={2}
                hint={t.roleHints.doctor}
                onChange={v => handleSettingsChange('doctorCount', v)}
              />
              <SettingRow
                label={t.lobby.lovers}
                value={localSettings.loversCount ?? 0}
                min={0}
                max={1}
                hint={t.roleHints.lovers}
                onChange={v => handleSettingsChange('loversCount', v)}
              />
            </div>

            <p className="label-cap" style={{ margin: '8px 0 8px' }}>{t.lobby.timers}</p>

            <div className="card-sm">
              <SettingRow
                label={t.lobby.discussion}
                value={Math.round((localSettings.dayDuration || 120000) / 1000)}
                min={30}
                max={300}
                step={10}
                onChange={v => handleSettingsChange('dayDuration', v * 1000)}
              />
              <SettingRow
                label={t.lobby.night}
                value={Math.round((localSettings.nightDuration || 60000) / 1000)}
                min={30}
                max={180}
                step={10}
                onChange={v => handleSettingsChange('nightDuration', v * 1000)}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        {isHost ? (
          <>
            {missingPlayers > 0 && (
              <p style={{
                margin: '4px 0 6px',
                textAlign: 'center',
                color: 'rgba(255, 214, 214, 0.5)',
                fontWeight: 600,
                fontSize: '0.78rem',
                letterSpacing: '0.015em',
                animation: 'pulse 3.2s ease-in-out infinite',
              }}>
                Potrzeba co najmniej 4 graczy
              </p>
            )}
            <button
              className="btn"
              style={{
                fontSize: '1.03rem',
                padding: '16px 20px',
                minHeight: '56px',
                background: 'linear-gradient(135deg, #8B0000 0%, #B22222 52%, #DC143C 100%)',
                border: '2px solid rgba(139, 0, 0, 0.95)',
                color: '#ffffff',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderRadius: '12px',
                boxShadow: '0 8px 28px rgba(139, 0, 0, 0.55), 0 0 16px rgba(139, 0, 0, 0.62)',
                textShadow: '0 1px 6px rgba(0, 0, 0, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={handleStartClick}
            >
              {t.lobby.startGame}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <style>{`
              @keyframes bloodWaitPulse {
                0%, 100% {
                  color: #e87373;
                  text-shadow: 0 0 6px rgba(220, 20, 60, 0.45), 0 0 14px rgba(139, 0, 0, 0.4);
                  transform: scale(1);
                }
                50% {
                  color: #ef5757;
                  text-shadow: 0 0 10px rgba(255, 0, 0, 0.65), 0 0 22px rgba(139, 0, 0, 0.65);
                  transform: scale(1.015);
                }
              }
            `}</style>
            <p
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                animation: 'bloodWaitPulse 2.2s ease-in-out infinite',
              }}
            >
              {t.lobby.waitHost}
            </p>
          </div>
        )}

        <button
          className="btn btn-danger-dark"
          style={{ padding: '16px 20px', minHeight: '54px' }}
          onClick={actions.leaveRoom}
        >
          {t.lobby.leaveRoom}
        </button>

        <div style={{ paddingBottom: '24px' }} />
      </div>
    </div>
  )
}

function SettingRow({ label, value, min, max, step = 1, hint, onChange }) {
  return (
    <div className="setting-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span className="setting-row-label">{label}</span>
        {hint && <RoleHintButton hint={hint} />}
      </div>
      <div className="setting-row-controls">
        <button
          className="setting-step-btn"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
        >−</button>
        <span className="setting-row-val">{value}</span>
        <button
          className="setting-step-btn"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
        >+</button>
      </div>
    </div>
  )
}
