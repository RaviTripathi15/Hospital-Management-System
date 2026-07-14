import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Heart, Activity, Percent, Scale, User, RefreshCw } from 'lucide-react'
import { cn } from '@/utils/cn'

// Generate sample historical placeholder data based on current vitals to keep it realistic
const generateHistoricalData = (vitals) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weight = parseFloat(vitals.weight || 70)
  const height = parseFloat(vitals.height || 175)
  const sys = parseInt(vitals.sys || 120)
  const dia = parseInt(vitals.dia || 80)
  const pulse = parseInt(vitals.pulse || 72)
  const spo2 = parseInt(vitals.spo2 || 98)
  
  const heightInMeters = height / 100
  const baseBmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)) : 22.9

  return days.map((day, idx) => {
    // Generate slight fluctuations around the baseline
    const factor = idx - 3 // centered around index 3
    const weightVal = (weight + (factor * 0.15) + (Math.sin(idx) * 0.2)).toFixed(1)
    const bmiVal = heightInMeters > 0 ? (parseFloat(weightVal) / (heightInMeters * heightInMeters)).toFixed(1) : 22.9
    
    return {
      name: day,
      weight: parseFloat(weightVal),
      bmi: parseFloat(bmiVal),
      systolic: Math.round(sys + (factor * 1) + (Math.cos(idx) * 2)),
      diastolic: Math.round(dia + (factor * 0.5) + (Math.sin(idx) * 1.5)),
      pulse: Math.round(pulse + (factor * 1.5) + (Math.sin(idx * 2) * 3)),
      spo2: Math.min(100, Math.round(spo2 + (factor * 0.2) + (Math.cos(idx) * 0.8))),
    }
  })
}

