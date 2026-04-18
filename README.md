# Luna — Period & Cycle Tracker

Luna is a comprehensive, privacy-first women's health application incorporating predictive algorithms, AI interactions, progressive web tooling, and deep administrative capacities.

## 1. Architecture Overview (All 5 Modules)
* **Module 1 (Auth)**: JWT-based authentication layered behind Edge middleware verification strategies. Supabase powers profiles and security telemetry.
* **Module 2 (Cycle Tracker)**: Evaluates dynamic heuristics spanning standard distributions. Processes periods against past datasets.
* **Module 3 (AI Chatbot)**: Connects with Gemini natively. Includes strong regex logic pre-flight to securely strip out all PII, guaranteeing zero LLM leakage or log retentions locally.
* **Module 4 (Notifications & Export)**: Features the ability to export raw datasets compliant with GDPR, natively run CRON workers using Resend constraints, and securely delete all arrays inside the bucket totally without ghost entries.
* **Module 5 (Admin & Sentry)**: Protects core systems via dynamic Feature Flags, aggregates stats on standalone custom SVG charts, suspends abusers efficiently, and captures critical telemetry safely filtering privacy vectors using native Sentry Node SDK pipelines.

## 2. Environment Variables Matrix
Place these securely in your deployment variables and mapped within `.env.local` for testing contexts:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
GEMINI_API_KEY=...

NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...       <-- (Only inside GitHub Secrets; completely absent from runtime deployments).

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:hello@lunawellness.app

CRON_SECRET=...
```

## 3. Local Development Setup
1. `npm ci`
2. Spin up your Supabase Local/Remote databases.
3. Migrate `001` through `005` natively using SQL UI.
4. Clone `.env.example` into `.env.local` filling the variables properly.
5. Create buckets mapping exact parameters.
6. `npm run dev`

## 4. Deployment Guide
- **Vercel**: Handles the Web Hosting natively. Connect your GitHub repository. Vercel automatically isolates Edge routes effectively if environment variables (`NEXT_PUBLIC_*`) correlate.
- **Railway**: Spins the Cron Worker. Link the repository exclusively running `fetch -> /api/cron/daily` at 08:00 IST using internal payload `Authorization: Bearer CRON_SECRET`.
- **Sentry**: Map DSN. Attach Auth tokens to GitHub Actions secrets.
- **Supabase**: Cloud PostgreSQL interface serving tables. 
- **Upstash**: Native Redis caching shielding user suspension fetches to mitigate D-DoS loads.

## 5. Setup your first Admin
Create your account statically traversing `/register`. Next, open the Supabase SQL editor and execute:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## 6. Run Migrations
All files sit within `supabase/migrations/*`.
You must run `001_initial.sql` → `002_cycle_tracker.sql` → `003_chat.sql` → `004_settings_notifications.sql` → `005_admin.sql`. Do not stagger or run out of sequence recursively.
