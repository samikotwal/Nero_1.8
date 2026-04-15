import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Monitor, 
  Bell, 
  Shield, 
  Cpu, 
  Globe,
  Moon,
  Volume2
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const Settings = () => {
  const { isSimulationActive, toggleSimulation } = useSimulation();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-white/40 mt-1">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Monitor className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold">Display Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Dark Mode</p>
                  <p className="text-xs text-white/40">Use high-contrast dark theme for better visibility</p>
                </div>
                <div className="w-12 h-6 rounded-full bg-cyan-500 p-1 flex justify-end cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Map Style</p>
                  <p className="text-xs text-white/40">Choose between different map tile providers</p>
                </div>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
                  <option>Dark (CartoDB)</option>
                  <option>Light (OSM)</option>
                  <option>Satellite</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Animation Speed</p>
                  <p className="text-xs text-white/40">Adjust the speed of UI transitions and map movements</p>
                </div>
                <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/50">
                  <option>Slow</option>
                  <option>Normal</option>
                  <option>Fast</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold">Notification Preferences</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Critical Capacity Alerts</p>
                  <p className="text-xs text-white/40">Receive immediate notifications for critical bed shortages</p>
                </div>
                <span className="text-xs font-bold text-white/40">Sound + Visual</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Resource Warnings</p>
                  <p className="text-xs text-white/40">Get notified when hospital beds or supplies are low</p>
                </div>
                <span className="text-xs font-bold text-white/40">Visual Only</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Desktop Notifications</p>
                  <p className="text-xs text-white/40">Show alerts even when the browser is in background</p>
                </div>
                <div className="w-12 h-6 rounded-full bg-cyan-500 p-1 flex justify-end cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold">Simulation Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Auto-update Capacity</span>
                <div 
                  onClick={toggleSimulation}
                  className={`w-10 h-5 rounded-full p-1 flex cursor-pointer transition-all ${isSimulationActive ? 'bg-cyan-500 justify-end' : 'bg-white/10 justify-start'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Update Frequency</span>
                <span className="text-xs font-bold">Real-time</span>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all">
              Reset Simulation State
            </button>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold">System Status</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">API Connectivity</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Database Latency</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">12ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Map Engine</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Leaflet 1.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
