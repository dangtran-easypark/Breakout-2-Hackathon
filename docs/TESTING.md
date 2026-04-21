# Testing Guide

This document covers running existing tests, writing new ones, and manually verifying the Melbourne parking system end-to-end.

---

## Quick Reference

```bash
# Run all tests
npm run test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# With coverage
npm run test:coverage
```

---

## Backend Tests

Tests live in `backend/tests/` and use **Jest** + **Supertest**.

### Running

```bash
# All backend tests (from project root)
npm run test:backend

# Or directly from backend/
cd backend
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report (outputs to backend/coverage/)
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Test structure

```
backend/tests/
├── setup.ts                          # Global test setup (db, env)
├── test-utils/                       # Shared test helpers
├── unit/
│   └── services/
│       ├── exampleTask.service.test.ts
│       └── analytics.service.test.ts
└── integration/
    └── routes/
        ├── exampleTasks.integration.test.ts
        └── analytics.integration.test.ts
```

Integration tests use a **separate SQLite database** (`backend/test.db`) defined in `backend/.env.test`:

```dotenv
DATABASE_URL="file:./test.db"
PORT=5001
```

### Coverage thresholds

The project enforces 80% coverage on branches, functions, lines, and statements. A build will fail if coverage drops below this.

```bash
npm run test:coverage -w backend
# Output: backend/coverage/lcov-report/index.html
```

### Writing a backend unit test

```typescript
// backend/tests/unit/services/melbourne.service.test.ts
import { getOccupancyOverTime } from '../../../src/services/melbourne.service';
import * as MelbourneRepository from '../../../src/repositories/melbourne.repository';

jest.mock('../../../src/repositories/melbourne.repository');

describe('getOccupancyOverTime', () => {
  it('returns empty array when no snapshots exist', async () => {
    (MelbourneRepository.findSnapshotsWithReadingsSince as jest.Mock).mockResolvedValue([]);
    const result = await getOccupancyOverTime(24);
    expect(result).toEqual([]);
  });
});
```

### Writing a backend integration test

```typescript
// backend/tests/integration/routes/melbourne.integration.test.ts
import request from 'supertest';
import app from '../../../src/app';

