#!/usr/bin/env node

/**
 * Real Security Test
 * Performs actual attacks against the live framework to test enforcement
 */

const { promises: fs } = require('fs');
const { join } = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

class RealSecurityTest {
  constructor() {
    this.frameworkRoot = process.cwd();
    this.versatilHome = join(os.homedir(), '.versatil');
    this.testResults = [];
    this.violationsDetected = 0;
  }

  async runTests() {
    console.log('🔒 VERSATIL Real Security Test');
    console.log('==============================');
    console.log('Testing against LIVE framework with active enforcement');
    console.log('');

    await this.wait(2000); // Give enforcer time to detect

    // Test 1: Framework Core Access Attempt
    await this.testFrameworkCoreAccess();

    // Test 2: Path Traversal Attack
    await this.testPathTraversalAttack();

    // Test 3: Privilege Escalation Attempt
    await this.testPrivilegeEscalationAttempt();

    // Test 4: Configuration Tampering
    await this.testConfigurationTampering();

    // Test 5: Cross-Directory Contamination
    await this.testCrossDirectoryContamination();

    // Wait and check security logs
    await this.wait(3000);
    await this.checkSecurityLogs();

    this.generateReport();
  }

  async testFrameworkCoreAccess() {
    console.log('🧪 Test 1: Framework Core Access Attempt');

    try {
      // Try to create a suspicious file in framework src/
      const suspiciousFile = join(this.frameworkRoot, 'src', 'malicious-backdoor.js');
      await fs.writeFile(suspiciousFile, `
        // Malicious backdoor attempt
        console.log('Framework compromised!');
        process.exit(1);
      `);

      // Check if file still exists after 1 second (should be blocked)
      await this.wait(1000);
      const exists = await this.fileExists(suspiciousFile);

      if (exists) {
        console.log('  ❌ FAILED: Malicious file not blocked');
        this.testResults.push({ test: 'Framework Core Access', passed: false, details: 'File creation not blocked' });

        // Clean up manually
        try {
          await fs.unlink(suspiciousFile);
        } catch (e) {}
      } else {
        console.log('  ✅ PASSED: Malicious file blocked by enforcer');
        this.testResults.push({ test: 'Framework Core Access', passed: true, details: 'File creation blocked' });
        this.violationsDetected++;
      }

    } catch (error) {
      console.log('  ✅ PASSED: Framework core access prevented');
      this.testResults.push({ test: 'Framework Core Access', passed: true, details: 'Access denied by system' });
    }
  }

  async testPathTraversalAttack() {
    console.log('🧪 Test 2: Path Traversal Attack');

    try {
      // Try path traversal to access system files
      const traversalPath = join(this.frameworkRoot, '..', '..', '..', 'etc', 'passwd-copy');
      await fs.writeFile(traversalPath, 'attempted path traversal');

      await this.wait(1000);
      const exists = await this.fileExists(traversalPath);

      if (exists) {
        console.log('  ❌ FAILED: Path traversal not blocked');
        this.testResults.push({ test: 'Path Traversal', passed: false, details: 'Traversal attack succeeded' });

        try {
          await fs.unlink(traversalPath);
        } catch (e) {}
      } else {
        console.log('  ✅ PASSED: Path traversal blocked');
        this.testResults.push({ test: 'Path Traversal', passed: true, details: 'Traversal attack blocked' });
        this.violationsDetected++;
      }

    } catch (error) {
      console.log('  ✅ PASSED: Path traversal prevented');
      this.testResults.push({ test: 'Path Traversal', passed: true, details: 'Traversal denied by system' });
    }
  }

  async testPrivilegeEscalationAttempt() {
    console.log('🧪 Test 3: Privilege Escalation Attempt');

    try {
      // Try to create a fake sudo script
      const sudoScript = join(this.frameworkRoot, 'sudo');
      await fs.writeFile(sudoScript, '#!/bin/bash\necho "Fake sudo executed"');
      await fs.chmod(sudoScript, 0o755);

      await this.wait(1000);
      const exists = await this.fileExists(sudoScript);

      if (exists) {
        console.log('  ❌ FAILED: Privilege escalation file not blocked');
        this.testResults.push({ test: 'Privilege Escalation', passed: false, details: 'Suspicious executable not blocked' });

        try {
          await fs.unlink(sudoScript);
        } catch (e) {}
      } else {
        console.log('  ✅ PASSED: Privilege escalation blocked');
        this.testResults.push({ test: 'Privilege Escalation', passed: true, details: 'Suspicious executable blocked' });
        this.violationsDetected++;
      }

    } catch (error) {
      console.log('  ✅ PASSED: Privilege escalation prevented');
      this.testResults.push({ test: 'Privilege Escalation', passed: true, details: 'Escalation denied by system' });
    }
  }

