"""Independent review counterexamples: root loss, foreign scope, creation race."""
import importlib.util,json,os,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('stocktake_regression',Path(os.environ.get('STOCKTAKE_TEST_SCRIPTS', str(Path(__file__).resolve().parents[1]/'scripts')))/'stocktake.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class Regressions(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
  self.skills=self.root/'skills';self.skills.mkdir();self.file=self.skills/'SKILL.md';self.file.write_text('old')
  self.cache=self.root/'cache.json'
  self.p=patch.dict(os.environ,{'SKILL_STOCKTAKE_GLOBAL_DIR':str(self.skills),'SKILL_STOCKTAKE_PROJECT_DIR':str(self.root/'missing'),'SKILL_STOCKTAKE_OBSERVATIONS':str(self.root/'none'),'SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE':''})
  self.p.start();self.addCleanup(self.p.stop)
 def test_save_then_whole_root_missing(self):
  data=b.inventory();b.save(self.cache,json.dumps({'scope':data['scope'],'skills':{r['realpath']:r for r in data['skills']}}))
  self.skills.rename(self.root/'renamed')
  rows,rc=b.difference(self.cache);self.assertEqual(rows[0]['status'],'scope_unavailable');self.assertNotEqual(rc,0)
 def test_foreign_unscoped_payload_rejected(self):
  outside=self.root/'other/SKILL.md'
  with self.assertRaises(ValueError):b.save(self.cache,json.dumps({'skills':{'foreign':{'path':str(outside),'realpath':str(outside)}}}))
  self.assertFalse(self.cache.exists())
 def test_age_checked_identity_before_read(self):
  os.environ['SKILL_STOCKTAKE_EXCLUDE_CREATED_SINCE']='2026-09-28'
  def swap(_):
   fresh=self.root/'fresh';fresh.write_text('new body must not be read');os.replace(fresh,self.file)
   return '2026-08-01T00:00:00Z'
  with patch.object(b,'birth',side_effect=swap):
   rows=b.inventory()['skills'];self.assertIsNone(rows[0]['sha256']);self.assertNotEqual(rows[0]['eligibility'],'included')
if __name__=='__main__':unittest.main(verbosity=2)
