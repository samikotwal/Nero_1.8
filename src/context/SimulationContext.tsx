import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchNearbyHealthcare, fetchHealthcareByBounds } from '../services/overpassService';
import { 
  fetchHospitalUpdates, 
  updateHospitalResource, 
  saveBedBooking, 
  saveAmbulanceMission, 
  fetchRecentBookings,
  saveAdmissionRequest,
  fetchAdmissionRequests,
  updateAdmissionRequestStatus,
  saveAmbulanceRequest,
  fetchAmbulanceRequests,
  updateAmbulanceRequestStatus
} from '../services/hospitalDatabaseService';

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
  ambulances: number;
  totalAmbulances: number;
  busyAmbulances: number;
  processingAmbulances: number;
  completedAmbulances: number;
}

export interface OverviewStats {
  occupiedBeds: number;
  occupiedIcu: number;
  busyAmbulances: number;
  missionsCompleted: number;
  completedToday: number;
  avgResponseTime: number;
  weeklyTrends: { name: string, bookings: number }[];
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
  lat?: number;
  lng?: number;
}

export interface Responder {
  id: string;
  type: 'AMBULANCE' | 'BIKE' | 'HELICOPTER';
  status: 'IDLE' | 'EN_ROUTE' | 'ON_SCENE' | 'TO_HOSPITAL' | 'RETURNING';
  lat: number;
  lng: number;
  emergencyId?: string;
  hospitalId?: string;
  targetHospitalId?: string;
  eta?: number; // Estimated minutes
  speed: number; // km/h
  route?: [number, number][];
  destination?: [number, number];
  startTime?: number;
  totalTime?: number; // Animation duration in seconds
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  resourceType?: 'ICU' | 'BED' | 'AMBULANCE' | 'SYSTEM';
  hospitalId?: string;
  hospitalName?: string;
  timestamp: string;
  read: boolean;
  resolved?: boolean;
  distance?: number;
}

interface SimulationContextType {
  hospitals: Hospital[];
  emergencies: Emergency[];
  responders: Responder[];
  isSimulationActive: boolean;
  toggleSimulation: () => void;
  userLocation: [number, number] | null;
  setUserLocation: (loc: [number, number]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  locationSource: 'gps' | 'fallback' | 'search';
  useGps: boolean;
  setUseGps: (val: boolean) => void;
  locationAccuracy: number | null;
  refreshData: () => void;
  fetchByBounds: (south: number, west: number, north: number, east: number, zoom: number) => Promise<void>;
  searchLocation: (query: string) => Promise<boolean>;
  bookResource: (hospitalId: string, resourceType: 'bed' | 'icu', name: string, phone: string, age: string, emergencyPhone: string) => void;
  dispatchAmbulance: (hospitalId: string, destination: [number, number], requesterName?: string, phoneNumber?: string, count?: number, address?: string, targetHospitalId?: string) => void;
  overviewStats: OverviewStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  statusFilter: 'all' | 'available' | 'busy';
  setStatusFilter: (filter: 'all' | 'available' | 'busy') => void;
  notifications: Notification[];
  addNotification: (
    title: string, 
    message: string, 
    type: Notification['type'], 
    priority?: Notification['priority'],
    resourceType?: Notification['resourceType'],
    hospitalId?: string,
    hospitalName?: string,
    distance?: number
  ) => void;
  markNotificationsAsRead: () => void;
  markAsRead: (id: string) => void;
  isAlreadyDispatching: boolean;
  historicalBookings: any[];
  pendingRequests: any[];
  pendingAmbulanceRequests: any[];
  requestAdmission: (hospitalId: string, name: string, age: string, phone: string, emergencyPhone: string) => Promise<void>;
  requestAmbulanceMission: (hospitalId: string, destination: [number, number], name: string, phone: string, address?: string, targetHospitalId?: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  approveAmbulanceRequest: (requestId: string) => Promise<void>;
  rejectAmbulanceRequest: (requestId: string) => Promise<void>;
  initialStats: { id: string, name: string, bookings: number }[];
  findBestHospital: (type: 'bed' | 'icu' | 'ambulance', nearCoords?: [number, number]) => Hospital | null;
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

// Fetch real road route using OSRM
const fetchOSRMRoute = async (start: [number, number], end: [number, number]): Promise<{ coordinates: [number, number][], duration: number } | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return {
        coordinates: data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
        duration: data.routes[0].duration // seconds
      };
    }
  } catch (error) {
    // Silent fail for road route fetching - will fallback to straight-line simulation
  }
  return null;
};

// Generate a simulated road-following route (Manhattan-style grid) as fallback
const generateRoute = (start: [number, number], end: [number, number]): [number, number][] => {
  const points: [number, number][] = [start];
  
  const latDiff = end[0] - start[0];
  const lngDiff = end[1] - start[1];
  
  // Create 8-12 turns for a more detailed road feel
  const segments = 8 + Math.floor(Math.random() * 5);
  
  for (let i = 1; i < segments; i++) {
    const ratio = i / segments;
    if (i % 2 === 1) {
      // Move in Lat first
      points.push([
        start[0] + latDiff * ratio,
        points[points.length - 1][1]
      ]);
    } else {
      // Move in Lng
      points.push([
        points[points.length - 1][0],
        start[1] + lngDiff * ratio
      ]);
    }
  }
  
  points.push(end);
  return points;
};

// Interpolate position along a series of points based on progress (0-1)
const interpolatePosition = (route: [number, number][], progress: number): [number, number] => {
  if (route.length < 2) return route[0] || [0, 0];
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];

  const totalSegments = route.length - 1;
  const segmentProgress = progress * totalSegments;
  const index = Math.floor(segmentProgress);
  const localProgress = segmentProgress - index;

  const start = route[index];
  const end = route[index + 1];

  return [
    start[0] + (end[0] - start[0]) * localProgress,
    start[1] + (end[1] - start[1]) * localProgress
  ];
};

