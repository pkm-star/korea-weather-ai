import type { Location } from "@/types/weather";

export const LOCATIONS: Location[] = [
  { id: "seoul", name: "서울", region: "서울특별시", lat: 37.5665, lon: 126.978 },
  { id: "incheon", name: "인천", region: "인천광역시", lat: 37.4563, lon: 126.7052 },
  { id: "suwon", name: "수원", region: "경기도", lat: 37.2636, lon: 127.0286 },
  { id: "chuncheon", name: "춘천", region: "강원특별자치도", lat: 37.8813, lon: 127.7298 },
  { id: "gangneung", name: "강릉", region: "강원특별자치도", lat: 37.7519, lon: 128.8761 },
  { id: "daejeon", name: "대전", region: "대전광역시", lat: 36.3504, lon: 127.3845 },
  { id: "daegu", name: "대구", region: "대구광역시", lat: 35.8714, lon: 128.6014 },
  { id: "gwangju", name: "광주", region: "광주광역시", lat: 35.1595, lon: 126.8526 },
  { id: "busan", name: "부산", region: "부산광역시", lat: 35.1796, lon: 129.0756 },
  { id: "jeju", name: "제주", region: "제주특별자치도", lat: 33.4996, lon: 126.5312 },
];

export const DEFAULT_LOCATION_ID = "seoul";

export function isLocationId(value: unknown): value is string {
  return typeof value === "string" && LOCATIONS.some((l) => l.id === value);
}
