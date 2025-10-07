/**
 * Test Fixture: Profile Context Navigation Consistency
 * Scenario: Validate profile context state consistency with navigation permissions
 * Expected Issues: profile-context-inconsistency, missing-navigation-guards
 * Target Agents: enhanced-james, enhanced-maria
 */

const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

  const handleNavigation = (path) => {
    // Missing context validation
    navigate(path);
  };

  // Profile context doesn't validate navigation permissions
  return (
    <ProfileContext.Provider value={{ profile, handleNavigation }}>
      {children}
    </ProfileContext.Provider>
  );
};
