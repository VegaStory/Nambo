import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import db, { initDb, UPLOADS_DIR } from './db.js'
import { seedIfEmpty } from './seed.js'
import {
  publicUser,
  getUserById,
  getUserByUsername,
  mapCommunity,
  mapPost,
  mapComment,
  extractTags,
  createNotification,
  pairKey,
} from './helpers.js'
import { sparkConversation } from './namboAi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'nambo-dev-secret-change-me'
const COLORS = [
  '#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#fb7185', '#60a5fa', '#c084fc', '#2dd4bf', '#f97316',
]

initDb()
seedIfEmpty()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: true, credentials: true },
})

const onlineUsers = new Map() // userId -> Set of socket ids

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Unauthorized'))
    const payload = jwt.verify(token, JWT_SECRET)
    socket.userId = payload.sub
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.userId
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
  onlineUsers.get(userId).add(socket.id)
  socket.join(`user:${userId}`)

  socket.on('join_conversation', (conversationId) => {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
    if (!conv) return
    if (conv.user_a !== userId && conv.user_b !== userId) return
    socket.join(`conv:${conversationId}`)
  })

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`)
  })

  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId)
    if (set) {
      set.delete(socket.id)
      if (set.size === 0) onlineUsers.delete(userId)
    }
  })
})

function emitToUser(userId, event, payload) {
  io.to(`user:${userId}`).emit(event, payload)
}

function notify(userId, data) {
  const n = createNotification(data)
  if (n) emitToUser(userId, 'notification', n)
  return n
}

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images and videos allowed'))
    }
  },
})

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Sign in required' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET)
      req.userId = payload.sub
    } catch {
      /* ignore */
    }
  }
  next()
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

// ─── Auth ───────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, displayName, password } = req.body || {}
  const clean = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
  if (clean.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' })
  if (!displayName?.trim()) return res.status(400).json({ error: 'Display name is required' })
  if (!password || String(password).length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' })
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(clean)
  if (existing) return res.status(409).json({ error: 'Username already taken' })

  const id = newId('u')
  const now = new Date().toISOString()
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const passwordHash = bcrypt.hashSync(String(password), 10)

  db.prepare(`
    INSERT INTO users (id, username, display_name, bio, avatar_color, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, clean, displayName.trim(), 'New on Nambo.', color, passwordHash, now)

  // auto-join starter communities if present
  for (const slug of ['technology', 'worldnews']) {
    const c = db.prepare('SELECT id FROM communities WHERE slug = ?').get(slug)
    if (c) {
      db.prepare(
        'INSERT OR IGNORE INTO community_members (community_id, user_id, joined_at) VALUES (?, ?, ?)',
      ).run(c.id, id, now)
    }
  }

  const user = getUserById(id)
  res.status(201).json({ token: signToken(id), user })
})

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(String(username || '').trim())
  if (!row) return res.status(401).json({ error: 'User not found' })
  if (!bcrypt.compareSync(String(password || ''), row.password_hash)) {
    return res.status(401).json({ error: 'Incorrect password' })
  }
  res.json({ token: signToken(row.id), user: publicUser(row) })
})

app.get('/api/auth/me', auth, (req, res) => {
  const user = getUserById(req.userId)
  if (!user) return res.status(401).json({ error: 'User not found' })
  res.json({ user })
})

