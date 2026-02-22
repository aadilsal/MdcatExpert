# Phase 3 — Quiz Engine (Week 3)

> **Goal:** Build the core quiz experience — selecting a paper, taking the quiz with a timer, submitting answers, and viewing results.

---

## Deliverables

### 1. Paper Selection
- [ ] Create `/student/papers` page listing available papers
- [ ] Show: title, year, total questions, number of past attempts by this user
- [ ] "Start Quiz" button for each paper
- [ ] Sort by year (newest first)

### 2. Quiz Page (`/student/quiz/[paperId]`)
- [ ] Fetch all questions + options for the selected paper
- [ ] Render one question at a time with:
  - Question number and text
  - Optional image (if `image_url` exists)
  - 4 options (A–D) as selectable cards/radio buttons
  - Visual highlight on selected option
- [ ] Navigation controls:
  - Next / Previous buttons
  - Question number strip (jump to any question)
  - Indicator for answered vs unanswered questions
- [ ] Timer at the top:
  - Count-up timer showing elapsed time (MM:SS)
  - Persists across question navigation
- [ ] Store selected answers in local state (React state / context)
- [ ] "Submit Quiz" button (with confirmation dialog)

### 3. Scoring & Submission
- [ ] On submit:
  1. Calculate score (count of correct answers)
  2. Calculate `time_taken` from timer
  3. Insert row into `attempts` table
  4. Insert rows into `attempt_answers` table (one per question)
- [ ] Redirect to results page

### 4. Results Page (`/student/results/[attemptId]`)
- [ ] Show overall score: `X / Y` correct
- [ ] Show percentage and time taken
- [ ] Subject-wise breakdown:
  | Subject   | Correct | Total | Accuracy |
  | --------- | ------- | ----- | -------- |
  | Biology   | 30      | 40    | 75%      |
  | Chemistry | 18      | 30    | 60%      |
  | ...       | ...     | ...   | ...      |
- [ ] Question-by-question review:
  - Show question text
  - Highlight selected answer (green if correct, red if wrong)
  - Show correct answer
- [ ] "Back to Papers" and "Retake Quiz" buttons

---

## Acceptance Criteria

- Student can select a paper and take a timed quiz
- All questions render correctly with images where applicable
- Navigation between questions works (next, prev, jump)
- Score is calculated correctly on submission
- Attempt and individual answers are saved to the database
- Results page shows accurate score, subject breakdown, and question review
