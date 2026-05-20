import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle } from "lucide-react";

const PanelAdmin = () => {
  const [reportes, setReportes] = useState([]);

  const cargarReportes = async () => {
    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/reportes/pendientes",
      );
      const datos = await respuesta.json();
      setReportes(datos);
    } catch (error) {
      console.error("Error cargando reportes:", error);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const cambiarEstado = async (id, estado) => {
    try {
      await fetch(`http://localhost:3000/api/reportes/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevo_estado: estado }),
      });

      cargarReportes();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        width: "100vw",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ color: "#1E293B", marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
        <Shield size={28} color="#3B82F6" /> Panel de Moderación (Administrador)
      </h2>
      <p style={{ color: "#64748b" }}>
        Revisa los reportes ciudadanos y decide si son válidos para aparecer en
        el mapa.
      </p>

      {reportes.length === 0 ? (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#e2e8f0",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          No hay reportes pendientes de revisión.
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#1E293B",
                color: "white",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "12px" }}>ID</th>
              <th style={{ padding: "12px" }}>Tipo de Incidente</th>
              <th style={{ padding: "12px" }}>Descripción</th>
              <th style={{ padding: "12px" }}>Fecha</th>
              <th style={{ padding: "12px" }}>Ubicación (Lat, Lng)</th>
              <th style={{ padding: "12px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((rep) => (
              <tr
                key={rep.id_reporte}
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <td style={{ padding: "12px" }}>#{rep.id_reporte}</td>
                <td style={{ padding: "12px", fontWeight: "bold" }}>
                  {rep.tipo_incidente}
                </td>
                <td style={{ padding: "12px", fontSize: "14px", fontStyle: "italic", maxWidth: "200px" }}>
                  {rep.descripcion ? `"${rep.descripcion}"` : <span style={{color: "#94a3b8", fontStyle: "normal"}}>Sin descripción</span>}
                </td>
                <td style={{ padding: "12px" }}>
                  {new Date(rep.fecha_registro).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "12px",
                    fontSize: "14px",
                    color: "#64748b",
                  }}
                >
                  {rep.latitud}, {rep.longitud}
                </td>
                <td style={{ padding: "12px", display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => cambiarEstado(rep.id_reporte, "APROBADO")}
                    style={{
                      backgroundColor: "#10B981",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button
                    onClick={() => cambiarEstado(rep.id_reporte, "RECHAZADO")}
                    style={{
                      backgroundColor: "#EF4444",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PanelAdmin;
