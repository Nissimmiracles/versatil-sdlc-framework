# Mozilla Observatory Security Integration

**VERSATIL Framework Phase 3 - Task 3.4**

Comprehensive DAST (Dynamic Application Security Testing) integration using Mozilla Observatory for deployed application security scanning.

---

## Overview

### What is Mozilla Observatory?

Mozilla Observatory is a free, open-source web security scanner that provides:

- **HTTP Security Headers Analysis**: CSP, HSTS, X-Frame-Options, etc.
- **TLS/SSL Configuration Testing**: Certificate validation, cipher suites
- **Security Best Practices**: OWASP recommendations
- **Grading System**: A+ to F scale (0-130+ points)
- **Remediation Guidance**: Actionable security recommendations

### SAST vs DAST

| Type | Tool | What it scans | When it runs |
|------|------|---------------|--------------|
| **SAST** | Semgrep | Static code analysis (source code) | Pre-commit, CI/CD |
| **DAST** | Observatory | Dynamic analysis (running application) | Pre-deployment, production |

**VERSATIL Framework** now includes both:
- ✅ **Semgrep**: Code-level security (existing)
- ✅ **Observatory**: Runtime security (new in v3.4)

---

## Quick Start

### 1. Scan a Deployed Application

```bash
# Quick security grade check
node scripts/security-scan.cjs quick-check https://example.com

# Full security scan
node scripts/security-scan.cjs scan https://example.com

# Generate comprehensive report
node scripts/security-scan.cjs report https://example.com
```

### 2. Auto-Fix Security Headers

```bash
# Detect framework and apply recommended headers
node scripts/security-scan.cjs fix-headers

# Apply minimal headers (quick setup)
node scripts/security-scan.cjs fix-headers --minimal
```

### 3. Validate CSP

```bash
# Check Content Security Policy configuration
node scripts/security-scan.cjs validate-csp https://example.com
```

### 4. Continuous Monitoring

```bash
# Monitor security every 5 minutes
node scripts/security-scan.cjs watch https://example.com --interval 300000
```

---

## CLI Commands

### `scan <url>` - Full Security Scan

Runs comprehensive Observatory scan with detailed results.

```bash
node scripts/security-scan.cjs scan https://example.com

# Options:
# --rescan    Force rescan (ignore cached results)
# --hidden    Don't include scan in public Observatory results
```

**Output:**
```
🔒 VERSATIL Security Scanner
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning: https://example.com

┌─ Security Score ─────────────────────────────────┐
│ Grade: A 🎖️  | Score: 85/100
└──────────────────────────────────────────────────┘

Tests:
  ✓ Passed: 8/10
  ✗ Failed: 2/10

Failed Tests:
  • content-security-policy: CSP header missing or unsafe
  • subresource-integrity: SRI not implemented for third-party resources

Recommendations:
  → Add Content-Security-Policy header to prevent XSS attacks
  → Enable Subresource Integrity for third-party scripts
  → Add Referrer-Policy header to control referrer information

✅ PASS: Ready for deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### `report <url>` - Generate Security Report

Creates comprehensive security reports in JSON and Markdown formats.

```bash
node scripts/security-scan.cjs report https://example.com
```

**Output:**
- JSON: `~/.versatil/security-reports/security-report-{id}.json`
- Markdown: `~/.versatil/security-reports/security-report-{id}.md`

**Report includes:**
- Security grade and score
- Detailed vulnerability analysis
- Prioritized recommendations
- Step-by-step remediation guide
- Code examples for fixes

### `fix-headers` - Auto-Fix Security Headers

Automatically configures security headers for your framework.

```bash
node scripts/security-scan.cjs fix-headers

# Or use minimal headers (faster setup)
node scripts/security-scan.cjs fix-headers --minimal
```

**Supported frameworks:**
- **Node.js**: Express, Fastify, Koa
- **Python**: FastAPI, Django, Flask
- **Ruby**: Rails
- **Go**: Gin, Echo
- **Java**: Spring Boot

**What it does:**
1. Detects your backend framework automatically
2. Generates framework-specific middleware/configuration
3. Applies recommended security headers
4. Provides integration instructions

**Example output:**
```
🔧 Auto-Fix Security Headers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detected framework: express (node)

Applying recommended security headers...

✅ Security headers configured successfully!

Files Modified:
  → src/middleware/security.ts

Headers Added:
  ✓ Content-Security-Policy
  ✓ Strict-Transport-Security
  ✓ X-Frame-Options
  ✓ X-Content-Type-Options
  ✓ Referrer-Policy

