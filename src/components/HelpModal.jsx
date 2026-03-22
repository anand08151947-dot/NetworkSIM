import { useState } from "react";

// ─── Help content per tab ────────────────────────────────────────────────────
// Each tab has sections; sections have: heading, icon, body (supports **bold**)
const HELP_CONTENT = {
  topology: {
    title: "🗺️ Network Topology",
    subtitle: "Interactive ISP Network Simulation Canvas",
    color: "#00d4ff",
    sections: [
      {
        heading: "What Is This?",
        icon: "🧭",
        body: `The Network Topology tab is a live, interactive canvas modeling the complete
end-to-end infrastructure of NorthStar Fiber — a hypothetical Pacific Northwest fiber ISP.
Every node on the canvas represents a real class of network device, and every animated edge
represents an active traffic flow or provisioning event.

The canvas spans **7 distinct network layers**: Customer Premises (ONT/CPE), Access (OLT/DSLAM),
Aggregation, Core MPLS, Data Center / BNG, Peering, and Management Plane. Together they form
a production-accurate model of how packets travel from a customer's home to the internet.

There are **30+ nodes** and **8 provisioning simulations** plus **8 fault scenarios** — all
fully animated with step-by-step event logs and auto-generated CLI configs.`,
      },
      {
        heading: "Why Does It Matter?",
        icon: "💡",
        body: `Understanding the full topology is critical for:
• **CAPEX planning** — identifying where the next capacity upgrade must go before saturation
• **Fault impact analysis** — knowing which customers lose service when a node fails
• **Provisioning readiness** — checking whether spare capacity exists end-to-end before
  activating a new circuit or customer
• **Training** — giving NOC engineers and sales engineers a mental model of the network

Without a topology view, operators work blind. Every provisioning decision, every incident,
and every capacity forecast depends on knowing where nodes sit and how they connect.

The simulation bridges theory and practice — each animated step corresponds to a real
command, protocol event, or hardware action that would happen in a production ISP.`,
      },
      {
        heading: "How the Engine Works",
        icon: "⚙️",
        body: `The simulation engine drives every animation on the canvas:

**Provisioning Flows** animate the step-by-step signaling path of real workflows. Each flow
defines an ordered list of (node, action) pairs. As each step executes, the targeted node
pulses blue and the Event Log records the action with a timestamp.

**Fault Injection** models failure modes: fiber cuts, power outages, BGP route flaps, DDoS
storms, and hardware crashes. Each fault triggers cascading status changes across dependent
nodes, then auto-generates a remediation timeline showing mean-time-to-restore (MTTR).

**Capacity Dynamics**: Every node carries a capacity % that rises under simulation load.
At 55% the node turns **amber** (warning); above 80% it turns **red** (critical) — exactly
mirroring how a real NOC dashboard like Zabbix or SolarWinds would display thresholds.

**Speed Control**: The sim speed slider multiplies or divides the step interval. Slow it to
0.5× to study each step's config; run at 3× to watch a full provisioning in 10 seconds.`,
      },
      {
        heading: "Sim: Add Residential Customer",
        icon: "🏠",
        body: `**Simulation name**: "Add Residential Customer (1G)"
**What it models**: The complete activation sequence for a new 1 Gbps fiber-to-the-home
subscriber — from ONT power-on through internet connectivity.

**Step sequence**:
1. ONT power-on → optical signal detection on PON port
2. OMCI (ONT Management & Control Interface) provisioning — ONT registers with OLT
3. OLT creates a T-CONT (transmission container) and GEM port for this subscriber
4. OLT uplinks to Aggregation Switch — VLAN tagged (subscriber S-VLAN)
5. BNG (Broadband Network Gateway) creates a subscriber session
6. RADIUS authentication — BNG sends Access-Request; AAA returns Access-Accept with policy
7. DHCP — BNG assigns IP from the residential IP pool; DNS servers pushed to CPE
8. BGP — the subscriber's /32 route is redistributed into the ISP's internal BGP
9. QoS policy applied — 1 Gbps downstream / 1 Gbps upstream shaper
10. Activation confirmation — subscriber is online; billing system notified

**Why it matters**: This is the most common provisioning event in any FTTH ISP — hundreds
per day. A broken step at any point leaves a customer offline and generates a truck roll.`,
      },
      {
        heading: "Sim: Upgrade Customer Tier",
        icon: "⬆️",
        body: `**Simulation name**: "Upgrade Customer: 1G → 2G"
**What it models**: A live speed upgrade for an existing subscriber without disconnecting them.

**The challenge**: A tier upgrade must atomically swap the QoS policy on the BNG without
dropping the BGP session or DHCP lease. If done incorrectly it causes a brief outage.

**Step sequence**:
1. Service order validated in BSS (Business Support System)
2. BNG session identified by subscriber MAC / Circuit-ID
3. CoA (Change of Authorization) RADIUS packet sent — updates the session policy mid-flight
4. QoS shaper on BNG updated from 1G to 2G downstream / upstream
5. OLT GEM port upstream bandwidth profile updated to match new tier
6. Billing system notified of tier change and effective timestamp
7. Confirmation event logged; customer-facing portal updates

**Why it matters**: ISPs process thousands of tier upgrades monthly — especially after
promotional campaigns. Automating this without a service interruption is a key differentiator
for subscriber experience (and prevents negative reviews about "upgrade outages").`,
      },
      {
        heading: "Sim: Add Small Business",
        icon: "🏢",
        body: `**Simulation name**: "Add Small Business (1G Ethernet)"
**What it models**: Provisioning a business Ethernet service for a small-to-medium business
(SMB), delivered over fiber with a static IP block and a business-grade SLA.

**Key differences from residential**:
• Static IP block (typically /29 or /28) — pre-allocated from IPAM
• Dedicated VLAN — isolated from residential subscribers on the aggregation switch
• BGP prefix — SMB's IP block announced as a dedicated route (not summarized)
• SLA policy — business QoS tier with guaranteed burst and priority queuing
• CPE config — managed router (Cisco ISR or Juniper SRX) provisioned via TR-069 or ZTP

**Step sequence**:
1. IP block allocated from IPAM and assigned to the circuit
2. OLT/aggregation switch: dedicated S-VLAN provisioned
3. BNG: static session created (no DHCP — static IPs sent via RADIUS VSA)
4. BGP: /28 prefix added to ISP's internal BGP and advertised to upstreams
5. QoS policy: business tier applied (higher burst, priority DSCP marking)
6. CPE ZTP (Zero Touch Provisioning): device contacts provisioning server, downloads config
7. End-to-end test: BNG pings CPE LAN interface; latency and loss verified`,
      },
      {
        heading: "Sim: Add Mid-Market MPLS L3VPN",
        icon: "🏗️",
        body: `**Simulation name**: "Add Mid-Market (5G MPLS L3VPN)"
**What it models**: Full MPLS L3VPN provisioning for a mid-market enterprise customer with
multiple sites that need to communicate over a private, isolated WAN.

**This is the most complex provisioning flow** — it touches 7 different systems:

**Step sequence**:
1. Service order: A-site, Z-site, VRF name, route targets, bandwidth defined
2. IPAM: /30 IP blocks allocated for each CE-PE link; loopbacks assigned
3. PE Router (A-side): VRF created, import/export route targets configured
4. PE Router (Z-side): matching VRF and route targets
5. CE router (customer): BGP session configured toward PE (AS override if needed)
6. MP-BGP: VPNv4 route exchange between PEs via Route Reflector
7. MPLS LSP: RSVP-TE or LDP label switched path verified end-to-end
8. QoS: DSCP markings mapped to MPLS EXP bits for traffic prioritization
9. SLA: latency/loss thresholds activated in monitoring system
10. Customer portal notified; circuit handed off to activation testing

**Why it matters**: L3VPN is the backbone of enterprise connectivity revenue. A misconfigured
route target means two sites can't communicate — and the enterprise's business halts.`,
      },
      {
        heading: "Sim: Capacity Auto-Augment",
        icon: "📈",
        body: `**Simulation name**: "Capacity Threshold → Auto-Augment (40%)"
**What it models**: The automated capacity planning workflow triggered when a node reaches
a defined utilization threshold — before it causes service degradation.

**The concept**: Reactive capacity management (buying hardware after a node is already
overloaded) causes outages. Proactive augmentation triggers at 40% utilization — leaving
a long runway for procurement, delivery, and installation before the node hits 80%.

**Step sequence**:
1. Capacity monitor detects node at 40% threshold (configurable trigger point)
2. Alert generated → ITSM ticket auto-created with node details and growth trend
3. Growth model runs: projects the date the node will hit 80% at current growth rate
4. CAPEX request auto-drafted: equipment type, quantity, lead time, cost
5. Procurement workflow triggered: PO sent to vendor (Calix, Nokia, Cisco)
6. Installation scheduled in field work management system
7. Pre-staging: new hardware configured in lab, tested against production config
8. Maintenance window: cutover executed; capacity metrics reset; monitoring updated

**Why it matters**: Unplanned augmentation is 3–5× more expensive than planned. This
simulation demonstrates the "shift left" philosophy — fixing problems before customers feel them.`,
      },
      {
        heading: "Sim: Provision EVC / E-Line",
        icon: "🔶",
        body: `**Simulation name**: "Provision EVC / E-Line (MEF CE 2.0)"
**What it models**: A MEF-standard Carrier Ethernet point-to-point service — the most
common product sold to business customers requiring transparent LAN extension.

**MEF CE 2.0 compliance** means this service must pass strict bandwidth profile, frame
delay, frame delay variation (jitter), and frame loss ratio parameters.

**Step sequence**:
1. Service order: A-UNI and Z-UNI locations, bandwidth profile (CIR/CBS/EIR/EBS), CoS
2. Aggregation switches: C-VLAN and S-VLAN tagged; QinQ (802.1ad) encapsulation configured
3. Metro Ethernet switches: EVC created end-to-end with matching VLAN translation maps
4. Bandwidth profile: MEF traffic conditioner applied (token bucket: CIR = committed rate)
5. CoS (Class of Service): DSCP or PCP bits mapped to MEF performance objectives
6. OAM (Operations, Administration, Maintenance): IEEE 802.3ah and 802.1ag CFM enabled —
   this is how the carrier monitors the EVC health remotely
7. Y.1564 service activation test: 2-step test (configuration + performance) executed
8. Service handed off with RFC 2544 test report attached

**Why it matters**: EVC is the workhorse of business Ethernet — ISPs sell thousands of
E-Line circuits. MEF compliance is contractually required for wholesale and enterprise deals.`,
      },
      {
        heading: "Sim: Commission DWDM Wavelength",
        icon: "🌊",
        body: `**Simulation name**: "Commission DWDM Wavelength (100G λ)"
**What it models**: Bringing up a 100G optical wavelength (lambda) on a Dense Wavelength
Division Multiplexing (DWDM) system — the physical foundation of all long-haul capacity.

**Why DWDM**: A single fiber can carry 80–96 wavelengths simultaneously (C-band DWDM).
Each wavelength is a separate 100G or 400G data channel. This is how ISPs scale backbone
capacity without laying new fiber — they add wavelengths instead.

**Step sequence**:
1. Wavelength assignment: ITU-T grid channel selected (193.1 THz, 50GHz spacing)
2. Optical power budget calculated: Tx power − fiber loss − connector loss = Rx margin
3. ROADM (Reconfigurable Optical Add/Drop Multiplexer) programmed: add port → line port
4. Transponder configured: FEC (Forward Error Correction) mode, modulation (DP-QPSK for 100G)
5. Optical amplifiers (EDFA) gain settings adjusted along the span
6. BER (Bit Error Rate) measurement: must be < 1×10⁻¹² after FEC
7. OSNR (Optical Signal-to-Noise Ratio) measured: must be > 18 dB for 100G DP-QPSK
8. Client-side interfaces (100GE) brought up on the transponder
9. Routing protocol (ISIS-TE or OSPF-TE) updated with new link bandwidth

**Why it matters**: A misconfigured DWDM wavelength can cause chromatic dispersion
that corrupts data on adjacent channels — taking down capacity beyond the new circuit.`,
      },
      {
        heading: "Sim: OTN Protection Ring Test",
        icon: "🔁",
        body: `**Simulation name**: "OTN Protection Ring Test (BLSR Failover)"
**What it models**: A Bidirectional Line Switched Ring (BLSR) protection test on an
OTN (Optical Transport Network) ring — the most critical resiliency mechanism in the ISP's
optical backbone.

**What is BLSR?**: A 4-fiber ring where half the capacity is reserved as protection.
When a span fails, traffic switches to the protection fibers in <50ms — the ITU-T G.841
requirement that defines "carrier grade."

**Step sequence**:
1. Ring topology verified: all nodes report "idle" protection state
2. Test initiates a simulated span failure (fiber cut between Node A and Node B)
3. APS (Automatic Protection Switching) protocol triggers — both ring ends detect signal loss
4. K-byte (APS protocol bytes) exchanged between ring nodes within 1 frame (<125μs)
5. Traffic switches to protection path in the reverse ring direction
6. Switch time measured: must be <50ms from fault detection to traffic restoration
7. Traffic verified on protection path: BER and throughput confirmed nominal
8. Reversion test: original span "restored" → traffic switches back to working path
9. Ring returns to idle state; all nodes report healthy

**Why it matters**: Every financial institution, hospital, and data center customer
demands <50ms protection switching. This test validates it works before a real fiber cut.`,
      },
      {
        heading: "Fault: Fiber Cut — Primary Path",
        icon: "✂️",
        body: `**Fault scenario**: "🔴 Fiber Cut — Primary Path"
**What it models**: A physical fiber break on the primary backbone link — the single most
common cause of major ISP outages (backhoe, construction, rodent damage).

**Blast radius**: All traffic transiting the cut span loses connectivity immediately.
For NorthStar's ring topology, automatic protection switching kicks in within 50ms.
For non-protected spans, traffic is black-holed until a manual fiber repair is complete
(median MTTR: 4–8 hours for buried fiber).

**Simulation sequence**:
1. Link loss detected by DWDM transponder → LOS (Loss of Signal) alarm raised
2. OTN ring triggers BLSR protection switching (<50ms)
3. Routing protocol (ISIS or OSPF) detects link down → re-advertises topology change
4. BGP sessions over the affected link may flap if the protection path adds latency
5. NOC alarm: P1 incident created; on-call engineer paged
6. OTDR (Optical Time-Domain Reflectometer) dispatched: identifies break location to ±2m
7. Field tech dispatched; splice truck en route
8. Fiber repaired, tested, and restored; protection path reverted; ring back to idle

**What to watch**: The cascading red status spreading from the cut point outward, then
the recovery animation as the protection path lights up green.`,
      },
      {
        heading: "Fault: OLT Hardware Failure",
        icon: "⚡",
        body: `**Fault scenario**: "⚡ OLT-1 Hardware Failure"
**What it models**: A sudden crash of an OLT (Optical Line Terminal) — the device that
aggregates up to 512 fiber subscribers per chassis. When it fails, every subscriber
connected to it loses all service simultaneously.

**Why OLT failures are severe**: Unlike a router crash (which may failover in seconds),
an OLT manages the optical layer. Subscribers can't reconnect until the OLT reboots
or a spare is swapped in — typical restore time: 15–45 minutes.

**Simulation sequence**:
1. OLT watchdog timeout → chassis reboots (or hardware fault = no reboot)
2. All PON ports go dark → 512 ONTs lose upstream signal simultaneously
3. Mass alarm storm: 512 "subscriber offline" events flood the NOC in seconds
4. Alarm correlation: NOC tool groups all 512 alarms to the single OLT parent alarm
5. NOC engineer dispatched to CO with spare linecard or spare OLT chassis
6. Hardware replaced; OLT boots; PON ports come up sequentially
7. Each ONT re-registers via OMCI; RADIUS sessions re-established
8. BNG: subscriber sessions re-created (if DHCP lease still valid, same IP assigned)
9. Monitoring clears; customer care team notified for any persistent issues

**What to watch**: The mass simultaneous node state change from green to red across all
downstream nodes when the OLT crashes — then sequential green restoration as it recovers.`,
      },
      {
        heading: "Fault: DDoS Attack 80Gbps",
        icon: "🛡️",
        body: `**Fault scenario**: "🛡️ DDoS Attack — 80Gbps Volumetric"
**What it models**: A volumetric Distributed Denial-of-Service attack targeting a customer
or the ISP's own infrastructure — generating traffic at a volume that saturates links.

**80 Gbps in context**: A typical NorthStar Fiber 10G metro link is saturated 8× over.
Even a 100G backbone link would be at 80% utilization from a single attack.

**Simulation sequence**:
1. Traffic anomaly detected: a single destination IP is receiving 80Gbps (baseline: <1Gbps)
2. NetFlow/sFlow analysis confirms: attack vectors (UDP flood, SYN flood, DNS amplification)
3. Source analysis: attack originates from 50,000+ IPs (botnet — no single source to block)
4. RTBH (Remotely Triggered Black Hole) routing activated: victim IP advertised as /32 with
   blackhole community — all ISP upstream peers drop traffic before it enters the network
5. Alternatively: Scrubbing center activated — traffic diverted to DDoS mitigation
   appliances; legitimate traffic re-injected, attack traffic dropped
6. BGP FlowSpec: fine-grained traffic filter pushed to all edge routers in real time
7. Attack subsides or is mitigated; RTBH route withdrawn; normal routing restored
8. Post-incident: traffic profile captured for threat intelligence feed

**What to watch**: The peering router and BNG nodes turning critical (red) as they absorb
the attack volume, then recovering once RTBH or scrubbing is activated.`,
      },
      {
        heading: "Fault: BGP Session Drop",
        icon: "📡",
        body: `**Fault scenario**: "📡 BGP Session Drop — IXP Peer"
**What it models**: Loss of a BGP peering session at an Internet Exchange Point (IXP) —
causing NorthStar's prefixes to be withdrawn from that peer's routing table, and that
peer's routes to disappear from NorthStar's view.

**BGP Hold Timer**: BGP sessions drop when keepalives are missed for the hold timer period
(typically 90 seconds with a 30-second keepalive interval). Traffic to/from the affected
peer is black-holed for up to 90 seconds before BGP detects the session is down.

**Simulation sequence**:
1. BGP keepalive missed on IXP peer session
2. Hold timer countdown: 90 seconds of black-holing for traffic to/from this peer
3. Hold timer expires → BGP NOTIFICATION sent (or TCP session resets)
4. All routes received from this peer withdrawn from NorthStar's routing table
5. NorthStar's prefixes withdrawn from the peer's routing table → NorthStar unreachable via this path
6. Alternate path: traffic reroutes via transit providers (higher cost, higher latency)
7. NOC alert: BGP peer down; on-call engineer investigates
8. Root cause: IXP switch port error / peer router maintenance / misconfiguration
9. Session re-established; routes re-advertised; traffic returns to optimal path

**Why it matters**: A single IXP session drop can increase latency for millions of users
by 20–50ms as traffic reroutes through transit instead of direct peering.`,
      },
      {
        heading: "Fault: CO Power Outage",
        icon: "🔋",
        body: `**Fault scenario**: "🔋 CO Power Outage — Seattle CO-1"
**What it models**: A complete loss of utility power at a Central Office — the hardest
fault to recover from because it affects all equipment in that facility simultaneously.

**Why CO power is critical**: A Central Office may house: 2–4 OLTs, core routers, DWDM
equipment, BNG, and aggregation switches. When it loses power, every subscriber in that
CO's footprint loses service simultaneously.

**Simulation sequence**:
1. Utility power fails → UPS (Uninterruptible Power Supply) takes over seamlessly
2. Generator start sequence: 10–30 second delay before generator reaches full load
3. Transfer switch activates: CO runs on generator power (typically 48–72hr runtime)
4. Critical alarm: utility power loss logged; facilities team alerted
5. If generator fails to start: battery runtime = 4–8 hours depending on CO load
6. Battery voltage drops → non-critical loads shed (office lighting, HVAC reduced)
7. At battery critical threshold: controlled shutdown of non-essential network equipment
8. Core routing preserved as long as possible (priority power)
9. Utility restores → transfer switch returns to mains → equipment brought back online
10. Full recovery: RADIUS sessions, BGP sessions, OLT PON ports all re-established

**What to watch**: The wave of node state changes from green→amber (on generator)→red
(battery critical) cascading through all devices in the CO.`,
      },
      {
        heading: "Fault: OTN Ring APS Switchover",
        icon: "🌊",
        body: `**Fault scenario**: "🌊 OTN Ring APS — Protection Switchover"
**What it models**: An Automatic Protection Switching event on the OTN ring — where a
degraded (but not fully cut) span triggers protection switching due to BER exceeding threshold.

**APS vs. hard fault**: Unlike a fiber cut (immediate LOS), a degraded span may show
increasing BER (bit errors) due to fiber bend, dirty connectors, or EDFA gain imbalance.
APS triggers on BER > 10⁻³ (before errors impact traffic) — a proactive protection switch.

**Simulation sequence**:
1. BER monitor detects degradation on working span: BER rising from 10⁻¹² toward 10⁻⁶
2. OTN node initiates APS request via K-byte protocol
3. Far-end node acknowledges APS request within 1 frame
4. Traffic switched to protection span: switch time measured (<50ms target)
5. Working span now monitored in "wait-to-restore" mode
6. Technician dispatched to investigate degradation cause (OTDR, power meter)
7. Root cause found and repaired (cleaned connector, replaced pigtail, adjusted EDFA)
8. Working span BER returns to < 10⁻¹²; wait-to-restore timer expires (typically 5–10 min)
9. Reversion to working span; protection span returns to standby

**Why it matters**: Proactive APS switching means customers never see the BER degradation
— the protection switch happens before errors affect traffic.`,
      },
      {
        heading: "Fault: OTN ROADM Node Failure",
        icon: "💡",
        body: `**Fault scenario**: "💡 OTN ROADM Node Failure — Ring Bypass"
**What it models**: Complete failure of a ROADM (Reconfigurable Optical Add/Drop Multiplexer)
node within the ring — a more severe event than a span failure because it affects all
wavelengths that were being add/dropped at that node.

**What a ROADM does**: A ROADM routes individual wavelengths in and out of the fiber ring.
Services that terminate at the failed ROADM are lost permanently until the node is replaced.
Services that merely transit through it can be bypassed optically.

**Simulation sequence**:
1. All transponders at the failed ROADM node go offline → LOS on both ring directions
2. Ring bypass activated: the two spans adjacent to the failed node are connected optically,
   bypassing the failed ROADM's add/drop functionality
3. Transit wavelengths restored via bypass path (<50ms protection)
4. Local wavelengths (services terminating at this node) are lost — require manual rerouting
5. Affected services: customer circuits, backbone capacity, and OTN management channels
6. Emergency response: spare ROADM chassis dispatched from regional spares depot
7. Replacement chassis installed; wavelengths re-commissioned one by one
8. Full ring restored; bypass removed; normal ROADM operation resumed

**What to watch**: The ROADM node turning dark, then the bypass path highlighting as
transit traffic is rerouted, then the sequential wavelength restoration animation.`,
      },
      {
        heading: "Fault: BGP Route Reflector Failover",
        icon: "🔷",
        body: `**Fault scenario**: "🔷 BGP Route Reflector Failover"
**What it models**: Failure of the BGP Route Reflector (RR) — the central hub of the ISP's
internal BGP (iBGP) architecture. Every router in the network learns routes via the RR;
if it fails, the entire iBGP fabric goes blind.

**What is a Route Reflector?**: In iBGP, all routers must be fully meshed (n² sessions for
n routers). Route Reflectors break this by acting as a hub — routers peer only with the RR,
which reflects routes between them. But this creates a single point of failure.

**Simulation sequence**:
1. Primary RR crashes (software bug, memory exhaustion, or hardware failure)
2. All iBGP peers detect session loss within 90 seconds (hold timer)
3. iBGP routing table frozen: no new routes learned, but existing routes cached
4. New prefixes (new customer activations, route changes) stop propagating
5. Standby RR promoted: hot-standby RR takes over with identical configuration
6. All iBGP peers reconnect to standby RR and refresh routes (BGP ROUTE-REFRESH)
7. Convergence time: 30–120 seconds depending on table size (NorthStar: ~500K prefixes)
8. Full iBGP mesh restored via standby RR
9. Primary RR repaired and returned to hot-standby role

**Why it matters**: Without the RR, new customer activations fail silently — the BGP /32
route for a new subscriber never propagates, making them unreachable despite being connected.`,
      },
      {
        heading: "Key Metrics & Indicators",
        icon: "📊",
        body: `**Node border color:**
  🟢 Green = Healthy  🟡 Amber = Warning (55–80% capacity)  🔴 Red = Critical (>80%)
  🔵 Blue = Provisioning in progress  ⚪ Grey = Device offline / powered down

**Edge animation speed** — faster pulse = higher traffic volume on that link

**Stats Bar (top)** — aggregate healthy/warning/critical counts and active simulation name

**Event Log (right panel)** — timestamped feed of every provisioning step, fault event,
and remediation action. Each entry shows: timestamp · system · action · detail

**Layer Filter** — toggle visibility by network layer to isolate a specific tier

**MiniMap** (bottom-right of canvas) — bird's-eye overview; click to jump to any region

**Node Detail Panel** — opens on node click; shows: device type, vendor, capacity %,
neighbor count, active sessions, layer assignment, and current simulation step`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Zoom + Pan**: Scroll wheel to zoom; click-drag the canvas to pan. MiniMap (bottom-right) to jump to a region.
• **Click any node** → Node Detail Panel (live stats, neighbor links, device specs).
• **Double-click a node** → expanded Node Modal (full config, provisioning history, capacity trend chart).
• **What-If Planner**: Adjust traffic load or node capacity via sliders to model CAPEX scenarios.
• **AI Runbook**: After any simulation, click "Generate Runbook" for a structured NOC procedure document.
• **Config Generator**: After running a provisioning sim, open Config Generator to see the actual CLI/API commands generated at each step — these are real Cisco IOS-XR / Junos / Nokia SROS syntax.
• **Run fault + provisioning together**: Start a fault, then try to run a provisioning sim while the fault is active — observe how degraded capacity affects new service bring-up.
• **Recording**: Click 🔴 Record → run your sim → Stop → Export WebM or GIF for training decks.`,
      },
    ],
  },

  geo: {
    title: "🌐 Geographic Map",
    subtitle: "Pacific Northwest GIS Fiber Infrastructure Map",
    color: "#22c55e",
    sections: [
      {
        heading: "What Is This?",
        icon: "🗺️",
        body: `The Geographic Map tab renders a Leaflet.js-powered GIS map of the Pacific Northwest,
overlaid with NorthStar Fiber's physical infrastructure:

• **Central Offices (COs)** — marked as cluster icons at real PNW city coordinates (Seattle,
  Portland, Spokane, Boise, Vancouver, Tacoma, Bellevue, and more)
• **Fiber Routes** — polylines tracing simulated long-haul, metro, and last-mile fiber paths
• **Service Territory Boundaries** — shaded polygons showing which ZIP codes or census tracts
  fall within NorthStar's licensed service area

This is the "ground truth" layer — it connects the logical topology in the Network Topology tab
to physical geography.`,
      },
      {
        heading: "Why Does It Matter?",
        icon: "💡",
        body: `Geography drives ISP economics more than any other factor:

• **Permitting** — fiber routes must follow public rights-of-way; knowing the physical path
  determines permit costs and timelines
• **Disaster planning** — a wildfire, flood, or earthquake affects specific geographic segments;
  the GIS map shows which COs and routes are in risk zones
• **Sales territory management** — "Can we serve this address?" is answered by checking if the
  location falls inside a service territory boundary
• **Latency budgeting** — distance matters; a 400km fiber route adds ~2ms of latency per segment,
  which compounds when calculating RTT SLAs for enterprise customers`,
      },
      {
        heading: "How the Map Works",
        icon: "⚙️",
        body: `The map is powered by **React Leaflet** with OpenStreetMap tiles as the basemap.

**CO Markers** use custom SVG icons color-coded by CO role:
  🔵 Core Hub  🟢 Metro Aggregation  🟡 Edge/Access  🔴 Offline / Planned

**Fiber Route Polylines** are drawn as colored lines:
  Blue = In-Service  Orange = Under Construction  Grey = Planned / Dark Fiber

**Clicking a CO marker** opens a popup with:
  — CO name, city, tier classification
  — Active circuits terminating here
  — Current utilization %
  — Equipment list (OLT model, router model, capacity)

**Clicking a fiber route** shows span distance, fiber count, current utilization, and
any active alarms on that segment.`,
      },
      {
        heading: "Key Metrics",
        icon: "📊",
        body: `**CO Count by Tier**: Core (2), Metro Agg (6), Edge (15+), Planned (varies)

**Total Route Miles**: The sidebar shows aggregate fiber miles in-service vs. planned

**Utilization Heatmap overlay** (toggle in Legend): turns fiber routes from blue→amber→red
based on current traffic load — immediately shows which routes are near capacity

**Service Availability overlay**: shades ZIP codes green (served), yellow (planned),
or grey (unserved) — used for grant applications and expansion planning`,
      },
      {
        heading: "Common Workflows",
        icon: "🔄",
        body: `**Find a CO's downstream coverage:**
1. Click the CO marker → read the popup
2. Toggle "Show Downstream" to highlight all fiber routes that originate from this CO

**Plan an expansion route:**
1. Use the Layer Controls to enable "Planned Routes" overlay
2. Compare planned route coverage against unserved territory polygons
3. Export the map view as PNG for a permit application package

**Correlate with active faults:**
1. Run a fault simulation in the Topology tab (e.g., Fiber Cut)
2. Switch to Geo Map — the affected fiber segment will highlight red
3. Identify physical location to dispatch a field tech`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Layer toggles** (Legend panel) let you isolate one overlay at a time — don't try to read all overlays simultaneously.
• The map is fully zoomable from continental US view down to street level — use street-level zoom when validating last-mile route paths.
• **Right-click any point** on the map to get its lat/lon coordinates — useful for manually entering a customer address into IPAM.
• Correlate the Geo Map with the Circuit Planner's Path Map sub-tab to see both the physical fiber route and the logical circuit overlay side-by-side.`,
      },
    ],
  },

  circuit: {
    title: "📡 Circuit Planner",
    subtitle: "Carrier-Grade Telco Circuit Orchestration Simulator",
    color: "#a855f7",
    sections: [
      {
        heading: "What Is This?",
        icon: "🔌",
        body: `The Circuit Planner is a full-fidelity carrier-grade circuit creation simulator
modeled after how real Tier-1 and Tier-2 ISPs provision business circuits end-to-end.

It simulates the complete lifecycle of **8 circuit types** across **8 ordered phases**,
with vendor-accurate CLI/NETCONF/gNMI configs generated at every step.

An 8-phase simulation engine animates every provisioning step from service order intake
through physical cross-connect, logical configuration, optical turn-up, and activation testing.

**Equipment stack**: Cisco ISR/ASR/Nexus · Juniper MX/SRX · Nokia 7750/7210/7360 ·
Ciena 6500 DWDM · Infinera DTN-X · Calix E7 OLT · Arista 7000`,
      },
      {
        heading: "Why Does It Matter?",
        icon: "💡",
        body: `Enterprise circuit provisioning is the highest-revenue, highest-complexity workflow
in a carrier's operational stack. A single missed step can:
• Delay an enterprise go-live by days (costing $10K–$100K in SLA penalties)
• Cause a routing loop that takes down adjacent circuits
• Fail an SLA audit because the activation test wasn't run correctly

This simulator lets engineers, sales teams, and NOC staff:
• **Pre-validate** that a circuit is technically feasible before committing to a customer
• **Train** on the exact sequence of CLI commands and API calls required at each phase
• **Debug** provisioning failures by replaying the specific step that failed
• **Generate** customer-ready turn-up reports with one click (XLSX export)

Every config shown is vendor-accurate — the Cisco IOS-XR, Junos, and Nokia SROS commands
are the actual commands a provisioning engineer would run on real hardware.`,
      },
      {
        heading: "Circuit: L3VPN / MPLS VPN",
        icon: "🔷",
        body: `**What it is**: Layer 3 MPLS Virtual Private Network — the most common enterprise WAN
product for customers with multiple sites that need private, isolated IP connectivity.

**How it works**: Each customer gets a dedicated VRF (Virtual Routing and Forwarding instance)
on every PE (Provider Edge) router. VRF tables are completely isolated — Customer A can use
the same IP subnets as Customer B without conflict. VPNv4 routes are exchanged between PEs
via Multi-Protocol BGP (MP-BGP) using Route Targets as import/export policy.

**Why customers buy it**: Replaces expensive private circuits. Feels like a private network
but rides shared MPLS infrastructure. Any-to-any connectivity between all sites.

**When the simulation runs**: Watch VRF creation on PE routers, MP-BGP route exchange via
Route Reflector, RSVP-TE LSP bring-up, and QoS DSCP-to-EXP mapping across the core.

**Key config elements**: VRF definition, Route Distinguisher (RD), Route Target (RT) import/export,
BGP neighbor statements with address-family vpnv4, MPLS label allocation.`,
      },
      {
        heading: "Circuit: EVC / MEF E-LINE",
        icon: "🔶",
        body: `**What it is**: MEF CE 2.0 Carrier Ethernet Virtual Connection — a transparent
point-to-point Layer 2 service. The customer's LAN traffic passes through the ISP network
without any IP routing awareness — as if a dedicated Ethernet cable connected the two sites.

**How it works**: QinQ (IEEE 802.1ad) encapsulation stacks a service provider VLAN (S-VLAN)
on top of the customer VLAN (C-VLAN). The ISP network forwards frames based on S-VLAN tags;
the customer C-VLAN is preserved end-to-end, invisible to the ISP.

**MEF compliance requirements**: The service must pass Bandwidth Profile (CIR/CBS/EIR/EBS),
Frame Delay (FD), Frame Delay Variation (FDV/jitter), and Frame Loss Ratio (FLR) objectives
as defined in MEF 6.3 and MEF 10.4.

**When the simulation runs**: Watch S-VLAN provisioning on aggregation switches, MEF traffic
conditioner (token bucket) configuration, OAM (IEEE 802.1ag CFM) enable, and Y.1564 test execution.

**Key config elements**: QinQ encapsulation, bandwidth profile policer, 802.1ag MEP/MIP configuration,
Ethernet OAM loopback test.`,
      },
      {
        heading: "Circuit: Internet DIA",
        icon: "🌐",
        body: `**What it is**: Dedicated Internet Access — a dedicated, non-shared internet connection
for a business customer. Unlike residential broadband (best-effort, shared), DIA guarantees
the full committed bandwidth is always available.

**How it works**: Customer gets a static IP block (typically /29 or /28), a dedicated VLAN
on the ISP's edge, and a BGP session to the ISP's edge router. The customer's IP block is
announced into the ISP's BGP fabric and propagated to all upstream transit providers and
peering partners — making the customer's IPs reachable from the entire internet.

**BGP vs. static**: DIA can be delivered with static routing (simpler, no BGP on customer side)
or with BGP (customer can bring their own ASN and IP block — called BYOIP).

**When the simulation runs**: Watch IP allocation from IPAM, BGP session bring-up, prefix
announcement propagation to Route Reflector, and QoS committed-rate shaper configuration.

**Key config elements**: Static IP assignment, BGP neighbor (customer AS), prefix-list inbound,
no-export community for customer prefixes, rate-limiting policer at agreed CIR.`,
      },
      {
        heading: "Circuit: Wave / DWDM / OTN",
        icon: "🌊",
        body: `**What it is**: A dedicated optical wavelength (lambda) on the ISP's DWDM backbone —
a 100G or 400G transparent pipe at the optical layer, below IP. The customer gets the entire
wavelength; no IP routing, no MPLS — just raw optical capacity.

**Who buys it**: Data centers needing DCI (Data Center Interconnect), content providers,
other ISPs, cloud providers, financial institutions needing sub-millisecond latency.

**How it works**: A wavelength is assigned on the ITU-T grid (e.g., 193.10 THz, C-band 50GHz
channel spacing). ROADM nodes route this specific wavelength from A-site to Z-site without
O-E-O conversion (all-optical, lowest latency). Transponders at each end convert client
100GE/400GE signals to the DWDM wavelength.

**Optical budget**: The simulation runs real dB math — Tx power minus fiber loss (0.2 dB/km),
connector loss, splice loss, and ROADM insertion loss — to determine if the receive power
exceeds the transponder's sensitivity threshold.

**When the simulation runs**: Watch ROADM channel assignment, OSNR measurement, BER/FEC
performance, transponder modulation format selection (DP-QPSK for 100G, DP-16QAM for 400G).`,
      },
      {
        heading: "Circuit: Mobile Backhaul",
        icon: "📡",
        body: `**What it is**: The transport connection between a cell site (gNB/eNB) and the ISP's
core network — carrying radio traffic from thousands of cell sites to the 5G core (or 4G EPC).

**Why it's different**: Mobile backhaul has strict timing requirements. 5G NR requires
**±130ns timing accuracy** (IEEE 1588v2 / PTP) for TDD frame synchronization. If the
backhaul network can't deliver this, cell sites go out of sync and inter-cell interference
destroys performance at cell boundaries.

**Fronthaul vs. Backhaul vs. Midhaul**: In split architecture 5G:
• **Fronthaul**: RU → DU (eCPRI, requires <100μs latency)
• **Midhaul**: DU → CU (flexible, typically Ethernet)
• **Backhaul**: CU → 5GC (standard IP/MPLS)

**When the simulation runs**: Watch 1588v2 PTP grandmaster configuration, SYNC packet
propagation through the ISP's timing-aware switches, S-VLAN provisioning for eCPRI frames,
and latency budget validation (must be <100μs one-way for fronthaul).

**Key config elements**: PTP boundary clock configuration, DSCP marking for sync packets,
timing-aware switch configuration, eCPRI C/U plane separation.`,
      },
      {
        heading: "Circuit: Data Center Interconnect",
        icon: "🏙️",
        body: `**What it is**: A high-capacity, low-latency optical connection between two data center
sites — enabling active-active workload distribution, live VM migration, and disaster recovery.

**DCI requirements**: Extremely low latency (<5ms RTT for synchronous replication),
high bandwidth (100G–400G per wavelength, multiple wavelengths), and zero packet loss.

**Protocols used**: EVPN (Ethernet VPN) over VXLAN for Layer 2 extension between DCs,
allowing VMs to migrate between sites without changing IP addresses. MPLS or OTN at the
transport layer for deterministic forwarding.

**Active-active vs. DR**: Active-active DCI means both DCs handle live traffic simultaneously
and synchronize in real time — requires <1ms RTT. DR (Disaster Recovery) DCI can tolerate
higher latency but needs consistent storage replication.

**When the simulation runs**: Watch optical wavelength commissioning (400G DP-16QAM),
EVPN VXLAN tunnel bring-up between DC spine switches, BGP EVPN route exchange for MAC/IP
routes, and latency measurement validation.

**Key config elements**: VXLAN VNI assignment, BGP EVPN address-family, NVE interface config,
flood-and-learn vs. ingress replication mode selection.`,
      },
      {
        heading: "Circuit: EVPN-VPWS / L2VPN",
        icon: "🔗",
        body: `**What it is**: Ethernet VPN Virtual Private Wire Service — a modern, scalable Layer 2
point-to-point service using EVPN control plane instead of older LDP-based pseudowires.

**Why EVPN-VPWS instead of VPWS?**: Traditional VPWS (Virtual Private Wire Service) uses
LDP (Label Distribution Protocol) for signaling — fragile and hard to troubleshoot. EVPN-VPWS
uses BGP for signaling, giving operators visibility, policy control, and fast convergence.

**How it works**: Two PE routers exchange EVPN Route Type 1 (Ethernet Auto-Discovery) routes
via BGP. This establishes the pseudowire between the two PEs. Customer Ethernet frames are
encapsulated in MPLS and forwarded across the ISP's core — completely transparent to the customer.

**Use cases**: Leased line replacement, SAN extension, legacy protocol transport (HDLC, Frame Relay
circuits migrated to Ethernet), financial market data feeds requiring deterministic latency.

**When the simulation runs**: Watch BGP EVPN route exchange, MPLS pseudowire label allocation,
and OAM (VCCV — Virtual Circuit Connectivity Verification) enable for end-to-end pseudowire monitoring.`,
      },
      {
        heading: "Circuit: Carrier Ethernet E-LAN",
        icon: "🕸️",
        body: `**What it is**: MEF E-LAN (Ethernet LAN) — a multipoint-to-multipoint Carrier Ethernet
service that connects multiple customer sites in a virtual LAN (like a big Ethernet switch
in the cloud). Any site can communicate with any other site.

**How it differs from E-LINE**: E-LINE is point-to-point (2 sites). E-LAN is multipoint
(N sites). Traffic can flow between any pair of sites without hairpinning through a central hub.

**How it works**: EVPN is the modern control plane for E-LAN (replacing legacy VPLS/LDP).
PE routers use BGP EVPN Route Type 2 (MAC/IP Advertisement) to share learned MAC addresses.
This eliminates the flooding that plagued legacy VPLS — learned MACs are distributed via BGP,
and unknown unicast flooding is minimized.

**Use cases**: Multi-site enterprise wanting a simple flat Layer 2 network across all offices,
retail chains connecting all stores to a central inventory system, campus networks spanning
multiple buildings.

**When the simulation runs**: Watch EVPN instance (EVI) creation on all PE routers, MAC-VRF
configuration, BGP EVPN RT import/export, and BUM (Broadcast, Unknown Unicast, Multicast)
traffic handling via ingress replication.`,
      },
      {
        heading: "Phase 1: Service Intake",
        icon: "📋",
        body: `**What happens**: The provisioning process begins with a validated service order.
The system checks that all required fields are populated and internally consistent.

**Validation checks performed**:
• Circuit type is supported at the requested A-site and Z-site
• Bandwidth requested is within the maximum supported for this circuit type
• SLA tier is compatible with the circuit type (e.g., Platinum SLA requires dual-plane routing)
• Customer account exists in the BSS with valid payment status
• Contact details and technical contacts are on file for activation coordination

**Systems involved**: BSS (Business Support System), CRM, order management system

**What can fail here**: Missing mandatory fields, unsupported circuit type for the requested
sites, invalid SLA tier for the bandwidth requested.

**Output**: A validated service order record with a unique circuit ID. This ID is used as the
reference throughout all subsequent phases and in the final turn-up report.`,
      },
      {
        heading: "Phase 2: Feasibility",
        icon: "🔍",
        body: `**What happens**: Technical feasibility is assessed before any resources are committed.
This phase prevents the embarrassing situation of selling a circuit that can't be delivered.

**Feasibility gates checked**:
• **Fiber availability**: Is there a fiber path between A-site and Z-site with available strands?
• **Port availability**: Do the PE routers at A-site and Z-site have available interface capacity?
• **Optical budget**: For DWDM circuits, does the span loss allow the signal to reach the far end?
• **VLAN pool**: Are VLAN IDs available in the pools for this service type?
• **Timing**: For mobile backhaul, is there a timing-aware path available?

**Gate outcomes**: Each gate is either PASS ✅ or FAIL ❌. A failed gate pauses provisioning
and generates an augmentation recommendation (e.g., "Order additional fiber, estimated 6-week
lead time; proceed with alternative route via CO-3?").

**Why this matters**: Running feasibility before committing inventory prevents stranded
resources — ports held but not usable because no fiber path exists between them.`,
      },
      {
        heading: "Phase 3: Inventory",
        icon: "🗄️",
        body: `**What happens**: Resources are reserved and committed in the inventory system.
This is the point of no return — once reserved, these resources are unavailable to other circuits.

**Resources reserved in this phase**:
• **Fiber strands**: Specific strand IDs in each span along the A-Z path
• **Switch ports**: Physical port IDs on aggregation and PE switches
• **VLANs**: S-VLAN and C-VLAN IDs from the respective pools
• **MPLS labels**: Label range allocated for this circuit's LSP
• **IP addresses**: PE-CE link addresses, loopback IDs from IPAM
• **Optical channels**: DWDM wavelength channel numbers (for Wave/DCI circuits)
• **Transceivers**: SFP/QSFP part numbers and quantities recorded

**Inventory Scoreboard**: The 🗄 Inventory sub-tab shows animated capacity bars for each
resource type — before/after counts clearly show what this circuit consumed.

**Reservation integrity**: All reservations are atomic — if any one resource can't be reserved,
all previously reserved resources are released (rollback). No partial provisioning.`,
      },
      {
        heading: "Phase 4: Optical Planning",
        icon: "🌊",
        body: `**What happens**: For circuits requiring optical transport (Wave, DCI), the optical
layer is engineered — wavelengths assigned, amplifiers calculated, and OSNR budget verified.

**Only runs for**: Wave/DWDM and DCI circuit types (needsOptical: true). For IP circuits,
this phase is skipped.

**Optical engineering steps**:
1. Wavelength selected from available ITU-T grid slots (50GHz or 100GHz spacing)
2. Modulation format selected: DP-QPSK (100G), DP-16QAM (200G), DP-64QAM (400G)
3. Span loss calculated: sum of (fiber_km × 0.2 dB/km) + connector losses + splice losses
4. EDFA (Erbium-Doped Fiber Amplifier) gain calculated to compensate span loss
5. OSNR budget: starting OSNR − accumulated noise figure = end-to-end OSNR
6. OSNR must exceed modulation format threshold: DP-QPSK needs >15dB, DP-16QAM >22dB
7. If budget fails: options are inline amplifier addition, Raman amplification, or shorter span

**Optical Budget Calculator**: Shows this math in real time — Tx power, span loss breakdown,
amplifier gain stages, and final Rx margin above sensitivity threshold.`,
      },
      {
        heading: "Phase 5: Path Engineering",
        icon: "🗺️",
        body: `**What happens**: The end-to-end logical path is engineered — selecting which physical
nodes and links the circuit will traverse from A-site to Z-site, and (for protected circuits)
which nodes and links the protection path will use.

**Path selection criteria**:
• **Shortest path**: Lowest sum of link metrics (latency-optimized)
• **Diversity**: Working and protection paths must be link-disjoint and ideally node-disjoint
• **SLA compliance**: Platinum SLA requires dual-plane paths through different COs
• **Capacity**: Links selected must have available capacity for this circuit's bandwidth

**Protection types**:
• **1+1**: Simultaneous transmission on both working and protection paths; zero switchover time
• **1:N**: N working circuits share one protection circuit; lower cost but shared risk
• **Unprotected**: No protection path; lowest cost, highest risk

**Path Map sub-tab**: The 🗺 Path Map shows the A-Z route on the Leaflet map with working
path (blue) and protection path (orange) highlighted over real geographic coordinates.

**RSVP-TE or SR**: For MPLS circuits, the LSP is signaled using RSVP-TE (explicit path)
or Segment Routing (SID list) to enforce the engineered path.`,
      },
      {
        heading: "Phase 6: Packet Config",
        icon: "⚙️",
        body: `**What happens**: All packet-layer devices along the circuit path are configured —
this is the longest phase with the most device interactions.

**Devices configured in this phase**:
• **CE routers** (customer edge): interface IP, BGP neighbor, default route or full table
• **PE routers** (provider edge): VRF, BGP VPNv4/EVPN, MPLS label binding, QoS policy
• **Aggregation switches**: VLAN configuration, QinQ encapsulation, port shaper
• **Core routers** (for transit LSPs): RSVP-TE reservation or SR segment list

**Config generation**: The ⚙️ Configs sub-tab shows the vendor-accurate CLI for every device:
• Cisco IOS-XR syntax for ASR 9000 PE routers
• Junos syntax for MX960 P/PE routers
• Nokia SROS syntax for 7750 SR PE routers
• Arista EOS syntax for DC spine switches

**Payload tab**: Shows the equivalent NETCONF or gNMI payload — the API body that an
orchestrator (like Cisco NSO or Nokia NSP) would send to push this config programmatically.

**Rollback**: Each config push is transactional — if a device rejects the config, the
orchestrator rolls back all prior changes and raises an incident ticket.`,
      },
      {
        heading: "Phase 7: Activation & Test",
        icon: "✅",
        body: `**What happens**: The circuit is turned up and subjected to standardized acceptance
testing before being handed over to the customer.

**Two test standards run**:

**RFC 2544 (Benchmarking Methodology)**:
• Throughput test: binary search for the maximum lossless frame rate
• Latency test: one-way and round-trip delay at 100% load
• Frame loss test: % of frames lost at each traffic level
• Back-to-back (burst) test: maximum burst the circuit absorbs without loss
• Tested at: 64B, 512B, 1024B, 1280B, 1518B frame sizes

**Y.1564 (EtherSAM — Service Activation Test)**:
• Step 1 — Configuration test: ramp CIR from 25%→50%→75%→100% — must pass at each step
• Step 2 — Performance test: sustain 100% CIR for 15 minutes — FD, FDV, FLR must meet SLA

**Test results**: The ✅ Tests sub-tab shows animated waterfall charts for throughput,
latency CDF, frame loss heatmap, and jitter histogram — all rendered in real time during
the test simulation.

**Pass criteria**: All metrics must meet the SLA tier's performance objectives before the
circuit can be handed over.`,
      },
      {
        heading: "Phase 8: Monitoring",
        icon: "📡",
        body: `**What happens**: The circuit is handed over to production monitoring. Alarms, KPIs,
and SLA compliance tracking are activated in the network management system.

**Monitoring activated**:
• **Interface counters**: TX/RX rate, error counters, CRC errors polled every 5 minutes
• **BGP session state**: session up/down events alerted within 30 seconds
• **BFD (Bidirectional Forwarding Detection)**: sub-second failure detection on CE-PE links
• **TWAMP (Two-Way Active Measurement Protocol)**: continuous latency/jitter measurement
• **Optical power**: DWDM transponder Tx/Rx power monitored; alert on ±2dB deviation
• **OAM**: IEEE 802.1ag Connectivity Fault Management continuity checks every second

**SLA reporting**: The monitoring system begins accumulating uptime, latency percentiles,
and packet loss statistics. Monthly SLA reports are auto-generated from this data.

**Customer portal**: The customer-facing portal is updated with the circuit's status,
live bandwidth utilization graph, and SLA compliance scorecard.

**XLSX export**: The 📊 Export button generates a 3-sheet workbook:
  Sheet 1 — Circuit Summary (all parameters)
  Sheet 2 — Inventory Consumed (all reserved resources)
  Sheet 3 — Feasibility Gates (all pass/fail results with details)`,
      },
      {
        heading: "Sub-tabs Explained",
        icon: "🗂️",
        body: `**📋 Simulation** — The main view. Left panel (55%): step-by-step log of all 8 phases
with timestamps, system actors, and actions. Right panel (45%): live config/payload/log
for the currently active step. Click any ✅ completed step to pin it and study its config.

**🗄 Inventory** — Real-time scoreboard showing animated capacity bars for all 7 resource
types (fiber, ports, VLANs, labels, IPs, transceivers, optical channels). Shows the before
and after count — how much of each resource this circuit consumed.

**🗺 Path Map** — Leaflet map overlaid with the circuit's physical A-Z route. Blue line =
working path. Orange dashed line = protection path. Click any segment for span details
(distance, fiber type, current utilization %). CO markers show equipment at each node.

**✅ Tests** — RFC 2544 + Y.1564 animated test runner. Can be re-run independently after
the main simulation completes (to model a re-test scenario). Charts render in real time:
throughput waterfall, latency CDF, loss heatmap, jitter histogram.

**⚙️ Configs** — Consolidated view of all device configs generated across all 8 phases.
Filter by device name, phase number, or vendor CLI type. Each config block is copyable
as a template for real network provisioning.`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Click completed steps** (✅) at any point — the right panel updates to that step's config even after the sim has moved on. Great for studying a specific phase.
• **Session Circuit Registry** (bottom of tab) logs every circuit planned in this session — click any past circuit to replay its full simulation.
• **Protection types** dramatically change inventory consumed — run 1+1 vs. Unprotected back-to-back to see the resource cost of protection.
• **SLA Tier** (Bronze → Platinum) changes gate thresholds — Platinum requires tighter optical margins, dual-plane routing, and longer Y.1564 test duration.
• **EVPN-VPWS** and **E-LAN** are the most technically complex configs — run them to see EVPN Route Type 1 and Route Type 2 in the config panels.
• **Optical Budget Calculator** (Phase 4) is standalone — change the span distance slider to see at what distance the budget fails and an amplifier is needed.
• The **XLSX export** generates a real-format 3-sheet workbook — use it as a template for actual circuit turn-up documentation.`,
      },
    ],
  },

  ran: {
    title: "📡 RAN Planning",
    subtitle: "4G / 5G / 6G Radio Access Network Engineering Simulator",
    color: "#f59e0b",
    sections: [
      {
        heading: "What Is This?",
        icon: "📶",
        body: `The RAN Planning tab is a high-fidelity Radio Access Network simulation environment
covering the complete engineering lifecycle from 4G LTE through 5G NR and emerging 6G concepts.

It models how a mobile network operator (MNO) or neutral host provider would plan, deploy,
optimize, and evolve a multi-generation RAN across urban, suburban, and rural territory.

The tab has two major areas:
• **13 Function Tabs** — each tab is a focused planning/simulation tool for one RAN domain
  (Zones, Capacity, Interference, MIMO, QoE, SON, Lifecycle, Spectrum, HetNet,
  Handover, Slicing, Acquisition, Drive Test)
• **11 RAN Scenarios** — pre-built end-to-end scenarios that combine multiple domains into
  a single narrative simulation (Massive MIMO, AI-RAN, Edge Tromboning, Handover Storm, etc.)

Each domain has real-time animated visualizations, metric dashboards, and interactive controls.`,
      },
      {
        heading: "Why RAN Planning Matters",
        icon: "💡",
        body: `Radio network planning is fundamentally different from wireline planning because the medium
is shared, contested, and subject to physics that can't be engineered away:

• **Spectrum is finite** — every Hz assigned to one user is unavailable to another
• **Interference is invisible** — two cell sites 5km apart may devastate each other's SINR
• **Propagation is probabilistic** — the same signal path has different loss at different times
• **Capacity is elastic** — 5G NR can serve 1 Gbps or 1 Mbps to the same user depending on
  conditions, making SLA guarantees fundamentally harder than wireline

This simulator lets engineers, architects, and students explore these dynamics in a safe,
instrumented environment — without needing access to a live RAN or Atoll/Planet licenses.

**Generational coverage**: The simulator distinguishes clearly between:
  — **4G LTE** engineering (OFDMA, eNB, EPC, X2 handover)
  — **5G NR** engineering (Massive MIMO, network slicing, gNB, 5GC, Xn handover)
  — **6G preview** (AI-native air interface, sub-THz, integrated sensing & communication)`,
      },
      {
        heading: "Tab: 🗺️ Zones",
        icon: "🗺️",
        body: `**What it is**: The Zones tab is the geographic foundation of the RAN plan — a Leaflet
map showing the service territory divided into planning zones by environment type.

**Zone types**:
• **Dense Urban** — high-rise buildings, heavy clutter, 3D propagation, small cell density required
• **Urban** — mixed commercial/residential, macro + small cell mix
• **Suburban** — lower density, macro-dominated, easier propagation
• **Rural** — wide-area coverage, tall towers, challenging economics (cost per subscriber high)
• **Highway** — linear coverage, Doppler-optimized handover parameters

**What the tab shows**:
— Zone boundaries overlaid on the map as colored polygons
— Cell site markers with site ID, sector configuration, and current utilization
— Coverage gaps (unserved areas shown as grey zones)
— Population density overlay (drives capacity dimensioning)

**Why it matters**: Every other planning function — capacity dimensioning, interference
analysis, small cell placement — starts with the zone map. Getting zone boundaries wrong
leads to systematic under- or over-building in specific areas.`,
      },
      {
        heading: "Tab: 📊 Capacity",
        icon: "📊",
        body: `**What it is**: Models how spectrum resources (PRBs in LTE/NR) are allocated among
competing users across a cell sector. Tracks PUSCH/PDSCH utilization and throughput.

**⚠️ Alert status: Warning** — this tab typically shows amber status because most real
networks carry warning-level PRB utilization (70–85% at busy hour).

**How it works**: The simulator places N UEs in a sector with configurable traffic profiles
(eMBB / URLLC / mMTC). A proportional-fair scheduler distributes PRBs each TTI.
Throughput is calculated: **C = B × log₂(1 + SINR)** (Shannon capacity formula).

**Key metrics**:
• PRB utilization % — crosses 70% = loaded cell; crosses 85% = intervention needed
• Cell throughput (Mbps) — aggregate across all UEs in sector
• Average UE throughput (Mbps) — per-user fairness metric
• Spectral efficiency (bps/Hz) — efficiency of the air interface

**The key insight**: When a cell is 80% loaded, adding more users degrades EVERYONE's
throughput — not just new users. This is the fundamental case for cell densification
(adding small cells) or carrier aggregation (adding spectrum bands).`,
      },
      {
        heading: "Tab: 📡 Interference",
        icon: "📡",
        body: `**What it is**: Models inter-cell interference (ICI) between adjacent cells and
calculates SINR at each point in the coverage area.

**⚠️ Alert status: Critical** — interference is typically the #1 performance problem in
dense deployments. The tab opens with a red indicator to signal this priority.

**Why interference is the hardest problem in RAN**: Two cells using the same frequency
channel (co-channel interference) degrade each other's cell-edge SINR. In a dense network,
a UE at cell edge may receive nearly equal signal from 3–4 cells simultaneously — none
of them are providing clean signal.

**SINR formula**: SINR = P_serving / (Σ P_interferers + P_noise)

**Interference mitigation techniques shown**:
• **ICIC** (Inter-Cell Interference Coordination): cells agree to reduce power or restrict
  frequency use at cell edge — creates "soft frequency reuse"
• **eICIC** (enhanced ICIC): macro and small cells coordinate using Almost Blank Subframes (ABS)
• **Antenna tilt**: mechanical or electrical downtilt reduces interference to neighbors
• **Frequency reuse planning**: separating co-channel cells by distance

**What to watch**: The SINR heatmap — red zones (SINR < 0 dB) identify problem areas.`,
      },
      {
        heading: "Tab: 🔧 MIMO",
        icon: "🔧",
        body: `**What it is**: Visualizes 5G NR Massive MIMO beam patterns from a 64T64R antenna array
(typical of Nokia AirScale, Ericsson AIR 6449).

**What Massive MIMO is**: A 64T64R array has 64 transmit and 64 receive antenna elements.
Unlike 4G's fixed sector antenna (single beam covering 120°), a Massive MIMO array creates
narrow, steerable beams — each directed at a specific UE. This is called beamforming.

**Gains from Massive MIMO**:
• **Array gain**: 64 elements provide ~21 dBi gain vs. 15 dBi for a conventional panel
• **Spatial multiplexing**: up to 8 simultaneous spatial streams (layers) to different UEs
• **Interference reduction**: narrow beams concentrate energy on the target UE, reducing
  interference to neighbors

**Multi-User MIMO (MU-MIMO)**: The simulator shows how multiple beams are directed
simultaneously to different UEs in the same time-frequency resource — effectively
multiplying capacity by the number of spatial layers.

**Beam sweeping**: SSB (Synchronization Signal Block) beam sweeping shows the 64 beam
directions scanned during initial access — how a UE finds the best beam.

**Angular separation constraint**: MU-MIMO works best when UEs are >15° apart in azimuth.
The simulator shows beam orthogonality degrading when UEs cluster at the same angle.`,
      },
      {
        heading: "Tab: 😊 QoE",
        icon: "😊",
        body: `**What it is**: QoE (Quality of Experience) models the end-user perception of network
quality — going beyond raw throughput metrics to model what the user actually experiences.

**⚠️ Alert status: Warning** — QoE issues often exist even when network KPIs look acceptable.

**Why QoE ≠ QoS**: A cell may show 100 Mbps aggregate throughput (good QoS) but every
user is experiencing 2 Mbps (poor QoE) because 50 users are sharing the cell.

**QoE metrics modeled**:
• **Video streaming**: MOS (Mean Opinion Score) for video, based on bitrate + stall ratio
• **Voice (VoLTE)**: R-Factor and MOS-CQ, based on packet loss, jitter, and codec
• **Gaming**: latency percentile (P99 must be <50ms for competitive gaming)
• **Web browsing**: Page Load Time (PLT) model based on throughput and RTT

**Edge compute impact**: The QoE tab shows how MEC (Multi-access Edge Computing) placement
reduces RTT for latency-sensitive applications — co-located app servers vs. central DC.

**The tromboning effect**: If a local content server is at a distant data center, traffic
routes: UE → gNB → CU → Core DC → App Server → back. MEC eliminates this by placing the
app server at or near the gNB — critical for AR/VR and real-time gaming.`,
      },
      {
        heading: "Tab: 🤖 SON",
        icon: "🤖",
        body: `**What it is**: SON (Self-Organizing Network) demonstrates automation algorithms that
continuously adjust RAN parameters without human intervention — making the network self-healing
and self-optimizing.

**⚠️ Alert status: Warning** — the SON tab shows current optimization opportunities detected.

**Three SON functions simulated**:

**MLB — Mobility Load Balancing**: Detects an overloaded cell (>85% PRB) and automatically
adjusts: CRS power reduction, antenna tilt increase, handover threshold offset toward neighbors.
Result: load redistributes from the hot cell to underloaded neighbors within 60 simulation seconds.

**MRO — Mobility Robustness Optimization**: Analyses MDT (Minimization of Drive Tests) data
for too-early HO events (HO followed by RLF on target) and too-late HO events (RLF before HO).
Auto-corrects A3 offset and Time-to-Trigger parameters cell-by-cell.

**ANR — Automatic Neighbor Relations**: UEs report detected cells not in the neighbor list.
SON automatically adds these cells, sets up X2/Xn peering, and adds them to the HO candidate list.

**6G preview**: The tab also shows AI-native SON — where a neural network predicts load
patterns 15 minutes in advance and pre-positions resources before congestion occurs.`,
      },
      {
        heading: "Tab: ♻️ Lifecycle",
        icon: "♻️",
        body: `**What it is**: Models the complete lifecycle of RAN equipment — from initial deployment
through technology refresh and eventual decommission.

**Lifecycle phases shown**:
• **Greenfield deployment**: site selection, permit timelines, backhaul provisioning, RF commissioning
• **Capacity expansion**: carrier addition, sector splitting, small cell overlays
• **Technology upgrade**: 4G → 5G NR software upgrade (same hardware, new software + new antenna)
• **Technology refresh**: hardware replacement (new RRU/BBU at end of 7–10yr lifecycle)
• **Decommission**: traffic migration, site teardown, fiber re-use assessment

**4G → 5G migration strategies modeled**:
• **NSA (Non-Standalone)**: 5G NR added as secondary carrier; 4G LTE remains the anchor
  (LTE handles signaling; NR handles data). Fastest deployment; no 5GC required.
• **SA (Standalone)**: Full 5G core (5GC) deployed; NR handles all signaling and data.
  Required for network slicing, URLLC, and true 5G SLAs.

**CAPEX/OPEX modeling**: The lifecycle tab shows cost per site for each phase — useful for
building business cases for spectrum acquisitions or technology refresh programs.`,
      },
      {
        heading: "Tab: 🔢 Spectrum",
        icon: "🔢",
        body: `**What it is**: Spectrum planning models how frequency bands are assigned to cells —
balancing coverage (lower bands propagate farther) against capacity (higher bands carry more data).

**⚠️ Alert status: Critical** — spectrum is the scarcest resource in mobile networks. The tab
opens red because most operators are spectrum-constrained at busy hour.

**Spectrum layers for NorthStar's RAN**:
• **700 MHz (Band 28)**: Coverage layer — penetrates buildings, covers rural areas. Narrow bandwidth (10–20 MHz).
• **1800 MHz (Band 3)**: Capacity layer — urban/suburban macro. 20–40 MHz available.
• **2100 MHz (Band 1)**: Capacity layer — urban macro. Standard FDD 5G NR.
• **3500 MHz (Band n78)**: 5G NR primary band — 100 MHz bandwidth, TDD. Dense urban.
• **26 GHz (Band n258)**: mmWave — massive bandwidth (400–800 MHz) but very short range (<200m).

**DSS (Dynamic Spectrum Sharing)**: 4G and 5G share the same frequency band dynamically —
the scheduler allocates PRBs to 4G or 5G UEs based on demand. The Spectrum tab shows the
PRB allocation ratio evolving over time as 5G adoption grows.

**Carrier Aggregation**: The tab shows how a UE can aggregate 3–5 component carriers
simultaneously — summing bandwidth across multiple bands for peak throughput.`,
      },
      {
        heading: "Tab: 🏙️ HetNet",
        icon: "🏙️",
        body: `**What it is**: HetNet (Heterogeneous Network) models the interaction between macro cells
and small cells (picocells, femtocells, Wi-Fi offload) deployed to boost capacity in hotspots.

**⚠️ Alert status: Warning** — HetNet coordination is complex and frequently misconfigured.

**The HetNet challenge**: A macro cell covers 1–5km radius. A small cell covers 50–200m.
When deployed together, the strong macro signal can mask the small cell — UEs camp on the
macro even when a small cell nearby would give them 10× better throughput.

**Cell Range Expansion (CRE)**: The simulator shows how adding an artificial offset (bias)
to the small cell's signal measurement encourages UEs to associate with the small cell,
expanding its effective coverage area.

**eICIC / CoMP**: 
• **eICIC**: Macro sends Almost Blank Subframes (muted subframes) so small cell edge UEs
  can receive small cell data without macro interference.
• **CoMP** (Coordinated Multipoint): Multiple cells simultaneously serve the same UE,
  combining their signals for higher SINR at cell edge.

**Wi-Fi offload**: The tab shows automatic traffic offload from cellular to Wi-Fi when a UE
enters a trusted Wi-Fi zone — reducing macro cell load at densely covered indoor locations.`,
      },
      {
        heading: "Tab: 🔄 Handover",
        icon: "🔄",
        body: `**What it is**: Simulates UE mobility events — a device moving through the coverage area
and triggering X2/Xn-based handovers between cells.

**⚠️ Alert status: Critical** — handover failures are a leading cause of dropped calls and
session interruptions. The tab opens red because even well-tuned networks have HO issues.

**Why handover is hard**: The network must initiate the handover early enough that the target
cell is ready before the UE's signal degrades — but not so early that the UE "ping-pongs"
back to the original cell.

**Handover trigger (A3 event)**:
  Condition: RSRP(target) − RSRP(serving) > **A3 offset** for duration **TTT** (Time-to-Trigger)
  Default: A3 offset = 3 dB, TTT = 480 ms

**Three failure modes shown**:
• **Too-early HO**: UE hands over when serving cell still strong → RLF on target → call drop
• **Too-late HO**: UE stays on degrading cell → throughput collapse → eventual RLF
• **Ping-pong**: UE hands over back and forth → excessive signaling, wasted resources

**High-speed mobility** (train, highway): At 300 km/h, the UE crosses a cell boundary in
seconds — TTT must be reduced to 40ms or the UE will be in the next cell before HO completes.

**What to watch**: The RSRP chart showing serving vs. target curves crossing, with TTT
countdown and the exact handover execution moment marked.`,
      },
      {
        heading: "Tab: 🍰 Slicing",
        icon: "🍰",
        body: `**What it is**: Simulates 5G core network slicing — partitioning one physical RAN into
multiple logical networks, each with isolated resources and customized QoS.

**3GPP Network Slice Types (SST)**:

**eMBB (Slice 1 — Enhanced Mobile Broadband)**:
  Use case: video streaming, FWA (Fixed Wireless Access), consumer data
  Guaranteed: 80% PRB share, minimum 100 Mbps per UE, <50ms latency

**URLLC (Slice 2 — Ultra-Reliable Low Latency)**:
  Use case: autonomous vehicles, industrial robotics, remote surgery
  Guaranteed: <1ms air-interface latency (using 2-symbol mini-slots), 99.9999% reliability
  Mechanism: preemption rights over eMBB PRBs during URLLC traffic spikes

**mMTC (Slice 3 — Massive Machine Type Communications)**:
  Use case: IoT sensors, smart meters, environmental monitors
  Guaranteed: supports 1 million devices/km²; low power; NBIoT/LTE-M radio channels

**Hard vs. Soft slicing**: Hard slicing dedicates PRBs exclusively to a slice — strong
isolation but low efficiency. Soft slicing shares PRBs with guaranteed minimums but allows
bursting — higher efficiency but weaker isolation.

**What to watch**: When URLLC traffic spikes, its preemption rights kick in — watch the eMBB
slice's PRB allocation temporarily compressed to protect URLLC latency guarantees.`,
      },
      {
        heading: "Tab: 🏗️ Acquisition",
        icon: "🏗️",
        body: `**What it is**: Models the site acquisition and permitting process for new cell site construction
— the longest-lead-time component of RAN deployment.

**⚠️ Alert status: Warning** — site acquisition is consistently the #1 bottleneck in RAN
rollout. The average time from site identification to on-air is 18–36 months in urban areas.

**Acquisition workflow modeled**:
1. **Site search**: RF planning tool identifies optimal candidate locations
2. **Candidate identification**: Candidate list created (rooftops, monopoles, water towers, greenfield)
3. **Landlord negotiation**: Lease negotiation — ground lease ($1,500–$3,000/month typical)
4. **Structural analysis**: Tower or rooftop structural load capacity verified for antenna weight
5. **Local permitting**: FAA (height), FCC (RF), zoning/planning authority (aesthetics)
6. **Environmental review**: NEPA, historic preservation, RF exposure compliance
7. **Construction**: Tower erection or rooftop installation; power; backhaul fiber
8. **Commissioning**: RRU/BBU installation; RF optimization; RF acceptance testing
9. **On-air**: Cell site integrated into OSS; SON takes over parameter management

**Site types and their trade-offs**: Monopole (fastest permit), rooftop (cheapest, hardest
to lease), small cell (complex permit, easiest structural), macro tower (most capacity, longest
lead time and highest cost).`,
      },
      {
        heading: "Tab: 🚗 Drive Test",
        icon: "🚗",
        body: `**What it is**: Simulates a drive test — the process of driving through the coverage area
with a test UE and measurement equipment to collect real-world signal and quality data.

**What drive tests measure**:
• RSRP (serving cell signal strength) at every GPS location
• RSRQ (signal quality, including interference)
• SINR (signal-to-noise ratio)
• CQI (Channel Quality Indicator — what MCS the scheduler is using)
• Throughput (DL and UL actual measured speed)
• Handover events (which cell, at which location, was the HO triggered)
• RLF (Radio Link Failure) locations — where call drops happened

**Simulation output**: The drive test tab renders an animated route on the map with a
color-coded trail: green = good signal, yellow = fair, red = poor. Each data point stores
the full measurement set.

**Post-processing**: The simulator clusters RLF locations and HO failure points to generate
an optimization recommendation list — which A3 offsets to tune, which sectors to tilt, which
areas need a small cell.

**MDT (Minimization of Drive Tests)**: The simulator also shows MDT — where UEs themselves
report measurements (like a background drive test running on every user's device), eliminating
the need for expensive drive test vehicles in mature networks.`,
      },
      {
        heading: "Scenario: Massive MIMO Beamforming",
        icon: "🔧",
        body: `**Scenario ID**: mimo-3d | **Badge**: 5G NR

**Narrative**: A dense urban small cell cluster is being upgraded from 4T4R (4G) to 64T64R
(5G NR Massive MIMO). This scenario shows the before/after impact on coverage, capacity,
and cell-edge performance.

**What runs**:
1. 4G baseline: fixed sector coverage, SINR map shows heavy cell-edge interference
2. 5G NR Massive MIMO activated: beam sweeping animation shows SSB beam grid (64 beams)
3. UEs are assigned to beams: narrow beams directed at each UE's location
4. MU-MIMO: 8 simultaneous spatial streams — 8 UEs served in the same PRB simultaneously
5. Throughput comparison: before (4G 4×4 MIMO) vs. after (5G 64T64R MU-MIMO)
6. Spectral efficiency improvement: from ~4 bps/Hz (4G MIMO) to ~28 bps/Hz (5G MU-MIMO)

**Key visual**: The polar beam pattern animation — watch 8 narrow beams sweeping across
the azimuth plane, each tracking a different UE. Notice how beams null (suppress signal)
in the direction of interfering cells.

**Why it matters**: Massive MIMO is the single biggest capacity technology jump in mobile
networks. Understanding how beam scheduling works is essential for 5G NR optimization.`,
      },
      {
        heading: "Scenario: Network Slicing & SLA",
        icon: "🍰",
        body: `**Scenario ID**: slicing-sla | **Badge**: 5G SA (Standalone)

**Narrative**: A 5G SA network is serving three simultaneous slice tenants: a consumer ISP
(eMBB), an autonomous vehicle fleet operator (URLLC), and a smart city IoT provider (mMTC).
A traffic stress event is injected to test slice isolation.

**What runs**:
1. Baseline: all three slices operating normally within their PRB allocations
2. Stress injection: consumer video streaming spike → eMBB slice requests 150% of its allocation
3. URLLC protection: scheduler enforces URLLC preemption rights — eMBB compressed
4. eMBB overflow handling: excess eMBB traffic either queued or rate-limited (configurable)
5. mMTC behavior: unaffected by the eMBB/URLLC contention (separate NB-IoT channels)
6. Recovery: eMBB spike subsides; all slices return to nominal allocations

**SLA violation detection**: The scenario shows SLA breach alerts when URLLC latency
approaches 1ms threshold — and the corrective action (immediate preemption) that fires.

**Hard vs. soft slicing comparison**: Run the scenario twice — once with hard slicing
(isolated PRBs) and once with soft slicing (shared with minimums). Compare the URLLC
latency distribution and eMBB throughput headroom in each mode.`,
      },
      {
        heading: "Scenario: AI-RAN Model Validation",
        icon: "🤖",
        body: `**Scenario ID**: ai-ran | **Badge**: 6G Preview

**Narrative**: A 6G-preview scenario where an AI model is trained on historical network data
and then validated against live traffic — demonstrating AI-native air interface concepts.

**What runs**:
1. Historical data feed: 30-day KPI history (throughput, SINR, HO events) loaded into trainer
2. ML model training: a neural network learns traffic patterns, peak times, mobility signatures
3. Prediction validation: model predicts next 60 minutes of traffic per sector
4. Accuracy metrics: MAE (Mean Absolute Error) and RMSE per prediction horizon
5. Action recommendation: model suggests proactive beam steering, pre-emptive load balancing
6. 6G concepts: integrated sensing and communication (ISAC) — the antenna simultaneously
   transmits data and receives radar returns to detect UE positions without GPS
7. Sub-THz preview: shows what a 300 GHz channel looks like — 10s of GHz bandwidth but
   <10m range, requiring dense deployments of hundreds of tiny nodes

**Why it matters**: Every major RAN vendor (Ericsson, Nokia, Samsung, Huawei) is shipping
AI/ML-based RAN optimization today. Understanding the training/inference cycle is essential
for next-generation RAN engineering roles.`,
      },
      {
        heading: "Scenario: Edge Compute & Tromboning",
        icon: "🌐",
        body: `**Scenario ID**: edge-trombone | **Badge**: MEC / UPF

**Narrative**: A campus enterprise 5G deployment is suffering from high application latency
despite good radio conditions. This scenario diagnoses the "tromboning" problem and shows
the MEC solution.

**What is tromboning?**: Traffic routes: UE → gNB → CU → Core DC (500km away) → App Server
→ Core DC → CU → gNB → UE. Even though the UE and app server are in the same building,
the traffic travels 1000km round trip. RTT = 30–50ms.

**What runs**:
1. Baseline: UE gaming session; RTT measured = 48ms; gaming experience = poor
2. Tromboning path visualized on the map — traffic route traced with animated arrows
3. MEC deployment: UPF (User Plane Function) instantiated at the campus gNB site
4. Traffic steering rule: local breakout configured — matching traffic (by IP/FQDN) breaks
   out at the local UPF instead of routing to central DC
5. New RTT measured: 4ms (radio 3ms + local processing 1ms)
6. Gaming experience: excellent; latency histogram shows P99 < 5ms

**UPF placement options compared**: On-site (best latency, highest cost), at CO (medium
latency, medium cost), at regional DC (lowest cost, highest latency). Break-even analysis
shown for each placement option.`,
      },
      {
        heading: "Scenario: Indoor Positioning",
        icon: "📍",
        body: `**Scenario ID**: indoor-pos | **Badge**: URLLC / NR

**Narrative**: A large industrial warehouse deploys 5G NR for automated guided vehicles (AGVs).
Sub-meter positioning accuracy is required for collision avoidance. This scenario shows how
5G NR positioning works and its accuracy limits.

**What runs**:
1. Indoor factory map overlaid: aisles, racking, AGV routes shown
2. 5G NR positioning methods demonstrated:
   — **DL-TDOA** (Downlink Time Difference of Arrival): UE measures reference signals from
     3+ gNBs; triangulates position from time differences
   — **UL-TDOA**: Network measures UE's uplink signals at multiple TRPs (Transmission/Reception Points)
   — **Multi-RTT**: Uses both DL and UL measurements for redundancy
3. Positioning accuracy shown: 3GPP Rel-16 target = <3m (80% of locations); Rel-17 = <1m
4. Multipath effect: signal reflections off metal racking cause positioning errors — visualized
5. Private 5G vs. macro: private network with known TRP positions achieves better accuracy
   than macro network with uncertain timing

**URLLC requirements**: AGV positioning updates every 20ms (50 Hz) — requires URLLC slice
to guarantee <1ms latency for each position calculation update.`,
      },
      {
        heading: "Scenario: Ray Tracing & Spectral Efficiency",
        icon: "📡",
        body: `**Scenario ID**: ray-tracing | **Badge**: RF Model

**Narrative**: A detailed RF propagation simulation using ray tracing instead of empirical
models — showing the difference in prediction accuracy between COST-Hata (statistical) and
3D ray tracing (deterministic) for a dense urban environment.

**Empirical vs. ray tracing**:
• **COST-Hata**: Uses a formula with terrain/clutter correction factors. Fast to compute
  (seconds) but ±8–15 dB prediction error in complex urban areas.
• **3D Ray Tracing**: Traces individual rays reflecting off, diffracting around, and
  transmitting through buildings. Slow to compute (minutes to hours) but ±3–5 dB accuracy.

**What runs**:
1. COST-Hata prediction: coverage heatmap generated in seconds; smooth gradients
2. Ray tracing prediction: each ray path animated — reflections off buildings shown
3. "Street canyon" effect: signal guided along streets by building faces (waveguiding)
4. Building penetration: signal loss through different wall types (glass 3dB, brick 15dB, concrete 20dB)
5. Shadow zones: areas behind buildings show deep signal shadows (>20 dB difference vs. LoS)
6. Spectral efficiency map: using ray-traced SINR, a bps/Hz map shows where high-order
   MCS (256QAM) is achievable vs. where QPSK (robust but slow) must be used

**The insight**: Ray tracing reveals indoor coverage problems that empirical models miss —
critical for planning DAS (Distributed Antenna System) or indoor small cells.`,
      },
      {
        heading: "Scenario: Handover Storm (High-Speed Rail)",
        icon: "🚆",
        body: `**Scenario ID**: ho-storm | **Badge**: Mobility

**Narrative**: A high-speed train traveling at 300 km/h through NorthStar's coverage area.
Standard handover parameters (TTT=480ms, A3=3dB) are completely wrong for this speed.
This scenario shows the problem and demonstrates the parameter tuning solution.

**The math**: At 300 km/h, the train covers 83 meters per second. A typical macro cell
(1 km radius) provides ~24 seconds of coverage. With TTT=480ms, HO works fine.
BUT: a small cell (100m radius) provides only **1.2 seconds** of coverage.
With TTT=480ms, the UE may never camp long enough to trigger a HO — it fails on entry.

**What runs**:
1. Train route animated on the map at 300 km/h speed
2. Cell coverage plotted along the route: macro cells + small cells
3. Default parameters: HO failures at every small cell boundary (red flashes on map)
4. HO storm: rapid succession of HO attempts causes signaling overload on X2 interface
5. Parameter optimization: TTT reduced to 40ms; A3 offset tuned to 1dB for mobility
6. Re-run with tuned parameters: clean HO at every boundary; no failures
7. Doppler compensation: 5G NR's built-in Doppler pre-compensation shown for 300 km/h

**Why it matters**: 5G NR connectivity on high-speed rail is a flagship use case — getting
the handover parameters wrong means every passenger on the train loses connectivity.`,
      },
      {
        heading: "Scenario: Cell Failure & SON Self-Healing",
        icon: "📉",
        body: `**Scenario ID**: self-heal | **Badge**: SON / CCO

**Narrative**: A cell site suffers a hardware failure during busy hour — the sector serving
the densest part of the coverage area goes dark. SON self-healing activates automatically
to minimize the coverage/capacity impact without human intervention.

**What runs**:
1. Cell failure: the target sector goes offline (red on map); coverage hole appears
2. Coverage hole detection: SON's CPICH/CSI-RS measurement reports from neighboring UEs
   identify the outage within 30 seconds
3. Compensation activation (CCO — Coverage and Capacity Optimization):
   — Neighboring cells increase transmit power (up to +3 dB max, operator-configurable)
   — Neighboring cells adjust antenna tilt (electrically, via RET — Remote Electrical Tilt)
   — HO thresholds adjusted to pull UEs away from the failed cell
4. Coverage restored: the hole reduces from 100% uncovered to ~30% uncovered
5. Capacity impact: neighbors absorb the additional UEs; PRB utilization increases
6. Alert to NOC: automated ticket created with failed cell ID, time of failure, and
   compensation actions taken — ready for field tech dispatch
7. Cell restores: SON reverts compensation changes automatically; UEs re-associate

**The key insight**: Self-healing can't fully compensate for a failed cell — but it can
reduce the user impact by 60–70% while field technicians are en route.`,
      },
      {
        heading: "Scenario: Dynamic Spectrum Sharing",
        icon: "📻",
        body: `**Scenario ID**: dss | **Badge**: 4G/5G Coexistence

**Narrative**: NorthStar is deploying 5G NR in its existing 1800 MHz band using DSS
(Dynamic Spectrum Sharing) — allowing 4G and 5G to coexist on the same carrier without
requiring a dedicated 5G spectrum block.

**Why DSS exists**: Operators cannot instantly re-farm spectrum from 4G to 5G — millions of
4G-only devices still need service. DSS allows the scheduler to allocate individual PRBs
to either 4G or 5G dynamically on a TTI-by-TTI basis.

**The DSS mechanism**:
• 4G LTE: uses OFDMA with 15 kHz subcarrier spacing
• 5G NR: uses OFDMA with 15 kHz subcarrier spacing (in the same band) — compatible!
• The scheduler checks: is this PRB requested by a 4G UE or a 5G UE?
• If 5G: schedule NR PDSCH. If 4G: schedule LTE PDSCH. Both use the same spectrum.

**What runs**:
1. Carrier loaded with 80% 4G UEs, 20% 5G UEs (early 5G adoption)
2. PRB allocation shown: most PRBs serving 4G; 5G UEs get opportunistic access
3. Time evolution: as 5G adoption grows (slider control), PRB share shifts toward NR
4. MBB overhead: 5G NR must send "rate matching" signals around 4G CRS (Cell Reference
   Signals) — this overhead reduces 5G efficiency by 10–15% vs. standalone NR
5. Migration path: at 90% 5G UE penetration, operator can re-farm band fully to NR

**Business case**: DSS avoids the $500M cost of acquiring a new spectrum band — it extracts
5G capacity from existing 4G spectrum during the multi-year transition period.`,
      },
      {
        heading: "Scenario: Coverage Prediction (Atoll-Style)",
        icon: "🗺️",
        body: `**Scenario ID**: prop-model | **Badge**: Atoll-style RF Model

**Narrative**: This is the flagship GIS visualization — an Atoll-inspired propagation
prediction engine rendering dynamic, multi-layer thematic heatmaps over the Leaflet map.
It directly simulates how Atoll generates Coverage Predictions as colored raster layers.

**Three prediction layers (toggle between them)**:

**🟢 Signal Level (RSRP)**: Pixel-grid heatmap where each pixel's color represents the
RSRP from the best server at that location. Color scale: green (> −80 dBm excellent) →
yellow (−90 to −80 dBm good) → orange (−100 to −90 dBm fair) → red (< −100 dBm poor).
Computed using COST-Hata with terrain and clutter corrections.

**🔵 Best Server Plot (BSP)**: The map divided into solid color zones — each color
represents one cell's "dominant" footprint where it provides the strongest signal.
Directly maps to Atoll's Best Server display. Critical for handover boundary analysis.

**🔴 SINR / Interference**: Highlights interference hot zones in hot colors (red).
Each pixel shows SINR accounting for all co-channel cells in the area. Identifies
where ICIC, antenna tilt changes, or frequency reuse planning is needed.

**GIS interaction**:
• Clutter shading: urban zone shows signal "shadows" behind simulated building blocks
• Terrain effect: signal propagates differently over hills vs. flat terrain
• The prediction computation is animated — watch the raster fill in row by row, exactly
  like Atoll's progress animation during a prediction run

**What to watch**: Switch between all three layers for the same set of cells — the same
physical network looks completely different depending on which metric you're viewing.`,
      },
      {
        heading: "Key Metrics Glossary",
        icon: "📚",
        body: `**RSRP** (Reference Signal Received Power): Raw signal strength in dBm.
  Excellent: > −80 | Good: −80 to −90 | Fair: −90 to −100 | Poor: < −100 dBm

**RSRQ** (Reference Signal Received Quality): Combines RSRP and interference.
  Good: > −10 dB | Fair: −10 to −15 dB | Poor: < −15 dB

**SINR** (Signal-to-Interference-plus-Noise Ratio): Key quality metric.
  Excellent: > 20 dB | Good: 10–20 dB | Fair: 0–10 dB | Poor: < 0 dB

**PRB** (Physical Resource Block): Smallest schedulable unit. 1 PRB = 180 kHz × 1 slot (0.5ms in NR 15kHz SCS).

**MCS** (Modulation & Coding Scheme): Higher = faster but needs cleaner signal.
  MCS 0 = QPSK (robust) → MCS 28 = 256QAM (fast, needs SINR > 22 dB)

**CQI** (Channel Quality Indicator): UE feedback (0–15) for MCS selection.

**TTT** (Time-to-Trigger): Duration A3 event must persist before HO is triggered.

**SSB** (Synchronization Signal Block): 5G NR broadcast signal for cell detection.

**TDD** (Time Division Duplex): DL and UL share same frequency but alternate in time.
**FDD** (Frequency Division Duplex): DL and UL use separate frequency bands simultaneously.

**NR** (New Radio): The 5G radio standard defined in 3GPP Release 15+.

**gNB** (Next-Generation NodeB): 5G NR base station.
**eNB** (Evolved NodeB): 4G LTE base station.
**TRP** (Transmission/Reception Point): 5G NR antenna unit (may be distributed from gNB).`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Run in sequence**: Coverage Prediction → Interference → Capacity tells a complete story — coverage sets the boundary, interference degrades it, capacity fills it.
• **Coverage Prediction** is the richest visualization — switch between RSRP, BSP, and SINR overlays to see how the same network looks from each perspective.
• **Massive MIMO** is most impactful with 8 UEs spread >15° apart — watch MU-MIMO assign separate beams simultaneously.
• **SON Self-Healing**: trigger it immediately after loading the Capacity tab to 90% — watch MLB redistribute load before running self-heal.
• **Slicing + Edge Compute** are companion scenarios — run them together to see how URLLC slice latency depends on MEC being within 1ms.
• **DSS scenario**: use the 4G/5G ratio slider in real time during the simulation — watch the PRB split adjust dynamically as you move the slider.
• **Drive Test tab**: zoom into RLF cluster locations on the map and cross-reference with the Interference tab's SINR heatmap — the root cause is usually visible immediately.
• **Handover Storm scenario**: after seeing HO failures with default params, tune the A3 offset and TTT sliders and re-run — the "before/after" makes parameter tuning intuitive.`,
      },
    ],
  },
};

// ─── Glossary (shared across all tabs) ──────────────────────────────────────
const SHARED_GLOSSARY = [
  { term: "ONT", def: "Optical Network Terminal — fiber modem at customer premises" },
  { term: "OLT", def: "Optical Line Terminal — aggregates up to 512 ONTs per PON port" },
  { term: "BNG", def: "Broadband Network Gateway — authenticates subscribers, assigns IPs" },
  { term: "MPLS", def: "Multi-Protocol Label Switching — label-based forwarding for the ISP core" },
  { term: "BGP", def: "Border Gateway Protocol — routing protocol used between ISPs and at peering points" },
  { term: "DWDM", def: "Dense Wavelength Division Multiplexing — multiple wavelengths on one fiber" },
  { term: "gNB", def: "Next-Generation NodeB — 5G NR base station (replaces 4G eNB)" },
  { term: "PRB", def: "Physical Resource Block — smallest scheduling unit in LTE/NR" },
  { term: "SINR", def: "Signal-to-Interference-plus-Noise Ratio — key quality metric in RAN" },
  { term: "MEC", def: "Multi-access Edge Computing — compute placed close to the RAN" },
  { term: "SON", def: "Self-Organizing Network — automated RAN parameter optimization" },
  { term: "RFC 2544", def: "Standard for measuring throughput, latency, frame loss in networks" },
  { term: "Y.1564", def: "ITU-T EtherSAM — service activation test for Carrier Ethernet circuits" },
  { term: "L3VPN", def: "Layer 3 VPN — MPLS-based private WAN using BGP/VRF" },
  { term: "EVC", def: "Ethernet Virtual Circuit — MEF-standard carrier Ethernet service" },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function HelpModal({ tabId, onClose }) {
  const content = HELP_CONTENT[tabId];
  const [activeSection, setActiveSection] = useState(0);
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState("");

  if (!content) return null;

  const accentColor = content.color;
  const filteredGlossary = SHARED_GLOSSARY.filter(
    (g) =>
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.def.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  function renderBody(text) {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} style={{ margin: "0 0 6px 0", color: "#cbd5e1", lineHeight: 1.65, fontSize: 13 }}>
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} style={{ color: "#f1f5f9" }}>
                {part.slice(2, -2)}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "min(92vw, 1100px)", height: "min(90vh, 760px)",
          background: "#0a1628", border: `1px solid ${accentColor}44`,
          borderRadius: 16, display: "flex", flexDirection: "column",
          boxShadow: `0 0 60px ${accentColor}22`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px", borderBottom: "1px solid #1e3a5f",
            background: "#0d1f3c",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>
              {content.title}
            </div>
            <div style={{ fontSize: 12, color: accentColor, marginTop: 2 }}>
              {content.subtitle}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowGlossary(!showGlossary)}
              style={{
                background: showGlossary ? accentColor + "33" : "transparent",
                border: `1px solid ${accentColor}55`,
                color: accentColor, borderRadius: 8,
                padding: "6px 14px", fontSize: 12, cursor: "pointer",
              }}
            >
              📚 Glossary
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent", border: "1px solid #334155",
                color: "#94a3b8", borderRadius: 8,
                padding: "6px 12px", fontSize: 14, cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left nav */}
          {!showGlossary && (
            <div
              style={{
                width: 200, borderRight: "1px solid #1e3a5f",
                padding: "16px 0", overflowY: "auto", flexShrink: 0,
                background: "#0c1a30",
              }}
            >
              {content.sections.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "10px 18px",
                    background: activeSection === i ? `${accentColor}22` : "transparent",
                    borderLeft: activeSection === i ? `3px solid ${accentColor}` : "3px solid transparent",
                    border: "none", borderRadius: 0,
                    color: activeSection === i ? "#f1f5f9" : "#64748b",
                    fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ lineHeight: 1.3 }}>{s.heading}</span>
                </button>
              ))}
            </div>
          )}

          {/* Main content */}
          <div
            style={{
              flex: 1, padding: "24px 28px", overflowY: "auto",
            }}
          >
            {showGlossary ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
                  📚 Network Glossary
                </div>
                <input
                  placeholder="Search terms…"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 14px",
                    background: "#0d1f3c", border: "1px solid #1e3a5f",
                    borderRadius: 8, color: "#f1f5f9", fontSize: 13,
                    marginBottom: 16, boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredGlossary.map((g) => (
                    <div
                      key={g.term}
                      style={{
                        background: "#0d1f3c", border: "1px solid #1e3a5f",
                        borderRadius: 8, padding: "10px 14px",
                        display: "flex", gap: 14, alignItems: "flex-start",
                      }}
                    >
                      <span
                        style={{
                          color: accentColor, fontWeight: 700,
                          fontSize: 12, minWidth: 80, paddingTop: 1,
                        }}
                      >
                        {g.term}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                        {g.def}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Section breadcrumb */}
                <div style={{ fontSize: 10, color: "#475569", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {content.title} › {content.sections[activeSection].heading}
                </div>

                {/* Section heading */}
                <div
                  style={{
                    fontSize: 18, fontWeight: 700, color: "#f1f5f9",
                    marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{content.sections[activeSection].icon}</span>
                  {content.sections[activeSection].heading}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: `${accentColor}33`, marginBottom: 18 }} />

                {/* Body text */}
                <div>{renderBody(content.sections[activeSection].body)}</div>

                {/* Section nav arrows */}
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    marginTop: 32, paddingTop: 16,
                    borderTop: "1px solid #1e3a5f",
                  }}
                >
                  <button
                    disabled={activeSection === 0}
                    onClick={() => setActiveSection((s) => s - 1)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${activeSection === 0 ? "#1e3a5f" : accentColor + "55"}`,
                      color: activeSection === 0 ? "#334155" : accentColor,
                      borderRadius: 8, padding: "7px 16px",
                      fontSize: 12, cursor: activeSection === 0 ? "not-allowed" : "pointer",
                    }}
                  >
                    ← Previous
                  </button>
                  <span style={{ color: "#475569", fontSize: 11, alignSelf: "center" }}>
                    {activeSection + 1} / {content.sections.length}
                  </span>
                  <button
                    disabled={activeSection === content.sections.length - 1}
                    onClick={() => setActiveSection((s) => s + 1)}
                    style={{
                      background: activeSection === content.sections.length - 1 ? "transparent" : `${accentColor}22`,
                      border: `1px solid ${activeSection === content.sections.length - 1 ? "#1e3a5f" : accentColor + "55"}`,
                      color: activeSection === content.sections.length - 1 ? "#334155" : accentColor,
                      borderRadius: 8, padding: "7px 16px",
                      fontSize: 12, cursor: activeSection === content.sections.length - 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 24px", borderTop: "1px solid #1e3a5f",
            background: "#0c1a30", display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {content.sections.map((_, i) => (
              <div
                key={i}
                onClick={() => setActiveSection(i)}
                style={{
                  width: activeSection === i ? 18 : 6,
                  height: 6, borderRadius: 3,
                  background: activeSection === i ? accentColor : "#1e3a5f",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              />
            ))}
          </div>
          <span style={{ color: "#334155", fontSize: 10 }}>
            NorthStar Fiber · NetworkSIM Help
          </span>
        </div>
      </div>
    </div>
  );
}
