"use client";

import { useState } from "react";
import type { HourlyForecastItem } from "@/types/weather";
import WeatherIcon from "@/components/weather/WeatherIcon";

const COL = 64; // 한 시간 칸 너비(px)
const CHART_H = 56; // 선 그래프 높이
const PAD_TOP = 24; // 기온 라벨 공간
const PAD_BOTTOM = 10;

export default function HourlyForecast({ items }: { items: HourlyForecastItem[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const temps = items.map((i) => i.temp);
  const max = Math.max(...temps);
  const min = Math.min(...temps);
  const range = Math.max(max - min, 1);
  const width = items.length * COL;
  const svgH = CHART_H + PAD_TOP + PAD_BOTTOM;

  const points = items.map((item, i) => ({
    x: i * COL + COL / 2,
    y: PAD_TOP + (1 - (item.temp - min) / range) * CHART_H,
  }));

  // 부드러운 곡선 (Catmull-Rom → Bezier)
  const linePath = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const p0 = arr[i - 2] ?? arr[i - 1];
    const p1 = arr[i - 1];
    const p3 = arr[i + 1] ?? p;
    const c1x = p1.x + (p.x - p0.x) / 6;
    const c1y = p1.y + (p.y - p0.y) / 6;
    const c2x = p.x - (p3.x - p1.x) / 6;
    const c2y = p.y - (p3.y - p1.y) / 6;
    return `${acc} C${c1x} ${c1y} ${c2x} ${c2y} ${p.x} ${p.y}`;
  }, "");
  const areaPath = `${linePath} L${points.at(-1)!.x} ${svgH} L${points[0].x} ${svgH} Z`;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">시간별 예보</h2>
        <span className="text-xs text-slate-400">24시간 · 기온과 강수확률</span>
      </div>

      <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:thin]">
        <div className="relative" style={{ width }} onMouseLeave={() => setHovered(null)}>
          {/* 호버 강조 칸 */}
          {hovered !== null && (
            <div
              className="pointer-events-none absolute inset-y-0 rounded-2xl bg-sky-50 dark:bg-white/5"
              style={{ left: hovered * COL + 2, width: COL - 4 }}
            />
          )}

          {/* 시각 + 아이콘 */}
          <div className="relative flex">
            {items.map((item, i) => (
              <div
                key={item.time}
                className="flex flex-col items-center gap-1 pt-2"
                style={{ width: COL }}
                onMouseEnter={() => setHovered(i)}
              >
                <span
                  className={`text-xs ${
                    i === 0 || item.label === "내일"
                      ? "font-bold text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
                <WeatherIcon condition={item.condition} isDay={item.isDay} className="h-9 w-9" />
              </div>
            ))}
          </div>

          {/* 기온 곡선 */}
          <svg width={width} height={svgH} className="relative block overflow-visible" aria-hidden>
            <defs>
              <linearGradient id="hourly-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#hourly-area)" />
            <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={items[i].time}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hovered === i ? 5 : 3.5}
                  className="fill-white stroke-blue-500 dark:fill-slate-900"
                  strokeWidth={2}
                />
                <text
                  x={p.x}
                  y={p.y - 11}
                  textAnchor="middle"
                  className={`fill-slate-800 text-[13px] dark:fill-slate-100 ${
                    hovered === i || i === 0 ? "font-bold" : "font-medium"
                  }`}
                >
                  {items[i].temp}°
                </text>
              </g>
            ))}
            {/* 호버 영역 (표시 요소보다 넓은 타깃) */}
            {items.map((item, i) => (
              <rect
                key={`hit-${item.time}`}
                x={i * COL}
                y={0}
                width={COL}
                height={svgH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
              />
            ))}
          </svg>

          {/* 강수확률 */}
          <div className="relative flex pb-2">
            {items.map((item, i) => (
              <div
                key={item.time}
                className="flex items-center justify-center gap-0.5 text-xs tabular-nums"
                style={{ width: COL }}
                onMouseEnter={() => setHovered(i)}
              >
                <svg viewBox="0 0 12 12" className={`h-3 w-3 ${item.precipitation >= 30 ? "fill-blue-500" : "fill-slate-300 dark:fill-slate-600"}`} aria-hidden>
                  <path d="M6 1C6 1 2 5.5 2 7.8A4 4 0 0 0 10 7.8C10 5.5 6 1 6 1z" />
                </svg>
                <span
                  className={
                    item.precipitation >= 30
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-slate-400"
                  }
                >
                  {item.precipitation}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