// Forgot password: create a short-lived reset code
// (Shown in-app because email is not configured yet — free for self-hosted / Render)
app.post('/api/auth/forgot-password', (req, res) => {
  const username = String(req.body?.username || '').trim()
  if (!username) return res.status(400).json({ error: 'Username is required' })

  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username)

  // Same generic message if user missing (avoid account enumeration)
  if (!row) {
    return res.json({
      ok: true,
      message:
        'If that username exists, a reset code was created. Check the next step.',
      found: false,
    })
  }

  // Invalidate previous unused codes for this user
  db.prepare(
    'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
  ).run(row.id)

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const id = newId('rst')
  const now = new Date()
  const expires = new Date(now.getTime() + 15 * 60 * 1000).toISOString()

  db.prepare(`
    INSERT INTO password_reset_tokens (id, user_id, code_hash, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, row.id, bcrypt.hashSync(code, 8), expires, now.toISOString())

  res.json({
    ok: true,
    found: true,
    message:
      'Reset code created. It expires in 15 minutes. Nambo shows the code here because email is not set up yet.',
    // In-app delivery (no email service). Replace with email later if you add SMTP.
    resetCode: code,
    expiresAt: expires,
    username: row.username,
  })
})

app.post('/api/auth/reset-password', (req, res) => {
  const username = String(req.body?.username || '').trim()
  const code = String(req.body?.code || '').trim()
  const newPassword = String(req.body?.password || '')

  if (!username || !code) {
    return res.status(400).json({ error: 'Username and reset code are required' })
  }
  if (newPassword.length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' })
  }

  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username)
  if (!row) return res.status(400).json({ error: 'Invalid username or reset code' })

  const tokens = db
    .prepare(
      `SELECT * FROM password_reset_tokens
       WHERE user_id = ? AND used = 0
       ORDER BY created_at DESC LIMIT 5`,
    )
    .all(row.id)

  const now = Date.now()
  let matched = null
  for (const t of tokens) {
    if (+new Date(t.expires_at) < now) continue
    if (bcrypt.compareSync(code, t.code_hash)) {
      matched = t
      break
    }
  }

  if (!matched) {
    return res.status(400).json({ error: 'Invalid or expired reset code' })
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(newPassword, 10),
    row.id,
  )
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(matched.id)
  db.prepare(
    'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0',
  ).run(row.id)

  res.json({
    ok: true,
    message: 'Password updated. You can sign in with your new password.',
  })
})

// ─── Bootstrap / feed data ──────────────────────────────
app.get('/api/bootstrap', optionalAuth, (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at').all().map(publicUser)
  const communities = db
    .prepare('SELECT * FROM communities ORDER BY created_at DESC')
    .all()
    .map(mapCommunity)
  const posts = db
    .prepare('SELECT * FROM posts ORDER BY created_at DESC')
    .all()
    .map(mapPost)
  const comments = db
    .prepare('SELECT * FROM comments ORDER BY created_at ASC')
    .all()
    .map(mapComment)
  res.json({ users, communities, posts, comments })
})

// ─── Users ──────────────────────────────────────────────
app.patch('/api/users/me', auth, (req, res) => {
  const { displayName, bio } = req.body || {}
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: 'Not found' })
  const nextName = displayName?.trim() || user.display_name
  const nextBio = bio !== undefined ? String(bio) : user.bio
  db.prepare('UPDATE users SET display_name = ?, bio = ? WHERE id = ?').run(
    nextName,
    nextBio,
    req.userId,
  )
  res.json({ user: getUserById(req.userId) })
})

app.get('/api/users/:username', (req, res) => {
  const user = getUserByUsername(req.params.username)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
})

// ─── Communities ────────────────────────────────────────
app.get('/api/communities', (_req, res) => {
  const communities = db
    .prepare('SELECT * FROM communities ORDER BY created_at DESC')
    .all()
    .map(mapCommunity)
  res.json({ communities })
})

app.post('/api/communities', auth, (req, res) => {
  const { name, description, topic } = req.body || {}
  const cleanName = String(name || '').trim()
  if (cleanName.length < 2) return res.status(400).json({ error: 'Name is required' })
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (db.prepare('SELECT id FROM communities WHERE slug = ?').get(slug)) {
    return res.status(409).json({ error: 'Community name already taken' })
  }
  const id = newId('c')
  const now = new Date().toISOString()
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  db.prepare(`
    INSERT INTO communities (id, name, slug, description, topic, creator_id, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    cleanName,
    slug,
    String(description || '').trim() || `Discussion about ${cleanName}`,
    String(topic || 'General').trim() || 'General',
    req.userId,
    color,
    now,
  )
  db.prepare(
    'INSERT INTO community_members (community_id, user_id, joined_at) VALUES (?, ?, ?)',
  ).run(id, req.userId, now)
  res.status(201).json({ community: mapCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(id)) })
})

