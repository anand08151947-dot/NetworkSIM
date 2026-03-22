// ============================================================
// NORTH STAR FIBER — Complete ISP Network Topology
// All layers: Customer → Access → CO → Metro → Core → Internet
// + OSS/BSS Plane + Security + Management
// ============================================================

export const LAYERS = {
  CUSTOMER: 'customer',
  ACCESS: 'access',
  CENTRAL_OFFICE: 'central_office',
  IP_SERVICES: 'ip_services',
  SECURITY: 'security',
  METRO: 'metro',
  CORE: 'core',
  INTERNET: 'internet',
  OSS_BSS: 'oss_bss',
  MANAGEMENT: 'management',
};

export const NODE_TYPES_MAP = {
  customer: { color: '#6366f1', icon: '🏠' },
  olt: { color: '#0ea5e9', icon: '📡' },
  splitter: { color: '#64748b', icon: '🔀' },
  ont: { color: '#8b5cf6', icon: '📦' },
  aggregation_switch: { color: '#0ea5e9', icon: '🔗' },
  bng: { color: '#f59e0b', icon: '🌐' },
  radius: { color: '#10b981', icon: '🔑' },
  dhcp_dns: { color: '#10b981', icon: '🗂️' },
  cgnat: { color: '#f59e0b', icon: '🔄' },
  mpls_pe: { color: '#8b5cf6', icon: '🔵' },
  cdn_cache: { color: '#06b6d4', icon: '💾' },
  ddos: { color: '#ef4444', icon: '🛡️' },
  firewall: { color: '#ef4444', icon: '🔥' },
  border_router: { color: '#f59e0b', icon: '🔀' },
  metro_switch: { color: '#0ea5e9', icon: '⚡' },
  core_router: { color: '#3b82f6', icon: '🔷' },
  dwdm: { color: '#6366f1', icon: '💡' },
  ixp: { color: '#22c55e', icon: '🌍' },
  transit: { color: '#22c55e', icon: '☁️' },
  nms: { color: '#64748b', icon: '📊' },
  netbox: { color: '#10b981', icon: '🗄️' },
  crm: { color: '#f59e0b', icon: '👥' },
  billing: { color: '#f59e0b', icon: '💳' },
  provisioning: { color: '#8b5cf6', icon: '⚙️' },
  ptp_ntp: { color: '#64748b', icon: '⏱️' },
  oob: { color: '#64748b', icon: '🔧' },
};

// ── Initial capacity (%) per node
const cap = (v) => ({ capacity: v, maxCapacity: 100, status: 'healthy' });

