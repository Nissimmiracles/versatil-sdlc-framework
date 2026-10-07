# Scoped skill stocktake

Small Python 3 standard-library inventory, content diff and evaluation-cache tools
for explicit local skill directories. Bash entrypoints retain the existing command
names. Intended for macOS/Linux; no service, model, network or package install.

- `bash scripts/scan.sh [PROJECT_ROOT]`: read-only inventory JSON.
- `bash scripts/quick-diff.sh CACHE.json [PROJECT_ROOT]`: read-only content diff JSON.
- `bash scripts/save-results.sh CACHE.json`: validate/merge JSON stdin into one cache.

Set `SKILL_STOCKTAKE_GLOBAL_DIR` and `SKILL_STOCKTAKE_PROJECT_DIR` explicitly.
Optional inputs and output semantics are in [the contract](references/evaluation.md).
An age cutoff excludes recent and unknown-age skill bodies before reading them.
A hashless or unscoped legacy cache requires rebaseline; missing telemetry remains
unknown. No automatic quality or retirement decisions are made.

Run the fixture suite after placing `tests/` next to `scripts/`:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v
```

For a staged layout, set `STOCKTAKE_TEST_SCRIPTS` to the absolute candidate scripts
directory. Tests use temporary synthetic roots, not installed skills. Save tests
write only explicit temporary caches/adjacent locks. Production adoption should
preserve existing cache copies before any explicit full rebaseline.

The [local capability pilot](pilot/README.md) binds the same backend to an explicit
manifest for two synthetic repositories and four directory contexts. Maestro may
execute its tests under a separately accepted local contract. This module does
not provide a universal skill executor, activate MCP, or alter installed skills.
It is independent of the repository's TypeScript framework and package hooks.
