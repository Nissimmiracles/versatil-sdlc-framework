#!/usr/bin/env python3
"""Read-only scoped inventory/diff; explicit cache-only locked save. Standard library."""
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile

UTC = dt.timezone.utc


def stamp(value=None):
    return dt.datetime.fromtimestamp(value, UTC).strftime('%Y-%m-%dT%H:%M:%SZ') if value is not None else dt.datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ')


def absolute(value):
    return Path(os.path.abspath(os.path.expanduser(value)))


def context(project=None):
    roots = [absolute(os.environ.get('SKILL_STOCKTAKE_GLOBAL_DIR', '~/.claude/skills')),
             absolute(os.environ.get('SKILL_STOCKTAKE_PROJECT_DIR', project or str(Path.cwd()/'.claude/skills')))]
    extra = json.loads(os.environ.get('SKILL_STOCKTAKE_ALLOWED_ROOTS', '[]'))
    if not isinstance(extra, list) or not all(isinstance(x, str) and x for x in extra):
        raise ValueError('allowed roots must be a JSON list of paths')
    allowed = sorted({str(p.resolve()) for p in roots + [absolute(x) for x in extra]})
    cutoff = os.environ.get('SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE') or None
    if cutoff:
        dt.date.fromisoformat(cutoff)
    scope = {'roots': [str(p) for p in roots], 'resolved_roots': [str(p.resolve()) for p in roots],
             'allowed_roots': allowed, 'exclude_created_since': cutoff}
    return roots, scope


def inside(path, roots):
    return any(path == Path(r) or Path(r) in path.parents for r in roots)


def birth(snapshot):
    """Filesystem creation only; no mtime/ctime substitution. Invalid epochs unknown."""
    value = getattr(snapshot, 'st_birthtime', None)
    if value is None or value < 315532800 or value > dt.datetime.now(UTC).timestamp() + 300:
        return None
    return stamp(value)


def metadata(text):
    values = {'name': None, 'description': None}
    states = dict.fromkeys(values, 'missing')
    lines = text.splitlines()
    if not lines or lines[0] != '---':
        return values, states
    for line in lines[1:]:
        if line == '---':
            break
        match = re.match(r'^(name|description):\s*(.*)$', line)
        if not match:
            continue
        key, val = match.groups()
        if states[key] != 'missing':
            values[key] = None; states[key] = 'unsupported'; continue
        states[key] = 'unsupported'
        if not val or val[0] in '|>&*!{[' or ' #' in val or ': ' in val:
            continue
        if val.startswith('"'):
            try:
                val = json.loads(val)
            except json.JSONDecodeError:
                continue
        elif val.startswith("'"):
            if len(val) < 2 or not val.endswith("'"):
                continue
            val = val[1:-1].replace("''", "'")
        elif val in {'null', '~', 'true', 'false'} or re.fullmatch(r'[-+]?\d+(\.\d+)?', val):
            continue
        if isinstance(val, str):
            values[key] = val; states[key] = 'parsed'
    return values, states


def discover(roots, scope):
    found, warnings = {}, []
    budget = [0]
    def walk(path, ancestry):
        budget[0] += 1
        if budget[0] > 200000:
            raise ValueError('discovery limit exceeded; inventory incomplete')
        try:
            real = path.resolve(strict=True)
            if not inside(real, scope['allowed_roots']):
                warnings.append({'path': str(path), 'status': 'outside_allowed_roots'}); return
            st = real.stat(); identity = (st.st_dev, st.st_ino)
            if stat.S_ISDIR(st.st_mode):
                if identity in ancestry:
                    warnings.append({'path': str(path), 'status': 'cycle_skipped'}); return
                for child in sorted(path.iterdir()):
                    walk(child, ancestry | {identity})
            elif stat.S_ISREG(st.st_mode) and path.suffix.lower() == '.md':
                found.setdefault(str(real), set()).add(str(path))
        except (OSError, RuntimeError):
            warnings.append({'path': str(path), 'status': 'unreadable_or_dangling'})
    for root in roots:
        if root.exists():
            walk(root, set())
    return found, warnings


def observations():
    path = absolute(os.environ.get('SKILL_STOCKTAKE_OBSERVATIONS', '~/.claude/observations.jsonl'))
    counts = {}
    try:
        now = dt.datetime.now(UTC)
        for line in path.read_text().splitlines():
            event = json.loads(line)
            if not isinstance(event, dict):
                raise ValueError('invalid observation')
            if event.get('tool') != 'Read':
                continue
            if not isinstance(event.get('path'), str):
                raise ValueError('invalid observation path')
            date = dt.datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
            if date.tzinfo is None:
                raise ValueError('undated observation')
            days = (now-date).total_seconds()/86400
            if days < 0:
                continue
            row = counts.setdefault(str(absolute(event['path']).resolve()), [0, 0])
            row[0] += int(days <= 7); row[1] += int(days <= 30)
    except (OSError, ValueError, KeyError, TypeError, AttributeError, RuntimeError):
        return {}, 'unknown'
    return counts, 'observed_file_only'


