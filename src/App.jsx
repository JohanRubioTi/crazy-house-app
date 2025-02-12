import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import MainPanel from './components/MainPanel';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import ServiceHistory from './components/ServiceHistory';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New state for password confirmation
  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between Login and Register forms

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

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

  async function handleSignUp() {
    setLoading(true)
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Revisa tu correo electrónico para confirmación!');
    }
    setLoading(false)
  }

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    }

    setLoading(false)
  }

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }


  if (loading) {
    return (
      <div className="app-container bg-street-gradient flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-light-text font-sans">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-container bg-street-gradient flex justify-center items-center h-screen">
        <div className="card bg-transparent-black bg-opacity-70 backdrop-blur-sm p-6 rounded-lg shadow-md-dark border border-gray-700 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-primary mb-4 font-graffiti text-center">{isSignUp ? 'Regístrate' : 'Iniciar Sesión'}</h1>
          {isSignUp ? (
            <div> {/* Register Form */}
              <input
                className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-2"
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-2"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-4"
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button onClick={handleSignUp} className="bg-accent hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full font-sans focus:outline-none focus:shadow-outline w-full">
                Registrarse
              </button>
              <button onClick={() => setIsSignUp(false)} className="mt-2 text-secondary-text hover:text-light-text text-sm font-sans focus:outline-none focus:shadow-outline w-full block text-center">
                ¿Ya tienes una cuenta? Iniciar Sesión
              </button>
            </div>
          ) : ( // Login Form
            <div>
              <input
                className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-2"
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-4"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleLogin} className="bg-secondary hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full font-sans focus:outline-none focus:shadow-outline w-full">
                Iniciar Sesión
              </button>
              <button onClick={() => setIsSignUp(true)} className="mt-2 text-secondary-text hover:text-light-text text-sm font-sans focus:outline-none focus:shadow-outline w-full block text-center">
                ¿No tienes una cuenta? Regístrate
              </button>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="app-container">
        <div className="content">
          <Routes>
            <Route path="/" element={<MainPanel items={inventoryItems} expenses={expenses} services={services} onUpdateExpenses={handleExpenseUpdate} onLogout={handleLogout} />} />
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
}

export default App;
