# Entity Relationship Diagram (ERD)

## Database Design - Company Trade Secret Audit Toolkit

**Database Name:** `trade_secret_audit_db`

### Collections Summary

| Collection | Purpose | Status |
|------------|---------|--------|
| users | Authentication and account data | Required |
| questions | Audit checklist questions | Required |
| audits | Completed audit records | Required |
| categories | Category definitions and metadata | Optional |
| audit_logs | Activity tracking for security | Optional |

### 1. Collections Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MongoDB Collections                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐     ┌──────────────────────┐                      │
│  │       USERS          │     │      QUESTIONS       │                      │
│  ├──────────────────────┤     ├──────────────────────┤                      │
│  │ _id: ObjectId (PK)   │     │ _id: ObjectId (PK)   │                      │
│  │ name: String         │     │ category: String     │                      │
│  │ email: String (UQ)   │     │ text: String         │                      │
│  │ password: String     │     │ options: [Object]    │                      │
│  │ company: String      │     │ weight: Number       │                      │
│  │ role: String         │     │ order: Number        │                      │
│  │ createdAt: Date      │     │ isActive: Boolean    │                      │
│  │ updatedAt: Date      │     │ createdAt: Date      │                      │
│  └──────────┬───────────┘     └──────────┬───────────┘                      │
│             │                            │                                   │
│             │ 1:N                        │ Referenced                        │
│             │                            │                                   │
│             ▼                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                            AUDITS                                     │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │ _id: ObjectId (PK)                                                    │   │
│  │ user: ObjectId (FK → Users)                                           │   │
│  │ companyName: String                                                   │   │
│  │ auditDate: Date                                                       │   │
│  │ responses: [{questionId, category, selectedOption, score}]            │   │
│  │ categoryScores: {accessControl, dataEncryption, employeePolicies,     │   │
│  │                  physicalSecurity}                                    │   │
│  │ totalScore: Number                                                    │   │
│  │ maxPossibleScore: Number                                              │   │
│  │ percentageScore: Number                                               │   │
│  │ riskLevel: String (Low/Medium/High)                                   │   │
│  │ recommendations: [String]                                             │   │
│  │ status: String (draft/completed)                                      │   │
│  │ createdAt: Date                                                       │   │
│  │ updatedAt: Date                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Detailed Schema Definitions

#### 2.1 Users Collection

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /email-regex/
  },
  password: {
    type: String,
    required: true,
    minLength: 60                   // bcrypt hash length
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: Date,                  // Mongoose timestamps
  updatedAt: Date
}

// Indexes
{ email: 1 }                        // Unique index for fast lookup
```

#### 2.2 Questions Collection

```javascript
{
  _id: ObjectId,
  category: {
    type: String,
    required: true,
    enum: [
      'Access Control',
      'Data Encryption',
      'Employee Policies',
      'Physical Security'
    ]
  },
  text: {
    type: String,
    required: true,
    maxLength: 500
  },
  options: [{
    label: {
      type: String,
      enum: ['Very Good', 'Good', 'Decent', 'Bad', 'Very Bad']
    },
    value: {
      type: Number,
      min: 0,
      max: 4
    },
    description: String            // Clarifying description for each option
  }],
  weight: {
    type: Number,
    default: 1,
    min: 1,
    max: 3                         // Allows critical questions to have more weight
  },
  order: {
    type: Number,
    required: true                 // Display order within category
  },
  isActive: {
    type: Boolean,
    default: true                  // Soft delete capability
  },
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ category: 1, order: 1 }          // For efficient category-based queries
{ isActive: 1 }                    // For filtering active questions
```

#### 2.3 Audits Collection

```javascript
{
  _id: ObjectId,
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  auditDate: {
    type: Date,
    default: Date.now
  },
  responses: [{
    questionId: {
      type: ObjectId,
      ref: 'Question',
      required: true
    },
    category: String,
    questionText: String,          // Stored for historical reference
    selectedOption: {
      label: String,
      value: Number,
      description: String
    },
    score: Number                  // Calculated: value * weight
  }],
  categoryScores: {
    accessControl: {
      score: Number,
      maxScore: Number,
      percentage: Number
    },
    dataEncryption: {
      score: Number,
      maxScore: Number,
      percentage: Number
    },
    employeePolicies: {
      score: Number,
      maxScore: Number,
      percentage: Number
    },
    physicalSecurity: {
      score: Number,
      maxScore: Number,
      percentage: Number
    }
  },
  totalScore: {
    type: Number,
    required: true
  },
  maxPossibleScore: {
    type: Number,
    required: true
  },
  percentageScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  recommendations: [{
    category: String,
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low']
    },
    title: String,
    description: String,
    actions: [String]
  }],
  status: {
    type: String,
    enum: ['draft', 'completed'],
    default: 'completed'
  },
  notes: String,                   // Optional auditor notes
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ user: 1, createdAt: -1 }         // User's audits, newest first
{ companyName: 1 }                 // Company-based queries
{ riskLevel: 1 }                   // Risk-based filtering
{ status: 1 }                      // Status filtering
```

### 3. Relationships

```
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│    Users      │          │    Audits     │          │   Questions   │
├───────────────┤          ├───────────────┤          ├───────────────┤
│ _id (PK)      │◄─────────│ user (FK)     │          │ _id (PK)      │
│ name          │  1:N     │ responses[]   │──────────│ category      │
│ email         │          │   questionId  │   N:M    │ text          │
│ company       │          │ categoryScores│  (ref)   │ options       │
│ role          │          │ totalScore    │          │ weight        │
│ password      │          │ riskLevel     │          │ order         │
└───────────────┘          │ recommendations│          └───────────────┘
                           └───────────────┘
