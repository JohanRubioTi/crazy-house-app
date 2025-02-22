import React, { useState } from 'react';
import { insertExpense } from '../supabaseService';

const AddExpenseModal = ({ isOpen, onClose, onExpenseAdded }) => {
  const [expenseFormData, setExpenseFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseFormData({ ...expenseFormData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await insertExpense(expenseFormData);
      onExpenseAdded();
      onClose();
    } catch (err) {
      setError(err);
      alert('Error al añadir gasto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium">
        <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">Añadir Nuevo Gasto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Descripción</label>
            <input type="text" id="description" name="description" value={expenseFormData.description} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
          </div>
          <div>
            <label htmlFor="amount" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Monto</label>
            <input type="number" id="amount" name="amount" value={expenseFormData.amount} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
          </div>
          <div>
            <label htmlFor="date" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Fecha</label>
            <input type="date" id="date" name="date" value={expenseFormData.date} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
          </div>
          <div>
            <label htmlFor="category" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Categoría</label>
            <input type="text" id="category" name="category" value={expenseFormData.category} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
          </div>
          <div className="flex justify-between mt-6">
            <button type="submit" disabled={loading} className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
              {loading ? 'Añadiendo...' : 'Añadir Gasto'}
            </button>
            <button type="button" onClick={onClose} className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
              Cancelar
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
