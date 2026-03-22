import { useState, useEffect, useRef } from "react";

// ─── Scenario Definitions ─────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: "mimo-3d",
    title: "Massive MIMO & 3D Beamforming",
    icon: "🔧",
    badge: "5G NR",
    color: "#3b82f6",
    genModes: ["nsa", "sa"],
    description:
      "Optimize a 64T64R array for a dense urban scenario. SVD-based precoder selection, " +
      "null steering toward an interferer, and MU-MIMO pairing across 4 UE groups.",
    steps: [
      { phase: "INIT",     system: "Array Controller",   action: "Initialize 64T64R antenna array",
        detail: "Configuring 64×64 cross-pol elements, ±45° X-pol, 3.5 GHz n78, λ/2 spacing (43mm)", ms: 800 },
      { phase: "CHANNEL",  system: "Channel Estimator",  action: "CSI-RS pilot sweep — 32 beam directions",
        detail: "Sounding 32 DFT beams, collecting CQI/PMI/RI per UE group across 12 RBGs. SRS reciprocity enabled", ms: 1200 },
      { phase: "PRECODING",system: "Precoder Engine",    action: "SVD decomposition → rank-8 precoder",
        detail: "W = V[:,0:8]. Condition number: 4.2. Spatial multiplexing rank: 8. PDSCH config: 256-QAM, CR 0.92", ms: 1000 },
      { phase: "NULLSTEER",system: "Beam Weight Engine", action: "Null steering toward SITE-B (az 47°, el -3°)",
        detail: "Interference null placed at SITE-B. SINR gain at null: +11.4 dB. Main lobe deflection: < 0.3°", ms: 1400 },
      { phase: "MU-MIMO",  system: "Scheduler",          action: "MU-MIMO pairing — 4 UE groups",
        detail: "UE-A(az 12°) + UE-B(az 61°) + UE-C(el -8°) + UE-D(el +4°). Spatial orthogonality: 94%", ms: 1100 },
      { phase: "VALIDATE", system: "Performance Monitor",action: "Throughput validation — 2.4 Gbps achieved ✅",
        detail: "Spectral efficiency: 7.8 b/s/Hz (target: 7.0). Peak: 2.4 Gbps. Edge SINR: 19.7 dB ✅", ms: 900 },
    ],
    metrics: {
      before: [["Spectral Eff.","4.2 b/s/Hz"],["Peak Throughput","1.1 Gbps"],["SINR (edge)","8.3 dB"],["Active layers","4"],["Beam gain","21.3 dBi"]],
      after:  [["Spectral Eff.","7.8 b/s/Hz"],["Peak Throughput","2.4 Gbps"],["SINR (edge)","19.7 dB"],["Active layers","8"],["Beam gain","27.1 dBi"]],
    },
  },
  {
    id: "slicing-sla",
    title: "Network Slicing & SLA Stress-Test",
    icon: "🍰",
    badge: "5G SA",
    color: "#a855f7",
    genModes: ["nsa", "sa"],
    description:
      "Inject 200% traffic across eMBB, URLLC, and mMTC slices simultaneously. Engine validates " +
      "SLA compliance, triggers elastic PRB scaling, and measures breach-to-recovery time.",
    steps: [
      { phase: "DESIGN",  system: "Slice Orchestrator",     action: "Define slice parameters (S-NSSAI)",
        detail: "eMBB: SST=1, QCI-9. URLLC: SST=2, QCI-82, 1ms target. mMTC: SST=3, QCI-70, 1M dev/km²", ms: 700 },
      { phase: "INJECT",  system: "Traffic Generator",      action: "Ramp all slices to 200% of nominal load",
        detail: "eMBB: 2.1 Gbps (↑190%). URLLC: 48K sessions (↑220%). mMTC: 1.4M devices (↑180%)", ms: 1300 },
      { phase: "BREACH",  system: "SLA Watchdog",           action: "⚠️ SLA BREACH — URLLC latency 3.1ms",
        detail: "URLLC target 1ms → measured 3.1ms. eMBB avg: 62 Mbps (target 100 Mbps). Alert: P1 raised", ms: 1100 },
      { phase: "SCALE",   system: "RAN Resource Manager",   action: "Elastic PRB rebalancing — URLLC priority",
        detail: "URLLC PRB: 15% → 38%. eMBB PRB: 60% → 42%. mMTC unchanged: 15%. Rebalance in 280ms", ms: 1500 },
      { phase: "RECOVER", system: "SLA Monitor",            action: "URLLC latency restored: 0.84ms ✅",
        detail: "SLA: URLLC 0.84ms ✅ | eMBB 78 Mbps ⚠️ | mMTC 1.4M ✅. Breach window: 2.1s total", ms: 1000 },
      { phase: "REPORT",  system: "Analytics Engine",       action: "SLA stress report — recommendation issued",
        detail: "Breach: 2.1s. Recovery: 280ms. Recommendation: pre-reserve 35% PRB headroom for URLLC", ms: 800 },
    ],
    metrics: {
      before: [["eMBB Throughput","1.1 Gbps"],["URLLC Latency","0.82ms ✅"],["mMTC Devices","780K"],["SLA Compliance","100%"],["PRB Utilization","68%"]],
      after:  [["eMBB Throughput","0.94 Gbps"],["URLLC Latency","0.84ms ✅"],["mMTC Devices","1.4M"],["SLA Compliance","97.8%"],["PRB Utilization","95%"]],
    },
  },
  {
    id: "ai-ran",
    title: "AI-RAN Training & Model Validation",
    icon: "🤖",
    badge: "6G Preview",
    color: "#22c55e",
    genModes: ["nsa", "sa"],
    description:
      "Train a Graph Neural Network on 90-day KPI history to predict optimal antenna config per zone. " +
      "Deploy in shadow mode, validate against live RAN, then activate.",
    steps: [
      { phase: "COLLECT", system: "Data Pipeline",      action: "Ingest 90-day KPI dataset — 4.2M samples",
        detail: "Features: RSRP, SINR, PRB util, HO rate, QoE. Labels: optimal tilt/azimuth/power per zone snapshot", ms: 900 },
      { phase: "FEATURE", system: "Feature Engine",     action: "Extract 47 RF features per zone snapshot",
        detail: "Temporal: 15-min rolling avg. Spatial: neighbor SINR gradient. Event: peak markers, MLB/CCO events", ms: 800 },
      { phase: "TRAIN",   system: "GNN Engine",         action: "Graph Neural Network — 200 epochs",
        detail: "3-layer GNN, 256 hidden, edge features = interference coupling. Val loss: 0.042 (↓ from 0.310)", ms: 2000 },
      { phase: "VALIDATE",system: "Validation Engine",  action: "Hold-out evaluation — 15% test set",
        detail: "Tilt MAE: 0.8°. Azimuth MAE: 1.2°. Power MAE: 0.4 dB. Coverage accuracy: 94.1%", ms: 1200 },
      { phase: "SHADOW",  system: "Shadow Controller",  action: "Shadow mode — 48hr parallel run",
        detail: "AI vs. live agreement: 87%. Proposed tilt changes accepted: 134/154. Throughput gain: +4.2%", ms: 1500 },
      { phase: "DEPLOY",  system: "AI-RAN Controller",  action: "Promote model v2.1 to active loop ✅",
        detail: "Inference latency: 12ms. Action scope: CCO tilt ±3°, MLB offset ±2dB. Rollback threshold: 95%", ms: 800 },
    ],
    metrics: {
      before: [["Optimization","Manual (weekly)"],["Tilt accuracy","±3.5°"],["Throughput gain","baseline"],["Model accuracy","N/A"],["Reaction time","72 hrs"]],
      after:  [["Optimization","AI-driven (12ms)"],["Tilt accuracy","±0.8°"],["Throughput gain","+4.2%"],["Model accuracy","94.1%"],["Reaction time","12ms"]],
    },
  },
  {
    id: "edge-trombone",
    title: "Edge-Compute & Tromboning Analysis",
    icon: "🌐",
    badge: "MEC / UPF",
    color: "#f97316",
    genModes: ["nsa", "sa"],
    description:
      "Detect traffic tromboning when UE requests edge services but UPF is anchored at core. " +
      "Engine computes latency penalty, evaluates MEC placement, and inserts ULCL breakout.",
    steps: [
      { phase: "CLASSIFY", system: "DPI Engine",              action: "Classify traffic — 4 application types",
        detail: "AR/VR: 38%. Gaming: 24%. Video: 29%. IoT ctrl: 9%. Latency-critical flows: 62% of total", ms: 700 },
      { phase: "DETECT",   system: "Path Analyzer",           action: "Trombone path detected — UPF at core",
        detail: "UE→gNB→N3→Core UPF→N6→Internet→MEC. RTT: 48ms. Ideal with local UPF: 4ms. Penalty: +44ms", ms: 1200 },
      { phase: "MODEL",    system: "MEC Placement Engine",    action: "Evaluate 3 edge placement candidates",
        detail: "A: gNB co-located RTT 3.8ms ✅. B: Agg-ring RTT 7.2ms ⚠️. C: DC-edge RTT 18ms ❌. → Select A", ms: 1000 },
      { phase: "BREAKOUT", system: "UPF Configurator",        action: "Insert ULCL — local breakout activated",
        detail: "ULCL at NW sector gNB. Split: local 71% / core 29%. N6-LAN route to MEC live. Delay: 22ms install", ms: 1400 },
      { phase: "VALIDATE", system: "QoE Monitor",             action: "Latency validation — AR/VR RTT 4.1ms ✅",
        detail: "AR/VR: 48→4.1ms (▼91%). Gaming: 52→6.3ms. Video: unchanged (CDN). IoT: 44→3.9ms ✅", ms: 1100 },
      { phase: "REPORT",   system: "Network Analytics",       action: "Trombone elimination confirmed",
        detail: "MEC offload: 71%. Backhaul saved: 1.8 Gbps. QoE uplift: +35pts. Core load: -44%", ms: 800 },
    ],
    metrics: {
      before: [["AR/VR RTT","48ms ❌"],["Gaming RTT","52ms ❌"],["Core backhaul","2.54 Gbps"],["Edge offload","0%"],["Avg QoE","54/100"]],
      after:  [["AR/VR RTT","4.1ms ✅"],["Gaming RTT","6.3ms ✅"],["Core backhaul","0.74 Gbps"],["Edge offload","71%"],["Avg QoE","89/100"]],
    },
  },
  {
    id: "indoor-pos",
    title: "Indoor Positioning — Industrial 5G",
    icon: "📍",
    badge: "URLLC / NR",
    color: "#06b6d4",
    genModes: ["nsa", "sa"],
    description:
      "Deploy sub-meter positioning for a 12,000 m² factory floor using 5G NR PRS. " +
      "Engine computes DL-TDOA/UL-TDOA, applies NLOS mitigation, and enables 10 Hz asset tracking.",
    steps: [
      { phase: "DEPLOY",   system: "Anchor Planner",    action: "Place 6 NR positioning anchors — factory floor",
        detail: "4 ceiling anchors (10m height) + 2 perimeter (4m). Coverage: 12,000 m². GDOP: 1.8 ✅", ms: 900 },
      { phase: "PRS",      system: "PRS Configurator",  action: "Configure PRS — 10ms period, comb-4",
        detail: "PRS BW: 100 MHz n78. Periodicity: 10ms. Comb-4, 12 symbols. DL-TDOA + UL-TDOA hybrid enabled", ms: 800 },
      { phase: "MEASURE",  system: "RSTD Engine",       action: "RSTD sweep — 24 assets, NLOS mitigation",
        detail: "480 measurements. 3 NLOS paths flagged → downweighted 0.3×. Avg RSTD σ: 2.8ns", ms: 1300 },
      { phase: "COMPUTE",  system: "Position Engine",   action: "Multilateration — weighted least squares",
        detail: "WLS solver: 6-anchor TDOA. 4 iterations to convergence. CEP50: 0.31m. CEP90: 0.61m", ms: 1200 },
      { phase: "VALIDATE", system: "Accuracy Validator",action: "Ground-truth comparison — 24 reference tags",
        detail: "Horiz. avg: 0.28m (max 0.51m). Vert. avg: 0.44m. 3GPP NR Positioning Class C: ✅ PASS", ms: 1000 },
      { phase: "TRACK",    system: "Asset Tracker",     action: "Real-time tracking loop — 10 Hz, 24 assets ✅",
        detail: "Update rate: 10 Hz. Kalman filter: velocity-aided. Zone boundary alert latency: 85ms", ms: 800 },
    ],
    metrics: {
      before: [["Positioning","RFID (3–5m)"],["Update rate","2 Hz"],["Floor coverage","60%"],["Asset count","N/A"],["Alert latency","1.5s"]],
      after:  [["Positioning","5G NR (0.28m)"],["Update rate","10 Hz"],["Floor coverage","100%"],["Asset count","24"],["Alert latency","85ms"]],
    },
  },
  {
    id: "ray-tracing",
    title: "Ray Tracing & Spectral Efficiency",
    icon: "📡",
    badge: "RF Model",
    color: "#fbbf24",
    genModes: ["4g", "nsa", "sa"],
    description:
      "Run geometric ray-tracing for a dense urban canyon with 847 building faces. Engine computes " +
      "multipath clusters, builds SINR heat map, extracts MIMO channel rank, and predicts spectral efficiency.",
    steps: [
      { phase: "GEOMETRY", system: "3D Model Engine",  action: "Load urban geometry — 847 building faces",
        detail: "OSM import. Mesh resolution: 0.5m. Materials: concrete (σ=0.01, ε=5.3), glass, brick loaded", ms: 1000 },
      { phase: "LAUNCH",   system: "Ray Launcher",     action: "Launch 50,000 rays — 3 transmitter sites",
        detail: "Max reflections: 6. Max diffractions: 2. Scattering: Lambertian model. Freq: 3.5 GHz n78", ms: 1800 },
      { phase: "MULTIPATH",system: "Path Analyzer",    action: "Cluster multipath — 12 angular clusters",
        detail: "Avg delay spread: 48ns. Max: 312ns. Dominant: LoS (0dB rel.). Ricean K-factor: 6.2 dB", ms: 1200 },
      { phase: "SINR",     system: "SINR Mapper",      action: "Build SINR heat map — 5m resolution grid",
        detail: "18,400 grid points. SINR range: -4 to +31 dB. Coverage (SINR>0): 94.1%. Edge avg: 8.3 dB", ms: 1400 },
      { phase: "MIMO",     system: "Channel Modeler",  action: "Extract MIMO rank per grid point",
        detail: "Rank-1: 18%. Rank-2: 31%. Rank-4: 35%. Rank-8: 16%. Avg rank: 3.8 across coverage area", ms: 1100 },
      { phase: "CAPACITY", system: "Capacity Engine",  action: "Shannon capacity prediction — output ready ✅",
        detail: "Peak SE: 9.1 b/s/Hz (LoS, rank-8). Avg SE: 5.4 b/s/Hz. Edge: 2.1 b/s/Hz. System: 3.2 Gbps", ms: 900 },
    ],
    metrics: {
      before: [["Model type","Simplified FSPL"],["SINR error","±5.2 dB"],["Avg SE","3.1 b/s/Hz"],["Coverage acc.","78%"],["Multipath","ignored"]],
      after:  [["Model type","Ray Tracing (6-bounce)"],["SINR error","±1.1 dB"],["Avg SE","5.4 b/s/Hz"],["Coverage acc.","94.1%"],["Multipath","12 clusters"]],
    },
  },
  {
    id: "ho-storm",
    title: "Handover Storm — High-Speed Rail",
    icon: "🚆",
    badge: "Mobility",
    color: "#06b6d4",
    genModes: ["4g", "nsa", "sa"],
    description:
      "A UE travels a 300 km/h rail corridor through 6 cells. Engine detects ping-pong storms, " +
      "diagnoses A3/TTT misconfiguration, and reoptimizes thresholds to eliminate redundant handovers.",
    steps: [
      { phase: "SETUP",    system: "Mobility Engine",     action: "Configure corridor — 6 macro cells, 45km route",
        detail: "Cell spacing: 7.5km. Speed: 300 km/h. UE freq: n78 3.5GHz. A3 offset: 3dB, TTT: 40ms", ms: 700 },
      { phase: "TRAVERSE", system: "UE Simulator",        action: "UE enters corridor — tracking begins",
        detail: "RSRP: Cell-1 → -72dBm. Speed: 300 km/h. Doppler: 972 Hz. Tracking interval: 100ms", ms: 1000 },
      { phase: "STORM",    system: "HO Event Monitor",    action: "⚠️ Ping-pong storm — Cell-3 ↔ Cell-4",
        detail: "8 handovers in 4.2s at Cell-3/4 boundary. TTT expired 6×. Ping-pong rate: 68%. BLER: 12%", ms: 1400 },
      { phase: "DIAGNOSE", system: "Root Cause Engine",   action: "A3 offset too low — margin exhausted at speed",
        detail: "At 300km/h: cell overlap duration 90ms < TTT 40ms × 2 = 80ms. A3 offset 3dB → boundary unstable", ms: 1100 },
      { phase: "OPTIMIZE", system: "MRO Engine",          action: "Apply: A3 → 5dB, TTT → 64ms, Hysteresis → 3dB",
        detail: "MRO recommendation applied. Boundary stability window: 210ms. Pre-testing before live push", ms: 1200 },
      { phase: "VERIFY",   system: "Validation Engine",   action: "Re-traverse — ping-pong rate 68% → 4% ✅",
        detail: "HO success rate: 99.1%. Ping-pong: 4%. BLER: 1.2%. Throughput sustained at 320 Mbps ✅", ms: 900 },
    ],
    metrics: {
      before: [["HO success","87.3%"],["Ping-pong rate","68%"],["BLER","12%"],["Throughput","180 Mbps"],["A3 offset","3 dB"]],
      after:  [["HO success","99.1%"],["Ping-pong rate","4%"],["BLER","1.2%"],["Throughput","320 Mbps"],["A3 offset","5 dB"]],
    },
  },
  {
    id: "self-heal",
    title: "Cell Failure & SON Self-Healing",
    icon: "📉",
    badge: "SON / CCO",
    color: "#f97316",
    genModes: ["4g", "nsa", "sa"],
    description:
      "A macro cell fails mid-operation. SON self-healing triggers: neighboring cells expand " +
      "coverage via power/tilt boost, restoring 94% of affected zone QoE within 38 seconds.",
    steps: [
      { phase: "MONITOR",  system: "Cell Monitor",        action: "Normal operation — 4 cells, full coverage",
        detail: "SITE-B: RSRP -78dBm, load 54%, QoE 88. All neighbors nominal. No alerts active", ms: 600 },
      { phase: "FAILURE",  system: "Fault Manager",       action: "🔴 SITE-B hardware failure — cell dark",
        detail: "SITE-B offline: 00:04.2. Lost coverage: 31% of NW zone. 1,240 UEs dropped to idle. P1 raised", ms: 1200 },
      { phase: "DETECT",   system: "SON Self-Heal Engine",action: "Coverage hole detected — 3 neighbors eligible",
        detail: "SITE-A, SITE-C, SITE-D within range. SITE-A: 2.1km (best). Compensation headroom: +4dB each", ms: 1000 },
      { phase: "EXPAND",   system: "CCO Engine",          action: "Boost: SITE-A +4dB, SITE-C +3dB, SITE-D +2dB",
        detail: "SITE-A downtilt -2° (from 6° to 4°). SITE-C azimuth +5°. Power ramp: 200ms each. Interference model recalc", ms: 1400 },
      { phase: "COVERAGE", system: "Coverage Analyzer",   action: "Coverage restored — 94% of affected zone",
        detail: "Recovered UEs: 1,166/1,240 (94%). Edge RSRP: -98dBm (vs -78 nominal). QoE: 88→74 (acceptable ⚠️)", ms: 1100 },
      { phase: "RECOVER",  system: "Recovery Manager",    action: "SITE-B restored — neighbors revert ✅",
        detail: "SITE-B online: 00:42.7. Heal duration: 38.5s. CCO revert: 60s ramp-down. Zero user impact on restore", ms: 800 },
    ],
    metrics: {
      before: [["Zone coverage","100%"],["Affected UEs","0"],["Avg QoE","88/100"],["Neighbor load","54%"],["Heal time","N/A"]],
      after:  [["Zone coverage","94%"],["Affected UEs","74 (6%)"],["Avg QoE","74/100"],["Neighbor load","81%"],["Heal time","38.5s ✅"]],
    },
  },
  {
    id: "dss",
    title: "Dynamic Spectrum Sharing (DSS)",
    icon: "📻",
    badge: "4G/5G Coex",
    color: "#84cc16",
    genModes: ["nsa", "sa"],
    description:
      "LTE and NR share the same 20MHz B3 carrier. As 5G NR demand grows, the PRB scheduler " +
      "dynamically compresses LTE allocations. Engine validates coexistence, CRS interference, and capacity gain.",
    steps: [
      { phase: "BASELINE", system: "Spectrum Controller",  action: "DSS frame: 100 PRBs — LTE 80%, NR 0%",
        detail: "B3 1800MHz, 20MHz FDD. LTE: 80 PRBs (MBSFN subframes for NR). NR: mbsfn-subframeConfig loaded", ms: 700 },
      { phase: "ACTIVATE", system: "NR Scheduler",         action: "NR activated — initial 15 PRB allocation",
        detail: "NR SSB on PRB 0-3. PDCCH CORESET configured. NR UEs: 12. LTE: 65 PRBs. CRS IC enabled", ms: 1000 },
      { phase: "GROWTH",   system: "Traffic Manager",      action: "NR demand surge — ramp to 60% NR load",
        detail: "NR UEs: 12→48. Demand: 140 Mbps NR. LTE demand: stable 85 Mbps. Dynamic rebalance triggered", ms: 1300 },
      { phase: "REBALANCE",system: "DSS Scheduler",        action: "PRB rebalance: NR 55 PRBs, LTE 45 PRBs",
        detail: "LTE CRS puncturing: 4 PRBs avoided. NR muting pattern: 7.5kHz SCS. LTE SINR impact: -1.2dB", ms: 1400 },
      { phase: "CRS_IC",   system: "CRS Interference Canceller", action: "CRS interference cancelled — -1.2dB restored",
        detail: "CRS-IC gain: +1.4dB. LTE SINR restored to within 0.2dB of baseline. NR CM: 256QAM maintained", ms: 1100 },
      { phase: "VALIDATE", system: "Coexistence Validator",action: "DSS coexistence confirmed — both SLAs met ✅",
        detail: "NR: 142 Mbps ✅. LTE: 87 Mbps ✅ (vs 85 baseline). Spectral efficiency gain: +38%. CRS-IC active", ms: 800 },
    ],
    metrics: {
      before: [["NR capacity","0 (not active)"],["LTE capacity","85 Mbps"],["PRB util (NR)","0%"],["Spectral eff.","3.8 b/s/Hz"],["CRS impact","N/A"]],
      after:  [["NR capacity","142 Mbps"],["LTE capacity","87 Mbps"],["PRB util (NR)","55%"],["Spectral eff.","5.2 b/s/Hz"],["CRS impact","mitigated ✅"]],
    },
  },
  {
    id: "prop-model",
    title: "Coverage Prediction — Propagation Model",
    icon: "🗺️",
    badge: "Atoll-style",
    color: "#e879f9",
    genModes: ["4g", "nsa", "sa"],
    description:
      "Atoll-style coverage prediction engine. Loads terrain & clutter data, runs Okumura-Hata path " +
      "loss per pixel, generates RSRP heatmap, Best Server Plot, C/I interference layer, and vector overlays.",
    steps: [
      { phase: "TERRAIN",  system: "GIS Engine",          action: "Load DTM + clutter data — 5m resolution grid",
        detail: "DTM import: 18×13 pixel grid, 5m/px. Clutter classes: open, suburban, dense urban, building. Ridge: 8m above datum", ms: 800 },
      { phase: "COMPUTE",  system: "Path Loss Engine",     action: "Run Okumura-Hata model — pixel-by-pixel scan",
        detail: "Model: Okumura-Hata (urban 3.5GHz). 3 transmitters. 234 grid points. Ridge loss: +6dB. Building loss: +10dB", ms: 1600 },
      { phase: "RSRP",     system: "Signal Mapper",        action: "Generate RSRP heatmap — green→red gradient",
        detail: "RSRP range: -62 to -108 dBm. Coverage (RSRP>-90): 81.4%. Edge avg: -97 dBm. 3 coverage holes flagged", ms: 1100 },
      { phase: "BSP",      system: "Best Server Engine",   action: "Compute Best Server Plot — dominant cell per pixel",
        detail: "Cell-1 dominates: 38% of area. Cell-2: 34%. Cell-3: 28%. Boundary overlap: 7 pixels (handover risk zone)", ms: 1000 },
      { phase: "CI",       system: "Interference Analyzer",action: "C/I interference layer — hotspots in red",
        detail: "C/I < 5dB: 14 pixels (6%). Worst: Cell-1/2 boundary, C/I = 1.8dB. Recommend: A3 offset +1dB at boundary", ms: 1200 },
      { phase: "OVERLAY",  system: "GIS Renderer",         action: "Apply vector overlays — streets + building footprints ✅",
        detail: "Street grid overlaid. 2 buildings in shadow zone identified. Coverage hole at Main/4th intersection: -103 dBm", ms: 900 },
    ],
    metrics: {
      before: [["Model","Simplified FSPL"],["Grid resolution","50m/px"],["Clutter","ignored"],["C/I hotspots","unknown"],["BSP accuracy","~60%"]],
      after:  [["Model","Okumura-Hata + DTM"],["Grid resolution","5m/px"],["Clutter","6 classes"],["C/I hotspots","14 pixels (6%)"],["BSP accuracy","94.1%"]],
    },
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
    background: "#060d1b", color: "#e2e8f0", fontFamily: "monospace", fontSize: 12,
  },
  header: {
    display: "flex", alignItems: "center", gap: 12, padding: "8px 16px",
    borderBottom: "1px solid #1e3a5f", background: "#0a1628", flexShrink: 0,
  },
  body: { display: "flex", flex: 1, overflow: "hidden" },
  // Left sidebar
  sidebar: {
    width: 230, flexShrink: 0, borderRight: "1px solid #1e3a5f",
    background: "#070e1c", display: "flex", flexDirection: "column", overflow: "hidden",
  },
  sidebarScroll: { flex: 1, overflowY: "auto", padding: "8px" },
  scenarioCard: (active, color) => ({
    padding: "8px 10px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
    background: active ? `${color}18` : "#0a1628",
    border: `1px solid ${active ? color : "#1e3a5f"}`,
    transition: "all 0.15s",
  }),
  // Center log
  center: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  logArea: { flex: 1, overflowY: "auto", padding: "10px 14px" },
  stepRow: (done) => ({
    display: "flex", gap: 10, padding: "8px 10px", borderRadius: 6, marginBottom: 5,
    background: done ? "#0f1f3d" : "#0a1628",
    border: `1px solid ${done ? "#1e3a5f" : "#0f1a2e"}`,
    opacity: done ? 1 : 0.5, transition: "all 0.3s",
  }),
  activeRow: {
    display: "flex", gap: 10, padding: "8px 10px", borderRadius: 6, marginBottom: 5,
    background: "#0d1e38", border: "1px solid #3b82f6",
    boxShadow: "0 0 0 1px #3b82f620",
    animation: "none",
  },
  phaseBadge: (color) => ({
    flexShrink: 0, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700,
    background: `${color}22`, color: color, border: `1px solid ${color}44`,
    height: "fit-content", marginTop: 2,
  }),
  // Right metrics
  right: {
    width: 260, flexShrink: 0, borderLeft: "1px solid #1e3a5f",
    background: "#070e1c", display: "flex", flexDirection: "column", overflow: "hidden",
  },
  rightScroll: { flex: 1, overflowY: "auto", padding: "10px 12px" },
  sectionLabel: { color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: 1 },
  infoRow: { display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center" },
  badge: (color) => ({
    padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700,
    background: `${color}22`, color, border: `1px solid ${color}44`,
  }),
  controlBar: {
    padding: "8px 14px", borderTop: "1px solid #1e3a5f", background: "#0a1628",
    display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
  },
  btn: (color, disabled) => ({
    padding: "6px 16px", borderRadius: 5, fontSize: 11, cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#0a1628" : `${color}22`,
    border: `1px solid ${disabled ? "#1e3a5f" : color}`,
    color: disabled ? "#3a4a5f" : color,
    fontWeight: 700, transition: "all 0.15s",
  }),
};

