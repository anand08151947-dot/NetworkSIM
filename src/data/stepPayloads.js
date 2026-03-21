// Payload and provisioning log generator for Circuit Planner simulation steps.
// Each step has a raw API/NETCONF/gNMI payload sent TO the system, and a syslog
// audit trail returned FROM the system.

function buildPayloadCtx(form, plan) {
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

// ── Step payload definitions ─────────────────────────────────────────────────
// payloadLang: 'json' | 'xml' | 'cli'
// payloadTemplate: raw payload sent TO the system ({varName} placeholders)
// logTemplate: provisioning audit log FROM the system ({varName} placeholders)

const STEP_PAYLOADS = {};

STEP_PAYLOADS['parse service order'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/service-orders HTTP/1.1
Host: oss.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-001
X-Correlation-ID: CORR-{orderId}
X-Operator: provisioning-engine/3.2.1

{
  "orderId": "{orderId}",
  "orderClass": "NEW_INSTALL",
  "serviceType": "{circuitType}",
  "customerRef": "CUST-{custId}",
  "aEndSite": { "siteId": "{aSite}", "label": "{aLabel}" },
  "zEndSite": { "siteId": "{zSite}", "label": "{zLabel}" },
  "requestedBandwidth": "{bandwidth}",
  "slaTier": "{slaTier}",
  "protectionMode": "{protection}",
  "estimatedDelivery": "{deliveryDate}",
  "priority": "STANDARD",
  "tags": ["auto-provisioned", "circuit-planner"]
}`,
  logTemplate:
`[2026-03-21T09:50:00Z] INFO  OSS-WF        Order {orderId}: step "parse service order" STARTED
[2026-03-21T09:50:00Z] INFO  OSS-WF        Received service order payload (847 bytes)
[2026-03-21T09:50:00Z] DEBUG OSS-WF        Schema validation: JSON-Schema v7 draft
[2026-03-21T09:50:00Z] DEBUG OSS-WF        Parsed fields: orderId={orderId} type={circuitType} bw={bandwidth}
[2026-03-21T09:50:01Z] INFO  OSS-WF        Order persisted to DB — state: PARSING
[2026-03-21T09:50:01Z] INFO  OSS-WF        Workflow instance WF-{orderId} created
[2026-03-21T09:50:01Z] INFO  OSS-WF        Step COMPLETED ✅ | next: identify service type`,
};

STEP_PAYLOADS['identify service type'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/service-classifier HTTP/1.1
Host: oss.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-002
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "rawServiceType": "{circuitType}",
  "bandwidth": "{bandwidth}",
  "aEndCapabilities": ["MPLS", "SR-MPLS", "RSVP-TE", "100GE"],
  "zEndCapabilities": ["MPLS", "SR-MPLS", "RSVP-TE", "100GE"],
  "classifyFor": ["TECHNOLOGY", "UNDERLAY", "DATAPLANE", "PROTECTION"]
}`,
  logTemplate:
`[2026-03-21T09:50:03Z] INFO  OSS-WF        Order {orderId}: step "identify service type" STARTED
[2026-03-21T09:50:03Z] INFO  OSS-WF        Querying service classifier endpoint
[2026-03-21T09:50:03Z] DEBUG OSS-WF        Raw type: {circuitType} | bw: {bandwidth}
[2026-03-21T09:50:03Z] INFO  OSS-WF        Classifier result: technology=MPLS/SR dataplane=MPLS-TE
[2026-03-21T09:50:04Z] INFO  OSS-WF        Protection scheme resolved: {protection}
[2026-03-21T09:50:04Z] INFO  OSS-WF        Step COMPLETED ✅ | service class: {circuitType}`,
};

STEP_PAYLOADS['validate endpoint addresses'] = {
  payloadLang: 'json',
  payloadTemplate:
`GET /api/v2/sites/{aSite}/validate HTTP/1.1
Host: netbox.northstarfiber.net
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-003
Accept: application/json

---

GET /api/v2/sites/{zSite}/validate HTTP/1.1
Host: netbox.northstarfiber.net
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-003B
Accept: application/json`,
  logTemplate:
`[2026-03-21T09:50:06Z] INFO  OSS-WF        Order {orderId}: step "validate endpoint addresses" STARTED
[2026-03-21T09:50:06Z] INFO  OSS-WF        Querying NetBox for site {aSite}
[2026-03-21T09:50:06Z] DEBUG OSS-WF        GET /api/v2/sites/{aSite}/validate → HTTP 200
[2026-03-21T09:50:06Z] INFO  OSS-WF        {aSite} validated: status=ACTIVE devices=12 capacity=OK
[2026-03-21T09:50:07Z] INFO  OSS-WF        Querying NetBox for site {zSite}
[2026-03-21T09:50:07Z] DEBUG OSS-WF        GET /api/v2/sites/{zSite}/validate → HTTP 200
[2026-03-21T09:50:07Z] INFO  OSS-WF        {zSite} validated: status=ACTIVE devices=9 capacity=OK
[2026-03-21T09:50:07Z] INFO  OSS-WF        Step COMPLETED ✅ | both endpoints validated`,
};

STEP_PAYLOADS['confirm sla parameters'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/sla/validate HTTP/1.1
Host: sla.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-004
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "tier": "{slaTier}",
  "requirements": {
    "latencyMaxMs":    {latencyTarget},
    "jitterMaxMs":     {jitterTarget},
    "availabilityPct": 99.99,
    "packetLossMaxPct": 0.001,
    "mttrs": 240
  },
  "circuitType": "{circuitType}",
  "bandwidth": "{bandwidth}",
  "protection": "{protection}"
}`,
  logTemplate:
`[2026-03-21T09:50:09Z] INFO  OSS-WF        Order {orderId}: step "confirm sla parameters" STARTED
[2026-03-21T09:50:09Z] INFO  SLA-ENGINE    Validating SLA tier {slaTier} against circuit {circuitType}
[2026-03-21T09:50:09Z] DEBUG SLA-ENGINE    Latency budget: {latencyTarget}ms | Jitter: {jitterTarget}ms
[2026-03-21T09:50:09Z] INFO  SLA-ENGINE    Tier {slaTier} parameters are within network capability
[2026-03-21T09:50:10Z] INFO  SLA-ENGINE    SLA contract template SLA-{slaTier}-001 applied
[2026-03-21T09:50:10Z] INFO  OSS-WF        Step COMPLETED ✅ | SLA validated for {slaTier} tier`,
};

STEP_PAYLOADS['set delivery commitment'] = {
  payloadLang: 'json',
  payloadTemplate:
`PATCH /api/v2/service-orders/{orderId} HTTP/1.1
Host: oss.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-005
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "deliveryCommitment": {
    "targetDate": "{deliveryDate}",
    "slaWindow": "45 days",
    "penaltyClause": "PRO_RATA_CREDIT",
    "escalationContact": "delivery-mgmt@northstarfiber.net"
  },
  "status": "COMMITTED",
  "notifyCustomer": true
}`,
  logTemplate:
`[2026-03-21T09:50:12Z] INFO  OSS-WF        Order {orderId}: step "set delivery commitment" STARTED
[2026-03-21T09:50:12Z] INFO  OSS-WF        PATCH /api/v2/service-orders/{orderId} → HTTP 200
[2026-03-21T09:50:12Z] INFO  OSS-WF        Delivery date committed: {deliveryDate}
[2026-03-21T09:50:13Z] INFO  OSS-WF        Customer notification email queued → CUST-{custId}
[2026-03-21T09:50:13Z] INFO  OSS-WF        Order status updated: COMMITTED
[2026-03-21T09:50:13Z] INFO  OSS-WF        Step COMPLETED ✅ | commitment recorded`,
};

STEP_PAYLOADS['check topology reachability'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/topology/reachability HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-006
X-Correlation-ID: CORR-{orderId}

{
  "source": "{aSite}",
  "destination": "{zSite}",
  "serviceType": "{circuitType}",
  "bandwidth": "{bandwidth}",
  "checks": [
    "LAYER2_REACHABILITY",
    "LAYER3_REACHABILITY",
    "MPLS_REACHABILITY",
    "LDP_ADJACENCY",
    "ISIS_REACHABILITY"
  ],
  "correlationId": "CORR-{orderId}"
}`,
  logTemplate:
`[2026-03-21T09:50:15Z] INFO  NMS-PROV      Order {orderId}: step "check topology reachability" STARTED
[2026-03-21T09:50:15Z] INFO  NMS-PROV      Initiating topology reachability check {aSite}→{zSite}
[2026-03-21T09:50:15Z] DEBUG NMS-PROV      ISIS adjacency matrix loaded (14 nodes, 38 links)
[2026-03-21T09:50:15Z] INFO  NMS-PROV      L3 reachability: {aSite}-ASR9001 → {zSite}-MX960 ✅
[2026-03-21T09:50:16Z] INFO  NMS-PROV      LDP session: {peALoop} ↔ {peZLoop} — state: OPERATIONAL
[2026-03-21T09:50:16Z] INFO  NMS-PROV      All reachability checks PASSED
[2026-03-21T09:50:16Z] INFO  OSS-WF        Step COMPLETED ✅ | topology reachable`,
};

STEP_PAYLOADS['verify mpls/sr domain'] = {
  payloadLang: 'json',
  payloadTemplate:
`GET /api/v2/mpls/domains?sites={aSite},{zSite}&type=SR-MPLS HTTP/1.1
Host: netbox.northstarfiber.net
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-007
Accept: application/json

---

POST /api/v2/mpls/domain-membership/verify HTTP/1.1
Host: netbox.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nb_***REDACTED***

{
  "sites": ["{aSite}", "{zSite}"],
  "requiredDomain": "NNS-SR-DOMAIN-1",
  "labelRange": { "start": {labelStart}, "end": {labelEnd} }
}`,
  logTemplate:
`[2026-03-21T09:50:18Z] INFO  OSS-WF        Order {orderId}: step "verify mpls/sr domain" STARTED
[2026-03-21T09:50:18Z] INFO  OSS-WF        GET NetBox MPLS domains for {aSite} and {zSite}
[2026-03-21T09:50:18Z] DEBUG OSS-WF        {aSite}: domain=NNS-SR-DOMAIN-1 role=PE labels={labelStart}-{labelEnd}
[2026-03-21T09:50:19Z] DEBUG OSS-WF        {zSite}: domain=NNS-SR-DOMAIN-1 role=PE labels={labelStart}-{labelEnd}
[2026-03-21T09:50:19Z] INFO  OSS-WF        Both PEs in same SR domain ✅
[2026-03-21T09:50:19Z] INFO  OSS-WF        Step COMPLETED ✅ | MPLS/SR domain verified`,
};

STEP_PAYLOADS['validate optical path'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/optical/path-validate HTTP/1.1
Host: optplanner.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_opt_***REDACTED***
X-Request-ID: REQ-{orderId}-008
X-Correlation-ID: CORR-{orderId}

{
  "requestId": "{orderId}",
  "aEnd": { "site": "{aSite}", "ampSite": "{aSite}-AMP1" },
  "zEnd": { "site": "{zSite}", "ampSite": "{zSite}-AMP1" },
  "wavelengthCapacity": "{bandwidth}",
  "modulation": "{waveModulation}",
  "fec": "{waveFec}",
  "checkOsnr": true,
  "checkCd": true,
  "checkPmd": true,
  "maxSpanLossDb": 22.0
}`,
  logTemplate:
`[2026-03-21T09:50:21Z] INFO  OSS-WF        Order {orderId}: step "validate optical path" STARTED
[2026-03-21T09:50:21Z] INFO  OPT-PLANNER   Computing optical path {aSite}→{zSite}
[2026-03-21T09:50:21Z] DEBUG OPT-PLANNER   Modulation: {waveModulation} FEC: {waveFec}
[2026-03-21T09:50:22Z] INFO  OPT-PLANNER   OSNR margin: 4.7 dB (min 3.0 dB) ✅
[2026-03-21T09:50:22Z] INFO  OPT-PLANNER   CD: 1240 ps/nm (max 2400 ps/nm) ✅
[2026-03-21T09:50:22Z] INFO  OPT-PLANNER   PMD: 0.8 ps (max 3.0 ps) ✅
[2026-03-21T09:50:22Z] INFO  OSS-WF        Step COMPLETED ✅ | optical path validated`,
};

STEP_PAYLOADS['confirm tech compatibility'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/compatibility/check HTTP/1.1
Host: oss.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-009
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "circuitType": "{circuitType}",
  "bandwidth": "{bandwidth}",
  "aEndDevice": { "site": "{aSite}", "model": "ASR9001", "vendor": "Cisco" },
  "zEndDevice": { "site": "{zSite}", "model": "MX960",   "vendor": "Juniper" },
  "features": ["SR-MPLS", "BGP-LU", "L3VPN", "QoS-DSCP", "BFD", "FRR"],
  "interopMatrix": "NNS-IOP-v2.3"
}`,
  logTemplate:
`[2026-03-21T09:50:24Z] INFO  OSS-WF        Order {orderId}: step "confirm tech compatibility" STARTED
[2026-03-21T09:50:24Z] INFO  OSS-WF        Checking interop matrix NNS-IOP-v2.3
[2026-03-21T09:50:24Z] DEBUG OSS-WF        Cisco ASR9001 ↔ Juniper MX960 — known interop pair
[2026-03-21T09:50:25Z] INFO  OSS-WF        SR-MPLS: compatible ✅ | BGP-LU: compatible ✅
[2026-03-21T09:50:25Z] INFO  OSS-WF        L3VPN: compatible ✅ | QoS: compatible ✅
[2026-03-21T09:50:25Z] INFO  OSS-WF        Step COMPLETED ✅ | tech compatibility confirmed`,
};

STEP_PAYLOADS['check link capacity headroom'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/capacity/headroom HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-010
X-Correlation-ID: CORR-{orderId}

{
  "path": ["{aSite}", "EVR", "{zSite}"],
  "requestedBandwidthMbps": {bwMbps},
  "checkLinks": true,
  "checkNodes": true,
  "utilizationWarnPct": {warnUtil},
  "utilizationCritPct": {critUtil},
  "includeProtectionPath": true
}`,
  logTemplate:
`[2026-03-21T09:50:27Z] INFO  NMS-PROV      Order {orderId}: step "check link capacity headroom" STARTED
[2026-03-21T09:50:27Z] INFO  CAPACITY-MGR  Evaluating {bwMbps} Mbps headroom on path {aSite}→EVR→{zSite}
[2026-03-21T09:50:27Z] DEBUG CAPACITY-MGR  {aSite}→EVR: util=41% after add: 49% — OK ✅
[2026-03-21T09:50:28Z] DEBUG CAPACITY-MGR  EVR→{zSite}: util=37% after add: 45% — OK ✅
[2026-03-21T09:50:28Z] INFO  CAPACITY-MGR  Protection path {aSite}→OLY→{zSite}: headroom OK ✅
[2026-03-21T09:50:28Z] INFO  OSS-WF        Step COMPLETED ✅ | sufficient capacity confirmed`,
};

STEP_PAYLOADS['check fiber span availability'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/fiber/span-check HTTP/1.1
Host: wms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_wms_***REDACTED***
X-Request-ID: REQ-{orderId}-011
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "path": ["{aSite}", "EVR", "{zSite}"],
  "spanType": "SINGLE_MODE_OS2",
  "checkOTDR": true,
  "requiredStrands": 2,
  "protectionStrands": 2,
  "maxSpanLossDb": 22.0
}`,
  logTemplate:
`[2026-03-21T09:50:30Z] INFO  OSS-WF        Order {orderId}: step "check fiber span availability" STARTED
[2026-03-21T09:50:30Z] INFO  WMS           Checking fiber spans on working path {aSite}→EVR→{zSite}
[2026-03-21T09:50:30Z] DEBUG WMS           Span {aSite}→EVR: 48 strands available, loss=4.2 dB ✅
[2026-03-21T09:50:31Z] DEBUG WMS           Span EVR→{zSite}: 48 strands available, loss=5.8 dB ✅
[2026-03-21T09:50:31Z] INFO  WMS           Protection path fibers: available ✅
[2026-03-21T09:50:31Z] INFO  OSS-WF        Step COMPLETED ✅ | fiber spans confirmed available`,
};

