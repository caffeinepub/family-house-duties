# Specification

## Summary
**Goal:** Add a persistent Today Focus panel that always shows today’s due tasks and today’s assigned cook across all authenticated views.

**Planned changes:**
- Add a “Today Focus” panel to the authenticated app layout, positioned below the Header and above the tab navigation/content so it remains visible on all main tabs (Tasks, Dinner Rota, Calendar, People).
- In the Today Focus panel, show only tasks due today (local day key `yyyy-MM-dd`), excluding tasks without a due date and excluding tasks due on other days.
- In the Today Focus panel, show today’s cook based on the dinner rota assignment for today’s day key (`yyyy-MM-dd`), preferring profile display names when available.
- Provide stable loading (skeleton/placeholder) and clear empty states for “no tasks due today” and “no cook assigned today,” using existing React Query data sources.

**User-visible outcome:** When signed in, users see a small Today Focus section at the top of the app on every tab, summarizing only today’s tasks and today’s cook with clear loading/empty messaging.
