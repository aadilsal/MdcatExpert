# Phase 5 — Analytics & Insights (Week 5)

> **Goal:** Add visual analytics and trend data so students can deeply understand their strengths, weaknesses, and progress over time.

---

## Deliverables

### 1. Score Trend Chart
- [ ] Line chart showing score/accuracy over time
- [ ] X-axis: attempt date, Y-axis: accuracy %
- [ ] One data point per attempt
- [ ] Use Recharts or Chart.js
- [ ] Responsive and mobile-friendly

### 2. Correct vs Incorrect Breakdown
- [ ] Pie chart / donut chart:
  - Total correct answers across all attempts
  - Total incorrect answers
- [ ] Display percentages

### 3. Subject Accuracy Heatmap / Bar Chart
- [ ] Bar chart or heatmap showing accuracy per subject
- [ ] Color-coded: green (strong), yellow (average), red (weak)
- [ ] Helps student quickly identify weakest areas

### 4. Time Analysis
- [ ] Average time per question (across all attempts)
- [ ] Time per attempt chart
- [ ] Identify if student is rushing or spending too long

### 5. Weakest Subject Recommendations
- [ ] Highlight the weakest subject prominently
- [ ] Show specific stats: "You scored 45% in Chemistry across 3 attempts"
- [ ] Suggest: "Focus on Chemistry to improve your overall score"

### 6. Analytics Page (`/student/analytics`)
- [ ] Dedicated analytics page combining all charts
- [ ] Filter by: time period, specific paper
- [ ] Summary text insights at the top

---

## Acceptance Criteria

- All charts render correctly with real data from the database
- Charts are responsive across devices
- Subject-wise analysis matches actual attempt data
- Time analysis provides meaningful insights
- Weakest subject is correctly identified and highlighted
