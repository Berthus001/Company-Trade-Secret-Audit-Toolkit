# Role-Based Access Control (RBAC) with Ownership-Based Restrictions

## Overview

This document explains the implementation of RBAC with ownership-based restrictions in the Trade Secret Audit Toolkit. This security model ensures that admins can only manage users they created, while superadmins have unrestricted access.

---

## System Roles

### 1. **Superadmin**
- **Highest privilege level**
- Can view ALL users (admins and regular users)
- Can create admin accounts
- Can create, update, and delete ANY user
- Bypasses all ownership restrictions
- Cannot be deleted by anyone

### 2. **Admin**
- **Mid-level privilege**
- Can ONLY view users they created (ownership filter)
- Can create regular user accounts
- Can ONLY update users they created
- Can ONLY delete users they created
- Cannot create other admins
- Cannot change user roles
- Cannot modify superadmin accounts

### 3. **User**
- **Standard access level**
- Can only view their own profile
- Can only update their own profile
- Cannot access other users' information
- Cannot create, update, or delete other users

---

## Database Schema Changes

### User Model (`models/User.js`)

```javascript
{
  name: String,
  email: String,
  password: String,
  company: String,
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    default: 'user'
  },
  createdBy: {
    type: ObjectId,
    ref: 'User',
    default: null  // null for superadmin or self-registered users
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` - For fast authentication lookups
- `createdBy` - For efficient ownership filtering

---

## Backend Implementation

### 1. Middleware (`middleware/authMiddleware.js`)

#### `protect` - JWT Authentication
```javascript
// Verifies JWT token and attaches user to req.user
// Used on all protected routes
```

#### `allowRoles(...roles)` - Role-Based Authorization
```javascript
// Checks if user has one of the allowed roles
// Example: allowRoles('admin', 'superadmin')
// Returns 403 if role not authorized
```

#### `verifyOwnership` - Ownership Verification
```javascript
// Ensures admins can only access resources they created
// Superadmins bypass this check
// Checks req.params.id against createdBy field
// Returns 403 if ownership verification fails
```

### 2. Controllers (`controllers/authController.js`)

#### **Create Admin** (Superadmin Only)
```javascript
POST /api/auth/users/create-admin

Authorization: Bearer <superadmin_token>

Body:
{
  "name": "Admin Name",
  "email": "admin@company.com",
  "password": "SecurePass123",
  "company": "Company Name"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Admin Name",
    "email": "admin@company.com",
    "company": "Company Name",
    "role": "admin",
    "createdBy": "<superadmin_id>"  // ← Ownership recorded
  }
}
```

**Security Logic:**
- Only superadmins can create admins
- `createdBy` field is set to the superadmin's ID
- This establishes ownership tracking

---

#### **Create User** (Admin/Superadmin)
```javascript
POST /api/auth/users/create-user

Authorization: Bearer <admin_or_superadmin_token>

Body:
{
  "name": "User Name",
  "email": "user@company.com",
  "password": "SecurePass123",
  "company": "Company Name"
}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "User Name",
    "email": "user@company.com",
    "company": "Company Name",
    "role": "user",
    "createdBy": "<admin_or_superadmin_id>"  // ← Ownership recorded
  }
}
```

**Security Logic:**
- Admins and superadmins can create users
- `createdBy` field is set to the creator's ID
- Admin can only manage users where `createdBy === admin._id`

---

#### **Get Users** (Admin/Superadmin)
```javascript
GET /api/auth/users?role=user

Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "...",
      "name": "User Name",
      "email": "user@company.com",
      "role": "user",
      "createdBy": {
        "_id": "...",
        "name": "Admin Name",
        "email": "admin@company.com",
        "role": "admin"
      }
    }
  ]
}
```

**Security Logic:**
```javascript
// Admin query
if (req.user.role === 'admin') {
  query.createdBy = req.user._id;  // Filter by ownership
}
// Superadmin query
// No filter - sees all users

// Results are filtered at database level (secure)
const users = await User.find(query)
  .populate('createdBy', 'name email role');
```

