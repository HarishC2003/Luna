# Luna Production Launch Checklist

Follow these steps faithfully to ensure Luna is deployed completely and securely.

## 1. Database Migrations
Run these in order on your production Supabase database via the SQL Editor:
- `[x]` `001_initial.sql` (Auth schema, Row-Level-Security, Profiles, Logs)
- `[x]` `002_cycle_tracker.sql` (Cycle Engine, Prediction heuristics)
- `[x]` `003_chat.sql` (AI Chatbot schema, Abuse logging, Feedback mechanism)
- `[x]` `004_settings_notifications.sql` (Push subscriptions, Toggles, Account Teardown)
- `[x]` `005_admin.sql` (Feature Flag Registry, Suspension schemas, Immutable Admin Logs)
- `[x]` Confirm RLS is strictly enabled across all `15 tables`.

## 2. Storage Setup
- `[x]` Create a **public** bucket named `avatars`. Enforce 2MB size limit. Add standard read-public RLS.
- `[x]` Create a **private** bucket named `privacy_exports`. Insert restrictive policy where `user_id = auth.uid()`.

## 3. Server Configuration & Vercel Requirements
Fill and push these `.env.local` variables securely into Vercel Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
GEMINI_API_KEY=...

# VAPID (Generated via npm run generate-vapid)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:hello@lunawellness.app

# Sentry Tracing
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...       <-- (DO NOT put this in Vercel Runtime Env, put in GitHub CI Secret)

# System Jobs
CRON_SECRET=...
```

## 4. Railway / Cron Setup
- Add a new GitHub connected worker to Railway (Running purely as a daily execution or Cron proxy).
- In the Railway Settings > Cron Jobs, map: `0 2 30 * * *`.
- Set payload to fetch the `/api/cron/daily` route pushing `{ "Authorization": "Bearer CRON_SECRET" }`.
- Monitor logs to ensure Web-Push and Resend execute sequentially.

## 5. Security Scanning & Build Integrity
Run local verifications:
- `npx trufflehog filesystem . --only-verified` (Ensure no API keys leaked in code).
- Confirm Sentry Replays remain disabled `replaysSessionSampleRate: 0` to preserve HIPAA/PII anonymity constraints mapping.

## 6. Sentry CI Uploading
- In your `.github/workflows/ci.yml`, verify the `SENTRY_AUTH_TOKEN` is injected and mapping source-maps successfully using `@sentry/cli`.

## 7. First Admin Initialization
- Launch Vercel domain.
- Register an account normally `you@luna.app`.
- Immediately enter the Supabase Dashboard SQL view and execute:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = 'you@luna.app';
  ```
- Navigate to `/admin` to verify dashboards load smoothly. Validate Feature flags (`ai_chat_enabled`) are functioning fully without delays.

---
Launch Success! Keep an eye on Upstash bounds and Sentry alerts.
