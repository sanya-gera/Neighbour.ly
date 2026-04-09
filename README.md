# Neighbour.ly

A civic issue reporting platform. Citizens report local problems, upvote issues, and earn points. Authorities manage and resolve them.

---

## Quick Start

### 1. Backend setup

```bash
cd backend
cp .env.example .env        # fill in all values (see below)
npm install
npm run generate            # generate Prisma client
npm run db:push             # create tables in your database
npm run dev                 # starts on http://localhost:4000
```

### 2. Frontend setup

```bash
# in the root neighbour-ly/ folder
cp .env.example .env        # set VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # starts on http://localhost:5173
```

---

## Filling in `backend/.env`

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Supabase](https://supabase.com) → project → Settings → Database → Connection string |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GOOGLE_CALLBACK_URL` | Leave as `http://localhost:4000/api/auth/google/callback` for local dev |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `ADMIN_SECRET` | Any random string — used to grant authority role |
| `CLOUDINARY_*` | [cloudinary.com](https://cloudinary.com) → Dashboard (free tier works) |
| `EMAIL_FROM` | A Gmail address |
| `EMAIL_PASSWORD` | Google Account → Security → App Passwords → generate 16-char password |

---

## Granting Authority Access

By default all users sign up as citizens. To make someone an authority:

```bash
curl -X POST http://localhost:4000/api/users/make-authority \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: myAdmInSecreT" \
  -d '{"email": "sanya.gera.ug23@nsut.ac.in"}'
```

They then switch to authority view using the role toggle in the header.

---

## Features

- **Google OAuth** — sign in with Google, JWT sessions stored in DB
- **Report Issues** — title, description, category, location, photo upload
- **Photo Uploads** — images uploaded to Cloudinary, displayed in cards and table
- **Pin Location** — "Pin" button captures GPS coordinates, shown on map
- **Map View** — interactive Leaflet map showing all issues with coordinates (colour-coded by status)
- **My Issues Tab** — citizen view filtered to their own reports
- **Upvoting** — +2 points per upvote, prevents double voting
- **Authority Dashboard** — table view with status update dropdown
- **Email Notifications** — reporter gets emailed when their issue status changes
- **Points System** — report (+5), upvote (+2), issue fixed (+10)
- **Leaderboard** — top users ranked by points
- **Role Authorization** — only DB-level AUTHORITY users can switch to authority view

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/ping` | ❌ | Health check |
| GET | `/api/auth/google` | ❌ | Start OAuth |
| GET | `/api/auth/me` | ✅ | Current user |
| POST | `/api/auth/signout` | ✅ | Sign out |
| GET | `/api/issues` | ✅ | List issues (`?mine=true` for own issues) |
| POST | `/api/issues` | ✅ | Create issue (multipart/form-data with optional photo) |
| POST | `/api/issues/:id/upvote` | ✅ | Upvote |
| PATCH | `/api/issues/:id/status` | ✅ Authority | Update status |
| GET | `/api/leaderboard` | ✅ | Leaderboard |
| PATCH | `/api/users/role` | ✅ | Switch role (authority-gated) |
| POST | `/api/users/make-authority` | Admin secret | Grant authority role |
