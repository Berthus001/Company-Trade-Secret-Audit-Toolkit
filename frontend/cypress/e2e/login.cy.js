/**
 * Cypress E2E Test Suite
 * Trade Secret Audit Toolkit - Authentication Tests
 * 
 * Test Suite: User Authentication
 */

describe('Authentication Flow', () => {
  
  // Test data
  const validUser = {
    email: 'testuser@example.com',
    password: 'SecurePass123'
  };
  
  const invalidUser = {
    email: 'invalid@example.com',
    password: 'WrongPassword123'
  };

  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  /**
   * Test 1: Valid Login
   */
  it('should login successfully with valid credentials', () => {
    // Fill login form
    cy.get('[data-testid="input-email"]').type(validUser.email);
    cy.get('[data-testid="input-password"]').type(validUser.password);
    
    // Submit form
    cy.get('[data-testid="btn-submit-login"]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify token is stored in localStorage
    cy.window().then((window) => {
      const token = window.localStorage.getItem('token');
      expect(token).to.exist;
      expect(token).to.be.a('string');
      expect(token.length).to.be.greaterThan(0);
    });
    
    // Verify user is stored in localStorage
    cy.window().then((window) => {
      const userStr = window.localStorage.getItem('user');
      expect(userStr).to.exist;
      const user = JSON.parse(userStr);
      expect(user.email).to.equal(validUser.email);
    });
    
    // Verify dashboard content is visible
    cy.get('[data-testid="dashboard"]').should('be.visible');
    cy.contains('Welcome').should('be.visible');
  });

  /**
   * Test 2: Invalid Login
   */
  it('should show error with invalid credentials', () => {
    // Fill login form with invalid credentials
    cy.get('[data-testid="input-email"]').type(invalidUser.email);
    cy.get('[data-testid="input-password"]').type(invalidUser.password);
    
    // Submit form
    cy.get('[data-testid="btn-submit-login"]').click();
    
    // Should stay on login page
    cy.url().should('include', '/login');
    
    // Verify error message is displayed
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid credentials');
    
    // Verify no token is stored
    cy.window().then((window) => {
      const token = window.localStorage.getItem('token');
      expect(token).to.be.null;
    });
  });

  /**
   * Test 3: Empty Form Validation
   */
  it('should validate empty form fields', () => {
    // Try to submit without filling form
    cy.get('[data-testid="btn-submit-login"]').click();
    
    // Should show validation errors or prevent submission
    cy.url().should('include', '/login');
    
    // Check for HTML5 validation or custom error messages
    cy.get('[data-testid="input-email"]').then($input => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  /**
   * Test 4: Logout Flow
   */
  it('should logout successfully', () => {
    // First login
    cy.login(validUser.email, validUser.password);
    
    // Verify we're on dashboard
    cy.url().should('include', '/dashboard');
    
    // Click logout button
    cy.get('[data-testid="btn-logout"]').click();
    
    // Verify redirect to login
    cy.url().should('include', '/login');
    
    // Verify token is removed
    cy.window().then((window) => {
      const token = window.localStorage.getItem('token');
      expect(token).to.be.null;
    });
  });

  /**
   * Test 5: Protected Route Access
   */
  it('should redirect to login when accessing protected route without token', () => {
    // Try to access dashboard without logging in
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
  });

  /**
   * Test 6: Remember Session
   */
  it('should maintain session after page reload', () => {
    // Login
    cy.login(validUser.email, validUser.password);
    
    // Reload page
    cy.reload();
    
    // Should still be on dashboard
    cy.url().should('include', '/dashboard');
    
    // Token should still exist
    cy.window().then((window) => {
      const token = window.localStorage.getItem('token');
      expect(token).to.exist;
    });
  });

  /**
   * Test 7: Email Format Validation
   */
  it('should validate email format', () => {
    // Enter invalid email format
    cy.get('[data-testid="input-email"]').type('notanemail');
    cy.get('[data-testid="input-password"]').type('password123');
    cy.get('[data-testid="btn-submit-login"]').click();
    
    // Should show validation error
    cy.get('[data-testid="input-email"]').then($input => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  /**
   * Test 8: Token Expiration Handling
   */
  it('should handle expired token gracefully', () => {
    // Login first
    cy.login(validUser.email, validUser.password);
    
    // Manually set an invalid token
    cy.window().then((window) => {
      window.localStorage.setItem('token', 'invalid_or_expired_token');
    });
    
    // Try to access a protected route
    cy.visit('/dashboard');
    
    // Should intercept 401 and redirect to login
    // (depends on your axios interceptor implementation)
    cy.url().should('include', '/login', { timeout: 10000 });
  });

});
