import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline, Circle, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulation } from '../context/SimulationContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Navigation, 
  MapPin, 
  Hospital as HospitalIcon, 
  ExternalLink,
  ChevronRight,
  Info,
  LocateFixed,
  Route as RouteIcon,
  Search,
  Filter,
  Stethoscope,
  Building2,
  Bed,
  Layers,
  Maximize2,
  Minimize2,
  X,
  Navigation2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Zap,
  Send,
  Brain,
  CheckCircle2,
  Activity,
  Shield,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Truck,
  Phone,
  X as CloseIcon,
  Info as InfoIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const hospitalIcon = (type: string, status: string, isSelected: boolean = false) => {
  const iconHtml = type === 'Hospital' ? '🏥' : type === 'Medical Center' ? '🏢' : type === 'Medical Store' ? '💊' : '🩺';
  
  // Use professional colors with glow
  const colorClass = status === 'available' ? 'bg-emerald-500 border-emerald-400' : 
                    status === 'busy' ? 'bg-amber-500 border-amber-400' : 
                    'bg-rose-500 border-rose-400';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative group">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center border-2 ${colorClass} ${
          isSelected ? 'scale-125 border-white shadow-[0_0_30px_rgba(6,182,212,1)] z-[1000] ring-4 ring-cyan-500/50' : 'shadow-lg shadow-black/40'
        } transition-all duration-500">
          <span class="text-lg drop-shadow-md">${iconHtml}</span>
        </div>
        ${isSelected ? '<div class="absolute -inset-2 bg-cyan-400/20 blur-xl rounded-full animate-pulse"></div>' : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative w-8 h-8 flex items-center justify-center">
      <!-- Shiny Aura -->
      <div class="absolute inset-0 bg-cyan-400/30 rounded-full animate-pulse blur-md"></div>
      <!-- Premium Core -->
      <div class="relative w-5 h-5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full border-2 border-white shadow-[0_0_15px_rgba(34,211,238,0.8)]">
        <div class="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map Controller Component
const MapController = ({ 
  center, 
  route, 
  onBoundsChange, 
  followUser, 
  setFollowUser,
  selectedHospitalCoords,
  isExpanded
}: { 
  center: [number, number] | null, 
  route?: [number, number][], 
  onBoundsChange: (bounds: any, zoom: number) => void, 
  followUser: boolean, 
  setFollowUser: (val: boolean) => void,
  selectedHospitalCoords: [number, number] | null,
  isExpanded: boolean
}) => {
  const map = useMap();
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);
  const lastInteractedTime = useRef(0);
  const lastRouteRef = useRef<string>("");

  // Re-size map when container expands/shrinks
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 800); // Slightly more than transition duration
    return () => clearTimeout(timer);
  }, [isExpanded, map]);

  useMapEvents({
    dragstart: () => {
      setFollowUser(false);
      lastInteractedTime.current = Date.now();
    },
    zoomstart: () => {
      setFollowUser(false);
      lastInteractedTime.current = Date.now();
    },
    mousedown: () => {
      lastInteractedTime.current = Date.now();
    },
  });
  
  // Handle Selected Hospital Flying
  useEffect(() => {
    if (selectedHospitalCoords) {
      map.flyTo(selectedHospitalCoords, 16, { animate: true, duration: 1 });
      setFollowUser(false);
    }
  }, [selectedHospitalCoords, map]);

  // Handle Route Fitting - ONLY if route is different from last fitted route
  useEffect(() => {
    if (route && route.length > 0) {
      const routeSig = JSON.stringify([route[0], route[route.length - 1], route.length]);
      if (routeSig !== lastRouteRef.current) {
        lastRouteRef.current = routeSig;
        const bounds = L.latLngBounds(route);
        map.fitBounds(bounds, { padding: [80, 80], animate: true });
        setFollowUser(false);
      }
    } else {
      lastRouteRef.current = "";
    }
  }, [route, map]);

  // Handle User Location Following - More stable update to prevent shaking
  useEffect(() => {
    const isRecentInteraction = Date.now() - lastInteractedTime.current < 5000;
    if (center && (followUser || !hasInitiallyCentered) && (!route || route.length === 0) && !isRecentInteraction) {
      if (!hasInitiallyCentered) {
        map.flyTo(center, 15, { animate: true, duration: 1.5 });
        setHasInitiallyCentered(true);
      } else {
        // Use a small deadzone to prevent jitter from minor GPS fluctuations
        const currentCenter = map.getCenter();
        const dist = L.latLng(center).distanceTo(currentCenter);
        if (dist > 5) { // Only move if more than 5 meters away
          map.panTo(center, { animate: true, duration: 0.5 });
        }
      }
    }
  }, [center?.[0], center?.[1], map, followUser, hasInitiallyCentered, route?.length]);

  useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
      (window as any).leafletMapBounds = map.getBounds();
    },
    zoomend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
      (window as any).leafletMapBounds = map.getBounds();
    }
  });
  
  return null;
};

