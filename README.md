# Nambo

**Nambo** mixes **X-style** real-time posts with **Reddit-style** topic communities — plus **private DMs** and **live notifications**.

## Features

- **Sign in / Sign up** — real accounts with JWT auth (works across browsers)
- **Status posts & communities** — personal expression + topic discussions  
- **Photos & videos** — upload media on posts  
- **Comments & likes** — threaded replies  
- **Search** — keywords, topics, people, communities  
- **Private messages** — 1:1 DMs with real-time delivery  
- **Live notifications** — likes, comments, replies, and new messages via Socket.io  

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router  
- **Backend:** Express, better-sqlite3, JWT, Multer, Socket.io  

## Quick start

```bash
cd pulse
npm install
npm run dev
```

This starts:

- API + WebSocket server → http://localhost:3001  
- Web app (Vite) → http://localhost:5173  

Open **http://localhost:5173**

### Demo login

| Username | Password |
|----------|----------|
| `demo`   | `demo`   |

Other seed users use password `password` (`maya_writes`, `jaxbuilds`, `sam_orbit`, `rileyplays`).

### Try private messages

1. Sign in as `demo` / `demo`
2. Open **Messages** — there is a seeded chat with Maya
3. Or visit any profile → **Message**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + frontend together |
| `npm run dev:server` | API only (port 3001) |
| `npm run dev:client` | Vite only (port 5173) |
| `npm run build` | Production frontend build |
| `npm start` | Run API server |

## Project layout

```
pulse/   (project folder)
  server/          Express API, SQLite DB, uploads, sockets
  src/
    components/
    context/       App state + API + realtime
    pages/         Home, Explore, Messages, SignIn, SignUp, …
    lib/api.ts     Fetch helper + JWT token
```

Data is stored in `server/data/nambo.db`. Uploaded media lands in `server/uploads/`.

## Hosting (Netlify and others)

**Netlify alone will not run this app fully.** Netlify is great for static frontends; Nambo also needs a long-running Node API, a real database, file storage, and WebSockets for live DMs/notifications.

| Piece | Works on Netlify only? |
|-------|------------------------|
| UI (React) | Yes |
| Sign-in, posts, DMs API | No — needs a server |
| SQLite database | No — needs persistent disk or a hosted DB |
| Photo/video uploads | No — needs storage |
| Live messages/notifications | No — needs WebSockets |

**Better options if you want it online:**

1. **Railway / Render / Fly.io** — host the whole Node app (frontend + API)  
2. **Netlify (UI) + Railway/Render (API)** — split frontend and backend  
3. Keep using it **locally** with `npm run dev`

“Upload to Netlify and everything works” is not possible with this architecture without a bigger rebuild (cloud database, cloud file storage, different realtime setup).
