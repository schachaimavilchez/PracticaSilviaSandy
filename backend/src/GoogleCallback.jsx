import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { api } from './services/api';

/**
 * Esta página vive en /google-callback
 * Django redirige aquí tras el login con Google con ?access=...&refresh=...
 * Guardamos los tokens, cargamos el usuario y redirigimos al menú.
 */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const { } = useAuth(); // solo para que el contexto esté montado
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access  = params.get('access');
    const refresh = params.get('refresh');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (!access || !refresh) {
      setError('No se recibieron credenciales de Google.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    // Guardamos los tokens igual que hace el login normal
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);

    // Cargamos los datos del usuario desde el backend
    api.me()
      .then(user => {
        // Guardamos el usuario en el contexto — recargamos la app
        // La forma más sencilla: recargar la página para que AuthProvider
        // lea el token de localStorage y cargue el usuario automáticamente
        if (user.rol === 'empleado' || user.is_staff) {
          window.location.href = '/empleado';
        } else {
          window.location.href = '/menu';
        }
      })
      .catch(() => {
        setError('Error al cargar el perfil. Inténtalo de nuevo.');
        setTimeout(() => navigate('/'), 3000);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      background: 'linear-gradient(135deg, #98d361 0%, #a6a6a6 100%)',
    }}>
      {error ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
          <p style={{ color: '#e53935', fontWeight: 700 }}>⚠ {error}</p>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Redirigiendo al inicio...</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ fontWeight: 700, fontSize: '18px' }}>Iniciando sesión con Google...</p>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Un momento por favor</p>
        </div>
      )}
    </div>
  );
}
