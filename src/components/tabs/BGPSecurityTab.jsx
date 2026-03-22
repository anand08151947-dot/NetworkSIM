import { useState, useEffect, useRef } from "react";

const INITIAL_ROUTES = [
  { prefix: "8.8.8.0/24",      nextHop: "198.51.100.1", asPath: "AS7029 AS174 AS15169",  communities: "7029:1000 174:21000", rpki: "Valid",   age: "2d 4h",  status: "Active" },
  { prefix: "1.1.1.0/24",      nextHop: "203.0.113.1",  asPath: "AS7029 AS3356 AS13335", communities: "7029:1000 3356:100",  rpki: "Valid",   age: "5d 2h",  status: "Active" },
  { prefix: "9.9.9.0/24",      nextHop: "198.51.100.2", asPath: "AS7029 AS3356 AS19281", communities: "7029:1000",           rpki: "Valid",   age: "1d 7h",  status: "Active" },
  { prefix: "208.67.222.0/24", nextHop: "198.51.100.1", asPath: "AS7029 AS174 AS36692",  communities: "7029:1000 174:21100", rpki: "Valid",   age: "3d 1h",  status: "Active" },
  { prefix: "4.2.2.0/24",      nextHop: "203.0.113.2",  asPath: "AS7029 AS3356",         communities: "7029:2000 3356:200",  rpki: "Unknown", age: "12h",    status: "Active" },
  { prefix: "192.0.2.0/24",    nextHop: "198.51.100.3", asPath: "AS7029 AS7922",         communities: "7029:2000",           rpki: "Unknown", age: "6h 30m", status: "Active" },
  { prefix: "72.14.192.0/18",  nextHop: "198.51.100.1", asPath: "AS7029 AS174 AS15169",  communities: "7029:1000 174:22000", rpki: "Valid",   age: "8d 3h",  status: "Active" },
  { prefix: "17.0.0.0/8",      nextHop: "203.0.113.1",  asPath: "AS7029 AS3356 AS714",   communities: "7029:1000",           rpki: "Valid",   age: "15d",    status: "Active" },
  { prefix: "104.16.0.0/12",   nextHop: "203.0.113.3",  asPath: "AS7029 AS6939 AS13335", communities: "7029:3000 6939:100",  rpki: "Valid",   age: "4d 6h",  status: "Active" },
  { prefix: "151.101.0.0/16",  nextHop: "203.0.113.2",  asPath: "AS7029 AS3356 AS54113", communities: "7029:1000",           rpki: "Valid",   age: "2d 14h", status: "Active" },
  { prefix: "31.13.64.0/18",   nextHop: "198.51.100.2", asPath: "AS7029 AS174 AS32934",  communities: "7029:1000 174:23000", rpki: "Invalid", age: "1h 5m",  status: "Active" },
  { prefix: "199.36.158.0/23", nextHop: "198.51.100.4", asPath: "AS7029 AS15169",        communities: "7029:4000",           rpki: "Unknown", age: "3h 20m", status: "Active" },
  { prefix: "185.199.108.0/22",nextHop: "203.0.113.1",  asPath: "AS7029 AS3356 AS36459", communities: "7029:1000",           rpki: "Valid",   age: "5d 11h", status: "Active" },
  { prefix: "13.107.4.0/22",   nextHop: "203.0.113.3",  asPath: "AS7029 AS6939 AS8075",  communities: "7029:2000 6939:200",  rpki: "Valid",   age: "7d 2h",  status: "Active" },
  { prefix: "23.192.0.0/11",   nextHop: "198.51.100.1", asPath: "AS7029 AS174 AS20940",  communities: "7029:1000 174:24000", rpki: "Invalid", age: "45m",    status: "Active" },
];

const WITHDRAWN_IDS = [3, 7, 11];

