import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Hospital, MapPin, Phone, Star, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const springTransition: any = {
  type: "spring",
  stiffness: 150,
  damping: 12
};

export const HospitalManagement = () => {
  const navigate = useNavigate();
  const { hospitals } = useSimulation();
  const [visibleCount, setVisibleCount] = React.useState(10);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-white">Hospital Management</h2>
        <p className="text-sm text-white/40 font-medium">
          {hospitals.length} hospitals networked in your city
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {hospitals.slice(0, visibleCount).map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 10) * 0.05 }}
            whileHover={{ 
              y: -8, 
              transition: springTransition 
            }}
            onClick={() => navigate(`/hospitals/${h.id}`)}
            className={cn(
              "bg-[#0d1414]/80 backdrop-blur-xl border rounded-2xl p-6 group transition-all cursor-pointer relative",
              i === 1 ? "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.1)]" : "border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{h.type === 'Hospital' ? '🏥' : h.type === 'Medical Center' ? '🏢' : h.type === 'Medical Store' ? '💊' : '🩺'}</span>
                  <h3 className="text-lg font-black text-white tracking-tight leading-none">{h.name}</h3>
                </div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">H-{h.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div className={cn(
                "px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                h.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                h.status === 'busy' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              )}>
                {h.status}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Bed Capacity</p>
                  <p className="text-[10px] font-black text-white/60">{h.beds.total - h.beds.available}/{h.beds.total}</p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((h.beds.total - h.beds.available) / h.beds.total) * 100}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn(
                      "h-full rounded-full",
                      h.status === 'available' ? 'bg-emerald-500' : 
                      h.status === 'busy' ? 'bg-amber-500' :
                      'bg-rose-500'
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center group-hover:bg-white/[0.04] transition-colors">
                  <p className="text-2xl font-black text-white">{h.icuBeds}</p>
                  <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">ICU Available</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center group-hover:bg-white/[0.04] transition-colors">
                  <p className="text-2xl font-black text-white">{h.totalIcuBeds}</p>
                  <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mt-1">ICU Total</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {h.specialties.slice(0, 3).map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[8px] font-black border border-cyan-500/20 uppercase tracking-widest hover:bg-cyan-500/20 transition-colors">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {visibleCount < hospitals.length && (
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
