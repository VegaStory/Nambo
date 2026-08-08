import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Info,
  BookOpen,
  MessageCircle,
  Users,
  Search,
  ImagePlus,
  Radio,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar } from '../components/Avatar'

type Tab = 'account' | 'about'

export function Settings() {
  const { currentUser, updateProfile, logout } = useApp()
  const [tab, setTab] = useState<Tab>('about')
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '')
  const [bio, setBio] = useState(currentUser?.bio ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!currentUser) {
    return <Navigate to="/signin" state={{ from: '/settings' }} replace />
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    try {
      await updateProfile({
        displayName: displayName.trim() || currentUser.displayName,
        bio: bio.trim(),
      })
      setSaved(true)
    } catch {
      setError('Could not save profile')
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: 'about', label: 'About Nambo', icon: Info },
    { id: 'account', label: 'Account', icon: User },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-sky-400">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Settings</h1>
          <p className="text-sm text-slate-400">Account preferences and about the app</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/40 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              tab === id
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <div className="space-y-4 fade-in">
          <section className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/20">
                <Radio className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">What is Nambo?</h2>
                <p className="text-sm text-slate-400">Talk · Share · Connect</p>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
              Nambo is a social space that blends the best of short-form status updates
              (like X) with topic-based community discussions (like Reddit). Post what
              you&apos;re thinking, share photos and videos, join communities, comment on
              posts, search by keyword or topic, and message people privately.
            </p>
          </section>

          <section className="glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">The name “Nambo”</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
              <strong className="text-sky-300">Nambo</strong> is a{' '}
              <strong className="text-slate-100">Tarascan</strong> (Purépecha) word that
              means <strong className="text-slate-100">“nobody”</strong> or{' '}
              <strong className="text-slate-100">“nothing.”</strong>
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-300">
              Here it stands for a place where titles fall away — where anyone can speak,
              listen, and belong without needing to be somebody first. Start from zero;
              build meaning together.
            </p>
          </section>

          <section className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-400" />
              <h2 className="text-base font-semibold text-white">How to use Nambo</h2>
            </div>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Create an account</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Sign up with a username, or try the demo account (
                    <span className="text-slate-300">demo / demo</span>). Edit your
                    display name and bio anytime under Account or on your profile.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Post & share media</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    On Home, write a status update or post into a community you&apos;ve
                    joined. Attach photos or videos. Use #tags so people can find your
                    topics in search.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/15 text-pink-400">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Join communities</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Open Communities to browse topics (tech, news, gaming, and more). Join
                    the ones you care about, or create a new community for your own space.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Search className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Search</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Use the search bar at the top to find keywords, #topics, people, and
                    communities. Explore shows news and hot posts at a glance.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Private messages</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Open Messages to chat 1:1. Search for a username, or visit someone&apos;s
                    profile and tap Message. Notifications appear on the bell when someone
                    likes, comments, or DMs you.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                  <Info className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-100">Ask Nambo (free AI)</div>
                  <p className="mt-0.5 text-sm text-slate-400">
                    Under every post, tap <strong className="text-slate-300">Ask Nambo</strong> for
                    free conversation starters. It runs on Nambo&apos;s own server — no API key,
                    free for every visitor (including on Render).
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <p className="px-1 text-center text-xs text-slate-600">
            Nambo — nobody and nothing, until we make something of it.
          </p>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4 fade-in">
          <section className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar
                name={currentUser.displayName}
                color={currentUser.avatarColor}
                size="lg"
              />
              <div>
                <div className="text-lg font-semibold text-white">
                  {currentUser.displayName}
                </div>
                <div className="text-sm text-slate-500">@{currentUser.username}</div>
                <Link
                  to={`/u/${currentUser.username}`}
                  className="mt-1 inline-block text-xs text-sky-400 hover:underline"
                >
                  View public profile
                </Link>
              </div>
            </div>

            <form onSubmit={(e) => void onSave(e)} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Display name</span>
                <input
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    setSaved(false)
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value)
                    setSaved(false)
                  }}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
                  placeholder="A short intro about you"
                />
              </label>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              {saved && (
                <p className="text-sm text-emerald-400">Profile saved.</p>
              )}
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Save changes
              </button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-200">Session</h2>
            <p className="mt-1 text-sm text-slate-400">
              Signed in as @{currentUser.username}. Sign out on this device when you&apos;re
              done.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-4 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Sign out
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
