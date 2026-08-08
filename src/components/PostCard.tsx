import { useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Hash, Sparkles, Loader2, X, Send } from 'lucide-react'
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
  } = useApp()
  const navigate = useNavigate()
  const author = getUser(post.authorId)
  const community = post.communityId ? getCommunity(post.communityId) : null
  const comments = getPostComments(post.id)
  const liked = currentUser ? post.likes.includes(currentUser.id) : false

  const [aiOpen, setAiOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiReply, setAiReply] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiError, setAiError] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [askCount, setAskCount] = useState(0)
  const replyRef = useRef<HTMLDivElement>(null)

  if (!author) return null

  const stop = (e: MouseEvent | FormEvent | KeyboardEvent) => {
    e.stopPropagation()
  }

  const runAsk = async (question?: string) => {
    setAiBusy(true)
    setAiError('')
    try {
      const res = await askNambo(post.id, question?.trim() || '')
      if (!res?.reply) {
        setAiError('Nambo could not reply. Check your connection and try again.')
        return
      }
      setAiReply(formatNamboReply(res.reply))
      setAskCount((n) => n + 1)
      // Scroll answer into view after paint
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
    // Always fetch a fresh spark when opening, or if empty
    if (!aiReply) {
      await runAsk()
    }
  }

  const onAskSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (aiBusy) return
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

  return (
    <article
      className="glass rounded-2xl p-4 sm:p-5 hover:border-sky-500/30 transition-colors fade-in cursor-pointer"
      onClick={() => {
        if (!aiOpen) navigate(`/post/${post.id}`)
      }}
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
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

          <p
            className={`mt-2 text-[15px] leading-relaxed text-slate-200 whitespace-pre-wrap ${
              compact ? 'line-clamp-3' : ''
            }`}
          >
            {post.content}
          </p>

          {post.mediaId && post.mediaType && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <MediaDisplay mediaId={post.mediaId} mediaType={post.mediaType} />
            </div>
          )}

          {post.tags.length > 0 && (
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

              {aiReply && !aiBusy && (
                <div
                  ref={replyRef}
                  key={askCount}
                  className="mt-3 rounded-xl border border-violet-500/20 bg-slate-950/50 p-3 fade-in"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-300">
                    Nambo’s answer
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                    {aiReply}
                  </div>
                  <button
                    type="button"
                    disabled={postingComment}
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
