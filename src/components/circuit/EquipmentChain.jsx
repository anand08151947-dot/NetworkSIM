import { useState } from 'react';
import { EQUIPMENT_STACKS } from '../../data/circuitPlans';

// Vendor brand colours (kept consistent with circuitPlans.js)
const VENDOR_COLORS = {
  Cisco:    '#1d6fa4',
  Nokia:    '#005AFF',
  Juniper:  '#84BD00',
  Ciena:    '#5c2d8e',
  Arista:   '#e4005c',
  Infinera: '#ff6b00',
  Ericsson: '#006272',
  Calix:    '#e8702a',
};

function DeviceCard({ device, active, phaseActive, onClick }) {
  const bg      = active ? device.color : '#0b1629';
  const border  = active ? device.color : phaseActive ? '#334155' : '#1e2a3a';
  const glow    = active ? `0 0 18px ${device.color}99, 0 0 6px ${device.color}66` : 'none';

  return (
    <div
      onClick={() => onClick(device)}
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 8,
        padding: '10px 14px',
        cursor: 'pointer',
        minWidth: 110,
        transition: 'all 0.35s ease',
        boxShadow: glow,
        position: 'relative',
      }}
    >
      {/* Vendor badge */}
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: 1,
        color: active ? '#fff' : VENDOR_COLORS[device.vendor] ?? '#64748b',
        textTransform: 'uppercase', marginBottom: 3,
      }}>
        {device.vendor}
      </div>
      {/* Model */}
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: active ? '#fff' : '#cbd5e1',
        marginBottom: 4, whiteSpace: 'nowrap',
      }}>
        {device.model}
      </div>
      {/* Role label */}
      <div style={{
        fontSize: 10, color: active ? 'rgba(255,255,255,0.85)' : '#475569',
        lineHeight: 1.3,
      }}>
        {device.role}
      </div>

      {/* Pulse ring when active */}
      {active && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: 10,
          border: `2px solid ${device.color}`,
          animation: 'pulse-ring 1.2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

function Arrow({ active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', color: active ? '#38bdf8' : '#1e3a5f',
      fontSize: 18, transition: 'color 0.3s', flexShrink: 0, userSelect: 'none',
    }}>
      →
    </div>
  );
}

export default function EquipmentChain({ circuitType, activeDeviceIndex, phaseIndex }) {
  const [tooltip, setTooltip] = useState(null);
  const stack = EQUIPMENT_STACKS[circuitType] ?? [];

  if (!stack.length) return null;

  return (
    <div style={{
      background: '#070d1a', border: '1px solid #1e3a5f', borderRadius: 10,
      padding: '14px 18px', position: 'relative',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 12, letterSpacing: 0.5 }}>
        ⚡ A→Z Equipment Chain
      </div>

      {/* Scrollable chain */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        overflowX: 'auto', paddingBottom: 8,
      }}>
        {stack.map((device, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <DeviceCard
              device={device}
              active={activeDeviceIndex === i}
              phaseActive={phaseIndex > 0}
              onClick={setTooltip}
            />
            {i < stack.length - 1 && <Arrow active={activeDeviceIndex >= i} />}
          </div>
        ))}
      </div>

      {/* Inline tooltip / spec card */}
      {tooltip && (
        <div style={{
          marginTop: 12, background: '#0b1629', border: `1px solid ${VENDOR_COLORS[tooltip.vendor] ?? '#1e3a5f'}`,
          borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#94a3b8',
          display: 'flex', gap: 16, alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
              {tooltip.vendor} {tooltip.model}
            </div>
            <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{tooltip.role}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#38bdf8' }}>{tooltip.specs}</div>
          </div>
          <button
            onClick={() => setTooltip(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 16 }}
          >×</button>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.8; }
          100% { transform: scale(1.08); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
