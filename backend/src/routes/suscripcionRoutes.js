const express = require("express");
const {
  crearSuscripcion,
  obtenerSuscripciones,
  eliminarSuscripcion,
} = require("../controllers/suscripcionController");

const router = express.Router();

router.post("/", crearSuscripcion);
router.get("/", obtenerSuscripciones);
router.delete("/:id", eliminarSuscripcion);

module.exports = router;