STEP_PAYLOADS['verify free router ports'] = {
  payloadLang: 'json',
  payloadTemplate:
`GET /api/v2/dcim/interfaces/?device={aSite}-ASR9001&status=available&type=100gbase-x-qsfp28 HTTP/1.1
Host: netbox.northstarfiber.net
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-012
Accept: application/json

---

GET /api/v2/dcim/interfaces/?device={zSite}-MX960&status=available&type=100gbase-x-qsfp28 HTTP/1.1
Host: netbox.northstarfiber.net
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-012B
Accept: application/json`,
  logTemplate:
`[2026-03-21T09:50:33Z] INFO  OSS-WF        Order {orderId}: step "verify free router ports" STARTED
[2026-03-21T09:50:33Z] INFO  OSS-WF        NetBox query: free 100GE ports on {aSite}-ASR9001
[2026-03-21T09:50:33Z] DEBUG OSS-WF        {aSite}-ASR9001: 4 free 100G QSFP28 ports available ✅
[2026-03-21T09:50:34Z] INFO  OSS-WF        NetBox query: free 100GE ports on {zSite}-MX960
[2026-03-21T09:50:34Z] DEBUG OSS-WF        {zSite}-MX960: 6 free 100G QSFP28 ports available ✅
[2026-03-21T09:50:34Z] INFO  OSS-WF        Step COMPLETED ✅ | router ports available on both PEs`,
};

STEP_PAYLOADS['allocate vlan id'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/ipam/vlans/ HTTP/1.1
Host: netbox.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-013
X-Correlation-ID: CORR-{orderId}

{
  "vid": {vlanId},
  "name": "NNS-{orderId}",
  "status": "active",
  "group": { "name": "NNS-MPLS-VLAN-POOL" },
  "role": { "name": "L3VPN-PE-CE" },
  "description": "Auto-provisioned for order {orderId}",
  "tags": [{ "name": "auto-provisioned" }, { "name": "{circuitType}" }],
  "custom_fields": {
    "order_id": "{orderId}",
    "circuit_type": "{circuitType}",
    "customer_id": "CUST-{custId}"
  }
}`,
  logTemplate:
`[2026-03-21T09:50:36Z] INFO  OSS-WF        Order {orderId}: step "allocate vlan id" STARTED
[2026-03-21T09:50:36Z] INFO  IPAM          POST /api/v2/ipam/vlans/ — allocating VLAN {vlanId}
[2026-03-21T09:50:36Z] DEBUG IPAM          Lock acquired on VLAN pool NNS-MPLS-VLAN-POOL
[2026-03-21T09:50:37Z] INFO  IPAM          VLAN {vlanId} allocated — name: NNS-{orderId}
[2026-03-21T09:50:37Z] INFO  IPAM          VLAN record committed to NetBox ✅
[2026-03-21T09:50:37Z] INFO  OSS-WF        Step COMPLETED ✅ | VLAN {vlanId} reserved`,
};

STEP_PAYLOADS['reserve mpls labels'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/ipam/mpls-labels/reserve HTTP/1.1
Host: netbox.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-014
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "pool": "NNS-SR-LABEL-POOL",
  "range": { "start": {labelStart}, "end": {labelEnd} },
  "type": "SR-MPLS",
  "bindingSid": {bindingSid},
  "description": "SR-TE labels for {orderId}",
  "sites": ["{aSite}", "{zSite}"],
  "expiryPolicy": "ON_CIRCUIT_DELETE"
}`,
  logTemplate:
`[2026-03-21T09:50:39Z] INFO  OSS-WF        Order {orderId}: step "reserve mpls labels" STARTED
[2026-03-21T09:50:39Z] INFO  IPAM          Reserving MPLS label range {labelStart}-{labelEnd}
[2026-03-21T09:50:39Z] DEBUG IPAM          Lock acquired on SR label pool NNS-SR-LABEL-POOL
[2026-03-21T09:50:40Z] INFO  IPAM          Label range {labelStart}-{labelEnd} reserved ✅
[2026-03-21T09:50:40Z] INFO  IPAM          Binding SID {bindingSid} allocated ✅
[2026-03-21T09:50:40Z] INFO  OSS-WF        Step COMPLETED ✅ | MPLS labels reserved`,
};

STEP_PAYLOADS['assign p2p ip pool (/30)'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v2/ipam/prefixes/ HTTP/1.1
Host: netbox.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nb_***REDACTED***
X-Request-ID: REQ-{orderId}-015
X-Correlation-ID: CORR-{orderId}

{
  "prefix": "172.16.{vlanMod}.0/30",
  "vrf": { "name": "{vrfName}" },
  "status": "active",
  "role": { "name": "PE-CE-P2P" },
  "description": "PE-CE P2P for {orderId} A-end",
  "custom_fields": { "order_id": "{orderId}" }
}

---

POST /api/v2/ipam/prefixes/
{
  "prefix": "172.16.{vlanMod}.4/30",
  "vrf": { "name": "{vrfName}" },
  "status": "active",
  "role": { "name": "PE-CE-P2P" },
  "description": "PE-CE P2P for {orderId} Z-end"
}`,
  logTemplate:
`[2026-03-21T09:50:42Z] INFO  OSS-WF        Order {orderId}: step "assign p2p ip pool (/30)" STARTED
[2026-03-21T09:50:42Z] INFO  IPAM          Allocating A-end /30: 172.16.{vlanMod}.0/30
[2026-03-21T09:50:42Z] DEBUG IPAM          CE-A IP={ceAIp} PE-A IP={peAIp} assigned
[2026-03-21T09:50:43Z] INFO  IPAM          Allocating Z-end /30: 172.16.{vlanMod}.4/30
[2026-03-21T09:50:43Z] DEBUG IPAM          CE-Z IP={ceZIp} PE-Z IP={peZIp} assigned
[2026-03-21T09:50:43Z] INFO  OSS-WF        Step COMPLETED ✅ | P2P IP pools assigned`,
};

STEP_PAYLOADS['confirm transceiver stock'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/inventory/check-stock HTTP/1.1
Host: wms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_wms_***REDACTED***
X-Request-ID: REQ-{orderId}-016
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "items": [
    {
      "sku": "XCVR-100G-QSFP28-LR4",
      "quantity": 4,
      "sites": ["{aSite}", "{zSite}"],
      "purpose": "PE-CE links"
    },
    {
      "sku": "XCVR-100G-QSFP28-ER4",
      "quantity": 2,
      "sites": ["{aSite}"],
      "purpose": "Backbone uplinks"
    }
  ],
  "reserveStock": true,
  "expiryHours": 72
}`,
  logTemplate:
`[2026-03-21T09:50:45Z] INFO  OSS-WF        Order {orderId}: step "confirm transceiver stock" STARTED
[2026-03-21T09:50:45Z] INFO  WMS           Stock check: XCVR-100G-QSFP28-LR4 × 4
[2026-03-21T09:50:45Z] DEBUG WMS           {aSite} warehouse: 12 units in stock ✅
[2026-03-21T09:50:46Z] DEBUG WMS           {zSite} warehouse: 8 units in stock ✅
[2026-03-21T09:50:46Z] INFO  WMS           Stock reserved — reservation ID: WMS-RSV-{orderId}
[2026-03-21T09:50:46Z] INFO  OSS-WF        Step COMPLETED ✅ | transceivers reserved`,
};

