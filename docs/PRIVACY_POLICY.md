# VERSATIL SDLC Framework - Privacy Policy

**Last Updated**: October 9, 2025
**Version**: 6.1.0
**Effective Date**: October 9, 2025

---

## 1. Introduction

This Privacy Policy explains how the VERSATIL SDLC Framework ("Framework", "we", "our") collects, uses, stores, and protects data when you use our Model Context Protocol (MCP) server and AI-native development tools.

The VERSATIL SDLC Framework is designed with **privacy-first principles** and **local-first architecture**. All framework data is stored locally on your machine in `~/.versatil/` unless you explicitly configure external services.

---

## 2. Data Collection

### 2.1 What Data We Collect

The Framework collects the following types of data **locally on your machine**:

#### **A. File and Project Metadata**
- File paths and names (for agent analysis)
- Project structure information
- File sizes and modification timestamps
- Programming language detection

#### **B. Code Metrics and Analysis Results**
- Code coverage percentages
- Code complexity scores (cyclomatic complexity, maintainability index)
- Test results (pass/fail status, execution time)
- Quality gate results (security scans, linting, type checking)
- Performance metrics (response times, memory usage)

#### **C. Agent Performance Data**
- Agent activation timestamps
- Agent execution duration
- Agent success/failure rates
- Agent recommendations and actions taken

#### **D. Framework Telemetry**
- Framework version and configuration
- Installed agents and their versions
- MCP server uptime and health metrics
- Error logs and stack traces (sanitized)

#### **E. User Preferences**
- Agent activation preferences
- Quality gate thresholds
- Notification settings
- Theme and UI preferences

### 2.2 What Data We DO NOT Collect

The Framework **does not collect**:
- ❌ Source code content (unless explicitly analyzed by local agents)
- ❌ Credentials or API keys
- ❌ Personal information (name, email, etc.)
- ❌ Conversational data from Claude or other AI assistants
- ❌ Data from previous chat sessions
- ❌ Browsing history or unrelated file activity

---

## 3. How We Use Your Data

### 3.1 Local Processing

All data is processed **locally on your machine** for the following purposes:

#### **Agent Analysis**
- Providing code quality recommendations
- Identifying security vulnerabilities
- Suggesting performance optimizations
- Generating test cases

#### **Framework Improvement**
- Enhancing agent accuracy through adaptive learning (local RAG system)
- Improving recommendation quality
- Debugging framework issues

#### **User Experience**
- Preserving user preferences across sessions
- Providing context-aware suggestions
- Tracking agent performance for optimization

### 3.2 No External Transmission

**The Framework does NOT transmit your data to external servers** unless you explicitly configure third-party services (see Section 4).

---

## 4. Third-Party Services (Optional)

The Framework **optionally integrates** with third-party services **only if you configure them**. These services are entirely optional and disabled by default.

### 4.1 Supabase (Optional)
**Purpose**: Vector database for RAG (Retrieval-Augmented Generation) memory

**Data Shared**:
- Code pattern embeddings (vector representations, not actual code)
- Agent learning data
- Project metadata

**Privacy Note**: Supabase stores only **embeddings** (mathematical representations) of your code patterns, not the source code itself. You control your Supabase instance and data.

**How to Enable/Disable**:
```bash
# Disable Supabase
rm ~/.versatil/.env  # Remove SUPABASE_* variables

# Or set in .env
SUPABASE_ENABLED=false
```

### 4.2 Google Vertex AI (Optional)
**Purpose**: AI-powered code analysis and embeddings

**Data Shared**:
- Code snippets for analysis (only when explicitly invoked)
- Generated embeddings for semantic search

