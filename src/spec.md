# Specification

## Summary
**Goal:** Add a user-selectable theme mode (Light/Dark/System) that applies across the app and persists across sessions.

**Planned changes:**
- Add a theme mode control (Light, Dark, System) in the authenticated app header (e.g., within a user menu/dropdown) to switch themes at runtime.
- Persist the selected theme mode and apply it on both the login screen (unauthenticated) and the authenticated app, defaulting to System if no selection was made.
- Audit key screens (Task List, Dinner Rota, Calendar, People) to ensure Tailwind/Shadcn theme tokens render correctly in Dark mode without low-contrast text or broken component backgrounds.

**User-visible outcome:** Signed-in users can switch between Light, Dark, and System theme instantly, and their choice is remembered and applied consistently on the login screen and throughout the app.
