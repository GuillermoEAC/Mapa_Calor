const pool = require("../config/db");
const { verificarAlertasCercanas } = require("./suscripcionController");

// Mapeo de tipos de incidentes (reemplaza la cadena de if-chains)
const MAPA_TIPOS = { 
  robo: 1, 
  vandalismo: 2, 
  alumbrado: 3, 
  sospechoso: 4,
  acoso: 5,
  fuga_agua: 6,
  accidente: 7,
  incendio: 8,
  fuga_gas: 9
};

// Límites geográficos para Los Mochis y ejidos aledaños (~25km radio)
const LIMITES = {
  latMin: 25.50,
  latMax: 26.10,
  lngMin: -109.30,
  lngMax: -108.70
};

// Caché en memoria para reportes aprobados (con invalidación automática al modificar estados)
let aprobadosCache = null;
let aprobadosCacheTime = 0;
const APROBADOS_TTL_MS = 60 * 1000; // 60 segundos

const invalidarCacheAprobados = () => {
  aprobadosCache = null;
  aprobadosCacheTime = 0;
};

const crearReporte = async (req, res) => {
  const { tipo, descripcion, latitud, longitud } = req.body;

  // Validaciones
  if (!tipo || latitud === undefined || longitud === undefined) {
    return res.status(400).json({ error: "Faltan campos obligatorios: tipo, latitud, longitud" });
  }

  const id_tipo = MAPA_TIPOS[tipo] || 1;

  if (
    latitud < LIMITES.latMin || latitud > LIMITES.latMax ||
    longitud < LIMITES.lngMin || longitud > LIMITES.lngMax
  ) {
    return res.status(400).json({ 
      error: "Coordenadas fuera de los límites permitidos (Los Mochis)" 
    });
  }

  // Sanitizar descripción
  const descripcionLimpia = descripcion
    ? String(descripcion).trim().substring(0, 500)
    : null;

  try {
    const [resultado] = await pool.query(
      "INSERT INTO Reporte (id_tipo, latitud, longitud, descripcion) VALUES (?, ?, ?, ?)",
      [id_tipo, latitud, longitud, descripcionLimpia],
    );
    res.status(201).json({ mensaje: "Reporte guardado con éxito", id: resultado.insertId });

    // Enviar alertas por correo a suscriptores cercanos inmediatamente (fire-and-forget)
    verificarAlertasCercanas(latitud, longitud, resultado.insertId)
      .then((enviadas) => {
        if (enviadas > 0) {
          console.log(`[ALERTA] Se enviaron ${enviadas} alertas por correo para el reporte #${resultado.insertId}`);
        }
      })
      .catch((err) => {
        console.error("[ALERTA] Error al verificar alertas cercanas tras crear reporte:", err);
      });
  } catch (error) {
    console.error("[REPORTE] Error al guardar:", error);
    res.status(500).json({ error: "Error al guardar el reporte" });
  }
};

