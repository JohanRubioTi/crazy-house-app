import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { expensesAtom } from '../atoms';
import { fetchExpenses, deleteExpense } from '../supabaseService';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import ConfirmationModal from './ConfirmationModal';
import Loading from './Loading'; // Import Loading component
// Import icons
import { FaEdit, FaTrash, FaSearch, FaPlus, FaTextWidth, FaDollarSign, FaCalendarAlt, FaTag, FaTools } from 'react-icons/fa';

const Expenses = () => {
  const [expenses, setExpenses] = useAtom(expensesAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  // Removed sortConfig and setSortConfig
  const [searchTerm, setSearchTerm] = useState(''); // Search term state

  useEffect(() => {
    loadExpenses();
  }, []); // Removed sortConfig dependency

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Removed sortConfig from fetchExpenses call
      const fetchedExpenses = await fetchExpenses();
      setExpenses(fetchedExpenses);
    } catch (err) {
      setError(err);
      alert('Failed to load expenses! ' + err.message)
    } finally {
      setLoading(false);
    }
  };

  // Removed handleSort function

  const handleDeleteClick = (id) => {
    setExpenseToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteExpense = async () => {
    setIsDeleteModalOpen(false);
    if (expenseToDeleteId) {
      setLoading(true);
      try {
        await deleteExpense(expenseToDeleteId);
        setExpenses(expenses.filter(expense => expense.id !== expenseToDeleteId));
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense: ' + error.message);
      } finally {
        setLoading(false);
        setExpenseToDeleteId(null);
      }
    }
  };

  const cancelDeleteExpense = () => {
    setIsDeleteModalOpen(false);
    setExpenseToDeleteId(null);
  };

  const handleEditClick = (expense) => {
    setExpenseToEdit(expense);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredExpenses = expenses.filter(expense => {
    const searchText = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(searchText) ||
      expense.category.toLowerCase().includes(searchText) ||
      expense.amount.toString().includes(searchText) ||
      new Date(expense.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase().includes(searchText)
    );
  });


  if (loading) {
    return <Loading message="Cargando Gastos..." />; // Use Loading component
  }

  if (error) {
    return <div className="error">Error: {error.message}</div>;
  }

  return (
    <div className="service-history p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
      <h1 className="text-3xl font-bold text-primary mb-6 font-graffiti tracking-wide">Gastos</h1>

      <div className="mb-4 flex flex-wrap gap-2 justify-between items-center sm:flex-nowrap">
        <div className="flex flex-grow gap-2 mb-2 sm:mb-0 relative">
          <input
            type="text"
            placeholder="Buscar gastos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="shadow appearance-none border border-gray-700 rounded-lg py-2 px-3 text-light-text leading-tight focus:outline-none focus:shadow-outline bg-dark-primary font-body flex-grow pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-light-text" />
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium whitespace-nowrap flex items-center gap-2"
        >
          <FaPlus /> Agregar Gasto
        </button>
      </div>


      <div className="overflow-x-auto">
        <div className="sm:hidden">
          {filteredExpenses.map(expense => (
            <div key={expense.id} className="bg-dark-secondary rounded-lg shadow-premium-md border border-accent-premium mb-4 p-4">
              <h3 className="text-xl font-semibold text-light-primary font-display mb-2">{expense.description}</h3>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Monto:</span> ${expense.amount}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Fecha:</span> {new Date(expense.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p className="text-light-primary font-body mb-1"><span className="font-semibold">Categoría:</span> {expense.category}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => handleEditClick(expense)}
                  className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs flex items-center gap-1">
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(expense.id)}
                  className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs flex items-center gap-1">
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && <p className="text-light-primary text-center font-body">No hay gastos registrados.</p>}
        </div>

        <table className="min-w-full table-fixed bg-dark-secondary rounded-lg shadow-premium-md border-separate border-spacing-0 hidden sm:table">
          <thead className="bg-dark-secondary text-light-primary font-display sticky top-0">
            <tr className="rounded-t-lg">
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium rounded-tl-lg">
                <span className="flex items-center gap-2"><FaTextWidth /> Descripción</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <span className="flex items-center gap-2"><FaDollarSign /> Monto</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <span className="flex items-center gap-2"><FaCalendarAlt /> Fecha</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium">
                <span className="flex items-center gap-2"><FaTag /> Categoría</span>
              </th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold border-b border-accent-premium rounded-tr-lg">
                <span className="flex items-center gap-2"><FaTools /> Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-dark-secondary font-body text-light-primary">
            {filteredExpenses.map(expense => (
              <tr key={expense.id} className="group hover:bg-dark-primary transition-colors duration-200">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{expense.description}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">${expense.amount}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{new Date(expense.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium">{expense.category}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-normal border-b border-accent-premium text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(expense)}
                      className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs flex items-center gap-1">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(expense.id)}
                      className="bg-error-premium hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-3 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium text-xs flex items-center gap-1">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-dark-secondary hidden sm:table-footer-group">
            <tr>
              <td colSpan="5" className="px-4 py-3 rounded-b-lg">
                {filteredExpenses.length === 0 && <p className="text-light-primary text-center font-body">No hay gastos registrados.</p>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onExpenseAdded={loadExpenses} />
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        expense={expenseToEdit}
        onExpenseUpdated={loadExpenses}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteExpense}
        onConfirm={confirmDeleteExpense}
        title="Eliminar Gasto"
        message="¿Estás seguro de que quieres eliminar este gasto?"
      />
    </div>
  );
};


export default Expenses;