// ─── Scenario-specific Visualizations (SVG/CSS) ───────────────────────────────

function MIMOViz({ progress, color }) {
  const beamWidth = 55 - progress * 30;
  const gain = (21 + progress * 6).toFixed(1);
  const layers = Math.round(1 + progress * 7);
  const nullAngle = 145;
  const nullX = 100 + 65 * Math.cos((nullAngle * Math.PI) / 180);
  const nullY = 145 - 65 * Math.sin((nullAngle * Math.PI) / 180);

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      <line x1="100" y1="155" x2="100" y2="10" stroke="#1e3a5f" strokeWidth="0.5" />
      <line x1="10" y1="155" x2="190" y2="155" stroke="#1e3a5f" strokeWidth="0.5" />
      {[-60,-30,30,60].map(a => (
        <line key={a} x1="100" y1="155" x2={100 + 90*Math.sin(a*Math.PI/180)} y2={155-90*Math.cos(a*Math.PI/180)} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,3" />
      ))}
      <path
        d={`M 100 155 L ${100-beamWidth} ${155-110} Q 100 ${155-140} ${100+beamWidth} ${155-110} Z`}
        fill={`${color}33`} stroke={color} strokeWidth="1.5"
        style={{ transition: "all 0.5s" }}
      />
      {progress > 0.5 && (
        <line x1="100" y1="155" x2={nullX} y2={nullY}
          stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
      )}
      {progress > 0.5 && (
        <>
          <circle cx={nullX} cy={nullY} r="7" fill="#ef444411" stroke="#ef4444" strokeWidth="1" />
          <text x={nullX+10} y={nullY+3} fill="#ef4444" fontSize="7">NULL</text>
        </>
      )}
      <text x="100" y="22" textAnchor="middle" fill={color} fontSize="10" fontWeight="bold">{gain} dBi</text>
      <text x="100" y="34" textAnchor="middle" fill="#64748b" fontSize="8">Rank-{layers} | {layers}×{layers} MIMO</text>
      <rect x="8" y="130" width="60" height="22" rx="3" fill="#0a1628" stroke="#1e3a5f" strokeWidth="0.5" />
      <text x="38" y="140" textAnchor="middle" fill="#64748b" fontSize="7">SITE-A</text>
      <text x="38" y="150" textAnchor="middle" fill="#e2e8f0" fontSize="8">64T64R</text>
    </svg>
  );
}

