// ─────────────────────────────────────────────────────────────────────────────
//  events.js — Lightweight publish/subscribe event bus for simulation modules
//  Allows simulation modules to communicate without direct coupling
// ─────────────────────────────────────────────────────────────────────────────

const listeners = new Map();

export const SimEvents = {
  /** Subscribe to an event type. Returns an unsubscribe function. */
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    return () => listeners.get(event)?.delete(handler);
  },

  /** Publish an event with optional payload. */
  emit(event, payload = {}) {
    if (!listeners.has(event)) return;
    const timestamp = Date.now();
    listeners.get(event).forEach(handler => {
      try {
        handler({ ...payload, event, timestamp });
      } catch (err) {
        console.error(`[SimEvents] Handler error for "${event}":`, err);
      }
    });
  },

  /** One-time subscription — auto-unsubscribes after first fire. */
  once(event, handler) {
    const unsub = SimEvents.on(event, (payload) => {
      handler(payload);
      unsub();
    });
    return unsub;
  },

  /** Remove all listeners for an event (or all events if no arg). */
  off(event) {
    if (event) listeners.delete(event);
    else listeners.clear();
  },
};

// ── Well-known event type constants ──────────────────────────────────────────
export const SIM_EVENT = {
  // Node state
  NODE_CAPACITY_CHANGE:  'node:capacity:change',
  NODE_STATUS_CHANGE:    'node:status:change',
  NODE_FAULT_INJECT:     'node:fault:inject',
  NODE_FAULT_CLEAR:      'node:fault:clear',

  // BGP events
  BGP_SESSION_DOWN:      'bgp:session:down',
  BGP_SESSION_UP:        'bgp:session:up',
  BGP_ROUTE_WITHDRAW:    'bgp:route:withdraw',
  BGP_ROUTE_ADVERTISE:   'bgp:route:advertise',
  BGP_RR_FAILOVER:       'bgp:rr:failover',
  BGP_CONVERGENCE_DONE:  'bgp:convergence:done',

  // OTN events
  OTN_BER_DEGRADE:       'otn:ber:degrade',
  OTN_APS_TRIGGER:       'otn:aps:trigger',
  OTN_APS_COMPLETE:      'otn:aps:complete',
  OTN_SPAN_RESTORE:      'otn:span:restore',
  OTN_RING_BYPASS:       'otn:ring:bypass',

  // EVC events
  EVC_SERVICE_CREATE:    'evc:service:create',
  EVC_SERVICE_ACTIVATE:  'evc:service:activate',
  EVC_BANDWIDTH_POLICE:  'evc:bandwidth:police',
  EVC_SLA_BREACH:        'evc:sla:breach',

  // Circuit provisioning
  CIRCUIT_PHASE_START:   'circuit:phase:start',
  CIRCUIT_PHASE_DONE:    'circuit:phase:done',
  CIRCUIT_ACTIVATED:     'circuit:activated',

  // NOC
  NOC_ALERT:             'noc:alert',
  NOC_TICKET_CREATE:     'noc:ticket:create',
  AUDIT_LOG_ENTRY:       'audit:log:entry',
};
