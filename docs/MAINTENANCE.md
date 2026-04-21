# Maintenance & Operations Guide

This document covers the ongoing operation of the Melbourne Parking system — monitoring, data management, external API dependencies, and common troubleshooting.

---

## Background Services

### Melbourne Poller (`melbournePoller.ts`)

Started automatically when the backend server boots. Runs two independent intervals:

| Task | Interval | What it does |
|------|----------|-------------|
| API sync | Every 60 seconds | Fetches live sensor data from City of Melbourne Open Data API and upserts into `MelbourneSensor` table |
| Snapshot capture | Every 5 minutes | Copies current sensor state (with duration minutes) into `MelbourneSnapshot` + `MelbourneSnapshotReading` tables |

On startup, both run immediately (sync first, then snapshot) before their intervals begin.

To check the poller is running correctly, watch the log:

```bash
tail -f logs/backend.log
```

You should see activity every 60 seconds. If the log is silent for more than 2 minutes, restart the backend.

---

## External API Dependencies

The application calls four external services. All are called server-side from the backend.

### 1. City of Melbourne Open Data API

- **Endpoint:** `https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records`
- **Called by:** `fetchAndSync()` in `melbourne.service.ts`
- **Frequency:** Every 60 seconds
- **Authentication:** None required
- **Pagination:** 100 records per page; the service loops until all ~3,309 sensors are fetched
- **Dataset page:** https://data.melbourne.vic.gov.au/explore/dataset/on-street-parking-bay-sensors

**Monitoring:** If the sensor count drops significantly below 3,309, the API may be paginating incorrectly or the upstream dataset changed. Trigger a manual refresh and check:

```bash
curl -X POST http://localhost:5001/api/melbourne/refresh
# Expected: {"synced": 3309}  (or similar count)
```

### 2. Bureau of Meteorology (BOM) Weather API

- **Endpoint:** `https://api.weather.bom.gov.au/v1/locations/r1r0fup/forecasts/daily`
- **Called by:** `getWeather()` in `melbourne.service.ts`
- **Frequency:** On demand (frontend requests every 10 minutes)
- **Authentication:** None required
- **Geohash:** `r1r0fup` = Melbourne CBD 3000

**Monitoring:** If the weather strip disappears from the UI, test the endpoint:

```bash
curl http://localhost:5001/api/melbourne/weather
```

If `temp` is null or `description` is "No data", the BOM API response structure may have changed. Check the `today?.now?.temp_now` and `today?.short_text` fields in `getWeather()`.

### 3. Google News RSS

- **Endpoint:** `https://news.google.com/rss/search?q=parking+melbourne&hl=en-AU&gl=AU&ceid=AU:en`
- **Called by:** `getNewsHeadlines()` in `melbourne.service.ts`
- **Frequency:** On demand (frontend requests every 30 minutes)
- **Authentication:** None required

**Monitoring:** If the news ticker is empty, test:

```bash
curl http://localhost:5001/api/melbourne/news
```

Google occasionally changes its RSS structure. If parsing breaks, review the `<title>` and `<link>` regex patterns in `getNewsHeadlines()`.

### 4. Overpass API (OpenStreetMap)

- **Endpoint:** `https://overpass-api.de/api/interpreter`
- **Called by:** `getCarParks()` in `melbourne.service.ts`
- **Frequency:** On demand (frontend loads once on mount)
- **Authentication:** None required
- **Query:** Parking facilities tagged with Wilson / First / Nationwide operators in Melbourne CBD bounding box

**Monitoring:** If car park pins disappear from the map:

```bash
curl http://localhost:5001/api/melbourne/carparks
```

If empty, Overpass may be rate-limiting or the bounding box query needs adjustment. Overpass has a free-tier rate limit; if the app is under heavy load, consider caching the result for 24 hours.

---

## Database Maintenance

### Storage growth

Snapshot data grows at approximately:

- ~3,309 readings per snapshot × 5 min interval = **~3,309 rows every 5 minutes**
- Per day: ~3,309 × 288 snapshots = **~953,000 rows/day** in `MelbourneSnapshotReading`

Monitor the SQLite file size:

```bash
du -sh backend/prisma/dev.db
```

### Pruning old snapshots

There is no automatic pruning today. To manually delete snapshots older than 7 days:

```bash
# Open Prisma Studio and delete from MelbourneSnapshot
npx prisma studio --schema backend/prisma/schema.prisma

# Or via sqlite3 CLI (cascade deletes readings automatically)
sqlite3 backend/prisma/dev.db \
  "DELETE FROM MelbourneSnapshot WHERE capturedAt < datetime('now', '-7 days');"
```

To add automatic pruning, create a scheduled task in `melbournePoller.ts`:

```typescript
const PRUNE_INTERVAL_MS = 86_400_000; // daily

setInterval(async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.melbourneSnapshot.deleteMany({ where: { capturedAt: { lt: cutoff } } });
}, PRUNE_INTERVAL_MS);
```

