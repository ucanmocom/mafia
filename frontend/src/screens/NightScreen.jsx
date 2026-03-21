import { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

export default function NightScreen({ state, actions }) {
  const { t } = useLanguage()
  const { role, players, playerId, nightActionDone, nightActionTargetId, mafiaVoteTally, doctorVoteTally, detectiveVoteTally, detectiveResult, round, loverNick } = state
  const myPlayer = players.find(p => p.id === playerId)
  const isAlive  = myPlayer ? myPlayer.isAlive !== false : true

  const [timeLeft, setTimeLeft] = useState(60)
  useEffect(() => {
    const totalTime = Math.round((state.nightDuration || 60000) / 1000)
    setTimeLeft(totalTime)
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [round, state.nightDuration])

  const targets = players.filter(p => p.isAlive !== false && p.id !== playerId)
  const handlePick = (targetId) => actions.nightAction(targetId)
  const timerColor = timeLeft <= 10 ? 'var(--red-bright)' : 'var(--text)'

  return (
    <div className="screen">
      <div className="card">
        <div className="stats-strip" style={{ marginBottom: '20px' }}>
          <div className="stat-col">
            <span className="stat-label">{t.night.phase}</span>
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>{t.night.nightLabel}</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.night.time}</span>
            <span className="stat-value" style={{ color: timerColor }}>{timeLeft}s</span>
          </div>
          <div className="stat-col">
            <span className="stat-label">{t.night.round}</span>
            <span className="stat-value">#{round}</span>
          </div>
        </div>

        {loverNick && isAlive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px',
            background: 'rgba(224,96,128,0.08)',
            border: '1px solid rgba(224,96,128,0.2)',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
          }}>
            <span style={{ fontSize: '1rem' }}>💕</span>
            <span style={{ fontSize: '0.82rem', color: '#e06080' }}>
              {t.night.loverWith} <strong>{loverNick}</strong>
            </span>
          </div>
        )}

        {!isAlive && <SpectatorView t={t} />}
        {isAlive && role === 'villager'  && <VillagerNight t={t} />}
        {isAlive && role === 'mafia'     && (
          <MafiaNight targets={targets} selectedId={nightActionTargetId} onPick={handlePick} tally={mafiaVoteTally} t={t} />
        )}
        {isAlive && role === 'doctor'    && (
          <DoctorNight targets={players.filter(p => p.isAlive !== false)} selectedId={nightActionTargetId} onPick={handlePick} tally={doctorVoteTally} t={t} />
        )}
        {isAlive && role === 'detective' && (
          <DetectiveNight targets={targets} selectedId={nightActionTargetId} onPick={handlePick} tally={detectiveVoteTally} t={t} />
        )}
      </div>
    </div>
  )
}

function SpectatorView({ t }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☠️</div>
      <p>{t.night.eliminated}</p>
      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{t.night.spectating}</p>
    </div>
  )
}

function VillagerNight({ t }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
      <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t.night.sleeping}</p>
      <p style={{ fontSize: '0.85rem' }}>{t.night.mafiaWorks}</p>
    </div>
  )
}

function PlayerList({ players, onPick, selectedId }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {players.map(p => {
        const isSelected = p.id === selectedId
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isSelected ? 'var(--surface3)' : 'var(--surface2)',
              border: isSelected ? '2px solid var(--red-bright)' : '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)',
              transition: 'border-color .12s, background .12s',
              boxShadow: isSelected ? '0 0 8px rgba(255,60,60,0.3)' : 'none',
            }}
            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--red-bright)'; e.currentTarget.style.background = 'var(--surface3)' } }}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)' } }}
            >
              {isSelected ? '✓' : p.nick[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '0.68rem', color: isSelected ? 'var(--red-bright)' : 'var(--text-dim)', maxWidth: 56, textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2, fontWeight: isSelected ? 700 : 400 }}>
              {p.nick}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MafiaNight({ targets, selectedId, onPick, tally, t }) {
  const tallyEntries = Object.entries(tally)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ color: 'var(--red-bright)', fontWeight: 600 }}>{t.night.mafiaKill}</p>
      <PlayerList players={targets} onPick={onPick} selectedId={selectedId} />
      {tallyEntries.length > 0 && (
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
          <p className="label-cap" style={{ marginBottom: '6px' }}>{t.night.mafiaVotes}</p>
          {tallyEntries.map(([voter, target]) => (
            <p key={voter} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{voter}</span>
              <span style={{ color: 'var(--border2)', margin: '0 6px' }}>→</span>
              <strong>{target}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function DoctorNight({ targets, selectedId, onPick, tally, t }) {
  const tallyEntries = Object.entries(tally)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ color: 'var(--green-light)', fontWeight: 600 }}>{t.night.doctorHeal}</p>
      <PlayerList players={targets} onPick={onPick} selectedId={selectedId} />
      {tallyEntries.length > 0 && (
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
          <p className="label-cap" style={{ marginBottom: '6px' }}>{t.night.doctorVotes || 'Głosy lekarzy'}</p>
          {tallyEntries.map(([voter, target]) => (
            <p key={voter} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{voter}</span>
              <span style={{ color: 'var(--border2)', margin: '0 6px' }}>→</span>
              <strong>{target}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function DetectiveNight({ targets, selectedId, onPick, tally, t }) {
  const tallyEntries = Object.entries(tally)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{t.night.detectiveInvest}</p>
      <PlayerList players={targets} onPick={onPick} selectedId={selectedId} />
      {tallyEntries.length > 0 && (
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
          <p className="label-cap" style={{ marginBottom: '6px' }}>{t.night.detectiveVotes || 'Głosy detektywów'}</p>
          {tallyEntries.map(([voter, target]) => (
            <p key={voter} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{voter}</span>
              <span style={{ color: 'var(--border2)', margin: '0 6px' }}>→</span>
              <strong>{target}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
