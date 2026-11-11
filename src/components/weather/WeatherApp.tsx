"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { CityWeather } from "@/types/weather";
import CurrentHero from "@/components/weather/CurrentHero";
import HourlyForecast from "@/components/weather/HourlyForecast";
import WeeklyForecast from "@/components/weather/WeeklyForecast";
import DetailGrid from "@/components/weather/DetailGrid";
import CityList from "@/components/weather/CityList";
import ChatWidget from "@/components/chat/ChatWidget";

interface WeatherAppProps {
  cities: CityWeather[];
  initialCityId: string;
  authSlot?: ReactNode;
}

export default function WeatherApp({ cities, initialCityId, authSlot }: WeatherAppProps) {
  const [activeId, setActiveId] = useState(initialCityId);
  const weather = cities.find((c) => c.location.id === activeId) ?? cities[0];

  function selectCity(id: string) {
    setActiveId(id);
    // 새로고침·공유 시에도 같은 지역이 보이도록 주소에 반영 (페이지 이동 없이)
    const url = new URL(window.location.href);
    url.searchParams.set("city", id);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-[1160px] items-center gap-4 px-5 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="홈">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 shadow-sm shadow-blue-500/30">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white" aria-hidden>
                <circle cx="9" cy="9" r="4" fill="#FDE68A" />
                <path d="M8 19h9a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.5 1A3 3 0 0 0 8 19z" />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">날씨</span>
          </Link>

          <nav aria-label="지역 선택" className="min-w-0 flex-1">
            <ul className="flex gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {cities.map((c) => {
                const active = c.location.id === weather.location.id;
                return (
                  <li key={c.location.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => selectCity(c.location.id)}
                      aria-pressed={active}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
                        active
                          ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                      }`}
                    >
                      {c.location.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="shrink-0">{authSlot}</div>
        </div>
      </header>

      <CurrentHero weather={weather} />

      <div className="mx-auto grid w-full max-w-[1160px] flex-1 grid-cols-1 gap-4 px-4 py-5 sm:px-8 sm:py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="flex min-w-0 flex-col gap-4">
          <HourlyForecast key={weather.location.id} items={weather.hourly} />
          <WeeklyForecast items={weather.daily} />
        </main>
        <aside className="flex flex-col gap-4">
          <DetailGrid weather={weather} />
          <CityList cities={cities} activeId={weather.location.id} onSelect={selectCity} />
        </aside>
      </div>

      <footer className="border-t border-slate-200 px-5 py-6 text-center text-xs leading-relaxed text-slate-400 dark:border-white/10">
        <p>
          날씨 데이터{" "}
          <a className="underline-offset-2 hover:underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{" "}
          (CC BY 4.0) · 10분마다 갱신
        </p>
        <p>미세먼지는 모델 추정값으로 측정소 실측과 다를 수 있습니다</p>
      </footer>

      <ChatWidget cityId={weather.location.id} cityName={weather.location.name} />
    </div>
  );
}