STEP_PAYLOADS['optical layer assessment'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/optical/layer-assess HTTP/1.1
Host: optplanner.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_opt_***REDACTED***
X-Request-ID: REQ-{orderId}-017
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "path": ["{aSite}", "EVR", "{zSite}"],
  "wavelength": "C-band",
  "channel": "CH-32",
  "modulation": "{waveModulation}",
  "fec": "{waveFec}",
  "targetOsnr": 18.5,
  "maxSpanLossDb": 22.0,
  "assessments": ["OSNR", "CD", "PMD", "NONLINEAR_NOISE", "POWER_MAP"]
}`,
  logTemplate:
`[2026-03-21T09:50:48Z] INFO  OSS-WF        Order {orderId}: step "optical layer assessment" STARTED
[2026-03-21T09:50:48Z] INFO  OPT-CTL       Starting optical layer assessment for {aSite}→{zSite}
[2026-03-21T09:50:48Z] DEBUG OPT-CTL       Modulation: {waveModulation} | FEC: {waveFec}
[2026-03-21T09:50:49Z] INFO  OPT-CTL       OSNR margin: 4.7 dB ✅ | NLI noise: -32.1 dBm ✅
[2026-03-21T09:50:49Z] INFO  OPT-CTL       Power map computed — all spans within Tx/Rx budget
[2026-03-21T09:50:49Z] INFO  OSS-WF        Step COMPLETED ✅ | optical layer assessment passed`,
};

STEP_PAYLOADS['verify lit fiber capacity'] = {
  payloadLang: 'json',
  payloadTemplate:
`GET /api/v1/capacity/lit-fiber?path={aSite},{zSite}&via=EVR HTTP/1.1
Host: nms.northstarfiber.net
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-018
Accept: application/json

---

POST /api/v1/capacity/lit-fiber/reserve HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***

{
  "orderId": "{orderId}",
  "channel": "CH-32",
  "path": ["{aSite}", "EVR", "{zSite}"],
  "bandwidthGbps": {bwG},
  "hold": true
}`,
  logTemplate:
`[2026-03-21T09:50:51Z] INFO  OSS-WF        Order {orderId}: step "verify lit fiber capacity" STARTED
[2026-03-21T09:50:51Z] INFO  CAPACITY-MGR  Querying lit fiber capacity {aSite}→EVR→{zSite}
[2026-03-21T09:50:51Z] DEBUG CAPACITY-MGR  {aSite}→EVR: 32/80 wavelengths used — {bwG}G fits ✅
[2026-03-21T09:50:52Z] DEBUG CAPACITY-MGR  EVR→{zSite}: 28/80 wavelengths used — {bwG}G fits ✅
[2026-03-21T09:50:52Z] INFO  CAPACITY-MGR  Channel CH-32 held for order {orderId}
[2026-03-21T09:50:52Z] INFO  OSS-WF        Step COMPLETED ✅ | lit fiber capacity confirmed`,
};

STEP_PAYLOADS['compute shortest a-z path'] = {
  payloadLang: 'json',
  payloadTemplate:
`{
  "type": "gNMI-SetRequest",
  "prefix": { "target": "{aSite}-XTC", "origin": "openconfig" },
  "update": [{
    "path": "sr-te/path-computations/path-computation[id=PC-{orderId}]",
    "val": {
      "id": "PC-{orderId}",
      "source": "{peALoop}",
      "destination": "{peZLoop}",
      "constraints": {
        "metric-type": "IGP",
        "optimization": "MIN_COST",
        "bandwidth-mbps": {bwMbps}
      },
      "algorithm": "CSPF",
      "disjoint-path": false
    }
  }]
}`,
  logTemplate:
`[2026-03-21T09:50:54Z] INFO  OSS-WF        Order {orderId}: step "compute shortest a-z path" STARTED
[2026-03-21T09:50:54Z] INFO  SR-CTL        gNMI SetRequest → {aSite}-XTC: path computation PC-{orderId}
[2026-03-21T09:50:54Z] DEBUG SR-CTL        CSPF algorithm: source={peALoop} dest={peZLoop}
[2026-03-21T09:50:55Z] INFO  SR-CTL        Shortest path: {aSite}→EVR→{zSite} (3 hops, 12.4ms)
[2026-03-21T09:50:55Z] INFO  SR-CTL        SID stack: [16001, 16003, 16005] computed
[2026-03-21T09:50:55Z] INFO  OSS-WF        Step COMPLETED ✅ | shortest A-Z path computed`,
};

STEP_PAYLOADS['apply srlg diversity'] = {
  payloadLang: 'json',
  payloadTemplate:
`{
  "type": "gNMI-SetRequest",
  "prefix": { "target": "{aSite}-XTC", "origin": "openconfig" },
  "update": [{
    "path": "sr-te/path-computations/path-computation[id=PC-{orderId}-PROT]",
    "val": {
      "id": "PC-{orderId}-PROT",
      "source": "{peALoop}",
      "destination": "{peZLoop}",
      "constraints": {
        "metric-type": "IGP",
        "optimization": "MIN_COST",
        "bandwidth-mbps": {bwMbps},
        "srlg-disjoint-from": "PC-{orderId}",
        "srlg-groups": ["SRLG-NW-CORRIDOR-1", "SRLG-NW-CORRIDOR-2"]
      },
      "algorithm": "CSPF-SRLG",
      "disjoint-path": true
    }
  }]
}`,
  logTemplate:
`[2026-03-21T09:50:57Z] INFO  OSS-WF        Order {orderId}: step "apply srlg diversity" STARTED
[2026-03-21T09:50:57Z] INFO  SR-CTL        Computing SRLG-diverse protection path for {orderId}
[2026-03-21T09:50:57Z] DEBUG SR-CTL        Working path uses SRLG-NW-CORRIDOR-1 — excluding
[2026-03-21T09:50:58Z] INFO  SR-CTL        Protection path: {aSite}→OLY→{zSite} (SRLG-diverse) ✅
[2026-03-21T09:50:58Z] INFO  SR-CTL        SRLG diversity constraint satisfied
[2026-03-21T09:50:58Z] INFO  OSS-WF        Step COMPLETED ✅ | SRLG diversity applied`,
};

STEP_PAYLOADS['enforce latency constraint'] = {
  payloadLang: 'json',
  payloadTemplate:
`{
  "type": "gNMI-SetRequest",
  "prefix": { "target": "{aSite}-XTC", "origin": "openconfig" },
  "update": [{
    "path": "sr-te/path-computations/path-computation[id=PC-{orderId}]/constraints/delay",
    "val": {
      "max-delay-microseconds": {latencyTarget}000,
      "optimization": "MIN_DELAY",
      "include-delay-measurement": true,
      "measurement-protocol": "TWAMP-LIGHT"
    }
  }]
}`,
  logTemplate:
`[2026-03-21T09:51:00Z] INFO  OSS-WF        Order {orderId}: step "enforce latency constraint" STARTED
[2026-03-21T09:51:00Z] INFO  SR-CTL        Applying latency constraint: max {latencyTarget}ms
[2026-03-21T09:51:00Z] DEBUG SR-CTL        Path {aSite}→EVR→{zSite}: measured latency 8.2ms ✅
[2026-03-21T09:51:01Z] INFO  SR-CTL        Latency constraint satisfied (8.2ms < {latencyTarget}ms) ✅
[2026-03-21T09:51:01Z] INFO  SR-CTL        TWAMP-Light measurements anchored on working path
[2026-03-21T09:51:01Z] INFO  OSS-WF        Step COMPLETED ✅ | latency constraint enforced`,
};

STEP_PAYLOADS['program sr-te policy'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="120" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- Cisco IOS-XR SR-TE Policy YANG model -->
      <segment-routing xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-infra-xtc-oper">
        <traffic-engineering>
          <policies>
            <policy>
              <policy-name>SRP-{orderId}</policy-name>
              <binding-sid>{bindingSid}</binding-sid>
              <color>{srColor}</color>
              <end-point>{peZLoop}</end-point>
              <candidate-paths>
                <preference>200</preference>
                <explicit>
                  <path-name>PC-{orderId}</path-name>
                  <sid-list>{labelStart} {labelEnd}</sid-list>
                </explicit>
              </candidate-paths>
              <autoroute>
                <metric-type>relative</metric-type>
                <metric-value>-1</metric-value>
              </autoroute>
            </policy>
          </policies>
        </traffic-engineering>
      </segment-routing>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:03Z] INFO  OSS-WF        Order {orderId}: step "program sr-te policy" STARTED
[2026-03-21T09:51:03Z] INFO  NETCONF-MGR   Session 55 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:03Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=120 sent (648 bytes)
[2026-03-21T09:51:04Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:04Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%MPLS_TE-5-SR_POLICY_UP: SRP-{orderId} state=UP
[2026-03-21T09:51:04Z] INFO  SR-CTL        SR-TE policy SRP-{orderId} binding-sid={bindingSid} active ✅
[2026-03-21T09:51:04Z] INFO  OSS-WF        Step COMPLETED ✅ | SR-TE policy programmed`,
};

