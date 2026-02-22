# MdcatXpert – Complete Blueprint

> **Vision:** Empower MDCAT aspirants in Pakistan with free, easy, and structured access to past papers, quizzes, and analytics — all in one intuitive SaaS platform.

---

## Mission Goals

1. Provide access to all past MDCAT papers in interactive quiz format
2. Allow students to track progress with dashboards and analytics
3. Give admins a simple tool to upload papers (Excel + images)
4. Keep the app completely free at launch to maximize adoption

## Long-term Goals

- Gamification (leaderboards, badges, streaks)
- Personalized AI-based suggestions
- Paid premium tier for advanced analytics and mock tests

---

## Branding

| Element           | Value                                |
| ----------------- | ------------------------------------ |
| **Name**          | MdcatXpert                           |
| **Theme**         | Blue (trustworthy, calm, academic)   |
| **Primary**       | Blue 600 `#1D4ED8`                   |
| **Accent**        | Blue 100 `#DBEAFE`                   |
| **Text**          | Gray 900 `#111827`                   |
| **Borders**       | Gray 200 `#E5E7EB`                   |
| **Heading Font**  | Inter Bold                           |
| **Body Font**     | Inter Regular                        |
| **H1 / H2 / Body**| 36px / 24px / 16px                  |

**Design Philosophy:** Mobile-first · Minimal, clean interface · Calm, stress-free UX · Clear hierarchy

---

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ------------------------------------------------ |
| Frontend     | Next.js + TailwindCSS                            |
| Data Fetching| React Query / SWR                                |
| Charts       | Recharts / Chart.js                              |
| Hosting      | Vercel                                           |
| Auth         | Supabase Auth (JWT + OAuth)                      |
| Database     | Supabase Postgres                                |
| Storage      | Supabase Storage (images)                        |
| Server Logic | Supabase Edge Functions (Excel parsing, scoring) |

---

## Database Schema

### `users`
| Column       | Type              | Notes             |
| ------------ | ----------------- | ----------------- |
| id           | UUID PK           | Unique user id    |
| name         | text              | User name         |
| email        | text (unique)     | Email             |
| role         | enum (student/admin) | Role           |
| created_at   | timestamp         | Account creation  |

### `papers`
| Column          | Type      | Notes           |
| --------------- | --------- | --------------- |
| id              | UUID PK   | Paper id        |
| title           | text      | Paper name/year |
| year            | int       | MDCAT year      |
| total_questions | int       | Count           |
| created_at      | timestamp | Upload date     |

### `questions`
| Column        | Type      | Notes                              |
| ------------- | --------- | ---------------------------------- |
| id            | UUID PK   | Question id                        |
| paper_id      | UUID FK   | Linked paper                       |
| question_text | text      | Question content                   |
| subject       | text      | Biology / Chemistry / Physics / English |
| image_url     | text      | Optional image                     |
| created_at    | timestamp | Timestamp                          |

### `options`
| Column      | Type      | Notes               |
| ----------- | --------- | ------------------- |
| id          | UUID PK   | Option id           |
| question_id | UUID FK   | Linked question     |
| option_text | text      | Option content      |
| is_correct  | boolean   | Correct answer flag |

### `attempts`
| Column     | Type      | Notes                |
| ---------- | --------- | -------------------- |
| id         | UUID PK   | Attempt id           |
| user_id    | UUID FK   | Student id           |
| paper_id   | UUID FK   | Paper id             |
| score      | int       | Correct answers count|
| time_taken | int       | Seconds              |
| created_at | timestamp | Attempt timestamp    |

### `attempt_answers`
| Column             | Type      | Notes                          |
| ------------------ | --------- | ------------------------------ |
| id                 | UUID PK   | Answer id                      |
| attempt_id         | UUID FK   | Linked attempt                 |
| question_id        | UUID FK   | Question id                    |
| selected_option_id | UUID FK   | Option selected by student     |
| is_correct         | boolean   | Whether selected option is correct |

---

## User Flows

### Student Flow
1. Signup / Login via Supabase Auth
2. View dashboard → Available papers, past attempts, accuracy, weakest subject
3. Select paper → Start quiz
4. Quiz page → Timer, question text + image, 4 options (A–D), navigation
5. Submit → Score calculation
6. View results and analytics

### Admin Flow
1. Login via Supabase Auth (admin role)
2. Upload Excel file (Columns: Question | A | B | C | D | Correct | Subject)
3. Edge function parses Excel → Creates paper, questions, options, uploads images
4. View uploaded papers and student attempts

---

## Golden Rules

1. Focus only on core features: Quiz engine + Excel upload + Dashboard + Analytics
2. Keep backend simple: Supabase + Edge Functions, no separate server
3. Mobile-first design
4. Clean UI, calm user experience
5. Launch early, collect feedback, iterate
