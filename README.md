# 🐜 Sistema Gestor y Analizador de Gastos Hormiga

Guía completa de arquitectura, despliegue y puesta en marcha para entorno distribuido en 3 Máquinas Virtuales (VMs) en la Universidad (o red Wi-Fi compartida).

---

## 🌐 Topología y Direccionamiento de Red Actual

| Componente | Rol | Sistema Operativo | IP Asignada | Puerto(s) |
| :--- | :--- | :--- | :--- | :--- |
| **VM 1 - FrontEnd** | Interfaz Web React + Vite | Windows 11 | `10.153.187.95` | `5173` (Dev) / `80` (Nginx Prod) |
| **VM 2 - BackEnd** | API REST Node.js + Express | Ubuntu Linux (Este Servidor) | `10.153.187.27` | `3000` |
| **VM 3 - DataBase** | Motor de Base de Datos MySQL | Ubuntu Linux | `10.153.187.222` | `3306` |

---

## 🛠️ Configuraciones Realizadas en el Servidor Backend (`10.153.187.27`)

1. **Variables de Entorno (`Backend/.env`)**:
   - `DB_HOST=10.153.187.222`
   - `DB_USER=api`
   - `DB_PASS=api123`
   - `DB_NAME=gastos_hormiga`
   - `PORT=3000`
2. **CORS Habilitado**:
   - `Backend/src/server.ts` permite peticiones desde cualquier origen, especialmente desde `http://10.153.187.95:5173`.
3. **Escucha en `0.0.0.0:3000`**:
   - El backend acepta tráfico externo en el puerto 3000.
4. **Frontend `.env`**:
   - Apuntando a `VITE_API_URL=http://10.153.187.27:3000`.

---

## 🚀 PASO CRÍTICO: Permisos en MySQL (VM 3: `10.153.187.222`)

Dado que la IP del Backend cambió a `10.153.187.27`, debes asegurarte de que MySQL permita conexiones desde esta nueva IP.

En la terminal de la máquina **VM 3 (`10.153.187.222`)**:

1. Abre la consola de MySQL:
   ```bash
   sudo mysql
   ```
2. Ejecuta los siguientes comandos (con `%` nunca más tendrás problemas si cambia el Wi-Fi):
   ```sql
   CREATE USER IF NOT EXISTS 'api'@'%' IDENTIFIED BY 'api123';
   GRANT ALL PRIVILEGES ON gastos_hormiga.* TO 'api'@'%';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## ⚡ Comandos Rápidos de Ejecución (Orden de Arranque)

### 1️⃣ En la VM 3 - DataBase (`10.153.187.222`)
```bash
sudo systemctl start mysql
```

---

### 2️⃣ En la VM 2 - BackEnd (`10.153.187.27` - Este Servidor)
```bash
cd /home/ia/vm-Backend/Sistema-Gestor-y-Analizador-de-Gastos-Hormiga/Backend

# 1. Probar conexión rápida:
npm run test-db

# 2. Iniciar el servidor:
npm run dev
```

---

### 3️⃣ En la VM 1 - FrontEnd (`10.153.187.95` - Win11)
Abre PowerShell o terminal en la carpeta `FrontEnd`:
```bash
npm run dev -- --host
```

---

### 🌐 Abrir la Aplicación:
Abre el navegador en cualquier máquina conectada a la red e ingresa a:
**`http://10.153.187.95:5173`**
