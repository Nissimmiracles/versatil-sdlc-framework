import { BaseAgent, AgentActivationContext, AgentResponse } from '../agent-dispatcher';

/**
 * Security-Sam - Security & Compliance Specialist
 * Handles authentication, authorization, encryption, security audits, and compliance
 */
export class SecuritySam extends BaseAgent {
  constructor() {
    super('security-sam', 'Security & Compliance');
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const { trigger, filePath, content, matchedKeywords = [], emergency = false } = context;

    // Analyze security patterns and vulnerabilities
    const securityAnalysis = this.analyzeSecurityPatterns(content, filePath);
    const vulnerabilities = this.detectVulnerabilities(content, filePath);
    const recommendations = this.generateSecurityRecommendations(securityAnalysis, vulnerabilities);

    return {
      agentId: this.id,
      message: this.generateResponse(securityAnalysis, vulnerabilities, recommendations, emergency),
      suggestions: recommendations,
      priority: emergency ? 'critical' : this.calculatePriority(securityAnalysis, vulnerabilities),
      handoffTo: this.determineHandoffs(securityAnalysis, vulnerabilities),
      context: {
        securityLevel: securityAnalysis.level,
        vulnerabilities: vulnerabilities.length,
        complianceStatus: securityAnalysis.compliance,
        emergencyResponse: emergency
      }
    };
  }

