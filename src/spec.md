# Specification

## Summary
**Goal:** Enable users to create scheduled 1:1 sessions, share a join link, and join at the right time into the correct Live Class video call.

**Planned changes:**
- Add backend persistent scheduled-session support: create, list upcoming for caller, fetch by id, join by id, and cancel (host only), with authorization and status tracking.
- Enforce a backend join-window rule and return a clear error when joining too early.
- Add React Query hooks for scheduled-session create/list/get/join/cancel and invalidate caches after mutations.
- Update Dashboard to source Upcoming Sessions from the backend (not localStorage), showing localized time, duration, skill/title, and Host/Guest role, plus a timed Join button.
- Add a Create Session form on the Dashboard (title optional, skill, date, time, duration) with validation and a copyable share link containing the session id.
- Implement timed Join Session routing into Live Class with URL parameters to restore session context on refresh; show a clear error if joined too early via link.
- Connect scheduled sessions to the existing WebRTC signaling flow so host and participant converge on the same 1:1 callId and do not self-call.
- Update the Skill Match “Book a Session” flow to create real backend scheduled sessions and surface the resulting join link and dashboard entry, keeping text in English.

**User-visible outcome:** Logged-in users can schedule a session, copy a shareable join link, see backend-backed upcoming sessions on the dashboard, and join (only when allowed) into the correct 1:1 Live Class call with another authenticated user.
