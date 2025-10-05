/**
 * VERSATIL SDLC Framework - Path Traversal Prevention System
 * Advanced protection against directory traversal attacks
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { VERSATILLogger } from '../utils/logger.js';

export const PathTraversalAttemptSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  attack_type: z.enum([
    'basic_traversal',
    'encoded_traversal',
    'unicode_traversal',
    'symlink_traversal',
    'double_encoding',
    'null_byte_injection',
    'windows_traversal',
    'mixed_separators'
  ]),
  original_path: z.string(),
  normalized_path: z.string(),
  intended_target: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  blocked: z.boolean(),
  project_id: z.string().optional(),
  user_agent: z.string().optional(),
  source_ip: z.string().optional(),
  evidence: z.record(z.any())
});

export const SafePathSchema = z.object({
  original_path: z.string(),
  sanitized_path: z.string(),
  is_safe: z.boolean(),
  violations: z.array(z.string()),
  recommended_path: z.string()
});

export type PathTraversalAttempt = z.infer<typeof PathTraversalAttemptSchema>;
export type SafePath = z.infer<typeof SafePathSchema>;

export class PathTraversalPrevention extends EventEmitter {
  private attempts: PathTraversalAttempt[] = [];
  private logger: VERSATILLogger;
  private frameworkRoot: string;
  private versatilHome: string;
  private protectedPaths: Set<string> = new Set();
  private allowedRoots: Set<string> = new Set();

  constructor(frameworkRoot: string) {
    super();
    this.frameworkRoot = frameworkRoot;
    this.versatilHome = path.join(os.homedir(), '.versatil');
    this.logger = new VERSATILLogger('PathTraversalPrevention');

    this.initializeProtectedPaths();
    this.initializeAllowedRoots();
  }

  private initializeProtectedPaths(): void {
    // Critical system paths that should never be accessible
    const criticalPaths = [
      this.frameworkRoot,
      this.versatilHome,
      '/etc',
      '/usr',
      '/var',
      '/root',
      '/home',
      '/Applications',
      '/System',
      '/Library',
      process.env.HOME || '/Users',
      path.join(process.env.HOME || '/Users', '.ssh'),
      path.join(process.env.HOME || '/Users', '.aws'),
      path.join(process.env.HOME || '/Users', '.env'),
      '/proc',
      '/sys',
      '/dev'
    ];

    criticalPaths.forEach(criticalPath => {
      if (criticalPath) {
        this.protectedPaths.add(path.resolve(criticalPath));
      }
    });

    this.logger.info('Initialized path traversal protection', {
      protected_paths: this.protectedPaths.size
    });
  }

  private initializeAllowedRoots(): void {
    // Define safe root directories for projects
    this.allowedRoots.add(path.resolve('/tmp/versatil-projects'));
    this.allowedRoots.add(path.resolve(os.tmpdir(), 'versatil-sandbox'));

    // Allow read-only access to specific framework areas
    this.allowedRoots.add(path.resolve(this.frameworkRoot, 'docs'));
    this.allowedRoots.add(path.resolve(this.frameworkRoot, 'examples'));

    // Allow controlled access to shared resources
    this.allowedRoots.add(path.resolve(this.versatilHome, 'rag'));
    this.allowedRoots.add(path.resolve(this.versatilHome, 'logs'));

    this.logger.info('Initialized allowed root directories', {
      allowed_roots: Array.from(this.allowedRoots)
    });
  }

  public validatePath(inputPath: string, projectId?: string, operation: 'read' | 'write' = 'read'): SafePath {
    const originalPath = inputPath;
    let sanitizedPath = inputPath;
    const violations: string[] = [];
    let isSafe = true;

    // Step 1: Detect and log potential attack patterns
    const attackType = this.detectAttackType(inputPath);
    if (attackType) {
      const attempt = this.logTraversalAttempt(inputPath, attackType, projectId);
      violations.push(`Path traversal attempt detected: ${attackType}`);
      isSafe = false;
    }

    // Step 2: Perform multiple levels of sanitization
    sanitizedPath = this.sanitizePath(inputPath);

    // Step 3: Normalize and resolve the path
    const normalizedPath = this.normalizePath(sanitizedPath);

    // Step 4: Check against protected paths
    const protectionViolations = this.checkProtectedPaths(normalizedPath, operation);
    violations.push(...protectionViolations);

    if (protectionViolations.length > 0) {
      isSafe = false;
    }

    // Step 5: Ensure path is within allowed roots
    const rootViolation = this.checkAllowedRoots(normalizedPath);
    if (rootViolation) {
      violations.push(rootViolation);
      isSafe = false;
    }

    // Step 6: Generate safe alternative if path is unsafe
    const recommendedPath = isSafe ? normalizedPath : this.generateSafePath(inputPath, projectId);

    const result: SafePath = {
      original_path: originalPath,
      sanitized_path: normalizedPath,
      is_safe: isSafe,
      violations,
      recommended_path: recommendedPath
    };

    if (!isSafe) {
      this.emit('unsafePath', result);
      this.logger.warn('Unsafe path detected and blocked', {
        original: originalPath,
        violations,
        project_id: projectId
      });
    }

    return result;
  }

  private detectAttackType(inputPath: string): PathTraversalAttempt['attack_type'] | null {
    // Basic traversal patterns
    if (inputPath.includes('../') || inputPath.includes('..\\')) {
      return 'basic_traversal';
    }

    // Encoded traversal patterns
    if (inputPath.includes('%2e%2e%2f') || inputPath.includes('%2e%2e%5c')) {
      return 'encoded_traversal';
    }

    // Double encoding
    if (inputPath.includes('%252e%252e%252f')) {
      return 'double_encoding';
    }

    // Unicode traversal
    if (inputPath.includes('\\u002e\\u002e\\u002f') || inputPath.includes('\\u002e\\u002e\\u005c')) {
      return 'unicode_traversal';
    }

    // Null byte injection
    if (inputPath.includes('%00') || inputPath.includes('\\0')) {
      return 'null_byte_injection';
    }

    // Windows-specific traversal
    if (inputPath.includes('..\\\\') || inputPath.includes('....\\\\')) {
      return 'windows_traversal';
    }

    // Mixed separators
    if (inputPath.includes('../\\') || inputPath.includes('\\../')) {
      return 'mixed_separators';
    }

    // Check for symlink traversal attempts
    if (this.isSymlinkTraversalAttempt(inputPath)) {
      return 'symlink_traversal';
    }

    return null;
  }

  private isSymlinkTraversalAttempt(inputPath: string): boolean {
    try {
      if (fs.existsSync(inputPath)) {
        const stats = fs.lstatSync(inputPath);
        if (stats.isSymbolicLink()) {
          const target = fs.readlinkSync(inputPath);
          // Check if symlink points outside allowed areas
          return this.isOutsideAllowedArea(path.resolve(path.dirname(inputPath), target));
        }
      }
    } catch {
      // If we can't check, assume it's safe for now
    }
    return false;
  }

  private sanitizePath(inputPath: string): string {
    let sanitized = inputPath;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Decode URL encoding
    try {
      sanitized = decodeURIComponent(sanitized);
    } catch {
      // If decoding fails, keep original
    }

    // Decode HTML entities
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");

    // Remove Unicode escape sequences
    sanitized = sanitized.replace(/\\u[0-9a-fA-F]{4}/g, '');

    // Normalize Unicode characters
    sanitized = sanitized.normalize('NFKC');

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');

    // Remove double slashes
    sanitized = sanitized.replace(/\/+/g, '/');
    sanitized = sanitized.replace(/\\+/g, '\\');

    return sanitized;
  }

  private normalizePath(inputPath: string): string {
    try {
      // Convert to absolute path and normalize
      let normalized = path.resolve(inputPath);

      // Additional normalization for security
      normalized = path.normalize(normalized);

      // Ensure consistent separators
      if (process.platform === 'win32') {
        normalized = normalized.replace(/\//g, '\\');
      } else {
        normalized = normalized.replace(/\\/g, '/');
      }

      return normalized;
    } catch (error) {
      this.logger.error('Path normalization failed', { path: inputPath, error });
      // Return a safe default path
      return path.join(os.tmpdir(), 'versatil-safe');
    }
  }

  private checkProtectedPaths(normalizedPath: string, operation: 'read' | 'write'): string[] {
    const violations: string[] = [];

    for (const protectedPath of this.protectedPaths) {
      if (normalizedPath.startsWith(protectedPath)) {
        // Allow read access to some framework areas
        if (operation === 'read' && this.isReadAllowedProtectedPath(protectedPath)) {
          continue;
        }

        violations.push(`Access to protected path: ${protectedPath}`);
      }
    }

    return violations;
  }

  private isReadAllowedProtectedPath(protectedPath: string): boolean {
    const readAllowedPaths = [
      path.join(this.frameworkRoot, 'docs'),
      path.join(this.frameworkRoot, 'examples'),
      path.join(this.versatilHome, 'rag'),
      path.join(this.versatilHome, 'logs')
    ];

    return readAllowedPaths.some(allowedPath => protectedPath.startsWith(allowedPath));
  }

  private checkAllowedRoots(normalizedPath: string): string | null {
    for (const allowedRoot of this.allowedRoots) {
      if (normalizedPath.startsWith(allowedRoot)) {
        return null; // Path is within allowed root
      }
    }

    return `Path outside allowed roots: ${normalizedPath}`;
  }

  private isOutsideAllowedArea(targetPath: string): boolean {
    const normalizedTarget = this.normalizePath(targetPath);

    for (const allowedRoot of this.allowedRoots) {
      if (normalizedTarget.startsWith(allowedRoot)) {
        return false;
      }
    }

    return true;
  }

  private generateSafePath(inputPath: string, projectId?: string): string {
    // Generate a safe path within project boundaries
    const safeRoot = projectId
      ? path.join('/tmp/versatil-projects', projectId)
      : path.join(os.tmpdir(), 'versatil-safe');

    // Extract just the filename from the input path
    const filename = path.basename(inputPath);
    const safeName = this.sanitizeFilename(filename);

    return path.join(safeRoot, safeName);
  }

  private sanitizeFilename(filename: string): string {
    // Remove dangerous characters from filename
    let safe = filename
      .replace(/[<>:"|?*\x00-\x1f]/g, '_')
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 255); // Limit length

    // Ensure it's not empty
    if (!safe || safe === '_') {
      safe = 'safe_file';
    }

    return safe;
  }

  private logTraversalAttempt(
    inputPath: string,
    attackType: PathTraversalAttempt['attack_type'],
    projectId?: string
  ): PathTraversalAttempt {
    const attempt: PathTraversalAttempt = {
      id: this.generateAttemptId(),
      timestamp: new Date().toISOString(),
      attack_type: attackType,
      original_path: inputPath,
      normalized_path: this.normalizePath(inputPath),
      intended_target: this.guessIntendedTarget(inputPath),
      severity: this.calculateSeverity(attackType, inputPath),
      blocked: true, // Always blocked by this system
      project_id: projectId,
      evidence: {
        path_components: inputPath.split(/[/\\]/),
        attack_indicators: this.getAttackIndicators(inputPath, attackType),
        system_info: {
          platform: process.platform,
          cwd: process.cwd(),
          user: process.env.USER || process.env.USERNAME
        }
      }
    };

    this.attempts.push(attempt);
    this.emit('traversalAttempt', attempt);

    this.logger.error('Path traversal attempt detected and blocked', {
      attempt_id: attempt.id,
      attack_type: attackType,
      severity: attempt.severity,
      project_id: projectId,
      path: inputPath
    });

    return attempt;
  }

  private guessIntendedTarget(inputPath: string): string {
    // Analyze the path to guess what the attacker was trying to access
    const normalizedPath = this.normalizePath(inputPath);

    const commonTargets = [
      '/etc/passwd',
      '/etc/shadow',
      '/root/.ssh/id_rsa',
      '/.env',
      '/config.json',
      '/package.json',
      '/.aws/credentials',
      '/proc/version',
      '/etc/hosts'
    ];

    for (const target of commonTargets) {
      if (normalizedPath.includes(target)) {
        return target;
      }
    }

    // Look for file patterns
    if (normalizedPath.includes('passwd')) return 'Password files';
    if (normalizedPath.includes('ssh')) return 'SSH keys';
    if (normalizedPath.includes('.env')) return 'Environment variables';
    if (normalizedPath.includes('config')) return 'Configuration files';
    if (normalizedPath.includes('aws')) return 'AWS credentials';
    if (normalizedPath.includes('key')) return 'API keys or certificates';

    return 'Unknown system file';
  }

  private calculateSeverity(
    attackType: PathTraversalAttempt['attack_type'],
    inputPath: string
  ): PathTraversalAttempt['severity'] {
    // High severity for sophisticated attacks
    if (['double_encoding', 'unicode_traversal', 'symlink_traversal'].includes(attackType)) {
      return 'critical';
    }

    // High severity for targeting sensitive files
    if (inputPath.includes('passwd') || inputPath.includes('ssh') || inputPath.includes('.env')) {
      return 'high';
    }

    // Medium severity for basic traversal
    if (['basic_traversal', 'encoded_traversal'].includes(attackType)) {
      return 'medium';
    }

    return 'low';
  }

  private getAttackIndicators(inputPath: string, attackType: PathTraversalAttempt['attack_type']): string[] {
    const indicators: string[] = [];

    if (inputPath.includes('../')) indicators.push('dot-dot-slash sequence');
    if (inputPath.includes('%2e')) indicators.push('URL encoded dots');
    if (inputPath.includes('%00')) indicators.push('null byte injection');
    if (inputPath.includes('\\u002e')) indicators.push('Unicode escape sequence');
    if (/\.\.[/\\]{2,}/.test(inputPath)) indicators.push('multiple separators');
    if (inputPath.length > 1000) indicators.push('unusually long path');

    return indicators;
  }

  private generateAttemptId(): string {
    return `traversal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API Methods

  public getTraversalAttempts(limit: number = 100): PathTraversalAttempt[] {
    return this.attempts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  public getAttemptsByProjectId(projectId: string): PathTraversalAttempt[] {
    return this.attempts.filter(attempt => attempt.project_id === projectId);
  }

  public getAttemptsBySeverity(severity: PathTraversalAttempt['severity']): PathTraversalAttempt[] {
    return this.attempts.filter(attempt => attempt.severity === severity);
  }

  public getSecurityStatistics(): any {
    const total = this.attempts.length;
    const byType = this.attempts.reduce((acc, attempt) => {
      acc[attempt.attack_type] = (acc[attempt.attack_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.attempts.reduce((acc, attempt) => {
      acc[attempt.severity] = (acc[attempt.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_attempts: total,
      blocked_attempts: this.attempts.filter(a => a.blocked).length,
      attempts_by_type: byType,
      attempts_by_severity: bySeverity,
      protected_paths: this.protectedPaths.size,
      allowed_roots: this.allowedRoots.size,
      last_attempt: total > 0 ? this.attempts[total - 1].timestamp : null
    };
  }

  public addProtectedPath(pathToProtect: string): void {
    const normalized = path.resolve(pathToProtect);
    this.protectedPaths.add(normalized);
    this.logger.info('Added protected path', { path: normalized });
  }

  public addAllowedRoot(rootPath: string): void {
    const normalized = path.resolve(rootPath);
    this.allowedRoots.add(normalized);
    this.logger.info('Added allowed root', { path: normalized });
  }

  public exportSecurityReport(): any {
    return {
      generated_at: new Date().toISOString(),
      path_traversal_prevention: {
        total_attempts_blocked: this.attempts.length,
        critical_attempts: this.attempts.filter(a => a.severity === 'critical').length,
        protected_paths_count: this.protectedPaths.size,
        allowed_roots_count: this.allowedRoots.size
      },
      recent_attempts: this.getTraversalAttempts(20),
      security_statistics: this.getSecurityStatistics(),
      configuration: {
        protected_paths: Array.from(this.protectedPaths),
        allowed_roots: Array.from(this.allowedRoots)
      }
    };
  }
}

export default PathTraversalPrevention;