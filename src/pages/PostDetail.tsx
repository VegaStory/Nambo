import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { PostCard } from '../components/PostCard'
import { CommentThread } from '../components/CommentThread'
import { ArrowLeft } from 'lucide-react'

export function PostDetail() {
  const { id } = useParams()
  const { data } = useApp()
  const post = data.posts.find((p) => p.id === id)

  if (!post) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-slate-300">Post not found.</p>
        <Link to="/" className="mt-2 inline-block text-sky-400 hover:underline">
          Back home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-sky-400">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <PostCard post={post} />
      <CommentThread postId={post.id} />
    </div>
  )
}