const STATIC_HOSPITALS: Hospital[] = [
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
    phone: '011-26588500',
    ambulances: 10,
    totalAmbulances: 10,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
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
    phone: '011-26707100',
    ambulances: 15,
    totalAmbulances: 15,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  },
  {
    id: 'B-GOVT',
    name: 'Government Hospital Vijayapura',
    type: 'Hospital',
    lat: 16.8350,
    lng: 75.7150,
    beds: { available: 85, total: 400 },
    icuBeds: 10,
    totalIcuBeds: 10,
    status: 'available',
    specialties: ['Emergency', 'General Medicine', 'Maternity'],
    address: 'Station Road, Vijayapura',
    phone: '08352-250011',
    ambulances: 4,
    totalAmbulances: 4,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  },
  {
    id: 'B-BLDE',
    name: 'BLDE (DU) Shri B. M. Patil Hospital',
    type: 'Hospital',
    lat: 16.8250,
    lng: 75.7050,
    beds: { available: 240, total: 1250 },
    icuBeds: 75,
    totalIcuBeds: 80,
    status: 'available',
    specialties: ['Super Specialty', 'Trauma Care', 'Cardiology', 'Neurology'],
    address: 'Solapur Road, Vijayapura',
    phone: '08352-262770',
    ambulances: 12,
    totalAmbulances: 12,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  },
  {
    id: 'B-ALAMEEN',
    name: 'Al-Ameen Medical College Hospital',
    type: 'Hospital',
    lat: 16.8500,
    lng: 75.7300,
    beds: { available: 110, total: 650 },
    icuBeds: 40,
    totalIcuBeds: 45,
    status: 'available',
    specialties: ['General Surgery', 'Pediatrics', 'Orthopedics'],
    address: 'Athani Road, Vijayapura',
    phone: '08352-270045',
    ambulances: 8,
    totalAmbulances: 8,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  },
  {
    id: 'B-MAHAVEER-PHARMA',
    name: 'Mahaveer Medical Store',
    type: 'Medical Store',
    lat: 16.8320,
    lng: 75.7180,
    beds: { available: 0, total: 0 },
    icuBeds: 0,
    totalIcuBeds: 0,
    status: 'available',
    specialties: ['Pharmacy', 'Medicine Distribution'],
    address: 'Siddeshwar Road, Vijayapura',
    phone: '08352-251234',
    ambulances: 0,
    totalAmbulances: 0,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  },
  {
    id: 'B-CITY-CLINIC',
    name: 'City Specialty Clinic',
    type: 'Clinic',
    lat: 16.8280,
    lng: 75.7220,
    beds: { available: 5, total: 10 },
    icuBeds: 0,
    totalIcuBeds: 0,
    status: 'available',
    specialties: ['General Consultation', 'Pediatrics'],
    address: 'Godavari Hotel Road, Vijayapura',
    phone: '08352-255566',
    ambulances: 1,
    totalAmbulances: 1,
    busyAmbulances: 0,
    processingAmbulances: 0,
    completedAmbulances: 0
  }
];

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(STATIC_HOSPITALS);
  const [emergencies, setEmergencies] = useState<Emergency[]>([
    {
      id: 'EM-402',
      name: 'Critical Cardiac Arrest',
      priority: 'HIGH',
      status: 'ASSIGNED',
      description: 'Patient unresponsive at North Sector Terminal. Rapid dispatch initiated.',
      address: 'North Sector Terminal 4, Vijayapura',
      time: '14:20 PM',
      severity: 'critical',
      lat: 16.8350,
      lng: 75.7190
    },
    {
      id: 'EM-405',
      name: 'Trauma - Road Accident',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      description: 'Multi-vehicle collision near Solapur Road bypass.',
      address: 'Solapur Road Bypass, Vijayapura',
      time: '14:35 PM',
      severity: 'moderate',
      lat: 16.8250,
      lng: 75.7050
    }
  ]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  
  // Smart Location Logic: Default to Vijayapura (16.8302, 75.7100)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>([16.8302, 75.7100]);
  const [locationSource, setLocationSource] = useState<'gps' | 'fallback' | 'search'>('fallback');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [useGps, setUseGps] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [isAlreadyDispatching, setIsAlreadyDispatching] = useState(false);
  const [historicalBookings, setHistoricalBookings] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingAmbulanceRequests, setPendingAmbulanceRequests] = useState<any[]>([]);
  const hospitalsRef = useRef<Hospital[]>(STATIC_HOSPITALS);

  // Sync ref with state
  useEffect(() => {
    hospitalsRef.current = hospitals;
  }, [hospitals]);

  const intervalRef = useRef<any>(null);

  // Initialize stats from database
  useEffect(() => {
    const initStats = async () => {
      // Missions completed offset with baseline simulation data
      setOverviewStats(prev => ({
        ...prev,
        missionsCompleted: 142
      }));

      // Initial booking fetch
      const bookings = await fetchRecentBookings();
      setHistoricalBookings(bookings);
      
      const requests = await fetchAdmissionRequests();
      setPendingRequests(requests);

      const ambRequests = await fetchAmbulanceRequests();
      setPendingAmbulanceRequests(ambRequests);
    };
    initStats();
  }, []);

  const toggleSimulation = () => setIsSimulationActive(!isSimulationActive);

  const abortControllerRef = useRef<AbortController | null>(null);

  const syncWithDatabase = useCallback(async (currentHospitals: Hospital[]) => {
    const dbUpdates = await fetchHospitalUpdates();
    if (dbUpdates.length === 0) return currentHospitals;

    return currentHospitals.map(h => {
      const update = dbUpdates.find(up => up.id === h.id);
      if (update) {
        const newAvailable = update.beds?.available ?? h.beds.available;
        const total = update.beds?.total ?? h.beds.total;
        const availabilityPercent = total > 0 ? (newAvailable / total) * 100 : 0;
        
        let newStatus: 'available' | 'busy' | 'full' = 'available';
        if (availabilityPercent < 5) newStatus = 'full';
        else if (availabilityPercent < 20) newStatus = 'busy';

        return { 
          ...h, 
          beds: { 
            available: newAvailable,
            total: total 
          },
          icuBeds: update.icuBeds ?? h.icuBeds,
          totalIcuBeds: update.totalIcuBeds ?? h.totalIcuBeds,
          ambulances: update.ambulances ?? h.ambulances,
          totalAmbulances: update.totalAmbulances ?? h.totalAmbulances,
          status: newStatus
        };
      }
      return h;
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (!userLocation) return;
    
    // Abort previous request if ongoing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    console.log(`Refreshing healthcare data for location: ${userLocation[0]}, ${userLocation[1]}`);
    try {
      // 50km is ideal for a full city-wide scan without compromising speed significantly
      let realDataPromise = fetchNearbyHealthcare(userLocation[0], userLocation[1], 50000); 
      
      const realData = await realDataPromise;
      if (abortControllerRef.current.signal.aborted) return;
      
      const combined = [...STATIC_HOSPITALS, ...realData];
      const unique = combined.filter((h, index, self) => 
        index === self.findIndex((t) => t.id === h.id || t.name === h.name)
      );
      
      console.log(`Nearby search (50km) returned ${unique.length} total elements (including static).`);
      if (unique.length > 0) {
        const topIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
        const withDistance = unique.map(h => ({
          ...h,
          distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
        })).sort((a, b) => {
          // Absolute priority for core city hospitals
          const aIndex = topIds.indexOf(a.id);
          const bIndex = topIds.indexOf(b.id);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;

          // Priority for static assets
          const isAStatic = a.id.startsWith('B-') || a.id.startsWith('F-') || a.id.startsWith('T-');
          const isBStatic = b.id.startsWith('B-') || b.id.startsWith('F-') || b.id.startsWith('T-');
          if (isAStatic && !isBStatic) return -1;
          if (!isAStatic && isBStatic) return 1;
          return (a.distance || 0) - (b.distance || 0);
        });
        setHospitals(withDistance);
        
        // Sync with DB immediately
        const synced = await syncWithDatabase(withDistance);
        setHospitals(synced);
      }
    } catch (error) {
      console.error("Error in refreshData:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, syncWithDatabase]);

  const fetchByBounds = useCallback(async (south: number, west: number, north: number, east: number, zoom: number) => {
    // Abort previous request if ongoing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    // Silent update
    try {
      const realData = await fetchHealthcareByBounds(south, west, north, east, zoom);
      if (abortControllerRef.current.signal.aborted) return;
      
      console.log(`Overpass API returned ${realData.length} elements for bounds.`);
      
      const combined = [...STATIC_HOSPITALS, ...realData];
      // Ensure both ID and Name are unique
      const unique = combined.filter((h, index, self) => 
        index === self.findIndex((t) => t.id === h.id || t.name === h.name)
      );
      
      const topIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
      const finalHospitals = unique.map(h => ({
        ...h,
        distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) : undefined
      })).sort((a, b) => {
        const aIndex = topIds.indexOf(a.id);
        const bIndex = topIds.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        const isAStatic = a.id.startsWith('B-') || a.id.startsWith('F-') || a.id.startsWith('T-');
        const isBStatic = b.id.startsWith('B-') || b.id.startsWith('F-') || b.id.startsWith('T-');
        if (isAStatic && !isBStatic) return -1;
        if (!isAStatic && isBStatic) return 1;
        return (a.distance || 0) - (b.distance || 0);
      });

      // Update state once
      setHospitals(finalHospitals);

      // Run sync in background and update state when done
      const synced = await syncWithDatabase(finalHospitals);
      setHospitals(synced);
    } catch (error) {
      // Silently handle bounds fetch failures
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, syncWithDatabase, hospitals.length]);

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

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Background simulation for hospital metrics
      if (isSimulationActive) {
        setHospitals(prev => prev.map(h => {
          // EXCLUDE THE CONSTANT HOSPITALS from simulation
          const topIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
          if (topIds.includes(h.id)) return h;

          // Agent Simulation Logic: Dynamically manage resources based on load
          const deltaBeds = Math.random() > 0.6 ? (Math.random() > 0.8 ? 2 : 1) : (Math.random() > 0.5 ? -1 : 0);
          const newAvailable = Math.max(0, Math.min(h.beds.total, h.beds.available + deltaBeds));
          
          const deltaIcu = Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const newIcu = Math.max(0, Math.min(h.totalIcuBeds, h.icuBeds + deltaIcu));
          
          // Ambulance availability management
          let newAmbulances = h.ambulances;
          if (h.ambulances < h.totalAmbulances && Math.random() > 0.92) {
            newAmbulances += 1;
            // No notification to avoid spamming sidebar
          } else if (h.ambulances > 0 && Math.random() > 0.96) {
            newAmbulances -= 1;
          }
          
          const availabilityPercent = h.beds.total > 0 ? (newAvailable / h.beds.total) * 100 : 0;
          let newStatus: 'available' | 'busy' | 'full' = 'available';
          if (availabilityPercent < 5) newStatus = 'full';
          else if (availabilityPercent < 20) newStatus = 'busy';

          return {
            ...h,
            beds: { ...h.beds, available: newAvailable },
            icuBeds: newIcu,
            ambulances: newAmbulances,
            status: newStatus
          };
        }));

        setOverviewStats(prev => ({
          ...prev,
          completedToday: prev.completedToday + (Math.random() > 0.99 ? 1 : 0),
          // Dynamic Graph Jitter
          weeklyTrends: prev.weeklyTrends.map((t, idx) => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDayIdx = new Date().getDay();
            const dayName = days[currentDayIdx];
            if (t.name === dayName) {
              return { ...t, bookings: t.bookings + (Math.random() > 0.95 ? 1 : 0) };
            }
            return t;
          })
        }));

        // Random Emergency Generation
        if (Math.random() > 0.985 && emergencies.filter(e => e.status !== 'COMPLETED').length < 5) {
          const validHosps = hospitalsRef.current.filter(h => h.lat && h.lng);
          const h = validHosps[Math.floor(Math.random() * validHosps.length)];
          if (h) {
            const eId = `SIM-${Math.random().toString(36).substr(2, 5)}`;
            setEmergencies(prev => [...prev, {
              id: eId,
              name: `Emergency ${eId}`,
              priority: 'MEDIUM',
              status: 'ASSIGNED',
              description: 'Emergency reported via simulation channel.',
              address: 'Grid Delta Sector 4',
              time: new Date().toLocaleTimeString(),
              lat: h.lat + (Math.random() - 0.5) * 0.02,
              lng: h.lng + (Math.random() - 0.5) * 0.02
            }]);
          }
        }
      }

      // 2. Responder Movement logic - ALWAYS RUNS if there are responders
      setResponders(prev => {
        if (prev.length === 0) return prev;
        
        const nextResponders = prev.map(r => {
          if (!r.route || !r.startTime || !r.totalTime) return r;
          if (r.status !== 'EN_ROUTE' && r.status !== 'RETURNING' && r.status !== 'TO_HOSPITAL') return r;

          const now = Date.now();
          const elapsed = (now - r.startTime) / 1000;
          const progress = Math.min(1, elapsed / r.totalTime);
          const curPos = interpolatePosition(r.route, progress);
          
          const remainingSeconds = Math.max(0, r.totalTime - elapsed);
          const currentEta = Math.round(remainingSeconds / 60 * 10) / 10;

          if (progress >= 1) {
            if (r.status === 'EN_ROUTE') {
              // Arrived at Pickup (User Location)
              if (r.emergencyId) {
                setEmergencies(ems => ems.map(e => e.id === r.emergencyId ? { ...e, status: 'ASSIGNED' } : e));
              }
              addNotification('Unit on Scene', `Ambulance ${r.id.split('-')[1]} has reached the pickup location.`, 'info');
              return { ...r, status: 'ON_SCENE', lat: curPos[0], lng: curPos[1], eta: 0 };
            } else if (r.status === 'TO_HOSPITAL') {
              // Arrived at Target Hospital
              if (r.emergencyId) {
                setEmergencies(ems => ems.map(e => e.id === r.emergencyId ? { ...e, status: 'COMPLETED' } : e));
              }
              
              // Increment mission success stats
              setOverviewStats(s => ({ ...s, missionsCompleted: s.missionsCompleted + 1, completedToday: s.completedToday + 1 }));
              
              addNotification('Mission Success', `Patient successfully delivered to medical node by ${r.id.split('-')[1]}.`, 'success');
              return { ...r, status: 'ON_SCENE', lat: curPos[0], lng: curPos[1], eta: 0 };
            } else if (r.status === 'RETURNING') {
              // Arrived back at Base
              if (r.hospitalId) {
                setHospitals(hosps => hosps.map(hosp => hosp.id === r.hospitalId ? {
                   ...hosp,
                   ambulances: Math.min(hosp.totalAmbulances, hosp.ambulances + 1)
                } : hosp));
              }
              return null;
            }
          }

          return { ...r, lat: curPos[0], lng: curPos[1], eta: currentEta };
        });

        return nextResponders.filter(Boolean) as Responder[];
      });

      // 3. Simple State Transitions
      setResponders(prev => prev.map(r => {
        if (r.status === 'ON_SCENE') {
          const onSceneElapsed = (Date.now() - (r.startTime! + r.totalTime! * 1000)) / 1000;
          if (onSceneElapsed > 5) {
            // Stage Transition
            const lastStatus = r.destination ? (r.lat === r.destination[0] && r.lng === r.destination[1] ? 'PICKUP_COMPLETE' : 'HOSPITAL_ARRIVAL') : 'NONE';
            
            if (r.targetHospitalId && r.destination && r.lat === r.destination[0] && r.lng === r.destination[1]) {
               // Move to target hospital
               const targetHosp = hospitalsRef.current.find(h => h.id === r.targetHospitalId);
               if (targetHosp) {
                 const dist = calculateDistance(r.lat, r.lng, targetHosp.lat, targetHosp.lng);
                 const duration = Math.max(15, (dist / r.speed) * 3600);
                 return {
                   ...r,
                   status: 'TO_HOSPITAL',
                   startTime: Date.now(),
                   totalTime: duration,
                   destination: [targetHosp.lat, targetHosp.lng],
                   route: generateRoute([r.lat, r.lng], [targetHosp.lat, targetHosp.lng]),
                   targetHospitalId: undefined // Consume it after transition starts
                 };
               }
            }

            // Return to base if no target hospital or already at hospital
            const baseHosp = hospitalsRef.current.find(h => h.id === r.hospitalId);
            if (baseHosp) {
              const dist = calculateDistance(r.lat, r.lng, baseHosp.lat, baseHosp.lng);
              const duration = Math.max(15, (dist / r.speed) * 3600);
              return {
                ...r,
                status: 'RETURNING',
                startTime: Date.now(),
                totalTime: duration,
                destination: [baseHosp.lat, baseHosp.lng],
                route: generateRoute([r.lat, r.lng], [baseHosp.lat, baseHosp.lng])
              };
            }
          }
        }
        return r;
      }));
    }, 600); // Optimized for 600ms updates for smoother movement

    return () => clearInterval(interval);
  }, [isSimulationActive, emergencies]);

  // Period DB Sync (Faster for real-time feel)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const synced = await syncWithDatabase(hospitalsRef.current);
        setHospitals(synced);
        
        // Also fetch recent bookings
        const bookings = await fetchRecentBookings();
        setHistoricalBookings(bookings);
      } catch (err) {
        console.error("Sync interval error:", err);
      }
    }, 5000); // Increased frequency to 5s
    return () => clearInterval(syncInterval);
  }, [syncWithDatabase]);

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

    setIsLoading(true);
    console.log("Starting geolocation tracking...");

    // Kickstart with a one-shot request
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation([latitude, longitude]);
        setLocationAccuracy(accuracy);
        setLocationSource('gps');
      },
      (err) => console.warn("Initial GPS lock failed", err),
      { enableHighAccuracy: true, timeout: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        
        // If accuracy is extremely poor (e.g. > 5km), it's likely IP-based guess.
        // We still show it but mark it as fallback if it's too far from Bijapur
        // to avoid jumping to Solapur/other cities incorrectly.
        const distFromBijapur = calculateDistance(latitude, longitude, 16.8302, 75.7100);
        
        if (accuracy > 3000 && distFromBijapur > 50) {
          console.log("Low accuracy location detected far from Vijayapura, staying at Vijayapura.");
          setUserLocation([16.8302, 75.7100]);
          setLocationSource('fallback');
          setLocationAccuracy(accuracy);
        } else {
          console.log(`User Location Update: [${latitude}, ${longitude}] (Accuracy: ${accuracy}m)`);
          setUserLocation([latitude, longitude]);
          setLocationAccuracy(accuracy);
          setLocationSource('gps');
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        
        // If GPS fails, always default to Vijayapura
        setUserLocation([16.8302, 75.7100]);
        setLocationSource('fallback');
        setLocationAccuracy(null);
        setIsLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 20000, // Increased timeout to allow GPS to lock
        maximumAge: 0   // Force fresh data
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useGps]);

  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    occupiedBeds: 0,
    occupiedIcu: 0,
    busyAmbulances: 0,
    missionsCompleted: 142,
    completedToday: 24,
    avgResponseTime: 8.5,
    weeklyTrends: [
      { name: 'Mon', bookings: 45 },
      { name: 'Tue', bookings: 52 },
      { name: 'Wed', bookings: 38 },
      { name: 'Thu', bookings: 65 },
      { name: 'Fri', bookings: 48 },
      { name: 'Sat', bookings: 70 },
      { name: 'Sun', bookings: 62 },
    ]
  });

  const findBestHospital = useCallback((resourceType: 'bed' | 'icu' | 'ambulance', nearCoords?: [number, number]) => {
    // 1. Priority Hospitals
    const priorityIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
    
    const candidates = hospitals.filter(h => {
      if (resourceType === 'bed') return h.beds.available > 0;
      if (resourceType === 'icu') return h.icuBeds > 0;
      if (resourceType === 'ambulance') return h.ambulances > 0;
      return false;
    });

    if (candidates.length === 0) return null;

    // The logic requested: Priority wise 1. Govt, 2. BLDE, 3. Alameen, then others
    // We only use this global priority if NO nearCoords are provided (Smart Route)
    // Or if we want to enforce it for Bed bookings as requested.
    
    // Sort by proximity to target if coordinates provided (for Ambulance dispatch start)
    // Otherwise by the requested priority
    return candidates.sort((a, b) => {
      // If we have search coordinates (like for ambulance pickup), find closest unit node
      if (nearCoords) {
        const distA = calculateDistance(nearCoords[0], nearCoords[1], a.lat, a.lng);
        const distB = calculateDistance(nearCoords[0], nearCoords[1], b.lat, b.lng);
        return distA - distB;
      }

      // Hierarchy: Govt -> BLDE -> Alameen -> Distance
      const aPrio = priorityIds.indexOf(a.id);
      const bPrio = priorityIds.indexOf(b.id);
      
      const aVal = aPrio === -1 ? 99 : aPrio;
      const bVal = bPrio === -1 ? 99 : bPrio;

      if (aVal !== bVal) return aVal - bVal;
      return (a.distance || 0) - (b.distance || 0);
    })[0];
  }, [hospitals]);

  // Sync global occupancy stats with hospital data
  useEffect(() => {
    const totalBedsAvailable = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
    const totalBedsTotal = hospitals.reduce((acc, h) => acc + h.beds.total, 0);
    const totalIcuAvailable = hospitals.reduce((acc, h) => acc + h.icuBeds, 0);
    const totalIcuTotal = hospitals.reduce((acc, h) => acc + h.totalIcuBeds, 0);

    setOverviewStats(s => ({
      ...s,
      occupiedBeds: totalBedsTotal - totalBedsAvailable,
      occupiedIcu: totalIcuTotal - totalIcuAvailable
    }));
  }, [hospitals]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastAlertState = useRef<Record<string, 'HIGH' | 'MEDIUM' | 'NONE'>>({});

  const addNotification = useCallback((
    title: string, 
    message: string, 
    type: Notification['type'] = 'info',
    priority?: Notification['priority'],
    resourceType?: Notification['resourceType'],
    hospitalId?: string,
    hospitalName?: string,
    distance?: number
  ) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      priority,
      resourceType,
      hospitalId,
      hospitalName,
      distance,
      timestamp: new Date().toLocaleTimeString(),
      read: false,
      resolved: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const bookResource = useCallback((hospitalId: string, resourceType: 'bed' | 'icu', name: string, phone: string, age: string, emergencyPhone: string) => {
    const topIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
    const isConstantHospital = topIds.includes(hospitalId);

    // Filter: Only save to DB if it's one of the 3 constant hospitals
    if (isConstantHospital) {
      const patientId = `P-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      saveBedBooking({
        id_code: patientId,
        patient_name: name,
        hospital_id: hospitalId,
        hospital_name: hospitalsRef.current.find(h => h.id === hospitalId)?.name || 'Unknown',
        patient_age: age,
        contact_number: phone,
        emergency_number: emergencyPhone,
        timestamp: new Date().toISOString()
      } as any).then(() => {
        fetchRecentBookings().then(setHistoricalBookings);
      });
    }

    setHospitals(prev => {
      const hospitalIndex = prev.findIndex(h => h.id === hospitalId);
      if (hospitalIndex === -1) return prev;

      const h = prev[hospitalIndex];
      const update = { ...h };
      let updatedVal = -1;
      let dbField = '';

      if (resourceType === 'bed' && h.beds.available > 0) {
        updatedVal = h.beds.available - 1;
        dbField = 'available_beds';
        update.beds = { ...h.beds, available: updatedVal };
        
        setOverviewStats(s => ({ 
          ...s, 
          occupiedBeds: s.occupiedBeds + 1,
          weeklyTrends: s.weeklyTrends.map(t => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDay = days[new Date().getDay()];
            return t.name === currentDay ? { ...t, bookings: t.bookings + 1 } : t;
          })
        }));
      } else if (resourceType === 'icu' && h.icuBeds > 0) {
        updatedVal = h.icuBeds - 1;
        dbField = 'available_icu';
        update.icuBeds = updatedVal;
        
        setOverviewStats(s => ({ 
          ...s, 
          occupiedIcu: s.occupiedIcu + 1,
          weeklyTrends: s.weeklyTrends.map(t => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDay = days[new Date().getDay()];
            return t.name === currentDay ? { ...t, bookings: t.bookings + 1 } : t;
          })
        }));
      }

      if (updatedVal !== -1) {
        // Perform DB sync outside if possible, but for simplicity here we check the field
        if (isConstantHospital && dbField) {
          updateHospitalResource(h.id, dbField, updatedVal);
        }

        const notificationMsg = resourceType === 'icu' 
          ? `ICU Bed successfully reserved for ${name} at ${h.name}.`
          : `Bed successfully reserved for ${name} at ${h.name}.`;

        addNotification(
          resourceType === 'icu' ? 'ICU Bed Booked' : 'Bed Booked',
          notificationMsg,
          'success'
        );

        if (isConstantHospital) setTimeout(refreshData, 2000);
      }

      const next = [...prev];
      next[hospitalIndex] = update;
      return next;
    });
  }, [addNotification, refreshData]);

  const dispatchAmbulance = useCallback(async (hospitalId: string, destination: [number, number], requesterName: string = 'Emergency', phoneNumber: string = 'Not Provided', count: number = 1, address: string = '', targetHospitalId?: string) => {
    if (isAlreadyDispatching) {
      addNotification('Request Denied', 'An ambulance is already in transit. Please wait for the current mission to complete.', 'warning');
      return;
    }
    
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital || hospital.ambulances < count) return;

    const topIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
    const isConstantHospital = topIds.includes(hospitalId);

    // Save dispatch to DB ONLY for constant hospitals
    if (isConstantHospital) {
      const missionId = `A-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      saveAmbulanceMission({
        id_code: missionId,
        patient_name: requesterName,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        contact_number: phoneNumber,
        address: address || `COORD: ${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}`,
        timestamp: new Date().toISOString()
      } as any).then(() => {
        fetchRecentBookings().then(setHistoricalBookings);
      });
      
      // Corrected database field name
      updateHospitalResource(hospital.id, 'available_ambulance', hospital.ambulances - count);
    }

    setIsAlreadyDispatching(true);
    setIsLoading(true);
    
    // Fetch the real road route once for all units in this dispatch
    const osrmData = await fetchOSRMRoute([hospital.lat, hospital.lng], destination);
    setIsLoading(false);

    // Create an Emergency record for tracking on Dashboard
    const emergencyId = `EMT-${Math.random().toString(36).substr(2, 9)}`;
    const newEmergency: Emergency = {
      id: emergencyId,
      name: requesterName,
      priority: 'HIGH',
      status: 'ASSIGNED',
      description: `Ambulance dispatch to ${requesterName}. Contact: ${phoneNumber}${targetHospitalId ? ` | Destination Hospital: ${targetHospitalId}` : ''}`,
      address: address || `COORD: ${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}`,
      time: new Date().toLocaleTimeString()
    };
    setEmergencies(prev => [...prev, newEmergency]);

    // Update global stats
    setOverviewStats(s => ({ 
      ...s, 
      busyAmbulances: s.busyAmbulances + count,
      weeklyTrends: s.weeklyTrends.map(t => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = days[new Date().getDay()];
        return t.name === currentDay ? { ...t, bookings: t.bookings + count } : t;
      })
    }));

    const newResponders: Responder[] = [];
    
    // Update Hospital State (Outermost)
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId && h.ambulances >= count) {
        const hLat = h.lat;
        const hLng = h.lng;
        
        // Prepare spawn responders
        for (let i = 0; i < count; i++) {
          const responderId = `AMB-${Math.random().toString(36).substr(2, 9)}`;
          const distance = calculateDistance(hLat, hLng, destination[0], destination[1]);
          const speed = 40 + Math.random() * 15; // km/h
          
          const totalTimeSeconds = osrmData ? osrmData.duration : Math.max(20, (distance / speed) * 3600); 
          const route = osrmData ? osrmData.coordinates : generateRoute([hLat, hLng], destination);
          
          const newResponder: Responder = {
            id: responderId,
            type: 'AMBULANCE',
            status: 'EN_ROUTE',
            lat: hLat,
            lng: hLng,
            hospitalId: h.id,
            targetHospitalId: targetHospitalId,
            emergencyId: emergencyId,
            speed: speed,
            route: route,
            destination: destination,
            startTime: Date.now(),
            totalTime: totalTimeSeconds
          };
          
          newResponders.push(newResponder);
        }

        return { ...h, ambulances: h.ambulances - count };
      }
      return h;
    }));

    setResponders(r => [...r, ...newResponders]);
    
    newResponders.forEach(nr => {
       addNotification(
        'Dispatch Confirmed',
        `Ambulance ${nr.id.split('-')[1]} is on its way to ${requesterName}.`,
        'info'
      );
    });

    setIsAlreadyDispatching(false);
  }, [calculateDistance, addNotification, hospitals, isAlreadyDispatching]);

  const requestAdmission = useCallback(async (hospitalId: string, name: string, age: string, phone: string, emergencyPhone: string) => {
    const timestamp = new Date().toISOString();
    const id_code = `RQ-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const result = await saveAdmissionRequest({
      hospital_id: hospitalId,
      name,
      age,
      contact_number: phone,
      emergency_number: emergencyPhone,
      id_code,
      timestamp
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // Refresh pending requests
    const updatedRequests = await fetchAdmissionRequests();
    setPendingRequests(updatedRequests);

    addNotification(
      'Admission Requested',
      `Hospital admission request for ${name} submitted and pending approval.`,
      'info',
      'MEDIUM',
      'BED',
      hospitalId
    );
  }, [addNotification]);

  const approveRequest = useCallback(async (requestId: string) => {
    setPendingRequests(prev => {
      const request = prev.find(r => r.id === requestId);
      if (!request) return prev;

      (async () => {
        try {
          await updateAdmissionRequestStatus(requestId, 'APPROVED');
          
          await saveBedBooking({
            id_code: request.id_code,
            patient_name: request.name,
            hospital_id: request.hospital_id,
            patient_age: request.age.toString(),
            contact_number: request.contact_number.toString(),
            emergency_number: request.emergency_number.toString(),
            timestamp: new Date().toISOString()
          });

          const currentHospital = hospitalsRef.current.find(h => h.id === request.hospital_id);
          if (currentHospital) {
            await updateHospitalResource(currentHospital.id, 'available_beds', currentHospital.beds.available - 1);
          }

          const updatedRequests = await fetchAdmissionRequests();
          setPendingRequests(updatedRequests);
          const updatedBookings = await fetchRecentBookings();
          setHistoricalBookings(updatedBookings);

          addNotification(
            'Admission Approved',
            `Admission request for ${request.name} was approved. Patient admitted.`,
            'success',
            'HIGH',
            'BED',
            request.hospital_id
          );
        } catch (error) {
          console.error('Failed to approve request:', error);
        }
      })();

      return prev;
    });
  }, [addNotification]);

  const rejectRequest = useCallback(async (requestId: string) => {
    setPendingRequests(prev => {
      const request = prev.find(r => r.id === requestId);
      if (!request) return prev;

      (async () => {
        try {
          await updateAdmissionRequestStatus(requestId, 'REJECTED');
          const updatedRequests = await fetchAdmissionRequests();
          setPendingRequests(updatedRequests);

          addNotification(
            'Admission Rejected',
            `Admission request for ${request.name} was declined.`,
            'warning',
            'MEDIUM',
            'BED',
            request.hospital_id
          );
        } catch (error) {
          console.error('Failed to reject request:', error);
        }
      })();

      return prev;
    });
  }, [addNotification]);

  const requestAmbulanceMission = useCallback(async (hospitalId: string, destination: [number, number], name: string, phone: string, address: string = '', targetHospitalId?: string) => {
    const timestamp = new Date().toISOString();
    
    // Embed target hospital ID in address for retrieval on approval
    const fullAddress = targetHospitalId ? `${address || `COORD: ${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}`} [TH:${targetHospitalId}]` : address;

    const result = await saveAmbulanceRequest({
      hospital_id: hospitalId,
      patient_name: name,
      contact_number: phone,
      pickup_location: fullAddress || `COORD: ${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}`,
      priority: 'Normal',
      timestamp
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    const updatedRequests = await fetchAmbulanceRequests();
    setPendingAmbulanceRequests(updatedRequests);

    const updatedBookings = await fetchRecentBookings();
    setHistoricalBookings(updatedBookings);

    addNotification(
      'Ambulance Requested',
      `Ambulance dispatch request for ${name} submitted and pending approval.`,
      'info',
      'MEDIUM',
      'AMBULANCE',
      hospitalId
    );
  }, [addNotification]);

  const approveAmbulanceRequest = useCallback(async (requestId: string) => {
    setPendingAmbulanceRequests(prev => {
      const request = prev.find(r => r.id === requestId);
      if (!request) return prev;

      (async () => {
        try {
          await updateAmbulanceRequestStatus(requestId, 'APPROVED');
          
          // Coordinate parsing from pickup_location or search if needed
          let coords: [number, number] = [userLocation?.[0] || 16.83, userLocation?.[1] || 75.71];
          const coordMatch = request.pickup_location.match(/COORD:\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
          if (coordMatch) {
            coords = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
          }

          // Extract embedded target hospital ID
          const targetMatch = request.pickup_location.match(/\[TH:(.*?)\]/);
          const extractedTargetId = targetMatch ? targetMatch[1] : undefined;

          await dispatchAmbulance(
            request.hospital_id,
            coords,
            request.patient_name,
            request.contact_number.toString(),
            1,
            request.pickup_location.replace(/\[TH:.*?\]/, '').trim(), // Clean up address for display
            extractedTargetId
          );

          const updatedRequests = await fetchAmbulanceRequests();
          setPendingAmbulanceRequests(updatedRequests);

          addNotification(
            'Ambulance Approved',
            `Dispatch request for ${request.patient_name || request.name} approved. Unit mobilized.`,
            'success',
            'HIGH',
            'AMBULANCE',
            request.hospital_id
          );
        } catch (error) {
          console.error('Failed to approve ambulance request:', error);
        }
      })();

      return prev;
    });
  }, [addNotification, dispatchAmbulance, userLocation]);

  const rejectAmbulanceRequest = useCallback(async (requestId: string) => {
    setPendingAmbulanceRequests(prev => {
      const request = prev.find(r => r.id === requestId);
      if (!request) return prev;

      (async () => {
        try {
          await updateAmbulanceRequestStatus(requestId, 'REJECTED');
          const updatedRequests = await fetchAmbulanceRequests();
          setPendingAmbulanceRequests(updatedRequests);

          addNotification(
            'Ambulance Rejected',
            `Dispatch request for ${request.patient_name || request.name} was declined.`,
            'warning',
            'MEDIUM',
            'AMBULANCE',
            request.hospital_id
          );
        } catch (error) {
          console.error('Failed to reject ambulance request:', error);
        }
      })();

      return prev;
    });
  }, [addNotification]);

  // Alert Generation Engine
  useEffect(() => {
    const handleTrigger = () => {
      const h = hospitals[Math.floor(Math.random() * hospitals.length)];
      if (h && h.lat && h.lng) {
        const eId = `MANUAL-${Math.random().toString(36).substr(2, 5)}`;
        const newE: Emergency = {
          id: eId,
          name: `Emergency Alert ${eId}`,
          priority: 'HIGH',
          status: 'ASSIGNED',
          description: 'User initiated emergency protocol.',
          address: 'Tactical Deployment Zone',
          time: new Date().toLocaleTimeString(),
          lat: h.lat + (Math.random() - 0.5) * 0.04,
          lng: h.lng + (Math.random() - 0.5) * 0.04
        };
        setEmergencies(prev => [...prev, newE]);
        addNotification("Manual Override", "New emergency mission dispatched manually.", "warning");
      }
    };
    window.addEventListener('triggerRandomEmergency', handleTrigger);
    return () => window.removeEventListener('triggerRandomEmergency', handleTrigger);
  }, [hospitals, addNotification]);

  useEffect(() => {
    hospitals.forEach(h => {
      const hospitalKey = h.id;
      
      const checkResource = (
        type: 'ICU' | 'BED' | 'AMBULANCE', 
        val: number, 
        criticalVal: number, 
        warningVal: number,
        name: string
      ) => {
        const key = `${hospitalKey}-${type}`;
        let currentPriority: 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';
        
        if (val <= criticalVal) currentPriority = 'HIGH';
        else if (val <= warningVal) currentPriority = 'MEDIUM';
        
        const lastPriority = lastAlertState.current[key] || 'NONE';
        
        if (currentPriority !== lastPriority) {
          if (currentPriority === 'HIGH') {
            addNotification(
              `[HIGH] ${h.name} ${name} Full`,
              `${h.name} reports zero ${name.toLowerCase()}s available. Redirect immediate cases.`,
              'error',
              'HIGH',
              type,
              h.id,
              h.name,
              h.distance
            );
          } else if (currentPriority === 'MEDIUM') {
            addNotification(
              `[MEDIUM] ${h.name} ${name} Almost Full`,
              `${h.name} has only ${val} ${name.toLowerCase()}${val === 1 ? '' : 's'} left.`,
              'warning',
              'MEDIUM',
              type,
              h.id,
              h.name,
              h.distance
            );
          } else if (currentPriority === 'NONE' && lastPriority !== 'NONE') {
            // Resource restored
            addNotification(
              `[LOW] ${h.name} ${name} Available`,
              `${h.name} resources have been restored. ${val} ${name.toLowerCase()}s now available.`,
              'success',
              'LOW',
              type,
              h.id,
              h.name,
              h.distance
            );
            
            // Mark previous alerts for this resource as resolved
            setNotifications(prev => prev.map(n => 
              (n.hospitalId === h.id && n.resourceType === type) ? { ...n, resolved: true } : n
            ));
          }
          lastAlertState.current[key] = currentPriority;
        }
      };

      // ICU Monitoring
      checkResource('ICU', h.icuBeds, 0, 2, 'ICU');
      // Beds Monitoring
      checkResource('BED', h.beds.available, 0, 5, 'Bed');
      // Ambulance Monitoring
      checkResource('AMBULANCE', h.ambulances, 0, 1, 'Ambulance');
    });
  }, [hospitals, addNotification]);

  return (
    <SimulationContext.Provider value={{
      hospitals,
      emergencies,
      responders,
      isSimulationActive,
      toggleSimulation,
      userLocation,
      setUserLocation,
      isLoading,
      setIsLoading,
      locationSource,
      useGps,
      setUseGps,
      locationAccuracy,
      refreshData,
      fetchByBounds,
      searchLocation,
      bookResource,
      dispatchAmbulance,
      overviewStats,
      searchQuery,
      setSearchQuery,
      filterType,
      setFilterType,
      statusFilter,
      setStatusFilter,
      notifications,
      addNotification,
      markNotificationsAsRead,
      markAsRead,
      isAlreadyDispatching,
      findBestHospital,
      historicalBookings,
      pendingRequests,
      pendingAmbulanceRequests,
      requestAdmission,
      requestAmbulanceMission,
      approveRequest,
      rejectRequest,
      approveAmbulanceRequest,
      rejectAmbulanceRequest,
      initialStats: []
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
