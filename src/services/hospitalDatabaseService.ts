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

export const saveBedBooking = async (booking: {
  id_code?: string;
  patient_name: string;
  hospital_id: string;
  patient_age: string;
  contact_number: string;
  emergency_number: string;
  timestamp: string;
}) => {
  try {
    const { error } = await supabase
      .from('patients')
      .insert([{
        name: booking.patient_name,
        age: parseInt(booking.patient_age) || 0,
        contact_number: parseInt(booking.contact_number.replace(/\D/g, '')) || 0,
        emergency_number: parseInt(booking.emergency_number.replace(/\D/g, '')) || 0,
        hospital_id: booking.hospital_id,
        id_code: booking.id_code || `P-${Math.floor(Math.random() * 9000) + 1000}`,
        created_at: booking.timestamp
      }]);

    if (error) throw error;
    console.log('Bed booking saved successfully to patients table');
  } catch (error) {
    console.error('Error saving to patients table:', error);
    return saveGenericBooking({ ...booking, resource_type: 'BED' });
  }
};

export const saveAmbulanceMission = async (mission: {
  id_code?: string;
  hospital_id: string;
  patient_name: string;
  contact_number: string;
  address: string;
  timestamp: string;
}) => {
  try {
    const { error } = await supabase
      .from('patients')
      .insert([{
        name: mission.patient_name,
        contact_number: parseInt(mission.contact_number.replace(/\D/g, '')) || 0,
        hospital_id: mission.hospital_id,
        id_code: mission.id_code || `A-${Math.floor(Math.random() * 9000) + 1000}`,
        emergency_number: 0, // Fallback for mandatory field
        age: 0, // Fallback for mandatory field
        created_at: mission.timestamp
      }]);

    if (error) throw error;
    console.log('Ambulance mission saved to patients table');
  } catch (error) {
    console.error('Error saving mission to patients table:', error);
    return saveGenericBooking({ ...mission, resource_type: 'AMBULANCE' });
  }
};

const saveGenericBooking = async (booking: any) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .insert([booking]);
    if (error) throw error;
  } catch (err) {
    console.error('Fallback booking save failed:', err);
  }
};

export const saveAdmissionRequest = async (request: {
  hospital_id: string;
  name: string;
  age: string;
  contact_number: string;
  emergency_number: string;
  id_code?: string;
  timestamp: string;
}) => {
  try {
    const { error } = await supabase
      .from('admission_requests')
      .insert([{
        hospital_id: request.hospital_id,
        name: request.name,
        age: parseInt(request.age) || 0,
        contact_number: parseInt(request.contact_number.replace(/\D/g, '')) || 0,
        emergency_number: parseInt(request.emergency_number.replace(/\D/g, '')) || 0,
        id_code: request.id_code || `RQ-${Math.floor(Math.random() * 9000) + 1000}`,
        status: 'PENDING',
        created_at: request.timestamp
      }]);

    if (error) {
      console.error('Supabase error saving admission request:', error);
      return { success: false, error: error.message };
    }
    console.log('Admission request saved successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving admission request:', error);
    return { success: false, error: error.message || String(error) };
  }
};

export const fetchAdmissionRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('admission_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admission requests:', error);
    return [];
  }
};

export const updateAdmissionRequestStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
  try {
    const { error } = await supabase
      .from('admission_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

export const saveAmbulanceRequest = async (request: {
  hospital_id: string;
  patient_name: string;
  contact_number: string;
  pickup_location: string;
  priority?: string;
  timestamp?: string;
}) => {
  try {
    const { error } = await supabase
      .from('ambulance_requests')
      .insert([{
        hospital_id: request.hospital_id,
        patient_name: request.patient_name,
        contact_number: String(request.contact_number),
        pickup_location: request.pickup_location,
        priority: request.priority || 'Normal',
        status: 'PENDING',
        created_at: request.timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error('Supabase error saving ambulance request:', error);
      return { success: false, error: error.message };
    }
    console.log('Ambulance request saved successfully to ambulance_requests table');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving ambulance request:', error);
    return { success: false, error: error.message || String(error) };
  }
};

export const fetchAmbulanceRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching ambulance requests:', error);
    return [];
  }
};

export const updateAmbulanceRequestStatus = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
  try {
    const { error } = await supabase
      .from('ambulance_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating ambulance request status:', error);
    throw error;
  }
};

export const fetchRecentBookings = async () => {
  try {
    // Priority: Fetch from patients table as it's the most active for the user
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (patientError) {
      console.warn('Could not fetch from patients table:', patientError);
    }

    const patientMap = (patientData || []).map(p => ({
      ...p,
      patient_name: p.name || 'Unnamed Patient',
      resource_type: p.status === 'ADMITTED' ? 'BED' : 'AMBULANCE',
      timestamp: p.created_at
    }));

    // Other legacy tables for backward compatibility
    const { data: bedData } = await supabase.from('bed_bookings').select('*').limit(10);
    const { data: ambData } = await supabase.from('ambulance_missions').select('*').limit(10);
    const { data: legacyData } = await supabase.from('bookings').select('*').limit(10);

    const combined = [
      ...patientMap,
      ...(bedData || []).map(b => ({ ...b, resource_type: 'BED' })),
      ...(ambData || []).map(a => ({ ...a, resource_type: 'AMBULANCE' })),
      ...(legacyData || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return combined.slice(0, 50);
  } catch (error) {
    console.error('Error fetching bookings from Supabase:', error);
    return [];
  }
};
