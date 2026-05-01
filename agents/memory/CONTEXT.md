# Project Context (RAG / Session Restore)
> Paste this into any new Claude or Codex session to instantly restore full context.
> Both agents update this when anything significant changes.

---

## Project
Name: buildingapipelineforcodexxclaude
Path: C:\Users\HomePC\Downloads\buildingapipelineforcodexxclaude
Started: 2026-04-14
Owner: David

## What this project is
A coordination system for running Claude (lead agent) and Codex CLI (frontend agent) together in the same Windows Terminal session. Claude handles backend, research, architecture, and writes prompts for Codex. Codex handles frontend and UI.

## Stack
- Claude Code (Sonnet 4.6) — lead agent
- OpenAI Codex CLI (v0.120.0, gpt-5.4-mini) — frontend agent
- Windows Terminal with split panes
- PowerShell scripts for coordination
- File-based message passing via agents/ directory

## Key files
- `AGENTS.md` — master coordination doc, both agents read at session start
- `agents/claude/status.md` — what Claude is doing
- `agents/codex/status.md` — what Codex is doing + startup instructions
- `agents/shared/handoff-queue.md` — task queue between agents
- `agents/shared/decisions.md` — API contracts and stack decisions
- `agents/prompts-for-codex/` — Claude writes prompts here for Codex
- `agents/memory/BRIEFING.md` — plain English status for David
- `agents/memory/PROMPTS.md` — prompt library
- `C:\Users\HomePC\scripts\start-agents.ps1` — global launcher (works in any project)
- `C:\Users\HomePC\agent-memory\` — Obsidian vault indexing all projects

## How agents communicate
1. Claude writes prompt to `agents/prompts-for-codex/[feature].md`
2. Codex reads it with `@agents/prompts-for-codex/feature.md` syntax
3. Codex logs work to `agents/codex/log.md`
4. Claude reads and integrates

## Current status
Pipeline built and operational. No active project tasks yet.
