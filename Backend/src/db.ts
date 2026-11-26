import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.119.222',
  user: process.env.DB_USER || 'api',
  password: process.env.DB_PASS || 'api123',
  database: process.env.DB_NAME || 'gastos_hormiga',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación inicial de conectividad (no bloqueante)
pool.getConnection()
  .then((conn) => {
    console.log(`[DB] Conexión establecida exitosamente con MySQL en ${process.env.DB_HOST || '192.168.119.222'}`);
    conn.release();
  })
  .catch((err) => {
    console.warn(`[DB AVISO] No se pudo conectar a la base de datos (${process.env.DB_HOST || '192.168.119.222'}): ${err.message}`);
    console.warn(`[DB AVISO] Asegúrese de que MySQL en 192.168.119.222 permita el usuario 'api' desde esta IP.`);
  });

