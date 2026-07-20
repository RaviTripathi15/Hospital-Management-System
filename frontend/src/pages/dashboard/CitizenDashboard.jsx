import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, FileText, Building2, Bell, Pill, Activity, Plus, PhoneCall,
  Heart, Download, User, ArrowRight, ClipboardList, Info, HelpCircle,
  Sparkles, Clock, ArrowUp
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import appointmentService from '@/services/appointmentService'
import reportService from '@/services/reportService'
import healthCenterService from '@/services/healthCenterService'
import patientService from '@/services/patientService'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import FeedbackOverlay from '@/components/ui/FeedbackOverlay'
import { cn } from '@/utils/cn'
import AIHealthAssistant from '@/components/dashboard/AIHealthAssistant'
import MedicineReminder from '@/components/dashboard/MedicineReminder'
import HealthAnalytics from '@/components/dashboard/HealthAnalytics'
import MedicalRecords from '@/components/dashboard/MedicalRecords'
import NearbyHealthCenters from '@/components/dashboard/NearbyHealthCenters'
import GovernmentSchemes from '@/components/dashboard/GovernmentSchemes'
import FamilyProfiles from '@/components/dashboard/FamilyProfiles'
import EmergencyConsole from '@/components/dashboard/EmergencyConsole'
import NotificationCenter from '@/components/dashboard/NotificationCenter'

// Rotating healthy tips
const HEALTH_TIPS = [
  "Stay hydrated! Aim for at least 8-10 glasses of water daily.",
  "A 30-minute daily walk can drastically improve cardiovascular health.",
  "Ensure you get 7-8 hours of quality sleep for physical restoration.",
  "Include colorful vegetables in your meals for rich antioxidants.",
  "Practice mindful breathing for 5 minutes to alleviate stress levels.",
  "Remember to rest your eyes if you work on computers (20-20-20 rule)."
]

