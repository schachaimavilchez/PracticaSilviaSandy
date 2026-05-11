# 🍽️ Cafetería IES Pío Baroja

Aplicación web para la gestión de pedidos de la cafetería del IES Pío Baroja. Permite a los alumnos realizar pedidos online, pagar de forma segura y recogerlos sin esperas mediante un código QR único.

---

## 📋 Descripción

Sistema completo de pedidos para cafetería escolar con dos roles diferenciados:

- **Alumno** — navega el menú, añade productos al carrito, elige hora de recogida, paga con tarjeta o mediante el TPV Virtual de Redsys y recibe un código QR para recoger su pedido.
- **Empleado** — gestiona el inventario, valida códigos QR en el mostrador, consulta el historial de pedidos y accede a estadísticas de ventas con filtro por fechas.

---

## 🚀 Tecnologías

### Frontend
- **React** + Vite
- React Router DOM
- CSS-in-JS (estilos inline y bloques `<style>`)
- Google Material Symbols (iconos)
- DM Sans (tipografía)
- jsPDF + jspdf-autotable (exportación PDF)

### Backend
- **Django** + Django REST Framework
- SimpleJWT (autenticación con tokens JWT)
- django-cors-headers (CORS)
- Pillow (gestión de imágenes)
- WhiteNoise (archivos estáticos en producción)
- Gunicorn (servidor WSGI)

### Base de datos
- SQLite3 (desarrollo)

### Servicios externos
- **Google OAuth2** — inicio de sesión con Google
- **Redsys TPV Virtual** — pasarela de pago simulada
- **QR Server API** — generación de códigos QR

---

## ✨ Funcionalidades

### Alumno
- ✅ Login con usuario/contraseña o con Google SSO
- ✅ Registro de cuenta nueva
- ✅ Catálogo de productos con imágenes
- ✅ Carrito con control de cantidades
- ✅ Selector de hora de recogida (recreos)
- ✅ Pago mediante TPV Virtual Redsys
- ✅ Pago con tarjeta guardada o nueva tarjeta
- ✅ Código QR único de recogida tras el pago
- ✅ Historial de pedidos con QR visible
- ✅ Perfil de usuario con saldo y tarjeta guardada

### Empleado
- ✅ Panel de control con cola de recogida en tiempo real
- ✅ Validación de QR mediante teclado virtual o escáner
- ✅ Gestión de inventario (crear, editar, eliminar productos)
- ✅ Historial completo de pedidos
- ✅ Estadísticas de ventas con filtro por fechas
- ✅ Top 5 productos más vendidos
- ✅ Exportación de reportes en PDF

---

## 🗂️ Estructura del proyecto

```
CAFETERIA-PBAROJA/
├── backend/
│   ├── cafeteria/          # App principal Django
│   │   ├── models.py       # Modelos: Usuario, Producto, Pedido, Pago, QRToken
│   │   ├── views.py        # Vistas y endpoints API
│   │   ├── serializers.py  # Serializers DRF
│   │   ├── urls.py         # URLs de la app
│   │   └── admin.py        # Panel de administración
│   ├── core/
│   │   ├── settings.py     # Configuración Django
│   │   └── urls.py         # URLs principales
│   ├── media/              # Imágenes subidas
│   ├── manage.py
│   └── db.sqlite3
├── src/
│   ├── context/
│   │   └── authcontext.jsx # Contexto de autenticación
│   ├── services/
│   │   └── api.js          # Cliente API centralizado
│   ├── App.jsx             # Rutas principales
│   ├── Login.jsx           # Pantalla de login y registro
│   ├── Menu.jsx            # Catálogo de productos
│   ├── Carrito.jsx         # Carrito y selector de hora
│   ├── Pago.jsx            # Checkout
│   ├── RedsysPago.jsx      # TPV Virtual Redsys simulado
│   ├── Confirmacion.jsx    # Confirmación con QR
│   ├── PanelEmpleado.jsx   # Panel de gestión
│   └── GoogleCallback.jsx  # Callback de Google SSO
├── public/                 # Imágenes estáticas
├── Procfile                # Configuración Railway
├── requirements.txt        # Dependencias Python
├── package.json            # Dependencias Node
└── vite.config.js
```

