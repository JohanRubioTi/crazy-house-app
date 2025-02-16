// Centralized Supabase interaction functions
import { supabase } from './supabaseClient';

// --- Inventory Functions (Existing) ---
// ... (All the existing inventory functions from the previous response) ...
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