Next Steps:
  → Import and use security middleware in your Express app:
  → import { securityHeaders } from './middleware/security';
  → app.use(securityHeaders);
```

### `validate-csp <url>` - Validate CSP

Deep-dive CSP analysis with specific recommendations.

```bash
node scripts/security-scan.cjs validate-csp https://example.com
```

**Checks:**
- CSP header presence and validity
- Unsafe directives (`unsafe-inline`, `unsafe-eval`)
- Missing critical directives
- Nonce/hash usage
- Report-URI configuration

### `quick-check <url>` - Quick Grade Check

Fast security grade check without full scan.

```bash
node scripts/security-scan.cjs quick-check https://example.com
```

**Use when:**
- You need a quick pass/fail check
- Running in CI/CD for fast feedback
- Monitoring multiple URLs

### `watch <url>` - Continuous Monitoring

Monitor security grade in real-time.

```bash
node scripts/security-scan.cjs watch https://example.com --interval 300000
```

**Use cases:**
- Production monitoring
- Security regression detection
- Incident response

---

## Security Headers Guide

### Content Security Policy (CSP)

**Purpose**: Prevent XSS attacks by controlling allowed resource sources.

**Recommended Policy:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```

**Migration Path:**
1. Start with `Content-Security-Policy-Report-Only`
2. Analyze violation reports
3. Tighten policy (remove `unsafe-inline`, `unsafe-eval`)
4. Switch to enforcement mode
5. Implement nonces for A+ grade

**See**: `templates/security/csp-template.json` for detailed CSP templates

### Strict-Transport-Security (HSTS)

**Purpose**: Enforce HTTPS, prevent man-in-the-middle attacks.

**Recommended Header:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Key parameters:**
- `max-age=31536000`: 1 year (minimum for preload)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Submit to HSTS preload list

**HSTS Preload:**
1. Configure header with above settings
2. Test for 30+ days
3. Submit to https://hstspreload.org/
4. Wait for inclusion in browser preload lists

### X-Frame-Options

**Purpose**: Prevent clickjacking attacks.

**Recommended Header:**
```
X-Frame-Options: DENY
```

**Or use SAMEORIGIN:**
```
X-Frame-Options: SAMEORIGIN
```

**Modern alternative:**
```
Content-Security-Policy: frame-ancestors 'none'
```

### X-Content-Type-Options

**Purpose**: Prevent MIME sniffing attacks.

**Required Header:**
```
X-Content-Type-Options: nosniff
```

**Always include** - no configuration needed, just enable.

### Referrer-Policy

**Purpose**: Control referrer information leakage.

**Recommended Header:**
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Policy options:**
- `no-referrer`: Most secure, breaks some analytics
- `strict-origin-when-cross-origin`: Recommended balance
- `same-origin`: Only send referrer to same origin

### Permissions-Policy

**Purpose**: Control browser features (geolocation, camera, etc.).

**Recommended Header:**
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
```

**Disable unused features** to reduce attack surface.

---

## Framework Integration

### Express.js (Node.js)

**Auto-generated middleware** (`src/middleware/security.ts`):

```typescript
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Security-Policy', "default-src 'self'...");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}
```

**Usage:**
```typescript
import { securityHeaders } from './middleware/security';
app.use(securityHeaders);
```

**Or use Helmet.js** (recommended for production):
```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Fastify (Node.js)

**Auto-generated plugin** (`src/plugins/security.ts`):

```typescript
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const securityPlugin: FastifyPluginCallback = (fastify, opts, done) => {
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('Content-Security-Policy', "default-src 'self'...");
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  });
  done();
};

export default fp(securityPlugin, { name: 'security-headers' });
```

**Or use @fastify/helmet:**
```bash
npm install @fastify/helmet
```

```typescript
import helmet from '@fastify/helmet';
fastify.register(helmet);
```

### FastAPI (Python)

**Auto-generated middleware** (`app/middleware/security.py`):

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers['Content-Security-Policy'] = "default-src 'self'..."
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
```

**Usage:**
```python
from app.middleware.security import SecurityHeadersMiddleware
app.add_middleware(SecurityHeadersMiddleware)
```

### Django (Python)

**Add to `settings.py`:**

```python
# HTTPS/SSL
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Security Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# CSP (requires django-csp)
pip install django-csp
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
```

### Ruby on Rails

**Auto-generated initializer** (`config/initializers/security.rb`):

```ruby
Rails.application.config.action_dispatch.default_headers = {
  'Content-Security-Policy' => "default-src 'self'...",
  'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
  'X-Frame-Options' => 'DENY',
  'X-Content-Type-Options' => 'nosniff',
  'Referrer-Policy' => 'strict-origin-when-cross-origin'
}
```

**Or use secure_headers gem:**
```ruby
gem 'secure_headers'
bundle install

