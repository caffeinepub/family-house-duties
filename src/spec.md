# Specification

## Summary
**Goal:** Enable users to edit or delete their own tasks and recurring chores directly from calendar day and week planner views.

**Planned changes:**
- Add per-task Edit and Delete controls in `CalendarDayPlanner.tsx` for tasks on the selected day; wire Edit to the existing `EditTaskDialog` and Delete to an existing delete mutation with confirmation and React Query invalidation.
- Add per-task Edit and Delete controls in `CalendarWeekPlanner.tsx` for tasks displayed across the week; wire Edit to `EditTaskDialog` and Delete to an existing delete mutation with confirmation and React Query invalidation.
- Add per-recurring-chore Edit and Delete actions in both day and week planner views; route edits through the existing recurring chore update flow and deletes through the existing recurring chore delete mutation with confirmation and React Query invalidation.
- Gate all Edit/Delete controls so they only appear for items created by the current authenticated user (`createdBy` matches the principal).

**User-visible outcome:** In day and week calendar planners, users can edit or delete tasks and recurring chores they created (with a confirmation before deletion), while items created by others show no edit/delete actions.
