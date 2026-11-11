export type WeatherCondition =
  | "clear"
  | "partlyCloudy"
  | "clouds"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "thunder";

export interface Location {
  id: string;
  name: string;
  region: string; // "서울특별시", "제주특별자치도" ...
  lat: number;
  lon: number;
}

export interface CurrentWeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  description: string;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
  windDirection: string; // "북서풍"
  precipitation: number; // mm (현재 시각)
  observedAt: string; // "2026-11-01T19:30" (KST)
}

export interface HourlyForecastItem {
  time: string; // ISO "2026-11-01T20:00"
  label: string; // "지금", "20시", "내일"
  temp: number;
  condition: WeatherCondition;
  isDay: boolean;
  precipitation: number; // 강수확률 %
}

export interface DailyForecastItem {
  date: string; // "2026-11-01"
  day: string; // "오늘", "내일", "화"
  dateLabel: string; // "11.1."
  isWeekend: "sat" | "sun" | null;
  condition: WeatherCondition;
  description: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
}

export type AirQualityLevel = "good" | "normal" | "bad" | "veryBad";

export interface LevelValue {
  level: AirQualityLevel;
  label: string;
  value: number;
}

export interface WeatherOffer {
  fineDust: LevelValue | null; // PM10 ㎍/㎥
  ultraFineDust: LevelValue | null; // PM2.5 ㎍/㎥
  uv: LevelValue;
  discomfort: LevelValue;
  sunrise: string; // "06:52"
  sunset: string; // "17:38"
}

export interface CityWeather {
  location: Location;
  current: CurrentWeatherData;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  offer: WeatherOffer;
  summary: string; // "21시쯤 비 소식이 있어요"
}
