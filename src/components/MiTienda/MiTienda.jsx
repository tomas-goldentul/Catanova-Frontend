import './MiTienda.css';
import Navbar from '../Navbar/Navbar';
import StoreHeader from '../StoreHeader/StoreHeader';
import DashboardCard from '../DashboardCard/DashboardCard';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';

const IconProductos = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const IconVentas = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconEstadisticas = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const IconEnvios = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconPromociones = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconFotos = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const cards = [
  {
    icon: <IconProductos />,
    title: "Mis productos",
    description: "Gestioná tu inventario, precios y disponibilidad de prendas.",
    accentBg: "#eff6ff",
    accentColor: "#1d4ed8"
  },
  {
    icon: <IconVentas />,
    title: "Ventas",
    description: "Visualizá y administrá todos tus pedidos y transacciones.",
    accentBg: "#ecfdf5",
    accentColor: "#059669"
  },
  {
    icon: <IconEstadisticas />,
    title: "Estadísticas",
    description: "Analizá el rendimiento de tu negocio con métricas en tiempo real.",
    accentBg: "#e0f2fe",
    accentColor: "#0369a1"
  },
  {
    icon: <IconEnvios />,
    title: "Envíos",
    description: "Controlá el estado y la logística de todos tus pedidos.",
    accentBg: "#f0fdf4",
    accentColor: "#16a34a"
  },
  {
    icon: <IconPromociones />,
    title: "Promociones",
    description: "Creá descuentos y ofertas especiales para potenciar tus ventas.",
    accentBg: "#eff6ff",
    accentColor: "#2563eb"
  },
  {
    icon: <IconFotos />,
    title: "Fotos de calidad",
    description: "Mejorá las imágenes de tus productos para atraer más clientes.",
    accentBg: "#ecfdf5",
    accentColor: "#00a884"
  }
];

function MiTienda() {
  return (
    <>
      <Navbar />
      <main className="menu-main">
        <StoreHeader />
        <div className="menu-section-header">
          <span className="menu-section-label">Herramientas</span>
          <p className="menu-section-subtitle">Accedé rápidamente a todas las funciones de tu negocio</p>
        </div>
        <div className="menu-grid">
          {cards.map((card, index) => (
            <DashboardCard key={index} {...card} />
          ))}
        </div>
      </main>
      <Footer />
      <BurbujaChatanova />
    </>
  );
}

export default MiTienda;
