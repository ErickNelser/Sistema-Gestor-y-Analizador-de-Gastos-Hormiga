#!/bin/bash
# generar_proyecto.sh
# Script que genera el proyecto completo "Sistema Gestor y Analizador de Gastos Hormiga"
# y lo empaqueta en un archivo ZIP listo para entregar.

set -e

PROYECTO="proyecto_lavado"
ZIP="proyecto_lavado.zip"

# Limpiar si existe
rm -rf "$PROYECTO" "$ZIP"
mkdir -p "$PROYECTO/database"
mkdir -p "$PROYECTO/backend/src"
mkdir -p "$PROYECTO/frontend/src"

echo "📁 Creando estructura del proyecto..."

# ============================================
# 1. README.md
# ============================================
cat > "$PROYECTO/README.md" << 'EOF'
# Sistema Gestor y Analizador de Gastos Hormiga

Proyecto universitario desarrollado con React (Frontend), Node + Express (Backend) y MySQL (Base de Datos).

## Arquitectura de Despliegue (3 VMs)
- **VM 1 (Windows 11, 192.168.56.10)**: Frontend compilado servido por Nginx. Configurar proxy en Nginx: `location /api/ { proxy_pass http://192.168.56.20:3000/; }`
- **VM 2 (Ubuntu, 192.168.56.20)**: Backend Node.js corriendo en puerto 3000.
- **VM 3 (Ubuntu, 192.168.56.30)**: Base de datos MySQL en puerto 3306.

## Instrucciones de Ejecución

### 1. Base de Datos (VM 3)
1. Instalar MySQL.
2. Ejecutar el script: `mysql -u root -p < database/gastos_hormiga.sql`

### 2. Backend (VM 2)
1. Instalar dependencias: `npm install`
2. Configurar `.env` con las credenciales de la VM 3.
3. Iniciar servidor: `npm run dev`

### 3. Frontend (VM 1)
1. Instalar dependencias: `npm install`
2. Compilar para producción: `npm run build`
3. Servir la carpeta `dist` resultante con Nginx.
4. Para desarrollo local: `npm run dev`

## Reglas de Negocio
- Separa gastos por coma, " y ", " luego ", " después ".
- Detecta "hoy" y "ayer", heredando la fecha a los siguientes gastos hasta cambiar.
- Identifica el primer número como monto.
- Clasifica por palabras clave (acepta plurales). Si no coincide, es "Otros".
- Gasto hormiga: categoría marcada como hormiga Y monto <= 20 Bs.
- Proyección anual: (Total hormiga / días desde primer gasto, mín 1) * 365.
EOF

# ============================================
# 2. Base de Datos
# ============================================
cat > "$PROYECTO/database/gastos_hormiga.sql" << 'EOF'
CREATE DATABASE IF NOT EXISTS gastos_hormiga;
USE gastos_hormiga;

