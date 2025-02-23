import React from 'react';
import DashboardCharts from './DashboardCharts';
import { useAtom } from 'jotai';
import { inventoryItemsAtom, expensesAtom, servicesAtom } from '../atoms';
// Import icons
import { FaChartPie } from 'react-icons/fa';

const StatisticsPanel = () => {
  const [items] = useAtom(inventoryItemsAtom);
  const [expenses] = useAtom(expensesAtom);
  const [services] = useAtom(servicesAtom);

  return (
    <div className="bg-dark-bg p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-light-text mb-2 flex items-center"><FaChartPie className="mr-2"/>Análisis Estadístico</h2>

      {/* Existing stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ... (existing stats content remains the same) */}
      </div>

      {/* New charts section */}
      <DashboardCharts />

      {/* Existing expense breakdown */}
      <div className="mt-4">
        {/* ... (existing expense list remains the same) */}
      </div>
    </div>
  );
};

export default StatisticsPanel;
