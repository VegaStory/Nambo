import { useApp } from '../context/AppContext'
import type { MediaType } from '../types'

interface MediaDisplayProps {
  mediaId: string
  mediaType: MediaType
  className?: string
}

export function MediaDisplay({ mediaId, mediaType, className = '' }: MediaDisplayProps) {
  const { mediaUrl } = useApp()
  const url = mediaUrl(mediaId)

  if (!url) {
    return (
      <div
        className={`rounded-xl bg-slate-800/80 border border-slate-700 animate-pulse h-48 ${className}`}
      />
    )
  }

  if (mediaType === 'video') {
    return (
      <video
        src={url}
        controls
        className={`w-full max-h-[480px] rounded-xl border border-slate-700 bg-black ${className}`}
      />
    )
  }

  return (
    <img
      src={url}
      alt="Post media"
      className={`w-full max-h-[520px] object-cover rounded-xl border border-slate-700 ${className}`}
    />
  )
}
