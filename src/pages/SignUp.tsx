import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Radio, Loader2 } from 'lucide-react'

export function SignUp() {
  const { register, currentUser, loading } = useApp()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && currentUser) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const err = await register(username, displayName, password)
      if (err) setError(err)
      else navigate('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-2">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/30">
          <Radio className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Join Nambo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Share status updates, join communities, and message friends.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="glass space-y-4 rounded-2xl p-6 sm:p-8">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-300">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="username"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Letters, numbers, and underscores only
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="At least 3 characters"
          />
        </label>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/signin" className="font-semibold text-sky-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
