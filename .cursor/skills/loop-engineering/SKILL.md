---
name: loop-engineering
description: >-
  Use on every coding task in this repo — and whenever the user wants a
  self-running agent loop until a goal is met. Loop engineering: honesty test,
  Automatic+Closed architecture, mechanical verification gate (never AI
  self-verify), turn/budget ceiling. Triggers on loop, loop engineering, auto
  mode, run until tests pass, self-running / autonomous agent, CreateGoal,
  stop hook, ralph wiggum, fix until green, keep working until done.
---

# Loop Engineering (Inside Scores / Cursor)

Build the system that prompts the agent **for** the user, instead of the user prompting every 15 minutes.

Adapted from [selmakcby/loop-engineering](https://github.com/selmakcby/loop-engineering) for **Cursor** in this repository.

## The one rule that makes a loop trustworthy

**Never let the AI verify its own "done."** Maker and checker must be different things. When the same model writes the code and judges whether it's finished, it will happily believe its own "done" — half-built code, placeholders, a non-compiling repo. That is *false completeness*. The gate must be mechanical (a real test/build/lint/smoke) or, when the output genuinely isn't testable, a **separate** LLM-judge with an explicit rubric.

This project wires a mechanical gate at:

- Script: `.cursor/hooks/loop-gate.js`
- Cursor `stop` hook in `.cursor/hooks.json` (follow-up until green, with a ceiling)
- Always-on rule: `.cursor/rules/loop-engineering.mdc`

## Step 1 — Honesty test (BEFORE building a long loop)

A loop is not worth it for every task. Check all four. If any is "no," say so and use a plain prompt.

1. **Repetitive?** One-shot → a good prompt beats a loop.
2. **Verification automatable?** Is there a test / build / lint / smoke that returns hard pass/fail?
3. **Budget?** Closed loops are cheap when built right, not free.
4. **Tools?** Can the agent run the check, read logs, and edit files here?

## Step 2 — Two axes (keep separate)

**Axis A — who closes the loop?**

- *Manual:* you review each stop.
- *Automatic:* a checker asks "done?" and continues if not.

**Axis B — is there a gate?**

- *Open:* no boundary (expensive, drift-prone).
- *Closed:* clear goal + control gate + hard stop.

**Loop engineering = Automatic + Closed.**

## Step 3 — Cursor primitives (don't confuse them)

| Primitive | Role in Cursor |
| --- | --- |
| **CreateGoal** | Long-running goal — only when the user explicitly asks for a goal/loop until done |
| **`/loop` skill** | Re-run a prompt on an interval in the same session (open-session ticker) |
| **`stop` hook** | Mechanical gate: on agent stop, run real checks; emit `followup_message` if red |
| **Always-apply rule** | Principles injected on every prompt in this repo |

Prefer **CreateGoal + stop gate** for "run until X." Prefer **`/loop`** only for interval wake-ups, not as a substitute for a real test gate.

## Step 4 — Gate for this repo

### 4a — Testable (default)

Mechanical gate command:

```bash
node .cursor/hooks/loop-gate.js
```

Default checks (no SportsData network required):

1. `node --check` on key `main/` + `renderer/` entry files
2. `npm run smoke:subject` (America/New_York subject math)

Optional heavier gates (ask before enabling in a loop):

- `npm run smoke:exchange` / `smoke:sportsdata` (needs `.env`)
- `npm run test:viewports` (Playwright)
- `npm run dist` (full packaging — expensive)

### 4b — Non-testable work

Use a separate judge + explicit rubric. Never let the maker self-approve taste.

## Step 5 — Always add a ceiling

Without a maximum, the loop spins forever. This repo's `stop` hook uses `loop_limit` in `.cursor/hooks.json`. When using CreateGoal or `/loop`, set a turn/budget ceiling up front.

## Step 6 — Model routing (cost)

- **Maker:** strong model for edits.
- **Verification:** the Stop-hook script is **zero tokens** — prefer it over asking the model "are we done?"

## Step 7 — Wire the closed loop (four parts)

1. **Goal** — concrete and testable ("subject smoke passes"; "viewport shell test green").
2. **Maker** — this agent on a strong model.
3. **Gate** — `.cursor/hooks/loop-gate.js` via the `stop` hook.
4. **Bound** — CreateGoal / explicit "loop until green" + `loop_limit`.

## Step 8 — Prove it loops

1. Temporarily break something the gate covers (e.g. subject window math).
2. Ask to fix until the gate is green and take hands off.
3. Confirm the stop hook follow-up repairs it without self-declared "done."

## How to run this skill on every prompt

Already enforced by `.cursor/rules/loop-engineering.mdc` (`alwaysApply: true`):

- Do not claim done without a mechanical check when code changed.
- Prefer the project gate over self-assessment.
- For explicit "keep going until…" goals, use CreateGoal only when the user asked, and rely on the stop hook ceiling.

Ask for missing pieces — the goal, which smoke/test, the ceiling — rather than guessing. Never substitute the agent's self-assessment for a real check.
