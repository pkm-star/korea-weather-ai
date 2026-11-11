import type {
  CityWeather,
  DailyForecastItem,
  HourlyForecastItem,
  Location,
} from "@/types/weather";
import { LOCATIONS } from "@/lib/locations";
import {
  describeWeatherCode,
  gradeDiscomfort,
  gradePm10,
  gradePm25,
  gradeUv,
  windDirectionLabel,
} from "@/lib/weather-style";

// Open-Meteo: API 키 없이 쓰는 무료 예보 API. 한국 지역은 여러 기상 모델을 조합한 값을 준다.
// 무료 플랜은 비상업용이므로, 실제 상업 서비스로 운영할 때는 유료 플랜이나 기상청 API로 바꿔야 한다.
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const REVALIDATE_SECONDS = 600; // 10분마다 갱신
const HOURLY_COUNT = 25; // 지금 + 24시간
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface ForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: (number | null)[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: (number | null)[];
  };
}

interface AirResponse {
  current?: { pm10: number | null; pm2_5: number | null };
}

function coordsQuery(locations: Location[]) {
  return {
    latitude: locations.map((l) => l.lat).join(","),
    longitude: locations.map((l) => l.lon).join(","),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) throw new Error(`날씨 API 오류 ${res.status}: ${url}`);
  return (await res.json()) as T;
}

// 여러 좌표를 한 번에 요청하면 배열로, 하나면 객체로 응답하므로 통일
function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

const round = (n: number) => Math.round(n);
const hhmm = (iso: string) => iso.slice(11, 16);

function buildHourly(f: ForecastResponse): HourlyForecastItem[] {
  const currentHour = f.current.time.slice(0, 13); // "2026-11-01T19"
  let start = f.hourly.time.findIndex((t) => t.startsWith(currentHour));
  if (start < 0) start = 0;

  return f.hourly.time.slice(start, start + HOURLY_COUNT).map((time, i) => {
    const idx = start + i;
    const hour = Number(time.slice(11, 13));
    const { condition } = describeWeatherCode(f.hourly.weather_code[idx]);
    return {
      time,
      label: i === 0 ? "지금" : hour === 0 ? "내일" : `${hour}시`,
      temp: round(f.hourly.temperature_2m[idx]),
      condition,
      isDay: f.hourly.is_day[idx] === 1,
      precipitation: f.hourly.precipitation_probability[idx] ?? 0,
    };
  });
}

function buildDaily(f: ForecastResponse): DailyForecastItem[] {
  return f.daily.time.map((date, i) => {
    const d = new Date(`${date}T00:00:00Z`);
    const weekday = d.getUTCDay();
    const { condition, description } = describeWeatherCode(f.daily.weather_code[i]);
    return {
      date,
      day: i === 0 ? "오늘" : i === 1 ? "내일" : WEEKDAYS[weekday],
      dateLabel: `${d.getUTCMonth() + 1}.${d.getUTCDate()}.`,
      isWeekend: weekday === 6 ? "sat" : weekday === 0 ? "sun" : null,
      condition,
      description,
      tempMin: round(f.daily.temperature_2m_min[i]),
      tempMax: round(f.daily.temperature_2m_max[i]),
      precipitation: f.daily.precipitation_probability_max[i] ?? 0,
    };
  });
}

// 히어로 아래 한 줄 요약 (네이버 날씨의 "어제보다 ~" 문구 자리)
function buildSummary(hourly: HourlyForecastItem[], daily: DailyForecastItem[]): string {
  const next12 = hourly.slice(1, 13);
  const isWet = (h: HourlyForecastItem) => ["rain", "drizzle", "thunder", "snow"].includes(h.condition);
  const wetNow = hourly[0] && isWet(hourly[0]);
  const firstWet = next12.find((h) => h.precipitation >= 50);

  if (wetNow) {
    const dryAt = next12.find((h) => !isWet(h) && h.precipitation < 30);
    return dryAt ? `${dryAt.label}쯤 그칠 것으로 보여요` : "당분간 비나 눈이 이어져요";
  }
  if (firstWet) {
    return `${firstWet.label}쯤 비 소식이 있어요. 우산을 챙기세요`;
  }
  const tomorrow = daily[1];
  if (tomorrow && tomorrow.precipitation >= 60) {
    return `내일은 ${tomorrow.description}, 강수확률 ${tomorrow.precipitation}%예요`;
  }
  const today = daily[0];
  if (today && today.tempMax - today.tempMin >= 10) {
    return `일교차가 ${today.tempMax - today.tempMin}°로 커요. 겉옷을 챙기세요`;
  }
  return "12시간 동안 비 소식은 없어요";
}

