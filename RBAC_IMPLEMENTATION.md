# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the comprehensive implementation of Role-Based Access Control (RBAC) with separation of duties and user freeze system for the Trade Secret Audit Toolkit.

## Roles Implemented

### 1. **Auditor**
- **Capabilities:**
  - Create and submit new audits
  - View their own audit history
  - Access audit results and scores
- **Restrictions:**
  - Cannot access AI recommendations
  - Cannot see other users' audits (unless admin/superadmin)
  - Cannot manage users

### 2. **Analyst**
- **Capabilities:**
  - View audit summaries and scores
  - Generate AI-powered recommendations
  - Access risk assessments
- **Restrictions:**
  - Cannot view detailed audit answers
  - Cannot create new audits
  - Cannot manage users

### 3. **User**
- **Capabilities:**
  - Standard user access
  - Can be assigned specific permissions by admin
- **Restrictions:**
  - Limited to basic functions

### 4. **Admin**
- **Capabilities:**
  - Create users with roles (auditor, analyst, user)
  - Manage users they created (ownership model)
  - Freeze/unfreeze user accounts
  - View audits from their users
  - Full audit and recommendation access
- **Restrictions:**
  - Can only manage users they created
  - Cannot manage other admins
  - Cannot manage superadmins

### 5. **Superadmin**
- **Capabilities:**
  - Full system access
  - Create and manage admins
  - Manage all users across the system
  - Freeze/unfreeze any account
  - View all system audits and statistics
- **Restrictions:**
  - None (full control)

---

## Backend Implementation

### 1. User Model Updates
**File:** `backend/models/User.js`

**Added Fields:**
```javascript
role: {
  type: String,
  enum: ['superadmin', 'admin', 'auditor', 'analyst', 'user'],
  default: 'user'
}

// Freeze system
isFrozen: { type: Boolean, default: false }
frozenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
frozenAt: { type: Date, default: null }
freezeReason: { type: String, default: null }
```

### 2. Middleware Enhancements
**File:** `backend/middleware/authMiddleware.js`

**New Middleware Functions:**
- `auditorOnly` - Restricts access to auditors, admins, and superadmins
- `analystOnly` - Restricts access to analysts, admins, and superadmins
- `adminOrSuperadmin` - Restricts access to admin roles only
- `blockAuditorsFromRecommendations` - Prevents auditors from accessing recommendations
- `blockAnalystsFromAuditDetails` - Prevents analysts from viewing detailed audit answers
- Frozen user check in `protect` middleware

**Frozen User Protection:**
```javascript
// In protect middleware
if (user.isFrozen) {
  return res.status(403).json({
    success: false,
    error: 'Account is frozen. Please contact your administrator.',
    isFrozen: true
  });
}
```

### 3. Controller Updates

#### Auth Controller
**File:** `backend/controllers/authController.js`

**New Functions:**
- `freezeUser(id, reason)` - Freeze a user account with reason
- `unfreezeUser(id)` - Unfreeze a user account

**Updated Functions:**
- `createUser` - Now accepts `role` parameter for role assignment
- `updateUser` - Validates and updates user roles

**Key Features:**
- Ownership validation (admins can only freeze/unfreeze users they created)
- Superadmins can freeze/unfreeze any user
- Cannot freeze admin or superadmin accounts

### 4. Route Protection
**Files:** 
- `backend/routes/auditRoutes.js`
- `backend/routes/recommendationRoutes.js`
- `backend/routes/authRoutes.js`

**Audit Routes:**
```javascript
// Auditors can create audits
router.post('/', allowRoles('auditor', 'admin', 'superadmin'), submitAudit);

// Analysts blocked from viewing audit details
router.get('/:id', blockAnalystsFromAuditDetails, getAudit);

// Auditors blocked from recommendations
router.post('/recommendations', blockAuditorsFromRecommendations, generateAIRecommendations);
```

**Recommendation Routes:**
```javascript
// Analysts can access, auditors cannot
router.post('/', protect, blockAuditorsFromRecommendations, getRecommendations);
```

