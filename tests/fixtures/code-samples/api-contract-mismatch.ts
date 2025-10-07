/**
 * Test Fixture: API-Frontend Contract Mismatch
 * Scenario: Detect mismatches between frontend expectations and backend API contracts
 * Expected Issues: api-parameter-naming-inconsistency, missing-api-types
 * Target Agents: enhanced-marcus, enhanced-maria
 */

// Frontend expects this interface
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string; // snake_case
}

// But API endpoint returns this (different naming)
const fetchUserProfile = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  // API returns: { id, name, email, avatarUrl } // camelCase!
  return data as UserProfile; // Type assertion hides the mismatch
};
