import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { ArrowLeft, Search, Car } from 'lucide-react';
import { fetchApi } from '../../../utils/apiClient';

// ── Palette derived from Arrive brand colours ──────────────────
// Brand: #56004D (plum) · #FF52A3 (pink)
const C = {
  // Brand primaries
  plum:          '#56004D',
  plumDark:      '#3d0036',
  pink:          '#FF52A3',

  // Light tints (backgrounds, surfaces)
  plumTint:      '#f5eff4',   // very light plum — page / card surface
  plumTint2:     '#ede0eb',   // light plum — occupied bays, lane, dividers
  plumTint3:     '#d9bfd6',   // medium plum tint — borders, tracks
  pinkTint:      '#fff0f7',   // very light pink — available bay bg
  pinkTint2:     '#ffd6ec',   // light pink — hover / available bay hover

  // Text
  textPrimary:   '#2d0029',   // near-black plum — headings (contrast >14:1 on white)
  textBody:      '#5a3d57',   // plum-grey — body text (contrast >7:1 on white)
  textMuted:     '#7a5977',   // muted — labels, hints (contrast >4.6:1 on white)

  // Status (semantic, used for zone cards only)
  statusFreeText:  '#56004D',
  statusFreeBg:    '#fff0f7',
  statusFreeBorder:'#FF52A3',
  statusFillText:  '#7a4200',
  statusFillBg:    '#fff4e5',
  statusFillBorder:'#f59c00',
  statusFullText:  '#8b0000',
  statusFullBg:    '#fde8e8',
  statusFullBorder:'#e53e3e',

  surface:       '#ffffff',
  surfaceAlt:    '#faf7fa',
} as const;

// ── Types ─────────────────────────────────────────────────────
interface ParkingBay {
  id: string;
  bayNumber: number;
  status: 'AVAILABLE' | 'OCCUPIED';
  driverName: string | null;
  vehicleReg: string | null;
  zoneId: string;
}
interface ParkingZone { id: string; name: string; bays: ParkingBay[]; }
interface SearchResult extends ParkingBay { zone: ParkingZone; }

// ── Zone status helper ────────────────────────────────────────
const zoneStatus = (avail: number, total: number) => {
  const ratio = total > 0 ? avail / total : 0;
  if (ratio > 0.5) return { label: 'Good availability', text: C.statusFreeText, bg: C.statusFreeBg, border: C.statusFreeBorder };
  if (ratio > 0.25) return { label: 'Filling up',       text: C.statusFillText, bg: C.statusFillBg, border: C.statusFillBorder };
  return               { label: 'Nearly full',           text: C.statusFullText, bg: C.statusFullBg, border: C.statusFullBorder };
};

// ── Zone overview card ────────────────────────────────────────
const ZoneCard = ({ zone, onClick }: { zone: ParkingZone; onClick: () => void }) => {
  const total = zone.bays.length;
  const avail = zone.bays.filter(b => b.status === 'AVAILABLE').length;
  const s = zoneStatus(avail, total);

  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        borderRadius: 14,
        border: `1px solid ${C.plumTint3}`,
        boxShadow: '0 1px 4px rgba(86,0,77,0.07)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(86,0,77,0.13)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(86,0,77,0.07)';
      }}
    >
      {/* Coloured top strip */}
      <div style={{ height: 4, background: s.border }} />

      <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ color: C.textMuted, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {zone.name}
          </span>
          <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}40`, borderRadius: 20, padding: '2px 10px', fontSize: '0.7rem', fontWeight: 600 }}>
            {s.label}
          </span>
        </div>

        {/* Count */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: C.plum, lineHeight: 1 }}>{avail}</span>
            <span style={{ color: C.textBody, fontSize: '0.95rem' }}>/ {total}</span>
            <span style={{ marginLeft: 4, fontSize: '1.1rem', fontWeight: 700, color: s.text }}>
              {total > 0 ? Math.round((avail / total) * 100) : 0}%
            </span>
          </div>
          <div style={{ color: C.textMuted, fontSize: '0.78rem', marginTop: 2 }}>bays available</div>
        </div>

        {/* Progress */}
        <div style={{ height: 5, borderRadius: 3, background: C.plumTint2 }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${total > 0 ? (avail / total) * 100 : 0}%`, background: s.border, transition: 'width 0.5s ease' }} />
        </div>

        <div style={{ color: C.textMuted, fontSize: '0.72rem', marginTop: '0.75rem' }}>Tap to manage →</div>
      </div>
    </div>
  );
};

