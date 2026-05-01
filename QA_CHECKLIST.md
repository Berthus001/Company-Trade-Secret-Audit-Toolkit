# QA Readiness Checklist
## Trade Secret Audit Toolkit - Test Readiness Verification

**Project:** Company Trade Secret Audit Toolkit  
**Date:** May 1, 2026  
**Version:** 1.0.0  
**Status:** Pre-Production Testing Phase

---

## 🎯 Pre-Testing Requirements

### Environment Setup
- [ ] MongoDB Atlas connection string configured
- [ ] Backend deployed on Render (or running locally on port 5000)
- [ ] Frontend deployed on Vercel (or running locally on port 3000)
- [ ] All environment variables set (see Environment Variables section)
- [ ] CORS configured with correct frontend URL
- [ ] Test user accounts created (superadmin, admin, regular user)

### Required Accounts for Testing
Create these accounts before testing:

- [ ] **Superadmin Account**
  - Email: `superadmin@test.com`
  - Password: `SuperAdmin123!`
  - Role: superadmin

- [ ] **Admin Account 1**
  - Email: `admin1@test.com`
  - Password: `Admin123!`
  - Role: admin
  - Created by: Superadmin

- [ ] **Admin Account 2**
  - Email: `admin2@test.com`
  - Password: `Admin123!`
  - Role: admin
  - Created by: Superadmin

- [ ] **Regular User Account**
  - Email: `user1@test.com`
  - Password: `User123!`
  - Role: user
  - Created by: Admin 1

---

## 📋 A) API TESTING READINESS

### API Documentation
- [ ] All endpoints documented in `QA_AUDIT_REPORT.md`
- [ ] Request/response formats documented
- [ ] Authentication requirements clear
- [ ] Error codes documented (200, 201, 400, 401, 403, 404)

### Postman Collection
- [ ] `POSTMAN_COLLECTION.json` imported into Postman
- [ ] Environment variables set in Postman:
  - [ ] `baseUrl` set to backend URL
  - [ ] `authToken` variable created (empty initially)
  - [ ] `userId` variable created
  - [ ] `auditId` variable created
- [ ] Test scripts configured to auto-save tokens
- [ ] Collection organized by feature (Auth, Users, Questions, Audits)

### API Endpoint Verification
#### Health & Status
- [ ] `GET /api/health` returns 200
- [ ] Response contains success: true
- [ ] Timestamp in ISO format

#### Authentication (Public Endpoints)
- [ ] `POST /api/auth/register` creates new user
- [ ] `POST /api/auth/register` returns 400 for duplicate email
- [ ] `POST /api/auth/register` returns 400 for weak password (<8 chars)
- [ ] `POST /api/auth/login` returns token for valid credentials
- [ ] `POST /api/auth/login` returns 401 for invalid credentials
- [ ] Token stored and can be used for subsequent requests

#### Authentication (Protected Endpoints)
- [ ] `GET /api/auth/me` returns 401 without token
- [ ] `GET /api/auth/me` returns user profile with valid token
- [ ] `PUT /api/auth/profile` updates user information
- [ ] `PUT /api/auth/password` changes password successfully
- [ ] Old password required to change password

#### User Management (Superadmin)
- [ ] `POST /api/auth/users/create-admin` creates admin (superadmin only)
- [ ] `POST /api/auth/users/create-admin` returns 403 for non-superadmin
- [ ] Admin created has `createdBy` field set to superadmin ID

#### User Management (Admin/Superadmin)
- [ ] `POST /api/auth/users/create-user` creates regular user
- [ ] User created has `createdBy` field set to creator ID
- [ ] `GET /api/auth/users` returns all users for superadmin
- [ ] `GET /api/auth/users` returns only owned users for admin
- [ ] `GET /api/auth/users?role=user` filters by role
- [ ] `PUT /api/auth/users/:id` updates user (ownership checked for admin)
- [ ] `PUT /api/auth/users/:id` returns 403 if admin doesn't own user
- [ ] `DELETE /api/auth/users/:id` deletes user (ownership checked)
- [ ] `DELETE /api/auth/users/:id` returns 403 if admin doesn't own user
- [ ] Cannot delete superadmin accounts

