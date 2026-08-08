import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  AppData,
  Comment,
  Community,
  ConversationSummary,
  Message,
  Notification,
  Post,
  User,
} from '../types'
import { api, getToken, setToken, ApiError } from '../lib/api'

interface CreatePostInput {
  content: string
  communityId: string | null
  tags: string[]
  mediaFile?: File | null
}

interface AppContextValue {
  data: AppData
  currentUser: User | null
  loading: boolean
  connected: boolean
  notifications: Notification[]
  unreadNotifications: number
  conversations: ConversationSummary[]
  unreadMessages: number
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, displayName: string, password: string) => Promise<string | null>
  logout: () => void
  updateProfile: (patch: Partial<Pick<User, 'displayName' | 'bio'>>) => Promise<void>
  createPost: (input: CreatePostInput) => Promise<Post | null>
  updatePost: (postId: string, content: string) => Promise<Post | null>
  deletePost: (postId: string) => Promise<boolean>
  toggleLikePost: (postId: string) => Promise<void>
  addComment: (postId: string, content: string, parentId?: string | null) => Promise<Comment | null>
  toggleLikeComment: (commentId: string) => Promise<void>
  createCommunity: (name: string, description: string, topic: string) => Promise<Community | null>
  toggleJoinCommunity: (communityId: string) => Promise<void>
  getUser: (userId: string) => User | undefined
  getCommunity: (communityId: string) => Community | undefined
  getPostComments: (postId: string) => Comment[]
  search: (query: string) => Promise<{
    posts: Post[]
    communities: Community[]
    users: User[]
    tags: string[]
  }>
  refresh: () => Promise<void>
  markNotificationsRead: (ids?: string[]) => Promise<void>
  loadConversations: () => Promise<void>
  openConversation: (usernameOrId: { username?: string; userId?: string }) => Promise<string | null>
  loadMessages: (conversationId: string) => Promise<{
    messages: Message[]
    otherUser: User
    conversationId: string
  } | null>
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>
  mediaUrl: (mediaId: string | null) => string | null
  askNambo: (
    postId: string,
    question?: string,
  ) => Promise<{ reply: string; free: boolean; engine: string } | null>
  ensurePostInStore: (
    post: Post,
    author?: User | null,
    comments?: Comment[],
  ) => void
}

