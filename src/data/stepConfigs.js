// Step-level live config generator for Circuit Planner simulation
// Returns a specific config snippet for each individual simulation step.
import { getStepPayload } from './stepPayloads';

function buildCtx(form, plan) {
  const seed    = plan?.orderId ? plan.orderId.replace('NNS-', '') : 'AABBCC';
  const seedNum = parseInt(seed, 36) || 12345;
  const vlanId  = 1000 + (seedNum % 3000);
  const vcId    = 10000 + (seedNum % 50000);
  const asn     = 65100;
  const ceBgpAsn = 65001;
  const custId  = 3000 + (seedNum % 9000);
  const rdValue = 1000 + (seedNum % 8000);
  const vrfName = `NNS-CUST-${custId}`;
  const bwMap   = { '1G': 1, '10G': 10, '100G': 100, '400G': 400, '800G': 800 };
  const bwG     = bwMap[form.bandwidth] ?? 10;
  const bwMbps  = bwG * 1000;
  const vlanMod = vlanId % 200;
  const peALoop = `10.0.0.${11 + (seedNum % 20)}`;
  const peZLoop = `10.0.0.${31 + (seedNum % 20)}`;
  const ceAIp   = `172.16.${vlanMod}.1`;
  const peAIp   = `172.16.${vlanMod}.2`;
  const ceZIp   = `172.16.${vlanMod + 4}.1`;
  const peZIp   = `172.16.${vlanMod + 4}.2`;
  const labelStart  = 16000 + (seedNum % 7000);
  const labelEnd    = labelStart + 999;
  const bindingSid  = 16000 + (seedNum % 7000) + 456;
  const srColor     = 100 + (seedNum % 900);
  const sdpId       = 100 + (seedNum % 900);
  const vxlanVni    = 10000 + (seedNum % 50000);
  const tunnelId    = 100 + (seedNum % 400);
  const oltPort     = 1 + (seedNum % 16);
  const gemPort     = 100 + (seedNum % 900);
  const cgnatPool   = `100.${64 + (seedNum % 60)}.0.0`;
  const serialHex   = seed.substring(0, 8).toUpperCase().padEnd(8, '0');
  const collectorIp = '10.1.1.200';
  const nmsIp       = '10.1.1.100';
  const latencyTarget = form.slaTier === 'gold' ? 5 : form.slaTier === 'silver' ? 10 : 20;
  const jitterTarget  = form.slaTier === 'gold' ? 0.5 : form.slaTier === 'silver' ? 1.0 : 5.0;
  const warnUtil = 75;
  const critUtil = 90;
  const waveModulation = bwG >= 400 ? 'DP-16QAM' : 'DP-QPSK';
  const waveFec        = bwG >= 400 ? 'oFEC-HD' : 'GFEC';
  const hopMap = { sea: '10.0.0.1', bel: '10.0.0.2', evr: '10.0.0.3', oly: '10.0.0.4', pdx: '10.0.0.5', spo: '10.0.0.6' };
  const hopIp  = hopMap[form.zSite] ?? '10.0.0.5';
  const deliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();
  const SITE_LABELS = { sea: 'Seattle CO-1', bel: 'Bellevue CO-2', evr: 'Everett CO-3', oly: 'Olympia CO-4', pdx: 'Portland CO-5', spo: 'Spokane CO-6' };
  return {
    orderId:      plan?.orderId ?? 'NNS-PENDING',
    aSite:        (form.aSite ?? 'sea').toUpperCase(),
    zSite:        (form.zSite ?? 'pdx').toUpperCase(),
    aLabel:       SITE_LABELS[form.aSite] ?? form.aSite,
    zLabel:       SITE_LABELS[form.zSite] ?? form.zSite,
    circuitType:  (form.circuitType ?? 'l3vpn').toUpperCase(),
    bandwidth:    form.bandwidth ?? '10G',
    slaTier:      (form.slaTier ?? 'gold').toUpperCase(),
    protection:   { none: 'UNPROTECTED', oneplus: '1+1', onecol: '1:1', diverse: 'DIVERSE_ROUTING' }[form.protection] ?? 'DIVERSE_ROUTING',
    vlanId, vcId, asn, ceBgpAsn, custId, rdValue, vrfName,
    bwG, bwMbps, vlanMod,
    peALoop, peZLoop, ceAIp, peAIp, ceZIp, peZIp,
    labelStart, labelEnd, bindingSid, srColor, sdpId, vxlanVni,
    tunnelId, oltPort, gemPort, cgnatPool, serialHex,
    collectorIp, nmsIp, latencyTarget, jitterTarget, warnUtil, critUtil,
    waveModulation, waveFec, hopIp, deliveryDate,
  };
}

function fill(template, ctx) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? ctx[k] : `{${k}}`));
}

// ── Step config definitions ──────────────────────────────────────────────────
// Key: step.action.toLowerCase().trim()
// Value: { label, lang, template }  (template uses {varName} placeholders)

const STEP_CONFIGS = {};

