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
  Truck
} from 'lucide-react';
import { Counter } from '../components/Counter';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12
};

export const HospitalManagement = () => {
  const navigate = useNavigate();
  const { hospitals, isLoading, searchQuery, setSearchQuery, bookResource, dispatchAmbulance, overviewStats } = useSimulation();
  const [visibleCount, setVisibleCount] = React.useState(20);
  const [selectedSpecialty, setSelectedSpecialty] = React.useState('All');
  const [expandedAmbId, setExpandedAmbId] = React.useState<string | null>(null);
  const [ambDestination, setAmbDestination] = React.useState("");

  // Resource Calculations
  const totalBeds = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
  const totalIcuBeds = hospitals.reduce((acc, h) => acc + h.icuBeds, 0);
  const totalBedsCapacity = hospitals.reduce((acc, h) => acc + h.beds.total, 0);
  const networkCapacity = totalBedsCapacity > 0 ? Math.round((totalBeds / totalBedsCapacity) * 100) : 0;

  const specialties = [
    { label: 'All Specialties', value: 'All' },
    { label: 'General Physician (Normal/Fever)', value: 'General' },
    { label: 'Dermatologist (Skin)', value: 'Dermatology' },
    { label: 'Orthopedic (Bone)', value: 'Orthopedics' },
    { label: 'Neurologist (Brain & Nerve)', value: 'Neurology' },
    { label: 'Cardiologist (Heart)', value: 'Cardiology' },
    { label: 'Pulmonologist (Lung)', value: 'Pulmonology' },
    { label: 'Gastroenterologist (Stomach)', value: 'Gastroenterology' },
    { label: 'Nephrologist (Kidney)', value: 'Nephrology' },
    { label: 'Urologist (Urine)', value: 'Urology' },
    { label: 'Ophthalmologist (Eye)', value: 'Ophthalmology' },
    { label: 'ENT Specialist (Ear/Nose/Throat)', value: 'ENT' },
    { label: 'Dentist (Teeth)', value: 'Dentistry' },
    { label: 'Pediatrician (Child)', value: 'Pediatrics' },
    { label: 'Gynecologist (Women)', value: 'Gynecology' },
    { label: 'Psychiatrist (Mental)', value: 'Psychiatry' },
    { label: 'Oncologist (Cancer)', value: 'Oncology' },
    { label: 'Endocrinologist (Hormone)', value: 'Endocrinology' },
  ];

  // Reset visible count when search or specialty changes
  React.useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, selectedSpecialty]);

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

      return matchesSearch && matchesSpecialty;
    });
  }, [hospitals, searchQuery, selectedSpecialty]);

  const displayHospitals = React.useMemo(() => {
    return filteredHospitals.slice(0, visibleCount);
  }, [filteredHospitals, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Global Resource Summary Section (From Resource Management) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 border-white/10 shadow-xl group hover:border-cyan-500/30 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Bed className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Available Beds</p>
          </div>
          <p className="text-3xl font-black text-white italic">
            <Counter value={totalBeds} />
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 border-white/10 shadow-xl group hover:border-rose-500/30 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">ICU Units</p>
          </div>
          <p className="text-3xl font-black text-rose-400 italic">
            <Counter value={totalIcuBeds} />
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 border-white/10 shadow-xl group hover:border-cyan-500/30 transition-all col-span-1 lg:col-span-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Network Capacity</p>
                <p className="text-2xl font-black text-white italic">{networkCapacity}%</p>
              </div>
            </div>
            <div className="flex-1 max-w-[200px] h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${networkCapacity}%` }}
                className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5">
            {[
              { label: 'O2', value: 85, icon: Thermometer, color: 'text-cyan-400' },
              { label: 'Blood', value: 92, icon: Droplets, color: 'text-rose-400' },
              { label: 'Vent', value: 45, icon: Activity, color: 'text-emerald-400' },
              { label: 'Staff', value: 88, icon: Users, color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="text-center group/item cursor-help" title={`${item.label}: ${item.value}%`}>
                <p className="text-[8px] font-black text-white/20 uppercase mb-1">{item.label}</p>
                <span className={cn("text-xs font-black italic", item.color)}>{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Hospital Management</h2>
          <p className="text-sm text-white/40 font-medium uppercase tracking-widest">
            {filteredHospitals.length} City-Wide Medical Facilities Found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Specialty Picklist */}
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
            </div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-[#0d1414]/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white appearance-none focus:outline-none focus:border-cyan-500/50 transition-all shadow-xl text-sm font-bold truncate cursor-pointer"
            >
              {specialties.map(s => (
                <option key={s.value} value={s.value} className="bg-[#0d1414] text-white">
                  {s.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <ChevronRight className="w-4 h-4 text-white/20 rotate-90" />
            </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading && filteredHospitals.length === 0 ? (
          Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-[2rem] bg-white/5 animate-pulse border border-white/10" />
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
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0",
                h.status === 'available' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 
                h.status === 'busy' ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' :
                'text-rose-400 border-rose-500/30 bg-rose-500/5'
              )}>
                {h.status}
              </div>
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

            {/* Integrated Tactical Monitoring & Control */}
            <div className="space-y-4 relative z-10 mt-auto">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  disabled={h.icuBeds === 0}
                  onClick={(e) => { e.stopPropagation(); bookResource(h.id, 'icu'); }}
                  className={cn(
                    "bg-white/[0.04] p-2 rounded-xl border border-white/5 hover:bg-rose-500/10 transition-all flex flex-col items-center justify-center gap-1 group/btn",
                    h.icuBeds === 0 && "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <span className="text-[6px] font-black text-rose-500/60 uppercase tracking-widest leading-none">ICU BEDS</span>
                  <div className="flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-rose-500" />
                    <span className="text-[11px] font-black text-white italic">{h.icuBeds}/{h.totalIcuBeds}</span>
                  </div>
                </button>

                <button 
                  disabled={h.beds.available === 0}
                  onClick={(e) => { e.stopPropagation(); bookResource(h.id, 'bed'); }}
                  className={cn(
                    "bg-white/[0.04] p-2 rounded-xl border border-white/5 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-center gap-1 group/btn",
                    h.beds.available === 0 && "opacity-30 grayscale cursor-not-allowed"
                  )}
                >
                  <span className="text-[6px] font-black text-emerald-500/60 uppercase tracking-widest leading-none">GENERAL BEDS</span>
                  <div className="flex items-center gap-1">
                    <Bed className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[11px] font-black text-white italic">{h.beds.available}/{h.beds.total}</span>
                  </div>
                </button>

                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setExpandedAmbId(expandedAmbId === h.id ? null : h.id);
                    setAmbDestination("");
                  }}
                  className="bg-white/[0.04] p-2 rounded-xl border border-white/5 hover:bg-cyan-500/10 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-[6px] font-black text-cyan-400/60 uppercase tracking-widest leading-none">AMBULANCES</span>
                  <div className="flex items-center gap-1">
                    <Truck className="w-2.5 h-2.5 text-cyan-400" />
                    <span className="text-[11px] font-black text-white italic">{h.ambulances}/{h.totalAmbulances}</span>
                    <ChevronDown className={cn("w-2 h-2 text-white/20 transition-transform", expandedAmbId === h.id ? "rotate-180" : "rotate-0")} />
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {expandedAmbId === h.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden relative z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 bg-[#050a0a] border border-white/10 rounded-2xl space-y-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Enter Destination"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white uppercase outline-none focus:border-cyan-500/40 transition-colors"
                        value={ambDestination}
                        onChange={(e) => setAmbDestination(e.target.value)}
                      />
                      <button 
                        onClick={() => {
                          if (!ambDestination) return;
                          dispatchAmbulance(h.id, [h.lat + 0.01, h.lng + 0.01]);
                          setExpandedAmbId(null);
                          setAmbDestination("");
                        }}
                        className="w-full py-2 bg-cyan-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-cyan-400 active:scale-[0.98] transition-all"
                      >
                        Request Ambulance
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
};
