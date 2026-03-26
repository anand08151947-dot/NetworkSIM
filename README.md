# 🌟 North Star Fiber — ISP Network Simulation Dashboard

An interactive, NOC-grade simulation dashboard for a NorthStar fiber
optic ISP. Built with **React 19 + Vite + React Flow + Nivo + Recharts + React Three Fiber + Leaflet**.

> Simulates the end-to-end network stack of a real fiber ISP — from ONT at the
> customer premises, through OLTs, aggregation switches, BNG, MPLS core, and
> border routers — with live provisioning flows, fault injection, geographic
> maps, analytics, a full **4G/5G RAN Planning module**, and a **12-scenario O-RAN Planning suite**.

**Architected by [Anand Ranade](https://github.com/anand08151947-dot) · Co-Built using [GitHub Copilot](https://github.com/features/copilot)**

---

## ✨ Features

### 🗺️ Network Topology (Interactive Canvas)
- **30+ nodes** across 7 network layers: Customer Premises → Access → IP Services → Transport → Core → Management → OSS/BSS
- Animated traffic edges with live utilization labels
- **Layer visibility filter** — toggle individual layers on/off to reduce visual noise
- **Search & highlight** — type a node name to zoom and pulse-highlight it on the canvas
- **Blast radius** — click any node to see which customers and downstream nodes would be impacted by a failure
- **Double-click expand** — full detail overlay with live metrics, 24h chart, and config snippet
- **Compact mode** — declutter edges for cleaner presentation view

### ⚡ Simulations (8 Provisioning Flows)
| Simulation | Description |
|-----------|-------------|
| Add Residential Customer | ONT → OLT → BNG → RADIUS → DHCP provisioning flow |
| Upgrade Service Tier | 1G → 2G → 5G bandwidth profile change |
| Add Small Business | SMB with dedicated VLAN + QoS policy |
| Add Mid-Market | Multi-site EVC with SLA |
| Capacity Augment | NetBox triggers capacity expansion at 40% threshold |
| Provision EVC | Ethernet Virtual Circuit across MPLS PE nodes |
| Provision DWDM Wave | Optical wavelength turn-up on Ciena ROADM |
| OTN Protection Switch | Automatic failover on fiber cut |

- **Simulation speed control:** 0.5× → 1× → 2× → 5×
- **Affected nodes highlight in yellow** as the flow progresses step-by-step
- **Config Generator** produces node-specific, simulation-aware CLI/API configs for every node type (Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox REST, RADIUS, DHCP, BGP, etc.)
- **AI Runbook** — auto-generated runbook with commands for each active simulation
- **What-If Capacity Planner** — drag to add customers, see which nodes saturate first

### 🔴 Fault Injection (5 Fault Scenarios)
| Fault | Affected Path |
|-------|--------------|
| Fiber Cut | OLT → AGG switch path goes red |
| OLT Crash | All ONTs on OLT-1 lose connectivity |
| DDoS Attack | Scrubber center activates; traffic reroutes |
| BGP Session Drop | Border router peers withdrawn; BGP tab updates |
| CO Power Outage | Central Office equipment goes dark |

Auto-healing events fire after each fault resolves (green remediation steps).

### 🌍 Geographic Map
- NorthStar Leaflet map with CO locations, fiber routes, and customer density
- Zoom-reactive: fiber paths, CO markers, and region overlays appear as you zoom
- Bandwidth heatmap overlay showing demand by region

### 📡 RAN Planning (4G / 5G NSA / 5G SA)

A NOC-grade RAN Planning module covering the full 4G→5G NSA→SA dual-stack lifecycle:

**13 Function Sub-Tabs:**
| Tab | Description |
|-----|-------------|
| 🗺️ Zones | Zone health map — SINR, QoE, load, anchor dependency per zone |
| 📊 Capacity | Demand model + Super Bowl peak event simulator (4-phase animated) |
| 📡 Interference | Emergent interference detector — co-channel, adjacent, pilot pollution |
| 🔧 MIMO | Massive MIMO beam config — 64T64R, null-steering, MU-MIMO |
| 😊 QoE | Per-zone QoE scoring with anchor flip root cause diagnosis |
| 🤖 SON | SON policy envelope — MLB, MRO, CCO, Self-Healing toggles |
| ♻️ Lifecycle | Future-resilience scorecard — 9 technology/regulatory/market scenarios |
| 🔢 Spectrum | Band inventory, PCI assignment validator, interference matrix |
| 🏙️ HetNet | Small cell parent-child dependency with interference constraint |
| 🔄 Handover | A1–B2 event threshold table with live apply + NSA→SA cutover simulator |
| 🍰 Slicing | Progressive eMBB/URLLC/mMTC activation map (design once, activate zone by zone) |
| 🏗️ Acquisition | 4-gate feasibility validator (Physical/Structural/Legal/Commercial) with gate re-evaluation |
| 🚗 Drive Test | Model vs. field Δ routing: archive / auto-calibrate / escalate with investigate flow |

**9 Animated Scenario Simulations:**
| Scenario | Visualization |
|----------|---------------|
| 🔧 Massive MIMO & 3D Beamforming | **React Three Fiber 3D** animated beam fan — null-steering, MU-MIMO rank |
| 🍰 Network Slicing & SLA Stress-Test | Slice bar chart — eMBB/URLLC/mMTC SLA breach/recovery |
| 🤖 AI-RAN Training & Model Validation | Neural net node graph — shadow mode → live deploy |
| 🌐 Edge-Compute & Tromboning Analysis | Traffic flow diagram — trombone detection + breakout |
| 📍 Indoor Positioning (Industrial 5G) | Anchor + UE grid — PRS multilateration accuracy |
| 🏙️ Beamforming Ray Tracing | **React Three Fiber 3D** urban geometry + ray traces → SINR heat map |
| 🚆 Handover Storm — High-Speed Rail | Animated UE on rail corridor — ping-pong storm → MRO fix |
| 📉 Cell Failure & SON Self-Healing | Radial bloom expansion — neighbor CCO recovery in 38.5s |
| 📻 Dynamic Spectrum Sharing (DSS) | Animated PRB grid — LTE/NR coexistence + CRS-IC |

Each scenario has: step-by-step engine, SVG/3D visualization, live metrics, and before/after comparison table.

---

### 🔭 O-RAN Planning (12-Scenario Open RAN Suite) ← **New in v3.0**

A carrier-grade **O-RAN Alliance simulation suite** covering the full O-RAN architecture stack from SMO/MANO down through Non-RT RIC, Near-RT RIC, O-CU, O-DU, and O-RU with Open Fronthaul.

**12 Simulation Scenarios:**
| ID | Scenario | Highlights |
|----|----------|------------|
| SIM-01 | **RIC Traffic Steering** (MLB xApp closed-loop) | Hex cell cluster with animated A1/E2 steering arrows |
| SIM-02 | **AI-Driven RRM Scheduler** (GNN proportional-fair) | PRB grid before/after + GNN training convergence curve |
| SIM-03 | **DSS + CBRS Spectrum Sharing** | LTE frame structure + NR MBSFN slots + CBRS SAS grant strip |
| SIM-04 | **O-RU Energy Benchmarking** (symbol blanking, NETCONF) | Power timeline with sleep events + Recharts area chart |
| SIM-05 | **NTN LEO Handover + Doppler Compensation** | **React Three Fiber 3D** orbital scene — LEO arc, Doppler curve |
| SIM-06 | **Zero-Touch Provisioning** (SMO intent → NETCONF) | 5-layer O-RAN architecture stack + animated protocol flows |
| SIM-07 | **Anomaly Detection & Bayesian Root Cause Inference** | Causal tree with posterior probabilities + KPI timeline |
| SIM-08 | **Digital Twin RAN** (shadow mode + what-if) | Dual live/twin panels — divergence detection + what-if |
| SIM-09 | **ISAC — Range-Doppler Sensing + Object Tracking** | Sensor grid heatmap with track overlay |
| SIM-10 | **CAPEX/ROI Site Selection** (NPV/IRR) | Site ranking badges + SVG cashflow waterfall with break-even |
| SIM-11 | **IIoT/URLLC P99.999 Reliability Planner** | Factory floor SVG + SLA compliance CDF chart |
| SIM-12 | **Microwave Backhaul Fade Margin + ACM Fallback** | Link budget chart + ACM modulation fallback timeline |

**Key UX features:**
- **Collapsible right panel** (same pattern as Network Topology) — keeps full width for the visualization canvas
- **Phase progress tracker** — animated step badges (SENSE → CATALOG → CONFIGURE → ACTIVATE → VALIDATE)
- **Per-step CLI/NETCONF/gNMI payloads** — vendor-accurate configs for Nokia, Ciena, Cisco, Juniper, Ericsson
- **Spec references** — O-RAN Alliance, 3GPP, ITU-T document links per scenario
- **Help modal** (`?`) — covers all 12 scenarios with theory, objectives, and run instructions
- **Nivo charts + React Three Fiber 3D** — richer animated visualizations than D3

---

### 📊 Analytics Tabs
| Tab | Contents |
|-----|---------|
| **Customers** | Full customer database with tier, service, SLA, and revenue |
| **Revenue** | MRR by tier, churn rate, ARPU, growth projections |
| **SLA** | Per-customer SLA compliance, uptime %, credits owed |
| **BGP & Security** | Live BGP route table, security event log, DDoS alerts |
| **IPAM** | IP address manager — subnet tree, pool utilization, VLAN table |
| **Audit Log** | Git-style timeline of every provisioning/fault/augmentation event |
| **Traffic Engineering** | MPLS TE tunnel utilization + inter-POP traffic matrix heatmap |

### 🎬 Simulation Recording
- **🎥 WebM Video** — records the topology canvas via MediaRecorder/VP9; auto-downloads when the simulation ends
- **🎞️ Animated GIF** — frame-by-frame PNG capture → gifshot encoder → shareable GIF
- Auto-stops when the simulation completes

### 🧑‍💻 Multi-Role Views
Switch between **NOC Engineer / Sales Engineer / Executive / Field Tech** — each
role reconfigures the dashboard to show the most relevant panels.

### 📡 Live NOC Ticker
Scrolling alert feed at the bottom of the screen streaming real-time events:
OLT port flaps, BNG session anomalies, CGNAT pool utilization, BGP prefix withdrawals.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (v22 recommended)
- **npm 9+** (v10 recommended)

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full system requirements, all
package versions, and browser compatibility notes.

### Install & Run

**Using the PowerShell helper scripts (recommended on Windows):**

```powershell
# Install / update dependencies
.\install.ps1

# Completely clean reinstall (removes node_modules first)
.\install.ps1 -Clean

# Start the dev server on the default port (5173)
.\start.ps1

# Start on a custom port
.\start.ps1 -Port 3000
```

`install.ps1` verifies Node.js (v18 minimum, v22 recommended) and npm are present,
runs `npm install`, and confirms all key packages were installed successfully.  
`start.ps1` kills any stale Node/Vite processes, frees the target port, checks that
`node_modules` exists (auto-installs if not), then launches the Vite dev server.
The app is reachable at **http://localhost:5173** (or whichever port you chose).

**Manual npm commands (cross-platform):**

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Build for Production

```bash
npm run build
# Output in dist/

npm run preview   # Preview the built app locally
```

### Build Electron Desktop App

```powershell
# Build portable Windows EXE (versioned)
.\build-release.ps1 -Version 3.0.0

# Output: dist-electron\NorthStarFiber-Simulator-Portable-3.0.0.exe
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Topology Canvas | [@xyflow/react](https://reactflow.dev) v12 |
| Charts | [Recharts](https://recharts.org) v3 · [Nivo](https://nivo.rocks) v0.88 · [D3.js](https://d3js.org) v7 |
| 3D Scenes | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) v9 + [Drei](https://github.com/pmndrs/drei) v10 + [Three.js](https://threejs.org) v0.183 |
| Geographic Map | [React Leaflet](https://react-leaflet.js.org) v5 + Leaflet v1.9 |
| Tables | [@tanstack/react-table](https://tanstack.com/table) v8 |
| Icons | [Lucide React](https://lucide.dev) |
| Recording | [html-to-image](https://github.com/bubkoo/html-to-image) + [gifshot](https://github.com/Yahoo/gifshot) |
| Excel Export | [xlsx](https://sheetjs.com) |
| Build | Vite 8 (Rolldown) |
| Linting | ESLint 9 |

---

## 📁 Project Structure

```
src/
├── App.jsx                     # Root: all state, simulation engine, tab routing
├── components/
│   ├── NetworkNode.jsx          # Custom React Flow node with live metrics
│   ├── TrafficEdge.jsx          # Animated edge with utilization labels
│   ├── UIComponents.jsx         # Shared: CollapsiblePanel, EventLog, StatsBar
│   ├── SimRecorder.jsx          # WebM/GIF recording toolbar button
│   ├── NOCTicker.jsx            # Live alert ticker
│   ├── NodeExpandModal.jsx      # Double-click node detail overlay
│   ├── HelpModal.jsx            # Per-tab help modal (topology/geo/circuit/ran/oran)
│   ├── charts/CapacityChart.jsx
│   ├── panels/                  # AIRunbook, ConfigGenerator, FaultInjector…
│   └── tabs/
│       ├── ORANTab.jsx          # O-RAN Planning — 12 O-RAN simulation scenarios
│       ├── RANPlanningTab.jsx   # 4G/5G RAN Planning — 13 function sub-tabs
│       ├── RANScenariosPanel.jsx # 9 animated RAN scenario simulations (incl. R3F 3D)
│       ├── Scenes3D.jsx         # React Three Fiber 3D scenes (NTN orbit, MIMO, Ray Trace)
│       └── …                   # GeoMap, Customer, Revenue, SLA, BGP, IPAM…
├── data/
│   ├── networkTopology.js       # Nodes, edges, 8 simulation flows
│   ├── faultScenarios.js        # 5 fault scenarios
│   ├── customers.js             # Simulated customer database
│   ├── geoData.js               # PNW CO locations + fiber routes
│   └── configTemplates.js       # Per-node CLI/API config generators (20+ types)
└── utils/
    ├── mockApi.js               # Simulated NetBox/RADIUS/DHCP/CRM API
    ├── scenarioManager.js       # Scenario state helpers
    └── exportUtils.js           # XLSX/CSV export
```

---

## 📋 License

Licensed under the **[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)**.

You are free to:
- **Use** — run the app for any purpose (personal, educational, commercial)
- **Modify** — adapt the source code to your own needs
- **Distribute** — share original or modified versions

Under the following conditions:
- Include the original `LICENSE` file and copyright notice in any distribution
- State any significant changes made to the source files
- Do not use the project name or contributors' names for endorsement without permission

> Apache 2.0 also provides an express **patent grant** from contributors to users,
> making it a safe choice for organisations deploying or building on this project.


---

## ✨ Features

### 🗺️ Network Topology (Interactive Canvas)
- **30+ nodes** across 7 network layers: Customer Premises → Access → IP Services → Transport → Core → Management → OSS/BSS
- Animated traffic edges with live utilization labels
- **Layer visibility filter** — toggle individual layers on/off to reduce visual noise
- **Search & highlight** — type a node name to zoom and pulse-highlight it on the canvas
- **Blast radius** — click any node to see which customers and downstream nodes would be impacted by a failure
- **Double-click expand** — full detail overlay with live metrics, 24h chart, and config snippet
- **Compact mode** — declutter edges for cleaner presentation view

### ⚡ Simulations (8 Provisioning Flows)
| Simulation | Description |
|-----------|-------------|
| Add Residential Customer | ONT → OLT → BNG → RADIUS → DHCP provisioning flow |
| Upgrade Service Tier | 1G → 2G → 5G bandwidth profile change |
| Add Small Business | SMB with dedicated VLAN + QoS policy |
| Add Mid-Market | Multi-site EVC with SLA |
| Capacity Augment | NetBox triggers capacity expansion at 40% threshold |
| Provision EVC | Ethernet Virtual Circuit across MPLS PE nodes |
| Provision DWDM Wave | Optical wavelength turn-up on Ciena ROADM |
| OTN Protection Switch | Automatic failover on fiber cut |

- **Simulation speed control:** 0.5× → 1× → 2× → 5×
- **Affected nodes highlight in yellow** as the flow progresses step-by-step
- **Config Generator** produces node-specific, simulation-aware CLI/API configs for every node type (Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox REST, RADIUS, DHCP, BGP, etc.)
- **AI Runbook** — auto-generated runbook with commands for each active simulation
- **What-If Capacity Planner** — drag to add customers, see which nodes saturate first

### 🔴 Fault Injection (5 Fault Scenarios)
| Fault | Affected Path |
|-------|--------------|
| Fiber Cut | OLT → AGG switch path goes red |
| OLT Crash | All ONTs on OLT-1 lose connectivity |
| DDoS Attack | Scrubber center activates; traffic reroutes |
| BGP Session Drop | Border router peers withdrawn; BGP tab updates |
| CO Power Outage | Central Office equipment goes dark |

Auto-healing events fire after each fault resolves (green remediation steps).

### 🌍 Geographic Map
- NorthStar Leaflet map with CO locations, fiber routes, and customer density
- Zoom-reactive: fiber paths, CO markers, and region overlays appear as you zoom
- Bandwidth heatmap overlay showing demand by region

### 📡 RAN Planning (4G / 5G NSA / 5G SA)

A NOC-grade RAN Planning module covering the full 4G→5G NSA→SA dual-stack lifecycle:

**13 Function Sub-Tabs:**
| Tab | Description |
|-----|-------------|
| 🗺️ Zones | Zone health map — SINR, QoE, load, anchor dependency per zone |
| 📊 Capacity | Demand model + Super Bowl peak event simulator (4-phase animated) |
| 📡 Interference | Emergent interference detector — co-channel, adjacent, pilot pollution |
| 🔧 MIMO | Massive MIMO beam config — 64T64R, null-steering, MU-MIMO |
| 😊 QoE | Per-zone QoE scoring with anchor flip root cause diagnosis |
| 🤖 SON | SON policy envelope — MLB, MRO, CCO, Self-Healing toggles |
| ♻️ Lifecycle | Future-resilience scorecard — 9 technology/regulatory/market scenarios |
| 🔢 Spectrum | Band inventory, PCI assignment validator, interference matrix |
| 🏙️ HetNet | Small cell parent-child dependency with interference constraint |
| 🔄 Handover | A1–B2 event threshold table with live apply + NSA→SA cutover simulator |
| 🍰 Slicing | Progressive eMBB/URLLC/mMTC activation map (design once, activate zone by zone) |
| 🏗️ Acquisition | 4-gate feasibility validator (Physical/Structural/Legal/Commercial) with gate re-evaluation |
| 🚗 Drive Test | Model vs. field Δ routing: archive / auto-calibrate / escalate with investigate flow |

**9 Animated Scenario Simulations:**
| Scenario | Visualization |
|----------|---------------|
| 🔧 Massive MIMO & 3D Beamforming | Animated beam fan — null-steering, MU-MIMO rank |
| 🍰 Network Slicing & SLA Stress-Test | Slice bar chart — eMBB/URLLC/mMTC SLA breach/recovery |
| 🤖 AI-RAN Training & Model Validation | Neural net node graph — shadow mode → live deploy |
| 🌐 Edge-Compute & Tromboning Analysis | Traffic flow diagram — trombone detection + breakout |
| 📍 Indoor Positioning (Industrial 5G) | Anchor + UE grid — PRS multilateration accuracy |
| 🏙️ Beamforming Ray Tracing | Urban geometry + 50K ray traces → SINR heat map |
| 🚆 Handover Storm — High-Speed Rail | Animated UE on rail corridor — ping-pong storm → MRO fix |
| 📉 Cell Failure & SON Self-Healing | Radial bloom expansion — neighbor CCO recovery in 38.5s |
| 📻 Dynamic Spectrum Sharing (DSS) | Animated PRB grid — LTE/NR coexistence + CRS-IC |

Each scenario has: step-by-step engine, SVG/3D visualization, live metrics, and before/after comparison table.

---

### 🔭 O-RAN Planning (12-Scenario Open RAN Suite) ← **New in v3.0**

A carrier-grade **O-RAN Alliance simulation suite** covering the full O-RAN architecture stack from SMO/MANO down through Non-RT RIC, Near-RT RIC, O-CU, O-DU, and O-RU with Open Fronthaul.

**12 Simulation Scenarios:**
| ID | Scenario | Highlights |
|----|----------|------------|
| SIM-01 | **RIC Traffic Steering** (MLB xApp closed-loop) | Hex cell cluster with animated A1/E2 steering arrows |
| SIM-02 | **AI-Driven RRM Scheduler** (GNN proportional-fair) | PRB grid before/after + GNN training convergence curve |
| SIM-03 | **DSS + CBRS Spectrum Sharing** | LTE frame structure + NR MBSFN slots + CBRS SAS grant strip |
| SIM-04 | **O-RU Energy Benchmarking** (symbol blanking, NETCONF) | Power timeline with sleep events + Recharts area chart |
| SIM-05 | **NTN LEO Handover + Doppler Compensation** | **React Three Fiber 3D** orbital scene — LEO arc, Doppler curve |
| SIM-06 | **Zero-Touch Provisioning** (SMO intent → NETCONF) | 5-layer O-RAN architecture stack + animated protocol flows |
| SIM-07 | **Anomaly Detection & Bayesian Root Cause Inference** | Causal tree with posterior probabilities + KPI timeline |
| SIM-08 | **Digital Twin RAN** (shadow mode + what-if) | Dual live/twin panels — divergence detection + what-if |
| SIM-09 | **ISAC — Range-Doppler Sensing + Object Tracking** | Sensor grid heatmap with track overlay |
| SIM-10 | **CAPEX/ROI Site Selection** (NPV/IRR) | Site ranking badges + SVG cashflow waterfall with break-even |
| SIM-11 | **IIoT/URLLC P99.999 Reliability Planner** | Factory floor SVG + SLA compliance CDF chart |
| SIM-12 | **Microwave Backhaul Fade Margin + ACM Fallback** | Link budget chart + ACM modulation fallback timeline |

**Key UX features:**
- **Collapsible right panel** — keeps full width for visualization canvas (same pattern as Network Topology)
- **Phase progress tracker** — animated step badges per scenario
- **Per-step CLI/NETCONF/gNMI payloads** — vendor-accurate configs for Nokia, Ciena, Cisco, Juniper, Ericsson
- **Spec references** — O-RAN Alliance, 3GPP, ITU-T document links per scenario
- **Help modal** (`?`) — covers all 12 scenarios with theory, objectives, and run instructions

---

### 📊 Analytics Tabs
| Tab | Contents |
|-----|---------|
| **Customers** | Full customer database with tier, service, SLA, and revenue |
| **Revenue** | MRR by tier, churn rate, ARPU, growth projections |
| **SLA** | Per-customer SLA compliance, uptime %, credits owed |
| **BGP & Security** | Live BGP route table, security event log, DDoS alerts |
| **IPAM** | IP address manager — subnet tree, pool utilization, VLAN table |
| **Audit Log** | Git-style timeline of every provisioning/fault/augmentation event |
| **Traffic Engineering** | MPLS TE tunnel utilization + inter-POP traffic matrix heatmap |

### 🎬 Simulation Recording
- **🎥 WebM Video** — records the topology canvas via MediaRecorder/VP9; auto-downloads when the simulation ends
- **🎞️ Animated GIF** — frame-by-frame PNG capture → gifshot encoder → shareable GIF
- Auto-stops when the simulation completes

### 🧑‍💻 Multi-Role Views
Switch between **NOC Engineer / Sales Engineer / Executive / Field Tech** — each
role reconfigures the dashboard to show the most relevant panels.

### 📡 Live NOC Ticker
Scrolling alert feed at the bottom of the screen streaming real-time events:
OLT port flaps, BNG session anomalies, CGNAT pool utilization, BGP prefix withdrawals.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (v22 recommended)
- **npm 9+** (v10 recommended)

See [`REQUIREMENTS.md`](./REQUIREMENTS.md) for the full system requirements, all
package versions, and browser compatibility notes.

### Install & Run

**Using the PowerShell helper scripts (recommended on Windows):**

```powershell
# Install / update dependencies
.\install.ps1

# Completely clean reinstall (removes node_modules first)
.\install.ps1 -Clean

# Start the dev server on the default port (5173)
.\start.ps1

# Start on a custom port
.\start.ps1 -Port 3000
```

`install.ps1` verifies Node.js (v18 minimum, v22 recommended) and npm are present,
runs `npm install`, and confirms all key packages were installed successfully.  
`start.ps1` kills any stale Node/Vite processes, frees the target port, checks that
`node_modules` exists (auto-installs if not), then launches the Vite dev server.
The app is reachable at **http://localhost:5173** (or whichever port you chose).

**Manual npm commands (cross-platform):**

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Build for Production

```bash
npm run build
# Output in dist/

npm run preview   # Preview the built app locally
```

### Build Electron Desktop App

```powershell
# Build portable Windows EXE (versioned)
.\build-release.ps1 -Version 3.0.0

# Output: dist-electron\NorthStarFiber-Simulator-Portable-3.0.0.exe
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Topology Canvas | [@xyflow/react](https://reactflow.dev) v12 |
| Charts | [Recharts](https://recharts.org) v3 · [Nivo](https://nivo.rocks) v0.88 · [D3.js](https://d3js.org) v7 |
| 3D Scenes | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) v9 + [Drei](https://github.com/pmndrs/drei) v10 + [Three.js](https://threejs.org) v0.183 |
| Geographic Map | [React Leaflet](https://react-leaflet.js.org) v5 + Leaflet v1.9 |
| Tables | [@tanstack/react-table](https://tanstack.com/table) v8 |
| Icons | [Lucide React](https://lucide.dev) |
| Recording | [html-to-image](https://github.com/bubkoo/html-to-image) + [gifshot](https://github.com/Yahoo/gifshot) |
| Excel Export | [xlsx](https://sheetjs.com) |
| Build | Vite 8 (Rolldown) |
| Linting | ESLint 9 |

---

## 📁 Project Structure

```
src/
├── App.jsx                     # Root: all state, simulation engine, tab routing
├── components/
│   ├── NetworkNode.jsx          # Custom React Flow node with live metrics
│   ├── TrafficEdge.jsx          # Animated edge with utilization labels
│   ├── UIComponents.jsx         # Shared: CollapsiblePanel, EventLog, StatsBar
│   ├── SimRecorder.jsx          # WebM/GIF recording toolbar button
│   ├── NOCTicker.jsx            # Live alert ticker
│   ├── NodeExpandModal.jsx      # Double-click node detail overlay
│   ├── HelpModal.jsx            # Per-tab help modal (topology/geo/circuit/ran/oran)
│   ├── charts/CapacityChart.jsx
│   ├── panels/                  # AIRunbook, ConfigGenerator, FaultInjector…
│   └── tabs/
│       ├── ORANTab.jsx          # O-RAN Planning — 12 O-RAN simulation scenarios
│       ├── RANPlanningTab.jsx   # 4G/5G RAN Planning — 13 function sub-tabs
│       ├── RANScenariosPanel.jsx # 9 animated RAN scenario simulations (incl. R3F 3D)
│       ├── Scenes3D.jsx         # React Three Fiber 3D scenes (NTN orbit, MIMO, Ray Trace)
│       └── …                   # GeoMap, Customer, Revenue, SLA, BGP, IPAM…
├── data/
│   ├── networkTopology.js       # Nodes, edges, 8 simulation flows
│   ├── faultScenarios.js        # 5 fault scenarios
│   ├── customers.js             # Simulated customer database
│   ├── geoData.js               # PNW CO locations + fiber routes
│   └── configTemplates.js       # Per-node CLI/API config generators (20+ types)
└── utils/
    ├── mockApi.js               # Simulated NetBox/RADIUS/DHCP/CRM API
    ├── scenarioManager.js       # Scenario state helpers
    └── exportUtils.js           # XLSX/CSV export
```

---

## 📋 License

Licensed under the **[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)**.

You are free to:
- **Use** — run the app for any purpose (personal, educational, commercial)
- **Modify** — adapt the source code to your own needs
- **Distribute** — share original or modified versions

Under the following conditions:
- Include the original `LICENSE` file and copyright notice in any distribution
- State any significant changes made to the source files
- Do not use the project name or contributors' names for endorsement without permission

> Apache 2.0 also provides an express **patent grant** from contributors to users,
> making it a safe choice for organisations deploying or building on this project.

