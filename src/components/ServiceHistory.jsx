import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import ConfirmationModal from './ConfirmationModal';
import { useAtom } from 'jotai';
import { servicesAtom } from '../atoms';
import { fetchServices } from '../supabaseService';
import StockAlertModal from './StockAlertModal'; // Import StockAlertModal

const getDefaultServiceFormData = () => ({
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

const getDefaultConfirmationState = () => ({
  isOpen: false,
  itemId: null,
});

const ServiceHistory = () => {
  const [services, setServices] = useAtom(servicesAtom);
  const [clients, setClients] = useState([]);
  const [motorcycles, setMotorcycles] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState(getDefaultServiceFormData());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(getDefaultConfirmationState());
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false); // Stock alert modal state
  const [stockAlertMessage, setStockAlertMessage] = useState(''); // Stock alert message state


  const fetchData = useCallback(async () => {
    try {
      const userId = await getUserId();
      const [clientsData, motorcyclesData, inventoryData] = await Promise.all([
        fetchClients(userId),
        fetchMotorcycles(userId),
        fetchInventoryItems(userId),
      ]);
      setClients(clientsData);
      setMotorcycles(motorcyclesData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
    }
  }, []);

  const getUserId = async () => {
    const user = await supabase.auth.getUser();
    if (!user?.data?.user) throw new Error("User not authenticated");
    return user.data.user.id;
  };

  const fetchClients = async (userId) => {
    const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  };

  const fetchMotorcycles = async (userId) => {
    const { data, error } = await supabase.from('motorcycles').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  };

  const fetchInventoryItems = async (userId) => {
    const { data, error } = await supabase.from('inventory_items').select('*').eq('user_id', userId);
    if (error) throw error;
    return data || [];
  };


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleAddService = () => {
    setServiceFormData(getDefaultServiceFormData());
    setCurrentService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service) => {
    setServiceFormData({ ...service });
    setCurrentService(service);
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    if (!serviceFormData.clientId || !serviceFormData.motorcycleId || serviceFormData.laborCost < 0) {
      alert('Por favor, completa todos los campos requeridos y asegúrate de que el costo de mano de obra sea válido.');
      return;
    }

    try {
      const userId = await getUserId();
      const serviceDataToSave = prepareServiceDataForSave(userId, serviceFormData);
      let serviceId = currentService?.id || null;

      if (currentService) {
        await updateServiceData(userId, serviceId, serviceDataToSave);
        await deleteExistingServiceProducts(userId, serviceId);
      } else {
        const insertedServiceId = await insertServiceData(userId, serviceDataToSave);
        serviceId = insertedServiceId;
      }

      await insertNewServiceProductsAndUpdateInventory(userId, serviceId, serviceFormData.productsUsed, currentService, inventory);

      setIsServiceModalOpen(false);
      setServiceFormData(getDefaultServiceFormData());
      fetchServices({ key: 'date', direction: 'descending' }).then(updatedServices => setServices(updatedServices));
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service: ' + error.message);
    }
  };

  const prepareServiceDataForSave = (userId, formData) => ({
    user_id: userId,
    client_id: formData.clientId,
    motorcycle_id: formData.motorcycleId,
    labor_cost: parseFloat(formData.laborCost) || 0,
    total_value: calculateTotalValue(formData.laborCost, formData.productsUsed),
    date: new Date(formData.date).toISOString(),
    notes: formData.notes,
    service_type: formData.serviceType,
    kilometers: parseInt(formData.kilometers) || 0,
    updated_at: new Date().toISOString()
  });

  const calculateTotalValue = (laborCost, productsUsed) => {
    const labor = parseFloat(laborCost) || 0;
    let productsTotal = 0;
    if (productsUsed && Array.isArray(productsUsed)) {
      productsTotal = productsUsed.reduce((acc, product) => acc + (parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0), 0);
    }
    return labor + productsTotal;
  };

  const updateServiceData = async (userId, serviceId, serviceData) => {
    const { error } = await supabase.from('services').update(serviceData).eq('id', serviceId).eq('user_id', userId);
    if (error) throw error;
  };

  const insertServiceData = async (userId, serviceData) => {
    const { data, error } = await supabase.from('services').insert([serviceData]).select();
    if (error) throw error;
    return data[0].id;
  };

  const deleteExistingServiceProducts = async (userId, serviceId) => {
    const { error } = await supabase.from('service_products').delete().eq('service_id', serviceId).eq('user_id', userId);
    if (error) throw error;
  };

  const insertNewServiceProductsAndUpdateInventory = async (userId, serviceId, productsUsed, currentService, inventory) => {
    for (const product of productsUsed) {
      await insertServiceProduct(userId, serviceId, product);
      await updateInventoryQuantity(userId, service, product, currentService, inventory);
    }
  };

  const insertServiceProduct = async (userId, serviceId, product) => {
    const { error: productError } = await supabase.from('service_products').insert([{
      user_id: userId,
      service_id: serviceId,
      inventory_item_id: product.productId,
      quantity: product.quantity,
      price: product.price,
      updated_at: new Date().toISOString()
    }]);
    if (productError) throw productError;
  };

  const updateInventoryQuantity = async (userId, service, product, currentService, inventory) => {
    const inventoryItem = inventory.find(item => item.id === parseInt(product.productId));
    if (inventoryItem) {
      const newQuantity = calculateNewInventoryQuantity(inventoryItem, product, currentService);
      const { error: updateInventoryError } = await supabase.from('inventory_items').update({ quantity: newQuantity, updated_at: new Date().toISOString() }).eq('id', product.productId).eq('user_id', userId);
      if (updateInventoryError) throw updateInventoryError;
    }
  };

  const calculateNewInventoryQuantity = (inventoryItem, product, currentService) => {
    const productQuantity = parseInt(product.quantity) || 0;
    if (currentService && currentService.productsUsed) {
      const prevProduct = currentService.productsUsed.find(p => p.productId === product.productId);
      const prevQuantity = prevProduct ? parseInt(prevProduct.quantity) : 0;
      return inventoryItem.quantity + prevQuantity - productQuantity;
    }
    return inventoryItem.quantity - productQuantity;
  };


  const confirmDeleteService = (serviceId) => {
    setDeleteConfirmation({ ...getDefaultConfirmationState(), isOpen: true, itemId: serviceId });
  };

  const handleDeleteService = async () => {
    const serviceId = deleteConfirmation.itemId;
    setDeleteConfirmation(getDefaultConfirmationState());
    try {
      const userId = await getUserId();
      const serviceProducts = await getServiceProductsForDeletion(userId, serviceId);
      await deleteServiceDataAndProducts(userId, serviceId);
      await restoreInventoryQuantities(userId, serviceProducts);
      fetchServices({ key: 'date', direction: 'descending' }).then(updatedServices => setServices(updatedServices));
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service: ' + error.message);
    }
  };

  const getServiceProductsForDeletion = async (userId, serviceId) => {
    const { data, error } = await supabase.from('service_products').select('inventory_item_id, quantity').eq('service_id', serviceId).eq('user_id', userId);
    if (error) throw error;
    return data || [];
  };

  const deleteServiceDataAndProducts = async (userId, serviceId) => {
    const { error: deleteError } = await supabase.from('services').delete().eq('id', serviceId).eq('user_id', userId);
    if (deleteError) throw deleteError;
    const { error: deleteProductsError } = await supabase.from('service_products').delete().eq('service_id', serviceId).eq('user_id', userId);
    if (deleteProductsError) throw deleteProductsError;
  };

  const restoreInventoryQuantities = async (userId, serviceProducts) => {
    for (const product of serviceProducts) {
      const { error: updateInventoryError } = await supabase.from('inventory_items').update({ quantity: supabase.raw('quantity + ' + product.quantity) }).eq('id', product.inventory_item_id).eq('user_id', userId);
      if (updateInventoryError) throw updateInventoryError;
    }
  };


  const handleCancelDelete = () => {
    setDeleteConfirmation(getDefaultConfirmationState());
  };


  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const requestSort = (key) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending' });
  };


  const sortedAndFilteredServices = useMemo(() => {
    let sortedServices = [...services];
    if (searchTerm) {
      sortedServices = sortedServices.filter(service => {
        const client = clients.find(c => c.id === service.client_id);
        const motorcycle = motorcycles.find(m => m.id === service.motorcycle_id);
        const clientName = client?.name?.toLowerCase() || '';
        const motorcycleInfo = motorcycle ? `${motorcycle.make || ''} ${motorcycle.model || ''}`.toLowerCase() : 'desconocida';
        return clientName.includes(searchTerm.toLowerCase()) || motorcycleInfo.includes(searchTerm.toLowerCase()) || service.notes.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    sortedServices.sort((a, b) => (sortConfig.direction === 'ascending' ? (a[sortConfig.key] < b[sortConfig.key] ? -1 : 1) : (b[sortConfig.key] < a[sortConfig.key] ? -1 : 1)));
    return sortedServices;
  }, [services, searchTerm, sortConfig, clients, motorcycles]);


  if (error) return <p className="text-light-text">Error: {error.message}</p>;

  return (
    <div className="service-history p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
      <h1 className="text-3xl font-bold text-primary mb-6 font-graffiti tracking-wide">Historial de Servicios</h1>

      <div className="mb-4 flex flex-wrap gap-2 justify-between items-center sm:flex-nowrap">
        <div className="flex flex-grow gap-2 mb-2 sm:mb-0">
          <input
            type="text"
            placeholder="Buscar historial de servicios..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border border-gray-700 rounded-lg py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-primary font-body flex-grow"
          />
        </div>
        <button onClick={handleAddService} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap">
          Agregar Servicio
        </button>
      </div>

      <div className="sm:hidden flex justify-around mb-4">
        <button onClick={() => requestSort('date')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Fecha {sortConfig.key === 'date' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
        <button onClick={() => requestSort('labor_cost')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Mano de Obra {sortConfig.key === 'labor_cost' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
        <button onClick={() => requestSort('total_value')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Valor Total {sortConfig.key === 'total_value' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
      </div>


      <div className="overflow-x-auto">
        <div className="sm:hidden">
          {sortedAndFilteredServices.map(service => {
            const client = clients.find(c => c.id === service.client_id);
            const motorcycle = motorcycles.find(m => m.id === service.motorcycle_id);
            return (
              <div key={service.id} className="bg-dark-secondary rounded-lg shadow-premium-md border border-accent-premium mb-4 p-4">
                <h3 className="text-xl font-semibold text-light-primary font-display mb-2">{client?.name || 'Cliente Desconocido'}</h3>
                <p className="text-light-primary font-body mb-1"><span className="font-semibold">Fecha:</span> {new Date(service.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                <p className="text-light-primary font-body mb-1"><span className="font-semibold">Moto:</span> {motorcycle ? `${motorcycle.make || 'Desconocida'} ${motorcycle.model || 'N/A'}` : 'Desconocida'}</p>
                <p className="text-light-primary font-body mb-1"><span className="font-semibold">Tipo:</span> {service.service_type}</p>
                <p className="text-light-primary font-body mb-1"><span className="font-semibold">Mano de Obra:</span> <span className="font-mono">${parseFloat(service.labor_cost).toLocaleString('es-CO')}</span></p>
                <p className="text-light-primary font-body"><span className="font-semibold">Valor Total:</span> <span className="font-mono">${parseFloat(service.total_value).toLocaleString('es-CO')}</span></p>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => handleEditService(service)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                  <button onClick={() => confirmDeleteService(service.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                </div>
              </div>
            )})}
          {sortedAndFilteredServices.length === 0 && <p className="text-light-primary text-center font-body">No hay servicios en el historial.</p>}
        </div>

        <table className="min-w-full table-fixed bg-dark-secondary rounded-lg shadow-premium-md border-separate border-spacing-0 hidden sm:table">
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
                Tipo de Servicio
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
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{motorcycle ? `${motorcycle.make || 'Desconocida'} ${motorcycle.model || 'Desconocida'}` : 'Desconocida'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${parseFloat(service.labor_cost).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${parseFloat(service.total_value).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{service.service_type}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditService(service)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                      <button onClick={() => confirmDeleteService(service.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                    </div>
                  </td>
                </tr>
              )})}
          </tbody>
          <tfoot className="bg-dark-secondary hidden sm:table-footer-group">
            <tr>
              <td colSpan="7" className="px-4 py-3 rounded-b-lg">
                {sortedAndFilteredServices.length === 0 && <p className="text-light-primary text-center font-body">No hay servicios en el historial.</p>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

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
              setIsStockAlertOpen={setIsStockAlertOpen} // Pass setIsStockAlertOpen
              setStockAlertMessage={setStockAlertMessage} // Pass setStockAlertMessage
            />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteService}
        title="Eliminar Servicio"
        message="¿Estás seguro de que quieres eliminar este servicio del historial?"
      />
      <StockAlertModal
        isOpen={isStockAlertOpen}
        onClose={() => setIsStockAlertOpen(false)}
        message={stockAlertMessage}
      />
    </div>
  );
};

export default ServiceHistory;


const ServiceModal = ({ isOpen, onClose, onSubmit, serviceFormData, setServiceFormData, clients, motorcycles, inventory, currentService, setIsStockAlertOpen, setStockAlertMessage }) => { // Receive setIsStockAlertOpen and setStockAlertMessage as props
  if (!isOpen) return null;

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [motorcycleSearchTerm, setMotorcycleSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showMotorcycleDropdown, setShowMotorcycleDropdown] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [quantities, setQuantities] = useState({});


  useEffect(() => {
    const initialQuantities = {};
    serviceFormData.productsUsed.forEach(product => {
      initialQuantities[product.productId] = product.quantity;
    });
    setQuantities(initialQuantities);
  }, [serviceFormData.productsUsed]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddProductToService = (productId, quantityToAdd) => {
    const productToAdd = inventory.find(p => p.id === parseInt(productId));
    if (!productToAdd) {
      setStockAlertMessage('Producto no encontrado.'); // Set modal message
      setIsStockAlertOpen(true); // Open stock alert modal
      return;
    }
    const parsedQuantity = parseInt(quantityToAdd, 10);
    if (!parsedQuantity || parsedQuantity <= 0) {
      setStockAlertMessage("Por favor, ingresa una cantidad válida."); // Set modal message
      setIsStockAlertOpen(true); // Open stock alert modal
        return;
    }

    if (productToAdd.quantity < parsedQuantity) {
      setStockAlertMessage(`No hay suficiente stock de ${productToAdd.name} en inventario. Stock disponible: ${productToAdd.quantity}`); // Set modal message
      setIsStockAlertOpen(true); // Open stock alert modal
      return;
    }


    const existingProductIndex = serviceFormData.productsUsed.findIndex(p => p.productId === productId);

    if (existingProductIndex > -1) {
      const updatedProductsUsed = [...serviceFormData.productsUsed];
      updatedProductsUsed[existingProductIndex] = { ...updatedProductsUsed[existingProductIndex], quantity: updatedProductsUsed[existingProductIndex].quantity + parsedQuantity };
      setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
      setQuantities({...quantities, [productId]: updatedProductsUsed[existingProductIndex].quantity})
    } else {
      setServiceFormData({ ...serviceFormData, productsUsed: [...serviceFormData.productsUsed, { productId: productToAdd.id, quantity: parsedQuantity, price: productToAdd.price_sold, name: productToAdd.name }] });
      setQuantities({...quantities, [productId]: parsedQuantity})
    }
  };

  const handleRemoveProductFromService = (productId) => {
    const updatedProducts = serviceFormData.productsUsed.filter(p => p.productId !== productId);
    setServiceFormData({ ...serviceFormData, productsUsed: updatedProducts });
    const updatedQuantities = {...quantities};
    delete updatedQuantities[productId];
    setQuantities(updatedQuantities);
  };

  const handleUpdateProductQuantity = (productId, newQuantity) => {
    const productToAdd = inventory.find(p => p.id === productId);
    if (newQuantity > productToAdd.quantity) {
      setStockAlertMessage(`No hay suficiente stock de ${productToAdd.name} en inventario. Stock disponible: ${productToAdd.quantity}`); // Set modal message
      setIsStockAlertOpen(true); // Open stock alert modal
      return;
    }
    const updatedProductsUsed = serviceFormData.productsUsed.map(p =>
      p.productId === productId ? { ...p, quantity: newQuantity } : p
    );
    setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
    setQuantities({...quantities, [productId]: newQuantity});
  };


  const filteredClients = useMemo(() => clients.filter(client => client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())), [clients, clientSearchTerm]);
  const filteredMotorcycles = useMemo(() => motorcycles.filter(motorcycle => `${motorcycle.make} ${motorcycle.model} ${motorcycle.plate}`.toLowerCase().includes(motorcycleSearchTerm.toLowerCase()) && motorcycle.client_id === parseInt(serviceFormData.clientId)), [motorcycles, motorcycleSearchTerm, serviceFormData.clientId]);
  const filteredInventory = useMemo(() => inventory.filter(item => item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())), [inventory, inventorySearchTerm]);


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
                onClick={() => { setServiceFormData({...serviceFormData, motorcycleId: motorcycle.id}); setMotorcycleSearchTerm(`${motorcycle.make} ${motorcycle.model} (${motorcycle.plate || 'Sin Placa'})`); setShowMotorcycleDropdown(false); }}
              >
                {motorcycle.make} {motorcycle.model} ({motorcycle.plate || 'Sin Placa'})
              </li>
            ))}
            {filteredMotorcycles.length === 0 && motorcycleSearchTerm && (
              <li className="py-2 px-4 text-light-text">No se encontraron motos</li>
            )}
          </ul>
        )}
      </div>

      <div className="col-span-2 flex justify-end mt-6">
        <button type="submit" className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Guardar</button>
        <button type="button" onClick={onClose} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">Cancelar</button>
      </div>
      <StockAlertModal
        isOpen={isStockAlertOpen}
        onClose={() => setIsStockAlertOpen(false)}
        message={stockAlertMessage}
      />
    </form>
  )
}
