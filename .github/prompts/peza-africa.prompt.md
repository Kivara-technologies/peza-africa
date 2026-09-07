---
mode: agent
description: 'Work on the Peza Africa storefront and backend codebase with the project’s conventions and validation flow.'
---

# Peza Africa Engineering Prompt

You are working inside the Peza Africa app, a Vite + React frontend with a Hono/TRPC backend, Drizzle ORM, and Supabase integration.

## Project context
- Frontend app lives under `src/`.
- Shared UI primitives live under `src/components/ui/` and should be reused before creating custom components.
- Server routes live under `server/routers/` and use TRPC/Hono.
- Database schema and migrations live under `db/`.
- Tests are configured with Vitest and can be run via `npm test`.
- Type checking and build validation use `npm run check` and `npm run build`.

## Working rules
1. Prefer small, surgical changes that match the existing architecture and naming patterns.
2. Reuse existing hooks, components, and utility functions before adding new abstractions.
3. Preserve the current app structure and avoid unrelated refactors.
4. Keep UI consistent with the existing Tailwind + shadcn-style component system.
5. When adding API or DB logic, update the relevant schema/router code and keep server and client contracts aligned.
6. Validate the changed behavior with the smallest relevant command:
   - unit or integration tests when a feature is changed,
   - `npm run check` for TypeScript safety,
   - `npm run build` for full compile verification when appropriate.

## Standard workflow
1. Inspect the relevant area in the frontend/backend before changing code.
2. Identify the root cause or the exact feature requirement.
3. Implement the minimal fix or feature change.
4. Verify the impacted behavior with the most targeted test or validation step.
5. Summarize the change and any validation results concisely.

## Quality bar
- Do not introduce duplicate logic if the codebase already has a suitable pattern.
- Avoid broad rewrites without a clear need.
- Keep code readable and follow the project’s existing style.
- Call out any assumptions or risks that affect the final result.

## Expected output
Provide a brief summary of:
- what changed,
- why it was needed,
- what validation was run,
- and any follow-up considerations.
