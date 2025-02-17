import React from 'react';

const QuickActionsPanel = () => {
    return (
        <div className="quick-actions-panel">
            <h2 className="text-lg font-semibold text-highlight-premium mb-3 font-display">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center">
                    Añadir Cliente
                </button>
                <button className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center">
                    Añadir Producto
                </button>
                <button className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center">
                    Registrar Servicio
                </button>
                <button className="bg-button-secondary hover:bg-button-secondary-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center">
                    Ver Historial
                </button>
            </div>
        </div>
    );
};

export default QuickActionsPanel;
