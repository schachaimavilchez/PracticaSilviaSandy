import { useLocation, useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

  :root { --green: #407e44; --accent: #7eb34a; --text: #333; --bg: #f4f7f5; }
  .conf-root { min-height: 100vh; background: var(--bg); display: flex; justify-content: center; font-family: 'DM Sans', sans-serif; }
  .mobile { width: 100%; max-width: 430px; min-height: 100vh; display: flex; flex-direction: column; }
  .conf-header { padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; background: white; border-bottom: 1px solid #eee; }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-area img { width: 34px; }
  .logo-area strong { font-size: 13px; font-weight: 700; }
  .conf-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .conf-card { background: white; border-radius: 32px; padding: 38px 22px; text-align: center; width: 100%; box-shadow: 0 12px 32px rgba(0,0,0,0.07); }
  .conf-title { font-size: 28px; font-weight: 900; color: var(--green); margin-bottom: 20px; }
  .qr-container { background: #f9f9f9; padding: 20px; border-radius: 20px; display: inline-block; margin-bottom: 15px; border: 1px dashed #ddd; }
  .qr-img { width: 180px; height: 180px; display: block; }
  .clave-label { font-size: 14px; color: #888; text-transform: uppercase; font-weight: 700; margin-top: 10px; }
  .clave-value { font-size: 28px; font-weight: 900; color: var(--text); letter-spacing: 4px; margin-top: 5px; }
  .btn-mostrar { display: block; width: 100%; background: var(--green); color: white; border: none; padding: 18px; border-radius: 18px; font-size: 15px; font-weight: 800; cursor: pointer; margin-top: 25px; }
  .btn-menu { background: none; border: none; color: #aaa; cursor: pointer; margin-top: 15px; text-decoration: underline; font-size: 14px; width: 100%; }
`;

export default function Confirmacion() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // 1. Intentamos sacar el código del pedido que viene de Pago.jsx
  // Si Django devolvió el objeto QRToken dentro del pedido, lo usamos.
  // Si no, generamos uno aleatorio para que la pantalla nunca salga en blanco.
  const pedido = state?.pedido;
  const codigoFinal = pedido?.qr_token?.codigo || state?.qr?.codigo || Math.random().toString(36).substring(2, 8).toUpperCase();

  // 2. Generamos la URL del QR usando una API externa gratuita (qrserver)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${codigoFinal}`;

  return (
    <>
      <style>{CSS}</style>
      <div className="conf-root">
        <div className="mobile">
          <header className="conf-header">
            <div className="logo-area">
              <img src="/ies_pio_baroja_logo.jpg" alt="Logo" />
              <strong>PEDIDO CONFIRMADO</strong>
            </div>
          </header>

          <div className="conf-content">
            <div className="conf-card">
              <h2 className="conf-title">¡PAGO ÉXITOSO!</h2>

              <div className="qr-container">
                <img src={qrUrl} alt="Código QR de recogida" className="qr-img" />
              </div>

              <p className="clave-label">Código de recogida</p>
              <p className="clave-value">{codigoFinal}</p>

              <button className="btn-mostrar" onClick={() => window.print()}>
                GUARDAR COMPROBANTE
              </button>
              
              <button className="btn-menu" onClick={() => navigate('/menu')}>
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
