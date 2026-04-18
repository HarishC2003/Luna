# Module 3: Luna AI Chatbot

## Files Created
- `supabase/migrations/003_chat.sql` (Database schemas, RLS policies for chat and abuse logs)
- `src/lib/chat/pii-stripper.ts` (Rules to strip phone numbers, emails, name patterns, dates, locations, Aadhaar digits, and URLs locally)
- `src/lib/chat/crisis-detector.ts` (Local rule-based pattern matching for crisis intention detection mapped to verified hotlines)
- `src/lib/chat/system-prompt.ts` (Generates dynamically the context-rich system prompts containing phase, conditions, goals, and history context)
- `src/lib/chat/suggestions.ts` (Generates tap-to-send questions conditionally based on UI state and next cycle period)
- `src/types/chat.ts` (TypeScript types for the Chat interfaces and Crisis elements)
- `src/hooks/useChat.ts` (Hook combining Streaming API handling, React state, and feedback management)
- `src/app/api/chat/message/route.ts` (Core streaming AI SSE route securely wrapping the Gemini chat completions model)
- `src/app/api/chat/suggestions/route.ts` (Endpoint returning suggested starter context queries)
- `src/app/api/chat/feedback/route.ts` (Endpoint logging user feedback securely with backend constraints)
- `src/app/(dashboard)/chat/page.tsx` (UI container assembling chat presentation components)
- `src/components/chat/ChatBubble.tsx` (Individual message rendering UI, handling Luna stream typing and crisis payload formatting)
- `src/components/chat/CrisisResourceCard.tsx` (Visual component for Indian Mental Health Helplines)
- `src/components/chat/SuggestionChips.tsx` (Initial interactive prompt chips)
- `src/components/chat/ChatInput.tsx` (Auto-sizing text area allowing line-breaks and disabling during streaming)
- `src/components/chat/TypingIndicator.tsx` (Animated SVG typing micro-animation context)

## Files Modified
- `src/lib/rate-limit/limiter.ts`: Added sliding window limiter exclusively for the `/api/chat` route limiting 20 requests per hour.
- `src/middleware.ts`: Hooked authentication protection scope for `/chat` and its relative APIs.
- `src/app/(dashboard)/layout.tsx`: Registered `Chat` link to the platform's bottom toolbar layout element.
- `.env.local` / `.env.example`: Reconciled to feature `GEMINI_API_KEY` configurations alongside default variables.
- `package.json`: Pulled dependencies to establish the `@google/generative-ai` SDK context alongside the existing codebase.

## Privacy Guarantees
- **Zero Message Logging**: Your message payloads, inputs, queries, and conversations are fundamentally transient and simply streamed through locally. Content is *neither* logged within Supabase tables *nor* stored locally. 
- **PII Stripping First**: Prior to touching the AI API interfaces, user inputs run entirely through robust edge logic evaluating Regex matrices capable of locally snipping and obfuscating phone numbers, email strings, name references, standard locations, Indian Aadhaar structures, dates, and URL hyperlinks into redacted strings (`[phone removed]`, `[ID removed]`).
- **Telemetry Disconnected**: Feedback telemetry logs only user identifiers (`chat_feedback` / `chat_abuse_log`), an ephemeral Session Guid, categorical reasons (if crisis-triggered), or thumbs-up/down binaries without exposing strings inside.
- **Client-Side Lifespan**: Re-initializing the view regenerates the ID session securely, dropping previous state references immediately.

# Module 4: Settings, Privacy, Notifications & PWA

## Files Created
- `supabase/migrations/004_settings_notifications.sql` (Tables mapping user preferences, push subscriptions, logging history, and strict data export/account deletion request tracking)
- `src/lib/validations/settings.ts` (Zod parameter schemas for user profiles and notification toggles)
- `src/lib/notifications/sender.ts` (Resend and Web Push logic for automated messages)
- `src/lib/notifications/scheduler.ts` (Server-side cron worker mapping user timezones and predicting upcoming windows to dispatch secure reports safely)
- `src/lib/privacy/data-export.ts` (Secure JSON aggregation logic for total compliance and data portability standards)
- `src/lib/privacy/account-deletion.ts` (Deep teardown worker tracking pending removals and triggering full table sweeps)
- `src/hooks/usePushNotifications.ts` / `useInstallPrompt.ts` (React hooks to trigger Notification bindings seamlessly and interface PWA standalone installations)
- `src/components/pwa/InstallBanner.tsx` (Top banner alerting users to add the app to their homepage UI natively)
- `src/app/(dashboard)/profile/page.tsx` (Complete master settings hub managing constraints cleanly)
- `src/types/settings.ts` (Data typings)
- `public/manifest.json` / `public/icons/README.md` (PWA registry payload instructions and references)

