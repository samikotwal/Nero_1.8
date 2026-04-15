import React from 'react';
import { motion } from 'motion/react';
import { Bell, Info, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { cn } from '../lib/utils';

export const Notifications = () => {
  const { emergencies } = useSimulation();

  const alerts = emergencies.map(em => ({
    id: em.id,
    title: em.name,
    message: `${em.description} reported at ${em.address}.`,
    time: em.time,
    type: em.priority === 'HIGH' ? 'critical' : 'info',
    read: false
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h2>
          <p className="text-white/40 mt-1">{alerts.filter(a => !a.read).length} unread alerts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-white/40 hover:text-white">
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="glass-card min-h-[400px] flex flex-col overflow-hidden">
        {alerts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 italic p-12">
            <Info className="w-12 h-12 mb-4 opacity-20" />
            <p>No alerts yet. Start the simulation to generate alerts.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-6 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group",
                  !alert.read && "bg-cyan-500/[0.02]"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  alert.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-400'
                )}>
                  {alert.type === 'critical' ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold">{alert.title}</h4>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{alert.time}</span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed max-w-2xl">{alert.message}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/20 hover:text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