app.post('/api/communities/:id/join', auth, (req, res) => {
  const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(req.params.id)
  if (!community) return res.status(404).json({ error: 'Not found' })
  const exists = db
    .prepare('SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?')
    .get(req.params.id, req.userId)
  if (exists) {
    db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(
      req.params.id,
      req.userId,
    )
  } else {
    db.prepare(
      'INSERT INTO community_members (community_id, user_id, joined_at) VALUES (?, ?, ?)',
    ).run(req.params.id, req.userId, new Date().toISOString())
  }
  res.json({
    community: mapCommunity(community),
    user: getUserById(req.userId),
  })
})

// ─── Posts ──────────────────────────────────────────────
app.post('/api/posts', auth, upload.single('media'), (req, res) => {
  const content = String(req.body.content || '').trim()
  const communityId = req.body.communityId || null
  if (!content && !req.file) {
    return res.status(400).json({ error: 'Write something or add media' })
  }
  if (communityId) {
    const member = db
      .prepare('SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?')
      .get(communityId, req.userId)
    if (!member) return res.status(403).json({ error: 'Join the community to post' })
  }

  const id = newId('p')
  const now = new Date().toISOString()
  let mediaPath = null
  let mediaType = null
  let mediaName = null
  if (req.file) {
    mediaPath = req.file.filename
    mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    mediaName = req.file.originalname
  }

  db.prepare(`
    INSERT INTO posts (id, author_id, community_id, content, media_path, media_type, media_name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.userId, communityId || null, content, mediaPath, mediaType, mediaName, now)

  const tags = extractTags(content)
  const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)')
  for (const tag of tags) insertTag.run(id, tag)

  const post = mapPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id))
  io.emit('post:new', post)
  res.status(201).json({ post })
})

app.post('/api/posts/:id/like', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  const liked = db
    .prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?')
    .get(req.params.id, req.userId)
  if (liked) {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(
      req.params.id,
      req.userId,
    )
  } else {
    db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(
      req.params.id,
      req.userId,
    )
    const actor = getUserById(req.userId)
    notify(post.author_id, {
      userId: post.author_id,
      type: 'like',
      title: `${actor.displayName} liked your post`,
      body: post.content.slice(0, 100),
      link: `/post/${post.id}`,
      actorId: req.userId,
    })
  }
  res.json({ post: mapPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)) })
})

app.post('/api/posts/:id/comments', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Not found' })
  const content = String(req.body.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Comment cannot be empty' })
  const parentId = req.body.parentId || null
  if (parentId) {
    const parent = db.prepare('SELECT * FROM comments WHERE id = ?').get(parentId)
    if (!parent || parent.post_id !== post.id) {
      return res.status(400).json({ error: 'Invalid parent comment' })
    }
  }
  const id = newId('cm')
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO comments (id, post_id, author_id, content, parent_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, post.id, req.userId, content, parentId, now)

  const comment = mapComment(db.prepare('SELECT * FROM comments WHERE id = ?').get(id))
  const actor = getUserById(req.userId)

  if (parentId) {
    const parent = db.prepare('SELECT * FROM comments WHERE id = ?').get(parentId)
    notify(parent.author_id, {
      userId: parent.author_id,
      type: 'reply',
      title: `${actor.displayName} replied to your comment`,
      body: content.slice(0, 120),
      link: `/post/${post.id}`,
      actorId: req.userId,
    })
  } else {
    notify(post.author_id, {
      userId: post.author_id,
      type: 'comment',
      title: `${actor.displayName} commented on your post`,
      body: content.slice(0, 120),
      link: `/post/${post.id}`,
      actorId: req.userId,
    })
  }

  io.emit('comment:new', comment)
  res.status(201).json({ comment })
})

app.post('/api/comments/:id/like', auth, (req, res) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
  if (!comment) return res.status(404).json({ error: 'Not found' })
  const liked = db
    .prepare('SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?')
    .get(req.params.id, req.userId)
  if (liked) {
    db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').run(
      req.params.id,
      req.userId,
    )
  } else {
    db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(
      req.params.id,
      req.userId,
    )
  }
  res.json({ comment: mapComment(db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)) })
})

// ─── Search ─────────────────────────────────────────────
app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase()
  if (!q) return res.json({ posts: [], communities: [], users: [], tags: [] })
  const like = `%${q}%`

  const users = db
    .prepare(
      `SELECT * FROM users WHERE lower(username) LIKE ? OR lower(display_name) LIKE ? OR lower(bio) LIKE ? LIMIT 20`,
    )
    .all(like, like, like)
    .map(publicUser)

  const communities = db
    .prepare(
      `SELECT * FROM communities WHERE lower(name) LIKE ? OR lower(description) LIKE ? OR lower(topic) LIKE ? OR lower(slug) LIKE ? LIMIT 20`,
    )
    .all(like, like, like, like)
    .map(mapCommunity)

  const postRows = db
    .prepare(
      `SELECT DISTINCT p.* FROM posts p
       LEFT JOIN post_tags t ON t.post_id = p.id
       WHERE lower(p.content) LIKE ? OR lower(t.tag) LIKE ?
       ORDER BY p.created_at DESC LIMIT 40`,
    )
    .all(like, like)

  const tags = db
    .prepare(
      `SELECT DISTINCT tag FROM post_tags WHERE lower(tag) LIKE ? LIMIT 20`,
    )
    .all(like)
    .map((r) => r.tag)

  res.json({
    posts: postRows.map(mapPost),
    communities,
    users,
    tags,
  })
})

// ─── Notifications ──────────────────────────────────────
app.get('/api/notifications', auth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    )
    .all(req.userId)
  res.json({
    notifications: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      actorId: r.actor_id,
      read: !!r.read,
      createdAt: r.created_at,
    })),
  })
})

app.post('/api/notifications/read', auth, (req, res) => {
  const { ids } = req.body || {}
  if (Array.isArray(ids) && ids.length) {
    const stmt = db.prepare(
      'UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?',
    )
    const tx = db.transaction(() => {
      for (const id of ids) stmt.run(req.userId, id)
    })
    tx()
  } else {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId)
  }
  res.json({ ok: true })
})

// ─── Messages / DMs ─────────────────────────────────────
app.get('/api/conversations', auth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT * FROM conversations
       WHERE user_a = ? OR user_b = ?
       ORDER BY updated_at DESC`,
    )
    .all(req.userId, req.userId)

  const conversations = rows.map((c) => {
    const otherId = c.user_a === req.userId ? c.user_b : c.user_a
    const last = db
      .prepare(
        `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
      )
      .get(c.id)
    const unread = db
      .prepare(
        `SELECT COUNT(*) AS c FROM messages
         WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
      )
      .get(c.id, req.userId).c
    return {
      id: c.id,
      otherUser: getUserById(otherId),
      updatedAt: c.updated_at,
      lastMessage: last
        ? {
            id: last.id,
            conversationId: last.conversation_id,
            senderId: last.sender_id,
            content: last.content,
            createdAt: last.created_at,
            readAt: last.read_at,
          }
        : null,
      unread,
    }
  })
  res.json({ conversations })
})

