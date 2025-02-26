import React, { useState, useMemo, useEffect } from 'react';
import Loading from './Loading'; // Import Loading component

const ServiceModal = ({ isOpen, onClose, onSubmit, serviceFormData, setServiceFormData, clients, motorcycles, inventory, currentService }) => {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [motorcycleSearchTerm, setMotorcycleSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showMotorcycleDropdown, setShowMotorcycleDropdown] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [quantities, setQuantities] = useState({});
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [filteredMotorcycles, setFilteredMotorcycles] = useState([]); // Store filtered motorcycles here
  const [loadingProducts, setLoadingProducts] = useState(false); // Loading state for product operations


  useEffect(() => {
    setClientSearchTerm('');
    setMotorcycleSearchTerm('');
    setInventorySearchTerm('');
    setShowClientDropdown(false);
    setShowMotorcycleDropdown(false);
    setShowInventoryDropdown(false);
    setSelectedClientId(null);
    setFilteredMotorcycles([]); // Reset filtered motorcycles
    setLoadingProducts(false); // Reset loading state

    const initialQuantities = {};
    serviceFormData.productsUsed.forEach(product => {
      initialQuantities[product.productId] = product.quantity;
    });
    setQuantities(initialQuantities);

    if (currentService) {
      const client = clients.find(c => c.id === currentService.client_id);
      const motorcycle = motorcycles.find(m => m.id === currentService.motorcycle_id);
      if (client) {
        setClientSearchTerm(client.name);
        setSelectedClientId(client.id);
      }
      if (motorcycle) setMotorcycleSearchTerm(`${motorcycle.make} ${motorcycle.model} (${motorcycle.plate || 'Sin Placa'})`);
    }
  }, [isOpen, serviceFormData.productsUsed, clients, motorcycles, currentService]);

  // Filter motorcycles *after* selectedClientId is updated
  useEffect(() => {
    if (selectedClientId) {
      const filtered = motorcycles.filter(motorcycle =>
        motorcycle.client_id === selectedClientId &&
        `${motorcycle.make} ${motorcycle.model} ${motorcycle.plate || 'Sin Placa'}`.toLowerCase().includes(motorcycleSearchTerm.toLowerCase())
      );
      setFilteredMotorcycles(filtered);
    } else {
      setFilteredMotorcycles([]); // Clear the list if no client is selected
    }
  }, [selectedClientId, motorcycles, motorcycleSearchTerm]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddProductToService = (productId, quantityToAdd) => {
    setLoadingProducts(true); // Start loading
    const productToAdd = inventory.find(p => p.id === parseInt(productId));
    if (!productToAdd) {
      alert('Producto no encontrado.');
      setLoadingProducts(false); // End loading
      return;
    }
    const parsedQuantity = parseInt(quantityToAdd, 10);
    if (!parsedQuantity || parsedQuantity <= 0) {
      alert("Por favor, ingresa una cantidad válida.");
      setLoadingProducts(false); // End loading
      return;
    }

    if (productToAdd.quantity < parsedQuantity) {
      alert(`No hay suficiente stock de ${productToAdd.name} en inventario. Stock disponible: ${productToAdd.quantity}`);
      setLoadingProducts(false); // End loading
      return;
    }

    const existingProductIndex = serviceFormData.productsUsed.findIndex(p => p.productId === productId);

    if (existingProductIndex > -1) {
      const updatedProductsUsed = [...serviceFormData.productsUsed];
      updatedProductsUsed[existingProductIndex] = { ...updatedProductsUsed[existingProductIndex], quantity: updatedProductsUsed[existingProductIndex].quantity + parsedQuantity };
      setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
      setQuantities({ ...quantities, [productId]: updatedProductsUsed[existingProductIndex].quantity });
    } else {
      setServiceFormData({ ...serviceFormData, productsUsed: [...serviceFormData.productsUsed, { productId: productToAdd.id, quantity: parsedQuantity, price: productToAdd.price_sold, name: productToAdd.name }] });
      setQuantities({ ...quantities, [productId]: parsedQuantity });
    }
    setLoadingProducts(false); // End loading
  };

  const handleRemoveProductFromService = (productId) => {
    setLoadingProducts(true); // Start loading
    const updatedProducts = serviceFormData.productsUsed.filter(p => p.productId !== productId);
    setServiceFormData({ ...serviceFormData, productsUsed: updatedProducts });
    const updatedQuantities = { ...quantities };
    delete updatedQuantities[productId];
    setQuantities(updatedQuantities);
    setLoadingProducts(false); // End loading
  };

  const handleUpdateProductQuantity = (productId, newQuantity) => {
    setLoadingProducts(true); // Start loading
    const productToAdd = inventory.find(p => p.id === productId);
    if (newQuantity > productToAdd.quantity) {
      alert(`No hay suficiente stock de ${productToAdd.name} en inventario. Stock disponible: ${productToAdd.quantity}`);
      setLoadingProducts(false); // End loading
      return;
    }
    const updatedProductsUsed = serviceFormData.productsUsed.map(p =>
      p.productId === productId ? { ...p, quantity: newQuantity } : p
    );
    setServiceFormData({ ...serviceFormData, productsUsed: updatedProductsUsed });
    setQuantities({ ...quantities, [productId]: newQuantity });
    setLoadingProducts(false); // End loading
  };

  const filteredClients = useMemo(() =>
    clients.filter(client => client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())),
    [clients, clientSearchTerm]
  );

  const filteredInventory = useMemo(() =>
    inventory.filter(item => item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase())),
    [inventory, inventorySearchTerm]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-2xl shadow-lg border border-accent-premium">
        {loadingProducts && <Loading message="Actualizando productos del servicio..." />} {/* Loading component */}
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-light-text text-sm font-semibold mb-2 font-body" htmlFor="clientId">Cliente:</label>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearchTerm}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                setShowClientDropdown(true);
                setSelectedClientId(null); // Reset selectedClientId when searching
                setServiceFormData(prevState => ({ ...prevState, clientId: '' }));
              }}
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
                    onClick={() => {
                      setSelectedClientId(client.id); // Update selectedClientId immediately
                      setClientSearchTerm(client.name);
                      setShowClientDropdown(false);
                      setServiceFormData(prevState => ({ ...prevState, clientId: client.id })); // Update serviceFormData *after* selection
                    }}
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
              onChange={(e) => {
                setMotorcycleSearchTerm(e.target.value);
                setShowMotorcycleDropdown(true);
                setServiceFormData(prevState => ({ ...prevState, motorcycleId: '' })); // Reset motorcycleId when searching
              }}
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
                    onClick={() => {
                      setServiceFormData(prevState => ({ ...prevState, motorcycleId: motorcycle.id }));
                      setMotorcycleSearchTerm(`${motorcycle.make} ${motorcycle.model} (${motorcycle.plate || 'Sin Placa'})`);
                      setShowMotorcycleDropdown(false);
                    }}
                  >
                    {motorcycle.make} {motorcycle.model} ({motorcycle.plate || 'Sin Placa'})
                  </li>
                ))}
                {filteredMotorcycles.length === 0 && (
                  <li className="py-2 px-4 text-light-text">No se encontraron motos</li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-light-text text-sm font-semibold mb-2 font-sans" htmlFor="laborCost">Valor Mano de Obra:</label>
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
              onChange={(e) => {
                setInventorySearchTerm(e.target.value);
                setShowInventoryDropdown(true);
                setSelectedInventoryProduct('');
              }}
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
                    onClick={() => {
                      setSelectedInventoryProduct(product.id);
                      setInventorySearchTerm(product.name);
                      setShowInventoryDropdown(false);
                      setNewProductQuantity(1);
                    }}
                  >
                    {product.name} ({product.quantity} disponibles)
                  </li>
                ))}
                {filteredInventory.length === 0 && inventorySearchTerm && (
                  <li className="py-2 px-4 text-light-text">No se encontraron productos</li>
                )}
              </ul>
            )}
            <ul>
              {serviceFormData.productsUsed.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between mb-1 font-sans">
                  <span>{product.name}</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpdateProductQuantity(product.productId, quantities[product.productId] - 1);
                      }}
                      className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold px-2 py-1 rounded-md shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantities[product.productId] !== undefined ? quantities[product.productId] : 0}
                      className="shadow appearance-none border border-gray-700 rounded w-16 mx-2 py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text text-center"
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value, 10);
                        if (!isNaN(newQuantity)) {
                          handleUpdateProductQuantity(product.productId, newQuantity);
                          setQuantities({ ...quantities, [product.productId]: newQuantity });
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUpdateProductQuantity(product.productId, quantities[product.productId] + 1);
                      }}
                      className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold px-2 py-1 rounded-md shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveProductFromService(product.productId)}
                      className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold px-2 py-1 rounded-md shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium ml-2 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-end">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (selectedInventoryProduct) {
                    handleAddProductToService(parseInt(selectedInventoryProduct), newProductQuantity);
                    setSelectedInventoryProduct('');
                    setInventorySearchTerm('');
                    setNewProductQuantity(1);
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
                value={newProductQuantity}
                className="shadow appearance-none border border-gray-700 rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans text-light-text ml-2"
                onChange={(e) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedInventoryProduct) {
                      handleAddProductToService(parseInt(selectedInventoryProduct), newProductQuantity);
                      setSelectedInventoryProduct('');
                      setInventorySearchTerm('');
                      setNewProductQuantity(1);
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
      </div>
    </div>
  );
};

export default ServiceModal;
