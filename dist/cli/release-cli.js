#!/usr/bin/env node
/**
 * VERSATIL Framework - Release CLI
 *
 * Semi-automated release workflow with user approval gates.
 *
 * Commands:
 * - check: Check if project is release-ready
 * - prepare: Generate release notes and show preview
 * - execute: Commit → tag → push → GitHub release
 *
 * @version 7.14.0
 */
import { ReleaseDetector } from '../intelligence/release-detector.js';
import { ReleaseNotesGenerator } from '../intelligence/release-notes-generator.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
const command = process.argv[2];
async function main() {
    try {
        switch (command) {
            case 'check':
                await checkRelease();
                break;
            case 'prepare':
                await prepareRelease();
                break;
            case 'execute':
                await executeRelease();
                break;
            default:
                showHelp();
                process.exit(1);
        }
    }
    catch (error) {
        console.error(`\n❌ Release CLI error: ${error.message}`);
        process.exit(1);
    }
}
function showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  VERSATIL Framework - Release CLI                                   ║
╚══════════════════════════════════════════════════════════════════════╝

Commands:
  npm run release:check    - Check if project is release-ready
  npm run release:prepare  - Generate release notes and show preview
  npm run release:execute  - Execute release (commit → tag → push → GitHub)

Usage:
  1. npm run release:check    # Verify readiness
  2. npm run release:prepare  # Review release notes
  3. npm run release:execute  # Execute (requires confirmation)
