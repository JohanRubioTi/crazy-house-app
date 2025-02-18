import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { supabase } from '../supabaseClient';
    import { useAtom } from 'jotai';
    import { servicesAtom, clientsAtom, motorcyclesAtom, inventoryItemsAtom } from '../atoms';
    import ConfirmationModal from './ConfirmationModal';

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
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [deleteConfirmation, setDeleteConfirmation] = useState({ // Confirmation modal state
        isOpen: false,
        itemId: null,
      });
      const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track initial load


      const fetchData = useCallback(async () => {
        setLoading(true);
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
            setHasLoadedOnce(true);
          }

        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error);
        } finally {
          setLoading(false);
        }
      }, [sortConfig, setClientsAtom, setMotorcyclesAtom, setInventoryAtom, setServicesAtom]);

      useEffect(() => {
        if (!hasLoadedOnce && services.length === 0) {
          fetchData();
        } else if (!hasLoadedOnce && services.length > 0) {
          setHasLoadedOnce(true);
        }
      }, [fetchData, hasLoadedOnce, services.length]);


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
        } finally {
          setLoading(false);
        }
      };

      const confirmDeleteService = (serviceId) => {
        setDeleteConfirmation({
          isOpen: true,
          itemId: serviceId,
        });
      };

      const deleteService = async () => {
        const serviceId = deleteConfirmation.itemId;
        setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal
        setLoading(true);
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
        } finally {
          setLoading(false);
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

      const sortedAndFilteredServices = useMemo(() => {
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

        sortedServices.sort((a, b) => {
            const keyA = a[sortConfig.key];
            const keyB = b[sortConfig.key];

            if (sortConfig.direction === 'ascending') {
                return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
            } else {
                return keyB < keyA ? -1 : keyB > keyA ? 1 : 0;
            }
        });

        return sortedServices;
      }, [services, searchTerm, sortConfig, clients, motorcycles]);

      if (loading) {
        return <div className="text-center"><div className="spinner mb-4"></div></div>;
      }

      if (error) {
        return <p className="text-light-text">Error: {error.message}</p>;
      }

      return (
        <div className="service-history p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
          <h1 className="text-3xl font-bold text-primary mb-6 font-graffiti tracking-wide">Historial de Servicios</h1>

          <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
            <div className="flex flex-grow gap-2">
              <input
                type="text"
                placeholder="Buscar en historial de servicios..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="shadow appearance-none border border-gray-700 rounded-lg py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-primary font-body flex-grow"
              />
              <button onClick={addService} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap">
                Agregar Servicio
              </button>
            </div>
          </div>


          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed bg-dark-secondary rounded-lg shadow-premium-md border-separate border-spacing-0">
              <thead className="bg-dark-secondary text-light-primary font-display sticky top-0">
                <tr className="rounded-t-lg">
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                    <button onClick={() => requestSort('date')} className="hover:text-highlight-premium focus:outline-none">
                      Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                      Cliente
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                      Moto
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                    <button onClick={() => requestSort('labor_cost')} className="hover:text-highlight-premium focus:outline-none">
                      Mano de Obra {sortConfig.key === 'labor_cost' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                    <button onClick={() => requestSort('total_value')} className="hover:text-highlight-premium focus:outline-none">
                      Valor Total {sortConfig.key === 'total_value' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                    Tipo Servicio
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-dark-secondary font-body text-light-primary">
                {sortedAndFilteredServices.map(service => {
                  const client = clients.find(c => c.id === service.client_id);
                  const motorcycle = motorcycles.find(m => m.id === service.motorcycle_id);
                  return (
                    <tr key={service.id} className="group hover:bg-dark-primary transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{new Date(service.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{client?.name || 'Cliente Desconocido'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{motorcycle?.make + ' ' + motorcycle?.model || 'Moto Desconocida'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${parseFloat(service.labor_cost).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${parseFloat(service.total_value).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{service.service_type}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => editService(service)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                          <button onClick={() => confirmDeleteService(service.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  )})}
              </tbody>
              <tfoot className="bg-dark-secondary">
                <tr>
                  <td colSpan="7" className="px-4 py-3 rounded-b-lg">
                    {sortedAndFilteredServices.length === 0 && <p className="text-light-primary text-center font-body">No hay servicios en el historial.</p>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm">
              <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-2xl shadow-lg border border-accent-premium" style={{ marginTop: '20px', marginBottom: '70px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{currentService ? 'Editar Servicio' : 'Agregar Servicio'}</h2>
                <ServiceModal
                  isOpen={isServiceModalOpen}
                  onClose={() => setIsServiceModalOpen(false)}
                  onSubmit={handleServiceSubmit}
                  serviceFormData={serviceFormData}
                  setServiceFormData={setServiceFormData}
                  clients={clients}
                  motorcycles={motorcycles}
                  inventory={inventory}
                  currentService={currentService}
                  addProductToService={addProductToService}
                  removeProductFromService={removeProductFromService}
                />
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          <ConfirmationModal
            isOpen={deleteConfirmation.isOpen}
            onClose={handleCancelDelete}
            onConfirm={deleteService}
            title="Eliminar Servicio"
            message="¿Estás seguro de que quieres eliminar este servicio del historial?"
          />
        </div>
      );
    };

    export default ServiceHistory;


    const ServiceModal = ({ isOpen, onClose, onSubmit, serviceFormData, setServiceFormData, clients, motorcycles, inventory, currentService, addProductToService, removeProductFromService }) => {
        if (!isOpen) return null;

        const [clientSearchTerm, setClientSearchTerm] = useState('');
        const [motorcycleSearchTerm, setMotorcycleSearchTerm] = useState('');
        const [inventorySearchTerm, setInventorySearchTerm] = useState('');
        const [showClientDropdown, setShowClientDropdown] = useState(false);
        const [showMotorcycleDropdown, setShowMotorcycleDropdown] = useState(false);
        const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
        const [selectedInventoryProduct, setSelectedInventoryProduct] = useState('');


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

        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setServiceFormData(prevState => ({
                ...prevState,
                [name]: value,
                totalValue: calculateTotalValue(name === 'laborCost' ? value : prevState.laborCost, prevState.productsUsed)
            }));
        };

      const filteredClients = useMemo(() => {
        return clients.filter(client =>
          client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
        );
      }, [clients, clientSearchTerm]);

      const filteredMotorcycles = useMemo(() => {
        return motorcycles.filter(motorcycle =>
          `${motorcycle.make} ${motorcycle.model} ${motorcycle.plate}`.toLowerCase().includes(motorcycleSearchTerm.toLowerCase()) && motorcycle.client_id === parseInt(serviceFormData.clientId)
        );
      }, [motorcycles, motorcycleSearchTerm, serviceFormData.clientId]);

      const filteredInventory = useMemo(() => {
        return inventory.filter(item =>
          item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())
        );
      }, [inventory, inventorySearchTerm]);


      return(
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-light-text text-sm font-semibold mb-2 font-body" htmlFor="clientId">Cliente:</label>
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={clientSearchTerm}
                      onChange={(e) => { setClientSearchTerm(e.target.value); setShowClientDropdown(true); setServiceFormData({...serviceFormData, clientId: ''})}}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 100)}
                      onFocus={() => setShowClientDropdown(true)}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                    />
                    {showClientDropdown && (
                      <ul className="absolute z-10 mt-1 w-full bg-dark-secondary border border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.map(client => (
                          <li
                            key={client.id}
                            className="py-2 px-4 text-light-text hover:bg-dark-primary cursor-pointer"
                            onClick={() => { setServiceFormData({...serviceFormData, clientId: client.id}); setClientSearchTerm(client.name); setShowClientDropdown(false); }}
                          >
                            {client.name}
                          </li>
                        ))}
                        {filteredClients.length === 0 && clientSearchTerm && (
                          <li className="py-2 px-4 text-light-text">No se encontraron clientes</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-light-text text-sm font-semibold mb-2 font-sans" htmlFor="motorcycleId">Moto:</label>
                    <input
                      type="text"
                      placeholder="Buscar moto..."
                      value={motorcycleSearchTerm}
                      onChange={(e) => { setMotorcycleSearchTerm(e.target.value); setShowMotorcycleDropdown(true); setServiceFormData({...serviceFormData, motorcycleId: ''}) }}
                      onBlur={() => setTimeout(() => setShowMotorcycleDropdown(false), 100)}
                      onFocus={() => setShowMotorcycleDropdown(true)}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                    />
                    {showMotorcycleDropdown && (
                      <ul className="absolute z-10 mt-1 w-full bg-dark-secondary border border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredMotorcycles.map(motorcycle => (
                          <li
                            key={motorcycle.id}
                            className="py-2 px-4 text-light-text hover:bg-dark-primary cursor-pointer"
                            onClick={() => { setServiceFormData({...serviceFormData, motorcycleId: motorcycle.id}); setMotorcycleSearchTerm(`${motorcycle.make} ${motorcycle.model} (${motorcycle.plate || 'Sin placa'})`); setShowMotorcycleDropdown(false); }}
                          >
                            {motorcycle.make} {motorcycle.model} ({motorcycle.plate || 'Sin placa'})
                          </li>
                        ))}
                        {filteredMotorcycles.length === 0 && motorcycleSearchTerm && (
                          <li className="py-2 px-4 text-light-text">No se encontraron motos</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="laborCost">Valor Mano de Obra:</label>
                    <input
                      type="number"
                      id="laborCost"
                      name="laborCost"
                      value={serviceFormData.laborCost}
                      onChange={handleInputChange}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="date">Fecha:</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={serviceFormData.date}
                      onChange={handleInputChange}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                    />
                  </div>

                  <div>
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="serviceType">Tipo de Servicio:</label>
                    <input
                      type="text"
                      id="serviceType"
                      name="serviceType"
                      value={serviceFormData.serviceType}
                      onChange={handleInputChange}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                    />
                  </div>

                  <div>
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="kilometers">Kilometraje:</label>
                    <input
                      type="number"
                      id="kilometers"
                      name="kilometers"
                      value={serviceFormData.kilometers}
                      onChange={handleInputChange}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="notes">Notas:</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={serviceFormData.notes}
                      onChange={handleInputChange}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text"
                      rows="3"
                    />
                  </div>

                  <div className="col-span-2 relative">
                    <label className="block text-light-text text-sm font-bold mb-2 font-sans">Productos Usados:</label>
                    <input
                      type="text"
                      placeholder="Buscar producto..."
                      value={inventorySearchTerm}
                      onChange={(e) => { setInventorySearchTerm(e.target.value); setShowInventoryDropdown(true); setSelectedInventoryProduct('') }}
                      onBlur={() => setTimeout(() => setShowInventoryDropdown(false), 100)}
                      onFocus={() => setShowInventoryDropdown(true)}
                      className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text mb-1"
                    />
                    {showInventoryDropdown && (
                      <ul className="absolute z-10 mt-1 w-full bg-dark-secondary border border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredInventory.map(product => (
                          <li
                            key={product.id}
                            className="py-2 px-4 text-light-text hover:bg-dark-primary cursor-pointer"
                            onClick={() => { setSelectedInventoryProduct(product.id); setInventorySearchTerm(product.name); setShowInventoryDropdown(false); }}
                          >
                            {product.name}
                          </li>
                        ))}
                        {filteredInventory.length === 0 && inventorySearchTerm && (
                          <li className="py-2 px-4 text-light-text">No se encontraron productos</li>
                        )}
                      </ul>
                    )}
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
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (selectedInventoryProduct) {
                            addProductToService(parseInt(selectedInventoryProduct), 1);
                            setSelectedInventoryProduct('');
                            setInventorySearchTerm('');
                          }
                        }}
                        className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap"
                      >
                        Añadir Producto
                      </button>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        className="shadow appearance-none border border-gray-700 rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text ml-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (selectedInventoryProduct) {
                              addProductToService(parseInt(selectedInventoryProduct), parseInt(e.target.value));
                              setSelectedInventoryProduct('');
                              setInventorySearchTerm('');
                              e.target.value = "";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end mt-6">
                    <button type="submit" className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Guardar</button>
                    <button type="button" onClick={onClose} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Cancelar</button>
                  </div>
                </form>
      )
    }
