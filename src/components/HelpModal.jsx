import { useState } from "react";

// ─── Help content per tab ────────────────────────────────────────────────────
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

The canvas spans 7 distinct network layers: Customer Premises (ONT/CPE), Access (OLT/DSLAM),
Aggregation, Core MPLS, Data Center / BNG, Peering, and Management Plane. Together they form
a production-accurate model of how packets travel from a customer's home to the internet.`,
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
and every capacity forecast depends on knowing where nodes sit and how they connect.`,
      },
      {
        heading: "How the Simulation Engine Works",
        icon: "⚙️",
        body: `The engine drives 8 provisioning flows and 5 fault scenarios.

**Provisioning Flows** animate the step-by-step signaling path of real workflows:
fiber cut → OTDR detection → dispatch, ONT activation → RADIUS auth → DHCP → BGP prefix,
BNG session bring-up, MPLS LSP provisioning, peering policy push, and more.

**Fault Injection** models real failure modes: fiber cuts, power outages, BGP route flaps,
DDoS storms, and hardware failures. Each fault triggers cascading status changes across
dependent nodes and auto-generates a remediation timeline.

**Capacity Dynamics**: Every node has a capacity percentage. The engine raises capacity
on active nodes during simulation runs. When capacity exceeds 55% it turns warning (amber);
above 80% it turns critical (red). This mirrors real NOC dashboards.`,
      },
      {
        heading: "Key Metrics & Indicators",
        icon: "📊",
        body: `**Node border color:**
  🟢 Green = Healthy  🟡 Amber = Warning (55–80% capacity)  🔴 Red = Critical (>80%)
  🔵 Blue = Provisioning in progress  ⚪ Grey = Device offline

**Edge animation speed** — faster pulse = higher traffic volume on that link

**Stats Bar (top)** — shows aggregate healthy/warning/critical counts and active sim name

**Event Log (right panel)** — timestamped feed of every provisioning step, fault event,
and remediation action. Click any event to highlight its source node on the canvas.

**Layer Filter** — toggle visibility by network layer to focus on a specific tier (e.g.,
show only Access + Aggregation layers when troubleshooting last-mile issues).`,
      },
      {
        heading: "Common Workflows",
        icon: "🔄",
        body: `**Run a Provisioning Simulation:**
1. Open the Simulation panel (left sidebar)
2. Choose a flow (e.g., "New Fiber Customer ONT Activation")
3. Click ▶ Run — watch nodes light up step by step
4. Pause anytime; use the speed slider to slow down and study each step
5. Open the Config Generator to see the real CLI commands generated at each step

**Inject a Fault:**
1. Open Fault Injector panel → choose a scenario (e.g., "Fiber Cut — Backbone Ring")
2. Nodes on the affected path turn red; the Event Log fills with alarm events
3. Observe auto-healing: the simulation reroutes traffic within 30 seconds

**Export a Recording:**
1. Click 🔴 Record (top bar) → run your simulation → Stop
2. Export as WebM video or animated GIF for training decks or NOC runbooks`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Zoom + Pan**: Scroll wheel to zoom; click-drag the canvas to pan. Use MiniMap (bottom-right) to jump to a region.
• **Click any node** to open the Node Detail Panel — it shows live stats, neighbor links, and device specs.
• **Double-click a node** to open the expanded Node Modal with full config, provisioning history, and capacity trend.
• **What-If Planner**: Adjust traffic load or node capacity via sliders to see how the network would respond — useful for CAPEX justification.
• **AI Runbook**: After running any simulation, click "Generate Runbook" to get a structured NOC procedure document for that exact scenario.`,
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
modeled after how real Tier-1 and Tier-2 ISPs provision business circuits.

It simulates the complete lifecycle of six circuit types:
• **L3VPN** — Enterprise MPLS private WAN with full BGP peering
• **EVC / E-LINE** — Carrier Ethernet point-to-point (MEF-compliant)
• **DIA Internet** — Dedicated Internet Access with BGP or static routing
• **Wave / DWDM** — 100G/400G optical wavelength service
• **Mobile Backhaul** — eCPRI/CPRI fronthaul for 4G/5G cell sites
• **DCI** — Data Center Interconnect for active-active or DR deployments

An 8-phase simulation engine animates every provisioning step from service order
intake through physical cross-connect, logical configuration, and turn-up testing.`,
      },
      {
        heading: "Why Does It Matter?",
        icon: "💡",
        body: `Enterprise circuit provisioning is the highest-revenue, highest-complexity workflow
