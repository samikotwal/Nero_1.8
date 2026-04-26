import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  User, 
  Phone, 
  Info as InfoIcon, 
  ArrowRight,
  TrendingDown,
  Bed,
  Activity,
  MapPin,
  Hospital
} from 'lucide-react';
import { Counter } from '../components/Counter';
import { cn } from '../lib/utils';
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

export const BookingSystem = () => {
  const { 
    dispatchAmbulance, 
    overviewStats, 
    bookResource, 
    responders,
    findBestHospital,
    emergencies,
    hospitals,
    isLoading,
    userLocation,
    requestAdmission,
    requestAmbulanceMission,
    pendingRequests,
    pendingAmbulanceRequests,
    approveRequest,
    rejectRequest,
    approveAmbulanceRequest,
    rejectAmbulanceRequest
  } = useSimulation();
  
  const [localIsLoading, setLocalIsLoading] = React.useState(false);
  const [bedQty, setBedQty] = React.useState(1);
  const [patients, setPatients] = React.useState([{ name: "", contact: "", emergency: "", age: "" }]);

  const [ambUnits, setAmbUnits] = React.useState(1);
  const [ambulances, setAmbulances] = React.useState([{ name: "", contact: "", emergency: "", destination: "" }]);
  const [ambDest, setAmbDest] = React.useState("");
  const [bedHospitalId, setBedHospitalId] = React.useState("");
  const [ambHospitalId, setAmbHospitalId] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<'bed' | 'amb'>('bed');

  const updateBedQty = (qty: number) => {
    setBedQty(qty);
    const newPatients = [...patients];
    if (qty > patients.length) {
      for (let i = patients.length; i < qty; i++) {
        newPatients.push({ name: "", contact: "", emergency: "", age: "" });
      }
    } else {
      newPatients.splice(qty);
    }
    setPatients(newPatients);
  };

  const updateAmbQty = (qty: number) => {
    setAmbUnits(qty);
    const newAmbs = [...ambulances];
    if (qty > ambulances.length) {
      for (let i = ambulances.length; i < qty; i++) {
        newAmbs.push({ name: "", contact: "", emergency: "", destination: "" });
      }
    } else {
      newAmbs.splice(qty);
    }
    setAmbulances(newAmbs);
  };

  const handleBedRequest = () => {
    if (patients.some(p => !p.name || !p.contact)) {
      alert("Terminal Error: Missing Patient Credentials in one or more forms");
      return;
    }
    
    patients.forEach(p => {
      // Prioritize selected hospital, otherwise smart-route
      const selectedHosp = hospitals.find(h => h.id === bedHospitalId);
      const targetId = selectedHosp && selectedHosp.beds.available > 0 ? selectedHosp.id : findBestHospital('bed')?.id;
      
      if (targetId) {
        requestAdmission(targetId, p.name, p.age, p.contact, p.emergency || p.contact);
      }
    });
    
    alert(`Success: Missions Authorized. Request(s) submitted for approval by Hospital Nodes.`);
    setPatients([{ name: "", contact: "", emergency: "", age: "" }]);
    setBedQty(1);
    setBedHospitalId("");
  };

  const handleAmbRequest = async () => {
    if (ambulances.some(a => !a.name || !a.contact) || !ambDest) {
      alert("Terminal Error: Dispatch Authorization Failed. Provide Pickup Location and names.");
      return;
    }
    
    setLocalIsLoading(true);
    let pickupCoords: [number, number] | null = null;
    
    // 1. Resolve Pickup location (Geocoding)
    const coordMatch = ambDest.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      pickupCoords = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
    } else {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ambDest)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          pickupCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }

    if (pickupCoords) {
      const dbHospitalIds = ['B-GOVT', 'B-BLDE', 'B-ALAMEEN'];
      // 2. Dispatch/Request Assets
      for (const a of ambulances) {
        // Use user selected hospital or find best
        const hId = ambHospitalId || findBestHospital('ambulance', pickupCoords!)?.id;
        if (hId) {
          if (dbHospitalIds.includes(hId)) {
            try {
              // Use DB Request for DB-sync hospitals
              await requestAmbulanceMission(
                hId,
                pickupCoords!,
                a.name,
                a.contact,
                a.destination || ambDest
              );
            } catch (err: any) {
              console.error("DB Mission Error:", err);
              alert(`DATABASE SYNC FAILED: Could not request unit for ${a.name}\n\nREASON: ${err.message || "Unknown Connection Error"}`);
            }
          } else {
            // Direct Dispatch for others
            dispatchAmbulance(
              hId,
              pickupCoords!,
              a.name,
              a.contact,
              1,
              a.destination || ambDest
            );
          }
        }
      }

      const isDBSelected = dbHospitalIds.includes(ambHospitalId) || (!ambHospitalId && dbHospitalIds.includes(findBestHospital('ambulance', pickupCoords!)?.id || ''));
      alert(isDBSelected ? `Success: ${ambulances.length} Asset requests submitted for authorization. Pickup: ${ambDest}` : `Success: ${ambulances.length} Units Mobilized. Deployment active.`);
      setAmbulances([{ name: "", contact: "", emergency: "", destination: "" }]);
      setAmbUnits(1);
      setAmbDest(""); 
      setAmbHospitalId("");
    } else {
      alert("Terminal Error: Could not resolve pickup coordinates.");
    }
    setLocalIsLoading(false);
  };

  const totalBedsAvailable = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
  const availableAmbs = hospitals.reduce((acc, h) => acc + h.ambulances, 0);

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, x: -50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={springTransition}
        className="mb-8"
      >
        <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">RESOURCES</h2>
        <p className="text-sm text-white/40 font-medium mt-1">Advanced AI-driven resource allocation terminal</p>
      </motion.div>

      {/* Global Resource Summary Section - Restored Prominence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Fleet Status', value: responders.length, icon: Truck, color: 'cyan' },
          { label: 'Latency', value: overviewStats.avgResponseTime, suffix: 'MIN', icon: Clock, color: 'amber' },
          { label: 'Critical Missions', value: emergencies.filter(e => e.status !== 'COMPLETED').length, icon: AlertCircle, color: 'rose' },
          { label: 'Success Today', value: overviewStats.completedToday, icon: CheckCircle2, color: 'emerald' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            whileHover={{ y: -5, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0d1414]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group relative overflow-hidden"
          >
            <div className={cn("absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity", `text-${stat.color}-400`)}>
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-4 rounded-2xl border transition-all duration-500 group-hover:scale-110", `bg-${stat.color}-500/10 border-${stat.color}-500/20`)}>
                <stat.icon className={cn("w-6 h-6", `text-${stat.color}-400`)} />
              </div>
              <div className={cn("px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest", `bg-${stat.color}-500/5 border-${stat.color}-500/10 text-${stat.color}-400/60`)}>
                Live Node
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl font-black text-white italic tracking-tighter mb-2">
                {isLoading ? (
                  <div className="h-12 w-24 bg-white/10 rounded-xl animate-pulse" />
                ) : (
                  <>
                    {typeof stat.value === 'number' ? <Counter value={stat.value} /> : stat.value}
                    {stat.suffix && <span className="text-lg opacity-40 ml-2">{stat.suffix}</span>}
                  </>
                )}
              </h3>
              <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.3em] italic">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Graph - Full Width Prominence */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1414]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden h-[500px] group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
          <TrendingUp className="w-64 h-64 text-cyan-400" />
        </div>
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Strategic Mission Volume</h3>
              <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.5em] italic">AI Simulation Data Feed</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Simulation Active</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewStats.weeklyTrends}>
                <defs>
                  <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0d1414', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    padding: '16px'
                  }}
                  itemStyle={{ color: '#06b6d4', fontSize: '13px', fontWeight: 'black', textTransform: 'uppercase' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '6px', fontWeight: 'black', textTransform: 'uppercase' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#06b6d4" 
                  strokeWidth={5}
                  fill="url(#bookingGrad)" 
                  animationDuration={3000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commander Card: Bed Request - More Compact */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#0d1414]/90 border border-emerald-500/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group min-h-[480px] flex flex-col"
        >
          <div className="absolute -top-20 -right-20 p-32 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <Bed className="w-[300px] h-[300px] text-emerald-500" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-[1.2rem] border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Bed className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">BEDS</h3>
              <p className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.4em] italic">Resource Acquisition</p>
            </div>
            <div className="ml-auto bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-xl flex flex-col items-center">
               <span className="text-[7px] font-black text-emerald-400/40 uppercase tracking-widest leading-none mb-0.5">Global Supply</span>
               <span className="text-sm font-black text-emerald-400 italic leading-none">{totalBedsAvailable} Units</span>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/qty transition-all hover:border-emerald-500/30 mb-4 scale-95 origin-left">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em]">Quantity</span>
                <p className="text-[7px] text-emerald-500/40 font-bold uppercase">Authorized Units</p>
              </div>
              <select 
                value={bedQty}
                onChange={(e) => updateBedQty(parseInt(e.target.value))}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xl font-black text-white hover:border-emerald-500 transition-all outline-none cursor-pointer appearance-none"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num} className="bg-[#0d1414] text-white">{num}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {patients.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl relative group/row hover:bg-white/[0.05] transition-all overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/row:opacity-20 transition-opacity">
                    <Bed className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                  
                  <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg z-10">
                    {idx + 1}
                  </div>
                  <div className="relative group/field">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400" />
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={(e) => {
                        const newPatients = [...patients];
                        newPatients[idx].name = e.target.value;
                        setPatients(newPatients);
                      }}
                      placeholder="PATIENT NAME"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-emerald-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group/field">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400" />
                    <input 
                      type="number" 
                      value={p.age}
                      onChange={(e) => {
                        const newPatients = [...patients];
                        newPatients[idx].age = e.target.value;
                        setPatients(newPatients);
                       }}
                      placeholder="AGE"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-emerald-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group/field">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400" />
                    <input 
                      type="text" 
                      value={p.contact}
                      onChange={(e) => {
                        const newPatients = [...patients];
                        newPatients[idx].contact = e.target.value;
                        setPatients(newPatients);
                      }}
                      placeholder="CONTACT"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-emerald-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group/field">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-emerald-400" />
                    <input 
                      type="text" 
                      value={p.emergency}
                      onChange={(e) => {
                        const newPatients = [...patients];
                        newPatients[idx].emergency = e.target.value;
                        setPatients(newPatients);
                      }}
                      placeholder="EMERGENCY"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-emerald-500/40 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={handleBedRequest}
            className="mt-6 w-full py-5 bg-emerald-500 hover:bg-emerald-400 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">BOOK BEDS</span>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>

        {/* Deployment Card: Ambulance dispatch - More Compact & Smart Target */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0d1414]/90 border border-cyan-500/20 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group min-h-[480px] flex flex-col"
        >
          <div className="absolute -top-20 -right-20 p-32 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <Truck className="w-[300px] h-[300px] text-cyan-500" />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-cyan-500/10 rounded-[1.2rem] border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <Truck className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">AMBULANCE</h3>
              <p className="text-[9px] font-black text-cyan-500/50 uppercase tracking-[0.4em] italic">Combat Ready Units</p>
            </div>
            <div className="ml-auto bg-cyan-500/5 border border-cyan-500/10 px-3 py-1 rounded-xl flex flex-col items-center">
               <span className="text-[7px] font-black text-cyan-400/40 uppercase tracking-widest leading-none mb-0.5">Fleet Status</span>
               <span className="text-sm font-black text-cyan-400 italic leading-none">{availableAmbs} Units</span>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/qty transition-all hover:border-cyan-500/30 mb-4 scale-95 origin-left">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.15em]">Quantity</span>
                <p className="text-[7px] text-cyan-500/40 font-bold uppercase">Rapid Response Protocol</p>
              </div>
              <select 
                value={ambUnits}
                onChange={(e) => updateAmbQty(parseInt(e.target.value))}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xl font-black text-white hover:border-cyan-500 transition-all outline-none cursor-pointer appearance-none"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num} className="bg-[#0d1414] text-white">{num}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {ambulances.map((a, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/[0.03] border border-white/10 rounded-2xl relative group/row hover:bg-white/[0.05] transition-all overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/row:opacity-20 transition-opacity">
                    <Truck className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                  
                  <div className="absolute -left-2 -top-2 w-6 h-6 rounded-full bg-cyan-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg z-10">
                    {idx + 1}
                  </div>
                  
                  <div className="relative group/field">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400" />
                    <input 
                      type="text" 
                      value={a.name}
                      onChange={(e) => {
                        const newAmbs = [...ambulances];
                        newAmbs[idx].name = e.target.value;
                        setAmbulances(newAmbs);
                      }}
                      placeholder="PATIENT NAME"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group/field">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400" />
                    <input 
                      type="text" 
                      value={a.contact}
                      onChange={(e) => {
                        const newAmbs = [...ambulances];
                        newAmbs[idx].contact = e.target.value;
                        setAmbulances(newAmbs);
                      }}
                      placeholder="CONTACT NUMBER"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="relative group/field md:col-span-2">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-cyan-400" />
                    <input 
                      type="text" 
                      value={a.emergency || ""}
                      onChange={(e) => {
                        const newAmbs = [...ambulances];
                        newAmbs[idx].emergency = e.target.value;
                        setAmbulances(newAmbs);
                       }}
                      placeholder="EMERGENCY CONTACT NUMBER"
                      className="w-full bg-black/60 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-[11px] font-black text-white uppercase focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                </div>
              ))}
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Pickup Logistics</p>
                <div className="relative group/field">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/field:text-cyan-400 transition-all duration-500">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <input 
                    type="text" 
                    value={ambDest}
                    onChange={(e) => setAmbDest(e.target.value)}
                    placeholder="ENTER PICKUP COORDINATES OR ADDRESS"
                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-32 text-[12px] font-black text-white placeholder:text-white/5 focus:outline-none focus:border-cyan-500/40 transition-all uppercase tracking-[0.2em] h-[60px]"
                  />
                  {userLocation && (
                    <button 
                      onClick={() => setAmbDest(`${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-[9px] font-black text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all uppercase tracking-widest"
                    >
                      Use GPS
                    </button>
                  )}
                </div>

                <div className="relative group/field">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/field:text-cyan-400 transition-all duration-500">
                    <Hospital className="w-5 h-5" />
                  </span>
                  <select 
                    value={ambHospitalId}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-[12px] font-black text-white placeholder:text-white/5 focus:outline-none focus:border-cyan-500/40 transition-all uppercase tracking-[0.2em] h-[60px] appearance-none cursor-pointer"
                    onChange={(e) => setAmbHospitalId(e.target.value)}
                  >
                    <option value="" className="bg-[#0d1414]">NEAREST HOSPITAL (AUTO)</option>
                    {hospitals.filter(h => h.type === 'Hospital' || h.type === 'Medical Center').map(h => (
                      <option key={h.id} value={h.id} className="bg-[#0d1414]">{h.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAmbRequest}
            className="mt-6 w-full py-5 bg-cyan-500 hover:bg-cyan-400 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(6,182,212,0.2)] hover:shadow-[0_20px_40px_rgba(6,182,212,0.4)] transition-all active:scale-[0.98] group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-[12px] font-black text-white uppercase tracking-[0.3em] italic">SEND AMBULANCE</span>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-2 transition-transform" />
          </button>
        </motion.div>
      </div>
      {/* Recent Strategic Deployments - This is where we fetch and show database data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1414]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">REQUEST</h3>
            <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.5em] italic">Real-time Database Feed</p>
          </div>
          <div className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synced with Supabase</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Timestamp</th>
                <th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Operation</th>
                <th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Asset/Entity</th>
                <th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Location/Sector</th>
                <th className="pb-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* Render Pending Requests First */}
              {[...pendingRequests, ...pendingAmbulanceRequests]
                .filter(r => r.status === 'PENDING')
                .map((req: any, idx: number) => {
                  const isBed = req.id_code?.startsWith('RQ');
                  return (
                    <tr key={`req-${idx}`} className="group/row bg-orange-500/5 hover:bg-orange-500/10 transition-colors border-l-2 border-orange-500">
                      <td className="py-4">
                        <span className="text-[11px] font-black text-orange-400 numeric italic">
                          {req.created_at ? new Date(req.created_at).toLocaleTimeString() : '--:--'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                          <span className="text-[11px] font-black text-white uppercase tracking-wider italic">
                            {isBed ? 'Bed Request' : 'Amb Request'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-[11px] font-black text-white/80 uppercase tracking-wider">{req.patient_name || req.name}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-[11px] font-bold text-white/40 uppercase">{req.hospital_id}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => isBed ? approveRequest(req.id) : approveAmbulanceRequest(req.id)}
                            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[9px] font-black uppercase rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => isBed ? rejectRequest(req.id) : rejectAmbulanceRequest(req.id)}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-[9px] font-black uppercase rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
              })}

              {(useSimulation() as any).historicalBookings?.slice(0, 8).map((booking: any, idx: number) => {
                const isBed = booking.id_code?.startsWith('P');
                return (
                  <tr key={idx} className="group/row hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <span className="text-[11px] font-black text-white/40 numeric italic">
                        {booking.created_at ? new Date(booking.created_at).toLocaleTimeString() : '--:--'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          isBed ? "bg-emerald-500" : "bg-cyan-500"
                        )} />
                        <span className="text-[11px] font-black text-white uppercase tracking-wider italic">
                          {isBed ? 'Bed Reservation' : 'Amb Dispatch'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[11px] font-black text-white/80 uppercase tracking-wider">{booking.patient_name || booking.name || 'Classified'}</span>
                    </td>
                    <td className="py-4">
                      <span className="text-[11px] font-bold text-white/40 uppercase">{booking.hospital_id || 'Grid Sector'}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn(
                          "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest italic w-fit",
                          isBed ? "bg-emerald-500/10 text-emerald-400" : "bg-cyan-500/10 text-cyan-400"
                        )}>
                          Confirmed
                        </span>
                        <span className="text-[8px] font-mono text-white/20 ml-1">{booking.id_code}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!(useSimulation() as any).historicalBookings || (useSimulation() as any).historicalBookings.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-[11px] font-black text-white/10 uppercase tracking-[0.5em] italic">No active missions found in database</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
