import React, { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { inventoryItemsAtom } from '../atoms';
import { fetchInventory, updateInventoryItem, insertInventoryItem, deleteInventoryItem, updateInventoryItemQuantity } from '../supabaseService';
import ConfirmationModal from './ConfirmationModal'; // Import confirmation modal

const Inventory = () => {
  const [items, setItems] = useAtom(inventoryItemsAtom);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ // Confirmation modal state
    isOpen: false,
    itemId: null,
  });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false); // Track initial load


    const loadInventory = useCallback(async () => {
        setLoading(true);
        try {
            const inventoryData = await fetchInventory(sortConfig);
            setItems(inventoryData);
            setHasLoadedOnce(true);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [sortConfig, setItems]);

  useEffect(() => {
    if (!hasLoadedOnce && items.length === 0) {
      loadInventory();
    } else if (!hasLoadedOnce && items.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [loadInventory, hasLoadedOnce, items.length]);


  const addItem = () => {
    setItemFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
    setCurrentItem(null);
    setIsItemModalOpen(true);
  };

  const editItem = (item) => {
    setItemFormData({
      name: item.name,
      quantity: item.quantity,
      priceBought: item.price_bought,
      priceSold: item.price_sold,
      unitType: item.unit_type,
      restockQuantity: item.restock_quantity,
    });
    setCurrentItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemFormData.name || itemFormData.quantity < 0 || itemFormData.priceBought < 0 || itemFormData.priceSold < 0 || itemFormData.restockQuantity < 0) {
      alert('Por favor, completa todos los campos obligatorios y asegúrate de que las cantidades y precios sean válidos.');
      return;
    }

    setLoading(true);
    try {
      if (currentItem) {
        // Update existing item
        await updateInventoryItem(currentItem.id, {
          name: itemFormData.name,
          quantity: itemFormData.quantity,
          price_bought: itemFormData.priceBought,
          price_sold: itemFormData.priceSold,
          unit_type: itemFormData.unitType,
          restock_quantity: itemFormData.restockQuantity,
        });
        //Optimistic Update
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === currentItem.id ? { ...item, ...itemFormData } : item
            )
        );

      } else {
        // Insert new item
        await insertInventoryItem({
          name: itemFormData.name,
          quantity: itemFormData.quantity,
          price_bought: itemFormData.priceBought,
          price_sold: itemFormData.priceSold,
          unit_type: itemFormData.unitType,
          restock_quantity: itemFormData.restockQuantity,
        });
        //Optimistic Update
        setItems(prevItems => [...prevItems,  {...itemFormData, id: Date.now()}]); // Assign a temporary ID
      }

      setIsItemModalOpen(false);
      setItemFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
      // No need to refetch, we're using optimistic updates
        loadInventory();

    } catch (error) {
      // Error handling is done in supabaseService
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteItem = (itemId) => {
    setDeleteConfirmation({
      isOpen: true,
      itemId: itemId,
    });
  };

  const handleDeleteItem = async () => {
    const itemId = deleteConfirmation.itemId;
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal


    setLoading(true);
    try {
      await deleteInventoryItem(itemId);
        //Optimistic Update
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      // Error handling is done in supabaseService
    } finally {
      setLoading(false);
      loadInventory();
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false }); // Close confirmation modal
  };


  const handleQuantityChange = async (itemId, amount) => {
    try {
        const itemToUpdate = items.find(item => item.id === itemId);
        const newQuantity = Math.max(0, itemToUpdate.quantity + amount);

        await updateInventoryItemQuantity(itemId, newQuantity);

        // Optimistic update
        setItems(prevItems =>
            prevItems.map(item => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
        );
    } catch (error) {
        // Handle error (error handling is already in the supabaseService function)
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
    // loadInventory will be called automatically due to the useEffect dependency
  };

  const sortedAndFilteredItems = React.useMemo(() => {
    let filteredItems = [...items]; // Work with a copy

    if (searchTerm) {
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unit_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

      filteredItems.sort((a, b) => {
          const keyA = a[sortConfig.key];
          const keyB = b[sortConfig.key];

          if (sortConfig.key.includes('price') || sortConfig.key.includes('quantity')) {
              // Numeric comparison
              if (sortConfig.direction === 'ascending') {
                  return keyA - keyB;
              } else {
                  return keyB - keyA;
              }
          } else {
              // String comparison (for 'name', 'unit_type', etc.)
              if (sortConfig.direction === 'ascending') {
                  return String(keyA).localeCompare(String(keyB));
              } else {
                  return String(keyB).localeCompare(String(keyA));
              }
          }
      });

    return filteredItems;
  }, [items, searchTerm, sortConfig]);

  if (loading) {
    return <div className="text-center"><div className="spinner mb-4"></div></div>;
  }

  if (error) {
    return <p className="text-light-text">Error: {error.message}</p>;
  }

  return (
    <div className="inventory p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
      <h1 className="text-3xl font-bold text-primary mb-6 font-graffiti tracking-wide">Inventario</h1>

      <div className="mb-4 flex flex-wrap gap-2 justify-between items-center sm:flex-nowrap">
        <div className="flex flex-grow gap-2 mb-2 sm:mb-0">
          <input
            type="text"
            placeholder="Buscar en inventario..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border border-gray-700 rounded-lg py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-primary font-body flex-grow"
          />
        </div>
        <button onClick={addItem} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap">
          Agregar Ítem
        </button>
      </div>

      <div className="sm:hidden flex justify-around mb-4">
        <button onClick={() => requestSort('name')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Nombre {sortConfig.key === 'name' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
        <button onClick={() => requestSort('quantity')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Cantidad {sortConfig.key === 'quantity' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
        <button onClick={() => requestSort('price_sold')} className="bg-dark-secondary hover:bg-dark-primary text-light-primary font-semibold py-2 px-3 rounded-lg shadow-sm">Precio Venta {sortConfig.key === 'price_sold' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}</button>
      </div>


      <div className="overflow-x-auto">
        <div className="sm:hidden">
          {sortedAndFilteredItems.map(item => (
            <div key={item.id} className="bg-dark-secondary rounded-lg shadow-premium-md border border-accent-premium mb-4 p-4">
              <h3 className="text-xl font-semibold text-light-primary font-display mb-2">{item.name}</h3>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Cantidad:</span> {item.quantity} {item.unit_type}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Precio Compra:</span> ${typeof item.price_bought === 'number' ? item.price_bought.toLocaleString('es-CO') : 'N/A'}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Precio Venta:</span> ${typeof item.price_sold === 'number' ? item.price_sold.toLocaleString('es-CO') : 'N/A'}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Unidad:</span> {item.unit_type}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Reorden:</span> {item.restock_quantity}</p>
              <p className="text-light-primary font-body"><span className="font-semibold">Reciente:</span> {new Date(item.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => editItem(item)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                <button onClick={() => confirmDeleteItem(item.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
              </div>
            </div>
          ))}
          {sortedAndFilteredItems.length === 0 && <p className="text-light-primary text-center font-body">No hay items en inventario.</p>}
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
                <button onClick={() => requestSort('quantity')} className="hover:text-highlight-premium focus:outline-none">
                  Cantidad {sortConfig.key === 'quantity' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('price_bought')} className="hover:text-highlight-premium focus:outline-none">
                  Precio Compra {sortConfig.key === 'price_bought' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('price_sold')} className="hover:text-highlight-premium focus:outline-none">
                  Precio Venta {sortConfig.key === 'price_sold' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('unit_type')} className="hover:text-highlight-premium focus:outline-none">
                  Unidad {sortConfig.key === 'unit_type' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <button onClick={() => requestSort('restock_quantity')} className="hover:text-highlight-premium focus:outline-none">
                  Reorden {sortConfig.key === 'restock_quantity' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
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
            {sortedAndFilteredItems.map(item => (
              <tr key={item.id} className="group hover:bg-dark-primary transition-colors duration-200">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{item.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{item.quantity} {item.unit_type}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${typeof item.price_bought === 'number' ? item.price_bought.toLocaleString('es-CO') : 'N/A'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${typeof item.price_sold === 'number' ? item.price_sold.toLocaleString('es-CO') : 'N/A'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{item.unit_type}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{item.restock_quantity}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{new Date(item.updated_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => editItem(item)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Editar</button>
                    <button onClick={() => confirmDeleteItem(item.id)} className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-dark-secondary hidden sm:table-footer-group">
            <tr>
              <td colSpan="8" className="px-4 py-3 rounded-b-lg">
                {sortedAndFilteredItems.length === 0 && <p className="text-light-primary text-center font-body">No hay items en inventario.</p>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm">
          <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium" style={{ marginTop: '20px', marginBottom: '70px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
            <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{currentItem ? 'Editar Ítem' : 'Agregar Ítem'}</h2>
            <form onSubmit={handleItemSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Nombre</label>
                <input type="text" id="name" name="name" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Cantidad</label>
                <input type="number" id="quantity" name="quantity" value={itemFormData.quantity} onChange={e => setItemFormData({...itemFormData, quantity: parseInt(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="priceBought" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Precio de Compra</label>
                <input type="number" id="priceBought" name="priceBought" value={itemFormData.priceBought} onChange={e => setItemFormData({...itemFormData, priceBought: parseFloat(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="priceSold" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Precio de Venta</label>
                <input type="number" id="priceSold" name="priceSold" value={itemFormData.priceSold} onChange={e => setItemFormData({...itemFormData, priceSold: parseFloat(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="unitType" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Tipo de Unidad</label>
                <input type="text" id="unitType" name="unitType" value={itemFormData.unitType} onChange={e => setItemFormData({...itemFormData, unitType: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div>
                <label htmlFor="restockQuantity" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Cantidad para Reordenar</label>
                <input type="number" id="restockQuantity" name="restockQuantity" value={itemFormData.restockQuantity} onChange={e => setItemFormData({...itemFormData, restockQuantity: parseInt(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
              </div>
              <div className="flex justify-between mt-6">
                <button type="submit" className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                  Guardar
                </button>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteItem}
        title="Eliminar Ítem"
        message="¿Estás seguro de que quieres eliminar este ítem de inventario?"
      />
    </div>
  );
};

export default Inventory;
