const pool = require("../config/db");
const { verificarAlertasCercanas } = require("./suscripcionController");

// Mapeo de tipos de incidentes (reemplaza la cadena de if-chains)
const MAPA_TIPOS = { robo: 1, vandalismo: 2, alumbrado: 3, sospechoso: 4 };

// Límites geográficos para Los Mochis y ejidos aledaños (~25km radio)
const LIMITES = {
  latMin: 25.50,
  latMax: 26.10,
  lngMin: -109.30,
  lngMax: -108.70
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
    const [reportes] = await pool.query(`
      SELECT latitud, longitud, id_tipo, descripcion, fecha_registro
      FROM Reporte
      WHERE estado = 'APROBADO'
    `);

    // Cache header: los datos aprobados pueden cachearse 2 min
    res.set("Cache-Control", "public, max-age=120");
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
    const [reportes] = await pool.query(`
      SELECT id_reporte, latitud, longitud, estado, id_tipo, fecha_registro
      FROM Reporte
      ORDER BY fecha_registro DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM Reporte");

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), reportes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
};

const insertarDatosPrueba = async (req, res) => {
  const centroLat = 25.7904;
  const centroLng = -108.9858;
  const variacion = 0.01;

  try {
    // Batch insert optimizado (una sola query en lugar de 20)
    const insertsValues = Array.from({ length: 20 }, (_, i) => {
      const lat = (centroLat + (Math.random() - 0.5) * variacion).toFixed(8);
      const lng = (centroLng + (Math.random() - 0.5) * variacion).toFixed(8);
      const tipo = (i % 3) + 1;
      return [tipo, lat, lng, 'APROBADO'];
    });

    const placeholders = insertsValues.map(() => "(?, ?, ?, ?)").join(", ");
    const flatValues = insertsValues.flat();
    await pool.query(
      `INSERT INTO Reporte (id_tipo, latitud, longitud, estado) VALUES ${placeholders}`,
      flatValues
    );

    res.json({ mensaje: "20 reportes de prueba insertados con estado APROBADO", total: 20 });
  } catch (error) {
    res.status(500).json({ error: "Error al insertar datos de prueba", detalle: error.message });
  }
};

const obtenerEstadisticas = async (req, res) => {
  try {
    // Ejecutar ambas queries en paralelo
    const [porTipoResult, porHoraResult] = await Promise.all([
      pool.query(`
        SELECT t.nombre, COUNT(r.id_reporte) as total
        FROM Reporte r
        JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
        WHERE r.estado = 'APROBADO'
        GROUP BY t.nombre
      `),
      pool.query(`
        SELECT HOUR(fecha_registro) as hora, COUNT(*) as total
        FROM Reporte
        WHERE estado = 'APROBADO'
        GROUP BY hora
        ORDER BY hora
      `)
    ]);

    const porTipo = porTipoResult[0];
    const porHora = porHoraResult[0];

    // Cache: estadísticas pueden cachearse 5 min
    res.set("Cache-Control", "public, max-age=300");
    res.json({ porTipo, porHora });
  } catch (error) {
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
  // Paginación
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    const [reportes] = await pool.query(`
      SELECT r.id_reporte, r.latitud, r.longitud, r.fecha_registro, r.descripcion, t.nombre AS tipo_incidente
      FROM Reporte r
      JOIN Tipo_Incidente t ON r.id_tipo = t.id_tipo
      WHERE r.estado = 'HISTORICO'
      ORDER BY r.fecha_registro DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM Reporte WHERE estado = 'HISTORICO'"
    );

    res.json({ total, page, limit, totalPages: Math.ceil(total / limit), reportes });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el historial" });
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
          fechaStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
  exportarReportes,
};
