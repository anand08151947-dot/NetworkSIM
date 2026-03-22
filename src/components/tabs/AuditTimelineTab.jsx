import { useState, useMemo } from "react";

const FILTERS = ["ALL", "PROVISIONING", "FAULT", "AUGMENT", "CUSTOMER", "CONFIG"];

const DOT_COLORS = {
  PROVISIONING: "#3b82f6",
  FAULT:        "#ef4444",
  AUGMENT:      "#f59e0b",
  CUSTOMER:     "#6366f1",
  CONFIG:       "#10b981",
  OTHER:        "#64748b",
};

function categorize(action = "") {
  const a = action.toLowerCase();
  if (a.includes("fault") || a.includes("critical") || a.includes("outage") || a.includes("fail")) return "FAULT";
  if (a.includes("customer") || a.includes("added") || a.includes("subscriber")) return "CUSTOMER";
  if (a.includes("augment") || a.includes("capacity") || a.includes("upgrade")) return "AUGMENT";
  if (a.includes("config") || a.includes("nso") || a.includes("ansible") || a.includes("playbook")) return "CONFIG";
  if (a.includes("provision") || a.includes("deploy") || a.includes("activate") || a.includes("install")) return "PROVISIONING";
  return "OTHER";
}

function exportJSON(events) {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditTimelineTab({ events = [] }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const enriched = useMemo(() => events.map(e => ({ ...e, category: categorize(e.action || "") })), [events]);

  const filtered = useMemo(() => {
    return enriched.filter(e => {
      const matchFilter = activeFilter === "ALL" || e.category === activeFilter;
      const matchSearch = !search || (
        (e.action || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.system || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.detail || "").toLowerCase().includes(search.toLowerCase())
      );
      return matchFilter && matchSearch;
    });
  }, [enriched, activeFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "var(--bg-root)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-primary)", flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? DOT_COLORS[f] || "var(--border-subtle)" : "transparent",
                border: `1px solid ${activeFilter === f ? DOT_COLORS[f] || "var(--border-subtle)" : "var(--border-subtle)"}`,
                borderRadius: 5, padding: "3px 10px", cursor: "pointer",
                fontSize: 10, fontWeight: activeFilter === f ? 700 : 400,
                color: activeFilter === f ? "#fff" : "#64748b",
              }}
            >{f}</button>
          ))}
        </div>
        <input
          type="text"
          placeholder="🔍 Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "4px 10px", color: "var(--text-primary)", fontSize: 11, outline: "none", minWidth: 180 }}
        />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => exportJSON(filtered)}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 10, color: "var(--text-secondary)" }}
        >⬇ Export JSON</button>
        <span style={{ fontSize: 10, color: "var(--border-subtle)" }}>{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 13, color: "var(--border-subtle)", textAlign: "center", maxWidth: 320 }}>
              No events recorded yet. Run a simulation to generate audit trail.
            </div>
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: 120 }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 96, top: 0, bottom: 0, width: 2, background: "var(--bg-elevated)" }} />

            {[...filtered].reverse().map((e, i) => {
              const cat = e.category || "OTHER";
              const color = e.color || DOT_COLORS[cat];
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
                  {/* Time */}
                  <div style={{ position: "absolute", left: -120, width: 110, textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "var(--text-primary)", fontFamily: "monospace" }}>{e.time}</div>
                    <div style={{ fontSize: 9, color: "var(--border-subtle)" }}>{new Date().toLocaleDateString()}</div>
                  </div>
                  {/* Dot */}
                  <div style={{ position: "absolute", left: -10, width: 18, height: 18, borderRadius: "50%", background: color, border: "2px solid var(--bg-root)", boxShadow: `0 0 8px ${color}88`, zIndex: 1 }} />
                  {/* Card */}
                  <div style={{ flex: 1, marginLeft: 14, background: "var(--bg-secondary)", border: `1px solid ${color}44`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{e.action}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color, background: color + "22", border: `1px solid ${color}55`, borderRadius: 3, padding: "1px 6px", marginLeft: "auto", whiteSpace: "nowrap" }}>{cat}</span>
                    </div>
                    {e.system && (
                      <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 2 }}>{e.system}</div>
                    )}
                    {e.detail && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>{e.detail}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
