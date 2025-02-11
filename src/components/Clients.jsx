import React, { useState } from 'react';

const Clients = () => {
  const [clients, setClients] = useState([
    { id: 1, name: 'Juan Pérez', contact: '3101234567', motorcycles: [{ id: 1, make: 'Yamaha', model: 'R15', plate: 'ABC123' }], updatedAt: Date.now() },
    { id: 2, name: 'María López', contact: '3209876543', motorcycles: [{ id: 2, make: 'Honda', model: 'CBR250', plate: '' }], updatedAt: Date.now() - 86400000 }, // Yesterday
    { id: 3, name: 'Carlos Rodríguez', contact: '3154567890', motorcycles: [], updatedAt: Date.now() - 172800000 }, // 2 days ago
  ]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isMotorcycleModalOpen, setIsMotorcycleModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [clientFormData, setClientFormData] = useState({ name: '', contact: '' });
  const [motorcycleFormData, setMotorcycleFormData] = useState({ make: '', model: '', plate: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'descending' }); // Default sort by updatedAt descending

  const addClient = () => {
    setClientFormData({ name: '', contact: '' });
    setCurrentClient(null);
    setIsClientModalOpen(true);
  };

  const editClient = (client) => {
    setClientFormData({ ...client });
    setCurrentClient(client);
    setIsClientModalOpen(true);
  };

  const handleClientSubmit = (e) => {
    e.preventDefault();
    if (!clientFormData.name || !clientFormData.contact) {
      alert('Por favor, completa todos los campos obligatorios del cliente.');
      return;
    }

    const now = Date.now();
    if (currentClient) {
      setClients(clients.map(c => c.id === currentClient.id ? { ...c, ...clientFormData, updatedAt: now } : c));
    } else {
      setClients([...clients, { id: Date.now(), ...clientFormData, motorcycles: [], updatedAt: now }]);
    }
    setIsClientModalOpen(false);
    setClientFormData({ name: '', contact: '' });
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

  const handleMotorcycleSubmit = (e) => {
    e.preventDefault();
    if (!motorcycleFormData.make || !motorcycleFormData.model) {
      alert('Por favor, completa todos los campos obligatorios de la moto.');
      return;
    }

    const now = Date.now();
    const updatedClients = clients.map(client => {
      if (client.id === currentClient.id) {
        if (motorcycleFormData.id) {
          const updatedMotorcycles = client.motorcycles.map(m => m.id === motorcycleFormData.id ? { ...m, ...motorcycleFormData } : m);
          return { ...client, motorcycles: updatedMotorcycles, updatedAt: now };
        } else {
          return { ...client, motorcycles: [...client.motorcycles, { id: Date.now(), ...motorcycleFormData }], updatedAt: now };
        }
      }
      return client;
    });
    setClients(updatedClients);
    setIsMotorcycleModalOpen(false);
    setMotorcycleFormData({ make: '', model: '', plate: '' });
  };

  const deleteClient = (clientId) => {
    setClients(clients.filter(client => client.id !== clientId));
  };

  const deleteMotorcycle = (clientId, motorcycleId) => {
    const updatedClients = clients.map(client => {
      if (client.id === clientId) {
        return { ...client, motorcycles: client.motorcycles.filter(moto => moto.id !== motorcycleId) };
      }
      return client;
    });
    setClients(updatedClients);
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
    let sortedClients = [...clients];

    if (searchTerm) {
      sortedClients = sortedClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.motorcycles.some(moto =>
          moto.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moto.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (moto.plate && moto.plate.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }

    if (sortConfig.key) {
      sortedClients.sort((a, b) => {
        if (sortConfig.key === 'updatedAt') {
          return sortConfig.direction === 'ascending' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortedClients;
  }, [clients, searchTerm, sortConfig]);

  return (
    <div className="clients p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">Clientes</h1>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="shadow appearance-none border rounded w-full py-2 px-3 mb-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
      />

      <div className="mb-4">
        <button onClick={() => requestSort('name')} className="mr-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Ordenar por Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </button>
        <button onClick={() => requestSort('updatedAt')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Ordenar por Reciente {sortConfig.key === 'updatedAt' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </button>
      </div>

      <button onClick={addClient} className="bg-primary text-white px-4 py-2 rounded mb-4">Agregar Cliente</button>

      <ul>
        {sortedAndFilteredClients.map(client => (
          <li key={client.id} className="mb-6 border-b border-gray-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl text-light-text">{client.name}</h2>
                <p className="text-gray-400">{client.contact}</p>
              </div>
              <div>
                <button onClick={() => editClient(client)} className="bg-secondary text-black px-3 py-1 rounded mr-2">Editar</button>
                <button onClick={() => deleteClient(client.id)} className="bg-red-600 text-white px-3 py-1 rounded mr-2">Eliminar</button>
                <button onClick={() => addMotorcycle(client.id)} className="bg-green-500 text-white px-3 py-1 rounded">Agregar Moto</button>
              </div>
            </div>
            {client.motorcycles && client.motorcycles.length > 0 && (
              <ul className="mt-2">
                {client.motorcycles.map(motorcycle => (
                  <li key={motorcycle.id} className="flex justify-between items-center mt-2">
                    <div>{motorcycle.make} {motorcycle.model} {motorcycle.plate && `(${motorcycle.plate})`}</div>
                    <div>
                      <button onClick={() => editMotorcycle(client, motorcycle)} className="bg-secondary text-black px-2 py-1 rounded mr-2 text-xs">Editar</button>
                      <button onClick={() => deleteMotorcycle(client.id, motorcycle.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-dark-bg p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">{currentClient ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
            <form onSubmit={handleClientSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="contact">Teléfono:</label>
                <input
                  type="text"
                  id="contact"
                  value={clientFormData.contact}
                  onChange={(e) => setClientFormData({ ...clientFormData, contact: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded mr-2">Guardar</button>
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMotorcycleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-dark-bg p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">{motorcycleFormData.id ? 'Editar Moto' : 'Agregar Moto'}</h2>
            <form onSubmit={handleMotorcycleSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="make">Marca:</label>
                <input
                  type="text"
                  id="make"
                  value={motorcycleFormData.make}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, make: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="model">Modelo:</label>
                <input
                  type="text"
                  id="model"
                  value={motorcycleFormData.model}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, model: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="plate">Placa:</label>
                <input
                  type="text"
                  id="plate"
                  value={motorcycleFormData.plate}
                  onChange={(e) => setMotorcycleFormData({ ...motorcycleFormData, plate: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded mr-2">Guardar</button>
                <button type="button" onClick={() => setIsMotorcycleModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
