// ============================================================
// NODE-SPECIFIC CONFIG GENERATORS
// Each function receives (simId, step, customerId, vlan, ip) context
// and returns realistic CLI / API configs for that specific device.
// ============================================================

// ── Shared helpers ────────────────────────────────────────────
const ts = () => new Date().toISOString();
const hex = (n = 6) => [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randIP = (prefix) => `${prefix}.${randInt(1, 250)}`;
const ontSN = () => `CXNK${hex(8)}`;
const orderNum = () => `ORD-${Date.now().toString(36).toUpperCase()}`;
const vlanBase = () => randInt(1001, 4090);
const loopIP = () => `10.0.0.${randInt(1, 254)}`;
const mplsLabel = () => randInt(16, 1048575);

// ── Per-node config generators ──────────────────────────────
// Each entry: { tabs: [{key, label, lang, generate(ctx)}] }

export const NODE_CONFIGS = {

  // ── OLT Calix E7-2 ─────────────────────────────────────────
  olt_1: calixOLTConfig('OLT-1'),
  olt_2: calixOLTConfig('OLT-2'),

  // ── ONT (Residential) ──────────────────────────────────────
  ont_res: {
    tabs: [
      {
        key: 'calix_cloud', label: 'Calix Cloud API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "Calix Cloud — ONT Provision Request",
          "timestamp": ts(),
          "operation": "PROVISION_ONT",
          "olt": ctx.simId === 'add_residential' ? 'OLT-1' : 'OLT-2',
          "pon_port": `1/1/${randInt(1, 8)}`,
          "ont": {
            "serial_number": ontSN(),
            "ont_id": randInt(1, 128),
            "profile": "XGS-PON-RESIDENTIAL-1G",
            "description": `Auto-provisioned residential ONT | Sim: ${ctx.simId}`,
            "services": [
              { "type": "HSI", "svlan": ctx.vlan, "cvlan": 100, "bw_profile": "BW-1G-RESIDENTIAL" }
            ]
          }
        }, null, 2),
      },
      {
        key: 'calix_cli', label: 'Calix CLI', lang: 'IOS',
        generate: (ctx) => `! Calix E7-2 — Residential ONT Provisioning
! Generated: ${ts()}
! Sim: ${ctx.simId}

! Step 1: Add ONT to PON port
interface gpon-olt 1/1/${randInt(1, 8)}
  no shutdown
  ont add pon 1/1/${randInt(1, 8)} ont-id ${randInt(1, 128)} \\
    sn ${ontSN()} \\
    profile XGS-PON-RESIDENTIAL \\
    desc "Residential ONT — auto-provisioned"
  !

! Step 2: Service VLAN assignment
  service-flow upstream bandwidth-profile BW-1G-RES
  service-flow downstream bandwidth-profile BW-1G-RES
  vlan ${ctx.vlan} cvlan 100 service ont-id ${randInt(1, 128)}
  !
commit`,
      },
    ],
  },

  // ── ONT (Business) ─────────────────────────────────────────
  ont_biz: {
    tabs: [
      {
        key: 'nokia_cli', label: 'Nokia 7360 CLI', lang: 'IOS',
        generate: (ctx) => {
          const port = randInt(1, 16);
          const ontId = randInt(1, 32);
          const cvlan = ctx.simId === 'provision_evc' ? 10 : randInt(100, 999);
          const bwProfile = ctx.simId === 'add_midmarket' ? 'BW-5G-ENTERPRISE' : 'BW-1G-BUSINESS';
          return `! Nokia 7360 ISAM — Business ONT Provisioning
! Generated: ${ts()} | Sim: ${ctx.simId}

configure
  equipment
    ont 1/1/${port}/${ontId}
      desc "Business ONT — ${ctx.simId}"
      sernum ${hex(12)}
      sw-plan AUTO
      planned-num-slots 0
      planned-num-tconts 8
      planned-num-eth-ports 4
      commit
  !
  service
    vlan ${ctx.vlan}
      associate-pb-profile BUSINESS-PB
      ! UNI port ${port} → S-VLAN ${ctx.vlan} → MPLS service
      ont-slan port 1/1/${port}/${ontId}/eth-1 \\
        slan ${ctx.vlan} \\
        c-vlan-id ${cvlan} \\
        qos-profile ${bwProfile}
    commit
  !
end`;
        },
      },
      {
        key: 'json_api', label: 'NetBox API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "NetBox — Business ONT Record",
          "timestamp": ts(),
          "endpoint": "POST /api/dcim/devices/",
          "payload": {
            "name": `ONT-BIZ-${hex(4)}`,
            "device_type": { "slug": "nokia-gpon-ont-business" },
            "site": { "slug": "seattle-co-1" },
            "status": "active",
            "custom_fields": {
              "olt_port": `1/1/${randInt(1, 16)}`,
              "ont_id": randInt(1, 32),
              "service_vlan": ctx.vlan,
              "service_type": ctx.simId === 'provision_evc' ? 'EVC_ELINE' : 'ETHERNET',
              "bw_profile": ctx.simId === 'add_midmarket' ? '5G-ENTERPRISE' : '1G-BUSINESS',
            },
          },
        }, null, 2),
      },
    ],
  },

  // ── Aggregation Switch ──────────────────────────────────────
  agg_switch: {
    tabs: [
      {
        key: 'ios_xe', label: 'IOS-XE CLI', lang: 'IOS',
        generate: (ctx) => {
          const trunkPort = randInt(1, 48);
          const sVlan = ctx.vlan;
          const sVlanEnd = ctx.vlan + 19;
          return `! Aggregation Switch (Cisco Catalyst) — Auto-Config
! Generated: ${ts()} | Sim: ${ctx.simId}

! Trunk to new OLT
interface GigabitEthernet1/${trunkPort}
  description "Uplink to ${ctx.simId.includes('smb') ? 'OLT-2' : 'OLT-1'}"
  switchport mode trunk
  switchport trunk allowed vlan add ${sVlan}-${sVlanEnd}
  spanning-tree portfast trunk
  no shutdown
!
! S-VLAN service mapping
vlan ${sVlan}
  name SIM-${ctx.simId.toUpperCase()}-SVLAN
!
! QoS remark — map CoS to DSCP
policy-map PM-${ctx.simId.includes('midmarket') ? 'ENTERPRISE' : 'RESIDENTIAL'}-MARK
  class CM-VOICE
    set dscp ef
  class CM-VIDEO
    set dscp af41
  class CM-DATA
    set dscp af11
!
interface GigabitEthernet1/${trunkPort}
  service-policy input PM-${ctx.simId.includes('midmarket') ? 'ENTERPRISE' : 'RESIDENTIAL'}-MARK
!
end`;
        },
      },
      {
        key: 'netbox', label: 'NetBox API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "NetBox — Agg Switch VLAN Allocation",
          "timestamp": ts(),
          "endpoint": "POST /api/ipam/vlans/",
          "payload": {
            "vid": ctx.vlan,
            "name": `SVLAN-${ctx.simId.toUpperCase()}-${ctx.vlan}`,
            "status": "active",
            "site": { "slug": "seattle-co-1" },
            "group": { "name": "OLT-Service-VLANs" },
            "custom_fields": { "sim_id": ctx.simId, "olt_port": `1/1/${randInt(1, 8)}` },
          },
        }, null, 2),
      },
    ],
  },

  // ── BNG (Cisco ASR 9000) ────────────────────────────────────
  bng: {
    tabs: [
      {
        key: 'iosxr', label: 'IOS-XR CLI', lang: 'IOS',
        generate: (ctx) => {
          const isEnterprise = ctx.simId === 'add_midmarket';
          const isSMB = ctx.simId === 'add_smb';
          const tier = isEnterprise ? '5G-ENTERPRISE' : isSMB ? '1G-BUSINESS' : '1G-RESIDENTIAL';
          const rate = isEnterprise ? '5000000000' : isSMB ? '1000000000' : '1000000000';
          const dscp = isEnterprise ? 'ef' : isSMB ? 'af31' : 'af11';
          const pool = ctx.simId === 'capacity_augment'
            ? `172.16.60.0/21 — New pool | 2046 IPs`
            : `172.16.${randInt(40, 59)}.0/21`;
          return `! Cisco ASR 9000 BNG — IOS-XR
! Generated: ${ts()} | Sim: ${ctx.simId}

! 1. Policy-map for ${tier}
policy-map PM-${tier}
 class CM-ALL
  police rate ${rate} bps peak-rate ${Math.round(Number(rate) * 1.05)} bps
   conform-action transmit
   exceed-action drop
  !
  shape average ${rate}
  set dscp ${dscp}
 !
!

! 2. Dynamic subscriber template
dynamic-template type ipsubscriber DT-${tier}
 service-policy input PM-${tier}
 service-policy output PM-${tier}
 ipv4 unnumbered Loopback0
 ipv6 enable
 ${isEnterprise ? 'vrf TECHVANTAGE-001' : ''}
!

! 3. IP pool (${ctx.simId === 'capacity_augment' ? 'EXPANDED — new pool' : 'standard'})
pool vrf default ipv4 ${pool}
  utilization-mark high 80 low 40
  !

! 4. Apply via RADIUS:
!  Cisco-AVPair = "subscriber:service-name=DT-${tier}"
commit`;
        },
      },
      {
        key: 'radius_attr', label: 'RADIUS VSA', lang: 'Config',
        generate: (ctx) => {
          const tier = ctx.simId === 'add_midmarket' ? 'ENTERPRISE-5G' : ctx.simId === 'add_smb' ? 'BUSINESS-1G' : 'RESIDENTIAL-1G';
          const bw = ctx.simId === 'add_midmarket' ? '5000000000' : '1000000000';
          return `# BNG RADIUS VSA — returned in Access-Accept
# Sim: ${ctx.simId} | Generated: ${ts()}

Cisco-AVPair = "subscriber:service-name=DT-${tier}"
Cisco-AVPair = "ip:sub-qos-policy-in=PM-${tier}"
Cisco-AVPair = "ip:sub-qos-policy-out=PM-${tier}"
Cisco-AVPair = "ip:vrf-id=${ctx.simId === 'add_midmarket' ? 'TECHVANTAGE-001' : 'default'}"
WISPr-Bandwidth-Max-Down = ${bw}
WISPr-Bandwidth-Max-Up = ${bw}
Session-Timeout = 86400
Framed-IP-Address = ${randIP('172.16.' + randInt(40, 59))}
Framed-IP-Netmask = ${ctx.simId === 'add_midmarket' ? '255.255.255.252' : '255.255.255.0'}
Tunnel-Type = VLAN
Tunnel-Medium-Type = IEEE-802
Tunnel-Private-Group-ID = "${ctx.vlan}"`;
        },
      },
    ],
  },

  // ── RADIUS / FreeRADIUS ─────────────────────────────────────
  radius: {
    tabs: [
      {
        key: 'freeradius', label: 'FreeRADIUS', lang: 'Config',
        generate: (ctx) => {
          const isEnterprise = ctx.simId === 'add_midmarket';
          const isSMB = ctx.simId === 'add_smb';
          const tier = isEnterprise ? 'ENTERPRISE-5G' : isSMB ? 'BUSINESS-1G' : 'RESIDENTIAL-1G';
          const bw = isEnterprise ? '5000000000' : '1000000000';
          const user = `${hex(8)}@northstarfiber`;
          return `# FreeRADIUS 3.x — User Profile
# File: /etc/freeradius/3.0/users
# Generated: ${ts()} | Sim: ${ctx.simId}

"${user}" Cleartext-Password := "auto-provisioned"
  Service-Type = Framed-User,
  Framed-Protocol = ${isEnterprise ? 'Ethernet' : 'PPP'},
  Framed-IP-Address = ${randIP('172.16.' + randInt(40, 59))},
  Framed-IP-Netmask = ${isEnterprise ? '255.255.255.252' : '255.255.255.0'},
  Cisco-AVPair += "subscriber:service-name=DT-${tier}",
  Cisco-AVPair += "ip:vrf-id=${isEnterprise ? 'TECHVANTAGE-001' : 'default'}",
  Tunnel-Type = VLAN,
  Tunnel-Medium-Type = IEEE-802,
  Tunnel-Private-Group-ID = "${ctx.vlan}",
  WISPr-Bandwidth-Max-Down = ${bw},
  WISPr-Bandwidth-Max-Up = ${bw},
  Session-Timeout = 86400,
  Class = "${tier}-${ctx.simId.toUpperCase()}"

# Reload: radmin -e "hup module rlm_files"`;
        },
      },
      {
        key: 'coa', label: 'CoA / PoD', lang: 'Config',
        generate: (ctx) => `# RADIUS Change of Authorization (RFC 5176)
# Generated: ${ts()} | Sim: ${ctx.simId}

# Send CoA to BNG to update subscriber policy:
echo "User-Name=${hex(8)}@northstarfiber,
  Cisco-AVPair=subscriber:service-name=DT-${ctx.simId === 'add_midmarket' ? 'ENTERPRISE-5G' : 'RESIDENTIAL-1G'},
  Event-Timestamp=${Math.floor(Date.now() / 1000)}" | \\
  radclient -x ${randIP('10.0.0')}:3799 coa radius-secret

# Expected response: CoA-ACK (code 44)
# On reject: check BNG subscriber session via "show subscriber session all"`,
      },
    ],
  },

  // ── DHCP / DNS ──────────────────────────────────────────────
  dhcp_dns: {
    tabs: [
      {
        key: 'isc_dhcp', label: 'ISC DHCP', lang: 'Config',
        generate: (ctx) => {
          const network = `172.16.${randInt(40, 59)}.0`;
          const gw = `172.16.${randInt(40, 59)}.1`;
          const isStatic = ctx.simId === 'add_smb' || ctx.simId === 'add_midmarket';
          return `# ISC DHCP — Scope Config
# Generated: ${ts()} | Sim: ${ctx.simId}

subnet ${network} netmask ${isStatic ? '255.255.255.252' : '255.255.0.0'} {
  range ${network.replace(/\.0$/, '.10')} ${network.replace(/\.0$/, '.250')};
  option routers ${gw};
  option domain-name-servers 8.8.8.8, 1.1.1.1;
  option domain-name "cust.northstarfiber.net";
  default-lease-time ${isStatic ? '0' : '86400'};
  max-lease-time ${isStatic ? '0' : '604800'};
  ${isStatic ? `
  # Static reservation — enterprise
  host ${ctx.simId.replace('_', '-')}-${hex(4)} {
    hardware ethernet ${[1, 2, 3, 4, 5, 6].map(() => hex(2)).join(':').toLowerCase()};
    fixed-address ${gw.replace(/\.1$/, '.2')};
    option host-name "${ctx.simId}.cust.northstarfiber.net";
  }` : ''}
}`;
        },
      },
      {
        key: 'bind_dns', label: 'BIND DNS', lang: 'Config',
        generate: (ctx) => {
          const host = `customer-${hex(4).toLowerCase()}`;
          const ip = `172.16.${randInt(40, 59)}.${randInt(2, 250)}`;
          return `; BIND 9 — Forward + Reverse Zone Updates
; Generated: ${ts()} | Sim: ${ctx.simId}

; Forward zone: cust.northstarfiber.net
$ORIGIN cust.northstarfiber.net.
${host}   IN  A    ${ip}
${host}   IN  AAAA 2001:db8:${hex(4)}::1

; Reverse zone: 172.16.x.x (PTR)
$ORIGIN ${ip.split('.').slice(0, 3).reverse().join('.')}.in-addr.arpa.
${ip.split('.')[3]}  IN  PTR  ${host}.cust.northstarfiber.net.

; Reload: rndc reload cust.northstarfiber.net`;
        },
      },
    ],
  },

  // ── CGNAT ───────────────────────────────────────────────────
  cgnat: {
    tabs: [
      {
        key: 'iosxr', label: 'IOS-XR NAT', lang: 'IOS',
        generate: (ctx) => `! Cisco ASR — CGNAT (NAT44 / CGN)
! Generated: ${ts()} | Sim: ${ctx.simId}

service cgv6 ${ctx.simId === 'capacity_augment' ? 'CGNAT-EXPANDED' : 'CGNAT-INSTANCE'}
  service-location preferred-active 0/0/CPU0
  service-type nat44 ${ctx.simId === 'capacity_augment' ? 'CGNAT-EXPANDED' : 'CGNAT-1'}
  !
  nat44 pool ${ctx.simId === 'capacity_augment' ? 'POOL-EXPANDED' : 'POOL-1'}
    address 67.134.${randInt(50, 70)}.0 67.134.${randInt(50, 70)}.255
    port-block-size 512
    max-users-per-ip 30000
  !
  nat44 address-family ipv4 ${ctx.simId === 'capacity_augment' ? 'EXPANDED' : 'STANDARD'}
    interface GigabitEthernet0/0/0/0
  !
commit`,
      },
    ],
  },

  // ── NetBox ──────────────────────────────────────────────────
  netbox: {
    tabs: [
      {
        key: 'api_ipam', label: 'IPAM API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "NetBox IPAM — IP Allocation",
          "timestamp": ts(),
          "request_id": `REQ-${orderNum()}`,
          "simulation": ctx.simId,
          "operations": [
            {
              "endpoint": "POST /api/ipam/ip-addresses/",
              "payload": {
                "address": `172.16.${randInt(40, 59)}.${randInt(2, 254)}/30`,
                "status": "active",
                "role": ctx.simId === 'add_midmarket' ? "loopback" : "dhcp",
                "tenant": { "name": ctx.simId.includes('midmarket') ? "North Star Enterprise" : "North Star Residential" },
                "custom_fields": { "service_tier": ctx.simId.includes('midmarket') ? "5G" : "1G", "vlan_id": ctx.vlan, "sim": ctx.simId },
              },
            },
            {
              "endpoint": "POST /api/ipam/vlans/",
              "payload": {
                "vid": ctx.vlan,
                "name": `SVLAN-${ctx.vlan}-${ctx.simId.toUpperCase()}`,
                "status": "active",
                "site": { "slug": "seattle-co-1" },
              },
            },
          ],
        }, null, 2),
      },
      {
        key: 'api_dcim', label: 'DCIM API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "NetBox DCIM — Device + Port Allocation",
          "timestamp": ts(),
          "simulation": ctx.simId,
          "endpoint": "PATCH /api/dcim/interfaces/",
          "payload": {
            "device": { "name": ctx.simId.includes('smb') || ctx.simId.includes('midmarket') ? "OLT-2" : "OLT-1" },
            "name": `xge-1/1/${randInt(1, 48)}`,
            "status": "active",
            "mode": "tagged",
            "tagged_vlans": [{ "vid": ctx.vlan }],
            "custom_fields": {
              "olt_port_type": "XGS-PON",
              "ont_sn": ontSN(),
              "provisioned_by": `sim:${ctx.simId}`,
              "provisioned_at": ts(),
            },
          },
        }, null, 2),
      },
    ],
  },

  // ── Provisioning System ─────────────────────────────────────
  provisioning: {
    tabs: [
      {
        key: 'workflow', label: 'Workflow API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "North Star Provisioning Engine — Workflow Trigger",
          "timestamp": ts(),
          "workflow_id": `WF-${orderNum()}`,
          "simulation": ctx.simId,
          "trigger": "auto_provision",
          "steps": [
            { "seq": 1, "system": "NetBox", "action": "allocate_ip_vlan", "status": "complete" },
            { "seq": 2, "system": "OLT", "action": "provision_ont_port", "status": "in_progress" },
            { "seq": 3, "system": "BNG", "action": "create_subscriber_policy", "status": "pending" },
            { "seq": 4, "system": "RADIUS", "action": "push_user_profile", "status": "pending" },
            { "seq": 5, "system": "NMS", "action": "activate_monitoring", "status": "pending" },
          ],
          "metadata": {
            "sim_id": ctx.simId,
            "vlan": ctx.vlan,
            "order": orderNum(),
          },
        }, null, 2),
      },
    ],
  },

  // ── MPLS PE Router ──────────────────────────────────────────
  mpls_pe: {
    tabs: [
      {
        key: 'iosxr_vrf', label: 'IOS-XR VRF', lang: 'IOS',
        generate: (ctx) => {
          const vrfName = ctx.simId === 'add_midmarket' ? 'TECHVANTAGE-001' : ctx.simId === 'provision_evc' ? 'HARBOR-LOGISTICS-EVI' : `VRF-${hex(4)}`;
          const rd = `65001:${mplsLabel()}`;
          const rt = `65001:${mplsLabel()}`;
          return `! Cisco NCS / ASR — MPLS PE IOS-XR
! Generated: ${ts()} | Sim: ${ctx.simId}

! 1. VRF / EVPN instance
${ctx.simId === 'provision_evc' ? `l2vpn
 bridge group BG-EVC
  bridge-domain BD-${ctx.vlan}
   interface GigabitEthernet0/0/0/${randInt(1, 8)}.${ctx.vlan}
   !
   evi ${ctx.vlan}
  !
 !
!
evpn
 evi ${ctx.vlan}
  bgp
   route-target import ${rt}
   route-target export ${rt}
  !
  advertise-mac
 !
!` : `vrf ${vrfName}
  rd ${rd}
  address-family ipv4 unicast
    import route-target ${rt}
    export route-target ${rt}
  !
!

! 2. BGP VPNv4
router bgp 65001
  vrf ${vrfName}
    rd ${rd}
    address-family ipv4 unicast
      redistribute connected
      redistribute static
    !
  !
!

! 3. PE-CE interface
interface GigabitEthernet0/0/0/${randInt(1, 8)}.${ctx.vlan}
  encapsulation dot1q ${ctx.vlan}
  vrf ${vrfName}
  ip address ${randIP('10.' + randInt(1, 254))} 255.255.255.252
  no shutdown
!`}
commit`;
        },
      },
      {
        key: 'ldp', label: 'LDP / RSVP-TE', lang: 'IOS',
        generate: (ctx) => `! MPLS LDP + RSVP-TE — PE Config
! Generated: ${ts()} | Sim: ${ctx.simId}

mpls ldp
  router-id ${loopIP()}
  address-family ipv4
    discovery targeted-hello accept
  !
!

rsvp
  interface GigabitEthernet0/0/0/${randInt(1, 8)}
    bandwidth ${ctx.simId === 'add_midmarket' ? '5000000' : '1000000'} kbps
  !
!

mpls traffic-eng
  interface GigabitEthernet0/0/0/${randInt(1, 8)}
    admin-weight ${randInt(10, 100)}
    attribute-flag ${randInt(1, 255)}
  !
  tunnel-te ${randInt(100, 999)}
    destination ${loopIP()}
    bandwidth ${ctx.simId === 'add_midmarket' ? '5000000' : '1000000'} kbps
    path-option 1 dynamic
  !
!
commit`,
      },
    ],
  },

  // ── Border Router ───────────────────────────────────────────
  border_router: {
    tabs: [
      {
        key: 'bgp', label: 'BGP Config', lang: 'IOS',
        generate: (ctx) => `! Border Router — BGP / RPKI Config
! Generated: ${ts()} | Sim: ${ctx.simId}
! AS: 7029 (North Star Fiber)

router bgp 65001
  bgp router-id ${loopIP()}
  bgp log-neighbor-changes
  !
  ! Transit peers
  neighbor 198.51.100.1 remote-as 174   ! Cogent
  neighbor 198.51.100.5 remote-as 3356  ! Lumen
  neighbor 198.51.100.9 remote-as 2914  ! NTT
  !
  ${ctx.simId === 'add_midmarket' || ctx.simId === 'provision_dwdm' ? `
  ! ECMP paths updated after sim: ${ctx.simId}
  maximum-paths 4
  bgp bestpath as-path multipath-relax
  !` : ''}
  ! RPKI ROA validation
  neighbor 198.51.100.1 route-map RM-RPKI-VALIDATE in
  !
  address-family ipv4 unicast
    network 67.134.0.0 mask 255.255.0.0
    aggregate-address 67.134.0.0 255.255.0.0 summary-only
  !
  ! Route reflector clients
  neighbor ${loopIP()} remote-as 65001
    route-reflector-client
  !
!
commit`,
      },
      {
        key: 'rpki', label: 'RPKI Config', lang: 'IOS',
        generate: () => `! RPKI Origin Validation (RFC 6811)
! Generated: ${ts()}

router bgp 65001
  bgp rpki server tcp 198.51.100.253 port 3323
    transport tcp port 3323
    refresh-time 600
    response-time 60
  !
  bgp bestpath origin-as allow invalid
  !
  ! Route policy: drop RPKI invalid
  route-policy RP-RPKI-VALIDATE
    if validation-state is invalid then
      drop
    elseif validation-state is valid then
      set local-preference 200
    else
      set local-preference 100
    endif
  end-policy
  !
  neighbor 198.51.100.1 route-policy RP-RPKI-VALIDATE in
!
commit`,
      },
    ],
  },

  // ── Metro Cisco Router ──────────────────────────────────────
  metro_cisco: {
    tabs: [
      {
        key: 'isis_te', label: 'IS-IS / MPLS-TE', lang: 'IOS',
        generate: (ctx) => `! Metro Router Cisco 8000 — IS-IS TE
! Generated: ${ts()} | Sim: ${ctx.simId}

router isis CORE
  net 49.0001.${hex(4)}.${hex(4)}.${hex(4)}.00
  is-type level-2-only
  metric-style wide
  mpls traffic-eng router-id Loopback0
  mpls traffic-eng level-2
  !
  ${ctx.simId === 'provision_dwdm' ? `! IS-IS TE metric updated — new 100G λ added
  interface TenGigE0/0/0/${randInt(0, 7)}
    circuit-type level-2-only
    point-to-point
    address-family ipv4 unicast
      metric 10
      mpls ldp sync
    !
  !` : `! ECMP load balance — updated for sim: ${ctx.simId}
  address-family ipv4 unicast
    maximum-paths 4
  !`}
!
commit`,
      },
      {
        key: 'rsvp_te', label: 'RSVP-TE Tunnel', lang: 'IOS',
        generate: (ctx) => `! RSVP-TE Tunnel — Metro Cisco 8000
! Generated: ${ts()} | Sim: ${ctx.simId}

interface tunnel-te ${randInt(100, 999)}
  description "SIM-${ctx.simId.toUpperCase()}"
  ipv4 unnumbered Loopback0
  destination ${loopIP()}
  record-route
  priority 3 3
  bandwidth ${ctx.simId === 'add_midmarket' ? '5000000' : ctx.simId === 'provision_evc' ? '1000000' : '400000'} kbps
  path-option 1 dynamic
  !
  fast-reroute
    protect-type facility
  !
!

! BFD for MPLS-TE FRR
rsvp
  interface GigabitEthernet0/0/0/${randInt(0, 7)}
    bandwidth ${ctx.simId === 'provision_dwdm' ? '100000000' : '10000000'} kbps
  !
!
commit`,
      },
    ],
  },

  // ── Ciena WaveLogic / ROADM ─────────────────────────────────
  metro_ciena: {
    tabs: [
      {
        key: 'waveserver', label: 'Waveserver API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "Ciena Waveserver Ai — REST API",
          "timestamp": ts(),
          "simulation": ctx.simId,
          "operation": ctx.simId === 'provision_dwdm' ? "ADD_WAVELENGTH" : "OTN_PROTECTION_SWITCH",
          "endpoint": ctx.simId === 'provision_dwdm'
            ? "POST /api/v1/wavelength-services"
            : "POST /api/v1/protection/aps-switch",
          "payload": ctx.simId === 'provision_dwdm' ? {
            "wavelength_id": `WL-CH47-100G-${hex(4)}`,
            "channel": 47,
            "frequency_THz": 193.1,
            "modulation": "PM-QPSK",
            "fec": "SD-FEC-25",
            "line_rate_Gbps": 100,
            "src_port": `ROADM-SEA-LINE-${randInt(1, 8)}`,
            "dst_port": `ROADM-BEL-LINE-${randInt(1, 8)}`,
            "osnr_margin_dB": 8.4,
            "pre_fec_ber": "2.1e-4",
          } : {
            "protection_group": "OTN-BLSR-I90",
            "action": ctx.simId === 'otn_protection' ? "FORCE_SWITCH_TO_PROTECT" : "REVERT",
            "aps_k1_k2": "0xB1 0x01",
            "switch_time_ms": 38,
            "working_port": `LINE-WEST-${randInt(1, 4)}`,
            "protect_port": `LINE-EAST-${randInt(1, 4)}`,
          },
        }, null, 2),
      },
      {
        key: 'otn_xc', label: 'OTN Cross-Connect', lang: 'Config',
        generate: (ctx) => `# Ciena 6500-32 ROADM — OTN Cross-Connect
# Generated: ${ts()} | Sim: ${ctx.simId}

# Channel: ${ctx.simId === 'provision_dwdm' ? 'C47 (193.1 THz) — NEW 100G λ' : 'C38 (193.9 THz) — existing protected λ'}
# Line card: WaveLogic 5e coherent DSP

create otn-cross-connect \\
  name "XC-${ctx.simId.toUpperCase()}-${hex(4)}" \\
  ingress-port "WEST-LINE-PORT-${randInt(1, 8)}" \\
  egress-port "EAST-LINE-PORT-${randInt(1, 8)}" \\
  odu-type ODU4 \\
  framing OTU4 \\
  fec SD-FEC-25PCT-OVERHEAD \\
  tcm-level 1 \\
  pm-enable true

# Verify OSNR after commission:
show wavelength ch${ctx.simId === 'provision_dwdm' ? '47' : '38'} osnr
# Expected: > 16dB at receiver`,
      },
    ],
  },

  // ── Core Routers ────────────────────────────────────────────
  core_router_1: coreRouterConfig('Core-Router-1', 'NCS5504-A'),
  core_router_2: coreRouterConfig('Core-Router-2', 'NCS5504-B'),

  // ── DDoS Scrubbing ──────────────────────────────────────────
  ddos: {
    tabs: [
      {
        key: 'arbor', label: 'Arbor TMS', lang: 'Config',
        generate: (ctx) => `# Arbor TMS / Sightline — DDoS Profile
# Generated: ${ts()} | Sim: ${ctx.simId}

# BGP Flowspec mitigation rule
flowspec {
  rule MITIGATION-${ctx.simId.toUpperCase()}-${hex(4)} {
    match {
      destination ${ctx.simId === 'add_smb' ? '67.134.55.20/30' : ctx.simId === 'add_midmarket' ? '67.134.56.0/24' : '67.134.0.0/16'};
      protocol tcp udp;
    }
    action {
      rate-limit ${ctx.simId === 'add_midmarket' ? '6000' : '1200'} Mbps;
      redirect vrf SCRUBBING;
    }
    threshold {
      bps ${ctx.simId === 'add_midmarket' ? '5500000000' : '1100000000'};
      pps 1000000;
      auto-detect true;
    }
  }
}

# Sightline managed object
managed-object ${ctx.simId.includes('midmarket') ? 'ENTERPRISE' : 'RESIDENTIAL'}-${hex(4)} {
  cidr ${ctx.simId === 'add_midmarket' ? '67.134.56.0/24' : '67.134.55.0/24'};
  bandwidth-threshold 80%;
  alert-level high;
  auto-mitigate true;
}`,
      },
    ],
  },

  // ── NMS / NOC ───────────────────────────────────────────────
  nms: {
    tabs: [
      {
        key: 'snmp', label: 'SNMP / YANG', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "NMS — YANG Telemetry Subscription",
          "timestamp": ts(),
          "simulation": ctx.simId,
          "subscriptions": [
            {
              "sub_id": randInt(1000, 9999),
              "target_node": ctx.simId.includes('olt') ? "OLT-1" : ctx.simId.includes('bng') ? "BNG-ASR" : "ALL",
              "yang_module": "Cisco-IOS-XR-infra-statsd-oper",
              "xpath": "/interfaces/interface/statistics",
              "period_ms": 30000,
              "encoding": "GPB-KV",
              "transport": "gRPC-TLS",
              "destination": "nms.northstarfiber.net:57500",
            },
            {
              "sub_id": randInt(1000, 9999),
              "yang_module": "openconfig-platform",
              "xpath": "/components/component/state",
              "period_ms": 60000,
              "encoding": "JSON-IETF",
              "transport": "gRPC-TLS",
            },
          ],
          "alert_policy": {
            "simulation": ctx.simId,
            "threshold_capacity": 80,
            "pagerduty_key": "northstar-noc-oncall",
            "escalation_minutes": 5,
          },
        }, null, 2),
      },
    ],
  },

  // ── CRM ─────────────────────────────────────────────────────
  crm: {
    tabs: [
      {
        key: 'api', label: 'CRM API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "_comment": "CRM — Customer Record Creation",
          "timestamp": ts(),
          "simulation": ctx.simId,
          "endpoint": "POST /api/v1/customers",
          "payload": {
            "customer_id": `CUST-${orderNum()}`,
            "type": ctx.simId === 'add_residential' ? 'Residential' : ctx.simId === 'add_smb' ? 'Small Business' : 'Enterprise',
            "service_tier": ctx.simId === 'add_midmarket' ? '5G MPLS L3VPN' : ctx.simId === 'add_smb' ? '1G Business' : '1G Residential',
            "status": "provisioning",
            "sla": ctx.simId === 'add_midmarket' ? '99.99%' : ctx.simId === 'add_smb' ? '99.9%' : '99.5%',
            "billing_cycle": "monthly",
            "auto_provision": true,
            "sim_id": ctx.simId,
          },
        }, null, 2),
      },
    ],
  },

  // ── Billing ─────────────────────────────────────────────────
  billing: {
    tabs: [
      {
        key: 'api', label: 'Billing API', lang: 'JSON',
        generate: (ctx) => {
          const mrr = ctx.simId === 'add_midmarket' ? 4200 : ctx.simId === 'add_smb' ? 299 : 79;
          const plan = ctx.simId === 'add_midmarket' ? 'Enterprise 5G MPLS' : ctx.simId === 'add_smb' ? 'Business 1Gbps' : 'Residential 1Gbps';
          return JSON.stringify({
            "_comment": "Billing System — Plan Activation",
            "timestamp": ts(),
            "order_id": orderNum(),
            "simulation": ctx.simId,
            "endpoint": "POST /api/v1/subscriptions",
            "payload": {
              "plan": plan,
              "mrr": mrr,
              "currency": "USD",
              "billing_cycle": "monthly",
              "start_date": new Date().toISOString().slice(0, 10),
              "sla_credits_enabled": ctx.simId !== 'add_residential',
              "auto_invoice": true,
              "vlan": ctx.vlan,
            },
          }, null, 2);
        },
      },
    ],
  },

  // ── PTP/NTP ─────────────────────────────────────────────────
  ptp_ntp: {
    tabs: [
      {
        key: 'ptp', label: 'PTP / SyncE', lang: 'Config',
        generate: (ctx) => `# IEEE 1588v2 PTP + SyncE Config
# Generated: ${ts()} | Sim: ${ctx.simId}

ptp clock ordinary domain 0
 clock-port SLAVE
  transport ipv4 unicast
  master ${loopIP()}
 !
!

! SyncE (G.8261/G.8262) — enabled on UNI port
interface GigabitEthernet0/0/0/${randInt(0, 7)}
  synchronous mode
  esmc process
  ptp enable
!

! PTP profile: ${ctx.simId === 'provision_evc' ? 'MEF CE 2.0 (G.8265.1)' : 'Telecom (G.8275.1)'}
ptp profile ${ctx.simId === 'provision_evc' ? 'g82651' : 'g82751'}
  clock two-step
  delay-mechanism e2e
  transport ipv4 unicast
!
commit`,
      },
    ],
  },

  // ── Fallback for unrecognized nodes ─────────────────────────
  _default: {
    tabs: [
      {
        key: 'info', label: 'Event Info', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "timestamp": ts(),
          "simulation": ctx.simId,
          "active_node": ctx.nodeId,
          "step_action": ctx.action,
          "system": ctx.system,
          "detail": ctx.detail,
          "note": "No device-specific config template for this node type. See event log for details.",
        }, null, 2),
      },
    ],
  },
};

