import { getSmoothStepPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';

// Animated traffic edge — dots flow along the path proportional to utilization
export default function TrafficEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, data, markerEnd,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const color = style.stroke || '#60a5fa';
  const width = style.strokeWidth || 2;
  const utilization = data?.utilization || 20;
  // Speed: higher utilization = faster dots (lower duration)
  const dur = Math.max(0.8, 3.5 - (utilization / 100) * 2.5);
  const dots = utilization > 60 ? 4 : utilization > 30 ? 3 : 2;

  return (
    <>
      {/* Base edge path */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: color, strokeWidth: width, opacity: 0.7 }} />

      {/* Animated traffic dots */}
      {Array.from({ length: dots }, (_, i) => (
        <circle key={i} r={utilization > 60 ? 4 : 3} fill={color} opacity={0.9}>
          <animateMotion
            dur={`${dur}s`}
            begin={`${(i / dots) * dur}s`}
            repeatCount="indefinite"
          >
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      ))}

      {/* Hidden path for animateMotion mpath reference */}
      <path id={id} d={edgePath} fill="none" stroke="none" />

      {/* Utilization label */}
      {data?.showLabel && (
        <EdgeLabelRenderer>
          <div style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#0f172a',
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: 9,
            color,
            fontWeight: 700,
            pointerEvents: 'none',
          }}>
            {utilization}%
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
