# RBAC Quick Reference Card

## What Changed?

### 1. **User Model** - Added Ownership Tracking
```javascript
createdBy: ObjectId  // References the admin/superadmin who created this user
```

### 2. **Middleware** - New Authorization Function
```javascript
verifyOwnership()  // Checks if admin owns the resource
```

### 3. **Controllers** - Ownership Enforcement
- `createAdmin()` - Sets createdBy to superadmin's ID
- `createUser()` - Sets createdBy to admin/superadmin's ID  
- `getUsers()` - Filters by createdBy for admins
- `updateUser()` - Checks ownership before update
- `deleteUser()` - Checks ownership before delete

---

## Permission Matrix

| Action | User | Admin | Superadmin |
|--------|------|-------|------------|
| Create Admin | ❌ | ❌ | ✅ |
| Create User | ❌ | ✅ (becomes owner) | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| View All Users | ❌ | ✅ (only created by them) | ✅ (all) |
| Update Own Profile | ✅ | ✅ | ✅ |
| Update Other Users | ❌ | ✅ (only created by them) | ✅ (all) |
| Delete Users | ❌ | ✅ (only created by them) | ✅ (all except superadmins) |
| Change User Roles | ❌ | ❌ | ✅ |

---

## API Endpoints

### Create Admin (Superadmin Only)
```http
POST /api/auth/users/create-admin
Authorization: Bearer <superadmin_token>

Body:
{
  "name": "Admin Name",
  "email": "admin@company.com",
  "password": "SecurePass123",
  "company": "Company Name"
}
```

### Create User (Admin/Superadmin)
```http
POST /api/auth/users/create-user
Authorization: Bearer <admin_or_superadmin_token>

Body:
{
  "name": "User Name",
  "email": "user@company.com",
  "password": "SecurePass123",
  "company": "Company Name"
}
```

### Get Users (Admin/Superadmin)
```http
GET /api/auth/users?role=user
Authorization: Bearer <token>

# Admin → Returns only users they created
# Superadmin → Returns ALL users
```

### Update User (Admin/Superadmin)
```http
PUT /api/auth/users/:id
Authorization: Bearer <token>

Body:
{
  "name": "Updated Name",
  "company": "Updated Company"
}

# Admin → Only if they created this user (403 otherwise)
# Superadmin → Can update any user
```

### Delete User (Admin/Superadmin)
```http
DELETE /api/auth/users/:id
Authorization: Bearer <token>

# Admin → Only if they created this user (403 otherwise)
# Superadmin → Can delete any user (except superadmins)
```

---

## Error Responses

| Status | Error Message | Meaning |
|--------|---------------|---------|
| 401 | "Not authorized, no token provided" | No JWT token in request |
| 401 | "Not authorized, token expired" | JWT token has expired |
| 403 | "Not authorized, insufficient permissions" | User role not allowed for this action |
| 403 | "Access denied: You can only manage users you created" | Admin trying to access user created by another admin |
| 403 | "Admins cannot change user roles" | Admin trying to modify role field |
| 403 | "Cannot modify superadmin accounts" | Non-superadmin trying to update superadmin |
| 403 | "Cannot delete superadmin accounts" | Anyone trying to delete superadmin |
| 404 | "User not found" | User ID doesn't exist |

---

## Testing Workflow

### 1. Test as Superadmin
```bash
# Login as superadmin
POST /api/auth/login
{ "email": "superadmin@company.com", "password": "..." }

# Save the token from response

# Create an admin
POST /api/auth/users/create-admin
Authorization: Bearer <superadmin_token>

# View all users
GET /api/auth/users
Authorization: Bearer <superadmin_token>
```

### 2. Test as Admin
```bash
# Login as admin
POST /api/auth/login
{ "email": "admin@company.com", "password": "..." }

# Create a user (you become the owner)
POST /api/auth/users/create-user
Authorization: Bearer <admin_token>

# View your users (filtered automatically)
GET /api/auth/users
Authorization: Bearer <admin_token>

# Update your user (should succeed)
PUT /api/auth/users/<your_user_id>
Authorization: Bearer <admin_token>

# Try to update a user created by another admin (should fail with 403)
PUT /api/auth/users/<other_admin_user_id>
Authorization: Bearer <admin_token>
# Expected: 403 "Access denied: You can only update users you created"
```