// ── Shared generators ─────────────────────────────────────────
function calixOLTConfig(oltName) {
  return {
    tabs: [
      {
        key: 'calix_cli', label: 'Calix CLI', lang: 'IOS',
        generate: (ctx) => {
          const ponPort = `1/1/${randInt(1, 8)}`;
          const ontId = randInt(1, 128);
          const sn = ontSN();
          const isAug = ctx.simId === 'capacity_augment';
          const isSMB = ctx.simId === 'add_smb';
          const bwProfile = isSMB ? 'BW-1G-BUSINESS' : 'BW-1G-RESIDENTIAL';
          return `! Calix E7-2 ${oltName} — Auto-Generated Config
! Generated: ${ts()}
! Simulation: ${ctx.simId}
! ═══════════════════════════════════════════

${isAug ? `! ── CAPACITY AUGMENTATION: New OLT-3 uplink ──
! Step 1: Activate uplink port to Agg-Switch
interface ethernet 0/1
  description "Agg-Switch port-17 uplink — augmentation"
  speed 10G
  no shutdown
  service-port vlan-range 1060-1080
!

! Step 2: Pre-stage 48 PON ports
interface gpon-olt 1/1/1 to 1/1/8
  no shutdown
  profile XGS-PON-SUBSCRIBER
  bandwidth-profile BW-POOL-DEFAULT
!` : `! ── ${isSMB ? 'BUSINESS' : 'RESIDENTIAL'} ONT PROVISIONING ──
! PON port: ${ponPort}
interface gpon-olt ${ponPort}
  no shutdown
  !
  ! Add ONT with factory serial number
  ont add pon ${ponPort} ont-id ${ontId} \\
    sn ${sn} \\
    profile ${isSMB ? 'XGS-PON-BUSINESS' : 'XGS-PON-SUBSCRIBER'} \\
    desc "${isSMB ? 'Business' : 'Residential'} ONT — auto-provisioned"
  !
  ! Upstream / downstream bandwidth profiles
  service-flow upstream bandwidth-profile ${bwProfile}
  service-flow downstream bandwidth-profile ${bwProfile}
  !
  ! S-VLAN service mapping
  vlan ${ctx.vlan} cvlan 100 service ont-id ${ontId}
  !`}
commit`;
        },
      },
      {
        key: 'calix_cloud', label: 'Calix Cloud API', lang: 'JSON',
        generate: (ctx) => JSON.stringify({
          "timestamp": ts(),
          "olt": oltName,
          "operation": ctx.simId === 'capacity_augment' ? "AUGMENT_CAPACITY" : "PROVISION_ONT",
          "pon_port": `1/1/${randInt(1, 8)}`,
          "ont": {
            "sn": ontSN(),
            "ont_id": randInt(1, 128),
            "profile": ctx.simId === 'add_smb' ? "XGS-PON-BUSINESS" : "XGS-PON-RESIDENTIAL",
            "svlan": ctx.vlan,
            "bw_profile": ctx.simId === 'add_smb' ? "BW-1G-BUSINESS" : "BW-1G-RESIDENTIAL",
          },
        }, null, 2),
      },
    ],
  };
}

