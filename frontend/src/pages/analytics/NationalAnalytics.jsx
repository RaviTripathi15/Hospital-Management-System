import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import analyticsService from '@/services/analyticsService'
import {
  Globe,
  Users,
  Activity,
  AlertTriangle,
  Building,
  Loader2,
  TrendingUp,
  FileSpreadsheet
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
  PieChart,
  Pie
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function NationalAnalytics() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState(30)

  const fetchNationalData = async () => {
    setIsLoading(true)
    try {
      const response = await analyticsService.getNational({ days: timePeriod })
      setData(response.data || response)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load national aggregate data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNationalData()
  }, [timePeriod])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    )
  }

  const summary = data?.summary || {
    totalCenters: 8,
    totalBeds: 180,
    totalPatients: 80,
    totalConsultations: 120,
  }

  const districtComparison = data?.districtData || [
    { name: 'Patna', centersCount: 2, patientsCount: 45, bedOccupancy: 78 },
    { name: 'Gaya', centersCount: 2, patientsCount: 30, bedOccupancy: 62 },
    { name: 'Muzaffarpur', centersCount: 2, patientsCount: 28, bedOccupancy: 54 },
    { name: 'Bhagalpur', centersCount: 2, patientsCount: 18, bedOccupancy: 40 },
  ]

  const diseaseDistribution = data?.diseaseData || [
    { name: 'Malaria', value: 15 },
    { name: 'Typhoid', value: 24 },
    { name: 'Gastroenteritis', value: 18 },
    { name: 'Influenza', value: 35 },
    { name: 'Tuberculosis', value: 8 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary-500" />
            National Health Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Aggregated diagnostics, clinical metrics, and capacity reporting across all districts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input py-1.5 text-sm"
            value={timePeriod}
            onChange={(e) => setTimePeriod(Number(e.target.value))}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Centers</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalCenters}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Bed Capacity</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalBeds}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registered Patients</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalPatients}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Consultations</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalConsultations}</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District comparisons */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400" />
            District Volume Comparison
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patientsCount" name="Total Patients Served" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bedOccupancy" name="Bed Occupancy (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease outbreak mapping */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            Disease Outbreak Distribution (%)
          </h2>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {diseaseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
