import { useState } from 'react';
import { FAULT_SCENARIOS } from '../../data/faultScenarios';

const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

export default function FaultInjector({ onRunFault, running, activeFaultId }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ background: '#0f172a', border: '1px solid #450a0a', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: '#1a0000', border: 'none', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 12 }}>⚡</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', flex: 1, textAlign: 'left', letterSpacing: 0.5 }}>FAULT INJECTION</span>
        <span style={{ color: '#475569', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>
            Inject real-world failure scenarios — watch failover & recovery
          </div>
          {Object.values(FAULT_SCENARIOS).map(fault => {
            const isActive = activeFaultId === fault.id;
            const sevColor = SEV_COLOR[fault.severity] || '#f59e0b';
            return (
              <button
                key={fault.id}
                onClick={() => onRunFault(fault.id)}
                disabled={running}
                style={{
                  background: isActive ? '#1a0000' : '#0a0f1e',
                  border: `1.5px solid ${isActive ? fault.color : '#1e293b'}`,
                  borderRadius: 7,
                  padding: '7px 9px',
                  cursor: running ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: running && !isActive ? 0.4 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? fault.color : '#cbd5e1', flex: 1 }}>
                    {fault.label}
                  </span>
                  <span style={{ fontSize: 8, color: sevColor, background: `${sevColor}22`, borderRadius: 3, padding: '1px 4px', textTransform: 'uppercase', fontWeight: 700 }}>
                    {fault.severity}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{fault.description}</div>
                <div style={{ fontSize: 9, color: '#334155', marginTop: 2 }}>
                  Recovery: {fault.recovery.description}
                </div>
              </button>
            );
          })}
          <div style={{ fontSize: 9, color: '#1e3a5f', borderTop: '1px solid #1e293b', paddingTop: 5, marginTop: 2, lineHeight: 1.5 }}>
            Tip: Faults animate affected nodes red and show failover path in real-time.
          </div>
        </div>
      )}
    </div>
  );
}
