# CRITICAL FIXES REQUIRED FOR PRODUCTION READINESS

## Priority: HIGH ⚠️

These fixes are essential for proper API testing and Selenium automation.

---

## Fix #1: Add Missing Recommendation Routes to Server

**Issue:** Recommendation routes exist but are not mounted in server.js

**Location:** `backend/server.js`

**Fix:**
```javascript
// Add this import near the top with other route imports
const recommendationRoutes = require('./routes/recommendationRoutes');

// Add this line after other app.use() route declarations
app.use('/api/recommendations', recommendationRoutes);
```

**Complete Change:**
```javascript
// API Routes
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes'); // ADD THIS

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/recommendations', recommendationRoutes); // ADD THIS
```

**Impact:** Enables recommendation API endpoints for testing

---

## Fix #2: Add Axios Response Interceptor

**Issue:** No automatic handling of 401 errors or token refresh

**Location:** `frontend/src/services/api.js`

**Fix:**
```javascript
// Add after axiosInstance creation

// Request interceptor - Attach token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**Benefits:**
- Automatic token attachment to requests
- Automatic logout on 401 errors
- Cleaner code (no manual setAuthToken calls)

---

## Fix #3: Add data-testid Attributes for Selenium

**Issue:** Frontend lacks stable test selectors for Selenium automation

**Importance:** CRITICAL for E2E testing

### Login Page (`frontend/src/pages/Login.js`)

**Add data-testid attributes:**
```jsx
<form onSubmit={handleSubmit} data-testid="login-form">
  <input
    type="email"
    name="email"
    data-testid="input-email"
    value={formData.email}
    onChange={handleChange}
  />
  
  <input
    type="password"
    name="password"
    data-testid="input-password"
    value={formData.password}
    onChange={handleChange}
  />
  
  <button 
    type="submit" 
    data-testid="btn-submit-login"
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Logging in...' : 'Login'}
  </button>
</form>

{formError && (
  <div data-testid="error-message" className="error">
    {formError}
  </div>
)}
```

### Navbar (`frontend/src/components/Navbar.js`)

**Add data-testid attributes:**
```jsx
<nav className="navbar" data-testid="navbar">
  <Link to="/dashboard" data-testid="nav-dashboard">Dashboard</Link>
  <Link to="/audit/new" data-testid="nav-new-audit">New Audit</Link>
  <Link to="/audits" data-testid="nav-audit-history">History</Link>
  
  {isAdmin && (
    <Link to="/admin/users" data-testid="nav-manage-users">
      Manage Users
    </Link>
  )}
  
  {isSuperadmin && (
    <Link to="/admin/admins" data-testid="nav-manage-admins">
      Manage Admins
    </Link>
  )}
  
  <button onClick={handleLogout} data-testid="btn-logout">
    Logout
  </button>
</nav>
```

### Manage Users Page (`frontend/src/pages/ManageUsers.js`)

**Add data-testid attributes:**
```jsx
<button 
  onClick={handleCreateClick} 
  data-testid="btn-create-user"
>
  Create User
</button>