const SEC_EVENTS_INIT = [
  { id: 1,  time: "14:32:01", sev: "CRITICAL", type: "DDoS",          desc: "Volumetric DDoS attack detected on upstream interface",    src: "185.220.101.x", action: "Blackhole route injected" },
  { id: 2,  time: "14:30:55", sev: "HIGH",     type: "RPKI Fail",     desc: "Invalid RPKI origin on 31.13.64.0/18 from AS174",          src: "198.51.100.2",  action: "Route rejected" },
  { id: 3,  time: "14:28:10", sev: "HIGH",     type: "BGP Anomaly",   desc: "Unexpected AS path prepending from AS6939",                src: "203.0.113.3",   action: "Alert sent to NOC" },
  { id: 4,  time: "14:25:44", sev: "MEDIUM",   type: "Firewall Block", desc: "Port scan detected from external host",                   src: "92.118.160.22", action: "ACL rule applied" },
  { id: 5,  time: "14:22:30", sev: "LOW",      type: "ACL Deny",      desc: "SSH attempt on management interface",                      src: "45.33.32.156",  action: "Logged and dropped" },
  { id: 6,  time: "14:19:05", sev: "CRITICAL", type: "DDoS",          desc: "NTP amplification attack — 82 Gbps inbound",               src: "Multiple",      action: "RTBH triggered" },
  { id: 7,  time: "14:15:22", sev: "MEDIUM",   type: "BGP Anomaly",   desc: "Route flap detected on peer 198.51.100.1",                 src: "198.51.100.1",  action: "Dampening applied" },
  { id: 8,  time: "14:12:48", sev: "HIGH",     type: "Firewall Block", desc: "Known botnet C2 IP attempted connection",                 src: "91.108.4.18",   action: "Blocked + reported" },
  { id: 9,  time: "14:10:00", sev: "LOW",      type: "ACL Deny",      desc: "SNMP probe from unauthorized host",                        src: "10.0.99.50",    action: "Dropped" },
  { id: 10, time: "14:07:33", sev: "MEDIUM",   type: "RPKI Fail",     desc: "Unknown RPKI status for 4.2.2.0/24",                       src: "203.0.113.2",   action: "Accepted with warning" },
  { id: 11, time: "14:05:19", sev: "HIGH",     type: "DDoS",          desc: "UDP flood on port 53 — DNS reflection suspected",          src: "Multiple",      action: "Rate-limit enforced" },
  { id: 12, time: "14:02:01", sev: "LOW",      type: "ACL Deny",      desc: "Telnet attempt on OOB management port",                    src: "172.16.0.200",  action: "Dropped + alert" },
  { id: 13, time: "13:58:44", sev: "MEDIUM",   type: "BGP Anomaly",   desc: "New prefix 192.0.2.0/24 appeared from unexpected peer",    src: "198.51.100.3",  action: "Investigating" },
  { id: 14, time: "13:55:10", sev: "HIGH",     type: "Firewall Block", desc: "SQL injection attempt on customer portal",                 src: "77.247.180.3",  action: "WAF rule triggered" },
  { id: 15, time: "13:52:06", sev: "CRITICAL", type: "RPKI Fail",     desc: "Route hijack attempt: 23.192.0.0/11 via unauthorized AS",  src: "203.0.113.4",   action: "Route rejected + NOC alert" },
  { id: 16, time: "13:48:31", sev: "LOW",      type: "ACL Deny",      desc: "Unauthorized API call to OSS interface",                    src: "10.1.50.9",     action: "Logged" },
  { id: 17, time: "13:45:00", sev: "MEDIUM",   type: "Firewall Block", desc: "Suspicious outbound traffic from server subnet",          src: "172.16.2.45",   action: "Quarantined" },
  { id: 18, time: "13:41:22", sev: "HIGH",     type: "BGP Anomaly",   desc: "Peer session flapped 3x in 10 minutes",                    src: "203.0.113.1",   action: "NOC investigating" },
  { id: 19, time: "13:38:05", sev: "LOW",      type: "ACL Deny",      desc: "ICMP flood from customer segment blocked",                  src: "10.2.0.0/16",   action: "Rate-limited" },
  { id: 20, time: "13:35:00", sev: "MEDIUM",   type: "DDoS",          desc: "Memcached amplification attempt detected and mitigated",   src: "Multiple",      action: "Scrubbing center activated" },
];

const SEV_COLORS = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#64748b" };
const TYPE_COLORS = { DDoS: "#ef4444", "Firewall Block": "#f97316", "RPKI Fail": "#eab308", "BGP Anomaly": "#a855f7", "ACL Deny": "#64748b" };
const RPKI_COLORS = { Valid: "#22c55e", Invalid: "#ef4444", Unknown: "#64748b" };

const NEW_EVENT_POOL = [
  { sev: "HIGH",     type: "DDoS",          desc: "SYN flood detected on border interface",           src: "104.28.x.x",    action: "Mitigation activated" },
  { sev: "MEDIUM",   type: "BGP Anomaly",   desc: "AS path length anomaly detected",                  src: "203.0.113.2",   action: "Monitoring" },
  { sev: "LOW",      type: "ACL Deny",      desc: "FTP probe blocked on management VLAN",              src: "192.168.1.99",  action: "Dropped" },
  { sev: "CRITICAL", type: "RPKI Fail",     desc: "Origin validation failure on critical prefix",      src: "198.51.100.1",  action: "Route withdrawn" },
  { sev: "MEDIUM",   type: "Firewall Block", desc: "Repeated auth failure from external host",         src: "5.188.86.172",  action: "Temp block 1h" },
];

