import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

interface SearchBarProps {
  initial?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({ initial = '', className = '', autoFocus = false }: SearchBarProps) {
  const [q, setQ] = useState(initial)
  const navigate = useNavigate()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search keywords, topics, people…"
        autoFocus={autoFocus}
        className="w-full rounded-full border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
      />
    </form>
  )
}
