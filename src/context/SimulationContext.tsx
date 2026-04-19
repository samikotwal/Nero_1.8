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
  status: 'IDLE' | 'EN_ROUTE' | 'ON_SCENE' | 'RETURNING';
  lat: number;
  lng: number;
  emergencyId?: string;
  hospitalId?: string;
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
  timestamp: string;
  read: boolean;
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
  bookResource: (hospitalId: string, resourceType: 'bed' | 'icu') => void;
  dispatchAmbulance: (hospitalId: string, destination: [number, number], requesterName?: string, count?: number) => void;
  overviewStats: OverviewStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  statusFilter: 'all' | 'available' | 'busy';
  setStatusFilter: (filter: 'all' | 'available' | 'busy') => void;
  notifications: Notification[];
  addNotification: (title: string, message: string, type: Notification['type']) => void;
  markNotificationsAsRead: () => void;
  isAlreadyDispatching: boolean;
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
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return {
        coordinates: data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
        duration: data.routes[0].duration // seconds
      };
    }
  } catch (error) {
    console.error("OSRM Route Fetch Error:", error);
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
  }
];

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>(STATIC_HOSPITALS);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
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

  const toggleSimulation = () => setIsSimulationActive(!isSimulationActive);

  const isFetching = useRef(false);

  const refreshData = useCallback(async () => {
    if (!userLocation || isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    // Silent update
    console.log(`Refreshing healthcare data for location: ${userLocation[0]}, ${userLocation[1]}`);
    try {
      let realDataPromise = fetchNearbyHealthcare(userLocation[0], userLocation[1], 50000); // Expanded to 50km for full city-wide coverage
      
      const realData = await realDataPromise;
      
      const combined = [...STATIC_HOSPITALS, ...realData];
      const unique = combined.filter((h, index, self) => 
        index === self.findIndex((t) => t.name === h.name)
      );
      
      console.log(`Nearby search returned ${unique.length} total elements (including static).`);
      if (unique.length > 0) {
        const withDistance = unique.map(h => ({
          ...h,
          distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng)
        })).sort((a, b) => {
          // Prioritize injected Bijapur static hospitals
          const isAStatic = a.id.startsWith('B-');
          const isBStatic = b.id.startsWith('B-');
          if (isAStatic && !isBStatic) return -1;
          if (!isAStatic && isBStatic) return 1;
          return (a.distance || 0) - (b.distance || 0);
        });
        setHospitals(withDistance);
      }
    } catch (error) {
      console.error("Error in refreshData:", error);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  }, [userLocation]);

  const fetchByBounds = useCallback(async (south: number, west: number, north: number, east: number, zoom: number) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);
    // Silent update
    try {
      const realData = await fetchHealthcareByBounds(south, west, north, east, zoom);
      console.log(`Overpass API returned ${realData.length} elements for bounds.`);
      
      // Preserve static hospitals
      setHospitals(prev => {
        const combined = [...STATIC_HOSPITALS, ...realData];
        const unique = combined.filter((h, index, self) => 
          index === self.findIndex((t) => t.name === h.name)
        );
        
        return unique.map(h => ({
          ...h,
          distance: userLocation ? calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) : undefined
        })).sort((a, b) => {
          const isAStatic = a.id.startsWith('B-');
          const isBStatic = b.id.startsWith('B-');
          if (isAStatic && !isBStatic) return -1;
          if (!isAStatic && isBStatic) return 1;
          return (a.distance || 0) - (b.distance || 0);
        });
      });
    } catch (error) {
      // Silently handle bounds fetch failures
      setIsLoading(false);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
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
      // 1. Update Hospital Beds
      setHospitals(prev => prev.map(h => {
        const newAvailable = Math.max(0, Math.min(h.beds.total, h.beds.available + (Math.random() > 0.5 ? 1 : -1)));
        const newIcu = Math.max(0, Math.min(h.totalIcuBeds, h.icuBeds + (Math.random() > 0.8 ? 1 : Math.random() > 0.8 ? -1 : 0)));
        
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

      // 2. Update Responder Movement
      setResponders(prev => prev.map(r => {
        if (r.status !== 'EN_ROUTE' || !r.emergencyId) return r;

        const emergency = emergencies.find(e => e.id === r.emergencyId);
        if (!emergency || !emergency.lat || !emergency.lng) return r;

        const dist = calculateDistance(r.lat, r.lng, emergency.lat, emergency.lng);
        
        // If arrived (within 50 meters)
        if (dist < 0.05) {
          return { ...r, status: 'ON_SCENE', eta: 0 };
        }

        // Calculate step (assuming 5s interval)
        const speedKms = r.speed / 3600; // km per second
        const stepDist = speedKms * 5; // km in 5 seconds
        
        const angle = Math.atan2(emergency.lat - r.lat, emergency.lng - r.lng);
        const nextLat = r.lat + (stepDist / 111) * Math.sin(angle); // roughly 111km per deg
        const nextLng = r.lng + (stepDist / (111 * Math.cos(r.lat * Math.PI / 180))) * Math.cos(angle);

        // Simple linear interpolation for demonstration, we use Haversine for display
        const remainingDist = calculateDistance(nextLat, nextLng, emergency.lat, emergency.lng);
        const eta = Math.round((remainingDist / r.speed) * 60);

        return {
          ...r,
          lat: nextLat,
          lng: nextLng,
          eta: Math.max(1, eta)
        };
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulationActive, emergencies]);

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
    busyAmbulances: 0
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((title: string, message: string, type: Notification['type'] = 'info') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  }, []);

  const markNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const bookResource = useCallback((hospitalId: string, resourceType: 'bed' | 'icu') => {
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId) {
        const update = { ...h };
        if (resourceType === 'bed' && h.beds.available > 0) {
          update.beds = { ...h.beds, available: h.beds.available - 1 };
          setOverviewStats(s => ({ ...s, occupiedBeds: s.occupiedBeds + 1 }));
        } else if (resourceType === 'icu' && h.icuBeds > 0) {
          update.icuBeds = h.icuBeds - 1;
          setOverviewStats(s => ({ ...s, occupiedIcu: s.occupiedIcu + 1 }));
        }
        return update;
      }
      return h;
    }));
  }, []);

  const dispatchAmbulance = useCallback(async (hospitalId: string, destination: [number, number], requesterName: string = 'Emergency', count: number = 1) => {
    if (isAlreadyDispatching) {
      addNotification('Request Denied', 'An ambulance is already in transit. Please wait for the current mission to complete.', 'warning');
      return;
    }
    
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (!hospital || hospital.ambulances < count) return;

    setIsAlreadyDispatching(true);
    setIsLoading(true);
    // Fetch the real road route once for all units in this dispatch
    const osrmData = await fetchOSRMRoute([hospital.lat, hospital.lng], destination);
    setIsLoading(false);

    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId && h.ambulances >= count) {
        const hLat = h.lat;
        const hLng = h.lng;
        
        // Spawn responders
        for (let i = 0; i < count; i++) {
          const responderId = `AMB-${Math.random().toString(36).substr(2, 9)}`;
          const distance = calculateDistance(hLat, hLng, destination[0], destination[1]);
          const speed = 40 + Math.random() * 15; // km/h
          
          // Use OSRM duration if available for "Real Time" travel
          const totalTimeSeconds = osrmData ? osrmData.duration : Math.max(20, (distance / speed) * 3600); 
          const route = osrmData ? osrmData.coordinates : generateRoute([hLat, hLng], destination);
          
          const newResponder: Responder = {
            id: responderId,
            type: 'AMBULANCE',
            status: 'EN_ROUTE',
            lat: hLat,
            lng: hLng,
            hospitalId: h.id,
            speed: speed,
            route: route,
            destination: destination,
            startTime: Date.now(),
            totalTime: totalTimeSeconds
          };
          
          setResponders(r => [...r, newResponder]);
          
          addNotification(
            'Dispatch Confirmed',
            `Ambulance ${responderId.split('-')[1]} is on its way to ${requesterName}. ETA: ${Math.round(distance/speed * 60)} mins`,
            'info'
          );

          // Mission Sequence using requestAnimationFrame
          let animationStartTime = Date.now();
          
          const tick = () => {
            const now = Date.now();
            const elapsed = (now - animationStartTime) / 1000;
            
            setResponders(current => {
              const r = current.find(x => x.id === responderId);
              if (!r) return current;

              if (r.status === 'EN_ROUTE') {
                const progress = Math.min(1, elapsed / totalTimeSeconds);
                const [curLat, curLng] = interpolatePosition(route, progress);
                
                const remainingDistance = calculateDistance(curLat, curLng, destination[0], destination[1]);
                const dynamicEta = Math.ceil((remainingDistance / r.speed) * 60);

                if (progress >= 1) {
                  addNotification(
                    'Ambulance Arrived', 
                    `Ambulance for ${requesterName} has reached the destination.`, 
                    'success'
                  );

                  // Send Email Notification
                  fetch('/api/send-arrival-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: 'samikotwal450@gmail.com',
                      requesterName,
                      ambulanceId: responderId.split('-')[1]
                    })
                  }).catch(console.error);

                  setHospitals(hosps => hosps.map(hosp => hosp.id === hospitalId ? {
                    ...hosp,
                    busyAmbulances: Math.max(0, hosp.busyAmbulances - 1),
                    processingAmbulances: hosp.processingAmbulances + 1
                  } : hosp));
                  
                  setTimeout(() => {
                    setResponders(res => res.map(x => x.id === responderId ? { 
                      ...x, 
                      status: 'RETURNING',
                      startTime: Date.now(),
                      route: [...route].reverse()
                    } : x));
                    
                    setHospitals(hosps => hosps.map(hosp => hosp.id === hospitalId ? {
                      ...hosp,
                      processingAmbulances: Math.max(0, hosp.processingAmbulances - 1),
                      busyAmbulances: hosp.busyAmbulances + 1
                    } : hosp));

                    const returnStartTime = Date.now();
                    const returnTick = () => {
                      const rNow = Date.now();
                      const rElapsed = (rNow - returnStartTime) / 1000;
                      
                      setResponders(resps => {
                        const res = resps.find(x => x.id === responderId);
                        if (!res || res.status !== 'RETURNING') return resps;
                        
                        const rProgress = Math.min(1, rElapsed / totalTimeSeconds);
                        const [retLat, retLng] = interpolatePosition([...route].reverse(), rProgress);
                        
                        if (rProgress >= 1) {
                          setOverviewStats(s => ({ ...s, busyAmbulances: Math.max(0, s.busyAmbulances - 1) }));
                          setHospitals(hosps => hosps.map(hosp => hosp.id === hospitalId ? {
                            ...hosp,
                            completedAmbulances: hosp.completedAmbulances + 1,
                            busyAmbulances: Math.max(0, hosp.busyAmbulances - 1)
                          } : hosp));
                          
                          setTimeout(() => {
                            setHospitals(hosps => hosps.map(hosp => hosp.id === hospitalId ? {
                               ...hosp,
                               completedAmbulances: Math.max(0, hosp.completedAmbulances - 1),
                               ambulances: Math.min(hosp.totalAmbulances, hosp.ambulances + 1)
                            } : hosp));
                            setIsAlreadyDispatching(false);
                          }, 3000);
                          
                          return resps.filter(x => x.id !== responderId);
                        }
                        return resps.map(x => x.id === responderId ? { ...x, lat: retLat, lng: retLng } : x);
                      });
                      
                      if ((Date.now() - returnStartTime) / 1000 < totalTimeSeconds) {
                        requestAnimationFrame(returnTick);
                      }
                    };
                    requestAnimationFrame(returnTick);
                  }, 5000 + Math.random() * 5000);

                  return current.map(x => x.id === responderId ? { ...x, status: 'ON_SCENE', lat: destination[0], lng: destination[1], eta: 0 } : x);
                }
                return current.map(x => x.id === responderId ? { 
                  ...x, 
                  lat: curLat, 
                  lng: curLng, 
                  eta: dynamicEta 
                } : x);
              }
              return current;
            });

            if (elapsed < totalTimeSeconds) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
        }

        setOverviewStats(s => ({ ...s, busyAmbulances: s.busyAmbulances + count }));

        return {
          ...h,
          ambulances: Math.max(0, h.ambulances - count),
          busyAmbulances: h.busyAmbulances + count
        };
      }
      return h;
    }));
  }, [calculateDistance, addNotification, hospitals]);

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
      isAlreadyDispatching
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
