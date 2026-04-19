import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { AlertCircle, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12
};

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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Emergency Requests</h2>
          <p className="text-white/40 mt-1">{emergencies.length} total emergencies tracked</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([key, count]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springTransition}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all border",
                filter === key 
                  ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20" 
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
              )}
            >
              <span className="capitalize">{key.replace('-', ' ')}</span>
              <span className="ml-2 opacity-50">({count})</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEmergencies.length === 0 ? (
          <div className="glass-card py-24 flex flex-col items-center justify-center text-white/20 italic">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            No emergencies found for this filter
          </div>
        ) : (
          filteredEmergencies.map((em, i) => (
            <motion.div
              key={em.id}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: i * 0.05 }}
              className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-cyan-500/30 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                  em.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                )}>
                  {em.description.includes('Cardiac') ? '🫀' : em.description.includes('Accident') ? '🚗' : em.description.includes('Fire') ? '🔥' : '🚨'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-lg">{em.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      em.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                    )}>
                      {em.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{em.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{em.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white/20">ID:</span>
                      <span>{em.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="flex flex-col items-end gap-2">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2",
                    em.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 
                    em.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-400'
                  )}>
                    {em.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                    <span className="capitalize">{em.status}</span>
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
