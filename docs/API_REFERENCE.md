# API Reference

This document provides a complete reference for all API endpoints available in the backend service.

## Base URL

Development: `http://localhost:5001/api`

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

---

### Melbourne Parking API

All Melbourne endpoints are under `/api/melbourne`.

#### Get All Sensors

```http
GET /api/melbourne/sensors
```

Returns all ~3,309 on-street parking bay sensors with computed `durationMinutes`.

**Response:**
```json
[
  {
    "id": "uuid",
    "kerbsideId": 12345,
    "zoneNumber": 6042,
    "lat": -37.8134,
    "lon": 144.9627,
    "status": "Present | Unoccupied",
    "occupancySince": "ISO 8601 | null",
    "lastUpdated": "ISO 8601",
    "durationMinutes": 7
  }
]
```

`durationMinutes` is `null` when `status` is not `"Present"`.

#### Get Priority Zones

```http
GET /api/melbourne/priority-zones
```

Returns parking zones sorted by enforcement priority score (high → low). Score = `(redCount × 3) + (amberCount × 1)`.

**Response:**
```json
[
  {
    "zoneNumber": 6042,
    "totalBays": 12,
    "occupiedBays": 9,
    "redCount": 4,
    "amberCount": 3,
    "greenCount": 2,
    "score": 15,
    "averageDurationMinutes": 18
  }
]
```

Duration thresholds: green < 4 min · amber 4–12 min · red > 12 min.

#### Trigger Data Refresh

```http
POST /api/melbourne/refresh
```

Fetches the latest data from the City of Melbourne Open Data API and upserts all sensors.

**Response:**
```json
{ "synced": 3309 }
```

#### List Snapshots

```http
GET /api/melbourne/snapshots
```

Returns all stored historical snapshots in reverse chronological order.

**Response:**
```json
[
  { "id": "uuid", "capturedAt": "ISO 8601", "sensorCount": 3309 }
]
```

#### Get Snapshot Sensors

```http
GET /api/melbourne/snapshots/:id/sensors
```

Returns the sensor readings from a specific historical snapshot. Same shape as `/sensors`.

**Error (404):**
```json
{ "error": "Snapshot not found: <id>" }
```

#### Capture Snapshot

```http
POST /api/melbourne/snapshots/capture
```

Immediately saves the current sensor state as a new snapshot.

**Response:**
```json
{ "id": "uuid", "capturedAt": "ISO 8601", "sensorCount": 3309 }
```

#### Occupancy Over Time

```http
GET /api/melbourne/reports/occupancy-over-time?hours=24
```

**Query parameters:**
- `hours` (optional, default `24`) — how far back to look

**Response:**
```json
[
  {
    "capturedAt": "ISO 8601",
    "totalSensors": 3309,
    "occupiedCount": 1842,
    "occupancyPercent": 55.7,
    "greenCount": 312,
    "amberCount": 680,
    "redCount": 850
  }
]
```

#### Zone Summary

```http
GET /api/melbourne/reports/zone-summary
```

Aggregated statistics per zone from the most recent snapshot, sorted by occupancy % descending.

**Response:**
```json
[
  {
    "zoneNumber": 6042,
    "totalBays": 12,
    "occupiedBays": 9,
    "occupancyPercent": 75.0,
    "avgDurationMinutes": 18,
    "redCount": 4,
    "amberCount": 3,
    "greenCount": 2
  }
]
```

#### Export Sensors CSV

```http
GET /api/melbourne/reports/sensors/csv
```

Downloads current sensor data as a CSV file.

**Response headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="sensors.csv"
```

**Columns:** `kerbsideId, zoneNumber, lat, lon, status, durationMinutes, lastUpdated`

#### Export History CSV

```http
GET /api/melbourne/reports/history/csv?hours=24
```

Downloads snapshot reading history as a CSV file.

**Query parameters:**
- `hours` (optional, default `24`) — lookback window

**Columns:** `capturedAt, kerbsideId, zoneNumber, lat, lon, status, durationMinutes`

#### Weather

```http
GET /api/melbourne/weather
```

Current and next-day weather for Melbourne CBD from the Bureau of Meteorology.

**Response:**
```json
{
  "current": {
    "temp": 18,
    "description": "Partly cloudy.",
    "icon": "partly-cloudy",
    "rainChance": 10,
    "tempMax": 22,
    "tempMin": 14
  },
  "tomorrow": {
    "description": "Mostly sunny.",
    "tempMax": 25,
    "tempMin": 13,
    "rainChance": 5
  }
}
```

#### News Headlines

```http
GET /api/melbourne/news
```

Up to 12 parking-related news headlines for Melbourne from Google News RSS.

**Response:**
```json
[
  { "title": "Melbourne parking rates rise again", "url": "https://..." }
]
```

#### Car Park Locations

```http
GET /api/melbourne/carparks
```

Wilson, First, and Nationwide parking facilities in Melbourne CBD from OpenStreetMap.

**Response:**
```json
[
  {
    "id": "614507781",
    "name": "Wilson Parking - 200 Queen Street",
    "operator": "Wilson Parking",
    "lat": -37.8134,
    "lon": 144.9602,
    "brand": "wilson",
    "capacity": 320,
    "access": "24/7"
  }
]
```

`brand` is one of `"wilson" | "first" | "nationwide"`.

---

### Parking API (Exercise 2)

#### List Zones

```http
GET /api/parking/zones
```

#### Get Zone with Bays

```http
GET /api/parking/zones/:id
```

#### Book a Bay

```http
POST /api/parking/bays/:id/book
```

**Body:** `{ "driverName": "string", "vehicleReg": "string" }`

#### Release a Bay

```http
POST /api/parking/bays/:id/release
```

#### Search Bays

```http
GET /api/parking/search?q=query
```

---

## Rate Limiting

Currently, no rate limiting is implemented. This should be added before production deployment.

## CORS

CORS is configured to allow requests from the frontend URL specified in the environment variables. In development, this defaults to `http://localhost:5173`.

## Validation

All request validation is performed using `express-validator`. Validation errors return a 400 status code with detailed error information.

## Database

The API uses Prisma ORM with SQLite for development. The database schema can be found in `/backend/prisma/schema.prisma`.