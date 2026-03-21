import { memo, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import * as d3 from 'd3';

const LAYER_COLORS = {
  customer: '#6366f1',
  access: '#0ea5e9',
  central_office: '#06b6d4',
  ip_services: '#f59e0b',
  security: '#ef4444',
  metro: '#3b82f6',
  core: '#6366f1',
  internet: '#22c55e',
  oss_bss: '#10b981',
  management: '#64748b',
};

const STATUS_COLORS = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  provisioning: '#facc15',
  augmenting: '#60a5fa',
};

function MiniGauge({ capacity, status, size = 44 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    d3.select(el).selectAll('*').remove();

    const r = size / 2;
    const innerR = r - 5;
    const svg = d3.select(el)
      .append('svg')
      .attr('width', size)
      .attr('height', size);

    const arc = d3.arc()
      .innerRadius(innerR - 6)
      .outerRadius(innerR)
      .startAngle(-Math.PI * 0.75)
      .endAngle(-Math.PI * 0.75 + (capacity / 100) * Math.PI * 1.5);

    const bg = d3.arc()
      .innerRadius(innerR - 6)
      .outerRadius(innerR)
      .startAngle(-Math.PI * 0.75)
      .endAngle(Math.PI * 0.75);

    const g = svg.append('g').attr('transform', `translate(${r},${r})`);

    g.append('path').datum({}).attr('d', bg).attr('fill', '#1e293b');

    const color = STATUS_COLORS[status] || STATUS_COLORS.healthy;
    g.append('path').datum({}).attr('d', arc).attr('fill', color);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', color)
      .text(`${capacity}%`);
  }, [capacity, status, size]);

  return <div ref={ref} />;
}

function NetworkNode({ data }) {
  const layerColor = LAYER_COLORS[data.layer] || '#64748b';
  const status = data.status || 'healthy';
  const statusColor = STATUS_COLORS[status];
  const isActive = data.isActive;
  const isHighlighted = data.isHighlighted;
  const declutter = data.declutter || false;
  const dimmed = data.dimmed || false;

  const borderColor = isActive ? '#facc15' : isHighlighted ? '#60a5fa' : layerColor;
  const glowStyle = isActive
    ? { boxShadow: `0 0 18px 6px #facc1588, 0 0 0 2px #facc15` }
    : isHighlighted
    ? { boxShadow: `0 0 10px 2px #60a5fa66` }
    : {};

  // ── DECLUTTER (compact) mode ──────────────────────────
  if (declutter) {
    return (
      <div style={{
        background: isActive ? '#1a1400' : '#0f172a',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 7,
        padding: '4px 7px',
        minWidth: 110,
        maxWidth: 140,
        cursor: 'pointer',
        opacity: dimmed ? 0.3 : 1,
        transition: 'all 0.3s ease',
        ...glowStyle,
      }}>
        <Handle type="target" position={Position.Bottom} style={{ background: layerColor, width: 6, height: 6 }} />
        <Handle type="source" position={Position.Top} style={{ background: layerColor, width: 6, height: 6 }} />
        <Handle type="target" position={Position.Left} style={{ background: layerColor, width: 6, height: 6 }} />
        <Handle type="source" position={Position.Right} style={{ background: layerColor, width: 6, height: 6 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13 }}>{data.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.label}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, animation: isActive ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{(data.capacity || 0).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // ── FULL (normal) mode ────────────────────────────────
  return (
    <div
      style={{
        background: isActive ? '#1a1400' : '#0f172a',
        border: `2px solid ${borderColor}`,
        borderRadius: 10,
        padding: '8px 10px',
        minWidth: 160,
        maxWidth: 200,
        cursor: 'pointer',
        opacity: dimmed ? 0.25 : 1,
        transition: 'all 0.3s ease',
        ...glowStyle,
      }}
    >
      <Handle type="target" position={Position.Bottom} style={{ background: layerColor, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Top} style={{ background: layerColor, width: 8, height: 8 }} />
      <Handle type="target" position={Position.Left} style={{ background: layerColor, width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: layerColor, width: 8, height: 8 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{data.icon}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {data.label}
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {data.sublabel}
          </div>
        </div>
        <MiniGauge capacity={data.capacity || 0} status={status} size={38} />
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0,
          animation: isActive ? 'pulse 1s infinite' : 'none' }} />
        <span style={{ fontSize: 9, color: statusColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {isActive ? 'PROVISIONING' : status}
        </span>
        {data.count !== undefined && (
          <span style={{ fontSize: 9, color: '#64748b', marginLeft: 'auto' }}>
            {data.count.toLocaleString()} customers
          </span>
        )}
        {data.activeSessions !== undefined && (
          <span style={{ fontSize: 9, color: '#64748b', marginLeft: 'auto' }}>
            {data.activeSessions.toLocaleString()} sessions
          </span>
        )}
        {data.subscribers !== undefined && (
          <span style={{ fontSize: 9, color: '#64748b', marginLeft: 'auto' }}>
            {data.subscribers}/{data.maxSubscribers}
          </span>
        )}
      </div>

      {/* Action label when active */}
      {data.actionLabel && (
        <div style={{
          marginTop: 4,
          fontSize: 9,
          color: '#facc15',
          background: '#1a1400',
          borderRadius: 4,
          padding: '2px 4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          ⚡ {data.actionLabel}
        </div>
      )}
    </div>
  );
}

export default memo(NetworkNode);
