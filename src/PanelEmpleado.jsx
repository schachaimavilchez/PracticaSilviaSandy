import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/authcontext';
import { api } from './services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');

  :root {
      --verde-lima: #A5D610;
      --verde-oscuro: #2D4A22;
      --fondo: #F0F2F5;
      --blanco: #FFFFFF;
      --gris-borde: #D1D5DB;
      --rojo: #EF4444;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  .panel-root { display: flex; min-height: 100vh; background: var(--fondo); font-family: 'DM Sans', sans-serif; position: relative; }

  .hamburger-btn { position: fixed; top: 15px; left: 15px; width: 45px; height: 45px; background: var(--verde-oscuro); color: white; border-radius: 8px; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; border: none; }
  .sidebar { width: 280px; background: var(--blanco); position: fixed; top: 0; left: 0; bottom: 0; z-index: 9999; box-shadow: 10px 0 30px rgba(0,0,0,0.05); transition: 0.4s; padding: 40px 20px; display: flex; flex-direction: column; }
  .sidebar.open { transform: translateX(0); }
  .sidebar-logo { text-align: center; margin-bottom: 30px; }
  .sidebar-logo img { width: 100px; margin-bottom: 10px; }
  .nav-menu { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--verde-oscuro); border: none; background: transparent; width: 100%; text-align: left; transition: 0.2s; }
  .nav-item.active { background: var(--verde-lima) !important; }
  .btn-logout-sidebar { width: 100%; padding: 12px; border: 1px solid var(--rojo); color: var(--rojo); background: transparent; border-radius: 10px; cursor: pointer; font-weight: 700; margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; }

  .main { flex: 1; margin-left: 280px; padding: 30px; transition: 0.4s; }
  .header-panel { display: flex; justify-content: center; position: relative; margin-bottom: 30px; }
  .header-panel h1 { color: var(--verde-oscuro); font-weight: 800; text-transform: uppercase; font-size: 1.6rem; }

  .card-white { background: #FFFFFF; border-radius: 15px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid var(--gris-borde); margin-bottom: 20px; }
  .section-title { font-size: 1.2rem; font-weight: 800; color: var(--verde-oscuro); margin-bottom: 20px; text-transform: uppercase; }

  .tablero-top-row { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 25px; }
  .stat-card { background: white; padding: 25px; border-radius: 20px; border: 1px solid var(--gris-borde); }
  .scanner-box { background: #1a1a1a; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; min-height: 120px; }
  .qr-aim { width: 40px; height: 40px; border: 2px solid var(--verde-lima); margin-bottom: 10px; opacity: 0.6; }
  .tablero-bottom-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
  .keyboard { display: grid; grid-template-columns: repeat(10, 1fr); gap: 5px; margin-top: 15px; }
  .key { background: #f4f4f4; padding: 12px 5px; border-radius: 6px; text-align: center; font-weight: 700; cursor: pointer; font-size: 11px; user-select: none; }
  .key:active { background: #ddd; }

  .table-responsive { overflow-x: auto; display: block; }
  .gestion-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .gestion-table th { background: #F9FAF7; padding: 15px; text-align: left; color: #666; border-bottom: 1px solid var(--gris-borde); }
  .gestion-table td { padding: 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  .btn-action { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--gris-borde); background: white; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }
  .status-pill.pagado { color: #166534; font-weight: 700; }

  .ranking-row { display: grid; grid-template-columns: 1fr 40px; align-items: center; gap: 10px; margin-bottom: 15px; }
  .ranking-bar-bg { background: #f0f0f0; height: 8px; border-radius: 4px; margin-top: 5px; position: relative; }
  .ranking-bar-fill { background: var(--verde-oscuro); height: 100%; border-radius: 4px; transition: width 0.5s; }

  .menu-layout-grid { display: grid; grid-template-columns: 1fr 350px; gap: 30px; align-items: start; }
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
  .menu-item-card { background: white; border-radius: 15px; border: 1px solid var(--gris-borde); overflow: hidden; text-align: center; }
  .menu-item-img { height: 120px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .menu-item-img img { width: 100%; height: 100%; object-fit: cover; }
  .menu-item-body { padding: 15px; }
  .btn-save-menu { width: 100%; background: var(--verde-oscuro); color: white; padding: 14px; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 10px; }

  @media (max-width: 1024px) {
      .hamburger-btn { display: flex; }
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0; padding-top: 80px; }
      .tablero-top-row, .tablero-bottom-row, .menu-layout-grid { grid-template-columns: 1fr !important; }
  }
`;

const KEYS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
  "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ",
  "Z", "X", "C", "V", "B", "N", "M", "⌫"
];

export default function PanelEmpleado() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tablero');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [qrCodigo, setQrCodigo] = useState('');

  const cargarDatos = useCallback(async () => {
    try {
      const [resP, resPr] = await Promise.all([
        api.getPedidos(), 
        api.getProductos()
      ]);
      
      // Validamos si la respuesta es un array o viene dentro de .results
      const pedidosData = Array.isArray(resP) ? resP : (resP.results || []);
      const productosData = Array.isArray(resPr) ? resPr : (resPr.results || []);
      
      setPedidos(pedidosData);
      setProductos(productosData);
      
      console.log("Productos cargados:", productosData); // Para depuración
    } catch (e) { 
      console.error("Error cargando datos:", e); 
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 15000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  const pedidosCompletados = pedidos.filter(p => 
    p.estado?.toLowerCase() === 'pagado' || p.estado?.toLowerCase() === 'entregado'
  );

  const ventasTotales = pedidosCompletados.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
  const totalPedidos = pedidosCompletados.length;
  const ticketPromedio = totalPedidos > 0 ? ventasTotales / totalPedidos : 0;

  const obtenerRanking = () => {
    const conteo = {};
    pedidosCompletados.forEach(pedido => {
      if (pedido.items && Array.isArray(pedido.items)) {
        pedido.items.forEach(item => {
          const idProducto = item.producto?.id || item.producto;
          const prodInfo = productos.find(p => p.id === idProducto);
          const nombreReal = prodInfo ? prodInfo.nombre : (item.producto_nombre || "Producto #" + idProducto);
          conteo[nombreReal] = (conteo[nombreReal] || 0) + (item.cantidad || 1);
        });
      }
    });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const rankingProductos = obtenerRanking();
  const maxVendido = rankingProductos.length > 0 ? rankingProductos[0][1] : 1;

  const descargarPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.setTextColor(45, 74, 34); 
    doc.text("Reporte de Gestión - IES Pío Baroja", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${fecha} | Admin: Baroja`, 15, 28);
    doc.line(15, 32, 195, 32);
    doc.autoTable({
        startY: 40,
        head: [['Métrica', 'Valor']],
        body: [
            ["Ventas Totales", `${ventasTotales.toFixed(2)}€`],
            ["Total Pedidos", totalPedidos],
            ["Ticket Promedio", `${ticketPromedio.toFixed(2)}€`],
            ["Productos en Catálogo", productos.length]
        ],
        headStyles: { fillColor: [45, 74, 34] },
    });
    doc.text("Top 5 Productos más vendidos", 15, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Producto', 'Unidades']],
        body: rankingProductos,
        headStyles: { fillColor: [165, 214, 16] },
    });
    doc.save(`Reporte_Baroja_${fecha}.pdf`);
  };

  const handleKey = (k) => {
    if (k === "⌫") {
      setQrCodigo(prev => prev.slice(0, -1));
    } else if (qrCodigo.length < 15) { 
      setQrCodigo(prev => (prev + k).toUpperCase());
    }
  };

  const handleNav = (t) => { setTab(t); setMenuOpen(false); };

  return (
    <div className="panel-root">
      <style>{CSS}</style>
      <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/ies_pio_baroja_logo.jpg" alt="Logo" />
          <p style={{fontWeight: 800, fontSize: '10px'}}>ADMIN_BAROJA</p>
        </div>
        <nav className="nav-menu">
          <button className={`nav-item ${tab === 'tablero' ? 'active' : ''}`} onClick={() => handleNav('tablero')}>
            <span className="material-symbols-outlined">dashboard</span> INICIO / TABLERO
          </button>
          <button className={`nav-item ${tab === 'pedidos' ? 'active' : ''}`} onClick={() => handleNav('pedidos')}>
            <span className="material-symbols-outlined">receipt_long</span> GESTOR DE PEDIDOS
          </button>
          <button className={`nav-item ${tab === 'menu' ? 'active' : ''}`} onClick={() => handleNav('menu')}>
            <span className="material-symbols-outlined">restaurant_menu</span> ADMINISTRAR MENÚ
          </button>
          <button className={`nav-item ${tab === 'reportes' ? 'active' : ''}`} onClick={() => handleNav('reportes')}>
            <span className="material-symbols-outlined">bar_chart</span> REPORTES
          </button>
        </nav>
        <button className="btn-logout-sidebar" onClick={() => { logout(); navigate('/'); }}>
          <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span> CERRAR SESIÓN
        </button>
      </aside>

      <main className="main">
        <header className="header-panel"><h1>Panel de Control</h1></header>

        {tab === 'tablero' && (
          <>
            <div className="tablero-top-row">
              <div className="stat-card">
                <p style={{fontSize:'13px', color:'#888', fontWeight:700}}>Pedidos Abiertos</p>
                <div style={{fontSize:'32px', fontWeight:800}}>{pedidos.filter(p => p.estado !== 'entregado').length}</div>
              </div>
              <div className="stat-card">
                <p style={{fontSize:'13px', color:'#888', fontWeight:700}}>Próxima Recogida</p>
                <div style={{fontSize:'32px', fontWeight:800, color:'var(--verde-oscuro)'}}>11:15</div>
              </div>
              <div className="scanner-box">
                <div className="qr-aim"></div>
                <p style={{fontSize:'12px'}}>Escaneando QR...</p>
              </div>
            </div>

            <div className="tablero-bottom-row">
              <div className="card-white table-responsive">
                <h3 className="section-title" style={{fontSize:'0.9rem', borderLeft:'4px solid var(--verde-lima)', paddingLeft:'10px'}}>COLA DE RECOGIDA</h3>
                <table className="gestion-table">
                  <thead><tr><th>Alumno</th><th>Estado</th><th>Acción</th></tr></thead>
                  <tbody>
                    {pedidos.filter(p => p.estado?.toLowerCase() === 'pagado').length > 0 ? (
                      pedidos.filter(p => p.estado?.toLowerCase() === 'pagado').map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.nombre_usuario || 'Usuario'}</strong></td>
                          <td><span className="status-pill pagado">PAGADO</span></td>
                          <td><button className="btn-action" onClick={() => api.cambiarEstado(p.id, 'entregado').then(cargarDatos)}>ENTREGAR</button></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" style={{textAlign:'center', color:'#aaa', padding:'40px'}}>Sin pedidos por entregar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="card-white">
                <h3 className="section-title" style={{fontSize:'0.9rem', borderLeft:'4px solid var(--verde-lima)', paddingLeft:'10px'}}>
                  VALIDACIÓN MANUAL
                </h3>
                <input 
                  type="text" 
                  style={{
                    width:'100%', 
                    textAlign:'center', 
                    fontSize:'1.8rem', 
                    fontWeight:800, 
                    border:'2px solid var(--verde-oscuro)', 
                    padding:'15px', 
                    borderRadius:'12px',
                    background: '#f9f9f9',
                    color: 'var(--verde-oscuro)'
                  }} 
                  value={qrCodigo} 
                  readOnly 
                  placeholder="CÓDIGO O ID" 
                />
                <button 
                  className="btn-save-menu" 
                  style={{height: '50px', fontSize: '1rem'}}
                  onClick={() => api.validarQR(qrCodigo).then(() => { setQrCodigo(''); cargarDatos(); })}
                >
                  VALIDAR AHORA
                </button>
                
                <div className="keyboard">
                  {KEYS.map(k => (
                    <div 
                      key={k} 
                      className="key" 
                      style={{
                        padding: '15px 5px', 
                        background: k === "⌫" ? "#fee2e2" : "#f4f4f4", 
                        color: k === "⌫" ? "#ef4444" : "inherit"
                      }}
                      onClick={() => handleKey(k)}
                    >
                      {k}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'pedidos' && (
          <div className="card-white table-responsive">
            <h2 className="section-title">Historial de Pedidos</h2>
            <table className="gestion-table">
              <thead><tr><th>ID</th><th>Código</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td><td><strong>{p.codigo_qr}</strong></td>
                    <td style={{fontWeight:'bold'}}>{parseFloat(p.total || 0).toFixed(2)}€</td>
                    <td><span className="status-pill pagado">{p.estado?.toUpperCase()}</span></td>
                    <td><button className="btn-action" onClick={() => api.validarQR(p.codigo_qr).then(cargarDatos)}>Validar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'menu' && (
          <div className="menu-layout-grid">
            <div className="menu-grid">
              {productos.map(prod => (
                  <div className="menu-item-card" key={prod.id || prod._id}>
                    <div className="menu-item-img">
                      {/* Probamos todos los nombres posibles de imagen que el servidor pueda enviar */}
                      {(prod.imagen_url || prod.imagen || prod.foto || prod.image) ? (
                        <img src={prod.imagen_url || prod.imagen || prod.foto || prod.image} alt={prod.nombre || prod.name} />
                      ) : (
                        <div style={{padding:'20px', color:'#ccc'}}>Sin imagen</div>
                      )}
                    </div>
                    <div className="menu-item-body">
                      {/* CORRECCIÓN CRÍTICA: nombre o name */}
                      <p style={{fontWeight:700}}>{prod.nombre || prod.name || "Producto sin nombre"}</p>
                      
                      {/* CORRECCIÓN CRÍTICA: precio o price */}
                      <p style={{fontWeight:800, color:'var(--verde-oscuro)'}}>
                        {parseFloat(prod.precio || prod.price || 0).toFixed(2)}€
                      </p>
                      
                      <button 
                        className="btn-action" 
                        style={{color:'var(--rojo)', width:'100%', marginTop:'10px'}} 
                        onClick={() => api.eliminarProducto(prod.id || prod._id).then(cargarDatos)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
              ))}
            </div>

            <aside className="card-white">
              <h3 className="section-title" style={{fontSize: '1rem'}}>NUEVO PRODUCTO</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.innerText = "ENVIANDO...";

                const formData = new FormData(e.target);
                
                try {
                  const respuesta = await api.crearProducto(formData);
                  console.log("Servidor respondió:", respuesta);
                  e.target.reset();
                  cargarDatos();
                  alert("Producto añadido con éxito");
                } catch (error) {
                  console.error("Error detallado:", error);
                  alert("Error al conectar con el servidor. Verifica que el backend esté encendido.");
                } finally {
                  btn.disabled = false;
                  btn.innerText = "AÑADIR AL MENÚ";
                }
              }}>
                <input name="nombre" placeholder="Nombre" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #ddd'}} required />
                <input name="precio" type="number" step="0.01" placeholder="Precio" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #ddd'}} required />
                <input name="imagen" type="file" accept="image/*" style={{marginBottom:'10px'}} />
                <button type="submit" className="btn-save-menu">AÑADIR AL MENÚ</button>
              </form>
            </aside>
          </div>
        )}

        {tab === 'reportes' && (
          <div className="report-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Reportes y Análisis</h1>
                <button onClick={descargarPDF} className="btn-action" style={{ background: 'var(--verde-oscuro)', color: 'white' }}>EXPORTAR PDF</button>
            </div>
            <div className="card-white" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center' }}>
              <div><p style={{fontSize:'0.7rem', color:'#888'}}>VENTAS</p><strong>{ventasTotales.toFixed(2)}€</strong></div>
              <div><p style={{fontSize:'0.7rem', color:'#888'}}>PEDIDOS</p><strong>{totalPedidos}</strong></div>
              <div><p style={{fontSize:'0.7rem', color:'#888'}}>PROMEDIO</p><strong>{ticketPromedio.toFixed(2)}€</strong></div>
              <div><p style={{fontSize:'0.7rem', color:'#888'}}>PRODUCTOS</p><strong>{productos.length}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card-white">
                <h3 className="section-title" style={{fontSize:'0.9rem'}}>Top Productos</h3>
                {rankingProductos.map(([nombre, cantidad]) => (
                  <div key={nombre} className="ranking-row">
                    <div>
                      <div style={{fontSize:'0.8rem', fontWeight:700}}>{nombre}</div>
                      <div className="ranking-bar-bg"><div className="ranking-bar-fill" style={{ width: `${(cantidad / maxVendido) * 100}%` }}></div></div>
                    </div>
                    <div style={{fontWeight:800}}>{cantidad}</div>
                  </div>
                ))}
              </div>
              <div className="card-white">
                <h3 className="section-title" style={{fontSize:'0.9rem'}}>Últimos Pagos</h3>
                <table className="gestion-table">
                  <tbody>
                    {pedidosCompletados.slice(0, 5).map(p => (
                      <tr key={p.id}><td>Pedido #{p.id}</td><td style={{fontWeight:700}}>{parseFloat(p.total).toFixed(2)}€</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}