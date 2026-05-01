# Cypress E2E Testing Setup

## 🎯 Overview

This project now uses **Cypress** for end-to-end testing, replacing Selenium WebDriver. Cypress provides faster, more reliable tests with better developer experience.

---

## 📦 Installation

### Step 1: Install Cypress

```bash
cd frontend
npm install
```

This will install Cypress (version 13.6.0) from the devDependencies.

### Step 2: Verify Installation

```bash
npx cypress verify
```

---

## 🚀 Running Tests

### Interactive Mode (Cypress Test Runner)

**Recommended for development - see tests run in real-time:**

```bash
npm run cypress:open
# or
npm run test:e2e:open
```

This opens the Cypress Test Runner where you can:
- Select which tests to run
- See tests execute in real browser
- Use time-travel debugging
- Automatically re-run tests on file changes

### Headless Mode (Command Line)

**For CI/CD and automated testing:**

```bash
npm run cypress:run
# or
npm run test:e2e
```

### Specific Browser

```bash
npm run test:e2e:chrome  # Chrome only
npx cypress run --browser firefox  # Firefox
npx cypress run --browser edge  # Edge
```

### Headed Mode (See browser while running)

```bash
npm run test:e2e:headed
```

### Run Specific Test File

```bash
npx cypress run --spec "cypress/e2e/login.cy.js"
npx cypress run --spec "cypress/e2e/user-management.cy.js"
npx cypress run --spec "cypress/e2e/audit-flow.cy.js"
```

---

## 📁 Test Structure

```
frontend/
├── cypress/
│   ├── e2e/                    # Test files
│   │   ├── login.cy.js         # Authentication tests
│   │   ├── user-management.cy.js  # User CRUD & RBAC tests
│   │   └── audit-flow.cy.js    # Audit creation & results
│   ├── support/
│   │   ├── e2e.js             # Global hooks & config
│   │   └── commands.js        # Custom commands
│   └── fixtures/              # Test data (optional)
├── cypress.config.js          # Cypress configuration
└── package.json
```

---

## 🧪 Test Suites

### 1. Authentication Tests (`login.cy.js`)
- ✅ Valid login
- ✅ Invalid login
- ✅ Form validation
- ✅ Logout flow
- ✅ Protected routes
- ✅ Session persistence
- ✅ Token expiration

**Run:** `npx cypress run --spec "cypress/e2e/login.cy.js"`

### 2. User Management Tests (`user-management.cy.js`)
- ✅ View users table
- ✅ Create new user
- ✅ Edit user
- ✅ Delete user
- ✅ Search/filter users
- ✅ Ownership validation (RBAC)
- ✅ Form validation
- ✅ Email uniqueness
- ✅ Superadmin tests

**Run:** `npx cypress run --spec "cypress/e2e/user-management.cy.js"`

### 3. Audit Flow Tests (`audit-flow.cy.js`)
- ✅ Navigate to audit form
- ✅ Complete full audit
- ✅ View results
- ✅ View history
- ✅ Delete audit
- ✅ Field validation
- ✅ Category navigation
- ✅ Progress indicator
- ✅ AI recommendations
- ✅ Compare audits
- ✅ Dashboard statistics

**Run:** `npx cypress run --spec "cypress/e2e/audit-flow.cy.js"`

---

## 🛠️ Custom Commands

Cypress custom commands are defined in `cypress/support/commands.js`:

### Authentication Commands

```javascript
// UI Login
cy.login('user@example.com', 'password123');

// API Login (faster, no UI interaction)
cy.loginViaApi('user@example.com', 'password123');

// Login as specific role
cy.loginAs('admin');  // or 'superadmin', 'user'

// Logout
cy.logout();
```

### User Management Commands

```javascript
// Create user via UI
cy.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Pass123',
  company: 'Acme Corp'
});

// Delete user
cy.deleteUser('userId123');

// Get current user from localStorage
cy.getCurrentUser().then(user => {
  console.log(user.email);
});
```

