// ─────────────────────────────────────────────────────────────────────────────
//  circuitPlans.js  —  All static data for the Circuit Planner tab
//  Circuit types · Equipment stacks · 8-phase simulation flows · Optical params
// ─────────────────────────────────────────────────────────────────────────────

// ── A/Z Site options (reuses NorthStar PNW locations) ────────────────────────
export const SITES = [
  { id: 'sea', label: 'Seattle CO-1 (SEA)', lat: 47.6062, lng: -122.3321 },
  { id: 'bel', label: 'Bellevue CO-2 (BEL)', lat: 47.6101, lng: -122.2015 },
  { id: 'evr', label: 'Everett CO-3 (EVR)', lat: 47.9790, lng: -122.2021 },
  { id: 'oly', label: 'Olympia CO-4 (OLY)', lat: 47.0379, lng: -122.9007 },
  { id: 'pdx', label: 'Portland CO-5 (PDX)', lat: 45.5051, lng: -122.6750 },
  { id: 'spo', label: 'Spokane CO-6 (SPO)', lat: 47.6588, lng: -117.4260 },
];

// ── Circuit types ─────────────────────────────────────────────────────────────
export const CIRCUIT_TYPES = [
  { id: 'l3vpn',    label: 'L3VPN / MPLS VPN',         icon: '🔷', needsOptical: false },
  { id: 'evc',      label: 'EVC / MEF E-LINE',          icon: '🔶', needsOptical: false },
  { id: 'dia',      label: 'Internet DIA',               icon: '🌐', needsOptical: false },
  { id: 'wave',     label: 'Wave / DWDM / OTN',         icon: '🌊', needsOptical: true  },
  { id: 'backhaul', label: 'Mobile Backhaul',            icon: '📡', needsOptical: false },
  { id: 'dci',      label: 'Data Center Interconnect',  icon: '🏙️', needsOptical: true  },
];

// ── Bandwidth options (CIR) ───────────────────────────────────────────────────
export const BANDWIDTH_OPTIONS = ['1G', '10G', '100G', '400G', '800G'];

// ── Protection levels ─────────────────────────────────────────────────────────
export const PROTECTION_LEVELS = [
  { id: 'none',    label: 'Unprotected',        switchoverMs: null },
  { id: 'oneplus', label: '1+1 Protection',     switchoverMs: 50   },
  { id: 'onecol',  label: '1:1 Protection',     switchoverMs: 50   },
  { id: 'diverse', label: 'Diverse Routing',    switchoverMs: 200  },
];

