import './MiTienda.css';
import Navbar from '../Navbar/Navbar';
import StoreHeader from '../StoreHeader/StoreHeader';
import DashboardCard from '../DashboardCard/DashboardCard';
import Footer from '../Footer/Footer';
import BurbujaChatanova from '../BurbujaChatanova/BurbujaChatanova';

const cards = [
  {
    icon: "📦",
    title: "Mis productos",
    description: "Gestioná tu inventario y productos fácilmente."
  },

  {
    icon: "🛍️",
    title: "Ventas",
    description: "Visualizá y gestioná todas tus ventas."
  },

  {
    icon: "📈",
    title: "Estadísticas",
    description: "Analizá el rendimiento de tu negocio."
  },

  {
    icon: "🚚",
    title: "Envíos",
    description: "Controlá el estado de todos tus pedidos."
  },

  {
    icon: "🎯",
    title: "Promociones",
    description: "Creá descuentos y ofertas para aumentar tus ventas."
  },

  {
    icon: "📸",
    title: "Fotos de calidad",
    description: "Mejorá las imágenes de tus productos para atraer clientes."
  }
];

function MiTienda() {
  return (
    <>
      <Navbar />

      <main className="main">
        <StoreHeader />

        <div className="grid-container">
          {cards.map((card, index) => (
            <DashboardCard
              key={index}
              {...card}
            />
          ))}
        </div>
      </main>

      <Footer />

      <BurbujaChatanova />
    </>
  );
}

export default MiTienda;
