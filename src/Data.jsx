import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  MapPin, 
  Database, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import './Data.css';

export default function Data() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [stats, setStats] = useState({
    odp: { total: 0, recent: 0 },
    odc: { total: 0, recent: 0 },
    pop: { total: 0, recent: 0 }
  });
  const [cityStats, setCityStats] = useState([]);
  const [recentPoles, setRecentPoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cities = [
    { id: "batam", name: "Batam", lat: 1.0456, lng: 104.0305 },
    { id: "jakarta", name: "Jakarta", lat: -6.2088, lng: 106.8456 },
    { id: "medan", name: "Medan", lat: 3.5952, lng: 98.6722 },
    { id: "pekanbaru", name: "Pekanbaru", lat: 0.5071, lng: 101.4478 },
    { id: "tarutung", name: "Tarutung", lat: 2.0143, lng: 98.9667 }
  ];

  useEffect(() => {
    const savedTheme = sessionStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    sessionStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const types = ['odp', 'odc', 'pop'];
        const results = await Promise.all(
          types.map(type =>
            fetch(`http://localhost:5000/api/poles/${type}`)
              .then(res => res.json())
              .catch(() => [])
          )
        );

        const newStats = {
          odp: { total: results[0].length, recent: results[0].slice(0, 5).length },
          odc: { total: results[1].length, recent: results[1].slice(0, 5).length },
          pop: { total: results[2].length, recent: results[2].slice(0, 5).length }
        };
        setStats(newStats);

        const allPoles = results.flatMap((arr, i) => 
          arr.map(p => ({ ...p, type: types[i] }))
        );

        const recent = allPoles
          .sort((a, b) => b.id - a.id)
          .slice(0, 10);
        setRecentPoles(recent);

        const cityDistribution = cities.map(city => {
          const polesInCity = allPoles.filter(pole => 
            distanceKm(city.lat, city.lng, pole.lat, pole.lon) <= 20
          );
          return {
            name: city.name,
            odp: polesInCity.filter(p => p.type === 'odp').length,
            odc: polesInCity.filter(p => p.type === 'odc').length,
            pop: polesInCity.filter(p => p.type === 'pop').length,
            total: polesInCity.length
          };
        });
        setCityStats(cityDistribution);

      } catch (err) {
        setError('Gagal memuat data. Pastikan backend berjalan di localhost:5000');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalPoles = stats.odp.total + stats.odc.total + stats.pop.total;

  if (loading) {
    return (
      <div className={`data-root ${isDark ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="loading-spinner-data">
            <Database className="spin-icon" />
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`data-root ${isDark ? 'dark' : 'light'}`}>
        <div className="error-container">
          <div className="error-card">
            <AlertCircle className="error-icon" />
            <p className="error-message">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-root ${isDark ? 'dark' : 'light'}`}>
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {isDark ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
      </button>

      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft className="back-icon" />
        <span>Kembali</span>
      </button>

      <div className="data-container">
        {/* Header */}
        <header className="data-header">
          <h1>Data Tiang Permana GIS</h1>
          <p>Real-time monitoring sistem distribusi jaringan fiber optik</p>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-icon-wrapper">
              <Database className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalPoles}</div>
              <div className="stat-label">Total Tiang</div>
              <div className="stat-sublabel">Semua jenis tiang</div>
            </div>
          </div>

          <div className="stat-card stat-card-cyan">
            <div className="stat-icon-wrapper">
              <MapPin className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.odp.total}</div>
              <div className="stat-label">ODP Poles</div>
              <div className="stat-sublabel">Distribution Point</div>
            </div>
          </div>

          <div className="stat-card stat-card-purple">
            <div className="stat-icon-wrapper">
              <Activity className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.odc.total}</div>
              <div className="stat-label">ODC Poles</div>
              <div className="stat-sublabel">Distribution Cabinet</div>
            </div>
          </div>

          <div className="stat-card stat-card-yellow">
            <div className="stat-icon-wrapper">
              <TrendingUp className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pop.total}</div>
              <div className="stat-label">POP Poles</div>
              <div className="stat-sublabel">Point of Presence</div>
            </div>
          </div>
        </div>

        {/* City Distribution & Recent Poles */}
        <div className="data-grid">
          {/* City Distribution */}
          <div className="data-card">
            <div className="card-header">
              <MapPin className="card-icon" />
              <h2 className="card-title">Distribusi per Kota</h2>
            </div>
            <div className="city-stats-container">
              {cityStats.map((city, idx) => (
                <div key={idx} className="city-stat-item">
                  <div className="city-stat-header">
                    <span className="city-name">{city.name}</span>
                    <span className="city-total">{city.total} tiang</span>
                  </div>
                  
                  <div className="progress-group">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar progress-bar-blue" 
                        style={{ width: `${city.total > 0 ? (city.odp / city.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="progress-label">ODP: {city.odp}</span>
                  </div>

                  <div className="progress-group">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar progress-bar-cyan" 
                        style={{ width: `${city.total > 0 ? (city.odc / city.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="progress-label">ODC: {city.odc}</span>
                  </div>

                  <div className="progress-group">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar progress-bar-yellow" 
                        style={{ width: `${city.total > 0 ? (city.pop / city.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="progress-label">POP: {city.pop}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Poles */}
          <div className="data-card">
            <div className="card-header">
              <Activity className="card-icon" />
              <h2 className="card-title">Data Terbaru</h2>
            </div>
            <div className="recent-poles-container">
              {recentPoles.map((pole, idx) => (
                <div key={idx} className="recent-pole-item">
                  <div className={`pole-indicator ${
                    pole.type === 'odp' ? 'pole-indicator-blue' : 
                    pole.type === 'odc' ? 'pole-indicator-cyan' : 'pole-indicator-yellow'
                  }`} />
                  <div className="pole-info">
                    <div className="pole-code">{pole.poles_code}</div>
                    <div className="pole-location">{pole.location || 'Lokasi tidak tersedia'}</div>
                  </div>
                  <span className={`pole-badge ${
                    pole.type === 'odp' ? 'pole-badge-blue' :
                    pole.type === 'odc' ? 'pole-badge-cyan' :
                    'pole-badge-yellow'
                  }`}>
                    {pole.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="data-card chart-card">
          <div className="card-header">
            <BarChart3 className="card-icon" />
            <h2 className="card-title">Perbandingan Jenis Tiang</h2>
          </div>
          <div className="chart-container">
            <div className="chart-bar-group">
              <div 
                className="chart-bar chart-bar-blue" 
                style={{ height: `${totalPoles > 0 ? (stats.odp.total / totalPoles) * 100 : 0}%` }}
              >
                <div className="chart-bar-shine" />
              </div>
              <div className="chart-value">{stats.odp.total}</div>
              <div className="chart-label">ODP</div>
            </div>

            <div className="chart-bar-group">
              <div 
                className="chart-bar chart-bar-cyan" 
                style={{ height: `${totalPoles > 0 ? (stats.odc.total / totalPoles) * 100 : 0}%` }}
              >
                <div className="chart-bar-shine" />
              </div>
              <div className="chart-value">{stats.odc.total}</div>
              <div className="chart-label">ODC</div>
            </div>

            <div className="chart-bar-group">
              <div 
                className="chart-bar chart-bar-yellow" 
                style={{ height: `${totalPoles > 0 ? (stats.pop.total / totalPoles) * 100 : 0}%` }}
              >
                <div className="chart-bar-shine" />
              </div>
              <div className="chart-value">{stats.pop.total}</div>
              <div className="chart-label">POP</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="data-footer">
          <p>© 2025 Permana GIS Data - Monitoring sistem distribusi fiber optik</p>
        </footer>
      </div>
    </div>
  );
}