## API Routes Created
- `GET/PATCH /api/settings` and `GET/PATCH /api/profile`
- `GET /api/privacy/summary`
- `POST /api/privacy/export` and `DELETE /api/privacy/account` 
- `POST /api/notifications/subscribe` / `DELETE /api/notifications/unsubscribe` / `POST /api/notifications/test`
- `GET /api/cron/daily` & `GET /api/cron/cancel-deletion`

## Files Modified
- `src/lib/email/templates.ts`: Added 5 new inline-CSS templated emails covering account teardowns, analytics exports, period reminders, and fertile tracking.
- `src/proxy.ts` / `middleware.ts`: Expanded safe route scope allowing the secure CRON runner and shielding `/profile`.
- `next.config.ts`: Instantiated `next-pwa` caching Service Worker capabilities parsing dynamic routes via network-first fallback matrices.
- `src/app/(dashboard)/layout.tsx`: Registered `InstallBanner` horizontally.

## Privacy Guarantees
- **Total Local Deletions**: Account deletion completely sweeps tables containing logs spanning `onboarding_data`, `push_subscriptions`, `chat_feedback`, and storage buckets cleanly without orphaned telemetry left over.
- **Export Integrity**: Export ZIP files intentionally exclude push endpoint credentials securely and only wrap localized database content.
- **Service Worker Constraints**: The PWA config caches framework components effectively, mitigating server payloads, but requires Network-First fetching over active API paths (`/api/dashboard/summary`) preventing outdated medical tracking data from desyncing visually.

# Module 5: Admin Dashboard, Monitoring, & System Integrity

## Components & Infrastructure Created
- `supabase/migrations/005_admin.sql` (Feature Flag schema, User Suspensions, Immutable Action Audit Tables)
- `@sentry/nextjs` Integration (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) (Health-data-safe error monitoring)
- `src/app/(admin)/admin/*` (7 dynamic routes generating the admin GUI for total system management natively)
- `src/components/admin/charts/*` (Custom generated D3-less pure SVG charts)
- `src/lib/feature-flags/index.ts` (Dynamic Node-bound feature gating systems mapping caching)
- `src/lib/admin/audit-logger.ts` (Immutable system logger trapping state revisions into SQL mapping logic exclusively)
- `src/app/maintenance/page.tsx` (Fallback maintenance intercept page triggering dynamically off flags)
- Global Error Boundaries (`src/app/error.tsx` & `src/app/global-error.tsx`) natively wrapping runtime faults gracefully.
- `src/app/api/admin/*` (12 fully integrated routes executing deep analytical fetches securely without risking PII matrices)

## Privacy Guarantees
- **Error Safe Monitoring (BeforeSend Filter)**: The `Sentry` intercept filters requests locally checking headers iteratively. `event.user.email` nodes, `event.request.headers` credentials, `event.request.data` POST bodies, and `/api/auth/*` execution paths are brutally purged preserving anonymity and HIPAA compliance strictly before traversing internet domains.
- **Admin Zero Permissions Leakage**: Modifying tokens manually within the browser (`DOM modification`) yields 403 blocks because each route explicitly re-queries PostgreSQL validating `profile.role` logic ensuring tokens verify truthfully.
- **Analytics Anonymity**: Stats are fetched executing strictly `COUNT()` queries or `GROUP BY DATE()`. Absolute zero individual arrays or profiles mapping datasets leak onto admin analytical matrices externally.
- **Suspension Obfuscation**: Suspended users traversing API logic yield vague, generalized JSON exceptions.

> "Project fully launched successfully mapping all 5 modules natively matching expected constraints."