const obtenerPendientes = async (req, res) => {
  try {
    const [reportes] = await pool.query(`
      SELECT r.id_reporte, r.latitud, r.longitud, r.fecha_registro, r.descripcion, t.nombre AS tipo_incidente
      FROM Reporte r
      JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
      WHERE r.estado = 'PENDIENTE'
      ORDER BY r.fecha_registro DESC
    `);
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
};

const actualizarEstado = async (req, res) => {
  const id_reporte = req.params.id;
  const { nuevo_estado } = req.body;

  // Validar que el estado sea uno de los permitidos
  const estadosValidos = ["PENDIENTE", "APROBADO", "RECHAZADO", "HISTORICO"];
  if (!nuevo_estado || !estadosValidos.includes(nuevo_estado)) {
    return res.status(400).json({ error: `Estado inválido. Permitidos: ${estadosValidos.join(", ")}` });
  }

  try {
    await pool.query("UPDATE Reporte SET estado = ? WHERE id_reporte = ?", [
      nuevo_estado,
      id_reporte,
    ]);
    invalidarCacheAprobados();
    res.json({ mensaje: `Reporte actualizado a ${nuevo_estado}` });

    // Si el nuevo estado es APROBADO, verificar alertas cercanas (fire-and-forget)
    if (nuevo_estado === 'APROBADO') {
      pool.query("SELECT latitud, longitud FROM Reporte WHERE id_reporte = ?", [id_reporte])
        .then(([rows]) => {
          if (rows.length > 0) {
            const { latitud, longitud } = rows[0];
            return verificarAlertasCercanas(latitud, longitud, id_reporte);
          }
        })
        .catch((err) => {
          console.error("[ALERTA] Error al verificar alertas cercanas:", err);
        });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la base de datos" });
  }
};

const obtenerAprobados = async (req, res) => {
  try {
    const sinLimite = req.query.sinLimite === "true" || req.query.limit === "todos";
    const ahora = Date.now();
    if (!sinLimite && aprobadosCache && ahora - aprobadosCacheTime < APROBADOS_TTL_MS) {
      res.set("Cache-Control", "public, max-age=30");
      return res.json(aprobadosCache);
    }

    // Solo campos necesarios para el mapa de calor (sin descripcion para ahorrar bytes)
    const sql = sinLimite
      ? `SELECT id_reporte, latitud, longitud, id_tipo, fecha_registro
         FROM Reporte
         WHERE estado = 'APROBADO'
         ORDER BY fecha_registro DESC`
      : `SELECT id_reporte, latitud, longitud, id_tipo, fecha_registro
         FROM Reporte
         WHERE estado = 'APROBADO'
         ORDER BY fecha_registro DESC
         LIMIT 500`;

    const [reportes] = await pool.query(sql);

    if (!sinLimite) {
      aprobadosCache = reportes;
      aprobadosCacheTime = ahora;
    }

    res.set("Cache-Control", "public, max-age=30");
    res.json(reportes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos del mapa" });
  }
};

const obtenerTodos = async (req, res) => {
  // Paginación
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    const [[reportes], [[{ total }]]] = await Promise.all([
      pool.query(`
        SELECT id_reporte, latitud, longitud, estado, id_tipo, fecha_registro
        FROM Reporte
        ORDER BY fecha_registro DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]),
      pool.query("SELECT COUNT(*) as total FROM Reporte"),
    ]);

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), reportes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
};

const insertarDatosPrueba = async (req, res) => {
  const centroLat = 25.7904;
  const centroLng = -108.9858;
  const variacion = 0.015;

  try {
    // Batch insert optimizado (una sola query en lugar de 20)
    const insertsValues = Array.from({ length: 20 }, (_, i) => {
      const lat = (centroLat + (Math.random() - 0.5) * variacion).toFixed(8);
      const lng = (centroLng + (Math.random() - 0.5) * variacion).toFixed(8);
      const tipo = (i % 9) + 1;
      return [tipo, lat, lng, 'APROBADO'];
    });

    const placeholders = insertsValues.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = insertsValues.flat();
    await pool.query(
      `INSERT INTO Reporte (id_tipo, latitud, longitud, estado) VALUES ${placeholders}`,
      flatValues
    );
    invalidarCacheAprobados();

    res.json({ mensaje: "20 reportes de prueba insertados con estado APROBADO", total: 20 });
  } catch (error) {
    res.status(500).json({ error: "Error al insertar datos de prueba", detalle: error.message });
  }
};

const obtenerEstadisticas = async (req, res) => {
  const { rango } = req.query;
  
  let filtroFecha = "";
  if (rango === "dia") {
    filtroFecha = "AND r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
  } else if (rango === "semana") {
    filtroFecha = "AND r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
  } else if (rango === "mes") {
    filtroFecha = "AND r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
  } else if (rango === "anio") {
    filtroFecha = "AND r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
  }

  const formatoPeriodo = (rango === "dia" || rango === "semana" || rango === "mes") ? "%Y-%m-%d" : "%Y-%m";

  try {
    // Ejecutar todas las consultas analíticas en paralelo
    const [
      porTipoResult,
      porHoraResult,
      porDiaSemanaResult,
      porPeriodoResult,
      porEstadoResult,
      porSectorResult,
    ] = await Promise.all([
      pool.query(`
        SELECT t.id_tipo, t.nombre, COUNT(r.id_reporte) as total
        FROM Reporte r
        JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
        WHERE r.estado IN ('APROBADO', 'HISTORICO')
        ${filtroFecha}
        GROUP BY t.id_tipo, t.nombre
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT HOUR(r.fecha_registro) as hora, COUNT(*) as total
        FROM Reporte r
        WHERE r.estado IN ('APROBADO', 'HISTORICO')
        ${filtroFecha}
        GROUP BY HOUR(r.fecha_registro)
        ORDER BY hora
      `),
      pool.query(`
        SELECT DAYOFWEEK(r.fecha_registro) as dia_num, COUNT(*) as total
        FROM Reporte r
        WHERE r.estado IN ('APROBADO', 'HISTORICO')
        ${filtroFecha}
        GROUP BY DAYOFWEEK(r.fecha_registro)
        ORDER BY dia_num
      `),
      pool.query(`
        SELECT DATE_FORMAT(r.fecha_registro, '${formatoPeriodo}') as periodo, COUNT(*) as total
        FROM Reporte r
        WHERE r.estado IN ('APROBADO', 'HISTORICO')
        ${filtroFecha}
        GROUP BY DATE_FORMAT(r.fecha_registro, '${formatoPeriodo}')
        ORDER BY periodo ASC
      `),
      pool.query(`
        SELECT r.estado, COUNT(*) as total
        FROM Reporte r
        WHERE 1=1
        ${filtroFecha}
        GROUP BY r.estado
      `),
      pool.query(`
        SELECT sector, COUNT(*) as total
        FROM (
          SELECT
            CASE
              WHEN ABS(r.latitud - 25.7904) < 0.012 AND ABS(r.longitud - (-108.9858)) < 0.012 THEN 'Centro'
              WHEN (r.latitud - 25.7904) >= ABS(r.longitud - (-108.9858)) THEN 'Norte'
              WHEN (25.7904 - r.latitud) >= ABS(r.longitud - (-108.9858)) THEN 'Sur'
              WHEN (r.longitud - (-108.9858)) > 0 THEN 'Oriente'
              ELSE 'Poniente'
            END as sector
          FROM Reporte r
          WHERE r.estado IN ('APROBADO', 'HISTORICO')
          ${filtroFecha}
        ) as sub_sectores
        GROUP BY sector
      `),
    ]);

    const porTipo = porTipoResult[0];
    const porHora = porHoraResult[0];
    const porDiaSemana = porDiaSemanaResult[0];
    const porPeriodo = porPeriodoResult[0];
    const porEstado = porEstadoResult[0];
    const porSector = porSectorResult[0];

    // Cache: estadísticas pueden cachearse 2 min
    res.set("Cache-Control", "public, max-age=120");
    res.json({
      porTipo,
      porHora,
      porDiaSemana,
      porPeriodo,
      porEstado,
      porSector,
    });
  } catch (error) {
    console.error("[Estadísticas] Error:", error);
    res.status(500).json({ error: "Error al generar estadísticas" });
  }
};

const depurarReportesAntiguos = async (req, res) => {
  try {
    const [resultado] = await pool.query(`
      UPDATE Reporte 
      SET estado = 'HISTORICO' 
      WHERE fecha_registro < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND estado != 'HISTORICO'
    `);
    if (resultado.affectedRows > 0) invalidarCacheAprobados();
    console.log(`[Depuración] Se movieron ${resultado.affectedRows} reportes a histórico.`);
    if (res) {
      return res.status(200).json({
        mensaje: "Depuración completada exitosamente",
        reportesActualizados: resultado.affectedRows,
      });
    }
    return resultado.affectedRows;
  } catch (error) {
    console.error("[Depuración] Error al depurar reportes:", error);
    if (res) {
      return res.status(500).json({ error: "Error al depurar reportes antiguos" });
    }
    throw error;
  }
};

const obtenerHistorico = async (req, res) => {
  // Paginación y Filtros
  const sinLimite = req.query.limit === "todos" || req.query.limit === "0" || req.query.sinLimite === "true";
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = sinLimite ? 100000 : Math.min(5000, Math.max(1, parseInt(req.query.limit) || 200));
  const offset = sinLimite ? 0 : (page - 1) * limit;
  
  const { tipo, estado, desde, hasta } = req.query;

  let whereClauses = ["r.estado IN ('APROBADO', 'HISTORICO')"]; // Por defecto activos e históricos
  let queryParams = [];

  if (estado && estado !== "TODOS") {
    whereClauses = [`r.estado = ?`];
    queryParams.push(estado);
  }
  
  if (tipo && tipo !== "TODOS") {
    whereClauses.push(`r.id_tipo = ?`);
    queryParams.push(tipo);
  }
  
  if (desde) {
    whereClauses.push(`r.fecha_registro >= ?`);
    queryParams.push(desde);
  }
  if (hasta) {
    whereClauses.push(`r.fecha_registro <= ?`);
    queryParams.push(`${hasta} 23:59:59`);
  }

  const whereString = "WHERE " + whereClauses.join(" AND ");

  try {
    // Ejecutar listado paginado y conteo en paralelo
    const [[reportes], [[{ total }]]] = await Promise.all([
      pool.query(`
        SELECT r.id_reporte, r.id_tipo, r.latitud, r.longitud, r.fecha_registro, r.descripcion, r.estado, t.nombre AS tipo_incidente
        FROM Reporte r
        JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
        ${whereString}
        ORDER BY r.fecha_registro DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, limit, offset]),
      pool.query(`
        SELECT COUNT(*) as total FROM Reporte r ${whereString}
      `, queryParams),
    ]);

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), reportes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el historial" });
  }
};