const emptyData: AppData = {
  users: [],
  communities: [],
  posts: [],
  comments: [],
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const socketRef = useRef<Socket | null>(null)

  const mergeUser = useCallback((user: User) => {
    setData((prev) => {
      const idx = prev.users.findIndex((u) => u.id === user.id)
      if (idx === -1) return { ...prev, users: [...prev.users, user] }
      const users = [...prev.users]
      users[idx] = user
      return { ...prev, users }
    })
  }, [])

  const loadBootstrap = useCallback(async () => {
    const boot = await api<AppData>('/api/bootstrap')
    setData({
      users: boot.users,
      communities: boot.communities,
      posts: boot.posts,
      comments: boot.comments,
    })
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!getToken()) {
      setNotifications([])
      return
    }
    try {
      const res = await api<{ notifications: Notification[] }>('/api/notifications')
      setNotifications(res.notifications)
    } catch {
      /* ignore */
    }
  }, [])

  const loadConversations = useCallback(async () => {
    if (!getToken()) {
      setConversations([])
      return
    }
    try {
      const res = await api<{ conversations: ConversationSummary[] }>('/api/conversations')
      setConversations(res.conversations)
    } catch {
      /* ignore */
    }
  }, [])

  const refresh = useCallback(async () => {
    await loadBootstrap()
    await Promise.all([loadNotifications(), loadConversations()])
  }, [loadBootstrap, loadNotifications, loadConversations])

  // Initial load + session restore
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadBootstrap()
        const token = getToken()
        if (token) {
          try {
            const me = await api<{ user: User }>('/api/auth/me')
            if (!cancelled) {
              setCurrentUser(me.user)
              mergeUser(me.user)
              await Promise.all([loadNotifications(), loadConversations()])
            }
          } catch {
            setToken(null)
            if (!cancelled) setCurrentUser(null)
          }
        }
      } catch (err) {
        console.error('Failed to load Nambo data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadBootstrap, loadNotifications, loadConversations, mergeUser])

  // Socket.io
  useEffect(() => {
    const token = getToken()
    if (!currentUser || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setConnected(false)
      return
    }

    const socket = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('notification', (n: Notification) => {
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50))
    })

    socket.on('post:new', (post: Post) => {
      setData((prev) => {
        if (prev.posts.some((p) => p.id === post.id)) return prev
        return { ...prev, posts: [post, ...prev.posts] }
      })
    })

    socket.on('post:updated', (post: Post) => {
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === post.id ? post : p)),
      }))
    })

    socket.on('post:deleted', (payload: { id: string }) => {
      if (!payload?.id) return
      setData((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== payload.id),
        comments: prev.comments.filter((c) => c.postId !== payload.id),
      }))
    })

    socket.on('comment:new', (comment: Comment) => {
      setData((prev) => {
        if (prev.comments.some((c) => c.id === comment.id)) return prev
        return { ...prev, comments: [...prev.comments, comment] }
      })
    })

    socket.on('message:new', (message: Message) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversationId)
        if (idx === -1) {
          void loadConversations()
          return prev
        }
        const next = [...prev]
        const conv = { ...next[idx] }
        conv.lastMessage = message
        conv.updatedAt = message.createdAt
        if (message.senderId !== currentUser.id) {
          conv.unread = (conv.unread || 0) + 1
        }
        next.splice(idx, 1)
        return [conv, ...next]
      })
      // custom browser event so message page can append
      window.dispatchEvent(new CustomEvent('Nambo:message', { detail: message }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [currentUser, loadConversations])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await api<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setToken(res.token)
      setCurrentUser(res.user)
      mergeUser(res.user)
      await Promise.all([loadBootstrap(), loadNotifications(), loadConversations()])
      return null
    } catch (e) {
      return e instanceof ApiError ? e.message : 'Login failed'
    }
  }, [loadBootstrap, loadNotifications, loadConversations, mergeUser])

  const register = useCallback(
    async (username: string, displayName: string, password: string) => {
      try {
        const res = await api<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, displayName, password }),
        })
        setToken(res.token)
        setCurrentUser(res.user)
        mergeUser(res.user)
        await Promise.all([loadBootstrap(), loadNotifications(), loadConversations()])
        return null
      } catch (e) {
        return e instanceof ApiError ? e.message : 'Registration failed'
      }
    },
    [loadBootstrap, loadNotifications, loadConversations, mergeUser],
  )

  const logout = useCallback(() => {
    setToken(null)
    setCurrentUser(null)
    setNotifications([])
    setConversations([])
    socketRef.current?.disconnect()
  }, [])

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, 'displayName' | 'bio'>>) => {
      const res = await api<{ user: User }>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setCurrentUser(res.user)
      mergeUser(res.user)
    },
    [mergeUser],
  )

  const createPost = useCallback(async (input: CreatePostInput) => {
    const form = new FormData()
    form.append('content', input.content ?? '')
    if (input.communityId) form.append('communityId', input.communityId)
    if (input.mediaFile) form.append('media', input.mediaFile)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60_000)
    try {
      const res = await api<{ post: Post }>('/api/posts', {
        method: 'POST',
        formData: form,
        signal: controller.signal,
      })
      if (!res?.post) return null
      setData((prev) => {
        if (prev.posts.some((p) => p.id === res.post.id)) return prev
        return { ...prev, posts: [res.post, ...prev.posts] }
      })
      return res.post
    } catch (err) {
      console.error('createPost failed', err)
      throw err
    } finally {
      clearTimeout(timer)
    }
  }, [])

  const updatePost = useCallback(async (postId: string, content: string) => {
    try {
      const res = await api<{ post: Post }>(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      })
      if (!res?.post) return null
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? res.post : p)),
      }))
      return res.post
    } catch (err) {
      console.error('updatePost failed', err)
      return null
    }
  }, [])

  const deletePost = useCallback(async (postId: string) => {
    try {
      await api(`/api/posts/${postId}`, { method: 'DELETE' })
      setData((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
        comments: prev.comments.filter((c) => c.postId !== postId),
      }))
      return true
    } catch (err) {
      console.error('deletePost failed', err)
      return false
    }
  }, [])

  const toggleLikePost = useCallback(async (postId: string) => {
    try {
      const res = await api<{ post: Post }>(`/api/posts/${postId}/like`, { method: 'POST' })
      setData((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? res.post : p)),
      }))
    } catch {
      /* ignore */
    }
  }, [])

  const addComment = useCallback(
    async (postId: string, content: string, parentId: string | null = null) => {
      try {
        const res = await api<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content, parentId }),
        })
        setData((prev) => {
          if (prev.comments.some((c) => c.id === res.comment.id)) return prev
          return { ...prev, comments: [...prev.comments, res.comment] }
        })
        return res.comment
      } catch {
        return null
      }
    },
    [],
  )

  const toggleLikeComment = useCallback(async (commentId: string) => {
    try {
      const res = await api<{ comment: Comment }>(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })
      setData((prev) => ({
        ...prev,
        comments: prev.comments.map((c) => (c.id === commentId ? res.comment : c)),
      }))
    } catch {
      /* ignore */
    }
  }, [])

  const createCommunity = useCallback(
    async (name: string, description: string, topic: string) => {
      try {
        const res = await api<{ community: Community }>('/api/communities', {
          method: 'POST',
          body: JSON.stringify({ name, description, topic }),
        })
        setData((prev) => ({
          ...prev,
          communities: [res.community, ...prev.communities],
        }))
        if (currentUser) {
          const updated = {
            ...currentUser,
            joinedCommunities: [...currentUser.joinedCommunities, res.community.id],
          }
          setCurrentUser(updated)
          mergeUser(updated)
        }
        return res.community
      } catch {
        return null
      }
    },
    [currentUser, mergeUser],
  )

  const toggleJoinCommunity = useCallback(
    async (communityId: string) => {
      try {
        const res = await api<{ community: Community; user: User }>(
          `/api/communities/${communityId}/join`,
          { method: 'POST' },
        )
        setData((prev) => ({
          ...prev,
          communities: prev.communities.map((c) =>
            c.id === communityId ? res.community : c,
          ),
        }))
        setCurrentUser(res.user)
        mergeUser(res.user)
      } catch {
        /* ignore */
      }
    },
    [mergeUser],
  )

  const getUser = useCallback(
    (userId: string) => data.users.find((u) => u.id === userId),
    [data.users],
  )

  const getCommunity = useCallback(
    (communityId: string) => data.communities.find((c) => c.id === communityId),
    [data.communities],
  )

  const getPostComments = useCallback(
    (postId: string) =>
      data.comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [data.comments],
  )

  const search = useCallback(async (query: string) => {
    const q = query.trim()
    if (!q) return { posts: [], communities: [], users: [], tags: [] as string[] }
    const res = await api<{
      posts: Post[]
      communities: Community[]
      users: User[]
      tags: string[]
    }>(`/api/search?q=${encodeURIComponent(q)}`)

    // Merge search hits into local state so opening a result works
    setData((prev) => {
      const postMap = new Map(prev.posts.map((p) => [p.id, p]))
      for (const p of res.posts) postMap.set(p.id, p)
      const userMap = new Map(prev.users.map((u) => [u.id, u]))
      for (const u of res.users) userMap.set(u.id, u)
      // Also pull authors of result posts if missing (best-effort from users list)
      const communityMap = new Map(prev.communities.map((c) => [c.id, c]))
      for (const c of res.communities) communityMap.set(c.id, c)
      return {
        ...prev,
        posts: [...postMap.values()].sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        ),
        users: [...userMap.values()],
        communities: [...communityMap.values()],
      }
    })

    return res
  }, [])

  const markNotificationsRead = useCallback(async (ids?: string[]) => {
    try {
      await api('/api/notifications/read', {
        method: 'POST',
        body: JSON.stringify(ids ? { ids } : {}),
      })
      setNotifications((prev) =>
        prev.map((n) => (ids ? (ids.includes(n.id) ? { ...n, read: true } : n) : { ...n, read: true })),
      )
    } catch {
      /* ignore */
    }
  }, [])

  const openConversation = useCallback(
    async ({ username, userId }: { username?: string; userId?: string }) => {
      try {
        const res = await api<{ conversation: ConversationSummary }>('/api/conversations', {
          method: 'POST',
          body: JSON.stringify({ username, userId }),
        })
        setConversations((prev) => {
          if (prev.some((c) => c.id === res.conversation.id)) return prev
          return [res.conversation, ...prev]
        })
        return res.conversation.id
      } catch {
        return null
      }
    },
    [],
  )

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await api<{
        messages: Message[]
        otherUser: User
        conversationId: string
      }>(`/api/conversations/${conversationId}/messages`)
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)),
      )
      socketRef.current?.emit('join_conversation', conversationId)
      return res
    } catch {
      return null
    }
  }, [])

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      const res = await api<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content }),
        },
      )
      return res.message
    } catch {
      return null
    }
  }, [])

  const mediaUrl = useCallback((mediaId: string | null) => {
    if (!mediaId) return null
    if (mediaId.startsWith('http') || mediaId.startsWith('blob:')) return mediaId
    return `/uploads/${mediaId}`
  }, [])

  const askNambo = useCallback(async (postId: string, question?: string) => {
    try {
      const res = await api<{ reply: string; free: boolean; engine: string }>(
        `/api/posts/${postId}/ask-nambo`,
        {
          method: 'POST',
          body: JSON.stringify({ question: question || '' }),
        },
      )
      if (!res?.reply) return null
      return res
    } catch (err) {
      console.error('Ask Nambo failed', err)
      return null
    }
  }, [])

  const ensurePostInStore = useCallback(
    (post: Post, author?: User | null, comments?: Comment[]) => {
      setData((prev) => {
        const posts = prev.posts.some((p) => p.id === post.id)
          ? prev.posts.map((p) => (p.id === post.id ? post : p))
          : [post, ...prev.posts]
        let users = prev.users
        if (author && !prev.users.some((u) => u.id === author.id)) {
          users = [...prev.users, author]
        }
        let nextComments = prev.comments
        if (comments?.length) {
          const map = new Map(prev.comments.map((c) => [c.id, c]))
          for (const c of comments) map.set(c.id, c)
          nextComments = [...map.values()]
        }
        return { ...prev, posts, users, comments: nextComments }
      })
    },
    [],
  )

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const unreadMessages = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread || 0), 0),
    [conversations],
  )

  const value: AppContextValue = {
    data,
    currentUser,
    loading,
    connected,
    notifications,
    unreadNotifications,
    conversations,
    unreadMessages,
    login,
    register,
    logout,
    updateProfile,
    createPost,
    updatePost,
    deletePost,
    toggleLikePost,
    addComment,
    toggleLikeComment,
    createCommunity,
    toggleJoinCommunity,
    getUser,
    getCommunity,
    getPostComments,
    search,
    refresh,
    markNotificationsRead,
    loadConversations,
    openConversation,
    loadMessages,
    sendMessage,
    mediaUrl,
    askNambo,
    ensurePostInStore,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