#### Questions
- [ ] `GET /api/questions` returns grouped questions
- [ ] Questions grouped by category (Access Control, Data Encryption, etc.)
- [ ] `GET /api/questions/:id` returns single question
- [ ] `POST /api/questions/seed` seeds questions (superadmin only)
- [ ] `POST /api/questions/seed` returns 403 for non-superadmin

#### Audits
- [ ] `POST /api/audits` creates audit with responses
- [ ] `POST /api/audits` calculates scores correctly
- [ ] `POST /api/audits` generates recommendations
- [ ] `POST /api/audits` returns 400 for missing companyName
- [ ] `POST /api/audits` returns 400 for invalid questionId
- [ ] `POST /api/audits` returns 400 for invalid selectedValue (not 0-4)
- [ ] `GET /api/audits/my` returns current user's audits
- [ ] `GET /api/audits/my?page=1&limit=10` paginates correctly
- [ ] `GET /api/audits` returns all audits (admin/superadmin only)
- [ ] `GET /api/audits` returns 403 for regular users
- [ ] `GET /api/audits/:id` returns single audit
- [ ] `GET /api/audits/summary` returns statistics
- [ ] `DELETE /api/audits/:id` deletes audit
- [ ] `POST /api/audits/recommendations` generates AI recommendations

#### Error Handling
- [ ] All errors return consistent format: `{ success: false, error: "message" }`
- [ ] 401 errors for missing/invalid tokens
- [ ] 403 errors for insufficient permissions
- [ ] 404 errors for resources not found
- [ ] 400 errors for validation failures
- [ ] 500 errors for server errors (with error handler middleware)

### RBAC & Ownership Testing
- [ ] Superadmin can create admins
- [ ] Admin cannot create admins
- [ ] Admin can create regular users
- [ ] Regular users cannot create any users
- [ ] Admin can only view users they created
- [ ] Admin cannot edit users created by other admins
- [ ] Admin cannot delete users created by other admins
- [ ] Superadmin can edit/delete all users
- [ ] Cannot delete superadmin accounts

---

## 🖥️ B) BACKEND CODE QUALITY

### Middleware
- [ ] `protect` middleware verifies JWT tokens
- [ ] `protect` middleware attaches user to req.user
- [ ] `allowRoles` middleware checks user role
- [ ] `verifyOwnership` middleware checks createdBy field
- [ ] Error handler middleware catches all errors
- [ ] Async handler wrapper catches async errors

### Controllers
- [ ] All controllers use asyncHandler
- [ ] Input validation on all endpoints
- [ ] Consistent error messages
- [ ] Ownership checks in update/delete operations
- [ ] Password hashing before saving
- [ ] No passwords in API responses

### Security
- [ ] Helmet middleware enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled (100 req/15min in prod)
- [ ] MongoDB sanitization enabled (no NoSQL injection)
- [ ] JWT tokens expire (check JWT_SECRET config)
- [ ] Passwords min 8 characters
- [ ] Environment variables not committed to git

---

## 🎨 C) FRONTEND READINESS

### Environment Configuration
- [ ] `.env.development` has localhost backend URL
- [ ] `.env.production` has Render backend URL
- [ ] `REACT_APP_API_URL` includes `/api` suffix
- [ ] No hardcoded localhost URLs in code
- [ ] Build succeeds without errors

### API Integration
- [ ] All API calls use `api.js` service
- [ ] axios instance uses `process.env.REACT_APP_API_URL`
- [ ] Token attached to requests via `setAuthToken()`
- [ ] Error responses handled gracefully
- [ ] Loading states for async operations
- [ ] Success/error messages displayed to user

### Authentication Flow
- [ ] Login stores token in localStorage
- [ ] Login redirects to dashboard
- [ ] Protected routes redirect to login if not authenticated
- [ ] Token validated on app load
- [ ] Logout removes token and redirects to login
- [ ] User profile displayed in navbar
- [ ] Role badge displayed (user/admin/superadmin)

### User Management (Admin)
- [ ] Admin can navigate to "Manage Users"
- [ ] Admin sees only users they created
- [ ] Admin can create new users
- [ ] Admin can edit users they created
- [ ] Admin can delete users they created
- [ ] Error displayed if trying to edit other admin's users

