import { useState, useRef, useCallback } from 'react';
import { SITES, CIRCUIT_TYPES, EQUIPMENT_STACKS, buildPhaseFlow } from '../../data/circuitPlans';
import CircuitWizard from '../circuit/CircuitWizard';
import EquipmentChain from '../circuit/EquipmentChain';
import OpticalBudgetCalc from '../circuit/OpticalBudgetCalc';
import PhaseStepper from '../circuit/PhaseStepper';

// ── Default form state ────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  circuitType: 'l3vpn',
  aSite:       'sea',
  zSite:       'pdx',
  bandwidth:   '10G',
  protection:  'diverse',
  slaTier:     'gold',
};

// Map: which device index to highlight during each phase (0-based)
// Roughly: phase 1-2 → endpoints, phase 3-4 → middle transport, phase 5-6 → PE routers, etc.
function deviceIndexForPhase(phaseIdx, stackLen) {
  if (stackLen === 0) return -1;
  const map = [
    0,                               // phase 1 (intake) → A-site CE
    Math.floor(stackLen / 2),        // phase 2 (feasibility) → mid device
    1,                               // phase 3 (inventory) → A-side metro/agg
    Math.floor(stackLen / 2),        // phase 4 (optical) → DWDM
    Math.floor(stackLen / 2),        // phase 5 (path eng) → transport
    Math.floor(stackLen / 2) - 1,   // phase 6 (packet config) → PE
    0,                               // phase 7 (testing) → CE
    stackLen - 1,                   // phase 8 (monitoring) → Z-site CE
  ];
  return map[phaseIdx] ?? Math.floor(stackLen / 2);
}

