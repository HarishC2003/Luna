# Changelog

## Module 2: Core Cycle Tracking & Insights

**Database Migrations:**
* `supabase/migrations/002_cycle_tracker.sql`
  Creates tables and RLS policies for `onboarding_data`, `cycle_logs`, `daily_logs`, and `cycle_predictions`.

**Validation & Typings:**
* `src/lib/validations/cycle.ts`
  Zod schemas ensuring all health and logging data inputs are stringently limited, preventing bounds out-of-range dates and lengthy texts.
* `src/types/cycle.ts`
  TypeScript types modeling the database schema entities and logical data types for predictions, insights, symptoms, and mood.

**Core Server Libraries (Algorithms):**
* `src/lib/cycle/predictor.ts`
  Pure mathematical engine calculating phase cycles dynamically with variable length bounds and confidence weighting.
* `src/lib/cycle/insights.ts`
  Generates intelligent, deterministic metrics and alerts (streak counting, anomaly detection in variances, and phase breakdowns).

**API Routing (The API layer):**
* `src/app/api/onboarding/route.ts` - Setup user telemetry and preferences.
* `src/app/api/cycles/log/route.ts` - Creates a new menstrual period entry and triggers prediction engine recalculation.
* `src/app/api/cycles/log/[id]/route.ts` - Secure PATCH endpoint for editing cycle logs.
* `src/app/api/cycles/route.ts` - Queries user's history of cycles.
* `src/app/api/daily-log/route.ts` - Logs flow, symptoms, and energy in a singular daily snapshot.
* `src/app/api/predictions/route.ts` - Retrieves latest computed tracking data for active cycle.
* `src/app/api/insights/route.ts` - Processes all generated predictions in combination with insights list generation.
* `src/app/api/dashboard/summary/route.ts` - Optimized Promise.all multi-fetcher for the UI Dashboard aggregation.

**Client UI Features (Pages & App Router):**
* `src/app/(dashboard)/layout.tsx` - Rewritten to include fixed bottom mobile navigation bar mapping exactly to routes.
* `src/app/(dashboard)/dashboard/page.tsx` - Dynamic, animated calendar overview using Summary fetching, loading skeletons, and interactive action buttons.
* `src/app/(dashboard)/onboarding/page.tsx` - Four-part client state progression flow wizard initializing settings.
* `src/app/(dashboard)/cycles/page.tsx` - Detailed history of mapped cycles with metrics calculated at the header strip.
* `src/app/(dashboard)/history/page.tsx` - 30-day chronological listing of daily journal events and symptoms.

**Component Architecture:**
* `src/components/cycle/CalendarGrid.tsx` - Monthly layout grid showing phases securely.
* `src/components/cycle/DayDrawer.tsx` - Pull-out timeline slide with specific day inspection logs.
* `src/components/cycle/PhaseStatusCard.tsx` - Visual dynamic card conveying cycle status prominently.
* `src/components/cycle/InsightCard.tsx` - Interactive suggestion boxes tailored to patterns.
* `src/components/cycle/CycleLogModal.tsx` & `DailyLogModal.tsx` - Pop up interfaces handling validation and entry workflows elegantly. 
* `src/components/cycle/FlowBadge.tsx`, `MoodBar.tsx`, & `SymptomChips.tsx` - Aesthetic visual blocks matching brand colors.
