import React from 'react';
import DashboardCharts from './DashboardCharts';

const StatisticsPanel = ({ items, expenses, services }) => {
  // ... (existing calculations remain the same)

  return (
    <div className="bg-dark-bg p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-light-text mb-2">Análisis Estadístico</h2>
      
      {/* Existing stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... (existing stats content remains the same) */}
      </div>

      {/* New charts section */}
      <DashboardCharts 
        expenses={expenses} 
        services={services} 
        items={items} 
      />

      {/* Existing expense breakdown */}
      <div className="mt-4">
        {/* ... (existing expense list remains the same) */}
      </div>
    </div>
  );
};

export default StatisticsPanel;