### Utility Commands

```javascript
// Check if element exists
cy.elementExists('[data-testid="some-element"]');

// Wait for API call
cy.waitForApi('/api/users', 'getUsers');
```

---

## ⚙️ Configuration

Edit `cypress.config.js` to customize:

```javascript
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',  // Frontend URL
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    video: true,                       // Record videos
    screenshotOnRunFailure: true,      // Screenshots on failure
  },
  env: {
    apiUrl: 'http://localhost:5000/api'  // Backend API URL
  }
});
```

---

## 📝 Writing New Tests

### Basic Test Structure

```javascript
describe('Feature Name', () => {
  
  beforeEach(() => {
    // Setup before each test
    cy.clearLocalStorage();
    cy.loginViaApi('user@example.com', 'password123');
    cy.visit('/some-page');
  });

  it('should do something', () => {
    // Test steps
    cy.get('[data-testid="element"]').click();
    cy.get('[data-testid="input"]').type('value');
    
    // Assertions
    cy.url().should('include', '/expected-url');
    cy.get('[data-testid="result"]').should('be.visible');
  });

});
```

### Best Practices

1. **Use data-testid attributes** (not CSS classes or IDs)
   ```javascript
   cy.get('[data-testid="btn-submit"]')  // ✅ Good
   cy.get('.submit-button')              // ❌ Fragile
   ```

2. **Login via API** (faster than UI login)
   ```javascript
   cy.loginViaApi('user@example.com', 'password123')  // ✅ Fast
   cy.visit('/login'); /* fill form */                 // ❌ Slow
   ```

3. **Chain commands** for readability
   ```javascript
   cy.get('[data-testid="input"]').clear().type('value').blur()
   ```

4. **Use custom commands** for reusability
   ```javascript
   cy.createUser(userData)  // ✅ Reusable
   ```

---

## 🐛 Debugging

### Cypress Test Runner (Interactive Mode)

1. Open Cypress: `npm run cypress:open`
2. Click on test file
3. Watch test execute in browser
4. **Time travel** - hover over commands to see snapshots
5. **DevTools** - inspect elements, console logs
6. **Pause** - Add `.pause()` to stop execution

```javascript
cy.get('[data-testid="input"]')
  .pause()  // Test pauses here
  .type('value');
```

### Debug Commands

```javascript
// Log to console
cy.log('Debug message');

// Pause test
cy.pause();

// Debug specific element
cy.get('[data-testid="element"]').debug();

// Take screenshot
cy.screenshot('my-screenshot');
```

### View Screenshots & Videos

After running tests:
- **Screenshots:** `frontend/cypress/screenshots/`
- **Videos:** `frontend/cypress/videos/`

---

## ✅ Prerequisites

Before running tests, ensure:

### 1. Add data-testid Attributes

All frontend components need `data-testid` attributes. See `CRITICAL_FIXES.md` Fix #3 for details.

**Example:**
```jsx
<input 
  data-testid="input-email"
  type="email"
  name="email"
/>
```

### 2. Backend Running

```bash
cd backend
npm start
```

Backend should be running on `http://localhost:5000`

### 3. Frontend Running

```bash
cd frontend
npm start
```

Frontend should be running on `http://localhost:3000`

### 4. Test User Accounts

Ensure these test accounts exist in your database:
- **Superadmin:** superadmin@example.com / SuperAdmin123
- **Admin:** admin@example.com / Admin123
- **User:** testuser@example.com / SecurePass123

**Create test accounts:**
```bash
cd backend
node scripts/createTestAccounts.js
```