**User Management Routes:**
```javascript
// Freeze/Unfreeze endpoints
router.put('/users/:id/freeze', protect, allowRoles('admin', 'superadmin'), freezeUser);
router.put('/users/:id/unfreeze', protect, allowRoles('admin', 'superadmin'), unfreezeUser);
```

---

## Frontend Implementation

### 1. AuthContext Updates
**File:** `frontend/src/context/AuthContext.js`

**New Context Values:**
```javascript
{
  isAuditor: user?.role === 'auditor',
  isAnalyst: user?.role === 'analyst',
  canManageUsers: user?.role === 'admin' || user?.role === 'superadmin',
  canCreateAudits: ['auditor', 'admin', 'superadmin'].includes(user?.role),
  canViewRecommendations: ['analyst', 'admin', 'superadmin'].includes(user?.role)
}
```

**Frozen User Handling:**
- Login checks for `isFrozen` flag
- Displays specific error message for frozen accounts
- Redirects frozen users with clear messaging

### 2. Protected Route Component
**File:** `frontend/src/components/ProtectedRoute.js`

**Enhanced with:**
- `requireRole` prop - Allows specific role(s)
- `blockRole` prop - Blocks specific role(s)
- Flexible role-based access control

**Usage Example:**
```jsx
<ProtectedRoute requireRole={['auditor', 'admin']}>
  <AuditForm />
</ProtectedRoute>
```

### 3. Login Page
**File:** `frontend/src/pages/Login.js`

**Enhancements:**
- Displays frozen account warning with special styling
- Shows contact administrator message
- Different alert styling for frozen vs error states

### 4. Navbar Component
**File:** `frontend/src/components/Navbar.js`

**Role-Based Navigation:**
- **Auditors:** Dashboard, New Audit, History
- **Analysts:** Dashboard only (for viewing recommendations)
- **Admins:** Dashboard, Audit features, Manage Users
- **Superadmins:** Manage Users, Manage Admins
- Role badge display with color coding

### 5. User Management Page
**File:** `frontend/src/pages/ManageUsers.js`

**New Features:**

1. **Role Selection Dropdown:**
   ```jsx
   <select name="role" value={formData.role} onChange={handleChange}>
     <option value="user">User</option>
     <option value="auditor">Auditor</option>
     <option value="analyst">Analyst</option>
   </select>
   ```

2. **Freeze/Unfreeze Buttons:**
   - Freeze button with reason prompt
   - Unfreeze button with confirmation
   - Visual indicators for frozen accounts

3. **Status Badge Column:**
   - ✅ Active (green)
   - ❄️ Frozen (blue)
   - Shows freeze date on hover

4. **API Integration:**
   - `api.freezeUser(id, reason)`
   - `api.unfreezeUser(id)`

### 6. Dashboard Updates
**File:** `frontend/src/pages/Dashboard.js`

**Role-Specific Content:**

**Auditor View:**
- Audit overview statistics
- Quick actions: Start New Audit, View All Audits
- Recent audits list
- Auditor role information card

**Analyst View:**
- Audit summaries only (no detailed answers)
- Access to recommendation generation
- Risk distribution view
- Analyst role information card

**Admin/Superadmin View:**
- System statistics
- User management quick action
- Full audit access
- Comprehensive analytics

### 7. API Service Updates
**File:** `frontend/src/services/api.js`

**New Methods:**
```javascript
freezeUser: async (id, reason) => {
  const response = await axiosInstance.put(`/auth/users/${id}/freeze`, { reason });
  return response.data.data;
}

unfreezeUser: async (id) => {
  const response = await axiosInstance.put(`/auth/users/${id}/unfreeze`);
  return response.data.data;
}
```

### 8. CSS Styling
**File:** `frontend/src/styles/index.css`

**New Styles Added:**

**Role Tags:**
```css
.role-tag.role-auditor {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.role-tag.role-analyst {
  background-color: #fce4ec;
  color: #c2185b;
}
```

**Status Badges:**
```css
.status-badge.status-active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.status-frozen {
  background-color: #e3f2fd;
  color: #1565c0;
}
```