in a carrier's operational stack. A single missed step can:
• Delay an enterprise go-live by days (costing $10K–$100K in penalties)
• Cause a routing loop that takes down adjacent circuits
• Fail an SLA audit because the activation test wasn't run correctly

This simulator lets engineers, sales teams, and NOC staff:
• **Pre-validate** that a circuit is feasible before committing to a customer
• **Train** on the exact sequence of CLI commands and API calls required
• **Debug** provisioning failures by replaying the step that failed
• **Generate** customer-ready turn-up reports with one click`,
      },
      {
        heading: "The 8-Phase Simulation Engine",
        icon: "⚙️",
        body: `Each circuit traverses 8 ordered phases — each phase runs multiple steps:

1. **Service Order Intake** — validate customer data, circuit type, A/Z sites, bandwidth, SLA
2. **Inventory Reservation** — claim fiber strands, port pairs, VLAN IDs, MPLS labels, IP blocks
3. **Feasibility Gates** — optical power budget, fiber availability, port capacity checks
4. **Physical Cross-Connect** — patch panel assignments, MDF/IDF cross-connect records
5. **Device Configuration** — push vendor-accurate CLI/NETCONF/gNMI configs to each device
6. **Optical Turn-Up** — DWDM channel assignment, OSNR measurement, BER validation
7. **Logical Bring-Up** — BGP peering, VLAN tagging, MPLS LDP/RSVP-TE LSP establishment
8. **Activation Testing** — RFC 2544 throughput/latency/loss test + Y.1564 EtherSAM

Each step shows: timestamp, system actor, action, and the exact configuration command or
API payload that system would push to the real device.`,
      },
      {
        heading: "Key Features",
        icon: "📊",
        body: `**Equipment Chain Visualizer** — animated A→Z vendor device chain showing signal
flow across CE → Metro Agg → PE Router → Optical Transport → PE → CE (far end).
Vendors include: Cisco ISR/ASR/Nexus, Juniper MX/SRX, Nokia 7750/7210/7360,
Ciena 6500, Infinera DTN-X, Calix E7, Arista 7000.

**Optical Budget Calculator** — real dB math: Tx power − fiber loss (0.2dB/km × distance)
− connector loss − splice loss = Rx power vs. receiver sensitivity. Shows pass/fail.

**Config / Payload / Log tabs** per step:
  ⚙️ Config = vendor CLI (IOS-XR, Junos, SROS, etc.)
  📤 Payload = REST/NETCONF/gNMI API body
  📋 Log = syslog-format audit trail

**Inventory Scoreboard** — animated capacity bars for: fiber strands, switch ports, VLANs,
MPLS labels, IP addresses, and optical transceivers.

**XLSX Export** — 3-sheet report: Circuit Summary, Inventory Consumed, Feasibility Gates.`,
      },
      {
        heading: "5 Inner Sub-Tabs",
        icon: "🗂️",
        body: `**📋 Simulation** — the main 8-phase step log + live config panel (55/45 split layout)

**🗄 Inventory** — real-time scoreboard of all reserved resources for this circuit;
shows before/after counts for fiber, ports, VLANs, labels, IPs, transceivers

**🗺 Path Map** — Leaflet map showing the A→Z working path and protection path;
click any segment to see span details and optical parameters

**✅ Tests** — RFC 2544 + Y.1564 animated test runner; shows throughput waterfall,
latency CDF, frame loss heatmap, and jitter histogram — all rendered in real time

**⚙️ Configs** — consolidated view of all device configs generated during the circuit
turn-up; filter by device, by phase, or by vendor CLI syntax`,
      },
      {
        heading: "Common Workflows",
        icon: "🔄",
        body: `**Plan a new enterprise circuit:**
1. Select circuit type (e.g., L3VPN)
2. Fill the service order form: A-site, Z-site, bandwidth, protection type, SLA tier
3. Click "Run Simulation" → watch all 8 phases animate
4. Review the Feasibility Gates — if any gate fails, the panel explains why and suggests augmentation
5. Export the XLSX turn-up report to send to the provisioning team

**Explore a specific config:**
1. After simulation completes, click any ✅ green step to pin it
2. Switch between Config / Payload / Log tabs to study that step's outputs
3. Copy the CLI snippet to use as a template in your real network

