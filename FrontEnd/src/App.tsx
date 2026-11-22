import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

export interface Gasto {
  id: number;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string;
  es_hormiga: boolean | number;
}

export interface Resumen {
  total_gastado: string;
  total_hormiga: string;
  porcentaje_hormiga: string;
  proyeccion_anual: string;
  meta: { nombre: string; monto_objetivo: string | number };
  porcentaje_meta: string;
  resumen_categorias: { nombre: string; total: string | number }[];
}

// Palabras clave para interpretación idéntica a las reglas de negocio
const PALABRAS_CLAVE = [
  { categoria: 'Salteñas y Snacks', palabra: 'saltena', es_hormiga: true },
  { categoria: 'Salteñas y Snacks', palabra: 'tucumana', es_hormiga: true },
  { categoria: 'Salteñas y Snacks', palabra: 'cunape', es_hormiga: true },
  { categoria: 'Salteñas y Snacks', palabra: 'empanada', es_hormiga: true },
  { categoria: 'Dulces', palabra: 'chocolate', es_hormiga: true },
  { categoria: 'Dulces', palabra: 'dulce', es_hormiga: true },
  { categoria: 'Dulces', palabra: 'helado', es_hormiga: true },
  { categoria: 'Dulces', palabra: 'chicle', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'cafe', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'cafecito', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'te', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'soda', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'gaseosa', es_hormiga: true },
  { categoria: 'Bebidas', palabra: 'jugo', es_hormiga: true },
  { categoria: 'Taxi', palabra: 'taxi', es_hormiga: true },
  { categoria: 'Recargas', palabra: 'recarga', es_hormiga: true },
  { categoria: 'Pasajes', palabra: 'pasaje', es_hormiga: false },
  { categoria: 'Pasajes', palabra: 'trufi', es_hormiga: false },
  { categoria: 'Pasajes', palabra: 'micro', es_hormiga: false },
  { categoria: 'Almuerzo', palabra: 'almuerzo', es_hormiga: false },
  { categoria: 'Almuerzo', palabra: 'comida', es_hormiga: false }
];

// Parser local de frase para asegurar interactividad continua
function interpretarFraseLocal(texto: string): Gasto[] {
  if (!texto || !texto.trim()) return [];
  let limpio = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  limpio = limpio.replace(/\b(bs|bolivianos|gaste|pague|compre)\b/g, "");

  const separadores = /(?:,|\s+y\s+|\s+luego\s+|\s+despues\s+)/;
  const pedazos = limpio.split(separadores).map(p => p.trim()).filter(p => p.length > 0);

  const gastos: Gasto[] = [];
  const hoyStr = new Date().toISOString().split('T')[0];
  const ayer = new Date();
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

    const matchMonto = textoProc.match(/(\d+(?:\.\d+)?)/);
    if (!matchMonto) continue;

    const monto = parseFloat(matchMonto[1]);
    if (monto <= 0) continue;

    const concepto = textoProc.replace(matchMonto[1], '').replace(/\s+/g, ' ').trim();
    let categoriaNombre = "Otros";
    let esHormigaCat = false;

    for (const pc of PALABRAS_CLAVE) {
      const regex = new RegExp(`\\b${pc.palabra}(s|es)?\\b`);
      if (regex.test(textoProc)) {
        categoriaNombre = pc.categoria;
        esHormigaCat = pc.es_hormiga;
        break;
      }
    }

    const esHormiga = esHormigaCat && monto <= 20;

    gastos.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      fecha: fechaStr,
      concepto: concepto || categoriaNombre,
      monto,
      categoria: categoriaNombre,
      es_hormiga: esHormiga
    });
  }

  return gastos;
}

