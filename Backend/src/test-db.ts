import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  host: process.env.DB_HOST || '192.168.56.12',
  user: process.env.DB_USER || 'api',
  password: process.env.DB_PASS || 'api123',
  database: process.env.DB_NAME || 'gastos_hormiga',
  connectTimeout: 5000
};

console.log('--- Probando conexión a MySQL ---');
console.log(`Host:     ${config.host}`);
console.log(`Usuario:  ${config.user}`);
console.log(`Base:     ${config.database}`);

async function test() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ ¡Conexión exitosa a la base de datos!');
    
    const [rows]: any = await connection.query('SHOW TABLES');
    console.log('Tablas encontradas:', rows.map((r: any) => Object.values(r)[0]));
    
    await connection.end();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error de conexión:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('👉 Causa probable: El servicio MySQL no está corriendo en 192.168.56.12 o bind-address está en 127.0.0.1.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.message.includes('not allowed to connect')) {
      console.error('👉 Causa probable: El usuario api no tiene permisos en MySQL desde la IP del Backend (192.168.56.11).');
      console.error("👉 Solución en VM3 (MySQL): Ejecutar: CREATE USER IF NOT EXISTS 'api'@'%' IDENTIFIED BY 'api123'; GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'%'; FLUSH PRIVILEGES;");
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('👉 Causa probable: La base de datos "gastos_hormiga" no ha sido creada aún.');
    }
    process.exit(1);
  }
}

test();