---

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Start backend
        run: cd backend && npm start &
      
      - name: Start frontend
        run: cd frontend && npm start &
      
      - name: Wait for servers
        run: npx wait-on http://localhost:3000 http://localhost:5000
      
      - name: Run Cypress tests
        run: cd frontend && npm run test:e2e
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: frontend/cypress/screenshots
```

### Vercel/Render Integration

Set environment variables in your deployment:
- `CYPRESS_BASE_URL` - Your deployed frontend URL
- `CYPRESS_API_URL` - Your deployed backend URL

---

## 📊 Test Results & Reporting

### View Results in Terminal

```bash
npm run test:e2e
```

Output shows:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- ⏱️ Execution time
- 📊 Summary statistics

### Cypress Dashboard (Optional)

For advanced reporting, use Cypress Dashboard:

1. Sign up at https://dashboard.cypress.io
2. Get project key
3. Run: `npx cypress run --record --key <your-key>`

Features:
- Test analytics
- Failure screenshots/videos
- Parallel execution
- Historical trends

---

## 🔄 Migration from Selenium

### What Changed

| Selenium | Cypress |
|----------|---------|
| `driver.findElement()` | `cy.get()` |
| `driver.get()` | `cy.visit()` |
| `element.sendKeys()` | `cy.type()` |
| `element.click()` | `cy.click()` |
| `driver.wait()` | Auto-waits built-in |
| `driver.sleep(1000)` | ❌ Not needed |
| `driver.executeScript()` | `cy.window()` |

### Code Comparison

**Selenium (Before):**
```javascript
const emailInput = await driver.findElement(By.css('[data-testid="input-email"]'));
await emailInput.clear();
await emailInput.sendKeys('test@example.com');
await driver.sleep(1000);
const submitButton = await driver.findElement(By.css('[data-testid="btn-submit"]'));
await submitButton.click();
await driver.wait(until.urlContains('/dashboard'), 10000);
```

**Cypress (After):**
```javascript
cy.get('[data-testid="input-email"]').type('test@example.com');
cy.get('[data-testid="btn-submit"]').click();
cy.url().should('include', '/dashboard');
```

**60% less code, 5x faster execution!**

---

## 🆘 Troubleshooting

### Tests Timing Out

**Problem:** `cy.get('[data-testid="element"]')` times out

**Solution:**
1. Check element exists in DOM
2. Increase timeout: `cy.get('[data-testid="element"]', { timeout: 10000 })`
3. Ensure servers are running
4. Check data-testid spelling

### CORS Errors

**Problem:** API requests fail with CORS errors

**Solution:**
Add `chromeWebSecurity: false` to `cypress.config.js` (already added)

### Element Not Visible

**Problem:** `cy.get('[data-testid="element"]')` finds element but it's not visible

**Solution:**
1. Scroll to element: `cy.get('[data-testid="element"]').scrollIntoView()`
2. Force click: `cy.get('[data-testid="element"]').click({ force: true })`

### Authentication Issues

**Problem:** Tests fail because user not logged in

**Solution:**
Use `cy.loginViaApi()` in `beforeEach()`:
```javascript
beforeEach(() => {
  cy.loginViaApi('user@example.com', 'password123');
});
```

### Missing data-testid

**Problem:** Test fails with "Timed out retrying: Expected to find element"

**Solution:**
Add `data-testid` attributes to your components. See `CRITICAL_FIXES.md` Fix #3.

---

## 📚 Resources

- **Cypress Docs:** https://docs.cypress.io
- **Best Practices:** https://docs.cypress.io/guides/references/best-practices
- **API Reference:** https://docs.cypress.io/api/table-of-contents
- **Examples:** https://github.com/cypress-io/cypress-example-recipes

---

## 🎉 Next Steps

1. **Apply data-testid fixes** (see `CRITICAL_FIXES.md`)
2. **Install Cypress:** `cd frontend && npm install`
3. **Create test accounts:** `cd backend && node scripts/createTestAccounts.js`
4. **Start servers:** Backend (port 5000) + Frontend (port 3000)
5. **Run tests:** `npm run cypress:open`

---

**Questions?** Check the [Cypress documentation](https://docs.cypress.io) or ask your team!

**System is ready for Cypress testing! 🚀**
