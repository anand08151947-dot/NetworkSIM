import { useState, useCallback, useEffect } from 'react';
import { getStepConfig } from '../../data/stepConfigs';
import { getDeviceConfigs } from '../../data/circuitConfigs';

const LANG_COLORS = {
  'ios-xr': '#fde68a',
  'junos':  '#86efac',
  'sros':   '#93c5fd',
  'json':   '#c4b5fd',
  'eos':    '#f9a8d4',
  'cli':    '#94a3b8',
  'shell':  '#94a3b8',
};

const SYSTEM_COLORS = {
  'OSS':          '#f59e0b',
  'NetBox':       '#38bdf8',
  'NMS':          '#22c55e',
  'IPAM':         '#a78bfa',
  'PE Router':    '#fde68a',
  'QoS Engine':   '#fb923c',
  'SR Policy':    '#f472b6',
  'FRR':          '#34d399',
  'Path Eng':     '#60a5fa',
  'MPLS Ctrl':    '#fbbf24',
  'SLA Engine':   '#c084fc',
  'Telemetry':    '#2dd4bf',
  'Test Set':     '#86efac',
  'Route Policy': '#fb7185',
  'Opt Planner':  '#5c2d8e',
  'Optical Ctl':  '#818cf8',
  'Capacity Mgr': '#f97316',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{
        background:   copied ? '#052e16' : '#0a1628',
        border:       `1px solid ${copied ? '#166534' : '#1e3a5f'}`,
        color:        copied ? '#4ade80' : '#64748b',
        borderRadius: 5,
        padding:      '3px 10px',
        fontSize:     11,
        cursor:       'pointer',
        fontWeight:   600,
        transition:   'all 0.2s',
      }}
    >
      {copied ? '✅ Copied' : '📋 Copy'}
    </button>
  );
}

