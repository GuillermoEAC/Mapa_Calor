const express = require("express");
const {
  crearReporte,
  obtenerPendientes,
  actualizarEstado,
  obtenerAprobados,
  obtenerTodos,
  insertarDatosPrueba,
  obtenerEstadisticas,
  obtenerHistorico,
  exportarReportes,
  depurarReportesAntiguos,
} = require("../controllers/reportesController");
const verificarToken = require("../middleware/auth");
const { limiteReportes } = require("../middleware/rateLimiter");

const router = express.Router();

// Middleware opcional para verificar token secreto de cron (si está configurado CRON_SECRET)
const verificarCronSecret = (req, res, next) => {
  const secretEsperado = process.env.CRON_SECRET;
  if (!secretEsperado) {
    return next(); // Si no está configurado, permite la ejecución
  }
  const tokenRecibido = req.headers["x-cron-secret"] || req.query.secret;
  if (tokenRecibido !== secretEsperado) {
    return res.status(401).json({ error: "No autorizado: token de cron no válido" });
  }
  next();
};

// ── Rutas públicas ──
router.post("/", limiteReportes, crearReporte);
router.get("/aprobados", obtenerAprobados);

// ── Ruta de depuración automática (cron externo / cron-job.org / GET o POST) ──
router.get("/depurar", verificarCronSecret, depurarReportesAntiguos);
router.post("/depurar", verificarCronSecret, depurarReportesAntiguos);

// ── Rutas protegidas (requieren JWT de admin) ──
router.get("/pendientes", verificarToken, obtenerPendientes);
router.get("/exportar", verificarToken, exportarReportes);
router.put("/:id/estado", verificarToken, actualizarEstado);
router.get("/todos", verificarToken, obtenerTodos);
router.get("/estadisticas", verificarToken, obtenerEstadisticas);
router.get("/historico", verificarToken, obtenerHistorico);

// Solo disponible en desarrollo
if (process.env.NODE_ENV !== "production") {
  router.get("/datos-prueba", insertarDatosPrueba);
}

module.exports = router;