STEP_PAYLOADS['enable fast reroute'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="121" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- IOS-XR TI-LFA FRR configuration -->
      <isis xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-clns-isis-cfg">
        <instances>
          <instance>
            <instance-name>NNS-CORE</instance-name>
            <afs>
              <af>
                <af-name>ipv4</af-name>
                <topology-name>unicast</topology-name>
                <frr>
                  <per-link>
                    <frr-types>
                      <frr-type>
                        <frrlevel>level1and2</frrlevel>
                        <type>remote-lfa</type>
                      </frr-type>
                    </frr-types>
                    <ti-lfa>
                      <enable/>
                      <srlg-protection>enable</srlg-protection>
                    </ti-lfa>
                  </per-link>
                </frr>
              </af>
            </afs>
          </instance>
        </instances>
      </isis>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:06Z] INFO  OSS-WF        Order {orderId}: step "enable fast reroute" STARTED
[2026-03-21T09:51:06Z] INFO  NETCONF-MGR   Session 56 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:06Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=121 sent (712 bytes)
[2026-03-21T09:51:07Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:07Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%ISIS-5-TI_LFA_ACTIVE: TI-LFA FRR enabled on NNS-CORE
[2026-03-21T09:51:07Z] INFO  OSS-WF        FRR convergence time target: <50ms
[2026-03-21T09:51:07Z] INFO  OSS-WF        Step COMPLETED ✅ | TI-LFA FRR enabled`,
};

STEP_PAYLOADS['create vrf instance'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="110" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- Cisco IOS-XR VRF YANG model -->
      <vrfs xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-infra-rsi-cfg">
        <vrf>
          <vrf-name>{vrfName}</vrf-name>
          <description>NorthStar Fiber — Order {orderId}</description>
          <afs>
            <af>
              <af-name>ipv4</af-name>
              <saf-name>unicast</saf-name>
              <route-distinguisher>
                <type>as</type>
                <as>{asn}</as>
                <as-index>{rdValue}</as-index>
              </route-distinguisher>
              <route-targets>
                <route-target>
                  <type>import</type>
                  <as-or-four-byte-as>
                    <as>{asn}</as>
                    <as-index>{rdValue}</as-index>
                  </as-or-four-byte-as>
                </route-target>
                <route-target>
                  <type>export</type>
                  <as-or-four-byte-as>
                    <as>{asn}</as>
                    <as-index>{rdValue}</as-index>
                  </as-or-four-byte-as>
                </route-target>
              </route-targets>
            </af>
          </afs>
        </vrf>
      </vrfs>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:09Z] INFO  OSS-WF        Order {orderId}: step "create vrf instance" STARTED
[2026-03-21T09:51:09Z] INFO  CHANGE-MGR    CHG-2026-0042 opened | risk: LOW | window: immediate
[2026-03-21T09:51:09Z] INFO  NETCONF-MGR   Session 47 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:09Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=110 sent (412 bytes)
[2026-03-21T09:51:10Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:10Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%VRF-6-VRF_UP: VRF {vrfName} created, RD {asn}:{rdValue}
[2026-03-21T09:51:10Z] INFO  NETCONF-MGR   Session 48 opened → {zSite}-MX960 (10.0.0.31:830)
[2026-03-21T09:51:11Z] DEBUG NETCONF-MGR   JunOS commit confirmed on {zSite}-MX960
[2026-03-21T09:51:11Z] INFO  NMS-POLL      VRF {vrfName} discovered on both PEs ✅
[2026-03-21T09:51:11Z] INFO  OSS-WF        Step COMPLETED ✅ | CHG-2026-0042 closed`,
};

STEP_PAYLOADS['configure pe-ce bgp'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="112" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- Cisco IOS-XR BGP VRF neighbor YANG -->
      <bgp xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-ipv4-bgp-cfg">
        <instance>
          <instance-name>default</instance-name>
          <instance-as>
            <as>{asn}</as>
            <four-byte-as>
              <as>{asn}</as>
              <bgp-running/>
              <vrfs>
                <vrf>
                  <vrf-name>{vrfName}</vrf-name>
                  <vrf-neighbors>
                    <vrf-neighbor>
                      <neighbor-address>{ceAIp}</neighbor-address>
                      <remote-as>{ceBgpAsn}</remote-as>
                      <description>CE-A {orderId}</description>
                      <timers>
                        <keepalive>10</keepalive>
                        <hold-time>30</hold-time>
                      </timers>
                      <bfd/>
                    </vrf-neighbor>
                  </vrf-neighbors>
                </vrf>
              </vrfs>
            </four-byte-as>
          </instance-as>
        </instance>
      </bgp>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:12Z] INFO  OSS-WF        Order {orderId}: step "configure pe-ce bgp" STARTED
[2026-03-21T09:51:12Z] INFO  NETCONF-MGR   Session 49 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:12Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=112 sent (580 bytes)
[2026-03-21T09:51:13Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:13Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%BGP-5-ADJCHANGE: neighbor {ceAIp} Up (VRF {vrfName})
[2026-03-21T09:51:13Z] INFO  BGP-MON       BGP session {peAIp} ↔ {ceAIp} state=ESTABLISHED ✅
[2026-03-21T09:51:14Z] INFO  NETCONF-MGR   Session 50 opened → {zSite}-MX960
[2026-03-21T09:51:14Z] INFO  SYSLOG-FWD    {zSite}-MX960: BGP neighbor {ceZIp} is now Active (instance {vrfName})
[2026-03-21T09:51:14Z] INFO  OSS-WF        Step COMPLETED ✅ | PE-CE BGP sessions UP`,
};

STEP_PAYLOADS['enable mpls forwarding'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="115" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- IOS-XR MPLS VRF forwarding configuration -->
      <mpls-ldp xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-mpls-ldp-cfg">
        <global>
          <enable-logging>
            <neighbor-changes/>
          </enable-logging>
        </global>
        <vrfs>
          <vrf>
            <vrf-name>{vrfName}</vrf-name>
            <af>
              <af-name>ipv4</af-name>
              <enable/>
              <label>
                <local>
                  <advertise>
                    <prefix-acl>all</prefix-acl>
                  </advertise>
                </local>
              </label>
            </af>
          </vrf>
        </vrfs>
      </mpls-ldp>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:15Z] INFO  OSS-WF        Order {orderId}: step "enable mpls forwarding" STARTED
[2026-03-21T09:51:15Z] INFO  NETCONF-MGR   Session 51 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:15Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=115 sent (492 bytes)
[2026-03-21T09:51:16Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:16Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%MPLS_LIB-5-LABEL_RANGE: VRF {vrfName} labels {labelStart}-{labelEnd}
[2026-03-21T09:51:16Z] INFO  OSS-WF        MPLS forwarding active on {vrfName} ✅
[2026-03-21T09:51:16Z] INFO  OSS-WF        Step COMPLETED ✅ | MPLS forwarding enabled`,
};

