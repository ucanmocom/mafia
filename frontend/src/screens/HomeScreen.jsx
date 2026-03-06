import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Moon, MessageCircle, Vote } from 'lucide-react'

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
    <>
      <style>
        {`
          @keyframes bloodPulse {
            0%, 100% {
              box-shadow: 0 16px 64px rgba(139, 0, 0, 0.8), 0 0 40px rgba(139, 0, 0, 1), inset 0 1px 0 rgba(255, 255, 255, 0.1);
              background-position: 0% 50%;
            }
            25% {
              box-shadow: 0 16px 64px rgba(139, 0, 0, 1), 0 0 50px rgba(139, 0, 0, 1.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
              background-position: 50% 50%;
            }
            50% {
              box-shadow: 0 16px 64px rgba(139, 0, 0, 1.2), 0 0 60px rgba(139, 0, 0, 1.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              background-position: 100% 50%;
            }
            75% {
              box-shadow: 0 16px 64px rgba(139, 0, 0, 1), 0 0 50px rgba(139, 0, 0, 1.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
              background-position: 50% 50%;
            }
          }
        `}
      </style>
      <div className="screen" style={{ 
        justifyContent: 'center', 
        backgroundImage: 'url(/image.png)',
        backgroundSize: '170%',
        backgroundPosition: 'center 50px',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        overflow: 'auto',
        position: 'relative'
      }}>
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 50%, rgba(0, 0, 0, 0.95) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Additional atmospheric overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(139, 0, 0, 0.15) 0%, transparent 30%, transparent 70%, rgba(139, 0, 0, 0.1) 100%)',
        pointerEvents: 'none'
      }} />

      <div style={{ 
        width: '100%', 
        maxWidth: '900px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '0',
        position: 'relative',
        zIndex: 1,
        padding: '30px 20px'
      }}>

        {/* Hero Title */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: window.innerWidth <= 420 ? '5rem' : '6rem',
            fontWeight: 900,
            letterSpacing: window.innerWidth <= 420 ? '0.05em' : '0.1em',
            color: '#ffffff',
            textTransform: 'uppercase',
            lineHeight: 0.9,
            textShadow: '0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(139, 0, 0, 1), 0 8px 32px rgba(0, 0, 0, 0.9)',
            marginBottom: '12px',
            margin: window.innerWidth <= 420 ? '0 12px 12px 12px' : '0 0 12px 0'
          }}>
            MAFIA
          </h1>
          <p style={{
            fontSize: window.innerWidth <= 420 ? '1rem' : '1.3rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 400,
            letterSpacing: window.innerWidth <= 420 ? '0.15em' : '0.2em',
            textTransform: 'uppercase',
            textShadow: '0 0 30px rgba(139, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.9)'
          }}>
            Online
          </p>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '1.1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center',
          fontWeight: 500,
          letterSpacing: '0.05em',
          marginBottom: '24px',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
        }}>
          {t.home.tagline}
        </p>

        {/* Role info - subtle */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px', 
          marginBottom: '48px',
          padding: '12px 20px',
          fontSize: '0.8rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
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
            className="btn btn-primary" 
            style={{ 
              fontSize: '1.1rem', 
              padding: '20px 48px',
              background: 'linear-gradient(135deg, #2D0808 0%, #4D0F0F 30%, #6D1717 60%, #8B0000 100%)',
              border: '2px solid rgba(139, 0, 0, 1)',
              color: '#ffffff',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: '16px',
              boxShadow: '0 16px 64px rgba(139, 0, 0, 0.8), 0 0 40px rgba(139, 0, 0, 1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 0 20px rgba(139, 0, 0, 0.8)',
              transform: 'translateY(0)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              animation: 'bloodPulse 3s infinite ease-in-out',
              backgroundSize: '200% 200%'
            }} 
            onClick={() => setMode('create')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 20px 80px rgba(139, 0, 0, 1), 0 0 60px rgba(139, 0, 0, 1.2)';
              e.target.style.background = 'linear-gradient(135deg, #3D1010 0%, #5D1A1A 30%, #7D2121 60%, #9B0000 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 16px 64px rgba(139, 0, 0, 0.8), 0 0 40px rgba(139, 0, 0, 1)';
              e.target.style.background = 'linear-gradient(135deg, #2D0808 0%, #4D0F0F 30%, #6D1717 60%, #8B0000 100%)';
            }}
          >
            {t.home.createRoom}
          </button>
          <button 
            className="btn btn-ghost" 
            style={{ 
              fontSize: '1rem', 
              padding: '18px 40px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 255, 0.3)',
              cursor: 'pointer'
            }} 
            onClick={() => setMode('join')}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.7)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            {t.home.joinGame}
          </button>
        </div>

        {/* How to play section */}
        <div style={{ 
          borderTop: '2px solid rgba(139, 0, 0, 0.5)', 
          paddingTop: '24px', 
          marginBottom: '32px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: window.innerWidth <= 720 ? '8px' : '24px 20px',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(139, 0, 0, 0.3)'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            marginBottom: '12px',
            color: '#ffffff',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 50px rgba(139, 0, 0, 0.8)',
            textAlign: 'center'
          }}>
            {t.home.howToPlay}
          </h2>
          
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '1rem', 
            lineHeight: 1.6, 
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
          }}>
            {t.home.rulesIntro}
          </p>

          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 700, 
            marginBottom: '6px', 
            marginTop: '16px',
            color: 'rgba(220, 20, 60, 1)',
            textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
          }}>
            {t.home.winCondition}
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '0.95rem', 
            lineHeight: 1.5, 
            marginBottom: '16px',
            textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
          }}>
            {t.home.winConditionDesc}
          </p>

          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 700, 
            marginBottom: '6px', 
            marginTop: '16px',
            color: 'rgba(220, 20, 60, 1)',
            textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
          }}>
            {t.home.gamble}
          </h3>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '0.95rem', 
            lineHeight: 1.6, 
            marginBottom: '16px',
            textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
          }} dangerouslySetInnerHTML={{ __html: t.home.rolesDesc }} />

          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 700, 
            marginBottom: '12px', 
            marginTop: '20px',
            color: 'rgba(220, 20, 60, 1)',
            textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
          }}>
            {t.home.gameFlow}
          </h3>
          
          <div style={{ marginBottom: '12px' }}>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '4px',
              color: 'rgba(255, 255, 255, 1)',
              textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Moon size={20} color="rgba(139, 0, 0, 1)" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 0, 0, 0.8))' }} />
              {t.home.nightPhase.replace('🌙 ', '')}
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.5,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.nightPhaseDesc}
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '4px',
              color: 'rgba(255, 255, 255, 1)',
              textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MessageCircle size={20} color="rgba(139, 0, 0, 1)" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 0, 0, 0.8))' }} />
              {t.home.dayPhase.replace('🌅 ', '')}
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.5,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.dayPhaseDesc}
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              marginBottom: '4px',
              color: 'rgba(255, 255, 255, 1)',
              textShadow: '0 2px 12px rgba(0, 0, 0, 1), 0 0 20px rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Vote size={20} color="rgba(139, 0, 0, 1)" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 0, 0, 0.8))' }} />
              {t.home.votingPhase.replace('🗳️ ', '')}
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.5,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.votingPhaseDesc}
            </p>
          </div>

          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            fontSize: '0.95rem', 
            lineHeight: 1.6, 
            marginTop: '20px', 
            paddingTop: '16px', 
            borderTop: '2px solid rgba(139, 0, 0, 0.4)',
            textShadow: '0 2px 12px rgba(0, 0, 0, 1)',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            {t.home.conclusion}
          </p>
        </div>

        {/* FAQ section for SEO */}
        <div style={{ 
          borderTop: '2px solid rgba(139, 0, 0, 0.5)', 
          paddingTop: '24px', 
          marginBottom: '32px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: window.innerWidth <= 720 ? '8px' : '24px 20px',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(139, 0, 0, 0.3)'
        }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            color: '#ffffff',
            textShadow: '0 0 30px rgba(255, 255, 255, 0.5), 0 0 50px rgba(139, 0, 0, 0.8)',
            textAlign: 'center'
          }}>
            {t.home.faqTitle}
          </h2>

          <p style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '1rem', 
            lineHeight: 1.6, 
            marginBottom: '20px',
            textAlign: 'center',
            textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
          }}>
            {t.home.faqIntro}
          </p>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              marginBottom: '6px',
              color: 'rgba(220, 20, 60, 1)',
              textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq1Q}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.6,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq1A}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              marginBottom: '6px',
              color: 'rgba(220, 20, 60, 1)',
              textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq2Q}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.6,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq2A}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              marginBottom: '6px',
              color: 'rgba(220, 20, 60, 1)',
              textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq3Q}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.6,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq3A}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              marginBottom: '6px',
              color: 'rgba(220, 20, 60, 1)',
              textShadow: '0 0 20px rgba(220, 20, 60, 0.8), 0 2px 8px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq4Q}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontSize: '0.95rem', 
              lineHeight: 1.6,
              textShadow: '0 2px 12px rgba(0, 0, 0, 1)'
            }}>
              {t.home.faq4A}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
