import React, { useState, useEffect, useMemo } from "react";
import { History, Search, Calendar, MapPin, RefreshCw, ExternalLink, Map as MapIcon, X } from "lucide-react";
import { API_BASE_URL } from "../config";
import MapaHistorico from "./MapaHistorico";

const TIPOS_COLORES = {
  "Robo / Asalto": { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
  "Vandalismo": { bg: "rgba(249, 115, 22, 0.15)", text: "#fb923c", border: "rgba(249, 115, 22, 0.3)" },
  "Fallo de Alumbrado": { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15", border: "rgba(234, 179, 8, 0.3)" },
  "Actividad Sospechosa": { bg: "rgba(139, 92, 246, 0.15)", text: "#c084fc", border: "rgba(139, 92, 246, 0.3)" },
  "Acoso / Zona Insegura": { bg: "rgba(236, 72, 153, 0.15)", text: "#f472b6", border: "rgba(236, 72, 153, 0.3)" },
  "Fuga de Agua": { bg: "rgba(14, 165, 233, 0.15)", text: "#38bdf8", border: "rgba(14, 165, 233, 0.3)" },
  "Accidente Vehicular": { bg: "rgba(6, 182, 212, 0.15)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.3)" },
  "Incendio / Maleza": { bg: "rgba(234, 88, 12, 0.15)", text: "#f97316", border: "rgba(234, 88, 12, 0.3)" },
  "Fuga de Gas": { bg: "rgba(253, 224, 71, 0.15)", text: "#fef08a", border: "rgba(253, 224, 71, 0.3)" },
};

const HistoricoReportes = ({ token }) => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showMapa, setShowMapa] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [tipoFilter, setTipoFilter] = useState("TODOS");

  const cargarHistorico = async () => {
    setLoading(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/reportes/historico?estado=${estadoFilter}&tipo=${tipoFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    cargarHistorico();
  }, [estadoFilter, tipoFilter]);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            <span>Base de Datos General</span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
            Consulta de todos los reportes (Activos e Históricos).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            style={{
              padding: "8px 14px", fontSize: "13px", borderRadius: "10px",
              backgroundColor: "rgba(24, 24, 27, 0.8)", borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#f4f4f5", outline: "none", cursor: "pointer",
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
              padding: "8px 14px", fontSize: "13px", borderRadius: "10px",
              backgroundColor: "rgba(24, 24, 27, 0.8)", borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#f4f4f5", outline: "none", cursor: "pointer", maxWidth: "160px"
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
            onClick={() => setShowMapa(true)}
            disabled={reportesFiltrados.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 600,
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
          <span style={{ fontSize: "14px" }}>Cargando registros...</span>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="admin-card" style={{ padding: "50px 20px", textAlign: "center", color: "#a1a1aa" }}>
          <History size={36} color="#52525b" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#f4f4f5" }}>
            {busqueda ? "Sin coincidencias" : "No hay reportes archivados"}
          </h3>
          <p style={{ margin: "6px 0 0 0", fontSize: "12.5px", color: "#71717a" }}>
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
                        <span style={{
                          padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                          backgroundColor: rep.estado === 'APROBADO' ? "rgba(16, 185, 129, 0.15)" : "rgba(113, 113, 122, 0.15)",
                          color: rep.estado === 'APROBADO' ? "#34d399" : "#a1a1aa",
                          border: `1px solid ${rep.estado === 'APROBADO' ? "rgba(16, 185, 129, 0.3)" : "rgba(113, 113, 122, 0.3)"}`
                        }}>
                          {rep.estado === 'APROBADO' ? 'ACTIVO' : 'HISTÓRICO'}
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
                      <td style={{ maxWidth: "320px" }}>
                        {rep.descripcion ? (
                          <span style={{ color: "#e4e4e7", fontSize: "13px" }}>
                            {rep.descripcion}
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

      {/* Modal para el Mapa Histórico */}
      {showMapa && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div className="admin-card animate-modal" style={{
            width: "100%", maxWidth: "1000px", height: "80vh",
            display: "flex", flexDirection: "column",
            overflow: "hidden"
          }}>
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "rgba(24,24,27,0.95)"
            }}>
              <h3 style={{ margin: 0, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapIcon size={18} color="#10b981" /> Mapa de Densidad Histórica
              </h3>
              <button
                onClick={() => setShowMapa(false)}
                style={{
                  background: "rgba(255,255,255,0.05)", border: "none", color: "#a1a1aa",
                  borderRadius: "8px", padding: "6px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <MapaHistorico reportes={reportesFiltrados} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoReportes;
