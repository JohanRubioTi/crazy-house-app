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
import ConfirmationModal from './ConfirmationModal'; // Import confirmation modal
import AddClientModal from './AddClientModal'; // Import AddClientModal

const Clients = () => {
  const [clients, setClients] = useAtom(clientsAtom);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false); // State for client modal visibility
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clientFormData, setClientFormData] = useState({ name: '', contact: '' });
  const [motorcycleFormData, setMotorcycleFormData] = useState({ make: '', model: '', plate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedClientId, setExpandedClientId] = useState(null); // State for expanded client
  const [deleteConfirmation, setDeleteConfirmation] = useState({ // Confirmation modal state
    isOpen: false,
    itemId: null,
    itemType: null, // 'client' or 'motorcycle'
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track initial load


  // Use useCallback to memoize loadClients, preventing unnecessary re-renders/re-fetches
  const loadClients = useCallback(async () => {
    setLoading(true); // Set loading to true only when fetch is triggered
    try {
      const clientsData = await fetchClients(sortConfig);
      setClients(clientsData);
      setHasLoadedOnce(true); // Mark initial load as complete
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sortConfig, setClients]); // Dependencies for useCallback

  useEffect(() => {
    // Fetch clients only on component mount and when sortConfig changes
    // Check if data is already loaded to avoid redundant loading message
    if (!hasLoadedOnce && clients.length === 0) {
      loadClients();
    } else if (!hasLoadedOnce && clients.length > 0) {
      setHasLoadedOnce(true); // If data is in atom on mount, consider loaded
    }
  }, [loadClients, hasLoadedOnce, clients.length]); // Use memoized loadClients in useEffect dependency array


  const addClient = () => {
    setClientFormData({ name: '', contact: '' });
    setCurrentClient(null);
    setIsClientModalOpen(true); // Open client modal
  };

  const editClient = (client) => {
    setClientFormData({ name: client.name, contact: client.contact });
    setCurrentClient(client);
    setIsClientModalOpen(true); // Open client modal
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

      setIsClientModalOpen(false); // Close client modal after submit
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

  const confirmDeleteClient = (clientId) => {
    setDeleteConfirmation({
      isOpen: true,
      itemId: clientId,
      itemType: 'client',
    });
  };

  const confirmDeleteMotorcycle = (motorcycleId) => {
    setDeleteConfirmation({
      isOpen: true,
      itemId: motorcycleId,
      itemType: 'motorcycle',
    });
  };


  const deleteClient = async () => {
    const clientId = deleteConfirmation.itemId;
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal

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

  const deleteMotorcycle = async () => {
    const motorcycleId = deleteConfirmation.itemId;
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal
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

  const handleCancelDelete = () => {
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal
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

    const toggleClientExpansion = (clientId) => {
        setExpandedClientId(expandedClientId === clientId ? null : clientId);
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
    return <div className="text-center"><div className="spinner mb-4"></div></div>; // Removed "Cargando Clientes..." text
  }

  if (error) {
    return <p className="text-light-text">Error: {error.message}</p>;
  }

  return (
    <div className="clients p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
      <h1 className="text-3xl font-display text-light-primary mb-6 tracking-wide">Clientes</h1>

      <div className="mb-4 flex flex-wrap gap-2 justify-between items-center sm:flex-nowrap">
        <div className="flex flex-grow gap-2 mb-2 sm:mb-0">
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border border-gray-700 rounded-lg py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-primary font-body flex-grow"
          />
        </div>
        <button onClick={addClient} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap">
          Agregar Cliente
        </button>
      </div>

      {/* Expanded Client Motorcycles Section - Displayed above table when expanded */}
      {/* DESKTOP VIEW - ABOVE TABLE */}
      <div className="mt-6 sm:block hidden"> {/* Show only on desktop */}
      {expandedClientId && (
        <div>
          <h3 className="text-xl font-semibold text-light-primary font-display mb-4">Motos del Cliente</h3>
          {clients.find(c => c.id === expandedClientId)?.motorcycles && clients.find(c => c.id === expandedClientId)?.motorcycles.length > 0 ? (
            <div className="mb-6 bg-dark-secondary p-6 rounded-lg shadow-premium-md border border-accent-premium">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.find(c => c.id === expandedClientId).motorcycles.map(motorcycle => (
                  <div key={motorcycle.id} className="bg-dark-primary p-4 rounded-lg shadow-md border border-gray-700">
                    <p className="text-light-text font-body"><span className="font-semibold">Marca:</span> {motorcycle.make}</p>
                    <p className="text-light-text font-body"><span className="font-semibold">Modelo:</span> {motorcycle.model}</p>
                    <p className="text-light-text font-body"><span className="font-semibold">Placa:</span> {motorcycle.plate || 'N/A'}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => editMotorcycle(clients.find(c => c.id === expandedClientId), motorcycle)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar Moto</button>
                      <button onClick={() => confirmDeleteMotorcycle(motorcycle.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar Moto</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-light-primary font-body">No hay motos registradas para este cliente.</p>
          )}
        </div>
      )}
      </div>


      <div className="overflow-x-auto">
        <div className="sm:hidden">
          {sortedAndFilteredClients.map(client => (
            <div key={client.id} className="bg-dark-secondary rounded-lg shadow-premium-md border border-accent-premium mb-4 p-4">
              <h3 className="text-xl font-semibold text-light-primary font-display mb-2">{client.name}</h3>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Teléfono:</span> {client.contact}</p>
              <p className="text-light-primary font-body"><span className="font-semibold">Reciente:</span> {new Date(client.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              {expandedClientId === client.id && client.motorcycles && client.motorcycles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-light-primary font-display mb-2">Motos</h4>
                  {client.motorcycles.map(motorcycle => (
                    <div key={motorcycle.id} className="bg-dark-primary p-3 rounded-lg shadow-md border border-gray-700 mb-2">
                      <p className="text-light-text font-body"><span className="font-semibold">Marca:</span> {motorcycle.make}</p>
                      <p className="text-light-text font-body"><span className="font-semibold">Modelo:</span> {motorcycle.model}</p>
                      <p className="text-light-text font-body"><span className="font-semibold">Placa:</span> {motorcycle.plate || 'N/A'}</p>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editMotorcycle(client, motorcycle)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar Moto</button>
                        <button onClick={() => confirmDeleteMotorcycle(motorcycle.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar Moto</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => editClient(client)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                <button onClick={() => confirmDeleteClient(client.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                <button onClick={() => addMotorcycle(client.id)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Añadir Moto</button>
                <button
                  onClick={() => toggleClientExpansion(client.id)}
                  className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs"
                >
                  {expandedClientId === client.id ? 'Colapsar' : 'Expandir'}
                </button>
              </div>
            </div>
          ))}
          {sortedAndFilteredClients.length === 0 && <p className="text-light-primary text-center font-body">No hay clientes que mostrar.</p>}
        </div>

        <table className="min-w-full table-fixed bg-dark-secondary rounded-lg shadow-premium-md border-separate border-spacing-0 hidden sm:table">
          <thead className="bg-dark-secondary text-light-primary font-display sticky top-0">
            <tr className="rounded-t-lg">
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('name')} className="hover:text-highlight-premium focus:outline-none">
                  Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('contact')} className="hover:text-highlight-premium focus:outline-none">
                  Teléfono {sortConfig.key === 'contact' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('updated_at')} className="hover:text-highlight-premium focus:outline-none">
                  Reciente {sortConfig.key === 'updated_at' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-semibold border-b border-accent-premium rounded-tr-lg">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-dark-secondary font-body text-light-primary">
            {sortedAndFilteredClients.map(client => (
              <tr key={client.id} className="group hover:bg-dark-primary transition-colors duration-200">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{client.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{client.contact}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{new Date(client.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => editClient(client)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                    <button onClick={() => confirmDeleteClient(client.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                    <button onClick={() => addMotorcycle(client.id)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Añadir Moto</button>
                    <button
                      onClick={() => toggleClientExpansion(client.id)}
                      className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs"
                    >
                      {expandedClientId === client.id ? 'Colapsar' : 'Expandir'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-dark-secondary hidden sm:table-footer-group">
            <tr>
              <td colSpan="4" className="px-4 py-3 rounded-b-lg">
                {sortedAndFilteredClients.length === 0 && <p className="text-light-primary text-center font-body">No hay clientes que mostrar.</p>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>


      {/* Client Modal - Moved to AddClientModal.jsx */}
      <AddClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        currentClient={currentClient}
        clientFormData={clientFormData}
        setClientFormData={setClientFormData}
        handleClientSubmit={handleClientSubmit}
      />

      {/* Motorcycle Modal */}
      {isMotorcycleModalOpen && (
        <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm">
          <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium">
            <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{motorcycleFormData.id ? 'Editar Moto' : 'Agregar Moto'}</h2>
            <form onSubmit={handleMotorcycleSubmit} className="space-y-5">
              <div>
                <label htmlFor="make" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Marca</label>
                <input type="text" id="make" name="make" value={motorcycleFormData.make} onChange={e => setMotorcycleFormData({...motorcycleFormData, make: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="model" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Modelo</label>
                <input type="text" id="model" name="model" value={motorcycleFormData.model} onChange={e => setMotorcycleFormData({...motorcycleFormData, model: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="plate" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Placa</label>
                <input type="text" id="plate" name="plate" value={motorcycleFormData.plate} onChange={e => setMotorcycleFormData({...motorcycleFormData, plate: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
              </div>
              <div className="flex justify-between mt-6">
                <button type="submit" className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Guardar</button>
                <button type="button" onClick={() => setIsMotorcycleModalOpen(false)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={deleteConfirmation.itemType === 'client' ? deleteClient : deleteMotorcycle}
        title={`Eliminar ${deleteConfirmation.itemType === 'client' ? 'Cliente' : 'Moto'}`}
        message={`¿Estás seguro de que quieres eliminar este ${deleteConfirmation.itemType === 'client' ? 'cliente y todas sus motos' : 'moto'}?`}
      />
    </div>
  );
};

export default Clients;
