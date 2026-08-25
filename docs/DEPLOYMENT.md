# M-CHICKS Deployment Guide

## Development (Local)

```bash
# 1. Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Set up environment
cp server/.env.example server/.env
# Fill in MONGODB_URI, JWT_SECRET

# 3. Seed owner account
node server/scripts/seedUser.js

# 4. Start dev server
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

---

## Production Deployment (Recommended Stack)

### Option 1: Single Server (VPS/Railway/Render)

**Backend** (Express — serves frontend as static files)

```bash
cd client && npm run build   # Build frontend to client/dist/
cd .. && node server/server.js  # NODE_ENV=production
```

**Environment variables (production):**

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mchicks
JWT_SECRET=<64-char random string>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

---

### Option 2: Separated Deployment

**Frontend** → Netlify / Vercel / Cloudflare Pages
- Build command: `npm run build`
- Publish dir: `client/dist`
- Environment: `VITE_API_URL=https://your-api-domain.com`

**Backend** → Railway / Render / Fly.io
- Start command: `node server/server.js`
- Set all environment variables in the platform UI

**Database** → MongoDB Atlas (Free tier supports ~512MB)

---

## Health Check

```
GET /api/health
→ 200 { "status": "ok", "database": "connected" }
```

Use this for uptime monitoring.

---

## DNS Requirements (if using custom domain)

- `mchicks.yourdomain.com` → Frontend hosting
- `api.mchicks.yourdomain.com` → Backend API
- Ensure HTTPS certificates are provisioned (Let's Encrypt / platform auto-SSL)

---

## Security Checklist Before Go-Live

- [ ] JWT_SECRET is a long random string (use: `openssl rand -hex 64`)
- [ ] MongoDB Atlas network access restricted to API server IP
- [ ] .env is not committed to Git
- [ ] NODE_ENV=production is set
- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS FRONTEND_URL set to exact production domain
