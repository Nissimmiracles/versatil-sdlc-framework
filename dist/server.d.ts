#!/usr/bin/env node
/**
 * VERSATIL SDLC Framework - Production Server
 * Enhanced OPERA agent system with health monitoring
 */
declare const app: import("express-serve-static-core").Express;
declare const server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
export { app, server };