```

**Relationship Types:**
- **Users → Audits**: One-to-Many (A user can have multiple audits)
- **Questions → Audits**: Many-to-Many via responses array (Questions referenced in audit responses)

### 4. Sample Data

#### 4.1 Sample User Document
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Smith",
  "email": "john.smith@company.com",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMy...",
  "company": "Tech Innovations Inc.",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 4.2 Sample Question Document
```json
{
  "_id": "507f1f77bcf86cd799439022",
  "category": "Access Control",
  "text": "How well does your organization implement Role-Based Access Control (RBAC) for sensitive information?",
  "options": [
    {
      "label": "Very Good",
      "value": 4,
      "description": "Comprehensive RBAC with regular reviews, principle of least privilege strictly enforced"
    },
    {
      "label": "Good",
      "value": 3,
      "description": "RBAC implemented with occasional reviews, most users follow least privilege"
    },
    {
      "label": "Decent",
      "value": 2,
      "description": "Basic RBAC in place but inconsistently applied across departments"
    },
    {
      "label": "Bad",
      "value": 1,
      "description": "Limited access controls, many users have excessive permissions"
    },
    {
      "label": "Very Bad",
      "value": 0,
      "description": "No formal access control system, open access to most resources"
    }
  ],
  "weight": 2,
  "order": 1,
  "isActive": true
}
```

#### 4.3 Sample Audit Document
```json
{
  "_id": "507f1f77bcf86cd799439033",
  "user": "507f1f77bcf86cd799439011",
  "companyName": "Tech Innovations Inc.",
  "auditDate": "2024-01-20T14:00:00.000Z",
  "responses": [
    {
      "questionId": "507f1f77bcf86cd799439022",
      "category": "Access Control",
      "questionText": "How well does your organization implement RBAC?",
      "selectedOption": {
        "label": "Good",
        "value": 3,
        "description": "RBAC implemented with occasional reviews"
      },
      "score": 6
    }
  ],
  "categoryScores": {
    "accessControl": { "score": 18, "maxScore": 24, "percentage": 75 },
    "dataEncryption": { "score": 12, "maxScore": 20, "percentage": 60 },
    "employeePolicies": { "score": 14, "maxScore": 20, "percentage": 70 },
    "physicalSecurity": { "score": 8, "maxScore": 16, "percentage": 50 }
  },
  "totalScore": 52,
  "maxPossibleScore": 80,
  "percentageScore": 65,
  "riskLevel": "Medium",
  "recommendations": [
    {
      "category": "Physical Security",
      "priority": "High",
      "title": "Improve Physical Access Controls",
      "description": "Current physical security measures need enhancement",
      "actions": [
        "Install badge access systems",
        "Implement visitor logging",
        "Add CCTV monitoring"
      ]
    }
  ],
  "status": "completed"
}
```

### 5. Data Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| email | Must be unique, valid format | "Email already exists" / "Invalid email format" |
| password | Min 8 chars, complexity rules | "Password must be at least 8 characters" |
| category | Must be in enum list | "Invalid category" |
| score value | 0-4 range | "Score must be between 0 and 4" |
| percentageScore | 0-100 range | "Invalid percentage" |
| riskLevel | Must be Low/Medium/High | "Invalid risk level" |

### 6. Indexing Strategy

```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true });

// Questions Collection  
db.questions.createIndex({ category: 1, order: 1 });
db.questions.createIndex({ isActive: 1 });

// Audits Collection
db.audits.createIndex({ user: 1, createdAt: -1 });
db.audits.createIndex({ companyName: 1 });
db.audits.createIndex({ riskLevel: 1, createdAt: -1 });

// Categories Collection (Optional)
db.categories.createIndex({ order: 1 });
db.categories.createIndex({ name: 1 }, { unique: true });

// AuditLogs Collection (Optional)
db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
db.audit_logs.createIndex({ action: 1, timestamp: -1 });
db.audit_logs.createIndex({ timestamp: -1 });
```

### 7. Optional Collections (Bonus)

#### 7.1 Categories Collection

For cleaner structure and category management:

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Access Control', 'Data Encryption', 'Employee Policies', 'Physical Security']
  },
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  icon: {
    type: String,
    default: '📋'
  },
  order: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Sample Category Document:**
```json
{
  "_id": "507f1f77bcf86cd799439044",
  "name": "Access Control",
  "description": "Measures controlling who can access trade secret information, including authentication, authorization, and access management systems.",
  "icon": "🔐",
  "order": 1,
  "isActive": true
}
```

#### 7.2 Audit Logs Collection

Tracks user activity for security and compliance:

```javascript
{
  _id: ObjectId,
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_REGISTER',
      'USER_LOGIN',
      'USER_LOGOUT',
      'USER_UPDATE',
      'CREATE_AUDIT',
      'VIEW_AUDIT',
      'DELETE_AUDIT',
      'EXPORT_AUDIT',
      'SEED_QUESTIONS',
      'PASSWORD_CHANGE',
      'FAILED_LOGIN'
    ]
  },
  details: {
    type: Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  resourceType: {
    type: String,
    enum: ['User', 'Audit', 'Question', 'Category', null]
  },
  resourceId: ObjectId,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}
```

**Sample Audit Log Document:**
```json
{
  "_id": "507f1f77bcf86cd799439055",
  "userId": "507f1f77bcf86cd799439011",
  "action": "CREATE_AUDIT",
  "details": {
    "companyName": "Tech Innovations Inc.",
    "percentageScore": 65
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "resourceType": "Audit",
  "resourceId": "507f1f77bcf86cd799439033",
  "status": "success",
  "timestamp": "2024-01-20T14:05:00.000Z"
}
```
