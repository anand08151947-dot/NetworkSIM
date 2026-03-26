/**
 * Scenes3D.jsx — Phase 3 React Three Fiber flagship 3D visualisations
 * Three scenarios: NTN LEO Orbit | Massive MIMO Beamforming | Urban Ray Tracing
 * Uses @react-three/fiber v9 + @react-three/drei v10 + three.js v0.18x
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";

const DARK_BG = "#020812";

// ─── Shared loading fallback ──────────────────────────────────────────────────
function CanvasLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", color: "#334155", fontSize: 11, fontFamily: "monospace" }}>
      Initialising 3D renderer…
    </div>
  );
}

// ─── NTN LEO ORBIT 3D ────────────────────────────────────────────────────────
const NTN_INCL = 53 * Math.PI / 180; // 53° inclination
const NTN_R    = 2.6;                 // orbital radius (Earth = 1 unit)

function satPos(progress) {
  // Arc from entry (-35°) to exit (165°) along orbital ellipse
  const angle = (-35 + progress * 200) * Math.PI / 180;
  return [
    NTN_R * Math.cos(angle),
    NTN_R * Math.sin(NTN_INCL) * Math.sin(angle),
    NTN_R * Math.cos(NTN_INCL) * Math.sin(angle),
  ];
}

// Three ground stations on Earth surface at lngs -55°, 0°, 55°, lat ~0°
const GND = [-55, 0, 55].map(lng => {
  const l = lng * Math.PI / 180;
  return [Math.cos(l) * 1.02, 0.12, Math.sin(l) * 1.02];
});

function EarthSphere() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });

  // Lat-line points built once
  const latLines = useMemo(() =>
    [-60, -30, 0, 30, 60].map(lat => {
      const cosL = Math.cos(lat * Math.PI / 180);
      const sinL = Math.sin(lat * Math.PI / 180);
      return Array.from({ length: 65 }, (_, i) => {
        const lng = (i / 64) * Math.PI * 2;
        return [cosL * Math.cos(lng), sinL, cosL * Math.sin(lng)];
      });
    }), []);

  // Orbital ring
  const ringPts = useMemo(() =>
    Array.from({ length: 101 }, (_, i) => {
      const a = (i / 100) * Math.PI * 2;
      return [NTN_R * Math.cos(a), NTN_R * Math.sin(NTN_INCL) * Math.sin(a), NTN_R * Math.cos(NTN_INCL) * Math.sin(a)];
    }), []);

  return (
    <>
      {/* Orbital path */}
      <Line points={ringPts} color="#1e3a5f" lineWidth={1} />
      <group ref={ref}>
        {/* Ocean */}
        <mesh>
          <sphereGeometry args={[1, 48, 48]} />
          <meshPhongMaterial color={0x1a4d8c} emissive={0x050e20} specular={0x3b82f6} shininess={50} />
        </mesh>
        {/* Atmosphere halo */}
        <mesh>
          <sphereGeometry args={[1.08, 32, 32]} />
          <meshPhongMaterial color={0x3b82f6} transparent opacity={0.06} side={THREE.BackSide} />
        </mesh>
        {/* Lat grid lines */}
        {latLines.map((pts, i) => (
          <Line key={i} points={pts} color="#1e3a5f" lineWidth={0.5} transparent opacity={0.4} />
        ))}
        {/* Cloud blobs */}
        {[[30, 1, 0.3], [-20, 0.7, 1.1], [50, 0.9, -0.8], [-50, 1.2, 0.4]].map(([lat, lng, _], i) => {
          const cosL = Math.cos(lat * Math.PI / 180);
          const sinL = Math.sin(lat * Math.PI / 180);
          return (
            <mesh key={i} position={[cosL * Math.cos(lng) * 1.01, sinL * 1.01, cosL * Math.sin(lng) * 1.01]}>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshPhongMaterial color={0xdbeafe} transparent opacity={0.13} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}

function NTNScene({ progress, stepIndex }) {
  const handover = progress > 0.62;
  const [sx, sy, sz] = satPos(progress);
  const activeGnd = handover ? GND[2] : GND[1];

  return (
    <>
      <ambientLight intensity={0.35} color={0x334155} />
      <directionalLight position={[6, 8, 5]} intensity={0.9} />
      <pointLight position={[sx, sy, sz]} intensity={0.7} color={handover ? 0xf59e0b : 0x60a5fa} distance={3} />

      <EarthSphere />

      {/* Satellite body */}
      <group position={[sx, sy, sz]}>
        <mesh>
          <boxGeometry args={[0.09, 0.07, 0.12]} />
          <meshPhongMaterial color={0x94a3b8} shininess={100} specular={0xffffff} />
        </mesh>
        {/* Solar panels */}
        {[-1, 1].map(side => (
          <mesh key={side} position={[side * 0.24, 0, 0]}>
            <boxGeometry args={[0.3, 0.025, 0.1]} />
            <meshPhongMaterial color={0x1a3a6c} emissive={0x0d2040} />
          </mesh>
        ))}
        <pointLight color={handover ? 0xf59e0b : 0x3b82f6} intensity={0.9} distance={0.9} />
        {/* HO label */}
        {handover && (
          <Html center position={[0, 0.25, 0]} style={{ pointerEvents: "none" }}>
            <div style={{ background: "#7c2d12cc", border: "1px solid #f59e0b", borderRadius: 3,
              padding: "2px 6px", fontSize: 8, color: "#fbbf24", fontFamily: "monospace", whiteSpace: "nowrap" }}>
              ⚡ HO EXECUTING
            </div>
          </Html>
        )}
      </group>

      {/* Signal beam */}
      <Line
        points={[[sx, sy, sz], activeGnd]}
        color={handover ? "#f59e0b" : "#3b82f6"}
        lineWidth={2.5}
        transparent opacity={0.88}
      />
      {/* Secondary dim beam to old GND during HO */}
      {handover && (
        <Line points={[[sx, sy, sz], GND[1]]} color="#94a3b8" lineWidth={1} transparent opacity={0.25} />
      )}

      {/* Ground stations */}
      {GND.map(([gx, gy, gz], i) => {
        const active = (!handover && i === 1) || (handover && i === 2);
        return (
          <group key={i} position={[gx, gy, gz]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.045, 0.1, 8]} />
              <meshPhongMaterial
                color={active ? 0x3b82f6 : 0x1e3a5f}
                emissive={active ? 0x1a3a6c : 0x000000}
                emissiveIntensity={0.9}
              />
            </mesh>
            {active && <pointLight color={0x3b82f6} intensity={0.5} distance={0.6} />}
            <Html center distanceFactor={5} style={{ pointerEvents: "none" }}>
              <div style={{ color: active ? "#60a5fa" : "#475569", fontSize: 7,
                fontFamily: "monospace", whiteSpace: "nowrap" }}>gNB-{i + 1}</div>
            </Html>
          </group>
        );
      })}

      {/* HUD overlay */}
      <Html position={[-4, 3.2, 0]} style={{ pointerEvents: "none" }}>
        <div style={{ background: "#050e20cc", border: "1px solid #1e3a5f", borderRadius: 4,
          padding: "5px 9px", fontSize: 8.5, color: "#94a3b8", fontFamily: "monospace", whiteSpace: "nowrap", lineHeight: 1.6 }}>
          <div>ALT: 550 km · INCL: 53° · SPD: 7.6 km/s</div>
          <div>Doppler: {(progress * 28.5).toFixed(1)} kHz shift</div>
          {stepIndex >= 2 && <div style={{ color: "#60a5fa" }}>✓ Doppler pre-compensation active</div>}
        </div>
      </Html>

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.3} maxPolarAngle={2.8} />
    </>
  );
}

export function NTNOrbit3D({ progress, stepIndex }) {
  return (
    <div style={{ width: "100%", height: 230, background: DARK_BG, borderRadius: 6, overflow: "hidden" }}>
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [0, 2.5, 7.5], fov: 38 }} dpr={[1, 2]}>
          <NTNScene progress={progress} stepIndex={stepIndex} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ─── MASSIVE MIMO 3D BEAM ────────────────────────────────────────────────────

function MIMOScene({ progress, color = "#3b82f6" }) {
  const halfAngleRad = (0.55 - progress * 0.46) ; // radians: widens→narrows
  const beamLen = 3.8;
  const beamRadius = beamLen * Math.tan(halfAngleRad);
  const gainDbi = (21 + progress * 6).toFixed(1);
  const rank = Math.round(1 + progress * 7);
  const nullSteering = progress > 0.5;

  // 4×4 antenna element positions
  const antennas = useMemo(() => {
    const N = 4, sp = 0.18;
    return Array.from({ length: N }, (_, r) =>
      Array.from({ length: N }, (_, c) => [(c - N / 2 + 0.5) * sp, 0, (r - N / 2 + 0.5) * sp])
    ).flat();
  }, []);

  // Null direction at azimuth 145°, elevation 40°
  const nullAz = 145 * Math.PI / 180;
  const nullEl = 40 * Math.PI / 180;
  const nullEnd = [Math.sin(nullAz) * Math.cos(nullEl) * 2.5, Math.sin(nullEl) * 2.5, Math.cos(nullAz) * Math.cos(nullEl) * 2.5];

  // Sidelobe positions (blobs at azimuth ±60°, ±120°, elevated ~35°)
  const sidelobes = useMemo(() =>
    [60, -60, 120, -120].map(az => {
      const a = az * Math.PI / 180;
      return [Math.sin(a) * 1.1, 0.8, Math.cos(a) * 1.1];
    }), []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 7, 4]} intensity={0.8} />
      <pointLight position={[0, 4, 0]} intensity={0.4} color={color} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshPhongMaterial color={0x020e1f} transparent opacity={0.9} />
      </mesh>
      {/* Ground grid */}
      {[-2, -1, 0, 1, 2].map(v => (
        <Line key={`gx${v}`} points={[[v, 0, -2.5], [v, 0, 2.5]]} color="#0a1628" lineWidth={0.5} />
      ))}
      {[-2, -1, 0, 1, 2].map(v => (
        <Line key={`gz${v}`} points={[[-2.5, 0, v], [2.5, 0, v]]} color="#0a1628" lineWidth={0.5} />
      ))}

      {/* Antenna elements */}
      {antennas.map(([ax, ay, az], i) => (
        <group key={i} position={[ax, ay, az]}>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.11, 8]} />
            <meshPhongMaterial color={0x60a5fa} emissive={0x1a3a8c} emissiveIntensity={0.7} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.032, 0.007, 0.032]} />
            <meshPhongMaterial color={0x334155} />
          </mesh>
        </group>
      ))}

      {/* Main beam cone (apex at array, base at beamLen) */}
      <mesh position={[0, beamLen / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[beamRadius, beamLen, 36, 1, true]} />
        <meshPhongMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Beam edge wireframe */}
      <mesh position={[0, beamLen / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[beamRadius, beamLen, 10, 1, true]} />
        <meshPhongMaterial color={color} transparent opacity={0.12} wireframe />
      </mesh>
      {/* Beam boresight axis */}
      <Line points={[[0, 0, 0], [0, beamLen + 0.3, 0]]} color={color} lineWidth={1.5} transparent opacity={0.6} />

      {/* Sidelobe blobs */}
      {sidelobes.map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshPhongMaterial color={color} transparent opacity={0.1} />
        </mesh>
      ))}

      {/* Null direction */}
      {nullSteering && (
        <>
          <Line points={[[0, 0, 0], nullEnd]} color="#ef4444" lineWidth={1.5} dashed dashSize={0.12} gapSize={0.07} />
          <mesh position={nullEnd}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshPhongMaterial color={0xef4444} emissive={0xef4444} emissiveIntensity={0.6} />
          </mesh>
          <Html position={nullEnd} center style={{ pointerEvents: "none" }}>
            <div style={{ background: "#1a0000cc", border: "1px solid #ef4444", borderRadius: 3,
              padding: "2px 6px", fontSize: 7.5, color: "#f87171", fontFamily: "monospace", whiteSpace: "nowrap", marginLeft: 12 }}>
              NULL −35 dB · 145°
            </div>
          </Html>
        </>
      )}

      {/* Gain label at beam tip */}
      <Html position={[0, beamLen + 0.6, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ background: "#050e20cc", border: `1px solid ${color}`, borderRadius: 4,
          padding: "3px 8px", fontSize: 8.5, color, fontFamily: "monospace", whiteSpace: "nowrap" }}>
          {gainDbi} dBi · Rank-{rank} · HPBW {(55 - progress * 47).toFixed(0)}°
        </div>
      </Html>

      {/* Array label */}
      <Html position={[0, -0.3, 0]} center style={{ pointerEvents: "none" }}>
        <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>64T64R · 4×4 sub-array</div>
      </Html>

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.05} maxPolarAngle={Math.PI * 0.82} />
    </>
  );
}

