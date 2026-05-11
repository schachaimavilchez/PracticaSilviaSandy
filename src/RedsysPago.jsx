import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * RedsysPago.jsx — Simulación del TPV Virtual de Redsys
 * Ruta: /redsys-pago
 * Recibe por query params: pedido_id, total, comercio, concepto
 * Al confirmar, llama al backend simulando la notificación IPN de Redsys
 * y redirige a /confirmacion con el resultado.
 */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .redsys-root {
    min-height: 100vh;
    background: #f0f0f0;
    font-family: 'Open Sans', sans-serif;
    display: flex;
    flex-direction: column;
  }

  /* Header Redsys real */
  .redsys-header {
    background: #003087;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .redsys-header-logo {
    color: white;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .redsys-header-logo span { color: #f7c600; }
  .redsys-header-secure {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a8c4e0;
    font-size: 12px;
  }
  .redsys-header-secure svg { width: 14px; height: 14px; fill: #4caf50; }

  /* Barra banco */
  .redsys-bank-bar {
    background: #e8f0fb;
    border-bottom: 2px solid #003087;
    padding: 8px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #003087;
    font-weight: 600;
  }
  .redsys-bank-logo {
    background: #003087;
    color: white;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .redsys-body {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 30px 16px;
    gap: 24px;
    flex-wrap: wrap;
  }

  /* Panel izquierdo - datos del comercio */
  .redsys-merchant-panel {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 20px;
    width: 260px;
    flex-shrink: 0;
  }
  .merchant-title {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .merchant-name {
    font-size: 16px;
    font-weight: 700;
    color: #003087;
    margin-bottom: 6px;
  }
  .merchant-concepto {
    font-size: 13px;
    color: #555;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }
  .merchant-importe-label { font-size: 11px; color: #888; text-transform: uppercase; }
  .merchant-importe {
    font-size: 32px;
    font-weight: 700;
    color: #003087;
    margin-top: 4px;
  }
  .merchant-divisa { font-size: 14px; color: #888; margin-top: 2px; }
  .merchant-pedido {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #888;
  }
  .merchant-pedido strong { color: #333; }

  /* Panel derecho - formulario */
  .redsys-form-panel {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 24px;
    width: 400px;
    flex-shrink: 0;
  }
  .form-panel-title {
    font-size: 15px;
    font-weight: 700;
    color: #003087;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #003087;
  }

  .redsys-field { margin-bottom: 16px; }
  .redsys-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #444;
    margin-bottom: 5px;
  }
  .redsys-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #bbb;
    border-radius: 3px;
    font-size: 14px;
    font-family: 'Open Sans', sans-serif;
    transition: border-color 0.2s;
  }
  .redsys-input:focus { outline: none; border-color: #003087; }
  .redsys-input.error { border-color: #c0392b; }

  .redsys-row { display: flex; gap: 12px; }
  .redsys-row .redsys-field { flex: 1; }

  /* Tarjetas aceptadas */
  .card-logos {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    align-items: center;
  }
  .card-logo {
    height: 28px;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 2px 6px;
    display: flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
  }
  .card-logo.visa { color: #1a1f71; background: white; }
  .card-logo.mc { background: white; }
  .card-logo.amex { color: #007bc1; background: white; }

  /* Botones */
  .redsys-btn-pagar {
    width: 100%;
    background: #003087;
    color: white;
    border: none;
    padding: 14px;
    border-radius: 3px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Open Sans', sans-serif;
    transition: background 0.2s;
    margin-top: 8px;
  }
  .redsys-btn-pagar:hover { background: #00256b; }
  .redsys-btn-pagar:disabled { background: #999; cursor: not-allowed; }
  .redsys-btn-cancelar {
    width: 100%;
    background: white;
    color: #666;
    border: 1px solid #bbb;
    padding: 11px;
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    font-family: 'Open Sans', sans-serif;
    margin-top: 8px;
    transition: background 0.2s;
  }
  .redsys-btn-cancelar:hover { background: #f5f5f5; }

  .error-inline { color: #c0392b; font-size: 12px; margin-top: 4px; }
  .redsys-secure-note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #888;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #eee;
  }

  /* Procesando overlay */
  .processing-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }
  .processing-box {
    background: white;
    border-radius: 8px;
    padding: 40px 48px;
    text-align: center;
  }
  .spinner {
    width: 48px; height: 48px;
    border: 4px solid #e0e0e0;
    border-top-color: #003087;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Footer */
  .redsys-footer {
    background: #003087;
    color: #a8c4e0;
    text-align: center;
    padding: 12px;
    font-size: 11px;
    margin-top: auto;
  }
`;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function RedsysPago() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const pedidoId = searchParams.get('pedido_id');
  const total    = parseFloat(searchParams.get('total') || '0');
  const concepto = searchParams.get('concepto') || 'Pedido cafetería';

  const [card, setCard] = useState({ numero: '', titular: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});
  const [procesando, setProcesando] = useState(false);

  const formatNumero = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length >= 3 ? d.slice(0,2) + '/' + d.slice(2) : d; };

  const validar = () => {
    const e = {};
    if (card.numero.replace(/\s/g,'').length < 16) e.numero = 'Número de tarjeta inválido';
    if (!card.titular.trim()) e.titular = 'Introduce el nombre del titular';
    if (!card.expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'Formato MM/AA';
    if (card.cvv.length < 3) e.cvv = 'CVV inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePagar = async () => {
    if (!validar()) return;
    setProcesando(true);

    try {
      // Simulamos la notificación IPN de Redsys al backend
      // En producción real, esto lo haría el servidor de Redsys automáticamente
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${BASE_URL}/redsys/notificacion/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pedido_id:      pedidoId,
          ds_response:    '0000',        // 0000 = pago autorizado en Redsys
          ds_amount:      Math.round(total * 100), // Redsys trabaja en céntimos
          ds_order:       pedidoId?.padStart(12, '0'),
          ds_merchantcode: '327234688',
          ds_terminal:    '001',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Guardamos en localStorage para PanelEmpleado
        const cola = JSON.parse(localStorage.getItem('cola_recogida') || '[]');
        const horaRecogida = localStorage.getItem(`hora_pedido_${pedidoId}`) || '11:15';
        cola.push({
          id:            parseInt(pedidoId),
          codigo_qr:     data.codigo_qr || '???',
          nombre_usuario: data.nombre_usuario || 'Alumno',
          hora_recogida: horaRecogida,
          estado:        'pagado',
          timestamp:     Date.now(),
        });
        if (cola.length > 50) cola.shift();
        localStorage.setItem('cola_recogida', JSON.stringify(cola));

        navigate('/confirmacion', { state: { pedido: data, horaRecogida } });
      } else {
        throw new Error(data.error || 'Pago rechazado');
      }
    } catch (err) {
      setProcesando(false);
      setErrors({ general: err.message || 'Error al procesar el pago. Inténtalo de nuevo.' });
    }
  };

  return (
    <>
      <style>{CSS}</style>

      {procesando && (
        <div className="processing-overlay">
          <div className="processing-box">
            <div className="spinner" />
            <p style={{ fontWeight: 700, color: '#003087', fontSize: '16px' }}>Procesando pago...</p>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>No cierres esta ventana</p>
          </div>
        </div>
      )}

      <div className="redsys-root">
        {/* Header */}
        <header className="redsys-header">
          <div className="redsys-header-logo">Red<span>sys</span></div>
          <span style={{ color: '#a8c4e0', fontSize: '13px' }}>TPV Virtual — Pago Seguro</span>
          <div className="redsys-header-secure">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            Conexión segura SSL
          </div>
        </header>

        {/* Barra banco */}
        <div className="redsys-bank-bar">
          <div className="redsys-bank-logo">IES</div>
          Banco Cafetería Pío Baroja · Comercio verificado
        </div>

        <div className="redsys-body">
          {/* Panel comercio */}
          <div className="redsys-merchant-panel">
            <p className="merchant-title">Datos del comercio</p>
            <p className="merchant-name">Cafetería IES Pío Baroja</p>
            <p className="merchant-concepto">{concepto}</p>
            <p className="merchant-importe-label">Importe a pagar</p>
            <p className="merchant-importe">{total.toFixed(2)}</p>
            <p className="merchant-divisa">EUR — Euro</p>
            <div className="merchant-pedido">
              Nº Pedido: <strong>{pedidoId?.padStart(12, '0')}</strong><br />
              Terminal: <strong>001</strong><br />
              Comercio: <strong>327234688</strong>
            </div>
          </div>

          {/* Panel formulario */}
          <div className="redsys-form-panel">
            <p className="form-panel-title">Introduzca los datos de su tarjeta</p>

            <div className="card-logos">
              <div className="card-logo visa">VISA</div>
              <div className="card-logo mc" style={{ fontSize: '10px', fontWeight: 700 }}>
                <span style={{ color: '#eb001b' }}>●</span>
                <span style={{ color: '#f79e1b', marginLeft: '-4px' }}>●</span>
              </div>
              <div className="card-logo amex">AMEX</div>
              <span style={{ fontSize: '11px', color: '#888', marginLeft: 'auto' }}>3D Secure</span>
            </div>

            <div className="redsys-field">
              <label>NÚMERO DE TARJETA</label>
              <input
                className={`redsys-input ${errors.numero ? 'error' : ''}`}
                placeholder="0000 0000 0000 0000"
                value={card.numero}
                onChange={e => setCard({ ...card, numero: formatNumero(e.target.value) })}
                maxLength={19}
                inputMode="numeric"
              />
              {errors.numero && <p className="error-inline">{errors.numero}</p>}
            </div>

            <div className="redsys-field">
              <label>TITULAR DE LA TARJETA</label>
              <input
                className={`redsys-input ${errors.titular ? 'error' : ''}`}
                placeholder="Como aparece en la tarjeta"
                value={card.titular}
                onChange={e => setCard({ ...card, titular: e.target.value.toUpperCase() })}
              />
              {errors.titular && <p className="error-inline">{errors.titular}</p>}
            </div>

            <div className="redsys-row">
              <div className="redsys-field">
                <label>CADUCIDAD</label>
                <input
                  className={`redsys-input ${errors.expiry ? 'error' : ''}`}
                  placeholder="MM/AA"
                  value={card.expiry}
                  onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                  inputMode="numeric"
                />
                {errors.expiry && <p className="error-inline">{errors.expiry}</p>}
              </div>
              <div className="redsys-field">
                <label>CVV / CVC</label>
                <input
                  className={`redsys-input ${errors.cvv ? 'error' : ''}`}
                  placeholder="123"
                  type="password"
                  value={card.cvv}
                  onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g,'').slice(0,3) })}
                  maxLength={3}
                  inputMode="numeric"
                />
                {errors.cvv && <p className="error-inline">{errors.cvv}</p>}
              </div>
            </div>

            {errors.general && (
              <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: '4px', padding: '10px 14px', marginBottom: '10px', color: '#c0392b', fontSize: '13px' }}>
                ⚠ {errors.general}
              </div>
            )}

            <button className="redsys-btn-pagar" onClick={handlePagar} disabled={procesando}>
              {procesando ? 'Procesando...' : `PAGAR ${total.toFixed(2)} €`}
            </button>
            <button className="redsys-btn-cancelar" onClick={() => navigate(-1)}>
              Cancelar y volver al comercio
            </button>

            <div className="redsys-secure-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              Pago protegido con cifrado SSL de 256 bits
            </div>
          </div>
        </div>

        <footer className="redsys-footer">
          © Redsys · Sistemas de Tarjetas y Medios de Pago, S.A. · Pago 100% seguro
        </footer>
      </div>
    </>
  );
}
