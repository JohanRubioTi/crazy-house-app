import React, { useState } from 'react';

const Inventory = ({ onUpdateItems, items: propItems }) => { // Receive onUpdateItems and initial items as props
  const [items, setItems] = useState(propItems || []); // Use propItems for initial state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'descending' });

  // Call onUpdateItems whenever items change
    React.useEffect(() => {
      onUpdateItems(items);
    }, [items, onUpdateItems]);

    React.useEffect(() => {
        setItems(propItems)
    }, [propItems])

  const addItem = () => {
    setItemFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
    setCurrentItem(null);
    setIsItemModalOpen(true);
  };

  const editItem = (item) => {
    setItemFormData({ ...item });
    setCurrentItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    if (!itemFormData.name || itemFormData.quantity < 0 || itemFormData.priceBought < 0 || itemFormData.priceSold < 0 || itemFormData.restockQuantity < 0) {
      alert('Por favor, completa todos los campos obligatorios y asegúrate de que las cantidades y precios sean válidos.');
      return;
    }

    const now = Date.now();
    if (currentItem) {
      setItems(items.map(i => i.id === currentItem.id ? { ...i, ...itemFormData, updatedAt: now } : i));
    } else {
      setItems([...items, { id: Date.now(), ...itemFormData, updatedAt: now }]);
    }
    setIsItemModalOpen(false);
    setItemFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });
  };

  const deleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId, amount) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, item.quantity + amount), updatedAt: Date.now() }; // Prevent negative quantity
      }
      return item;
    });
    setItems(updatedItems);
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

  const sortedAndFilteredItems = React.useMemo(() => {
    let sortedItems = [...items];

    if (searchTerm) {
      sortedItems = sortedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unitType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      sortedItems.sort((a, b) => {
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

    return sortedItems;
  }, [items, searchTerm, sortConfig]);

  return (
    <div className="inventory p-4">
      <h1 className="text-2xl font-bold text-primary mb-4">Inventario</h1>

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

      <button onClick={addItem} className="bg-primary text-white px-4 py-2 rounded mb-4">Agregar Ítem</button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndFilteredItems.map(item => (
          <div key={item.id} className="bg-dark-bg p-4 rounded-lg shadow-md">
            <h2 className="text-xl text-light-text">{item.name}</h2>
            <p className="text-gray-400">Cantidad:
              <button onClick={() => handleQuantityChange(item.id, -1)} className="bg-red-500 text-white px-2 py-1 rounded mx-1">-</button>
              {item.quantity}
              <button onClick={() => handleQuantityChange(item.id, 1)} className="bg-green-500 text-white px-2 py-1 rounded mx-1">+</button>
              ({item.unitType})
            </p>
            <p className="text-gray-400">Precio Compra: ${item.priceBought.toLocaleString('es-CO')}</p>
            <p className="text-gray-400">Precio Venta: ${item.priceSold.toLocaleString('es-CO')}</p>
            <p className="text-gray-400">Reorden: {item.restockQuantity}</p>

            <div className="mt-2">
              <button onClick={() => editItem(item)} className="bg-secondary text-black px-3 py-1 rounded mr-2">Editar</button>
              <button onClick={() => deleteItem(item.id)} className="bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-dark-bg p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">{currentItem ? 'Editar Ítem' : 'Agregar Ítem'}</h2>
            <form onSubmit={handleItemSubmit}>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="name">Nombre:</label>
                <input
                  type="text"
                  id="name"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="quantity">Cantidad:</label>
                <input
                  type="number"
                  id="quantity"
                  value={itemFormData.quantity}
                  onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseInt(e.target.value) || 0 })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="priceBought">Precio de Compra:</label>
                <input
                  type="number"
                  id="priceBought"
                  value={itemFormData.priceBought}
                  onChange={(e) => setItemFormData({ ...itemFormData, priceBought: parseFloat(e.target.value) || 0 })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="priceSold">Precio de Venta:</label>
                <input
                  type="number"
                  id="priceSold"
                  value={itemFormData.priceSold}
                  onChange={(e) => setItemFormData({ ...itemFormData, priceSold: parseFloat(e.target.value) || 0 })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="unitType">Tipo de Unidad:</label>
                <input
                  type="text"
                  id="unitType"
                  value={itemFormData.unitType}
                  onChange={(e) => setItemFormData({ ...itemFormData, unitType: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-light-text text-sm font-bold mb-2" htmlFor="restockQuantity">Cantidad de Reorden:</label>
                <input
                  type="number"
                  id="restockQuantity"
                  value={itemFormData.restockQuantity}
                  onChange={(e) => setItemFormData({ ...itemFormData, restockQuantity: parseInt(e.target.value) || 0 })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded mr-2">Guardar</button>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
