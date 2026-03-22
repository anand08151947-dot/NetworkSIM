import { useState, useEffect, useRef } from "react";
import RANScenariosPanel from "./RANScenariosPanel";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERATION_MODES = [
  { id: "4g",  label: "4G LTE",  desc: "Coverage-only, propagation model" },
  { id: "nsa", label: "5G NSA",  desc: "Anchor + zone + dual-stack" },
  { id: "sa",  label: "5G SA",   desc: "Full slice, no LTE dependency" },
];

const OBJECTIVES = [
  "Coverage Maximization",
  "CAPEX Minimization",
  "Interference Reduction",
  "NSA Anchor Preservation",
  "Acquisition Speed",
  "Custom Weighted Mix",
];

const FUNCTION_TABS = [
  { id: "zones",       label: "🗺️ Zones",        alert: null },
  { id: "capacity",    label: "📊 Capacity",      alert: "warn" },
  { id: "interference",label: "📡 Interference",  alert: "error" },
  { id: "mimo",        label: "🔧 MIMO",          alert: null },
  { id: "qoe",         label: "😊 QoE",           alert: "warn" },
  { id: "son",         label: "🤖 SON",           alert: "warn" },
  { id: "lifecycle",   label: "♻️ Lifecycle",     alert: null },
  { id: "spectrum",    label: "🔢 Spectrum",      alert: "error" },
  { id: "hetnet",      label: "🏙️ HetNet",        alert: "warn" },
  { id: "handover",    label: "🔄 Handover",      alert: "error" },
  { id: "slicing",     label: "🍰 Slicing",       alert: null },
  { id: "acquisition", label: "🏗️ Acquisition",   alert: "warn" },
  { id: "drivetest",   label: "🚗 Drive Test",    alert: null },
];

// Sample zones for the zone map mock
const MOCK_ZONES = [
  { id: "NW-047", label: "NW-047", x: 18, y: 22, health: "gap",       sinr: 6,  load: 67, qoe: 43, anchor: false },
  { id: "NE-012", label: "NE-012", x: 62, y: 18, health: "good",      sinr: 19, load: 54, qoe: 88, anchor: true  },
  { id: "SE-023", label: "SE-023", x: 68, y: 58, health: "critical",  sinr: 11, load: 81, qoe: 61, anchor: true  },
  { id: "SW-008", label: "SW-008", x: 22, y: 62, health: "excellent", sinr: 24, load: 43, qoe: 95, anchor: true  },
  { id: "CN-031", label: "CN-031", x: 42, y: 40, health: "fair",      sinr: 14, load: 73, qoe: 72, anchor: true  },
];

const MOCK_SITES = [
  { id: "SITE-A", label: "SITE-A", x: 25, y: 32, type: "macro" },
  { id: "SITE-B", label: "SITE-B", x: 65, y: 28, type: "macro" },
  { id: "SITE-C", label: "SITE-C", x: 55, y: 65, type: "macro" },
  { id: "SC-001", label: "SC-001", x: 35, y: 48, type: "small" },
];

