# Cypress Quick Reference

## 🚀 Running Tests

```bash
# Interactive mode (recommended for development)
npm run cypress:open

# Headless mode (for CI/CD)
npm run test:e2e

# Specific test file
npx cypress run --spec "cypress/e2e/login.cy.js"

# Specific browser
npm run test:e2e:chrome
npx cypress run --browser firefox
```

---

## 🧪 Custom Commands

```javascript
// Login via UI
cy.login('user@example.com', 'password123')

// Login via API (faster)
cy.loginViaApi('user@example.com', 'password123')

// Login as role
cy.loginAs('admin')  // or 'superadmin', 'user'

// Logout
cy.logout()

// Create user
cy.createUser({ name, email, password, company })

// Get current user
cy.getCurrentUser()
```

---

## 📝 Common Cypress Commands

```javascript
// Visit page
cy.visit('/login')

// Find element
cy.get('[data-testid="element"]')

// Type text
cy.get('[data-testid="input"]').type('text')

// Click
cy.get('[data-testid="button"]').click()

// Assertions
cy.url().should('include', '/dashboard')
cy.get('[data-testid="element"]').should('be.visible')
cy.get('[data-testid="element"]').should('contain', 'text')

// Wait for element
cy.get('[data-testid="element"]', { timeout: 10000 })

// Clear and type
cy.get('[data-testid="input"]').clear().type('new text')
```

---

## 🐛 Debugging

```javascript
// Pause test
cy.pause()

// Log message
cy.log('Debug message')

// Take screenshot
cy.screenshot('name')

// Debug element
cy.get('[data-testid="element"]').debug()
```

---

## 📦 Installation

```bash
cd frontend
npm install
npx cypress verify
```

---

## ✅ Prerequisites

- Backend running on port 5000
- Frontend running on port 3000
- data-testid attributes added to components
- Test accounts created

---

**Full docs:** See `CYPRESS_README.md`
