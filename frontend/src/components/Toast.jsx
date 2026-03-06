import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'info', onClose = null }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-hide after 3 seconds for info/success, 5 seconds for error
    const duration = type === 'error' ? 5000 : 3000
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [type])

  if (!isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div className={`toast toast-${type}`} style={{ position: 'relative' }}>
      {message}
      <button
        className="btn btn-ghost btn-sm"
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '2px 6px',
          fontSize: '1.2rem',
        }}
        onClick={handleClose}
        title="Zamknij"
      >
        ✕
      </button>
    </div>
  )
}

