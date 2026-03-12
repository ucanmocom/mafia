import { Moon, MessageCircle, Vote } from 'lucide-react'

export default function BelowFoldContent({ t }) {
  return (
    <>
      {/* How to play section */}
      <div className="home-section">
        <h2 className="home-section-title">{t.home.howToPlay}</h2>
        <p className="home-section-text" style={{ marginBottom: '20px', textAlign: 'center' }}>
          {t.home.rulesIntro}
        </p>

        <h3 className="home-section-heading">{t.home.winCondition}</h3>
        <p className="home-section-text" style={{ marginBottom: '16px' }}>{t.home.winConditionDesc}</p>

        <h3 className="home-section-heading">{t.home.gamble}</h3>
        <p className="home-section-text" style={{ marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: t.home.rolesDesc }} />

        <h3 className="home-section-heading" style={{ marginBottom: '12px' }}>{t.home.gameFlow}</h3>

        <div style={{ marginBottom: '12px' }}>
          <p className="home-phase-title">
            <Moon size={20} color="rgba(139, 0, 0, 1)" />
            {t.home.nightPhase.replace('🌙 ', '')}
          </p>
          <p className="home-section-text">{t.home.nightPhaseDesc}</p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <p className="home-phase-title">
            <MessageCircle size={20} color="rgba(139, 0, 0, 1)" />
            {t.home.dayPhase.replace('🌅 ', '')}
          </p>
          <p className="home-section-text">{t.home.dayPhaseDesc}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p className="home-phase-title">
            <Vote size={20} color="rgba(139, 0, 0, 1)" />
            {t.home.votingPhase.replace('🗳️ ', '')}
          </p>
          <p className="home-section-text">{t.home.votingPhaseDesc}</p>
        </div>

        <p className="home-section-text" style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '2px solid rgba(139, 0, 0, 0.4)',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          {t.home.conclusion}
        </p>
      </div>

      {/* FAQ section */}
      <div className="home-section">
        <h2 className="home-section-title">{t.home.faqTitle}</h2>
        <p className="home-section-text" style={{ marginBottom: '20px', textAlign: 'center' }}>
          {t.home.faqIntro}
        </p>

        {[
          { q: t.home.faq1Q, a: t.home.faq1A },
          { q: t.home.faq2Q, a: t.home.faq2A },
          { q: t.home.faq3Q, a: t.home.faq3A },
          { q: t.home.faq4Q, a: t.home.faq4A },
        ].map(({ q, a }, i) => (
          <div key={i} style={{ marginBottom: i < 3 ? '16px' : 0 }}>
            <h3 className="home-section-heading" style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{q}</h3>
            <p className="home-section-text">{a}</p>
          </div>
        ))}
      </div>
    </>
  )
}
