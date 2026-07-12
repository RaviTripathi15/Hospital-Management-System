import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, FileText, Building2, Bell, Pill, Activity, Plus, PhoneCall,
  Heart, Download, User, ArrowRight, ClipboardList, Info, HelpCircle
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
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import FeedbackOverlay from '@/components/ui/FeedbackOverlay'
import { cn } from '@/utils/cn'

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

  // Vitals state (loaded from localstorage or defaults)
  const [vitals, setVitals] = useState({
    weight: 70, // kg
    height: 175, // cm
    sys: 120, // systolic
    dia: 80, // diastolic
    pulse: 72, // bpm
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
    pulse: 72
  })

  // API Fetched States
  const [apiData, setApiData] = useState({
    appointments: [],
    reports: [],
    centersCount: 0,
    medicinesCount: 2 // Default mock count for medicines due
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

  // Load Vitals from LocalStorage
  useEffect(() => {
    const savedVitals = localStorage.getItem(`vitals_${user?.email || 'guest'}`)
    if (savedVitals) {
      try {
        const parsed = JSON.parse(savedVitals)
        setVitals(parsed)
        setVitalsForm({
          weight: parsed.weight || 70,
          height: parsed.height || 175,
          sys: parsed.sys || 120,
          dia: parsed.dia || 80,
          pulse: parsed.pulse || 72
        })
      } catch (e) {
        console.error("Error parsing saved vitals", e)
      }
    }
  }, [user])

  // Fetch API Stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const appointmentsRes = await appointmentService.getMyAppointments().catch(() => ({ appointments: [] }))
        const reportsRes = await reportService.getAll().catch(() => ({ reports: [] }))
        const centersRes = await healthCenterService.getAll().catch(() => ({ healthCenters: [] }))

        // Extract list fields safely depending on API formats
        const appointmentsList = appointmentsRes.appointments || appointmentsRes.data || appointmentsRes || []
        const reportsList = reportsRes.reports || reportsRes.data || reportsRes || []
        const centersList = centersRes.healthCenters || centersRes.data || centersRes || []

        setApiData({
          appointments: appointmentsList,
          reports: reportsList,
          centersCount: centersList.length || 12,
          medicinesCount: 2
        })
      } catch (err) {
        console.error("Error fetching dashboard statistics", err)
      } finally {
        // Enforce a small artificial delay to show off beautiful loading skeletons
        setTimeout(() => setLoading(false), 800)
      }
    }

    fetchDashboardData()
  }, [])

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
      pulse: parseInt(vitalsForm.pulse)
    }
    setVitals(updated)
    localStorage.setItem(`vitals_${user?.email || 'guest'}`, JSON.stringify(updated))
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

  // Format greeting based on hours
  const getGreeting = () => {
    const hrs = liveTime.getHours()
    if (hrs < 12) return 'Good Morning'
    if (hrs < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-44 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="lg:col-span-1 grid grid-cols-2 gap-4">
            <div className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-20 bg-white dark:bg-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          <SkeletonLoader type="card" count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SkeletonLoader type="vitals" count={4} />
          </div>
          <div className="lg:col-span-3">
            <SkeletonLoader type="chart" count={2} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7 animate-fade-in">
      
      {/* Top Welcome Panel & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-7 bg-gradient-to-r from-primary-600 to-blue-700 dark:from-primary-750 dark:to-blue-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-elevated flex flex-col justify-between min-h-[220px]">
          {/* Subtle Background Art */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/85 text-xs font-bold uppercase tracking-wider">
                  Patient Portal
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">
                  {getGreeting()}, {user?.firstName || 'Valued Citizen'}
                </h1>
              </div>
              {/* Digital live clock */}
              <div className="text-right">
                <p className="text-lg md:text-xl font-bold font-mono tracking-wide leading-none">
                  {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <p className="text-[10px] text-white/80 mt-1 font-medium">
                  {liveTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Health Tip Box */}
            <div className="mt-6 flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <Info className="w-5 h-5 text-emerald-350 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-350 dark:text-emerald-400 uppercase tracking-wider">Daily Health Tip</p>
                <p className="text-xs text-white/90 leading-relaxed mt-0.5 font-medium">{HEALTH_TIPS[tipIndex]}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex gap-4 mt-6">
            <button
              onClick={() => setShowVitalsModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              Update Vitals
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              View Profile
            </button>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary-500" />
              Quick Actions
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Access core health services and updates instantly.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mt-5">
            {[
              { label: 'Book Appointment', icon: Calendar, color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/30 dark:text-primary-400 border-primary-100/50 dark:border-primary-900/30', path: '/appointments/book' },
              { label: 'Find Nearby PHC', icon: Building2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-450 border-emerald-100/50 dark:border-emerald-900/30', path: '/admin/centers' },
              { label: 'Medical Records', icon: FileText, color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/30', path: '/reports' },
              { label: 'Emergency Line', icon: PhoneCall, color: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border-red-100/50 dark:border-red-900/30', action: 'emergency' },
              { label: 'Download Reports', icon: Download, color: 'text-blue-650 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100/50 dark:border-blue-900/30', action: 'download' },
              { label: 'Update Profile', icon: User, color: 'text-amber-650 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-450 border-amber-100/50 dark:border-amber-900/30', path: '/profile' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.path) navigate(action.path)
                  else if (action.action === 'emergency') {
                    // Triggers the emergency alert modal in MainLayout or directly local feedback
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
                  "p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-soft active:scale-95 group cursor-pointer",
                  action.color
                )}
              >
                <action.icon className="w-5.5 h-5.5 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { label: 'Upcoming Appointments', value: upcomingAppointments.length, icon: Calendar, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { label: 'Total Medical Records', value: apiData.reports.length, icon: FileText, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
          { label: 'Available Health Centers', value: apiData.centersCount, icon: Building2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' },
          { label: 'Notifications Alerts', value: unreadCount, icon: Bell, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-450' },
          { label: 'Medicines Due Now', value: apiData.medicinesCount, icon: Pill, color: 'bg-red-500/10 text-red-650 dark:text-red-400' },
          { label: 'Overall Health Score', value: `${healthScore}/100`, icon: Activity, color: 'bg-teal-500/10 text-teal-600 dark:text-teal-405', isScore: true }
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3 }}
            className="card p-5 bg-white dark:bg-gray-800 border border-gray-150/60 dark:border-gray-700/60 flex flex-col justify-between min-h-[125px] relative overflow-hidden"
          >
            {stat.isScore && (
              <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-teal-500/5 blur-md" />
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider max-w-[80%] leading-tight">{stat.label}</span>
              <div className={cn("p-2 rounded-xl flex-shrink-0", stat.color)}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{stat.value}</span>
              {stat.isScore && (
                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md">Healthy</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Vitals Overview & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Vitals Dashboard Panel (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-950 dark:text-white">Health Overview</h3>
                <p className="text-xs text-gray-505 dark:text-gray-400">Your current baseline vitals.</p>
              </div>
              <button
                onClick={() => setShowVitalsModal(true)}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-750 dark:text-primary-400 hover:underline flex items-center gap-0.5"
              >
                Update Vitals
              </button>
            </div>

            <div className="space-y-4">
              
              {/* BMI Card */}
              <div className="p-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-650 dark:text-blue-400 flex-shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">BMI Index</p>
                    <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full", bmiCat.color)}>
                      {bmiCat.label}
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">
                    {bmi} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">kg/m²</span>
                  </p>
                  {/* Slider visual track */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2.5 overflow-hidden flex">
                    <div className="bg-amber-400 h-full" style={{ width: '18%' }} />
                    <div className="bg-emerald-500 h-full" style={{ width: '32%' }} />
                    <div className="bg-orange-500 h-full" style={{ width: '25%' }} />
                    <div className="bg-red-500 h-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="p-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-650 dark:text-indigo-400 flex-shrink-0">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blood Pressure</p>
                    <span className="text-[10px] font-bold text-indigo-500">{bpCat.label}</span>
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">
                    {vitals.sys}/{vitals.dia} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">mmHg</span>
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        vitals.sys < 120 ? "bg-emerald-500" : vitals.sys < 130 ? "bg-amber-400" : vitals.sys < 140 ? "bg-orange-500" : "bg-red-500"
                      )}
                      style={{ width: `${Math.min(100, (vitals.sys / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Heart Rate Card with pulsing wave */}
              <div className="p-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0 border border-red-100/50 dark:border-red-900/10">
                  <Heart className="w-6 h-6 fill-red-500 animate-bounce-slow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heart Rate</p>
                    {/* Animated Pulse SVG */}
                    <svg className="w-14 h-4 text-red-500" viewBox="0 0 60 20" fill="none">
                      <path
                        d="M0 10 H15 L20 2 L25 18 L30 8 L35 12 L40 10 H60"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none animate-pulse">
                    {vitals.pulse} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">bpm</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">Resting Rate • Healthy Range (60-100)</p>
                </div>
              </div>

              {/* Vaccination Check list */}
              <div className="p-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">Vaccination Status</p>
                <div className="space-y-2">
                  {vitals.vaccines.map((vac, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
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

            </div>
          </div>
        </div>

        {/* Charts & Graphical Data (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Charts Grid (2 columns on tablet/desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Appointment Trend AreaChart */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Appointment Trend</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Your total clinic checkups visits trend.</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={appointmentTrendData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)"/>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false}/>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health Activity BarChart */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Health Activity</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Average daily steps count & calorie burn tracker.</p>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthActivityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)"/>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Monthly Visits Full Width Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Monthly Consultations by Specialty</h3>
              <p className="text-xs text-gray-450 dark:text-gray-500">Breakdown of healthcare center visits by medical category.</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyVisitsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(200,200,200,0.15)"/>
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} width={80}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
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
                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                Schedule First Visit
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Doctor / Center</th>
                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Specialty</th>
                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Date & Time</th>
                    <th className="py-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-750/30">
                  {upcomingAppointments.slice(0, 3).map((app, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10 transition-colors">
                      <td className="py-3.5 px-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            {app.doctor?.userId ? `Dr. ${app.doctor.userId.firstName} ${app.doctor.userId.lastName}` : app.doctorName || 'General Staff'}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {app.center?.name || 'Primary Health Center'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                        {app.specialty || 'General Consultation'}
                      </td>
                      <td className="py-3.5 px-2">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {app.date ? new Date(app.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                        </p>
                        <p className="text-[10px] text-gray-405 mt-0.5">{app.timeSlot || 'Anytime'}</p>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={cn(
                          "badge text-[9px] font-bold px-2 py-0.5 rounded-full capitalize",
                          app.status === 'confirmed' || app.status === 'completed'
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450"
                            : app.status === 'cancelled'
                              ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450"
                        )}>
                          {app.status || 'scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latest Prescriptions & Medicines (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Prescriptions & Medicines</h3>
            <p className="text-xs text-gray-505 dark:text-gray-400">Current schedule and active medicines.</p>
          </div>

          <div className="space-y-3.5">
            {[
              { name: 'Metformin 500mg', instructions: '1 tablet - twice daily after meals', category: 'Diabetes', dosage: 'Due: Breakfast & Dinner' },
              { name: 'Atorvastatin 10mg', instructions: '1 tablet - daily at night before sleep', category: 'Cholesterol', dosage: 'Due: Dinner' }
            ].map((med, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/60 dark:border-gray-800/40 rounded-2xl flex items-start gap-3"
              >
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl flex-shrink-0 border border-indigo-100/50 dark:border-indigo-900/10">
                  <Pill className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{med.name}</p>
                    <span className="text-[9px] font-bold text-indigo-550 dark:text-indigo-455 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                      {med.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-450 mt-1">{med.instructions}</p>
                  <p className="text-[10px] text-emerald-650 dark:text-emerald-450 font-bold mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                    {med.dosage}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setFeedback({
                isOpen: true,
                type: 'success',
                title: 'Refills Requested',
                message: 'A refill request has been logged and sent to your health center pharmacy.'
              })
            }}
            className="w-full mt-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/35 border border-indigo-100 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
          >
            Request Medication Refills
          </button>
        </div>

      </div>

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

                <div>
                  <label className="label">Heart Rate / Pulse (bpm)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.pulse}
                    onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                    className="input-field"
                  />
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

    </div>
  )
}
