import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  Hospital as HospitalIcon, 
  MapPin, 
  Phone, 
  Star, 
  Shield,
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
  const { hospitals, userLocation, dispatchAmbulance, bookResource, requestAdmission } = useSimulation();
  
  const [roadDistance, setRoadDistance] = useState<number | null>(null);
  const [ambDestination, setAmbDestination] = useState("");
  
  const [bedBookingCount, setBedBookingCount] = useState(1);
  const [bedRequesters, setBedRequesters] = useState([{ name: "", phone: "", age: "25", emergency: "" }]);
  
  const [unitCount, setUnitCount] = useState(1);
  const [ambRequesters, setAmbRequesters] = useState([{ name: "", phone: "", emergency: "" }]);
  
  const [activeDispatch, setActiveDispatch] = useState(false);

  // Sync requesters array with quantity
  useEffect(() => {
    setBedRequesters(prev => {
      const next = [...prev];
      if (next.length < bedBookingCount) {
        for (let i = next.length; i < bedBookingCount; i++) {
          next.push({ name: "", phone: "", age: "25", emergency: "" });
        }
      } else {
        return next.slice(0, bedBookingCount);
      }
      return next;
    });
  }, [bedBookingCount]);

  useEffect(() => {
    setAmbRequesters(prev => {
      const next = [...prev];
      if (next.length < unitCount) {
        for (let i = next.length; i < unitCount; i++) {
          next.push({ name: "", phone: "", emergency: "" });
        }
      } else {
        return next.slice(0, unitCount);
      }
      return next;
    });
  }, [unitCount]);

  // Generate simulated chart data for resource usage over 24h
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 2}:00`,
      usage: Math.floor(Math.random() * 30) + 60, // 60-90% occupancy
      load: Math.floor(Math.random() * 40) + 30,  // 30-70% ambulance load
    }));
  }, [id]);

  const hospital = hospitals.find(h => String(h.id) === id);

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
          if (!response.ok) throw new Error(`OSRM error! status: ${response.status}`);
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            setRoadDistance(data.routes[0].distance / 1000); // meters to kilometers
          }
        } catch (error) {
          // Silent fallback to straight line distance
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
                  { label: 'Amb Units', value: `${hospital.ambulances}/${hospital.totalAmbulances}`, icon: Zap, color: 'text-cyan-400', badge: hospital.ambulances > 0 ? 'READY' : 'BUSY' },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0d1414] backdrop-blur-3xl border border-white/10 rounded-2xl p-4 text-left shadow-lg flex flex-col justify-center min-h-[100px] last:col-span-2 md:last:col-span-1">
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

      <div className="max-w-7xl mx-auto px-6 mt-12 space-y-12">
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
        </section>        {/* Tactical Command Control Center - FULL WIDTH & COMPACT */}
        {(hospital.type === 'Hospital' || hospital.type === 'Medical Center') && (
          <div className="flex flex-col gap-6">
            {/* Command Terminal (Beds Only) */}
            <section className="bg-[#091414] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <ShieldCheck className="w-32 h-32 text-cyan-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <Bed className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none">Command Terminal</h2>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">Bed Resource Management</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 p-5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                           <Bed className="w-6 h-6" />
                        </div>
                        <div className="space-y-0">
                           <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Available</span>
                              <span className="text-[6px] font-black text-emerald-400 uppercase tracking-widest px-1 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20">READY</span>
                           </div>
                           <div className="flex items-baseline gap-1.5">
                              <span className="text-4xl font-black text-white italic tracking-tighter leading-none">{hospital.beds.available}</span>
                              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">/ {hospital.beds.total}</span>
                           </div>
                        </div>
                      </div>

                      <div className="relative group/select">
                        <select 
                          value={bedBookingCount}
                          onChange={(e) => setBedBookingCount(parseInt(e.target.value))}
                          className="bg-black border border-white/10 rounded-xl px-4 py-2 text-lg font-black text-emerald-400 outline-none cursor-pointer appearance-none min-w-[80px] text-center hover:border-emerald-500 transition-all font-mono"
                        >
                          {Array.from({ length: 100 }, (_, i) => i + 1).map(n => <option key={n} value={n} className="bg-[#050a0a] text-white">{n}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                          <ChevronDown className="w-3 h-3 text-emerald-400" />
                        </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {bedRequesters.map((requester, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-lg relative group overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Bed className="w-16 h-16 text-emerald-400" />
                          </div>
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />

                          <div className="relative group/field md:col-span-1">
                             <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400 transition-colors" />
                             <input 
                               type="text" 
                               placeholder="PATIENT NAME" 
                               value={requester.name}
                               onChange={(e) => {
                                 const next = [...bedRequesters];
                                 next[idx].name = e.target.value;
                                 setBedRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-emerald-500/40 transition-all font-mono"
                             />
                          </div>
                          <div className="relative group/field">
                             <input 
                               type="number" 
                               placeholder="AGE" 
                               value={requester.age}
                               onChange={(e) => {
                                 const next = [...bedRequesters];
                                 next[idx].age = e.target.value;
                                 setBedRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-[11px] font-black text-white uppercase outline-none focus:border-emerald-500/40 transition-all font-mono"
                             />
                          </div>
                          <div className="relative group/field">
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400 transition-colors" />
                             <input 
                               type="tel" 
                               placeholder="CONTACT" 
                               value={requester.phone}
                               onChange={(e) => {
                                 const next = [...bedRequesters];
                                 next[idx].phone = e.target.value;
                                 setBedRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-emerald-500/40 transition-all font-mono"
                             />
                          </div>
                          <div className="relative group/field">
                             <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-rose-400 transition-colors" />
                             <input 
                               type="tel" 
                               placeholder="EMERGENCY" 
                               value={requester.emergency}
                               onChange={(e) => {
                                 const next = [...bedRequesters];
                                 next[idx].emergency = e.target.value;
                                 setBedRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-rose-500/40 transition-all font-mono border-rose-500/10"
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                     
                    <button 
                       onClick={async () => { 
                         if (bedRequesters.some(r => !r.name || !r.phone || !r.emergency || !r.age)) {
                           alert("CRITICAL ERROR: ALL PATIENT DETAILS ARE MANDATORY.");
                           return;
                         }

                         const isDB = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(hospital.id);
                         
                         for (const r of bedRequesters) {
                           requestAdmission(hospital.id, r.name, r.age, r.phone, r.emergency);
                           if (isDB) await new Promise(res => setTimeout(res, 300));
                         }

                         setBedBookingCount(1); 
                         setBedRequesters([{ name: "", phone: "", age: "25", emergency: "" }]);
                       }}
                       disabled={hospital.beds.available < bedBookingCount}
                       className="w-full py-5 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-2xl shadow-emerald-500/40 disabled:opacity-30 disabled:grayscale font-black text-[12px] uppercase tracking-[0.4em]"
                     >
                       <span>Authorize {bedBookingCount} Reserve Units</span>
                     </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Deployment Console (Ambulance) */}
            <section className="bg-[#091414] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none">Deployment Console</h2>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">Response Management</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                <div className="lg:col-span-1 p-5 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-0.5">Fleet Status</span>
                      <div className="flex items-baseline gap-1.5">
                         <span className="text-4xl font-black text-cyan-400 italic tracking-tighter leading-none">{hospital.ambulances}</span>
                         <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">/ {hospital.totalAmbulances}</span>
                      </div>
                   </div>
                   <div className="relative group/select">
                      <select 
                        value={unitCount}
                        onChange={(e) => setUnitCount(parseInt(e.target.value))}
                        className="bg-black border border-white/10 rounded-xl px-4 py-2 text-lg font-black text-cyan-400 outline-none cursor-pointer appearance-none min-w-[80px] text-center hover:border-cyan-500 transition-all font-mono"
                      >
                        {Array.from({ length: 100 }, (_, i) => i + 1).map(n => <option key={n} value={n} className="bg-[#050a0a] text-white">{n}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                        <ChevronDown className="w-3 h-3 text-cyan-400" />
                      </div>
                   </div>
                </div>

                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {ambRequesters.map((requester, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/[0.03] rounded-2xl border border-white/10 shadow-lg relative group overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Zap className="w-16 h-16 text-cyan-400" />
                          </div>
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                          
                          <div className="relative group/field md:col-span-2">
                             <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400 transition-colors" />
                             <input 
                               type="text" 
                               placeholder="PATIENT NAME / COMMANDER NAME" 
                               value={requester.name}
                               onChange={(e) => {
                                 const next = [...ambRequesters];
                                 next[idx].name = e.target.value;
                                 setAmbRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-cyan-500/40 transition-all font-mono"
                             />
                          </div>
                          <div className="relative group/field">
                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400 transition-colors" />
                             <input 
                               type="tel" 
                               placeholder="STRIKE CONTACT" 
                               value={requester.phone}
                               onChange={(e) => {
                                 const next = [...ambRequesters];
                                 next[idx].phone = e.target.value;
                                 setAmbRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-cyan-500/40 transition-all font-mono"
                             />
                          </div>
                          <div className="relative group/field">
                             <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400 transition-colors" />
                             <input 
                               type="text" 
                               placeholder="SPECIFIC PICKUP POINT" 
                               value={requester.emergency}
                               onChange={(e) => {
                                 const next = [...ambRequesters];
                                 next[idx].emergency = e.target.value;
                                 setAmbRequesters(next);
                               }}
                               className="w-full bg-black/60 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase outline-none focus:border-cyan-500/40 transition-all font-mono"
                             />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={async () => {
                        if (!userLocation) return;
                        if (ambRequesters.some(r => !r.name)) {
                          alert("CRITICAL ERROR: ALL REQUESTER NAMES ARE MANDATORY.");
                          return;
                        }

                        const isDB = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'].includes(hospital.id);

                        for (const r of ambRequesters) {
                          // Use individual pickup point if provided, else fallback to destination string (which is user location)
                          await dispatchAmbulance(hospital.id, userLocation, r.name, r.phone || "Direct Line", 1, r.emergency || ambDestination);
                          if (isDB) await new Promise(res => setTimeout(res, 300));
                        }

                        setAmbRequesters([{ name: "", phone: "", emergency: "" }]);
                        setUnitCount(1);
                        setActiveDispatch(true);
                        setTimeout(() => { setActiveDispatch(false); }, 1000);
                      }}
                      disabled={!userLocation || hospital.ambulances < unitCount}
                      className={cn(
                        "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] relative", 
                        activeDispatch ? "bg-emerald-500 text-white shadow-emerald-500/40" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/40"
                      )}
                    >
                       {activeDispatch ? "UNITS DEPLOYED" : `DEPLOY ${unitCount} UNITS`}
                    </button>
                  </div>
              </div>
            </section>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-12 border-t border-white/5">
          <div className="lg:col-span-2 space-y-12">
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

            {/* Departments moved below Synopsis */}
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-black uppercase tracking-tight">Departments</h3>
              <div className="flex flex-wrap gap-2">
                {['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics'].map(dept => (
                  <span key={dept} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">{dept}</span>
                ))}
              </div>
            </section>

            {/* Travel Intel for non-hospitals */}
            {hospital.type !== 'Hospital' && hospital.type !== 'Medical Center' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="bg-[#090f0f] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase italic leading-none">Distance Intel</h2>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Geospatial Awareness</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                    <p className="text-4xl font-black text-white italic leading-none">{hospital.distance ? hospital.distance.toFixed(1) : '?'}<span className="text-xs uppercase ml-2 text-white/20">KM</span></p>
                    <p className="text-[9px] font-black text-cyan-400/40 uppercase tracking-[0.3em] mt-3 italic leading-none">Direct Sector Proximity</p>
                  </div>
                </section>

                <section className="bg-[#090f0f] border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                      < Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight uppercase italic leading-none">Est. Time</h2>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Arrival Velocity</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8">
                    <p className="text-4xl font-black text-white italic leading-none">{hospital.distance ? Math.round(hospital.distance * 2.5) : '?'}<span className="text-xs uppercase ml-2 text-white/20">MIN</span></p>
                    <p className="text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.3em] mt-3 italic leading-none">Optimal Traffic Conditions</p>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Right Column (Secondary intel) */}
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
          
          {/* Simulation Analytics Section */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Resource Analytics</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Occupancy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ops Load</span>
                </div>
              </div>
            </div>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#ffffff10" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="#ffffff10" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0d1414', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', marginBottom: '4px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    fill="url(#usageGrad)" 
                    animationDuration={2000}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="url(#loadGrad)" 
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">Peak Utilization</span>
                <span className="text-xs font-black text-white italic tracking-tight">21:30 - Critical Volume</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none italic">Efficient Ops</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);
};
