# Phase 2 — Admin Excel Upload & Paper Management (Week 2)

> **Goal:** Build the admin interface for uploading MDCAT papers via Excel files and managing existing papers.

---

## Deliverables

### 1. Excel Upload UI
- [ ] Create `/admin/upload` page
- [ ] Build drag-and-drop file upload component (accepts `.xlsx` only)
- [ ] Show upload progress indicator
- [ ] Display success/error feedback with question count summary
- [ ] Add form fields for paper metadata: title, year

### 2. Excel Parsing (Supabase Edge Function)
- [ ] Create Edge Function `parse-paper`
- [ ] Accept uploaded `.xlsx` file + paper metadata
- [ ] Parse Excel rows with expected columns:
  | Column   | Description          |
  | -------- | -------------------- |
  | Question | Question text        |
  | A        | Option A             |
  | B        | Option B             |
  | C        | Option C             |
  | D        | Option D             |
  | Correct  | Correct option (A–D) |
  | Subject  | Biology / Chemistry / Physics / English |
- [ ] Validate structure — reject files with missing/incorrect columns
- [ ] For each row:
  1. Insert into `questions` table (linked to paper)
  2. Insert 4 rows into `options` table (mark `is_correct` for correct option)
- [ ] Insert paper record into `papers` table with `total_questions` count
- [ ] Return summary: total questions parsed, any skipped rows

### 3. Image Upload Support
- [ ] Allow optional image column in Excel (image filename or URL)
- [ ] Upload referenced images to Supabase Storage bucket
- [ ] Store generated public URL in `questions.image_url`

### 4. Paper Management
- [ ] Create `/admin/papers` page listing all uploaded papers
- [ ] Show: title, year, question count, upload date
- [ ] Add delete functionality (cascade delete questions, options)
- [ ] Add view details action (preview questions in paper)

---

## Acceptance Criteria

- Admin can upload a valid `.xlsx` file and see it parsed into a paper
- Invalid files are rejected with clear error messages
- Uploaded paper appears in the papers list with correct question count
- Admin can delete a paper and all its associated data
- Images (if provided) are uploaded to storage and linked to questions
