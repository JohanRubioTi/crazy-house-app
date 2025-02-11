import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatisticsPanel from './StatisticsPanel';

const MainPanel = ({ items, expenses: propExpenses, services: propServices, onUpdateExpenses }) => {
    const [expenses, setExpenses] = useState(propExpenses || []);
    const [services, setServices] = useState(propServices || []);
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
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [inventoryChartData, setInventoryChartData] = useState([]);
    const [chartView, setChartView] = useState('weekly');
    const expenseCategories = ['Repuestos', 'Combustible', 'Arriendo', 'Salarios', 'Marketing', 'Otros'];


    useEffect(() => {
        setExpenses(propExpenses || []);
    }, [propExpenses]);

    useEffect(() => {
        setServices(propServices || []);
    }, [propServices]);


    // Calculate total expenses and earnings based on chart data
    useEffect(() => {
        let calculatedTotalExpenses = 0;
        let calculatedTotalEarnings = 0;

        if (chartView === 'weekly') {
            const weeklyChartData = generateWeeklyChartData(expenses, services);
            calculatedTotalExpenses = weeklyChartData.reduce((acc, weekData) => acc + weekData.gastos, 0);
            calculatedTotalEarnings = weeklyChartData.reduce((acc, weekData) => acc + weekData.ganancias, 0);
        } else {
            const monthlyChartData = generateMonthlyChartData(expenses, services);
            calculatedTotalExpenses = monthlyChartData.reduce((acc, monthData) => acc + monthData.gastos, 0);
            calculatedTotalEarnings = monthlyChartData.reduce((acc, monthData) => acc + monthData.ganancias, 0);
        }

        setTotalExpenses(calculatedTotalExpenses);
        setEarnings(calculatedTotalEarnings);
    }, [expenses, services, chartView]);


    // Generate alerts
    useEffect(() => {
        const newAlerts = [];
        if (items) {
            items.forEach(item => {
                if (item.quantity < item.restockQuantity) {
                    newAlerts.push({
                        id: `stock-${item.id}`,
                        type: 'low-stock',
                        message: `Bajo stock de ${item.name} (${item.quantity} ${item.unitType} restantes)`,
                    });
                }
            });
        }
        setAlerts(newAlerts);
    }, [items]);

    // Generate chart data functions (weekly and monthly)
    const generateWeeklyChartData = (expensesData, servicesData) => {
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
                    ganancias: 0, // Initialize ganancias
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
                };
            }
            const productsValue = service.productsUsed.reduce((productAcc, product) => productAcc + (product.quantity * product.price), 0);
            weeklyData[weekKey].ganancias += service.laborCost + productsValue;
        });


        return Object.values(weeklyData).sort((a, b) => new Date(a.name.replace('Sem ', '') + '/' + a.name.split(' ')[1]) - new Date(b.name.replace('Sem ', '') + '/' + b.name.split(' ')[1]));
    };

    const generateMonthlyChartData = (expensesData, servicesData) => {
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
                };
            }
            const productsValue = service.productsUsed.reduce((productAcc, product) => productAcc + (product.quantity * product.price), 0);
            monthlyData[monthYear].ganancias += service.laborCost + productsValue;
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
            setChartData(generateWeeklyChartData(expenses, services));
            if (items) {
                const dummyInventoryData = items.map(item => ({
                    date: Date.now() - (Math.random() * 604800000),
                    quantity: item.quantity + Math.floor(Math.random() * 20) - 10,
                }));
                setInventoryChartData(generateWeeklyChartData(dummyInventoryData, [])); // Inventory chart only needs quantity, services not relevant here
            }
        } else {
            setChartData(generateMonthlyChartData(expenses, services));
            if (items) {
                const dummyInventoryData = items.map(item => ({
                    date: Date.now() - (Math.random() * 2592000000),
                    quantity: item.quantity + Math.floor(Math.random() * 50) - 25,
                }));
                setInventoryChartData(generateMonthlyChartData(dummyInventoryData, [])); // Inventory chart only needs quantity, services not relevant here
            }
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
            date: new Date(expense.date).toISOString().split('T')[0],
        });
        setCurrentExpense(expense);
        setIsExpenseModalOpen(true);
    };

    const handleExpenseSubmit = (e) => {
        e.preventDefault();
        if (!expenseFormData.description || expenseFormData.amount <= 0) {
            alert('Por favor, completa todos los campos obligatorios y asegúrate de que el monto sea válido.');
            return;
        }

        const expenseDataToSave = {
            ...expenseFormData,
            date: new Date(expenseFormData.date).getTime(),
        };

        let updatedExpenses;
        if (currentExpense) {
            updatedExpenses = expenses.map(ex => ex.id === currentExpense.id ? { ...ex, ...expenseDataToSave } : ex);
        } else {
            updatedExpenses = [...expenses, { id: Date.now(), ...expenseDataToSave }];
        }

        setExpenses(updatedExpenses);
        onUpdateExpenses(updatedExpenses);
        setIsExpenseModalOpen(false);
        setExpenseFormData({
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: '',
            itemId: null,
        });
    };

    const deleteExpense = (expenseId) => {
        const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
        setExpenses(updatedExpenses);
        onUpdateExpenses(updatedExpenses);
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
        <div className="main-panel p-4">
            <h1 className="text-2xl font-bold text-primary mb-4">Panel Principal</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Alerts */}
                <div className="bg-dark-bg p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-light-text mb-2">Alertas</h2>
                    <ul>
                        {alerts.map(alert => (
                            <li key={alert.id} className={`text-yellow-400 ${alert.type === 'low-stock' ? 'text-red-500' : ''}`}>
                                {alert.message}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Earnings & Expenses Summary */}
                <div className="bg-dark-bg p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-light-text mb-2">Resumen</h2>
                    <p className="text-green-500">Ganancias: ${earnings.toLocaleString('es-CO')}</p>
                    <p className="text-red-500">Gastos: ${totalExpenses.toLocaleString('es-CO')}</p>
                    <button onClick={addExpense} className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Añadir Gasto
                    </button>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-dark-bg p-4 rounded-lg shadow-md mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-light-text">Gráficos</h2>
                    <button
                        onClick={() => setChartView(chartView === 'weekly' ? 'monthly' : 'weekly')}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {chartView === 'weekly' ? 'Ver Mensual' : 'Ver Semanal'}
                    </button>
                </div>

                <h3 className="text-md font-semibold text-light-text mb-2">Gastos y Ganancias ({chartView === 'weekly' ? 'Semanal' : 'Mensual'})</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#4a5568', color: '#cbd5e0' }}
                          itemStyle={{ color: '#cbd5e0' }}
                        />
                        <Legend wrapperStyle={{ color: '#d1d5db' }}
                                 formatter={(value) => {
                                     if (value === 'ganancias') return 'Ganancias';
                                     if (value === 'gastos') return 'Gastos';
                                     return value;
                                 }}/>
                        <Line type="monotone" dataKey="ganancias" stroke="#82ca9d" name="Ganancias" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="gastos" stroke="#e74c3c" name="Gastos" />
                    </LineChart>
                </ResponsiveContainer>

                <h3 className="text-md font-semibold text-light-text mt-8 mb-2">Niveles de Inventario ({chartView === 'weekly' ? 'Semanal' : 'Mensual'})</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={inventoryChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: '#d1d5db' }} />
                        <YAxis tick={{ fill: '#d1d5db' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#4a5568', color: '#cbd5e0' }}
                          itemStyle={{ color: '#cbd5e0' }}
                        />
                        <Legend wrapperStyle={{ color: '#d1d5db' }}
                                formatter={(value) => {
                                    if (value === 'quantity') return 'Cantidad';
                                    return value;
                                }}/>
                        <Line type="monotone" dataKey="quantity" stroke="#68d391" name="Cantidad" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Current Inventory Levels */}
            {/* ... (rest of the component remains unchanged) */}
             <div className="bg-dark-bg p-4 rounded-lg shadow-md mb-4">
                <h2 className="text-lg font-semibold text-light-text mb-2">Niveles Actuales de Inventario</h2>
                <table className="w-full">
                    <thead>
                        <tr className="text-light-text">
                            <th className="px-4 py-2 text-left">Producto</th>
                            <th className="px-4 py-2 text-left">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items && items.map(item => (
                            <tr key={item.id} className="text-gray-400">
                                <td className="border px-4 py-2">{item.name}</td>
                                <td className="border px-4 py-2">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Statistical Analysis */}
            <StatisticsPanel items={items} expenses={expenses} services={services} />

            {/* Expenses Table */}
            {/* ... (rest of the component remains unchanged) */}

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-dark-overlay flex justify-center items-center">
                    <div className="bg-dark-bg rounded-lg p-8 w-full max-w-md">
                        <h2 className="text-xl font-bold text-light-text mb-4">{currentExpense ? 'Editar Gasto' : 'Añadir Gasto'}</h2>
                        <form onSubmit={handleExpenseSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">Descripción</label>
                                <input type="text" id="description" name="description" value={expenseFormData.description} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-light-text bg-darker-bg leading-tight focus:outline-none focus:shadow-outline" />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-gray-300 text-sm font-bold mb-2">Monto</label>
                                <input type="number" id="amount" name="amount" value={expenseFormData.amount} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-light-text bg-darker-bg leading-tight focus:outline-none focus:shadow-outline" />
                            </div>
                            <div>
                                <label htmlFor="date" className="block text-gray-300 text-sm font-bold mb-2">Fecha</label>
                                <input type="date" id="date" name="date" value={expenseFormData.date} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-light-text bg-darker-bg leading-tight focus:outline-none focus:shadow-outline" />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-gray-300 text-sm font-bold mb-2">Categoría</label>
                                <select id="category" name="category" value={expenseFormData.category} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-light-text bg-darker-bg leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="">Seleccionar Categoría</option>
                                    {expenseCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between">
                                <button type="submit" className="bg-primary hover:bg-primary-dark text-dark-text font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                    {currentExpense ? 'Guardar Gasto' : 'Añadir Gasto'}
                                </button>
                                <button type="button" onClick={closeExpenseModal} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
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