export default function StepConfigViewer({ activeStep, activeDeviceIndex, circuitType, form, plan }) {
  const [viewTab, setViewTab] = useState('config');

  useEffect(() => { setViewTab('config'); }, [activeStep]);

  const stepCfg   = getStepConfig(activeStep, form, plan);
  const deviceCfg = getDeviceConfigs(activeDeviceIndex, circuitType, form, plan);
  const deviceTab = deviceCfg?.tabs?.[0] ?? null;

  const isStepMode   = !!stepCfg;
  const isFallback   = !stepCfg && !!deviceTab;
  const hasAnything  = isStepMode || isFallback;
  const noPlan       = !plan;

  const displayLabel  = isStepMode ? stepCfg.label  : (deviceTab?.label ?? '');
  const displayLang   = isStepMode ? stepCfg.lang   : (deviceTab?.lang  ?? 'cli');
  const displayConfig = isStepMode ? stepCfg.config : (deviceTab?.config ?? '');
  const langColor     = LANG_COLORS[displayLang] ?? '#94a3b8';

  const systemLabel = activeStep?.system ?? '';
  const actionLabel = activeStep?.action ?? '';
  const systemColor = SYSTEM_COLORS[systemLabel] ?? '#64748b';

  if (noPlan) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#334155', fontSize: 13, padding: 24, textAlign: 'center',
      }}>
        ▶ Start simulation to see live configs
      </div>
    );
  }

  if (!activeStep && !hasAnything) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#334155', fontSize: 13, padding: 24, textAlign: 'center',
      }}>
        ▶ Start simulation to see live configs
      </div>
    );
  }

  if (activeStep && !hasAnything) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#334155', fontSize: 13, padding: 24, textAlign: 'center',
      }}>
        No config available for this step
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#04080f' }}>
      {/* Header */}
      <div style={{
        padding: '7px 12px',
        borderBottom: '1px solid #1e2a3a',
        background: '#070d1a',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {isStepMode && systemLabel && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: systemColor,
            background: '#0a1220',
            border: `1px solid ${systemColor}44`,
            borderRadius: 4,
            padding: '1px 7px',
            whiteSpace: 'nowrap',
          }}>
            {systemLabel}
          </span>
        )}
        {isStepMode && actionLabel && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {actionLabel}
          </span>
        )}
        {isFallback && deviceCfg?.device && (
          <>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
              {deviceCfg.device.role}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: '#94a3b8',
              background: '#0a1220',
              borderRadius: 4,
              padding: '1px 7px',
            }}>
              {deviceCfg.device.vendor} {deviceCfg.device.model}
            </span>
          </>
        )}

        {/* Mode badge */}
        <span style={{
          marginLeft: isStepMode ? 4 : 0,
          fontSize: 9, fontWeight: 800,
          color:       isStepMode ? '#4ade80' : '#60a5fa',
          background:  isStepMode ? '#052e16' : '#0c1a2e',
          border:      `1px solid ${isStepMode ? '#166534' : '#1e4976'}`,
          borderRadius: 4,
          padding: '1px 6px',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {isStepMode ? 'STEP CONFIG' : 'DEVICE CONFIG'}
        </span>

        {/* Lang badge + copy */}
        <span style={{
          marginLeft: 'auto',
          fontSize: 9, fontWeight: 700,
          color: langColor,
          background: '#0a1220',
          border: `1px solid ${langColor}44`,
          borderRadius: 4,
          padding: '1px 7px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          {viewTab === 'config' ? displayLang : viewTab === 'payload' ? (stepCfg?.payloadLang ?? 'json') : 'log'}
        </span>
        <CopyButton text={
          viewTab === 'payload' ? (stepCfg?.payload ?? '') :
          viewTab === 'log'     ? (stepCfg?.log     ?? '') :
          displayConfig
        } />
      </div>

      {/* Label sub-bar */}
      <div style={{
        padding: '4px 12px',
        background: '#050a14',
        borderBottom: '1px solid #0f1e30',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10,
          color: langColor,
          fontWeight: 600,
          fontFamily: 'monospace',
        }}>
          {displayLabel}
        </span>
      </div>

      {/* View tabs */}
      <div style={{ display:'flex', gap:2, padding:'4px 10px', background:'#050a14', borderBottom:'1px solid #0f1e30', flexShrink:0 }}>
        {[
          { id:'config',  label:'⚙️ Config'  },
          { id:'payload', label:'📤 Payload' },
          { id:'log',     label:'📋 Log'     },
        ].map(t => {
          const hasData = t.id === 'config' ? true
            : t.id === 'payload' ? !!(stepCfg?.payload)
            : !!(stepCfg?.log);
          const isActive = viewTab === t.id;
          return (
            <button key={t.id}
              disabled={!hasData}
              onClick={() => hasData && setViewTab(t.id)}
              style={{
                background: isActive ? '#0f2a4a' : 'transparent',
                border: isActive ? '1px solid #1e4976' : '1px solid transparent',
                color: !hasData ? '#1e2a3a' : isActive ? '#38bdf8' : '#475569',
                borderRadius: 5, padding:'2px 10px', fontSize:10,
                cursor: hasData ? 'pointer' : 'not-allowed', fontWeight: isActive ? 700 : 400,
              }}>{t.label}</button>
          );
        })}
      </div>

      {/* Config content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <pre style={{
          margin: 0,
          padding: '14px 16px',
          fontSize: 11,
          lineHeight: 1.6,
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
          color: viewTab === 'log' ? '#86efac'
               : viewTab === 'payload' ? (LANG_COLORS[stepCfg?.payloadLang ?? 'json'] ?? '#c4b5fd')
               : langColor,
          background: 'transparent',
          whiteSpace: 'pre',
          tabSize: 2,
        }}>
          {viewTab === 'payload' ? (stepCfg?.payload ?? '')
         : viewTab === 'log'    ? (stepCfg?.log     ?? '')
         : displayConfig}
        </pre>
      </div>
    </div>
  );
}
