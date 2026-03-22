// ─────────────────────────────────────────────────────────────────────────────
//  engine.js — Core simulation tick engine
//  Drives capacity drift, protocol timers, and cross-module orchestration.
//  The existing App.jsx 3-second capacity drift loop is the seed of this engine.
// ─────────────────────────────────────────────────────────────────────────────

import { SimEvents, SIM_EVENT } from './events.js';
import { BGPSim } from './bgpSim.js';
import { OTNSim } from './otnSim.js';
import { EVCSim } from './evcSim.js';

const DEFAULT_TICK_MS = 3000;

export class SimEngine {
  constructor({ tickMs = DEFAULT_TICK_MS } = {}) {
    this.tickMs = tickMs;
    this.tickCount = 0;
    this.running = false;
    this._timer = null;
    this.modules = { bgp: BGPSim, otn: OTNSim, evc: EVCSim };
  }

  /** Start the simulation engine. */
  start() {
    if (this.running) return;
    this.running = true;
    this._tick();
    console.log('[SimEngine] Started — tick interval:', this.tickMs, 'ms');
  }

  /** Stop the simulation engine cleanly. */
  stop() {
    this.running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    console.log('[SimEngine] Stopped after', this.tickCount, 'ticks');
  }

  /** Single tick — drives all modules and emits audit entry. */
  _tick() {
    if (!this.running) return;
    this.tickCount++;
    const simTime = this.tickCount * this.tickMs;

    // Drive each simulation module
    try { BGPSim.tick(simTime); } catch (e) { console.error('[SimEngine] BGPSim tick error:', e); }
    try { OTNSim.tick(simTime); } catch (e) { console.error('[SimEngine] OTNSim tick error:', e); }
    try { EVCSim.tick(simTime); } catch (e) { console.error('[SimEngine] EVCSim tick error:', e); }

    SimEvents.emit(SIM_EVENT.AUDIT_LOG_ENTRY, {
      tick: this.tickCount,
      simTimeMs: simTime,
      source: 'SimEngine',
    });

    this._timer = setTimeout(() => this._tick(), this.tickMs);
  }

  /** Inject a named fault scenario — delegates to relevant module. */
  injectFault(scenarioId, affectedNodeIds = []) {
    SimEvents.emit(SIM_EVENT.NODE_FAULT_INJECT, { scenarioId, affectedNodeIds });
    if (scenarioId.startsWith('otn_')) OTNSim.injectFault(scenarioId, affectedNodeIds);
    if (scenarioId.startsWith('bgp_')) BGPSim.injectFault(scenarioId, affectedNodeIds);
    console.log('[SimEngine] Fault injected:', scenarioId, 'nodes:', affectedNodeIds);
  }

  /** Clear active fault and return nodes to nominal state. */
  clearFault(scenarioId) {
    SimEvents.emit(SIM_EVENT.NODE_FAULT_CLEAR, { scenarioId });
    OTNSim.clearFault(scenarioId);
    BGPSim.clearFault(scenarioId);
    console.log('[SimEngine] Fault cleared:', scenarioId);
  }

  /**
   * Capacity drift utility — mirrors App.jsx existing drift logic.
   * Returns updated node array with ±0.4% capacity drift.
   */
  static applyCapacityDrift(nodes) {
    return nodes.map(node => {
      if (node.data.status === 'critical') return node;
      const drift = (Math.random() - 0.5) * 0.8;
      const newCap = Math.max(5, Math.min(95, (node.data.capacity || 50) + drift));
      const status = newCap >= 80 ? 'critical' : newCap >= 55 ? 'warning' : 'healthy';
      return { ...node, data: { ...node.data, capacity: +newCap.toFixed(1), status } };
    });
  }
}

// Singleton instance for use across the app
export const simEngine = new SimEngine();
