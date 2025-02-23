import React, { useState, useEffect } from 'react';
    import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
    import MainPanel from './components/MainPanel';
    import Clients from './components/Clients';
    import Inventory from './components/Inventory';
    import ServiceHistory from './components/ServiceHistory';
    import Expenses from './components/Expenses'; // Import Expenses component
    import './App.css';
    import { supabase } from './supabaseClient';
    import { useAtom } from 'jotai';
    import { clientsAtom, inventoryItemsAtom, servicesAtom, motorcyclesAtom, expensesAtom } from './atoms';
    import { fetchClients } from './supabaseService';
    import { fetchInventory } from './supabaseService';
    import { fetchServices } from './supabaseService';
    import { fetchExpenses } from './supabaseService';

    // Import icons from react-icons
    import { FaHome, FaUsers, FaBoxes, FaHistory, FaCoins } from 'react-icons/fa';


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
      const [, setMotorcycles] = useAtom(motorcyclesAtom); // Use the motorcyclesAtom
      const [, setExpenses] = useAtom(expensesAtom);


      useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session)
          setLoading(false)
        })

        supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
        })
      }, [])

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
        }, [session, setClients, setInventoryItems, setServices, setExpenses, setMotorcycles]); // Add setMotorcycles to dependencies


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
                <div>
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
              ) : (
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
          <div> {/* Removed app-container class here */}
            <div className="content">
              <Routes>
                <Route path="/" element={<MainPanel onLogout={handleLogout} />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/service-history" element={<ServiceHistory />} />
                <Route path="/expenses" element={<Expenses />} /> {/* Add Expenses route */}
              </Routes>
            </div>
            <nav className="bottom-nav">
              <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><FaHome /></span>
                <span className="nav-label">Inicio</span>
              </NavLink>
              <NavLink to="/clients" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><FaUsers /></span>
                <span className="nav-label">Clientes</span>
              </NavLink>
              <NavLink to="/inventory" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><FaBoxes /></span>
                <span className="nav-label">Inventario</span>
              </NavLink>
              <NavLink to="/service-history" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><FaHistory /></span>
                <span className="nav-label">Historial</span>
              </NavLink>
              <NavLink to="/expenses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}> {/* Add Expenses navlink */}
                <span className="nav-icon"><FaCoins /></span>
                <span className="nav-label">Expenses</span>
              </NavLink>
            </nav>
          </div>
        );
      }
    }

    export default App;
