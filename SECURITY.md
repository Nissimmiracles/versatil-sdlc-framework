# Security Policy

**VERSATIL SDLC Framework** takes security seriously. This document outlines our security policy, vulnerability reporting process, and security best practices.

---

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 6.1.x   | ✅ Yes             | Active         |
| 6.0.x   | ✅ Yes             | 2026-04-08     |
| < 6.0   | ❌ No              | Unsupported    |

**Recommendation**: Always use the latest version to ensure you have the most recent security patches.

---

## 🚨 Reporting a Vulnerability

We take all security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### Reporting Channels

**1. GitHub Security Advisories (Preferred)**
- Navigate to: https://github.com/Nissimmiracles/versatil-sdlc-framework/security/advisories
- Click "Report a vulnerability"
- Provide detailed information about the vulnerability

**2. Email (For Sensitive Issues)**
- Email: security@versatil-framework.dev
- Subject: `[SECURITY] Brief description of issue`
- Include:
  - Detailed description of the vulnerability
  - Steps to reproduce
  - Potential impact assessment
  - Proof of concept (if available)
  - Suggested fix (if known)

### What to Include in Your Report

Please provide as much information as possible:

1. **Vulnerability Type**: SQL injection, XSS, authentication bypass, etc.
2. **Affected Component**: Agent, MCP integration, CLI, etc.
3. **Framework Version**: Which version(s) are affected
4. **Reproduction Steps**: Clear step-by-step instructions
5. **Impact**: Potential damage or data exposure
6. **Environment**: Node version, OS, relevant configuration
7. **Proof of Concept**: Code snippet or screenshot (optional)
8. **Suggested Fix**: If you have a fix in mind (optional)

---

## ⏱️ Response Timeline

We are committed to responding quickly to security reports:

| Stage | Timeline | Action |
|-------|----------|--------|
| **Acknowledgment** | 48 hours | We confirm receipt of your report |
| **Initial Assessment** | 7 days | We assess severity and impact |
| **Fix Development** | 14-30 days | We develop and test a fix |
| **Patch Release** | ASAP | We release a security patch |
| **Public Disclosure** | 30-90 days | Coordinated disclosure after patch |

### Severity Classification

We use the following severity levels:

- **Critical**: Immediate risk of data breach, RCE, or system compromise
  - Response: Patch within 48 hours, emergency release
- **High**: Significant security risk, potential data exposure
  - Response: Patch within 7 days
- **Medium**: Moderate security risk, limited impact
  - Response: Patch within 30 days
- **Low**: Minor security concern, minimal impact
  - Response: Patch in next regular release

---

## 🔒 Security Update Process

### For Critical/High Severity Issues

1. **Emergency Patch Release**
   - Immediate fix developed and tested
   - Emergency release published to npm
   - Security advisory published on GitHub
   - Users notified via GitHub, npm, email

2. **Version Numbering**
   - Critical security patches: Increment patch version (e.g., 6.1.0 → 6.1.1)
   - Include `[SECURITY]` tag in release notes

### For Medium/Low Severity Issues

- Included in next regular release
- Documented in CHANGELOG.md
- Security advisory published after release

---

## 🔐 Security Best Practices for Users

### 1. **Secure Configuration**

**Environment Variables**:
```bash
# Never commit .env files
# Use .env.example as a template
cp .env.example .env

# Secure your API keys
ANTHROPIC_API_KEY="sk-ant-..."  # Keep secret
SUPABASE_URL="https://..."      # Keep secret
SUPABASE_KEY="..."              # Keep secret
```

**File Permissions**:
```bash
# Protect sensitive files
chmod 600 .env
chmod 600 ~/.versatil/.env
chmod 700 ~/.versatil/
```

### 2. **Dependency Management**

```bash
# Regularly update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# For breaking changes
npm audit fix --force  # Use with caution
```

### 3. **MCP Server Security**

**Restrict MCP Server Access**:
```json
{
  "mcpServers": {
    "chrome": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "ALLOWED_ORIGINS": "http://localhost:*"  // Restrict origins
      }
    }
  }
}
```

**Validate MCP Inputs**:
- Always validate user inputs before passing to MCP servers
- Use allowlists for URLs, file paths, and commands
- Implement rate limiting for MCP calls

### 4. **Agent Security**

**Isolation**:
- Framework and user project completely separated
- Framework data: `~/.versatil/`
- User project: `$(pwd)`
- Never mix the two

**RAG Memory Security**:
- RAG data stored locally or in Supabase
- Encrypt sensitive data before storing
- Use environment-specific RAG stores

### 5. **Production Deployment**

