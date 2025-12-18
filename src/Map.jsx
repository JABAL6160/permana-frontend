// Map.jsx - Complete with Role-Based Access Control (No Logout)
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Map.css";

/* -----------------------
   ICONS & GLOBAL STYLES
   ----------------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const DEFAULT_ICON = new L.Icon.Default();
const PULSE_ICON = new L.Icon.Default({ className: "pulse-marker" });

/* -----------------------
   CONSTANTS & HELPERS
   ----------------------- */
const API_BASE = "http://localhost:5000/api";
const CITY_RADIUS_KM = 20;
const MAP_THEMES = ["voyager", "dark", "satellite"];

const CITIES = [
  { id: "batam", name: "Batam", lat: 1.0456, lng: 104.0305 },
  { id: "jakarta", name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { id: "medan", name: "Medan", lat: 3.5952, lng: 98.6722 },
  { id: "pekanbaru", name: "Pekanbaru", lat: 0.5071, lng: 101.4478 },
  { id: "tarutung", name: "Tarutung", lat: 2.0143, lng: 98.9667 },
];

const TILE_URLS = {
  voyager: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const TYPE_COLORS = { odp: "#007bff", odc: "#00c6ff", pop: "#ffd400" };

function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v == null || Number.isNaN(v))) return Infinity;
  const R = 6371;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* -----------------------
   PERMISSIONS HOOK
   ----------------------- */
function useUserPermissions() {
  const [permissions, setPermissions] = useState({
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canViewPorts: false,
    canEditPorts: false,
    role: null,
    username: null
  });

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const role = user.role || 'guest';

      setPermissions({
        canView: true,
        canAdd: ['staff', 'admin'].includes(role),
        canEdit: ['staff', 'admin'].includes(role),
        canDelete: role === 'admin',
        canViewPorts: ['staff', 'admin'].includes(role),
        canEditPorts: ['staff', 'admin'].includes(role),
        role: role,
        username: user.username || 'User'
      });
    }
  }, []);

  return permissions;
}

/* -----------------------
   MAP UTILITY COMPONENTS
   ----------------------- */
function SetMapCenter({ center, focusMode }) {
  const map = useMap();
  useEffect(() => {
    if (center?.lat != null && center?.lng != null) {
      if (focusMode === "user") {
        map.flyTo([center.lat, center.lng], 16, { animate: true, duration: 1.0 });
      } else if (focusMode === "city") {
        map.flyTo([center.lat, center.lng], 12, { animate: true, duration: 1.0 });
      } else {
        map.panTo([center.lat, center.lng], { animate: true, duration: 1.0 });
      }
    }
  }, [center, focusMode, map]);
  return null;
}

function FlyToActiveMarker({ activeKey, places }) {
  const map = useMap();
  useEffect(() => {
    if (!activeKey) return;
    const marker = places.find(p => `${p.type}-${p.id}` === activeKey);
    if (marker?.lat != null && marker?.lon != null) {
      map.panTo([marker.lat, marker.lon], { animate: true, duration: 0.9 });
    }
  }, [activeKey, places, map]);
  return null;
}

function DetectCityOnMove({ cities, setActiveCity, radiusKm = 20 }) {
  const map = useMap();
  useEffect(() => {
    const checkCity = () => {
      const center = map.getCenter();
      const nearby = cities.find(c => distanceKm(center.lat, center.lng, c.lat, c.lng) <= radiusKm);
      setActiveCity(nearby ? nearby.id : null);
    };
    checkCity();
    map.on("moveend", checkCity);
    return () => map.off("moveend", checkCity);
  }, [map, cities, setActiveCity, radiusKm]);
  return null;
}

function MapClickHandler({ setSearchQuery, setClickPoint, runSearchByCoords }) {
  const map = useMap();
  useEffect(() => {
    const onDoubleClick = async (e) => {
      const { lat, lng } = e.latlng;
      let placeName = "";
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        placeName = data?.display_name || "";
      } catch (err) {
        console.warn("Reverse geocode failed:", err);
      }
      const displayText = placeName ? `${lat.toFixed(6)},${lng.toFixed(6)} - ${placeName}` : `${lat.toFixed(6)},${lng.toFixed(6)}`;
      setSearchQuery(displayText);
      setClickPoint({ lat, lng, label: placeName || null });
      runSearchByCoords(lat, lng);
    };
    map.on("dblclick", onDoubleClick);
    return () => map.off("dblclick", onDoubleClick);
  }, [map, setSearchQuery, setClickPoint, runSearchByCoords]);
  return null;
}

