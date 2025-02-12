import React, { useState, useEffect } from 'react';

const ServiceHistory = ({ services: propServices, onUpdateServices }) => {
  const [services, setServices] = useState(propServices || []);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    clientId: '',
    motorcycleId: '',
    laborCost: 0,
    productsUsed: [],
    totalValue: 0,
    date: new Date().toISOString().split('T')[0], // Default to today's date
    notes: '',
    serviceType: '',
    kilometers: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

    // Dummy data for clients and motorcycles (replace with actual data fetching)
  const [clients, setClients] = useState([
      { id: 1, name: 'Juan Pérez' },
      { id: 2, name: 'María López' },
      { id: 3, name: 'Carlos Rodríguez' }
    ]);
    const [motorcycles, setMotorcycles] = useState([
        { id: 1, clientId: 1, make: 'Yamaha', model: 'R15', plate: 'ABC123' },
        { id: 2, clientId: 2, make: 'Honda', model: 'CBR250', plate: '' },
        { id: 3, clientId: 1, make: 'Yamaha', model: 'FZ25', plate: 'DEF456' }
    ]);
  const [inventory, setInventory] = useState([
        { id: 1, name: 'Aceite 2T', priceSold: 35000 },
        { id: 2, name: 'Filtro de aire', priceSold: 15000 },
        { id: 3, name: 'Líquido de frenos', priceSold: 18000 },
    ]);

    useEffect(() => {
        setServices(propServices);
    }, [propServices]);

  const addService = () => {
    setServiceFormData({
      clientId: '',
      motorcycleId: '',
      laborCost: 0,
      productsUsed: [],
      totalValue: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      serviceType: '',
      kilometers: 0,
    });
    setCurrentService(null);
    setIsServiceModalOpen(true);
  };

  const editService = (service) => {
    setServiceFormData({ ...service });
    setCurrentService(service);
    setIsServiceModalOpen(true);
  };

    const handleServiceSubmit = (e) => {
        e.preventDefault();
        if (!serviceFormData.clientId || !serviceFormData.motorcycleId || serviceFormData.laborCost < 0) {
            alert('Por favor, completa todos los campos obligatorios y asegúrate de que el costo de mano de obra sea válido.');
            return;
        }

        const now = Date.now();
        const serviceDataToSave = {
            ...serviceFormData,
            totalValue: calculateTotalValue(serviceFormData.laborCost, serviceFormData.productsUsed),
            date: new Date(serviceFormData.date).getTime(), // Convert date string to timestamp
        };

        let updatedServices;
        if (currentService) {
            updatedServices = services.map(s => s.id === currentService.id ? { ...s, ...serviceDataToSave, updatedAt: now } : s);
        } else {
            updatedServices = [...services, { id: Date.now(), ...serviceDataToSave, updatedAt: now }];
        }

        setServices(updatedServices);
        onUpdateServices(updatedServices); // Notify parent component
        setIsServiceModalOpen(false);
        setServiceFormData({ // Reset form
            clientId: '',
            motorcycleId: '',
            laborCost: 0,
            productsUsed: [],
            totalValue: 0,
            date: new Date().toISOString().split('T')[0],
            notes: '',
            serviceType: '',
            kilometers: 0,
        });
    };

  const deleteService = (serviceId) => {
    const updatedServices = services.filter(service => service.id !== serviceId);
    setServices(updatedServices);
    onUpdateServices(updatedServices); // Notify parent component
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

    const calculateTotalValue = (laborCost, productsUsed) => {
        const labor = parseFloat(laborCost) || 0;
        let productsTotal = 0;
        if (productsUsed && Array.isArray(productsUsed)) { // Ensure productsUsed is an array
            productsTotal = productsUsed.reduce((acc, product) => {
                const productPrice = parseFloat(product.price) || 0; // Parse product price
                const productQuantity = parseInt(product.quantity) || 0; // Parse product quantity
                return acc + (productPrice * productQuantity);
            }, 0);
        }
        return labor + productsTotal;
    };


    // Update total value whenever labor cost or products used change
    useEffect(() => {
        setServiceFormData(prevFormData => ({
            ...prevFormData,
            totalValue: calculateTotalValue(prevFormData.laborCost, prevFormData.productsUsed),
        }));
    }, [serviceFormData.laborCost, serviceFormData.productsUsed]);

  const addProductToService = (productId, quantity) => {
    const product = inventory.find(p => p.id === parseInt(productId));
    if (!product) {
      alert('Producto no encontrado.');
      return;
    }
    if (!quantity || quantity <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }
    const existingProductIndex = serviceFormData.productsUsed.findIndex(p => p.productId === productId);

    if (existingProductIndex > -1) {
      // Update existing product
      const updatedProductsUsed = [...serviceFormData.productsUsed];
      updatedProductsUsed[existingProductIndex] = {
        ...updatedProductsUsed[existingProductIndex],
        quantity: updatedProductsUsed[existingProductIndex].quantity + quantity,
      };
      setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
    } else {
      // Add new product
      setServiceFormData({
        ...serviceFormData,
        productsUsed: [...serviceFormData.productsUsed, { productId: product.id, quantity, price: product.priceSold, name: product.name }],
      });
    }
  };

  const removeProductFromService = (productId) => {
    setServiceFormData({
      ...serviceFormData,
      productsUsed: serviceFormData.productsUsed.filter(p => p.productId !== productId),
    });
  };

  const sortedAndFilteredServices = React.useMemo(() => {
    let sortedServices = [...services];

    if (searchTerm) {
      sortedServices = sortedServices.filter(service => {
          const client = clients.find(c => c.id === service.clientId);
          const motorcycle = motorcycles.find(m => m.id === service.motorcycleId);
          const clientName = client ? client.name.toLowerCase() : '';
          const motorcycleInfo = motorcycle ? `${motorcycle.make} ${motorcycle.model}`.toLowerCase() : '';

          return clientName.includes(searchTerm.toLowerCase()) ||
                 motorcycleInfo.includes(searchTerm.toLowerCase()) ||
                 service.notes.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (sortConfig.key) {
      sortedServices.sort((a, b) => {
        if (sortConfig.key === 'date') {
          return sortConfig.direction === 'ascending' ? a.date - b.date : b.date - a.date;
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

    return sortedServices;
  }, [services, searchTerm, sortConfig, clients, motorcycles]);

  return (
    <div className="service-history p-4 bg-street-gradient">
      <h1 className="text-2xl font-bold text-primary mb-4 font-graffiti">Historial de Servicio</h1>

      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 mb-4 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
      />

      <div className="mb-4">
        <button onClick={() => requestSort('date')} className="bg-accent hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full font-sans">
          Ordenar por Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
        </button>
      </div>

      <button onClick={addService} className="bg-secondary hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full mb-4 font-sans">Agregar Servicio</button>

      <div className="grid grid-cols-1 gap-4">
        {sortedAndFilteredServices.map(service => {
            const client = clients.find(c => c.id === service.clientId);
            const motorcycle = motorcycles.find(m => m.id === service.motorcycleId);

            return (
          <div key={service.id} className="bg-transparent-black bg-opacity-70 backdrop-blur-sm p-6 rounded-lg shadow-md-dark border border-gray-700">
            <h2 className="text-xl text-light-text font-sans mb-3">
                Servicio para <b className="font-bold text-secondary-text">{client ? client.name : 'Cliente Desconocido'}</b>
            </h2>
            <h3 className="text-lg text-light-text font-sans mb-3">
                Moto: <b className="font-bold text-secondary-text">{motorcycle ? `${motorcycle.make} ${motorcycle.model}` : 'Moto Desconocida'}</b>
            </h3>
            <div className="mb-2">
                <p className="text-gray-400 font-sans"><b className="text-light-text">Fecha:</b> {new Date(service.date).toLocaleDateString('es-CO')}</p>
                <p className="text-gray-400 font-sans"><b className="text-light-text">Mano de Obra:</b> ${parseFloat(service.laborCost).toLocaleString('es-CO')}</p>
                <p className="text-gray-400 font-sans"><b className="text-light-text">Valor Total:</b> ${parseFloat(service.totalValue).toLocaleString('es-CO')}</p>
            </div>
            <div className="mb-2">
                <p className="text-gray-400 font-sans"><b className="text-light-text">Productos:</b></p>
                {service.productsUsed.length > 0 ? (
                    <ul className="list-disc pl-5">
                        {service.productsUsed.map(p => (
                            <li key={p.productId} className="font-sans text-gray-400">
                                {p.name} x{p.quantity} - ${parseFloat(p.price).toLocaleString('es-CO')} c/u
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-gray-400 font-sans">Ninguno</p>}
            </div>

            <p className="text-gray-400 font-sans mb-2"><b className="text-light-text">Tipo de Servicio:</b> {service.serviceType || 'No especificado'}</p>
            <p className="text-gray-400 font-sans mb-2"><b className="text-light-text">Kilometraje:</b> {service.kilometers} km</p>
            <p className="text-gray-400 font-sans mb-3"><b className="text-light-text">Notas:</b> {service.notes || 'Ninguna'}</p>

            <div className="mt-4 flex justify-end">
              <button onClick={() => editService(service)} className="bg-secondary hover:bg-light-accent text-dark-bg px-3 py-1 rounded-full mr-2 font-sans">Editar</button>
              <button onClick={() => deleteService(service.id)} className="bg-primary hover:bg-light-accent text-light-text px-3 py-1 rounded-full font-sans">Eliminar</button>
            </div>
          </div>
        );
        })}
      </div>

      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-transparent-black bg-opacity-90 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-2xl border border-accent">
            <h2 className="text-xl font-bold text-primary mb-4 font-graffiti">{currentService ? 'Editar Servicio' : 'Agregar Servicio'}</h2>
            <form onSubmit={handleServiceSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="clientId">Cliente:</label>
                <select
                  id="clientId"
                  value={serviceFormData.clientId}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, clientId: parseInt(e.target.value) })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                  required
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="motorcycleId">Moto:</label>
                <select
                  id="motorcycleId"
                  value={serviceFormData.motorcycleId}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, motorcycleId: parseInt(e.target.value) })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                  required
                >
                  <option value="">Selecciona una moto</option>
                  {motorcycles.filter(m => m.clientId === serviceFormData.clientId).map(motorcycle => (
                    <option key={motorcycle.id} value={motorcycle.id}>{motorcycle.make} {motorcycle.model} ({motorcycle.plate || 'Sin placa'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="laborCost">Valor Mano de Obra:</label>
                <input
                  type="number"
                  id="laborCost"
                  value={serviceFormData.laborCost}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, laborCost: parseFloat(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                  required
                />
              </div>

              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="date">Fecha:</label>
                <input
                  type="date"
                  id="date"
                  value={serviceFormData.date}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, date: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                />
              </div>

              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="serviceType">Tipo de Servicio:</label>
                <input
                  type="text"
                  id="serviceType"
                  value={serviceFormData.serviceType}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, serviceType: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                />
              </div>

              <div>
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="kilometers">Kilometraje:</label>
                <input
                  type="number"
                  id="kilometers"
                  value={serviceFormData.kilometers}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, kilometers: parseInt(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                />
              </div>
                <div className="col-span-2">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="notes">Notas:</label>
                <textarea
                  id="notes"
                  value={serviceFormData.notes}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, notes: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                  rows="3"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans">Productos Usados:</label>
                <ul>
                  {serviceFormData.productsUsed.map(product => (
                    <li key={product.productId} className="flex items-center justify-between mb-1 font-sans">
                      <span>{product.name} x{product.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeProductFromService(product.productId)}
                        className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded-full text-xs font-sans"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex items-end">
                    <select
                        className="shadow appearance-none border border-gray-700 rounded w-2/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text mr-2"
                        onChange={(e) => {
                            if (e.target.value) {
                                addProductToService(parseInt(e.target.value), 1);
                                e.target.value = ""; // Reset select
                            }
                        }}
                    >
                        <option value="">Selecciona un producto</option>
                        {inventory.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        className="shadow appearance-none border border-gray-700 rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const productId = e.target.previousSibling.value;
                                const quantity = parseInt(e.target.value);
                                if (productId && quantity > 0) {
                                    addProductToService(parseInt(productId), quantity);
                                    e.target.value = ""; // Reset input
                                }
                            }
                        }}
                    />
                </div>
              </div>

              <div className="col-span-2 flex justify-end">
                <button type="submit" className="bg-secondary hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full mr-2 font-sans">Guardar</button>
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="bg-accent hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full font-sans">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceHistory;
