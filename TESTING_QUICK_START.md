# Testing Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. API Testing with Postman

```bash
# Import collection
1. Open Postman
2. Click "Import"
3. Select "POSTMAN_COLLECTION.json"
4. Create environment with variables:
   - baseUrl: http://localhost:5000/api
   - authToken: (leave empty)
```

**Run Your First Tests:**
```
1. Health Check → GET /api/health
2. Login → POST /api/auth/login (saves token automatically)
3. Get Profile → GET /api/auth/me (uses saved token)
```

### 2. Selenium E2E Testing

```bash
# Install dependencies
cd selenium-tests
npm install

# Run tests
npm run test:login        # Test authentication
npm run test:users        # Test user management
npm run test:audit        # Test audit creation
npm run test:all          # Run all tests
```

**⚠️ Before Running Selenium Tests:**
1. Add data-testid attributes (see CRITICAL_FIXES.md)
2. Update test credentials in test files
3. Ensure backend and frontend are running

### 3. Manual Testing Checklist

**Priority 1: Authentication**
- [ ] Can register new user
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Can logout successfully

**Priority 2: User Management (Admin)**
- [ ] Admin can create users
- [ ] Admin sees only their users
- [ ] Admin cannot edit other admin's users

**Priority 3: Audit Flow**
- [ ] User can start new audit
- [ ] Can answer all questions
- [ ] Can submit audit
- [ ] Results displayed correctly

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `QA_AUDIT_REPORT.md` | Complete system audit findings |
| `POSTMAN_COLLECTION.json` | API test collection |
| `selenium-tests/README.md` | Selenium setup and usage |
| `CRITICAL_FIXES.md` | Required fixes before testing |
| `QA_CHECKLIST.md` | Comprehensive testing checklist |

---

## 🐛 Common Issues

### "Connection refused" in Selenium
- **Fix:** Ensure backend on port 5000 and frontend on port 3000

### "Element not found" in Selenium
- **Fix:** Add data-testid attributes (see CRITICAL_FIXES.md #3)

### 401 Unauthorized in Postman
- **Fix:** Click "Login" request first to get token

### CORS Error
- **Fix:** Add your frontend URL to backend FRONTEND_URL env var

---

## 🎯 Testing Priorities

### Week 1: Critical Path
1. Authentication (login/logout)
2. User creation (admin creates user)
3. Audit submission
4. View audit results

### Week 2: Full Coverage
1. All API endpoints
2. RBAC enforcement
3. Ownership rules
4. Error handling
5. Edge cases

### Week 3: Automation
1. Add data-testid attributes
2. Run Selenium tests
3. Fix flaky tests
4. CI/CD integration

---

## 📞 Need Help?

**Issues with:**
- **API Testing:** See QA_AUDIT_REPORT.md → Section B
- **Selenium:** See selenium-tests/README.md
- **Fixes:** See CRITICAL_FIXES.md
- **Checklist:** See QA_CHECKLIST.md

**Can't find something?**
All files are in the project root directory.

---

**Last Updated:** May 1, 2026
