// ***********************************************
// Custom Cypress Commands
// ***********************************************

/**
 * Login command - Logs in a user and stores the token
 * @param {string} email - User email
 * @param {string} password - User password
 * @example cy.login('admin@example.com', 'password123')
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="input-email"]').clear().type(email);
  cy.get('[data-testid="input-password"]').clear().type(password);
  cy.get('[data-testid="btn-submit-login"]').click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/dashboard');
  
  // Verify token is stored
  cy.window().then((window) => {
    const token = window.localStorage.getItem('token');
    expect(token).to.exist;
  });
});

/**
 * Login via API (faster for tests that don't need UI login)
 * @param {string} email - User email
 * @param {string} password - User password
 * @example cy.loginViaApi('admin@example.com', 'password123')
 */
Cypress.Commands.add('loginViaApi', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    expect(response.body.data.token).to.exist;
    
    // Store token in localStorage
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
  });
});

/**
 * Login as a specific role
 * @param {string} role - User role (superadmin, admin, user)
 * @example cy.loginAs('admin')
 */
Cypress.Commands.add('loginAs', (role) => {
  const credentials = {
    superadmin: {
      email: 'superadmin@example.com',
      password: 'SuperAdmin123'
    },
    admin: {
      email: 'admin@example.com',
      password: 'Admin123'
    },
    user: {
      email: 'user@example.com',
      password: 'User123'
    }
  };
  
  const creds = credentials[role];
  if (!creds) {
    throw new Error(`Invalid role: ${role}`);
  }
  
  cy.loginViaApi(creds.email, creds.password);
});

/**
 * Logout command
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="btn-logout"]').click();
  cy.url().should('include', '/login');
  
  // Verify token is removed
  cy.window().then((window) => {
    const token = window.localStorage.getItem('token');
    expect(token).to.be.null;
  });
});

/**
 * Create a user via UI
 * @param {object} userData - User data
 * @example cy.createUser({ name: 'John Doe', email: 'john@example.com', password: 'Pass123', company: 'Acme' })
 */
Cypress.Commands.add('createUser', (userData) => {
  cy.get('[data-testid="btn-create-user"]').click();
  cy.get('[data-testid="modal-input-name"]').type(userData.name);
  cy.get('[data-testid="modal-input-email"]').type(userData.email);
  cy.get('[data-testid="modal-input-password"]').type(userData.password);
  cy.get('[data-testid="modal-input-company"]').type(userData.company);
  cy.get('[data-testid="modal-btn-submit"]').click();
  
  // Wait for success message or table update
  cy.contains(userData.name).should('be.visible');
});

/**
 * Delete a user from the table
 * @param {string} userId - User ID
 * @example cy.deleteUser('123abc')
 */
Cypress.Commands.add('deleteUser', (userId) => {
  cy.get(`[data-testid="btn-delete-user-${userId}"]`).click();
  
  // Confirm deletion in modal/dialog if exists
  cy.on('window:confirm', () => true);
});

/**
 * Get user by email from localStorage
 * @example cy.getCurrentUser().then(user => { ... })
 */
Cypress.Commands.add('getCurrentUser', () => {
  return cy.window().then((window) => {
    const userStr = window.localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
});

/**
 * Check if element exists without failing test
 * @param {string} selector - Element selector
 * @example cy.elementExists('[data-testid="some-element"]')
 */
Cypress.Commands.add('elementExists', (selector) => {
  return cy.get('body').then($body => {
    return $body.find(selector).length > 0;
  });
});

/**
 * Wait for API call to complete
 * @param {string} url - API endpoint pattern
 * @param {string} alias - Alias for the intercept
 * @example cy.waitForApi('/api/users', 'getUsers')
 */
Cypress.Commands.add('waitForApi', (url, alias) => {
  cy.intercept(url).as(alias);
  cy.wait(`@${alias}`);
});
