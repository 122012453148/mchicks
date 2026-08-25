# M-CHICKS — Broiler Chicken Farm Management & Decision Support System

> **A full-stack digital farm management platform for real-world broiler chicken farming operations.**

---

## Problem Statement

Traditional broiler farm management relies on paper notebooks and manual calculations, making it difficult to:
- Track feed consumption and forecast shortages
- Monitor daily mortality and live bird counts accurately
- Calculate FCR (Feed Conversion Ratio) on-demand
- Understand batch profitability before completion
- Share structured supervisor reports

## Solution

M-CHICKS is a complete farm management and decision-support system that digitizes all daily farm operations — from chick placement to final batch settlement — and provides real-time analytics and actionable recommendations.

---

## Key Features

- 🔐 **Secure Authentication** — JWT-based login with bcrypt password hashing
- 📊 **Owner Dashboard** — Live KPIs, alerts, and recommendations at a glance
- 🐔 **Batch Management** — Full lifecycle from placement to settlement
- 📅 **Daily Logs** — Feed, mortality, environment, water tracking
- ⚖️ **Weight Tracking** — Sample-based average weight with trend charts
- 🌾 **Feed Management** — Allocation, consumption, coverage forecast, shortage alerts
- 💀 **Mortality Tracking** — Daily and cumulative with trend analysis
- 🌡️ **Environment Monitoring** — Shed vs outdoor temperature/humidity
- 🌦️ **Live Weather** — Open-Meteo integration (Chengalpattu, Tamil Nadu)
- 🧮 **Calculation Engine** — Farm FCR, Growth FCR, Biomass, Performance Score
- 💊 **Supplements & Expenses** — Cost tracking per batch
- 👷 **Supervisor Reports** — Mobile-friendly inspection cards with share/print
- 📈 **Settlement** — Configurable company payout calculations
- 📋 **Reports** — Batch summary, history, comparison

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Charts | Recharts |
| Weather | Open-Meteo API (no key required) |
| Security | Helmet, CORS, express-rate-limit |

---

## Architecture

```
Browser (React/Vite)
    ↓ JWT Bearer Token
Express API (Port 5000)
    ↓ Mongoose
MongoDB (mchicks database)
    ↓
Open-Meteo (Weather API — no key)
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd M-Chicks

# Install root + server + client dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Environment Configuration

```bash
# Copy and fill in server/.env
cp server/.env.example server/.env
```

Required variables:
```
MONGODB_URI=mongodb://localhost:27017/mchicks
JWT_SECRET=your-secret-here
PORT=5000
NODE_ENV=development
```

### Seed Initial Data

```bash
# Create owner user account
node server/scripts/seedUser.js

# Seed demo farm data (optional)
node server/seed/seed.js
```

### Run Development Server

```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Login

```
Username: madhan333
Password: Mchick333
```

---

## Production Build

```bash
cd client && npm run build
```

Set `NODE_ENV=production` in server `.env`. The Express server serves the static frontend from `client/dist/`.

---

## Security Notes

- Passwords are hashed with **bcrypt (rounds=12)** — never stored in plain text
- All API endpoints require a valid JWT token (except `/api/auth/login` and `/api/health`)
- Rate limiting on login: 10 attempts per 15 minutes per IP
- CORS restricted to configured frontend origin
- Helmet security headers enabled
- Environment variables in `.env` — never commit to Git

---

## Farm Configuration

**M-CHICKS Farm**
- Shed: 48 × 28 ft = **1,344 sq.ft**
- Location: Chengalpattu, Tamil Nadu (12.6841°N, 79.9836°E)
- Default bag weight: 75 kg

---

## Calculation Engine

See [docs/CALCULATIONS.md](docs/CALCULATIONS.md) for full formula documentation.

Key metrics:
- **Farm FCR** = Total Feed (kg) ÷ Live Biomass (kg)
- **Growth FCR** = Total Feed (kg) ÷ (Final Biomass - Initial Biomass)
- **Mortality %** = (Deaths ÷ Initial Count) × 100
- **Feed Coverage** = Remaining Bags ÷ Daily Average Usage

---

## License

Private project — M-CHICKS Farm, Chengalpattu, Tamil Nadu.