export const initialNodes = [
  // ─── CUSTOMER PREMISES ─────────────────────────────────────
  {
    id: 'res_customer',
    type: 'networkNode',
    position: { x: 60, y: 720 },
    data: { label: 'Residential Customers', sublabel: '1G / 2G / 5G', layer: LAYERS.CUSTOMER, nodeType: 'customer', ...cap(22), count: 1240, icon: '🏠' },
  },
  {
    id: 'smb_customer',
    type: 'networkNode',
    position: { x: 240, y: 720 },
    data: { label: 'Small Business', sublabel: '1G / 2G Ethernet', layer: LAYERS.CUSTOMER, nodeType: 'customer', ...cap(18), count: 187, icon: '🏢' },
  },
  {
    id: 'mid_customer',
    type: 'networkNode',
    position: { x: 420, y: 720 },
    data: { label: 'Mid-Market Business', sublabel: '5G / MPLS L3VPN', layer: LAYERS.CUSTOMER, nodeType: 'customer', ...cap(31), count: 42, icon: '🏗️' },
  },

  // ─── CUSTOMER PREMISES EQUIPMENT ──────────────────────────
  {
    id: 'ont_res',
    type: 'networkNode',
    position: { x: 60, y: 610 },
    data: { label: 'ONT (Residential)', sublabel: 'XGS-PON / 10G', layer: LAYERS.ACCESS, nodeType: 'ont', ...cap(22), icon: '📦' },
  },
  {
    id: 'ont_biz',
    type: 'networkNode',
    position: { x: 330, y: 610 },
    data: { label: 'ONT (Business)', sublabel: 'XGS-PON SFP+', layer: LAYERS.ACCESS, nodeType: 'ont', ...cap(24), icon: '📦' },
  },

  // ─── ACCESS LAYER ──────────────────────────────────────────
  {
    id: 'splitter_1',
    type: 'networkNode',
    position: { x: 60, y: 510 },
    data: { label: 'Passive Splitter', sublabel: '1:32 Ratio', layer: LAYERS.ACCESS, nodeType: 'splitter', ...cap(22), icon: '🔀' },
  },
  {
    id: 'splitter_2',
    type: 'networkNode',
    position: { x: 240, y: 510 },
    data: { label: 'Passive Splitter', sublabel: '1:4 (Business)', layer: LAYERS.ACCESS, nodeType: 'splitter', ...cap(24), icon: '🔀' },
  },
  {
    id: 'olt_1',
    type: 'networkNode',
    position: { x: 60, y: 400 },
    data: { label: 'OLT — Calix E7-2', sublabel: 'XGS-PON | 48 ports', layer: LAYERS.ACCESS, nodeType: 'olt', ...cap(34), icon: '📡', portsFree: 14, portsUsed: 34 },
  },
  {
    id: 'olt_2',
    type: 'networkNode',
    position: { x: 240, y: 400 },
    data: { label: 'OLT — Nokia 7360', sublabel: 'XGS-PON | 48 ports', layer: LAYERS.ACCESS, nodeType: 'olt', ...cap(28), icon: '📡', portsFree: 20, portsUsed: 28 },
  },

  // ─── CENTRAL OFFICE ────────────────────────────────────────
  {
    id: 'agg_switch',
    type: 'networkNode',
    position: { x: 160, y: 300 },
    data: { label: 'Aggregation Switch', sublabel: 'Cisco Nexus 9300 | 400G', layer: LAYERS.CENTRAL_OFFICE, nodeType: 'aggregation_switch', ...cap(36), icon: '🔗' },
  },
  {
    id: 'radius',
    type: 'networkNode',
    position: { x: 560, y: 400 },
    data: { label: 'RADIUS Server', sublabel: 'FreeRADIUS | Auth/Policy', layer: LAYERS.CENTRAL_OFFICE, nodeType: 'radius', ...cap(21), icon: '🔑', activeSessions: 1469 },
  },
  {
    id: 'dhcp_dns',
    type: 'networkNode',
    position: { x: 700, y: 400 },
    data: { label: 'DHCP / DNS', sublabel: 'ISC DHCP | Unbound DNS', layer: LAYERS.CENTRAL_OFFICE, nodeType: 'dhcp_dns', ...cap(18), icon: '🗂️', ipPoolUsed: 1469, ipPoolTotal: 8192 },
  },
  {
    id: 'cdn_cache',
    type: 'networkNode',
    position: { x: 840, y: 400 },
    data: { label: 'CDN Cache Nodes', sublabel: 'Netflix OCA | Google GGC', layer: LAYERS.CENTRAL_OFFICE, nodeType: 'cdn_cache', ...cap(44), icon: '💾' },
  },

  // ─── IP SERVICES LAYER ─────────────────────────────────────
  {
    id: 'bng',
    type: 'networkNode',
    position: { x: 160, y: 200 },
    data: { label: 'BNG — Broadband Network Gateway', sublabel: 'Cisco ASR 9000 | PPPoE/IPoE | QoS Enforcement', layer: LAYERS.IP_SERVICES, nodeType: 'bng', ...cap(38), icon: '🌐', subscribers: 1469, maxSubscribers: 4000 },
  },
  {
    id: 'cgnat',
    type: 'networkNode',
    position: { x: 560, y: 290 },
    data: { label: 'CGNAT', sublabel: 'Carrier-Grade NAT | IPv4 Sharing', layer: LAYERS.IP_SERVICES, nodeType: 'cgnat', ...cap(29), icon: '🔄', natSessions: 48200 },
  },
  {
    id: 'mpls_pe',
    type: 'networkNode',
    position: { x: 700, y: 290 },
    data: { label: 'MPLS PE Router', sublabel: 'Juniper MX480 | L3VPN / EVPN', layer: LAYERS.IP_SERVICES, nodeType: 'mpls_pe', ...cap(27), icon: '🔵', vpnTunnels: 42 },
  },

  // ─── SECURITY LAYER ────────────────────────────────────────
  {
    id: 'ddos',
    type: 'networkNode',
    position: { x: 420, y: 200 },
    data: { label: 'DDoS Scrubbing', sublabel: 'Arbor TMS | BGP Flowspec', layer: LAYERS.SECURITY, nodeType: 'ddos', ...cap(12), icon: '🛡️', mitigationActive: false },
  },
  {
    id: 'firewall',
    type: 'networkNode',
    position: { x: 560, y: 200 },
    data: { label: 'Security Firewall', sublabel: 'Palo Alto PA-7000 | NGFW', layer: LAYERS.SECURITY, nodeType: 'firewall', ...cap(16), icon: '🔥' },
  },

  // ─── METRO / TRANSPORT LAYER ───────────────────────────────
  {
    id: 'metro_cisco',
    type: 'networkNode',
    position: { x: 160, y: 110 },
    data: { label: 'Metro Router', sublabel: 'Cisco 8000 Series | 400G', layer: LAYERS.METRO, nodeType: 'metro_switch', ...cap(33), icon: '⚡' },
  },
  {
    id: 'metro_ciena',
    type: 'networkNode',
    position: { x: 420, y: 110 },
    data: { label: 'Metro Transport', sublabel: 'Ciena 6500 | OTN/DWDM', layer: LAYERS.METRO, nodeType: 'dwdm', ...cap(29), icon: '💡', ringId: 'BLSR-RING-1', tributarySlots: 80, tributarySlotsUsed: 64, oduCapacity: 'ODU4×8' },
  },

  // ─── CORE / BACKBONE ───────────────────────────────────────
  {
    id: 'core_router_1',
    type: 'networkNode',
    position: { x: 160, y: 20 },
    data: { label: 'Core Router — Primary', sublabel: 'Ciena WL6e | OTN Backbone', layer: LAYERS.CORE, nodeType: 'core_router', ...cap(31), icon: '🔷', ringId: 'BLSR-RING-1', otnRole: 'working', rrCluster: 'RR-1', rrClientCount: 42 },
  },
  {
    id: 'core_router_2',
    type: 'networkNode',
    position: { x: 420, y: 20 },
    data: { label: 'Core Router — Secondary', sublabel: 'Ciena WL6e | Redundant Path', layer: LAYERS.CORE, nodeType: 'core_router', ...cap(18), icon: '🔷', ringId: 'BLSR-RING-1', otnRole: 'protection', rrCluster: 'RR-2', rrClientCount: 42 },
  },
  {
    id: 'border_router',
    type: 'networkNode',
    position: { x: 700, y: 110 },
    data: { label: 'Border Router', sublabel: 'Juniper MX | BGP / RPKI', layer: LAYERS.CORE, nodeType: 'border_router', ...cap(24), icon: '🔀', bgpPeers: 14 },
  },

  // ─── INTERNET / IXP ────────────────────────────────────────
  {
    id: 'ixp',
    type: 'networkNode',
    position: { x: 700, y: 20 },
    data: { label: 'IXP / Peering Fabric', sublabel: 'Seattle-IX | MICE | DE-CIX', layer: LAYERS.INTERNET, nodeType: 'ixp', ...cap(19), icon: '🌍' },
  },
  {
    id: 'transit_1',
    type: 'networkNode',
    position: { x: 880, y: 20 },
    data: { label: 'Transit — Cogent', sublabel: 'BGP Upstream | 100G', layer: LAYERS.INTERNET, nodeType: 'transit', ...cap(22), icon: '☁️' },
  },
  {
    id: 'transit_2',
    type: 'networkNode',
    position: { x: 880, y: 110 },
    data: { label: 'Transit — Lumen', sublabel: 'BGP Upstream | 100G Backup', layer: LAYERS.INTERNET, nodeType: 'transit', ...cap(14), icon: '☁️' },
  },

  // ─── OSS / BSS PLANE ───────────────────────────────────────
  {
    id: 'netbox',
    type: 'networkNode',
    position: { x: 1040, y: 200 },
    data: { label: 'NetBox', sublabel: 'IPAM / DCIM / Source of Truth', layer: LAYERS.OSS_BSS, nodeType: 'netbox', ...cap(14), icon: '🗄️', devices: 387, ipPrefixes: 128 },
  },
  {
    id: 'crm',
    type: 'networkNode',
    position: { x: 1040, y: 310 },
    data: { label: 'CRM — Salesforce', sublabel: 'Customer Accounts / Support', layer: LAYERS.OSS_BSS, nodeType: 'crm', ...cap(11), icon: '👥', totalCustomers: 1469 },
  },
  {
    id: 'billing',
    type: 'networkNode',
    position: { x: 1040, y: 420 },
    data: { label: 'Billing — Amdocs', sublabel: 'Invoicing / Revenue / Plans', layer: LAYERS.OSS_BSS, nodeType: 'billing', ...cap(9), icon: '💳', mrr: '$1.24M' },
  },
  {
    id: 'provisioning',
    type: 'networkNode',
    position: { x: 1040, y: 530 },
    data: { label: 'Provisioning Engine', sublabel: 'Order Mgmt / Auto-fulfill', layer: LAYERS.OSS_BSS, nodeType: 'provisioning', ...cap(17), icon: '⚙️' },
  },

  // ─── MANAGEMENT PLANE ──────────────────────────────────────
  {
    id: 'nms',
    type: 'networkNode',
    position: { x: 1040, y: 90 },
    data: { label: 'NMS / NOC Dashboard', sublabel: 'Grafana | LibreNMS | PagerDuty', layer: LAYERS.MANAGEMENT, nodeType: 'nms', ...cap(8), icon: '📊' },
  },
  {
    id: 'ptp_ntp',
    type: 'networkNode',
    position: { x: 880, y: 200 },
    data: { label: 'PTP / NTP Sync', sublabel: 'IEEE 1588 | Timing Infrastructure', layer: LAYERS.MANAGEMENT, nodeType: 'ptp_ntp', ...cap(5), icon: '⏱️' },
  },
  {
    id: 'oob',
    type: 'networkNode',
    position: { x: 880, y: 310 },
    data: { label: 'Out-of-Band Mgmt', sublabel: 'Console Servers | IPMI | KVM', layer: LAYERS.MANAGEMENT, nodeType: 'oob', ...cap(4), icon: '🔧' },
  },
];

