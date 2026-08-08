import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Radio, Loader2, KeyRound, CheckCircle2, Copy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { api, ApiError } from '../lib/api'

type Step = 'request' | 'reset' | 'done'

export function ForgotPassword() {
  const { currentUser, loading } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('request')
  const [username, setUsername] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [shownCode, setShownCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!loading && currentUser) {
    return <Navigate to="/" replace />
  }

  const requestCode = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const res = await api<{
        ok: boolean
        found?: boolean
        message: string
        resetCode?: string
        username?: string
      }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })

      if (res.found && res.resetCode) {
        setShownCode(res.resetCode)
        setResetCode(res.resetCode)
        if (res.username) setUsername(res.username)
        setInfo(res.message)
        setStep('reset')
      } else {
        setError(
          'No account found for that username. Check the spelling or create an account.',
        )
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start reset')
    } finally {
      setBusy(false)
    }
  }

  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setBusy(true)
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username,
          code: resetCode.trim(),
          password,
        }),
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password')
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!shownCode) return
    try {
      await navigator.clipboard.writeText(shownCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-2">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg shadow-sky-500/30">
          <KeyRound className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {step === 'done' ? 'Password updated' : 'Forgot password'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 'request' && 'Enter your username to get a reset code.'}
          {step === 'reset' && 'Enter the code and choose a new password.'}
          {step === 'done' && 'You can sign in with your new password.'}
        </p>
      </div>

      {step === 'request' && (
        <form
          onSubmit={(e) => void requestCode(e)}
          className="glass space-y-4 rounded-2xl p-6 sm:p-8"
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-300">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="your username"
            />
          </label>

          <p className="text-xs leading-relaxed text-slate-500">
            Nambo will create a one-time reset code (valid 15 minutes). Because email
            is not set up yet, the code is shown on the next screen so you can finish
            recovery yourself.
          </p>

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
            Get reset code
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form
          onSubmit={(e) => void submitNewPassword(e)}
          className="glass space-y-4 rounded-2xl p-6 sm:p-8"
        >
          {shownCode && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-sky-300/90">
                Your reset code
              </p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-[0.25em] text-white">
                {shownCode}
              </p>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="mt-2 inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy code'}
              </button>
              <p className="mt-2 text-xs text-slate-400">Expires in 15 minutes</p>
            </div>
          )}

          {info && <p className="text-xs text-slate-400">{info}</p>}

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none focus:border-sky-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Reset code</span>
            <input
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 font-mono text-sm tracking-widest outline-none focus:border-sky-500"
              placeholder="6-digit code"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="At least 3 characters"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-3 text-sm outline-none focus:border-sky-500"
              placeholder="Repeat new password"
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
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Set new password
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('request')
              setShownCode('')
              setResetCode('')
              setPassword('')
              setConfirm('')
              setError('')
            }}
            className="w-full text-center text-sm text-slate-400 hover:text-sky-400"
          >
            Request a different code
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="glass space-y-4 rounded-2xl p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="text-sm text-slate-300">
            Your password for <strong className="text-white">@{username}</strong> has been
            updated.
          </p>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 py-3 text-sm font-semibold text-white"
          >
            Back to sign in
          </button>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-400">
        Remember it?{' '}
        <Link to="/signin" className="font-semibold text-sky-400 hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-600">
        <Radio className="h-3 w-3" />
        Nambo password recovery
      </p>
    </div>
  )
}
