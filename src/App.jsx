import './App.css';
import Navbar from './components/Navbar/Navbar';
import StoreHeader from './components/StoreHeader/StoreHeader';
import DashboardCard from './components/DashboardCard/DashboardCard';
import Footer from './components/Footer/Footer';
import { BsBoxSeam } from "react-icons/bs";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { TbTruckDelivery } from "react-icons/tb";
import { IoStatsChartOutline } from "react-icons/io5";
import { MdLocalOffer } from "react-icons/md";
import { HiOutlineCamera } from "react-icons/hi";

const cards = [
  { icon: <BsBoxSeam />, title: "Mis productos", description: "Gestioná tu inventario y productos fácilmente." },
  { icon: <HiOutlineShoppingBag />, title: "Ventas", description: "Visualizá y gestioná todas tus ventas." },
  { icon: <IoStatsChartOutline />, title: "Estadísticas", description: "Analizá el rendimiento de tu negocio." },
  { icon: <TbTruckDelivery />, title: "Envíos", description: "Seguí todos los pedidos de tus productos." },
  { icon: <MdLocalOffer />, title: "Promociones", description: "Creá descuentos atractivos para tus clientes.", tip: true },
  { icon: <HiOutlineCamera />, title: "Fotos de calidad", description: "Subí fotos nítidas y atractivas de tus productos.", tip: true },
];

function App() {
  return (
    <div>
      <Navbar />
      <main className="main">
        <StoreHeader />
        <div className="section-label">Gestión de tienda</div>
        <div className="grid-container">
          {cards.map((card) => (
            <DashboardCard key={card.title} {...card} />
          ))}
        </div>
      </main>
      <Footer />
      <div className="chat-bubble">C</div>
    </div>
  );
}

export default App;