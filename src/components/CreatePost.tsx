import { useRef, useState } from 'react'
import { ImagePlus, Video, X, Send, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'

interface CreatePostProps {
  defaultCommunityId?: string | null
  onPosted?: () => void
  compact?: boolean
}

export function CreatePost({
  defaultCommunityId = null,
  onPosted,
  compact = false,
}: CreatePostProps) {
  const { currentUser, data, createPost } = useApp()
  const [content, setContent] = useState('')
  const [communityId, setCommunityId] = useState<string | null>(defaultCommunityId)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  if (!currentUser) return null

  const joined = data.communities.filter((c) =>
    currentUser.joinedCommunities.includes(c.id),
  )

  const pickFile = (f: File | null) => {
    if (!f) return
    const isVideo = f.type.startsWith('video/')
    const isImage = f.type.startsWith('image/')
    if (!isVideo && !isImage) {
      setError('Only images and videos are supported')
      return
    }
    if (f.size > 40 * 1024 * 1024) {
      setError('File must be under 40MB')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const clearMedia = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
  }

  const submit = async () => {
    if (!content.trim() && !file) {
      setError('Write something or add media')
      return
    }
    setBusy(true)
    setError('')
    try {
      const post = await createPost({
        content,
        communityId,
        tags: [],
        mediaFile: file,
      })
      if (post) {
        setContent('')
        clearMedia()
        onPosted?.()
      }
    } catch {
      setError('Could not create post')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex gap-3">
        <Avatar name={currentUser.displayName} color={currentUser.avatarColor} />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              communityId
                ? 'Share with the community… Use #tags for topics'
                : "What's on your mind? Use #tags for topics"
            }
            rows={compact ? 2 : 3}
            className="w-full resize-none bg-transparent text-[15px] text-slate-100 placeholder:text-slate-500 outline-none"
          />

          {preview && (
            <div className="relative mt-2 overflow-hidden rounded-xl border border-slate-700">
              {file?.type.startsWith('video/') ? (
                <video src={preview} controls className="max-h-64 w-full bg-black" />
              ) : (
                <img src={preview} alt="Preview" className="max-h-64 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={clearMedia}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-700/80 pt-3">
            <select
              value={communityId ?? ''}
              onChange={(e) => setCommunityId(e.target.value || null)}
              className="rounded-full border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="">Personal status</option>
              {joined.map((c) => (
                <option key={c.id} value={c.id}>
                  c/{c.slug}
                </option>
              ))}
            </select>

            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-sky-400 hover:bg-sky-500/10"
              title="Add image"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-violet-400 hover:bg-violet-500/10"
              title="Add video"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </button>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:opacity-95 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
