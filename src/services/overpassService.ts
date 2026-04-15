import { Hospital } from '../context/SimulationContext';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter'
];

export const fetchNearbyHealthcare = async (lat: number, lng: number, radius: number = 5000): Promise<Hospital[]> => {
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"hospital|clinic|pharmacy|doctors"](around:${radius},${lat},${lng});
      way["amenity"~"hospital|clinic|pharmacy|doctors"](around:${radius},${lat},${lng});
    );
    out center;
  `;

  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      console.log(`Overpass API Response (Nearby) from ${endpoint}:`, data);
      if (!data.elements || data.elements.length === 0) {
        console.warn(`No elements found in Overpass response (Nearby) from ${endpoint}`);
        continue;
      }

      return data.elements
        .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
        .map((el: any) => {
        const name = el.tags.name || el.tags['name:en'] || el.tags.brand || 'Medical Facility';
        const type = el.tags.amenity === 'hospital' ? 'Hospital' : 
                     el.tags.amenity === 'pharmacy' ? 'Medical Store' : 'Clinic';
        
        const totalBeds = Math.floor(Math.random() * 400) + 50;
        const availableBeds = Math.floor(Math.random() * totalBeds);
        const totalIcu = Math.floor(totalBeds * 0.1);
        const availableIcu = Math.floor(Math.random() * totalIcu);

        return {
          id: el.id.toString(),
          name,
          type,
          lat: el.lat || el.center?.lat || lat,
          lng: el.lon || el.center?.lon || lng,
          beds: {
            available: availableBeds,
            total: totalBeds
          },
          icuBeds: availableIcu,
          totalIcuBeds: totalIcu,
          status: availableBeds < totalBeds * 0.05 ? 'full' : availableBeds < totalBeds * 0.2 ? 'busy' : 'available',
          specialties: el.tags.speciality ? el.tags.speciality.split(';') : ['General Medicine', 'Emergency'],
          address: el.tags['addr:full'] || el.tags['addr:street'] || 'Nearby Location',
          phone: el.tags.phone || el.tags['contact:phone'] || 'N/A'
        };
      });
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  return [];
};

export const fetchHealthcareByBounds = async (south: number, west: number, north: number, east: number, zoom: number): Promise<Hospital[]> => {
  // STRICT MEDICAL POI FILTERING
  const amenities = 'hospital|clinic|pharmacy|doctors';

  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"${amenities}"](${south},${west},${north},${east});
      way["amenity"~"${amenities}"](${south},${west},${north},${east});
    );
    out center;
  `;

  console.log(`Fetching healthcare data for bounds: [${south}, ${west}, ${north}, ${east}] at zoom ${zoom}`);

  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      console.log(`Overpass API Response (Bounds) from ${endpoint}:`, data);
      if (!data.elements || data.elements.length === 0) {
        console.warn(`No elements found in Overpass response (Bounds) from ${endpoint}`);
        continue;
      }

      return data.elements
        .filter((el: any) => el.tags && (el.lat || el.center?.lat) && (el.lon || el.center?.lon))
        .map((el: any) => {
        const name = el.tags.name || el.tags['name:en'] || el.tags.brand || 'Medical Facility';
        const type = el.tags.amenity === 'hospital' ? 'Hospital' : 
                     el.tags.amenity === 'pharmacy' ? 'Medical Store' : 'Clinic';
        
        const totalBeds = Math.floor(Math.random() * 400) + 50;
        const availableBeds = Math.floor(Math.random() * totalBeds);
        const totalIcu = Math.floor(totalBeds * 0.1);
        const availableIcu = Math.floor(Math.random() * totalIcu);

        return {
          id: el.id.toString(),
          name,
          type,
          lat: el.lat || el.center?.lat || (south + north) / 2,
          lng: el.lon || el.center?.lon || (west + east) / 2,
          beds: {
            available: availableBeds,
            total: totalBeds
          },
          icuBeds: availableIcu,
          totalIcuBeds: totalIcu,
          status: availableBeds < totalBeds * 0.05 ? 'full' : availableBeds < totalBeds * 0.2 ? 'busy' : 'available',
          specialties: el.tags.speciality ? el.tags.speciality.split(';') : ['General Medicine', 'Emergency'],
          address: el.tags['addr:full'] || el.tags['addr:street'] || 'Nearby Location',
          phone: el.tags.phone || el.tags['contact:phone'] || 'N/A'
        };
      });
    } catch (error) {
      lastError = error;
      continue;
    }
  }
  return [];
};
