const express = require("express");
const {
  crearSuscripcion,
  obtenerSuscripciones,
  eliminarSuscripcion,
  verificarCorreo,
} = require("../controllers/suscripcionController");

const router = express.Router();

router.post("/", crearSuscripcion);
router.get("/", obtenerSuscripciones);
router.get("/verificar/:token", verificarCorreo);
router.delete("/:id", eliminarSuscripcion);

module.exports = router;
