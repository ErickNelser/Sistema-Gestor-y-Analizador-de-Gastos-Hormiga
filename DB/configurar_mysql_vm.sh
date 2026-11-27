#!/usr/bin/env bash
# ==============================================================================
# Script de configuración de MySQL para la VM de Base de Datos (192.168.56.12)
# Ejecutar con privilegios de sudo en la máquina 192.168.56.12
# ==============================================================================

set -e

echo "=== Configurando MySQL en la VM de Base de Datos (192.168.56.12) ==="

# 1. Asegurar bind-address = 0.0.0.0 para permitir conexiones remotas desde 192.168.56.11
CNF_FILES=(
  "/etc/mysql/mysql.conf.d/mysqld.cnf"
  "/etc/mysql/mariadb.conf.d/50-server.cnf"
  "/etc/mysql/my.cnf"
)

CONFIG_MODIFICADA=false

for file in "${CNF_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Modificando bind-address en $file..."
    sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "$file"
    sed -i 's/^#bind-address\s*=.*/bind-address = 0.0.0.0/' "$file"
    CONFIG_MODIFICADA=true
    break
  fi
done

if [ "$CONFIG_MODIFICADA" = false ]; then
  echo "Aviso: No se encontró un archivo de configuración estándar en /etc/mysql/. Asegúrese de configurar bind-address = 0.0.0.0 manualmente."
fi

# 2. Reiniciar el servicio de MySQL
echo "Reiniciando servicio MySQL..."
if systemctl is-active --quiet mysql; then
  systemctl restart mysql
elif systemctl is-active --quiet mariadb; then
  systemctl restart mariadb
else
  systemctl restart mysql || true
fi

# 3. Aplicar script SQL
SQL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/gastos_hormiga.sql"

if [ -f "$SQL_PATH" ]; then
  echo "Importando estructura y usuarios desde $SQL_PATH..."
  mysql -u root < "$SQL_PATH" || mysql -u root -p < "$SQL_PATH"
  echo "✅ Base de datos gastos_hormiga y usuarios configurados correctamente."
else
  echo "❌ Archivo gastos_hormiga.sql no encontrado en $SQL_PATH."
fi

echo "=== Configuración de MySQL completada con éxito ==="