app.post('/api/conversations', auth, (req, res) => {
  const { userId: otherUserId, username } = req.body || {}
  let other = otherUserId ? getUserById(otherUserId) : null
  if (!other && username) other = getUserByUsername(username)
  if (!other) return res.status(404).json({ error: 'User not found' })
  if (other.id === req.userId) {
    return res.status(400).json({ error: 'Cannot message yourself' })
  }

  const [a, b] = pairKey(req.userId, other.id)
  let conv = db
    .prepare('SELECT * FROM conversations WHERE user_a = ? AND user_b = ?')
    .get(a, b)
  if (!conv) {
    const id = newId('conv')
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO conversations (id, user_a, user_b, updated_at) VALUES (?, ?, ?, ?)',
    ).run(id, a, b, now)
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)
  }

  res.json({
    conversation: {
      id: conv.id,
      otherUser: other,
      updatedAt: conv.updated_at,
      lastMessage: null,
      unread: 0,
    },
  })
})

app.get('/api/conversations/:id/messages', auth, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!conv) return res.status(404).json({ error: 'Not found' })
  if (conv.user_a !== req.userId && conv.user_b !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // mark as read
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE messages SET read_at = ?
     WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL`,
  ).run(now, conv.id, req.userId)

  const messages = db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 200`,
    )
    .all(conv.id)
    .map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
      readAt: m.read_at,
    }))

  const otherId = conv.user_a === req.userId ? conv.user_b : conv.user_a
  res.json({ messages, otherUser: getUserById(otherId), conversationId: conv.id })
})

