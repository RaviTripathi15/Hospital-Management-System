import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Users, Calendar, Activity, Package, ClipboardCheck, ArrowRight,
  ShieldCheck, AlertCircle, Plus, FileText, CheckSquare
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { cn } from '@/utils/cn'

export default function StaffDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [liveTime, setLiveTime] = useState(new Date())

  useEffect(() => {
    const clockTimer = setInterval(() => setLiveTime(new Date()), 1000)
    const timeout = setTimeout(() => setLoading(false), 800)
    return () => {
      clearInterval(clockTimer)
      clearTimeout(timeout)
    }
  }, [])

  // Mock patient visits data for clinic daily flow
  const visitsFlowData = [
    { hour: '09:00', general: 14, emergency: 3 },
    { hour: '11:00', general: 28, emergency: 6 },
    { hour: '13:00', general: 15, emergency: 4 },
    { hour: '15:00', general: 32, emergency: 8 },
    { hour: '17:00', general: 19, emergency: 2 }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <SkeletonLoader type="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonLoader type="chart" />
          </div>
          <div className="lg:col-span-1">
            <SkeletonLoader type="list" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Welcome Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Clinic Operations</span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
            Welcome, Health Staff
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Logged in: {user?.firstName} {user?.lastName} • Manage your medical schedules and inventory.
          </p>
        </div>
        <div className="text-right sm:text-right flex flex-col items-end">
          <p className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400 leading-none">
            {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            {liveTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Patients', value: '184', icon: Users, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { label: "Today's Consultations", value: '23', icon: Calendar, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { label: 'Bed Occupancy', value: '82%', icon: Activity, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
          { label: 'Low Stock Medicines', value: '12 Items', icon: Package, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -2 }}
            className="card p-5 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-4 shadow-soft"
          >
            <div className={cn("p-3 rounded-2xl flex-shrink-0", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1 leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Patient visit flow chart - 8 cols */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-soft">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Daily Patient Inflow</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Realtime tracking of general consultations and emergency visits.</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> General</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Emergency</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitsFlowData}>
                <defs>
                  <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)"/>
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="general" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGeneral)" />
                <Area type="monotone" dataKey="emergency" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Checklist - 4 cols */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-soft">
          <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Operations Checklist</h3>
          <div className="space-y-3.5">
            {[
              { text: 'Morning clinic inventory audit', done: true },
              { text: 'Sanitize Emergency ward beds', done: true },
              { text: 'Verify temperature logs for cold chain vaccines', done: false },
              { text: 'Log doctor attendance sheets', done: false }
            ].map((chk, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <button className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer",
                  chk.done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-transparent"
                )}>
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  chk.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-200"
                )}>
                  {chk.text}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Staff Actions Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-soft">
        <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-1">Administrative Actions</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage patient records and daily facilities schedules.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Register New Patient', path: '/patients/add' },
            { label: 'Create Medical Record', path: '/reports/create' },
            { label: 'Manage Bed Allotment', path: '/beds' },
            { label: 'Log Doctor Clock-in', path: '/attendance' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 text-left transition-all group cursor-pointer active:scale-95"
            >
              <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{action.label}</p>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-0.5 font-semibold">
                Open module
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
