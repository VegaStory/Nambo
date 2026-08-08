import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { timeAgo } from '../lib/time'

export function NotificationsBell() {
  const { currentUser, notifications, unreadNotifications, markNotificationsRead } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!currentUser) return null

  const openPanel = async () => {
    setOpen((v) => !v)
    if (!open && unreadNotifications > 0) {
      await markNotificationsRead()
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => void openPanel()}
        className="relative rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet
              </p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                to={n.link || '/'}
                onClick={() => setOpen(false)}
                className={`block border-b border-slate-800/80 px-4 py-3 hover:bg-slate-800/60 ${
                  !n.read ? 'bg-sky-500/5' : ''
                }`}
              >
                <div className="text-sm font-medium text-slate-100">{n.title}</div>
                {n.body && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-slate-400">{n.body}</div>
                )}
                <div className="mt-1 text-[11px] text-slate-500">{timeAgo(n.createdAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