<table data-testid="users-table">
  <tbody>
    {users.map((user) => (
      <tr key={user._id} data-testid={`user-row-${user._id}`}>
        <td data-testid={`user-name-${user._id}`}>{user.name}</td>
        <td data-testid={`user-email-${user._id}`}>{user.email}</td>
        <td>
          <button 
            onClick={() => handleEditClick(user)}
            data-testid={`btn-edit-user-${user._id}`}
          >
            Edit
          </button>
          <button 
            onClick={() => handleDeleteClick(user._id, user.name)}
            data-testid={`btn-delete-user-${user._id}`}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

{/* Modal */}
<div data-testid="user-modal">
  <form onSubmit={handleFormSubmit} data-testid="user-form">
    <input name="name" data-testid="modal-input-name" />
    <input name="email" data-testid="modal-input-email" />
    <input name="password" data-testid="modal-input-password" />
    <input name="company" data-testid="modal-input-company" />
    
    <button type="submit" data-testid="modal-btn-submit">
      {editingUser ? 'Update User' : 'Create User'}
    </button>
  </form>
</div>
```

### Audit Form (`frontend/src/pages/AuditForm.js`)

**Add data-testid attributes:**
```jsx
<input
  type="text"
  name="companyName"
  data-testid="input-company-name"
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
/>

{/* Question Cards */}
{getCurrentQuestions().map((question, index) => (
  <div 
    key={question._id} 
    data-testid={`question-card-${question._id}`}
    className="question-card"
  >
    <p data-testid={`question-text-${question._id}`}>
      {question.question}
    </p>
    
    {/* Radio buttons for answers */}
    {[0, 1, 2, 3, 4].map((value) => (
      <label key={value}>
        <input
          type="radio"
          name={question._id}
          value={value}
          data-testid={`question-${question._id}-option-${value}`}
          checked={responses[question._id] === value}
          onChange={() => handleSelect(question._id, value)}
        />
        {/* Label text */}
      </label>
    ))}
  </div>
))}

<button 
  onClick={handleNext} 
  data-testid="btn-next-category"
  disabled={!canProceed()}
>
  Next
</button>

<button 
  onClick={handleSubmit} 
  data-testid="btn-submit-audit"
  disabled={!canSubmit()}
>
  Submit Audit
</button>
```

### Dashboard (`frontend/src/pages/Dashboard.js`)

**Add data-testid attributes:**
```jsx
<div className="dashboard-page" data-testid="dashboard">
  <h1 data-testid="dashboard-welcome">Welcome, {user?.name}</h1>
  
  <div data-testid="dashboard-summary">
    <div data-testid="stat-total-audits">{summary?.totalAudits || 0}</div>
    <div data-testid="stat-avg-score">{summary?.averageScore || 0}%</div>
  </div>
  
  <button 
    onClick={() => fetchDashboardData(true)} 
    data-testid="btn-refresh-dashboard"
  >
    Refresh
  </button>
</div>
```

---

## Fix #4: Update Selenium Tests to Use data-testid

**Location:** `selenium-tests/*.js`

**Example - Before:**
```javascript
const emailInput = await driver.findElement(By.css('input[name="email"]'));
```

**Example - After:**
```javascript
const emailInput = await driver.findElement(By.css('[data-testid="input-email"]'));
```

**Update all test files to use:**
```javascript
By.css('[data-testid="element-id"]')
```

---

## Fix #5: Add Environment Variable Validation

**Issue:** No validation if required environment variables are missing

**Location:** `backend/server.js`

**Fix - Add at the top after dotenv.config():**
```javascript
// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your .env file');
  process.exit(1);
}

// Validate JWT_SECRET length
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

console.log('✅ Environment variables validated');
```

---

## Fix #6: Add API Error Logging Middleware

**Location:** `backend/middleware/errorMiddleware.js`

**Add detailed error logging:**
```javascript
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Error occurred:');
  console.error('  Path:', req.method, req.path);
  console.error('  Message:', err.message);
  console.error('  Stack:', err.stack);
  
  // Existing error handling...
};
```

---

## Fix #7: Add CORS Headers for Preflight Requests

**Location:** `backend/server.js`

**Current CORS config is good, but add explicit preflight handling:**
```javascript
// Handle preflight requests
app.options('*', cors(corsOptions));
```

---

## Implementation Priority

1. **Fix #1** (Recommendation routes) - 5 minutes
2. **Fix #3** (data-testid attributes) - 30-60 minutes
3. **Fix #2** (Axios interceptor) - 15 minutes
4. **Fix #5** (Environment validation) - 10 minutes
5. **Fix #4** (Update Selenium tests) - 20 minutes
6. **Fix #6** (Error logging) - 10 minutes
7. **Fix #7** (CORS preflight) - 5 minutes

**Total Estimated Time:** 2-3 hours

---

## Testing After Fixes

### 1. Backend
```bash
cd backend
npm start
# Check console for environment validation
# Test recommendation endpoints with Postman
```

### 2. Frontend
```bash
cd frontend
npm start
# Test login/logout to verify interceptor works
# Inspect elements to verify data-testid attributes
```

### 3. Selenium
```bash
cd selenium-tests
npm install
npm run test:all
# All tests should pass with data-testid selectors
```

---

## Verification Checklist

- [ ] Recommendation routes accessible at `/api/recommendations`
- [ ] Axios interceptor automatically logs out on 401
- [ ] All interactive elements have data-testid attributes
- [ ] Selenium tests use data-testid selectors
- [ ] Environment variables validated on startup
- [ ] Detailed error logging in backend
- [ ] CORS preflight requests handled

---

**Last Updated:** May 1, 2026  
**Status:** Ready for Implementation
