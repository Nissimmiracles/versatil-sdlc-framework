"""Black-box contract; fixtures only, no live skill roots."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import unittest

SCRIPTS = Path(os.environ.get('STOCKTAKE_TEST_SCRIPTS', str(Path(__file__).resolve().parents[1]/'scripts'))).resolve()

class Contract(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.skills = self.root / '.claude/skills'
        self.skills.mkdir(parents=True)
        self.project = self.root / 'project/.claude/skills'
        self.cache = self.root / 'results.json'
        self.env = os.environ.copy()
        self.env.update(SKILL_STOCKTAKE_GLOBAL_DIR=str(self.skills),
                        SKILL_STOCKTAKE_PROJECT_DIR=str(self.project),
                        SKILL_STOCKTAKE_OBSERVATIONS=str(self.root/'absent.jsonl'))
        for key in ['SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE', 'SKILL_STOCKTAKE_ALLOWED_ROOTS', 'SKILL_STOCKTAKE_REBASELINE']:
            self.env.pop(key, None)
        self.file = self.skill('a')

    def skill(self, name):
        p = self.skills / name / 'SKILL.md'
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text('---\nname: sample\ndescription: plain text\n---\nBody.\n')
        return p

    def run_script(self, name, *args, payload=None):
        return subprocess.run(['bash', str(SCRIPTS/name), *map(str,args)],
                              input=payload, text=True, capture_output=True,
                              env=self.env, cwd=self.root, timeout=20)

    def scan(self):
        r = self.run_script('scan.sh'); self.assertEqual(r.returncode,0,r.stderr)
        return json.loads(r.stdout)

    def baseline(self):
        data = self.scan()
        data['skills'] = {str(i): row for i,row in enumerate(data['skills'])}
        data['evaluated_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(time.time()+10))
        self.cache.write_text(json.dumps(data))
        return data

    def diff(self):
        r=self.run_script('quick-diff.sh',self.cache)
        return r,json.loads(r.stdout)

    def test_changed_retained_mtime(self):
        self.baseline();stamp=self.file.stat().st_mtime_ns
        self.file.write_text(self.file.read_text()+'Changed.\n');os.utime(self.file,ns=(stamp,stamp))
        _,rows=self.diff();self.assertTrue(any(x.get('status')=='changed' for x in rows),rows)

    def test_unchanged_touch(self):
        self.baseline();future=time.time()+30;os.utime(self.file,(future,future))
        _,rows=self.diff();self.assertEqual(rows,[])

    def test_missing(self):
        self.baseline();self.file.unlink()
        _,rows=self.diff();self.assertTrue(any(x.get('status')=='removed' for x in rows),rows)

    def test_new(self):
        self.baseline();self.skill('new')
        _,rows=self.diff();self.assertTrue(any(x.get('status')=='new' for x in rows),rows)

    def test_spaces_observations(self):
        p=self.skill('with spaces');obs=self.root/'obs.jsonl'
        obs.write_text(json.dumps({'tool':'Read','path':str(p),'timestamp':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})+'\n')
        self.env['SKILL_STOCKTAKE_OBSERVATIONS']=str(obs)
        row=next(x for x in self.scan()['skills'] if 'with spaces' in x['path'])
        self.assertEqual(row['use_7d'],1);self.assertEqual(row['usage_kind'],'read_observations')
        self.assertIsNone(row['invocations_7d'])

    def test_alias_cycle_escape(self):
        (self.skills/'alias').symlink_to(self.file.parent, target_is_directory=True)
        (self.file.parent/'cycle').symlink_to(self.skills, target_is_directory=True)
        outside=self.root/'outside';outside.mkdir();(outside/'SKILL.md').write_text('OUTSIDE')
        (self.skills/'escape').symlink_to(outside, target_is_directory=True)
        rows=self.scan()['skills'];self.assertEqual(len(rows),1)
        self.assertTrue(any('/alias/' in a for a in rows[0]['aliases']))
        self.assertEqual(rows[0]['realpath'],str(self.file.resolve()))

    def test_rootscope(self):
        self.baseline();other=self.root/'other';other.mkdir();self.env['SKILL_STOCKTAKE_GLOBAL_DIR']=str(other)
        r,rows=self.diff();self.assertNotEqual(r.returncode,0)
        self.assertEqual(rows[0]['status'],'scope_mismatch')

    def test_missing_observations(self):
        row=self.scan()['skills'][0];self.assertIsNone(row['use_7d']);self.assertEqual(row['usage_status'],'unknown')

    def test_legacy_requires_rebaseline(self):
        self.cache.write_text(json.dumps({'evaluated_at':'2099-01-01T00:00:00Z','skills':{'a':{'path':str(self.file)}}}))
        _,rows=self.diff();self.assertTrue(any(x.get('status')=='rebaseline_required' for x in rows),rows)

    def test_multiline_unknown_and_kind(self):
        self.file.write_text('---\nname: sample\ndescription: >-\n  multiple lines\n---\ntext')
        (self.file.parent/'notes.md').write_text('reference')
        rows=self.scan()['skills'];entry=next(x for x in rows if x['path'].endswith('SKILL.md'))
        self.assertIsNone(entry['description']);self.assertEqual(entry['metadata_status']['description'],'unsupported')
        self.assertEqual({x['kind'] for x in rows},{'skill','reference'})

    def test_concurrent_save(self):
        # Bootstrap then start multiple independent processes against one cache.
        r=self.run_script('save-results.sh',self.cache,payload='{"skills":{}}');self.assertEqual(r.returncode,0,r.stderr)
        scope=self.scan().get('scope')
        def save(i):
            return self.run_script('save-results.sh',self.cache,payload=json.dumps({'scope':scope,'skills':{str(i):{'path':str(self.file),'reason':str(i)}}}))
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            results=list(pool.map(save,range(24)))
        self.assertTrue(all(r.returncode==0 for r in results),[r.stderr for r in results])
        self.assertEqual(len(json.loads(self.cache.read_text())['skills']),24)

    def test_malformed_json_no_overwrite(self):
        self.baseline();before=self.cache.read_bytes()
        r=self.run_script('save-results.sh',self.cache,payload='{bad')
        self.assertNotEqual(r.returncode,0);self.assertEqual(self.cache.read_bytes(),before)

if __name__=='__main__':unittest.main(verbosity=2)
