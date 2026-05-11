import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { api } from './services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

  :root { --green: #3d7a44; --dark-green: #2a5a3a; --text: #333; --bg: #f4f7f5; --white: #fff; --gray: #7a7a7a; --border: #ddd; }
  .pago-root { min-height: 100vh; background: var(--bg); display: flex; justify-content: center; font-family: 'DM Sans', sans-serif; }
  .mobile { width: 100%; max-width: 430px; background: var(--bg); min-height: 100vh; padding-bottom: 30px; }
  .pago-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; background: var(--white); border-bottom: 1px solid #eee; }
  .pago-content { padding: 20px; }

  .card-section { background: var(--white); border-radius: 24px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
  .section-label { font-size: 11px; letter-spacing: 1px; color: var(--gray); text-transform: uppercase; font-weight: 700; margin-bottom: 15px; }

  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--gray); margin-bottom: 5px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
  .form-input:focus { outline: none; border-color: var(--green); }
  .form-row { display: flex; gap: 10px; }

  .method-selector { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
  .method-btn {
    flex: 1; min-width: 120px; padding: 12px 8px; border-radius: 12px; border: 1px solid var(--border);
    background: white; cursor: pointer; font-weight: 600;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    font-size: 12px; font-family: 'DM Sans', sans-serif; transition: 0.15s; text-align: center;
  }
  .method-btn.active { border-color: var(--green); color: var(--green); background: #ebf5ec; }
  .method-btn:hover:not(.active) { border-color: #bbb; }
  .method-btn .method-icon { font-size: 22px; }

  /* Botón Redsys destacado */
  .btn-redsys {
    width: 100%; padding: 16px; border: none; border-radius: 14px;
    background: #003087; color: white;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: background 0.2s;
    margin-bottom: 10px;
  }
  .btn-redsys:hover { background: #00256b; }
  .redsys-badge {
    background: #f7c600; color: #003087;
    font-size: 10px; font-weight: 800;
    padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px;
  }

  .hora-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #ebf5ec; color: var(--green); border-radius: 10px;
    padding: 8px 14px; font-weight: 800; font-size: 16px;
  }

  /* Tarjeta guardada */
  .saved-card-box {
    display: flex; align-items: center; gap: 14px;
    background: #f8f8f8; border: 2px solid var(--green);
    border-radius: 16px; padding: 16px 18px; margin-bottom: 16px;
  }
  .card-chip { width: 38px; height: 28px; border-radius: 5px; background: linear-gradient(135deg, #f0c14b, #d4a017); flex-shrink: 0; }
  .saved-card-info { flex: 1; }
  .saved-card-number { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: 2px; }
  .saved-card-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
  .saved-card-badge { background: #ebf5ec; color: var(--green); border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; }
  .btn-change-card { background: none; border: none; color: #aaa; font-size: 12px; text-decoration: underline; cursor: pointer; margin-top: 10px; font-family: 'DM Sans', sans-serif; }

  .btn-pagar {
    display: block; width: 100%; background: var(--green); color: white; border: none;
    padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800;
    cursor: pointer; transition: 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .btn-pagar:hover:not(:disabled) { background: var(--dark-green); }
  .btn-pagar:disabled { background: #ccc; cursor: not-allowed; }

  .inline-error { color: #e53935; font-size: 13px; background: #fff5f5; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }
  .divider-text { text-align: center; color: #bbb; font-size: 12px; margin: 10px 0; }
`;

export default function Pago() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [metodo, setMetodo]   = useState('redsys');
  const [paying, setPaying]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const itemsCarrito  = state?.items       || [];
  const totalCarrito  = state?.total       || 0;
  const horaRecogida  = state?.horaRecogida || '11:15';

  const tarjetaGuardada = user?.tarjeta || null;

  if (itemsCarrito.length === 0) {
    setTimeout(() => navigate('/menu'), 100);
    return null;
  }

  const formatCardNumber = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry     = (v) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d; };

  const irARedsys = async () => {
    // 1. Primero creamos el pedido en el backend
    setPaying(true);
    setErrorMsg('');
    try {
      const datosPedido = itemsCarrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad }));
      const pedido = await api.crearPedido(datosPedido);

      // Guardamos la hora de recogida para que RedsysPago.jsx la recupere
      localStorage.setItem(`hora_pedido_${pedido.id}`, horaRecogida);

      // 2. Redirigimos a la página TPV simulada con los datos del pedido
      const params = new URLSearchParams({
        pedido_id: pedido.id,
        total:     totalCarrito.toFixed(2),
        concepto:  `Pedido cafetería ${itemsCarrito.map(i => i.nombre).join(', ')}`,
      });
      navigate(`/redsys-pago?${params.toString()}`);
    } catch {
      setErrorMsg('Error al crear el pedido. Inténtalo de nuevo.');
      setPaying(false);
    }
  };

  const handlePagoDirecto = async () => {
    setErrorMsg('');
    if (metodo === 'nueva' && (!cardData.number || !cardData.cvv || !cardData.name)) {
      setErrorMsg('Rellena todos los datos de la tarjeta');
      return;
    }
    setPaying(true);
    try {
      const datosPedido = itemsCarrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad }));
      const pedido = await api.crearPedido(datosPedido);
      await api.pagar(pedido.id, metodo);

      const cola = JSON.parse(localStorage.getItem('cola_recogida') || '[]');
      cola.push({
        id:            pedido.id,
        codigo_qr:     pedido.qr_token?.codigo || pedido.codigo_qr || '???',
        nombre_usuario: pedido.nombre_usuario || user?.first_name || 'Alumno',
        hora_recogida: horaRecogida,
        estado:        'pagado',
        timestamp:     Date.now(),
      });
      if (cola.length > 50) cola.shift();
      localStorage.setItem('cola_recogida', JSON.stringify(cola));

      navigate('/confirmacion', { state: { pedido, horaRecogida } });
    } catch (err) {
      setErrorMsg(err?.data?.error || 'No se pudo procesar el pago. Inténtalo de nuevo.');
      setPaying(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="pago-root">
        <div className="mobile">
          <header className="pago-header">
            <strong>CHECKOUT</strong>
            <span className="material-symbols-outlined">lock</span>
          </header>

          <main className="pago-content">

            {/* Hora de recogida */}
            <div className="card-section" style={{ marginBottom: '16px' }}>
              <p className="section-label">Hora de recogida</p>
              <div className="hora-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                {horaRecogida}
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="card-section">
              <p className="section-label">Resumen del pedido</p>
              {itemsCarrito.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span>{item.cantidad}× {item.nombre}</span>
                  <span style={{ fontWeight: 700 }}>{(item.precio * item.cantidad).toFixed(2)}€</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--green)' }}>{totalCarrito.toFixed(2)}€</span>
              </div>
            </div>

            {/* ── PAGO CON REDSYS (opción principal) ── */}
            <div className="card-section">
              <p className="section-label">Pago seguro con Redsys</p>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '14px' }}>
                Serás redirigido al TPV Virtual de Redsys para completar el pago de forma segura.
              </p>
              <button className="btn-redsys" onClick={irARedsys} disabled={paying}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                {paying ? 'Redirigiendo...' : `Pagar ${totalCarrito.toFixed(2)}€ con Redsys`}
                <span className="redsys-badge">SEGURO</span>
              </button>
            </div>

            <div className="divider-text">— o pagar sin salir de la app —</div>

            {/* ── SELECTOR MÉTODO ALTERNATIVO ── */}
            <div className="method-selector">
              {tarjetaGuardada && (
                <button className={`method-btn ${metodo === 'guardada' ? 'active' : ''}`}
                  onClick={() => { setMetodo('guardada'); setErrorMsg(''); }}>
                  <span className="material-symbols-outlined method-icon">credit_card</span>
                  Tarjeta guardada
                </button>
              )}
              <button className={`method-btn ${metodo === 'nueva' ? 'active' : ''}`}
                onClick={() => { setMetodo('nueva'); setErrorMsg(''); }}>
                <span className="material-symbols-outlined method-icon">add_card</span>
                Nueva tarjeta
              </button>
            </div>

            {/* Tarjeta guardada */}
            {metodo === 'guardada' && tarjetaGuardada && (
              <div className="card-section">
                <p className="section-label">Tarjeta guardada</p>
                <div className="saved-card-box">
                  <div className="card-chip" />
                  <div className="saved-card-info">
                    <div className="saved-card-number">{tarjetaGuardada.numero}</div>
                    <div className="saved-card-meta">{tarjetaGuardada.titular} · Caduca {tarjetaGuardada.expiry}</div>
                  </div>
                  <span className="saved-card-badge">✓</span>
                </div>
                <button className="btn-change-card" onClick={() => setMetodo('nueva')}>Usar otra tarjeta</button>
              </div>
            )}

            {/* Nueva tarjeta */}
            {metodo === 'nueva' && (
              <div className="card-section">
                <p className="section-label">Datos de la tarjeta</p>
                <div className="form-group">
                  <label>TITULAR</label>
                  <input type="text" className="form-input" placeholder="Nombre completo"
                    value={cardData.name} onChange={e => setCardData({ ...cardData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>NÚMERO DE TARJETA</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000"
                    value={cardData.number} onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })} maxLength={19} inputMode="numeric" />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>CADUCIDAD</label>
                    <input type="text" className="form-input" placeholder="MM/AA"
                      value={cardData.expiry} onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })} maxLength={5} inputMode="numeric" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input type="password" className="form-input" placeholder="123"
                      value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g,'').slice(0,3) })} maxLength={3} inputMode="numeric" />
                  </div>
                </div>
              </div>
            )}

            {errorMsg && <div className="inline-error">⚠ {errorMsg}</div>}

            {(metodo === 'guardada' || metodo === 'nueva') && (
              <button className="btn-pagar" onClick={handlePagoDirecto} disabled={paying}>
                {paying ? 'Procesando...' : `CONFIRMAR PAGO · ${totalCarrito.toFixed(2)}€`}
              </button>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

