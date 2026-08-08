import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Warns when the server is running without a persistent disk
 * (accounts disappear on Render restart).
 */
export function PersistenceBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/health')
      .then((r) => r.json())
      .then((data: { persistent?: boolean }) => {
        if (active && data && data.persistent === false) setShow(true)
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      active = false
    }
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-200">Accounts may reset on restart</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            This server has no permanent disk. On free Render, restarts wipe the database — so
            you may need a new account each time. Fix: in Render → Disks → mount{' '}
            <code className="rounded bg-black/30 px-1">/var/data</code>, then set env{' '}
            <code className="rounded bg-black/30 px-1">DATA_DIR=/var/data</code> and redeploy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-amber-200/70 hover:bg-amber-500/20"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