function SlicingViz({ progress, stepIndex }) {
  const breach = stepIndex >= 2;
  const scaled = stepIndex >= 3;
  const urllcPRB = scaled ? 38 : 15;
  const embbPRB  = scaled ? 42 : 60;
  const mmtcPRB  = 15;

  const slices = [
    { label: "eMBB",  pct: embbPRB,  color: "#3b82f6", latency: scaled ? "N/A" : "N/A" },
    { label: "URLLC", pct: urllcPRB, color: "#22c55e", alert: breach && !scaled },
    { label: "mMTC",  pct: mmtcPRB,  color: "#a855f7" },
  ];

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      <text x="100" y="14" textAnchor="middle" fill="#64748b" fontSize="8">PRB ALLOCATION</text>
      {slices.map((sl, i) => {
        const y = 30 + i * 44;
        const barW = sl.pct * 1.6;
        return (
          <g key={sl.label}>
            <text x="10" y={y + 10} fill={sl.color} fontSize="9" fontWeight="bold">{sl.label}</text>
            <rect x="10" y={y + 14} width="160" height="12" rx="2" fill="#0a1628" stroke="#1e3a5f" strokeWidth="0.5" />
            <rect x="10" y={y + 14} width={barW} height="12" rx="2" fill={`${sl.color}55`} stroke={sl.color} strokeWidth="1"
              style={{ transition: "width 0.6s" }} />
            {sl.alert && (
              <text x={10 + barW + 4} y={y + 24} fill="#ef4444" fontSize="8">⚠️ BREACH</text>
            )}
            <text x="174" y={y + 24} fill="#94a3b8" fontSize="8">{sl.pct}%</text>
          </g>
        );
      })}
      <text x="100" y="158" textAnchor="middle" fill="#64748b" fontSize="7">
        {scaled ? "✅ SLA recovered — elastic scaling complete" : breach ? "⚠️ SLA breach — scaling..." : "Traffic injection in progress"}
      </text>
    </svg>
  );
}

