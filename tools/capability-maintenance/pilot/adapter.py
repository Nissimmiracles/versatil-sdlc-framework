"""Local stocktake fixture adapter; no installation, service or universal routing."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import shutil
import sys


class Refused(ValueError):
    pass


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def invoke(manifest, context_id, action, cache=None, payload=None):
    if type(manifest.get('schema_version')) is not int or manifest.get('schema_version') != 1 or manifest.get('capability') != 'skill-stocktake-local-pilot':
        raise Refused('unsupported capability/version')
    if action not in ('scan', 'diff', 'save'):
        raise Refused('unsupported operation')
    if context_id not in manifest['contexts']:
        raise Refused('undeclared synthetic context')
    backend = Path(manifest['backend']['directory'])
    required = {'stocktake.py', 'scan.sh', 'quick-diff.sh', 'save-results.sh'}
    if set(manifest['backend']['sha256']) != required:
        raise Refused('incomplete backend closure')
    for name, expected in manifest['backend']['sha256'].items():
        path = backend/name
        if not path.is_file() or path.is_symlink():
            raise Refused('backend missing or aliased')
        if digest(path) != expected:
            raise Refused('backend hash drift')
    runtime = manifest['runtime']
    python = Path(runtime['python'])
    if str(Path(sys.executable).resolve()) != str(python) or digest(python) != runtime['sha256']:
        raise Refused('runtime identity drift')
    if list(sys.version_info[:3]) != runtime['version']:
        raise Refused('runtime version mismatch')
    context = manifest['contexts'][context_id]
    fixture_root = Path(manifest['fixture_root']).resolve(strict=True)
    for key in ('global_root', 'project_root', 'observations'):
        path = Path(context[key]).resolve(strict=True)
        if not path.is_relative_to(fixture_root):
            raise Refused('context outside synthetic fixture')
    wrappers = {'scan': 'scan.sh', 'diff': 'quick-diff.sh', 'save': 'save-results.sh'}
    argv = ['/bin/bash', str(backend/wrappers[action])]
    if action != 'scan':
        if cache is None:
            raise Refused('explicit cache required')
        target = Path(cache)
        if target.is_symlink() or not target.parent.resolve(strict=True).is_relative_to(Path(manifest['cache_root']).resolve(strict=True)):
            raise Refused('cache outside pilot')
        argv.append(str(target))
    if action in ('scan', 'diff'):
        argv.append(context['project_root'])
    env = {'PATH': str(python.parent)+':/usr/bin:/bin',
           'PYTHONDONTWRITEBYTECODE': '1',
           'SKILL_STOCKTAKE_GLOBAL_DIR': context['global_root'],
           'SKILL_STOCKTAKE_PROJECT_DIR': context['project_root'],
           'SKILL_STOCKTAKE_OBSERVATIONS': context['observations'],
           'SKILL_STOCKTAKE_ALLOWED_ROOTS': '[]'}
    resolved_python = shutil.which('python3', path=env['PATH'])
    if not resolved_python or Path(resolved_python).resolve() != python:
        raise Refused('wrapper Python resolution drift')
    if digest('/bin/bash') != manifest['transport']['bash_sha256']:
        raise Refused('wrapper shell identity drift')
    result = subprocess.run(argv, input=json.dumps(payload) if payload is not None else None,
                            text=True, capture_output=True, cwd=fixture_root,
                            env=env, timeout=10, check=False)
    return {'argv': argv, 'context': context_id, 'action': action,
            'rc': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr,
            'data': json.loads(result.stdout) if result.stdout.strip() else None}
