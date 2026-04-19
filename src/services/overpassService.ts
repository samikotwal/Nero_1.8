import { Hospital } from '../context/SimulationContext';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.be/api/interpreter',
  'https://overpass.osmsurround.org/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

/**
 * Utility to shuffle endpoints to distribute load
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const mapOverpassElementToHospital = (el: any, fallbackLat: number, fallbackLng: number): Hospital => {
  const name = el.tags.name || el.tags['name:en'] || el.tags.brand || 'Medical Facility';
  const type = el.tags.amenity === 'hospital' ? 'Hospital' : 
               el.tags.amenity === 'pharmacy' ? 'Medical Store' : 'Clinic';
  
  const totalBeds = Math.floor(Math.random() * 400) + 50;
  const availableBeds = Math.floor(Math.random() * totalBeds);
  const totalIcu = Math.floor(totalBeds * 0.1);
  const availableIcu = Math.floor(Math.random() * totalIcu);

  const commonSpecialties = [
    'General Medicine', 'Emergency', 'Dermatology', 'Orthopedics', 
    'Neurology', 'Cardiology', 'Pulmonology', 'Gastroenterology', 
    'Nephrology', 'Urology', 'Ophthalmology', 'ENT', 
    'Dentistry', 'Pediatrics', 'Gynecology', 'Psychiatry', 
    'Oncology', 'Endocrinology'
  ];
  
  const randomSpecialties = Array.from({ length: Math.floor(Math.random() * 3) + 2 }, () => 
    commonSpecialties[Math.floor(Math.random() * commonSpecialties.length)]
  );
  const uniqueSpecialties = Array.from(new Set(['General Medicine', ...randomSpecialties]));

  return {
    id: el.id.toString(),
    name,
    type,
    lat: el.lat || el.center?.lat || fallbackLat,
    lng: el.lon || el.center?.lon || fallbackLng,
    beds: {
      available: availableBeds,
      total: totalBeds
    },
    icuBeds: availableIcu,
    totalIcuBeds: totalIcu,
    status: availableBeds < totalBeds * 0.05 ? 'full' : availableBeds < totalBeds * 0.2 ? 'busy' : 'available',
    specialties: el.tags.speciality ? el.tags.speciality.split(';') : uniqueSpecialties,
    address: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:city'] || 'Nearby Location',
    phone: el.tags.phone || el.tags['contact:phone'] || 'N/A',
    ambulances: Math.floor(Math.random() * 5) + 2,
    totalAmbulances: 10,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  };
};

/**
 * Execute a query against multiple endpoints with timeout and fallback support
 */
