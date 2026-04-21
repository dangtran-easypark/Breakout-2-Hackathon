import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Row, Col, Spinner, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchApi } from '../../utils/apiClient';
import PriorityZonePanel, { PriorityZone } from '../../components/melbourne/PriorityZonePanel';

// ── Palette ───────────────────────────────────────────────────
const PURPLE = '#5F016F';
const GREEN  = '#22c55e';
const AMBER  = '#f59e0b';
const RED    = '#ef4444';

// ── Types ─────────────────────────────────────────────────────
interface Sensor {
  id: string;
  kerbsideId: number;
  zoneNumber: number;
  lat: number;
  lon: number;
  status: string;
  occupancySince: string | null;
  lastUpdated: string;
  durationMinutes: number | null;
}

// ── Colour helper ─────────────────────────────────────────────
function sensorColour(sensor: Sensor): string {
  if (sensor.status !== 'Present' || sensor.durationMinutes === null) return GREEN;
  if (sensor.durationMinutes < 30)  return GREEN;
  if (sensor.durationMinutes <= 60) return AMBER;
  return RED;
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return 'Free';
  return `${minutes} min`;
}

// ── Main component ────────────────────────────────────────────
const MelbourneParkingMap: React.FC = () => {
  const [sensors,       setSensors]       = useState<Sensor[]>([]);
  const [priorityZones, setPriorityZones] = useState<PriorityZone[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);

  const loadSensors = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [data, zones] = await Promise.all([
        fetchApi<Sensor[]>('/melbourne/sensors'),
        fetchApi<PriorityZone[]>('/melbourne/priority-zones'),
      ]);
      setSensors(data || []);
      setPriorityZones(zones || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensor data');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  // Initial load + 30-second auto-refresh
  useEffect(() => {
    loadSensors(true);
    const interval = setInterval(() => loadSensors(false), 30_000);
    return () => clearInterval(interval);
  }, [loadSensors]);

  const handleRefreshNow = async () => {
    setRefreshing(true);
    try {
      await fetchApi('/melbourne/refresh', { method: 'POST' });
      await loadSensors(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Stat counts ───────────────────────────────────────────
  const total    = sensors.length;
  const occupied = sensors.filter(s => s.status === 'Present').length;
  const green    = sensors.filter(s => sensorColour(s) === GREEN).length;
  const amber    = sensors.filter(s => sensorColour(s) === AMBER).length;
  const red      = sensors.filter(s => sensorColour(s) === RED).length;

  return (
    <React.Fragment>
      <Helmet title="Melbourne Parking" />

      {/* ── Stat bar ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e8e0ea',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: PURPLE, marginRight: 8 }}>
          Melbourne Parking
        </span>
        <div style={{ width: 1, height: 20, background: '#ddd' }} />
        <StatPill label="Total"    value={total}    bg="#f3f4f6" color="#374151" />
        <StatPill label="Occupied" value={occupied} bg="#fef3c7" color="#92400e" />
        <StatPill label="Green"    value={green}    bg="#dcfce7" color="#15803d" dot={GREEN} />
        <StatPill label="Amber"    value={amber}    bg="#fef9c3" color="#854d0e" dot={AMBER} />
        <StatPill label="Red"      value={red}      bg="#fee2e2" color="#991b1b" dot={RED} />
        <div style={{ flex: 1 }} />
        <Button
          size="sm"
          disabled={refreshing}
          onClick={handleRefreshNow}
          style={{ background: PURPLE, border: 'none', fontWeight: 600, fontSize: '0.78rem', padding: '5px 14px', borderRadius: 6 }}
        >
          {refreshing ? (
            <><Spinner animation="border" size="sm" className="me-1" />Refreshing…</>
          ) : (
            'Refresh Now'
          )}
        </Button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 20px', fontSize: '0.82rem', borderBottom: '1px solid #fca5a5' }}>
          {error}
        </div>
      )}

      {/* ── Two-column layout: map (9) + priority panel (3) ── */}
      <Row className="g-0" style={{ height: 'calc(100vh - 60px)' }}>

        {/* Left col — map */}
        <Col md={9} style={{ position: 'relative', height: '100%' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#f9fafb' }}>
              <Spinner animation="border" style={{ color: PURPLE, width: 40, height: 40 }} />
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading Melbourne sensors…</span>
            </div>
          ) : (
            <MapContainer
              center={[-37.8136, 144.9631]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {sensors.map(sensor => (
                <CircleMarker
                  key={sensor.id}
                  center={[sensor.lat, sensor.lon]}
                  radius={6}
                  pathOptions={{
                    color: sensorColour(sensor),
                    fillColor: sensorColour(sensor),
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div style={{ fontSize: '0.82rem', minWidth: 130 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: PURPLE }}>
                        Zone {sensor.zoneNumber}
                      </div>
                      <div style={{ color: '#374151', marginBottom: 2 }}>
                        <span style={{ color: '#6b7280' }}>Status: </span>
                        {sensor.status === 'Present' ? 'Occupied' : 'Free'}
                      </div>
                      <div style={{ color: '#374151' }}>
                        <span style={{ color: '#6b7280' }}>Duration: </span>
                        {formatDuration(sensor.durationMinutes)}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}

          {/* Last updated overlay — top-right of map */}
          {!loading && lastUpdated && (
            <div
              style={{
                position: 'absolute', top: 10, right: 10, zIndex: 1000,
                background: 'rgba(255,255,255,0.92)', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem',
                color: '#6b7280', backdropFilter: 'blur(4px)', pointerEvents: 'none',
              }}
            >
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Legend overlay — bottom-left of map */}
          {!loading && (
            <div
              style={{
                position: 'absolute', bottom: 28, left: 10, zIndex: 1000,
                background: 'rgba(255,255,255,0.92)', border: '1px solid #e5e7eb',
                borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem',
                backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              <LegendRow color={GREEN} label="Free / &lt; 30 min" />
              <LegendRow color={AMBER} label="30 – 60 min" />
              <LegendRow color={RED}   label="> 60 min" />
            </div>
          )}
        </Col>

        {/* Right col — priority panel (scrollable) */}
        <Col
          md={3}
          style={{
            height: 'calc(100vh - 60px)',
            overflowY: 'auto',
            borderLeft: '1px solid #e8e0ea',
            padding: '12px',
            background: '#faf7fa',
          }}
        >
          <PriorityZonePanel zones={priorityZones} loading={loading} />
        </Col>

      </Row>
    </React.Fragment>
  );
};

// ── Small helpers ─────────────────────────────────────────────
const StatPill = ({
  label,
  value,
  bg,
  color,
  dot,
}: {
  label: string;
  value: number;
  bg: string;
  color: string;
  dot?: string;
}) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: bg, borderRadius: 20, padding: '3px 10px',
      fontSize: '0.75rem', color, fontWeight: 600,
    }}
  >
    {dot && (
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
    )}
    {label}: {value}
  </div>
);

const LegendRow = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <span style={{ color: '#374151' }} dangerouslySetInnerHTML={{ __html: label }} />
  </div>
);

export default MelbourneParkingMap;
