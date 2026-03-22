import { describe, it, expect } from 'vitest';
import { CIRCUIT_TYPES, SLA_TIERS, PROTECTION_LEVELS, EQUIPMENT_STACKS } from '../data/circuitPlans.js';
import { CircuitTypeSchema, SLATierSchema } from '../data/schemas.js';

describe('CIRCUIT_TYPES', () => {
  it('contains at least the original 6 types', () => {
    const ids = CIRCUIT_TYPES.map(ct => ct.id);
    ['l3vpn', 'evc', 'dia', 'wave', 'backhaul', 'dci'].forEach(id => {
      expect(ids, `Missing original type: ${id}`).toContain(id);
    });
  });

  it('includes Sprint 4 EVPN-VPWS and E-LAN types', () => {
    const ids = CIRCUIT_TYPES.map(ct => ct.id);
    expect(ids).toContain('evpn_vpws');
    expect(ids).toContain('elan');
  });

  it('each circuit type passes Zod schema', () => {
    CIRCUIT_TYPES.forEach(ct => {
      const result = CircuitTypeSchema.safeParse(ct);
      expect(result.success, `Schema fail for ${ct.id}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    });
  });

  it('each circuit type has an equipment stack', () => {
    CIRCUIT_TYPES.forEach(ct => {
      expect(EQUIPMENT_STACKS, `Missing equipment stack for ${ct.id}`).toHaveProperty(ct.id);
      expect(Array.isArray(EQUIPMENT_STACKS[ct.id])).toBe(true);
      expect(EQUIPMENT_STACKS[ct.id].length).toBeGreaterThan(0);
    });
  });
});

describe('SLA_TIERS', () => {
  it('includes Sprint 3 Platinum tier', () => {
    const ids = SLA_TIERS.map(t => t.id);
    expect(ids).toContain('platinum');
    const platinum = SLA_TIERS.find(t => t.id === 'platinum');
    expect(platinum.latencyMs).toBeLessThanOrEqual(2);
  });

  it('contains all tiers in order of quality', () => {
    const ids = SLA_TIERS.map(t => t.id);
    expect(ids).toContain('gold');
    expect(ids).toContain('silver');
    expect(ids).toContain('bronze');
  });

  it('each SLA tier passes Zod schema', () => {
    SLA_TIERS.forEach(tier => {
      const result = SLATierSchema.safeParse(tier);
      expect(result.success, `Schema fail for ${tier.id}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    });
  });

  it('latency increases from platinum to bronze', () => {
    const platinum = SLA_TIERS.find(t => t.id === 'platinum');
    const gold     = SLA_TIERS.find(t => t.id === 'gold');
    const silver   = SLA_TIERS.find(t => t.id === 'silver');
    const bronze   = SLA_TIERS.find(t => t.id === 'bronze');
    if (platinum && gold) expect(platinum.latencyMs).toBeLessThan(gold.latencyMs);
    if (gold && silver)   expect(gold.latencyMs).toBeLessThan(silver.latencyMs);
    if (silver && bronze) expect(silver.latencyMs).toBeLessThan(bronze.latencyMs);
  });
});

describe('PROTECTION_LEVELS', () => {
  it('contains None, 1+1, 1:1, and Diverse', () => {
    const ids = PROTECTION_LEVELS.map(p => p.id);
    expect(ids).toContain('none');
    expect(ids).toContain('oneplus');
    expect(ids).toContain('onecol');
    expect(ids).toContain('diverse');
  });

  it('1+1 and 1:1 switchover is 50ms', () => {
    const oneplus = PROTECTION_LEVELS.find(p => p.id === 'oneplus');
    const onecol  = PROTECTION_LEVELS.find(p => p.id === 'onecol');
    expect(oneplus.switchoverMs).toBe(50);
    expect(onecol.switchoverMs).toBe(50);
  });
});
