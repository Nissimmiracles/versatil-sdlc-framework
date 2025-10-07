/**
 * Test Fixture: Menu Item Route Mapping Validation
 * Scenario: Detect mismatches between navigation menu items and actual route definitions
 * Expected Issues: navigation-route-mismatch, missing-route-component
 * Target Agents: enhanced-james, enhanced-maria
 */

const navigationItems = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'osint-brain', label: 'OSINT Brain', path: '/osint-brain' },
  { key: 'analytics', label: 'Analytics', path: '/analytics' }
];

// Routes defined elsewhere
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* Missing: /osint-brain route */}
  <Route path="/reports" element={<Reports />} /> {/* Extra route not in menu */}
</Routes>
