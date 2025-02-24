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
          inventoryRevenue: 0,
          inventoryExpenses: 0 // New category for inventory expenses
        });
      }
      monthMap.get(monthKey).expenses += parseFloat(expense.amount);
    });

    // Process inventory purchase expenses
    items.forEach(item => {
      const date = new Date(item.updated_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: `${date.toLocaleString('es-CO', { month: 'short' })} ${date.getFullYear()}`,
          expenses: 0,
          servicesRevenue: 0,
          inventoryRevenue: 0,
          inventoryExpenses: 0 // Initialize inventory expenses
        });
      }
      monthMap.get(monthKey).inventoryExpenses += (item.price_bought * item.quantity); // Accumulate inventory expenses
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
          inventoryRevenue: 0,
          inventoryExpenses: 0
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
          inventoryRevenue: 0,
          inventoryExpenses: 0
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

  // Add inventory expenses to expense categories
  let inventoryBuyExpenses = 0;
  items.forEach(item => {
    inventoryBuyExpenses += (item.price_bought * item.quantity);
  });
  expenseCategories['Compra de Inventario'] = inventoryBuyExpenses;


  // Process inventory data for value distribution
  const inventoryValueData = items.map(item => ({
    name: item.name,
    value: item.quantity * item.price_sold, // Calculate total value for each item
    fill: item.quantity < item.restock_quantity ? '#FCA5A5' : '#86EFAC' // Premium error and success colors
  }));


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Revenue/Expenses Line Chart */}
      <div className="bg-dark-secondary p-4 rounded-xl h-64 shadow-premium-md border border-accent-premium">
        <h3 className="text-light-primary mb-2 font-display text-xl font-semibold">Tendencias Financieras</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={processTimeData()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="month" stroke="#CBD5E0" tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <YAxis stroke="#CBD5E0" tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`} tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <Tooltip
              contentStyle={{ backgroundColor: '#334155', border: 'none', fontFamily: 'Lato' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Legend wrapperStyle={{ color: '#CBD5E0', fontFamily: 'Lato', fontSize: '0.9rem' }}/>
            <Line
              type="monotone"
              dataKey="servicesRevenue"
              name="Ingresos Servicios"
              stroke="#86EFAC" // Premium success color
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="inventoryRevenue"
              name="Inventario Potencial"
              stroke="#FFC658" // Highlight premium color, changed to #FFC658
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Gastos Operativos"
              stroke="#FCA5A5" // Premium error color
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
             <Line
              type="monotone"
              dataKey="inventoryExpenses"
              name="Gastos Inventario"
              stroke="#9CA3AF" // Gray color for inventory expenses
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Categories Bar Chart */}
      <div className="bg-dark-secondary p-4 rounded-xl h-64 shadow-premium-md border border-accent-premium">
        <h3 className="text-light-primary mb-2 font-display text-xl font-semibold">Distribución de Gastos</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="name" stroke="#CBD5E0" tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <YAxis stroke="#CBD5E0" tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`} tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <Tooltip
              contentStyle={{ backgroundColor: '#334155', border: 'none', fontFamily: 'Lato' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Bar
              dataKey="value"
              fill="#FCA5A5" // Premium error color
              name="Gastos por Categoría"
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Value Distribution Bar Chart */}
      <div className="bg-dark-secondary p-4 rounded-xl h-64 shadow-premium-md border border-accent-premium">
        <h3 className="text-light-primary mb-2 font-display text-xl font-semibold">Valor de Inventario por Producto</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={inventoryValueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="name" stroke="#CBD5E0" tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <YAxis stroke="#CBD5E0" tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`} tick={{fontFamily: 'Lato', fontSize: '0.8rem'}}/>
            <Tooltip
              contentStyle={{ backgroundColor: '#334155', border: 'none', fontFamily: 'Lato' }}
              formatter={(value) => `$${value.toLocaleString('es-CO')}`}
            />
            <Bar
              dataKey="value"
              name="Valor Inventario"
              barSize={20}
              label={{ position: 'top', formatter: (value) => `$${(value/1000).toFixed(0)}k`, fill: '#CBD5E0', fontFamily: 'Lato', fontSize: '0.8rem' }}
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
