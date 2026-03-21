// MPLS-TE tunnel config generators — vendor-accurate per-tunnel CLI configs.

const POP_LOOPBACKS = {
  SEA: '10.0.0.1',
  PDX: '10.0.0.2',
  BEL: '10.0.0.3',
  EVR: '10.0.0.4',
  OLY: '10.0.0.5',
  SPO: '10.0.0.6',
  SFO: '10.0.0.7',
};

function parseHops(tunnel) {
  const hops = tunnel.path.split('→');
  const hop1 = POP_LOOPBACKS[hops[1]] ?? POP_LOOPBACKS[hops[0]];
  const hop2 = POP_LOOPBACKS[hops[2]] ?? POP_LOOPBACKS[hops[1]] ?? POP_LOOPBACKS[hops[0]];
  return { hop1Ip: hop1, hop2Ip: hop2 };
}

export function getTunnelConfigs(tunnel) {
  const srcLoopback = POP_LOOPBACKS[tunnel.src] ?? '10.0.0.1';
  const dstLoopback = POP_LOOPBACKS[tunnel.dst] ?? '10.0.0.2';
  const { hop1Ip, hop2Ip } = parseHops(tunnel);
  const bwMbps = tunnel.bw * 1000;
  const subPoolMbps = Math.round(bwMbps * 0.8);
  // Derive a stable tunnel number from the tunnel id string
  const tunnelNum = 100 + tunnel.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 400;

  return [
    {
      key: 'iosxr',
      label: 'Cisco IOS-XR',
      lang: 'ios-xr',
      config: `!! === Cisco IOS-XR — MPLS-TE Tunnel Config ===
!! Tunnel: ${tunnel.id}   ${tunnel.src}→${tunnel.dst}   BW: ${tunnel.bw}G
!! Path: ${tunnel.path}   RSVP: ${tunnel.rsvp}
!!
explicit-path name EP-${tunnel.src}-${tunnel.dst}-WORKING
 index 1 next-address strict ${hop1Ip}
 index 2 next-address strict ${hop2Ip}
 index 3 next-address strict ${dstLoopback}
!
interface tunnel-te ${tunnelNum}
 description *** TE ${tunnel.src}→${tunnel.dst} ${tunnel.bw}G RSVP ***
 ipv4 unnumbered Loopback0
 destination ${dstLoopback}
 signalled-bandwidth ${bwMbps}
 path-option 1 explicit name EP-${tunnel.src}-${tunnel.dst}-WORKING
 path-option 2 dynamic
 bfd fast-detect
 fast-reroute
 record-route
 priority 4 4
!
rsvp
 interface TenGigE0/0/0/1
  bandwidth ${bwMbps} sub-pool ${subPoolMbps}
 !
!
mpls traffic-eng
 reoptimize 300
 path-selection metric igp
 auto-bw
  interface tunnel-te ${tunnelNum}
   overflow-limit max-move-bw ${bwMbps} min-move-bw 10000 limit 3
  !
 !
!`,
    },
    {
      key: 'junos',
      label: 'Juniper JunOS',
      lang: 'junos',
      config: `## === Juniper JunOS — MPLS-TE LSP Config ===
## Tunnel: ${tunnel.id}   ${tunnel.src}→${tunnel.dst}   BW: ${tunnel.bw}G
##
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst}
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst} from ${srcLoopback}
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst} to ${dstLoopback}
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst} bandwidth ${bwMbps}
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst} primary PATH-${tunnel.src}-${tunnel.dst}-WK
set protocols mpls label-switched-path LSP-${tunnel.src}-${tunnel.dst} secondary PATH-${tunnel.src}-${tunnel.dst}-PROT

set protocols mpls path PATH-${tunnel.src}-${tunnel.dst}-WK ${hop1Ip} strict
set protocols mpls path PATH-${tunnel.src}-${tunnel.dst}-WK ${hop2Ip} strict

set protocols rsvp interface ge-0/0/0
set protocols rsvp interface ge-0/0/0 bandwidth ${bwMbps}
set protocols rsvp interface ge-0/0/0 aggregate
set protocols rsvp interface ge-0/0/0 no-node-id-subobject

set protocols mpls fast-reroute
set protocols mpls optimize-timer 300`,
    },
    {
      key: 'sros',
      label: 'Nokia SR OS',
      lang: 'sros',
      config: `# === Nokia SR OS — MPLS TE LSP Config ===
# Tunnel: ${tunnel.id}   ${tunnel.src}→${tunnel.dst}   BW: ${tunnel.bw}G
#
configure router
  mpls
    path "PATH-${tunnel.src}-TO-${tunnel.dst}-WK" no-shutdown
      hop 1 ${hop1Ip} strict
      hop 2 ${hop2Ip} strict
    exit
    lsp "LSP-${tunnel.id}" to ${dstLoopback} no-shutdown
      type p2p-rsvp
      bandwidth ${bwMbps}
      primary "PATH-${tunnel.src}-TO-${tunnel.dst}-WK"
        bandwidth ${bwMbps}
        hop-limit 10
        cspf
        fast-reroute
          frr-method facility
          hop-limit 16
        exit
      exit
      no shutdown
    exit
  exit
  rsvp
    interface "To-${tunnel.dst}"
      bandwidth ${bwMbps}
    exit
  exit
exit`,
    },
  ];
}
