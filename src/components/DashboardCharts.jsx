import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAtom } from 'jotai';
import { expensesAtom, servicesAtom, inventoryItemsAtom } from '../atoms';

const DashboardCharts = () => {
    const [expenses] = useAtom(expensesAtom);
    const [services] = useAtom(servicesAtom);
    const [items] = useAtom(inventoryItemsAtom);

  // Process data for time-based charts (group by month)
  const processTimeData = () => {
    const monthMap = new Map();

    // Process expenses
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: `${date.toLocaleString('es-CO', { month: 'short' })} ${date.getFullYear()}`,
          expenses: 0,
          servicesRevenue: 0,
          inventoryRevenue: 0
        });
      }
      monthMap.get(monthKey).expenses += parseFloat(expense.amount);
    });

    // Process services
    services.forEach(service => {
      const date = new Date(service.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: `${date.toLocaleString('es-CO', { month: 'short' })} ${date.getFullYear()}`,
          expenses: 0,
          servicesRevenue: 0,
          inventoryRevenue: 0
        });
      }

      const serviceRevenue = service.labor_cost +
        service.productsUsed.reduce((acc, p) => acc + (p.quantity * p.price), 0);

      monthMap.get(monthKey).servicesRevenue += serviceRevenue;
    });

    // Process inventory potential revenue
    items.forEach(item => {
      const date = new Date(item.updated_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: `${date.toLocaleString('es-CO', { month: 'short' })} ${date.getFullYear()}`,
          expenses: 0,
          servicesRevenue: 0,
          inventoryRevenue: 0
        });
      }
      monthMap.get(monthKey).inventoryRevenue += item.quantity * item.price_sold;
    });

    return Array.from(monthMap.values()).sort((a, b) =>
      new Date(a.month) - new Date(b.month)
    );
  };

  // Process expense categories
  const expenseCategories = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Otros';
    acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {});

  // Process inventory data for value distribution
  const inventoryValueData = items.map(item => ({
    name: item.name,
    value: item.quantity * item.price_sold, // Calculate total value for each item
    fill: item.quantity < item.restock_quantity ? '#ff3c3c' : '#3cff99' // Keep color logic
  }));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Revenue/Expenses Line Chart */}
      <div className="bg-dark-bg p-4 rounded-lg h-64">
        <h3 className="text-light-text mb-2">Tendencias Financieras</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={processTimeData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#f0f0f0" />
            <YAxis stroke="#f0f0f0" stroke="#f0f0f0"/>
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Legend wrapperStyle={{ color: '#f0f0f0' }}/>
            <Line
              type="monotone"
              dataKey="servicesRevenue"
              name="Ingresos Servicios"
              stroke="#3cff99"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="inventoryRevenue"
              name="Inventario Potencial"
              stroke="#f5a623"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Gastos"
              stroke="#ff3c3c"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Categories Bar Chart */}
      <div className="bg-dark-bg p-4 rounded-lg h-64">
        <h3 className="text-light-text mb-2">Distribución de Gastos</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#f0f0f0" />
            <YAxis stroke="#f0f0f0" tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Bar
              dataKey="value"
              fill="#ff3c3c"
              name="Gastos por Categoría"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Value Distribution Bar Chart */}
      <div className="bg-dark-bg p-4 rounded-lg h-64">
        <h3 className="text-light-text mb-2">Valor de Inventario por Producto</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={inventoryValueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#f0f0f0" />
            <YAxis stroke="#f0f0f0" tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Bar
              dataKey="value"
              name="Valor Inventario"
              barSize={20}
              label={{ position: 'top', formatter: (value) => `$${(value/1000).toFixed(0)}k` }}
            >
              {inventoryValueData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
