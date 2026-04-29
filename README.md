# Company Trade Secret Audit Toolkit

A full-stack MERN web application that evaluates how well a company protects its trade secrets using a multi-level qualitative scoring system.

## 🛡️ Overview

This toolkit helps organizations assess their trade secret protection measures across four key areas:

- **Access Control** - Authentication, authorization, and access management
- **Data Encryption** - Data protection at rest and in transit
- **Employee Policies** - Training, NDAs, and security awareness
- **Physical Security** - Facility protection and visitor management

## 📊 Scoring System

### Response Values
| Label | Description | Value |
|-------|-------------|-------|
| Very Good | Comprehensive controls | 4 |
| Good | Adequate controls | 3 |
| Acceptable | Basic controls | 2 |
| Bad | Minimal controls | 1 |
| Very Bad | No controls | 0 |

### Risk Classification
| Percentage | Risk Level |
|------------|------------|
| 75-100% | Low Risk ✅ |
| 50-74% | Medium Risk ⚡ |
| 0-49% | High Risk ⚠️ |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Seed the database with default questions
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # External services (Gemini AI)
│   ├── utils/           # Scoring & recommendation engines
│   ├── scripts/         # Utility scripts (seeder, test accounts)
│   ├── tests/           # Test files
│   └── server.js        # Express app entry
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth context provider
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service
│   │   └── styles/      # CSS styles
│   └── public/
│
└── docs/                # Documentation
    ├── ARCHITECTURE.md  # System architecture
    ├── API.md           # API documentation
    ├── ERD.md           # Database design
    ├── SECURITY.md      # Security considerations
    ├── DEPLOYMENT.md    # Deployment guide
    ├── GEMINI_INTEGRATION.md       # AI integration guide
    └── AI_RECOMMENDATIONS_GUIDE.md # AI recommendations usage
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - Get all questions (grouped by category)
- `POST /api/questions/seed` - Seed default questions

### Audits
- `POST /api/audits` - Submit new audit
- `GET /api/audits` - Get user's audits
- `GET /api/audits/:id` - Get specific audit
- `DELETE /api/audits/:id` - Delete audit
- `GET /api/audits/summary` - Get audit summary

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- MongoDB injection sanitization
- HTTP security headers (Helmet)

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/trade_secret_audit_db
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions for:
- MongoDB Atlas
- Render (Backend)
- Vercel (Frontend)

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and patterns
- [API Documentation](docs/API.md) - REST API reference
- [Database Design](docs/ERD.md) - Schema definitions
- [Security](docs/SECURITY.md) - Security implementation details
- [Deployment](docs/DEPLOYMENT.md) - Deployment guide

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
