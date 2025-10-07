/**
 * Test Fixture: VERSSAI Brain Route Debug Code Detection
 * Scenario: Detect debugging wrapper code in production routes
 * Expected Issues: debugging-code, hardcoded-debug-styles, route-definition-inconsistency
 * Target Agents: enhanced-maria, enhanced-james
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/osint-brain" element={
        <div style={{ color: 'purple' }}>🧠 Route Test</div>
      } />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}
