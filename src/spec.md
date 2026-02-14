# Specification

## Summary
**Goal:** Enable real 1:1 in-browser video calls on the Live Class page using WebRTC, with signaling handled by the existing Motoko canister and a simple join-link flow.

**Planned changes:**
- Update `/live-class` to replace the video placeholder with a working WebRTC UI: local preview, remote video area, and basic controls (Start/Join, End) plus clear connection status text.
- Add a shareable join-link flow using `callId` (e.g., `/live-class?callId=...`), including copy-to-clipboard and clear handling for invalid/expired calls.
- Implement Motoko canister signaling APIs to create/join/end calls and exchange offer/answer/ICE messages securely between exactly two authenticated participants, with cleanup/TTL.
- Integrate signaling into the frontend using existing actor + React Query patterns with polling for message receipt, ensuring resilience across refresh/navigation and without modifying immutable UI/hook paths.
- Add permission/availability error handling for camera/microphone denial so the page shows a clear error state without crashing, while keeping the existing session timer and feedback/credits UI usable.

**User-visible outcome:** Two authenticated users can start or join a Live Class 1:1 video call via a shareable link, see connection status, control the call, and reliably connect/reconnect using in-browser video without third-party video services.
