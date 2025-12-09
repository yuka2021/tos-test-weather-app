import { useEffect, useState } from "react";
import { store, weather } from "@telemetryos/sdk";
import "./Render.css";
import {
  WeatherConfig,
  WeatherConditions,
  WeatherForecast,
  DEFAULT_CONFIG,
} from "../types";

export function Render() {
  const [config, setConfig] = useState<WeatherConfig | null>(null);
  const [currentWeather, setCurrentWeather] =
    useState<WeatherConditions | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("landscape");

  // Detect aspect ratio on mount and window resize
  useEffect(() => {
    const detectAspectRatio = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      console.log(
        `📐 [Render] Aspect ratio: ${ratio.toFixed(2)} (${width}x${height})`
      );

      // Determine layout type based on aspect ratio
      if (ratio >= 1.5) {
        // Landscape/wide (16:9 is ~1.78)
        setAspectRatio("landscape");
      } else if (ratio >= 0.7 && ratio < 1.3) {
        // Square (1:1)
        setAspectRatio("square");
      } else if (ratio < 0.7) {
        // Tall/portrait (1:10 is 0.1)
        setAspectRatio("tall");
      } else {
        setAspectRatio("landscape");
      }
    };

    detectAspectRatio();
    window.addEventListener("resize", detectAspectRatio);

    return () => window.removeEventListener("resize", detectAspectRatio);
  }, []);

  // Subscribe to config changes from Settings
  useEffect(() => {
    console.log("🔌 [Render] Setting up config subscription");
    store()
      .instance.get<WeatherConfig>("weatherConfig")
      .then((saved) => {
        console.log("📥 [Render] Initial config loaded:", saved);
        setConfig(saved || DEFAULT_CONFIG);
      });

    const handler = (newConfig: WeatherConfig | undefined) => {
      console.log(
        "📡 [Render] Subscription handler triggered with:",
        newConfig
      );
      if (newConfig) {
        console.log("🎨 [Render] Theme changed to:", newConfig.theme);
        console.log("⚙️ [Render] Config updated:", newConfig);
        setConfig(newConfig);
      }
    };
    store().instance.subscribe("weatherConfig", handler);

    return () => {
      console.log("🔌 [Render] Cleaning up subscription");
      store().instance.unsubscribe("weatherConfig", handler);
    };
  }, []);

  // Fetch weather data when config or location index changes
  useEffect(() => {
    if (!config) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build request params
        const params: any = {
          units: config.units,
        };

        // Determine which location to use
        let cityToFetch: string;
        if (config.enableRotation && config.locations.length > 0) {
          cityToFetch = config.locations[currentLocationIndex];
        } else {
          cityToFetch = config.city;
        }

        if (!cityToFetch || cityToFetch.trim() === "") {
          throw new Error("No location configured");
        }

        params.city = cityToFetch;
        setLocationName(cityToFetch);

        // Fetch current conditions
        const conditions = await weather().getConditions(params);
        setCurrentWeather(conditions);

        // Fetch forecast if enabled
        if (config.showForecast) {
          if (config.forecastType === "daily") {
            const dailyForecast = await weather().getDailyForecast({
              ...params,
              days: config.forecastDays,
            });
            setForecast(dailyForecast);
          } else {
            const hourlyForecast = await weather().getHourlyForecast({
              ...params,
              hours: config.forecastHours,
            });
            setForecast(hourlyForecast);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load weather data"
        );
        console.error("Weather fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config?.city,
    config?.units,
    config?.showForecast,
    config?.forecastType,
    config?.forecastDays,
    config?.forecastHours,
    config?.enableRotation,
    config?.locations,
    currentLocationIndex,
  ]);

  // Auto-refresh based on config
  useEffect(() => {
    if (!config) return;

    const fetchWeather = async () => {
      try {
        const params: any = {
          units: config.units,
        };

        if (config.city) {
          params.city = config.city;
        }

        const conditions = await weather().getConditions(params);
        setCurrentWeather(conditions);

        if (config.showForecast) {
          if (config.forecastType === "daily") {
            const dailyForecast = await weather().getDailyForecast({
              ...params,
              days: config.forecastDays,
            });
            setForecast(dailyForecast);
          } else {
            const hourlyForecast = await weather().getHourlyForecast({
              ...params,
              hours: config.forecastHours,
            });
            setForecast(hourlyForecast);
          }
        }
      } catch (err) {
        console.error("Auto-refresh error:", err);
      }
    };

    const intervalMs = config.refreshInterval * 60 * 1000;
    const interval = setInterval(fetchWeather, intervalMs);

    return () => clearInterval(interval);
  }, [
    config?.refreshInterval,
    config?.city,
    config?.units,
    config?.showForecast,
    config?.forecastType,
    config?.forecastDays,
    config?.forecastHours,
  ]);

  // Location rotation timer
  useEffect(() => {
    if (!config || !config.enableRotation || config.locations.length <= 1) {
      return;
    }

    const rotateLocation = () => {
      // Start fade out
      setIsFading(true);

      // After fade out completes, change location
      setTimeout(() => {
        setCurrentLocationIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % config.locations.length;
          console.log(
            `🔄 [Render] Rotating to location ${nextIndex}: ${config.locations[nextIndex]}`
          );
          return nextIndex;
        });

        // Start fade in
        setTimeout(() => setIsFading(false), 50);
      }, 300); // Match CSS transition duration
    };

    const intervalMs = config.rotationInterval * 1000;
    const interval = setInterval(rotateLocation, intervalMs);

    return () => clearInterval(interval);
  }, [config?.enableRotation, config?.rotationInterval, config?.locations]);

  // Helper function to get weather icon emoji from weather code
  const getWeatherIcon = (weatherCode: string): string => {
    // Map weather codes to emojis
    const iconMap: Record<string, string> = {
      "clear-day": "☀️",
      "clear-night": "🌙",
      "partly-cloudy-day": "⛅",
      "partly-cloudy-night": "☁️",
      cloudy: "☁️",
      fog: "🌫️",
      wind: "💨",
      rain: "🌧️",
      sleet: "🌨️",
      snow: "❄️",
      thunderstorm: "⛈️",
    };
    return iconMap[weatherCode] || "🌤️";
  };

  // Helper function to format time from date string
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Helper function to format day
  const formatDay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Loading state
  if (loading && !currentWeather) {
    return (
      <div className={`render render--${config?.theme || "light"}`}>
        <div className="render__loading">Loading weather data...</div>
      </div>
    );
  }

  // Error state
  if (error && !currentWeather) {
    return (
      <div className={`render render--${config?.theme || "light"}`}>
        <div className="render__error">
          <p>Unable to load weather data</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // No config state
  if (!config || !currentWeather) {
    return (
      <div className={`render render--${config?.theme || "light"}`}>
        <div className="render__empty">
          <p>Please configure the weather widget in Settings</p>
        </div>
      </div>
    );
  }

  const windUnit = config.units === "imperial" ? "mph" : "km/h";

  console.log(
    "🎨 [Render] Rendering with theme CSS class:",
    `render--${config.theme}`
  );

  return (
    <div
      className={`render render--${config.theme} render--${aspectRatio} ${
        isFading ? "render--fading" : ""
      }`}
    >
      {/* Current Weather Section */}
      <div className="render__current">
        <div className="render__current-header">
          <h1 className="render__location">{locationName}</h1>
          <div className="render__feels-like">{currentWeather.WeatherText}</div>
        </div>

        <div className="render__current-main">
          <div className="render__temp-container">
            <div className="render__temp">
              {Math.round(currentWeather.Temp)}°
            </div>
            <div className="render__icon">
              {getWeatherIcon(currentWeather.WeatherCode)}
            </div>
          </div>
        </div>

        <div className="render__current-details">
          <div className="render__detail">
            <span className="render__detail-icon">💧</span>
            <span className="render__detail-value">
              {currentWeather.RelativeHumidity}%
            </span>
          </div>
          <div className="render__detail">
            <span className="render__detail-icon">💨</span>
            <span className="render__detail-value">
              {Math.round(currentWeather.WindSpeed)} {windUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      {config.showForecast && forecast.length > 0 && (
        <div className="render__forecast">
          {forecast
            .slice(0, config.forecastType === "daily" ? config.forecastDays : 6)
            .map((item, index) => (
              <div key={index} className="render__forecast-item">
                <div className="render__forecast-temp">
                  {Math.round(item.MinTemp)}°
                </div>
                <div className="render__forecast-icon">
                  {getWeatherIcon(item.WeatherCode)}
                </div>
                <div className="render__forecast-label">
                  {config.forecastType === "daily"
                    ? formatDay(item.Datetime)
                    : formatTime(item.Datetime)}
                </div>
                <div className="render__forecast-temp-max">
                  {Math.round(item.MaxTemp)}°
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
