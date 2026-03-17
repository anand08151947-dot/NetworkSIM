import { useState, useEffect } from "react";

const POPS = ["SEA", "PDX", "BEL", "EVR", "OLY", "SPO"];

const TUNNELS_INIT = [
  { id: "TE-SEA-PDX-01", src: "SEA", dst: "PDX", bw: 100, reserved: 72,  util: 72, rsvp: "UP",   path: "SEA→EVR→PDX" },
  { id: "TE-SEA-SFO-01", src: "SEA", dst: "SFO", bw: 40,  reserved: 38,  util: 95, rsvp: "UP",   path: "SEA→PDX→SFO" },
  { id: "TE-BEL-SEA-01", src: "BEL", dst: "SEA", bw: 100, reserved: 45,  util: 45, rsvp: "UP",   path: "BEL→EVR→SEA" },
  { id: "TE-EVR-SEA-01", src: "EVR", dst: "SEA", bw: 100, reserved: 63,  util: 63, rsvp: "UP",   path: "EVR→SEA" },
  { id: "TE-SEA-SPO-01", src: "SEA", dst: "SPO", bw: 40,  reserved: 28,  util: 70, rsvp: "DOWN", path: "SEA→SPO (backup)" },
  { id: "TE-OLY-SEA-01", src: "OLY", dst: "SEA", bw: 10,  reserved: 4,   util: 40, rsvp: "UP",   path: "OLY→SEA" },
  { id: "TE-PDX-SEA-01", src: "PDX", dst: "SEA", bw: 100, reserved: 55,  util: 55, rsvp: "UP",   path: "PDX→EVR→SEA" },
  { id: "TE-SPO-SEA-01", src: "SPO", dst: "SEA", bw: 40,  reserved: 15,  util: 37, rsvp: "UP",   path: "SPO→SEA" },
];

const RSVP_BW = [
  { pop: "SEA", reserved: 288, total: 400 },
  { pop: "PDX", reserved: 127, total: 200 },
  { pop: "BEL", reserved: 45,  total: 100 },
  { pop: "EVR", reserved: 63,  total: 100 },
  { pop: "OLY", reserved: 14,  total: 50  },
  { pop: "SPO", reserved: 43,  total: 100 },
];

const MATRIX_BASE = [
  [  0, 72, 45, 63,  8, 28],
  [ 55,  0, 12, 20,  4, 15],
  [ 45, 18,  0, 38,  2,  6],
  [ 63, 22, 38,  0,  3,  8],
  [  8,  4,  2,  3,  0,  1],
  [ 28, 15,  6,  8,  1,  0],
];

function utilColor(u) {
  return u >= 80 ? "#ef4444" : u >= 60 ? "#f59e0b" : "#22c55e";
}

function matrixCellColor(val, max) {
  if (val === 0) return "#0f172a";
  const ratio = val / max;
  if (ratio > 0.75) return "#ef4444";
  if (ratio > 0.5)  return "#f97316";
  if (ratio > 0.25) return "#3b82f6";
  return "#1e3a5f";
}