STEP_CONFIGS['parse service order'] = {
  label: 'OSS REST API \u2014 Service Order',
  lang: 'json',
  template:
`// POST https://oss.northstarfiber.net/api/v2/service-orders
{
  "orderId": "{orderId}",
  "serviceType": "{circuitType}",
  "customerRef": "CUST-{custId}",
  "aEndSite": { "id": "{aSite}", "name": "{aLabel}", "address": "see geocode" },
  "zEndSite": { "id": "{zSite}", "name": "{zLabel}", "address": "see geocode" },
  "bandwidth": { "cir": "{bandwidth}", "eir": "0" },
  "sla": { "tier": "{slaTier}", "latencyMs": {latencyTarget}, "jitterMs": {jitterTarget} },
  "protection": "{protection}",
  "regulatory": ["CALEA"],
  "estimatedDelivery": "{deliveryDate}"
}`,
};

STEP_CONFIGS['identify service type'] = {
  label: 'OSS \u2014 Service Classification',
  lang: 'cli',
  template:
`SERVICE CLASSIFICATION RESULT
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Order ID  : {orderId}
Class     : {circuitType}
Transport : IP/MPLS (electrical layer)
Encap     : MPLS label stack (RFC 4364)
Protection: {protection}
SLA Profile: {slaTier}-{latencyTarget}MS
CALEA     : Required (DHS-CALEA-2024)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
STATUS: CLASSIFIED \u2705`,
};

STEP_CONFIGS['validate endpoint addresses'] = {
  label: 'NetBox API \u2014 Site Geocode Lookup',
  lang: 'json',
  template:
`// GET https://netbox.northstarfiber.net/api/dcim/sites/?name={aLabel}
{
  "count": 1,
  "results": [{
    "id": 12,
    "name": "{aLabel} ({aSite})",
    "status": "active",
    "region": "Pacific Northwest",
    "latitude": 47.6062,
    "longitude": -122.3321,
    "facility": "NorthStar-PNW-{aSite}-1"
  }]
}
// GET https://netbox.northstarfiber.net/api/dcim/sites/?name={zLabel}
// \u2192 {zLabel} ({zSite}): lat 45.5051, lon -122.6750 \u2705`,
};

STEP_CONFIGS['confirm sla parameters'] = {
  label: 'SLA Engine \u2014 Contract Terms',
  lang: 'json',
  template:
`// SLA CONTRACT \u2014 {orderId}
{
  "slaId": "SLA-{orderId}",
  "tier": "{slaTier}",
  "uptime": "99.999%",
  "latencyTarget": "{latencyTarget} ms",
  "jitterTarget": "{jitterTarget} ms",
  "packetLossTarget": "0.000%",
  "berTarget": "< 1e-12",
  "downtimeBudget": "< 5 min/year",
  "creditPct": 25,
  "measurementInterval": "monthly",
  "billingRef": "BILL-{custId}"
}`,
};

STEP_CONFIGS['set delivery commitment'] = {
  label: 'OSS \u2014 Delivery & Regulatory Tags',
  lang: 'json',
  template:
`// PATCH https://oss.northstarfiber.net/api/v2/service-orders/{orderId}
{
  "deliveryCommitment": "{deliveryDate}",
  "regulatoryFlags": {
    "calea": true,
    "caleaRef": "DHS-CALEA-{custId}",
    "exportControl": false,
    "lawfulIntercept": "LI-TAGGED"
  },
  "workflowState": "PROVISIONING",
  "assignedNE": "NOC-TEAM-MPLS"
}`,
};

STEP_CONFIGS['check topology reachability'] = {
  label: 'NMS \u2014 OSPF/IS-IS Reachability',
  lang: 'cli',
  template:
`!! NMS \u2014 Topology Reachability Check
!! Source: {aSite}-PE \u2192 Destination: {zSite}-PE
!!
show isis topology level-2
IS-IS Level-2 Unicast path table
Node             Metric  Next-Hop     Interface    SNPA
{aSite}-ASR9001  --      Connected    --           --
EVR-NCS5500      10      {aSite}-RTR  Te0/0/0/1    *PtoP*
{zSite}-MX960    20      EVR-NCS5500  Te0/0/0/2    *PtoP*

!! Path {aSite}\u2192EVR\u2192{zSite}: 3 hops | REACHABLE \u2705
!! IGP metric: 120 | Estimated latency: {latencyTarget} ms`,
};

STEP_CONFIGS['verify mpls/sr domain'] = {
  label: 'IOS-XR \u2014 SR-MPLS Domain Check',
  lang: 'ios-xr',
  template:
`!! show segment-routing mpls connected-prefix-sid-map
!! NNS Core \u2014 SR Domain Verification
!!
Prefix/Mask     SID       Type  Value Range  SRGB-Range
{aSite}-loop/32 {labelStart}  Abs   1         Yes (16000-23999)
EVR-loop/32     16003     Abs   1         Yes
{zSite}-loop/32 {labelEnd}  Abs   1         Yes
!!
SR Domain  : PASS \u2705
SID range  : {labelStart}\u2013{labelEnd}
ISIS Level2: active | LDP-SR interwork: enabled
Binding SID: {bindingSid} allocated for {orderId}`,
};