// ── Plan-view tree (overhead / architectural drawing style) ───
// rotate offsets the bump ring so each tree looks different
const Tree = ({ size = 52, rotate = 0 }: { size?: number; rotate?: number }) => {
  const cx = 30, cy = 30;
  // 8 perimeter bumps on a ring of radius 17
  const bumps = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI * 2) / 8 + (rotate * Math.PI) / 180;
    return { x: cx + 17 * Math.cos(a), y: cy + 17 * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block' }}>
      {/* Cast shadow — slight south-east offset */}
      <circle cx="33" cy="33" r="22" fill="#145214" opacity="0.14"/>
      {/* Perimeter bump lobes */}
      {bumps.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={9} fill="#388E3C"/>)}
      {/* Central fill to knit lobes together */}
      <circle cx={cx} cy={cy} r={17} fill="#2E7D32"/>
      {/* Top-left highlight (fixed — light comes from NW) */}
      <circle cx="23" cy="23" r="7" fill="#81C784" opacity="0.38"/>
      <circle cx="20" cy="20" r="3" fill="white" opacity="0.14"/>
    </svg>
  );
};

// ── Floorplan ─────────────────────────────────────────────────
const ParkingFloorplan = ({ zone, onBayUpdated }: { zone: ParkingZone; onBayUpdated: () => void }) => {
  const [busyBayId,   setBusyBayId]   = useState<string | null>(null);
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [bookingBay,  setBookingBay]  = useState<ParkingBay | null>(null);
  const [releaseBay,  setReleaseBay]  = useState<ParkingBay | null>(null);
  const [driverName,  setDriverName]  = useState('');
  const [vehicleReg,  setVehicleReg]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleAction = (bay: ParkingBay) => {
    if (busyBayId) return;
    if (bay.status === 'AVAILABLE') { setDriverName(''); setVehicleReg(''); setBookingBay(bay); return; }
    setReleaseBay(bay);
  };

  const handleReleaseConfirm = async () => {
    if (!releaseBay) return;
    setBusyBayId(releaseBay.id); setError(null); setReleaseBay(null);
    try { await fetchApi(`/parking/bays/${releaseBay.id}/release`, { method: 'POST' }); onBayUpdated(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Release failed'); }
    finally { setBusyBayId(null); }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingBay) return;
    setSubmitting(true); setError(null);
    try {
      await fetchApi(`/parking/bays/${bookingBay.id}/book`, { method: 'POST', body: JSON.stringify({ driverName, vehicleReg }) });
      setBookingBay(null); onBayUpdated();
    } catch (err) { setError(err instanceof Error ? err.message : 'Booking failed'); }
    finally { setSubmitting(false); }
  };

  const mid       = Math.ceil(zone.bays.length / 2);
  const topRow    = zone.bays.slice(0, mid);
  const bottomRow = zone.bays.slice(mid);

  const Bay = ({ bay, flip }: { bay: ParkingBay; flip: boolean }) => {
    const avail   = bay.status === 'AVAILABLE';
    const busy    = busyBayId === bay.id;
    const hovered = hoveredId === bay.id;

    const bg     = busy    ? C.plumTint2
                 : avail   ? (hovered ? C.pinkTint2 : C.pinkTint)
                           : (hovered ? '#dfd0dc'   : C.plumTint2);
    const border = avail   ? C.pink : C.plumTint3;

    return (
      <div
        onClick={() => handleAction(bay)}
        onMouseEnter={() => setHoveredId(bay.id)}
        onMouseLeave={() => setHoveredId(null)}
        title={avail ? `Bay ${bay.bayNumber} — click to book` : `${bay.vehicleReg ?? 'Occupied'} · click to release`}
        style={{
          width: 64,
          height: 100,
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: flip ? '10px 10px 0 0' : '0 0 10px 10px',
          cursor: busy ? 'wait' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          transition: 'background 0.12s ease, transform 0.1s ease, box-shadow 0.12s ease',
          transform: hovered && !busy ? 'scaleY(1.04)' : 'scaleY(1)',
          transformOrigin: flip ? 'bottom center' : 'top center',
          userSelect: 'none',
          boxShadow: hovered && avail && !busy ? `0 0 10px ${C.pink}44` : '0 1px 3px rgba(86,0,77,0.08)',
        }}
      >
        {/* Windscreen */}
        <div style={{ width: '55%', height: 2, background: `${C.plum}20`, borderRadius: 1, order: flip ? 2 : 0 }} />

        {/* Bay number */}
        <div style={{ color: C.plum, fontWeight: 700, fontSize: '0.78rem', order: 1, opacity: busy ? 0.4 : 1 }}>
          {busy ? '·' : bay.bayNumber}
        </div>

        {/* Status / reg */}
        {!avail && bay.vehicleReg ? (
          <div style={{ color: C.textBody, fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.04em', order: flip ? 0 : 2, textAlign: 'center', lineHeight: 1.2 }}>
            {bay.vehicleReg}
          </div>
        ) : (
          <div style={{ color: avail ? C.pink : C.textMuted, fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.06em', order: flip ? 0 : 2 }}>
            {avail ? 'FREE' : 'TAKEN'}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">{error}</Alert>}

      {/* Booking modal */}
      <Modal show={!!bookingBay} onHide={() => setBookingBay(null)} centered>
        <Form onSubmit={handleBookingSubmit}>
          <Modal.Header closeButton style={{ borderBottom: `1px solid ${C.plumTint3}`, background: C.plumTint }}>
            <Modal.Title style={{ color: C.plum, fontSize: '1rem', fontWeight: 700 }}>
              <Car size={16} className="me-2" style={{ color: C.pink }} />
              Book Bay {bookingBay?.bayNumber}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: C.surface, paddingTop: '1.5rem' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: C.textBody, fontSize: '0.8rem', fontWeight: 600 }}>Driver Name</Form.Label>
              <Form.Control
                type="text" value={driverName} onChange={e => setDriverName(e.target.value)}
                placeholder="e.g. Jane Smith" required autoFocus
                style={{ border: `1.5px solid ${C.plumTint3}`, borderRadius: 8, color: C.textPrimary }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ color: C.textBody, fontSize: '0.8rem', fontWeight: 600 }}>Vehicle Registration</Form.Label>
              <Form.Control
                type="text" value={vehicleReg} onChange={e => setVehicleReg(e.target.value.toUpperCase())}
                placeholder="e.g. AB12 CDE" required
                style={{ border: `1.5px solid ${C.plumTint3}`, borderRadius: 8, color: C.textPrimary, fontFamily: 'monospace', fontWeight: 700 }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: C.surfaceAlt, borderTop: `1px solid ${C.plumTint3}` }}>
            <button type="button" onClick={() => setBookingBay(null)} disabled={submitting}
              style={{ background: 'transparent', border: `1.5px solid ${C.plumTint3}`, color: C.textBody, borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ background: C.pink, border: 'none', color: C.plum, borderRadius: 8, padding: '7px 22px', cursor: submitting ? 'wait' : 'pointer', fontWeight: 700, fontSize: '0.875rem', boxShadow: `0 3px 10px ${C.pink}44` }}>
              {submitting ? 'Booking…' : 'Confirm'}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Release confirmation modal */}
      <Modal show={!!releaseBay} onHide={() => setReleaseBay(null)} centered>
        <Modal.Header closeButton style={{ borderBottom: `1px solid ${C.plumTint3}`, background: C.plumTint }}>
          <Modal.Title style={{ color: C.plum, fontSize: '1rem', fontWeight: 700 }}>
            <Car size={16} className="me-2" style={{ color: C.pink }} />
            Release Bay {releaseBay?.bayNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: C.surface, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
          <p style={{ color: C.textBody, margin: 0 }}>
            Release bay <strong>{releaseBay?.bayNumber}</strong>
            {releaseBay?.vehicleReg && <> currently occupied by <strong style={{ fontFamily: 'monospace' }}>{releaseBay.vehicleReg}</strong></>}?
            {' '}This will mark it as free.
          </p>
        </Modal.Body>
        <Modal.Footer style={{ background: C.surfaceAlt, borderTop: `1px solid ${C.plumTint3}` }}>
          <button type="button" onClick={() => setReleaseBay(null)}
            style={{ background: 'transparent', border: `1.5px solid ${C.plumTint3}`, color: C.textBody, borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontSize: '0.875rem' }}>
            Cancel
          </button>
          <button type="button" onClick={handleReleaseConfirm}
            style={{ background: C.plum, border: 'none', color: '#fff', borderRadius: 8, padding: '7px 22px', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', boxShadow: `0 3px 10px ${C.plum}44` }}>
            Release Bay
          </button>
        </Modal.Footer>
      </Modal>

      {/* Floorplan */}
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.plumTint3}`, boxShadow: '0 1px 4px rgba(86,0,77,0.07)', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>

        {/* Corner trees — size + rotate varies bump phase so no two look the same */}
        <div style={{ position: 'absolute', top: -14,    left: -10,  pointerEvents: 'none', zIndex: 0, opacity: 0.90 }}><Tree size={54} rotate={15}  /></div>
        <div style={{ position: 'absolute', top: -10,    right: -12, pointerEvents: 'none', zIndex: 0, opacity: 0.82 }}><Tree size={44} rotate={55}  /></div>
        <div style={{ position: 'absolute', bottom: -16, left: -8,   pointerEvents: 'none', zIndex: 0, opacity: 0.86 }}><Tree size={50} rotate={120} /></div>
        <div style={{ position: 'absolute', bottom: -12, right: -10, pointerEvents: 'none', zIndex: 0, opacity: 0.92 }}><Tree size={58} rotate={275} /></div>

        {/* Content above trees */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${C.plumTint2}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, background: C.pinkTint, border: `2px solid ${C.pink}`, borderRadius: 3 }} />
              <span style={{ color: C.textBody, fontSize: '0.75rem', fontWeight: 500 }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, background: C.plumTint2, border: `2px solid ${C.plumTint3}`, borderRadius: 3 }} />
              <span style={{ color: C.textBody, fontSize: '0.75rem', fontWeight: 500 }}>Occupied</span>
            </div>
            <span style={{ marginLeft: 'auto', color: C.textMuted, fontSize: '0.7rem' }}>Click a bay to book or release</span>
          </div>

          {/* Top bays */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {topRow.map(bay => <Bay key={bay.id} bay={bay} flip={false} />)}
          </div>

          {/* Drive lane */}
          <div style={{ height: 40, margin: '5px 0', background: C.plumTint2, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: `2px dashed ${C.pink}66`, transform: 'translateY(-50%)' }} />
            <span style={{ color: C.plum, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
              ▶ Drive Lane
            </span>
          </div>

          {/* Bottom bays */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {bottomRow.map(bay => <Bay key={bay.id} bay={bay} flip={true} />)}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────
const ParkingAvailability = () => {
  const [zones,          setZones]          = useState<ParkingZone[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [isSearching,    setIsSearching]    = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchApi<ParkingZone[]>('/parking/zones');
      setZones(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parking data');
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const iv = setInterval(() => load(false), 5000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await fetchApi<SearchResult[]>(`/parking/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(r || []);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectedZone = zones.find(z => z.id === selectedZoneId) ?? null;
  const totalAvail   = zones.reduce((s, z) => s + z.bays.filter(b => b.status === 'AVAILABLE').length, 0);
  const totalBays    = zones.reduce((s, z) => s + z.bays.length, 0);

  return (
    <React.Fragment>
      <Helmet title="Car Park" />
      <Container fluid className="p-0">

        {/* Page header */}
        <div style={{ marginBottom: '1.75rem' }}>
          {selectedZone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSelectedZoneId(null)}
                style={{ background: C.plumTint, border: `1px solid ${C.plumTint3}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: C.plum, fontSize: '0.85rem', fontWeight: 600 }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: C.textPrimary }}>{selectedZone.name}</h1>
                <span style={{ color: C.textMuted, fontSize: '0.8rem' }}>
                  {selectedZone.bays.filter(b => b.status === 'AVAILABLE').length} of {selectedZone.bays.length} bays available
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: C.textPrimary }}>Car Park</h1>
                {!isLoading && (
                  <span style={{ color: C.textMuted, fontSize: '0.82rem' }}>
                    {totalAvail} of {totalBays} bays available across {zones.length} zones
                  </span>
                )}
              </div>
              {/* Search */}
              <div style={{ position: 'relative', width: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search driver or reg…"
                  style={{ width: '100%', paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, border: `1.5px solid ${C.plumTint3}`, borderRadius: 10, fontSize: '0.85rem', outline: 'none', background: C.surface, color: C.textPrimary }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search results */}
        {searchQuery.trim() && (
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.plumTint3}`, marginBottom: '1.5rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(86,0,77,0.07)' }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.plumTint2}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: C.plum }}>Search results</span>
              {!isSearching && <span style={{ color: C.textMuted, fontSize: '0.78rem' }}>{searchResults.length} found</span>}
            </div>
            {isSearching && <div style={{ padding: '12px 16px', color: C.textMuted, fontSize: '0.85rem' }}>Searching…</div>}
            {!isSearching && searchResults.length === 0 && (
              <div style={{ padding: '12px 16px', color: C.textMuted, fontSize: '0.85rem' }}>No occupied bays match "{searchQuery}".</div>
            )}
            {!isSearching && searchResults.length > 0 && searchResults.map(b => (
              <div key={b.id} onClick={() => { setSelectedZoneId(b.zoneId); setSearchQuery(''); }}
                style={{ padding: '10px 16px', display: 'flex', gap: 24, alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${C.plumTint2}`, fontSize: '0.85rem' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.plumTint}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
              >
                <span style={{ color: C.textMuted, minWidth: 60 }}>{b.zone.name}</span>
                <span style={{ color: C.textBody }}>Bay {b.bayNumber}</span>
                <span style={{ color: C.textPrimary }}>{b.driverName}</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: C.plum, marginLeft: 'auto', background: `${C.pink}18`, border: `1px solid ${C.pink}44`, padding: '2px 8px', borderRadius: 4 }}>{b.vehicleReg}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Spinner animation="border" style={{ color: C.pink }} />
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Zone overview */}
        {!isLoading && !error && !selectedZone && (
          <Row xs={1} md={3} className="g-4">
            {zones.map(zone => (
              <Col key={zone.id}>
                <ZoneCard zone={zone} onClick={() => setSelectedZoneId(zone.id)} />
              </Col>
            ))}
          </Row>
        )}

        {/* Floorplan */}
        {!isLoading && !error && selectedZone && (
          <ParkingFloorplan zone={selectedZone} onBayUpdated={() => load(false)} />
        )}

      </Container>
    </React.Fragment>
  );
};

export default ParkingAvailability;