export default function CircuitPlannerTab() {
  const [form, setForm]         = useState(DEFAULT_FORM);
  const [running, setRunning]   = useState(false);
  const [plan, setPlan]         = useState(null);          // built phase flow
  const [activePhaseIdx, setActivePhaseIdx] = useState(-1);
  const [activeStepIdx, setActiveStepIdx]   = useState(-1);
  const [stepTimestamps, setStepTimestamps] = useState({});
  const [speed, setSpeed]       = useState(1);
  const [history, setHistory]   = useState([]);            // completed circuits

  const cancelRef = useRef(false);
  const speedRef  = useRef(speed);
  speedRef.current = speed;

  const handleFormChange = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const resetSim = () => {
    setActivePhaseIdx(-1);
    setActiveStepIdx(-1);
    setStepTimestamps({});
  };

  const timestamp = () =>
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handlePlan = useCallback(async () => {
    const aLabel = SITES.find(s => s.id === form.aSite)?.label ?? form.aSite;
    const zLabel = SITES.find(s => s.id === form.zSite)?.label ?? form.zSite;
    const built  = buildPhaseFlow(form.circuitType, aLabel, zLabel, form.bandwidth, form.protection, form.slaTier);

    cancelRef.current = false;
    setPlan(built);
    resetSim();
    setRunning(true);

    const delay = ms => new Promise(r => setTimeout(r, ms));
    const stepDelayMs = () => Math.round(1200 / speedRef.current);
    const microDelayMs = () => Math.round(250 / speedRef.current);

    for (let pi = 0; pi < built.phases.length; pi++) {
      if (cancelRef.current) break;
      setActivePhaseIdx(pi);
      const phase = built.phases[pi];

      for (let si = 0; si < phase.steps.length; si++) {
        if (cancelRef.current) break;
        setActiveStepIdx(si);
        await delay(microDelayMs());
        setStepTimestamps(prev => ({ ...prev, [`${pi}-${si}`]: timestamp() }));
        await delay(stepDelayMs());
      }
    }

    if (!cancelRef.current) {
      setActivePhaseIdx(built.phases.length);  // triggers "complete" banner
      setActiveStepIdx(-1);
      setHistory(prev => [{
        orderId: built.orderId,
        circuitType: form.circuitType,
        aSite: form.aSite,
        zSite: form.zSite,
        bandwidth: form.bandwidth,
        protection: form.protection,
        slaTier: form.slaTier,
        ts: new Date().toLocaleString(),
      }, ...prev]);
    }
    setRunning(false);
  }, [form]);

  const handleStop = () => { cancelRef.current = true; setRunning(false); };

  const circType    = CIRCUIT_TYPES.find(c => c.id === form.circuitType);
  const needsOptical = circType?.needsOptical ?? false;
  const stackLen = (plan ? (EQUIPMENT_STACKS[form.circuitType] ?? []) : []).length;
  const activeDeviceIndex = activePhaseIdx >= 0 && activePhaseIdx < (plan?.phases.length ?? 0)
    ? deviceIndexForPhase(activePhaseIdx, stackLen)
    : -1;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#04080f', color: '#e2e8f0', overflow: 'hidden',
    }}>

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 16px', borderBottom: '1px solid #1e2a3a',
        background: '#070d1a', flexShrink: 0,
      }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5, color: '#38bdf8' }}>
          📡 Telco Circuit Creation Planner
        </div>
        <div style={{ fontSize: 11, color: '#475569' }}>
          Carrier-Grade End-to-End Circuit Orchestration Simulation
        </div>

        {running && (
          <button onClick={handleStop} style={{
            marginLeft: 'auto', background: '#450a0a', border: '1px solid #7f1d1d',
            color: '#fca5a5', borderRadius: 6, padding: '5px 14px',
            fontSize: 12, cursor: 'pointer', fontWeight: 600,
          }}>
            ⏹ Stop
          </button>
        )}

        {/* Order ID badge when running */}
        {plan && (
          <div style={{
            marginLeft: running ? 8 : 'auto',
            fontSize: 11, fontFamily: 'monospace',
            background: '#0b1629', border: '1px solid #1e3a5f',
            borderRadius: 5, padding: '3px 8px', color: '#f59e0b',
          }}>
            Order: {plan.orderId}
          </div>
        )}
      </div>

      {/* ── Main body: two columns ──────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel — wizard + chain + optical */}
        <div style={{
          width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
          gap: 12, padding: '12px 10px 12px 14px', overflowY: 'auto',
          borderRight: '1px solid #1e2a3a',
        }}>
          <CircuitWizard
            form={form}
            onChange={handleFormChange}
            onSubmit={handlePlan}
            running={running}
          />

          <EquipmentChain
            circuitType={form.circuitType}
            activeDeviceIndex={activeDeviceIndex}
            phaseIndex={activePhaseIdx}
          />

          {needsOptical && (
            <OpticalBudgetCalc
              aId={form.aSite}
              zId={form.zSite}
              bandwidth={form.bandwidth}
              visible={!!plan && activePhaseIdx >= 3}
            />
          )}

          {/* Circuit history */}
          {history.length > 0 && (
            <div style={{
              background: '#070d1a', border: '1px solid #1e3a5f', borderRadius: 10,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 10 }}>
                📄 Session Circuit Registry
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    fontSize: 11, background: '#0a1628', borderRadius: 6,
                    padding: '6px 8px', lineHeight: 1.7, color: '#94a3b8',
                  }}>
                    <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{h.orderId}</span>
                    {' · '}
                    <span style={{ color: '#38bdf8' }}>
                      {CIRCUIT_TYPES.find(c => c.id === h.circuitType)?.icon} {h.bandwidth}
                    </span>
                    {' · '}
                    {h.aSite.toUpperCase()}→{h.zSite.toUpperCase()}
                    <div style={{ color: '#475569', fontSize: 10 }}>{h.ts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — phase stepper + step log */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {plan ? (
            <PhaseStepper
              phases={plan.phases}
              activePhaseIdx={activePhaseIdx}
              activeStepIdx={activeStepIdx}
              stepTimestamps={stepTimestamps}
              speed={speed}
              onSpeedChange={s => setSpeed(s)}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      color: '#1e3a5f', userSelect: 'none',
    }}>
      <div style={{ fontSize: 56 }}>📡</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>
        Configure a circuit order and click Plan Circuit
      </div>
      <div style={{ fontSize: 13, color: '#0f2340', maxWidth: 420, textAlign: 'center', lineHeight: 1.7 }}>
        The simulator will animate through all 8 carrier-grade planning phases:
        Service Intake → Feasibility → Inventory → Optical Planning →
        Path Engineering → Packet Config → Activation Testing → Monitoring
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480 }}>
        {['L3VPN','EVC/E-LINE','DIA Internet','Wave/DWDM','Mobile Backhaul','DCI'].map(t => (
          <span key={t} style={{
            fontSize: 11, background: '#070d1a', border: '1px solid #1e2a3a',
            borderRadius: 5, padding: '3px 8px', color: '#334155',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
