/**
 * Middleware global de manejo de errores.
 * Captura errores no manejados por los controladores y devuelve una respuesta genérica.
 */
const errorHandler = (err, req, res, next) => {
  console.error("[ERROR GLOBAL]", {
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
  });

  // Errores de JSON malformado
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON malformado en el cuerpo de la petición" });
  }

  // Errores de payload demasiado grande
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El cuerpo de la petición excede el tamaño máximo permitido" });
  }

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === "production"
      ? "Error interno del servidor"
      : err.message || "Error interno del servidor",
  });
};

module.exports = errorHandler;