**Validate optical budget before ordering DWDM wavelength:**
1. Choose Wave/DWDM circuit type
2. Enter span distance and fiber type
3. Check the Optical Budget Calculator output in Phase 6 — if Rx power < sensitivity, you need an inline amplifier`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Click completed steps** (✅) at any point — the live config panel updates to show that step's config even after the simulation has moved on.
• The **Session Circuit Registry** (bottom of the tab) logs every circuit you've planned. Click any past circuit to replay its simulation.
• **Protection types** (1+1, 1:N, Unprotected) dramatically change which phases run and what inventory gets consumed — try all three to compare.
• The **Activation Test panel** is standalone — you can re-run tests independently after the simulation completes to model a re-test scenario.
• **SLA Tier** (Bronze/Silver/Gold/Platinum) changes the feasibility gate thresholds — Platinum requires tighter optical margins and dual-plane routing.`,
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
optimize, and evolve a multi-generation RAN across an urban, suburban, and rural service territory.

The simulation spans 12+ functional domains:
Capacity Engineering · Coverage & Propagation · Interference Management · Massive MIMO Beamforming ·
SON (Self-Organizing Network) · Edge Compute Placement · QoE Optimization · Spectrum Planning ·
Handover Engineering · Network Slicing · RAN Lifecycle · and the Atoll-style Coverage Prediction engine.

Each domain has its own interactive simulation with real-time animated visualizations.`,
      },
      {
        heading: "Why Does It Matter?",
        icon: "💡",
        body: `Radio network planning is fundamentally different from wireline planning because the medium
is shared, contested, and subject to physics that can't be "engineered away":

• **Spectrum is finite** — every Hz of bandwidth assigned to one user is unavailable to another
• **Interference is invisible** — two cell sites 5km apart may devastate each other's SINR
• **Propagation is probabilistic** — the same signal path has different loss at 2AM vs noon
• **Capacity is elastic** — 5G NR can serve 1 Gbps or 1 Mbps to the same user depending on
  conditions, making SLA guarantees fundamentally harder than wireline

This simulator exists to let engineers, architects, and students explore these dynamics
in a safe, instrumented environment — without needing access to a live RAN or Atoll/Planet licenses.`,
      },
      {
        heading: "Simulation 1 — Capacity Engineering",
        icon: "📊",
        body: `**What**: Models how spectrum resources (PRBs in LTE/NR) are allocated among competing users
across a cell sector. Tracks PUSCH/PDSCH utilization, scheduler efficiency, and throughput.

**How it works**: The simulator places N UEs in a sector with configurable traffic profiles
(eMBB / URLLC / mMTC). A simplified proportional-fair scheduler distributes PRBs each TTI.
Throughput is calculated using Shannon capacity: C = B × log₂(1 + SINR).

**What to watch**: The PRB utilization bar. When it crosses 70%, the sector is "loaded" —
adding more users degrades everyone's throughput, not just new users. This is the fundamental
case for cell densification or carrier aggregation.

**Key metrics**: PRB utilization %, cell throughput (Mbps), average UE throughput (Mbps),
scheduler efficiency %, spectral efficiency (bps/Hz).`,
      },
      {
        heading: "Simulation 2 — Coverage & Propagation",
        icon: "📡",
        body: `**What**: Computes signal propagation from a cell site using the COST-Hata propagation model
(or extended COST-231 for urban environments) and renders a coverage footprint.

**How it works**: The simulator runs a simplified ray-based path loss calculation across a
grid of sample points. Path loss = 46.3 + 33.9×log(f) − 13.82×log(hb) − a(hm) + (44.9 − 6.55×log(hb))×log(d)
Each grid point gets an RSRP value. Points below −110 dBm are "uncovered."

**Clutter correction**: Urban dense (+8dB loss), suburban (+3dB), rural (0dB baseline),
water bodies (−5dB — better propagation over water).

**What to watch**: The green-to-red heatmap expanding from the tower. Notice how coverage
collapses in dense urban areas (clutter loss) and extends over open terrain.`,
      },
      {
        heading: "Simulation 3 — Interference Analysis",
        icon: "⚡",
        body: `**What**: Models inter-cell interference (ICI) between adjacent cells and calculates
the Signal-to-Interference-plus-Noise Ratio (SINR) at each point in the coverage area.

