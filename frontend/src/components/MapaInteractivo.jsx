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
          Panel flotante de Filtros
          ───────────────────────────────────────────────────────────────────────────── */}
      <div 
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          minWidth: "200px"
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", color: "#1E293B" }}>Filtrar Mapa</h3>
        
        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
          <input 
            type="radio" 
            name="filtro_mapa" 
            checked={filtroActivo === "todos"} 
            onChange={() => setFiltroActivo("todos")} 
          />
          Todos
        </label>

        {Object.entries(TIPOS_INCIDENTES).map(([id, info]) => (
          <label key={id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px" }}>
            <input 
              type="radio" 
              name="filtro_mapa" 
              checked={filtroActivo === id} 
              onChange={() => setFiltroActivo(id)} 
            />
            <span style={{ 
              display: "inline-block", 
              width: "12px", 
              height: "12px", 
              borderRadius: "50%", 
              backgroundColor: info.color 
            }}></span>
            {info.nombre}
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
        style={{
          position: "absolute",
          bottom: "30px",
          left: "20px",
          zIndex: 1000,
          backgroundColor: "#3B82F6",
          color: "white",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}
      >
        <Share2 size={18} />
        Compartir Vista
      </button>

      {/* Toast "¡Enlace copiado!" */}
      {toastVisible && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "20px",
            zIndex: 1000,
            backgroundColor: "#10B981",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          ¡Enlace copiado!
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;
