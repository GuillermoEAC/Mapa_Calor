import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  Compass,
  ShieldAlert,
  CheckCircle2,
  Sun,
  Activity,
} from "lucide-react";
import { API_BASE_URL } from "../config";

const COLORS = [
  "#ef4444", // Rojo
  "#f97316", // Naranja
  "#eab308", // Amarillo
  "#8b5cf6", // Morado
  "#ec4899", // Rosa
  "#38bdf8", // Azul claro
  "#22d3ee", // Cian
  "#10b981", // Esmeralda
  "#a855f7", // Violeta
];

const DIAS_SEMANA = [
  { dia_num: 2, corto: "Lun", nombre: "Lunes" },
  { dia_num: 3, corto: "Mar", nombre: "Martes" },
  { dia_num: 4, corto: "Mié", nombre: "Miércoles" },
  { dia_num: 5, corto: "Jue", nombre: "Jueves" },
  { dia_num: 6, corto: "Vie", nombre: "Viernes" },
  { dia_num: 7, corto: "Sáb", nombre: "Sábado" },
  { dia_num: 1, corto: "Dom", nombre: "Domingo" },
];

const SECTORES_ORDEN = ["Centro", "Norte", "Sur", "Oriente", "Poniente"];

// Clasificación de severidad para gráfica de impacto ciudadano
const clasificarSeveridad = (nombre = "") => {
  const n = nombre.toLowerCase();
  if (
    n.includes("incendio") ||
    n.includes("gas") ||
    n.includes("robo") ||
    n.includes("asalto") ||
    n.includes("acoso")
  ) {
    return "Crítico / Alto Riesgo";
  }
  if (
    n.includes("accidente") ||
    n.includes("sospechoso") ||
    n.includes("sospechosa") ||
    n.includes("vandalismo")
  ) {
    return "Riesgo Moderado / Vial";
  }
  return "Infraestructura / Servicios";
};

const clasificarSectorCoord = (lat, lng) => {
  const dLat = Number(lat) - 25.7904;
  const dLng = Number(lng) - -108.9858;
  if (Math.abs(dLat) < 0.012 && Math.abs(dLng) < 0.012) return "Centro";
  if (dLat >= Math.abs(dLng)) return "Norte";
  if (-dLat >= Math.abs(dLng)) return "Sur";
  if (dLng > 0) return "Oriente";
  return "Poniente";
};

const CustomTooltip = ({ active, payload, label, sufijo = "incidentes" }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
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
          {item.payload?.nombreCompleto || label || item.name}
        </p>
        <p style={{ margin: 0, color: item.color || "#38bdf8", fontWeight: 700 }}>
          {item.value} {sufijo}
          {item.payload?.porcentaje !== undefined ? ` (${item.payload.porcentaje}%)` : ""}
        </p>
      </div>
    );
  }
  return null;
};

