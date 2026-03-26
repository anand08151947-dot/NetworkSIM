import { useState, useEffect, useRef } from "react";
import { MIMOBeam3D, RayTrace3D } from "./Scenes3D";

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
        detail: "Configuring 64×64 cross-pol elements, ±45° X-pol, 3.5 GHz n78, λ/2 spacing (43mm)", ms: 800, spec: "TS 38.214 §5.2" },
      { phase: "CHANNEL",  system: "Channel Estimator",  action: "CSI-RS pilot sweep — 32 beam directions",
        detail: "Sounding 32 DFT beams, collecting CQI/PMI/RI per UE group across 12 RBGs. SRS reciprocity enabled", ms: 1200, spec: "TS 38.211 §7.4.1.5" },
      { phase: "PRECODING",system: "Precoder Engine",    action: "SVD decomposition → rank-8 precoder",
        detail: "W = V[:,0:8]. Condition number: 4.2. Spatial multiplexing rank: 8. PDSCH config: 256-QAM, CR 0.92", ms: 1000, spec: "TS 38.214 §5.2.2" },
      { phase: "NULLSTEER",system: "Beam Weight Engine", action: "Null steering toward SITE-B (az 47°, el -3°)",
        detail: "Interference null placed at SITE-B. SINR gain at null: +11.4 dB. Main lobe deflection: < 0.3°", ms: 1400, spec: "TS 38.214 §5.2.2" },
      { phase: "MU-MIMO",  system: "Scheduler",          action: "MU-MIMO pairing — 4 UE groups",
        detail: "UE-A(az 12°) + UE-B(az 61°) + UE-C(el -8°) + UE-D(el +4°). Spatial orthogonality: 94%", ms: 1100, spec: "TS 38.214 §5.2" },
      { phase: "VALIDATE", system: "Performance Monitor",action: "Throughput validation — 2.4 Gbps achieved ✅",
        detail: "Spectral efficiency: 7.8 b/s/Hz (target: 7.0). Peak: 2.4 Gbps. Edge SINR: 19.7 dB ✅", ms: 900, spec: "TS 38.306" },
    ],
    metrics: {
      before: [["Spectral Eff.","4.2 b/s/Hz"],["Peak Throughput","1.1 Gbps"],["SINR (edge)","8.3 dB"],["Active layers","4"],["Beam gain","21.3 dBi"]],
      after:  [["Spectral Eff.","7.8 b/s/Hz"],["Peak Throughput","2.4 Gbps"],["SINR (edge)","19.7 dB"],["Active layers","8"],["Beam gain","27.1 dBi"]],
      confidence: ["±0.2 b/s/Hz","±0.1 Gbps","±0.8 dB","","±0.4 dBi"],
    },
    causalChain: [
      {label:"Dense urban interference", type:"cause"},
      {label:"Low SINR edge 8.3dB", type:"impact"},
      {label:"Rank-4 MU-MIMO limited", type:"impact"},
      {label:"Throughput 1.1Gbps", type:"user"},
      {label:"64T64R + SVD precoding", type:"fix"},
      {label:"SINR 19.7dB · 2.4Gbps", type:"result"},
    ],
    params: [
      { key: "txPower",   label: "Tx Power",    min: 36, max: 46, step: 1,  unit: "dBm", default: 43 },
      { key: "numLayers", label: "MIMO Layers", min: 2,  max: 8,  step: 2,  unit: "",    default: 8  },
      { key: "nullDepth", label: "Null Depth",  min: -40, max: -20, step: 1, unit: "dB", default: -28 },
    ],
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
        detail: "eMBB: SST=1, QCI-9. URLLC: SST=2, QCI-82, 1ms target. mMTC: SST=3, QCI-70, 1M dev/km²", ms: 700, spec: "TS 23.501 §5.15" },
      { phase: "INJECT",  system: "Traffic Generator",      action: "Ramp all slices to 200% of nominal load",
        detail: "eMBB: 2.1 Gbps (↑190%). URLLC: 48K sessions (↑220%). mMTC: 1.4M devices (↑180%)", ms: 1300, spec: "TS 23.501" },
      { phase: "BREACH",  system: "SLA Watchdog",           action: "⚠️ SLA BREACH — URLLC latency 3.1ms",
        detail: "URLLC target 1ms → measured 3.1ms. eMBB avg: 62 Mbps (target 100 Mbps). Alert: P1 raised", ms: 1100, spec: "TS 28.554" },
      { phase: "SCALE",   system: "RAN Resource Manager",   action: "Elastic PRB rebalancing — URLLC priority",
        detail: "URLLC PRB: 15% → 38%. eMBB PRB: 60% → 42%. mMTC unchanged: 15%. Rebalance in 280ms", ms: 1500, spec: "TS 38.300 §9.2" },
      { phase: "RECOVER", system: "SLA Monitor",            action: "URLLC latency restored: 0.84ms ✅",
        detail: "SLA: URLLC 0.84ms ✅ | eMBB 78 Mbps ⚠️ | mMTC 1.4M ✅. Breach window: 2.1s total", ms: 1000, spec: "TS 28.554" },
      { phase: "REPORT",  system: "Analytics Engine",       action: "SLA stress report — recommendation issued",
        detail: "Breach: 2.1s. Recovery: 280ms. Recommendation: pre-reserve 35% PRB headroom for URLLC", ms: 800, spec: "TS 28.554" },
    ],
    metrics: {
      before: [["eMBB Throughput","1.1 Gbps"],["URLLC Latency","0.82ms ✅"],["mMTC Devices","780K"],["SLA Compliance","100%"],["PRB Utilization","68%"]],
      after:  [["eMBB Throughput","0.94 Gbps"],["URLLC Latency","0.84ms ✅"],["mMTC Devices","1.4M"],["SLA Compliance","97.8%"],["PRB Utilization","95%"]],
      confidence: ["±0.05 Gbps","±0.06ms","±50K","±0.3%","±2%"],
    },
    causalChain: [
      {label:"200% traffic surge", type:"cause"},
      {label:"URLLC PRB starvation", type:"impact"},
      {label:"Latency breach 3.1ms", type:"impact"},
      {label:"P1 alert raised", type:"user"},
      {label:"Elastic PRB rebalance", type:"fix"},
      {label:"Latency 0.84ms ✅", type:"result"},
    ],
    params: [
      { key: "urllcTarget",  label: "URLLC Target", min: 0.5, max: 2.0, step: 0.5, unit: "ms", default: 1.0 },
      { key: "prbHeadroom",  label: "PRB Headroom", min: 10, max: 40, step: 5, unit: "%", default: 35 },
      { key: "trafficLoad",  label: "Traffic Load",  min: 100, max: 300, step: 25, unit: "%", default: 200 },
    ],
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
        detail: "Features: RSRP, SINR, PRB util, HO rate, QoE. Labels: optimal tilt/azimuth/power per zone snapshot", ms: 900, spec: "TS 28.552" },
      { phase: "FEATURE", system: "Feature Engine",     action: "Extract 47 RF features per zone snapshot",
        detail: "Temporal: 15-min rolling avg. Spatial: neighbor SINR gradient. Event: peak markers, MLB/CCO events", ms: 800, spec: "TS 28.552" },
      { phase: "TRAIN",   system: "GNN Engine",         action: "Graph Neural Network — 200 epochs",
        detail: "3-layer GNN, 256 hidden, edge features = interference coupling. Val loss: 0.042 (↓ from 0.310)", ms: 2000, spec: "O-RAN WG2" },
      { phase: "VALIDATE",system: "Validation Engine",  action: "Hold-out evaluation — 15% test set",
        detail: "Tilt MAE: 0.8°. Azimuth MAE: 1.2°. Power MAE: 0.4 dB. Coverage accuracy: 94.1%", ms: 1200, spec: "O-RAN WG2" },
      { phase: "SHADOW",  system: "Shadow Controller",  action: "Shadow mode — 48hr parallel run",
        detail: "AI vs. live agreement: 87%. Proposed tilt changes accepted: 134/154. Throughput gain: +4.2%", ms: 1500, spec: "O-RAN WG2" },
      { phase: "DEPLOY",  system: "AI-RAN Controller",  action: "Promote model v2.1 to active loop ✅",
        detail: "Inference latency: 12ms. Action scope: CCO tilt ±3°, MLB offset ±2dB. Rollback threshold: 95%", ms: 800, spec: "O-RAN WG2 AI/ML" },
    ],
    metrics: {
      before: [["Optimization","Manual (weekly)"],["Tilt accuracy","±3.5°"],["Throughput gain","baseline"],["Model accuracy","N/A"],["Reaction time","72 hrs"]],
      after:  [["Optimization","AI-driven (12ms)"],["Tilt accuracy","±0.8°"],["Throughput gain","+4.2%"],["Model accuracy","94.1%"],["Reaction time","12ms"]],
      confidence: ["","±0.2°","±0.5%","±1.1%","±2ms"],
    },
    causalChain: [
      {label:"Manual weekly optimisation", type:"cause"},
      {label:"Suboptimal tilt ±3.5°", type:"impact"},
      {label:"Coverage gaps + interference", type:"impact"},
      {label:"+4.2% throughput lost", type:"user"},
      {label:"GNN model v2.1 deployed", type:"fix"},
      {label:"12ms AI loop · ±0.8° tilt", type:"result"},
    ],
    params: [
      { key: "trainEpochs",  label: "Train Epochs",   min: 40, max: 200, step: 20, unit: "", default: 120 },
      { key: "learningRate", label: "Learning Rate",  min: 1, max: 10, step: 1, unit: "×0.001", default: 1 },
      { key: "hiddenLayers", label: "Hidden Units",   min: 128, max: 512, step: 128, unit: "", default: 256 },
    ],
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
        detail: "AR/VR: 38%. Gaming: 24%. Video: 29%. IoT ctrl: 9%. Latency-critical flows: 62% of total", ms: 700, spec: "TS 23.501 §5.6" },
      { phase: "DETECT",   system: "Path Analyzer",           action: "Trombone path detected — UPF at core",
        detail: "UE→gNB→N3→Core UPF→N6→Internet→MEC. RTT: 48ms. Ideal with local UPF: 4ms. Penalty: +44ms", ms: 1200, spec: "TS 23.501 §5.6.4" },
      { phase: "MODEL",    system: "MEC Placement Engine",    action: "Evaluate 3 edge placement candidates",
        detail: "A: gNB co-located RTT 3.8ms ✅. B: Agg-ring RTT 7.2ms ⚠️. C: DC-edge RTT 18ms ❌. → Select A", ms: 1000, spec: "TS 23.501 §5.13" },
      { phase: "BREAKOUT", system: "UPF Configurator",        action: "Insert ULCL — local breakout activated",
        detail: "ULCL at NW sector gNB. Split: local 71% / core 29%. N6-LAN route to MEC live. Delay: 22ms install", ms: 1400, spec: "TS 23.501 §5.6.4" },
      { phase: "VALIDATE", system: "QoE Monitor",             action: "Latency validation — AR/VR RTT 4.1ms ✅",
        detail: "AR/VR: 48→4.1ms (▼91%). Gaming: 52→6.3ms. Video: unchanged (CDN). IoT: 44→3.9ms ✅", ms: 1100, spec: "TS 23.501" },
      { phase: "REPORT",   system: "Network Analytics",       action: "Trombone elimination confirmed",
        detail: "MEC offload: 71%. Backhaul saved: 1.8 Gbps. QoE uplift: +35pts. Core load: -44%", ms: 800, spec: "TS 23.501" },
    ],
    metrics: {
      before: [["AR/VR RTT","48ms ❌"],["Gaming RTT","52ms ❌"],["Core backhaul","2.54 Gbps"],["Edge offload","0%"],["Avg QoE","54/100"]],
      after:  [["AR/VR RTT","4.1ms ✅"],["Gaming RTT","6.3ms ✅"],["Core backhaul","0.74 Gbps"],["Edge offload","71%"],["Avg QoE","89/100"]],
      confidence: ["±0.3ms","±0.5ms","±0.08 Gbps","±3%","±4 pts"],
    },
    causalChain: [
      {label:"UPF anchored at core", type:"cause"},
      {label:"Traffic tromboning detected", type:"impact"},
      {label:"AR/VR RTT 48ms penalty", type:"impact"},
      {label:"QoE 54/100 (poor)", type:"user"},
      {label:"ULCL breakout inserted", type:"fix"},
      {label:"RTT 4.1ms · QoE 89/100", type:"result"},
    ],
    params: [
      { key: "ulclLatency",    label: "ULCL Latency",    min: 2,  max: 20, step: 2,  unit: "ms", default: 4  },
      { key: "edgeOffloadPct", label: "Edge Offload",    min: 50, max: 90, step: 5,  unit: "%",  default: 71 },
    ],
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
        detail: "4 ceiling anchors (10m height) + 2 perimeter (4m). Coverage: 12,000 m². GDOP: 1.8 ✅", ms: 900, spec: "TS 38.305" },
      { phase: "PRS",      system: "PRS Configurator",  action: "Configure PRS — 10ms period, comb-4",
        detail: "PRS BW: 100 MHz n78. Periodicity: 10ms. Comb-4, 12 symbols. DL-TDOA + UL-TDOA hybrid enabled", ms: 800, spec: "TS 38.211 §7.4.1.7" },
      { phase: "MEASURE",  system: "RSTD Engine",       action: "RSTD sweep — 24 assets, NLOS mitigation",
        detail: "480 measurements. 3 NLOS paths flagged → downweighted 0.3×. Avg RSTD σ: 2.8ns", ms: 1300, spec: "TS 38.305 §8" },
      { phase: "COMPUTE",  system: "Position Engine",   action: "Multilateration — weighted least squares",
        detail: "WLS solver: 6-anchor TDOA. 4 iterations to convergence. CEP50: 0.31m. CEP90: 0.61m", ms: 1200, spec: "TS 38.305 §9" },
      { phase: "VALIDATE", system: "Accuracy Validator",action: "Ground-truth comparison — 24 reference tags",
        detail: "Horiz. avg: 0.28m (max 0.51m). Vert. avg: 0.44m. 3GPP NR Positioning Class C: ✅ PASS", ms: 1000, spec: "TS 38.305 §10" },
      { phase: "TRACK",    system: "Asset Tracker",     action: "Real-time tracking loop — 10 Hz, 24 assets ✅",
        detail: "Update rate: 10 Hz. Kalman filter: velocity-aided. Zone boundary alert latency: 85ms", ms: 800, spec: "TS 38.305" },
    ],
    metrics: {
      before: [["Positioning","RFID (3–5m)"],["Update rate","2 Hz"],["Floor coverage","60%"],["Asset count","N/A"],["Alert latency","1.5s"]],
      after:  [["Positioning","5G NR (0.28m)"],["Update rate","10 Hz"],["Floor coverage","100%"],["Asset count","24"],["Alert latency","85ms"]],
      confidence: ["±0.04m","","±5%","","±8ms"],
    },
    causalChain: [
      {label:"RFID 3–5m accuracy", type:"cause"},
      {label:"Asset zone boundary miss", type:"impact"},
      {label:"1.5s alert latency", type:"impact"},
      {label:"Factory safety risk", type:"user"},
      {label:"5G NR PRS + WLS solver", type:"fix"},
      {label:"0.28m CEP · 85ms alert", type:"result"},
    ],
    params: [
      { key: "numAnchors", label: "Num Anchors", min: 2, max: 6, step: 1, unit: "", default: 4 },
      { key: "prsSnr",     label: "PRS SNR",     min: 0, max: 20, step: 2, unit: "dB", default: 12 },
      { key: "mlModel",    label: "ML Model",    min: 0, max: 1, step: 1, unit: "", default: 1 },
    ],
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
        detail: "OSM import. Mesh resolution: 0.5m. Materials: concrete (σ=0.01, ε=5.3), glass, brick loaded", ms: 1000, spec: "TR 38.901" },
      { phase: "LAUNCH",   system: "Ray Launcher",     action: "Launch 50,000 rays — 3 transmitter sites",
        detail: "Max reflections: 6. Max diffractions: 2. Scattering: Lambertian model. Freq: 3.5 GHz n78", ms: 1800, spec: "TR 38.901" },
      { phase: "MULTIPATH",system: "Path Analyzer",    action: "Cluster multipath — 12 angular clusters",
        detail: "Avg delay spread: 48ns. Max: 312ns. Dominant: LoS (0dB rel.). Ricean K-factor: 6.2 dB", ms: 1200, spec: "TR 38.901" },
      { phase: "SINR",     system: "SINR Mapper",      action: "Build SINR heat map — 5m resolution grid",
        detail: "18,400 grid points. SINR range: -4 to +31 dB. Coverage (SINR>0): 94.1%. Edge avg: 8.3 dB", ms: 1400, spec: "TR 38.901" },
      { phase: "MIMO",     system: "Channel Modeler",  action: "Extract MIMO rank per grid point",
        detail: "Rank-1: 18%. Rank-2: 31%. Rank-4: 35%. Rank-8: 16%. Avg rank: 3.8 across coverage area", ms: 1100, spec: "TR 38.901" },
      { phase: "CAPACITY", system: "Capacity Engine",  action: "Shannon capacity prediction — output ready ✅",
        detail: "Peak SE: 9.1 b/s/Hz (LoS, rank-8). Avg SE: 5.4 b/s/Hz. Edge: 2.1 b/s/Hz. System: 3.2 Gbps", ms: 900, spec: "TR 38.901" },
    ],
    metrics: {
      before: [["Model type","Simplified FSPL"],["SINR error","±5.2 dB"],["Avg SE","3.1 b/s/Hz"],["Coverage acc.","78%"],["Multipath","ignored"]],
      after:  [["Model type","Ray Tracing (6-bounce)"],["SINR error","±1.1 dB"],["Avg SE","5.4 b/s/Hz"],["Coverage acc.","94.1%"],["Multipath","12 clusters"]],
      confidence: ["","±0.2 dB","±0.3 b/s/Hz","±1.8%",""],
    },
    causalChain: [
      {label:"Simplified FSPL model", type:"cause"},
      {label:"±5.2dB SINR prediction error", type:"impact"},
      {label:"Coverage gaps missed", type:"impact"},
      {label:"78% plan accuracy", type:"user"},
      {label:"Ray tracing 50K rays", type:"fix"},
      {label:"±1.1dB · 94.1% accuracy", type:"result"},
    ],
    params: [
      { key: "numRays",    label: "Num Rays",    min: 100000, max: 2000000, step: 100000, unit: "", default: 1000000 },
      { key: "maxBounces", label: "Max Bounces", min: 2, max: 8, step: 1, unit: "", default: 6 },
      { key: "freq",       label: "Frequency",   min: 2600, max: 4900, step: 100, unit: "MHz", default: 3500 },
    ],
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
        detail: "Cell spacing: 7.5km. Speed: 300 km/h. UE freq: n78 3.5GHz. A3 offset: 3dB, TTT: 40ms", ms: 700, spec: "TS 36.331 §5.5" },
      { phase: "TRAVERSE", system: "UE Simulator",        action: "UE enters corridor — tracking begins",
        detail: "RSRP: Cell-1 → -72dBm. Speed: 300 km/h. Doppler: 972 Hz. Tracking interval: 100ms", ms: 1000, spec: "TS 36.331" },
      { phase: "STORM",    system: "HO Event Monitor",    action: "⚠️ Ping-pong storm — Cell-3 ↔ Cell-4",
        detail: "8 handovers in 4.2s at Cell-3/4 boundary. TTT expired 6×. Ping-pong rate: 68%. BLER: 12%", ms: 1400, spec: "TS 36.331 §5.5.4" },
      { phase: "DIAGNOSE", system: "Root Cause Engine",   action: "A3 offset too low — margin exhausted at speed",
        detail: "At 300km/h: cell overlap duration 90ms < TTT 40ms × 2 = 80ms. A3 offset 3dB → boundary unstable", ms: 1100, spec: "TS 36.331 §5.5.4.4" },
      { phase: "OPTIMIZE", system: "MRO Engine",          action: "Apply: A3 → 5dB, TTT → 64ms, Hysteresis → 3dB",
        detail: "MRO recommendation applied. Boundary stability window: 210ms. Pre-testing before live push", ms: 1200, spec: "TS 36.331 §5.5.4" },
      { phase: "VERIFY",   system: "Validation Engine",   action: "Re-traverse — ping-pong rate 68% → 4% ✅",
        detail: "HO success rate: 99.1%. Ping-pong: 4%. BLER: 1.2%. Throughput sustained at 320 Mbps ✅", ms: 900, spec: "TS 36.331" },
    ],
    metrics: {
      before: [["HO success","87.3%"],["Ping-pong rate","68%"],["BLER","12%"],["Throughput","180 Mbps"],["A3 offset","3 dB"]],
      after:  [["HO success","99.1%"],["Ping-pong rate","4%"],["BLER","1.2%"],["Throughput","320 Mbps"],["A3 offset","5 dB"]],
      confidence: ["±0.4%","±1%","±0.2%","±12 Mbps",""],
    },
    causalChain: [
      {label:"A3 offset 3dB too low", type:"cause"},
      {label:"TTT expired at boundary", type:"impact"},
      {label:"Ping-pong storm 68%", type:"impact"},
      {label:"BLER 12% · 180Mbps", type:"user"},
      {label:"A3→5dB · TTT→64ms (MRO)", type:"fix"},
      {label:"HO 99.1% · 320Mbps ✅", type:"result"},
    ],
    params: [
      { key: "ttt",        label: "TTT",        min: 20, max: 160, step: 20, unit: "ms", default: 40 },
      { key: "a3Offset",   label: "A3 Offset",  min: 0, max: 6, step: 1, unit: "dB", default: 5 },
      { key: "trainSpeed", label: "Train Speed", min: 100, max: 400, step: 50, unit: "km/h", default: 300 },
    ],
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
        detail: "SITE-B: RSRP -78dBm, load 54%, QoE 88. All neighbors nominal. No alerts active", ms: 600, spec: "TS 36.300 §22.3.2" },
      { phase: "FAILURE",  system: "Fault Manager",       action: "🔴 SITE-B hardware failure — cell dark",
        detail: "SITE-B offline: 00:04.2. Lost coverage: 31% of NW zone. 1,240 UEs dropped to idle. P1 raised", ms: 1200, spec: "TS 36.300 §22.3.2" },
      { phase: "DETECT",   system: "SON Self-Heal Engine",action: "Coverage hole detected — 3 neighbors eligible",
        detail: "SITE-A, SITE-C, SITE-D within range. SITE-A: 2.1km (best). Compensation headroom: +4dB each", ms: 1000, spec: "TS 36.300 §22.3.2" },
      { phase: "EXPAND",   system: "CCO Engine",          action: "Boost: SITE-A +4dB, SITE-C +3dB, SITE-D +2dB",
        detail: "SITE-A downtilt -2° (from 6° to 4°). SITE-C azimuth +5°. Power ramp: 200ms each. Interference model recalc", ms: 1400, spec: "TS 36.300 §22.3.2" },
      { phase: "COVERAGE", system: "Coverage Analyzer",   action: "Coverage restored — 94% of affected zone",
        detail: "Recovered UEs: 1,166/1,240 (94%). Edge RSRP: -98dBm (vs -78 nominal). QoE: 88→74 (acceptable ⚠️)", ms: 1100, spec: "TS 36.300 §22.3.2" },
      { phase: "RECOVER",  system: "Recovery Manager",    action: "SITE-B restored — neighbors revert ✅",
        detail: "SITE-B online: 00:42.7. Heal duration: 38.5s. CCO revert: 60s ramp-down. Zero user impact on restore", ms: 800, spec: "TS 36.300 §22.3.2" },
    ],
    metrics: {
      before: [["Zone coverage","100%"],["Affected UEs","0"],["Avg QoE","88/100"],["Neighbor load","54%"],["Heal time","N/A"]],
      after:  [["Zone coverage","94%"],["Affected UEs","74 (6%)"],["Avg QoE","74/100"],["Neighbor load","81%"],["Heal time","38.5s ✅"]],
      confidence: ["±2%","±18 UEs","±3 pts","±4%","±1.5s"],
    },
    causalChain: [
      {label:"SITE-B hardware failure", type:"cause"},
      {label:"31% NW zone coverage loss", type:"impact"},
      {label:"1,240 UEs dropped", type:"impact"},
      {label:"P1 alert · service loss", type:"user"},
      {label:"SON CCO power/tilt boost", type:"fix"},
      {label:"94% UEs restored · 38.5s", type:"result"},
    ],
    params: [
      { key: "sonPowerBoost",  label: "SON Power Boost", min: 1, max: 6, step: 1, unit: "dB", default: 3 },
      { key: "tiltDelta",      label: "Tilt Delta",       min: 1, max: 5, step: 1, unit: "°",  default: 2 },
      { key: "rerouteTimeout", label: "Reroute Timeout",  min: 5, max: 30, step: 5, unit: "s", default: 8 },
    ],
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
        detail: "B3 1800MHz, 20MHz FDD. LTE: 80 PRBs (MBSFN subframes for NR). NR: mbsfn-subframeConfig loaded", ms: 700, spec: "TS 38.300 §5.4" },
      { phase: "ACTIVATE", system: "NR Scheduler",         action: "NR activated — initial 15 PRB allocation",
        detail: "NR SSB on PRB 0-3. PDCCH CORESET configured. NR UEs: 12. LTE: 65 PRBs. CRS IC enabled", ms: 1000, spec: "TS 38.211" },
      { phase: "GROWTH",   system: "Traffic Manager",      action: "NR demand surge — ramp to 60% NR load",
        detail: "NR UEs: 12→48. Demand: 140 Mbps NR. LTE demand: stable 85 Mbps. Dynamic rebalance triggered", ms: 1300, spec: "TS 38.300" },
      { phase: "REBALANCE",system: "DSS Scheduler",        action: "PRB rebalance: NR 55 PRBs, LTE 45 PRBs",
        detail: "LTE CRS puncturing: 4 PRBs avoided. NR muting pattern: 7.5kHz SCS. LTE SINR impact: -1.2dB", ms: 1400, spec: "TS 38.211 §7.4.1.2" },
      { phase: "CRS_IC",   system: "CRS Interference Canceller", action: "CRS interference cancelled — -1.2dB restored",
        detail: "CRS-IC gain: +1.4dB. LTE SINR restored to within 0.2dB of baseline. NR CM: 256QAM maintained", ms: 1100, spec: "TS 36.211 §6.10.1" },
      { phase: "VALIDATE", system: "Coexistence Validator",action: "DSS coexistence confirmed — both SLAs met ✅",
        detail: "NR: 142 Mbps ✅. LTE: 87 Mbps ✅ (vs 85 baseline). Spectral efficiency gain: +38%. CRS-IC active", ms: 800, spec: "TS 38.300" },
    ],
    metrics: {
      before: [["NR capacity","0 (not active)"],["LTE capacity","85 Mbps"],["PRB util (NR)","0%"],["Spectral eff.","3.8 b/s/Hz"],["CRS impact","N/A"]],
      after:  [["NR capacity","142 Mbps"],["LTE capacity","87 Mbps"],["PRB util (NR)","55%"],["Spectral eff.","5.2 b/s/Hz"],["CRS impact","mitigated ✅"]],
      confidence: ["±6 Mbps","±4 Mbps","±3%","±0.2 b/s/Hz",""],
    },
    causalChain: [
      {label:"LTE monopolising B3 spectrum", type:"cause"},
      {label:"Zero NR capacity available", type:"impact"},
      {label:"5G devices degraded to LTE", type:"impact"},
      {label:"Spectral efficiency 3.8 b/s/Hz", type:"user"},
      {label:"DSS PRB rebalance + CRS-IC", type:"fix"},
      {label:"NR 142Mbps · SE +38% ✅", type:"result"},
    ],
    params: [
      { key: "nrPrbShare", label: "NR PRB Share", min: 10, max: 70, step: 5, unit: "%", default: 55 },
      { key: "crsIcMode",  label: "CRS-IC Mode",  min: 0, max: 1, step: 1, unit: "", default: 1 },
      { key: "nrUEs",      label: "NR UEs",        min: 12, max: 96, step: 12, unit: "", default: 48 },
    ],
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
        detail: "DTM import: 18×13 pixel grid, 5m/px. Clutter classes: open, suburban, dense urban, building. Ridge: 8m above datum", ms: 800, spec: "TR 38.901 §7.4" },
      { phase: "COMPUTE",  system: "Path Loss Engine",     action: "Run Okumura-Hata model — pixel-by-pixel scan",
        detail: "Model: Okumura-Hata (urban 3.5GHz). 3 transmitters. 234 grid points. Ridge loss: +6dB. Building loss: +10dB", ms: 1600, spec: "TR 38.901 §7.4" },
      { phase: "RSRP",     system: "Signal Mapper",        action: "Generate RSRP heatmap — green→red gradient",
        detail: "RSRP range: -62 to -108 dBm. Coverage (RSRP>-90): 81.4%. Edge avg: -97 dBm. 3 coverage holes flagged", ms: 1100, spec: "TR 38.901 §7.4" },
      { phase: "BSP",      system: "Best Server Engine",   action: "Compute Best Server Plot — dominant cell per pixel",
        detail: "Cell-1 dominates: 38% of area. Cell-2: 34%. Cell-3: 28%. Boundary overlap: 7 pixels (handover risk zone)", ms: 1000, spec: "TR 38.901 §7.4" },
      { phase: "CI",       system: "Interference Analyzer",action: "C/I interference layer — hotspots in red",
        detail: "C/I < 5dB: 14 pixels (6%). Worst: Cell-1/2 boundary, C/I = 1.8dB. Recommend: A3 offset +1dB at boundary", ms: 1200, spec: "TR 38.901 §7.4" },
      { phase: "OVERLAY",  system: "GIS Renderer",         action: "Apply vector overlays — streets + building footprints ✅",
        detail: "Street grid overlaid. 2 buildings in shadow zone identified. Coverage hole at Main/4th intersection: -103 dBm", ms: 900, spec: "TR 38.901 §7.4" },
    ],
    metrics: {
      before: [["Model","Simplified FSPL"],["Grid resolution","50m/px"],["Clutter","ignored"],["C/I hotspots","unknown"],["BSP accuracy","~60%"]],
      after:  [["Model","Okumura-Hata + DTM"],["Grid resolution","5m/px"],["Clutter","6 classes"],["C/I hotspots","14 pixels (6%)"],["BSP accuracy","94.1%"]],
      confidence: ["","","","±1 pixel","±2.1%"],
    },
    causalChain: [
      {label:"FSPL model 50m resolution", type:"cause"},
      {label:"Coverage holes undetected", type:"impact"},
      {label:"C/I hotspots unknown", type:"impact"},
      {label:"Site plan accuracy 60%", type:"user"},
      {label:"Okumura-Hata + DTM 5m", type:"fix"},
      {label:"94.1% accuracy · holes flagged", type:"result"},
    ],
    params: [
      { key: "gridResolution", label: "Grid Res",    min: 2, max: 20, step: 2, unit: "m",  default: 5  },
      { key: "clutter",        label: "Clutter Loss", min: 0, max: 12, step: 1, unit: "dB", default: 10 },
      { key: "ridgeLoss",      label: "Ridge Loss",   min: 0, max: 12, step: 1, unit: "dB", default: 6  },
    ],
  },
  {
    id: "oran-ric",
    title: "Open RAN — RIC xApp Deployment",
    icon: "🔌",
    badge: "O-RAN",
    color: "#6366f1",
    genModes: ["nsa", "sa"],
    description:
      "Deploy a Near-RT RIC on O-Cloud and onboard an MLB xApp. Engine simulates E2 interface setup " +
      "across 3 multi-vendor gNBs, O1 telemetry ingestion, xApp inference, and closed-loop E2 CONTROL.",
    steps: [
      { phase: "ARCH",      system: "O-Cloud Orchestrator", action: "Deploy Near-RT RIC — 3-node Kubernetes cluster",
        detail: "RIC platform: O-RAN SC release G. Nodes: 3×16-core VM, 64GB RAM. E2 termination: 3 gNBs (Ericsson, Nokia, Samsung). A1 interface to Non-RT RIC active", ms: 900, spec: "O-RAN.WG6" },
      { phase: "E2SETUP",   system: "E2 Interface Manager", action: "E2 Setup — 3 gNB connections established",
        detail: "gNB-1 (Ericsson AIR 6449): E2AP v2.0 ✅. gNB-2 (Nokia AirScale): E2AP v2.0 ✅. gNB-3 (Samsung): E2AP v1.01 ✅. E2SM-KPM v2.0 subscribed on all nodes", ms: 1200, spec: "O-RAN.WG3.E2AP v2.0" },
      { phase: "TELEMETRY", system: "O1 Collector",          action: "O1 KPI stream active — 15-min PM reports",
        detail: "KPIs ingested: SINR, PRB util, HO success rate, active UEs per cell. PM files → SMO → influxDB. VES events for alarms. Data latency: 890ms avg", ms: 1000, spec: "O-RAN.WG10.O1" },
      { phase: "XAPP",      system: "xApp Manager",          action: "Load MLB xApp v1.4 — E2SM-RC subscription",
        detail: "xApp: MLB-xApp v1.4 (O-RAN SC). Subscribes: E2SM-RC v1.0. Trigger: PRB util >75% for >3 min. Inference engine: ONNX Runtime, latency 8ms. A1 policy received ✅", ms: 1300, spec: "O-RAN.WG3.E2SM-RC" },
      { phase: "OVERRIDE",  system: "Near-RT RIC",           action: "E2 CONTROL issued — NW-047 PRB 81% → rebalance",
        detail: "xApp decision: MLB offset +2dB to SITE-A Sector 2. E2 CONTROL → Nokia AirScale → CIO applied. Round-trip: 22ms. Ericsson + Samsung cells unaffected ✅", ms: 1500, spec: "O-RAN.WG3.E2AP" },
      { phase: "VALIDATE",  system: "RIC Analytics",         action: "Multi-vendor closed loop confirmed ✅",
        detail: "NW-047 PRB: 81%→62% ✅. Neighbour balanced. RIC audit log: 47 MLB actions/hr automated. Vendor lock-in eliminated: 3-vendor RAN managed by single RIC", ms: 800, spec: "O-RAN.WG3" },
    ],
    metrics: {
      before: [["Control loop","Vendor proprietary (15min)"],["PRB utilisation","81%"],["Vendor lock-in","Proprietary OSS"],["MLB actions/hr","2 (manual)"],["RIC inference","N/A"]],
      after:  [["Control loop","RIC xApp (8ms)"],["PRB utilisation","62%"],["Vendor lock-in","Open (3 vendors)"],["MLB actions/hr","47 (automated)"],["RIC inference","8ms ✅"]],
      confidence: ["","±3%","","±5","±1ms"],
    },
    causalChain: [
      {label:"Vendor-locked proprietary OSS", type:"cause"},
      {label:"MLB limited to single vendor", type:"impact"},
      {label:"PRB imbalance 81% NW-047", type:"impact"},
      {label:"Manual 15-min control loop", type:"user"},
      {label:"Near-RT RIC + MLB xApp", type:"fix"},
      {label:"8ms loop · 3 vendors · 62% PRB", type:"result"},
    ],
    params: [
      { key: "prbTrigger",       label: "PRB Trigger",  min: 60, max: 90, step: 5, unit: "%",  default: 75 },
      { key: "inferenceLatency", label: "Infer. Lat.",  min: 4, max: 20, step: 4, unit: "ms", default: 8  },
      { key: "mlbOffset",        label: "MLB Offset",   min: 1, max: 6, step: 1, unit: "dB", default: 2  },
    ],
  },
  {
    id: "green-ran",
    title: "Green RAN — Energy Saving & Carbon Reduction",
    icon: "🌿",
    badge: "3GPP Rel-17",
    color: "#22c55e",
    genModes: ["4g", "nsa", "sa"],
    description:
      "Activate 3GPP Release 17 energy saving features across a 4-site deployment. Engine schedules " +
      "carrier sleep, symbol shutdown, and Cell DTX during low-traffic hours, validating QoE and OPEX impact.",
    steps: [
      { phase: "AUDIT",    system: "Energy Monitor",       action: "Baseline audit — 4 sites, 12 sectors, 24/7 full power",
        detail: "Avg load 02:00–05:00: 11%. Power per site: 18kW (PA: 8kW, BBU: 4kW, cooling: 4kW, misc: 2kW). Monthly cost: $8,400. CO₂: 13.6t/month", ms: 800, spec: "TS 38.300 §9.2.6" },
      { phase: "POLICY",   system: "ES Policy Engine",     action: "Configure Rel-17 ES policy — 3-tier shutdown",
        detail: "Tier 1: Symbol blanking (6/14 OFDM symbols). Tier 2: n78 carrier sleep (UE count <5). Tier 3: Cell DTX (load <3%). WUS period: 20ms (TS 38.300 §9.2.6)", ms: 1000, spec: "TS 38.300 §9.2.6" },
      { phase: "SCHEDULE", system: "Traffic Predictor",    action: "Low-traffic window: 01:30–05:30 (4 hrs)",
        detail: "ML traffic prediction: LSTM model, 30-day history, 97.3% window accuracy. Hysteresis: ±15 min. Guard period: 10 min pre-window for graceful drain", ms: 1200, spec: "TS 38.300" },
      { phase: "ACTIVATE", system: "RAN ES Controller",    action: "Energy saving activated — n78 shutdown on 4 cells",
        detail: "n78 carrier off: NW-047, NE-012, SW-008, CN-031 (B3 anchor maintained). Symbol blanking: 6/14 active on all sectors. Cell DTX: enabled. Power drop: 18→12.4kW/site", ms: 1400, spec: "TS 38.214" },
      { phase: "MONITOR",  system: "QoE Watchdog",         action: "UE experience validated — QoE within threshold",
        detail: "WUS latency: 18ms (target <25ms ✅). RSRP edge: -80dBm→-82dBm (-2dB, acceptable). QoE: 88→85/100 (-3pts). No SLA breach. 0 UE complaints logged", ms: 1100, spec: "TS 28.554" },
      { phase: "REPORT",   system: "OPEX Analytics",       action: "Energy saving report — 31% reduction achieved ✅",
        detail: "Power saved: 5.6kW/site. Monthly saving: $2,600 (31%). CO₂ reduction: 4.2t/month. Annual OPEX saving: $31,200. ESG metric updated: -50.4t CO₂/yr", ms: 900, spec: "TS 28.310" },
    ],
    metrics: {
      before: [["Power/site","18 kW"],["Monthly OPEX","$8,400"],["CO₂/month","13.6t"],["Energy saving","0%"],["QoE (low traffic)","88/100"]],
      after:  [["Power/site","12.4 kW"],["Monthly OPEX","$5,800"],["CO₂/month","9.4t"],["Energy saving","31%"],["QoE (low traffic)","85/100"]],
      confidence: ["±0.3 kW","±$180","±0.2t","±2%","±2 pts"],
    },
    causalChain: [
      {label:"24/7 full power — 11% avg load", type:"cause"},
      {label:"18kW wasted off-peak", type:"impact"},
      {label:"$8,400/month OPEX", type:"impact"},
      {label:"13.6t CO₂/month", type:"user"},
      {label:"Rel-17 carrier sleep + DTX", type:"fix"},
      {label:"−31% power · −4.2t CO₂/month", type:"result"},
    ],
    params: [
      { key: "esWindow",        label: "ES Window",       min: 2, max: 8, step: 1, unit: "h",    default: 4  },
      { key: "symbolShutdown",  label: "Symbol Shutdown", min: 2, max: 12, step: 2, unit: "/14", default: 6  },
      { key: "wusPeriodicity",  label: "WUS Period",      min: 10, max: 80, step: 10, unit: "ms", default: 20 },
    ],
  },
  {
    id: "private-5g",
    title: "5G Private Network — Industrial Campus",
    icon: "🏭",
    badge: "Private 5G",
    color: "#f59e0b",
    genModes: ["4g", "nsa", "sa"],
    description:
      "Deploy a standalone 5G private network on a 200,000 m² industrial campus. Engine simulates " +
      "PLMN isolation, CBRS SAS coordination, on-premise UPF, AGV URLLC slice, and public network roaming handover.",
    steps: [
      { phase: "PLMN",     system: "Core Configurator",    action: "Isolate private PLMN — MCC 315, MNC 010 (CBRS)",
        detail: "Private PLMN: 315-010. AMF isolation: dedicated slice per campus. S-NSSAI: AGV SST=2/SD=000001, Video SST=1/SD=000002. N2/N3 on-premise. No public core dependency", ms: 800, spec: "TS 23.501 §5.30" },
      { phase: "SAS",      system: "CBRS SAS Client",      action: "CBRS SAS coordination — PAL grant acquired",
        detail: "SAS provider: Google SAS. Band: CBRS n48 (3550–3700 MHz). PAL license: 10×10 MHz. CPI registered: site lat/lon filed. Grant: 25 dBm EIRP, 10 MHz BW ✅", ms: 1100, spec: "FCC Part 96" },
      { phase: "UPF",      system: "On-Prem UPF",          action: "Deploy on-premise UPF — N6 to campus LAN",
        detail: "UPF: free5GC on Dell PowerEdge R750 (32-core, 128GB RAM). N3: gNB→UPF 1Gbps dark fiber. N6: UPF→campus LAN 10Gbps. Latency to AGV controller: 2.1ms ✅", ms: 1200, spec: "TS 23.501 §5.6" },
      { phase: "SLICE",    system: "Slice Orchestrator",   action: "Activate AGV URLLC + video eMBB slices",
        detail: "AGV slice: URLLC SST=2, 1ms target, 50 AGVs, PRB reserved 30%. Video slice: eMBB SST=1, 500 Mbps, 120 cameras, PRB elastic. Isolation: RB-level scheduler enforcement", ms: 1300, spec: "TS 23.501 §5.15" },
      { phase: "ROAMING",  system: "Mobility Manager",     action: "AGV exits campus — roaming to public 5G SA",
        detail: "AGV-07 exits north gate. RSRP: private gNB -96dBm → public gNB -81dBm. N26 handover: 18ms. Slice continuity maintained on public network via roaming agreement", ms: 1400, spec: "TS 23.502 §4.11" },
      { phase: "VALIDATE", system: "Campus NOC",           action: "Private 5G KPIs confirmed — all SLAs met ✅",
        detail: "AGV latency: 1.8ms ✅ (target 5ms). Camera throughput: 480 Mbps ✅. Roaming HO success: 100%. Uptime: 99.997%. Public network fallback: zero service gap ✅", ms: 900, spec: "TS 23.501" },
    ],
    metrics: {
      before: [["Network","Shared public 5G"],["AGV latency","12ms ❌"],["Isolation","None (shared)"],["Roaming","N/A"],["Camera BW","180 Mbps (WiFi)"]],
      after:  [["Network","Private PLMN 315-010"],["AGV latency","1.8ms ✅"],["Isolation","PLMN + slice"],["Roaming","N26 18ms ✅"],["Camera BW","480 Mbps ✅"]],
      confidence: ["","±0.2ms","","","±15 Mbps"],
    },
    causalChain: [
      {label:"Shared public network", type:"cause"},
      {label:"No PLMN isolation", type:"impact"},
      {label:"AGV latency 12ms · no SLA", type:"impact"},
      {label:"Factory automation at risk", type:"user"},
      {label:"Private PLMN + on-prem UPF", type:"fix"},
      {label:"1.8ms latency · 99.997% uptime", type:"result"},
    ],
    params: [
      { key: "agvFleet",     label: "AGV Fleet",     min: 8, max: 48, step: 8, unit: "",    default: 24 },
      { key: "urllcLatency", label: "URLLC Target",  min: 0.5, max: 2.0, step: 0.5, unit: "ms", default: 1.0 },
      { key: "cbrsEirp",     label: "CBRS EIRP",     min: 30, max: 47, step: 1, unit: "dBm", default: 47 },
    ],
  },
  {
    id: "leo-interference",
    title: "LEO Satellite — C-Band Interference",
    icon: "🛸",
    badge: "C-Band / ITU",
    color: "#a855f7",
    genModes: ["4g", "nsa", "sa"],
    description:
      "Starlink LEO constellation passes over a 5G n78 (C-band) deployment. Engine models interference " +
      "floor rise, SINR degradation, adaptive frequency hopping, and ITU coordination filing.",
    steps: [
      { phase: "TRACK",    system: "Satellite Tracker",    action: "LEO constellation overpass detected — 340km orbit",
        detail: "Constellation: SpaceX Starlink Gen2. Orbit: 340km. Pass duration: 4.2 min. Footprint: 850km². Downlink: 10.7–12.7 GHz (Ku). Uplink: 14.0–14.5 GHz. C-band overlap risk: n78 3.5GHz adjacent", ms: 900, spec: "ITU-R S.1503" },
      { phase: "MEASURE",  system: "Interference Scanner", action: "C-band interference floor rising — +8.4 dB",
        detail: "Pre-pass noise floor: -108 dBm/MHz. During pass: -99.6 dBm/MHz (+8.4 dB). Affected cells: n78 sectors facing elevation >15°. SINR drop: 18.2→9.1 dB on NE-012, SE-023", ms: 1200, spec: "ITU-R M.2101" },
      { phase: "IMPACT",   system: "KPI Monitor",          action: "⚠️ Throughput degraded — 3 cells affected",
        detail: "NE-012: 342→187 Mbps (↓45%). SE-023: 289→141 Mbps (↓51%). SW-008: unaffected (south-facing). BLER spike: 1.2%→8.7%. UE count dropping: 1,240→1,190 (50 UEs lost signal)", ms: 1100, spec: "ITU-R M.2101" },
      { phase: "MITIGATE", system: "Frequency Coordinator", action: "Adaptive frequency hopping — avoid interference band",
        detail: "n78 carrier: 3500MHz→3620MHz (avoid 3.5–3.55GHz overlap). 100MHz hop. PDCCH blind decoding updated. Sub-band scheduling: skip PRBs 0–28 (3500–3510MHz). Ramp: 800ms", ms: 1400, spec: "TS 38.104" },
      { phase: "ITU",      system: "Regulatory Engine",    action: "ITU coordination filing — Article 9 notification",
        detail: "Filing: ITU BR IFIC. Coordination area: 47.3°N 122.2°W, 850km radius. Interference evidence: 4.2 min IQ capture, spectral density report. Expected response: 4–8 weeks", ms: 1000, spec: "ITU-R Article 9" },
      { phase: "VALIDATE", system: "Post-Mitigation Monitor", action: "Interference mitigated — SINR restored ✅",
        detail: "Post-hop SINR: NE-012 17.1dB ✅ (was 9.1). SE-023 15.8dB ✅. Throughput restored: 94% of pre-pass baseline. ITU case #: LEO-2026-0342 filed. Next pass: 97 min", ms: 800, spec: "TS 38.104" },
    ],
    metrics: {
      before: [["Noise floor","-108 dBm/MHz"],["SINR (NE-012)","18.2 dB ✅"],["Throughput (avg)","315 Mbps"],["BLER","1.2%"],["ITU filing","None"]],
      after:  [["Noise floor","-99.6 dBm/MHz (pass)"],["SINR (NE-012)","17.1 dB ✅ (restored)"],["Throughput (avg)","296 Mbps (94%)"],["BLER","1.4% ✅"],["ITU filing","LEO-2026-0342 ✅"]],
      confidence: ["±0.5 dBm/MHz","±0.8 dB","±12 Mbps","±0.2%",""],
    },
    causalChain: [
      {label:"LEO overpass — C-band overlap", type:"cause"},
      {label:"Noise floor +8.4dB", type:"impact"},
      {label:"SINR 18.2→9.1dB (3 cells)", type:"impact"},
      {label:"Throughput −45% · 50 UEs lost", type:"user"},
      {label:"Freq hop 3500→3620MHz + ITU", type:"fix"},
      {label:"SINR 17.1dB restored · ITU filed", type:"result"},
    ],
    params: [
      { key: "hopFreq",        label: "Hop Freq",       min: 3550, max: 3700, step: 50, unit: "MHz", default: 3620 },
      { key: "triggerSINR",    label: "Trigger SINR",   min: 8, max: 16, step: 1, unit: "dB",  default: 12   },
      { key: "exclusionRadius",label: "Excl. Radius",   min: 100, max: 400, step: 50, unit: "km", default: 200  },
    ],
  },
];

