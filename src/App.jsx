import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Proveedor de Autenticación
// Nota: Usamos minúsculas porque así aparece en tu imagen de carpetas
import { AuthProvider } from './context/authcontext';

// Importamos las páginas (Componentes)
import Login from './Login';
import Menu from './Menu';
import Carrito from './Carrito';
import Pago from './Pago';
import Confirmacion from './Confirmacion';
import PanelEmpleado from './PanelEmpleado';

function App() {
  return (
    /* AuthProvider envuelve toda la app para que Login, Menu, etc., 
       puedan acceder al usuario y al token de Django */
    <AuthProvider>
      <Router>
        <Routes>
          {/* 1. RUTA DE ACCESO: Pantalla de Login */}
          <Route path="/" element={<Login />} />

          {/* 2. RUTAS DEL ALUMNO: Flujo de compra */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/pago" element={<Pago />} />
          <Route path="/confirmacion" element={<Confirmacion />} />

          {/* 3. RUTA DEL EMPLEADO: Gestión y validación de QR */}
          <Route path="/empleado" element={<PanelEmpleado />} />

          {/* RUTA DE EMERGENCIA: Si el usuario escribe cualquier otra cosa, lo manda al Login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
