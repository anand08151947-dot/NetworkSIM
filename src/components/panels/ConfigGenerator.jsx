import { useMemo, useState } from 'react';
import { getNodeConfig } from '../../data/configTemplates';
import { SIMULATION_FLOWS } from '../../data/networkTopology';

// Derive a stable context object from the active simulation step
function buildCtx(simId, events) {
  if (!simId || !events.length) return null;
  const lastEvent = events[events.length - 1];
  const flow = SIMULATION_FLOWS[simId];
  // Pick vlan from a seeded deterministic value so it stays stable per sim run
  const vlanSeed = simId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    simId,
    nodeId: lastEvent?.system?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
    action: lastEvent?.action || '',
    system: lastEvent?.system || '',
    detail: lastEvent?.detail || '',
    vlan: 1000 + (vlanSeed % 3000),
    flowLabel: flow?.label || simId,
  };
}

// Node label to show in the header (from last event's system field)
function nodeLabel(events) {
  if (!events.length) return null;
  const last = events[events.length - 1];
  return last?.system || null;
}

export default function ConfigGenerator({ activeSimId, activeNodeId, events }) {
  const [activeTabKey, setActiveTabKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const hasEvents = events.length > 0 && activeSimId;

  // Determine which node is active (prefer prop, fallback to last event)
  const effectiveNodeId = activeNodeId || null;

  // Get config definition for this node
  const nodeCfg = useMemo(() => {
    if (!hasEvents) return null;
    return getNodeConfig(effectiveNodeId);
  }, [hasEvents, effectiveNodeId]);
  const tabs = useMemo(() => nodeCfg?.tabs ?? [], [nodeCfg]);

  // Auto-select first tab when node changes
  const resolvedTabKey = activeTabKey && tabs.find(t => t.key === activeTabKey)
    ? activeTabKey
    : tabs[0]?.key || null;

  // Build context and generate config text
  const ctx = useMemo(() => buildCtx(activeSimId, events), [activeSimId, events]);
  const configText = useMemo(() => {
    if (!ctx || !resolvedTabKey || !nodeCfg) return null;
    const tab = tabs.find(t => t.key === resolvedTabKey);
    try {
      return tab?.generate(ctx) || null;
    } catch {
      return '// Error generating config for this node.';
    }
  }, [ctx, resolvedTabKey, nodeCfg, tabs]);

  const handleCopy = () => {
    if (configText) {
      navigator.clipboard.writeText(configText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Detect config language for syntax color hint
  const lang = tabs.find(t => t.key === resolvedTabKey)?.lang || 'IOS';
  const textColor = lang === 'JSON' ? '#93c5fd' : lang === 'Config' ? '#fde68a' : '#86efac';

  // Label for the active node from events
  const activeSystemLabel = nodeLabel(events);

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', background: '#0a1628', border: 'none', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      >
        <span style={{ fontSize: 12 }}>⚙️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', flex: 1, textAlign: 'left', letterSpacing: 0.5 }}>CONFIG GENERATOR</span>
        {hasEvents && activeSystemLabel && (
          <span style={{ fontSize: 8, color: '#facc15', background: '#1a1400', border: '1px solid #854d0e', borderRadius: 3, padding: '1px 5px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeSystemLabel}
          </span>
        )}
        {hasEvents && !activeSystemLabel && (
          <span style={{ fontSize: 8, color: '#22c55e', background: '#052e16', borderRadius: 3, padding: '1px 5px' }}>READY</span>
        )}
        <span style={{ color: '#475569', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ padding: '8px' }}>
          {!hasEvents ? (
            <div style={{ fontSize: 10, color: '#334155', textAlign: 'center', padding: '12px 0' }}>
              Run a simulation to generate device configs
            </div>
          ) : (
            <>
              {/* Active node context banner */}
              {effectiveNodeId && (
                <div style={{
                  background: '#0a1400', border: '1px solid #713f12', borderRadius: 5,
                  padding: '4px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 8, color: '#fbbf24' }}>▶ ACTIVE NODE:</span>
                  <span style={{ fontSize: 9, color: '#fde68a', fontWeight: 700 }}>{effectiveNodeId}</span>
                  <span style={{ fontSize: 8, color: '#64748b', marginLeft: 'auto' }}>sim: {activeSimId}</span>
                </div>
              )}

              {/* Tab selector — only show tabs for this node */}
              {tabs.length > 1 && (
                <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTabKey(t.key)} style={{
                      background: resolvedTabKey === t.key ? '#1e3a5f' : '#0a1628',
                      border: `1px solid ${resolvedTabKey === t.key ? '#60a5fa' : '#1e293b'}`,
                      borderRadius: 4, padding: '3px 6px', cursor: 'pointer',
                      fontSize: 8, color: resolvedTabKey === t.key ? '#60a5fa' : '#64748b', fontWeight: 600,
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Config output */}
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: '#020817', border: '1px solid #1e293b', borderRadius: 6,
                  padding: '8px', fontSize: 8, color: textColor, fontFamily: 'monospace',
                  overflowX: 'auto', maxHeight: 220, overflowY: 'auto', margin: 0, lineHeight: 1.6,
                  whiteSpace: 'pre',
                }}>
                  {configText || '// Waiting for simulation step...'}
                </pre>
                <button onClick={handleCopy} style={{
                  position: 'absolute', top: 4, right: 4,
                  background: copied ? '#052e16' : '#1e293b', border: `1px solid ${copied ? '#22c55e' : '#334155'}`,
                  borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
                  fontSize: 8, color: copied ? '#22c55e' : '#94a3b8',
                }}>
                  {copied ? '✅ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Lang badge */}
              <div style={{ textAlign: 'right', marginTop: 3 }}>
                <span style={{ fontSize: 7, color: '#475569', background: '#0f172a', borderRadius: 3, padding: '1px 4px' }}>
                  {lang}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