// Cálculo de métricas
function calcularResumen(listaGastos: Gasto[], metaNom: string, metaObj: string | number): Resumen {
  let totalGastado = 0;
  let totalHormiga = 0;
  const catMap: Record<string, number> = {};

  listaGastos.forEach(g => {
    totalGastado += g.monto;
    if (g.es_hormiga) totalHormiga += g.monto;
    catMap[g.categoria] = (catMap[g.categoria] || 0) + g.monto;
  });

  const pctHormiga = totalGastado > 0 ? (totalHormiga / totalGastado) * 100 : 0;
  const proyAnual = totalHormiga * 365;

  const target = parseFloat(String(metaObj)) || 500;
  const pctMeta = target > 0 ? Math.min(100, (totalHormiga / target) * 100) : 0;

  const cats = Object.entries(catMap)
    .map(([nombre, total]) => ({ nombre, total: total.toFixed(2) }))
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  return {
    total_gastado: totalGastado.toFixed(2),
    total_hormiga: totalHormiga.toFixed(2),
    porcentaje_hormiga: pctHormiga.toFixed(1),
    proyeccion_anual: proyAnual.toFixed(2),
    meta: { nombre: metaNom || 'Fondo de Ahorro', monto_objetivo: target.toFixed(2) },
    porcentaje_meta: pctMeta.toFixed(1),
    resumen_categorias: cats.length > 0 ? cats : [
      { nombre: 'Salteñas y Snacks', total: '0.00' },
      { nombre: 'Bebidas', total: '0.00' },
      { nombre: 'Pasajes', total: '0.00' }
    ]
  };
}

// Datos de demostración iniciales
const GASTOS_DEMO: Gasto[] = [
  { id: 1, fecha: new Date().toISOString().split('T')[0], concepto: 'dos salteñas de pollo', monto: 16.0, categoria: 'Salteñas y Snacks', es_hormiga: true },
  { id: 2, fecha: new Date().toISOString().split('T')[0], concepto: 'cafecito con leche', monto: 10.0, categoria: 'Bebidas', es_hormiga: true },
  { id: 3, fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0], concepto: 'pasaje de micro', monto: 5.0, categoria: 'Pasajes', es_hormiga: false },
  { id: 4, fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0], concepto: 'almuerzo completo', monto: 18.0, categoria: 'Almuerzo', es_hormiga: false },
  { id: 5, fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0], concepto: 'recarga de megas', monto: 10.0, categoria: 'Recargas', es_hormiga: true }
];

