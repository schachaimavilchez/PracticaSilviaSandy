import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { api } from './services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');

  :root { --green: #407e44; --light-green: #ebf5ec; --text: #333; --bg: #f4f7f5; --white: #fff; --border: #e0e0e0; }

  .menu-root { min-height: 100vh; background: var(--bg); display: flex; justify-content: center; font-family: 'DM Sans', sans-serif; }
  .mobile { width: 100%; max-width: 430px; background: var(--bg); min-height: 100vh; position: relative; }
  .menu-header {
    position: sticky; top: 0; z-index: 20; background: var(--white);
    /* Forzamos padding derecho a 5px para pegarlo al borde */
    padding: 10px 5px 10px 18px; 
    display: flex; justify-content: space-between;
    align-items: center; border-bottom: 1px solid var(--border);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-area img { width: 34px; height: 34px; object-fit: contain; }
  .logo-area strong { font-size: 13px; color: var(--text); font-weight: 700; }
  .icon-btn { 
    background: none; border: none; cursor: pointer; color: var(--text); 
    /* Reducimos el padding del botón para que el icono sea el borde real */
    padding: 0px 4px; 
    display: flex; align-items: center; 
  }.notif-wrap { position: relative; }
  .notif-dot { position: absolute; top: 0; right: 0; width: 8px; height: 8px; background: #ff5252; border-radius: 50%; border: 1.5px solid white; }

  /* Dropdown */
  .dropdown-wrap { 
    position: relative;
    /* Esto lo empuja a la derecha ignorando el orden de flexbox */
    margin-left: auto; 
    margin-right: 0;
  }
  .dropdown-menu {
    position: absolute; 
    top: 42px; 
    right: 0; /* Esto lo alinea perfectamente con el borde derecho del botón */
    background: white;
    border-radius: 14px; 
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    min-width: 160px; 
    z-index: 100; 
    overflow: hidden; 
    border: 1px solid var(--border);
  }
  .dropdown-item {
    display: block; padding: 12px 16px; font-size: 14px; color: var(--text);
    cursor: pointer; background: none; border: none; width: 100%; text-align: left;
    text-decoration: none;
  }
  .dropdown-item:hover { background: var(--light-green); color: var(--green); }
  .dropdown-item.danger { color: #ff5252; }
  .dropdown-divider { border: none; border-top: 1px solid var(--border); margin: 0; }

  /* Content */
  .menu-content { padding: 16px 16px 100px; }
  .menu-title { font-size: 26px; font-weight: 800; color: var(--green); text-align: center; margin: 10px 0 18px; }

  /* Cards */
  .product-card { background: var(--white); border-radius: 16px; overflow: hidden; margin-bottom: 14px; border: 1px solid var(--border); }
  .product-img { height: 140px; position: relative; }
  .product-img img { width: 100%; height: 100%; object-fit: cover; }
  .img-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 14px; background: linear-gradient(transparent, rgba(0,0,0,0.75)); color: white; font-weight: 700; font-size: 15px; }
  .product-footer { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .price { font-size: 20px; font-weight: 800; color: var(--text); }
  .btn-add { background: var(--green); color: white; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 14px; transition: background 0.2s; }
  .btn-add:hover { background: #356838; }
  .qty-ctrl { display: flex; align-items: center; gap: 10px; }
  .qty-btn { width: 30px; height: 30px; background: var(--light-green); color: var(--green); border: none; border-radius: 8px; font-size: 18px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .qty-num { font-weight: 700; font-size: 16px; min-width: 20px; text-align: center; }

  /* Bottom bar */
  .bottom-bar {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px; background: var(--white);
    padding: 14px 18px; border-top: 1px solid var(--border);
    box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
  }
  .btn-continuar {
    display: block; background: var(--green); color: white; text-align: center;
    padding: 15px; border-radius: 14px; font-weight: 700; font-size: 16px;
    text-decoration: none; cursor: pointer; border: none; width: 100%;
    transition: background 0.2s;
  }
  .btn-continuar:hover { background: #356838; }
  .btn-continuar:disabled { background: #ccc; cursor: not-allowed; }
  .cart-badge { background: white; color: var(--green); border-radius: 12px; padding: 2px 8px; font-size: 13px; margin-left: 8px; font-weight: 800; }

  /* Modal perfil/pedidos/ajustes */
  .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.65); display: flex; justify-content: center; align-items: center; z-index: 200; }
  .modal-box { background: white; border-radius: 22px; padding: 26px; width: 90%; max-width: 360px; max-height: 80vh; overflow-y: auto; }
  .modal-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 18px; color: var(--text); }
  .btn-close { display: block; width: 100%; padding: 13px; background: var(--green); color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; margin-top: 18px; font-size: 15px; }
  .pedido-card { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
  .pedido-header { padding: 13px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .pedido-body { padding: 13px; background: #fafafa; border-top: 1px dashed var(--border); font-size: 13px; }
  .pedido-line { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .loading { text-align: center; padding: 40px; color: #aaa; font-size: 15px; }
  .empty { text-align: center; padding: 40px; color: #bbb; }
  .switch { position: relative; display: inline-block; width: 42px; height: 22px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 22px; transition: .3s; }
  .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
  input:checked + .slider { background: var(--green); }
  input:checked + .slider:before { transform: translateX(20px); }
  .ajuste-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .btn-danger { color: #ff5252; background: none; border: 1px solid #ff5252; padding: 10px; border-radius: 10px; cursor: pointer; width: 100%; font-weight: 700; margin-top: 16px; }
`;

const PLACEHOLDER_IMGS = {
  'panBaconQueso.jpg': '/panBaconQueso.jpg',
  'pincho.jpg': '/pincho.jpg',
  'napolitana.jpg': '/napolitana.jpg',
};

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState({});
  const [dropdown, setDropdown] = useState(false);
  const [modal, setModal] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifOn, setNotifOn] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);

  useEffect(() => {
    api.getProductos()
      .then(data => setProductos(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoadingProductos(false));
  }, []);

  const openPedidos = () => {
    setDropdown(false);
    setModal('pedidos');
    setLoadingPedidos(true);
    api.getPedidos()
      .then(data => setPedidos(Array.isArray(data) ? data : data.results || []))
      .catch(console.error)
      .finally(() => setLoadingPedidos(false));
  };

  const addToCart = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(c => {
    const n = { ...c };
    if (n[id] <= 1) delete n[id];
    else n[id]--;
    return n;
  });

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const irAlCarrito = () => {
    if (!totalItems || productos.length === 0) return;
    
    try {
      const itemsParaCarrito = Object.entries(cart).map(([id, cantidad]) => {
        const producto = productos.find(p => p.id === Number(id));
        // Si por lo que sea no encuentra el producto, devolvemos un objeto vacío para evitar el crash
        return producto ? { ...producto, cantidad } : null;
      }).filter(item => item !== null); // Limpiamos los nulos

      console.log("Enviando al carrito:", itemsParaCarrito);
      navigate('/carrito', { state: { items: itemsParaCarrito } });
    } catch (error) {
      console.error("Error al navegar al carrito:", error);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="menu-root">
        <div className="mobile">
          {/* Header */}
          <header className="menu-header">
            <div className="logo-area">
              <img src="/ies_pio_baroja_logo.jpg" alt="Logo" />
              <strong>IES PÍO BAROJA</strong>
            </div>
            <div className="dropdown-wrap">
              <button className="icon-btn" onClick={() => setDropdown(!dropdown)}>
                <span className="material-symbols-outlined" style={{ fontSize: 30 }}>account_circle</span>
              </button>
              {dropdown && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setDropdown(false); setModal('perfil'); }}>Mi Perfil</button>
                  <button className="dropdown-item" onClick={openPedidos}>Mis Pedidos</button>
                  <button className="dropdown-item" onClick={() => { setDropdown(false); setModal('ajustes'); }}>Ajustes</button>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={() => { logout(); navigate('/'); }}>Cerrar Sesión</button>
                </div>
              )}
            </div>
            {notifOn && (
              <div className="notif-wrap icon-btn">
                <span className="material-symbols-outlined">notifications</span>
                <div className="notif-dot" />
              </div>
            )}
          </header>

          {/* Productos */}
          <main className="menu-content">
            <h1 className="menu-title">MENÚ</h1>
            {loadingProductos ? (
              <div className="loading">Cargando menú...</div>
            ) : productos.length === 0 ? (
              <div className="empty">No hay productos disponibles</div>
            ) : (
              productos.map(p => (
                <div className="product-card" key={p.id}>
                  <div className="product-img">
                    <img
                      src={p.imagen_url || PLACEHOLDER_IMGS[p.nombre] || `https://placehold.co/400x140/98d361/white?text=${encodeURIComponent(p.nombre)}`}
                      alt={p.nombre}
                      onError={(e) => { e.target.src = `https://placehold.co/400x140/98d361/white?text=${encodeURIComponent(p.nombre)}`; }}
                    />
                    <div className="img-overlay">{p.nombre}</div>
                  </div>
                  <div className="product-footer">
                    <span className="price">{parseFloat(p.precio).toFixed(2)}€</span>
                    {cart[p.id] ? (
                      <div className="qty-ctrl">
                        <button className="qty-btn" onClick={() => removeFromCart(p.id)}>−</button>
                        <span className="qty-num">{cart[p.id]}</span>
                        <button className="qty-btn" onClick={() => addToCart(p.id)}>+</button>
                      </div>
                    ) : (
                      <button className="btn-add" onClick={() => addToCart(p.id)}>AÑADIR</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </main>

          {/* Bottom bar */}
          <div className="bottom-bar">
            <button className="btn-continuar" onClick={irAlCarrito} disabled={!totalItems}>
              {totalItems ? (
                <>Ver Carrito <span className="cart-badge">{totalItems}</span></>
              ) : 'Añade algo al pedido'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Perfil */}
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

      {/* Modal Pedidos */}
      {modal === 'pedidos' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Mis Pedidos</h2>
            {loadingPedidos ? (
              <div className="loading">Cargando...</div>
            ) : pedidos.length === 0 ? (
              <div className="empty">No tienes pedidos aún</div>
            ) : (
              pedidos.map(p => (
                <div className="pedido-card" key={p.id}>
                  <div className="pedido-header" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                    <div>
                      <strong>{new Date(p.creado).toLocaleDateString('es-ES')} — {new Date(p.creado).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h</strong>
                      <div style={{ fontSize: 12, color: '#888' }}>#{p.id} · {p.estado}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--green)' }}>{parseFloat(p.total).toFixed(2)}€ ▾</span>
                  </div>
                  {expandido === p.id && (
                    <div className="pedido-body">
                      {p.items?.map(item => (
                        <div className="pedido-line" key={item.id}>
                          <span>{item.cantidad}x {item.nombre_producto}</span>
                          <span>{parseFloat(item.subtotal).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <button className="btn-close" onClick={() => setModal(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Ajustes */}
      {modal === 'ajustes' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Ajustes</h2>
            <div className="ajuste-row">
              <span>Modo Oscuro</span>
              <label className="switch">
                <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
            <div className="ajuste-row">
              <span>Notificaciones</span>
              <label className="switch">
                <input type="checkbox" checked={notifOn} onChange={e => setNotifOn(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
            <button className="btn-danger" onClick={() => {
              if (confirm('¿Desactivar cuenta?')) { logout(); navigate('/'); }
            }}>Desactivar Cuenta</button>
            <button className="btn-close" onClick={() => setModal(null)}>Guardar y Salir</button>
          </div>
        </div>
      )}
    </>
  );
}