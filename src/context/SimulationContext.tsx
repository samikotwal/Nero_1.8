import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchNearbyHealthcare, fetchHealthcareByBounds } from '../services/overpassService';

const springTransition = {
  type: "spring",
  stiffness: 150,
  damping: 12
};

export interface Hospital {
  id: string;
  name: string;
  type: 'Hospital' | 'Medical Center' | 'Clinic' | 'Medical Store';
  lat: number;
  lng: number;
  beds: {
    available: number;
    total: number;
  };
  icuBeds: number;
  totalIcuBeds: number;
  status: 'available' | 'busy' | 'full';
  specialties: string[];
  address: string;
  phone: string;
  distance?: number;
}

export interface Emergency {
  id: string;
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ASSIGNED' | 'COMPLETED' | 'PENDING';
  description: string;
  address: string;
  time: string;
  severity?: 'critical' | 'moderate' | 'stable';
  type?: string;
  timestamp?: string;
}

interface SimulationContextType {
  hospitals: Hospital[];
  emergencies: Emergency[];
  isSimulationActive: boolean;
  toggleSimulation: () => void;
  userLocation: [number, number] | null;
  setUserLocation: (loc: [number, number]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  locationSource: 'gps' | 'fallback' | 'search';
  useGps: boolean;
  setUseGps: (val: boolean) => void;
  refreshData: () => void;
  fetchByBounds: (south: number, west: number, north: number, east: number, zoom: number) => Promise<void>;
  searchLocation: (query: string) => Promise<boolean>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  statusFilter: 'all' | 'available' | 'busy';
  setStatusFilter: (filter: 'all' | 'available' | 'busy') => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Haversine formula for accurate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([
    {
      id: 'E-CK5JMNBS',
      name: 'Rahul Sharma',
      priority: 'HIGH',
      status: 'ASSIGNED',
      description: 'Respiratory failure',
      address: '20, Rohini, New Delhi',
      time: '4:36:15 PM'
    },
    {
      id: 'E-DAFULRF1',
      name: 'Sneha Patel',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      description: 'Sudden weakness and speech difficulty',
      address: '4, Pitampura, New Delhi',
      time: '4:35:58 PM'
    }
  ]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  
  // Smart Location Logic: Default to Bijapur (16.8302, 75.7100)
  // On mobile, we'll try to use GPS. On laptop, we stay in Bijapur.
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>([16.8302, 75.7100]);
  const [locationSource, setLocationSource] = useState<'gps' | 'fallback' | 'search'>(isMobile ? 'gps' : 'fallback');
  const [useGps, setUseGps] = useState(isMobile);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy'>('all');

  const toggleSimulation = () => setIsSimulationActive(!isSimulationActive);

  const isFetching = useRef(false);

  const refreshData = useCallback(async () => {
    if (!userLocation || isFetching.current) return;
    isFetching.current = true;
    // Silent update
    console.log(`Refreshing healthcare data for location: ${userLocation[0]}, ${userLocation[1]}`);
    try {
      let realData = await fetchNearbyHealthcare(userLocation[0], userLocation[1], 100000); // 100km radius
      
      // Inject specific hospitals if near Delhi or Bijapur
      const distToDelhi = calculateDistance(userLocation[0], userLocation[1], 28.6139, 77.2090);
      const distToBijapur = calculateDistance(userLocation[0], userLocation[1], 16.8302, 75.7100);
      
      let injectedHospitals: Hospital[] = [];

      if (distToDelhi < 50) {
        injectedHospitals = [
          {
            id: 'F6FYGX0D',
            name: 'AIIMS Delhi',
            type: 'Hospital',
            lat: 28.5672,
            lng: 77.2100,
            beds: { available: 164, total: 453 },
            icuBeds: 5,
            totalIcuBeds: 16,
            status: 'available',
            specialties: ['Emergency', 'Trauma', 'Cardiology'],
            address: 'Ansari Nagar, New Delhi',
            phone: '011-26588500'
          },
          {
            id: 'TSFFESJN',
            name: 'Safdarjung Hospital',
            type: 'Hospital',
            lat: 28.5675,
            lng: 77.2085,
            beds: { available: 43, total: 272 },
            icuBeds: 3,
            totalIcuBeds: 49,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Burns'],
            address: 'Ansari Nagar, New Delhi',
            phone: '011-26707100'
          },
          {
            id: 'R5XM5L84',
            name: 'RML Hospital',
            type: 'Hospital',
            lat: 28.6250,
            lng: 77.2100,
            beds: { available: 38, total: 121 },
            icuBeds: 2,
            totalIcuBeds: 15,
            status: 'available',
            specialties: ['Emergency', 'Trauma', 'Neurology'],
            address: 'Baba Kharak Singh Marg, New Delhi',
            phone: '011-23365525'
          },
          {
            id: '87PZD30P',
            name: 'GTB Hospital',
            type: 'Hospital',
            lat: 28.6840,
            lng: 77.3050,
            beds: { available: 263, total: 444 },
            icuBeds: 17,
            totalIcuBeds: 49,
            status: 'available',
            specialties: ['Emergency', 'Trauma', 'Cardiology'],
            address: 'Dilshad Garden, Delhi',
            phone: '011-22586262'
          },
          {
            id: 'QYD8UQ9S',
            name: 'Lok Nayak Hospital',
            type: 'Hospital',
            lat: 28.6350,
            lng: 77.2350,
            beds: { available: 39, total: 169 },
            icuBeds: 3,
            totalIcuBeds: 40,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Neurology'],
            address: 'Jawaharlal Nehru Marg, Delhi',
            phone: '011-23232400'
          },
          {
            id: 'L2PEV60H',
            name: 'Max Super Speciality',
            type: 'Hospital',
            lat: 28.5280,
            lng: 77.2150,
            beds: { available: 24, total: 147 },
            icuBeds: 2,
            totalIcuBeds: 43,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Orthopedics'],
            address: 'Saket, New Delhi',
            phone: '011-26515050'
          },
          {
            id: '8NLKPSGF',
            name: 'Fortis Hospital',
            type: 'Hospital',
            lat: 28.5350,
            lng: 77.1550,
            beds: { available: 52, total: 304 },
            icuBeds: 6,
            totalIcuBeds: 35,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Cardiology'],
            address: 'Vasant Kunj, New Delhi',
            phone: '011-42776222'
          },
          {
            id: 'EYAB159T',
            name: 'Apollo Hospital',
            type: 'Hospital',
            lat: 28.5400,
            lng: 77.2850,
            beds: { available: 89, total: 339 },
            icuBeds: 12,
            totalIcuBeds: 60,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Neurology'],
            address: 'Sarita Vihar, New Delhi',
            phone: '011-26925858'
          },
          {
            id: 'L4484CSL',
            name: 'Sir Ganga Ram Hospital',
            type: 'Hospital',
            lat: 28.6380,
            lng: 77.1880,
            beds: { available: 76, total: 368 },
            icuBeds: 9,
            totalIcuBeds: 45,
            status: 'busy',
            specialties: ['Emergency', 'Trauma', 'Gastroenterology'],
            address: 'Rajinder Nagar, New Delhi',
            phone: '011-25750000'
          },
          {
            id: 'K8S9F2W1',
            name: 'BLK Super Speciality',
            type: 'Hospital',
            lat: 28.6430,
            lng: 77.1800,
            beds: { available: 45, total: 280 },
            icuBeds: 5,
            totalIcuBeds: 30,
            status: 'available',
            specialties: ['Emergency', 'Trauma', 'Oncology'],
            address: 'Pusa Road, New Delhi',
            phone: '011-30403040'
          },
          {
            id: 'M3N7V5X2',
            name: 'Moolchand Hospital',
            type: 'Hospital',
            lat: 28.5650,
            lng: 77.2350,
            beds: { available: 32, total: 190 },
            icuBeds: 4,
            totalIcuBeds: 20,
            status: 'available',
            specialties: ['Emergency', 'Trauma', 'Orthopedics'],
            address: 'Lajpat Nagar, New Delhi',
            phone: '011-42000000'
          }
        ];
      } else if (distToBijapur < 50) {
        injectedHospitals = [
          {
            id: 'B-BLDE',
            name: 'BLDE (Shri B M Patil) Hospital',
            type: 'Hospital',
            lat: 16.8250,
            lng: 75.7050,
            beds: { available: 120, total: 500 },
            icuBeds: 15,
            totalIcuBeds: 40,
            status: 'available',
            specialties: ['Emergency', 'Surgery', 'Cardiology'],
            address: 'Solapur Road, Vijayapura',
            phone: '08352-262770'
          },
          {
            id: 'B-DIST',
            name: 'District Civil Hospital',
            type: 'Hospital',
            lat: 16.8350,
            lng: 75.7150,
            beds: { available: 45, total: 300 },
            icuBeds: 5,
            totalIcuBeds: 20,
            status: 'busy',
            specialties: ['Emergency', 'General Medicine'],
            address: 'Station Road, Vijayapura',
            phone: '08352-250011'
          },
          {
            id: 'B-ALAMEEN',
            name: 'Al-Ameen Medical College Hospital',
            type: 'Hospital',
            lat: 16.8500,
            lng: 75.7300,
            beds: { available: 80, total: 400 },
            icuBeds: 10,
            totalIcuBeds: 30,
            status: 'available',
            specialties: ['Emergency', 'Orthopedics'],
            address: 'Athani Road, Vijayapura',
            phone: '08352-270045'
          }
        ];
      }

      if (injectedHospitals.length > 0) {
        const combined = [...injectedHospitals, ...realData];
        const unique = combined.filter((h, index, self) => 
          index === self.findIndex((t) => t.name === h.name)
        );
        realData = unique;
      }

      console.log(`Nearby search returned ${realData.length} elements.`);
      if (realData.length > 0) {
        const withDistance = realData.map(h => ({
          ...h,
          distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setHospitals(withDistance);
      }
    } catch (error) {
      console.error("Error in refreshData:", error);
    } finally {
      isFetching.current = false;
    }
  }, [userLocation]);

  const fetchByBounds = useCallback(async (south: number, west: number, north: number, east: number, zoom: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    // Silent update
    try {
      const realData = await fetchHealthcareByBounds(south, west, north, east, zoom);
      console.log(`Overpass API returned ${realData.length} elements for bounds.`);
      if (realData.length > 0) {
        const withDistance = realData.map(h => ({
          ...h,
          distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) : undefined
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setHospitals(withDistance);
      } else {
        console.warn("No healthcare facilities found in this area.");
      }
    } catch (error) {
      console.error("Error in fetchByBounds:", error);
    } finally {
      isFetching.current = false;
    }
  }, [userLocation]);

  const searchLocation = async (query: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setUserLocation([lat, lon]);
        setLocationSource('search');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Location search error:", error);
      return false;
    }
  };

  const lastFetchLocation = useRef<[number, number] | null>(null);

  // Initial fetch when location is found
  useEffect(() => {
    if (userLocation) {
      const dist = lastFetchLocation.current 
        ? calculateDistance(userLocation[0], userLocation[1], lastFetchLocation.current[0], lastFetchLocation.current[1])
        : Infinity;
      
      if (dist > 0.5 || hospitals.length === 0) { // Refresh if moved > 500m or no data
        console.log("Location shifted significantly, refreshing data:", userLocation);
        refreshData();
        lastFetchLocation.current = userLocation;
      }
    }
  }, [userLocation, refreshData, hospitals.length]);

  // Simulation loop
  useEffect(() => {
    if (!isSimulationActive) return;

    const interval = setInterval(() => {
      setHospitals(prev => prev.map(h => {
        const newAvailable = Math.max(0, Math.min(h.beds.total, h.beds.available + (Math.random() > 0.5 ? 1 : -1)));
        const newIcu = Math.max(0, Math.min(h.totalIcuBeds, h.icuBeds + (Math.random() > 0.8 ? 1 : Math.random() > 0.8 ? -1 : 0)));
        
        // Calculate status based on availability
        const availabilityPercent = (newAvailable / h.beds.total) * 100;
        let newStatus: 'available' | 'busy' | 'full' = 'available';
        if (availabilityPercent < 5) newStatus = 'full';
        else if (availabilityPercent < 20) newStatus = 'busy';

        return {
          ...h,
          beds: { ...h.beds, available: newAvailable },
          icuBeds: newIcu,
          status: newStatus
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulationActive]);

  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation([16.8302, 75.7100]); // Fallback if not supported
      setLocationSource('fallback');
      setIsLoading(false);
      return;
    }

    if (!useGps) return;

    console.log("Starting geolocation tracking...");

    // Kickstart with a one-shot request
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        setLocationSource('gps');
      },
      (err) => console.warn("Initial GPS lock failed", err),
      { enableHighAccuracy: true, timeout: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // On laptop, if the detected location is far from Bijapur (> 50km), 
        // we ignore it to prevent jumping to Bengaluru/other cities
        if (!isMobileDevice) {
          const distFromBijapur = calculateDistance(latitude, longitude, 16.8302, 75.7100);
          if (distFromBijapur > 50) {
            console.log("Laptop detected far from Bijapur, staying in Bijapur fallback.");
            setUserLocation([16.8302, 75.7100]);
            setLocationSource('fallback');
            setIsLoading(false);
            return;
          }
        }

        console.log(`User Location Update: [${latitude}, ${longitude}] (Accuracy: ${pos.coords.accuracy}m)`);
        setUserLocation([latitude, longitude]);
        setLocationSource('gps');
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        
        // Handle permission denied or other errors
        if (err.code === err.PERMISSION_DENIED) {
          console.warn("Geolocation permission denied. Using fallback location (Bijapur).");
          setUserLocation([16.8302, 75.7100]);
          setLocationSource('fallback');
          setIsLoading(false);
        } else if (err.code === err.TIMEOUT) {
          console.warn('Geolocation timeout - retrying...');
          // On timeout, we don't stop, watchPosition will keep trying
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, // Increased timeout to allow GPS to lock
        maximumAge: 0   // Force fresh data
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useGps]);

  return (
    <SimulationContext.Provider value={{
      hospitals,
      emergencies,
      isSimulationActive,
      toggleSimulation,
      userLocation,
      setUserLocation,
      isLoading,
      setIsLoading,
      locationSource,
      useGps,
      setUseGps,
      refreshData,
      fetchByBounds,
      searchLocation,
      searchQuery,
      setSearchQuery,
      filterType,
      setFilterType,
      statusFilter,
      setStatusFilter
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