function ResetActiveOnMapClick({ clearActive }) {
  const map = useMap();
  useEffect(() => {
    map.on("click", clearActive);
    return () => map.off("click", clearActive);
  }, [map, clearActive]);
  return null;
}

/* -----------------------
   ODP PORTS POPUP COMPONENT
   ----------------------- */
function ODPPortsPopup({ odpPole, permissions, onClose, position }) {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPort, setEditPort] = useState(null);

  useEffect(() => {
    fetchPorts();
  }, [odpPole.id]);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/odp/${odpPole.id}/ports`);
      const data = await res.json();
      setPorts(data || []);
    } catch (err) {
      console.error("Error fetch ports:", err);
      setPorts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePort = async (portNum) => {
    if (!editPort || !permissions.canEditPorts) {
      alert("⚠️ Anda tidak memiliki izin untuk mengedit port!");
      return;
    }
    try {
      await fetch(`${API_BASE}/odp/${odpPole.id}/ports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port_number: portNum,
          ip_address: editPort.ip_address,
          customer_name: editPort.customer_name,
          owner: editPort.owner || "",
          notes: editPort.notes || ""
        })
      });
      alert("✅ Port berhasil disimpan!");
      setEditPort(null);
      fetchPorts();
    } catch (err) {
      console.error("Error save port:", err);
      alert("❌ Gagal menyimpan port!");
    }
  };

  const handleDeletePort = async (portId) => {
    if (!permissions.canDelete) {
      alert("⚠️ Hanya Admin yang bisa menghapus port!");
      return;
    }
    if (!window.confirm("Yakin hapus data port ini?")) return;
    try {
      await fetch(`${API_BASE}/odp_ports/${portId}`, { method: "DELETE" });
      alert("✅ Port berhasil dihapus!");
      fetchPorts();
    } catch (err) {
      console.error("Error delete port:", err);
      alert("❌ Gagal menghapus port!");
    }
  };

  if (loading) {
    return (
      <div 
        className="port-popup-container"
        style={{
          position: 'fixed',
          top: position.y - 50,
          left: position.x + 105,
          zIndex: 9999
        }}
      >
        <div className="port-popup-loading">⏳ Loading ports...</div>
      </div>
    );
  }

  const usedCount = ports.length;

  return (
    <div 
      className="port-popup-container"
      style={{
        position: 'fixed',
        top: position.y - 250,
        left: position.x + 180,
        zIndex: 9999
      }}
    >
      <div className="port-popup-header">
        <h3>🔌 ODP Ports: {odpPole.poles_code}</h3>
        <button className="port-popup-close" onClick={onClose}>✕</button>
      </div>

      <div className="port-popup-info">
        <strong>Lokasi:</strong> {odpPole.location}<br />
        <strong>Status:</strong> {usedCount} / 16 port terisi
        {permissions.role && (
          <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#666' }}>
            Mode: <strong style={{ color: permissions.role === 'admin' ? '#28a745' : '#007bff' }}>
              {permissions.role === 'admin' ? 'Admin (Full Access)' : 'Staff (Edit Only)'}
            </strong>
          </div>
        )}
      </div>

      <div className="port-list-scroll">
        {Array.from({ length: 16 }, (_, i) => i + 1).map(portNum => {
          const portData = ports.find(p => p.port_number === portNum) || null;
          const isUsed = !!portData;
          const isEditing = editPort?.port_number === portNum;

          return (
            <div key={portNum} className={`port-item ${isUsed ? 'port-used' : 'port-free'}`}>
              <div className="port-item-header">
                <div className="port-checkbox-wrapper">
                  <input type="checkbox" checked={!!isUsed} disabled className="port-checkbox" />
                  <strong className="port-number">{portNum}/16</strong>
                </div>
              </div>

              {isEditing && permissions.canEditPorts ? (
                <div className="port-edit-form">
                  <input
                    type="text"
                    placeholder="IP: 192.168.x.x"
                    value={editPort.ip_address || ""}
                    onChange={(e) => setEditPort({ ...editPort, ip_address: e.target.value })}
                    className="port-input-small"
                  />
                  <input
                    type="text"
                    placeholder="Terhubung ke: PT. Contoh"
                    value={editPort.customer_name || ""}
                    onChange={(e) => setEditPort({ ...editPort, customer_name: e.target.value })}
                    className="port-input-small"
                  />
                  <input
                    type="text"
                    placeholder="Alamat: Jl. Ahmad Yani"
                    value={editPort.owner || ""}
                    onChange={(e) => setEditPort({ ...editPort, owner: e.target.value })}
                    className="port-input-small"
                  />
                  <div className="port-edit-actions-inline">
                    <button className="btn-save-small" onClick={() => handleSavePort(portNum)}>
                      💾 Simpan
                    </button>
                    <button className="btn-cancel-small" onClick={() => setEditPort(null)}>✕</button>
                  </div>
                </div>
              ) : (
                <>
                  {isUsed ? (
                    <div className="port-details">
                      <div className="port-detail-row">
                        <strong>IP:</strong> {portData.ip_address || "-"}
                      </div>
                      <div className="port-detail-row">
                        <strong>Terhubung ke:</strong> {portData.customer_name || "-"}
                      </div>
                      {portData.owner && (
                        <div className="port-detail-row port-location-row">
                          📍 {portData.owner || "-"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="port-empty-state">Port tersedia</div>
                  )}

                  {permissions.canEditPorts && (
                    <div className="port-actions-inline">
                      {isUsed ? (
                        <>
                          <button
                            className="btn-edit-small"
                            onClick={() => setEditPort({
                              port_number: portNum,
                              ip_address: portData.ip_address,
                              customer_name: portData.customer_name,
                              owner: portData.owner
                            })}
                          >
                            ✏️
                          </button>
                          {permissions.canDelete && (
                            <button
                              className="btn-delete-small"
                              onClick={() => handleDeletePort(portData.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="btn-add-small"
                          onClick={() => setEditPort({
                            port_number: portNum,
                            ip_address: "",
                            customer_name: "",
                            owner: ""
                          })}
                        >
                          ➕ Tambah
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------
   MARKER COMPONENT
   ----------------------- */
function PoleMarker({ pole, isActive, onClick, onConfirmDrag, onEdit, onDelete, permissions, onViewPorts, onClosePopup }) {
  const markerRef = useRef(null);
  const [draggable, setDraggable] = useState(false);
  const [originalPos, setOriginalPos] = useState([pole.lat, pole.lon]);

  useEffect(() => {
    if (isActive && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && pole.type === "odp" && permissions.canViewPorts && markerRef.current) {
      const marker = markerRef.current;
      const map = marker._map;
      if (map) {
        setTimeout(() => {
          const point = map.latLngToContainerPoint(marker.getLatLng());
          onViewPorts(pole, { x: point.x, y: point.y });
        }, 100);
      }
    }
  }, [isActive, pole.type, pole, onViewPorts, permissions.canViewPorts]);

  return (
    <Marker
      ref={markerRef}
      position={[pole.lat, pole.lon]}
      draggable={draggable && permissions.canEdit}
      icon={isActive ? PULSE_ICON : DEFAULT_ICON}
      eventHandlers={{
        click: () => {
          onClick(`${pole.type}-${pole.id}`);
        },
        dragstart: () => setOriginalPos([pole.lat, pole.lon]),
        dragend: () => {
          const marker = markerRef.current;
          if (marker) {
            const newPos = marker.getLatLng();
            setDraggable(false);
            onConfirmDrag(pole, newPos, originalPos, marker);
          }
        },
        popupclose: () => {
          if (pole.type === "odp" && typeof onClosePopup === "function") {
            onClosePopup();
          }
        }
      }}
    >
      <Popup>
        <div style={{ minWidth: 180 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{pole.poles_code}</strong>
            <span className={`badge ${pole.type ?? "odp"}`}>{(pole.type ?? "odp").toUpperCase()}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: "0.9rem" }}>{pole.location}</div>
            <div style={{ fontSize: "0.8rem", marginTop: 6 }}>Kabel: {pole.attached_cables ?? "-"}</div>
            <div style={{ fontSize: "0.8rem", marginTop: 6 }}>
              lat/lon: {Number(pole.lat).toFixed(6)}/{Number(pole.lon).toFixed(6)}
            </div>
          </div>

          {(permissions.canEdit || permissions.canDelete) && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {permissions.canEdit && (
                <>
                  <button 
                    style={{ fontSize: "0.85rem", padding: "6px 8px" }} 
                    onClick={() => onEdit(pole)}
                  >
                    ✏️ Edit
                  </button>
                  {!draggable ? (
                    <button 
                      style={{ fontSize: "0.85rem", padding: "6px 8px", background: "#0077ff", color: "#fff", border: "none", borderRadius: 6 }} 
                      onClick={() => setDraggable(true)}
                    >
                      🎯 Geser Koordinat
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "#ff8c00", alignSelf: "center" }}>
                      🎯 Geser marker lalu lepaskan
                    </span>
                  )}
                </>
              )}
              
              {permissions.canDelete && (
                <button 
                  style={{ fontSize: "0.85rem", padding: "6px 8px", color: "#fff", background: "#d9534f", border: "none", borderRadius: 6 }} 
                  onClick={() => onDelete(pole)}
                >
                  🗑️ Hapus
                </button>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

/* -----------------------
   MAIN COMPONENT
   ----------------------- */
export default function App() {
  const [user, setUser] = useState(null);
  const permissions = useUserPermissions();
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState({ lat: 2.0143, lng: 98.9667 });
  const [userLocation, setUserLocation] = useState(null);
  const [activeMarkerKey, setActiveMarkerKey] = useState(null);
  const [focusMode, setFocusMode] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [mapTheme, setMapTheme] = useState("voyager");
  const [poleType, setPoleType] = useState("all");
  const [editingPole, setEditingPole] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newPole, setNewPole] = useState({ poles_code: "", marking_date: "", location: "", attached_cables: "", lat: "", lon: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [clickPoint, setClickPoint] = useState(null);
  const [showConnections, setShowConnections] = useState(true);
  const [activeCityState, setActiveCityState] = useState(null);
  const [portPopupPole, setPortPopupPole] = useState(null);
  const [portPopupPosition, setPortPopupPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);
  const formRef = useRef(null);

  /* AUTH CHECK */
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      window.location.href = "./Login";
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
  }, []);

  /* THEME TOGGLE */
  useEffect(() => {
    const handleKey = (e) => {
      if (["input", "textarea", "select"].includes(e?.target?.tagName?.toLowerCase?.())) return;
      if (e.key?.toLowerCase?.() === "m") {
        setMapTheme(prev => {
          const idx = MAP_THEMES.indexOf(prev);
          return MAP_THEMES[(idx + 1) % MAP_THEMES.length];
        });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* FETCH POLES */
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoadingPlaces(true);
      try {
        const endpoints = poleType === "all" ? ["odp", "odc", "pop"] : [poleType];
        const results = await Promise.all(
          endpoints.map(t => fetch(`${API_BASE}/poles/${t}`).then(res => res.json()))
        );
        const merged = endpoints.flatMap((t, i) => 
          (results[i] || []).map(r => ({ ...r, type: t }))
        ).filter(p => p?.lat != null && p?.lon != null);
        if (!cancelled) setPlaces(merged);
      } catch (err) {
        console.error("Error fetch:", err);
        if (!cancelled) setPlaces([]);
      } finally {
        if (!cancelled) setLoadingPlaces(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [poleType]);

  /* HANDLERS */
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return alert("Geolocation tidak tersedia di browser ini.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setCenter(coords);
        setFocusMode("user");
      },
      (err) => {
        console.error("Gagal ambil lokasi:", err);
        alert("Gagal ambil lokasi. Pastikan izin lokasi diberikan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSelectCity = useCallback((city) => {
    setActiveMarkerKey(null);
    setCenter({ lat: city.lat, lng: city.lng });
    setFocusMode("city");
    setSearchResult(null);
    setSearchMarker(null);
    setActiveCityState(city.id);
  }, []);

  const runSearchByCoords = useCallback(async (lat, lng) => {
    if (lat == null || lng == null) return;
    setCenter({ lat, lng });
    setFocusMode("search");
    setSearchMarker({ lat, lng });

    try {
      const res = await fetch(`${API_BASE}/nearest_poles_ml?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (!data) return;

      const merged = [
        ...(data.odp_nearest || []).map(r => ({ ...r, type: "odp", color: "blue", distance_m: r.distance })),
        ...(data.odc_nearest || []).map(r => ({ ...r, type: "odc", color: "orange", distance_m: r.distance })),
        ...(data.pop_nearest || []).map(r => ({ ...r, type: "pop", color: "green", distance_m: r.distance }))
      ];

      setSearchResult(merged);
    } catch (err) {
      console.error("Error nearest (ML):", err);
      setSearchResult(null);
    }
  }, []);

  const handleSearch = useCallback(async (customQuery) => {
    const query = (customQuery ?? searchQuery ?? "").trim();
    if (!query) return;
    const coordMatch = query.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      await runSearchByCoords(lat, lon);
      return;
    }
    const city = CITIES.find(c => c.name.toLowerCase().includes(query.toLowerCase()));
    if (city) handleSelectCity(city);
    else alert("Kota tidak ditemukan atau format koordinat salah.");
  }, [searchQuery, runSearchByCoords, handleSelectCity]);

  /* CRUD OPERATIONS */
  const handleAddPole = useCallback(() => {
    if (!permissions.canAdd) return alert("⚠️ Anda tidak memiliki izin untuk menambah data!");
    if (poleType === "all") return alert("Pilih jenis tiang (ODP/ODC/POP) sebelum input data!");
    if (!newPole.lat || !newPole.lon || !newPole.poles_code) return alert("Lat, Lon, dan Kode Tiang wajib diisi!");
    
    fetch(`${API_BASE}/poles/${poleType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPole),
    })
      .then(res => res.json())
      .then(data => {
        alert("✅ Data berhasil ditambahkan!");
        setPlaces(prev => [...prev, { ...newPole, id: data.id, lat: parseFloat(newPole.lat), lon: parseFloat(newPole.lon), type: poleType }]);
        setNewPole({ poles_code: "", marking_date: "", location: "", attached_cables: "", lat: "", lon: "" });
      })
      .catch(err => console.error("Error tambah data:", err));
  }, [permissions.canAdd, poleType, newPole]);

  const handleEditPole = useCallback((pole) => {
    if (!permissions.canEdit) return alert("⚠️ Anda tidak memiliki izin untuk edit data!");
    setEditingPole(pole);
    setNewPole({ poles_code: pole.poles_code, marking_date: pole.marking_date, location: pole.location, attached_cables: pole.attached_cables, lat: pole.lat, lon: pole.lon });
    setPoleType(pole.type || poleType);
    setSidebarOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  }, [permissions.canEdit, poleType]);

  const handleUpdatePole = useCallback(() => {
    if (!permissions.canEdit) return alert("⚠️ Anda tidak memiliki izin untuk update data!");
    if (!editingPole) return;
    
    fetch(`${API_BASE}/poles/${poleType}/${editingPole.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPole),
    })
      .then(res => res.json())
      .then(() => {
        alert("✅ Data berhasil diperbarui!");
        setPlaces(prev => prev.map(p => (p.id === editingPole.id && p.type === poleType ? { ...newPole, id: p.id, lat: parseFloat(newPole.lat), lon: parseFloat(newPole.lon), type: poleType } : p)));
        setNewPole({ poles_code: "", marking_date: "", location: "", attached_cables: "", lat: "", lon: "" });
        setEditingPole(null);
      })
      .catch(err => console.error("Error update data:", err));
  }, [permissions.canEdit, editingPole, poleType, newPole]);

  const handleDeletePole = useCallback((pole) => {
    if (!permissions.canDelete) return alert("⚠️ Hanya Admin yang bisa menghapus data!");
    if (!window.confirm("Yakin mau hapus data ini?")) return;
    
    fetch(`${API_BASE}/poles/${pole.type || poleType}/${pole.id}`, { method: "DELETE" })
      .then(() => {
        alert("✅ Data berhasil dihapus!");
        setPlaces(prev => prev.filter(p => !(p.id === pole.id && p.type === pole.type)));
      })
      .catch(err => console.error("Error hapus data:", err));
  }, [permissions.canDelete, poleType]);

  const handleConfirmDrag = useCallback((pole, newPos, originalPos, marker) => {
    if (!permissions.canEdit) {
      marker.setLatLng(originalPos);
      return alert("⚠️ Anda tidak memiliki izin untuk mengubah koordinat!");
    }
    if (!window.confirm(`Update koordinat ${pole.poles_code} ke lokasi baru?`)) {
      marker.setLatLng(originalPos);
      return;
    }
    
    const updated = { ...pole, lat: newPos.lat, lon: newPos.lng };
    fetch(`${API_BASE}/poles/${pole.type || poleType}/${pole.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    })
      .then(res => res.json())
      .then(() => {
        setPlaces(prev => prev.map(p => (p.id === pole.id && p.type === pole.type ? updated : p)));
        alert("✅ Koordinat berhasil diperbarui!");
      })
      .catch(err => {
        console.error("Error update drag:", err);
        marker.setLatLng(originalPos);
      });
  }, [permissions.canEdit, poleType]);

  const handleFormKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editingPole ? handleUpdatePole() : handleAddPole();
    }
  }, [editingPole, handleUpdatePole, handleAddPole]);

  /* UTILITIES */
  const filteredPlaces = useMemo(() => {
    if (!activeCityState) return places;
    const city = CITIES.find(c => c.id === activeCityState);
    if (!city) return places;
    return places.filter(p => {
      const plat = parseFloat(p.lat);
      const plon = parseFloat(p.lon);
      return distanceKm(city.lat, city.lng, plat, plon) <= CITY_RADIUS_KM;
    });
  }, [places, activeCityState]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResult(null);
    setSearchMarker(null);
    setClickPoint(null);
  }, []);

  const colorForType = useCallback((t) => TYPE_COLORS[t] || TYPE_COLORS.odp, []);

  if (!user) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "1.5rem" }}>Loading...</div>;
  }

  /* RENDER */
  return (
    <div className={`app-root ${mapTheme}-mode`}>
      {portPopupPole && permissions.canViewPorts && (
        <ODPPortsPopup
          odpPole={portPopupPole}
          permissions={permissions}
          onClose={() => setPortPopupPole(null)}
          position={portPopupPosition}
        />
      )}

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(s => !s)}
        style={{
          position: "absolute",
          top: 20,
          left: sidebarOpen ? 420 : 20,
          zIndex: 1000,
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 15px",
          cursor: "pointer",
          fontSize: "1.05rem",
          transition: "left 0.25s ease",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      <div className={`sidebar-container ${sidebarOpen ? "open" : "closed"}`}>
        <aside className="sidebar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2>Permana GIS</h2>
            <span style={{ 
              fontSize: "0.85rem", 
              padding: "4px 10px", 
              background: permissions.role === 'admin' ? "#28a745" : permissions.role === 'staff' ? "#007bff" : "#6c757d", 
              color: "white", 
              borderRadius: 6, 
              fontWeight: 600 
            }}>
              {permissions.role === 'admin' ? "👤 Admin" : permissions.role === 'staff' ? "👨‍💼 Staff" : "👁️ Guest"}
            </span>
          </div>

          <div className="nav-buttons">
            <a href="/" className="nav-link dashboard">← Dashboard</a>
            {permissions.role !== 'guest' && <a href="/Data" className="nav-link data">→ Data Tiang</a>}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button className="locate-btn" onClick={locateUser}>📍 My Position</button>
            <button style={{ padding: "8px 12px", borderRadius: 8 }} onClick={() => setMapTheme(prev => {
              const idx = MAP_THEMES.indexOf(prev);
              return MAP_THEMES[(idx + 1) % MAP_THEMES.length];
            })}>
              🗺️ Theme
            </button>
          </div>

          <section>
            <h3>Search Lokasi / Koordinat</h3>
            <input type="text" placeholder="Ketik tempat atau lat,lon" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSearch()} style={{ width: "80%", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => handleSearch()}>🔍 Cari</button>
              <button onClick={() => clearSearch()}>✖️ Clear</button>
              <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={showConnections} onChange={() => setShowConnections(s => !s)} />
                <span style={{ fontSize: "0.9rem" }}>Rekomendasi terdekat</span>
              </label>
            </div>

            {searchResult && (
              <div style={{ marginTop: 10, fontSize: "0.85rem" }}>
                <b>Rekomendasi Tiang Terdekat:</b>
                <ul style={{ marginTop: 6 }}>
                  {searchResult.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700 }}>{r.poles_code}</span> <small>({r.type?.toUpperCase()})</small><br />
                      <small>{r.location ?? "-"}</small><br />
                      <small style={{ color: "#333" }}>{Math.round(r.distance_m)} m</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section>
            <h3>Pilih Kota</h3>
            <ul className="city-list">
              {CITIES.map(city => (
                <li key={city.id} className={activeCityState === city.id ? "active" : ""} onClick={() => handleSelectCity(city)} style={{ cursor: "pointer", padding: "6px 4px" }}>
                  {city.name}
                </li>
              ))}
            </ul>
          </section>

          <div style={{ margin: "10px 0" }}>
            <label>Pilih Jenis Tiang: </label>
            <select value={poleType} onChange={(e) => setPoleType(e.target.value)}>
              <option value="all">All</option>
              <option value="odp">ODP</option>
              <option value="odc">ODC</option>
              <option value="pop">POP</option>
            </select>
          </div>

          {permissions.canAdd && (
            <div style={{ margin: "10px 0" }} ref={formRef}>
              <h3>{editingPole ? "Edit Tiang" : "Tambah Tiang"}</h3>
              {poleType === "all" && !editingPole ? (
                <p style={{ fontSize: "0.9rem", color: "gray" }}>🔒 Pilih ODP/ODC/POP dulu untuk tambah data</p>
              ) : (
                <>
                  <input placeholder="Kode Tiang" value={newPole.poles_code} onChange={(e) => setNewPole({ ...newPole, poles_code: e.target.value })} onKeyPress={handleFormKeyPress} />
                  <input placeholder="Tanggal Marking" value={newPole.marking_date} onChange={(e) => setNewPole({ ...newPole, marking_date: e.target.value })} onKeyPress={handleFormKeyPress} />
                  <input placeholder="Lokasi" value={newPole.location} onChange={(e) => setNewPole({ ...newPole, location: e.target.value })} onKeyPress={handleFormKeyPress} />
                  <input placeholder="Jenis Kabel" value={newPole.attached_cables} onChange={(e) => setNewPole({ ...newPole, attached_cables: e.target.value })} onKeyPress={handleFormKeyPress} />
                  <input placeholder="Latitude" value={newPole.lat} onChange={(e) => setNewPole({ ...newPole, lat: e.target.value })} onKeyPress={handleFormKeyPress} />
                  <input placeholder="Longitude" value={newPole.lon} onChange={(e) => setNewPole({ ...newPole, lon: e.target.value })} onKeyPress={handleFormKeyPress} />
                  {editingPole ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleUpdatePole}>Update</button>
                      <button onClick={() => { setEditingPole(null); setNewPole({ poles_code: "", marking_date: "", location: "", attached_cables: "", lat: "", lon: "" }); }} style={{ background: "#888" }}>Batal</button>
                    </div>
                  ) : (
                    <button onClick={handleAddPole}>Tambah</button>
                  )}
                </>
              )}
            </div>
          )}

          <hr />
          <div style={{ maxHeight: "40vh", overflow: "auto" }}>
            {loadingPlaces ? <p>Loading...</p> : (
              <>
                {activeCityState && (
                  <div style={{ padding: "6px 0", color: "#333" }}>
                    Menampilkan data di area: <b>{CITIES.find(c => c.id === activeCityState)?.name}</b>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>Radius: {CITY_RADIUS_KM} km dari pusat kota</div>
                  </div>
                )}

                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {filteredPlaces.map(p => (
                    <li key={`${p.type}-${p.id}`} className={activeMarkerKey === `${p.type}-${p.id}` ? "active" : ""} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <b>{p.poles_code}</b><br />
                          <small>{p.location}</small>
                        </div>
                        <div>
                          <span className={`badge ${p.type ?? "odp"}`}>{(p.type ?? "ODP").toUpperCase()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
                        <small>{p.marking_date} • {p.attached_cables}</small><br />
                        <small>lat/lon: {Number(p.lat).toFixed(6)}/{Number(p.lon).toFixed(6)}</small>
                      </div>
                      <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {permissions.canEdit && (
                          <>
                            <button onClick={() => handleEditPole(p)}>✏️ Edit</button>
                          </>
                        )}
                        {permissions.canDelete && (
                          <button onClick={() => handleDeletePole(p)}>🗑️ Hapus</button>
                        )}
                        <button onClick={() => { setCenter({ lat: p.lat, lng: p.lon }); setActiveMarkerKey(`${p.type}-${p.id}`); setFocusMode("pole"); }}>➡️ Go</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>

      <main className="map-wrap" ref={mapRef}>
        <MapContainer center={[center.lat, center.lng]} zoom={14} minZoom={5} maxZoom={19} scrollWheelZoom style={{ height: "100%", width: "100%" }} attributionControl={false} maxBounds={[[-90, -180], [90, 180]]} maxBoundsViscosity={1.0}>
          <SetMapCenter center={center} focusMode={focusMode} />
          <FlyToActiveMarker activeKey={activeMarkerKey} places={places} />
          <DetectCityOnMove cities={CITIES} setActiveCity={setActiveCityState} radiusKm={CITY_RADIUS_KM} />
          <MapClickHandler setSearchQuery={setSearchQuery} setClickPoint={setClickPoint} runSearchByCoords={runSearchByCoords} />
          <ResetActiveOnMapClick clearActive={() => { setActiveMarkerKey(null); setPortPopupPole(null); }} />

          {searchResult && searchResult.map((item, i) => (
            <Marker key={`nearest-${item.type}-${i}`} position={[item.lat, item.lon]}>
              <Popup>
                <b>{item.poles_code}</b> ({item.type.toUpperCase()})<br />
                <small>Jarak: {Math.round(item.distance_m)} m</small>
              </Popup>
            </Marker>
          ))}

          <TileLayer noWrap attribution={mapTheme === "satellite" ? 'Tiles © Esri — Source: Esri' : '&copy; OSM &copy; CARTO'} url={TILE_URLS[mapTheme]} subdomains={mapTheme === "satellite" ? [] : ["a", "b", "c", "d"]} />

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} key="user-loc">
              <Popup>
                <b>My Position</b><br />
                lat,lon: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </Popup>
            </Marker>
          )}

          {clickPoint && (
            <CircleMarker center={[clickPoint.lat, clickPoint.lng]} radius={9} pathOptions={{ color: "#ff4d4d", fillColor: "#ff7b7b", fillOpacity: 0.9 }}>
              <Popup>
                <div>
                  <strong>Clicked point</strong><br />
                  {clickPoint.label && <small>{clickPoint.label}</small>}
                  <div><small>{Number(clickPoint.lat).toFixed(6)}, {Number(clickPoint.lng).toFixed(6)}</small></div>
                </div>
              </Popup>
            </CircleMarker>
          )}

          {searchMarker && (
            <CircleMarker center={[searchMarker.lat, searchMarker.lng]} radius={7} pathOptions={{ color: "#222", fillColor: "#00c6ff", fillOpacity: 0.9 }}>
              <Popup>
                <b>Search</b><br />
                lat,lon: {Number(searchMarker.lat).toFixed(6)}, {Number(searchMarker.lng).toFixed(6)}
              </Popup>
            </CircleMarker>
          )}

          {showConnections && searchResult && searchMarker && searchResult.map((r, idx) => {
            if (!r || r.lat == null || r.lon == null) return null;
            const from = [searchMarker.lat, searchMarker.lng];
            const to = [r.lat, r.lon];
            const midLat = (searchMarker.lat + r.lat) / 2;
            const midLng = (searchMarker.lng + r.lon) / 2;
            return (
              <React.Fragment key={`conn-${idx}`}>
                <Polyline positions={[from, to]} pathOptions={{ color: colorForType(r.type), weight: 3, dashArray: "6,6" }} />
                <CircleMarker center={[midLat, midLng]} radius={6} pathOptions={{ color: "#222", fillColor: colorForType(r.type), fillOpacity: 0.9 }}>
                  <Popup>
                    <div>
                      <strong>{r.poles_code}</strong><br />
                      {r.type?.toUpperCase()} • {Math.round(r.distance_m)} m
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {filteredPlaces.map(p => (
            <PoleMarker 
              key={`${p.type}-${p.id}`} 
              pole={p} 
              isActive={activeMarkerKey === `${p.type}-${p.id}`} 
              onClick={k => setActiveMarkerKey(k)} 
              onConfirmDrag={handleConfirmDrag} 
              onEdit={handleEditPole} 
              onDelete={handleDeletePole} 
              permissions={permissions}
              onViewPorts={(pole, position) => {
                setPortPopupPole(pole);
                setPortPopupPosition(position);
              }}
              onClosePopup={() => setPortPopupPole(null)}
            />
          ))}
        </MapContainer>
      </main>
    </div>
  );
}