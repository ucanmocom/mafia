import { useEffect, useRef, useCallback } from 'react'

const WS_URL = (() => {
  // In dev: connect to backend on port 3001
  if (import.meta.env.DEV) {
    return 'ws://localhost:3001'
  }
  // In production: use VITE_WS_URL from environment variables (set in Cloudflare)
  return import.meta.env.VITE_WS_URL
})()

/**
 * useWebSocket – auto-reconnecting WebSocket hook.
 *
 * @param {(event: string, data: object) => void} onMessage  called on every parsed message
 * @param {() => void}                            onOpen     called after (re)connect
 * @returns {{ send: (event, payload) => void, close: () => void }}
 */
export function useWebSocket(onMessage, onOpen) {
  const wsRef          = useRef(null)
  const retryTimer     = useRef(null)
  const retryDelay     = useRef(1000)
  const destroyed      = useRef(false)
  const onMessageRef   = useRef(onMessage)
  const onOpenRef      = useRef(onOpen)

  // Keep refs fresh without triggering reconnect
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onOpenRef.current    = onOpen    }, [onOpen])

  const connect = useCallback(() => {
    if (destroyed.current) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      retryDelay.current = 1000
      onOpenRef.current?.()
    }

    ws.onmessage = (e) => {
      try {
        const { event, ...data } = JSON.parse(e.data)
        onMessageRef.current?.(event, data)
      } catch { /* ignore malformed */ }
    }

    ws.onclose = () => {
      if (destroyed.current) return
      retryTimer.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 1.5, 10000)
        connect()
      }, retryDelay.current)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    destroyed.current = false
    connect()
    return () => {
      destroyed.current = true
      clearTimeout(retryTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((event, payload = {}) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, ...payload }))
      return true
    }
    return false
  }, [])

  const close = useCallback(() => {
    destroyed.current = true
    clearTimeout(retryTimer.current)
    wsRef.current?.close()
  }, [])

  return { send, close }
}
