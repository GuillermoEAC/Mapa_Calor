const express = require("express");
const {
  crearSuscripcion,
  obtenerSuscripciones,
  eliminarSuscripcion,
  verificarCorreo,
} = require("../controllers/suscripcionController");
const verificarToken = require("../middleware/auth");
const { limiteSuscripciones } = require("../middleware/rateLimiter");

const router = express.Router();

// Público: crear suscripción y verificar correo
router.post("/", limiteSuscripciones, crearSuscripcion);
router.get("/verificar/:token", verificarCorreo);

// Protegido: listar y eliminar suscripciones (solo admin)
router.get("/", verificarToken, obtenerSuscripciones);
router.delete("/:id", verificarToken, eliminarSuscripcion);

module.exports = router;