STEP_PAYLOADS['apply traffic policy'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="116" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- IOS-XR Policy-map / QoS YANG -->
      <policy-manager xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-qos-ma-cfg">
        <global>
          <policy-maps>
            <policy-map>
              <name>PM-{orderId}</name>
              <description>QoS policy for {orderId} SLA={slaTier}</description>
              <classes>
                <class>
                  <name>VOICE-EF</name>
                  <priority>level1</priority>
                  <police>
                    <rate>{bwMbps}000 bps</rate>
                  </police>
                </class>
                <class>
                  <name>DEFAULT-BE</name>
                  <bandwidth>remaining percent 10</bandwidth>
                </class>
              </classes>
            </policy-map>
          </policy-maps>
        </global>
      </policy-manager>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:18Z] INFO  OSS-WF        Order {orderId}: step "apply traffic policy" STARTED
[2026-03-21T09:51:18Z] INFO  NETCONF-MGR   Session 52 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:18Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=116 sent (544 bytes)
[2026-03-21T09:51:19Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:19Z] INFO  SYSLOG-FWD    {aSite}-ASR9001: %%QOS-6-POLICY_APPLIED: PM-{orderId} applied on VRF {vrfName}
[2026-03-21T09:51:19Z] INFO  OSS-WF        QoS policy PM-{orderId} active | SLA tier: {slaTier} ✅
[2026-03-21T09:51:19Z] INFO  OSS-WF        Step COMPLETED ✅ | traffic policy applied`,
};

STEP_PAYLOADS['set bgp communities'] = {
  payloadLang: 'xml',
  payloadTemplate:
`<!-- NETCONF RPC — sent to {aSite}-ASR9001 via SSH port 830 -->
<?xml version="1.0" encoding="UTF-8"?>
<rpc message-id="117" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">
  <edit-config>
    <target><running/></target>
    <config>
      <!-- IOS-XR Routing Policy YANG -->
      <routing-policy xmlns="http://cisco.com/ns/yang/Cisco-IOS-XR-policy-repository-cfg">
        <route-policies>
          <route-policy>
            <route-policy-name>RPL-COMM-{orderId}</route-policy-name>
            <rpl-policy>
              set community ({asn}:{rdValue}, {asn}:1001, {asn}:9999) additive
              set local-preference 100
              pass
            </rpl-policy>
          </route-policy>
        </route-policies>
      </routing-policy>
    </config>
  </edit-config>
</rpc>`,
  logTemplate:
`[2026-03-21T09:51:21Z] INFO  OSS-WF        Order {orderId}: step "set bgp communities" STARTED
[2026-03-21T09:51:21Z] INFO  NETCONF-MGR   Session 53 opened → {aSite}-ASR9001 (10.0.0.11:830)
[2026-03-21T09:51:21Z] DEBUG NETCONF-MGR   edit-config RPC msg-id=117 sent (462 bytes)
[2026-03-21T09:51:22Z] INFO  NETCONF-MGR   <rpc-reply> status=OK from {aSite}-ASR9001
[2026-03-21T09:51:22Z] INFO  BGP-MON       Communities {asn}:{rdValue} set on VRF {vrfName} ✅
[2026-03-21T09:51:22Z] INFO  BGP-MON       Route policy RPL-COMM-{orderId} attached to neighbor {ceAIp}
[2026-03-21T09:51:22Z] INFO  OSS-WF        Step COMPLETED ✅ | BGP communities applied`,
};

STEP_PAYLOADS['optical power verification'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/optical/power-verify HTTP/1.1
Host: optplanner.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_opt_***REDACTED***
X-Request-ID: REQ-{orderId}-029
X-Correlation-ID: CORR-{orderId}

{
  "orderId": "{orderId}",
  "channel": "CH-32",
  "path": ["{aSite}", "EVR", "{zSite}"],
  "measurements": [
    { "node": "{aSite}-ROADM", "direction": "TX", "targetPowerDbm": 0.0 },
    { "node": "EVR-ROADM",    "direction": "RX", "minPowerDbm": -14.0 },
    { "node": "EVR-ROADM",    "direction": "TX", "targetPowerDbm": 0.0 },
    { "node": "{zSite}-ROADM","direction": "RX", "minPowerDbm": -14.0 }
  ],
  "acceptOsnrMinDb": 18.0
}`,
  logTemplate:
`[2026-03-21T09:51:24Z] INFO  OSS-WF        Order {orderId}: step "optical power verification" STARTED
[2026-03-21T09:51:24Z] INFO  OPT-CTL       Initiating live power verification on CH-32
[2026-03-21T09:51:24Z] DEBUG OPT-CTL       {aSite}-ROADM TX: +0.1 dBm ✅
[2026-03-21T09:51:25Z] DEBUG OPT-CTL       EVR-ROADM RX: -12.4 dBm ✅ | TX: +0.2 dBm ✅
[2026-03-21T09:51:25Z] DEBUG OPT-CTL       {zSite}-ROADM RX: -13.1 dBm ✅
[2026-03-21T09:51:25Z] INFO  OPT-CTL       OSNR: 19.8 dB (min 18.0 dB) ✅
[2026-03-21T09:51:25Z] INFO  OSS-WF        Step COMPLETED ✅ | optical power verified`,
};

STEP_PAYLOADS['rfc 2544 throughput test'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/test-sessions HTTP/1.1
Host: testeng.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_te_***REDACTED***
X-Request-ID: REQ-{orderId}-030
X-Correlation-ID: CORR-{orderId}

{
  "testType": "RFC2544",
  "circuitId": "{orderId}",
  "instrument": "SPIRENT-SPT-N11U",
  "portA": "{aSite}-TEST-PORT-1",
  "portZ": "{zSite}-TEST-PORT-1",
  "config": {
    "cir": {bwMbps},
    "frameSizes": [64, 128, 256, 512, 1024, 1280, 1518],
    "durationSec": 60,
    "lossRateThresholdPct": 0.001,
    "latencyMeasurement": true,
    "backToBackFrames": true
  }
}`,
  logTemplate:
`[2026-03-21T09:51:27Z] INFO  OSS-WF        Order {orderId}: step "rfc 2544 throughput test" STARTED
[2026-03-21T09:51:27Z] INFO  TEST-ENG      RFC 2544 session initiated: SPIRENT-SPT-N11U
[2026-03-21T09:51:27Z] INFO  TEST-ENG      Testing CIR={bwMbps} Mbps across 7 frame sizes
[2026-03-21T09:51:28Z] INFO  TEST-ENG      64-byte: throughput={bwMbps} Mbps loss=0.000% ✅
[2026-03-21T09:51:28Z] INFO  TEST-ENG      1518-byte: throughput={bwMbps} Mbps loss=0.000% ✅
[2026-03-21T09:51:29Z] INFO  TEST-ENG      All frame sizes PASSED — zero packet loss ✅
[2026-03-21T09:51:29Z] INFO  OSS-WF        Step COMPLETED ✅ | RFC 2544 throughput test passed`,
};

STEP_PAYLOADS['y.1564 service activation'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/test-sessions HTTP/1.1
Host: testeng.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_te_***REDACTED***
X-Request-ID: REQ-{orderId}-031
X-Correlation-ID: CORR-{orderId}

{
  "testType": "Y1564",
  "circuitId": "{orderId}",
  "instrument": "VIAVI-ONX-580",
  "portA": "{aSite}-TEST-PORT-2",
  "portZ": "{zSite}-TEST-PORT-2",
  "config": {
    "evc": "{orderId}",
    "cir": {bwMbps},
    "eir": 0,
    "cbs": 262144,
    "ebs": 0,
    "colorMode": "DEI",
    "slaValidation": {
      "maxLatencyMs": {latencyTarget},
      "maxJitterMs": {jitterTarget},
      "maxLossPct": 0.001
    },
    "performanceDurationMin": 15
  }
}`,
  logTemplate:
`[2026-03-21T09:51:30Z] INFO  OSS-WF        Order {orderId}: step "y.1564 service activation" STARTED
[2026-03-21T09:51:30Z] INFO  TEST-ENG      Y.1564 SAT initiated: VIAVI-ONX-580
[2026-03-21T09:51:30Z] INFO  TEST-ENG      EVC {orderId} | CIR={bwMbps} Mbps | duration=15min
[2026-03-21T09:51:31Z] INFO  TEST-ENG      Configuration test: CIR traffic — loss=0.000% ✅
[2026-03-21T09:51:31Z] INFO  TEST-ENG      Performance test: 15-min sustained — SLA met ✅
[2026-03-21T09:51:32Z] INFO  TEST-ENG      Y.1564 PASSED — service activated ✅
[2026-03-21T09:51:32Z] INFO  OSS-WF        Step COMPLETED ✅ | Y.1564 service activation test passed`,
};

