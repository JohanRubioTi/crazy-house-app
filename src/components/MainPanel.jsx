import React, { useState, useEffect } from 'react';
    import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
    import StatisticsPanel from './StatisticsPanel';
    import { useAtom } from 'jotai';
    import { inventoryItemsAtom, expensesAtom, servicesAtom } from '../atoms';
    import { insertExpense, updateExpense, deleteExpense } from '../supabaseService';
    import QuickActionsPanel from './QuickActionsPanel'; // Import QuickActionsPanel
    // Import icons
    import { FaSignOutAlt, FaPlusCircle, FaChartLine, FaList, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa';


    const MainPanel = ({ onLogout }) => {
        const [expenses, setExpenses] = useAtom(expensesAtom);
        const [services, setServices] = useAtom(servicesAtom);
        const [items] = useAtom(inventoryItemsAtom);

        const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
        const [currentExpense, setCurrentExpense] = useState(null);
        const [expenseFormData, setExpenseFormData] = useState({
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            itemId: null,
        });
        const [alerts, setAlerts] = useState([]);
        const [earnings, setEarnings] = useState(0);
        const [potentialRevenue, setPotentialRevenue] = useState(0);
        const [totalExpenses, setTotalExpenses] = useState(0);
        const [chartData, setChartData] = useState([]);
        const [chartView, setChartView] = useState('weekly');
        const expenseCategories = ['Repuestos', 'Combustible', 'Arriendo', 'Salarios', 'Marketing', 'Otros'];

        // Calculate total expenses and earnings based on chart data
        useEffect(() => {
            let calculatedTotalExpenses = 0;
            let calculatedTotalEarnings = 0;
            let calculatedPotentialRevenue = 0;

            if (chartView === 'weekly') {
                const weeklyChartData = generateWeeklyChartData(expenses, services, items);
                calculatedTotalExpenses = weeklyChartData.reduce((acc, weekData) => acc + weekData.gastos, 0);
                calculatedTotalEarnings = weeklyChartData.reduce((acc, weekData) => acc + weekData.ganancias, 0);
                calculatedPotentialRevenue = weeklyChartData.reduce((acc, weekData) => acc + weekData.potentialRevenue, 0);
            } else {
                const monthlyChartData = generateMonthlyChartData(expenses, services, items);
                calculatedTotalExpenses = monthlyChartData.reduce((acc, monthData) => acc + monthData.gastos, 0);
                calculatedTotalEarnings = monthlyChartData.reduce((acc, monthData) => acc + monthData.ganancias, 0);
                calculatedPotentialRevenue = monthlyChartData.reduce((acc, monthData) => acc + monthData.potentialRevenue, 0);
            }

            setTotalExpenses(calculatedTotalExpenses);
            setEarnings(calculatedTotalEarnings);
            setPotentialRevenue(calculatedPotentialRevenue);
        }, [expenses, services, items, chartView]);


        // Generate alerts
        useEffect(() => {
            const newAlerts = [];
            if (items) {
                items.forEach(item => {
                    if (item.quantity < item.restock_quantity) {
                        newAlerts.push({
                            id: `stock-${item.id}`,
                            type: 'low-stock',
                            message: `Stock bajo de ${item.name} (${item.quantity} ${item.unit_type} restantes)`,
                        });
                    }
                });
            }
            setAlerts(newAlerts);
        }, [items]);

        // Generate chart data functions (weekly and monthly)
        const generateWeeklyChartData = (expensesData, servicesData, inventoryItems) => {
            const weeklyData = {};

            // Process expenses
            expensesData.forEach(expense => {
                const date = new Date(expense.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = {
                        name: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                        gastos: 0,
                        ganancias: 0,
                        potentialRevenue: 0, // Initialize potentialRevenue
                    };
                }
                weeklyData[weekKey].gastos += parseFloat(expense.amount);
            });

            // Process services for earnings
            servicesData.forEach(service => {
                const date = new Date(service.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = {
                        name: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                        gastos: 0,
                        ganancias: 0, // Initialize ganancias if not already there
                        potentialRevenue: 0,
                    };
                }
                const productsValue = service.productsUsed.reduce((productAcc, product) => productAcc + (product.quantity * product.price), 0);
                weeklyData[weekKey].ganancias += service.labor_cost + productsValue;
            });

            // Process inventory for potential revenue and expenses
            inventoryItems.forEach(item => {
                const date = new Date(item.updated_at);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;

                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = {
                        name: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                        gastos: 0,
                        ganancias: 0,
                        potentialRevenue: 0,
                    };
                }
                weeklyData[weekKey].potentialRevenue += item.quantity * item.price_sold; // Potential revenue
                weeklyData[weekKey].gastos += item.price_bought * item.quantity; // Purchase expense
            });


            return Object.values(weeklyData).sort((a, b) => new Date(a.name.replace('Sem ', '') + '/' + a.name.split(' ')[1]) - new Date(b.name.replace('Sem ', '') + '/' + b.name.split(' ')[1]));
        };

        const generateMonthlyChartData = (expensesData, servicesData, inventoryItems) => {
            const monthlyData = {};

            // Process expenses
            expensesData.forEach(expense => {
                const date = new Date(expense.date);
                const monthYear = `${date.toLocaleString('es-CO', { month: 'short' })}-${date.getFullYear()}`;

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = {
                        name: monthYear,
                        gastos: 0,
                        ganancias: 0, // Initialize ganancias
                        potentialRevenue: 0,
                    };
                }
                monthlyData[monthYear].gastos += parseFloat(expense.amount);
            });

            // Process services for earnings
            servicesData.forEach(service => {
                const date = new Date(service.date);
                const monthYear = `${date.toLocaleString('es-CO', { month: 'short' })}-${date.getFullYear()}`;

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = {
                        name: monthYear,
                        gastos: 0,
                        ganancias: 0, // Initialize ganancias if not already there
                        potentialRevenue: 0,
                    };
                }
                const productsValue = service.productsUsed.reduce((productAcc, product) => productAcc + (product.quantity * product.price), 0);
                monthlyData[monthYear].ganancias += service.labor_cost + productsValue;
            });

            // Process inventory for potential revenue and expenses
            inventoryItems.forEach(item => {
                const date = new Date(item.updated_at);
                const monthYear = `${date.toLocaleString('es-CO', { month: 'short' })}-${date.getFullYear()}`;

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = {
                        name: monthYear,
                        gastos: 0,
                        ganancias: 0,
                        potentialRevenue: 0,
                    };
                }
                monthlyData[monthYear].potentialRevenue += item.quantity * item.price_sold; // Potential revenue
                monthlyData[monthYear].gastos += item.price_bought * item.quantity; // Purchase expense
            });


            return Object.values(monthlyData).sort((a, b) => {
                const [aMonth, aYear] = a.name.split('-');
                const [bMonth, bYear] = b.name.split('-');
                const aDate = new Date(`${aYear}-${aMonth}-01`);
                const bDate = new Date(`${bYear}-${bMonth}-01`);
                return aDate - bDate;
            });
        };


        // Update chart data based on view and expenses/services
        useEffect(() => {
            if (chartView === 'weekly') {
                setChartData(generateWeeklyChartData(expenses, services, items));
            } else {
                setChartData(generateMonthlyChartData(expenses, services, items));
            }
        }, [expenses, services, items, chartView]);


        const addExpense = () => {
            setExpenseFormData({
                description: '',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                category: '',
                itemId: null,
            });
            setCurrentExpense(null);
            setIsExpenseModalOpen(true);
        };

        const editExpense = (expense) => {
            setExpenseFormData({
                ...expense,
                date: new Date(expense.date).toISOString().split('T')[0], // Ensure date is in correct format
            });
            setCurrentExpense(expense);
            setIsExpenseModalOpen(true);
        };

        const handleExpenseSubmit = async (e) => {
            e.preventDefault();
            if (!expenseFormData.description || expenseFormData.amount <= 0) {
                alert('Por favor, completa todos los campos obligatorios y asegúrate de que el monto sea válido.');
                return;
            }

            try {
                if (currentExpense) {
                    await updateExpense(currentExpense.id, expenseFormData);
                    // Optimistic Update
                    setExpenses(prevExpenses =>
                        prevExpenses.map(ex => (ex.id === currentExpense.id ? { ...ex, ...expenseFormData, date: expenseFormData.date } : ex))
                    );
                } else {
                    await insertExpense(expenseFormData);
                    // Optimistic Update
                    setExpenses(prevExpenses => [...prevExpenses, { ...expenseFormData, id: Date.now() }]); // Temporary ID
                }
            } catch (error) {
                console.error("Failed to update/insert expense", error);
                alert("Failed to update/insert expense: " + error.message);
            }

            setIsExpenseModalOpen(false);
            setExpenseFormData({
                description: '',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                category: '',
                itemId: null,
            });
        };

        const handleDeleteExpense = async (expenseId) => {
            try {
                await deleteExpense(expenseId);
                // Optimistic Update
                setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== expenseId));
            } catch (error) {
                console.error("Failed to delete expense", error);
                alert("Failed to delete expense: " + error.message);
            }
        };

        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setExpenseFormData(prevState => ({
                ...prevState,
                [name]: value,
            }));
        };

        const closeExpenseModal = () => {
            setIsExpenseModalOpen(false);
            setCurrentExpense(null);
        };


        return (
            <div className="main-panel p-6 bg-premium-gradient bg-cover bg-center animate-gradient-move shadow-premium-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-primary mb-6 font-graffiti tracking-wide">Panel de Administración</h1>
                    <button onClick={onLogout} className="logout-button bg-button-logout hover:bg-button-logout-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium flex items-center">
                        <FaSignOutAlt className="mr-2 mobile-logout-icon hidden md:flex" /> <span className="logout-button-text">Cerrar Sesión</span>
                    </button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {alerts.length > 0 && (
                      <div className="bg-dark-secondary p-5 rounded-xl shadow-premium-md border border-accent-premium">
                          <h2 className="text-lg font-semibold text-highlight-premium mb-3 font-display flex items-center"><FaExclamationTriangle className="mr-2" />Alertas</h2>
                          <ul className="list-none pl-0">
                              {alerts.map(alert => (
                                  <li key={alert.id} className={`text-light-primary mb-1 font-body ${alert.type === 'low-stock' ? 'text-error-premium' : 'text-success-premium'}`}>
                                      {alert.message}
                                  </li>
                              ))}
                          </ul>
                      </div>
                    )}


                    <div className="bg-dark-secondary p-5 rounded-xl shadow-premium-md border border-accent-premium">
                        <h2 className="text-lg font-semibold text-highlight-premium mb-3 font-display flex items-center"><FaMoneyBillWave className="mr-2"/>Resumen Financiero</h2>
                        <p className="text-success-premium text-xl font-semibold font-body">Ingresos por Servicios: <span className="text-light-primary font-mono">${earnings.toLocaleString('es-CO')}</span></p>
                        <p className="text-highlight-premium text-xl font-semibold font-body">Inventario Potencial: <span className="text-light-primary font-mono">${potentialRevenue.toLocaleString('es-CO')}</span></p>
                        <p className="text-error-premium text-xl font-semibold font-body">Gastos: <span className="text-light-primary font-mono">${totalExpenses.toLocaleString('es-CO')}</span></p>
                        <button onClick={addExpense} className="mt-4 bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-6 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium flex items-center">
                            <FaPlusCircle className="mr-2" /> Añadir Gasto
                        </button>
                    </div>

                    <div className={`bg-dark-secondary p-5 rounded-xl shadow-premium-md border border-accent-premium ${alerts.length > 0 ? '' : 'md:col-start-2'}`}>
                        <QuickActionsPanel />
                    </div>
                </div>

                <div className="bg-dark-secondary p-6 rounded-xl shadow-premium-md border border-accent-premium mb-6">
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold text-light-primary font-display flex items-center"><FaChartLine className="mr-2"/>Gráficos</h2>
                        <button
                            onClick={() => setChartView(chartView === 'weekly' ? 'monthly' : 'weekly')}
                            className="bg-button-neutral hover:bg-button-neutral-hover text-light-primary font-semibold py-2 px-4 rounded-lg shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium"
                        >
                            {chartView === 'weekly' ? 'Mensual' : 'Semanal'}
                        </button>
                    </div>

                    <h3 className="text-md font-semibold text-accent-premium mb-3 text-light-primary font-body">Ingresos vs Gastos ({chartView === 'weekly' ? 'Semanal' : 'Mensual'})</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis dataKey="name" tick={{ fill: '#CBD5E0', fontFamily: 'Lato', fontSize: '0.8rem' }}  />
                            <YAxis tick={{ fill: '#CBD5E0', fontFamily: 'Lato', fontSize: '0.8rem' }} tickFormatter={(value) => `$${value.toLocaleString('es-CO')}`}/>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#334155', color: '#CBD5E0', borderRadius: '0.5rem', fontFamily: 'Lato' }}
                              itemStyle={{ color: '#CBD5E0' }}
                              wrapperClassName="rounded-md shadow-lg"
                            />
                            <Legend wrapperStyle={{ color: '#CBD5E0', fontFamily: 'Lato', fontSize: '0.9rem' }}
                                     formatter={(value) => {
                                         if (value === 'ganancias') return 'Ingresos por Servicios';
                                         if (value === 'potentialRevenue') return 'Inventario Potencial';
                                         if (value === 'gastos') return 'Gastos';
                                         return value;
                                     }}/>
                            <Line type="monotone" dataKey="ganancias" stroke="#86EFAC" name="Ingresos por Servicios" activeDot={{ r: 6 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="potentialRevenue" stroke="#FFC658" name="Inventario Potencial" activeDot={{ r: 6 }} strokeWidth={2} />
                            <Line type="monotone" dataKey="gastos" stroke="#FCA5A5" name="Gastos" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-dark-secondary p-6 rounded-xl shadow-premium-md border border-accent-premium mb-6">
                    <h2 className="text-xl font-semibold text-light-primary font-display flex items-center"><FaList className="mr-2"/>Niveles de Inventario</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed">
                                <thead>
                                    <tr className="text-accent-premium text-light-primary">
                                        <th className="px-4 py-3 text-left text-sm font-semibold font-body">Producto</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold font-body">Cantidad</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold font-body">Reorden</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold font-body">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items && items.map(item => (
                                        <tr key={item.id} className="text-light-primary hover:bg-dark-primary transition-colors duration-200">
                                            <td className="px-4 py-3 font-body">{item.name}</td>
                                            <td className="px-4 py-3 font-body font-mono">{item.quantity} {item.unit_type}</td>
                                            <td className="px-4 py-3 font-body font-mono">{item.restock_quantity} {item.unit_type}</td>
                                            <td className="px-4 py-3 font-body">
                                                {item.quantity < item.restock_quantity ? (
                                                    <span className="text-error-premium font-semibold font-body">Bajo Stock</span>
                                                ) : (
                                                    <span className="text-success-premium font-semibold font-body">En Stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </div>


                <StatisticsPanel />

                {isExpenseModalOpen && (
                    <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center backdrop-blur-sm">
                        <div className="bg-dark-secondary bg-opacity-90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-lg border border-accent-premium">
                            <h2 className="text-2xl font-semibold text-light-primary mb-6 font-display">{currentExpense ? 'Editar Gasto' : 'Añadir Gasto'}</h2>
                            <form onSubmit={handleExpenseSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="description" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Descripción</label>
                                    <input type="text" id="description" name="description" value={expenseFormData.description} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Monto</label>
                                    <input type="number" id="amount" name="amount" value={expenseFormData.amount} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Fecha</label>
                                    <input type="date" id="date" name="date" value={expenseFormData.date} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body" />
                                </div>
                                <div>
                                    <label htmlFor="category" className="block text-accent-premium text-sm font-semibold mb-2 text-light-primary font-body">Categoría</label>
                                    <select id="category" name="category" value={expenseFormData.category} onChange={handleInputChange} className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-light-primary bg-dark-primary leading-tight focus:outline-none focus:shadow-outline border-accent-premium font-body">
                                        <option value="">Seleccionar Categoría</option>
                                        {expenseCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-between mt-6">
                                    <button type="submit" className="bg-button-affirmative hover:bg-button-affirmative-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                                        {currentExpense ? 'Guardar' : 'Añadir'}
                                    </button>
                                    <button type="button" onClick={closeExpenseModal} className="bg-button-neutral hover:bg-button-neutral-hover text-light-primary font-semibold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-button-premium hover:shadow-button-premium-hover transition-shadow duration-200 font-body border border-accent-premium">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    export default MainPanel;
