import { useEffect, useState } from 'react';
import { buildOpticalBudget, SITES } from '../../data/circuitPlans';

function Row({ label, value, unit = '', highlight = false, separator = false, indent = false }) {
  if (separator) {
    return (
      <tr>
        <td colSpan={3} style={{ padding: '2px 0' }}>
          <div style={{ borderTop: '1px solid #1e3a5f', margin: '4px 0' }} />
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td style={{
        padding: '3px 0', color: indent ? '#64748b' : '#94a3b8',
        fontSize: 12, paddingLeft: indent ? 16 : 0, whiteSpace: 'nowrap',
      }}>
        {label}
      </td>
      <td style={{ padding: '3px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12 }}>
        <span style={{ color: highlight ? '#f59e0b' : '#e2e8f0', fontWeight: highlight ? 700 : 400 }}>
          {value}
        </span>
      </td>
      <td style={{ padding: '3px 0', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
        {unit}
      </td>
    </tr>
  );
}

export default function OpticalBudgetCalc({ aId, zId, bandwidth, visible }) {
  const [budget, setBudget] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!visible || !aId || !zId || aId === zId) { setBudget(null); setAnimated(false); return; }
    setAnimated(false);
    const b = buildOpticalBudget(aId, zId, bandwidth);
    setBudget(b);
    // Short delay → fade-in animation trigger
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [aId, zId, bandwidth, visible]);

  if (!visible || !budget) return null;

  const aLabel = SITES.find(s => s.id === aId)?.label?.split(' ')[0] ?? aId.toUpperCase();
  const zLabel = SITES.find(s => s.id === zId)?.label?.split(' ')[0] ?? zId.toUpperCase();

  const passColor  = budget.pass ? '#22c55e' : '#ef4444';
  const passLabel  = budget.pass ? '✅ PASS' : '❌ FAIL — augmentation required';

  return (
    <div style={{
      background: '#070d1a', border: `1px solid ${budget.pass ? '#1e3a5f' : '#7f1d1d'}`,
      borderRadius: 10, padding: '14px 18px',
      opacity: animated ? 1 : 0, transition: 'opacity 0.5s ease',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', marginBottom: 2, letterSpacing: 0.5 }}>
        🌊 Optical Budget Calculator
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 12 }}>
        {aLabel} → {zLabel} · {budget.channel} · {budget.fecMode}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {/* Span info */}
          <Row label="Fiber Span" value={budget.distKm} unit="km" />
          <Row label="Fiber Loss" value={`${budget.fiberLossPerKm} dB/km × ${budget.distKm} km`} indent />
          <Row label="" value={budget.totalFiberLoss} unit="dB" indent highlight />
          <Row separator />

          {/* Connector loss */}
          <Row label="Connector Loss" value={`${budget.connectorLoss} dB × ${budget.connectorCount} connectors`} indent />
          <Row label="" value={budget.totalConnectorLoss} unit="dB" indent highlight />

          {/* Splice loss */}
          <Row label="Splice Loss" value={`${budget.spliceLoss} dB × ${budget.spliceCount} splices`} indent />
          <Row label="" value={budget.totalSpliceLoss} unit="dB" indent highlight />

          <Row separator />
          <Row label="Total Path Loss" value={budget.totalPathLoss} unit="dB" highlight />
          <Row separator />

          {/* Amplifiers */}
          <Row label="ILA Amplifiers" value={`${budget.ilaCount} × ${budget.ilaGainDb} dB EDFA`} indent />
          <Row label="Total Amp Gain" value={budget.totalAmpGain} unit="dB" highlight />
          <Row label="EDFA Noise Figure" value={budget.edfaNoiseFig} unit="dB" indent />

          <Row separator />

          {/* Net */}
          <Row label="Net Optical Budget" value={budget.netBudget} unit="dB" highlight />
          <Row label="Required Margin" value={budget.requiredMargin} unit="dB" indent />

          <Row separator />

          {/* Verdict */}
          <tr>
            <td style={{ padding: '5px 0', fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
              Available Margin
            </td>
            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: passColor }}>{budget.availableMargin}</span>
            </td>
            <td style={{ fontSize: 11, color: '#475569' }}>dB</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ paddingTop: 6 }}>
              <div style={{
                background: budget.pass ? '#052e16' : '#450a0a',
                border: `1px solid ${passColor}`,
                borderRadius: 6, padding: '6px 10px',
                fontSize: 12, fontWeight: 700, color: passColor, textAlign: 'center',
              }}>
                {passLabel}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
