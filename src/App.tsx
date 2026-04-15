import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SimulationProvider } from './context/SimulationContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import { ResourceManagement } from './pages/ResourceManagement';
import { HospitalManagement } from './pages/HospitalManagement';
import { HospitalDetail } from './pages/HospitalDetail';
import { LiveMap } from './pages/LiveMap';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 1024);

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

  return (
    <SimulationProvider>
      <Router>
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
                  <Route path="/resources" element={<ResourceManagement />} />
                  <Route path="/hospitals" element={<HospitalManagement />} />
                  <Route path="/hospitals/:id" element={<HospitalDetail />} />
                  <Route path="/map" element={<LiveMap />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </PageWrapper>
            </main>
          </div>
        </div>
      </Router>
    </SimulationProvider>
  );
}
