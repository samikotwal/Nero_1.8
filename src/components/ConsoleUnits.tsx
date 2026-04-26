import React, { useState } from 'react';
import { Bed, Zap, User, Phone, ShieldAlert, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ConsoleCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  statusLabel: string;
  statusValue: string;
  statusTotal: string;
  statusColor?: string;
  buttonText: string;
  buttonColor: string;
  inputs: { placeholder: string; icon: React.ReactNode }[];
  accentColor: string;
}

const ConsoleCard = ({ 
  title, 
  subtitle, 
  icon, 
  statusLabel, 
  statusValue, 
  statusTotal, 
  statusColor = "text-emerald-500",
  buttonText, 
  buttonColor, 
  inputs,
  accentColor
}: ConsoleCardProps) => {
  const [qty, setQty] = useState(1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0a0f0f] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group"
    >
      {/* Background Icon Watermark */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
        <div className="scale-[4]">
          {icon}
        </div>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", `bg-${accentColor}/10 border-${accentColor}/20 text-${accentColor}`)}>
            {icon}
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">{title}</h3>
            <p className="text-[10px] font-black text-white/20 tracking-[0.2em] mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Status Display and Qty Selector */}
          <div className="flex items-center gap-6 bg-black/40 border border-white/5 rounded-2xl p-4 w-full lg:w-auto">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none">{statusLabel}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest border border-emerald-500/20">Ready</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-4xl font-black italic text-white")}>{statusValue}</span>
                <span className="text-xs font-bold text-white/10 uppercase italic">/ {statusTotal}</span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/5 mx-2" />

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Qty</span>
                <span className="text-xl font-black italic text-white leading-none">{qty}</span>
              </div>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Inputs */}
          <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
            {inputs.map((input, idx) => (
              <div key={idx} className="flex-1 relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-white transition-colors">
                  {input.icon}
                </div>
                <input 
                  type="text" 
                  placeholder={input.placeholder}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[10px] font-black text-white uppercase placeholder:text-white/10 outline-none focus:border-white/20 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button className={cn(
            "w-full lg:w-48 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-[0.98] relative overflow-hidden group/btn",
            buttonColor
          )}>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <span className="relative z-10">{buttonText}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ConsoleUnits = () => {
  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-8 mt-12 pb-12">
      <ConsoleCard 
        title="Command Terminal"
        subtitle="BED RESOURCE MANAGEMENT"
        icon={<Bed className="w-6 h-6" />}
        statusLabel="Available"
        statusValue="170"
        statusTotal="180"
        buttonText="REQUEST"
        buttonColor="bg-[#00c88c] shadow-[0_0_20px_rgba(0,200,140,0.4)] hover:bg-[#00d696] hover:shadow-[0_0_30px_rgba(0,214,150,0.6)]"
        accentColor="emerald-500"
        inputs={[
          { placeholder: "COORDINATOR NAME", icon: <User className="w-4 h-4" /> },
          { placeholder: "CONTACT NUMBER", icon: <Phone className="w-4 h-4" /> },
          { placeholder: "EMERGENCY CONTACT", icon: <ShieldAlert className="w-4 h-4" /> },
        ]}
      />

      <ConsoleCard 
        title="Deployment Console"
        subtitle="RESPONSE MANAGEMENT"
        icon={<Zap className="w-6 h-6" />}
        statusLabel="Fleet Status"
        statusValue="2"
        statusTotal="4"
        buttonText="REQUEST"
        buttonColor="bg-[#00bcd4] shadow-[0_0_20px_rgba(0,188,212,0.4)] hover:bg-[#00cfea] hover:shadow-[0_0_30px_rgba(0,207,234,0.6)]"
        accentColor="cyan-500"
        inputs={[
          { placeholder: "FIELD COMMANDER", icon: <User className="w-4 h-4" /> },
          { placeholder: "STRIKE CONTACT", icon: <Phone className="w-4 h-4" /> },
        ]}
      />
    </div>
  );
};
