import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCount } from '../lib/time'
import { Plus, Users } from 'lucide-react'

export function Communities() {
  const { data, currentUser, toggleJoinCommunity } = useApp()
  const sorted = [...data.communities].sort((a, b) => b.memberCount - a.memberCount)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Communities</h1>
          <p className="mt-1 text-sm text-slate-400">
            Topic-based spaces for deeper discussion — Reddit-style, built into your feed.
          </p>
        </div>
        {currentUser && (
          <Link
            to="/communities/new"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {sorted.map((c) => {
          const joined = currentUser?.joinedCommunities.includes(c.id)
          return (
            <div key={c.id} className="glass rounded-2xl p-4 sm:p-5 fade-in">
              <div className="flex gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-slate-950"
                  style={{ background: c.color }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/c/${c.slug}`} className="text-base font-semibold text-white hover:underline">
                    c/{c.slug}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{c.topic}</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatCount(c.memberCount)} members
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-3">{c.description}</p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/c/${c.slug}`}
                      className="rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/50"
                    >
                      Open
                    </Link>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => void toggleJoinCommunity(c.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          joined
                            ? 'border border-slate-600 text-slate-300 hover:bg-slate-800'
                            : 'bg-sky-500 text-white'
                        }`}
                      >
                        {joined ? 'Joined' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
