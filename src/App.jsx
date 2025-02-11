import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import MainPanel from './components/MainPanel';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import ServiceHistory from './components/ServiceHistory';
import './App.css';

function App() {
  const location = useLocation();

  // Centralized Data (Simulating a Database)
  const [inventoryItems, setInventoryItems] = React.useState([
    { id: 1, name: 'Aceite 2T', quantity: 50, priceBought: 25000, priceSold: 35000, unitType: 'unidad', restockQuantity: 10, updatedAt: Date.now() },
    { id: 2, name: 'Filtro de aire', quantity: 20, priceBought: 10000, priceSold: 15000, unitType: 'unidad', restockQuantity: 5, updatedAt: Date.now() - 86400000 },
    { id: 3, name: 'Líquido de frenos', quantity: 30, priceBought: 12000, priceSold: 18000, unitType: 'litro', restockQuantity: 8, updatedAt: Date.now() - 172800000 },
  ]);

  const [expenses, setExpenses] = React.useState([
    { id: 1, description: 'Compra de repuestos', amount: 50000, date: Date.now() - 259200000, category: 'Repuestos', itemId: 1 }, // 3 days ago
    { id: 2, description: 'Gasolina', amount: 20000, date: Date.now() - 86400000, category: 'Combustible', itemId: null }, // 1 day ago
    { id: 3, description: "Pago arriendo", amount: 150000, date: Date.now(), category: 'Arriendo', itemId: null }
  ]);

  const [services, setServices] = React.useState([
    {
      id: 1,
      clientId: 1,
      motorcycleId: 1,
      date: Date.now() - 432000000, // 5 days ago
      laborCost: 60000,
      productsUsed: [{ productId: 1, quantity: 2, price: 35000 }],
      notes: 'Service mayor inicial',
      serviceType: 'Mayor',
      kilometers: 15000,
    },
    {
      id: 2,
      clientId: 2,
      motorcycleId: 2,
      date: Date.now() - 86400000, // 1 day ago
      laborCost: 35000,
      productsUsed: [{ productId: 2, quantity: 1, price: 15000 }],
      notes: 'Revision de frenos y filtro de aire',
      serviceType: 'Frenos',
      kilometers: 18700,
    },
  ]);


    // Callback function to update inventory items in App's state
    const handleInventoryUpdate = (updatedItems) => {
      setInventoryItems(updatedItems);
    };

    const handleExpenseUpdate = (updatedExpenses) => {
        setExpenses(updatedExpenses);
    };

    const handleServiceUpdate = (updatedServices) => {
        setServices(updatedServices);
    };

  return (
    <div className="app-container">
      <div className="content">
        <Routes>
          <Route path="/" element={<MainPanel items={inventoryItems} expenses={expenses} services={services} onUpdateExpenses={handleExpenseUpdate} />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/inventory" element={<Inventory onUpdateItems={handleInventoryUpdate} items={inventoryItems} />} />
          <Route path="/service-history" element={<ServiceHistory services={services} onUpdateServices={handleServiceUpdate} />} />
        </Routes>
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Inicio</span>
        </NavLink>
        <NavLink to="/clients" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span className="nav-label">Clientes</span>
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📦</span>
          <span className="nav-label">Inventario</span>
        </NavLink>
        <NavLink to="/service-history" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📜</span>
          <span className="nav-label">Historial</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default App;
