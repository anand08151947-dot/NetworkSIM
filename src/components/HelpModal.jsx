import { useEffect } from "react";

// ─── Per-tab help content ─────────────────────────────────────────────────────

const HELP_CONTENT = {
  topology: {
    icon: "🗺️",
    title: "Network Topology",
    subtitle: "Interactive ISP stack visualization — from customer premises to internet exchange",
    color: "#60a5fa",
    overview: `The Network Topology tab is the primary simulation canvas of NorthStar Fiber's NOC. 
It renders a live, 30+ node ReactFlow graph spanning 7 distinct network layers — from the 
customer-premises ONT all the way through access OLTs, aggregation switches, BNG, MPLS 
core, and border routers to the internet exchange.

Every node pulses with real capacity data that drifts over time (SimEngine). You can launch 
provisioning simulations that animate highlighted paths across the graph, or inject faults 
that cascade through the network — just like a real NOC engineer watching a live network map.`,
    panels: [
      {
        name: "Simulation Panel (left)",
        desc: "8 end-to-end provisioning flows. Each flow animates a step-by-step highlighted path: Residential ONT Activation, Business Fiber, MPLS L3VPN, Carrier Ethernet, BGP Peering, OTN Wave, DIA Internet, GPON Mass Event. Select a flow and click Run."
      },
      {
        name: "Fault Injector (left)",
        desc: "5 fault scenarios that break parts of the network and watch it heal: Fiber Cut (OLT-1), BNG Failover, Core Router BGP Session Drop, Power Failure (CO-3), GPON ONT Mass Deregistration. Each scenario shows a remediation sequence."
      },
      {
        name: "Layer Filter (left)",
        desc: "Toggle visibility of any of the 7 network layers: Customer Premises, Access (GPON), Aggregation, BNG/Edge, MPLS Core, Optical Transport, Internet Edge. Useful for isolating a specific layer during review."
      },
      {
        name: "Topology Canvas (center)",
        desc: "ReactFlow canvas with drag, zoom, minimap, and node selection. Nodes color-code by health: green = healthy, yellow = warning (>55% capacity), red = critical (>80%). Click any node to open its detail panel on the right."
      },
      {
        name: "Event Log (right)",
        desc: "Live timestamped feed of all simulation events, fault alerts, and remediation messages. Scrollable, color-coded by severity."
      },
      {
        name: "Node Detail Panel (right)",
        desc: "When a node is selected, shows: equipment type, capacity bar, subscriber count, connected peers, and real-time stats. Click the expand icon for a full-screen detail modal."
      },
      {
        name: "Config Generator & AI Runbook (right)",
        desc: "Config Generator produces real device CLI/API configs (Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox API, RADIUS, DHCP, BGP). AI Runbook auto-generates a step-by-step NOC runbook for the active simulation."
      },
    ],
    howTo: [
      "Click a simulation flow (e.g. 'Residential ONT Activation') → press ▶ Run",
      "Watch the path light up node-by-node across the topology canvas",
      "Open the Event Log to read each step's technical detail",
      "Click any highlighted node to view its config in the Config Generator",
      "Try injecting a fault mid-simulation to see the auto-remediation sequence",
      "Switch roles (NOC / Sales / Exec / Field Tech) to change the detail level of the event log",
    ],
    glossary: [
      ["ONT", "Optical Network Terminal — the fiber modem at the customer premises"],
      ["OLT", "Optical Line Terminal — aggregates up to 128 ONTs per GPON port"],
      ["BNG", "Broadband Network Gateway — authenticates subscribers via RADIUS, applies QoS"],
      ["MPLS", "Multi-Protocol Label Switching — the ISP backbone switching fabric"],
      ["BGP", "Border Gateway Protocol — exchanges routes with upstream transit providers"],
      ["OTN", "Optical Transport Network — 100G/400G wavelength layer with APS protection"],
      ["PON", "Passive Optical Network — shared fiber from OLT to ONTs using splitters"],
      ["GPON", "Gigabit PON — 2.5G/1.25G shared downstream/upstream to 128 subscribers"],
    ],
  },

  geo: {
    icon: "🌐",
    title: "Geographic Map",
    subtitle: "Live React Leaflet PNW map of Central Offices, fiber routes, and capacity",
    color: "#34d399",
    overview: `The Geographic Map tab places NorthStar Fiber's network on a real map of the 
Pacific Northwest. Central Offices, Points of Interconnect, and Edge nodes appear as 
color-coded circle markers scaled by subscriber count. Fiber routes between sites are 
drawn as polylines whose thickness and color encode real-time utilization.

This view answers the question a NOC engineer or Field Tech most often asks: 
"Where are my assets, and which routes are congested right now?"`,
    panels: [
      {
        name: "Node Markers",
        desc: "Each site appears as a circle whose color encodes health (green/yellow/red) and radius encodes subscriber count. Hover to see the site name and type. Click to select and open the detail card."
      },
      {
        name: "Fiber Routes",
        desc: "Polylines connect sites along real geographic paths. Line weight encodes utilization: thin = low, thick = high. Color shifts from blue (normal) to orange/red as utilization climbs above 60–80%."
      },
      {
        name: "Regional Summary Panels",
        desc: "Pop-up info cards showing aggregate stats per region: total subscribers, average capacity, number of active sites, and any active alerts in that region."
      },
      {
        name: "Node Detail Card",
        desc: "Clicking a site opens a detail card showing: equipment type, capacity bar, subscriber count, connected links and their speeds, power status, and last-seen timestamp."
      },
    ],
    howTo: [
      "Pan and zoom the map to explore the PNW coverage area",
      "Click any site marker to open its detail card",
      "Look at line thickness — thick orange/red routes are near capacity",
      "Use the regional summary cards to identify which area has the most stress",
      "Cross-reference with the Topology tab to drill into a specific site's equipment",
    ],
    glossary: [
      ["CO", "Central Office — the physical facility housing OLTs, aggregation switches, and BNG"],
      ["POI", "Point of Interconnect — where NorthStar fiber meets another carrier's network"],
      ["Backbone Ring", "Dual-fiber MPLS ring connecting COs for redundancy (east + west paths)"],
      ["Utilization", "Percentage of the link's capacity currently in use (Mbps used / Mbps max)"],
      ["Latency", "Round-trip time in milliseconds between two sites on the map"],
    ],
  },

  circuit: {
    icon: "📡",
    title: "Circuit Planner",
    subtitle: "Carrier-grade Telco circuit orchestration simulator — 8-phase end-to-end provisioning",
    color: "#f59e0b",
    overview: `The Circuit Planner simulates the full lifecycle of creating a carrier-grade circuit 
in a real Telco operations environment. From sales order through network design, vendor 
equipment configuration, optical budget calculation, protection planning, activation testing, 
and final handoff — this is what a carrier's OSS/BSS would orchestrate automatically.

Use this tab to understand how a circuit like a 10G L3VPN, a DWDM wavelength, or a 
Mobile Backhaul pseudowire goes from a customer order to a live service — in seconds 
instead of the weeks it takes in the real world.`,
    panels: [
      {
        name: "Circuit Wizard (left)",
        desc: "Service order form: choose Circuit Type (L3VPN, EVC/E-LINE, DIA Internet, Wave/DWDM, Mobile Backhaul, DCI), A/Z endpoints, bandwidth (1M–100G), protection level, and SLA tier. The wizard validates inputs before simulation starts."
      },
      {
        name: "Equipment Chain (left)",
        desc: "Animated A→Z vendor device chain showing the exact equipment traversed: CE router → Metro Agg → PE Router → Optical (DWDM) → Access. Devices glow as each phase touches them. Vendors include Cisco, Juniper, Nokia, Ciena, Infinera, Arista, Calix."
      },
      {
        name: "Optical Budget Calculator (left)",
        desc: "Real dB math for DWDM and Wave circuits: calculates span loss, amplifier gain, OSNR, and dispersion budget. Shows pass/fail for each optical parameter with actual measured vs. threshold values."
      },
      {
        name: "Session Circuit Registry (left)",
        desc: "History of all circuits provisioned in this browser session. Click any entry to reload its configuration and simulation results for review."
      },
      {
        name: "Simulation sub-tab",
        desc: "8-phase animated step engine: ORDER_VALIDATED → DESIGN → INVENTORY_CHECK → CONFIG_PUSH → OPTICAL_TEST → PROTECTION → ACTIVATION → HANDOFF. Each step shows a timestamped log entry and live config snippet. Click any completed ✅ step to pin and explore its config."
      },
      {
        name: "Inventory sub-tab",
        desc: "Feasibility gates (fiber capacity, port availability, VLAN headroom, label space, IP pool, transceiver stock) with pass/fail badges. Animated capacity bars show real-time inventory consumption."
      },
      {
        name: "Path Map sub-tab",
        desc: "Leaflet map showing the A→Z working path and the protection path (diverse routing). Toggle working vs. protection to compare geographic routes."
      },
      {
        name: "Tests sub-tab",
        desc: "RFC 2544 / Y.1564 activation test runner. Animated test execution for: throughput, latency, frame loss, back-to-back burst. Results shown with pass/fail against SLA thresholds."
      },
      {
        name: "Configs sub-tab",
        desc: "Per-device vendor-accurate CLI/API configs generated for every device in the equipment chain. View Cisco IOS-XR, Juniper JunOS, Nokia SROS, Ciena MCP, Calix AXOS, and NetBox REST payloads."
      },
    ],
    howTo: [
      "Select a Circuit Type from the wizard dropdown (e.g. 'Wave/DWDM')",
      "Choose A-End site (e.g. Seattle-CO1) and Z-End site (e.g. Portland-CO1)",
      "Set bandwidth, protection level, and SLA tier",
      "Click 'Start Simulation' — the 8-phase engine begins",
      "Watch the Equipment Chain devices light up as each phase progresses",
      "Click any completed ✅ step in the log to pin its config for exploration",
      "Switch to the Inventory sub-tab to see feasibility gates",
      "After simulation completes, run the RFC 2544 test in the Tests sub-tab",
      "Export a 3-sheet XLSX report (Summary, Inventory, Feasibility Gates)",
    ],
    glossary: [
      ["A-End / Z-End", "The two endpoints of a point-to-point circuit (customer side vs. network side)"],
      ["L3VPN", "Layer 3 Virtual Private Network — MPLS-based IP routing between customer sites"],
      ["EVC / E-LINE", "Ethernet Virtual Connection / Ethernet Line — Layer 2 transparent Ethernet circuit"],
      ["DWDM / Wave", "Dense Wavelength Division Multiplexing — 100G/400G optical wavelength circuit"],
      ["DIA", "Dedicated Internet Access — dedicated bandwidth circuit to the internet"],
      ["DCI", "Data Center Interconnect — high-bandwidth circuit between two data centers"],
      ["PE Router", "Provider Edge router — the carrier's MPLS edge device facing the customer CE"],
      ["CE Router", "Customer Edge router — the customer's device connecting to the carrier PE"],
      ["RFC 2544", "Industry benchmark for network equipment throughput, latency, frame-loss testing"],
      ["Y.1564", "ITU-T standard for Ethernet service activation testing with SLA validation"],
      ["OSNR", "Optical Signal-to-Noise Ratio — key quality metric for DWDM wavelength circuits"],
      ["Protection", "Redundant diverse path that activates automatically on primary path failure"],
    ],
  },

  ran: {
    icon: "📡",
    title: "RAN Planning",
    subtitle: "4G / 5G NSA / 5G SA / 6G radio access network planning and simulation engine",
    color: "#e879f9",
    overview: `The RAN Planning tab is a full-fidelity radio access network planning workbench 
covering 4G LTE, 5G Non-Standalone (NSA), 5G Standalone (SA), and future 6G/Edge scenarios. 
It combines 13 functional planning panels with 10 animated simulation scenarios — each 
modeled after real carrier workflows used by RAN architects, RF engineers, and NOC teams.

This module addresses the complete RAN lifecycle: capacity dimensioning, interference 
management, spectrum planning, handover optimization, site acquisition, network slicing, 
SON automation, edge compute placement, and propagation prediction.`,
    panels: [
      {
        name: "Generation Mode Selector",
        desc: "Switch the entire simulation context between 4G LTE, 5G NSA (Non-Standalone — 4G anchor + 5G NR), and 5G SA (Standalone — full 5G core). The available scenarios and function panels adapt to the selected generation."
      },
      {
        name: "Capacity Engineering",
        desc: "Dimensions cell capacity for peak events (e.g. Super Bowl — 27,000 UEs). Models: COW (Cell on Wheels) deployment, DAS indoor offload, sector splitting. Animated 4-phase event simulator shows capacity additions in real time."
      },
      {
        name: "Interference Management",
        desc: "SINR heatmap across the coverage zone. Identifies PIM (Passive Intermodulation) hotspots and adjacent-channel interference. Shows pre/post remediation delta."
      },
      {
        name: "Handover & Mobility",
        desc: "A3/A5 event threshold tuning. Ping-pong detection (too-frequent handovers from poor TTT/hysteresis settings). NSA → SA anchor migration cutover simulator with 4-step sequence."
      },
      {
        name: "MIMO & Beamforming",
        desc: "Massive MIMO configuration panel: antenna element count, beam count, TDD/FDD ratio, spatial multiplexing layers. Shows spectral efficiency curve vs. rank."
      },
      {
        name: "Network Slicing",
        desc: "5G network slice management: eMBB (broadband), URLLC (ultra-low latency), mMTC (IoT/massive). PRB allocation per slice with SLA guardrails and isolation enforcement."
      },
      {
        name: "Zone Diagnostics",
        desc: "Live per-zone health dashboard: RSRP coverage score, SINR quality, handover success rate, PRB utilization, active UE count. Each zone displayed as a color-coded health badge."
      },
      {
        name: "SON Strategy",
        desc: "Self-Organizing Network automation engine: MRO (Mobility Robustness Optimization), MLB (Mobility Load Balancing), eICIC (inter-cell interference coordination). Toggle ON/OFF per SON function."
      },
      {
        name: "Site Acquisition",
        desc: "Candidate site evaluator: lease feasibility gates (zoning, structural, power, backhaul, RF LOS). Re-evaluate gates with async simulation. Send passing sites to the Site Ranker."
      },
      {
        name: "Drive Test Analysis",
        desc: "Imports drive test route data and compares to propagation model predictions. Flags anomalies (e.g. building obstruction causing unexpected path loss). Accept delta to update the planning model."
      },
      {
        name: "Lifecycle & CAPEX",
        desc: "Equipment lifecycle tracker: firmware age, EOL dates, refresh timeline. CAPEX/OPEX model per site including spectrum license cost, power, and backhaul."
      },
      {
        name: "Edge Compute Placement",
        desc: "Models MEC (Multi-access Edge Compute) node placement decisions and the 'tromboning' effect — when traffic takes a suboptimal path because the edge node is too far from the RAN."
      },
      {
        name: "QoE Monitoring",
        desc: "End-user Quality of Experience metrics: video stall ratio, VoIP MOS score, gaming latency percentile. Correlates QoE degradation to RAN KPIs (PRB load, SINR, handover rate)."
      },
    ],
    howTo: [
      "Select a Generation Mode (4G / NSA / SA) — scenarios will filter accordingly",
      "Click any function panel in the left sidebar (Capacity, Handover, MIMO, etc.) to open it",
      "Use the interactive buttons within each panel (Run Simulation, Apply Fix, Re-evaluate Gates)",
      "Click the 🎬 Scenarios sub-tab to access the 10 animated simulation scenarios",
      "Select a scenario and press ▶ Start to run the step-by-step simulation engine",
      "Watch the SVG visualization animate in the right panel as each phase executes",
      "Read the step log to understand what each system action means technically",
      "Compare Before / After metrics at the bottom of the scenario to quantify the improvement",
    ],
    simulations: [
      ["Massive MIMO & 3D Beamforming", "64-antenna beam sweep optimization — spectral efficiency from 3.2 to 6.1 b/s/Hz"],
      ["Network Slicing & SLA Stress-Test", "eMBB / URLLC / mMTC PRB contention under traffic spike — SLA isolation gates"],
      ["AI-RAN Training & Model Validation", "Neural net inference layer learns beam patterns — 18% throughput gain"],
      ["Edge-Compute & Tromboning Analysis", "UPF placement optimization eliminates 34ms RTT detour via central gateway"],
      ["Indoor Positioning (Industrial 5G)", "UWB + 5G FTM fusion — sub-meter accuracy in warehouse environment"],
      ["Beamforming Ray Tracing", "3D ray propagation through building geometry — SINR heatmap from -5 to +22 dB"],
      ["Handover Storm & MRO Optimization", "Rail corridor ping-pong detection — A3 offset tuning reduces HO rate 68%"],
      ["Cell Self-Healing (SON)", "SITE-B failure triggers neighbor power boost + tilt — 38.5s autonomous recovery"],
      ["Dynamic Spectrum Sharing (DSS)", "LTE/NR PRB grid coexistence — CRS-IC cancellation restores +1.4dB SINR"],
      ["Coverage Prediction — Propagation Model", "Atoll-style Okumura-Hata scan — RSRP heatmap, Best Server Plot, C/I layer"],
    ],
    glossary: [
      ["RSRP", "Reference Signal Received Power — primary 5G/LTE coverage metric (dBm, target > -90)"],
      ["SINR", "Signal-to-Interference-plus-Noise Ratio — quality metric (dB, good = >10dB)"],
      ["PRB", "Physical Resource Block — smallest unit of LTE/NR spectrum allocation (180kHz × 1ms)"],
      ["NSA", "Non-Standalone — 5G NR radio with 4G LTE anchor for control plane (EN-DC)"],
      ["SA", "Standalone — full 5G: NR radio + 5GC core, no 4G dependency"],
      ["Massive MIMO", "64–256 antenna elements enabling spatial multiplexing of multiple users simultaneously"],
      ["SON", "Self-Organizing Network — automated RAN optimization (MRO, MLB, eICIC)"],
      ["MRO", "Mobility Robustness Optimization — auto-tune handover thresholds to reduce ping-pong"],
      ["MEC", "Multi-access Edge Compute — compute nodes co-located near RAN for ultra-low latency"],
      ["DSS", "Dynamic Spectrum Sharing — LTE and NR share the same carrier simultaneously"],
      ["CRS-IC", "Cell-specific Reference Signal Interference Cancellation — reduces LTE/NR coexistence loss"],
      ["UPF", "User Plane Function — 5GC component that routes user data packets (replaces PGW)"],
      ["Okumura-Hata", "Empirical path loss model widely used for cellular coverage prediction (150MHz–2GHz extended)"],
      ["BSP", "Best Server Plot — map where each pixel is colored by its dominant serving cell"],
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HelpModal({ tabId, onClose }) {
  const content = HELP_CONTENT[tabId];

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!content) return null;

  const C = content.color;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2,8,23,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#070d1a",
          border: `1px solid ${C}55`,
          borderRadius: 12,
          width: "min(860px, 96vw)",
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          boxShadow: `0 0 40px ${C}22`,
          animation: "slideUp 0.22s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${C}33`,
          background: `${C}0d`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{content.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: C }}>{content.title}</span>
              <span style={{
                background: `${C}22`, border: `1px solid ${C}55`,
                borderRadius: 4, padding: "1px 8px", fontSize: 10, color: C,
              }}>Help &amp; Documentation</span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, marginLeft: 32 }}>
              {content.subtitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: `1px solid #1e3a5f`, borderRadius: 6,
              color: "#64748b", fontSize: 16, width: 30, height: 30,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1, fontSize: 12, color: "#cbd5e1" }}>

          {/* Overview */}
          <Section title="📌 Overview" color={C}>
            <p style={{ lineHeight: 1.75, color: "#94a3b8", whiteSpace: "pre-line", margin: 0 }}>
              {content.overview}
            </p>
          </Section>

          {/* Panels */}
          {content.panels && (
            <Section title="🧩 Panels &amp; Sub-Sections" color={C}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {content.panels.map((p) => (
                  <div key={p.name} style={{
                    background: "#0a1628", border: "1px solid #1e3a5f",
                    borderRadius: 8, padding: "10px 14px",
                  }}>
                    <div style={{ color: C, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: "#64748b", lineHeight: 1.6 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* How to use */}
          {content.howTo && (
            <Section title="▶ How to Use" color={C}>
              <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 2, color: "#94a3b8" }}>
                {content.howTo.map((step, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>{step}</li>
                ))}
              </ol>
            </Section>
          )}

          {/* Simulations (RAN only) */}
          {content.simulations && (
            <Section title="🎬 Simulation Scenarios" color={C}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C}33` }}>
                    <th style={{ textAlign: "left", padding: "4px 10px", color: C, fontSize: 11, width: "36%" }}>#  Scenario</th>
                    <th style={{ textAlign: "left", padding: "4px 10px", color: "#64748b", fontSize: 11 }}>What it demonstrates</th>
                  </tr>
                </thead>
                <tbody>
                  {content.simulations.map(([name, desc], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0d1b2e" }}>
                      <td style={{ padding: "6px 10px", color: "#e2e8f0", fontWeight: 600 }}>
                        {i + 1}. {name}
                      </td>
                      <td style={{ padding: "6px 10px", color: "#64748b", lineHeight: 1.5 }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Glossary */}
          {content.glossary && (
            <Section title="📖 Glossary" color={C}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {content.glossary.map(([term, def]) => (
                  <div key={term} style={{
                    display: "flex", gap: 8, padding: "6px 10px",
                    background: "#0a1628", borderRadius: 6, border: "1px solid #0f2040",
                  }}>
                    <span style={{ color: C, fontWeight: 700, minWidth: 80, fontSize: 11 }}>{term}</span>
                    <span style={{ color: "#64748b", lineHeight: 1.55 }}>{def}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Footer */}
          <div style={{ marginTop: 16, padding: "8px 12px", background: "#0a1628", borderRadius: 6, border: "1px solid #0f2040", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#334155", fontSize: 10 }}>NorthStar Fiber · NetworkSIM — Press ESC or click backdrop to close</span>
            <button
              onClick={onClose}
              style={{ background: `${C}22`, border: `1px solid ${C}55`, borderRadius: 6, color: C, fontSize: 11, padding: "4px 16px", cursor: "pointer" }}
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color, marginBottom: 10,
        borderBottom: `1px solid ${color}22`, paddingBottom: 6,
      }}>{title}</div>
      {children}
    </div>
  );
}
