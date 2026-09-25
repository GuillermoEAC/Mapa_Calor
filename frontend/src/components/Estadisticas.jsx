import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle, Clock, Layers } from "lucide-react";
import { API_BASE_URL } from "../config";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "10px",
          padding: "10px 14px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          fontSize: "12.5px",
        }}
      >
        <p style={{ margin: "0 0 4px 0", color: "#a1a1aa", fontWeight: 600 }}>
          {label || payload[0].name}
        </p>
        <p style={{ margin: 0, color: "#38bdf8", fontWeight: 700 }}>
          {payload[0].value} incidentes
        </p>
      </div>
    );
  }
  return null;
};

const Estadisticas = ({ token }) => {
  const [datos, setDatos] = useState({ porTipo: [], porHora: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/reportes/estadisticas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resultado = await respuesta.json();
        setDatos(resultado || { porTipo: [], porHora: [] });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, [token]);

  // Cálculos de métricas rápidas (KPIs)
  const metricas = useMemo(() => {
    const totalIncidentes = (datos.porTipo || []).reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    
    let tipoMax = { nombre: "N/A", total: 0 };
    (datos.porTipo || []).forEach((t) => {
      if (Number(t.total) > tipoMax.total) {
        tipoMax = { nombre: t.nombre, total: Number(t.total) };
      }
    });

    let horaPico = { hora: "N/A", total: 0 };
    (datos.porHora || []).forEach((h) => {
      if (Number(h.total) > horaPico.total) {
        horaPico = { hora: `${h.hora}:00 hrs`, total: Number(h.total) };
      }
    });

    return { totalIncidentes, tipoMax, horaPico };
  }, [datos]);

  if (loading) {
    return (
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
        <span style={{ fontSize: "14px" }}>Generando análisis estadístico...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
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
          <BarChart3 size={22} color="#38bdf8" />
          <span>Inteligencia y Análisis de Inseguridad</span>
        </h2>
        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#a1a1aa" }}>
          Métricas consolidadas de patrones delictivos y horarios de mayor riesgo en Los Mochis.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a1a1aa", fontSize: "12.5px" }}>
            <Layers size={16} color="#38bdf8" />
            <span>Total de Incidentes Registrados</span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", marginTop: "10px" }}>
            {metricas.totalIncidentes}
          </div>
          <span style={{ fontSize: "11.5px", color: "#71717a" }}>Historial acumulado en plataforma</span>
        </div>

        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a1a1aa", fontSize: "12.5px" }}>
            <AlertTriangle size={16} color="#f97316" />
            <span>Tipo Más Frecuente</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginTop: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {metricas.tipoMax.nombre}
          </div>
          <span style={{ fontSize: "11.5px", color: "#71717a" }}>
            {metricas.tipoMax.total} casos reportados
          </span>
        </div>

        <div className="admin-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#a1a1aa", fontSize: "12.5px" }}>
            <Clock size={16} color="#eab308" />
            <span>Horario con Mayor Frecuencia</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginTop: "10px" }}>
            {metricas.horaPico.hora}
          </div>
          <span style={{ fontSize: "11.5px", color: "#71717a" }}>
            {metricas.horaPico.total > 0 ? `${metricas.horaPico.total} incidentes en esta franja` : "Sin incidencias"}
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        {/* Gráfico 1: Por Tipo */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <PieChartIcon size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Distribución por Tipo de Incidente
            </h3>
          </div>
          <div style={{ height: "300px" }}>
            {datos.porTipo && datos.porTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datos.porTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="nombre"
                  >
                    {datos.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val) => <span style={{ color: "#a1a1aa", fontSize: "12px" }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: "13px" }}>
                No hay datos suficientes para graficar
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Por Hora */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TrendingUp size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Tendencia de Incidentes por Franja Horaria (24h)
            </h3>
          </div>
          <div style={{ height: "300px" }}>
            {datos.porHora && datos.porHora.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.porHora}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="hora"
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#38bdf8"
                    name="Reportes"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: "13px" }}>
                No hay datos de horario disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
