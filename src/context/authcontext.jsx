// src/context/authcontext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

// 1. Iniciamos con un objeto vacío en lugar de null para evitar el error de desestructuración
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Intentamos recuperar al usuario de Django
          const userData = await api.me();
          setUser(userData);
        } catch (error) {
          console.error("Error de autenticación inicial:", error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await api.login(credentials);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Error en el login:", error);
      throw error; // Re-lanzamos para que el componente Login pueda mostrar el error
    }
  };

  const logout = () => {
      localStorage.clear();
      setUser(null);
      window.location.href = '/'; 
    };

    // ESTA ES LA PARTE QUE DEBES CAMBIAR:
    return (
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children} 
      </AuthContext.Provider>
    );
  }

// 3. Hook personalizado con validación de seguridad
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