**Why it matters**: Interference is the primary limiting factor in dense deployments. Two cells
on the same frequency channel 3km apart can still interfere enough to cut SINR by 10 dB —
reducing throughput by 60% at cell edge.

**How it works**: For each grid point, the simulator calculates the received power from the
serving cell and the aggregate interference from all neighboring cells on the same channel.
SINR = P_serving / (P_interference_sum + P_noise).

**What to watch**: The SINR heatmap. Red zones (low SINR < 0 dB) at cell edges indicate
where Inter-Cell Interference Coordination (ICIC) or frequency reuse planning is needed.`,
      },
      {
        heading: "Simulation 4 — Massive MIMO Beamforming",
        icon: "🔭",
        body: `**What**: Visualizes 5G NR Massive MIMO beam patterns from a 64T64R antenna array
(typical of Nokia AirScale, Ericsson AIR 6449, or Huawei AAU5613).

**How it works**: The simulator generates azimuth-elevation beam patterns for up to 8
simultaneous spatial streams (layers). Each beam is rendered as a polar plot showing
gain in dBi across the azimuth plane. Multi-User MIMO (MU-MIMO) shows how multiple
beams are directed simultaneously to different UEs in the same time-frequency resource.

**The key insight**: A 64T64R array provides ~21 dBi passive gain + 3D spatial multiplexing.
In ideal conditions, 8-layer MU-MIMO delivers 8× the single-user throughput — but only
when UEs are sufficiently separated in angle (>15° angular separation).

**What to watch**: The beam sweeping animation — each beam tracks a different UE. Notice how
beams narrow (higher gain) as the array size increases.`,
      },
      {
        heading: "Simulation 5 — Handover Engineering",
        icon: "🔄",
        body: `**What**: Simulates UE mobility events — a device moving through the coverage area and
triggering X2/Xn-based handovers between cells.

**Why it matters**: A poorly tuned handover causes:
• **Too-early HO**: UE disconnects before the target cell is ready → call drop
• **Too-late HO**: UE stays on a degrading cell too long → throughput collapse
• **Ping-pong**: UE oscillates between two cells → excessive signaling overhead

**How it works**: The simulator uses the A3 event trigger: HO initiated when
RSRP(target) − RSRP(serving) > Hysteresis for Time-To-Trigger (TTT) duration.
Default params: A3 offset = 3dB, Hysteresis = 1dB, TTT = 480ms.

**What to watch**: The UE path animation — blue line (serving cell), green line (target cell).
The RSRP chart shows the moment both curves cross + TTT countdown.`,
      },
      {
        heading: "Simulation 6 — SON Strategy",
        icon: "🤖",
        body: `**What**: Demonstrates Self-Organizing Network algorithms — the automation layer that
continuously adjusts RAN parameters without human intervention.

**Three SON functions simulated:**
• **MLB (Mobility Load Balancing)**: Detects an overloaded cell and automatically adjusts
  CRS power, antenna tilt, and handover thresholds to redistribute load to neighbors.
• **MRO (Mobility Robustness Optimization)**: Detects too-early or too-late handover events
  from MDT (Minimization of Drive Tests) data and auto-corrects A3 offset and TTT.
• **ANR (Automatic Neighbor Relations)**: UEs report heard-but-not-configured cells;
  SON automatically adds them to the neighbor list and X2 peering.

**What to watch**: The "before/after" capacity bar on the overloaded cell during MLB —
within 60 seconds of simulation time, load redistributes across neighbors.`,
      },
      {
        heading: "Simulation 7 — Coverage Prediction (Atoll-Style)",
        icon: "🗺️",
        body: `**What**: This is the flagship GIS simulation — an Atoll-inspired propagation prediction
engine that renders dynamic, multi-layer thematic heatmaps over a real Leaflet map.

**Three prediction modes:**

**Signal Level (RSRP)** — a pixel-grid heatmap color-coded green→yellow→red showing
received signal power from each cell. Each pixel is computed using the COST-Hata model
with terrain and clutter corrections applied.

**Best Server Plot (BSP)** — the map is divided into solid color zones, each color
representing the cell with the dominant signal at that location. Shows natural coverage
footprints and identifies where cell boundaries sit — critical for handover planning.

**SINR / Interference** — highlights interference hot zones in red where overlapping
cells degrade quality. These zones are where ICIC, frequency reuse, or antenna tilting
is needed.