describe('GET /api/melbourne/sensors', () => {
  it('returns an array', async () => {
    const res = await request(app).get('/api/melbourne/sensors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

---

## Frontend Tests

Tests use **Jest** + **React Testing Library** and run in a `jsdom` environment.

### Running

```bash
# All frontend tests (from project root)
npm run test:frontend

# Or directly from frontend/
cd frontend
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test locations

```
frontend/src/
├── setupTests.ts                     # Global setup
├── utils/__tests__/
│   └── apiClient.test.ts
└── pages/exercises/tasks/__tests__/
    └── ExerciseTaskList.test.tsx
```

### Writing a frontend component test

```typescript
// frontend/src/pages/app/__tests__/MelbourneParkingMap.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MelbourneParkingMap from '../MelbourneParkingMap';

// Mock fetchApi
jest.mock('../../../utils/apiClient', () => ({
  fetchApi: jest.fn().mockResolvedValue([]),
}));

// Mock react-leaflet (no DOM canvas in jsdom)
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div>{children}</div>,
  TileLayer: () => null,
  CircleMarker: () => null,
  Marker: () => null,
  Popup: ({ children }: any) => <div>{children}</div>,
}));

it('renders the Melbourne Parking heading', async () => {
  render(<MemoryRouter><MelbourneParkingMap /></MemoryRouter>);
  expect(screen.getByText(/Melbourne Parking/i)).toBeInTheDocument();
});
```

---

## Manual Testing — API Scripts

The backend must be running (`npm run dev`) before executing these. The base URL is `http://localhost:5001/api`.

### Health check

```bash
curl http://localhost:5001/health
# Expected: 200 OK  {"status":"ok"}
```

### Melbourne parking sensors

```bash
# Get all sensors (may return 3000+ records)
curl http://localhost:5001/api/melbourne/sensors | head -c 500

# Trigger a full sync from the City of Melbourne API
curl -X POST http://localhost:5001/api/melbourne/refresh
# Expected: {"synced": 3309}

# Get priority zones (sorted by occupancy score)
curl http://localhost:5001/api/melbourne/priority-zones | head -c 500
```

### Snapshots

```bash
# List all stored snapshots
curl http://localhost:5001/api/melbourne/snapshots

# Manually capture a snapshot now
curl -X POST http://localhost:5001/api/melbourne/snapshots/capture
# Expected: {"id":"...","capturedAt":"...","sensorCount":3309}

# Read sensors from a specific snapshot (replace SNAPSHOT_ID)
SNAPSHOT_ID=$(curl -s http://localhost:5001/api/melbourne/snapshots | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])")
curl "http://localhost:5001/api/melbourne/snapshots/$SNAPSHOT_ID/sensors" | head -c 500
```

### Reports

```bash
# Occupancy over time (last 24 hours, default)
curl "http://localhost:5001/api/melbourne/reports/occupancy-over-time"

# Occupancy over last 6 hours
curl "http://localhost:5001/api/melbourne/reports/occupancy-over-time?hours=6"

# Zone summary (uses most recent snapshot)
curl http://localhost:5001/api/melbourne/reports/zone-summary | head -c 500

# Download current sensors as CSV
curl http://localhost:5001/api/melbourne/reports/sensors/csv -o sensors.csv
wc -l sensors.csv  # Should be ~3310 (header + 3309 sensors)

# Download history as CSV (last 24 hours)
curl "http://localhost:5001/api/melbourne/reports/history/csv?hours=24" -o history.csv
```

### External data endpoints

```bash
# Weather (BOM Melbourne CBD)
curl http://localhost:5001/api/melbourne/weather
# Expected: {"current":{"temp":...,"description":"..."},"tomorrow":{...}}

# News headlines (Google News RSS for Melbourne parking)
curl http://localhost:5001/api/melbourne/news
# Expected: [{"title":"...","url":"..."}]

# Parking facility pins (Overpass/OpenStreetMap)
curl http://localhost:5001/api/melbourne/carparks
# Expected: [{"id":"...","name":"...","brand":"wilson|first|nationwide",...}]
```

### Tasks (Exercise 1)

```bash
# List all tasks
curl http://localhost:5001/api/exercises/tasks

# Create a task
curl -X POST http://localhost:5001/api/exercises/tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"Test task","priority":"HIGH","status":"UPCOMING"}'

# Update a task (replace TASK_ID)
curl -X PUT http://localhost:5001/api/exercises/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}'

# Delete a task
curl -X DELETE http://localhost:5001/api/exercises/tasks/TASK_ID
```

### Parking zones (Exercise 2)

```bash
# List all zones
curl http://localhost:5001/api/parking/zones

# Get a specific zone with its bays
curl http://localhost:5001/api/parking/zones/ZONE_ID

# Book a bay
curl -X POST http://localhost:5001/api/parking/bays/BAY_ID/book \
  -H "Content-Type: application/json" \
  -d '{"driverName":"Test Driver","vehicleReg":"ABC123"}'

# Release a bay
curl -X POST http://localhost:5001/api/parking/bays/BAY_ID/release
```

---

## Automated Test Script

Save this as `scripts/test-endpoints.sh` and run with `bash scripts/test-endpoints.sh`:

```bash
#!/bin/bash
set -e
BASE="http://localhost:5001/api"
PASS=0; FAIL=0

check() {
  local label="$1" url="$2" method="${3:-GET}" data="$4"
  if [ -n "$data" ]; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
  else
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url")
  fi
  if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 300 ]; then
    echo "  PASS  $label ($CODE)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $label ($CODE)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Backend endpoint smoke tests ==="
check "Health"                    "$BASE/../health"
check "Sensors"                   "$BASE/melbourne/sensors"
check "Priority zones"            "$BASE/melbourne/priority-zones"
check "Snapshots list"            "$BASE/melbourne/snapshots"
check "Capture snapshot"          "$BASE/melbourne/snapshots/capture"    POST
check "Occupancy over time"       "$BASE/melbourne/reports/occupancy-over-time"
check "Zone summary"              "$BASE/melbourne/reports/zone-summary"
check "Sensors CSV"               "$BASE/melbourne/reports/sensors/csv"
check "Weather"                   "$BASE/melbourne/weather"
check "News"                      "$BASE/melbourne/news"
check "Car parks"                 "$BASE/melbourne/carparks"
check "Tasks list"                "$BASE/exercises/tasks"
check "Create task"               "$BASE/exercises/tasks"               POST '{"name":"Smoke test","priority":"LOW","status":"UPCOMING"}'
check "Analytics monthly"         "$BASE/analytics/monthly"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
```

---

## What is NOT yet tested

These areas have no automated tests and are candidates for future coverage:

| Area | Why it matters |
|------|---------------|
| Melbourne service functions | Core business logic (occupancy scoring, duration calculation) |
| `melbournePoller.ts` | Background service; failures are silent |
| BOM weather fetch | External dependency; should be mocked in tests |
| Overpass car parks fetch | External dependency; should be mocked |
| `MelbourneParkingMap` component | Primary user interface |
| `MelbourneReporting` component | Charts and CSV downloads |
| `PriorityZonePanel` component | Resizable panel and zone rendering |
