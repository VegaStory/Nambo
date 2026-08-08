import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Radio, Loader2 } from 'lucide-react'

export function SignIn() {
  const { login, currentUser, loading } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && currentUser) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const err = await login(username, password)
      if (err) setError(err)
      else navigate(from)
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
        <h1 className="text-3xl font-bold tracking-tight text-white">Sign in to Nambo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pick up your feed, communities, and private messages.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="glass space-y-4 rounded-2xl p-6 sm:p-8">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="username"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            placeholder="••••••••"
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
          Sign in
        </button>

        <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-3 text-center text-xs text-slate-400">
          Demo account:{' '}
          <button
            type="button"
            className="font-semibold text-sky-400 hover:underline"
            onClick={() => {
              setUsername('demo')
              setPassword('demo')
            }}
          >
            demo / demo
          </button>
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-slate-400">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-sky-400 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        <Link to="/" className="hover:text-sky-400">
          Continue browsing
        </Link>
      </p>
    </div>
  )
}
