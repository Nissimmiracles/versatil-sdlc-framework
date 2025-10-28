/**
 * VERSATIL Framework v3.0.0 - Base Language Adapter
 *
 * Foundation for multi-language support enabling VERSATIL to work with
 * Python, Go, Rust, Java, and other languages beyond TypeScript.
 *
 * Each language adapter implements this interface to provide language-specific
 * functionality while maintaining OPERA methodology across all languages.
 */
/**
 * Base Language Adapter Interface
 *
 * All language-specific adapters must implement this interface
 */
export class BaseLanguageAdapter {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
}
/**
 * Language Adapter Registry
 *
 * Manages all registered language adapters
 */
export class LanguageAdapterRegistry {
    /**
     * Register a language adapter
     */
    static register(language, adapter) {
        this.adapters.set(language.toLowerCase(), adapter);
    }
    /**
     * Get adapter for a language
     */
    static get(language) {
        return this.adapters.get(language.toLowerCase());
    }
    /**
     * Get or create adapter instance for a project
     */
    static async getInstance(language, rootPath) {
        const key = `${language}:${rootPath}`;
        if (this.instances.has(key)) {
            return this.instances.get(key);
        }
        const AdapterClass = this.get(language);
        if (!AdapterClass) {
            return null;
        }
        const instance = new AdapterClass(rootPath);
        const canHandle = await instance.detect();
        if (!canHandle) {
            return null;
        }
        this.instances.set(key, instance);
        return instance;
    }
    /**
     * Detect language(s) for a project
     */
    static async detectLanguages(rootPath) {
        const detected = [];
        for (const [language, AdapterClass] of this.adapters.entries()) {
            const instance = new AdapterClass(rootPath);
            if (await instance.detect()) {
                detected.push(language);
            }
        }
        return detected;
    }
    /**
     * Get all registered languages
     */
    static getRegisteredLanguages() {
        return Array.from(this.adapters.keys());
    }
}
LanguageAdapterRegistry.adapters = new Map();
LanguageAdapterRegistry.instances = new Map();
/**
 * Universal Project Detector
 *
 * Automatically detects project type and selects appropriate adapters
 */
export class UniversalProjectDetector {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    /**
     * Detect all languages used in project
     */
    async detectAllLanguages() {
        return LanguageAdapterRegistry.detectLanguages(this.rootPath);
    }
    /**
     * Detect primary language (most prevalent)
     */
    async detectPrimaryLanguage() {
        const languages = await this.detectAllLanguages();
        if (languages.length === 0) {
            return null;
        }
        // For now, return first detected
        // In production, analyze file counts to determine primary
        return languages[0];
    }
    /**
     * Get adapters for all detected languages
     */
    async getAdapters() {
        const languages = await this.detectAllLanguages();
        const adapters = [];
        for (const language of languages) {
            const adapter = await LanguageAdapterRegistry.getInstance(language, this.rootPath);
            if (adapter) {
                adapters.push(adapter);
            }
        }
        return adapters;
    }
    /**
     * Get comprehensive project analysis across all languages
     */
    async analyzeProject() {
        const adapters = await this.getAdapters();
        const structures = await Promise.all(adapters.map(a => a.analyzeProject()));
        const capabilities = {};
        const allRecommendedAgents = new Set();
        for (const adapter of adapters) {
            const structure = await adapter.analyzeProject();
            capabilities[structure.language] = adapter.getCapabilities();
            for (const agent of adapter.getRecommendedAgents()) {
                allRecommendedAgents.add(agent);
            }
        }
        return {
            languages: await this.detectAllLanguages(),
            primaryLanguage: await this.detectPrimaryLanguage(),
            structures,
            recommendedAgents: Array.from(allRecommendedAgents),
            capabilities
        };
    }
}
//# sourceMappingURL=base-language-adapter.js.map