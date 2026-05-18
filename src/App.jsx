import './App.css';
import Navbar from './components/Navbar/Navbar';
import StoreHeader from './components/StoreHeader/StoreHeader';
import DashboardCard from './components/DashboardCard/DashboardCard';
import Footer from './components/Footer/Footer';

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

function App() {
  return (
    <div className="app-container">

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

      <div className="chat-bubble">
        C
      </div>

    </div>
  );
}

export default App;