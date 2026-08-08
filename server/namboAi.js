/**
 * Free built-in "Nambo" helper — short replies, no API key.
 * Always returns something useful for follow-up questions.
 */

const STOP = new Set(
  `a an the and or or but if in on at to for of is are was were be been being
   this that these those it its with from as by about into over after before
   i you we they he she them my your our their me us do does did will would
   can could should just so not no yes what when where who how why which
   have has had been am im ive youre theyre dont doesnt didnt cant wont`.split(
    /\s+/,
  ),
)

function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function keywords(text, tags = [], limit = 5) {
  const counts = new Map()
  for (const w of words(text)) {
    if (w.startsWith('#')) {
      const t = w.slice(1)
      if (t.length > 1) counts.set(t, (counts.get(t) || 0) + 3)
      continue
    }
    if (w.length < 4 || STOP.has(w)) continue
    counts.set(w, (counts.get(w) || 0) + 1)
  }
  for (const t of tags) {
    const k = String(t).toLowerCase()
    if (k) counts.set(k, (counts.get(k) || 0) + 4)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w)
}

function snippet(text, max = 120) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Brief Q&A style reply when the user typed a question.
 */
function briefAnswer({ content, tags, author, community, question }) {
  const keys = keywords(content, tags)
  const topic = keys[0] || (community ? community : 'this topic')
  const keyList = keys.length ? keys.slice(0, 3).join(', ') : topic
  const q = question.trim()
  const lower = q.toLowerCase()
  const core = snippet(content, 160)

  // Always produce a short, direct answer block
  let head = ''
  if (/summar|tldr|mean|about|explain|what is|what’s|whats/.test(lower)) {
    head = `${author} is mainly talking about ${topic}. In short: “${core}”`
  } else if (/why|reason|because/.test(lower)) {
    head = `Likely angle: the post pushes a point on ${topic}. The “why” is in this line: “${snippet(content, 100)}”. A simple take is that ${author} wants people to notice ${keyList}.`
  } else if (/how|start|reply|comment|respond/.test(lower)) {
    head = `Quick way to reply: (1) one-line stance, (2) one example, (3) one question back to ${author}. That works better than a long rant.`
  } else if (/agree|support|right|correct/.test(lower)) {
    head = `If you agree, say why in one concrete sentence tied to ${topic} — not just “this!” Specifics get replies.`
  } else if (/disagree|wrong|against|counter|no/.test(lower)) {
    head = `Fair counter: even if ${author} is partly right on ${topic}, ask what gets left out (cost, who is hurt, what evidence). Keep it one short challenge + one question.`
  } else if (/who|when|where/.test(lower)) {
    head = `From the post alone: author is ${author}${community ? ` in c/${community}` : ''}. Timing isn’t fully specified — the post itself says: “${core}”`
  } else if (/search|google|look up|find|source|link|fact/.test(lower)) {
    head = `I can’t open the live web here, but a useful “search style” checklist for ${topic}: (1) who wrote this, (2) date, (3) one primary source, (4) one opposing view. Keywords to search: ${keyList}.`
  } else if (/funny|joke|meme|lol/.test(lower)) {
    head = `Light take: ${author} brought ${topic} into the chat. If it’s a joke post, the best reply is a one-liner — not a debate essay.`
  } else {
    head = `On “${snippet(q, 80)}”: connected to this post, the core is ${topic}. ${author} wrote: “${core}”. Short answer: focus on that claim and say if you buy it, with one reason.`
  }

  const tip = pick([
    `Tip: add one personal example in the comments.`,
    `Tip: ask ${author} one clear follow-up.`,
    `Tip: quote one phrase from the post when you reply.`,
  ])

  return [
    head,
    '',
    tip,
    '',
    '— Nambo (brief free helper)',
  ].join('\n')
}

/**
 * Opening spark when panel first opens (no user question).
 */
function openSpark({ content, tags, author, community }) {
  const keys = keywords(content, tags)
  const topic = keys[0] || (community ? community : 'this')
  const core = snippet(content, 110)

  return [
    `Quick read: this post is about ${topic}.`,
    ``,
    `“${core}”`,
    ``,
    `Try asking: “summarize this”, “why does this matter?”, or “how should I reply?”`,
    ``,
    `— Nambo (brief free helper)`,
  ].join('\n')
}

/**
 * @param {{ content: string, tags?: string[], authorName?: string, communityName?: string | null, userQuestion?: string | null }} input
 */
export function sparkConversation(input) {
  const content = input.content || ''
  const tags = input.tags || []
  const author = input.authorName || 'the author'
  const community = input.communityName
  const q = (input.userQuestion || '').trim()

  const reply = q
    ? briefAnswer({ content, tags, author, community, question: q })
    : openSpark({ content, tags, author, community })

  return {
    reply,
    mode: q ? 'answer' : 'spark',
    keywords: keywords(content, tags),
    free: true,
    engine: 'nambo-local',
  }
}
