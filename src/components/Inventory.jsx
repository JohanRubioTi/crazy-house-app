import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { inventoryItemsAtom } from '../atoms';
import { fetchInventory, updateInventoryItem, insertInventoryItem, deleteInventoryItem, updateInventoryItemQuantity } from '../supabaseService';


const Inventory = () => {
  const [items, setItems] = useAtom(inventoryItemsAtom);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });

    const loadInventory = async () => {
        const inventoryData = await fetchInventory(sortConfig);
        setItems(inventoryData);
    };

  useEffect(() => {
    loadInventory();
  }, [sortConfig, setItems]);


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
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteInventoryItem(itemId);
        //Optimistic Update
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error) {
      // Error handling is done in supabaseService
    }
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


  return (
    <div className="inventory p-4 bg-street-gradient">
      <h1 className="text-2xl font-bold text-primary mb-4 font-graffiti">Inventario</h1>

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

      <button onClick={addItem} className="bg-secondary hover:bg-light-accent text-dark-bg font-bold py-2 px-4 rounded-full mb-4 font-sans">Agregar Ítem</button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndFilteredItems.map(item => (
          <div key={item.id} className="bg-transparent-black bg-opacity-70 backdrop-blur-sm p-4 rounded-lg shadow-md-dark border border-gray-700">
            <h2 className="text-xl text-light-text font-sans mb-2">{item.name}</h2>
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-400 font-sans">Cantidad:</p>
              <div className="flex items-center">
                <button onClick={() => handleQuantityChange(item.id, -1)} className="bg-primary hover:bg-light-accent text-light-text px-2 py-1 rounded-full mx-1 font-sans">-</button>
                <span className="text-light-text font-bold mx-1">{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item.id, 1)} className="bg-secondary hover:bg-light-accent text-dark-bg px-2 py-1 rounded-full mx-1 font-sans">+</button>
                <span className="text-gray-400 font-sans ml-1">({item.unit_type})</span>
              </div>
            </div>
            <p className="text-gray-400 font-sans">Precio Compra: <span className="text-light-text">${item.price_bought.toLocaleString('es-CO')}</span></p>
            <p className="text-gray-400 font-sans">Precio Venta: <span className="text-light-text">${item.price_sold.toLocaleString('es-CO')}</span></p>
            <p className="text-gray-400 font-sans">Reorden: <span className="text-light-text">{item.restock_quantity}</span></p>

            <div className="mt-4 flex justify-end">
              <button onClick={() => editItem(item)} className="bg-secondary hover:bg-light-accent text-dark-bg px-3 py-1 rounded-full mr-2 font-sans">Editar</button>
              <button onClick={() => handleDeleteItem(item.id)} className="bg-primary hover:bg-light-accent text-light-text px-3 py-1 rounded-full font-sans">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center backdrop-blur-sm">
          <div className="bg-transparent-black bg-opacity-90 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-md border border-accent">
            <h2 className="text-xl font-bold text-primary mb-4 font-graffiti">{currentItem ? 'Editar Ítem' : 'Agregar Ítem'}</h2>
            <form onSubmit={handleItemSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="quantity">Cantidad:</label>
                <input
                  type="number"
                  id="quantity"
                  value={itemFormData.quantity}
                  onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="priceBought">Precio de Compra:</label>
                <input
                  type="number"
                  id="priceBought"
                  value={itemFormData.priceBought}
                  onChange={(e) => setItemFormData({ ...itemFormData, priceBought: parseFloat(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="priceSold">Precio de Venta:</label>
                <input
                  type="number"
                  id="priceSold"
                  value={itemFormData.priceSold}
                  onChange={(e) => setItemFormData({ ...itemFormData, priceSold: parseFloat(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="unitType">Tipo de Unidad:</label>
                <input
                  type="text"
                  id="unitType"
                  value={itemFormData.unitType}
                  onChange={(e) => setItemFormData({ ...itemFormData, unitType: e.target.value })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2 font-sans" htmlFor="restockQuantity">Cantidad de Reorden:</label>
                <input
                  type="number"
                  id="restockQuantity"
                  value={itemFormData.restockQuantity}
                  onChange={(e) => setItemFormData({ ...itemFormData, restockQuantity: parseInt(e.target.value) || 0 })}
                  className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-bg font-sans"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-secondary hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full mr-2 font-sans">Guardar</button>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="bg-accent hover:bg-light-accent text-dark-bg px-4 py-2 rounded-full font-sans">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
