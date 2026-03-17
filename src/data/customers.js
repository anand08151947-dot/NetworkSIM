// Simulated customer database — all 3 tiers
let _nextId = 1470;
export function nextCustomerId() { return _nextId++; }

const CITIES = ['Seattle', 'Bellevue', 'Spokane', 'Tacoma', 'Bellingham', 'Portland', 'Boise', 'Wenatchee', 'Yakima', 'Olympia'];
const STREETS = ['Oak St', 'Maple Ave', 'Pine Rd', 'Cedar Blvd', 'Elm Way', 'Birch Ln', 'Willow Dr', 'Spruce Ct'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

function genIP(base) {
  return `${base}.${Math.floor(Math.random() * 250) + 2}`;
}
function genMAC() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');
}
function randDate(monthsBack) {
  const d = new Date();
  d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d.toISOString().slice(0, 10);
}

const RESIDENTIAL_PLANS = [
  { speed: '1G', plan: 'North Star 1Gbps Home', rate: 55, tier: 'residential' },
  { speed: '2G', plan: 'North Star 2Gbps Home', rate: 75, tier: 'residential' },
  { speed: '5G', plan: 'North Star 5Gbps Home', rate: 110, tier: 'residential' },
];
const SMB_PLANS = [
  { speed: '1G', plan: 'North Star Business 1Gbps', rate: 299, tier: 'smb' },
  { speed: '2G', plan: 'North Star Business 2Gbps', rate: 449, tier: 'smb' },
];
const ENTERPRISE_PLANS = [
  { speed: '5G', plan: 'North Star Enterprise 5G MPLS', rate: 4200, tier: 'enterprise' },
  { speed: '2G', plan: 'North Star Enterprise 2G DIA', rate: 1800, tier: 'enterprise' },
];

const FIRST_NAMES = ['James', 'Maria', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Barbara', 'William', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah', 'Thomas', 'Karen', 'Charles', 'Nancy', 'Christopher', 'Lisa', 'Daniel', 'Betty', 'Matthew', 'Dorothy', 'Anthony', 'Sandra', 'Mark', 'Ashley'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young', 'Robinson', 'Walker', 'Allen', 'King', 'Scott', 'Green', 'Baker'];
const COMPANIES = ['Acme Corp', 'TechVantage Inc', 'Pacific Northwest Media', 'CascadeCloud LLC', 'Rainier Tech', 'Olympic Digital', 'Cascade Software', 'Northwest Analytics', 'Puget Systems', 'Columbia River Group', 'Emerald City Studios', 'Alpine Networks', 'Sound Digital', 'Beacon Systems', 'Horizon Analytics'];

function makeResidential(i) {
  const plan = RESIDENTIAL_PLANS[i % 3];
  const city = rand(CITIES);
  return {
    id: 1000 + i,
    name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
    company: null,
    address: `${100 + i * 7} ${rand(STREETS)}, ${city}, WA`,
    city,
    tier: 'residential',
    speed: plan.speed,
    plan: plan.plan,
    rate: plan.rate,
    ip: genIP('172.16.44'),
    mac: genMAC(),
    oltPort: (i % 48) + 1,
    oltDevice: i < 18 ? 'OLT-1 (Calix E7-2)' : 'OLT-2 (Nokia 7360)',
    vlan: 1000 + i,
    radiusSession: `0x${(3000 + i).toString(16).toUpperCase()}`,
    status: i < 33 ? 'active' : i < 35 ? 'suspended' : 'active',
    joinDate: randDate(24),
    uptime: `${Math.floor(Math.random() * 60) + 1}d ${Math.floor(Math.random() * 24)}h`,
    latency: `${Math.floor(Math.random() * 15) + 2}ms`,
    rxMbps: Math.floor(Math.random() * parseInt(plan.speed) * 800),
    txMbps: Math.floor(Math.random() * parseInt(plan.speed) * 200),
  };
}

function makeSMB(i) {
  const plan = SMB_PLANS[i % 2];
  const city = rand(CITIES);
  return {
    id: 1200 + i,
    name: COMPANIES[i % COMPANIES.length] + ' — Primary',
    company: COMPANIES[i % COMPANIES.length],
    address: `Suite ${100 + i}, ${200 + i * 3} Business Park Dr, ${city}, WA`,
    city,
    tier: 'smb',
    speed: plan.speed,
    plan: plan.plan,
    rate: plan.rate,
    ip: genIP('67.134.55'),
    mac: genMAC(),
    oltPort: (i % 24) + 1,
    oltDevice: 'OLT-2 (Nokia 7360)',
    vlan: 2000 + i,
    radiusSession: `0x${(5000 + i).toString(16).toUpperCase()}`,
    status: 'active',
    joinDate: randDate(36),
    uptime: `${Math.floor(Math.random() * 90) + 30}d ${Math.floor(Math.random() * 24)}h`,
    latency: `${Math.floor(Math.random() * 5) + 1}ms`,
    sla: '99.9%',
    staticIp: true,
    ddosProtection: true,
    rxMbps: Math.floor(Math.random() * parseInt(plan.speed) * 600),
    txMbps: Math.floor(Math.random() * parseInt(plan.speed) * 400),
  };
}

function makeEnterprise(i) {
  const plan = ENTERPRISE_PLANS[i % 2];
  const city = rand(['Seattle', 'Bellevue', 'Spokane', 'Portland', 'Boise']);
  return {
    id: 1400 + i,
    name: COMPANIES[(i + 5) % COMPANIES.length] + ' — Enterprise',
    company: COMPANIES[(i + 5) % COMPANIES.length],
    address: `Floor ${i + 2}, ${500 + i * 11} Enterprise Blvd, ${city}, WA`,
    city,
    tier: 'enterprise',
    speed: plan.speed,
    plan: plan.plan,
    rate: plan.rate,
    ip: genIP('67.134.60'),
    mac: genMAC(),
    oltPort: i + 1,
    oltDevice: 'OLT-2 (Nokia 7360)',
    vlan: 3000 + i,
    radiusSession: `0x${(7000 + i).toString(16).toUpperCase()}`,
    status: 'active',
    joinDate: randDate(48),
    uptime: `${Math.floor(Math.random() * 180) + 60}d ${Math.floor(Math.random() * 24)}h`,
    latency: `${Math.floor(Math.random() * 3) + 1}ms`,
    sla: '99.99%',
    staticIp: true,
    ddosProtection: true,
    mplsVpn: true,
    vrfName: `VRF-${COMPANIES[(i + 5) % COMPANIES.length].toUpperCase().replace(/\s/g, '-').slice(0, 12)}-${1000 + i}`,
    sites: Math.floor(Math.random() * 4) + 2,
    rxMbps: Math.floor(Math.random() * parseInt(plan.speed) * 700),
    txMbps: Math.floor(Math.random() * parseInt(plan.speed) * 500),
  };
}

export const initialCustomers = [
  ...Array.from({ length: 35 }, (_, i) => makeResidential(i)),
  ...Array.from({ length: 10 }, (_, i) => makeSMB(i)),
  ...Array.from({ length: 5 }, (_, i) => makeEnterprise(i)),
];

export const TIER_COLORS = {
  residential: '#6366f1',
  smb: '#10b981',
  enterprise: '#f59e0b',
};

export const TIER_LABELS = {
  residential: '🏠 Residential',
  smb: '🏢 Small Business',
  enterprise: '🏗️ Enterprise',
};