STEP_CONFIGS['validate optical path'] = {
  label: 'Optical Ctrl \u2014 Layer Assessment',
  lang: 'cli',
  template:
`!! Optical Path Validation \u2014 {orderId}
!!
Service type : {circuitType}
Optical layer: NOT REQUIRED (electrical IP/MPLS service)
Assessment   : SKIP \u2705

!! For DWDM/Wave services this step would:
!!  - Query ROADM controller for available C-band channel
!!  - Verify OSNR margin on all ILA spans
!!  - Confirm amplifier gain headroom
!!  - Check ROADM pass-through degree capacity`,
};

STEP_CONFIGS['confirm tech compatibility'] = {
  label: 'NMS \u2014 Interoperability Matrix',
  lang: 'json',
  template:
`// NMS Interop Validation \u2014 {orderId}
{
  "aEnd": { "device": "{aSite}-CE", "model": "Cisco ISR 4331",
            "os": "IOS 15.9", "bgp": "EBGP", "mpls": true },
  "zEnd": { "device": "{zSite}-CE", "model": "Juniper SRX 345",
            "os": "JunOS 23.2", "bgp": "EBGP", "mpls": true },
  "interopTest": {
    "bgpSessionTypes": ["EBGP", "IPv4-unicast"],
    "mplsLabelStack": "compatible",
    "bfdSupport": true,
    "qosDscp": "end-to-end preserved"
  },
  "result": "INTEROP_VALIDATED \u2705"
}`,
};

STEP_CONFIGS['check link capacity headroom'] = {
  label: 'Capacity Mgr \u2014 Link Utilization',
  lang: 'cli',
  template:
`!! Capacity Manager \u2014 Working Path Utilization
!! Path: {aSite}\u2192EVR\u2192{zSite}
!!
Interface           BW      Used    Avail   Util%
{aSite}-TenGigE0/0  100G    20G     80G     20%   \u2705
EVR-TenGigE0/1      100G    18G     82G     18%   \u2705
{zSite}-TenGigE0/0  100G    22G     78G     22%   \u2705
!!
Requested : {bandwidth}
Headroom  : sufficient \u2705
Decision  : PROCEED \u2014 capacity reserved`,
};

STEP_CONFIGS['check fiber span availability'] = {
  label: 'NetBox API \u2014 Fiber Inventory',
  lang: 'json',
  template:
`// GET https://netbox.northstarfiber.net/api/dcim/cables/?site={aSite}&type=smf
{
  "count": 15,
  "available": 10,
  "allocated": 5,
  "spans": [
    { "spanId": "FIB-{aSite}-EVR-001", "type": "SMF-G.652D", "km": 48,  "status": "available" },
    { "spanId": "FIB-EVR-{zSite}-001", "type": "SMF-G.652D", "km": 232, "status": "available" }
  ],
  "result": "10/15 spans available \u2705"
}`,
};

STEP_CONFIGS['verify free router ports'] = {
  label: 'IOS-XR \u2014 Port Inventory',
  lang: 'ios-xr',
  template:
`!! show interfaces summary \u2014 {aSite}-ASR9001
!!
Interface    Type       BW        Status     Description
Te0/0/0/0    10GE       10G       up         *** METRO-A Nokia 7210 ***
Te0/0/0/1    100GE      100G      up         *** CORE UPLINK ***
Te0/0/0/2    100GE      --        admin-down *** AVAILABLE *** \u2190 allocate
Te0/0/0/3    100GE      --        admin-down *** AVAILABLE ***
...
!!
Free 100GE ports : 10 confirmed \u2705
Allocated for    : {orderId} \u2192 Te0/0/0/2`,
};

STEP_CONFIGS['allocate vlan id'] = {
  label: 'NetBox API \u2014 VLAN Allocation',
  lang: 'json',
  template:
`// POST https://netbox.northstarfiber.net/api/ipam/vlans/
{
  "vid": {vlanId},
  "name": "{orderId}-{circuitType}-{aSite}-{zSite}",
  "status": "active",
  "role": "provider-edge",
  "site": "{aSite}",
  "description": "Circuit {orderId} | BW {bandwidth} | SLA {slaTier}"
}
// \u2192 201 Created
// VLAN {vlanId} allocated \u2705
// Pool remaining: 3 of 4094`,
};

STEP_CONFIGS['reserve mpls labels'] = {
  label: 'NetBox \u2014 MPLS Label Reservation',
  lang: 'json',
  template:
`// PATCH https://netbox.northstarfiber.net/api/extras/circuits/{orderId}/
{
  "custom_fields": {
    "mpls_label_block": "{labelStart}\u2013{labelEnd}",
    "label_distribution": "LDP+SR",
    "sr_prefix_sid": {labelStart},
    "sr_binding_sid": {bindingSid},
    "lsp_name": "LSP-{orderId}-{aSite}-{zSite}",
    "label_status": "RESERVED"
  }
}
// Labels {labelStart}\u2013{labelEnd} reserved \u2705
// SR Binding SID: {bindingSid}`,
};

