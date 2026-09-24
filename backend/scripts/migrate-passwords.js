/**
 * Script de migración: Hashear las contraseñas existentes en la BD.
 * 
 * EJECUTAR UNA SOLA VEZ después de desplegar la versión con bcrypt:
 *   node scripts/migrate-passwords.js
 * 
 * Este script busca admins con contraseñas en texto plano (no empiezan con $2b$)
 * y las reemplaza por hashes bcrypt.
 */
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function migratePasswords() {
  const connectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  if (process.env.DB_SSL === "true" || (process.env.DB_HOST && process.env.DB_HOST.includes("tidbcloud.com"))) {
    connectionConfig.ssl = { rejectUnauthorized: false };
  }

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const [admins] = await connection.query("SELECT id_admin, correo, contrasena FROM Administrador");

    let migrated = 0;
    for (const admin of admins) {
      // Si la contraseña NO empieza con $2b$, es texto plano y necesita hash
      if (!admin.contrasena.startsWith("$2b$")) {
        const hash = await bcrypt.hash(admin.contrasena, 12);
        await connection.query(
          "UPDATE Administrador SET contrasena = ? WHERE id_admin = ?",
          [hash, admin.id_admin]
        );
        console.log(`✅ Migrada contraseña del admin: ${admin.correo}`);
        migrated++;
      } else {
        console.log(`⏭️  Admin ${admin.correo} ya tiene hash bcrypt, saltando...`);
      }
    }

    console.log(`\n🎉 Migración completada. ${migrated} contraseñas actualizadas de ${admins.length} totales.`);
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
  } finally {
    await connection.end();
  }
}

migratePasswords();
