import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, useMap, ZoomControl } from "react-leaflet";
import { Share2, X, User, SlidersHorizontal, Check, Calendar } from "lucide-react";
import { API_BASE_URL } from "../config";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes estáticas (fuera del componente para evitar re-creación)
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_INCIDENTES = {
  1: { nombre: "Robo / Asalto", color: "#ef4444" },
  2: { nombre: "Vandalismo", color: "#f97316" },
  3: { nombre: "Fallo de Alumbrado", color: "#eab308" },
  4: { nombre: "Actividad Sospechosa", color: "#8b5cf6" },
};

const ESTILOS_MAPA = {
  google_hibrido: {
    nombre: "Satélite + Calles",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  },
  oscuro: {
    nombre: "Modo Oscuro",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  google_maps: {
    nombre: "Mapa de Calles",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  },
  estandar: {
    nombre: "Estándar (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  satelite_puro: {
    nombre: "Satélite Puro (Sin Calles)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};

const HEAT_GRADIENT = {
  0.0: "rgba(0, 0, 255, 0)",
  0.2: "#3b82f6",
  0.4: "#06b6d4",
  0.5: "#22c55e",
  0.7: "#eab308",
  0.85: "#f97316",
  1.0: "#ef4444",
};

const CENTRO_LOS_MOCHIS = [25.7904, -108.9858];
const MAX_BOUNDS = [
  [25.5, -109.3],
  [26.1, -108.7],
];

const MapRefRegister = ({ setMap }) => {
  const map = useMap();
  useEffect(() => {
    setMap(map);
    return () => setMap(null);
  }, [map, setMap]);
  return null;
};

const DarkModeManager = ({ isDark }) => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    if (isDark) {
      container.classList.add("mapa-modo-oscuro");
    } else {
      container.classList.remove("mapa-modo-oscuro");
    }
  }, [isDark, map]);
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Capa de Mapa de Calor (leaflet.heat) — Memoizado
// ─────────────────────────────────────────────────────────────────────────────
const HeatLayer = memo(({ puntos, radio, blur }) => {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    // Limpiar capa anterior
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }

    if (!puntos || puntos.length === 0) return;

    heatRef.current = L.heatLayer(puntos, {
      radius: radio,
      blur: blur,
      maxZoom: 17,
      max: 1.0,
      gradient: HEAT_GRADIENT,
    });

    heatRef.current.addTo(map);

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map, puntos, radio, blur]);

  return null;
});

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Manejo de clicks en el mapa — Memoizado
// ─────────────────────────────────────────────────────────────────────────────
const ClickHandler = memo(({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
});

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Rastreo de posición y vuelo a compartir — Memoizado
// ─────────────────────────────────────────────────────────────────────────────
const MapTracker = memo(({ compartirParams, onCenterChange, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    if (compartirParams) {
      map.flyTo([compartirParams.lat, compartirParams.lng], compartirParams.zoom, { duration: 1.5 });
    }
  }, []); // Solo al montar

  useMapEvents({
    moveend() {
      const c = map.getCenter();
      onCenterChange([c.lat, c.lng]);
    },
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });

  return null;
});