export async function getAllWeather(): Promise<CityWeather[]> {
  const coords = coordsQuery(LOCATIONS);
  const forecastParams = new URLSearchParams({
    ...coords,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    timezone: "Asia/Seoul",
    forecast_days: "10",
    wind_speed_unit: "ms",
  });
  const airParams = new URLSearchParams({
    ...coords,
    current: "pm10,pm2_5",
    timezone: "Asia/Seoul",
  });

  const [forecasts, airs] = await Promise.all([
    fetchJson<ForecastResponse | ForecastResponse[]>(`${FORECAST_URL}?${forecastParams}`).then(asArray),
    // 대기질은 부가 정보라 실패해도 본 예보는 보여준다
    fetchJson<AirResponse | AirResponse[]>(`${AIR_URL}?${airParams}`)
      .then(asArray)
      .catch((error) => {
        console.error("대기질 API 호출 실패:", error);
        return [] as AirResponse[];
      }),
  ]);

  return LOCATIONS.map((location, i) => {
    const f = forecasts[i];
    const air = airs[i]?.current;
    const { condition, description } = describeWeatherCode(f.current.weather_code);
    const hourly = buildHourly(f);
    const daily = buildDaily(f);
    const temp = round(f.current.temperature_2m);

    return {
      location,
      current: {
        temp,
        feelsLike: round(f.current.apparent_temperature),
        tempMin: daily[0]?.tempMin ?? temp,
        tempMax: daily[0]?.tempMax ?? temp,
        condition,
        description,
        isDay: f.current.is_day === 1,
        humidity: round(f.current.relative_humidity_2m),
        windSpeed: Math.round(f.current.wind_speed_10m * 10) / 10,
        windDirection: windDirectionLabel(f.current.wind_direction_10m),
        precipitation: f.current.precipitation,
        observedAt: f.current.time,
      },
      hourly,
      daily,
      offer: {
        fineDust: air?.pm10 != null ? gradePm10(air.pm10) : null,
        ultraFineDust: air?.pm2_5 != null ? gradePm25(air.pm2_5) : null,
        uv: gradeUv(f.daily.uv_index_max[0] ?? 0),
        discomfort: gradeDiscomfort(f.current.temperature_2m, f.current.relative_humidity_2m),
        sunrise: hhmm(f.daily.sunrise[0]),
        sunset: hhmm(f.daily.sunset[0]),
      },
      summary: buildSummary(hourly, daily),
    };
  });
}

// 챗봇 시스템 프롬프트에 넣을 압축된 실측 데이터
export function weatherContextForChat(cities: CityWeather[], focusId: string): string {
  const lines = cities.map((c) => {
    const cur = c.current;
    const days = c.daily
      .slice(0, 7)
      .map((d) => `${d.day}(${d.dateLabel}) ${d.description} ${d.tempMin}~${d.tempMax}° 강수${d.precipitation}%`)
      .join(", ");
    const hours = c.hourly
      .slice(0, 13)
      .filter((_, i) => i % 3 === 0)
      .map((h) => `${h.label} ${h.temp}° 강수${h.precipitation}%`)
      .join(", ");
    const dust = c.offer.fineDust ? `미세먼지 ${c.offer.fineDust.label}(${c.offer.fineDust.value})` : "미세먼지 정보없음";
    const ultra = c.offer.ultraFineDust ? `초미세먼지 ${c.offer.ultraFineDust.label}(${c.offer.ultraFineDust.value})` : "";
    return [
      `[${c.location.name}${c.location.id === focusId ? " - 사용자가 화면에서 선택한 지역" : ""}]`,
      `현재 ${cur.temp}°(체감 ${cur.feelsLike}°) ${cur.description}, 습도 ${cur.humidity}%, ${cur.windDirection} ${cur.windSpeed}m/s, ${dust} ${ultra}, 자외선 ${c.offer.uv.label}, 일출 ${c.offer.sunrise} 일몰 ${c.offer.sunset}`,
      `시간별: ${hours}`,
      `주간: ${days}`,
    ].join("\n");
  });
  return `데이터 출처: Open-Meteo 예보 모델 (미세먼지는 모델 추정값)\n관측 시각(KST): ${cities[0]?.current.observedAt ?? "알 수 없음"}\n\n${lines.join("\n\n")}`;
}
