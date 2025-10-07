/**
 * Test Fixture: Dead Code in Route Definitions
 * Scenario: Detect unused route definitions and imports
 * Expected Issues: dead-code
 * Target Agents: enhanced-maria, enhanced-james
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './Dashboard.js';
import { Profile } from './Profile.js';
import { UnusedComponent } from './UnusedComponent.js'; // Dead import
import { AnotherUnused } from './AnotherUnused.js'; // Dead import

function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      {/* UnusedComponent and AnotherUnused are imported but never used */}
    </Routes>
  );
}
