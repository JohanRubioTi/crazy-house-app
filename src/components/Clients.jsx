import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clientFormData, setClientFormData] = useState({ name: '', contact: '' });
  const [motorcycleFormData, setMotorcycleFormData] = useState({ make: '', model: '', plate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // Store the user object

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          setError(error);
        } else {
          setUser(user);
        }
      } catch (err) {
        setError(err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user) { // Only fetch clients after user is loaded
      fetchClients();
    }
  }, [user, sortConfig]); // Depend on user and sortConfig

  const fetchClients = async () => {
    if (!user) return; // Don't fetch if user is not loaded

    setLoading(true);
    setError(null);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id, name, contact, updated_at,
          motorcycles (
            id, make, model, plate, updated_at
          )
        `)
        .eq('user_id', user.id) // Filter by user_id
        .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending', foreignTable: sortConfig.key === 'motorcycles.updated_at' ? 'motorcycles' : undefined });

      if (clientsError) {
        setError(clientsError);
      } else {
        setClients(clientsData || []);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addClient = () => {
    setClientFormData({ name: '', contact: '' });
    setCurrentClient(null);
    setIsClientModalOpen(true);
  };

  const editClient = (client) => {
    setClientFormData({ name: client.name, contact: client.contact });
    setCurrentClient(client);
    setIsClientModalOpen(true);
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    if (!user) return; // Don't proceed if user is not loaded
    if (!clientFormData.name || !clientFormData.contact) {
      alert('Por favor, completa todos los campos obligatorios del cliente.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (currentClient) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ name: clientFormData.name, contact: clientFormData.contact, updated_at: new Date() })
          .eq('id', currentClient.id)
          .eq('user_id', user.id); // Ensure user owns the client

        if (updateError) {
          setError(updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from('clients')
          .insert([{ name: clientFormData.name, contact: clientFormData.contact, user_id: user.id }]); // Add user_id

        if (insertError) {
          setError(insertError);
        }
      }

      setIsClientModalOpen(false);
      setClientFormData({ name: '', contact: '' });
      fetchClients();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const addMotorcycle = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setMotorcycleFormData({ make: '', model: '', plate: '' });
    setCurrentClient(client);
    setIsMotorcycleModalOpen(true);
  };

  const editMotorcycle = (client, motorcycle) => {
    setCurrentClient(client);
    setMotorcycleFormData({ ...motorcycle });
    setIsMotorcycleModalOpen(true);
  };

  const handleMotorcycleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return; // Don't proceed if user is not loaded
    if (!motorcycleFormData.make || !motorcycleFormData.model) {
      alert('Por favor, completa todos los campos obligatorios de la moto.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (motorcycleFormData.id) {
        const { error: updateError } = await supabase
          .from('motorcycles')
          .update({ make: motorcycleFormData.make, model: motorcycleFormData.model, plate: motorcycleFormData.plate, updated_at: new Date() })
          .eq('id', motorcycleFormData.id)
          .eq('user_id', user.id); // Ensure user owns the motorcycle

        if (updateError) {
          setError(updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from('motorcycles')
          .insert([{
            client_id: currentClient.id,
            make: motorcycleFormData.make,
            model: motorcycleFormData.model,
            plate: motorcycleFormData.plate,
            user_id: user.id, // Add user_id
          }]);

        if (insertError) {
          setError(insertError);
        }
      }

      setIsMotorcycleModalOpen(false);
      setMotorcycleFormData({ make: '', model: '', plate: '' });
      fetchClients();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (clientId) => {
    if (!user) return; // Don't proceed if user is not loaded
    try {
      setLoading(true);
      setError(null);

      // First, delete associated motorcycles
      const { error: deleteMotorcyclesError } = await supabase
        .from('motorcycles')
        .delete()
        .eq('client_id', clientId)
        .eq('user_id', user.id); // Ensure user owns the motorcycles

      if (deleteMotorcyclesError) {
        setError(deleteMotorcyclesError);
        return; // Stop if there's an error deleting motorcycles
      }

      // Then, delete the client
      const { error: deleteClientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id); // Ensure user owns the client

      if (deleteClientError) {
        setError(deleteClientError);
      } else {
        setClients(clients.filter(client => client.id !== clientId));
        fetchClients(); // Refetch after successful deletion
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMotorcycle = async (motorcycleId) => {
    if (!user) return; // Don't proceed if user is not loaded
    try {
      setLoading(true);
      setError(null);
      const { error: deleteError } = await supabase
        .from('motorcycles')
        .delete()
        .eq('id', motorcycleId)
        .eq('user_id', user.id); // Ensure user owns the motorcycle

      if (deleteError) {
        setError(deleteError);
      }
      fetchClients(); // Refetch after successful deletion
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredClients = React.useMemo(() => {
    if (!clients) return []; // Return empty array if clients is null/undefined
    let filteredClients = [...clients];

    if (searchTerm) {
      filteredClients = filteredClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.motorcycles && client.motorcycles.some(moto => // Check if motorcycles exists
          moto.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moto.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (moto.plate && moto.plate.toLowerCase().includes(searchTerm.toLowerCase()))
        ))
      );
    }

    let sortedClients = [...filteredClients];

    if (sortConfig.key) {
      sortedClients.sort((a, b) => {
        const isForeignTable = sortConfig.key.includes('.');
        const [tableName, fieldName] = isForeignTable ? sortConfig.key.split('.') : [null, sortConfig.key];

        if (sortConfig.key === 'updated_at') {
          return sortConfig.direction === 'ascending'
            ? new Date(a.updated_at) - new Date(b.updated_at)
            : new Date(b.updated_at) - new Date(a.updated_at);
        }

        if (isForeignTable && tableName === 'motorcycles') {
          // Handle sorting by motorcycle fields (assuming you want to sort by the *first* motorcycle)
          const aValue = a.motorcycles && a.motorcycles.length > 0 ? a.motorcycles[0][fieldName] : '';
          const bValue = b.motorcycles && b.motorcycles.length > 0 ? b.motorcycles[0][fieldName] : '';

          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }

        const keyA = a[sortConfig.key] || '';
        const keyB = b[sortConfig.key] || '';

        if (keyA < keyB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (keyA > keyB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedClients;
  }, [clients, searchTerm, sortConfig]);

  if (loading) {
    return <p className="text-light-text">Cargando clientes...</p>;
  }

  if (error) {
    return <p className="text-light-text">Error: {error.message}</p>;
  }

  return (
    <div className="clients p-4 bg-street-gradient">
      <h1 className="text-2xl font-bold text-primary mb-4 font-graffiti">Clientes</h1>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 mb-4 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
      />

      <div className="mb-4">
        <button onClick={() => requestSort('name')} className="mr-2 bg-accent hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full font-sans">
          Ordenar por Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </button>
        <button onClick={() => requestSort('updated_at')} className="bg-accent hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full font-sans">
          Ordenar por Reciente {sortConfig.key === 'updated_at' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </button>
      </div>

      <button onClick={addClient} className="bg-secondary hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full mb-4 font-sans">Agregar Cliente</button>

      <ul>
        {sortedAndFilteredClients.map(client => (
          <li key={client.id} className="mb-6 border-b border-gray-700 pb-4 bg-transparent-black bg-opacity-70 backdrop-blur-sm p-5 rounded-lg shadow-md-dark border border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl text-light-text font-sans">{client.name}</h2>
                <p className="text-gray-400 font-sans">{client.contact}</p>
              </div>
              <div>
                <button onClick={() => editClient(client)} className="bg-secondary hover:bg-light-accent text-dark-bg px-3 py-1 rounded-full mr-2 font-sans">Editar</button>
                <button onClick={() => deleteClient(client.id)} className="bg-primary hover:bg-light-accent text-light-text px-3 py-1 rounded-full mr-2 font-sans">Eliminar</button>
                <button onClick={() => addMotorcycle(client.id)} className="bg-secondary hover:bg-light-accent text-dark-bg px-3 py-1 rounded-full font-sans">Agregar Moto</button>
              </div>
            </div>
            {client.motorcycles && client.motorcycles.length > 0 && (
              <ul className="mt-2">
                {client.motorcycles.map(motorcycle => (
                  <li key={motorcycle.id} className="flex justify-between items-center mt-2">
                    <div className="font-sans">{motorcycle.make} {motorcycle.model} {motorcycle.plate && `(${motorcycle.plate})`}</div>
                    <div>
                      <button onClick={() => editMotorcycle(client, motorcycle)} className="bg-secondary hover:bg-light-accent text-dark-bg px-2 py-1 rounded-full mr-2 text-xs font-sans">Editar</button>
                      <button onClick={() => deleteMotorcycle(motorcycle.id)} className="bg-primary hover:bg-light-accent text-light-text px-2 py-1 rounded-full text-xs font-sans">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-transparent-black bg-opacity-90 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-md border border-accent">
            <h2 className="text-xl font-bold text-primary mb-4 font-graffiti">{currentClient ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
            <form onSubmit={handleClientSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg text-light-text font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="contact">Teléfono:</label>
                <input
                  type="text"
                  id="contact"
                  value={clientFormData.contact}
                  onChange={(e) => setClientFormData({ ...clientFormData, contact: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg text-light-text font-sans"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-secondary hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full mr-2 font-sans">Guardar</button>
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="bg-accent hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full font-sans">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Motorcycle Modal */}
      {isMotorcycleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-transparent-black bg-opacity-90 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-md border border-accent">
            <h2 className="text-xl font-bold text-primary mb-4 font-graffiti">{motorcycleFormData.id ? 'Editar Moto' : 'Agregar Moto'}</h2>
            <form onSubmit={handleMotorcycleSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="make">Marca:</label>
                <input
                  type="text"
                  id="make"
                  value={motorcycleFormData.make}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, make: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg text-light-text font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="model">Modelo:</label>
                <input
                  type="text"
                  id="model"
                  value={motorcycleFormData.model}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, model: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg text-light-text font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="plate">Placa:</label>
                <input
                  type="text"
                  id="plate"
                  value={motorcycleFormData.plate}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, plate: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg text-light-text font-sans"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-secondary hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full mr-2 font-sans">Guardar</button>
                <button type="button" onClick={() => setIsMotorcycleModalOpen(false)} className="bg-accent hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full font-sans">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