-- Tablas
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    es_hormiga BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS palabras_clave (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    palabra VARCHAR(50) NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    fecha DATE NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    es_hormiga BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS metas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    monto_objetivo DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Datos iniciales
INSERT INTO usuarios (id, nombre) VALUES (1, 'Usuario Principal');

INSERT INTO categorias (id, nombre, es_hormiga) VALUES
(1, 'Salteñas y Snacks', TRUE),
(2, 'Dulces', TRUE),
(3, 'Bebidas', TRUE),
(4, 'Taxi', TRUE),
(5, 'Recargas', TRUE),
(6, 'Pasajes', FALSE),
(7, 'Almuerzo', FALSE),
(8, 'Otros', FALSE);

INSERT INTO palabras_clave (categoria_id, palabra) VALUES
(1, 'saltena'), (1, 'tucumana'), (1, 'cunape'), (1, 'empanada'),
(2, 'chocolate'), (2, 'dulce'), (2, 'helado'), (2, 'chicle'),
(3, 'cafe'), (3, 'cafecito'), (3, 'te'), (3, 'soda'), (3, 'gaseosa'), (3, 'jugo'),
(4, 'taxi'),
(5, 'recarga'),
(6, 'pasaje'), (6, 'trufi'), (6, 'micro'),
(7, 'almuerzo'), (7, 'comida');

-- Usuario API con permisos mínimos solo desde la VM 2
DROP USER IF EXISTS 'api'@'192.168.56.20';
CREATE USER 'api'@'192.168.56.20' IDENTIFIED BY 'api123';
GRANT SELECT, INSERT, UPDATE, DELETE ON gastos_hormiga.* TO 'api'@'192.168.56.20';
FLUSH PRIVILEGES;
EOF

# ============================================
# 3. Backend - package.json
# ============================================
cat > "$PROYECTO/backend/package.json" << 'EOF'
{
  "name": "backend-gastos-hormiga",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
EOF

# ============================================
# 4. Backend - .env
# ============================================
cat > "$PROYECTO/backend/.env" << 'EOF'
PORT=3000
DB_HOST=192.168.56.30
DB_USER=api
DB_PASS=api123
DB_NAME=gastos_hormiga
EOF

# ============================================
# 5. Backend - tsconfig.json
# ============================================
cat > "$PROYECTO/backend/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# ============================================
# 6. Backend - db.ts
# ============================================
cat > "$PROYECTO/backend/src/db.ts" << 'EOF'
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
EOF

# ============================================
# 7. Backend - interprete.ts
# ============================================
cat > "$PROYECTO/backend/src/interprete.ts" << 'EOF'
export interface PalabraClave {
  categoria: string;
  palabra: string;
  es_hormiga: number;
}

export interface GastoInterpretado {
  concepto: string;
  monto: number;
  fecha: string;
  categoria: string;
  es_hormiga: boolean;
}

export function interpretarTexto(texto: string, palabrasClave: PalabraClave[]): GastoInterpretado[] {
  if (!texto || texto.trim() === '') return [];

  // 1. Minúsculas y sin acentos
  let limpio = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // 2. Eliminar palabras de relleno
  limpio = limpio.replace(/\b(bs|bolivianos|gaste|pague|compre)\b/g, "");

  // 3. Separar por coma, " y ", " luego ", " después "
  const separadores = /(?:,|\s+y\s+|\s+luego\s+|\s+despues\s+)/;
  const pedazos = limpio.split(separadores).map(p => p.trim()).filter(p => p.length > 0);

  const gastos: GastoInterpretado[] = [];
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = ayer.toISOString().split('T')[0];

  let fechaHerencia = hoyStr;

  for (const pedazo of pedazos) {
    let textoProc = pedazo;
    let fechaStr = fechaHerencia;

    if (textoProc.includes('ayer')) {
      fechaStr = ayerStr;
      fechaHerencia = ayerStr;
      textoProc = textoProc.replace('ayer', '').trim();
    } else if (textoProc.includes('hoy')) {
      fechaStr = hoyStr;
      fechaHerencia = hoyStr;
      textoProc = textoProc.replace('hoy', '').trim();
    }

    // 4. Monto: primer número del pedazo
    const matchMonto = textoProc.match(/(\d+(?:\.\d+)?)/);
    if (!matchMonto) continue;
    
    const monto = parseFloat(matchMonto[1]);
    if (monto <= 0) continue;

    const concepto = textoProc.replace(matchMonto[1], '').replace(/\s+/g, ' ').trim();

    // 5. Categoría: buscar palabra clave completa (con plural)
    let categoriaNombre = "Otros";
    let esHormigaCat = false;

    for (const pc of palabrasClave) {
      const palabra = pc.palabra;
      // Construir regex: palabra exacta, con "s" o "es" al final, como palabra completa
      const regex = new RegExp(`\\b${palabra}(s|es)?\\b`);
      if (regex.test(textoProc)) {
        categoriaNombre = pc.categoria;
        esHormigaCat = pc.es_hormiga === 1;
        break;
      }
    }

    // 6. Gasto hormiga: categoría hormiga y monto <= 20
    const esHormiga = esHormigaCat && monto <= 20;

    gastos.push({
      concepto: concepto || categoriaNombre,
      monto,
      fecha: fechaStr,
      categoria: categoriaNombre,
      es_hormiga: esHormiga
    });
  }

  return gastos;
}
EOF

# ============================================
# 8. Backend - server.ts
# ============================================
cat > "$PROYECTO/backend/src/server.ts" << 'EOF'
import express from 'express';
import { pool } from './db.js';
import { interpretarTexto } from './interprete.js';

const app = express();
app.use(express.json());

// GET /api/salud
app.get('/api/salud', (_req, res) => res.json({ ok: true }));

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
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// DELETE /api/gastos/:id
app.delete('/api/gastos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM gastos WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
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
    res.status(500).json({ error: 'Error al actualizar meta' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
EOF

# ============================================
# 9. Frontend - package.json
# ============================================
cat > "$PROYECTO/frontend/package.json" << 'EOF'
{
  "name": "frontend-gastos-hormiga",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
EOF

# ============================================
# 10. Frontend - tsconfig.json
# ============================================
cat > "$PROYECTO/frontend/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > "$PROYECTO/frontend/tsconfig.node.json" << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# ============================================
# 11. Frontend - vite.config.ts
# ============================================
cat > "$PROYECTO/frontend/vite.config.ts" << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://192.168.56.20:3000'
    }
  }
});
EOF

# ============================================
# 12. Frontend - index.html
# ============================================
cat > "$PROYECTO/frontend/index.html" << 'EOF'
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gastos Hormiga</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ============================================
# 13. Frontend - main.tsx
# ============================================
cat > "$PROYECTO/frontend/src/main.tsx" << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF

# ============================================
# 14. Frontend - App.tsx
# ============================================
cat > "$PROYECTO/frontend/src/App.tsx" << 'EOF'
import { useState, useEffect } from 'react';

interface Gasto {
  id: number;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string;
  es_hormiga: boolean;
}

interface Resumen {
  total_gastado: string;
  total_hormiga: string;
  porcentaje_hormiga: string;
  proyeccion_anual: string;
  meta: { nombre: string; monto_objetivo: string };
  porcentaje_meta: string;
  resumen_categorias: { nombre: string; total: string }[];
}

export default function App() {
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState('');
  const [metaNombre, setMetaNombre] = useState('');
  const [metaMonto, setMetaMonto] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      const [resGastos, resResumen] = await Promise.all([
        fetch('/api/gastos'),
        fetch('/api/resumen')
      ]);
      if (!resGastos.ok || !resResumen.ok) throw new Error();
      const dataGastos = await resGastos.json();
      const dataResumen = await resResumen.json();
      setGastos(dataGastos);
      setResumen(dataResumen);
      if (dataResumen.meta.monto_objetivo > 0) {
        setMetaNombre(dataResumen.meta.nombre);
        setMetaMonto(dataResumen.meta.monto_objetivo);
      }
      if (dataGastos.length === 0) setMensaje('Aún no registras gastos');
    } catch {
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    try {
      const res = await fetch('/api/gastos/texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      });
      const data = await res.json();
      setMensaje(data.mensaje || data.error);
      setTexto('');
      fetchData();
    } catch {
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: metaNombre, monto_objetivo: metaMonto })
    });
    fetchData();
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h1>Analizador de Gastos Hormiga</h1>
      
      <form onSubmit={handleSubmit} className="input-group">
        <input 
          value={texto} 
          onChange={e => setTexto(e.target.value)} 
          placeholder="Ej: Ayer gasté 5 en pasaje, 16 en dos salteñas y hoy 10 en cafecito" 
          autoFocus
        />
        <button type="submit">Registrar</button>
      </form>
      {mensaje && <p className="mensaje">{mensaje}</p>}

      {resumen && (
        <div className="resumen-grid">
          <div className="card"><h3>Total Gastado</h3><p>Bs {resumen.total_gastado}</p></div>
          <div className="card"><h3>Total Hormiga</h3><p>Bs {resumen.total_hormiga}</p></div>
          <div className="card"><h3>% Hormiga</h3><p>{resumen.porcentaje_hormiga}%</p></div>
          <div className="card"><h3>Proyección Anual</h3><p>Bs {resumen.proyeccion_anual}</p></div>
        </div>
      )}

      {resumen && (
        <div className="meta-section">
          <h3>Meta de Ahorro: {resumen.meta.nombre || 'Sin nombre'}</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${resumen.porcentaje_meta}%` }}>
              {resumen.porcentaje_meta}%
            </div>
          </div>
          <form onSubmit={handleMeta} className="meta-form">
            <input placeholder="Nombre meta" value={metaNombre} onChange={e => setMetaNombre(e.target.value)} required />
            <input type="number" placeholder="Monto objetivo" value={metaMonto} onChange={e => setMetaMonto(e.target.value)} required />
            <button type="submit">Actualizar Meta</button>
          </form>
        </div>
      )}

      {resumen && resumen.resumen_categorias.length > 0 && (
        <div className="categorias">
          <h3>Resumen por Categoría</h3>
          <ul>
            {resumen.resumen_categorias.map((c, i) => (
              <li key={i}>{c.nombre}: Bs {parseFloat(c.total).toFixed(2)}</li>
            ))}
          </ul>
        </div>
      )}

      <h3>Historial de Gastos</h3>
      {gastos.length === 0 ? (
        <p>Aún no registras gastos</p>
      ) : (
        <table>
          <thead>
            <tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {gastos.map(g => (
              <tr key={g.id} className={g.es_hormiga ? 'hormiga' : ''}>
                <td>{g.fecha}</td>
                <td>{g.concepto}</td>
                <td>{g.categoria}</td>
                <td>Bs {g.monto.toFixed(2)}</td>
                <td><button onClick={() => handleDelete(g.id)}>Borrar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
EOF

# ============================================
# 15. Frontend - App.css
# ============================================
cat > "$PROYECTO/frontend/src/App.css" << 'EOF'
body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
.container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.input-group { display: flex; gap: 10px; margin-bottom: 20px; }
.input-group input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
button:hover { background: #0056b3; }
.mensaje { color: #28a745; font-weight: bold; }
.error { color: #dc3545; font-weight: bold; text-align: center; margin-top: 50px; }
.resumen-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
.card { background: #e9ecef; padding: 15px; border-radius: 4px; text-align: center; }
.card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
.card p { margin: 0; font-size: 20px; font-weight: bold; color: #333; }
.meta-section { margin-bottom: 20px; padding: 15px; background: #f1f3f5; border-radius: 4px; }
.progress-bar { width: 100%; background: #dee2e6; border-radius: 10px; overflow: hidden; margin: 10px 0; height: 25px; }
.progress-fill { background: #28a745; color: white; text-align: center; line-height: 25px; font-size: 14px; transition: width 0.3s; }
.meta-form { display: flex; gap: 10px; margin-top: 10px; }
.meta-form input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; }
th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
tr.hormiga { background-color: #fff3cd; }
.categorias ul { list-style: none; padding: 0; }
.categorias li { padding: 5px 0; border-bottom: 1px solid #eee; }
EOF

# ============================================
# 16. Empaquetar en ZIP
# ============================================
echo "📦 Empaquetando proyecto..."
cd "$PROYECTO"
zip -r "../$ZIP" . -x ".DS_Store" "node_modules/*" "dist/*"
cd ..

echo ""
echo "✅ ¡Proyecto generado exitosamente!"
echo "   📁 Carpeta: $PROYECTO/"
echo "   📦 ZIP:     $ZIP"
echo ""
echo "Instrucciones de uso inmediato:"
echo "1. Copia todo el bloque de código del script anterior."
echo "2. Pégalo en un archivo de texto y guárdalo como generar_proyecto.sh"
echo "3. Abre tu terminal y ejecuta: chmod +x generar_proyecto.sh"
echo "4. Ejecuta: ./generar_proyecto.sh"
echo "5. El script generará la carpeta $PROYECTO con toda la estructura y el archivo $ZIP listo para ser entregado o desplegado."