**Example Scenarios:**

| User Role   | Query Filter           | Result                                |
|-------------|------------------------|---------------------------------------|
| Admin A     | `createdBy: admin_A_id`| Only users created by Admin A         |
| Admin B     | `createdBy: admin_B_id`| Only users created by Admin B         |
| Superadmin  | No filter              | ALL users (admins + regular users)    |

---

#### **Update User** (Admin/Superadmin)
```javascript
PUT /api/auth/users/:id

Authorization: Bearer <token>

Body:
{
  "name": "Updated Name",
  "company": "Updated Company"
}

Success Response (200):
{
  "success": true,
  "data": { ... }
}

Error Response (403):
{
  "success": false,
  "error": "Access denied: You can only update users you created"
}
```

**Security Logic:**
```javascript
// 1. Find target user
const user = await User.findById(req.params.id);

// 2. Ownership check for admins
if (req.user.role === 'admin') {
  // Check if admin created this user
  if (user.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      error: 'Access denied: You can only update users you created'
    });
  }
  
  // Prevent role changes by admins
  if (role && role !== user.role) {
    return res.status(403).json({
      error: 'Admins cannot change user roles'
    });
  }
}

// 3. Prevent modifying superadmins (unless by another superadmin)
if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
  return res.status(403).json({
    error: 'Cannot modify superadmin accounts'
  });
}

// 4. Perform update
await user.save();
```

**Authorization Matrix:**

| Requester    | Target User          | Can Update? | Notes                              |
|--------------|----------------------|-------------|------------------------------------|
| Admin A      | User created by A    | ✅ Yes      | Ownership verified                 |
| Admin A      | User created by B    | ❌ No       | 403 - Ownership violation          |
| Admin A      | Any Admin            | ❌ No       | 403 - Ownership violation          |
| Admin A      | Any Superadmin       | ❌ No       | 403 - Cannot modify superadmins    |
| Superadmin   | Any User             | ✅ Yes      | Bypasses ownership                 |
| Superadmin   | Any Admin            | ✅ Yes      | Bypasses ownership                 |
| Superadmin   | Any Superadmin       | ✅ Yes      | Full access                        |

---

#### **Delete User** (Admin/Superadmin)
```javascript
DELETE /api/auth/users/:id

Authorization: Bearer <token>

Success Response (200):
{
  "success": true,
  "message": "User deleted successfully"
}

Error Response (403):
{
  "success": false,
  "error": "Access denied: You can only delete users you created"
}
```

**Security Logic:**
```javascript
// 1. Find target user
const user = await User.findById(req.params.id);

// 2. Ownership check for admins
if (req.user.role === 'admin') {
  if (user.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      error: 'Access denied: You can only delete users you created'
    });
  }
}

// 3. Prevent deleting superadmins (all roles)
if (user.role === 'superadmin') {
  return res.status(403).json({
    error: 'Cannot delete superadmin accounts'
  });
}

// 4. Perform deletion
await user.deleteOne();
```

**Authorization Matrix:**

| Requester    | Target User          | Can Delete? | Notes                              |
|--------------|----------------------|-------------|------------------------------------|
| Admin A      | User created by A    | ✅ Yes      | Ownership verified                 |
| Admin A      | User created by B    | ❌ No       | 403 - Ownership violation          |
| Admin A      | Any Admin            | ❌ No       | 403 - Ownership violation          |
| Admin A      | Any Superadmin       | ❌ No       | 403 - Cannot delete superadmins    |
| Superadmin   | Any User             | ✅ Yes      | Bypasses ownership                 |
| Superadmin   | Any Admin            | ✅ Yes      | Bypasses ownership                 |
| Superadmin   | Any Superadmin       | ❌ No       | 403 - Protected                    |

---

## API Routes Summary

