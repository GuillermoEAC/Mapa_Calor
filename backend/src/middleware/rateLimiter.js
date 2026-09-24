const rateLimit = require("express-rate-limit");

/**
 * Rate limiter global: 100 peticiones por minuto por IP.
 */
const limiteGlobal = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones, intenta de nuevo en un minuto" },
});

/**
 * Rate limiter para creación de reportes: 5 reportes por minuto por IP.
 * Previene spam masivo de reportes falsos.
 */
const limiteReportes = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados reportes enviados, espera un momento antes de intentar de nuevo" },
});

/**
 * Rate limiter para login: 10 intentos por 15 minutos por IP.
 * Previene ataques de fuerza bruta.
 */
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos" },
});

/**
 * Rate limiter para suscripciones: 3 por minuto por IP.
 */
const limiteSuscripciones = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de suscripción, intenta de nuevo en un minuto" },
});

module.exports = {
  limiteGlobal,
  limiteReportes,
  limiteLogin,
  limiteSuscripciones,
};
