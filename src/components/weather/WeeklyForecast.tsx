import type { DailyForecastItem } from "@/types/weather";
import WeatherIcon from "@/components/weather/WeatherIcon";

export default function WeeklyForecast({ items }: { items: DailyForecastItem[] }) {
  const weekMin = Math.min(...items.map((d) => d.tempMin));
  const weekMax = Math.max(...items.map((d) => d.tempMax));
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">주간 예보</h2>
        <span className="text-xs text-slate-400">{items.length}일 · 최저/최고 기온</span>
      </div>

      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {items.map((d) => {
          const left = ((d.tempMin - weekMin) / span) * 100;
          const width = Math.max(((d.tempMax - d.tempMin) / span) * 100, 4);
          const dayColor =
            d.isWeekend === "sun"
              ? "text-rose-500"
              : d.isWeekend === "sat"
                ? "text-blue-500"
                : "text-slate-900 dark:text-white";
          return (
            <li
              key={d.date}
              className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3 sm:grid-cols-[84px_140px_40px_1fr_36px]"
            >
              <div className="flex flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2">
                <span className={`text-sm font-bold ${dayColor}`}>{d.day}</span>
                <span className="text-xs text-slate-400 tabular-nums">{d.dateLabel}</span>
              </div>

              <div className="flex items-center gap-2">
                <WeatherIcon condition={d.condition} className="h-8 w-8 shrink-0" title={d.description} />
                <span className="hidden truncate text-sm text-slate-600 sm:inline dark:text-slate-300">{d.description}</span>
                <span
                  className={`text-xs tabular-nums sm:hidden ${
                    d.precipitation >= 30 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-400"
                  }`}
                >
                  {d.precipitation}%
                </span>
              </div>

              <span
                className={`hidden text-right text-xs tabular-nums sm:block ${
                  d.precipitation >= 30 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-400"
                }`}
              >
                {d.precipitation}%
              </span>

              {/* 모바일: 숫자만 / 데스크톱: 범위 막대 */}
              <span className="text-right text-sm tabular-nums sm:hidden">
                <span className="text-blue-500">{d.tempMin}°</span>
                <span className="text-slate-300"> / </span>
                <span className="font-semibold text-rose-500">{d.tempMax}°</span>
              </span>

              <div className="hidden items-center gap-3 sm:flex">
                <span className="w-8 text-right text-sm text-blue-500 tabular-nums">{d.tempMin}°</span>
                <div className="relative h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-300 to-rose-400"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
              </div>
              <span className="hidden text-sm font-semibold text-rose-500 tabular-nums sm:block">{d.tempMax}°</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
