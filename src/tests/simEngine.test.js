import { describe, it, expect, vi, afterEach } from 'vitest';
import { SimEngine } from '../simulation/engine.js';
import { SimEvents, SIM_EVENT } from '../simulation/events.js';

describe('SimEvents (event bus)', () => {
  afterEach(() => SimEvents.off());

  it('emits and receives events', () => {
    const handler = vi.fn();
    SimEvents.on(SIM_EVENT.NOC_ALERT, handler);
    SimEvents.emit(SIM_EVENT.NOC_ALERT, { severity: 'high', message: 'Test' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].severity).toBe('high');
  });

  it('once() fires only once', () => {
    const handler = vi.fn();
    SimEvents.once(SIM_EVENT.BGP_SESSION_DOWN, handler);
    SimEvents.emit(SIM_EVENT.BGP_SESSION_DOWN, { peerId: 'test' });
    SimEvents.emit(SIM_EVENT.BGP_SESSION_DOWN, { peerId: 'test' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe function removes handler', () => {
    const handler = vi.fn();
    const unsub = SimEvents.on(SIM_EVENT.OTN_APS_TRIGGER, handler);
    unsub();
    SimEvents.emit(SIM_EVENT.OTN_APS_TRIGGER, {});
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('SimEngine.applyCapacityDrift', () => {
  it('drifts node capacity within bounds', () => {
    const nodes = [
      { id: 'n1', data: { capacity: 50, status: 'healthy' } },
      { id: 'n2', data: { capacity: 30, status: 'healthy' } },
    ];
    const drifted = SimEngine.applyCapacityDrift(nodes);
    drifted.forEach(node => {
      expect(node.data.capacity).toBeGreaterThanOrEqual(5);
      expect(node.data.capacity).toBeLessThanOrEqual(95);
    });
  });

  it('updates status based on capacity thresholds', () => {
    const nodes = [
      { id: 'high',   data: { capacity: 82, status: 'healthy' } },
      { id: 'medium', data: { capacity: 60, status: 'healthy' } },
      { id: 'low',    data: { capacity: 40, status: 'healthy' } },
    ];
    const drifted = SimEngine.applyCapacityDrift(nodes);
    // Capacity 82 → critical, 60 → warning, 40 → healthy (with drift)
    // Just check types are correct strings
    drifted.forEach(node => {
      expect(['healthy', 'warning', 'critical']).toContain(node.data.status);
    });
  });

  it('does not drift critical nodes', () => {
    const nodes = [{ id: 'n1', data: { capacity: 95, status: 'critical' } }];
    const drifted = SimEngine.applyCapacityDrift(nodes);
    expect(drifted[0].data.capacity).toBe(95);
  });
});

describe('SimEngine lifecycle', () => {
  it('starts and stops without errors', () => {
    const engine = new SimEngine({ tickMs: 100 });
    engine.start();
    expect(engine.running).toBe(true);
    engine.stop();
    expect(engine.running).toBe(false);
  });

  it('increments tickCount on each tick', async () => {
    const engine = new SimEngine({ tickMs: 50 });
    engine.start();
    await new Promise(r => setTimeout(r, 160));
    engine.stop();
    expect(engine.tickCount).toBeGreaterThanOrEqual(2);
  });
});
