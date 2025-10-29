#!/usr/bin/env node

// src/agents/guardian/iris-guardian-cli.ts
import { IrisGuardian } from "./iris-guardian.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
var command = process.argv[2];
async function main() {
  try {
    switch (command) {
      case "start":
        await startGuardian();
        break;
      case "stop":
        await stopGuardian();
        break;
      case "health-check":
        await runHealthCheck();
        break;
      case "status":
        await showStatus();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error("Usage: guardian:start | guardian:stop | guardian:health-check | guardian:status");
        process.exit(1);
    }
  } catch (error) {
    console.error(`Guardian CLI error: ${error.message}`);
    process.exit(1);
  }
}
async function startGuardian() {
  console.log("\u{1F6E1}\uFE0F  Starting Guardian background monitoring...");
  const guardian = new IrisGuardian();
  await guardian.startMonitoring(5);
  console.log("\u2705 Guardian started successfully");
  console.log("   Health checks: Every 5 minutes");
  console.log("   Proactive answers: Enabled (v7.13.0+)");
  console.log("   TODO generation: Enabled (v7.10.0+)");
  console.log("   Enhancement detection: Enabled (v7.12.0+)");
  console.log('\n   Use "npm run guardian:stop" to stop monitoring');
  console.log('   Use "npm run guardian:status" to check status');
  process.stdin.resume();
}
async function stopGuardian() {
  console.log("\u{1F6D1} Stopping Guardian background monitoring...");
  const guardian = new IrisGuardian();
  guardian.stopMonitoring();
  console.log("\u2705 Guardian stopped successfully");
}
async function runHealthCheck() {
  console.log("\u{1F50D} Running Guardian health check...\n");
  const guardian = new IrisGuardian();
  const result = await guardian.performHealthCheck();
  console.log(`
\u{1F4CA} Health Check Results:`);
  console.log(`   Overall Health: ${result.overall_health}/100`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Issues Found: ${result.issues.length}`);
  if (result.issues.length > 0) {
    console.log(`
   Top Issues:`);
    result.issues.slice(0, 3).forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.severity}] ${issue.description}`);
    });
  }
  console.log("");
}
async function showStatus() {
  console.log("\u{1F4CA} Guardian Status\n");
  try {
    const guardianStatus = execSync("launchctl list | grep versatil.guardian", {
      encoding: "utf-8",
      stdio: "pipe"
    });
    if (guardianStatus && guardianStatus.includes("com.versatil.guardian")) {
      console.log("\u2705 Status: RUNNING");
      console.log("   Service: com.versatil.guardian");
    } else {
      console.log("\u274C Status: STOPPED");
    }
  } catch {
    console.log("\u274C Status: STOPPED");
  }
  const logDir = path.join(os.homedir(), ".versatil", "logs", "guardian");
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const logFile = path.join(logDir, `scheduled-${today}.log`);
  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    const lastModified = new Date(stats.mtime);
    console.log(`   Last Activity: ${lastModified.toLocaleString()}`);
    console.log(`   Log File: ${logFile}`);
  } else {
    console.log("   Last Activity: No recent activity");
  }
  console.log("\n\u2699\uFE0F  Configuration:");
  console.log(`   Proactive Answers: ${process.env.GUARDIAN_LEARN_USER_PATTERNS !== "false" ? "Enabled" : "Disabled"}`);
  console.log(`   TODO Generation: ${process.env.GUARDIAN_CREATE_TODOS !== "false" ? "Enabled" : "Disabled"}`);
  console.log(`   Enhancement Detection: Enabled (v7.12.0+)`);
  console.log("");
}
main();
