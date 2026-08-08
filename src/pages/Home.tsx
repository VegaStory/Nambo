import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { CreatePost } from '../components/CreatePost'
import { PostCard } from '../components/PostCard'
import { Link } from 'react-router-dom'

type Tab = 'for-you' | 'following' | 'latest'

export function Home() {
  const { data, currentUser } = useApp()
  const [tab, setTab] = useState<Tab>('latest')

  const posts = useMemo(() => {
    let list = [...data.posts]

    if (tab === 'following' && currentUser) {
      list = list.filter(
        (p) =>
          !p.communityId ||
          currentUser.joinedCommunities.includes(p.communityId),
      )
    }

    // Newest posts always at the top of the feed
    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

    return list
  }, [data, currentUser, tab])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'for-you', label: 'For you' },
    { id: 'following', label: 'Your communities' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Home</h1>
        <p className="mt-1 text-sm text-slate-400">
          Real-time takes and community discussions in one feed.
        </p>
      </div>

      {currentUser ? (
        <CreatePost />
      ) : (
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-slate-300">
            Join Nambo to post, comment, and upload photos & videos.
          </p>
          <Link
            to="/signin"
            className="mt-3 inline-flex rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white"
          >
            Sign in — try demo / demo
          </Link>
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {posts.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-slate-400">
            No posts here yet. Join communities or switch tabs.
          </div>
        )}
      </div>
    </div>
  )
}
