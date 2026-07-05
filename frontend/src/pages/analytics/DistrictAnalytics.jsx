import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import footfallService from '@/services/footfallService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  TrendingUp,
  Clock,
  Building,
  Activity,
  Plus,
  Users,
  Search,
  Loader2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts'

const DEPARTMENTS = [
  'General OPD',
  'Pediatrics',
  'Emergency',
  'Gynaecology',
  'Dental Clinic',
  'Cardiology',
  'Orthopedics',
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function DistrictAnalytics() {
  const { t } = useTranslation()
  const { isSuperAdmin, isDistrictAdmin, user } = usePermissions()

  const [centers, setCenters] = useState([])
  const [selectedCenterId, setSelectedCenterId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Footfall Stats States
  const [stats, setStats] = useState({
    dailyCount: 0,
    monthlyCount: 0,
    departmentBreakdown: [],
  })
  const [peakHoursData, setPeakHoursData] = useState([])
  const [trendsData, setTrendsData] = useState([])

  // Log Form State
  const [logDept, setLogDept] = useState('General OPD')
  const [logCount, setLogCount] = useState(5)
  const [logTime, setLogTime] = useState('')
  const [isLogging, setIsLogging] = useState(false)

  // Chart Duration Filter
  const [durationDays, setDurationDays] = useState(30)

  const fetchCenters = async () => {
    try {
      const response = await healthCenterService.getAll({ limit: 100 })
      const data = response.data || response.results || response || []
      setCenters(data)
      
      // Auto select first center or user's assigned center
      if (user?.healthCenter) {
        setSelectedCenterId(user.healthCenter._id || user.healthCenter)
      } else if (data.length > 0) {
        setSelectedCenterId(data[0]._id)
      }
    } catch (err) {
      console.error('Failed to load centers list', err)
    }
  }

  const fetchFootfallAnalytics = async () => {
    if (!selectedCenterId) return
    setIsLoading(true)
    try {
      const params = { healthCenter: selectedCenterId, days: durationDays }
      
      const [statsRes, hoursRes, trendsRes] = await Promise.all([
        footfallService.getStats(params),
        footfallService.getPeakHours(params),
        footfallService.getTrends(params),
      ])

      setStats(statsRes.data || statsRes)
      
      // Format peak hours labels to 12h format (e.g. 09:00 AM)
      const formattedHours = (hoursRes.data || hoursRes || []).map((h) => {
        const hourNum = h.hour
        const label = hourNum === 0 ? '12 AM' : hourNum === 12 ? '12 PM' : hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`
        return { ...h, label }
      })
      setPeakHoursData(formattedHours)

      // Format trends dates
      setTrendsData(trendsRes.data || trendsRes || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load patient footfall analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [user])

  useEffect(() => {
    if (selectedCenterId) {
      fetchFootfallAnalytics()
    }
  }, [selectedCenterId, durationDays])

  const handleLogFootfall = async (e) => {
    e.preventDefault()
    if (logCount < 0) {
      toast.error('Patient count cannot be negative')
      return
    }

    setIsLogging(true)
    try {
      const payload = {
        healthCenter: selectedCenterId,
        patientCount: Number(logCount),
        department: logDept,
        timestamp: logTime ? new Date(logTime) : new Date(),
      }

      await footfallService.log(payload)
      toast.success('Patient footfall log recorded')
      
      // Reset form
      setLogCount(5)
      setLogTime('')
      
      // Re-fetch analytics
      fetchFootfallAnalytics()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to record log')
    } finally {
      setIsLogging(false)
    }
  }

  // Find peak hour details
  const getBusiestHour = () => {
    if (peakHoursData.length === 0) return 'N/A'
    const sorted = [...peakHoursData].sort((a, b) => b.count - a.count)
    return sorted[0]?.count > 0 ? sorted[0].label : 'N/A'
  }

  // Find busiest department
  const getBusiestDept = () => {
    if (!stats.departmentBreakdown || stats.departmentBreakdown.length === 0) return 'N/A'
    const sorted = [...stats.departmentBreakdown].sort((a, b) => b.count - a.count)
    return sorted[0]?.count > 0 ? sorted[0].department : 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Patient Footfall & Busiest Hour Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time outpatient volume trends, department analysis, and critical peak hours detection
          </p>
        </div>

        {/* Center Select & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {(isSuperAdmin || isDistrictAdmin) && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Building className="w-4 h-4" />
              </span>
              <select
                className="input-field pl-9 py-1.5 text-xs font-semibold"
                value={selectedCenterId}
                onChange={(e) => setSelectedCenterId(e.target.value)}
              >
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            className="input-field py-1.5 text-xs font-semibold"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Footfall Entry Panel (Left) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-400" />
              Log Patient Volume
            </h3>
            
            <form onSubmit={handleLogFootfall} className="space-y-3.5">
              {/* Department */}
              <div>
                <label className="label text-xs" htmlFor="logDept">
                  Department
                </label>
                <select
                  id="logDept"
                  className="input-field text-xs py-1.5"
                  value={logDept}
                  onChange={(e) => setLogDept(e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Count */}
              <div>
                <label className="label text-xs" htmlFor="logCount">
                  Patient Count
                </label>
                <input
                  id="logCount"
                  type="number"
                  min="0"
                  className="input-field text-xs py-1.5"
                  value={logCount}
                  onChange={(e) => setLogCount(Number(e.target.value))}
                  required
                />
              </div>

              {/* Timestamp (Optional) */}
              <div>
                <label className="label text-xs" htmlFor="logTime">
                  Log Timestamp (Optional)
                </label>
                <input
                  id="logTime"
                  type="datetime-local"
                  className="input-field text-xs py-1.5"
                  value={logTime}
                  onChange={(e) => setLogTime(e.target.value)}
                />
                <span className="text-[10px] text-gray-400 mt-1 block leading-tight">
                  Leave blank to log current system date & hour.
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLogging || !selectedCenterId}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-xs"
              >
                {isLogging ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Entry'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Output metrics & Charts (Right) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Daily Total */}
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Today Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white block mt-0.5">{stats.dailyCount}</span>
              </div>
            </div>

            {/* Monthly Total */}
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Month Total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white block mt-0.5">{stats.monthlyCount}</span>
              </div>
            </div>

            {/* Peak Hour */}
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Peak Hour</span>
                <span className="text-base font-bold text-gray-900 dark:text-white block mt-0.5 truncate max-w-[120px]">{getBusiestHour()}</span>
              </div>
            </div>

            {/* Busiest Department */}
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Busiest Dept</span>
                <span className="text-base font-bold text-gray-900 dark:text-white block mt-0.5 truncate max-w-[120px]">{getBusiestDept()}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 text-gray-500 card">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
              <p className="text-sm">Generating outpatient trends charts...</p>
            </div>
          ) : trendsData.length === 0 ? (
            <div className="card p-24 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No footfall records to display</p>
              <p className="text-sm text-gray-400 mt-1">Please log entries on the left panel to populate the analytics dashboard.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Trends Chronology Area Chart */}
              <div className="card p-5 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Patient Volume Trends</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" name="Patients" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Double Column Sub Charts: Peak Hours (left) and Department wise (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peak Hours distribution */}
                <div className="card p-5 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Hourly Distribution (Peak Hours)</h4>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={peakHoursData.filter(h => h.count > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={9} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={9} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Visitors" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Department Wise distribution */}
                <div className="card p-5 space-y-3">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Department Wise Distribution</h4>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.departmentBreakdown} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={9} tickLine={false} />
                        <YAxis dataKey="department" type="category" stroke="#9ca3af" fontSize={9} tickLine={false} width={80} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Patients">
                          {stats.departmentBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
