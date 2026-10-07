# Evaluation and cache contract

## Quality judgment

Evaluate eligible skill entries, not each supporting Markdown file. Apply the
same checklist regardless of origin: actionable steps, trigger/scope fit, unique
value, technical currency and observed usage or its absence of evidence. Compare
relevant skills, MEMORY.md and AGENTS.md without broad preloading. Verify changing
API/tool claims against current primary documentation before calling them outdated.

Verdicts are Keep, Improve, Update, Retire, or Merge into a named target. Each
reason must be self-contained: capability retained, concrete defect/change,
evidence and dependency impact. For Retire, name what covers the same need and
what unique content remains. For Merge, identify the target and content to preserve.
For Keep, state why the capability remains useful; “unchanged” alone is insufficient.
Do not use a numeric score or zero observations as a deletion rule.

When delegation is authorized, use bounded batches (about 20 entries) with separate
ownership. Otherwise evaluate directly. Preserve the configured model. Save
intermediate batch progress and resume unevaluated entries in the same scope.
Present a compact table: skill, observed reads/unknown, verdict, concrete reason.
Propose changes with evidence; archive/delete require explicit user authorization.

## Inputs and discovery limits

- `SKILL_STOCKTAKE_GLOBAL_DIR`, `SKILL_STOCKTAKE_PROJECT_DIR`: selected roots.
- `SKILL_STOCKTAKE_OBSERVATIONS`: JSONL Read observations with an absolute `path`
  and timezone-aware ISO `timestamp`; defaults to Claude observations. Counts only
  establish reads in this file. They never establish complete coverage or invocation
  frequency. An empty valid file means zero reads in that file, not an unused skill.
- `SKILL_STOCKTAKE_ALLOWED_ROOTS`: optional JSON array of additional explicitly
  trusted roots for linked targets. It permits traversal to aliases; it does not
  automatically scan those roots independently. Links outside are reported/skipped.
- `SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE`: ISO date; comparison uses UTC filesystem
  birth date. Unknown/invalid birth dates are excluded when the filter is enabled.
  References inherit the nearest owning SKILL.md exclusion. No body hash is read
  for excluded entries. On systems without birth time, age remains unknown.

`scan.sh [PROJECT_ROOT]` preserves `scan_summary` and `skills` array outputs,
adding `scope`, hashes, kind, realpath/aliases and explicit unknowns. Counts are
unique real paths per root; global and project may overlap. Scope includes lexical
and resolved roots, allowed roots and age filter. Markdown is inventoried, not
executed; unsupported metadata stays null. A bounded traversal stops with an error
if it exceeds 200,000 visited entries. No secret/config body is intentionally scanned;
choose skill directories, not a home directory or credential tree.

`quick-diff.sh CACHE [PROJECT_ROOT]` returns a JSON array. Statuses include new,
changed, removed, aliases_changed, rebaseline_required, excluded_recent,
excluded_age_unknown, unobserved and discovery_warnings. Missing previously found
roots produce scope_unavailable, not mass deletion. Scope mismatch and rebaseline
return exit 2; any nonzero exit is incomplete, not “unchanged”. Warnings/exclusions
also prevent interpreting the array as a complete clean audit.

## Saving and resuming

Only `save-results.sh CACHE.json` writes a cache. The target must be explicit,
non-symlink and have an existing parent. Keep a separate target for each scope.
Provide JSON on stdin with `skills` as an object keyed by stable identity, preferably
the inventory `realpath`. Retain each inventory row's path, realpath, aliases,
sha256 and eligibility alongside verdict/reason; otherwise quick diff must request
rebaseline. Nonempty evaluations must include the inventory `scope`; saved entry paths must
belong to those selected roots. Pass `scan_summary` as well to retain collection
state. A missing previously populated root is UNKNOWN, not mass deletion.

The input object contains `scope` copied from the scan, `skills` as a map of
observed rows extended with verdict/reason, optional `scan_summary`, `mode`, and
`batch_progress` (including `status` and `evaluated`). Never invent a row hash or
copy rows across scopes.

```bash
bash "$STOCKTAKE_SKILL_DIR/scripts/save-results.sh" "$STOCKTAKE_RESULTS" <<< "$EVAL_RESULTS"
```

The save validates JSON before changing the cache, obtains an adjacent advisory
`.lock`, re-reads under lock, merges disjoint skill keys and atomically replaces the
cache. The lock file intentionally remains. It sets actual UTC `evaluated_at`.
Same-key updates intentionally replace prior values; this is not automatic conflict
resolution for competing judgments. Non-cooperating external writers are not locked.

Legacy cache without scope is refused unless `SKILL_STOCKTAKE_REBASELINE=1` is
explicitly supplied for a freshly rebuilt full inventory. That mode replaces the
old evaluation map, so preserve a copy first if its judgments are needed. A
previously scoped cache from another scope remains refused even in this mode.
Do not use rebaseline during concurrent batch saves. Finish with
`batch_progress.status=completed` only after all intended entries were evaluated.
