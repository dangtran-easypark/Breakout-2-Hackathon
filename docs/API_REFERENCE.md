# API Reference

This document provides a complete reference for all API endpoints available in the backend service.

## Base URL

Development: `http://localhost:3001/api`

## Authentication

Currently, the API does not require authentication. This should be implemented before deploying to production.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Validation errors return:

```json
{
  "errors": [
    {
      "type": "field",
      "msg": "Error message",
      "path": "fieldName",
      "location": "body"
    }
  ]
}
```

## Endpoints

### Tasks API

#### Get All Tasks

```http
GET /api/exercises/tasks
```

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "assignedToName": "string",
    "assignedToAvatar": "string",
    "dueDate": "ISO 8601 date string",
    "priority": "LOW" | "MEDIUM" | "HIGH",
    "status": "UPCOMING" | "IN_PROGRESS" | "COMPLETED",
    "createdAt": "ISO 8601 date string",
    "updatedAt": "ISO 8601 date string"
  }
]
```

#### Get Task by ID

```http
GET /api/exercises/tasks/:id
```

**Parameters:**
- `id` (path) - Task ID

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "assignedToName": "string",
  "assignedToAvatar": "string",
  "dueDate": "ISO 8601 date string",
  "priority": "LOW" | "MEDIUM" | "HIGH",
  "status": "UPCOMING" | "IN_PROGRESS" | "COMPLETED",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

#### Create Task

```http
POST /api/exercises/tasks
```

**Request Body:**
```json
{
  "name": "string (required, min 1, max 255)",
  "assignedToName": "string (optional, max 255)",
  "assignedToAvatar": "string (optional, valid URL)",
  "dueDate": "ISO 8601 date string (optional)",
  "priority": "LOW" | "MEDIUM" | "HIGH" (optional, default: MEDIUM)",
  "status": "UPCOMING" | "IN_PROGRESS" | "COMPLETED" (optional, default: UPCOMING)"
}
```

**Response:** Returns the created task object.

#### Update Task

```http
PUT /api/exercises/tasks/:id
```

**Parameters:**
- `id` (path) - Task ID

**Request Body:**
```json
{
  "name": "string (optional, min 1, max 255)",
  "assignedToName": "string (optional, max 255)",
  "assignedToAvatar": "string (optional, valid URL)",
  "dueDate": "ISO 8601 date string (optional)",
  "priority": "LOW" | "MEDIUM" | "HIGH" (optional)",
  "status": "UPCOMING" | "IN_PROGRESS" | "COMPLETED" (optional)"
}
```

**Response:** Returns the updated task object.

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

#### Delete Task

```http
DELETE /api/exercises/tasks/:id
```

**Parameters:**
- `id` (path) - Task ID

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

### Analytics API

#### Get Monthly Analytics

```http
GET /api/analytics/monthly
```

**Response:**
```json
[
  {
    "id": "string",
    "month": "number (1-12)",
    "year": "number",
    "sessionDuration": "number",
    "pageViews": "number",
    "totalVisits": "number"
  }
]
```

### Health Check

#### Health Status

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO 8601 date string"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. This should be added before production deployment.

## CORS

CORS is configured to allow requests from the frontend URL specified in the environment variables. In development, this defaults to `http://localhost:3000`.

## Validation

All request validation is performed using `express-validator`. Validation errors return a 400 status code with detailed error information.

## Database

The API uses Prisma ORM with SQLite for development. The database schema can be found in `/backend/prisma/schema.prisma`.