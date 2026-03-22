import { useState } from 'react';
import { initialNodes } from '../../data/networkTopology';

// eslint-disable-next-line react-refresh/only-export-components
export const ALL_LAYERS = [
  { id: 'customer',      label: 'Customer Premises',       icon: '🏠', color: '#6366f1' },
  { id: 'access',        label: 'Access (XGS-PON)',         icon: '📡', color: '#0ea5e9' },
  { id: 'central_office',label: 'Central Office',           icon: '🏢', color: '#06b6d4' },
  { id: 'ip_services',   label: 'IP Services / BNG',        icon: '🌐', color: '#f59e0b' },
  { id: 'security',      label: 'Security Layer',           icon: '🛡️', color: '#ef4444' },
  { id: 'metro',         label: 'Metro / Transport',        icon: '⚡', color: '#3b82f6' },
  { id: 'core',          label: 'Core Backbone',            icon: '🔷', color: '#6366f1' },
  { id: 'internet',      label: 'Internet / IXP',           icon: '🌍', color: '#22c55e' },
  { id: 'oss_bss',       label: 'OSS / BSS',                icon: '⚙️',  color: '#10b981' },
  { id: 'management',    label: 'Management Plane',         icon: '📊', color: '#64748b' },
];

// Preset quick-select views
const PRESETS = [
  {
    id: 'data_plane',
    label: '🛤️ Data Plane',
    tip: 'Customer → Access → CO → IP → Metro → Core → Internet',
    layers: ['customer', 'access', 'central_office', 'ip_services', 'metro', 'core', 'internet'],
  },
  {
    id: 'customer_path',
    label: '👤 Customer Path',
    tip: 'End-to-end customer provisioning layers',
    layers: ['customer', 'access', 'central_office', 'ip_services'],
  },
  {
    id: 'control_plane',
    label: '🎛️ Control Plane',
    tip: 'IP services, security, core routing, management',
    layers: ['ip_services', 'security', 'core', 'internet', 'management'],
  },
  {
    id: 'operations',
    label: '🔧 Operations',
    tip: 'Management, OSS/BSS, Security systems',
    layers: ['management', 'oss_bss', 'security'],
  },
  {
    id: 'exec_view',
    label: '📊 Exec View',
    tip: 'High-level: customers, core, internet only',
    layers: ['customer', 'core', 'internet', 'oss_bss'],
  },
  {
    id: 'transport',
    label: '💡 Transport',
    tip: 'Metro, core optical, internet peering',
    layers: ['metro', 'core', 'internet'],
  },
];

// Count nodes per layer from topology
const LAYER_NODE_COUNTS = ALL_LAYERS.reduce((acc, l) => {
  acc[l.id] = initialNodes.filter(n => n.data.layer === l.id).length;
  return acc;
}, {});

// Average capacity per layer
const LAYER_AVG_CAP = ALL_LAYERS.reduce((acc, l) => {
  const layerNodes = initialNodes.filter(n => n.data.layer === l.id && n.data.capacity != null);
  acc[l.id] = layerNodes.length
    ? Math.round(layerNodes.reduce((s, n) => s + n.data.capacity, 0) / layerNodes.length)
    : 0;
  return acc;
}, {});

function healthColor(cap) {
  if (cap >= 80) return '#ef4444';
  if (cap >= 60) return '#f59e0b';
  if (cap >= 40) return '#eab308';
  return '#22c55e';
}

