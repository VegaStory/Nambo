import { useState, type FormEvent } from 'react'
import { Heart, Reply, Pencil, Trash2, Check, Loader2, X } from 'lucide-react'
import type { Comment } from '../types'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'
import { timeAgo } from '../lib/time'
import { Link } from 'react-router-dom'

interface CommentThreadProps {
  postId: string
}

function CommentItem({
  comment,
  replies,
  all,
  depth = 0,
}: {
  comment: Comment
  replies: Comment[]
  all: Comment[]
  depth?: number
}) {
  const {
    currentUser,
    getUser,
    addComment,
    toggleLikeComment,
    updateComment,
    deleteComment,
  } = useApp()
  const author = getUser(comment.authorId) ?? {
    id: comment.authorId,
    username: 'unknown',
    displayName: 'Unknown user',
    bio: '',
    avatarColor: '#64748b',
    createdAt: comment.createdAt,
    joinedCommunities: [] as string[],
  }
  const [replying, setReplying] = useState(false)
  const [text, setText] = useState('')
  const liked = currentUser ? comment.likes.includes(currentUser.id) : false

  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [editBusy, setEditBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const canModerate = Boolean(currentUser)

  const submit = async () => {
    if (!text.trim()) return
    await addComment(comment.postId, text, comment.id)
    setText('')
    setReplying(false)
  }

  const saveEdit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (editBusy) return
    const next = editText.trim()
    if (!next) return
    setEditBusy(true)
    try {
      const updated = await updateComment(comment.id, next)
      if (updated) setEditing(false)
    } finally {
      setEditBusy(false)
    }
  }

  const doDelete = async () => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try {
      await deleteComment(comment.id)
    } finally {
      setDeleteBusy(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className={depth > 0 ? 'ml-6 sm:ml-10 border-l border-slate-700/70 pl-3 sm:pl-4' : ''}>
      <div className="flex gap-2.5 py-3">
        <Avatar name={author.displayName} color={author.avatarColor} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 text-sm">
              <Link
                to={`/u/${author.username}`}
                className="font-semibold text-slate-100 hover:underline"
              >
                {author.displayName}
              </Link>
              <span className="text-slate-500">@{author.username}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{timeAgo(comment.createdAt)}</span>
            </div>
            {canModerate && !editing && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditText(comment.content)
                    setEditing(true)
                    setConfirmDelete(false)
                    setReplying(false)
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(true)
                    setEditing(false)
                    setReplying(false)
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form className="mt-2 space-y-2" onSubmit={(e) => void saveEdit(e)}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={editBusy}
                  className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {editBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  disabled={editBusy}
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-1 text-sm text-slate-200 whitespace-pre-wrap">{comment.content}</p>
          )}

          {confirmDelete && (
            <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5">
              <p className="text-xs text-rose-100">
                Delete this comment{replies.length ? ' and its replies' : ''}?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={() => void doDelete()}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {deleteBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Yes, delete
                </button>
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-slate-600 px-2.5 py-1 text-xs text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => currentUser && void toggleLikeComment(comment.id)}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition hover:bg-rose-500/10 ${
                liked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
              {comment.likes.length || ''}
            </button>
            {currentUser && depth < 3 && !editing && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-sky-500/10 hover:text-sky-400"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-2 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Reply to @${author.username}`}
                className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
                onKeyDown={(e) => e.key === 'Enter' && void submit()}
              />
              <button
                type="button"
                onClick={() => void submit()}
                className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
      {replies.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          replies={all.filter((c) => c.parentId === r.id)}
          all={all}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { currentUser, getPostComments, addComment } = useApp()
  const comments = getPostComments(postId)
  const roots = comments.filter((c) => !c.parentId)
  const [text, setText] = useState('')

  const submit = async () => {
    if (!text.trim()) return
    await addComment(postId, text, null)
    setText('')
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-200">
        Comments · {comments.length}
      </h3>
      {currentUser && (
        <p className="mt-1 text-xs text-slate-500">
          Signed-in users can edit or delete any post or comment.
        </p>
      )}

      {currentUser ? (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Join the conversation…"
            className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm outline-none focus:border-sky-500"
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
          />
          <button
            type="button"
            onClick={() => void submit()}
            className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Comment
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          <Link to="/signin" className="text-sky-400 hover:underline">
            Sign in
          </Link>{' '}
          to comment, edit, or delete.
        </p>
      )}

      <div className="mt-2 divide-y divide-slate-800">
        {roots.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">No comments yet. Start the thread.</p>
        )}
        {roots.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={comments.filter((r) => r.parentId === c.id)}
            all={comments}
          />
        ))}
      </div>
    </div>
  )
}
