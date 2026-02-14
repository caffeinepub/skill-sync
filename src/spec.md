# Specification

## Summary
**Goal:** Build the “Skill Sync” responsive multi-page UI with Internet Identity auth, user profiles, sessions, credits, feedback, and a persistent dark mode theme.

**Planned changes:**
- Create a responsive app shell with a modern navbar showing the “Skill Sync” logo, primary navigation (Home, Skill Match, Dashboard), active-route highlighting, and Login/Logout states.
- Implement the Home page with hero, subheading, CTAs (“Start Learning”, “Start Teaching”), Features, 3-step “How It Works” with icons, Testimonials, and a Footer with social links and contact info.
- Add Internet Identity-based Login flow and a first-time “Signup” profile setup (name + skills), reflecting authenticated state in the navbar.
- Build a login-protected Dashboard page showing profile (name, skills, credits), “Book a Session”, upcoming sessions list, earned credits display, and feedback ratings summary (1–5 stars).
- Build a Skill Match page with search, category filters (Coding, Design, Music, Language), and match cards showing rating, credit cost, and a request/book action.
- Build a Live Class page UI with video placeholder, start/stop session timer, feedback form (stars + comment), and a credit calculation display driven by duration and rating.
- Implement a single Motoko actor backend supporting profiles (name, skills, credits), sessions (create/list/update), feedback (rating/comment linked to session), and a deterministic credit calculation function with principal-based access control.
- Apply a consistent youth-focused design (soft blue+purple gradient background, card-based layout, modern typography, smooth hover/transition states) across all pages.
- Add a dark mode toggle in the global UI that persists user preference and updates theme colors (including gradient/background and components).

**User-visible outcome:** Users can browse a polished Home page, log in with Internet Identity, set up a profile, search/filter skill matches and request sessions, view a personalized Dashboard with credits/sessions/ratings, use a Live Class session UI with timer and feedback, and switch between light/dark themes with the choice remembered.
