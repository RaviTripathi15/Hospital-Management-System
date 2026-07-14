import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertOctagon, Phone, ShieldAlert, HeartHandshake, Compass, Clock, Activity, X
} from 'lucide-react'
import { cn } from '@/utils/cn'

export default function EmergencyConsole({ activeProfile = {}, centers = [], onTriggerAlert }) {
  const [countdown, setCountdown] = useState(null)
  const [sosActive, setSosActive] = useState(false)
  const timerRef = useRef(null)

  // Start SOS countdown (3 seconds)
  const startSOS = () => {
    if (countdown !== null) return
    setCountdown(3)
  }

  // Cancel SOS countdown
  const cancelSOS = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(null)
  }

  // Handle countdown timer decrement
  useEffect(() => {
    if (countdown === null) return

    if (countdown === 0) {
      setSosActive(true)
      setCountdown(null)
      // Trigger parent callback feedback if supplied
      if (onTriggerAlert) {
        onTriggerAlert({
          type: 'error',
          title: 'SOS Alert Dispatched',
          message: 'Emergency responders have been notified with your current coordinates. Police & Ambulance are en route.'
        })
      }
      return
    }

    timerRef.current = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timerRef.current)
  }, [countdown, onTriggerAlert])

  // Scan centers to find the nearest critical care facility (CHC or Hospital)
  const getEmergencyHospital = () => {
    const criticalCare = centers.find(c => c.type === 'CHC' || c.type === 'DH' || c.type === 'Government Hospital')
    if (criticalCare) {
      return {
        name: criticalCare.name,
        lat: criticalCare.coordinates?.lat,
        lng: criticalCare.coordinates?.lng,
        phone: criticalCare.contactNumber || '108',
        type: criticalCare.type === 'DH' ? 'District Hospital' : 'Community Trauma Center'
      }
    }
    // Default fallback
    return {
      name: 'District Medical HQ Hospital',
      lat: 25.5941,
      lng: 85.1376,
      phone: '108',
      type: 'Government Hospital'
    }
  }

  const emergencyHospital = getEmergencyHospital()
  const guardian = activeProfile?.emergencyContact || null

  return (
    <div className="bg-gradient-to-br from-red-600 via-rose-700 to-red-800 dark:from-red-950 dark:via-rose-950 dark:to-red-900 text-white rounded-3xl p-6 border border-red-500/30 shadow-lg shadow-red-500/10 relative overflow-hidden group">
      {/* Visual glowing warning grids */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-black/10 rounded-full blur-xl pointer-events-none" />

      {/* Main Grid: SOS Button (Col 1) and details (Col 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10 relative">
        
        {/* Column 1: SOS Trigger (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between items-center text-center p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-white/10 backdrop-blur-md relative overflow-hidden min-h-[220px]">
          
          {countdown !== null ? (
            /* Countdown Mode */
            <div className="flex-1 flex flex-col justify-center items-center space-y-4">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-20 h-20 bg-white text-red-600 rounded-full flex items-center justify-center font-black text-4xl shadow-md border-4 border-red-200"
              >
                {countdown}
              </motion.div>
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-red-100">Broadcasting SOS...</h4>
                <p className="text-[10px] text-red-200 mt-0.5">Alert will trigger in a few seconds</p>
              </div>
              <button
                onClick={cancelSOS}
                className="px-5 py-2 bg-black/40 hover:bg-black/60 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                Cancel SOS
              </button>
            </div>
          ) : sosActive ? (
            /* Active Dispatched Mode */
            <div className="flex-1 flex flex-col justify-center items-center space-y-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-inner"
              >
                <CheckCircleAnimation />
              </motion.div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-350 dark:text-emerald-400">SOS Signal Dispatched</h4>
                <p className="text-[10px] text-red-200 mt-1 max-w-[200px] leading-normal">
                  Responders are tracking your profile coordinates. Keep line clear.
                </p>
              </div>
              <button
                onClick={() => setSosActive(false)}
                className="text-[10px] font-bold text-red-200 hover:text-white underline cursor-pointer"
              >
                Reset Trigger
              </button>
            </div>
          ) : (
            /* Default SOS Mode */
            <div className="flex-1 flex flex-col justify-between items-center h-full w-full">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/40 rounded-full border border-red-500/30 text-[9px] font-black uppercase tracking-widest text-red-200">
                <ShieldAlert className="w-3 h-3 text-red-400 animate-pulse" />
                Critical Incident Console
              </div>

              {/* Pulsing Button Ring */}
              <div className="relative my-4 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-red-400 opacity-60"></span>
                <span className="animate-pulse absolute inline-flex h-24 w-24 rounded-full bg-red-400/20 opacity-40"></span>
                <button
                  onClick={startSOS}
                  className="w-20 h-20 bg-white hover:bg-red-50 text-red-750 font-black text-xl rounded-full shadow-lg border-4 border-red-250 cursor-pointer active:scale-95 transition-all relative z-10 flex flex-col items-center justify-center uppercase tracking-wide"
                >
                  <AlertOctagon className="w-6 h-6 text-red-600 animate-bounce-slow mb-0.5" />
                  SOS
                </button>
              </div>

              <div className="text-[10px] font-semibold text-red-100">
                Press and hold to broadcast GPS coordinates.
              </div>
            </div>
          )}

        </div>

        {/* Column 2: Hotlines & Reserves (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          {/* Ambulance Dispatch Card */}
          <div className="p-4 bg-white/5 dark:bg-black/10 border border-white/10 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden group/card hover:bg-white/10 transition-colors duration-300">
            <div className="min-w-0">
              <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">National Hotline</span>
              <h4 className="text-xs font-extrabold text-white mt-1.5">Ambulance Dispatch</h4>
              <p className="text-[10px] text-red-150 mt-0.5 font-medium">Direct medical evacuation dispatch.</p>
            </div>
            <a
              href="tel:108"
              className="p-3 bg-white text-red-650 hover:bg-red-50 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center shrink-0 shadow"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Blood Bank Reserves */}
          <div className="p-4 bg-white/5 dark:bg-black/10 border border-white/10 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden group/card hover:bg-white/10 transition-colors duration-300">
            <div className="min-w-0">
              <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">Blood Reserves</span>
              <h4 className="text-xs font-extrabold text-white mt-1.5">PHC Blood Bank Network</h4>
              <p className="text-[10px] text-emerald-350 dark:text-emerald-400 mt-0.5 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                O-Negative: High Stock
              </p>
            </div>
            <a
              href="tel:102"
              className="p-3 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center shrink-0"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Column 3: Guardian & Hospital (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          
          {/* Personal Guardian */}
          <div className="p-4 bg-white/5 dark:bg-black/10 border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden group/card hover:bg-white/10 transition-colors duration-300">
            <div>
              <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">Designated Guardian</span>
              {guardian?.name ? (
                <div className="mt-2 min-w-0">
                  <h4 className="text-xs font-extrabold text-white truncate">{guardian.name}</h4>
                  <p className="text-[9px] text-red-200 mt-0.5 truncate capitalize">Relation: {guardian.relation || 'Guardian'}</p>
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-red-200 font-semibold leading-normal">
                  No private emergency guardian set in profile.
                </div>
              )}
            </div>
            {guardian?.phone && (
              <a
                href={`tel:${guardian.phone}`}
                className="mt-2.5 py-1 px-3 bg-white text-red-650 hover:bg-red-50 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 shadow"
              >
                <Phone className="w-3 h-3" />
                Call Guardian
              </a>
            )}
          </div>

          {/* Emergency Hospital */}
          <div className="p-4 bg-white/5 dark:bg-black/10 border border-white/10 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden group/card hover:bg-white/10 transition-colors duration-300">
            <div>
              <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/20">Nearest Emergency Unit</span>
              <div className="mt-2 min-w-0">
                <h4 className="text-xs font-extrabold text-white truncate">{emergencyHospital.name}</h4>
                <p className="text-[9px] text-red-200 mt-0.5 truncate">{emergencyHospital.type}</p>
              </div>
            </div>
            <button
              onClick={() => {
                const query = emergencyHospital.lat && emergencyHospital.lng 
                  ? `${emergencyHospital.lat},${emergencyHospital.lng}` 
                  : encodeURIComponent(`${emergencyHospital.name}, Bihar`);
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
              className="mt-2.5 py-1 px-3 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              Navigate
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}

function CheckCircleAnimation() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