function AIRanViz({ progress }) {
  const points = 20;
  const lossPoints = Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const shown = t <= progress;
    const loss = 0.31 * Math.exp(-4.5 * t) + 0.03 + (shown ? (Math.random() * 0.005 - 0.0025) : 0);
    return { t, loss: Math.max(0.03, loss), shown };
  });

  const xScale = (t) => 20 + t * 160;
  const yScale = (l) => 140 - l * 380;

  const pathD = lossPoints
    .filter(p => p.shown)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.t).toFixed(1)} ${yScale(p.loss).toFixed(1)}`)
    .join(" ");

  const currentLoss = (0.31 * Math.exp(-4.5 * progress) + 0.03).toFixed(3);

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      <text x="100" y="12" textAnchor="middle" fill="#64748b" fontSize="8">TRAINING LOSS (GNN — 200 epochs)</text>
      <line x1="20" y1="15" x2="20" y2="145" stroke="#1e3a5f" strokeWidth="1" />
      <line x1="20" y1="145" x2="185" y2="145" stroke="#1e3a5f" strokeWidth="1" />
      {[0.31, 0.20, 0.10, 0.05].map(v => (
        <g key={v}>
          <line x1="18" y1={yScale(v)} x2="185" y2={yScale(v)} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,4" />
          <text x="15" y={yScale(v) + 3} textAnchor="end" fill="#64748b" fontSize="6">{v.toFixed(2)}</text>
        </g>
      ))}
      {pathD && <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinejoin="round" />}
      <line x1="20" y1={yScale(0.042)} x2="185" y2={yScale(0.042)} stroke="#22c55e" strokeWidth="0.7" strokeDasharray="3,3" opacity="0.5" />
      <text x="187" y={yScale(0.042) + 3} fill="#22c55e" fontSize="6">0.042</text>
      <text x="100" y="155" textAnchor="middle" fill="#94a3b8" fontSize="8">
        Loss: {currentLoss} | {Math.round(progress * 200)} / 200 epochs
      </text>
    </svg>
  );
}

function TromboneViz({ stepIndex, color }) {
  const optimized = stepIndex >= 3;
  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Nodes */}
      {[["UE", 20, 80, "#60a5fa"], ["gNB", 60, 80, "#3b82f6"], ["ULCL", 100, 80, optimized ? color : "#1e3a5f"],
        ["Core\nUPF", 150, 30, "#64748b"], ["MEC", 150, 130, color], ["Internet", 185, 30, "#3a4a5f"]].map(([l, x, y, c]) => (
        <g key={l}>
          <rect x={x - 18} y={y - 10} width="36" height="20" rx="3" fill={`${c}22`} stroke={c} strokeWidth="1" />
          <text x={x} y={y + 4} textAnchor="middle" fill={c} fontSize="7" fontWeight="bold">{l}</text>
        </g>
      ))}
      {/* Trombone path (faded when optimized) */}
      <path d="M 60 80 Q 105 55 150 30" fill="none" stroke="#ef4444" strokeWidth={optimized ? 0.5 : 1.5}
        strokeDasharray="3,3" opacity={optimized ? 0.3 : 0.8} />
      <path d="M 150 30 L 185 30" fill="none" stroke="#ef4444" strokeWidth={optimized ? 0.5 : 1.5}
        strokeDasharray="3,3" opacity={optimized ? 0.3 : 0.8} />
      <path d="M 185 30 Q 185 130 150 130" fill="none" stroke="#ef4444" strokeWidth={optimized ? 0.5 : 1.5}
        strokeDasharray="3,3" opacity={optimized ? 0.3 : 0.8} />
      {!optimized && <text x="170" y="80" fill="#ef4444" fontSize="7">48ms</text>}
      {/* Optimized path */}
      {optimized && (
        <path d="M 100 80 L 150 130" fill="none" stroke={color} strokeWidth="2" />
      )}
      {optimized && <text x="118" y="118" fill={color} fontSize="7">4ms ✅</text>}
      {/* UE to gNB */}
      <line x1="38" y1="80" x2="42" y2="80" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="78" y1="80" x2="82" y2="80" stroke="#3b82f6" strokeWidth="1.5" />
      {optimized && <text x="100" y="155" textAnchor="middle" fill={color} fontSize="8">ULCL local breakout active ✅</text>}
      {!optimized && <text x="100" y="155" textAnchor="middle" fill="#ef4444" fontSize="8">Traffic tromboning — {stepIndex < 2 ? "analyzing" : "trombone detected"}</text>}
    </svg>
  );
}

function PositioningViz({ progress, stepIndex, color }) {
  const anchors = [
    [30, 25], [100, 15], [170, 25],
    [30, 130], [100, 145], [170, 130],
  ];
  const assets = [
    [65, 70], [100, 60], [135, 70],
    [65, 100], [100, 110], [135, 100],
    [80, 85],  [120, 85],
  ];
  const uncertainty = Math.max(2, 18 - progress * 16);

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect x="15" y="10" width="170" height="140" rx="4" fill="#0a1628" stroke="#1e3a5f" strokeWidth="1" />
      <text x="100" y="8" textAnchor="middle" fill="#64748b" fontSize="7">FACTORY FLOOR — 12,000 m²</text>
      {anchors.map(([x, y], i) => (
        <g key={i}>
          {stepIndex >= 2 && <circle cx={x} cy={y} r="30" fill="none" stroke={`${color}22`} strokeWidth="0.5" strokeDasharray="2,3" />}
          <rect x={x-5} y={y-5} width="10" height="10" rx="2" fill={`${color}44`} stroke={color} strokeWidth="1" />
          <text x={x} y={y+16} textAnchor="middle" fill={color} fontSize="6">A{i+1}</text>
        </g>
      ))}
      {stepIndex >= 3 && assets.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={uncertainty} fill={`#60a5fa18`} stroke="#60a5fa44" strokeWidth="0.5" />
          <circle cx={x} cy={y} r="3" fill="#60a5fa" />
        </g>
      ))}
      <text x="100" y="158" textAnchor="middle" fill="#94a3b8" fontSize="7">
        {stepIndex >= 4 ? `CEP50: 0.31m ✅ | ${assets.length} assets tracked` : stepIndex >= 3 ? "Computing positions..." : stepIndex >= 1 ? "PRS configured — sweeping" : "Deploying anchors"}
      </text>
    </svg>
  );
}

