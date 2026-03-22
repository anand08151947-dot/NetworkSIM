import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { exportCustomersToExcel, exportEventLogToExcel, exportNetworkState } from '../../utils/exportUtils';
import { saveScenario, loadAllScenarios, deleteScenario, loadScenarioIntoNodes } from '../../utils/scenarioManager';
import { useState } from 'react';

const TIER_COLORS = { residential: '#6366f1', smb: '#10b981', enterprise: '#f59e0b' };

// Generate 12-month growth projection from current customer count
function generateProjection(currentCount, monthlyGrowthRate = 0.04) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date().getMonth();
  return Array.from({ length: 12 }, (_, i) => {
    const monthIdx = (now + i) % 12;
    const projected = Math.round(currentCount * Math.pow(1 + monthlyGrowthRate, i));
    const capacity = Math.round((projected / 6000) * 100);
    return {
      month: months[monthIdx],
      customers: projected,
      capacity,
      threshold40: 40,
      threshold80: 80,
    };
  });
}

// Weeks-to-threshold calculator
function weeksToThreshold(currentCap, threshold = 80, weeklyGrowth = 0.7) {
  if (currentCap >= threshold) return 0;
  return Math.ceil((threshold - currentCap) / weeklyGrowth);
}

const Section = ({ title, children }) => (
  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: '14px', marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const TOOLTIP_STYLE = { contentStyle: { background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 6, fontSize: 10 }, labelStyle: { color: 'var(--text-secondary)' } };

export default function RevenueTab({ customers, nodes, events, setNodes }) {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarios, setScenarios] = useState(loadAllScenarios);
  const [saved, setSaved] = useState(false);

  const mrrByTier = useMemo(() => {
    const groups = { residential: 0, smb: 0, enterprise: 0 };
    customers.forEach(c => { groups[c.tier] = (groups[c.tier] || 0) + c.rate; });
    return [
      { tier: 'Residential', mrr: groups.residential, color: TIER_COLORS.residential, count: customers.filter(c => c.tier === 'residential').length },
      { tier: 'SMB', mrr: groups.smb, color: TIER_COLORS.smb, count: customers.filter(c => c.tier === 'smb').length },
      { tier: 'Enterprise', mrr: groups.enterprise, color: TIER_COLORS.enterprise, count: customers.filter(c => c.tier === 'enterprise').length },
    ];
  }, [customers]);

  const totalMRR = customers.reduce((s, c) => s + c.rate, 0);
  const totalARR = totalMRR * 12;
  const avgRevPerSub = customers.length ? Math.round(totalMRR / customers.length) : 0;
  const projectedMRR = Math.round(totalMRR * 1.04 * 12); // 4% monthly growth

  const projection = useMemo(() => generateProjection(customers.length), [customers.length]);

  const speedMix = useMemo(() => {
    const mix = {};
    customers.forEach(c => { mix[c.speed] = (mix[c.speed] || 0) + 1; });
    return Object.entries(mix).map(([speed, count]) => ({ speed, count, pct: Math.round(count / customers.length * 100) }));
  }, [customers]);

  const criticalNodes = nodes.filter(n => n.data.capacity >= 80);
  const warningNodes = nodes.filter(n => n.data.capacity >= 55 && n.data.capacity < 80);

  // Critical node thresholds
  const criticalNodeData = useMemo(() => {
    return ['olt_1', 'bng', 'agg_switch', 'metro_cisco', 'core_router_1', 'cgnat', 'radius', 'border_router'].map(id => {
      const node = nodes.find(n => n.id === id);
      const cap = node?.data?.capacity || 0;
      return {
        name: node?.data?.label?.split('—')[0]?.split('(')[0]?.trim().slice(0, 14) || id,
        capacity: cap,
        weeks40: weeksToThreshold(cap, 40),
        weeks80: weeksToThreshold(cap, 80),
      };
    });
  }, [nodes]);

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    saveScenario(scenarioName, nodes, customers, events);
    setScenarios(loadAllScenarios());
    setScenarioName('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoadScenario = (scenario) => {
    const newNodes = loadScenarioIntoNodes(scenario, nodes);
    setNodes(newNodes);
  };

  const handleDeleteScenario = (id) => {
    deleteScenario(id);
    setScenarios(loadAllScenarios());
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--bg-root)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignContent: 'start' }}>

      {/* Revenue KPIs */}
      <Section title="💰 REVENUE OVERVIEW">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { label: 'Monthly MRR', value: `$${totalMRR.toLocaleString()}`, color: '#22c55e' },
            { label: 'Annual ARR', value: `$${(totalARR / 1000).toFixed(0)}K`, color: '#22c55e' },
            { label: 'Avg Rev/Sub', value: `$${avgRevPerSub}/mo`, color: '#60a5fa' },
            { label: 'Proj. Next MRR', value: `$${(totalMRR * 1.04).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0a0f1e', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={mrrByTier} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" />
            <XAxis dataKey="tier" tick={{ fontSize: 9, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...TOOLTIP_STYLE} formatter={v => [`$${v.toLocaleString()}`, 'MRR']} />
            <Bar dataKey="mrr" radius={[4, 4, 0, 0]}>
              {mrrByTier.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Customer Mix */}
      <Section title="👥 CUSTOMER MIX">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={mrrByTier} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={65} label={({ tier, pct }) => `${tier} ${Math.round(pct || 0)}%`} labelLine={false} fontSize={9}>
              {mrrByTier.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Customers']} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 6 }}>
          {mrrByTier.map(t => (
            <div key={t.tier} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.color }}>{t.count}</div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{t.tier}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: 8, paddingTop: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 5 }}>Speed Mix</div>
          {speedMix.map(s => (
            <div key={s.speed} style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: '#60a5fa', fontWeight: 700 }}>{s.speed}</span>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{s.count} ({s.pct}%)</span>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 3, height: 4 }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: '#60a5fa', borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Predictive Planning */}
      <Section title="📈 PREDICTIVE CAPACITY PLANNING">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          {criticalNodes.length > 0 && <div style={{ background: '#1a0000', border: '1px solid #ef4444', borderRadius: 6, padding: '6px 8px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700 }}>🚨 {criticalNodes.length} node(s) CRITICAL ≥80%</div>
          </div>}
          {warningNodes.length > 0 && <div style={{ background: '#1a1000', border: '1px solid #f59e0b', borderRadius: 6, padding: '6px 8px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>⚠️ {warningNodes.length} node(s) WARNING ≥55%</div>
          </div>}
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={projection} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" />
            <XAxis dataKey="month" tick={{ fontSize: 8, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 8, fill: 'var(--text-muted)' }} domain={[0, 100]} unit="%" />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'BNG Capacity']} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="capacity" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 8 }}>
          {criticalNodeData.slice(0, 4).map(n => (
            <div key={n.name} style={{ marginBottom: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{n.name}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 8, color: '#f59e0b' }}>40%: {n.weeks40 === 0 ? 'NOW' : `${n.weeks40}w`}</span>
                  <span style={{ fontSize: 8, color: '#ef4444' }}>80%: {n.weeks80 === 0 ? 'NOW' : `${n.weeks80}w`}</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 3, height: 4 }}>
                <div style={{ width: `${Math.min(n.capacity, 100)}%`, height: '100%', background: n.capacity >= 80 ? '#ef4444' : n.capacity >= 55 ? '#f59e0b' : '#22c55e', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Growth Projection */}
      <Section title="📊 12-MONTH SUBSCRIBER GROWTH">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={projection} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-elevated)" />
            <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 8, fill: '#64748b' }} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [v, n === 'customers' ? 'Subscribers' : 'MRR']} />
            <Line type="monotone" dataKey="customers" stroke="#a78bfa" strokeWidth={2} dot={false} name="customers" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 8, fontSize: 9, color: '#64748b', lineHeight: 1.6 }}>
          At 4% monthly growth: +{Math.round(customers.length * 0.04)}/mo avg | ARR in 12mo: ${(projectedMRR / 1000).toFixed(0)}K | CapEx trigger: {weeksToThreshold(nodes.find(n => n.id === 'bng')?.data?.capacity || 38, 70)}w
        </div>
      </Section>

      {/* Export */}
      <Section title="📤 EXPORT & REPORTING">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: '📊 Export Customer List (Excel)', action: () => exportCustomersToExcel(customers), color: '#22c55e' },
            { label: '📋 Export Audit Log (Excel)', action: () => exportEventLogToExcel(events), color: '#60a5fa' },
            { label: '🗂️ Export Network State (JSON)', action: () => exportNetworkState(nodes, customers, events), color: '#a78bfa' },
            { label: '🖨️ Print / Save PDF', action: () => window.print(), color: '#f59e0b' },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              background: `${btn.color}11`, border: `1px solid ${btn.color}44`, borderRadius: 7,
              padding: '8px 12px', cursor: 'pointer', color: btn.color, fontSize: 11, fontWeight: 600, textAlign: 'left',
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Scenario Save/Load */}
      <Section title="💾 SCENARIO MANAGEMENT">
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            placeholder="Scenario name (e.g. Q1 Baseline)"
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            style={{ flex: 1, background: '#0a0f1e', border: '1px solid var(--border-primary)', borderRadius: 5, padding: '5px 8px', color: 'var(--text-primary)', fontSize: 10 }}
          />
          <button onClick={handleSaveScenario} style={{ background: saved ? '#052e16' : 'var(--bg-elevated)', border: `1px solid ${saved ? '#22c55e' : 'var(--border-subtle)'}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', color: saved ? '#22c55e' : 'var(--text-secondary)', fontSize: 10, fontWeight: 700 }}>
            {saved ? '✅ Saved' : '💾 Save'}
          </button>
        </div>
        {scenarios.length === 0 && <div style={{ fontSize: 9, color: 'var(--border-subtle)', textAlign: 'center', padding: '10px 0' }}>No saved scenarios yet</div>}
        {scenarios.map(s => (
          <div key={s.id} style={{ background: '#0a0f1e', border: '1px solid var(--border-primary)', borderRadius: 7, padding: '7px 9px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{s.savedAt.slice(0, 16)} | {s.customerCount} customers | ${s.totalMRR?.toLocaleString()}/mo | Avg cap: {s.summary?.avgCapacity}%</div>
            </div>
            <button onClick={() => handleLoadScenario(s)} style={{ background: 'var(--bg-accent)', border: '1px solid #60a5fa', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', color: '#60a5fa', fontSize: 9 }}>Load</button>
            <button onClick={() => handleDeleteScenario(s.id)} style={{ background: '#1a0000', border: '1px solid #ef444466', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', color: '#ef4444', fontSize: 9 }}>Del</button>
          </div>
        ))}
      </Section>
    </div>
  );
}
