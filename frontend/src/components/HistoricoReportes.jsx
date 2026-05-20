import React, { useState, useEffect } from "react";
import { History, Search, Calendar } from "lucide-react";

const HistoricoReportes = () => {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarHistorico = async () => {
    try {
      const respuesta = await fetch("http://localhost:3000/api/reportes/historico");
      const datos = await respuesta.json();
      setReportes(datos);
    } catch (error) {
      console.error("Error cargando histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorico();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Cargando historial...</div>;

  return (
    <div style={{ padding: "20px", backgroundColor: "#f8fafc", minHeight: "100%" }}>
      <h2 style={{ color: "#1E293B", marginTop: 0, display: "flex", alignItems: "center", gap: "10px" }}>
        <History size={28} color="#64748B" /> Historial de Reportes Depurados
      </h2>
      <p style={{ color: "#64748B" }}>
        Aquí se muestran los reportes que tienen más de 30 días y ya no aparecen en el mapa de calor principal.
      </p>

      {reportes.length === 0 ? (
        <div style={{ padding: "40px", backgroundColor: "white", borderRadius: "12px", textAlign: "center", border: "2px dashed #E2E8F0" }}>
          No hay reportes en el historial todavía.
        </div>
      ) : (
        <div style={{ overflowX: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", borderRadius: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead>
              <tr style={{ backgroundColor: "#F1F5F9", color: "#475569", textAlign: "left" }}>
                <th style={{ padding: "15px" }}>ID</th>
                <th style={{ padding: "15px" }}>Tipo</th>
                <th style={{ padding: "15px" }}>Descripción</th>
                <th style={{ padding: "15px" }}>Fecha Registro</th>
                <th style={{ padding: "15px" }}>Coordenadas</th>
              </tr>
            </thead>
            <tbody>
              {reportes.map((rep) => (
                <tr key={rep.id_reporte} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "15px", color: "#94A3B8" }}>#{rep.id_reporte}</td>
                  <td style={{ padding: "15px" }}>
                    <span style={{ 
                      padding: "4px 10px", 
                      borderRadius: "20px", 
                      backgroundColor: "#E2E8F0", 
                      fontSize: "12px", 
                      fontWeight: "bold" 
                    }}>
                      {rep.tipo_incidente}
                    </span>
                  </td>
                  <td style={{ padding: "15px", fontSize: "14px", fontStyle: "italic", maxWidth: "300px" }}>
                    {rep.descripcion || "Sin descripción"}
                  </td>
                  <td style={{ padding: "15px", fontSize: "14px", color: "#64748B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Calendar size={14} /> {new Date(rep.fecha_registro).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: "15px", fontSize: "13px", color: "#94A3B8" }}>
                    {rep.latitud}, {rep.longitud}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoricoReportes;
