# Integration - Project Memory

Last update: 2026-04-15 (Europe/Paris)

## Session recap

- We switched focus from `whm-manager` to the `integration` app.
- We reviewed the full app scope (Admin / Teacher / Student).
- We listed current product functions (auth, student management, E4/E6, E5B missions, journal, portfolio, AI tutor, AI generator, exports, admin panel).
- Local dev server was started successfully.

## Local run status

- Command: `npm run dev`
- URL: `http://localhost:3000`
- Also available: `http://localhost:3000/login`

## Important technical observations

1. Repo is currently in a **dirty state** (many local modifications + untracked files).
2. `src/middleware.ts` is deleted locally and `src/proxy.ts` is present.
3. Lint is not clean right now (many pre-existing errors/warnings across the project).
4. Build in sandbox failed on Google font fetch (`Nunito`) from `next/font/google` (network fetch issue in local environment).
5. Main env vars expected by app:
   - `DATABASE_URL`
   - `DATABASE_PUBLIC_URL`
   - `JWT_SECRET`
   - `GOOGLE_API_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL`

## Functional map (quick)

- **Admin**: login, teacher approval/reject/delete, reset teacher password, global KPI.
- **Teacher**: dashboard, student import CSV, student links/comments, E4/E6 follow-up, competency grading, E5B missions (create/assign/follow-up), journal validation, portfolio review, AI generator, doc library.
- **Student**: dashboard, notifications, password change, WordPress/Presta URL management, assigned missions, AI-generated mission, journal entries, portfolio, E4/E6 pages, AI tutor chat.

## Next session (tomorrow morning) - suggested start

1. Re-open local app and validate core navigation quickly.
2. Decide priority track:
   - Track A: stabilize (build/lint/auth consistency).
   - Track B: functional improvements.
3. If Track A:
   - audit auth consistency (`jwt.ts`, `student/profile`, cookie/localStorage flow),
   - normalize middleware/proxy usage,
   - isolate/resolve deployment blockers first.

## Saved idea from user (2026-04-15)

- Build a dedicated **teacher landing page** to explain:
  - what the application does for teachers,
  - concrete advantages for classroom management and pedagogy,
  - how it improves student learning outcomes,
  - how it helps with attention-related challenges,
  - and how it increases teaching efficiency.
