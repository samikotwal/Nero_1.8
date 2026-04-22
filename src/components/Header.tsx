import React, { useState } from 'react';
import { Bell, Search, Zap, Play, Pause, Menu, AlertCircle, Radio, LogOut, User, ChevronDown } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

export const Header = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { 
      isSimulationActive, 
      toggleSimulation, 
      searchQuery, 
      setSearchQuery, 
      filterType, 
      setFilterType,
      statusFilter,
      setStatusFilter,
      notifications,
      markNotificationsAsRead
    } = useSimulation();
    const location = useLocation();
    const isSearchablePage = ['/map', '/hospitals'].includes(location.pathname);
  
    return (
      <header className="h-16 border-b border-white/5 bg-[#050a0a]/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 z-40">
        <div className="flex items-center gap-3 lg:gap-6">
          <button 
            onClick={toggleSidebar}
            className="p-2.5 rounded-xl bg-white/5 lg:bg-transparent hover:bg-white/10 transition-all text-white/60 hover:text-white border border-white/10 lg:border-none"
          >
            <Menu className="w-6 h-6" />
          </button>
  
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]",
              isSimulationActive ? 'bg-emerald-500 animate-pulse' : 'bg-white/20 shadow-none'
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              {isSimulationActive ? 'Simulation Active' : 'Simulation Paused'}
            </span>
          </div>
  
          {isSearchablePage && (
            <div className="hidden xl:flex items-center gap-4 ml-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search hospital, clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
                {['All', 'Hospital', 'Medical Store', 'Clinic'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                      filterType === type ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "text-white/40 hover:text-white"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Zap className="w-4 h-4 fill-current" />
            Trigger Emergency
          </motion.button>
  
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSimulation}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
              isSimulationActive 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
            )}
          >
            <Radio className={cn("w-4 h-4", isSimulationActive && "animate-pulse")} />
            {isSimulationActive ? 'Pause' : 'Resume'}
          </motion.button>

        <div className="flex items-center gap-2 lg:gap-4 border-l border-white/10 ml-2 pl-4 lg:pl-6">
          <button 
            onClick={() => {
              markNotificationsAsRead();
              navigate('/notifications');
            }}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Bell className="w-5 h-5 text-white/60" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#050a0a] flex items-center justify-center text-[8px] font-black text-white">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                {user?.email?.[0].toUpperCase()}
              </div>
              <ChevronDown className={cn("w-3 h-3 text-white/20 transition-transform", isUserMenuOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-[#0d1414] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Authenticated As</p>
                      <p className="text-[11px] font-bold text-white truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-all"
                      >
                        <User className="w-3.5 h-3.5" />
                        Settings
                      </button>
                      <button 
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-[10px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
