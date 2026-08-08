# Deploy Nambo to Render — step by step

Your app is ready for Render: one Node service builds the website and runs the API together.

---

## Overview

```
Your PC  →  GitHub  →  Render (public URL like https://nambo.onrender.com)
```

You do **not** upload a zip of `node_modules`. Render builds from your GitHub repo.

---

## Part 1 — Put the code on GitHub

### 1. Create a GitHub account (if needed)
Go to https://github.com and sign up.

### 2. Create a new repository
1. Click **+** → **New repository**
2. Name it e.g. `nambo`
3. Keep it **Public** or Private (both work)
4. **Do not** add a README if the project already exists on your PC
5. Click **Create repository**

### 3. Upload this project from your PC

Open **PowerShell** or **Terminal** and run (change the GitHub URL to yours):

```powershell
cd C:\Users\nambo\pulse

git init
git add .
git commit -m "Nambo ready for Render"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nambo.git
git push -u origin main
```

If GitHub asks you to sign in, use a **Personal Access Token** as the password (GitHub → Settings → Developer settings → Personal access tokens).

---

## Part 2 — Create the Render service

### 1. Sign up at Render
https://render.com → **Get Started** (GitHub login is easiest).

### 2. New Web Service
1. Dashboard → **New +** → **Web Service**
2. Connect **GitHub** if asked, and allow access to your `nambo` repo
3. Select the **nambo** repository

### 3. Fill in these settings

| Field | Value |
|--------|--------|
| **Name** | `nambo` (or any name — this becomes `nambo.onrender.com`) |
| **Region** | Closest to you |
| **Runtime** | **Node** |
| **Branch** | `main` |
| **Root Directory** | leave **empty** (repo root is the app) |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | **Free** is fine to try |

### 4. Environment variables
Click **Environment** and add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | any long random string, e.g. `nambo-change-this-to-something-secret-12345` |

(Optional later for keeping data after restarts:)

| Key | Value |
|-----|--------|
| `DATA_DIR` | `/var/data` |

…only after you attach a **Disk** (see Part 4).

### 5. Deploy
Click **Create Web Service**.

Render will:
1. Install packages  
2. Build the frontend  
3. Start Nambo  

Wait until the logs say something like **Nambo running** / **Live**.

### 6. Open your site
Click the URL at the top, e.g.:

**https://nambo-xxxx.onrender.com**

That is your public site. Sign in with `demo` / `demo` (or create an account).

---

## Part 3 — After each code change (update without redoing everything)

On your PC:

```powershell
cd C:\Users\nambo\pulse
git add .
git commit -m "Describe your change"
git push
```

Render **auto-deploys** from `main`. Wait a few minutes, then refresh the site.

---

## Part 4 — Keep logins & posts after restarts (recommended)

Free Render disks may spin down; without a disk, **data can reset** on restart.

1. In your Web Service → **Disks** → **Add disk**
2. **Name:** `nambo-data`
3. **Mount path:** `/var/data`
4. **Size:** 1 GB is enough to start
5. Environment → add `DATA_DIR` = `/var/data`
6. **Manual Deploy** → **Deploy latest commit**

After that, accounts and uploads live on the disk and survive most deploys.

> Note: Free web services **sleep** after inactivity; first load can take ~30–60 seconds. Paid plans stay awake.

---

## Part 5 — Custom domain like nambo.com (optional)

1. Buy `nambo.com` from a domain registrar (if available)
2. Render → your service → **Custom Domains** → **Add**
3. Follow Render’s DNS instructions (usually a CNAME)
4. Wait for HTTPS to become active

Render does **not** give you `nambo.com` free — only `yourservice.onrender.com`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on `better-sqlite3` | Check logs; Render should compile native modules. Retry deploy. |
| Blank page / 404 on routes | Ensure build finished and `dist/` exists (our server serves it). |
| “Sign in” fails | Confirm service is Live; check logs for API errors. |
| Data disappeared | Free disk not set — add Disk + `DATA_DIR=/var/data`. |
| Site slow first open | Free tier sleep — wait and refresh. |

Health check URL: `https://YOUR-SERVICE.onrender.com/api/health`  
Should return: `{"ok":true}`

---

## Checklist

- [ ] Code on GitHub  
- [ ] Render Web Service (Node)  
- [ ] Build: `npm install && npm run build`  
- [ ] Start: `npm start`  
- [ ] `JWT_SECRET` set  
- [ ] Open the `.onrender.com` URL  
- [ ] (Recommended) Disk + `DATA_DIR=/var/data`  
