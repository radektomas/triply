import type { APIWeather } from "@/lib/types";

interface WeatherBadgeProps {
  weather: APIWeather;
  month: string;
}

const rainLabel: Record<APIWeather["rain"], string> = {
  low: "Dry",
  medium: "Some rain",
  high: "Wet",
};

export function WeatherBadge({ weather, month }: WeatherBadgeProps) {
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  return (
    <div className="flex items-center gap-3 text-sm text-muted flex-wrap">
      <span className="font-medium text-[#1A1A1A]">
        {weather.tempC}°C
      </span>
      <span>·</span>
      <span>{weather.sunshineHours}h sun</span>
      <span>·</span>
      <span
        className={
          weather.rain === "low"
            ? "text-green-600"
            : weather.rain === "medium"
            ? "text-yellow-600"
            : "text-red-500"
        }
      >
        {rainLabel[weather.rain]}
      </span>
      {weather.seaTemp !== undefined && (
        <>
          <span>·</span>
          <span>{weather.seaTemp}°C sea</span>
        </>
      )}
      <span className="text-xs text-muted">in {monthLabel}</span>
    </div>
  );
}
