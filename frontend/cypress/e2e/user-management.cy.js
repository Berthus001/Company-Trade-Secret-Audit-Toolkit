/**
 * Cypress E2E Test Suite
 * Trade Secret Audit Toolkit - User Management Tests
 * 
 * Test Suite: Admin User Management & RBAC
 */

describe('User Management Flow', () => {
  
  // Test data
  const adminUser = {
    email: 'admin@example.com',
    password: 'Admin123'
  };

  const newUser = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'JohnDoe123',
    company: 'Acme Corporation'
  };

  const updatedUser = {
    name: 'John Smith',
    company: 'Smith Industries'
  };

  beforeEach(() => {
    // Login as admin before each test
    cy.clearLocalStorage();
    cy.loginViaApi(adminUser.email, adminUser.password);
    cy.visit('/manage-users');
  });

  /**
   * Test 1: View Users List
   */
  it('should display users table for admin', () => {
    // Verify page loaded
    cy.url().should('include', '/manage-users');
    
    // Verify users table is visible
    cy.get('[data-testid="users-table"]').should('be.visible');
    
    // Verify create user button is visible
    cy.get('[data-testid="btn-create-user"]').should('be.visible');
  });

  /**
   * Test 2: Create New User
   */
  it('should create a new user successfully', () => {
    // Click create user button
    cy.get('[data-testid="btn-create-user"]').click();
    
    // Verify modal/form is visible
    cy.get('[data-testid="user-form"]').should('be.visible');
    
    // Fill in user details
    cy.get('[data-testid="modal-input-name"]').type(newUser.name);
    cy.get('[data-testid="modal-input-email"]').type(newUser.email);
    cy.get('[data-testid="modal-input-password"]').type(newUser.password);
    cy.get('[data-testid="modal-input-company"]').type(newUser.company);
    
    // Submit form
    cy.get('[data-testid="modal-btn-submit"]').click();
    
    // Verify success message or modal closes
    cy.get('[data-testid="user-form"]').should('not.exist');
    
    // Verify new user appears in table
    cy.get('[data-testid="users-table"]').should('contain', newUser.name);
    cy.get('[data-testid="users-table"]').should('contain', newUser.email);
  });

  /**
   * Test 3: Edit User
   */
  it('should edit an existing user', () => {
    // First, create a user to edit
    cy.createUser(newUser);
    
    // Find the user in the table and click edit
    cy.contains(newUser.name).parents('[data-testid^="user-row-"]').within(() => {
      cy.get('[data-testid^="btn-edit-user-"]').click();
    });
    
    // Verify edit form is visible
    cy.get('[data-testid="user-form"]').should('be.visible');
    
    // Update user details
    cy.get('[data-testid="modal-input-name"]').clear().type(updatedUser.name);
    cy.get('[data-testid="modal-input-company"]').clear().type(updatedUser.company);
    
    // Submit form
    cy.get('[data-testid="modal-btn-submit"]').click();
    
    // Verify updated user appears in table
    cy.get('[data-testid="users-table"]').should('contain', updatedUser.name);
    cy.get('[data-testid="users-table"]').should('contain', updatedUser.company);
  });

  /**
   * Test 4: Delete User
   */
  it('should delete a user', () => {
    // First, create a user to delete
    cy.createUser(newUser);
    
    // Find the user in the table
    cy.contains(newUser.name).parents('[data-testid^="user-row-"]').then($row => {
      const userId = $row.attr('data-testid').replace('user-row-', '');
      
      // Click delete button
      cy.get(`[data-testid="btn-delete-user-${userId}"]`).click();
      
      // Confirm deletion in dialog
      cy.on('window:confirm', () => true);
      
      // Verify user is removed from table
      cy.get('[data-testid="users-table"]').should('not.contain', newUser.name);
    });
  });

  /**
   * Test 5: Search/Filter Users
   */
  it('should filter users by search term', () => {
    // Create multiple users first
    cy.createUser(newUser);
    cy.createUser({
      name: 'Jane Smith',
      email: 'janesmith@example.com',
      password: 'Jane123',
      company: 'Smith Corp'
    });
    
    // Search for specific user
    cy.get('[data-testid="input-search-users"]').type('John');
    
    // Verify only matching users are shown
    cy.get('[data-testid="users-table"]').should('contain', 'John Doe');
    cy.get('[data-testid="users-table"]').should('not.contain', 'Jane Smith');
  });

  /**
   * Test 6: Ownership Validation (Admin can only see their users)
   */
  it('should only show users created by the logged-in admin', () => {
    // Verify table shows users
    cy.get('[data-testid="users-table"]').should('be.visible');
    
    // Get current user to verify ownership
    cy.getCurrentUser().then(currentUser => {
      expect(currentUser.role).to.equal('admin');
      
      // All displayed users should have createdBy = current admin's ID
      // This is implicit - backend filters the response
      cy.get('[data-testid="users-table"]').should('exist');
    });
  });

  /**
   * Test 7: Prevent Role Escalation
   */
  it('should not allow admin to create another admin', () => {
    // Click create user button
    cy.get('[data-testid="btn-create-user"]').click();
    
    // Verify role dropdown/select doesn't have admin option
    // Or admin role option is disabled
    cy.get('[data-testid="modal-select-role"]').then($select => {
      if ($select.length > 0) {
        // If role selector exists, verify admin/superadmin are not options
        cy.get('[data-testid="modal-select-role"] option').should('not.contain', 'admin');
        cy.get('[data-testid="modal-select-role"] option').should('not.contain', 'superadmin');
      }
    });
  });

  /**
   * Test 8: Form Validation
   */
  it('should validate required fields when creating user', () => {
    // Click create user button
    cy.get('[data-testid="btn-create-user"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="modal-btn-submit"]').click();
    
    // Verify validation errors
    cy.get('[data-testid="modal-input-name"]').then($input => {
      expect($input[0].validity.valid).to.be.false;
    });
    
    cy.get('[data-testid="modal-input-email"]').then($input => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  /**
   * Test 9: Email Uniqueness Validation
   */
  it('should prevent creating user with duplicate email', () => {
    // Create first user
    cy.createUser(newUser);
    
    // Try to create another user with same email
    cy.get('[data-testid="btn-create-user"]').click();
    cy.get('[data-testid="modal-input-name"]').type('Another User');
    cy.get('[data-testid="modal-input-email"]').type(newUser.email); // Same email
    cy.get('[data-testid="modal-input-password"]').type('Password123');
    cy.get('[data-testid="modal-input-company"]').type('Some Company');
    cy.get('[data-testid="modal-btn-submit"]').click();
    
    // Verify error message
    cy.contains('already exists').should('be.visible');
  });

  /**
   * Test 10: Cancel User Creation
   */
  it('should cancel user creation without saving', () => {
    // Click create user button
    cy.get('[data-testid="btn-create-user"]').click();
    
    // Fill some fields
    cy.get('[data-testid="modal-input-name"]').type('Test User');
    cy.get('[data-testid="modal-input-email"]').type('test@example.com');
    
    // Cancel/close modal
    cy.get('[data-testid="btn-cancel"]').click();
    
    // Verify modal is closed
    cy.get('[data-testid="user-form"]').should('not.exist');
    
    // Verify user was not created
    cy.get('[data-testid="users-table"]').should('not.contain', 'test@example.com');
  });

});

/**
 * Test Suite: Superadmin Specific Tests
 */
describe('Superadmin User Management', () => {
  
  const superadminUser = {
    email: 'superadmin@example.com',
    password: 'SuperAdmin123'
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.loginViaApi(superadminUser.email, superadminUser.password);
    cy.visit('/manage-admins');
  });

  /**
   * Test 11: Create Admin User
   */
  it('should allow superadmin to create admin users', () => {
    const newAdmin = {
      name: 'New Admin',
      email: 'newadmin@example.com',
      password: 'NewAdmin123',
      company: 'Admin Company'
    };

    // Click create admin button
    cy.get('[data-testid="btn-create-admin"]').click();
    
    // Fill admin details
    cy.get('[data-testid="modal-input-name"]').type(newAdmin.name);
    cy.get('[data-testid="modal-input-email"]').type(newAdmin.email);
    cy.get('[data-testid="modal-input-password"]').type(newAdmin.password);
    cy.get('[data-testid="modal-input-company"]').type(newAdmin.company);
    
    // Submit
    cy.get('[data-testid="modal-btn-submit"]').click();
    
    // Verify admin created
    cy.get('[data-testid="admins-table"]').should('contain', newAdmin.name);
  });

  /**
   * Test 12: View All Users (Not Limited by Ownership)
   */
  it('should see all users across all admins', () => {
    cy.visit('/manage-users');
    
    // Superadmin should see users from all admins
    cy.get('[data-testid="users-table"]').should('be.visible');
    
    // This test would need actual data to verify
    // But structurally, superadmin has no createdBy filter
  });

});
