// ─────────────────────────────────────────────────────────────────────────────
//  bgpSim.js — BGP Finite State Machine simulation
//  Models RFC 4271 BGP session states for each peer.
//  States: Idle → Connect → Active → OpenSent → OpenConfirm → Established
// ─────────────────────────────────────────────────────────────────────────────

import { SimEvents, SIM_EVENT } from './events.js';

export const BGP_STATE = {
  IDLE:         'Idle',
  CONNECT:      'Connect',
  ACTIVE:       'Active',
  OPEN_SENT:    'OpenSent',
  OPEN_CONFIRM: 'OpenConfirm',
  ESTABLISHED:  'Established',
};

// Initial BGP peer table — mirrors the border router's 14 peers
const INITIAL_PEERS = [
  { id: 'cogent',      asn: 174,   type: 'transit', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 120000 },
  { id: 'lumen',       asn: 3356,  type: 'transit', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 115000 },
  { id: 'seattle_ix',  asn: 33055, type: 'peering', holdTimerSec: 180, keepaliveSec: 60, state: BGP_STATE.ESTABLISHED, prefixes: 42000  },
  { id: 'netflix',     asn: 2906,  type: 'peering', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 120    },
  { id: 'google',      asn: 15169, type: 'peering', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 850    },
  { id: 'amazon',      asn: 16509, type: 'peering', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 1200   },
  { id: 'microsoft',   asn: 8075,  type: 'peering', holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 650    },
  // IBGP Route Reflector clients
  { id: 'rr1_mpls_pe', asn: 65000, type: 'ibgp',    holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 1100   },
  { id: 'rr1_border',  asn: 65000, type: 'ibgp',    holdTimerSec: 90,  keepaliveSec: 30, state: BGP_STATE.ESTABLISHED, prefixes: 1198443 },
];

class BGPSimulator {
  constructor() {
    this.peers = INITIAL_PEERS.map(p => ({ ...p, lastKeepaliveMs: Date.now(), reconnectAttempts: 0 }));
    this.activeFaults = new Set();
    this.rrPrimary = 'RR-1'; // core_router_1
    this.rrActive = 'RR-1';
  }

  /** Called each engine tick. Processes hold timers and reconnect logic. */
  tick() {
    const now = Date.now();
    this.peers = this.peers.map(peer => this._processPeer(peer, now));
  }

  _processPeer(peer, now) {
    if (peer.state === BGP_STATE.ESTABLISHED) {
      // Simulate occasional keepalive jitter (within hold timer)
      const holdMs = peer.holdTimerSec * 1000;
      const elapsed = now - peer.lastKeepaliveMs;
      if (elapsed > holdMs && !this.activeFaults.has(`hold_${peer.id}`)) {
        // Hold timer expired — session drops
        this._sessionDown(peer.id, 'Hold timer expired');
        return { ...peer, state: BGP_STATE.IDLE, lastKeepaliveMs: now };
      }
      return peer;
    }

    if (peer.state === BGP_STATE.IDLE || peer.state === BGP_STATE.ACTIVE) {
      // Attempt reconnect after backoff
      const backoffMs = Math.min(60000, 5000 * Math.pow(2, peer.reconnectAttempts));
      if (now - peer.lastKeepaliveMs > backoffMs) {
        return this._advanceState(peer, now);
      }
    }
    return peer;
  }

  _advanceState(peer, now) {
    const transitions = {
      [BGP_STATE.IDLE]:         BGP_STATE.CONNECT,
      [BGP_STATE.CONNECT]:      BGP_STATE.ACTIVE,
      [BGP_STATE.ACTIVE]:       BGP_STATE.OPEN_SENT,
      [BGP_STATE.OPEN_SENT]:    BGP_STATE.OPEN_CONFIRM,
      [BGP_STATE.OPEN_CONFIRM]: BGP_STATE.ESTABLISHED,
    };
    const nextState = transitions[peer.state];
    if (!nextState) return peer;

    if (nextState === BGP_STATE.ESTABLISHED) {
      SimEvents.emit(SIM_EVENT.BGP_SESSION_UP, { peerId: peer.id, asn: peer.asn, type: peer.type });
      return { ...peer, state: nextState, lastKeepaliveMs: now, reconnectAttempts: 0 };
    }
    return { ...peer, state: nextState, lastKeepaliveMs: now };
  }

  _sessionDown(peerId, reason) {
    SimEvents.emit(SIM_EVENT.BGP_SESSION_DOWN, { peerId, reason });
    SimEvents.emit(SIM_EVENT.NOC_ALERT, {
      severity: 'high', source: 'BGPSim',
      message: `BGP session DOWN: ${peerId} — ${reason}`,
    });
  }

  /** Inject a named BGP fault scenario. */
  injectFault(scenarioId, affectedNodeIds) {
    this.activeFaults.add(scenarioId);
    console.log('[BGPSim] Injecting fault:', scenarioId, 'affected nodes:', affectedNodeIds);
    if (scenarioId === 'bgp_session_drop') {
      this._dropPeer('seattle_ix', 'Fault injection — IXP session drop');
    }
    if (scenarioId === 'bgp_rr_failover') {
      this._rrFailover();
    }
  }

  clearFault(scenarioId) {
    this.activeFaults.delete(scenarioId);
    // Peers will reconnect naturally on next tick
  }

  _dropPeer(peerId, reason) {
    this.peers = this.peers.map(p =>
      p.id === peerId ? { ...p, state: BGP_STATE.IDLE, lastKeepaliveMs: Date.now() } : p
    );
    this._sessionDown(peerId, reason);
  }

  _rrFailover() {
    this.rrActive = this.rrActive === 'RR-1' ? 'RR-2' : 'RR-1';
    // Drop all IBGP sessions (they'll re-establish to new RR)
    this.peers = this.peers.map(p =>
      p.type === 'ibgp' ? { ...p, state: BGP_STATE.IDLE, reconnectAttempts: 0, lastKeepaliveMs: Date.now() } : p
    );
    SimEvents.emit(SIM_EVENT.BGP_RR_FAILOVER, {
      fromRR: this.rrActive === 'RR-1' ? 'RR-2' : 'RR-1',
      toRR: this.rrActive,
      ibgpClientsAffected: this.peers.filter(p => p.type === 'ibgp').length,
    });
  }

  /** Get current peer table state (for UI display). */
  getPeerTable() {
    return this.peers.map(({ id, asn, type, state, prefixes, reconnectAttempts }) =>
      ({ id, asn, type, state, prefixes, reconnectAttempts })
    );
  }

  get activeRR() { return this.rrActive; }
}

export const BGPSim = new BGPSimulator();
