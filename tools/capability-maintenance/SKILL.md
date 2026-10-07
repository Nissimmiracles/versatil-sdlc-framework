---
name: skill-stocktake
description: Audit selected Codex or Claude skill directories for quality using a scoped inventory and content changes.
---

# Skill stocktake

Select explicit global and project roots before calling the installed scripts.
Use `.agents/skills` for Codex shared, `.codex/skills` for Codex local, or
`.claude/skills` for Claude. Run both Codex scopes separately for a directory
inventory; plugin caches and remote account skills are not automatically covered.

```bash
# Resolve this directory from the loaded SKILL.md location.
STOCKTAKE_SKILL_DIR="$HOME/.agents/skills/skill-stocktake"
export SKILL_STOCKTAKE_GLOBAL_DIR="$HOME/.agents/skills"
export SKILL_STOCKTAKE_PROJECT_DIR="$PWD/.agents/skills"
STOCKTAKE_RESULTS="$STOCKTAKE_SKILL_DIR/results-codex-shared.json"
bash "$STOCKTAKE_SKILL_DIR/scripts/scan.sh"
# Existing, scoped evaluation cache:
bash "$STOCKTAKE_SKILL_DIR/scripts/quick-diff.sh" "$STOCKTAKE_RESULTS"
```

State the selected roots and their observed existence. Inventory and diff are
read-only. The Bash entrypoints use the sibling Python 3 standard-library backend
(on macOS/Linux); no dependency installation is required. Legacy Claude defaults
remain for CLI compatibility, so set both roots for a Codex audit.

The inventory separates skills/references, realpath aliases, hashes and filesystem
creation dates. Reads are not invocations. Missing/malformed observation data and
unavailable creation dates remain unknown. Multiline or unsupported YAML metadata
remains unknown; do not treat a YAML marker as a description. No count alone is a
quality or retirement decision.

For an age-limited audit, set `SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE=YYYY-MM-DD`
**before scanning**. Newer and unknown-age skills, including their references,
are excluded before body reads. No mtime-as-creation substitution. Symlinks are
followed only inside the selected roots or explicit allowed roots; cycles and
inaccessible/out-of-scope paths are reported, not silently counted as covered.

Quick diff uses hashes, reports removals and aliases, and ignores a mere touch.
Only `[]` with exit 0 and the same scope supports “no content changes”. A legacy
cache without scope/hashes requires a fresh baseline; a different scope is refused.

Use the [evaluation and cache contract](references/evaluation.md) when judging
quality, saving/resuming an audit, or configuring observation/alias roots. Keep,
Improve, Update, Retire and Merge remain evidence-based proposals. Never delete,
merge or rewrite a skill merely because a scan suggests it; preserve existing
human authorization boundaries and concurrent work.
