import { describe, it, expect } from 'vitest';
import {
  NetBoxAPI, RadiusAPI, OLTAPI, BNGAPI, CRMAPI, BillingAPI,
  EVCProvisionAPI, CustomerOnboardingAPI, MplsAPI,
} from '../utils/mockApi.js';

describe('NetBoxAPI', () => {
  it('allocatePort returns a port number', async () => {
    const result = await NetBoxAPI.allocatePort('olt-1');
    expect(result.success).toBe(true);
    expect(typeof result.port).toBe('number');
    expect(result.reqId).toMatch(/^REQ-/);
  });

  it('allocateIPPrefix returns a valid prefix', async () => {
    const result = await NetBoxAPI.allocateIPPrefix('enterprise');
    expect(result.success).toBe(true);
    expect(result.prefix).toContain('/30');
  });
});

describe('RadiusAPI', () => {
  it('createProfile returns a session ID', async () => {
    const result = await RadiusAPI.createProfile('aa:bb:cc:dd:ee:ff', 100, '1G', 'residential');
    expect(result.success).toBe(true);
    expect(result.sessionId).toMatch(/^0x/);
  });

  it('sendCoA updates speed policy', async () => {
    const result = await RadiusAPI.sendCoA('0xABCD', '2G');
    expect(result.success).toBe(true);
    expect(result.action).toBe('CHANGE_OF_AUTH');
  });
});

describe('EVCProvisionAPI (Sprint 6)', () => {
  it('createEVCService returns a service ID', async () => {
    const result = await EVCProvisionAPI.createEVCService({
      serviceType: 'E-LINE',
      customerId: 'CUST-001',
      aEndpoint: 'SEA-CO1',
      zEndpoint: 'BEL-CO2',
      cirMbps: 1000,
      eirMbps: 2000,
      vlan: 100,
      sla: 'gold',
    });
    expect(result.success).toBe(true);
    expect(result.serviceId).toBeTruthy();
    expect(result.status).toBe('provisioning');
  });

  it('activateEVCService sets status to active', async () => {
    const result = await EVCProvisionAPI.activateEVCService('EVC-TEST-001');
    expect(result.success).toBe(true);
    expect(result.status).toBe('active');
    expect(result.loopbackResult).toBe('pass');
  });

  it('runOAMLoopback returns pass result', async () => {
    const result = await EVCProvisionAPI.runOAMLoopback('EVC-001', 'MEP-1001');
    expect(result.success).toBe(true);
    expect(result.result).toBe('pass');
    expect(result.frameLoss).toBe(0);
  });
});

describe('CustomerOnboardingAPI (Sprint 6)', () => {
  it('submitOrder returns an order ID', async () => {
    const result = await CustomerOnboardingAPI.submitOrder({
      customerName: 'Test Corp', tier: 'enterprise',
      services: ['EVPN-VPWS'], sites: ['SEA-CO1', 'BEL-CO2'],
    });
    expect(result.success).toBe(true);
    expect(result.orderId).toMatch(/^ORD-ONBOARD-/);
    expect(result.assignedEngineer).toContain('@northstarfiber.net');
  });

  it('assignNNI returns a NNI ID', async () => {
    const result = await CustomerOnboardingAPI.assignNNI({
      orderId: 'ORD-TEST', aNodeId: 'mpls_pe', zNodeId: 'border_router',
      nniType: 'E-NNI', bandwidth: '10G',
    });
    expect(result.success).toBe(true);
    expect(result.nniId).toMatch(/^NNI-/);
  });

  it('generateLOA returns LOA details', async () => {
    const result = await CustomerOnboardingAPI.generateLOA({
      orderId: 'ORD-TEST', customerId: 'CUST-001',
      circuitId: 'EVC-001', provider: 'NorthStar Fiber',
    });
    expect(result.success).toBe(true);
    expect(result.loaNumber).toMatch(/^NSF-LOA-/);
    expect(result.pdfUrl).toContain('.pdf');
  });
});

describe('MplsAPI (Sprint 6)', () => {
  it('createEVPNVPWSService returns service details', async () => {
    const result = await MplsAPI.createEVPNVPWSService({
      customerId: 'CUST-001',
      aEndpoint: 'SEA-CO1', zEndpoint: 'SPO-CO6',
      esi: '00:01:02:03:04:05:06:07:08:09',
      rd: '65000:1001', rtImport: '65000:1001', rtExport: '65000:1001',
      bandwidth: '10G',
    });
    expect(result.success).toBe(true);
    expect(result.vpwsId).toMatch(/^VPWS-/);
    expect(result.labelA).toBeGreaterThan(0);
    expect(result.labelZ).toBeGreaterThan(0);
  });

  it('getLabelBindings returns binding array', async () => {
    const result = await MplsAPI.getLabelBindings('mpls_pe');
    expect(result.success).toBe(true);
    expect(Array.isArray(result.bindings)).toBe(true);
    expect(result.bindings.length).toBeGreaterThan(0);
    expect(result.bindings[0]).toHaveProperty('localLabel');
    expect(result.bindings[0]).toHaveProperty('remoteLabel');
  });
});
