# Codex Prompt — [Feature Name]
**From:** Claude  
**Date:** YYYY-MM-DD  
**Priority:** HIGH / NORMAL  
**Status:** PENDING → mark DONE in handoff-queue.md when complete

---

## Context
What this feature is and why it exists. Where it fits in the product.

## What to Build
Precise description of the component/page/flow.

## Design Direction
Aesthetic, tone, layout approach. NOT generic — specific.

## Files to Create / Modify
- `src/components/...`
- `src/app/...`

## API / Data
Endpoints Claude has built (or will build). Exact shapes:
```ts
// example
type User = { id: string; name: string; }
GET /api/users → User[]
```

## Do NOT
- Things Codex should avoid or leave for Claude

## When Done
- Update `agents/shared/handoff-queue.md` status to DONE
- Log what you built in `agents/codex/log.md`
- Note any backend needs discovered during build