// Helper para generar iconos personalizados y realistas con efecto 3D y brillo
const crearIconoPersonalizado = (color, tipo) => {
  let svgIcon = '';
  if (tipo === 1) { // Robo / Asalto
    svgIcon = `<path d="M12 2L2 22h20L12 2zm1 18h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>`;
  } else if (tipo === 2) { // Vandalismo
    svgIcon = `<path d="M22.7 19l-9.1-9.1c.9-2.1.4-4.7-1.5-6.6-2-2-5.1-2.4-7.5-1.2L9 6.5 6.5 9 2.1 4.6C.9 7 1.3 10.1 3.3 12.1c1.9 1.9 4.5 2.4 6.6 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.4-.4.4-1.1 0-1.4z" fill="currentColor"/>`;
  } else if (tipo === 3) { // Alumbrado
    svgIcon = `<path d="M12 2C7.58 2 4 5.58 4 10c0 2.52 1.16 4.77 3 6.28V20c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-3.72c1.84-1.51 3-3.76 3-6.28 0-4.42-3.58-8-8-8zm1 16h-2v-1h2v1zm1.5-3.32c-.52.34-.84.93-.84 1.57v.75h-3.32v-.75c0-.64-.32-1.23-.84-1.57C8.17 13.9 7 12.08 7 10c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.08-1.17 3.9-2.5 4.68z" fill="currentColor"/>`;
  } else { // Sospechoso
    svgIcon = `<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>`;
  }

  const html = `
    <div class="custom-marker-wrapper">
      <div class="pin-marker" style="background-color: ${color};">
        <svg viewBox="0 0 24 24" width="12" height="12" style="display: block; color: #ffffff;">
          ${svgIcon}
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// ── OPTIMIZACIÓN: Pre-generar los 4 iconos posibles una sola vez para no instanciarlos por cada marcador ──
const ICONOS_CACHE = {
  1: crearIconoPersonalizado(TIPOS_INCIDENTES[1].color, 1),
  2: crearIconoPersonalizado(TIPOS_INCIDENTES[2].color, 2),
  3: crearIconoPersonalizado(TIPOS_INCIDENTES[3].color, 3),
  4: crearIconoPersonalizado(TIPOS_INCIDENTES[4].color, 4),
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Marcador individual de incidente — Memoizado
// ─────────────────────────────────────────────────────────────────────────────
const IncidenteMarker = memo(({ punto }) => {
  const infoTipo = TIPOS_INCIDENTES[punto.tipo] || { color: "#8b5cf6", nombre: "Desconocido" };
  
  // Usar el icono pre-generado desde la caché (O(1) memoria en lugar de O(N))
  const customIcon = ICONOS_CACHE[punto.tipo] || ICONOS_CACHE[1];

  return (
    <Marker
      position={[punto.lat, punto.lng]}
      icon={customIcon}
    >
      <Popup>
        <div style={{ minWidth: "180px", fontFamily: "Outfit, sans-serif", padding: "4px" }}>
          <h4 style={{ margin: "0 0 5px 0", color: infoTipo.color, fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: infoTipo.color }}></span>
            {infoTipo.nombre}
          </h4>
          <p style={{ margin: "0 0 10px 0", fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
            {new Date(punto.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
          {punto.descripcion ? (
            <p style={{ 
              margin: 0, 
              fontSize: "12.5px", 
              color: "#cbd5e1", 
              background: "rgba(255,255,255,0.03)", 
              padding: "8px 10px", 
              borderRadius: "8px", 
              borderLeft: `3px solid ${infoTipo.color}`,
              lineHeight: "1.4",
              fontStyle: "italic"
            }}>
              "{punto.descripcion}"
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Sin descripción detallada.</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal — MapaInteractivo
// ─────────────────────────────────────────────────────────────────────────────
const MapaInteractivo = ({ ubicacionTemporal, onMapClick, compartirParams }) => {
  const [puntosRaw, setPuntosRaw] = useState([]);
  // Filtros: Set con IDs de tipo activos. Inicia con todos activos.
  const [filtrosActivos, setFiltrosActivos] = useState(new Set(["1", "2", "3", "4"]));
  const [estiloMapaActivo, setEstiloMapaActivo] = useState("google_hibrido");

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [filtroTiempo, setFiltroTiempo] = useState("todos"); // '24h' | '7d' | '30d' | 'todos'

  const [miUbicacionActual, setMiUbicacionActual] = useState(null);
  const mapRef = useRef(null);

  const obtenerMiUbicacion = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const { latitude, longitude } = posicion.coords;
          setMiUbicacionActual([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 17, { duration: 1.5 });
          }
        },
        (error) => {
          alert("No se pudo obtener tu ubicación actual. Asegúrate de activar los permisos de GPS de tu navegador.");
        }
      );
    } else {
      alert("Tu navegador no admite geolocalización.");
    }
  }, []);
  const [configMapa, setConfigMapa] = useState({ radio_puntos: 500 });
  
  // ── OPTIMIZACIÓN: Usar refs en lugar de estado para la posición del mapa. 
  // Esto evita re-renderizar todo el árbol de marcadores cada vez que se mueve el mapa.
  const mapCenterRef = useRef(compartirParams ? [compartirParams.lat, compartirParams.lng] : CENTRO_LOS_MOCHIS);
  const mapZoomRef = useRef(compartirParams?.zoom || 13);
  const [toastVisible, setToastVisible] = useState(false);

  // Callbacks estables para el MapTracker
  const handleCenterChange = useCallback((c) => { mapCenterRef.current = c; }, []);
  const handleZoomChange = useCallback((z) => { mapZoomRef.current = z; }, []);

  // ── Toggle de filtro individual ──
  const toggleFiltro = useCallback((id) => {
    setFiltrosActivos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Seleccionar/deseleccionar todos ──
  const toggleTodos = useCallback(() => {
    setFiltrosActivos((prev) => {
      if (prev.size === 4) return new Set(); // Si todos activos, quitar todos
      return new Set(["1", "2", "3", "4"]); // Si no, activar todos
    });
  }, []);

  // ── Compartir vista ──
  const compartirVista = useCallback(() => {
    const filtroStr = [...filtrosActivos].join(",");
    const center = mapCenterRef.current;
    const zoom = mapZoomRef.current;
    const url = `${window.location.origin}${window.location.pathname}?lat=${center[0].toFixed(5)}&lng=${center[1].toFixed(5)}&zoom=${zoom}&filtro=${filtroStr}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
      })
      .catch(() => alert("No se pudo copiar el enlace."));
  }, [filtrosActivos]);

  // ── Carga de datos (una sola vez) ──
  useEffect(() => {
    let cancelado = false;
    const cargarDatos = async () => {
      try {
        const [resPuntos, resConfig] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reportes/aprobados`),
          fetch(`${API_BASE_URL}/api/config`),
        ]);
        if (cancelado) return;

        const datosPuntos = await resPuntos.json();
        const datosConfig = await resConfig.json();

        const validos = [];
        for (const p of datosPuntos) {
          const lat = parseFloat(p.latitud);
          const lng = parseFloat(p.longitud);
          if (!isNaN(lat) && !isNaN(lng)) {
            validos.push({
              lat,
              lng,
              tipo: p.id_tipo,
              descripcion: p.descripcion,
              fecha: p.fecha_registro,
            });
          }
        }
        setPuntosRaw(validos);
        if (datosConfig) setConfigMapa(datosConfig);
      } catch (error) {
        console.error("Error cargando datos del mapa:", error);
      }
    };
    cargarDatos();
    return () => { cancelado = true; };
  }, []);

  // ── Puntos filtrados por categoría y por tiempo (memoizado) ──
  const puntosFiltrados = useMemo(() => {
    const ahora = Date.now();
    return puntosRaw.filter((p) => {
      // 1. Filtro por categoría de incidente
      if (!filtrosActivos.has(p.tipo.toString())) return false;

      // 2. Filtro por rango temporal
      if (filtroTiempo === "todos") return true;
      if (!p.fecha) return true;

      const tiempoPunto = new Date(p.fecha).getTime();
      if (isNaN(tiempoPunto)) return true;

      const diffHoras = (ahora - tiempoPunto) / (1000 * 60 * 60);
      if (filtroTiempo === "24h") return diffHoras <= 24;
      if (filtroTiempo === "7d") return diffHoras <= 24 * 7;
      if (filtroTiempo === "30d") return diffHoras <= 24 * 30;

      return true;
    });
  }, [puntosRaw, filtrosActivos, filtroTiempo]);

  // ── Datos del heatmap (memoizado para evitar re-crear el array) ──
  const heatData = useMemo(
    () => puntosFiltrados.map((p) => [p.lat, p.lng, 0.7]),
    [puntosFiltrados]
  );

  const heatRadio = useMemo(
    () => (configMapa.radio_puntos ? Math.min(configMapa.radio_puntos / 10, 50) : 35),
    [configMapa.radio_puntos]
  );

  // Conteo en tiempo real según el filtro temporal activo
  const conteoPorTipo = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const ahora = Date.now();

    puntosRaw.forEach((p) => {
      let cumpleTiempo = true;
      if (filtroTiempo !== "todos" && p.fecha) {
        const tiempoPunto = new Date(p.fecha).getTime();
        if (!isNaN(tiempoPunto)) {
          const diffHoras = (ahora - tiempoPunto) / (1000 * 60 * 60);
          if (filtroTiempo === "24h") cumpleTiempo = diffHoras <= 24;
          else if (filtroTiempo === "7d") cumpleTiempo = diffHoras <= 24 * 7;
          else if (filtroTiempo === "30d") cumpleTiempo = diffHoras <= 24 * 30;
        }
      }

      if (cumpleTiempo && counts[p.tipo] !== undefined) {
        counts[p.tipo]++;
      }
    });
    return counts;
  }, [puntosRaw, filtroTiempo]);

  const todosActivos = filtrosActivos.size === 4;

  const textoTiempo = {
    todos: "",
    "30d": " (últimos 30 días)",
    "7d": " (últimos 7 días)",
    "24h": " (últimas 24h)",
  }[filtroTiempo];

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* ── Contador flotante de incidentes visibles ── */}
      <div 
        className="glass-pill animate-fade-in"
        style={{
          position: "absolute",
          top: "80px",
          left: "20px",
          zIndex: 1000,
          padding: "7px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          fontWeight: 600,
          color: "#e2e8f0",
          boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
        }}
      >
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }} />
        <span>{puntosFiltrados.length} {puntosFiltrados.length === 1 ? "incidente visible" : "incidentes visibles"}{textoTiempo}</span>
      </div>

      {/* ── Botón flotante para abrir Drawer de Filtros y Capas ── */}
      <button
        onClick={() => setDrawerAbierto(true)}
        className="btn-action glass-pill animate-fade-in"
        style={{
          position: "absolute",
          top: "80px",
          right: "20px",
          zIndex: 1000,
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
        }}
      >
        <SlidersHorizontal size={15} />
        Filtros y Capas ({filtrosActivos.size}/4)
      </button>

      {/* ── Drawer Lateral Deslizante ── */}
      {drawerAbierto && (
        <>
          {/* Backdrop suave */}
          <div
            onClick={() => setDrawerAbierto(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.5)",
              zIndex: 1400,
            }}
          />

          <div
            className="animate-fade-in"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "320px",
              maxWidth: "85vw",
              background: "#18181b",
              borderLeft: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "-10px 0 35px rgba(0,0,0,0.6)",
              zIndex: 1500,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              overflowY: "auto",
            }}
          >
            {/* Header del drawer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                  <SlidersHorizontal size={18} color="#38bdf8" /> Filtros y Capas
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  Personaliza los incidentes en el mapa
                </p>
              </div>
              <button
                onClick={() => setDrawerAbierto(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "8px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sección incidentes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#a1a1aa" }}>
                  Tipos de Incidentes
                </span>
                <button
                  onClick={toggleTodos}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#38bdf8",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {todosActivos ? "Desmarcar todos" : "Seleccionar todos"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(TIPOS_INCIDENTES).map(([id, info]) => {
                  const activo = filtrosActivos.has(id);
                  const count = conteoPorTipo[id] || 0;
                  return (
                    <div
                      key={id}
                      onClick={() => toggleFiltro(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: activo ? "rgba(255, 255, 255, 0.05)" : "transparent",
                        border: `1px solid ${activo ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)"}`,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: info.color }} />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: activo ? "#f4f4f5" : "#71717a" }}>
                          {info.nombre}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "10px" }}>
                          {count}
                        </span>
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `1.5px solid ${activo ? "#38bdf8" : "#52525b"}`,
                            background: activo ? "#38bdf8" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {activo && <Check size={13} color="#09090b" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección: Período de Tiempo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={13} color="#38bdf8" /> Rango Temporal
                </span>
                {filtroTiempo !== "todos" && (
                  <button
                    onClick={() => setFiltroTiempo("todos")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#38bdf8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Restablecer
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { id: "todos", label: "Histórico Todo", sub: "Todos los registros" },
                  { id: "30d", label: "Último Mes", sub: "30 días" },
                  { id: "7d", label: "Última Semana", sub: "7 días" },
                  { id: "24h", label: "Hoy", sub: "Últimas 24 horas" },
                ].map((item) => {
                  const activo = filtroTiempo === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setFiltroTiempo(item.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: activo ? "rgba(56, 189, 248, 0.14)" : "rgba(255, 255, 255, 0.03)",
                        border: `1px solid ${activo ? "#38bdf8" : "rgba(255, 255, 255, 0.06)"}`,
                        color: activo ? "#38bdf8" : "#94a3b8",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "2px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 600, color: activo ? "#38bdf8" : "#f4f4f5" }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: "10px", color: activo ? "#7dd3fc" : "#71717a" }}>
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sección estilos de mapa */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#a1a1aa" }}>
                Estilo del Mapa Base
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Object.entries(ESTILOS_MAPA).map(([id, info]) => {
                  const seleccionado = estiloMapaActivo === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setEstiloMapaActivo(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        background: seleccionado ? "rgba(56, 189, 248, 0.12)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${seleccionado ? "#38bdf8" : "rgba(255,255,255,0.05)"}`,
                        color: seleccionado ? "#38bdf8" : "#a1a1aa",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span>{info.nombre}</span>
                      {seleccionado && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Mapa ── */}
      <MapContainer
        center={CENTRO_LOS_MOCHIS}
        zoom={13}
        minZoom={10}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        className={estiloMapaActivo === "oscuro" ? "mapa-modo-oscuro" : ""}
        preferCanvas={true}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <MapRefRegister setMap={(map) => { mapRef.current = map; }} />
        <DarkModeManager isDark={estiloMapaActivo === "oscuro"} />
        <TileLayer
          key={estiloMapaActivo}
          url={ESTILOS_MAPA[estiloMapaActivo].url}
          attribution="&copy; OpenStreetMap contributors"
        />

        <ClickHandler onMapClick={onMapClick} />
        <MapTracker
          compartirParams={compartirParams}
          onCenterChange={handleCenterChange}
          onZoomChange={handleZoomChange}
        />

        {/* Capa de calor */}
        <HeatLayer puntos={heatData} radio={heatRadio} blur={20} />

        {/* Marcadores individuales para popups */}
        {puntosFiltrados.map((p, i) => (
          <IncidenteMarker key={`${p.lat}-${p.lng}-${i}`} punto={p} />
        ))}

        {ubicacionTemporal && (
          <Marker position={ubicacionTemporal}>
            <Popup>
              Estás aquí. <br /> Tu reporte anónimo se registrará en esta zona.
            </Popup>
          </Marker>
        )}

        {/* Punto azul indicador estilo Google Maps */}
        {miUbicacionActual && (
          <>
            <CircleMarker
              center={miUbicacionActual}
              radius={16}
              pathOptions={{
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
                color: "transparent",
                interactive: false,
              }}
            />
            <CircleMarker
              center={miUbicacionActual}
              radius={7}
              pathOptions={{
                fillColor: "#3b82f6",
                fillOpacity: 1,
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                interactive: false,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* ── Botón flotante: Mi Ubicación ── */}
      <button
        onClick={obtenerMiUbicacion}
        className="btn-premium btn-purple"
        style={{
          position: "absolute",
          bottom: "85px",
          left: "20px",
          zIndex: 1000,
          padding: "12px 22px",
          fontSize: "14px",
        }}
      >
        <User size={16} />
        Mi Ubicación
      </button>

      {/* ── Botón flotante: Compartir Vista ── */}
      <button
        onClick={compartirVista}
        className="btn-premium btn-primary"
        style={{
          position: "absolute",
          bottom: "30px",
          left: "20px",
          zIndex: 1000,
          padding: "12px 22px",
          fontSize: "14px",
        }}
      >
        <Share2 size={16} />
        Compartir Vista
      </button>

      {/* ── Toast ── */}
      {toastVisible && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            bottom: "88px",
            left: "20px",
            zIndex: 1000,
            backgroundColor: "rgba(16, 185, 129, 0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "white",
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "13.5px",
            fontWeight: "600",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              padding: "3px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
          ¡Enlace copiado al portapapeles!
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;
