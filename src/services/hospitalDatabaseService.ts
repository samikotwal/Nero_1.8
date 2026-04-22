import { supabase } from '../lib/supabase';
import { Hospital } from '../context/SimulationContext';

export const fetchHospitalUpdates = async (): Promise<Partial<Hospital>[]> => {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*');

    if (error) throw error;

    console.log('Database returned hospitals:', data);

    return (data || []).map(h => ({
      id: h.id,
      name: h.name,
      beds: {
        available: h.available_beds,
        total: h.total_beds
      },
      icuBeds: h.available_icu,
      totalIcuBeds: h.total_icu,
      ambulances: h.available_ambulance,
      totalAmbulances: h.total_ambulance
    }));
  } catch (error) {
    console.error('Error fetching hospital data from Supabase:', error);
    return [];
  }
};

export const updateHospitalResource = async (
  hospitalId: string, 
  field: string, 
  newValue: number
) => {
  try {
    const { error } = await supabase
      .from('hospitals')
      .update({ [field]: newValue })
      .eq('id', hospitalId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating hospital data in Supabase:', error);
  }
};

export const saveBooking = async (booking: {
  hospital_id: string;
  hospital_name: string;
  resource_type: string;
  patient_name: string;
  contact_number: string;
  timestamp: string;
}) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .insert([booking]);

    if (error) throw error;
    console.log('Booking saved successfully');
  } catch (error) {
    console.error('Error saving booking to Supabase:', error);
  }
};

export const fetchRecentBookings = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bookings from Supabase:', error);
    return [];
  }
};
