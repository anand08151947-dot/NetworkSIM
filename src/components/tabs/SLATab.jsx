import { useMemo, useState } from 'react';

const SLA_TIERS = {
  Enterprise: { uptime: 99.99, creditPct: 25, label: '99.99%', color: '#a78bfa' },
  'Mid-Market': { uptime: 99.95, creditPct: 15, label: '99.95%', color: '#60a5fa' },
  SMB: { uptime: 99.9, creditPct: 10, label: '99.9%', color: '#22c55e' },
  Residential: { uptime: 99.5, creditPct: 5, label: '99.5%', color: '#64748b' },
};

function uptimeToMinutes(uptimePct, daysInMonth = 30) {
  return ((1 - uptimePct / 100) * daysInMonth * 24 * 60).toFixed(1);
}

function generateSLARecord(customer) {
  const sla = SLA_TIERS[customer.tier] || SLA_TIERS.Residential;
  // Simulate some random downtime based on tier
  const baseDowntime = customer.tier === 'Enterprise' ? 0.5
    : customer.tier === 'Mid-Market' ? 1.2
    : customer.tier === 'SMB' ? 2.5
    : Math.random() * 10 + 2;
  const actualDowntime = parseFloat((baseDowntime + Math.random() * 1.5).toFixed(2));
  const maxAllowedDowntime = parseFloat(uptimeToMinutes(sla.uptime));
  const breached = actualDowntime > maxAllowedDowntime;
  const actualUptime = parseFloat((100 - (actualDowntime / (30 * 24 * 60)) * 100).toFixed(4));
  const incidents = Math.floor(Math.random() * 3) + (breached ? 1 : 0);
  const creditOwed = breached ? Math.round(customer.rate * (sla.creditPct / 100)) : 0;

  return {
    id: customer.id,
    name: customer.name,
    tier: customer.tier,
    city: customer.city,
    speed: customer.speed,
    rate: customer.rate,
    slaTarget: sla.uptime,
    maxDowntimeMin: maxAllowedDowntime,
    actualDowntimeMin: actualDowntime,
    actualUptime,
    breached,
    incidents,
    creditOwed,
    slaColor: sla.color,
    status: breached ? 'BREACH' : actualUptime >= sla.uptime - 0.01 ? 'OK' : 'AT-RISK',
  };
}

const TIER_FILTER_OPTIONS = ['All', 'Enterprise', 'Mid-Market', 'SMB', 'Residential'];
const STATUS_FILTER_OPTIONS = ['All', 'BREACH', 'AT-RISK', 'OK'];

