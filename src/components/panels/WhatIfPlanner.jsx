import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { CollapsiblePanel } from '../UIComponents';

const STATUS_COLOR = (c) => c >= 80 ? '#ef4444' : c >= 55 ? '#f59e0b' : '#22c55e';
const TOOLTIP_STYLE = {
  contentStyle: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 10 },
  labelStyle: { color: '#94a3b8' },
};

function generateProjection(currentCap, addedSubs, totalCap) {
  const weeksToShow = 24;
  const weeklyGrowth = (addedSubs / 52) / totalCap * 100;
  return Array.from({ length: weeksToShow }, (_, i) => ({
    week: `W${i + 1}`,
    current: Math.min(99, parseFloat((currentCap + weeklyGrowth * i).toFixed(1))),
    augmented: Math.min(99, parseFloat((currentCap * 0.6 + weeklyGrowth * i * 0.6).toFixed(1))),
    threshold40: 40,
    threshold80: 80,
  }));
}

export default function WhatIfPlanner({ nodes }) {
  const [addedSubs, setAddedSubs] = useState(200);
  const [augment, setAugment] = useState(false);

  const bng = nodes.find(n => n.id === 'bng');
  const olt1 = nodes.find(n => n.id === 'olt_1');
  const agg = nodes.find(n => n.id === 'agg_switch');
  const metro = nodes.find(n => n.id === 'metro_cisco');

  const bngCap = bng?.data?.capacity || 38;
  const maxSubs = bng?.data?.maxSubscribers || 4000;
  const currentSubs = bng?.data?.subscribers || 1469;

  const projectedCap = Math.min(99, bngCap + (addedSubs / maxSubs) * 100);
  const oltCap = Math.min(99, (olt1?.data?.capacity || 34) + (addedSubs / 48) * 1.2);
  const aggCap = Math.min(99, (agg?.data?.capacity || 36) + (addedSubs / 200) * 8);

  const chartData = useMemo(
    () => generateProjection(bngCap, addedSubs, maxSubs),
    [bngCap, addedSubs, maxSubs]
  );

  const weeksTo80 = chartData.findIndex(d => d.current >= 80);
  const costPerAugment = 45000; // estimated OLT + labor
  const revenuePerSub = 75;
  const addedMRR = addedSubs * revenuePerSub;
  const breakEvenMonths = Math.ceil(costPerAugment / addedMRR);

  const impactedNodes = [
    { label: 'BNG (ASR 9000)', current: bngCap, projected: projectedCap, id: 'bng' },
    { label: 'OLT-1 (Calix E7-2)', current: olt1?.data?.capacity || 34, projected: oltCap, id: 'olt_1' },
    { label: 'Agg Switch (Nexus)', current: agg?.data?.capacity || 36, projected: aggCap, id: 'agg_switch' },
    { label: 'Metro Router (C8K)', current: metro?.data?.capacity || 33, projected: Math.min(99, (metro?.data?.capacity || 33) + addedSubs / 500 * 5), id: 'metro' },
  ];

  return (
    <CollapsiblePanel title="WHAT-IF: ADD SUBSCRIBERS" icon="🔮" defaultOpen={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>+0</span>
          <input type="range" min="0" max="2000" step="50" value={addedSubs}
            onChange={e => setAddedSubs(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#60a5fa', cursor: 'pointer' }} />
          <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>+2,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa' }}>+{addedSubs.toLocaleString()} subscribers</span>
          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>+${addedMRR.toLocaleString()}/mo MRR</span>
        </div>

        {/* Augment toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setAugment(a => !a)} style={{
            background: augment ? '#0f1f3d' : '#0a0f1e',
            border: `1px solid ${augment ? '#60a5fa' : '#334155'}`,
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
            fontSize: 10, color: augment ? '#60a5fa' : '#475569', fontWeight: augment ? 700 : 400,
          }}>
            {augment ? '✅' : '☐'} Simulate augmentation (+OLT, +BNG capacity)
          </button>
          {augment && <span style={{ fontSize: 9, color: '#a78bfa' }}>Est. cost: ${costPerAugment.toLocaleString()}</span>}
        </div>
      </div>

      {/* Financial summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Added MRR', value: `$${addedMRR.toLocaleString()}`, color: '#22c55e' },
          { label: 'Break-even', value: augment ? `${breakEvenMonths}mo` : '—', color: '#a78bfa' },
          { label: 'Weeks to 80%', value: weeksTo80 < 0 ? '>24w' : `${weeksTo80}w`, color: projectedCap >= 80 ? '#ef4444' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Impact on nodes */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}>NODE IMPACT</div>
        {impactedNodes.map(n => {
          const before = STATUS_COLOR(n.current);
          const after = STATUS_COLOR(augment ? n.projected * 0.6 : n.projected);
          const proj = augment ? Math.min(99, n.projected * 0.6) : n.projected;
          return (
            <div key={n.id} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>{n.label}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: before }}>{n.current.toFixed(0)}%</span>
                  <span style={{ fontSize: 9, color: '#334155' }}>→</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: after }}>{proj.toFixed(0)}%</span>
                  {proj >= 80 && <span style={{ fontSize: 8, color: '#ef4444', background: '#1a0000', borderRadius: 3, padding: '1px 4px' }}>CRITICAL</span>}
                  {proj >= 55 && proj < 80 && <span style={{ fontSize: 8, color: '#f59e0b', background: '#1a1000', borderRadius: 3, padding: '1px 4px' }}>WARN</span>}
                </div>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 3, height: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', height: '100%', background: before + '55', borderRadius: 3, width: `${n.current}%` }} />
                <div style={{ position: 'absolute', height: '100%', background: after, borderRadius: 3, width: `${proj}%`, opacity: 0.85, transition: 'width 0.3s' }} />
                {/* Threshold markers */}
                <div style={{ position: 'absolute', left: '40%', top: 0, bottom: 0, width: 1, background: '#f59e0b88' }} />
                <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: 1, background: '#ef444488' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Projection chart */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}>24-WEEK BNG CAPACITY PROJECTION</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="week" tick={{ fontSize: 8, fill: '#475569' }} interval={3} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#475569' }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [`${v}%`, n === 'current' ? 'Projected' : 'With Augment']} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="current" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={2} dot={false} name="current" />
            {augment && <Area type="monotone" dataKey="augmented" stroke="#22c55e" fill="#22c55e11" strokeWidth={2} dot={false} name="augmented" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CollapsiblePanel>
  );
}
