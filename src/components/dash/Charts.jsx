/* ------------------------------------------------------------------
   Dependency-free SVG charts. Everything is drawn from plain arrays so
   the same components work once real data replaces the dummy sets.
   ------------------------------------------------------------------ */

/** Cardinal-spline smoothing — gives the soft wave used on the stat cards. */
function smoothPath(coords, tension = 0.35) {
  if (coords.length < 2) return "";

  let d = `M ${coords[0][0]} ${coords[0][1]}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const previous = coords[i - 1] || coords[i];
    const current = coords[i];
    const next = coords[i + 1];
    const after = coords[i + 2] || next;

    const cp1x = current[0] + ((next[0] - previous[0]) / 6) * tension * 2;
    const cp1y = current[1] + ((next[1] - previous[1]) / 6) * tension * 2;
    const cp2x = next[0] - ((after[0] - current[0]) / 6) * tension * 2;
    const cp2y = next[1] - ((after[1] - current[1]) / 6) * tension * 2;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next[0]} ${next[1]}`;
  }

  return d;
}

function scale(points, width, height, pad = 4) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  return points.map((value, index) => [
    index * step,
    pad + (1 - (value - min) / span) * (height - pad * 2),
  ]);
}

export function Sparkline({ points = [], color = "#7c3aed", className = "", height = 54 }) {
  if (points.length === 0) return null;
  const coords = scale(points, 300, height);

  return (
    <svg
      className={`chart ${className}`.trim()}
      viewBox={`0 0 300 ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden="true"
    >
      <path
        d={smoothPath(coords)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Area chart with gridlines, dots and an x-axis. Used for revenue and
 * attendance trends.
 */
export function AreaChart({
  points = [],
  labels = [],
  color = "#7c3aed",
  height = 220,
  formatY = (value) => value,
  dots = true,
}) {
  if (points.length === 0) return null;

  const width = 640;
  const padLeft = 46;
  const padBottom = 26;
  const padTop = 10;
  const plotW = width - padLeft - 10;
  const plotH = height - padBottom - padTop;

  const max = Math.max(...points);
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const step = points.length > 1 ? plotW / (points.length - 1) : plotW;

  const coords = points.map((value, index) => [
    padLeft + index * step,
    padTop + (1 - value / niceMax) * plotH,
  ]);

  const line = smoothPath(coords, 0.3);
  const area = `${line} L ${coords[coords.length - 1][0]} ${padTop + plotH} L ${coords[0][0]} ${
    padTop + plotH
  } Z`;

  const ticks = [0, 1, 2, 3, 4].map((index) => (niceMax / 4) * index);
  const gradientId = `area-${color.replace("#", "")}`;

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} style={{ height }} role="img">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const y = padTop + (1 - tick / niceMax) * plotH;
        return (
          <g key={tick}>
            <line x1={padLeft} y1={y} x2={width - 10} y2={y} stroke="#ece9f5" strokeWidth="1" />
            <text className="chart__axis" x={padLeft - 10} y={y + 4} textAnchor="end">
              {formatY(tick)}
            </text>
          </g>
        );
      })}

      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

      {dots
        ? coords.map((coord, index) => (
            <circle key={index} cx={coord[0]} cy={coord[1]} r="3" fill={color} />
          ))
        : null}

      {labels.map((label, index) => {
        if (!label) return null;
        return (
          <text
            key={label + index}
            className="chart__axis"
            x={padLeft + index * step}
            y={height - 6}
            textAnchor="middle"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/** Donut with a centred total. `segments` is [{ label, value, color }]. */
export function Donut({ segments = [], size = 170, thickness = 22, centre }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute each arc's length and running start so nothing is reassigned
  // mid-render.
  let running = 0;
  const arcs = segments.map((segment) => {
    const length = (segment.value / total) * circumference;
    const arc = { ...segment, length, offset: running };
    running += length;
    return arc;
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
            />
          ))}
        </g>
      </svg>
      {centre ? (
        <div
          className="donut__centre"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
          }}
        >
          <strong>{centre.value}</strong>
          <span>{centre.label}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Vertical bars — used for weekly attendance and report views. */
export function BarChart({ data = [], color = "#7c3aed", height = 200, formatY = (v) => v }) {
  if (data.length === 0) return null;

  const width = 640;
  const padLeft = 40;
  const padBottom = 26;
  const padTop = 10;
  const plotW = width - padLeft - 10;
  const plotH = height - padBottom - padTop;

  const max = Math.max(...data.map((item) => item.value));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const slot = plotW / data.length;
  const barW = Math.min(38, slot * 0.5);

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} style={{ height }} role="img">
      {[0, 1, 2, 3, 4].map((index) => {
        const tick = (niceMax / 4) * index;
        const y = padTop + (1 - tick / niceMax) * plotH;
        return (
          <g key={tick}>
            <line x1={padLeft} y1={y} x2={width - 10} y2={y} stroke="#ece9f5" strokeWidth="1" />
            <text className="chart__axis" x={padLeft - 9} y={y + 4} textAnchor="end">
              {formatY(tick)}
            </text>
          </g>
        );
      })}

      {data.map((item, index) => {
        const barH = (item.value / niceMax) * plotH;
        const x = padLeft + slot * index + (slot - barW) / 2;
        const y = padTop + plotH - barH;
        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 2)}
              rx="6"
              fill={item.color || color}
            />
            <text
              className="chart__axis"
              x={x + barW / 2}
              y={height - 6}
              textAnchor="middle"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal ranked bars — compact enough for side panels. */
export function RankBars({ data = [], color = "#7c3aed", format = (v) => v }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <ul style={{ display: "grid", gap: 14 }}>
      {data.map((item) => (
        <li key={item.label}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 13.5,
              marginBottom: 6,
            }}
          >
            <span className="muted">{item.label}</span>
            <strong>{format(item.value)}</strong>
          </div>
          <div className="dbar">
            <span
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color || color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