export default function SLATab({ customers }) {
  const [tierFilter, setTierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('actualDowntimeMin');
  const [sortDir, setSortDir] = useState('desc');

  const slaRecords = useMemo(() => {
    return customers.map(c => generateSLARecord(c, []));
  }, [customers]);

  const filtered = useMemo(() => {
    return slaRecords
      .filter(r => tierFilter === 'All' || r.tier === tierFilter)
      .filter(r => statusFilter === 'All' || r.status === statusFilter)
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1;
        return mul * (a[sortBy] > b[sortBy] ? 1 : -1);
      });
  }, [slaRecords, tierFilter, statusFilter, sortBy, sortDir]);

  const summary = useMemo(() => ({
    total: slaRecords.length,
    breached: slaRecords.filter(r => r.breached).length,
    atRisk: slaRecords.filter(r => r.status === 'AT-RISK').length,
    totalCredits: slaRecords.reduce((s, r) => s + r.creditOwed, 0),
    avgUptime: (slaRecords.reduce((s, r) => s + r.actualUptime, 0) / slaRecords.length).toFixed(3),
  }), [slaRecords]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const th = (col, label) => (
    <th
      onClick={() => handleSort(col)}
      style={{
        padding: '8px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700,
        color: sortBy === col ? '#60a5fa' : '#64748b', letterSpacing: 0.5,
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-primary)', position: 'sticky', top: 0,
      }}
    >
      {label} {sortBy === col ? (sortDir === 'desc' ? '▼' : '▲') : ''}
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-root)', overflow: 'hidden' }}>
      {/* Summary KPIs */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }}>
        {[
          { label: 'Total Customers', value: summary.total, color: 'var(--text-primary)' },
          { label: 'SLA Breaches', value: summary.breached, color: summary.breached > 0 ? '#ef4444' : '#22c55e' },
          { label: 'At-Risk', value: summary.atRisk, color: summary.atRisk > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Credits Owed', value: `$${summary.totalCredits.toLocaleString()}`, color: summary.totalCredits > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Avg Network Uptime', value: `${summary.avgUptime}%`, color: '#22c55e' },
        ].map(k => (
          <div key={k.label} style={{
            flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 10,
            padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border-primary)', flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#64748b' }}>Tier:</span>
        {TIER_FILTER_OPTIONS.map(t => (
          <button key={t} onClick={() => setTierFilter(t)} style={{
            background: tierFilter === t ? '#0f1f3d' : 'transparent',
            border: `1px solid ${tierFilter === t ? 'var(--bg-accent)' : 'var(--bg-elevated)'}`,
            borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
            fontSize: 10, color: tierFilter === t ? '#60a5fa' : '#64748b',
          }}>{t}</button>
        ))}
        <span style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>Status:</span>
        {STATUS_FILTER_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            background: statusFilter === s ? '#0f1f3d' : 'transparent',
            border: `1px solid ${statusFilter === s ? 'var(--bg-accent)' : 'var(--bg-elevated)'}`,
            borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
            fontSize: 10,
            color: s === 'BREACH' ? '#ef4444' : s === 'AT-RISK' ? '#f59e0b' : s === 'OK' ? '#22c55e'
              : statusFilter === s ? '#60a5fa' : '#64748b',
          }}>{s}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--border-subtle)' }}>{filtered.length} records</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {th('name', 'CUSTOMER')}
              {th('tier', 'TIER')}
              {th('city', 'CITY')}
              {th('speed', 'SPEED')}
              {th('slaTarget', 'SLA TARGET')}
              {th('actualUptime', 'ACTUAL UPTIME')}
              {th('maxDowntimeMin', 'MAX DOWNTIME (min)')}
              {th('actualDowntimeMin', 'ACTUAL DOWN (min)')}
              {th('incidents', 'INCIDENTS')}
              {th('creditOwed', 'CREDIT OWED')}
              {th('status', 'STATUS')}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const statusColor = r.status === 'BREACH' ? '#ef4444' : r.status === 'AT-RISK' ? '#f59e0b' : '#22c55e';
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)', transition: 'background 0.1s' }}>
                  <td style={{ padding: '7px 10px', fontSize: 10, color: 'var(--text-primary)', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${r.slaColor}22`, color: r.slaColor, fontWeight: 700 }}>{r.tier}</span>
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 9, color: 'var(--text-secondary)' }}>{r.city}</td>
                  <td style={{ padding: '7px 10px', fontSize: 9, color: '#60a5fa', fontWeight: 700 }}>{r.speed}</td>
                  <td style={{ padding: '7px 10px', fontSize: 9, color: r.slaColor, fontWeight: 700 }}>{r.slaTarget}%</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: r.actualUptime >= r.slaTarget ? '#22c55e' : '#ef4444' }}>
                      {r.actualUptime}%
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 9, color: '#64748b' }}>{r.maxDowntimeMin}</td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: r.actualDowntimeMin > r.maxDowntimeMin ? '#ef4444' : 'var(--text-secondary)' }}>
                      {r.actualDowntimeMin}
                    </span>
                  </td>
                  <td style={{ padding: '7px 10px', fontSize: 9, color: r.incidents > 0 ? '#f59e0b' : '#64748b', textAlign: 'center' }}>{r.incidents}</td>
                  <td style={{ padding: '7px 10px', fontSize: 9, fontWeight: 700, color: r.creditOwed > 0 ? '#f59e0b' : '#22c55e' }}>
                    {r.creditOwed > 0 ? `$${r.creditOwed}` : '—'}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 4,
                      background: `${statusColor}22`, color: statusColor, fontWeight: 700,
                      border: `1px solid ${statusColor}44`,
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div style={{ padding: '6px 16px', borderTop: '1px solid var(--border-primary)', flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: 'var(--border-subtle)' }}>
          SLA data is simulated for the current billing cycle (30-day window). Credits calculated per service agreement.
          Enterprise = 99.99% | Mid-Market = 99.95% | SMB = 99.9% | Residential = 99.5%
        </span>
      </div>
    </div>
  );
}
