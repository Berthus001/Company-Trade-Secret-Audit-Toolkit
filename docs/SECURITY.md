# Security Documentation

## Company Trade Secret Audit Toolkit - Security Implementation

### 1. Overview

This document outlines how the Trade Secret Audit Toolkit implements security measures to protect both the application and the sensitive trade secret information it processes.

---

## 2. Authentication Security

### 2.1 JWT (JSON Web Token) Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT Authentication Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. User Login                                                  │
│      ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│      │  Client  │────▶│  Server  │────▶│ Database │            │
│      │  (React) │     │ (Express)│     │ (MongoDB)│            │
│      └──────────┘     └──────────┘     └──────────┘            │
│           │                │                │                    │
│           │  credentials   │  verify user   │                    │
│           │───────────────▶│───────────────▶│                    │
│           │                │                │                    │
│           │                │◀───────────────│                    │
│           │                │  user data     │                    │
│           │                │                │                    │
│           │   JWT Token    │  generate JWT  │                    │
│           │◀───────────────│                │                    │
│                                                                  │
│   2. Protected Request                                           │
│      ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│      │  Client  │     │  Server  │     │ Database │            │
│      └──────────┘     └──────────┘     └──────────┘            │
│           │                │                │                    │
│           │ request + JWT  │                │                    │
│           │───────────────▶│                │                    │
│           │                │ verify JWT     │                    │
│           │                │                │                    │
│           │                │───────────────▶│                    │
│           │                │  fetch data    │                    │
│           │                │◀───────────────│                    │
│           │◀───────────────│                │                    │
│           │   response     │                │                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**JWT Configuration:**
- Algorithm: HS256
- Expiration: 30 days
- Payload: User ID only (minimal data exposure)
- Secret: Environment variable (never hardcoded)

**Implementation:**
```javascript
// Token Generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Token Verification Middleware
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select('-password');
  next();
};
```

### 2.2 Password Security

**Hashing with bcrypt:**
- Salt rounds: 10
- Passwords never stored in plain text
- Hash comparison for login verification

```javascript
// Password Hashing (Registration)
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);

// Password Verification (Login)
const isMatch = await bcrypt.compare(enteredPassword, this.password);
```

**Password Requirements:**
- Minimum 8 characters
- Recommended: uppercase, lowercase, number, special character

---

## 3. Access Control

### 3.1 Route Protection Levels

```
┌─────────────────────────────────────────────────────────────┐
│                    Route Protection Matrix                   │
├──────────────────┬──────────────┬──────────────────────────┤
│ Endpoint         │ Auth Level   │ Description               │
├──────────────────┼──────────────┼──────────────────────────┤
│ POST /register   │ Public       │ User registration         │
│ POST /login      │ Public       │ User login                │
│ GET /me          │ Private      │ Get own profile           │
│ GET /questions   │ Private      │ View audit questions      │
│ POST /audits     │ Private      │ Submit new audit          │
│ GET /audits      │ Private      │ View own audits           │
│ GET /audits/:id  │ Owner Only   │ View specific audit       │
│ DELETE /audits   │ Owner Only   │ Delete own audit          │
│ POST /seed       │ Admin Only   │ Seed questions            │
└──────────────────┴──────────────┴──────────────────────────┘
```

### 3.2 Ownership Verification

Users can only access their own audit data:

```javascript
// Verify audit ownership
const audit = await Audit.findById(req.params.id);
if (audit.user.toString() !== req.user.id) {
  return res.status(403).json({ 
    error: 'Not authorized to access this audit' 
  });
}
```

---

## 4. Data Protection

### 4.1 Input Validation

All user inputs are validated before processing:

```javascript
// Email validation
email: {
  type: String,
  required: true,
  match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
}

// Sanitization
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // Prevents NoSQL injection
```

### 4.2 XSS Protection

```javascript
const xss = require('xss-clean');
app.use(xss()); // Sanitizes user input from XSS attacks
```

### 4.3 HTTP Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet());

// Sets headers including:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
// - Content-Security-Policy
```

### 4.4 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth', authLimiter);
```

---

## 5. CORS Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## 6. Environment Security

### 6.1 Sensitive Data Management

**Never commit to version control:**
```
.env
node_modules/
*.log
```

**Required Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=https://your-frontend.com
```

### 6.2 Production Security Checklist

- [ ] JWT_SECRET is random and at least 32 characters
- [ ] MONGO_URI uses encrypted connection (mongodb+srv://)
- [ ] NODE_ENV set to 'production'
- [ ] HTTPS enabled on deployment
- [ ] Rate limiting configured
- [ ] Error messages don't expose stack traces

---

## 7. Trade Secret Protection Principles

This application helps organizations implement the following trade secret protection measures:

### 7.1 Reasonable Security Measures

The Defend Trade Secrets Act (DTSA) requires "reasonable measures" to protect trade secrets. This audit evaluates:

| Category | Security Measures |
|----------|------------------|
| **Access Control** | RBAC, MFA, access logging, need-to-know basis |
| **Data Encryption** | At-rest encryption, in-transit encryption, key management |
| **Employee Policies** | NDAs, training, exit procedures, acceptable use policies |
| **Physical Security** | Badge access, visitor logs, clean desk policy, CCTV |

### 7.2 Legal Framework Compliance

The system helps demonstrate compliance with:
- **UTSA (Uniform Trade Secrets Act)**: State-level protection
- **DTSA (Defend Trade Secrets Act)**: Federal protection
- **GDPR**: If handling EU data
- **Industry Standards**: SOC 2, ISO 27001 principles

### 7.3 Evidence of Protection

Audit records serve as evidence that the company:
1. Identified trade secrets
2. Implemented protection measures
3. Regularly assessed security posture
4. Took corrective actions

---

## 8. Security Best Practices for Users

### 8.1 For System Administrators
1. Rotate JWT_SECRET periodically
2. Monitor failed login attempts
3. Regular security audits
4. Keep dependencies updated
5. Backup database regularly

### 8.2 For End Users
1. Use strong, unique passwords
2. Don't share login credentials
3. Log out when finished
4. Report suspicious activity
5. Keep audit data confidential

---

## 9. Incident Response

### 9.1 Security Incident Handling

```
┌─────────────────────────────────────────────────────────┐
│              Security Incident Response Flow             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. DETECT ──▶ 2. CONTAIN ──▶ 3. INVESTIGATE            │
│                                      │                   │
│                                      ▼                   │
│  6. IMPROVE ◀── 5. RECOVER ◀── 4. REMEDIATE            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Response Actions

| Incident Type | Immediate Action |
|---------------|------------------|
| Unauthorized Access | Revoke tokens, reset passwords |
| Data Breach | Isolate affected systems, notify users |
| DDoS Attack | Enable rate limiting, contact hosting |
| Malicious Input | Block IP, review logs |

---

## 10. Compliance Checklist

### Application Security
- [x] JWT authentication implemented
- [x] Password hashing with bcrypt
- [x] Input validation and sanitization
- [x] XSS protection
- [x] CORS configuration
- [x] Rate limiting
- [x] HTTP security headers
- [x] Environment variable management

### Trade Secret Protection Features
- [x] Multi-category assessment
- [x] Quantitative scoring system
- [x] Risk level classification
- [x] Actionable recommendations
- [x] Audit history tracking
- [x] User-specific data isolation
