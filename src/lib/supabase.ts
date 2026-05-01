import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://xjxnpcxlwitvknqybsej.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqeG5wY3hsd2l0dmtucXliHNlaiIsImlhdCI6MTY3OTc1NjQwMywiZXhwIjoyMDY5MzgwMDAzfQ.dummy_key';

if (!(import.meta as any).env.VITE_SUPABASE_URL || !(import.meta as any).env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials missing. App will fallback to simulated data and dummy key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection and log status
async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from('hospitals').select('id').limit(1);
    if (error) {
      if (error.message.includes('Failed to fetch')) {
        console.error('Supabase Connection Error: NETWORK_ERROR. This usually means the browser cannot reach the Supabase URL. Check your connection or VPN.');
      } else {
        console.warn('Supabase Connection Warning:', error.message);
      }
    } else {
      console.log('Supabase Connection: ACTIVE');
    }
  } catch (err) {
    console.error('Supabase Connection Critical Error:', err);
  }
}
testSupabaseConnection();

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
