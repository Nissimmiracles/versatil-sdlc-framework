/**
 * VERSATIL Context Engineering Enhancements Validation
 *
 * This script validates all new context engineering enhancements work correctly
 * without requiring the full test framework.
 */
import { ContextStatsTracker } from '../../src/memory/context-stats-tracker.js';
import { AdaptiveContextManager } from '../../src/memory/adaptive-context-manager.js';
import { SmartToolFilter, ToolResultPriority, estimateTokens } from '../../src/memory/smart-tool-filter.js';
import { ContextDriftDetector, DriftSeverity } from '../../src/memory/context-drift-detector.js';
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🧪 VERSATIL Context Engineering Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
function test(name, fn) {
    testsRun++;
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result.then(() => {
                testsPassed++;
                console.log(`✅ ${name}`);
            }).catch((error) => {
                testsFailed++;
                console.log(`❌ ${name}`);
                console.log(`   Error: ${error.message}`);
            });
        }
        else {
            testsPassed++;
            console.log(`✅ ${name}`);
        }
    }
    catch (error) {
        testsFailed++;
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}
async function runValidation() {
    // Test 1: ContextStatsTracker with pre-clear hooks
    console.log('\n📊 Testing ContextStatsTracker...\n');
    await test('ContextStatsTracker initializes', async () => {
        const tracker = new ContextStatsTracker();
        await tracker.initialize();
        if (tracker.getPreClearHookCount() !== 0) {
            throw new Error('Expected 0 hooks initially');
        }
    });
    await test('Pre-clear hooks can be registered', async () => {
        const tracker = new ContextStatsTracker();
        const hook = async () => 5; // Mock hook returning 5 patterns
        const hookId = tracker.registerPreClearHook(hook);
        if (tracker.getPreClearHookCount() !== 1) {
            throw new Error('Expected 1 hook after registration');
        }
    });
    await test('Pre-clear hooks execute on clear event', async () => {
        const tracker = new ContextStatsTracker();
        await tracker.initialize();
        let hookExecuted = false;
        const hook = async () => {
            hookExecuted = true;
            return 3;
        };
        tracker.registerPreClearHook(hook);
        await tracker.trackClearEvent({
            inputTokens: 100000,
            toolUsesCleared: 10,
            tokensSaved: 5000,
            triggerType: 'input_tokens',
            triggerValue: 100000
        });
        if (!hookExecuted) {
            throw new Error('Hook was not executed');
        }
    });
    // Test 2: AdaptiveContextManager
    console.log('\n🎯 Testing AdaptiveContextManager...\n');
    await test('AdaptiveContextManager initializes with default threshold', () => {
        const tracker = new ContextStatsTracker();
        const manager = new AdaptiveContextManager(tracker);
        if (manager.getCurrentThreshold() !== 30000) {
            throw new Error('Expected default threshold of 30000');
        }
    });
    await test('AdaptiveContextManager adjusts threshold based on cache rate', async () => {
        const tracker = new ContextStatsTracker();
        const manager = new AdaptiveContextManager(tracker);
        // Simulate low cache rate - should reduce threshold
        const newThreshold = await manager.adjustThreshold({
            cacheHitRate: 0.4, // 40% (below 70% target)
            tokensPerMessage: 2000,
            conversationDepth: 50,
            clearEvents: 2,
            totalTokensProcessed: 80000,
            avgTokensSavedPerClear: 3000,
            memoryOperationsRate: 0.5
        });
        if (newThreshold >= 30000) {
            throw new Error('Threshold should have decreased for low cache rate');
        }
    });
    await test('AdaptiveContextManager increases threshold for high cache rate', async () => {
        const tracker = new ContextStatsTracker();
        const manager = new AdaptiveContextManager(tracker);
        // Start with current threshold
        const initialThreshold = manager.getCurrentThreshold();
        // Simulate high cache rate - should increase threshold
        await manager.adjustThreshold({
            cacheHitRate: 0.85, // 85% (above 70% target)
            tokensPerMessage: 2000,
            conversationDepth: 30,
            clearEvents: 1,
            totalTokensProcessed: 50000,
            avgTokensSavedPerClear: 4000,
            memoryOperationsRate: 0.3
        });
        const newThreshold = manager.getCurrentThreshold();
        if (newThreshold <= initialThreshold) {
            throw new Error('Threshold should have increased for high cache rate');
        }
    });
    // Test 3: SmartToolFilter
    console.log('\n🔍 Testing SmartToolFilter...\n');
    test('SmartToolFilter filters by priority', () => {
        const filter = new SmartToolFilter();
        const results = [
            { toolName: 'test-failure', timestamp: new Date(), result: 'error', tokensEstimated: 1000, priority: ToolResultPriority.CRITICAL },
            { toolName: 'Read', timestamp: new Date(), result: 'content', tokensEstimated: 500, priority: ToolResultPriority.HIGH },
            { toolName: 'Grep', timestamp: new Date(), result: 'matches', tokensEstimated: 300, priority: ToolResultPriority.MEDIUM },
            { toolName: 'Bash(echo', timestamp: new Date(), result: 'output', tokensEstimated: 100, priority: ToolResultPriority.LOW }
        ];
        const { kept, stats } = filter.filterResults(results, 160000); // Warning level
        // Should keep CRITICAL and HIGH, clear MEDIUM and LOW at warning level
        if (stats.criticalKept !== 1) {
            throw new Error(`Expected 1 critical kept, got ${stats.criticalKept}`);
        }
        if (stats.resultsCleared === 0) {
            throw new Error('Should have cleared some results');
        }
    });
    test('SmartToolFilter is more aggressive in emergency', () => {
        const filter = new SmartToolFilter();
        const results = [
            { toolName: 'test-failure', timestamp: new Date(), result: 'error', tokensEstimated: 1000, priority: ToolResultPriority.CRITICAL },
            { toolName: 'Read', timestamp: new Date(), result: 'content', tokensEstimated: 500, priority: ToolResultPriority.HIGH },
            { toolName: 'Grep', timestamp: new Date(), result: 'matches', tokensEstimated: 300, priority: ToolResultPriority.MEDIUM }
        ];
        const { stats } = filter.filterResults(results, 175000); // Emergency level
        // Should only keep CRITICAL in emergency
        if (stats.criticalKept !== 1) {
            throw new Error('Should only keep critical in emergency');
        }
        if (stats.highKept !== 0) {
            throw new Error('Should clear high priority in emergency');
        }
    });
    // Test 4: ContextDriftDetector
    console.log('\n🌊 Testing ContextDriftDetector...\n');
    await test('ContextDriftDetector initializes', async () => {
        const tracker = new ContextStatsTracker();
        const detector = new ContextDriftDetector(tracker);
        const result = await detector.detectDrift(50000);
        if (result.overallSeverity !== DriftSeverity.NONE) {
            throw new Error('Should have no drift initially');
        }
    });
    await test('ContextDriftDetector detects conversation depth drift', async () => {
        const tracker = new ContextStatsTracker();
        const detector = new ContextDriftDetector(tracker);
        // Simulate 250 messages
        for (let i = 0; i < 250; i++) {
            detector.trackMessage();
        }
        const result = await detector.detectDrift(150000);
        // Should detect HIGH drift for 250 messages
        if (result.overallSeverity === DriftSeverity.NONE) {
            throw new Error('Should detect drift for 250 messages');
        }
        const depthIndicator = result.indicators.find(i => i.type === 'conversation_depth');
        if (!depthIndicator) {
            throw new Error('Should have conversation depth indicator');
        }
    });
    await test('ContextDriftDetector detects task switching', async () => {
        const tracker = new ContextStatsTracker();
        const detector = new ContextDriftDetector(tracker);
        // Simulate 8 different tasks
        detector.trackTask('Implement auth');
        detector.trackTask('Fix bug in UI');
        detector.trackTask('Add database migration');
        detector.trackTask('Update docs');
        detector.trackTask('Refactor API');
        detector.trackTask('Add tests');
        detector.trackTask('Deploy to prod');
        detector.trackTask('Monitor logs');
        const result = await detector.detectDrift(100000);
        const taskIndicator = result.indicators.find(i => i.type === 'task_switch');
        if (!taskIndicator) {
            throw new Error('Should detect task switching');
        }
    });
    // Test 5: Token Estimation
    console.log('\n🔢 Testing Utilities...\n');
    test('estimateTokens calculates correctly', () => {
        const text = 'This is a test string with approximately 40 characters';
        const tokens = estimateTokens(text);
        // ~40 chars / 4 = ~10 tokens
        if (tokens < 8 || tokens > 15) {
            throw new Error(`Expected ~10 tokens, got ${tokens}`);
        }
    });
    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📊 Validation Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`  Total Tests: ${testsRun}`);
    console.log(`  ✅ Passed: ${testsPassed}`);
    console.log(`  ❌ Failed: ${testsFailed}\n`);
    if (testsFailed === 0) {
        console.log('✨ All enhancements validated successfully!\n');
        process.exit(0);
    }
    else {
        console.log('⚠️  Some tests failed. Review errors above.\n');
        process.exit(1);
    }
}
runValidation().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