STEP_PAYLOADS['latency measurement'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/test-sessions HTTP/1.1
Host: testeng.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_te_***REDACTED***
X-Request-ID: REQ-{orderId}-032
X-Correlation-ID: CORR-{orderId}

{
  "testType": "TWAMP",
  "circuitId": "{orderId}",
  "portA": "{aSite}-TEST-PORT-1",
  "portZ": "{zSite}-TEST-PORT-1",
  "config": {
    "protocol": "TWAMP-LIGHT",
    "packetCount": 1000,
    "packetRatePps": 100,
    "packetSizeBytes": 128,
    "dscp": "EF",
    "maxRttMs": {latencyTarget},
    "reportOwd": true
  }
}`,
  logTemplate:
`[2026-03-21T09:51:33Z] INFO  OSS-WF        Order {orderId}: step "latency measurement" STARTED
[2026-03-21T09:51:33Z] INFO  TEST-ENG      TWAMP-Light session: {aSite} → {zSite}
[2026-03-21T09:51:33Z] DEBUG TEST-ENG      1000 probes @ DSCP-EF (128-byte frames)
[2026-03-21T09:51:34Z] INFO  TEST-ENG      RTT: min=8.1ms avg=8.4ms max=9.2ms ✅
[2026-03-21T09:51:34Z] INFO  TEST-ENG      OWD A→Z: 4.2ms | OWD Z→A: 4.2ms (threshold {latencyTarget}ms) ✅
[2026-03-21T09:51:34Z] INFO  OSS-WF        Step COMPLETED ✅ | latency within SLA threshold`,
};

STEP_PAYLOADS['jitter / pdv measurement'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/test-sessions HTTP/1.1
Host: testeng.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_te_***REDACTED***
X-Request-ID: REQ-{orderId}-033
X-Correlation-ID: CORR-{orderId}

{
  "testType": "JITTER_PDV",
  "circuitId": "{orderId}",
  "portA": "{aSite}-TEST-PORT-1",
  "portZ": "{zSite}-TEST-PORT-1",
  "config": {
    "protocol": "TWAMP-LIGHT",
    "packetCount": 10000,
    "packetRatePps": 1000,
    "packetSizeBytes": 128,
    "dscp": "EF",
    "maxJitterMs": {jitterTarget},
    "ipdvPercentile": 99.9
  }
}`,
  logTemplate:
`[2026-03-21T09:51:36Z] INFO  OSS-WF        Order {orderId}: step "jitter / pdv measurement" STARTED
[2026-03-21T09:51:36Z] INFO  TEST-ENG      PDV measurement: 10000 probes @ 1000 pps
[2026-03-21T09:51:36Z] DEBUG TEST-ENG      IPDV 99.9th-pctl: 0.38ms (threshold {jitterTarget}ms) ✅
[2026-03-21T09:51:37Z] INFO  TEST-ENG      Jitter (RFC 3550): 0.12ms peak ✅
[2026-03-21T09:51:37Z] INFO  TEST-ENG      All PDV measurements within SLA bounds ✅
[2026-03-21T09:51:37Z] INFO  OSS-WF        Step COMPLETED ✅ | jitter/PDV within SLA threshold`,
};

STEP_PAYLOADS['packet loss verification'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/test-sessions HTTP/1.1
Host: testeng.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_te_***REDACTED***
X-Request-ID: REQ-{orderId}-034
X-Correlation-ID: CORR-{orderId}

{
  "testType": "PACKET_LOSS",
  "circuitId": "{orderId}",
  "portA": "{aSite}-TEST-PORT-1",
  "portZ": "{zSite}-TEST-PORT-1",
  "config": {
    "protocol": "UDP",
    "packetCount": 1000000,
    "rateMbps": {bwMbps},
    "frameSizes": [64, 512, 1518],
    "dscp": "EF",
    "maxLossPct": 0.001,
    "biDirectional": true
  }
}`,
  logTemplate:
`[2026-03-21T09:51:39Z] INFO  OSS-WF        Order {orderId}: step "packet loss verification" STARTED
[2026-03-21T09:51:39Z] INFO  TEST-ENG      Packet loss test: 1M packets @ {bwMbps} Mbps bi-directional
[2026-03-21T09:51:39Z] DEBUG TEST-ENG      A→Z: sent=1000000 rcvd=1000000 loss=0.000% ✅
[2026-03-21T09:51:40Z] DEBUG TEST-ENG      Z→A: sent=1000000 rcvd=1000000 loss=0.000% ✅
[2026-03-21T09:51:40Z] INFO  TEST-ENG      Zero packet loss confirmed on all frame sizes ✅
[2026-03-21T09:51:40Z] INFO  OSS-WF        Step COMPLETED ✅ | packet loss 0.000% (SLA: <0.001%)`,
};

STEP_PAYLOADS['configure snmp monitoring'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/monitoring/snmp-profiles HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-035
X-Correlation-ID: CORR-{orderId}

{
  "circuitId": "{orderId}",
  "snmpVersion": "v3",
  "targets": [
    { "host": "{aSite}-ASR9001", "community": "NNS-READONLY", "port": 161 },
    { "host": "{zSite}-MX960",   "community": "NNS-READONLY", "port": 161 }
  ],
  "oids": [
    "ifInOctets", "ifOutOctets", "ifInErrors", "ifOutErrors",
    "ifOperStatus", "mplsVpnVrfRoutingTableName",
    "bgpPeerState", "cbQosPolicyIndex"
  ],
  "pollingIntervalSec": 60,
  "trapDestination": "{nmsIp}",
  "trapCommunity": "NNS-TRAP-RECV"
}`,
  logTemplate:
`[2026-03-21T09:51:42Z] INFO  OSS-WF        Order {orderId}: step "configure snmp monitoring" STARTED
[2026-03-21T09:51:42Z] INFO  NMS-PROV      Creating SNMP profile for circuit {orderId}
[2026-03-21T09:51:42Z] DEBUG NMS-PROV      SNMP v3 target: {aSite}-ASR9001:161
[2026-03-21T09:51:43Z] INFO  NMS-PROV      SNMP v3 target: {zSite}-MX960:161
[2026-03-21T09:51:43Z] INFO  NMS-PROV      Trap receiver configured: {nmsIp} ✅
[2026-03-21T09:51:43Z] INFO  NMS-PROV      Polling interval: 60s | OIDs: 8 ✅
[2026-03-21T09:51:43Z] INFO  OSS-WF        Step COMPLETED ✅ | SNMP monitoring active`,
};

STEP_PAYLOADS['enable streaming telemetry'] = {
  payloadLang: 'json',
  payloadTemplate:
`{
  "type": "gNMI-SubscribeRequest",
  "prefix": { "target": "{aSite}-ASR9001", "origin": "openconfig" },
  "subscribe": {
    "subscription": [
      {
        "path": "interfaces/interface[name=*]/state/counters",
        "mode": "SAMPLE",
        "sample_interval": 30000000000
      },
      {
        "path": "network-instances/network-instance[name={vrfName}]/afts",
        "mode": "ON_CHANGE"
      },
      {
        "path": "qos/interfaces/interface[interface-id=*]/output/queues/queue/state",
        "mode": "SAMPLE",
        "sample_interval": 10000000000
      }
    ],
    "mode": "STREAM",
    "encoding": "PROTO"
  },
  "destination": { "address": "{collectorIp}", "port": 57400 }
}`,
  logTemplate:
`[2026-03-21T09:51:45Z] INFO  OSS-WF        Order {orderId}: step "enable streaming telemetry" STARTED
[2026-03-21T09:51:45Z] INFO  TELEMETRY     gNMI SubscribeRequest → {aSite}-ASR9001:57400
[2026-03-21T09:51:45Z] DEBUG TELEMETRY     Subscriptions: interfaces (30s), VRF AFT (on-change), QoS (10s)
[2026-03-21T09:51:46Z] INFO  TELEMETRY     gNMI stream established: session-id=TLM-{orderId}-A ✅
[2026-03-21T09:51:46Z] INFO  TELEMETRY     gNMI stream established: session-id=TLM-{orderId}-Z ✅
[2026-03-21T09:51:46Z] INFO  TELEMETRY     Data flowing to collector {collectorIp}:57400 ✅
[2026-03-21T09:51:46Z] INFO  OSS-WF        Step COMPLETED ✅ | streaming telemetry enabled`,
};

