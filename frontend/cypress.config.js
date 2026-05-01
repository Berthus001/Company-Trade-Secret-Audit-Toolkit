const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Base URL for your application
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1920,
    viewportHeight: 1080,
    
    // Test file location
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Support file
    supportFile: 'cypress/support/e2e.js',
    
    // Timeouts
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    requestTimeout: 10000,
    
    // Video and screenshot settings
    video: true,
    screenshotOnRunFailure: true,
    
    // Browser settings
    chromeWebSecurity: false,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  
  // Environment variables
  env: {
    apiUrl: 'http://localhost:5000/api',
  },
});
