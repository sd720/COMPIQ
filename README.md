# CompIQ — Compensation Intelligence Platform

> **Track C · Full Stack Engineer** — Internship Demo Submission

## Live Demo

[Your Vercel URL here after deployment]

## GitHub Repository

[Your GitHub URL here]

---

## Overview

**CompIQ** is a production-grade compensation intelligence platform for Indian tech professionals — built like Levels.fyi but focused on India-specific levels, companies, and cities.

### Core Problem it Solves

Indian tech professionals lack structured, level-based salary data. Job titles are misleading; what matters is the **level** (L3 vs L5, SDE-I vs SDE-III). CompIQ provides:
- Comparable data across companies using the same level taxonomy
- Transparent TC breakdown (Base + Bonus + Equity)
- Offer analysis before accepting

---

## Features

| Feature | Description |
|---|---|
| 🔍 **Salary Explorer** | Search, filter, and sort 500+ salary entries by company, role, level, city, YoE |
| 🏢 **Company Pages** | Per-company TC breakdown with level progression and role charts |
| ⚖️ **Comparison Tool** | Side-by-side comparison of 2–3 companies with level-by-level charts |
| 📊 **Offer Analyzer** | Input any offer → get percentile rank + market distribution |
| ✍️ **Submit Salary** | Anonymous salary submission with live TC preview |
| 📥 **CSV Import** | Bulk import with validation, error reporting, city/company normalization |
| 🔐 **Authentication** | Google OAuth + Email credentials via NextAuth |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | TailwindCSS v4, custom glass morphism components |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth v4 + Google + Credentials |
| Charts | Recharts |
| Validation | Zod + react-hook-form |
| CSV | PapaParse |

---

## Architecture Decisions

### 1. Level-First Design
Every salary entry has a `level` (string) + `levelOrder` (integer) so we can sort L3→L7 or SDE-I→SDE-III correctly regardless of company naming convention. This is the key differentiator over AmbitionBox/Glassdoor.

### 2. Company Normalization
Company names are normalized (`normalizeCompanyName()`) before insertion to prevent duplicates like "Google India" vs "google" vs "Google LLC". Slug-based routing ensures clean URLs.

### 3. TC Calculation
`totalCompensation = baseSalary + bonus + equity` (all annualized). Users are guided to enter equity as `totalGrant / vestingYears`. The backend recomputes this on submission — client-side values are not trusted.

### 4. API Architecture
- All data access through API routes (not direct DB from client)
- Filtered queries use Prisma `where` objects built dynamically
- Aggregation done in API (not client-side) for performance
- Pagination with cursor-free offset (sufficient for this scale)

### 5. Authentication
NextAuth with PrismaAdapter stores sessions in PostgreSQL. JWT strategy used for stateless API calls. Both Google OAuth and email credentials supported.

---

## Database Schema

```
Company (name, normalizedName, slug, industry, size, logo)
    ↕ 1:N
SalaryEntry (role, level, levelOrder, baseSalary, bonus, equity, totalCompensation, city, verified)
    ↕ M:1
User (email, name, image)
```

---

## Local Setup

```bash
# 1. Clone and install
cd D:\compiq
npm install

# 2. Set up environment
cp .env.example .env
# Fill in: DATABASE_URL (Neon), NEXTAUTH_SECRET, GOOGLE_CLIENT_ID/SECRET

# 3. Push schema + seed
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

---

## Deployment (Vercel + Neon)

1. Create a [Neon](https://neon.tech) database
2. Push to GitHub
3. Connect repo to [Vercel](https://vercel.com)
4. Add environment variables in Vercel dashboard
5. Run `prisma db push` from Neon console or Vercel build hook
6. Run seed via Vercel CLI: `vercel env pull && npx tsx prisma/seed.ts`

---

## Edge Cases Handled

- Invalid salary values (negative, >10000 LPA) → rejected with error message
- Unknown cities → mapped to `OTHER`
- Company name variations → normalized before DB insert
- Missing bonus/equity → default to 0 (not rejected)
- Unknown CSV columns → ignored gracefully
- Empty comparison result → shown as "No data available"
- Logo fetch failure → fallback icon (onError handler)
- Unauthenticated CSV import → 401 with redirect link

---

## Competitive Analysis

| Feature | Levels.fyi | 6figr | AmbitionBox | CompIQ |
|---|---|---|---|---|
| Level-based data | ✅ | ✅ | ❌ | ✅ |
| TC breakdown | ✅ | ✅ | Partial | ✅ |
| India-specific | ❌ | ✅ | ✅ | ✅ |
| Comparison tool | ❌ | ❌ | ❌ | ✅ |
| Offer percentile | ❌ | ✅ | ❌ | ✅ |
| CSV import | ❌ | ❌ | ❌ | ✅ |
| Open source | ❌ | ❌ | ❌ | ✅ |