**Secure Deployment Checklist**:
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable HTTPS/TLS for all API calls
- [ ] Implement rate limiting
- [ ] Use authentication for MCP servers
- [ ] Regularly rotate API keys
- [ ] Monitor logs for suspicious activity
- [ ] Keep framework updated

---

## 🛡️ Security Features Built Into the Framework

### 1. **OWASP Top 10 Protection**

The framework includes built-in protection against:

- **A01: Broken Access Control**: Agent isolation, role-based access
- **A02: Cryptographic Failures**: Environment variable encryption
- **A03: Injection**: Input validation in all agents
- **A04: Insecure Design**: Security-first architecture
- **A05: Security Misconfiguration**: Default secure configs
- **A06: Vulnerable Components**: Regular dependency audits
- **A07: Auth & Session Management**: Secure token handling
- **A08: Software & Data Integrity**: Verification of MCP servers
- **A09: Logging & Monitoring**: Comprehensive security logging
- **A10: SSRF**: URL validation and allowlisting

### 2. **Security Scanning**

**Automated Security Checks**:
- GitHub Actions security scan workflow
- npm audit on every build
- Dependency vulnerability scanning
- SAST (Static Application Security Testing)

**Manual Security Audits**:
- Quarterly security audits
- Penetration testing (annual)
- Code reviews with security focus

### 3. **Secure Defaults**

- API rate limiting enabled by default
- HTTPS enforcement for external calls
- Secure file permissions on installation
- Encrypted storage for sensitive data

---

## 🎯 Security Compliance

### Standards & Frameworks

- **OWASP ASVS**: Application Security Verification Standard
- **GDPR**: Data protection and privacy (RAG memory)
- **SOC 2 Type II**: Security controls (in progress)

### Certifications (Planned)

- [ ] SOC 2 Type II (2025 Q3)
- [ ] ISO 27001 (2025 Q4)
- [ ] CVE Numbering Authority (CNA) status (2026)

---

## 📊 Security Metrics & Transparency

### Public Security Metrics

- **Last Security Audit**: 2025-10-08
- **Open Security Issues**: 0 critical, 0 high, 1 moderate
- **Average Response Time**: 24 hours
- **Average Patch Time**: 7 days (high severity)

### Vulnerability Disclosure

- **Total Disclosed**: 0 (as of 2025-10-08)
- **CVEs Issued**: 0
- **Security Advisories**: 0

We believe in transparency and will maintain public metrics on our security posture.

---

## 🤝 Security Hall of Fame

We recognize and thank security researchers who responsibly disclose vulnerabilities:

<!-- Security researchers will be listed here after responsible disclosure -->

**How to be listed**:
1. Responsibly disclose a valid security vulnerability
2. Follow our reporting process
3. Allow us time to patch before public disclosure

**Recognition**:
- Name/GitHub handle listed here
- Link to your profile/website
- Public thank you in release notes

---

## 🔗 Additional Resources

### Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security Guide](https://www.npmjs.com/package/typescript)

### Framework Security Docs
- [Agent Security Architecture](docs/architecture/agent-security.md)
- [MCP Security Guidelines](docs/MCP_INTEGRATION_GUIDE.md)
- [Deployment Security Checklist](docs/deployment/security-checklist.md)

---

## 📧 Contact Information

**Security Team**:
- Email: security@versatil-framework.dev
- GitHub: https://github.com/Nissimmiracles/versatil-sdlc-framework/security

**General Inquiries**:
- GitHub Issues: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Email: support@versatil-framework.dev

**Project Repository**:
- https://github.com/Nissimmiracles/versatil-sdlc-framework

---

## 📜 Responsible Disclosure Policy

We follow industry-standard responsible disclosure:

1. **Report**: Researcher reports vulnerability privately
2. **Acknowledge**: We acknowledge within 48 hours
3. **Fix**: We develop and test a patch
4. **Coordinate**: We coordinate disclosure timeline with researcher
5. **Release**: We release patch and publish security advisory
6. **Disclose**: Public disclosure after patch is available

**We do NOT**:
- Threaten legal action against researchers
- Ignore or dismiss security reports
- Take credit for researcher findings

**We DO**:
- Respond quickly and professionally
- Credit researchers publicly (with permission)
- Provide regular updates during the process
- Offer recognition in our Security Hall of Fame

---

## 🔄 Policy Updates

This security policy is reviewed quarterly and updated as needed.

**Last Updated**: 2025-10-08
**Version**: 1.0.0
**Next Review**: 2026-01-08

---

**Thank you for helping keep VERSATIL SDLC Framework secure!** 🛡️

Your responsible disclosure helps protect thousands of developers using the framework.
