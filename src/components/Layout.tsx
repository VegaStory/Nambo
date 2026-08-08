import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  Home,
  Compass,
  Users,
  User,
  LogIn,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Radio,
  MessageCircle,
  Settings,
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { SearchBar } from './SearchBar'
import { Avatar } from './Avatar'
import { NotificationsBell } from './NotificationsBell'
import { formatCount } from '../lib/time'

const nav = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircle, auth: true },
  { to: '/settings', label: 'Settings', icon: Settings, auth: true },
]

export function Layout() {
  const { currentUser, logout, data, unreadMessages, loading, connected } = useApp()
  const [open, setOpen] = useState(false)

  const trendingTags = (() => {
    const counts = new Map<string, number>()
    data.posts.forEach((p) => {
      p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1 + p.likes.length))
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  })()

  const topCommunities = [...data.communities]
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 5)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-sky-500/15 text-sky-300'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`

  const SidebarNav = () => (
    <>
      <Link to="/" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/20">
          <Radio className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
            Nambo
            {currentUser && (
              <span
                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`}
                title={connected ? 'Live connected' : 'Connecting…'}
              />
            )}
          </div>
          <div className="text-[11px] text-slate-500">Talk · Share · Connect</div>
        </div>
      </Link>

      <nav className="space-y-1">
        {nav
          .filter((item) => !item.auth || currentUser)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {to === '/messages' && unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-0.5 text-[9px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          ))}
        {currentUser && (
          <NavLink
            to={`/u/${currentUser.username}`}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <User className="h-5 w-5" />
            Profile
          </NavLink>
        )}
      </nav>

      {currentUser ? (
        <div className="mt-6 space-y-3 border-t border-slate-800 pt-4">
          <Link
            to="/communities/new"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
          >
            <PlusCircle className="h-4 w-4" />
            New community
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
            <Avatar name={currentUser.displayName} color={currentUser.avatarColor} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{currentUser.displayName}</div>
              <div className="truncate text-xs text-slate-500">@{currentUser.username}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-2 border-t border-slate-800 pt-4">
          <Link
            to="/signin"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center rounded-full border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>
      )}
    </>
  )

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-0 lg:gap-6 px-0 sm:px-3 lg:px-6">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col py-5 lg:flex">
        <SidebarNav />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-slate-950 p-5 shadow-2xl">
            <button
              type="button"
              className="mb-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 border-x border-slate-800/80">
        <header className="sticky top-0 z-30 glass border-b border-slate-800/80 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <SearchBar className="flex-1" />
            <NotificationsBell />
            {currentUser ? (
              <Link
                to="/messages"
                className="relative rounded-full p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/signin"
                className="hidden rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>
        <div className="px-3 py-4 sm:px-4 pb-20 lg:pb-8">
          {loading ? (
            <div className="mx-auto max-w-2xl space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto py-5 xl:block">
        <div className="space-y-4">
          <section className="glass rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-slate-200">Trending topics</h2>
            <ul className="mt-3 space-y-2">
              {trendingTags.map(([tag, score]) => (
                <li key={tag}>
                  <Link
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-800/70"
                  >
                    <span className="text-sky-400">#{tag}</span>
                    <span className="text-xs text-slate-500">{score}</span>
                  </Link>
                </li>
              ))}
              {trendingTags.length === 0 && (
                <li className="text-sm text-slate-500">No tags yet</li>
              )}
            </ul>
          </section>

          <section className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">Top communities</h2>
              <Link to="/communities" className="text-xs text-sky-400 hover:underline">
                See all
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {topCommunities.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/c/${c.slug}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-800/70"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-slate-950"
                      style={{ background: c.color }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">c/{c.slug}</div>
                      <div className="text-xs text-slate-500">
                        {formatCount(c.memberCount)} members · {c.topic}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-2 text-xs text-slate-600">
            Nambo API + live sockets. Accounts and messages sync across browsers on this server.
          </p>
        </div>
      </aside>
    </div>
  )
}