function RayTracingViz({ progress, stepIndex, color }) {
  const rays = stepIndex >= 1;
  const sinrMap = stepIndex >= 3;
  const sites = [[30, 150], [100, 10], [170, 150]];
  const angles = [30, 60, 90, 120, 150];

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {sinrMap && (
        <>
          <circle cx="100" cy="80" r="70" fill="#22c55e08" stroke="#22c55e" strokeWidth="0.3" opacity="0.6" />
          <circle cx="100" cy="80" r="50" fill="#fbbf2408" stroke="#fbbf24" strokeWidth="0.3" opacity="0.6" />
          <circle cx="100" cy="80" r="30" fill="#3b82f608" stroke="#3b82f6" strokeWidth="0.3" opacity="0.6" />
          <circle cx="100" cy="80" r="15" fill="#a855f708" stroke="#a855f7" strokeWidth="0.3" opacity="0.6" />
        </>
      )}
      {/* Buildings */}
      {[[50,40,20,30],[80,55,15,25],[120,50,20,30],[145,40,18,25],[40,90,12,20],[160,85,15,20]].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="#1e3a5f88" stroke="#1e3a5f" strokeWidth="0.5" />
      ))}
      {/* Ray traces */}
      {rays && sites.map(([sx, sy], si) =>
        angles.map((a, ai) => {
          const rad = (a * Math.PI) / 180;
          const ex = sx + 80 * Math.cos(rad);
          const ey = sy - 80 * Math.sin(rad);
          return (
            <line key={`${si}-${ai}`} x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={color} strokeWidth="0.4" opacity={0.25 + progress * 0.3} />
          );
        })
      )}
      {sites.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5" fill={`${color}33`} stroke={color} strokeWidth="1.2" />
          <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize="7">TX{i+1}</text>
        </g>
      ))}
      {sinrMap && (
        <>
          <text x="190" y="55" fill="#22c55e" fontSize="6" textAnchor="end">SINR&gt;20dB</text>
          <text x="190" y="75" fill="#fbbf24" fontSize="6" textAnchor="end">10-20dB</text>
          <text x="190" y="95" fill="#3b82f6" fontSize="6" textAnchor="end">0-10dB</text>
        </>
      )}
      <text x="100" y="158" textAnchor="middle" fill="#94a3b8" fontSize="7">
        {stepIndex >= 5 ? "SE: 5.4 b/s/Hz avg | Coverage: 94.1%" : stepIndex >= 3 ? "SINR map: 18,400 points" : rays ? "50K rays launched | multipath clustering" : "Loading urban geometry..."}
      </text>
    </svg>
  );
}

// ─── Handover Storm Viz ───────────────────────────────────────────────────────
function HandoverStormViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const cells = [20, 52, 84, 116, 148, 180];
  const trackY = 110;
  const isStorm  = stepIndex === 2;
  const optimized = stepIndex >= 4;
  // UE position: loops across track
  const rawPos = (tick % 140) / 140;
  const ueX = 10 + rawPos * 180;
  const activeCellIdx = cells.findIndex((cx, i) => ueX < cx + (cells[i + 1] ? (cells[i + 1] - cx) / 2 : 40));
  const curCell = Math.max(0, activeCellIdx === -1 ? cells.length - 1 : activeCellIdx);

  // Ping-pong flash: at boundary between cell 2&3 if storm step
  const atBoundary = Math.abs(ueX - 100) < 12 || Math.abs(ueX - 116) < 12;
  const pingpong = isStorm && atBoundary && tick % 8 < 4;

  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ background: "#060d1b" }}>
      {/* Rail track */}
      <line x1="5" y1={trackY + 2} x2="195" y2={trackY + 2} stroke="#334155" strokeWidth="3" />
      <line x1="5" y1={trackY - 2} x2="195" y2={trackY - 2} stroke="#334155" strokeWidth="3" />
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
        <line key={i} x1={15 + i * 16} y1={trackY - 4} x2={15 + i * 16} y2={trackY + 4} stroke="#1e3a5f" strokeWidth="1.5" />
      ))}

      {/* Cell towers + coverage zones */}
      {cells.map((cx, i) => {
        const isActive = i === curCell;
        const isFailing = isStorm && (i === 2 || i === 3) && atBoundary;
        const color = isFailing ? "#ef4444" : isActive ? "#06b6d4" : "#1e3a5f";
        const coverR = optimized ? 36 : 30;
        return (
          <g key={i}>
            <ellipse cx={cx} cy={trackY} rx={coverR} ry={14}
              fill={`${color}15`} stroke={color} strokeWidth={isActive ? "1" : "0.4"} strokeDasharray={isFailing ? "3,2" : "none"} />
            <line x1={cx} y1={trackY - 18} x2={cx} y2={trackY - 38} stroke={color} strokeWidth={isActive ? 1.5 : 0.8} />
            <polygon points={`${cx - 4},${trackY - 38} ${cx + 4},${trackY - 38} ${cx},${trackY - 48}`}
              fill={color} opacity={0.9} />
            <text x={cx} y={trackY - 50} textAnchor="middle" fill={color} fontSize="6">C{i + 1}</text>
          </g>
        );
      })}

      {/* Handover flash */}
      {pingpong && (
        <>
          <circle cx={ueX} cy={trackY} r="18" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" />
          <text x={ueX} y={trackY - 22} textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">HO!</text>
        </>
      )}

      {/* UE (train) */}
      <rect x={ueX - 8} y={trackY - 8} width="16" height="12" rx="2"
        fill={isStorm && pingpong ? "#ef4444" : "#06b6d4"} opacity="0.95" />
      <text x={ueX} y={trackY + 1} textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold">UE</text>

      {/* Speed label */}
      <text x="100" y="15" textAnchor="middle" fill="#94a3b8" fontSize="7">300 km/h Rail Corridor</text>

      {/* Status bar */}
      <rect x="4" y="136" width="192" height="18" rx="3" fill="#0a1628" />
      {isStorm && (
        <text x="100" y="148" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">
          ⚠ PING-PONG STORM — HO rate: 8/4.2s | BLER: 12%
        </text>
      )}
      {optimized && (
        <text x="100" y="148" textAnchor="middle" fill="#22c55e" fontSize="7">
          ✅ MRO Applied — A3: 5dB | TTT: 64ms | Ping-pong: 4%
        </text>
      )}
      {!isStorm && !optimized && (
        <text x="100" y="148" textAnchor="middle" fill="#06b6d4" fontSize="7">
          {stepIndex < 1 ? "Corridor loaded — 6 cells configured" : "UE tracking… RSRP: -72dBm | Doppler: 972Hz"}
        </text>
      )}

      {/* A3/TTT margin bars (shown when diagnosing or after) */}
      {stepIndex >= 3 && (
        <g>
          <text x="8" y="132" fill="#94a3b8" fontSize="6">A3: {optimized ? "5dB" : "3dB"}</text>
          <rect x="28" y="126" width="40" height="5" rx="1" fill="#1e3a5f" />
          <rect x="28" y="126" width={optimized ? 40 : 24} height="5" rx="1" fill={optimized ? "#22c55e" : "#ef4444"} />
          <text x="90" y="132" fill="#94a3b8" fontSize="6">TTT: {optimized ? "64ms" : "40ms"}</text>
          <rect x="115" y="126" width="40" height="5" rx="1" fill="#1e3a5f" />
          <rect x="115" y="126" width={optimized ? 40 : 25} height="5" rx="1" fill={optimized ? "#22c55e" : "#f97316"} />
        </g>
      )}
    </svg>
  );
}

// ─── Cell Self-Healing Viz ────────────────────────────────────────────────────
function SelfHealingViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  const failed     = stepIndex >= 1;
  const detecting  = stepIndex >= 2;
  const expanding  = stepIndex >= 3;
  const restored   = stepIndex >= 5;
  const pulse      = (Math.sin(tick * 0.15) + 1) / 2;  // 0–1

  // Hex layout: center + 4 neighbors
  const sites = [
    { id: "B", x: 100, y: 80, label: "SITE-B (failed)", isFailed: true },
    { id: "A", x: 60,  y: 55,  label: "SITE-A" },
    { id: "C", x: 140, y: 55,  label: "SITE-C" },
    { id: "D", x: 60,  y: 105, label: "SITE-D" },
    { id: "E", x: 140, y: 105, label: "SITE-E" },
  ];

  const boosts = { A: 4, C: 3, D: 2 };

  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ background: "#060d1b" }}>
      {/* Coverage rings */}
      {sites.map(s => {
        if (s.isFailed) {
          const baseR = 32;
          if (!failed) return <circle key={s.id} cx={s.x} cy={s.y} r={baseR} fill="#06b6d415" stroke="#06b6d4" strokeWidth="0.8" />;
          if (restored) return <circle key={s.id} cx={s.x} cy={s.y} r={baseR} fill="#22c55e15" stroke="#22c55e" strokeWidth="1" />;
          return null; // dark during failure
        }
        const boost = boosts[s.id] || 0;
        const baseR = 28;
        const expandR = expanding ? baseR + boost * 3 + pulse * 4 : baseR;
        const color = expanding ? "#f97316" : "#3b82f6";
        return (
          <circle key={s.id} cx={s.x} cy={s.y} r={expandR}
            fill={`${color}12`} stroke={color} strokeWidth={expanding ? "1.2" : "0.6"}
            strokeDasharray={expanding && !restored ? "3,2" : "none"} />
        );
      })}

      {/* Healing bloom from neighbors into void */}
      {expanding && !restored && (
        <>
          {[{ from: sites[1], r: 30 + pulse * 12 }, { from: sites[2], r: 28 + pulse * 10 }, { from: sites[3], r: 26 + pulse * 8 }].map((b, i) => (
            <circle key={i} cx={b.from.x} cy={b.from.y} r={b.r}
              fill="none" stroke="#f9731640" strokeWidth="2" opacity={0.5 - i * 0.12} />
          ))}
          {/* Partial coverage fill in void area */}
          <ellipse cx={100} cy={80} rx={28 + pulse * 8} ry={20 + pulse * 6}
            fill="#f9731610" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4,3" />
        </>
      )}

      {/* Site nodes */}
      {sites.map(s => {
        const color = s.isFailed
          ? (failed && !restored ? "#ef4444" : "#22c55e")
          : (expanding ? "#f97316" : "#3b82f6");
        const r = s.isFailed ? 7 : 5;
        return (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={r} fill={`${color}30`} stroke={color} strokeWidth="1.5" />
            {s.isFailed && failed && !restored && (
              <text x={s.x} y={s.y + 0.5} textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold">✕</text>
            )}
            {s.isFailed && restored && (
              <text x={s.x} y={s.y + 0.5} textAnchor="middle" fill="#22c55e" fontSize="6">✓</text>
            )}
            <text x={s.x} y={s.y + 15} textAnchor="middle" fill={color} fontSize="6">{s.id}</text>
            {expanding && boosts[s.id] && (
              <text x={s.x} y={s.y - 10} textAnchor="middle" fill="#f97316" fontSize="6">+{boosts[s.id]}dB</text>
            )}
          </g>
        );
      })}

      {/* Status header */}
      <text x="100" y="14" textAnchor="middle" fill="#94a3b8" fontSize="7">
        {!failed ? "Normal Operation — 4 cells, full coverage"
          : !detecting ? "🔴 SITE-B FAILURE — Coverage hole: 31% zone"
          : !expanding ? "SON Detecting neighbors — A/C/D eligible"
          : !restored ? "CCO Expanding: A+4dB, C+3dB, D+2dB"
          : "✅ SITE-B Restored — CCO revert in progress"}
      </text>

      {/* Recovery timer */}
      {detecting && !restored && (
        <text x="100" y="155" textAnchor="middle" fill="#f97316" fontSize="6.5">
          Heal elapsed: {Math.min(38, Math.round(tick * 0.8))}s / 38.5s target
        </text>
      )}
      {restored && (
        <text x="100" y="155" textAnchor="middle" fill="#22c55e" fontSize="6.5">
          ✅ Heal complete in 38.5s | 94% UEs recovered
        </text>
      )}
    </svg>
  );
}

