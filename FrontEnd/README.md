# Frontend - Sistema Gestor y Analizador de Gastos Hormiga

Aplicación web desarrollada en **React + TypeScript + Vite** para el análisis inteligente de gastos en lenguaje natural, categorización automática, detección de gastos hormiga y seguimiento de metas de ahorro.

---

## 🎨 Paleta de Colores y Diseño
El diseño ha sido optimizado profesionalmente utilizando una combinación cromática equilibrada, limpia y accesible:
- **Azul (`#1E3A8A`, `#2563EB`)**: Identidad visual, botones principales, métricas de balance total y acentos clave.
- **Beige (`#FBF8F3`, `#F5EFEB`, `#EADBCE`)**: Fondo cálido general, bordes suaves, chips y etiquetas secundarias, brindando descanso visual.
- **Verde (`#059669`, `#10B981`)**: Salud financiera, metas de ahorro, barra de progreso y avisos positivos.
- **Blanco (`#FFFFFF`)**: Superficie de tarjetas (cards), filas de datos e inputs con contraste nítido.

---

## 📦 Estructura de Cards e Interfaz
1. **Registro Inteligente**: Formulario con soporte para lenguaje natural (*"Ayer gasté 5 en pasaje, 16 en dos salteñas y hoy 10 en cafecito"*) y botones rápidos de prueba (chips).
2. **Resumen Financiero (4 KPI Cards)**:
   - Total Gastado General.
   - Total Gastos Hormiga (fugas detectadas ≤ 20 Bs).
   - % de Impacto Hormiga.
   - Proyección Anual estimada a 365 días.
3. **Meta de Ahorro**: Barra de progreso interactiva y formulario para fijar objetivo financiero en Bs.
4. **Resumen por Categoría**: Ranking ordenado de mayor a menor con indicadores de tipo de gasto.
5. **Historial de Gastos Responsive**:
   - Pestañas de filtrado: *Todos*, *🐜 Solo Hormiga*, *📋 Comunes*.
   - Buscador en tiempo real por concepto o categoría.
   - Tabla adaptable en escritorio y tarjetas independientes en dispositivos móviles.
   - Filas de gastos hormiga resaltadas con distintivo visual.
   - Botón de borrado directo.

---

## 🚀 Instrucciones de Ejecución

### 1. Requisitos Previos
- Node.js (v18 o superior)
- npm

### 2. Configuración de Conexión con el Backend
El archivo `.env` permite configurar la IP o URL del backend al cual Vite redirige las peticiones `/api`:

```bash
# Conexión hacia la VM de Backend (10.153.187.27):
VITE_API_URL=http://10.153.187.27:3000

# Desarrollo local en la misma máquina (opcional):
# VITE_API_URL=http://localhost:3000
```

### 3. Modo Desarrollo
```bash
npm install
npm run dev -- --host
```
La aplicación estará disponible en la red en `http://10.153.187.95:5173` (o `http://localhost:5173`).

### 4. Compilación para Producción (Nginx / VM 1)
```bash
npm run build
```
Los archivos estáticos listos para producción se generan en la carpeta `dist/`.
En Nginx (VM 1 en 10.153.187.95), configura la raíz hacia esta carpeta `dist/` y el proxy inverso para `/api`:
```nginx
location /api/ {
    proxy_pass http://10.153.187.27:3000/api/;
}
```
