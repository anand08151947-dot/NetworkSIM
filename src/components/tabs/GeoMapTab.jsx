import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup, useMapEvents, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GEO_NODES, FIBER_ROUTES, PNW_CENTER, PNW_ZOOM, PNW_BOUNDS, REGIONS } from '../../data/geoData';

const CAP_COLOR = (cap) => cap >= 80 ? '#ef4444' : cap >= 40 ? '#f59e0b' : '#22c55e';
const CAP_LABEL = (cap) => cap >= 80 ? 'Critical' : cap >= 40 ? 'Warning' : 'Healthy';

// Route weight: thicker = higher utilization
const routeWeight = (util, type) => {
  const base = type === 'backbone' ? 4 : type === 'metro' ? 2.5 : 1.5;
  return base + (util / 100) * 3;
};

// Node radius: proportional to subscriber count at city zoom
const subRadius = (subs, zoom) => {
  if (zoom < 9) return 0;
  const base = Math.max(6, Math.min(20, Math.sqrt(subs || 1) * 0.4));
  return base;
};

const coordMap = Object.fromEntries(GEO_NODES.map(n => [n.id, [n.lat, n.lng]]));

// Zoom tracker component
function ZoomWatcher({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => { onZoom(map.getZoom()); }, []);
  return null;
}

