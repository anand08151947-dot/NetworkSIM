import { useEffect, useRef, useState } from 'react';

const ALERT_TEMPLATES = [
  (nodes) => { const n = nodes.find(x => x.data.capacity > 35); return n ? `${n.data.label} — utilization ${n.data.capacity.toFixed(1)}% | trending +0.4%/hr` : null; },
  () => `RADIUS — ${(1469 + Math.floor(Math.random() * 10)).toLocaleString()} active sessions | auth rate 99.97%`,
  () => `BGP — border router advertising ${14 + Math.floor(Math.random() * 2)} prefixes | all peers stable`,
  (nodes) => { const n = nodes.find(x => x.data.capacity > 30 && x.id === 'bng'); return n ? `BNG — ${(1469 + Math.floor(Math.random() * 5)).toLocaleString()} IPoE sessions | pool ${n.data.capacity.toFixed(0)}% utilized` : null; },
  () => `DHCP — lease rate 94.2% | next expiry: ${Math.floor(Math.random() * 50) + 10} min | pool healthy`,
  () => `CDN — Netflix OCA hit rate 87.3% | Google GGC hit rate 91.1% | transit offload active`,
  () => `OLT-1 (Calix E7-2) — ${Math.floor(Math.random() * 4) + 32}/48 ports active | signal avg -${(Math.random() * 4 + 16).toFixed(1)}dBm`,
  () => `OLT-2 (Nokia 7360) — ${Math.floor(Math.random() * 3) + 26}/48 ports active | all ONTs registered`,
  () => `DDoS scrubbing — no active mitigations | baseline traffic normal | Arbor TMS standby`,
  () => `PTP sync — Stratum-1 lock maintained | offset ${(Math.random() * 10).toFixed(2)}ns | all CO clocks synced`,
  () => `Metro ring — primary path utilization ${(Math.random() * 15 + 28).toFixed(1)}% | BLSR protection armed`,
  (nodes) => { const n = nodes.find(x => x.id === 'cgnat'); return `CGNAT — ${(48200 + Math.floor(Math.random() * 500)).toLocaleString()} NAT sessions | pool utilization ${n?.data?.capacity?.toFixed(0) || 29}%`; },
  () => `Billing — MRR $${(1240000 + Math.floor(Math.random() * 10000)).toLocaleString()} | ${Math.floor(Math.random() * 3) + 2} new orders today`,
  () => `NetBox — inventory sync complete | ${387 + Math.floor(Math.random() * 3)} devices tracked | 0 conflicts`,
  (nodes) => { const n = nodes.find(x => x.data.status === 'warning'); return n ? `⚠️ ${n.data.label} — capacity at ${n.data.capacity.toFixed(1)}% — review recommended` : null; },
  (nodes) => { const n = nodes.find(x => x.data.status === 'critical'); return n ? `🚨 CRITICAL: ${n.data.label} — ${n.data.capacity.toFixed(1)}% — immediate action required` : null; },
  () => `NTP — all 14 COs synchronized | stratum 2 accuracy ±${(Math.random() * 5).toFixed(1)}ms`,
  () => `Peering — Seattle-IX: 14 active peers | inbound ${(Math.random() * 20 + 30).toFixed(1)}Gbps | outbound ${(Math.random() * 10 + 15).toFixed(1)}Gbps`,
];

const SEV_COLOR = {
  '🚨': '#ef4444',
  '⚠️': '#f59e0b',
};

function getColor(msg) {
  if (msg?.startsWith('🚨')) return '#ef4444';
  if (msg?.startsWith('⚠️')) return '#f59e0b';
  return '#22c55e';
}

export default function NOCTicker({ nodes }) {
  const [alerts, setAlerts] = useState([]);
  const [paused, setPaused] = useState(false);
  const tickRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const generate = () => {
      const templates = ALERT_TEMPLATES.filter(t => {
        try { return t(nodes) !== null; } catch { return false; }
      });
      if (!templates.length) return;
      const fn = templates[indexRef.current % templates.length];
      indexRef.current++;
      const msg = fn(nodes);
      if (!msg) return;
      const now = new Date().toTimeString().slice(0, 8);
      setAlerts(prev => [{ msg, time: now, id: Date.now() }, ...prev].slice(0, 60));
    };

    generate(); // immediate first
    tickRef.current = setInterval(generate, 3500);
    return () => clearInterval(tickRef.current);
  }, [nodes]);

  const visible = alerts.slice(0, 20);

  return (
    <div style={{
      background: 'var(--bg-root)',
      borderTop: '1px solid var(--border-accent)',
      height: 34,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Label */}
      <div style={{
        background: '#0f1f3d', borderRight: '1px solid var(--border-accent)',
        padding: '0 10px', height: '100%', display: 'flex', alignItems: 'center',
        gap: 5, flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: paused ? 'var(--text-muted)' : '#22c55e', animation: paused ? 'none' : 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: 1 }}>NOC</span>
      </div>

      {/* Ticker scroll */}
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          gap: 40,
          animation: paused ? 'none' : 'ticker 60s linear infinite',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}>
          {[...visible, ...visible].map((a, i) => (
            <span key={`${a.id}-${i}`} style={{ fontSize: 10, color: getColor(a.msg), flexShrink: 0 }}>
              <span style={{ color: 'var(--border-subtle)', marginRight: 6, fontFamily: 'monospace' }}>[{a.time}]</span>
              {a.msg}
              <span style={{ color: 'var(--bg-elevated)', margin: '0 16px' }}>│</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
