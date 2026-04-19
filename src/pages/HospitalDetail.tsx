import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { 
  Hospital as HospitalIcon, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  ArrowLeft,
  Bed,
  Activity,
  Clock,
  Info,
  Navigation,
  Heart,
  Share2,
  Users,
  Building2,
  ExternalLink,
  Play,
  Zap,
  ChevronDown,
  Car,
  Bike,
  Footprints,
  Wind,
  Bus,
  TrainFront,
  Plane,
  Plus
} from 'lucide-react';
import { Counter } from '../components/Counter';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';

export const HospitalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hospitals, userLocation, bookResource, dispatchAmbulance } = useSimulation();
  
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [ambDestination, setAmbDestination] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [unitCount, setUnitCount] = useState(1);
  const [bedBookingCount, setBedBookingCount] = useState(1);
  const [icuBookingCount, setIcuBookingCount] = useState(1);
  const [activeDispatch, setActiveDispatch] = useState(false);
  
  const hospital = hospitals.find(h => h.id === id);

  useEffect(() => {
    if (userLocation) {
      setAmbDestination(`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`);
    } else {
      setAmbDestination("Awaiting GPS...");
    }
  }, [userLocation]);

  useEffect(() => {
    if (hospital && userLocation) {
      const fetchRoadDistance = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${hospital.lng},${hospital.lat}?overview=false`
          );
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            setRoadDistance(data.routes[0].distance / 1000); // meters to kilometers
          }
        } catch (error) {
          console.error("Error fetching road distance:", error);
          setRoadDistance(hospital.distance || null);
        }
      };
      fetchRoadDistance();
    }
  }, [hospital, userLocation]);

  const formatDistance = (km: number | null) => {
    if (km === null) return '--';
    const fullKm = Math.floor(km);
    const meters = Math.round((km - fullKm) * 1000);
    return `${fullKm} km ${meters} m`;
  };

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
        <HospitalIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl font-bold">Hospital not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold border border-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 bg-[#050a0a]">
      {/* Hero Section */}
      <div className="relative min-h-[400px] md:h-[500px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-30"
          style={{ backgroundImage: `url(https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a0a] via-[#050a0a]/60 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-end pb-8 md:pb-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end w-full">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-40 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 shrink-0 bg-white/5 mx-auto md:mx-0"
            >
              <img 
                src="https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg" 
                alt={hospital.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="flex-1 space-y-6">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                  {hospital.name}
                </h1>
                <p className="text-lg text-white/60 font-medium">
                  {hospital.type} • {hospital.address}
                </p>
                <p className="text-sm text-white/20 font-bold uppercase tracking-widest">
                  H-{hospital.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {hospital.specialties.map(s => (
                  <span key={s} className="px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest text-center">
                    {s}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {[
                  { label: 'Status', value: hospital.status, icon: Activity, color: hospital.status === 'available' ? 'text-emerald-400' : 'text-amber-400', badge: 'OPERATIONAL' },
                  { label: 'Beds', value: `${hospital.beds.available}/${hospital.beds.total}`, icon: Bed, color: 'text-cyan-400', badge: hospital.beds.available > 0 ? 'READY' : 'FULL' },
                  { label: 'ICU', value: `${hospital.icuBeds}/${hospital.totalIcuBeds}`, icon: ShieldCheck, color: 'text-rose-400', badge: hospital.icuBeds > 0 ? 'READY' : 'FULL' },
                  { label: 'Amb Units', value: `${hospital.ambulances}/${hospital.totalAmbulances}`, icon: Zap, color: 'text-cyan-400', badge: hospital.ambulances > 0 ? 'READY' : 'BUSY' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0d1414] backdrop-blur-3xl border border-white/10 rounded-2xl p-4 text-left shadow-lg flex flex-col justify-center min-h-[100px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <item.icon className={cn("w-4 h-4", item.color)} />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{item.label}</span>
                      </div>
                      <span className={cn(
                        "text-[6px] font-black px-1.5 py-0.5 rounded border border-white/5 uppercase tracking-widest",
                        item.badge === 'READY' || item.badge === 'OPERATIONAL' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      )}>
                        {item.badge}
                      </span>
                    </div>
                    <p className={cn("text-xl font-black italic tracking-tighter leading-none", item.color)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-inner relative z-10">
                <div className="flex flex-col items-center py-3 px-4 rounded-3xl group/stat cursor-default">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">Busy Units</span>
                  <span className="text-xl font-black italic text-rose-500 tracking-tighter">{hospital.busyAmbulances}</span>
                </div>
                <div className="flex flex-col items-center py-3 px-4 border-x border-white/5 rounded-3xl group/stat cursor-default">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">Active Scene</span>
                  <span className="text-xl font-black italic text-amber-500 tracking-tighter">{hospital.processingAmbulances}</span>
                </div>
                <div className="flex flex-col items-center py-3 px-4 rounded-3xl group/stat cursor-default">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1.5">Mission Done</span>
                  <span className="text-xl font-black italic text-emerald-500 tracking-tighter">{hospital.completedAmbulances}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Transit Estimates */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Navigation className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-black tracking-tight uppercase">Travel Estimates</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { icon: Car, label: 'Drive', speed: 40 },
                { icon: Bike, label: 'Cycle', speed: 15 },
                { icon: Footprints, label: 'Walk', speed: 5 },
                { icon: Wind, label: 'Run', speed: 10 },
                { icon: Bus, label: 'Bus', speed: 20 },
                { icon: TrainFront, label: 'Train', disabled: true },
                { icon: Plane, label: 'Air', disabled: true }
              ].map((mode, idx) => {
                const effectiveDistance = roadDistance || hospital.distance || 0;
                const timeStr = mode.speed ? Math.round((effectiveDistance / mode.speed) * 60) + 'm' : 'N/A';
                return (
                  <div key={idx} className={cn(
                    "bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all hover:border-cyan-500/30",
                    mode.disabled && "opacity-20 grayscale border-dashed"
                  )}>
                    <mode.icon className={cn("w-6 h-6 mb-2", mode.disabled ? "text-white/40" : "text-cyan-400")} />
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none mb-1">{mode.label}</span>
                    <div className="flex flex-col">
                      <span className={cn("text-lg font-black italic", mode.disabled ? "text-white/20" : "text-white")}>{mode.disabled ? 'N/A' : timeStr}</span>
                      {!mode.disabled && (
                        <span className="text-[8px] font-bold text-cyan-400/60 uppercase tracking-tighter mt-1 whitespace-nowrap">
                          {formatDistance(roadDistance || hospital.distance || null)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Synopsis */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-black tracking-tight uppercase">Synopsis</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="text-white/60 leading-relaxed text-lg font-medium">
                {hospital.name} stands as a beacon of medical excellence in the heart of the city. As a premier {hospital.type.toLowerCase()}, it offers a comprehensive range of healthcare services, from advanced emergency trauma care to specialized surgical procedures.
                <br /><br />
                Equipped with the latest diagnostic technologies and staffed by world-class medical professionals, the facility is designed to provide patient-centric care in a modern, healing environment.
              </p>
            </div>
          </section>

          {/* Tactical Command Terminal - FIXED AT BOTTOM */}
          <section className="space-y-8 bg-[#090f0f] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck className="w-32 h-32 text-cyan-400" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase italic leading-none">Command Terminal</h2>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Resource Orchestration & Logistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] group hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <Bed className="w-4 h-4 text-emerald-400" />
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">General Beds</span>
                        </div>
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">READY</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-4xl font-black text-white italic tracking-tighter">{hospital.beds.available}</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Total: {hospital.beds.total}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center bg-black/40 rounded-xl border border-white/5 p-1">
                               <button onClick={() => setBedBookingCount(prev => prev + 1)} className="p-1 hover:text-emerald-400 transition-colors"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                               <span className="text-xs font-black text-white">{bedBookingCount}</span>
                               <button onClick={() => setBedBookingCount(prev => Math.max(1, prev - 1))} className="p-1 hover:text-emerald-400 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                            <button 
                              onClick={() => { for(let i=0; i<bedBookingCount; i++) bookResource(hospital.id, 'bed'); setBedBookingCount(1); }}
                              disabled={hospital.beds.available < bedBookingCount}
                              className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/20 active:scale-95 transition-all text-emerald-400"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] group hover:border-rose-500/30 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-rose-500" />
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">ICU Units</span>
                        </div>
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">READY</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-4xl font-black text-white italic tracking-tighter">{hospital.icuBeds}</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Total: {hospital.totalIcuBeds}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center bg-black/40 rounded-xl border border-white/5 p-1">
                               <button onClick={() => setIcuBookingCount(prev => prev + 1)} className="p-1 hover:text-rose-500 transition-colors"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                               <span className="text-xs font-black text-white">{icuBookingCount}</span>
                               <button onClick={() => setIcuBookingCount(prev => Math.max(1, prev - 1))} className="p-1 hover:text-rose-500 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                            </div>
                            <button 
                              onClick={() => { for(let i=0; i<icuBookingCount; i++) bookResource(hospital.id, 'icu'); setIcuBookingCount(1); }}
                              disabled={hospital.icuBeds < icuBookingCount}
                              className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500/20 active:scale-95 transition-all text-rose-500"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-black uppercase tracking-tight italic">Response Deployment Console</h3>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Requester Name</label>
                        <div className="relative">
                           <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                           <input 
                             type="text" 
                             placeholder="COORDINATOR NAME" 
                             value={requesterName}
                             onChange={(e) => setRequesterName(e.target.value)}
                             className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-bold text-white uppercase outline-none focus:border-cyan-500/40 transition-all font-mono"
                           />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Destination Signal</label>
                        <div className="relative">
                           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                           <input type="text" readOnly value={ambDestination} className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black text-cyan-400 uppercase outline-none cursor-not-allowed font-mono" />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">Locked</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Unit Deployment</span>
                            <span className="text-sm font-black text-white italic">Select Vehicle Count</span>
                         </div>
                         <div className="flex items-center gap-6">
                            <button onClick={() => setUnitCount(Math.max(1, unitCount - 1))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">-</button>
                            <span className="text-lg font-black italic text-cyan-400">{unitCount}</span>
                            <button onClick={() => setUnitCount(Math.min(hospital.ambulances, unitCount + 1))} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white">+</button>
                         </div>
                      </div>
                      <button 
                        onClick={async () => {
                          if (!userLocation) return;
                          await dispatchAmbulance(hospital.id, userLocation, requesterName || "Emergency Caller", unitCount);
                          setActiveDispatch(true);
                          setTimeout(() => { setActiveDispatch(false); navigate('/map'); }, 1000);
                        }}
                        disabled={!userLocation || hospital.ambulances < unitCount}
                        className={cn("w-full md:w-64 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 overflow-hidden relative", activeDispatch ? "bg-emerald-500 text-white" : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-cyan-500/20")}
                      >
                         <Play className={cn("w-5 h-5", activeDispatch ? "hidden" : "block")} />
                         <ShieldCheck className={cn("w-6 h-6", activeDispatch ? "block" : "hidden")} />
                         {activeDispatch ? "Dispatched" : "Engage Unit"}
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Statistics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Staff', value: '1,240', icon: Users },
                { label: 'Departments', value: '24 Units', icon: Building2 },
                { label: 'Status', value: 'Operating', icon: Activity, color: 'text-emerald-400' },
                { label: 'Emergency', value: '24/7 Active', icon: Clock },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white/40">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{stat.label}</span>
                  </div>
                  <span className={cn("text-sm font-black", stat.color || "text-white")}>{stat.value}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Departments</h3>
            <div className="flex flex-wrap gap-2">
              {['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics'].map(dept => (
                <span key={dept} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">{dept}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
