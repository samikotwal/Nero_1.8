import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  Clock, 
  Navigation2, 
  Filter, 
  ChevronRight,
  ChevronDown,
  Bed,
  ShieldCheck,
  Activity,
  Thermometer,
  Droplets,
  Users,
  Truck,
  Phone,
  User
} from 'lucide-react';
import { Counter } from '../components/Counter';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  AlertCircle,
  CheckCircle2,
  X as CloseIcon,
  Stethoscope,
  Info as InfoIcon,
  Zap,
  TrendingUp,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';

const HospitalSkeleton = () => (
  <div className="bg-[#0d1414]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-5 flex flex-col h-auto min-h-[320px] overflow-hidden opacity-50">
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <div className="flex-1 space-y-3 mb-4">
      <Skeleton className="w-3/4 h-6 rounded" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-1/2 h-3 rounded" />
      </div>
    </div>
    <div className="pt-4 border-t border-white/5 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-xl" />
        <Skeleton className="h-9 rounded-xl" />
      </div>
      <Skeleton className="w-full h-8 rounded-2xl" />
      <div className="pt-3 border-t border-white/5 flex justify-between">
        <Skeleton className="w-20 h-3 rounded" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
    </div>
  </div>
);
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12
};

export const HospitalManagement = () => {
  const navigate = useNavigate();
  const { 
    hospitals, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    filterType, 
    dispatchAmbulance, 
    overviewStats, 
    bookResource, 
    responders,
    findBestHospital,
    emergencies,
    requestAdmission,
    requestAmbulanceMission
  } = useSimulation();
  
  const [visibleCount, setVisibleCount] = React.useState(12);
  const [selectedSpecialty, setSelectedSpecialty] = React.useState('All');
  const [expandedAmbId, setExpandedAmbId] = React.useState<string | null>(null);
  const [expandedBedId, setExpandedBedId] = React.useState<string | null>(null);
  const [ambDestination, setAmbDestination] = React.useState("");
  const [specialtySearchQuery, setSpecialtySearchQuery] = React.useState("");
  const [isSpecialtyMenuOpen, setIsSpecialtyMenuOpen] = React.useState(false);
  
  const [bedQty, setBedQty] = React.useState(1);
  const [bedRequesters, setBedRequesters] = React.useState([{ name: "", phone: "", age: "25" }]);
  
  const [ambQty, setAmbQty] = React.useState(1);
  const [ambRequesters, setAmbRequesters] = React.useState([{ name: "", phone: "", destination: "" }]);

  const updateBedQty = (qty: number) => {
    setBedQty(qty);
    const newReqs = [...bedRequesters];
    if (qty > bedRequesters.length) {
      for (let i = bedRequesters.length; i < qty; i++) {
        newReqs.push({ name: "", phone: "", age: "25" });
      }
    } else {
      newReqs.splice(qty);
    }
    setBedRequesters(newReqs);
  };

  const updateAmbQty = (qty: number) => {
    setAmbQty(qty);
    const newReqs = [...ambRequesters];
    if (qty > ambRequesters.length) {
      for (let i = ambRequesters.length; i < qty; i++) {
        newReqs.push({ name: "", phone: "", destination: "" });
      }
    } else {
      newReqs.splice(qty);
    }
    setAmbRequesters(newReqs);
  };
  
  // Resource Calculations
  const totalBeds = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
  const totalBedsCapacity = hospitals.reduce((acc, h) => acc + h.beds.total, 0);
  const networkCapacity = totalBedsCapacity > 0 ? Math.round((totalBeds / totalBedsCapacity) * 100) : 0;

  const specialties = [
    { label: 'All Specialties', value: 'All' },
    { label: 'General Physician (Normal/Fever)', value: 'General' },
    { label: 'Pediatrician (Child Specialist)', value: 'Pediatrics' },
    { label: 'Gynecologist (Women Health)', value: 'Gynecology' },
    { label: 'Cardiologist (Heart & BP)', value: 'Cardiology' },
    { label: 'Dermatologist (Skin & Hair)', value: 'Dermatology' },
    { label: 'Orthopedic (Bone & Joint)', value: 'Orthopedics' },
    { label: 'Neurologist (Brain & Spine)', value: 'Neurology' },
    { label: 'Pulmonologist (Lungs & Asthma)', value: 'Pulmonology' },
    { label: 'Gastroenterologist (Stomach/Digestive)', value: 'Gastroenterology' },
    { label: 'Nephrologist (Kidney Care)', value: 'Nephrology' },
    { label: 'Urologist (Urinary/Kidney)', value: 'Urology' },
    { label: 'Ophthalmologist (Eye Specialist)', value: 'Ophthalmology' },
    { label: 'ENT Specialist (Ear/Nose/Throat)', value: 'ENT' },
    { label: 'Dentist (Teeth/Dental Care)', value: 'Dentistry' },
    { label: 'Psychiatrist (Mental Health)', value: 'Psychiatry' },
    { label: 'Oncologist (Cancer Specialist)', value: 'Oncology' },
    { label: 'Endocrinologist (Thyroid/Diabetes)', value: 'Endocrinology' },
    { label: 'Radiologist (X-Ray/Scan)', value: 'Radiology' },
    { label: 'Physiotherapist (Recovery)', value: 'Physiotherapy' },
    { label: 'Dietician (Nutrition)', value: 'Nutrition' },
  ];

  const filteredSpecialties = React.useMemo(() => {
    const q = specialtySearchQuery.toLowerCase().trim();
    if (!q) return specialties;
    return specialties.filter(s => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q));
  }, [specialties, specialtySearchQuery]);

  // Reset visible count when search, specialty or type changes
  React.useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, selectedSpecialty, filterType]);

  const filteredHospitals = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return hospitals.filter(h => {
      const matchesSearch = !q || 
                           h.name.toLowerCase().includes(q) ||
                           h.address.toLowerCase().includes(q) ||
                           h.type.toLowerCase().includes(q) ||
                           h.specialties.some(s => s.toLowerCase().includes(q));
      
      const matchesSpecialty = selectedSpecialty === 'All' || 
                              h.specialties.some(s => {
                                const specialtyLower = s.toLowerCase();
                                const selectedLower = selectedSpecialty.toLowerCase();
                                return specialtyLower.includes(selectedLower) || selectedLower.includes(specialtyLower);
                              });

      const matchesType = filterType === 'All' || h.type === filterType;

      return matchesSearch && matchesSpecialty && matchesType;
    });
  }, [hospitals, searchQuery, selectedSpecialty, filterType]);

  const displayHospitals = React.useMemo(() => {
    return filteredHospitals.slice(0, visibleCount);
  }, [filteredHospitals, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, x: -50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={springTransition}
        className="mb-8"
      >
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">BEDS</h2>
        <p className="text-sm text-white/40 font-medium mt-1">Full operational inventory across the healthcare network</p>
      </motion.div>

      {/* Global Resource Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0d1414]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Bed className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic group-hover:text-cyan-400">Total Supply</span>
            </div>
          </div>
          <h3 className="text-4xl font-black text-white italic tracking-tighter mb-1">
            {isLoading ? <Skeleton className="w-24 h-10 rounded-lg" /> : <Counter value={totalBeds} />}
          </h3>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Available Beds</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0d1414]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-amber-500" />
            </div>
            <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic group-hover:text-amber-500">Utilization</span>
            </div>
          </div>
          <h3 className="text-4xl font-black text-white italic tracking-tighter mb-1">
            {isLoading ? <Skeleton className="w-24 h-10 rounded-lg" /> : `${networkCapacity}%`}
          </h3>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Network Free Capacity</p>
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
             {isLoading ? <Skeleton className="w-full h-full" /> : (
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${networkCapacity}%` }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400"
               />
             )}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0d1414]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6 text-rose-500" />
            </div>
            <div className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic group-hover:text-rose-500">Logistics</span>
            </div>
          </div>
          <h3 className="text-4xl font-black text-white italic tracking-tighter mb-1">
            {isLoading ? <Skeleton className="w-24 h-10 rounded-lg" /> : <Counter value={hospitals.reduce((acc, h) => acc + h.ambulances, 0)} />}
          </h3>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Active Ambulances</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-[#0d1414]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-2xl group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic group-hover:text-emerald-400">Readiness</span>
            </div>
          </div>
          <h3 className="text-4xl font-black text-white italic tracking-tighter mb-1">
            {isLoading ? <Skeleton className="w-24 h-10 rounded-lg" /> : <Counter value={hospitals.filter(h => h.status === 'available').length} />}
          </h3>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Operational Nodes</p>
        </motion.div>
      </div>

      {/* Main Listing Section */}
      <div className="pt-10 border-t border-white/5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
              <LayoutGrid className="w-8 h-8 text-cyan-500" />
              RESOURCES
            </h2>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">
                 {filteredHospitals.length} Tactical points localized
               </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-center w-full lg:w-auto">
          {/* Facility Type Filter */}
          <div className="flex bg-[#0d1414]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
             {(['All', 'Hospital', 'Clinic', 'Medical Store'] as const).map((type) => (
               <button
                 key={type}
                 onClick={() => (useSimulation as any)().setFilterType?.(type)}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                   filterType === type 
                    ? "bg-cyan-500 text-white shadow-lg" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
                 )}
               >
                 {type === 'Hospital' ? 'Hospitals' : type === 'Clinic' ? 'Clinics' : type === 'Medical Store' ? 'Med Stores' : 'All'}
               </button>
             ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Specialty Searchable Filter */}
            <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search specialty (e.g. Heart, Skin)..."
              value={isSpecialtyMenuOpen ? specialtySearchQuery : (specialties.find(s => s.value === selectedSpecialty)?.label || 'All Specialties')}
              onChange={(e) => {
                setSpecialtySearchQuery(e.target.value);
                setIsSpecialtyMenuOpen(true);
              }}
              onFocus={() => {
                setIsSpecialtyMenuOpen(true);
                setSpecialtySearchQuery("");
              }}
              className="w-full pl-12 pr-10 py-4 bg-[#0d1414]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all shadow-xl text-sm font-bold truncate"
            />
            <div 
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
              onClick={() => setIsSpecialtyMenuOpen(!isSpecialtyMenuOpen)}
            >
              <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", isSpecialtyMenuOpen ? "rotate-180" : "rotate-0")} />
            </div>

            <AnimatePresence>
              {isSpecialtyMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsSpecialtyMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-[#0d1414] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 overflow-hidden backdrop-blur-2xl max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    <div className="p-2 grid grid-cols-1 gap-1">
                      {filteredSpecialties.length > 0 ? (
                        filteredSpecialties.map(s => (
                          <button
                            key={s.value}
                            onClick={() => {
                              setSelectedSpecialty(s.value);
                              setSpecialtySearchQuery("");
                              setIsSpecialtyMenuOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-xl",
                              selectedSpecialty === s.value ? "bg-cyan-500 text-white shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <div className="flex items-center justify-between">
                               <span>{s.label}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-4 text-[10px] font-black text-white/20 uppercase text-center italic">No specialties found</div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search hospital name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#0d1414]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-xl text-sm font-bold"
            />
          </div>
        </div>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading && filteredHospitals.length === 0 ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <HospitalSkeleton key={idx} />
          ))
        ) : (
          displayHospitals.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 10) * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-[#0d1414]/90 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-5 group transition-all cursor-pointer relative flex flex-col h-auto min-h-[320px] overflow-hidden hover:border-cyan-500/30 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div 
                onClick={() => navigate(`/hospitals/${h.id}`)}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xl border cursor-pointer hover:scale-110 transition-transform",
                  h.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                  h.status === 'busy' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                )}
              >
                {h.type === 'Hospital' ? '🏥' : h.type === 'Medical Center' ? '🏢' : h.type === 'Medical Store' ? '💊' : '🩺'}
              </div>
              
              {/* Active Mission ETA */}
              {(() => {
                const activeResponders = responders.filter(r => r.hospitalId === h.id && r.status === 'EN_ROUTE');
                if (activeResponders.length > 0) {
                  const minEta = Math.min(...activeResponders.map(r => r.eta || 0));
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-lg flex items-center gap-1.5"
                    >
                       <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                       <span className="text-[7px] font-black text-cyan-400 uppercase italic">ETA: {minEta}m</span>
                    </motion.div>
                  );
                }
                return (
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0",
                    h.status === 'available' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 
                    h.status === 'busy' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
                    'text-rose-400 border-rose-500/30 bg-rose-500/5'
                  )}>
                    {h.status}
                  </div>
                );
              })()}
            </div>

            <div 
              onClick={() => navigate(`/hospitals/${h.id}`)}
              className="flex-1 min-w-0 flex flex-col gap-1 relative z-10 cursor-pointer mb-4"
            >
              <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors truncate tracking-tighter uppercase italic leading-tight">
                {h.name}
              </h3>
              <div className="flex items-center gap-1.5 opacity-40">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest truncate">{h.address}</p>
              </div>
            </div>

            {/* Integrated Tactical Monitoring & Control - ONLY FOR HOSPITALS */}
            <div className="space-y-3 relative z-10 mt-auto pt-4 border-t border-white/5">
              {(h.type === 'Hospital' || h.type === 'Medical Center') ? (
                <>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-white/[0.03] p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-white/5 group-hover:border-rose-500/20 transition-all">
                      <span className="text-[5px] font-black text-rose-500/50 uppercase tracking-widest leading-none">ICU Units</span>
                      <div className="flex items-center gap-1">
                        <Activity className="w-2 h-2 text-rose-500/60" />
                        <span className="text-[9px] font-black text-white italic leading-none">{h.icuBeds}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-white/5 group-hover:border-emerald-500/20 transition-all">
                      <span className="text-[5px] font-black text-emerald-500/50 uppercase tracking-widest leading-none">Bed Avail</span>
                      <div className="flex items-center gap-1">
                        <Bed className="w-2 h-2 text-emerald-500/60" />
                        <span className="text-[9px] font-black text-white italic leading-none">{h.beds.available}</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] p-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 border border-white/5 group-hover:border-cyan-500/20 transition-all">
                      <span className="text-[5px] font-black text-cyan-400/50 uppercase tracking-widest leading-none">Fleet</span>
                      <div className="flex items-center gap-1">
                        <Truck className="w-2 h-2 text-cyan-400/60" />
                        <span className="text-[9px] font-black text-white italic leading-none">{h.ambulances}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedBedId(expandedBedId === h.id ? null : h.id);
                        setBedQty(1);
                        setBedRequesters([{ name: "", phone: "", age: "25" }]);
                      }}
                      className={cn(
                        "py-2 border rounded-xl text-[7px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                        ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id)
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                          : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/60 hover:bg-emerald-500/10"
                      )}
                    >
                      <Bed className="w-2.5 h-2.5" /> BOOK BED
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAmbId(expandedAmbId === h.id ? null : h.id);
                        setAmbQty(1);
                        setAmbRequesters([{ name: "", phone: "", destination: "" }]);
                        setAmbDestination("");
                      }}
                      className={cn(
                        "py-2 border rounded-xl text-[7px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                        ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id)
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                          : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400/60 hover:bg-cyan-500/10"
                      )}
                    >
                      <Truck className="w-2.5 h-2.5" /> REQUEST AMBULANCE
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedBedId === h.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden relative z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 bg-[#050a0a] border border-white/10 rounded-2xl space-y-4 mb-2 shadow-2xl max-h-[450px] overflow-y-auto custom-scrollbar">
                          <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Bed className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider">Unit Capacity</span>
                                <span className="text-[8px] font-bold text-emerald-500/40 uppercase">Select Quantity</span>
                              </div>
                            </div>
                            <div className="relative group/select">
                              <select 
                                value={bedQty}
                                onChange={(e) => updateBedQty(parseInt(e.target.value))}
                                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-lg font-black text-emerald-400 outline-none cursor-pointer appearance-none min-w-[80px] text-center hover:border-emerald-500 transition-all"
                              >
                                {Array.from({ length: 100 }, (_, i) => i + 1).map(n => <option key={n} value={n} className="bg-[#050a0a] text-white">{n}</option>)}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            {bedRequesters.map((req, ridx) => (
                              <div key={ridx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group/row hover:bg-white/[0.04] transition-all">
                                <span className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg z-10">
                                  {ridx + 1}
                                </span>
                                <div className="grid grid-cols-1 gap-2.5">
                                  <div className="relative group/field">
                                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-emerald-400 transition-colors" />
                                      <input 
                                        type="text" 
                                        placeholder="PATIENT NAME"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500/40 transition-all"
                                        value={req.name}
                                        onChange={(e) => {
                                          const next = [...bedRequesters];
                                          next[ridx].name = e.target.value;
                                          setBedRequesters(next);
                                        }}
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2.5">
                                    <div className="relative group/field">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-emerald-400" />
                                        <input 
                                          type="tel" 
                                          placeholder="CONTACT"
                                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500/40"
                                          value={req.phone}
                                          onChange={(e) => {
                                            const next = [...bedRequesters];
                                            next[ridx].phone = e.target.value;
                                            setBedRequesters(next);
                                          }}
                                        />
                                    </div>
                                    <div className="relative group/field">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-emerald-400" />
                                        <input 
                                          type="number" 
                                          placeholder="AGE"
                                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-emerald-500/40"
                                          value={req.age}
                                          onChange={(e) => {
                                            const next = [...bedRequesters];
                                            next[ridx].age = e.target.value;
                                            setBedRequesters(next);
                                          }}
                                        />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <button 
                            onClick={async () => {
                              if (bedRequesters.some(r => !r.name || !r.phone)) {
                                alert("TERMINAL ERROR: INCOMPLETE PATIENT DATA");
                                return;
                              }
                              
                              const isDB = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id);
                              
                              // Sequentially request to ensure stable increments
                              for (const r of bedRequesters) {
                                requestAdmission(h.id, r.name, r.age, r.phone, r.phone);
                                // Small delay between batch calls for API stability
                                if (isDB) await new Promise(res => setTimeout(res, 300));
                              }
                              
                              alert("SUCCESS: ADMISSION REQUEST SENT FOR APPROVAL");
                              setExpandedBedId(null);
                              setBedQty(1);
                              setBedRequesters([{ name: "", phone: "", age: "25" }]);
                            }}
                            className={cn(
                              "w-full py-4 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.2em] transition-all active:scale-[0.98] sticky bottom-0 z-30 shadow-2xl",
                              ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id)
                                ? "bg-emerald-500 hover:bg-emerald-400 ring-2 ring-emerald-400/50"
                                : "bg-emerald-600 hover:bg-emerald-500"
                            )}
                          >
                             {['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id) ? "SUBMIT REQUEST" : "BOOK BEDS"} ({bedQty})
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {expandedAmbId === h.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden relative z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 bg-[#050a0a] border border-white/10 rounded-2xl space-y-4 mb-2 shadow-2xl max-h-[450px] overflow-y-auto custom-scrollbar">
                          <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Truck className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider">Fleet Assets</span>
                                <span className="text-[8px] font-bold text-cyan-500/40 uppercase">Select Deployment size</span>
                              </div>
                            </div>
                            <div className="relative group/select">
                              <select 
                                value={ambQty}
                                onChange={(e) => updateAmbQty(parseInt(e.target.value))}
                                className="bg-black border border-white/10 rounded-xl px-4 py-2 text-lg font-black text-cyan-400 outline-none cursor-pointer appearance-none min-w-[80px] text-center hover:border-cyan-500 transition-all"
                              >
                                {Array.from({ length: 100 }, (_, i) => i + 1).map(n => <option key={n} value={n} className="bg-[#050a0a] text-white">{n}</option>)}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4 pt-2">
                            {ambRequesters.map((req, ridx) => (
                              <div key={ridx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group/row hover:bg-white/[0.04] transition-all">
                                <span className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-cyan-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg z-10">
                                  {ridx + 1}
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="relative group/field">
                                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-cyan-400 transition-colors" />
                                      <input 
                                        type="text" 
                                        placeholder="REQUESTER NAME"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-cyan-500/40"
                                        value={req.name}
                                        onChange={(e) => {
                                          const next = [...ambRequesters];
                                          next[ridx].name = e.target.value;
                                          setAmbRequesters(next);
                                        }}
                                      />
                                    </div>
                                    <div className="relative group/field">
                                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-cyan-400" />
                                      <input 
                                        type="tel" 
                                        placeholder="CONTACT"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-cyan-500/40"
                                        value={req.phone}
                                        onChange={(e) => {
                                          const next = [...ambRequesters];
                                          next[ridx].phone = e.target.value;
                                          setAmbRequesters(next);
                                        }}
                                      />
                                    </div>
                                    <div className="relative group/field md:col-span-2">
                                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-cyan-400" />
                                      <input 
                                        type="text" 
                                        placeholder="INDIVIDUAL PICKUP (OPTIONAL)"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-cyan-500/40"
                                        value={req.destination}
                                        onChange={(e) => {
                                          const next = [...ambRequesters];
                                          next[ridx].destination = e.target.value;
                                          setAmbRequesters(next);
                                        }}
                                      />
                                    </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2.5 pt-4 border-t border-white/10">
                             <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2 italic">Global Destination</p>
                             <div className="relative group/field">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-focus-within/field:text-cyan-400" />
                                <input 
                                  type="text" 
                                  placeholder="PICKUP ADDRESS"
                                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-cyan-500/40"
                                  value={ambDestination}
                                  onChange={(e) => setAmbDestination(e.target.value)}
                                />
                              </div>
                          </div>

                          <button 
                            onClick={async () => {
                              if (!ambDestination || ambRequesters.some(r => !r.name)) {
                                alert("TERMINAL ERROR: MISSING DISPATCH DATA");
                                return;
                              }
                              
                              const isDB = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id);
                              
                              for (const r of ambRequesters) {
                               if (isDB) {
                                  try {
                                    // For DB connected hospitals, save to ambulance_requests table
                                    await requestAmbulanceMission(
                                      h.id, 
                                      [h.lat + 0.01, h.lng + 0.01], 
                                      r.name, 
                                      r.phone || "911", 
                                      r.destination || ambDestination
                                    );
                                    await new Promise(res => setTimeout(res, 300));
                                  } catch (err: any) {
                                    console.error("DB Dispatch Error:", err);
                                    alert(`DATABASE ERROR: Could not sync dispatch for ${r.name}\n\nREASON: ${err.message || "Unknown Connection Error"}`);
                                  }
                                } else {
                                  // For others, direct dispatch
                                  dispatchAmbulance(h.id, [h.lat + 0.01, h.lng + 0.01], r.name, r.phone || "911", 1, r.destination || ambDestination);
                                }
                              }
                              
                              alert(isDB ? "RESOURCES REQUESTED SUCCESFULLY (DB SYNC)" : "UNITS MOBILIZED SUCCESSFULLY");
                              setExpandedAmbId(null);
                              setAmbQty(1);
                              setAmbRequesters([{ name: "", phone: "", destination: "" }]);
                              setAmbDestination("");
                            }}
                            className={cn(
                              "w-full py-4 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all active:scale-[0.98] sticky bottom-0 z-30 shadow-xl",
                              ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id)
                                ? "bg-cyan-500 hover:bg-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-500/20"
                                : "bg-cyan-600 hover:bg-cyan-500"
                            )}
                          >
                            {['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(h.id) ? "REQUEST AMBULANCE" : "DEPLOY UNITS"} ({ambQty})
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>


                  {/* Status Section: Responder Lifecycle Telemetry */}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-2xl relative z-10 group/status-row">
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Busy</span>
                      <span className="text-[11px] font-black italic text-rose-500 tracking-tighter">{h.busyAmbulances}</span>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Processing</span>
                      <span className="text-[11px] font-black italic text-amber-500 tracking-tighter">{h.processingAmbulances}</span>
                    </div>
                    <div className="w-px h-6 bg-white/5" />
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] font-bold text-white/30 uppercase tracking-widest mb-0.5">Completed</span>
                      <span className="text-[11px] font-black italic text-emerald-500 tracking-tighter">{h.completedAmbulances}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* Clinic / Medical Store Detail Card */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[7px] font-black text-cyan-400/60 uppercase tracking-[0.2em] leading-none mb-1">Travel Distance</span>
                      <div className="flex items-center gap-2">
                         <MapPin className="w-3 h-3 text-cyan-400" />
                         <span className="text-[12px] font-black text-white italic tracking-tight">{h.distance?.toFixed(1) || '0.0'} KM</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[7px] font-black text-emerald-400/60 uppercase tracking-[0.2em] leading-none mb-1">Est. Travel Time</span>
                      <div className="flex items-center gap-2">
                         <Clock className="w-3 h-3 text-emerald-400" />
                         <span className="text-[12px] font-black text-white italic tracking-tight">{Math.round((h.distance || 0) * 2.5) || '1'} MIN</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Facility Focus</span>
                        <span className="text-[10px] font-black text-white/60 tracking-wider uppercase">{h.type} Service</span>
                     </div>
                     <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center opacity-40">
                        {h.type === 'Clinic' ? <Stethoscope className="w-4 h-4 text-cyan-400" /> : <Droplets className="w-4 h-4 text-rose-400" />}
                     </div>
                  </div>
                </div>
              )}

              <div 
                onClick={() => navigate(`/hospitals/${h.id}`)}
                className="pt-3 border-t border-white/5 flex items-center justify-between text-cyan-400/40 hover:text-cyan-400 transition-all opacity-60 group-hover:opacity-100"
              >
                <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">Facility Profile</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>

      {visibleCount < filteredHospitals.length && (
        <div className="flex justify-center pt-8">
          <button
            onClick={handleLoadMore}
            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-cyan-500/50 transition-all active:scale-95 group flex items-center gap-3"
          >
            Load More Hospitals
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
              +
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
