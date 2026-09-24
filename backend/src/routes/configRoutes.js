const express = require("express");
const {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerDirectorio,
} = require("../controllers/configController");
const verificarToken = require("../middleware/auth");

const router = express.Router();

// Lectura de config y emergencias: público (lo usa el mapa)
router.get("/config", obtenerConfiguracion);
router.get("/emergencias", obtenerDirectorio);

// Actualizar configuración: solo admin autenticado
router.put("/config", verificarToken, actualizarConfiguracion);

module.exports = router;
