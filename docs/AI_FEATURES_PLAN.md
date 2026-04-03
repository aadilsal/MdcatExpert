# AI Features: Free vs Premium (Elite)

This document clearly maps implemented AI capabilities to the current access plan.

## Core AI features implemented today

- AI Mistake Analyzer (question-level breakdown)
- AI Weakness Radar (subject performance polar chart)
- AI Mistakes Summary (subject mistake aggregation + top insight)
- Elite visualization and messaging in analytics and results pages

## Free plan

- Access to quizzes and basic analytics (no AI-specific features to run in frontend across incorrect answers). 
- Default summaries on dashboard and standard results stats.
- User can see model-based AI results only after enabling Elite (via paid upgrade), not in free mode.

## Premium (Elite) plan

AI features available only when user has premium/elite membership:

- **AI Mistake Analyzer** (in answer review)
  - Source: `src/lib/ai/analyzer.ts`
  - API route: `src/app/(app)/results/actions.ts` → `generateAnswerInsight`
  - UI card: `src/app/(app)/results/ai-insight-card.tsx`
  - Groq LLM: `llama-3.3-70b-versatile`
  - Provides generated JSON: `reasoning`, `misconception`, `recommendation`

- **AI Weakness Radar** (subject radar chart)
  - Source: `api/services/weakness_radar.py`
  - Route: `/api/py/analytics/radar/{user_id}`
  - Display: `src/app/(app)/analytics/analytics-client.tsx`

- **AI Mistakes Summary**
  - Source: `api/services/mistake_analyzer.py`
  - Route: `/api/py/analytics/mistakes/{user_id}`
  - Provides overall mistake count, per-subject breakdown, top insight.

- **AI Insights in analytics page**
  - Source: `src/app/(app)/analytics/page.tsx`
  - Combined with above endpoints to show AI-driven "Elite Advice" cards.

## Notes

- Free users can view static analytics but should not receive AI insights (based on user role checks in pages and query paths).
- This mapping is based on the current branch `enhancement/new_features` state as of April 3, 2026.
