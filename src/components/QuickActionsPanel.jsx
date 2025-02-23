import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import AddClientModal from './AddClientModal';
    import AddProductModal from './AddProductModal';
    import { useAtom } from 'jotai';
    import { clientsAtom, servicesAtom, inventoryItemsAtom, motorcyclesAtom } from '../atoms';
    import { insertClient } from '../supabaseService';
    import ServiceModal from './ServiceModal';
    // Import icons
    import { FaUserPlus, FaBoxOpen, FaWrench, FaHistory } from 'react-icons/fa';

    const QuickActionsPanel = () => {
      const navigate = useNavigate();
      const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
      const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
      const [isRegisterServiceModalOpen, setIsRegisterServiceModalOpen] = useState(false);
      const [clientFormData, setClientFormData] = useState({ name: '', contact: '' });
      const [currentClient, setCurrentClient] = useState(null);
      const [clients, setClients] = useAtom(clientsAtom);
      const [services, setServices] = useAtom(servicesAtom);
      const [inventory, setInventory] = useAtom(inventoryItemsAtom);
      const [motorcycles, setMotorcycles] = useAtom(motorcyclesAtom);
      const [serviceFormData, setServiceFormData] = useState({
        clientId: '',
        motorcycleId: '',
        laborCost: 0,
        productsUsed: [],
        totalValue: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
        serviceType: '',
        kilometers: 0,
      });
      const [currentService, setCurrentService] = useState(null); // Probably not needed here

      const handleClientSubmitFromQuickAction = async (e) => {
        e.preventDefault();
        if (!clientFormData.name || !clientFormData.contact) {
          alert('Por favor, completa todos los campos obligatorios del cliente.');
          return;
        }

        try {
          await insertClient({ name: clientFormData.name, contact: clientFormData.contact });
          setClients(prevClients => [...prevClients, { ...clientFormData, id: Date.now() }]);
          setIsAddClientModalOpen(false);
          setClientFormData({ name: '', contact: '' });
          alert('Cliente agregado exitosamente!');
        } catch (err) {
          console.error('Error adding client:', err);
          alert('Error al agregar cliente: ' + err.message);
        }
      };

      const handleServiceSubmitFromQuickAction = async (e) => {
        e.preventDefault();
        // Placeholder: Adapt your service submission logic here
        alert('Servicio registrado (placeholder)');
        setIsRegisterServiceModalOpen(false);
      };

      return (
        <div className="quick-actions-panel">
          <h2 className="text-lg font-semibold text-highlight-premium mb-3 font-display flex items-center">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setIsAddClientModalOpen(true)}
              className="bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center"
            >
              <FaUserPlus className="mr-2" /> Añadir Cliente
            </button>
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center"
            >
              <FaBoxOpen className="mr-2" /> Añadir Producto
            </button>
            <button
              onClick={() => setIsRegisterServiceModalOpen(true)}
              className="bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center"
            >
              <FaWrench className="mr-2" /> Registrar Servicio
            </button>
            <button
              onClick={() => navigate('/service-history')}
              className="bg-button-neutral hover:bg-button-neutral-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium justify-center flex items-center"
            >
              <FaHistory className="mr-2" /> Ver Historial
            </button>
          </div>

          <AddClientModal
            isOpen={isAddClientModalOpen}
            onClose={() => setIsAddClientModalOpen(false)}
            currentClient={currentClient}
            clientFormData={clientFormData}
            setClientFormData={setClientFormData}
            handleClientSubmit={handleClientSubmitFromQuickAction}
          />
          <AddProductModal
            isOpen={isAddProductModalOpen}
            onClose={() => setIsAddProductModalOpen(false)}
          />

          {isRegisterServiceModalOpen && (
            <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50">
              <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-2xl shadow-lg border border-accent-premium" style={{ marginTop: '20px', marginBottom: '70px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
                <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">Agregar Servicio</h2>
                <ServiceModal
                  isOpen={isRegisterServiceModalOpen}
                  onClose={() => setIsRegisterServiceModalOpen(false)}
                  onSubmit={handleServiceSubmitFromQuickAction}
                  serviceFormData={serviceFormData}
                  setServiceFormData={setServiceFormData}
                  clients={clients}
                  motorcycles={motorcycles}
                  inventory={inventory}
                  currentService={currentService}
                />
              </div>
            </div>
          )}
        </div>
      );
    };

    export default QuickActionsPanel;
