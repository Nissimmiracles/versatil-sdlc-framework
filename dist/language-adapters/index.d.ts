/**
 * VERSATIL Framework v3.0.0 - Language Adapters Index
 *
 * Central registry for all language adapters
 * Automatically registers supported languages with the framework
 */
export * from './base-language-adapter.js';
export * from './python-adapter.js';
export * from './go-adapter.js';
export * from './rust-adapter.js';
export * from './java-adapter.js';
export * from './ruby-adapter.js';
export * from './php-adapter.js';
/**
 * Get list of all supported languages in v3.0.0
 */
export declare function getSupportedLanguages(): string[];
/**
 * Quick language detection for a project
 */
export declare function detectProjectLanguages(rootPath: string): Promise<string[]>;
/**
 * Get adapter instance for a specific language and project
 */
export declare function getLanguageAdapter(language: string, rootPath: string): Promise<import("./base-language-adapter.js").BaseLanguageAdapter>;
