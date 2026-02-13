# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Design Principles

**KISS (Keep It Simple, Stupid)**: Prioritize simplicity in all solutions. Avoid unnecessary complexity, over-engineering, or convoluted abstractions. Choose the most straightforward implementation that solves the problem at hand.

**CLEAN Code**: Write readable, self-documenting code with meaningful naming conventions. Organize code logically with clear separation of concerns. Ensure functions and modules have single responsibilities and are easy to understand and modify.

**DRY (Don't Repeat Yourself)**: Identify and eliminate code duplication through proper abstraction, reusable components, and shared utilities. Create maintainable patterns that prevent redundancy without introducing premature abstraction.

**YAGNI (You Aren't Gonna Need It)**: Implement only what is currently required. Avoid speculative features, unused abstractions, or "future-proofing" that adds complexity without immediate value. Let requirements drive implementation.

## Build Commands

```bash
# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Lint and auto-fix with Biome
pnpm lint
```

## Code Style (Biome Configuration)

**Formatting** (`biome.jsonc`):
- Indent: Tabs (width 2)
- Line width: 100 characters
- Line ending: LF
- Quotes: Double (JSX and JS)
- Semicolons: As needed (omit when possible)
- Trailing commas: All (JS), None (JSON)
- Arrow parentheses: Always
- Bracket spacing: Enabled

**Linting**:
- Strict TypeScript: `noExplicitAny: error`
- Console warnings: `noConsole: warn`
- Accessibility: All rules set to warn
- Sorted classes: Warn on Tailwind class ordering

## TypeScript Conventions

**Types vs Interfaces**:
- Use `interface` for object shapes that may be extended
- Use `type` for unions, mapped types, and complex transformations

**Constants**:
- Use `as const` instead of enums
- Example: `export const BLOCK_CATEGORIES = ["anchor", "sequence", "flexible"] as const`

**Imports**:
- Use `@/` path alias for src directory
- Group imports: React/Next → External libs → Internal (@/) → Relative
- Use `type` keyword for type-only imports

**Naming**:
- Components: PascalCase (`BlockCard`)
- Functions/variables: camelCase (`getBlocksForDay`)
- Constants: UPPER_SNAKE_CASE for true constants
- Files: kebab-case for utilities, PascalCase for components

**Error Handling**:
- Return `{ error }` objects for expected failures
- Throw only for unexpected/unrecoverable errors
- Use early returns to reduce nesting

## Component Patterns

**Server vs Client**:
- Default to Server Components (no directive needed)
- Add `"use client"` for: state, effects, browser APIs, event handlers
- Keep client components as small as possible

**Props**:
- Use interfaces for component props
- Destructure in function parameters
- Use `ReactNode` for children slots

**Exports**:
- Prefer named exports over default exports
- One component per file (co-locate helpers if small)

## Critical Patterns

**Database Singleton**: The RoutineDb uses a globalThis singleton pattern in [`src/lib/db/index.ts`](src/lib/db/index.ts:20). Always use `getDb()` to access the database; never instantiate `RoutineDb` directly.

**Anchor-Based Scheduling**: Block timing cascades from anchor blocks. [`calculateEntryTimes()`](src/lib/utils/blocks.ts:24) assigns times by: (1) using anchor block's `anchorTime`, (2) adding that block's duration to get next time, (3) defaulting to 06:00 if no prior anchor. Anchor blocks have `isAnchor: true` and `cutPriority: 99`.

**Day Filtering**: Blocks appear only on specified `daysOfWeek` (0=Sunday, 6=Saturday). [`getBlocksForDay()`](src/lib/utils/blocks.ts:4) filters and sorts by `order`. The day's view is created in a single transaction in [`getOrCreateDayView()`](src/lib/db/queries.ts:34).

**Active Entry Exclusivity**: Only one entry can be "active" per day. [`mutateEntryStatus()`](src/lib/db/queries.ts:102) automatically sets other active entries to "pending" when activating a new one.

**Timer Persistence**: When a timer starts, `startedAt` is stored in the database. The [`Timer`](src/components/routine/timer.tsx:12) component recalculates remaining time on mount using `getInitialRemaining()`, allowing page reloads without losing timer state.

**PWA Install Prompt**: The `beforeinstallprompt` event is captured in [`HomeClient`](src/components/routine/home-client.tsx:77) and stored in state. The prompt must be triggered by user action via `installPrompt.prompt()`.

**Date Keys**: All date operations use `YYYY-MM-DD` format from [`getDateKey()`](src/lib/utils/dates.ts:1). The UI refreshes every 30 seconds to detect day changes.

**Language**: UI text is Portuguese (pt-BR). Maintain consistency; do not translate unless explicitly requested.

## Stack

- Next.js 16+ with App Router
- React 19
- TypeScript 5 (strict)
- Tailwind CSS v4 + DaisyUI v5
- Dexie (IndexedDB wrapper)
- Motion (animation library)
- Biome (linting/formatting)
- pnpm (package manager)