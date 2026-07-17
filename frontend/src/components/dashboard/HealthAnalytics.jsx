import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Heart, Activity, Percent, Scale, User, RefreshCw, Sparkles, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'

// Generate sample historical data with high fidelity matching current vitals
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
    const factor = idx - 3
    const weightVal = (weight + (factor * 0.15) + (Math.sin(idx) * 0.2)).toFixed(1)
    const bmiVal = heightInMeters > 0 ? (parseFloat(weightVal) / (heightInMeters * heightInMeters)).toFixed(1) : 22.9
    
    return {
      name: day,
      weight: parseFloat(weightVal),
      bmi: parseFloat(bmiVal),
      systolic: Math.round(sys + (factor * 1.2) + (Math.cos(idx) * 2.5)),
      diastolic: Math.round(dia + (factor * 0.6) + (Math.sin(idx) * 1.5)),
      pulse: Math.round(pulse + (factor * 1.4) + (Math.sin(idx * 2) * 3)),
      spo2: Math.min(100, Math.round(spo2 + (factor * 0.1) + (Math.cos(idx) * 0.5))),
    }
  })
}

export default function HealthAnalytics({ vitals = {}, onUpdateClick }) {
  const [selectedMetric, setSelectedMetric] = useState('bp')

  // Vitals definitions
  const weight = parseFloat(vitals.weight || 70)
  const height = parseFloat(vitals.height || 175)
  const sys = parseInt(vitals.sys || 120)
  const dia = parseInt(vitals.dia || 80)
  const pulse = parseInt(vitals.pulse || 72)
  const spo2 = parseInt(vitals.spo2 || 98)

  const heightInMeters = height / 100
  const bmi = heightInMeters > 0 ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : '22.9'

  // Vitals Health Score calculations
  const calculateHealthScore = () => {
    let score = 100
    const bmiVal = parseFloat(bmi)
    if (bmiVal < 18.5 || bmiVal >= 30) score -= 15
    else if (bmiVal >= 25) score -= 8

    if (sys >= 140 || dia >= 90) score -= 20
    else if (sys >= 130 || dia >= 80) score -= 10

    if (pulse < 60 || pulse > 100) score -= 10
    if (spo2 < 95) score -= 15
    return score
  }

  const healthScore = calculateHealthScore()
  const trendData = generateHistoricalData(vitals)

  // Ranges & Badging
  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-250/25' }
    if (val < 25) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250/25' }
    if (val < 30) return { label: 'Overweight', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-250/25' }
    return { label: 'Obese', color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-250/25' }
  }

  const getBpCategory = (s, d) => {
    if (s < 120 && d < 80) return { label: 'Optimal', color: 'text-emerald-655 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150/30' }
    if (s < 130 && d < 80) return { label: 'Elevated', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-150/30' }
    if (s < 140 || d < 90) return { label: 'Stage 1 Hypertension', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-150/30' }
    return { label: 'Stage 2 Hypertension', color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-150/30' }
  }

  const getHrCategory = (p) => {
    if (p >= 60 && p <= 100) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150/30' }
    return { label: 'Out of Range', color: 'text-red-650 bg-red-50 dark:bg-red-950/20 border-red-150/30' }
  }

  const getSpo2Category = (o) => {
    if (o >= 95) return { label: 'Healthy', color: 'text-emerald-655 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150/30' }
    return { label: 'Hypoxia Risk', color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-150/30' }
  }

  const METRIC_CONFIG = {
    bp: {
      label: 'Blood Pressure',
      value: `${sys}/${dia}`,
      unit: 'mmHg',
      icon: Activity,
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-100 dark:border-blue-900/30',
      chartKey: 'systolic',
      maxVal: 200,
      badge: getBpCategory(sys, dia),
      insight: 'Systolic/diastolic force of circulating blood. Ideal ranges are below 120/80 mmHg.'
    },
    hr: {
      label: 'Heart Rate',
      value: pulse,
      unit: 'bpm',
      icon: Heart,
      textColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-100 dark:border-red-900/30',
      chartKey: 'pulse',
      maxVal: 160,
      badge: getHrCategory(pulse),
      insight: 'Number of heartbeats per minute. Normal resting rate ranges between 60 to 100 bpm.'
    },
    spo2: {
      label: 'Oxygen Saturation',
      value: spo2,
      unit: '% SpO2',
      icon: Percent,
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-100 dark:border-emerald-900/30',
      chartKey: 'spo2',
      maxVal: 100,
      badge: getSpo2Category(spo2),
      insight: 'Percentage of oxygen carried by red blood cells. Normal saturation levels are 95%–100%.'
    },
    weight: {
      label: 'Body Weight',
      value: weight,
      unit: 'kg',
      icon: Scale,
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-100 dark:border-amber-900/30',
      chartKey: 'weight',
      maxVal: 180,
      badge: { label: `${vitals.height || 175} cm`, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-100/20' },
      insight: 'Baseline mass calculation. Crucial reference marker for medication dosages and metabolic logs.'
    },
    bmi: {
      label: 'Body Mass Index',
      value: bmi,
      unit: 'index',
      icon: User,
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-100 dark:border-purple-900/30',
      chartKey: 'bmi',
      maxVal: 40,
      badge: getBmiCategory(parseFloat(bmi)),
      insight: 'Calculated using weight to height squared. Evaluates body mass category and risk metrics.'
    }
  }

  // Ring offset calculation
  const getCircleStroke = (value, max) => {
    const val = parseFloat(value) || 0
    const percent = Math.min(100, (val / max) * 100)
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference
    return { circumference, strokeDashoffset: offset }
  }

  const activeConf = METRIC_CONFIG[selectedMetric]

  // Dynamic AI Insight statement
  const getAIInsightText = () => {
    let findings = []
    if (sys >= 130 || dia >= 85) findings.push('Systolic or Diastolic pressure exhibits mild elevation.')
    if (pulse > 90) findings.push('Resting pulse is slightly high; monitor stress or activity factors.')
    if (spo2 < 96) findings.push('Oxygen levels are approaching the lower healthy limit.')
    if (parseFloat(bmi) >= 25) findings.push('BMI indicates an overweight range. General lifestyle modifications are suggested.')

    if (findings.length === 0) {
      return 'All monitored physiological indicators are within optimal ranges. Maintain your regular hydration, sleep schedule, and balanced nutrition plan.'
    }
    return `${findings.join(' ')} Recommendations: Limit sodium intake, incorporate 30 mins of moderate cardio, and re-check vitals in 24 hours.`
  }

  return (
    <div className="space-y-6">
      
      {/* Header and Core Health Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: General Title */}
        <div className="lg:col-span-8 bg-white dark:bg-[#131c2e] p-6 rounded-xl border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Personal Vitals & Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hospital-grade health monitoring console and historical telemetry data syncs.
              </p>
            </div>
            <button
              onClick={onUpdateClick}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 border border-slate-200 dark:border-[#1e2d4a]/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Vitals
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-50 dark:border-[#1e2d4a]/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Last Update Status</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Synced 10 minutes ago via smartwatch.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350">Reference Standard</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Aligned with WHO health guidelines.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Health Score Progress Gauge */}
        <div className="lg:col-span-4 bg-white dark:bg-[#131c2e] p-6 rounded-xl border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Health Index Score</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold border leading-none uppercase tracking-wider",
              healthScore >= 90
                ? "bg-emerald-50 text-emerald-600 border-emerald-250/25"
                : healthScore >= 80
                ? "bg-blue-50 text-blue-600 border-blue-250/25"
                : "bg-amber-50 text-amber-600 border-amber-250/25"
            )}>
              {healthScore >= 90 ? 'Optimal' : healthScore >= 80 ? 'Good' : 'Fair'}
            </span>
          </div>

          <div className="my-4 flex items-center justify-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="6.5"
                  stroke="currentColor"
                  fill="transparent"
                  r="32"
                  cx="40"
                  cy="40"
                />
                <circle
                  className="text-primary-500 transition-all duration-1000"
                  strokeWidth="6.5"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - healthScore / 100)}
                  strokeLinecap="round"
                  stroke="url(#healthScoreRedesignGrad)"
                  fill="transparent"
                  r="32"
                  cx="40"
                  cy="40"
                />
                <defs>
                  <linearGradient id="healthScoreRedesignGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="60%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{healthScore}</span>
                <span className="text-[8px] uppercase font-bold text-slate-400 mt-1">/100</span>
              </div>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Evaluation Factors</p>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>BP: {sys}/{dia}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>SpO2: {spo2}%</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center border-t border-slate-50 dark:border-[#1e2d4a]/30 pt-3">
            Realtime evaluation is refreshed upon every manual vitals update.
          </p>
        </div>

      </div>

      {/* Grid of Redesigned KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {Object.entries(METRIC_CONFIG).map(([key, config]) => {
          const isActive = selectedMetric === key
          const Icon = config.icon
          const circleProgress = getCircleStroke(
            key === 'bp' ? sys : config.value,
            config.maxVal
          )

          return (
            <motion.div
              key={key}
              whileHover={{ y: -3 }}
              onClick={() => setSelectedMetric(key)}
              className={cn(
                "p-5 rounded-xl border cursor-pointer flex flex-col justify-between min-h-[160px] relative overflow-hidden group transition-all select-none",
                isActive
                  ? "border-primary-500 dark:border-primary-500 bg-gradient-to-br from-primary-50/30 via-white to-primary-50/10 dark:from-[#131c2e] dark:to-[#1a263d] shadow-md ring-1 ring-primary-500"
                  : "border-slate-100 dark:border-[#1e2d4a]/85 bg-white dark:bg-[#131c2e] hover:border-slate-300 dark:hover:border-[#1e2d4a]/90 hover:shadow-sm"
              )}
            >
              <div className="flex justify-between items-start">
                <div className={cn("p-2.5 rounded-lg shrink-0", config.bgColor, config.textColor)}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* Custom Circular SVG ring */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                    <circle
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="4"
                      stroke="currentColor"
                      fill="transparent"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <motion.circle
                      strokeWidth="4"
                      strokeDasharray={circleProgress.circumference}
                      initial={{ strokeDashoffset: circleProgress.circumference }}
                      animate={{ strokeDashoffset: circleProgress.strokeDashoffset }}
                      strokeLinecap="round"
                      stroke={isActive ? "url(#kpiCircleGrad)" : "currentColor"}
                      className={cn("transition-all duration-700", isActive ? "" : config.textColor)}
                      fill="transparent"
                      r="28"
                      cx="32"
                      cy="32"
                    />
                    <defs>
                      <linearGradient id="kpiCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                    {key === 'bp' ? 'sys' : key}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  {config.label}
                </span>
                
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                    {config.value}
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                      {config.unit}
                    </span>
                  </span>
                  
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-bold border leading-none",
                    config.badge.color
                  )}>
                    {config.badge.label}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Expanded Chart and Analytics Detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Vitals Trend Chart (Left/Center - spans lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#131c2e] p-6 rounded-xl border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft flex flex-col justify-between min-h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                Vitals Analytics History
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Select metrics cards above to update the chart visualization baseline.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[9px] font-black text-primary-600 bg-primary-50 dark:bg-primary-950/20 uppercase tracking-wider border border-primary-250/20">
              7-Day Timeline
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMainMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                  {selectedMetric === 'bp' && (
                    <linearGradient id="colorSecondMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01}/>
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.06)"/>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    fontSize: 11,
                    color: '#1e293b'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                
                {selectedMetric === 'bp' ? (
                  <>
                    <Area type="monotone" name="Systolic (mmHg)" dataKey="systolic" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMainMetric)" />
                    <Area type="monotone" name="Diastolic (mmHg)" dataKey="diastolic" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSecondMetric)" />
                  </>
                ) : (
                  <Area
                    type="monotone"
                    name={`${activeConf.label} (${activeConf.unit})`}
                    dataKey={activeConf.chartKey}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMainMetric)"
                  />
                )}
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Health Insights and Recent Checkups (Right - spans lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* AI Insights Card */}
          <div className="bg-white dark:bg-[#131c2e] p-6 rounded-xl border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft flex-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider rounded border border-indigo-250/20">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                AI Health Insights
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Clinical Assessment</h3>
              <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed font-medium">
                {getAIInsightText()}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-[#1e2d4a]/30">
              <p className="text-[10px] text-slate-400 italic">
                *Note: AI Insights are generated automatically for assistance. Consult your primary healthcare doctor for formal diagnostic opinions.
              </p>
            </div>
          </div>

          {/* Recent Checkups Card */}
          <div className="bg-white dark:bg-[#131c2e] p-6 rounded-xl border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft flex-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-500" />
              Recent Checkups
            </h3>

            <div className="space-y-3.5">
              {[
                { type: 'General OPD Consult', center: 'Patna Primary Health Center', date: 'Jul 12, 2026', doctor: 'Dr. Ramesh Prasad' },
                { type: 'Diagnostic Lab Test', center: 'District CHC Laboratory', date: 'Jun 28, 2026', doctor: 'Lab Specialist' }
              ].map((visit, index) => (
                <div key={index} className="flex gap-3 items-start text-xs border-b border-slate-50 dark:border-[#1e2d4a]/10 pb-3 last:border-none last:pb-0">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100">{visit.type}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{visit.center} • {visit.doctor}</p>
                    <span className="text-[9px] font-bold text-primary-600 dark:text-primary-450 mt-1 inline-block bg-primary-50 dark:bg-primary-950/20 px-1.5 py-0.5 rounded">
                      {visit.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
