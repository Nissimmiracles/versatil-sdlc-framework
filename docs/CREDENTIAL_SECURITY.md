# VERSATIL Credential Security Model

**Version**: 7.6.0
**Last Updated**: 2025-10-27
**Status**: Production Ready

---

## Overview

VERSATIL SDLC Framework implements **project-level credential isolation** with **AES-256-GCM encryption** and comprehensive **audit logging**. This document explains the security architecture, threat model, and best practices.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Encryption Details](#encryption-details)
3. [Project Isolation](#project-isolation)
4. [Audit Trail](#audit-trail)
5. [Team Workflows](#team-workflows)
6. [Threat Model](#threat-model)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)
9. [FAQ](#faq)

---

## Security Architecture

### Design Principles

1. **Defense in Depth**: Multiple security layers
2. **Zero Trust**: Assume breach, minimize blast radius
3. **Principle of Least Privilege**: Only load credentials when needed
4. **Auditability**: All access logged with tamper-evident chain
5. **Isolation**: Project credentials never cross boundaries

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Encryption at Rest (AES-256-GCM)            │
│  ├─ Credentials encrypted before disk write            │
│  ├─ PBKDF2 key derivation (600,000 iterations)         │
│  └─ Authentication tags prevent tampering              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Project Isolation                            │
│  ├─ Each project: separate credentials.json            │
│  ├─ Machine-specific encryption keys                   │
│  └─ No cross-project access possible                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Runtime Protection                           │
│  ├─ Credentials loaded into process.env on-demand      │
│  ├─ Auto-cleared after use (configurable timeout)      │
│  └─ Memory safety: no credential persistence           │
└─────────────────────────────────────────────────────────┘
```

---

## Encryption Details

### Algorithm: AES-256-GCM

**Why AES-256-GCM?**
- **Authenticated encryption**: Prevents tampering (integrity + confidentiality)
- **NIST-approved**: FIPS 140-2 compliant
- **Performance**: Hardware-accelerated on modern CPUs
- **Industry standard**: Used by Google, AWS, Azure

### Key Derivation (PBKDF2-HMAC-SHA512)

```typescript
// Machine + Project = Unique Key
const passphrase = `${projectSignature}:${projectId}:${machineId}`;

// PBKDF2 with high iteration count (OWASP 2023 recommendation)
const key = crypto.pbkdf2Sync(
  passphrase,
  salt,           // Random 32-byte salt
  600000,         // 600,000 iterations (>100ms compute time)
  32,             // 256-bit key
  'sha512'        // HMAC-SHA512
);
```

**Parameters:**
- **Iterations**: 600,000 (OWASP 2023: minimum 210,000 for PBKDF2-SHA512)
- **Salt**: 32 bytes, cryptographically random per-project
- **Key Length**: 256 bits (AES-256)
- **Digest**: SHA-512 (512-bit output, truncated to 256 bits)

### Encrypted File Structure

```json
{
  "version": "1.0.0",
  "algorithm": "aes-256-gcm",
  "salt": "a1b2c3...",          // Hex-encoded (32 bytes)
  "iv": "d4e5f6...",             // Hex-encoded (16 bytes)
  "authTag": "g7h8i9...",        // Hex-encoded (16 bytes, GCM authentication)
  "ciphertext": "j0k1l2...",     // Hex-encoded (variable length)
  "metadata": {
    "projectId": "project-abc123",
    "createdAt": "2025-10-27T12:00:00Z",
    "lastModified": "2025-10-27T12:00:00Z"
  }
}
```

**Security Properties:**
- **Tampering detection**: Any modification invalidates `authTag`
- **Unique per-project**: `salt` + `projectId` ensure unique keys
- **Forward secrecy**: Compromising one project ≠ compromising others
- **Metadata integrity**: Included in authentication tag

---

## Project Isolation

### File Structure

```
project-a/
└── .versatil/
    ├── config.json              # ✅ Safe to commit (project settings)
    ├── credentials.json         # ❌ NEVER commit (encrypted credentials)
    └── logs/
        └── credential-audit.jsonl  # ❌ NEVER commit (access logs)

project-b/
└── .versatil/
    ├── config.json              # ✅ Different project, different config
    ├── credentials.json         # ❌ Different encryption key!
    └── logs/
        └── credential-audit.jsonl
```

### Isolation Guarantees

| Property | Guarantee | Mechanism |
|----------|-----------|-----------|
| **No Cross-Project Access** | ✅ Enforced | Encryption keys derived from `projectPath` |
| **No Global Credentials** | ✅ Deprecated | Migration script moves `~/.versatil/.env` → project-level |
| **File Permissions** | ✅ 0600 | Owner read/write only (Unix permissions) |
| **Git Safety** | ✅ Gitignored | `.gitignore` blocks `credentials.json`, audit logs |

---

## Audit Trail

### Tamper-Evident Logging

Every credential access is logged with **hash chaining** (similar to blockchain):

```
Entry 1: hash = SHA256(data1 + previousHash="")
Entry 2: hash = SHA256(data2 + previousHash=hash1)
Entry 3: hash = SHA256(data3 + previousHash=hash2)
...
```

**Tampering detection:** Modifying Entry 2 invalidates all subsequent hashes.

### Audit Log Format

```jsonl
{"id":"uuid","timestamp":"2025-10-27T12:00:00Z","projectId":"project-abc","service":"github","credentialKey":"GITHUB_TOKEN","action":"load","success":true,"user":"john","hostname":"macbook-pro","hash":"a1b2c3..."}
{"id":"uuid","timestamp":"2025-10-27T12:05:00Z","projectId":"project-abc","service":"supabase","credentialKey":"SUPABASE_URL","action":"read","success":true,"user":"john","hostname":"macbook-pro","hash":"d4e5f6..."}
```

**JSONL format**: One JSON object per line (easy to stream, append-only)

### Anomaly Detection

Automatic detection of suspicious patterns:
- **High failure rate**: >30% failed access attempts
- **Unusual timing**: Access during 2-5 AM
- **Rapid access**: >50 accesses in 1 hour
- **Multiple failures**: ≥3 failed attempts in 10 minutes

**Risk scoring:** 0-100 (threshold: 30 for alert)

### Audit Commands

```bash
# View project credential access summary (last 30 days)
node -e "
  const { getCredentialAuditLogger } = require('./dist/security/credential-audit-logger.js');
  getCredentialAuditLogger().getProjectSummary('project-abc', 30).then(console.log);
"

# Detect anomalies
node -e "
  const { getCredentialAuditLogger } = require('./dist/security/credential-audit-logger.js');
  getCredentialAuditLogger().detectAnomalies('project-abc').then(console.log);
"

# Verify log integrity
node -e "
  const { getCredentialAuditLogger } = require('./dist/security/credential-audit-logger.js');
  getCredentialAuditLogger().verifyLogIntegrity().then(console.log);
"
```

---

## Team Workflows

### Scenario 1: New Team Member Onboarding

```bash
# Senior developer exports credentials
versatil-credentials-export --password "team-secret-2025" --service github

# Shares file: .versatil/credentials-export-github.json.enc

# New team member imports
cd /path/to/project
versatil-credentials-import credentials-export-github.json.enc
# Prompts for password: team-secret-2025

# ✅ GitHub credentials now available in their local project
```

### Scenario 2: Rotating Credentials

```bash
# Update credentials interactively
versatil-credentials setup

# Select service: GitHub
# Enter new credentials
# ✅ Old credentials overwritten, new ones encrypted

# Audit trail shows:
# - Old credentials: action=delete
# - New credentials: action=write
```

### Scenario 3: Multi-Project Developer

```bash
# Project A
cd ~/projects/project-a
versatil-credentials setup    # Configure Supabase for Project A

# Project B
cd ~/projects/project-b
versatil-credentials setup    # Configure DIFFERENT Supabase for Project B

# ✅ Isolation: Project A credentials ≠ Project B credentials
# Each project has its own encrypted credentials.json
```

---

## Threat Model

### Threats We Mitigate

| Threat | Mitigation | Status |
|--------|-----------|--------|
| **Credential theft via file access** | AES-256-GCM encryption | ✅ Mitigated |
| **Cross-project credential leakage** | Project-specific keys | ✅ Mitigated |
| **Tampering with credentials file** | GCM authentication tags | ✅ Detected |
| **Unauthorized credential access** | Audit logging | ✅ Detected |
| **Memory scraping attacks** | Auto-clear after use | ✅ Reduced |
| **Git commit of credentials** | `.gitignore` + warnings | ✅ Prevented |
| **Brute-force attacks** | PBKDF2 (600k iterations) | ✅ Slowed |

### Threats We Do NOT Mitigate

| Threat | Why Not Mitigated | User Responsibility |
|--------|-------------------|---------------------|
| **Root/admin access on machine** | Encryption keys in memory | Use disk encryption (FileVault, BitLocker) |
| **Malicious code execution** | Code can read process.env | Code review, sandboxing |
| **Physical access to unlocked machine** | Credentials decrypted in RAM | Lock screen when away |
| **Compromised team password** | Shared secret | Use strong passwords, rotate regularly |
| **Keylogger/malware** | Credentials entered interactively | Use antivirus, secure OS |

**Key insight:** Credential security is **defense in depth**, not absolute. We reduce attack surface, not eliminate it.

---

## Best Practices

### For Individual Developers

1. **Never commit credentials** - Always in `.gitignore`
2. **Use strong machine security** - Disk encryption, screen lock, firewall
3. **Rotate credentials regularly** - Quarterly for production, yearly for dev
4. **Review audit logs** - Check for suspicious access patterns
5. **Lock screen when away** - Credentials decrypted in memory while running

### For Teams

1. **Use team passwords for exports** - Strong, rotated passwords (e.g., `TeamPass2025-Q4`)
2. **Limit credential scope** - Use read-only tokens when possible
3. **Establish rotation policy** - Document when to rotate (e.g., employee departure)
4. **Monitor audit logs** - Periodic reviews (weekly/monthly)
5. **Incident response plan** - What to do if credentials compromised

### For CI/CD

1. **Use CI-specific credentials** - Separate from developer credentials
2. **Inject at runtime** - Store in CI secrets (GitHub Actions, GitLab CI)
3. **Short-lived tokens** - Prefer OAuth with expiration over static keys
4. **Audit CI access** - Review which workflows have credential access
5. **Rotate on suspicious activity** - Automatic rotation on failed builds

---

## Migration Guide

### From Global to Project-Level (v7.6.0)

**Automatic Migration:**

```bash
cd /path/to/project
node scripts/migrate-credentials-to-project.cjs

# Script will:
# 1. Read ~/.versatil/.env
# 2. Encrypt credentials per-project
# 3. Save to <project>/.versatil/credentials.json
# 4. Backup global .env
# 5. Optionally delete global .env
```

**Manual Migration:**

```bash
# 1. Export from global
cat ~/.versatil/.env  # Copy credentials

# 2. Import to project
cd /path/to/project
versatil-credentials setup
# Paste credentials when prompted

# 3. Verify
npm run mcp:health

# 4. Backup and delete global
mv ~/.versatil/.env ~/.versatil/.env.backup
rm ~/.versatil/.env
```

---

## FAQ

### Q: Can I use the same credentials across multiple projects?

**A:** Yes, but each project stores them separately (encrypted with different keys). Use the export/import workflow:

```bash
# Project A
cd ~/projects/project-a
versatil-credentials-export --password "shared-pass" --service supabase

# Project B
cd ~/projects/project-b
versatil-credentials-import ../project-a/.versatil/credentials-export-supabase.json.enc
```

### Q: What if I lose my credentials file?

**A:** The encrypted `credentials.json` is the **only** copy. If lost:
1. Re-run credential setup: `versatil-credentials setup`
2. Enter credentials again
3. Consider backing up to secure location (password manager, encrypted USB)

**Prevention:** Export to password-protected file, store in secure location.

### Q: Can I store credentials in a password manager?

**A:** Yes! Recommended approach:
1. Use credential wizard to generate encrypted file
2. Export with strong password: `versatil-credentials-export --password "$(pwgen 32 1)"`
3. Store exported file + password in password manager (1Password, Bitwarden)
4. Delete local credentials: `rm .versatil/credentials.json`
5. Import when needed: `versatil-credentials-import ...`

### Q: How do I rotate credentials?

**A:** Run setup again:

```bash
versatil-credentials setup
# Select service to update
# Enter new credentials
# ✅ Old credentials overwritten
```

Audit trail will show: `action=delete` (old) + `action=write` (new).

### Q: Are credentials backed up automatically?

**A:** No. Encrypted credentials are **not backed up** by default. You must:
1. Export to team-shared file (with password)
2. Store exported file securely (password manager, encrypted cloud storage)
3. OR: Include `.versatil/credentials-export-*.json.enc` in backups (encrypted, password-protected)

### Q: Can credentials be decrypted on another machine?

**A:** No, by design. Encryption keys are derived from:
- Project path
- Project ID
- **Machine ID** (hostname + username + home directory)

**Workaround for team sharing:** Use export/import with password:
```bash
# Machine A
versatil-credentials-export --password "team-pass"

# Machine B
versatil-credentials-import credentials-export.json.enc
```

### Q: What happens if credentials file is corrupted?

**A:** You'll see: `Decryption failed: Invalid password or corrupted credentials file`

**Recovery:**
1. Check for backup: `.versatil/credential-backup-*.json.enc`
2. Restore from team export (if available)
3. Last resort: Re-enter credentials with `versatil-credentials setup`

---

## Security Contact

If you discover a security vulnerability in the credential system:

**DO NOT** open a public GitHub issue.

**DO** email: security@versatil-framework.dev (coming soon)

Or open a **private security advisory** on GitHub.

---

## Changelog

### v7.6.0 (2025-10-27)
- ✅ **NEW**: Project-level credential encryption
- ✅ **NEW**: AES-256-GCM with PBKDF2 key derivation
- ✅ **NEW**: Audit logging with tamper-evident chain
- ✅ **NEW**: Export/import tools for team workflows
- ✅ **NEW**: Migration script from global to project-level
- 🔐 **BREAKING**: Deprecated `~/.versatil/.env` (migrate with script)

---

## References

- **OWASP Password Storage Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- **NIST SP 800-132**: PBKDF Recommendation
- **RFC 5869**: HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
- **FIPS 140-2**: Security Requirements for Cryptographic Modules

---

**License**: MIT
**Maintained by**: VERSATIL SDLC Framework Team
