import React, { useState, useEffect, useMemo } from "react";
import { History, Search, Calendar, MapPin, RefreshCw, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../config";

const TIPOS_COLORES = {
  "Robo / Asalto": { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
  "Vandalismo": { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "rgba(249, 115, 22, 0.3)" },
  "Fallo de Alumbrado": { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15", border: "rgba(234, 179, 8, 0.3)" },
  "Actividad Sospechosa": { bg: "rgba(139, 92, 246, 0.15)", text: "#c084fc", border: "rgba(139, 92, 246, 0.3)" },
};

const HistoricoReportes = ({ token }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const cargarHistorico = async () => {
    setLoading(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/historico`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const datos = await respuesta.json();
      setReportes(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorico();
  }, []);

  const reportesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return reportes;
    const q = busqueda.toLowerCase();
    return reportes.filter(
      (r) =>
        (r.descripcion && r.descripcion.toLowerCase().includes(q)) ||
        (r.tipo_incidente && r.tipo_incidente.toLowerCase().includes(q)) ||
        String(r.id_reporte).includes(q)
    );
  }, [reportes, busqueda]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Barra de título y búsqueda */}
      <div
        className="admin-card"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 700,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <History size={22} color="#38bdf8" />
            <span>Histórico de Reportes Depurados</span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
            Archivo histórico de incidentes archivados (más de 30 días de antigüedad).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Input de Búsqueda */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#71717a",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: "8px 14px 8px 36px",
                fontSize: "13px",
                borderRadius: "10px",
                width: "220px",
                backgroundColor: "rgba(24, 24, 27, 0.8)",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            />
          </div>

          <button
            onClick={cargarHistorico}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#f4f4f5",
              fontSize: "12.5px",
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="admin-card" style={{ padding: "60px 20px", textAlign: "center", color: "#a1a1aa" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid #27272a",
              borderTop: "3px solid #38bdf8",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px auto",
            }}
          />
          <span style={{ fontSize: "14px" }}>Cargando registros históricos...</span>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="admin-card" style={{ padding: "50px 20px", textAlign: "center", color: "#a1a1aa" }}>
          <History size={36} color="#52525b" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#f4f4f5" }}>
            {busqueda ? "No se encontraron coincidencias" : "No hay reportes en el historial"}
          </h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "#71717a" }}>
            {busqueda ? "Intenta con otro término de búsqueda" : "Los reportes archivados aparecerán aquí automáticamente."}
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo de Incidente</th>
                  <th>Descripción</th>
                  <th>Fecha de Registro</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.map((rep) => {
                  const estiloBadge = TIPOS_COLORES[rep.tipo_incidente] || {
                    bg: "rgba(255, 255, 255, 0.08)",
                    text: "#f4f4f5",
                    border: "rgba(255, 255, 255, 0.15)",
                  };

                  return (
                    <tr key={rep.id_reporte}>
                      <td style={{ color: "#71717a", fontFamily: "monospace", fontWeight: 600 }}>
                        #{rep.id_reporte}
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            backgroundColor: estiloBadge.bg,
                            color: estiloBadge.text,
                            border: `1px solid ${estiloBadge.border}`,
                          }}
                        >
                          {rep.tipo_incidente}
                        </span>
                      </td>
                      <td style={{ maxWidth: "320px" }}>
                        {rep.descripcion ? (
                          <span style={{ color: "#e4e4e7", fontSize: "13px" }}>
                            "{rep.descripcion}"
                          </span>
                        ) : (
                          <span style={{ color: "#71717a", fontSize: "12px", fontStyle: "italic" }}>
                            Sin descripción
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "#a1a1aa", fontSize: "12.5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="#71717a" />
                          <span>{new Date(rep.fecha_registro).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <a
                          href={`https://www.google.com/maps?q=${rep.latitud},${rep.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            color: "#38bdf8",
                            fontSize: "12px",
                            textDecoration: "none",
                            background: "rgba(56, 189, 248, 0.08)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                          }}
                        >
                          <MapPin size={12} />
                          <span>{Number(rep.latitud).toFixed(4)}, {Number(rep.longitud).toFixed(4)}</span>
                          <ExternalLink size={10} style={{ marginLeft: "2px" }} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoReportes;
