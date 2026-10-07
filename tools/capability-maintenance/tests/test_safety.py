import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('stocktake',Path(os.environ.get('STOCKTAKE_TEST_SCRIPTS', str(Path(__file__).resolve().parents[1]/'scripts')))/'stocktake.py')
backend=importlib.util.module_from_spec(spec);spec.loader.exec_module(backend)

class Safety(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.skills=self.root/'skills';self.skills.mkdir()
        self.entry=self.skills/'SKILL.md';self.entry.write_text('---\nname: test\n---\n')
        self.reference=self.skills/'ref.md';self.reference.write_text('reference')
        self.env={'SKILL_STOCKTAKE_GLOBAL_DIR':str(self.skills),'SKILL_STOCKTAKE_PROJECT_DIR':str(self.root/'missing'),
                  'SKILL_STOCKTAKE_OBSERVATIONS':str(self.root/'no-observations'),'SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE':'2026-09-28'}
        self.patcher=patch.dict(os.environ,self.env);self.patcher.start();self.addCleanup(self.patcher.stop)

    def test_recent_and_references_excluded_before_body_read(self):
        with patch.object(backend,'birth',return_value='2026-10-01T00:00:00Z'),patch.object(backend,'read_body',side_effect=AssertionError('must not read')):
            rows=backend.inventory()['skills'];self.assertEqual(len(rows),2)
            self.assertTrue(all(r['eligibility']=='excluded_recent' and r['sha256'] is None for r in rows))

    def test_unknown_age_excluded_before_body_read(self):
        with patch.object(backend,'birth',return_value=None),patch.object(backend,'read_body',side_effect=AssertionError('must not read')):
            self.assertTrue(all(r['eligibility']=='excluded_age_unknown' for r in backend.inventory()['skills']))

    def test_old_included(self):
        with patch.object(backend,'birth',return_value='2026-09-01T00:00:00Z'):
            self.assertTrue(all(r['sha256'] and r['eligibility']=='included' for r in backend.inventory()['skills']))

    def test_cache_missing_hash_rebaseline(self):
        data=backend.inventory();data['skills']=[{'path':str(self.entry),'realpath':str(self.entry.resolve())}]
        cache=self.root/'cache.json';cache.write_text(json.dumps(data))
        result,rc=backend.difference(cache);self.assertEqual(rc,2);self.assertEqual(result[0]['status'],'rebaseline_required')

    def test_malformed_observations_unknown(self):
        obs=self.root/'bad.jsonl';obs.write_text('{bad\n');os.environ['SKILL_STOCKTAKE_OBSERVATIONS']=str(obs)
        self.assertEqual(backend.observations(),({},'unknown'))

    def test_save_symlink_refused(self):
        target=self.root/'target.json';target.write_text('original')
        alias=self.root/'alias.json';alias.symlink_to(target)
        with self.assertRaises(ValueError):backend.save(alias,'{"skills":{}}')
        self.assertEqual(target.read_text(),'original')

    def test_lock_symlink_refused(self):
        target=self.root/'target.json';target.write_text('original')
        cache=self.root/'cache.json';Path(str(cache)+'.lock').symlink_to(target)
        with self.assertRaises(OSError):backend.save(cache,'{"skills":{}}')
        self.assertEqual(target.read_text(),'original');self.assertFalse(cache.exists())

    def test_cross_scope_save_does_not_overwrite(self):
        cache=self.root/'cache.json';backend.save(cache,'{"skills":{}}');before=cache.read_bytes()
        os.environ['SKILL_STOCKTAKE_GLOBAL_DIR']=str(self.root/'other')
        os.environ['SKILL_STOCKTAKE_REBASELINE']='1'
        try:
            with self.assertRaises(ValueError):backend.save(cache,'{"skills":{}}')
            self.assertEqual(cache.read_bytes(),before)
        finally:os.environ.pop('SKILL_STOCKTAKE_REBASELINE',None)

    def test_legacy_save_requires_explicit_rebaseline(self):
        cache=self.root/'cache.json';cache.write_text('{"skills":{"old":{}}}')
        with self.assertRaises(ValueError):backend.save(cache,'{"skills":{}}')
        os.environ['SKILL_STOCKTAKE_REBASELINE']='1'
        try:backend.save(cache,json.dumps({'scope':backend.context()[1], 'skills':{'fresh':{'path':str(self.entry)}}}))
        finally:os.environ.pop('SKILL_STOCKTAKE_REBASELINE',None)
        self.assertEqual(set(json.loads(cache.read_text())['skills']),{'fresh'})

    def test_replaced_parent_symlink_no_read(self):
        os.environ.pop('SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE')
        _,scope=backend.context();real=self.entry.resolve();old_open=backend.os.open
        # At the first pinned-directory open, swap the inventoried root for an outside symlink.
        outside=self.root/'outside';outside.mkdir();(outside/'SKILL.md').write_text('outside')
        moved=self.root/'moved';swapped=[False]
        def racing_open(path,*args,**kwargs):
            if path=='/' and not swapped[0]:
                self.skills.rename(moved);self.skills.symlink_to(outside,target_is_directory=True);swapped[0]=True
            return old_open(path,*args,**kwargs)
        with patch.object(backend.os,'open',side_effect=racing_open):
            with self.assertRaises(OSError):backend.read_body(str(real),scope)

if __name__=='__main__':unittest.main(verbosity=2)
