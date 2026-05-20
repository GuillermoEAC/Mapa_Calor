import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import { Share2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de Categorías
// ─────────────────────────────────────────────────────────────────────────────
const TIPOS_INCIDENTES = {
  1: { nombre: "Robo / Asalto", color: "#ef4444" },        // Rojo
  2: { nombre: "Vandalismo", color: "#f97316" },           // Naranja
  3: { nombre: "Fallo de Alumbrado", color: "#eab308" },   // Amarillo
  4: { nombre: "Actividad Sospechosa", color: "#8b5cf6" }, // Morado
};

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
const MapaInteractivo = ({ ubicacionTemporal, onMapClick, compartirParams }) => {
  const centroLosMochis = [25.7904, -108.9858];
  const [puntosRaw, setPuntosRaw] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState(compartirParams?.filtro || "todos");
  const [configMapa, setConfigMapa] = useState({
    radio_puntos: 500,
    opacidad_puntos: 0.15
  });
  const [mapCenter, setMapCenter] = useState(compartirParams ? [compartirParams.lat, compartirParams.lng] : centroLosMochis);
  const [mapZoom, setMapZoom] = useState(compartirParams?.zoom || 13);
  const [toastVisible, setToastVisible] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Componente interno: rastrea centro/zoom del mapa y aplica compartirParams
  // ─────────────────────────────────────────────────────────────────────────────
  const ShareHandler = () => {
    const map = useMap();

    // Volar a las coordenadas compartidas al montar
    useEffect(() => {
      if (compartirParams) {
        map.flyTo([compartirParams.lat, compartirParams.lng], compartirParams.zoom, { duration: 1.5 });
      }
    }, []);

    // Escuchar eventos de movimiento y zoom para rastrear posición actual
    useMapEvents({
      moveend() {
        const center = map.getCenter();
        setMapCenter([center.lat, center.lng]);
      },
      zoomend() {
        setMapZoom(map.getZoom());
      },
    });

    return null;
  };

  // Copiar enlace al portapapeles
  const compartirVista = () => {
    const url = `${window.location.origin}${window.location.pathname}?lat=${mapCenter[0].toFixed(5)}&lng=${mapCenter[1].toFixed(5)}&zoom=${mapZoom}&filtro=${filtroActivo}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2000);
    }).catch(() => {
      alert("No se pudo copiar el enlace.");
    });
  };

  const ClickHandler = () => {
    useMapEvents({
      click(e) {
        if (onMapClick) onMapClick([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar puntos
        const resPuntos = await fetch("http://localhost:3000/api/reportes/aprobados");
        const datosPuntos = await resPuntos.json();
        
        const validos = datosPuntos.reduce((acc, p) => {
          const lat = parseFloat(p.latitud);
          const lng = parseFloat(p.longitud);
          if (!isNaN(lat) && !isNaN(lng)) {
            acc.push({ 
              lat, 
              lng, 
              tipo: p.id_tipo,
              descripcion: p.descripcion,
              fecha: p.fecha_registro
            });
          }
          return acc;
        }, []);
        setPuntosRaw(validos);

        // Cargar configuración (CU 8)
        const resConfig = await fetch("http://localhost:3000/api/config");
        const datosConfig = await resConfig.json();
        if (datosConfig) setConfigMapa(datosConfig);

      } catch (error) {
        console.error("Error cargando datos del mapa:", error);
      }
    };
    cargarDatos();
  }, []);

  // Filtrar los puntos según la categoría seleccionada
  const puntosFiltrados = puntosRaw.filter(p => 
    filtroActivo === "todos" ? true : p.tipo.toString() === filtroActivo
  );

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          Panel flotante de Filtros - UI Glassmorphic Oscuro
          ───────────────────────────────────────────────────────────────────────────── */}
      <div 
        className="glass-card animate-fade-in"
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "240px",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "800", color: "#f8fafc", letterSpacing: "1px", textTransform: "uppercase" }}>Filtrar Mapa</h3>
        
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#cbd5e1", padding: "6px 10px", borderRadius: "8px", background: filtroActivo === "todos" ? "rgba(255,255,255,0.06)" : "transparent" }}>
          <input 
            type="radio" 
            name="filtro_mapa" 
            checked={filtroActivo === "todos"} 
            onChange={() => setFiltroActivo("todos")} 
            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#8b5cf6" }}
          />
          <span style={{ fontWeight: filtroActivo === "todos" ? "600" : "400" }}>Todos los incidentes</span>
        </label>

        {Object.entries(TIPOS_INCIDENTES).map(([id, info]) => (
          <label key={id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#cbd5e1", padding: "6px 10px", borderRadius: "8px", background: filtroActivo === id ? "rgba(255,255,255,0.06)" : "transparent" }}>
            <input 
              type="radio" 
              name="filtro_mapa" 
              checked={filtroActivo === id} 
              onChange={() => setFiltroActivo(id)} 
              style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#8b5cf6" }}
            />
            <span style={{ 
              display: "inline-block", 
              width: "10px", 
              height: "10px", 
              borderRadius: "50%", 
              backgroundColor: info.color,
              boxShadow: `0 0 8px ${info.color}`
            }}></span>
            <span style={{ fontWeight: filtroActivo === id ? "600" : "400" }}>{info.nombre}</span>
          </label>
        ))}
      </div>

      <MapContainer
        center={centroLosMochis}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <ClickHandler />
        <ShareHandler />

        {/* 
          Círculos de calor: 
          Radio de 500 metros fijos. 
          Al no tener `colorPorDensidad`, su opacidad es fija en 0.15,
          lo cual naturalmente suma sus opacidades logrando un efecto de "foco rojo"
          cuando se superponen múltiples de la misma categoría.
        */}
        {puntosFiltrados.map((p, i) => {
          const infoTipo = TIPOS_INCIDENTES[p.tipo] || { color: "#8b5cf6" };
          return (
            <Circle
              key={i}
              center={[p.lat, p.lng]}
              radius={configMapa.radio_puntos} 
              pathOptions={{
                color: "transparent",
                fillColor: infoTipo.color,
                fillOpacity: configMapa.opacidad_puntos,
              }}
            >
              <Popup>
                <div style={{ minWidth: "150px" }}>
                  <h4 style={{ margin: "0 0 5px 0", color: infoTipo.color }}>
                    {infoTipo.nombre}
                  </h4>
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b" }}>
                    {new Date(p.fecha).toLocaleString()}
                  </p>
                  {p.descripcion ? (
                    <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", fontStyle: "italic" }}>
                      "{p.descripcion}"
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                      Sin descripción detallada.
                    </p>
                  )}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {ubicacionTemporal && (
          <Marker position={ubicacionTemporal}>
            <Popup>
              Estás aquí. <br /> Tu reporte anónimo se registrará en esta zona.
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ─────────────────────────────────────────────────────────────────────────────
          Botón flotante: Compartir Vista (CU-11)
          ───────────────────────────────────────────────────────────────────────────── */}
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
          boxShadow: "0 10px 25px rgba(59, 130, 246, 0.35)",
        }}
      >
        <Share2 size={16} />
        Compartir Vista
      </button>

      {/* Toast "¡Enlace copiado!" */}
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
          <span style={{ display: "inline-flex", padding: "3px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </span>
          ¡Enlace copiado al portapapeles!
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;
