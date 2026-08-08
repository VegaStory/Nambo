import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Avatar } from '../components/Avatar'
import { PostCard } from '../components/PostCard'
import { timeAgo } from '../lib/time'
import { Calendar, MessageCircle, Settings } from 'lucide-react'

export function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { data, currentUser, updateProfile, openConversation } = useApp()
  const user = data.users.find((u) => u.username === username)
  const isSelf = currentUser?.id === user?.id
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [messaging, setMessaging] = useState(false)

  const posts = useMemo(() => {
    if (!user) return []
    return data.posts
      .filter((p) => p.authorId === user.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [data.posts, user])

  const communities = useMemo(() => {
    if (!user) return []
    return data.communities.filter((c) => user.joinedCommunities.includes(c.id))
  }, [data.communities, user])

  if (!user) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-slate-300">User not found.</p>
        <Link to="/" className="mt-2 inline-block text-sky-400 hover:underline">
          Home
        </Link>
      </div>
    )
  }

  const startEdit = () => {
    setDisplayName(user.displayName)
    setBio(user.bio)
    setEditing(true)
  }

  const save = async () => {
    await updateProfile({ displayName: displayName.trim() || user.displayName, bio: bio.trim() })
    setEditing(false)
  }

  const messageUser = async () => {
    if (!currentUser) {
      navigate('/signin', { state: { from: `/u/${user.username}` } })
      return
    }
    setMessaging(true)
    try {
      const id = await openConversation({ username: user.username })
      if (id) navigate(`/messages/${id}`)
    } finally {
      setMessaging(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={user.displayName} color={user.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void save()}
                    className="rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-full border border-slate-600 px-4 py-1.5 text-sm text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
                    <p className="text-sm text-slate-500">@{user.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isSelf ? (
                      <>
                        <Link
                          to="/settings"
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <button
                          type="button"
                          onClick={startEdit}
                          className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                        >
                          Edit profile
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void messageUser()}
                        disabled={messaging}
                        className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-300">{user.bio}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {timeAgo(user.createdAt)}
                </p>
              </>
            )}
          </div>
        </div>

        {communities.length > 0 && (
          <div className="mt-4 border-t border-slate-800 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Communities
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {communities.map((c) => (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    background: `${c.color}22`,
                    color: c.color,
                    border: `1px solid ${c.color}44`,
                  }}
                >
                  c/{c.slug}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold text-slate-300">Posts · {posts.length}</h2>
      <div className="space-y-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
        {posts.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-slate-500">No posts yet.</div>
        )}
      </div>
    </div>
  )
}
