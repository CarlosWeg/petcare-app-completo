import { useState, useCallback, useEffect } from 'react'

let toastFn = null
export const toast = (msg, type = 'success') => toastFn?.(msg, type)

export function ToastProvider() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((msg, type) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  useEffect(() => { toastFn = show }, [show])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
