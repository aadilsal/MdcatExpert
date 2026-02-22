# Phase 4 — Student Dashboard (Week 4)

> **Goal:** Build the student dashboard showing past attempts, overall performance, and quick access to papers.

---

## Deliverables

### 1. Dashboard Overview (`/student/dashboard`)
- [ ] Welcome message with student name
- [ ] Summary cards:
  | Card              | Data                            |
  | ----------------- | ------------------------------- |
  | Total Attempts    | Count of all attempts           |
  | Average Score     | Mean accuracy across attempts   |
  | Best Score        | Highest accuracy achieved       |
  | Weakest Subject   | Subject with lowest avg accuracy|
- [ ] Quick action: "Take a New Quiz" button

### 2. Past Attempts List
- [ ] Table/list of all past attempts:
  - Paper title & year
  - Score (e.g., 150/200)
  - Accuracy percentage
  - Time taken
  - Date attempted
- [ ] Click to view detailed results (links to `/student/results/[attemptId]`)
- [ ] Sort by date (newest first), optional sort by score

### 3. Subject-wise Performance
- [ ] Card or section showing accuracy per subject:
  - Biology
  - Chemistry
  - Physics
  - English
- [ ] Visual indicator (progress bar or percentage)
- [ ] Highlight weakest subject with a warning badge

### 4. Responsive Design
- [ ] Ensure dashboard looks great on mobile
- [ ] Stack cards vertically on small screens
- [ ] Collapsible attempts table on mobile

---

## Acceptance Criteria

- Dashboard loads with correct data for the logged-in student
- Summary cards show accurate calculations
- Past attempts are listed and link to detailed results
- Subject-wise breakdown is accurate based on `attempt_answers` data
- Works well on both desktop and mobile
