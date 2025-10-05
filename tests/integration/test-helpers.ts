/**
 * VERSATIL SDLC Framework - CLI Integration Test Helpers
 * Utilities for testing CLI commands end-to-end
 */

import { spawn, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: Error;
  duration: number;
}

export interface TestEnvironment {
  tempDir: string;
  originalCwd: string;
  envVars: NodeJS.ProcessEnv;
  cleanup: () => Promise<void>;
}

/**
 * Execute a CLI command and capture output
 */
export async function execCommand(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
    stdin?: string;
  } = {}
): Promise<CommandResult> {
  const startTime = Date.now();
  const timeout = options.timeout || 30000;

  return new Promise((resolve) => {
    const fullCommand = [command, ...args].join(' ');
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
    }, timeout);

    // Capture stdout
    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    // Capture stderr
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Send stdin if provided
    if (options.stdin) {
      child.stdin?.write(options.stdin);
      child.stdin?.end();
    }

    // Handle exit
    child.on('exit', (code) => {
      clearTimeout(timeoutId);
      exitCode = code || 0;
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: 1,
        error,
        duration: Date.now() - startTime,
      });
    });

    child.on('close', () => {
      resolve({
        stdout,
        stderr,
        exitCode,
        duration: Date.now() - startTime,
      });
    });
  });
}

/**
 * Execute command using shell exec (simpler for basic commands)
 */
export async function execShellCommand(
  command: string,
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeout?: number;
  } = {}
): Promise<CommandResult> {
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 30000,
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1,
      error,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Setup isolated test environment
 */
export async function setupTestEnvironment(
  projectName: string = 'test-project'
): Promise<TestEnvironment> {
  // Create temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `versatil-test-${projectName}-`));

  // Save original cwd
  const originalCwd = process.cwd();

  // Setup environment variables
  const envVars = {
    ...process.env,
    NODE_ENV: 'test',
    VERSATIL_ENV: 'testing',
    VERSATIL_TEST_MODE: 'true',
    VERSATIL_HOME: path.join(tempDir, '.versatil'),
  };

  // Create basic project structure
  await fs.mkdir(path.join(tempDir, '.versatil'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'tests'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: 'Test project for VERSATIL framework',
    scripts: {},
    dependencies: {},
  };

  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create cleanup function
  const cleanup = async () => {
    process.chdir(originalCwd);
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup test directory: ${tempDir}`, error);
    }
  };

  return {
    tempDir,
    originalCwd,
    envVars,
    cleanup,
  };
}

/**
 * Clean up test environment
 */
export async function cleanupTestEnvironment(env: TestEnvironment): Promise<void> {
  await env.cleanup();
}

/**
 * Mock GitHub API responses
 */
export class GitHubAPIMock {
  private mockResponses: Map<string, any> = new Map();

  mockRelease(version: string, data: any) {
    this.mockResponses.set(`/repos/*/releases/tags/v${version}`, data);
  }

  mockLatestRelease(data: any) {
    this.mockResponses.set('/repos/*/releases/latest', data);
  }

  mockReleases(releases: any[]) {
    this.mockResponses.set('/repos/*/releases', releases);
  }

  getResponse(url: string): any | undefined {
    return this.mockResponses.get(url);
  }

  clear() {
    this.mockResponses.clear();
  }

  /**
   * Setup environment to use mocked API
   */
  applyMock(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
    return {
      ...env,
      VERSATIL_GITHUB_API_MOCK: 'true',
      VERSATIL_GITHUB_MOCK_DATA: JSON.stringify(Array.from(this.mockResponses.entries())),
    };
  }
}

/**
 * Create mock GitHub API instance
 */
export function mockGitHubAPI(): GitHubAPIMock {
  return new GitHubAPIMock();
}

/**
 * Create mock version for testing rollback
 */
export async function createMockVersion(
  testEnv: TestEnvironment,
  version: string,
  files: Record<string, string> = {}
): Promise<void> {
  const versionsDir = path.join(testEnv.tempDir, '.versatil', 'versions', version);
  await fs.mkdir(versionsDir, { recursive: true });

  // Create version metadata
  const metadata = {
    version,
    timestamp: new Date().toISOString(),
    description: `Mock version ${version} for testing`,
    files: Object.keys(files),
  };

  await fs.writeFile(
    path.join(versionsDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Write mock files
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(versionsDir, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
}

/**
 * Create mock config file
 */
export async function createMockConfig(
  testEnv: TestEnvironment,
  config: Record<string, any>
): Promise<void> {
  const configPath = path.join(testEnv.tempDir, '.versatil', 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Read test environment file
 */
export async function readTestFile(
  testEnv: TestEnvironment,
  relativePath: string
): Promise<string> {
  const fullPath = path.join(testEnv.tempDir, relativePath);
  return await fs.readFile(fullPath, 'utf-8');
}

/**
 * Write test environment file
 */
export async function writeTestFile(
  testEnv: TestEnvironment,
  relativePath: string,
  content: string
): Promise<void> {
  const fullPath = path.join(testEnv.tempDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

/**
 * Check if file exists in test environment
 */
export async function testFileExists(
  testEnv: TestEnvironment,
  relativePath: string
): Promise<boolean> {
  try {
    const fullPath = path.join(testEnv.tempDir, relativePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Mock stdin for interactive commands
 */
export class StdinMock {
  private inputs: string[] = [];
  private currentIndex = 0;

  addInput(input: string) {
    this.inputs.push(input);
  }

  getNextInput(): string | undefined {
    if (this.currentIndex < this.inputs.length) {
      return this.inputs[this.currentIndex++];
    }
    return undefined;
  }

  reset() {
    this.inputs = [];
    this.currentIndex = 0;
  }

  getAllInputs(): string {
    return this.inputs.join('\n') + '\n';
  }
}

/**
 * Create stdin mock for testing
 */
export function createStdinMock(): StdinMock {
  return new StdinMock();
}

/**
 * Assert command success
 */
export function assertCommandSuccess(result: CommandResult, message?: string) {
  if (result.exitCode !== 0) {
    throw new Error(
      message ||
        `Command failed with exit code ${result.exitCode}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }
}

/**
 * Assert command failure
 */
export function assertCommandFailure(result: CommandResult, message?: string) {
  if (result.exitCode === 0) {
    throw new Error(
      message || `Command succeeded but was expected to fail\nstdout: ${result.stdout}`
    );
  }
}

/**
 * Assert output contains string
 */
export function assertOutputContains(result: CommandResult, searchString: string) {
  const output = result.stdout + result.stderr;
  if (!output.includes(searchString)) {
    throw new Error(
      `Output does not contain "${searchString}"\nActual output:\n${output}`
    );
  }
}

/**
 * Assert output matches regex
 */
export function assertOutputMatches(result: CommandResult, pattern: RegExp) {
  const output = result.stdout + result.stderr;
  if (!pattern.test(output)) {
    throw new Error(
      `Output does not match pattern ${pattern}\nActual output:\n${output}`
    );
  }
}

/**
 * Get CLI command path
 */
export function getCLIPath(command: string): string {
  // Assuming commands are in bin directory
  const binPath = path.join(process.cwd(), 'bin', `${command}.js`);
  return binPath;
}

/**
 * Get framework root directory
 */
export function getFrameworkRoot(): string {
  return process.cwd();
}
