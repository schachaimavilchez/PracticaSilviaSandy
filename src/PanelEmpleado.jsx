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

  .hamburger-btn { position: fixed; top: 15px; left: 15px; width: 45px; height: 45px; background: var(--verde-oscuro); color: white; border-radius: 8px; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; border: none; font-size: 20px; }
  .sidebar { width: 280px; background: var(--blanco); position: fixed; top: 0; left: 0; bottom: 0; z-index: 9999; box-shadow: 10px 0 30px rgba(0,0,0,0.05); transition: 0.4s; padding: 40px 20px; display: flex; flex-direction: column; }
  .sidebar-logo { text-align: center; margin-bottom: 30px; }
  .sidebar-logo img { width: 100px; margin-bottom: 10px; }
  .nav-menu { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--verde-oscuro); border: none; background: transparent; width: 100%; text-align: left; transition: 0.2s; }
  .nav-item:hover { background: #f0f0f0; }
  .nav-item.active { background: var(--verde-lima) !important; }
  .btn-logout-sidebar { width: 100%; padding: 12px; border: 1px solid var(--rojo); color: var(--rojo); background: transparent; border-radius: 10px; cursor: pointer; font-weight: 700; margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'DM Sans', sans-serif; }

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
  .btn-action { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--gris-borde); background: white; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
  .status-pill.pagado { color: #166534; font-weight: 700; }

  .hora-pill { display: inline-flex; align-items: center; gap: 4px; background: #ebf5ec; color: #2D4A22; border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: 800; }
  .hora-pill.urgente { background: #fff3cd; color: #856404; }

  .ranking-row { display: grid; grid-template-columns: 1fr 40px; align-items: center; gap: 10px; margin-bottom: 15px; }
  .ranking-bar-bg { background: #f0f0f0; height: 8px; border-radius: 4px; margin-top: 5px; position: relative; }
  .ranking-bar-fill { background: var(--verde-oscuro); height: 100%; border-radius: 4px; transition: width 0.5s; }

  .menu-layout-grid { display: grid; grid-template-columns: 1fr 350px; gap: 30px; align-items: start; }
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px; }
  .menu-item-card { background: white; border-radius: 15px; border: 1px solid var(--gris-borde); overflow: hidden; text-align: center; }
  .menu-item-img { height: 120px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .menu-item-img img { width: 100%; height: 100%; object-fit: cover; }
  .menu-item-body { padding: 15px; }
  .btn-save-menu { width: 100%; background: var(--verde-oscuro); color: white; padding: 14px; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 10px; font-family: 'DM Sans', sans-serif; }

  /* Toast inline */
  .toast { padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
  .toast-ok  { background: #d1fae5; color: #065f46; }
  .toast-err { background: #fee2e2; color: #991b1b; }

  /* Filtro fechas estadísticas */
  .filtro-fechas { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  .filtro-fechas input[type="date"] { padding: 8px 12px; border: 1px solid var(--gris-borde); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; }
  .filtro-fechas button { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'DM Sans', sans-serif; }
  .btn-filtrar { background: var(--verde-oscuro); color: white; }
  .btn-limpiar { background: #f0f0f0; color: #555; }

  /* Modal editar producto */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
  .modal-edit { background: white; border-radius: 16px; padding: 28px; width: 90%; max-width: 400px; }
  .modal-edit h3 { font-size: 1.1rem; font-weight: 800; color: var(--verde-oscuro); margin-bottom: 18px; }
  .edit-field { margin-bottom: 14px; }
  .edit-field label { display: block; font-size: 12px; font-weight: 600; color: #888; margin-bottom: 4px; text-transform: uppercase; }
  .edit-field input { width: 100%; padding: 10px 12px; border: 1px solid var(--gris-borde); border-radius: 8px; font-size: 14px; font-family: 'DM Sans', sans-serif; }
  .edit-actions { display: flex; gap: 10px; margin-top: 18px; }
  .edit-actions button { flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .btn-guardar { background: var(--verde-oscuro); color: white; }
  .btn-cancelar { background: #f0f0f0; color: #555; }

  @media (max-width: 1024px) {
    .hamburger-btn { display: flex; }
    .sidebar { transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main { margin-left: 0; padding-top: 80px; }
    .tablero-top-row, .tablero-bottom-row, .menu-layout-grid { grid-template-columns: 1fr !important; }
  }
`;

const KEYS = [
  "1","2","3","4","5","6","7","8","9","0",
  "Q","W","E","R","T","Y","U","I","O","P",
  "A","S","D","F","G","H","J","K","L","Ñ",
  "Z","X","C","V","B","N","M","⌫"
];

function calcularProximaRecogida(pedidosLocales) {
  const HORAS_POSIBLES = ['10:30', '10:45', '11:15', '11:30'];
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  const pendientes = pedidosLocales.filter(p => p.estado === 'pagado');
  const horasFuturas = [...new Set(pendientes.map(p => p.hora_recogida))]
    .filter(h => { if (!h) return false; const [hh, mm] = h.split(':').map(Number); return (hh * 60 + mm) >= minutosActuales; })
    .sort();
  if (horasFuturas.length > 0) return horasFuturas[0];
  const siguiente = HORAS_POSIBLES.find(h => { const [hh, mm] = h.split(':').map(Number); return (hh * 60 + mm) > minutosActuales; });
  return siguiente || '—';
}

export default function PanelEmpleado() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tablero');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [qrCodigo, setQrCodigo] = useState('');
  const [colaLocal, setColaLocal] = useState([]);
  const [toast, setToast] = useState(null); // { tipo: 'ok'|'err', msg: string }

  // Estadísticas
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Editar producto
  const [productoEditando, setProductoEditando] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', precio: '', disponible: true });

  const mostrarToast = (tipo, msg) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const leerColaLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem('cola_recogida');
      setColaLocal(raw ? JSON.parse(raw) : []);
    } catch { setColaLocal([]); }
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [resP, resPr] = await Promise.all([api.getPedidos(), api.getProductos()]);
      setPedidos(Array.isArray(resP) ? resP : (resP.results || []));
      setProductos(Array.isArray(resPr) ? resPr : (resPr.results || []));
    } catch (e) { console.error('Error cargando datos:', e); }
  }, []);

  const cargarEstadisticas = useCallback(async (inicio = null, fin = null) => {
    setLoadingStats(true);
    try {
      const data = await api.getEstadisticas(inicio, fin);
      setStats(data);
    } catch (e) {
      console.error('Error cargando estadísticas:', e);
      mostrarToast('err', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    leerColaLocal();
    const interval = setInterval(() => { cargarDatos(); leerColaLocal(); }, 15000);
    return () => clearInterval(interval);
  }, [cargarDatos, leerColaLocal]);

  // Cargar estadísticas al entrar en la pestaña
  useEffect(() => {
    if (tab === 'reportes' && !stats) cargarEstadisticas();
  }, [tab]);

  // Cola enriquecida con localStorage
  const pedidosPagados = pedidos.filter(p => p.estado?.toLowerCase() === 'pagado');
  const pedidosEnriquecidos = pedidosPagados.map(p => {
    const local = colaLocal.find(c => c.id === p.id);
    return { ...p, hora_recogida: local?.hora_recogida || null };
  });
  const idsBackend = new Set(pedidosPagados.map(p => p.id));
  const soloLocales = colaLocal.filter(c => !idsBackend.has(c.id) && c.estado === 'pagado');
  const colaFinal = [...pedidosEnriquecidos, ...soloLocales].sort((a, b) => {
    const toMin = h => { if (!h) return 9999; const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
    return toMin(a.hora_recogida) - toMin(b.hora_recogida);
  });
  const proximaRecogida = calcularProximaRecogida([...pedidosEnriquecidos, ...soloLocales]);

  const marcarEntregado = async (id) => {
    try {
      await api.cambiarEstado(id, 'entregado');
      const raw = JSON.parse(localStorage.getItem('cola_recogida') || '[]');
      localStorage.setItem('cola_recogida', JSON.stringify(raw.map(c => c.id === id ? { ...c, estado: 'entregado' } : c)));
      leerColaLocal();
      cargarDatos();
      mostrarToast('ok', 'Pedido marcado como entregado');
    } catch {
      mostrarToast('err', 'Error al actualizar el pedido');
    }
  };

  const handleValidarQR = async () => {
    if (!qrCodigo.trim()) return;
    try {
      const res = await api.validarQR(qrCodigo);
      mostrarToast('ok', res.mensaje || 'Pedido entregado correctamente');
      setQrCodigo('');
      cargarDatos();
      leerColaLocal();
    } catch (err) {
      mostrarToast('err', err?.data?.error || err?.data?.mensaje || 'Código QR no válido');
    }
  };

  const handleKey = (k) => {
    if (k === '⌫') setQrCodigo(prev => prev.slice(0, -1));
    else if (qrCodigo.length < 15) setQrCodigo(prev => (prev + k).toUpperCase());
  };

  const abrirEdicion = (prod) => {
    setProductoEditando(prod);
    setEditForm({ nombre: prod.nombre, precio: prod.precio, disponible: prod.disponible });
  };

  const guardarEdicion = async () => {
    if (!productoEditando) return;
    try {
      await api.actualizarProducto(productoEditando.id, editForm);
      setProductoEditando(null);
      cargarDatos();
      mostrarToast('ok', 'Producto actualizado correctamente');
    } catch {
      mostrarToast('err', 'Error al actualizar el producto');
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await api.eliminarProducto(id);
      cargarDatos();
      mostrarToast('ok', 'Producto eliminado');
    } catch {
      mostrarToast('err', 'Error al eliminar el producto');
    }
  };

  const descargarPDF = () => {
    if (!stats) return;
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString('es-ES');
    doc.setFontSize(18); doc.setTextColor(45, 74, 34);
    doc.text('Reporte de Gestión - IES Pío Baroja', 15, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generado el: ${fecha}`, 15, 28);
    doc.line(15, 32, 195, 32);
    doc.autoTable({
      startY: 40,
      head: [['Métrica', 'Valor']],
      body: [
        ['Ventas Totales', `${stats.resumen.total_ventas.toFixed(2)}€`],
        ['Total Pedidos', stats.resumen.total_pedidos],
        ['Ticket Medio', `${stats.resumen.ticket_medio.toFixed(2)}€`],
        ['Productos en Catálogo', stats.resumen.total_productos],
      ],
      headStyles: { fillColor: [45, 74, 34] },
    });
    if (stats.top_productos.length > 0) {
      doc.text('Top Productos', 15, doc.lastAutoTable.finalY + 15);
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Producto', 'Unidades']],
        body: stats.top_productos.map(p => [p.producto__nombre, p.total_vendido]),
        headStyles: { fillColor: [165, 214, 16] },
      });
    }
    doc.save(`Reporte_Baroja_${fecha}.pdf`);
  };

  const handleNav = (t) => { setTab(t); setMenuOpen(false); };

  return (
    <div className="panel-root">
      <style>{CSS}</style>
      <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>

      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/ies_pio_baroja_logo.jpg" alt="Logo" />
          <p style={{ fontWeight: 800, fontSize: '10px' }}>PANEL EMPLEADO</p>
        </div>
        <nav className="nav-menu">
          {[
            { id: 'tablero',  icon: 'dashboard',        label: 'INICIO / TABLERO' },
            { id: 'pedidos',  icon: 'receipt_long',      label: 'GESTOR DE PEDIDOS' },
            { id: 'menu',     icon: 'restaurant_menu',   label: 'ADMINISTRAR MENÚ' },
            { id: 'reportes', icon: 'bar_chart',         label: 'REPORTES' },
          ].map(({ id, icon, label }) => (
            <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => handleNav(id)}>
              <span className="material-symbols-outlined">{icon}</span> {label}
            </button>
          ))}
        </nav>
        <button className="btn-logout-sidebar" onClick={() => { logout(); navigate('/'); }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> CERRAR SESIÓN
        </button>
      </aside>

      <main className="main">
        <header className="header-panel"><h1>Panel de Control</h1></header>

        {/* Toast global */}
        {toast && (
          <div className={`toast toast-${toast.tipo}`}>{toast.msg}</div>
        )}

        {/* ── TABLERO ── */}
        {tab === 'tablero' && (
          <>
            <div className="tablero-top-row">
              <div className="stat-card">
                <p style={{ fontSize: '13px', color: '#888', fontWeight: 700 }}>Pedidos Abiertos</p>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>{pedidos.filter(p => p.estado !== 'entregado').length}</div>
              </div>
              <div className="stat-card">
                <p style={{ fontSize: '13px', color: '#888', fontWeight: 700 }}>Próxima Recogida</p>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--verde-oscuro)' }}>{proximaRecogida}</div>
                <p style={{ fontSize: '11px', color: '#bbb', marginTop: 4 }}>
                  {colaFinal.filter(p => p.hora_recogida === proximaRecogida).length} pedido(s)
                </p>
              </div>
              <div className="scanner-box">
                <div className="qr-aim"></div>
                <p style={{ fontSize: '12px' }}>Escaneando QR...</p>
              </div>
            </div>

            <div className="tablero-bottom-row">
              {/* Cola de recogida */}
              <div className="card-white table-responsive">
                <h3 className="section-title" style={{ fontSize: '0.9rem', borderLeft: '4px solid var(--verde-lima)', paddingLeft: '10px' }}>
                  COLA DE RECOGIDA
                </h3>
                <table className="gestion-table">
                  <thead>
                    <tr><th>Alumno</th><th>Hora</th><th>Estado</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {colaFinal.length > 0 ? colaFinal.map(p => {
                      let urgente = false;
                      if (p.hora_recogida) {
                        const [hh, mm] = p.hora_recogida.split(':').map(Number);
                        const ahora = new Date();
                        const diffMin = (hh * 60 + mm) - (ahora.getHours() * 60 + ahora.getMinutes());
                        urgente = diffMin >= 0 && diffMin <= 10;
                      }
                      return (
                        <tr key={p.id}>
                          <td><strong>{p.nombre_usuario || 'Alumno'}</strong></td>
                          <td>
                            {p.hora_recogida
                              ? <span className={`hora-pill ${urgente ? 'urgente' : ''}`}>{urgente && '⚡ '}{p.hora_recogida}</span>
                              : <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>}
                          </td>
                          <td><span className="status-pill pagado">PAGADO</span></td>
                          <td>
                            <button className="btn-action" onClick={() => marcarEntregado(p.id)}>ENTREGAR</button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Sin pedidos por entregar</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Validación manual */}
              <div className="card-white">
                <h3 className="section-title" style={{ fontSize: '0.9rem', borderLeft: '4px solid var(--verde-lima)', paddingLeft: '10px' }}>
                  VALIDACIÓN MANUAL
                </h3>
                <input
                  type="text"
                  style={{ width: '100%', textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, border: '2px solid var(--verde-oscuro)', padding: '15px', borderRadius: '12px', background: '#f9f9f9', color: 'var(--verde-oscuro)' }}
                  value={qrCodigo}
                  readOnly
                  placeholder="CÓDIGO O ID"
                />
                <button
                  className="btn-save-menu"
                  style={{ height: '50px', fontSize: '1rem', marginTop: '12px' }}
                  onClick={handleValidarQR}
                >
                  VALIDAR AHORA
                </button>
                <div className="keyboard">
                  {KEYS.map(k => (
                    <div
                      key={k}
                      className="key"
                      style={{ padding: '15px 5px', background: k === '⌫' ? '#fee2e2' : '#f4f4f4', color: k === '⌫' ? '#ef4444' : 'inherit' }}
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

        {/* ── GESTOR DE PEDIDOS ── */}
        {tab === 'pedidos' && (
          <div className="card-white table-responsive">
            <h2 className="section-title">Historial de Pedidos</h2>
            <table className="gestion-table">
              <thead>
                <tr><th>ID</th><th>Alumno</th><th>Código QR</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.nombre_usuario || '—'}</td>
                    <td><strong>{p.codigo_qr || '—'}</strong></td>
                    <td style={{ fontWeight: 'bold' }}>{parseFloat(p.total || 0).toFixed(2)}€</td>
                    <td><span className="status-pill pagado">{p.estado?.toUpperCase()}</span></td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      {p.estado === 'pagado' && (
                        <button className="btn-action" style={{ color: 'var(--verde-oscuro)' }}
                          onClick={() => marcarEntregado(p.id)}>
                          Entregar
                        </button>
                      )}
                      {p.codigo_qr && p.estado !== 'entregado' && (
                        <button className="btn-action"
                          onClick={async () => {
                            try {
                              const res = await api.validarQR(p.codigo_qr);
                              mostrarToast('ok', res.mensaje || 'Entregado');
                              cargarDatos();
                            } catch (err) {
                              mostrarToast('err', err?.data?.error || 'Error al validar QR');
                            }
                          }}>
                          Validar QR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ADMINISTRAR MENÚ ── */}
        {tab === 'menu' && (
          <div className="menu-layout-grid">
            <div className="menu-grid">
              {productos.map(prod => (
                <div className="menu-item-card" key={prod.id}>
                  <div className="menu-item-img">
                    {prod.imagen_url
                      ? <img src={prod.imagen_url} alt={prod.nombre} />
                      : <div style={{ padding: '20px', color: '#ccc' }}>Sin imagen</div>}
                  </div>
                  <div className="menu-item-body">
                    <p style={{ fontWeight: 700 }}>{prod.nombre}</p>
                    <p style={{ fontWeight: 800, color: 'var(--verde-oscuro)' }}>{parseFloat(prod.precio).toFixed(2)}€</p>
                    <p style={{ fontSize: '11px', color: prod.disponible ? '#065f46' : '#991b1b', marginTop: 4 }}>
                      {prod.disponible ? '● Disponible' : '● No disponible'}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button className="btn-action" style={{ flex: 1, color: 'var(--verde-oscuro)' }}
                        onClick={() => abrirEdicion(prod)}>
                        Editar
                      </button>
                      <button className="btn-action" style={{ flex: 1, color: 'var(--rojo)' }}
                        onClick={() => eliminarProducto(prod.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario nuevo producto */}
            <aside className="card-white">
              <h3 className="section-title" style={{ fontSize: '1rem' }}>NUEVO PRODUCTO</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                btn.disabled = true; btn.innerText = 'ENVIANDO...';
                const formData = new FormData(e.target);
                try {
                  await api.crearProducto(formData);
                  e.target.reset();
                  cargarDatos();
                  mostrarToast('ok', 'Producto añadido correctamente');
                } catch {
                  mostrarToast('err', 'Error al conectar con el servidor');
                } finally {
                  btn.disabled = false; btn.innerText = 'AÑADIR AL MENÚ';
                }
              }}>
                <input name="nombre" placeholder="Nombre" required
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'DM Sans, sans-serif' }} />
                <input name="precio" type="number" step="0.01" placeholder="Precio" required
                  style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'DM Sans, sans-serif' }} />
                <input name="imagen" type="file" accept="image/*" style={{ marginBottom: '10px' }} />
                <button type="submit" className="btn-save-menu">AÑADIR AL MENÚ</button>
              </form>
            </aside>
          </div>
        )}

        {/* ── REPORTES / ESTADÍSTICAS ── */}
        {tab === 'reportes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Reportes y Análisis</h1>
              <button onClick={descargarPDF} className="btn-action"
                style={{ background: 'var(--verde-oscuro)', color: 'white', padding: '10px 18px' }}>
                EXPORTAR PDF
              </button>
            </div>

            {/* Filtro por fechas */}
            <div className="card-white">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                FILTRAR POR FECHAS
              </h3>
              <div className="filtro-fechas">
                <div>
                  <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Desde</label>
                  <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Hasta</label>
                  <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>
                <button className="btn-filtrar" style={{ marginTop: '18px' }}
                  onClick={() => cargarEstadisticas(fechaInicio || null, fechaFin || null)}>
                  Aplicar filtro
                </button>
                <button className="btn-limpiar" style={{ marginTop: '18px' }}
                  onClick={() => { setFechaInicio(''); setFechaFin(''); cargarEstadisticas(); }}>
                  Limpiar
                </button>
              </div>
            </div>

            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>Cargando estadísticas...</div>
            ) : stats ? (
              <>
                {/* Resumen */}
                <div className="card-white" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', textAlign: 'center', gap: '10px' }}>
                  {[
                    { label: 'VENTAS', valor: `${stats.resumen.total_ventas.toFixed(2)}€` },
                    { label: 'PEDIDOS', valor: stats.resumen.total_pedidos },
                    { label: 'TICKET MEDIO', valor: `${stats.resumen.ticket_medio.toFixed(2)}€` },
                    { label: 'PRODUCTOS', valor: stats.resumen.total_productos },
                  ].map(({ label, valor }) => (
                    <div key={label}>
                      <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '4px' }}>{label}</p>
                      <strong style={{ fontSize: '1.2rem' }}>{valor}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Top productos */}
                  <div className="card-white">
                    <h3 className="section-title" style={{ fontSize: '0.9rem' }}>Top Productos</h3>
                    {stats.top_productos.length === 0
                      ? <p style={{ color: '#bbb', fontSize: '14px' }}>Sin datos en este período</p>
                      : stats.top_productos.map((p, i) => {
                          const max = stats.top_productos[0]?.total_vendido || 1;
                          return (
                            <div key={i} className="ranking-row">
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.producto__nombre}</div>
                                <div className="ranking-bar-bg">
                                  <div className="ranking-bar-fill" style={{ width: `${(p.total_vendido / max) * 100}%` }} />
                                </div>
                              </div>
                              <div style={{ fontWeight: 800 }}>{p.total_vendido}</div>
                            </div>
                          );
                        })}
                  </div>

                  {/* Pedidos por estado */}
                  <div className="card-white">
                    <h3 className="section-title" style={{ fontSize: '0.9rem' }}>Pedidos por Estado</h3>
                    <table className="gestion-table">
                      <tbody>
                        {stats.pedidos_por_estado.map(({ estado, cantidad }) => (
                          <tr key={estado}>
                            <td style={{ textTransform: 'capitalize' }}>{estado}</td>
                            <td style={{ fontWeight: 700 }}>{cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ingresos diarios */}
                {stats.ingresos_diarios.length > 0 && (
                  <div className="card-white">
                    <h3 className="section-title" style={{ fontSize: '0.9rem' }}>Ingresos Diarios</h3>
                    <table className="gestion-table">
                      <thead>
                        <tr><th>Fecha</th><th>Pedidos</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {stats.ingresos_diarios.map(row => (
                          <tr key={row.dia}>
                            <td>{new Date(row.dia).toLocaleDateString('es-ES')}</td>
                            <td>{row.pedidos}</td>
                            <td style={{ fontWeight: 700 }}>{parseFloat(row.total).toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
                No hay datos disponibles. Aplica un filtro o espera a tener pedidos.
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal editar producto ── */}
      {productoEditando && (
        <div className="modal-overlay" onClick={() => setProductoEditando(null)}>
          <div className="modal-edit" onClick={e => e.stopPropagation()}>
            <h3>EDITAR PRODUCTO</h3>
            <div className="edit-field">
              <label>Nombre</label>
              <input value={editForm.nombre}
                onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
            </div>
            <div className="edit-field">
              <label>Precio (€)</label>
              <input type="number" step="0.01" value={editForm.precio}
                onChange={e => setEditForm({ ...editForm, precio: e.target.value })} />
            </div>
            <div className="edit-field" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="disp" checked={editForm.disponible}
                onChange={e => setEditForm({ ...editForm, disponible: e.target.checked })} />
              <label htmlFor="disp" style={{ fontSize: '14px', color: '#555', textTransform: 'none', letterSpacing: 0 }}>
                Producto disponible
              </label>
            </div>
            <div className="edit-actions">
              <button className="btn-cancelar" onClick={() => setProductoEditando(null)}>Cancelar</button>
              <button className="btn-guardar" onClick={guardarEdicion}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
