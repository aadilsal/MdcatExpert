# AI Features: Free vs Premium (Elite)

This document maps AI capabilities to the current access plan.

## Core AI features

- **Study Copilot** (RAG chat with notes + library)
- AI Mistake Analyzer (question-level breakdown)
- AI Weakness Radar (subject performance polar chart)
- AI Mistakes Summary (subject mistake aggregation + top insight)

## Study Copilot (Free vs Elite)

| Feature | Free | Elite |
|---------|------|-------|
| Personal uploads | 3 max | Unlimited |
| Messages per day | 10 | Unlimited |
| Chat modes | Explain only | All (Explain, Exam, Quiz me, Flashcards, Revise) |
| Platform library | Full access | Full access |

See [STUDY_COPILOT.md](STUDY_COPILOT.md) for implementation details. Uses **Groq only** (no OpenAI) — retrieval is Convex full-text search.

## Free plan

- 5 practice quizzes, basic analytics
- Study Copilot with limits above
- AI Mistake Analyzer on results (if enabled for free tier in your deployment)

## Premium (Elite) plan

- Unlimited quizzes, full Study Copilot
- AI Mistake Analyzer — `src/lib/ai/analyzer.ts`, Groq `llama-3.3-70b-versatile`
- AI Weakness Radar & Mistakes Summary — analytics page
- All Study Copilot chat modes

## Update log

- 2026-06-07: Added Study Copilot RAG matrix (free vs Elite limits).
- 2026-04-03: Added AI feature matrix and roadmap alignment in README.
