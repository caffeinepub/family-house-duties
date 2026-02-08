# Specification

## Summary
**Goal:** Make it unambiguous when voice dictation is actively listening by adding a subtle but clear visual indicator and exposing the listening state to assistive technologies.

**Planned changes:**
- Update the VoiceDictationButton UI to show an additional listening indicator (beyond the existing pulse) only while `isListening` is true.
- Ensure the listening indicator is visible in every place the VoiceDictationButton is used (including AddTaskDialog and EditTaskDialog dictation controls).
- Add accessibility semantics so screen readers can detect/announce the listening state (English text), while keeping existing tooltip behavior and mobile operability intact.

**User-visible outcome:** When starting voice dictation, users see a clear “listening” cue on the mic control that works on light/dark themes and is reflected in accessibility output; the cue disappears immediately when dictation stops or errors.