STEP_CONFIGS['assign p2p ip pool (/30)'] = {
  label: 'IPAM \u2014 P2P Address Allocation',
  lang: 'json',
  template:
`// POST https://netbox.northstarfiber.net/api/ipam/ip-addresses/
// A-end P2P link
{ "address": "{ceAIp}/30",
  "assigned_object": "{aSite}-ASR9001:TenGigE0/0/0/2.{vlanId}",
  "role": "loopback", "dns_name": "p2p-{aSite}-ce.nns.net" }

// Z-end P2P link
{ "address": "{ceZIp}/30",
  "assigned_object": "{zSite}-MX960:xe-0/0/0.{vlanId}",
  "role": "loopback", "dns_name": "p2p-{zSite}-ce.nns.net" }

// PE-A Loopback
{ "address": "{peALoop}/32", "assigned_object": "{aSite}-ASR9001:Loopback0" }

// PE-Z Loopback
{ "address": "{peZLoop}/32", "assigned_object": "{zSite}-MX960:lo0.0" }

// All allocations committed \u2705`,
};

STEP_CONFIGS['confirm transceiver stock'] = {
  label: 'Warehouse \u2014 Transceiver Stock Check',
  lang: 'json',
  template:
`// GET https://wms.northstarfiber.net/api/v1/inventory?pn=QSFP-DD-{bandwidth}-ZR4
{
  "partNumber": "QSFP-DD-{bandwidth}-ZR4",
  "description": "QSFP-DD {bandwidth} ZR4 Coherent Transceiver",
  "site": "{aSite}",
  "onHand": 2,
  "allocated": 0,
  "available": 2,
  "reorderPoint": 3,
  "reorderQty": 10,
  "leadTimeDays": 14,
  "result": "IN STOCK \u2705 \u2014 allocating 2\u00d7 to {orderId}"
}`,
};

STEP_CONFIGS['optical layer assessment'] = {
  label: 'Opt Planner \u2014 Layer Assessment',
  lang: 'cli',
  template:
`!! Optical Layer Assessment \u2014 {orderId}
!!
Circuit type : {circuitType}
Layer result : ELECTRICAL \u2014 dedicated wavelength not required
IP/MPLS cap  : {aSite}\u2192{zSite} transport capacity sufficient for {bandwidth}
Assessment   : CONFIRMED \u2014 routing on existing MPLS LSP \u2705

!! If this were Wave/DWDM the planner would:
!!  \u25ba Select ITU channel (C47 = 193.700 THz / 1550.12 nm)
!!  \u25ba Compute optical budget (fiber loss + connector + splice)
!!  \u25ba Check ROADM cross-connect port availability
!!  \u25ba Verify OSNR margin \u2265 3 dB`,
};

STEP_CONFIGS['verify lit fiber capacity'] = {
  label: 'Opt Planner \u2014 Transport Capacity',
  lang: 'cli',
  template:
`!! Lit Fiber Capacity Check
!! {aSite}\u2192EVR\u2192{zSite} IP/MPLS transport
!!
Segment             Capacity   Used    Avail   Status
{aSite}\u2192EVR         100G       20G     80G     OK \u2705
EVR\u2192{zSite}         100G       18G     82G     OK \u2705
!!
Requested BW : {bandwidth}
Fits within  : existing capacity \u2705
New LSP      : will be signalled on existing lit fiber
RSVP-TE BW  : {bandwidth} reserved end-to-end`,
};

STEP_CONFIGS['compute shortest a-z path'] = {
  label: 'IOS-XR \u2014 CSPF Path Computation',
  lang: 'ios-xr',
  template:
`!! CSPF Path Computation Result \u2014 {orderId}
!! Src: {peALoop} ({aSite}-ASR9001) \u2192 Dst: {peZLoop} ({zSite}-MX960)
!!
explicit-path name EP-{aSite}-{zSite}-WORKING
 index 1 next-address strict {hopIp}   ! intermediate hop
 index 2 next-address strict {peZLoop} ! destination PE-Z
!
interface tunnel-te {tunnelId}
 description *** {circuitType} {orderId} {aSite}\u2192{zSite} {bandwidth} ***
 ipv4 unnumbered Loopback0
 destination {peZLoop}
 signalled-bandwidth {bwMbps}
 path-option 1 explicit name EP-{aSite}-{zSite}-WORKING
 path-option 2 dynamic
 record-route
!
!! Metric: 120 | Estimated latency: {latencyTarget} ms \u2705`,
};

STEP_CONFIGS['apply srlg diversity'] = {
  label: 'IOS-XR \u2014 SRLG Diverse Path',
  lang: 'ios-xr',
  template:
`!! SRLG Diversity Configuration \u2014 {orderId}
!!
srlg
 interface TenGigE0/0/0/1
  srlg-value 1001   ! {aSite}\u2192EVR fiber duct SRLG
 !
 interface TenGigE0/0/0/2
  srlg-value 1002   ! {aSite}\u2192OLY alternate duct SRLG
 !
!
!! Protection path computation:
!! Working : {aSite}\u2192EVR\u2192{zSite}  SRLG groups: {1001}
!! Protect : {aSite}\u2192OLY\u2192{zSite}  SRLG groups: {1002}
!! Shared SRLGs: 0 \u2705 \u2014 fully diverse routing confirmed
!! Protection tunnel-te {tunnelId}1 signalled`,
};