app.post('/api/conversations/:id/messages', auth, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!conv) return res.status(404).json({ error: 'Not found' })
  if (conv.user_a !== req.userId && conv.user_b !== req.userId) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const content = String(req.body.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Message cannot be empty' })

  const id = newId('m')
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_id, content, created_at, read_at)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  ).run(id, conv.id, req.userId, content, now)
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conv.id)

  const message = {
    id,
    conversationId: conv.id,
    senderId: req.userId,
    content,
    createdAt: now,
    readAt: null,
  }

  const otherId = conv.user_a === req.userId ? conv.user_b : conv.user_a
  const actor = getUserById(req.userId)

  io.to(`conv:${conv.id}`).emit('message:new', message)
  emitToUser(otherId, 'message:new', message)
  emitToUser(req.userId, 'message:new', message)

  notify(otherId, {
    userId: otherId,
    type: 'message',
    title: `New message from ${actor.displayName}`,
    body: content.slice(0, 120),
    link: `/messages/${conv.id}`,
    actorId: req.userId,
  })

  res.status(201).json({ message })
})

// ─── Free Nambo AI (no API key — works for everyone on Render) ─
app.post('/api/posts/:id/ask-nambo', optionalAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Post not found' })

  const mapped = mapPost(post)
  const author = getUserById(post.author_id)
  const community = post.community_id
    ? mapCommunity(db.prepare('SELECT * FROM communities WHERE id = ?').get(post.community_id))
    : null

  const userQuestion =
    typeof req.body?.question === 'string' ? req.body.question.slice(0, 500) : ''

  const result = sparkConversation({
    content: mapped.content,
    tags: mapped.tags,
    authorName: author?.displayName || 'the author',
    communityName: community?.slug || null,
    userQuestion,
  })

  res.json({
    reply: result.reply,
    mode: result.mode,
    keywords: result.keywords,
    free: true,
    engine: result.engine,
    postId: post.id,
  })
})

app.get('/api/ai/status', (_req, res) => {
  res.json({
    name: 'Nambo',
    free: true,
    engine: 'nambo-local',
    description:
      'Built-in free conversation helper. No API key. Available to every visitor.',
  })
})

// ─── Health ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// error handler for multer
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(400).json({ error: err.message || 'Request failed' })
})

// Production: serve the built React app (Vite → dist/)
const clientDist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false }))
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io')
    ) {
      return next()
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

server.listen(PORT, () => {
  console.log(`Nambo running on http://localhost:${PORT}`)
  if (fs.existsSync(clientDist)) {
    console.log('Serving frontend from dist/')
  }
  if (process.env.DATA_DIR) {
    console.log(`Data directory: ${process.env.DATA_DIR}`)
  }
})