**Privacy Note**: Data sent to Vertex AI is subject to [Google Cloud Privacy Policy](https://cloud.google.com/terms/cloud-privacy-notice).

**How to Enable/Disable**:
```bash
# Disable Vertex AI
unset GOOGLE_CLOUD_PROJECT
unset GOOGLE_APPLICATION_CREDENTIALS
```

### 4.3 GitHub (Optional)
**Purpose**: Repository management, PR automation, issue tracking

**Data Shared**:
- Repository metadata (commits, branches, PRs, issues)
- User information (username, email from git config)

**Privacy Note**: Data shared with GitHub is subject to [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

**How to Enable/Disable**:
```bash
# Disable GitHub integration
unset GITHUB_TOKEN
```

### 4.4 Other Optional Services

The following services are **entirely optional** and require explicit configuration:

- **Sentry**: Error monitoring (only if configured)
- **Docker Hub**: Container registry (only for deployment)
- **Figma**: Design integration (only for James-Frontend agent)
- **Jira/Linear**: Project management (only for Sarah-PM agent)

**All third-party integrations are opt-in and require explicit credential configuration.**

---

## 5. Data Storage and Security

### 5.1 Local Storage

All framework data is stored in `~/.versatil/` with the following structure:

```
~/.versatil/
├── .env                # Credentials (600 permissions, user-only)
├── config.json         # Framework configuration
├── agents/             # Agent data and state
├── memory/             # RAG memory (embeddings, patterns)
├── logs/               # Framework logs (sanitized)
└── backups/            # Automatic backups before upgrades
```

### 5.2 Security Measures

#### **File Permissions**
- All files in `~/.versatil/` have **600 permissions** (user read/write only)
- Credentials file (`.env`) is explicitly chmod 600 on creation

#### **Data Sanitization**
- Error logs automatically remove sensitive paths (e.g., `/Users/username/` → `~/`)
- Stack traces exclude sensitive information
- No credentials logged

#### **Encryption**
- Credentials in `.env` are **not encrypted** (plain text) but protected by file permissions
- Consider using OS-level encryption (FileVault on macOS, LUKS on Linux) for additional security

### 5.3 Data Retention

- **Agent Data**: Retained indefinitely unless manually deleted
- **Logs**: Rotated after 10MB, max 5 log files retained
- **Backups**: Old backups auto-deleted after 5 versions
- **RAG Memory**: Retained indefinitely to improve recommendations

**To delete all data**:
```bash
rm -rf ~/.versatil/
```

---

## 6. User Rights and Control

### 6.1 Your Rights

You have the following rights regarding your data:

1. **Right to Access**: View all data stored in `~/.versatil/`
2. **Right to Deletion**: Delete any or all framework data
3. **Right to Export**: Export data in JSON format
4. **Right to Opt-Out**: Disable data collection features

### 6.2 How to Exercise Your Rights

#### **View All Data**
```bash
# List all files
ls -lah ~/.versatil/

# View configuration
cat ~/.versatil/config.json

# View logs
tail -f ~/.versatil/logs/versatil.log
```

#### **Delete Specific Data**
```bash
# Delete logs only
rm ~/.versatil/logs/*.log

# Delete RAG memory only
rm -rf ~/.versatil/memory/

# Delete all data
rm -rf ~/.versatil/
```

#### **Export Data**
```bash
# Export configuration
cp ~/.versatil/config.json ~/versatil-export.json

# Export agent data
tar -czf ~/versatil-export.tar.gz ~/.versatil/
```

#### **Opt-Out of Data Collection**
```bash
# Disable agent learning (RAG)
echo "RAG_ENABLED=false" >> ~/.versatil/.env

# Disable performance monitoring
echo "PERFORMANCE_MONITORING=false" >> ~/.versatil/.env
```

---

## 7. Children's Privacy

The Framework is intended for professional software developers and is not directed to children under 13. We do not knowingly collect data from children.

---

## 8. International Data Transfers

Since all data is stored **locally on your machine**, there are no international data transfers unless you configure third-party services (Section 4) that may be hosted in different regions.

---

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Significant changes will be communicated through:
- GitHub repository release notes
- Framework update notifications
- This document (with updated "Last Updated" date)

**You are encouraged to review this policy periodically.**

---

## 10. Contact Information

If you have questions about this Privacy Policy, please contact us:

- **GitHub Issues**: https://github.com/MiraclesGIT/versatil-sdlc-framework/issues
- **Email**: [Contact through GitHub repository]
- **Documentation**: https://github.com/MiraclesGIT/versatil-sdlc-framework/docs

---

## 11. Compliance

The VERSATIL SDLC Framework is designed to comply with:

- **GDPR** (General Data Protection Regulation) - EU
- **CCPA** (California Consumer Privacy Act) - USA
- **PIPEDA** (Personal Information Protection and Electronic Documents Act) - Canada

**Note**: Since all data is stored locally by default, most data protection regulations do not apply unless you configure third-party services.

---

## 12. Summary

### ✅ Key Takeaways

- **Local-First**: All data stored on your machine in `~/.versatil/`
- **No External Transmission**: Data never leaves your machine unless you configure third-party services
- **User Control**: You own and control all data
- **Opt-In Third-Party**: External services (Supabase, Vertex AI, GitHub) are optional and require explicit configuration
- **Transparent**: All data storage is in plain JSON files you can inspect
- **Secure**: File permissions protect sensitive data (600 permissions)

### ❌ What We Don't Do

- ❌ We do NOT collect source code content
- ❌ We do NOT transmit data to external servers (unless you configure them)
- ❌ We do NOT share data with third parties (without your configuration)
- ❌ We do NOT collect conversational data
- ❌ We do NOT track you across websites or applications

---

**By using the VERSATIL SDLC Framework, you acknowledge that you have read and understood this Privacy Policy.**

---

**Version History**:
- v6.1.0 (2025-10-09): Initial MCP certification privacy policy
