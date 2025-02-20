import React from 'react';

const StockAlertModal = ({ isOpen, onClose, message, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50">
      <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium">
        <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{title || 'Alerta de Inventario'}</h2>
        <p className="text-light-primary font-body mb-6">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-button-primary hover:bg-button-primary-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAlertModal;
