/**
 * Test Page Component - Orphaned Page Detection Test
 *
 * This page is intentionally created WITHOUT a route registration
 * to test the architectural validation system.
 *
 * Expected Behavior:
 * - Watcher should detect this as an orphaned page
 * - Warning should appear within 500ms of file save
 * - Pre-commit hook should block commit until route is added
 */
import React from 'react';
export default function TestOrphanedPage() {
    return (<div className="test-orphaned-page">
      <h1>Test Orphaned Page</h1>
      <p>
        This page was created to test the architectural validation system.
        It should be detected as an orphaned page (no route registration).
      </p>

      <div className="test-info">
        <h2>Expected Validation Results:</h2>
        <ul>
          <li>❌ Architectural Issue: Orphaned page component detected</li>
          <li>💡 Fix Suggestion: Add route to src/App.tsx</li>
          <li>🚫 Pre-commit: Should block commit until route added</li>
        </ul>
      </div>
    </div>);
}
//# sourceMappingURL=TestOrphanedPage.js.map