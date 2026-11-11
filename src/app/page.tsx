import WeatherApp from "@/components/weather/WeatherApp";
import AuthStatus from "@/components/auth/AuthStatus";
import { getAllWeather } from "@/lib/weather-api";
import { DEFAULT_LOCATION_ID, isLocationId } from "@/lib/locations";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { city } = await searchParams;
  const initialCityId = isLocationId(city) ? city : DEFAULT_LOCATION_ID;

  let cities;
  try {
    cities = await getAllWeather();
  } catch (error) {
    console.error("날씨 데이터 조회 실패:", error);
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-slate-100 p-8 text-center dark:bg-slate-950">
        <p className="text-lg font-bold text-slate-900 dark:text-white">날씨 정보를 불러오지 못했어요</p>
        <p className="text-sm text-slate-500">잠시 후 새로고침해주세요.</p>
      </div>
    );
  }

  return <WeatherApp cities={cities} initialCityId={initialCityId} authSlot={<AuthStatus />} />;
}
