# Phase 6 — Polish, Testing & Beta Launch (Week 6)

> **Goal:** Polish the mobile UX, fix bugs, optimize performance, and launch a beta to 50–100 students.

---

## Deliverables

### 1. Mobile UX Polish
- [ ] Audit every page on mobile viewports (375px, 414px, 768px)
- [ ] Fix any overflow, text truncation, or layout issues
- [ ] Ensure touch targets are at least 44×44px
- [ ] Test quiz experience on mobile — option selection, navigation, submit
- [ ] Smooth transitions and animations on page changes

### 2. Performance Optimization
- [ ] Optimize database queries (add indexes on frequent query columns):
  - `questions.paper_id`
  - `options.question_id`
  - `attempts.user_id`
  - `attempt_answers.attempt_id`
- [ ] Lazy load images on quiz pages
- [ ] Implement SWR/React Query caching for paper lists and dashboard data
- [ ] Check and optimize Supabase Edge Function cold start times
- [ ] Run Lighthouse audit — target 90+ on Performance & Accessibility

### 3. Bug Fixes & Edge Cases
- [ ] Handle edge cases:
  - Empty papers (no questions)
  - User submitting quiz with unanswered questions
  - Network failure during quiz submission (retry logic)
  - Duplicate quiz submissions
- [ ] Test Excel upload with malformed files
- [ ] Test auth flows: expired sessions, password reset

### 4. Final UI Review
- [ ] Consistent use of brand colors across all pages
- [ ] Proper loading states (skeletons / spinners) on all data fetches
- [ ] Empty states for: no attempts yet, no papers available
- [ ] Error states with helpful messages
- [ ] Toast notifications for success/error actions

### 5. Beta Launch Prep
- [ ] Deploy to Vercel (production)
- [ ] Set up custom domain (if available)
- [ ] Create 1–2 sample papers for testing
- [ ] Onboard admin account
- [ ] Share with 50–100 beta students
- [ ] Create simple feedback form (Google Forms or Typeform)
- [ ] Monitor Supabase usage and Vercel analytics

---

## Acceptance Criteria

- App works smoothly on mobile devices
- Lighthouse scores: Performance 90+, Accessibility 90+
- All known bugs are resolved
- Beta users can sign up, take quizzes, and view results without issues
- Feedback collection mechanism is in place
