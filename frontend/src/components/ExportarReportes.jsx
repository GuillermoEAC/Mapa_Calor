import React, { useState } from "react";
import { Download, Filter, CheckCircle2, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../config";

const ExportarReportes = ({ token }) => {
  const [estado, setEstado] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [descargando, setDescargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [error, setError] = useState("");

  const manejarDescarga = async () => {
    setDescargando(true);
    setError("");
    setMensajeExito(false);

    const params = new URLSearchParams();
    if (estado !== "todos") params.append("estado", estado);
    if (tipo !== "todos") params.append("tipo", tipo);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/reportes/exportar${queryString ? "?" + queryString : ""}`;

    try {
      const respuesta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!respuesta.ok) throw new Error("Error en servidor al generar archivo");

      const blob = await respuesta.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `reportes_los_mochis_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      setMensajeExito(true);
      setTimeout(() => setMensajeExito(false), 4000);
    } catch (err) {
      setError("No se pudo descargar el archivo. Verifica tu conexión y sesión.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Título */}
      <div className="admin-card" style={{ padding: "20px 24px" }}>
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
          <FileSpreadsheet size={22} color="#38bdf8" />
          <span>Exportación de Reportes e Incidencias</span>
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
          Genera archivos compatibles con Excel, PowerBI y software SIG para análisis institucional.
        </p>
      </div>

      {/* Alerta de éxito */}
      {mensajeExito && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#6ee7b7",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>¡Archivo CSV exportado exitosamente! La descarga se ha iniciado en tu navegador.</span>
        </div>
      )}

      {/* Alerta de error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(244, 63, 94, 0.12)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fda4af",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={18} color="#f43f5e" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario de Exportación */}
      <div className="admin-card" style={{ padding: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <Filter size={16} color="#38bdf8" />
          <span>Filtros de extracción</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px", marginBottom: "24px" }}>
          {/* Estado */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa" }}>Estado del Reporte</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              style={{
                padding: "11px 14px",
                fontSize: "13.5px",
                borderRadius: "10px",
                backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                borderColor: "rgba(255, 255, 255, 0.1) !important",
              }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes de Moderación</option>
              <option value="APROBADO">Aprobados (En Mapa)</option>
              <option value="RECHAZADO">Rechazados</option>
              <option value="HISTORICO">Históricos Depurados</option>
            </select>
          </div>

          {/* Tipo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa" }}>Categoría de Incidente</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                padding: "11px 14px",
                fontSize: "13.5px",
                borderRadius: "10px",
                backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                borderColor: "rgba(255, 255, 255, 0.1) !important",
              }}
            >
              <option value="todos">Todas las categorías</option>
              <option value="1">Robo / Asalto</option>
              <option value="2">Vandalismo</option>
              <option value="3">Fallo de Alumbrado</option>
              <option value="4">Actividad Sospechosa</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa" }}>Fecha Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                borderRadius: "10px",
                backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                borderColor: "rgba(255, 255, 255, 0.1) !important",
              }}
            />
          </div>

          {/* Fecha Hasta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#a1a1aa" }}>Fecha Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{
                padding: "10px 14px",
                fontSize: "13px",
                borderRadius: "10px",
                backgroundColor: "rgba(9, 9, 11, 0.6) !important",
                borderColor: "rgba(255, 255, 255, 0.1) !important",
              }}
            />
          </div>
        </div>

        {/* Botón Descargar */}
        <button
          onClick={manejarDescarga}
          disabled={descargando}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: descargando ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 10px 25px -4px rgba(37, 99, 235, 0.4)",
            opacity: descargando ? 0.75 : 1,
          }}
        >
          {descargando ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} />
              <span>Generando archivo CSV...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Descargar Archivo CSV</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportarReportes;
