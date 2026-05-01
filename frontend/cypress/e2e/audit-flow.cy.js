/**
 * Cypress E2E Test Suite
 * Trade Secret Audit Toolkit - Audit Flow Tests
 * 
 * Test Suite: Complete Audit Workflow
 */

describe('Audit Creation and Management Flow', () => {
  
  // Test data
  const testUser = {
    email: 'testuser@example.com',
    password: 'SecurePass123'
  };

  const auditData = {
    companyName: 'Acme Corporation Test'
  };

  beforeEach(() => {
    // Login before each test
    cy.clearLocalStorage();
    cy.loginViaApi(testUser.email, testUser.password);
  });

  /**
   * Test 1: Navigate to Audit Form
   */
  it('should navigate to audit creation form', () => {
    cy.visit('/dashboard');
    
    // Click "New Audit" or "Start Audit" button
    cy.get('[data-testid="nav-new-audit"]').click();
    
    // Verify audit form page loaded
    cy.url().should('include', '/audit');
    cy.get('[data-testid="input-company-name"]').should('be.visible');
  });

  /**
   * Test 2: Complete Full Audit Submission
   */
  it('should complete and submit a full audit', () => {
    cy.visit('/audit/new');
    
    // Enter company name
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    
    // Category 1: Answer questions
    cy.get('[data-testid^="question-card-"]').first().within(() => {
      cy.get('[data-testid$="-option-yes"]').first().click();
    });
    
    // Go to next category
    cy.get('[data-testid="btn-next-category"]').click();
    
    // Category 2: Answer questions
    cy.get('[data-testid^="question-card-"]').first().within(() => {
      cy.get('[data-testid$="-option-no"]').first().click();
    });
    
    // Continue through all categories
    // (In real test, you'd loop through all categories)
    cy.get('[data-testid="btn-next-category"]').click();
    
    // Final category
    cy.get('[data-testid^="question-card-"]').first().within(() => {
      cy.get('[data-testid$="-option-partial"]').first().click();
    });
    
    // Submit audit
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Verify redirect to results page
    cy.url().should('match', /\/audit\/[a-f0-9]+\/results/);
    
    // Verify results are displayed
    cy.get('[data-testid="score-card"]').should('be.visible');
  });

  /**
   * Test 3: Verify Audit Results Display
   */
  it('should display audit results correctly', () => {
    // Complete an audit first
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    
    // Answer all questions (simplified for test)
    cy.get('[data-testid^="question-"]').each(($question) => {
      cy.wrap($question).find('[data-testid$="-option-yes"]').first().click();
    });
    
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Verify results page
    cy.get('[data-testid="score-card"]').should('be.visible');
    
    // Verify company name is displayed
    cy.contains(auditData.companyName).should('be.visible');
    
    // Verify score is displayed
    cy.get('[data-testid="total-score"]').should('be.visible');
    cy.get('[data-testid="total-score"]').invoke('text').should('match', /\d+/);
    
    // Verify risk level badge
    cy.get('[data-testid="risk-badge"]').should('be.visible');
    
    // Verify recommendations section
    cy.get('[data-testid="recommendations-section"]').should('be.visible');
  });

  /**
   * Test 4: View Audit History
   */
  it('should display audit history', () => {
    // Create an audit first
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Navigate to audit history
    cy.get('[data-testid="nav-audit-history"]').click();
    
    // Verify history page loaded
    cy.url().should('include', '/audits');
    
    // Verify audit appears in history
    cy.get('[data-testid="audits-table"]').should('be.visible');
    cy.get('[data-testid="audits-table"]').should('contain', auditData.companyName);
  });

  /**
   * Test 5: View Specific Audit from History
   */
  it('should open audit details from history', () => {
    // Create an audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Go to history
    cy.get('[data-testid="nav-audit-history"]').click();
    
    // Click on the audit
    cy.contains(auditData.companyName).click();
    
    // Verify audit details page
    cy.url().should('match', /\/audit\/[a-f0-9]+\/results/);
    cy.get('[data-testid="score-card"]').should('be.visible');
  });

  /**
   * Test 6: Delete Audit
   */
  it('should delete an audit from history', () => {
    // Create an audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Go to history
    cy.get('[data-testid="nav-audit-history"]').click();
    
    // Find and delete the audit
    cy.contains(auditData.companyName).parents('[data-testid^="audit-row-"]').within(() => {
      cy.get('[data-testid^="btn-delete-audit-"]').click();
    });
    
    // Confirm deletion
    cy.on('window:confirm', () => true);
    
    // Verify audit is removed
    cy.get('[data-testid="audits-table"]').should('not.contain', auditData.companyName);
  });

  /**
   * Test 7: Validate Required Fields
   */
  it('should validate company name is required', () => {
    cy.visit('/audit/new');
    
    // Try to proceed without entering company name
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-next-category"]').click();
    
    // Should show validation error
    cy.get('[data-testid="input-company-name"]').then($input => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  /**
   * Test 8: Test Category Navigation
   */
  it('should navigate between audit categories', () => {
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    
    // Answer first category question
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    
    // Go to next category
    cy.get('[data-testid="btn-next-category"]').click();
    
    // Verify category changed (different questions visible)
    cy.get('[data-testid="category-title"]').should('be.visible');
    
    // Go back to previous category
    cy.get('[data-testid="btn-prev-category"]').click();
    
    // Verify we're back on first category
    cy.get('[data-testid="category-title"]').should('be.visible');
  });

  /**
   * Test 9: Test Progress Indicator
   */
  it('should show audit progress', () => {
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    
    // Check initial progress
    cy.get('[data-testid="progress-indicator"]').should('be.visible');
    
    // Answer questions and check progress updates
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-next-category"]').click();
    
    // Progress should increase
    cy.get('[data-testid="progress-indicator"]').should('contain', '%');
  });

  /**
   * Test 10: Test AI Recommendations
   */
  it('should display AI recommendations after audit', () => {
    // Complete audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    cy.get('[data-testid^="question-"]').each(($question) => {
      cy.wrap($question).find('[data-testid$="-option-no"]').first().click();
    });
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Wait for AI recommendations to load
    cy.get('[data-testid="recommendations-section"]', { timeout: 15000 }).should('be.visible');
    
    // Verify recommendation cards are displayed
    cy.get('[data-testid^="recommendation-card-"]').should('have.length.greaterThan', 0);
    
    // Verify recommendation has priority
    cy.get('[data-testid^="recommendation-card-"]').first().within(() => {
      cy.get('[data-testid="recommendation-priority"]').should('be.visible');
    });
  });

  /**
   * Test 11: Compare Audits
   */
  it('should compare multiple audits', () => {
    // Create first audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type('Company A');
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Create second audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type('Company B');
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-no"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Go to comparison page
    cy.visit('/audits/compare');
    
    // Select audits to compare
    cy.get('[data-testid="select-audit-1"]').select('Company A');
    cy.get('[data-testid="select-audit-2"]').select('Company B');
    cy.get('[data-testid="btn-compare"]').click();
    
    // Verify comparison results
    cy.get('[data-testid="comparison-results"]').should('be.visible');
  });

  /**
   * Test 12: Export Audit Results
   */
  it('should export audit results', () => {
    // Complete an audit
    cy.visit('/audit/new');
    cy.get('[data-testid="input-company-name"]').type(auditData.companyName);
    cy.get('[data-testid^="question-"]').first().find('[data-testid$="-option-yes"]').click();
    cy.get('[data-testid="btn-submit-audit"]').click();
    
    // Click export button
    cy.get('[data-testid="btn-export-results"]').click();
    
    // Verify download initiated
    // (Cypress file download testing requires additional setup)
    cy.get('[data-testid="btn-export-results"]').should('exist');
  });

});

/**
 * Test Suite: Dashboard Summary
 */
describe('Dashboard and Summary', () => {
  
  const testUser = {
    email: 'testuser@example.com',
    password: 'SecurePass123'
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.loginViaApi(testUser.email, testUser.password);
    cy.visit('/dashboard');
  });

  /**
   * Test 13: Dashboard Displays Statistics
   */
  it('should display audit statistics on dashboard', () => {
    // Verify dashboard elements
    cy.get('[data-testid="dashboard"]').should('be.visible');
    cy.get('[data-testid="dashboard-welcome"]').should('be.visible');
    
    // Verify statistics cards
    cy.get('[data-testid="stat-total-audits"]').should('be.visible');
    cy.get('[data-testid="stat-avg-score"]').should('be.visible');
    
    // Verify recent audits section
    cy.get('[data-testid="recent-audits"]').should('be.visible');
  });

  /**
   * Test 14: Dashboard Refreshes Data
   */
  it('should refresh dashboard data', () => {
    // Click refresh button
    cy.get('[data-testid="btn-refresh-dashboard"]').click();
    
    // Verify loading state or updated data
    cy.get('[data-testid="dashboard"]').should('be.visible');
  });

});