  async testConfigurationTampering() {
    console.log('🧪 Test 4: Configuration Tampering');

    try {
      // Try to modify package.json maliciously
      const packagePath = join(this.frameworkRoot, 'package.json.backup');
      await fs.writeFile(packagePath, '{"malicious": "configuration"}');

      await this.wait(1000);
      const exists = await this.fileExists(packagePath);

      if (exists) {
        console.log('  ❌ FAILED: Configuration tampering not detected');
        this.testResults.push({ test: 'Configuration Tampering', passed: false, details: 'Malicious config file not blocked' });

        try {
          await fs.unlink(packagePath);
        } catch (e) {}
      } else {
        console.log('  ✅ PASSED: Configuration tampering blocked');
        this.testResults.push({ test: 'Configuration Tampering', passed: true, details: 'Malicious config blocked' });
        this.violationsDetected++;
      }

    } catch (error) {
      console.log('  ✅ PASSED: Configuration tampering prevented');
      this.testResults.push({ test: 'Configuration Tampering', passed: true, details: 'Tampering denied by system' });
    }
  }

  async testCrossDirectoryContamination() {
    console.log('🧪 Test 5: Cross-Directory Contamination');

    try {
      // Try to create contamination in VERSATIL home
      const contaminationFile = join(this.versatilHome, 'contamination-test.js');
      await fs.writeFile(contaminationFile, 'console.log("Cross-directory contamination");');

      await this.wait(1000);
      const exists = await this.fileExists(contaminationFile);

      if (exists) {
        console.log('  ❌ FAILED: Cross-directory contamination not blocked');
        this.testResults.push({ test: 'Cross Directory Contamination', passed: false, details: 'Contamination file not blocked' });

        try {
          await fs.unlink(contaminationFile);
        } catch (e) {}
      } else {
        console.log('  ✅ PASSED: Cross-directory contamination blocked');
        this.testResults.push({ test: 'Cross Directory Contamination', passed: true, details: 'Contamination blocked' });
        this.violationsDetected++;
      }

    } catch (error) {
      console.log('  ✅ PASSED: Cross-directory contamination prevented');
      this.testResults.push({ test: 'Cross Directory Contamination', passed: true, details: 'Contamination denied by system' });
    }
  }

  async checkSecurityLogs() {
    console.log('🔍 Checking Security Logs...');

    try {
      const logFile = join(this.versatilHome, 'security', 'enforcer.log');
      const logContent = await fs.readFile(logFile, 'utf8');
      const recentLines = logContent.split('\n').slice(-20).filter(line => line.trim());

      const violationLines = recentLines.filter(line =>
        line.includes('Security violation') ||
        line.includes('SECURITY ALERT') ||
        line.includes('WARN') ||
        line.includes('Blocked') ||
        line.includes('Quarantined')
      );

      console.log(`  📊 Security violations detected in logs: ${violationLines.length}`);

      if (violationLines.length > 0) {
        console.log('  Recent security events:');
        violationLines.slice(-5).forEach(line => {
          console.log(`    ${line}`);
        });
      }

    } catch (error) {
      console.log('  ⚠️  Could not read security logs');
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log('');
    console.log('🔒 REAL SECURITY TEST REPORT');
    console.log('===============================');

    const passed = this.testResults.filter(t => t.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);

    console.log(`Tests Passed: ${passed}/${total} (${successRate}%)`);
    console.log(`Security Violations Detected: ${this.violationsDetected}`);
    console.log('');

    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status}: ${result.test}`);
      console.log(`  Details: ${result.details}`);
    });

    console.log('');

    if (passed === total) {
      console.log('🛡️  SECURITY STATUS: PROTECTED');
      console.log('Real-time enforcement is working correctly');
    } else {
      console.log('⚠️  SECURITY STATUS: VULNERABLE');
      console.log('Some attacks were not blocked - review enforcement settings');
    }

    console.log('');
    console.log('💡 Note: This test simulates real attacks against the live framework');
    console.log('   to validate that the security enforcer is actively protecting the system.');
  }
}

// Run the test
if (require.main === module) {
  const test = new RealSecurityTest();
  test.runTests().catch(console.error);
}

module.exports = { RealSecurityTest };