import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/authcontext';
import Login from './Login';
import Menu from './Menu';
import Carrito from './Carrito';
import Pago from './Pago';
import Confirmacion from './Confirmacion';
import PanelEmpleado from './PanelEmpleado';
import GoogleCallback from './GoogleCallback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"                element={<Login />} />
          <Route path="/menu"            element={<Menu />} />
          <Route path="/carrito"         element={<Carrito />} />
          <Route path="/pago"            element={<Pago />} />
          <Route path="/confirmacion"    element={<Confirmacion />} />
          <Route path="/empleado"        element={<PanelEmpleado />} />
          {/* Página de retorno tras login con Google */}
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="*"                element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
