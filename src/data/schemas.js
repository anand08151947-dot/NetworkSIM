// ─────────────────────────────────────────────────────────────────────────────
//  schemas.js — Zod runtime schemas for all core data models
//  Validates at startup to catch bad data before engineers see broken UIs.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ── Node status enum ──────────────────────────────────────────────────────────
export const NodeStatusSchema = z.enum(['healthy', 'warning', 'critical', 'provisioning', 'augmenting']);

// ── Layer enum ────────────────────────────────────────────────────────────────
export const LayerSchema = z.enum([
  'customer', 'access', 'central_office', 'ip_services',
  'security', 'metro', 'core', 'internet', 'oss_bss', 'management',
]);

// ── Node data schema ──────────────────────────────────────────────────────────
export const NodeDataSchema = z.object({
  label:       z.string().min(1),
  sublabel:    z.string().optional(),
  layer:       LayerSchema,
  nodeType:    z.string().min(1),
  capacity:    z.number().min(0).max(100),
  maxCapacity: z.number().positive(),
  status:      NodeStatusSchema,
  icon:        z.string().optional(),
  // Optional extended fields
  count:            z.number().optional(),
  portsFree:        z.number().optional(),
  portsUsed:        z.number().optional(),
  activeSessions:   z.number().optional(),
  subscribers:      z.number().optional(),
  maxSubscribers:   z.number().optional(),
  vpnTunnels:       z.number().optional(),
  bgpPeers:         z.number().optional(),
  // OTN Ring fields (Sprint 2)
  ringId:           z.string().optional(),
  otnRole:          z.enum(['working', 'protection']).optional(),
  tributarySlots:   z.number().optional(),
  tributarySlotsUsed: z.number().optional(),
  oduCapacity:      z.string().optional(),
  // BGP RR fields (Sprint 3)
  rrCluster:        z.string().optional(),
  rrClientCount:    z.number().optional(),
}).passthrough(); // allow additional node-specific fields

// ── Topology node schema ──────────────────────────────────────────────────────
export const TopologyNodeSchema = z.object({
  id:       z.string().min(1),
  type:     z.literal('networkNode'),
  position: z.object({ x: z.number(), y: z.number() }),
  data:     NodeDataSchema,
});

// ── Topology edge schema ──────────────────────────────────────────────────────
export const TopologyEdgeSchema = z.object({
  id:       z.string().min(1),
  source:   z.string().min(1),
  target:   z.string().min(1),
  animated: z.boolean().optional(),
  style:    z.object({
    stroke:      z.string().optional(),
    strokeWidth: z.number().optional(),
  }).optional(),
  label:   z.string().optional(),
  type:    z.string().optional(),
  data:    z.object({
    utilization: z.number().min(0).max(100).optional(),
    showLabel:   z.boolean().optional(),
  }).optional(),
}).passthrough();

// ── Fault scenario step schema ────────────────────────────────────────────────
export const FaultStepSchema = z.object({
  nodeId: z.string().min(1),
  action: z.string().min(1),
  system: z.string().min(1),
  detail: z.string().min(1),
});

// ── Fault scenario schema ─────────────────────────────────────────────────────
export const FaultScenarioSchema = z.object({
  id:            z.string().min(1),
  label:         z.string().min(1),
  color:         z.string().regex(/^#[0-9a-fA-F]{6}$/),
  description:   z.string().min(1),
  affectedEdges: z.array(z.string()),
  affectedNodes: z.array(z.string()),
  severity:      z.enum(['critical', 'high', 'medium', 'low']),
  steps:         z.array(FaultStepSchema).min(1),
  recovery:      z.object({
    seconds:     z.number().positive(),
    description: z.string().min(1),
  }),
});

// ── Circuit type schema ───────────────────────────────────────────────────────
export const CircuitTypeSchema = z.object({
  id:           z.string().min(1),
  label:        z.string().min(1),
  icon:         z.string(),
  needsOptical: z.boolean(),
});

// ── SLA tier schema ───────────────────────────────────────────────────────────
export const SLATierSchema = z.object({
  id:        z.string().min(1),
  label:     z.string().min(1),
  latencyMs: z.number().positive(),
  jitterMs:  z.number().positive(),
  downtime:  z.string().min(1),
});

// ── Validation runner ─────────────────────────────────────────────────────────
export function validatePlatformData({ nodes, edges, faultScenarios, circuitTypes, slaTiers }) {
  const errors = [];

  const check = (schema, data, label) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      errors.push({ label, issues: result.error.issues });
      if (import.meta.env.DEV) {
        console.warn(`[Schema] Validation failed: ${label}`, result.error.issues);
      }
    }
  };

  nodes?.forEach((node, i) => check(TopologyNodeSchema, node, `node[${i}] (${node.id})`));
  edges?.forEach((edge, i) => check(TopologyEdgeSchema, edge, `edge[${i}] (${edge.id})`));

  Object.entries(faultScenarios || {}).forEach(([id, scenario]) =>
    check(FaultScenarioSchema, scenario, `faultScenario[${id}]`)
  );

  circuitTypes?.forEach((ct, i) => check(CircuitTypeSchema, ct, `circuitType[${i}] (${ct.id})`));
  slaTiers?.forEach((st, i) => check(SLATierSchema, st, `slaTier[${i}] (${st.id})`));

  return { valid: errors.length === 0, errors };
}
