# Specification

## Summary
**Goal:** Add consistent hero/header images to the top of each main tab (Task List, Dinner Rota, Calendar, People) using a reusable component and static frontend assets.

**Planned changes:**
- Create a reusable hero/header section component with responsive styling, rounded corners, a gradient overlay for text readability, and descriptive English alt text.
- Add a distinct hero image to the top of Task List, Dinner Rota, Calendar, and People views using the shared hero/header component and consistent styling.
- Add new generated hero images as static assets under `frontend/public/assets/generated` and reference them via absolute paths (e.g., `/assets/generated/...`) without any backend loading.

**User-visible outcome:** Each main tab displays a polished, consistent hero banner image at the top of the page with accessible alt text and responsive layout.
