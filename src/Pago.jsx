import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

  /* Formulario de Tarjeta */
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--gray); margin-bottom: 5px; }
  .form-input { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; box-sizing: border-box; }
  .form-row { display: flex; gap: 10px; }

  .method-selector { display: flex; gap: 10px; margin-bottom: 20px; }
  .method-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border); background: white; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; }
  .method-btn.active { border-color: var(--green); color: var(--green); background: #ebf5ec; }

  .btn-pagar {
    display: block; width: 100%; background: var(--green); color: white; border: none;
    padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800;
    cursor: pointer; transition: 0.2s;
  }
  .btn-pagar:disabled { background: #ccc; }
`;

export default function Pago() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [metodo, setMetodo] = useState('tarjeta');
  const [paying, setPaying] = useState(false);
  
  // Estado para los datos de la nueva tarjeta
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const itemsCarrito = state?.items || [];
  const totalCarrito = state?.total || 0;

  if (itemsCarrito.length === 0) {
    setTimeout(() => navigate('/menu'), 100);
    return null;
  }

  const handlePago = async () => {
    if (metodo === 'tarjeta' && (!cardData.number || !cardData.cvv)) {
      alert("Por favor, rellena los datos de la tarjeta");
      return;
    }

    setPaying(true);
    try {
      const datosPedido = itemsCarrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad }));
      const result = await api.crearPedido(datosPedido);
      await api.pagar(result.id, metodo); 
      navigate('/confirmacion', { state: { pedido: result } });
    } catch (err) {
      alert('Error en el pago');
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
            <div className="method-selector">
              <button className={`method-btn ${metodo === 'tarjeta' ? 'active' : ''}`} onClick={() => setMetodo('tarjeta')}>
                <span className="material-symbols-outlined">credit_card</span> Nueva Tarjeta
              </button>
              <button className={`method-btn ${metodo === 'saldo' ? 'active' : ''}`} onClick={() => setMetodo('saldo')}>
                <span className="material-symbols-outlined">account_balance_wallet</span> Mi Saldo
              </button>
            </div>

            {metodo === 'tarjeta' && (
              <div className="card-section">
                <p className="section-label">Datos de Facturación</p>
                <div className="form-group">
                  <label>TITULAR DE LA TARJETA</label>
                  <input type="text" className="form-input" placeholder="Nombre completo" 
                    onChange={e => setCardData({...cardData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>NÚMERO DE TARJETA</label>
                  <input type="text" className="form-input" placeholder="0000 0000 0000 0000" maxLength="16"
                    onChange={e => setCardData({...cardData, number: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{flex: 2}}>
                    <label>CADUCIDAD</label>
                    <input type="text" className="form-input" placeholder="MM/AA" maxLength="5"
                      onChange={e => setCardData({...cardData, expiry: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label>CVV</label>
                    <input type="password" className="form-input" placeholder="123" maxLength="3"
                      onChange={e => setCardData({...cardData, cvv: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {metodo === 'saldo' && (
              <div className="card-section" style={{textAlign: 'center', padding: '40px 20px'}}>
                <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--green)'}}>account_balance_wallet</span>
                <p style={{fontWeight: '700', marginTop: '10px'}}>Se utilizará tu saldo acumulado</p>
                <p style={{fontSize: '12px', color: 'var(--gray)'}}>No necesitas introducir datos bancarios</p>
              </div>
            )}

            <div className="card-section">
              <p className="section-label">Resumen</p>
              <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '18px'}}>
                <span>Total a pagar</span>
                <span>{totalCarrito.toFixed(2)}€</span>
              </div>
            </div>

            <button className="btn-pagar" onClick={handlePago} disabled={paying}>
              {paying ? 'Procesando...' : `FINALIZAR COMPRA`}
            </button>
          </main>
        </div>
      </div>
    </>
  );
}