import React, { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { clientsAtom } from '../atoms';
import {
  fetchClients,
  updateClient,
  insertClient,
  deleteClientAndMotorcycles,
  updateMotorcycle,
  insertMotorcycle,
  deleteMotorcycle
} from '../supabaseService';

const Clients = () => {
  const [clients, setClients] = useAtom(clientsAtom);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clientFormData, setClientFormData] = useState({ name: '', contact: '' });
  const [motorcycleFormData, setMotorcycleFormData] = useState({ make: '', model: '', plate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use useCallback to memoize loadClients, preventing unnecessary re-renders/re-fetches
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const clientsData = await fetchClients(sortConfig);
      setClients(clientsData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sortConfig, setClients]); // Dependencies for useCallback

  useEffect(() => {
    // Fetch clients only on component mount and when sortConfig changes
    loadClients();
  }, [loadClients]); // Use memoized loadClients in useEffect dependency array

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
    if (!clientFormData.name || !clientFormData.contact) {
      alert('Por favor, completa todos los campos obligatorios del cliente.');
      return;
    }

    setLoading(true);
    try {
      if (currentClient) {
        await updateClient(currentClient.id, { name: clientFormData.name, contact: clientFormData.contact });
        setClients(prevClients =>
          prevClients.map(client =>
            client.id === currentClient.id ? { ...client, ...clientFormData } : client
          )
        );
      } else {
        await insertClient({ name: clientFormData.name, contact: clientFormData.contact });
        setClients(prevClients => [...prevClients, { ...clientFormData, id: Date.now() }]);
      }

      setIsClientModalOpen(false);
      setClientFormData({ name: '', contact: '' });
      // Removed loadClients here to prevent refetch after modal submit
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadClients(); // Re-fetch clients after modal submit to get latest data from DB
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
    if (!motorcycleFormData.make || !motorcycleFormData.model) {
      alert('Por favor, completa todos los campos obligatorios de la moto.');
      return;
    }

    setLoading(true);
    try {
      if (motorcycleFormData.id) {
        await updateMotorcycle(motorcycleFormData.id, {
          make: motorcycleFormData.make,
          model: motorcycleFormData.model,
          plate: motorcycleFormData.plate,
        });
        setClients(prevClients =>
          prevClients.map(client => {
            if (client.id === currentClient.id) {
              return {
                ...client,
                motorcycles: client.motorcycles.map(moto =>
                  moto.id === motorcycleFormData.id ? { ...moto, ...motorcycleFormData } : moto
                ),
              };
            }
            return client;
          })
        );
      } else {
        await insertMotorcycle(currentClient.id, {
          make: motorcycleFormData.make,
          model: motorcycleFormData.model,
          plate: motorcycleFormData.plate,
        });
        setClients(prevClients =>
          prevClients.map(client => {
            if (client.id === currentClient.id) {
              return {
                ...client,
                motorcycles: [...client.motorcycles, { ...motorcycleFormData, id: Date.now() }],
              };
            }
            return client;
          })
        );
      }

      setIsMotorcycleModalOpen(false);
      setMotorcycleFormData({ make: '', model: '', plate: '' });
      // Removed loadClients here to prevent refetch after modal submit
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadClients(); // Re-fetch clients after modal submit to get latest data from DB
    }
  };

  const deleteClient = async (clientId) => {
    setLoading(true);
    try {
      await deleteClientAndMotorcycles(clientId);
      setClients(prevClients => prevClients.filter(client => client.id !== clientId));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadClients(); // Re-fetch clients after delete to get latest data from DB
    }
  };

  const deleteMotorcycle = async (motorcycleId) => {
    setLoading(true);
    try {
      await deleteMotorcycle(motorcycleId);
      setClients(prevClients =>
        prevClients.map(client => ({
          ...client,
          motorcycles: client.motorcycles.filter(moto => moto.id !== motorcycleId),
        }))
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      loadClients(); // Re-fetch clients after delete to get latest data from DB
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
    // loadClients will be called automatically due to the useEffect dependency
  };

  const sortedAndFilteredClients = React.useMemo(() => {
    if (!clients) return [];
    let filteredClients = [...clients];

    if (searchTerm) {
      filteredClients = filteredClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.motorcycles && client.motorcycles.some(moto =>
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
    // Removed "Cargando clientes..." message
    // return <p className="text-light-text">Cargando clientes...</p>;
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
