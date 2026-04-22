import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { AlertCircle, Clock, MapPin, CheckCircle2, ShieldAlert, Activity, Siren, Phone } from 'lucide-react';
import { cn } from '../lib/utils';

export const EmergencyRequests = () => {
  const { emergencies } = useSimulation();
  const [filter, setFilter] = React.useState('all');

  const filteredEmergencies = emergencies.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const counts = {
    all: emergencies.length,
    pending: emergencies.filter(e => e.status === 'PENDING').length,
    assigned: emergencies.filter(e => e.status === 'ASSIGNED').length,
    completed: emergencies.filter(e => e.status === 'COMPLETED').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Live Mission Feed</span>
          </div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">Emergency Log</h2>
          <p className="text-white/30 text-xs font-bold uppercase tracking-[0.4em] mt-3">Tactical resource allocation tracking</p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
          {Object.entries(counts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filter === key 
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                  : "text-white/30 hover:text-white hover:bg-white/5"
              )}
            >
              {key}
              <span className="ml-3 opacity-40 font-mono">[{count.toString().padStart(2, '0')}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredEmergencies.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-[3rem] py-32 flex flex-col items-center justify-center text-white/10 italic">
            <ShieldAlert className="w-20 h-20 mb-6 opacity-10" />
            <p className="text-sm font-black uppercase tracking-[0.4em]">Grid Clear: No Active Incidents</p>
          </div>
        ) : (
          filteredEmergencies.map((em, i) => (
            <motion.div
              key={em.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] hover:border-cyan-500/40 transition-all shadow-xl"
            >
              {/* Highlight bar base on status */}
              <div className={cn(
                "absolute left-0 inset-y-0 w-1",
                em.status === 'PENDING' ? 'bg-amber-500' : 
                em.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-cyan-500'
              )} />

              <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center text-4xl relative shrink-0 overflow-hidden",
                    em.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  )}>
                    <div className="absolute inset-0 opacity-10 animate-pulse bg-current" />
                    <span className="relative z-10">
                      {em.description.includes('Cardiac') ? '🫀' : em.description.includes('Accident') ? '🚗' : em.description.includes('Fire') ? '🔥' : <Siren className="w-10 h-10" />}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <h4 className="text-2xl font-black italic tracking-tighter text-white uppercase">{em.name}</h4>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                        em.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      )}>
                        {em.priority} RISK
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-white/30 uppercase tracking-widest">
                      <div className="flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{em.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Incept: {em.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>SIG: {em.id.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                   <div className="hidden xl:flex flex-col items-end">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Response Target</span>
                      <span className="text-xs font-black text-white italic">Primary Extraction Point</span>
                   </div>

                   <div className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border shadow-lg h-fit",
                    em.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    em.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                  )}>
                    {em.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-[pulse_1s_infinite]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-[pulse_1s_infinite_0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-[pulse_1s_infinite_0.4s]" />
                      </div>
                    )}
                    {em.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
