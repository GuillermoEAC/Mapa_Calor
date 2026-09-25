import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Clock, MapPin, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../config";

const TIPOS_COLORES = {
  "Robo / Asalto": { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
  "Vandalismo": { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "rgba(249, 115, 22, 0.3)" },
  "Fallo de Alumbrado": { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15", border: "rgba(234, 179, 8, 0.3)" },
  "Actividad Sospechosa": { bg: "rgba(139, 92, 246, 0.15)", text: "#c084fc", border: "rgba(139, 92, 246, 0.3)" },
};

const PanelAdmin = ({ token }) => {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargarReportes = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/reportes/pendientes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const datos = await respuesta.json();
      setReportes(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const cambiarEstado = async (id, estado) => {
    setProcesandoId(id);
    try {
      await fetch(`${API_BASE_URL}/api/reportes/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nuevo_estado: estado }),
      });

      await cargarReportes();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Barra de título y métricas */}
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
            <ShieldCheck size={22} color="#38bdf8" />
            <span>Moderación de Reportes Ciudadanos</span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
            Revisa los reportes enviados por la comunidad antes de que impacten el mapa de calor público.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              background: "rgba(24, 24, 27, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "8px 14px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#a1a1aa" }}>Pendientes:</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: reportes.length > 0 ? "#f59e0b" : "#10b981",
              }}
            >
              {reportes.length}
            </span>
          </div>

          <button
            onClick={cargarReportes}
            disabled={cargando}
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
              cursor: cargando ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: cargando ? "spin 0.8s linear infinite" : "none" }} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {cargando && reportes.length === 0 ? (
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
          <span style={{ fontSize: "14px" }}>Cargando reportes pendientes...</span>
        </div>
      ) : reportes.length === 0 ? (
        <div
          className="admin-card"
          style={{
            padding: "50px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#f4f4f5" }}>
            Bandeja de moderación limpia
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa", maxWidth: "420px" }}>
            No hay reportes pendientes de revisión en este momento. Todos los incidentes reportados han sido procesados.
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
                  <th>Fecha y Hora</th>
                  <th>Ubicación</th>
                  <th style={{ textAlign: "right", paddingRight: "24px" }}>Acción Moderador</th>
                </tr>
              </thead>
              <tbody>
                {reportes.map((rep) => {
                  const estiloBadge = TIPOS_COLORES[rep.tipo_incidente] || {
                    bg: "rgba(255, 255, 255, 0.08)",
                    text: "#f4f4f5",
                    border: "rgba(255, 255, 255, 0.15)",
                  };
                  const estaProcesando = procesandoId === rep.id_reporte;

                  return (
                    <tr key={rep.id_reporte} style={{ opacity: estaProcesando ? 0.5 : 1 }}>
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
                      <td style={{ maxWidth: "280px" }}>
                        {rep.descripcion ? (
                          <span style={{ color: "#e4e4e7", fontSize: "13px", lineHeight: "1.4" }}>
                            "{rep.descripcion}"
                          </span>
                        ) : (
                          <span style={{ color: "#71717a", fontSize: "12px", fontStyle: "italic" }}>
                            Sin descripción adicional
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "#a1a1aa", fontSize: "12.5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Clock size={13} color="#71717a" />
                          <span>{new Date(rep.fecha_registro).toLocaleString()}</span>
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
                      <td style={{ textAlign: "right", paddingRight: "24px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => cambiarEstado(rep.id_reporte, "APROBADO")}
                            disabled={estaProcesando}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              cursor: estaProcesando ? "wait" : "pointer",
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#34d399",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(16, 185, 129, 0.28)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Aprobar</span>
                          </button>

                          <button
                            onClick={() => cambiarEstado(rep.id_reporte, "RECHAZADO")}
                            disabled={estaProcesando}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "7px 12px",
                              borderRadius: "8px",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              cursor: estaProcesando ? "wait" : "pointer",
                              background: "rgba(244, 63, 94, 0.15)",
                              border: "1px solid rgba(244, 63, 94, 0.3)",
                              color: "#fb7185",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(244, 63, 94, 0.28)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(244, 63, 94, 0.15)";
                            }}
                          >
                            <XCircle size={14} />
                            <span>Rechazar</span>
                          </button>
                        </div>
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

export default PanelAdmin;
