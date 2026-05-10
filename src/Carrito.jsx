import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';

const Carrito = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // ESTADOS PARA EL DESPLEGABLE Y EL MODAL
  const [dropdown, setDropdown] = useState(false);
  const [modal, setModal] = useState(null); // 'perfil' o null

  const items = location.state?.items || [];
  const total = items.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);

  const headerStyle = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

    .menu-header {
      position: sticky; top: 0; z-index: 20; background: #fff;
      padding: 10px 5px 10px 18px; 
      display: flex; justify-content: space-between;
      align-items: center; border-bottom: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      font-family: 'DM Sans', sans-serif;
    }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-area img { width: 34px; height: 34px; object-fit: contain; }
    .logo-area strong { font-size: 13px; color: #333; font-weight: 700; }
    
    .dropdown-wrap { position: relative; margin-left: auto; }
    .icon-btn { background: none; border: none; cursor: pointer; color: #333; padding: 4px; display: flex; align-items: center; }

    .dropdown-menu {
      position: absolute; top: 42px; right: 0; background: white;
      border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      min-width: 160px; z-index: 100; overflow: hidden; border: 1px solid #e0e0e0;
    }
    .dropdown-item {
      display: block; padding: 12px 16px; font-size: 14px; color: #333;
      cursor: pointer; background: none; border: none; width: 100%; text-align: left;
      font-family: 'DM Sans', sans-serif;
    }
    .dropdown-item:hover { background: #ebf5ec; color: #407e44; }
    .dropdown-item.danger { color: #ff5252; }
    .dropdown-divider { border: none; border-top: 1px solid #e0e0e0; margin: 0; }

    /* Estilos del Modal (Copiados de Menu.jsx) */
    .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.65); display: flex; justify-content: center; align-items: center; z-index: 200; font-family: 'DM Sans', sans-serif; }
    .modal-box { background: white; border-radius: 22px; padding: 26px; width: 90%; max-width: 360px; }
    .modal-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 18px; color: #333; }
    .btn-close { display: block; width: 100%; padding: 13px; background: #407e44; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-top: 18px; font-size: 15px; }
  `;

  if (items.length === 0) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <h2>Tu carrito está vacío</h2>
        <button onClick={() => navigate('/menu')} style={{ marginTop: '20px', padding: '10px 20px', background: '#407e44', color: 'white', border: 'none', borderRadius: '10px' }}>
          Volver al Menú
        </button>
      </div>
    );
  }

  return (
    <div className="mobile-view" style={{ fontFamily: 'DM Sans, sans-serif', backgroundColor: '#f4f7f5', minHeight: '100vh' }}>
      <style>{headerStyle}</style>

      {/* HEADER */}
      <header className="menu-header">
        <div className="logo-area">
          <img src="/ies_pio_baroja_logo.jpg" alt="Logo" />
          <strong>IES PÍO BAROJA</strong>
        </div>

        <div className="dropdown-wrap">
          <button className="icon-btn" onClick={() => setDropdown(!dropdown)}>
            <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>account_circle</span>
          </button>

          {dropdown && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { setDropdown(false); setModal('perfil'); }}>Mi Perfil</button>
              <button className="dropdown-item" onClick={() => navigate('/menu')}>Volver al Menú</button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => { logout(); navigate('/'); }}>Cerrar Sesión</button>
            </div>
          )}
        </div>
      </header>

      <main style={{ padding: '15px 20px' }}>
        <section className="welcome" style={{ marginTop: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0' }}>¡Hola, {user?.first_name || 'Estudiante'}!</h1>
          <p style={{ color: '#666', margin: '5px 0 20px' }}>Tu Recreo Sin Esperas.</p>
        </section>

        {/* Reloj y Pedido (Se mantiene igual) */}
        <section className="pick-up-card" style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', textAlign: 'center', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '11px', color: '#888', marginBottom: '15px', letterSpacing: '1px', fontWeight: '700' }}>ELIGE TU PICK-UP TIME</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={btnStyle}>10:30</button>
              <button style={btnStyle}>10:45</button>
            </div>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#ebf5ec', border: '4px solid #407e44', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#407e44' }}>11:15</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{...btnStyle, background: '#407e44', color: 'white'}}>11:15</button>
              <button style={btnStyle}>11:30</button>
            </div>
          </div>
        </section>

        <section className="order-section">
          <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '700' }}>MI PEDIDO</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                <img src={item.imagen_url || `/panBaconQueso.jpg`} alt={item.nombre} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
                <p style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px', marginBottom: '4px' }}>{item.cantidad}x {item.nombre}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '800', color: '#407e44' }}>{(item.precio * item.cantidad).toFixed(2)}€</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button onClick={() => navigate('/pago', { state: { items, total } })} style={{ width: '100%', background: '#407e44', color: 'white', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(64, 126, 68, 0.3)' }}>
          CONFIRMAR Y PAGAR ({total.toFixed(2)}€)
        </button>
      </main>

      {/* MODAL DE PERFIL (Igual al de Menu.jsx) */}
      {modal === 'perfil' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Mi Perfil</h2>
            <p><strong>Nombre:</strong> {user?.first_name} {user?.last_name}</p>
            <p style={{ marginTop: 8 }}><strong>Usuario:</strong> {user?.username}</p>
            <p style={{ marginTop: 8 }}><strong>Saldo:</strong> {parseFloat(user?.saldo || 0).toFixed(2)}€</p>
            <button className="btn-close" onClick={() => setModal(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const btnStyle = { padding: '8px 14px', border: 'none', background: '#f1f3f5', borderRadius: '10px', fontWeight: '700', color: '#777', fontSize: '11px', cursor: 'pointer' };

export default Carrito;