// ─── DSS PRB Grid Viz ─────────────────────────────────────────────────────────
function DSSPRBViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const COLS = 14;  // subframes
  const ROWS = 10;  // resource blocks

  const nrActivated  = stepIndex >= 1;
  const growthPhase  = stepIndex >= 2;
  const rebalanced   = stepIndex >= 3;
  const crsRestored  = stepIndex >= 4;

  // Decide NR PRB ratio based on phase
  const nrCols = nrActivated ? (rebalanced ? 8 : growthPhase ? 5 : 2) : 0;
  const animShift = rebalanced && !crsRestored ? (tick % 3 === 0 ? 1 : 0) : 0;  // shimmer

  const W = 200, H = 160;
  const gridX = 10, gridY = 30;
  const cellW = (W - 20) / COLS;
  const cellH = (H - 60) / ROWS;

  const getColor = (col) => {
    if (col >= COLS - nrCols - animShift) return "#22c55e";  // NR (green)
    if (col === COLS - nrCols - animShift - 1 && growthPhase) return "#84cc16";  // boundary
    return "#3b82f6";  // LTE (blue)
  };

  const specEff = nrActivated ? (rebalanced ? 5.2 : growthPhase ? 4.5 : 4.1) : 3.8;

  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ background: "#060d1b" }}>
      <text x="100" y="14" textAnchor="middle" fill="#94a3b8" fontSize="7">
        DSS PRB Grid — B3 1800MHz 20MHz | {COLS} subframes × {ROWS} RBs
      </text>
      {/* Column headers */}
      {Array.from({ length: COLS }).map((_, c) => (
        <text key={c} x={gridX + c * cellW + cellW / 2} y={gridY - 2}
          textAnchor="middle" fill="#64748b" fontSize="4.5">SF{c}</text>
      ))}
      {/* PRB grid */}
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          const color = getColor(c);
          const isCRS = !crsRestored && rebalanced && c === COLS - nrCols - 2;
          return (
            <rect key={`${r}-${c}`}
              x={gridX + c * cellW + 0.5} y={gridY + r * cellH + 0.5}
              width={cellW - 1} height={cellH - 1} rx="0.5"
              fill={isCRS ? "#ef444440" : `${color}30`}
              stroke={isCRS ? "#ef4444" : color}
              strokeWidth={isCRS ? "0.8" : "0.3"}
              opacity={0.85}
            />
          );
        })
      )}
      {/* NR/LTE divider label */}
      {nrActivated && (
        <>
          <line x1={gridX + (COLS - nrCols) * cellW} y1={gridY - 8} x2={gridX + (COLS - nrCols) * cellW} y2={gridY + ROWS * cellH + 4}
            stroke="#84cc16" strokeWidth="1" strokeDasharray="3,2" />
          <text x={gridX + 4} y={gridY + ROWS * cellH + 10} fill="#3b82f6" fontSize="6">
            LTE: {COLS - nrCols} subframes
          </text>
          <text x={gridX + (COLS - nrCols) * cellW + 4} y={gridY + ROWS * cellH + 10} fill="#22c55e" fontSize="6">
            NR: {nrCols} subframes
          </text>
        </>
      )}
      {/* Spectral efficiency bar */}
      <text x="10" y={gridY + ROWS * cellH + 24} fill="#94a3b8" fontSize="6">SE: {specEff.toFixed(1)} b/s/Hz</text>
      <rect x="68" y={gridY + ROWS * cellH + 18} width="80" height="7" rx="2" fill="#1e3a5f" />
      <rect x="68" y={gridY + ROWS * cellH + 18} width={Math.min(80, 80 * (specEff / 6))} height="7" rx="2" fill="#84cc16" />
      {/* CRS interference indicator */}
      {rebalanced && !crsRestored && (
        <text x="100" y="155" textAnchor="middle" fill="#ef4444" fontSize="6">
          ⚠ CRS interference at boundary — IC pending (-1.2dB)
        </text>
      )}
      {crsRestored && (
        <text x="100" y="155" textAnchor="middle" fill="#22c55e" fontSize="6">
          ✅ CRS-IC active — LTE SINR restored | NR: 256QAM maintained
        </text>
      )}
      {!nrActivated && (
        <text x="100" y="155" textAnchor="middle" fill="#3b82f6" fontSize="6">
          LTE-only baseline — 80 PRBs | SE: 3.8 b/s/Hz
        </text>
      )}
    </svg>
  );
}

// ─── Coverage Prediction (Atoll-style) Viz ────────────────────────────────────
function PropagationModelViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 90);
    return () => clearInterval(id);
  }, []);

  const COLS = 18, ROWS = 13;
  const gridX = 6, gridY = 18;
  const cellW = (188) / COLS;
  const cellH = (126) / ROWS;

  // 3 towers on the grid
  const towers = [
    { col: 3,  row: 3,  color: "#3b82f6", label: "C1" },
    { col: 13, row: 2,  color: "#22c55e", label: "C2" },
    { col: 9,  row: 10, color: "#a855f7", label: "C3" },
  ];

  // Terrain features
  const isRidge    = (c, r) => c >= 7 && c <= 9 && r >= 4 && r <= 8;
  const isBuilding = (c, r) => (c === 11 && r >= 7 && r <= 9) || (c === 14 && r >= 4 && r <= 6);

  const rsrp = (c, r, t) => {
    const d = Math.sqrt((c - t.col) ** 2 + (r - t.row) ** 2) || 0.1;
    return -62 - 8.5 * d - (isRidge(c, r) ? 6 : 0) - (isBuilding(c, r) ? 10 : 0);
  };
  const bestRSRP   = (c, r) => Math.max(...towers.map(t => rsrp(c, r, t)));
  const bestTowerIdx = (c, r) => {
    let bi = 0, bv = -999;
    towers.forEach((t, i) => { const v = rsrp(c, r, t); if (v > bv) { bv = v; bi = i; } });
    return bi;
  };
  const ci = (c, r) => {
    const vals = towers.map(t => rsrp(c, r, t)).sort((a, b) => b - a);
    return vals[0] - vals[1];
  };

  function rsrpColor(v) {
    const n = Math.max(0, Math.min(1, (v + 108) / 46));
    if (n > 0.75) return "#22c55e";
    if (n > 0.55) return "#84cc16";
    if (n > 0.35) return "#fbbf24";
    if (n > 0.15) return "#f97316";
    return "#ef4444";
  }

  const showCompute  = stepIndex >= 1;
  const showRSRP     = stepIndex >= 2;
  const showBSP      = stepIndex >= 3;
  const showCI       = stepIndex >= 4;
  const showClutter  = stepIndex >= 4;
  const showOverlay  = stepIndex >= 5;

  // Scan column during COMPUTE step
  const scanCol = showCompute && !showRSRP ? (tick % COLS) : -1;

  const layerLabel = showCI ? "C/I Interference" : showBSP ? "Best Server Plot" : showRSRP ? "RSRP Signal Level" : showCompute ? "Computing…" : "DTM + Clutter";

  return (
    <svg viewBox="0 0 200 160" width="100%" height="100%" style={{ background: "#060d1b" }}>
      {/* Header */}
      <text x="100" y="12" textAnchor="middle" fill="#94a3b8" fontSize="6.5">
        Coverage Prediction · {layerLabel}
      </text>

      {/* Grid cells */}
      {Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          const x = gridX + c * cellW;
          const y = gridY + r * cellH;
          let fill = "#0d1b2e";
          let opacity = 0.85;

          if (showCI) {
            const ciVal = ci(c, r);
            if (ciVal < 3)       { fill = "#ef4444"; opacity = 0.75; }
            else if (ciVal < 7)  { fill = "#f97316"; opacity = 0.55; }
            else {
              fill = towers[bestTowerIdx(c, r)].color;
              opacity = 0.3;
            }
          } else if (showBSP) {
            fill = towers[bestTowerIdx(c, r)].color;
            opacity = 0.4;
          } else if (showRSRP) {
            fill = rsrpColor(bestRSRP(c, r));
            opacity = 0.72;
          } else if (showCompute) {
            // scanning animation
            if (c <= scanCol) {
              fill = rsrpColor(bestRSRP(c, r));
              opacity = 0.55;
            }
          }

          return (
            <rect key={`${r}-${c}`} x={x + 0.2} y={y + 0.2}
              width={cellW - 0.4} height={cellH - 0.4}
              fill={fill} opacity={opacity} />
          );
        })
      )}

      {/* Clutter shadows on top */}
      {showClutter && Array.from({ length: ROWS }).map((_, r) =>
        Array.from({ length: COLS }).map((_, c) => {
          if (!isRidge(c, r) && !isBuilding(c, r)) return null;
          return (
            <rect key={`cl-${r}-${c}`}
              x={gridX + c * cellW + 0.2} y={gridY + r * cellH + 0.2}
              width={cellW - 0.4} height={cellH - 0.4}
              fill={isBuilding(c, r) ? "#334155" : "#1e3a5f"} opacity="0.72" />
          );
        })
      )}

      {/* Scan line */}
      {scanCol >= 0 && (
        <line x1={gridX + scanCol * cellW} y1={gridY}
          x2={gridX + scanCol * cellW} y2={gridY + ROWS * cellH}
          stroke="#e879f9" strokeWidth="0.7" opacity="0.7" />
      )}

      {/* Vector overlay — streets */}
      {showOverlay && (
        <>
          <line x1={gridX} y1={gridY + 6.5 * cellH} x2={gridX + COLS * cellW} y2={gridY + 6.5 * cellH}
            stroke="#94a3b850" strokeWidth="1" />
          <line x1={gridX + 8 * cellW} y1={gridY} x2={gridX + 8 * cellW} y2={gridY + ROWS * cellH}
            stroke="#94a3b850" strokeWidth="1" />
          <text x={gridX + COLS * cellW - 1} y={gridY + 6.5 * cellH - 2}
            fill="#94a3b8" fontSize="4.5" textAnchor="end">Main St</text>
          <text x={gridX + 8 * cellW + 1} y={gridY + 3}
            fill="#94a3b8" fontSize="4.5">4th Ave</text>
          {/* Coverage hole marker */}
          <circle cx={gridX + 8 * cellW} cy={gridY + 6.5 * cellH} r="3.5"
            fill="none" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2,1.5" />
          <text x={gridX + 8 * cellW + 5} y={gridY + 6.5 * cellH + 2}
            fill="#ef4444" fontSize="4.5">hole</text>
        </>
      )}

      {/* Tower markers */}
      {towers.map((t, i) => (
        <g key={i}>
          <circle cx={gridX + t.col * cellW + cellW / 2} cy={gridY + t.row * cellH + cellH / 2}
            r="3.5" fill={`${t.color}30`} stroke={t.color} strokeWidth="1.2" />
          <text x={gridX + t.col * cellW + cellW / 2} y={gridY + t.row * cellH + cellH / 2 + 1}
            textAnchor="middle" fill={t.color} fontSize="4.5" fontWeight="bold">{t.label}</text>
        </g>
      ))}

      {/* RSRP legend */}
      {showRSRP && !showBSP && (
        <g>
          {[["#22c55e",">-76"],["#84cc16","-85"],["#fbbf24","-94"],["#f97316","-103"],["#ef4444","<-103"]].map(([c, l], i) => (
            <g key={i}>
              <rect x={gridX + COLS * cellW + 2} y={gridY + i * 11} width="5" height="8" fill={c} opacity="0.75" rx="0.5" />
              <text x={gridX + COLS * cellW + 9} y={gridY + i * 11 + 6} fill="#64748b" fontSize="4.5">{l}</text>
            </g>
          ))}
          <text x={gridX + COLS * cellW + 4} y={gridY - 2} fill="#94a3b8" fontSize="4.5">dBm</text>
        </g>
      )}

      {/* BSP legend */}
      {showBSP && !showCI && (
        <g>
          {towers.map((t, i) => (
            <g key={i}>
              <rect x={gridX + COLS * cellW + 2} y={gridY + i * 13} width="5" height="9" fill={t.color} opacity="0.5" rx="0.5" />
              <text x={gridX + COLS * cellW + 9} y={gridY + i * 13 + 7} fill="#64748b" fontSize="4.5">{t.label}</text>
            </g>
          ))}
        </g>
      )}

      {/* CI legend */}
      {showCI && (
        <g>
          {[["#ef4444","C/I<3dB"],["#f97316","3–7dB"],["#64748b","OK >7dB"]].map(([c, l], i) => (
            <g key={i}>
              <rect x={gridX + COLS * cellW + 2} y={gridY + i * 12} width="5" height="8" fill={c} opacity="0.7" rx="0.5" />
              <text x={gridX + COLS * cellW + 9} y={gridY + i * 12 + 6} fill="#64748b" fontSize="4.5">{l}</text>
            </g>
          ))}
        </g>
      )}

      {/* Clutter annotation */}
      {showClutter && (
        <text x={gridX + 7 * cellW - 1} y={gridY + 6.5 * cellH} fill="#475569" fontSize="4.5" textAnchor="end">ridge↗</text>
      )}

      {/* Status bar */}
      <rect x="4" y="148" width="192" height="10" rx="2" fill="#0a1628" />
      <text x="100" y="155.5" textAnchor="middle" fill="#e879f9" fontSize="6">
        {!showCompute ? "DTM 5m grid loaded — 234 pixels | 3 sites | 6 clutter classes"
          : !showRSRP  ? `Okumura-Hata scan… col ${Math.min(scanCol + 1, COLS)}/${COLS}`
          : !showBSP   ? "RSRP heatmap — coverage (>-90dBm): 81.4% | 3 holes flagged"
          : !showCI    ? "Best Server Plot — C1:38% | C2:34% | C3:28%"
          : !showOverlay ? "C/I layer — 14 hotspot pixels | worst C/I: 1.8dB at C1/C2 boundary"
          : "✅ Vector overlay complete — coverage hole at Main/4th: -103 dBm"}
      </text>
    </svg>
  );
}

