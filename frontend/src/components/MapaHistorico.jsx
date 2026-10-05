import React, { useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Necesario para el mapa de calor
import "leaflet.heat";

// Configuración de Leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Componente para cargar el Heatmap
const HeatmapLayer = ({ puntos }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!puntos || puntos.length === 0) return;

    // Convertir a formato que usa leaflet.heat: [lat, lng, intensidad]
    const heatData = puntos.map(p => [parseFloat(p.latitud), parseFloat(p.longitud), 0.8]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 35,
      blur: 20,
      maxZoom: 15,
      gradient: {
        0.2: "#fbbf24", // Amarillo (riesgo medio-bajo)
        0.5: "#f97316", // Naranja (riesgo alto)
        0.8: "#ef4444", // Rojo intenso (peligro crítico)
        1.0: "#991b1b", // Rojo oscuro (centro del peligro)
      },
    });

    heatLayer.addTo(map);

    // Ajustar vista para abarcar todos los puntos si hay
    if (heatData.length > 0) {
      const bounds = L.latLngBounds(heatData.map(p => [p[0], p[1]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [puntos, map]);

  return null;
};

const MapaHistorico = ({ reportes }) => {
  // Los reportes válidos con lat y lng
  const reportesValidos = useMemo(() => {
    return reportes.filter(r => !isNaN(parseFloat(r.latitud)) && !isNaN(parseFloat(r.longitud)));
  }, [reportes]);

  if (!reportesValidos || reportesValidos.length === 0) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#18181b", color: "#a1a1aa", borderRadius: "12px" }}>
        No hay coordenadas válidas para mostrar.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer
        center={[25.7928, -108.9902]} // Los Mochis por defecto
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#09090b" }}
        className="mapa-modo-oscuro"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <HeatmapLayer puntos={reportesValidos} />
      </MapContainer>
    </div>
  );
};

export default MapaHistorico;