**GIS interaction**: Clutter shading renders "shadows" behind simulated building blocks
in the urban zone. Terrain contours cause signals to propagate differently over hills vs.
flat terrain. The animation shows the prediction computing in real time — just like
Atoll's prediction rendering progress bar.`,
      },
      {
        heading: "Simulation 8 — Network Slicing",
        icon: "🍰",
        body: `**What**: Simulates 5G core network slicing — the ability to partition a single physical RAN
into multiple logical networks, each with isolated resources and customized QoS.

**Three slice types (3GPP SSTs):**
• **eMBB (Slice 1)** — Enhanced Mobile Broadband; maximizes throughput for video streaming,
  FWA, and general consumer data. Guaranteed 80% PRB share.
• **URLLC (Slice 2)** — Ultra-Reliable Low Latency; for autonomous vehicles, industrial IoT,
  and remote surgery. Guaranteed <1ms latency; uses mini-slots (2-symbol TTI).
• **mMTC (Slice 3)** — Massive Machine Type; for IoT sensors; low throughput but supports
  1M devices/km². Uses NB-IoT/LTE-M radio channels.

**What to watch**: The slice resource allocation bars — when URLLC traffic spikes,
the slice scheduler protects its PRB reservation at the expense of eMBB. This is the
"hard slicing" vs. "soft slicing" trade-off in real networks.`,
      },
      {
        heading: "Simulation 9 — Edge Compute Placement",
        icon: "🖥️",
        body: `**What**: Models Multi-access Edge Computing (MEC) placement decisions and their impact
on application latency.

**The core trade-off**: Placing compute closer to the RAN (at the gNB or DU site) reduces
latency but increases infrastructure cost and complexity. Placing it centrally (at the
regional data center) is cheaper but adds round-trip latency.

**Tromboning effect**: If an application server is centrally placed but the UE's traffic
is routed: UE → gNB → CU → core DC → application server → back to core DC → CU → gNB → UE,
the traffic "trombones" through the core even for local sessions. The simulation shows
the RTT penalty of each placement option.

**What to watch**: The latency breakdown bars — RAN latency (fixed ~4ms), backhaul
latency (varies with distance), core processing latency (varies with placement).
Optimal MEC placement cuts the application RTT from 50ms to <10ms for local content.`,
      },
      {
        heading: "Key Metrics Glossary",
        icon: "📚",
        body: `**RSRP** (Reference Signal Received Power): Raw signal strength in dBm.
  Excellent: > −80 dBm | Good: −80 to −90 | Fair: −90 to −100 | Poor: < −100 dBm

**SINR** (Signal-to-Interference-plus-Noise Ratio): Signal quality relative to noise.
  Excellent: > 20 dB | Good: 10–20 dB | Fair: 0–10 dB | Poor: < 0 dB

**PRB** (Physical Resource Block): Smallest schedulable unit in LTE/NR. Each PRB = 180 kHz × 0.5ms.

**MCS** (Modulation & Coding Scheme): Higher MCS = higher throughput but needs better SINR.
  MCS 0 = QPSK (robust, slow) → MCS 28 = 256QAM (fast, needs clean signal)

**Spectral Efficiency**: Throughput per Hz of bandwidth (bps/Hz). 5G NR theoretical max = ~30 bps/Hz.

**CQI** (Channel Quality Indicator): UE feedback (0–15) telling the scheduler what MCS to use.

**TA** (Timing Advance): Compensates for propagation delay; sets the max usable cell radius.

**SSB** (Synchronization Signal Block): 5G NR broadcast signal UEs use to detect and measure cells.`,
      },
      {
        heading: "Pro Tips",
        icon: "🏆",
        body: `• **Run simulations in sequence**: Coverage → Interference → Capacity tells a complete story — coverage sets the boundary, interference degrades it, capacity fills it.
• **The Coverage Prediction simulation** is the most visually rich — use the layer toggle to switch between RSRP, BSP, and SINR overlays to see how the same site looks from each perspective.
• **Massive MIMO beamforming** is most impactful in dense urban scenarios — run it with 8 UEs spread 20° apart and watch MU-MIMO serve them all simultaneously.
• **SON Strategy** should be run after the Capacity Engineering sim — trigger MLB after loading a cell to 90% and observe the autonomous rebalancing.
• **Network Slicing** + **Edge Compute** are companion simulations — run them together to see how URLLC slice performance depends on MEC placement being <1ms away.`,
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
