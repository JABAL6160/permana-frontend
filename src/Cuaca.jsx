import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sun,
  Moon,
  CloudRain,
  Cloud,
  Wind,
  Droplets,
  Eye,
  Gauge,
  TrendingUp,
  Calendar,
  MapPin,
  RefreshCw,
  Activity
} from "lucide-react";
import "./Cuaca.css";

export default function Cuaca() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [mlPredictions, setMlPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("current");
  const [error, setError] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  // 🔹 API base URL backend Flask
  const API_BASE = "http://localhost:5000/api/weather";

  useEffect(() => {
    fetchWeather();
    const theme = sessionStorage.getItem("theme");
    if (theme) setIsDark(theme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    sessionStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // ================================
  // 🔹 Fetch current + forecast weather
  // ================================
  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCur, resForecast] = await Promise.all([
        fetch(`${API_BASE}/current?lat=-6.2&lon=106.8`), // default Jakarta
        fetch(`${API_BASE}/forecast?lat=-6.2&lon=106.8`)
      ]);

      if (!resCur.ok || !resForecast.ok)
        throw new Error(`Gagal fetch data cuaca (${resCur.status}, ${resForecast.status})`);

      const curData = await resCur.json();
      const forecastData = await resForecast.json();

      setCurrent(curData);
      // ambil setiap 8 langkah (3 jam * 8 = 24 jam → 5 hari)
      const filtered = forecastData.list.filter((_, i) => i % 8 === 0).slice(0, 5);
      setForecast(filtered);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 🔹 Fetch ML Predictions
  // ================================
  const fetchPredictions = async () => {
    setLoadingPrediction(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/predict?steps=24&look_back=24`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gagal memuat prediksi ML: ${res.status} - ${text}`);
      }
      const data = await res.json();
      setMlPredictions(data.predictions || []);
    } catch (err) {
      console.error("Error prediksi:", err);
      setError(err.message);
    } finally {
      setLoadingPrediction(false);
    }
  };

  // ================================
  // 🔹 Icon kondisi cuaca
  // ================================
  const icon = (main) => {
    switch (main) {
      case "Clear": return <Sun className="weather-icon" />;
      case "Rain": return <CloudRain className="weather-icon" />;
      default: return <Cloud className="weather-icon" />;
    }
  };

  const formatDate = (dt) => {
    const d = new Date(dt * 1000);
    return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  };

  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  // ================================
  // 🔹 UI
  // ================================
  if (loading)
    return (
      <div className={`cuaca-root ${isDark ? "dark" : "light"}`}>
        <div className="loading-spinner">
          <RefreshCw className="spin-icon" />
          <p>Memuat data cuaca...</p>
        </div>
      </div>
    );

  return (
    <div className={`cuaca-root ${isDark ? "dark" : "light"}`}>
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDark ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
      </button>

      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft className="back-icon" /> <span>Kembali</span>
      </button>

      <div className="cuaca-container">
        <header className="cuaca-header">
          <h1>Informasi Cuaca</h1>
          <p>Data cuaca real-time, prakiraan, dan prediksi ML</p>
        </header>

        <div className="tab-navigation">
          <button className={`tab-btn ${tab === "current" ? "active" : ""}`} onClick={() => setTab("current")}>
            <Activity className="tab-icon" /> Saat Ini
          </button>
          <button className={`tab-btn ${tab === "forecast" ? "active" : ""}`} onClick={() => setTab("forecast")}>
            <Calendar className="tab-icon" /> Prakiraan 5 Hari
          </button>
          <button
            className={`tab-btn ${tab === "prediction" ? "active" : ""}`}
            onClick={() => {
              setTab("prediction");
              if (mlPredictions.length === 0) fetchPredictions();
            }}
          >
            <TrendingUp className="tab-icon" /> Prediksi ML
          </button>
        </div>

        {error && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "0.5rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* CUACA SAAT INI */}
        {tab === "current" && current && (
          <div className="current-weather-section">
            <div className="weather-main-card">
              <div className="location-info">
                <MapPin className="location-icon" /> 
                <span>{current.name}, {current.sys?.country}</span>
              </div>
              <div className="weather-display">
                {icon(current.weather[0].main)}
                <div className="temp-display">
                  <span className="temp-value">{Math.round(current.main.temp)}</span>
                  <span className="temp-unit">°C</span>
                </div>
              </div>
              <div className="weather-desc">
                <div className="desc-main">{current.weather[0].main}</div>
                <div className="desc-detail">{current.weather[0].description}</div>
              </div>
              <div className="feels-like">
                Terasa seperti {Math.round(current.main.feels_like)}°C
              </div>
              <div className="update-time">Diperbarui: {now}</div>
            </div>

            <div className="weather-details-grid">
              <div className="detail-card">
                <Droplets className="detail-icon" />
                <div className="detail-content">
                  <div className="detail-label">Kelembaban</div>
                  <div className="detail-value">{current.main.humidity}%</div>
                </div>
              </div>
              <div className="detail-card">
                <Wind className="detail-icon" />
                <div className="detail-content">
                  <div className="detail-label">Kecepatan Angin</div>
                  <div className="detail-value">{current.wind.speed} m/s</div>
                </div>
              </div>
              <div className="detail-card">
                <Gauge className="detail-icon" />
                <div className="detail-content">
                  <div className="detail-label">Tekanan</div>
                  <div className="detail-value">{current.main.pressure} hPa</div>
                </div>
              </div>
              <div className="detail-card">
                <Eye className="detail-icon" />
                <div className="detail-content">
                  <div className="detail-label">Jarak Pandang</div>
                  <div className="detail-value">{(current.visibility / 1000).toFixed(1)} km</div>
                </div>
              </div>
            </div>

            <div className="safety-alert">
              <h3>Status Keselamatan Kerja</h3>
              <div className={`safety-status ${current.weather[0].main === "Clear" ? "safe" : "warning"}`}>
                {current.weather[0].main === "Clear" 
                  ? "✅ Aman untuk bekerja di luar ruangan" 
                  : "⚠️ Perhatikan kondisi cuaca saat bekerja"}
              </div>
            </div>
          </div>
        )}

        {/* PRAKIRAAN 5 HARI */}
        {tab === "forecast" && (
          <div className="forecast-section">
            <h2>Prakiraan 5 Hari Ke Depan</h2>
            <div className="forecast-grid">
              {forecast.map((f, i) => (
                <div key={i} className="forecast-card">
                  <div className="forecast-date">{formatDate(f.dt)}</div>
                  {icon(f.weather[0].main)}
                  <div className="forecast-temp">{Math.round(f.main.temp)}°C</div>
                  <div className="forecast-desc">{f.weather[0].description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PREDIKSI ML */}
        {tab === "prediction" && (
          <div className="prediction-section">
            <h2>Prediksi Suhu 24 Jam (LSTM)</h2>

            {loadingPrediction ? (
              <div className="prediction-loading">
                <RefreshCw className="spin-icon" />
                <p>Memproses prediksi ML...</p>
              </div>
            ) : mlPredictions.length === 0 ? (
              <button onClick={fetchPredictions} className="load-prediction-btn">
                <TrendingUp className="btn-icon" /> Muat Prediksi
              </button>
            ) : (
              <div className="prediction-content">
                <div className="prediction-chart">
                  {mlPredictions.map((temp, i) => {
                    const maxTemp = Math.max(...mlPredictions);
                    const minTemp = Math.min(...mlPredictions);
                    const range = maxTemp - minTemp;
                    // Normalisasi tinggi bar antara 20% - 100%
                    const normalizedHeight = range > 0 
                      ? 20 + ((temp - minTemp) / range) * 80 
                      : 50;
                    
                    return (
                      <div key={i} className="chart-bar">
                        <div 
                          className="bar-value"
                        >
                          {temp.toFixed(1)}°
                        </div>
                        <div 
                          className="bar-fill" 
                          style={{ 
                            height: `${normalizedHeight}%`,
                          }}
                        />
                        <span className="bar-label">+{i}j</span>
                      </div>
                    );
                  })}
                </div>

                <div className="prediction-info">
                  <p><strong>📊 Rentang Suhu:</strong> {Math.min(...mlPredictions).toFixed(1)}°C - {Math.max(...mlPredictions).toFixed(1)}°C</p>
                  <p><strong>📈 Rata-rata:</strong> {(mlPredictions.reduce((a, b) => a + b, 0) / mlPredictions.length).toFixed(1)}°C</p>
                  <p><strong>🤖 Model:</strong> LSTM Neural Network dengan look-back 24 jam</p>
                  <p><strong>ℹ️ Info:</strong> Prediksi ini dihasilkan dari model machine learning yang dilatih menggunakan data historis cuaca</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}