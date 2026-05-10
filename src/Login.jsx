import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/authcontext';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .login-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #98d361 0%, #a6a6a6 100%);
    display: flex; justify-content: center; align-items: center;
    padding: 20px; box-sizing: border-box;
    font-family: 'DM Sans', sans-serif;
  }
  .login-card {
    background: white; border-radius: 24px;
    padding: 40px 32px; width: 100%; max-width: 400px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.18); text-align: center;
  }
  .login-logo { width: 90px; margin-bottom: 8px; }
  .login-title { font-size: 1.7rem; font-weight: 700; color: #1a1a1a; margin: 10px 0 6px; }
  .login-subtitle { color: #777; font-size: 0.95rem; margin-bottom: 30px; }
  .btn-rol {
    display: block; width: 100%; padding: 16px; border-radius: 14px;
    font-size: 1.05rem; font-weight: 600; cursor: pointer;
    border: none; margin-bottom: 12px; transition: all 0.2s; text-align: center;
  }
  .btn-alumno { background: #98d361; color: white; }
  .btn-alumno:hover { background: #82c14a; transform: translateY(-1px); }
  .btn-empleado { background: white; color: #98d361; border: 2px solid #98d361 !important; }
  .btn-empleado:hover { background: #f0fae7; }
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); display: flex;
    justify-content: center; align-items: center; z-index: 100;
  }
  .modal-box {
    background: white; padding: 32px; border-radius: 22px;
    width: 90%; max-width: 380px; text-align: left;
  }
  .modal-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 20px; color: #1a1a1a; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 5px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .field input {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0;
    border-radius: 10px; font-size: 1rem; box-sizing: border-box;
    outline: none; transition: border-color 0.2s;
  }
  .field input:focus { border-color: #98d361; }
  .btn-submit {
    width: 100%; padding: 14px; background: #98d361; color: white;
    border: none; border-radius: 12px; font-size: 1rem; font-weight: 700;
    cursor: pointer; margin-top: 8px; transition: background 0.2s;
  }
  .btn-submit:hover { background: #82c14a; }
  .btn-submit:disabled { background: #ccc; cursor: not-allowed; }
  .btn-cancel { background: none; border: none; color: #aaa; cursor: pointer; display: block; margin: 14px auto 0; text-decoration: underline; font-size: 0.9rem; }
  .error-msg { color: #e53935; font-size: 0.88rem; margin: 8px 0; text-align: center; }
  .divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; color: #ccc; font-size: 0.8rem; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #eee; }
  .btn-google {
    width: 100%; padding: 11px; background: white; border: 1.5px solid #e0e0e0;
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    gap: 10px; font-weight: 600; color: #555; cursor: pointer; font-size: 0.95rem;
    transition: background 0.2s; margin-bottom: 6px;
  }
  .btn-google:hover { background: #f5f5f5; }
`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'alumno' | 'empleado' | null
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);
      
      try {
        // 1. Llamamos al login del contexto
        const user = await login(form);
        
        console.log("Usuario identificado:", user); // Esto te servirá para ver qué devuelve Django

        // 2. Verificamos el destino. 
        // Comprobamos 'empleado', pero también 'is_staff' (que es el estándar de Django)
        if (user.rol === 'empleado' || user.is_staff === true || modal === 'empleado') {
          navigate('/empleado');
        } else {
          navigate('/menu');
        }

      } catch (err) {
        console.error("Error en login:", err);
        setError('Usuario o contraseña incorrectos');
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="login-card">
          <img src="/LOGO.jpg" alt="Logo" className="login-logo" />
          <h1 className="login-title">Cafetería Pío Baroja</h1>
          <p className="login-subtitle">Identifícate para continuar</p>
          <button className="btn-rol btn-alumno" onClick={() => setModal('alumno')}>Soy Alumno</button>
          <button className="btn-rol btn-empleado" onClick={() => setModal('empleado')}>Soy Empleado</button>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {modal === 'alumno' ? 'Acceso Alumno' : 'Acceso Personal'}
            </h2>
            {modal === 'alumno' && (
              <>
                <button className="btn-google" onClick={() => alert('Integración Google SSO — configurar OAuth')}>
                  <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" width="18" alt="Google" />
                  Usar cuenta de Google
                </button>
                <div className="divider">o manualmente</div>
              </>
            )}
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>{modal === 'alumno' ? 'Correo o usuario' : 'Código de empleado'}</label>
                <input
                  type="text"
                  placeholder={modal === 'alumno' ? 'usuario@iespiobaroja.org' : 'EMP-XXXX'}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button className="btn-submit" type="submit" disabled={loading}>
                {loading ? 'Verificando...' : modal === 'alumno' ? 'Entrar' : 'Acceder al Panel'}
              </button>
            </form>
            <button className="btn-cancel" onClick={() => setModal(null)}>Volver al inicio</button>
          </div>
        </div>
      )}
    </>
  );
}