// ── SLA tiers ─────────────────────────────────────────────────────────────────
export const SLA_TIERS = [
  { id: 'gold',   label: 'Gold   99.999%', latencyMs: 5,  jitterMs: 0.5, downtime: '< 5 min/yr'  },
  { id: 'silver', label: 'Silver 99.99%',  latencyMs: 10, jitterMs: 1.0, downtime: '< 53 min/yr' },
  { id: 'bronze', label: 'Bronze 99.9%',   latencyMs: 20, jitterMs: 5.0, downtime: '< 8.7 hr/yr' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Equipment stacks per circuit type
//  Each device: role · vendor · model · color (vendor brand) · specs
// ─────────────────────────────────────────────────────────────────────────────
export const EQUIPMENT_STACKS = {
  l3vpn: [
    { role: 'CE (A-Site)',      vendor: 'Cisco',   model: 'ISR 4331',      color: '#1d6fa4', specs: '3× GE, 2× SFP, 2 GB RAM' },
    { role: 'Metro Agg (A)',    vendor: 'Nokia',   model: '7210 SAS-M',    color: '#005AFF', specs: '24× 1GE, 4× 10GE uplink' },
    { role: 'PE (A-Side)',      vendor: 'Cisco',   model: 'ASR 9001',      color: '#1d6fa4', specs: '4× 100GE, MPLS, BFD, SR-TE' },
    { role: 'DWDM Transport',   vendor: 'Ciena',   model: '6500 ROADM',    color: '#5c2d8e', specs: '96× C-band, 400G coherent' },
    { role: 'PE (Z-Side)',      vendor: 'Juniper', model: 'MX960',         color: '#84BD00', specs: '4× MPC, 960 Gbps fabric' },
    { role: 'Metro Agg (Z)',    vendor: 'Nokia',   model: '7210 SAS-M',    color: '#005AFF', specs: '24× 1GE, 4× 10GE uplink' },
    { role: 'CE (Z-Site)',      vendor: 'Juniper', model: 'SRX 345',       color: '#84BD00', specs: '16× GE, 4× SFP, firewall/VPN' },
  ],
  evc: [
    { role: 'CE (A-Site)',      vendor: 'Cisco',   model: 'Catalyst 8300', color: '#1d6fa4', specs: '6× GE, 2× 10GE, SD-WAN ready' },
    { role: 'Metro Agg (A)',    vendor: 'Cisco',   model: 'ASR 920',       color: '#1d6fa4', specs: '24× GE, 2× 10GE, MEF certified' },
    { role: 'PE (A-Side)',      vendor: 'Nokia',   model: '7750 SR-1',     color: '#005AFF', specs: '400G FP5, VPLS/EVPN, PW' },
    { role: 'DWDM Transport',   vendor: 'Ciena',   model: 'Waveserver 5',  color: '#5c2d8e', specs: '400ZR+, Open ROADM' },
    { role: 'PE (Z-Side)',      vendor: 'Nokia',   model: '7750 SR-1',     color: '#005AFF', specs: '400G FP5, VPLS/EVPN, PW' },
    { role: 'Metro Agg (Z)',    vendor: 'Cisco',   model: 'ASR 920',       color: '#1d6fa4', specs: '24× GE, 2× 10GE, MEF certified' },
    { role: 'CE (Z-Site)',      vendor: 'Cisco',   model: 'Catalyst 8300', color: '#1d6fa4', specs: '6× GE, 2× 10GE, SD-WAN ready' },
  ],
  dia: [
    { role: 'ONT (Prem)',       vendor: 'Calix',   model: '716GE-I',       color: '#e8702a', specs: '1× 1GE PON, 4× GE LAN' },
    { role: 'OLT (CO)',         vendor: 'Nokia',   model: '7360 ISAM',     color: '#005AFF', specs: '16× GPON, 2× 10GE uplink' },
    { role: 'BNG',              vendor: 'Cisco',   model: 'ASR 9001',      color: '#1d6fa4', specs: 'PPPoE/IPoE, RADIUS, CGNAT' },
    { role: 'Peering Router',   vendor: 'Juniper', model: 'MX480',         color: '#84BD00', specs: '6× MPC, full BGP table' },
    { role: 'IXP / Transit',    vendor: 'Arista',  model: '7280R3',        color: '#e4005c', specs: '48× 100GE, deep buffers' },
  ],
  wave: [
    { role: 'ROADM (A-Site)',   vendor: 'Ciena',   model: '6500-T12',      color: '#5c2d8e', specs: '12-degree ROADM, C+L band' },
    { role: 'ILA Amp #1',       vendor: 'Ciena',   model: '6500 Raman',    color: '#5c2d8e', specs: 'Raman + EDFA, 22 dB gain' },
    { role: 'ILA Amp #2',       vendor: 'Ciena',   model: '6500 Raman',    color: '#5c2d8e', specs: 'Raman + EDFA, 22 dB gain' },
    { role: 'OTN Switch',       vendor: 'Infinera', model: 'DTN-X',        color: '#ff6b00', specs: 'OTU4/OTU2, 88× C-band' },
    { role: 'ROADM (Z-Site)',   vendor: 'Ciena',   model: '6500-T12',      color: '#5c2d8e', specs: '12-degree ROADM, C+L band' },
  ],
  backhaul: [
    { role: 'RRH (Tower)',      vendor: 'Ericsson', model: 'AIR 6449',     color: '#006272', specs: '64T64R, 100 MHz 5G NR' },
    { role: 'BBU (DU/CU)',      vendor: 'Ericsson', model: 'baseband 6630',color: '#006272', specs: 'eCPRI split 7.2, 25GE' },
    { role: 'Cell Agg',         vendor: 'Cisco',   model: 'NCS 540',       color: '#1d6fa4', specs: 'IEEE 1588v2 PTP, SyncE' },
    { role: 'PE (Backhaul)',    vendor: 'Nokia',   model: '7750 SR-2s',    color: '#005AFF', specs: 'Mobile aware, QoS, CUPS' },
    { role: 'Core (5GC)',       vendor: 'Nokia',   model: '7750 SR-7s',    color: '#005AFF', specs: 'UPF anchor, N6 interface' },
  ],
  dci: [
    { role: 'Spine (DC-A)',     vendor: 'Arista',  model: '7800R3',        color: '#e4005c', specs: '128× 400GE, EVPN/VXLAN' },
    { role: 'DCI GW (A)',       vendor: 'Cisco',   model: 'Nexus 9336C',   color: '#1d6fa4', specs: '36× 400G QSFP-DD, MACsec' },
    { role: 'DWDM (A)',         vendor: 'Infinera', model: 'ICE6 800G',    color: '#ff6b00', specs: '800G per wave, OpenLine' },
    { role: 'DWDM (Z)',         vendor: 'Infinera', model: 'ICE6 800G',    color: '#ff6b00', specs: '800G per wave, OpenLine' },
    { role: 'DCI GW (Z)',       vendor: 'Cisco',   model: 'Nexus 9336C',   color: '#1d6fa4', specs: '36× 400G QSFP-DD, MACsec' },
    { role: 'Spine (DC-Z)',     vendor: 'Arista',  model: '7800R3',        color: '#e4005c', specs: '128× 400GE, EVPN/VXLAN' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  8-Phase simulation flows
//  Steps: { phase, system, action, detail, deviceIndex (equipment to highlight) }
// ─────────────────────────────────────────────────────────────────────────────
export function buildPhaseFlow(circuitType, aLabel, zLabel, bandwidth, protection, sla) {
  const slaObj  = SLA_TIERS.find(s => s.id === sla)   || SLA_TIERS[0];
  const protObj = PROTECTION_LEVELS.find(p => p.id === protection) || PROTECTION_LEVELS[0];
  const orderId = `NNS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const needsOptical = CIRCUIT_TYPES.find(c => c.id === circuitType)?.needsOptical ?? false;

  return {
    orderId,
    phases: [
      // ── Phase 1: Service Intake & Requirements ──────────────────────────
      {
        id: 1, label: 'Service Intake', icon: '📋',
        steps: [
          { system: 'CRM',        action: 'Parse service order',          detail: `Order ${orderId} — ${circuitType.toUpperCase()} | ${bandwidth} CIR | ${aLabel} → ${zLabel}` },
          { system: 'OSS',        action: 'Identify service type',        detail: `Service class: ${circuitType.toUpperCase()} | Protection: ${protObj.label} | SLA: ${slaObj.label}` },
          { system: 'NetBox',     action: 'Validate endpoint addresses',  detail: `A-site: ${aLabel} — geocode confirmed. Z-site: ${zLabel} — geocode confirmed` },
          { system: 'SLA Engine', action: 'Confirm SLA parameters',       detail: `Latency target: ≤${slaObj.latencyMs} ms | Jitter: ≤${slaObj.jitterMs} ms | Availability: ${slaObj.label.split(' ')[1]}` },
          { system: 'OSS',        action: 'Set delivery commitment',      detail: `Estimated delivery: ${deliveryDate(slaObj.id)} | Regulatory: CALEA lawful-intercept tagged` },
        ],
      },
      // ── Phase 2: Network Feasibility ────────────────────────────────────
      {
        id: 2, label: 'Feasibility', icon: '🔍',
        steps: [
          { system: 'NMS',        action: 'Check topology reachability',  detail: `Path ${aLabel} → ${zLabel}: reachable via ${randomHops()} intermediate nodes` },
          { system: 'MPLS Ctrl',  action: 'Verify MPLS/SR domain',       detail: `Segment Routing domain continuity: PASS | SID range 16000-23999 available` },
          { system: 'Optical Ctl',action: 'Validate optical path',        detail: needsOptical ? `ROADM degree check: PASS | Colorless port available at ${aLabel}` : 'Optical path not required for this service type — SKIP' },
          { system: 'NMS',        action: 'Confirm tech compatibility',   detail: `A-endpoint: ${equipLabel(circuitType, 0)} | Z-endpoint: ${equipLabel(circuitType, -1)} — interop validated` },
          { system: 'Capacity Mgr',action:'Check link capacity headroom', detail: `${aLabel}→${zLabel} working path: ${randomCapacity()}% utilized — sufficient for ${bandwidth}` },
        ],
      },
      // ── Phase 3: Inventory & Capacity Validation ────────────────────────
      {
        id: 3, label: 'Inventory', icon: '🗄️',
        steps: [
          { system: 'NetBox',     action: 'Check fiber span availability',detail: `Fiber spans ${aLabel}→${zLabel}: ${randomFiberSpans()} spans available / 15 total` },
          { system: 'NetBox',     action: 'Verify free router ports',     detail: `${equipLabel(circuitType, 2)}: ${randomPorts()} free 100GE ports confirmed` },
          { system: 'NetBox',     action: 'Allocate VLAN ID',             detail: `VLAN ${randomVlan()} allocated on aggregation segment — pool: 3 of 4094 remaining` },
          { system: 'NetBox',     action: 'Reserve MPLS labels',          detail: `MPLS label block ${randomLabelRange()} reserved | LDP/SR label distribution: OK` },
          { system: 'IPAM',       action: 'Assign P2P IP pool (/30)',     detail: `A-end: ${randomIp(0)} /30 | Z-end: ${randomIp(1)} /30 | Loopbacks allocated` },
          { system: 'NetBox',     action: 'Confirm transceiver stock',    detail: `QSFP-DD 400G-ZR (P/N: QSFP-DD-400G-ZR4): ${randomStock()} in stock at ${aLabel} CO` },
        ],
      },
      // ── Phase 4: Optical Layer Planning ─────────────────────────────────
      {
        id: 4, label: 'Optical Planning', icon: '🌊',
        steps: needsOptical ? [
          { system: 'ROADM Ctrl', action: 'Select ITU-T channel',         detail: `Channel C47 — 193.700 THz (1550.12 nm) assigned | Grid: 50 GHz spacing` },
          { system: 'ROADM Ctrl', action: 'Check wavelength conflicts',    detail: `C47 conflict scan: CLEAR on all 4 ROADM nodes | Adjacent channel isolation: 35 dB` },
          { system: 'Opt Planner',action: 'Calculate optical budget',      detail: `Fiber loss: ${randomFiberLoss()} dB | Connector loss: 12.0 dB | Splice loss: 18.0 dB` },
          { system: 'EDFA Ctrl',  action: 'Tune amplifier gain',          detail: `ILA-1: gain set 22.0 dB | ILA-2: gain set 22.0 dB | Raman: 3 dB Boost — total gain 47 dB` },
          { system: 'Opt Planner',action: 'Verify optical margin',        detail: `Net margin: ${randomMargin()} dB (target ≥ 3 dB) — PASS ✅ | FEC mode: oFEC-HD` },
          { system: 'ROADM Ctrl', action: 'Configure ROADM cross-connect',detail: `Optical cross-connect ${aLabel}→${zLabel} programmed via OpenROADM NETCONF` },
        ] : [
          { system: 'Opt Planner',action: 'Optical layer assessment',     detail: 'Service type does not require dedicated wavelength — electrical layer service confirmed' },
          { system: 'Opt Planner',action: 'Verify lit fiber capacity',    detail: `${aLabel}→${zLabel}: existing IP/MPLS transport capacity sufficient for ${bandwidth}` },
        ],
      },
      // ── Phase 5: Path Engineering ────────────────────────────────────────
      {
        id: 5, label: 'Path Engineering', icon: '🗺️',
        steps: [
          { system: 'Path Eng',   action: 'Compute shortest A-Z path',    detail: `CSPF computation: ${aLabel}→${randomMidHop()}→${zLabel} | Metric: ${randomMetric()} | Latency: ${slaObj.latencyMs - 1} ms` },
          { system: 'Path Eng',   action: 'Apply SRLG diversity',         detail: `Protection path: ${aLabel}→${altMidHop()}→${zLabel} | SRLG groups shared: 0 ✅` },
          { system: 'Path Eng',   action: 'Enforce latency constraint',   detail: `Working: ${slaObj.latencyMs - 1} ms | Protection: ${slaObj.latencyMs + 2} ms | Both within SLA budget ✅` },
          { system: 'SR Policy',  action: 'Program SR-TE policy',         detail: `SR policy color ${randomColor()} — binding SID ${randomSid()} — candidate path installed` },
          ...(protection !== 'none' ? [
            { system: 'FRR',      action: 'Enable Fast Reroute',          detail: `FRR pre-computation: 12 ms | Switchover target: < ${protObj.switchoverMs} ms | Node + link protect` },
          ] : []),
        ],
      },
      // ── Phase 6: Packet Layer Configuration ─────────────────────────────
      {
        id: 6, label: 'Packet Config', icon: '⚙️',
        steps: buildPacketSteps(circuitType, bandwidth, aLabel, zLabel),
      },
      // ── Phase 7: Service Activation & Testing ───────────────────────────
      {
        id: 7, label: 'Activation & Test', icon: '✅',
        steps: [
          { system: 'Test Set',   action: 'Optical power verification',   detail: `Rx power ${aLabel}: -10.2 dBm (target -8 to -14 dBm) ✅ | BER: < 1×10⁻¹³ ✅` },
          { system: 'Test Set',   action: 'RFC 2544 throughput test',     detail: `64-byte frames: ${bandwidth} wire-rate PASS ✅ | Frame loss: 0.000% | Duration: 60 s` },
          { system: 'Test Set',   action: 'Y.1564 service activation',    detail: `CIR: ${bandwidth} — 100% throughput PASS ✅ | EIR: 0 Mbps | Committed burst OK` },
          { system: 'Test Set',   action: 'Latency measurement',          detail: `Round-trip: ${slaObj.latencyMs - 1} ms avg | P99: ${slaObj.latencyMs} ms | Target ≤${slaObj.latencyMs} ms ✅` },
          { system: 'Test Set',   action: 'Jitter / PDV measurement',     detail: `Jitter: ${(slaObj.jitterMs * 0.6).toFixed(2)} ms | Target ≤${slaObj.jitterMs} ms ✅ | MAPDV: ${(slaObj.jitterMs * 0.8).toFixed(2)} ms` },
          { system: 'Test Set',   action: 'Packet loss verification',     detail: `Packet loss: 0.000% over 10 000 000 frames ✅ | Service: READY FOR HANDOFF` },
        ],
      },
      // ── Phase 8: Monitoring & Alarm Config ──────────────────────────────
      {
        id: 8, label: 'Monitoring', icon: '📡',
        steps: [
          { system: 'NMS',        action: 'Configure SNMP monitoring',    detail: `Circuit ${orderId} added to NMS — poll interval: 60 s | MIBs: IF-MIB, MPLS-TE-MIB` },
          { system: 'Telemetry',  action: 'Enable streaming telemetry',   detail: `gRPC dial-in to ${aLabel} PE — model: openconfig-interfaces | Cadence: 10 s` },
          { system: 'NMS',        action: 'Set utilization thresholds',   detail: `Warning: 75% of ${bandwidth} | Critical: 90% of ${bandwidth} | Email + PagerDuty wired` },
          { system: 'NMS',        action: 'Configure LOS/LOF alarms',     detail: 'Loss-of-Signal, Loss-of-Frame, High-BER, Link-Flap — all bound to NOC ticket queue' },
          { system: 'OSS',        action: 'Create circuit record',        detail: `Circuit ${orderId} committed to inventory | Status: IN-SERVICE | Activation: ${new Date().toLocaleDateString()}` },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Optical budget parameters (used by OpticalBudgetCalc)
// ─────────────────────────────────────────────────────────────────────────────
export function buildOpticalBudget(aId, zId, bandwidth) {
  const distanceMap = {
    'sea-pdx': 280, 'sea-spo': 450, 'sea-bel': 18, 'sea-evr': 48,
    'sea-oly': 95,  'bel-evr': 35,  'evr-spo': 400, 'pdx-spo': 520,
    'pdx-oly': 185, 'oly-sea': 95,
  };
  const key = [aId, zId].sort().join('-');
  const distKm = distanceMap[key] ?? 200;

  const fiberLossPerKm  = 0.20;   // dB/km standard SMF
  const connectorCount  = Math.round(distKm / 12);
  const connectorLoss   = 0.5;    // dB each
  const spliceCount     = Math.round(distKm * 0.6);
  const spliceLoss      = 0.10;   // dB each
  const ilaCount        = Math.floor(distKm / 100);
  const ilaGainDb       = 22;
  const edfaNoiseFig    = 5.5;
  const requiredMargin  = 3.0;

  const totalFiberLoss      = +(distKm * fiberLossPerKm).toFixed(1);
  const totalConnectorLoss  = +(connectorCount * connectorLoss).toFixed(1);
  const totalSpliceLoss     = +(spliceCount * spliceLoss).toFixed(1);
  const totalPathLoss       = +(totalFiberLoss + totalConnectorLoss + totalSpliceLoss).toFixed(1);
  const totalAmpGain        = +(ilaCount * ilaGainDb).toFixed(1);
  const netBudget           = +(totalAmpGain - totalPathLoss + 30).toFixed(1); // 30 dB Tx-Rx budget base
  const availableMargin     = +(netBudget - requiredMargin).toFixed(1);
  const pass                = availableMargin >= requiredMargin;

  return {
    distKm, fiberLossPerKm, connectorCount, connectorLoss, spliceCount, spliceLoss,
    ilaCount, ilaGainDb, edfaNoiseFig, requiredMargin,
    totalFiberLoss, totalConnectorLoss, totalSpliceLoss, totalPathLoss,
    totalAmpGain, netBudget, availableMargin, pass,
    bandwidth,
    channel: 'C47 — 193.700 THz (1550.12 nm)',
    fecMode: bandwidth === '400G' || bandwidth === '800G' ? 'oFEC-HD (25%)' : 'GFEC (7%)',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers (deterministic-ish random for realism without truly random output)
// ─────────────────────────────────────────────────────────────────────────────
function deliveryDate(slaId) {
  const days = slaId === 'gold' ? 45 : slaId === 'silver' ? 30 : 14;
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function randomHops()        { return [3, 4, 5][Math.floor(Math.random() * 3)]; }
function randomCapacity()    { return (20 + Math.floor(Math.random() * 35)); }
function randomFiberSpans()  { return (8 + Math.floor(Math.random() * 5)); }
function randomPorts()       { return (4 + Math.floor(Math.random() * 8)); }
function randomVlan()        { return (1000 + Math.floor(Math.random() * 3000)); }
function randomLabelRange()  { const s = 16000 + Math.floor(Math.random() * 6000); return `${s}–${s + 999}`; }
function randomIp(offset)    { const t = 172; const s = 20 + offset * 4; return `${t}.16.${s}.${offset * 4 + 1}`; }
function randomStock()       { return (2 + Math.floor(Math.random() * 8)); }
function randomFiberLoss()   { return (55 + Math.floor(Math.random() * 25)); }
function randomMargin()      { return (10 + Math.floor(Math.random() * 8)); }
function randomMetric()      { return (100 + Math.floor(Math.random() * 50)); }
function randomMidHop()      { return ['EVR', 'OLY', 'BEL'][Math.floor(Math.random() * 3)]; }
function altMidHop()         { return ['SPO', 'PDX', 'OLY'][Math.floor(Math.random() * 3)]; }
function randomColor()       { return (100 + Math.floor(Math.random() * 155)); }
function randomSid()         { return (16000 + Math.floor(Math.random() * 1000)); }
function equipLabel(type, idx) {
  const stack = EQUIPMENT_STACKS[type] || [];
  const i = idx < 0 ? stack.length + idx : idx;
  return stack[i] ? `${stack[i].vendor} ${stack[i].model}` : 'N/A';
}

function buildPacketSteps(circuitType, bandwidth, aLabel, zLabel) {
  switch (circuitType) {
    case 'l3vpn': return [
      { system: 'PE Router',   action: 'Create VRF instance',           detail: `VRF NNS-CUST-${randomVlan()} | RD: 65100:${randomVlan()} | RT import/export configured` },
      { system: 'PE Router',   action: 'Configure PE-CE BGP',           detail: `BGP AS 65001 (CE) ↔ AS 65100 (PE) | Prefix-limit: 1000 | BFD: 300ms/3` },
      { system: 'PE Router',   action: 'Enable MPLS forwarding',        detail: `MPLS forwarding enabled on PE↔CE interface | LDP/SR label exchange: active` },
      { system: 'QoS Engine',  action: 'Apply traffic policy',          detail: `${bandwidth} CIR shaper | EF queue: 10% | AF4: 20% | BE: 70% | DSCP markings preserved` },
      { system: 'Route Policy',action: 'Set BGP communities',           detail: `Community 65100:100 (customer) + 65100:${randomVlan()} (location) applied outbound` },
    ];
    case 'evc': return [
      { system: 'PE Router',   action: 'Create bridge domain',          detail: `BD ${randomVlan()} — EVC type: E-LINE (point-to-point) | MEF service: EPL` },
      { system: 'PE Router',   action: 'Configure pseudowire',          detail: `PW ID ${randomVlan()} | Encap: Ethernet | Control word: enabled | MTU: 9216` },
      { system: 'Switch',      action: 'Configure QinQ (S-tag/C-tag)',  detail: `S-tag: ${randomVlan()} | C-tag: pass-through | EtherType: 0x88A8` },
      { system: 'MEF Engine',  action: 'Define CoS / performance',      detail: `${bandwidth} CIR | CBS: 125 MB | EIR: 0 | Color-aware metering: enabled` },
    ];
    case 'dia': return [
      { system: 'BNG',         action: 'Configure subscriber profile',  detail: `IPoE profile: DIA-${bandwidth} | DHCP pool assigned | CGNAT: ${bandwidth === '1G' ? 'enabled' : 'bypassed'}` },
      { system: 'BNG',         action: 'Enable RADIUS authentication',  detail: `RADIUS server: 10.0.0.1:1812 | CoA port: 3799 | Acct: 1813 | Session timeout: 86400 s` },
      { system: 'BGP',         action: 'Advertise customer prefix',     detail: `Prefix: ${randomIp(0)}/24 | Community: NO_EXPORT | Origin: IGP | Next-hop self` },
      { system: 'QoS Engine',  action: 'Shape to contracted rate',      detail: `${bandwidth} policer on BNG uplink | Burst: 125% of CIR for 100ms | DSCP: CS0` },
    ];
    case 'wave': return [
      { system: 'ROADM Ctrl',  action: 'Provision optical cross-connect',detail:`OCC ${aLabel} → ${zLabel} via C47 | Power equalization: -2 dBm per port` },
      { system: 'OTN Switch',  action: 'Configure OTU4 container',      detail: `OTU4 (111.8 Gbps) | GMP mapping for ${bandwidth} client | BIP-8 monitoring enabled` },
      { system: 'NE Craft',    action: 'Set FEC parameters',            detail: `oFEC-HD 25% overhead | SD threshold: 1e-5 | SF threshold: 1e-3 | AIS insertion` },
      { system: 'ROADM Ctrl',  action: 'Verify end-to-end OTN path',    detail: `TCM layers 1–6 configured | Tandem connection monitoring: active | PM collection: 15-min` },
    ];
    case 'backhaul': return [
      { system: 'PTP Master',  action: 'Enable IEEE 1588v2 timing',     detail: `PTP domain 24 | Grandmaster: ${aLabel} CO | BMCA: ESMC locked to PRC` },
      { system: 'PE Router',   action: 'Configure eCPRI transport',     detail: `eCPRI Option 2 split 7.2 | 25GE uplink | Latency budget: 100 µs per segment` },
      { system: 'QoS Engine',  action: 'Apply mobile-aware QoS',        detail: `eCPRI: EF (strict priority) | S1/N2: AF41 | OAM: CS6 | Best effort: 0%` },
      { system: 'PE Router',   action: 'Set up pseudowire to BNG',      detail: `PW type: Ethernet | MPLS label: ${randomSid()} | CEM dejitter buffer: 1 ms` },
    ];
    case 'dci': return [
      { system: 'DC Switch',   action: 'Configure VXLAN VTEP',          detail: `VTEP ${randomIp(0)} | VNI: ${30000 + Math.floor(Math.random() * 10000)} | NVE interface: loopback0` },
      { system: 'DC Switch',   action: 'Setup EVPN Type-5 routing',     detail: `BGP EVPN AS 65200 | Route type 5 prefixes | VRF-lite inter-DC routing enabled` },
      { system: 'DCI GW',      action: 'Enable MACsec encryption',      detail: `MACsec GCM-AES-256 | SAK rekey: 3600 s | Replay window: 64 | Confidentiality: ON` },
      { system: 'DWDM',        action: 'Configure 800G coherent wave',  detail: `ICE6 modem: PM-16QAM | SD-FEC | Baud: 96 Gbaud | Tx power: 0 dBm` },
      { system: 'DC Switch',   action: 'Verify BUM traffic handling',   detail: `Ingress replication mode: EVPN | Head-end replication: enabled | BUM rate-limit: 1 Gbps` },
    ];
    default: return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Phase 2 & 3 data builders
// ─────────────────────────────────────────────────────────────────────────────

// ── Path routing table: working and protection paths per site pair ────────────
export const PATH_ROUTES = {
  'bel-evr': { working: ['bel','evr'],         protection: ['bel','sea','evr'],     wkLabel: 'BEL→EVR',         ptLabel: 'BEL→SEA→EVR'         },
  'bel-oly': { working: ['bel','sea','oly'],   protection: ['bel','evr','oly'],     wkLabel: 'BEL→SEA→OLY',    ptLabel: 'BEL→EVR→OLY'         },
  'bel-pdx': { working: ['bel','sea','pdx'],   protection: ['bel','oly','pdx'],     wkLabel: 'BEL→SEA→PDX',    ptLabel: 'BEL→OLY→PDX'         },
  'bel-sea': { working: ['bel','sea'],          protection: ['bel','evr','sea'],     wkLabel: 'BEL→SEA',         ptLabel: 'BEL→EVR→SEA'         },
  'bel-spo': { working: ['bel','evr','spo'],   protection: ['bel','sea','spo'],     wkLabel: 'BEL→EVR→SPO',    ptLabel: 'BEL→SEA→SPO'         },
  'evr-oly': { working: ['evr','sea','oly'],   protection: ['evr','bel','oly'],     wkLabel: 'EVR→SEA→OLY',    ptLabel: 'EVR→BEL→OLY'         },
  'evr-pdx': { working: ['evr','sea','pdx'],   protection: ['evr','bel','pdx'],     wkLabel: 'EVR→SEA→PDX',    ptLabel: 'EVR→BEL→PDX'         },
  'evr-sea': { working: ['evr','sea'],          protection: ['evr','bel','sea'],     wkLabel: 'EVR→SEA',         ptLabel: 'EVR→BEL→SEA'         },
  'evr-spo': { working: ['evr','spo'],          protection: ['evr','sea','spo'],     wkLabel: 'EVR→SPO',         ptLabel: 'EVR→SEA→SPO'         },
  'oly-pdx': { working: ['oly','pdx'],          protection: ['oly','sea','pdx'],     wkLabel: 'OLY→PDX',         ptLabel: 'OLY→SEA→PDX'         },
  'oly-sea': { working: ['oly','sea'],          protection: ['oly','bel','sea'],     wkLabel: 'OLY→SEA',         ptLabel: 'OLY→BEL→SEA'         },
  'oly-spo': { working: ['oly','sea','spo'],   protection: ['oly','pdx','spo'],     wkLabel: 'OLY→SEA→SPO',    ptLabel: 'OLY→PDX→SPO'         },
  'pdx-sea': { working: ['pdx','oly','sea'],   protection: ['pdx','evr','sea'],     wkLabel: 'PDX→OLY→SEA',    ptLabel: 'PDX→EVR→SEA'         },
  'pdx-spo': { working: ['pdx','sea','spo'],   protection: ['pdx','oly','spo'],     wkLabel: 'PDX→SEA→SPO',    ptLabel: 'PDX→OLY→SPO'         },
  'sea-spo': { working: ['sea','evr','spo'],   protection: ['sea','bel','spo'],     wkLabel: 'SEA→EVR→SPO',    ptLabel: 'SEA→BEL→SPO'         },
};

// Seeded deterministic "random" for reproducible but varied inventory data
function seeded(aId, zId, n) {
  return ((aId.charCodeAt(0) * 31 + zId.charCodeAt(0)) * 7919 + n * 1117) % 100;
}

// ── Inventory snapshot ────────────────────────────────────────────────────────
export function buildInventorySnapshot(aId, zId, bandwidth) {
  const bwLevel = { '1G': 1, '10G': 2, '100G': 3, '400G': 4, '800G': 5 }[bandwidth] ?? 2;
  const s = (n) => seeded(aId, zId, n);

  const fiberAvail  = Math.max(1, 15 - 3 - (s(1) % 5));
  const portsAvail  = Math.max(0, 12 - bwLevel - (s(2) % 3));
  const vlanUsed    = 3700 + (s(3) % 200);
  const ipAvail     = Math.max(0, 20 - bwLevel * 2 - (s(4) % 4));
  const xcvrStock   = Math.max(0, 10 - bwLevel * 2 - (s(5) % 3));
  const rackFree    = Math.max(1, 42 - 14 - (s(6) % 10));
  const powerUsed   = +(10 + (s(7) % 4) + (s(8) % 10) * 0.1).toFixed(1);

  return [
    { id: 'fiber',  label: 'Fiber Spans',           avail: fiberAvail,        total: 15,      unit: 'available',   critAt: 2, warnAt: 5,
      augment: fiberAvail <= 2 ? 'Deploy new conduit or lease dark fiber on this span — contact outside plant team' : null },
    { id: 'ports',  label: `Router Ports (${bandwidth})`, avail: portsAvail,  total: 12,      unit: 'free ports',  critAt: 1, warnAt: 3,
      augment: portsAvail <= 1 ? `Install line card: Cisco ASR9000-${bwLevel >= 4 ? '4HH' : '8X100GE'}-SE — lead time 4 weeks` : null },
    { id: 'vlan',   label: 'VLAN ID Pool',           avail: 4094 - vlanUsed,  total: 4094,    unit: 'IDs free',    critAt: 10, warnAt: 50,
      augment: (4094 - vlanUsed) <= 10 ? 'Request VLAN range expansion — coordinate with network architects' : null },
    { id: 'label',  label: 'MPLS Label Space',       avail: 1048576 - 18000,  total: 1048576, unit: 'labels free', critAt: 10000, warnAt: 100000, augment: null },
    { id: 'ip',     label: 'IP /30 P2P Pools',       avail: ipAvail,          total: 20,      unit: '/30s free',   critAt: 2, warnAt: 5,
      augment: ipAvail <= 2 ? 'Request additional /24 from IPAM — carve new /30 point-to-point pool' : null },
    { id: 'xcvr',   label: `QSFP-DD ${bandwidth} Stock`, avail: xcvrStock,   total: 10,      unit: 'in stock',    critAt: 1, warnAt: 3,
      augment: xcvrStock <= 1 ? `Order: QSFP-DD-${bandwidth}-ZR4 (P/N QSFP-DD-${bandwidth === '400G' ? '400G-FR4' : bandwidth + '-ZR'}) — 2–3 week lead time` : null },
    { id: 'rack',   label: 'Rack Space',              avail: rackFree,         total: 42,      unit: 'U free',      critAt: 2, warnAt: 6, augment: rackFree <= 2 ? 'Deploy additional 7-foot rack in CO — coordinate with facilities' : null },
    { id: 'power',  label: 'Power Capacity',          avail: +(16 - powerUsed).toFixed(1), total: 16, unit: 'A free', critAt: 1, warnAt: 3,
      augment: (16 - powerUsed) <= 1 ? 'Upgrade -48V DC plant breaker panel — coordinate with CO power team' : null },
  ];
}

// ── Feasibility gate results per phase ───────────────────────────────────────
export function buildFeasibilityGates(circuitType, bandwidth, slaId, aId, zId) {
  const bwLevel = { '1G': 1, '10G': 2, '100G': 3, '400G': 4, '800G': 5 }[bandwidth] ?? 2;
  const needsOptical = CIRCUIT_TYPES.find(c => c.id === circuitType)?.needsOptical ?? false;
  const s = (n) => seeded(aId, zId, n + bwLevel * 10);

  const gate = (phaseId, name, passThreshold, passMsg, warnMsg, warnAugment) => {
    const pct = s(phaseId);
    const status = pct < passThreshold ? 'WARN' : 'PASS';
    return {
      phaseId, name, status,
      detail:  status === 'PASS' ? passMsg : warnMsg,
      augment: status === 'WARN' ? warnAugment : null,
    };
  };

  return [
    gate(1, 'Address & Site Validation',   90,
      `${aId.toUpperCase()} and ${zId.toUpperCase()} addresses geocode verified — site survey on record`,
      'Address validation partial match — field verification recommended',
      'Schedule site survey: contact outside plant team'),

    gate(2, 'Topology Reachability',        93,
      `${aId.toUpperCase()}→${zId.toUpperCase()} fully reachable — all intermediate nodes UP`,
      'One intermediate node flagged for scheduled maintenance this window',
      'Verify maintenance window does not overlap with activation — reschedule if needed'),

    gate(3, 'Physical Capacity',            bwLevel >= 4 ? 55 : 88,
      `Fiber, ports, rack, and power sufficient for ${bandwidth} circuit`,
      `${bandwidth} demand may exceed available resources — augmentation recommended`,
      `Add line card: Cisco ASR9000-${bwLevel >= 4 ? '4HH-SE' : '8X100GE-SE'} and order additional fiber pair`),

    gate(4, needsOptical ? 'Wavelength Availability' : 'L2/L3 Headroom', bwLevel >= 4 ? 45 : 85,
      needsOptical
        ? 'C47 (193.700 THz) available on all ROADM nodes — no wavelength conflicts'
        : 'Packet layer headroom sufficient — no VLAN or label pool issues',
      needsOptical
        ? 'Wavelength conflict on C47 — alternate channel required'
        : 'VLAN pool near capacity — range expansion recommended',
      needsOptical
        ? 'Re-plan on C43 (193.300 THz) — update ROADM channel plan'
        : 'Request VLAN block 3800–3900 from network operations'),

    gate(5, 'SRLG Diversity',               94,
      'Working and protection paths share 0 SRLG groups — fully fiber-diverse',
      'SRLG partial overlap on one segment — limited diversity',
      'Apply SRLG exclusion rule set 42 in CSPF — re-run path computation'),

    gate(6, 'Config Pre-validation',        95,
      `PE config pre-checked on ${aId.toUpperCase()} and ${zId.toUpperCase()} — 0 policy conflicts`,
      'Route-target overlap detected with existing VPN — reassignment needed',
      'Assign unique RT from pool 65100:5000–5999 — update IPAM'),

    gate(7, 'Activation Test Gate',         92,
      'Y.1564 CIR conformance 100% — RFC 2544 wire-rate — all thresholds met',
      'Y.1564 CIR conformance 99.1% — minor shaper mis-configuration',
      'Adjust traffic policing burst parameters on BNG / PE egress shaper'),

    gate(8, 'NMS Circuit Commit',           97,
      `Circuit committed to NMS — SNMP reachable — status: IN-SERVICE`,
      'SNMP unreachable on one PE interface — management path check required',
      'Verify OOB management VLAN and routing to PE loopback'),
  ];
}

// ── Protection path metrics ───────────────────────────────────────────────────
export function buildProtectionPaths(aId, zId, slaId) {
  const key = [aId, zId].sort().join('-');
  const route = PATH_ROUTES[key] ?? {
    working: [aId, zId], protection: [aId, zId],
    wkLabel: `${aId.toUpperCase()}→${zId.toUpperCase()}`,
    ptLabel: `${aId.toUpperCase()}→${zId.toUpperCase()} (backup)`,
  };
  const slaObj = SLA_TIERS.find(s => s.id === slaId) ?? SLA_TIERS[0];

  return {
    working: {
      path:       route.working,
      label:      route.wkLabel,
      latencyMs:  slaObj.latencyMs - 1,
      hops:       route.working.length - 1,
      srlgShared: 0,
      frrMs:      50,
      status:     'ACTIVE',
    },
    protection: {
      path:       route.protection,
      label:      route.ptLabel,
      latencyMs:  slaObj.latencyMs + 2,
      hops:       route.protection.length - 1,
      srlgShared: 0,
      frrMs:      50,
      status:     'STANDBY',
    },
    srlgDiverse: true,
  };
}

// ── Activation test definitions (RFC 2544 / Y.1564) ──────────────────────────
export function buildActivationTests(bandwidth, slaId) {
  const slaObj = SLA_TIERS.find(s => s.id === slaId) ?? SLA_TIERS[0];
  return [
    { id: 'rfc_64',    name: 'RFC 2544 — 64 B',    standard: 'RFC 2544',      target: `${bandwidth} wire-rate`, result: bandwidth,                         unit: 'throughput', detail: '64-byte frames — wire-rate forwarding',         durationMs: 900  },
    { id: 'rfc_512',   name: 'RFC 2544 — 512 B',   standard: 'RFC 2544',      target: `${bandwidth} (100%)`,    result: bandwidth,                         unit: 'throughput', detail: '512-byte — zero packet loss',                   durationMs: 700  },
    { id: 'rfc_1518',  name: 'RFC 2544 — 1518 B',  standard: 'RFC 2544',      target: `${bandwidth} (100%)`,    result: bandwidth,                         unit: 'throughput', detail: 'Jumbo frame — PDU integrity verified',          durationMs: 700  },
    { id: 'y1564_cir', name: 'Y.1564 CIR Step',    standard: 'Y.1564',        target: `${bandwidth} (100%)`,    result: `${bandwidth} ✓`,                  unit: 'CIR',        detail: '25%→50%→75%→100% CIR ramp — all passed',       durationMs: 1100 },
    { id: 'latency',   name: 'Latency RTT',         standard: 'ITU-T Y.1731', target: `≤ ${slaObj.latencyMs} ms`,result: `${slaObj.latencyMs - 1} ms`,   unit: 'latency',    detail: `P50: ${slaObj.latencyMs-2} ms | P99: ${slaObj.latencyMs} ms`, durationMs: 800 },
    { id: 'jitter',    name: 'Jitter / PDV',        standard: 'ITU-T Y.1731', target: `≤ ${slaObj.jitterMs} ms`, result: `${(slaObj.jitterMs*0.6).toFixed(2)} ms`, unit: 'jitter', detail: `MAPDV: ${(slaObj.jitterMs*0.8).toFixed(2)} ms`,   durationMs: 700  },
    { id: 'loss',      name: 'Packet Loss',         standard: 'RFC 2544',      target: '0.000%',                 result: '0.000%',                          unit: 'loss',       detail: '10,000,000 frames — 0 lost',                    durationMs: 700  },
    { id: 'ber',       name: 'BER (Optical)',        standard: 'ITU-T G.826',  target: '< 1×10⁻¹²',             result: '< 1×10⁻¹³',                      unit: 'BER',        detail: 'Pre-FEC: 2.1×10⁻³ | Post-FEC: < 10⁻¹³',       durationMs: 900  },
  ];
}
