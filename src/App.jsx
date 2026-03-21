import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { initialNodes, initialEdges, SIMULATION_FLOWS } from "./data/networkTopology";
import { initialCustomers } from "./data/customers";
import { FAULT_SCENARIOS } from "./data/faultScenarios";

import NetworkNode from "./components/NetworkNode";
import TrafficEdge from "./components/TrafficEdge";
import {
  LayerLegend, EventLog, SimulationPanel, StatsBar, NodeDetailPanel, CollapsiblePanel,
} from "./components/UIComponents";
import CapacityChart from "./components/charts/CapacityChart";
import FaultInjector from "./components/panels/FaultInjector";
import ConfigGenerator from "./components/panels/ConfigGenerator";
import AIRunbook from "./components/panels/AIRunbook";
import LayerFilter, { ALL_LAYERS } from "./components/panels/LayerFilter";
import WhatIfPlanner from "./components/panels/WhatIfPlanner";
import NOCTicker from "./components/NOCTicker";
import NodeExpandModal from "./components/NodeExpandModal";
import GeoMapTab from "./components/tabs/GeoMapTab";
import CustomerTab from "./components/tabs/CustomerTab";
import RevenueTab from "./components/tabs/RevenueTab";
import SLATab from "./components/tabs/SLATab";
import BGPSecurityTab from "./components/tabs/BGPSecurityTab";
import IPAMTab from "./components/tabs/IPAMTab";
import AuditTimelineTab from "./components/tabs/AuditTimelineTab";
import CircuitPlannerTab from "./components/tabs/CircuitPlannerTab";
import SimRecorder from "./components/SimRecorder";

const nodeTypes = { networkNode: NetworkNode };
const edgeTypes = { trafficEdge: TrafficEdge };

const STATUS_FROM_CAPACITY = (c) =>
  c >= 80 ? "critical" : c >= 55 ? "warning" : "healthy";

function applyCapacityStatuses(nodes) {
  return nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      status:
        n.data.status === "provisioning" || n.data.status === "augmenting"
          ? n.data.status
          : STATUS_FROM_CAPACITY(n.data.capacity || 0),
    },
  }));
}