export default function TrafficEngineeringTab() {
  const [tunnels, setTunnels] = useState(TUNNELS_INIT);
  const [matrix, setMatrix] = useState(MATRIX_BASE);

  useEffect(() => {
    const interval = setInterval(() => {
      setMatrix(prev => prev.map((row, ri) =>
        row.map((val, ci) => {
          if (ri === ci) return 0;
          const drift = (Math.random() - 0.45) * 3;
          return Math.max(0, Math.round(val + drift));
        })
      ));
      setTunnels(prev => prev.map(t => {
        const drift = (Math.random() - 0.45) * 4;
        const newUtil = Math.max(5, Math.min(99, t.util + drift));
        return { ...t, util: Math.round(newUtil), reserved: Math.round(t.bw * newUtil / 100) };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const matrixMax = Math.max(...matrix.flat().filter(v => v > 0));
  const totalReserved = RSVP_BW.reduce((s, r) => s + r.reserved, 0);
  const totalAvailable = RSVP_BW.reduce((s, r) => s + r.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "auto", background: "#020817", padding: "12px 14px", gap: 14 }}>
      {/* MPLS TE Tunnel Table */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>MPLS TE Tunnel Table</span>
          <span style={{ fontSize: 10, color: "#64748b" }}>RSVP-TE</span>
          <span style={{ marginLeft: "auto", fontSize: 9, color: "#22c55e" }}>● Live (updates 5s)</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#0a1628" }}>
              {["Tunnel ID", "Source", "Destination", "BW (Gbps)", "Reserved", "Util %", "RSVP", "Path"].map(h => (
                <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid #1e293b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tunnels.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? "#07111f" : "#020817", borderBottom: "1px solid #1e293b22" }}>
                <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "#60a5fa" }}>{t.id}</td>
                <td style={{ padding: "6px 12px", color: "#e2e8f0" }}>{t.src}</td>
                <td style={{ padding: "6px 12px", color: "#e2e8f0" }}>{t.dst}</td>
                <td style={{ padding: "6px 12px", color: "#94a3b8" }}>{t.bw}</td>
                <td style={{ padding: "6px 12px", color: "#94a3b8" }}>{t.reserved}</td>
                <td style={{ padding: "6px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, background: "#1e293b", borderRadius: 3, height: 6 }}>
                      <div style={{ width: `${t.util}%`, height: "100%", background: utilColor(t.util), borderRadius: 3, transition: "width 1s" }} />
                    </div>
                    <span style={{ color: utilColor(t.util), fontWeight: 700 }}>{t.util}%</span>
                  </div>
                </td>
                <td style={{ padding: "6px 12px" }}>
                  <span style={{ color: t.rsvp === "UP" ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: 10 }}>● {t.rsvp}</span>
                </td>
                <td style={{ padding: "6px 12px", color: "#475569", fontFamily: "monospace", fontSize: 10 }}>{t.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Traffic Matrix Heatmap */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>Inter-POP Traffic Matrix (Gbps)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 10px", color: "#334155", fontSize: 10 }}>src \ dst</th>
                {POPS.map(p => (
                  <th key={p} style={{ padding: "4px 12px", color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POPS.map((src, ri) => (
                <tr key={src}>
                  <td style={{ padding: "4px 10px", color: "#60a5fa", fontWeight: 700, fontSize: 11 }}>{src}</td>
                  {POPS.map((dst, ci) => {
                    const val = matrix[ri][ci];
                    const isDiag = ri === ci;
                    return (
                      <td
                        key={dst}
                        style={{
                          padding: "8px 14px",
                          background: isDiag ? "#1e293b" : matrixCellColor(val, matrixMax),
                          borderRadius: 6,
                          textAlign: "center",
                          color: isDiag ? "#334155" : val > matrixMax * 0.5 ? "#fff" : "#cbd5e1",
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: isDiag ? 400 : 600,
                          transition: "background 1s",
                          minWidth: 48,
                        }}
                      >{isDiag ? "—" : val}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 9, color: "#334155" }}>Low</span>
          {["#1e3a5f", "#3b82f6", "#f97316", "#ef4444"].map(c => (
            <div key={c} style={{ width: 28, height: 10, background: c, borderRadius: 2 }} />
          ))}
          <span style={{ fontSize: 9, color: "#334155" }}>High</span>
        </div>
      </div>

      {/* RSVP Bandwidth Summary */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>RSVP Bandwidth Summary</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Total Reserved: <span style={{ color: "#f59e0b", fontWeight: 700 }}>{totalReserved} Gbps</span>
            {" / "}
            <span style={{ color: "#94a3b8" }}>{totalAvailable} Gbps Available</span>
          </div>
        </div>
        {RSVP_BW.map(r => {
          const pct = Math.round((r.reserved / r.total) * 100);
          return (
            <div key={r.pop} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, minWidth: 36 }}>{r.pop}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>{r.reserved} / {r.total} Gbps</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: utilColor(pct) }}>{pct}%</span>
              </div>
              <div style={{ background: "#1e293b", borderRadius: 4, height: 12, position: "relative" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: utilColor(pct), borderRadius: 4, transition: "width 1s ease" }} />
                <div style={{ position: "absolute", right: 0, top: 0, width: `${100 - pct}%`, height: "100%", background: "#1e3a5f44", borderRadius: "0 4px 4px 0" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
