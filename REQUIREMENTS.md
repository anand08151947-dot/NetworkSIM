# North Star Fiber — Build Requirements

Complete list of tools, runtime dependencies, and packages required to build and
run the **North Star Fiber ISP Network Simulation Dashboard**.

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Node.js** | 18.x LTS | **22.x LTS** (v22.14.0+) |
| **npm** | 9.x | **10.x** (v10.9.2+) |
| **Browser** | Chrome 89 / Edge 89 | Chrome 120+ / Edge 120+ |
| **RAM** | 4 GB | 8 GB (large bundle ~1.4 MB) |
| **OS** | Windows 10, macOS 12, Ubuntu 20.04 | Any modern OS |

> ⚠️ **WebM recording** requires a Chromium-based browser (Chrome, Edge, Brave).
> Firefox supports WebM but may lack VP9 hardware encoding.
> Safari does **not** support `MediaRecorder` with WebM — use GIF format on Safari.

---

## Quick Start

```bash
# 1. Clone / enter the project directory
cd ziply-network-sim

# 2. Install all dependencies
npm install

# 3. Start the development server (port 5200)
npm run dev

# 4. Open in browser
#    http://localhost:5200
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR on **port 5200** |
| `npm run build` | Production build → `dist/` folder |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint static analysis |

---

## Production Dependencies

These packages are bundled into the final app (`dependencies` in `package.json`):

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.4 | UI framework |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `@xyflow/react` | ^12.10.1 | Interactive network topology canvas (React Flow v12) |
| `d3` | ^7.9.0 | SVG charts, heatmaps, traffic matrix visualizations |
| `recharts` | ^3.8.0 | Capacity charts, SLA dashboards, revenue analytics |
| `react-leaflet` | ^5.0.0 | Geographic map (Pacific Northwest Leaflet integration) |
| `leaflet` | ^1.9.4 | Leaflet.js map engine (peer dependency of react-leaflet) |
| `@tanstack/react-table` | ^8.21.3 | IPAM subnet tables, BGP route tables |
| `lucide-react` | ^0.577.0 | Icon library (sidebar icons, toolbar icons) |
| `html-to-image` | ^1.11.13 | DOM-to-PNG frame capture for simulation recording |
| `gifshot` | ^0.4.5 | Animated GIF encoder (lazy-loaded, only on GIF export) |
| `xlsx` | ^0.18.5 | Excel/CSV export for Audit Timeline and customer data |

---

## Dev Dependencies

These are build-time only and not included in the production bundle:

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^8.0.0 | Build tool & dev server (Rolldown-based) |
| `@vitejs/plugin-react` | ^6.0.0 | React + JSX transform for Vite (uses Oxc) |
| `eslint` | ^9.39.4 | JavaScript linter |
| `eslint-plugin-react-hooks` | ^7.0.1 | Enforces React Hooks rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | Validates fast-refresh compatibility |
| `@eslint/js` | ^9.39.4 | ESLint core JS ruleset |
| `globals` | ^17.4.0 | Browser/Node global definitions for ESLint |
| `@types/react` | ^19.2.14 | TypeScript types for React (used by editor tooling) |
| `@types/react-dom` | ^19.2.3 | TypeScript types for ReactDOM |

---

## Browser Capabilities Required

The app uses several modern browser APIs. Ensure your browser supports:

| API | Used For | Fallback |
|-----|----------|---------|
| `MediaRecorder` + `captureStream()` | WebM simulation recording | Use GIF format |
| `OffscreenCanvas` | WebM frame rendering | Fallback to regular canvas |
| CSS `backdrop-filter` | Panel blur effects | Degrades gracefully |
| CSS `@keyframes` | Node pulse animations | None required |
| `ResizeObserver` | Responsive layout | Polyfill auto-applied by Vite |
| `Blob` + `URL.createObjectURL` | File downloads (WebM/GIF/XLSX) | Required |

---

## Vite Configuration

The dev server is configured to run on **port 5200** (not the default 5173).

```js
// vite.config.js
server: {
  port: 5200,
}
```

---

## Project Structure

```
ziply-network-sim/
├── public/                   # Static assets
├── src/
│   ├── App.jsx               # Root component — all state, simulation engine
│   ├── main.jsx              # React entry point
│   ├── components/
│   │   ├── NetworkNode.jsx       # Custom React Flow node renderer
│   │   ├── TrafficEdge.jsx       # Animated edge with traffic labels
│   │   ├── UIComponents.jsx      # Shared: CollapsiblePanel, EventLog, StatsBar…
│   │   ├── SimRecorder.jsx       # WebM / GIF recording toolbar component
│   │   ├── NOCTicker.jsx         # Live alert ticker at bottom of screen
│   │   ├── NodeExpandModal.jsx   # Double-click node detail overlay
│   │   ├── charts/
│   │   │   └── CapacityChart.jsx # Recharts capacity bar chart
│   │   ├── panels/
│   │   │   ├── AIRunbook.jsx        # AI-generated runbook per simulation
│   │   │   ├── ConfigGenerator.jsx  # Node-specific CLI/API config output
│   │   │   ├── FaultInjector.jsx    # Fault scenario control panel
│   │   │   ├── LayerFilter.jsx      # Layer visibility toggles
│   │   │   └── WhatIfPlanner.jsx    # What-If capacity planner slider
│   │   └── tabs/
│   │       ├── GeoMapTab.jsx           # Leaflet Pacific Northwest map
│   │       ├── CustomerTab.jsx         # Customer database table
│   │       ├── RevenueTab.jsx          # Revenue analytics
│   │       ├── SLATab.jsx              # SLA compliance tracker
│   │       ├── BGPSecurityTab.jsx      # BGP route table + security log
│   │       ├── IPAMTab.jsx             # IP Address Manager
│   │       ├── AuditTimelineTab.jsx    # Git-style change audit log
│   │       └── TrafficEngineeringTab.jsx # MPLS TE + inter-POP matrix
│   ├── data/
│   │   ├── networkTopology.js    # All nodes, edges, simulation flows
│   │   ├── faultScenarios.js     # Fault injection scenarios
│   │   ├── customers.js          # Simulated customer database
│   │   ├── geoData.js            # PNW geographic data for Leaflet
│   │   └── configTemplates.js    # Per-node CLI/API config generators
│   ├── utils/
│   │   ├── mockApi.js            # Simulated NetBox/RADIUS/DHCP API calls
│   │   ├── scenarioManager.js    # Simulation scenario state helpers
│   │   └── exportUtils.js        # XLSX/CSV export utilities
│   └── simulation/               # Simulation engine helpers
├── .gitignore
├── REQUIREMENTS.md           # This file
├── README.md
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Known Constraints

- **Bundle size:** ~1.47 MB (minified, before gzip). This is expected given the
  number of visualization libraries. Gzip reduces this to ~444 KB over the wire.
  No code-splitting is applied; can be added if needed.
- **GIF encoding is CPU-intensive** for long recordings (>30s). Recommend using
  WebM for recordings longer than 15 seconds.
- **No backend required** — all data is simulated in-memory. NetBox, RADIUS,
  DHCP, and CRM interactions are mocked via `src/utils/mockApi.js`.
- **No database** — customer and topology state resets on page refresh by design
  (it's a simulation tool, not a production system).