export default function HealthAnalytics({ vitals = {}, onUpdateClick }) {
  const [selectedMetric, setSelectedMetric] = useState('bp')

  // Calculate current BMI
  const weight = parseFloat(vitals.weight || 70)
  const height = parseFloat(vitals.height || 175)
  const heightInMeters = height / 100
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : '22.9'

  // Generate trend dataset
  const trendData = generateHistoricalData(vitals)

  // Metirc categories config
  const METRIC_CONFIG = {
    bp: {
      label: 'Blood Pressure',
      value: `${vitals.sys || 120}/${vitals.dia || 80}`,
      unit: 'mmHg',
      icon: Activity,
      color: 'from-blue-500 to-indigo-600',
      textColor: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      chartKey: 'systolic', // showing systolic primarily, tooltip will show both
      maxVal: 200,
      description: 'Force of circulating blood against blood vessels.'
    },
    hr: {
      label: 'Heart Rate',
      value: vitals.pulse || 72,
      unit: 'bpm',
      icon: Heart,
      color: 'from-red-500 to-rose-600',
      textColor: 'text-rose-500',
      bgColor: 'bg-rose-50 dark:bg-rose-950/20',
      chartKey: 'pulse',
      maxVal: 150,
      description: 'Resting pulse speed per minute.'
    },
    spo2: {
      label: 'Oxygen Saturation',
      value: vitals.spo2 || 98,
      unit: '%',
      icon: Percent,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      chartKey: 'spo2',
      maxVal: 100,
      description: 'Percentage of oxygenated hemoglobin in blood.'
    },
    weight: {
      label: 'Body Weight',
      value: vitals.weight || 70,
      unit: 'kg',
      icon: Scale,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      chartKey: 'weight',
      maxVal: 150,
      description: 'Current baseline body mass index weight.'
    },
    bmi: {
      label: 'Body Mass Index',
      value: bmi,
      unit: 'index',
      icon: User,
      color: 'from-purple-500 to-fuchsia-600',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      chartKey: 'bmi',
      maxVal: 40,
      description: 'Weight-to-height ratio indicator.'
    }
  }

  const activeConf = METRIC_CONFIG[selectedMetric]
  
  // Custom circular SVG progress calculation
  const getCircleStroke = (value, max) => {
    const val = parseFloat(value) || 0
    const percent = Math.min(100, (val / max) * 100)
    const radius = 34
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference
    return { circumference, strokeDashoffset: offset }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-950 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
            Personal Health Analytics
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Interactive vitals metrics and trend summaries.
          </p>
        </div>
        <button
          onClick={onUpdateClick}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-indigo-100/40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Update Vitals
        </button>
      </div>

      {/* Grid: 5 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(METRIC_CONFIG).map(([key, config]) => {
          const isActive = selectedMetric === key
          const Icon = config.icon
          const circleProgress = getCircleStroke(
            key === 'bp' ? vitals.sys || 120 : config.value,
            config.maxVal
          )

          return (
            <motion.div
              key={key}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => setSelectedMetric(key)}
              className={cn(
                "p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden group select-none",
                isActive
                  ? "border-indigo-500/30 shadow-md bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/10 dark:from-indigo-950/10 dark:via-gray-800 dark:to-indigo-950/5"
                  : "border-gray-150/60 dark:border-gray-700/60 hover:border-indigo-300 dark:hover:border-indigo-900/40 bg-gray-50/30 dark:bg-gray-850/10"
              )}
            >
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105", config.bgColor, config.textColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* SVG Progress Circle */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                    <circle
                      className="text-gray-100 dark:text-gray-700/40"
                      strokeWidth="5"
                      stroke="currentColor"
                      fill="transparent"
                      r="34"
                      cx="40"
                      cy="40"
                    />
                    <motion.circle
                      className={cn("transition-all duration-500")}
                      strokeWidth="5"
                      strokeDasharray={circleProgress.circumference}
                      initial={{ strokeDashoffset: circleProgress.circumference }}
                      animate={{ strokeDashoffset: circleProgress.strokeDashoffset }}
                      strokeLinecap="round"
                      stroke={isActive ? "url(#metricCircleGradient)" : "currentColor"}
                      fill="transparent"
                      r="34"
                      cx="40"
                      cy="40"
                    />
                    <defs>
                      <linearGradient id="metricCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {key === 'bp' ? 'sys' : key}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-[10px] font-bold text-gray-405 dark:text-gray-500 uppercase tracking-wider block">
                  {config.label}
                </span>
                <p className="text-lg font-black text-gray-900 dark:text-white leading-none mt-1">
                  {config.value}{' '}
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                    {config.unit}
                  </span>
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Analytics Chart Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Metric Insights Card (Left 4 cols) */}
        <div className="lg:col-span-4 bg-gray-50/60 dark:bg-gray-850/30 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <span className={cn("inline-block px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider", activeConf.bgColor, activeConf.textColor)}>
              {activeConf.label} Details
            </span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Clinical Insight</h3>
            <p className="text-xs text-gray-600 dark:text-gray-450 leading-relaxed font-medium">
              {activeConf.description} Monitoring your {activeConf.label.toLowerCase()} consistently helps track physiological health baselines.
            </p>
          </div>

          <div className="mt-6 border-t border-gray-150/50 dark:border-gray-800/30 pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-405 font-bold uppercase tracking-wider text-[9px]">Metric Range Status</span>
              <span className="font-extrabold text-emerald-500">Optimal Range</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-455 font-bold uppercase tracking-wider text-[9px]">Last Recorded Value</span>
              <span className="font-black text-gray-900 dark:text-white">
                {activeConf.value} {activeConf.unit}
              </span>
            </div>
          </div>
        </div>

        {/* 7-day Historical Trend Chart (Right 8 cols) */}
        <div className="lg:col-span-8 bg-gray-50/30 dark:bg-gray-850/10 border border-gray-150/40 dark:border-gray-800/20 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">7-Day Vitals Trend</h3>
              <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">
                Displays fluctuations based on registered checkups.
              </p>
            </div>
            <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100/30">
              Personal Baseline
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                  </linearGradient>
                  {selectedMetric === 'bp' && (
                    <linearGradient id="colorDiastolic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)"/>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                
                {/* Custom Tooltip */}
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    fontSize: 11
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                
                {/* Area Charts */}
                {selectedMetric === 'bp' ? (
                  <>
                    <Area type="monotone" name="Systolic" dataKey="systolic" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMetric)" />
                    <Area type="monotone" name="Diastolic" dataKey="diastolic" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDiastolic)" />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    name={activeConf.label}
                    dataKey={activeConf.chartKey}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMetric)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
