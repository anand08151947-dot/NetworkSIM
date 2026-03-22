// Mock API — simulates realistic ISP OSS/BSS API calls with delays
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = (min, max) => delay(min + Math.random() * (max - min));

function requestId() {
  return `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── NetBox API ────────────────────────────────────────────────
export const NetBoxAPI = {
  async allocatePort(oltId) {
    await randomDelay(300, 700);
    const port = Math.floor(Math.random() * 14) + 35; // ports 35-48 (free)
    return { success: true, reqId: requestId(), oltId, port, assignedAt: new Date().toISOString() };
  },
  async allocateIPPrefix(tier) {
    await randomDelay(200, 500);
    const base = tier === 'enterprise' ? '67.134.60' : tier === 'smb' ? '67.134.55' : '172.16.44';
    const host = Math.floor(Math.random() * 200) + 10;
    return { success: true, reqId: requestId(), prefix: `${base}.${host}/30`, gateway: `${base}.${host + 1}`, dns: '45.90.28.1' };
  },
  async registerDevice(type, label) {
    await randomDelay(400, 900);
    return { success: true, reqId: requestId(), deviceId: Math.floor(Math.random() * 9000) + 1000, label, status: 'active', createdAt: new Date().toISOString() };
  },
  async updateRecord(id, changes) {
    await randomDelay(150, 350);
    return { success: true, reqId: requestId(), id, updated: Object.keys(changes), updatedAt: new Date().toISOString() };
  },
};

// ── RADIUS API ────────────────────────────────────────────────
export const RadiusAPI = {
  async createProfile(mac, vlan, speed, tier) {
    await randomDelay(200, 500);
    const sessionId = `0x${Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0')}`;
    return { success: true, reqId: requestId(), sessionId, user: `${mac.replace(/:/g, '')}@northstarfiber`, policy: `${tier}-${speed}`, vlan, createdAt: new Date().toISOString() };
  },
  async sendCoA(sessionId, newSpeed) {
    await randomDelay(100, 300);
    return { success: true, reqId: requestId(), sessionId, action: 'CHANGE_OF_AUTH', newPolicy: newSpeed, appliedAt: new Date().toISOString(), reconnectMs: 210 };
  },
  async deleteProfile(sessionId) {
    await randomDelay(100, 250);
    return { success: true, reqId: requestId(), sessionId, deletedAt: new Date().toISOString() };
  },
};

// ── OLT API (Calix Cloud) ─────────────────────────────────────
export const OLTAPI = {
  async provisionONT(oltId, port, sn, tier) {
    await randomDelay(500, 1200);
    return { success: true, reqId: requestId(), oltId, port, sn, profile: `${tier}-XGS-PON`, status: 'online', provisionedAt: new Date().toISOString() };
  },
  async updateBandwidthProfile(oltId, port, newSpeed) {
    await randomDelay(300, 700);
    return { success: true, reqId: requestId(), oltId, port, newProfile: `BW-${newSpeed}`, updatedAt: new Date().toISOString() };
  },
  async deactivateONT(oltId, port) {
    await randomDelay(200, 400);
    return { success: true, reqId: requestId(), oltId, port, status: 'deactivated', at: new Date().toISOString() };
  },
};

