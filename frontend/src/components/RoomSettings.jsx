import { Settings, Clock, Users } from 'lucide-react'

function SettingRow({ label, value, onDec, onInc }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ color: '#e8e8e8', fontSize: '0.95rem', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginLeft: '16px', flexShrink: 0 }}>
        <button onClick={onDec} style={btnStyle}>−</button>
        <span style={{
          width: '48px', textAlign: 'center',
          fontSize: '1.05rem', fontWeight: '700', color: '#fff',
          background: 'rgba(255,255,255,0.07)',
          padding: '7px 0',
          letterSpacing: '0.02em',
        }}>
          {value}
        </span>
        <button onClick={onInc} style={btnStyle}>+</button>
      </div>
    </div>
  )
}

const btnStyle = {
  width: '36px', height: '36px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.13)',
  color: '#fff', cursor: 'pointer', fontSize: '1.2rem',
  lineHeight: '1', fontWeight: '500',
  transition: 'background 0.15s',
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '0 0 8px',
      marginBottom: '2px',
      borderBottom: '1px solid rgba(139,26,22,0.35)',
    }}>
      <Icon size={14} color="var(--red-bright)" />
      <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red-bright)' }}>
        {title}
      </span>
    </div>
  )
}

export default function RoomSettings({ roomCode, players, nick, playerId, settings, onChange, onSave }) {
  const set = (key, val) => onChange({ ...settings, [key]: val })

  return (
    <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Kod pokoju */}
      <div style={{
        textAlign: 'center', padding: '18px 16px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '2px solid var(--red-bright)',
        boxShadow: '0 0 24px rgba(139,26,22,0.25)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Kod pokoju
        </p>
        <span style={{
          fontSize: '3rem', fontWeight: '900', color: '#fff',
          letterSpacing: '0.4em', fontVariantNumeric: 'tabular-nums',
          textShadow: '0 0 30px rgba(255,255,255,0.15)',
        }}>
          {roomCode}
        </span>
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
          Podaj ten kod innym graczom
        </p>
      </div>

      {/* Gracze */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <SectionHeader icon={Users} title={`Gracze (${players?.length || 1})`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
          {/* Gospodarz */}
          <div style={playerRowStyle(true)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red-bright)', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{nick}</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>gospodarz</span>
          </div>
          {/* Pozostali */}
          {players?.filter(p => p.id !== playerId).map(player => (
            <div key={player.id} style={playerRowStyle(false)}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: player.isConnected ? 'var(--green-light)' : '#444', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: '0.9rem', flex: 1 }}>{player.nick}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Skład ról */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <SectionHeader icon={Settings} title="Skład ról" />
        <SettingRow label="Mafia" value={settings.mafiaCount}
          onDec={() => set('mafiaCount', Math.max(1, settings.mafiaCount - 1))}
          onInc={() => set('mafiaCount', Math.min(5, settings.mafiaCount + 1))}
        />
        <SettingRow label="Lekarze" value={settings.doctorCount}
          onDec={() => set('doctorCount', Math.max(0, settings.doctorCount - 1))}
          onInc={() => set('doctorCount', Math.min(3, settings.doctorCount + 1))}
        />
        <SettingRow label="Detektywi" value={settings.detectiveCount}
          onDec={() => set('detectiveCount', Math.max(0, settings.detectiveCount - 1))}
          onInc={() => set('detectiveCount', Math.min(3, settings.detectiveCount + 1))}
        />
        <SettingRow label="Para zakochanych" value={settings.loversCount}
          onDec={() => set('loversCount', Math.max(0, settings.loversCount - 1))}
          onInc={() => set('loversCount', Math.min(1, settings.loversCount + 1))}
        />
      </div>

      {/* Czas rund */}
      <div className="card" style={{ padding: '16px 18px' }}>
        <SectionHeader icon={Clock} title="Czas rund" />
        <SettingRow label="Dyskusja dzienna" value={`${settings.dayDuration / 1000}s`}
          onDec={() => set('dayDuration', Math.max(60000, settings.dayDuration - 10000))}
          onInc={() => set('dayDuration', Math.min(300000, settings.dayDuration + 10000))}
        />
        <SettingRow label="Faza nocna" value={`${settings.nightDuration / 1000}s`}
          onDec={() => set('nightDuration', Math.max(30000, settings.nightDuration - 10000))}
          onInc={() => set('nightDuration', Math.min(180000, settings.nightDuration + 10000))}
        />
      </div>

      <button
        className="btn btn-primary btn-lg"
        style={{ width: '100%', padding: '15px', fontSize: '1rem', fontWeight: '700', marginTop: '4px' }}
        onClick={onSave}
      >
        Zapisz ustawienia
      </button>

    </div>
  )
}

const playerRowStyle = (isHost) => ({
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '7px 10px',
  background: isHost ? 'rgba(139,26,22,0.18)' : 'rgba(255,255,255,0.04)',
  borderRadius: '6px',
})
