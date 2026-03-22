import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SITES } from '../../data/circuitPlans';

const SITE_MAP = Object.fromEntries(SITES.map(s => [s.id, s]));

const PNW_CENTER = [46.8, -120.5];
const PNW_ZOOM   = 6;

function pathToLatLngs(pathIds) {
  return pathIds.map(id => {
    const s = SITE_MAP[id];
    return s ? [s.lat, s.lng] : null;
  }).filter(Boolean);
}

function ComparisonTable({ working, protection }) {
  const rows = [
    { label: 'Route',       wk: working.label,               pt: protection.label              },
    { label: 'Latency',     wk: `${working.latencyMs} ms`,   pt: `${protection.latencyMs} ms`  },
    { label: 'Hops',        wk: working.hops,                pt: protection.hops               },
    { label: 'SRLG Shared', wk: `${working.srlgShared} ✅`,  pt: `${protection.srlgShared} ✅` },
    { label: 'FRR Time',    wk: `< ${working.frrMs} ms`,     pt: `< ${protection.frrMs} ms`    },
    { label: 'Status',      wk: working.status,              pt: protection.status             },
  ];

  const cell = (val, isHeader) => ({
    padding: '5px 10px', fontSize: isHeader ? 11 : 12,
    color: isHeader ? '#64748b' : 'var(--text-primary)',
    borderBottom: '1px solid #1e2a3a', textAlign: 'center',
    fontWeight: isHeader ? 600 : 400,
  });

  return (
    <div style={{ flexShrink: 0, padding: '0 12px 12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...cell(null, true), textAlign: 'left' }}></th>
            <th style={{ ...cell(null, true), color: '#3b82f6' }}>🔵 Working Path</th>
            <th style={{ ...cell(null, true), color: '#f97316' }}>🟠 Protection Path</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <td style={{ ...cell(null, false), textAlign: 'left', color: '#64748b', fontSize: 11 }}>{r.label}</td>
              <td style={cell(null, false)}>{r.wk}</td>
              <td style={cell(null, false)}>{r.pt}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        marginTop: 8, padding: '6px 10px', borderRadius: 6,
        background: '#052e16', border: '1px solid #166534',
        fontSize: 11, color: '#22c55e', textAlign: 'center', fontWeight: 600,
      }}>
        ✅ SRLG Diverse — Paths share 0 common fiber groups — auto-switchover &lt; 50 ms
      </div>
    </div>
  );
}

export default function PathMap({ paths, aId, zId }) {
  if (!paths || !aId || !zId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-accent)', fontSize: 14 }}>
        Run a simulation to view A-Z path map
      </div>
    );
  }

  const wkLatLngs = pathToLatLngs(paths.working.path);
  const ptLatLngs = pathToLatLngs(paths.protection.path);

  // Unique sites across both paths for markers
  const allSiteIds = [...new Set([...paths.working.path, ...paths.protection.path])];

  // Map bounds center — average of A/Z sites
  const aSite = SITE_MAP[aId];
  const zSite = SITE_MAP[zId];
  const centerLat = aSite && zSite ? (aSite.lat + zSite.lat) / 2 : PNW_CENTER[0];
  const centerLng = aSite && zSite ? (aSite.lng + zSite.lng) / 2 : PNW_CENTER[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', gap: 12, padding: '10px 14px',
        borderBottom: '1px solid #1e2a3a', background: 'var(--bg-primary)', flexShrink: 0, alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>🗺️ A→Z Path Map</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11 }}>
          <span style={{ color: '#3b82f6' }}>━━ Working</span>
          <span style={{ color: '#f97316' }}>╌╌ Protection</span>
        </div>
      </div>

      {/* Leaflet map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={PNW_ZOOM}
          style={{ height: '100%', width: '100%', background: '#0a1628' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution=""
          />

          {/* Working path — solid blue */}
          <Polyline positions={wkLatLngs} color="#3b82f6" weight={3} opacity={0.9} />

          {/* Protection path — dashed orange */}
          <Polyline positions={ptLatLngs} color="#f97316" weight={2.5} opacity={0.8} dashArray="8 5" />

          {/* Site markers */}
          {allSiteIds.map(id => {
            const site = SITE_MAP[id];
            if (!site) return null;
            const isEndpoint = id === aId || id === zId;
            return (
              <CircleMarker
                key={id}
                center={[site.lat, site.lng]}
                radius={isEndpoint ? 9 : 6}
                fillColor={isEndpoint ? '#38bdf8' : '#64748b'}
                color="var(--bg-secondary)"
                weight={2}
                fillOpacity={0.9}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    {isEndpoint ? (id === aId ? 'A: ' : 'Z: ') : ''}
                    {site.label.split(' ')[0]}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Comparison table */}
      <ComparisonTable working={paths.working} protection={paths.protection} />
    </div>
  );
}
