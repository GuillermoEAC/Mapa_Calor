import React, { useState, useEffect, useMemo } from "react";
import { History, Search, Calendar, MapPin, RefreshCw, ExternalLink, Map as MapIcon, X } from "lucide-react";
import { API_BASE_URL } from "../config";
import MapaHistorico from "./MapaHistorico";

const TIPOS_COLORES = {
  "Robo / Asalto": { bg: "rgba(239, 68, 68, 0.14)", text: "#ef4444", border: "rgba(239, 68, 68, 0.35)" },
  "Vandalismo": { bg: "rgba(249, 115, 22, 0.14)", text: "#f97316", border: "rgba(249, 115, 22, 0.35)" },
  "Fallo de Alumbrado": { bg: "rgba(234, 179, 8, 0.14)", text: "#eab308", border: "rgba(234, 179, 8, 0.35)" },
  "Actividad Sospechosa": { bg: "rgba(139, 92, 246, 0.14)", text: "#a855f7", border: "rgba(139, 92, 246, 0.35)" },
  "Acoso / Zona Insegura": { bg: "rgba(236, 72, 153, 0.14)", text: "#ec4899", border: "rgba(236, 72, 153, 0.35)" },
  "Fuga de Agua": { bg: "rgba(14, 165, 233, 0.14)", text: "#0ea5e9", border: "rgba(14, 165, 233, 0.35)" },
  "Accidente Vehicular": { bg: "rgba(6, 182, 212, 0.14)", text: "#06b6d4", border: "rgba(6, 182, 212, 0.35)" },
  "Incendio / Maleza": { bg: "rgba(234, 88, 12, 0.14)", text: "#ea580c", border: "rgba(234, 88, 12, 0.35)" },
  "Incendio / Quema": { bg: "rgba(234, 88, 12, 0.14)", text: "#ea580c", border: "rgba(234, 88, 12, 0.35)" },
  "Fuga de Gas": { bg: "rgba(202, 138, 4, 0.14)", text: "#ca8a04", border: "rgba(202, 138, 4, 0.35)" },
};

