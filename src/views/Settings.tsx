import "./Settings.css";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { store } from "@telemetryos/sdk";
import { WeatherConfig, DEFAULT_CONFIG } from "../types";

export function Settings() {
  const [config, setConfig] = useState<WeatherConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newCityInput, setNewCityInput] = useState("");

  // Load existing config on mount
  useEffect(() => {
    setLoading(true);
    store()
      .instance.get<WeatherConfig>("weatherConfig")
      .then((saved) => {
        if (saved) {
          // Merge with defaults to ensure new properties exist
          const mergedConfig = {
            ...DEFAULT_CONFIG,
            ...saved,
            // Ensure locations array exists
            locations: saved.locations || DEFAULT_CONFIG.locations,
            enableRotation:
              saved.enableRotation ?? DEFAULT_CONFIG.enableRotation,
            rotationInterval:
              saved.rotationInterval ?? DEFAULT_CONFIG.rotationInterval,
          };
          setConfig(mergedConfig);
        } else {
          // Save default config if none exists
          setConfig(DEFAULT_CONFIG);
          store()
            .instance.set("weatherConfig", DEFAULT_CONFIG)
            .catch(console.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Validate location settings
      if (config.enableRotation) {
        if (!config.locations || config.locations.length === 0) {
          throw new Error("Please provide at least one location for rotation");
        }
      } else {
        if (!config.city || config.city.trim() === "") {
          throw new Error("Please provide a city name");
        }
      }

      console.log("💾 [Settings] Saving config to storage:", config);
      const success = await store().instance.set("weatherConfig", config);
      console.log("✅ [Settings] Save result:", success);

      if (!success) throw new Error("Storage operation failed");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("❌ [Settings] Save error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<WeatherConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    // Log theme changes
    if (updates.theme) {
      console.log("🎨 [Settings] Theme selector changed to:", updates.theme);
    }
  };

  const addCity = () => {
    if (!newCityInput.trim()) return;
    const newLocations = [...config.locations, newCityInput.trim()];
    updateConfig({ locations: newLocations });
    setNewCityInput("");
  };

  const removeCity = (index: number) => {
    const newLocations = config.locations.filter((_, i) => i !== index);
    updateConfig({ locations: newLocations });
  };

  const moveCityUp = (index: number) => {
    if (index === 0) return;
    const newLocations = [...config.locations];
    [newLocations[index - 1], newLocations[index]] = [
      newLocations[index],
      newLocations[index - 1],
    ];
    updateConfig({ locations: newLocations });
  };

  const moveCityDown = (index: number) => {
    if (index === config.locations.length - 1) return;
    const newLocations = [...config.locations];
    [newLocations[index], newLocations[index + 1]] = [
      newLocations[index + 1],
      newLocations[index],
    ];
    updateConfig({ locations: newLocations });
  };

  return (
    <div className="settings">
      <h2 className="settings__title">Weather Widget Settings</h2>

      {error && <div className="settings__error">{error}</div>}
      {saveSuccess && (
        <div className="settings__success">Settings saved successfully!</div>
      )}

      <form onSubmit={handleSave} className="settings__form">
        {/* Location Settings */}
        <section className="settings__section">
          <h3 className="settings__section-title">Location</h3>

          <div className="settings__field settings__field--checkbox">
            <label className="settings__checkbox-label">
              <input
                type="checkbox"
                className="settings__checkbox"
                checked={config.enableRotation}
                onChange={(e) =>
                  updateConfig({ enableRotation: e.target.checked })
                }
              />
              Enable Location Rotation
            </label>
          </div>

          {!config.enableRotation ? (
            <div className="settings__field">
              <label htmlFor="city" className="settings__label">
                City Name
              </label>
              <input
                id="city"
                type="text"
                className="settings__input"
                value={config.city || ""}
                onChange={(e) => updateConfig({ city: e.target.value })}
                placeholder="e.g., Coquitlam, BC"
                required
              />
              <small className="settings__hint">
                Enter city name (optionally with state/province and country)
              </small>
            </div>
          ) : (
            <>
              <div className="settings__field">
                <label className="settings__label">Locations</label>
                <div className="settings__cities">
                  {(config.locations || []).map((city, index) => (
                    <div key={index} className="settings__city-card">
                      <span className="settings__city-name">{city}</span>
                      <div className="settings__city-actions">
                        <button
                          type="button"
                          className="settings__city-btn"
                          onClick={() => moveCityUp(index)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="settings__city-btn"
                          onClick={() => moveCityDown(index)}
                          disabled={index === config.locations.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="settings__city-btn settings__city-btn--delete"
                          onClick={() => removeCity(index)}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="settings__add-city">
                  <input
                    type="text"
                    className="settings__input"
                    value={newCityInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewCityInput(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCity();
                      }
                    }}
                    placeholder="Enter city name..."
                  />
                  <button
                    type="button"
                    className="settings__add-btn"
                    onClick={addCity}
                  >
                    + Add City
                  </button>
                </div>
                <small className="settings__hint">
                  Add multiple cities to rotate through
                </small>
              </div>

              <div className="settings__field">
                <label htmlFor="rotationInterval" className="settings__label">
                  Rotation Interval (seconds)
                </label>
                <input
                  id="rotationInterval"
                  type="number"
                  min="5"
                  max="60"
                  className="settings__input"
                  value={config.rotationInterval}
                  onChange={(e) =>
                    updateConfig({
                      rotationInterval: parseInt(e.target.value) || 10,
                    })
                  }
                />
                <small className="settings__hint">
                  Minimum: 5 seconds, Maximum: 60 seconds
                </small>
              </div>
            </>
          )}
        </section>

        {/* Display Preferences */}
        <section className="settings__section">
          <h3 className="settings__section-title">Display Preferences</h3>

          <div className="settings__field">
            <label htmlFor="units" className="settings__label">
              Temperature Units
            </label>
            <select
              id="units"
              className="settings__select"
              value={config.units}
              onChange={(e) =>
                updateConfig({ units: e.target.value as "imperial" | "metric" })
              }
            >
              <option value="imperial">Imperial (°F, mph)</option>
              <option value="metric">Metric (°C, km/h)</option>
            </select>
          </div>

          <div className="settings__field">
            <label htmlFor="theme" className="settings__label">
              Theme
            </label>
            <select
              id="theme"
              className="settings__select"
              value={config.theme}
              onChange={(e) =>
                updateConfig({ theme: e.target.value as "light" | "dark" })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="settings__field settings__field--checkbox">
            <label className="settings__checkbox-label">
              <input
                type="checkbox"
                className="settings__checkbox"
                checked={config.showForecast}
                onChange={(e) =>
                  updateConfig({ showForecast: e.target.checked })
                }
              />
              Show Forecast
            </label>
          </div>
        </section>

        {/* Forecast Options */}
        {config.showForecast && (
          <section className="settings__section">
            <h3 className="settings__section-title">Forecast Options</h3>

            <div className="settings__field">
              <label htmlFor="forecastType" className="settings__label">
                Forecast Type
              </label>
              <select
                id="forecastType"
                className="settings__select"
                value={config.forecastType}
                onChange={(e) =>
                  updateConfig({
                    forecastType: e.target.value as "daily" | "hourly",
                  })
                }
              >
                <option value="daily">Daily (5-day forecast)</option>
                <option value="hourly">Hourly (24-hour forecast)</option>
              </select>
            </div>

            {config.forecastType === "daily" && (
              <div className="settings__field">
                <label htmlFor="forecastDays" className="settings__label">
                  Number of Days (1-5)
                </label>
                <input
                  id="forecastDays"
                  type="number"
                  min="1"
                  max="5"
                  className="settings__input"
                  value={config.forecastDays}
                  onChange={(e) =>
                    updateConfig({
                      forecastDays: parseInt(e.target.value) || 5,
                    })
                  }
                />
              </div>
            )}

            {config.forecastType === "hourly" && (
              <div className="settings__field">
                <label htmlFor="forecastHours" className="settings__label">
                  Number of Hours
                </label>
                <input
                  id="forecastHours"
                  type="number"
                  min="1"
                  max="120"
                  className="settings__input"
                  value={config.forecastHours}
                  onChange={(e) =>
                    updateConfig({
                      forecastHours: parseInt(e.target.value) || 24,
                    })
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Refresh Settings */}
        <section className="settings__section">
          <h3 className="settings__section-title">Refresh Settings</h3>

          <div className="settings__field">
            <label htmlFor="refreshInterval" className="settings__label">
              Auto-Refresh Interval (minutes)
            </label>
            <input
              id="refreshInterval"
              type="number"
              min="5"
              max="60"
              className="settings__input"
              value={config.refreshInterval}
              onChange={(e) =>
                updateConfig({
                  refreshInterval: parseInt(e.target.value) || 20,
                })
              }
            />
            <small className="settings__hint">
              Minimum: 5 minutes, Maximum: 60 minutes
            </small>
          </div>
        </section>

        <button type="submit" className="settings__button" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </form>

      {/* Future Features - TBD */}
      <div className="settings__tbd">
        <h3 className="settings__tbd-title">Features To Be Implemented</h3>
        <ul className="settings__tbd-list">
          <li>
            ⚠️ Severe weather alerts display (API limitation - not available)
          </li>
          <li>🌅 Sunrise/sunset times (need to verify API support)</li>
          <li>🖼️ Custom background images/videos with safety constraints</li>
          <li>🎨 Custom branding elements (logos, colors)</li>
          <li>💾 Cache expiry and "data may be out of date" indicators</li>
          <li>📴 Offline mode with cached data persistence</li>
          <li>📱 Responsive layouts (slim/ticker bar modes)</li>
          <li>🌍 Localization support (multiple languages)</li>
          <li>🎯 Contrast validation for custom colors</li>
        </ul>
      </div>
    </div>
  );
}