const MOCK_CANDIDATES = [
  {
    rank: 1, type: "Parameter Fix", capex: "$0", coverage: "+19%",
    interference: "+1dB", acquisition: "N/A", deploy: "Immediate",
    qoe: "+18pts", score: 91, badge: "🥇 Zero CAPEX",
    detail: "Adjust A2 threshold: -110 → -106 dBm. NR adoption +19%, QoE 61→79/100.",
    risk: "Monitor ping-pong at cell boundary.",
  },
  {
    rank: 2, type: "Small Cell", capex: "$180K", coverage: "+24%",
    interference: "+3dB", acquisition: "87%", deploy: "6 weeks",
    qoe: "+24pts", score: 76, badge: "🏙️ HetNet",
    detail: "Deploy outdoor small cell at Industrial Park Rd. Parent: SITE-A.",
    risk: "Requires site acquisition — currently 87% confidence.",
  },
  {
    rank: 3, type: "Antenna Adjustment", capex: "$12K", coverage: "+14%",
    interference: "+2dB", acquisition: "N/A", deploy: "2 weeks",
    qoe: "+12pts", score: 82, badge: "🔧 Antenna",
    detail: "Downtilt SITE-A Sector 3 by 2°, azimuth rotate 5° NW.",
    risk: "Minor coverage loss on south edge of zone.",
  },
  {
    rank: 4, type: "New Macro Site", capex: "$2.1M", coverage: "+31%",
    interference: "+8dB", acquisition: "41%", deploy: "18 months",
    qoe: "+29pts", score: 58, badge: "🏗️ Macro Build",
    detail: "Greenfield macro at Hillcrest Tower. Full NSA anchor coverage.",
    risk: "Low acquisition confidence. 18-month build cycle.",
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  root: {
    display: "flex", flexDirection: "column", height: "100%", width: "100%",
    background: "var(--bg-primary, #070d1a)", color: "var(--text-primary, #e2e8f0)",
    fontFamily: "monospace", fontSize: 12, overflow: "hidden",
  },
  topBar: {
    display: "flex", alignItems: "center", gap: 16, padding: "8px 16px",
    borderBottom: "1px solid #1e3a5f", background: "#0a1628", flexShrink: 0,
    flexWrap: "wrap",
  },
  sectionLabel: { color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: 1 },
  genBtn: (active) => ({
    padding: "4px 12px", borderRadius: 5, cursor: "pointer", fontSize: 11,
    border: active ? "1px solid #3b82f6" : "1px solid #1e3a5f",
    background: active ? "#0f1f3d" : "transparent",
    color: active ? "#60a5fa" : "#64748b", fontWeight: active ? 700 : 400,
    transition: "all 0.15s",
  }),
  select: {
    background: "#0f1f3d", border: "1px solid #1e3a5f", color: "#e2e8f0",
    borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer",
  },
  badge: (color) => ({
    display: "inline-block", padding: "1px 7px", borderRadius: 10, fontSize: 10,
    fontWeight: 700, background: color + "22", color, border: `1px solid ${color}44`,
  }),
  mainLayout: {
    display: "flex", flex: 1, overflow: "hidden", minHeight: 0,
  },
  // Left panel
  leftPanel: {
    width: 220, flexShrink: 0, borderRight: "1px solid #1e3a5f",
    background: "#080f1e", display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "8px 12px", borderBottom: "1px solid #1e3a5f",
    color: "#60a5fa", fontWeight: 700, fontSize: 11, letterSpacing: 1,
    background: "#0a1628",
  },
  panelSection: {
    padding: "10px 12px", borderBottom: "1px solid #0f1f3d",
  },
  // Center map
  mapPanel: {
    flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
    background: "#050c1a",
  },
  mapHeader: {
    display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
    borderBottom: "1px solid #1e3a5f", background: "#0a1628", flexShrink: 0,
  },
  mapCanvas: {
    flex: 1, position: "relative", overflow: "hidden",
  },
  // Right panel
  rightPanel: {
    width: 260, flexShrink: 0, borderLeft: "1px solid #1e3a5f",
    background: "#080f1e", display: "flex", flexDirection: "column",
    overflow: "hidden",
  },
  // Function tabs
  funcTabBar: {
    display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 10px",
    borderTop: "1px solid #1e3a5f", background: "#0a1628", flexShrink: 0,
  },
  funcTab: (active) => ({
    padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 10,
    border: active ? "1px solid #3b82f6" : "1px solid #1e3a5f",
    background: active ? "#0f1f3d" : "transparent",
    color: active ? "#60a5fa" : "#64748b", fontWeight: active ? 700 : 400,
    position: "relative", transition: "all 0.15s",
  }),
  detailPanel: {
    flexShrink: 0, borderTop: "1px solid #1e3a5f",
    background: "#060d1b", overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  // Zone health colors
  zoneColors: {
    excellent: "#22c55e", good: "#86efac", fair: "#fbbf24",
    critical: "#ef4444", gap: "#dc2626",
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 4,
  },
  divider: { borderTop: "1px solid #1e3a5f", margin: "8px 0" },
  scrollable: { flex: 1, overflowY: "auto", padding: "10px 12px" },
  card: {
    background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 6,
    padding: "8px 10px", marginBottom: 8,
  },
  alertDot: (type) => ({
    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
    background: type === "error" ? "#ef4444" : type === "warn" ? "#fbbf24" : "#22c55e",
    position: "absolute", top: 3, right: 3,
  }),
  progressBar: (pct, color) => ({
    height: 4, borderRadius: 2, width: `${pct}%`,
    background: color || "#3b82f6", transition: "width 0.4s",
  }),
  progressTrack: {
    height: 4, borderRadius: 2, background: "#1e3a5f", margin: "2px 0 4px",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBadge({ health }) {
  const colors = {
    excellent: "#22c55e", good: "#86efac", fair: "#fbbf24",
    critical: "#ef4444", gap: "#dc2626",
  };
  const labels = {
    excellent: "Excellent", good: "Good", fair: "Fair",
    critical: "Critical", gap: "Coverage Gap",
  };
  return <span style={S.badge(colors[health] || "#64748b")}>{labels[health] || health}</span>;
}

function MiniBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const c = color || (pct > 85 ? "#ef4444" : pct > 70 ? "#fbbf24" : "#22c55e");
  return (
    <div style={S.progressTrack}>
      <div style={S.progressBar(pct, c)} />
    </div>
  );
}

// ─── Zone Map (ASCII-style mock) ──────────────────────────────────────────────

function ZoneMap({ selectedZone, onSelectZone, genMode }) {
  const zoneColors = {
    excellent: "#22c55e33", good: "#86efac33", fair: "#fbbf2433",
    critical: "#ef444433", gap: "#dc262633",
  };
  const zoneBorders = {
    excellent: "#22c55e", good: "#86efac", fair: "#fbbf24",
    critical: "#ef4444", gap: "#dc2626",
  };

  return (
    <div style={S.mapCanvas}>
      {/* Grid background */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Zone circles */}
      {MOCK_ZONES.map(z => {
        const selected = selectedZone?.id === z.id;
        return (
          <div
            key={z.id}
            onClick={() => onSelectZone(z)}
            style={{
              position: "absolute",
              left: `${z.x}%`, top: `${z.y}%`,
              width: 90, height: 90,
              borderRadius: "50%",
              background: zoneColors[z.health],
              border: `2px solid ${selected ? "#60a5fa" : zoneBorders[z.health]}`,
              boxShadow: selected ? "0 0 0 3px #3b82f680" : "none",
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "#e2e8f0" }}>{z.id}</div>
            <div style={{ fontSize: 9, color: zoneBorders[z.health] }}>{z.sinr}dB SINR</div>
            {!z.anchor && genMode === "nsa" && (
              <div style={{ fontSize: 8, color: "#fbbf24", marginTop: 2 }}>⚠️ Anchor gap</div>
            )}
          </div>
        );
      })}

      {/* Site markers */}
      {MOCK_SITES.map(s => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`, top: `${s.y}%`,
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{
            width: s.type === "macro" ? 14 : 10,
            height: s.type === "macro" ? 14 : 10,
            borderRadius: s.type === "macro" ? 3 : "50%",
            background: s.type === "macro" ? "#3b82f6" : "#22c55e",
            border: "2px solid #e2e8f0",
            margin: "0 auto",
          }} />
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 1 }}>{s.label}</div>
        </div>
      ))}

      {/* NSA anchor boundary overlay */}
      {genMode === "nsa" && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <ellipse cx="40%" cy="42%" rx="26%" ry="22%" fill="none"
            stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
          <text x="17%" y="22%" fill="#3b82f6" fontSize="9" opacity="0.7">LTE Anchor Zone</text>
        </svg>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 10, left: 10,
        background: "#0a162899", borderRadius: 6, padding: "6px 10px",
        border: "1px solid #1e3a5f", fontSize: 9,
      }}>
        {Object.entries({ excellent: "#22c55e", good: "#86efac", fair: "#fbbf24", critical: "#ef4444", gap: "#dc2626" }).map(([k, c]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c + "44", border: `1px solid ${c}` }} />
            <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k}</span>
          </div>
        ))}
        <div style={S.divider} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6" }} />
          <span style={{ color: "#94a3b8" }}>Macro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ color: "#94a3b8" }}>Small Cell</span>
        </div>
      </div>
    </div>
  );
}

// ─── Zone Diagnostic Report ───────────────────────────────────────────────────

function ZoneDiagnosticReport({ zone, genMode }) {
  if (!zone) return (
    <div style={{ padding: 16, color: "#64748b", textAlign: "center", fontSize: 11 }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>🗺️</div>
      <div>Click a zone on the map</div>
      <div>to see its diagnostic report</div>
    </div>
  );

  const anchorFail = genMode === "nsa" && !zone.anchor;

  return (
    <div style={{ overflow: "auto", maxHeight: 160, borderBottom: "1px solid #1e3a5f" }}>
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e3a5f" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 12 }}>ZONE {zone.id}</div>
          <HealthBadge health={zone.health} />
        </div>
        <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Mode: {genMode.toUpperCase()}</div>
      </div>

      <div style={{ padding: "8px 12px" }}>
        <div style={S.sectionLabel}>SIGNAL</div>
        <div style={{ marginTop: 6 }}>
          {genMode !== "4g" && (
            <>
              <div style={S.infoRow}>
                <span style={{ color: "#94a3b8" }}>LTE RSRP</span>
                <span style={{ color: anchorFail ? "#ef4444" : "#22c55e" }}>-108 dBm</span>
              </div>
              <MiniBar value={anchorFail ? 35 : 72} color={anchorFail ? "#ef4444" : "#22c55e"} />
            </>
          )}
          <div style={S.infoRow}>
            <span style={{ color: "#94a3b8" }}>SINR</span>
            <span style={{ color: zone.sinr > 15 ? "#22c55e" : zone.sinr > 8 ? "#fbbf24" : "#ef4444" }}>
              {zone.sinr} dB
            </span>
          </div>
          <MiniBar value={zone.sinr} max={30} color={zone.sinr > 15 ? "#22c55e" : "#fbbf24"} />
        </div>

        {anchorFail && (
          <div style={{
            background: "#fbbf2411", border: "1px solid #fbbf2444",
            borderRadius: 5, padding: "6px 8px", margin: "8px 0",
          }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 10 }}>⚠️ ANCHOR GAP DETECTED</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 3 }}>
              LTE RSRP below A2 threshold.<br />NR bearer not triggered.<br />23% of UEs cannot access NR.
            </div>
          </div>
        )}

        <div style={S.divider} />
        <div style={S.sectionLabel}>CAPACITY</div>
        <div style={{ marginTop: 6 }}>
          <div style={S.infoRow}>
            <span style={{ color: "#94a3b8" }}>Current load</span>
            <span style={{ color: zone.load > 80 ? "#ef4444" : "#fbbf24" }}>{zone.load}%</span>
          </div>
          <MiniBar value={zone.load} color={zone.load > 80 ? "#ef4444" : "#fbbf24"} />
          <div style={S.infoRow}>
            <span style={{ color: "#94a3b8" }}>Q3 2027 proj.</span>
            <span style={{ color: "#ef4444" }}>89% ⚠️</span>
          </div>
        </div>

        <div style={S.divider} />
        <div style={S.sectionLabel}>QoE SCORES</div>
        <div style={{ marginTop: 6 }}>
          {[["Video", zone.qoe], ["Gaming", Math.min(100, zone.qoe + 8)], ["Voice", Math.min(100, zone.qoe + 12)]].map(([label, score]) => (
            <div key={label} style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>{label}</span>
              <span style={{ color: score > 75 ? "#22c55e" : score > 50 ? "#fbbf24" : "#ef4444" }}>
                {score}/100 {score > 75 ? "✅" : "⚠️"}
              </span>
            </div>
          ))}
        </div>

        {(zone.health === "gap" || anchorFail) && (
          <>
            <div style={S.divider} />
            <div style={S.sectionLabel}>ROOT CAUSE</div>
            <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 10 }}>
              {anchorFail
                ? "A2 threshold too aggressive (-110 dBm). LTE RSRP -108 dBm. Gap: 2dBm below trigger."
                : "SINR below coverage threshold. No LTE anchor in zone."}
            </div>
            <div style={{ marginTop: 6, color: "#60a5fa", fontSize: 10 }}>
              Fix type: <strong>PARAMETER (zero CAPEX)</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Candidate Carousel ───────────────────────────────────────────────────────

function CandidateCarousel({ objective }) {
  const [idx, setIdx] = useState(0);
  const sorted = [...MOCK_CANDIDATES].sort((a, b) => {
    if (objective === "CAPEX Minimization") return a.capex.localeCompare(b.capex);
    if (objective === "Coverage Maximization") return parseInt(b.coverage) - parseInt(a.coverage);
    return b.score - a.score;
  });
  const c = sorted[idx];

  return (
    <div style={{ padding: "8px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={S.sectionLabel}>CANDIDATES</div>
        <div style={{ color: "#64748b", fontSize: 10 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0 4px" }}>◀</button>
          {idx + 1}/{sorted.length}
          <button onClick={() => setIdx(i => Math.min(sorted.length - 1, i + 1))}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0 4px" }}>▶</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{c.type}</div>
          <span style={S.badge("#fbbf24")}>{c.badge}</span>
        </div>

        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>{c.detail}</div>

        {[
          ["Coverage", c.coverage, "#22c55e"],
          ["CAPEX", c.capex, c.capex === "$0" ? "#22c55e" : "#fbbf24"],
          ["Interference", c.interference, "#22c55e"],
          ["Deploy", c.deploy, "#60a5fa"],
        ].map(([label, value, color]) => (
          <div key={label} style={S.infoRow}>
            <span style={{ color: "#64748b" }}>{label}</span>
            <span style={{ color, fontWeight: 600 }}>{value}</span>
          </div>
        ))}

        <div style={S.divider} />
        <div style={S.infoRow}>
          <span style={{ color: "#64748b" }}>Overall Score</span>
          <span style={{ color: c.score > 80 ? "#22c55e" : "#fbbf24", fontWeight: 700 }}>{c.score}%</span>
        </div>
        <MiniBar value={c.score} color={c.score > 80 ? "#22c55e" : "#fbbf24"} />

        {c.risk && (
          <div style={{ marginTop: 6, color: "#fbbf24", fontSize: 9 }}>⚠️ {c.risk}</div>
        )}

        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button style={{
            flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
            background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa",
          }}>✅ Accept</button>
          <button style={{
            flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
            background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b",
          }}>⏭ Skip</button>
        </div>
      </div>

      {/* Dot nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
        {sorted.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
            background: i === idx ? "#3b82f6" : "#1e3a5f", cursor: "pointer",
            transition: "all 0.2s",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Business Objective Switch ────────────────────────────────────────────────

function ObjectiveSwitch({ objective, onChange }) {
  return (
    <div style={{ padding: "8px 12px", borderTop: "1px solid #1e3a5f" }}>
      <div style={S.sectionLabel}>PLANNING OBJECTIVE</div>
      <div style={{ marginTop: 6 }}>
        {OBJECTIVES.map(obj => (
          <div
            key={obj}
            onClick={() => onChange(obj)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 0", cursor: "pointer",
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              border: `2px solid ${objective === obj ? "#3b82f6" : "#1e3a5f"}`,
              background: objective === obj ? "#3b82f6" : "transparent",
            }} />
            <span style={{ color: objective === obj ? "#60a5fa" : "#64748b", fontSize: 10 }}>{obj}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Function Detail Panels ───────────────────────────────────────────────────

function CapacityPanel() {
  const [simState, setSimState] = useState("idle"); // idle | running | done
  const [simStep, setSimStep]   = useState(-1);
  const timerRef = useRef(null);

  const eventSteps = [
    { label: "Gate open — 70,000 fans entering",        macro: 8000,  sc: 0,     cow: 0,     das: 0,     qoe: 88 },
    { label: "Halftime spike — concurrent upload surge", macro: 8000,  sc: 15000, cow: 0,     das: 0,     qoe: 79 },
    { label: "COW deployed — sector 3 offload active",   macro: 8000,  sc: 15000, cow: 20000, das: 0,     qoe: 74 },
    { label: "DAS indoor lit — concourse coverage full", macro: 8000,  sc: 15000, cow: 20000, das: 27000, qoe: 74 },
  ];

  function runSim() {
    if (simState === "running") return;
    setSimState("running");
    setSimStep(0);
    let step = 0;
    function next() {
      step++;
      if (step < eventSteps.length) {
        setSimStep(step);
        timerRef.current = setTimeout(next, 1000);
      } else {
        setSimState("done");
      }
    }
    timerRef.current = setTimeout(next, 1000);
  }
  function resetSim() {
    clearTimeout(timerRef.current);
    setSimState("idle");
    setSimStep(-1);
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const cur = simStep >= 0 ? eventSteps[simStep] : null;
  const totalUEs = cur ? cur.macro + cur.sc + cur.cow + cur.das : 0;

  return (
    <div style={{ display: "flex", gap: 0, height: "100%" }}>
      {/* Demand Model */}
      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>DEMAND MODEL</div>
        <div style={{ marginTop: 8 }}>
          {["● Live Feed (Active)", "○ Analog Reference", "○ Synthetic (ITU)"].map(opt => (
            <div key={opt} style={{ color: opt.startsWith("●") ? "#60a5fa" : "#64748b", fontSize: 11, marginBottom: 4 }}>{opt}</div>
          ))}
          <div style={S.divider} />
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Analog Ref Site</span><span style={{ color: "#60a5fa" }}>SITE-F (3.2km)</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Growth Rate</span><span style={{ color: "#e2e8f0" }}>+3.2% / yr</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Horizon</span><span style={{ color: "#e2e8f0" }}>24 months</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Fingerprint aged</span><span style={S.badge("#22c55e")}>✅ Applied</span></div>
        </div>
      </div>

      {/* Zone Capacity Scores */}
      <div style={{ flex: 1.2, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>ZONE CAPACITY SCORES</div>
        <div style={{ marginTop: 8 }}>
          {MOCK_ZONES.map(z => (
            <div key={z.id} style={{ marginBottom: 8 }}>
              <div style={S.infoRow}>
                <span style={{ color: "#94a3b8" }}>{z.id}</span>
                <span style={{ color: z.load > 80 ? "#ef4444" : z.load > 70 ? "#fbbf24" : "#22c55e" }}>
                  {z.load}% {z.load > 80 ? "❌" : z.load > 70 ? "⚠️" : "✅"}
                </span>
              </div>
              <MiniBar value={z.load} color={z.load > 80 ? "#ef4444" : z.load > 70 ? "#fbbf24" : "#22c55e"} />
            </div>
          ))}
        </div>
      </div>

      {/* Peak Event Simulator */}
      <div style={{ flex: 1.2, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>PEAK EVENT SIMULATOR</div>
        <div style={{ marginTop: 8 }}>
          <div style={S.card}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 11 }}>🏈 Super Bowl — Feb 2027</div>
            <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Levi's Stadium · 70,000 UEs peak</div>
            <div style={S.divider} />
            {[
              ["Macro",       cur ? cur.macro : 8000,  "✅"],
              ["Small cells", cur ? cur.sc    : 15000, "✅"],
              ["COW deploy",  cur ? cur.cow   : 20000, cur && simStep < 2 ? "⏳" : "⚠️"],
              ["DAS indoor",  cur ? cur.das   : 27000, cur && simStep < 3 ? "⏳" : "⚠️"],
            ].map(([l, v, s]) => (
              <div key={l} style={S.infoRow}>
                <span style={{ color: "#94a3b8" }}>{l}</span>
                <span style={{ color: "#e2e8f0" }}>{s} {Number(v).toLocaleString()} UEs</span>
              </div>
            ))}
            <div style={S.divider} />
            <div style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>Total</span>
              <span style={{ color: simState === "done" ? "#22c55e" : "#e2e8f0", fontWeight: 700 }}>
                {simState === "done" ? "✅ " : ""}{totalUEs > 0 ? totalUEs.toLocaleString() : "70,000"}
              </span>
            </div>
            <div style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>QoE at peak</span>
              <span style={{ color: cur ? (cur.qoe >= 80 ? "#22c55e" : "#fbbf24") : "#fbbf24" }}>
                {cur ? cur.qoe : 74}/100 {(!cur || cur.qoe < 80) ? "⚠️" : ""}
              </span>
            </div>
            {simState !== "idle" && cur && (
              <div style={{ marginTop: 6, padding: "4px 6px", background: "#0f1f3d", borderRadius: 4 }}>
                <div style={{ color: "#60a5fa", fontSize: 9 }}>Phase {simStep + 1}/4: {cur.label}</div>
              </div>
            )}
          </div>
          {simState === "idle" && (
            <button onClick={runSim} style={{
              width: "100%", padding: "6px", borderRadius: 5, fontSize: 11, cursor: "pointer",
              background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa", marginTop: 4,
            }}>▶ Run Event Simulation</button>
          )}
          {simState === "running" && (
            <div style={{
              width: "100%", padding: "6px", borderRadius: 5, fontSize: 11, textAlign: "center",
              background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b", marginTop: 4,
            }}>⏳ Simulating phase {simStep + 1}/4…</div>
          )}
          {simState === "done" && (
            <button onClick={resetSim} style={{
              width: "100%", padding: "6px", borderRadius: 5, fontSize: 11, cursor: "pointer",
              background: "#14532d22", border: "1px solid #22c55e44", color: "#22c55e", marginTop: 4,
            }}>✅ Done — Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}

function InterferencePanel() {
  const alerts = [
    { zone: "NW-047", conf: 73, type: "Co-channel (NR n78)", source: "SITE-B (2.3km NE)" },
    { zone: "SE-023", conf: 61, type: "Adjacent channel", source: "SITE-C (1.8km SW)" },
    { zone: "NE-012", conf: 41, type: "Pilot pollution", source: "Multiple" },
  ];
  const [selected, setSelected] = useState(0);
  const a = alerts[selected];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 160, borderRight: "1px solid #1e3a5f", padding: "10px 12px" }}>
        <div style={S.sectionLabel}>ACTIVE ALERTS ({alerts.length})</div>
        <div style={{ marginTop: 8 }}>
          {alerts.map((al, i) => (
            <div key={i} onClick={() => setSelected(i)} style={{
              padding: "6px 8px", borderRadius: 5, marginBottom: 4, cursor: "pointer",
              background: selected === i ? "#0f1f3d" : "transparent",
              border: selected === i ? "1px solid #3b82f6" : "1px solid transparent",
            }}>
              <div style={{ color: al.conf > 65 ? "#ef4444" : "#fbbf24", fontWeight: 700, fontSize: 11 }}>
                {al.conf > 65 ? "⚠️" : "ℹ️"} {al.zone}
              </div>
              <div style={{ color: "#64748b", fontSize: 9 }}>{al.conf}% confidence</div>
            </div>
          ))}
        </div>
        <div style={S.divider} />
        <div style={{ color: "#64748b", fontSize: 10 }}>Dismissed (7)</div>
        <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Deferred (2)</div>
      </div>

      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>ALERT DETAIL — {a.zone}</div>
        <div style={{ marginTop: 8 }}>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Type</span><span style={{ color: "#e2e8f0" }}>{a.type}</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Source</span><span style={{ color: "#e2e8f0" }}>{a.source}</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Confidence</span><span style={{ color: a.conf > 65 ? "#ef4444" : "#fbbf24" }}>{a.conf}%</span></div>
          <MiniBar value={a.conf} color={a.conf > 65 ? "#ef4444" : "#fbbf24"} />
          <div style={S.divider} />
          <div style={S.sectionLabel}>EVIDENCE</div>
          <div style={{ marginTop: 6 }}>
            {["✅ SINR Δ > 3dB in zone", "✅ Source site identified", "⚠️ Pattern: 08:00-09:00 only", "⚠️ Similar dismissed: SITE-C"].map(e => (
              <div key={e} style={{ color: "#94a3b8", fontSize: 10, marginBottom: 2 }}>{e}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button style={{ flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: "#14532d22", border: "1px solid #22c55e44", color: "#22c55e" }}>✅ Confirm</button>
            <button style={{ flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: "#ef444411", border: "1px solid #ef444433", color: "#ef4444" }}>❌ Dismiss</button>
            <button style={{ flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b" }}>⏸ Defer</button>
          </div>
        </div>
      </div>

      <div style={{ width: 180, padding: "10px 12px" }}>
        <div style={S.sectionLabel}>MONITORING CONFIG</div>
        <div style={{ marginTop: 8 }}>
          {[["Scan interval", "5 min"], ["SINR threshold", "-3 dB"], ["Min confidence", "50%"]].map(([l, v]) => (
            <div key={l} style={{ marginBottom: 6 }}>
              <div style={{ color: "#64748b", fontSize: 9 }}>{l}</div>
              <div style={{ color: "#e2e8f0", fontSize: 11 }}>{v}</div>
            </div>
          ))}
          <div style={S.divider} />
          <div style={S.sectionLabel}>FALSE POSITIVE LOG</div>
          <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 10 }}>
            Last 30 days: <span style={{ color: "#fbbf24" }}>7 dismissed</span><br />
            Most common: Transient load spike (4 cases)
          </div>
        </div>
      </div>
    </div>
  );
}

function HandoverPanel() {
  const DEFAULT_THRESHOLDS = [
    { ev: "A1", cur: "-100 dBm", rec: "-100 dBm", warn: false },
    { ev: "A2", cur: "-110 dBm", rec: "-106 dBm", warn: true  },
    { ev: "A3", cur: "3 dB",    rec: "3 dB",    warn: false },
    { ev: "A4", cur: "-115 dBm",rec: "-115 dBm", warn: false },
    { ev: "A5", cur: "-110 dBm",rec: "-108 dBm", warn: true  },
    { ev: "B1", cur: "-115 dBm",rec: "-115 dBm", warn: false },
    { ev: "B2", cur: "-110 dBm",rec: "-110 dBm", warn: false },
  ];

  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [fixApplied, setFixApplied] = useState(false);
  const [cutoverState, setCutoverState] = useState("idle"); // idle | running | done
  const [cutoverStep, setCutoverStep]   = useState(-1);
  const timerRef = useRef(null);

  const cutoverSteps = [
    "Quiescing NSA bearers — 87 at-risk UEs migrated to idle…",
    "SA core registration — AMF slice selection in progress…",
    "NR bearers re-established — QoS re-verified per slice…",
    "✅ Cutover complete — 0 drops | Drop rate: 0.1% (within budget)",
  ];

  function applyFix() {
    setThresholds(t => t.map(r => r.ev === "A2" ? { ...r, cur: "-106 dBm", warn: false } : r));
    setFixApplied(true);
  }
  function applyRec() {
    setThresholds(t => t.map(r => r.warn ? { ...r, cur: r.rec, warn: false } : r));
    setFixApplied(true);
  }
  function resetThresholds() {
    setThresholds(DEFAULT_THRESHOLDS);
    setFixApplied(false);
  }
  function simulateCutover() {
    if (cutoverState === "running") return;
    setCutoverState("running");
    setCutoverStep(0);
    let step = 0;
    function next() {
      step++;
      if (step < cutoverSteps.length) {
        setCutoverStep(step);
        timerRef.current = setTimeout(next, 1100);
      } else {
        setCutoverState("done");
      }
    }
    timerRef.current = setTimeout(next, 1100);
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const a2Row = thresholds.find(r => r.ev === "A2");

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Left: Anchor Diagnostic */}
      <div style={{ flex: 1.2, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>ANCHOR FLIP DIAGNOSTIC — NW-047</div>
        <div style={{
          background: fixApplied ? "#22c55e11" : "#fbbf2411",
          border: `1px solid ${fixApplied ? "#22c55e33" : "#fbbf2433"}`,
          borderRadius: 6, padding: "8px 10px", margin: "8px 0",
        }}>
          <div style={{ color: fixApplied ? "#22c55e" : "#fbbf24", fontWeight: 700, fontSize: 11 }}>
            {fixApplied ? "✅ FIX APPLIED — NR BEARER ACTIVE" : "⚠️ ANCHOR GAP DETECTED"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
            A2 threshold: {a2Row?.cur} | LTE RSRP: -108 dBm<br />
            {fixApplied ? "Gap closed — NR bearer triggered" : "Gap: 2dBm below trigger | NR bearer: NOT TRIGGERED"}<br />
            UEs affected: {fixApplied ? <span style={{ color: "#22c55e" }}>0% ✅</span> : "23% of zone"}
          </div>
        </div>
        <div style={S.card}>
          <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 11 }}>PARAMETER FIX — Zero CAPEX</div>
          <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
            Adjust A2: -110 → -106 dBm<br />
            NR adoption: +19%<br />
            QoE improvement: 61 → {fixApplied ? <span style={{ color: "#22c55e" }}>79/100 ✅</span> : "79/100"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={applyFix} disabled={fixApplied} style={{
              flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: fixApplied ? "default" : "pointer",
              background: fixApplied ? "#14532d22" : "#0f3460",
              border: `1px solid ${fixApplied ? "#22c55e44" : "#3b82f6"}`,
              color: fixApplied ? "#22c55e" : "#60a5fa",
            }}>{fixApplied ? "✅ Applied" : "Apply Fix"}</button>
            <button onClick={resetThresholds} style={{
              flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
              background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b",
            }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Center: Threshold Table */}
      <div style={{ flex: 1.5, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>EVENT THRESHOLD CONFIG (3GPP)</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 9, marginBottom: 4 }}>
            <span style={{ width: 30 }}>Event</span>
            <span style={{ width: 80 }}>Current</span>
            <span style={{ width: 80 }}>Recommended</span>
            <span>Status</span>
          </div>
          {thresholds.map(({ ev, cur, rec, warn }) => (
            <div key={ev} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0f1f3d" }}>
              <span style={{ width: 30, color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{ev}</span>
              <span style={{ width: 80, color: "#e2e8f0", fontSize: 10 }}>{cur}</span>
              <span style={{ width: 80, color: warn ? "#fbbf24" : "#22c55e", fontSize: 10 }}>{rec}</span>
              <span style={{ fontSize: 12 }}>{warn ? "⚠️" : "✅"}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={applyRec} style={{
              flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
              background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa",
            }}>Apply Recommendations</button>
            <button onClick={resetThresholds} style={{
              flex: 1, padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
              background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b",
            }}>Reset to 3GPP Default</button>
          </div>
        </div>
      </div>

      {/* Right: Cutover Sim */}
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>NSA → SA CUTOVER SIM</div>
        <div style={{ marginTop: 8 }}>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Zone</span><span style={{ color: "#e2e8f0" }}>East District</span></div>
          <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Cutover date</span><span style={{ color: "#60a5fa" }}>Q2 2026</span></div>
          <div style={S.card}>
            <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Active UEs</span><span style={{ color: "#e2e8f0" }}>1,240</span></div>
            <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>At-risk UEs</span><span style={{ color: cutoverState === "done" ? "#22c55e" : "#fbbf24" }}>{cutoverState === "done" ? "0 ✅" : "87"}</span></div>
            <div style={S.infoRow}><span style={{ color: "#94a3b8" }}>Drop estimate</span><span style={{ color: "#22c55e" }}>&lt; 0.3% ✅</span></div>
            {cutoverState !== "idle" && cutoverStep >= 0 && (
              <div style={{ marginTop: 6, padding: "4px 6px", background: "#0f1f3d", borderRadius: 4, fontSize: 9, color: cutoverState === "done" ? "#22c55e" : "#60a5fa" }}>
                {cutoverSteps[cutoverStep]}
              </div>
            )}
          </div>
          {cutoverState === "idle" && (
            <button onClick={simulateCutover} style={{
              width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: "pointer",
              background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa",
            }}>▶ Simulate Cutover</button>
          )}
          {cutoverState === "running" && (
            <div style={{ width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, textAlign: "center",
              background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b" }}>
              ⏳ Step {cutoverStep + 1}/{cutoverSteps.length}…
            </div>
          )}
          {cutoverState === "done" && (
            <button onClick={() => { setCutoverState("idle"); setCutoverStep(-1); }} style={{
              width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: "pointer",
              background: "#14532d22", border: "1px solid #22c55e44", color: "#22c55e",
            }}>✅ Done — Reset</button>
          )}
          <div style={{ marginTop: 8, color: "#64748b", fontSize: 10 }}>
            Ping-pong zones: <span style={{ color: fixApplied ? "#22c55e" : "#fbbf24" }}>{fixApplied ? "0 ✅" : "4"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Zones Overview Panel ─────────────────────────────────────────────────────

function ZonesPanel({ genMode }) {
  const healthColor = { excellent: "#22c55e", good: "#60a5fa", fair: "#fbbf24", gap: "#f97316", critical: "#ef4444" };
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1.5, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>ZONE HEALTH SUMMARY</div>
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 9, marginBottom: 4 }}>
            <span style={{ width: 60 }}>Zone</span>
            <span style={{ width: 55 }}>Health</span>
            <span style={{ width: 45 }}>SINR</span>
            <span style={{ width: 45 }}>Load</span>
            <span style={{ width: 40 }}>QoE</span>
            {genMode !== "4g" && <span style={{ width: 50 }}>Anchor</span>}
          </div>
          {MOCK_ZONES.map(z => (
            <div key={z.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", borderBottom: "1px solid #0f1f3d" }}>
              <span style={{ width: 60, color: "#e2e8f0", fontWeight: 700, fontSize: 11 }}>{z.id}</span>
              <span style={{ width: 55 }}>
                <span style={{ ...S.badge(healthColor[z.health]), textTransform: "capitalize", fontSize: 9 }}>{z.health}</span>
              </span>
              <span style={{ width: 45, color: z.sinr < 10 ? "#ef4444" : z.sinr < 15 ? "#fbbf24" : "#22c55e", fontSize: 10 }}>{z.sinr} dB</span>
              <span style={{ width: 45, color: z.load > 80 ? "#ef4444" : z.load > 70 ? "#fbbf24" : "#22c55e", fontSize: 10 }}>{z.load}%</span>
              <span style={{ width: 40, color: z.qoe < 65 ? "#ef4444" : z.qoe < 80 ? "#fbbf24" : "#22c55e", fontSize: 10 }}>{z.qoe}</span>
              {genMode !== "4g" && <span style={{ width: 50, fontSize: 10, color: z.anchor ? "#22c55e" : "#ef4444" }}>{z.anchor ? "✅ OK" : "❌ Gap"}</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>AGGREGATE DIAGNOSTICS</div>
        <div style={{ marginTop: 8 }}>
          {[
            ["Coverage score", "84%", "#22c55e"],
            ["Avg SINR", "14.8 dB", "#60a5fa"],
            ["Avg load", "63.6%", "#fbbf24"],
            ["Avg QoE", "71.8/100", "#fbbf24"],
            ["Zones at risk", "2 / 5", "#ef4444"],
            ...(genMode !== "4g" ? [["Anchor gaps", "1 / 5", "#ef4444"]] : []),
          ].map(([l, v, c]) => (
            <div key={l} style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>{l}</span>
              <span style={{ color: c, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>RECOMMENDED ACTIONS</div>
        <div style={{ marginTop: 8 }}>
          {[
            { z: "NW-047", action: "Adjust A2 threshold", priority: "high", color: "#ef4444" },
            { z: "SE-023", action: "Investigate interference", priority: "high", color: "#ef4444" },
            { z: "CN-031", action: "Monitor load growth", priority: "medium", color: "#fbbf24" },
          ].map(r => (
            <div key={r.z} style={{ ...S.card, marginBottom: 6 }}>
              <div style={{ color: r.color, fontWeight: 700, fontSize: 11 }}>{r.z}</div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>{r.action}</div>
              <div style={{ color: r.color, fontSize: 9, marginTop: 2, textTransform: "uppercase" }}>{r.priority} priority</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MIMO Panel ───────────────────────────────────────────────────────────────

function MIMOPanel() {
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(8);
  const [tilt, setTilt] = useState(6);
  const [azimuth, setAzimuth] = useState(0);
  const [layers, setLayers] = useState(4);

  const totalElements = rows * cols * 2;
  const beamGain = (10 * Math.log10(totalElements)).toFixed(1);
  const coverageWidth = Math.max(20, 120 - azimuth / 2 - tilt).toFixed(0);

  const SliderRow = ({ label, value, min, max, step, onChange, unit }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ color: "#64748b", fontSize: 9 }}>{label}</span>
        <span style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#3b82f6" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", color: "#3a4a5f", fontSize: 8 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 180, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>ARRAY CONFIGURATION</div>
        <div style={{ marginTop: 8 }}>
          <SliderRow label="Element rows" value={rows} min={2} max={16} step={2} onChange={setRows} unit="×" />
          <SliderRow label="Element cols" value={cols} min={2} max={16} step={2} onChange={setCols} unit="×" />
          <SliderRow label="Mechanical tilt" value={tilt} min={0} max={15} step={1} onChange={setTilt} unit="°" />
          <SliderRow label="Azimuth offset" value={azimuth} min={-30} max={30} step={5} onChange={setAzimuth} unit="°" />
          <SliderRow label="Spatial layers" value={layers} min={1} max={8} step={1} onChange={setLayers} unit="" />
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>BEAM PATTERN PREVIEW (ELEVATION)</div>
        <div style={{
          marginTop: 8, height: 120, background: "#020817", borderRadius: 6,
          border: "1px solid #1e3a5f", position: "relative", overflow: "hidden",
        }}>
          {/* Beam shape visualization using CSS */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            width: `${coverageWidth}%`, height: "90%",
            background: "radial-gradient(ellipse at bottom, #3b82f644 0%, #3b82f611 60%, transparent 100%)",
            transform: `translateX(-50%) rotate(${tilt * 2}deg)`,
            transformOrigin: "bottom center",
            transition: "all 0.3s",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: "50%",
            width: 2, height: "100%",
            background: "#3b82f6", transform: `translateX(-50%) rotate(${tilt * 2}deg)`,
            transformOrigin: "bottom center", opacity: 0.5, transition: "all 0.3s",
          }} />
          <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", color: "#60a5fa", fontSize: 9 }}>
            SITE ▲
          </div>
          <div style={{ position: "absolute", top: 4, right: 6, color: "#64748b", fontSize: 9 }}>
            Tilt: {tilt}° | Az: {azimuth}°
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={S.sectionLabel}>PLANNER DOMAIN (PHYSICAL CONFIG)</div>
          <div style={{ marginTop: 4, color: "#64748b", fontSize: 10 }}>
            Tilt, azimuth, element count, polarization<br />
            <span style={{ color: "#22c55e" }}>✅ These are your controls</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={S.sectionLabel}>RAN DOMAIN (BEAM WEIGHTS — NOT EDITABLE)</div>
            <div style={{ marginTop: 4, color: "#64748b", fontSize: 10 }}>
              Precoding matrices, beam weights, scheduling<br />
              <span style={{ color: "#fbbf24" }}>⚠️ Controlled by RAN live — not planner</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: 170, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>COMPUTED PARAMETERS</div>
        <div style={{ marginTop: 8 }}>
          {[
            ["Total radiators", `${totalElements}T${totalElements}R`],
            ["Array gain", `${beamGain} dBi`],
            ["Spatial layers", `${layers}×${layers} MIMO`],
            ["Beam width (est.)", `${coverageWidth}°`],
            ["Pol. mode", "±45° X-pol"],
            ["Config class", rows >= 8 ? "Massive MIMO" : "Standard MIMO"],
          ].map(([l, v]) => (
            <div key={l} style={S.infoRow}>
              <span style={{ color: "#94a3b8", fontSize: 9 }}>{l}</span>
              <span style={{ color: "#60a5fa", fontSize: 10, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={S.divider} />
          <div style={{ color: "#64748b", fontSize: 9 }}>
            {rows >= 8 ? "✅ 5G NR Massive MIMO ready" : "ℹ️ Upgrade to ≥8×8 for Massive MIMO"}<br />
            Zone shape recalculates on apply.
          </div>
          <button style={{
            width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: "pointer",
            background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa", marginTop: 8,
          }}>Apply to Zone Model</button>
        </div>
      </div>
    </div>
  );
}

// ─── QoE Panel ────────────────────────────────────────────────────────────────

function QoEPanel() {
  const profiles = [
    { app: "Video (4K)", weight: 0.35, scores: { "NW-047": 38, "NE-012": 91, "SE-023": 62, "SW-008": 97, "CN-031": 74 }, threshold: 70 },
    { app: "Gaming (eSports)", weight: 0.25, scores: { "NW-047": 45, "NE-012": 88, "SE-023": 59, "SW-008": 93, "CN-031": 70 }, threshold: 65 },
    { app: "Voice/Video Call", weight: 0.20, scores: { "NW-047": 72, "NE-012": 96, "SE-023": 80, "SW-008": 98, "CN-031": 88 }, threshold: 75 },
    { app: "IoT / mMTC", weight: 0.10, scores: { "NW-047": 88, "NE-012": 94, "SE-023": 77, "SW-008": 99, "CN-031": 91 }, threshold: 60 },
    { app: "Enterprise Data", weight: 0.10, scores: { "NW-047": 51, "NE-012": 85, "SE-023": 68, "SW-008": 90, "CN-031": 76 }, threshold: 70 },
  ];
  const zones = ["NW-047", "NE-012", "SE-023", "SW-008", "CN-031"];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 2, padding: "10px 14px", borderRight: "1px solid #1e3a5f", overflowX: "auto" }}>
        <div style={S.sectionLabel}>PER-ZONE QoE BY APPLICATION PROFILE</div>
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 6, color: "#64748b", fontSize: 9, marginBottom: 4 }}>
            <span style={{ width: 110 }}>Application</span>
            <span style={{ width: 40 }}>Wt.</span>
            {zones.map(z => <span key={z} style={{ width: 52, textAlign: "center" }}>{z}</span>)}
          </div>
          {profiles.map(p => (
            <div key={p.app} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                <span style={{ width: 110, color: "#e2e8f0", fontSize: 10 }}>{p.app}</span>
                <span style={{ width: 40, color: "#64748b", fontSize: 9 }}>{(p.weight * 100).toFixed(0)}%</span>
                {zones.map(z => {
                  const v = p.scores[z];
                  const c = v < p.threshold ? "#ef4444" : v < p.threshold + 10 ? "#fbbf24" : "#22c55e";
                  return (
                    <div key={z} style={{ width: 52, textAlign: "center" }}>
                      <div style={{ color: c, fontWeight: 700, fontSize: 10 }}>{v}</div>
                      <div style={{ height: 4, background: "#0f1f3d", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${v}%`, background: c, borderRadius: 2, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>EARLY WARNING FORECAST</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ ...S.card, marginBottom: 6, background: "#ef444411", border: "1px solid #ef444433" }}>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 11 }}>🚨 NW-047 → Critical</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
              At +3.2% annual growth:<br />
              Video QoE will fall below 70 threshold<br />
              <span style={{ color: "#fbbf24" }}>in 8 months (Nov 2026)</span>
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 6, background: "#fbbf2411", border: "1px solid #fbbf2433" }}>
            <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 11 }}>⚠️ SE-023 → Warning</div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
              Gaming QoE 59 — below 65 threshold<br />
              <span style={{ color: "#ef4444" }}>Already degraded — action needed</span>
            </div>
          </div>
          <div style={S.divider} />
          <div style={S.sectionLabel}>QoE THRESHOLD CONFIG</div>
          <div style={{ marginTop: 6 }}>
            {profiles.map(p => (
              <div key={p.app} style={S.infoRow}>
                <span style={{ color: "#94a3b8", fontSize: 9 }}>{p.app}</span>
                <span style={{ color: "#60a5fa", fontSize: 10 }}>{p.threshold} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SON Panel ────────────────────────────────────────────────────────────────

function SONPanel() {
  const [mlb, setMlb] = useState(true);
  const [mro, setMro] = useState(true);
  const [cco, setCco] = useState(false);
  const [healing, setHealing] = useState(true);

  const features = [
    { key: "mlb", label: "MLB", full: "Mobility Load Balancing", enabled: mlb, toggle: () => setMlb(v => !v),
      desc: "Auto-offloads UEs to adjacent cells when load > 75%. Boundary: ±3dB A3 offset.", impact: "+12% capacity" },
    { key: "mro", label: "MRO", full: "Mobility Robustness Optimization", enabled: mro, toggle: () => setMro(v => !v),
      desc: "Auto-adjusts A3/TTT to reduce HO failures. Boundary: A3 offset ±2dB only.", impact: "-8% HO fail" },
    { key: "cco", label: "CCO", full: "Coverage & Capacity Optimization", enabled: cco, toggle: () => setCco(v => !v),
      desc: "Auto-adjusts antenna tilt (±2°). CAUTION: conflicts with MIMO beam config.", impact: "+7% coverage" },
    { key: "heal", label: "Self-Heal", full: "Self-Healing / Cell Outage Compensation", enabled: healing, toggle: () => setHealing(v => !v),
      desc: "Boosts neighbor power when cell fails. Boundary: max +3dB power.", impact: "Auto-recovery" },
  ];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1.5, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>SON POLICY ENVELOPE — PLANNER CONTROLS WHAT SON MAY DO</div>
        <div style={{ marginTop: 8 }}>
          {features.map(f => (
            <div key={f.key} style={{ ...S.card, marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  onClick={f.toggle}
                  style={{
                    width: 32, height: 16, borderRadius: 8, cursor: "pointer",
                    background: f.enabled ? "#3b82f6" : "#1e3a5f",
                    position: "relative", flexShrink: 0, transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: f.enabled ? 18 : 2,
                    width: 12, height: 12, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s",
                  }} />
                </div>
                <div>
                  <span style={{ color: f.enabled ? "#60a5fa" : "#64748b", fontWeight: 700, fontSize: 11 }}>{f.label}</span>
                  <span style={{ color: "#64748b", fontSize: 9, marginLeft: 6 }}>{f.full}</span>
                </div>
                <span style={{ marginLeft: "auto", ...S.badge(f.enabled ? "#22c55e" : "#3a4a5f"), fontSize: 9 }}>
                  {f.enabled ? f.impact : "disabled"}
                </span>
              </div>
              {f.enabled && <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 4 }}>{f.desc}</div>}
              {f.key === "cco" && cco && (
                <div style={{ color: "#fbbf24", fontSize: 9, marginTop: 4 }}>
                  ⚠️ CONFLICT: CCO tilt adjustment may conflict with MIMO element config. Review MIMO panel.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>SON IMPACT DELTA (ENABLED vs. DISABLED)</div>
        <div style={{ marginTop: 8 }}>
          {[
            ["HO success rate", "91.2%", "+8.4%", "#22c55e"],
            ["Avg cell load", "63.6%", "-6.1%", "#22c55e"],
            ["Ping-pong rate", "3.2%", "-1.8%", "#22c55e"],
            ["Edge SINR", "9.2 dB", "+1.3 dB", "#22c55e"],
            ["CCO tilt events", "0/day", "—", "#64748b"],
          ].map(([l, v, d, c]) => (
            <div key={l} style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>{l}</span>
              <span style={{ color: "#e2e8f0", fontSize: 10 }}>{v} <span style={{ color: c, fontSize: 9 }}>({d})</span></span>
            </div>
          ))}
          <div style={S.divider} />
          <div style={S.sectionLabel}>CONFLICT DETECTOR</div>
          <div style={{ marginTop: 6 }}>
            <div style={{ color: cco ? "#fbbf24" : "#22c55e", fontSize: 10 }}>
              {cco ? "⚠️ CCO ↔ MIMO conflict detected — review tilt boundaries" : "✅ No SON-MIMO conflicts"}
            </div>
            <div style={{ color: "#22c55e", fontSize: 10, marginTop: 4 }}>
              ✅ No SON-QoE conflicts
            </div>
            <div style={{ color: "#22c55e", fontSize: 10, marginTop: 4 }}>
              ✅ MLB-MRO boundary compatible
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lifecycle Panel ──────────────────────────────────────────────────────────

function LifecyclePanel() {
  const scenarios = [
    { id: "T1", cat: "Technology", label: "5G SA mainstream (2027)", score: 82, trend: "↑", color: "#22c55e" },
    { id: "T2", cat: "Technology", label: "mmWave urban densification", score: 68, trend: "→", color: "#60a5fa" },
    { id: "T3", cat: "Technology", label: "LEO satellite offload viable", score: 44, trend: "↑", color: "#fbbf24" },
    { id: "T4", cat: "Technology", label: "AI-native RAN (6G era)", score: 31, trend: "↑", color: "#ef4444" },
    { id: "R1", cat: "Regulatory", label: "B3 refarming mandated", score: 71, trend: "↑", color: "#f97316" },
    { id: "R2", cat: "Regulatory", label: "Spectrum cap tightened", score: 55, trend: "→", color: "#fbbf24" },
    { id: "R3", cat: "Regulatory", label: "Open RAN mandate", score: 48, trend: "↑", color: "#fbbf24" },
    { id: "M1", cat: "Market", label: "MVNO capacity demand surge", score: 63, trend: "→", color: "#60a5fa" },
    { id: "M2", cat: "Market", label: "Enterprise private network comp.", score: 39, trend: "↑", color: "#ef4444" },
  ];

  const catColor = { Technology: "#3b82f6", Regulatory: "#f97316", Market: "#a855f7" };
  const overallScore = Math.round(scenarios.reduce((s, sc) => s + sc.score, 0) / scenarios.length);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 2, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>FUTURE-RESILIENCE SCORECARD — 9 SCENARIOS</div>
        <div style={{ marginTop: 6 }}>
          {["Technology", "Regulatory", "Market"].map(cat => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ color: catColor[cat], fontSize: 9, fontWeight: 700, marginBottom: 3 }}>── {cat.toUpperCase()} SCENARIOS ──</div>
              {scenarios.filter(s => s.cat === cat).map(s => (
                <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ width: 22, color: catColor[cat], fontSize: 9, fontWeight: 700 }}>{s.id}</span>
                  <span style={{ flex: 1, color: "#94a3b8", fontSize: 10 }}>{s.label}</span>
                  <span style={{ width: 16, color: s.color, fontSize: 10 }}>{s.trend}</span>
                  <div style={{ width: 80, height: 6, background: "#0f1f3d", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${s.score}%`, background: s.color, borderRadius: 3, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ width: 28, color: s.color, fontSize: 10, fontWeight: 700, textAlign: "right" }}>{s.score}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>SITE RESILIENCE SCORE</div>
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 8px",
            border: `4px solid ${overallScore >= 60 ? "#22c55e" : overallScore >= 45 ? "#fbbf24" : "#ef4444"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <div style={{ color: overallScore >= 60 ? "#22c55e" : overallScore >= 45 ? "#fbbf24" : "#ef4444", fontWeight: 700, fontSize: 20 }}>
              {overallScore}
            </div>
            <div style={{ color: "#64748b", fontSize: 8 }}>/ 100</div>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 10 }}>Composite resilience across all 9 scenarios</div>
        </div>
        <div style={S.divider} />
        <div style={S.sectionLabel}>PLANNING POSTURE</div>
        <div style={{ marginTop: 6 }}>
          {[
            { label: "Spectrum flexibility", value: "High ✅", c: "#22c55e" },
            { label: "Vendor diversity", value: "Medium ⚠️", c: "#fbbf24" },
            { label: "SA readiness", value: "Planned Q2'26 ✅", c: "#22c55e" },
            { label: "LEO integration", value: "Not assessed", c: "#64748b" },
          ].map(r => (
            <div key={r.label} style={S.infoRow}>
              <span style={{ color: "#94a3b8", fontSize: 9 }}>{r.label}</span>
              <span style={{ color: r.c, fontSize: 9 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={S.divider} />
        <div style={{ color: "#64748b", fontSize: 9 }}>
          ℹ️ Scores reflect resilience of today's planning decision — not predicted future outcomes.
        </div>
      </div>
    </div>
  );
}

// ─── Spectrum Panel ───────────────────────────────────────────────────────────

function SpectrumPanel() {
  const bands = [
    { band: "B3", freq: "1800 MHz", tech: "4G/5G", pci: 42, status: "active", conflicts: [] },
    { band: "n78", freq: "3500 MHz", tech: "5G NR", pci: 10, status: "active", conflicts: ["co-channel SE-023"] },
    { band: "B28", freq: "700 MHz", tech: "4G", pci: 88, status: "active", conflicts: [] },
    { band: "n258", freq: "26 GHz", tech: "5G mmW", pci: null, status: "planned", conflicts: [] },
    { band: "B7",  freq: "2600 MHz", tech: "4G", pci: 155, status: "refarming Q2'27", conflicts: ["refarming risk"] },
  ];

  const gates = [
    { label: "Co-channel interference check", status: "fail", zone: "n78 → SE-023" },
    { label: "PCI collision check", status: "pass", zone: "All bands" },
    { label: "NSA anchor band compatibility", status: "pass", zone: "B3 ↔ n78" },
    { label: "Refarming conflict check", status: "warn", zone: "B7 Q2'27" },
  ];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1.5, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>FREQUENCY ASSIGNMENT TABLE</div>
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 9, marginBottom: 4 }}>
            <span style={{ width: 40 }}>Band</span>
            <span style={{ width: 75 }}>Frequency</span>
            <span style={{ width: 55 }}>Tech</span>
            <span style={{ width: 40 }}>PCI</span>
            <span style={{ width: 90 }}>Status</span>
            <span>Conflicts</span>
          </div>
          {bands.map(b => {
            const hasConflict = b.conflicts.length > 0;
            return (
              <div key={b.band} style={{
                display: "flex", gap: 8, alignItems: "center", padding: "5px 0",
                borderBottom: "1px solid #0f1f3d",
                background: hasConflict ? "#ef444408" : "transparent",
              }}>
                <span style={{ width: 40, color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{b.band}</span>
                <span style={{ width: 75, color: "#e2e8f0", fontSize: 10 }}>{b.freq}</span>
                <span style={{ width: 55, color: "#94a3b8", fontSize: 10 }}>{b.tech}</span>
                <span style={{ width: 40, color: "#e2e8f0", fontSize: 10 }}>{b.pci ?? "—"}</span>
                <span style={{ width: 90 }}>
                  <span style={{
                    ...S.badge(b.status === "active" ? "#22c55e" : b.status === "planned" ? "#60a5fa" : "#fbbf24"),
                    fontSize: 9,
                  }}>{b.status}</span>
                </span>
                <span style={{ color: hasConflict ? "#ef4444" : "#22c55e", fontSize: 9 }}>
                  {hasConflict ? `⚠️ ${b.conflicts[0]}` : "✅ Clear"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>4-CONSTRAINT VALIDATION GATES</div>
        <div style={{ marginTop: 8 }}>
          {gates.map(g => (
            <div key={g.label} style={{ ...S.card, marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{g.status === "pass" ? "✅" : g.status === "fail" ? "❌" : "⚠️"}</span>
                <span style={{ color: g.status === "pass" ? "#22c55e" : g.status === "fail" ? "#ef4444" : "#fbbf24", fontSize: 10, fontWeight: 700 }}>
                  {g.label}
                </span>
              </div>
              <div style={{ color: "#64748b", fontSize: 9, marginTop: 2 }}>{g.zone}</div>
            </div>
          ))}
          <div style={S.divider} />
          <div style={S.sectionLabel}>PCI EXCLUSION ZONES</div>
          <div style={{ marginTop: 6, color: "#94a3b8", fontSize: 10 }}>
            NW-047 neighbors: PCI 42, 88, 155<br />
            Next safe assignment: <span style={{ color: "#60a5fa" }}>PCI 210</span>
          </div>
          <button style={{
            width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: "pointer",
            background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa", marginTop: 8,
          }}>Re-run Constraint Check</button>
        </div>
      </div>
    </div>
  );
}

// ─── HetNet Panel ─────────────────────────────────────────────────────────────

function HetNetPanel() {
  const cells = [
    {
      id: "SC-001", type: "Small Cell", parent: "SITE-A", parentSector: 3,
      gain: { capacity: "+31%", qoe: "+18pts", load: "-24%" },
      pci: 210, powerOffset: -6, mobilityBoundary: "RSRP -105 dBm",
      status: "active", feasibility: 87,
    },
    {
      id: "SC-002", type: "Small Cell", parent: "SITE-B", parentSector: 1,
      gain: { capacity: "+22%", qoe: "+14pts", load: "-18%" },
      pci: 215, powerOffset: -6, mobilityBoundary: "RSRP -103 dBm",
      status: "planned", feasibility: 72,
    },
    {
      id: "DAS-01", type: "Indoor DAS", parent: "SITE-C", parentSector: 2,
      gain: { capacity: "+45%", qoe: "+28pts", load: "-38%" },
      pci: 220, powerOffset: -10, mobilityBoundary: "Building boundary",
      status: "planned", feasibility: 91,
    },
  ];

  const [selected, setSelected] = useState(0);
  const c = cells[selected];

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 140, borderRight: "1px solid #1e3a5f", padding: "10px 10px" }}>
        <div style={S.sectionLabel}>SMALL CELLS ({cells.length})</div>
        <div style={{ marginTop: 8 }}>
          {cells.map((cell, i) => (
            <div key={cell.id} onClick={() => setSelected(i)} style={{
              padding: "6px 8px", borderRadius: 5, marginBottom: 4, cursor: "pointer",
              background: selected === i ? "#0f1f3d" : "transparent",
              border: selected === i ? "1px solid #3b82f6" : "1px solid transparent",
            }}>
              <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{cell.id}</div>
              <div style={{ color: "#64748b", fontSize: 9 }}>{cell.type}</div>
              <div style={{ color: cell.status === "active" ? "#22c55e" : "#fbbf24", fontSize: 9 }}>
                {cell.status}
              </div>
            </div>
          ))}
          <button style={{
            width: "100%", padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
            background: "#0f1f3d", border: "1px solid #1e3a5f", color: "#60a5fa", marginTop: 4,
          }}>+ Add Cell</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>PARENT-CHILD RELATIONSHIP — {c.id}</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ ...S.card, marginBottom: 8 }}>
            <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>↳ Inherits from {c.parent} Sector {c.parentSector}</div>
            <div style={{ marginTop: 6 }}>
              {[
                ["PCI assignment", `${c.pci} (excluded from parent)`],
                ["Power offset", `${c.powerOffset} dB vs. macro`],
                ["Mobility boundary", c.mobilityBoundary],
                ["Feasibility score", `${c.feasibility}%`],
              ].map(([l, v]) => (
                <div key={l} style={S.infoRow}>
                  <span style={{ color: "#94a3b8" }}>{l}</span>
                  <span style={{ color: "#e2e8f0" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.sectionLabel}>HETNET GAIN vs. MACRO-ONLY BASELINE</div>
          <div style={{ marginTop: 6 }}>
            {Object.entries(c.gain).map(([k, v]) => (
              <div key={k} style={S.infoRow}>
                <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k}</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>CONSTRAINT VALIDATION</div>
        <div style={{ marginTop: 8 }}>
          {[
            { label: "PCI collision check", status: "pass" },
            { label: "Power balance valid", status: "pass" },
            { label: "Mobility boundary set", status: "pass" },
            { label: "Parent anchor compatible", status: c.status === "active" ? "pass" : "warn" },
            { label: "Interference overlap check", status: "pass" },
          ].map(g => (
            <div key={g.label} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <span>{g.status === "pass" ? "✅" : "⚠️"}</span>
              <span style={{ color: g.status === "pass" ? "#94a3b8" : "#fbbf24", fontSize: 10 }}>{g.label}</span>
            </div>
          ))}
          <div style={S.divider} />
          <div style={S.sectionLabel}>SITE ACQUISITION STATUS</div>
          <div style={{ marginTop: 6 }}>
            <div style={S.infoRow}>
              <span style={{ color: "#94a3b8" }}>Confidence</span>
              <span style={{ color: c.feasibility >= 80 ? "#22c55e" : "#fbbf24", fontWeight: 700 }}>
                {c.feasibility}%
              </span>
            </div>
            <MiniBar value={c.feasibility} color={c.feasibility >= 80 ? "#22c55e" : "#fbbf24"} />
            <div style={{ color: "#64748b", fontSize: 9, marginTop: 4 }}>
              {c.feasibility >= 80 ? "✅ Eligible for Ranker" : "⚠️ Below 80% — acquisition risk"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slicing Panel ────────────────────────────────────────────────────────────

function SlicingPanel({ genMode }) {
  if (genMode === "4g") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 28 }}>🍰</div>
        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>Network Slicing — 5G SA Required</div>
        <div style={{ color: "#3a4a5f", fontSize: 11, textAlign: "center", maxWidth: 400 }}>
          Switch to 5G NSA or 5G SA mode to configure slice plans.<br />
          4G LTE does not support 3GPP network slicing (S-NSSAI).
        </div>
      </div>
    );
  }

  const zones = MOCK_ZONES;
  const slices = [
    { id: "eMBB", label: "eMBB", desc: "Enhanced Mobile Broadband", color: "#3b82f6",
      qos: "QCI 9 | 100 Mbps guaranteed | 1 Gbps peak", priority: "High" },
    { id: "URLLC", label: "URLLC", desc: "Ultra-Reliable Low Latency", color: "#22c55e",
      qos: "QCI 82 | 1ms latency | 99.9999% reliability", priority: "Critical" },
    { id: "mMTC", label: "mMTC", desc: "Massive IoT / Machine Type", color: "#a855f7",
      qos: "QCI 70 | 1M devices/km² | low power", priority: "Medium" },
  ];

  const activationMap = {
    "NW-047": { eMBB: genMode === "sa" ? "active" : "nsa-pending", URLLC: "planned", mMTC: "planned" },
    "NE-012": { eMBB: genMode === "sa" ? "active" : "active",  URLLC: genMode === "sa" ? "active" : "planned", mMTC: "planned" },
    "SE-023": { eMBB: "planned", URLLC: "planned", mMTC: "planned" },
    "SW-008": { eMBB: genMode === "sa" ? "active" : "active",  URLLC: "planned", mMTC: genMode === "sa" ? "active" : "planned" },
    "CN-031": { eMBB: "planned", URLLC: "planned", mMTC: "planned" },
  };

  const statusColor = { active: "#22c55e", "nsa-pending": "#fbbf24", planned: "#3a4a5f" };
  const statusLabel = { active: "ACTIVE", "nsa-pending": "NSA→SA", planned: "PLANNED" };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1.8, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>PROGRESSIVE SLICE ACTIVATION MAP — DESIGN ONCE, ACTIVATE ZONE BY ZONE</div>
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ width: 65, color: "#64748b", fontSize: 9 }}>Zone</span>
            {slices.map(sl => (
              <span key={sl.id} style={{ flex: 1, color: sl.color, fontWeight: 700, fontSize: 10, textAlign: "center" }}>{sl.label}</span>
            ))}
          </div>
          {zones.map(z => (
            <div key={z.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
              <span style={{ width: 65, color: "#e2e8f0", fontWeight: 700, fontSize: 10 }}>{z.id}</span>
              {slices.map(sl => {
                const st = activationMap[z.id]?.[sl.id] ?? "planned";
                return (
                  <div key={sl.id} style={{ flex: 1, textAlign: "center" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 9,
                      background: statusColor[st] + "22", color: statusColor[st],
                      border: `1px solid ${statusColor[st]}44`, fontWeight: 700,
                    }}>{statusLabel[st]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, padding: "6px 8px", background: "#0f1f3d", borderRadius: 5 }}>
          <div style={{ color: "#64748b", fontSize: 9 }}>
            {genMode === "nsa"
              ? "⚠️ NSA mode: eMBB active on SA-ready zones. URLLC/mMTC activate on SA cutover. Design is complete — activation follows zone migration."
              : "✅ SA mode: Full slice activation available. Each zone activates as infrastructure confirms readiness."}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>SLICE DEFINITIONS</div>
        <div style={{ marginTop: 8 }}>
          {slices.map(sl => (
            <div key={sl.id} style={{ ...S.card, marginBottom: 6, borderLeft: `3px solid ${sl.color}` }}>
              <div style={{ color: sl.color, fontWeight: 700, fontSize: 11 }}>{sl.label} — {sl.desc}</div>
              <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 4 }}>{sl.qos}</div>
              <div style={S.infoRow}>
                <span style={{ color: "#64748b", fontSize: 9 }}>Priority</span>
                <span style={{ color: sl.color, fontSize: 9 }}>{sl.priority}</span>
              </div>
            </div>
          ))}
          <div style={S.divider} />
          <div style={{ color: "#64748b", fontSize: 9 }}>
            ℹ️ Slice plan is defined once by the planner. The engine applies it progressively as zones complete NSA→SA cutover.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Acquisition Panel ────────────────────────────────────────────────────────

function AcquisitionPanel() {
  const initSites = [
    {
      id: "Hillcrest Tower", type: "Macro", gates: {
        physical: { status: "pass", note: "Rooftop structural confirmed" },
        structural: { status: "pass", note: "Load calc approved — 480 kg" },
        legal: { status: "warn", note: "Lease negotiation in progress" },
        commercial: { status: "warn", note: "LL asking $28K/yr — cap $22K" },
      }, confidence: 72, state: "assessing",
    },
    {
      id: "Industrial Park Rd", type: "Small Cell", gates: {
        physical: { status: "pass", note: "Pole identified" },
        structural: { status: "pass", note: "Pole rated OK" },
        legal: { status: "pass", note: "Permit approved" },
        commercial: { status: "pass", note: "MoU signed $3.2K/yr" },
      }, confidence: 91, state: "feasible",
    },
    {
      id: "4th St Rooftop", type: "Small Cell", gates: {
        physical: { status: "pass", note: "Coverage match confirmed" },
        structural: { status: "fail", note: "Load rating exceeded — requires reinforcement" },
        legal: { status: "pass", note: "Permit pending" },
        commercial: { status: "warn", note: "Awaiting LL sign-off" },
      }, confidence: 31, state: "blocked",
    },
  ];

  const [sites, setSites] = useState(initSites);
  const [selected, setSelected] = useState(0);
  const [reevaling, setReevaling] = useState(false);
  const [sentToRanker, setSentToRanker] = useState(false);

  const site = sites[selected];
  const gateColor = { pass: "#22c55e", fail: "#ef4444", warn: "#fbbf24" };
  const stateColor = { assessing: "#60a5fa", feasible: "#22c55e", blocked: "#ef4444", deferred: "#fbbf24", ranked: "#a855f7" };
  const gateLabels = { physical: "🏔️ Physical", structural: "🏗️ Structural", legal: "⚖️ Legal", commercial: "💰 Commercial" };

  function reEvaluate() {
    setReevaling(true);
    setTimeout(() => {
      setSites(prev => prev.map((s, i) => {
        if (i !== selected) return s;
        // Hillcrest: simulate legal gate progressing
        if (s.id === "Hillcrest Tower") {
          return { ...s,
            gates: { ...s.gates, legal: { status: "pass", note: "Lease signed — $24K/yr (within budget)" } },
            confidence: 84, state: "feasible",
          };
        }
        return s;
      }));
      setReevaling(false);
    }, 1500);
  }

  function sendToRanker() {
    setSites(prev => prev.map((s, i) => i === selected ? { ...s, state: "ranked" } : s));
    setSentToRanker(true);
  }

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 150, borderRight: "1px solid #1e3a5f", padding: "10px 10px" }}>
        <div style={S.sectionLabel}>SITE PIPELINE</div>
        <div style={{ marginTop: 8 }}>
          {sites.map((s, i) => (
            <div key={s.id} onClick={() => { setSelected(i); setSentToRanker(false); }} style={{
              padding: "6px 8px", borderRadius: 5, marginBottom: 4, cursor: "pointer",
              background: selected === i ? "#0f1f3d" : "transparent",
              border: selected === i ? "1px solid #3b82f6" : "1px solid transparent",
            }}>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 10 }}>{s.id.split(" ")[0]}</div>
              <div style={{ color: "#64748b", fontSize: 9 }}>{s.type}</div>
              <div style={{ ...S.badge(stateColor[s.state] || "#60a5fa"), fontSize: 8, marginTop: 3 }}>{s.state}</div>
            </div>
          ))}
          <button style={{
            width: "100%", padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
            background: "#0f1f3d", border: "1px solid #1e3a5f", color: "#60a5fa", marginTop: 4,
          }}>+ New Site</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>4-GATE FEASIBILITY — {site.id}</div>
        <div style={{ marginTop: 8 }}>
          {Object.entries(site.gates).map(([gate, g]) => (
            <div key={gate} style={{ ...S.card, marginBottom: 6, transition: "all 0.3s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>{g.status === "pass" ? "✅" : g.status === "fail" ? "❌" : "⚠️"}</span>
                <span style={{ color: gateColor[g.status], fontWeight: 700, fontSize: 11 }}>{gateLabels[gate]}</span>
                <span style={{ marginLeft: "auto", ...S.badge(gateColor[g.status]), fontSize: 9 }}>{g.status.toUpperCase()}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 4 }}>{g.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 0.9, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>CONFIDENCE SCORE</div>
        <div style={{ marginTop: 8, textAlign: "center" }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%", margin: "0 auto 8px",
            border: `4px solid ${site.confidence >= 80 ? "#22c55e" : site.confidence >= 50 ? "#fbbf24" : "#ef4444"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
            transition: "all 0.4s",
          }}>
            <div style={{ color: site.confidence >= 80 ? "#22c55e" : site.confidence >= 50 ? "#fbbf24" : "#ef4444", fontWeight: 700, fontSize: 20 }}>
              {site.confidence}
            </div>
            <div style={{ color: "#64748b", fontSize: 8 }}>%</div>
          </div>
          <div style={{ color: site.confidence >= 80 ? "#22c55e" : "#fbbf24", fontSize: 10, fontWeight: 700 }}>
            {site.confidence >= 80 ? "✅ Enters Ranker" : site.confidence >= 50 ? "⚠️ At-risk" : "❌ Blocked — fix gates"}
          </div>
        </div>
        <div style={S.divider} />
        <div style={S.sectionLabel}>STATE</div>
        <div style={{ marginTop: 6 }}>
          <span style={{ ...S.badge(stateColor[site.state] || "#60a5fa"), fontSize: 10 }}>{site.state.toUpperCase()}</span>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={reEvaluate} disabled={reevaling} style={{
            width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: reevaling ? "default" : "pointer",
            background: reevaling ? "#0a1628" : "#0f3460",
            border: `1px solid ${reevaling ? "#1e3a5f" : "#3b82f6"}`,
            color: reevaling ? "#64748b" : "#60a5fa",
          }}>{reevaling ? "⏳ Re-evaluating…" : "Re-evaluate Gates"}</button>
          {site.state !== "blocked" && site.state !== "ranked" && (
            <button onClick={sendToRanker} style={{
              width: "100%", padding: "5px", borderRadius: 5, fontSize: 10, cursor: "pointer",
              background: "#14532d22", border: "1px solid #22c55e44", color: "#22c55e", marginTop: 6,
            }}>Send to Ranker ▶</button>
          )}
          {(site.state === "ranked" || sentToRanker) && (
            <div style={{ marginTop: 8, color: "#a855f7", fontSize: 10 }}>
              ✅ Submitted to Multi-Objective Ranker
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drive Test Panel ─────────────────────────────────────────────────────────

function DriveTestPanel() {
  const initMeasurements = [
    { id: "DT-001", zone: "NW-047", date: "2026-03-18", model: -98.2, field: -95.8, delta: 2.4, action: "auto-calibrated" },
    { id: "DT-002", zone: "SE-023", date: "2026-03-18", model: -104.1, field: -96.3, delta: 7.8, action: "escalated" },
    { id: "DT-003", zone: "NE-012", date: "2026-03-19", model: -91.5, field: -92.0, delta: 0.5, action: "archived" },
    { id: "DT-004", zone: "CN-031", date: "2026-03-20", model: -99.8, field: -96.2, delta: 3.6, action: "auto-calibrated" },
    { id: "DT-005", zone: "SW-008", date: "2026-03-20", model: -88.3, field: -89.1, delta: 0.8, action: "archived" },
  ];

  const [measurements, setMeasurements] = useState(initMeasurements);
  const [investigation, setInvestigation] = useState(null); // "investigating" | "resolved"

  function acceptDelta() {
    setMeasurements(m => m.map(r => r.id === "DT-002" ? { ...r, action: "accepted", delta: 7.8 } : r));
    setInvestigation(null);
  }
  function investigate() {
    setInvestigation("investigating");
    setTimeout(() => setInvestigation("resolved"), 2000);
  }

  const actionColor = { "auto-calibrated": "#22c55e", escalated: "#ef4444", archived: "#64748b", accepted: "#22c55e" };
  const actionIcon  = { "auto-calibrated": "⚙️", escalated: "🚨", archived: "📁", accepted: "✅" };
  const dt002 = measurements.find(m => m.id === "DT-002");

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 2, padding: "10px 14px", borderRight: "1px solid #1e3a5f" }}>
        <div style={S.sectionLabel}>MEASUREMENT LOG — MODEL vs. FIELD</div>
        <div style={{ marginTop: 6 }}>
          <div style={{ display: "flex", gap: 8, color: "#64748b", fontSize: 9, marginBottom: 4 }}>
            <span style={{ width: 55 }}>Run ID</span>
            <span style={{ width: 50 }}>Zone</span>
            <span style={{ width: 70 }}>Date</span>
            <span style={{ width: 65 }}>Model dBm</span>
            <span style={{ width: 65 }}>Field dBm</span>
            <span style={{ width: 55 }}>Δ dB</span>
            <span>Action</span>
          </div>
          {measurements.map(m => {
            const c = actionColor[m.action] || "#64748b";
            return (
              <div key={m.id} style={{
                display: "flex", gap: 8, alignItems: "center", padding: "4px 0",
                borderBottom: "1px solid #0f1f3d",
                background: m.action === "escalated" ? "#ef444408" : "transparent",
              }}>
                <span style={{ width: 55, color: "#60a5fa", fontSize: 10 }}>{m.id}</span>
                <span style={{ width: 50, color: "#e2e8f0", fontSize: 10 }}>{m.zone}</span>
                <span style={{ width: 70, color: "#64748b", fontSize: 9 }}>{m.date}</span>
                <span style={{ width: 65, color: "#94a3b8", fontSize: 10 }}>{m.model}</span>
                <span style={{ width: 65, color: "#e2e8f0", fontSize: 10 }}>{m.field}</span>
                <span style={{ width: 55, color: c, fontWeight: 700, fontSize: 10 }}>+{m.delta} dB</span>
                <span style={{ color: c, fontSize: 10 }}>{actionIcon[m.action]} {m.action}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, padding: "10px 14px" }}>
        <div style={S.sectionLabel}>AUTO-CALIBRATION FRAMEWORK</div>
        <div style={{ marginTop: 8 }}>
          {[
            { range: "Δ < 2 dB", action: "Archive as ground truth", color: "#64748b", icon: "📁" },
            { range: "Δ 2–6 dB", action: "Auto-calibrate model parameters", color: "#22c55e", icon: "⚙️" },
            { range: "Δ > 6 dB", action: "Escalate to planner alert", color: "#ef4444", icon: "🚨" },
          ].map(r => (
            <div key={r.range} style={{ ...S.card, marginBottom: 6, borderLeft: `3px solid ${r.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{r.icon}</span>
                <span style={{ color: r.color, fontWeight: 700, fontSize: 10 }}>{r.range}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 9, marginTop: 3 }}>{r.action}</div>
            </div>
          ))}
          <div style={S.divider} />
          <div style={S.sectionLabel}>ACTIVE ESCALATION</div>
          {dt002?.action === "escalated" ? (
            <div style={{ marginTop: 6, ...S.card, background: "#ef444411", border: "1px solid #ef444433" }}>
              <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 11 }}>🚨 DT-002 — SE-023</div>
              <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 4 }}>
                Δ = 7.8 dB — exceeds 6dB safety threshold<br />
                Model: -104.1 dBm | Field: -96.3 dBm<br />
                {investigation === "investigating" && <span style={{ color: "#60a5fa" }}>⏳ Running path-loss analysis…</span>}
                {investigation === "resolved" && <span style={{ color: "#fbbf24" }}>⚠️ Likely new building obstruction (12m, 80m away)</span>}
                {!investigation && <span style={{ color: "#fbbf24" }}>Possible obstruction or model error</span>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={investigate} disabled={!!investigation} style={{
                  flex: 1, padding: "3px", borderRadius: 4, fontSize: 9, cursor: investigation ? "default" : "pointer",
                  background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa", opacity: investigation ? 0.5 : 1,
                }}>
                  {investigation === "investigating" ? "⏳ Investigating…" : investigation === "resolved" ? "🔍 Analyzed" : "Investigate"}
                </button>
                <button onClick={acceptDelta} style={{
                  flex: 1, padding: "3px", borderRadius: 4, fontSize: 9, cursor: "pointer",
                  background: "#14532d22", border: "1px solid #22c55e44", color: "#22c55e",
                }}>Accept Δ</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 6, padding: "8px 10px", background: "#14532d22", border: "1px solid #22c55e22", borderRadius: 6 }}>
              <div style={{ color: "#22c55e", fontSize: 10 }}>✅ No active escalations — DT-002 resolved</div>
            </div>
          )}
          <div style={{ marginTop: 8, color: "#64748b", fontSize: 9 }}>
            ℹ️ All measurements are permanently archived as ground truth regardless of action taken.
          </div>
        </div>
      </div>
    </div>
  );
}

function FunctionDetailPanel({ activeFunc, genMode }) {
  if (activeFunc === "zones")        return <ZonesPanel genMode={genMode} />;
  if (activeFunc === "capacity")     return <CapacityPanel />;
  if (activeFunc === "interference") return <InterferencePanel />;
  if (activeFunc === "mimo")         return <MIMOPanel />;
  if (activeFunc === "qoe")          return <QoEPanel />;
  if (activeFunc === "son")          return <SONPanel />;
  if (activeFunc === "lifecycle")    return <LifecyclePanel />;
  if (activeFunc === "spectrum")     return <SpectrumPanel />;
  if (activeFunc === "hetnet")       return <HetNetPanel />;
  if (activeFunc === "handover")     return <HandoverPanel />;
  if (activeFunc === "slicing")      return <SlicingPanel genMode={genMode} />;
  if (activeFunc === "acquisition")  return <AcquisitionPanel />;
  if (activeFunc === "drivetest")    return <DriveTestPanel />;
  return null;
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ genMode }) {
  const constraints = [
    { label: "Industrial Park Rd", status: "deferred",  detail: "Q3 2026", color: "#fbbf24" },
    { label: "4th St Rooftop",     status: "blocked",   detail: "Permit denied", color: "#ef4444" },
    { label: "Hillcrest Tower",    status: "feasible",  detail: "87% confidence", color: "#22c55e" },
    { label: "Elm Ave Site",       status: "assessing", detail: "In assessment", color: "#60a5fa" },
  ];

  const statusIcon = { deferred: "⏸", blocked: "❌", feasible: "✅", assessing: "🕐" };

  return (
    <div style={S.leftPanel}>
      <div style={S.panelHeader}>PLANNER WORKSPACE</div>
      <div style={S.scrollable}>
        {/* Site Acquisition Summary */}
        <div style={S.panelSection}>
          <div style={S.sectionLabel}>🏗️ ACQUISITION GATEWAY</div>
          <div style={{ marginTop: 6 }}>
            {[["Pending", 3, "#fbbf24"], ["Blocked", 1, "#ef4444"], ["Feasible", 12, "#22c55e"]].map(([l, v, c]) => (
              <div key={l} style={S.infoRow}>
                <span style={{ color: "#64748b", fontSize: 10 }}>{l}</span>
                <span style={S.badge(c)}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Inputs */}
        <div style={S.panelSection}>
          <div style={S.sectionLabel}>ACTIVE INPUTS</div>
          <div style={{ marginTop: 6 }}>
            {[
              ["Generation", genMode.toUpperCase()],
              ["Horizon", "24 months"],
              ["Target", "NW Sector"],
              ["Traffic", "Live + Analog (SITE-F)"],
              ["Peak event", "Super Bowl Feb 2027"],
            ].map(([l, v]) => (
              <div key={l} style={{ marginBottom: 5 }}>
                <div style={{ color: "#64748b", fontSize: 9 }}>{l}</div>
                <div style={{ color: "#e2e8f0", fontSize: 10 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraint Log */}
        <div style={S.panelSection}>
          <div style={S.sectionLabel}>CONSTRAINT LOG</div>
          <div style={{ marginTop: 6 }}>
            {constraints.map(c => (
              <div key={c.label} style={{ marginBottom: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ fontSize: 10 }}>{statusIcon[c.status]}</span>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: 10 }}>{c.label}</div>
                  <div style={{ color: c.color, fontSize: 9 }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{
            width: "100%", padding: "4px", borderRadius: 4, fontSize: 10, cursor: "pointer",
            background: "#0f1f3d", border: "1px solid #1e3a5f", color: "#60a5fa", marginTop: 4,
          }}>+ Add Constraint</button>
        </div>

        {/* Timeline */}
        <div style={S.panelSection}>
          <div style={S.sectionLabel}>TEMPORAL TIMELINE</div>
          <div style={{ marginTop: 8, position: "relative" }}>
            <div style={{ borderLeft: "2px solid #1e3a5f", marginLeft: 6, paddingLeft: 12 }}>
              {[
                { label: "NOW", detail: "Active planning", color: "#60a5fa" },
                { label: "Q2 2026", detail: "SA cutover — East zone", color: "#22c55e" },
                { label: "Q3 2026", detail: "SITE-D online", color: "#e2e8f0" },
                { label: "Q2 2027", detail: "B3 refarming ⚠️", color: "#fbbf24" },
                { label: "Feb 2027", detail: "Super Bowl event", color: "#f97316" },
              ].map((ev, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                  <div style={{
                    position: "absolute", left: -18, top: 3,
                    width: 8, height: 8, borderRadius: "50%",
                    background: ev.color, border: `2px solid ${ev.color}44`,
                  }} />
                  <div style={{ color: ev.color, fontSize: 10, fontWeight: 700 }}>{ev.label}</div>
                  <div style={{ color: "#64748b", fontSize: 9 }}>{ev.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RANPlanningTab() {
  const [genMode, setGenMode]       = useState("nsa");
  const [objective, setObjective]   = useState("Coverage Maximization");
  const [selectedZone, setSelectedZone] = useState(null);
  const [activeFunc, setActiveFunc] = useState("capacity");
  const [detailOpen, setDetailOpen] = useState(true);
  const [scenarioMode, setScenarioMode] = useState(false);

  // When in scenario mode, render the full-height scenario engine
  if (scenarioMode) {
    return <RANScenariosPanel genMode={genMode} onClose={() => setScenarioMode(false)} />;
  }

  return (
    <div style={S.root}>

      {/* ── TOP BAR ── */}
      <div style={S.topBar}>
        <div>
          <div style={S.sectionLabel}>GENERATION MODE</div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {GENERATION_MODES.map(g => (
              <button key={g.id} onClick={() => setGenMode(g.id)} style={S.genBtn(genMode === g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: 1, height: 36, background: "#1e3a5f", flexShrink: 0 }} />

        <div>
          <div style={S.sectionLabel}>PLANNING OBJECTIVE</div>
          <select
            value={objective}
            onChange={e => setObjective(e.target.value)}
            style={{ ...S.select, marginTop: 4 }}
          >
            {OBJECTIVES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ width: 1, height: 36, background: "#1e3a5f", flexShrink: 0 }} />

        <div>
          <div style={S.sectionLabel}>STATUS</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <span style={S.badge("#ef4444")}>3 Alerts</span>
            <span style={S.badge("#fbbf24")}>5 Warnings</span>
            <span style={S.badge("#22c55e")}>5G NSA Active</span>
            {genMode !== "4g" && <span style={S.badge("#60a5fa")}>Anchor Monitoring ●</span>}
          </div>
        </div>

        <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 10 }}>
          🕐 Timeline: 2026-Q2 &nbsp;|&nbsp;
          NorthStar Fiber RAN Planning
        </div>
        <button
          onClick={() => setScenarioMode(true)}
          style={{
            padding: "5px 14px", borderRadius: 5, cursor: "pointer", fontSize: 11,
            border: "1px solid #a855f7", background: "#a855f718",
            color: "#c084fc", fontWeight: 700, letterSpacing: 0.5,
          }}
        >
          🎬 Scenarios
        </button>
      </div>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div style={S.mainLayout}>

        {/* LEFT */}
        <LeftPanel genMode={genMode} />

        {/* CENTER MAP */}
        <div style={S.mapPanel}>
          <div style={S.mapHeader}>
            <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>ZONE MAP</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {["☑ Coverage", "☑ Capacity", genMode !== "4g" ? "☑ Anchor" : "☐ Anchor"].map(l => (
                <span key={l} style={{ color: l.startsWith("☑") ? "#94a3b8" : "#3a4a5f", fontSize: 10 }}>{l}</span>
              ))}
              <button style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: "#0f3460", border: "1px solid #3b82f6", color: "#60a5fa", marginLeft: 8 }}>
                + Site
              </button>
            </div>
          </div>
          <ZoneMap selectedZone={selectedZone} onSelectZone={setSelectedZone} genMode={genMode} />
        </div>

        {/* RIGHT */}
        <div style={{ ...S.rightPanel, overflowY: "auto" }}>
          <div style={{ ...S.panelHeader, position: "sticky", top: 0, zIndex: 2 }}>ZONE DIAGNOSTICS</div>
          <ZoneDiagnosticReport zone={selectedZone} genMode={genMode} />
          <div style={{ borderTop: "1px solid #1e3a5f" }}>
            <div style={{ padding: "6px 12px", borderBottom: "1px solid #0f1f3d" }}>
              <div style={S.sectionLabel}>CANDIDATES — ranked by {objective.split(" ")[0]}</div>
            </div>
            <CandidateCarousel objective={objective} />
          </div>
          <ObjectiveSwitch objective={objective} onChange={setObjective} />
        </div>
      </div>

      {/* ── FUNCTION TAB BAR ── */}
      <div style={S.funcTabBar}>
        {FUNCTION_TABS.map(ft => {
          const disabled = ft.id === "slicing" && genMode === "4g";
          return (
            <button
              key={ft.id}
              onClick={() => {
                if (disabled) return;
                setActiveFunc(ft.id);
                setDetailOpen(true);
              }}
              style={{
                ...S.funcTab(activeFunc === ft.id && detailOpen),
                opacity: disabled ? 0.4 : 1,
                position: "relative",
              }}
            >
              {ft.label}
              {ft.alert && !disabled && (
                <div style={S.alertDot(ft.alert)} />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setDetailOpen(v => !v)}
          style={{ ...S.funcTab(false), marginLeft: "auto" }}
        >
          {detailOpen ? "▼ Collapse" : "▲ Expand"}
        </button>
      </div>

      {/* ── FUNCTION DETAIL PANEL ── */}
      {detailOpen && (
        <div style={{ ...S.detailPanel, height: 200 }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <FunctionDetailPanel activeFunc={activeFunc} genMode={genMode} />
          </div>
        </div>
      )}

    </div>
  );
}
