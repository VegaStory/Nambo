import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PostCard } from '../components/PostCard'
import { CommentThread } from '../components/CommentThread'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import type { Comment, Community, Post, User } from '../types'

export function PostDetail() {
  const { id } = useParams()
  const { data, ensurePostInStore } = useApp()
  const fromStore = id ? data.posts.find((p) => p.id === id) : undefined

  const [post, setPost] = useState<Post | null>(fromStore ?? null)
  const [loading, setLoading] = useState(!fromStore)
  const [error, setError] = useState('')

  useEffect(() => {
    if (fromStore) {
      setPost(fromStore)
      setLoading(false)
      setError('')
    }
  }, [fromStore])

  useEffect(() => {
    if (!id) return

    let active = true
    // Always refresh from API so search / deep links work even if store is incomplete
    setLoading(!fromStore)
    setError('')

    api<{
      post: Post
      author: User | null
      comments: Comment[]
      community: Community | null
    }>(`/api/posts/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!active) return
        setPost(res.post)
        ensurePostInStore(res.post, res.author, res.comments)
      })
      .catch(() => {
        if (!active) return
        if (!fromStore) {
          setError('Post not found')
          setPost(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when id changes
  }, [id])

  if (loading && !post) {
    return (
      <div className="mx-auto flex max-w-2xl justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-slate-300">{error || 'Post not found.'}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
          <Link to="/search" className="text-sky-400 hover:underline">
            Back to search
          </Link>
          <Link to="/" className="text-sky-400 hover:underline">
            Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/search"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-sky-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <PostCard post={post} />
      <CommentThread postId={post.id} />
    </div>
  )
}
