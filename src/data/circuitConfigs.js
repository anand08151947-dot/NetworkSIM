// Circuit device config generators — vendor-accurate CLI/API configs
// per device, per circuit type, using real form parameters.

function buildCtx(form, plan) {
  const seed = plan?.orderId ? plan.orderId.replace('NFS-', '') : 'AABBCC';
  const seedNum = parseInt(seed, 16) || 12345;
  const vlanId = 1000 + (seedNum % 3000);
  const vcId = 10000 + (seedNum % 50000);
  const asn = 65001;
  const ceBgpAsn = 65100 + (seedNum % 800);
  const tunnelId = 100 + (seedNum % 400);
  const vrfName = `NFS-${(form.aSite ?? 'SEA').toUpperCase()}-${(form.zSite ?? 'PDX').toUpperCase()}-VRF`;
  const bwMap = { '1G': 1000, '10G': 10000, '100G': 100000, '400G': 400000, '800G': 800000 };
  const bwMbps = bwMap[form.bandwidth] ?? 10000;
  const peakBwMbps = Math.round(bwMbps * 1.05);
  const vlanMod = vlanId % 200;

  const peALoopback = `10.0.0.${11 + (seedNum % 20)}`;
  const peZLoopback = `10.0.0.${31 + (seedNum % 20)}`;
  const bngLoopback = `10.0.0.5`;

  const ceAIp = `10.10.${vlanMod}.1`;
  const peAIp = `10.10.${vlanMod}.2`;
  const ceZIp = `10.10.${vlanMod + 1}.1`;
  const peZIp = `10.10.${vlanMod + 1}.2`;

  const sdpId = 100 + (seedNum % 900);
  const vxlanVni = 10000 + (seedNum % 50000);
  const oltPort = 1 + (seedNum % 16);
  const gemPort = 100 + (seedNum % 900);
  const serialHex = seed.substring(0, 8).toUpperCase();
  const cgnatPool = `100.${64 + (seedNum % 60)}.${seedNum % 255}.0`;

  const waveModulation = form.bandwidth === '800G' ? 'DP-64QAM' : form.bandwidth === '400G' ? 'DP-16QAM' : 'DP-QPSK';
  const waveFec = (form.bandwidth === '400G' || form.bandwidth === '800G') ? 'oFEC-HD' : 'GFEC';

  const dcASpineLoopback = `10.0.100.${1 + (seedNum % 10)}`;
  const dcAgwIp = `10.0.100.${11 + (seedNum % 10)}`;
  const spineIp = dcASpineLoopback;

  const ecpriIp = `192.168.${seedNum % 200}.1`;
  const mobileIp = `172.20.${seedNum % 200}.1`;

  const protectionMode = { none: 'UNPROTECTED', oneplus: '1+1', onecol: '1:1', diverse: 'DIVERSE-ROUTING' }[form.protection] ?? 'DIVERSE-ROUTING';

  return {
    vlanId, vcId, asn, ceBgpAsn, tunnelId, vrfName, bwMbps, peakBwMbps, vlanMod,
    peALoopback, peZLoopback, bngLoopback,
    ceAIp, peAIp, ceZIp, peZIp,
    sdpId, vxlanVni, oltPort, gemPort, serialHex, cgnatPool,
    waveModulation, waveFec, dcASpineLoopback, dcAgwIp, spineIp,
    ecpriIp, mobileIp, protectionMode,
    orderId: plan?.orderId ?? 'NFS-PENDING',
    aSite: (form.aSite ?? 'sea').toUpperCase(),
    zSite: (form.zSite ?? 'pdx').toUpperCase(),
    slaTier: (form.slaTier ?? 'gold').toUpperCase(),
    bandwidth: form.bandwidth ?? '10G',
  };
}

// ─── L3VPN ────────────────────────────────────────────────────────────────────