function NodeDetailCard({ node, onClose }) {
  if (!node) return null;
  const cap = node.capacity;
  const capColor = CAP_COLOR(cap);
  const utilPct = node.subscribers && node.maxSubscribers
    ? Math.round((node.subscribers / node.maxSubscribers) * 100)
    : null;

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
      background: '#0f172a', border: `1px solid ${capColor}55`,
      borderLeft: `3px solid ${capColor}`,
      borderRadius: 10, padding: '14px 16px', width: 280,
      boxShadow: `0 0 20px ${capColor}22`,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{node.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>{node.label}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{node.address}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
      </div>

      {/* Capacity bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 9, color: '#64748b' }}>CAPACITY</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: capColor }}>{cap}% — {CAP_LABEL(cap)}</span>
        </div>
        <div style={{ background: '#1e293b', borderRadius: 3, height: 5 }}>
          <div style={{ width: `${cap}%`, height: '100%', background: capColor, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Subscriber bar (COs only) */}
      {utilPct !== null && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: '#64748b' }}>SUBSCRIBERS</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa' }}>{node.subscribers?.toLocaleString()} / {node.maxSubscribers?.toLocaleString()} ({utilPct}%)</span>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 3, height: 5 }}>
            <div style={{ width: `${utilPct}%`, height: '100%', background: '#60a5fa', borderRadius: 3 }} />
          </div>
        </div>
      )}

      {/* Quick stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
        {[
          node.ontsActive !== undefined && { k: 'Active ONTs', v: `${node.ontsActive} / ${node.ontsTotal}` },
          node.oltPorts && { k: 'OLT Ports Free', v: node.oltPorts },
          node.avgSignal && { k: 'Avg Signal', v: node.avgSignal },
          node.peers && { k: 'BGP Peers', v: node.peers },
          node.inboundGbps && { k: 'Inbound', v: `${node.inboundGbps} Gbps` },
          node.outboundGbps && { k: 'Outbound', v: `${node.outboundGbps} Gbps` },
          { k: 'Fiber In', v: node.fiberIn },
          { k: 'Power', v: node.power },
        ].filter(Boolean).map(({ k, v }) => (
          <div key={k} style={{ background: '#020817', borderRadius: 5, padding: '5px 7px' }}>
            <div style={{ fontSize: 8, color: '#475569' }}>{k}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Equipment list */}
      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: 0.5, marginBottom: 4 }}>EQUIPMENT</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {node.equipment?.map(eq => (
          <div key={eq} style={{ fontSize: 9, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155', flexShrink: 0 }} />
            {eq}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeoMapTab({ nodes: topoNodes }) {
  const [zoom, setZoom] = useState(PNW_ZOOM);
  const [selectedNode, setSelectedNode] = useState(null);

  // Enrich geo nodes with live capacity from topology
  const enrichedGeoNodes = GEO_NODES.map(g => {
    const capOverrides = {
      geo_seattle_co1:   topoNodes.find(n => n.id === 'olt_1')?.data.capacity,
      geo_bellevue_co:   topoNodes.find(n => n.id === 'olt_2')?.data.capacity,
      geo_seattle_core:  topoNodes.find(n => n.id === 'core_router_1')?.data.capacity,
      geo_spokane_core:  topoNodes.find(n => n.id === 'core_router_2')?.data.capacity,
      geo_seattle_ixp:   topoNodes.find(n => n.id === 'ixp')?.data.capacity,
    };
    return { ...g, capacity: capOverrides[g.id] ?? g.capacity };
  });

  // Enrich routes with live utilization
  const enrichedRoutes = FIBER_ROUTES.map(r => ({
    ...r,
    utilization: r.from === 'geo_seattle_core' || r.to === 'geo_seattle_core'
      ? (topoNodes.find(n => n.id === 'metro_cisco')?.data.capacity ?? r.utilization)
      : r.utilization,
  }));

  // Regional summary
  const regionSummary = REGIONS.map(reg => {
    const coNodes = enrichedGeoNodes.filter(n => n.type === 'co' && n.region === reg.label);
    const totalSubs = coNodes.reduce((s, n) => s + (n.subscribers || 0), 0);
    const maxSubs   = coNodes.reduce((s, n) => s + (n.maxSubscribers || 0), 0);
    const avgCap    = coNodes.length ? Math.round(coNodes.reduce((s, n) => s + n.capacity, 0) / coNodes.length) : 0;
    return { ...reg, totalSubs, maxSubs, avgCap, coCount: coNodes.length };
  }).filter(r => r.coCount > 0);

  // Total network
  const totalSubs = enrichedGeoNodes.reduce((s, n) => s + (n.subscribers || 0), 0);
  const maxSubs   = enrichedGeoNodes.reduce((s, n) => s + (n.maxSubscribers || 0), 0);

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#020817', position: 'relative' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .leaflet-popup-content-wrapper { background: #0f172a !important; border: 1px solid #1e293b !important; border-radius: 8px !important; color: #e2e8f0 !important; }
        .leaflet-popup-tip { background: #0f172a !important; }
        .leaflet-popup-content { margin: 10px 12px !important; }
        .leaflet-tooltip { background: #0f172a !important; border: 1px solid #1e293b !important; color: #e2e8f0 !important; font-size: 11px; padding: 5px 8px; }
        .leaflet-tooltip-arrow { display: none; }
      `}</style>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={PNW_CENTER} zoom={PNW_ZOOM} bounds={PNW_BOUNDS}
          style={{ height: '100%', width: '100%', background: '#020817' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            maxZoom={18}
          />
          <ZoomWatcher onZoom={setZoom} />

          {/* ── Fiber routes ── */}
          {enrichedRoutes.map(route => {
            const from = coordMap[route.from];
            const to = coordMap[route.to];
            if (!from || !to) return null;
            const color = CAP_COLOR(route.utilization);
            const weight = routeWeight(route.utilization, route.type);
            return (
              <Polyline key={route.id} positions={[from, to]}
                pathOptions={{ color, weight, opacity: 0.85, dashArray: route.type === 'peering' ? '8 4' : '' }}
              >
                <Tooltip sticky>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{route.label}</div>
                  <div>Capacity: <b>{route.capacity}G</b> ({route.wavelengths} λ)</div>
                  <div>Utilization: <b style={{ color }}>{route.utilization}%</b> ({Math.round(route.capacity * route.utilization / 100)}G used)</div>
                  <div>Type: {route.type}</div>
                </Tooltip>
              </Polyline>
            );
          })}

          {/* ── Network nodes ── */}
          {enrichedGeoNodes.map(node => {
            const color = CAP_COLOR(node.capacity);
            // At low zoom: only show core/ixp nodes prominently
            const show = zoom < 9 ? node.type === 'core' || node.type === 'ixp' : true;
            if (!show) return null;

            // Node size: bigger at higher zoom; subscriber-proportional for COs
            const baseR = node.type === 'core' ? 13 : node.type === 'ixp' ? 10 : 7;
            const subR  = zoom >= 9 && node.subscribers > 0
              ? Math.max(8, Math.min(22, Math.sqrt(node.subscribers) * 0.5))
              : baseR;
            const radius = zoom >= 9 ? subR : baseR;

            return (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor: node.color,
                  fillOpacity: 0.85,
                  weight: selectedNode?.id === node.id ? 3 : 2,
                }}
                eventHandlers={{ click: () => setSelectedNode(node) }}
              >
                {/* Permanent label for cores at all zooms, COs at zoom ≥ 9 */}
                <Tooltip
                  permanent={node.type === 'core' || zoom >= 9}
                  direction="top"
                  offset={[0, -radius - 2]}
                >
                  <span style={{ fontWeight: 700 }}>{node.icon} {node.label}</span>
                  {zoom >= 9 && node.subscribers > 0 && (
                    <span style={{ color: '#94a3b8' }}> · {node.subscribers.toLocaleString()} subs</span>
                  )}
                  {zoom >= 11 && (
                    <div style={{ color }}>Cap: {node.capacity}% · {node.sublabel}</div>
                  )}
                </Tooltip>

                {/* Click popup — detailed */}
                <Popup maxWidth={280}>
                  <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{node.icon} {node.label}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>{node.sublabel}</div>
                    {node.subscribers > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>
                          Subscribers: <b style={{ color: '#60a5fa' }}>{node.subscribers.toLocaleString()}</b> / {node.maxSubscribers.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 10, marginBottom: 2 }}>
                          Active ONTs: <b>{node.ontsActive}</b> / {node.ontsTotal} · Avg signal: <b>{node.avgSignal}</b>
                        </div>
                        <div style={{ fontSize: 10 }}>OLT ports free: <b>{node.oltPorts}</b></div>
                      </div>
                    )}
                    {node.peers && <div style={{ fontSize: 10, marginBottom: 4 }}>BGP Peers: <b>{node.peers}</b> · In: <b>{node.inboundGbps}G</b> · Out: <b>{node.outboundGbps}G</b></div>}
                    <div style={{ fontSize: 10, marginBottom: 6 }}>Capacity: <b style={{ color }}>{node.capacity}%</b> — {CAP_LABEL(node.capacity)}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
                      <b>Equipment:</b> {node.equipment?.join(', ')}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{node.address}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* ── Bandwidth labels on routes at zoom ≥ 9 ── */}
          {zoom >= 9 && enrichedRoutes.map(route => {
            const from = coordMap[route.from];
            const to = coordMap[route.to];
            if (!from || !to) return null;
            const midLat = (from[0] + to[0]) / 2;
            const midLng = (from[1] + to[1]) / 2;
            const color = CAP_COLOR(route.utilization);
            return (
              <CircleMarker
                key={`label-${route.id}`}
                center={[midLat, midLng]}
                radius={0}
                pathOptions={{ opacity: 0, fillOpacity: 0 }}
              >
                <Tooltip permanent direction="center" offset={[0, 0]}>
                  <span style={{ fontSize: 9, fontWeight: 700, color }}>
                    {route.capacity}G · {route.utilization}%
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Map legend */}
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1000,
          background: '#0f172aee', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px',
          minWidth: 160,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: 1 }}>CAPACITY STATUS</div>
          {[
            { color: '#22c55e', label: '< 40% — Healthy' },
            { color: '#f59e0b', label: '40–79% — Warning' },
            { color: '#ef4444', label: '≥ 80% — Critical' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 4, background: l.color, borderRadius: 2 }} />
              <span style={{ fontSize: 9, color: '#cbd5e1' }}>{l.label}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1e293b', marginTop: 6, paddingTop: 6 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', marginBottom: 4, letterSpacing: 1 }}>ROUTE TYPES</div>
            {[
              { label: '━━ Backbone (400G) — thicker = busier', color: '#6366f1' },
              { label: '━━ Metro (100G)', color: '#0ea5e9' },
              { label: '╌╌ Peering', color: '#22c55e' },
            ].map(l => (
              <div key={l.label} style={{ fontSize: 9, color: l.color, marginBottom: 2 }}>{l.label}</div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', marginTop: 6, paddingTop: 5 }}>
            <div style={{ fontSize: 9, color: '#475569' }}>
              Zoom {zoom < 9 ? '<9: core POPs only' : zoom < 11 ? '9–11: all COs + subs' : '≥11: full detail'}
            </div>
          </div>
        </div>

        {/* Zoom hint */}
        {zoom < 9 && (
          <div style={{
            position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: '#0f172aee', border: '1px solid #1e293b',
            borderRadius: 6, padding: '5px 12px', fontSize: 10, color: '#64748b',
            pointerEvents: 'none',
          }}>
            🔍 Zoom in to see Central Offices, subscriber counts and equipment detail
          </div>
        )}

        {/* Node detail card (click) */}
        <NodeDetailCard node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>

      {/* Right panel — regional stats */}
      <div style={{
        width: 250, background: '#070d1a', borderLeft: '1px solid #1e293b',
        padding: '10px 8px', overflowY: 'auto', flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Network totals */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: 1, marginBottom: 8 }}>NETWORK TOTALS</div>
          {[
            { label: 'Total Subscribers', value: totalSubs.toLocaleString(), color: '#60a5fa' },
            { label: 'Max Capacity', value: maxSubs.toLocaleString(), color: '#64748b' },
            { label: 'Fill Rate', value: `${Math.round(totalSubs / maxSubs * 100)}%`, color: CAP_COLOR(Math.round(totalSubs / maxSubs * 100)) },
            { label: 'Active COs', value: enrichedGeoNodes.filter(n => n.type === 'co').length, color: '#06b6d4' },
            { label: 'Core POPs', value: enrichedGeoNodes.filter(n => n.type === 'core').length, color: '#6366f1' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#64748b' }}>{s.label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Regional breakdown */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '0 2px' }}>REGIONAL BREAKDOWN</div>
        {regionSummary.map(reg => {
          const fillPct = reg.maxSubs ? Math.round(reg.totalSubs / reg.maxSubs * 100) : 0;
          const capColor = CAP_COLOR(reg.avgCap);
          return (
            <div key={reg.id} style={{ background: '#0f172a', border: `1px solid ${reg.color}33`, borderLeft: `3px solid ${reg.color}`, borderRadius: 6, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: reg.color, marginBottom: 4 }}>{reg.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#64748b' }}>Subscribers</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa' }}>{reg.totalSubs.toLocaleString()}</span>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 3, height: 4, marginBottom: 4 }}>
                <div style={{ width: `${fillPct}%`, height: '100%', background: '#60a5fa', borderRadius: 3 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: '#64748b' }}>Avg capacity</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: capColor }}>{reg.avgCap}%</span>
              </div>
              <div style={{ fontSize: 9, color: '#334155', marginTop: 2 }}>{reg.coCount} CO{reg.coCount > 1 ? 's' : ''}</div>
            </div>
          );
        })}

        {/* Route utilization table */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>FIBER ROUTES</div>
          {enrichedRoutes.map(r => {
            const color = CAP_COLOR(r.utilization);
            const gbpsUsed = Math.round(r.capacity * r.utilization / 100);
            return (
              <div key={r.id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color, marginLeft: 4, flexShrink: 0 }}>{r.utilization}%</span>
                </div>
                <div style={{ background: '#1e293b', borderRadius: 2, height: 3 }}>
                  <div style={{ width: `${r.utilization}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 8, color: '#334155', marginTop: 1 }}>{gbpsUsed}G / {r.capacity}G · {r.wavelengths}λ</div>
              </div>
            );
          })}
        </div>

        {/* CO quick list */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, padding: '0 2px' }}>CENTRAL OFFICES</div>
        {enrichedGeoNodes.filter(n => n.type === 'co').map(node => {
          const color = CAP_COLOR(node.capacity);
          return (
            <div key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{
                background: '#0f172a', border: `1px solid ${color}33`,
                borderLeft: `3px solid ${color}`, borderRadius: 6,
                padding: '6px 8px', marginBottom: 0, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 11 }}>{node.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#e2e8f0', flex: 1 }}>{node.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color }}>{node.capacity}%</span>
              </div>
              <div style={{ fontSize: 8, color: '#475569', marginBottom: 3 }}>{node.subscribers?.toLocaleString()} / {node.maxSubscribers?.toLocaleString()} subs · {node.region}</div>
              <div style={{ background: '#1e293b', borderRadius: 2, height: 3 }}>
                <div style={{ width: `${node.capacity}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 1s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
