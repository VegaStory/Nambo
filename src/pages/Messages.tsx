import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar } from '../components/Avatar'
import { timeAgo } from '../lib/time'
import type { Message } from '../types'

export function Messages() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const {
    currentUser,
    conversations,
    loadConversations,
    loadMessages,
    sendMessage,
    openConversation,
    data,
  } = useApp()

  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<{
    id: string
    username: string
    displayName: string
    avatarColor: string
  } | null>(null)
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentUser) void loadConversations()
  }, [currentUser, loadConversations])

  useEffect(() => {
    if (!conversationId || !currentUser) {
      setMessages([])
      setOtherUser(null)
      return
    }
    let active = true
    ;(async () => {
      const res = await loadMessages(conversationId)
      if (!active || !res) return
      setMessages(res.messages)
      setOtherUser(res.otherUser)
    })()
    return () => {
      active = false
    }
  }, [conversationId, currentUser, loadMessages])

  useEffect(() => {
    const handler = (e: Event) => {
      const message = (e as CustomEvent<Message>).detail
      if (!conversationId || message.conversationId !== conversationId) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    }
    window.addEventListener('Nambo:message', handler)
    return () => window.removeEventListener('Nambo:message', handler)
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !currentUser) return []
    return data.users
      .filter(
        (u) =>
          u.id !== currentUser.id &&
          (u.username.toLowerCase().includes(q) ||
            u.displayName.toLowerCase().includes(q)),
      )
      .slice(0, 6)
  }, [query, data.users, currentUser])

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg glass rounded-2xl p-8 text-center">
        <MessageCircle className="mx-auto h-10 w-10 text-sky-400" />
        <p className="mt-3 text-slate-300">Sign in to send and receive private messages.</p>
        <Link
          to="/signin"
          state={{ from: '/messages' }}
          className="mt-4 inline-flex rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const onSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!conversationId || !text.trim()) return
    setBusy(true)
    try {
      const msg = await sendMessage(conversationId, text)
      if (msg) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        setText('')
        void loadConversations()
      }
    } finally {
      setBusy(false)
    }
  }

  const startChat = async (username: string) => {
    const id = await openConversation({ username })
    setQuery('')
    if (id) navigate(`/messages/${id}`)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col gap-3 sm:h-[calc(100vh-6rem)] sm:flex-row">
      {/* Conversation list */}
      <aside
        className={`glass flex w-full flex-col overflow-hidden rounded-2xl sm:w-80 sm:shrink-0 ${
          conversationId ? 'hidden sm:flex' : 'flex'
        }`}
      >
        <div className="border-b border-slate-800 p-4">
          <h1 className="text-lg font-bold text-white">Messages</h1>
          <p className="text-xs text-slate-500">Private DMs · real-time</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find people to message…"
              className="w-full rounded-full border border-slate-700 bg-slate-900/70 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
            />
          </div>
          {filteredUsers.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => void startChat(u.username)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800"
                >
                  <Avatar name={u.displayName} color={u.avatarColor} size="sm" />
                  <span>
                    <span className="font-medium">{u.displayName}</span>
                    <span className="ml-1 text-slate-500">@{u.username}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              No conversations yet. Search for someone above.
            </p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/messages/${c.id}`)}
              className={`flex w-full items-center gap-3 border-b border-slate-800/70 px-4 py-3 text-left hover:bg-slate-800/50 ${
                conversationId === c.id ? 'bg-sky-500/10' : ''
              }`}
            >
              <Avatar
                name={c.otherUser.displayName}
                color={c.otherUser.avatarColor}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-100">
                    {c.otherUser.displayName}
                  </span>
                  {c.lastMessage && (
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-slate-400">
                    {c.lastMessage?.content || 'Start chatting'}
                  </p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section
        className={`glass flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl ${
          conversationId ? 'flex' : 'hidden sm:flex'
        }`}
      >
        {!conversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageCircle className="h-12 w-12 text-slate-600" />
            <p className="mt-3 text-sm">Select a conversation or start a new one</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-800 px-3 py-3 sm:px-4">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 sm:hidden"
                onClick={() => navigate('/messages')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {otherUser && (
                <Link to={`/u/${otherUser.username}`} className="flex items-center gap-3">
                  <Avatar
                    name={otherUser.displayName}
                    color={otherUser.avatarColor}
                    size="sm"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {otherUser.displayName}
                    </div>
                    <div className="text-xs text-slate-500">@{otherUser.username}</div>
                  </div>
                </Link>
              )}
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4">
              {messages.map((m) => {
                const mine = m.senderId === currentUser.id
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                        mine
                          ? 'rounded-br-md bg-gradient-to-br from-sky-500 to-violet-500 text-white'
                          : 'rounded-bl-md bg-slate-800 text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? 'text-white/70' : 'text-slate-500'
                        }`}
                      >
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => void onSend(e)}
              className="flex gap-2 border-t border-slate-800 p-3 sm:p-4"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a private message…"
                className="flex-1 rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}
