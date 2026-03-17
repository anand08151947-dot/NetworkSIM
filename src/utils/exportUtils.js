import * as XLSX from 'xlsx';

// ── Excel Export ───────────────────────────────────────────────
export function exportCustomersToExcel(customers) {
  const rows = customers.map(c => ({
    'ID': c.id,
    'Name / Company': c.name,
    'Tier': c.tier,
    'City': c.city,
    'Plan': c.plan,
    'Speed': c.speed,
    'Monthly Rate': `$${c.rate}`,
    'IP Address': c.ip,
    'MAC Address': c.mac,
    'VLAN': c.vlan,
    'OLT Device': c.oltDevice,
    'OLT Port': c.oltPort,
    'RADIUS Session': c.radiusSession,
    'Status': c.status,
    'Join Date': c.joinDate,
    'Uptime': c.uptime,
    'Latency': c.latency,
    'SLA': c.sla || 'Best Effort',
    'Static IP': c.staticIp ? 'Yes' : 'No',
    'DDoS Protection': c.ddosProtection ? 'Yes' : 'No',
    'MPLS VPN': c.mplsVpn ? 'Yes' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  // Summary sheet
  const summary = [
    { Metric: 'Total Customers', Value: customers.length },
    { Metric: 'Residential', Value: customers.filter(c => c.tier === 'residential').length },
    { Metric: 'Small Business', Value: customers.filter(c => c.tier === 'smb').length },
    { Metric: 'Enterprise', Value: customers.filter(c => c.tier === 'enterprise').length },
    { Metric: 'Monthly Revenue', Value: `$${customers.reduce((s, c) => s + c.rate, 0).toLocaleString()}` },
    { Metric: 'Active Customers', Value: customers.filter(c => c.status === 'active').length },
    { Metric: 'Export Date', Value: new Date().toISOString().slice(0, 10) },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  XLSX.writeFile(wb, `northstar-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Event Log Export ───────────────────────────────────────────
export function exportEventLogToExcel(events) {
  if (!events.length) return;
  const rows = events.map(e => ({
    'Time': e.time,
    'System': e.system,
    'Action': e.action,
    'Detail': e.detail,
    'Simulation': e.color || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Event Log');
  XLSX.writeFile(wb, `northstar-audit-log-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Network State Export (JSON) ────────────────────────────────
export function exportNetworkState(nodes, customers, events) {
  const state = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    network: nodes.map(n => ({ id: n.id, label: n.data.label, capacity: n.data.capacity, status: n.data.status, layer: n.data.layer })),
    customerCount: customers.length,
    totalMRR: customers.reduce((s, c) => s + c.rate, 0),
    eventCount: events.length,
    events: events.slice(-50), // last 50 events
  };
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `northstar-network-state-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF / Print Export ─────────────────────────────────────────
export function exportToPDF() {
  const style = document.createElement('style');
  style.innerHTML = `@media print { body { background: white !important; color: black !important; } .no-print { display: none !important; } }`;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => document.head.removeChild(style), 1000);
}
