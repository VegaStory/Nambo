import db from './db.js'

export function publicUser(row) {
  if (!row) return null
  const joined = db
    .prepare('SELECT community_id FROM community_members WHERE user_id = ?')
    .all(row.id)
    .map((r) => r.community_id)

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    joinedCommunities: joined,
  }
}

export function getUserById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  return publicUser(row)
}

export function getUserByUsername(username) {
  const row = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username)
  return publicUser(row)
}

export function mapCommunity(row) {
  if (!row) return null
  const memberCount = db
    .prepare('SELECT COUNT(*) AS c FROM community_members WHERE community_id = ?')
    .get(row.id).c
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    topic: row.topic,
    creatorId: row.creator_id,
    memberCount,
    createdAt: row.created_at,
    color: row.color,
  }
}

export function mapPost(row) {
  if (!row) return null
  const likes = db
    .prepare('SELECT user_id FROM post_likes WHERE post_id = ?')
    .all(row.id)
    .map((r) => r.user_id)
  const tags = db
    .prepare('SELECT tag FROM post_tags WHERE post_id = ?')
    .all(row.id)
    .map((r) => r.tag)
  return {
    id: row.id,
    authorId: row.author_id,
    communityId: row.community_id,
    content: row.content,
    mediaId: row.media_path,
    mediaType: row.media_type,
    mediaName: row.media_name,
    likes,
    createdAt: row.created_at,
    tags,
  }
}

export function mapComment(row) {
  if (!row) return null
  const likes = db
    .prepare('SELECT user_id FROM comment_likes WHERE comment_id = ?')
    .all(row.id)
    .map((r) => r.user_id)
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    parentId: row.parent_id,
    likes,
    createdAt: row.created_at,
  }
}

export function extractTags(content, extra = []) {
  const fromContent = [...content.matchAll(/#([a-zA-Z0-9_]+)/g)].map((m) =>
    m[1].toLowerCase(),
  )
  const all = [
    ...extra.map((t) => String(t).toLowerCase().replace(/^#/, '')),
    ...fromContent,
  ]
  return [...new Set(all.filter(Boolean))]
}

export function createNotification({ userId, type, title, body = '', link = null, actorId = null }) {
  if (!userId || userId === actorId) return null
  const notification = {
    id: `n_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    type,
    title,
    body,
    link,
    actorId,
    read: 0,
    createdAt: new Date().toISOString(),
  }
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, body, link, actor_id, read, created_at)
    VALUES (@id, @userId, @type, @title, @body, @link, @actorId, @read, @createdAt)
  `).run(notification)
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    actorId: notification.actorId,
    read: false,
    createdAt: notification.createdAt,
  }
}

export function pairKey(a, b) {
  return a < b ? [a, b] : [b, a]
}
