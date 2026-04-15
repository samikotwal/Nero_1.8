import React, { useState, useEffect, useMemo } from 'react';
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
  Truck, 
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
  X,
  Navigation2,
  Clock,
  Milestone,
  RefreshCw,
  Plus,
  AlertTriangle,
  Send,
  Brain,
  CheckCircle2,
  Activity,
  Shield,
  ArrowRight
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
const hospitalIcon = (type: string, status: string, isSelected: boolean = false) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
    isSelected ? 'scale-125 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] z-[1000]' : ''
  } ${
    status === 'available' ? 'bg-emerald-500 border-emerald-400 text-white' : 
    status === 'busy' ? 'bg-amber-500 border-amber-400 text-white' : 
    'bg-rose-500 border-rose-400 text-white'
  } shadow-lg shadow-black/50 transition-all duration-300">
    ${isSelected ? '<div class="absolute inset-0 rounded-xl bg-cyan-400 animate-ping opacity-20"></div>' : ''}
    <span class="text-lg relative z-10">${type === 'Hospital' ? '🏥' : type === 'Medical Center' ? '🏢' : type === 'Medical Store' ? '💊' : '🩺'}</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative w-6 h-6 flex items-center justify-center">
      <div class="absolute inset-0 bg-blue-500/30 rounded-full animate-ping"></div>
      <div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg z-10"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map Controller Component
const MapController = ({ center, route, onBoundsChange, followUser }: { center: [number, number] | null, route?: [number, number][], onBoundsChange: (bounds: any, zoom: number) => void, followUser: boolean }) => {
  const map = useMap();
  const [hasInitiallyCentered, setHasInitiallyCentered] = useState(false);
  
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (center && (followUser || !hasInitiallyCentered)) {
      const currentCenter = map.getCenter();
      const distance = L.latLng(center).distanceTo(currentCenter);
      
      // If distance is small, use setView for instant update without animation jitter
      // If distance is large or first time, use flyTo
      if (distance < 100 && hasInitiallyCentered) {
        map.setView(center, map.getZoom(), { animate: false });
      } else {
        map.flyTo(center, 16, { animate: true, duration: 1.5 });
      }
      
      if (!hasInitiallyCentered) setHasInitiallyCentered(true);
    }
  }, [center?.[0], center?.[1], route, map, followUser, hasInitiallyCentered]);

  useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    }
  });
  
  return null;
};

