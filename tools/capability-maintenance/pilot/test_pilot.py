import copy
import json
import os
from pathlib import Path
import shutil
import unittest
from unittest.mock import patch
import adapter

ROOT = Path(os.environ.get('STOCKTAKE_PILOT_ROOT', Path(__file__).resolve().parent)).resolve()
MANIFEST = json.loads((ROOT/'capability.json').read_text())
RECORDS = []


def call(context, action, cache=None, payload=None):
    value = adapter.invoke(MANIFEST, context, action, cache, payload)
    RECORDS.append(value)
    return value


def snapshot_payload(scan):
    data = copy.deepcopy(scan['data'])
    data['skills'] = {row['realpath']: row for row in data['skills']}
    return data


class Pilot(unittest.TestCase):
    def test_01_transport_four_explicit_contexts(self):
        backend = MANIFEST['backend']['directory']
        for context in MANIFEST['contexts']:
            with self.subTest(context=context):
                result = call(context, 'scan')
                self.assertEqual(result['rc'], 0)
                self.assertEqual(result['argv'][1], str(Path(backend)/'scan.sh'))
                self.assertEqual(len(result['data']['skills']), 1)
                row = result['data']['skills'][0]
                self.assertEqual(row['name'], context)
                self.assertTrue(Path(row['realpath']).is_relative_to(MANIFEST['contexts'][context]['project_root']))
                cache = ROOT/'cache'/(context+'.json')
                saved = call(context, 'save', cache, snapshot_payload(result))
                self.assertEqual(saved['rc'], 0)
                unchanged = call(context, 'diff', cache)
                self.assertEqual(unchanged['rc'], 0)
                self.assertEqual(unchanged['data'], [])

    def test_02_content_change_with_preserved_mtime(self):
        context = 'repo-a-codex'
        target = Path(MANIFEST['contexts'][context]['project_root'])/'example/SKILL.md'
        original = target.read_bytes()
        times = target.stat()
        target.write_bytes(original.replace(b'alpha', b'omega'))
        os.utime(target, ns=(times.st_atime_ns, times.st_mtime_ns))
        try:
            self.assertEqual(target.stat().st_mtime_ns, times.st_mtime_ns)
            changed = call(context, 'diff', ROOT/'cache'/(context+'.json'))
            self.assertEqual(changed['rc'], 0)
            self.assertEqual([row['status'] for row in changed['data']], ['changed'])
        finally:
            target.write_bytes(original)
            os.utime(target, ns=(times.st_atime_ns, times.st_mtime_ns))
        self.assertEqual(call(context, 'diff', ROOT/'cache'/(context+'.json'))['data'], [])

    def test_03_other_scope_cache_refused(self):
        source = ROOT/'cache/repo-a-codex.json'
        before = source.read_bytes()
        refusal = call('repo-b-claude', 'diff', source)
        self.assertEqual(refusal['rc'], 2)
        self.assertEqual(refusal['data'], [{'status': 'scope_mismatch'}])
        scan = call('repo-b-claude', 'scan')
        self.assertEqual(call('repo-b-claude', 'save', source, snapshot_payload(scan))['rc'], 2)
        self.assertEqual(source.read_bytes(), before)

    def test_04_manifest_version_rejected_before_transport(self):
        bad = copy.deepcopy(MANIFEST); bad['schema_version'] = 99
        with patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'version'):
                adapter.invoke(bad, 'repo-a-codex', 'scan')
            launched.assert_not_called()

    def test_05_missing_backend_rejected_before_transport(self):
        bad = copy.deepcopy(MANIFEST); bad['backend']['directory'] = str(ROOT/'absent-backend')
        with patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'missing'):
                adapter.invoke(bad, 'repo-a-codex', 'scan')
            launched.assert_not_called()

    def test_06_changed_backend_rejected_before_transport(self):
        bad = copy.deepcopy(MANIFEST)
        copied = ROOT/'negative-backend'
        shutil.copytree(MANIFEST['backend']['directory'], copied, dirs_exist_ok=True)
        bad['backend']['directory'] = str(copied)
        with (copied/'stocktake.py').open('a') as stream:
            stream.write('\n# Deliberate isolated negative fixture drift\n')
        with patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'hash drift'):
                adapter.invoke(bad, 'repo-a-codex', 'scan')
            launched.assert_not_called()

    def test_07_runtime_version_rejected_before_transport(self):
        bad = copy.deepcopy(MANIFEST); bad['runtime']['version'] = [0, 0, 0]
        with patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'runtime version'):
                adapter.invoke(bad, 'repo-a-codex', 'scan')
            launched.assert_not_called()


    def test_08_undeclared_context_refused_before_transport(self):
        with patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'undeclared'):
                adapter.invoke(MANIFEST, 'user-account', 'scan')
            launched.assert_not_called()

    def test_09_transport_python_resolution_refused_before_launch(self):
        with patch('adapter.shutil.which', return_value='/usr/bin/unrelated'), patch('adapter.subprocess.run') as launched:
            with self.assertRaisesRegex(adapter.Refused, 'resolution drift'):
                adapter.invoke(MANIFEST, 'repo-a-codex', 'scan')
            launched.assert_not_called()


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Pilot)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    (ROOT/'transport-records.json').write_text(json.dumps(RECORDS, indent=2)+'\n')
    (ROOT/'test-result.json').write_text(json.dumps({'tests': result.testsRun, 'failures': len(result.failures), 'errors': len(result.errors), 'passed': result.wasSuccessful(), 'scope': 'synthetic local adapters; actual Bash wrappers and Python candidate backend'}, indent=2)+'\n')
    raise SystemExit(not result.wasSuccessful())
