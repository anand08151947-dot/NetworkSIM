import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

// ── SimRecorder ─────────────────────────────────────────────────
// Props:
//   targetRef   — ref to the root app div (captures full dashboard)
//   running     — bool: true while a simulation is active
//   activeSimId — string: sim ID used in filename

const FRAME_MS = 250; // 4 fps

export default function SimRecorder({ targetRef, running, activeSimId }) {
  // Core state
  const [status, setStatus]       = useState(null); // null | "armed" | "recording" | "encoding" | "ready"
  const [fmt, setFmt]             = useState(null);  // "webm" | "gif"
  const [frameCount, setFrameCount] = useState(0);
  const [progress, setProgress]   = useState(0);
  const [showMenu, setShowMenu]   = useState(false);

  // Download state
  const [dlUrl, setDlUrl]   = useState(null);
  const [dlName, setDlName] = useState("");
  const [dlType, setDlType] = useState("");

  // Refs
  const framesRef   = useRef([]);
  const chunksRef   = useRef([]);
  const canvasRef   = useRef(null);
  const recorderRef = useRef(null);
  const intervalRef = useRef(null);
  const fmtRef      = useRef(null);
  const simIdRef    = useRef(activeSimId);
  const prevRunning = useRef(running);

  useEffect(() => { simIdRef.current = activeSimId; }, [activeSimId]);

  // ── Helpers ─────────────────────────────────────────────────
  const clearDl = useCallback(() => {
    if (dlUrl && dlType === "webm") URL.revokeObjectURL(dlUrl);
    setDlUrl(null); setDlName(""); setDlType("");
  }, [dlUrl, dlType]);

  const captureFrame = useCallback(async () => {
    const el = targetRef?.current;
    if (!el) return null;
    try {
      return await toPng(el, { pixelRatio: 1, skipFonts: true, cacheBust: false });
    } catch { return null; }
  }, [targetRef]);

  const drawToCanvas = useCallback((dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }, []);

  // ── Core start ──────────────────────────────────────────────
  const startRecording = useCallback(async (format) => {
    const el = targetRef?.current;
    if (!el) return;
    clearDl();
    fmtRef.current = format;
    framesRef.current = [];
    chunksRef.current = [];
    setFrameCount(0);
    setStatus("recording");
    setShowMenu(false);

    if (format === "webm") {
      const canvas = document.createElement("canvas");
      canvas.width  = el.offsetWidth;
      canvas.height = el.offsetHeight;
      canvasRef.current = canvas;

      // prime canvas with first frame
      const first = await captureFrame();
      if (first) drawToCanvas(first);

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9" : "video/webm";
      const rec = new MediaRecorder(canvas.captureStream(15), { mimeType: mime });
      rec.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url  = URL.createObjectURL(blob);
        const name = `northstar-${simIdRef.current || "sim"}-${Date.now()}.webm`;
        setDlUrl(url); setDlName(name); setDlType("webm");
        setStatus("ready"); setProgress(0);
      };
      rec.start(200);
      recorderRef.current = rec;
    }

    let n = 0;
    intervalRef.current = setInterval(async () => {
      const frame = await captureFrame();
      if (!frame) return;
      framesRef.current.push(frame);
      n++;
      setFrameCount(n);
      if (format === "webm") drawToCanvas(frame);
    }, FRAME_MS);
  }, [captureFrame, clearDl, drawToCanvas, targetRef]);

  // ── Stop & encode ────────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    clearInterval(intervalRef.current);
    setStatus("encoding");
    const format = fmtRef.current;
    const frames = framesRef.current;

    if (format === "webm") {
      if (recorderRef.current?.state !== "inactive") recorderRef.current.stop();
      return; // onstop → ready
    }

    if (format === "gif") {
      if (frames.length === 0) { setStatus(null); return; }
      setProgress(0);
      try {
        const gifshot = (await import("gifshot")).default;
        const el = targetRef?.current;
        gifshot.createGIF(
          {
            images: frames,
            gifWidth:  Math.round(el?.offsetWidth  || 1400),
            gifHeight: Math.round(el?.offsetHeight || 900),
            interval: FRAME_MS / 1000,
            numWorkers: 2,
            sampleInterval: 6,
            progressCallback: (p) => setProgress(Math.round(p * 100)),
          },
          ({ error, image, errorCode }) => {
            if (error) { console.error("GIF error:", errorCode); setStatus(null); return; }
            const name = `northstar-${simIdRef.current || "sim"}-${Date.now()}.gif`;
            setDlUrl(image); setDlName(name); setDlType("gif");
            setStatus("ready"); setProgress(0);
          }
        );
      } catch (e) { console.error("GIF failed:", e); setStatus(null); }
    }
  }, [targetRef]);

  // ── ARM: auto-start when sim begins ─────────────────────────
  useEffect(() => {
    // Sim just started (false → true) and recorder is armed
    if (running && !prevRunning.current && status === "armed") {
      startRecording(fmt);
    }
    // Sim ended while recording
    if (!running && prevRunning.current && status === "recording") {
      stopRecording();
    }
    prevRunning.current = running;
  }, [running, status, fmt, startRecording, stopRecording]);

  // ── ARM without starting yet ─────────────────────────────────
  const armRecorder = useCallback((format) => {
    clearDl();
    setFmt(format);
    fmtRef.current = format;
    setStatus("armed");
    setShowMenu(false);
  }, [clearDl]);

  // ── Cancel ARM ───────────────────────────────────────────────
  const cancelArm = useCallback(() => {
    setStatus(null);
    setFmt(null);
  }, []);

  // ── Derived display ──────────────────────────────────────────
  const isRecording = status === "recording";
  const isArmed     = status === "armed";
  const isEncoding  = status === "encoding";
  const isReady     = status === "ready";

  const btnBg     = isRecording ? "#1a0000" : isArmed ? "#1a0d00" : isEncoding ? "#1a1000" : isReady ? "#002210" : "transparent";
  const btnBorder = isRecording ? "#ef4444" : isArmed ? "#f97316" : isEncoding ? "#f59e0b" : isReady ? "#22c55e" : "var(--border-subtle)";
  const btnColor  = isRecording ? "#ef4444" : isArmed ? "#fb923c" : isEncoding ? "#f59e0b" : isReady ? "#22c55e" : "#64748b";

  const btnLabel = isRecording
    ? `⏺ REC  ${frameCount}f`
    : isArmed
    ? `🎯 ARMED · ${fmt?.toUpperCase()}`
    : isEncoding
    ? `⏳ ${fmtRef.current === "gif" ? `GIF ${progress}%` : "Encoding…"}`
    : "🎬 Record";

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>

      {/* ── Main button ── */}
      <button
        disabled={isEncoding}
        onClick={() => {
          if (isRecording) { stopRecording(); return; }
          if (isArmed)     { cancelArm();     return; }
          if (!isEncoding) { setShowMenu(m => !m); }
        }}
        style={{
          background: btnBg, border: `1px solid ${btnBorder}`, borderRadius: 6,
          padding: "4px 10px", cursor: isEncoding ? "not-allowed" : "pointer",
          fontSize: 10, color: btnColor, fontWeight: (isRecording || isArmed) ? 700 : 400,
          animation: (isRecording || isArmed) ? "pulse 1.4s infinite" : "none",
          whiteSpace: "nowrap", transition: "all 0.2s",
        }}
        title={isArmed ? "Click to cancel ARM — recording will auto-start when sim runs" : isRecording ? "Click to stop recording" : "Record simulation"}
      >
        {btnLabel}
      </button>

      {/* ── Download button ── */}
      {isReady && dlUrl && (
        <>
          <a
            href={dlUrl}
            download={dlName}
            onClick={() => setTimeout(() => { clearDl(); setStatus(null); }, 5000)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#002d1a", border: "1px solid #22c55e",
              borderRadius: 6, padding: "4px 10px",
              fontSize: 10, color: "#4ade80", fontWeight: 700,
              textDecoration: "none", whiteSpace: "nowrap",
              animation: "pulse 1.5s infinite", cursor: "pointer",
            }}
          >
            ⬇️ Download {dlType.toUpperCase()}
          </a>
          <button
            onClick={() => { clearDl(); setStatus(null); }}
            title="Discard"
            style={{ background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: 6, padding: "4px 6px", cursor: "pointer", fontSize: 10, color: "var(--text-muted)" }}
          >✕</button>
        </>
      )}

      {/* ── Format / ARM dropdown ── */}
      {showMenu && !isRecording && !isEncoding && (
        <div style={{
          position: "absolute", top: "110%", right: 0, zIndex: 200,
          background: "var(--bg-secondary)", border: "1px solid var(--border-accent)",
          borderRadius: 10, overflow: "hidden",
          boxShadow: "0 8px 28px #00000090", minWidth: 220,
        }}>
          {/* ── Start Now section ── */}
          <div style={{ padding: "6px 12px 4px", fontSize: 9, color: "var(--text-muted)", letterSpacing: 0.5, fontWeight: 700 }}>
            START RECORDING NOW
          </div>
          {[
            { f: "webm", icon: "🎥", label: "WebM Video",     sub: "Full dashboard · VP9 · Chrome/Edge" },
            { f: "gif",  icon: "🎞️", label: "Animated GIF",   sub: "Full dashboard · Shareable · Slack" },
          ].map(({ f, icon, label, sub }) => (
            <button key={f} onClick={() => startRecording(f)}
              style={{ width: "100%", background: "transparent", border: "none", padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{label}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{sub}</div>
              </div>
            </button>
          ))}

          {/* ── Divider ── */}
          <div style={{ borderTop: "1px solid var(--border-primary)", margin: "4px 0" }} />

          {/* ── ARM section ── */}
          <div style={{ padding: "4px 12px 4px", fontSize: 9, color: "#f97316", letterSpacing: 0.5, fontWeight: 700 }}>
            🎯 AUTO-START WITH SIMULATION
          </div>
          <div style={{ padding: "2px 12px 6px", fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>
            Pick a format below, then click a simulation. Recording starts <em style={{ color: "#fb923c" }}>automatically</em> the moment the sim begins — no lag.
          </div>
          {[
            { f: "webm", icon: "🎥", label: "ARM → WebM",    color: "#60a5fa" },
            { f: "gif",  icon: "🎞️", label: "ARM → GIF",     color: "#a78bfa" },
          ].map(({ f, icon, label, color }) => (
            <button key={`arm-${f}`} onClick={() => armRecorder(f)}
              style={{ width: "100%", background: "transparent", border: "none", padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "#1a0d00"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>Click sim → recording fires instantly</div>
              </div>
            </button>
          ))}

          <div style={{ padding: "6px 12px", fontSize: 8, color: "var(--border-subtle)", borderTop: "1px solid var(--border-primary)" }}>
            Captures full dashboard · all panels · auto-stops when sim ends
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
