// Sample code for testing VERSATIL analysis
function authenticateUser(username, password) {
  console.log('Authenticating:', username); // Debug code
  debugger; // Should be removed

  // SQL injection vulnerability
  const query = `SELECT * FROM users WHERE username='${username}'`;

  // Missing error handling
  const result = db.query(query);
  return result;
}

// Test without assertions
describe('User Authentication', () => {
  it('should authenticate user', () => {
    authenticateUser('test', 'password');
    // Missing expect()
  });
});

module.exports = { authenticateUser };