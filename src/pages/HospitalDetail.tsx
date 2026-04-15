import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'motion/react';
import { 
  Hospital as HospitalIcon, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  ArrowLeft,
  Bed,
  Activity,
  Clock,
  Info,
  Navigation,
  Heart,
  Share2,
  Users,
  Truck,
  Building2,
  ExternalLink,
  Play
} from 'lucide-react';
import { cn } from '../lib/utils';

export const HospitalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hospitals } = useSimulation();
  
  const hospital = hospitals.find(h => h.id === id);

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-white/40">
        <HospitalIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-xl font-bold">Hospital not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-bold border border-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20">
      {/* Hero Section with Background Blur */}
      <div className="relative min-h-[400px] md:h-[500px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-30"
          style={{ backgroundImage: `url(https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a0a] via-[#050a0a]/60 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-end pb-8 md:pb-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end w-full">
            {/* Poster Image */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-40 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 shrink-0 bg-white/5 mx-auto md:mx-0"
            >
              <img 
                src="https://img.freepik.com/free-vector/hospital-building-concept-illustration_114360-8440.jpg" 
                alt={hospital.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Main Info */}
            <div className="flex-1 space-y-6">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                  {hospital.name}
                </h1>
                <p className="text-lg text-white/60 font-medium">
                  {hospital.type} • {hospital.address}
                </p>
                <p className="text-sm text-white/20 font-bold uppercase tracking-widest">
                  H-{hospital.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {hospital.specialties.map(s => (
                  <span key={s} className="px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest">
                    {s}
                  </span>
                ))}
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-xl font-black">4.8</span>
                  <span className="text-xs text-white/40 font-bold">(12,450 reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-sm font-black uppercase tracking-widest">#1 Ranked</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-black uppercase tracking-widest">High Popularity</span>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                {[
                  { label: 'Status', value: hospital.status, icon: Activity, color: hospital.status === 'available' ? 'text-emerald-400' : 'text-amber-400' },
                  { label: 'Beds', value: `${hospital.beds.available}/${hospital.beds.total}`, icon: Bed, color: 'text-cyan-400' },
                  { label: 'ICU', value: `${hospital.icuBeds}/${hospital.totalIcuBeds}`, icon: ShieldCheck, color: 'text-rose-400' },
                  { label: 'Distance', value: `${hospital.distance?.toFixed(1)} km`, icon: MapPin, color: 'text-blue-400' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className={cn("w-3 h-3", item.color)} />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className={cn("text-sm font-black uppercase tracking-tight", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6">
                <button 
                  onClick={() => navigate('/live-map', { state: { selectedHospitalId: hospital.id } })}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-105 transition-all flex items-center gap-3"
                >
                  <Navigation className="w-5 h-5" />
                  Navigate Now
                </button>
                <button className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <Heart className="w-5 h-5 text-white/40 group-hover:text-rose-500 transition-colors" />
                </button>
                <button className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <Share2 className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        {/* Left Column: Synopsis & Media */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-black tracking-tight uppercase">Synopsis</h2>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="text-white/60 leading-relaxed text-lg font-medium">
                {hospital.name} stands as a beacon of medical excellence in the heart of the city. As a premier {hospital.type.toLowerCase()}, it offers a comprehensive range of healthcare services, from advanced emergency trauma care to specialized surgical procedures.
                <br /><br />
                Equipped with the latest diagnostic technologies and staffed by world-class medical professionals, the facility is designed to provide patient-centric care in a modern, healing environment. Our commitment to innovation and compassion ensures that every patient receives the highest standard of treatment.
              </p>
              <button className="mt-6 text-cyan-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">
                Read More <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar Stats */}
        <div className="space-y-8">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Statistics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Staff', value: '1,240', icon: Users },
                { label: 'Ambulances', value: '12 Active', icon: Truck },
                { label: 'Departments', value: '24 Units', icon: Building2 },
                { label: 'Status', value: 'Operating', icon: Activity, color: 'text-emerald-400' },
                { label: 'Emergency', value: '24/7 Active', icon: Clock },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white/40">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{stat.label}</span>
                  </div>
                  <span className={cn("text-sm font-black", stat.color || "text-white")}>{stat.value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">Departments</h3>
            <div className="flex flex-wrap gap-2">
              {['Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Orthopedics'].map(dept => (
                <span key={dept} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60">
                  {dept}
                </span>
              ))}
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight">External Links</h3>
            <div className="space-y-3">
              {[
                { label: 'Official Website', url: '#' },
                { label: 'Patient Portal', url: '#' },
                { label: 'Emergency Guidelines', url: '#' },
              ].map((link, i) => (
                <a 
                  key={i} 
                  href={link.url}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 transition-all group"
                >
                  <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{link.label}</span>
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
