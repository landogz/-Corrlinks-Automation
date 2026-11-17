#!/usr/bin/env bash
# Inject loop-engineering context at the start of every Agent session.
set -euo pipefail
cat <<'EOF'
{
  "additional_context": "Loop engineering is always on in this repo. Never self-verify done — use the mechanical gate (`node .cursor/hooks/loop-gate.js` = syntax check + npm run smoke:subject). The Cursor stop hook re-prompts when the gate is red (ceiling: loop_limit 8). Skill: .cursor/skills/loop-engineering/SKILL.md. Rule: .cursor/rules/loop-engineering.mdc."
}
EOF