### 3. Test as Regular User
```bash
# Login as user
POST /api/auth/login
{ "email": "user@company.com", "password": "..." }

# View own profile
GET /api/auth/me
Authorization: Bearer <user_token>

# Try to view all users (should fail with 403)
GET /api/auth/users
Authorization: Bearer <user_token>
# Expected: 403 "Not authorized, insufficient permissions"
```

---

## Security Highlights

✅ **All checks enforced in backend** - Frontend cannot bypass  
✅ **Database-level filtering** - Admins can't query other admins' users  
✅ **Ownership tracked** - Accountability for who created what  
✅ **Privilege escalation prevented** - Admins can't become superadmins  
✅ **Superadmin protected** - Cannot be deleted by anyone  
✅ **Role immutability for admins** - Admins can't change roles  

---

## Postman Collection Setup

1. **Create Environment Variables**
   - `base_url` = `http://localhost:5000/api`
   - `superadmin_token` = (get from login)
   - `admin_token` = (get from login)
   - `user_token` = (get from login)

2. **Import Requests**
   ```
   Auth/
   ├── Login
   ├── Get Profile
   User Management/
   ├── Create Admin (Superadmin)
   ├── Create User (Admin/Superadmin)
   ├── Get Users
   ├── Update User
   └── Delete User
   ```

3. **Set Authorization**
   - All protected routes: `Bearer {{token_variable}}`

---

## Frontend Updates Needed

### 1. Update User Management Pages
```javascript
// In AdminDashboard.js or ManageUsers.js

// The API automatically filters by createdBy
const fetchUsers = async () => {
  const response = await api.getUsers();
  // Admin: Only gets users they created
  // Superadmin: Gets all users
  setUsers(response.data);
};

// Show edit/delete only for owned users
{users.map(user => (
  <div key={user._id}>
    <span>{user.name}</span>
    {/* Show creator info */}
    {user.createdBy && (
      <small>Created by: {user.createdBy.name}</small>
    )}
    
    {/* Conditionally show actions */}
    {(isSuperadmin || user.createdBy._id === currentUser._id) && (
      <>
        <button onClick={() => handleEdit(user)}>Edit</button>
        <button onClick={() => handleDelete(user)}>Delete</button>
      </>
    )}
  </div>
))}
```

### 2. Handle 403 Errors
```javascript
const handleUpdate = async (userId, data) => {
  try {
    await api.updateUser(userId, data);
    toast.success('User updated successfully');
  } catch (error) {
    if (error.response?.status === 403) {
      toast.error('You do not have permission to modify this user');
    } else {
      toast.error('Failed to update user');
    }
  }
};
```

### 3. Hide Create Admin Button (Admins)
```javascript
{isSuperadmin && (
  <button onClick={handleCreateAdmin}>
    Create Admin
  </button>
)}

{(isAdmin || isSuperadmin) && (
  <button onClick={handleCreateUser}>
    Create User
  </button>
)}
```

---

## Database Migration (Optional)

If you have existing users without `createdBy`:

```javascript
// Run this script once to set createdBy to null for existing users
const User = require('./models/User');

async function migrateExistingUsers() {
  await User.updateMany(
    { createdBy: { $exists: false } },
    { $set: { createdBy: null } }
  );
  console.log('Migration complete');
}

migrateExistingUsers();
```

---

## Common Issues & Solutions

### Issue: Admin sees no users
**Cause:** Admin hasn't created any users yet  
**Solution:** Create users using `POST /api/auth/users/create-user`

### Issue: 403 when updating user
**Cause:** Admin trying to update user created by another admin  
**Solution:** Only update users you created, or use superadmin account

### Issue: Can't delete superadmin
**Cause:** Protection rule prevents deleting superadmins  
**Solution:** This is intentional for security

### Issue: Admin can't change user role
**Cause:** Admins are not allowed to change roles  
**Solution:** Use superadmin account to change roles

---

## Summary

**Before:** All admins could see and manage ALL users  
**After:** Admins can ONLY see/manage users they created  

**Superadmin Override:** Superadmins maintain full access to everything

**Security Benefit:** If an admin account is compromised, attacker can only access that admin's users, not the entire database.
