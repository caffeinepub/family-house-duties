# Specification

## Summary
**Goal:** Fix recurring chores create/update so saves are reliable, the UI immediately reflects changes, errors are clearly shown, and recurring chores persist across canister upgrades.

**Planned changes:**
- Diagnose and fix the recurring chores create/update save flow so “Create Chore” / “Update Chore” reliably writes to the backend and the dialog/list reflect the saved state immediately.
- Add stable-state persistence for recurring chores and the recurring chore ID counter using Motoko preupgrade/postupgrade hooks (keeping existing behavior and APIs unchanged).
- Add structured diagnostic console logging on both frontend and backend for recurring chore mutations (create/update/pause/delete), including key payload fields and trap details.
- Ensure the Recurring Chores dialog Save button always submits the correct form exactly once, is only enabled when inputs are valid, and shows a disabled “Saving...” pending state while in-flight.

**User-visible outcome:** Users can create and edit recurring chores and see the updated “Existing Recurring Chores” list immediately without refreshing; failures keep the dialog open with a clear English error message; recurring chores remain intact after canister upgrades.