const TABS = [
  { id: "topology", label: "🗺️ Network Topology" },
  { id: "geo", label: "🌐 Geographic Map" },
  { id: "customers", label: "👥 Customer Database" },
  { id: "revenue", label: "💰 Revenue & Analytics" },
  { id: "sla", label: "📋 SLA Tracker" },
  { id: "bgp", label: "🛡️ BGP & Security" },
  { id: "ipam", label: "📍 IPAM" },
  { id: "audit", label: "📅 Audit Log" },
  { id: "te", label: "🚦 Traffic Engineering" },
  { id: "circuit", label: "📡 Circuit Planner" },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    applyCapacityStatuses(initialNodes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [customers, setCustomers] = useState(initialCustomers);
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [activeSimId, setActiveSimId] = useState(null);
  const [activeFaultId, setActiveFaultId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState("topology");
  const [trafficMode, setTrafficMode] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [declutter, setDeclutter] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState(ALL_LAYERS.map(l => l.id));
  const [dimMode, setDimMode] = useState(false);
  const [expandedNode, setExpandedNode] = useState(null);
  const [dependencyNodeId, setDependencyNodeId] = useState(null);
  const [simSpeed, setSimSpeed] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState('noc');
  const [miniMapVisible, setMiniMapVisible] = useState(false);
  const cancelRef = useRef(false);
  const topologyRef = useRef(null);
  const appRef = useRef(null);

  // Live capacity drift
  useEffect(() => {
    if (running) return;
    const interval = setInterval(() => {
      setNodes((prev) =>
        applyCapacityStatuses(
          prev.map((n) => {
            const drift = (Math.random() - 0.45) * 0.4;
            const newCap = Math.max(2, Math.min(95, (n.data.capacity || 0) + drift));
            return { ...n, data: { ...n.data, capacity: Math.round(newCap * 10) / 10 } };
          })
        )
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [running, setNodes]);

  // Toggle traffic mode edges
  useEffect(() => {
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        type: trafficMode ? "trafficEdge" : undefined,
        data: trafficMode
          ? { utilization: Math.floor(Math.random() * 50) + 10, showLabel: true }
          : undefined,
      }))
    );
  }, [trafficMode, setEdges]);

  const resetAllNodes = useCallback(() => {
    setNodes(
      applyCapacityStatuses(
        initialNodes.map((n) => ({
          ...n,
          data: { ...n.data, isActive: false, isHighlighted: false, actionLabel: null },
        }))
      )
    );
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  const pushEvent = useCallback((step, simColor) => {
    const time = new Date().toTimeString().slice(0, 8);
    setEvents((prev) => [...prev, { ...step, time, color: simColor }]);
  }, []);

  const highlightEdges = useCallback((nodeId) => {
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        animated:
          e.source === nodeId || e.target === nodeId ? true : e.animated,
        style: {
          ...e.style,
          strokeWidth:
            e.source === nodeId || e.target === nodeId
              ? 5
              : e.style?.strokeWidth || 2,
        },
      }))
    );
  }, [setEdges]);

  const activateNode = useCallback(
    (nodeId, actionLabel) => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isActive: n.id === nodeId,
            actionLabel: n.id === nodeId ? actionLabel : n.data.actionLabel,
            status: n.id === nodeId ? "provisioning" : n.data.status,
          },
        }))
      );
      highlightEdges(nodeId);
    },
    [highlightEdges, setNodes]
  );

  const completeNode = useCallback((nodeId, capDelta = 1.5) => {
    setNodes((prev) =>
      applyCapacityStatuses(
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const newCap = Math.min(
            95,
            Math.max(1, (n.data.capacity || 0) + capDelta)
          );
          return {
            ...n,
            data: {
              ...n.data,
              isActive: false,
              isHighlighted: true,
              capacity: Math.round(newCap * 10) / 10,
              status: STATUS_FROM_CAPACITY(newCap),
            },
          };
        })
      )
    );
  }, [setNodes]);

  const runSimulation = useCallback(
    async (simId) => {
      if (running) return;
      cancelRef.current = false;
      setRunning(true);
      setActiveSimId(simId);
      setActiveFaultId(null);
      setStepIndex(-1);
      setEvents([]);
      resetAllNodes();
      setActiveTab("topology");

      const sim = SIMULATION_FLOWS[simId];
      const steps = sim.steps;

      if (simId === "capacity_augment") {
        setNodes((prev) =>
          applyCapacityStatuses(
            prev.map((n) => {
              const overrides = { olt_1: 41, bng: 38, agg_switch: 36, metro_cisco: 33 };
              const cap = overrides[n.id] !== undefined ? overrides[n.id] : n.data.capacity;
              return { ...n, data: { ...n.data, capacity: cap } };
            })
          )
        );
        await new Promise((r) => setTimeout(r, Math.round(800 / simSpeed)));
      }

      for (let i = 0; i < steps.length; i++) {
        if (cancelRef.current) break;
        const step = steps[i];
        setStepIndex(i);
        activateNode(step.nodeId, step.action);
        pushEvent(step, sim.color);
        await new Promise((r) => setTimeout(r, Math.round(1400 / simSpeed)));
        if (cancelRef.current) break;
        const capDelta =
          simId === "capacity_augment" && i >= 5 ? -3 : 1.5;
        completeNode(step.nodeId, capDelta);
        await new Promise((r) => setTimeout(r, Math.round(300 / simSpeed)));
      }

      setNodes((prev) =>
        prev.map((n) => ({ ...n, data: { ...n.data, isActive: false, actionLabel: null } }))
      );
      setEdges(initialEdges);
      setRunning(false);
    },
    [running, resetAllNodes, activateNode, completeNode, pushEvent, simSpeed, setNodes, setEdges]
  );

  const runFault = useCallback(
    async (faultId) => {
      if (running) return;
      cancelRef.current = false;
      setRunning(true);
      setActiveFaultId(faultId);
      setActiveSimId(null);
      setStepIndex(-1);
      setEvents([]);
      resetAllNodes();
      setActiveTab("topology");

      const fault = FAULT_SCENARIOS[faultId];

      // Mark affected nodes as critical
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          data: {
            ...n.data,
            status: fault.affectedNodes.includes(n.id) ? "critical" : n.data.status,
            isActive: false,
          },
        }))
      );
      // Highlight affected edges
      setEdges((prev) =>
        prev.map((e) => ({
          ...e,
          animated: fault.affectedEdges.includes(e.id) ? true : e.animated,
          style: {
            ...e.style,
            stroke: fault.affectedEdges.includes(e.id) ? "#ef4444" : e.style?.stroke,
            strokeWidth: fault.affectedEdges.includes(e.id) ? 4 : e.style?.strokeWidth || 2,
          },
        }))
      );

      await new Promise((r) => setTimeout(r, Math.round(600 / simSpeed)));

      for (let i = 0; i < fault.steps.length; i++) {
        if (cancelRef.current) break;
        const step = fault.steps[i];
        setStepIndex(i);
        activateNode(step.nodeId, step.action);
        pushEvent(step, fault.color);
        await new Promise((r) => setTimeout(r, Math.round(1600 / simSpeed)));
        if (cancelRef.current) break;
        completeNode(step.nodeId, -1); // recovery reduces capacity load
        await new Promise((r) => setTimeout(r, Math.round(300 / simSpeed)));
      }

      setNodes((prev) =>
        applyCapacityStatuses(
          prev.map((n) => ({ ...n, data: { ...n.data, isActive: false, actionLabel: null } }))
        )
      );
      setEdges(initialEdges);
      setRunning(false);
      setActiveFaultId(null);

      // Auto-healing events
      setTimeout(() => {
        const healingSteps = [
          { action: "🔄 NSO: Detecting topology change...", system: "Cisco NSO", detail: "Automated remediation triggered" },
          { action: "⚙️ Ansible: Reconfiguring backup paths", system: "Ansible Tower", detail: "Playbook: restore_fiber_path.yml" },
          { action: "✅ Auto-healing: Primary path restored", system: "SDN Controller", detail: "Traffic rerouted via backup LSP" },
        ];
        healingSteps.forEach((step, i) => {
          setTimeout(() => pushEvent(step, "#10b981"), i * 1200);
        });
      }, 1000);
    },
    [running, resetAllNodes, activateNode, completeNode, pushEvent, simSpeed, setNodes, setEdges]
  );

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setDependencyNodeId(node.id);
  }, []);

  const onNodeDoubleClick = useCallback((_, node) => {
    setExpandedNode(node);
  }, []);

  // Compute nodes for display: apply layer filter + declutter + dependency dimming
  const connectedToSelected = useMemo(() => {
    if (!dependencyNodeId) return null;
    const ids = new Set([dependencyNodeId]);
    edges.forEach(e => {
      if (e.source === dependencyNodeId) ids.add(e.target);
      if (e.target === dependencyNodeId) ids.add(e.source);
    });
    return ids;
  }, [dependencyNodeId, edges]);

  const displayNodes = useMemo(() => {
    return nodes.map(n => {
      const matchesSearch = searchQuery
        ? (n.data.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           n.data.sublabel?.toLowerCase().includes(searchQuery.toLowerCase()))
        : false;
      const layerVisible = visibleLayers.includes(n.data.layer);
      const layerDimmed  = !layerVisible && dimMode;
      return {
        ...n,
        hidden: !layerVisible && !dimMode,
        data: {
          ...n.data,
          declutter,
          dimmed: layerDimmed ||
            (connectedToSelected ? !connectedToSelected.has(n.id) : (searchQuery && !matchesSearch)),
          isHighlighted: searchQuery && matchesSearch ? true : n.data.isHighlighted,
        },
      };
    });
  }, [nodes, visibleLayers, dimMode, declutter, connectedToSelected, searchQuery]);

  const stopAll = useCallback(() => {
    cancelRef.current = true;
    setRunning(false);
    setEdges(initialEdges);
    setNodes((prev) =>
      applyCapacityStatuses(
        prev.map((n) => ({ ...n, data: { ...n.data, isActive: false, actionLabel: null } }))
      )
    );
  }, [setNodes, setEdges]);

  return (
    <div
      ref={appRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#020817",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .react-flow__background{background:#020817!important}
        .react-flow__controls button{background:#0f172a!important;border:1px solid #1e293b!important;color:#94a3b8!important;fill:#94a3b8!important}
        .react-flow__controls button:hover{background:#1e293b!important}
        .react-flow__minimap{background:#0f172a!important;border:1px solid #1e293b;border-radius:8px}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#0f172a}
        ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
        .leaflet-container{background:#020817!important}
      `}</style>

      {/* Stats bar */}
      <StatsBar nodes={nodes} />

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 12px",
          background: "#070d1a",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#0f1f3d" : "transparent",
              border: activeTab === tab.id ? "1px solid #1e3a5f" : "1px solid transparent",
              borderRadius: 6,
              padding: "5px 14px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 700 : 400,
              color: activeTab === tab.id ? "#60a5fa" : "#64748b",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Role switcher */}
        <select
          value={activeRole}
          onChange={e => setActiveRole(e.target.value)}
          style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 8px", color: "#94a3b8", fontSize: 10, cursor: "pointer", outline: "none" }}
        >
          <option value="noc">👨‍💻 NOC Engineer</option>
          <option value="sales">💼 Sales Engineer</option>
          <option value="exec">📊 Executive</option>
          <option value="field">🔧 Field Tech</option>
        </select>

        {/* Traffic flow toggle — only on topology tab */}
        {activeTab === "topology" && (
          <>
            <button
              onClick={() => setTrafficMode((m) => !m)}
              style={{
                background: trafficMode ? "#0f1f3d" : "transparent",
                border: `1px solid ${trafficMode ? "#60a5fa" : "#334155"}`,
                borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                fontSize: 10, color: trafficMode ? "#60a5fa" : "#64748b",
                fontWeight: trafficMode ? 700 : 400,
              }}
            >
              {trafficMode ? "🔵 Traffic ON" : "⚪ Traffic Flow"}
            </button>
            <button
              onClick={() => setDeclutter((d) => !d)}
              style={{
                background: declutter ? "#0f1f3d" : "transparent",
                border: `1px solid ${declutter ? "#a78bfa" : "#334155"}`,
                borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                fontSize: 10, color: declutter ? "#a78bfa" : "#64748b",
                fontWeight: declutter ? 700 : 400,
              }}
            >
              {declutter ? "🔲 Compact ON" : "⬜ Compact Mode"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, color: "#475569" }}>Speed:</span>
              <input
                type="range" min="0.5" max="5" step="0.5" value={simSpeed}
                onChange={e => setSimSpeed(Number(e.target.value))}
                style={{ width: 60, accentColor: "#60a5fa" }}
              />
              <span style={{ fontSize: 9, color: "#60a5fa", minWidth: 24 }}>{simSpeed}x</span>
            </div>
            <input
              type="text"
              placeholder="🔍 Search nodes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "3px 8px", color: "#e2e8f0", fontSize: 10, outline: "none", width: 130 }}
            />
            {dependencyNodeId && (
              <button
                onClick={() => setDependencyNodeId(null)}
                style={{
                  background: "#1a1000", border: "1px solid #f59e0b",
                  borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                  fontSize: 10, color: "#f59e0b", fontWeight: 700,
                }}
              >
                ✕ Clear Blast Radius
              </button>
            )}
            <SimRecorder
              targetRef={appRef}
              running={running}
              activeSimId={activeSimId}
            />
          </>
        )}
      </div>

      {/* ── TOPOLOGY TAB ── */}
      {activeTab === "topology" && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
          {/* Left sidebar */}
          <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
            <div style={{
              width: leftCollapsed ? 0 : 275,
              overflow: "hidden",
              transition: "width 0.25s ease",
              background: "#070d1a",
              borderRight: leftCollapsed ? "none" : "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: leftCollapsed ? 0 : "8px",
              overflowY: leftCollapsed ? "hidden" : "auto",
            }}>
              <SimulationPanel
                simulations={SIMULATION_FLOWS}
                activeSimId={activeSimId}
                onRun={runSimulation}
                running={running}
              />

              <FaultInjector
                onRunFault={runFault}
                running={running}
                activeFaultId={activeFaultId}
              />

              {running && (
                <button
                  onClick={stopAll}
                  style={{
                    background: "#450a0a", border: "1px solid #ef4444",
                    color: "#ef4444", borderRadius: 8, padding: "7px",
                    cursor: "pointer", fontSize: 11, fontWeight: 700,
                  }}
                >⏹ STOP</button>
              )}

              <LayerFilter visibleLayers={visibleLayers} setVisibleLayers={setVisibleLayers} dimMode={dimMode} setDimMode={setDimMode} />
              <LayerLegend />

              {running && (activeSimId || activeFaultId) && stepIndex >= 0 && (
                <div style={{ background: "#0f1f3d", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>
                    STEP {stepIndex + 1} / {activeSimId ? SIMULATION_FLOWS[activeSimId].steps.length : FAULT_SCENARIOS[activeFaultId]?.steps.length}
                  </div>
                  <div style={{ fontSize: 11, color: "#e2e8f0" }}>
                    {activeSimId ? SIMULATION_FLOWS[activeSimId].steps[stepIndex]?.action : FAULT_SCENARIOS[activeFaultId]?.steps[stepIndex]?.action}
                  </div>
                </div>
              )}

              <WhatIfPlanner nodes={nodes} />
            </div>

            {/* Left collapse toggle */}
            <button
              onClick={() => setLeftCollapsed(c => !c)}
              style={{
                position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)",
                zIndex: 10, background: "#0f172a", border: "1px solid #1e3a5f",
                borderRadius: "0 6px 6px 0", width: 13, height: 48, cursor: "pointer",
                color: "#60a5fa", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >{leftCollapsed ? "▶" : "◀"}</button>
          </div>

          {/* Main canvas */}
          <div ref={topologyRef} style={{ flex: 1, position: "relative" }}>
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={() => setDependencyNodeId(null)}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.15}
              maxZoom={2.5}
              defaultEdgeOptions={{ type: "smoothstep" }}
            >
              <Background color="#1e293b" gap={24} size={1} variant="dots" />
              <Controls position="bottom-left" />
              {miniMapVisible && (
                <MiniMap
                  position="bottom-right"
                  nodeColor={(n) => {
                    const colors = {
                      customer: "#6366f1", access: "#0ea5e9", central_office: "#06b6d4",
                      ip_services: "#f59e0b", security: "#ef4444", metro: "#3b82f6",
                      core: "#818cf8", internet: "#22c55e", oss_bss: "#10b981", management: "#64748b",
                    };
                    return colors[n.data?.layer] || "#334155";
                  }}
                  nodeStrokeWidth={0}
                  maskColor="#02081799"
                  style={{
                    background: "#070d1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                  }}
                />
              )}
              <Panel position="top-left">
                <div style={{ display: "flex", flexDirection: "column", gap: 2, pointerEvents: "none", opacity: 0.45 }}>
                  {[
                    ["INTERNET / IXP / TRANSIT", "#22c55e"],
                    ["CORE BACKBONE (OTN/DWDM)", "#6366f1"],
                    ["METRO / TRANSPORT", "#3b82f6"],
                    ["SECURITY + IP SERVICES + BNG", "#f59e0b"],
                    ["CENTRAL OFFICE", "#06b6d4"],
                    ["ACCESS LAYER (XGS-PON OLT)", "#0ea5e9"],
                    ["CUSTOMER PREMISES", "#6366f1"],
                  ].map(([label, color]) => (
                    <div key={label} style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 0.5 }}>
                      ↑ {label}
                    </div>
                  ))}
                </div>
              </Panel>
            </ReactFlow>

            {/* ── MiniMap toggle + legend ── */}
            <div style={{
              position: "absolute", bottom: 10, right: 10, zIndex: 10,
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
            }}>
              {/* Legend — shown when minimap is open */}
              {miniMapVisible && (
                <div style={{
                  background: "#070d1aee", border: "1px solid #1e293b", borderRadius: 8,
                  padding: "7px 10px", display: "flex", flexDirection: "column", gap: 4,
                  marginBottom: 160, /* sits above the minimap */
                  backdropFilter: "blur(4px)",
                }}>
                  <div style={{ fontSize: 8, color: "#475569", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
                    NODE COLOR KEY
                  </div>
                  {[
                    ["#22c55e", "Internet / IXP"],
                    ["#818cf8", "Core Backbone"],
                    ["#3b82f6", "Metro / Transport"],
                    ["#ef4444", "Security"],
                    ["#f59e0b", "IP Services / BNG"],
                    ["#06b6d4", "Central Office"],
                    ["#0ea5e9", "Access (XGS-PON)"],
                    ["#6366f1", "Customer Premises"],
                    ["#10b981", "OSS / BSS"],
                    ["#64748b", "Management"],
                  ].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 9, height: 9, borderRadius: 2, background: c, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>{l}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle button */}
              <button
                onClick={() => setMiniMapVisible(v => !v)}
                title={miniMapVisible ? "Hide topology overview" : "Show topology overview map"}
                style={{
                  background: miniMapVisible ? "#0d2040" : "#070d1a",
                  border: `1px solid ${miniMapVisible ? "#3b82f6" : "#1e293b"}`,
                  borderRadius: 7, padding: "5px 10px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                  fontSize: 10, color: miniMapVisible ? "#60a5fa" : "#475569",
                  fontWeight: miniMapVisible ? 700 : 400,
                  boxShadow: "0 2px 8px #00000060",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 12 }}>🗺️</span>
                {miniMapVisible ? "Hide Overview" : "Topology Overview"}
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
            {/* Right collapse toggle */}
            <button
              onClick={() => setRightCollapsed(c => !c)}
              style={{
                position: "absolute", left: -13, top: "50%", transform: "translateY(-50%)",
                zIndex: 10, background: "#0f172a", border: "1px solid #1e3a5f",
                borderRadius: "6px 0 0 6px", width: 13, height: 48, cursor: "pointer",
                color: "#60a5fa", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                padding: 0,
              }}
            >{rightCollapsed ? "◀" : "▶"}</button>

            <div style={{
              width: rightCollapsed ? 0 : 305,
              overflow: "hidden",
              transition: "width 0.25s ease",
              background: "#070d1a",
              borderLeft: rightCollapsed ? "none" : "1px solid #1e293b",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: rightCollapsed ? 0 : "8px",
              overflowY: rightCollapsed ? "hidden" : "auto",
            }}>
              <AIRunbook nodes={nodes} />

              {selectedNode && (
                <NodeDetailPanel
                  node={selectedNode}
                  onClose={() => { setSelectedNode(null); setDependencyNodeId(null); }}
                />
              )}

              {selectedNode && (
                <CollapsiblePanel title={`24H CAPACITY — ${selectedNode.data.label}`} icon="📈" defaultOpen={true}>
                  <div style={{ padding: '4px 8px 8px' }}>
                    <CapacityChart nodeData={selectedNode.data} height={140} />
                  </div>
                </CollapsiblePanel>
              )}

              <EventLog events={events} />

              <ConfigGenerator
                activeSimId={activeSimId}
                activeNodeId={
                  activeSimId && stepIndex >= 0
                    ? SIMULATION_FLOWS[activeSimId]?.steps[stepIndex]?.nodeId
                    : activeFaultId && stepIndex >= 0
                    ? FAULT_SCENARIOS[activeFaultId]?.steps[stepIndex]?.nodeId
                    : null
                }
                events={events}
              />

              {/* Health bars */}
              <CollapsiblePanel title="CRITICAL NODE HEALTH" icon="💓" defaultOpen={true}>
                <div style={{ padding: "8px 12px" }}>
                  {[
                    ["OLT-1 (Calix)", "olt_1"],
                    ["BNG (ASR 9000)", "bng"],
                    ["Agg Switch", "agg_switch"],
                    ["RADIUS", "radius"],
                    ["Metro Router", "metro_cisco"],
                    ["Core Router", "core_router_1"],
                    ["Border Router", "border_router"],
                    ["CGNAT", "cgnat"],
                  ].map(([label, nodeId]) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    const cap = node?.data?.capacity || 0;
                    const color = cap >= 80 ? "#ef4444" : cap >= 55 ? "#f59e0b" : "#22c55e";
                    return (
                      <div key={nodeId} style={{ marginBottom: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 9, color: "#94a3b8" }}>{label}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color }}>{cap.toFixed(1)}%</span>
                        </div>
                        <div style={{ background: "#1e293b", borderRadius: 3, height: 4 }}>
                          <div style={{ width: `${Math.min(cap, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsiblePanel>
            </div>
          </div>
        </div>
      )}

      {/* ── GEOGRAPHIC MAP TAB ── */}
      {activeTab === "geo" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <GeoMapTab nodes={nodes} />
        </div>
      )}

      {/* ── CUSTOMER DATABASE TAB ── */}
      {activeTab === "customers" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <CustomerTab
            customers={customers}
            setCustomers={setCustomers}
            onAddCustomer={(c) => {
              pushEvent(
                { action: `✅ Customer added: ${c.name}`, system: "Customer DB", detail: `Tier: ${c.tier} | Speed: ${c.speed} | City: ${c.city} | Rate: $${c.rate}/mo` },
                "#6366f1"
              );
            }}
          />
        </div>
      )}

      {/* ── REVENUE & ANALYTICS TAB ── */}
      {activeTab === "revenue" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <RevenueTab
            customers={customers}
            nodes={nodes}
            events={events}
            setNodes={setNodes}
          />
        </div>
      )}

      {/* ── SLA TRACKER TAB ── */}
      {activeTab === "sla" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <SLATab customers={customers} nodes={nodes} />
        </div>
      )}

      {/* ── BGP & SECURITY TAB ── */}
      {activeTab === "bgp" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <BGPSecurityTab faultActive={activeFaultId === 'bgp_drop'} />
        </div>
      )}

      {/* ── IPAM TAB ── */}
      {activeTab === "ipam" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <IPAMTab customers={customers} />
        </div>
      )}

      {/* ── AUDIT LOG TAB ── */}
      {activeTab === "audit" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <AuditTimelineTab events={events} />
        </div>
      )}

      {/* ── TRAFFIC ENGINEERING TAB ── */}
      {activeTab === "te" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <TrafficEngineeringTab nodes={nodes} />
        </div>
      )}

      {/* ── CIRCUIT PLANNER TAB ── */}
      {activeTab === "circuit" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <CircuitPlannerTab />
        </div>
      )}

      {/* ── NOC TICKER ── */}
      <NOCTicker nodes={nodes} />

      {/* ── NODE EXPAND MODAL ── */}
      {expandedNode && (
        <NodeExpandModal
          node={expandedNode}
          edges={edges}
          allNodes={nodes}
          onClose={() => setExpandedNode(null)}
        />
      )}
    </div>
  );
}
