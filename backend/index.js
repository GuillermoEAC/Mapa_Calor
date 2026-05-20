const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const reportesRoutes = require("./src/routes/reportesRoutes");
const authRoutes = require("./src/routes/authRoutes");
const configRoutes = require("./src/routes/configRoutes");
const suscripcionRoutes = require("./src/routes/suscripcionRoutes");
const {
  depurarReportesAntiguos,
} = require("./src/controllers/reportesController");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/reportes", reportesRoutes);
app.use("/api", authRoutes);
app.use("/api", configRoutes);
app.use("/api/suscripciones", suscripcionRoutes);

// depuracion
cron.schedule("0 0 * * *", () => {
  console.log("Ejecutando depuración automática de reportes antiguos...");
  depurarReportesAntiguos();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