STEP_PAYLOADS['set utilization thresholds'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/monitoring/thresholds HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-037
X-Correlation-ID: CORR-{orderId}

{
  "circuitId": "{orderId}",
  "thresholds": [
    {
      "metric": "ifInOctets",
      "warnPct": {warnUtil},
      "critPct": {critUtil},
      "evalWindowSec": 300,
      "action": "ALERT_NOC"
    },
    {
      "metric": "ifOutOctets",
      "warnPct": {warnUtil},
      "critPct": {critUtil},
      "evalWindowSec": 300,
      "action": "ALERT_NOC"
    }
  ],
  "notificationGroup": "NOC-MPLS-TIER1",
  "escalationMinutes": 15
}`,
  logTemplate:
`[2026-03-21T09:51:48Z] INFO  OSS-WF        Order {orderId}: step "set utilization thresholds" STARTED
[2026-03-21T09:51:48Z] INFO  NMS-PROV      Posting threshold profiles for circuit {orderId}
[2026-03-21T09:51:48Z] DEBUG NMS-PROV      WARN @ {warnUtil}% | CRIT @ {critUtil}% | window=5min
[2026-03-21T09:51:49Z] INFO  NMS-PROV      Thresholds applied to {aSite}-ASR9001 interface ✅
[2026-03-21T09:51:49Z] INFO  NMS-PROV      Thresholds applied to {zSite}-MX960 interface ✅
[2026-03-21T09:51:49Z] INFO  OSS-WF        Step COMPLETED ✅ | utilization thresholds active`,
};

STEP_PAYLOADS['configure los/lof alarms'] = {
  payloadLang: 'json',
  payloadTemplate:
`POST /api/v1/alarms/circuit-bindings HTTP/1.1
Host: nms.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_nms_***REDACTED***
X-Request-ID: REQ-{orderId}-038
X-Correlation-ID: CORR-{orderId}

{
  "circuitId": "{orderId}",
  "alarmBindings": [
    {
      "alarmType": "LOS",
      "severity": "CRITICAL",
      "soak": "0s",
      "notify": ["NOC-EMAIL", "PAGERDUTY-P1"],
      "autoTicket": true,
      "queue": "TIER-1-MPLS"
    },
    {
      "alarmType": "LOF",
      "severity": "CRITICAL",
      "soak": "0s",
      "notify": ["NOC-EMAIL", "PAGERDUTY-P1"],
      "autoTicket": true
    },
    {
      "alarmType": "HIGH-BER",
      "severity": "MAJOR",
      "threshold": "1e-6",
      "notify": ["NOC-EMAIL"]
    },
    {
      "alarmType": "LINK-FLAP",
      "severity": "MINOR",
      "threshold": 3,
      "window": "5m"
    }
  ]
}`,
  logTemplate:
`[2026-03-21T09:51:51Z] INFO  OSS-WF        Order {orderId}: step "configure los/lof alarms" STARTED
[2026-03-21T09:51:51Z] INFO  ALARM-MGR     Binding alarm profiles to circuit {orderId}
[2026-03-21T09:51:51Z] DEBUG ALARM-MGR     LOS → CRITICAL | PagerDuty-P1 | auto-ticket ✅
[2026-03-21T09:51:52Z] DEBUG ALARM-MGR     LOF → CRITICAL | PagerDuty-P1 | auto-ticket ✅
[2026-03-21T09:51:52Z] DEBUG ALARM-MGR     HIGH-BER → MAJOR | NOC-EMAIL ✅
[2026-03-21T09:51:52Z] DEBUG ALARM-MGR     LINK-FLAP → MINOR (3 flaps/5min) ✅
[2026-03-21T09:51:52Z] INFO  OSS-WF        Step COMPLETED ✅ | alarm bindings active`,
};

STEP_PAYLOADS['create circuit record'] = {
  payloadLang: 'json',
  payloadTemplate:
`PATCH /api/v2/service-orders/{orderId} HTTP/1.1
Host: oss.northstarfiber.net
Content-Type: application/json
Authorization: Token nns_api_***REDACTED***
X-Request-ID: REQ-{orderId}-039
X-Correlation-ID: CORR-{orderId}

{
  "status": "IN-SERVICE",
  "activationDate": "2026-03-21T09:51:54Z",
  "circuit": {
    "id": "{orderId}",
    "type": "{circuitType}",
    "bandwidth": "{bandwidth}",
    "slaTier": "{slaTier}",
    "aEnd": {
      "site": "{aSite}",
      "device": "{aSite}-ASR9001",
      "ip": "{ceAIp}",
      "vlan": {vlanId}
    },
    "zEnd": {
      "site": "{zSite}",
      "device": "{zSite}-MX960",
      "ip": "{ceZIp}",
      "vlan": {vlanId}
    }
  },
  "provisioned": {
    "vrf": "{vrfName}",
    "rd": "{asn}:{rdValue}",
    "mplsLabelRange": "{labelStart}-{labelEnd}",
    "srBindingSid": {bindingSid},
    "srColor": {srColor},
    "workingPath": "{aSite}→EVR→{zSite}",
    "protectionPath": "{aSite}→OLY→{zSite}"
  }
}`,
  logTemplate:
`[2026-03-21T09:51:54Z] INFO  OSS-WF        Order {orderId}: step "create circuit record" STARTED
[2026-03-21T09:51:54Z] INFO  OSS-WF        PATCH /api/v2/service-orders/{orderId} → HTTP 200
[2026-03-21T09:51:54Z] INFO  OSS-WF        Circuit {orderId} status: IN-SERVICE ✅
[2026-03-21T09:51:55Z] INFO  OSS-WF        NetBox circuit record created: CID-{orderId}
[2026-03-21T09:51:55Z] INFO  OSS-WF        NMS service record synced ✅
[2026-03-21T09:51:55Z] INFO  OSS-WF        Customer notification: {orderId} is IN-SERVICE
[2026-03-21T09:51:55Z] INFO  OSS-WF        Workflow WF-{orderId} — ALL STEPS COMPLETED ✅
[2026-03-21T09:51:55Z] INFO  OSS-WF        Circuit {orderId} provisioning COMPLETE ✅`,
};

// ── Aliases ───────────────────────────────────────────────────────────────────
STEP_PAYLOADS['check fiber availability'] = STEP_PAYLOADS['check fiber span availability'];
STEP_PAYLOADS['allocate vlan']            = STEP_PAYLOADS['allocate vlan id'];
STEP_PAYLOADS['configure bgp']            = STEP_PAYLOADS['configure pe-ce bgp'];
STEP_PAYLOADS['rfc 2544']                 = STEP_PAYLOADS['rfc 2544 throughput test'];

// ── Public API ────────────────────────────────────────────────────────────────
export function getStepPayload(step, form, plan) {
  if (!step || !step.action) return null;
  const key = step.action.toLowerCase().trim();
  const def = STEP_PAYLOADS[key];
  if (!def) return null;
  const ctx = buildPayloadCtx(form, plan);
  return {
    payload:     fill(def.payloadTemplate, ctx),
    payloadLang: def.payloadLang,
    log:         fill(def.logTemplate, ctx),
  };
}