```javascript
// Public routes
POST   /api/auth/login

// User management (Protected + RBAC)
POST   /api/auth/users/create-admin    // Superadmin only
POST   /api/auth/users/create-user     // Admin + Superadmin
GET    /api/auth/users                 // Admin (own) + Superadmin (all)
PUT    /api/auth/users/:id             // Admin (own) + Superadmin (all)
DELETE /api/auth/users/:id             // Admin (own) + Superadmin (all)

// Profile management (Protected)
GET    /api/auth/me                    // All authenticated users
PUT    /api/auth/profile               // All authenticated users
PUT    /api/auth/password              // All authenticated users
```

---

## Security Benefits

### 1. **Defense in Depth**
All authorization checks are enforced in the backend controllers, not just frontend UI. Even if frontend is bypassed, backend still blocks unauthorized access.

### 2. **Principle of Least Privilege**
- Users have minimal permissions (self-management only)
- Admins have limited scope (only their created users)
- Superadmins have full access (but protected from deletion)

### 3. **Data Isolation**
Admins cannot see or manipulate users created by other admins. Database queries are filtered by ownership at the query level, ensuring no data leakage.

### 4. **Audit Trail**
The `createdBy` field provides accountability:
- Track which admin created which users
- Investigate security incidents
- Generate compliance reports

### 5. **Prevents Privilege Escalation**
- Admins cannot create other admins
- Admins cannot modify their own role
- Admins cannot touch superadmin accounts

### 6. **Multi-Tenancy Ready**
The ownership model can be extended to support multi-tenant architectures where each admin represents a different organization or department.

---

## Frontend Implementation Guidelines

### 1. **Conditional Rendering**
```javascript
// Only show edit/delete buttons for owned users
{(user.createdBy === currentUser._id || isSuperadmin) && (
  <button onClick={() => handleEdit(user)}>Edit</button>
  <button onClick={() => handleDelete(user)}>Delete</button>
)}
```

### 2. **Dashboard Filtering**
```javascript
// Admin dashboard automatically shows only their users
const fetchUsers = async () => {
  // Backend automatically filters by createdBy for admins
  const response = await api.getUsers();
  setUsers(response.data);  // Only owned users returned
};
```

### 3. **Role-Based Navigation**
```javascript
{isSuperadmin && (
  <Link to="/admin-management">Manage Admins</Link>
)}

{(isAdmin || isSuperadmin) && (
  <Link to="/user-management">Manage Users</Link>
)}
```

### 4. **Error Handling**
```javascript
try {
  await api.updateUser(userId, userData);
} catch (error) {
  if (error.response?.status === 403) {
    toast.error('You do not have permission to modify this user');
  }
}
```

---

## Testing Scenarios

### Scenario 1: Admin Creates and Manages Users
```
1. Login as Admin A
2. Create User X → createdBy = Admin A
3. View users → Should see ONLY User X
4. Update User X → Should succeed ✅
5. Delete User X → Should succeed ✅
```

### Scenario 2: Admin Tries to Access Other Admin's Users
```
1. Admin B creates User Y
2. Login as Admin A
3. View users → Should NOT see User Y ❌
4. Try to update User Y directly (if ID known) → 403 Forbidden ❌
5. Try to delete User Y directly → 403 Forbidden ❌
```

### Scenario 3: Superadmin Override
```
1. Login as Superadmin
2. View users → Should see ALL users (created by all admins) ✅
3. Update any user → Should succeed ✅
4. Delete any user (except superadmin) → Should succeed ✅
```

### Scenario 4: Privilege Escalation Prevention
```
1. Login as Admin
2. Try to create another admin → 403 Forbidden ❌
3. Try to change own role to superadmin → 403 Forbidden ❌
4. Try to modify superadmin account → 403 Forbidden ❌
```

---

## Postman Testing Examples

