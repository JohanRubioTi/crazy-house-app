import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { inventoryItemsAtom } from '../atoms';
import { insertInventoryItem, updateInventoryItem } from '../supabaseService';

const AddProductModal = ({ isOpen, onClose, currentProduct,  }) => {
  if (!isOpen) return null;

  const [items, setItems] = useAtom(inventoryItemsAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productFormData, setProductFormData] = useState({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });


  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productFormData.name || productFormData.quantity < 0 || productFormData.priceBought < 0 || productFormData.priceSold < 0 || productFormData.restockQuantity < 0) {
      alert('Por favor, completa todos los campos obligatorios y asegúrate de que las cantidades y precios sean válidos.');
      return;
    }

    setLoading(true);
    try {
      if (currentProduct) {
        // Update existing product (not directly used in "Add Product" modal, but included for potential reuse)
        await updateInventoryItem(currentProduct.id, {
          name: productFormData.name,
          quantity: productFormData.quantity,
          price_bought: productFormData.priceBought,
          price_sold: productFormData.priceSold,
          unit_type: productFormData.unitType,
          restock_quantity: productFormData.restockQuantity,
        });
        // Optimistic Update - assuming currentProduct has an ID
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === currentProduct.id ? { ...item, ...productFormData } : item
            )
        );


      } else {
        // Insert new product
        await insertInventoryItem({
          name: productFormData.name,
          quantity: productFormData.quantity,
          price_bought: productFormData.priceBought,
          price_sold: productFormData.priceSold,
          unit_type: productFormData.unitType,
          restock_quantity: productFormData.restockQuantity,
        });
        // Optimistic Update
        setItems(prevItems => [...prevItems,  {...productFormData, id: Date.now()}]); // Assign a temporary ID
      }

      onClose(); // Close the modal after submit
      setProductFormData({ name: '', quantity: 0, priceBought: 0, priceSold: 0, unitType: 'unidad', restockQuantity: 0 });


    } catch (submitError) {
      setError(submitError);
      alert('Error al guardar el producto: ' + submitError.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium" style={{ marginTop: '20px', marginBottom: '70px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
        <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">Agregar Producto</h2>
        <form onSubmit={handleProductSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Nombre</label>
            <input type="text" id="name" name="name" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Cantidad</label>
            <input type="number" id="quantity" name="quantity" value={productFormData.quantity} onChange={e => setProductFormData({...productFormData, quantity: parseInt(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div>
            <label htmlFor="priceBought" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Precio de Compra</label>
            <input type="number" id="priceBought" name="priceBought" value={productFormData.priceBought} onChange={e => setProductFormData({...productFormData, priceBought: parseFloat(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div>
            <label htmlFor="priceSold" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Precio de Venta</label>
            <input type="number" id="priceSold" name="priceSold" value={productFormData.priceSold} onChange={e => setProductFormData({...productFormData, priceSold: parseFloat(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div>
            <label htmlFor="unitType" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Tipo de Unidad</label>
            <input type="text" id="unitType" name="unitType" value={productFormData.unitType} onChange={e => setProductFormData({...productFormData, unitType: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div>
            <label htmlFor="restockQuantity" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Cantidad para Reordenar</label>
            <input type="number" id="restockQuantity" name="restockQuantity" value={productFormData.restockQuantity} onChange={e => setProductFormData({...productFormData, restockQuantity: parseInt(e.target.value) || 0})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" required />
          </div>
          <div className="flex justify-between mt-6">
            <button type="submit" className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
              Guardar
            </button>
            <button type="button" onClick={onClose} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
