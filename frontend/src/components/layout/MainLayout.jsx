import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Phone, Calendar, LifeBuoy, AlertCircle, X, ShieldAlert } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { cn } from '@/utils/cn'

export default function MainLayout() {
  const { sidebarCollapsed } = useUIStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const mainContentRef = useRef(null)
  const navigate = useNavigate()

  // Track scroll position on main content for Back-to-Top visibility
  const handleScroll = (e) => {
    if (e.target.scrollTop > 300) {
      setShowScrollTop(true)
    } else {
      setShowScrollTop(false)
    }
  }

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-gray-950/20 text-gray-900 dark:text-gray-150">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop: always visible, Mobile: drawer */}
      <div
        className={cn(
          'fixed lg:relative lg:flex flex-shrink-0 h-full z-40 lg:z-auto transition-transform duration-300',
          mobileSidebarOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Page content container */}
        <main
          ref={mainContentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-hide relative"
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Float Actions Area */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Back to Top */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={scrollToTop}
              className="p-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl shadow-elevated border border-gray-150/50 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus:outline-none"
              aria-label="Back to top"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Action Button (FAB) */}
        <div className="relative">
          <AnimatePresence>
            {fabOpen && (
              <div className="absolute bottom-16 right-0 flex flex-col gap-3.5 items-end">
                {/* Book Appointment Action */}
                <motion.button
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                  onClick={() => { navigate('/appointments/book'); setFabOpen(false) }}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-elevated text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </motion.button>

                {/* Emergency Contact Action */}
                <motion.button
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                  onClick={() => { setShowEmergencyModal(true); setFabOpen(false) }}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-red-600 hover:bg-red-750 text-white rounded-xl shadow-elevated text-xs font-bold whitespace-nowrap active:scale-95 transition-transform"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Emergency Help
                </motion.button>
              </div>
            )}
          </AnimatePresence>

          {/* Main FAB Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFabOpen(!fabOpen)}
            className={cn(
              'p-4 rounded-2xl shadow-elevated text-white flex items-center justify-center transition-all focus:outline-none',
              fabOpen
                ? 'bg-gray-800 dark:bg-gray-700 rotate-45'
                : 'bg-gradient-to-tr from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700'
            )}
            aria-label="Toggle actions menu"
          >
            {fabOpen ? <X className="w-6 h-6" /> : <LifeBuoy className="w-6 h-6 animate-pulse-slow" />}
          </motion.button>
        </div>
      </div>

      {/* Emergency Hotline Modal */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEmergencyModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-elevated border border-red-100 dark:border-red-950/30 text-center relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600" />
              
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100 dark:border-red-900/20">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-gray-950 dark:text-white mb-2">Emergency Assistance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                If you are experiencing a life-threatening medical situation, please call our local medical emergency lines below immediately.
              </p>

              <div className="space-y-3.5 mb-6 text-left">
                <a
                  href="tel:108"
                  className="flex items-center justify-between p-4 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/45 border border-red-100 dark:border-red-900/25 rounded-2xl transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-red-650 dark:text-red-400 font-bold uppercase tracking-wider">National Health Dispatch</p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">Dial 108</p>
                  </div>
                  <div className="p-3 bg-red-600 text-white rounded-xl group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4 fill-white" />
                  </div>
                </a>

                <a
                  href="tel:102"
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-850/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-150/60 dark:border-gray-700/60 rounded-2xl transition-colors group cursor-pointer"
                >
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Ambulance Service</p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">Dial 102</p>
                  </div>
                  <div className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                </a>
              </div>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-semibold rounded-xl text-sm transition-colors"
              >
                Close Emergency panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
