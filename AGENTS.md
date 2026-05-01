# AGENT COORDINATION HUB
> Both agents MUST read this file at the start of every session.

---

## Who We Are

### CLAUDE — Lead Agent (Backend + Direction)
- Role: Research, architecture, ideation, API/backend code, database design, auth, infrastructure
- Also: Writes all prompts for Codex. Acts as the technical director.
- Status file: `agents/claude/status.md`
- Work log: `agents/claude/log.md`

### CODEX — Frontend Agent (UI + Mockups)
- Role: Frontend components, UI/UX implementation, mockups, styling, animations
- Receives: Detailed prompts written by Claude in `agents/prompts-for-codex/`
- Status file: `agents/codex/status.md`
- Work log: `agents/codex/log.md`

---

## Current Project
> Updated by Claude when a new project starts.

**Project:** (none yet — awaiting first task from user)
**Stack:** TBD
**Status:** IDLE

---

## Agent Awareness Protocol

Before starting ANY work, both agents must:
1. Read this file (`AGENTS.md`)
2. Read the other agent's `status.md`
3. Read `agents/shared/decisions.md` for API contracts and data models
4. Check `agents/shared/handoff-queue.md` for pending tasks

---

## Communication Rules

- **Claude → Codex:** Claude writes a prompt file in `agents/prompts-for-codex/[feature-name].md`
  - Prompt includes: what to build, API endpoints to connect to, data shapes, design direction
  - Claude marks it READY in `agents/shared/handoff-queue.md`
  
- **Codex → Claude:** Codex writes to `agents/codex/log.md` what it built + any backend needs
  - Codex marks work DONE in `agents/shared/handoff-queue.md`

- **Shared decisions** (API contracts, data models, auth strategy): go in `agents/shared/decisions.md`
  - Neither agent changes these without noting it

---

## Handoff Queue
> See `agents/shared/handoff-queue.md`
