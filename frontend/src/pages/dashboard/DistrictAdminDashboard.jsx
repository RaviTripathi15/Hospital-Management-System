import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Building2, Users, FileText, AlertTriangle, Calendar, ClipboardList,
  Activity, ArrowRight, TrendingUp, BarChart2, CheckCircle
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { useAuthStore } from '@/store/authStore'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import { cn } from '@/utils/cn'

export default function DistrictAdminDashboard() {
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

  // Mock charts data
  const outbreakData = [
    { name: 'Mon', dengue: 12, malaria: 5 },
    { name: 'Tue', dengue: 18, malaria: 8 },
    { name: 'Wed', dengue: 15, malaria: 14 },
    { name: 'Thu', dengue: 25, malaria: 9 },
    { name: 'Fri', dengue: 30, malaria: 11 },
    { name: 'Sat', dengue: 22, malaria: 7 },
    { name: 'Sun', dengue: 19, malaria: 4 }
  ]

  const facilityStockData = [
    { name: 'Normal Stock', value: 34, color: '#10b981' },
    { name: 'Low Stock', value: 8, color: '#f59e0b' },
    { name: 'Critical/Out', value: 3, color: '#ef4444' }
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
            <SkeletonLoader type="vitals" count={3} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
        <div>
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">District Admin Console</span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
            Welcome back, Administrator
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Monitored District: Central Valley Region • Active health facilities tracking.
          </p>
        </div>
        <div className="text-right sm:text-right flex flex-col items-end">
          <p className="text-lg font-bold font-mono text-primary-600 dark:text-primary-450 leading-none">
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
          { label: 'Facilities Monitored', value: '45', icon: Building2, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
          { label: 'Active Health Staff', value: '320', icon: Users, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' },
          { label: 'Pending Reports', value: '8', icon: FileText, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-450' },
          { label: 'Outbreak Alerts', value: '2 Active', icon: AlertTriangle, color: 'bg-red-500/10 text-red-650 dark:text-red-400' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -2 }}
            className="card p-5 bg-white dark:bg-gray-800 border border-gray-150/60 dark:border-gray-700/60 flex items-center gap-4 shadow-soft"
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Outbreak chart - 8 cols */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Disease Surveillance (Weekly)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tracked vector-borne disease case logs across district units.</p>
            </div>
            <div className="flex gap-4 text-xs font-bold text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Dengue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Malaria</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={outbreakData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.15)"/>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="dengue" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="malaria" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Chart - 4 cols */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-white">Medical Supplies Audit</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stock distribution statistics for all 45 centers.</p>
          </div>
          <div className="h-44 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={facilityStockData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {facilityStockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {facilityStockData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-gray-650 dark:text-gray-400 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white">{item.value} Centers</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Links & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Tasks Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft">
          <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {[
              { text: 'Quarterly Bed Capacity Update - CHC Valley', time: '2 hours ago', status: 'Pending Review' },
              { text: 'Vaccine Inventory Request Refills - PHC North', time: '5 hours ago', status: 'Pending Review' },
              { text: 'Epidemiology Audit Report May 2026', time: '1 day ago', status: 'Draft' }
            ].map((task, idx) => (
              <div key={idx} className="p-3.5 bg-gray-50/50 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{task.text}</p>
                  <p className="text-[10px] text-gray-405 mt-0.5">{task.time}</p>
                </div>
                <span className="badge text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 rounded-full px-2 py-0.5">
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* District Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-1">Administrative Actions</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Perform district admin operations immediately.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5">
            {[
              { label: 'Register Facility', path: '/admin/centers/add' },
              { label: 'View Health Centers', path: '/admin/centers' },
              { label: 'District Analytics', path: '/analytics/district' },
              { label: 'Manage Patients', path: '/patients' }
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-850/60 dark:hover:bg-gray-800 text-left transition-all group border border-gray-150/60 dark:border-gray-700/60 cursor-pointer active:scale-95"
              >
                <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{action.label}</p>
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                  Open module
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
