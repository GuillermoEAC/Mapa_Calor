const mysql = require("mysql2/promise");
require("dotenv").config();

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,          // Pool balanceado para consultas paralelas
  maxIdle: 5,                   // Mantener conexiones listas para respuesta inmediata
  idleTimeout: 60000,           // 60s antes de liberar conexiones idle
  enableKeepAlive: true,        // Mantener conexiones vivas
  keepAliveInitialDelay: 10000, // Delay inicial de keep-alive
  connectTimeout: 10000,        // 10s timeout
};

// TiDB Cloud Serverless requiere SSL de forma obligatoria en producción
if (process.env.DB_SSL === "true" || (process.env.DB_HOST && process.env.DB_HOST.includes("tidbcloud.com"))) {
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(connectionConfig);

module.exports = pool;