// ─── Vendor CLI Output per Step (indexed by scenarioId, then step index 0-5) ─

const SCENARIO_CLI = {
  "mimo-3d": [
    "# Ericsson AirScale RBS6902 — 64T64R Init\nset AntennaUnit=1 NrDlArfcn=633984 NrBandwidth=100 TxPower=43\nset MassiveMIMO=1 NrAntennaPorts=64 TxAntennas=64 RxAntennas=64\nset CrossPolConfig=XPolDual Spacing=HalfLambda",
    "# CSI-RS Pilot Sweep — 32 DFT Beams\nset CsiRsConfig=1 NumBeams=32 SubcarrierSpacing=30kHz\nset SrsMeasurement=1 ReciprocityEnabled=true SrsResourceSet=periodic-40ms\nget BeamSweepReport CqiPerBeam=true",
    "# SVD Precoder — Rank-8\nset PrecoderAlgorithm=SVD NumLayers=8 ConditionThreshold=5.0\nset MuMimoEnabled=true MaxPairs=4 SpatialOrthThreshold=90\ncalculate SvdPrecoder AntennaArray=64T64R ChannelMatrix=UE-A,UE-B,UE-C,UE-D",
    "# Null Steering — SITE-B Interferer\nset NullSteeringEnabled=true TargetAzimuth=47 TargetElevation=-3\nset NullDepth=-28 MainLobeDeflectionLimit=0.3\napply BeamWeights SiteId=SITE-A InterfererSite=SITE-B",
    "# MU-MIMO Pairing — 4 UE Groups\nset MuMimoGrouping=UE-A,UE-B,UE-C,UE-D\nset SpatialOrthogonality=94 PrecodingMatrix=WSVD\nschedule MuMimoRound ModCoding=256QAM CodeRate=0.92",
    "# Throughput Validation Report\nget CellThroughput SiteId=SITE-A SectorId=1\n→ DlThroughput: 2.4 Gbps  SpectralEff: 7.8 b/s/Hz\n→ EdgeSINR: 19.7 dB  ActiveLayers: 8  BeamGain: 27.1 dBi\n→ Status: PASS ✅",
  ],
  "slicing-sla": [
    "# Nokia MCP — Slice Definition (NETCONF)\n<edit-config>\n  <slice id='eMBB' sst='1' qci='9' maxLatency='20ms'/>\n  <slice id='URLLC' sst='2' qci='82' maxLatency='1ms' priority='1'/>\n  <slice id='mMTC' sst='3' qci='70' devDensity='1M/km2'/>\n</edit-config>",
    "# Traffic Generator — Ramp to 200%\ntraffic inject profile=overload\n  eMBB: rate=2.1Gbps  scalar=1.9x\n  URLLC: sessions=48000  scalar=2.2x\n  mMTC: devices=1400000  scalar=1.8x\nmonitor SlaWatchdog interval=100ms",
    "# SLA Watchdog Alert — P1 Breach\n[ALERT] P1 SLA-BREACH slice=URLLC\n  measured_latency=3.1ms  target=1ms  delta=+2.1ms\n  eMBB_throughput=62Mbps  target=100Mbps\n  action=ESCALATE priority=CRITICAL\n  ticket=INC-2847193 raised=true",
    "# RAN Resource Manager — PRB Rebalance\nset PrbAllocation slice=URLLC value=38\nset PrbAllocation slice=eMBB value=42\nset PrbAllocation slice=mMTC value=15\nvalidate PrbTotal max=100 result=95 ✅\n→ Rebalance applied in 280ms",
    "# SLA Monitor — Recovery Confirmed\nget SlaSummary\n→ URLLC: 0.84ms ✅ (target 1ms)\n→ eMBB: 78Mbps ⚠️ (target 100Mbps, recovering)\n→ mMTC: 1.4M devices ✅\nget BreachWindow → 2.1 seconds total",
    "# Analytics Engine — Stress Report\ngenerate SlaReport format=json\n  breach_duration=2.1s\n  recovery_time=280ms\n  recommendation='pre-reserve 35% PRB headroom for URLLC'\nexport SlaReport dest=NOC-Dashboard",
  ],
  "ai-ran": [
    "# Ericsson RIC — KPI Collection\ncollect KpiStream cells=NW-047,NW-052,NW-091 interval=1s\n  metrics=SINR,PRButil,HOsuccess,QoE\n  window=168h export=training-dataset-v3.parquet\nrows_collected: 1,247,680",
    "# AI-RAN GNN Model Training\npython train_gnn.py --dataset=training-dataset-v3.parquet \\\n  --epochs=120 --lr=0.001 --hidden=256 --layers=4\n→ Epoch 60: loss=0.032  val_acc=91.4%\n→ Epoch 120: loss=0.008  val_acc=97.2%\n→ Model saved: ran-gnn-v3.onnx (18.4MB)",
    "# ONNX Runtime Deployment\nonnx_deploy model=ran-gnn-v3.onnx target=RIC-xApp\n  inference_threads=4 batch_size=32 precision=FP16\n  latency_p50=11ms latency_p99=18ms\n→ xApp registered with E2 interface ✅",
    "# Live Inference — Cell NW-047\npredict TiltAzimuth cell=NW-047\n  input: [SINR=9.1dB, PRB=78%, HO_fail=12%]\n  prediction: tilt_delta=-2° azimuth_delta=+3°\n  confidence=94.2%  inference_latency=11ms",
    "# Ericsson ENM — Parameter Push\nset AntennaUnit cell=NW-047 Tilt=8 Azimuth=127\n  previous: Tilt=10 Azimuth=124\n  change_applied: true  rollback_timeout=15min\nmonitor KpiDelta interval=30s threshold=improve",
    "# Validation Report — NW-047\nget CellKpis cell=NW-047\n→ SINR: 9.1dB → 21.4dB (+12.3dB) ✅\n→ Throughput: 87Mbps → 312Mbps ✅\n→ HO success: 81.3% → 99.1% ✅\n→ QoE: 3.1 → 4.7 (MOS) ✅  Model: PASS",
  ],
  "edge-trombone": [
    "# DPI Engine — Traffic Classification\nclassify Traffic interface=N6-uplink\n  AR_VR: 38%  Gaming: 24%  Video: 29%  IoT: 9%\n  latency_critical_flows: 62%\n→ Classification complete",
    "# Path Analyzer — Trombone Detection\ntrace Path ue=UE-001\n  route: UE→gNB→N3→CoreUPF→N6→Internet→MEC\n  RTT_measured=48ms  RTT_local_target=4ms\n  trombone_penalty=+44ms",
    "# MEC Placement Engine — Candidate Eval\nevaluate MecPlacement candidates=3\n  A: gNB-collocated RTT=3.8ms ✅\n  B: Agg-ring RTT=7.2ms ⚠️\n  C: DC-edge RTT=18ms ❌\n→ Selected: Site-A (gNB-collocated)",
    "# UPF Configurator — ULCL Breakout\nconfigure ULCL site=gNB-A\n  split: local=71% core=29%\n  N6-LAN: MEC-route active\n  install_delay=22ms\n→ ULCL active ✅",
    "# QoE Monitor — Latency Validation\nget RttReport app=AR_VR\n→ Before: 48ms  After: 4.1ms (▼91%) ✅\nget RttReport app=Gaming\n→ Before: 52ms  After: 6.3ms ✅\n→ Video: unchanged (CDN)  IoT: 44→3.9ms ✅",
    "# Network Analytics — Trombone Elimination\ngenerate TromboneReport\n  MEC_offload: 71%\n  backhaul_saved: 1.8Gbps\n  QoE_uplift: +35pts\n  core_load_delta: -44%\nexport dest=NOC-Dashboard ✅",
  ],
  "indoor-pos": [
    "# NR Positioning — Anchor Setup\nconfigure PosAnchor nodes=4\n  ANCHOR-A: [0,0,4m]  ANCHOR-B: [40,0,4m]\n  ANCHOR-C: [40,30,4m]  ANCHOR-D: [0,30,4m]\nset PRS config=PRS-Resource-Set-1 SCS=30kHz NumSymbols=4",
    "# PRS Transmission — NR TS 38.215\ntransmit PRS resourceSet=1\n  power=23dBm  beamSweep=8  periodicity=80ms\n  RSTD_measurements: 4 anchor pairs\n→ PRS received SNR: avg +12dB",
    "# OTDOA — Time Difference of Arrival\ncompute OTDOA\n  RSTD pairs: [A-B: 14.3ns, A-C: 28.7ns, A-D: 19.1ns]\n  hyperbola_intersection: [20.4m, 15.2m]\n  initial_CEP: 5m (RFID baseline)  NR_CEP: 0.4m",
    "# RFID Fusion — Hybrid Mode\nfuse RFID tags=12 NR_TDOA=1\n  RFID_accuracy=3-5m  NR_TDOA=0.4m\n  Kalman_filter: enabled  alpha=0.85\n→ Fused CEP: 0.8m (intermediate)",
    "# ML Position Refinement\npredict Position model=fingerprint-rf-v2\n  features=[RSRP×4, AoA×2, RSTD×6]\n  prediction_latency=9ms\n  ML_CEP: 0.28m  confidence=96.1%",
    "# Positioning Validation\nget PositionAccuracy mode=batch n=500\n→ CEP: 0.28m (3GPP Class C: <0.3m) ✅\n→ Latency: 9ms ✅ (target <20ms)\n→ Anchors_used: 4/4 ✅\n→ Standard: 3GPP TS 38.215 §9 PASS ✅",
  ],
  "ray-tracing": [
    "# Ray Tracer — Scene Mesh Import\nimport Scene file=urban_block.obj\n  triangles=48291  materials=9\n  buildings: 12  floors: 4-8  street_width=12m\n  material_props: concrete eps=5.3 sigma=0.02",
    "# Ray Launch — SBR Method\nlaunch Rays src=gNB-ROOF-1\n  method=SBR  num_rays=1000000  freq=3.5GHz\n  reflections=6  diffractions=2  transmissions=3\n→ Launch complete: 1M rays × 6 bounces",
    "# Multipath Analysis\ncollect MultipathClusters rx=UE-GRID\n  clusters=6  delay_spread_avg=48ns  max=312ns\n  dominant: LoS 0ns 0dBm  strongest_NLOS: 18ns -6dBm\n→ Power Delay Profile: 6 clusters captured",
    "# SINR Map Generation\ncompute SinrMap resolution=1m\n  mean_SINR=18.7dB  edge=11.2dB\n  coverage_16dB: 84.2%\n  hotspot_SINR_peak: 28.4dB @ LoS corridor",
    "# Antenna Pattern Optimisation\noptimise AntennaPlacement targets=SINR_EDGE>15dB\n  iterations=47  tilt_sweep=[-10°..+5°]\n  optimal: tilt=-3° azimuth=127°\n→ Edge SINR: 11.2→18.7dB ✅  +7.5dB gain",
    "# Ray Tracing Report Export\nexport RayReport format=hdf5 dest=planning-tool\n  SINR_map: 18.7dB mean  coverage_15dB: 94.2%\n  delay_spread: 48ns avg\n  model_accuracy: ±1.4dB vs drive-test ✅",
  ],
  "ho-storm": [
    "# Ericsson ENM — HO Ping-Pong Alarm\n[ALARM] HOPingPong severity=MAJOR cell=CELL-3,CELL-4\n  ho_rate=847/min  pingpong_ratio=73%\n  affected_ue_count=312  avg_session_drops=4.2/UE\n  trigger=HST300km velocity=312km/h",
    "# SON Mobility Analyser — Root Cause\nanalyse HoFailure cells=CELL-3,CELL-4\n  TTT=80ms  A3_offset=2dB  cell_overlap=90ms\n  verdict=TTT_TOO_LONG boundary_unstable=true\n  recommendation='reduce TTT to 40ms, HO offset +3dB'",
    "# Nokia SON Manager — TTT Adjustment\nset MobilityParams cellId=CELL-3\n  TimeToTrigger=40ms  HoA3Offset=5dB\nset MobilityParams cellId=CELL-4\n  TimeToTrigger=40ms  HoA3Offset=5dB\napply → pending cell restart: no",
    "# Doppler Compensation — HST Mode\nset HstCompensation enabled=true\n  MaxVelocity=350km/h  DopplerShift=972Hz\n  FreqCorrAlgorithm=extended-kalman\n  PDSCH_ReferenceSignalPower=auto",
    "# HO Performance Verification\nget HoMetrics cells=CELL-3,CELL-4 window=15min\n→ HO success: 72.3% → 99.6% ✅\n→ Ping-pong: 73% → 2.1% ✅\n→ Session drops: 4.2 → 0.1/UE ✅\n→ Boundary stable: 210ms window ✅",
    "# HO Optimisation Report\ngenerate HoReport format=pdf\n  cells=CELL-3,CELL-4  period=2h\n  before: HO_success=72.3% drops=4.2/UE\n  after:  HO_success=99.6% drops=0.1/UE\n  status=CLOSED  ticket=INC-2031847",
  ],
  "self-heal": [
    "# Nokia SON — Cell Failure Alarm\n[ALARM] CellOutage severity=CRITICAL site=SITE-B\n  cause=HardwareFault component=BBU-3\n  affected_cells=3  affected_ues=1240\n  coverage_loss=31%  ticket=INC-9182736",
    "# SON Fault Correlation\ncorrelate AlarmEvents site=SITE-B\n  root_cause=BBU_POWER_FAULT\n  mdt_data=collected  neighbors=SITE-A,SITE-C,SITE-D,SITE-E\n  recommend=CCO_EXPAND priority=P1",
    "# Ericsson SON — CCO Expansion\nset CellExpansion sites=SITE-A,SITE-C,SITE-D,SITE-E\n  SITE-A: TxPower +3dB Tilt=-2° AntAzimuth=+10°\n  SITE-C: TxPower +2dB Tilt=-1°\n  SITE-D: TxPower +2dB\n  SITE-E: TxPower +1dB\napply → neighbor cells expanding coverage",
    "# Core Network — UE Reroute\nreroute UeSessions source=SITE-B\n  SITE-A: +186 UEs (load 54%→81%)\n  SITE-C: +98 UEs (load 51%→74%)\n  SITE-D: +62 UEs (load 48%→68%)\n  reroute_time=8.3s total_rerouted=420",
    "# Coverage Recovery Validation\nget CoverageMap zone=NW-SECTOR\n→ Coverage: 69%→94% ✅ (target 90%)\n→ UEs restored: 820/1240 (66%)\n→ Remaining on degraded: 420 at reduced QoE\n→ Heal elapsed: 38.5s ✅",
    "# SITE-B Hardware Recovery\nreplace BBU unit=BBU-3 site=SITE-B\n  swap_time=22min  cell_restart=auto\nset CellExpansion sites=SITE-A,SITE-C,SITE-D,SITE-E REVERT=true\n→ SITE-B restored: 3 cells active ✅\n→ Neighbors reverted to baseline",
  ],
  "dss": [
    "# Ericsson RAN — DSS Baseline Config\nset DssEnabled=false\nset LteCarrier B3 PRBs=100 NRshare=0\nset MbsfnSubframes pattern=0b00000000\n→ LTE: 100 PRBs  NR: 0 PRBs  Status: LTE-only",
    "# DSS NR Activation\nset DssEnabled=true NrBand=B3 NrScs=15kHz\nset NrPrbAllocation initial=15\nset CrsIcEnabled=true\nset MbsfnSubframeConfig sf2,sf3,sf4 NrMuting=true\n→ NR UEs: 12 attached ✅",
    "# Traffic Manager — NR Demand Ramp\nmonitor NrTraffic cell=B3-DSS\n  NR_UEs: 12→48  NR_demand=140Mbps\n  LTE_demand=85Mbps (stable)\n  trigger=DYNAMIC_REBALANCE threshold=60%",
    "# DSS Scheduler — PRB Rebalance\nset NrPrbAllocation value=55\nset LtePrbAllocation value=45\nset CrsPuncturing avoidPrbs=4 pattern=auto\nset NrMutingPattern scs=7.5kHz\n→ LTE_SINR_impact: -1.2dB (pre CRS-IC)",
    "# CRS Interference Canceller\nset CrsIcEnabled=true Mode=full\n  ic_gain=+1.4dB  restored_SINR_delta=+1.4dB\nvalidate LteSinr threshold=-0.2dB\nvalidate NrModulation scheme=256QAM ✅\n→ LTE SINR within 0.2dB of baseline ✅",
    "# DSS Coexistence Validation\nget DssReport carrier=B3\n→ NR: 142 Mbps ✅  LTE: 87 Mbps ✅\n→ SpectralEff: 3.8→5.2 b/s/Hz (+38%) ✅\n→ CRS-IC: active  SINR_impact: <0.2dB ✅\n→ Status: COEXISTENCE_CONFIRMED ✅",
  ],
  "prop-model": [
    "# GIS Engine — DTM Import\nimport DTM file=terrain_5m.asc resolution=5m\n  grid=18x13  datum=WGS84  ellipsoid=GRS80\nimport Clutter file=clutter_2024.shp\n  classes=[open,suburban,dense_urban,building]\n  ridge_height=8m above_datum",
    "# Path Loss Engine — Okumura-Hata\nrun PathLoss model=Okumura-Hata freq=3500MHz\n  transmitters=3  grid_points=234\n  building_loss=10dB  ridge_loss=6dB\n  eta=3.6 sigma=8.2\n→ Computation: 234 pixels × 3 TX = 702 calculations",
    "# Signal Mapper — RSRP Heatmap\ngenerate RsrpMap\n  range=[-62, -108] dBm  colormap=green_red\n  coverage_threshold=-90dBm\n→ Coverage: 81.4%  Edge: -97dBm avg\n→ Holes flagged: 3 pixels below -105dBm",
    "# Best Server Engine\ncompute BestServerPlot\n  Cell-1: 38% dominance\n  Cell-2: 34% dominance\n  Cell-3: 28% dominance\n→ Boundary_overlap: 7 pixels\n→ Handover_risk_zones: 7 flagged",
    "# Interference Analyser — C/I Layer\ncompute CIlayer threshold=5dB\n→ C/I < 5dB pixels: 14 (6%)\n→ Worst: Cell-1/Cell-2 boundary CI=1.8dB\n  location: Grid[8,5]\n  recommendation: 'A3 offset +1dB at boundary'",
    "# GIS Renderer — Vector Overlay\noverlayVector streets=street_grid_2024.shp\noverlayVector buildings=footprints_2024.shp\n→ Shadow zones identified: 2 buildings\n→ Coverage hole: Main/4th intersection -103dBm\nexport Map format=PNG dest=NOC-Portal ✅",
  ],
  "oran-ric": [
    "# O-Cloud — Near-RT RIC Deploy\nkubectl apply -f nearrt-ric-platform.yaml\n  namespace: ric-plt\n  pods: e2term, a1mediator, appmgr, rtmgr, dbass\nkubectl rollout status deployment/e2term\n→ RIC platform: RUNNING (3-node cluster) ✅",
    "# E2 Interface Setup — 3 gNBs\n[E2AP v2.0] gNB-1 Ericsson AIR-6449\n  E2SetupRequest → RIC ACK → ✅\n[E2AP v2.0] gNB-2 Nokia AirScale\n  E2SetupRequest → RIC ACK → ✅\n[E2AP v1.01] gNB-3 Samsung\n  E2SetupRequest → RIC ACK → ✅\nsubscribe E2SM-KPM v2.0 all_gnbs",
    "# O1 Telemetry — VES/PM Collection\nconfigure O1Collector endpoint=SMO\n  pm_interval=15min  ves_events=true\n  kpis=[SINR,PRButil,HO_rate,active_UEs]\n→ PM files received: 3 gNBs ✅\n→ Latency: 890ms avg  DB: influxDB ✅",
    "# xApp Manager — MLB xApp Deploy\nonboard xApp descriptor=mlb-xapp-v1.4.json\n  E2SM-RC v1.0 subscription: ✅\n  trigger: PRB_util>75% for >3min\n  inference: ONNX Runtime latency=8ms\n→ A1 policy received from Non-RT RIC ✅",
    "# E2 CONTROL — MLB Action\nxapp_decision cell=NW-047\n  trigger: PRB_util=81% duration=4.2min\n  action: MLB_CIO_offset +2dB sector=SITE-A-2\nE2AP CONTROL → Nokia AirScale\n  applied: CIO=+2dB  round_trip=22ms ✅",
    "# RIC Closed-Loop Validation\nget RicAuditLog\n→ NW-047 PRB: 81%→62% ✅\n→ MLB actions/hr: 47 automated ✅\n→ Multi-vendor: Ericsson+Nokia+Samsung ✅\n→ Vendor lock-in: eliminated ✅",
  ],
  "green-ran": [
    "# Energy Audit — 4 Sites × 3 Sectors\nget EnergyReport sites=SITE-A,B,C,D\n  avg_load=18%  low_traffic_window=02:00-05:00\n  power_per_site=18kW  annual_CO2=163.2t\n→ Savings potential: identified ✅",
    "# 3GPP Rel-17 Energy Saving Config\nset EnergySaving policy=rel17\n  CellDTX=enabled SymbolShutdown=6/14\n  CarrierSleep=n78  WakeupCarrier=B3\n  WUS_periodicity=20ms\n→ Policy: configured (not yet active)",
    "# Low-Traffic Window Schedule\nset EsSchedule sites=SITE-A,B,C,D\n  window_start=01:30  window_end=05:30\n  WUS=enabled  wus_periodicity=20ms\n  pre_wakeup_margin=500ms\n→ Schedule: armed ✅",
    "# Energy Saving Activation\nactivate EnergySaving sites=SITE-A,B,C,D\n  n78 carrier: SHUTDOWN (4 cells)\n  B3 DTX: ON  symbol_blanking=6/14\n  actual_power=12.4kW/site (-31%) ✅\n→ Active: 01:30:02 UTC",
    "# Coverage Monitor — QoE Impact\nget CoverageImpact window=ES_active\n  WUS_latency=18ms ✅ (target <25ms)\n  RSRP_edge: -2dB (acceptable)\n  QoE: 88→85 pts (-3, within SLA)\n→ No SLA breach ✅",
    "# Energy Saving Report\nget EnergySavingReport\n→ Power: 18kW→12.4kW (-31%) ✅\n→ CO2/month: 13.6t→9.4t (-4.2t) ✅\n→ Cost/month: $8400→$5800 (-$2600) ✅\n→ QoE maintained: 85/100 ✅",
  ],
  "private-5g": [
    "# PLMN Isolation — Private 5G SA\nset PLMN mcc=001 mnc=01 type=private\nset SliceId SST=1 SD=CAMPUS-01\nconfigure NonPublicNetwork mode=SNPN\n  gNB_ids=[CAMPUS-gNB-1,2,3]  UPF=on-prem\n→ PLMN isolated: 001-01 ✅",
    "# CBRS SAS Registration\nregister SasClient provider=Google-SAS\n  CBSD_id=CAMPUS-CBSD-001\n  band=CBRS-3.5GHz  max_eirp=47dBm/10MHz\n  grant_request submitted\n→ SAS Grant: approved EIRP=47dBm ✅",
    "# On-Prem UPF Deployment\ndeploy UPF image=free5gc-upf:v3.2\n  interface=N3 gNB-uplink  N6=campus-LAN\n  latency_local=0.9ms  throughput=10Gbps\nset DataPath mode=local_breakout\n→ UPF: RUNNING latency=0.9ms ✅",
    "# AGV URLLC Slice Config\nconfigure Slice SST=2 SD=AGV-CTRL\n  maxLatency=1ms  reliability=99.9999%\n  PRBs_reserved=25%  preemption=enabled\nset AGV_fleet size=24 protocol=PROFINET-RT\n→ AGV URLLC slice: active ✅",
    "# N26 Roaming — Public 5G\nconfigure N26Interface amf=CAMPUS-AMF\n  roaming_partner=NorthStar-5G\n  interworking=EPS_fallback\n  UE_mobility=seamless\n→ N26 roaming: established ✅",
    "# Private 5G Validation\nget CampusNetworkReport\n→ AGV latency: 0.9ms ✅ (target 1ms)\n→ PLMN isolation: SNPN ✅\n→ SAS CBRS: granted ✅\n→ N26 roaming: active ✅\n→ UEs connected: 142 (24 AGV + 118 worker) ✅",
  ],
  "leo-interference": [
    "# Spectrum Monitor — C-Band Interference\n[ALERT] InterferenceDetected band=C-Band\n  freq=3700-3980MHz  RSSI=-62dBm (anomaly)\n  satellite=STARLINK-1547  elevation=22°\n  affected_cells=NW-047,NW-052  SINR_drop=-11dB",
    "# Interference Analyser — Geometry\ncompute InterferencePaths satellite=STARLINK-1547\n  overpass_az=214°  elevation_sweep=8°-38°\n  freq_doppler=972Hz  PFD=-127dBW/m²\n  C/I_ratio: -4.2dB → 18.7dB post-hop ✅",
    "# ITU Protection Margin\nquery ITU_R S.1432\n  coordination_distance=200km\n  pfd_limit=-127dBW/m²Hz (GSO arc)\n  measured_pfd=-128.4dBW/m² ✅ (within limit)\n→ No ITU violation, local mitigation required",
    "# Freq Hop — Clear Channel\nconfigure FreqHop cells=NW-047,NW-052\n  hop_to=3620MHz  hop_bw=80MHz\n  trigger=interference_SINR<12dB\n  revert_trigger=sat_elevation<5°\n→ Hop applied: SINR 7.2dB→18.7dB ✅",
    "# SAS Dynamic Exclusion Zone\nupdate SasExclusionZone\n  satellite_track=STARLINK-1547\n  exclusion_freq=3700-3980MHz\n  exclusion_coords=dynamic  expiry=overpass+10min\n→ SAS exclusion: registered ✅",
    "# LEO Interference Validation\nget SpectrumReport window=overpass\n→ Pre-hop SINR: 7.2dB ❌  Post-hop: 18.7dB ✅\n→ Freq hop latency: 380ms ✅\n→ ITU compliance: maintained ✅\n→ SAS filing: updated ✅",
  ],
};

