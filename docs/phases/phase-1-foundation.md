# Phase 1 — Foundation (Week 1)

> **Goal:** Set up the project skeleton, configure Supabase, create the database, and implement authentication with protected routes.

---

## Deliverables

### 1. Project Setup
- [ ] Initialize Next.js project with TailwindCSS
- [ ] Configure folder structure (`app/`, `components/`, `lib/`, `utils/`)
- [ ] Set up environment variables (`.env.local`) for Supabase keys
- [ ] Install core dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`
- [ ] Configure Inter font (Google Fonts) and base TailwindCSS theme with brand colors

### 2. Supabase Configuration
- [ ] Create Supabase project
- [ ] Set up all database tables with proper types, constraints, and foreign keys:
  - `users` (id, name, email, role, created_at)
  - `papers` (id, title, year, total_questions, created_at)
  - `questions` (id, paper_id, question_text, subject, image_url, created_at)
  - `options` (id, question_id, option_text, is_correct)
  - `attempts` (id, user_id, paper_id, score, time_taken, created_at)
  - `attempt_answers` (id, attempt_id, question_id, selected_option_id, is_correct)
- [ ] Configure Row Level Security (RLS) policies:
  - Students can read papers/questions/options
  - Students can only read/write their own attempts
  - Admins can read/write everything
- [ ] Set up Supabase Storage bucket for question images

### 3. Authentication
- [ ] Implement Supabase Auth (email/password signup + login)
- [ ] Optional: Google OAuth provider
- [ ] Create auth pages: `/login`, `/signup`
- [ ] Build auth context/provider for session management
- [ ] Implement protected route middleware (redirect unauthenticated users)
- [ ] Role-based routing: separate `/student/*` and `/admin/*` areas

### 4. Base Layout
- [ ] Create shared layout with navigation bar
- [ ] Student sidebar/nav: Dashboard, Papers, My Attempts
- [ ] Admin sidebar/nav: Upload Paper, View Papers, View Students
- [ ] Responsive mobile menu

---

## Acceptance Criteria

- A user can sign up, log in, and log out
- Unauthenticated users are redirected to `/login`
- Student and admin see different navigation options
- All 6 database tables exist with correct relationships
- RLS policies prevent unauthorized data access
