import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { api } from './services/api';

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
    padding: 16px; box-sizing: border-box;
  }
  .modal-box {
    background: white; padding: 28px; border-radius: 22px;
    width: 100%; max-width: 400px; text-align: left;
    max-height: 90vh; overflow-y: auto;
  }
  .modal-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 6px; color: #1a1a1a; }
  .modal-subtitle { font-size: 0.85rem; color: #999; margin-bottom: 18px; }

  .auth-tabs { display: flex; gap: 0; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1.5px solid #e0e0e0; }
  .auth-tab {
    flex: 1; padding: 10px; background: white; border: none; cursor: pointer;
    font-weight: 600; font-size: 0.9rem; color: #999; transition: 0.15s;
  }
  .auth-tab.active { background: #98d361; color: white; }

  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 5px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .field input {
    width: 100%; padding: 12px 14px; border: 1.5px solid #e0e0e0;
    border-radius: 10px; font-size: 1rem; box-sizing: border-box;
    outline: none; transition: border-color 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .field input:focus { border-color: #98d361; }
  .field-required label::after { content: ' *'; color: #e53935; }
  .btn-submit {
    width: 100%; padding: 14px; background: #98d361; color: white;
    border: none; border-radius: 12px; font-size: 1rem; font-weight: 700;
    cursor: pointer; margin-top: 8px; transition: background 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-submit:hover { background: #82c14a; }
  .btn-submit:disabled { background: #ccc; cursor: not-allowed; }
  .btn-cancel { background: none; border: none; color: #aaa; cursor: pointer; display: block; margin: 14px auto 0; text-decoration: underline; font-size: 0.9rem; font-family: 'DM Sans', sans-serif; }
  .error-msg { color: #e53935; font-size: 0.88rem; margin: 8px 0; text-align: center; background: #fff5f5; padding: 10px; border-radius: 8px; }
  .success-msg { color: #2e7d32; font-size: 0.88rem; margin: 8px 0; text-align: center; background: #f0fae7; padding: 10px; border-radius: 8px; }
  .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .id-empleado-input { border-color: #98d361 !important; background: #f9fff9; }
`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [modal, setModal] = useState(null); // 'alumno' | 'empleado' | null
  const [alumnoTab, setAlumnoTab] = useState('entrar');
  const [empleadoTab, setEmpleadoTab] = useState('entrar');

  // Login form (compartido entre alumno y empleado)
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Alumno: registro
  const [regForm, setRegForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Empleado: registro
  const [empReg, setEmpReg] = useState({ id_empleado: '', username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [empRegError, setEmpRegError] = useState('');
  const [empRegSuccess, setEmpRegSuccess] = useState('');
  const [empRegLoading, setEmpRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      if (user.rol === 'empleado' || user.is_staff === true || modal === 'empleado') {
        navigate('/empleado');
      } else {
        navigate('/menu');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAlumno = async (e) => {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (regForm.password !== regForm.password2) { setRegError('Las contraseñas no coinciden'); return; }
    if (regForm.password.length < 8) { setRegError('La contraseña debe tener al menos 8 caracteres'); return; }
    setRegLoading(true);
    try {
      await api.register({ username: regForm.username, email: regForm.email, first_name: regForm.first_name, last_name: regForm.last_name, password: regForm.password });
      setRegSuccess('¡Cuenta creada! Ya puedes iniciar sesión.');
      setRegForm({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
      setTimeout(() => { setAlumnoTab('entrar'); setRegSuccess(''); }, 1800);
    } catch (err) {
      setRegError(err?.data?.username?.[0] || err?.data?.email?.[0] || err?.data?.detail || 'Error al crear la cuenta');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRegisterEmpleado = async (e) => {
    e.preventDefault();
    setEmpRegError(''); setEmpRegSuccess('');
    if (!empReg.id_empleado.trim()) { setEmpRegError('El ID de empleado es obligatorio'); return; }
    if (empReg.password !== empReg.password2) { setEmpRegError('Las contraseñas no coinciden'); return; }
    if (empReg.password.length < 8) { setEmpRegError('La contraseña debe tener al menos 8 caracteres'); return; }
    setEmpRegLoading(true);
    try {
      await api.register({
        username: empReg.username,
        email: empReg.email,
        first_name: empReg.first_name,
        last_name: empReg.last_name,
        password: empReg.password,
        id_empleado: empReg.id_empleado,
        rol: 'empleado',
      });
      setEmpRegSuccess('¡Cuenta de empleado creada! Ya puedes iniciar sesión.');
      setEmpReg({ id_empleado: '', username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
      setTimeout(() => { setEmpleadoTab('entrar'); setEmpRegSuccess(''); }, 1800);
    } catch (err) {
      setEmpRegError(err?.data?.id_empleado?.[0] || err?.data?.username?.[0] || err?.data?.detail || 'Error al crear la cuenta');
    } finally {
      setEmpRegLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setError(''); setRegError(''); setRegSuccess(''); setEmpRegError(''); setEmpRegSuccess('');
    setForm({ username: '', password: '' });
    setRegForm({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
    setEmpReg({ id_empleado: '', username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
    setAlumnoTab('entrar'); setEmpleadoTab('entrar');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="login-card">
          <img src="/LOGO.jpg" alt="Logo" className="login-logo" />
          <h1 className="login-title">Cafetería Pío Baroja</h1>
          <p className="login-subtitle">Identifícate para continuar</p>
          <button className="btn-rol btn-alumno" onClick={() => { setModal('alumno'); setAlumnoTab('entrar'); }}>
            Soy Alumno
          </button>
          <button className="btn-rol btn-empleado" onClick={() => { setModal('empleado'); setEmpleadoTab('entrar'); }}>
            Soy Empleado
          </button>
        </div>
      </div>

      {/* ─── MODAL ALUMNO ─── */}
      {modal === 'alumno' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Acceso Alumno</h2>
            <p className="modal-subtitle">IES Pío Baroja · Cafetería</p>

            <div className="auth-tabs">
              <button className={`auth-tab ${alumnoTab === 'entrar' ? 'active' : ''}`}
                onClick={() => { setAlumnoTab('entrar'); setError(''); setRegError(''); setRegSuccess(''); }}>
                Entrar
              </button>
              <button className={`auth-tab ${alumnoTab === 'crear' ? 'active' : ''}`}
                onClick={() => { setAlumnoTab('crear'); setError(''); setRegError(''); setRegSuccess(''); }}>
                Crear cuenta
              </button>
            </div>

            {alumnoTab === 'entrar' && (
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Correo o usuario</label>
                  <input type="text" placeholder="usuario@iespiobaroja.org"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input type="password" placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-submit" type="submit" disabled={loading}>
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            )}

            {alumnoTab === 'crear' && (
              <form onSubmit={handleRegisterAlumno}>
                <div className="form-row-2">
                  <div className="field">
                    <label>Nombre</label>
                    <input type="text" placeholder="Ana"
                      value={regForm.first_name} onChange={e => setRegForm({ ...regForm, first_name: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label>Apellidos</label>
                    <input type="text" placeholder="García"
                      value={regForm.last_name} onChange={e => setRegForm({ ...regForm, last_name: e.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label>Usuario</label>
                  <input type="text" placeholder="ana.garcia"
                    value={regForm.username} onChange={e => setRegForm({ ...regForm, username: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Correo electrónico</label>
                  <input type="email" placeholder="ana@iespiobaroja.org"
                    value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} required minLength={8} />
                </div>
                <div className="field">
                  <label>Repetir contraseña</label>
                  <input type="password" placeholder="Repite la contraseña"
                    value={regForm.password2} onChange={e => setRegForm({ ...regForm, password2: e.target.value })} required minLength={8} />
                </div>
                {regError && <p className="error-msg">{regError}</p>}
                {regSuccess && <p className="success-msg">{regSuccess}</p>}
                <button className="btn-submit" type="submit" disabled={regLoading}>
                  {regLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            )}

            <button className="btn-cancel" onClick={closeModal}>Volver al inicio</button>
          </div>
        </div>
      )}

      {/* ─── MODAL EMPLEADO ─── */}
      {modal === 'empleado' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Acceso Personal</h2>
            <p className="modal-subtitle">Solo para empleados de cafetería</p>

            <div className="auth-tabs">
              <button className={`auth-tab ${empleadoTab === 'entrar' ? 'active' : ''}`}
                onClick={() => { setEmpleadoTab('entrar'); setError(''); setEmpRegError(''); setEmpRegSuccess(''); }}>
                Entrar
              </button>
              <button className={`auth-tab ${empleadoTab === 'crear' ? 'active' : ''}`}
                onClick={() => { setEmpleadoTab('crear'); setError(''); setEmpRegError(''); setEmpRegSuccess(''); }}>
                Crear cuenta
              </button>
            </div>

            {empleadoTab === 'entrar' && (
              <form onSubmit={handleLogin}>
                <div className="field">
                  <label>Código de empleado o usuario</label>
                  <input type="text" placeholder="EMP-XXXX"
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input type="password" placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-submit" type="submit" disabled={loading}>
                  {loading ? 'Verificando...' : 'Acceder al Panel'}
                </button>
              </form>
            )}

            {empleadoTab === 'crear' && (
              <form onSubmit={handleRegisterEmpleado}>
                {/* ID EMPLEADO — campo destacado y obligatorio */}
                <div className="field field-required">
                  <label>ID de empleado</label>
                  <input
                    type="text"
                    placeholder="EMP-XXXX"
                    value={empReg.id_empleado}
                    onChange={e => setEmpReg({ ...empReg, id_empleado: e.target.value })}
                    required
                    className={empReg.id_empleado ? 'id-empleado-input' : ''}
                  />
                </div>
                <div className="form-row-2">
                  <div className="field">
                    <label>Nombre</label>
                    <input type="text" placeholder="Carlos"
                      value={empReg.first_name} onChange={e => setEmpReg({ ...empReg, first_name: e.target.value })} required />
                  </div>
                  <div className="field">
                    <label>Apellidos</label>
                    <input type="text" placeholder="López"
                      value={empReg.last_name} onChange={e => setEmpReg({ ...empReg, last_name: e.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label>Usuario</label>
                  <input type="text" placeholder="carlos.lopez"
                    value={empReg.username} onChange={e => setEmpReg({ ...empReg, username: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Correo electrónico</label>
                  <input type="email" placeholder="carlos@iespiobaroja.org"
                    value={empReg.email} onChange={e => setEmpReg({ ...empReg, email: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Contraseña</label>
                  <input type="password" placeholder="Mínimo 8 caracteres"
                    value={empReg.password} onChange={e => setEmpReg({ ...empReg, password: e.target.value })} required minLength={8} />
                </div>
                <div className="field">
                  <label>Repetir contraseña</label>
                  <input type="password" placeholder="Repite la contraseña"
                    value={empReg.password2} onChange={e => setEmpReg({ ...empReg, password2: e.target.value })} required minLength={8} />
                </div>
                {empRegError && <p className="error-msg">{empRegError}</p>}
                {empRegSuccess && <p className="success-msg">{empRegSuccess}</p>}
                <button className="btn-submit" type="submit" disabled={empRegLoading}>
                  {empRegLoading ? 'Creando cuenta...' : 'Crear cuenta de empleado'}
                </button>
              </form>
            )}

            <button className="btn-cancel" onClick={closeModal}>Volver al inicio</button>
          </div>
        </div>
      )}
    </>
  );
}

