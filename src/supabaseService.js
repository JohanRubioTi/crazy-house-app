// Centralized Supabase interaction functions
import { supabase } from './supabaseClient';

// --- Inventory Functions (Existing) ---
export const fetchInventory = async (sortConfig) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    let { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId) // Apply user_id filter
      .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    alert('Error fetching inventory: ' + error.message);
    return [];
  }
};

export const updateInventoryItem = async (itemId, updates) => {
  try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
          throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;

    const { error } = await supabase
      .from('inventory_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating item:', error);
    alert('Error updating item: ' + error.message);
    throw error; // Re-throw to handle in component
  }
};

export const insertInventoryItem = async (itemData) => {
  try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
          throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;

    const { error } = await supabase
      .from('inventory_items')
      .insert([
        {
          user_id: userId,
          ...itemData,
          updated_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error inserting item:', error);
    alert('Error inserting item: ' + error.message);
    throw error; // Re-throw to handle in component
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
          throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Error deleting item: ' + error.message);
    throw error; // Re-throw to handle in component
  }
};

export const updateInventoryItemQuantity = async (itemId, newQuantity) => {
    try {
        const user = await supabase.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            throw new Error("User not authenticated");
        }
        const userId = user.data.user.id;

        const { error } = await supabase
            .from('inventory_items')
            .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .eq('user_id', userId);

        if (error) throw error;

    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Error updating quantity: ' + error.message);
        throw error; // Re-throw to handle in component

    }
};

// --- Client Functions ---

export const fetchClients = async (sortConfig) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id, name, contact, updated_at,
        motorcycles (
          id, make, model, plate, updated_at
        )
      `)
      .eq('user_id', userId)
      .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending', foreignTable: sortConfig.key === 'motorcycles.updated_at' ? 'motorcycles' : undefined });

    if (clientsError) throw clientsError;
    return clientsData || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    alert('Error fetching clients: ' + error.message);
    return [];
  }
};

export const updateClient = async (clientId, clientData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error: updateError } = await supabase
      .from('clients')
      .update({ ...clientData, updated_at: new Date() })
      .eq('id', clientId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating client:', error);
    alert('Error updating client: ' + error.message);
    throw error;
  }
};

export const insertClient = async (clientData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error: insertError } = await supabase
      .from('clients')
      .insert([{ ...clientData, user_id: userId }]);

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error inserting client:', error);
    alert('Error inserting client: ' + error.message);
    throw error;
  }
};

export const deleteClientAndMotorcycles = async (clientId) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    // First, delete associated motorcycles
    const { error: deleteMotorcyclesError } = await supabase
      .from('motorcycles')
      .delete()
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (deleteMotorcyclesError) throw deleteMotorcyclesError;

    // Then, delete the client
    const { error: deleteClientError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId);

    if (deleteClientError) throw deleteClientError;
  } catch (error) {
    console.error('Error deleting client and motorcycles:', error);
    alert('Error deleting client and motorcycles: ' + error.message);
    throw error;
  }
};

export const updateMotorcycle = async (motorcycleId, motorcycleData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error: updateError } = await supabase
      .from('motorcycles')
      .update({ ...motorcycleData, updated_at: new Date() })
      .eq('id', motorcycleId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating motorcycle:', error);
    alert('Error updating motorcycle: ' + error.message);
    throw error;
  }
};

export const insertMotorcycle = async (clientId, motorcycleData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error: insertError } = await supabase
      .from('motorcycles')
      .insert([{
        client_id: clientId,
        ...motorcycleData,
        user_id: userId,
      }]);

    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error inserting motorcycle:', error);
    alert('Error inserting motorcycle: ' + error.message);
    throw error;
  }
};

export const deleteMotorcycle = async (motorcycleId) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error: deleteError } = await supabase
      .from('motorcycles')
      .delete()
      .eq('id', motorcycleId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting motorcycle:', error);
    alert('Error deleting motorcycle: ' + error.message);
    throw error;
  }
};

// --- Expense Functions ---

export const fetchExpenses = async (sortConfig = { key: 'date', direction: 'descending' }) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    let { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });

    if (error) throw error;
    // Convert date to ISO string for consistency
    return (data || []).map(expense => ({...expense, date: new Date(expense.date).toISOString().split('T')[0]}));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    alert('Error fetching expenses: ' + error.message);
    return [];
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;
    const { error } = await supabase
      .from('expenses')
      .update({...expenseData, date: new Date(expenseData.date).getTime(), updated_at: new Date()})
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating expense:', error);
    alert('Error updating expense: ' + error.message);
    throw error;
  }
};

export const insertExpense = async (expenseData) => {
  try {
    const user = await supabase.auth.getUser();
    if (!user || !user.data || !user.data.user) {
      throw new Error("User not authenticated");
    }
    const userId = user.data.user.id;

    const { error } = await supabase
      .from('expenses')
      .insert([{ ...expenseData, user_id: userId, date: new Date(expenseData.date).getTime() }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error inserting expense:', error);
    alert('Error inserting expense: ' + error.message);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
      const user = await supabase.auth.getUser();
      if (!user || !user.data || !user.data.user) {
          throw new Error("User not authenticated");
      }
      const userId = user.data.user.id;
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Error deleting expense: ' + error.message);
    throw error;
  }
};

// --- Service Functions ---
export const fetchServices = async (sortConfig = { key: 'date', direction: 'descending' }) => {
    try {
        const user = await supabase.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            throw new Error("User not authenticated");
        }
        const userId = user.data.user.id;

        // Fetch Services
        let { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', userId)
            .order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });
        if (servicesError) throw servicesError;

        // Fetch Service Products for each service
        if (servicesData) {
            const servicesWithProducts = await Promise.all(
                servicesData.map(async (service) => {
                    let { data: serviceProductsData, error: serviceProductsError } = await supabase
                        .from('service_products')
                        .select('*, inventory_items(name)')
                        .eq('service_id', service.id)
                        .eq('user_id', userId);

                    if (serviceProductsError) throw serviceProductsError;

                    const productsUsed = serviceProductsData.map((sp) => ({
                        productId: sp.inventory_item_id,
                        quantity: sp.quantity,
                        price: sp.price,
                        name: sp.inventory_items.name,
                    }));

                    return { ...service, productsUsed, date: new Date(service.date).toISOString().split('T')[0] };
                })
            );
            return servicesWithProducts;
        }
        return [];

    } catch (error) {
        console.error('Error fetching services:', error);
        alert('Error fetching services: ' + error.message);
        return [];
    }
};