STEP_CONFIGS['enforce latency constraint'] = {
  label: 'IOS-XR \u2014 Latency Constraint',
  lang: 'ios-xr',
  template:
`!! TE Latency Constraint \u2014 {orderId}
!!
interface tunnel-te {tunnelId}
 affinity exclude-all
 delay-measurement
  advertise-delay 4000   ! 4 ms one-way delay
 !
 constraints
  bandwidth {bwMbps}
  latency {latencyTarget}000  ! {latencyTarget} ms in microseconds
 !
!
!! Measurement result:
!! Working path latency : {latencyTarget} ms   \u2264 SLA {latencyTarget} ms \u2705
!! Protection path lat  : {latencyTarget}x2 ms \u2264 SLA {latencyTarget} ms \u2705
!! Both paths within SLA budget \u2014 PASS \u2705`,
};

STEP_CONFIGS['program sr-te policy'] = {
  label: 'IOS-XR \u2014 SR-TE Policy',
  lang: 'ios-xr',
  template:
`!! SR-TE Policy \u2014 {orderId}
!!
segment-routing traffic-eng
 policy {vrfName}-TE-{aSite}-{zSite}
  color {srColor} end-point ipv4 {peZLoop}
  candidate-paths
   preference 100
    explicit segment-list SL-{aSite}-{zSite}-WK
     index 1 mpls label {labelStart}   ! {hopIp} SID
     index 2 mpls label {labelEnd}     ! {zSite} PE SID
    !
   !
   preference 50
    dynamic
     pcep
     metric type igp
    !
   !
  !
  binding-sid mpls {bindingSid}
  auto-route
   include-prefix 0.0.0.0/0
  !
 !
!
!! SR Policy color {srColor} \u2014 Binding SID {bindingSid} installed \u2705`,
};

STEP_CONFIGS['enable fast reroute'] = {
  label: 'IOS-XR \u2014 FRR Pre-computation',
  lang: 'ios-xr',
  template:
`!! Fast Reroute Configuration \u2014 {orderId}
!!
mpls traffic-eng
 fast-reroute
  hold-backup 10
 !
 interface TenGigE0/0/0/1
  backup-path tunnel-te {tunnelId}1
 !
!
interface tunnel-te {tunnelId}1
 description *** FRR BYPASS for {orderId} ***
 ipv4 unnumbered Loopback0
 destination {peZLoop}
 path-option 1 explicit name EP-{aSite}-{zSite}-PROTECT
 fast-reroute
 priority 6 6
!
!! Pre-computation: COMPLETE
!! Switchover time : < 200 ms | Target met \u2705
!! Link protect    : enabled
!! Node protect    : enabled`,
};

STEP_CONFIGS['create vrf instance'] = {
  label: 'IOS-XR + JunOS \u2014 VRF Creation',
  lang: 'ios-xr',
  template:
`!! === PE-A Cisco ASR 9001 \u2014 VRF Config ===
vrf {vrfName}
 description {orderId} \u2014 {circuitType} {aSite}\u2192{zSite} {slaTier}
 address-family ipv4 unicast
  import route-target
   {asn}:{rdValue}
  !
  export route-target
   {asn}:{rdValue}
  !
 !
!

## === PE-Z Juniper MX960 \u2014 routing-instance ===
set routing-instances {vrfName} instance-type vrf
set routing-instances {vrfName} description "{orderId} \u2014 {circuitType} {zSite}-SIDE"
set routing-instances {vrfName} route-distinguisher {asn}:{rdValue}
set routing-instances {vrfName} vrf-target target:{asn}:{rdValue}
set routing-instances {vrfName} vrf-table-label

!! VRF {vrfName} created on both PEs \u2705
!! RD: {asn}:{rdValue} | RT: {asn}:{rdValue}`,
};

STEP_CONFIGS['configure pe-ce bgp'] = {
  label: 'IOS-XR + JunOS \u2014 PE-CE BGP',
  lang: 'ios-xr',
  template:
`!! === PE-A Cisco ASR 9001 \u2014 PE-CE BGP ===
router bgp {asn}
 bgp router-id {peALoop}
 !
 vrf {vrfName}
  rd {asn}:{rdValue}
  address-family ipv4 unicast
   redistribute connected
  !
  neighbor {ceAIp}
   remote-as {ceBgpAsn}
   description *** CE-A Cisco ISR 4331 {aSite} ***
   bfd fast-detect
   bfd multiplier 3
   bfd minimum-interval 300
   address-family ipv4 unicast
    route-policy IMPORT-{vrfName} in
    route-policy EXPORT-{vrfName} out
    prefix-limit maximum 1000 restart 60
    as-override
   !
  !
 !
!

## === PE-Z Juniper MX960 \u2014 BGP neighbor ===
set routing-instances {vrfName} protocols bgp group CE-{zSite} type external
set routing-instances {vrfName} protocols bgp group CE-{zSite} peer-as {ceBgpAsn}
set routing-instances {vrfName} protocols bgp group CE-{zSite} neighbor {ceZIp}
set routing-instances {vrfName} protocols bgp group CE-{zSite} bfd-liveness-detection minimum-interval 300

!! BGP sessions configured on both PEs \u2705
!! BFD: 300ms \u00d7 3 = 900ms detection`,
};