---

## ⚙️ Instalación local

### Requisitos previos
- Python 3.11+
- Node.js 18+
- npm

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser   # Opcional: crear admin

python manage.py runserver
```

El backend estará en `http://localhost:8000`

### Frontend

```bash
# Desde la raíz del proyecto
npm install
npm run dev
```

El frontend estará en `http://localhost:5173`

---

## 🔑 Variables de entorno

### Backend (`backend/core/settings.py`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta Django | Ver settings.py |
| `DEBUG` | Modo depuración | `True` (dev) / `False` (prod) |
| `GOOGLE_CLIENT_ID` | ID cliente Google OAuth2 | Ver Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Secreto cliente Google OAuth2 | Ver Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | URI de callback Google | `http://localhost:8000/api/auth/google/callback/` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` |

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🌐 API — Endpoints principales

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Login con usuario y contraseña | ❌ |
| `POST` | `/api/auth/register/` | Registro de nuevo usuario | ❌ |
| `GET` | `/api/auth/google/` | Inicio de sesión con Google | ❌ |
| `GET` | `/api/auth/google/callback/` | Callback de Google OAuth2 | ❌ |
| `GET` | `/api/usuarios/me/` | Datos del usuario actual | ✅ |
| `POST` | `/api/usuarios/guardar-tarjeta/` | Guardar tarjeta del usuario | ✅ |
| `GET` | `/api/productos/` | Listado de productos | ✅ |
| `POST` | `/api/productos/` | Crear producto | ✅ Empleado |
| `PATCH` | `/api/productos/{id}/` | Editar producto | ✅ Empleado |
| `DELETE` | `/api/productos/{id}/` | Eliminar producto | ✅ Empleado |
| `GET` | `/api/pedidos/` | Listar pedidos del usuario | ✅ |
| `POST` | `/api/pedidos/` | Crear pedido | ✅ |
| `POST` | `/api/pedidos/{id}/pagar/` | Pagar pedido | ✅ |
| `POST` | `/api/pedidos/{id}/cambiar_estado/` | Cambiar estado del pedido | ✅ Empleado |
| `POST` | `/api/redsys/notificacion/` | IPN simulada de Redsys | ✅ |
| `POST` | `/api/qr/validar/` | Validar código QR | ✅ Empleado |
| `GET` | `/api/estadisticas/` | Estadísticas con filtro fechas | ✅ Empleado |

---

## 💳 Datos de prueba para el TPV Redsys

| Campo | Valor |
|---|---|
| Número de tarjeta | `4548 8120 4940 0004` |
| Titular | `PRUEBA REDSYS` |
| Caducidad | `12/26` |
| CVV | `123` |

---

## 🚀 Despliegue en Railway

### Backend

1. Sube el proyecto a GitHub
2. En Railway → **New Project** → **Deploy from GitHub**
3. Selecciona el repositorio
4. Añade las variables de entorno en Railway
5. Railway usará el `Procfile` automáticamente:
   ```
   web: python backend/manage.py migrate && gunicorn --pythonpath backend core.wsgi:application --bind 0.0.0.0:$PORT
   ```

### Frontend

1. En Railway → **New Service** → mismo repositorio
2. Configura:
   - **Build command:** `npm run build`
   - **Start command:** `npx serve dist`
3. Añade variable: `VITE_API_URL=https://TU-BACKEND.railway.app/api`

---

## 👥 Roles y acceso

| Rol | Acceso |
|---|---|
| **Alumno** | Menú, carrito, pago, mis pedidos, perfil |
| **Empleado** | Todo lo anterior + panel de gestión, estadísticas, validación QR, inventario |

---

## 📱 Diseño

- Diseño **mobile-first** (max-width 430px para alumnos)
- Panel de empleado **responsive** con sidebar colapsable
- Paleta de colores verde (`#407e44`) coherente en todas las vistas
- Tipografía **DM Sans** en todo el proyecto

---

## 🏫 Información académica

| Campo | Valor |
|---|---|
| Módulo | 0613 — Desarrollo de Aplicaciones Web en Entorno Servidor |
| Centro | IES Pío Baroja |
| Ciclo | DAW — Desarrollo de Aplicaciones Web |