const executeOverpassQuery = async (query: string): Promise<any[]> => {
  // Use a shorter list of endpoints for initial race to avoid excessive network noise
  const targetEndpoints = shuffleArray(OVERPASS_ENDPOINTS).slice(0, 4);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // Tightened 8s tactical timeout for faster failover

  const fetchFromEndpoint = async (endpoint: string) => {
    try {
      // Transition to POST for better reliability and lower rejection rates
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json' 
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      
      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limited');
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.elements) throw new Error('Malformed response');
      return data.elements;
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Timeout');
      throw err;
    }
  };

  try {
    // Attempt the first batch with a more aggressive race
    return await Promise.any(targetEndpoints.map(fetchFromEndpoint));
  } catch (err) {
    console.warn("Operational Note: High-latency detected in primary Overpass network, engaging contingency mirrors...", err);
    // If first batch fails, try remaining endpoints with a small delay to avoid global 429s
    await new Promise(resolve => setTimeout(resolve, 500));
    const remainingEndpoints = OVERPASS_ENDPOINTS.filter(e => !targetEndpoints.includes(e));
    try {
      return await Promise.any(remainingEndpoints.map(fetchFromEndpoint));
    } catch (finalErr) {
      clearTimeout(timeoutId);
      throw finalErr;
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchNearbyHealthcare = async (lat: number, lng: number, radius: number = 30000): Promise<Hospital[]> => {
  const amenities = 'hospital|clinic|pharmacy|doctors';
  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"~"${amenities}"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  try {
    const elements = await executeOverpassQuery(query);
    return elements
      .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
      .map((el: any) => mapOverpassElementToHospital(el, lat, lng));
  } catch (error) {
    console.warn("Primary path obstructed, attempting secondary healthcare scan...");
    try {
      // Recovery attempt with much smaller radius for faster response
      const recoveryRadius = 10000;
      const recoveryQuery = `
        [out:json][timeout:15];
        nwr["amenity"~"hospital|clinic|pharmacy|doctors"](around:${recoveryRadius},${lat},${lng});
        out center;
      `;
      const recoveryElements = await executeOverpassQuery(recoveryQuery);
      return recoveryElements
        .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
        .map((el: any) => mapOverpassElementToHospital(el, lat, lng));
    } catch (recoveryError) {
      console.warn("Cloud Intelligence currently unavailable. Activating local tactical fallback simulation.");
      
      // Ultimate fallback: Generate consistent local medical facilities around the user's current city
      const fallbackFacilities: Hospital[] = [
        {
          id: 'fallback-1',
          name: 'City Central General Hospital',
          type: 'Hospital',
          lat: lat + (Math.random() - 0.5) * 0.02,
          lng: lng + (Math.random() - 0.5) * 0.02,
          beds: { available: 45, total: 200 },
          icuBeds: 12,
          totalIcuBeds: 20,
          status: 'available',
          specialties: ['General Medicine', 'Emergency', 'Cardiology'],
          address: 'Central District, City Core',
          phone: '+91 8352-250001',
          ambulances: 10,
          totalAmbulances: 10,
          busyAmbulances: 0,
          processingAmbulances: 0,
          completedAmbulances: 0
        },
        {
          id: 'fallback-2',
          name: 'Metro Emergency Clinic',
          type: 'Clinic',
          lat: lat + (Math.random() - 0.5) * 0.015,
          lng: lng + (Math.random() - 0.5) * 0.015,
          beds: { available: 5, total: 30 },
          icuBeds: 0,
          totalIcuBeds: 0,
          status: 'busy',
          specialties: ['Emergency', 'Pediatrics'],
          address: 'Sector 4, Main Road',
          phone: '+91 8352-250005',
          ambulances: 2,
          totalAmbulances: 2,
          busyAmbulances: 0,
          processingAmbulances: 0,
          completedAmbulances: 0
        },
        {
          id: 'fallback-3',
          name: 'LifeCare Specialty Center',
          type: 'Hospital',
          lat: lat + (Math.random() - 0.5) * 0.025,
          lng: lng + (Math.random() - 0.5) * 0.025,
          beds: { available: 12, total: 150 },
          icuBeds: 8,
          totalIcuBeds: 15,
          status: 'available',
          specialties: ['Orthopedics', 'Neurology', 'Oncology'],
          address: 'Ashram Road, North Wing',
          phone: '+91 8352-250010',
          ambulances: 8,
          totalAmbulances: 8,
          busyAmbulances: 0,
          processingAmbulances: 0,
          completedAmbulances: 0
        },
        {
          id: 'fallback-4',
          name: 'Apex Pharma & Medicals',
          type: 'Medical Store',
          lat: lat + (Math.random() - 0.5) * 0.01,
          lng: lng + (Math.random() - 0.5) * 0.01,
          beds: { available: 0, total: 0 },
          icuBeds: 0,
          totalIcuBeds: 0,
          status: 'available',
          specialties: ['Pharmacy', 'First Aid'],
          address: 'Central Market',
          phone: '+91 8352-251001',
          ambulances: 0,
          totalAmbulances: 0,
          busyAmbulances: 0,
          processingAmbulances: 0,
          completedAmbulances: 0
        }
      ];
      
      return fallbackFacilities;
    }
  }
};

export const fetchHealthcareByBounds = async (south: number, west: number, north: number, east: number, zoom: number): Promise<Hospital[]> => {
  // Lower the zoom levels might need bigger scope, but we keep it bound
  const amenities = 'hospital|clinic|pharmacy|doctors';
  const query = `
    [out:json][timeout:15];
    nwr["amenity"~"${amenities}"](${south},${west},${north},${east});
    out center;
  `;

  try {
    const elements = await executeOverpassQuery(query);
    
    return elements
      .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
      .map((el: any) => mapOverpassElementToHospital(el, (south + north) / 2, (west + east) / 2));
  } catch (error) {
    // Silent fail for bounds query
    return [];
  }
};
