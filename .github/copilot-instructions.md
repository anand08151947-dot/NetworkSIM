# GitHub Copilot – Workspace Instructions
# NorthStar Fiber ISP Network Simulation Dashboard

> This file provides persistent context to GitHub Copilot for every session in
> this repository. Keep it updated as the project evolves.

---

## 🗂️ Project Identity

| Field | Value |
|-------|-------|
| **Repo name** | `NetworkSIM` |
| **GitHub** | https://github.com/anand08151947-dot/NetworkSIM |
| **Branch** | `main` (default & only branch) |
| **Author** | Anand Ranade (`anand08151947-dot`) |
| **License** | Apache 2.0 |
| **Status** | Active development |

---

## 🎯 What This Project Is

A **NOC-grade, fully client-side ISP network simulation dashboard** that models
the complete network stack of a hypothetical fiber ISP called *NorthStar Fiber*.
There is **no backend** — all data, simulations, and state are in-memory React
state seeded from static JS data files.

The app demonstrates:
- **Interactive 30+ node topology** (React Flow canvas) spanning 7 network layers
- **8 provisioning simulation flows** with step-by-step animated highlighting
- **5 fault injection scenarios** with auto-healing remediation events
- **Geographic Leaflet map** of PNW Central Offices and fiber routes
- **7 analytics tabs**: Customers, Revenue, SLA, BGP/Security, IPAM, Audit Log, Traffic Engineering
- **Simulation recording** — exports WebM video or animated GIF of the topology
- **Multi-role views** — NOC Engineer, Sales Engineer, Executive, Field Tech
- **Config Generator** — produces real-device CLI/API configs (Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox, RADIUS, DHCP, BGP)
- **AI Runbook** panel — auto-generates NOC runbook for the active simulation

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
# Install / update dependencies (verifies Node ≥ 18, confirms packages)
.\install.ps1

# Clean reinstall (removes node_modules first)
.\install.ps1 -Clean

# Start dev server (kills stale Node/Vite, frees port, auto-installs if needed)
.\start.ps1

