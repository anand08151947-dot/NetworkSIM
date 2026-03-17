import { useMemo } from 'react';
import { CollapsiblePanel } from '../UIComponents';

const RULES = [
  { condition: (nodes) => nodes.some(n => n.data.capacity >= 80), severity: 'critical', icon: '🚨',
    title: 'CRITICAL: Node(s) at capacity limit',
    getDetail: (nodes) => { const n = nodes.find(n => n.data.capacity >= 80); return `${n.data.label} at ${n.data.capacity.toFixed(1)}% — immediate action required. Order replacement hardware today.`; },
    actions: ['Emergency capacity order', 'Activate traffic shaping', 'Notify NOC P1'] },

  { condition: (nodes) => nodes.some(n => n.data.capacity >= 55 && n.data.capacity < 80), severity: 'warning', icon: '⚠️',
    title: 'WARNING: Capacity threshold approaching',
    getDetail: (nodes) => { const n = nodes.find(n => n.data.capacity >= 55 && n.data.capacity < 80); return `${n.data.label} at ${n.data.capacity.toFixed(1)}%. Plan capacity augmentation within 4–6 weeks.`; },
    actions: ['Initiate procurement RFQ', 'Schedule site survey', 'Review IP address pool'] },

  { condition: (nodes) => nodes.some(n => n.data.capacity >= 38 && n.data.layer === 'ip_services'), severity: 'info', icon: '📋',
    title: 'PLAN: BNG subscriber capacity at 40%',
    getDetail: (nodes) => `BNG approaching 40% threshold. Pre-stage next OLT card and expand DHCP pool to avoid subscriber growth bottleneck.`,
    actions: ['Pre-order OLT expansion card', 'Expand DHCP pool', 'Review RADIUS policy templates'] },

  { condition: (nodes) => nodes.some(n => n.data.status === 'provisioning'), severity: 'active', icon: '⚡',
    title: 'ACTIVE: Provisioning workflow in progress',
    getDetail: (nodes) => { const n = nodes.find(n => n.data.status === 'provisioning'); return `${n.data.label} is being provisioned. Verify OSS/BSS sync and RADIUS session establishment post-completion.`; },
    actions: ['Monitor RADIUS session', 'Verify DHCP lease', 'Check OLT ONT status'] },

  { condition: (nodes) => nodes.every(n => n.data.capacity < 40 && n.data.status === 'healthy'), severity: 'healthy', icon: '✅',
    title: 'All systems healthy — below 40% capacity',
    getDetail: () => `Network operating within normal parameters. Next capacity review recommended in 8 weeks based on current growth trajectory.`,
    actions: ['Schedule quarterly capacity review', 'Review growth forecast', 'Update NetBox baseline'] },
];

const SEV_COLORS = {
  critical: { bg: '#1a0000', border: '#ef4444', text: '#ef4444', badge: '#ef444422' },
  warning: { bg: '#1a1000', border: '#f59e0b', text: '#f59e0b', badge: '#f59e0b22' },
  info: { bg: '#0a1628', border: '#60a5fa', text: '#60a5fa', badge: '#60a5fa22' },
  active: { bg: '#1a1400', border: '#facc15', text: '#facc15', badge: '#facc1522' },
  healthy: { bg: '#001a0a', border: '#22c55e', text: '#22c55e', badge: '#22c55e22' },
};

export default function AIRunbook({ nodes }) {
  const recommendations = useMemo(() => {
    return RULES.filter(r => r.condition(nodes)).map(r => ({
      ...r,
      detail: r.getDetail(nodes),
    }));
  }, [nodes]);

  const active = recommendations[0]; // show top priority
  if (!active) return null;

  const colors = SEV_COLORS[active.severity];
  const badgeColor = colors.text;

  return (
    <CollapsiblePanel
      title="AI RUNBOOK"
      icon={active.icon}
      badge={active.severity.toUpperCase()}
      badgeColor={colors.text}
      badgeBg={colors.badge}
      defaultOpen={true}
    >
      <div style={{
        background: colors.bg, borderTop: `1.5px solid ${colors.border}`,
        padding: '8px 10px',
        animation: active.severity === 'critical' ? 'pulse 2s infinite' : 'none',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{active.title}</div>
        <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>RECOMMENDATION</div>
        <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>{active.detail}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {active.actions.map((action, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: colors.border, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: '#cbd5e1' }}>{action}</span>
            </div>
          ))}
        </div>
        {recommendations.length > 1 && (
          <div style={{ marginTop: 6, fontSize: 8, color: '#475569' }}>+{recommendations.length - 1} more recommendations</div>
        )}
      </div>
    </CollapsiblePanel>
  );
}