const SCENARIO_VENDOR = {
  "mimo-3d":         "Ericsson AirScale",
  "slicing-sla":     "Nokia MCP",
  "ai-ran":          "Ericsson RIC",
  "edge-trombone":   "3GPP UPF Engine",
  "indoor-pos":      "NR Pos Engine",
  "ray-tracing":     "Wireless InSite",
  "ho-storm":        "Ericsson ENM",
  "self-heal":       "Nokia SON",
  "dss":             "Ericsson RAN",
  "prop-model":      "Planet EV / GIS",
  "oran-ric":        "O-RAN SC RIC",
  "green-ran":       "Nokia MCP / ENM",
  "private-5g":      "Cisco CNF",
  "leo-interference":"ITU / SAS Engine",
};

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

  // Polar plot helpers
  const cx = 50, cy = 50;
  const toXY = (angleDeg, r) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  // Main lobe teardrop — narrows as progress increases
  const mainR = 42;
  const mainW = 18 - progress * 12;
  const mainLobeD = `M ${cx} ${cy} C ${cx - mainW} ${cy - mainR * 0.5} ${cx - mainW * 0.5} ${cy - mainR} ${cx} ${cy - mainR} C ${cx + mainW * 0.5} ${cy - mainR} ${cx + mainW} ${cy - mainR * 0.5} ${cx} ${cy} Z`;
  // Sidelobe teardrop builder
  const sidelobe = (angleDeg, amp) => {
    const [tipX, tipY] = toXY(angleDeg, amp);
    const perpRad = (angleDeg - 90 + 90) * Math.PI / 180;
    const wOff = amp * 0.25;
    const [lx, ly] = [cx + wOff * Math.cos(perpRad), cy + wOff * Math.sin(perpRad)];
    const [rx, ry] = [cx - wOff * Math.cos(perpRad), cy - wOff * Math.sin(perpRad)];
    return `M ${cx} ${cy} C ${lx} ${ly} ${tipX} ${tipY - wOff * 0.5} ${tipX} ${tipY} C ${tipX} ${tipY + wOff * 0.5} ${rx} ${ry} ${cx} ${cy} Z`;
  };
  const nullPolar = progress > 0.5;
  const [nxP, nyP] = toXY(145, 44);

  return (
    <div style={{ display: "flex", gap: 4, width: "100%", height: "100%" }}>
      {/* Left: elevation view */}
      <svg viewBox="0 0 100 160" style={{ width: "50%", height: "100%", display: "block" }}>
        <line x1="50" y1="155" x2="50" y2="10" stroke="#1e3a5f" strokeWidth="0.5" />
        <line x1="5" y1="155" x2="95" y2="155" stroke="#1e3a5f" strokeWidth="0.5" />
        {[-60,-30,30,60].map(a => (
          <line key={a} x1="50" y1="155" x2={50 + 45*Math.sin(a*Math.PI/180)} y2={155-45*Math.cos(a*Math.PI/180)} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,3" />
        ))}
        <path
          d={`M 50 155 L ${50-beamWidth*0.5} ${155-110} Q 50 ${155-140} ${50+beamWidth*0.5} ${155-110} Z`}
          fill={`${color}33`} stroke={color} strokeWidth="1.5"
          style={{ transition: "all 0.5s" }}
        />
        {progress > 0.5 && (
          <line x1="50" y1="155" x2={50 + 32*Math.cos((nullAngle*Math.PI/180))} y2={155 - 32*Math.sin((nullAngle*Math.PI/180))}
            stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
        )}
        {progress > 0.5 && (
          <>
            <circle cx={50 + 32*Math.cos((nullAngle*Math.PI/180))} cy={155 - 32*Math.sin((nullAngle*Math.PI/180))} r="5" fill="#ef444411" stroke="#ef4444" strokeWidth="1" />
            <text x={50 + 32*Math.cos((nullAngle*Math.PI/180)) + 6} y={155 - 32*Math.sin((nullAngle*Math.PI/180)) + 3} fill="#ef4444" fontSize="6">NULL</text>
          </>
        )}
        <text x="50" y="22" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">{gain} dBi</text>
        <text x="50" y="32" textAnchor="middle" fill="#64748b" fontSize="6">Rank-{layers}</text>
        <rect x="4" y="135" width="44" height="18" rx="3" fill="#0a1628" stroke="#1e3a5f" strokeWidth="0.5" />
        <text x="26" y="143" textAnchor="middle" fill="#64748b" fontSize="6">SITE-A</text>
        <text x="26" y="151" textAnchor="middle" fill="#e2e8f0" fontSize="7">64T64R</text>
      </svg>

      {/* Right: polar plot */}
      <svg viewBox="0 0 100 160" style={{ width: "50%", height: "100%", display: "block" }}>
        <text x="50" y="10" textAnchor="middle" fill="#64748b" fontSize="6">Azimuth Pattern</text>
        {/* Reference rings */}
        {[20,35,50].map(r => (
          <circle key={r} cx={cx} cy={cy+15} r={r} fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
        ))}
        {/* Labels */}
        <text x={cx} y={cy+15-52} textAnchor="middle" fill="#64748b" fontSize="6">0°</text>
        <text x={cx+53} y={cy+15+3} textAnchor="start" fill="#64748b" fontSize="6">90°</text>
        <text x={cx} y={cy+15+58} textAnchor="middle" fill="#64748b" fontSize="6">180°</text>
        <text x={cx-53} y={cy+15+3} textAnchor="end" fill="#64748b" fontSize="6">270°</text>
        {/* Main beam lobe */}
        <path d={`M ${cx} ${cy+15} C ${cx - mainW} ${(cy+15) - mainR * 0.5} ${cx - mainW * 0.5} ${(cy+15) - mainR} ${cx} ${(cy+15) - mainR} C ${cx + mainW * 0.5} ${(cy+15) - mainR} ${cx + mainW} ${(cy+15) - mainR * 0.5} ${cx} ${cy+15} Z`}
          fill={`${color}33`} stroke={color} strokeWidth="1" style={{ transition: "all 0.5s" }} />
        {/* Sidelobes at ±60°, ±120° */}
        {[60,-60,120,-120].map((ang, i) => {
          const amp = 14;
          const rad = (ang - 90) * Math.PI / 180;
          const tipX = cx + amp * Math.cos(rad);
          const tipY = (cy+15) + amp * Math.sin(rad);
          const perpRad = rad + Math.PI/2;
          const wOff = amp * 0.3;
          return (
            <path key={i} d={`M ${cx} ${cy+15} C ${cx+wOff*Math.cos(perpRad)} ${(cy+15)+wOff*Math.sin(perpRad)} ${tipX} ${tipY-wOff*0.5} ${tipX} ${tipY} C ${tipX} ${tipY+wOff*0.5} ${cx-wOff*Math.cos(perpRad)} ${(cy+15)-wOff*Math.sin(perpRad)} ${cx} ${cy+15} Z`}
              fill={`${color}18`} stroke={color} strokeWidth="0.5" />
          );
        })}
        {/* Null at 145° */}
        {nullPolar && (() => {
          const rad = (145 - 90) * Math.PI / 180;
          const nx = cx + 44 * Math.cos(rad);
          const ny = (cy+15) + 44 * Math.sin(rad);
          return (
            <>
              <line x1={cx} y1={cy+15} x2={nx} y2={ny} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.8" />
              <text x={nx} y={ny-1} textAnchor="middle" fill="#ef4444" fontSize="5">×</text>
              <text x={nx+8} y={ny+3} fill="#ef4444" fontSize="7">-28dB</text>
            </>
          );
        })()}
        {/* Gain label */}
        <text x={cx} y={cy+15+3} textAnchor="middle" fill={color} fontSize="7" fontWeight="bold">{gain} dBi</text>
        {/* Crosshairs */}
        <line x1={cx} y1={cy+15-51} x2={cx} y2={cy+15+51} stroke="#1e3a5f" strokeWidth="0.4" />
        <line x1={cx-51} y1={cy+15} x2={cx+51} y2={cy+15} stroke="#1e3a5f" strokeWidth="0.4" />
        <text x="50" y="130" textAnchor="middle" fill="#64748b" fontSize="6">{layers}×{layers} MIMO | BW {(55-progress*30).toFixed(0)}°</text>
      </svg>
    </div>
  );
}