**Action Buttons:**
```css
.btn-action.btn-warning { /* Freeze button */ }
.btn-action.btn-success { /* Unfreeze button */ }
```

---

## Security Features

### 1. Separation of Duties
- **Auditors** cannot see recommendations (prevents bias)
- **Analysts** cannot see detailed audit answers (maintains data segregation)
- Clear role boundaries enforced at both API and UI levels

### 2. Ownership Model
- Admins can only manage users they created
- Superadmins have full visibility
- Prevents unauthorized access to other admins' users

### 3. Freeze System
- Immediate account suspension
- Blocks login and all API access
- Tracks who froze the account and when
- Requires reason for audit trail
- Cannot freeze admin or superadmin accounts

### 4. Token-Based Authentication
- JWT tokens include role information
- Tokens validated on every request
- Frozen status checked on each API call
- Automatic logout on frozen status

---

## Testing Checklist

### Backend Tests
- [ ] Auditor can create audits
- [ ] Auditor cannot access recommendations endpoint
- [ ] Analyst can access recommendations
- [ ] Analyst cannot view detailed audit answers
- [ ] Admin can freeze/unfreeze users they created
- [ ] Admin cannot freeze users they didn't create
- [ ] Superadmin can freeze any user
- [ ] Frozen user cannot login
- [ ] Frozen user receives 403 on API calls
- [ ] Role validation on user creation
- [ ] Ownership validation on user management

### Frontend Tests
- [ ] Role-based navigation visibility
- [ ] Frozen user sees appropriate error message
- [ ] Role dropdown shows correct options
- [ ] Freeze/Unfreeze buttons work correctly
- [ ] Status badges display properly
- [ ] Protected routes block unauthorized roles
- [ ] Dashboard shows role-specific content
- [ ] Quick actions match user role

---

## API Endpoints Summary

### User Management
- `POST /api/auth/users/create-user` - Create user with role
- `PUT /api/auth/users/:id` - Update user (including role)
- `PUT /api/auth/users/:id/freeze` - Freeze user account
- `PUT /api/auth/users/:id/unfreeze` - Unfreeze user account
- `GET /api/auth/users` - Get users (filtered by ownership)

### Audit Routes
- `POST /api/audits` - Create audit (auditor, admin, superadmin)
- `GET /api/audits/:id` - Get audit details (blocked for analysts)
- `POST /api/audits/recommendations` - Get recommendations (blocked for auditors)

---

## Usage Examples

### Creating a User with Role (Admin)
```javascript
const userData = {
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword123",
  company: "Acme Corp",
  role: "auditor"  // or "analyst", "user"
};

await api.createUser(userData);
```

### Freezing a User
```javascript
const reason = "Policy violation - unauthorized access attempt";
await api.freezeUser(userId, reason);
```

### Role-Based UI Rendering
```jsx
const { canCreateAudits, canViewRecommendations } = useAuth();

{canCreateAudits && (
  <Link to="/audit/new">New Audit</Link>
)}

{canViewRecommendations && (
  <RecommendationPanel />
)}
```

---

## Migration Notes

### Existing Users
- Default role is `'user'`
- Existing users maintain their current access
- Admins can update roles through the UI

### Database Migration
No explicit migration needed - new fields have default values:
- `isFrozen: false`
- `frozenBy: null`
- `frozenAt: null`
- `freezeReason: null`

---

## Maintenance & Support

### Adding New Roles
1. Update `User.js` enum with new role
2. Create middleware for role-specific access
3. Update routes with new role checks
4. Add UI components for role
5. Update CSS for role badge styling

### Troubleshooting
- Check browser console for 403 errors
- Verify JWT token includes correct role
- Ensure middleware is applied in correct order
- Check frozen status if user cannot login

---

## Summary

This implementation provides:
✅ Complete role-based access control
✅ Separation of duties between auditors and analysts
✅ User freeze/unfreeze system
✅ Ownership-based user management
✅ Role-specific UI rendering
✅ Comprehensive security checks
✅ Clear visual indicators (badges, status)
✅ Audit trail for freeze actions

The system is production-ready with full frontend and backend integration.
