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

      if (!respuesta.ok) throw new Error("Error en descarga");

      const blob = await respuesta.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `reportes_mochis_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      setMensajeExito(true);
      setTimeout(() => setMensajeExito(false), 4000);
    } catch (err) {
      setError("No se pudo descargar el archivo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div style={{ maxWidth: "760px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
          <span>Exportación de Datos</span>
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
          Genera un archivo CSV estructurado para Excel con los filtros seleccionados.
        </p>
      </div>

      {mensajeExito && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#34d399",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>Archivo generado y descargado correctamente.</span>
        </div>
      )}

      {error && (
        <div
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#fb7185",
            padding: "12px 16px",
            borderRadius: "10px",
            fontSize: "13px",
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f4f4f5", fontSize: "14px", fontWeight: 600 }}>
          <Filter size={16} color="#38bdf8" />
          <span>Criterios de Filtrado</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px" }}>
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13px",
                borderRadius: "8px",
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#f4f4f5",
              }}
            >
              <option value="todos">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
              <option value="HISTORICO">Históricos</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px" }}>
              Categoría
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13px",
                borderRadius: "8px",
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#f4f4f5",
              }}
            >
              <option value="todos">Todas las Categorías</option>
              <option value="1">Robo / Asalto</option>
              <option value="2">Vandalismo</option>
              <option value="3">Fallo de Alumbrado</option>
              <option value="4">Actividad Sospechosa</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px" }}>
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13px",
                borderRadius: "8px",
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#f4f4f5",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "6px" }}>
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: "13px",
                borderRadius: "8px",
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                color: "#f4f4f5",
              }}
            />
          </div>
        </div>

        <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <button
            onClick={manejarDescarga}
            disabled={descargando}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              backgroundColor: "#2563eb",
              border: "1px solid #3b82f6",
              color: "#ffffff",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: descargando ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              opacity: descargando ? 0.7 : 1,
            }}
          >
            {descargando ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Descargar CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportarReportes;
