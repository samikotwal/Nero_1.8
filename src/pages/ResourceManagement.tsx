import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { Hospital, Bed, Activity, Thermometer, Droplets, Truck } from 'lucide-react';
import { cn } from '../lib/utils';

import { Counter } from '../components/Counter';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 10
};

export const ResourceManagement = () => {
  const { hospitals } = useSimulation();

  const totalBeds = hospitals.reduce((acc, h) => acc + h.beds.available, 0);
  const totalIcuBeds = hospitals.reduce((acc, h) => acc + h.icuBeds, 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">Resource Management</h2>
        <p className="text-white/40 mt-1 font-bold uppercase tracking-widest text-[10px]">Medical inventory and facility tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 border-white/10 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover:bg-cyan-500/10 transition-colors" />
            
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Hospital className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Hospital Capacity</h3>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Real-time bed availability across network</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
              {hospitals.map((h, i) => (
                <motion.div 
                  key={h.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-sm tracking-tight group-hover:text-cyan-400 transition-colors">{h.name}</h4>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      h.status === 'available' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                    )}>
                      {h.status}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                        <span className="text-white/20">General Beds</span>
                        <span className="text-white/60">{h.beds.available} / {h.beds.total}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(h.beds.available / h.beds.total) * 100}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            background: (h.beds.available / h.beds.total) > 0.5 
                              ? 'linear-gradient(90deg, #10b981, #34d399)' 
                              : (h.beds.available / h.beds.total) > 0.2 
                                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                                : 'linear-gradient(90deg, #f43f5e, #fb7185)',
                            boxShadow: (h.beds.available / h.beds.total) > 0.5 
                              ? '0 0 10px rgba(16,185,129,0.3)' 
                              : (h.beds.available / h.beds.total) > 0.2 
                                ? '0 0 10px rgba(245,158,11,0.3)' 
                                : '0 0 10px rgba(244,63,94,0.3)'
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                        <span className="text-white/20">ICU Capacity</span>
                        <span className="text-white/60">{h.icuBeds} / {h.totalIcuBeds}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(h.icuBeds / h.totalIcuBeds) * 100}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            background: (h.icuBeds / h.totalIcuBeds) > 0.5 
                              ? 'linear-gradient(90deg, #10b981, #34d399)' 
                              : (h.icuBeds / h.totalIcuBeds) > 0.2 
                                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                                : 'linear-gradient(90deg, #f43f5e, #fb7185)',
                            boxShadow: (h.icuBeds / h.totalIcuBeds) > 0.5 
                              ? '0 0 10px rgba(16,185,129,0.3)' 
                              : (h.icuBeds / h.totalIcuBeds) > 0.2 
                                ? '0 0 10px rgba(245,158,11,0.3)' 
                                : '0 0 10px rgba(244,63,94,0.3)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Bed className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Global Stats</h3>
            </div>
            
            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-cyan-500/30 transition-all">
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Total Available Beds</p>
                <p className="text-4xl font-black text-white tracking-tighter">
                  <Counter value={totalBeds} />
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-emerald-500/30 transition-all">
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Total ICU Units</p>
                <p className="text-4xl font-black text-emerald-400 tracking-tighter">
                  <Counter value={totalIcuBeds} />
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 group hover:border-cyan-500/30 transition-all">
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Network Capacity</p>
                <p className="text-4xl font-black text-cyan-400 tracking-tighter">
                  <Counter value="84%" />
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 border-white/10 shadow-2xl"
          >
            <h3 className="text-xl font-black tracking-tight mb-8">Critical Supplies</h3>
            <div className="space-y-6">
              {[
                { label: 'Oxygen Supply', value: 85, icon: Thermometer, color: 'bg-cyan-500' },
                { label: 'Blood Inventory', value: 92, icon: Droplets, color: 'bg-rose-500' },
                { label: 'Ventilators', value: 45, icon: Activity, color: 'bg-emerald-500' },
                { label: 'Medical Kits', value: 78, icon: Truck, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <item.icon className={cn("w-4 h-4", item.color.replace('bg', 'text'))} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                    </div>
                    <span className="text-xs font-black text-white">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
