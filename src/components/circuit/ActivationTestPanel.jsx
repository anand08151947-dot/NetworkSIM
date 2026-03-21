import { useState, useCallback, useEffect, useRef } from 'react';

function TestRow({ test, state }) {
  const isComplete = state?.done;
  const isRunning  = state?.running && !state?.done;
  const isPending  = !state;

  const barPct = isComplete ? 100 : isRunning ? state.progress : 0;

  const badgeStyle = {
    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
    background: isComplete ? '#052e16' : '#0a1628',
    color:      isComplete ? '#22c55e' : '#334155',
    border:     `1px solid ${isComplete ? '#166534' : '#1e2a3a'}`,
  };

  return (
    <tr style={{ borderBottom: '1px solid #0f172a' }}>
      {/* Test name */}
      <td style={{ padding: '8px 10px', fontSize: 11, color: isComplete ? '#e2e8f0' : isPending ? '#334155' : '#94a3b8', whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600 }}>{test.name}</div>
        <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{test.standard}</div>
      </td>
      {/* Target */}
      <td style={{ padding: '8px 10px', fontSize: 11, color: '#64748b', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {test.target}
      </td>
      {/* Progress bar + result */}
      <td style={{ padding: '8px 10px', minWidth: 160 }}>
        <div style={{ height: 6, background: '#1e2a3a', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%', width: `${barPct}%`, borderRadius: 3,
            background: isComplete ? '#22c55e' : '#3b82f6',
            transition: 'width 0.15s linear',
          }} />
        </div>
        {isComplete && (
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{test.detail}</div>
        )}
      </td>
      {/* Result */}
      <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {isComplete
          ? <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>{test.result}</span>
          : <span style={{ color: '#334155' }}>—</span>}
      </td>
      {/* PASS/FAIL */}
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <span style={badgeStyle}>{isComplete ? '✅ PASS' : '○'}</span>
      </td>
    </tr>
  );
}

export default function ActivationTestPanel({ tests, simComplete, speed, onExport }) {
  const [testStates, setTestStates] = useState({});
  const [running, setRunning]       = useState(false);
  const [done, setDone]             = useState(false);
  const cancelRef                   = useRef(false);
  const speedRef                    = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const runTests = useCallback(async () => {
    cancelRef.current = false;
    setTestStates({});
    setDone(false);
    setRunning(true);

    for (const test of tests) {
      if (cancelRef.current) break;

      // Animate progress bar from 0 → 100
      const totalMs   = Math.round(test.durationMs / speedRef.current);
      const tickMs    = 40;
      const steps     = Math.ceil(totalMs / tickMs);
      const increment = 100 / steps;

      let progress = 0;
      await new Promise(resolve => {
        const iv = setInterval(() => {
          progress = Math.min(progress + increment, 100);
          setTestStates(prev => ({
            ...prev,
            [test.id]: { running: true, done: false, progress: Math.round(progress) },
          }));
          if (progress >= 100) {
            clearInterval(iv);
            resolve();
          }
        }, tickMs);
      });

      // Mark done
      setTestStates(prev => ({
        ...prev,
        [test.id]: { running: false, done: true, progress: 100 },
      }));

      // Small gap between tests
      await new Promise(r => setTimeout(r, Math.round(120 / speedRef.current)));
    }

    setRunning(false);
    setDone(true);
  }, [tests]);

  const handleStop = () => { cancelRef.current = true; };

  const allDone   = done && tests.every(t => testStates[t.id]?.done);
  const passCount = Object.values(testStates).filter(s => s.done).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header toolbar */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 14px', flexShrink: 0,
        borderBottom: '1px solid #1e2a3a', background: '#070d1a', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>✅ Service Activation Testing</span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {allDone && (
            <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
              {passCount}/{tests.length} PASS — Service: READY FOR HANDOFF
            </span>
          )}

          {!simComplete && !running && !done && (
            <span style={{ fontSize: 11, color: '#475569' }}>
              Complete simulation to run activation tests
            </span>
          )}

          {simComplete && !running && !done && (
            <button onClick={runTests} style={{
              background: 'linear-gradient(135deg,#166534,#15803d)', border: '1px solid #22c55e',
              color: '#fff', borderRadius: 6, padding: '5px 14px',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>
              ▶ Run Activation Tests
            </button>
          )}

          {running && (
            <button onClick={handleStop} style={{
              background: '#450a0a', border: '1px solid #7f1d1d',
              color: '#fca5a5', borderRadius: 6, padding: '5px 14px',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>
              ⏹ Stop
            </button>
          )}

          {allDone && onExport && (
            <button onClick={onExport} style={{
              background: '#0c2340', border: '1px solid #1e4976',
              color: '#38bdf8', borderRadius: 6, padding: '5px 14px',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}>
              ⬇ Export Report
            </button>
          )}
        </div>
      </div>

      {/* Test table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#070d1a', zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
              {['Test', 'Target', 'Progress', 'Result', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '7px 10px', fontSize: 10, color: '#475569',
                  textAlign: h === 'Target' || h === 'Result' ? 'right' : h === 'Status' ? 'center' : 'left',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <TestRow
                key={test.id}
                test={test}
                state={testStates[test.id] ?? null}
              />
            ))}
          </tbody>
        </table>

        {/* Completion card */}
        {allDone && (
          <div style={{
            margin: 12, padding: '14px 18px', borderRadius: 8,
            background: '#052e16', border: '1px solid #22c55e',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
              All Activation Tests Passed — Circuit Approved for Customer Handoff
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
              RFC 2544 · Y.1564 · ITU-T Y.1731 · ITU-T G.826 — all thresholds met
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
