import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Truck, 
  Hospital, 
  Map as MapIcon, 
  BarChart3, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogIn,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: AlertTriangle, label: 'Emergency Requests', path: '/emergency' },
  { icon: Truck, label: 'Resource Management', path: '/resources' },
  { icon: Hospital, label: 'Hospital Management', path: '/hospitals' },
  { icon: MapIcon, label: 'Live Map', path: '/map' },
  { icon: BarChart3, label: 'Reports & Analytics', path: '/reports' },
  { icon: Bell, label: 'Alerts & Notifications', path: '/notifications' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const sidebarVariants = {
    open: { width: '280px', x: 0 },
    closed: { width: '0px', x: -280 }
  };

  return (
    <motion.aside 
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={sidebarVariants}
      className={cn(
        "fixed lg:relative h-screen bg-[#050a0a] border-r border-white/5 flex flex-col z-[95] overflow-hidden transition-all duration-300 ease-in-out"
      )}
    >
      <div className="flex flex-col h-full py-6 w-[280px] relative">
        {/* Background Grid Pattern for Tech Feel */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="px-6 mb-10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 180, scale: 1.1 }}
              className="w-10 h-10 bg-[#00f2ff]/10 rounded-xl flex items-center justify-center border border-[#00f2ff]/20 shadow-[0_0_20px_rgba(0,242,255,0.2)] group"
            >
              <Activity className="text-[#00f2ff] w-6 h-6 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-[#00f2ff]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">SERS</h1>
              <p className="text-[10px] text-[#00f2ff]/40 uppercase tracking-widest font-black">Emergency Response</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 group relative overflow-hidden",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.1)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                  
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-all duration-500 group-hover:scale-110", 
                    isActive ? "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" : "group-hover:text-white"
                  )} />
                  <span className={cn(
                    "font-bold text-sm whitespace-nowrap tracking-wide transition-colors duration-300",
                    isActive ? "text-white" : "group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute right-0 w-1 h-6 bg-cyan-500 rounded-l-full shadow-[0_0_20px_rgba(6,182,212,1)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 mt-auto relative z-10">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            <LogIn className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
