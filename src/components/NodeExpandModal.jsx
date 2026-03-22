import { useEffect, useRef } from 'react';
import CapacityChart from './charts/CapacityChart';

const LAYER_COLORS = {
  customer: '#6366f1', access: '#0ea5e9', central_office: '#06b6d4',
  ip_services: '#f59e0b', security: '#ef4444', metro: '#3b82f6',
  core: '#6366f1', internet: '#22c55e', oss_bss: '#10b981', management: '#64748b',
};
const STATUS_COLORS = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', provisioning: '#facc15' };

export default function NodeExpandModal({ node, edges, allNodes, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!node) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [node, onClose]);

  if (!node) return null;

  const d = node.data;
  const layerColor = LAYER_COLORS[d.layer] || '#64748b';
  const statusColor = STATUS_COLORS[d.status] || '#22c55e';

  // Find connected nodes
  const connectedIds = new Set(
    edges.filter(e => e.source === node.id || e.target === node.id)
      .flatMap(e => [e.source, e.target])
      .filter(id => id !== node.id)
  );
  const connectedNodes = allNodes.filter(n => connectedIds.has(n.id));

  const extras = Object.entries({
    'Active Sessions': d.activeSessions,
    'Subscribers': d.subscribers ? `${d.subscribers} / ${d.maxSubscribers}` : undefined,
    'IP Pool Used': d.ipPoolUsed ? `${d.ipPoolUsed} / ${d.ipPoolTotal}` : undefined,
    'NAT Sessions': d.natSessions,
    'VPN Tunnels': d.vpnTunnels,
    'BGP Peers': d.bgpPeers,
    'Ports Free / Used': d.portsFree !== undefined ? `${d.portsFree} free / ${d.portsUsed} used` : undefined,
    'Devices': d.devices,
    'IP Prefixes': d.ipPrefixes,
    'Total Customers': d.totalCustomers,
    'MRR': d.mrr,
    'Customer Count': d.count,
    'Mitigation Active': d.mitigationActive !== undefined ? (d.mitigationActive ? 'YES 🔴' : 'No') : undefined,
  }).filter(([, v]) => v !== undefined);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg-root)cc',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        border: `2px solid ${layerColor}`,
        borderRadius: 16,
        width: '90%', maxWidth: 900,
        maxHeight: '88vh',
        overflowY: 'auto',
        boxShadow: `0 0 60px ${layerColor}44`,
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 22px', borderBottom: `1px solid ${layerColor}33`,
          background: `${layerColor}11`,
        }}>
          <span style={{ fontSize: 32 }}>{d.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{d.label}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{d.sublabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontSize: 10, color: statusColor, textTransform: 'uppercase', fontWeight: 700 }}>{d.status}</span>
              <span style={{ fontSize: 10, color: 'var(--border-subtle)' }}>|</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>Layer: {d.layer?.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Capacity gauge */}
          <div style={{ textAlign: 'center', background: 'var(--bg-root)', borderRadius: 10, padding: '10px 18px', border: `1px solid ${statusColor}33` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: statusColor }}>{d.capacity?.toFixed(1)}%</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>CAPACITY</div>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, width: 80, marginTop: 5 }}>
              <div style={{ width: `${Math.min(d.capacity || 0, 100)}%`, height: '100%', background: statusColor, borderRadius: 4 }} />
            </div>
          </div>

          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '20px 22px' }}>
          {/* Left — metrics + chart */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 10 }}>LIVE METRICS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {extras.map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-root)', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{String(v)}</div>
                </div>
              ))}
              {extras.length === 0 && (
                <div style={{ gridColumn: '1/-1', fontSize: 10, color: 'var(--border-subtle)', textAlign: 'center', padding: '10px 0' }}>
                  No additional metrics for this node
                </div>
              )}
            </div>

            <CapacityChart nodeData={d} height={180} />
          </div>

          {/* Right — connections + actions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 10 }}>
              CONNECTED NODES ({connectedNodes.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
              {connectedNodes.map(cn => {
                const cc = LAYER_COLORS[cn.data.layer] || '#64748b';
                const cs = STATUS_COLORS[cn.data.status] || '#22c55e';
                return (
                  <div key={cn.id} style={{
                    background: 'var(--bg-root)', border: `1px solid ${cc}33`,
                    borderLeft: `3px solid ${cc}`, borderRadius: 6, padding: '7px 10px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 14 }}>{cn.data.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{cn.data.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{cn.data.sublabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: cs }}>{cn.data.capacity?.toFixed(0)}%</div>
                      <div style={{ fontSize: 8, color: cs, textTransform: 'uppercase' }}>{cn.data.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick actions */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 10 }}>QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                { label: '📊 View 7-day trend', color: '#60a5fa' },
                { label: '⚙️ Generate device config', color: '#a78bfa' },
                { label: '📋 Export node report', color: '#22c55e' },
                { label: '🔔 Set capacity alert', color: '#f59e0b' },
              ].map(a => (
                <button key={a.label} style={{
                  background: `${a.color}11`, border: `1px solid ${a.color}33`, borderRadius: 7,
                  padding: '8px 12px', cursor: 'pointer', color: a.color, fontSize: 11,
                  fontWeight: 600, textAlign: 'left', transition: 'all 0.15s',
                }}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
