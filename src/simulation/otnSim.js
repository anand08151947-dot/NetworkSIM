// ─────────────────────────────────────────────────────────────────────────────
//  otnSim.js — OTN Automatic Protection Switching (APS) simulation
//  Models G.873.1 BLSR ring protection with 50ms switchover target.
//  APS protocol: K1/K2 byte exchange, ring switch, span switch.
// ─────────────────────────────────────────────────────────────────────────────

import { SimEvents, SIM_EVENT } from './events.js';

export const OTN_APS_STATE = {
  NORMAL:           'Normal',
  SIGNAL_DEGRADE:   'SignalDegrade',   // BER > 10⁻⁵
  APS_REQUESTED:    'APSRequested',    // K1/K2 APS bytes sent
  PROTECTION_ACTIVE:'ProtectionActive',// Traffic on protection path
  REVERT_WAIT:      'RevertWait',      // 10-min WTR timer (G.873.1)
  SPAN_FAILED:      'SpanFailed',      // Hard failure — node bypass
};

export const OTN_PROTECTION = {
  BLSR_2F: '2-fiber BLSR',   // 2-fiber Bidirectional Line-Switched Ring
  BLSR_4F: '4-fiber BLSR',   // 4-fiber BLSR (separate working + protection fibers)
  UPSR:    'UPSR',            // Unidirectional Path-Switched Ring
  LINEAR:  '1+1 Linear APS', // Point-to-point linear protection
};

const OTN_SPANS = [
  {
    id: 'span-sea-core1',
    label: 'Seattle CO-3 → Core-R1',
    workingEdge: 'e-metro-core1',
    protectionEdge: 'e-core1-core2',
    ring: 'BLSR-RING-1',
    protectionType: OTN_PROTECTION.BLSR_2F,
    state: OTN_APS_STATE.NORMAL,
    ber: 1.1e-15,
    berThresholdSD: 1e-5,   // Signal Degrade threshold
    berThresholdSF: 1e-3,   // Signal Fail threshold
    apsTargetMs: 50,
    switchoverMs: null,
    faultInjected: false,
  },
  {
    id: 'span-core1-core2',
    label: 'Core-R1 → Core-R2 (protection)',
    workingEdge: 'e-core1-core2',
    protectionEdge: 'e-metro-core1',
    ring: 'BLSR-RING-1',
    protectionType: OTN_PROTECTION.BLSR_2F,
    state: OTN_APS_STATE.NORMAL,
    ber: 8.4e-16,
    berThresholdSD: 1e-5,
    berThresholdSF: 1e-3,
    apsTargetMs: 50,
    switchoverMs: null,
    faultInjected: false,
  },
];

const WTR_MS = 10 * 60 * 1000; // 10-minute Wait-to-Restore timer (G.873.1)

class OTNSimulator {
  constructor() {
    this.spans = OTN_SPANS.map(s => ({ ...s }));
    this.activeFaults = new Set();
    this.wtrTimers = new Map(); // spanId → wtrStartMs
  }

  tick(simTimeMs) {
    this.spans = this.spans.map(span => this._processSpan(span, simTimeMs));
  }

  _processSpan(span, simTimeMs) {
    // Natural BER drift ±5% per tick (simulated fiber noise)
    const berDrift = span.ber * (1 + (Math.random() - 0.5) * 0.10);
    span = { ...span, ber: berDrift };

    switch (span.state) {
      case OTN_APS_STATE.NORMAL: {
        if (span.ber > span.berThresholdSF || span.faultInjected) {
          return this._triggerAPS(span, 'SignalFail');
        }
        if (span.ber > span.berThresholdSD) {
          SimEvents.emit(SIM_EVENT.OTN_BER_DEGRADE, { spanId: span.id, ber: span.ber });
          return { ...span, state: OTN_APS_STATE.SIGNAL_DEGRADE };
        }
        return span;
      }

      case OTN_APS_STATE.SIGNAL_DEGRADE: {
        if (span.ber > span.berThresholdSF || span.faultInjected) {
          return this._triggerAPS(span, 'SignalFail');
        }
        if (span.ber < span.berThresholdSD * 0.9) {
          // BER recovered — return to normal
          return { ...span, state: OTN_APS_STATE.NORMAL };
        }
        return span;
      }

      case OTN_APS_STATE.APS_REQUESTED: {
        // Complete APS switchover in the next tick (44-52ms realistic range)
        const switchMs = 44 + Math.random() * 8;
        SimEvents.emit(SIM_EVENT.OTN_APS_COMPLETE, {
          spanId: span.id, switchoverMs: switchMs, ring: span.ring,
          label: span.label, within50ms: switchMs <= 50,
        });
        SimEvents.emit(SIM_EVENT.NOC_ALERT, {
          severity: switchMs <= 50 ? 'medium' : 'high',
          source: 'OTNSim',
          message: `APS complete on ${span.label} — ${switchMs.toFixed(0)}ms switchover`,
        });
        return { ...span, state: OTN_APS_STATE.PROTECTION_ACTIVE, switchoverMs: switchMs };
      }

      case OTN_APS_STATE.PROTECTION_ACTIVE: {
        if (this.wtrTimers.has(span.id)) {
          const elapsed = simTimeMs - this.wtrTimers.get(span.id);
          if (elapsed >= WTR_MS) {
            this.wtrTimers.delete(span.id);
            SimEvents.emit(SIM_EVENT.OTN_SPAN_RESTORE, { spanId: span.id, label: span.label });
            return { ...span, state: OTN_APS_STATE.NORMAL, faultInjected: false, switchoverMs: null };
          }
        }
        return span;
      }

      default:
        return span;
    }
  }

  _triggerAPS(span, trigger) {
    SimEvents.emit(SIM_EVENT.OTN_APS_TRIGGER, {
      spanId: span.id, trigger, ber: span.ber,
      ring: span.ring, label: span.label,
    });
    SimEvents.emit(SIM_EVENT.NOC_ALERT, {
      severity: 'high', source: 'OTNSim',
      message: `OTN APS triggered on ${span.label} — cause: ${trigger}`,
    });
    return { ...span, state: OTN_APS_STATE.APS_REQUESTED, apsRequestedAt: Date.now() };
  }

  injectFault(scenarioId, affectedNodeIds) {
    this.activeFaults.add(scenarioId);
    console.log('[OTNSim] Injecting fault:', scenarioId, 'affected nodes:', affectedNodeIds);
    if (scenarioId === 'otn_ring_aps_failure') {
      this.spans = this.spans.map(s =>
        s.id === 'span-sea-core1' ? { ...s, faultInjected: true, ber: 5e-5 } : s
      );
    }
    if (scenarioId === 'otn_ring_node_failure') {
      this.spans = this.spans.map(s =>
        s.id === 'span-sea-core1' ? { ...s, faultInjected: true, ber: 1e-2 } : s
      );
    }
  }

  clearFault(scenarioId) {
    this.activeFaults.delete(scenarioId);
    this.spans = this.spans.map(s => {
      if (s.faultInjected) {
        this.wtrTimers.set(s.id, Date.now());
        return { ...s, faultInjected: false, ber: 1.1e-15, state: OTN_APS_STATE.PROTECTION_ACTIVE };
      }
      return s;
    });
  }

  getSpanStatus() {
    return this.spans.map(({ id, label, state, ber, switchoverMs, ring }) =>
      ({ id, label, state, ber, switchoverMs, ring })
    );
  }
}

export const OTNSim = new OTNSimulator();
