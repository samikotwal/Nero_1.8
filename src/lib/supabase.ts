import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App will fallback to simulated data.');
}

export const supabase = createClient(
  supabaseUrl || 'https://xjxnpcxlwitvknqybsej.supabase.co',
  supabaseAnonKey || 'sb_publishable_DVN5jkAWscngvexK_3MGoA_RiRZHeUByQW-XGqV91_E'
);

export async function fetchHospitalUpdates() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*');
  
  if (error) return [];
  return data;
}

export async function saveBedBooking(booking: any) {
  const { error } = await supabase
    .from('patients')
    .insert([{
      name: booking.patient_name,
      age: parseInt(booking.patient_age) || 0,
      contact_number: booking.contact_number,
      emergency_number: booking.emergency_number,
      hospital_id: booking.hospital_id,
      id_code: `P-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'ADMITTED'
    }]);
  
  if (error) console.error('Error saving booking:', error);
}

export async function saveAmbulanceMission(mission: any) {
  const { error } = await supabase
    .from('patients')
    .insert([{
      name: mission.patient_name || 'Emergency Dispatch',
      contact_number: mission.contact_number,
      hospital_id: mission.hospital_id,
      id_code: `A-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'DISPATCHED'
    }]);
  
  if (error) console.error('Error saving mission:', error);
}

export async function fetchRecentBookings() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) return [];
  return data;
}