# Start on a custom port
.\start.ps1 -Port 3000
```

```bash
# Cross-platform equivalents
npm install          # install deps
npm run dev          # start Vite dev server (port 5173)
npm run build        # production build → dist/
npm run preview      # preview production build
npm run lint         # ESLint 9
```

---

## 📁 Source Tree & File Purposes

```
NetworkSIM/
├── .github/
│   └── copilot-instructions.md   ← YOU ARE HERE
├── .gitignore                    ← ignores: node_modules, dist, .env, *.webm, *.gif
├── index.html                    ← Vite HTML entrypoint (mounts #root)
├── vite.config.js                ← Vite + React plugin, port 5173 strictPort
├── eslint.config.js              ← ESLint 9 flat config (react-hooks, react-refresh)
├── package.json                  ← project manifest (all deps above)
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
    ├── App.jsx                   ← MASTER FILE — all global state, simulation
    │                               engine, tab routing, layout (~884 lines)
    ├── App.css                   ← Global CSS, dark NOC theme, animations
    ├── index.css                 ← CSS reset / base
    ├── assets/
    │   ├── hero.png              ← Dashboard screenshot for README
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── NetworkNode.jsx       ← Custom React Flow node (status, metrics, icons)
    │   ├── TrafficEdge.jsx       ← Animated React Flow edge with utilization %
    │   ├── UIComponents.jsx      ← Shared: CollapsiblePanel, EventLog, StatsBar,
    │   │                           RoleSelector, SimulationControls (~267 lines)
    │   ├── SimRecorder.jsx       ← WebM (MediaRecorder/VP9) + GIF (gifshot)
    │   │                           recording toolbar; auto-stops on sim complete
    │   ├── NOCTicker.jsx         ← Scrolling live-alert feed at bottom of screen
    │   ├── NodeExpandModal.jsx   ← Double-click node → full detail overlay with
    │   │                           live metrics, 24h Recharts sparkline, config
    │   ├── charts/
    │   │   └── CapacityChart.jsx ← Recharts bar chart for capacity planning
    │   ├── panels/
    │   │   ├── AIRunbook.jsx     ← Auto-generated NOC runbook per simulation step
    │   │   ├── ConfigGenerator.jsx ← Produces device-specific CLI/API configs
    │   │   ├── FaultInjector.jsx ← UI to trigger one of 5 fault scenarios
    │   │   ├── LayerFilter.jsx   ← Toggle layer visibility on topology canvas
    │   │   └── WhatIfPlanner.jsx ← Drag-to-add customers, see saturation
    │   └── tabs/
    │       ├── AuditTimelineTab.jsx    ← Git-style event timeline
    │       ├── BGPSecurityTab.jsx      ← BGP route table + DDoS/security log
    │       ├── CustomerTab.jsx         ← Customer database table (@tanstack)
    │       ├── GeoMapTab.jsx           ← React Leaflet PNW map (~438 lines)
    │       ├── IPAMTab.jsx             ← IP/VLAN/subnet management
    │       ├── RevenueTab.jsx          ← MRR, ARPU, churn, growth charts
    │       ├── SLATab.jsx              ← Per-customer SLA compliance table
    │       └── TrafficEngineeringTab.jsx ← MPLS TE tunnels + inter-POP heatmap
    ├── data/
    │   ├── networkTopology.js    ← NODE DEFINITIONS (30+ nodes, 7 layers) +
    │   │                           EDGE definitions + 8 SIMULATION FLOW arrays
    │   ├── faultScenarios.js     ← 5 fault scenarios with affected-node lists
    │   │                           and auto-healing remediation steps
    │   ├── customers.js          ← ~50 simulated customers with tier, MRR, SLA
    │   ├── geoData.js            ← PNW lat/lng for COs, fiber routes, regions
    │   └── configTemplates.js    ← 20+ device config generators (template fns)
    │                               for Calix, Cisco IOS-XR, Ciena, NetBox, etc.
    └── utils/
        ├── mockApi.js            ← Simulated async API calls (NetBox/RADIUS/DHCP)
        │                           with artificial latency for realism
        ├── scenarioManager.js    ← Helpers: load/save/export scenario state
        └── exportUtils.js        ← XLSX/CSV export using SheetJS
```

### Circuit Planner Tab (Phase 1 — feature/circuit-planner-tab)

New self-contained tab added at `src/components/tabs/CircuitPlannerTab.jsx`:

```
src/
├── data/
│   └── circuitPlans.js              ← 6 circuit types, equipment stacks (7 vendors),
│                                       8-phase simulation flow builder, optical budget calc
└── components/
    ├── circuit/                     ← Circuit Planner sub-components
    │   ├── CircuitWizard.jsx        ← Service order form (type, A/Z sites, BW, protection, SLA)
    │   ├── EquipmentChain.jsx       ← Animated A→Z device chain with vendor glow
    │   ├── OpticalBudgetCalc.jsx    ← Real dB optical math (DWDM/Wave circuits only)
    │   └── PhaseStepper.jsx         ← 8-phase strip + scrolling step log with timestamps
    └── tabs/
        └── CircuitPlannerTab.jsx    ← Main tab: simulation engine, state, layout
```

---

## 🧠 Architecture & Key Patterns

### State Management
- **All state lives in `App.jsx`** — there is no Redux, Zustand, or Context.
- State is passed down as props. `App.jsx` is intentionally the single source of truth (~884 lines).
- Simulation engine runs via `setInterval` inside `App.jsx`, stepping through `currentSimulation.steps[]`.

### Simulation System
- Simulations are defined in `src/data/networkTopology.js` as arrays of step objects.
- Each step has: `{ label, node, description, type }` — `node` is the React Flow node ID to highlight.
- Speed is controlled by multiplying a base interval (e.g., 1000 ms / speedMultiplier).
- The active simulation step highlights affected nodes yellow via a `highlightedNodes` Set in state.

### Fault Injection
- Faults are defined in `src/data/faultScenarios.js`.
- Each fault has `affectedNodes[]` (nodes go red) and `healingSteps[]` (auto-remediation log).
- Faults are mutually exclusive with running simulations.

### React Flow (Topology Canvas)
- `NetworkNode.jsx` is the custom node renderer — handles 7+ node types with unique icons.
- `TrafficEdge.jsx` is the custom edge renderer — shows animated dashes + utilization % badge.
- `LayerFilter.jsx` controls which node groups (layers) are visible.
- Nodes and edges are filtered before being passed to `<ReactFlow>` based on active layers.

### Config Templates
- `src/data/configTemplates.js` exports template functions keyed by node type.
- `ConfigGenerator.jsx` calls these with `(nodeId, simulationContext)` and renders the output.
- 20+ device types: Calix OLT, Cisco IOS-XR, Ciena ROADM, NetBox REST, RADIUS, DHCP, BGP, etc.

### GIF/Video Recording
- `SimRecorder.jsx` uses the browser `MediaRecorder` API for WebM.
- GIF is built frame-by-frame using `html-to-image` (PNG snapshots) fed into `gifshot`.
- Recording auto-stops when the simulation reaches its last step.

### No Backend
- `src/utils/mockApi.js` simulates all API calls (NetBox, RADIUS, DHCP) with `setTimeout` delays.
- No `.env` file is required — there are no real endpoints.

---

## 🔗 Git Context

| Item | Detail |
|------|--------|
| **Remote** | `origin` → https://github.com/anand08151947-dot/NetworkSIM.git |
| **Default branch** | `main` |
| **Tracking** | `main` → `origin/main` |
| **HEAD commit** | `42f12cd` — "Initial commit: NorthStar Fiber ISP Network Simulation Dashboard" |
| **Commit date** | Tue Mar 17 2026 |
| **Total files** | 48 files, ~11 896 insertions |
| **Working tree** | Clean (nothing to commit) |

### Git Author Config (local)
```
user.name  = Anand Ranade
user.email = anand08151947-dot@users.noreply.github.com
```

### .gitignore Summary
Ignores: `node_modules/`, `dist/`, `.env*`, `*.log`, `*.webm`, `*.gif`,
`.DS_Store`, `Thumbs.db`, `.vscode/*` (except `extensions.json` and `settings.json`),
`.vite/`, `coverage/`.

---

## 🛠️ Coding Conventions

- **React functional components only** — no class components.
- **ESLint 9 flat config** with `react-hooks` and `react-refresh` plugins.
- **ES modules** (`"type": "module"` in package.json) — use `import`/`export`, never `require`.
- **Inline styles + CSS classes** — no CSS-in-JS library; global styles in `App.css`.
- **JSX** only (no TypeScript) — `.jsx` extension for all React files, `.js` for data/utils.
- **No test framework** is set up — do not add one without explicit request.
- **Comments** only where logic is non-obvious; avoid redundant comments.
- When adding new tabs, follow the pattern of existing files in `src/components/tabs/`.
- When adding new simulation flows, add to the `SIMULATIONS` array in `src/data/networkTopology.js`.
- When adding new fault scenarios, add to `src/data/faultScenarios.js`.

---

## ⚠️ Important Notes for Copilot

1. **Do not add a backend** — this is intentionally a pure client-side simulation app.
2. **Do not introduce a state management library** unless explicitly asked.
3. **Do not change the port** (5173) — `start.ps1` and `vite.config.js` are tightly coupled to it.
4. **`App.jsx` is large by design** — resist splitting state out without a clear request to do so.
5. **All data is mock/simulated** — do not attempt real network API calls.
6. **Windows-first development environment** — scripts are PowerShell (`.ps1`).
7. The `dist/` folder exists locally but is `.gitignore`d — do not commit it.
8. `node_modules/` is installed and fully resolved — run `npm install` only if `package.json` changes.