function coreRouterConfig(name, chassis) {
  return {
    tabs: [
      {
        key: 'isis', label: 'IS-IS / OTN', lang: 'IOS',
        generate: (ctx) => `! ${name} (${chassis}) — Core Routing
! Generated: ${ts()} | Sim: ${ctx.simId}

${ctx.simId === 'provision_dwdm' ? `! ── NEW 100G λ ACTIVATION ──
! OTN line card brought up on new wavelength ch47
controller Optics0/${randInt(0, 3)}/0/${randInt(0, 7)}
  transmit-power -2
  rx-los-threshold -20
  cd-min -2000 cd-max 4000
  description "100G λ ch47 — Ciena 6500 ROADM"
  no shutdown
!
interface HundredGigE0/${randInt(0, 3)}/0/${randInt(0, 7)}
  description "DWDM ch47 — I-90 backbone new λ"
  ipv4 address ${loopIP()} 255.255.255.252
  cdp enable
  no shutdown
!` : ctx.simId === 'otn_protection' ? `! ── OTN BLSR PROTECTION SWITCH ──
otn
  g709 enable
  protection-switching
    aps-channel K1 0xB1 K2 0x01
    switch-type bidirectional-ring
    revert-time 600
    wait-to-restore 600
  !
  pm threshold oci performance-monitoring
    oci near-end 15-min threshold 0
  !
!
commit` : `! ── STANDARD ROUTING UPDATE (${ctx.simId}) ──
router isis CORE
  address-family ipv4 unicast
    maximum-paths 4
    redistribute static level-2
  !
!
commit`}`,
      },
      {
        key: 'mpls', label: 'MPLS Labels', lang: 'IOS',
        generate: (ctx) => `! MPLS Label Distribution — ${name}
! Generated: ${ts()} | Sim: ${ctx.simId}

mpls ldp
  router-id ${loopIP()}
  session protection
  address-family ipv4
    discovery targeted-hello accept
  !
!

! Label range for sim: ${ctx.simId}
mpls label range ${mplsLabel()} ${mplsLabel()}

! BFD for LDP sessions
mpls ldp
  neighbor ${loopIP()} password encrypted ${hex(16)}
  bfd
    interface GigabitEthernet0/${randInt(0, 3)}/0/${randInt(0, 7)}
      bfd multiplier 3
      bfd minimum-interval 300
    !
  !
!
commit`,
      },
    ],
  };
}

// ── Config tab lookup ─────────────────────────────────────────
export function getNodeConfig(nodeId) {
  return NODE_CONFIGS[nodeId] || NODE_CONFIGS._default;
}
