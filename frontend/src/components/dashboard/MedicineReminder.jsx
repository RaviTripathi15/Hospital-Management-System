import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, Sun, Sunset, Moon, CheckCircle2, Circle, Activity, AlertCircle, Info, Calendar } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'

export default function MedicineReminder({ prescriptions = [] }) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('morning')
  const [takenStatus, setTakenStatus] = useState({})
  
  const todayStr = new Date().toISOString().split('T')[0]
  const userKey = user?.email || 'guest'

  // Helper to load taken status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`med_reminder_${userKey}_${todayStr}`)
    if (saved) {
      try {
        setTakenStatus(JSON.parse(saved))
      } catch (e) {
        console.error("Error parsing medication reminder status", e)
      }
    }
  }, [userKey, todayStr])

  // Helper to save taken status
  const toggleTaken = (medName, slot) => {
    const key = `${medName}_${slot}`
    const updated = {
      ...takenStatus,
      [key]: !takenStatus[key]
    }
    setTakenStatus(updated)
    localStorage.setItem(`med_reminder_${userKey}_${todayStr}`, JSON.stringify(updated))
  }

  // Classify medicines dynamically based on keywords in name, dosage, or instructions
  const classifyMeds = (list) => {
    const morning = []
    const afternoon = []
    const night = []

    list.forEach((med) => {
      const text = `${med.medicine || med.name || ''} ${med.instructions || ''} ${med.dosage || ''}`.toLowerCase()
      let classified = false

      // Morning keywords
      if (
        text.includes('morning') ||
        text.includes('breakfast') ||
        text.includes('am') ||
        text.includes('daily') ||
        text.includes('once daily') ||
        text.includes('twice daily') ||
        text.includes('thrice daily') ||
        text.includes('1-0-1') ||
        text.includes('1-1-1') ||
        text.includes('1-0-0')
      ) {
        morning.push(med)
        classified = true
      }

      // Afternoon keywords
      if (
        text.includes('afternoon') ||
        text.includes('lunch') ||
        text.includes('noon') ||
        text.includes('thrice daily') ||
        text.includes('1-1-1') ||
        text.includes('0-1-0')
      ) {
        afternoon.push(med)
        classified = true
      }

      // Night keywords
      if (
        text.includes('night') ||
        text.includes('dinner') ||
        text.includes('pm') ||
        text.includes('sleep') ||
        text.includes('twice daily') ||
        text.includes('thrice daily') ||
        text.includes('1-0-1') ||
        text.includes('1-1-1') ||
        text.includes('0-0-1') ||
        text.includes('bedtime')
      ) {
        night.push(med)
        classified = true
      }

      // Default fallback
      if (!classified) {
        morning.push(med)
      }
    })

    return { morning, afternoon, night }
  }

  // If no prescriptions are supplied, we can display a clean empty state
  const { morning, afternoon, night } = classifyMeds(prescriptions)
  
  // Total schedules count
  const morningCount = morning.length
  const afternoonCount = afternoon.length
  const nightCount = night.length
  const totalDosesCount = morningCount + afternoonCount + nightCount

  // Count taken doses
  const getTakenCount = () => {
    let count = 0
    morning.forEach(med => { if (takenStatus[`${med.medicine || med.name}_morning`]) count++ })
    afternoon.forEach(med => { if (takenStatus[`${med.medicine || med.name}_afternoon`]) count++ })
    night.forEach(med => { if (takenStatus[`${med.medicine || med.name}_night`]) count++ })
    return count
  }
  const takenCount = getTakenCount()
  const completionPercentage = totalDosesCount > 0 ? Math.round((takenCount / totalDosesCount) * 100) : 0

  const getMedsForActiveTab = () => {
    switch (activeTab) {
      case 'morning': return { list: morning, slot: 'morning', label: 'Morning', icon: Sun, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
      case 'afternoon': return { list: afternoon, slot: 'afternoon', label: 'Afternoon', icon: Sunset, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' }
      case 'night': return { list: night, slot: 'night', label: 'Night', icon: Moon, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' }
      default: return { list: morning, slot: 'morning', label: 'Morning', icon: Sun, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
    }
  }

  const activeMeds = getMedsForActiveTab()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[360px] relative overflow-hidden group">
      {/* Glow overlay */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-indigo-550 dark:text-indigo-400" />
              Daily Medicine Reminders
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track and check off your active doses.</p>
          </div>
          {totalDosesCount > 0 && (
            <span className="text-[10px] font-extrabold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-100/30">
              {takenCount}/{totalDosesCount} Taken
            </span>
          )}
        </div>

        {totalDosesCount === 0 ? (
          /* Attractive Empty State */
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-gray-200 dark:border-gray-750 rounded-2xl bg-gray-50/25 dark:bg-gray-900/5 mt-2">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-550 dark:text-indigo-450 rounded-full flex items-center justify-center mb-3 border border-indigo-100/50">
              <Calendar className="w-6 h-6 animate-pulse" style={{ animationDuration: '4s' }} />
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">No Reminders Scheduled</h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-[240px] leading-relaxed">
              Your clinician has not logged any active prescriptions in your profile, or your medication course is completed.
            </p>
            <div className="mt-4 p-2.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/20 rounded-xl max-w-[280px]">
              <p className="text-[10px] text-blue-650 dark:text-blue-400 leading-normal flex items-start gap-1.5 text-left font-medium">
                <Info className="w-3.5 h-3.5 shrink-0 text-blue-500 mt-0.5" />
                If you have a physical prescription, ask your PHC clinic staff to register it to sync with your portal.
              </p>
            </div>
          </div>
        ) : (
          /* Active Schedule State */
          <div className="space-y-4">
            
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <span>Dose Progress</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{completionPercentage}% Completed</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden relative border border-gray-150/20 dark:border-gray-800/30">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Time Slots Filters Tabs */}
            <div className="grid grid-cols-3 gap-2 border-b border-gray-100 dark:border-gray-700/50 pb-3">
              {[
                { id: 'morning', label: 'Morning', icon: Sun, count: morningCount },
                { id: 'afternoon', label: 'Afternoon', icon: Sunset, count: afternoonCount },
                { id: 'night', label: 'Night', icon: Moon, count: nightCount }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  data-state={activeTab === tab.id ? 'active' : 'inactive'}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer relative opacity-100",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20 dark:bg-indigo-600 dark:text-white dark:border-indigo-500 dark:ring-indigo-400/30"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white dark:border-slate-700 dark:hover:border-slate-600"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white animate-bounce-slow" : "text-slate-500 dark:text-slate-300")} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center border",
                      activeTab === tab.id
                        ? "bg-white text-indigo-600 border-indigo-600"
                        : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-150/40"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Medicine List */}
            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeMeds.list.length === 0 ? (
                  <motion.div
                    key="empty-tab"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="py-6 text-center text-xs text-gray-450 dark:text-gray-500 italic"
                  >
                    No medications scheduled for this time.
                  </motion.div>
                ) : (
                  activeMeds.list.map((med, index) => {
                    const isTaken = !!takenStatus[`${med.medicine || med.name}_${activeMeds.slot}`]
                    return (
                      <motion.div
                        key={`${med.medicine || med.name}_${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleTaken(med.medicine || med.name, activeMeds.slot)}
                        className={cn(
                          "p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 active:scale-[0.99] select-none",
                          isTaken
                            ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                            : "bg-gray-50/50 hover:bg-gray-100 dark:bg-gray-850/20 border-gray-150/50 dark:border-gray-800/40 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isTaken ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-350 dark:text-gray-600 shrink-0 hover:text-indigo-500 transition-colors" />
                          )}
                          <div className="min-w-0">
                            <p className={cn(
                              "text-xs font-bold truncate",
                              isTaken && "line-through text-emerald-800/60 dark:text-emerald-400/50"
                            )}>
                              {med.medicine || med.name}
                            </p>
                            <p className="text-[10px] text-gray-450 dark:text-gray-500 truncate mt-0.5">
                              {med.instructions || med.dosage}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "badge text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0",
                          isTaken
                            ? "bg-emerald-100/50 dark:bg-emerald-950/40 text-emerald-700"
                            : "bg-amber-100/50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500"
                        )}>
                          {isTaken ? 'Taken' : 'Due'}
                        </span>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </div>

      {/* Advice warning footer */}
      {totalDosesCount > 0 && (
        <div className="text-[9px] font-medium text-gray-400 dark:text-gray-550 border-t border-gray-100 dark:border-gray-700/50 pt-2.5 text-center mt-2 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500/80" />
          <span>Follow physician instructions. Do not double doses.</span>
        </div>
      )}
    </div>
  )
}
