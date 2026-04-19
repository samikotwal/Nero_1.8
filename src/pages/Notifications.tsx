import React from 'react';
import { motion } from 'motion/react';
import { Bell, Info, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { cn } from '../lib/utils';

export const Notifications = () => {
  const { notifications, markNotificationsAsRead } = useSimulation();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h2>
          <p className="text-white/40 mt-1">{notifications.filter(a => !a.read).length} unread notifications</p>
        </div>
        <button 
          onClick={markNotificationsAsRead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-white/40 hover:text-white"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="glass-card min-h-[400px] flex flex-col overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/20 italic p-12">
            <Info className="w-12 h-12 mb-4 opacity-20" />
            <p>No notifications yet. Notifications will appear when ambulances arrive at their destinations.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-6 flex items-start gap-4 hover:bg-white/[0.02] transition-colors group",
                  !notif.read && "bg-cyan-500/[0.02]"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                  notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                  notif.type === 'error' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                )}>
                  {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                   notif.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : 
                   <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold uppercase italic text-white/90">{notif.title}</h4>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{notif.timestamp}</span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed max-w-2xl">{notif.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