// Obtener detalle de un reporte individual (descripción bajo demanda)
const obtenerDetalle = async (req, res) => {
  const { id } = req.params;
  try {
    const [reportes] = await pool.query(`
      SELECT r.descripcion, t.nombre AS tipo_incidente
      FROM Reporte r
      JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
      WHERE r.id_reporte = ? AND r.estado = 'APROBADO'
    `, [id]);

    if (reportes.length === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    res.set("Cache-Control", "public, max-age=300");
    res.json(reportes[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el detalle del reporte" });
  }
};

const exportarReportes = async (req, res) => {
  const { estado, tipo, desde, hasta } = req.query;

  let query = `
    SELECT r.id_reporte, t.nombre AS tipo_incidente, r.descripcion, r.estado, 
           r.latitud, r.longitud, r.fecha_registro
    FROM Reporte r
    JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
  `;
  const condiciones = [];
  const params = [];

  if (estado && estado !== "todos") {
    condiciones.push("r.estado = ?");
    params.push(estado);
  }
  if (tipo && tipo !== "todos") {
    condiciones.push("r.id_tipo = ?");
    params.push(parseInt(tipo));
  }
  if (desde) {
    condiciones.push("r.fecha_registro >= ?");
    params.push(desde);
  }
  if (hasta) {
    condiciones.push("r.fecha_registro <= ?");
    params.push(hasta);
  }

  if (condiciones.length > 0) {
    query += " WHERE " + condiciones.join(" AND ");
  }

  query += " ORDER BY r.fecha_registro DESC";

  try {
    const [reportes] = await pool.query(query, params);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=reportes_export.csv");

    let csv = "\uFEFF";
    csv += "sep=,\r\n";
    csv += "ID,Tipo Incidente,Descripcion,Estado,Latitud,Longitud,Fecha Registro\r\n";

    for (const r of reportes) {
      const descripcion = r.descripcion 
        ? `"${r.descripcion.replace(/"/g, '""').replace(/\r?\n|\r/g, " ")}"` 
        : '""';
      const tipoIncidente = `"${(r.tipo_incidente || "").replace(/"/g, '""')}"`;
      
      let fechaStr = "";
      if (r.fecha_registro) {
        const d = new Date(r.fecha_registro);
        if (!isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, "0");
          fechaStr = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
      }

      csv += `${r.id_reporte},${tipoIncidente},${descripcion},${r.estado},${r.latitud},${r.longitud},"${fechaStr}"\r\n`;
    }

    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: "Error al exportar los reportes" });
  }
};

module.exports = {
  crearReporte,
  obtenerPendientes,
  actualizarEstado,
  obtenerAprobados,
  obtenerTodos,
  insertarDatosPrueba,
  obtenerEstadisticas,
  depurarReportesAntiguos,
  obtenerHistorico,
  obtenerDetalle,
  exportarReportes,
};