  private analyzeSecurityPatterns(content: string, filePath?: string) {
    const analysis = {
      level: 'basic',
      authentication: false,
      authorization: false,
      encryption: false,
      compliance: 'unknown',
      frameworks: [] as string[],
      protocols: [] as string[],
      certifications: [] as string[]
    };

    if (!content) return analysis;

    // Authentication patterns
    const authPatterns = {
      jwt: /jwt|jsonwebtoken|token|bearer/i,
      oauth: /oauth|openid|oidc|authorization_code/i,
      saml: /saml|assertion|sp_|idp_/i,
      basic: /basic\s+auth|username.*password/i,
      mfa: /mfa|2fa|totp|authenticator/i,
      passport: /passport|strategy|session/i
    };

    // Authorization patterns
    const authzPatterns = {
      rbac: /role.*based|rbac|permissions|roles/i,
      abac: /attribute.*based|abac|policy/i,
      acl: /access.*control.*list|acl/i,
      middleware: /auth.*middleware|authorize|can.*access/i
    };

    // Encryption patterns
    const encryptionPatterns = {
      tls: /tls|ssl|https|certificate/i,
      aes: /aes|encrypt|decrypt|cipher/i,
      hash: /bcrypt|scrypt|argon|pbkdf|hash/i,
      crypto: /crypto|cryptography|signing|signature/i
    };

    // Compliance patterns
    const compliancePatterns = {
      gdpr: /gdpr|data.*protection|privacy.*policy/i,
      hipaa: /hipaa|phi|health.*information/i,
      pci: /pci.*dss|payment.*card|credit.*card/i,
      sox: /sarbanes.*oxley|sox|financial.*reporting/i,
      iso27001: /iso.*27001|information.*security.*management/i
    };

    // Check authentication
    Object.entries(authPatterns).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        analysis.authentication = true;
        analysis.frameworks.push(type);
      }
    });

    // Check authorization
    Object.entries(authzPatterns).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        analysis.authorization = true;
        analysis.frameworks.push(type);
      }
    });

    // Check encryption
    Object.entries(encryptionPatterns).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        analysis.encryption = true;
        analysis.protocols.push(type);
      }
    });

    // Check compliance
    Object.entries(compliancePatterns).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        analysis.compliance = type;
        analysis.certifications.push(type);
      }
    });

    // Determine security level
    if (analysis.authentication && analysis.authorization && analysis.encryption) {
      analysis.level = 'advanced';
    } else if ((analysis.authentication && analysis.authorization) || analysis.encryption) {
      analysis.level = 'intermediate';
    } else if (analysis.authentication || analysis.authorization) {
      analysis.level = 'basic';
    }

    return analysis;
  }

  private detectVulnerabilities(content: string, filePath?: string) {
    const vulnerabilities = [];

    if (!content) return vulnerabilities;

    // Common vulnerability patterns
    const vulnPatterns = {
      sqlInjection: {
        pattern: /query.*\+|execute.*\+|sql.*\+.*user|select.*\+.*input/i,
        severity: 'high',
        message: 'Potential SQL injection vulnerability detected'
      },
      xss: {
        pattern: /innerHTML|document\.write|eval\(|dangerouslySetInnerHTML/i,
        severity: 'high',
        message: 'Potential XSS vulnerability detected'
      },
      hardcodedSecrets: {
        pattern: /(password|api_key|secret|token)\s*=\s*["'][^"']+["']/i,
        severity: 'critical',
        message: 'Hardcoded secrets detected'
      },
      weakCrypto: {
        pattern: /md5|sha1(?![\d])|des|rc4|blowfish/i,
        severity: 'medium',
        message: 'Weak cryptographic algorithm detected'
      },
      insecureRandom: {
        pattern: /Math\.random|Random\(\)|rand\(\)/i,
        severity: 'medium',
        message: 'Insecure random number generation'
      },
      pathTraversal: {
        pattern: /\.\./i,
        severity: 'high',
        message: 'Path traversal vulnerability detected'
      },
      insecureDeserialization: {
        pattern: /pickle\.loads|yaml\.load|eval\(|unserialize/i,
        severity: 'high',
        message: 'Insecure deserialization detected'
      },
      csrfMissing: {
        pattern: /method.*post|form.*submit/i,
        antiPattern: /csrf|xsrf|token/i,
        severity: 'medium',
        message: 'Missing CSRF protection'
      }
    };

    Object.entries(vulnPatterns).forEach(([vulnType, config]) => {
      if (config.pattern.test(content)) {
        // Check for anti-pattern (e.g., CSRF protection exists)
        if ('antiPattern' in config && config.antiPattern.test(content)) {
          return; // Skip if protection is present
        }

        vulnerabilities.push({
          type: vulnType,
          severity: config.severity,
          message: config.message,
          filePath: filePath || 'unknown'
        });
      }
    });

    // File-specific checks
    if (filePath) {
      if (filePath.includes('.env') && !filePath.includes('.example')) {
        vulnerabilities.push({
          type: 'environmentFile',
          severity: 'medium',
          message: 'Environment file should not be committed to version control',
          filePath
        });
      }

      if (filePath.includes('package.json') || filePath.includes('requirements.txt')) {
        // Check for known vulnerable packages (simplified check)
        const vulnPackages = ['lodash@<4.17.21', 'axios@<0.21.2', 'express@<4.17.3'];
        vulnPackages.forEach(pkg => {
          const [name, version] = pkg.split('@');
          if (content.includes(name)) {
            vulnerabilities.push({
              type: 'vulnerablePackage',
              severity: 'high',
              message: `Potentially vulnerable package detected: ${name}`,
              filePath
            });
          }
        });
      }
    }

    return vulnerabilities;
  }

  private generateSecurityRecommendations(analysis: any, vulnerabilities: any[]) {
    const recommendations = [];

    // Authentication recommendations
    if (!analysis.authentication) {
      recommendations.push({
        type: 'authentication',
        message: 'Implement proper authentication mechanism (JWT, OAuth, or similar)',
        priority: 'high'
      });
    }

    // Authorization recommendations
    if (!analysis.authorization) {
      recommendations.push({
        type: 'authorization',
        message: 'Implement role-based access control (RBAC) or similar authorization',
        priority: 'high'
      });
    }

    // Encryption recommendations
    if (!analysis.encryption) {
      recommendations.push({
        type: 'encryption',
        message: 'Implement data encryption for sensitive information',
        priority: 'medium'
      });
    }

    // Vulnerability-specific recommendations
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = vulnerabilities.filter(v => v.severity === 'high');

    if (criticalVulns.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `Address ${criticalVulns.length} critical security vulnerabilities immediately`,
        priority: 'critical'
      });
    }

    if (highVulns.length > 0) {
      recommendations.push({
        type: 'high',
        message: `Fix ${highVulns.length} high-severity security issues`,
        priority: 'high'
      });
    }

    // Security tooling recommendations
    recommendations.push({
      type: 'tools',
      message: 'Implement automated security scanning in CI/CD pipeline',
      priority: 'medium'
    });

    // Compliance recommendations
    if (analysis.compliance === 'unknown') {
      recommendations.push({
        type: 'compliance',
        message: 'Evaluate compliance requirements and implement necessary controls',
        priority: 'low'
      });
    }

    return recommendations;
  }

  private generateResponse(analysis: any, vulnerabilities: any[], recommendations: any[], emergency: boolean) {
    let response = `🔒 **Security-Sam Analysis** - Security & Compliance\n\n`;

    if (emergency) {
      response += `🚨 **EMERGENCY SECURITY RESPONSE** 🚨\n\n`;
    }

    response += `**Security Level**: ${analysis.level}\n`;
    response += `**Vulnerabilities Found**: ${vulnerabilities.length}\n`;
    response += `**Compliance Status**: ${analysis.compliance}\n\n`;

    // Security features detected
    const features = [];
    if (analysis.authentication) features.push('Authentication');
    if (analysis.authorization) features.push('Authorization');
    if (analysis.encryption) features.push('Encryption');

    if (features.length > 0) {
      response += `✅ **Security Features**: ${features.join(', ')}\n`;
    }

    if (analysis.frameworks.length > 0) {
      response += `📦 **Frameworks**: ${analysis.frameworks.join(', ')}\n`;
    }

    // Vulnerabilities summary
    if (vulnerabilities.length > 0) {
      response += `\n🚨 **Security Issues**:\n`;

      const severityGroups = vulnerabilities.reduce((groups, vuln) => {
        groups[vuln.severity] = (groups[vuln.severity] || 0) + 1;
        return groups;
      }, {} as Record<string, number>);

      Object.entries(severityGroups).forEach(([severity, count]) => {
        const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
        response += `${emoji} ${severity.toUpperCase()}: ${count}\n`;
      });

      // Show first few vulnerabilities
      response += `\n**Top Issues**:\n`;
      vulnerabilities.slice(0, 3).forEach((vuln, index) => {
        response += `${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.message}\n`;
      });
    }

    // Recommendations
    if (recommendations.length > 0) {
      response += `\n**Security Recommendations**:\n`;
      recommendations.forEach((rec, index) => {
        response += `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}\n`;
      });
    }

    return response;
  }

  private calculatePriority(analysis: any, vulnerabilities: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
    const highVulns = vulnerabilities.filter(v => v.severity === 'high');

    if (criticalVulns.length > 0) {
      return 'critical';
    }
    if (highVulns.length > 0 || (!analysis.authentication && !analysis.authorization)) {
      return 'high';
    }
    if (vulnerabilities.length > 0 || analysis.level === 'basic') {
      return 'medium';
    }
    return 'low';
  }

  private determineHandoffs(analysis: any, vulnerabilities: any[]): string[] {
    const handoffs = [];

    // Always coordinate with PM for security planning
    handoffs.push('sarah-pm');

    // If authentication/authorization issues, handoff to backend
    if (!analysis.authentication || !analysis.authorization) {
      handoffs.push('marcus-backend');
    }

    // If frontend security issues (XSS, etc.)
    const frontendVulns = vulnerabilities.filter(v =>
      v.type === 'xss' || v.message.includes('frontend')
    );
    if (frontendVulns.length > 0) {
      handoffs.push('james-frontend');
    }

    // If critical vulnerabilities, involve QA for testing
    if (vulnerabilities.some(v => v.severity === 'critical')) {
      handoffs.push('maria-qa');
    }

    // If infrastructure security issues, involve DevOps
    if (analysis.protocols.includes('tls') || vulnerabilities.some(v =>
      v.message.includes('certificate') || v.message.includes('infrastructure')
    )) {
      handoffs.push('devops-dan');
    }

    return handoffs;
  }
}

export default SecuritySam;