import type { CityWeather } from "@/types/weather";
import WeatherIcon from "@/components/weather/WeatherIcon";

interface CityListProps {
  cities: CityWeather[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CityList({ cities, activeId, onSelect }: CityListProps) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">전국 날씨</h2>
      <ul className="-mx-2 flex flex-col">
        {cities.map((c) => {
          const active = c.location.id === activeId;
          return (
            <li key={c.location.id}>
              <button
                type="button"
                onClick={() => onSelect(c.location.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-500/10"
                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <WeatherIcon condition={c.current.condition} isDay={c.current.isDay} className="h-8 w-8 shrink-0" />
                <span className="flex-1">
                  <span className={`block text-sm ${active ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium text-slate-800 dark:text-slate-100"}`}>
                    {c.location.name}
                  </span>
                  <span className="block text-xs text-slate-400">{c.current.description}</span>
                </span>
                <span className="text-xs text-slate-400 tabular-nums">
                  {c.current.tempMin}° / {c.current.tempMax}°
                </span>
                <span className="w-10 text-right text-lg font-bold text-slate-900 tabular-nums dark:text-white">
                  {c.current.temp}°
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