STEP_CONFIGS['enable mpls forwarding'] = {
  label: 'IOS-XR \u2014 MPLS Interface Activation',
  lang: 'ios-xr',
  template:
`!! === PE-A \u2014 MPLS Interface Enable ===
mpls ldp
 interface TenGigE0/0/0/2   ! CE-A uplink (VLAN {vlanId})
 !
 interface TenGigE0/0/0/1   ! Core uplink
 !
!
interface TenGigE0/0/0/2.{vlanId}
 description *** VRF {vrfName} \u2014 CE-A {ceAIp}/30 ***
 vrf {vrfName}
 ipv4 address {peAIp} 255.255.255.252
 encapsulation dot1q {vlanId}
 no shutdown
!
!! LDP session to PE-Z established:
!! Local:  {peALoop}  label-in:  {labelStart}
!! Remote: {peZLoop}  label-out: {labelEnd}
!! MPLS forwarding: ACTIVE \u2705
!! SR label exchange: enabled | LSP UP \u2705`,
};

STEP_CONFIGS['apply traffic policy'] = {
  label: 'IOS-XR \u2014 QoS Policy-map',
  lang: 'ios-xr',
  template:
`!! === QoS Policy \u2014 {bandwidth} {slaTier} {circuitType} ===
class-map match-any CM-EF
 match dscp ef
!
class-map match-any CM-AF4
 match dscp af41 af42 af43
!
class-map match-any CM-AF2
 match dscp af21 af22 af23
!
policy-map PM-{bandwidth}-{slaTier}-{circuitType}
 class CM-EF
  priority level 1
  police rate 10 percent peak-rate 12 percent
   conform-action transmit
   exceed-action drop
  set dscp ef
 !
 class CM-AF4
  bandwidth percent 20
  random-detect dscp-based
  set dscp af41
 !
 class class-default
  bandwidth percent 70
  fair-queue
  set dscp default
 !
!
interface TenGigE0/0/0/2.{vlanId}
 service-policy input PM-{bandwidth}-{slaTier}-{circuitType}
 service-policy output PM-{bandwidth}-{slaTier}-{circuitType}
!
!! QoS applied: EF 10% | AF4 20% | BE 70% \u2705
!! DSCP markings preserved end-to-end`,
};

STEP_CONFIGS['set bgp communities'] = {
  label: 'IOS-XR \u2014 BGP Community Tags',
  lang: 'ios-xr',
  template:
`!! === BGP Community Policy \u2014 {orderId} ===
community-set CS-NNS-CUSTOMER
 {asn}:100
end-set
!
community-set CS-NNS-LOCATION-{aSite}
 {asn}:{rdValue}
end-set
!
route-policy EXPORT-{vrfName}
 set community CS-NNS-CUSTOMER additive
 set community CS-NNS-LOCATION-{aSite} additive
 pass
end-policy
!
route-policy IMPORT-{vrfName}
 if community matches-any CS-NNS-CUSTOMER then
  pass
 else
  drop
 endif
end-policy
!
!! Communities applied outbound on PE-CE session \u2705
!! {asn}:100       \u2014 customer route tag
!! {asn}:{rdValue} \u2014 location tag {aSite}`,
};

STEP_CONFIGS['optical power verification'] = {
  label: 'Test Set \u2014 Optical Power & BER',
  lang: 'cli',
  template:
`OPTICAL POWER MEASUREMENT \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Site          : {aSite} \u2014 {aLabel}
Tx Power      : +0.0 dBm (nominal)
Rx Power      : -10.2 dBm  \u2705 (target: -8 to -14 dBm)
Wavelength    : 1550.12 nm (C47)
OSNR          : 28.4 dB     \u2705 (target: \u226518 dB)
Chromatic Disp: 1280 ps/nm  \u2705 (within tolerance)
BER (pre-FEC) : 3.2\u00d710\u207b\u2074   \u2705 (FEC threshold: 2\u00d710\u207b\u00b2)
BER (post-FEC): < 1\u00d710\u207b\u00b9\u00b3  \u2705 (target: < 1\u00d710\u207b\u00b9\u00b2)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RESULT: OPTICAL LAYER PASS \u2705`,
};

STEP_CONFIGS['rfc 2544 throughput test'] = {
  label: 'RFC 2544 \u2014 Throughput Benchmark',
  lang: 'cli',
  template:
`RFC 2544 THROUGHPUT TEST \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
CIR Target    : {bandwidth} ({bwMbps} Mbps)
Test Duration : 60 seconds per frame size
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Frame Size  Throughput    Frame Loss  Latency
  64 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
 128 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
 256 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
 512 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
1024 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
1518 bytes  {bandwidth}      0.000%   {latencyTarget} ms  \u2705
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RESULT: WIRE-RATE THROUGHPUT PASS \u2705
Frame loss  : 0.000% \u2705
Back-to-back: 1,488,095 fps`,
};

