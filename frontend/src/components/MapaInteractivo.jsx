import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import { Share2, ListFilter, X, User } from "lucide-react";
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
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
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

// ─────────────────────────────────────────────────────────────────────────────
// Componente: Marcador individual de incidente — Memoizado
// ─────────────────────────────────────────────────────────────────────────────
const IncidenteMarker = memo(({ punto }) => {
  const infoTipo = TIPOS_INCIDENTES[punto.tipo] || { color: "#8b5cf6", nombre: "Desconocido" };
  
  // Memoizar el icono para evitar regenerarlo innecesariamente en re-renders
  const customIcon = useMemo(() => crearIconoPersonalizado(infoTipo.color, punto.tipo), [infoTipo.color, punto.tipo]);

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
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [estiloMapaActivo, setEstiloMapaActivo] = useState("google_hibrido");

  const mapRef = useRef(null);

  const obtenerMiUbicacion = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const { latitude, longitude } = posicion.coords;
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
  const [mapCenter, setMapCenter] = useState(
    compartirParams ? [compartirParams.lat, compartirParams.lng] : CENTRO_LOS_MOCHIS
  );
  const [mapZoom, setMapZoom] = useState(compartirParams?.zoom || 13);
  const [toastVisible, setToastVisible] = useState(false);

  // Callbacks estables para el MapTracker
  const handleCenterChange = useCallback((c) => setMapCenter(c), []);
  const handleZoomChange = useCallback((z) => setMapZoom(z), []);

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
    const url = `${window.location.origin}${window.location.pathname}?lat=${mapCenter[0].toFixed(5)}&lng=${mapCenter[1].toFixed(5)}&zoom=${mapZoom}&filtro=${filtroStr}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
      })
      .catch(() => alert("No se pudo copiar el enlace."));
  }, [mapCenter, mapZoom, filtrosActivos]);

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

  // ── Puntos filtrados (memoizado) ──
  const puntosFiltrados = useMemo(
    () => puntosRaw.filter((p) => filtrosActivos.has(p.tipo.toString())),
    [puntosRaw, filtrosActivos]
  );

  // ── Datos del heatmap (memoizado para evitar re-crear el array) ──
  const heatData = useMemo(
    () => puntosFiltrados.map((p) => [p.lat, p.lng, 0.7]),
    [puntosFiltrados]
  );

  const heatRadio = useMemo(
    () => (configMapa.radio_puntos ? Math.min(configMapa.radio_puntos / 10, 50) : 35),
    [configMapa.radio_puntos]
  );

  const todosActivos = filtrosActivos.size === 4;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Botón flotante para mostrar filtros si están ocultos */}
      {!mostrarFiltros && (
        <button
          onClick={() => setMostrarFiltros(true)}
          className="btn-premium btn-secondary"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            padding: "10px 14px",
            fontSize: "13.5px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ListFilter size={16} />
          Filtrar Mapa
        </button>
      )}

      {/* ── Panel flotante de Filtros ── */}
      {mostrarFiltros && (
        <div
          className="glass-card animate-fade-in"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            zIndex: 1000,
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minWidth: "240px",
            background: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: "800",
                color: "#f8fafc",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Filtrar Mapa
            </h3>
            <button
              onClick={() => setMostrarFiltros(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Ocultar filtros"
              onMouseEnter={(e) => e.currentTarget.style.color = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              <X size={16} />
            </button>
          </div>

        {/* Checkbox: Todos */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            fontSize: "13.5px",
            color: "#cbd5e1",
            padding: "6px 10px",
            borderRadius: "8px",
            background: todosActivos ? "rgba(255,255,255,0.06)" : "transparent",
          }}
        >
          <input
            type="checkbox"
            checked={todosActivos}
            onChange={toggleTodos}
            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#8b5cf6" }}
          />
          <span style={{ fontWeight: todosActivos ? "600" : "400" }}>Todos los incidentes</span>
        </label>

        {/* Checkboxes individuales */}
        {Object.entries(TIPOS_INCIDENTES).map(([id, info]) => {
          const activo = filtrosActivos.has(id);
          return (
            <label
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                fontSize: "13.5px",
                color: "#cbd5e1",
                padding: "6px 10px",
                borderRadius: "8px",
                background: activo ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={activo}
                onChange={() => toggleFiltro(id)}
                style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: info.color }}
              />
              <span
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: info.color,
                  opacity: activo ? 1 : 0.4,
                }}
              />
              <span style={{ fontWeight: activo ? "600" : "400", opacity: activo ? 1 : 0.5 }}>
                {info.nombre}
              </span>
            </label>
          );
        })}

        {/* Selector de Estilo */}
        <h3
          style={{
            margin: "10px 0 4px 0",
            fontSize: "14px",
            fontWeight: "800",
            color: "#f8fafc",
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "15px",
          }}
        >
          Estilo de Mapa
        </h3>
        <select
          value={estiloMapaActivo}
          onChange={(e) => setEstiloMapaActivo(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.06)",
            color: "#cbd5e1",
            border: "1px solid rgba(255,255,255,0.1)",
            outline: "none",
            cursor: "pointer",
            fontSize: "13.5px",
            fontFamily: "inherit",
          }}
        >
          {Object.entries(ESTILOS_MAPA).map(([id, info]) => (
            <option key={id} value={id} style={{ background: "#0f172a" }}>
              {info.nombre}
            </option>
          ))}
        </select>
      </div>
      )}

      {/* ── Mapa ── */}
      <MapContainer
        center={CENTRO_LOS_MOCHIS}
        zoom={13}
        minZoom={10}
        maxBounds={MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        preferCanvas={true}
      >
        <MapRefRegister setMap={(map) => { mapRef.current = map; }} />
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