// ── BNG API (Cisco NSO) ───────────────────────────────────────
export const BNGAPI = {
  async addSubscriberPolicy(ip, speed, tier) {
    await randomDelay(300, 600);
    return { success: true, reqId: requestId(), ip, policy: `${tier}-${speed}`, sessionId: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`, appliedAt: new Date().toISOString() };
  },
  async updateQoSPolicy(sessionId, newSpeed) {
    await randomDelay(150, 350);
    return { success: true, reqId: requestId(), sessionId, newPolicy: `${newSpeed}-QoS`, updatedAt: new Date().toISOString() };
  },
  async expandSubscriberPool(currentMax, increment) {
    await randomDelay(600, 1400);
    return { success: true, reqId: requestId(), newMax: currentMax + increment, licenseUpdated: true, effectiveAt: new Date().toISOString() };
  },
};

// ── CRM API (Salesforce) ──────────────────────────────────────
export const CRMAPI = {
  async createAccount() {
    await randomDelay(300, 700);
    return { success: true, reqId: requestId(), accountId: `ACC-${Date.now()}`, status: 'active', createdAt: new Date().toISOString() };
  },
  async updateServicePlan(accountId, newPlan) {
    await randomDelay(200, 500);
    return { success: true, reqId: requestId(), accountId, newPlan, updatedAt: new Date().toISOString() };
  },
  async sendNotification(accountId, message, channel) {
    await randomDelay(100, 300);
    return { success: true, reqId: requestId(), accountId, channel, sentAt: new Date().toISOString() };
  },
};

// ── Billing API (Amdocs) ──────────────────────────────────────
export const BillingAPI = {
  async createOrder(customer) {
    await randomDelay(300, 600);
    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
    return { success: true, reqId: requestId(), orderId, plan: customer.plan, rate: customer.rate, effectiveDate: new Date().toISOString().slice(0, 10) };
  },
  async changeplan(accountId, oldPlan, newPlan, newRate) {
    await randomDelay(200, 500);
    return { success: true, reqId: requestId(), accountId, oldPlan, newPlan, newRate, proratedCredit: (newRate - (newRate * 0.8)).toFixed(2), effectiveAt: new Date().toISOString() };
  },
};

// ── EVC Provisioning API (Nokia NSP / Ciena MCP) ──────────────────────────────
export const EVCProvisionAPI = {
  async createEVCService({ serviceType, customerId, aEndpoint, zEndpoint, cirMbps, eirMbps, vlan, sla }) {
    await randomDelay(800, 1800);
    const serviceId = `EVC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    return {
      success: true, reqId: requestId(), serviceId,
      serviceType,   // E-LINE, E-LAN, EVPN-VPWS
      customerId, aEndpoint, zEndpoint, cirMbps, eirMbps, vlan, sla,
      evcId:    `EVC-${Math.floor(Math.random() * 9000) + 1000}`,
      svlan:    Math.floor(Math.random() * 3000) + 1000,  // service VLAN (QinQ outer)
      status:   'provisioning',
      createdAt: new Date().toISOString(),
    };
  },

  async activateEVCService(serviceId) {
    await randomDelay(1200, 2500);
    return {
      success: true, reqId: requestId(), serviceId,
      status: 'active',
      activatedAt: new Date().toISOString(),
      oamMepId: Math.floor(Math.random() * 8000) + 1000,    // CFM MEP
      ccrInterval: '1s',                                      // CCM interval
      loopbackResult: 'pass',
    };
  },

  async modifyEVCBandwidth(serviceId, newCirMbps, newEirMbps) {
    await randomDelay(400, 900);
    return {
      success: true, reqId: requestId(), serviceId,
      newCirMbps, newEirMbps,
      coaApplied: true,         // Change of Authorization
      updatedAt: new Date().toISOString(),
    };
  },

  async deactivateEVCService(serviceId) {
    await randomDelay(600, 1200);
    return {
      success: true, reqId: requestId(), serviceId,
      status: 'deactivated',
      deactivatedAt: new Date().toISOString(),
    };
  },

  async runOAMLoopback(serviceId, targetMep) {
    await randomDelay(200, 600);
    const rttMs = (Math.random() * 3 + 0.5).toFixed(2);
    return {
      success: true, reqId: requestId(), serviceId, targetMep,
      result: 'pass', rttMs: parseFloat(rttMs),
      framesSent: 5, framesReceived: 5, frameLoss: 0,
    };
  },
};

// ── Customer Onboarding API (BSS Workflow) ────────────────────────────────────
export const CustomerOnboardingAPI = {
  async submitOrder({ customerName, tier, services, sites }) {
    await randomDelay(500, 1000);
    const orderId = `ORD-ONBOARD-${Date.now().toString(36).toUpperCase()}`;
    return {
      success: true, reqId: requestId(), orderId,
      customerName, tier, services, sites,
      status: 'submitted',
      assignedEngineer: `eng-${Math.floor(Math.random() * 20) + 1}@northstarfiber.net`,
      estimatedActivation: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
  },

  async assignNNI({ orderId, aNodeId, zNodeId, nniType, bandwidth }) {
    await randomDelay(400, 800);
    return {
      success: true, reqId: requestId(), orderId,
      nniId:    `NNI-${Math.floor(Math.random() * 900) + 100}`,
      aNodeId, zNodeId, nniType,   // 'UNI' | 'E-NNI' | 'I-NNI'
      bandwidth,
      port:     `GigabitEthernet0/${Math.floor(Math.random() * 48) + 1}`,
      assignedAt: new Date().toISOString(),
    };
  },

  async generateLOA({ orderId, customerId, circuitId, provider }) {
    await randomDelay(300, 600);
    return {
      success: true, reqId: requestId(), orderId,
      loaId:      `LOA-${Date.now().toString(36).toUpperCase()}`,
      customerId, circuitId, provider,
      loaNumber:  `NSF-LOA-${Math.floor(Math.random() * 90000) + 10000}`,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      pdfUrl:     `/loa/NSF-LOA-${orderId}.pdf`,
      issuedAt:   new Date().toISOString(),
    };
  },

  async completeSiteAudit({ orderId, siteId, technicianId }) {
    await randomDelay(600, 1200);
    const passed = Math.random() > 0.1; // 90% pass rate
    return {
      success: true, reqId: requestId(), orderId, siteId, technicianId,
      result:   passed ? 'pass' : 'conditional-pass',
      findings: passed ? [] : ['Cable labeling incomplete', 'Patch panel cleanup required'],
      signedOffAt: new Date().toISOString(),
    };
  },

  async activateCustomer({ orderId, customerId }) {
    await randomDelay(1000, 2000);
    return {
      success: true, reqId: requestId(), orderId, customerId,
      status:     'active',
      welcomeEmailSent: true,
      portalCredentials: { username: `cust-${customerId}`, tempPassword: '****' },
      activatedAt: new Date().toISOString(),
    };
  },
};

// ── MPLS / EVPN-VPWS API (Cisco NSO / Nokia NSP) ─────────────────────────────
export const MplsAPI = {
  async createEVPNVPWSService({ customerId, aEndpoint, zEndpoint, esi, rd, rtImport, rtExport, bandwidth }) {
    await randomDelay(900, 2000);
    const instanceId = Math.floor(Math.random() * 90000) + 10000;
    return {
      success: true, reqId: requestId(),
      instanceId, customerId, aEndpoint, zEndpoint,
      esi, rd, rtImport, rtExport, bandwidth,
      vpwsId:     `VPWS-${instanceId}`,
      pseudowireId: Math.floor(Math.random() * 9000) + 1000,
      labelA:     Math.floor(Math.random() * 90000) + 10000,
      labelZ:     Math.floor(Math.random() * 90000) + 10000,
      status:     'active',
      provisionedAt: new Date().toISOString(),
    };
  },

  async createEVPNELAN({ customerId, sites, vni, rd, rtImport, rtExport, macVRF }) {
    await randomDelay(1200, 2500);
    const instanceId = Math.floor(Math.random() * 90000) + 10000;
    return {
      success: true, reqId: requestId(),
      instanceId, customerId, sites, vni, rd, rtImport, rtExport, macVRF,
      eLanId:   `ELAN-${instanceId}`,
      status:   'active',
      siteCount: sites?.length || 0,
      provisionedAt: new Date().toISOString(),
    };
  },

  async deleteService(serviceId) {
    await randomDelay(500, 1000);
    return {
      success: true, reqId: requestId(), serviceId,
      status:    'deleted',
      deletedAt: new Date().toISOString(),
    };
  },

  async getLabelBindings(peId) {
    await randomDelay(150, 350);
    return {
      success: true, reqId: requestId(), peId,
      bindings: Array.from({ length: 5 }, (_, i) => ({
        prefix:       `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.0/24`,
        localLabel:   Math.floor(Math.random() * 90000) + 10000,
        remoteLabel:  Math.floor(Math.random() * 90000) + 10000,
        nextHop:      `172.16.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 254) + 1}`,
        interface:    `TenGigE0/0/${i + 1}/0`,
      })),
      retrievedAt: new Date().toISOString(),
    };
  },
};
