import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Hospital, 
  Bed, 
  Activity,
  AlertTriangle,
  Timer,
  MapPin,
  Wind,
  Brain,
  ShieldCheck
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import { Counter } from '../components/Counter';

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12,
  mass: 0.8
};

const StatCard = ({ title, value, subValue, icon, color, iconBg, isActive }: { title: string, value: string | number, subValue?: string, icon: React.ReactNode, color: string, iconBg: string, isActive?: boolean }) => {
  return (
    <motion.div
      whileHover={{ 
        y: -8, 
        scale: 1.02, 
        boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(6,182,212,0.2)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className={cn(
        "h-full bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-6 relative overflow-hidden group transition-all duration-500",
        isActive ? "border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)]" : "border-white/5 hover:border-white/10"
      )}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-sm font-medium text-white/40 mb-1 group-hover:text-white/60 transition-colors">{title}</p>
          <h3 className="text-4xl font-black tracking-tighter text-white mb-1 group-hover:scale-105 transition-transform origin-left">
            <Counter value={value} />
          </h3>
          {subValue && <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/30 transition-colors">{subValue}</p>}
        </div>
        <div className={cn(
          "p-3 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg",
          iconBg,
          isActive && "shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        )}>
          {icon}
        </div>
      </div>
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
      )}
    </motion.div>
  );
};

export const Dashboard = () => {
  const { hospitals, emergencies, overviewStats, responders } = useSimulation();

  const hourlyData = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    emergencies: Math.floor(Math.random() * 15 + 5),
    resolved: Math.floor(Math.random() * 12 + 3),
  })), []);

  const resourceData = useMemo(() => {
    const totalBedsAvailable = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
    const totalBedsCapacity = hospitals.reduce((acc, h) => acc + h.beds.total, 0);
    const totalIcuAvailable = hospitals.reduce((acc, h) => acc + h.icuBeds, 0);
    const totalIcuCapacity = hospitals.reduce((acc, h) => acc + h.totalIcuBeds, 0);
    const totalAmbAvailable = hospitals.reduce((acc, h) => acc + h.ambulances, 0);
    const totalAmbCapacity = hospitals.reduce((acc, h) => acc + h.totalAmbulances, 0);

    return [
      { name: "ICU Beds", available: totalIcuAvailable, total: totalIcuCapacity },
      { name: "General Beds", available: totalBedsAvailable, total: totalBedsCapacity },
      { name: "Ambulances", available: totalAmbAvailable, total: totalAmbCapacity },
    ];
  }, [hospitals]);

  const typeData = useMemo(() => [
    { name: "Cardiac", value: 25, color: "#ef4444" },
    { name: "Accident", value: 30, color: "#f59e0b" },
    { name: "Fire", value: 10, color: "#f97316" },
    { name: "Breathing", value: 15, color: "#06b6d4" },
    { name: "Stroke", value: 12, color: "#8b5cf6" },
    { name: "Other", value: 8, color: "#6b7280" },
  ], []);

  return (
    <div className="pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={springTransition}
        className="mb-8"
      >
        <h2 className="text-3xl font-black tracking-tight text-white">Command Center</h2>
        <p className="text-sm text-white/40 font-medium mt-1">Real-time emergency response overview</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard 
          title="Available Hospitals" 
          value={hospitals.filter(h => h.status === 'available').length} 
          subValue={`of ${hospitals.length} total`}
          icon={<Hospital className="w-6 h-6 text-cyan-400" />} 
          iconBg="bg-cyan-500/10"
          color="cyan"
          isActive={true}
        />
        <StatCard 
          title="BEDS" 
          value={hospitals.reduce((acc, h) => acc + h.icuBeds, 0)} 
          subValue="Monitored live"
          icon={<Bed className="w-6 h-6 text-emerald-400" />} 
          iconBg="bg-emerald-500/10"
          color="emerald"
        />
        <StatCard 
          title="AMBULANCE" 
          value={responders.length} 
          subValue="Active Dispatches"
          icon={<AlertTriangle className="w-6 h-6 text-cyan-400" />} 
          iconBg="bg-cyan-500/10"
          color="cyan"
        />
        <StatCard 
          title="REQUESTS" 
          value={emergencies.filter(e => e.status !== 'COMPLETED').length} 
          subValue="High Priority"
          icon={<Wind className="w-6 h-6 text-emerald-400" />} 
          iconBg="bg-emerald-500/10"
          color="emerald"
        />
        <StatCard 
          title="Completed Today" 
          value={overviewStats.completedToday} 
          subValue="+12% vs avg"
          icon={<Activity className="w-6 h-6 text-cyan-400" />} 
          iconBg="bg-cyan-500/10"
          color="cyan"
        />
        <StatCard 
          title="Avg Response" 
          value="8.5 min" 
          subValue="Target: <8 min"
          icon={<Timer className="w-6 h-6 text-cyan-400" />} 
          iconBg="bg-cyan-500/10"
          color="cyan"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Emergency Trends */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={springTransition}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h3 className="text-sm font-bold text-white mb-6 relative z-10">Emergency Trends (24h)</h3>
          <div className="h-[calc(100%-40px)] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="emergencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64748b" }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "rgba(13,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="emergencies" 
                  stroke="#06b6d4" 
                  fill="url(#emergencyGrad)" 
                  strokeWidth={3} 
                  filter="url(#glow)"
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#22c55e" 
                  fill="url(#resolvedGrad)" 
                  strokeWidth={3} 
                  filter="url(#glow)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resource Utilization */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={springTransition}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h3 className="text-sm font-bold text-white mb-6 relative z-10">Resource Utilization</h3>
          <div className="h-[calc(100%-40px)] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} barGap={-24}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: "rgba(13,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} 
                />
                <Bar dataKey="total" fill="rgba(255,255,255,0.05)" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="available" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={24} className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Emergency Types */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          transition={springTransition}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h3 className="text-sm font-bold text-white mb-6 relative z-10">Emergency Types</h3>
          <div className="h-[calc(100%-100px)] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={typeData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={65} 
                  outerRadius={95} 
                  dataKey="value" 
                  paddingAngle={5}
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "rgba(13,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center relative z-10">
            {typeData.map(t => (
              <div key={t.name} className="flex items-center gap-2 group/item cursor-default">
                <div className="h-2.5 w-2.5 rounded-full transition-transform group-hover/item:scale-125" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}66` }} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/item:text-white/80 transition-colors">{t.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live Emergency Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        transition={springTransition}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative group overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black text-white relative z-10 tracking-tight">Live Emergency Feed</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
            Live
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          {emergencies.map((emergency, index) => (
            <motion.div
              key={emergency.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group/item flex items-start gap-6"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110 duration-500",
                emergency.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
              )}>
                {emergency.description.toLowerCase().includes('respiratory') ? <Wind className="w-7 h-7" /> : <Brain className="w-7 h-7" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="font-black text-xl text-white tracking-tight">{emergency.name}</h4>
                  <div className="flex gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      emergency.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    )}>
                      {emergency.priority}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      emergency.status === 'ASSIGNED' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    )}>
                      {emergency.status}
                    </span>
                  </div>
                </div>
                <p className="text-base text-white/60 font-medium mb-3">{emergency.description}</p>
                <div className="flex items-center gap-2 text-white/40 mb-3">
                  <MapPin className="w-4 h-4 text-cyan-500/60" />
                  <span className="text-xs font-bold uppercase tracking-widest">{emergency.address}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/10">
                  <span>{emergency.id}</span>
                  <span className="opacity-50">•</span>
                  <span>{emergency.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
