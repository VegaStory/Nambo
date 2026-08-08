import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const TOPICS = [
  'Technology',
  'News',
  'Science',
  'Gaming',
  'Business',
  'Politics',
  'Entertainment',
  'Humor',
  'Sports',
  'Art',
  'General',
]

export function CreateCommunity() {
  const { currentUser, createCommunity } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('General')
  const [error, setError] = useState('')

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md glass rounded-2xl p-8 text-center">
        <p className="text-slate-300">Sign in to create a community.</p>
        <Link to="/signin" className="mt-3 inline-block text-sky-400 hover:underline">
          Go to sign in
        </Link>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const c = await createCommunity(name, description, topic)
    if (!c) {
      setError('Could not create community. Name may already be taken.')
      return
    }
    navigate(`/c/${c.slug}`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-white sm:text-2xl">Create a community</h1>
      <p className="mt-1 text-sm text-slate-400">
        Start a topic space people can join and discuss in.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="glass mt-5 space-y-4 rounded-2xl p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Climate Action"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-300">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What is this community about?"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500"
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 py-2.5 text-sm font-semibold text-white"
        >
          Create community
        </button>
      </form>
    </div>
  )
}
