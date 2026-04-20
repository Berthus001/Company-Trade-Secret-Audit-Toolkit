# API Documentation

## Company Trade Secret Audit Toolkit - RESTful API

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User
Creates a new user account.

**Endpoint:** `POST /api/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@company.com",
  "password": "SecurePass123!",
  "company": "Tech Innovations Inc."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@company.com",
    "company": "Tech Innovations Inc.",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "All fields are required" |
| 400 | "Email already registered" |
| 400 | "Password must be at least 8 characters" |

---

### 1.2 Login User
Authenticates user and returns JWT token.

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@company.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@company.com",
    "company": "Tech Innovations Inc.",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "Please provide email and password" |
| 401 | "Invalid credentials" |

---

### 1.3 Get Current User
Returns the currently authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Access:** Private (requires token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@company.com",
    "company": "Tech Innovations Inc.",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2. Questions Endpoints

### 2.1 Get All Questions
Retrieves all active audit questions grouped by category.

**Endpoint:** `GET /api/questions`

**Access:** Private

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (optional) |

**Success Response (200):**
```json
{
  "success": true,
  "count": 20,
  "data": {
    "Access Control": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "category": "Access Control",
        "text": "How well does your organization implement RBAC?",
        "options": [
          { "label": "Very Good", "value": 4, "description": "..." },
          { "label": "Good", "value": 3, "description": "..." },
          { "label": "Decent", "value": 2, "description": "..." },
          { "label": "Bad", "value": 1, "description": "..." },
          { "label": "Very Bad", "value": 0, "description": "..." }
        ],
        "weight": 2,
        "order": 1
      }
    ],
    "Data Encryption": [...],
    "Employee Policies": [...],
    "Physical Security": [...]
  }
}
```

---

### 2.2 Get Question by ID
Retrieves a single question by its ID.

**Endpoint:** `GET /api/questions/:id`

**Access:** Private

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "category": "Access Control",
    "text": "How well does your organization implement RBAC?",
    "options": [...],
    "weight": 2,
    "order": 1
  }
}
```

---

### 2.3 Seed Questions (Admin)
Populates database with default questions.

**Endpoint:** `POST /api/questions/seed`

**Access:** Private (Admin only)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Questions seeded successfully",
  "count": 20
}
```

---

## 3. Audit Endpoints

### 3.1 Submit Audit
Creates a new audit with scoring and recommendations.

**Endpoint:** `POST /api/audits`

**Access:** Private

**Request Body:**
```json
{
  "companyName": "Tech Innovations Inc.",
  "responses": [
    {
      "questionId": "507f1f77bcf86cd799439022",
      "selectedValue": 3
    },
    {
      "questionId": "507f1f77bcf86cd799439023",
      "selectedValue": 2
    }
  ],
  "notes": "Initial audit for Q1 2024"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439033",
    "user": "507f1f77bcf86cd799439011",
    "companyName": "Tech Innovations Inc.",
    "auditDate": "2024-01-20T14:00:00.000Z",
    "responses": [...],
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
        "description": "...",
        "actions": [...]
      }
    ],
    "status": "completed"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 400 | "Company name is required" |
| 400 | "At least one response is required" |
| 404 | "Question not found" |

---

### 3.2 Get All User Audits
Retrieves all audits for the authenticated user.

**Endpoint:** `GET /api/audits`

**Access:** Private

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10) |
| riskLevel | string | Filter by risk level |
| startDate | date | Filter from date |
| endDate | date | Filter to date |

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalCount": 5
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439033",
      "companyName": "Tech Innovations Inc.",
      "auditDate": "2024-01-20T14:00:00.000Z",
      "percentageScore": 65,
      "riskLevel": "Medium",
      "status": "completed"
    }
  ]
}
```

---

### 3.3 Get Single Audit
Retrieves a specific audit with full details.

**Endpoint:** `GET /api/audits/:id`

**Access:** Private (Owner only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439033",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john@company.com"
    },
    "companyName": "Tech Innovations Inc.",
    "auditDate": "2024-01-20T14:00:00.000Z",
    "responses": [...],
    "categoryScores": {...},
    "totalScore": 52,
    "maxPossibleScore": 80,
    "percentageScore": 65,
    "riskLevel": "Medium",
    "recommendations": [...],
    "status": "completed",
    "notes": "Initial audit for Q1 2024"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| 404 | "Audit not found" |
| 403 | "Not authorized to access this audit" |

---

### 3.4 Delete Audit
Deletes a specific audit.

**Endpoint:** `DELETE /api/audits/:id`

**Access:** Private (Owner only)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Audit deleted successfully"
}
```

---

## 4. Recommendations Endpoint

### 4.1 Get Recommendations
Retrieves recommendations based on category scores.

**Endpoint:** `POST /api/recommendations`

**Access:** Private

**Request Body:**
```json
{
  "categoryScores": {
    "accessControl": { "percentage": 45 },
    "dataEncryption": { "percentage": 60 },
    "employeePolicies": { "percentage": 35 },
    "physicalSecurity": { "percentage": 70 }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "category": "Access Control",
      "priority": "Critical",
      "title": "Implement Robust Access Control",
      "description": "Your access control score indicates significant vulnerabilities",
      "actions": [
        "Implement Role-Based Access Control (RBAC)",
        "Deploy Multi-Factor Authentication (MFA)",
        "Establish access logging and monitoring",
        "Conduct quarterly access reviews"
      ]
    },
    {
      "category": "Employee Policies",
      "priority": "Critical",
      "title": "Strengthen Employee Security Policies",
      "description": "Employee policy gaps can lead to trade secret exposure",
      "actions": [
        "Develop comprehensive NDA agreements",
        "Implement mandatory security training",
        "Create clear data handling procedures",
        "Establish exit interview protocols"
      ]
    }
  ]
}
```

---

## 5. Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 6. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Auth endpoints | 5 requests per minute |
| Other endpoints | 100 requests per minute |

---

## 7. Sample cURL Commands

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"Test1234!","company":"Test Inc"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Test1234!"}'
```

### Get Questions
```bash
curl -X GET http://localhost:5000/api/questions \
  -H "Authorization: Bearer <token>"
```

### Submit Audit
```bash
curl -X POST http://localhost:5000/api/audits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"companyName":"Test Inc","responses":[...]}'
```
