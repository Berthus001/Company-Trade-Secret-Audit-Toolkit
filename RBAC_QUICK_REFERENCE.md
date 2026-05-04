# RBAC Quick Reference Guide

## Role Comparison Matrix

| Feature | Auditor | Analyst | User | Admin | Superadmin |
|---------|---------|---------|------|-------|------------|
| Create Audits | ✅ | ❌ | ❌ | ✅ | ✅ |
| View Own Audits | ✅ | ❌ | ❌ | ✅ | ✅ |
| View All Audits | ❌ | ❌ | ❌ | ✅* | ✅ |
| See Audit Answers | ✅ | ❌ | ❌ | ✅ | ✅ |
| Generate Recommendations | ❌ | ✅ | ❌ | ✅ | ✅ |
| Create Users | ❌ | ❌ | ❌ | ✅ | ✅ |
| Freeze Users | ❌ | ❌ | ❌ | ✅* | ✅ |
| Manage Admins | ❌ | ❌ | ❌ | ❌ | ✅ |

*Admin can only manage users they created (ownership model)

---

## Quick Commands

### Backend: Create User with Role
```bash
POST /api/auth/users/create-user
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "securepass123",
  "company": "Tech Corp",
  "role": "auditor"  // Options: user, auditor, analyst
}
```

### Backend: Freeze User
```bash
PUT /api/auth/users/:userId/freeze
{
  "reason": "Account suspended pending review"
}
```

### Backend: Unfreeze User
```bash
PUT /api/auth/users/:userId/unfreeze
```

---

## Frontend: Role Checks

### Using useAuth Hook
```jsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { 
    role,              // Current user's role
    isAuditor,         // Boolean: is auditor
    isAnalyst,         // Boolean: is analyst
    isAdmin,           // Boolean: is admin or superadmin
    isSuperadmin,      // Boolean: is superadmin
    canCreateAudits,   // Boolean: can create audits
    canViewRecommendations, // Boolean: can view recommendations
    canManageUsers     // Boolean: can manage users
  } = useAuth();

  return (
    <>
      {canCreateAudits && <button>New Audit</button>}
      {canViewRecommendations && <RecommendationPanel />}
    </>
  );
};
```

### Using ProtectedRoute
```jsx
// Require specific role(s)
<ProtectedRoute requireRole={['auditor', 'admin']}>
  <AuditForm />
</ProtectedRoute>

// Block specific role(s)
<ProtectedRoute blockRole="analyst">
  <DetailedAuditView />
</ProtectedRoute>

// Admin only
<ProtectedRoute requireAdmin={true}>
  <ManageUsers />
</ProtectedRoute>

// Superadmin only
<ProtectedRoute requireSuperadmin={true}>
  <ManageAdmins />
</ProtectedRoute>
```

---

## Middleware Usage (Backend)

### Protect Routes by Role
```javascript
const { 
  protect,                        // Require authentication
  auditorOnly,                    // Auditor, admin, superadmin
  analystOnly,                    // Analyst, admin, superadmin
  adminOrSuperadmin,              // Admin or superadmin only
  blockAuditorsFromRecommendations, // Block auditors
  blockAnalystsFromAuditDetails,   // Block analysts
  allowRoles                      // Custom role list
} = require('../middleware/authMiddleware');

// Usage examples:
router.post('/audits', protect, auditorOnly, submitAudit);
router.get('/audits/:id', protect, blockAnalystsFromAuditDetails, getAudit);
router.post('/recommendations', protect, blockAuditorsFromRecommendations, getRecommendations);
router.get('/users', protect, adminOrSuperadmin, getUsers);
router.post('/admin', protect, allowRoles('superadmin'), createAdmin);
```

---

## Common Tasks

### Task: Create an Auditor User
**As Admin:**
1. Navigate to "Manage Users"
2. Click "+ Create New User"
3. Fill in user details
4. Select "Auditor" from Role dropdown
5. Click "Create User"

**Programmatically:**
```javascript
await api.createUser({
  name: "John Auditor",
  email: "john@company.com",
  password: "password123",
  company: "Tech Corp",
  role: "auditor"
});
```

### Task: Freeze a User Account
**As Admin:**
1. Navigate to "Manage Users"
2. Find the user
3. Click "❄️ Freeze" button
4. Enter reason in prompt
5. Confirm

**Programmatically:**
```javascript
await api.freezeUser(userId, "Policy violation");
```

