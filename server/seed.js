import bcrypt from 'bcryptjs'
import db from './db.js'

const COLORS = [
  '#38bdf8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#fb7185', '#60a5fa', '#c084fc', '#2dd4bf', '#f97316',
]

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600_000).toISOString()
}

export function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c
  if (count > 0) return

  const hash = bcrypt.hashSync('demo', 10)
  const pass = bcrypt.hashSync('password', 10)

  const users = [
    { id: 'u_demo', username: 'demo', displayName: 'Demo User', bio: 'Exploring Nambo — real-time takes and deep community talks.', color: COLORS[0], hash, hours: 720 },
    { id: 'u_maya', username: 'maya_writes', displayName: 'Maya Chen', bio: 'Journalist. Coffee first, opinions second.', color: COLORS[1], hash: pass, hours: 900 },
    { id: 'u_jax', username: 'jaxbuilds', displayName: 'Jax Rivera', bio: 'Indie hacker. Shipping in public.', color: COLORS[2], hash: pass, hours: 600 },
    { id: 'u_sam', username: 'sam_orbit', displayName: 'Sam Okonkwo', bio: 'Space & science nerd. AMA anytime.', color: COLORS[3], hash: pass, hours: 800 },
    { id: 'u_riley', username: 'rileyplays', displayName: 'Riley Kim', bio: 'Games, streams, and late-night threads.', color: COLORS[4], hash: pass, hours: 400 },
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, display_name, bio, avatar_color, password_hash, created_at)
    VALUES (@id, @username, @displayName, @bio, @color, @hash, @createdAt)
  `)

  const communities = [
    { id: 'c_tech', name: 'Technology', slug: 'technology', description: 'Gadgets, software, AI, and the future of computing.', topic: 'Technology', creatorId: 'u_jax', color: '#38bdf8', hours: 2000 },
    { id: 'c_news', name: 'World News', slug: 'worldnews', description: 'Breaking stories and global headlines — discuss with context.', topic: 'News', creatorId: 'u_maya', color: '#f472b6', hours: 2500 },
    { id: 'c_gaming', name: 'Gaming', slug: 'gaming', description: 'PC, console, indie, esports — everything gaming.', topic: 'Gaming', creatorId: 'u_riley', color: '#a78bfa', hours: 1800 },
    { id: 'c_science', name: 'Science', slug: 'science', description: 'Research, discoveries, and curious minds.', topic: 'Science', creatorId: 'u_sam', color: '#34d399', hours: 2200 },
    { id: 'c_startups', name: 'Startups', slug: 'startups', description: 'Founders, funding, product, and growth.', topic: 'Business', creatorId: 'u_jax', color: '#fbbf24', hours: 1500 },
    { id: 'c_politics', name: 'Politics', slug: 'politics', description: 'Policy debates and civic discussion — keep it civil.', topic: 'Politics', creatorId: 'u_maya', color: '#fb7185', hours: 2300 },
    { id: 'c_space', name: 'Space', slug: 'space', description: 'Rockets, planets, and the cosmos.', topic: 'Science', creatorId: 'u_sam', color: '#60a5fa', hours: 1900 },
    { id: 'c_movies', name: 'Movies', slug: 'movies', description: 'Film talk, reviews, and recommendations.', topic: 'Entertainment', creatorId: 'u_riley', color: '#c084fc', hours: 1600 },
    { id: 'c_memes', name: 'Memes', slug: 'memes', description: 'Peak internet culture. Post responsibly.', topic: 'Humor', creatorId: 'u_riley', color: '#f97316', hours: 1400 },
  ]

  const insertCommunity = db.prepare(`
    INSERT INTO communities (id, name, slug, description, topic, creator_id, color, created_at)
    VALUES (@id, @name, @slug, @description, @topic, @creatorId, @color, @createdAt)
  `)

  const insertMember = db.prepare(`
    INSERT INTO community_members (community_id, user_id, joined_at) VALUES (?, ?, ?)
  `)

  const memberships = {
    u_demo: ['c_tech', 'c_news', 'c_gaming', 'c_science'],
    u_maya: ['c_news', 'c_politics', 'c_tech'],
    u_jax: ['c_tech', 'c_startups', 'c_gaming'],
    u_sam: ['c_science', 'c_space', 'c_news'],
    u_riley: ['c_gaming', 'c_movies', 'c_memes'],
  }

  const posts = [
    { id: 'p1', authorId: 'u_maya', communityId: 'c_news', content: 'Morning briefing: markets opened mixed, two major climate bills advanced in committee, and a breakthrough battery paper is trending in research circles. What are you watching today?', hours: 1, tags: ['news', 'briefing', 'climate'], likes: ['u_jax', 'u_sam', 'u_demo'] },
    { id: 'p2', authorId: 'u_jax', communityId: null, content: 'Just shipped v0.3 of my side project in public. Real-time feeds + communities is a hard UX problem — anybody else building social tools right now?', hours: 2, tags: ['buildinpublic', 'indie'], likes: ['u_maya', 'u_riley'] },
    { id: 'p3', authorId: 'u_sam', communityId: 'c_space', content: 'JWST just dropped another deep-field image set. The structure of early galaxies keeps rewriting textbooks. Thread of what stands out.', hours: 3, tags: ['space', 'jwst', 'astronomy'], likes: ['u_maya', 'u_demo', 'u_jax', 'u_riley'] },
    { id: 'p4', authorId: 'u_riley', communityId: 'c_gaming', content: "Hot take: the best multiplayer game of the year so far isn't the one with the biggest marketing budget. Small studios are cooking.", hours: 5, tags: ['gaming', 'indie', 'hottake'], likes: ['u_jax', 'u_demo'] },
    { id: 'p5', authorId: 'u_jax', communityId: 'c_tech', content: 'Local-first apps + sync is the architecture pattern I keep coming back to. Offline-capable social feels underrated. Thoughts?', hours: 7, tags: ['tech', 'architecture', 'localfirst'], likes: ['u_sam'] },
    { id: 'p6', authorId: 'u_maya', communityId: null, content: 'Quick take: platforms that mix short-form status updates with deep topic communities get the best of both worlds — impulse + depth.', hours: 9, tags: ['media', 'product'], likes: ['u_demo', 'u_jax', 'u_sam'] },
    { id: 'p7', authorId: 'u_sam', communityId: 'c_science', content: 'New paper on protein folding improvements claims a 12% accuracy jump on hard targets. Anyone read the methods section yet?', hours: 12, tags: ['science', 'biology', 'research'], likes: ['u_maya'] },
    { id: 'p8', authorId: 'u_riley', communityId: 'c_movies', content: 'Rewatched a classic noir last night. The lighting alone could teach a masterclass. Recommend your favorite "atmosphere over plot" films.', hours: 14, tags: ['movies', 'film', 'noir'], likes: ['u_maya', 'u_demo'] },
    { id: 'p9', authorId: 'u_jax', communityId: 'c_startups', content: 'Fundraising tip that actually helped: lead with a crisp problem statement before the product demo. Investors buy the pain, not the UI.', hours: 18, tags: ['startups', 'fundraising'], likes: ['u_maya', 'u_riley', 'u_demo'] },
    { id: 'p10', authorId: 'u_maya', communityId: 'c_news', content: 'City council just approved the transit expansion package. Big for commute times and local small businesses. Full breakdown in comments if people want sources.', hours: 20, tags: ['local', 'transit', 'news'], likes: ['u_sam', 'u_demo'] },
  ]

  const insertPost = db.prepare(`
    INSERT INTO posts (id, author_id, community_id, content, media_path, media_type, media_name, created_at)
    VALUES (@id, @authorId, @communityId, @content, NULL, NULL, NULL, @createdAt)
  `)
  const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag) VALUES (?, ?)')
  const insertLike = db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)')

  const comments = [
    { id: 'cm1', postId: 'p1', authorId: 'u_jax', content: 'Watching the battery paper too — energy density claims look aggressive but the methods seem solid.', parentId: null, hours: 0.8, likes: ['u_maya'] },
    { id: 'cm2', postId: 'p1', authorId: 'u_sam', content: 'Same. If replication holds, this could shift EV timelines by a few years.', parentId: 'cm1', hours: 0.5, likes: [] },
    { id: 'cm3', postId: 'p3', authorId: 'u_maya', content: 'The redshift distribution is wild. Would love a non-jargon summary for the feed.', parentId: null, hours: 2.5, likes: ['u_sam', 'u_demo'] },
    { id: 'cm4', postId: 'p4', authorId: 'u_jax', content: 'Agree. Discovery is broken for small games though — algorithms bury them.', parentId: null, hours: 4, likes: ['u_riley'] },
    { id: 'cm5', postId: 'p2', authorId: 'u_demo', content: 'Yes! Building something similar. Real-time + communities is exactly the sweet spot.', parentId: null, hours: 1.5, likes: ['u_jax'] },
    { id: 'cm6', postId: 'p6', authorId: 'u_riley', content: 'This is why I bounce between short posts and long community threads. Different moods.', parentId: null, hours: 8, likes: ['u_maya'] },
  ]

  const insertComment = db.prepare(`
    INSERT INTO comments (id, post_id, author_id, content, parent_id, created_at)
    VALUES (@id, @postId, @authorId, @content, @parentId, @createdAt)
  `)
  const insertCommentLike = db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)')

  const tx = db.transaction(() => {
    for (const u of users) {
      insertUser.run({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        bio: u.bio,
        color: u.color,
        hash: u.hash,
        createdAt: hoursAgo(u.hours),
      })
    }
    for (const c of communities) {
      insertCommunity.run({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        topic: c.topic,
        creatorId: c.creatorId,
        color: c.color,
        createdAt: hoursAgo(c.hours),
      })
    }
    for (const [userId, list] of Object.entries(memberships)) {
      for (const cid of list) {
        insertMember.run(cid, userId, hoursAgo(100))
      }
    }
    // inflate member counts with ghost rows for realism via extra dummy inserts? skip — use seed member counts via repeated? just use real members
    for (const p of posts) {
      insertPost.run({
        id: p.id,
        authorId: p.authorId,
        communityId: p.communityId,
        content: p.content,
        createdAt: hoursAgo(p.hours),
      })
      for (const t of p.tags) insertTag.run(p.id, t)
      for (const uid of p.likes) insertLike.run(p.id, uid)
    }
    for (const c of comments) {
      insertComment.run({
        id: c.id,
        postId: c.postId,
        authorId: c.authorId,
        content: c.content,
        parentId: c.parentId,
        createdAt: hoursAgo(c.hours),
      })
      for (const uid of c.likes) insertCommentLike.run(c.id, uid)
    }

    // seed a sample DM conversation
    const convId = 'conv_demo_maya'
    db.prepare(`
      INSERT INTO conversations (id, user_a, user_b, updated_at)
      VALUES (?, 'u_demo', 'u_maya', ?)
    `).run(convId, hoursAgo(0.2))
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, content, created_at, read_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id('m'), convId, 'u_maya', 'Hey Demo! Welcome to Nambo. DMs work in real time — try replying.', hoursAgo(0.3), hoursAgo(0.25))
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, content, created_at, read_at)
      VALUES (?, ?, ?, ?, ?, NULL)
    `).run(id('m'), convId, 'u_demo', 'Thanks Maya! Excited to try private messaging and communities.', hoursAgo(0.2))

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, link, actor_id, read, created_at)
      VALUES (?, 'u_demo', 'message', 'New message from Maya Chen', 'Hey Demo! Welcome to Nambo…', '/messages/conv_demo_maya', 'u_maya', 0, ?)
    `).run(id('n'), hoursAgo(0.3))
  })

  tx()
  console.log('Database seeded with demo users and content.')
}