export default function BGPSecurityTab({ faultActive }) {
  const [secEvents, setSecEvents] = useState(SEC_EVENTS_INIT);
  const [selectedRow, setSelectedRow] = useState(null);
  const nextId = useRef(SEC_EVENTS_INIT.length + 1);

  useEffect(() => {
    const interval = setInterval(() => {
      const tmpl = NEW_EVENT_POOL[Math.floor(Math.random() * NEW_EVENT_POOL.length)];
      const now = new Date();
      const time = now.toTimeString().slice(0, 8);
      setSecEvents(prev => [{ ...tmpl, id: nextId.current++, time }, ...prev.slice(0, 39)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const hasCritical = secEvents.some(e => e.sev === "CRITICAL");

  const routes = INITIAL_ROUTES.map((r, i) => {
    if (faultActive && WITHDRAWN_IDS.includes(i)) {
      return { ...r, status: "Withdrawn" };
    }
    return r;
  });

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
      {/* Left: BGP Route Table */}
      <div style={{ flex: "0 0 58%", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border-primary)" }}>
        <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>BGP Route Table — AS7029 (North Star Fiber)</span>
          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            {[["4 Peers UP", "#22c55e"], ["1 Peer DOWN", "#ef4444"], ["15 Prefixes", "#60a5fa"]].map(([label, color]) => (
              <span key={label} style={{ fontSize: 9, fontWeight: 700, color, background: color + "22", border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 7px" }}>{label}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#0a1628", position: "sticky", top: 0 }}>
                {["Prefix", "Next Hop", "AS Path", "Communities", "RPKI", "Age", "Status"].map(h => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid var(--border-primary)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => {
                const withdrawn = r.status === "Withdrawn";
                const isSelected = selectedRow === i;
                return (
                  <tr
                    key={r.prefix}
                    onClick={() => setSelectedRow(isSelected ? null : i)}
                    style={{
                      background: isSelected ? "#0f1f3d" : withdrawn ? "#2d0a0a" : i % 2 === 0 ? "var(--bg-row-alt)" : "var(--bg-root)",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-primary)22",
                      opacity: withdrawn ? 0.7 : 1,
                    }}
                  >
                    <td style={{ padding: "6px 10px", color: "#60a5fa", fontFamily: "monospace" }}>{r.prefix}</td>
                    <td style={{ padding: "6px 10px", color: "var(--text-secondary)", fontFamily: "monospace" }}>{r.nextHop}</td>
                    <td style={{ padding: "6px 10px", color: "#cbd5e1", fontFamily: "monospace", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.asPath}</td>
                    <td style={{ padding: "6px 10px", color: "#64748b", fontFamily: "monospace", fontSize: 10 }}>{r.communities}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <span style={{ color: RPKI_COLORS[r.rpki], fontWeight: 700, fontSize: 10 }}>● {r.rpki}</span>
                    </td>
                    <td style={{ padding: "6px 10px", color: "#64748b" }}>{r.age}</td>
                    <td style={{ padding: "6px 10px" }}>
                      <span style={{ color: withdrawn ? "#ef4444" : "#22c55e", fontWeight: 700, fontSize: 10 }}>
                        {withdrawn ? "⚠ Withdrawn" : "✓ Active"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Security Event Log */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Security Event Log</span>
          {hasCritical && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s infinite" }} />
          )}
          <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>Auto-refresh 8s</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
          {secEvents.map((e) => (
            <div key={e.id} style={{ display: "flex", gap: 8, marginBottom: 6, padding: "8px 10px", background: "var(--bg-secondary)", border: `1px solid ${TYPE_COLORS[e.type]}33`, borderLeft: `3px solid ${TYPE_COLORS[e.type]}`, borderRadius: 6, fontSize: 11 }}>
              <div style={{ minWidth: 62, color: "#64748b", fontSize: 10, paddingTop: 1 }}>{e.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: SEV_COLORS[e.sev], background: SEV_COLORS[e.sev] + "22", border: `1px solid ${SEV_COLORS[e.sev]}55`, borderRadius: 3, padding: "1px 5px" }}>{e.sev}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: TYPE_COLORS[e.type] }}>{e.type}</span>
                </div>
                <div style={{ color: "#cbd5e1", marginBottom: 2 }}>{e.desc}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)" }}>
                  <span>src: <span style={{ color: "#64748b", fontFamily: "monospace" }}>{e.src}</span></span>
                  <span>action: <span style={{ color: "var(--text-secondary)" }}>{e.action}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
