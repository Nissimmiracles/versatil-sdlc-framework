"""Reproducible local pilot: explicit backend and new output directory, no account reads."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def prepare(backend, output):
    backend = Path(backend).resolve(strict=True)
    output = Path(output).absolute()
    output.mkdir(parents=True, exist_ok=False)
    output = output.resolve(strict=True)
    fixture = output/'fixtures'
    fixture.mkdir()
    (output/'cache').mkdir()
    for repo in ('repo-a', 'repo-b'):
        for host in ('codex', 'claude'):
            skill = fixture/repo/('.'+host)/'skills/example'
            skill.mkdir(parents=True)
            (skill/'SKILL.md').write_text('---\nname: '+repo+'-'+host+'\ndescription: Synthetic alpha fixture\n---\nReturn fixture identity only.\n')
        (fixture/repo/'README.md').write_text('# Synthetic test data\nNot an account or authority source.\n')
    (fixture/'empty-global').mkdir()
    (fixture/'observations.jsonl').write_text('')
    python = Path(sys.executable).resolve()
    wrappers = {'scan':'scan.sh','diff':'quick-diff.sh','save':'save-results.sh'}
    manifest = {
        'schema_version':1, 'capability':'skill-stocktake-local-pilot', 'version':'0.1.0-isolated-candidate',
        'backend':{'language':'Python', 'directory':str(backend), 'entry':'stocktake.py',
                   'sha256':{name:digest(backend/name) for name in ['stocktake.py', *wrappers.values()]}},
        'runtime':{'python':str(python), 'version':list(sys.version_info[:3]), 'sha256':digest(python),
                   'dependencies':'Python standard library, Unix fcntl'},
        'transport':{'kind':'local argv subprocess', 'shell':'/bin/bash', 'bash_sha256':digest('/bin/bash'),
                     'wrappers':wrappers, 'timeout_seconds':10},
        'fixture_root':str(fixture), 'cache_root':str(output/'cache'),
        'contexts':{repo+'-'+host:{'host_label':host, 'repository_label':repo,
                    'global_root':str(fixture/'empty-global'),
                    'project_root':str(fixture/repo/('.'+host)/'skills'),
                    'observations':str(fixture/'observations.jsonl')}
                    for repo in ('repo-a','repo-b') for host in ('codex','claude')},
        'inputs':{'roots':'four explicit synthetic contexts', 'cache':'explicit .json under cache_root',
                  'save_payload':'scan scope and skills object'},
        'outputs':{'scan':'schema2 inventory JSON','diff':'structured changes/refusals','save':'cache plus rc'},
        'effects':{'scan':['read explicit fixture roots'],'diff':['read roots and cache'],
                   'save':['write selected cache','persistent lock','atomic temporary replace']},
        'tests':{'pilot':9,'scope':'local four-context synthetic journey'},
        'limits':['Trusted local manifest, not signed authorization','No native account, service or MCP activation',
                  'No hostile sandbox or zero-egress measurement']}
    (output/'capability.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return output


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backend', required=True, help='Explicit directory containing stocktake.py and its three wrappers')
    parser.add_argument('--output', required=True, help='New isolated output directory; existing directory refused')
    args=parser.parse_args()
    root=prepare(args.backend,args.output)
    env={**os.environ,'STOCKTAKE_PILOT_ROOT':str(root),'PYTHONDONTWRITEBYTECODE':'1'}
    process=subprocess.run([sys.executable,str(Path(__file__).with_name('test_pilot.py'))],env=env,
                           cwd=root,text=True,capture_output=True,timeout=45,check=False)
    (root/'driver-result.json').write_text(json.dumps({'argv':[sys.executable,str(Path(__file__).with_name('test_pilot.py'))],
                           'rc':process.returncode,'stdout':process.stdout,'stderr':process.stderr},indent=2)+'\n')
    sys.stdout.write(process.stdout)
    sys.stderr.write(process.stderr)
    return process.returncode


if __name__=='__main__':
    raise SystemExit(main())
