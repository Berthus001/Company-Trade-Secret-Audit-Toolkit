# System Architecture - Company Trade Secret Audit Toolkit

## 1. Overview

The Company Trade Secret Audit Toolkit is a full-stack MERN web application designed to help organizations evaluate and improve their trade secret protection measures through a comprehensive, qualitative scoring system.

### 1.1 Purpose & Relevance

Trade secrets are critical business assets that include formulas, processes, designs, instruments, patterns, or compilations of information. Unlike patents, trade secrets have no expiration date but require active protection measures.

**How This System Helps Companies:**
- **Risk Assessment**: Identifies vulnerabilities in current trade secret protection
- **Compliance Tracking**: Ensures adherence to security best practices
- **Actionable Insights**: Provides specific recommendations for improvement
- **Audit Trail**: Maintains historical records for legal defense purposes
- **Due Diligence**: Supports M&A and investment evaluations

### 1.2 Legal Framework Integration
- Uniform Trade Secrets Act (UTSA)
- Defend Trade Secrets Act (DTSA)
- GDPR considerations for EU operations
- Industry-specific regulations (HIPAA, SOX, etc.)

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    React.js Application                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Login   │ │ Register │ │Dashboard │ │  Audit   │ │ Results  │ │ │
│  │  │  Page    │ │   Page   │ │   Page   │ │   Form   │ │   Page   │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  │                            │                                        │ │
│  │  ┌─────────────────────────┴─────────────────────────────────────┐ │ │
│  │  │              Context API (Auth State Management)               │ │ │
│  │  └─────────────────────────┬─────────────────────────────────────┘ │ │
│  │                            │                                        │ │
│  │  ┌─────────────────────────┴─────────────────────────────────────┐ │ │
│  │  │                    API Service Layer                           │ │ │
│  │  │                  (Axios HTTP Client)                           │ │ │
│  │  └─────────────────────────┬─────────────────────────────────────┘ │ │
│  └────────────────────────────┼─────────────────────────────────────────┘ │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │ HTTPS/REST API
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                                │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Middleware Layer                           │  │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │ │
│  │  │  │  CORS   │ │  JWT    │ │  Rate   │ │ Helmet  │ │  Error  │ │  │ │
│  │  │  │ Handler │ │  Auth   │ │ Limiter │ │Security │ │ Handler │ │  │ │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                      Routes Layer                             │  │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │ │
│  │  │  │  Auth    │ │  Audit   │ │ Question │ │ Recommendations  │ │  │ │
│  │  │  │  Routes  │ │  Routes  │ │  Routes  │ │     Routes       │ │  │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Controllers Layer                           │  │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │ │
│  │  │  │  Auth    │ │  Audit   │ │ Question │ │ Recommendation   │ │  │ │
│  │  │  │Controller│ │Controller│ │Controller│ │   Controller     │ │  │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Utility Layer                              │  │ │
│  │  │  ┌──────────────┐ ┌────────────────────────────────────────┐ │  │ │
│  │  │  │   Scoring    │ │         Recommendation                  │ │  │ │
│  │  │  │   Engine     │ │            Engine                       │ │  │ │
│  │  │  └──────────────┘ └────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │ Mongoose ODM
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      MongoDB Atlas                                  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐│ │
│  │  │    Users     │ │    Audits    │ │         Questions            ││ │
│  │  │  Collection  │ │  Collection  │ │         Collection           ││ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

### 3.1 Authentication Flow
```
User → Login Form → API Request → JWT Generation → Token Storage → Authenticated State
```

### 3.2 Audit Flow
```
User → Select Questions → Submit Answers → Scoring Engine → 
Recommendation Engine → Save to MongoDB → Display Results
```

### 3.3 Request/Response Cycle
```
1. Client sends HTTP request with JWT token
2. Express middleware validates token
3. Request routed to appropriate controller
4. Controller processes business logic
5. Mongoose interacts with MongoDB
6. Response returned to client
7. React updates UI state
```

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js 18+ | UI Components & State |
| State Management | Context API | Global Auth State |
| HTTP Client | Axios | API Communication |
| Styling | CSS3 / Custom | UI Design |
| Backend | Node.js 18+ | Runtime Environment |
| Framework | Express.js 4+ | Web Server Framework |
| Database | MongoDB 6+ | NoSQL Data Storage |
| ODM | Mongoose 7+ | MongoDB Object Modeling |
| Authentication | JWT | Stateless Auth |
| Security | bcryptjs, helmet | Password Hashing, Headers |

## 5. MVC Pattern Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                        MODEL                                 │
│   • Mongoose Schemas (User, Audit, Question)                │
│   • Data validation rules                                    │
│   • Database interaction methods                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CONTROLLER                              │
│   • Business logic implementation                            │
│   • Request/Response handling                                │
│   • Scoring & Recommendation engines                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         VIEW                                 │
│   • React Components                                         │
│   • User Interface rendering                                 │
│   • State management                                         │
└─────────────────────────────────────────────────────────────┘
```

## 6. Security Architecture

### 6.1 Defense in Depth
- **Network Layer**: HTTPS encryption, CORS policy
- **Application Layer**: JWT authentication, input validation
- **Data Layer**: Password hashing, encrypted connections
- **Audit Layer**: Activity logging, access trails

### 6.2 Authentication Security
- JWT tokens with expiration
- Secure password hashing (bcrypt)
- Protected routes middleware
- Token refresh mechanism

## 7. Folder Structure

```
project-root/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── auditController.js
│   │   └── questionController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Audit.js
│   │   └── Question.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── auditRoutes.js
│   │   └── questionRoutes.js
│   ├── utils/
│   │   ├── scoringEngine.js
│   │   └── recommendationEngine.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    ├── ERD.md
    ├── API.md
    └── DEPLOYMENT.md
```
