import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SimulationProvider } from './context/SimulationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Activity, Loader2 } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

import { Dashboard } from './pages/Dashboard';
import { EmergencyRequests } from './pages/EmergencyRequests';
import { HospitalManagement } from './pages/HospitalManagement';
import { HospitalDetail } from './pages/HospitalDetail';
import LiveMap from './pages/LiveMap';
import { Profile } from './pages/Profile';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 1024);
  const [isAppReady, setIsAppReady] = React.useState(false);

  useEffect(() => {
    // Immediate mission startup
    const timer = setTimeout(() => setIsAppReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Syncing Clearance...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <SimulationProvider>
      <Router>
        <AnimatePresence>
          {!isAppReady && (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-[#050a0a] flex flex-col items-center justify-center gap-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-24 h-24 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.3)] relative"
              >
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                <Activity className="text-cyan-400 w-12 h-12 relative z-10" />
              </motion.div>
              <div className="text-center">
                <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-black text-4xl tracking-tighter text-white"
                >
                  SERS
                </motion.h1>
                <motion.p 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.3 }}
                   className="text-[10px] text-cyan-400/60 uppercase tracking-[0.3em] font-black"
                >
                  Emergency Response
                </motion.p>
              </div>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: 200 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4" 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex h-screen bg-[#050a0a] text-white overflow-hidden font-sans relative">
          <AnimatePresence>
            {isSidebarOpen && window.innerWidth <= 1024 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
              />
            )}
          </AnimatePresence>
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
              <PageWrapper>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/hospitals" element={<HospitalManagement />} />
                  <Route path="/hospitals/:id" element={<HospitalDetail />} />
                  <Route path="/map" element={<LiveMap />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </PageWrapper>
            </main>
          </div>
        </div>
      </Router>
    </SimulationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
