#!/usr/bin/env -S npx tsx
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .claude/hooks/session-start.ts
var import_child_process = require("child_process");
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
async function main() {
  try {
    const input = await readStdin();
    const hookData = JSON.parse(input);
    if (hookData.source !== "startup") {
      process.exit(0);
    }
    const cwd = process.cwd();
    const logDir = path.join(os.homedir(), ".versatil", "logs", "guardian");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, "session-start.log");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const isVersatilProject = fs.existsSync(path.join(cwd, "package.json")) && fs.existsSync(path.join(cwd, "src", "agents", "guardian"));
    if (!isVersatilProject) {
      fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Not a VERSATIL project, skipping Guardian
`);
      process.exit(0);
    }
    try {
      const guardianStatus = (0, import_child_process.execSync)("launchctl list | grep versatil.guardian", {
        encoding: "utf-8",
        stdio: "pipe"
      });
      if (guardianStatus && guardianStatus.includes("com.versatil.guardian")) {
        fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Guardian already running, triggering health check
`);
        try {
          (0, import_child_process.execSync)("npm run guardian:health-check", {
            cwd,
            stdio: "ignore",
            timeout: 3e4
          });
          fs.appendFileSync(logFile, `[${timestamp}] Health check completed
`);
        } catch (healthCheckError) {
          fs.appendFileSync(logFile, `[${timestamp}] Health check failed: ${healthCheckError.message}
`);
        }
        process.exit(0);
      }
    } catch {
    }
    fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Starting Guardian background monitoring...
`);
    try {
      (0, import_child_process.execSync)("npm run guardian:start", {
        cwd,
        stdio: "pipe",
        timeout: 3e4
      });
      fs.appendFileSync(logFile, `[${timestamp}] \u2705 Guardian started successfully
`);
      fs.appendFileSync(logFile, `[${timestamp}] - Health checks: Every 5 minutes
`);
      fs.appendFileSync(logFile, `[${timestamp}] - Proactive answers: Enabled (v7.13.0+)
`);
      fs.appendFileSync(logFile, `[${timestamp}] - TODO generation: Enabled (v7.10.0+)
`);
      fs.appendFileSync(logFile, `[${timestamp}] - Enhancement detection: Enabled (v7.12.0+)
`);
      console.log("\u{1F6E1}\uFE0F  Guardian background monitoring started (5-minute health checks)");
    } catch (error) {
      const errorMsg = error.message;
      fs.appendFileSync(logFile, `[${timestamp}] \u274C Failed to start Guardian: ${errorMsg}
`);
      console.log("\u26A0\uFE0F  Guardian failed to start (session can continue normally)");
    }
  } catch (error) {
    const logDir = path.join(os.homedir(), ".versatil", "logs", "guardian");
    const logFile = path.join(logDir, "session-start.log");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    if (fs.existsSync(logDir)) {
      fs.appendFileSync(logFile, `[${timestamp}] \u274C Hook error: ${error.message}
`);
    }
  }
  process.exit(0);
}
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}
main();