function l3vpnConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'CE (A-Site)', vendor: 'Cisco', model: 'ISR 4331' },
      tabs: [{
        key: 'ios15',
        label: 'IOS 15.x — CE Config',
        lang: 'ios-xr',
        config: `! === Cisco ISR 4331 — CE Config (${c.aSite} site) ===
! Order: ${c.orderId}   Circuit: L3VPN ${c.bandwidth}   SLA: ${c.slaTier}
!
hostname ${c.aSite}-CE-ISR4331
!
ip vrf ${c.vrfName}
 rd ${c.asn}:${c.vlanId}
 route-target export ${c.asn}:${c.vlanId}
 route-target import ${c.asn}:${c.vlanId}
!
interface GigabitEthernet0/0/0
 description *** PE UPLINK — Nokia 7210 SAS-M ***
 ip vrf forwarding ${c.vrfName}
 ip address ${c.ceAIp} 255.255.255.252
 no shutdown
!
interface GigabitEthernet0/0/1
 description *** Customer LAN ***
 ip vrf forwarding ${c.vrfName}
 ip address 192.168.${c.vlanMod}.1 255.255.255.0
 no shutdown
!
router bgp ${c.ceBgpAsn}
 bgp log-neighbor-changes
 !
 address-family ipv4 vrf ${c.vrfName}
  neighbor ${c.peAIp} remote-as ${c.asn}
  neighbor ${c.peAIp} activate
  neighbor ${c.peAIp} soft-reconfiguration inbound
  network 192.168.${c.vlanMod}.0 mask 255.255.255.0
 exit-address-family
!
ip route vrf ${c.vrfName} 0.0.0.0 0.0.0.0 ${c.peAIp}
!
end`,
      }],
    },
    {
      device: { role: 'Metro (A)', vendor: 'Nokia', model: '7210 SAS-M' },
      tabs: [{
        key: 'sros-metro-a',
        label: 'SR OS — Metro Config',
        lang: 'sros',
        config: `# === Nokia 7210 SAS-M — Metro Aggregation (${c.aSite}) ===
# Order: ${c.orderId}   VLAN: ${c.vlanId}
#
configure
  port 1/1/1
    description "CE DOWNLINK — Cisco ISR 4331"
    ethernet
      mode access
      encap-type dot1q
    exit
    no shutdown
  exit
  port 1/1/25
    description "PE UPLINK — Cisco ASR 9001"
    ethernet
      mode network
      encap-type dot1q
    exit
    no shutdown
  exit
  service
    vpls ${c.vlanId} customer 1 create
      description "${c.orderId}-L3VPN-METRO-AGG-${c.aSite}"
      sap 1/1/1:${c.vlanId} create
        ingress
          qos 10
        exit
      exit
      sap 1/1/25:${c.vlanId} create
      exit
      no shutdown
    exit
  exit
exit`,
      }],
    },
    {
      device: { role: 'PE-A (A-Side)', vendor: 'Cisco', model: 'ASR 9001' },
      tabs: [
        {
          key: 'iosxr-vrf',
          label: 'IOS-XR — VRF + BGP',
          lang: 'ios-xr',
          config: `!! === Cisco ASR 9001 — PE-A Config (${c.aSite}) ===
!! Order: ${c.orderId}   VRF: ${c.vrfName}   RT: ${c.asn}:${c.vlanId}
!!
vrf ${c.vrfName}
 address-family ipv4 unicast
  import route-target
   ${c.asn}:${c.vlanId}
  !
  export route-target
   ${c.asn}:${c.vlanId}
  !
 !
!
interface TenGigE0/0/0/0
 description *** METRO-A Nokia 7210 SAS-M ***
 vrf ${c.vrfName}
 ipv4 address ${c.peAIp} 255.255.255.252
 no shutdown
!
interface TenGigE0/0/0/1
 description *** DWDM UPLINK Ciena 6500 ***
 no shutdown
!
route-policy IMPORT-${c.vrfName}
  pass
end-policy
route-policy EXPORT-${c.vrfName}
  set community (${c.asn}:${c.vlanId})
  pass
end-policy
!
router bgp ${c.asn}
 bgp router-id ${c.peALoopback}
 !
 vrf ${c.vrfName}
  rd ${c.asn}:${c.vlanId}
  address-family ipv4 unicast
   redistribute connected
  !
  neighbor ${c.ceAIp}
   remote-as ${c.ceBgpAsn}
   address-family ipv4 unicast
    route-policy IMPORT-${c.vrfName} in
    route-policy EXPORT-${c.vrfName} out
    as-override
   !
  !
 !
!
mpls ldp
 interface TenGigE0/0/0/1
!`,
        },
        {
          key: 'iosxr-te',
          label: 'IOS-XR — MPLS-TE',
          lang: 'ios-xr',
          config: `!! === ASR 9001 MPLS-TE Configuration ===
rsvp
 interface TenGigE0/0/0/1
  bandwidth ${c.bwMbps}
 !
!
mpls traffic-eng
 interface TenGigE0/0/0/1
 !
 auto-tunnel backup
  tunnel-id min 1000 max 1100
 !
!
interface tunnel-te ${c.tunnelId}
 description *** L3VPN TE-TUNNEL ${c.aSite}→${c.zSite} ***
 ipv4 unnumbered Loopback0
 destination ${c.peZLoopback}
 signalled-bandwidth ${c.bwMbps}
 path-option 1 dynamic
 fast-reroute
 bfd fast-detect
!`,
        },
      ],
    },
    {
      device: { role: 'DWDM', vendor: 'Ciena', model: '6500 ROADM' },
      tabs: [{
        key: 'ciena-rest',
        label: 'Ciena MCP REST API',
        lang: 'json',
        config: `// POST https://ciena-mcp.northstarfiber.net/api/v2/services
{
  "serviceType": "OTN-ODU4",
  "orderId": "${c.orderId}",
  "channel": {
    "frequency": "193.700 THz",
    "channelId": "C47",
    "bandwidth": "${c.bandwidth}",
    "modulation": "DP-16QAM",
    "fec": "oFEC-HD"
  },
  "endpoints": {
    "aEnd": {
      "nodeId": "${c.aSite}-ROADM-6500",
      "degree": 3,
      "port": "LINE-3-1"
    },
    "zEnd": {
      "nodeId": "${c.zSite}-ROADM-6500",
      "degree": 2,
      "port": "LINE-2-1"
    }
  },
  "protection": "${c.protectionMode}",
  "osnrTarget": 18.5,
  "txPower": 0.0
}`,
      }],
    },
    {
      device: { role: 'PE-Z (Z-Side)', vendor: 'Juniper', model: 'MX960' },
      tabs: [{
        key: 'junos-pe-z',
        label: 'JunOS — VRF + BGP',
        lang: 'junos',
        config: `## === Juniper MX960 — PE-Z (${c.zSite}) ===
## Order: ${c.orderId}
##
set interfaces xe-0/0/0 description "METRO-Z Nokia 7210 SAS-M"
set interfaces xe-0/0/0 unit ${c.vlanId} vlan-id ${c.vlanId}
set interfaces xe-0/0/0 unit ${c.vlanId} family inet address ${c.peZIp}/30

set routing-instances ${c.vrfName} instance-type vrf
set routing-instances ${c.vrfName} interface xe-0/0/0.${c.vlanId}
set routing-instances ${c.vrfName} route-distinguisher ${c.asn}:${c.vlanId}
set routing-instances ${c.vrfName} vrf-target target:${c.asn}:${c.vlanId}
set routing-instances ${c.vrfName} vrf-table-label

set routing-instances ${c.vrfName} protocols bgp group CE-${c.zSite}
set routing-instances ${c.vrfName} protocols bgp group CE-${c.zSite} type external
set routing-instances ${c.vrfName} protocols bgp group CE-${c.zSite} peer-as ${c.ceBgpAsn}
set routing-instances ${c.vrfName} protocols bgp group CE-${c.zSite} neighbor ${c.ceZIp}

set protocols mpls interface xe-0/1/0
set protocols rsvp interface xe-0/1/0
set protocols ospf traffic-engineering`,
      }],
    },
    {
      device: { role: 'Metro (Z)', vendor: 'Nokia', model: '7210 SAS-M' },
      tabs: [{
        key: 'sros-metro-z',
        label: 'SR OS — Metro Config',
        lang: 'sros',
        config: `# === Nokia 7210 SAS-M — Metro Aggregation (${c.zSite}) ===
# Order: ${c.orderId}   VLAN: ${c.vlanId}
#
configure
  port 1/1/1
    description "CE DOWNLINK — Juniper SRX 345"
    ethernet
      mode access
      encap-type dot1q
    exit
    no shutdown
  exit
  port 1/1/25
    description "PE UPLINK — Juniper MX960"
    ethernet
      mode network
      encap-type dot1q
    exit
    no shutdown
  exit
  service
    vpls ${c.vlanId} customer 1 create
      description "${c.orderId}-L3VPN-METRO-AGG-${c.zSite}"
      sap 1/1/1:${c.vlanId} create
        ingress
          qos 10
        exit
      exit
      sap 1/1/25:${c.vlanId} create
      exit
      no shutdown
    exit
  exit
exit`,
      }],
    },
    {
      device: { role: 'CE (Z-Site)', vendor: 'Juniper', model: 'SRX 345' },
      tabs: [{
        key: 'junos-ce-z',
        label: 'JunOS — CE Config',
        lang: 'junos',
        config: `## === Juniper SRX 345 — CE (${c.zSite} site) ===
## Order: ${c.orderId}   L3VPN ${c.bandwidth}
##
set interfaces ge-0/0/0 description "PE UPLINK — Nokia 7210 SAS-M"
set interfaces ge-0/0/0 unit 0 family inet address ${c.ceZIp}/30

set interfaces ge-0/0/1 description "Customer LAN"
set interfaces ge-0/0/1 unit 0 family inet address 10.${c.vlanMod}.0.1/24

set protocols bgp group PE-${c.zSite}
set protocols bgp group PE-${c.zSite} type external
set protocols bgp group PE-${c.zSite} peer-as ${c.asn}
set protocols bgp group PE-${c.zSite} neighbor ${c.peZIp}
set protocols bgp group PE-${c.zSite} export EXPORT-DEFAULT

set policy-options policy-statement EXPORT-DEFAULT term 1 from route-filter 10.${c.vlanMod}.0.0/24 exact
set policy-options policy-statement EXPORT-DEFAULT term 1 then accept

set security zones security-zone trust interfaces ge-0/0/1.0
set security zones security-zone untrust interfaces ge-0/0/0.0`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── EVC ──────────────────────────────────────────────────────────────────────

function evcConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'CE (A-Site)', vendor: 'Cisco', model: 'Catalyst 8300' },
      tabs: [{
        key: 'iosxe-evc',
        label: 'IOS-XE — EVC Service Instance',
        lang: 'ios-xr',
        config: `! === Cisco Catalyst 8300 — CE-A EVC Config ===
! Order: ${c.orderId}   Service: MEF E-LINE ${c.bandwidth}
!
interface GigabitEthernet1
 description *** METRO UPLINK — Cisco ASR 920 ***
 no shutdown
!
 service instance ${c.vlanId} ethernet
  description ${c.orderId}-ELINE-${c.aSite}-${c.zSite}
  encapsulation dot1q ${c.vlanId}
  xconnect ${c.peAIp} ${c.vcId} encapsulation mpls
   backup peer ${c.peZIp} ${c.vcId}
    preferred
   !
  !
!`,
      }],
    },
    {
      device: { role: 'Metro (A)', vendor: 'Cisco', model: 'ASR 920' },
      tabs: [{
        key: 'iosxe-asr920-a',
        label: 'IOS-XE — ASR 920 Metro',
        lang: 'ios-xr',
        config: `! === Cisco ASR 920 — Metro Aggregation (${c.aSite}) ===
! Order: ${c.orderId}   VLAN: ${c.vlanId}
!
interface GigabitEthernet0/0/0
 description *** CE-A Cisco Cat 8300 ***
 switchport mode access
 switchport access vlan ${c.vlanId}
 no shutdown
!
interface GigabitEthernet0/0/24
 description *** PE-A Nokia 7750 SR-1 UPLINK ***
 switchport mode trunk
 switchport trunk allowed vlan ${c.vlanId}
 no shutdown
!
vlan ${c.vlanId}
 name ${c.orderId}-ELINE-METRO-${c.aSite}
!
spanning-tree vlan ${c.vlanId} priority 4096
!`,
      }],
    },
    {
      device: { role: 'PE-A', vendor: 'Nokia', model: '7750 SR-1' },
      tabs: [{
        key: 'sros-epipe',
        label: 'SR OS — E-LINE Epipe',
        lang: 'sros',
        config: `# === Nokia 7750 SR-1 — PE-A EVC Config ===
# Order: ${c.orderId}   VC-ID: ${c.vcId}   VLAN: ${c.vlanId}
#
configure service
  epipe ${c.vcId} customer 1 create
    description "${c.orderId}-ELINE-${c.aSite}-TO-${c.zSite}"
    service-mtu 9000
    sap ${c.aSite}-ACCESS-PORT:${c.vlanId} create
      description "CE-A Cisco Cat 8300"
      ingress
        qos 101
      exit
      egress
        qos 101
      exit
      no shutdown
    exit
    spoke-sdp ${c.sdpId}:${c.vcId} create
      description "SDP-TO-PE-Z-${c.zSite}"
      no shutdown
    exit
    no shutdown
  exit
!
sdp ${c.sdpId} mpls create
  description "SDP-${c.aSite}-TO-${c.zSite}"
  far-end ${c.peZLoopback}
  ldp
  no shutdown
exit`,
      }],
    },
    {
      device: { role: 'DWDM', vendor: 'Ciena', model: 'Waveserver 5' },
      tabs: [{
        key: 'ciena-ws5',
        label: 'Ciena WS5 REST API',
        lang: 'json',
        config: `// POST https://ciena-ws5.northstarfiber.net/api/v2/wavelength-services
{
  "serviceId": "${c.orderId}-EVC",
  "serviceType": "OTN-ODU2e",
  "channel": {
    "frequency": "193.700 THz",
    "channelId": "C47",
    "bandwidth": "${c.bandwidth}",
    "modulation": "DP-16QAM",
    "fec": "oFEC-HD"
  },
  "endpoints": {
    "aEnd": {
      "nodeId": "${c.aSite}-WS5",
      "clientPort": "CLIENT-1"
    },
    "zEnd": {
      "nodeId": "${c.zSite}-WS5",
      "clientPort": "CLIENT-1"
    }
  },
  "protection": "${c.protectionMode}",
  "osnrTarget": 18.0
}`,
      }],
    },
    {
      device: { role: 'PE-Z', vendor: 'Nokia', model: '7750 SR-1' },
      tabs: [{
        key: 'sros-epipe-z',
        label: 'SR OS — E-LINE Epipe (Z)',
        lang: 'sros',
        config: `# === Nokia 7750 SR-1 — PE-Z EVC Config ===
# Order: ${c.orderId}   VC-ID: ${c.vcId}   VLAN: ${c.vlanId}
#
configure service
  epipe ${c.vcId} customer 1 create
    description "${c.orderId}-ELINE-${c.zSite}-TO-${c.aSite}"
    service-mtu 9000
    sap ${c.zSite}-ACCESS-PORT:${c.vlanId} create
      description "CE-Z Cisco Cat 8300"
      ingress
        qos 101
      exit
      egress
        qos 101
      exit
      no shutdown
    exit
    spoke-sdp ${c.sdpId}:${c.vcId} create
      description "SDP-TO-PE-A-${c.aSite}"
      no shutdown
    exit
    no shutdown
  exit
!`,
      }],
    },
    {
      device: { role: 'Metro (Z)', vendor: 'Cisco', model: 'ASR 920' },
      tabs: [{
        key: 'iosxe-asr920-z',
        label: 'IOS-XE — ASR 920 Metro',
        lang: 'ios-xr',
        config: `! === Cisco ASR 920 — Metro Aggregation (${c.zSite}) ===
! Order: ${c.orderId}   VLAN: ${c.vlanId}
!
interface GigabitEthernet0/0/0
 description *** CE-Z Cisco Cat 8300 ***
 switchport mode access
 switchport access vlan ${c.vlanId}
 no shutdown
!
interface GigabitEthernet0/0/24
 description *** PE-Z Nokia 7750 SR-1 UPLINK ***
 switchport mode trunk
 switchport trunk allowed vlan ${c.vlanId}
 no shutdown
!
vlan ${c.vlanId}
 name ${c.orderId}-ELINE-METRO-${c.zSite}
!`,
      }],
    },
    {
      device: { role: 'CE (Z-Site)', vendor: 'Cisco', model: 'Catalyst 8300' },
      tabs: [{
        key: 'iosxe-ce-z',
        label: 'IOS-XE — EVC CE-Z Config',
        lang: 'ios-xr',
        config: `! === Cisco Catalyst 8300 — CE-Z EVC Config ===
! Order: ${c.orderId}   Service: MEF E-LINE ${c.bandwidth}
!
interface GigabitEthernet1
 description *** METRO UPLINK — Cisco ASR 920 ***
 no shutdown
!
 service instance ${c.vlanId} ethernet
  description ${c.orderId}-ELINE-${c.zSite}-${c.aSite}
  encapsulation dot1q ${c.vlanId}
  xconnect ${c.peZIp} ${c.vcId} encapsulation mpls
   backup peer ${c.peAIp} ${c.vcId}
    preferred
   !
  !
!`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── DIA ──────────────────────────────────────────────────────────────────────

function diaConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'ONT', vendor: 'Calix', model: '716GE-I' },
      tabs: [{
        key: 'calix-cloud',
        label: 'Calix Cloud API',
        lang: 'json',
        config: `// POST https://api.calixcloud.com/v2/onts
{
  "ontSerialNumber": "CXNK${c.serialHex}",
  "orderId": "${c.orderId}",
  "serviceProfile": "DIA-${c.bandwidth}",
  "oltUplink": "${c.aSite}-OLT-7360/GPON-1/${c.oltPort}",
  "gemPort": ${c.gemPort},
  "vlan": ${c.vlanId},
  "cir": "${c.bandwidth}",
  "pir": "${c.bandwidth}",
  "dscpMark": "CS0",
  "authentication": "IPoE",
  "ipMode": "DHCP"
}`,
      }],
    },
    {
      device: { role: 'OLT', vendor: 'Nokia', model: '7360 ISAM' },
      tabs: [{
        key: 'sros-gpon',
        label: 'SR OS — GPON Service',
        lang: 'sros',
        config: `# === Nokia 7360 ISAM — OLT Config ===
# Order: ${c.orderId}
#
configure
  port xdsl-bonding-group 1/1/1/1:1
    xdsl
      line-profile "DIA-${c.bandwidth}"
    exit
  exit
  service
    vlan ${c.vlanId} customer 1 create
      description "${c.orderId}-DIA-OLT"
      sap 1/1/${c.oltPort}:${c.vlanId} create
        ingress
          scheduler-policy "POL-DIA-${c.bandwidth}"
          qos 20
        exit
      exit
      no shutdown
    exit
  exit
exit`,
      }],
    },
    {
      device: { role: 'BNG', vendor: 'Cisco', model: 'ASR 9001' },
      tabs: [{
        key: 'iosxr-bng',
        label: 'IOS-XR — IPoE Session',
        lang: 'ios-xr',
        config: `!! === Cisco ASR 9001 BNG — DIA Service Config ===
!! Order: ${c.orderId}   CIR: ${c.bandwidth}
!!
policy-map PM-DIA-${c.bandwidth}
 class CM-ALL
  police rate ${c.bwMbps}000000 bps peak-rate ${c.peakBwMbps}000000 bps
  conform-action transmit
  exceed-action drop
  shape average ${c.bwMbps}000000
  set dscp default
 !
!
dynamic-template type ipsubscriber DT-DIA-${c.bandwidth}
 service-policy input PM-DIA-${c.bandwidth}
 service-policy output PM-DIA-${c.bandwidth}
 ipv4 unnumbered Loopback0
 dhcpv4
  class northstar
 !
!
pool vrf default ipv4 ${c.cgnatPool}
 utilization-mark high 80 low 40
!
aaa accounting subscriber default start-stop group radius
aaa authorization subscriber default group radius`,
      }],
    },
    {
      device: { role: 'Peering', vendor: 'Juniper', model: 'MX480' },
      tabs: [{
        key: 'junos-peering',
        label: 'JunOS — BGP Peering',
        lang: 'junos',
        config: `## === Juniper MX480 — Internet Peering ===
## Order: ${c.orderId}   AS: 65001
##
set policy-options prefix-list PFX-CUSTOMER-${c.orderId} ${c.cgnatPool}/20
set policy-options policy-statement EXPORT-DIA-${c.orderId} term t1 from prefix-list PFX-CUSTOMER-${c.orderId}
set policy-options policy-statement EXPORT-DIA-${c.orderId} term t1 then accept
set policy-options policy-statement EXPORT-DIA-${c.orderId} term default then reject

set protocols bgp group NORTHSTAR-DIA type external
set protocols bgp group NORTHSTAR-DIA peer-as 65001
set protocols bgp group NORTHSTAR-DIA export EXPORT-DIA-${c.orderId}
set protocols bgp group NORTHSTAR-DIA neighbor ${c.bngLoopback}`,
      }],
    },
    {
      device: { role: 'IXP', vendor: 'Arista', model: '7280R3' },
      tabs: [{
        key: 'eos-ixp',
        label: 'EOS — IXP Peering',
        lang: 'eos',
        config: `! === Arista 7280R3 — IXP Route Server Config ===
! Order: ${c.orderId}
!
router bgp ${c.asn}
   router-id ${c.dcASpineLoopback}
   no bgp default ipv4-unicast
   !
   neighbor IX-PEERS peer group
   neighbor IX-PEERS remote-as ${c.ceBgpAsn}
   neighbor IX-PEERS send-community
   neighbor IX-PEERS maximum-routes 12000 warning-only
   !
   neighbor ${c.bngLoopback} peer group IX-PEERS
   neighbor ${c.bngLoopback} description "NorthStar-DIA-${c.orderId}"
   !
   address-family ipv4
      neighbor IX-PEERS activate
      neighbor IX-PEERS route-map IMPORT-IX in
      neighbor IX-PEERS route-map EXPORT-IX out
   !
!
route-map IMPORT-IX permit 10
   match ip address prefix-list PFX-RFC1918-DENY
   set local-preference 200
!
route-map EXPORT-IX permit 10
   match ip address prefix-list PFX-${c.orderId}
!`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── WAVE ─────────────────────────────────────────────────────────────────────

function waveConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'ROADM-A', vendor: 'Ciena', model: '6500-T12' },
      tabs: [{
        key: 'ciena-wl-a',
        label: 'Ciena WaveLogic REST',
        lang: 'json',
        config: `// POST https://ciena-nms.northstarfiber.net/api/v3/wavelength-services
{
  "serviceId": "${c.orderId}",
  "serviceType": "WAVE",
  "channel": {
    "ituChannel": "C47",
    "frequency": "193.700 THz",
    "wavelength": "1550.12 nm",
    "spacing": "50 GHz",
    "power": 0.0,
    "modulation": "${c.waveModulation}",
    "fec": "${c.waveFec}",
    "lineRate": "${c.bandwidth}"
  },
  "aEndROADM": {
    "nodeId": "${c.aSite}-ROADM-6500-T12",
    "degree": 3,
    "addPort": "CH-47-ADD"
  },
  "zEndROADM": {
    "nodeId": "${c.zSite}-ROADM-6500-T12",
    "degree": 2,
    "dropPort": "CH-47-DROP"
  },
  "ila": ["${c.aSite}-ILA-1", "${c.aSite}-ILA-2"],
  "osnrEstimate": 18.5,
  "marginEstimate": 4.2
}`,
      }],
    },
    {
      device: { role: 'ILA-1', vendor: 'Ciena', model: '6500 Raman' },
      tabs: [{
        key: 'ciena-ila1',
        label: 'Ciena ILA — Raman Amp CLI',
        lang: 'cli',
        config: `# === Ciena 6500 Raman ILA-1 Config ===
# Order: ${c.orderId}   Site: ${c.aSite}-ILA-1
#
configure amplifier raman-pump 1
  pump-power 100.0 mW
  pump-wavelength 1450.0 nm
  enable
exit
configure amplifier raman-pump 2
  pump-power 80.0 mW
  pump-wavelength 1455.0 nm
  enable
exit
configure channel C47
  frequency 193.700 THz
  target-power 0.0 dBm
  enable
exit
configure span
  span-loss ${17 + (parseInt(c.orderId.slice(-2), 16) % 5)}.${Math.round(Math.random() * 9)} dB
  input-power-reference -10.0 dBm
exit`,
      }],
    },
    {
      device: { role: 'ILA-2', vendor: 'Ciena', model: '6500 Raman' },
      tabs: [{
        key: 'ciena-ila2',
        label: 'Ciena ILA — Raman Amp CLI',
        lang: 'cli',
        config: `# === Ciena 6500 Raman ILA-2 Config ===
# Order: ${c.orderId}   Site: ${c.aSite}-ILA-2
#
configure amplifier raman-pump 1
  pump-power 95.0 mW
  pump-wavelength 1450.0 nm
  enable
exit
configure amplifier raman-pump 2
  pump-power 75.0 mW
  pump-wavelength 1455.0 nm
  enable
exit
configure channel C47
  frequency 193.700 THz
  target-power 0.0 dBm
  enable
exit
configure span
  span-loss ${18 + (parseInt(c.orderId.slice(-2), 16) % 4)}.${Math.round(Math.random() * 9)} dB
exit`,
      }],
    },
    {
      device: { role: 'OTN Switch', vendor: 'Infinera', model: 'DTN-X' },
      tabs: [{
        key: 'infinera-otn',
        label: 'Infinera CLI — OTN Cross-Connect',
        lang: 'cli',
        config: `# === Infinera DTN-X — OTN Cross-Connect ===
# Order: ${c.orderId}   Rate: OTU4 (100G per tributary)
#
configure network-element
  create cross-connect ${c.orderId}-XC-1
    from-tp lineptp-1-1-1-rx-otu4
    to-tp clientptp-1-2-1-tx-otu4
    service-type odu-service
  end-create
  !
  create channel
    channel-id 47
    frequency 193.700
    power-level 0.0
    modulation-format ${c.waveModulation}
    fec ofec
    line-system ROADM-${c.aSite}
  end-create
exit`,
      }],
    },
    {
      device: { role: 'ROADM-Z', vendor: 'Ciena', model: '6500-T12' },
      tabs: [{
        key: 'ciena-wl-z',
        label: 'Ciena WaveLogic REST (Z)',
        lang: 'json',
        config: `// PATCH https://ciena-nms.northstarfiber.net/api/v3/wavelength-services/${c.orderId}
{
  "zEndROADM": {
    "nodeId": "${c.zSite}-ROADM-6500-T12",
    "degree": 2,
    "dropPort": "CH-47-DROP",
    "state": "IS"
  },
  "status": "PROVISIONED",
  "alarms": []
}`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── BACKHAUL ─────────────────────────────────────────────────────────────────

function backhaulConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'RRH', vendor: 'Ericsson', model: 'AIR 6449' },
      tabs: [{
        key: 'ericsson-rrh',
        label: 'Ericsson RRH — eCPRI Config',
        lang: 'cli',
        config: `# === Ericsson AIR 6449 — RRH eCPRI Config ===
# Order: ${c.orderId}   SLA: ${c.slaTier}
#
MO:EUtranCellFDD=Cell-${c.vlanMod}
  administrativeState: UNLOCKED
  earfcndl: 1300
  earfcnul: 19300
  physicalLayerCellIdGroup: ${c.vlanMod % 168}
  physicalLayerSubCellId: 0
#
MO:EthernetPort=eth0
  administrativeState: UNLOCKED
  speed: ${c.bandwidth}
  duplex: FULL
  vlan: ${c.vlanId}
#
MO:SynchronizationSource=ptp
  administrativeState: UNLOCKED
  priority1: 128
  profile: G8275_1`,
      }],
    },
    {
      device: { role: 'BBU', vendor: 'Ericsson', model: 'Baseband 6630' },
      tabs: [{
        key: 'ericsson-bbu',
        label: 'Ericsson BBU — Fronthaul Config',
        lang: 'cli',
        config: `# === Ericsson Baseband 6630 — eCPRI Fronthaul ===
# Order: ${c.orderId}
#
MO:FrontHaul=FH-${c.vlanMod}
  ecpriPort: eth0
  bandwidth: ${c.bandwidth}
  compressionMode: DYNAMIC
  iqCompression: BFP
#
MO:SynchronizationReference=ptp0
  syncReferenceType: PTP
  peerAddress: ${c.ecpriIp}
  priority: 1
  profile: G8275.1
  domain: 24`,
      }],
    },
    {
      device: { role: 'Cell Agg', vendor: 'Cisco', model: 'NCS 540' },
      tabs: [{
        key: 'iosxr-ptp',
        label: 'IOS-XR — PTP SyncE',
        lang: 'ios-xr',
        config: `!! === Cisco NCS 540 — 5G Fronthaul Aggregation ===
!! Order: ${c.orderId}   SLA: ${c.slaTier}
!!
ptp
 clock
  domain 24
  profile g8275.1
 !
 port TenGigE0/0/0/0
  transport ipv4
  master
  !
  announce interval 1
  sync interval -4
  delay-request interval -4
 !
!
frequency synchronization
 quality itu-t option 1
 !
 interface TenGigE0/0/0/0
  input
   quality-level option 1 generation 2 ePRTC
   priority 1
  !
 !
!
interface TenGigE0/0/0/0
 description *** eCPRI BBU — Ericsson baseband 6630 ***
 ipv4 address ${c.ecpriIp} 255.255.255.252
 no shutdown
!
qos
 policy-map PM-FRONTHAUL-eCPRI
  class CM-ECPRI
   set dscp cs7
   priority level 1
   police rate ${c.bwMbps}000000 bps
  !
  class class-default
   drop
  !
 !
!`,
      }],
    },
    {
      device: { role: 'PE', vendor: 'Nokia', model: '7750 SR-2s' },
      tabs: [{
        key: 'sros-cups',
        label: 'SR OS — CUPS + QoS',
        lang: 'sros',
        config: `# === Nokia 7750 SR-2s — Mobile Backhaul PE ===
# Order: ${c.orderId}   5G NR Backhaul
#
configure
  router
    interface "${c.aSite}-ECPRI-ACCESS"
      address ${c.mobileIp}/30
      port 1/1/1:0
      no shutdown
    exit
    mpls-labels
      sr-labels start 16000 end 23999
    exit
    isis 0
      interface "${c.aSite}-ECPRI-ACCESS"
        level-capability level-2
        interface-type point-to-point
      exit
    exit
  exit
  qos
    sap-ingress 200 create
      description "5G-BACKHAUL-QOS-${c.orderId}"
      queue 1 multipoint create
        rate cir ${c.bwMbps} pir ${c.peakBwMbps}
      exit
      fc "h1" create
        queue 1
      exit
    exit
  exit
exit`,
      }],
    },
    {
      device: { role: 'Core', vendor: 'Nokia', model: '7750 SR-7s' },
      tabs: [{
        key: 'sros-core',
        label: 'SR OS — 5G Core Router',
        lang: 'sros',
        config: `# === Nokia 7750 SR-7s — 5G Core Router ===
# Order: ${c.orderId}
#
configure
  router
    mpls
      lsp "LSP-5G-BACKHAUL-${c.orderId}"
        to ${c.peALoopback}
        type p2p-rsvp
        bandwidth ${c.bwMbps}
        primary "PATH-5G-WK"
          bandwidth ${c.bwMbps}
          cspf
          fast-reroute
            frr-method facility
          exit
        exit
        no shutdown
      exit
    exit
    isis 0
      level-capability level-2
      area-id 49.0001
      interface "system"
        no shutdown
      exit
      no shutdown
    exit
  exit
exit`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── DCI ──────────────────────────────────────────────────────────────────────

function dciConfigs(deviceIndex, form, plan) {
  const c = buildCtx(form, plan);

  const devices = [
    {
      device: { role: 'Spine-A', vendor: 'Arista', model: '7800R3' },
      tabs: [{
        key: 'eos-evpn',
        label: 'EOS — EVPN/VXLAN',
        lang: 'eos',
        config: `! === Arista 7800R3 — Spine DC-A DCI Config ===
! Order: ${c.orderId}   ${c.bandwidth} EVPN/VXLAN
!
vlan ${c.vlanId}
   name ${c.orderId}-DCI-TENANT
!
interface Vxlan1
   vxlan source-interface Loopback0
   vxlan udp-port 4789
   vxlan vlan ${c.vlanId} vni ${c.vxlanVni}
   vxlan learn-restrict any
!
router bgp ${c.asn}
   router-id ${c.dcASpineLoopback}
   no bgp default ipv4-unicast
   neighbor EVPN-PEER peer group
   neighbor EVPN-PEER update-source Loopback0
   neighbor EVPN-PEER send-community extended
   neighbor ${c.dcAgwIp} peer group EVPN-PEER
   neighbor ${c.dcAgwIp} remote-as ${c.asn}
   !
   address-family evpn
      neighbor EVPN-PEER activate
   !
   vlan ${c.vlanId}
      rd ${c.asn}:${c.vxlanVni}
      route-target both ${c.asn}:${c.vxlanVni}
      redistribute learned
   !
!`,
      }],
    },
    {
      device: { role: 'DCI-GW-A', vendor: 'Cisco', model: 'Nexus 9336C' },
      tabs: [{
        key: 'nxos-macsec',
        label: 'NX-OS — MACsec + EVPN',
        lang: 'ios-xr',
        config: `! === Cisco Nexus 9336C — DCI Gateway DC-A ===
! Order: ${c.orderId}
!
feature macsec
feature evpn
feature vn-segment-vlan-based
!
vlan ${c.vlanId}
  name ${c.orderId}-DCI
  vn-segment ${c.vxlanVni}
!
interface Ethernet1/1
 description *** DWDM UPLINK Infinera ICE6 ***
 mtu 9216
 macsec
  keychain ${c.orderId}-MKA
  policy MACSEC-AES-256
 no shutdown
!
router bgp ${c.asn}
 address-family l2vpn evpn
  advertise-pip
  retain route-target all
 !
 neighbor ${c.spineIp}
  remote-as ${c.asn}
  update-source Loopback0
  address-family l2vpn evpn
   send-community
   send-community extended
  !
 !
!`,
      }],
    },
    {
      device: { role: 'DWDM-A', vendor: 'Infinera', model: 'ICE6 800G' },
      tabs: [{
        key: 'infinera-ice6-a',
        label: 'Infinera OneControl REST',
        lang: 'json',
        config: `// POST https://onecontrol.northstarfiber.net/api/v1/services/dci
{
  "serviceId": "${c.orderId}-DCI-800G",
  "serviceClass": "DCI-COHERENT",
  "lineRate": "${c.bandwidth}",
  "modulation": "DP-64QAM",
  "fec": "CFEC",
  "channel": {
    "ituChannel": "C43",
    "frequency": "193.300 THz",
    "txPower": 2.0
  },
  "security": {
    "macsec": true,
    "algorithm": "AES-256-GCM",
    "keyExchange": "MKA"
  },
  "endpoints": {
    "aEnd": { "nodeId": "DC-A-ICE6", "clientPort": "CLIENT-1" },
    "zEnd": { "nodeId": "DC-Z-ICE6", "clientPort": "CLIENT-1" }
  }
}`,
      }],
    },
    {
      device: { role: 'DWDM-Z', vendor: 'Infinera', model: 'ICE6 800G' },
      tabs: [{
        key: 'infinera-ice6-z',
        label: 'Infinera OneControl REST (Z)',
        lang: 'json',
        config: `// GET https://onecontrol.northstarfiber.net/api/v1/services/dci/${c.orderId}-DCI-800G/status
// Expected response:
{
  "serviceId": "${c.orderId}-DCI-800G",
  "status": "PROVISIONED",
  "zEndNode": "DC-Z-ICE6",
  "performance": {
    "preFEC_BER": "1.2e-2",
    "postFEC_BER": "0",
    "OSNR": 22.4,
    "txPower": 2.0,
    "rxPower": -8.3,
    "CD": 1240,
    "PMD": 0.8,
    "margin": 5.1
  }
}`,
      }],
    },
    {
      device: { role: 'DCI-GW-Z', vendor: 'Cisco', model: 'Nexus 9336C' },
      tabs: [{
        key: 'nxos-z',
        label: 'NX-OS — DCI Gateway (Z)',
        lang: 'ios-xr',
        config: `! === Cisco Nexus 9336C — DCI Gateway DC-Z ===
! Order: ${c.orderId}
!
feature macsec
feature evpn
feature vn-segment-vlan-based
!
vlan ${c.vlanId}
  name ${c.orderId}-DCI-Z
  vn-segment ${c.vxlanVni}
!
interface Ethernet1/1
 description *** DWDM UPLINK Infinera ICE6 (Z) ***
 mtu 9216
 macsec
  keychain ${c.orderId}-MKA
  policy MACSEC-AES-256
 no shutdown
!
router bgp ${c.asn}
 neighbor ${c.dcASpineLoopback}
  remote-as ${c.asn}
  update-source Loopback0
  address-family l2vpn evpn
   send-community
   send-community extended
  !
 !
!`,
      }],
    },
    {
      device: { role: 'Spine-Z', vendor: 'Arista', model: '7800R3' },
      tabs: [{
        key: 'eos-spine-z',
        label: 'EOS — Spine DC-Z EVPN',
        lang: 'eos',
        config: `! === Arista 7800R3 — Spine DC-Z DCI Config ===
! Order: ${c.orderId}   ${c.bandwidth} EVPN/VXLAN
!
vlan ${c.vlanId}
   name ${c.orderId}-DCI-TENANT-Z
!
interface Vxlan1
   vxlan source-interface Loopback0
   vxlan udp-port 4789
   vxlan vlan ${c.vlanId} vni ${c.vxlanVni}
   vxlan learn-restrict any
!
router bgp ${c.asn}
   router-id ${c.peZLoopback}
   no bgp default ipv4-unicast
   neighbor EVPN-PEER peer group
   neighbor EVPN-PEER update-source Loopback0
   neighbor EVPN-PEER send-community extended
   neighbor ${c.dcAgwIp} peer group EVPN-PEER
   neighbor ${c.dcAgwIp} remote-as ${c.asn}
   !
   address-family evpn
      neighbor EVPN-PEER activate
   !
   vlan ${c.vlanId}
      rd ${c.asn}:${c.vxlanVni}
      route-target both ${c.asn}:${c.vxlanVni}
      redistribute learned
   !
!`,
      }],
    },
  ];

  return devices[deviceIndex] ?? devices[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

const GENERATORS = {
  l3vpn:    l3vpnConfigs,
  evc:      evcConfigs,
  dia:      diaConfigs,
  wave:     waveConfigs,
  backhaul: backhaulConfigs,
  dci:      dciConfigs,
};

export function getDeviceConfigs(deviceIndex, circuitType, form, plan) {
  const gen = GENERATORS[circuitType] ?? GENERATORS.l3vpn;
  return gen(deviceIndex, form, plan);
}
