import { useState, useMemo } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender, createColumnHelper,
} from '@tanstack/react-table';
import { TIER_COLORS, TIER_LABELS, nextCustomerId } from '../../data/customers';
import { exportCustomersToExcel } from '../../utils/exportUtils';

const columnHelper = createColumnHelper();

const STATUS_COLOR = { active: '#22c55e', suspended: '#f59e0b', offline: '#ef4444' };

function TierBadge({ tier }) {
  return (
    <span style={{
      background: `${TIER_COLORS[tier]}22`, color: TIER_COLORS[tier],
      border: `1px solid ${TIER_COLORS[tier]}44`, borderRadius: 4,
      padding: '1px 6px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {tier === 'residential' ? '🏠 Residential' : tier === 'smb' ? '🏢 SMB' : '🏗️ Enterprise'}
    </span>
  );
}

export default function CustomerTab({ customers, setCustomers, onAddCustomer }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', tier: 'residential', speed: '1G', city: 'Seattle' });

  const filtered = useMemo(() => {
    return tierFilter === 'all' ? customers : customers.filter(c => c.tier === tierFilter);
  }, [customers, tierFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor('id', { header: 'ID', size: 60 }),
    columnHelper.accessor('name', { header: 'Name / Company', size: 160 }),
    columnHelper.accessor('tier', { header: 'Tier', size: 100, cell: info => <TierBadge tier={info.getValue()} /> }),
    columnHelper.accessor('city', { header: 'City', size: 90 }),
    columnHelper.accessor('speed', { header: 'Speed', size: 60, cell: info => <span style={{ color: '#60a5fa', fontWeight: 700 }}>{info.getValue()}</span> }),
    columnHelper.accessor('rate', { header: 'MRR', size: 70, cell: info => <span style={{ color: '#22c55e' }}>${info.getValue()}/mo</span> }),
    columnHelper.accessor('ip', { header: 'IP Address', size: 120, cell: info => <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{info.getValue()}</span> }),
    columnHelper.accessor('status', { header: 'Status', size: 80, cell: info => {
      const v = info.getValue();
      return <span style={{ color: STATUS_COLOR[v] || 'var(--text-secondary)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{v}</span>;
    }}),
    columnHelper.accessor('uptime', { header: 'Uptime', size: 80 }),
    columnHelper.accessor('latency', { header: 'Latency', size: 70 }),
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const totalMRR = customers.reduce((s, c) => s + c.rate, 0);

  const handleAddCustomer = () => {
    const PLANS = {
      residential: { '1G': { plan: 'North Star 1Gbps Home', rate: 55 }, '2G': { plan: 'North Star 2Gbps Home', rate: 75 }, '5G': { plan: 'North Star 5Gbps Home', rate: 110 } },
      smb: { '1G': { plan: 'North Star Business 1Gbps', rate: 299 }, '2G': { plan: 'North Star Business 2Gbps', rate: 449 } },
      enterprise: { '5G': { plan: 'North Star Enterprise 5G MPLS', rate: 4200 }, '2G': { plan: 'North Star Enterprise 2G DIA', rate: 1800 } },
    };
    const planData = PLANS[newCust.tier]?.[newCust.speed] || { plan: 'Custom', rate: 99 };
    const customer = {
      id: nextCustomerId(),
      name: newCust.name || `New ${newCust.tier} Customer`,
      city: newCust.city,
      tier: newCust.tier,
      speed: newCust.speed,
      plan: planData.plan,
      rate: planData.rate,
      ip: `172.16.44.${Math.floor(Math.random() * 200) + 10}`,
      mac: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
      oltPort: Math.floor(Math.random() * 48) + 1,
      oltDevice: 'OLT-1 (Calix E7-2)',
      vlan: 1000 + Math.floor(Math.random() * 500),
      radiusSession: `0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase()}`,
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
      uptime: '0d 0h',
      latency: `${Math.floor(Math.random() * 8) + 2}ms`,
    };
    setCustomers(prev => [...prev, customer]);
    if (onAddCustomer) onAddCustomer(customer);
    setShowAddForm(false);
    setNewCust({ name: '', tier: 'residential', speed: '1G', city: 'Seattle' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--bg-root)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-primary)', flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Stats */}
        {[
          { label: 'Total', value: customers.length, color: '#60a5fa' },
          { label: 'Residential', value: customers.filter(c => c.tier === 'residential').length, color: '#6366f1' },
          { label: 'SMB', value: customers.filter(c => c.tier === 'smb').length, color: '#10b981' },
          { label: 'Enterprise', value: customers.filter(c => c.tier === 'enterprise').length, color: '#f59e0b' },
          { label: 'MRR', value: `$${totalMRR.toLocaleString()}`, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '3px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="🔍 Search customers..."
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-primary)', fontSize: 11, width: 180 }}
        />

        {/* Tier filter */}
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontSize: 11 }}>
          <option value="all">All Tiers</option>
          <option value="residential">🏠 Residential</option>
          <option value="smb">🏢 SMB</option>
          <option value="enterprise">🏗️ Enterprise</option>
        </select>

        {/* Action buttons */}
        <button onClick={() => setShowAddForm(f => !f)} style={{ background: 'var(--bg-accent)', border: '1px solid #60a5fa', borderRadius: 6, padding: '5px 10px', color: '#60a5fa', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
          + Add Customer
        </button>
        <button onClick={() => exportCustomersToExcel(customers)} style={{ background: '#052e16', border: '1px solid #22c55e', borderRadius: 6, padding: '5px 10px', color: '#22c55e', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
          ↓ Export Excel
        </button>
      </div>

      {/* Add customer form */}
      {showAddForm && (
        <div style={{ padding: '10px 12px', background: '#0a1628', borderBottom: '1px solid var(--border-accent)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Name / Company" value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 11, width: 180 }} />
          <select value={newCust.tier} onChange={e => setNewCust(p => ({ ...p, tier: e.target.value, speed: '1G' }))}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 11 }}>
            <option value="residential">🏠 Residential</option>
            <option value="smb">🏢 Small Business</option>
            <option value="enterprise">🏗️ Enterprise</option>
          </select>
          <select value={newCust.speed} onChange={e => setNewCust(p => ({ ...p, speed: e.target.value }))}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 11 }}>
            {newCust.tier === 'enterprise' ? ['5G', '2G'] : newCust.tier === 'smb' ? ['1G', '2G'] : ['1G', '2G', '5G']}
            {(newCust.tier === 'enterprise' ? ['5G', '2G'] : newCust.tier === 'smb' ? ['1G', '2G'] : ['1G', '2G', '5G']).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={newCust.city} onChange={e => setNewCust(p => ({ ...p, city: e.target.value }))}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 11 }}>
            {['Seattle', 'Bellevue', 'Spokane', 'Tacoma', 'Portland', 'Boise'].map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={handleAddCustomer} style={{ background: 'var(--bg-accent)', border: '1px solid #60a5fa', borderRadius: 5, padding: '4px 12px', color: '#60a5fa', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
            ✅ Provision
          </button>
          <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 5, padding: '4px 10px', color: '#64748b', cursor: 'pointer', fontSize: 11 }}>
            Cancel
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                      style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--border-primary)', color: '#64748b', fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} onClick={() => setSelectedCustomer(row.original)}
                  style={{ borderBottom: '1px solid var(--bg-secondary)', cursor: 'pointer', background: selectedCustomer?.id === row.original.id ? '#0f1f3d' : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (selectedCustomer?.id !== row.original.id) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (selectedCustomer?.id !== row.original.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: '6px 10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customer detail panel */}
        {selectedCustomer && (
          <div style={{ width: 260, flexShrink: 0, background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-primary)', padding: '12px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <TierBadge tier={selectedCustomer.tier} />
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{selectedCustomer.name}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>{selectedCustomer.city}</div>

            {[
              ['Plan', selectedCustomer.plan], ['Speed', selectedCustomer.speed], ['Monthly Rate', `$${selectedCustomer.rate}/mo`],
              ['IP Address', selectedCustomer.ip], ['MAC Address', selectedCustomer.mac],
              ['VLAN', selectedCustomer.vlan], ['OLT Device', selectedCustomer.oltDevice],
              ['OLT Port', selectedCustomer.oltPort], ['RADIUS Session', selectedCustomer.radiusSession],
              ['Status', selectedCustomer.status], ['Join Date', selectedCustomer.joinDate],
              ['Uptime', selectedCustomer.uptime], ['Latency', selectedCustomer.latency],
              ['SLA', selectedCustomer.sla || 'Best Effort'],
              ['Static IP', selectedCustomer.staticIp ? 'Yes' : 'No'],
              ['DDoS Protection', selectedCustomer.ddosProtection ? 'Yes' : 'No'],
              ['MPLS VPN', selectedCustomer.mplsVpn ? 'Yes' : 'No'],
            ].filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, borderBottom: '1px solid var(--bg-secondary)', paddingBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#64748b' }}>{k}</span>
                <span style={{ fontSize: 9, color: 'var(--text-primary)', fontWeight: 600, maxWidth: 140, textAlign: 'right', wordBreak: 'break-all' }}>{String(v)}</span>
              </div>
            ))}

            <button onClick={() => { setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id)); setSelectedCustomer(null); }}
              style={{ width: '100%', marginTop: 10, background: '#1a0000', border: '1px solid #ef4444', borderRadius: 6, padding: '6px', color: '#ef4444', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
              🗑 Remove Customer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