const HistoricoReportes = ({ token }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showMapa, setShowMapa] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [tipoFilter, setTipoFilter] = useState("TODOS");
  const [sinLimite, setSinLimite] = useState(true);
  const [limiteVisible, setLimiteVisible] = useState(50);

  const cargarHistorico = async () => {
    setLoading(true);
    try {
      const paramLimite = sinLimite ? "todos" : "200";
      const respuesta = await fetch(
        `${API_BASE_URL}/api/reportes/historico?estado=${estadoFilter}&tipo=${tipoFilter}&limit=${paramLimite}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const datos = await respuesta.json();
      const lista = Array.isArray(datos)
        ? datos
        : Array.isArray(datos?.reportes)
        ? datos.reportes
        : [];
      setReportes(lista);
    } catch (error) {
      console.error(error);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLimiteVisible(50);
    cargarHistorico();
  }, [estadoFilter, tipoFilter, sinLimite]);

  const reportesFiltrados = useMemo(() => {
    const lista = Array.isArray(reportes) ? reportes : [];
    if (!busqueda.trim()) return lista;
    const q = busqueda.toLowerCase();
    return lista.filter(
      (r) =>
        (r.descripcion && r.descripcion.toLowerCase().includes(q)) ||
        (r.tipo_incidente && r.tipo_incidente.toLowerCase().includes(q)) ||
        String(r.id_reporte).includes(q)
    );
  }, [reportes, busqueda]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div
        className="admin-card"
        style={{
          padding: "18px 22px",
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
              color: "var(--adm-text)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <History size={20} color="var(--adm-accent)" />
            <span>Base de Datos General ({reportesFiltrados.length})</span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--adm-muted)" }}>
            Consulta de todos los reportes registrados (Activos e Históricos).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              fontSize: "13px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="APROBADO">Activos (En Mapa)</option>
            <option value="HISTORICO">Archivados (&gt;30 días)</option>
          </select>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            style={{
              padding: "8px 14px",
              fontSize: "13px",
              borderRadius: "8px",
              cursor: "pointer",
              maxWidth: "180px",
            }}
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="1">Robo / Asalto</option>
            <option value="2">Vandalismo</option>
            <option value="3">Fallo de Alumbrado</option>
            <option value="4">Actividad Sospechosa</option>
            <option value="5">Acoso / Zona Insegura</option>
            <option value="6">Fuga de Agua</option>
            <option value="7">Accidente Vehicular</option>
            <option value="8">Incendio / Maleza</option>
            <option value="9">Fuga de Gas</option>
          </select>

          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--adm-muted)",
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
                borderRadius: "8px",
                width: "210px",
              }}
            />
          </div>

          <button
            onClick={() => setShowMapa(true)}
            disabled={reportesFiltrados.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#059669",
              border: "1px solid #10b981",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: reportesFiltrados.length === 0 ? "not-allowed" : "pointer",
              opacity: reportesFiltrados.length === 0 ? 0.5 : 1,
            }}
          >
            <MapIcon size={14} />
            <span>Mapa Histórico</span>
          </button>

          <button
            onClick={cargarHistorico}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--adm-card-alt)",
              border: "1px solid var(--adm-border)",
              borderRadius: "8px",
              color: "var(--adm-text)",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card" style={{ padding: "60px 20px", textAlign: "center", color: "var(--adm-muted)" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              border: "3px solid var(--adm-border)",
              borderTop: "3px solid var(--adm-accent)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 14px auto",
            }}
          />
          <span style={{ fontSize: "14px" }}>Cargando registros...</span>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="admin-card" style={{ padding: "50px 20px", textAlign: "center", color: "var(--adm-muted)" }}>
          <History size={36} color="var(--adm-muted)" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--adm-text)" }}>
            {busqueda ? "Sin coincidencias" : "No hay reportes archivados"}
          </h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "var(--adm-muted)" }}>
            {busqueda ? "Intenta con otro término." : "Intenta ajustando los filtros."}
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Ubicación</th>
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.slice(0, limiteVisible).map((rep) => {
                  const estiloBadge = TIPOS_COLORES[rep.tipo_incidente] || {
                    bg: "var(--adm-card-alt)",
                    text: "var(--adm-text)",
                    border: "var(--adm-border)",
                  };

                  return (
                    <tr key={rep.id_reporte}>
                      <td style={{ color: "var(--adm-muted)", fontFamily: "monospace", fontWeight: 700 }}>
                        #{rep.id_reporte}
                      </td>
                      <td>
                        <span
                          className="admin-badge"
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            backgroundColor:
                              rep.estado === "APROBADO"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "var(--adm-card-alt)",
                            color: rep.estado === "APROBADO" ? "#10b981" : "var(--adm-muted)",
                            border: `1px solid ${
                              rep.estado === "APROBADO"
                                ? "rgba(16, 185, 129, 0.35)"
                                : "var(--adm-border)"
                            }`,
                          }}
                        >
                          {rep.estado === "APROBADO" ? "ACTIVO" : "HISTÓRICO"}
                        </span>
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
                      <td style={{ maxWidth: "340px" }}>
                        {rep.descripcion ? (
                          <span style={{ color: "var(--adm-text)", fontSize: "13px", fontWeight: 500 }}>
                            {rep.descripcion}
                          </span>
                        ) : (
                          <span style={{ color: "var(--adm-muted)", fontSize: "12px", fontStyle: "italic" }}>
                            Sin descripción
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--adm-muted)", fontSize: "12.5px", fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="var(--adm-muted)" />
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
                            color: "var(--adm-accent)",
                            fontSize: "12px",
                            fontWeight: 600,
                            textDecoration: "none",
                            background: "var(--adm-accent-bg)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            border: "1px solid var(--adm-accent-border)",
                          }}
                        >
                          <MapPin size={12} />
                          <span>
                            {Number(rep.latitud).toFixed(4)}, {Number(rep.longitud).toFixed(4)}
                          </span>
                          <ExternalLink size={10} style={{ marginLeft: "2px" }} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {reportesFiltrados.length > limiteVisible && (
            <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid var(--adm-border)" }}>
              <button
                onClick={() => setLimiteVisible((prev) => prev + 50)}
                style={{
                  padding: "7px 16px",
                  background: "var(--adm-accent-bg)",
                  border: "1px solid var(--adm-accent-border)",
                  borderRadius: "8px",
                  color: "var(--adm-accent)",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Mostrar más ({reportesFiltrados.length - limiteVisible} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para el Mapa Histórico */}
      {showMapa && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(9, 13, 11, 0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="admin-card"
            style={{
              width: "100%",
              maxWidth: "1000px",
              height: "80vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--adm-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--adm-sidebar)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15.5px", color: "var(--adm-text)", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapIcon size={18} color="var(--adm-accent)" /> Mapa de Densidad Histórica
              </h3>
              <button
                onClick={() => setShowMapa(false)}
                style={{
                  background: "var(--adm-card-alt)",
                  border: "1px solid var(--adm-border)",
                  color: "var(--adm-text)",
                  borderRadius: "8px",
                  padding: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <MapaHistorico
                reportes={reportesFiltrados}
                sinLimite={sinLimite}
                onToggleSinLimite={() => setSinLimite((prev) => !prev)}
                cargando={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoReportes;
