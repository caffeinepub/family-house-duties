# Specification

## Summary
**Goal:** Improve the app’s visual appearance by proposing nicer color schemes and applying a cohesive default palette across the UI in both light and dark mode.

**Planned changes:**
- Provide 3 distinct, coherent color scheme suggestions (each with a short name and brief description) in the change description.
- Select one scheme as the default and update existing theme CSS variables in `frontend/src/index.css` for both `:root` (light) and `.dark` (dark).
- Ensure the updated tokens apply consistently across existing UI surfaces (header, tabs, cards, buttons, dialogs, gradients) via the existing Tailwind + CSS variable token system.

**User-visible outcome:** The app has a refreshed, cohesive light/dark color theme (including the login background gradient and key UI surfaces) with readable contrast throughout, without any new features or screens.