SecureHeaders::Configuration.default do |config|
  config.hsts = "max-age=31536000; includeSubDomains; preload"
  config.x_frame_options = "DENY"
  config.x_content_type_options = "nosniff"
  config.referrer_policy = %w[strict-origin-when-cross-origin]
end
```

---

## Quality Gate Integration

### CI/CD Workflow

Observatory scan runs automatically in GitHub Actions:

```yaml
# .github/workflows/quality-gates.yml

jobs:
  observatory-scan:
    name: Mozilla Observatory Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Run Observatory scan
        run: node scripts/security-scan.cjs scan http://localhost:3000

      - name: Check security grade threshold
        run: |
          # Minimum grade: A
          # Blocks deployment if grade < A
```

### Pre-Deployment Hook

**Create**: `~/.versatil/hooks/beforeDeploy.sh`

```bash
#!/bin/bash
# Pre-deployment security scan

URL="$1"
MIN_GRADE="A"

echo "Running pre-deployment security scan..."
node scripts/security-scan.cjs quick-check "$URL"

GRADE=$(node scripts/security-scan.cjs quick-check "$URL" | grep "Grade:" | awk '{print $2}')

if [[ "$GRADE" =~ ^A ]]; then
  echo "✅ Security grade $GRADE meets minimum threshold"
  exit 0
else
  echo "❌ Security grade $GRADE below minimum threshold (A required)"
  echo "⚠️  Deployment blocked until security issues are resolved"
  exit 1