export default function CitizenDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { notifications, unreadCount } = useNotificationStore()
  const navigate = useNavigate()

  // Local state
  const [loading, setLoading] = useState(true)
  const [liveTime, setLiveTime] = useState(new Date())
  const [tipIndex, setTipIndex] = useState(0)
  const [showVitalsModal, setShowVitalsModal] = useState(false)
  const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' })
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // Active patient profile tracking
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [localProfiles, setLocalProfiles] = useState(() => {
    const saved = localStorage.getItem(`local_profiles_${user?.email || 'guest'}`)
    return saved ? JSON.parse(saved) : []
  })

  const handleUpdateLocalProfiles = (updatedList) => {
    setLocalProfiles(updatedList)
    localStorage.setItem(`local_profiles_${user?.email || 'guest'}`, JSON.stringify(updatedList))
  }

  // API Fetched States
  const [apiData, setApiData] = useState({
    appointments: [],
    reports: [],
    centersCount: 0,
    medicinesCount: 2, // Default mock count for medicines due
    profiles: [],
    centers: []
  })

  // Determine currently selected patient profile
  const activeProfile = apiData.profiles?.find(p => p._id === activeProfileId) 
    || localProfiles.find(p => p._id === activeProfileId)
    || apiData.profiles?.[0]
    || null

  // Vitals state (loaded from localstorage or defaults)
  const [vitals, setVitals] = useState({
    weight: 70, // kg
    height: 175, // cm
    sys: 120, // systolic
    dia: 80, // diastolic
    pulse: 72, // bpm
    spo2: 98, // oxygen
    vaccines: [
      { name: 'COVID-19 Booster', date: '2025-11-10', status: 'Completed' },
      { name: 'Influenza (Flu)', date: '2026-02-15', status: 'Completed' },
      { name: 'Tetanus Toxoid', date: '2024-05-20', status: 'Completed' },
      { name: 'Hepatitis B', date: 'Pending', status: 'Due' },
    ]
  })

  // Vitals Form State
  const [vitalsForm, setVitalsForm] = useState({
    weight: 70,
    height: 175,
    sys: 120,
    dia: 80,
    pulse: 72,
    spo2: 98
  })

  // Live Digital Clock & Rotating Tips
  useEffect(() => {
    const clockTimer = setInterval(() => setLiveTime(new Date()), 1000)
    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HEALTH_TIPS.length)
    }, 10000)
    return () => {
      clearInterval(clockTimer)
      clearInterval(tipTimer)
    }
  }, [])

  // Track scroll position for Back to Top Button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Load Vitals from LocalStorage for active profile
  useEffect(() => {
    const storageKey = activeProfile ? `vitals_${activeProfile._id}` : `vitals_${user?.email || 'guest'}`
    const savedVitals = localStorage.getItem(storageKey)
    if (savedVitals) {
      try {
        const parsed = JSON.parse(savedVitals)
        setVitals(parsed)
        setVitalsForm({
          weight: parsed.weight || 70,
          height: parsed.height || 175,
          sys: parsed.sys || 120,
          dia: parsed.dia || 80,
          pulse: parsed.pulse || 72,
          spo2: parsed.spo2 || 98
        })
      } catch (e) {
        console.error("Error parsing saved vitals", e)
      }
    } else {
      // Default initial checklist values if none stored
      const defaults = {
        weight: 70,
        height: 175,
        sys: 120,
        dia: 80,
        pulse: 72,
        spo2: 98,
        vaccines: [
          { name: 'COVID-19 Booster', date: '2025-11-10', status: 'Completed' },
          { name: 'Influenza (Flu)', date: '2026-02-15', status: 'Completed' },
          { name: 'Tetanus Toxoid', date: '2024-05-20', status: 'Completed' },
          { name: 'Hepatitis B', date: 'Pending', status: 'Due' },
        ]
      }
      setVitals(defaults)
      setVitalsForm({
        weight: 70,
        height: 175,
        sys: 120,
        dia: 80,
        pulse: 72,
        spo2: 98
      })
    }
  }, [activeProfile, user])

  const fetchDashboardData = async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoading(true)
      const appointmentsRes = await appointmentService.getMyAppointments().catch(() => ({ appointments: [] }))
      const patientProfilesRes = await patientService.getMyProfile().catch(() => ({ data: [] }))
      const centersRes = await healthCenterService.getAll().catch(() => ({ healthCenters: [] }))

      // Extract list fields safely depending on API formats
      const appointmentsList = appointmentsRes.appointments || appointmentsRes.data || appointmentsRes || []
      const centersList = centersRes.healthCenters || centersRes.data || centersRes || []

      // Aggregate medical history visits across all patient profiles linked to user's phone
      const profiles = patientProfilesRes.data || patientProfilesRes || []
      const reportsList = []
      if (Array.isArray(profiles)) {
        profiles.forEach(profile => {
          if (profile.medicalHistory && Array.isArray(profile.medicalHistory)) {
            reportsList.push(...profile.medicalHistory)
          }
        })
      }

      setApiData({
        appointments: appointmentsList,
        reports: reportsList,
        centersCount: centersList.length || 12,
        medicinesCount: 2,
        profiles: profiles,
        centers: centersList
      })
    } catch (err) {
      console.error("Error fetching dashboard statistics", err)
    } finally {
      if (showSkeleton) {
        setTimeout(() => setLoading(false), 800)
      }
    }
  }

  // Fetch API Stats
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return
    try {
      await appointmentService.cancel(apptId, "Cancelled by citizen via dashboard")
      // Re-fetch dashboard data without showing skeleton to maintain scroll position
      await fetchDashboardData(false)
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Appointment Cancelled',
        message: 'Your scheduled appointment has been successfully cancelled.'
      })
    } catch (err) {
      console.error(err)
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Cancellation Failed',
        message: err.response?.data?.message || 'Something went wrong while cancelling the appointment.'
      })
    }
  }

  // Calculations
  const heightInMeters = vitals.height / 100
  const bmi = heightInMeters > 0 ? (vitals.weight / (heightInMeters * heightInMeters)).toFixed(1) : 0

  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' }
    if (val < 25) return { label: 'Normal Weight', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' }
    if (val < 30) return { label: 'Overweight', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' }
    return { label: 'Obese', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' }
  }
  const bmiCat = getBmiCategory(parseFloat(bmi))

  const getBpCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-500' }
    if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-amber-500' }
    if (sys < 140 || dia < 90) return { label: 'Stage 1 Hypertension', color: 'text-orange-500' }
    return { label: 'Stage 2 Hypertension', color: 'text-red-500' }
  }
  const bpCat = getBpCategory(vitals.sys, vitals.dia)

  // Calculate generic health score out of 100 based on vitals guidelines
  const calculateHealthScore = () => {
    let score = 100
    // BMI deduction
    const bmiVal = parseFloat(bmi)
    if (bmiVal < 18.5 || bmiVal >= 30) score -= 15
    else if (bmiVal >= 25) score -= 8

    // BP deduction
    if (vitals.sys >= 140 || vitals.dia >= 90) score -= 20
    else if (vitals.sys >= 130 || vitals.dia >= 80) score -= 10

    // Pulse deduction
    if (vitals.pulse < 60 || vitals.pulse > 100) score -= 10

    return score
  }
  const healthScore = calculateHealthScore()

  const handleUpdateVitals = (e) => {
    e.preventDefault()
    const updated = {
      ...vitals,
      weight: parseFloat(vitalsForm.weight),
      height: parseFloat(vitalsForm.height),
      sys: parseInt(vitalsForm.sys),
      dia: parseInt(vitalsForm.dia),
      pulse: parseInt(vitalsForm.pulse),
      spo2: parseInt(vitalsForm.spo2 || 98)
    }
    setVitals(updated)
    const storageKey = activeProfile ? `vitals_${activeProfile._id}` : `vitals_${user?.email || 'guest'}`
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setShowVitalsModal(false)

    setFeedback({
      isOpen: true,
      type: 'success',
      title: 'Metrics Updated Successfully',
      message: 'Your health records have been recalculated and synced successfully.'
    })
  }

  // Mock data for graphs
  const appointmentTrendData = [
    { name: 'Jan', visits: 1 },
    { name: 'Feb', visits: 0 },
    { name: 'Mar', visits: 2 },
    { name: 'Apr', visits: 1 },
    { name: 'May', visits: 3 },
    { name: 'Jun', visits: 2 },
    { name: 'Jul', visits: apiData.appointments.length || 1 }
  ]

  const healthActivityData = [
    { name: 'Mon', steps: 6200, calories: 310 },
    { name: 'Tue', steps: 8100, calories: 420 },
    { name: 'Wed', steps: 5900, calories: 290 },
    { name: 'Thu', steps: 9400, calories: 480 },
    { name: 'Fri', steps: 7200, calories: 360 },
    { name: 'Sat', steps: 11000, calories: 550 },
    { name: 'Sun', steps: 8500, calories: 410 }
  ]

  const monthlyVisitsData = [
    { name: 'PHC Clinic', count: 4 },
    { name: 'Dental Care', count: 1 },
    { name: 'Cardiology', count: 2 },
    { name: 'General Check', count: 5 }
  ]

  // Filter appointments
  const upcomingAppointments = apiData.appointments.filter(app => {
    const status = app.status ? app.status.toLowerCase() : 'scheduled'
    return status === 'scheduled' || status === 'confirmed' || status === 'pending'
  })

  // Dynamic calculations for cards
  const getActivePrescriptions = () => {
    if (!apiData.reports || apiData.reports.length === 0) return []
    const latestPrescriptionVisit = apiData.reports.find(visit => visit.prescription && visit.prescription.length > 0)
    return latestPrescriptionVisit ? latestPrescriptionVisit.prescription : []
  }
  const activePrescriptions = getActivePrescriptions()

  // Format greeting based on hours
  const getGreeting = () => {
    const hrs = liveTime.getHours()
    if (hrs < 12) return 'Good Morning'
    if (hrs < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getHealthStatus = (score) => {
    if (score >= 90) return { label: 'Optimal', desc: 'Excellent vitals', color: 'bg-emerald-500/20 text-emerald-450 border-emerald-500/30' }
    if (score >= 80) return { label: 'Good Status', desc: 'Normal health range', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    if (score >= 70) return { label: 'Fair Baseline', desc: 'Slight deviations', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' }
    return { label: 'Attention Due', desc: 'Checkups recommended', color: 'bg-red-500/20 text-red-500 border-red-500/30' }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-7xl mx-auto p-1">
        {/* Welcome Card and Health Score Circle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="lg:col-span-4 h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        </div>
        
        {/* Notifications and Quick Actions */}
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="h-28 bg-gray-200 dark:bg-gray-800 rounded-3xl" />

        {/* Family Profiles Console */}
        <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-3xl" />

        {/* Card Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-60 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="h-60 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          <div className="h-60 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="space-y-7"
    >
      
      {/* Top Welcome Panel & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Welcome Card & AI Tip of the Day (Left - spans lg:col-span-8) */}
        <div className="lg:col-span-8 bg-gradient-to-br from-indigo-900 via-slate-950 to-blue-950 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-950 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-elevated border border-indigo-500/10 flex flex-col justify-between min-h-[260px] animate-fade-in">
          {/* Glowing background shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4 md:max-w-[65%]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 dark:bg-slate-900/30 backdrop-blur-md rounded-full border border-white/10 text-emerald-400 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3 h-3 text-emerald-400 animate-bounce" />
                  Health Platform Active
                </div>
                <h1 className="text-2xl md:text-3.5xl font-black mt-1 tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Valued Citizen'}
                </h1>
                <p className="text-sm text-white/75 mt-1 font-medium">
                  Welcome to your digital health dashboard.
                </p>
              </div>

              {/* AI Health Tip Box */}
              <div className="bg-white/5 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/10 dark:border-white/5 relative overflow-hidden group shadow-soft hover:border-white/15 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-350 rounded-xl">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-emerald-350 dark:text-emerald-400 uppercase tracking-widest">AI Health Tip of the Day</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed mt-1 font-medium italic">
                      "{HEALTH_TIPS[tipIndex]}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Clock & Date Column */}
            <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-3 bg-white/5 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl md:rounded-none p-4 md:p-0 border border-white/10 md:border-none md:self-start md:text-right min-w-[180px] md:min-w-0">
              <div className="flex items-center gap-1.5 text-white/90">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold tracking-wider uppercase">Live Clock</span>
              </div>
              <div className="mt-1">
                <p className="text-2xl md:text-3xl font-extrabold font-mono tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] leading-none">
                  {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </p>
                <p className="text-[11px] text-white/70 mt-2 font-bold uppercase tracking-wider">
                  {liveTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Banner Action Buttons */}
          <div className="relative z-10 flex gap-3.5 mt-6 border-t border-white/10 pt-4 flex-wrap">
            <button
              onClick={() => setShowVitalsModal(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              <Activity className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Update Vitals
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold border border-white/15 transition-all active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              View Profile
            </button>
          </div>
        </div>

        {/* Health Score Card (Right - spans lg:col-span-4) */}
        {(() => {
          const status = getHealthStatus(healthScore);
          return (
            <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[260px] relative overflow-hidden group">
              {/* Glow overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500 animate-pulse" />
                    Overall Health
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Calculated from recent vitals.</p>
                </div>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider", status.color)}>
                  {status.label}
                </span>
              </div>

              {/* SVG Circular Progress Gauge & Score Display */}
              <div className="my-4 flex items-center justify-center gap-6">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Track Circle */}
                    <circle
                      className="text-gray-100 dark:text-gray-700/40"
                      strokeWidth="9"
                      stroke="currentColor"
                      fill="transparent"
                      r="38"
                      cx="50"
                      cy="50"
                    />
                    {/* Fill Circle */}
                    <circle
                      className="text-primary-500 transition-all duration-1000 ease-out"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 38}
                      strokeDashoffset={2 * Math.PI * 38 * (1 - healthScore / 100)}
                      strokeLinecap="round"
                      stroke="url(#healthScoreCircularGradient)"
                      fill="transparent"
                      r="38"
                      cx="50"
                      cy="50"
                    />
                    <defs>
                      <linearGradient id="healthScoreCircularGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" /> {/* Emerald */}
                        <stop offset="50%" stopColor="#3b82f6" /> {/* Blue */}
                        <stop offset="100%" stopColor="#6366f1" /> {/* Indigo */}
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{healthScore}</span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mt-1">/100</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">BMI: <strong className="font-extrabold text-gray-900 dark:text-white">{bmi}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">BP: <strong className="font-extrabold text-gray-900 dark:text-white">{vitals.sys}/{vitals.dia}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pulse: <strong className="font-extrabold text-gray-900 dark:text-white">{vitals.pulse}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                {status.desc} — keep tracking to maintain updates.
              </div>
            </div>
          );
        })()}

      </div>

      {/* Emergency Console Section */}
      <EmergencyConsole activeProfile={activeProfile} centers={apiData.centers} onTriggerAlert={setFeedback} />

      {/* Notifications Center Section */}
      <NotificationCenter />

      {/* Quick Actions Card Block (Full width or split) */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary-500" />
              Quick Actions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Access core health services and updates instantly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Book Appointment', icon: Calendar, color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/30 dark:text-primary-400 border-primary-200/50 dark:border-primary-900/30', path: '/appointments/book' },
            { label: 'Find Nearby PHC', icon: Building2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30', path: '/admin/centers' },
            { label: 'Medical Records', icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30', path: '/reports' },
            { label: 'Emergency Line', icon: PhoneCall, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30', action: 'emergency' },
            { label: 'Download Reports', icon: Download, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30', action: 'download' },
            { label: 'Update Profile', icon: User, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30', path: '/profile' }
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => {
                if (action.path) navigate(action.path)
                else if (action.action === 'emergency') {
                  setFeedback({ isOpen: true, type: 'error', title: 'Emergency Hotlines', message: 'National Dispatch: dial 108. Ambulance: dial 102. Reach out immediately!' })
                } else if (action.action === 'download') {
                  if (apiData.reports.length === 0) {
                    setFeedback({ isOpen: true, type: 'error', title: 'No Reports Found', message: 'You have no medical reports available for download at this time.' })
                  } else {
                    setFeedback({ isOpen: true, type: 'success', title: 'Downloads Started', message: 'The compilation of your digital health reports is downloading.' })
                  }
                }
              }}
              className={cn(
                "p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                action.color
              )}
            >
              <action.icon className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold leading-tight uppercase tracking-wider">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Family Profiles Section */}
      <FamilyProfiles 
        profiles={apiData.profiles} 
        activeProfileId={activeProfileId}
        onSwitchProfile={setActiveProfileId}
        localProfiles={localProfiles}
        onUpdateLocalProfiles={handleUpdateLocalProfiles}
      />

      {/* Interactive Health Console Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Upcoming Appointments */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">Appointments</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {upcomingAppointments.length > 0 ? (
                (() => {
                  const nextAppt = upcomingAppointments[0];
                  return (
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                        {nextAppt.doctor?.name ? `Dr. ${nextAppt.doctor.name}` : nextAppt.doctorName || 'General OPD'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {nextAppt.healthCenter?.name || 'Primary Clinic'}
                      </p>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/40 inline-block px-2 py-0.5 rounded-md mt-1">
                        {new Date(nextAppt.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {nextAppt.timeSlot}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-gray-400 dark:text-gray-500 italic">No scheduled visits</p>
                  <p className="text-xs text-gray-400">Need a medical checkup or consultation?</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{upcomingAppointments.length} upcoming</span>
            <button
              onClick={() => navigate('/appointments/book')}
              className="text-primary-600 hover:text-primary-750 dark:text-primary-450 font-extrabold hover:underline cursor-pointer"
            >
              + Book Visit
            </button>
          </div>
        </motion.div>

        {/* Card 2: Medical Reports */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Medical Records</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {apiData.reports.length > 0 ? (
                (() => {
                  const latestReport = apiData.reports[0];
                  return (
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                        Diagnosis: {latestReport.diagnosis || 'OPD Consultation'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {latestReport.healthCenter?.name || 'Clinic Visit'}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        Last visited: {new Date(latestReport.visitDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-gray-400 dark:text-gray-500 italic">No health history records</p>
                  <p className="text-xs text-gray-400">Your registered visits will display here.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{apiData.reports.length} visits total</span>
            <button
              onClick={() => {
                if (apiData.reports.length > 0) {
                  setFeedback({ isOpen: true, type: 'success', title: 'Downloads Started', message: 'Compiling and downloading your health reports.' })
                } else {
                  setFeedback({ isOpen: true, type: 'error', title: 'No Records', message: 'You do not have any digital medical records to download.' })
                }
              }}
              className="text-indigo-600 hover:text-indigo-750 dark:text-indigo-400 font-extrabold hover:underline cursor-pointer"
            >
              Download PDF
            </button>
          </div>
        </motion.div>

        {/* Card 3: Active Prescriptions */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md">Prescriptions</span>
              <div className="p-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <Pill className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              {activePrescriptions.length > 0 ? (
                <div className="space-y-1.5 max-h-[70px] overflow-y-auto pr-1">
                  {activePrescriptions.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.medicine}</span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded text-center">{item.dosage}</span>
                    </div>
                  ))}
                  {activePrescriptions.length > 2 && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-right">+{activePrescriptions.length - 2} more medicines</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-emerald-550 dark:text-emerald-450 italic flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    No active prescriptions
                  </p>
                  <p className="text-xs text-gray-400">All medications completed or none active.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{activePrescriptions.length} items total</span>
            <span className="text-red-550 dark:text-red-450 font-bold text-[10px]">Follow dosage</span>
          </div>
        </motion.div>

        {/* Card 4: Nearby PHCs */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">Nearby PHCs</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {apiData.centers && apiData.centers.length > 0 ? (
                <div className="space-y-2">
                  {apiData.centers.slice(0, 2).map((center, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{center.name}</p>
                        <p className="text-[10px] text-gray-450 dark:text-gray-500 truncate">{center.district} district • {center.type}</p>
                      </div>
                      {center.contactNumber && (
                        <a
                          href={`tel:${center.contactNumber}`}
                          className="p-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[10px] font-bold shrink-0 transition-colors"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-gray-400 dark:text-gray-500 italic">No health centers listed</p>
                  <p className="text-xs text-gray-400">Search for centers in the navigation options.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{apiData.centersCount} centers active</span>
            <button
              onClick={() => navigate('/admin/centers')}
              className="text-emerald-600 hover:text-emerald-750 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
            >
              See All Centers
            </button>
          </div>
        </motion.div>

        {/* Card 5: Notifications & Alerts */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-450 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">Alerts & Info</span>
              <div className="relative p-2 bg-amber-500/10 text-amber-650 dark:text-amber-450 rounded-xl">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
                )}
              </div>
            </div>
            <div className="mt-4">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs min-w-0">
                      <span className="w-1.5 h-1.5 bg-amber-450 rounded-full mt-1.5 shrink-0" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 leading-tight">
                        {item.title}: <span className="font-normal text-gray-500 dark:text-gray-400">{item.message}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-gray-400 dark:text-gray-500 italic">No new notifications</p>
                  <p className="text-xs text-gray-400">You are all caught up for the day!</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">{unreadCount} unread alerts</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">Realtime updates</span>
          </div>
        </motion.div>

        {/* Card 6: Emergency Contacts */}
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-red-200/50 dark:border-red-900/30 shadow-soft flex flex-col justify-between min-h-[175px] relative overflow-hidden group animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-md">Emergency Info</span>
              <div className="p-2 bg-red-500/10 text-red-650 dark:text-red-400 rounded-xl">
                <PhoneCall className="w-5 h-5 text-red-600 dark:text-red-450" />
              </div>
            </div>
            <div className="mt-4">
              {activeProfile?.emergencyContact?.name ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-505 dark:text-gray-400 uppercase tracking-wider">Designated Guardian</p>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">
                    {activeProfile.emergencyContact.name} ({activeProfile.emergencyContact.relation || 'Relation'})
                  </p>
                  <a
                    href={`tel:${activeProfile.emergencyContact.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-red-650 dark:text-red-450 font-extrabold mt-1.5 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <PhoneCall className="w-3 h-3" />
                    Call: {activeProfile.emergencyContact.phone}
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold leading-tight">No private emergency guardian set in profile.</p>
                  <div className="flex gap-2">
                    <a
                      href="tel:108"
                      className="flex-1 py-1.5 text-center bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors"
                    >
                      Ambulance (108)
                    </a>
                    <a
                      href="tel:102"
                      className="flex-1 py-1.5 text-center bg-indigo-650 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Dispatch (102)
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
            <span className="text-red-550 dark:text-red-400 font-bold uppercase tracking-wider text-[9px] animate-pulse">Hotline Active</span>
            <button
              onClick={() => setFeedback({ isOpen: true, type: 'error', title: 'Emergency Dispatch', message: 'For medical evacuation call 108. For national medical queries call 102. Available 24/7!' })}
              className="text-red-600 hover:text-red-750 dark:text-red-400 font-extrabold hover:underline cursor-pointer"
            >
              Info Hotlines
            </button>
          </div>
        </motion.div>

      </div>      {/* Vitals Overview & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Health Analytics Dashboard (Left 8 cols) */}
        <div className="lg:col-span-8">
          <HealthAnalytics vitals={vitals} onUpdateClick={() => setShowVitalsModal(true)} />
        </div>
        
        {/* Vaccination Status & Activity Stats (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Vaccination Check list */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
            <div className="mb-4">
              <h3 className="text-base font-bold text-gray-950 dark:text-white">Vaccination Status</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your immunization schedule logs.</p>
            </div>
            <div className="space-y-3">
              {vitals.vaccines.map((vac, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-3.5 bg-gray-50/50 dark:bg-gray-850/20 border border-gray-150/45 dark:border-gray-800/30 rounded-2xl">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{vac.name}</span>
                  <span className={cn(
                    "badge text-[9px] font-extrabold px-2 py-0.5 rounded-full leading-none",
                    vac.status === 'Completed'
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450"
                  )}>
                    {vac.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Score Summary Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-1">Health Score</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Vitals wellness metric classification.</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-550 dark:text-indigo-400 rounded-full flex items-center justify-center font-black text-lg border border-indigo-100/40">
                {healthScore}
              </div>
              <div>
                <span className={cn("inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border", getHealthStatus(healthScore).color)}>
                  {getHealthStatus(healthScore).label}
                </span>
                <p className="text-[10px] text-gray-455 mt-1 font-semibold leading-tight">{getHealthStatus(healthScore).desc}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Activities & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Appointments (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-950 dark:text-white">Recent Appointments</h3>
              <p className="text-xs text-gray-505 dark:text-gray-400">View details and status of scheduled visits.</p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-[11px] font-bold text-primary-600 hover:text-primary-750 dark:text-primary-400 hover:underline flex items-center gap-0.5"
            >
              See All Appointments
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">No Upcoming Appointments</p>
              <p className="text-xs text-gray-450 dark:text-gray-500 mt-0.5">Need a consultation? Book one right now.</p>
              <button
                onClick={() => navigate('/appointments/book')}
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm animate-fade-in"
              >
                Schedule First Visit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
              {upcomingAppointments.slice(0, 4).map((app, idx) => {
                const docName = app.doctor?.userId 
                  ? `Dr. ${app.doctor.userId.firstName} ${app.doctor.userId.lastName}` 
                  : app.doctorName || 'General OPD Staff'
                const centerName = app.center?.name || 'Primary Health Center'
                const isConfirmed = app.status === 'confirmed' || app.status === 'completed'
                const isCancelled = app.status === 'cancelled'
                
                return (
                  <motion.div
                    key={app._id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -2, scale: 1.005 }}
                    className="p-5 bg-gray-50/40 dark:bg-gray-850/15 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex flex-col justify-between min-h-[180px] relative overflow-hidden group shadow-sm hover:shadow transition-all duration-300"
                  >
                    {/* Background glow visual */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
                    
                    <div>
                      {/* Card Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-gray-905 dark:text-white truncate">
                            {docName}
                          </p>
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md border border-indigo-100/10 mt-1">
                            {app.specialty || 'General Consultation'}
                          </span>
                        </div>
                        <span className={cn(
                          "badge text-[9px] font-black px-2.5 py-1 rounded-full capitalize shrink-0 border flex items-center gap-1 leading-none",
                          isConfirmed
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : isCancelled
                              ? "bg-red-50 text-red-600 border-red-100/30 dark:bg-red-950/20 dark:text-red-450"
                              : "bg-blue-50 text-blue-600 border-blue-100/30 dark:bg-blue-950/20 dark:text-blue-450"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            isConfirmed ? "bg-emerald-500 animate-pulse" : isCancelled ? "bg-red-500" : "bg-blue-500 animate-ping"
                          )} />
                          {app.status || 'scheduled'}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="mt-4 space-y-2 border-t border-gray-100/60 dark:border-gray-800/20 pt-3 text-xs text-gray-600 dark:text-gray-400">
                        <p className="flex items-center gap-2 font-medium">
                          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                          <span className="truncate">{centerName}</span>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1 font-semibold">
                          <p className="flex items-center gap-1.5 text-gray-800 dark:text-gray-250">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                            <span>{app.date ? new Date(app.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-gray-800 dark:text-gray-250">
                            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                            <span>{app.timeSlot || 'Anytime'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer / Buttons */}
                    <div className="flex gap-2 mt-5 pt-3.5 border-t border-gray-100/50 dark:border-gray-800/10">
                      <button
                        onClick={() => navigate('/appointments')}
                        className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-indigo-100/30 cursor-pointer active:scale-95 text-center"
                      >
                        View
                      </button>
                      
                      {!isCancelled && (
                        <>
                          <button
                            onClick={() => navigate('/appointments/book', { state: { rescheduleApptId: app._id } })}
                            className="flex-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/60 text-gray-650 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-gray-150/45 dark:border-gray-750/30 cursor-pointer active:scale-95 text-center"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(app._id)}
                            className="py-1.5 px-3 text-red-600 hover:text-red-750 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/10 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer active:scale-95 text-center"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Latest Prescriptions & Medicines (Right 4 cols) */}
        <div className="lg:col-span-4">
          <MedicineReminder prescriptions={activePrescriptions} />
        </div>

      </div>

      {/* Medical Records Section */}
      <MedicalRecords reports={apiData.reports} userName={activeProfile?.name || user?.name} />

      {/* Nearby Health Centers Section */}
      <NearbyHealthCenters centers={apiData.centers} />

      {/* Government Health Schemes Section */}
      <GovernmentSchemes userName={activeProfile?.name || user?.name} onApplyFeedback={setFeedback} />

      {/* Live Vitals Modal Dialog */}
      <AnimatePresence>
        {showVitalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVitalsModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            {/* Modal Dialog Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-elevated border border-gray-150/60 dark:border-gray-700/60 relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-emerald-500" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-950 dark:text-white">Update Medical Vitals</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Recalculate BMI, Health Score and health ranges.</p>
                </div>
                <button
                  onClick={() => setShowVitalsModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateVitals} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={vitalsForm.weight}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Height (cm)</label>
                    <input
                      type="number"
                      required
                      value={vitalsForm.height}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={vitalsForm.sys}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, sys: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      required
                      value={vitalsForm.dia}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, dia: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      required
                      value={vitalsForm.pulse}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Oxygen Saturation (SPO2 %)</label>
                    <input
                      type="number"
                      required
                      min="70"
                      max="100"
                      value={vitalsForm.spo2}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowVitalsModal(false)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl text-xs transition-colors border border-gray-150/40 dark:border-gray-700/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-primary-500/10 active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SVG Success/Error Animation Feedback */}
      <FeedbackOverlay
        isOpen={feedback.isOpen}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
      />

      {/* Floating Action Button (FAB) & Back to Top */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
        {/* Back to Top */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={scrollToTop}
              type="button"
              className="p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full border border-gray-250 dark:border-gray-700 shadow-elevated cursor-pointer hover:shadow-hover active:scale-95 transition-all"
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Dynamic FAB Menu */}
        <div className="relative">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                className="absolute bottom-16 right-0 bg-white/95 dark:bg-gray-905/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/50 dark:border-gray-700/50 shadow-elevated w-48 space-y-2 text-right flex flex-col items-end"
              >
                <button
                  onClick={() => { setFabOpen(false); setShowVitalsModal(true); }}
                  type="button"
                  className="w-full py-1.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-extrabold rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Update Vitals</span>
                </button>
                <button
                  onClick={() => { setFabOpen(false); navigate('/appointments/book'); }}
                  type="button"
                  className="w-full py-1.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-extrabold rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>Book Appointment</span>
                </button>
                <button
                  onClick={() => { setFabOpen(false); navigate('/ai'); }}
                  type="button"
                  className="w-full py-1.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-extrabold rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>AI Diagnostics</span>
                </button>
                <button
                  onClick={() => {
                    setFabOpen(false);
                    setFeedback({
                      isOpen: true,
                      type: 'error',
                      title: 'SOS Emergency Alert Issued',
                      message: 'A mock geolocation alert has been transmitted to dispatch coordinates and local PHC clinics.'
                    });
                  }}
                  type="button"
                  className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-650 dark:text-red-400 font-extrabold rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-red-500 animate-ping" />
                  <span>Trigger SOS Alert</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFabOpen(!fabOpen)}
            type="button"
            className="p-4.5 bg-gradient-to-r from-primary-600 to-indigo-650 text-white rounded-full shadow-elevated cursor-pointer flex items-center justify-center hover:shadow-hover"
          >
            <motion.div
              animate={{ rotate: fabOpen ? 135 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          </motion.button>
        </div>
      </div>

    </motion.div>
  )
}
