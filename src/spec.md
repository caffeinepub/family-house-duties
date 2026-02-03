# Specification

## Summary
**Goal:** Make Recurring Chores easier to find and use from the main Tasks page without adding clutter or changing existing recurring chore functionality.

**Planned changes:**
- Add a compact, inline “Recurring Chores” section to the Tasks tab Task List view that previews upcoming/grouped recurring chores and includes a clear action to open the existing RecurringChoresDialog.
- Add an empty state for when no recurring chores exist, with a single call-to-action that opens the existing dialog to add/manage chores.
- Refactor Tasks page header actions so Recurring Chores is no longer a competing secondary header button, aligning management access with the new inline section while keeping primary task actions prominent.

**User-visible outcome:** On the Tasks tab, users can see a small Recurring Chores preview inline and can open the existing recurring chores management dialog from an obvious action there (including when no recurring chores exist).
