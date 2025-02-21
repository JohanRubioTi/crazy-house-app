import React from 'react';

const AddClientModal = ({ isOpen, onClose, currentClient, clientFormData, setClientFormData, handleClientSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm z-50"> {/* Added z-50 class here */}
      <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium">
        <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{currentClient ? 'Editar Cliente' : 'Agregar Cliente'}</h2>
        <form onSubmit={handleClientSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Nombre</label>
            <input type="text" id="name" name="name" value={clientFormData.name} onChange={e => setClientFormData({...clientFormData, name: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body"/>
          </div>
          <div>
            <label htmlFor="contact" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Teléfono</label>
            <input type="text" id="contact" name="contact" value={clientFormData.contact} onChange={e => setClientFormData({...clientFormData, contact: e.target.value})} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body"/>
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

export default AddClientModal;
