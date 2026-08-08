/**
 * Free built-in "Nambo" conversation helper.
 * No API key required — runs entirely on the server so every visitor can use it.
 * If XAI_API_KEY is set later, smarter Grok replies can be added without changing the UI.
 */

const STOP = new Set(
  `a an the and or but if in on at to for of is are was were be been being
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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function snippet(text, max = 120) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
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
  const keys = keywords(content, tags)
  const topic = keys[0] || (community ? community.toLowerCase() : 'this')
  const keyList =
    keys.length > 0
      ? keys.slice(0, 3).map((k) => `#${k}`).join(', ')
      : 'the main idea'

  const isQuestion = /\?/.test(content)
  const isHotTake = /\b(hot take|unpopular|disagree|wrong|always|never)\b/i.test(
    content,
  )
  const isNews = /\b(breaking|report|bill|market|announced|today)\b/i.test(
    content,
  ) || tags.some((t) => /news|politics|local/i.test(t))
  const hasMediaHint = /\b(photo|video|image|clip|pic)\b/i.test(content)

  let mode = 'general'
  if (q) mode = 'answer'
  else if (isNews) mode = 'news'
  else if (isHotTake) mode = 'debate'
  else if (isQuestion) mode = 'question'
  else if (hasMediaHint) mode = 'media'

  const openers = {
    general: [
      `Here's a spark for this thread — Nambo (nobody / nothing) stepping in so someone can become somebody in the replies.`,
      `Conversation starter from Nambo — free for everyone, no account key needed.`,
      `Nambo read this post and left a few hooks to get people talking:`,
    ],
    news: [
      `News desk mode — Nambo pulled angles people often skip on updates like this:`,
      `When a post reads like news, the comments get better with sources, impact, and “what next?”`,
    ],
    debate: [
      `Hot-take radar on. Nambo is here to steelman both sides so the thread stays sharp, not just loud:`,
      `Disagreement is healthy when it's specific. Try these:`,
    ],
    question: [
      `The post already asks something — Nambo is amplifying it so more people jump in:`,
      `Questions deserve answers. Nambo's take on how to reply:`,
    ],
    media: [
      `There's a visual vibe here — Nambo is asking what people actually notice:`,
    ],
    answer: [
      `You asked Nambo about this post. Here's a free, built-in take to keep the conversation moving:`,
    ],
  }

  const questionsByMode = {
    general: [
      `What part of ${author}'s point about “${topic}” do you agree with most — and what would you change?`,
      `If you had to explain this post in one sentence to a friend, what would you say?`,
      `Who is most affected by this, and who might see it differently?`,
      `What's a real example (from your life or the news) that backs or challenges this?`,
    ],
    news: [
      `What source would you want to see linked here before sharing this further?`,
      `Who benefits if this story is true — and who should be nervous?`,
      `What's the next development you'd watch for in the next week?`,
      `How does this hit people outside the headline's main group?`,
    ],
    debate: [
      `Steelman the opposite view: what's the strongest argument against this take?`,
      `Where do you draw the line — when does “${topic}” go too far either way?`,
      `Is this a values disagreement or a facts disagreement?`,
      `What evidence would make you change your mind?`,
    ],
    question: [
      `What's your direct answer to ${author}'s question, in one short paragraph?`,
      `Has anyone here tried this already? What actually happened?`,
      `What detail is missing before you can answer well?`,
    ],
    media: [
      `What stands out first in the media — mood, detail, or context?`,
      `If this photo/video had a caption battle, what's your one-liner?`,
      `Does the media support the text, or tell a different story?`,
    ],
    answer: [
      `Does that answer match how you read the original post?`,
      `What would you add that Nambo might have missed?`,
    ],
  }

  const takeTemplates = [
    `Short take: the heart of this post is about **${topic}**. The open question isn't just “agree/disagree” — it's *who this changes something for*.`,
    `Nambo's read: “${snippet(content, 90)}” lands as a prompt about **${topic}**. Threads get good when people bring one concrete example.`,
    `Nobody has to be an expert here (that's kind of the point of Nambo). Start with what you know about ${keyList}.`,
  ]

  const opener = pick(openers[mode] || openers.general)
  const qs = questionsByMode[mode] || questionsByMode.general
  const chosenQs = []
  const pool = [...qs]
  while (chosenQs.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    chosenQs.push(pool.splice(i, 1)[0])
  }

  let answerBlock = ''
  if (q) {
    const lower = q.toLowerCase()
    if (/summar|tldr|mean|about/.test(lower)) {
      answerBlock = `**Quick summary:** ${author} is talking about ${topic}${
        community ? ` in c/${community}` : ''
      }. Core line: “${snippet(content, 140)}”`
    } else if (/disagree|wrong|counter|against/.test(lower)) {
      answerBlock = `**Counter-angle:** Even if ${author} is right about ${topic}, a fair pushback is: context, tradeoffs, and who pays the cost. Ask the thread for the strongest opposing case.`
    } else if (/agree|why|support/.test(lower)) {
      answerBlock = `**Supporting angle:** If you back this, name one concrete reason tied to ${keyList} — vague “this!” comments die fast; specific ones start real talk.`
    } else if (/how|start|reply|comment/.test(lower)) {
      answerBlock = `**How to jump in:** Reply with (1) your stance in one line, (2) one example, (3) one question for ${author}. That pattern almost always grows a thread.`
    } else {
      answerBlock = `**On your question** (“${snippet(q, 100)}”): connect it back to **${topic}** in the post. The most useful replies will answer *you* and still invite the next person.`
    }
  }

  const take = pick(takeTemplates)

  const lines = [
    opener,
    '',
    take,
    answerBlock ? `\n${answerBlock}\n` : '',
    '**Try asking the thread:**',
    ...chosenQs.map((line, i) => `${i + 1}. ${line}`),
    '',
    community
      ? `_Community note: this is in **c/${community}** — keep it on-topic for people who joined for that space._`
      : `_Status post: personal takes welcome — be kind enough that strangers still want to reply._`,
    '',
    '— **Nambo** · free conversation helper · “nobody / nothing,” until the thread becomes something',
  ]

  return {
    reply: lines.filter((l) => l !== undefined).join('\n'),
    mode,
    keywords: keys,
    free: true,
    engine: 'nambo-local',
  }
}
