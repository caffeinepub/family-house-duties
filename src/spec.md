# Specification

## Summary
**Goal:** Swap the hero/header images at the top of each main tab for cleaner, more modern visuals without changing layout or asset paths.

**Planned changes:**
- Replace the existing header image assets for Tasks, Dinner Rota, Calendar, and People with new clean/modern banner images.
- Keep the exact same filenames and dimensions currently referenced by the UI so navigation across tabs produces no broken images or layout changes.
- Add/overwrite the updated image files under `frontend/public/assets/generated` so they load successfully in the browser.

**User-visible outcome:** The Tasks, Dinner Rota, Calendar, and People tabs display refreshed, clean, modern header images with the same sizing and layout as before.
