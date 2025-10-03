---
description: "Run isolation and quality validation"
---

Run **VERSATIL isolation + quality validation** to ensure framework integrity.

## What Gets Validated:
✅ **Isolation**: Framework-project separation (~/.versatil/)
✅ **Quality Gates**: 85%+ test coverage enforcement
✅ **Security**: Zero vulnerabilities
✅ **Configuration**: Settings file syntax
✅ **Dependencies**: Package integrity
✅ **Build**: TypeScript compilation

## Isolation Checks:
🛡️ No framework files in user project (.versatil/, supabase/)
🛡️ Framework data properly located in ~/.versatil/
🛡️ .versatil-project.json is only allowed project file
🛡️ Git ignore rules properly configured

## Quality Gates:
📊 Test coverage >= 85%
📊 All tests passing
📊 Linting clean (ESLint + Prettier)
📊 TypeScript strict mode compliance
📊 Performance budgets met

## Usage:
```bash
/validate                       # Run full validation
/validate --isolation          # Isolation check only
/validate --quality            # Quality gates only
/validate --fix                # Auto-fix issues
```

## Integration:
Runs automatically via:
- `npm run validate:isolation`
- `npm run validate`
- Pre-commit hooks (if configured)
- CI/CD pipelines

## Output:
```
🔍 VERSATIL Validation

✅ Isolation: Framework properly isolated
✅ Quality: 87% test coverage (target: 85%+)
✅ Security: 0 vulnerabilities
✅ Build: TypeScript compilation successful
✅ Configuration: All settings valid

Status: PASSED ✨
```