function SlicingViz({ progress, stepIndex }) {
  const breach = stepIndex >= 2;
  const scaled = stepIndex >= 3;
  const recovered = stepIndex >= 4;
  const urllcPRB = scaled ? 38 : 15;
  const embbPRB  = scaled ? 42 : 60;
  const mmtcPRB  = 15;

  const slices = [
    { label: "eMBB",  pct: embbPRB,  color: "#3b82f6" },
    { label: "URLLC", pct: urllcPRB, color: "#a855f7", alert: breach && !scaled },
    { label: "mMTC",  pct: mmtcPRB,  color: "#22c55e" },
  ];

  // Build latency polyline for URLLC breach chart
  // viewBox 0 0 200 60, x=0..190 for time 0..10s, y: 0dBm at y=55, 4ms at y=5
  const msToY = (ms) => 55 - (ms / 4) * 50;
  const tToX = (t) => 10 + t * 18; // 0..10 -> 10..190

  const segments = [];
  // pre-breach: steps 0-1 flat at 0.82ms
  if (stepIndex >= 0) segments.push({ pts: [[0,0.82],[1,0.82]], color: "#3b82f6" });
  // breach ramp: step 2
  if (stepIndex >= 2) segments.push({ pts: [[1,0.82],[2,3.1]], color: "#ef4444" });
  if (stepIndex >= 2) segments.push({ pts: [[2,3.1],[3,3.1]], color: "#ef4444", breach: true });
  // recovery: step 4
  if (stepIndex >= 4) segments.push({ pts: [[3,3.1],[4,0.84]], color: "#22c55e" });
  if (stepIndex >= 4) segments.push({ pts: [[4,0.84],[10,0.84]], color: "#22c55e" });

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* PRB bars */}
      <svg viewBox="0 0 200 80" style={{ width: "100%", flex: "0 0 auto", display: "block" }}>
        <text x="100" y="11" textAnchor="middle" fill="#64748b" fontSize="8">PRB ALLOCATION</text>
        {slices.map((sl, i) => {
          const y = 18 + i * 20;
          const barW = sl.pct * 1.6;
          return (
            <g key={sl.label}>
              <text x="10" y={y + 9} fill={sl.color} fontSize="8" fontWeight="bold">{sl.label}</text>
              <rect x="42" y={y} width="130" height="10" rx="2" fill="#0a1628" stroke="#1e3a5f" strokeWidth="0.5" />
              <rect x="42" y={y} width={barW * 0.8} height="10" rx="2" fill={`${sl.color}55`} stroke={sl.color} strokeWidth="1"
                style={{ transition: "width 0.6s" }} />
              {sl.alert && <text x={42 + barW*0.8 + 3} y={y+8} fill="#ef4444" fontSize="7">⚠️</text>}
              <text x="175" y={y + 8} fill="#94a3b8" fontSize="7">{sl.pct}%</text>
            </g>
          );
        })}
      </svg>

      {/* Latency breach chart */}
      <svg viewBox="0 0 200 60" style={{ width: "100%", flex: "1 1 auto", display: "block" }}>
        <rect x="0" y="0" width="200" height="60" fill="#070e1c" />
        <text x="100" y="8" textAnchor="middle" fill="#64748b" fontSize="7">URLLC Latency (ms)</text>
        {/* Grid lines */}
        {[20,40].map(y => (
          <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="#1e3a5f" strokeWidth="0.4" />
        ))}
        {/* Axes */}
        <line x1="10" y1="55" x2="190" y2="55" stroke="#334155" strokeWidth="0.6" />
        <line x1="10" y1="10" x2="10" y2="55" stroke="#334155" strokeWidth="0.6" />
        {/* Y labels */}
        <text x="8" y={msToY(4)+3} textAnchor="end" fill="#64748b" fontSize="5">4ms</text>
        <text x="8" y={msToY(2)+3} textAnchor="end" fill="#64748b" fontSize="5">2ms</text>
        <text x="8" y={msToY(0)+3} textAnchor="end" fill="#64748b" fontSize="5">0</text>
        {/* 1ms SLA threshold */}
        <line x1="10" y1={msToY(1)} x2="185" y2={msToY(1)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3,3" />
        <text x="187" y={msToY(1)+3} fill="#ef4444" fontSize="6" textAnchor="start">1ms SLA</text>
        {/* Polyline segments */}
        {segments.map((seg, si) => (
          <polyline key={si}
            points={seg.pts.map(([t,ms]) => `${tToX(t)},${msToY(ms)}`).join(" ")}
            fill="none" stroke={seg.color} strokeWidth="1.5" />
        ))}
        {/* Breach marker */}
        {stepIndex >= 2 && stepIndex < 4 && (
          <>
            <circle cx={tToX(3)} cy={msToY(3.1)} r="3" fill="#ef4444" opacity="0.9">
              <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <text x={tToX(3)+4} y={msToY(3.1)-2} fill="#ef4444" fontSize="6">⚠️ 3.1ms</text>
          </>
        )}
        {/* Recovered marker */}
        {stepIndex >= 4 && (
          <>
            <circle cx={tToX(10)} cy={msToY(0.84)} r="3" fill="#22c55e" />
            <text x={tToX(7)} y={msToY(0.84)-3} fill="#22c55e" fontSize="6">✅ 0.84ms</text>
          </>
        )}
      </svg>

      {/* Cost-per-Mbps row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "2px 4px" }}>
        <span style={{ color: "#3b82f6", fontSize: 9 }}>eMBB: <span style={{ color: "#e2e8f0" }}>$0.42/Mbps</span></span>
        <span style={{ color: "#64748b", fontSize: 9 }}>|</span>
        <span style={{ color: "#a855f7", fontSize: 9 }}>URLLC: <span style={{ color: "#e2e8f0" }}>$1.87/Mbps</span></span>
        <span style={{ color: "#64748b", fontSize: 9 }}>|</span>
        <span style={{ color: "#22c55e", fontSize: 9 }}>mMTC: <span style={{ color: "#e2e8f0" }}>$0.08/dev</span></span>
      </div>
    </div>
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

  // Confusion matrix data (3x3): rows=Tilt,Az,Pwr; cols=correct,under,over
  const cmData = [
    [94, 2, 1],
    [3,  91, 2],
    [4,  1,  88],
  ];
  const cmLabels = ["Tilt","Az","Pwr"];
  const cmCellColor = (r, c) => r === c ? "#22c55e" : (Math.abs(r-c)===1 ? "#f97316" : "#ef4444");

  // Feature importance
  const features = [
    { name: "Neighbor SINR", pct: 94 },
    { name: "PRB util",      pct: 87 },
    { name: "HO rate",       pct: 71 },
    { name: "QoE score",     pct: 68 },
    { name: "Time-of-day",   pct: 52 },
    { name: "Weather",       pct: 19 },
  ];

  const showCM = progress > 0.6;
  const showFI = progress > 0.8;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* Loss curve */}
      <svg viewBox="0 0 200 100" style={{ width: "100%", flex: "1 1 auto", display: "block" }}>
        <text x="100" y="10" textAnchor="middle" fill="#64748b" fontSize="7">TRAINING LOSS (GNN — 200 epochs)</text>
        <line x1="20" y1="15" x2="20" y2="90" stroke="#1e3a5f" strokeWidth="1" />
        <line x1="20" y1="90" x2="185" y2="90" stroke="#1e3a5f" strokeWidth="1" />
        {[0.31, 0.20, 0.10, 0.05].map(v => {
          const y = 90 - v * 238;
          return (
            <g key={v}>
              <line x1="18" y1={y} x2="185" y2={y} stroke="#1e3a5f" strokeWidth="0.3" strokeDasharray="2,4" />
              <text x="15" y={y + 3} textAnchor="end" fill="#64748b" fontSize="5">{v.toFixed(2)}</text>
            </g>
          );
        })}
        {pathD && <path d={pathD.replace(/140 - /g, "90 - ")} fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinejoin="round" />}
        {/* Recompute pathD inline for 100-height viewBox */}
        {(() => {
          const yS = (l) => 90 - l * 238;
          const d = lossPoints.filter(p=>p.shown).map((p,i)=>`${i===0?"M":"L"} ${xScale(p.t).toFixed(1)} ${yS(p.loss).toFixed(1)}`).join(" ");
          return d ? <path d={d} fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinejoin="round" /> : null;
        })()}
        <text x="100" y="99" textAnchor="middle" fill="#94a3b8" fontSize="7">
          Loss: {currentLoss} | {Math.round(progress * 200)} / 200 epochs
        </text>
      </svg>

      {/* Bottom row: confusion matrix + feature importance */}
      <div style={{ display: "flex", gap: 4, width: "100%", flex: "0 0 auto", opacity: showCM ? 1 : 0, transition: "opacity 0.5s" }}>
        {/* Confusion matrix */}
        <svg viewBox="0 0 80 80" style={{ width: "40%", display: "block" }}>
          <text x="40" y="8" textAnchor="middle" fill="#64748b" fontSize="6">Confusion (test set)</text>
          {/* Col headers */}
          {cmLabels.map((l,c) => (
            <text key={c} x={16 + c*20 + 10} y="16" textAnchor="middle" fill="#64748b" fontSize="5">{l}</text>
          ))}
          {cmData.map((row, r) => (
            <g key={r}>
              {/* Row label */}
              <text x="12" y={22 + r*18 + 9} textAnchor="end" fill="#64748b" fontSize="5">{cmLabels[r]}</text>
              {row.map((val, c) => (
                <g key={c}>
                  <rect x={16 + c*20} y={18 + r*18} width="19" height="16" rx="1"
                    fill={`${cmCellColor(r,c)}33`} stroke={cmCellColor(r,c)} strokeWidth="0.5" />
                  <text x={16 + c*20 + 9.5} y={18 + r*18 + 10} textAnchor="middle" fill={cmCellColor(r,c)} fontSize="6" fontWeight={r===c?"bold":"normal"}>{val}</text>
                </g>
              ))}
            </g>
          ))}
        </svg>

        {/* Feature importance */}
        <svg viewBox="0 0 120 70" style={{ width: "60%", display: "block", opacity: showFI ? 1 : 0, transition: "opacity 0.5s" }}>
          <text x="60" y="8" textAnchor="middle" fill="#64748b" fontSize="6">Feature Importance</text>
          {features.map((f, i) => (
            <g key={i}>
              <text x="2" y={15 + i*9 + 6} fill="#94a3b8" fontSize="5">{f.name}</text>
              <rect x="48" y={15 + i*9} width="60" height="7" rx="1" fill="#0a1628" />
              <rect x="48" y={15 + i*9} width={60 * f.pct / 100} height="7" rx="1" fill="#f59e0b88" stroke="#f59e0b" strokeWidth="0.5"
                style={{ transition: "width 0.5s" }} />
              <text x="110" y={15 + i*9 + 6} fill="#f59e0b" fontSize="5">{f.pct}%</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
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
  const cepM = (5 - progress * 4.72).toFixed(2);
  const showBadge = progress > 0.8;

  // CEP comparison bar: total width 150 from x=25 to x=175
  const nrWidth = Math.round(progress * 150);
  const rfidWidth = 150 - nrWidth;

  return (
    <svg viewBox="0 0 200 175" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Factory floor */}
      <rect x="15" y="10" width="170" height="140" rx="4" fill="#0a1628" stroke="#1e3a5f" strokeWidth="1" />
      <text x="100" y="8" textAnchor="middle" fill="#64748b" fontSize="7">FACTORY FLOOR — 12,000 m²</text>

      {/* Anchors */}
      {anchors.map(([x, y], i) => (
        <g key={i}>
          {stepIndex >= 2 && <circle cx={x} cy={y} r="30" fill="none" stroke={`${color}22`} strokeWidth="0.5" strokeDasharray="2,3" />}
          <rect x={x-5} y={y-5} width="10" height="10" rx="2" fill={`${color}44`} stroke={color} strokeWidth="1" />
          <text x={x} y={y+16} textAnchor="middle" fill={color} fontSize="6">A{i+1}</text>
        </g>
      ))}

      {/* Assets with uncertainty rings */}
      {stepIndex >= 3 && assets.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={uncertainty} fill="#60a5fa18" stroke="#60a5fa44" strokeWidth="0.5" />
          <circle cx={x} cy={y} r="3" fill="#60a5fa" />
          {/* CEP radius text on largest asset circle */}
          {i === 0 && (
            <text x={x} y={y - uncertainty - 3} textAnchor="middle" fill="#94a3b8" fontSize="6">
              CEP: {cepM}m
            </text>
          )}
        </g>
      ))}

      {/* 3GPP class badge */}
      {showBadge && (
        <g>
          <rect x="128" y="12" width="54" height="13" rx="3" fill="#22c55e22" stroke="#22c55e" strokeWidth="0.8" />
          <text x="155" y="21" textAnchor="middle" fill="#22c55e" fontSize="6" fontWeight="bold">3GPP Class C ✅</text>
        </g>
      )}

      {/* CEP comparison bar */}
      <text x="100" y="158" textAnchor="middle" fill="#64748b" fontSize="7">Positioning Accuracy</text>
      {/* RFID segment (shrinks) */}
      {rfidWidth > 0 && (
        <rect x="25" y="162" width={rfidWidth} height="8" rx="2" fill="#47556988" stroke="#475569" strokeWidth="0.5"
          style={{ transition: "width 0.6s" }} />
      )}
      {/* NR segment (grows) */}
      {nrWidth > 0 && (
        <rect x={25 + rfidWidth} y="162" width={nrWidth} height="8" rx="2" fill={`${color}88`} stroke={color} strokeWidth="0.5"
          style={{ transition: "width 0.6s" }} />
      )}
      <text x="25" y="161" fill="#64748b" fontSize="5">RFID 3–5m</text>
      <text x="175" y="161" textAnchor="end" fill={color} fontSize="5">NR 0.28m</text>

      <text x="100" y="175" textAnchor="middle" fill="#94a3b8" fontSize="7">
        {stepIndex >= 4 ? `CEP50: 0.31m ✅ | ${assets.length} assets tracked` : stepIndex >= 3 ? "Computing positions..." : stepIndex >= 1 ? "PRS configured — sweeping" : "Deploying anchors"}
      </text>
    </svg>
  );
}

