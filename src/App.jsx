import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import MainPanel from './components/MainPanel';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import ServiceHistory from './components/ServiceHistory';
import Expenses from './components/Expenses';
import './App.css';
import { supabase } from './supabaseClient';
import { useAtom } from 'jotai';
import { clientsAtom, inventoryItemsAtom, servicesAtom, motorcyclesAtom, expensesAtom } from './atoms';
import { fetchClients } from './supabaseService';
import { fetchInventory } from './supabaseService';
import { fetchServices } from './supabaseService';
import { fetchExpenses } from './supabaseService';
import Loading from './components/Loading';

// Import icons from react-icons
import { FaHome, FaUsers, FaBoxes, FaHistory, FaCoins, FaSignOutAlt } from 'react-icons/fa';


function App() {
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Jotai atoms
  const [, setClients] = useAtom(clientsAtom);
  const [, setInventoryItems] = useAtom(inventoryItemsAtom);
  const [, setServices] = useAtom(servicesAtom);
  const [, setMotorcycles] = useAtom(motorcyclesAtom);
  const [, setExpenses] = useAtom(expensesAtom);


  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    }
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("onAuthStateChange:", _event, session); // Debugging log
      setSession(session);
      setLoading(false); // Set loading to false here after session update
    });

    return () => {
        authListener?.subscription?.unsubscribe();
    };
  }, []);

    // Preload data on app load
    useEffect(() => {
        const preloadData = async () => {
            if (session) { // Only fetch if user is logged in
                try {
                    setLoading(true);
                    const clientsData = await fetchClients({ key: 'updated_at', direction: 'descending' });
                    setClients(clientsData);

                    // Extract and set motorcycles
                    const allMotorcycles = clientsData.reduce((acc, client) => {
                        return acc.concat(client.motorcycles.map(m => ({ ...m, client_id: client.id })));
                    }, []);
                    setMotorcycles(allMotorcycles);


                    const inventoryData = await fetchInventory({ key: 'updated_at', direction: 'descending' });
                    setInventoryItems(inventoryData);

                    const servicesData = await fetchServices({ key: 'date', direction: 'descending' });
                    setServices(servicesData);

                    const expensesData = await fetchExpenses({ key: 'date', direction: 'descending' });
                    setExpenses(expensesData);

                } catch (error) {
                    console.error("Error preloading data:", error);
                    // Handle error appropriately (e.g., show error message to user)
                } finally {
                    setLoading(false);
                }
            }
        };

        preloadData();
    }, [session, setClients, setInventoryItems, setServices, setExpenses, setMotorcycles]);


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
    setLoading(true); // Start loading
    console.log("handleLogout called"); // Debugging log
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setLoading(false); // Stop loading if error
    }
    // No need to setSession or setLoading here; onAuthStateChange handles it
  }


  if (loading) {
    return (
      <div className="app-container bg-street-gradient flex justify-center items-center h-screen">
        <Loading message="Cargando la aplicación..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-container bg-stylized-stripes animate-background-pan flex justify-center items-center h-screen">
        <div className="card bg-dark-secondary bg-opacity-90 backdrop-blur-md p-8 rounded-xl shadow-lg border border-accent-premium w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="header-title text-3xl font-bold tracking-tight">
              <span style={{color: '#FFFFFF'}}>Mi</span>
              <span style={{
                background: 'linear-gradient(90deg, #86EFAC, #4ade80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}> Taller</span>
            </h1>
            <p className="subheader-text text-base font-body mt-2" style={{ color: '#FFFFFF' }}>Administra tu taller de motos con facilidad</p>
          </div>
          {isSignUp ? (
            <div>
              <input
                className="shadow appearance-none border border-gray-700 rounded-md w-full py-2 px-3 input-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-3"
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded-md w-full py-2 px-3 input-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-3"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded-md w-full py-2 px-3 input-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-5"
                type="password"
                placeholder="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button onClick={handleSignUp} className="w-full bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-4 rounded-md shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                Registrarse
              </button>
              <div className="mt-4 text-center">
                <button onClick={() => setIsSignUp(false)} className="text-sm text-highlight-premium hover:text-light-primary font-semibold transition-colors duration-200 font-body">
                  ¿Ya tienes una cuenta? <span className="font-bold text-accent-premium hover:text-success-premium transition-colors duration-200">Iniciar Sesión</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                className="shadow appearance-none border border-gray-700 rounded-md w-full py-2 px-3 input-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-3"
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="shadow appearance-none border border-gray-700 rounded-md w-full py-2 px-3 input-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans mb-5"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleLogin} className="w-full bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-4 rounded-md shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                Iniciar Sesión
              </button>
              <div className="mt-4 text-center">
                <button onClick={() => setIsSignUp(true)} className="text-sm text-highlight-premium hover:text-light-primary font-semibold transition-colors duration-200 font-body">
                  ¿No tienes una cuenta? <span className="font-bold hover:text-success-premium transition-colors duration-200" style={{ color: '#86EFAC' }}>Regístrate</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 animate-gradient-move">
      <div className="content">
        <Routes>
          <Route path="/" element={<MainPanel  onLogout={handleLogout} />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/services" element={<ServiceHistory />} />
          <Route path="/expenses" element={<Expenses />} />
        </Routes>
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FaHome className="nav-icon" />
          <span className="nav-label">Inicio</span>
        </NavLink>
        <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FaUsers className="nav-icon" />
          <span className="nav-label">Clientes</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FaBoxes className="nav-icon" />
          <span className="nav-label">Inventario</span>
        </NavLink>
        <NavLink to="/services" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FaHistory className="nav-icon" />
          <span className="nav-label">Servicios</span>
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FaCoins className="nav-icon" />
          <span className="nav-label">Gastos</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default App;
