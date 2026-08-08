import { useEffect, useRef, useState } from 'react'
import { Check, Crop, RefreshCw, X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageEditorProps {
  file: File
  onApply: (file: File) => void
  onCancel: () => void
  onReplace: () => void
}

/**
 * Simple in-browser crop/zoom editor (no extra packages).
 * User can zoom and drag, then export a cropped JPEG.
 */
export function ImageEditor({ file, onApply, onCancel, onReplace }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setReady(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const size = 320 // square crop viewport

  useEffect(() => {
    if (!ready || !imgRef.current || !canvasRef.current) return
    const img = imgRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, size)

    const base = Math.max(size / img.width, size / img.height)
    const scale = base * zoom
    const w = img.width * scale
    const h = img.height * scale
    const x = (size - w) / 2 + offset.x
    const y = (size - h) / 2 + offset.y
    ctx.drawImage(img, x, y, w, h)

    // crop frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, size - 2, size - 2)
  }, [ready, zoom, offset, objectUrl])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const apply = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const name = file.name.replace(/\.\w+$/, '') + '-cropped.jpg'
        const next = new File([blob], name, { type: 'image/jpeg' })
        onApply(next)
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-slate-600 bg-slate-900/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-sky-300">
          <Crop className="h-4 w-4" />
          Edit / crop photo
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="Close editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        Drag to pan · use zoom · then Apply crop
      </p>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="cursor-grab touch-none rounded-lg border border-slate-700 active:cursor-grabbing"
          style={{ width: size, height: size, maxWidth: '100%' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
          className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          <ZoomOut className="h-3.5 w-3.5" />
          Zoom out
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
          className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          <ZoomIn className="h-3.5 w-3.5" />
          Zoom in
        </button>
        <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>

        <button
          type="button"
          onClick={onReplace}
          className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Replace photo
        </button>

        <button
          type="button"
          onClick={apply}
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Check className="h-3.5 w-3.5" />
          Apply crop
        </button>
      </div>
    </div>
  )
}
