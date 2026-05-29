import React, { useState } from "react";
import { Download, Filter, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "../config";

// ─────────────────────────────────────────────────────────────────────────────
// CU-7: Exportar Reportes (CSV)
// ─────────────────────────────────────────────────────────────────────────────
const ExportarReportes = () => {
  const [estado, setEstado] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);

  const manejarDescarga = () => {
    const params = new URLSearchParams();

    if (estado !== "todos") params.append("estado", estado);
    if (tipo !== "todos") params.append("tipo", tipo);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/reportes/exportar${queryString ? "?" + queryString : ""}`;

    // Abrir la URL para iniciar la descarga del CSV
    window.open(url, "_blank");

    // Mostrar mensaje de éxito
    setMensajeExito(true);
    setTimeout(() => setMensajeExito(false), 3000);
  };

  return (
    <div style={{ padding: "30px" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "25px" }}>
          <div
            style={{
              backgroundColor: "#3B82F6",
              padding: "10px",
              borderRadius: "10px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Download size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: "#1E293B" }}>Exportar Reportes</h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
              Descarga los reportes en formato CSV con los filtros deseados
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
            color: "#64748B",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          <Filter size={16} />
          Filtros de exportación
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          {/* Estado */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B" }}>Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="todos">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
              <option value="HISTORICO">Histórico</option>
            </select>
          </div>

          {/* Tipo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B" }}>Tipo de Incidente</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="todos">Todos</option>
              <option value="1">Robo / Asalto</option>
              <option value="2">Vandalismo</option>
              <option value="3">Fallo de Alumbrado</option>
              <option value="4">Actividad Sospechosa</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B" }}>Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Fecha Hasta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontWeight: "bold", fontSize: "14px", color: "#1E293B" }}>Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div
            style={{
              backgroundColor: "#ECFDF5",
              border: "1px solid #10B981",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#065F46",
              fontSize: "14px",
            }}
          >
            <CheckCircle size={18} color="#10B981" />
            ¡Descarga iniciada exitosamente!
          </div>
        )}

        {/* Botón de descarga */}
        <button
          onClick={manejarDescarga}
          style={{
            backgroundColor: "#3B82F6",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Download size={20} />
          Descargar CSV
        </button>
      </div>
    </div>
  );
};

export default ExportarReportes;
