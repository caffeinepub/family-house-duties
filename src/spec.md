# Specification

## Summary
**Goal:** Ensure the “Add Task” submit button is enabled/disabled based on true actor availability and form/mutation state, not incorrectly blocked by background fetching.

**Planned changes:**
- Update the Add Task dialog’s readiness/disabled gating to treat the actor as “ready” as soon as an actor instance exists, even if React Query is currently fetching.
- Keep the submit button disabled only when: task name is empty, add-task mutation is pending, actor is not yet initialized (no actor), or actor initialization errored.
- Ensure the dialog messaging/tooltip remains accurate and user-friendly for: connecting state, backend init failure, and missing task name.

**User-visible outcome:** Users can open the Add Task dialog, enter a task name, and successfully add a task end-to-end; the button no longer stays grayed out just because a background fetch is in progress, and the dialog clearly explains any remaining disabled states.
