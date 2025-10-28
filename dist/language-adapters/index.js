/**
 * VERSATIL Framework v3.0.0 - Language Adapters Index
 *
 * Central registry for all language adapters
 * Automatically registers supported languages with the framework
 */
import { LanguageAdapterRegistry } from './base-language-adapter.js';
import { PythonAdapter } from './python-adapter.js';
import { GoAdapter } from './go-adapter.js';
import { RustAdapter } from './rust-adapter.js';
import { JavaAdapter } from './java-adapter.js';
import { RubyAdapter } from './ruby-adapter.js';
import { PHPAdapter } from './php-adapter.js';
// Register all language adapters
LanguageAdapterRegistry.register('python', PythonAdapter);
LanguageAdapterRegistry.register('go', GoAdapter);
LanguageAdapterRegistry.register('rust', RustAdapter);
LanguageAdapterRegistry.register('java', JavaAdapter);
LanguageAdapterRegistry.register('ruby', RubyAdapter);
LanguageAdapterRegistry.register('php', PHPAdapter);
// Export everything for external use
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
export function getSupportedLanguages() {
    return LanguageAdapterRegistry.getRegisteredLanguages();
}
/**
 * Quick language detection for a project
 */
export async function detectProjectLanguages(rootPath) {
    return LanguageAdapterRegistry.detectLanguages(rootPath);
}
/**
 * Get adapter instance for a specific language and project
 */
export async function getLanguageAdapter(language, rootPath) {
    return LanguageAdapterRegistry.getInstance(language, rootPath);
}
//# sourceMappingURL=index.js.map