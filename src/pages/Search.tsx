import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PostCard } from '../components/PostCard'
import { SearchBar } from '../components/SearchBar'
import { Avatar } from '../components/Avatar'
import { formatCount } from '../lib/time'
import type { Community, Post, User } from '../types'
import { Hash, Users, UserRound, FileText, Loader2 } from 'lucide-react'

export function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const { search } = useApp()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    posts: Post[]
    communities: Community[]
    users: User[]
    tags: string[]
  }>({ posts: [], communities: [], users: [], tags: [] })

  useEffect(() => {
    let active = true
    if (!q.trim()) {
      setResults({ posts: [], communities: [], users: [], tags: [] })
      return
    }
    setLoading(true)
    search(q)
      .then((res) => {
        if (active) setResults(res)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [q, search])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Search</h1>
        <p className="mt-1 text-sm text-slate-400">
          Find keywords, topics, communities, people, and posts.
        </p>
      </div>

      <SearchBar initial={q} autoFocus />

      {!q.trim() && (
        <div className="glass rounded-2xl p-8 text-center text-slate-500">
          Try searching for “tech”, “news”, “gaming”, or a username.
        </div>
      )}

      {q.trim() && loading && (
        <div className="flex justify-center py-10 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {q.trim() && !loading && (
        <>
          {results.tags.length > 0 && (
            <section className="glass rounded-2xl p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Hash className="h-4 w-4 text-sky-400" />
                Topics
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {results.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/search?q=${encodeURIComponent(t)}`}
                    className="rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1 text-sm text-sky-400"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.communities.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Users className="h-4 w-4 text-violet-400" />
                Communities · {results.communities.length}
              </h2>
              <div className="space-y-2">
                {results.communities.map((c) => (
                  <Link
                    key={c.id}
                    to={`/c/${c.slug}`}
                    className="glass flex items-center gap-3 rounded-2xl p-3 hover:border-sky-500/30"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-slate-950"
                      style={{ background: c.color }}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">c/{c.slug}</div>
                      <div className="text-xs text-slate-500">
                        {c.topic} · {formatCount(c.memberCount)} members
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.users.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <UserRound className="h-4 w-4 text-pink-400" />
                People · {results.users.length}
              </h2>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/u/${u.username}`}
                    className="glass flex items-center gap-3 rounded-2xl p-3 hover:border-sky-500/30"
                  >
                    <Avatar name={u.displayName} color={u.avatarColor} />
                    <div>
                      <div className="font-medium">{u.displayName}</div>
                      <div className="text-xs text-slate-500">@{u.username}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <FileText className="h-4 w-4 text-emerald-400" />
              Posts · {results.posts.length}
            </h2>
            <div className="space-y-3">
              {results.posts.map((p) => (
                <PostCard key={p.id} post={p} compact />
              ))}
              {results.posts.length === 0 &&
                results.communities.length === 0 &&
                results.users.length === 0 &&
                results.tags.length === 0 && (
                  <div className="glass rounded-2xl p-8 text-center text-slate-500">
                    No results for “{q}”.
                  </div>
                )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
