import React from 'react';
import { FaCog } from 'react-icons/fa';

const Loading = ({ message = "Cargando...", isLogin = false }) => {
  const backgroundClass = isLogin
    ? "bg-stylized-stripes animate-background-pan" // Login background
    : "bg-premium-gradient animate-gradient-move backdrop-blur-sm"; // Default app background with blur

  return (
    <div className={`fixed inset-0 ${backgroundClass} flex justify-center items-center z-50 loading-background`}>
      <div className="loading-modal bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium flex flex-col items-center justify-center">
        <div className="animate-spin text-light-primary mb-4" style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 0.5rem #9CA3AF)' }}>
          <FaCog  className="align-middle" />
        </div>
        <p className="text-light-primary font-body text-center">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
