import { useLanguage } from '../contexts/LanguageContext'

const ROLE_EMOJI = { mafia: '🔪', doctor: '💊', detective: '🔍', villager: '🏘️' }

export default function GameOverScreen({ state, actions }) {
  const { t } = useLanguage()
  const ROLE_LABEL = t.roles
  const { winner, finalPlayers, role: myRole, playerId } = state

  const isMafiaWin    = winner === 'mafia'
  const isVillageWin  = winner === 'villagers'

  return (
    <div className="screen">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
          {isMafiaWin ? '🔪' : '🎉'}
        </div>

        <h1 style={{ marginBottom: '0.25rem' }}>
          {isMafiaWin ? t.gameOver.mafiaWins : t.gameOver.villageWins}
        </h1>

        <p style={{ color: isMafiaWin ? 'var(--red-bright)' : 'var(--green)', fontWeight: 600, marginBottom: '1.5rem' }}>
          {isMafiaWin ? t.gameOver.mafiaDesc : t.gameOver.villageDesc}
        </p>

        <div className="divider">{t.gameOver.summary}</div>

        <div className="scroll-list">
          {finalPlayers.map(p => (
            <div key={p.id} className="player-row" style={{ opacity: p.isAlive ? 1 : 0.55 }}>
              <div
                className="avatar"
                style={{
                  background: p.role === 'mafia' ? 'var(--red-bright)' : undefined,
                }}
              >
                {p.nick[0].toUpperCase()}
              </div>
              <span style={{ flex: 1 }}>
                {p.nick}
                {p.id === playerId && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> {t.gameOver.you}</span>}
              </span>
              <span className={`role-badge role-${p.role}`}>
                {ROLE_EMOJI[p.role]} {ROLE_LABEL[p.role] || p.role}
              </span>
              {!p.isAlive && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>💀</span>}
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={actions.resetToLobby}
        >
          {t.gameOver.playAgain}
        </button>
        <button
          className="btn btn-ghost"
          onClick={actions.leaveRoom}
        >
          {t.gameOver.newGame}
        </button>
      </div>
    </div>
  )
}
