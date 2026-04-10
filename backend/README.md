# AbelUp Backend

Node.js + Express + MongoDB + TypeScript backend for AbelUp.

## Setup

```bash
cd backend
npm install

# Copy env and configure
cp .env.example .env

# Start MongoDB locally (or update MONGODB_URI)

# Seed demo data
npm run seed

# Start dev server
npm run dev
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Auth
- `POST /api/auth/register` — Register (CANDIDATE or RECRUITER)
- `POST /api/auth/login` — Login → returns JWT + user
- `POST /api/auth/change-password` — Change password (auth required)

### Candidate (auth + CANDIDATE role)
- `GET /api/candidate/profile` — Get profile
- `PUT /api/candidate/profile` — Update profile
- `GET /api/candidate/applied` — Applied jobs
- `GET /api/candidate/saved` — Saved jobs
- `POST /api/candidate/save/:jobId` — Toggle save
- `POST /api/candidate/apply/:jobId` — Apply (must be VERIFIED)
- `POST /api/candidate/resume` — Upload resume (multipart)

### Recruiter (auth + RECRUITER role)
- `GET /api/recruiter/jobs` — List own jobs (`?active=true`)
- `POST /api/recruiter/jobs` — Create job
- `GET /api/recruiter/job/:jobId/applicants` — List applicants
- `GET /api/recruiter/job/:jobId/summary` — Quick stats
- `PUT /api/recruiter/application/:id/shortlist` — Shortlist/reject

### Admin (auth + ADMIN role)
- `POST /api/admin/create-user` — Create user with temp password
- `PUT /api/admin/verify/:userId` — Verify/reject candidate
- `GET /api/admin/users` — List users
- `PUT /api/admin/user/:userId/force-reset` — Force password change

### Public
- `GET /api/jobs/search` — Search jobs (`?q=&location=&remote=&disability=`)
- `GET /api/jobs/:jobId` — Job detail

## Demo Credentials
- candidate@abelup.com / candidate123
- recruiter@abelup.com / recruiter123
- admin@abelup.com / admin123