def signature(snapshot):
    return (snapshot.st_dev, snapshot.st_ino, snapshot.st_size, snapshot.st_mtime_ns,
            getattr(snapshot, 'st_birthtime', None))


def read_body(real, scope, expected=None, owner=None, owner_snapshot=None):
    """Do not follow a replaced leaf symlink; verify identity around the read."""
    p = Path(real)
    if not inside(p.resolve(strict=True), scope['allowed_roots']):
        raise ValueError('file escaped roots')
    before = expected if expected is not None else p.stat()
    # Resolve first, then pin each directory without following replacement symlinks.
    directory = os.open('/', os.O_RDONLY | os.O_DIRECTORY)
    try:
        for part in p.parts[1:-1]:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=directory)
            os.close(directory)
            directory = child
        fd = os.open(p.name, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=directory)
    finally:
        os.close(directory)
    with os.fdopen(fd, 'rb') as stream:
        opened = os.fstat(stream.fileno())
        if not stat.S_ISREG(opened.st_mode) or (opened.st_dev, opened.st_ino) != (before.st_dev, before.st_ino):
            raise ValueError('file changed during scan')
        if signature(opened) != signature(before):
            raise ValueError('file changed after eligibility check')
        if owner is not None and signature(owner.stat()) != signature(owner_snapshot):
            raise ValueError('owning skill changed after eligibility check')
        data = stream.read()
        after = os.fstat(stream.fileno())
    if (opened.st_size, opened.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise ValueError('file changed during scan')
    return data, after


def inventory(project=None):
    roots, scope = context(project)
    found, warnings = discover(roots, scope)
    counts, usage_status = observations()
    rows = []
    for real, paths in sorted(found.items()):
        aliases = sorted(paths); p = Path(real)
        row = {'path': aliases[0], 'realpath': real, 'aliases': aliases,
               'kind': 'skill' if p.name == 'SKILL.md' else 'reference',
               'sha256': None, 'name': None, 'description': None,
               'use_7d': None, 'use_30d': None, 'usage_status': usage_status,
               'usage_kind': 'read_observations', 'invocations_7d': None, 'invocations_30d': None}
        try:
            owner = p
            # References inherit the nearest skill entry's creation exclusion.
            for parent in p.parents:
                if not inside(parent, scope['allowed_roots']):
                    break
                if (parent/'SKILL.md').is_file():
                    owner = parent/'SKILL.md'; break
            if not inside(owner.resolve(strict=True), scope['allowed_roots']):
                raise ValueError('owner outside allowed roots')
            target_snapshot = p.stat()
            owner_snapshot = owner.stat()
            created = birth(owner_snapshot)
            row.update(created_at=created, age_source='filesystem_birth' if created else 'unknown', mtime=stamp(p.stat().st_mtime))
            cutoff = scope['exclude_created_since']
            if cutoff and (created is None or created[:10] >= cutoff):
                row['eligibility'] = 'excluded_age_unknown' if created is None else 'excluded_recent'
                rows.append(row); continue
            row['eligibility'] = 'included'
            content, st = read_body(real, scope, target_snapshot, owner, owner_snapshot)
            row['sha256'] = hashlib.sha256(content).hexdigest(); row['mtime'] = stamp(st.st_mtime)
            parsed, states = metadata(content.decode('utf-8'))
            row.update(parsed); row['metadata_status'] = states
            if usage_status != 'unknown':
                row['use_7d'], row['use_30d'] = counts.get(real, [0, 0])
        except (OSError, ValueError, RuntimeError):
            row.update(eligibility='unobserved', sha256=None)
        rows.append(row)
    summary = {}
    for key, root in zip(('global', 'project'), roots):
        summary[key] = {'found': root.is_dir(), 'path': str(root),
                        'count': sum(any(inside(Path(a), [str(root)]) for a in row['aliases']) for row in rows)}
    return {'schema_version': 2, 'scope': scope, 'scan_summary': summary, 'skills': rows, 'warnings': warnings}


def rows_of(cache):
    rows = cache.get('skills')
    if isinstance(rows, dict):
        rows = list(rows.values())
    if not isinstance(rows, list) or not all(isinstance(r, dict) for r in rows):
        raise ValueError('skills must be an array or object of rows')
    return rows


def difference(cache_path, project=None):
    cached = json.loads(Path(cache_path).read_text())
    if not isinstance(cached, dict):
        raise ValueError('invalid cache')
    _, scope = context(project)
    if not cached.get('scope'):
        return [{'status': 'rebaseline_required', 'reason': 'legacy_cache_without_scope'}], 2
    if cached['scope'] != scope:
        return [{'status': 'scope_mismatch'}], 2
    oldrows = rows_of(cached)
    if any(not r.get('realpath') or not r.get('sha256') for r in oldrows if r.get('eligibility', 'included') == 'included'):
        return [{'status': 'rebaseline_required', 'reason': 'legacy_cache_without_hash'}], 2
    for root in scope['roots']:
        if not Path(root).is_dir() and any(isinstance(row.get('path'), str) and inside(absolute(row['path']), [root]) for row in oldrows):
            return [{'status': 'scope_unavailable', 'root': root}], 2
    current = inventory(project)
    for name, previous in cached.get('scan_summary', {}).items():
        if previous.get('found') and not current['scan_summary'].get(name, {}).get('found'):
            return [{'status': 'scope_unavailable', 'root': name}], 2
    old = {r.get('realpath'): r for r in oldrows if r.get('realpath')}
    new = {r['realpath']: r for r in current['skills']}
    result = []
    for key in sorted(set(old) | set(new)):
        prior, now = old.get(key), new.get(key)
        if now and not now.get('sha256'):
            result.append({'path': now['path'], 'status': now['eligibility'], 'is_new': prior is None})
        elif now is None:
            result.append({'path': prior['path'], 'status': 'unobserved' if current['warnings'] else 'removed', 'is_new': False})
        elif prior is None:
            result.append(dict(now, status='new', is_new=True))
        elif not prior.get('sha256'):
            result.append(dict(now, status='rebaseline_required', is_new=False))
        elif prior['sha256'] != now['sha256']:
            result.append(dict(now, status='changed', is_new=False))
        elif prior.get('aliases') != now.get('aliases'):
            result.append(dict(now, status='aliases_changed', is_new=False))
    if current['warnings']:
        result.append({'status': 'discovery_warnings', 'warnings': current['warnings']})
    return result, 0


def save(target, payload):
    incoming = json.loads(payload)
    if not isinstance(incoming, dict) or not isinstance(incoming.get('skills'), dict):
        raise ValueError('save requires an object containing skills object')
    rows_of(incoming)
    _, scope = context()
    if incoming['skills'] and 'scope' not in incoming:
        raise ValueError('nonempty evaluations require the observed scope')
    if incoming.get('scope', scope) != scope:
        raise ValueError('incoming scope mismatch')
    for row in incoming['skills'].values():
        if not isinstance(row.get('path'), str):
            raise ValueError('each saved entry needs an observed path')
        entry = absolute(row['path'])
        if not inside(entry, scope['roots']) or not inside(entry.resolve(), scope['allowed_roots']):
            raise ValueError('entry outside selected scope')
        if row.get('realpath') and str(entry.resolve()) != row['realpath']:
            raise ValueError('entry identity no longer matches observation')
    dest = absolute(target)
    if dest.suffix != '.json' or dest.is_symlink():
        raise ValueError('explicit non-symlink .json cache required')
    dest = dest.parent.resolve(strict=True)/dest.name
    # Keep the lock inode: unlinking lockfiles would let waiters lock different files.
    lockfd = os.open(str(dest)+'.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(lockfd, 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if dest.is_symlink():
            raise ValueError('cache symlink refused')
        existing = json.loads(dest.read_text()) if dest.exists() else {}
        if not isinstance(existing, dict):
            raise ValueError('invalid existing cache')
        rebaseline = os.environ.get('SKILL_STOCKTAKE_REBASELINE') == '1'
        if existing and existing.get('scope') != scope:
            if rebaseline and 'scope' not in existing:
                existing = {}
            else:
                raise ValueError('existing cache scope mismatch; explicit legacy rebaseline required')
        if rebaseline:
            existing = {}
        if existing and not isinstance(existing.get('skills'), dict):
            raise ValueError('existing save cache must contain skills object')
        merged = dict(existing)
        merged.update({k:v for k,v in incoming.items() if k not in {'skills','scope','evaluated_at'}})
        if 'scan_summary' not in merged:
            merged['scan_summary'] = {name: {'found': Path(root).is_dir(), 'path': root}
                                      for name, root in zip(('global', 'project'), scope['roots'])}
        merged.update(schema_version=2, scope=scope, evaluated_at=stamp(),
                      skills={**existing.get('skills', {}), **incoming['skills']})
        fd, name = tempfile.mkstemp(prefix=dest.name+'.', dir=dest.parent)
        try:
            with os.fdopen(fd, 'w') as stream:
                json.dump(merged, stream, ensure_ascii=False, indent=2); stream.write('\n')
                stream.flush(); os.fsync(stream.fileno())
            os.replace(name, dest)
        finally:
            if os.path.exists(name):
                os.unlink(name)


def main():
    try:
        action, *args = sys.argv[1:]
        if action == 'scan' and len(args) <= 1:
            data, code = inventory(*args), 0
        elif action == 'diff' and 1 <= len(args) <= 2:
            data, code = difference(*args)
        elif action == 'save' and len(args) == 1:
            save(args[0], sys.stdin.read()); return 0
        else:
            raise ValueError('usage: stocktake.py scan [PROJECT] | diff CACHE [PROJECT] | save CACHE')
        print(json.dumps(data, ensure_ascii=False, indent=2)); return code
    except (OSError, ValueError, TypeError, RuntimeError):
        # Do not echo user JSON, malformed metadata, environment or exception contents.
        print('stocktake: invalid input or inaccessible scope/cache; no successful result', file=sys.stderr)
        return 2

if __name__ == '__main__':
    sys.exit(main())
