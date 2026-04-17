# FabLab — Deployment Guide

**Frontend** → Vercel → `https://fablabqena.com`  
**Backend** → VPS → `https://api.fablabqena.com`

---

## What changed

| Area | Before | After |
|---|---|---|
| Email provider | SendGrid | **Resend** |
| `NEXT_PUBLIC_API_BASE` | `localhost:4000` | `https://api.fablabqena.com` |
| Backend CORS | localhost only | + `fablabqena.com` ✅ |
| DB path | relative to `server/` | relative to `backend/` ✅ |
| Chat cleanup path | `../db/chat_histories` | `./db/chat_histories` ✅ |
| Google OAuth callback | `localhost:4000/...` | `api.fablabqena.com/...` |

---

## Step 1 — Resend Setup (do this FIRST)

1. Sign up at **https://resend.com**
2. Settings → Domains → Add `fablabqena.com` → add their DNS records to your DNS provider
3. API Keys → Create API Key → copy it
4. Fill in **`backend/.env`**:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=FabLab Qena <noreply@fablabqena.com>
   ```

> Free plan = 3,000 emails/month. Domain must be verified before emails send.

---

## Step 2 — Update Google OAuth Redirect URI

1. https://console.cloud.google.com → Credentials → your OAuth 2.0 Client
2. **Authorized redirect URIs** → Add:
   ```
   https://api.fablabqena.com/auth/google/callback
   ```

---

## Step 3 — Deploy Backend to VPS

Upload the entire `backend/` folder to your VPS, e.g. `/var/www/fablab-backend/`.

```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

cd /var/www/fablab-backend
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the printed command to enable auto-start
```

### Nginx config for `api.fablabqena.com`

Create `/etc/nginx/sites-available/fablab-api`:

```nginx
server {
    listen 80;
    server_name api.fablabqena.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/fablab-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.fablabqena.com
```

> Make sure `backend/db/` folder exists and the process has write permission.

---

## Step 4 — Deploy Frontend to Vercel

1. Push the **root** directory (not `backend/`) to a GitHub repo
2. Vercel → New Project → Import repo → Framework: **Next.js** → Root: `/`
3. Add **Environment Variables** in Vercel (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://api.fablabqena.com` |
| `NEXT_PUBLIC_CHAT_INACTIVITY_TIMEOUT_MINUTES` | `5` |
| `GOOGLE_GEMINI_API_KEY` | `AIzaSyCdkWI9EJQpbz6hZQmVET2PVtGgbHFKIH4` |
| `DISCORD_WEBHOOK_CHAT_HISTORY` | your webhook URL |

4. Project → Settings → Domains → Add `fablabqena.com` → follow Vercel's DNS steps

---

## Step 5 — Local Development

```bash
# Terminal 1 — start backend
cd backend
# backend/.env should have:
#   ORIGIN=http://localhost:1659
#   GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/auth/google/callback
node index.js

# Terminal 2 — start frontend (from project root)
# .env.local should have:
#   NEXT_PUBLIC_API_BASE=http://localhost:4000
npm run dev
```

---

## Final File Structure

```
FabLab Website/           <-- push this root to GitHub, Vercel deploys it
├── app/
├── components/
├── contexts/
├── public/
├── .env.local            <-- NEXT_PUBLIC_API_BASE etc. (also set in Vercel dashboard)
├── next.config.js
└── package.json          <-- Next.js deps only

backend/                  <-- copy/push this to your VPS
├── index.js              <-- Express + Resend emails ✅
├── package.json
├── ecosystem.config.js
├── .env                  <-- RESEND_API_KEY, SESSION_SECRET, etc.
└── db/
    ├── accounts.json
    ├── bookings.json
    ├── teams.json
    ├── videos.json
    ├── video_requests.json
    ├── verifications.json
    └── chat_histories/
```

---

## Deployment Checklist

- [ ] Resend domain verified + `RESEND_API_KEY` added to `backend/.env`
- [ ] Google OAuth redirect URI updated to `api.fablabqena.com`
- [ ] Backend deployed to VPS, running via PM2
- [ ] Nginx + SSL (`certbot`) for `api.fablabqena.com`
- [ ] Vercel env vars set (especially `NEXT_PUBLIC_API_BASE`)
- [ ] `fablabqena.com` DNS pointed to Vercel
- [ ] Test: sign up → email verification received
- [ ] Test: login, booking request → approval email received
- [ ] Test: Google OAuth login works
