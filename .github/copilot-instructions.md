# GitHub Copilot – Workspace Instructions
# NorthStar Fiber / NetworkSIM — ISP Network Simulation Dashboard

> This file provides persistent context to GitHub Copilot for every session in
> this repository. Keep it updated as the project evolves.
> Last updated: 2026-03-21

---

## 🗂️ Project Identity

| Field | Value |
|-------|-------|
| **Repo name** | `NetworkSIM` |
| **GitHub** | https://github.com/anand08151947-dot/NetworkSIM |
| **Default branch** | `main` |
| **Active PR branch** | `feature/circuit-planner-tab` → PR #1 (open) |
| **Author** | Anand Ranade (`anand08151947-dot`) |
| **License** | Apache 2.0 |
| **Status** | Active development |

---

## 🎯 What This Project Is

A **NOC-grade, fully client-side ISP network simulation dashboard** modeling
the complete network stack of a hypothetical fiber ISP called *NorthStar Fiber*.
There is **no backend** — all data, simulations, and state are in-memory React
state seeded from static JS data files.

### Currently Visible Tabs (3 active, others hidden)

| Tab | Description |
|-----|-------------|
| 🗺️ Network Topology | Interactive 30+ node React Flow canvas, 7 network layers, simulation engine |
| 🌐 Geographic Map | React Leaflet PNW map of Central Offices and fiber routes |
| 📡 Circuit Planner | Carrier-grade Telco circuit orchestration simulator (see below) |

### Hidden Tabs (exist in codebase, commented out in TABS array in App.jsx)
Revenue & Analytics · SLA Tracker · BGP & Security · IPAM · Audit Log · Traffic Engineering · Customer Database

### Core Features
- **Interactive 30+ node topology** (React Flow canvas) spanning 7 network layers
- **8 provisioning simulation flows** with step-by-step animated highlighting
- **5 fault injection scenarios** with auto-healing remediation events
- **Geographic Leaflet map** of PNW Central Offices and fiber routes
- **Simulation recording** — exports WebM video or animated GIF of the topology
- **Multi-role views** — NOC Engineer, Sales Engineer, Executive, Field Tech
- **Config Generator** — produces real-device CLI/API configs (Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox, RADIUS, DHCP, BGP)
- **AI Runbook** panel — auto-generates NOC runbook for the active simulation

---

## 📡 Circuit Planner Tab — Detailed Architecture

The Circuit Planner is the primary active development area. It is a fully
self-contained carrier-grade Telco circuit creation simulator.

### Features
- **Service order wizard** — circuit type, A/Z sites, bandwidth, protection, SLA tier
- **8-phase simulation engine** — animates through all carrier planning phases
- **Equipment chain visualizer** — animated A→Z vendor device chain (7 vendors)
- **Optical budget calculator** — real dB math for DWDM/Wave circuits
- **Step-level live config generator** — per-step vendor-accurate CLI/API configs
- **Clickable completed steps** — pin any ✅ step to explore its config post-simulation
- **Config / Payload / Log tabs** — per step: CLI config, HTTP/NETCONF/gNMI payload, syslog audit trail
- **Inventory scoreboard** — animated capacity bars (fiber, ports, VLANs, labels, IPs, transceivers)
- **Feasibility gates** — pass/fail gates with augmentation recommendations
- **Path map** — Leaflet A-Z route map with working + protection paths
- **Activation test panel** — RFC 2544 / Y.1564 animated test runner
- **XLSX export** — 3-sheet circuit report (Summary, Inventory, Feasibility Gates)
- **Session circuit registry** — history of all circuits planned in the session
- **5 inner sub-tabs**: 📋 Simulation · 🗄 Inventory · 🗺 Path Map · ✅ Tests · ⚙️ Configs

### Circuit Types Supported
L3VPN · EVC/E-LINE · DIA Internet · Wave/DWDM · Mobile Backhaul · DCI

