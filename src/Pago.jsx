import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from './services/api';
import { useAuth } from './context/authcontext';

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

  .method-selector { display: flex; gap: 10px; margin-bottom: 20px; }
  .method-btn {
    flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border);
    background: white; cursor: pointer; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 13px; font-family: 'DM Sans', sans-serif; transition: 0.15s;
  }
  .method-btn.active { border-color: var(--green); color: var(--green); background: #ebf5ec; }
  .method-btn:hover:not(.active) { border-color: #bbb; }

  .hora-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #ebf5ec; color: var(--green); border-radius: 10px;
    padding: 8px 14px; font-weight: 800; font-size: 16px;
  }

  /* Tarjeta guardada */
  .saved-card-box {
    display: flex; align-items: center; gap: 14px;
    background: #f8f8f8; border: 2px solid var(--green);
    border-radius: 16px; padding: 16px 18px;
    margin-bottom: 16px;
  }
  .card-chip {
    width: 38px; height: 28px; border-radius: 5px;
    background: linear-gradient(135deg, #f0c14b, #d4a017);
    flex-shrink: 0;
  }
  .saved-card-info { flex: 1; }
  .saved-card-number { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: 2px; }
  .saved-card-meta { font-size: 11px; color: #aaa; margin-top: 2px; }
  .saved-card-badge {
    background: #ebf5ec; color: var(--green);
    border-radius: 8px; padding: 4px 10px;
    font-size: 11px; font-weight: 700;
  }
  .btn-change-card {
    background: none; border: none; color: #aaa; font-size: 12px;
    text-decoration: underline; cursor: pointer; margin-top: 10px;
    font-family: 'DM Sans', sans-serif;
  }

  .btn-pagar {
    display: block; width: 100%; background: var(--green); color: white; border: none;
    padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800;
    cursor: pointer; transition: 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .btn-pagar:hover:not(:disabled) { background: var(--dark-green); }
  .btn-pagar:disabled { background: #ccc; cursor: not-allowed; }

  .inline-error { color: #e53935; font-size: 13px; background: #fff5f5; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }
`;

export default function Pago() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [metodo, setMetodo] = useState('guardada');
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [usandoNueva, setUsandoNueva] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const itemsCarrito = state?.items || [];
  const totalCarrito = state?.total || 0;
  const horaRecogida = state?.horaRecogida || '11:15';

  // Tarjeta guardada simulada (en producción vendría del backend: user.tarjeta)
  const tarjetaGuardada = user?.tarjeta || { numero: '**** **** **** 4242', titular: user?.first_name || 'Usuario', expiry: '12/27' };

  if (itemsCarrito.length === 0) {
    setTimeout(() => navigate('/menu'), 100);
    return null;
  }

  const validarNuevaTarjeta = () => {
    if (!cardData.name.trim()) { setErrorMsg('Introduce el nombre del titular'); return false; }
    if (cardData.number.replace(/\s/g, '').length < 16) { setErrorMsg('El número de tarjeta debe tener 16 dígitos'); return false; }
    if (!cardData.expiry.match(/^\d{2}\/\d{2}$/)) { setErrorMsg('Formato de caducidad incorrecto (MM/AA)'); return false; }
    if (cardData.cvv.length < 3) { setErrorMsg('CVV inválido'); return false; }
    return true;
  };

  const handlePago = async () => {
    setErrorMsg('');

    if (metodo === 'nueva' && !validarNuevaTarjeta()) return;

    setPaying(true);
    try {
      const datosPedido = itemsCarrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad }));
      const result = await api.crearPedido(datosPedido);
      await api.pagar(result.id, metodo);

      // Guardamos en localStorage para que PanelEmpleado pueda leerlo
      const colaActual = JSON.parse(localStorage.getItem('cola_recogida') || '[]');
      const nuevaEntrada = {
        id: result.id,
        codigo_qr: result.qr_token?.codigo || result.codigo_qr || '???',
        nombre_usuario: result.nombre_usuario || user?.first_name || 'Alumno',
        hora_recogida: horaRecogida,
        estado: 'pagado',
        timestamp: Date.now(),
      };
      colaActual.push(nuevaEntrada);
      if (colaActual.length > 50) colaActual.shift();
      localStorage.setItem('cola_recogida', JSON.stringify(colaActual));

      navigate('/confirmacion', { state: { pedido: result, horaRecogida } });
    } catch (err) {
      console.error('Error en el pago:', err);
      setErrorMsg('No se pudo procesar el pago. Inténtalo de nuevo.');
      setPaying(false);
    }
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
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

            {/* Selector de método de pago */}
            <div className="method-selector">
              <button
                className={`method-btn ${metodo === 'guardada' ? 'active' : ''}`}
                onClick={() => { setMetodo('guardada'); setUsandoNueva(false); setErrorMsg(''); }}
              >
                <span className="material-symbols-outlined">credit_card</span>
                Tarjeta guardada
              </button>
              <button
                className={`method-btn ${metodo === 'nueva' ? 'active' : ''}`}
                onClick={() => { setMetodo('nueva'); setUsandoNueva(true); setErrorMsg(''); }}
              >
                <span className="material-symbols-outlined">add_card</span>
                Nueva tarjeta
              </button>
            </div>

            {/* TARJETA GUARDADA */}
            {metodo === 'guardada' && (
              <div className="card-section">
                <p className="section-label">Pagar con tarjeta guardada</p>
                <div className="saved-card-box">
                  <div className="card-chip" />
                  <div className="saved-card-info">
                    <div className="saved-card-number">{tarjetaGuardada.numero}</div>
                    <div className="saved-card-meta">{tarjetaGuardada.titular} · Caduca {tarjetaGuardada.expiry}</div>
                  </div>
                  <span className="saved-card-badge">✓ Guardada</span>
                </div>
                <button className="btn-change-card" onClick={() => { setMetodo('nueva'); setUsandoNueva(true); }}>
                  Usar otra tarjeta
                </button>
              </div>
            )}

            {/* NUEVA TARJETA */}
            {metodo === 'nueva' && (
              <div className="card-section">
                <p className="section-label">Datos de la nueva tarjeta</p>
                <div className="form-group">
                  <label>TITULAR DE LA TARJETA</label>
                  <input type="text" className="form-input" placeholder="Nombre completo"
                    value={cardData.name}
                    onChange={e => setCardData({ ...cardData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>NÚMERO DE TARJETA</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000"
                    value={cardData.number}
                    onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    maxLength="19" inputMode="numeric" />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>CADUCIDAD</label>
                    <input type="text" className="form-input" placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      maxLength="5" inputMode="numeric" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>CVV</label>
                    <input type="password" className="form-input" placeholder="123"
                      value={cardData.cvv}
                      onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                      maxLength="3" inputMode="numeric" />
                  </div>
                </div>
              </div>
            )}

            {/* Error inline */}
            {errorMsg && <div className="inline-error">⚠ {errorMsg}</div>}

            {/* Resumen */}
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
                <span>Total a pagar</span>
                <span style={{ color: 'var(--green)' }}>{totalCarrito.toFixed(2)}€</span>
              </div>
            </div>

            <button className="btn-pagar" onClick={handlePago} disabled={paying}>
              {paying ? 'Procesando...' : `FINALIZAR COMPRA · ${totalCarrito.toFixed(2)}€`}
            </button>
          </main>
        </div>
      </div>
    </>
  );
}

