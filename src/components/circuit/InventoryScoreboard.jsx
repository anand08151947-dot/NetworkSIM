// InventoryScoreboard — animated capacity bars for Phase 2B

function statusColor(avail, total, critAt, warnAt) {
  if (avail <= critAt) return '#ef4444';
  if (avail <= warnAt) return '#f59e0b';
  return '#22c55e';
}

function statusLabel(avail, critAt, warnAt) {
  if (avail <= critAt) return { text: 'CRITICAL', bg: '#450a0a', fg: '#ef4444' };
  if (avail <= warnAt) return { text: 'WARNING',  bg: '#451a00', fg: '#f59e0b' };
  return                       { text: 'OK',       bg: '#052e16', fg: '#22c55e' };
}

function InventoryBar({ item, animKey }) {
  const pct   = Math.round((item.avail / item.total) * 100);
  const color = statusColor(item.avail, item.total, item.critAt, item.warnAt);
  const badge = statusLabel(item.avail, item.critAt, item.warnAt);

  return (
    <div style={{
      background: 'var(--bg-primary)', border: `1px solid ${badge.text === 'OK' ? '#1e2a3a' : color + '55'}`,
      borderRadius: 8, padding: '10px 12px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
          background: badge.bg, color: badge.fg,
        }}>{badge.text}</span>
      </div>

      {/* Bar */}
      <div style={{ height: 7, background: '#1e2a3a', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
        <div
          key={animKey}
          style={{
            height: '100%', width: `${pct}%`, background: color,
            borderRadius: 4, transformOrigin: 'left',
            animation: 'inv-fill 1.1s cubic-bezier(.4,0,.2,1) forwards',
          }}
        />
      </div>

      {/* Values */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: color, fontWeight: 700, fontFamily: 'monospace' }}>
          {typeof item.avail === 'number' && item.avail % 1 !== 0
            ? item.avail.toFixed(1)
            : item.avail.toLocaleString()}{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{item.unit}</span>
        </span>
        <span style={{ color: 'var(--border-subtle)', fontSize: 10 }}>
          of {item.total.toLocaleString()} · {pct}%
        </span>
      </div>

      {/* Augmentation warning */}
      {item.augment && (
        <div style={{
          marginTop: 6, padding: '5px 8px', borderRadius: 5,
          background: '#1c0a00', border: '1px solid #92400e',
          fontSize: 10, color: '#fbbf24', lineHeight: 1.5,
        }}>
          ⚠️ {item.augment}
        </div>
      )}
    </div>
  );
}

export default function InventoryScoreboard({ items, animKey }) {
  if (!items || items.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-accent)', fontSize: 14 }}>
        Configure a circuit order to view inventory status
      </div>
    );
  }

  const critCount = items.filter(i => i.avail <= i.critAt).length;
  const warnCount = items.filter(i => i.avail <= i.warnAt && i.avail > i.critAt).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes inv-fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: 12, padding: '10px 14px',
        borderBottom: '1px solid #1e2a3a', background: 'var(--bg-primary)', flexShrink: 0,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>🗄️ Inventory & Capacity</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>
          {items.length - critCount - warnCount} OK
        </span>
        {warnCount > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>{warnCount} Warning</span>}
        {critCount > 0 && <span style={{ fontSize: 11, color: '#ef4444' }}>{critCount} Critical</span>}
      </div>

      {/* Grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: 12,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start',
      }}>
        {items.map((item, i) => (
          <InventoryBar key={item.id} item={item} animKey={`${animKey}-${i}`} />
        ))}
      </div>
    </div>
  );
}
