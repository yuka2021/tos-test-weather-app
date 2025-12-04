// Weather configuration stored in instance storage
export interface WeatherConfig {
  // Location settings
  city: string;
  locations: string[]; // Multiple locations for rotation
  enableRotation: boolean;
  rotationInterval: number; // in seconds (5-60)

  // Display preferences
  units: "imperial" | "metric";
  theme: "light" | "dark";
  showForecast: boolean;

  // Forecast options
  forecastType: "daily" | "hourly";
  forecastDays: number; // 1-5 for daily
  forecastHours: number; // for hourly

  // Refresh settings
  refreshInterval: number; // in minutes (5-60)
}

// SDK Weather types (matching @telemetryos/root-sdk)
export interface WeatherConditions {
  CityLocalized: string;
  CityEnglish: string;
  WindAbbr: string;
  CountryCode: string;
  Timezone: string;
  WeatherText: string;
  State: string;
  Pod: string;
  WeatherCode: string;
  WindDirectionDegrees: string;
  WindDirectionEnglish: string;
  WindDirectionLocalized: string;
  RelativeHumidity: number;
  Timestamp: number;
  Longitude: number;
  Latitude: number;
  Temp: number;
  Pressure: number;
  WindSpeed: number;
  Visibility: number;
  Precip: number;
}

export interface WeatherForecast {
  Datetime: string;
  Pod: string;
  Label: string;
  WeatherCode: string;
  Timestamp: number;
  Temp: number;
  MinTemp: number;
  MaxTemp: number;
}

// Default configuration
export const DEFAULT_CONFIG: WeatherConfig = {
  city: "New York",
  locations: ["New York", "Los Angeles", "Chicago"],
  enableRotation: false,
  rotationInterval: 10, // 10 seconds
  units: "imperial",
  theme: "light",
  showForecast: true,
  forecastType: "daily",
  forecastDays: 5,
  forecastHours: 24,
  refreshInterval: 20, // 20 minutes
};