export const initialEdges = [
  // Customer → ONT
  { id: 'e-rescust-ontres', source: 'res_customer', target: 'ont_res', animated: false, style: { stroke: '#6366f1', strokeWidth: 2 }, label: 'Fiber Drop' },
  { id: 'e-smbcust-ontbiz', source: 'smb_customer', target: 'ont_biz', animated: false, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e-midcust-ontbiz', source: 'mid_customer', target: 'ont_biz', animated: false, style: { stroke: '#6366f1', strokeWidth: 2 } },

  // ONT → Splitter
  { id: 'e-ontres-sp1', source: 'ont_res', target: 'splitter_1', style: { stroke: '#0ea5e9', strokeWidth: 2 }, label: 'XGS-PON' },
  { id: 'e-ontbiz-sp2', source: 'ont_biz', target: 'splitter_2', style: { stroke: '#0ea5e9', strokeWidth: 2 } },

  // Splitter → OLT
  { id: 'e-sp1-olt1', source: 'splitter_1', target: 'olt_1', style: { stroke: '#0ea5e9', strokeWidth: 2 } },
  { id: 'e-sp2-olt2', source: 'splitter_2', target: 'olt_2', style: { stroke: '#0ea5e9', strokeWidth: 2 } },

  // OLT → Aggregation Switch
  { id: 'e-olt1-agg', source: 'olt_1', target: 'agg_switch', style: { stroke: '#0ea5e9', strokeWidth: 3 }, label: '10G Uplink' },
  { id: 'e-olt2-agg', source: 'olt_2', target: 'agg_switch', style: { stroke: '#0ea5e9', strokeWidth: 3 } },

  // Agg Switch → BNG
  { id: 'e-agg-bng', source: 'agg_switch', target: 'bng', style: { stroke: '#f59e0b', strokeWidth: 4 }, label: '100G | IPoE/PPPoE' },

  // BNG → RADIUS (auth)
  { id: 'e-bng-radius', source: 'bng', target: 'radius', style: { stroke: '#10b981', strokeWidth: 2 }, label: 'Auth/Policy' },

  // BNG → CGNAT
  { id: 'e-bng-cgnat', source: 'bng', target: 'cgnat', style: { stroke: '#f59e0b', strokeWidth: 2 } },

  // RADIUS → DHCP/DNS
  { id: 'e-radius-dhcp', source: 'radius', target: 'dhcp_dns', style: { stroke: '#10b981', strokeWidth: 2 } },

  // BNG → DDoS
  { id: 'e-bng-ddos', source: 'bng', target: 'ddos', style: { stroke: '#ef4444', strokeWidth: 2 } },

  // DDoS → Firewall
  { id: 'e-ddos-fw', source: 'ddos', target: 'firewall', style: { stroke: '#ef4444', strokeWidth: 2 } },

  // MPLS PE ← BNG (business traffic)
  { id: 'e-bng-mpls', source: 'bng', target: 'mpls_pe', style: { stroke: '#8b5cf6', strokeWidth: 2 }, label: 'L3VPN' },

  // Agg Switch → CDN Cache
  { id: 'e-agg-cdn', source: 'agg_switch', target: 'cdn_cache', style: { stroke: '#06b6d4', strokeWidth: 2 }, label: 'Cache Hit' },

  // BNG → Metro Cisco
  { id: 'e-bng-metro', source: 'bng', target: 'metro_cisco', style: { stroke: '#3b82f6', strokeWidth: 4 }, label: '400G Metro' },

  // Metro → Core
  { id: 'e-metro-core1', source: 'metro_cisco', target: 'core_router_1', style: { stroke: '#3b82f6', strokeWidth: 4 }, label: 'OTN Primary' },
  { id: 'e-metrociena-core2', source: 'metro_ciena', target: 'core_router_2', style: { stroke: '#6366f1', strokeWidth: 4 } },
  { id: 'e-metro-metrociena', source: 'metro_cisco', target: 'metro_ciena', style: { stroke: '#3b82f6', strokeWidth: 2 }, label: 'Ring' },

  // Core → Border Router
  { id: 'e-core1-border', source: 'core_router_1', target: 'border_router', style: { stroke: '#3b82f6', strokeWidth: 4 }, label: '100G' },
  { id: 'e-core2-border', source: 'core_router_2', target: 'border_router', style: { stroke: '#6366f1', strokeWidth: 3 } },

  // Border → IXP
  { id: 'e-border-ixp', source: 'border_router', target: 'ixp', style: { stroke: '#22c55e', strokeWidth: 3 }, label: 'BGP Peering' },

  // Border → Transit
  { id: 'e-border-transit1', source: 'border_router', target: 'transit_1', style: { stroke: '#22c55e', strokeWidth: 3 }, label: 'Cogent 100G' },
  { id: 'e-border-transit2', source: 'border_router', target: 'transit_2', style: { stroke: '#22c55e', strokeWidth: 2 }, label: 'Lumen Backup' },

  // OSS/BSS connections
  { id: 'e-netbox-prov', source: 'netbox', target: 'provisioning', style: { stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5,5' } },
  { id: 'e-crm-prov', source: 'crm', target: 'provisioning', style: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5,5' } },
  { id: 'e-billing-crm', source: 'billing', target: 'crm', style: { stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5,5' } },
  { id: 'e-prov-radius', source: 'provisioning', target: 'radius', style: { stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5,5' }, label: 'Push Policy' },
  { id: 'e-prov-netbox', source: 'provisioning', target: 'netbox', style: { stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '5,5' } },

  // NMS connections
  { id: 'e-nms-bng', source: 'nms', target: 'bng', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },
  { id: 'e-nms-olt1', source: 'nms', target: 'olt_1', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },
  { id: 'e-nms-border', source: 'nms', target: 'border_router', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },

  // PTP/NTP
  { id: 'e-ptp-bng', source: 'ptp_ntp', target: 'bng', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },
  { id: 'e-ptp-metro', source: 'ptp_ntp', target: 'metro_cisco', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },

  // OOB
  { id: 'e-oob-agg', source: 'oob', target: 'agg_switch', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },
  { id: 'e-oob-olt1', source: 'oob', target: 'olt_1', style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3,3' } },

  // MPLS PE → Metro
  { id: 'e-mpls-metro', source: 'mpls_pe', target: 'metro_cisco', style: { stroke: '#8b5cf6', strokeWidth: 2 } },
];

// Nodes touched per simulation scenario (in order)
export const SIMULATION_FLOWS = {
  add_residential: {
    label: 'Add Residential Customer (1G)',
    color: '#6366f1',
    description: 'New residential customer order → full provisioning E2E',
    steps: [
      { nodeId: 'crm', action: 'Create customer account', system: 'CRM', detail: 'New account: John Smith | 1G Residential | Seattle CO-3' },
      { nodeId: 'billing', action: 'Generate service order', system: 'Billing', detail: 'Plan: North Star 1Gbps Home | $55/mo | Order #ORD-20240317-4821' },
      { nodeId: 'netbox', action: 'Allocate ONT port + IP prefix', system: 'NetBox', detail: 'OLT-1 Port 15 allocated | IP: 172.16.44.128/30 assigned from pool' },
      { nodeId: 'provisioning', action: 'Trigger provisioning workflow', system: 'Provisioning', detail: 'Auto-fulfillment triggered → OLT + RADIUS + DHCP config push queued' },
      { nodeId: 'olt_1', action: 'Program ONT on OLT', system: 'OLT Calix E7-2', detail: 'ONT SN: CXNK00A1B2C3 registered | GPON port 15 | XGS-PON activated' },
      { nodeId: 'splitter_1', action: 'Fiber path confirmed', system: 'Access Plant', detail: 'Passive splitter 1:32 | fiber drop assigned | signal verified -18dBm' },
      { nodeId: 'ont_res', action: 'ONT provisioned', system: 'Customer Premises', detail: 'ONT online | RJ45 port active | WAN IP handshake ready' },
      { nodeId: 'dhcp_dns', action: 'DHCP lease assigned', system: 'DHCP/DNS', detail: 'IP: 172.16.44.129 | GW: 172.16.44.130 | DNS: 45.90.28.1 | Lease 24h' },
      { nodeId: 'radius', action: 'Create RADIUS profile', system: 'RADIUS', detail: 'User: 00:1A:2B:3C:4D:5E@northstarfiber | Bandwidth: UP=1G DN=1G | VLAN: 1044' },
      { nodeId: 'bng', action: 'Subscriber session established', system: 'BNG ASR 9000', detail: 'IPoE session UP | QoS policy: Residential-1G applied | Session ID: 0x3F4A' },
      { nodeId: 'agg_switch', action: 'VLAN provisioned', system: 'Aggregation Switch', detail: 'S-VLAN 1044 | C-VLAN 100 | QinQ enabled | 1G rate-limit applied' },
      { nodeId: 'cgnat', action: 'NAT binding created', system: 'CGNAT', detail: 'Private: 172.16.44.129 → Public: 67.134.22.18:10240-20480 | NAT pool assigned' },
      { nodeId: 'nms', action: 'Customer monitoring enabled', system: 'NMS/NOC', detail: 'Grafana dashboard provisioned | LibreNMS SNMP polling started | PagerDuty alert profile set' },
      { nodeId: 'res_customer', action: '✅ Customer LIVE — 1G Service Active', system: 'End State', detail: 'Service live in 4m 12s | Downstream: 1Gbps | Upstream: 1Gbps | IPv4+IPv6 active' },
    ],
  },

  upgrade_tier: {
    label: 'Upgrade Customer: 1G → 2G',
    color: '#f59e0b',
    description: 'Existing customer requests speed upgrade via portal',
    steps: [
      { nodeId: 'crm', action: 'Customer upgrade request received', system: 'CRM', detail: 'Account: John Smith | Request: 1G → 2G Upgrade | Channel: Self-service portal' },
      { nodeId: 'billing', action: 'Plan change committed', system: 'Billing', detail: 'Old plan: 1Gbps $55/mo | New plan: 2Gbps $75/mo | Prorated credit applied' },
      { nodeId: 'provisioning', action: 'CoA (Change of Authorization) queued', system: 'Provisioning', detail: 'RADIUS CoA triggered for session 0x3F4A | New bandwidth policy: Residential-2G' },
      { nodeId: 'radius', action: 'Send RADIUS CoA to BNG', system: 'RADIUS', detail: 'CoA: Disconnect + Re-auth with new policy | Bandwidth-UP=2G DN=2G | Sent to BNG 10.0.1.1' },
      { nodeId: 'bng', action: 'Re-apply QoS policy', system: 'BNG ASR 9000', detail: 'Old QoS removed: Residential-1G | New QoS applied: Residential-2G | Session reconnected in 200ms' },
      { nodeId: 'olt_1', action: 'OLT bandwidth profile updated', system: 'OLT Calix E7-2', detail: 'DBA profile updated: AS-DBA-2G | T-CONT reconfigured | Upstream guaranteed 2Gbps' },
      { nodeId: 'agg_switch', action: 'Rate-limit updated', system: 'Aggregation Switch', detail: 'VLAN 1044 rate-limit: 1G → 2G | QoS shaper updated | Policer reconfigured' },
      { nodeId: 'netbox', action: 'IPAM record updated', system: 'NetBox', detail: 'Customer record: plan=2G updated | Audit log entry created | No IP change required' },
      { nodeId: 'nms', action: 'Monitoring thresholds updated', system: 'NMS/NOC', detail: 'Grafana alert updated: threshold 2Gbps | LibreNMS bandwidth graph recalibrated' },
      { nodeId: 'res_customer', action: '✅ Upgrade Complete — 2G Service Active', system: 'End State', detail: 'Upgrade completed in 43 seconds | New speed: 2Gbps down / 2Gbps up | No outage' },
    ],
  },

  add_smb: {
    label: 'Add Small Business (1G Ethernet)',
    color: '#10b981',
    description: 'New SMB customer with SLA-grade 1G dedicated Ethernet',
    steps: [
      { nodeId: 'crm', action: 'Business account created', system: 'CRM', detail: 'Customer: Acme Corp LLC | Type: Small Business | Contact: ops@acme.com | SLA: 99.9%' },
      { nodeId: 'billing', action: 'Business plan activated', system: 'Billing', detail: 'Plan: North Star Business 1Gbps | $299/mo | SLA credits enabled | Order #ORD-20240317-4822' },
      { nodeId: 'netbox', action: 'Allocate dedicated port + /30 subnet', system: 'NetBox', detail: 'OLT-2 Port 8 allocated | Dedicated 1:4 splitter path | Public IP /30: 67.134.55.20/30' },
      { nodeId: 'provisioning', action: 'Business provisioning workflow started', system: 'Provisioning', detail: 'SLA path selected | Dedicated VLAN | Priority QoS class: Business-EF queued' },
      { nodeId: 'olt_2', action: 'OLT: Dedicated port provisioned', system: 'OLT Nokia 7360', detail: 'Port 8 dedicated | XGS-PON 10G | SLA T-CONT | No sharing — business-grade path' },
      { nodeId: 'splitter_2', action: '1:4 splitter path confirmed', system: 'Access Plant', detail: 'Business splitter 1:4 | Less contention | Signal: -12dBm | Higher SNR margin' },
      { nodeId: 'ont_biz', action: 'Business ONT activated', system: 'Customer Premises', detail: 'ONT: Nokia GPON business unit | SFP+ uplink | Static IP pre-configured' },
      { nodeId: 'mpls_pe', action: 'MPLS path provisioned (optional VPN)', system: 'MPLS PE Router', detail: 'L3VPN available if multi-site | Current: internet-only | VPN pre-staged for future' },
      { nodeId: 'dhcp_dns', action: 'Static IP assignment', system: 'DHCP/DNS', detail: 'Static IP: 67.134.55.21 | GW: 67.134.55.22 | PTR record created: acme-corp.cust.northstarfiber.net' },
      { nodeId: 'radius', action: 'Business RADIUS profile', system: 'RADIUS', detail: 'Policy: Business-1G-SLA | Priority traffic class | Guaranteed bandwidth enforced' },
      { nodeId: 'bng', action: 'BNG priority session', system: 'BNG ASR 9000', detail: 'IPoE session | QoS: Business-1G-EF | Priority queue | SLA monitoring hooks active' },
      { nodeId: 'ddos', action: 'Business DDoS protection enabled', system: 'DDoS Scrubbing', detail: 'BGP flowspec rule added for 67.134.55.20/30 | Auto-mitigation threshold: 500Mbps' },
      { nodeId: 'nms', action: 'SLA monitoring configured', system: 'NMS/NOC', detail: 'SLA dashboard added | RTD alerting | Monthly SLA report scheduled | PagerDuty P1 escalation' },
      { nodeId: 'smb_customer', action: '✅ SMB Customer LIVE — 1G Business Service', system: 'End State', detail: 'Service live | 1Gbps symmetric | SLA 99.9% | Static IP | DDoS protection active' },
    ],
  },

  add_midmarket: {
    label: 'Add Mid-Market (5G MPLS L3VPN)',
    color: '#8b5cf6',
    description: 'Enterprise customer with multi-site MPLS L3VPN + 5G Ethernet',
    steps: [
      { nodeId: 'crm', action: 'Enterprise account created', system: 'CRM', detail: 'Customer: TechVantage Inc | Sites: 4 | Type: Mid-Market | SLA: 99.99% | TAM assigned' },
      { nodeId: 'billing', action: 'Enterprise contract activated', system: 'Billing', detail: 'Plan: North Star Enterprise 5G MPLS | $4,200/mo | 3-year contract | DIA + MPLS bundle' },
      { nodeId: 'netbox', action: 'Multi-site IP plan allocated', system: 'NetBox', detail: '4x /30 subnets allocated | VRF: TECHVANTAGE-001 created | MPLS labels reserved: 1001-1004' },
      { nodeId: 'mpls_pe', action: 'VRF + L3VPN provisioned on PE', system: 'MPLS PE Router', detail: 'VRF TECHVANTAGE-001 created | RT import/export: 65001:1001 | BGP VPNv4 neighbor configured' },
      { nodeId: 'border_router', action: 'BGP route policy configured', system: 'Border Router', detail: 'AS-path filter for enterprise prefix | Route reflector updated | RPKI ROA validated' },
      { nodeId: 'olt_2', action: 'Dedicated fiber path provisioned', system: 'OLT Nokia 7360', detail: '5G XGS-PON dedicated port | No contention | 10G physical + 5G guaranteed throughput' },
      { nodeId: 'ont_biz', action: 'Enterprise ONT + CPE configured', system: 'Customer Premises', detail: 'Nokia ONT | Cisco ISR router | BGP session to PE | MPLS label exchange active' },
      { nodeId: 'bng', action: 'Enterprise QoS tier applied', system: 'BNG ASR 9000', detail: 'QoS policy: Enterprise-5G-PREMIUM | Strict priority | Traffic classification: DSCP EF/AF' },
      { nodeId: 'metro_cisco', action: 'Metro path reserved', system: 'Metro Router Cisco 8000', detail: 'MPLS TE tunnel reserved: 5Gbps | RSVP-TE | Diverse path from residential traffic' },
      { nodeId: 'core_router_1', action: 'Core backbone path confirmed', system: 'Core Router', detail: 'OTN path reserved | Protected BLSR ring | 5G committed | 10G burst available' },
      { nodeId: 'ddos', action: 'Enterprise DDoS protection', system: 'DDoS Scrubbing', detail: 'Arbor TMS: Per-VRF scrubbing enabled | Custom baseline | 24/7 SOC monitoring' },
      { nodeId: 'ptp_ntp', action: 'Timing sync for business Ethernet', system: 'PTP/NTP', detail: 'IEEE 1588v2 PTP enabled | Stratum-1 sync | MEF CE 2.0 timing compliance' },
      { nodeId: 'nms', action: 'Enterprise NOC dashboard', system: 'NMS/NOC', detail: 'Dedicated NOC view | Real-time throughput | SLA 99.99% tracker | Executive reports weekly' },
      { nodeId: 'mid_customer', action: '✅ Enterprise LIVE — 5G MPLS L3VPN Active', system: 'End State', detail: '5Gbps symmetric | MPLS VPN to 4 sites | 99.99% SLA | DDoS protected | PTP synced' },
    ],
  },

  capacity_augment: {
    label: 'Capacity Threshold → Auto-Augment (40%)',
    color: '#ef4444',
    description: 'Network hits 40% capacity → automated augmentation workflow',
    steps: [
      { nodeId: 'nms', action: '⚠️ ALERT: Capacity threshold 40% reached', system: 'NMS/NOC', detail: 'OLT-1 at 41% | BNG at 38% | Agg-Switch at 36% | Trend: +3%/week | Projected 80% in 13 weeks' },
      { nodeId: 'nms', action: 'Capacity augmentation workflow triggered', system: 'NMS/NOC', detail: 'Automated runbook: CAPACITY-AUG-001 | Triggered by threshold policy | NOC notified via PagerDuty' },
      { nodeId: 'netbox', action: 'NetBox: Inventory audit + expansion plan', system: 'NetBox', detail: 'Available rack space: 4U in CO-3 | OLT ports free: 14 on OLT-1 | IP pool: 6,723 IPs free' },
      { nodeId: 'netbox', action: 'NetBox: New OLT pre-staged', system: 'NetBox', detail: 'OLT-3 (Calix E7-2) added to inventory | Rack: CO3-R4U12 | IP: 10.0.3.30 | Config template generated' },
      { nodeId: 'provisioning', action: 'Provisioning: OLT-3 config pushed', system: 'Provisioning', detail: 'Calix Cloud API: New OLT registered | XGS-PON profiles loaded | Uplink to Agg-Switch configured' },
      { nodeId: 'agg_switch', action: 'Agg Switch: New OLT uplink added', system: 'Aggregation Switch', detail: 'Port 17 activated | VLAN trunk configured | S-VLAN range 1060-1080 reserved for new OLT' },
      { nodeId: 'bng', action: 'BNG: Subscriber pool expanded', system: 'BNG ASR 9000', detail: 'Subscriber capacity increased: 4000 → 6000 | New IP pool added: 172.16.60.0/21 | License updated' },
      { nodeId: 'dhcp_dns', action: 'DHCP: New IP pool activated', system: 'DHCP/DNS', detail: 'Pool: 172.16.60.0/21 (2046 new IPs) added | Scope active | DNS reverse zones created' },
      { nodeId: 'radius', action: 'RADIUS: New policy templates added', system: 'RADIUS', detail: '50 new VLAN profiles pre-configured | Bandwidth policies: 1G/2G/5G templates | CoA server updated' },
      { nodeId: 'cgnat', action: 'CGNAT: NAT pool expanded', system: 'CGNAT', detail: 'New public IP block: 67.134.60.0/24 added | 256 new addresses | Port ranges extended to 30,000/IP' },
      { nodeId: 'metro_cisco', action: 'Metro: Uplink capacity reviewed', system: 'Metro Router Cisco 8000', detail: 'Current: 38% of 400G | No upgrade needed yet | Flag: upgrade at 70% | Projected: 16 weeks' },
      { nodeId: 'olt_1', action: '✅ OLT-1 capacity extended + OLT-3 online', system: 'OLT Layer', detail: 'OLT-3 activated | 48 new ports available | Load redistributed | OLT-1 back to 28%' },
      { nodeId: 'nms', action: '✅ Augmentation complete — capacity at 28%', system: 'NMS/NOC', detail: 'All systems green | New headroom: ~800 additional subscribers | Next review: 8 weeks' },
    ],
  },

  provision_evc: {
    label: 'Provision EVC / E-Line (MEF CE 2.0)',
    color: '#06b6d4',
    description: 'Carrier Ethernet E-Line circuit for enterprise leased-line replacement over EVPN/MPLS',
    steps: [
      { nodeId: 'crm', action: 'Enterprise E-Line order received', system: 'CRM', detail: 'Customer: Harbor Logistics Inc | Service: E-Line MEF CE 2.0 | BW: 1Gbps symmetrical | COS: EF (Expedited Forwarding)' },
      { nodeId: 'billing', action: 'EVC contract activated', system: 'Billing', detail: 'Plan: North Star CarrierEthernet 1G E-Line | $1,800/mo | MEF cert service | SLA: 99.99% | Order #EVC-20240317-0042' },
      { nodeId: 'netbox', action: 'EVC circuit design — ECID + endpoints', system: 'NetBox', detail: 'EVC-ID: 0x00A1 | ECI-A: Seattle CO-1 Port 22 | ECI-Z: Bellevue CO Port 14 | S-Tag 4001 reserved' },
      { nodeId: 'mpls_pe', action: 'EVPN instance provisioned on PE', system: 'MPLS PE Router', detail: 'EVPN EVI 4001 created | RT: 65001:4001 | ESI-LAG configured | BUM traffic: ingress replication' },
      { nodeId: 'metro_cisco', action: 'Metro: MPLS-TE path reserved for EVC', system: 'Metro Router Cisco 8000', detail: 'RSVP-TE tunnel: Tunnel-EVC-4001 | Bandwidth: 1Gbps reserved | Strict path: diversity from residential' },
      { nodeId: 'agg_switch', action: 'Service VLAN + EVC policer pushed', system: 'Aggregation Switch', detail: 'S-VLAN 4001 configured on trunk | Rate policer: 1Gbps CIR/EIR | CoS remarking: DSCP EF → MPLS EXP 5' },
      { nodeId: 'olt_2', action: 'UNI port on OLT-2 configured', system: 'OLT Nokia 7360', detail: 'UNI port 14 set to CE-VLAN passthrough | CoS map applied | LACP ready for bonding if needed' },
      { nodeId: 'ont_biz', action: 'CPE (UNI-N) activated at customer site', system: 'Customer Premises', detail: 'Cisco ISR-4331 UNI-N | CE-VLAN 10 mapped to S-VLAN 4001 | MEF PM OAM (Y.1731) enabled' },
      { nodeId: 'ptp_ntp', action: 'SyncE / PTP timing enabled for EVC', system: 'PTP/NTP', detail: 'Synchronous Ethernet (SyncE) enabled on UNI port | PTP boundary clock | MEF CE 2.0 timing compliance' },
      { nodeId: 'ddos', action: 'EVC DDoS baseline and protection', system: 'DDoS Scrubbing', detail: 'BGP Flowspec: rate-limit 1.2G per EVC | Auto-trigger at 110% CIR | SOC notification enabled' },
      { nodeId: 'nms', action: 'EVC performance monitoring activated', system: 'NMS/NOC', detail: 'Y.1731 ETH-DM (delay measurement) active | ETH-LM (loss measurement) | KPI: RTD <5ms, FLR <0.001%' },
      { nodeId: 'mid_customer', action: '✅ E-Line LIVE — MEF CE 2.0 EVC Active', system: 'End State', detail: 'EVC active A↔Z | 1Gbps symmetric | RTD: 3.2ms | FLR: 0.0003% | OAM monitoring | SLA 99.99% armed' },
    ],
  },

  provision_dwdm: {
    label: 'Commission DWDM Wavelength (100G λ)',
    color: '#a78bfa',
    description: 'Add a new 100G DWDM wavelength on the I-90 backbone to expand core capacity',
    steps: [
      { nodeId: 'nms', action: '📈 Core utilization trending — new wavelength triggered', system: 'NMS/NOC', detail: 'I-90 backbone: 31% → 38% trend over 6 weeks | Proactive expansion: new 100G λ on C-band ch47' },
      { nodeId: 'netbox', action: 'DWDM capacity plan — wavelength slot reserved', system: 'NetBox', detail: 'Ciena 6500 ROADM: Channel 47 (193.1 THz) reserved | OSNR margin: +8dB | Fiber: SMF-28 ultra-low loss' },
      { nodeId: 'metro_ciena', action: 'ROADM: New wavelength added to west-side mux', system: 'Metro Ciena WaveLogic', detail: 'Ciena 6500-32: Add-Drop on ch47 programmed | WaveLogic 5e coherent 100G | PM-QPSK modulation' },
      { nodeId: 'metro_ciena', action: 'OTN cross-connect provisioned in OXC', system: 'Metro Ciena WaveLogic', detail: 'ODU2e cross-connect: West-Line-Port-47 → East-Line-Port-47 | OTU4 framing | FEC: SD-FEC 25% OH' },
      { nodeId: 'core_router_1', action: 'Core-1: 100G line card lit on new λ', system: 'Core Router (NCS 5500)', detail: 'CFP2-DCO module activated on ch47 | BER: 1e-14 | Pre-FEC: 2.1e-4 | Optical power: -6dBm received' },
      { nodeId: 'core_router_2', action: 'Core-2: Far-end wavelength received', system: 'Core Router (NCS 5500)', detail: 'Core-2 east-side port lit | OSNR: 18.4dB | CD: 1,420 ps/nm | PMD: 0.4 ps — all within spec' },
      { nodeId: 'metro_cisco', action: 'Metro Cisco: New 100G path added to ECMP', system: 'Metro Router Cisco 8000', detail: 'BGP-LU prefix redistributed over new λ | ECMP load-share updated: 3 paths | Traffic rebalanced' },
      { nodeId: 'core_router_1', action: 'IS-IS TE metric updated for new path', system: 'Core Router (NCS 5500)', detail: 'IS-IS TE extension: new link advertised | MPLS-TE CSPF re-computed | Tunnels rerouted to use new λ' },
      { nodeId: 'border_router', action: 'BGP next-hop reachability confirmed', system: 'Border Router', detail: 'BGP session to Core-1 stable | Prefix advertisement: 47,821 prefixes | ECMP paths updated' },
      { nodeId: 'ptp_ntp', action: 'Timing synchronization over new wavelength', system: 'PTP/NTP', detail: 'PTP grandmaster: timing verified over new OTN path | Stratum-1 lock maintained | All clocks synced' },
      { nodeId: 'nms', action: '✅ 100G Wavelength LIVE — I-90 corridor expanded', system: 'NMS/NOC', detail: 'New λ ch47 fully operational | I-90 total capacity: 400G → 500G | Utilization headroom restored to 24%' },
    ],
  },

  otn_protection: {
    label: 'OTN Protection Ring Test (BLSR Failover)',
    color: '#f97316',
    description: 'Simulate OTN BLSR ring protection switchover — validates < 50ms failover on I-90 ring',
    steps: [
      { nodeId: 'nms', action: '🔴 OTN LOS detected — I-90 West segment', system: 'NMS/NOC', detail: 'OTN LOS (Loss of Signal) alarm on Core-1 → Core-2 west span | Cause: fiber cut simulation at MP 142' },
      { nodeId: 'metro_ciena', action: 'ROADM: APS (Automatic Protection Switching) initiated', system: 'Metro Ciena WaveLogic', detail: 'BLSR APS K1/K2 bytes exchanged | Switching from working (west) to protect (east) ring | Timer: 0ms' },
      { nodeId: 'core_router_1', action: 'Core-1: OTN path switched to east ring', system: 'Core Router (NCS 5500)', detail: 'OTN protection switch complete | Working → Protect in 38ms | BER stable on new path | No packet loss' },
      { nodeId: 'core_router_2', action: 'Core-2: Ring protection confirmed from east', system: 'Core Router (NCS 5500)', detail: 'Traffic received via east ring | BLSR bridge-and-switch active | East span: OSNR 17.8dB — healthy' },
      { nodeId: 'metro_cisco', action: 'Metro Cisco: MPLS-TE re-routes via east path', system: 'Metro Router Cisco 8000', detail: 'RSVP-TE path re-signal via east ring | Affected tunnels: 12 | Fast-reroute: 38ms | BFD: sessions maintained' },
      { nodeId: 'border_router', action: 'BGP sessions held — no route flap', system: 'Border Router', detail: 'BFD timers: 300ms hold | BGP sessions stable | No prefix withdrawal | Cogent + Lumen paths intact' },
      { nodeId: 'nms', action: 'NOC: Alarm correlated — field dispatch triggered', system: 'NMS/NOC', detail: 'Root-cause: physical fiber cut MP-142 I-90 | Field crew dispatched: ETA 4h | Ticket: NOC-INC-20240317-0877' },
      { nodeId: 'ptp_ntp', action: 'PTP timing maintained on protect path', system: 'PTP/NTP', detail: 'PTP grandmaster switchover: 45ms | All downstream clocks re-locked within 2s | SyncE: continuous' },
      { nodeId: 'metro_ciena', action: 'Fiber restored — revert to working ring', system: 'Metro Ciena WaveLogic', detail: 'Physical fiber spliced at MP-142 | OSNR restored: 18.6dB | Wait-to-Restore timer: 10 min' },
      { nodeId: 'core_router_1', action: 'OTN revert to working path after WTR', system: 'Core Router (NCS 5500)', detail: 'WTR timer expired | APS revert: Protect → Working | Bridge cleared | Both rings healthy' },
      { nodeId: 'nms', action: '✅ OTN BLSR Test PASSED — failover 38ms', system: 'NMS/NOC', detail: 'Protection switch: 38ms (< 50ms ITU-T G.841 requirement ✅) | Zero BGP flap | Zero customer impact' },
    ],
  },
};
