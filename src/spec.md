# Specification

## Summary
**Goal:** Fix false “Backend is not ready” states by hardening actor initialization and exposing real initialization errors so the UI can accurately show connecting vs failed status.

**Planned changes:**
- Update `frontend/src/hooks/useActor.ts` to only run access-control initialization when `caffeineAdminToken` is non-empty, and wrap `_initializeAccessControlWithSecret` in try/catch so actor creation can still succeed for non-admin usage.
- Expose the React Query error state from the actor query via `useActor` (e.g., return an `error` field alongside `actor` and `isFetching`).
- Update `frontend/src/hooks/useActorWithReadiness.ts` to derive `isInitializing`, `isReady`, and `initError` from the actor query’s fetching + actor presence + error state (using the new `error` from `useActor`).
- Add structured console diagnostics in `useActor.ts` around actor creation vs access-control initialization using existing diagnostics utilities, without logging any secrets (e.g., never log the admin token).

**User-visible outcome:** The app shows accurate backend connection messaging (connecting vs connection failed), transitions to ready state without refresh once the actor is available, and no longer reports “Backend is not ready” when the real issue is an initialization error.
