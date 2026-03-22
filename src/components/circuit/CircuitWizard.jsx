import { SITES, CIRCUIT_TYPES, BANDWIDTH_OPTIONS, PROTECTION_LEVELS, SLA_TIERS } from '../../data/circuitPlans';

const SELECT_STYLE = {
  background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-accent)',
  borderRadius: 6, padding: '6px 10px', fontSize: 13, width: '100%', cursor: 'pointer',
};
const LABEL_STYLE = { fontSize: 11, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 };
const FIELD_STYLE = { display: 'flex', flexDirection: 'column', gap: 4 };

export default function CircuitWizard({ form, onChange, onSubmit, running }) {
  const aOptions = SITES.filter(s => s.id !== form.zSite);
  const zOptions = SITES.filter(s => s.id !== form.aSite);
  const circType = CIRCUIT_TYPES.find(c => c.id === form.circuitType);

  const field = (label, key, options, labelKey = 'label') => (
    <div style={FIELD_STYLE}>
      <div style={LABEL_STYLE}>{label}</div>
      <select
        style={SELECT_STYLE}
        value={form[key]}
        disabled={running}
        onChange={e => onChange(key, e.target.value)}
      >
        {options.map(o => (
          <option key={o.id ?? o} value={o.id ?? o}>
            {o[labelKey] ?? o}
          </option>
        ))}
      </select>
    </div>
  );

  const canSubmit = form.aSite && form.zSite && form.aSite !== form.zSite && !running;

  return (
    <div style={{
      background: 'var(--bg-primary)', border: '1px solid var(--border-accent)', borderRadius: 10,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 240,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', letterSpacing: 0.5 }}>
        📋 Service Order
      </div>

      {/* Circuit Type */}
      <div style={FIELD_STYLE}>
        <div style={LABEL_STYLE}>Circuit Type</div>
        <select
          style={SELECT_STYLE}
          value={form.circuitType}
          disabled={running}
          onChange={e => onChange('circuitType', e.target.value)}
        >
          {CIRCUIT_TYPES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      {/* A / Z Sites */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={FIELD_STYLE}>
          <div style={LABEL_STYLE}>A-Site (Origin)</div>
          <select style={SELECT_STYLE} value={form.aSite} disabled={running}
            onChange={e => onChange('aSite', e.target.value)}>
            {aOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={FIELD_STYLE}>
          <div style={LABEL_STYLE}>Z-Site (Termination)</div>
          <select style={SELECT_STYLE} value={form.zSite} disabled={running}
            onChange={e => onChange('zSite', e.target.value)}>
            {zOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Bandwidth + Protection */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={FIELD_STYLE}>
          <div style={LABEL_STYLE}>Bandwidth (CIR)</div>
          <select style={SELECT_STYLE} value={form.bandwidth} disabled={running}
            onChange={e => onChange('bandwidth', e.target.value)}>
            {BANDWIDTH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div style={FIELD_STYLE}>
          <div style={LABEL_STYLE}>Protection Level</div>
          <select style={SELECT_STYLE} value={form.protection} disabled={running}
            onChange={e => onChange('protection', e.target.value)}>
            {PROTECTION_LEVELS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {/* SLA Tier */}
      {field('SLA Tier', 'slaTier', SLA_TIERS)}

      {/* Auto-derived info */}
      {form.aSite && form.zSite && form.aSite !== form.zSite && (
        <div style={{
          background: '#0a1628', borderRadius: 6, padding: '8px 10px',
          fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8,
          borderLeft: '3px solid var(--border-accent)',
        }}>
          <span style={{ color: '#38bdf8' }}>Type:</span> {circType?.icon} {circType?.label}<br />
          <span style={{ color: '#38bdf8' }}>SLA:</span>{' '}
          {SLA_TIERS.find(s => s.id === form.slaTier)?.label}<br />
          <span style={{ color: '#38bdf8' }}>Latency target:</span>{' '}
          ≤{SLA_TIERS.find(s => s.id === form.slaTier)?.latencyMs} ms<br />
          <span style={{ color: '#38bdf8' }}>Order ID:</span>{' '}
          <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>auto-generated on Plan</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          background: canSubmit ? 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' : 'var(--bg-accent)',
          color: canSubmit ? '#fff' : 'var(--text-muted)',
          border: 'none', borderRadius: 7, padding: '10px 0',
          fontWeight: 700, fontSize: 13, cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s', letterSpacing: 0.5,
        }}
      >
        {running ? '⏳ Planning in Progress…' : '📡 Plan Circuit'}
      </button>
    </div>
  );
}