### Equipment Stack (vendor-accurate)
- **CE**: Cisco ISR 4331, Juniper SRX 345, Cisco Catalyst 8300
- **Metro Agg**: Nokia 7210 SAS, Cisco ASR 920
- **PE Router**: Cisco ASR 9001, Juniper MX960, Nokia 7750 SR
- **Optical**: Ciena 6500 DWDM, Infinera DTN-X, Nokia 1830 PSS
- **Access**: Nokia 7360 ISAM OLT, Calix E7 OLT
- **DC/Spine**: Arista 7000, Cisco Nexus 9000

### Simulation Inner Tab Layout (Simulation sub-tab)
```
┌─── Step Log (55%) ─────────────────┬─── Live Config (45%) ────────────────────┐
│ [Phase 1✅][Phase 2✅][Phase 6🔄]   │  System badge | action | STEP CONFIG 🟢  │
│                                    │  [⚙️ Config] [📤 Payload] [📋 Log]        │
│ ✅ timestamp  System  action        │  ─────────────────────────────────────   │
│    step detail (shown when done)   │  <vendor-accurate config / payload / log> │
│                                    │                                  [Copy]   │
│ ✅ (click any ✅ to pin) 📌 PINNED  │  📌 PINNED / 🔴 LIVE / ✅ DONE header     │
│    ...                             │  [✕ Unpin] button when pinned            │
└────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 🏗️ Tech Stack (Exact Installed Versions)

| Layer | Package | Version |
|-------|---------|---------|
| Framework | `react` | 19.2.4 |
| Framework | `react-dom` | 19.2.4 |
| Build tool | `vite` | 8.0.0 (Rolldown-based) |
| Topology canvas | `@xyflow/react` | 12.10.1 |
| Charts | `recharts` | 3.8.0 |
| Charts (low-level) | `d3` | 7.9.0 |
| Geographic map | `leaflet` | 1.9.4 |
| Geographic map | `react-leaflet` | 5.0.0 |
| Tables | `@tanstack/react-table` | 8.21.3 |
| Icons | `lucide-react` | 0.577.0 |
| Screen capture | `html-to-image` | 1.11.13 |
| GIF encoding | `gifshot` | 0.4.5 |
| Excel export | `xlsx` | 0.18.5 |
| Linting | `eslint` | 9.39.4 |
| React plugin (Vite) | `@vitejs/plugin-react` | 6.0.1 |

---

## 🖥️ Local Environment

| Property | Value |
|----------|-------|
| **OS** | Windows 11 (PowerShell 7) |
| **Node.js** | v22.14.0 |
| **npm** | v10.9.2 |
| **Dev server port** | 5173 (strictPort — fails fast if busy) |
| **Dev server URL** | http://localhost:5173 |
| **node_modules** | Installed and up to date |

### Key Scripts

```powershell
.\install.ps1          # Install / update dependencies
.\install.ps1 -Clean   # Clean reinstall (removes node_modules first)
.\start.ps1            # Start dev server (kills stale Node/Vite, frees port)
.\start.ps1 -Port 3000 # Start on a custom port
```

```bash
npm install     # install deps
npm run dev     # start Vite dev server (port 5173)
npm run build   # production build → dist/
npm run preview # preview production build
npm run lint    # ESLint 9
```

---

## 📁 Full Source Tree

```
NetworkSIM/
├── .github/
│   └── copilot-instructions.md   ← YOU ARE HERE (keep updated)
├── .gitignore                    ← ignores: node_modules, dist, .env, *.webm, *.gif
├── index.html                    ← Vite HTML entrypoint (mounts #root)
├── vite.config.js                ← Vite + React plugin, port 5173 strictPort
├── eslint.config.js              ← ESLint 9 flat config (react-hooks, react-refresh)
├── package.json                  ← name: "networksim" (renamed from northstar-network-sim)
├── install.ps1                   ← Windows install helper with Node version checks
├── start.ps1                     ← Windows dev-server launcher
├── LICENSE                       ← Apache 2.0
├── README.md                     ← User-facing docs + feature matrix
├── REQUIREMENTS.md               ← Full system requirements + browser compat
├── public/
│   ├── favicon.svg               ← NorthStar brand icon
│   └── icons.svg                 ← SVG sprite sheet
└── src/
    ├── main.jsx                  ← React DOM root render
    ├── App.jsx                   ← MASTER FILE — all global state, simulation engine,
    │                               tab routing, layout. TABS array controls visibility.
    │                               3 tabs active; 7 hidden (commented out in TABS[]).
    ├── App.css                   ← Global CSS, dark NOC theme (#04080f bg), animations
    ├── index.css                 ← CSS reset / base
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── NetworkNode.jsx       ← Custom React Flow node (status, metrics, icons)
    │   ├── TrafficEdge.jsx       ← Animated React Flow edge with utilization % badge
    │   ├── UIComponents.jsx      ← Shared: CollapsiblePanel, EventLog, StatsBar,
    │   │                           RoleSelector, SimulationControls
    │   ├── SimRecorder.jsx       ← WebM (MediaRecorder/VP9) + GIF (gifshot) toolbar
    │   ├── NOCTicker.jsx         ← Scrolling live-alert ticker at screen bottom
    │   ├── NodeExpandModal.jsx   ← Double-click node → detail overlay (metrics, config)
    │   ├── charts/
    │   │   └── CapacityChart.jsx ← Recharts bar chart for capacity planning
    │   ├── panels/
    │   │   ├── AIRunbook.jsx     ← Auto-generated NOC runbook per simulation step
    │   │   ├── ConfigGenerator.jsx ← Device CLI/API config generator (topology tab)
    │   │   ├── FaultInjector.jsx ← Triggers one of 5 fault scenarios
    │   │   ├── LayerFilter.jsx   ← Toggle layer visibility on topology canvas
    │   │   └── WhatIfPlanner.jsx ← Drag-to-add customers, saturation analysis
    │   ├── tabs/
    │   │   ├── AuditTimelineTab.jsx      ← Git-style event timeline [HIDDEN]
    │   │   ├── BGPSecurityTab.jsx        ← BGP route table + DDoS log [HIDDEN]
    │   │   ├── CustomerTab.jsx           ← Customer database (@tanstack) [HIDDEN]
    │   │   ├── GeoMapTab.jsx             ← React Leaflet PNW map [VISIBLE]
    │   │   ├── IPAMTab.jsx               ← IP/VLAN/subnet management [HIDDEN]
    │   │   ├── RevenueTab.jsx            ← MRR, ARPU, churn charts [HIDDEN]
    │   │   ├── SLATab.jsx                ← Per-customer SLA compliance [HIDDEN]
    │   │   ├── TrafficEngineeringTab.jsx ← MPLS TE tunnels + heatmap [HIDDEN]
    │   │   └── CircuitPlannerTab.jsx     ← 📡 Circuit Planner [VISIBLE] (main dev focus)
    │   └── circuit/              ← Circuit Planner sub-components
    │       ├── CircuitWizard.jsx         ← Service order form
    │       ├── EquipmentChain.jsx        ← Animated A→Z vendor device chain
    │       ├── OpticalBudgetCalc.jsx     ← Real dB optical math (DWDM/Wave only)
    │       ├── PhaseStepper.jsx          ← 8-phase strip + clickable step log
    │       │                               Props: pinnedStep, onStepClick (new)
    │       ├── InventoryScoreboard.jsx   ← Animated capacity bars (8 resources)
    │       ├── FeasibilityGates.jsx      ← Pass/fail gate cards + augmentation hints
    │       ├── PathMap.jsx               ← Leaflet A-Z route map (working + protect)
    │       ├── ActivationTestPanel.jsx   ← RFC 2544 / Y.1564 animated test runner
    │       ├── DeviceConfigPanel.jsx     ← Device-level config viewer (⚙️ Configs tab)
    │       └── StepConfigViewer.jsx      ← Step-level live config panel (Simulation tab)
    │                                       Shows: Config / Payload / Log tabs per step
    ├── data/
    │   ├── networkTopology.js    ← 30+ node definitions (7 layers), edges,
    │   │                           8 simulation flow arrays
    │   ├── faultScenarios.js     ← 5 fault scenarios + auto-healing steps
    │   ├── customers.js          ← ~50 simulated customers (tier, MRR, SLA)
    │   ├── geoData.js            ← PNW lat/lng for COs, fiber routes, regions
    │   ├── configTemplates.js    ← 20+ device config generators (topology tab)
    │   ├── circuitPlans.js       ← Circuit Planner data: SITES, CIRCUIT_TYPES,
    │   │                           EQUIPMENT_STACKS, BANDWIDTH_OPTIONS,
    │   │                           PROTECTION_LEVELS, SLA_TIERS, PATH_ROUTES (15 pairs)
    │   │                           Builder fns: buildPhaseFlow, buildOpticalBudget,
    │   │                           buildInventorySnapshot, buildFeasibilityGates,
    │   │                           buildProtectionPaths, buildActivationTests
    │   ├── circuitConfigs.js     ← Device-level config generators for all 6 circuit
    │   │                           types × all vendors. getDeviceConfigs(idx, type, form, plan)
    │   ├── teConfigs.js          ← MPLS-TE tunnel configs (Cisco/Juniper/Nokia)
    │   │                           getTunnelConfigs(tunnel) → 3 vendor tabs
    │   ├── stepConfigs.js        ← Step-level config generator (30+ steps).
    │   │                           getStepConfig(step, form, plan) → {label, lang,
    │   │                           config, payload, payloadLang, log}
    │   │                           Uses {varName} template placeholders (NOT JS template literals)
    │   │                           buildCtx() derives all values from plan.orderId (base-36 seed)
    │   └── stepPayloads.js       ← Per-step payload + syslog log generators.
    │                               getStepPayload(step, form, plan) → {payload, payloadLang, log}
    │                               Payload types: HTTP REST, NETCONF XML RPC, gNMI SetRequest,
    │                               test instrument REST, SNMP trap config
    └── utils/
        ├── mockApi.js            ← Simulated async API calls (NetBox/RADIUS/DHCP)
        ├── scenarioManager.js    ← load/save/export scenario state helpers
        └── exportUtils.js        ← XLSX/CSV export using SheetJS
```

---

## 🧠 Architecture & Key Patterns

### State Management
- **All global state lives in `App.jsx`** — no Redux, Zustand, or Context API.
- State is passed down as props. `App.jsx` is the single source of truth.
- Topology simulation engine runs via `setInterval` in `App.jsx`.
- Circuit Planner simulation engine is **local state inside `CircuitPlannerTab.jsx`** using `async/await` with `setTimeout` — no setInterval.

### Tab System
- `TABS` array in `App.jsx` (around line 55) controls visible tabs.
- Hidden tabs are commented out in the array but all components remain imported/rendered.
- To re-enable a tab: uncomment its entry in the TABS array.
- To add a new tab: add to TABS + add `{activeTab === "id" && <MyTab />}` in the render.

### Circuit Planner Simulation Engine
- `handlePlan()` in `CircuitPlannerTab.jsx` — `async` function with `await delay(ms)` loop.
- `cancelRef.current = true` → `handleStop()` to abort mid-simulation.
- `speedRef.current` is set at render time (not in effect) to avoid stale closure issues.
- `pinnedStep` state overrides `activeStep` in `StepConfigViewer` — `pinnedStep ?? activeStep`.
- `resetSim()` clears all sim state including `pinnedStep`.

### Step Config System (stepConfigs.js + stepPayloads.js)
- **Key**: `step.action.toLowerCase().trim()` — must match exactly.
- **Template syntax**: `{varName}` placeholders replaced by `fill(template, ctx)`.
- **NEVER use JS template literals** (`${...}`) in template strings — breaks the fill() system.
- `buildCtx(form, plan)` — deterministic context from `plan.orderId` parsed as base-36 int.
- `getStepConfig()` returns `{ label, lang, config, payload, payloadLang, log }`.
- Falls back to device-level config (`getDeviceConfigs`) when no step config matches.

### ESLint Critical Rules
- **No `setState` in `useEffect` body** (synchronous) — use `useMemo` for derived state.
- Exception: `setState` inside `setTimeout`/`setInterval` callbacks within effects IS allowed.
- `speedRef.current = speed` at render top-level is allowed (ref mutation is not state).
- All `useEffect` deps arrays must be complete.
- No unused variables or imports.

### React Flow (Topology Canvas)
- `NetworkNode.jsx` — custom node renderer, 7+ node types.
- `TrafficEdge.jsx` — animated dashes + utilization % badge.
- `LayerFilter.jsx` — toggles which node groups are visible.

### Config Templates (Topology Tab)
- `src/data/configTemplates.js` — template functions keyed by node type.
- `ConfigGenerator.jsx` calls these with `(nodeId, simulationContext)`.

### Leaflet Maps
- `GeoMapTab.jsx` — full PNW map tab.
- `PathMap.jsx` — embedded Leaflet in Circuit Planner (A-Z working + protection path).
- Use `CircleMarker` only — no default Leaflet icons (avoids bundler icon path issues).
- `import 'leaflet/dist/leaflet.css'` must be present.

### No Backend
- `src/utils/mockApi.js` simulates all API calls with `setTimeout` delays.
- No `.env` file required — no real endpoints.

---

## 🔗 Git Context

| Item | Detail |
|------|--------|
| **Remote** | `origin` → https://github.com/anand08151947-dot/NetworkSIM.git |
| **Default branch** | `main` |
| **Active branch** | `feature/circuit-planner-tab` |
| **PR** | #1 open — Circuit Planner tab (all phases complete) |
| **HEAD commit** | `174fac8` — "feat: payload and provisioning log tabs in step config viewer" |
| **HEAD date** | 2026-03-21 |
| **Working tree** | Clean |

### Recent Commits (feature/circuit-planner-tab)
```
174fac8  feat: payload and provisioning log tabs in step config viewer
ec49635  feat: clickable step-pinning in Circuit Planner simulation
15fe5c7  feat: step-level live config generator in Circuit Planner simulation
3c79227  feat: show live config generator inline on Simulation tab
c796038  chore: hide Customer Database tab from nav
```

### Git Author Config
```
user.name  = Anand Ranade
user.email = anand08151947-dot@users.noreply.github.com
```

### Commit Trailer (always include)
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

### .gitignore Summary
Ignores: `node_modules/`, `dist/`, `.env*`, `*.log`, `*.webm`, `*.gif`,
`.DS_Store`, `Thumbs.db`, `.vscode/*` (except `extensions.json`, `settings.json`),
`.vite/`, `coverage/`.

---

## 🛠️ Coding Conventions

- **React functional components only** — no class components.
- **ESLint 9 flat config** with `react-hooks` and `react-refresh` plugins.
- **ES modules** (`"type": "module"`) — use `import`/`export`, never `require`.
- **Inline styles only** — no CSS-in-JS library; global resets in `App.css`/`index.css`.
- **JSX** only (no TypeScript) — `.jsx` for React files, `.js` for data/utils.
- **No test framework** — do not add one without explicit request.
- **Dark NOC theme colors**: bg `#04080f`, surface `#070d1a`, border `#1e2a3a`, accent `#38bdf8`.
- Comments only where logic is non-obvious.
- New tabs → `src/components/tabs/`; follow existing pattern.
- New circuit sub-components → `src/components/circuit/`.
- New data → `src/data/`; use `{varName}` template system if generating configs.

---

## ⚠️ Important Notes for Copilot

1. **No backend** — pure client-side simulation. No real API calls.
2. **No state management library** — `App.jsx` is the single source of truth by design.
3. **Do not change port 5173** — `start.ps1` and `vite.config.js` are coupled to it.
4. **`App.jsx` is large by design** — do not split without explicit request.
5. **Windows-first dev environment** — scripts are PowerShell (`.ps1`).
6. **`dist/` is .gitignore'd** — never commit it.
7. **Template strings in data files** use `{varName}` syntax, NOT JS `${...}` template literals.
8. **Pre-existing TanStack warning** (`react-hooks/incompatible-library` on `useReactTable`) — unfixable without rewrite; accepted permanently.
9. **Hidden tabs** are imported and rendered in `App.jsx` — they just never become `activeTab`. To hide a tab: comment out its entry in the `TABS` array only.
10. **Circuit Planner is on `feature/circuit-planner-tab`** — not yet merged to `main`.
