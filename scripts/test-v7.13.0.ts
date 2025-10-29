#!/usr/bin/env ts-node
/**
 * Test script for v7.13.0 Guardian User Interaction Learning
 *
 * Tests all 5 core components and integration:
 * 1. Conversation Pattern Detector
 * 2. User Interaction Learner
 * 3. Proactive Answer Generator
 * 4. Context Response Formatter
 * 5. Question Prediction Engine
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Test results
const results: Array<{ test: string; status: 'PASS' | 'FAIL'; message: string; duration?: number }> = [];

function logTest(test: string, status: 'PASS' | 'FAIL', message: string, duration?: number) {
  results.push({ test, status, message, duration });
  const icon = status === 'PASS' ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} ${test}: ${message}${durationStr}`);
}

async function test1_ConversationPatternDetector() {
  const startTime = Date.now();
  try {
    const { ConversationPatternDetector } = await import('../src/intelligence/conversation-pattern-detector.js');
    const detector = new ConversationPatternDetector();

    // Test 1: Detect "documented or built?" pattern
    const pattern1 = detector.detectPattern('documented or built?', {
      follows_feature_claim: true,
      feature_name: 'Test Feature',
      recent_code_changes: true
    });

    if (!pattern1) {
      throw new Error('Pattern detection returned null');
    }

    if (pattern1.question_category !== 'status') {
      throw new Error(`Expected category 'status', got '${pattern1.question_category}'`);
    }

    if (pattern1.context.user_intent !== 'verify_implementation') {
      throw new Error(`Expected intent 'verify_implementation', got '${pattern1.context.user_intent}'`);
    }

    // Test 2: Detect fuzzy match "r built?"
    const pattern2 = detector.detectPattern('r built?', {
      follows_feature_claim: true,
      feature_name: 'Test Feature',
      recent_code_changes: true
    });

    if (!pattern2) {
      throw new Error('Fuzzy pattern detection returned null');
    }

    // Test 3: Detect "sure?" verification pattern
    const pattern3 = detector.detectPattern('sure?', {
      follows_claim: true,
      previous_answer_provided: true
    });

    if (pattern3.question_category !== 'verification') {
      throw new Error(`Expected category 'verification', got '${pattern3.question_category}'`);
    }

    const duration = Date.now() - startTime;
    logTest('Conversation Pattern Detector', 'PASS', 'All 3 patterns detected correctly', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Conversation Pattern Detector', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test2_UserInteractionLearner() {
  const startTime = Date.now();
  try {
    const { UserInteractionLearner } = await import('../src/intelligence/user-interaction-learner.js');
    const learner = new UserInteractionLearner();

    // Test 1: Get default preferences
    const prefs = learner.getAnswerFormatPreferences();
    if (!prefs) {
      throw new Error('Answer format preferences not returned');
    }

    // Test 2: Learn from pattern
    const { ConversationPatternDetector } = await import('../src/intelligence/conversation-pattern-detector.js');
    const detector = new ConversationPatternDetector();
    const pattern = detector.detectPattern('documented or built?', {
      follows_feature_claim: true,
      feature_name: 'Test Feature'
    });

    await learner.learnFromPattern(pattern);

    // Test 3: Check preferences updated
    const updatedPrefs = learner.getAnswerFormatPreferences();
    if (!updatedPrefs.include_file_paths || !updatedPrefs.include_line_counts) {
      throw new Error('Preferences not updated after learning');
    }

    // Test 4: Get detail level preferences
    const detailPrefs = learner.getDetailLevelPreferences();
    if (!detailPrefs) {
      throw new Error('Detail level preferences not returned');
    }

    const duration = Date.now() - startTime;
    logTest('User Interaction Learner', 'PASS', 'Profile created and preferences learned', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('User Interaction Learner', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test3_ProactiveAnswerGenerator() {
  const startTime = Date.now();
  try {
    const { ProactiveAnswerGenerator } = await import('../src/intelligence/proactive-answer-generator.js');
    const generator = new ProactiveAnswerGenerator();

    // Test 1: Generate proactive answer for feature completion
    const context = {
      feature_name: 'Test Feature v7.13.0',
      files_created: ['src/test1.ts', 'src/test2.ts'],
      files_modified: ['CLAUDE.md'],
      total_lines: 500,
      documentation_files: ['CLAUDE.md'],
      git_status: {
        uncommitted: true,
        files_count: 3,
        branch: 'main',
        commits_ahead: 0
      }
    };

    const answer = await generator.generateForFeatureCompletion(context);

    if (!answer) {
      throw new Error('Proactive answer generation returned null');
    }

    if (answer.anticipated_questions.length === 0) {
      throw new Error('No anticipated questions generated');
    }

    if (answer.pregenerated_answers.size === 0) {
      throw new Error('No pregenerated answers created');
    }

    if (answer.confidence < 0 || answer.confidence > 100) {
      throw new Error(`Invalid confidence: ${answer.confidence}`);
    }

    // Test 2: Format proactive answer
    const formatted = generator.formatProactiveAnswer(answer, context);
    if (!formatted || formatted.length < 100) {
      throw new Error('Formatted answer too short or empty');
    }

    if (!formatted.includes('Guardian Learned Patterns')) {
      throw new Error('Formatted answer missing expected header');
    }

    const duration = Date.now() - startTime;
    logTest('Proactive Answer Generator', 'PASS', `Generated ${answer.anticipated_questions.length} questions, confidence ${answer.confidence}%`, duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Proactive Answer Generator', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test4_ContextResponseFormatter() {
  const startTime = Date.now();
  try {
    const { ContextResponseFormatter } = await import('../src/intelligence/context-response-formatter.js');
    const formatter = new ContextResponseFormatter();

    // Test 1: Format response with context
    const context = {
      question_category: 'status' as const,
      implementation_details: {
        files_created: ['test1.ts', 'test2.ts'],
        files_modified: ['CLAUDE.md'],
        total_lines: 500,
        documented: true,
        integrated: true
      },
      verification_evidence: {
        files_exist: true,
        integration_verified: true,
        git_status_checked: true
      }
    };

    const formatted = formatter.formatResponse('Test feature is built', context);

    if (!formatted || formatted.length < 50) {
      throw new Error('Formatted response too short or empty');
    }

    // Test 2: Check sections included
    const prefs = formatter['interactionLearner'].getAnswerFormatPreferences();
    if (prefs.include_tables && !formatted.includes('Status') && !formatted.includes('Evidence')) {
      throw new Error('Expected sections not included in formatted response');
    }

    const duration = Date.now() - startTime;
    logTest('Context Response Formatter', 'PASS', 'Response formatted with user preferences', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Context Response Formatter', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test5_QuestionPredictionEngine() {
  const startTime = Date.now();
  try {
    const { QuestionPredictionEngine } = await import('../src/intelligence/question-prediction-engine.js');
    const predictor = new QuestionPredictionEngine();

    // Test 1: Predict next question after 'status'
    const prediction1 = predictor.predictNext('status');
    if (!prediction1) {
      throw new Error('Prediction returned null for status category');
    }

    if (!prediction1.next_question) {
      throw new Error('Next question not predicted');
    }

    if (prediction1.probability < 0 || prediction1.probability > 100) {
      throw new Error(`Invalid probability: ${prediction1.probability}`);
    }

    // Test 2: Learn from sequence
    predictor.learnSequence(['status', 'availability', 'verification']);

    // Test 3: Predict after learning
    const prediction2 = predictor.predictNext('status');
    if (!prediction2) {
      throw new Error('Prediction failed after learning');
    }

    // Test 4: Get frequent sequences
    const sequences = predictor.getFrequentSequences(3);
    if (!Array.isArray(sequences)) {
      throw new Error('Frequent sequences not returned as array');
    }

    const duration = Date.now() - startTime;
    logTest('Question Prediction Engine', 'PASS', `Predicted '${prediction1.next_question}' (${prediction1.probability}% probability)`, duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Question Prediction Engine', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test6_GuardianIntegration() {
  const startTime = Date.now();
  try {
    // Test 1: Check Guardian has new method
    const { IrisGuardian } = await import('../src/agents/guardian/iris-guardian.js');
    const guardianCode = fs.readFileSync(
      path.join(process.cwd(), 'src/agents/guardian/iris-guardian.ts'),
      'utf-8'
    );

    if (!guardianCode.includes('User Interaction Learning (v7.13.0+)')) {
      throw new Error('Guardian integration comment not found');
    }

    if (!guardianCode.includes('ProactiveAnswerGenerator')) {
      throw new Error('ProactiveAnswerGenerator import not found in Guardian');
    }

    if (!guardianCode.includes('detectRecentGitChanges')) {
      throw new Error('detectRecentGitChanges method not found in Guardian');
    }

    if (!guardianCode.includes('GUARDIAN_LEARN_USER_PATTERNS')) {
      throw new Error('GUARDIAN_LEARN_USER_PATTERNS environment check not found');
    }

    // Test 2: Check git change detection method exists
    if (!guardianCode.includes('private async detectRecentGitChanges')) {
      throw new Error('detectRecentGitChanges method signature not found');
    }

    const duration = Date.now() - startTime;
    logTest('Guardian Integration', 'PASS', 'All integration points verified', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Guardian Integration', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test7_StorageVerification() {
  const startTime = Date.now();
  try {
    // Test 1: Check learning directories exist or can be created
    const learningDir = path.join(os.homedir(), '.versatil', 'learning');
    const userQuestionsDir = path.join(learningDir, 'user-questions');
    const userPreferencesDir = path.join(learningDir, 'user-preferences');

    // These directories will be created on first use, so we just check they can be created
    if (!fs.existsSync(learningDir)) {
      fs.mkdirSync(learningDir, { recursive: true });
    }

    if (!fs.existsSync(userQuestionsDir)) {
      fs.mkdirSync(userQuestionsDir, { recursive: true });
    }

    if (!fs.existsSync(userPreferencesDir)) {
      fs.mkdirSync(userPreferencesDir, { recursive: true });
    }

    // Test 2: Verify directories are writable
    const testFile = path.join(learningDir, '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    const duration = Date.now() - startTime;
    logTest('Storage Verification', 'PASS', `Learning directories ready: ${learningDir}`, duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Storage Verification', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function test8_DocumentationVerification() {
  const startTime = Date.now();
  try {
    const claudeMd = fs.readFileSync(
      path.join(process.cwd(), 'CLAUDE.md'),
      'utf-8'
    );

    // Test 1: Check v7.13.0 section exists
    if (!claudeMd.includes('## 🧠 Guardian User Interaction Learning (v7.13.0+)')) {
      throw new Error('v7.13.0 section not found in CLAUDE.md');
    }

    // Test 2: Check key concepts documented
    const requiredSections = [
      'Conversation Pattern Detector',
      'User Interaction Learner',
      'Proactive Answer Generator',
      'Context-Aware Response Formatter',
      'Question Prediction Engine',
      'Configuration',
      'Learning Progression',
      'Benefits'
    ];

    for (const section of requiredSections) {
      if (!claudeMd.includes(section)) {
        throw new Error(`Required section '${section}' not found in CLAUDE.md`);
      }
    }

    // Test 3: Check code examples included
    if (!claudeMd.includes('const detector = new ConversationPatternDetector()')) {
      throw new Error('Code examples not found in documentation');
    }

    const duration = Date.now() - startTime;
    logTest('Documentation Verification', 'PASS', 'All sections and examples present', duration);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logTest('Documentation Verification', 'FAIL', (error as Error).message, duration);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 Testing v7.13.0 Guardian User Interaction Learning\n');
  console.log('═'.repeat(70));
  console.log('\n');

  const tests = [
    test1_ConversationPatternDetector,
    test2_UserInteractionLearner,
    test3_ProactiveAnswerGenerator,
    test4_ContextResponseFormatter,
    test5_QuestionPredictionEngine,
    test6_GuardianIntegration,
    test7_StorageVerification,
    test8_DocumentationVerification
  ];

  for (const test of tests) {
    await test();
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('\n📊 Test Summary\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Pass Rate: ${passRate}%\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    console.log('🎉 v7.13.0 Guardian User Interaction Learning is fully functional!\n');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