function RayTracingViz({ progress, stepIndex, color }) {
  const rays = stepIndex >= 1;
  const sinrMap = stepIndex >= 3;
  const showPDP = stepIndex >= 2;
  const sites = [[30, 150], [100, 10], [170, 150]];
  const angles = [30, 60, 90, 120, 150];

  // Power delay profile impulses: [delay_ns, power_dBm_rel]
  const impulses = [
    { tau: 0,   pRel: 0,   opacity: 1.0 },
    { tau: 18,  pRel: -6,  opacity: 0.70 },
    { tau: 48,  pRel: -11, opacity: 0.50 },
    { tau: 97,  pRel: -16, opacity: 0.35 },
    { tau: 183, pRel: -22, opacity: 0.20 },
    { tau: 312, pRel: -28, opacity: 0.12 },
  ];
  // PDP chart coords: x: 0..350ns -> 15..185, y: 0..-30dBm -> 52..12
  const pdpX = (tau) => 15 + (tau / 350) * 170;
  const pdpY = (pRel) => 52 + (pRel / -30) * 40;   // 0dBm->52, -30dBm->12

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* Main ray-tracing SVG */}
      <svg viewBox="0 0 200 120" style={{ width: "100%", flex: "1 1 auto", display: "block" }}>
        {sinrMap && (
          <>
            <circle cx="100" cy="60" r="55" fill="#22c55e08" stroke="#22c55e" strokeWidth="0.3" opacity="0.6" />
            <circle cx="100" cy="60" r="38" fill="#fbbf2408" stroke="#fbbf24" strokeWidth="0.3" opacity="0.6" />
            <circle cx="100" cy="60" r="23" fill="#3b82f608" stroke="#3b82f6" strokeWidth="0.3" opacity="0.6" />
            <circle cx="100" cy="60" r="11" fill="#a855f708" stroke="#a855f7" strokeWidth="0.3" opacity="0.6" />
          </>
        )}
        {[[50,30,20,22],[80,42,15,19],[120,38,20,22],[145,30,18,19],[40,68,12,15],[160,64,15,15]].map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="#1e3a5f88" stroke="#1e3a5f" strokeWidth="0.5" />
        ))}
        {rays && sites.map(([sx, sy], si) =>
          angles.map((a, ai) => {
            const rad = (a * Math.PI) / 180;
            const ex = sx + 60 * Math.cos(rad);
            const ey = sy - 60 * Math.sin(rad);
            return (
              <line key={`${si}-${ai}`} x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={color} strokeWidth="0.4" opacity={0.25 + progress * 0.3} />
            );
          })
        )}
        {sites.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill={`${color}33`} stroke={color} strokeWidth="1.2" />
            <text x={x} y={y + 11} textAnchor="middle" fill={color} fontSize="7">TX{i+1}</text>
          </g>
        ))}
        {sinrMap && (
          <>
            <text x="190" y="38" fill="#22c55e" fontSize="5.5" textAnchor="end">SINR&gt;20dB</text>
            <text x="190" y="55" fill="#fbbf24" fontSize="5.5" textAnchor="end">10-20dB</text>
            <text x="190" y="72" fill="#3b82f6" fontSize="5.5" textAnchor="end">0-10dB</text>
          </>
        )}
        <text x="100" y="118" textAnchor="middle" fill="#94a3b8" fontSize="6">
          {stepIndex >= 5 ? "SE: 5.4 b/s/Hz avg | Coverage: 94.1%" : stepIndex >= 3 ? "SINR map: 18,400 points" : rays ? "50K rays launched | multipath clustering" : "Loading urban geometry..."}
        </text>
      </svg>

      {/* Power Delay Profile — appears at stepIndex>=2 */}
      <svg viewBox="0 0 200 60" style={{ width: "100%", flex: "0 0 auto", display: "block", opacity: showPDP ? 1 : 0, transition: "opacity 0.6s" }}>
        <rect x="0" y="0" width="200" height="60" fill="#070e1c" />
        <text x="100" y="8" textAnchor="middle" fill="#64748b" fontSize="7">📡 Power Delay Profile</text>
        <text x="100" y="15" textAnchor="middle" fill="#64748b" fontSize="6">Delay Spread: avg 48ns | max 312ns</text>
        {/* Grid */}
        {[0, 100, 200, 300].map(tau => (
          <g key={tau}>
            <line x1={pdpX(tau)} y1="18" x2={pdpX(tau)} y2="55" stroke="#1e3a5f" strokeWidth="0.4" />
            <text x={pdpX(tau)} y="59" textAnchor="middle" fill="#64748b" fontSize="4.5">{tau}ns</text>
          </g>
        ))}
        <line x1="15" y1="18" x2="15" y2="55" stroke="#334155" strokeWidth="0.6" />
        <line x1="15" y1="52" x2="185" y2="52" stroke="#334155" strokeWidth="0.6" />
        {/* Y labels */}
        <text x="13" y="24" textAnchor="end" fill="#64748b" fontSize="4.5">-30</text>
        <text x="13" y="35" textAnchor="end" fill="#64748b" fontSize="4.5">-15</text>
        <text x="13" y="53" textAnchor="end" fill="#64748b" fontSize="4.5">0</text>
        {/* Impulse lines */}
        {impulses.map((imp, idx) => (
          <g key={idx} style={{ opacity: showPDP ? imp.opacity : 0, transition: `opacity 0.4s ${idx * 0.2}s` }}>
            <line x1={pdpX(imp.tau)} y1={pdpY(imp.pRel)} x2={pdpX(imp.tau)} y2="52"
              stroke={color} strokeWidth={idx === 0 ? 2 : 1.2} />
            <circle cx={pdpX(imp.tau)} cy={pdpY(imp.pRel)} r={idx === 0 ? 2.5 : 1.8} fill={color} />
          </g>
        ))}
      </svg>
    </div>
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
  const trackY = 90;
  const isStorm  = stepIndex === 2;
  const optimized = stepIndex >= 4;
  const rawPos = (tick % 140) / 140;
  const ueX = 10 + rawPos * 180;
  const activeCellIdx = cells.findIndex((cx, i) => ueX < cx + (cells[i + 1] ? (cells[i + 1] - cx) / 2 : 40));
  const curCell = Math.max(0, activeCellIdx === -1 ? cells.length - 1 : activeCellIdx);
  const atBoundary = Math.abs(ueX - 100) < 12 || Math.abs(ueX - 116) < 12;
  const pingpong = isStorm && atBoundary && tick % 8 < 4;

  // Doppler sine wave: high frequency
  const dopplerPts = Array.from({ length: 40 }, (_, i) => {
    const x = 30 + i * 4;
    const freq = 6;
    const y = 15 + 8 * Math.sin((i / 40) * freq * Math.PI * 2 + tick * 0.3);
    return `${x},${y}`;
  }).join(" ");

  const showAfterTTT = stepIndex >= 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* Train + towers SVG */}
      <svg viewBox="0 0 200 120" width="100%" style={{ flex: "1 1 auto", background: "#060d1b", display: "block" }}>
        {/* Rail track */}
        <line x1="5" y1={trackY + 2} x2="195" y2={trackY + 2} stroke="#334155" strokeWidth="3" />
        <line x1="5" y1={trackY - 2} x2="195" y2={trackY - 2} stroke="#334155" strokeWidth="3" />
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => (
          <line key={i} x1={15 + i * 16} y1={trackY - 4} x2={15 + i * 16} y2={trackY + 4} stroke="#1e3a5f" strokeWidth="1.5" />
        ))}

        {/* Cell towers */}
        {cells.map((cx, i) => {
          const isActive = i === curCell;
          const isFailing = isStorm && (i === 2 || i === 3) && atBoundary;
          const color = isFailing ? "#ef4444" : isActive ? "#06b6d4" : "#1e3a5f";
          const coverR = optimized ? 36 : 30;
          return (
            <g key={i}>
              <ellipse cx={cx} cy={trackY} rx={coverR} ry={11}
                fill={`${color}15`} stroke={color} strokeWidth={isActive ? "1" : "0.4"} strokeDasharray={isFailing ? "3,2" : "none"} />
              <line x1={cx} y1={trackY - 15} x2={cx} y2={trackY - 30} stroke={color} strokeWidth={isActive ? 1.5 : 0.8} />
              <polygon points={`${cx - 4},${trackY - 30} ${cx + 4},${trackY - 30} ${cx},${trackY - 38}`}
                fill={color} opacity={0.9} />
              <text x={cx} y={trackY - 40} textAnchor="middle" fill={color} fontSize="5.5">C{i + 1}</text>
            </g>
          );
        })}

        {pingpong && (
          <>
            <circle cx={ueX} cy={trackY} r="16" fill="#ef444420" stroke="#ef4444" strokeWidth="1.5" />
            <text x={ueX} y={trackY - 20} textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">HO!</text>
          </>
        )}
        <rect x={ueX - 8} y={trackY - 8} width="16" height="12" rx="2"
          fill={isStorm && pingpong ? "#ef4444" : "#06b6d4"} opacity="0.95" />
        <text x={ueX} y={trackY + 1} textAnchor="middle" fill="#fff" fontSize="5.5" fontWeight="bold">UE</text>
        <text x="100" y="12" textAnchor="middle" fill="#94a3b8" fontSize="7">300 km/h Rail Corridor</text>

        <rect x="4" y="105" width="192" height="12" rx="3" fill="#0a1628" />
        {isStorm && (
          <text x="100" y="114" textAnchor="middle" fill="#ef4444" fontSize="6.5" fontWeight="bold">
            ⚠ PING-PONG STORM — HO rate: 8/4.2s | BLER: 12%
          </text>
        )}
        {optimized && (
          <text x="100" y="114" textAnchor="middle" fill="#22c55e" fontSize="6.5">
            ✅ MRO Applied — A3: 5dB | TTT: 64ms | Ping-pong: 4%
          </text>
        )}
        {!isStorm && !optimized && (
          <text x="100" y="114" textAnchor="middle" fill="#06b6d4" fontSize="6.5">
            {stepIndex < 1 ? "Corridor loaded — 6 cells configured" : "UE tracking… RSRP: -72dBm | Doppler: 972Hz"}
          </text>
        )}
      </svg>

      {/* Doppler display */}
      <svg viewBox="0 0 200 30" style={{ width: "100%", flex: "0 0 auto", display: "block" }}>
        <rect x="0" y="0" width="200" height="30" fill="#070e1c" />
        {/* Speedometer arc */}
        <path d={`M 10 25 A 14 14 0 0 1 24 11`} fill="none" stroke="#1e3a5f" strokeWidth="3" />
        <path d={`M 10 25 A 14 14 0 0 1 22 13`} fill="none" stroke="#06b6d4" strokeWidth="2" />
        <text x="17" y="29" textAnchor="middle" fill="#06b6d4" fontSize="5">300</text>
        <text x="17" y="8" textAnchor="middle" fill="#64748b" fontSize="4">km/h</text>
        {/* Doppler sine wave */}
        <polyline points={dopplerPts} fill="none" stroke="#06b6d4" strokeWidth="1.2" />
        <text x="195" y="10" textAnchor="end" fill="#06b6d4" fontSize="6">
          {optimized ? "972 Hz (stable)" : "Doppler: 972 Hz"}
        </text>
      </svg>

      {/* A3/TTT timeline */}
      <svg viewBox="0 0 200 45" style={{ width: "100%", flex: "0 0 auto", display: "block" }}>
        <rect x="0" y="0" width="200" height="45" fill="#070e1c" />
        <text x="100" y="9" textAnchor="middle" fill="#64748b" fontSize="7">A3/TTT Boundary Stability</text>
        {/* Before row */}
        {stepIndex >= 3 && (
          <g>
            <text x="4" y="20" fill="#94a3b8" fontSize="6">Before</text>
            <rect x="38" y="13" width="90" height="8" rx="2" fill="#ef444433" stroke="#ef4444" strokeWidth="0.8" />
            <text x="130" y="20" fill="#ef4444" fontSize="5.5">Overlap 90ms &lt; TTT 80ms ⚠️</text>
          </g>
        )}
        {/* After row */}
        <g style={{ opacity: showAfterTTT ? 1 : 0, transition: "opacity 0.6s" }}>
          <text x="4" y="38" fill="#94a3b8" fontSize="6">After</text>
          <rect x="38" y="31" width="145" height="8" rx="2" fill="#22c55e33" stroke="#22c55e" strokeWidth="0.8" />
          <text x="185" y="38" textAnchor="end" fill="#22c55e" fontSize="5.5">Stable 210ms ✅</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Cell Self-Healing Viz ────────────────────────────────────────────────────
function SelfHealingViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  const [healTick, setHealTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (stepIndex >= 1 && stepIndex < 5) {
      const id = setInterval(() => setHealTick(t => t + 1), 100);
      return () => clearInterval(id);
    }
  }, [stepIndex]);

  const failed     = stepIndex >= 1;
  const detecting  = stepIndex >= 2;
  const expanding  = stepIndex >= 3;
  const restored   = stepIndex >= 5;
  const pulse      = (Math.sin(tick * 0.15) + 1) / 2;

  const sites = [
    { id: "B", x: 100, y: 80, label: "SITE-B (failed)", isFailed: true },
    { id: "A", x: 60,  y: 55,  label: "SITE-A" },
    { id: "C", x: 140, y: 55,  label: "SITE-C" },
    { id: "D", x: 60,  y: 105, label: "SITE-D" },
    { id: "E", x: 140, y: 105, label: "SITE-E" },
  ];

  const boosts = { A: 4, C: 3, D: 2 };

  // MTTR display
  const healSecs = Math.min(385, healTick) / 10;
  const healMM = String(Math.floor(healSecs / 60)).padStart(2, "0");
  const healSS = String(Math.floor(healSecs % 60)).padStart(2, "0");
  const healTenths = String(Math.floor((healSecs * 10) % 10));

  // Neighbour load bars
  const baseLoads = { A: 54, C: 51, D: 48, E: 52 };
  const expandLoads = { A: 81, C: 74, D: 68, E: 55 };
  const loadSites = ["A", "C", "D", "E"];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* Hex SVG */}
      <svg viewBox="0 0 200 130" width="100%" style={{ flex: "1 1 auto", background: "#060d1b", display: "block" }}>
        {/* Coverage rings */}
        {sites.map(s => {
          if (s.isFailed) {
            const baseR = 32;
            if (!failed) return <circle key={s.id} cx={s.x} cy={s.y} r={baseR} fill="#06b6d415" stroke="#06b6d4" strokeWidth="0.8" />;
            if (restored) return <circle key={s.id} cx={s.x} cy={s.y} r={baseR} fill="#22c55e15" stroke="#22c55e" strokeWidth="1" />;
            return null;
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

        {expanding && !restored && (
          <>
            {[{ from: sites[1], r: 30 + pulse * 12 }, { from: sites[2], r: 28 + pulse * 10 }, { from: sites[3], r: 26 + pulse * 8 }].map((b, i) => (
              <circle key={i} cx={b.from.x} cy={b.from.y} r={b.r}
                fill="none" stroke="#f9731640" strokeWidth="2" opacity={0.5 - i * 0.12} />
            ))}
            <ellipse cx={100} cy={80} rx={28 + pulse * 8} ry={20 + pulse * 6}
              fill="#f9731610" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4,3" />
          </>
        )}

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

        <text x="100" y="12" textAnchor="middle" fill="#94a3b8" fontSize="7">
          {!failed ? "Normal Operation — 4 cells, full coverage"
            : !detecting ? "🔴 SITE-B FAILURE — Coverage hole: 31% zone"
            : !expanding ? "SON Detecting neighbors — A/C/D eligible"
            : !restored ? "CCO Expanding: A+4dB, C+3dB, D+2dB"
            : "✅ SITE-B Restored — CCO revert in progress"}
        </text>
        {detecting && !restored && (
          <text x="100" y="125" textAnchor="middle" fill="#f97316" fontSize="6">
            Heal elapsed: {healSecs.toFixed(1)}s / 38.5s target
          </text>
        )}
        {restored && (
          <text x="100" y="125" textAnchor="middle" fill="#22c55e" fontSize="6">
            ✅ Heal complete in 38.5s | 94% UEs recovered
          </text>
        )}
      </svg>

      {/* MTTR countdown */}
      <div style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13,
        color: restored ? "#22c55e" : stepIndex >= 1 ? "#f97316" : "#64748b",
        padding: "2px 0", letterSpacing: 1 }}>
        {stepIndex < 1 ? "⏱ Heal time: --"
          : restored ? "⏱ Heal time: 00:38.5s ✅"
          : `⏱ Heal time: ${healMM}:${healSS}.${healTenths}s`}
      </div>

      {/* Neighbour load bars */}
      <svg viewBox="0 0 200 50" style={{ width: "100%", flex: "0 0 auto", display: "block" }}>
        <text x="100" y="8" textAnchor="middle" fill="#64748b" fontSize="7">Neighbour Load Absorption</text>
        {loadSites.map((sid, i) => {
          const load = expanding ? expandLoads[sid] : baseLoads[sid];
          const barColor = (expanding && load > 65) ? "#f59e0b" : "#3b82f6";
          return (
            <g key={sid}>
              <text x="4" y={17 + i * 9 + 5} fill="#94a3b8" fontSize="6">SITE-{sid}</text>
              <rect x="36" y={13 + i * 9} width="130" height="7" rx="1" fill="#0a1628" />
              <rect x="36" y={13 + i * 9} width={130 * load / 100} height="7" rx="1" fill={barColor}
                style={{ transition: "width 0.6s" }} />
              <text x="170" y={17 + i * 9 + 5} fill="#94a3b8" fontSize="6">{load}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── DSS PRB Grid Viz ─────────────────────────────────────────────────────────
function DSSPRBViz({ stepIndex }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const COLS = 14;
  const ROWS = 10;

  const nrActivated  = stepIndex >= 1;
  const growthPhase  = stepIndex >= 2;
  const rebalanced   = stepIndex >= 3;
  const crsRestored  = stepIndex >= 4;
  const validated    = stepIndex >= 5;

  const nrCols = nrActivated ? (rebalanced ? 8 : growthPhase ? 5 : 2) : 0;
  const animShift = rebalanced && !crsRestored ? (tick % 3 === 0 ? 1 : 0) : 0;

  // Frame structure: 12px wide, 8px tall cells, gap 1px
  // Grid starts at x=5, y=20
  const cellW = 12, cellH = 8, gapX = 1, gapY = 1;

  const getCellColor = (col, row) => {
    if (stepIndex === 0) return "#3b82f6"; // all LTE
    if (stepIndex === 1) {
      // subframes 0,5 rows 0-3 = NR
      if ((col === 0 || col === 5) && row < 4) return "#22c55e";
      return "#3b82f6";
    }
    if (stepIndex === 2) {
      // cols 0-4 in rows 0-5 = NR
      if (col < 5 && row < 6) return "#22c55e";
      return "#3b82f6";
    }
    if (stepIndex >= 3) {
      // ~55% NR (cols 0-7), 4 cells orange (CRS punctured at col 8)
      if (col < 8) return "#22c55e";
      if (col === 8 && !crsRestored) return "#f97316"; // CRS punct
      if (col === 8 && crsRestored) return "#22c55e";
      return "#3b82f6";
    }
    return "#3b82f6";
  };

  const specEff = nrActivated ? (rebalanced ? 5.2 : growthPhase ? 4.5 : 4.1) : 3.8;
  const gridBorder = validated ? "1px solid #22c55e" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
      {/* Frame structure SVG */}
      <svg viewBox="0 0 200 120" style={{ width: "100%", flex: "1 1 auto", display: "block", background: "#060d1b" }}>
        <text x="100" y="10" textAnchor="middle" fill="#94a3b8" fontSize="7">DSS Frame Structure (14sf × 10 RBs)</text>

        {/* Column headers SF0–SF13 */}
        {Array.from({ length: COLS }).map((_, c) => (
          <text key={c} x={5 + c * (cellW + gapX) + cellW / 2} y="18"
            textAnchor="middle" fill="#64748b" fontSize="4">SF{c}</text>
        ))}

        {/* Cell grid */}
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            const cellColor = getCellColor(c, r);
            const isCRS = !crsRestored && rebalanced && c === 8;
            const x = 5 + c * (cellW + gapX);
            const y = 20 + r * (cellH + gapY);
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={cellW} height={cellH} rx="0.5"
                  fill={`${cellColor}40`} stroke={cellColor} strokeWidth={isCRS ? "0.8" : "0.4"}
                  style={{ transition: "fill 0.4s, stroke 0.4s" }} />
                {isCRS && (
                  <text x={x + cellW/2} y={y + cellH/2 + 2} textAnchor="middle" fill="#f97316" fontSize="5">×</text>
                )}
              </g>
            );
          })
        )}

        {/* NR/LTE divider */}
        {nrActivated && (
          <line x1={5 + nrCols * (cellW + gapX) - 0.5} y1="18"
            x2={5 + nrCols * (cellW + gapX) - 0.5} y2={20 + ROWS * (cellH + gapY)}
            stroke="#84cc16" strokeWidth="1" strokeDasharray="3,2" />
        )}

        {/* Green border on validated */}
        {validated && (
          <rect x="4" y="19" width={5 + COLS*(cellW+gapX)-4} height={ROWS*(cellH+gapY)+2}
            fill="none" stroke="#22c55e" strokeWidth="1" rx="1" />
        )}

        {/* Legend */}
        <rect x="5" y="113" width="7" height="5" fill="#3b82f640" stroke="#3b82f6" strokeWidth="0.5" />
        <text x="14" y="118" fill="#3b82f6" fontSize="5.5">LTE</text>
        <rect x="35" y="113" width="7" height="5" fill="#22c55e40" stroke="#22c55e" strokeWidth="0.5" />
        <text x="44" y="118" fill="#22c55e" fontSize="5.5">NR</text>
        {rebalanced && (
          <>
            <rect x="65" y="113" width="7" height="5" fill="#f9731640" stroke="#f97316" strokeWidth="0.5" />
            <text x="74" y="118" fill="#f97316" fontSize="5.5">CRS punct.</text>
          </>
        )}
        <text x="195" y="118" textAnchor="end" fill="#84cc16" fontSize="5.5">SE: {specEff.toFixed(1)} b/s/Hz</text>
      </svg>

      {/* PRB summary bars */}
      <svg viewBox="0 0 200 40" style={{ width: "100%", flex: "0 0 auto", display: "block" }}>
        {/* LTE bar */}
        <text x="4" y="12" fill="#3b82f6" fontSize="6">LTE</text>
        <rect x="24" y="5" width="80" height="8" rx="1" fill="#0a1628" />
        <rect x="24" y="5" width={80 * (COLS - nrCols) / COLS} height="8" rx="1" fill="#3b82f688" stroke="#3b82f6" strokeWidth="0.5"
          style={{ transition: "width 0.4s" }} />
        <text x="107" y="12" fill="#3b82f6" fontSize="5.5">{COLS - nrCols} sf</text>
        {/* NR bar */}
        <text x="4" y="27" fill="#22c55e" fontSize="6">NR</text>
        <rect x="24" y="20" width="80" height="8" rx="1" fill="#0a1628" />
        <rect x="24" y="20" width={80 * nrCols / COLS} height="8" rx="1" fill="#22c55e88" stroke="#22c55e" strokeWidth="0.5"
          style={{ transition: "width 0.4s" }} />
        <text x="107" y="27" fill="#22c55e" fontSize="5.5">{nrCols} sf</text>
        {/* Status */}
        {rebalanced && !crsRestored && (
          <text x="120" y="20" fill="#ef4444" fontSize="5.5">⚠ CRS-IC pending</text>
        )}
        {crsRestored && (
          <text x="120" y="20" fill="#22c55e" fontSize="5.5">✅ CRS-IC active</text>
        )}
        {!nrActivated && (
          <text x="120" y="20" fill="#3b82f6" fontSize="5.5">LTE-only | SE: 3.8</text>
        )}
      </svg>
    </div>
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


// ─── Animated metric counter (ease-out, 700ms) ───────────────────────────────
function AnimatedCounter({ fromStr, toStr, active }) {
  const extractNum = (s) => { const m = String(s || "").match(/(-?[\d.]+)/); return m ? parseFloat(m[1]) : null; };
  const fromNum = extractNum(fromStr);
  const toNum   = extractNum(toStr);
  const [display, setDisplay] = useState(String(fromStr));

  useEffect(() => {
    if (!active) { setDisplay(String(fromStr)); return; }
    if (fromNum === null || toNum === null || fromNum === toNum) { setDisplay(String(toStr)); return; }
    const duration = 700;
    const start = performance.now();
    let raf;
    const animate = (now) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const cur  = fromNum + (toNum - fromNum) * ease;
      const dec  = String(toStr).includes(".") ? 1 : 0;
      setDisplay(String(toStr).replace(/(-?[\d.]+)/, cur.toFixed(dec)));
      if (t < 1) raf = requestAnimationFrame(animate);
      else setDisplay(String(toStr));
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [active, fromStr, toStr]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}</>;
}

// ─── Mini sparkline SVG (60x20, before->after trajectory) ────────────────────
function MiniSparkline({ fromStr, toStr }) {
  const extractNum = (s) => { const m = String(s || "").match(/(-?[\d.]+)/); return m ? parseFloat(m[1]) : null; };
  const fromNum = extractNum(fromStr);
  const toNum   = extractNum(toStr);
  if (fromNum === null || toNum === null || fromNum === toNum) return null;

  const W = 60, H = 20, PTS = 8;
  const vals = Array.from({ length: PTS }, (_, i) => fromNum + (toNum - fromNum) * (i / (PTS - 1)));
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1;
  const toX  = (i) => 2 + (i / (PTS - 1)) * (W - 4);
  const toY  = (v) => H - 3 - ((v - minV) / range) * (H - 6);
  const pathD = vals.map((v, i) => (i === 0 ? "M" : "L") + toX(i).toFixed(1) + "," + toY(v).toFixed(1)).join(" ");
  const lineColor = toNum > fromNum ? "#22c55e" : "#ef4444";
  const lx = toX(PTS - 1), ly = toY(vals[PTS - 1]);

  return (
    <svg width={W} height={H} style={{ display: "block", marginTop: 2 }}>
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={lx} cy={ly} r="2" fill={lineColor} />
    </svg>
  );
}

// ─── Open RAN / RIC xApp Deployment Viz ──────────────────────────────────────
function ORanViz({ progress, color }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const showXApp    = progress > 0.5;
  const showControl = progress > 0.7;
  const dashOff     = (tick * 2.5) % 36;

  const hexPts = (cx, cy, r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return (cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1);
    }).join(" ");

  const ricX = 100, ricY = 88;
  const gnbs = [
    { x: 34,  y: 88,  color: "#3b82f6", label: "Ericsson", sub: "AIR 6449" },
    { x: 100, y: 30,  color: "#60a5fa", label: "Nokia",    sub: "AirScale" },
    { x: 166, y: 88,  color: "#14b8a6", label: "Samsung",  sub: "TN (CU)" },
  ];

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {[32, 54, 76].map((r, i) => (
        <circle key={i} cx={ricX} cy={ricY} r={r} fill="none" stroke={color + "12"} strokeWidth="0.5" strokeDasharray="2,4" />
      ))}
      {gnbs.map((g, i) => {
        const isCtrl = showControl && i === 1;
        return (
          <line key={i} x1={ricX} y1={ricY} x2={g.x} y2={g.y}
            stroke={isCtrl ? color : "#1e3a5f"} strokeWidth={isCtrl ? 2 : 1}
            strokeDasharray={isCtrl ? "5,3" : "none"} strokeDashoffset={isCtrl ? -dashOff : 0}
            opacity={progress > 0.2 ? 1 : 0.25} />
        );
      })}
      {progress > 0.3 && gnbs.map((g, i) => (
        <text key={i} x={((ricX + g.x) / 2).toFixed(1)} y={((ricY + g.y) / 2 - 3).toFixed(1)}
          textAnchor="middle" fill="#334155" fontSize="5.5">E2</text>
      ))}
      {gnbs.map((g, i) => (
        <g key={i}>
          <circle cx={g.x} cy={g.y} r="15" fill="#0a1628" stroke={g.color} strokeWidth="1.5" />
          <text x={g.x} y={g.y - 4} textAnchor="middle" fill={g.color} fontSize="6" fontWeight="bold">gNB</text>
          <text x={g.x} y={g.y + 4} textAnchor="middle" fill="#94a3b8" fontSize="5">{g.label}</text>
          <text x={g.x} y={g.y + 11} textAnchor="middle" fill="#475569" fontSize="4.5">{g.sub}</text>
        </g>
      ))}
      <polygon points={hexPts(ricX, ricY, 29)} fill="#0d1e38" stroke={color} strokeWidth="1.5" />
      <polygon points={hexPts(ricX, ricY, 33)} fill="none" stroke={color + "40"} strokeWidth="0.8" strokeDasharray="3,3" />
      <text x={ricX} y={ricY - 5} textAnchor="middle" fill={color} fontSize="7" fontWeight="bold">Near-RT</text>
      <text x={ricX} y={ricY + 4} textAnchor="middle" fill={color} fontSize="7" fontWeight="bold">RIC</text>
      {showXApp && (
        <g>
          <rect x={ricX - 15} y={ricY + 9} width="30" height="11" rx="2"
            fill={color + "33"} stroke={color} strokeWidth="0.8" />
          <text x={ricX} y={ricY + 17} textAnchor="middle" fill={color} fontSize="5.5" fontWeight="bold">MLB xApp</text>
        </g>
      )}
      {showControl && (
        <text x={(ricX + gnbs[1].x) / 2 + 10} y={(ricY + gnbs[1].y) / 2 - 2}
          fill={color} fontSize="6" fontWeight="bold">CTRL</text>
      )}
      <text x="100" y="9" textAnchor="middle" fill="#475569" fontSize="6">{"O1 \u2192 SMO \u2192 influxDB | E2SM-KPM v2.0"}</text>
      <text x="100" y="154" textAnchor="middle"
        fill={progress > 0.85 ? "#22c55e" : "#475569"} fontSize="6.5">
        {progress > 0.85 ? "Multi-vendor closed loop active - 47 MLB actions/hr"
          : progress > 0.5  ? "xApp inference running - ONNX 8ms latency..."
          : "E2 interface setup in progress..."}
      </text>
    </svg>
  );
}

// ─── Green RAN / Energy Saving Viz ───────────────────────────────────────────
function GreenRanViz({ progress }) {
  const loads = [18,12,9,7,6,8,22,45,68,82,88,91,87,85,83,80,78,75,72,68,62,55,42,28];
  const esHours = new Set([1, 2, 3, 4, 5]);
  const BW = 5.8, GAP = 1.4, SX = 7, SY = 105, MAX_H = 58;

  const maxKW = 18, minKW = 12.4;
  const curKW = maxKW - (maxKW - minKW) * Math.min(progress, 1);

  const arcCX = 163, arcCY = 88, arcR = 26;
  const aStart = 150 * Math.PI / 180, aEnd = 390 * Math.PI / 180;
  const totalArc = aEnd - aStart;
  const fillRatio = (curKW - minKW) / (maxKW - minKW);
  const aFill = aStart + totalArc * fillRatio;
  const pol = (cx, cy, r, a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const arcS = pol(arcCX, arcCY, arcR, aStart);
  const arcF = pol(arcCX, arcCY, arcR, aFill);
  const arcE = pol(arcCX, arcCY, arcR, aEnd);
  const lblS = pol(arcCX, arcCY, arcR + 8, aStart);
  const lblE = pol(arcCX, arcCY, arcR + 8, aEnd);
  const largeArc = (aFill - aStart) > Math.PI ? 1 : 0;

  const leaf = (x, y) =>
    "M" + x + "," + y + " C" + (x-4) + "," + (y-7) + " " + (x+4) + "," + (y-12) + " " + x + "," + (y-9) +
    " C" + (x-4) + "," + (y-12) + " " + (x+4) + "," + (y-7) + " " + x + "," + y;
  const leafSlots = [{x:139,y:148},{x:148,y:144},{x:157,y:148},{x:143,y:139},{x:152,y:139}];
  const leafCount = Math.min(Math.floor(progress * 6), leafSlots.length);

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      <text x={SX} y="9" fill="#64748b" fontSize="6.5">HOURLY TRAFFIC LOAD (%)</text>
      {[...esHours].map(h => (
        <rect key={h} x={SX + h * (BW + GAP) - 0.5} y={16} width={BW + 1} height={SY - 16} fill="#22c55e10" />
      ))}
      {loads.map((ld, h) => {
        const isES = esHours.has(h);
        const bh   = (ld / 100) * MAX_H;
        const bClr = isES && progress > 0.5 ? "#22c55e" : ld > 60 ? "#3b82f6" : ld > 30 ? "#60a5fa" : "#1e3a5f";
        return (
          <rect key={h} x={SX + h * (BW + GAP)} y={SY - bh} width={BW} height={bh} rx="0.5"
            fill={bClr} opacity={isES && progress > 0.5 ? 0.95 : 0.65} />
        );
      })}
      <line x1={SX} y1={SY} x2={SX + 24 * (BW + GAP)} y2={SY} stroke="#1e3a5f" strokeWidth="0.5" />
      {[0, 6, 12, 18, 23].map(h => (
        <text key={h} x={SX + h * (BW + GAP) + BW / 2} y={SY + 8} textAnchor="middle" fill="#475569" fontSize="5">
          {String(h).padStart(2, "0")}
        </text>
      ))}
      {(() => {
        const bx1 = SX + 1 * (BW + GAP) - 0.5;
        const bx2 = SX + 6 * (BW + GAP) - 0.5;
        return (
          <g>
            <line x1={bx1} y1={16} x2={bx2} y2={16} stroke="#22c55e" strokeWidth="0.8" />
            <line x1={bx1} y1={16} x2={bx1} y2={21} stroke="#22c55e" strokeWidth="0.8" />
            <line x1={bx2} y1={16} x2={bx2} y2={21} stroke="#22c55e" strokeWidth="0.8" />
            <text x={(bx1 + bx2) / 2} y={14} textAnchor="middle" fill="#22c55e" fontSize="5" fontWeight="bold">ES WIN</text>
          </g>
        );
      })()}
      <path d={"M" + arcS.x.toFixed(1) + "," + arcS.y.toFixed(1) + " A" + arcR + "," + arcR + " 0 1 1 " + arcE.x.toFixed(1) + "," + arcE.y.toFixed(1)}
        fill="none" stroke="#1e3a5f" strokeWidth="5" strokeLinecap="round" />
      {fillRatio > 0.02 && (
        <path d={"M" + arcS.x.toFixed(1) + "," + arcS.y.toFixed(1) + " A" + arcR + "," + arcR + " 0 " + largeArc + " 1 " + arcF.x.toFixed(1) + "," + arcF.y.toFixed(1)}
          fill="none" stroke={progress > 0.45 ? "#22c55e" : "#ef4444"} strokeWidth="5" strokeLinecap="round"
          style={{ transition: "stroke 0.4s" }} />
      )}
      <text x={arcCX} y={arcCY - 34} textAnchor="middle" fill="#64748b" fontSize="6">POWER/SITE</text>
      <text x={arcCX} y={arcCY + 5} textAnchor="middle" fill={progress > 0.45 ? "#22c55e" : "#ef4444"} fontSize="12" fontWeight="bold">
        {curKW.toFixed(1)}
      </text>
      <text x={arcCX} y={arcCY + 14} textAnchor="middle" fill="#64748b" fontSize="6">kW</text>
      <text x={lblS.x.toFixed(0)} y={lblS.y.toFixed(0)} textAnchor="middle" fill="#ef4444" fontSize="5">18</text>
      <text x={lblE.x.toFixed(0)} y={lblE.y.toFixed(0)} textAnchor="middle" fill="#22c55e" fontSize="5">12.4</text>
      {leafSlots.slice(0, leafCount).map((lp, i) => (
        <path key={i} d={leaf(lp.x, lp.y)} fill="#22c55e" opacity="0.85" />
      ))}
      {leafCount > 0 && (
        <text x="148" y="157" textAnchor="middle" fill="#22c55e" fontSize="5.5">CO2 saved</text>
      )}
      {progress > 0.8 && (
        <g>
          <rect x={arcCX - 22} y={arcCY + 20} width="44" height="13" rx="3"
            fill="#22c55e22" stroke="#22c55e" strokeWidth="0.8" />
          <text x={arcCX} y={arcCY + 30} textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold">-31% !</text>
        </g>
      )}
    </svg>
  );
}
// ─── Private 5G Campus Viz ────────────────────────────────────────────────────
function Private5GViz({ progress, color }) {
  const roaming = progress > 0.7;
  const done    = progress > 0.9;

  // AGV positions cycling inside campus
  const agvSlots = [
    { x: 62,  y: 95  },
    { x: 90,  y: 110 },
    { x: 110, y: 88  },
    { x: 75,  y: 75  },
    { x: 100, y: 70  },
  ];

  const agvIcon = (x, y, roamingAGV) => (
    <g key={`${x}-${y}`}>
      <rect x={x - 5} y={y - 3} width="10" height="6" rx="1"
        fill={roamingAGV ? "#a855f7" : color} opacity="0.9" />
      <circle cx={x - 3} cy={y + 3} r="1.5" fill="#334155" />
      <circle cx={x + 3} cy={y + 3} r="1.5" fill="#334155" />
    </g>
  );

  // Private gNB towers (amber, triangle) arranged in a triangle
  const privateGNBs = [
    { x: 65,  y: 55, label: "gNB-1" },
    { x: 105, y: 50, label: "gNB-2" },
    { x: 85,  y: 100, label: "gNB-3" },
  ];

  const tower = (x, y, clr, lbl) => (
    <g key={lbl}>
      <polygon points={`${x},${y - 10} ${x - 7},${y + 4} ${x + 7},${y + 4}`}
        fill={clr} opacity="0.85" />
      <line x1={x} y1={y + 4} x2={x} y2={y + 9} stroke={clr} strokeWidth="1.5" />
      <text x={x} y={y + 16} textAnchor="middle" fill={clr} fontSize="5" fontWeight="bold">{lbl}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Campus boundary */}
      <rect x="30" y="35" width="120" height="110" rx="4" fill="#0a1628"
        stroke={color} strokeWidth="1.2" strokeDasharray="5,3" />
      <text x="90" y="30" textAnchor="middle" fill={color} fontSize="5.5" fontWeight="bold">
        Industrial Campus 200K m²
      </text>

      {/* UPF server box in campus center */}
      <rect x="77" y="78" width="26" height="16" rx="2"
        fill="#06b6d422" stroke="#06b6d4" strokeWidth="1" />
      <text x="90" y="87" textAnchor="middle" fill="#06b6d4" fontSize="5" fontWeight="bold">UPF</text>
      <text x="90" y="93" textAnchor="middle" fill="#475569" fontSize="4">on-prem</text>

      {/* Lines from UPF to private gNBs */}
      {privateGNBs.map(g => (
        <line key={g.label} x1="90" y1="86" x2={g.x} y2={g.y + 4}
          stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="3,2" opacity={progress > 0.2 ? 0.7 : 0.2} />
      ))}

      {/* Private gNB towers */}
      {privateGNBs.map(g => tower(g.x, g.y, color, g.label))}

      {/* Static AGVs inside campus */}
      {agvSlots.slice(0, 4).map(a => agvIcon(a.x, a.y, false))}

      {/* Roaming AGV */}
      {roaming
        ? agvIcon(148, 38, true)
        : agvIcon(agvSlots[4].x, agvSlots[4].y, false)
      }

      {/* Public gNB (outside campus, gray) */}
      <g opacity={roaming ? 1 : 0.3} style={{ transition: "opacity 0.4s" }}>
        {tower(168, 45, "#64748b", "Public")}
      </g>

      {/* N26 roaming line */}
      {roaming && (
        <g>
          <line x1="105" y1="50" x2="161" y2="45"
            stroke="#a855f7" strokeWidth="1.2" strokeDasharray="4,2" />
          <text x="133" y="40" textAnchor="middle" fill="#a855f7" fontSize="5" fontWeight="bold">
            N26 Roaming
          </text>
        </g>
      )}

      {/* Done badges */}
      {done && privateGNBs.map(g => (
        <text key={g.label} x={g.x + 9} y={g.y - 8} fill="#22c55e" fontSize="8">✓</text>
      ))}
      {done && (
        <text x="103" y="78" fill="#22c55e" fontSize="8">✓</text>
      )}

      {/* Legend */}
      <text x="6" y="152" fill={color} fontSize="5">▲ Private gNB</text>
      <text x="60" y="152" fill="#06b6d4" fontSize="5">■ On-Prem UPF</text>
      <text x="115" y="152" fill="#64748b" fontSize="5">▲ Public gNB</text>

      {/* Status line */}
      <text x="100" y="9" textAnchor="middle" fill="#475569" fontSize="5.5">
        {done
          ? "✅ Private 5G — AGV 1.8ms | Cameras 480 Mbps | Roaming ✅"
          : roaming
          ? "AGV-07 roaming → public 5G SA via N26 (18ms HO)..."
          : progress > 0.4
          ? "URLLC + eMBB slices active | CBRS n48 | On-prem UPF N6..."
          : "Provisioning private PLMN 315-010 | CBRS SAS grant..."}
      </text>
    </svg>
  );
}

