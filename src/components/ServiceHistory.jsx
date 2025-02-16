import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAtom } from 'jotai';
import { servicesAtom, clientsAtom, motorcyclesAtom, inventoryItemsAtom } from '../atoms';

const ServiceHistory = () => {
  const [services, setServicesAtom] = useAtom(servicesAtom);
  const [clients, setClientsAtom] = useAtom(clientsAtom);
  const [motorcycles, setMotorcyclesAtom] = useAtom(motorcyclesAtom);
  const [inventory, setInventoryAtom] = useAtom(inventoryItemsAtom);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });


  const fetchData = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
        throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;

      // Fetch Clients
      let { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);
      if (clientsError) throw clientsError;
      setClientsAtom(clientsData || []);

      // Fetch Motorcycles
      let { data: motorcyclesData, error: motorcyclesError } = await supabase
        .from('motorcycles')
        .select('*')
        .eq('user_id', userId);
      if (motorcyclesError) throw motorcyclesError;
      setMotorcyclesAtom(motorcyclesData || []);

      // Fetch Inventory Items
      let { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId);
      if (inventoryError) throw inventoryError;
      setInventoryAtom(inventoryData || []);

      // Fetch Services
      let { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });
      if (servicesError) throw servicesError;

      // Fetch Service Products for each service
      if (servicesData) {
        const servicesWithProducts = await Promise.all(
          servicesData.map(async (service) => {
            let { data: serviceProductsData, error: serviceProductsError } = await supabase
              .from('service_products')
              .select('*, inventory_items(name)')
              .eq('service_id', service.id)
              .eq('user_id', userId);

            if (serviceProductsError) throw serviceProductsError;

            const productsUsed = serviceProductsData.map((sp) => ({
              productId: sp.inventory_item_id,
              quantity: sp.quantity,
              price: sp.price,
              name: sp.inventory_items.name,
            }));

            return { ...service, productsUsed, date: new Date(service.date).toISOString().split('T')[0] };
          })
        );
        setServicesAtom(servicesWithProducts);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data: ' + error.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortConfig]);


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

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceFormData.clientId || !serviceFormData.motorcycleId || serviceFormData.laborCost < 0) {
      alert('Por favor, completa todos los campos obligatorios y asegúrate de que el costo de mano de obra sea válido.');
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
        throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;

      const serviceDataToSave = {
        user_id: userId,
        client_id: serviceFormData.clientId,
        motorcycle_id: serviceFormData.motorcycleId,
        labor_cost: parseFloat(serviceFormData.laborCost) || 0,
        total_value: calculateTotalValue(serviceFormData.laborCost, serviceFormData.productsUsed),
        date: new Date(serviceFormData.date).toISOString(),
        notes: serviceFormData.notes,
        service_type: serviceFormData.serviceType,
        kilometers: parseInt(serviceFormData.kilometers) || 0,
        updated_at: new Date().toISOString()
      };

      let serviceId = currentService ? currentService.id : null;

      if (currentService) {
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceDataToSave)
          .eq('id', currentService.id)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        // Delete existing service_products
        const { error: deleteProductsError } = await supabase
          .from('service_products')
          .delete()
          .eq('service_id', currentService.id)
          .eq('user_id', userId);
        if (deleteProductsError) throw deleteProductsError;

      } else {
        // Insert new service
        const { data: insertedService, error: insertError } = await supabase
          .from('services')
          .insert([serviceDataToSave])
          .select();

        if (insertError) throw insertError;
        serviceId = insertedService[0].id;
      }

      // (Re-)Insert service_products and update inventory
      for (const product of serviceFormData.productsUsed) {
        const { error: productError } = await supabase
          .from('service_products')
          .insert([{
            user_id: userId,
            service_id: serviceId,
            inventory_item_id: product.productId,
            quantity: product.quantity,
            price: product.price,
            updated_at: new Date().toISOString()
          }]);
        if (productError) throw productError;

        // Update inventory quantity
        const inventoryItem = inventory.find(item => item.id === parseInt(product.productId));
        if (inventoryItem) {
            const newQuantity = currentService
            ? inventoryItem.quantity + currentService.productsUsed.find(p => p.productId === product.productId)?.quantity - product.quantity
            : inventoryItem.quantity - product.quantity;

          const { error: updateInventoryError } = await supabase
            .from('inventory_items')
            .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
            .eq('id', product.productId)
            .eq('user_id', userId);

          if (updateInventoryError) throw updateInventoryError;
        }
      }

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
      fetchData(); // Refetch all data
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service: ' + error.message);
    }
  };

  const deleteService = async (serviceId) => {
    try {
        const user = await supabase.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            throw new Error("User not authenticated");
        }
        const userId = user.data.user.id;

      // Get products used in the service to restore inventory
      const { data: serviceProducts, error: serviceProductsError } = await supabase
        .from('service_products')
        .select('inventory_item_id, quantity')
        .eq('service_id', serviceId)
        .eq('user_id', userId);

      if (serviceProductsError) throw serviceProductsError;

      // Delete service
      const { error: deleteError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Delete related service_products
      const { error: deleteProductsError } = await supabase
        .from('service_products')
        .delete()
        .eq('service_id', serviceId)
        .eq('user_id', userId);

      if (deleteProductsError) throw deleteProductsError;

      // Restore inventory quantities
      if (serviceProducts) {
        for (const product of serviceProducts) {
          const { error: updateInventoryError } = await supabase
            .from('inventory_items')
            .update({
              quantity: (item) => item.quantity + product.quantity,
            })
            .eq('id', product.inventory_item_id)
            .eq('user_id', userId);

          if (updateInventoryError) throw updateInventoryError;
        }
      }

      fetchData(); // Refetch all data
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service: ' + error.message);
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

  const calculateTotalValue = (laborCost, productsUsed) => {
    const labor = parseFloat(laborCost) || 0;
    let productsTotal = 0;
    if (productsUsed && Array.isArray(productsUsed)) {
      productsTotal = productsUsed.reduce((acc, product) => {
        const productPrice = parseFloat(product.price) || 0;
        const productQuantity = parseInt(product.quantity) || 0;
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
    const parsedQuantity = parseInt(quantity, 10);
    if (!parsedQuantity || parsedQuantity <= 0) {
        alert("Por favor, ingresa una cantidad válida.");
        return;
    }

    const existingProductIndex = serviceFormData.productsUsed.findIndex(p => p.productId === productId);

    if (existingProductIndex > -1) {
      // Update existing product
      const updatedProductsUsed = [...serviceFormData.productsUsed];
      updatedProductsUsed[existingProductIndex] = {
        ...updatedProductsUsed[existingProductIndex],
        quantity: updatedProductsUsed[existingProductIndex].quantity + parsedQuantity,
      };
      setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
    } else {
      // Add new product
      setServiceFormData({
        ...serviceFormData,
        productsUsed: [...serviceFormData.productsUsed, { productId: product.id, quantity: parsedQuantity, price: product.price_sold, name: product.name }],
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
        const client = clients.find(c => c.id === service.client_id);
        const motorcycle = motorcycles.find(m => m.id === service.motorcycle_id);
        const clientName = client ? client.name.toLowerCase() : '';
        const motorcycleInfo = motorcycle ? `${motorcycle.make} ${motorcycle.model}`.toLowerCase() : '';

        return clientName.includes(searchTerm.toLowerCase()) ||
          motorcycleInfo.includes(searchTerm.toLowerCase()) ||
          service.notes.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // No need to sort here, sorting is done during fetch

    return sortedServices;
  }, [services, searchTerm, clients, motorcycles]);

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
          const client = clients.find(c => c.id === service.client_id);
          const motorcycle = motorcycles.find(m => m.id === service.motorcycle_id);

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
                <p className="text-gray-400 font-sans"><b className="text-light-text">Mano de Obra:</b> ${parseFloat(service.labor_cost).toLocaleString('es-CO')}</p>
                <p className="text-gray-400 font-sans"><b className="text-light-text">Valor Total:</b> ${parseFloat(service.total_value).toLocaleString('es-CO')}</p>
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

              <p className="text-gray-400 font-sans mb-2"><b className="text-light-text">Tipo de Servicio:</b> {service.service_type || 'No especificado'}</p>
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
                  {motorcycles.filter(m => m.client_id === serviceFormData.clientId).map(motorcycle => (
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
