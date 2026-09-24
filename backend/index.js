const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

// Validar variables de entorno obligatorias antes de arrancar
const validateEnv = require("./src/config/validateEnv");
validateEnv();

const reportesRoutes = require("./src/routes/reportesRoutes");
const authRoutes = require("./src/routes/authRoutes");
const configRoutes = require("./src/routes/configRoutes");
const suscripcionRoutes = require("./src/routes/suscripcionRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const { limiteGlobal } = require("./src/middleware/rateLimiter");
const pool = require("./src/config/db");
const {
  depurarReportesAntiguos,
} = require("./src/controllers/reportesController");

const app = express();

// ── Seguridad ──
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// ── Performance ──
app.use(compression());
app.use(express.json({ limit: "1mb" }));

// ── Rate Limiting global ──
app.use(limiteGlobal);

// ── Health Check (crucial para Render) ──
app.get("/", (req, res) => {
  res.json({ mensaje: "API Mapa de Calor activa", status: "ok", health: "/health" });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      db: "connected",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// ── Rutas ──
app.use("/api/reportes", reportesRoutes);
app.use("/api", authRoutes);
app.use("/api", configRoutes);
app.use("/api/suscripciones", suscripcionRoutes);

// ── Manejador global de errores (DEBE ir al final) ──
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
