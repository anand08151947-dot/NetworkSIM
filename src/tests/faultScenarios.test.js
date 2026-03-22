import { describe, it, expect } from 'vitest';
import { FAULT_SCENARIOS } from '../data/faultScenarios.js';
import { FaultScenarioSchema } from '../data/schemas.js';

describe('FAULT_SCENARIOS', () => {
  it('exports a non-empty object', () => {
    expect(typeof FAULT_SCENARIOS).toBe('object');
    expect(Object.keys(FAULT_SCENARIOS).length).toBeGreaterThan(0);
  });

  it('each scenario has required fields', () => {
    Object.entries(FAULT_SCENARIOS).forEach(([key, scenario]) => {
      expect(scenario.id, `${key}.id`).toBeTruthy();
      expect(scenario.label, `${key}.label`).toBeTruthy();
      expect(scenario.severity, `${key}.severity`).toMatch(/critical|high|medium|low/);
      expect(Array.isArray(scenario.steps), `${key}.steps is array`).toBe(true);
      expect(scenario.steps.length, `${key}.steps not empty`).toBeGreaterThan(0);
      expect(scenario.recovery.seconds, `${key}.recovery.seconds`).toBeGreaterThan(0);
    });
  });

  it('validates all scenarios against Zod schema', () => {
    Object.entries(FAULT_SCENARIOS).forEach(([key, scenario]) => {
      const result = FaultScenarioSchema.safeParse(scenario);
      expect(result.success, `Schema validation failed for ${key}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    });
  });

  it('includes OTN ring scenarios (Sprint 2)', () => {
    expect(FAULT_SCENARIOS).toHaveProperty('otn_ring_aps_failure');
    expect(FAULT_SCENARIOS).toHaveProperty('otn_ring_node_failure');
    expect(FAULT_SCENARIOS.otn_ring_aps_failure.severity).toBe('high');
    expect(FAULT_SCENARIOS.otn_ring_node_failure.severity).toBe('critical');
  });

  it('includes BGP RR failover scenario (Sprint 3)', () => {
    expect(FAULT_SCENARIOS).toHaveProperty('bgp_rr_failover');
    expect(FAULT_SCENARIOS.bgp_rr_failover.severity).toBe('high');
  });

  it('all steps reference a nodeId string', () => {
    Object.entries(FAULT_SCENARIOS).forEach(([key, scenario]) => {
      scenario.steps.forEach((step, i) => {
        expect(typeof step.nodeId, `${key}.steps[${i}].nodeId`).toBe('string');
        expect(step.nodeId.length, `${key}.steps[${i}].nodeId not empty`).toBeGreaterThan(0);
      });
    });
  });
});
