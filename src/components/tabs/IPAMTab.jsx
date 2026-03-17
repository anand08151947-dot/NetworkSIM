import { useState } from "react";

const POOLS = [
  { name: "Customer Pool",  cidr: "10.0.0.0/8",        used: 42180, total: 65536, color: "#3b82f6" },
  { name: "Management",     cidr: "172.16.0.0/12",      used: 312,   total: 4096,  color: "#10b981" },
  { name: "CGNAT Pool",     cidr: "100.64.0.0/10",      used: 59200, total: 65536, color: "#f59e0b" },
  { name: "Loopbacks",      cidr: "192.168.0.0/24",     used: 87,    total: 254,   color: "#a855f7" },
  { name: "Transit",        cidr: "198.51.100.0/24",    used: 28,    total: 62,    color: "#06b6d4" },
];

const SUBNET_TREE = [
  {
    prefix: "10.0.0.0/8", name: "Customer", color: "#3b82f6",
    children: [
      { prefix: "10.1.0.0/16", name: "Bellingham CO",  used: 4821, total: 65534, vlan: 100, gw: "10.1.0.1",   dns: "10.0.0.1", equip: "OLT-BEL-01" },
      { prefix: "10.2.0.0/16", name: "Everett CO",     used: 6203, total: 65534, vlan: 200, gw: "10.2.0.1",   dns: "10.0.0.1", equip: "OLT-EVR-01" },
      { prefix: "10.3.0.0/16", name: "Seattle CO",     used: 8910, total: 65534, vlan: 300, gw: "10.3.0.1",   dns: "10.0.0.1", equip: "OLT-SEA-01" },
      { prefix: "10.4.0.0/16", name: "Olympia CO",     used: 2140, total: 65534, vlan: 400, gw: "10.4.0.1",   dns: "10.0.0.1", equip: "OLT-OLY-01" },
      { prefix: "10.5.0.0/16", name: "Spokane CO",     used: 5200, total: 65534, vlan: 500, gw: "10.5.0.1",   dns: "10.0.0.1", equip: "OLT-SPO-01" },
      { prefix: "10.6.0.0/16", name: "Portland CO",    used: 7880, total: 65534, vlan: 600, gw: "10.6.0.1",   dns: "10.0.0.1", equip: "OLT-PDX-01" },
    ],
  },
  {
    prefix: "172.16.0.0/12", name: "Management", color: "#10b981",
    children: [
      { prefix: "172.16.1.0/24", name: "Network Equipment", used: 180, total: 254, vlan: 999, gw: "172.16.1.1", dns: "172.16.0.5", equip: "Core/Metro routers" },
      { prefix: "172.16.2.0/24", name: "Servers",           used: 95,  total: 254, vlan: 998, gw: "172.16.2.1", dns: "172.16.0.5", equip: "OSS/BSS Servers" },
      { prefix: "172.16.3.0/24", name: "OOB Management",    used: 37,  total: 254, vlan: 997, gw: "172.16.3.1", dns: "172.16.0.5", equip: "Console servers" },
    ],
  },
  {
    prefix: "100.64.0.0/10", name: "CGNAT", color: "#f59e0b",
    children: [
      { prefix: "100.64.0.0/16", name: "CGNAT Pool 1 (92% used)", used: 60292, total: 65534, vlan: 700, gw: "100.64.0.1", dns: "10.0.0.1", equip: "CGNAT-A10-01" },
      { prefix: "100.65.0.0/16", name: "CGNAT Pool 2 (67% used)", used: 43908, total: 65534, vlan: 701, gw: "100.65.0.1", dns: "10.0.0.1", equip: "CGNAT-A10-02" },
    ],
  },
  {
    prefix: "192.168.0.0/24", name: "Loopbacks", color: "#a855f7",
    children: [
      { prefix: "192.168.0.0/28",  name: "Core Loopbacks",   used: 14, total: 14, vlan: null, gw: "N/A", dns: "N/A", equip: "Core routers" },
      { prefix: "192.168.0.16/28", name: "Metro Loopbacks",  used: 12, total: 14, vlan: null, gw: "N/A", dns: "N/A", equip: "Metro routers" },
      { prefix: "192.168.0.32/28", name: "Access Loopbacks", used: 8,  total: 14, vlan: null, gw: "N/A", dns: "N/A", equip: "OLT devices" },
    ],
  },
];

const VLANS = [
  { id: 1,   name: "Management",    purpose: "Network OAM",       subnet: "172.16.1.0/24",  status: "Active" },
  { id: 100, name: "Bellingham-CPE",purpose: "Customer residential", subnet: "10.1.0.0/16",  status: "Active" },
  { id: 200, name: "Everett-CPE",   purpose: "Customer residential", subnet: "10.2.0.0/16",  status: "Active" },
  { id: 300, name: "Seattle-CPE",   purpose: "Customer residential", subnet: "10.3.0.0/16",  status: "Active" },
  { id: 400, name: "Olympia-CPE",   purpose: "Customer residential", subnet: "10.4.0.0/16",  status: "Active" },
  { id: 500, name: "Spokane-CPE",   purpose: "Customer residential", subnet: "10.5.0.0/16",  status: "Active" },
  { id: 700, name: "CGNAT-A",       purpose: "Carrier-grade NAT",   subnet: "100.64.0.0/16", status: "Active" },
  { id: 701, name: "CGNAT-B",       purpose: "Carrier-grade NAT",   subnet: "100.65.0.0/16", status: "Active" },
  { id: 998, name: "OSS-Servers",   purpose: "Internal systems",     subnet: "172.16.2.0/24", status: "Active" },
  { id: 999, name: "OOB-MGMT",      purpose: "Out-of-band mgmt",     subnet: "172.16.3.0/24", status: "Active" },
];

