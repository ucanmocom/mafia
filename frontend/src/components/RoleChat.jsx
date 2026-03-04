import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const ROLE_COLOR = {
  mafia:     'var(--red-bright)',
  doctor:    'var(--green)',
  detective: 'var(--cyan)',
}

export default function RoleChat({ messages, role, onSend }) {
  const { t } = useLanguage()
  const [open, setOpen]   = useState(false)
  const [text, setText]   = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const prevLen   = useRef(messages.length)

  // Count unread when closed
  useEffect(() => {
    if (!open && messages.length > prevLen.current) {
      setUnread(u => u + (messages.length - prevLen.current))
    }
    prevLen.current = messages.length
  }, [messages.length, open])

  // Scroll to bottom when opened or new message
  useEffect(() => {
    if (open) {
      setUnread(0)
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages.length])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const color = ROLE_COLOR[role] || 'var(--cyan)'

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 16,
          zIndex: 900,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          background: 'var(--surface)',
          color,
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 4px 20px ${color}44`,
        }}
        title={t.chat[role]}
      >
        💬
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: -4, right: -4,
            background: color,
            color: '#000',
            borderRadius: '50%',
            width: 20, height: 20,
            fontSize: '0.7rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 84, right: 16,
          width: 'min(340px, calc(100vw - 32px))',
          maxHeight: '60vh',
          background: 'var(--surface)',
          border: `1px solid ${color}`,
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 900,
          boxShadow: `0 8px 32px #00000066`,
          animation: 'slideUp .2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>
              {t.chat[role]}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
                {t.chat.noMessages}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ lineHeight: 1.4 }}>
                <span style={{ color, fontWeight: 600, fontSize: '0.8rem' }}>{m.fromNick} </span>
                <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{m.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              className="input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.9rem' }}
              placeholder={t.chat.placeholder}
              value={text}
              maxLength={300}
              onChange={e => setText(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ width: 'auto', padding: '8px 14px', flexShrink: 0 }}
              disabled={!text.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}
