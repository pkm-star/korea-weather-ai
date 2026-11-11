import type { CityWeather, LevelValue } from "@/types/weather";
import { heroGradient, levelDotClass } from "@/lib/weather-style";
import WeatherIcon from "@/components/weather/WeatherIcon";

function formatObserved(iso: string) {
  const d = new Date(`${iso}:00Z`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${days[d.getUTCDay()]}) ${h < 12 ? "오전" : "오후"} ${h % 12 || 12}:${m} 기준`;
}

export default function CurrentHero({ weather }: { weather: CityWeather }) {
  const { location, current, offer, summary } = weather;
  const chips: { name: string; grade: LevelValue }[] = [
    ...(offer.fineDust ? [{ name: "미세먼지", grade: offer.fineDust }] : []),
    ...(offer.ultraFineDust ? [{ name: "초미세먼지", grade: offer.ultraFineDust }] : []),
    { name: "자외선", grade: offer.uv },
  ];

  return (
    <section
      className="relative overflow-hidden text-white transition-[background] duration-700"
      style={{ background: heroGradient(current.condition, current.isDay) }}
    >
      {/* 은은한 빛 번짐 */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1160px] px-5 pb-8 pt-8 sm:px-8 sm:pt-10">
        <div className="flex items-center gap-1.5 text-sm text-white/80">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
          </svg>
          <span>{location.region}</span>
          <span className="text-white/40">·</span>
          <span>{formatObserved(current.observedAt)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{location.name}</h1>
            <div className="mt-2 flex items-start gap-1">
              <span className="text-[88px] font-light leading-none tracking-tighter tabular-nums sm:text-[112px]">
                {current.temp}
              </span>
              <span className="mt-3 text-4xl font-light text-white/80 sm:text-5xl">°</span>
            </div>
            <p className="mt-2 text-xl font-medium">{current.description}</p>
            <p className="mt-1 text-sm text-white/80 tabular-nums">
              최고 {current.tempMax}° <span className="text-white/40">/</span> 최저 {current.tempMin}°
              <span className="mx-2 text-white/40">|</span>
              체감 {current.feelsLike}°
            </p>
          </div>

          <WeatherIcon
            condition={current.condition}
            isDay={current.isDay}
            title={current.description}
            className="h-28 w-28 shrink-0 drop-shadow-[0_12px_30px_rgba(0,0,0,0.25)] sm:h-48 sm:w-48"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-md ring-1 ring-white/20">
            <span aria-hidden>💡</span>
            {summary}
          </p>
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li
                key={c.name}
                className="flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-xs backdrop-blur-md ring-1 ring-white/15"
              >
                <span className={`h-2 w-2 rounded-full ${levelDotClass(c.grade.level)}`} aria-hidden />
                <span className="text-white/75">{c.name}</span>
                <span className="font-semibold">{c.grade.label}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-xs backdrop-blur-md ring-1 ring-white/15">
              <span className="text-white/75">일몰</span>
              <span className="font-semibold tabular-nums">{offer.sunset}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
