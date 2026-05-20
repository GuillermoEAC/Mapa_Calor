const express = require("express");
const {
  obtenerConfiguracion,
  actualizarConfiguracion,
  obtenerDirectorio,
} = require("../controllers/configController");

const router = express.Router();

router.get("/config", obtenerConfiguracion);
router.put("/config", actualizarConfiguracion);
router.get("/emergencias", obtenerDirectorio);

module.exports = router;
