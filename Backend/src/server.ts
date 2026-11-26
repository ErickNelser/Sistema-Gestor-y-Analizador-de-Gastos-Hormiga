import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { interpretarTexto } from './interprete.js';

const app = express();

// Configuración de CORS para permitir solicitudes desde el Frontend (192.168.100.18) y otros orígenes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Endpoints de comprobación de estado (Healthchecks)
app.get('/', (_req, res) => res.json({ 
  status: 'online', 
  service: 'Backend Gastos Hormiga', 
  ip: '192.168.119.27',
  frontend_allowed: '192.168.119.95',
  db_host: process.env.DB_HOST || '192.168.119.222'
}));
app.get('/api', (_req, res) => res.json({ ok: true, version: '1.0.0' }));
// GET /api/salud
app.get('/api/salud', (_req, res) => res.json({ ok: true, db_host: process.env.DB_HOST || '192.168.119.222' }));

// POST /api/gastos/texto
app.post('/api/gastos/texto', async (req, res) => {
  const { texto } = req.body;
  if (!texto || texto.trim() === '') return res.status(400).json({ error: 'Texto vacío' });

  try {
    const [rows]: any = await pool.query(
      'SELECT c.nombre as categoria, p.palabra, c.es_hormiga FROM palabras_clave p JOIN categorias c ON p.categoria_id = c.id'
    );
    const gastos = interpretarTexto(texto, rows);

    if (gastos.length === 0) {
      return res.json({ mensaje: 'No encontré ningún gasto en tu frase' });
    }

    const hormigaCount = gastos.filter(g => g.es_hormiga).length;
    
    for (const g of gastos) {
      const [catRes]: any = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [g.categoria]);
      const catId = catRes[0]?.id || 8; // 8 es Otros
      await pool.query(
        'INSERT INTO gastos (usuario_id, categoria_id, fecha, concepto, monto, es_hormiga) VALUES (1, ?, ?, ?, ?, ?)',
        [catId, g.fecha, g.concepto, g.monto, g.es_hormiga]
      );
    }

    res.json({ mensaje: `Se registraron ${gastos.length} gastos (${hormigaCount} hormiga)` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/gastos
app.get('/api/gastos', async (_req, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT g.id, g.fecha, g.concepto, g.monto, c.nombre as categoria, g.es_hormiga FROM gastos g JOIN categorias c ON g.categoria_id = c.id ORDER BY g.fecha DESC, g.id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// DELETE /api/gastos/:id
app.delete('/api/gastos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM gastos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

// GET /api/resumen
app.get('/api/resumen', async (_req, res) => {
  try {
    const [totales]: any = await pool.query(`
      SELECT 
        COALESCE(SUM(monto), 0) as total_gastado,
        COALESCE(SUM(CASE WHEN es_hormiga = 1 THEN monto ELSE 0 END), 0) as total_hormiga
      FROM gastos WHERE usuario_id = 1
    `);
    const [fechaRes]: any = await pool.query('SELECT MIN(fecha) as primer_fecha FROM gastos WHERE usuario_id = 1');
    const [metaRes]: any = await pool.query('SELECT nombre, monto_objetivo FROM metas WHERE usuario_id = 1 LIMIT 1');
    const [categorias]: any = await pool.query(`
      SELECT c.nombre, SUM(g.monto) as total 
      FROM gastos g JOIN categorias c ON g.categoria_id = c.id 
      WHERE g.usuario_id = 1 GROUP BY c.id ORDER BY total DESC
    `);

    const totalGastado = parseFloat(totales[0].total_gastado);
    const totalHormiga = parseFloat(totales[0].total_hormiga);
    const porcentajeHormiga = totalGastado > 0 ? (totalHormiga / totalGastado) * 100 : 0;

    let proyeccionAnual = 0;
    if (fechaRes[0].primer_fecha) {
      const hoy = new Date();
      const primer = new Date(fechaRes[0].primer_fecha);
      const dias = Math.max(1, Math.ceil((hoy.getTime() - primer.getTime()) / (1000 * 60 * 60 * 24)));
      proyeccionAnual = (totalHormiga / dias) * 365;
    }

    const meta = metaRes[0] || { nombre: 'Ahorro', monto_objetivo: 0 };
    const porcentajeMeta = meta.monto_objetivo > 0 ? Math.min(100, (totalHormiga / meta.monto_objetivo) * 100) : 0;

    res.json({
      total_gastado: totalGastado.toFixed(2),
      total_hormiga: totalHormiga.toFixed(2),
      porcentaje_hormiga: porcentajeHormiga.toFixed(1),
      proyeccion_anual: proyeccionAnual.toFixed(2),
      meta,
      porcentaje_meta: porcentajeMeta.toFixed(1),
      resumen_categorias: categorias
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

// POST /api/metas
app.post('/api/metas', async (req, res) => {
  try {
    const { nombre, monto_objetivo } = req.body;
    await pool.query(
      `INSERT INTO metas (usuario_id, nombre, monto_objetivo) VALUES (1, ?, ?) 
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), monto_objetivo = VALUES(monto_objetivo)`,
      [nombre, monto_objetivo]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar meta' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`=========================================`);
  console.log(`Backend Gastos Hormiga iniciado correctamente`);
  console.log(`Local:    http://localhost:${PORT}`);
  console.log(`En red:   http://192.168.119.27:${PORT}`);
  console.log(`Frontend: Permitido desde 192.168.119.95`);
  console.log(`Base DB:  ${process.env.DB_HOST || '192.168.119.222'}`);
  console.log(`=========================================`);
});