STEP_CONFIGS['y.1564 service activation'] = {
  label: 'Y.1564 \u2014 Service Activation Test',
  lang: 'cli',
  template:
`ITU-T Y.1564 SERVICE ACTIVATION TEST \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Step 1 \u2014 CIR validation (100% load)
  Throughput : {bandwidth} / {bandwidth} = 100% \u2705
  Frame loss : 0.000% \u2705
  Latency    : {latencyTarget} ms avg \u2705
  Jitter     : {jitterTarget} ms \u2705

Step 2 \u2014 EIR validation (0 Mbps committed above CIR)
  EIR       : 0 Mbps | Committed burst: OK \u2705

Step 3 \u2014 Traffic policing check
  Offered   : 110% of CIR
  Accepted  : 100% CIR \u2705
  Dropped   : 10% excess \u2705 (policy enforced)

Step 4 \u2014 15-minute soak test
  Duration  : 15 min | Loss: 0.000% \u2705
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RESULT: Y.1564 PASS \u2014 SERVICE READY \u2705`,
};

STEP_CONFIGS['latency measurement'] = {
  label: 'Test Set \u2014 Latency / RTT',
  lang: 'cli',
  template:
`LATENCY MEASUREMENT \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Probe packets : 10,000 \u00d7 64-byte ICMP
Direction     : {aSite} \u2194 {zSite} (round-trip)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
RTT min  :  {latencyTarget} ms
RTT avg  :  {latencyTarget} ms
RTT max  :  {latencyTarget} ms
P95      :  {latencyTarget} ms
P99      :  {latencyTarget} ms
P99.9    :  {latencyTarget} ms
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SLA target : \u2264 {latencyTarget} ms RTT
Result     : PASS \u2705
One-way    : {latencyTarget}\u00f72 ms (estimated)`,
};

STEP_CONFIGS['jitter / pdv measurement'] = {
  label: 'Test Set \u2014 Jitter / PDV',
  lang: 'cli',
  template:
`JITTER & PACKET DELAY VARIATION \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Probe packets : 10,000 consecutive
Packet rate   : {bwMbps} kpps (wire rate)
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Mean PDV (jitter) : 0.30 ms  \u2705 (target \u2264 {jitterTarget} ms)
Peak PDV          : 0.48 ms  \u2705
IPDV (RFC 3393)   : 0.32 ms  \u2705
MAPDV             : 0.40 ms  \u2705
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SLA tier  : {slaTier} \u2014 jitter \u2264 {jitterTarget} ms
Result    : PASS \u2705`,
};

STEP_CONFIGS['packet loss verification'] = {
  label: 'Test Set \u2014 Packet Loss',
  lang: 'cli',
  template:
`PACKET LOSS VERIFICATION \u2014 {orderId}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
Total packets sent : 10,000,000
Total packets rcvd : 10,000,000
Packets lost       : 0
Loss rate          : 0.000%
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
SLA target : 0.000% packet loss
Result     : PASS \u2705

Service status: READY FOR HANDOFF \u2705
Activation ref: {orderId} \u2014 {bandwidth} {circuitType}
Effective date: immediate`,
};

STEP_CONFIGS['configure snmp monitoring'] = {
  label: 'IOS-XR \u2014 SNMP Configuration',
  lang: 'ios-xr',
  template:
`!! === NMS SNMP Monitoring \u2014 {orderId} ===
snmp-server community NorthStar-RO RO
snmp-server host {nmsIp} version 2c NorthStar-RO
snmp-server trap-source Loopback0
!
snmp-server ifindex persist
snmp-server view NNS-VIEW ifDescr included
snmp-server view NNS-VIEW ifOperStatus included
snmp-server view NNS-VIEW ifHCInOctets included
snmp-server view NNS-VIEW ifHCOutOctets included
snmp-server view NNS-VIEW mplsTeStdMIB included
snmp-server view NNS-VIEW mplsLdpStdMIB included
snmp-server view NNS-VIEW bgp4MIB included
!
!! Circuit added to NMS poller \u2705
!! Circuit ref  : {orderId}
!! OID scope    : IF-MIB, MPLS-TE-MIB, BGP4-MIB
!! Poll interval: 60 s | Trap dest: {nmsIp}`,
};

STEP_CONFIGS['enable streaming telemetry'] = {
  label: 'IOS-XR \u2014 gRPC Telemetry',
  lang: 'ios-xr',
  template:
`!! === gRPC Streaming Telemetry \u2014 {orderId} ===
telemetry model-driven
 destination-group DG-NNS-COLLECTOR
  address-family ipv4 {collectorIp} port 57400
   encoding self-describing-gpb
   protocol grpc no-tls
  !
 !
 sensor-group SG-{orderId}
  sensor-path openconfig-interfaces:interfaces/interface
  sensor-path openconfig-mpls:mpls/lsps/constrained-path
  sensor-path openconfig-bgp:bgp/neighbors
  sensor-path Cisco-IOS-XR-qos-ma-oper:qos/interface-table
 !
 subscription SUB-{orderId}
  sensor-group-id SG-{orderId} sample-interval 10000
  destination-id DG-NNS-COLLECTOR
  source-interface Loopback0
 !
!
!! gRPC dial-in: {peALoop}:57400 ACTIVE \u2705
!! Cadence: 10 s | Compression: gzip`,
};

