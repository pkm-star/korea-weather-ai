import type {
  AirQualityLevel,
  LevelValue,
  WeatherCondition,
} from "@/types/weather";

// WMO 날씨 코드 → 앱 내부 상태 + 한국어 설명
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function describeWeatherCode(code: number): {
  condition: WeatherCondition;
  description: string;
} {
  if (code === 0) return { condition: "clear", description: "맑음" };
  if (code === 1) return { condition: "clear", description: "대체로 맑음" };
  if (code === 2) return { condition: "partlyCloudy", description: "구름 조금" };
  if (code === 3) return { condition: "clouds", description: "흐림" };
  if (code === 45 || code === 48) return { condition: "fog", description: "안개" };
  if (code >= 51 && code <= 57) return { condition: "drizzle", description: "이슬비" };
  if (code === 61) return { condition: "rain", description: "약한 비" };
  if (code === 63) return { condition: "rain", description: "비" };
  if (code === 65) return { condition: "rain", description: "강한 비" };
  if (code === 66 || code === 67) return { condition: "rain", description: "어는 비" };
  if (code === 71) return { condition: "snow", description: "약한 눈" };
  if (code === 73) return { condition: "snow", description: "눈" };
  if (code === 75) return { condition: "snow", description: "많은 눈" };
  if (code === 77) return { condition: "snow", description: "싸락눈" };
  if (code >= 80 && code <= 82) return { condition: "rain", description: "소나기" };
  if (code === 85 || code === 86) return { condition: "snow", description: "소낙눈" };
  if (code >= 95) return { condition: "thunder", description: "뇌우" };
  return { condition: "clouds", description: "흐림" };
}

// 히어로 배경: 날씨 + 낮/밤 조합별 그라데이션
export function heroGradient(condition: WeatherCondition, isDay: boolean): string {
  if (!isDay) {
    switch (condition) {
      case "clear":
      case "partlyCloudy":
        return "linear-gradient(160deg, #0b1437 0%, #1b2a6b 55%, #3a3f8f 100%)";
      case "rain":
      case "drizzle":
      case "thunder":
        return "linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #334155 100%)";
      case "snow":
        return "linear-gradient(160deg, #1e293b 0%, #334a6b 55%, #5b7393 100%)";
      default:
        return "linear-gradient(160deg, #111827 0%, #283548 55%, #3f4c63 100%)";
    }
  }
  switch (condition) {
    case "clear":
      return "linear-gradient(160deg, #1d6fe8 0%, #3b9bf5 55%, #7cc4ff 100%)";
    case "partlyCloudy":
      return "linear-gradient(160deg, #2a72d6 0%, #5a9de6 55%, #9cc6ef 100%)";
    case "clouds":
    case "fog":
      return "linear-gradient(160deg, #4b5d78 0%, #6f839f 55%, #9eafc4 100%)";
    case "rain":
    case "drizzle":
      return "linear-gradient(160deg, #334155 0%, #4b6079 55%, #6f87a3 100%)";
    case "thunder":
      return "linear-gradient(160deg, #1f2937 0%, #3b4357 55%, #5b5f7a 100%)";
    case "snow":
      return "linear-gradient(160deg, #6b8bb3 0%, #95b1d1 55%, #cfdcec 100%)";
  }
}

// 환경부 미세먼지 예보 등급 기준 (㎍/㎥)
export function gradePm10(value: number): LevelValue {
  const v = Math.round(value);
  if (v <= 30) return { level: "good", label: "좋음", value: v };
  if (v <= 80) return { level: "normal", label: "보통", value: v };
  if (v <= 150) return { level: "bad", label: "나쁨", value: v };
  return { level: "veryBad", label: "매우나쁨", value: v };
}

export function gradePm25(value: number): LevelValue {
  const v = Math.round(value);
  if (v <= 15) return { level: "good", label: "좋음", value: v };
  if (v <= 35) return { level: "normal", label: "보통", value: v };
  if (v <= 75) return { level: "bad", label: "나쁨", value: v };
  return { level: "veryBad", label: "매우나쁨", value: v };
}

// 기상청 자외선 지수 단계
export function gradeUv(value: number): LevelValue {
  const v = Math.round(value);
  if (v <= 2) return { level: "good", label: "낮음", value: v };
  if (v <= 5) return { level: "normal", label: "보통", value: v };
  if (v <= 7) return { level: "bad", label: "높음", value: v };
  return { level: "veryBad", label: v >= 11 ? "위험" : "매우높음", value: v };
}

// 기상청 불쾌지수 공식: 0.81T + 0.01H(0.99T − 14.3) + 46.3
export function gradeDiscomfort(temp: number, humidity: number): LevelValue {
  const di = Math.round(0.81 * temp + 0.01 * humidity * (0.99 * temp - 14.3) + 46.3);
  if (di < 68) return { level: "good", label: "낮음", value: di };
  if (di < 75) return { level: "normal", label: "보통", value: di };
  if (di < 80) return { level: "bad", label: "높음", value: di };
  return { level: "veryBad", label: "매우높음", value: di };
}

export function windDirectionLabel(deg: number): string {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return `${dirs[Math.round(deg / 45) % 8]}풍`;
}

// 등급 배지 색 (라벨과 함께 쓰므로 색만으로 의미를 전달하지 않음)
export function levelBadgeClass(level: AirQualityLevel): string {
  switch (level) {
    case "good":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300";
    case "normal":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "bad":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300";
    case "veryBad":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
  }
}

export function levelDotClass(level: AirQualityLevel): string {
  switch (level) {
    case "good":
      return "bg-sky-400";
    case "normal":
      return "bg-emerald-400";
    case "bad":
      return "bg-amber-400";
    case "veryBad":
      return "bg-rose-400";
  }
}
