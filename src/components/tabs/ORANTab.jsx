import { useState, useRef, useCallback } from "react";
import { CollapsiblePanel } from "../UIComponents";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { NTNOrbit3D } from "./Scenes3D";

// ─── Nivo dark theme ───────────────────────────────────────────────────────────
const NT = {
  background: "transparent",
  textColor: "#94a3b8",
  fontSize: 11,
  axis: {
    domain: { line: { stroke: "#1e3a5f", strokeWidth: 1 } },
    legend: { text: { fill: "#64748b", fontSize: 11 } },
    ticks: { line: { stroke: "#1e3a5f", strokeWidth: 1 }, text: { fill: "#64748b", fontSize: 10 } },
  },
  grid: { line: { stroke: "#0f2a4a", strokeWidth: 1 } },
  legends: { text: { fill: "#94a3b8", fontSize: 10 } },
  tooltip: { container: { background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 6, color: "#e2e8f0", fontSize: 11 } },
};

// ─── Pre-computed deterministic data ──────────────────────────────────────────
const TRAIN_LOSS = [2.71,2.49,2.30,2.13,1.98,1.84,1.71,1.60,1.49,1.39,1.30,1.22,1.14,1.07,1.00,0.94,0.88,0.83,0.78,0.73,0.69,0.65,0.61,0.58,0.55,0.52,0.49,0.47,0.45,0.43];
const TRAIN_ACC  = [61,64,67,70,72,74,76,77,79,80,81,82,83,85,86,87,87,88,89,90,90,91,91,92,92,93,93,93,94,94];
const POWER_RU_A = [435,435,432,430,425,410,390,365,340,320,305,295,290,287,285,285,285,285,285,285];
const POWER_RU_B = [412,411,408,405,400,385,368,345,322,302,288,278,272,270,268,268,268,268,268,268];
const POWER_RU_C = [428,426,424,422,417,402,384,360,336,316,303,295,291,291,290,290,290,290,290,290];
const POWER_RU_D = [401,400,397,394,389,374,358,336,316,296,285,281,280,280,280,280,280,280,280,280];
const POWER_T    = ["00:00","01:15","02:30","03:45","05:00","06:15","07:30","08:45","10:00","11:15","12:30","13:45","15:00","16:15","17:30","18:45","20:00","21:15","22:30","23:45"];
const ANOMALY_SINR    = [22,21,21,20,20,19,18,17,15,12,11,11,11,12,14,17,19,21,22,22,22,21,21,22];
const ANOMALY_HO_FAIL = [0.8,0.9,0.8,0.8,0.9,1.0,1.1,2.1,5.8,12.3,11.8,12.1,12.5,11.9,10.2,7.1,3.2,1.5,0.9,0.8,0.8,0.9,0.8,0.8];
const ANOMALY_PRB     = [42,43,43,42,41,43,45,52,68,78,80,81,79,77,72,65,56,48,43,41,41,42,43,42];
const ANOMALY_HOURS   = ["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];

// DSS spectrum grid: 8 subbands x 12 slots (values = PRB utilization %)
const DSS_SUBBANDS = ["700 MHz","850 MHz","1800 MHz","2100 MHz","2600 MHz","3500 MHz","3700 MHz","4700 MHz"];
const DSS_SLOTS    = ["S0","S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11"];
const DSS_BEFORE   = [[85,82,88,91,87,84,89,83,86,90,85,88],[78,81,76,79,82,80,77,83,79,76,80,78],[92,88,94,90,86,91,89,93,87,92,88,90],[60,58,62,55,59,63,57,61,56,60,58,62],[45,48,43,47,51,44,49,46,50,43,47,45],[30,33,28,32,36,29,34,31,35,28,32,30],[20,23,19,22,25,18,24,21,26,19,22,20],[15,17,14,16,18,13,17,15,19,14,16,15]];
const DSS_AFTER    = [[90,20,90,20,90,20,90,20,90,20,90,20],[20,85,20,85,20,85,20,85,20,85,20,85],[88,22,88,22,88,22,88,22,88,22,88,22],[22,82,22,82,22,82,22,82,22,82,22,82],[86,18,86,18,86,18,86,18,86,18,86,18],[18,80,18,80,18,80,18,80,18,80,18,80],[84,16,84,16,84,16,84,16,84,16,84,16],[16,78,16,78,16,78,16,78,16,78,16,78]];
// ─── 8 O-RAN Scenarios ────────────────────────────────────────────────────────
const ORAN_SCENARIOS = [
  {
    id: "sim01-ric",
    title: "RIC Traffic Steering",
    subtitle: "MLB xApp · A1/E2 Interface",
    icon: "🎯",
    color: "#3b82f6",
    difficulty: "Intermediate",
    specs: ["O-RAN WG2 A1-AP v3.0", "3GPP TS 38.401", "O-RAN WG3 E2SM-MLB"],
    description: "Near-RT RIC orchestrates an MLB xApp to redistribute traffic across 6 gNBs, reducing overloaded cells via A1 policy + E2 control loops.",
    chartType: "ric",
    whatif: [{ id: "threshold", label: "MLB Trigger Threshold %", min: 70, max: 95, default: 85 }],
    phases: ["DISCOVER", "ANALYZE", "OPTIMIZE", "DEPLOY", "VERIFY"],
    steps: [
      { phase: "DISCOVER", action: "E2 Agent subscribes: E2SM-MLB Service Model", system: "Near-RT RIC", detail: "Collecting CellID, PRB utilization, UE context per gNB via E2AP REPORT messages at 200ms interval. 6 cells reporting.", duration: 2500,
        cli: "e2_agent subscribe --sm E2SM-MLB --report-interval 200ms\n# RIC_IND: {cellId:CC01, prbUtil:91%, ueCount:47}\n# RIC_IND: {cellId:CC02, prbUtil:72%, ueCount:31}",
        causal: "CC01 PRB at 91% exceeds trigger threshold → MLB algorithm evaluates candidate cells CC03, CC05 as under-loaded" },
      { phase: "ANALYZE", action: "A1-P: Query MLB Policy Enforcement Status", system: "Non-RT RIC", detail: "xApp reads current A1 policy: max PRB threshold = 80%, rebalance trigger = 85%. 3 cells above threshold.", duration: 2000,
        cli: "a1_client get-policy --id MLB-POL-001\n# Status: ACTIVE | threshold: 80% | trigger: 85%\n# Violating: CC01(91%), CC02(72%), CC04(58%)",
        causal: "A1 policy confirms trigger. Overloaded cells: CC01 (91%), candidates: CC03 (45%), CC05 (38%)" },
      { phase: "OPTIMIZE", action: "MLB xApp: compute load-balance vector", system: "MLB xApp", detail: "Min-cost flow solver: CC01→CC03 (12 UEs), CC01→CC05 (8 UEs). Projected delta PRB CC01: -21%", duration: 3000,
        cli: "mlb_engine compute --source CC01 --candidates CC03,CC05\n# Solution: 12 UE→CC03 | 8 UE→CC05\n# Projected CC01 PRB: 70% | Cost: 0.43",
        causal: "20 UEs migrated from CC01 to CC03/CC05 via A3-event HO triggers — E2AP CONTROL to be issued" },
      { phase: "DEPLOY", action: "E2 Control: trigger A3-based HO for 20 UEs", system: "Near-RT RIC", detail: "E2AP CONTROL with E2SM-MLB RAN function parameters. gNBs execute A3 event HO. 20/20 successful.", duration: 3500,
        cli: "e2_control --gnb CC01 --sm E2SM-MLB --action HO\n  --ue-list [imsi-00123..imsi-00142]\n# E2AP: CONTROL-ACK | HO_Prep_Success: 20/20\n# HO_Exec_Time: avg 18ms",
        causal: "Handovers complete — CC01 PRB drops from 91%→70%. CC03/CC05 absorbing load gracefully." },
      { phase: "VERIFY", action: "KPI validation: PRB balance achieved", system: "PM Collector", detail: "All 6 cells PRB < 75%. Avg SINR: +2.3 dB. HO Success Rate: 99.2%. MLB policy marked SATISFIED.", duration: 2000,
        cli: "kpi_check --cells all --policy MLB-SLA-01\n# ✅ CC01:70% CC02:62% CC03:68% CC04:59% CC05:64% CC06:57%\n# HO_SR: 99.2% | Avg_SINR: 16.5dB ✅",
        causal: "All cells below threshold. Non-RT RIC logs A1 outcome. xApp enters monitoring state (next trigger in 300s)." },
    ],
    metrics: {
      before: [
        { label: "CC01 PRB Load", value: "91%", color: "#ef4444" },
        { label: "Avg Cell PRB", value: "78%", color: "#f59e0b" },
        { label: "Overloaded Cells", value: "3 / 6", color: "#ef4444" },
        { label: "HO Success Rate", value: "96.1%", color: "#f59e0b" },
        { label: "Avg SINR", value: "14.2 dB", color: "#f59e0b" },
      ],
      after: [
        { label: "CC01 PRB Load", value: "70% ↓", color: "#22c55e" },
        { label: "Avg Cell PRB", value: "63% ↓", color: "#22c55e" },
        { label: "Overloaded Cells", value: "0 / 6", color: "#22c55e" },
        { label: "HO Success Rate", value: "99.2% ↑", color: "#22c55e" },
        { label: "Avg SINR", value: "16.5 dB ↑", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const cells = [
        { cell: "CC01", before: 91, after: 70 },
        { cell: "CC02", before: 72, after: 62 },
        { cell: "CC03", before: 45, after: 68 },
        { cell: "CC04", before: 58, after: 59 },
        { cell: "CC05", before: 38, after: 64 },
        { cell: "CC06", before: 61, after: 57 },
      ];
      return cells.map((c) => ({
        cell: c.cell,
        "PRB %": Math.round(c.before + (c.after - c.before) * Math.min(progress * 1.4, 1)),
        "Target": 80,
      }));
    },
  },
  {
    id: "sim02-airm",
    title: "AI-Driven RRM Scheduler",
    subtitle: "DRL · PPO · PRB Allocation",
    icon: "🧠",
    color: "#8b5cf6",
    difficulty: "Advanced",
    specs: ["O-RAN WG2 A1-ML v2.0", "3GPP TR 38.843", "ITU-T FG-AI4N"],
    description: "Deep Reinforcement Learning agent trains on live RAN telemetry to optimise PRB scheduling, achieving 23% throughput uplift vs rule-based baseline.",
    chartType: "airrm",
    phases: ["COLLECT", "TRAIN", "BACKTEST", "DEPLOY", "VERIFY"],
    steps: [
      { phase: "COLLECT", action: "Telemetry collector: 10k UE sessions ingested", system: "Non-RT RIC", detail: "Ingesting: DL PRB per UE, CQI, RSRP, HARQ ACK/NACK, interference matrix 6×6. Window: 3600s.", duration: 2500,
        cli: "tel_collector ingest --stream e2-kpm --window 3600s\n# Records: 10,247 | Features: 18 | Split: 80/20\n# HARQ_NACK_avg: 8.4% — baseline interference detected",
        causal: "High HARQ NACK rate (8.4%) on PRB bands 25-30 indicates inter-cell interference → RRM suboptimal" },
      { phase: "TRAIN", action: "DRL agent: PPO policy gradient training (100 epochs)", system: "AI/ML Platform", detail: "PPO algorithm. Reward = Σ(UE_throughput) − λ·interference. Loss converging: 2.71 → 0.43", duration: 4000,
        cli: "train_agent --algo PPO --epochs 100 --reward throughput+qos\n# Ep 050: loss=1.07 val_acc=86% entropy=0.24\n# Ep 100: loss=0.43 val_acc=94% entropy=0.18",
        causal: "Agent learns PRB 25-30 interference nulling — reduces HARQ retransmissions, freeing 5 PRBs per TTI" },
      { phase: "BACKTEST", action: "Shadow mode validation: 48h traffic replay", system: "AI Validator", detail: "Replay 48h live traffic through PPO policy — zero service impact. Throughput +23.4%, NACK -63%.", duration: 2500,
        cli: "backtest --policy PPO-v7 --dataset 48h-live --compare baseline\n# DL_TPUT: +23.4% | Latency: -18% | HARQ_NACK: 8.4%→3.1%\n# ✅ Shadow mode PASSED",
        causal: "Interference nulling confirmed valid. Consistent across all 6 cells. Ready for A1-ML push." },
      { phase: "DEPLOY", action: "A1-ML: push ONNX model to Near-RT RIC xApp", system: "Non-RT RIC", detail: "Model containerised as xApp. A1-ML ENRICH_INFO with model endpoint. Activates every 20ms TTI.", duration: 2000,
        cli: "a1_ml push --model PPO-v7.onnx --target near-rt-ric-01\n# A1-ML: ENRICH_INFO accepted | xApp: ai-rrm-001\n# Policy activation: per-TTI (20ms)",
        causal: "AI xApp active — Near-RT RIC delegates PRB decisions to PPO policy. Fallback: NACK > 6% → revert" },
      { phase: "VERIFY", action: "Live KPIs: 23.4% throughput uplift confirmed", system: "PM Collector", detail: "5G NR KPIs post-deployment: DL 847 Mbps (was 686), HARQ NACK 3.1% (was 8.4%). PRB saved: 5/slot.", duration: 2000,
        cli: "kpi_live check --kpi DL_TPUT,HARQ_NACK,PRB_UTIL\n# DL_TPUT: 847 Mbps ✅ | HARQ_NACK: 3.1% ✅\n# PRB_UTIL: 68% (was 84%) ✅",
        causal: "AI scheduler confirmed live at scale. Rollback hook armed. Model retrain scheduled in 7 days." },
    ],
    metrics: {
      before: [
        { label: "DL Throughput", value: "686 Mbps", color: "#f59e0b" },
        { label: "HARQ NACK Rate", value: "8.4%", color: "#ef4444" },
        { label: "PRB Utilization", value: "84%", color: "#f59e0b" },
        { label: "Interference", value: "-85 dBm", color: "#f59e0b" },
        { label: "Scheduler", value: "Round Robin", color: "#64748b" },
      ],
      after: [
        { label: "DL Throughput", value: "847 Mbps ↑", color: "#22c55e" },
        { label: "HARQ NACK Rate", value: "3.1% ↓", color: "#22c55e" },
        { label: "PRB Utilization", value: "68% ↓", color: "#22c55e" },
        { label: "Interference", value: "-103 dBm ↓", color: "#22c55e" },
        { label: "Scheduler", value: "PPO AI v7", color: "#8b5cf6" },
      ],
    },
    getChartData: (progress) => {
      const n = Math.max(2, Math.floor(30 * Math.min(progress * 1.5, 1)));
      return [
        { id: "Loss ×10", color: "#ef4444", data: TRAIN_LOSS.slice(0, n).map((y, i) => ({ x: "E" + ((i + 1) * 3), y: +(y * 10).toFixed(1) })) },
        { id: "Val Accuracy %", color: "#22c55e", data: TRAIN_ACC.slice(0, n).map((y, i) => ({ x: "E" + ((i + 1) * 3), y })) },
      ];
    },
  },
  {
    id: "sim03-dss",
    title: "DSS + CBRS Spectrum Sharing",
    subtitle: "NR/LTE Coexistence · SAS Interface",
    icon: "📻",
    color: "#06b6d4",
    difficulty: "Intermediate",
    specs: ["3GPP TS 38.300 §5.2.1", "O-RAN WG8 CUS-plane v10", "FCC Part 96 CBRS"],
    description: "Dynamic Spectrum Sharing allows LTE and 5G NR to coexist on the same carrier using MBSFN subframes, while CBRS SAS manages GAA/PAL access tiers.",
    chartType: "dss",
    phases: ["SENSE", "CATALOG", "CONFIGURE", "ACTIVATE", "VALIDATE"],
    steps: [
      { phase: "SENSE", action: "Spectrum sensing: 8-band incumbent scan", system: "SAS Client", detail: "Scanning 700-4700 MHz for incumbent activity. Identifying LTE subframes, NR slots, CBRS incumbents.", duration: 2500,
        cli: "sas_client spectrum-scan --bands 700,850,1800,2100,2600,3500,3700,4700\n# LTE detected: 700,1800,2100 MHz | Incumbent: 3500 MHz (Naval)\n# CBRS GAA available: 3650-3700 MHz",
        causal: "3500 MHz shows incumbent (naval radar) → CBRS SAS will protect incumbent via EPA-tier enforcement" },
      { phase: "CATALOG", action: "SAS: register CBSDS and assign PAL/GAA tiers", system: "CBRS SAS", detail: "4 CBSDs registered. 2 PAL grants (fixed priority), 2 GAA grants (opportunistic). Incumbent protection zone set.", duration: 2000,
        cli: "sas_manager register-cbsd --count 4 --tier PAL,PAL,GAA,GAA\n# CBSD-01: PAL grant 3550-3570 MHz ✅\n# CBSD-03: GAA grant 3650-3670 MHz ✅",
        causal: "PAL CBSDs get priority spectrum. GAA CBSDs fill remaining capacity opportunistically." },
      { phase: "CONFIGURE", action: "DSS: configure MBSFN subframe pattern", system: "gNB RRC", detail: "NR MBSFN subframe pattern: SF1,SF2,SF3,SF6,SF7,SF8. CRS-IC enabled. NR muting aligned with LTE CRS.", duration: 3000,
        cli: "gnb_config set --feature dss --mbsfn-pattern SF1,SF2,SF3,SF6,SF7,SF8\n# CRS-IC: enabled | NR_muting: LTE_CRS_aligned\n# LTE-NR coexistence: ACTIVE",
        causal: "MBSFN pattern creates NR-friendly subframes. CRS interference reduced by 18 dB. LTE throughput maintained." },
      { phase: "ACTIVATE", action: "DSS + CBRS: joint activation across 8 bands", system: "RAN Controller", detail: "All 8 sub-bands activated with DSS/CBRS rules. Spectrum utilization improving. LTE/NR sharing confirmed.", duration: 3500,
        cli: "ran_ctrl activate-dss --bands all --sas-integration enabled\n# 8/8 bands ACTIVE | LTE users: served ✅\n# NR users: served ✅ | CBRS GAA: 2 grants active",
        causal: "Spectrum now cleanly partitioned: LTE in even slots, NR in odd slots per MBSFN pattern" },
      { phase: "VALIDATE", action: "Coexistence validation: LTE/NR KPIs confirmed", system: "PM Collector", detail: "LTE: PDCP tput maintained 94%. NR: 5G tput +41% from new bands. CBRS PAL grants: 0 violations.", duration: 2000,
        cli: "coex_validate --lte --nr --cbrs\n# LTE_PDCP: 94% (was 100%) — acceptable ✅\n# NR_TPUT: +41% from DSS bands ✅\n# CBRS_PAL violations: 0 ✅",
        causal: "DSS coexistence confirmed. LTE impact < 6%, NR gains 41%. CBRS SAS compliance verified." },
    ],
    metrics: {
      before: [
        { label: "LTE-only Bands", value: "3 / 8", color: "#f59e0b" },
        { label: "NR Available BW", value: "80 MHz", color: "#f59e0b" },
        { label: "Spectrum Efficiency", value: "4.1 b/s/Hz", color: "#f59e0b" },
        { label: "CBRS Status", value: "Unregistered", color: "#ef4444" },
        { label: "Incumbent Conflicts", value: "2 detected", color: "#ef4444" },
      ],
      after: [
        { label: "DSS Bands Active", value: "8 / 8", color: "#22c55e" },
        { label: "NR Available BW", value: "220 MHz ↑", color: "#22c55e" },
        { label: "Spectrum Efficiency", value: "6.8 b/s/Hz ↑", color: "#22c55e" },
        { label: "CBRS Status", value: "PAL + GAA ✓", color: "#22c55e" },
        { label: "Incumbent Conflicts", value: "0 ✅", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      return DSS_SUBBANDS.map((band, i) => ({
        id: band,
        data: DSS_SLOTS.map((slot, j) => {
          const before = DSS_BEFORE[i][j];
          const after  = DSS_AFTER[i][j];
          return { x: slot, value: Math.round(before + (after - before) * Math.min(progress * 1.3, 1)) };
        }),
      }));
    },
  },
  {
    id: "sim04-energy",
    title: "O-RU Energy Benchmarking",
    subtitle: "Sleep Mode · ETSI ES 203 228",
    icon: "⚡",
    color: "#22c55e",
    difficulty: "Beginner",
    specs: ["O-RAN WG4 O-RU Spec v9.0", "3GPP TS 28.315", "ETSI ES 203 228"],
    description: "Activates O-RU deep-sleep mode during low-traffic hours across 4 radio units, achieving 32% average power reduction without affecting SLA commitments.",
    chartType: "line",
    phases: ["BASELINE", "DETECT", "CONFIGURE", "ACTIVATE", "REPORT"],
    steps: [
      { phase: "BASELINE", action: "PM collector: 24h O-RU power baseline", system: "O-DU PM", detail: "Recording power for 4 O-RUs over 24h. Avg baseline: 420W/RU. Peak at 10:00 UTC (market hours).", duration: 2500,
        cli: "pm_collect --entity oru --kpis power_consumption,prb_util\n# RU-A: avg 435W | RU-B: avg 412W\n# RU-C: avg 428W | RU-D: avg 401W",
        causal: "PRB utilization drops below 15% between 00:00-06:00 UTC — eligible for sleep mode activation" },
      { phase: "DETECT", action: "Traffic pattern analysis: low-load windows", system: "Non-RT RIC rApp", detail: "ML classifier detects low-traffic windows: 00:00-06:00 UTC (PRB < 15%). 6hr/day sleep eligible.", duration: 2000,
        cli: "traffic_analyser detect-idle --threshold 15% --window 6h\n# Low-load window: 00:00-06:00 UTC\n# Eligible RUs: RU-A, RU-B, RU-C, RU-D (all 4)\n# Expected saving: 32%",
        causal: "6hr sleep window identified. No SLA breach risk at this traffic level per capacity model." },
      { phase: "CONFIGURE", action: "M-Plane: configure sleep mode parameters", system: "O-DU M-Plane", detail: "NETCONF edit-config: sleep-mode=deep, wake-latency=50ms, trigger=prb-threshold:10%. Applied to 4 O-RUs.", duration: 3000,
        cli: "netconf edit-config --target oru-all --file sleep-mode.xml\n# <sleep-mode>deep</sleep-mode>\n# <wake-latency>50ms</wake-latency>\n# <prb-trigger>10%</prb-trigger>",
        causal: "O-RU will enter deep-sleep when PRB < 10% for 30s. Wake-up triggered by scheduler within 50ms." },
      { phase: "ACTIVATE", action: "Sleep mode activated: RUs entering low-power state", system: "O-RU Firmware", detail: "All 4 O-RUs transitioned to deep-sleep. Power: 420W→285W avg. PA powered down, only beacon active.", duration: 3500,
        cli: "oru_ctrl sleep-enable --units RU-A,RU-B,RU-C,RU-D\n# RU-A: 435W→285W ✅ | RU-B: 412W→268W ✅\n# RU-C: 428W→290W ✅ | RU-D: 401W→280W ✅",
        causal: "Power amplifier off. Only pilot/SSB beacon active. Traffic arriving will trigger 50ms wake-up sequence." },
      { phase: "REPORT", action: "Energy efficiency report: 32% saving confirmed", system: "EMS/OSS", detail: "6hr sleep window: 133W/RU saved. Annualised: 1.16 MWh/RU. CO₂ reduction: 0.48 tonne/RU/year.", duration: 2000,
        cli: "energy_report --units all --period 24h\n# Avg saving: 32% | Total saved: 533W (4 RUs)\n# Annualised: 4.64 MWh | CO2: 1.93 tonne/year\n# ✅ SLA: 0 breaches during sleep window",
        causal: "Sleep mode confirmed compliant. SLA-zero breaches. OPEX saving reported to finance via OSS northbound API." },
    ],
    metrics: {
      before: [
        { label: "Avg Power / O-RU", value: "420 W", color: "#f59e0b" },
        { label: "Sleep Mode", value: "Disabled", color: "#ef4444" },
        { label: "Low-Load Hours", value: "6 hr/day", color: "#64748b" },
        { label: "Annual Energy", value: "14.7 MWh/RU", color: "#f59e0b" },
        { label: "CO₂ / RU / Year", value: "6.05 tonne", color: "#ef4444" },
      ],
      after: [
        { label: "Avg Power / O-RU", value: "285 W ↓", color: "#22c55e" },
        { label: "Sleep Mode", value: "Deep Sleep ✓", color: "#22c55e" },
        { label: "Energy Saved", value: "32% ↓", color: "#22c55e" },
        { label: "Annual Energy", value: "10.0 MWh/RU ↓", color: "#22c55e" },
        { label: "CO₂ / RU / Year", value: "4.12 tonne ↓", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const n = Math.max(2, Math.floor(20 * Math.min(progress * 1.4, 1)));
      return [
        { id: "O-RU A (W)", color: "#3b82f6", data: POWER_RU_A.slice(0, n).map((y, i) => ({ x: POWER_T[i], y })) },
        { id: "O-RU B (W)", color: "#8b5cf6", data: POWER_RU_B.slice(0, n).map((y, i) => ({ x: POWER_T[i], y })) },
        { id: "O-RU C (W)", color: "#06b6d4", data: POWER_RU_C.slice(0, n).map((y, i) => ({ x: POWER_T[i], y })) },
        { id: "O-RU D (W)", color: "#22c55e", data: POWER_RU_D.slice(0, n).map((y, i) => ({ x: POWER_T[i], y })) },
      ];
    },
  },  {
    id: "sim05-ntn",
    title: "NTN LEO Satellite Handover",
    subtitle: "Beam Tracking · Doppler · TS 38.821",
    icon: "🛰️",
    color: "#f59e0b",
    difficulty: "Advanced",
    specs: ["3GPP TS 38.821", "O-RAN WG1 NTN Study", "ETSI TR 103 611"],
    description: "Manages seamless handover between LEO satellite beams as the satellite traverses the coverage footprint, compensating for Doppler shift and propagation delay.",
    chartType: "ntn",
    phases: ["TRACK", "PREDICT", "PREPARE", "EXECUTE", "VERIFY"],
    steps: [
      { phase: "TRACK", action: "TLE propagator: LEO orbit tracking (550 km)", system: "NTN Controller", detail: "Starlink-equivalent LEO at 550km, 53° inclination. TLE propagated at 100ms. AoS: T-90s.", duration: 2500,
        cli: "tle_propagator track --sat SAT-002 --alt 550km\n# Az: 45.2° El: 32.8° Range: 687km\n# AoS: T-90s | LOS: T+420s",
        causal: "Satellite approaching serving beam boundary at 7.6 km/s → beam handover required in ~90s" },
      { phase: "PREDICT", action: "Beam footprint prediction: HO target identified", system: "NTN Controller", detail: "Predict handover to Beam-7 at T+85s. Doppler: +24.2 kHz (closing). Path loss: 168.4 dB. TA: 3.7ms.", duration: 2000,
        cli: "beam_predict --target Beam-7 --ho-time T+85s\n# Doppler: +24.2 kHz | PL: 168.4 dB\n# TA: 3.7ms | SNR margin: 8.2 dB",
        causal: "Beam-7 has 8.2 dB SNR margin — adequate for HO. TA pre-compensation computed for UE." },
      { phase: "PREPARE", action: "RRC: Reconfiguration with beam-7 parameters", system: "gNB-NTN", detail: "RRC Reconfiguration pushed to UEs in footprint. New TA, DL/UL frequency offset for Doppler pre-comp.", duration: 3000,
        cli: "rrc_reconfig --ue-group beam-boundary --beam Beam-7\n# TA_offset: 3.7ms | DL_freq_offset: -24.2kHz\n# UE_count: 142 | Prep_time: 58ms",
        causal: "UEs pre-configured for Beam-7. Doppler pre-compensation set. Random access preamble allocated." },
      { phase: "EXECUTE", action: "Beam handover: 142 UEs → Beam-7", system: "gNB-NTN", detail: "HO executed at T+85s. All 142 UEs transferred. Interruption time: 22ms avg. 0 call drops.", duration: 3500,
        cli: "beam_ho execute --from Beam-3 --to Beam-7 --ues 142\n# HO_Success: 142/142 ✅\n# Interruption: 22ms avg | Call_drops: 0\n# Doppler_comp: active",
        causal: "Seamless handover achieved. Doppler compensation active on Beam-7. Latency normalising." },
      { phase: "VERIFY", action: "KPI validation: seamless beam transition", system: "PM Collector", detail: "Post-HO latency: 38ms (was 42ms). SNR: 14.3 dB. 0 RLF events. Doppler residual < 100 Hz.", duration: 2000,
        cli: "kpi_ntn check --beam Beam-7 --post-ho\n# Latency: 38ms ✅ | SNR: 14.3dB ✅\n# RLF: 0 ✅ | Doppler_residual: 87Hz ✅",
        causal: "Beam-7 now serving 142 UEs. NTN controller schedules next predicted HO in 420s." },
    ],
    metrics: {
      before: [
        { label: "Orbit Altitude", value: "550 km LEO", color: "#94a3b8" },
        { label: "Doppler Shift", value: "+24.2 kHz", color: "#f59e0b" },
        { label: "Propagation Delay", value: "3.7 ms", color: "#f59e0b" },
        { label: "Beam 3 SNR", value: "11.2 dB ↓", color: "#ef4444" },
        { label: "HO Prediction", value: "T+85s", color: "#94a3b8" },
      ],
      after: [
        { label: "Active Beam", value: "Beam-7 ✓", color: "#22c55e" },
        { label: "HO Success", value: "142 / 142", color: "#22c55e" },
        { label: "Interruption", value: "22 ms avg", color: "#22c55e" },
        { label: "Beam-7 SNR", value: "14.3 dB ↑", color: "#22c55e" },
        { label: "Doppler Residual", value: "< 100 Hz ✅", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const latPoints = [42,43,44,48,52,58,62,55,46,40,38,38,38,38,38,38,38,38,38,38];
      const snrPoints = [11,11,10,9,8,7,8,10,12,13,14,14,14,14,14,14,14,14,14,14];
      const n = Math.max(2, Math.floor(20 * Math.min(progress * 1.4, 1)));
      return [
        { id: "E2E Latency (ms)", color: "#f59e0b", data: latPoints.slice(0, n).map((y, i) => ({ x: "T" + (i * 30 - 150) + "s", y })) },
        { id: "SNR (dB)", color: "#22c55e", data: snrPoints.slice(0, n).map((y, i) => ({ x: "T" + (i * 30 - 150) + "s", y })) },
      ];
    },
  },
  {
    id: "sim06-ztp",
    title: "Zero-Touch Provisioning",
    subtitle: "O-RAN WG6 · NETCONF · M-Plane",
    icon: "🤖",
    color: "#10b981",
    difficulty: "Intermediate",
    specs: ["O-RAN WG6 CADS v5.0", "RFC 6241 NETCONF", "3GPP TS 28.545"],
    description: "Automated day-0 provisioning of a new O-RU site from factory bootstrap through DHCP, NETCONF session, config push, and service activation — zero human touch.",
    chartType: "ztp",
    phases: ["BOOTSTRAP", "DHCP", "NETCONF", "CONFIG", "VERIFY"],
    steps: [
      { phase: "BOOTSTRAP", action: "O-RU: day-0 DHCP request with factory cert", system: "O-RU Firmware", detail: "O-RU powered at new site. Factory certificate presented. DHCP Option 43 returns M-Plane server address.", duration: 2500,
        cli: "# O-RU boot sequence:\nDHCP_DISCOVER src=MAC:00:11:22:33:44:55\n# DHCP_OFFER: IP 10.240.1.47 | Option43: mplane.northstar.net\n# TLS: factory cert validated ✅",
        causal: "Factory cert validated by PKI. O-RU receives M-Plane server address and ZTP trigger." },
      { phase: "DHCP", action: "DHCP ACK: IP assigned, M-Plane endpoint resolved", system: "DHCP Server", detail: "IP 10.240.1.47/24 assigned. M-Plane FQDN resolved: mplane.northstar.net → 203.0.113.10. NTP synced.", duration: 2000,
        cli: "dhcp_server ack --client MAC:00:11:22:33:44:55\n# Lease: 10.240.1.47 TTL:86400s\n# M-Plane: mplane.northstar.net=203.0.113.10\n# NTP: synced ✅",
        causal: "O-RU has IP and knows M-Plane server. Initiating TLS connection to M-Plane on port 830." },
      { phase: "NETCONF", action: "NETCONF session: hello exchange + capabilities", system: "M-Plane Server", detail: "TLS 1.3 session established. NETCONF hello exchanged. Capabilities: ietf-interfaces, o-ran-interfaces, o-ran-delay-management.", duration: 3000,
        cli: "netconf_connect --host 10.240.1.47 --port 830 --tls\n# TLS 1.3: ✅ CN=oru-site-07.northstar.net\n# NETCONF Hello: session-id=4721\n# Caps: o-ran-interfaces, ietf-interfaces, o-ran-delay-mgmt",
        causal: "NETCONF session active. M-Plane can now push full configuration via edit-config RPC." },
      { phase: "CONFIG", action: "edit-config: push carrier, delay, interface config", system: "M-Plane Server", detail: "Pushed: carrier-config (2100 MHz, 20 MHz BW), delay-management (T12: 260μs), interface (sync-plane).", duration: 3500,
        cli: "netconf edit-config --target running --config site-07-full.xml\n# carrier-config: 2100MHz 20MHz ✅\n# delay-management: T12=260us ✅\n# interface: sync-plane ETH1 ✅\n# get-config: validated ✅",
        causal: "All 3 config sections applied. O-RU validating against schema. Sync plane aligned to PRTC." },
      { phase: "VERIFY", action: "Service test: call setup + data plane verified", system: "NMS", detail: "E2E test call completed. O-RU transmitting on 2100 MHz. CPRI/eCPRI fronthaul verified. ZTP logged.", duration: 2000,
        cli: "service_test --oru 10.240.1.47 --type e2e-call\n# CPRI/eCPRI: ✅ | Fronthaul: ✅\n# RF on-air: 2100 MHz ✅ | Test call: PASS\n# ZTP audit: logged to OSS ✅",
        causal: "O-RU fully provisioned and in service. Total ZTP time: 14 minutes. Zero human intervention." },
    ],
    metrics: {
      before: [
        { label: "Provisioning Method", value: "Manual (CLI)", color: "#ef4444" },
        { label: "Time to Service", value: "4-8 hours", color: "#ef4444" },
        { label: "Human Touches", value: "6-12 steps", color: "#ef4444" },
        { label: "Config Errors", value: "~15% rate", color: "#f59e0b" },
        { label: "Audit Trail", value: "None", color: "#ef4444" },
      ],
      after: [
        { label: "Provisioning Method", value: "ZTP Automated", color: "#22c55e" },
        { label: "Time to Service", value: "14 minutes ↓", color: "#22c55e" },
        { label: "Human Touches", value: "0 ✅", color: "#22c55e" },
        { label: "Config Errors", value: "0 (validated)", color: "#22c55e" },
        { label: "Audit Trail", value: "Full OSS log ✓", color: "#22c55e" },
      ],
    },
    getChartData: () => [],
  },
  {
    id: "sim07-anomaly",
    title: "Anomaly Detection + RCA",
    subtitle: "Bayesian RCA · Non-RT RIC rApp",
    icon: "🔍",
    color: "#ef4444",
    difficulty: "Advanced",
    specs: ["O-RAN WG2 Non-RT RIC v3.0", "3GPP TS 28.552", "ITU-T Y.3172"],
    description: "ML-driven anomaly detection identifies KPI degradation in a 24h time series, runs Bayesian root-cause analysis, and triggers automated remediation.",
    chartType: "rca",
    whatif: [{ id: "sensitivity", label: "Anomaly Sensitivity (σ)", min: 1, max: 5, default: 3 }],
    phases: ["COLLECT", "DETECT", "CORRELATE", "RCA", "REMEDIATE", "VERIFY"],
    steps: [
      { phase: "COLLECT", action: "PM collector: 24h KPI ingestion (3 streams)", system: "Non-RT RIC", detail: "Ingesting: SINR (dB), HO Fail Rate (%), PRB Utilization (%) — 24 hourly samples per stream.", duration: 2000,
        cli: "pm_ingest --kpi SINR,HO_FAIL,PRB_UTIL --window 24h\n# Samples: 24 per KPI | Source: 6 cells\n# Anomaly window detected: 07:00-13:00 UTC",
        causal: "SINR drops from 20dB to 11dB at 07:00. HO Fail spikes from 0.9% to 12.3% simultaneously." },
      { phase: "DETECT", action: "Anomaly model: 3σ threshold breach at 07:00", system: "ML Inference", detail: "Isolation Forest + 3σ threshold. Anomaly score: 0.91 (threshold 0.75). Triggered 07:00-12:30.", duration: 2500,
        cli: "anomaly_detect --model isolation-forest --sigma 3\n# Anomaly_score: 0.91 > threshold 0.75\n# Window: 07:00-12:30 UTC | Severity: HIGH\n# Alert: sent to NOC",
        causal: "SINR degradation classified as anomalous. Co-located with HO failure spike → likely interference event." },
      { phase: "CORRELATE", action: "Cross-KPI correlation: SINR ↔ HO failure ↔ PRB", system: "RCA Engine", detail: "Pearson correlation: SINR vs HO_Fail: -0.92. PRB spike preceded SINR drop by 45min → root cause candidate.", duration: 2500,
        cli: "correlate --kpis SINR,HO_FAIL,PRB_UTIL --lag-max 120min\n# SINR↔HO_FAIL: r=-0.92 (strong)\n# PRB spike: T-45min before SINR drop\n# Root candidate: interference from CC-ADJ",
        causal: "PRB spike on adjacent cell CC-ADJ at 06:15 precedes SINR drop → strong indicator of inter-cell interference." },
      { phase: "RCA", action: "Bayesian network: adjacent cell interference confirmed", system: "Bayesian RCA", detail: "Bayesian network P(interference|SINR_drop, PRB_ADJ_spike) = 0.94. CC-ADJ reconfiguration recommended.", duration: 3000,
        cli: "bayesian_rca --model ran-interference --evidence SINR_drop,PRB_spike\n# P(interference): 0.94 | P(hardware): 0.04\n# Root cause: CC-ADJ excessive PRB load\n# Recommendation: tilt+3° CC-ADJ",
        causal: "94% probability: CC-ADJ running at 92% PRB caused DL interference on CC01 sector. Tilt correction will null." },
      { phase: "REMEDIATE", action: "A1-P: push tilt correction + MLB policy to CC-ADJ", system: "Non-RT RIC", detail: "Mechanical tilt +3° via EMF API. MLB threshold reduced to 75% on CC-ADJ. Interference expected to clear.", duration: 3000,
        cli: "a1_policy push --cell CC-ADJ --tilt +3deg --mlb-threshold 75%\n# Tilt adjusted: +3° ✅\n# MLB threshold: 75% (was 85%)\n# Waiting for KPI recovery...",
        causal: "Tilt change nulls interference lobe toward CC01. MLB at 75% prevents PRB overload recurrence." },
      { phase: "VERIFY", action: "KPI recovery: SINR +9 dB, HO Fail 0.8%", system: "PM Collector", detail: "Full KPI recovery by 13:00. SINR: 20 dB. HO Fail: 0.8%. PRB util: 45%. Anomaly window closed.", duration: 2000,
        cli: "kpi_verify --cells CC01,CC-ADJ --window 14:00-15:00\n# SINR: 20.1dB ✅ | HO_FAIL: 0.8% ✅\n# PRB_UTIL: 45% ✅ | Anomaly: CLOSED",
        causal: "KPIs fully recovered. RCA log archived. Incident closed. Watchdog armed for recurrence detection." },
    ],
    metrics: {
      before: [
        { label: "SINR (09:30)", value: "11.2 dB ↓", color: "#ef4444" },
        { label: "HO Fail Rate", value: "12.3% ↑", color: "#ef4444" },
        { label: "PRB Utilization", value: "81% (CC-ADJ)", color: "#ef4444" },
        { label: "Anomaly Score", value: "0.91 (HIGH)", color: "#ef4444" },
        { label: "Root Cause", value: "Unknown", color: "#64748b" },
      ],
      after: [
        { label: "SINR (14:00)", value: "20.1 dB ✅", color: "#22c55e" },
        { label: "HO Fail Rate", value: "0.8% ↓", color: "#22c55e" },
        { label: "PRB Utilization", value: "45% (CC-ADJ)", color: "#22c55e" },
        { label: "Root Cause", value: "Interference: CC-ADJ", color: "#22c55e" },
        { label: "Remediation", value: "Tilt +3° + MLB", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const n = Math.max(2, Math.floor(24 * Math.min(progress * 1.3, 1)));
      return [
        { id: "SINR (dB)", color: "#3b82f6", data: ANOMALY_SINR.slice(0, n).map((y, i) => ({ x: ANOMALY_HOURS[i] + "h", y })) },
        { id: "HO Fail %", color: "#ef4444", data: ANOMALY_HO_FAIL.slice(0, n).map((y, i) => ({ x: ANOMALY_HOURS[i] + "h", y })) },
        { id: "PRB Util %", color: "#f59e0b", data: ANOMALY_PRB.slice(0, n).map((y, i) => ({ x: ANOMALY_HOURS[i] + "h", y: y / 10 })) },
      ];
    },
  },
  {
    id: "sim08-twin",
    title: "Digital Twin RAN",
    subtitle: "Live vs Twin · What-If · TS 28.533",
    icon: "🪞",
    color: "#a78bfa",
    difficulty: "Advanced",
    specs: ["O-RAN WG1 OAD R003 §9.4", "3GPP TS 28.533", "ETSI GR ZSM 009"],
    description: "Digital twin mirrors live RAN state, then runs a what-if load injection scenario to predict performance degradation before it reaches production.",
    chartType: "digitaltwin",
    whatif: [{ id: "load", label: "Injected Load %", min: 20, max: 100, default: 60 }],
    phases: ["SYNC", "CALIBRATE", "WHAT_IF", "PREDICT", "DECIDE"],
    steps: [
      { phase: "SYNC", action: "Twin sync: ingesting live PM/CM from all 6 cells", system: "Digital Twin", detail: "Pulling live PM (1-min KPIs) + CM (config) from 6 gNBs into twin engine. State fidelity: 98.2%.", duration: 2500,
        cli: "twin_engine sync --source gNB-all --kpi PM,CM --interval 60s\n# Fidelity: 98.2% | Lag: 63s\n# Live state: CC01-CC06 synced ✅",
        causal: "Twin divergence from live < 2% — calibration baseline established for what-if injection." },
      { phase: "CALIBRATE", action: "Model calibration: propagation + scheduler validated", system: "Digital Twin", detail: "Path loss model: CI (3GPP) fitted to drive-test data. Scheduler model: RR. RMSE: 1.3 dB SINR.", duration: 2000,
        cli: "twin_calibrate --model propagation+scheduler\n# Path loss RMSE: 1.3 dB | Scheduler fidelity: 96%\n# Calibration: PASS ✅",
        causal: "Twin scheduler matches live scheduler with 96% fidelity — reliable enough for what-if predictions." },
      { phase: "WHAT_IF", action: "Injecting +60% load on CC01 (event simulation)", system: "Twin Scenario", detail: "Simulating a stadium event: 60% extra UEs on CC01 sector. Propagating impact through twin model.", duration: 3000,
        cli: "twin_whatif inject --cell CC01 --load +60% --event stadium\n# Twin CC01 PRB: 62%→99% (overload predicted)\n# Spillover to CC02,CC03: +18% each\n# User SINR degradation: -6 dB",
        causal: "CC01 PRB overload causes SINR degradation. Adjacent cells absorbing spillover — HO failure predicted at 8%." },
      { phase: "PREDICT", action: "Twin prediction: KPI trajectory 30 min ahead", system: "Digital Twin", detail: "30-min forecast: CC01 PRB: 99%→overflow at T+8min. HO Fail spikes to 8.2% at T+12min. SINR -6dB.", duration: 3000,
        cli: "twin_predict --horizon 30min --cells CC01,CC02,CC03\n# T+8min: CC01 PRB overflow predicted\n# T+12min: HO_FAIL: 8.2% predicted\n# Recommended: pre-activate MLB at T+5min",
        causal: "Pre-emptive MLB activation at T+5min will keep CC01 PRB < 85% during event. Validates stadium policy." },
      { phase: "DECIDE", action: "Decision: pre-activate MLB policy before event", system: "Non-RT RIC", detail: "Twin recommendation accepted. MLB policy pre-configured. A1 policy pushed to near-RT RIC. Event ready.", duration: 2000,
        cli: "a1_policy push --policy stadium-MLB --trigger T+5min\n# MLB pre-configured: CC01 threshold 75%\n# A1-P: ACCEPTED | Activation: T+5min\n# ✅ Twin prediction: SLA protected",
        causal: "Pre-emptive action prevents degradation. Digital twin proved value — NOC averted customer impact." },
    ],
    metrics: {
      before: [
        { label: "Twin Fidelity", value: "98.2%", color: "#22c55e" },
        { label: "CC01 PRB (live)", value: "62%", color: "#22c55e" },
        { label: "What-If Load", value: "+60% injected", color: "#f59e0b" },
        { label: "Predicted Peak PRB", value: "99% (T+8min)", color: "#ef4444" },
        { label: "Predicted HO Fail", value: "8.2% (T+12min)", color: "#ef4444" },
      ],
      after: [
        { label: "MLB Pre-activated", value: "T+5min ✅", color: "#22c55e" },
        { label: "CC01 PRB (guarded)", value: "< 80%", color: "#22c55e" },
        { label: "HO Fail (guarded)", value: "< 1.5%", color: "#22c55e" },
        { label: "Customer Impact", value: "0 — averted", color: "#22c55e" },
        { label: "Twin Value", value: "Proven ✅", color: "#a78bfa" },
      ],
    },
    getChartData: (progress) => {
      const kpis = ["Throughput", "SINR", "HO-SR", "PRB Util", "Latency"];
      const live   = [847, 16, 99, 62, 12];
      const twin   = [841, 15, 99, 63, 12];
      const whatif = [421, 10, 92, 99, 28];
      return kpis.map((kpi, i) => ({
        kpi,
        "Live":  live[i],
        "Twin":  twin[i],
        "What-If": Math.round(twin[i] + (whatif[i] - twin[i]) * Math.min(progress * 2, 1)),
      }));
    },
  },
  // ── SIM-09 ──────────────────────────────────────────────────────────────────
  {
    id: "sim09-isac",
    title: "ISAC Sensing + Object Tracking",
    subtitle: "Range-Doppler · 5G NR Radar · 3GPP TR 22.837",
    icon: "📡",
    color: "#f97316",
    difficulty: "Advanced",
    specs: ["3GPP TR 22.837 ISAC", "3GPP TS 38.211 §7.4", "O-RAN WG1 ISAC Study"],
    description: "Integrated Sensing and Communication (ISAC) repurposes 5G NR OFDM waveforms as radar, generating a range-Doppler map to detect and track 3 objects (pedestrian, cyclist, vehicle).",
    chartType: "isac",
    phases: ["CONFIGURE", "EMIT", "PROCESS", "DETECT", "TRACK"],
    steps: [
      { phase: "CONFIGURE", action: "gNB ISAC: allocate sensing PRBs + configure waveform", system: "gNB-ISAC", detail: "Allocating 50 PRBs for sensing (20 MHz), 74 PRBs for comms. OFDM waveform: SCS 30 kHz. Range res: 7.5m, Vel res: 0.31 m/s.", duration: 2200,
        cli: "isac_config set --prb-sensing 50 --prb-comms 74 --scs 30kHz\n# Range_res: 7.5m | Vel_res: 0.31m/s\n# Max_range: 200m | Max_vel: 120km/h",
        causal: "50 PRBs reserved for radar function. SCS 30kHz gives 7.5m range resolution — adequate for automotive tracking." },
      { phase: "EMIT", action: "Tx: OFDM radar pulse emission on sensing PRBs", system: "O-RU", detail: "Sensing waveform emitted. EIRP: 33 dBm. Pulse duration: 1ms (1 slot). PRF: 1000 Hz. Range window: 0-200m.", duration: 2500,
        cli: "oru_tx sensing --prb 0..49 --eirp 33dBm --prf 1000Hz\n# TX: ACTIVE | EIRP: 33dBm\n# PRF: 1kHz | Range_win: 0-200m",
        causal: "Radar pulse illuminates coverage zone. SNR sufficient for detection at 150m for 0dBsm targets (vehicles)." },
      { phase: "PROCESS", action: "2D-FFT: range-Doppler processing on Rx echo", system: "ISAC Processor", detail: "Range FFT (N=512) + Doppler FFT (M=64). CFAR threshold: 15 dB above noise floor. 3 detections above threshold.", duration: 3000,
        cli: "isac_process 2dfft --range-fft 512 --doppler-fft 64\n# Noise_floor: -110 dBm | CFAR: +15dB\n# Detections: 3 above threshold",
        causal: "Three peaks emerge above CFAR threshold: [20m,0 m/s], [50m,33 km/h], [80m,100 km/h]" },
      { phase: "DETECT", action: "Peak extraction: 3 objects classified", system: "ISAC Classifier", detail: "Pedestrian: 20m, 0 km/h, -72 dBm. Cyclist: 50m, 33 km/h, -65 dBm. Vehicle: 80m, 100 km/h, -58 dBm.", duration: 2500,
        cli: "isac_classify --model radar-cnn-v3\n# OBJ-1: type=pedestrian r=20m v=0km/h snr=38dB\n# OBJ-2: type=cyclist r=50m v=33km/h snr=45dB\n# OBJ-3: type=vehicle r=80m v=100km/h snr=52dB",
        causal: "3 objects classified with high confidence. Kalman tracker initialised. Comms beam steered away from sensing zone." },
      { phase: "TRACK", action: "Kalman tracker: object trajectory maintained", system: "ISAC Tracker", detail: "Kalman filter tracking all 3 objects. Update rate: 10 Hz. Position accuracy: ±1.2m. Trajectory reported to V2X stack.", duration: 2500,
        cli: "isac_track kalman --update-rate 10Hz\n# OBJ-1: TRACKED pos=(20,0) vel=(0) ±1.1m\n# OBJ-2: TRACKED pos=(52,8) vel=(33) ±1.3m\n# OBJ-3: TRACKED pos=(83,42) vel=(100) ±1.4m\n# V2X: broadcast ✅",
        causal: "All 3 tracks stable. V2X stack broadcasting object positions. Sensing overhead: 40% PRBs — comms throughput impact: -8%." },
    ],
    metrics: {
      before: [
        { label: "Sensing Function", value: "None (comms-only)", color: "#ef4444" },
        { label: "PRB Sensing", value: "0 / 124", color: "#ef4444" },
        { label: "Objects Detected", value: "0", color: "#ef4444" },
        { label: "V2X Awareness", value: "None", color: "#ef4444" },
        { label: "Comms PRB Util", value: "100%", color: "#f59e0b" },
      ],
      after: [
        { label: "Sensing Function", value: "ISAC Active ✅", color: "#22c55e" },
        { label: "PRB Sensing", value: "50 / 124 (40%)", color: "#f97316" },
        { label: "Objects Detected", value: "3 tracked", color: "#22c55e" },
        { label: "V2X Awareness", value: "Live broadcast ✅", color: "#22c55e" },
        { label: "Comms Throughput", value: "-8% (acceptable)", color: "#f59e0b" },
      ],
    },
    getChartData: (progress) => makeISACGrid(progress),
  },
  // ── SIM-10 ──────────────────────────────────────────────────────────────────
  {
    id: "sim10-capex",
    title: "CAPEX / ROI Site Planner",
    subtitle: "NPV · IRR · Payback · Site Selection",
    icon: "💰",
    color: "#eab308",
    difficulty: "Intermediate",
    specs: ["O-RAN WG1 OAD R003 §9.2", "ITU-T G.7711", "3GPP TS 28.541 NRM"],
    description: "Multi-criteria site selection engine evaluates 5 candidate sites using NPV, IRR, and payback period, recommending the optimal build based on financial and coverage KPIs.",
    chartType: "capex",
    whatif: [{ id: "discount", label: "Discount Rate (WACC %)", min: 5, max: 20, default: 10 }],
    phases: ["SURVEY", "MODEL", "RANK", "SELECT", "COMMIT"],
    steps: [
      { phase: "SURVEY", action: "GIS survey: 5 candidate sites profiled", system: "GIS Platform", detail: "Pulling site data: population coverage, existing fibre proximity, zoning, power, civil cost estimates.", duration: 2200,
        cli: "gis_survey pull --candidates 5 --metrics pop,fibre,zoning,power\n# Site-A: urban 42k pop | Site-B: suburban 18k\n# Site-C: rural 4k | Site-D: highway 9k | Site-E: industrial 31k",
        causal: "Site-A (urban) has highest population density and existing fibre — lowest civil cost, fastest revenue ramp." },
      { phase: "MODEL", action: "Financial model: NPV/IRR for 5-year horizon", system: "ROI Engine", detail: "NPV @ 10% WACC. ARPU: $65/sub/mo. Churn: 1.8%/mo. Capex includes tower, civils, radios, backhaul.", duration: 3000,
        cli: "roi_model compute --sites all --wacc 10% --horizon 5yr --arpu 65\n# Site-A: NPV=$2.4M IRR=28% PBK=3.6yr ✅\n# Site-C: NPV=$0.9M IRR=14% PBK=7.1yr ⚠️",
        causal: "Site-A dominates on all three financial metrics. Site-C rural has longest payback — viable only with USF support." },
      { phase: "RANK", action: "Multi-criteria ranking: A>E>B>D>C", system: "Decision Engine", detail: "Weighted score: NPV (40%) + IRR (30%) + Coverage (20%) + Strategic (10%). Site-A wins: score 91/100.", duration: 2500,
        cli: "rank_sites --weights NPV:0.4,IRR:0.3,COV:0.2,STRAT:0.1\n# Site-A: 91/100 ✅ WINNER\n# Site-E: 84/100 | Site-B: 72/100\n# Site-D: 64/100 | Site-C: 48/100",
        causal: "Site-A recommended. Site-E as backup (industrial — anchor tenant mitigates IRR risk). Site-C deferred." },
      { phase: "SELECT", action: "Board recommendation: Site-A approved", system: "CFO System", detail: "Site-A package: $1.8M CAPEX, 42k pop coverage, NPV $2.4M, IRR 28%, payback 3.6 years. Approved.", duration: 2000,
        cli: "capex_approve --site Site-A --budget 1.8M --authority BOARD\n# Approval: GRANTED ✅\n# PO raised: PO-2024-0441\n# Construction: Q2 2024",
        causal: "Site-A CAPEX locked. Construction begins Q2. Revenue target: $180k/mo by Y2. NPV realisation: Y4." },
      { phase: "COMMIT", action: "OSS: site record created, buildout scheduled", system: "NetCracker OSS", detail: "Site-A committed in OSS. Resource reservations made. Permit applications filed. Roll-out plan: 90 days.", duration: 2000,
        cli: "oss_site create --id SITE-A-2024 --status APPROVED\n# Permits: filed | Power: ordered | Tower: contracted\n# Go-live target: 90 days ✅",
        causal: "Site enters build queue. Milestone tracker armed. NOC alerted for commissioning hand-over in 90 days." },
    ],
    metrics: {
      before: [
        { label: "Sites Evaluated", value: "5 candidates", color: "#94a3b8" },
        { label: "Decision Basis", value: "Gut feel / coverage", color: "#ef4444" },
        { label: "Best NPV", value: "Unknown", color: "#ef4444" },
        { label: "Payback", value: "Unknown", color: "#ef4444" },
        { label: "IRR", value: "Unknown", color: "#ef4444" },
      ],
      after: [
        { label: "Winner", value: "Site-A (Urban)", color: "#22c55e" },
        { label: "NPV (5yr)", value: "$2.4M ✅", color: "#22c55e" },
        { label: "IRR", value: "28% (> WACC 10%)", color: "#22c55e" },
        { label: "Payback", value: "3.6 years", color: "#22c55e" },
        { label: "CAPEX", value: "$1.8M committed", color: "#eab308" },
      ],
    },
    getChartData: (progress) => {
      const p = Math.min(progress * 1.4, 1);
      return CAPEX_SITES.map((site, i) => ({
        site,
        "NPV ($M)": +(CAPEX_NPV[i] * p).toFixed(2),
        "IRR (%)":  Math.round(CAPEX_IRR[i] * p),
        "Build ($M)": -(CAPEX_BUILD[i]),
      }));
    },
  },
  // ── SIM-11 ──────────────────────────────────────────────────────────────────
  {
    id: "sim11-urllc",
    title: "IIoT / URLLC Reliability Planner",
    subtitle: "P99.999 Latency · 5G NR URLLC · TS 22.104",
    icon: "🏭",
    color: "#ec4899",
    difficulty: "Advanced",
    specs: ["3GPP TS 22.104 URLLC", "3GPP TS 38.824", "O-RAN WG1 IIoT Study"],
    description: "Plans 5G NR URLLC deployment for a factory floor — validating that P99.999 packet reliability and <1ms user-plane latency SLA can be met under industrial interference conditions.",
    chartType: "urllc",
    phases: ["PROFILE", "DESIGN", "SIMULATE", "VALIDATE", "CERTIFY"],
    steps: [
      { phase: "PROFILE", action: "IIoT traffic profile: 120 sensors, 500B packets, 10ms cycle", system: "IIoT Controller", detail: "120 IIoT sensors. Packet size: 500B. Cycle: 10ms (100 pps). Required reliability: 99.999% at <1ms latency.", duration: 2200,
        cli: "iiot_profile load --sensors 120 --pkt 500B --cycle 10ms\n# Reliability target: 99.999% | Latency: <1ms\n# Traffic: 120 × 100pps × 500B = 60 Mbps",
        causal: "60 Mbps IIoT load identified. URLLC SLA: P99.999 reliability at 1ms — requires NR URLLC mode (mini-slot, HARQ)." },
      { phase: "DESIGN", action: "NR URLLC config: mini-slot, Grant-Free, HARQ-IR", system: "RAN Planner", detail: "Mini-slot scheduling (2 symbols). Grant-free UL: K=4 repetitions. HARQ incremental redundancy. SCS 60 kHz.", duration: 3000,
        cli: "urllc_config set --mini-slot 2sym --grant-free K=4 --harq IR\n# SCS: 60kHz (0.25ms slot) | PDCP_DUP: enabled\n# Redundancy: K=4 | HARQ: IR-Chase",
        causal: "Mini-slot reduces scheduling delay to 0.5ms. K=4 grant-free repetitions push reliability to P99.99+." },
      { phase: "SIMULATE", action: "Monte Carlo: 10M packet simulation run", system: "Simulator", detail: "10M packets simulated under industrial interference (2.4GHz, 5GHz WiFi). P99.999 lat: 0.87ms achieved.", duration: 3500,
        cli: "simulate --packets 10M --interference wifi_2.4,wifi_5\n# P50: 0.21ms | P99: 0.61ms | P99.9: 0.74ms\n# P99.99: 0.81ms | P99.999: 0.87ms ✅\n# Reliability: 99.9993%",
        causal: "HARQ-IR + K=4 grant-free achieves 99.9993% reliability at 0.87ms — both SLA targets met." },
      { phase: "VALIDATE", action: "Live pilot: 12 sensors, 30-min conformance test", system: "Conformance Tester", detail: "30-min live pilot: 12 sensors, 3.6M packets. P99.999 lat: 0.89ms. Reliability: 99.9991%. SLA met.", duration: 3000,
        cli: "conformance_test --sensors 12 --duration 30min\n# Packets: 3,600,000 | Lost: 3 (0.000083%)\n# P99.999: 0.89ms ✅ | SLA: PASS",
        causal: "Live pilot confirms simulation results. 3 lost packets (storm event) — within SLA budget. Full roll-out approved." },
      { phase: "CERTIFY", action: "IEC 62443 certification: URLLC SLA documented", system: "Certification Body", detail: "IEC 62443 OT security + URLLC performance certificate issued. 120 sensors approved for production.", duration: 2000,
        cli: "certify_urllc --standard IEC62443 --sla P99.999-1ms\n# Certificate: URLLC-CERT-2024-0087\n# Validity: 2 years | Scope: 120 sensors\n# Status: ISSUED ✅",
        causal: "Factory floor URLLC network certified for IIoT production use. SLA monitoring armed (alert if P99.999 > 0.95ms)." },
    ],
    metrics: {
      before: [
        { label: "Technology", value: "WiFi 5GHz", color: "#ef4444" },
        { label: "P99.999 Latency", value: ">8ms (WiFi)", color: "#ef4444" },
        { label: "Reliability", value: "99.5% (WiFi)", color: "#ef4444" },
        { label: "Interference", value: "High (2.4/5 GHz)", color: "#ef4444" },
        { label: "Certification", value: "None", color: "#ef4444" },
      ],
      after: [
        { label: "Technology", value: "5G NR URLLC", color: "#22c55e" },
        { label: "P99.999 Latency", value: "0.87ms ✅", color: "#22c55e" },
        { label: "Reliability", value: "99.9993% ✅", color: "#22c55e" },
        { label: "Interference", value: "HARQ-IR mitigated", color: "#22c55e" },
        { label: "Certification", value: "IEC 62443 ✅", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const p = Math.min(progress * 1.5, 1);
      return [
        {
          id: "WiFi 5GHz (baseline)",
          color: "#ef4444",
          data: URLLC_LAT.map((x, i) => ({ x: x + "µs", y: URLLC_QPSK[i] })),
        },
        {
          id: "5G NR URLLC",
          color: "#22c55e",
          data: URLLC_LAT.map((x, i) => ({ x: x + "µs", y: +(URLLC_NR[i] * p + URLLC_QPSK[i] * (1 - p)).toFixed(4) })),
        },
      ];
    },
  },
  // ── SIM-12 ──────────────────────────────────────────────────────────────────
  {
    id: "sim12-mw",
    title: "Microwave Backhaul — Fade + ACM",
    subtitle: "Fade Margin · ACM Fallback · ITU-R P.530",
    icon: "🌦️",
    color: "#64748b",
    difficulty: "Intermediate",
    specs: ["ITU-R P.530-18 Propagation", "ETSI EN 302 217-2", "3GPP TS 28.310 TNLM"],
    description: "Simulates a 23 GHz microwave backhaul link during a rain fade event — demonstrating Adaptive Coding & Modulation (ACM) graceful degradation from 256QAM to QPSK and recovery.",
    chartType: "microwave",
    phases: ["BASELINE", "FADE_IN", "ACM_DOWN", "HOLD", "RECOVERY"],
    steps: [
      { phase: "BASELINE", action: "Link baseline: 256QAM, -42 dBm RSSL, 1 Gbps", system: "Microwave NMS", detail: "23 GHz link: 25 km hop. Distance: 25km. Rx level: -42 dBm. Fade margin: 38 dB. Modulation: 256QAM-2048.", duration: 2000,
        cli: "mw_nms show link MW-001\n# Freq: 23 GHz | Hop: 25km\n# RSSL: -42 dBm | FadeMargin: 38 dB\n# Mod: 256QAM | Tput: 1 Gbps",
        causal: "RSSL well above -65 dBm 256QAM threshold. Link capacity: 1 Gbps. All backhaul traffic protected." },
      { phase: "FADE_IN", action: "Rain fade event: RSSL dropping -42→-84 dBm", system: "Microwave Radio", detail: "Convective rainfall detected upstream. RSSL dropping at 4 dB/min. Rain rate: 42 mm/hr (ITU-R P.837 Zone K).", duration: 3000,
        cli: "mw_pm watch --kpi rssl --interval 10s\n# RSSL: -42 → -50 → -62 → -72 → -84 dBm\n# Rain_rate: 42mm/hr | Attenuation: 42dB\n# Alert: FADE EVENT",
        causal: "Rain attenuation at 23 GHz: 8 dB/km at 42 mm/hr → 42 dB over 25 km. RSSL approaching fade margin limit." },
      { phase: "ACM_DOWN", action: "ACM: 256QAM → 64QAM → QPSK (graceful degradation)", system: "ACM Controller", detail: "ACM triggers at -65 dBm: 256QAM→64QAM (667 Mbps). At -75 dBm: 64QAM→QPSK (250 Mbps). Service maintained.", duration: 3500,
        cli: "acm_log show recent\n# T+00: 256QAM @-42dBm: 1000Mbps\n# T+04: 64QAM @-67dBm:  667Mbps ⬇️\n# T+08: QPSK @-78dBm:   250Mbps ⬇️\n# Core: shedding lower-priority traffic",
        causal: "ACM holds link alive at reduced capacity. Priority: VoIP+signalling protected. Best-effort traffic queued." },
      { phase: "HOLD", action: "QPSK hold: 8-minute deep fade, 250 Mbps sustained", system: "Microwave Radio", detail: "QPSK sustained for 8 minutes. Backhaul maintains 250 Mbps for critical services. RSSL nadir: -84 dBm.", duration: 3000,
        cli: "mw_pm kpi --period 8min\n# RSSL: -80 to -84 dBm (nadir)\n# Tput: 250 Mbps QPSK sustained\n# Packet_loss: 0 (priority queuing)\n# MTTR_fade: 8 min",
        causal: "Deep fade held for 8 min. Zero packet loss on priority traffic. Non-critical traffic throttled 75%." },
      { phase: "RECOVERY", action: "ACM recovery: QPSK → 64QAM → 256QAM as rain clears", system: "ACM Controller", detail: "RSSL recovering: -84→-65→-42 dBm. ACM restores 256QAM. Full 1 Gbps restored. Fade outage: 0 mins (graceful).", duration: 2500,
        cli: "acm_log show recovery\n# T+08: RSSL -75: QPSK→64QAM 667Mbps ⬆️\n# T+12: RSSL -58: 64QAM→256QAM 1000Mbps ⬆️\n# Traffic: fully restored ✅\n# SLA_breach: 0",
        causal: "Full capacity restored. ACM fade event: 12 min total, zero SLA breach. Backhaul resilience demonstrated." },
    ],
    metrics: {
      before: [
        { label: "RSSL Baseline", value: "-42 dBm", color: "#22c55e" },
        { label: "Modulation", value: "256QAM", color: "#22c55e" },
        { label: "Throughput", value: "1 Gbps", color: "#22c55e" },
        { label: "Fade Margin", value: "38 dB", color: "#22c55e" },
        { label: "Rain Rate", value: "0 mm/hr", color: "#22c55e" },
      ],
      after: [
        { label: "Fade Depth", value: "42 dB (42 mm/hr)", color: "#ef4444" },
        { label: "RSSL Nadir", value: "-84 dBm (QPSK)", color: "#f59e0b" },
        { label: "Min Throughput", value: "250 Mbps (QPSK)", color: "#f59e0b" },
        { label: "SLA Breach", value: "0 ✅ (ACM saved)", color: "#22c55e" },
        { label: "Recovery", value: "256QAM restored ✅", color: "#22c55e" },
      ],
    },
    getChartData: (progress) => {
      const n = Math.max(2, Math.floor(48 * Math.min(progress * 1.4, 1)));
      return [
        {
          id: "RSSL (dBm)",
          color: "#60a5fa",
          data: MW_RSSL.slice(0, n).map((y, i) => ({ x: MW_TIME[i] || String(i), y })),
        },
      ];
    },
  },
];
// ─── SIM-09 through SIM-12 pre-computed data ──────────────────────────────────
// ISAC: range-Doppler heatmap — values represent normalized power 0-100 (mapped from -120 to -50 dBm)
// getISACPow(dBm) => 0-100 scale: (dBm + 120) / 70 * 100
const ISAC_RANGES = ["10m","20m","30m","40m","50m","60m","70m","80m","90m","100m","120m","150m"];
const ISAC_VELS   = ["-60","-48","-36","-24","-12","0","12","24","36","48","60","72","84","96","108","120"];
// ISAC Range-Doppler heatmap
// Value scale: 0-100 mapped linearly to colour scheme
// Noise floor: 35-52 (dark red on inferno = clearly "background clutter")
// Target peaks: 75-95 (bright orange-yellow on inferno = "detection")
function makeISACGrid(progress) {
  const p = Math.min(progress * 1.6, 1);
  const grid = [];
  // [rangeIdx, velIdx, peakPwr, spreadR, spreadV]
  // ISAC_VELS index: 0="-60"…5="0"…8="36"…11="72"…14="108"
  const TARGETS = [
    [2,  5,  92, 1.6, 2.2],  // Pedestrian: 20m, 0 km/h
    [5,  8,  80, 1.3, 2.6],  // Cyclist:    50m, 36 km/h
    [8, 12,  68, 1.1, 2.0],  // Vehicle:    80m, 84 km/h
  ];
  for (let ri = 0; ri < ISAC_RANGES.length; ri++) {
    const row = { id: ISAC_RANGES[ri], data: [] };
    for (let vi = 0; vi < ISAC_VELS.length; vi++) {
      // Deterministic speckle: prime hash for texture, no Math.random
      const speckle = ((ri * 7 + vi * 11 + (ri * vi) % 5) % 16);
      // Noise floor 35-51 — visible as dark red on inferno
      let pwr = 35 + speckle;
      // Gaussian blob for each target
      TARGETS.forEach(([tr, tv, peak, sr, sv]) => {
        const dr = (ri - tr) / sr;
        const dv = (vi - tv) / sv;
        const gauss = Math.exp(-(dr * dr + dv * dv));
        const contrib = Math.round(peak * gauss * p);
        if (contrib > pwr) pwr = contrib;
      });
      row.data.push({ x: ISAC_VELS[vi], value: Math.min(pwr, 100) });
    }
    grid.push(row);
  }
  return grid;
}
// CAPEX: 5 candidate sites
const CAPEX_SITES     = ["Site-A (Urban)","Site-B (Suburban)","Site-C (Rural)","Site-D (Highway)","Site-E (Industrial)"];
const CAPEX_NPV       = [2.4,1.8,0.9,1.4,2.1];
const CAPEX_IRR       = [28,22,14,19,26];
const CAPEX_PAYBACK   = [3.6,4.4,7.1,5.2,3.9];
const CAPEX_BUILD     = [1.8,1.4,0.8,1.1,1.6];
const CAPEX_CF_YEARS  = ["Y0","Y1","Y2","Y3","Y4","Y5"];
const CAPEX_CF_VALS   = [-1800,-200,380,720,940,1100];
// URLLC: latency CDF
const URLLC_LAT  = ["100","200","300","400","500","600","700","800","900","1000"];
const URLLC_QPSK = [20,42,61,76,86,92,96,98,99.1,99.5];
const URLLC_NR   = [55,82,93,97,99.0,99.6,99.90,99.97,99.995,99.999];
// Microwave: RSSL timeline (48 samples, 0-47 = 0h-4h)
const MW_TIME  = Array.from({length:48},(_,i)=> i % 8 === 0 ? Math.floor(i/12)+"h"+String(Math.floor((i%12)*5)).padStart(2,"0")+"m" : "");
const MW_RSSL  = [-42,-43,-43,-42,-44,-46,-50,-55,-62,-70,-78,-84,-81,-75,-67,-59,-52,-47,-44,-43,-42,-42,-43,-44,-46,-48,-51,-55,-60,-67,-74,-80,-83,-78,-71,-63,-55,-49,-45,-43,-42,-42,-43,-44,-45,-44,-43,-42];
const MW_ACM_STATES = MW_RSSL.map(r => r > -65 ? "256QAM" : r > -75 ? "64QAM" : r > -85 ? "QPSK" : "FEC_ONLY");

// ─── Visualization Components ─────────────────────────────────────────────────

function PhaseProgressBar({ scenario, stepIndex }) {
  const phases = scenario.phases || [];
  const doneIdx = stepIndex; // stepIndex = last COMPLETED step index (-1 = none)
  const activePhase = doneIdx >= 0 && doneIdx < phases.length ? doneIdx : -1;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "8px 16px 4px", flexShrink: 0 }}>
      {phases.map((ph, i) => {
        const done   = i < doneIdx;
        const active = i === doneIdx;
        const color  = done ? "#22c55e" : active ? "#60a5fa" : "#1e3a5f";
        const text   = done ? "#22c55e" : active ? "#60a5fa" : "#475569";
        return (
          <div key={ph} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: `2px solid ${color}`,
                background: done ? "#052e16" : active ? "#0f1f3d" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color,
                transition: "all 0.4s",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 8, color: text, fontWeight: active ? 700 : 400, letterSpacing: 0.5, marginTop: 3, textAlign: "center" }}>
                {ph}
              </div>
            </div>
            {i < phases.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "#1e3a5f", transition: "background 0.4s", marginBottom: 16, minWidth: 8 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BarViz({ data, keys, indexBy, scenario }) {
  if (!data || data.length === 0) return null;
  const isMulti = keys.length > 1;
  return (
    <ResponsiveBar
      data={data}
      keys={keys}
      indexBy={indexBy}
      theme={NT}
      margin={{ top: 24, right: 120, bottom: 56, left: 56 }}
      padding={0.3}
      groupMode={isMulti ? "grouped" : "stacked"}
      colors={isMulti
        ? ["#3b82f6", "#22c55e", "#f59e0b"]
        : ({ id }) => {
            const v = data.find(d => d[indexBy] === id)?.[keys[0]] || 0;
            return v >= 80 ? "#ef4444" : v >= 70 ? "#f59e0b" : "#22c55e";
          }
      }
      borderRadius={3}
      axisBottom={{ tickSize: 4, tickPadding: 4, legendOffset: 40, legendPosition: "middle" }}
      axisLeft={{ tickSize: 4, tickPadding: 4, legendOffset: -42, legendPosition: "middle",
        legend: keys.length === 1 ? keys[0] : "Value" }}
      enableLabel={false}
      animate={true}
      markers={scenario.chartType === "bar" ? [
        { axis: "y", value: 80, lineStyle: { stroke: "#ef4444", strokeWidth: 1, strokeDasharray: "5 3" },
          legend: "80% limit", legendOrientation: "horizontal",
          textStyle: { fill: "#ef4444", fontSize: 9 } }
      ] : []}
      legends={isMulti ? [{
        dataFrom: "keys", anchor: "right", direction: "column",
        translateX: 110, itemWidth: 100, itemHeight: 18,
        itemTextColor: "#94a3b8", symbolSize: 10, symbolShape: "circle",
      }] : []}
      tooltip={({ id, value, indexValue }) => (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#e2e8f0" }}>
          <strong>{indexValue}</strong> · {id}: <strong>{value}</strong>
        </div>
      )}
    />
  );
}

function LineViz({ data, scenario }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveLine
      data={data}
      theme={NT}
      margin={{ top: 24, right: 120, bottom: 56, left: 56 }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", stacked: false }}
      curve="monotoneX"
      colors={data.map(d => d.color)}
      lineWidth={2}
      pointSize={4}
      pointColor={{ from: "color" }}
      pointBorderWidth={1}
      pointBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
      enableGridX={false}
      axisBottom={{ tickSize: 3, tickPadding: 3, tickRotation: -35, tickValues: "every 3" }}
      axisLeft={{ tickSize: 3, tickPadding: 3 }}
      useMesh={true}
      enableSlices={false}
      animate={true}
      legends={[{
        anchor: "right", direction: "column",
        translateX: 110, itemWidth: 100, itemHeight: 18,
        itemTextColor: "#94a3b8", symbolSize: 10, symbolShape: "circle",
      }]}
      tooltip={({ point }) => (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#e2e8f0" }}>
          <strong style={{ color: point.serieColor }}>{point.serieId}</strong>: {point.data.yFormatted} @ {point.data.xFormatted}
        </div>
      )}
    />
  );
}

function HeatMapViz({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveHeatMap
      data={data}
      theme={NT}
      margin={{ top: 32, right: 40, bottom: 56, left: 96 }}
      forceSquare={false}
      xInnerPadding={0.05}
      yInnerPadding={0.05}
      colors={{ type: "sequential", scheme: "blues", minValue: 10, maxValue: 100 }}
      emptyColor="#0a1628"
      borderWidth={1}
      borderColor="#0a1628"
      enableLabels={false}
      animate={true}
      hoverTarget="cell"
      tooltip={({ cell }) => (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#e2e8f0" }}>
          <strong>{cell.serieId}</strong> · {cell.data.x}: <strong>{cell.data.value}%</strong>
        </div>
      )}
    />
  );
}

function ZTPArchitectureViz({ stepIndex }) {
  // stepIndex: -1=idle, 0=BOOTSTRAP, 1=DHCP, 2=NETCONF, 3=CONFIG, 4=VERIFY
  const step = stepIndex; // -1..4

  // Which O-RAN layers are "active" (highlighted) at each step
  // layers: 0=SMO, 1=NRT-RIC, 2=O-CU, 3=O-DU, 4=O-RU
  const layerActive = {
    "-1": [],
    0:  [4],          // BOOTSTRAP: O-RU boots
    1:  [4, 0],       // DHCP: O-RU ↔ DHCP Server (near SMO)
    2:  [0, 4],       // NETCONF: SMO ↔ O-RU M-Plane
    3:  [0, 1, 2, 3, 4], // CONFIG: full stack configured
    4:  [0, 1, 2, 3, 4], // VERIFY: all green
  };
  const active = layerActive[String(step)] || [];

  const layers = [
    { label: "SMO / MANO",    sub: "M-Plane Server · O1 · FCAPS · OSS/BSS",            icon: "🏛️", iface: null,              ifaceLabel: null },
    { label: "Non-RT RIC",    sub: "rApps · A1 Policy · O-RAN Intent Engine",           icon: "🧠", iface: "O1 / REST",        ifaceLabel: "O1 Interface" },
    { label: "O-CU-CP / UP",  sub: "RRC · PDCP (CP) · SDAP · PDCP (UP) · F1-C/U",      icon: "⚡", iface: "A1 / E2",          ifaceLabel: "A1 Interface" },
    { label: "O-DU",          sub: "MAC · PHY-High · RLC · Open Fronthaul (M-Plane)",   icon: "📦", iface: "F1-C / F1-U",      ifaceLabel: "F1 Interface" },
    { label: "O-RU  [NEW SITE SITE-07]", sub: "PHY-Low · RF · Antenna · eCPRI · IEEE 802.1CM",    icon: "📡", iface: "Open Fronthaul eCPRI / IEEE 1914.3", ifaceLabel: "Open Fronthaul" },
  ];

  // Animated protocol flows shown per step
  const flows = {
    0: { from: 4, to: 0, label: "DHCP DISCOVER  →  factory-cert  →  Option-43 ZTP trigger", color: "#f59e0b", dir: "up" },
    1: { from: 0, to: 4, label: "DHCP ACK  IP=10.240.1.47  M-Plane=mplane.northstar.net  NTP✅", color: "#22c55e", dir: "down" },
    2: { from: 0, to: 4, label: "NETCONF/TLS  hello  session-id=4721  caps: o-ran-interfaces, o-ran-delay-mgmt", color: "#60a5fa", dir: "down" },
    3: { from: 0, to: 4, label: "edit-config → carrier 2100MHz 20MHz · T12=260µs · sync-plane ETH1", color: "#a78bfa", dir: "down" },
    4: { from: 4, to: 0, label: "get-config: validated ✅  eCPRI fronthaul ✅  RF 2100MHz on-air ✅  ZTP audit logged", color: "#22c55e", dir: "up" },
  };

  const stepDetails = {
    "-1": { title: "Awaiting simulation start…", proto: "", detail: "", badge: "IDLE" },
    0:  { title: "O-RU Power-On: Day-0 DHCP Bootstrap", proto: "DHCP Option 43 + Factory PKI", badge: "BOOTSTRAP",
           detail: "The O-RU arrives at the tower site. A field tech plugs in power — that is the only human action. The unit boots using factory-installed firmware and TLS certificate, sends a DHCP Discover, and waits." },
    1:  { title: "DHCP ACK: IP + M-Plane Endpoint Resolved", proto: "DHCP / DNS / NTP", badge: "DHCP",
           detail: "The DHCP server returns IP 10.240.1.47 and — critically — embeds the M-Plane server address in Option 43. DNS resolves mplane.northstar.net → 203.0.113.10. NTP sync completes. The O-RU now knows who to call." },
    2:  { title: "NETCONF Session Established (TLS 1.3)", proto: "RFC 6241 NETCONF / TLS 1.3 port 830", badge: "NETCONF",
           detail: "The O-RU initiates a TLS connection to the M-Plane server. NETCONF hello messages are exchanged. The SMO learns the O-RU's capabilities: o-ran-interfaces, o-ran-delay-management, ietf-hardware. Management session is live." },
    3:  { title: "edit-config: Full Configuration Pushed", proto: "NETCONF edit-config RPC / YANG models", badge: "CONFIG",
           detail: "The SMO sends a single NETCONF edit-config with 3 config sections: (1) carrier-config — 2100 MHz, 20 MHz BW, 4T4R MIMO; (2) delay-management — T12=260µs fronthaul timing; (3) interface config — sync-plane Ethernet. Config validated against YANG schema. O-DU and O-CU provisioned via F1/E2." },
    4:  { title: "IN-SERVICE: All Layers Verified ✅", proto: "NMS E2E Test / OSS Audit Trail", badge: "IN-SVC",
           detail: "NMS runs an E2E service test: eCPRI fronthaul OK, RF transmitting on 2100 MHz, test call PASS. The entire site was activated in 14 minutes with zero human CLI interaction. ZTP audit record written to OSS." },
  };

  const detail = stepDetails[String(step)] || stepDetails["-1"];
  const flow   = step >= 0 ? flows[step] : null;

  // Colour helpers
  const col = (i) => {
    if (step === 4) return "#22c55e";
    if (active.includes(i)) return "#10b981";
    return "#1e3a5f";
  };
  const bg = (i) => {
    if (step === 4) return "#052e16";
    if (active.includes(i)) return "#052e16";
    return "#060e1e";
  };
  const txt = (i) => (active.includes(i) || step === 4) ? "#d1fae5" : "#334155";

  const LAYER_H = 64;
  const GAP     = 18;
  const LEFT    = 200;
  const BOX_W   = 480;
  const TOTAL_H = layers.length * LAYER_H + (layers.length - 1) * GAP;
  const ARROW_X = LEFT + BOX_W + 8;

  return (
    <div style={{ display: "flex", gap: 16, height: "100%", minHeight: 0, padding: "0 8px" }}>

      {/* ── LEFT: O-RAN Stack Architecture ────────────────────────── */}
      <div style={{ flex: "0 0 auto", width: 700 }}>
        <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>
          O-RAN ARCHITECTURE — ZTP PROVISIONING FLOW
        </div>
        <svg width="100%" viewBox={`0 0 700 ${TOTAL_H + 20}`} style={{ overflow: "visible" }}>
          {layers.map((layer, i) => {
            const y = i * (LAYER_H + GAP);
            const isActive = active.includes(i) || step === 4;
            const layerCol = col(i);
            const layerBg  = bg(i);
            const layerTxt = txt(i);

            // Interface connector (between this layer and next)
            const connY = y + LAYER_H;
            const connMid = connY + GAP / 2;

            return (
              <g key={layer.label}>
                {/* Layer box */}
                <rect x={LEFT} y={y} width={BOX_W} height={LAYER_H}
                  rx={8} fill={layerBg}
                  stroke={layerCol} strokeWidth={isActive ? 2 : 1}
                  style={{ filter: isActive ? "drop-shadow(0 0 6px rgba(16,185,129,0.4))" : "none" }}
                />
                {/* Icon */}
                <text x={LEFT + 22} y={y + LAYER_H / 2} textAnchor="middle"
                  dominantBaseline="middle" fontSize={22}>{layer.icon}</text>
                {/* Layer name */}
                <text x={LEFT + 46} y={y + 20} fontSize={11} fontWeight={700} fill={isActive ? "#10b981" : "#475569"}>{layer.label}</text>
                <text x={LEFT + 46} y={y + 35} fontSize={9} fill={layerTxt} opacity={0.85}>{layer.sub}</text>
                {/* Active badge */}
                {isActive && step >= 0 && (
                  <g>
                    <rect x={LEFT + BOX_W - 76} y={y + 10} width={68} height={16} rx={4}
                      fill={step === 4 ? "#052e16" : "#0a1628"} stroke={step === 4 ? "#22c55e" : "#10b981"} strokeWidth={1} />
                    <text x={LEFT + BOX_W - 42} y={y + 18} textAnchor="middle" dominantBaseline="middle"
                      fontSize={7} fontWeight={700} fill={step === 4 ? "#22c55e" : "#10b981"}>
                      {step === 4 ? "✅ IN-SVC" : "● ACTIVE"}
                    </text>
                  </g>
                )}
                {/* Interface label between layers */}
                {i < layers.length - 1 && layer.iface && (
                  <g>
                    <line x1={LEFT + BOX_W / 2} y1={connY} x2={LEFT + BOX_W / 2} y2={connY + GAP}
                      stroke={layerCol} strokeWidth={1} strokeDasharray={isActive ? "0" : "3 3"} />
                    <rect x={LEFT + BOX_W / 2 - 62} y={connMid - 8} width={124} height={15} rx={3}
                      fill="#060e1e" stroke={layerCol} strokeWidth={1} />
                    <text x={LEFT + BOX_W / 2} y={connMid} textAnchor="middle" dominantBaseline="middle"
                      fontSize={8} fill={isActive ? "#94a3b8" : "#334155"}>{layer.iface}</text>
                  </g>
                )}

                {/* Animated protocol flow arrow on the right */}
                {flow && (
                  (() => {
                    const fromY = flow.from * (LAYER_H + GAP) + LAYER_H / 2;
                    const toY   = flow.to   * (LAYER_H + GAP) + LAYER_H / 2;
                    const isOnPath = flow.dir === "down"
                      ? (i >= flow.to && i <= flow.from)
                      : (i <= flow.to && i >= flow.from);
                    if (!isOnPath) return null;
                    const segTop    = y + LAYER_H / 2;
                    const segBottom = Math.min((i + 1) * (LAYER_H + GAP) + LAYER_H / 2, toY);
                    if (i === (flow.dir === "down" ? flow.to : flow.from)) return null;
                    return (
                      <line key={`seg-${i}`}
                        x1={ARROW_X + 12} y1={flow.dir === "down" ? segTop : segBottom}
                        x2={ARROW_X + 12} y2={flow.dir === "down" ? segBottom : segTop}
                        stroke={flow.color} strokeWidth={2} opacity={0.7} />
                    );
                  })()
                )}
              </g>
            );
          })}

          {/* Protocol arrow (vertical line + arrowhead + label) */}
          {flow && (() => {
            const fromY = flow.from * (LAYER_H + GAP) + LAYER_H / 2;
            const toY   = flow.to   * (LAYER_H + GAP) + LAYER_H / 2;
            const ax    = ARROW_X + 12;
            const arrowPts = flow.dir === "down"
              ? `${ax - 6},${toY - 10} ${ax + 6},${toY - 10} ${ax},${toY}`
              : `${ax - 6},${toY + 10} ${ax + 6},${toY + 10} ${ax},${toY}`;
            return (
              <g>
                <line x1={ax} y1={fromY} x2={ax} y2={toY}
                  stroke={flow.color} strokeWidth={2.5} opacity={0.9}
                  strokeDasharray="6 3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-18"
                    dur="0.8s" repeatCount="indefinite" />
                </line>
                <polygon points={arrowPts} fill={flow.color} opacity={0.9} />
                {/* Protocol label on arrow */}
                <rect x={ax + 14} y={(fromY + toY) / 2 - 10} width={160} height={20} rx={4}
                  fill="#060e1e" stroke={flow.color} strokeWidth={1} />
                <text x={ax + 18} y={(fromY + toY) / 2} dominantBaseline="middle"
                  fontSize={8} fill={flow.color} fontWeight={700}>
                  {flow.dir === "down" ? "↓" : "↑"} {step === 0 ? "DHCP DISCOVER" : step === 1 ? "DHCP ACK" : step === 2 ? "NETCONF Hello" : step === 3 ? "edit-config RPC" : "ZTP Complete ✅"}
                </text>
              </g>
            );
          })()}

          {/* ZTP timer badge (bottom) */}
          <g>
            <rect x={LEFT} y={TOTAL_H + 6} width={160} height={14} rx={4}
              fill="#060e1e" stroke="#1e3a5f" strokeWidth={1} />
            <text x={LEFT + 80} y={TOTAL_H + 13} textAnchor="middle" dominantBaseline="middle"
              fontSize={8} fill={step >= 0 ? "#10b981" : "#334155"}>
              {step < 0 ? "ZTP: NOT STARTED" : step === 4 ? "✅ ZTP COMPLETE — 14 min, 0 human touches" : `⏱ ZTP in progress… step ${step + 1}/5`}
            </text>
          </g>
        </svg>
      </div>

      {/* ── RIGHT: Step Detail Panel ───────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Step badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
            background: step === 4 ? "#052e16" : step >= 0 ? "#0a1f3d" : "#0a1628",
            color: step === 4 ? "#22c55e" : step >= 0 ? "#60a5fa" : "#475569",
            border: `1px solid ${step === 4 ? "#22c55e" : step >= 0 ? "#1e3a5f" : "#1e2a3a"}`,
            letterSpacing: 0.8 }}>
            {detail.badge}
          </span>
          {step >= 0 && (
            <span style={{ fontSize: 9, color: "#60a5fa", opacity: 0.7 }}>Step {step + 1} / 5</span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4 }}>{detail.title}</div>

        {/* Protocol badge */}
        {detail.proto && (
          <div style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4, display: "inline-flex",
            background: "#0a1628", border: "1px solid #1e3a5f", color: "#94a3b8", fontFamily: "monospace" }}>
            📌 {detail.proto}
          </div>
        )}

        {/* Detail text */}
        <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.65 }}>{detail.detail}</div>

        {/* Flow label */}
        {flow && (
          <div style={{ fontSize: 9, fontFamily: "monospace", color: flow.color, padding: "6px 10px",
            background: "#060e1e", border: `1px solid ${flow.color}33`, borderRadius: 6, lineHeight: 1.6 }}>
            {flow.label}
          </div>
        )}

        {/* What-manual-vs-ZTP comparison */}
        {step >= 0 && (
          <div style={{ marginTop: "auto", padding: "8px 10px", background: "#060e1e",
            border: "1px solid #1e3a5f", borderRadius: 6 }}>
            <div style={{ fontSize: 8, color: "#475569", fontWeight: 700, marginBottom: 6, letterSpacing: 0.8 }}>MANUAL vs ZTP COMPARISON</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                ["Manual",          "4-8 hrs",  "#ef4444"],
                ["ZTP",             "14 min",   "#22c55e"],
                ["Human touches",   step === 4 ? "0 ✅" : "...", step === 4 ? "#22c55e" : "#60a5fa"],
                ["Config errors",   step === 4 ? "0 (YANG validated)" : "~15%", step === 4 ? "#22c55e" : "#f59e0b"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                  <span style={{ fontSize: 8, color: "#475569" }}>{label}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idle state prompt */}
        {step < 0 && (
          <div style={{ marginTop: 16, padding: "16px", background: "#060e1e",
            border: "1px dashed #1e3a5f", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🤖</div>
            <div style={{ fontSize: 10, color: "#475569" }}>
              Press <strong style={{ color: "#10b981" }}>▶ RUN</strong> to begin the ZTP simulation.
            </div>
            <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>
              Watch how a brand-new O-RU goes from factory→ site→ on-air in 14 minutes with zero human CLI touches.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NTNOrbitalViz({ stepIndex }) {
  const totalSteps = 5;
  const progress = Math.max(0, (stepIndex + 1) / totalSteps);
  // Satellite arc: parabolic from left to right
  const W = 860, H = 160;
  const satX = 60 + progress * 740;
  const satY = 80 - Math.sin(progress * Math.PI) * 60;
  // Beam footprint
  const beamSize = 60 + Math.sin(progress * Math.PI) * 20;
  const handoverAt = progress > 0.6;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 160 }}>
      {/* Earth surface */}
      <rect x={0} y={120} width={W} height={40} fill="#0a1628" rx={0} />
      <text x={10} y={138} fontSize={9} fill="#475569">EARTH SURFACE  —  Coverage Zone: Pacific Northwest (47°N, 122°W)</text>
      {/* Ground stations */}
      {[150, 420, 700].map((gx, i) => (
        <g key={i}>
          <line x1={gx} y1={120} x2={gx} y2={100} stroke="#1e3a5f" strokeWidth={1} />
          <text x={gx} y={118} textAnchor="middle" fontSize={8} fill={i === 1 ? "#60a5fa" : "#475569"}>gNB-{i + 1}</text>
        </g>
      ))}
      {/* Satellite arc path (dotted) */}
      <path d="M 60 80 Q 430 20 800 80" fill="none" stroke="#1e3a5f" strokeWidth={1} strokeDasharray="4 3" />
      {/* Beam footprint */}
      <ellipse cx={satX} cy={120} rx={beamSize} ry={12}
        fill={handoverAt ? "#f59e0b22" : "#3b82f622"} stroke={handoverAt ? "#f59e0b" : "#3b82f6"} strokeWidth={1} />
      <line x1={satX} y1={satY + 10} x2={satX - beamSize * 0.7} y2={120} stroke={handoverAt ? "#f59e0b" : "#3b82f6"} strokeWidth={1} strokeOpacity={0.5} />
      <line x1={satX} y1={satY + 10} x2={satX + beamSize * 0.7} y2={120} stroke={handoverAt ? "#f59e0b" : "#3b82f6"} strokeWidth={1} strokeOpacity={0.5} />
      {/* Satellite */}
      <circle cx={satX} cy={satY} r={10} fill="#0f1f3d" stroke="#60a5fa" strokeWidth={2} />
      <text x={satX} y={satY} textAnchor="middle" dominantBaseline="middle" fontSize={12}>🛰️</text>
      {/* Labels */}
      <text x={satX + 14} y={satY - 4} fontSize={8} fill="#60a5fa">LEO 550km</text>
      {handoverAt && <text x={satX} y={satY - 16} textAnchor="middle" fontSize={8} fill="#f59e0b">⚡ HO EXECUTING</text>}
      {/* Orbit label */}
      <text x={420} y={14} textAnchor="middle" fontSize={8} fill="#1e3a5f">Orbital Arc (53° inclination, 7.6 km/s)</text>
    </svg>
  );
}

// Inferno-like color mapping fully inline — no library dependency
// t ∈ [0,1]: 0=dark navy, 0.3=purple, 0.55=magenta, 0.75=orange, 1=bright yellow
function infernoColor(t) {
  const c = Math.max(0, Math.min(1, t));
  if (c < 0.25) {
    // black → dark purple
    const u = c / 0.25;
    return `rgb(${Math.round(u * 60)},${Math.round(u * 4)},${Math.round(u * 110)})`;
  } else if (c < 0.5) {
    // dark purple → deep magenta
    const u = (c - 0.25) / 0.25;
    return `rgb(${Math.round(60 + u * 130)},${Math.round(4 + u * 20)},${Math.round(110 + u * 20)})`;
  } else if (c < 0.75) {
    // magenta → orange
    const u = (c - 0.5) / 0.25;
    return `rgb(${Math.round(190 + u * 55)},${Math.round(24 + u * 110)},${Math.round(130 - u * 100)})`;
  } else {
    // orange → bright yellow
    const u = (c - 0.75) / 0.25;
    return `rgb(${Math.round(245 + u * 10)},${Math.round(134 + u * 100)},${Math.round(30 - u * 25)})`;
  }
}

function ISACViz({ data, stepIndex }) {
  const objects = [
    { label: "Pedestrian", range: "20m", vel: "0 km/h",   icon: "🚶", color: "#a78bfa" },
    { label: "Cyclist",    range: "50m", vel: "36 km/h",  icon: "🚴", color: "#f97316" },
    { label: "Vehicle",    range: "80m", vel: "84 km/h",  icon: "🚗", color: "#22c55e" },
  ];
  const showObjects = stepIndex >= 2;

  // SVG dimensions
  const ML = 52, MR = 8, MT = 22, MB = 44;  // margins
  const W = 900, H = 420;
  const rows = data ? data.length : 0;
  const cols = data && data[0] ? data[0].data.length : 0;
  const cw = cols > 0 ? (W - ML - MR) / cols : 0;
  const rh = rows > 0 ? (H - MT - MB) / rows : 0;

  const velLabels  = data && data[0] ? data[0].data.map(d => d.x) : [];
  const rangeLabels = data ? data.map(r => r.id) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Object tracking cards */}
      {showObjects && (
        <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: "0 4px" }}>
          {objects.map((obj) => (
            <div key={obj.label} style={{ flex: 1, background: "#0a1628", border: `1px solid ${obj.color}`, borderRadius: 6, padding: "6px 10px", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>{obj.icon}</span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: obj.color }}>{obj.label}</div>
                <div style={{ fontSize: 9, color: "#64748b" }}>Range: {obj.range} · {obj.vel}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SVG Range-Doppler display */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "stretch" }}>
        {data && data.length > 0 ? (
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
               style={{ display: "block", background: "#020812", borderRadius: 6 }}>
            {/* Grid cells */}
            {data.map((row, ri) =>
              row.data.map((cell, vi) => {
                const t = Math.max(0, Math.min(1, (cell.value - 30) / 70));
                const fill = infernoColor(t);
                return (
                  <rect
                    key={`${ri}-${vi}`}
                    x={ML + vi * cw + 0.5}
                    y={MT + ri * rh + 0.5}
                    width={Math.max(1, cw - 1)}
                    height={Math.max(1, rh - 1)}
                    fill={fill}
                  />
                );
              })
            )}
            {/* Velocity axis labels (bottom) */}
            {velLabels.filter((_, i) => i % 2 === 0).map((lbl, i) => (
              <text key={lbl} x={ML + i * 2 * cw + cw} y={H - MB + 14}
                    textAnchor="middle" fill="#64748b" fontSize={9}>{lbl}</text>
            ))}
            {/* Range axis labels (left) */}
            {rangeLabels.map((lbl, i) => (
              <text key={lbl} x={ML - 6} y={MT + i * rh + rh / 2 + 3}
                    textAnchor="end" fill="#64748b" fontSize={9}>{lbl}</text>
            ))}
            {/* Axis titles */}
            <text x={W / 2} y={H - 4} textAnchor="middle" fill="#94a3b8" fontSize={10}>Velocity (km/h) →</text>
            <text x={12} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize={10}
                  transform={`rotate(-90,12,${H/2})`}>Range →</text>
            {/* CFAR threshold line annotation */}
            <text x={W - MR - 2} y={MT - 6} textAnchor="end" fill="#475569" fontSize={8}>CFAR +15 dB threshold</text>
            {/* Colour scale bar (right side) */}
            {Array.from({ length: 20 }, (_, k) => {
              const t = k / 19;
              return (
                <rect key={k} x={W - 6} y={MT + (19 - k) * ((H - MT - MB) / 20)}
                      width={5} height={(H - MT - MB) / 20} fill={infernoColor(t)} />
              );
            })}
            <text x={W - 3} y={MT - 2} textAnchor="middle" fill="#64748b" fontSize={7}>100</text>
            <text x={W - 3} y={H - MB + 10} textAnchor="middle" fill="#64748b" fontSize={7}>30</text>
          </svg>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#334155", fontSize: 12 }}>
            Sensing initialising…
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, fontSize: 9, color: "#475569", textAlign: "center", paddingBottom: 4 }}>
        Range-Doppler map · CFAR threshold +15 dB · {showObjects ? "3 targets confirmed above threshold" : "Scanning…"}
      </div>
    </div>
  );
}

function CAPEXViz({ data, stepIndex }) {
  const sites = ["Site-A", "Site-B", "Site-C", "Site-D", "Site-E"];
  const npv   = [2.4, 1.8, 0.9, 1.4, 2.1];
  const irr   = [28, 22, 14, 19, 26];
  const build = [1.8, 1.4, 0.8, 1.1, 1.6];
  const score = [91, 72, 48, 64, 84];
  const labels = ["🥇 WINNER", "🥉 3rd", "❌ Defer", "4th", "🥈 2nd"];
  const colors = ["#22c55e","#06b6d4","#ef4444","#475569","#f59e0b"];

  const showRanking = stepIndex >= 2;
  const showCommit  = stepIndex >= 4;

  // Cashflow Y0-Y5 for Site-A winner
  const cashflow = [
    { year: "Y0", value: -1800, color: "#ef4444" },
    { year: "Y1", value: -200,  color: "#ef4444" },
    { year: "Y2", value: 380,   color: "#22c55e" },
    { year: "Y3", value: 720,   color: "#22c55e" },
    { year: "Y4", value: 940,   color: "#22c55e" },
    { year: "Y5", value: 1100,  color: "#22c55e" },
  ];
  // Break-even is between Y1 and Y2 (cumulative goes +ve)
  const cumulative = cashflow.reduce((acc, c, i) => {
    acc.push((acc[i - 1] || 0) + c.value);
    return acc;
  }, []);

  const barData = sites.map((s, i) => ({
    site: s,
    "NPV ($M)": npv[i],
    "IRR (%)":  irr[i],
    "Build ($M)": -build[i],
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Ranking row */}
      {showRanking && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {sites.map((s, i) => (
            <div key={s} style={{ flex: 1, padding: "5px 6px", borderRadius: 6, textAlign: "center",
              background: i === 0 ? "#052e16" : "#060e1e",
              border: `1px solid ${colors[i]}`, fontSize: 8 }}>
              <div style={{ fontWeight: 700, color: colors[i] }}>{labels[i]}</div>
              <div style={{ color: "#94a3b8", marginTop: 1 }}>{s}</div>
              <div style={{ color: colors[i], fontWeight: 700, fontSize: 9 }}>{score[i]}/100</div>
            </div>
          ))}
        </div>
      )}

      {/* Site comparison bar chart */}
      <div style={{ flex: "0 0 45%", minHeight: 0 }}>
        <div style={{ fontSize: 9, color: "#eab308", fontWeight: 700, marginBottom: 2 }}>NPV / IRR / Build Cost — 5 Candidate Sites</div>
        <ResponsiveBar
          data={barData}
          keys={["NPV ($M)", "IRR (%)", "Build ($M)"]}
          indexBy="site"
          theme={NT}
          margin={{ top: 10, right: 120, bottom: 40, left: 50 }}
          padding={0.28}
          groupMode="grouped"
          colors={["#22c55e","#3b82f6","#ef4444"]}
          axisBottom={{ tickSize: 3, tickPadding: 3 }}
          axisLeft={{ tickSize: 3, tickPadding: 3 }}
          legends={[{ dataFrom:"keys", anchor:"right", direction:"column", itemWidth:90, itemHeight:16, translateX:110, symbolSize:8, itemTextColor:"#64748b" }]}
          tooltip={({ id, value, indexValue }) => (
            <div style={{ background:"#0f1f3d", padding:"6px 10px", borderRadius:4, border:"1px solid #1e3a5f", fontSize:11, color:"#e2e8f0" }}>
              <strong>{indexValue}</strong>: {id} = {value}
            </div>
          )}
        />
      </div>

      {/* Cashflow waterfall */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>
          Site-A: 5-Year Cashflow Waterfall
          {stepIndex >= 3 && <span style={{ color: "#22c55e", marginLeft: 8 }}>Break-even: Year 1→2 ✅</span>}
        </div>
        <svg width="100%" viewBox="0 0 560 120" style={{ display: "block" }}>
          {cashflow.map((c, i) => {
            const x = 30 + i * 86;
            const maxAbs = 1800;
            const barH = Math.abs(c.value) / maxAbs * 70;
            const positive = c.value >= 0;
            const barY = positive ? 80 - barH : 80;
            const cum = cumulative[i];
            return (
              <g key={c.year}>
                <rect x={x} y={barY} width={60} height={barH} rx={3}
                  fill={c.color + "cc"} stroke={c.color} strokeWidth={1}
                  style={showCommit && i === 0 ? { filter: "drop-shadow(0 0 4px rgba(239,68,68,0.4))" } : {}}
                />
                <text x={x + 30} y={barY - 4} textAnchor="middle" fontSize={8} fill={c.color} fontWeight={700}>
                  {c.value > 0 ? "+" : ""}{c.value}k
                </text>
                <text x={x + 30} y={96} textAnchor="middle" fontSize={8} fill="#475569">{c.year}</text>
                {/* Cumulative */}
                <text x={x + 30} y={108} textAnchor="middle" fontSize={7} fill={cum >= 0 ? "#22c55e" : "#ef4444"}>
                  Σ{cum > 0 ? "+" : ""}{cum}k
                </text>
              </g>
            );
          })}
          {/* Zero line */}
          <line x1={20} y1={80} x2={540} y2={80} stroke="#1e3a5f" strokeWidth={1} strokeDasharray="4 3" />
          <text x={12} y={83} fontSize={7} fill="#334155">$0</text>
          {/* Break-even marker */}
          {stepIndex >= 3 && (
            <g>
              <line x1={200} y1={40} x2={200} y2={95} stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" />
              <text x={205} y={50} fontSize={7} fill="#22c55e">Break-even</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

function URLLCViz({ data, stepIndex }) {
  const step = stepIndex;
  // Factory floor: 6 machines, each with a packet indicator
  const machines = [
    { x: 60,  y: 40, label: "Robot A" },
    { x: 160, y: 40, label: "Robot B" },
    { x: 260, y: 40, label: "AGV-1" },
    { x: 360, y: 40, label: "CNC-1" },
    { x: 460, y: 40, label: "Sensor" },
    { x: 560, y: 40, label: "PLC-1" },
  ];
  const nrOK = step >= 2;

  // SLA badge data
  const badges = [
    { label: "Latency SLA",   val: "<1ms",          met: step >= 2, std: "TS 22.104" },
    { label: "Reliability",   val: "P99.999",        met: step >= 2, std: "TS 22.261" },
    { label: "Redundancy",    val: "Dual-path NR",   met: step >= 1, std: "TS 38.824" },
    { label: "URLLC Profile", val: "Mini-slot HARQ", met: step >= 1, std: "TS 38.213" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* Factory floor SVG */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: "#ec4899", fontWeight: 700, marginBottom: 4 }}>
          🏭 INDUSTRIAL CAMPUS — URLLC PACKET DELIVERY STATUS
        </div>
        <svg width="100%" viewBox="0 0 640 90" style={{ display: "block" }}>
          {/* Floor */}
          <rect x={10} y={10} width={620} height={70} rx={6} fill="#060e1e" stroke="#1e3a5f" strokeWidth={1} />
          <text x={320} y={24} textAnchor="middle" fontSize={8} fill="#1e3a5f">5G NR URLLC PRIVATE NETWORK — INDUSTRIAL CAMPUS</text>

          {machines.map((m) => {
            const isSuccess = nrOK;
            const col = isSuccess && step >= 0 ? "#22c55e" : step >= 0 ? "#ef4444" : "#1e3a5f";
            return (
              <g key={m.label}>
                {/* Machine box */}
                <rect x={m.x - 30} y={30} width={60} height={34} rx={4}
                  fill="#0a1628" stroke={col} strokeWidth={step >= 0 ? 1.5 : 0.5}
                />
                <text x={m.x} y={44} textAnchor="middle" fontSize={7} fill={col} fontWeight={700}>{m.label}</text>
                {/* Packet indicator */}
                {step >= 0 && (
                  <>
                    <circle cx={m.x} cy={56} r={5}
                      fill={isSuccess ? "#052e16" : "#1c0a0a"}
                      stroke={isSuccess ? "#22c55e" : "#ef4444"}
                      strokeWidth={1.5}
                    />
                    <text x={m.x} y={59} textAnchor="middle" fontSize={6} fill={isSuccess ? "#22c55e" : "#ef4444"}>
                      {isSuccess ? "✓" : "✗"}
                    </text>
                  </>
                )}
                {/* Wireless link */}
                <line x1={m.x} y1={30} x2={320} y2={16}
                  stroke={col + "66"} strokeWidth={0.8} strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* gNB base station */}
          <rect x={300} y={10} width={40} height={18} rx={3} fill="#0f1f3d" stroke="#ec4899" strokeWidth={1} />
          <text x={320} y={22} textAnchor="middle" fontSize={7} fill="#ec4899" fontWeight={700}>gNB</text>

          {step >= 2 && (
            <text x={320} y={82} textAnchor="middle" fontSize={8} fill="#22c55e">
              ✅ All 6 machines: P99.999 delivery · latency &lt;0.87ms · 0 packet loss
            </text>
          )}
          {step >= 0 && step < 2 && (
            <text x={320} y={82} textAnchor="middle" fontSize={8} fill="#f59e0b">
              ⏳ Provisioning URLLC profile… mini-slot scheduling configuring
            </text>
          )}
        </svg>
      </div>

      {/* SLA badges */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {badges.map(b => (
          <div key={b.label} style={{ flex: 1, padding: "4px 6px", borderRadius: 5, textAlign: "center",
            background: b.met ? "#052e16" : "#060e1e",
            border: `1px solid ${b.met ? "#22c55e" : "#1e3a5f"}` }}>
            <div style={{ fontSize: 7, color: "#475569" }}>{b.std}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: b.met ? "#22c55e" : "#334155", marginTop: 1 }}>{b.val}</div>
            <div style={{ fontSize: 7, color: "#64748b" }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* CDF chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 2 }}>LATENCY CDF — Packet delivery % within latency threshold</div>
        {data && data.length > 0 && data[0].data?.length > 0 ? (
          <ResponsiveLine
            data={data}
            theme={NT}
            margin={{ top: 8, right: 130, bottom: 42, left: 50 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: 100 }}
            curve="monotoneX"
            colors={data.map(d => d.color)}
            lineWidth={2}
            pointSize={4}
            pointColor={{ from: "color" }}
            pointBorderWidth={1}
            pointBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
            enableGridX={false}
            axisBottom={{ tickSize: 3, tickPadding: 3, legend: "Latency (µs)", legendOffset: 32, legendPosition: "middle" }}
            axisLeft={{ tickSize: 3, tickPadding: 3, legend: "Packets within threshold (%)", legendOffset: -42, legendPosition: "middle" }}
            useMesh
            markers={[
              { axis: "y", value: 99.999, lineStyle: { stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 3" }, legend: "P99.999", textStyle: { fill: "#22c55e", fontSize: 8 } },
              { axis: "x", value: "1000µs", lineStyle: { stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 3" }, legend: "1ms SLA", textStyle: { fill: "#f59e0b", fontSize: 8 }, legendOrientation: "vertical" },
            ]}
            legends={[{ anchor: "right", direction: "column", itemWidth: 120, itemHeight: 16, translateX: 130, symbolSize: 8, itemTextColor: "#64748b" }]}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 10 }}>
            Run simulation to see CDF comparison
          </div>
        )}
      </div>
    </div>
  );
}

function MicrowaveViz({ data, stepIndex }) {
  if (!data || data.length === 0) return null;
  // Derive ACM state from last data point's y value
  const lastPts = data[0]?.data || [];
  const lastRssl = lastPts.length > 0 ? lastPts[lastPts.length - 1].y : -42;
  const acmState = lastRssl > -65 ? "256QAM" : lastRssl > -75 ? "64QAM" : lastRssl > -85 ? "QPSK" : "FEC ONLY";
  const acmColor = lastRssl > -65 ? "#22c55e" : lastRssl > -75 ? "#f59e0b" : lastRssl > -85 ? "#f97316" : "#ef4444";
  const acmTput  = lastRssl > -65 ? "1,000 Mbps" : lastRssl > -75 ? "667 Mbps" : lastRssl > -85 ? "250 Mbps" : "< 50 Mbps";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      {/* ACM state indicator */}
      <div style={{ flexShrink: 0, display: "flex", gap: 8, alignItems: "stretch" }}>
        <div style={{ flex: 2, background: "#0a1628", border: `2px solid ${acmColor}`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 28 }}>📡</div>
          <div>
            <div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>ACTIVE MODULATION</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: acmColor, fontFamily: "monospace" }}>{acmState}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Throughput: {acmTput}</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 16px" }}>
          <div style={{ fontSize: 9, color: "#475569", marginBottom: 2 }}>CURRENT RSSL</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: acmColor, fontFamily: "monospace" }}>{lastRssl} dBm</div>
          <div style={{ fontSize: 9, color: "#64748b" }}>23 GHz · 25 km hop</div>
        </div>
        {/* ACM thresholds legend */}
        <div style={{ flex: 1, background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 8, color: "#475569", marginBottom: 6, fontWeight: 700 }}>ACM THRESHOLDS</div>
          {[["256QAM","≥ −65 dBm","#22c55e"],["64QAM","≥ −75 dBm","#f59e0b"],["QPSK","≥ −85 dBm","#f97316"],["FEC ONLY","< −85 dBm","#ef4444"]].map(([m,t,c]) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: c, fontFamily: "monospace" }}>{m}</span>
              <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      {/* RSSL line chart */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0 4px", fontWeight: 700, letterSpacing: 0.5 }}>LINK RSSL (dBm) — 4-HOUR TIMELINE · 23 GHz BACKHAUL</div>
        <ResponsiveLine
          data={data}
          theme={NT}
          margin={{ top: 12, right: 40, bottom: 48, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: -95, max: -35 }}
          curve="monotoneX"
          colors={["#60a5fa"]}
          lineWidth={2}
          pointSize={0}
          enableGridX={false}
          axisBottom={{ tickSize: 3, tickPadding: 3, legend: "Time →", legendOffset: 38, legendPosition: "middle" }}
          axisLeft={{ tickSize: 3, tickPadding: 3, legend: "RSSL (dBm)", legendOffset: -52, legendPosition: "middle" }}
          useMesh={false}
          markers={[
            { axis: "y", value: -65, lineStyle: { stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 3" }, legend: "256QAM −65", textStyle: { fill: "#22c55e", fontSize: 8 }, legendOrientation: "horizontal" },
            { axis: "y", value: -75, lineStyle: { stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 3" }, legend: "64QAM −75", textStyle: { fill: "#f59e0b", fontSize: 8 }, legendOrientation: "horizontal" },
            { axis: "y", value: -85, lineStyle: { stroke: "#ef4444", strokeWidth: 1, strokeDasharray: "4 3" }, legend: "QPSK −85", textStyle: { fill: "#ef4444", fontSize: 8 }, legendOrientation: "horizontal" },
          ]}
          areaOpacity={0.12}
          enableArea={true}
          tooltip={({ point }) => (
            <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#e2e8f0" }}>
              RSSL: <strong>{point.data.yFormatted} dBm</strong>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function RICSteeringViz({ data, stepIndex, scenario }) {
  // 6 cells in a hex-ish grid layout
  const cells = [
    { id: "CC01", x: 200, y: 100, color: "#3b82f6" },
    { id: "CC02", x: 340, y: 60,  color: "#3b82f6" },
    { id: "CC03", x: 480, y: 100, color: "#3b82f6" },
    { id: "CC04", x: 200, y: 230, color: "#3b82f6" },
    { id: "CC05", x: 340, y: 270, color: "#3b82f6" },
    { id: "CC06", x: 480, y: 230, color: "#3b82f6" },
  ];
  const ricX = 340, ricY = 165;

  const prbMap = {};
  (data || []).forEach(d => { prbMap[d.cell] = d["PRB %"]; });

  const steeringActive = stepIndex >= 2;
  const doneState = stepIndex >= 4;

  const prbColor = (val) => {
    if (val >= 85) return "#ef4444";
    if (val >= 70) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <div style={{ display: "flex", gap: 12, height: "100%" }}>
      <svg width="100%" viewBox="0 0 700 340" style={{ flex: 1 }}>
        <text x={350} y={16} textAnchor="middle" fontSize={9} fill="#1e3a5f" fontWeight={700}>
          NEAR-RT RIC — MLB xApp LOAD BALANCING
        </text>

        {/* RIC node (center hub) */}
        <rect x={ricX - 44} y={ricY - 18} width={88} height={36} rx={8}
          fill={stepIndex >= 1 ? "#0f1f3d" : "#060e1e"}
          stroke={stepIndex >= 1 ? "#60a5fa" : "#1e3a5f"} strokeWidth={2}
          style={{ filter: stepIndex >= 1 ? "drop-shadow(0 0 6px rgba(96,165,250,0.5))" : "none" }}
        />
        <text x={ricX} y={ricY - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#60a5fa">Near-RT RIC</text>
        <text x={ricX} y={ricY + 9} textAnchor="middle" fontSize={8} fill="#475569">MLB xApp</text>

        {/* E2 lines from RIC to each cell */}
        {cells.map(cell => (
          <line key={`e2-${cell.id}`}
            x1={ricX} y1={ricY}
            x2={cell.x} y2={cell.y}
            stroke={stepIndex >= 0 ? "#1e3a5f" : "#0d1a2e"}
            strokeWidth={1} strokeDasharray="4 3" />
        ))}

        {/* Steering arrows */}
        {steeringActive && (
          <>
            <defs>
              <marker id="arrowhead-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
              </marker>
              <marker id="arrowhead-amber" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
              </marker>
            </defs>
            <path
              d={`M ${cells[0].x + 30} ${cells[0].y - 5} Q ${340} ${80} ${cells[2].x - 30} ${cells[2].y - 5}`}
              fill="none" stroke="#22c55e" strokeWidth={2}
              strokeDasharray="6 3" markerEnd="url(#arrowhead-green)">
              <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.9s" repeatCount="indefinite" />
            </path>
            <text x={340} y={62} textAnchor="middle" fontSize={8} fill="#22c55e">12 UEs →</text>
            <path
              d={`M ${cells[0].x + 20} ${cells[0].y + 20} Q ${270} ${200} ${cells[4].x - 28} ${cells[4].y - 10}`}
              fill="none" stroke="#f59e0b" strokeWidth={2}
              strokeDasharray="6 3" markerEnd="url(#arrowhead-amber)">
              <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.9s" repeatCount="indefinite" />
            </path>
            <text x={258} y={192} textAnchor="middle" fontSize={8} fill="#f59e0b">8 UEs →</text>
          </>
        )}

        {/* Cell hexagons */}
        {cells.map((cell) => {
          const prb = prbMap[cell.id] || 0;
          const cellCol = prbColor(prb);
          const isOverloaded = prb >= 85;
          const isSource = cell.id === "CC01";
          return (
            <g key={cell.id}>
              <polygon
                points={[0,28, 24,14, 24,-14, 0,-28, -24,-14, -24,14].map((v, idx) =>
                  idx % 2 === 0 ? cell.x + v : cell.y + v).reduce((acc, v, idx) =>
                  idx % 2 === 0 ? acc + `${v},` : acc + `${v} `, "").trim()}
                fill={isOverloaded && stepIndex < 3 ? "#1c0a0a" : "#060e1e"}
                stroke={cellCol} strokeWidth={isSource && stepIndex < 3 ? 2.5 : 1.5}
                style={{ filter: isOverloaded && stepIndex < 3 ? "drop-shadow(0 0 8px rgba(239,68,68,0.6))" : "none" }}
              />
              <text x={cell.x} y={cell.y - 6} textAnchor="middle" fontSize={9} fontWeight={700} fill={cellCol}>{cell.id}</text>
              <text x={cell.x} y={cell.y + 8} textAnchor="middle" fontSize={10} fontWeight={700} fill={cellCol}>{prb}%</text>
              <rect x={cell.x - 18} y={cell.y + 14} width={36} height={5} rx={2} fill="#0a1628" />
              <rect x={cell.x - 18} y={cell.y + 14} width={Math.round(36 * prb / 100)} height={5} rx={2} fill={cellCol} />
              {isOverloaded && stepIndex < 3 && (
                <text x={cell.x} y={cell.y - 38} textAnchor="middle" fontSize={8} fill="#ef4444">🔴 OVERLOAD</text>
              )}
              {doneState && (
                <text x={cell.x} y={cell.y - 38} textAnchor="middle" fontSize={8} fill="#22c55e">✅</text>
              )}
            </g>
          );
        })}

        <text x={580} y={165} fontSize={8} fill="#334155">A1 Policy ↑</text>
        <text x={580} y={177} fontSize={8} fill="#334155">E2 Control ↓</text>

        <rect x={20} y={300} width={8} height={8} fill="#ef4444" rx={1} />
        <text x={32} y={308} fontSize={8} fill="#64748b">≥85% OVERLOAD</text>
        <rect x={110} y={300} width={8} height={8} fill="#f59e0b" rx={1} />
        <text x={122} y={308} fontSize={8} fill="#64748b">70-84% WARNING</text>
        <rect x={210} y={300} width={8} height={8} fill="#22c55e" rx={1} />
        <text x={222} y={308} fontSize={8} fill="#64748b">&lt;70% HEALTHY</text>

        {stepIndex >= 0 && (
          <text x={350} y={325} textAnchor="middle" fontSize={8} fill="#475569">
            {stepIndex === 0 ? "E2 agent collecting PRB reports from all 6 cells…" :
             stepIndex === 1 ? "A1 policy read — MLB trigger: 85%. Overloaded: CC01 (91%)" :
             stepIndex === 2 ? "MLB xApp: steering 12 UEs → CC03, 8 UEs → CC05 via E2 CONTROL" :
             stepIndex === 3 ? "HOs executing… CC01 PRB falling" :
             "✅ All cells balanced. MLB SLA satisfied."}
          </text>
        )}
      </svg>
    </div>
  );
}

function AIRRMViz({ data, stepIndex, scenario }) {
  const TTIS = 20;
  const PRBS = 15;
  const UE_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#22c55e","#f59e0b","#ef4444"];

  function rrAlloc(tti, prb) {
    return (tti + prb) % 6;
  }
  function gnnAlloc(tti, prb) {
    if (prb < 5) return (tti % 3);
    if (prb < 10) return 3 + (tti % 2);
    return 5;
  }

  const showGrid   = stepIndex >= 0;
  const showGNN    = stepIndex >= 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      {/* Top: side-by-side PRB grids */}
      <div style={{ display: "flex", gap: 12, flex: "0 0 auto" }}>
        {/* Round-Robin grid */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, marginBottom: 4, letterSpacing: 0.6 }}>
            📊 ROUND-ROBIN BASELINE — PRB ALLOCATION
          </div>
          <svg width="100%" viewBox={`0 0 ${TTIS * 18} ${PRBS * 14 + 30}`} style={{ display: "block" }}>
            {Array.from({ length: TTIS }).map((_, t) =>
              Array.from({ length: PRBS }).map((_, p) => {
                const ue = rrAlloc(t, p);
                return (
                  <rect key={`rr-${t}-${p}`}
                    x={t * 18} y={p * 14}
                    width={17} height={13} rx={1}
                    fill={showGrid ? UE_COLORS[ue] + "99" : "#0a1628"}
                    stroke={showGrid ? UE_COLORS[ue] + "cc" : "#1e3a5f"}
                    strokeWidth={0.5}
                  />
                );
              })
            )}
            <text x={0} y={PRBS * 14 + 12} fontSize={7} fill="#475569">← TTI (time) →</text>
            <text x={TTIS * 18 - 2} y={PRBS * 14 + 12} fontSize={7} fill="#ef4444" textAnchor="end">NACK: 8.4%</text>
          </svg>
          <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
            {UE_COLORS.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <div style={{ width: 8, height: 8, background: c, borderRadius: 1 }} />
                <span style={{ fontSize: 7, color: "#475569" }}>UE{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GNN grid */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: "#22c55e", fontWeight: 700, marginBottom: 4, letterSpacing: 0.6 }}>
            {showGNN ? "🧠 GNN SCHEDULER — INTERFERENCE-NULLED PRB ALLOCATION" : "🧠 GNN SCHEDULER — (deploying…)"}
          </div>
          <svg width="100%" viewBox={`0 0 ${TTIS * 18} ${PRBS * 14 + 30}`} style={{ display: "block" }}>
            {Array.from({ length: TTIS }).map((_, t) =>
              Array.from({ length: PRBS }).map((_, p) => {
                const ue = gnnAlloc(t, p);
                return (
                  <rect key={`gnn-${t}-${p}`}
                    x={t * 18} y={p * 14}
                    width={17} height={13} rx={1}
                    fill={showGNN ? UE_COLORS[ue] + "cc" : "#0a1628"}
                    stroke={showGNN ? UE_COLORS[ue] : "#1e3a5f"}
                    strokeWidth={0.5}
                  />
                );
              })
            )}
            {!showGNN && (
              <text x={TTIS * 9} y={PRBS * 7} textAnchor="middle" fontSize={9} fill="#334155">Awaiting deployment…</text>
            )}
            <text x={0} y={PRBS * 14 + 12} fontSize={7} fill="#475569">← TTI (time) →</text>
            {showGNN && <text x={TTIS * 18 - 2} y={PRBS * 14 + 12} fontSize={7} fill="#22c55e" textAnchor="end">NACK: 3.1% ↓</text>}
          </svg>
          {showGNN && (
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 7, color: "#475569" }}>PRB 0-4: UE1-3 (high CQI cluster)</span>
              <span style={{ fontSize: 7, color: "#475569" }}>PRB 5-9: UE4-5 (mid)</span>
              <span style={{ fontSize: 7, color: "#475569" }}>PRB 10-14: UE6</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: training loss curve */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>
          PPO TRAINING CONVERGENCE — Loss ↓ · Val Accuracy ↑
        </div>
        {data && data.length > 0 && data[0].data?.length > 0 ? (
          <ResponsiveLine
            data={data}
            theme={NT}
            margin={{ top: 10, right: 100, bottom: 40, left: 50 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: 100 }}
            curve="monotoneX"
            colors={data.map(d => d.color)}
            lineWidth={2}
            pointSize={3}
            enableGridX={false}
            axisBottom={{ tickSize: 3, tickPadding: 3, legend: "Epoch", legendOffset: 30, legendPosition: "middle",
              tickValues: data[0].data.filter((_, i) => i % 5 === 0).map(d => d.x) }}
            axisLeft={{ tickSize: 3, tickPadding: 3, legend: "Value", legendOffset: -38, legendPosition: "middle" }}
            legends={[{ anchor: "right", direction: "column", itemWidth: 90, itemHeight: 16, symbolSize: 8, translateX: 100,
              itemTextColor: "#64748b", effects: [{ on: "hover", style: { itemTextColor: "#e2e8f0" } }] }]}
            useMesh
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#334155", fontSize: 11 }}>
            Run simulation to see training convergence
          </div>
        )}
      </div>
    </div>
  );
}

function DSSFrameViz({ stepIndex, scenario }) {
  // 10 LTE subframes per frame; MBSFN subframes can host NR slots under DSS
  const SUBFRAMES = [0,1,2,3,4,5,6,7,8,9];
  const MBSFN_SET = new Set([1,2,3,6,7,8]);   // 6 MBSFN subframes repurposed for NR
  // 13 CBRS 10-MHz channels across 3550–3670 MHz
  const CBRS_BANDS = ["3550","3560","3570","3580","3590","3600","3610","3620","3630","3640","3650","3660","3670"];

  const step = stepIndex; // -1 = idle/not yet run
  const dssActive  = step >= 2; // CONFIGURE step enables MBSFN pattern
  const cbrsActive = step >= 3; // ACTIVATE step enables CBRS grants
  const senseDone  = step >= 0;

  // CBRS tier assignment per step
  const cbrsGrant = (band) => {
    const freq = parseInt(band);
    if (!senseDone) return "SAS?";
    if (step < 1) return freq < 3570 ? "PROTECT" : "IDLE";  // incumbent check in progress
    if (step === 1) return freq < 3570 ? "PROTECT" : "REGISTR";  // CBSD registration
    if (!cbrsActive) return freq < 3570 ? "PAL" : "PENDING"; // configured but not activated
    if (freq < 3570) return "PAL";   // Priority Access License
    if (freq < 3650) return "GAA";   // General Authorized Access
    return "GAA";
  };
  const grantStyle = {
    "SAS?":    { fill: "#1e293b", stroke: "#475569", text: "#475569" },
    "IDLE":    { fill: "#0f172a", stroke: "#334155", text: "#334155" },
    "PROTECT": { fill: "#450a0a", stroke: "#ef4444", text: "#ef4444" },
    "REGISTR": { fill: "#1c1400", stroke: "#f59e0b", text: "#f59e0b" },
    "PENDING": { fill: "#0c1a30", stroke: "#3b82f6", text: "#3b82f6" },
    "PAL":     { fill: "#052e16", stroke: "#22c55e", text: "#22c55e" },
    "GAA":     { fill: "#0c1a3a", stroke: "#60a5fa", text: "#60a5fa" },
  };

  // LTE subframe utilization (estimated %)
  const lteUtil = [88, 82, 91, 76, 95, 83, 88, 79, 92, 86];
  // NR slot gain after DSS activation (%)
  const nrGain  = [0, 45, 42, 38, 0, 0, 41, 44, 39, 0]; // non-zero only for MBSFN slots

  const SF_W = 52, SF_H = 36, SF_GAP = 6;
  const SF_START_X = 50;
  const ROW1_Y = 18, ROW2_Y = 80, ROW3_Y = 142;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:8, paddingBottom:4 }}>
      {/* Title */}
      <div style={{ fontSize:10, color:"#06b6d4", fontWeight:700, letterSpacing:0.8, flexShrink:0 }}>
        DSS + CBRS SPECTRUM SHARING — LTE / 5G NR COEXISTENCE FRAME STRUCTURE
      </div>

      {/* Phase status banner */}
      <div style={{ display:"flex", gap:6, flexShrink:0 }}>
        {["SENSE","CATALOG","CONFIGURE","ACTIVATE","VALIDATE"].map((ph,i) => {
          const done = step > i, active = step === i;
          return (
            <div key={ph} style={{
              padding:"2px 8px", borderRadius:3, fontSize:8, fontWeight:700,
              background: done ? "#052e16" : active ? "#1c1400" : "#0a1628",
              color: done ? "#22c55e" : active ? "#f59e0b" : "#334155",
              border: `1px solid ${done ? "#22c55e" : active ? "#f59e0b" : "#1e3a5f"}`
            }}>
              {done ? "✓" : active ? "▶" : "○"} {ph}
            </div>
          );
        })}
      </div>

      {/* Main SVG canvas */}
      <svg width="100%" viewBox="0 0 640 200" style={{ flex:"1 1 0", overflow:"visible" }}>

        {/* ── Row labels ── */}
        <text x={2} y={ROW1_Y + SF_H/2 + 5} fontSize={9} fill="#94a3b8" fontWeight={700} dominantBaseline="middle">LTE</text>
        <text x={2} y={ROW2_Y + SF_H/2 + 5} fontSize={9}
          fill={dssActive ? "#22c55e" : "#334155"} fontWeight={700} dominantBaseline="middle">NR</text>
        <text x={2} y={ROW3_Y + SF_H/2 + 5} fontSize={9} fill="#94a3b8" fontWeight={700} dominantBaseline="middle">CBRS</text>

        {/* ── LTE subframe row ── */}
        {SUBFRAMES.map(sf => {
          const x = SF_START_X + sf * (SF_W + SF_GAP);
          const isMBSFN = MBSFN_SET.has(sf);
          const util = lteUtil[sf];
          // LTE retains slot; MBSFN subframes shared with NR after DSS
          const lteFill   = isMBSFN && dssActive ? "#0f2a0f" : "#0a1e3a";
          const lteStroke = isMBSFN && dssActive ? "#22c55e88" : "#2563eb";
          const lteDash   = isMBSFN && dssActive ? "4 2" : "0";
          const textCol   = isMBSFN && dssActive ? "#22c55e99" : "#60a5fa";
          const subLabel  = isMBSFN && dssActive ? "MBSFN" : `SF${sf}`;
          return (
            <g key={`lte-${sf}`}>
              <rect x={x} y={ROW1_Y} width={SF_W} height={SF_H} rx={3}
                fill={lteFill} stroke={lteStroke} strokeWidth={1.5} strokeDasharray={lteDash} />
              {/* Utilization fill bar inside subframe */}
              <rect x={x+2} y={ROW1_Y + SF_H - 8} width={(SF_W-4) * util/100} height={5} rx={1}
                fill={isMBSFN && dssActive ? "#22c55e44" : "#2563eb66"} />
              <text x={x + SF_W/2} y={ROW1_Y + 14} textAnchor="middle" fontSize={9} fontWeight={700} fill={textCol}>
                {subLabel}
              </text>
              <text x={x + SF_W/2} y={ROW1_Y + 25} textAnchor="middle" fontSize={7} fill={textCol + "aa"}>
                {util}%
              </text>
            </g>
          );
        })}

        {/* LTE row label */}
        <text x={SF_START_X} y={ROW1_Y + SF_H + 10} fontSize={7} fill="#475569">SF0 ──────── 10ms LTE Radio Frame ──────── SF9</text>

        {/* ── NR slot row ── */}
        {SUBFRAMES.map(sf => {
          const x = SF_START_X + sf * (SF_W + SF_GAP);
          const isMBSFN = MBSFN_SET.has(sf);
          const hasNR = isMBSFN && dssActive;
          const gain = nrGain[sf];
          return (
            <g key={`nr-${sf}`}>
              <rect x={x} y={ROW2_Y} width={SF_W} height={SF_H} rx={3}
                fill={hasNR ? "#052e16" : "#080f1e"}
                stroke={hasNR ? "#22c55e" : "#1e3a5f"}
                strokeWidth={hasNR ? 2 : 0.5}
              />
              {hasNR ? (
                <>
                  {/* NR capacity fill */}
                  <rect x={x+2} y={ROW2_Y + SF_H - 8} width={(SF_W-4) * gain/100} height={5} rx={1} fill="#22c55e88" />
                  <text x={x+SF_W/2} y={ROW2_Y+14} textAnchor="middle" fontSize={9} fontWeight={700} fill="#22c55e">NR</text>
                  <text x={x+SF_W/2} y={ROW2_Y+25} textAnchor="middle" fontSize={7} fill="#22c55e99">+{gain}%</text>
                </>
              ) : (
                <text x={x+SF_W/2} y={ROW2_Y+SF_H/2+4} textAnchor="middle" fontSize={10} fill="#1e3a5f">—</text>
              )}
            </g>
          );
        })}

        {/* DSS annotation arrow between LTE and NR rows (only after configure) */}
        {dssActive && [1,2,3,6,7,8].map(sf => {
          const x = SF_START_X + sf*(SF_W+SF_GAP) + SF_W/2;
          return (
            <text key={`arrow-${sf}`} x={x} y={ROW2_Y - 4} textAnchor="middle" fontSize={9} fill="#22c55e99">↓</text>
          );
        })}

        {/* NR row annotation */}
        {dssActive && (
          <text x={SF_START_X} y={ROW2_Y + SF_H + 10} fontSize={7} fill="#22c55e88">
            6 MBSFN slots repurposed for 5G NR · CRS-IC active · LTE PDCP 94% maintained
          </text>
        )}

        {/* ── CBRS spectrum strip ── */}
        {CBRS_BANDS.map((band, i) => {
          const grant = cbrsGrant(band);
          const style = grantStyle[grant] || grantStyle["IDLE"];
          const x = SF_START_X + i * 44;
          return (
            <g key={`cbrs-${band}`}>
              <rect x={x} y={ROW3_Y} width={40} height={SF_H} rx={2}
                fill={style.fill} stroke={style.stroke} strokeWidth={1.5} />
              <text x={x+20} y={ROW3_Y+13} textAnchor="middle" fontSize={7} fontWeight={700} fill={style.text}>{grant}</text>
              <text x={x+20} y={ROW3_Y+24} textAnchor="middle" fontSize={6} fill="#64748b">{band}</text>
            </g>
          );
        })}

        {/* CBRS legend line */}
        {step >= 0 && (
          <text x={SF_START_X} y={ROW3_Y + SF_H + 12} fontSize={7}
            fill={cbrsActive ? "#60a5fa" : step === 1 ? "#f59e0b" : "#ef4444"}>
            {step < 1 && "⚡ SAS sensing: checking for naval radar incumbent in 3550–3570 MHz band"}
            {step === 1 && "📋 CBSD registration: 4 devices → SAS. Incumbent zone confirmed. PAL/GAA tier assignment in progress."}
            {step === 2 && "⚙️ PAL grants issued for 3550–3570 MHz. GAA pending SAS activation."}
            {cbrsActive && "✅ CBRS: PAL grants (3550–3570 MHz) + GAA (3580–3670 MHz) — 120 MHz total spectrum active"}
          </text>
        )}
      </svg>

      {/* KPI summary row — shown after simulate */}
      {step >= 4 && (
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          {[
            { label:"NR Bandwidth Gain", value:"+41%", color:"#22c55e" },
            { label:"LTE PDCP Retained", value:"94%",  color:"#3b82f6" },
            { label:"CRS-IC Improvement", value:"18 dB", color:"#f59e0b" },
            { label:"CBRS Bands Active", value:"8 / 8", color:"#60a5fa" },
            { label:"PAL Violations", value:"0",       color:"#22c55e" },
          ].map(k => (
            <div key={k.label} style={{ flex:1, background:"#060e1e", border:"1px solid #1e3a5f",
              borderRadius:4, padding:"4px 6px", textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:7, color:"#64748b" }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Step narrative */}
      {step >= 0 && step < 4 && (
        <div style={{ fontSize:9, color:"#94a3b8", padding:"5px 10px", background:"#060e1e",
          border:"1px solid #1e3a5f", borderRadius:4, flexShrink:0 }}>
          {step === 0 && "🔍 SENSE: scanning 700–4700 MHz for active LTE carriers and CBRS naval radar incumbents…"}
          {step === 1 && "📋 CATALOG: 4 CBSDs registered with SAS. Incumbent detection complete. PAL/GAA tier assignment calculated."}
          {step === 2 && "⚙️ CONFIGURE: MBSFN subframe pattern [SF1,2,3,6,7,8] applied. CRS-IC enabled. DSS coexistence active on LTE + NR."}
          {step === 3 && "🚀 ACTIVATE: all 8 frequency bands live simultaneously. LTE users and NR users co-scheduled per frame."}
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", gap:10, flexShrink:0, flexWrap:"wrap" }}>
        {[["#2563eb","LTE subframe"],["#22c55e","NR in MBSFN slot (DSS)"],["#22c55e","CBRS PAL tier"],["#60a5fa","CBRS GAA tier"],["#ef4444","Incumbent PROTECT"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:10, height:10, background:c+"44", border:`1.5px solid ${c}`, borderRadius:2 }} />
            <span style={{ fontSize:8, color:"#64748b" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnomalyRCAViz({ data, stepIndex, scenario }) {
  const step = stepIndex;

  const nodes = [
    { id: "obs",   x: 300, y: 30,  label: "SINR ANOMALY",  sub: "Score: 0.91",  color: "#ef4444", icon: "⚠️",  visibleAt: 1 },
    { id: "h1",    x: 100, y: 120, label: "Interference",  sub: "P = 0.94",     color: "#ef4444", icon: "📡",  visibleAt: 3 },
    { id: "h2",    x: 300, y: 120, label: "HW Fault",      sub: "P = 0.04",     color: "#475569", icon: "🔧",  visibleAt: 3 },
    { id: "h3",    x: 500, y: 120, label: "Config Error",  sub: "P = 0.02",     color: "#475569", icon: "⚙️",  visibleAt: 3 },
    { id: "e1",    x: 50,  y: 220, label: "PRB spike",     sub: "CC-ADJ T-45m", color: "#f59e0b", icon: "📊",  visibleAt: 2 },
    { id: "e2",    x: 170, y: 220, label: "HO Fail ↑",     sub: "r = -0.92",    color: "#f59e0b", icon: "📶",  visibleAt: 2 },
    { id: "fix",   x: 100, y: 310, label: "Tilt +3°",      sub: "CC-ADJ",       color: "#22c55e", icon: "✅",  visibleAt: 4 },
    { id: "fix2",  x: 240, y: 310, label: "MLB 75%",       sub: "CC-ADJ",       color: "#22c55e", icon: "✅",  visibleAt: 4 },
  ];
  const edges = [
    { from: "obs", to: "h1" },
    { from: "obs", to: "h2" },
    { from: "obs", to: "h3" },
    { from: "h1",  to: "e1" },
    { from: "h1",  to: "e2" },
    { from: "h1",  to: "fix" },
    { from: "h1",  to: "fix2" },
  ];

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const visibleNodes = nodes.filter(n => step >= n.visibleAt);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

  const n = Math.max(2, Math.floor(24 * Math.min((step + 1) / 6 * 1.3, 1)));
  const SINR_DATA = data?.find(d => d.id === "SINR (dB)")?.data?.slice(0, n) || [];
  const HO_DATA   = data?.find(d => d.id === "HO Fail %")?.data?.slice(0, n) || [];

  return (
    <div style={{ display: "flex", gap: 12, height: "100%" }}>
      {/* Left: Bayesian causal tree */}
      <div style={{ flex: "0 0 auto", width: 580 }}>
        <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>
          BAYESIAN ROOT CAUSE ANALYSIS — Inference Tree
        </div>
        <svg width="100%" viewBox="0 0 600 370" style={{ display: "block" }}>
          {step >= 0 && (
            <g>
              <rect x={0} y={0} width={600} height={20} rx={3} fill="#0a1628" stroke="#1e3a5f" strokeWidth={0.5} />
              <text x={300} y={13} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {step === 0 && "Ingesting 24h KPI streams: SINR, HO Fail, PRB Util…"}
                {step === 1 && "Isolation Forest: anomaly score 0.91 > threshold 0.75 — severity HIGH"}
                {step === 2 && "Correlation: SINR↔HO Fail r=-0.92 · PRB spike preceded SINR drop by 45min"}
                {step === 3 && "Bayesian network: P(interference|evidence) = 0.94 · Root cause: CC-ADJ"}
                {step === 4 && "Remediation: tilt +3° + MLB threshold 75% pushed via A1 policy"}
                {step === 5 && "✅ KPI recovery: SINR 20.1 dB · HO Fail 0.8% · Anomaly window CLOSED"}
              </text>
            </g>
          )}

          {visibleEdges.map((e, i) => {
            const f = nodeMap[e.from], t = nodeMap[e.to];
            return (
              <line key={i} x1={f.x} y1={f.y + 22} x2={t.x} y2={t.y - 22}
                stroke={t.color === "#ef4444" ? "#ef4444" : t.color === "#22c55e" ? "#22c55e" : "#1e3a5f"}
                strokeWidth={1.5} opacity={0.6}
                strokeDasharray={t.id === "fix" || t.id === "fix2" ? "4 3" : "0"}
              />
            );
          })}

          {visibleNodes.map(nd => (
            <g key={nd.id} style={{ filter: nd.color === "#ef4444" ? "drop-shadow(0 0 6px rgba(239,68,68,0.4))" : nd.color === "#22c55e" ? "drop-shadow(0 0 6px rgba(34,197,94,0.3))" : "none" }}>
              <rect x={nd.x - 56} y={nd.y - 22} width={112} height={44} rx={6}
                fill={nd.color === "#ef4444" ? "#1c0a0a" : nd.color === "#22c55e" ? "#052e16" : "#0a1628"}
                stroke={nd.color} strokeWidth={nd.id === "h1" ? 2 : 1}
              />
              <text x={nd.x} y={nd.y - 7} textAnchor="middle" fontSize={8} fontWeight={700} fill={nd.color}>{nd.icon} {nd.label}</text>
              <text x={nd.x} y={nd.y + 7} textAnchor="middle" fontSize={8} fill="#94a3b8">{nd.sub}</text>
            </g>
          ))}

          {step >= 3 && (
            <>
              {[{x:100,p:94,c:"#ef4444"},{x:300,p:4,c:"#475569"},{x:500,p:2,c:"#475569"}].map((bar,i) => (
                <g key={i}>
                  <rect x={bar.x - 40} y={148} width={80} height={8} rx={2} fill="#0a1628" stroke="#1e3a5f" strokeWidth={0.5} />
                  <rect x={bar.x - 40} y={148} width={Math.round(80 * bar.p / 100)} height={8} rx={2} fill={bar.c} />
                  <text x={bar.x} y={168} textAnchor="middle" fontSize={8} fill={bar.c} fontWeight={700}>{bar.p}%</text>
                </g>
              ))}
            </>
          )}

          {step >= 5 && (
            <g>
              <rect x={10} y={340} width={580} height={22} rx={4} fill="#052e16" stroke="#22c55e" strokeWidth={1} />
              <text x={300} y={355} textAnchor="middle" fontSize={9} fill="#22c55e" fontWeight={700}>
                ✅ SINR: 20.1 dB · HO Fail: 0.8% · PRB: 45% — Anomaly window CLOSED · Watchdog armed
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Right: KPI timeline */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>24h KPI TIMELINE</div>
        {SINR_DATA.length > 1 ? (
          <ResponsiveLine
            data={[
              { id: "SINR (dB)", color: "#3b82f6", data: SINR_DATA },
              { id: "HO Fail %", color: "#ef4444", data: HO_DATA },
            ]}
            theme={NT}
            margin={{ top: 8, right: 90, bottom: 40, left: 42 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: 25 }}
            curve="monotoneX"
            colors={["#3b82f6","#ef4444"]}
            lineWidth={2}
            pointSize={3}
            enableGridX={false}
            axisBottom={{ tickSize: 3, tickPadding: 3, legend: "Hour", legendOffset: 28, legendPosition: "middle",
              tickValues: SINR_DATA.filter((_, i) => i % 6 === 0).map(d => d.x) }}
            axisLeft={{ tickSize: 3, tickPadding: 3 }}
            legends={[{ anchor: "right", direction: "column", itemWidth: 85, itemHeight: 16, symbolSize: 8, translateX: 90,
              itemTextColor: "#64748b" }]}
            markers={[
              { axis: "x", value: "7h", lineStyle: { stroke: "#ef4444", strokeWidth: 1, strokeDasharray: "3 3" }, legend: "anomaly", textStyle: { fill: "#ef4444", fontSize: 7 } },
              { axis: "x", value: "13h", lineStyle: { stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "3 3" }, legend: "recover", textStyle: { fill: "#22c55e", fontSize: 7 } },
            ]}
            useMesh
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 10 }}>
            Run simulation to see KPI timeline
          </div>
        )}
      </div>
    </div>
  );
}

function DigitalTwinViz({ data, stepIndex, scenario }) {
  const step = stepIndex;
  const kpis = ["Throughput", "SINR", "HO-SR", "PRB Util", "Latency"];
  const units = ["Mbps", "dB", "%", "%", "ms"];
  const live    = [847, 16, 99, 62, 12];
  const twin    = [841, 15, 99, 63, 12];
  const whatif  = [421, 10, 92, 99, 28];
  const guarded = [835, 15, 98, 78, 14];
  const thresholds = [600, 10, 95, 85, 20];

  const showTwin    = step >= 1;
  const showWhatIf  = step >= 2;
  const showPredict = step >= 3;
  const showGuarded = step >= 4;

  const twinVal = (i) => {
    if (showWhatIf) {
      const wi = whatif[i];
      const t  = twin[i];
      const progress = Math.min((step - 2) / 2, 1);
      return Math.round(t + (wi - t) * progress);
    }
    return twin[i];
  };

  const kpiColor = (val, i) => {
    if (i === 3) return val >= 85 ? "#ef4444" : val >= 70 ? "#f59e0b" : "#22c55e";
    if (i === 4) return val >= 20 ? "#ef4444" : val >= 15 ? "#f59e0b" : "#22c55e";
    return val >= thresholds[i] ? "#22c55e" : val >= thresholds[i] * 0.85 ? "#f59e0b" : "#ef4444";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: 0.8, flexShrink: 0 }}>
        DIGITAL TWIN — Live Network vs Twin Simulation vs What-If Scenario
      </div>

      {showTwin && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <div style={{ padding: "3px 10px", borderRadius: 4, background: "#0a1628", border: "1px solid #22c55e", fontSize: 9, color: "#22c55e" }}>
            🪞 Twin Fidelity: 98.2%
          </div>
          <div style={{ padding: "3px 10px", borderRadius: 4, background: "#0a1628", border: "1px solid #1e3a5f", fontSize: 9, color: "#60a5fa" }}>
            ⏱ Sync lag: 63s
          </div>
          {showWhatIf && (
            <div style={{ padding: "3px 10px", borderRadius: 4, background: "#1c0a0a", border: "1px solid #ef4444", fontSize: 9, color: "#ef4444" }}>
              ⚡ What-If: +60% load injected on CC01
            </div>
          )}
          {showGuarded && (
            <div style={{ padding: "3px 10px", borderRadius: 4, background: "#052e16", border: "1px solid #22c55e", fontSize: 9, color: "#22c55e" }}>
              ✅ MLB pre-activated — SLA protected
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 10 }}>
        {/* Live panel */}
        <div style={{ flex: 1, background: "#060e1e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 9, color: "#3b82f6", fontWeight: 700, marginBottom: 8, letterSpacing: 0.6 }}>
            📡 LIVE NETWORK — CC01 (Real-time PM)
          </div>
          {kpis.map((kpi, i) => (
            <div key={kpi} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 8, color: "#64748b" }}>{kpi}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: kpiColor(live[i], i), fontFamily: "monospace" }}>
                  {live[i]} {units[i]}
                </span>
              </div>
              <div style={{ height: 6, background: "#0a1628", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: kpiColor(live[i], i),
                  width: `${Math.min(100, live[i] / (i === 0 ? 12 : 1))}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Twin panel */}
        <div style={{ flex: 1, background: "#060e1e",
          border: `1px solid ${showWhatIf ? "#ef4444" : showTwin ? "#a78bfa" : "#1e3a5f"}`,
          borderRadius: 8, padding: "10px 12px",
          boxShadow: showWhatIf ? "0 0 12px rgba(239,68,68,0.2)" : showTwin ? "0 0 8px rgba(167,139,250,0.15)" : "none" }}>
          <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 8, letterSpacing: 0.6,
            color: showWhatIf ? "#ef4444" : showTwin ? "#a78bfa" : "#334155" }}>
            🪞 DIGITAL TWIN {showWhatIf ? "— WHAT-IF (+60% load)" : showTwin ? "— Shadow Mode" : "— Offline"}
          </div>
          {kpis.map((kpi, i) => {
            const val = showGuarded ? guarded[i] : twinVal(i);
            const diverged = showWhatIf && Math.abs(val - live[i]) > 5;
            return (
              <div key={kpi} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 8, color: "#64748b" }}>{kpi}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {diverged && !showGuarded && (
                      <span style={{ fontSize: 7, color: "#ef4444" }}>⚠️</span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                      color: showTwin ? kpiColor(val, i) : "#334155" }}>
                      {showTwin ? `${val} ${units[i]}` : "—"}
                    </span>
                  </div>
                </div>
                <div style={{ height: 6, background: "#0a1628", borderRadius: 3 }}>
                  {showTwin && (
                    <div style={{ height: 6, borderRadius: 3,
                      background: diverged && !showGuarded ? "#ef4444" : kpiColor(val, i),
                      width: `${Math.min(100, val / (i === 0 ? 12 : 1))}%`,
                      transition: "width 0.5s ease, background 0.3s" }} />
                  )}
                </div>
              </div>
            );
          })}
          {showPredict && !showGuarded && (
            <div style={{ marginTop: 8, padding: "4px 8px", background: "#1c0a0a", border: "1px solid #ef4444", borderRadius: 4, fontSize: 8, color: "#ef4444" }}>
              🔮 Predicted: CC01 PRB overflow in T+8min · HO Fail 8.2% at T+12min
            </div>
          )}
          {showGuarded && (
            <div style={{ marginTop: 8, padding: "4px 8px", background: "#052e16", border: "1px solid #22c55e", borderRadius: 4, fontSize: 8, color: "#22c55e" }}>
              ✅ MLB pre-activated at T+5min — PRB guarded &lt;80% · HO Fail &lt;1.5%
            </div>
          )}
        </div>
      </div>

      {showTwin && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 8, color: "#334155" }}>NOW</span>
          <div style={{ flex: 1, height: 2, background: "linear-gradient(to right, #1e3a5f, #ef4444)" }} />
          <span style={{ fontSize: 8, color: "#ef4444" }}>T+30min (predicted)</span>
          {showGuarded && <span style={{ fontSize: 8, color: "#22c55e" }}>→ MLB pre-empts at T+5min</span>}
        </div>
      )}
    </div>
  );
}

function ScenarioViz({ scenario, stepIndex }) {
  const totalSteps = scenario.steps.length;
  const progress   = stepIndex < 0 ? 0 : (stepIndex + 1) / totalSteps;

  if (scenario.chartType === "ric") {
    const data = scenario.getChartData(progress);
    return <RICSteeringViz data={data} stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "bar") {
    const data = scenario.getChartData(progress);
    return <BarViz data={data} keys={["PRB %"]} indexBy="cell" scenario={scenario} />;
  }
  if (scenario.chartType === "digitaltwin") {
    const data = scenario.getChartData(progress);
    return <DigitalTwinViz data={data} stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "airrm") {
    const data = scenario.getChartData(progress);
    return <AIRRMViz data={data} stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "rca") {
    const data = scenario.getChartData(progress);
    return <AnomalyRCAViz data={data} stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "line") {
    const data = scenario.getChartData(progress);
    return <LineViz data={data} scenario={scenario} />;
  }
  if (scenario.chartType === "dss") {
    return <DSSFrameViz stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "heatmap") {
    const data = scenario.getChartData(progress);
    return <HeatMapViz data={data} />;
  }
  if (scenario.chartType === "ztp") {
    return <ZTPArchitectureViz stepIndex={stepIndex} scenario={scenario} />;
  }
  if (scenario.chartType === "ntn") {
    const chartData = scenario.getChartData(progress);
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
        <div style={{ flexShrink: 0 }}>
          <NTNOrbit3D progress={progress} stepIndex={stepIndex} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <LineViz data={chartData} scenario={scenario} />
        </div>
      </div>
    );
  }
  if (scenario.chartType === "isac") {
    const chartData = scenario.getChartData(progress);
    return <ISACViz data={chartData} stepIndex={stepIndex} />;
  }
  if (scenario.chartType === "capex") {
    const chartData = scenario.getChartData(progress);
    return <CAPEXViz data={chartData} stepIndex={stepIndex} />;
  }
  if (scenario.chartType === "urllc") {
    const chartData = scenario.getChartData(progress);
    return <URLLCViz data={chartData} stepIndex={stepIndex} />;
  }
  if (scenario.chartType === "microwave") {
    const chartData = scenario.getChartData(progress);
    return <MicrowaveViz data={chartData} stepIndex={stepIndex} />;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569", fontSize: 13 }}>
      Select a scenario and press Run to begin
    </div>
  );
}
// ─── Right Panel Sub-components ───────────────────────────────────────────────

function SimLogPanel({ simLog }) {
  const endRef = useRef(null);
  // Auto-scroll on new entries
  if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  if (simLog.length === 0) {
    return <div style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>No events yet. Run a simulation to begin.</div>;
  }
  return (
    <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      {simLog.map((ev, i) => (
        <div key={i} style={{ borderLeft: "2px solid #1e3a5f", paddingLeft: 10, paddingBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>{ev.ts}</span>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.8, padding: "1px 5px", borderRadius: 3, background: "#0f1f3d", color: "#60a5fa", border: "1px solid #1e3a5f" }}>{ev.phase}</span>
            <span style={{ fontSize: 9, color: "#64748b" }}>{ev.system}</span>
          </div>
          <div style={{ fontSize: 10, color: "#e2e8f0", fontWeight: 500, marginBottom: 2 }}>{ev.action}</div>
          <div style={{ fontSize: 9, color: "#64748b" }}>{ev.detail}</div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function MetricsPanel({ scenario, stepIndex, totalSteps }) {
  const showAfter = stepIndex >= Math.floor(totalSteps * 0.5);
  const met = scenario.metrics;
  if (!met) return null;
  return (
    <div style={{ padding: "8px 12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textAlign: "center" }}>BEFORE</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textAlign: "center" }}>AFTER</div>
      </div>
      {met.before.map((m, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 4 }}>
          <div style={{ background: "#0a1628", borderRadius: 5, padding: "4px 8px" }}>
            <div style={{ fontSize: 8, color: "#475569", marginBottom: 1 }}>{m.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
          </div>
          <div style={{ background: "#0a1628", borderRadius: 5, padding: "4px 8px", opacity: showAfter ? 1 : 0.3, transition: "opacity 0.5s" }}>
            <div style={{ fontSize: 8, color: "#475569", marginBottom: 1 }}>{met.after[i]?.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: showAfter ? met.after[i]?.color : "#475569", fontFamily: "monospace" }}>
              {showAfter ? met.after[i]?.value : "—"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpecRefsPanel({ scenario }) {
  return (
    <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {scenario.specs.map((spec, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0a1628", borderRadius: 5, padding: "6px 10px" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "#0f1f3d", color: "#60a5fa", border: "1px solid #1e3a5f", whiteSpace: "nowrap" }}>SPEC</span>
          <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{spec}</span>
        </div>
      ))}
    </div>
  );
}

function CLIPanel({ scenario, stepIndex }) {
  const step = stepIndex >= 0 ? scenario.steps[stepIndex] : null;
  if (!step) {
    return <div style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>CLI output will appear as simulation progresses.</div>;
  }
  return (
    <div style={{ padding: "8px 12px" }}>
      <div style={{ marginBottom: 6, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "#0f1f3d", color: "#60a5fa", border: "1px solid #1e3a5f", fontWeight: 700 }}>{step.phase}</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>{step.system}</span>
      </div>
      <pre style={{ margin: 0, fontSize: 9.5, color: "#86efac", background: "#020c08", border: "1px solid #134e2a", borderRadius: 6, padding: "10px 12px", overflowX: "auto", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {step.cli}
      </pre>
    </div>
  );
}

function CausalChainPanel({ scenario, stepIndex }) {
  const visibleSteps = stepIndex >= 0 ? scenario.steps.slice(0, stepIndex + 1) : [];
  if (visibleSteps.length === 0) {
    return <div style={{ padding: "12px 16px", fontSize: 11, color: "#475569" }}>Causal chain will build as simulation runs.</div>;
  }
  return (
    <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
      {visibleSteps.map((step, i) => (
        <div key={i} style={{ position: "relative", paddingLeft: 20 }}>
          {i < visibleSteps.length - 1 && (
            <div style={{ position: "absolute", left: 7, top: 18, bottom: -6, width: 1, background: "#1e3a5f" }} />
          )}
          <div style={{ position: "absolute", left: 2, top: 4, width: 12, height: 12, borderRadius: "50%", background: "#0f1f3d", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
          </div>
          <div style={{ fontSize: 8, color: "#475569", marginBottom: 2, fontWeight: 700 }}>{step.phase}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{step.causal}</div>
        </div>
      ))}
    </div>
  );
}
// ─── Main ORANTab Component ────────────────────────────────────────────────────
export default function ORANTab() {
  const [activeScenarioId, setActiveScenarioId] = useState("sim01-ric");
  const [runState, setRunState]   = useState("idle"); // idle | running | done
  const [stepIndex, setStepIndex] = useState(-1);
  const [simLog, setSimLog]       = useState([]);
  const [simSpeed, setSimSpeed]   = useState(1);
  const [leftCollapsed, setLeftCollapsed]   = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [whatifValues, setWhatifValues]     = useState({});
  const [helpOpen, setHelpOpen]             = useState(false);
  const cancelRef = useRef(false);

  const scenario = ORAN_SCENARIOS.find((s) => s.id === activeScenarioId) || ORAN_SCENARIOS[0];

  const runSim = useCallback(() => {
    if (runState === "running") return;
    cancelRef.current = false;
    setRunState("running");
    setStepIndex(-1);
    setSimLog([]);
    let idx = 0;
    const runStep = () => {
      if (cancelRef.current) { setRunState("idle"); return; }
      if (idx >= scenario.steps.length) { setRunState("done"); return; }
      const step = scenario.steps[idx];
      setStepIndex(idx);
      setSimLog((prev) => [
        ...prev,
        {
          ts:     new Date().toLocaleTimeString("en-US", { hour12: false }),
          phase:  step.phase,
          action: step.action,
          system: step.system,
          detail: step.detail,
        },
      ]);
      idx++;
      setTimeout(runStep, (step.duration || 2500) / simSpeed);
    };
    runStep();
  }, [runState, scenario, simSpeed]);

  const resetSim = useCallback(() => {
    cancelRef.current = true;
    setRunState("idle");
    setStepIndex(-1);
    setSimLog([]);
  }, []);

  const selectScenario = useCallback((id) => {
    cancelRef.current = true;
    setRunState("idle");
    setStepIndex(-1);
    setSimLog([]);
    setActiveScenarioId(id);
  }, []);

  const totalSteps = scenario.steps.length;
  const runPct = stepIndex < 0 ? 0 : ((stepIndex + 1) / totalSteps) * 100;

  const statusText =
    runState === "idle"    ? "READY — Press ▶ RUN to start simulation" :
    runState === "running" ? `RUNNING — Phase ${stepIndex + 1} / ${totalSteps}: ${scenario.steps[stepIndex]?.phase || ""}` :
                             "✅ SIMULATION COMPLETE";
  const statusColor =
    runState === "idle" ? "#475569" : runState === "running" ? "#60a5fa" : "#22c55e";

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "var(--bg-root)" }}>

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
        <div style={{
          width: leftCollapsed ? 0 : 240,
          overflow: "hidden",
          transition: "width 0.25s ease",
          background: "var(--bg-primary)",
          borderRight: leftCollapsed ? "none" : "1px solid var(--border-primary)",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.8, marginBottom: 2 }}>🔭 O-RAN PLANNING</div>
            <div style={{ fontSize: 9, color: "#475569" }}>Open RAN · 3GPP · ITU-T</div>
          </div>

          {/* Scenario list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            <div style={{ fontSize: 8, color: "#475569", fontWeight: 700, letterSpacing: 0.8, marginBottom: 6, paddingLeft: 4 }}>SELECT SCENARIO</div>
            {ORAN_SCENARIOS.map((sc) => {
              const active = sc.id === activeScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => selectScenario(sc.id)}
                  style={{
                    borderLeft: `3px solid ${active ? sc.color : "#1e3a5f"}`,
                    background: active ? "#0f1f3d" : "transparent",
                    borderRadius: "0 6px 6px 0",
                    padding: "8px 10px",
                    marginBottom: 4,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 14 }}>{sc.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#e2e8f0" : "#94a3b8", lineHeight: 1.3 }}>{sc.title}</span>
                  </div>
                  <div style={{ fontSize: 8, color: active ? "#64748b" : "#334155", paddingLeft: 22 }}>{sc.subtitle}</div>
                  <div style={{ paddingLeft: 22, marginTop: 3 }}>
                    <span style={{ fontSize: 7, padding: "1px 5px", borderRadius: 3,
                      background: sc.difficulty === "Advanced" ? "#1c0a2e" : sc.difficulty === "Intermediate" ? "#0f1f3d" : "#052e16",
                      color:      sc.difficulty === "Advanced" ? "#a78bfa"  : sc.difficulty === "Intermediate" ? "#60a5fa"  : "#22c55e",
                      border:     `1px solid ${sc.difficulty === "Advanced" ? "#4c1d95" : sc.difficulty === "Intermediate" ? "#1e3a5f" : "#134e2a"}`,
                    }}>{sc.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* What-If sliders */}
          {scenario.whatif && scenario.whatif.length > 0 && (
            <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
              <div style={{ fontSize: 8, color: "#475569", fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>⚙️ WHAT-IF PARAMETERS</div>
              {scenario.whatif.map((wi) => {
                const val = whatifValues[wi.id] ?? wi.default;
                return (
                  <div key={wi.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: "#94a3b8" }}>{wi.label}</span>
                      <span style={{ fontSize: 9, color: "#60a5fa", fontWeight: 700, fontFamily: "monospace" }}>{val}</span>
                    </div>
                    <input type="range" min={wi.min} max={wi.max} value={val}
                      onChange={(e) => setWhatifValues((prev) => ({ ...prev, [wi.id]: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: scenario.color }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Help Panel */}
          <div style={{ borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
            <button
              onClick={() => setHelpOpen(o => !o)}
              style={{ width: "100%", padding: "8px 12px", background: "transparent", border: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#60a5fa", letterSpacing: 0.8 }}>❓ HOW TO USE</span>
              <span style={{ fontSize: 9, color: "#475569" }}>{helpOpen ? "▲" : "▼"}</span>
            </button>
            {helpOpen && (
              <div style={{ padding: "0 12px 10px", maxHeight: 340, overflowY: "auto" }}>

                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.7, marginBottom: 8 }}>
                  Each simulation walks through a multi-phase O-RAN workflow.
                  Press <strong style={{ color: "#22c55e" }}>▶ RUN</strong> to start,{" "}
                  <strong style={{ color: "#60a5fa" }}>RESET</strong> to restart. Use the{" "}
                  <strong style={{ color: "#f59e0b" }}>Speed</strong> slider to step faster.
                </div>

                {/* Scenario directory */}
                {[
                  { id: "SIM-01", icon: "🔀", title: "RIC Traffic Steering",        desc: "Closed-loop MLB xApp offloads overloaded cells via E2/A1 interfaces. Watch PRB load balance in real-time." },
                  { id: "SIM-02", icon: "🧠", title: "AI-Driven RRM Scheduler",     desc: "GNN-based proportional-fair scheduler learns UE spatial patterns and improves aggregate throughput vs static RR." },
                  { id: "SIM-03", icon: "📡", title: "DSS + CBRS Spectrum",         desc: "Dynamic LTE/NR spectrum sharing with CBRS SAS coordination. Animated subband utilisation heatmap." },
                  { id: "SIM-04", icon: "⚡", title: "O-RU Energy Benchmarking",    desc: "M-Plane NETCONF deep-sleep activation during low-traffic hours. 32% power saving confirmed via PM collector." },
                  { id: "SIM-05", icon: "🛰️", title: "NTN LEO Handover",           desc: "3D LEO satellite arc over Earth. Doppler pre-compensation + 18ms N26 inter-sat handover with zero service gap." },
                  { id: "SIM-06", icon: "🤖", title: "Zero-Touch Provisioning",     desc: "SMO intent → NETCONF edit-config → gNB activation. Animated state machine from Factory to IN-SERVICE." },
                  { id: "SIM-07", icon: "🔍", title: "Anomaly Detection & RCA",     desc: "Bayesian root cause inference links SINR drop → HO failures → user complaints. Causal chain animation." },
                  { id: "SIM-08", icon: "🪞", title: "Digital Twin RAN",            desc: "Shadow-mode twin ingests live KPIs. What-If: change tilt/azimuth in the twin, preview SINR before applying." },
                  { id: "SIM-09", icon: "📡", title: "ISAC Sensing",                desc: "5G NR waveform repurposed as radar. Range-Doppler heatmap reveals 3 targets (pedestrian, cyclist, vehicle)." },
                  { id: "SIM-10", icon: "💰", title: "CAPEX/ROI Site Planner",      desc: "NPV/IRR/payback scoring for 5 candidate sites. Animated cashflow waterfall for the winning site." },
                  { id: "SIM-11", icon: "🏭", title: "IIoT/URLLC Reliability",     desc: "P99.999 latency CDF compares QPSK baseline vs NR URLLC. SLA badge panel tracks breach/met status." },
                  { id: "SIM-12", icon: "📶", title: "Microwave Backhaul ACM",      desc: "RSSL fade timeline drives ACM fallback: 256QAM → 64QAM → QPSK → FEC_ONLY and auto-recovery." },
                ].map(sc => (
                  <div key={sc.id} style={{ marginBottom: 8, paddingBottom: 8,
                    borderBottom: "1px solid #0f1a2e" }}>
                    <div style={{ display: "flex", gap: 5, alignItems: "baseline", marginBottom: 2 }}>
                      <span style={{ fontSize: 10 }}>{sc.icon}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "#60a5fa" }}>{sc.id}</span>
                      <span style={{ fontSize: 8, color: "#94a3b8", fontWeight: 600 }}>{sc.title}</span>
                    </div>
                    <div style={{ fontSize: 8, color: "#475569", lineHeight: 1.5, paddingLeft: 16 }}>{sc.desc}</div>
                  </div>
                ))}

                <div style={{ marginTop: 6, padding: "6px 8px", background: "#0a1628",
                  borderRadius: 4, border: "1px solid #1e3a5f" }}>
                  <div style={{ fontSize: 8, color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>RIGHT PANEL TABS</div>
                  {[
                    ["📋 Sim Log", "Live step-by-step event feed as the simulation runs"],
                    ["📊 Metrics", "Before/after KPI comparison with colour-coded delta"],
                    ["📐 Specs",   "3GPP / O-RAN / ITU-T specification references per step"],
                    ["💻 CLI",     "Vendor-accurate CLI/API config output per phase"],
                    ["🔗 Causal",  "Root-cause chain: what caused what and why it matters"],
                  ].map(([tab, desc]) => (
                    <div key={tab} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: "#94a3b8", minWidth: 60, fontWeight: 600 }}>{tab}</span>
                      <span style={{ fontSize: 8, color: "#475569" }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Speed */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, color: "#475569" }}>Speed:</span>
              <input type="range" min={0.5} max={3} step={0.5} value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#60a5fa" }} />
              <span style={{ fontSize: 9, color: "#60a5fa", minWidth: 24 }}>{simSpeed}x</span>
            </div>
          </div>
        </div>

        {/* Left collapse toggle */}
        <button
          onClick={() => setLeftCollapsed((c) => !c)}
          style={{
            position: "absolute", right: -13, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-accent)",
            borderRadius: "0 6px 6px 0", width: 13, height: 48, cursor: "pointer",
            color: "#60a5fa", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}
        >{leftCollapsed ? "▶" : "◀"}</button>
      </div>

      {/* ── CENTER STAGE ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Scenario header bar */}
        <div style={{ padding: "8px 16px", background: "var(--bg-primary)", borderBottom: "1px solid var(--border-primary)", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>{scenario.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{scenario.title}</div>
            <div style={{ fontSize: 9, color: "#64748b" }}>{scenario.subtitle} · {scenario.description.substring(0, 90)}...</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#0a1628", border: "1px solid #1e3a5f", color: "#64748b", fontFamily: "monospace" }}>
            {scenario.specs[0]}
          </div>
        </div>

        {/* Phase progress bar */}
        <div style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <PhaseProgressBar scenario={scenario} stepIndex={stepIndex} />
          {/* Overall progress bar */}
          <div style={{ margin: "0 16px 8px", background: "#0a1628", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ width: `${runPct}%`, height: "100%", background: runState === "done" ? "#22c55e" : "#3b82f6", borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
        </div>

        {/* Main chart area */}
        <div style={{ flex: 1, minHeight: 0, padding: scenario.chartType === "ztp" ? "12px 8px 8px" : "12px 16px 8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {runState === "idle" && stepIndex < 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#334155" }}>
              <span style={{ fontSize: 56 }}>{scenario.icon}</span>
              <div style={{ fontSize: 16, color: "#475569", fontWeight: 500 }}>{scenario.title}</div>
              <div style={{ fontSize: 11, color: "#334155", textAlign: "center", maxWidth: 480, lineHeight: 1.6 }}>{scenario.description}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {scenario.specs.map((s) => (
                  <span key={s} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: "#0a1628", border: "1px solid #1e3a5f", color: "#60a5fa", fontFamily: "monospace" }}>{s}</span>
                ))}
              </div>
              <button
                onClick={runSim}
                style={{ padding: "10px 32px", borderRadius: 8, background: "#0f1f3d", border: `2px solid ${scenario.color}`, color: scenario.color, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5 }}
              >▶ RUN SIMULATION</button>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ScenarioViz scenario={scenario} stepIndex={stepIndex} />
            </div>
          )}
        </div>

        {/* Control bar */}
        <div style={{
          padding: "8px 16px", background: "var(--bg-primary)", borderTop: "1px solid var(--border-primary)",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <button
            onClick={runState === "running" ? null : runSim}
            disabled={runState === "running"}
            style={{
              padding: "6px 20px", borderRadius: 6, cursor: runState === "running" ? "default" : "pointer",
              background: runState === "running" ? "#0f1f3d" : "#0a1f0a",
              border: `1px solid ${runState === "running" ? "#1e3a5f" : "#22c55e"}`,
              color: runState === "running" ? "#1e3a5f" : "#22c55e",
              fontSize: 11, fontWeight: 700,
            }}
          >{runState === "running" ? "⏳ RUNNING..." : "▶ RUN"}</button>

          <button
            onClick={resetSim}
            style={{
              padding: "6px 16px", borderRadius: 6, cursor: "pointer",
              background: "transparent", border: "1px solid var(--border-primary)",
              color: "var(--text-muted)", fontSize: 11,
            }}
          >↺ RESET</button>

          <div style={{ flex: 1, fontSize: 10, color: statusColor, fontFamily: "monospace" }}>{statusText}</div>

          {runState !== "idle" && (
            <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
              Step {Math.max(0, stepIndex + 1)}/{totalSteps}  ·  {runPct.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
        {/* Right collapse toggle */}
        <button
          onClick={() => setRightCollapsed((c) => !c)}
          style={{
            position: "absolute", left: -13, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, background: "var(--bg-secondary)", border: "1px solid var(--border-accent)",
            borderRadius: "6px 0 0 6px", width: 13, height: 48, cursor: "pointer",
            color: "#60a5fa", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}
        >{rightCollapsed ? "◀" : "▶"}</button>

        <div style={{
          width: rightCollapsed ? 0 : 310,
          overflow: "hidden",
          transition: "width 0.25s ease",
          background: "var(--bg-primary)",
          borderLeft: rightCollapsed ? "none" : "1px solid var(--border-primary)",
          display: "flex", flexDirection: "column",
          overflowY: rightCollapsed ? "hidden" : "auto",
          gap: 0,
        }}>
          <CollapsiblePanel title="SIMULATION LOG" icon="📋" defaultOpen={true} badge={String(simLog.length)} badgeColor="#60a5fa" badgeBg="#0f1f3d">
            <SimLogPanel simLog={simLog} />
          </CollapsiblePanel>

          <CollapsiblePanel title="BEFORE / AFTER METRICS" icon="📊" defaultOpen={true}>
            <MetricsPanel scenario={scenario} stepIndex={stepIndex} totalSteps={totalSteps} />
          </CollapsiblePanel>

          <CollapsiblePanel title="3GPP / O-RAN SPEC REFS" icon="📚" defaultOpen={false}>
            <SpecRefsPanel scenario={scenario} />
          </CollapsiblePanel>

          <CollapsiblePanel title="VENDOR CLI OUTPUT" icon="💻" defaultOpen={true} badge={stepIndex >= 0 ? scenario.steps[stepIndex]?.phase : null} badgeColor="#60a5fa" badgeBg="#0f1f3d">
            <CLIPanel scenario={scenario} stepIndex={stepIndex} />
          </CollapsiblePanel>

          <CollapsiblePanel title="CAUSAL CHAIN" icon="🔗" defaultOpen={false}>
            <CausalChainPanel scenario={scenario} stepIndex={stepIndex} />
          </CollapsiblePanel>
        </div>
      </div>
    </div>
  );
}