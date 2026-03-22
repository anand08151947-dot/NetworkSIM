// FeasibilityGates — phase-level pass/warn/fail cards for Phase 2A

const STATUS_STYLE = {
  PASS: { bg: '#052e16', border: '#166534', fg: '#22c55e', icon: '✅' },
  WARN: { bg: '#451a00', border: '#92400e', fg: '#f59e0b', icon: '⚠️' },
  FAIL: { bg: '#450a0a', border: '#7f1d1d', fg: '#ef4444', icon: '❌' },
};

const PHASE_LABELS = [
  { id: 1, icon: '📋', label: 'Service Intake'      },
  { id: 2, icon: '🔍', label: 'Feasibility'         },
  { id: 3, icon: '🗄️', label: 'Inventory'           },
  { id: 4, icon: '🌊', label: 'Optical Planning'    },
  { id: 5, icon: '🗺️', label: 'Path Engineering'   },
  { id: 6, icon: '⚙️', label: 'Packet Config'      },
  { id: 7, icon: '✅', label: 'Activation Testing'  },
  { id: 8, icon: '📡', label: 'Monitoring'          },
];

function GateCard({ gate, phase, checked }) {
  const s = STATUS_STYLE[gate?.status ?? 'PASS'];

  if (!checked) {
    return (
      <div style={{
        background: 'var(--bg-primary)', border: '1px solid #1e2a3a', borderRadius: 8,
        padding: '10px 12px', opacity: 0.35,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>{phase.icon}</span>
          <span style={{ fontSize: 11, color: 'var(--border-subtle)', fontWeight: 600 }}>{phase.label}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--bg-accent)' }}>○ Pending</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8,
      padding: '10px 12px', animation: 'gate-in 0.4s ease forwards',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: gate?.augment ? 8 : 0 }}>
        <span style={{ fontSize: 14 }}>{phase.icon}</span>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>{gate?.name ?? phase.label}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 700,
          background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
          borderRadius: 4, padding: '1px 6px',
        }}>
          {s.icon} {gate?.status}
        </span>
      </div>

      {gate?.detail && (
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 22 }}>
          {gate.detail}
        </div>
      )}

      {gate?.augment && (
        <div style={{
          marginTop: 7, padding: '6px 8px', borderRadius: 5,
          background: 'var(--bg-secondary)', border: '1px solid #92400e',
          fontSize: 10, color: '#fbbf24', lineHeight: 1.6,
        }}>
          🔧 <strong>Augmentation:</strong> {gate.augment}
        </div>
      )}
    </div>
  );
}

export default function FeasibilityGates({ gates, activePhaseIdx }) {
  const phasesChecked = Math.max(0, activePhaseIdx); // phases 1..phasesChecked are done

  const critCount = gates?.filter(g => g.status !== 'PASS').length ?? 0;
  const passCount = gates?.filter(g => g.status === 'PASS').length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes gate-in { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', gap: 12, padding: '10px 14px',
        borderBottom: '1px solid #1e2a3a', background: 'var(--bg-primary)', flexShrink: 0, alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>🔍 Feasibility Gates</span>
        {gates && (
          <>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>{passCount} PASS</span>
            {critCount > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>{critCount} WARN</span>}
          </>
        )}
        {!gates && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--border-subtle)' }}>Run a simulation to see results</span>}
      </div>

      {/* Gate cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PHASE_LABELS.map((phase) => {
          const gate    = gates?.find(g => g.phaseId === phase.id);
          const checked = phasesChecked >= phase.id;
          return <GateCard key={phase.id} gate={gate} phase={phase} checked={checked} />;
        })}
      </div>
    </div>
  );
}
