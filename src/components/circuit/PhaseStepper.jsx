import { useEffect, useRef } from 'react';

const PHASE_COLOR = '#38bdf8';

function PhaseTab({ phase, status }) {
  const bg =
    status === 'done'    ? '#052e16' :
    status === 'active'  ? '#0c1f3f' :
    '#070d1a';
  const border =
    status === 'done'    ? '#22c55e' :
    status === 'active'  ? PHASE_COLOR :
    '#1e2a3a';
  const textColor =
    status === 'done'    ? '#22c55e' :
    status === 'active'  ? '#fff' :
    '#334155';
  const icon =
    status === 'done'    ? '✅' :
    status === 'active'  ? '🔄' :
    '○';

  return (
    <div style={{
      background: bg, border: `1.5px solid ${border}`, borderRadius: 7,
      padding: '6px 10px', textAlign: 'center', minWidth: 88, flexShrink: 0,
      transition: 'all 0.3s',
      boxShadow: status === 'active' ? `0 0 12px ${PHASE_COLOR}55` : 'none',
    }}>
      <div style={{ fontSize: 14, marginBottom: 2 }}>{phase.icon}</div>
      <div style={{ fontSize: 10, color: textColor, fontWeight: status === 'active' ? 700 : 400, lineHeight: 1.3 }}>
        {phase.label}
      </div>
      <div style={{ fontSize: 10, marginTop: 3 }}>{icon}</div>
    </div>
  );
}

function StepRow({ step, status, ts, isPinned, onClick }) {
  const isActive = status === 'active';
  const isDone   = status === 'done';
  const isFailed = status === 'failed';
  const isClickable = isDone || isFailed;

  const icon = isFailed ? '❌' : isDone ? '✅' : isActive ? '🔄' : '○';
  const textColor = isFailed ? '#ef4444' : isDone ? '#94a3b8' : isActive ? '#e2e8f0' : '#334155';

  const bg =
    isPinned ? '#1a1000' :
    isActive  ? '#0c1f3f' :
    'transparent';
  const borderColor =
    isPinned ? '#f59e0b' :
    isActive  ? PHASE_COLOR :
    'transparent';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      title={isClickable ? (isPinned ? 'Click to unpin' : 'Click to view config') : undefined}
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        padding: '6px 10px', borderRadius: 6,
        background: bg,
        borderLeft: `3px solid ${borderColor}`,
        transition: 'all 0.2s',
        cursor: isClickable ? 'pointer' : 'default',
        ...(isClickable && !isPinned ? { ':hover': { background: '#0a1220' } } : {}),
      }}
    >
      {/* Icon + timestamp */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 28 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        {ts && <span style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace' }}>{ts}</span>}
      </div>
      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <span style={{
            fontSize: 9, background: '#0b1629', border: '1px solid #1e3a5f',
            borderRadius: 4, padding: '1px 5px', color: '#64748b',
            fontFamily: 'monospace', whiteSpace: 'nowrap',
          }}>
            {step.system}
          </span>
          <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: textColor }}>
            {step.action}
          </span>
          {isPinned && (
            <span style={{ fontSize: 9, color: '#f59e0b', background: '#1a1000', border: '1px solid #78350f', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
              📌 PINNED
            </span>
          )}
        </div>
        {(isActive || isDone || isFailed) && (
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
            {step.detail}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhaseStepper({ phases, activePhaseIdx, activeStepIdx, stepTimestamps, speed, onSpeedChange, pinnedStep, onStepClick }) {
  const logRef = useRef(null);

  // Auto-scroll log to active step
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activePhaseIdx, activeStepIdx]);

  // Flatten all steps with their phase index + step index for the log
  const allSteps = [];
  phases.forEach((phase, pi) => {
    phase.steps.forEach((step, si) => allSteps.push({ phase, pi, step, si }));
  });

  // Determine global cursor
  let globalActive = -1;
  let cursor = 0;
  for (let pi = 0; pi < phases.length; pi++) {
    for (let si = 0; si < phases[pi].steps.length; si++) {
      if (pi === activePhaseIdx && si === activeStepIdx) { globalActive = cursor; }
      cursor++;
    }
  }

  const SPEEDS = [0.5, 1, 2, 5];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0, overflow: 'hidden' }}>

      {/* Phase strip + speed control */}
      <div style={{
        background: '#070d1a', borderBottom: '1px solid #1e2a3a',
        padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Speed control */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>Speed:</span>
          {SPEEDS.map(s => (
            <button key={s} onClick={() => onSpeedChange(s)} style={{
              background: speed === s ? '#1d4ed8' : '#0b1629',
              border: '1px solid #1e3a5f', borderRadius: 5,
              color: speed === s ? '#fff' : '#64748b',
              fontSize: 11, padding: '2px 8px', cursor: 'pointer',
              fontWeight: speed === s ? 700 : 400,
            }}>
              {s}×
            </button>
          ))}
        </div>

        {/* Phase tabs — scrollable */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {phases.map((phase, pi) => {
            const status =
              pi < activePhaseIdx  ? 'done' :
              pi === activePhaseIdx ? 'active' :
              'pending';
            return <PhaseTab key={pi} phase={phase} status={status} />;
          })}
        </div>
      </div>

      {/* Step log */}
      <div
        ref={logRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '8px 8px',
          background: '#04080f',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}
      >
        {allSteps.map(({ pi, step, si }, globalIdx) => {
          let status = 'pending';
          if (globalIdx < globalActive)  status = 'done';
          if (globalIdx === globalActive) status = 'active';
          // Phases before active phase: all steps done
          if (pi < activePhaseIdx) status = 'done';

          return (
            <StepRow
              key={`${pi}-${si}`}
              step={step}
              status={status}
              ts={stepTimestamps[`${pi}-${si}`] ?? null}
              isPinned={pinnedStep === step}
              onClick={() => onStepClick && onStepClick(step)}
            />
          );
        })}

        {/* Completion banner */}
        {activePhaseIdx >= phases.length && (
          <div style={{
            margin: '12px 0', padding: '14px', borderRadius: 8, textAlign: 'center',
            background: '#052e16', border: '1px solid #22c55e',
            color: '#22c55e', fontWeight: 700, fontSize: 14,
          }}>
            ✅ Circuit Planning Complete — All 8 Phases Passed — Service: IN-SERVICE
          </div>
        )}
      </div>
    </div>
  );
}