### Example 1: Admin Creates User
```http
POST http://localhost:5000/api/auth/users/create-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "company": "Acme Corp"
}

Response 201:
{
  "success": true,
  "data": {
    "_id": "67890",
    "name": "John Doe",
    "role": "user",
    "createdBy": "12345"  // ← Admin's ID
  }
}
```

### Example 2: Admin Views Their Users
```http
GET http://localhost:5000/api/auth/users
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "count": 3,
  "data": [
    { "_id": "67890", "name": "John Doe", "createdBy": "12345" },
    { "_id": "67891", "name": "Jane Smith", "createdBy": "12345" },
    { "_id": "67892", "name": "Bob Wilson", "createdBy": "12345" }
  ]
}
// Only users where createdBy = current admin's ID
```

### Example 3: Admin Tries Unauthorized Update
```http
PUT http://localhost:5000/api/auth/users/99999
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Hacked Name"
}

Response 403:
{
  "success": false,
  "error": "Access denied: You can only update users you created"
}
```

### Example 4: Superadmin Views All Users
```http
GET http://localhost:5000/api/auth/users
Authorization: Bearer <superadmin_token>

Response 200:
{
  "success": true,
  "count": 15,
  "data": [
    { "_id": "67890", "createdBy": "12345", "name": "John" },
    { "_id": "67891", "createdBy": "12345", "name": "Jane" },
    { "_id": "67892", "createdBy": "54321", "name": "Bob" },
    { "_id": "67893", "createdBy": "54321", "name": "Alice" }
    // ... all users from all admins
  ]
}
```

---

## Security Checklist

- [x] All authorization checks in backend (not frontend only)
- [x] Database queries filter by ownership for admins
- [x] Admins cannot escalate their own privileges
- [x] Admins cannot modify superadmin accounts
- [x] Superadmins cannot be deleted
- [x] `createdBy` field tracked for accountability
- [x] JWT tokens include role information
- [x] 403 errors returned for unauthorized access
- [x] Ownership verified at controller level
- [x] Database indexes optimize ownership queries

---

## Compliance and Audit Support

### User Ownership Report
```javascript
// Query: Who created which users?
const report = await User.aggregate([
  { $match: { role: 'user' } },
  {
    $lookup: {
      from: 'users',
      localField: 'createdBy',
      foreignField: '_id',
      as: 'creator'
    }
  },
  {
    $project: {
      userName: '$name',
      userEmail: '$email',
      createdBy: { $arrayElemAt: ['$creator.name', 0] },
      createdAt: 1
    }
  }
]);
```

### Admin Activity Summary
```javascript
// Query: How many users has each admin created?
const adminStats = await User.aggregate([
  { $match: { role: 'user' } },
  {
    $group: {
      _id: '$createdBy',
      userCount: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'adminInfo'
    }
  }
]);
```

---

## Future Enhancements

1. **Soft Delete with Audit Trail**
   - Track who deleted which users and when
   - Allow restoration of deleted accounts

2. **Role Delegation**
   - Allow admins to temporarily delegate management rights
   - Time-limited access tokens for specific users

3. **Multi-Organizational Support**
   - Add `organization` field
   - Isolate users by organization
   - Cross-organization access for superadmins only

4. **Permission Granularity**
   - Beyond role-based, add permission flags
   - Example: `canCreateUsers`, `canDeleteUsers`, `canViewReports`

5. **Two-Factor Authentication**
   - Add extra security layer for admin/superadmin accounts
   - Require 2FA for sensitive operations

---

## Conclusion

This RBAC implementation with ownership-based restrictions provides:

✅ **Strong security** - Backend enforcement prevents bypass  
✅ **Clear accountability** - Track who created what  
✅ **Data isolation** - Admins can't see other admins' data  
✅ **Scalability** - Ready for multi-tenant expansion  
✅ **Compliance-ready** - Audit trails for regulatory requirements  

The ownership model ensures that even if an admin account is compromised, the attacker can only access users created by that specific admin, limiting the blast radius of a security breach.