function ScenarioViz({ scenario, stepIndex, color }) {
  if (!scenario) return null;
  const progress = scenario.steps.length > 0 ? stepIndex / scenario.steps.length : 0;
  const viz = {
    "mimo-3d":      <MIMOViz progress={progress} color={color} />,
    "slicing-sla":  <SlicingViz progress={progress} stepIndex={stepIndex} />,
    "ai-ran":       <AIRanViz progress={progress} />,
    "edge-trombone":<TromboneViz stepIndex={stepIndex} color={color} />,
    "indoor-pos":   <PositioningViz progress={progress} stepIndex={stepIndex} color={color} />,
    "ray-tracing":  <RayTracingViz progress={progress} stepIndex={stepIndex} color={color} />,
    "ho-storm":     <HandoverStormViz stepIndex={stepIndex} />,
    "self-heal":    <SelfHealingViz stepIndex={stepIndex} />,
    "dss":          <DSSPRBViz stepIndex={stepIndex} />,
    "prop-model":   <PropagationModelViz stepIndex={stepIndex} />,
  };
  return viz[scenario.id] || null;
}

// ─── Phase badge colors ───────────────────────────────────────────────────────

const PHASE_COLORS = {
  INIT: "#60a5fa", CHANNEL: "#3b82f6", PRECODING: "#818cf8", NULLSTEER: "#a78bfa", "MU-MIMO": "#c084fc", VALIDATE: "#22c55e",
  DESIGN: "#a855f7", INJECT: "#ef4444", BREACH: "#ef4444", SCALE: "#f97316", RECOVER: "#22c55e", REPORT: "#60a5fa",
  COLLECT: "#60a5fa", FEATURE: "#3b82f6", TRAIN: "#22c55e", SHADOW: "#fbbf24", DEPLOY: "#22c55e",
  CLASSIFY: "#f97316", DETECT: "#ef4444", MODEL: "#60a5fa", BREAKOUT: "#22c55e",
  DEPLOY_A: "#06b6d4", PRS: "#3b82f6", MEASURE: "#fbbf24", COMPUTE: "#a855f7", TRACK: "#22c55e",
  GEOMETRY: "#fbbf24", LAUNCH: "#f97316", MULTIPATH: "#a855f7", SINR: "#22c55e", MIMO: "#3b82f6", CAPACITY: "#22c55e",
  SETUP: "#06b6d4", TRAVERSE: "#3b82f6", STORM: "#ef4444", DIAGNOSE: "#f97316", OPTIMIZE: "#a855f7", VERIFY: "#22c55e",
  MONITOR: "#3b82f6", FAILURE: "#ef4444", EXPAND: "#f97316", COVERAGE: "#22c55e",
  BASELINE: "#3b82f6", ACTIVATE: "#22c55e", GROWTH: "#f97316", REBALANCE: "#a855f7", CRS_IC: "#06b6d4",
  TERRAIN: "#84cc16", COMPUTE: "#e879f9", RSRP: "#22c55e", BSP: "#3b82f6", CI: "#ef4444", OVERLAY: "#22c55e",
};
function phaseColor(phase) { return PHASE_COLORS[phase] || "#60a5fa"; }

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RANScenariosPanel({ genMode, onClose }) {
  const [selected, setSelected] = useState(null);
  const [runState, setRunState] = useState("idle"); // idle | running | done
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepLogs, setStepLogs]   = useState([]);
  const timerRef = useRef(null);
  const logRef   = useRef(null);

  const scenario = SCENARIOS.find(s => s.id === selected);
  const scenarioColor = scenario ? scenario.color : "#60a5fa";

  function selectScenario(id) {
    if (runState === "running") return;
    setSelected(id);
    setRunState("idle");
    setStepIndex(-1);
    setStepLogs([]);
  }

  function startSim() {
    if (!scenario || runState === "running") return;
    setRunState("running");
    setStepIndex(0);
    setStepLogs([]);
    runStep(0, scenario);
  }

  function runStep(idx, sc) {
    const step = sc.steps[idx];
    if (!step) {
      setRunState("done");
      setStepIndex(sc.steps.length);
      return;
    }
    // Show step as active immediately before the delay
    setStepIndex(idx);
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
    timerRef.current = setTimeout(() => {
      setStepLogs(prev => [...prev, { ...step, ts, done: true }]);
      setTimeout(() => logRef.current?.scrollTo({ top: 9999, behavior: "smooth" }), 50);
      runStep(idx + 1, sc);
    }, step.ms);
  }

  function resetSim() {
    clearTimeout(timerRef.current);
    setRunState("idle");
    setStepIndex(-1);
    setStepLogs([]);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Live metrics: interpolate from before toward after as steps complete
  function liveMetrics() {
    if (!scenario) return [];
    const { before, after } = scenario.metrics;
    const pct = scenario.steps.length > 0 ? stepIndex / scenario.steps.length : 0;
    if (pct === 0 || runState === "idle") return before.map(([k, v]) => [k, v, "before"]);
    if (runState === "done")              return after.map(([k, v]) => [k, v, "after"]);
    return before.map(([k, bv], i) => {
      const av = after[i][1];
      // Show "transitioning" for mid-simulation
      return [k, pct > 0.6 ? av : bv, pct > 0.6 ? "after" : "before"];
    });
  }

  const currentStep = scenario?.steps[stepIndex] ?? null;

  return (
    <div style={S.root}>
      {/* ── HEADER ── */}
      <div style={S.header}>
        <button onClick={onClose} style={{ ...S.btn("#60a5fa", false), padding: "4px 10px", fontSize: 10 }}>
          ← Back
        </button>
        <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 12 }}>📡 RAN PLANNING — SCENARIO SIMULATIONS</span>
        <span style={{ color: "#64748b", fontSize: 10, marginLeft: 4 }}>
          {SCENARIOS.length} scenarios · Step-by-step · Live metrics
        </span>
        <span style={{ marginLeft: "auto", color: "#64748b", fontSize: 10 }}>
          Mode: <span style={{ color: "#60a5fa" }}>{genMode.toUpperCase()}</span>
        </span>
      </div>

      <div style={S.body}>
        {/* ── LEFT: Scenario Selector ── */}
        <div style={S.sidebar}>
          <div style={{ padding: "8px 10px 4px", color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
            SELECT SCENARIO
          </div>
          <div style={S.sidebarScroll}>
            {SCENARIOS.map(sc => {
              const incompatible = !sc.genModes.includes(genMode);
              return (
                <div
                  key={sc.id}
                  onClick={() => !incompatible && selectScenario(sc.id)}
                  style={{
                    ...S.scenarioCard(selected === sc.id, sc.color),
                    opacity: incompatible ? 0.4 : 1,
                    cursor: incompatible ? "not-allowed" : "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14 }}>{sc.icon}</span>
                    <span style={{ color: sc.color, fontWeight: 700, fontSize: 10, flex: 1 }}>{sc.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    <span style={{ ...S.badge(sc.color), fontSize: 8 }}>{sc.badge}</span>
                    {incompatible && <span style={{ ...S.badge("#64748b"), fontSize: 8 }}>needs {sc.genModes.join("/").toUpperCase()}</span>}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 9, lineHeight: 1.4 }}>
                    {sc.description.substring(0, 80)}…
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CENTER: Step Log + Viz ── */}
        <div style={S.center}>
          {!scenario ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 36 }}>🎬</div>
              <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 14 }}>Select a scenario to begin</div>
              <div style={{ color: "#64748b", fontSize: 11, textAlign: "center", maxWidth: 360 }}>
                Choose one of {SCENARIOS.length} RAN/RF planning simulations from the sidebar. Each scenario runs a step-by-step engine with live metrics and visualizations.
              </div>
            </div>
          ) : (
            <>
              {/* Scenario info bar */}
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #1e3a5f", background: "#070e1c", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{scenario.icon}</span>
                  <span style={{ color: scenarioColor, fontWeight: 700, fontSize: 12 }}>{scenario.title}</span>
                  <span style={{ ...S.badge(scenarioColor), fontSize: 9 }}>{scenario.badge}</span>
                  {runState === "done" && <span style={{ ...S.badge("#22c55e"), fontSize: 9, marginLeft: 4 }}>✅ COMPLETE</span>}
                </div>
                <div style={{ color: "#64748b", fontSize: 10, marginTop: 3 }}>{scenario.description}</div>
              </div>

              {/* Visualization + Step log split */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Visualization */}
                <div style={{
                  width: 210, flexShrink: 0, borderRight: "1px solid #1e3a5f",
                  background: "#020817", display: "flex", flexDirection: "column",
                }}>
                  <div style={{ padding: "6px 10px", borderBottom: "1px solid #0f1a2e", color: "#64748b", fontSize: 9, fontWeight: 700 }}>
                    LIVE VISUALIZATION
                  </div>
                  <div style={{ flex: 1, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ScenarioViz scenario={scenario} stepIndex={stepIndex} color={scenarioColor} />
                  </div>
                  {/* Phase progress bar */}
                  <div style={{ padding: "6px 10px", borderTop: "1px solid #0f1a2e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: "#64748b", fontSize: 8 }}>PHASES</span>
                      <span style={{ color: scenarioColor, fontSize: 8 }}>{Math.max(0, stepIndex)}/{scenario.steps.length}</span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {scenario.steps.map((st, i) => (
                        <div key={i} style={{
                          flex: 1, height: 4, borderRadius: 2,
                          background: i < stepIndex ? scenarioColor : i === stepIndex && runState === "running" ? `${scenarioColor}66` : "#1e3a5f",
                          transition: "background 0.4s",
                        }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step Log */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "6px 14px", borderBottom: "1px solid #0f1a2e", color: "#64748b", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                    SIMULATION LOG
                  </div>
                  <div ref={logRef} style={S.logArea}>
                    {/* Waiting state */}
                    {runState === "idle" && stepLogs.length === 0 && (
                      <div style={{ color: "#3a4a5f", fontSize: 11, textAlign: "center", marginTop: 24 }}>
                        Press ▶ Run to start the simulation
                      </div>
                    )}

                    {/* Completed steps */}
                    {stepLogs.map((log, i) => (
                      <div key={i} style={S.stepRow(true)}>
                        <span style={{ color: "#3a4a5f", fontSize: 9, whiteSpace: "nowrap", marginTop: 2 }}>{log.ts}</span>
                        <span style={S.phaseBadge(phaseColor(log.phase))}>{log.phase}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ color: "#64748b", fontSize: 9 }}>{log.system}</span>
                          </div>
                          <div style={{ color: "#e2e8f0", fontSize: 10, fontWeight: 600, marginTop: 1 }}>✅ {log.action}</div>
                          <div style={{ color: "#64748b", fontSize: 9, marginTop: 2 }}>{log.detail}</div>
                        </div>
                      </div>
                    ))}

                    {/* Currently running step */}
                    {runState === "running" && currentStep && (
                      <div style={S.activeRow}>
                        <span style={{ color: "#3a4a5f", fontSize: 9, whiteSpace: "nowrap", marginTop: 2 }}>
                          {new Date().toLocaleTimeString("en-US", { hour12: false })}
                        </span>
                        <span style={S.phaseBadge(phaseColor(currentStep.phase))}>{currentStep.phase}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: "#64748b", fontSize: 9 }}>{currentStep.system}</span>
                          <div style={{ color: "#60a5fa", fontSize: 10, fontWeight: 600, marginTop: 1 }}>
                            🔄 {currentStep.action}
                          </div>
                          <div style={{ height: 3, borderRadius: 2, background: "#1e3a5f", marginTop: 5 }}>
                            <div style={{
                              height: "100%", background: scenarioColor, borderRadius: 2,
                              animation: "ranProgress 0.9s linear infinite",
                              width: "40%",
                            }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Done state */}
                    {runState === "done" && (
                      <div style={{
                        marginTop: 10, padding: "10px 14px", borderRadius: 6,
                        background: "#14532d22", border: "1px solid #22c55e44",
                      }}>
                        <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}>✅ Simulation Complete</div>
                        <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
                          {scenario.steps.length} phases completed. See metrics panel for before/after comparison.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Control bar */}
                  <div style={S.controlBar}>
                    <button
                      onClick={startSim}
                      disabled={runState !== "idle"}
                      style={S.btn(scenarioColor, runState !== "idle")}
                    >
                      ▶ Run Simulation
                    </button>
                    <button
                      onClick={resetSim}
                      disabled={runState === "idle"}
                      style={S.btn("#64748b", runState === "idle")}
                    >
                      ↺ Reset
                    </button>
                    {runState === "running" && (
                      <span style={{ color: "#fbbf24", fontSize: 10 }}>
                        🔄 Step {stepIndex + 1} of {scenario.steps.length}…
                      </span>
                    )}
                    {runState === "done" && (
                      <span style={{ color: "#22c55e", fontSize: 10 }}>
                        ✅ All {scenario.steps.length} phases complete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Live Metrics ── */}
        <div style={S.right}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e3a5f", color: "#60a5fa", fontWeight: 700, fontSize: 11, background: "#0a1628" }}>
            LIVE METRICS
          </div>
          <div style={S.rightScroll}>
            {!scenario ? (
              <div style={{ color: "#3a4a5f", fontSize: 10, textAlign: "center", marginTop: 20 }}>
                Select a scenario to see metrics
              </div>
            ) : (
              <>
                <div style={S.sectionLabel}>
                  {runState === "done" ? "BEFORE → AFTER COMPARISON" : "CURRENT VALUES"}
                </div>
                <div style={{ marginTop: 8 }}>
                  {liveMetrics().map(([k, v, state], i) => {
                    const afterVal = scenario.metrics.after[i][1];
                    const changed = state === "after";
                    return (
                      <div key={k} style={{
                        padding: "5px 8px", borderRadius: 5, marginBottom: 4,
                        background: changed ? "#0f1f3d" : "#0a1628",
                        border: `1px solid ${changed ? "#1e3a5f" : "#0a1628"}`,
                        transition: "all 0.4s",
                      }}>
                        <div style={{ color: "#64748b", fontSize: 9 }}>{k}</div>
                        {runState === "done" ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                            <span style={{ color: "#3a4a5f", fontSize: 9, textDecoration: "line-through" }}>
                              {scenario.metrics.before[i][1]}
                            </span>
                            <span style={{ color: "#64748b", fontSize: 8 }}>→</span>
                            <span style={{ color: scenarioColor, fontWeight: 700, fontSize: 10 }}>{afterVal}</span>
                          </div>
                        ) : (
                          <div style={{ color: changed ? scenarioColor : "#94a3b8", fontWeight: changed ? 700 : 400, fontSize: 10, marginTop: 2, transition: "color 0.4s" }}>
                            {v}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: "1px solid #1e3a5f", margin: "12px 0 8px" }} />
                <div style={S.sectionLabel}>SCENARIO PHASES</div>
                <div style={{ marginTop: 6 }}>
                  {scenario.steps.map((st, i) => {
                    const done = i < stepIndex;
                    const active = i === stepIndex && runState === "running";
                    return (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: done ? scenarioColor : active ? `${scenarioColor}88` : "#1e3a5f",
                          transition: "background 0.3s",
                        }} />
                        <span style={{ color: done ? "#94a3b8" : active ? "#e2e8f0" : "#3a4a5f", fontSize: 9 }}>
                          {st.phase}: {st.action.substring(0, 30)}{st.action.length > 30 ? "…" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ranProgress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