export default function LayerFilter({ visibleLayers, setVisibleLayers, dimMode, setDimMode }) {
  const [expanded, setExpanded] = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  const [showPresets, setShowPresets] = useState(true);
  const [hoveredPreset, setHoveredPreset] = useState(null);

  const allOn  = ALL_LAYERS.every(l => visibleLayers.includes(l.id));
  const allOff = ALL_LAYERS.every(l => !visibleLayers.includes(l.id));

  const toggle = (id) => {
    setActivePreset(null);
    setVisibleLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.id === activePreset ? null : preset.id);
    if (preset.id === activePreset) {
      setVisibleLayers(ALL_LAYERS.map(l => l.id));
    } else {
      setVisibleLayers(preset.layers);
    }
  };

  const visibleCount = visibleLayers.length;

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
      {/* WebKit scrollbar styling for the layer list */}
      <style>{`
        .layer-list-scroll::-webkit-scrollbar { width: 4px; }
        .layer-list-scroll::-webkit-scrollbar-track { background: transparent; }
        .layer-list-scroll::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
        .layer-list-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
      `}</style>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', background: '#0a1628', border: 'none', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 11 }}>🎛️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', flex: 1, textAlign: 'left', letterSpacing: 0.5 }}>
          LAYER FILTER
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: visibleCount === ALL_LAYERS.length ? 'var(--text-muted)' : '#60a5fa',
          background: visibleCount === ALL_LAYERS.length ? 'transparent' : 'var(--bg-accent)',
          borderRadius: 4, padding: '1px 5px',
        }}>
          {visibleCount}/{ALL_LAYERS.length}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* ── Dim Mode toggle ── */}
          {setDimMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', background: 'var(--bg-primary)', borderRadius: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: '#64748b', flex: 1 }}>Hidden layers:</span>
              <button
                onClick={() => setDimMode(false)}
                style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: !dimMode ? '#6366f1' : 'var(--bg-elevated)', background: !dimMode ? '#1e1b4b' : 'transparent', color: !dimMode ? '#a5b4fc' : 'var(--text-muted)' }}
              >HIDE</button>
              <button
                onClick={() => setDimMode(true)}
                style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: dimMode ? '#f59e0b' : 'var(--bg-elevated)', background: dimMode ? '#1a1200' : 'transparent', color: dimMode ? '#fbbf24' : 'var(--text-muted)' }}
              >DIM</button>
            </div>
          )}

          {/* ── Show All / Hide All ── */}
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => { setVisibleLayers(ALL_LAYERS.map(l => l.id)); setActivePreset(null); }}
              style={{ flex: 1, background: allOn ? 'var(--bg-accent)' : '#0a0f1e', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '3px', cursor: 'pointer', fontSize: 9, color: allOn ? '#60a5fa' : 'var(--text-muted)', fontWeight: 700 }}>
              SHOW ALL
            </button>
            <button onClick={() => { setVisibleLayers([]); setActivePreset(null); }}
              style={{ flex: 1, background: allOff ? '#1a0000' : '#0a0f1e', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '3px', cursor: 'pointer', fontSize: 9, color: allOff ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
              HIDE ALL
            </button>
          </div>

          {/* ── Preset Views ── */}
          <div>
            <button
              onClick={() => setShowPresets(p => !p)}
              style={{ width: '100%', background: 'transparent', border: 'none', padding: '3px 2px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, flex: 1, textAlign: 'left', letterSpacing: 0.4 }}>
                ⚡ QUICK VIEWS {showPresets ? '▴' : '▾'}
              </span>
              {activePreset && (
                <span style={{ fontSize: 8, color: '#f59e0b', background: '#1a1000', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>
                  ACTIVE
                </span>
              )}
            </button>

            {showPresets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {PRESETS.map(p => {
                  const isActive = activePreset === p.id;
                  const isHovered = hoveredPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      onMouseEnter={() => setHoveredPreset(p.id)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      title={p.tip}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: isActive ? '#0d2040' : isHovered ? '#0f1f3a' : 'transparent',
                        border: `1px solid ${isActive ? '#3b82f6' : 'var(--bg-elevated)'}`,
                        borderRadius: 5, padding: '4px 8px', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.12s',
                      }}
                    >
                      <span style={{ fontSize: 10, flex: 1, color: isActive ? '#93c5fd' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 400 }}>
                        {p.label}
                      </span>
                      <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                        {p.layers.length}L
                      </span>
                      {isActive && <span style={{ fontSize: 9, color: '#60a5fa' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ borderTop: '1px solid var(--border-primary)', margin: '2px 0' }} />

          {/* ── Per-layer toggles — scrollable list ── */}
          <div
            className="layer-list-scroll"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              maxHeight: 240,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border-subtle) transparent',
              paddingRight: 2,
            }}
          >
          {ALL_LAYERS.map(layer => {
            const on = visibleLayers.includes(layer.id);
            const count = LAYER_NODE_COUNTS[layer.id] || 0;
            const avgCap = LAYER_AVG_CAP[layer.id] || 0;
            const hc = healthColor(avgCap);
            return (
              <button key={layer.id} onClick={() => toggle(layer.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: on ? `${layer.color}11` : 'transparent',
                  border: `1px solid ${on ? layer.color + '44' : 'var(--bg-elevated)'}`,
                  borderRadius: 5, padding: '4px 7px', cursor: 'pointer', textAlign: 'left',
                  opacity: on ? 1 : 0.4, transition: 'all 0.15s',
                  flexShrink: 0,
                }}>
                {/* Color swatch */}
                <div style={{ width: 8, height: 8, borderRadius: 2, background: on ? layer.color : 'var(--border-subtle)', flexShrink: 0 }} />
                {/* Icon + label */}
                <span style={{ fontSize: 9, color: on ? 'var(--text-primary)' : 'var(--text-muted)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {layer.icon} {layer.label}
                </span>
                {/* Node count */}
                <span style={{ fontSize: 8, color: on ? 'var(--text-muted)' : 'var(--border-subtle)', minWidth: 14, textAlign: 'right' }}>
                  {count}n
                </span>
                {/* Health dot */}
                <div title={`Avg utilization: ${avgCap}%`} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: on ? hc : 'var(--bg-elevated)', flexShrink: 0,
                }} />
              </button>
            );
          })}
          </div>

          {/* ── Footer: health legend ── */}
          <div style={{ display: 'flex', gap: 8, padding: '3px 2px', marginTop: 1 }}>
            {[['#22c55e', '<40%'], ['#eab308', '40-60%'], ['#f59e0b', '60-80%'], ['#ef4444', '>80%']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 8, color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

