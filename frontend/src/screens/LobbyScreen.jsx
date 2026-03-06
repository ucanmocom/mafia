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
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  const alivePlayers = players.filter(p => p.isConnected !== false)
  const totalSpecial =
    localSettings.mafiaCount +
    localSettings.detectiveCount +
    localSettings.doctorCount
  const mafiaRuleOk = localSettings.mafiaCount <= 1 || alivePlayers.length >= 6
  const loversOk = (localSettings.loversCount ?? 0) <= 1
  const canStart = alivePlayers.length >= 4 && totalSpecial < alivePlayers.length && mafiaRuleOk && loversOk

  const handleSettingsChange = (key, val) => {
    const updated = { ...localSettings, [key]: Number(val) }
    setLocalSettings(updated)
    if (isHost) actions.updateSettings(updated)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {})
  }

  const copyInviteLink = () => {
    const baseUrl = window.location.origin
    const inviteUrl = `${baseUrl}/?roomCode=${roomCode}`
    navigator.clipboard.writeText(inviteUrl).catch(() => {})
  }

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '72px' }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Room code hero */}
        <div>
          <p className="label-cap" style={{ marginBottom: '6px' }}>{t.lobby.roomCode}</p>
          <div
            className="room-code"
            onClick={copyCode}
            title={t.lobby.copyHint}
            style={{ cursor: 'pointer', textAlign: 'left' }}
          >
            {roomCode}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {t.lobby.shareCopy}
          </p>
        </div>

        {/* Invite link button */}
        <button
          onClick={() => {
            const baseUrl = window.location.origin
            const inviteUrl = `${baseUrl}/?roomCode=${roomCode}`
            const fullInviteText = `Zagraj ze mną w Mafia Online\n${inviteUrl}\n(${roomCode})`
            navigator.clipboard.writeText(fullInviteText).catch(() => {})
            setShowCopiedToast(true)
            setTimeout(() => setShowCopiedToast(false), 5000)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: '8px 0',
            margin: '0',
            textAlign: 'left',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--brand)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          title="Skopiuj link zaproszenia"
        >
          🔗 Skopiuj link
        </button>

        {/* Toast notification */}
        {showCopiedToast && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--brand)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              zIndex: 1000,
              boxShadow: 'var(--shadow-lg)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            ✓ Skopiowano do schowka
          </div>
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

        {/* Settings (host only) */}
        {isHost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p className="label-cap" style={{ marginBottom: '8px' }}>{t.lobby.settings}</p>

            <div className="card-sm">
              <SettingRow
                label="Mafiosi"
                value={localSettings.mafiaCount}
                min={1}
                max={Math.max(1, Math.floor(alivePlayers.length / 3))}
                hint={t.roleHints.mafia}
                onChange={v => handleSettingsChange('mafiaCount', v)}
              />
              {localSettings.mafiaCount > 1 && alivePlayers.length < 6 && (
                <p style={{ color: 'var(--red-bright)', fontSize: '0.75rem', padding: '0 16px 10px' }}>
                  {t.lobby.tooManyMafia.replace('{n}', alivePlayers.length)}
                </p>
              )}
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

            <div className="card-sm" style={{ marginTop: '8px' }}>
              <div style={{ padding: '10px 16px 2px' }}>
                <p className="label-cap">{t.lobby.timers}</p>
              </div>
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

            {alivePlayers.length < 4 && (
              <p style={{ color: 'var(--yellow)', fontSize: '0.8rem' }}>
                {t.lobby.needPlayers}
              </p>
            )}
            {totalSpecial >= alivePlayers.length && (
              <p style={{ color: 'var(--yellow)', fontSize: '0.8rem' }}>
                {t.lobby.tooManySpecial}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {isHost ? (
          <button
            className="btn btn-primary"
            disabled={!canStart}
            onClick={actions.startGame}
          >
            {t.lobby.startGame}
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p className="label-cap">{t.lobby.waitHost}</p>
          </div>
        )}

        <button className="btn btn-ghost" onClick={actions.leaveRoom}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className="setting-row-label">{label}</span>
        {hint && <RoleHintButton hint={hint} />}
      </div>
      <button
        className="btn btn-ghost btn-sm"
        style={{ padding: '6px 10px', minWidth: '32px' }}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >−</button>
      <span className="setting-row-val">{value}</span>
      <button
        className="btn btn-ghost btn-sm"
        style={{ padding: '6px 10px', minWidth: '32px' }}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
      >+</button>
    </div>
  )
}