`);
}
async function checkRelease() {
    console.log('\n🔍 Checking Release Readiness...\n');
    const detector = new ReleaseDetector();
    const readiness = await detector.checkReleaseReadiness();
    console.log(`📊 Release Readiness: ${readiness.isReady ? '✅ READY' : '❌ NOT READY'}`);
    console.log(`   Confidence: ${readiness.confidence}%`);
    console.log(`   Suggested Version: ${readiness.suggestedVersion} (${readiness.bumpType} bump)`);
    console.log('');
    console.log('📈 Statistics:');
    console.log(`   Uncommitted Files: ${readiness.stats.uncommittedFiles}`);
    console.log(`   - New: ${readiness.stats.newFiles}`);
    console.log(`   - Modified: ${readiness.stats.modifiedFiles}`);
    console.log(`   - Deleted: ${readiness.stats.deletedFiles}`);
    if (readiness.stats.testCoverage !== undefined) {
        console.log(`   Test Coverage: ${readiness.stats.testCoverage}%`);
    }
    console.log(`   Documentation Updated: ${readiness.stats.documentationUpdated ? 'Yes' : 'No'}`);
    console.log(`   Open TODOs: ${readiness.stats.openTodos}`);
    console.log('');
    if (readiness.reasons.length > 0) {
        console.log('✅ Release Criteria Met:');
        readiness.reasons.forEach(reason => {
            console.log(`   ✓ ${reason}`);
        });
        console.log('');
    }
    if (readiness.blockers.length > 0) {
        console.log('⚠️  Blockers:');
        readiness.blockers.forEach(blocker => {
            console.log(`   ✗ ${blocker}`);
        });
        console.log('');
    }
    if (readiness.isReady) {
        console.log('🚀 Ready to release!');
        console.log('   Next step: npm run release:prepare\n');
    }
    else {
        console.log('❌ Not ready to release yet.');
        console.log('   Fix blockers above before proceeding.\n');
        process.exit(1);
    }
}
async function prepareRelease() {
    console.log('\n📝 Preparing Release...\n');
    const detector = new ReleaseDetector();
    const readiness = await detector.checkReleaseReadiness();
    if (!readiness.isReady) {
        console.log('❌ Project is not release-ready. Run `npm run release:check` to see blockers.\n');
        process.exit(1);
    }
    const features = await detector.detectFeatures();
    const generator = new ReleaseNotesGenerator();
    const notes = await generator.generateReleaseNotes(readiness.suggestedVersion, features);
    const markdown = generator.formatAsMarkdown(notes);
    console.log('═'.repeat(70));
    console.log(markdown);
    console.log('═'.repeat(70));
    // Save preview to file
    const previewPath = path.join(process.cwd(), 'RELEASE_NOTES_PREVIEW.md');
    fs.writeFileSync(previewPath, markdown);
    console.log(`\n💾 Release notes saved to: ${previewPath}`);
    console.log('\n🔍 Review the notes above and edit the preview file if needed.');
    console.log('   When ready: npm run release:execute\n');
}
async function executeRelease() {
    console.log('\n🚀 Executing Release...\n');
    // Load preview notes
    const previewPath = path.join(process.cwd(), 'RELEASE_NOTES_PREVIEW.md');
    if (!fs.existsSync(previewPath)) {
        console.log('❌ No release notes preview found.');
        console.log('   Run `npm run release:prepare` first.\n');
        process.exit(1);
    }
    const releaseNotes = fs.readFileSync(previewPath, 'utf-8');
    const versionMatch = releaseNotes.match(/# (v\d+\.\d+\.\d+)/);
    if (!versionMatch) {
        console.log('❌ Could not parse version from release notes.\n');
        process.exit(1);
    }
    const version = versionMatch[1];
    const versionNumber = version.substring(1); // Remove 'v' prefix
    console.log(`📦 Release Version: ${version}`);
    console.log(`📄 Release Notes: ${previewPath}`);
    console.log('');
    // Show confirmation prompt
    const confirmed = await askConfirmation(`\nProceed with release ${version}?`);
    if (!confirmed) {
        console.log('\n❌ Release cancelled.\n');
        process.exit(0);
    }
    console.log('\n⚙️  Executing release workflow...\n');
    try {
        // Step 1: Update package.json version
        console.log('1/5 Updating package.json version...');
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        packageJson.version = versionNumber;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log(`   ✅ Version updated to ${versionNumber}`);
        // Step 2: Commit all changes
        console.log('\n2/5 Committing changes...');
        execSync('git add .', { stdio: 'inherit' });
        execSync(`git commit --no-verify -m "chore(release): ${version}"`, { stdio: 'inherit' });
        console.log('   ✅ Changes committed');
        // Step 3: Create git tag
        console.log('\n3/5 Creating git tag...');
        execSync(`git tag ${version}`, { stdio: 'inherit' });
        console.log(`   ✅ Tag ${version} created`);
        // Step 4: Push to GitHub
        console.log('\n4/5 Pushing to GitHub...');
        execSync('git push origin main', { stdio: 'inherit' });
        execSync(`git push origin ${version}`, { stdio: 'inherit' });
        console.log('   ✅ Pushed to GitHub');
        // Step 5: Create GitHub release
        console.log('\n5/5 Creating GitHub release...');
        const notesFile = path.join(process.cwd(), 'RELEASE_NOTES_TEMP.md');
        fs.writeFileSync(notesFile, releaseNotes);
        execSync(`gh release create ${version} --title "${version.substring(1)} - ${extractTitle(releaseNotes)}" --notes-file ${notesFile}`, {
            stdio: 'inherit'
        });
        fs.unlinkSync(notesFile);
        console.log('   ✅ GitHub release created');
        // Cleanup
        fs.unlinkSync(previewPath);
        console.log('\n✅ Release Complete!\n');
        console.log(`   Version: ${version}`);
        console.log(`   GitHub: https://github.com/Nissimmiracles/versatil-sdlc-framework/releases/tag/${version}`);
        console.log(`   Users can now access via /update command\n`);
    }
    catch (error) {
        console.error(`\n❌ Release failed: ${error.message}`);
        console.error('   You may need to manually clean up (delete tag, revert commits, etc.)\n');
        process.exit(1);
    }
}
function extractTitle(markdown) {
    const match = markdown.match(/# v\d+\.\d+\.\d+ - (.+)/);
    return match ? match[1] : 'Release';
}
async function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(`${question} (y/N) `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
main();
//# sourceMappingURL=release-cli.js.map