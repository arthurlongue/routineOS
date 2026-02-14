# Draft: Analytics Dashboard / Task Feedback Overview

## Research Findings

### Current Data Model (confirmed)
- **BlockEntry** already tracks: `startedAt`, `completedAt`, `durationMin`, `status`, `notes`
- **notes** field stores JSON `CompletionCheckIn`: `{ mood: "up"|"down", timeWasCorrect, startedOnTime, endedOnTime }`
- **analyzeTaskFeedback** function exists — categorizes performance ("too-fast", "too-slow", "low satisfaction")
- **getProgress()** returns daily `ProgressSnapshot` (completed, skipped, total)
- All timing data is already captured — startedAt, completedAt, durationMin

### Current UI Patterns (confirmed)
- Pages: RSC wrapper → Client component pattern (e.g., `page.tsx` → `home-client.tsx`)
- Components live in `src/components/routine/`, kebab-case naming
- Client components suffix: `-client.tsx`
- DaisyUI v5 with `night` theme, mobile-first
- No charting library installed — only custom SVG progress + DaisyUI stats
- Navigation: no global nav bar — links in collapsible header
- Motion library for animations

### Entry Lifecycle (confirmed)
- Status flow: pending → active → completed | skipped
- Only one active entry per day (exclusivity)
- Duration auto-calculated on completion
- Feedback JSON stored in `notes` field on completion

## Requirements (confirmed)
- User wants to see task completion overview by: day, week, month, year
- User wants timing feedback: started on time? finished on time?
- User wants difficulty/ease feedback on tasks
- User wants quick feedback options (not just manual writing)

## Open Questions
- What visualizations matter? (charts, stats cards, lists?)
- Extend existing feedback model or add new fields?
- Difficulty tracking — what scale/options?
- Should this be a separate page (/dashboard)?
- What specific insights does the user want to act on?

## Scope Boundaries
- INCLUDE: TBD
- EXCLUDE: TBD

## Technical Decisions
- TBD
