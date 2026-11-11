import type { CityWeather, LevelValue } from "@/types/weather";
import { levelBadgeClass } from "@/lib/weather-style";

function Badge({ grade }: { grade: LevelValue }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelBadgeClass(grade.level)}`}>
      {grade.label}
    </span>
  );
}

function Tile({
  title,
  value,
  unit,
  sub,
  badge,
}: {
  title: string;
  value: string | number;
  unit?: string;
  sub?: string;
  badge?: LevelValue;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {badge && <Badge grade={badge} />}
      </div>
      <div>
        <span className="text-2xl font-bold text-slate-900 tabular-nums dark:text-white">{value}</span>
        {unit && <span className="ml-0.5 text-sm text-slate-500 dark:text-slate-400">{unit}</span>}
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function DetailGrid({ weather }: { weather: CityWeather }) {
  const { current, offer } = weather;
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">오늘의 상세 정보</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <Tile
          title="미세먼지"
          value={offer.fineDust?.value ?? "-"}
          unit={offer.fineDust ? "㎍/㎥" : undefined}
          badge={offer.fineDust ?? undefined}
        />
        <Tile
          title="초미세먼지"
          value={offer.ultraFineDust?.value ?? "-"}
          unit={offer.ultraFineDust ? "㎍/㎥" : undefined}
          badge={offer.ultraFineDust ?? undefined}
        />
        <Tile title="체감온도" value={`${current.feelsLike}°`} sub={`실제 ${current.temp}°`} />
        <Tile title="습도" value={current.humidity} unit="%" sub={`불쾌지수 ${offer.discomfort.value} · ${offer.discomfort.label}`} />
        <Tile title="바람" value={current.windSpeed} unit="m/s" sub={current.windDirection} />
        <Tile title="자외선 (최대)" value={offer.uv.value} badge={offer.uv} />
        <Tile title="일출" value={offer.sunrise} />
        <Tile title="일몰" value={offer.sunset} />
      </div>
    </section>
  );
}
