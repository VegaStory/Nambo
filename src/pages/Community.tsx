import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { CreatePost } from '../components/CreatePost'
import { PostCard } from '../components/PostCard'
import { formatCount } from '../lib/time'
import { Users, ArrowLeft } from 'lucide-react'

export function Community() {
  const { slug } = useParams()
  const { data, currentUser, toggleJoinCommunity } = useApp()

  const community = data.communities.find((c) => c.slug === slug)
  const posts = useMemo(() => {
    if (!community) return []
    return data.posts
      .filter((p) => p.communityId === community.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [data.posts, community])

  if (!community) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-slate-300">Community not found.</p>
        <Link to="/communities" className="mt-2 inline-block text-sky-400 hover:underline">
          Browse communities
        </Link>
      </div>
    )
  }

  const joined = currentUser?.joinedCommunities.includes(community.id)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/communities"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-sky-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Communities
      </Link>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="h-24 sm:h-28" style={{ background: `linear-gradient(135deg, ${community.color}, #0f172a)` }} />
        <div className="px-4 pb-4 sm:px-5">
          <div
            className="-mt-8 flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-slate-950 ring-4 ring-slate-900"
            style={{ background: community.color }}
          >
            {community.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">c/{community.slug}</h1>
              <p className="mt-1 text-sm text-slate-400">{community.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">
                  {community.topic}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {formatCount(community.memberCount)} members
                </span>
              </div>
            </div>
            {currentUser && (
              <button
                type="button"
                onClick={() => void toggleJoinCommunity(community.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  joined
                    ? 'border border-slate-600 text-slate-200 hover:bg-slate-800'
                    : 'bg-sky-500 text-white'
                }`}
              >
                {joined ? 'Joined' : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {currentUser && joined && <CreatePost defaultCommunityId={community.id} />}
      {currentUser && !joined && (
        <p className="text-center text-sm text-slate-500">Join this community to post here.</p>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-slate-400">
            No posts in this community yet. Be the first.
          </div>
        )}
      </div>
    </div>
  )
}
