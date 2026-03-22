import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Generate fake 24-hour historical data based on current capacity
function generateHistory(currentCap, hours = 24) {
  const data = [];
  let val = Math.max(5, currentCap - Math.random() * 12);
  const now = new Date();
  for (let i = hours; i >= 0; i--) {
    const ts = new Date(now - i * 3600000);
    const hour = ts.getHours();
    // Simulate daily traffic pattern
    const peakFactor = hour >= 17 && hour <= 22 ? 1.3 : hour >= 8 && hour <= 18 ? 1.1 : 0.7;
    const noise = (Math.random() - 0.5) * 4;
    val = Math.max(2, Math.min(99, val + noise * peakFactor + (currentCap - val) * 0.05));
    data.push({ time: `${ts.getHours().toString().padStart(2, '0')}:00`, capacity: Math.round(val * 10) / 10 });
  }
  return data;
}

const STATUS_COLORS = { healthy: '#22c55e', warning: '#f59e0b', critical: '#ef4444', provisioning: '#facc15' };

export default function CapacityChart({ nodeData, height = 160 }) {
  const data = useMemo(() => generateHistory(nodeData.capacity || 20), [nodeData.capacity]);
  const color = STATUS_COLORS[nodeData.status] || '#22c55e';
  const max = Math.max(...data.map(d => d.capacity));
  const min = Math.min(...data.map(d => d.capacity));
  const avg = Math.round(data.reduce((s, d) => s + d.capacity, 0) / data.length);

  return (
    <div style={{ padding: '10px 0 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingInline: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>24h Capacity History</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 9, color: '#22c55e' }}>Min: {min.toFixed(1)}%</span>
          <span style={{ fontSize: 9, color: '#f59e0b' }}>Avg: {avg}%</span>
          <span style={{ fontSize: 9, color: '#ef4444' }}>Peak: {max.toFixed(1)}%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${nodeData.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" />
          <XAxis dataKey="time" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} interval={5} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{ background: 'var(--tooltip-bg)', border: `1px solid ${color}`, borderRadius: 6, fontSize: 10 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            itemStyle={{ color }}
            formatter={(v) => [`${v}%`, 'Capacity']}
          />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '40% Threshold', fill: '#f59e0b', fontSize: 8, position: 'insideTopRight' }} />
          <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '80% Critical', fill: '#ef4444', fontSize: 8, position: 'insideTopRight' }} />
          <Area type="monotone" dataKey="capacity" stroke={color} strokeWidth={2} fill={`url(#grad-${nodeData.label})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
