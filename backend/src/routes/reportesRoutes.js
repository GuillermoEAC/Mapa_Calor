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
} = require("../controllers/reportesController");

const router = express.Router();

router.post("/", crearReporte);
router.get("/pendientes", obtenerPendientes);
router.get("/exportar", exportarReportes);
router.put("/:id/estado", actualizarEstado);
router.get("/aprobados", obtenerAprobados);
router.get("/todos", obtenerTodos);
router.get("/datos-prueba", insertarDatosPrueba);
router.get("/estadisticas", obtenerEstadisticas);
router.get("/historico", obtenerHistorico);

module.exports = router;