STEP_CONFIGS['set utilization thresholds'] = {
  label: 'NMS \u2014 Threshold Configuration',
  lang: 'json',
  template:
`// POST https://nms.northstarfiber.net/api/v1/thresholds/
{
  "circuitId": "{orderId}",
  "interface": "{aSite}-ASR9001:TenGigE0/0/0/2.{vlanId}",
  "thresholds": [
    { "metric": "utilization", "direction": "in",
      "warning": {warnUtil}, "critical": {critUtil}, "unit": "%" },
    { "metric": "utilization", "direction": "out",
      "warning": {warnUtil}, "critical": {critUtil}, "unit": "%" },
    { "metric": "error-rate", "warning": 0.01, "critical": 0.1, "unit": "%" }
  ],
  "notifications": {
    "warning": ["noc-email@northstarfiber.net"],
    "critical": ["noc-email@northstarfiber.net", "pagerduty-p1"]
  }
}
// Thresholds applied \u2705 \u2014 warn@{warnUtil}% crit@{critUtil}%`,
};

STEP_CONFIGS['configure los/lof alarms'] = {
  label: 'NMS \u2014 Alarm Binding',
  lang: 'json',
  template:
`// POST https://nms.northstarfiber.net/api/v1/alarms/circuit-bindings
{
  "circuitId": "{orderId}",
  "alarms": [
    { "type": "LOS",       "severity": "CRITICAL",
      "notification": ["NOC-EMAIL", "PAGERDUTY-P1"],
      "autoTicket": true, "queue": "TIER-1-MPLS" },
    { "type": "LOF",       "severity": "CRITICAL",
      "notification": ["NOC-EMAIL", "PAGERDUTY-P1"],
      "autoTicket": true },
    { "type": "HIGH-BER",  "threshold": "1e-6", "severity": "MAJOR",
      "notification": ["NOC-EMAIL"] },
    { "type": "LINK-FLAP", "threshold": 3, "window": "5m",
      "severity": "MINOR" },
    { "type": "UTIL-WARN", "threshold": "{warnUtil}%",
      "severity": "WARNING" },
    { "type": "UTIL-CRIT", "threshold": "{critUtil}%",
      "severity": "CRITICAL" }
  ]
}
// All alarms bound to NOC ticket queue \u2705`,
};

STEP_CONFIGS['create circuit record'] = {
  label: 'OSS \u2014 Circuit Commit to Inventory',
  lang: 'json',
  template:
`// PATCH https://oss.northstarfiber.net/api/v2/service-orders/{orderId}
{
  "status": "IN-SERVICE",
  "activationDate": "2026-03-21T09:51:18Z",
  "circuit": {
    "id": "{orderId}",
    "type": "{circuitType}",
    "bandwidth": "{bandwidth}",
    "slaTier": "{slaTier}",
    "aEnd": { "site": "{aSite}", "device": "{aSite}-ASR9001", "ip": "{ceAIp}" },
    "zEnd": { "site": "{zSite}", "device": "{zSite}-MX960",   "ip": "{ceZIp}" }
  },
  "provisioned": {
    "vrf": "{vrfName}",
    "vlan": {vlanId},
    "mplsLabels": "{labelStart}\u2013{labelEnd}",
    "srBindingSid": {bindingSid},
    "workingPath": "{aSite}\u2192EVR\u2192{zSite}",
    "protectionPath": "{aSite}\u2192OLY\u2192{zSite}"
  },
  "contacts": { "noc": "noc@northstarfiber.net" }
}
// Circuit {orderId} committed to inventory \u2705
// Status: IN-SERVICE | Date: 2026-03-21`,
};

// ── Aliases ──────────────────────────────────────────────────────────────────
STEP_CONFIGS['check fiber availability']  = STEP_CONFIGS['check fiber span availability'];
STEP_CONFIGS['allocate vlan']             = STEP_CONFIGS['allocate vlan id'];
STEP_CONFIGS['configure bgp']             = STEP_CONFIGS['configure pe-ce bgp'];
STEP_CONFIGS['rfc 2544']                  = STEP_CONFIGS['rfc 2544 throughput test'];

// ── Public API ────────────────────────────────────────────────────────────────
export function getStepConfig(step, form, plan) {
  if (!step || !step.action) return null;
  const key = step.action.toLowerCase().trim();
  const def = STEP_CONFIGS[key];
  if (!def) return null;
  const ctx = buildCtx(form, plan);
  const payloadData = getStepPayload(step, form, plan);
  return {
    label:       def.label,
    lang:        def.lang,
    config:      fill(def.template, ctx),
    payload:     payloadData?.payload     ?? null,
    payloadLang: payloadData?.payloadLang ?? 'json',
    log:         payloadData?.log         ?? null,
  };
}