### Task: Unfreeze a User Account
**As Admin:**
1. Navigate to "Manage Users"
2. Find the frozen user (shows "❄️ Frozen" badge)
3. Click "🔓 Unfreeze" button
4. Confirm

**Programmatically:**
```javascript
await api.unfreezeUser(userId);
```

---

## Troubleshooting

### Problem: User can't login after being frozen
**Solution:** This is expected. Frozen users cannot access the system. Admin must unfreeze the account.

### Problem: Auditor can't see recommendations
**Solution:** This is by design (separation of duties). Only analysts, admins, and superadmins can access recommendations.

### Problem: Analyst can't see audit answers
**Solution:** This is by design (separation of duties). Analysts only see summaries and scores, not detailed answers.

### Problem: Admin can't freeze another admin's user
**Solution:** This is the ownership model. Admins can only manage users they created. Only superadmins can manage all users.

### Problem: Role not appearing in navbar
**Solution:** Check that the user's role is correctly set in the database and the token is refreshed (re-login).

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 401 | Not authorized | No valid token |
| 403 | Access denied | Insufficient permissions |
| 403 | Account is frozen | User account suspended |
| 403 | Auditors cannot access recommendations | Role restriction |
| 403 | Analysts cannot view detailed audit answers | Role restriction |

---

## CSS Classes Reference

### Role Badges
```css
.role-tag.role-user       /* Blue - Standard user */
.role-tag.role-auditor    /* Green - Auditor */
.role-tag.role-analyst    /* Pink - Analyst */
.role-tag.role-admin      /* Purple - Admin */
.role-tag.role-superadmin /* Orange - Superadmin */
```

### Status Badges
```css
.status-badge.status-active  /* Green - Active account */
.status-badge.status-frozen  /* Blue - Frozen account */
```

### Action Buttons
```css
.btn-action.btn-edit      /* Blue - Edit button */
.btn-action.btn-delete    /* Red - Delete button */
.btn-action.btn-warning   /* Orange - Freeze button */
.btn-action.btn-success   /* Green - Unfreeze button */
```

---

## Environment Variables

No additional environment variables needed for RBAC. Uses existing JWT_SECRET.

---

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  company: String,
  role: String,           // 'user' | 'auditor' | 'analyst' | 'admin' | 'superadmin'
  createdBy: ObjectId,    // Reference to admin who created this user
  isFrozen: Boolean,      // Account freeze status
  frozenBy: ObjectId,     // Admin who froze the account
  frozenAt: Date,         // When account was frozen
  freezeReason: String,   // Reason for freeze
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Scenarios

### Test 1: Auditor Cannot Access Recommendations
```bash
# Login as auditor
POST /api/auth/login { email: "auditor@test.com", password: "pass123" }

# Try to access recommendations (should fail with 403)
POST /api/audits/recommendations
# Expected: 403 - Access denied: Auditors cannot access recommendations
```

### Test 2: Analyst Cannot View Audit Details
```bash
# Login as analyst
POST /api/auth/login { email: "analyst@test.com", password: "pass123" }

# Try to view detailed audit (should fail with 403)
GET /api/audits/:auditId
# Expected: 403 - Access denied: Analysts cannot view detailed audit answers
```

### Test 3: Admin Can Freeze User
```bash
# Login as admin
POST /api/auth/login { email: "admin@test.com", password: "pass123" }

# Freeze user they created
PUT /api/auth/users/:userId/freeze { reason: "Test freeze" }
# Expected: 200 - User frozen successfully

# User tries to login (should fail)
POST /api/auth/login { email: "frozen@test.com", password: "pass123" }
# Expected: 403 - Account is frozen
```

---

## Best Practices

1. **Always assign appropriate roles** when creating users
2. **Document freeze reasons** for audit trail
3. **Use ownership model** - admins manage their own users
4. **Regularly review frozen accounts** and unfreeze when resolved
5. **Test role restrictions** before deploying to production
6. **Keep role badges visible** in UI for clarity
7. **Log all freeze/unfreeze actions** for compliance

---

## Migration from Old System

### For Existing Users Without Roles
Run this query to assign default roles:
```javascript
// In MongoDB shell or script
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: 'user', isFrozen: false } }
);
```

---

## Support

For issues or questions about RBAC:
1. Check this quick reference guide
2. Review `RBAC_IMPLEMENTATION.md` for detailed documentation
3. Check console logs for specific error messages
4. Verify role assignments in database

---

**Last Updated:** May 2026  
**Version:** 1.0.0
