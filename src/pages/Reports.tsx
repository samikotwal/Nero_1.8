import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Download,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useSimulation } from '../context/SimulationContext';
import { cn } from '../lib/utils';
import { fetchRecentBookings } from '../services/hospitalDatabaseService';
import { Loader2 } from 'lucide-react';

const weeklyData = [
  { day: 'Tue', time: 8.2 },
  { day: 'Wed', time: 8.8 },
  { day: 'Thu', time: 8.5 },
  { day: 'Fri', time: 5.2 },
  { day: 'Sat', time: 6.8 },
  { day: 'Sun', time: 7.1 },
  { day: 'Mon', time: 9.5 },
];

const hourlyData = [
  { time: '00:00', emergencies: 14, resolved: 8 },
  { time: '02:00', emergencies: 9, resolved: 12 },
  { time: '04:00', emergencies: 18, resolved: 5 },
  { time: '06:00', emergencies: 12, resolved: 10 },
  { time: '08:00', emergencies: 19, resolved: 14 },
  { time: '10:00', emergencies: 7, resolved: 11 },
  { time: '12:00', emergencies: 14, resolved: 9 },
  { time: '14:00', emergencies: 13, resolved: 12 },
  { time: '16:00', emergencies: 10, resolved: 15 },
  { time: '18:00', emergencies: 15, resolved: 8 },
  { time: '20:00', emergencies: 6, resolved: 4 },
  { time: '22:00', emergencies: 17, resolved: 11 },
  { time: '24:00', emergencies: 10, resolved: 13 },
];

const resourceData = [
  { name: 'Ambulances', available: 12, total: 15 },
  { name: 'ICU Beds', available: 45, total: 120 },
  { name: 'Ventilators', available: 28, total: 60 },
  { name: 'Blood Units', available: 150, total: 200 },
];

const typeData = [
  { name: "Cardiac", value: 25, color: "#ef4444" },
  { name: "Accident", value: 30, color: "#f59e0b" },
  { name: "Fire", value: 10, color: "#f97316" },
  { name: "Breathing", value: 15, color: "#06b6d4" },
  { name: "Stroke", value: 12, color: "#8b5cf6" },
  { name: "Other", value: 8, color: "#6b7280" },
];

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12,
  mass: 0.8
};

export const Reports = () => {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBookings = async () => {
      setIsBookingsLoading(true);
      const data = await fetchRecentBookings();
      setBookings(data);
      setIsBookingsLoading(false);
    };
    loadBookings();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Weekly Response Time Trend */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative group overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black tracking-tight text-white">Weekly Response Time Trend</h3>
          <button className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="day" 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={true} 
                axisLine={true} 
                dy={10}
                tick={{ fill: '#64748b', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#ffffff20" 
                fontSize={10} 
                tickLine={true} 
                axisLine={true} 
                unit=" min" 
                ticks={[0, 3, 6, 9, 12]}
                domain={[0, 12]}
                tick={{ fill: '#64748b', fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#080e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#06b6d4" 
                strokeWidth={4} 
                dot={{ fill: '#06b6d4', strokeWidth: 0, r: 5, filter: 'url(#glow)' }}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#06b6d4', filter: 'url(#glow)' }}
                filter="url(#glow)"
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Emergency Trends (24h) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <h3 className="text-sm font-black tracking-tight text-white mb-6">Emergency Trends (24h)</h3>
          <div className="h-[calc(100%-40px)] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="emergGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={true} axisLine={true} interval={2} tick={{ fill: '#64748b' }} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={true} axisLine={true} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="emergencies" 
                  stroke="#06b6d4" 
                  fill="url(#emergGrad)" 
                  strokeWidth={3} 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  stroke="#22c55e" 
                  fill="url(#resolGrad)" 
                  strokeWidth={3} 
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
          transition={{ ...springTransition, delay: 0.2 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <h3 className="text-sm font-black tracking-tight text-white mb-6">Resource Utilization</h3>
          <div className="h-[calc(100%-40px)] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} barGap={-24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={true} axisLine={true} tick={{ fill: '#64748b' }} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={true} axisLine={true} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#080e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
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
          transition={{ ...springTransition, delay: 0.3 }}
          className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative group overflow-hidden h-[400px]"
        >
          <h3 className="text-sm font-black tracking-tight text-white mb-6">Emergency Types</h3>
          <div className="h-[calc(100%-100px)] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#080e0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center">
            {typeData.map(t => (
              <div key={t.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}66` }} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Recent Bookings Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.5 }}
        className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative group overflow-hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase italic leading-none">Booking History</h3>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Live patient records from Supabase</p>
            </div>
          </div>
          <button 
            onClick={async () => {
              setIsBookingsLoading(true);
              const data = await fetchRecentBookings();
              setBookings(data);
              setIsBookingsLoading(false);
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
          >
            Refresh Feed
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Patient Details</th>
                <th className="px-6 py-4">Facility</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {isBookingsLoading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Accessing Secure Records...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-white/10 italic text-sm font-black uppercase tracking-widest">
                    No bookings recorded in the system yet.
                  </td>
                </tr>
              ) : (
                bookings.map((booking, idx) => (
                  <motion.tr 
                    key={booking.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 hover:bg-white/[0.08] transition-colors rounded-xl overflow-hidden group"
                  >
                    <td className="px-6 py-4 rounded-l-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">👤</div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-white italic tracking-tight">{booking.patient_name}</span>
                          <span className="text-[9px] font-black text-white/40 tracking-widest mt-0.5">{booking.contact_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-cyan-400/80 uppercase">{booking.hospital_name}</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">ID: {booking.hospital_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        booking.resource_type === 'BED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {booking.resource_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right rounded-r-xl">
                      <span className="text-[10px] font-mono text-white/30">
                        {new Date(booking.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: 'Total Emergencies', value: '0', sub: 'This session' },
          { label: 'Avg Response Time', value: '8.5 min', sub: 'Target: <8 min' },
          { label: 'Resolution Rate', value: '94.2%', sub: '+2.1% vs last week' },
          { label: 'Patient Satisfaction', value: '4.7/5', sub: 'Based on feedback' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.4 + i * 0.1 }}
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center hover:border-cyan-500/30 transition-colors"
          >
            <h4 className="text-3xl font-black mb-2 text-white">{stat.value}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">{stat.label}</p>
            <p className="text-[10px] text-white/20 font-bold">{stat.sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