### Audit Flow
- [ ] User can navigate to "New Audit"
- [ ] Company name pre-filled with user's company
- [ ] Questions load grouped by category
- [ ] User can answer questions (radio buttons)
- [ ] Cannot proceed to next category until all answered
- [ ] Progress indicator shows completion
- [ ] Submit button enabled only when all questions answered
- [ ] Results page displays after submission
- [ ] Score and risk level displayed
- [ ] Recommendations displayed
- [ ] Audit appears in history

### UI/UX
- [ ] Navigation links work correctly
- [ ] Role-based navigation (user vs admin vs superadmin)
- [ ] Loading spinners during API calls
- [ ] Error messages displayed prominently
- [ ] Success messages displayed
- [ ] Forms validate before submission
- [ ] Responsive design (mobile/tablet/desktop)

---

## 🤖 D) SELENIUM AUTOMATION READINESS

### Test Environment Setup
- [ ] Node.js installed
- [ ] Chrome browser installed
- [ ] `selenium-tests/` directory exists
- [ ] Dependencies installed: `npm install` in selenium-tests/
- [ ] Backend running and accessible
- [ ] Frontend running and accessible
- [ ] Test user accounts created

### data-testid Attributes (CRITICAL)
⚠️ **These must be added before Selenium tests will work reliably**

#### Login Page
- [ ] Form: `data-testid="login-form"`
- [ ] Email input: `data-testid="input-email"`
- [ ] Password input: `data-testid="input-password"`
- [ ] Submit button: `data-testid="btn-submit-login"`
- [ ] Error message: `data-testid="error-message"`

#### Navbar
- [ ] Navbar container: `data-testid="navbar"`
- [ ] Dashboard link: `data-testid="nav-dashboard"`
- [ ] New Audit link: `data-testid="nav-new-audit"`
- [ ] History link: `data-testid="nav-audit-history"`
- [ ] Manage Users link: `data-testid="nav-manage-users"`
- [ ] Manage Admins link: `data-testid="nav-manage-admins"`
- [ ] Logout button: `data-testid="btn-logout"`

#### Manage Users Page
- [ ] Create User button: `data-testid="btn-create-user"`
- [ ] Users table: `data-testid="users-table"`
- [ ] User row: `data-testid="user-row-{userId}"`
- [ ] Edit button: `data-testid="btn-edit-user-{userId}"`
- [ ] Delete button: `data-testid="btn-delete-user-{userId}"`
- [ ] Modal form: `data-testid="user-form"`
- [ ] Name input: `data-testid="modal-input-name"`
- [ ] Email input: `data-testid="modal-input-email"`
- [ ] Password input: `data-testid="modal-input-password"`
- [ ] Company input: `data-testid="modal-input-company"`
- [ ] Submit button: `data-testid="modal-btn-submit"`

#### Audit Form
- [ ] Company name input: `data-testid="input-company-name"`
- [ ] Question card: `data-testid="question-card-{questionId}"`
- [ ] Question text: `data-testid="question-text-{questionId}"`
- [ ] Answer option: `data-testid="question-{questionId}-option-{value}"`
- [ ] Next button: `data-testid="btn-next-category"`
- [ ] Submit button: `data-testid="btn-submit-audit"`

#### Dashboard
- [ ] Dashboard container: `data-testid="dashboard"`
- [ ] Welcome message: `data-testid="dashboard-welcome"`
- [ ] Summary section: `data-testid="dashboard-summary"`
- [ ] Total audits stat: `data-testid="stat-total-audits"`
- [ ] Average score stat: `data-testid="stat-avg-score"`

### Selenium Tests
- [ ] `test-login.js` runs without errors
- [ ] `test-login.js` - Valid login test passes
- [ ] `test-login.js` - Invalid login test passes
- [ ] `test-login.js` - Logout test passes
- [ ] `test-user-management.js` runs without errors
- [ ] `test-user-management.js` - Create user test passes
- [ ] `test-user-management.js` - Edit user test passes
- [ ] `test-user-management.js` - Delete user test passes
- [ ] `test-audit-flow.js` runs without errors
- [ ] `test-audit-flow.js` - Complete audit flow passes
- [ ] All tests clean up after themselves (driver.quit())

