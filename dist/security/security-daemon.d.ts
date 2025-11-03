#!/usr/bin/env node
import { EventEmitter } from 'events';
interface SecurityDaemonConfig {
    frameworkRoot: string;
    versatilHome: string;
    monitoringEnabled: boolean;
    realTimeEnforcement: boolean;
    autoRepair: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
export declare class SecurityDaemon extends EventEmitter {
    private config;
    private orchestrator;
    private microsegmentation;
    private zeroTrust;
    private boundaryEngine;
    private pathPrevention;
    private fileWatcher?;
    private isRunning;
    private protectedPaths;
    private allowedProjects;
    constructor(config: SecurityDaemonConfig);
    private initializeSecuritySystems;
    private setupProtectedPaths;
    start(): Promise<void>;
    stop(): Promise<void>;
    private startFileSystemMonitoring;
    private handleFileSystemEvent;
    private detectViolation;
    private isFrameworkCoreAccess;
    private detectCrossProjectContamination;
    private detectPrivilegeEscalation;
    private enforceViolation;
    private blockAccess;
    private quarantineFile;
    private repairViolation;
    private alertViolation;
    private startProcessMonitoring;
    private startNetworkMonitoring;
    private checkSuspiciousProcesses;
    private isSuspiciousProcess;
    private handleSuspiciousProcess;
    private setupSecurityEventHandlers;
    private log;
    getStatus(): object;
}
export {};