// ─── LEO Satellite Interference Viz ──────────────────────────────────────────
function LeoInterferenceViz({ progress, color }) {
  const satX = progress * 180 + 10;
  const showCone    = progress > 0.2;
  const showHop     = progress > 0.6;
  const showRestore = progress > 0.8;
  const showITU     = progress > 0.85;

  // Noise floor animation: -108 → -99.6 during progress 0.2→0.5
  const noisePct = Math.min(Math.max((progress - 0.2) / 0.3, 0), 1);
  const noiseVal = (-108 + noisePct * 8.4).toFixed(1);
  const noiseBarH = 30 + noisePct * 20;

  const cellTowers = [
    { x: 40,  label: "NE-012" },
    { x: 90,  label: "SW-008" },
    { x: 140, label: "SE-023" },
  ];

  // NE-012 and SE-023 are affected; SW-008 is not
  const isAffected = (idx) => !showRestore && showCone && idx !== 1;
  const towerColor = (idx) => isAffected(idx) ? "#ef4444" : "#22c55e";

  const towerSVG = ({ x, label }, idx) => (
    <g key={label}>
      <polygon points={`${x},${128} ${x - 6},${142} ${x + 6},${142}`} fill={towerColor(idx)} />
      <line x1={x} y1={142} x2={x} y2={148} stroke={towerColor(idx)} strokeWidth="1.5" />
      <text x={x} y={155} textAnchor="middle" fill={towerColor(idx)} fontSize="5">{label}</text>
    </g>
  );

  // Stars
  const stars = [
    [15, 12],[35, 25],[55, 8],[80, 20],[110, 10],[130, 28],[155, 15],[175, 22],[20, 35],[170, 8],
  ];

  return (
    <svg viewBox="0 0 200 160" style={{ width: "100%", height: "100%", display: "block" }}>
      {/* Dark space background */}
      <rect x="0" y="0" width="200" height="120" fill="#060d1b" />

      {/* Stars */}
      {stars.map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r="0.8" fill="white" opacity="0.7" />
      ))}

      {/* Earth curve */}
      <path d="M0,135 Q100,115 200,135 L200,160 L0,160 Z" fill="#1e3a5f" />
      <path d="M0,135 Q100,115 200,135" fill="none" stroke="#3b82f6" strokeWidth="1.5" />

      {/* Cell towers on Earth */}
      {cellTowers.map((t, i) => towerSVG(t, i))}

      {/* Satellite */}
      <g transform={`translate(${satX.toFixed(1)}, 22)`}>
        <rect x="-8" y="-4" width="16" height="8" rx="2" fill="#94a3b8" />
        <rect x="-14" y="-2" width="6" height="4" rx="1" fill="#475569" />
        <rect x="8"  y="-2" width="6" height="4" rx="1" fill="#475569" />
        <circle cx="0" cy="0" r="2.5" fill="#60a5fa" />
        <text x="0" y="-8" textAnchor="middle" fill="#94a3b8" fontSize="5">LEO</text>
      </g>

      {/* Interference cone lines */}
      {showCone && cellTowers.map((t, i) => {
        if (i === 1) return null; // SW-008 unaffected
        const coneOpacity = showRestore ? 0.1 : 0.6;
        return (
          <line key={t.label}
            x1={satX.toFixed(1)} y1="26"
            x2={t.x} y2="128"
            stroke={showRestore ? "#475569" : "#ef4444"}
            strokeWidth="1" strokeDasharray="4,3"
            opacity={coneOpacity}
            style={{ transition: "opacity 0.5s, stroke 0.5s" }} />
        );
      })}

      {/* Noise floor bar (right side) */}
      <text x="185" y="55" textAnchor="middle" fill="#64748b" fontSize="4.5">dBm/MHz</text>
      <rect x="179" y="58" width="8" height="50" rx="1" fill="#0a1628" stroke="#1e3a5f" strokeWidth="0.8" />
      <rect x="179" y={108 - noiseBarH} width="8" height={noiseBarH} rx="1"
        fill={noisePct > 0.5 ? "#ef4444" : "#22c55e"}
        style={{ transition: "all 0.3s" }} />
      <text x="183" y={108 - noiseBarH - 3} textAnchor="middle" fill="#94a3b8" fontSize="4">
        {noiseVal}
      </text>
      <text x="183" y="115" textAnchor="middle" fill="#475569" fontSize="4">noise</text>

      {/* Frequency hop arrow */}
      {showHop && (
        <g>
          <rect x="10" y="58" width="80" height="20" rx="2" fill="#0a1628" stroke={color} strokeWidth="0.8" />
          <text x="50" y="65" textAnchor="middle" fill={color} fontSize="4.5" fontWeight="bold">Freq Hop</text>
          <text x="50" y="73" textAnchor="middle" fill="#94a3b8" fontSize="4">3500 → 3620 MHz</text>
          <line x1="12" y1="69" x2="18" y2="69" stroke="#22c55e" strokeWidth="1" markerEnd="url(#arrow)" />
        </g>
      )}

      {/* SINR restored label */}
      {showRestore && (
        <g>
          <text x="40"  y="122" textAnchor="middle" fill="#22c55e" fontSize="5" fontWeight="bold">SINR ✅</text>
          <text x="140" y="122" textAnchor="middle" fill="#22c55e" fontSize="5" fontWeight="bold">SINR ✅</text>
        </g>
      )}

      {/* ITU badge */}
      {showITU && (
        <g>
          <rect x="60" y="42" width="80" height="12" rx="2" fill={color + "33"} stroke={color} strokeWidth="0.8" />
          <text x="100" y="51" textAnchor="middle" fill={color} fontSize="5.5" fontWeight="bold">
            ITU LEO-2026-0342 ✅
          </text>
        </g>
      )}

      {/* Status */}
      <text x="100" y="9" textAnchor="middle" fill="#475569" fontSize="5.5">
        {showRestore
          ? "✅ SINR restored | Freq hop active | ITU filed"
          : showHop
          ? "Freq hop: 3500→3620 MHz | SINR recovering..."
          : showCone
          ? "⚠️ C-band interference +8.4dB | SINR degraded"
          : "Tracking LEO overpass — 340km orbit, 4.2 min window..."}
      </text>
    </svg>
  );
}

