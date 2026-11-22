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
