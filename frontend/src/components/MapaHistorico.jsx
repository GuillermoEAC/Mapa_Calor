import React, { useMemo, useEffect, useRef, useState, memo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";

const ESTILOS_HISTORICO = {
  google_hibrido: {
    nombre: "Satélite + Calles",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
  oscuro: {
    nombre: "Modo Oscuro",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
  google_maps: {
    nombre: "Mapa de Calles",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
};

// Gradiente donde los sub-nodos (<0.26) permanecen 100% invisibles en segundo plano
// y solo se muestran al sumarse formando 1 sola mancha orgánica
const HEAT_GRADIENT = {
  0.00: "rgba(250, 204, 21, 0)",
  0.26: "rgba(250, 204, 21, 0)",    // Sub-puntos en segundo plano (invisibles por sí solos)
  0.40: "rgba(250, 204, 21, 0.42)", // Halo exterior suave cuando se unen al núcleo
  0.58: "#eab308",                  // Amarillo cálido (Densidad baja-media)
  0.75: "#f97316",                  // Naranja intenso (Densidad media-alta)
  0.88: "#ef4444",                  // Rojo alerta (Densidad alta)
  1.00: "#7f1d1d",                  // Núcleo carmesí oscuro (Concentración crítica)
};

const PESO_TERMICO_TIPO = {
  1: 0.85,
  2: 0.55,
  3: 0.42,
  4: 0.48,
  5: 0.80,
  6: 0.40,
  7: 0.65,
  8: 0.78,
  9: 0.75,
};

// 4 sub-nodos que se fusionan en 1 sola huella orgánica sin separarse en gotas sueltas
const generarHuellaOrganica = (id, lat, lng, tipo) => {
  const peso = PESO_TERMICO_TIPO[tipo] || 0.65;
  const seed = (Number(id) || 1) * 2654435761 + Math.round((lat + lng) * 100000);
  const rand = (n) => {
    const x = Math.sin(seed + n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  // Nodo central + 3 sub-nodos invisibles cercanos (~20m a ~50m) que solo deforman el contorno al sumarse
  const nodos = [[lat, lng, peso]];
  for (let k = 1; k <= 3; k++) {
    const angulo = rand(k) * Math.PI * 2;
    const distGrados = 0.00018 + rand(k + 10) * 0.00030;
    const elongacion = k === 1 ? 1.2 : 0.9;
    const dLat = Math.cos(angulo) * distGrados * elongacion;
    const dLng = Math.sin(angulo) * distGrados;
    // Peso bajo (<0.25) para que quede invisible en segundo plano salvo al fusionarse en 1
    const subPeso = +(Math.min(0.24, peso * (0.32 - k * 0.05))).toFixed(2);
    nodos.push([lat + dLat, lng + dLng, subPeso]);
  }
  return nodos;
};

const DarkModeManager = memo(({ isDark }) => {
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
});

const HeatmapLayer = memo(({ heatData, boundsCoords }) => {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (boundsCoords && boundsCoords.length > 0) {
        const bounds = L.latLngBounds(boundsCoords);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
      }
    }, 60);

    const layer = L.heatLayer(heatData || [], {
      radius: 26,
      blur: 34,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.02,
      gradient: HEAT_GRADIENT,
    });
    layer.addTo(map);
    heatRef.current = layer;

    return () => {
      clearTimeout(timer);
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!heatRef.current) return;
    heatRef.current.setLatLngs(heatData || []);
    if (boundsCoords && boundsCoords.length > 0) {
      const bounds = L.latLngBounds(boundsCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
    }
  }, [heatData, boundsCoords, map]);

  return null;
});

const MapaHistorico = ({ reportes, sinLimite, onToggleSinLimite, cargando }) => {
  const [estilo, setEstilo] = useState("google_hibrido");

  const { heatData, boundsCoords, totalValidos } = useMemo(() => {
    const heat = [];
    const coords = [];

    if (Array.isArray(reportes)) {
      for (let i = 0; i < reportes.length; i++) {
        const r = reportes[i];
        const lat = parseFloat(r.latitud);
        const lng = parseFloat(r.longitud);
        if (!isNaN(lat) && !isNaN(lng)) {
          coords.push([lat, lng]);
          const nodos = generarHuellaOrganica(r.id_reporte || i, lat, lng, r.id_tipo);
          for (let j = 0; j < nodos.length; j++) {
            heat.push(nodos[j]);
          }
        }
      }
    }

    return { heatData: heat, boundsCoords: coords, totalValidos: coords.length };
  }, [reportes]);

  if (totalValidos === 0) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#18181b", color: "#a1a1aa", borderRadius: "12px" }}>
        No hay coordenadas válidas para mostrar.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", position: "relative", overflow: "hidden" }}>
      {/* Controles superiores del mapa histórico */}
      <div style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "6px",
        background: "rgba(24, 24, 27, 0.94)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "6px 10px",
        borderRadius: "10px",
      }}>
        <span style={{ fontSize: "12px", color: "#a1a1aa", paddingRight: "4px" }}>
          <strong style={{ color: "#10b981" }}>{totalValidos}</strong> reportes
        </span>

        {onToggleSinLimite && (
          <button
            onClick={onToggleSinLimite}
            disabled={cargando}
            style={{
              padding: "4px 10px",
              fontSize: "11.5px",
              fontWeight: 700,
              borderRadius: "6px",
              border: `1px solid ${sinLimite ? "#10b981" : "rgba(255,255,255,0.12)"}`,
              background: sinLimite ? "rgba(16, 185, 129, 0.18)" : "rgba(255,255,255,0.04)",
              color: sinLimite ? "#34d399" : "#d4d4d8",
              cursor: cargando ? "wait" : "pointer",
            }}
            title="Cargar todos los reportes de la base de datos sin límite de cantidad"
          >
            {cargando ? "Cargando..." : sinLimite ? "✓ Sin límite activo" : "Sin límite de puntos"}
          </button>
        )}

        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.12)", margin: "0 2px" }} />

        {Object.entries(ESTILOS_HISTORICO).map(([id, info]) => {
          const activo = estilo === id;
          return (
            <button
              key={id}
              onClick={() => setEstilo(id)}
              style={{
                padding: "4px 10px",
                fontSize: "11.5px",
                fontWeight: 600,
                borderRadius: "6px",
                border: `1px solid ${activo ? "#38bdf8" : "rgba(255,255,255,0.08)"}`,
                background: activo ? "rgba(56, 189, 248, 0.15)" : "transparent",
                color: activo ? "#38bdf8" : "#a1a1aa",
                cursor: "pointer",
              }}
            >
              {info.nombre}
            </button>
          );
        })}
      </div>

      <MapContainer
        center={[25.7904, -108.9858]}
        zoom={13}
        preferCanvas={true}
        style={{ height: "100%", width: "100%", background: "#09090b" }}
        zoomControl={false}
        attributionControl={false}
      >
        <DarkModeManager isDark={estilo === "oscuro"} />
        <TileLayer
          key={estilo}
          url={ESTILOS_HISTORICO[estilo].url}
          attribution={ESTILOS_HISTORICO[estilo].attribution}
          keepBuffer={4}
          updateWhenIdle={true}
        />

        <HeatmapLayer heatData={heatData} boundsCoords={boundsCoords} />
      </MapContainer>
    </div>
  );
};

export default memo(MapaHistorico);
