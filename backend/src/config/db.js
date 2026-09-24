const mysql = require("mysql2/promise");
require("dotenv").config();

const connectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Optimización del pool para TiDB Serverless
  waitForConnections: true,
  connectionLimit: 5,           // TiDB Serverless: mantener bajo para no saturar
  maxIdle: 2,                   // Reducir conexiones idle innecesarias
  idleTimeout: 30000,           // 30s antes de liberar conexiones idle
  enableKeepAlive: true,        // Mantener conexiones vivas en Render
  keepAliveInitialDelay: 10000, // Delay inicial de keep-alive
  connectTimeout: 10000,        // 10s timeout para cold starts de TiDB
};

// TiDB Cloud Serverless requiere SSL de forma obligatoria en producción
if (process.env.DB_SSL === "true" || (process.env.DB_HOST && process.env.DB_HOST.includes("tidbcloud.com"))) {
  connectionConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(connectionConfig);

module.exports = pool;
