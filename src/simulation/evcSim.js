// ─────────────────────────────────────────────────────────────────────────────
//  evcSim.js — EVC Bandwidth Policing simulation
//  Implements MEF 10.4 token-bucket model for CIR/EIR/CBS/EBS policing.
//  Models color-aware (3-color) and color-blind (2-color) policers.
// ─────────────────────────────────────────────────────────────────────────────

import { SimEvents, SIM_EVENT } from './events.js';

export const EVC_COLOR = {
  GREEN:  'Green',   // Within CIR — conforming
  YELLOW: 'Yellow',  // Within EIR — exceeding
  RED:    'Red',     // Exceeds EIR — violating (drop)
};

export const EVC_SERVICE_TYPE = {
  E_LINE:    'E-LINE',     // Point-to-point EPL/EVPL
  E_LAN:     'E-LAN',      // Multipoint-to-multipoint EPLAN/EVPLAN
  E_TREE:    'E-TREE',     // Rooted multipoint
  EVPN_VPWS: 'EVPN-VPWS',  // IETF RFC 8214 point-to-point L2VPN
};

class TokenBucket {
  constructor({ cirBps, eirBps, cbsBytes, ebsBytes }) {
    this.cirBps   = cirBps;          // Committed Information Rate
    this.eirBps   = eirBps;          // Excess Information Rate
    this.cbsBytes = cbsBytes;        // Committed Burst Size
    this.ebsBytes = ebsBytes;        // Excess Burst Size
    this.cTokens  = cbsBytes;        // Current committed tokens
    this.eTokens  = ebsBytes;        // Current excess tokens
    this.lastRefillMs = Date.now();
  }

  /** Refill tokens based on time elapsed. */
  refill(nowMs) {
    const elapsed = (nowMs - this.lastRefillMs) / 1000; // seconds
    this.cTokens = Math.min(this.cbsBytes, this.cTokens + this.cirBps * elapsed / 8);
    this.eTokens = Math.min(this.ebsBytes, this.eTokens + this.eirBps * elapsed / 8);
    this.lastRefillMs = nowMs;
  }

  /** Police a packet of `bytes`. Returns color. */
  police(bytes, nowMs) {
    this.refill(nowMs);
    if (this.cTokens >= bytes) {
      this.cTokens -= bytes;
      return EVC_COLOR.GREEN;
    }
    if (this.eTokens >= bytes) {
      this.eTokens -= bytes;
      return EVC_COLOR.YELLOW;
    }
    return EVC_COLOR.RED;
  }
}

// Active EVC services
const INITIAL_SERVICES = [
  {
    id: 'evc-001',
    type: EVC_SERVICE_TYPE.E_LINE,
    customer: 'Acme Corp',
    aEndpoint: 'SEA-CO1',
    zEndpoint: 'BEL-CO2',
    cirMbps: 1000,
    eirMbps: 2000,
    sla: 'gold',
    status: 'active',
    stats: { greenPkts: 0, yellowPkts: 0, redPkts: 0, breachCount: 0 },
  },
  {
    id: 'evc-002',
    type: EVC_SERVICE_TYPE.EVPN_VPWS,
    customer: 'Northwest Medical',
    aEndpoint: 'SEA-CO1',
    zEndpoint: 'SPO-CO6',
    cirMbps: 10000,
    eirMbps: 10000,
    sla: 'platinum',
    status: 'active',
    stats: { greenPkts: 0, yellowPkts: 0, redPkts: 0, breachCount: 0 },
  },
  {
    id: 'evc-003',
    type: EVC_SERVICE_TYPE.E_LAN,
    customer: 'Pacific Retail Group',
    sites: ['SEA-CO1', 'BEL-CO2', 'TAC-CO3', 'OLY-CO4'],
    cirMbps: 100,
    eirMbps: 200,
    sla: 'silver',
    status: 'active',
    stats: { greenPkts: 0, yellowPkts: 0, redPkts: 0, breachCount: 0 },
  },
];

class EVCSimulator {
  constructor() {
    this.services = INITIAL_SERVICES.map(svc => ({
      ...svc,
      _bucket: new TokenBucket({
        cirBps:   svc.cirMbps * 1e6,
        eirBps:   svc.eirMbps * 1e6,
        cbsBytes: svc.cirMbps * 1e6 * 0.01 / 8,  // 10ms burst
        ebsBytes: svc.eirMbps * 1e6 * 0.01 / 8,
      }),
    }));
  }

  tick() {
    const now = Date.now();
    this.services = this.services.map(svc => {
      if (svc.status !== 'active') return svc;

      // Simulate traffic burst (random 1400-byte packets)
      const burstPackets = Math.floor(Math.random() * 20) + 5;
      const stats = { ...svc.stats };
      let breached = false;

      for (let i = 0; i < burstPackets; i++) {
        const color = svc._bucket.police(1400, now);
        if (color === EVC_COLOR.GREEN)  stats.greenPkts++;
        else if (color === EVC_COLOR.YELLOW) stats.yellowPkts++;
        else {
          stats.redPkts++;
          breached = true;
        }
      }

      if (breached) {
        stats.breachCount++;
        SimEvents.emit(SIM_EVENT.EVC_BANDWIDTH_POLICE, {
          serviceId: svc.id, customer: svc.customer,
          type: svc.type, sla: svc.sla,
        });
        // SLA breach if >5 consecutive violations
        if (stats.breachCount % 5 === 0) {
          SimEvents.emit(SIM_EVENT.EVC_SLA_BREACH, {
            serviceId: svc.id, customer: svc.customer, sla: svc.sla,
          });
        }
      }

      return { ...svc, stats };
    });
  }

  /** Create a new EVC service. */
  createService(config) {
    const id = `evc-${String(this.services.length + 1).padStart(3, '0')}`;
    const service = {
      ...config, id, status: 'provisioning',
      stats: { greenPkts: 0, yellowPkts: 0, redPkts: 0, breachCount: 0 },
      _bucket: new TokenBucket({
        cirBps:   config.cirMbps * 1e6,
        eirBps:   (config.eirMbps || config.cirMbps) * 1e6,
        cbsBytes: config.cirMbps * 1e6 * 0.01 / 8,
        ebsBytes: (config.eirMbps || config.cirMbps) * 1e6 * 0.01 / 8,
      }),
    };
    this.services.push(service);
    SimEvents.emit(SIM_EVENT.EVC_SERVICE_CREATE, { serviceId: id, customer: config.customer });
    // Activate after simulated provisioning delay
    setTimeout(() => {
      this.services = this.services.map(s =>
        s.id === id ? { ...s, status: 'active' } : s
      );
      SimEvents.emit(SIM_EVENT.EVC_SERVICE_ACTIVATE, { serviceId: id });
    }, 3000);
    return id;
  }

  getServices() {
    return this.services.map(({ id, type, customer, cirMbps, eirMbps, sla, status, stats, sites, aEndpoint, zEndpoint }) =>
      ({ id, type, customer, cirMbps, eirMbps, sla, status, stats, sites, aEndpoint, zEndpoint })
    );
  }
}

export const EVCSim = new EVCSimulator();