### Backup

SQLite is a single file. Back up by copying it:

```bash
cp backend/prisma/dev.db backend/prisma/dev.db.backup-$(date +%Y%m%d)
```

### Rebuilding from scratch

If the database is corrupt or needs to be reset:

```bash
rm backend/prisma/dev.db
npm run db:migrate:dev -w backend
npm run db:seed -w backend
# Then trigger a manual refresh to repopulate Melbourne data:
curl -X POST http://localhost:5001/api/melbourne/refresh
curl -X POST http://localhost:5001/api/melbourne/snapshots/capture
```

---

## Monitoring & Health Checks

### Health endpoint

```bash
curl http://localhost:5001/health
# Expected: 200 {"status":"ok"}
```

### Sensor data freshness

The `lastUpdated` field on each sensor should be within the last 2 minutes if the poller is running:

```bash
curl -s http://localhost:5001/api/melbourne/sensors \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['lastUpdated'] if d else 'no data')"
```

### Snapshot recency

The most recent snapshot should be within the last 5–6 minutes:

```bash
curl -s http://localhost:5001/api/melbourne/snapshots \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['capturedAt'] if d else 'no snapshots')"
```

### Sensor count sanity check

```bash
curl -s http://localhost:5001/api/melbourne/sensors | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} sensors')"
# Expected: ~3309 sensors
```

---

## Configuration Reference

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `BACKEND_PORT` | `backend/.env` | `5001` | HTTP port for Express server |
| `DATABASE_URL` | `backend/.env` | `file:./prisma/dev.db` | Prisma connection string |
| `FRONTEND_URL` | `backend/.env` | `http://localhost:5173` | CORS allowed origin |
| `VITE_API_BASE_URL` | `frontend/.env.development` | `http://localhost:5001/api` | Backend API base URL |
| `POLL_INTERVAL_MS` | `melbournePoller.ts` (hardcoded) | `60000` (1 min) | Sensor sync frequency |
| `SNAPSHOT_INTERVAL_MS` | `melbournePoller.ts` (hardcoded) | `300000` (5 min) | Snapshot capture frequency |
| `BOM_GEOHASH` | `melbourne.service.ts` (hardcoded) | `r1r0fup` | Melbourne CBD location for weather |
| Car park bounding box | `melbourne.service.ts` (hardcoded) | `-37.835,144.940 to -37.800,144.990` | OSM query area for parking facilities |

---

## Runbook: Common Issues

### Sensors not updating on the map

1. Check the browser console for API errors.
2. Check the backend log: `tail -f logs/backend.log`
3. Test the sensor endpoint: `curl http://localhost:5001/api/melbourne/sensors`
4. If empty, trigger a manual refresh: `curl -X POST http://localhost:5001/api/melbourne/refresh`
5. If the refresh call fails, check whether the City of Melbourne API is reachable:
   ```bash
   curl -I "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/records?limit=1"
   ```

### History mode shows no snapshots

Snapshots are captured every 5 minutes starting from when the server first boots. If the server was restarted recently, wait 5 minutes and refresh. If snapshots never appear:

```bash
# Manually capture one
curl -X POST http://localhost:5001/api/melbourne/snapshots/capture

# Verify it was stored
curl http://localhost:5001/api/melbourne/snapshots
```

### Weather strip not showing

```bash
curl http://localhost:5001/api/melbourne/weather
```

- If this returns an error, the BOM API may be temporarily unavailable. The frontend silently hides the strip on failure — this is expected behaviour.
- The strip will reappear on the next 10-minute polling cycle once the API recovers.

### Car park pins not appearing

```bash
curl http://localhost:5001/api/melbourne/carparks
```

- If this returns `[]`, Overpass API returned no matching facilities. This can happen if Overpass is under load or rate-limiting.
- The pins are loaded once on page load; refresh the browser to retry.
- Overpass has no SLA; occasional empty responses are normal.

### Reports show no data

The occupancy over time and zone summary reports depend on snapshots existing in the database. If no snapshots have been captured yet, all charts will be empty. Trigger a snapshot and wait for the 5-minute interval to accumulate data.

### Backend crashes on startup

```bash
cat logs/backend.log | tail -50
```

Common causes:
- `Prisma Client not generated`: run `npx prisma generate --schema backend/prisma/schema.prisma`
- Port already in use: `lsof -ti:5001 | xargs kill -9`
- Missing `.env` file: create `backend/.env` with the minimum config above

---

## GitHub Repositories

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | github.com/MDArrive/my-ai-training | Primary development repo |
| `hackathon` | github.com/dangtran-easypark/Breakout-2-Hackathon | Hackathon submission repo |

Push to both after significant changes:

```bash
git push origin main
git push hackathon main
```