export default function App() {
  const [texto, setTexto] = useState('');
  const [mensaje, setMensaje] = useState('Se registraron 3 gastos (2 hormiga)');
  const [gastos, setGastos] = useState<Gasto[]>(GASTOS_DEMO);
  const [metaNombre, setMetaNombre] = useState('Fondo de Emergencia');
  const [metaMonto, setMetaMonto] = useState('600');
  const [resumen, setResumen] = useState<Resumen>(() => calcularResumen(GASTOS_DEMO, 'Fondo de Emergencia', '600'));
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [filtro, setFiltro] = useState<'todos' | 'hormiga' | 'comun'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [servidorConectado, setServidorConectado] = useState<boolean | null>(null);

  // Consulta de datos al servidor
  const fetchData = async () => {
    try {
      setError('');
      const [resGastos, resResumen] = await Promise.all([
        fetch('/api/gastos'),
        fetch('/api/resumen')
      ]);

      if (!resGastos.ok || !resResumen.ok) {
        throw new Error('Error al conectar con la API');
      }

      const dataGastos: Gasto[] = await resGastos.json();
      const dataResumen: Resumen = await resResumen.json();

      setGastos(dataGastos);
      setResumen(dataResumen);
      setServidorConectado(true);

      if (dataResumen.meta && Number(dataResumen.meta.monto_objetivo) > 0) {
        setMetaNombre(dataResumen.meta.nombre || '');
        setMetaMonto(String(dataResumen.meta.monto_objetivo));
      }

      if (dataGastos.length === 0) {
        setMensaje('Aún no registras gastos');
      }
    } catch {
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
      setServidorConectado(false);
    }
  };

  useEffect(() => {
    let montado = true;

    const inicializar = async () => {
      try {
        setError('');
        const [resGastos, resResumen] = await Promise.all([
          fetch('/api/gastos'),
          fetch('/api/resumen')
        ]);

        if (!resGastos.ok || !resResumen.ok) throw new Error();

        const dataGastos: Gasto[] = await resGastos.json();
        const dataResumen: Resumen = await resResumen.json();

        if (!montado) return;
        setGastos(dataGastos);
        setResumen(dataResumen);
        setServidorConectado(true);

        if (dataResumen.meta && Number(dataResumen.meta.monto_objetivo) > 0) {
          setMetaNombre(dataResumen.meta.nombre || '');
          setMetaMonto(String(dataResumen.meta.monto_objetivo));
        }

        if (dataGastos.length === 0) setMensaje('Aún no registras gastos');
      } catch {
        if (!montado) return;
        setError('Servidor no disponible, intenta de nuevo en unos minutos');
        setServidorConectado(false);
      }
    };

    void inicializar();

    return () => {
      montado = false;
    };
  }, []);

  // Registro de gastos en lenguaje natural
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setCargando(true);

    try {
      const res = await fetch('/api/gastos/texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
      });

      if (!res.ok) throw new Error('Servidor offline');

      const data = await res.json();
      setMensaje(data.mensaje || data.error || 'Gasto registrado');
      setTexto('');
      await fetchData();
    } catch {
      // Fallback local: parsea la frase exactamente con las reglas de negocio
      const nuevosGastos = interpretarFraseLocal(texto);
      if (nuevosGastos.length === 0) {
        setMensaje('No encontré ningún gasto en tu frase');
      } else {
        const hormigaCount = nuevosGastos.filter(g => g.es_hormiga).length;
        const listaActualizada = [...nuevosGastos, ...gastos];
        setGastos(listaActualizada);
        setResumen(calcularResumen(listaActualizada, metaNombre, metaMonto));
        setMensaje(`Se registraron ${nuevosGastos.length} gastos (${hormigaCount} hormiga)`);
        setTexto('');
      }
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
      setServidorConectado(false);
    } finally {
      setCargando(false);
    }
  };

  // Eliminar un gasto por ID
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/gastos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMensaje('Gasto eliminado exitosamente');
        await fetchData();
      } else {
        throw new Error();
      }
    } catch {
      // Borrado local en caso de que el backend esté desconectado
      const listaRestante = gastos.filter(g => g.id !== id);
      setGastos(listaRestante);
      setResumen(calcularResumen(listaRestante, metaNombre, metaMonto));
      setMensaje('Gasto eliminado exitosamente');
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
    }
  };

  // Actualizar meta de ahorro
  const handleMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaNombre.trim() || !metaMonto) return;

    try {
      const res = await fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: metaNombre.trim(),
          monto_objetivo: parseFloat(metaMonto)
        })
      });

      if (res.ok) {
        setMensaje(`Meta "${metaNombre}" guardada con éxito`);
        await fetchData();
      } else {
        throw new Error();
      }
    } catch {
      // Actualización local
      setResumen(calcularResumen(gastos, metaNombre.trim(), metaMonto));
      setMensaje(`Meta "${metaNombre}" guardada`);
      setError('Servidor no disponible, intenta de nuevo en unos minutos');
    }
  };

  // Filtrado reactivo de gastos
  const gastosFiltrados = useMemo(() => {
    return gastos.filter(g => {
      const esHormiga = Boolean(g.es_hormiga);
      if (filtro === 'hormiga' && !esHormiga) return false;
      if (filtro === 'comun' && esHormiga) return false;
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideConcepto = g.concepto.toLowerCase().includes(query);
        const coincideCategoria = g.categoria.toLowerCase().includes(query);
        const coincideFecha = g.fecha.toLowerCase().includes(query);
        if (!coincideConcepto && !coincideCategoria && !coincideFecha) return false;
      }
      return true;
    });
  }, [gastos, filtro, busqueda]);

  const totalHormigaCount = useMemo(() => gastos.filter(g => Boolean(g.es_hormiga)).length, [gastos]);
  const totalComunCount = useMemo(() => gastos.filter(g => !g.es_hormiga).length, [gastos]);

  const ejemplosFrases = [
    'Ayer gasté 5 en pasaje, 16 en dos salteñas y hoy 10 en cafecito',
    'Gasté 8 en salteña',
    '25 en cafecito',
    'Ayer 12 en taxi y hoy 4 en helado',
    'Gasté 15 en almuerzo y 7 en soda'
  ];

  const formatearMonto = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };

  return (
    <div className="app-layout">
      {/* ================= 1. BARRA SUPERIOR (HEADER NEGRO / PLOMO / ORO) ================= */}
      <header className="header-bar">
        <div className="header-container">
          <div className="brand-group">
            <div className="brand-icon">
              <span className="brand-ant">🐜</span>
            </div>
            <div>
              <div className="brand-badge-row">
                <h1 className="brand-title">Gestor &amp; Analizador de Gastos Hormiga</h1>
                <span className="badge-tech">FINTECH 3-TIER</span>
              </div>
              <p className="brand-subtitle">Control inteligente de micropagos, fugas financieras y metas de ahorro</p>
            </div>
          </div>

          <div className="header-status">
            {servidorConectado === true && (
              <span className="status-pill status-online">
                <span className="status-dot"></span> Servidor Conectado
              </span>
            )}
            {servidorConectado === false && (
              <button onClick={fetchData} className="status-pill status-offline" title="Haz clic para reintentar la conexión con el Backend">
                <span className="status-dot-offline"></span> Servidor Desconectado &bull; Reintentar
              </button>
            )}
            {servidorConectado === null && (
              <span className="status-pill status-connecting">
                <span className="status-dot-connecting"></span> Verificando conexión...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="main-content">
        {/* Aviso de error de servidor */}
        {error && (
          <div className="alert-card alert-error">
            <div className="alert-content">
              <span className="alert-icon">⚠️</span>
              <div>
                <strong>Aviso del Sistema:</strong>
                <p>{error}</p>
              </div>
            </div>
            <button type="button" onClick={fetchData} className="btn-retry">
              Reintentar Conexión
            </button>
          </div>
        )}

        {/* ================= CARD 1: REGISTRO INTELIGENTE POR FRASE (AZUL & NEGRO) ================= */}
        <section className="card card-input-section">
          <div className="card-header">
            <div className="card-header-icon bg-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <h2 className="card-title">Registro Inteligente de Gastos</h2>
              <p className="card-description">
                Escribe en lenguaje natural. El analizador extrae montos, fechas (hoy o ayer), conceptos y detecta automáticamente si es gasto hormiga (&le; 20 Bs).
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-row">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ej: Ayer gasté 5 en pasaje, 16 en dos salteñas y hoy 10 en cafecito"
                  className="main-input"
                  autoFocus
                  disabled={cargando}
                />
                {texto && (
                  <button
                    type="button"
                    onClick={() => setTexto('')}
                    className="clear-input-btn"
                    title="Limpiar texto"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={cargando || !texto.trim()}
              >
                {cargando ? (
                  <span className="spinner-text">Procesando...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Registrar Gastos
                  </>
                )}
              </button>
            </div>

            {/* Chips de ejemplos */}
            <div className="chips-container">
              <span className="chips-label">💡 Ejemplos rápidos para probar (haz clic en cualquiera):</span>
              <div className="chips-list">
                {ejemplosFrases.map((ejemplo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTexto(ejemplo)}
                    className="chip-btn"
                  >
                    {ejemplo}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Mensaje de respuesta */}
          {mensaje && (
            <div className={`message-banner ${mensaje.includes('error') || mensaje.includes('No encontré') ? 'msg-warning' : 'msg-success'}`}>
              <span className="msg-icon">
                {mensaje.includes('error') || mensaje.includes('No encontré') ? 'ℹ️' : '✅'}
              </span>
              <span className="msg-text">{mensaje}</span>
            </div>
          )}
        </section>

        {/* ================= CARD 2: 4 TARJETAS DE RESUMEN (AZUL, AMARILLO, VERDE, NEGRO) ================= */}
        <section className="resumen-metrics-grid">
          {/* Card 1: Total Gastado (AZUL) */}
          <div className="card metric-card metric-blue">
            <div className="metric-header">
              <span className="metric-tag tag-blue">Total Gastado</span>
              <div className="metric-icon-box bg-blue-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <p className="metric-label">Monto Total Acumulado</p>
            <h3 className="metric-value text-blue">Bs {formatearMonto(resumen.total_gastado)}</h3>
            <p className="metric-footer">Suma de todos los consumos</p>
          </div>

          {/* Card 2: Total Hormiga (AMARILLO / ORO) */}
          <div className="card metric-card metric-yellow">
            <div className="metric-header">
              <span className="metric-tag tag-yellow">🐜 Fuga Financiera</span>
              <div className="metric-icon-box bg-yellow-light">
                <span className="ant-symbol">🐜</span>
              </div>
            </div>
            <p className="metric-label">Total Gastos Hormiga</p>
            <h3 className="metric-value text-yellow">Bs {formatearMonto(resumen.total_hormiga)}</h3>
            <p className="metric-footer">Consumo impulsivo (&le; 20 Bs)</p>
          </div>

          {/* Card 3: Porcentaje Hormiga (VERDE ESMERALDA) */}
          <div className="card metric-card metric-green">
            <div className="metric-header">
              <span className="metric-tag tag-green">Proporción</span>
              <div className="metric-icon-box bg-green-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <line x1="19" y1="5" x2="5" y2="19" />
                  <circle cx="6.5" cy="6.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
              </div>
            </div>
            <p className="metric-label">% Gasto Hormiga</p>
            <h3 className="metric-value text-green">{resumen.porcentaje_hormiga}%</h3>
            <div className="mini-progress-track">
              <div
                className="mini-progress-bar"
                style={{ width: `${Math.min(100, parseFloat(resumen.porcentaje_hormiga) || 0)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 4: Proyección Anual (NEGRO / PLOMO) */}
          <div className="card metric-card metric-dark">
            <div className="metric-header">
              <span className="metric-tag tag-dark">Proyección 365</span>
              <div className="metric-icon-box bg-dark-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
            <p className="metric-label">Proyección Anual Hormiga</p>
            <h3 className="metric-value text-dark">Bs {formatearMonto(resumen.proyeccion_anual)}</h3>
            <p className="metric-footer">Fuga estimada al año</p>
          </div>
        </section>

        {/* ================= SECCIÓN DE DOS COLUMNAS: META Y CATEGORÍAS ================= */}
        <div className="two-col-grid">
          {/* CARD 3: META DE AHORRO (VERDE & PLOMO) */}
          <section className="card card-meta">
            <div className="card-header">
              <div className="card-header-icon bg-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Meta de Ahorro</h2>
                <p className="card-description">Supervisa cómo los gastos hormiga absorben tu objetivo financiero</p>
              </div>
            </div>

            <div className="meta-body">
              <div className="meta-info-box">
                <div className="meta-goal-details">
                  <span className="meta-subtitle">Objetivo Actual</span>
                  <h4 className="meta-name">{resumen.meta.nombre || 'Sin meta configurada'}</h4>
                </div>
                <div className="meta-numbers">
                  <div className="meta-stat">
                    <span className="stat-label">Meta Objetivo:</span>
                    <strong className="stat-value text-blue">Bs {formatearMonto(resumen.meta.monto_objetivo)}</strong>
                  </div>
                  <div className="meta-stat">
                    <span className="stat-label">Consumido Hormiga:</span>
                    <strong className="stat-value text-yellow">Bs {formatearMonto(resumen.total_hormiga)}</strong>
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="progress-section">
                <div className="progress-labels">
                  <span>Avance consumido por hormiga:</span>
                  <strong className="progress-percentage">{resumen.porcentaje_meta}%</strong>
                </div>
                <div className="progress-track" role="progressbar" aria-valuenow={parseFloat(resumen.porcentaje_meta) || 0} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`progress-fill ${parseFloat(resumen.porcentaje_meta) >= 100 ? 'progress-fill-warning' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(0, parseFloat(resumen.porcentaje_meta) || 0))}%` }}
                  >
                    {parseFloat(resumen.porcentaje_meta) > 12 && `${resumen.porcentaje_meta}%`}
                  </div>
                </div>
              </div>

              {/* Formulario de actualización */}
              <form onSubmit={handleMeta} className="meta-update-form">
                <h5 className="form-legend">Configurar o Actualizar Meta</h5>
                <div className="meta-inputs-grid">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Viaje, Laptop)"
                    value={metaNombre}
                    onChange={(e) => setMetaNombre(e.target.value)}
                    className="form-input"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="Monto objetivo (Bs)"
                    value={metaMonto}
                    onChange={(e) => setMetaMonto(e.target.value)}
                    className="form-input"
                    required
                  />
                  <button type="submit" className="btn-green">
                    Actualizar Meta
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* CARD 4: RESUMEN POR CATEGORÍA (PLOMO & AMARILLO & AZUL) */}
          <section className="card card-categories">
            <div className="card-header">
              <div className="card-header-icon bg-plomo">
                <svg viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
              </div>
              <div>
                <h2 className="card-title">Resumen por Categoría</h2>
                <p className="card-description">Gastos ordenados de mayor a menor impacto presupuestario</p>
              </div>
            </div>

            <div className="categories-list">
              {resumen.resumen_categorias && resumen.resumen_categorias.length > 0 ? (
                resumen.resumen_categorias.map((cat, idx) => {
                  const totalFloat = typeof cat.total === 'string' ? parseFloat(cat.total) : cat.total;
                  const maxTotal = typeof resumen.total_gastado === 'string' ? parseFloat(resumen.total_gastado) : 1;
                  const pct = maxTotal > 0 ? ((totalFloat / maxTotal) * 100).toFixed(0) : '0';
                  const esHormigaCat = ['Salteñas y Snacks', 'Dulces', 'Bebidas', 'Taxi', 'Recargas'].includes(cat.nombre);

                  return (
                    <div key={idx} className="category-item">
                      <div className="category-header">
                        <div className="category-left">
                          <span className="category-rank">#{idx + 1}</span>
                          <span className="category-name">{cat.nombre}</span>
                          {esHormigaCat ? (
                            <span className="badge badge-hormiga">🐜 Hormiga</span>
                          ) : (
                            <span className="badge badge-comun">📋 Regular</span>
                          )}
                        </div>
                        <span className="category-amount">Bs {formatearMonto(cat.total)}</span>
                      </div>
                      <div className="category-progress-track">
                        <div
                          className={`category-progress-bar ${esHormigaCat ? 'bar-yellow' : 'bar-blue'}`}
                          style={{ width: `${Math.min(100, Math.max(5, parseFloat(pct)))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-categories">
                  <p>No se encontraron categorías registradas aún.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================= CARD 5: HISTORIAL DE GASTOS (AMARILLO / AZUL / PLOMO / NEGRO) ================= */}
        <section className="card card-history">
          <div className="history-header-group">
            <div className="card-header-icon bg-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="history-title-area">
              <h2 className="card-title">Historial de Gastos</h2>
              <p className="card-description">Registro cronológico con clasificación inteligente</p>
            </div>

            {/* Pestañas de filtrado */}
            <div className="filter-tabs">
              <button
                type="button"
                className={`filter-tab ${filtro === 'todos' ? 'tab-active' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                Todos <span className="tab-count">{gastos.length}</span>
              </button>
              <button
                type="button"
                className={`filter-tab ${filtro === 'hormiga' ? 'tab-active tab-active-yellow' : ''}`}
                onClick={() => setFiltro('hormiga')}
              >
                🐜 Hormiga <span className="tab-count-yellow">{totalHormigaCount}</span>
              </button>
              <button
                type="button"
                className={`filter-tab ${filtro === 'comun' ? 'tab-active tab-active-blue' : ''}`}
                onClick={() => setFiltro('comun')}
              >
                📋 Comunes <span className="tab-count-blue">{totalComunCount}</span>
              </button>
            </div>
          </div>

          {/* Buscador rápido */}
          {gastos.length > 0 && (
            <div className="search-bar-wrapper">
              <div className="search-input-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Filtrar por concepto, categoría o fecha..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input"
                />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')} className="clear-search-btn">
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabla de gastos */}
          {gastos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M7 15h0M2 9.5h20" />
                </svg>
              </div>
              <h3 className="empty-title">Aún no registras gastos</h3>
              <p className="empty-subtitle">
                Utiliza el formulario de arriba para escribir tus gastos del día. Por ejemplo:
                <br />
                <em>"Ayer gasté 5 en pasaje, 16 en dos salteñas y hoy 10 en cafecito"</em>
              </p>
            </div>
          ) : gastosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p className="empty-subtitle">No se encontraron gastos con el filtro seleccionado.</p>
              <button type="button" onClick={() => { setFiltro('todos'); setBusqueda(''); }} className="btn-secondary">
                Restablecer filtros
              </button>
            </div>
          ) : (
            <>
              {/* Vista de Tabla Escritorio */}
              <div className="table-responsive">
                <table className="expenses-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th>Categoría</th>
                      <th>Clasificación</th>
                      <th className="th-monto">Monto (Bs)</th>
                      <th className="th-accion">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosFiltrados.map((g) => {
                      const esHormiga = Boolean(g.es_hormiga);
                      return (
                        <tr key={g.id} className={esHormiga ? 'row-hormiga' : 'row-normal'}>
                          <td className="td-fecha">
                            <span className="fecha-badge">{g.fecha}</span>
                          </td>
                          <td className="td-concepto">
                            <strong>{g.concepto}</strong>
                          </td>
                          <td className="td-categoria">
                            <span className="cat-chip">{g.categoria}</span>
                          </td>
                          <td className="td-tipo">
                            {esHormiga ? (
                              <span className="badge badge-hormiga">
                                🐜 Gasto Hormiga (&le; 20 Bs)
                              </span>
                            ) : (
                              <span className="badge badge-comun">
                                📋 Gasto Regular
                              </span>
                            )}
                          </td>
                          <td className="td-monto">
                            <strong className={esHormiga ? 'monto-hormiga' : 'monto-normal'}>
                              Bs {formatearMonto(g.monto)}
                            </strong>
                          </td>
                          <td className="td-accion">
                            <button
                              type="button"
                              onClick={() => handleDelete(g.id)}
                              className="btn-delete"
                              title="Eliminar este gasto"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="trash-icon">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Borrar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista de Tarjetas Móviles */}
              <div className="mobile-cards-list">
                {gastosFiltrados.map((g) => {
                  const esHormiga = Boolean(g.es_hormiga);
                  return (
                    <div key={g.id} className={`mobile-expense-card ${esHormiga ? 'mobile-card-hormiga' : ''}`}>
                      <div className="mobile-card-top">
                        <span className="fecha-badge">{g.fecha}</span>
                        <strong className={`mobile-monto ${esHormiga ? 'monto-hormiga' : 'monto-normal'}`}>
                          Bs {formatearMonto(g.monto)}
                        </strong>
                      </div>
                      <div className="mobile-card-body">
                        <p className="mobile-concepto">{g.concepto}</p>
                        <div className="mobile-tags">
                          <span className="cat-chip">{g.categoria}</span>
                          {esHormiga ? (
                            <span className="badge badge-hormiga">🐜 Hormiga</span>
                          ) : (
                            <span className="badge badge-comun">📋 Regular</span>
                          )}
                        </div>
                      </div>
                      <div className="mobile-card-actions">
                        <button
                          type="button"
                          onClick={() => handleDelete(g.id)}
                          className="btn-delete-mobile"
                        >
                          🗑️ Eliminar gasto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ================= PIE DE PÁGINA (NEGRO & PLOMO) ================= */}
      <footer className="footer-bar">
        <p>
          Sistema Gestor y Analizador de Gastos Hormiga &bull; Arquitectura de 3 Capas: React + Vite (Frontend) &bull; Node.js + Express (Backend) &bull; MySQL (Base de Datos)
        </p>
      </footer>
    </div>
  );
}
