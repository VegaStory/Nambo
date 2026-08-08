import { useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Share2,
  Hash,
  Sparkles,
  Loader2,
  X,
  Send,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react'
import type { Post } from '../types'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'
import { MediaDisplay } from './MediaDisplay'
import { timeAgo } from '../lib/time'

interface PostCardProps {
  post: Post
  compact?: boolean
}

/** Light cleanup so **markdown** from the helper reads cleanly in plain text. */
function formatNamboReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^— \*\*Nambo\*\*.*$/m, '— Nambo · free conversation helper')
}

export function PostCard({ post, compact = false }: PostCardProps) {
  const {
    currentUser,
    getUser,
    getCommunity,
    getPostComments,
    toggleLikePost,
    askNambo,
    addComment,
    updatePost,
    deletePost,
  } = useApp()
  const navigate = useNavigate()
  const author = getUser(post.authorId) ?? {
    id: post.authorId,
    username: 'unknown',
    displayName: 'Unknown user',
    bio: '',
    avatarColor: '#64748b',
    createdAt: post.createdAt,
    joinedCommunities: [] as string[],
  }
  const community = post.communityId ? getCommunity(post.communityId) : null
  const comments = getPostComments(post.id)
  const liked = currentUser ? post.likes.includes(currentUser.id) : false
  // Strict string compare — ids can differ by type after JSON
  const isOwner = Boolean(
    currentUser && String(currentUser.id) === String(post.authorId),
  )

  const [aiOpen, setAiOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiReply, setAiReply] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiError, setAiError] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [askCount, setAskCount] = useState(0)
  const replyRef = useRef<HTMLDivElement>(null)

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.content)
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const stop = (e: MouseEvent | FormEvent | KeyboardEvent) => {
    e.stopPropagation()
  }

  const runAsk = async (question?: string) => {
    const q = (question ?? '').trim()
    setAiBusy(true)
    setAiError('')
    try {
      const res = await askNambo(post.id, q)
      if (!res?.reply) {
        setAiError('Nambo could not reply. Check your connection and try again.')
        return
      }
      setAiReply(formatNamboReply(res.reply))
      setAskCount((n) => n + 1)
      requestAnimationFrame(() => {
        replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } catch {
      setAiError('Something went wrong talking to Nambo. Please try again.')
    } finally {
      setAiBusy(false)
    }
  }

  const openAi = async (e: MouseEvent) => {
    stop(e)
    e.preventDefault()
    setAiOpen(true)
    setAiError('')
    setAiQuestion('')
    // Fresh opener every time the panel opens
    await runAsk('')
  }

  const onAskSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (aiBusy) return
    if (!aiQuestion.trim()) {
      setAiError('Type a question first, then press Ask.')
      return
    }
    await runAsk(aiQuestion)
  }

  const postAsComment = async (e: MouseEvent) => {
    stop(e)
    if (!currentUser) {
      navigate('/signin')
      return
    }
    if (!aiReply) return
    setPostingComment(true)
    try {
      const text = `🤖 Nambo spark:\n\n${aiReply}`
      await addComment(post.id, text, null)
      setAiOpen(false)
      navigate(`/post/${post.id}`)
    } finally {
      setPostingComment(false)
    }
  }

  const openPost = (e?: MouseEvent) => {
    e?.stopPropagation()
    if (aiOpen || editing || confirmDelete) return
    navigate(`/post/${encodeURIComponent(post.id)}`)
  }

  const startEdit = (e: MouseEvent) => {
    e.stopPropagation()
    setEditText(post.content)
    setEditError('')
    setEditing(true)
    setConfirmDelete(false)
    setAiOpen(false)
  }

  const saveEdit = async (e: FormEvent | MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (editBusy) return
    const next = editText.trim()
    if (!next && !post.mediaId) {
      setEditError('Post cannot be empty')
      return
    }
    setEditBusy(true)
    setEditError('')
    try {
      const updated = await updatePost(post.id, next)
      if (!updated) {
        setEditError('Could not save changes')
        return
      }
      setEditing(false)
    } finally {
      setEditBusy(false)
    }
  }

  const doDelete = async (e: MouseEvent) => {
    e.stopPropagation()
    if (deleteBusy) return
    setDeleteBusy(true)
    try {
      const ok = await deletePost(post.id)
      if (!ok) {
        setEditError('Could not delete post')
        setConfirmDelete(false)
        return
      }
      // If we were on the post page, go home
      if (window.location.pathname.startsWith('/post/')) {
        navigate('/')
      }
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <article
      className="glass rounded-2xl p-4 sm:p-5 hover:border-sky-500/30 transition-colors fade-in cursor-pointer"
      onClick={(e) => openPost(e)}
      onKeyDown={(e) => {
        if (editing || confirmDelete || aiOpen) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openPost()
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="flex gap-3">
        <Link
          to={`/u/${author.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <Avatar name={author.displayName} color={author.avatarColor} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Link
                to={`/u/${author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-slate-100 hover:underline"
              >
                {author.displayName}
              </Link>
              <span className="text-slate-500">@{author.username}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{timeAgo(post.createdAt)}</span>
              {community && (
                <>
                  <span className="text-slate-600">·</span>
                  <Link
                    to={`/c/${community.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: `${community.color}22`,
                      color: community.color,
                      border: `1px solid ${community.color}44`,
                    }}
                  >
                    c/{community.slug}
                  </Link>
                </>
              )}
              {!community && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-sky-400/90 font-medium">Status</span>
                </>
              )}
            </div>
            {isOwner && !editing && (
              <div
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-500/50 bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDelete(true)
                    setEditing(false)
                    setAiOpen(false)
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form
              className="mt-2 space-y-2"
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => void saveEdit(e)}
            >
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-[15px] text-slate-100 outline-none focus:border-sky-500"
                autoFocus
              />
              {editError && <p className="text-sm text-rose-400">{editError}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={editBusy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {editBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  disabled={editBusy}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditing(false)
                    setEditError('')
                  }}
                  className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p
              className={`mt-2 text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap ${
                compact ? 'line-clamp-3' : ''
              }`}
            >
              {post.content}
            </p>
          )}

          {post.mediaId && post.mediaType && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <MediaDisplay mediaId={post.mediaId} mediaType={post.mediaType} />
            </div>
          )}

          {!editing && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {confirmDelete && (
            <div
              className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm text-rose-100">Delete this post permanently?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={(e) => void doDelete(e)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {deleteBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Yes, delete
                </button>
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDelete(false)
                  }}
                  className="rounded-full border border-slate-600 px-3 py-1.5 text-sm text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1 sm:gap-2 text-slate-400">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (!currentUser) {
                  navigate('/signin')
                  return
                }
                void toggleLikePost(post.id)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition hover:bg-rose-500/10 ${
                liked ? 'text-rose-400' : 'hover:text-rose-400'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              {post.likes.length}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/post/${post.id}`)
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition hover:bg-sky-500/10 hover:text-sky-400"
            >
              <MessageCircle className="h-4 w-4" />
              {comments.length}
            </button>
            <button
              type="button"
              onClick={(e) => void openAi(e)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-violet-300 transition hover:bg-violet-500/15 hover:text-violet-200"
              title="Free AI — spark a conversation"
            >
              <Sparkles className="h-4 w-4" />
              Ask Nambo
            </button>
            {isOwner && !editing && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-sm font-medium text-sky-300 hover:bg-sky-500/20"
                  title="Edit post"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDelete(true)
                    setEditing(false)
                    setAiOpen(false)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
                  title="Delete post"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const url = `${window.location.origin}/post/${post.id}`
                void navigator.clipboard?.writeText(url)
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition hover:bg-violet-500/10 hover:text-violet-400"
              title="Copy link"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {aiOpen && (
            <div
              className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 sm:p-4"
              onClick={stop}
              onMouseDown={stop}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
                  <Sparkles className="h-4 w-4" />
                  Ask Nambo · free AI
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    stop(e)
                    setAiOpen(false)
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Type a question about this post, then press Ask. Nambo will answer below.
              </p>

              <form
                className="mt-3 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => void onAskSubmit(e)}
                onClick={stop}
              >
                <input
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onClick={stop}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="e.g. Summarize this, or why does this matter?"
                  className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                  disabled={aiBusy}
                />
                <button
                  type="submit"
                  disabled={aiBusy}
                  onClick={stop}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
                >
                  {aiBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Ask
                </button>
              </form>

              {aiBusy && (
                <div className="mt-3 flex items-center gap-2 text-sm text-violet-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Nambo is thinking…
                </div>
              )}

              {aiError && (
                <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {aiError}
                </p>
              )}

              {/* Keep previous answer visible while loading a new one */}
              {aiReply && (
                <div
                  ref={replyRef}
                  key={askCount}
                  className={`mt-3 rounded-xl border border-violet-500/20 bg-slate-950/50 p-3 fade-in ${
                    aiBusy ? 'opacity-60' : ''
                  }`}
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-300">
                    Nambo’s answer
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {aiReply}
                  </div>
                  <button
                    type="button"
                    disabled={postingComment || aiBusy}
                    onClick={(e) => void postAsComment(e)}
                    className="mt-3 text-xs font-medium text-sky-400 hover:underline disabled:opacity-50"
                  >
                    {postingComment ? 'Posting…' : 'Post this as a comment'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
