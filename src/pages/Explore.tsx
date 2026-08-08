import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PostCard } from '../components/PostCard'
import { formatCount } from '../lib/time'
import { Flame, Hash, Newspaper } from 'lucide-react'

export function Explore() {
  const { data } = useApp()

  const hotPosts = useMemo(() => {
    return [...data.posts]
      .sort((a, b) => {
        const score = (p: typeof a) =>
          p.likes.length * 2 +
          data.comments.filter((c) => c.postId === p.id).length
        return score(b) - score(a)
      })
      .slice(0, 8)
  }, [data])

  const newsPosts = useMemo(
    () =>
      data.posts
        .filter(
          (p) =>
            p.communityId === 'c_news' ||
            p.tags.some((t) => ['news', 'briefing', 'local', 'transit'].includes(t)),
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [data.posts],
  )

  const topics = useMemo(() => {
    const map = new Map<string, number>()
    data.communities.forEach((c) => {
      map.set(c.topic, (map.get(c.topic) ?? 0) + c.memberCount)
    })
    data.posts.forEach((p) => {
      p.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 5))
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [data])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Explore</h1>
        <p className="mt-1 text-sm text-slate-400">
          News desk, hot posts, and topic discovery.
        </p>
      </div>

      <section className="glass rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Hash className="h-4 w-4 text-sky-400" />
          Topics & keywords
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map(([topic, score]) => (
            <Link
              key={topic}
              to={`/search?q=${encodeURIComponent(topic)}`}
              className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 hover:border-sky-500/50 hover:text-sky-300"
            >
              {topic}
              <span className="ml-1.5 text-xs text-slate-500">{formatCount(score)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Newspaper className="h-4 w-4 text-pink-400" />
          News desk
        </h2>
        <div className="space-y-3">
          {newsPosts.length === 0 && (
            <p className="text-sm text-slate-500">No news posts right now.</p>
          )}
          {newsPosts.map((p) => (
            <PostCard key={p.id} post={p} compact />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Flame className="h-4 w-4 text-orange-400" />
          Hot right now
        </h2>
        <div className="space-y-3">
          {hotPosts.map((p) => (
            <PostCard key={p.id} post={p} compact />
          ))}
        </div>
      </section>
    </div>
  )
}
