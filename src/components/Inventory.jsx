import React, { useState, useEffect } from 'react';
    import { supabase } from '../supabaseClient';

    const Inventory = ({ onUpdateItems }) => {
      const [items, setItems] = useState([]);
      const [isItemModalOpen, setIsItemModalOpen] = useState(false);
      const [currentItem, setCurrentItem] = useState(null);
      const [itemFormData, setItemFormData] = useState({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
      const [searchTerm, setSearchTerm] = useState('');
      const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });

      const fetchInventory = async () => {
        try {
          let { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });

          if (error) {
            throw error;
          }

          if (data) {
            setItems(data);
            onUpdateItems(data);
          }
        } catch (error) {
          console.error('Error fetching inventory:', error);
          alert('Error fetching inventory: ' + error.message);
        }
      };

      useEffect(() => {
        fetchInventory();
      }, [sortConfig]); // Refetch when sorting changes

        useEffect(() => {
            onUpdateItems(items);
        }, [items, onUpdateItems]);

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
          const user = await supabase.auth.getUser();
          if (!user || !user.data || !user.data.user) {
            throw new Error("User not authenticated");
          }
          const userId = user.data.user.id;

          if (currentItem) {
            // Update existing item
            const { error } = await supabase
              .from('inventory_items')
              .update({
                name: itemFormData.name,
                quantity: itemFormData.quantity,
                price_bought: itemFormData.priceBought,
                price_sold: itemFormData.priceSold,
                unit_type: itemFormData.unitType,
                restock_quantity: itemFormData.restockQuantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentItem.id)
              .eq('user_id', userId);

            if (error) throw error;
            fetchInventory(); // Refetch to update the list
          } else {
            // Insert new item

            const { error } = await supabase
              .from('inventory_items')
              .insert([
                {
                  user_id: userId,
                  name: itemFormData.name,
                  quantity: itemFormData.quantity,
                  price_bought: itemFormData.priceBought,
                  price_sold: itemFormData.priceSold,
                  unit_type: itemFormData.unitType,
                  restock_quantity: itemFormData.restockQuantity,
                  updated_at: new Date().toISOString(),
                },
              ]);

            if (error) throw error;
            fetchInventory(); // Refetch to update the list
          }

          setIsItemModalOpen(false);
          setItemFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
        } catch (error) {
          console.error('Error saving item:', error);
          alert('Error saving item: ' + error.message);
        }
      };

      const deleteItem = async (itemId) => {
        try {
            const user = await supabase.auth.getUser();
            if (!user || !user.data || !user.data.user) {
                throw new Error("User not authenticated");
            }
            const userId = user.data.user.id;

          const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', itemId)
            .eq('user_id', userId);

          if (error) throw error;
          fetchInventory(); // Refetch to update the list
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Error deleting item: ' + error.message);
        }
      };

      const handleQuantityChange = async (itemId, amount) => {
          try {
              const user = await supabase.auth.getUser();
              if (!user || !user.data || !user.data.user) {
                  throw new Error("User not authenticated");
              }
              const userId = user.data.user.id;

              const itemToUpdate = items.find(item => item.id === itemId);
              const newQuantity = Math.max(0, itemToUpdate.quantity + amount);

              const { error } = await supabase
                  .from('inventory_items')
                  .update({
                      quantity: newQuantity,
                      updated_at: new Date().toISOString(),
                  })
                  .eq('id', itemId)
                  .eq('user_id', userId);

              if (error) throw error;

              // Update local state optimistically
              setItems(items.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

          } catch (error) {
              console.error('Error updating quantity:', error);
              alert('Error updating quantity: ' + error.message);
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
        // fetchInventory will be called automatically due to the useEffect dependency
      };

      const sortedAndFilteredItems = React.useMemo(() => {
        let filteredItems = items;

        if (searchTerm) {
          filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.unit_type.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // No need to sort here, as it's handled during fetch
        return filteredItems;
      }, [items, searchTerm]);


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
                  <button onClick={() => deleteItem(item.id)} className="bg-primary hover:bg-light-accent text-light-text px-3 py-1 rounded-full font-sans">Eliminar</button>
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
