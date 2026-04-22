import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Shield, MapPin, Phone, Activity, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const profileStats = [
    { label: 'Security Level', value: 'Level 1 Clearance', icon: Shield, color: 'text-cyan-400' },
    { label: 'Account Identity', value: user.id.substring(0, 12).toUpperCase(), icon: Activity, color: 'text-emerald-400' },
    { label: 'Primary Node', value: 'Default Region', icon: MapPin, color: 'text-amber-400' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-6">
      {/* Profile Header */}
      <div className="relative group">
        <div className="absolute inset-x-0 -bottom-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border-2 border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl backdrop-blur-xl">
               <User className="w-16 h-16 text-white/40" />
               <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            </div>
            <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          </div>
          
          <div className="text-center md:text-left space-y-3">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Active Operative</span>
             </div>
             <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
               User Profile
             </h1>
             <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em] mt-2">Personal Management Console</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Intelligence */}
        <section className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Mail className="w-32 h-32 text-cyan-400" />
          </div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
              <Activity className="w-5 h-5 text-cyan-400" />
              Communication Data
            </h3>
            
            <div className="space-y-6">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 group/item hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Email Interface</span>
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-tight">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 group/item hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">System Enrollment</span>
                    <span className="text-sm font-bold text-white font-mono uppercase tracking-tight">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Statistics */}
        <section className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Shield className="w-32 h-32 text-rose-500" />
          </div>
          <div className="relative z-10 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
              <Zap className="w-5 h-5 text-rose-500" />
              Intelligence Stats
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {profileStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-xs font-black text-white italic">{stat.value}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
               <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:text-white hover:bg-white/10 transition-all">
                 Modify Identity Credentials
               </button>
            </div>
          </div>
        </section>
      </div>

      {/* Security Status Footnote */}
      <div className="text-center p-8 bg-zinc-900/40 rounded-[2rem] border border-white/5 backdrop-blur-2xl">
         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] leading-relaxed">
           Your account is protected by military-grade encryption.<br />
           All interactions with SERS nodes are logged under protocol 7.2.
         </p>
      </div>
    </div>
  );
};
