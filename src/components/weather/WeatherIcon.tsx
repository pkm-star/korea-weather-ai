import type { WeatherCondition } from "@/types/weather";

interface WeatherIconProps {
  condition: WeatherCondition;
  isDay?: boolean;
  className?: string;
  title?: string;
}

const SUN = "#FFC53D";
const SUN_RAY = "#FFB020";
const MOON = "#FDE68A";
const CLOUD = "#EEF2F7";
const CLOUD_SHADE = "#CBD5E1";
const DARK_CLOUD = "#94A3B8";
const RAIN = "#3B9BF5";
const BOLT = "#FACC15";

function Sun({ cx = 32, cy = 32, r = 11 }: { cx?: number; cy?: number; r?: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const inner = r + 4;
    const outer = r + 9;
    return (
      <line
        key={i}
        x1={cx + Math.cos(a) * inner}
        y1={cy + Math.sin(a) * inner}
        x2={cx + Math.cos(a) * outer}
        y2={cy + Math.sin(a) * outer}
        stroke={SUN_RAY}
        strokeWidth={3}
        strokeLinecap="round"
      />
    );
  });
  return (
    <g>
      {rays}
      <circle cx={cx} cy={cy} r={r} fill={SUN} />
    </g>
  );
}

function Moon({ cx = 32, cy = 30 }: { cx?: number; cy?: number }) {
  return (
    <path
      d={`M${cx + 6} ${cy - 15} a15 15 0 1 0 10 24 a12 12 0 1 1 -10 -24z`}
      fill={MOON}
    />
  );
}

function Cloud({ dark = false, y = 0 }: { dark?: boolean; y?: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path
        d="M18 50h30a10 10 0 0 0 1.5-19.9A14 14 0 0 0 22.4 27 11.5 11.5 0 0 0 18 50z"
        fill={dark ? DARK_CLOUD : CLOUD}
        stroke={dark ? "#64748B" : "#B8C4D4"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M18 50h30a10 10 0 0 0 9.6-7.2A10 10 0 0 1 48 47H19a11.5 11.5 0 0 1-10.4-6.6A11.5 11.5 0 0 0 18 50z"
        fill={dark ? "#64748B" : CLOUD_SHADE}
      />
    </g>
  );
}

function Drops({ count = 3, snow = false }: { count?: number; snow?: boolean }) {
  const xs = count === 2 ? [26, 38] : [22, 32, 42];
  return (
    <g>
      {xs.map((x, i) =>
        snow ? (
          <circle key={x} cx={x - 2} cy={53 + (i % 2) * 4} r={2.6} fill="#E0F2FE" stroke="#93C5FD" strokeWidth={1} />
        ) : (
          <line
            key={x}
            x1={x}
            y1={49 + (i % 2) * 3}
            x2={x - 3}
            y2={56 + (i % 2) * 3}
            stroke={RAIN}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )
      )}
    </g>
  );
}

export default function WeatherIcon({
  condition,
  isDay = true,
  className = "h-10 w-10",
  title,
}: WeatherIconProps) {
  const celestial = isDay ? <Sun cx={24} cy={24} r={9} /> : <Moon cx={22} cy={22} />;

  let content: React.ReactNode;
  switch (condition) {
    case "clear":
      content = isDay ? <Sun /> : <Moon cx={30} cy={32} />;
      break;
    case "partlyCloudy":
      content = (
        <>
          {celestial}
          <Cloud y={4} />
        </>
      );
      break;
    case "clouds":
      content = (
        <>
          <g transform="translate(10 -8) scale(0.8)" opacity={0.9}>
            <Cloud dark />
          </g>
          <Cloud y={2} />
        </>
      );
      break;
    case "fog":
      content = (
        <>
          <Cloud y={-6} />
          {[48, 54, 60].map((y, i) => (
            <line key={y} x1={12 + i * 3} y1={y} x2={52 - i * 2} y2={y} stroke={CLOUD_SHADE} strokeWidth={3} strokeLinecap="round" />
          ))}
        </>
      );
      break;
    case "drizzle":
      content = (
        <>
          <Cloud y={-6} />
          <Drops count={2} />
        </>
      );
      break;
    case "rain":
      content = (
        <>
          <Cloud dark y={-6} />
          <Drops />
        </>
      );
      break;
    case "snow":
      content = (
        <>
          <Cloud y={-6} />
          <Drops snow />
        </>
      );
      break;
    case "thunder":
      content = (
        <>
          <Cloud dark y={-8} />
          <path d="M33 44l-7 11h6l-3 9 10-13h-6l4-7z" fill={BOLT} />
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
}
