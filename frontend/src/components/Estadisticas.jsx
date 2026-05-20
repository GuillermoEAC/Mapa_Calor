import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

const COLORS = ["#EF4444", "#F97316", "#EAB308", "#8B5CF6", "#64748B"];

const Estadisticas = () => {
  const [datos, setDatos] = useState({ porTipo: [], porHora: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const respuesta = await fetch("http://localhost:3000/api/reportes/estadisticas");
        const resultado = await respuesta.json();
        setDatos(resultado);
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, []);

  if (loading) return <div style={{ padding: "20px" }}>Cargando estadísticas...</div>;

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "30px" }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
        <BarChart3 color="#3B82F6" /> Análisis de Datos de Inseguridad
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
        
        {/* Gráfico por Tipo */}
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", marginBottom: "20px" }}>
            <PieChartIcon size={18} /> Distribución por Tipo de Incidente
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos.porTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nombre, percent }) => `${nombre} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="nombre"
                >
                  {datos.porTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico por Hora */}
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", marginBottom: "20px" }}>
            <TrendingUp size={18} /> Tendencia Horaria (Incidencias por Hora)
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.porHora}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" label={{ value: 'Hora del Día', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" name="Reportes" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Estadisticas;