fi
```

**Usage:**
```bash
# Run before deployment
~/.versatil/hooks/beforeDeploy.sh https://staging.example.com
```

### Quality Gate Requirements

| Metric | Threshold | Action |
|--------|-----------|--------|
| Security Grade | ≥ A | Block deployment if below |
| Security Score | ≥ 80/100 | Warning if below |
| Critical Headers | All present | Block if missing |
| HSTS max-age | ≥ 31536000s | Warning if below |

---

## Grading System

### Grade Scale

| Grade | Score | Security Level | Status |
|-------|-------|----------------|--------|
| **A+** | 100-130+ | Excellent | ✅ Production-ready |
| **A** | 90-99 | Very Good | ✅ Production-ready |
| **A-** | 85-89 | Good | ✅ Production-ready |
| **B+** | 80-84 | Acceptable | ⚠️ Improve recommended |
| **B** | 70-79 | Acceptable | ⚠️ Improve recommended |
| **B-** | 65-69 | Acceptable | ⚠️ Improve recommended |
| **C+** | 60-64 | Marginal | ❌ Deployment blocked |
| **C** | 50-59 | Marginal | ❌ Deployment blocked |
| **C-** | 40-49 | Poor | ❌ Deployment blocked |
| **D+** | 30-39 | Poor | ❌ Deployment blocked |
| **D** | 20-29 | Very Poor | ❌ Deployment blocked |
| **D-** | 10-19 | Very Poor | ❌ Deployment blocked |
| **F** | 0-9 | Failing | ❌ Deployment blocked |

### Achieving A+

**Requirements for A+ grade:**
- ✅ All security headers present and valid
- ✅ CSP without `unsafe-inline` or `unsafe-eval`
- ✅ HSTS with `preload` directive
- ✅ Subresource Integrity (SRI) for third-party resources
- ✅ Perfect TLS/SSL configuration
- ✅ No mixed content
- ✅ Cookie security (Secure, HttpOnly, SameSite)

**Typical score breakdown:**
- CSP with nonces: +10 points
- HSTS preload: +5 points
- SRI enabled: +5 points
- Perfect TLS config: +10 points

---

## Marcus-Backend Integration

### Auto-Scan on API Deployment

Marcus-Backend automatically triggers Observatory scans when deploying APIs.

**Enhanced Marcus** (`src/agents/opera/marcus-backend/enhanced-marcus.ts`):

```typescript
async deployAPI(apiUrl: string): Promise<DeploymentResult> {
  // 1. Deploy API
  const deployment = await this.deploy(apiUrl);

  // 2. Run Observatory security scan
  const scanResult = await observatoryScanner.scanUrl(apiUrl);

  // 3. Check security grade
  if (!observatoryScanner.meetsMinimumGrade(scanResult.grade, 'A')) {
    // 4. Block deployment
    throw new Error(
      `Deployment blocked: Security grade ${scanResult.grade} below minimum threshold (A required)`
    );
  }

  // 5. Generate security report
  const validations = await securityHeaderValidator.validateHeaders(apiUrl);
  const report = await securityReportGenerator.generateReport(scanResult, validations);

  // 6. Auto-fix common issues
  if (scanResult.score < 90) {
    await securityHeaderValidator.autoFix();
  }

  return {
    deployed: true,
    securityGrade: scanResult.grade,
    securityScore: scanResult.score,
    reportPath: await securityReportGenerator.exportMarkdown(report)
  };
}
```

### Security Templates

Marcus uses language-specific security templates:

```typescript
const securityTemplates = {
  'node-express': {
    middleware: 'helmet',
    config: expressSecurityConfig
  },
  'python-fastapi': {
    middleware: 'SecurityHeadersMiddleware',
    config: fastapiSecurityConfig
  },
  'ruby-rails': {
    gem: 'secure_headers',
    config: railsSecurityConfig
  }
};
```

---

## Troubleshooting

### Common Issues

#### 1. Scan Timeout

**Problem:** Scan times out after 120 seconds.

**Solutions:**
- Increase timeout: `observatoryScanner.scanUrl(url, { timeout: 180000 })`
- Check if site is accessible from external networks
- Verify no firewall blocking Observatory IP ranges

#### 2. Rate Limit Errors

**Problem:** "Rate limit: Please wait X seconds..."

**Solutions:**
- Wait the specified time before rescanning
- Use cached results (don't use `--rescan` flag)
- Rate limit: Max 1 scan per 30 seconds per domain

#### 3. CSP Violations Breaking Site

**Problem:** Site breaks after enabling CSP.

**Solutions:**
- Start with `Content-Security-Policy-Report-Only`
- Analyze violation reports: `/csp-report` endpoint
- Gradually tighten policy based on real violations
- Use nonces for inline scripts instead of `unsafe-inline`

#### 4. HSTS Causing Issues

**Problem:** Can't access site via HTTP after enabling HSTS.

**Solutions:**
- HSTS is permanent (until max-age expires)
- Test with short max-age first: `max-age=300` (5 minutes)
- Once confident, use `max-age=31536000` (1 year)
- Clear HSTS cache in browser if needed

#### 5. Grade Not Improving

**Problem:** Fixed issues but grade unchanged.

**Solutions:**
- Force rescan: `--rescan` flag
- Wait for cache expiration (30 seconds)
- Check all recommendations, not just failed tests
- Verify headers actually present: `curl -I https://yoursite.com`

---

## npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "security:scan": "node scripts/security-scan.cjs scan",
    "security:report": "node scripts/security-scan.cjs report",
    "security:fix": "node scripts/security-scan.cjs fix-headers",
    "security:validate": "node scripts/security-scan.cjs validate-csp",
    "security:quick": "node scripts/security-scan.cjs quick-check",
    "security:watch": "node scripts/security-scan.cjs watch"
  }
}
```

**Usage:**
```bash
pnpm run security:scan https://example.com
pnpm run security:report https://example.com
pnpm run security:fix
pnpm run security:validate https://example.com
```

---

## Resources

### Documentation
- Mozilla Observatory: https://observatory.mozilla.org/
- Observatory API: https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md
- CSP Guide: https://content-security-policy.com/
- CSP Evaluator: https://csp-evaluator.withgoogle.com/
- HSTS Preload: https://hstspreload.org/
- SecurityHeaders.com: https://securityheaders.com/

### Tools
- CSP Builder: https://report-uri.com/home/generate
- SSL Labs: https://www.ssllabs.com/ssltest/
- Qualys SSL Server Test: https://www.ssllabs.com/ssltest/
- SecurityHeaders.com: https://securityheaders.com/

### Learning
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- MDN Security Headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security
- Google Web Fundamentals - Security: https://developers.google.com/web/fundamentals/security

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/versatil-sdlc-framework/issues
- Documentation: `docs/security/`
- Templates: `templates/security/`

---

**Last Updated**: 2025-10-19
**VERSATIL Framework Version**: 6.4.1
**Observatory Integration Version**: 1.0.0
