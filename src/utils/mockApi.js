// Mock API — simulates realistic ISP OSS/BSS API calls with delays
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = (min, max) => delay(min + Math.random() * (max - min));

function requestId() {
  return `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ── NetBox API ────────────────────────────────────────────────
export const NetBoxAPI = {
  async allocatePort(oltId, tier) {
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
  async createAccount(customer) {
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
