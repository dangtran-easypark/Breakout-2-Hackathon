# Environment Variables

This document describes all environment variables used by the application.

## Backend Environment Variables

Create a `.env` file in the `/backend` directory with the following variables:

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| DATABASE_URL | SQLite database connection string | - | `file:./dev.db` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| BACKEND_PORT | Port for the backend server | `3001` | `3001` |
| FRONTEND_URL | Frontend URL for CORS configuration | `http://localhost:3000` | `http://localhost:3000` |

### Example Backend .env File

```bash
# Database
DATABASE_URL="file:./dev.db"

# Server Configuration
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Frontend Environment Variables

### Development Environment

Create a `.env.development` file in the `/frontend` directory:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| VITE_API_BASE_URL | Backend API base URL | `http://localhost:3001/api` | `http://localhost:3001/api` |

### Example Frontend .env.development File

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
```

### Production Environment

For production, create a `.env.production` file in the `/frontend` directory:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| VITE_API_BASE_URL | Backend API base URL | - | `https://api.example.com/api` |

## Environment Setup

1. **Copy the example files** (if they exist):
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   
   # Frontend
   cd ../frontend
   cp .env.development.example .env.development
   ```

2. **Update the values** according to your environment.

3. **Never commit** `.env` files to version control.

## Accessing Environment Variables

### Backend (Node.js)

Environment variables are automatically loaded using `dotenv`. Access them using:

```javascript
process.env.VARIABLE_NAME
```

### Frontend (Vite)

Only variables prefixed with `VITE_` are exposed to the frontend. Access them using:

```javascript
import.meta.env.VITE_VARIABLE_NAME
```

## Production Considerations

1. **Use environment-specific files**: `.env.development`, `.env.production`
2. **Set variables through your deployment platform**: Most platforms (Vercel, Netlify, Heroku, etc.) provide ways to set environment variables through their UI or CLI.
3. **Use secrets management**: For sensitive values, use a secrets management service.
4. **Validate required variables**: Ensure your application validates that all required environment variables are set on startup.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use `.gitignore`** to exclude all `.env*` files
3. **Rotate secrets regularly** in production
4. **Use different values** for development and production
5. **Limit access** to production environment variables
6. **Don't expose sensitive variables** to the frontend