export function MIMOBeam3D({ progress, color }) {
  return (
    <div style={{ width: "100%", height: "100%", background: DARK_BG, borderRadius: 6, overflow: "hidden" }}>
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [3.5, 3, 3.5], fov: 44 }} dpr={[1, 2]}>
          <MIMOScene progress={progress} color={color} />
        </Canvas>
      </Suspense>
    </div>
  );
}

// ─── URBAN RAY TRACING 3D ────────────────────────────────────────────────────
// Buildings: [x, z, width, depth, height]
const BLDGS = [
  [-1.6, -1.3, 0.85, 0.95, 1.9], [0.2,  -1.1, 0.75, 0.85, 2.3],
  [ 1.9, -1.2, 0.95, 0.85, 1.6], [-2.1,  0.5, 0.75, 1.05, 2.9],
  [ 1.6,  0.9, 1.05, 0.95, 1.3], [-0.3,  1.6, 0.85, 0.85, 2.1],
  [ 2.3,  1.9, 0.65, 0.75, 1.7],
];
// TX site positions [x, z]
const TX = [[-2.6, -2.1], [0, -2.6], [2.6, -2.1]];
// Ray directions per TX (18 rays, every 20°)
const RAY_DIRS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
});

function RayTraceScene({ progress, stepIndex, color = "#06b6d4" }) {
  const showRays  = stepIndex >= 1;
  const showSINR  = stepIndex >= 3;
  const rayAlpha  = Math.min(progress * 2.2, 0.75);
  const sinrRings = [
    { r: 3.8, inner: 2.8, c: "#22c55e", label: ">20 dB" },
    { r: 2.8, inner: 1.8, c: "#fbbf24", label: "10–20 dB" },
    { r: 1.8, inner: 0.9, c: "#3b82f6",  label: "0–10 dB" },
    { r: 0.9, inner: 0,   c: "#a855f7",  label: "<0 dB" },
  ];

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[6, 10, 4]} intensity={0.85} />
      <pointLight position={[0, 5, 0]} intensity={0.2} color={0x3b82f6} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshPhongMaterial color={0x020812} transparent opacity={0.95} />
      </mesh>

      {/* Street grid */}
      {[-3, -2, -1, 0, 1, 2, 3].map(v => (
        <Line key={`gs${v}`} points={[[v, 0.01, -4], [v, 0.01, 4]]} color="#0a1628" lineWidth={0.4} />
      ))}
      {[-3, -2, -1, 0, 1, 2, 3].map(v => (
        <Line key={`gz${v}`} points={[[-4, 0.01, v], [4, 0.01, v]]} color="#0a1628" lineWidth={0.4} />
      ))}

      {/* SINR heatmap rings on ground */}
      {showSINR && sinrRings.map(({ r, inner, c }, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[inner, r, 64]} />
          <meshBasicMaterial color={c} transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Buildings */}
      {BLDGS.map(([bx, bz, bw, bd, bh], i) => (
        <group key={i} position={[bx, bh / 2, bz]}>
          <mesh>
            <boxGeometry args={[bw, bh, bd]} />
            <meshPhongMaterial color={0x1e3a5f} emissive={0x0a1a30} specular={0x3b82f6} shininess={25} transparent opacity={0.88} />
          </mesh>
          {/* Rooftop edge */}
          <mesh position={[0, bh / 2 + 0.01, 0]}>
            <boxGeometry args={[bw, 0.02, bd]} />
            <meshBasicMaterial color={0x1e3a5f} />
          </mesh>
          {/* Window lights */}
          {[[-bw / 2 + 0.1, 0], [bw / 2 - 0.1, 0]].map(([wx, wz], wi) => (
            <mesh key={wi} position={[wx, 0, 0]}>
              <boxGeometry args={[0.05, bh * 0.6, bd + 0.01]} />
              <meshBasicMaterial color={0x1e3a5f} transparent opacity={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* TX towers + rays */}
      {TX.map(([tx, tz], si) => (
        <group key={si}>
          {/* Tower */}
          <mesh position={[tx, 0.55, tz]}>
            <cylinderGeometry args={[0.04, 0.06, 1.1, 8]} />
            <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.35} />
          </mesh>
          <pointLight color={color} intensity={0.6} distance={2.5} position={[tx, 1.2, tz]} />
          <Html center position={[tx, 1.6, tz]} style={{ pointerEvents: "none" }}>
            <div style={{ color, fontSize: 7, fontFamily: "monospace", whiteSpace: "nowrap" }}>TX{si + 1}</div>
          </Html>

          {/* Rays */}
          {showRays && RAY_DIRS.map(([rdx, rdz], ri) => {
            const len = 5.5 * Math.min(rayAlpha * 1.2, 1);
            return (
              <Line
                key={ri}
                points={[[tx, 1.0, tz], [tx + rdx * len, 0.15, tz + rdz * len]]}
                color={color}
                lineWidth={0.6}
                transparent
                opacity={0.18 + rayAlpha * 0.28}
              />
            );
          })}
        </group>
      ))}

      {/* SINR legend */}
      {showSINR && (
        <Html position={[4.5, 3.5, -4]} style={{ pointerEvents: "none" }}>
          <div style={{ background: "#050e20cc", border: "1px solid #1e3a5f", borderRadius: 4,
            padding: "5px 8px", fontSize: 8, fontFamily: "monospace", lineHeight: 1.8 }}>
            {sinrRings.map(({ c, label }) => (
              <div key={label}><span style={{ color: c }}>■</span> {label}</div>
            ))}
          </div>
        </Html>
      )}

      {/* Status HUD */}
      <Html position={[-5, 4, -4]} style={{ pointerEvents: "none" }}>
        <div style={{ background: "#050e20cc", border: "1px solid #1e3a5f", borderRadius: 4,
          padding: "5px 9px", fontSize: 8.5, color: "#94a3b8", fontFamily: "monospace", whiteSpace: "nowrap", lineHeight: 1.6 }}>
          {stepIndex >= 5 ? "SE: 5.4 b/s/Hz · Coverage: 94.1%"
            : stepIndex >= 3 ? "SINR map: 18,400 grid pts"
            : showRays ? "50K rays · multipath clustering"
            : "Loading urban geometry…"}
        </div>
      </Html>

      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.2} maxPolarAngle={1.8} />
    </>
  );
}

export function RayTrace3D({ progress, stepIndex, color }) {
  return (
    <div style={{ width: "100%", height: "100%", background: DARK_BG, borderRadius: 6, overflow: "hidden" }}>
      <Suspense fallback={<CanvasLoader />}>
        <Canvas camera={{ position: [6, 6, 6], fov: 46 }} dpr={[1, 2]}>
          <RayTraceScene progress={progress} stepIndex={stepIndex} color={color} />
        </Canvas>
      </Suspense>
    </div>
  );
}
