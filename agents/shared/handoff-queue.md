# Handoff Queue
> Managed by Claude. Both agents check this before starting work.

| ID | Task | From | To | Status | Prompt File |
|----|------|------|----|--------|-------------|
| DASH-001 | Full dashboard redesign - dark studio aesthetic + Framer Motion | Claude | Codex | DONE | `agents/prompts-for-codex/dashboard-redesign.md` |

---

## Status Key
- `PENDING` - Claude has written the prompt, waiting for Codex to pick up
- `IN PROGRESS` - Codex is actively building
- `DONE` - Codex finished, Claude needs to review/integrate
- `INTEGRATED` - Claude has wired it into the backend
- `BLOCKED` - Needs discussion before proceeding