const LiveMap = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    hospitals, 
    userLocation, 
    setUserLocation, 
    isLoading, 
    setIsLoading, 
    fetchByBounds, 
    searchLocation, 
    locationSource,
    useGps,
    setUseGps,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    statusFilter,
    setStatusFilter,
    locationAccuracy,
    emergencies,
    bookResource
  } = useSimulation();
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [expandedAmbId, setExpandedAmbId] = useState<string | null>(null);
  const [ambDestination, setAmbDestination] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [bookingTarget, setBookingTarget] = useState<{hospital: any, type: 'bed' | 'icu'} | null>(null);
  const [ambCount, setAmbCount] = useState(1);
  const [sidebarBedCount, setSidebarBedCount] = useState<Record<string, number>>({});
  const [sidebarIcuCount, setSidebarIcuCount] = useState<Record<string, number>>({});
  const [activeDispatchId, setActiveDispatchId] = useState<string | null>(null);
  const hasHandledSelection = useRef(false);
  const { overviewStats, dispatchAmbulance, responders } = useSimulation();

  // Moving Ambulance Marker Component
  const MovingAmbulance = ({ responder }: { responder: any }) => {
    const hospital = hospitals.find(h => h.id === responder.hospitalId);
    
    // Calculate speed thresholds for coloring
    const speedColor = responder.speed > 55 ? 'text-rose-500' : responder.speed > 40 ? 'text-amber-500' : 'text-emerald-500';
    const statusColor = {
      'IDLE': 'bg-emerald-500',
      'EN_ROUTE': 'bg-amber-500',
      'ON_SCENE': 'bg-rose-500',
      'RETURNING': 'bg-blue-500'
    }[responder.status as string] || 'bg-gray-500';

    // Route for navigation display
    const routePositions = responder.route && responder.route.length > 0 ? responder.route : [];

    const ambIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative w-12 h-12 flex items-center justify-center">
          <!-- Shiny Aura / Glow -->
          <div class="absolute inset-0 bg-cyan-400/40 rounded-full animate-pulse blur-md"></div>
          
          <!-- Glossy Circular Body (Matching user style) -->
          <div class="relative w-10 h-10 bg-gradient-to-br from-white to-gray-200 rounded-full border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center justify-center overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent"></div>
            <img src="https://cdn-icons-png.flaticon.com/512/1048/1048339.png" class="w-7 h-7 relative z-10 drop-shadow-sm" alt="Ambulance" />
            <!-- Shiny Reflection -->
            <div class="absolute -top-[50%] -left-[50%] w-[200%] h-[100%] bg-gradient-to-b from-white/30 to-transparent rotate-[45deg] pointer-events-none"></div>
          </div>
          
          <!-- Status Indicator Dot -->
          <div class="absolute bottom-0 right-0 w-4 h-4 rounded-full ${statusColor} border-2 border-white shadow-lg z-20"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    return (
      <>
        {routePositions.length > 0 && (
          <>
            {/* Shiny Glow Polyline */}
            <Polyline 
              positions={routePositions as any} 
              color="#22d3ee" 
              weight={10} 
              opacity={0.15}
              className="blur-[6px] road-glow"
            />
            <Polyline 
              positions={routePositions as any} 
              color="#06b6d4" 
              weight={4} 
              opacity={0.8}
              dashArray="10, 10"
              className="animate-dash road-glow"
            />
          </>
        )}
        <Marker position={[responder.lat, responder.lng]} icon={ambIcon}>
          <Popup className="custom-popup">
            <div className="p-2 space-y-1">
              <p className="text-[10px] font-black text-cyan-400 uppercase">RESPONDER {responder.id.split('-')[1]}</p>
              <p className="text-[8px] font-bold text-white/60 uppercase italic">HOSPITAL BASE: {hospital?.name}</p>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                 <span className="text-[9px] font-black text-white italic uppercase tracking-widest">{responder.status}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      </>
    );
  };

  // Custom Emergency Icon
  const emergencyIcon = (priority: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 rounded-lg flex items-center justify-center border-2 rotate-45 ${
      priority === 'HIGH' ? 'bg-rose-500 border-rose-300 animate-bounce' : 'bg-amber-500 border-amber-300'
    } shadow-lg shadow-black/50 z-[2000]">
      <div class="-rotate-45 text-white">🆘</div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ 
    distance: string, 
    duration: string 
  } | null>(null);
  
  const [sourceQuery, setSourceQuery] = useState('My Location');
  const [destQuery, setDestQuery] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [plannerResult, setPlannerResult] = useState<{ 
    source: [number, number], 
    dest: [number, number],
    distance: string,
    duration: string,
    modes: any[],
    destMetadata: any
  } | null>(null);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [followUser, setFollowUser] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const initialMapCenter = useRef<[number, number]>(userLocation || [16.8302, 75.7100]);

  // Handle selected hospital from navigation state
  useEffect(() => {
    if (location.state?.selectedHospitalId && hospitals.length > 0 && !hasHandledSelection.current) {
      const hospital = hospitals.find(h => h.id === location.state.selectedHospitalId);
      if (hospital) {
        hasHandledSelection.current = true;
        handleHospitalSelect(hospital);
        // Clear state to avoid re-triggering upon back/forward
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, hospitals]);

  useEffect(() => {
    if (userLocation) {
      console.log(`LiveMap: Current User Location is [${userLocation[0]}, ${userLocation[1]}]`);
    }
  }, [userLocation]);

  // Debounced bounds fetch
  const handleBoundsChange = useMemo(() => {
    let timeout: any;
    return (bounds: L.LatLngBounds, zoom: number) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();
        fetchByBounds(south, west, north, east, zoom);
      }, 400);
    };
  }, [fetchByBounds]);

  // Filter and Sort hospitals for markers (all city)
  const sortedHospitals = useMemo(() => {
    return hospitals
      .filter(h => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
                             h.name.toLowerCase().includes(query) || 
                             h.address.toLowerCase().includes(query) ||
                             h.type.toLowerCase().includes(query);
        const matchesType = filterType === 'All' || h.type === filterType;
        const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [hospitals, searchQuery, filterType, statusFilter]);

  // Filter for the list: strictly nearby (10km) sector lock for Live Map view
  const nearbyFacilities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      // If searching, show everything that matched the search query
      return sortedHospitals;
    }
    // If not searching, show strictly nearby (10km) for a tight sector lock
    return sortedHospitals.filter(h => (h.distance || 0) <= 10);
  }, [sortedHospitals, searchQuery]);

  const sortedHospitalsWithoutSelected = useMemo(() => {
    return sortedHospitals.filter(h => h.id !== selectedHospital?.id);
  }, [sortedHospitals, selectedHospital]);

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const geocode = async (query: string): Promise<{coords: [number, number], name: string, country: string, address: string} | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      const medicalCategories = ['hospital', 'clinic', 'doctors', 'pharmacy', 'medical', 'dentist'];
      const result = data.find((item: any) => 
        medicalCategories.some(cat => 
          (item.class && item.class.toLowerCase().includes(cat)) || 
          (item.type && item.type.toLowerCase().includes(cat)) ||
          (item.display_name && item.display_name.toLowerCase().includes(cat))
        )
      );

      if (result) {
        return {
          coords: [parseFloat(result.lat), parseFloat(result.lon)],
          name: result.name || result.display_name.split(',')[0],
          country: result.address?.country || 'Unknown',
          address: result.display_name
        };
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  const calculateTravelModes = (distanceKm: number, drivingMinutes: number) => {
    const modes = [
      { id: 'car', icon: '🚗', name: 'Car', time: drivingMinutes },
      { id: 'bus', icon: '🚌', name: 'Bus', time: Math.round(drivingMinutes * 1.5) },
      { id: 'wl', icon: '🚶', name: 'Walk', time: Math.round((distanceKm / 5) * 60) },
      { id: 'running', icon: '🏃', name: 'Run', time: Math.round((distanceKm / 10) * 60) },
      { id: 'train', icon: '🚆', name: 'Train', time: distanceKm > 20 ? Math.round((distanceKm / 60) * 60 + 15) : null },
      { id: 'airline', icon: '✈️', name: 'Air', time: distanceKm > 200 ? Math.round((distanceKm / 800) * 60 + 120) : null }
    ];
    return modes.filter(m => m.time !== null);
  };

  const handlePlanRoute = async () => {
    if (!sourceQuery.trim() || !destQuery.trim()) return;
    
    setIsPlanning(true);
    setRoute([]);
    setRouteInfo(null);
    setPlannerResult(null);

    // Search for locations
    const sourceGeocode = sourceQuery === 'My Location' ? { coords: userLocation, name: 'My Location', country: '', address: 'Current Position' } : await geocode(sourceQuery);
    const destGeocode = await geocode(destQuery);

    if (sourceGeocode && destGeocode) {
      const sCoords = sourceGeocode.coords;
      const dCoords = destGeocode.coords;
      if (!sCoords || !dCoords) return;

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${sCoords[1]},${sCoords[0]};${dCoords[1]},${dCoords[0]}?overview=full&geometries=geojson&steps=true`
        );
        if (!response.ok) throw new Error(`OSRM error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          const distKm = data.routes[0].distance / 1000;
          const driveMin = Math.round(data.routes[0].duration / 60);
          
          const info = {
            source: sCoords,
            dest: dCoords,
            sourceMetadata: sourceGeocode,
            destMetadata: destGeocode,
            distance: distKm.toFixed(1) + ' km',
            duration: driveMin + ' min',
            modes: calculateTravelModes(distKm, driveMin)
          };
          setRoute(coordinates);
          setPlannerResult(info as any);
          setFollowUser(false);
          setSelectedHospital(null);
        }
      } catch (error) {
        // Silent fail for routing
      }
    }
    setIsLoading(false);
    setIsPlanning(false);
  };

  const jumpToVijayapura = () => {
    setUseGps(false);
    setUserLocation([16.8302, 75.7100]);
    setFollowUser(true);
  };

  // Fetch route from OSRM
  const fetchRoute = async (destLat: number, destLng: number) => {
    if (!userLocation) {
      console.warn("Cannot fetch route: userLocation is null");
      return;
    }
    console.log(`Fetching route from [${userLocation[0]}, ${userLocation[1]}] to [${destLat}, ${destLng}]`);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
      );
      if (!response.ok) throw new Error(`OSRM error! status: ${response.status}`);
      const data = await response.json();
      console.log("OSRM Route Data:", data);
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setRoute(coordinates);
          setRouteInfo({
            distance: (data.routes[0].distance / 1000).toFixed(1) + ' km',
            duration: Math.round(data.routes[0].duration / 60) + ' min'
          });
        }
    } catch (error) {
      // Silent fail for route fetching
    }
  };

  const handleHospitalSelect = (h: any) => {
    setSelectedHospital(h);
    setFollowUser(false);
    fetchRoute(h.lat, h.lng);
  };

  // Stabilize props for MapController to prevent shaking
  const memoizedUserLocation = useMemo(() => userLocation, [userLocation?.[0], userLocation?.[1]]);
  const memoizedSelectedHospitalCoords = useMemo(() => 
    selectedHospital ? [selectedHospital.lat, selectedHospital.lng] as [number, number] : null,
    [selectedHospital?.id]
  );

  return (
    <div className="space-y-6 pb-12 relative w-full px-0 lg:px-0">
      {/* Header Section - Slimmer Planner */}
      <div className="mx-4 lg:mx-8">
        <div className="flex flex-col gap-4 bg-[#0d1414]/90 p-5 border border-white/10 backdrop-blur-3xl shadow-2xl rounded-[2rem]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="w-10 h-10 bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                <RouteIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase italic">Route Intel</h2>
                <p className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest leading-none">V 2.0.4 - ACTIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all shadow-lg flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">Tactical Profile</span>
              </button>
              <button 
                onClick={() => {
                  setSourceQuery('My Location');
                  setDestQuery('');
                  setRoute([]);
                  setPlannerResult(null);
                  setRouteInfo(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
              >
                Reset
              </button>
              <button 
                onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all shadow-lg"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Planner Inputs - Grid Optimization */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Source</span>
              </div>
              <input 
                type="text"
                value={sourceQuery}
                onChange={(e) => setSourceQuery(e.target.value)}
                placeholder="Starting point..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-16 pr-3 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            
            <div className="hidden md:flex items-center justify-center md:col-span-1">
              <ArrowRight className="w-3 h-3 text-white/10" />
            </div>

            <div className="md:col-span-5 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-rose-500"></div>
                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Target</span>
              </div>
              <input 
                type="text"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="Destination..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-16 pr-3 text-xs font-bold text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>

            <button 
              onClick={handlePlanRoute}
              disabled={!sourceQuery.trim() || !destQuery.trim() || isPlanning}
              className="md:col-span-1 py-2.5 rounded-xl bg-cyan-500 text-white font-black hover:bg-cyan-400 transition-all disabled:opacity-30 flex items-center justify-center group"
            >
              {isPlanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Map Container - Full Width Expansion */}
      <div className="flex flex-col gap-6">
        <div className={cn(
          "overflow-hidden relative border-y border-white/10 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
          isExpanded 
            ? "fixed inset-0 z-[5000] rounded-none h-screen w-screen bg-[#090f0f]" 
            : "h-[60vh] lg:h-[calc(100vh-350px)] min-h-[500px]"
        )}>
        {followUser && (
          <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/5 z-[1000] rounded-[1.5rem]">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-cyan-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
              Focus Lock Active
            </div>
          </div>
        )}
        
        <MapContainer 
          center={initialMapCenter.current} 
          zoom={15} 
          minZoom={3}
          maxZoom={19}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          touchZoom={true}
        >
          <TileLayer
            url={mapType === 'street' 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            }
            attribution=""
          />
          
          <ZoomControl position="bottomright" />
          <MapController 
            center={memoizedUserLocation} 
            route={route} 
            onBoundsChange={handleBoundsChange}
            followUser={followUser}
            setFollowUser={setFollowUser}
            selectedHospitalCoords={memoizedSelectedHospitalCoords}
            isExpanded={isExpanded}
          />

          {/* Planner Result Markers */}
          {plannerResult && (
            <>
              <Marker position={plannerResult.source} icon={L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black">A</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}>
                <Popup className="custom-popup">
                  <div className="p-2 text-center">
                    <p className="font-bold text-xs uppercase tracking-widest text-emerald-400">Start Point</p>
                    <p className="text-[9px] text-white/40 uppercase font-black truncate">{sourceQuery}</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={plannerResult.dest} icon={L.divIcon({
                className: 'custom-div-icon',
                html: '<div class="w-8 h-8 bg-rose-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black">B</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}>
                <Popup className="custom-popup">
                  <div className="p-2 text-center">
                    <p className="font-bold text-xs uppercase tracking-widest text-rose-400">Destination</p>
                    <p className="text-[9px] text-white/40 uppercase font-black truncate">{destQuery}</p>
                    <div className="flex items-center justify-center gap-2 mt-1 border-t border-white/5 pt-1">
                       <span className="text-[10px] font-black text-cyan-400">{plannerResult.distance}</span>
                       <span className="text-white/10 text-[8px]">|</span>
                       <span className="text-[10px] font-black text-amber-400">{plannerResult.duration}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* User Location */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup className="custom-popup">
                <div className="p-2 text-center text-white">
                  <p className="font-bold text-xs uppercase tracking-widest text-cyan-400">Current Position</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Emergencies (Critical incidents only) */}
          {emergencies.filter(e => e.lat && e.lng && e.priority === 'HIGH' && e.status !== 'COMPLETED').map(e => (
            <Marker 
              key={e.id} 
              position={[e.lat!, e.lng!]} 
              icon={emergencyIcon(e.priority)}
            >
              <Popup className="custom-popup">
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-tighter text-rose-500">Active Incident</span>
                  </div>
                  <h4 className="text-sm font-black uppercase italic leading-none">{e.name}</h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase">{e.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Responders / Moving Ambulances (Visible only when active/dispatched) */}
          {responders.filter(r => 
            r.type === 'AMBULANCE' && 
            (r.status === 'EN_ROUTE' || r.status === 'ON_SCENE' || r.status === 'RETURNING')
          ).map(r => (
            <MovingAmbulance key={r.id} responder={r} />
          ))}

          {/* Hospitals */}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={30}
            disableClusteringAtZoom={16}
          >
            {sortedHospitalsWithoutSelected.map(h => (
              <Marker 
                key={h.id} 
                position={[h.lat, h.lng]} 
                icon={hospitalIcon(h.type, h.status, false)}
                eventHandlers={{
                  click: () => handleHospitalSelect(h),
                }}
              >
                <Popup className="custom-popup" minWidth={300}>
                  <div className="p-0 overflow-hidden rounded-[2rem] bg-[#090f0f] border border-white/10 shadow-3xl">
                    <div className="p-5 flex flex-col h-full bg-gradient-to-b from-cyan-500/5 to-transparent">
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                          {h.type === 'Hospital' ? '🏥' : h.type === 'Medical Center' ? '🏢' : '💊'}
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border",
                          h.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        )}>
                          {h.status}
                        </div>
                      </div>

                      <div className="space-y-1 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest">{(h as any).country || 'INDIA'}</span>
                        </div>
                        <h3 className="font-black text-sm tracking-tight leading-tight uppercase italic text-white">{h.name}</h3>
                        <div className="flex items-center gap-1.5 opacity-40">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <p className="text-[8px] font-bold uppercase truncate">{h.address}</p>
                        </div>
                      </div>
                      
                      {h.type === 'Hospital' && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">ICU</p>
                            <div className="flex items-center gap-1.5">
                               <Activity className="w-3 h-3 text-rose-500" />
                               <span className="text-xs font-black text-rose-400 italic">
                                 {h.icuBeds}/{h.totalIcuBeds || 20}
                               </span>
                            </div>
                          </div>
                          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                            <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Beds</p>
                            <div className="flex items-center gap-1.5">
                               <Bed className="w-3 h-3 text-emerald-500" />
                               <span className="text-xs font-black text-emerald-400 italic">
                                 {typeof h.beds === 'object' ? h.beds.available : h.beds}/{typeof h.beds === 'object' ? h.beds.total : 400}
                               </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hospitals/${h.id}`);
                          }}
                          className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          Tactical Profile
                        </button>
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setDestQuery(h.name);
                             handlePlanRoute();
                          }}
                          className="flex-1 py-3 rounded-2xl bg-cyan-500 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                        >
                          Route
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          {/* Selected Hospital Highlighted (Outside Cluster) */}
          {selectedHospital && (
            <Marker 
              key={`selected-${selectedHospital.id}`}
              position={[selectedHospital.lat, selectedHospital.lng]} 
              icon={hospitalIcon(selectedHospital.type, selectedHospital.status, true)}
              zIndexOffset={1000}
            >
              <Popup className="custom-popup" minWidth={300}>
                <div className="p-0 overflow-hidden rounded-[2rem] bg-[#090f0f] border border-white/10 shadow-3xl">
                  <div className="p-5 flex flex-col h-full bg-gradient-to-b from-cyan-500/5 to-transparent">
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                        {selectedHospital.type === 'Hospital' ? '🏥' : selectedHospital.type === 'Medical Center' ? '🏢' : '💊'}
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border",
                        selectedHospital.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      )}>
                        {selectedHospital.status}
                      </div>
                    </div>

                    <div className="space-y-1 mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black text-cyan-400/60 uppercase tracking-widest">{selectedHospital.country || 'INDIA'}</span>
                      </div>
                      <h3 className="font-black text-sm tracking-tight leading-tight uppercase italic text-white">{selectedHospital.name}</h3>
                      <div className="flex items-center gap-1.5 opacity-40">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <p className="text-[8px] font-bold uppercase truncate">{selectedHospital.address}</p>
                      </div>
                    </div>
                    
                    {selectedHospital.type === 'Hospital' && (
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">ICU</p>
                          <div className="flex items-center gap-1.5">
                             <Activity className="w-3 h-3 text-rose-500" />
                             <span className="text-xs font-black text-rose-400 italic">
                               {selectedHospital.icuBeds}/{selectedHospital.totalIcuBeds || 20}
                             </span>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Beds</p>
                          <div className="flex items-center gap-1.5">
                             <Bed className="w-3 h-3 text-emerald-500" />
                             <span className="text-xs font-black text-emerald-400 italic">
                               {typeof selectedHospital.beds === 'object' ? selectedHospital.beds.available : selectedHospital.beds}/{typeof selectedHospital.beds === 'object' ? selectedHospital.beds.total : 400}
                             </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hospitals/${selectedHospital.id}`);
                        }}
                        className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        Tactical Profile
                      </button>
                      <button 
                        onClick={(e) => {
                           e.stopPropagation();
                           setDestQuery(selectedHospital.name);
                           handlePlanRoute();
                        }}
                        className="flex-1 py-3 rounded-2xl bg-cyan-500 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                      >
                        Route
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Active Emergencies (Critical incidents only) */}
        </MapContainer>

        {/* Manual Planner Overlays */}
        <AnimatePresence>
          {plannerResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="absolute inset-x-4 bottom-4 z-[1000] flex justify-center"
            >
              <div className="w-full max-w-xl bg-[#0d1414]/95 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-32 bg-cyan-500/10 p-4 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-white/5 gap-6">
                    <div className="space-y-1 text-center">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-cyan-400 opacity-60">Objective Range</span>
                      <p className="text-2xl font-black text-white italic leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                        {plannerResult.distance}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 opacity-40">
                       <ShieldCheck className="w-4 h-4 text-cyan-400" />
                       <span className="text-[6px] font-black text-white uppercase tracking-widest">Secured Route</span>
                    </div>
                  </div>

                  <div className="flex-1 p-4 text-left">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <h3 className="text-[10px] font-black text-white uppercase italic">Mission Path Intel</h3>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                           Est. Arrival: {plannerResult.duration}
                         </span>
                         <button onClick={() => setPlannerResult(null)} className="p-1 hover:bg-white/5 text-white/20 rounded-lg transition-colors">
                           <X className="w-4 h-4" />
                         </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {(plannerResult as any).modes?.map((m: any) => (
                        <div key={m.id} className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer">
                          <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{m.icon}</span>
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{m.name}</span>
                          <span className="text-xs font-black text-cyan-400 italic mt-0.5">{m.time}m</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => {
                          const hospital = hospitals.find(h => 
                            h.name.toLowerCase().includes(plannerResult.destMetadata.name.toLowerCase()) ||
                            h.address.toLowerCase().includes(plannerResult.destMetadata.address.toLowerCase())
                          );
                          if (hospital) {
                            navigate(`/hospitals/${hospital.id}`);
                          } else {
                            alert("Viewing general profile for: " + plannerResult.destMetadata.name);
                          }
                        }}
                        className="flex-1 py-3 px-4 rounded-2xl bg-cyan-500 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-[0_4px_15px_rgba(6,182,212,0.4)]"
                      >
                        Facility Profile
                      </button>

                      <button 
                        onClick={() => {
                          setFollowUser(false);
                        }}
                        className="flex-1 py-3 px-4 rounded-2xl bg-[#0d1414] border border-cyan-500/30 text-cyan-400 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-cyan-500/10 transition-all"
                      >
                        Navigate
                      </button>

                      <button 
                        onClick={() => {
                          setSourceQuery('My Location');
                          setDestQuery('');
                          setRoute([]);
                          setPlannerResult(null);
                        }}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setPlannerResult(null)}
                      className="w-full py-3 px-4 rounded-2xl bg-cyan-500 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition-all uppercase"
                    >
                      Release Mission
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 rounded-xl bg-[#0d1414]/80 backdrop-blur-md border border-white/10 text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-xl"
            title={isExpanded ? "Collapse Map" : "Expand Map"}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="p-3 rounded-xl bg-[#0d1414]/80 backdrop-blur-md border border-white/10 text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-xl"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default LiveMap;