export const LiveMap = () => {
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
    setStatusFilter
  } = useSimulation();
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string, instructions: string[] } | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [followUser, setFollowUser] = useState(true);

  // Handle selected hospital from navigation state
  useEffect(() => {
    if (location.state?.selectedHospitalId && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.id === location.state.selectedHospitalId);
      if (hospital) {
        handleHospitalSelect(hospital);
        // Clear state to avoid re-triggering
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
        const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             h.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || h.type === filterType;
        const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [hospitals, searchQuery, filterType, statusFilter]);

  // Filter for the "Nearby Facilities" list (strictly nearby, e.g., 5km)
  const nearbyFacilities = useMemo(() => {
    return sortedHospitals.filter(h => (h.distance || 0) <= 5);
  }, [sortedHospitals]);

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setUseGps(false); // Disable auto-tracking when searching
    const success = await searchLocation(locationQuery);
    if (success) {
      setFollowUser(false);
      setLocationQuery('');
    }
  };

  const jumpToVijayapura = () => {
    setUseGps(false);
    setUserLocation([16.8302, 75.7100]);
    setFollowUser(true);
    // Force a data refresh for the new location
    const mapElement = document.querySelector('.leaflet-container') as any;
    if (mapElement && mapElement._leaflet_map) {
      mapElement._leaflet_map.flyTo([16.8302, 75.7100], 15);
    }
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
      const data = await response.json();
      console.log("OSRM Route Data:", data);
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRoute(coordinates);
        setRouteInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1) + ' km',
          duration: Math.round(data.routes[0].duration / 60) + ' min',
          instructions: data.routes[0].legs[0].steps.map((step: any) => step.maneuver.instruction)
        });
      }
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const handleHospitalSelect = (h: any) => {
    setSelectedHospital(h);
    setFollowUser(false);
    fetchRoute(h.lat, h.lng);
    
    // Smoothly zoom into the selected hospital
    const mapElement = document.querySelector('.leaflet-container') as any;
    if (mapElement && mapElement._leaflet_map) {
      mapElement._leaflet_map.flyTo([h.lat, h.lng], 16, { duration: 1.5 });
    }

    setTimeout(() => {
      document.getElementById('navigation-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <MapPin className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="text-2xl font-black tracking-tighter text-white whitespace-nowrap">Hospital Network</h2>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <LocateFixed className="w-3 h-3 text-cyan-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400/80">
                  {locationSource === 'gps' ? 'Mobile GPS' : locationSource === 'fallback' ? 'Laptop Mode (Bijapur)' : 'Custom'} 
                </p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1 truncate">
              {userLocation ? `${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}` : 'Locating...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => {
              setUseGps(false);
              setTimeout(() => setUseGps(true), 100);
            }}
            className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all active:scale-95 flex items-center gap-2"
            title="Force GPS Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Refresh GPS</span>
          </button>
          <button 
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all active:scale-95"
            title="Toggle Map Type"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search hospitals, clinics, or medical stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-xl"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-6 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white focus:outline-none focus:border-cyan-500/50 transition-all shadow-xl appearance-none cursor-pointer font-bold text-sm min-w-[140px]"
          >
            <option value="All">All Types</option>
            <option value="Hospital">Hospitals</option>
            <option value="Clinic">Clinics</option>
            <option value="Medical Store">Medical Stores</option>
          </select>
          
          <button 
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'available' : statusFilter === 'available' ? 'busy' : 'all')}
            className={cn(
              "px-6 py-4 border rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl flex items-center gap-3 min-w-[140px] justify-center",
              statusFilter === 'all' ? "bg-white/5 border-white/10 text-white/60" :
              statusFilter === 'available' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
              "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? 'All Status' : statusFilter}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[50vh] lg:h-[calc(100vh-320px)] min-h-[400px] glass-card overflow-hidden relative border-white/10 shadow-2xl rounded-3xl">
        {followUser && (
          <div className="absolute inset-0 pointer-events-none border-[20px] border-cyan-500/5 z-[1000] rounded-[1.5rem]">
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-cyan-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
              Focus Lock Active
            </div>
          </div>
        )}
        
        <MapContainer 
          center={userLocation || [16.8302, 75.7100]} 
          zoom={15} 
          minZoom={3}
          maxZoom={19}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
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
            center={userLocation} 
            route={route} 
            onBoundsChange={handleBoundsChange}
            followUser={followUser}
          />

          {/* User Location */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup className="custom-popup">
                <div className="p-2 text-center">
                  <p className="font-bold text-xs uppercase tracking-widest">Your Position</p>
                  <p className="text-[10px] text-white/40">Live Location</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Hospitals */}
          <MarkerClusterGroup 
            chunkedLoading 
            maxClusterRadius={30}
            disableClusteringAtZoom={16}
          >
            {sortedHospitals.map(h => {
              const isSelected = selectedHospital?.id === h.id;
              return (
                <Marker 
                  key={h.id} 
                  position={[h.lat, h.lng]} 
                  icon={hospitalIcon(h.type, h.status, isSelected)}
                  zIndexOffset={isSelected ? 1000 : 0}
                  eventHandlers={{
                    click: () => handleHospitalSelect(h),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-4 min-w-[220px] space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-sm tracking-tight">{h.name}</h3>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{h.type}</p>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          h.status === 'available' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                        )}>
                          {h.status}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/5">
                        <div className="text-center">
                          <p className="text-[8px] text-white/20 uppercase font-black">Distance</p>
                          <p className="text-xs font-black text-white">{h.distance?.toFixed(1)} km</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] text-white/20 uppercase font-black">Gen Beds</p>
                          <p className="text-xs font-black text-white">{h.beds.available}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {h.specialties.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] text-white/60 border border-white/10 uppercase font-bold">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate(`/hospitals/${h.id}`)}
                          className="flex-1 py-2 rounded-xl bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                        >
                          Profile
                        </button>
                        <button 
                          onClick={() => handleHospitalSelect(h)}
                          className="p-2 rounded-xl bg-white/5 text-white/60 hover:text-white transition-all border border-white/10"
                        >
                          <RouteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {/* Route Line */}
          {route.length > 0 && (
            <Polyline 
              positions={route} 
              color="#06b6d4" 
              weight={8} 
              opacity={1}
              lineCap="round"
              lineJoin="round"
              className="animate-pulse"
            />
          )}
        </MapContainer>

        {/* Map Overlays */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="p-3 rounded-xl bg-[#0d1414]/80 backdrop-blur-md border border-white/10 text-white/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-xl"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Section */}
      <AnimatePresence>
        {selectedHospital && (
          <motion.div 
            id="navigation-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          >
            {/* Route Summary */}
            <div className="glass-card p-6 flex flex-col justify-between border-cyan-500/20 bg-cyan-500/5">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-cyan-400">{selectedHospital.name}</h3>
                  <p className="text-xs text-white/40 mt-1">{selectedHospital.address}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedHospital(null);
                    setRoute([]);
                    setRouteInfo(null);
                    setFollowUser(true);
                  }}
                  className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Milestone className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                  <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Distance</p>
                  <p className="text-xl font-black text-white">{routeInfo?.distance}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Duration</p>
                  <p className="text-xl font-black text-white">{routeInfo?.duration}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (userLocation && selectedHospital) {
                      fetchRoute(selectedHospital.lat, selectedHospital.lng);
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-cyan-500 text-white font-black hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <RouteIcon className="w-4 h-4" />
                  Show Route on Map
                </button>
                
                <button 
                  onClick={() => {
                    if (userLocation && selectedHospital) {
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation[0]},${userLocation[1]}&destination=${selectedHospital.lat},${selectedHospital.lng}&travelmode=driving`;
                      window.open(url, '_blank');
                    }
                  }}
                  className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <Navigation2 className="w-4 h-4" />
                  Get Directions (Google Maps)
                </button>

                <button 
                  onClick={() => navigate(`/hospitals/${selectedHospital.id}`)}
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <Info className="w-4 h-4" />
                  View Hospital Profile
                </button>
              </div>
            </div>

            {/* Turn-by-Turn Instructions */}
            <div className="lg:col-span-2 glass-card p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <RouteIcon className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black uppercase tracking-widest text-sm">Turn-by-Turn Navigation</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
                {routeInfo?.instructions.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-black text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                      {i + 1}
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nearby Facilities Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Building2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Nearby Facilities</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Within 5km of your location</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
            {nearbyFacilities.length} Found
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {nearbyFacilities.slice(0, 8).map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleHospitalSelect(h)}
              className={cn(
                "glass-card p-6 cursor-pointer hover:border-cyan-500/30 transition-all group relative overflow-hidden",
                selectedHospital?.id === h.id && "border-cyan-500 bg-cyan-500/5"
              )}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg",
                  h.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                )}>
                  {h.type === 'Hospital' ? '🏥' : h.type === 'Medical Center' ? '🏢' : h.type === 'Medical Store' ? '💊' : '🩺'}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-cyan-400">{h.distance?.toFixed(1)} km</p>
                  <div className={cn(
                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest mt-1",
                    h.status === 'available' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                  )}>
                    {h.status}
                  </div>
                </div>
              </div>

              <div className="space-y-1 mb-6 relative z-10">
                <h4 className="font-black text-lg group-hover:text-cyan-400 transition-colors tracking-tight leading-tight">{h.name}</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest truncate">{h.address}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                    <Bed className="w-3.5 h-3.5 text-cyan-400" />
                    {h.beds.available}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                    {h.specialties.length}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span className="text-[10px] font-black uppercase tracking-widest">Route</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {nearbyFacilities.length === 0 && !isLoading && (
          <div className="text-center py-20 glass-card border-dashed border-white/10">
            <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white/40 uppercase tracking-widest">No nearby facilities found</h3>
            <p className="text-sm text-white/20 mt-2">Try moving the map or adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
