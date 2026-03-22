import { useState, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { SITES, CIRCUIT_TYPES, EQUIPMENT_STACKS, buildPhaseFlow,
  buildInventorySnapshot, buildFeasibilityGates, buildProtectionPaths, buildActivationTests }
  from '../../data/circuitPlans';
import CircuitWizard from '../circuit/CircuitWizard';
import EquipmentChain from '../circuit/EquipmentChain';
import OpticalBudgetCalc from '../circuit/OpticalBudgetCalc';
import PhaseStepper from '../circuit/PhaseStepper';
import InventoryScoreboard from '../circuit/InventoryScoreboard';
import FeasibilityGates from '../circuit/FeasibilityGates';
import PathMap from '../circuit/PathMap';
import ActivationTestPanel from '../circuit/ActivationTestPanel';
import DeviceConfigPanel from '../circuit/DeviceConfigPanel';
import StepConfigViewer from '../circuit/StepConfigViewer';

const DEFAULT_FORM = {
  circuitType: 'l3vpn',
  aSite:       'sea',
  zSite:       'pdx',
  bandwidth:   '10G',
  protection:  'diverse',
  slaTier:     'gold',
};

// Map: which device index to highlight during each phase (0-based)
function deviceIndexForPhase(phaseIdx, stackLen) {
  if (stackLen === 0) return -1;
  const map = [
    0,
    Math.floor(stackLen / 2),
    1,
    Math.floor(stackLen / 2),
    Math.floor(stackLen / 2),
    Math.floor(stackLen / 2) - 1,
    0,
    stackLen - 1,
  ];
  return map[phaseIdx] ?? Math.floor(stackLen / 2);
}

const INNER_TABS = [
  { id: 'sim',       label: '📋 Simulation' },
  { id: 'inventory', label: '🗄 Inventory' },
  { id: 'pathmap',   label: '🗺 Path Map' },
  { id: 'tests',     label: '✅ Tests' },
  { id: 'configs',   label: '⚙️ Configs' },
];

export default function CircuitPlannerTab() {
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [running, setRunning]         = useState(false);
  const [plan, setPlan]               = useState(null);
  const [activePhaseIdx, setActivePhaseIdx] = useState(-1);
  const [activeStepIdx, setActiveStepIdx]   = useState(-1);
  const [stepTimestamps, setStepTimestamps] = useState({});
  const [speed, setSpeed]             = useState(1);
  const [history, setHistory]         = useState([]);
  const [rightTab, setRightTab]       = useState('sim');
  const [simComplete, setSimComplete] = useState(false);
  const [invAnimKey, setInvAnimKey]   = useState(0);
  const [activeStep, setActiveStep]   = useState(null);
  const [pinnedStep, setPinnedStep]   = useState(null);

  const cancelRef = useRef(false);
  const speedRef  = useRef(speed);
  speedRef.current = speed;

  const handleFormChange = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const resetSim = useCallback(() => {
    setActivePhaseIdx(-1);
    setActiveStepIdx(-1);
    setStepTimestamps({});
    setSimComplete(false);
    setActiveStep(null);
    setPinnedStep(null);
  }, []);

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
    setRightTab('sim');
    setInvAnimKey(k => k + 1);

    const delay = ms => new Promise(r => setTimeout(r, ms));
    const stepDelayMs  = () => Math.round(1200 / speedRef.current);
    const microDelayMs = () => Math.round(250 / speedRef.current);

    for (let pi = 0; pi < built.phases.length; pi++) {
      if (cancelRef.current) break;
      setActivePhaseIdx(pi);
      const phase = built.phases[pi];

      for (let si = 0; si < phase.steps.length; si++) {
        if (cancelRef.current) break;
        setActiveStepIdx(si);
        setActiveStep(phase.steps[si]);
        await delay(microDelayMs());
        setStepTimestamps(prev => ({ ...prev, [`${pi}-${si}`]: timestamp() }));
        await delay(stepDelayMs());
      }
    }

    if (!cancelRef.current) {
      setActivePhaseIdx(built.phases.length);
      setActiveStepIdx(-1);
      setSimComplete(true);
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
  }, [form, resetSim]);

  const handleStop = () => { cancelRef.current = true; setRunning(false); };

  const handleStepClick = useCallback((step) => {
    setPinnedStep(prev => prev === step ? null : step);
  }, []);

  // ── Derived data (useMemo — no setState in effects) ──────────────────────────
  const inventoryItems = useMemo(() =>
    form.aSite && form.zSite
      ? buildInventorySnapshot(form.aSite, form.zSite, form.bandwidth)
      : null,
    [form.aSite, form.zSite, form.bandwidth]
  );

  const feasibilityGates = useMemo(() =>
    plan
      ? buildFeasibilityGates(form.circuitType, form.bandwidth, form.slaTier, form.aSite, form.zSite)
      : null,
    [plan, form.circuitType, form.bandwidth, form.slaTier, form.aSite, form.zSite]
  );

  const protectionPaths = useMemo(() =>
    plan ? buildProtectionPaths(form.aSite, form.zSite, form.slaTier) : null,
    [plan, form.aSite, form.zSite, form.slaTier]
  );

  const activationTestDefs = useMemo(() =>
    buildActivationTests(form.bandwidth, form.slaTier),
    [form.bandwidth, form.slaTier]
  );

  const circType         = CIRCUIT_TYPES.find(c => c.id === form.circuitType);
  const needsOptical     = circType?.needsOptical ?? false;
  const stackLen         = (plan ? (EQUIPMENT_STACKS[form.circuitType] ?? []) : []).length;
  const activeDeviceIndex = activePhaseIdx >= 0 && activePhaseIdx < (plan?.phases.length ?? 0)
    ? deviceIndexForPhase(activePhaseIdx, stackLen)
    : -1;

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!plan) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Circuit Planner Report — NorthStar Fiber'],
      ['Order ID', plan.orderId],
      ['Circuit Type', form.circuitType.toUpperCase()],
      ['A-Site', (SITES.find(s => s.id === form.aSite)?.label ?? form.aSite)],
      ['Z-Site', (SITES.find(s => s.id === form.zSite)?.label ?? form.zSite)],
      ['Bandwidth', form.bandwidth],
      ['Protection', form.protection],
      ['SLA Tier', form.slaTier.toUpperCase()],
      ['Generated', new Date().toLocaleString()],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Circuit Summary');

    if (inventoryItems) {
      const invRows = inventoryItems.map(i => ({
        Resource: i.label,
        Available: i.avail,
        Total: i.total,
        Unit: i.unit || '',
        Status: i.avail <= (i.critAt ?? 0) ? 'CRITICAL' : i.avail <= (i.warnAt ?? 0) ? 'WARNING' : 'OK',
        Augmentation: i.augment || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invRows), 'Inventory');
    }

    if (feasibilityGates) {
      const gateRows = feasibilityGates.map(g => ({
        Phase: g.phaseId ?? '',
        Gate: g.name,
        Status: g.status,
        Detail: g.detail ?? '',
        Augmentation: g.augment ?? '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gateRows), 'Feasibility Gates');
    }

    XLSX.writeFile(wb, `circuit-report-${plan.orderId}.xlsx`);
  }, [plan, form, inventoryItems, feasibilityGates]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-card)', color: 'var(--text-primary)', overflow: 'hidden',
    }}>
      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '10px 16px', borderBottom: '1px solid #1e2a3a',
        background: 'var(--bg-primary)', flexShrink: 0,
      }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5, color: '#38bdf8' }}>
          📡 Telco Circuit Creation Planner
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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

        {plan && (
          <div style={{
            marginLeft: running ? 8 : 'auto',
            fontSize: 11, fontFamily: 'monospace',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-accent)',
            borderRadius: 5, padding: '3px 8px', color: '#f59e0b',
          }}>
            Order: {plan.orderId}
          </div>
        )}
      </div>

      {/* ── Main body: two columns ──────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left panel */}
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

          {history.length > 0 && (
            <div style={{
              background: 'var(--bg-primary)', border: '1px solid var(--border-accent)', borderRadius: 10,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 10 }}>
                📄 Session Circuit Registry
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    fontSize: 11, background: '#0a1628', borderRadius: 6,
                    padding: '6px 8px', lineHeight: 1.7, color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{h.orderId}</span>
                    {' · '}
                    <span style={{ color: '#38bdf8' }}>
                      {CIRCUIT_TYPES.find(c => c.id === h.circuitType)?.icon} {h.bandwidth}
                    </span>
                    {' · '}
                    {h.aSite.toUpperCase()}→{h.zSite.toUpperCase()}
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{h.ts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Inner sub-tab bar */}
          {plan && (
            <div style={{
              display: 'flex', gap: 2, padding: '6px 12px',
              borderBottom: '1px solid #1e2a3a', background: 'var(--bg-primary)', flexShrink: 0,
            }}>
              {INNER_TABS.map(t => {
                const isDisabled = t.id === 'tests' && !simComplete;
                // configs tab is always available once plan exists
                const isActive   = rightTab === t.id;
                return (
                  <button
                    key={t.id}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setRightTab(t.id)}
                    style={{
                      background: isActive ? '#0f3460' : 'transparent',
                      border: isActive ? '1px solid #1e5f9f' : '1px solid transparent',
                      color: isDisabled ? 'var(--border-subtle)' : isActive ? '#38bdf8' : '#64748b',
                      borderRadius: 6, padding: '4px 12px', fontSize: 11,
                      cursor: isDisabled ? 'not-allowed' : 'pointer', fontWeight: isActive ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
              {simComplete && (
                <button
                  onClick={handleExport}
                  style={{
                    marginLeft: 'auto', background: '#052e16', border: '1px solid #166534',
                    color: '#4ade80', borderRadius: 6, padding: '4px 12px', fontSize: 11,
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  📥 Export Report
                </button>
              )}
            </div>
          )}

          {/* Right panel content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {!plan && <EmptyState />}

            {plan && rightTab === 'sim' && (
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Step log — left */}
                <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #1e2a3a' }}>
                  <PhaseStepper
                    phases={plan.phases}
                    activePhaseIdx={activePhaseIdx}
                    activeStepIdx={activeStepIdx}
                    stepTimestamps={stepTimestamps}
                    speed={speed}
                    onSpeedChange={s => setSpeed(s)}
                    pinnedStep={pinnedStep}
                    onStepClick={handleStepClick}
                  />
                </div>
                {/* Live config panel — right */}
                <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    padding: '6px 12px', background: 'var(--bg-primary)',
                    borderBottom: '1px solid #1e2a3a', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8' }}>⚙️ Config</span>

                    {pinnedStep ? (
                      <>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: '#f59e0b',
                          background: '#1a1000', border: '1px solid #78350f',
                          borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5, textTransform: 'uppercase',
                        }}>
                          📌 PINNED
                        </span>
                        <span style={{ fontSize: 10, color: '#78350f', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pinnedStep.action}
                        </span>
                        <button
                          onClick={() => setPinnedStep(null)}
                          style={{
                            marginLeft: 'auto', background: '#0a1628', border: '1px solid var(--border-accent)',
                            color: '#64748b', borderRadius: 5, padding: '2px 8px', fontSize: 10,
                            cursor: 'pointer', fontWeight: 600,
                          }}
                        >
                          ✕ Unpin
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          color: running ? '#4ade80' : 'var(--text-muted)',
                          background: running ? '#052e16' : '#0a1220',
                          border: `1px solid ${running ? '#166534' : '#1e2a3a'}`,
                          borderRadius: 4, padding: '1px 6px', letterSpacing: 0.5, textTransform: 'uppercase',
                        }}>
                          {running ? '🔴 LIVE' : simComplete ? '✅ DONE' : '○ IDLE'}
                        </span>
                        {simComplete && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            — click any ✅ step to explore its config
                          </span>
                        )}
                        {running && (
                          <span style={{ fontSize: 10, color: 'var(--border-subtle)' }}>
                            — auto-follows active step
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <StepConfigViewer
                      activeStep={pinnedStep ?? activeStep}
                      activeDeviceIndex={activeDeviceIndex}
                      circuitType={form.circuitType}
                      form={form}
                      plan={plan}
                    />
                  </div>
                </div>
              </div>
            )}

            {plan && rightTab === 'inventory' && (
              <div style={{
                display: 'flex', flex: 1, overflow: 'hidden', gap: 12, padding: 12,
              }}>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {feasibilityGates && (
                    <FeasibilityGates
                      gates={feasibilityGates}
                      activePhaseIdx={activePhaseIdx}
                    />
                  )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {inventoryItems && (
                    <InventoryScoreboard
                      items={inventoryItems}
                      animKey={invAnimKey}
                    />
                  )}
                </div>
              </div>
            )}

            {plan && rightTab === 'pathmap' && protectionPaths && (
              <PathMap
                paths={protectionPaths}
                aId={form.aSite}
                zId={form.zSite}
              />
            )}

            {plan && rightTab === 'tests' && (
              <ActivationTestPanel
                tests={activationTestDefs}
                simComplete={simComplete}
                speed={speed}
                onExport={handleExport}
              />
            )}

            {plan && rightTab === 'configs' && (
              <DeviceConfigPanel
                circuitType={form.circuitType}
                form={form}
                plan={plan}
                activeDeviceIndex={activeDeviceIndex}
              />
            )}
          </div>
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
      color: 'var(--bg-accent)', userSelect: 'none',
    }}>
      <div style={{ fontSize: 56 }}>📡</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--bg-accent)' }}>
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
            fontSize: 11, background: 'var(--bg-primary)', border: '1px solid #1e2a3a',
            borderRadius: 5, padding: '3px 8px', color: 'var(--border-subtle)',
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
