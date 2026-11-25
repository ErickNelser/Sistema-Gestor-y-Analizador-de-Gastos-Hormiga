#!/usr/bin/env bash
# ==============================================================================
# Iniciar Servidor Backend en 10.153.187.27:3000
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== Iniciando Backend Gastos Hormiga ==="
echo "Directorio: $DIR"
echo "IP Local:   10.153.187.27:3000"

npm run dev
