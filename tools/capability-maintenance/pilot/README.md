# Local capability pilot

Generate an explicit manifest and two temporary repository fixtures for four
synthetic Codex/Claude directory contexts. This exercises the actual stocktake
Bash/Python transport; it does not start either native agent host or an MCP server.
The manifest records backend/runtime hashes, input roots, output/effect categories
and scope. It is local metadata, not signed authorization or a hostile-code sandbox.

From the capability-maintenance directory, use a new output directory:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 pilot/pilot_driver.py \
  --backend scripts --output /tmp/stocktake-pilot-new
```

An existing output directory is refused. The driver creates fixtures, cache/lock
files, an isolated changed-backend fixture and raw receipts only in that directory.
The nine checks are one ordered journey: baseline, retained-mtime change and scope
refusal, followed by pre-launch manifest/backend/runtime negatives.
No downloaded dependencies, installation, model call or automatic patch application.

Maestro can execute this driver and the backend suite under a separately accepted,
hash-bound local repository-stage contract. The installed runtime, proof authority,
inputs, exact deadline and one-attempt boundary must be selected explicitly;
this package does not install or select a Maestro runtime automatically.
