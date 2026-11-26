# 🐜 Sistema Gestor y Analizador de Gastos Hormiga

Guía completa de arquitectura, despliegue y puesta en marcha para entorno distribuido en 3 Máquinas Virtuales (VMs) en la Universidad (o red Wi-Fi compartida).

---

## 🌐 Topología y Direccionamiento de Red Actual

| Componente | Rol | Sistema Operativo | IP Asignada | Puerto(s) |
| :--- | :--- | :--- | :--- | :--- |
| **VM 1 - FrontEnd** | Interfaz Web React + Vite | Windows 11 | `10.49.123.95` | `5173` (Dev) / `80` (Nginx Prod) |
| **VM 2 - BackEnd** | API REST Node.js + Express | Ubuntu Linux (Este Servidor) | `10.49.123.27` | `3000` |
| **VM 3 - DataBase** | Motor de Base de Datos MySQL | Ubuntu Linux | `10.49.123.222` | `3306` |

---

## 🛠️ Configuraciones Realizadas en el Servidor Backend (`10.49.123.27`)

1. **Variables de Entorno (`Backend/.env`)**:
   - `DB_HOST=10.49.123.222`
   - `DB_USER=api`
   - `DB_PASS=api123`
   - `DB_NAME=gastos_hormiga`
   - `PORT=3000`
2. **CORS Habilitado**:
   - `Backend/src/server.ts` permite peticiones desde cualquier origen, especialmente desde `http://10.49.123.95:5173`.
3. **Escucha en `0.0.0.0:3000`**:
   - El backend acepta tráfico externo en el puerto 3000.
4. **Frontend `.env`**:
   - Apuntando a `VITE_API_URL=http://10.49.123.27:3000`.

---

## ⚡ Comandos Rápidos de Ejecución (Orden de Arranque)

### 1️⃣ En la VM 3 - DataBase (`10.49.123.222`)
```bash
sudo systemctl start mysql
```
*(Nota: Como ya tiene configurado el usuario `api`@`%`, no requiere ningún cambio adicional).*

---

### 2️⃣ En la VM 2 - BackEnd (`10.49.123.27` - Este Servidor)
```bash
cd /home/ia/vm-Backend/Sistema-Gestor-y-Analizador-de-Gastos-Hormiga/Backend

# Probar conexión a la base de datos:
npm run test-db

# Iniciar el servidor:
npm run dev
# (O si corre como servicio: sudo systemctl restart gastos-backend)
```

---

### 3️⃣ En la VM 1 - FrontEnd (`10.49.123.95` - Win11)
Abre PowerShell o terminal en la carpeta `FrontEnd`:
```bash
npm run dev -- --host
```

---

### 🌐 Abrir la Aplicación:
Abre el navegador en cualquier máquina conectada a la red e ingresa a:
**`http://10.49.123.95:5173`**