function ScenarioViz({ scenario, stepIndex, color }) {
  if (!scenario) return null;
  const progress = scenario.steps.length > 0 ? stepIndex / scenario.steps.length : 0;
  const viz = {
    "mimo-3d":          <MIMOBeam3D progress={progress} color={color} />,
    "slicing-sla":      <SlicingViz progress={progress} stepIndex={stepIndex} />,
    "ai-ran":           <AIRanViz progress={progress} />,
    "edge-trombone":    <TromboneViz stepIndex={stepIndex} color={color} />,
    "indoor-pos":       <PositioningViz progress={progress} stepIndex={stepIndex} color={color} />,
    "ray-tracing":      <RayTrace3D progress={progress} stepIndex={stepIndex} color={color} />,
    "ho-storm":         <HandoverStormViz stepIndex={stepIndex} />,
    "self-heal":        <SelfHealingViz stepIndex={stepIndex} />,
    "dss":              <DSSPRBViz stepIndex={stepIndex} />,
    "prop-model":       <PropagationModelViz stepIndex={stepIndex} />,
    "oran-ric":         <ORanViz progress={progress} color={color} />,
    "green-ran":        <GreenRanViz progress={progress} color={color} />,
    "private-5g":       <Private5GViz progress={progress} color={color} />,
    "leo-interference": <LeoInterferenceViz progress={progress} color={color} />,
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
  PLMN: "#f59e0b", SAS: "#fbbf24", UPF: "#06b6d4", SLICE: "#a855f7", ROAMING: "#f97316",
  IMPACT: "#ef4444", MITIGATE: "#22c55e", ITU: "#818cf8",
};
function phaseColor(phase) { return PHASE_COLORS[phase] || "#60a5fa"; }

function CausalChain({ chain, visible }) {
  const nodeColors = {
    cause:  { bg: "#ef444422", border: "#ef4444" },
    impact: { bg: "#f9731622", border: "#f97316" },
    user:   { bg: "#a855f722", border: "#a855f7" },
    fix:    { bg: "#3b82f622", border: "#3b82f6" },
    result: { bg: "#22c55e22", border: "#22c55e" },
  };
  return (
    <div style={{ background: "#070e1c", borderTop: "1px solid #1e3a5f", padding: "6px 14px 8px" }}>
      <div style={{ color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>
        ⛓ ROOT CAUSE CHAIN
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        {chain.map((node, i) => {
          const c = nodeColors[node.type] || nodeColors.cause;
          return (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
              {i > 0 && (
                <span style={{ color: "#334155", fontSize: 11, margin: "0 4px" }}>→</span>
              )}
              <span
                style={{
                  padding: "3px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                  background: c.bg, border: `1px solid ${c.border}`, color: c.border,
                  opacity: visible > i ? 1 : 0,
                  transition: `opacity 0.3s ${i * 0.15}s`,
                  display: "inline-block",
                }}
              >
                {node.label}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RANScenariosPanel({ genMode, onClose }) {
  const [selected, setSelected] = useState(null);
  const [runState, setRunState] = useState("idle"); // idle | running | done
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepLogs, setStepLogs]   = useState([]);
  const [chainVisible, setChainVisible] = useState(0);
  const [rightTab, setRightTab] = useState("metrics");
  const [cliTab, setCliTab] = useState("config");
  const [whatIfParams, setWhatIfParams] = useState({});
  const [paramsOpen, setParamsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);
  const logRef   = useRef(null);

  const scenario = SCENARIOS.find(s => s.id === selected);
  const scenarioColor = scenario ? scenario.color : "#60a5fa";

  function getParam(key) {
    const p = scenario?.params?.find(p => p.key === key);
    return whatIfParams[key] ?? p?.default ?? 0;
  }
  function setParam(key, val) { setWhatIfParams(prev => ({...prev, [key]: Number(val)})); }

  function copyCliText(text) {
    if (text) { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }

  useEffect(() => {
    if (runState === "done" && scenario) {
      setChainVisible(0);
      const chain = scenario.causalChain || [];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setChainVisible(i);
        if (i >= chain.length) clearInterval(interval);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [runState, scenario]);

  function selectScenario(id) {
    if (runState === "running") return;
    setSelected(id);
    setRunState("idle");
    setStepIndex(-1);
    setStepLogs([]);
    setWhatIfParams({});
    setRightTab("metrics");
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
    setChainVisible(0);
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

  const cliStepIdx = runState === "running" ? stepIndex : (stepLogs.length > 0 ? stepLogs.length - 1 : -1);
  const cliArr = scenario ? SCENARIO_CLI[scenario.id] : null;
  const cliText = (cliArr && cliStepIdx >= 0) ? cliArr[cliStepIdx] : null;
  const cliActiveStep = scenario?.steps[cliStepIdx] ?? null;
  const vendor = scenario ? (SCENARIO_VENDOR[scenario.id] ?? "Vendor CLI") : null;

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

              {/* What-If Parameter Tuner — shown when idle */}
              {runState === "idle" && scenario?.params && (
                <div style={{ background: "#070e1c", borderBottom: "1px solid #1e3a5f", padding: "6px 14px", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: paramsOpen ? 6 : 0 }}>
                    <span style={{ color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>⚙️ WHAT-IF PARAMETERS</span>
                    <button onClick={() => setParamsOpen(o => !o)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10 }}>
                      {paramsOpen ? "▲" : "▼"}
                    </button>
                    <button onClick={() => setWhatIfParams({})} style={{ background: "none", border: "1px solid #1e3a5f", borderRadius: 4, color: "#64748b", cursor: "pointer", fontSize: 9, padding: "1px 6px" }}>
                      ↺ Reset
                    </button>
                  </div>
                  {paramsOpen && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                      {scenario.params.map(p => {
                        const val = getParam(p.key);
                        const isChanged = val !== p.default;
                        const displayVal = p.key === "numRays" ? (val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}K`) : val;
                        return (
                          <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 180, flex: "1 1 180px" }}>
                            <span style={{ color: isChanged ? scenarioColor : "#64748b", fontSize: 9, minWidth: 80, fontWeight: isChanged ? 700 : 400 }}>{p.label}</span>
                            <input type="range" min={p.min} max={p.max} step={p.step} value={val}
                              onChange={e => setParam(p.key, e.target.value)}
                              style={{ flex: 1, accentColor: scenarioColor, cursor: "pointer" }} />
                            <span style={{ color: isChanged ? scenarioColor : "#94a3b8", fontSize: 9, minWidth: 44, textAlign: "right", fontWeight: isChanged ? 700 : 400 }}>
                              {displayVal}{p.unit}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Visualization + Step log split */}
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Visualization — 45% of available width */}
                <div style={{
                  flex: "0 0 45%", minWidth: 320, borderRight: "1px solid #1e3a5f",
                  background: "#020817", display: "flex", flexDirection: "column",
                }}>
                  <div style={{ padding: "6px 10px", borderBottom: "1px solid #0f1a2e", color: "#64748b", fontSize: 9, fontWeight: 700 }}>
                    LIVE VISUALIZATION
                  </div>
                  <div style={{ flex: 1, padding: 6, display: "flex", alignItems: "stretch" }}>
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
                           <div style={{ color: "#64748b", fontSize: 9, marginTop: 2 }}>
                            {log.detail}
                            {log.spec && (
                              <span style={{
                                display: "inline-block", marginLeft: 6, padding: "1px 5px",
                                borderRadius: 3, fontSize: 9, fontWeight: 700,
                                background: "#1e1b4b", color: "#818cf8",
                                border: "1px solid #3730a3", cursor: "default",
                                verticalAlign: "middle",
                              }} title={`3GPP/O-RAN Reference: ${log.spec}`}>
                                {log.spec}
                              </span>
                            )}
                          </div>
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

                  {/* Causal Chain */}
                  {runState === "done" && scenario?.causalChain && (
                    <CausalChain chain={scenario.causalChain} visible={chainVisible} />
                  )}

                  {/* Control bar */}
                  <div style={S.controlBar}>
                    {scenario?.params && Object.keys(whatIfParams).length > 0 && (
                      <span style={{ color: scenarioColor, fontSize: 9, marginRight: 4 }}>
                        ⚙️ Custom: {scenario.params.filter(p => whatIfParams[p.key] !== undefined && whatIfParams[p.key] !== p.default).map(p => {
                          const val = whatIfParams[p.key];
                          const dispVal = p.key === "numRays" ? (val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${(val/1000).toFixed(0)}K`) : val;
                          return `${p.label}=${dispVal}${p.unit}`;
                        }).join(" · ")}
                      </span>
                    )}
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
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e3a5f", background: "#0a1628", display: "flex", gap: 6, alignItems: "center" }}>
            {[["metrics","📊 Metrics"],["cli","⚙️ CLI / Config"]].map(([id, label]) => (
              <button key={id} onClick={() => setRightTab(id)} style={{
                padding: "3px 10px", borderRadius: 10, fontSize: 9, fontWeight: 700, cursor: "pointer", border: "none",
                background: rightTab === id ? scenarioColor : "#1e3a5f",
                color: rightTab === id ? "#fff" : "#64748b",
              }}>{label}</button>
            ))}
          </div>
          <div style={S.rightScroll}>
            {rightTab === "cli" ? (
              !scenario ? (
                <div style={{ color: "#3a4a5f", fontSize: 10, textAlign: "center", marginTop: 20 }}>Select a scenario to see CLI output</div>
              ) : !cliText ? (
                <div style={{ color: "#3a4a5f", fontSize: 10, textAlign: "center", marginTop: 20 }}>Run simulation to see vendor CLI output</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: `${scenarioColor}22`, color: scenarioColor, border: `1px solid ${scenarioColor}44` }}>{vendor}</span>
                    {cliActiveStep && <span style={{ color: "#64748b", fontSize: 9 }}>{cliActiveStep.phase} · {cliActiveStep.action.substring(0, 28)}{cliActiveStep.action.length > 28 ? "…" : ""}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                    {[["config","⚙️ Config"],["gnmi","📤 gNMI"],["syslog","📋 Syslog"]].map(([id, lbl]) => (
                      <button key={id} onClick={() => setCliTab(id)} style={{
                        padding: "2px 7px", borderRadius: 8, fontSize: 8, fontWeight: 700, cursor: "pointer", border: "none",
                        background: cliTab === id ? scenarioColor : "#1e3a5f",
                        color: cliTab === id ? "#fff" : "#64748b",
                      }}>{lbl}</button>
                    ))}
                    <button onClick={() => copyCliText(cliText)} style={{
                      marginLeft: "auto", padding: "2px 7px", borderRadius: 8, fontSize: 8, fontWeight: 700, cursor: "pointer",
                      border: "none", background: copied ? "#22c55e" : "#1e3a5f", color: copied ? "#fff" : "#64748b",
                    }}>{copied ? "✓ Copied" : "⎘ Copy"}</button>
                  </div>
                  {cliTab === "config" && (
                    <pre style={{ background: "#0a0f1a", color: "#22c55e", padding: 10, fontSize: 9, borderRadius: 4, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.5, border: "1px solid #1e3a5f" }}>
                      {cliText}
                    </pre>
                  )}
                  {cliTab === "gnmi" && (
                    <pre style={{ background: "#0a0f1a", color: "#60a5fa", padding: 10, fontSize: 9, borderRadius: 4, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.5, border: "1px solid #1e3a5f" }}>
                      {`gNMI SetRequest {\n  prefix: { origin: "openconfig" }\n  update: [{\n    path: "/${cliActiveStep?.system?.replace(/\s+/g,"_").toLowerCase()}/${cliActiveStep?.phase?.toLowerCase()}",\n    val: "${cliActiveStep?.action?.substring(0,40)}"\n  }]\n  timestamp: ${Date.now()}\n}`}
                    </pre>
                  )}
                  {cliTab === "syslog" && (
                    <pre style={{ background: "#0a0f1a", color: "#fbbf24", padding: 10, fontSize: 9, borderRadius: 4, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.5, border: "1px solid #1e3a5f" }}>
                      {`${new Date().toISOString()} NOTICE ran-sim[1]: [${cliActiveStep?.phase}] ${cliActiveStep?.system}: ${cliActiveStep?.action} — OK`}
                    </pre>
                  )}
                </div>
              )
            ) : (
              <>
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
                              <div style={{ marginTop: 2 }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                  <span style={{ color: "#3a4a5f", fontSize: 9, textDecoration: "line-through" }}>
                                    {scenario.metrics.before[i][1]}
                                  </span>
                                  <span style={{ color: "#64748b", fontSize: 8 }}>→</span>
                                  <span style={{ color: scenarioColor, fontWeight: 700, fontSize: 10 }}>
                                    <AnimatedCounter
                                      fromStr={scenario.metrics.before[i][1]}
                                      toStr={afterVal}
                                      active={runState === "done"}
                                    />
                                  </span>
                                  {scenario.metrics.confidence?.[i] && (
                                    <span
                                      style={{ color: "#475569", fontSize: 9, marginLeft: 3 }}
                                      title="95th percentile · 100 Monte Carlo runs"
                                    >
                                      ± {scenario.metrics.confidence[i]}
                                    </span>
                                  )}
                                </div>
                                <MiniSparkline
                                  fromStr={scenario.metrics.before[i][1]}
                                  toStr={afterVal}
                                />
                              </div>
                            ) : (
                              <div style={{ marginTop: 2 }}>
                                <div style={{ color: changed ? scenarioColor : "#94a3b8", fontWeight: changed ? 700 : 400, fontSize: 10, transition: "color 0.4s" }}>
                                  {v}
                                </div>
                                {stepIndex > 0 && (
                                  <MiniSparkline
                                    fromStr={scenario.metrics.before[i][1]}
                                    toStr={scenario.metrics.after[i][1]}
                                  />
                                )}
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