export default function IPAMTab() {
  const [expanded, setExpanded] = useState({ "10.0.0.0/8": true });
  const [selected, setSelected] = useState(null);

  const toggleExpand = (prefix) => setExpanded(e => ({ ...e, [prefix]: !e[prefix] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: "#020817" }}>
      {/* Pool Summary Cards */}
      <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#070d1a", borderBottom: "1px solid #1e293b", flexShrink: 0, overflowX: "auto" }}>
        {POOLS.map(p => {
          const pct = Math.round((p.used / p.total) * 100);
          return (
            <div key={p.name} style={{ minWidth: 160, background: "#0f172a", border: `1px solid ${p.color}44`, borderRadius: 8, padding: "10px 12px", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginBottom: 6 }}>{p.cidr}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>{p.used.toLocaleString()} / {p.total.toLocaleString()}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: pct > 85 ? "#ef4444" : pct > 65 ? "#f59e0b" : "#22c55e" }}>{pct}%</span>
              </div>
              <div style={{ background: "#1e293b", borderRadius: 3, height: 5 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct > 85 ? "#ef4444" : pct > 65 ? "#f59e0b" : p.color, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main content: Subnet Tree + Detail Panel */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Subnet Tree */}
        <div style={{ flex: "0 0 52%", overflow: "auto", borderRight: "1px solid #1e293b", padding: "10px 0" }}>
          <div style={{ padding: "0 14px 8px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1 }}>SUBNET HIERARCHY</div>
          {SUBNET_TREE.map(group => (
            <div key={group.prefix}>
              <div
                onClick={() => toggleExpand(group.prefix)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", cursor: "pointer", background: "#070d1a", borderBottom: "1px solid #1e293b22" }}
              >
                <span style={{ color: "#64748b", fontSize: 11 }}>{expanded[group.prefix] ? "▼" : "▶"}</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: group.color, fontWeight: 700 }}>{group.prefix}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{group.name}</span>
              </div>
              {expanded[group.prefix] && group.children.map(child => (
                <div
                  key={child.prefix}
                  onClick={() => setSelected(selected?.prefix === child.prefix ? null : child)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 32px", cursor: "pointer",
                    background: selected?.prefix === child.prefix ? "#0f1f3d" : "transparent",
                    borderBottom: "1px solid #1e293b11",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#334155" }}>└─</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#60a5fa" }}>{child.prefix}</span>
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>{child.name}</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>{child.used}/{child.total}</span>
                    <div style={{ width: 40, background: "#1e293b", borderRadius: 2, height: 4 }}>
                      <div style={{ width: `${Math.round(child.used / child.total * 100)}%`, height: "100%", background: group.color, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px" }}>
          {selected ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 12 }}>{selected.prefix} — {selected.name}</div>
              {[
                ["VLAN", selected.vlan ?? "N/A"],
                ["Gateway", selected.gw],
                ["DNS", selected.dns],
                ["Equipment", selected.equip],
                ["Allocated", `${selected.used.toLocaleString()} IPs`],
                ["Available", `${(selected.total - selected.used).toLocaleString()} IPs`],
                ["Utilization", `${Math.round(selected.used / selected.total * 100)}%`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #1e293b", fontSize: 12 }}>
                  <span style={{ color: "#64748b", minWidth: 90 }}>{k}</span>
                  <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: 12, background: "#0f172a", borderRadius: 8, border: "1px solid #1e293b" }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8, fontWeight: 700 }}>SAMPLE ALLOCATED IPs</div>
                {Array.from({ length: 8 }, (_, i) => {
                  const base = selected.prefix.split(".").slice(0, 3).join(".");
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, fontSize: 10, color: "#94a3b8", padding: "3px 0", fontFamily: "monospace" }}>
                      <span>{base}.{i + 10}</span>
                      <span style={{ color: "#475569" }}>CPE-{selected.name.split(" ")[0].toUpperCase()}-{String(i + 1).padStart(4, "0")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 12 }}>
              ← Click a subnet to view allocation details
            </div>
          )}
        </div>
      </div>

      {/* VLAN Table */}
      <div style={{ flexShrink: 0, borderTop: "1px solid #1e293b", overflow: "auto", maxHeight: 200 }}>
        <div style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, background: "#070d1a" }}>VLAN TABLE</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#0a1628" }}>
              {["VLAN ID", "Name", "Purpose", "Subnet", "Status"].map(h => (
                <th key={h} style={{ padding: "6px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid #1e293b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VLANS.map((v, i) => (
              <tr key={v.id} style={{ background: i % 2 === 0 ? "#07111f" : "#020817", borderBottom: "1px solid #1e293b22" }}>
                <td style={{ padding: "5px 12px", fontFamily: "monospace", color: "#60a5fa" }}>{v.id}</td>
                <td style={{ padding: "5px 12px", color: "#e2e8f0" }}>{v.name}</td>
                <td style={{ padding: "5px 12px", color: "#94a3b8" }}>{v.purpose}</td>
                <td style={{ padding: "5px 12px", fontFamily: "monospace", color: "#64748b" }}>{v.subnet}</td>
                <td style={{ padding: "5px 12px" }}><span style={{ color: "#22c55e", fontSize: 10 }}>● {v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
