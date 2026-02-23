const supabase = require('../config/supabase');

const requireDB = () => {
    if (!supabase) {
        throw new Error(
            'Database not configured. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to backend/.env and restart the server.'
        );
    }
};

// Get all time slots for a specific date
const getSlotsByDate = async (date) => {
    requireDB();
    const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
};

// Get all time slots within a date range
const getSlotsByDateRange = async (startDate, endDate) => {
    requireDB();
    const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
};

// Get a single time slot by ID
const getSlotById = async (id) => {
    requireDB();
    const { data, error } = await supabase
        .from('time_slots')
        .select('*, bookings(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

// Create a new time slot
const createSlot = async (slotData) => {
    requireDB();
    const { date, start_time, end_time, title, description, duration_minutes } = slotData;

    const { data, error } = await supabase
        .from('time_slots')
        .insert([{
            date,
            start_time,
            end_time,
            title: title || 'Appointment Slot',
            description: description || null,
            duration_minutes: duration_minutes || 30,
            status: 'available',
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Create multiple time slots (bulk)
const createBulkSlots = async (slots) => {
    requireDB();
    const { data, error } = await supabase
        .from('time_slots')
        .insert(slots)
        .select();

    if (error) throw error;
    return data;
};

// Update a time slot
const updateSlot = async (id, updates) => {
    requireDB();
    const { data, error } = await supabase
        .from('time_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// Delete a time slot
const deleteSlot = async (id) => {
    requireDB();
    const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { success: true };
};

// Book a time slot (mark as booked + create booking record)
const bookSlot = async (slotId, bookingData) => {
    requireDB();
    const { client_name, client_email, client_phone, notes } = bookingData;

    // Check slot is still available
    const { data: slot, error: slotError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('id', slotId)
        .single();

    if (slotError) throw slotError;
    if (!slot) throw new Error('Slot not found');
    if (slot.status !== 'available') throw new Error('This time slot is no longer available');

    // Update slot status to booked
    const { error: updateError } = await supabase
        .from('time_slots')
        .update({
            status: 'booked',
            booked_by: client_name,
            booked_by_email: client_email,
            booked_at: new Date().toISOString(),
        })
        .eq('id', slotId);

    if (updateError) throw updateError;

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
            slot_id: slotId,
            client_name,
            client_email,
            client_phone: client_phone || null,
            notes: notes || null,
            status: 'confirmed',
        }])
        .select()
        .single();

    if (bookingError) throw bookingError;
    return booking;
};

// Get slot availability summary per month
const getMonthAvailability = async (year, month) => {
    requireDB();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
        .from('time_slots')
        .select('date, status')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;

    // Summarize by date
    const summary = {};
    data.forEach((slot) => {
        if (!summary[slot.date]) {
            summary[slot.date] = { available: 0, booked: 0, blocked: 0, total: 0 };
        }
        summary[slot.date][slot.status]++;
        summary[slot.date].total++;
    });

    return summary;
};

module.exports = {
    getSlotsByDate,
    getSlotsByDateRange,
    getSlotById,
    createSlot,
    createBulkSlots,
    updateSlot,
    deleteSlot,
    bookSlot,
    getMonthAvailability,
};