---

## 🌍 E) DEPLOYMENT & ENVIRONMENT

### Backend Environment Variables (Render)
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (or Render default)
- [ ] `MONGO_URI` set to MongoDB Atlas connection string
- [ ] `JWT_SECRET` set (min 32 characters, randomly generated)
- [ ] `FRONTEND_URL` set to Vercel domain
- [ ] `GEMINI_API_KEY` set (if using AI recommendations)

### Frontend Environment Variables (Vercel)
- [ ] `REACT_APP_API_URL` set to Render backend URL + `/api`

### CORS Configuration
- [ ] Backend allows frontend origin
- [ ] Credentials enabled
- [ ] Preflight requests handled

### Database
- [ ] MongoDB Atlas cluster accessible
- [ ] Database user created with read/write permissions
- [ ] IP whitelist includes 0.0.0.0/0 (or specific IPs)
- [ ] Connection string includes database name
- [ ] Superadmin account seeded on first run

### SSL/HTTPS
- [ ] Backend URL uses HTTPS (Render)
- [ ] Frontend URL uses HTTPS (Vercel)
- [ ] Mixed content warnings resolved

---

## 🔧 F) CRITICAL FIXES APPLIED

### From CRITICAL_FIXES.md
- [ ] Fix #1: Recommendation routes added to server.js
- [ ] Fix #2: Axios response interceptor added
- [ ] Fix #3: data-testid attributes added to all components
- [ ] Fix #4: Selenium tests updated to use data-testid
- [ ] Fix #5: Environment variable validation added
- [ ] Fix #6: Error logging middleware enhanced
- [ ] Fix #7: CORS preflight handling added

---

## 📊 G) FINAL PRE-PRODUCTION CHECKLIST

### Code Quality
- [ ] No console.log statements in production code (or use proper logging)
- [ ] No commented-out code blocks
- [ ] All TODO comments addressed
- [ ] Code formatted consistently
- [ ] No eslint warnings/errors

### Testing Readiness
- [ ] Postman collection tested and working
- [ ] All critical API endpoints tested
- [ ] Selenium tests pass consistently
- [ ] RBAC thoroughly tested
- [ ] Ownership rules verified

### Documentation
- [ ] README.md updated with setup instructions
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide available
- [ ] Test account credentials documented (for QA only)

### Performance
- [ ] API response times acceptable (<2s)
- [ ] Frontend loads in <3s
- [ ] No memory leaks observed
- [ ] Database queries optimized (indexes)
- [ ] Rate limiting configured appropriately

### Security
- [ ] No sensitive data in logs
- [ ] No API keys in code
- [ ] HTTPS enforced
- [ ] JWT expiration set
- [ ] Password complexity enforced
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] XSS protection enabled
- [ ] CSRF protection (if using cookies)

---

## ✅ FINAL SIGN-OFF

### API Testing
- [ ] All Postman tests pass
- [ ] RBAC verified
- [ ] Ownership rules working
- [ ] Error handling consistent
- **Tested By:** ________________  
- **Date:** ________________

### Frontend Testing
- [ ] All user flows working
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Authentication flow working
- **Tested By:** ________________  
- **Date:** ________________

### Selenium Automation
- [ ] All E2E tests pass
- [ ] Tests are stable (no flakiness)
- [ ] data-testid attributes in place
- [ ] Test suite can run in CI/CD
- **Tested By:** ________________  
- **Date:** ________________

### Deployment
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables verified
- [ ] CORS working
- [ ] Database connected
- **Tested By:** ________________  
- **Date:** ________________

---

## 📝 NOTES & ISSUES

**Outstanding Issues:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Known Limitations:**
1. _________________________________________________
2. _________________________________________________

**Next Steps:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

---

## 📞 CONTACTS

**Development Team:**
- Backend Lead: ________________
- Frontend Lead: ________________
- QA Lead: ________________

**Deployment:**
- DevOps: ________________

**Emergency Contact:**
- On-Call: ________________

---

**Checklist Version:** 1.0  
**Last Updated:** May 1, 2026  
**Status:** ⏳ Ready for Testing Phase