const Estadisticas = ({ token }) => {
  const [datos, setDatos] = useState({
    porTipo: [],
    porHora: [],
    porDiaSemana: [],
    porPeriodo: [],
    porEstado: [],
    porSector: [],
  });
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState("todos"); // dia | semana | mes | anio | todos

  useEffect(() => {
    const cargarEstadisticas = async () => {
      setLoading(true);
      try {
        const respuesta = await fetch(`${API_BASE_URL}/api/reportes/estadisticas?rango=${rango}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const resultado = (await respuesta.json()) || {};

        // Si el backend aún no ha reiniciado con las nuevas métricas SQL, las calculamos como respaldo desde el histórico
        if (!resultado.porDiaSemana) {
          try {
            const respHist = await fetch(`${API_BASE_URL}/api/reportes/historico?limit=todos`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const dataHist = await respHist.json();
            const lista = Array.isArray(dataHist) ? dataHist : dataHist.reportes || [];

            const ahora = Date.now();
            const msRango =
              rango === "dia"
                ? 86400000
                : rango === "semana"
                ? 7 * 86400000
                : rango === "mes"
                ? 30 * 86400000
                : rango === "anio"
                ? 365 * 86400000
                : null;

            const filtrados = msRango
              ? lista.filter((r) => ahora - new Date(r.fecha_registro).getTime() <= msRango)
              : lista;

            const mapaDias = {};
            const mapaPeriodos = {};
            const mapaSectores = {};
            const mapaEstados = {};
            const usarDia = rango === "dia" || rango === "semana" || rango === "mes";

            filtrados.forEach((r) => {
              const est = r.estado || "APROBADO";
              mapaEstados[est] = (mapaEstados[est] || 0) + 1;

              if (est === "APROBADO" || est === "HISTORICO") {
                const d = new Date(r.fecha_registro);
                if (!isNaN(d.getTime())) {
                  const diaMysql = d.getDay() + 1; // 1 = Dom ... 7 = Sáb
                  mapaDias[diaMysql] = (mapaDias[diaMysql] || 0) + 1;

                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  const clave = usarDia ? `${yyyy}-${mm}-${dd}` : `${yyyy}-${mm}`;
                  mapaPeriodos[clave] = (mapaPeriodos[clave] || 0) + 1;
                }
                if (r.latitud && r.longitud) {
                  const sec = clasificarSectorCoord(r.latitud, r.longitud);
                  mapaSectores[sec] = (mapaSectores[sec] || 0) + 1;
                }
              }
            });

            resultado.porDiaSemana = Object.entries(mapaDias).map(([dia_num, total]) => ({
              dia_num: Number(dia_num),
              total,
            }));
            resultado.porPeriodo = Object.entries(mapaPeriodos)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([periodo, total]) => ({ periodo, total }));
            resultado.porSector = Object.entries(mapaSectores).map(([sector, total]) => ({
              sector,
              total,
            }));
            resultado.porEstado = Object.entries(mapaEstados).map(([estado, total]) => ({
              estado,
              total,
            }));
          } catch {
            // Ignorar si falla el respaldo
          }
        }

        setDatos({
          porTipo: resultado.porTipo || [],
          porHora: resultado.porHora || [],
          porDiaSemana: resultado.porDiaSemana || [],
          porPeriodo: resultado.porPeriodo || [],
          porEstado: resultado.porEstado || [],
          porSector: resultado.porSector || [],
        });
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarEstadisticas();
  }, [token, rango]);

  // Procesamiento integral de datos para todas las gráficas y KPIs
  const analisis = useMemo(() => {
    const totalIncidentes = (datos.porTipo || []).reduce(
      (acc, curr) => acc + (Number(curr.total) || 0),
      0
    );

    // 1. Tipos ordenados de mayor a menor con porcentaje
    const tiposOrdenados = [...(datos.porTipo || [])]
      .map((t) => {
        const total = Number(t.total) || 0;
        const porcentaje = totalIncidentes > 0 ? Math.round((total / totalIncidentes) * 100) : 0;
        return {
          ...t,
          total,
          porcentaje,
        };
      })
      .sort((a, b) => b.total - a.total);

    const tipoMax = tiposOrdenados[0] || { nombre: "N/A", total: 0, porcentaje: 0 };

    // 2. Rellenar las 24 horas del día (00h a 23h) para que la gráfica no tenga huecos
    const mapaHoras = {};
    (datos.porHora || []).forEach((h) => {
      mapaHoras[Number(h.hora)] = Number(h.total) || 0;
    });

    let horaPico = { hora: "N/A", total: 0 };
    const horasCompletas = Array.from({ length: 24 }, (_, hora) => {
      const total = mapaHoras[hora] || 0;
      if (total > horaPico.total) {
        horaPico = {
          hora: `${String(hora).padStart(2, "0")}:00 hrs`,
          total,
        };
      }
      return {
        hora: `${String(hora).padStart(2, "0")}h`,
        nombreCompleto: `${String(hora).padStart(2, "0")}:00 - ${String(hora).padStart(2, "0")}:59 hrs`,
        horaNum: hora,
        total,
      };
    });

    // 3. Agrupación por Turno Operativo (Madrugada, Mañana, Tarde, Noche)
    const turnosBase = [
      { turno: "Madrugada", rango: "00:00 - 05:59", total: 0, color: "#8b5cf6" },
      { turno: "Mañana", rango: "06:00 - 11:59", total: 0, color: "#eab308" },
      { turno: "Tarde", rango: "12:00 - 17:59", total: 0, color: "#f97316" },
      { turno: "Noche", rango: "18:00 - 23:59", total: 0, color: "#ef4444" },
    ];
    horasCompletas.forEach(({ horaNum, total }) => {
      if (horaNum < 6) turnosBase[0].total += total;
      else if (horaNum < 12) turnosBase[1].total += total;
      else if (horaNum < 18) turnosBase[2].total += total;
      else turnosBase[3].total += total;
    });
    turnosBase.forEach((t) => {
      t.porcentaje = totalIncidentes > 0 ? Math.round((t.total / totalIncidentes) * 100) : 0;
      t.nombreCompleto = `${t.turno} (${t.rango})`;
    });
    const turnoCritico = [...turnosBase].sort((a, b) => b.total - a.total)[0] || turnosBase[0];

    // 4. Días de la semana (Lunes a Domingo completos)
    const mapaDias = {};
    (datos.porDiaSemana || []).forEach((d) => {
      mapaDias[Number(d.dia_num)] = Number(d.total) || 0;
    });
    let diaPico = { nombre: "N/A", total: 0 };
    const diasSemanaCompletos = DIAS_SEMANA.map((d) => {
      const total = mapaDias[d.dia_num] || 0;
      if (total > diaPico.total) {
        diaPico = { nombre: d.nombre, total };
      }
      return {
        dia: d.corto,
        nombreCompleto: d.nombre,
        total,
      };
    });

    // 5. Nivel de Severidad / Impacto
    const mapaSeveridad = {
      "Crítico / Alto Riesgo": { nivel: "Alto Riesgo", total: 0, color: "#ef4444", desc: "Robos, Incendios, Gas, Acoso" },
      "Riesgo Moderado / Vial": { nivel: "Riesgo Moderado", total: 0, color: "#f97316", desc: "Accidentes, Sospechosos, Vandalismo" },
      "Infraestructura / Servicios": { nivel: "Servicios Públicos", total: 0, color: "#38bdf8", desc: "Alumbrado, Fugas de Agua" },
    };
    tiposOrdenados.forEach((t) => {
      const cat = clasificarSeveridad(t.nombre);
      mapaSeveridad[cat].total += t.total;
    });
    const porSeveridad = Object.values(mapaSeveridad).map((s) => ({
      ...s,
      porcentaje: totalIncidentes > 0 ? Math.round((s.total / totalIncidentes) * 100) : 0,
      nombreCompleto: `${s.nivel} (${s.desc})`,
    }));

    // 6. Sectores Geográficos de Los Mochis
    const mapaSector = {};
    (datos.porSector || []).forEach((s) => {
      mapaSector[s.sector] = Number(s.total) || 0;
    });
    let sectorCritico = { sector: "N/A", total: 0 };
    const sectoresCompletos = SECTORES_ORDEN.map((sec) => {
      const total = mapaSector[sec] || 0;
      if (total > sectorCritico.total) {
        sectorCritico = { sector: `Sector ${sec}`, total };
      }
      return {
        sector: sec,
        nombreCompleto: `Sector ${sec} de Los Mochis`,
        total,
      };
    });

    // 7. Evolución temporal (en formato día-mes-año o mes-año)
    const evolucionTemporal = (datos.porPeriodo || []).map((p) => {
      const partes = String(p.periodo || "").split("-");
      let etiqueta = p.periodo;
      if (partes.length === 3) {
        etiqueta = `${partes[2]}-${partes[1]}-${partes[0]}`; // DD-MM-AAAA
      } else if (partes.length === 2) {
        etiqueta = `${partes[1]}-${partes[0]}`; // MM-AAAA
      }
      return {
        periodo: etiqueta,
        nombreCompleto: `Fecha: ${etiqueta}`,
        total: Number(p.total) || 0,
      };
    });

    // 8. Estado de Moderación
    const coloresEstado = {
      APROBADO: "#22c55e",
      HISTORICO: "#38bdf8",
      PENDIENTE: "#eab308",
      RECHAZADO: "#ef4444",
    };
    const nombresEstado = {
      APROBADO: "Aprobados (Activos)",
      HISTORICO: "Históricos (>30 días)",
      PENDIENTE: "Pendientes de Revisión",
      RECHAZADO: "Rechazados / Falsos",
    };
    const estadosModeracion = (datos.porEstado || []).map((e) => ({
      estado: e.estado,
      nombre: nombresEstado[e.estado] || e.estado,
      nombreCompleto: nombresEstado[e.estado] || e.estado,
      total: Number(e.total) || 0,
      color: coloresEstado[e.estado] || "#a1a1aa",
    }));
    const totalRecibidos = estadosModeracion.reduce((acc, curr) => acc + curr.total, 0) || totalIncidentes;
    const tasaAprobacion =
      totalRecibidos > 0 ? Math.round((totalIncidentes / totalRecibidos) * 100) : 100;

    return {
      totalIncidentes,
      totalRecibidos,
      tasaAprobacion,
      tiposOrdenados,
      tipoMax,
      horasCompletas,
      horaPico,
      turnosBase,
      turnoCritico,
      diasSemanaCompletos,
      diaPico,
      porSeveridad,
      sectoresCompletos,
      sectorCritico,
      evolucionTemporal,
      estadosModeracion,
    };
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
      {/* Encabezado y Filtro de Rango */}
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
              color: "var(--adm-text)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <BarChart3 size={22} color="var(--adm-accent)" />
            <span>Inteligencia y Análisis de Inseguridad</span>
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--adm-muted)" }}>
            Métricas consolidadas de patrones delictivos, sectores críticos, turnos y evolución temporal en Los Mochis.
          </p>
        </div>
        <select
          value={rango}
          onChange={(e) => setRango(e.target.value)}
          style={{
            padding: "8px 14px",
            fontSize: "13px",
            borderRadius: "10px",
            backgroundColor: "var(--adm-card-alt)",
            borderColor: "var(--adm-border)",
            color: "var(--adm-text)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="todos">Histórico Total</option>
          <option value="anio">Este Año</option>
          <option value="mes">Último Mes</option>
          <option value="semana">Última Semana</option>
          <option value="dia">Hoy (24h)</option>
        </select>
      </div>

      {/* 6 Tarjetas KPI de Resumen Ejecutivo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
        }}
      >
        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <Layers size={15} color="#10b981" />
            <span>Incidentes Validados</span>
          </div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "var(--adm-text)", marginTop: "8px" }}>
            {analisis.totalIncidentes}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
            De {analisis.totalRecibidos} reportes recibidos
          </span>
        </div>

        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <AlertTriangle size={15} color="#ef4444" />
            <span>Incidente Más Frecuente</span>
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "var(--adm-text)",
              marginTop: "8px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={analisis.tipoMax.nombre}
          >
            {analisis.tipoMax.nombre}
          </div>
          <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 600 }}>
            {analisis.tipoMax.total} casos ({analisis.tipoMax.porcentaje}% del total)
          </span>
        </div>

        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <Clock size={15} color="#eab308" />
            <span>Hora y Turno Crítico</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--adm-text)", marginTop: "8px" }}>
            {analisis.horaPico.hora}
          </div>
          <span style={{ fontSize: "11px", color: "#d97706", fontWeight: 600 }}>
            Turno {analisis.turnoCritico.turno} ({analisis.turnoCritico.porcentaje}%)
          </span>
        </div>

        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <Calendar size={15} color="#8b5cf6" />
            <span>Día de Mayor Riesgo</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--adm-text)", marginTop: "8px" }}>
            {analisis.diaPico.nombre}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
            {analisis.diaPico.total > 0 ? `${analisis.diaPico.total} incidentes acumulados` : "Sin registros"}
          </span>
        </div>

        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <Compass size={15} color="#0ea5e9" />
            <span>Zona con Mayor Incidencia</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--adm-text)", marginTop: "8px" }}>
            {analisis.sectorCritico.sector}
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
            {analisis.sectorCritico.total > 0 ? `${analisis.sectorCritico.total} reportes en el sector` : "Sin datos"}
          </span>
        </div>

        <div className="admin-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--adm-muted)", fontSize: "12px" }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>Tasa de Validación</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#10b981", marginTop: "8px" }}>
            {analisis.tasaAprobacion}%
          </div>
          <span style={{ fontSize: "11px", color: "var(--adm-muted)" }}>
            Reportes verificados vs. recibidos
          </span>
        </div>
      </div>

      {/* Gráfica de Ancho Completo: Evolución Temporal */}
      <div className="admin-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Evolución Histórica de Incidentes a lo Largo del Tiempo
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#71717a" }}>
            {rango === "todos" || rango === "anio" ? "Agrupado por mes (MM-AAAA)" : "Agrupado por día (DD-MM-AAAA)"}
          </span>
        </div>
        <div style={{ height: "270px" }}>
          {analisis.evolucionTemporal.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analisis.evolucionTemporal} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEvolucion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="periodo"
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEvolucion)"
                  name="Reportes"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: "13px" }}>
              No hay datos temporales suficientes para este periodo
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal de Gráficas de Ayuda (2 columnas responsivas) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        {/* Gráfico 1: Proporción Circular por Tipo */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <PieChartIcon size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Distribución Porcentual por Tipo de Incidente
            </h3>
          </div>
          <div style={{ height: "300px" }}>
            {analisis.tiposOrdenados.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analisis.tiposOrdenados}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="total"
                    nameKey="nombre"
                  >
                    {analisis.tiposOrdenados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    formatter={(val) => <span style={{ color: "#a1a1aa", fontSize: "11.5px" }}>{val}</span>}
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

        {/* Gráfico 2: Ranking Comparativo por Categoría (Barras de Progreso Detalladas) */}
        <div className="admin-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <BarChart3 size={18} color="#f97316" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Ranking Detallado de Incidencia por Categoría
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center", flex: 1 }}>
            {analisis.tiposOrdenados.length > 0 ? (
              analisis.tiposOrdenados.map((item, idx) => (
                <div key={item.nombre} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                    <span style={{ color: "var(--adm-text)", fontWeight: 600 }}>
                      {idx + 1}. {item.nombre}
                    </span>
                    <span style={{ color: "var(--adm-muted)", fontWeight: 600 }}>
                      <strong style={{ color: "var(--adm-text)" }}>{item.total}</strong> ({item.porcentaje}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--adm-card-alt)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(4, item.porcentaje)}%`,
                        height: "100%",
                        background: COLORS[idx % COLORS.length],
                        borderRadius: "999px",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#71717a", fontSize: "13px" }}>
                Sin registros disponibles
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 3: Franja Horaria Completa (00h a 23h) */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <TrendingUp size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Frecuencia de Incidentes por Hora del Día (00h – 23h)
            </h3>
          </div>
          <div style={{ height: "290px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analisis.horasCompletas} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="hora"
                  stroke="#71717a"
                  tick={{ fill: "#a1a1aa", fontSize: 10.5 }}
                  interval={1}
                />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Reportes" radius={[5, 5, 0, 0]}>
                  {analisis.horasCompletas.map((entry, index) => {
                    const esPico = analisis.horaPico.total > 0 && entry.total === analisis.horaPico.total;
                    const esAlto = analisis.horaPico.total > 0 && entry.total >= analisis.horaPico.total * 0.7;
                    return (
                      <Cell
                        key={`hora-${index}`}
                        fill={esPico ? "#ef4444" : esAlto ? "#f97316" : "#38bdf8"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 4: Incidencia por Día de la Semana (Lunes a Domingo) */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <Calendar size={18} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Comportamiento por Día de la Semana (Lun – Dom)
            </h3>
          </div>
          <div style={{ height: "290px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analisis.diasSemanaCompletos} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dia" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11.5 }} />
                <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Reportes" radius={[6, 6, 0, 0]}>
                  {analisis.diasSemanaCompletos.map((entry, idx) => {
                    const esMax = analisis.diaPico.total > 0 && entry.total === analisis.diaPico.total;
                    return (
                      <Cell
                        key={`dia-${idx}`}
                        fill={esMax ? "#f97316" : "#8b5cf6"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 5: Distribución por Turno Operativo (Madrugada, Mañana, Tarde, Noche) */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <Sun size={18} color="#eab308" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Concentración por Turno de Vigilancia
            </h3>
          </div>
          <div style={{ height: "290px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analisis.turnosBase}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="turno"
                  stroke="#71717a"
                  tick={{ fill: "#e4e4e7", fontSize: 12, fontWeight: 600 }}
                  width={85}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {analisis.turnosBase.map((entry, idx) => (
                    <Cell key={`turno-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 6: Radar por Sector Geográfico de Los Mochis */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <Compass size={18} color="#22d3ee" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Distribución Espacial por Sector de Los Mochis
            </h3>
          </div>
          <div style={{ height: "290px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={analisis.sectoresCompletos}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="sector" tick={{ fill: "#e4e4e7", fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                  name="Incidentes"
                  dataKey="total"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="#22d3ee"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 7: Clasificación por Nivel de Gravedad / Impacto */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <ShieldAlert size={18} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Clasificación por Nivel de Gravedad e Impacto
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center", height: "260px" }}>
            {analisis.porSeveridad.map((sev) => (
              <div
                key={sev.nivel}
                style={{
                  background: "var(--adm-card-alt)",
                  border: "1px solid var(--adm-border)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div>
                    <span style={{ color: "var(--adm-text)", fontWeight: 700, fontSize: "13.5px" }}>{sev.nivel}</span>
                    <span style={{ display: "block", color: "var(--adm-muted)", fontSize: "11px" }}>{sev.desc}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: sev.color, fontWeight: 800, fontSize: "16px" }}>{sev.total}</span>
                    <span style={{ color: "var(--adm-muted)", fontSize: "12px", marginLeft: "6px" }}>({sev.porcentaje}%)</span>
                  </div>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "7px",
                    background: "var(--adm-border)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(3, sev.porcentaje)}%`,
                      height: "100%",
                      background: sev.color,
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 8: Balance de Moderación y Estado de Reportes */}
        <div className="admin-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f4f4f5" }}>
              Estado de Moderación y Filtrado de Reportes
            </h3>
          </div>
          <div style={{ height: "260px" }}>
            {analisis.estadosModeracion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analisis.estadosModeracion} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="estado" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip sufijo="reportes" />} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {analisis.estadosModeracion.map((entry, idx) => (
                      <Cell key={`est-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#71717a", fontSize: "13px" }}>
                Sin datos de estados de moderación
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
