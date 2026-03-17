import { useEffect, useRef, useState } from 'react';

// ── Shared collapsible panel wrapper ─────────────────────────────────────────
export function CollapsiblePanel({ title, icon, badge, badgeColor = '#22c55e', badgeBg = '#052e16', defaultOpen = true, children, headerExtra }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: '#0a1220', border: 'none',
          padding: '7px 10px', display: 'flex', alignItems: 'center',
          gap: 6, cursor: 'pointer', textAlign: 'left',
        }}
      >
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, flex: 1 }}>{title}</span>
        {headerExtra}
        {badge !== undefined && (
          <span style={{ fontSize: 8, color: badgeColor, background: badgeBg, border: `1px solid ${badgeColor}44`, borderRadius: 3, padding: '1px 5px', marginRight: 2 }}>
            {badge}
          </span>
        )}
        <span style={{ color: '#334155', fontSize: 11, lineHeight: 1 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

const LAYER_META = {
  customer: { label: 'Customer Premises', color: '#6366f1', y: 720 },
  access: { label: 'Access Layer (XGS-PON)', color: '#0ea5e9', y: 540 },
  central_office: { label: 'Central Office', color: '#06b6d4', y: 380 },
  ip_services: { label: 'IP Services (BNG / CGNAT / MPLS)', color: '#f59e0b', y: 265 },
  security: { label: 'Security Layer', color: '#ef4444', y: 190 },
  metro: { label: 'Metro / Transport', color: '#3b82f6', y: 100 },
  core: { label: 'Core Backbone', color: '#6366f1', y: 20 },
  internet: { label: 'Internet / IXP / Transit', color: '#22c55e', y: -40 },
  oss_bss: { label: 'OSS / BSS', color: '#10b981', y: 350 },
  management: { label: 'Management Plane', color: '#64748b', y: 220 },
};

export function LayerLegend() {
  return (
    <CollapsiblePanel title="NETWORK LAYERS" icon="🗂️" defaultOpen={false}>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(LAYER_META).map(([key, meta]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>{meta.label}</span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

export function EventLog({ events }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events]);

  const dot = (
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: events.length > 0 ? '#22c55e' : '#334155',
      display: 'inline-block', animation: events.length > 0 ? 'pulse 1s infinite' : 'none', flexShrink: 0 }} />
  );

  return (
    <CollapsiblePanel
      title="PROVISIONING EVENT LOG"
      icon="📋"
      badge={events.length > 0 ? `${events.length} events` : undefined}
      badgeColor="#22c55e"
      badgeBg="#052e16"
      defaultOpen={true}
      headerExtra={dot}
    >
      <div ref={ref} style={{
        overflowY: 'auto',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        maxHeight: 340,
        minHeight: 80,
        background: '#0a0f1e',
      }}>
        {events.length === 0 && (
          <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
            Run a simulation to see events...
          </div>
        )}
        {events.map((ev, i) => (
          <div key={i} style={{
            background: '#0f172a',
            border: `1px solid ${ev.color || '#1e293b'}44`,
            borderLeft: `3px solid ${ev.color || '#3b82f6'}`,
            borderRadius: 6,
            padding: '5px 8px',
            animation: i === events.length - 1 ? 'fadeIn 0.4s ease' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', flexShrink: 0 }}>
                {ev.time}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: ev.color || '#60a5fa' }}>
                [{ev.system}]
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#e2e8f0', marginBottom: 1 }}>{ev.action}</div>
            <div style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>{ev.detail}</div>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

export function SimulationPanel({ simulations, activeSimId, onRun, running }) {
  return (
    <CollapsiblePanel title="SIMULATIONS" icon="▶️" badge={activeSimId ? 'RUNNING' : undefined} badgeColor="#facc15" badgeBg="#1a1400" defaultOpen={true}>
      <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(simulations).map(([id, sim]) => {
          const isActive = activeSimId === id;
          return (
            <button
              key={id}
              onClick={() => onRun(id)}
              disabled={running}
              style={{
                background: isActive ? `${sim.color}22` : '#1e293b',
                border: `1.5px solid ${isActive ? sim.color : '#334155'}`,
                borderRadius: 8,
                padding: '8px 10px',
                cursor: running ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                opacity: running && !isActive ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sim.color, flexShrink: 0,
                  animation: isActive && running ? 'pulse 0.8s infinite' : 'none' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? sim.color : '#cbd5e1' }}>
                  {sim.label}
                </span>
              </div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, paddingLeft: 14 }}>
                {sim.description}
              </div>
            </button>
          );
        })}
      </div>
    </CollapsiblePanel>
  );
}

export function StatsBar({ nodes }) {
  const totalNodes = nodes.length;
  const avgCapacity = Math.round(nodes.reduce((s, n) => s + (n.data.capacity || 0), 0) / totalNodes);
  const criticalCount = nodes.filter(n => n.data.status === 'critical').length;
  const warningCount = nodes.filter(n => n.data.status === 'warning').length;
  const provisioningCount = nodes.filter(n => n.data.isActive).length;

  const totalCustomers = nodes
    .filter(n => n.data.count)
    .reduce((s, n) => s + (n.data.count || 0), 0);

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '8px 14px',
      background: '#0a0f1e',
      borderBottom: '1px solid #1e3a5f',
      flexShrink: 0,
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', letterSpacing: 1, marginRight: 8 }}>
        NORTH STAR FIBER — LIVE NETWORK
      </div>
      {[
        { label: 'COMPONENTS', value: totalNodes, color: '#60a5fa' },
        { label: 'AVG CAPACITY', value: `${avgCapacity}%`, color: avgCapacity > 70 ? '#ef4444' : avgCapacity > 40 ? '#f59e0b' : '#22c55e' },
        { label: 'CUSTOMERS', value: totalCustomers.toLocaleString(), color: '#a78bfa' },
        { label: 'CRITICAL', value: criticalCount, color: criticalCount > 0 ? '#ef4444' : '#334155' },
        { label: 'WARNING', value: warningCount, color: warningCount > 0 ? '#f59e0b' : '#334155' },
        { label: 'PROVISIONING', value: provisioningCount, color: provisioningCount > 0 ? '#facc15' : '#334155' },
      ].map(stat => (
        <div key={stat.label} style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 6,
          padding: '4px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 70,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</span>
          <span style={{ fontSize: 8, color: '#475569', letterSpacing: 0.5 }}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

export function NodeDetailPanel({ node, onClose }) {
  if (!node) return null;
  const d = node.data;
  const statusColor = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', provisioning: '#facc15' }[d.status] || '#22c55e';

  const extras = Object.entries({
    'Port Free': d.portsFree,
    'Ports Used': d.portsUsed,
    'Active Sessions': d.activeSessions,
    'Subscribers': d.subscribers ? `${d.subscribers} / ${d.maxSubscribers}` : undefined,
    'IP Pool': d.ipPoolUsed ? `${d.ipPoolUsed} / ${d.ipPoolTotal}` : undefined,
    'NAT Sessions': d.natSessions,
    'VPN Tunnels': d.vpnTunnels,
    'BGP Peers': d.bgpPeers,
    'Devices': d.devices,
    'IP Prefixes': d.ipPrefixes,
    'Total Customers': d.totalCustomers,
    'MRR': d.mrr,
    'Customer Count': d.count,
  }).filter(([, v]) => v !== undefined);

  return (
    <CollapsiblePanel
      title={`${d.icon || '📡'} ${d.label}`}
      badge={d.status?.toUpperCase()}
      badgeColor={statusColor}
      badgeBg={statusColor + '22'}
      defaultOpen={true}
      headerExtra={
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>×</button>
      }
    >
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>{d.sublabel} · Layer: {d.layer?.replace('_', ' ')}</div>

        {/* Capacity bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Capacity Utilization</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor }}>{d.capacity}%</span>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 4, height: 6 }}>
            <div style={{ width: `${d.capacity}%`, height: '100%', background: statusColor, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {extras.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>{k}</span>
            <span style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 600 }}>{String(v)}</span>
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}
