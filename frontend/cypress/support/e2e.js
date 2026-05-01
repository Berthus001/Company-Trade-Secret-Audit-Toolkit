// ***********************************************************
// Cypress Support File
// Custom commands and global configuration
// ***********************************************************

// Import commands
import './commands';

// Global before hook
before(() => {
  // Clear all data before test suite
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Before each test
beforeEach(() => {
  // Preserve session if needed, or clear for fresh test
  // cy.clearLocalStorage();
});

// After each test
afterEach(() => {
  // Cleanup logic if needed
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // You can customize this based on your needs
  console.error('Uncaught exception:', err);
  return false;
});
