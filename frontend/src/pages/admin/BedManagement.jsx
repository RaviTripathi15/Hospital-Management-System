import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import bedService from '@/services/bedService'
import healthCenterService from '@/services/healthCenterService'
import patientService from '@/services/patientService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Activity,
  Plus,
  Search,
  Building,
  Users,
  AlertTriangle,
  Loader2,
  Calendar,
  LogOut,
  CheckCircle,
  Clock,
  Briefcase,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const WARDS = ['General Ward', 'Male Ward', 'Female Ward', 'ICU', 'Emergency', 'Pediatrics Ward']
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function BedManagement() {
  const { t } = useTranslation()
  const { isSuperAdmin, isDistrictAdmin, user } = usePermissions()

  const [centers, setCenters] = useState([])
  const [selectedCenterId, setSelectedCenterId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Stats & Tables
  const [stats, setStats] = useState({
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    occupancyRate: 0,
    wardBreakdown: [],
  })
  const [activeAllocations, setActiveAllocations] = useState([])
  const [historyAllocations, setHistoryAllocations] = useState([])
  const [activeTab, setActiveTab] = useState('current') // current | history

  // Allocation Form States
  const [searchPatientQuery, setSearchPatientQuery] = useState('')
  const [searchedPatients, setSearchedPatients] = useState([])
  const [isSearchingPatients, setIsSearchingPatients] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  const [bedNumber, setBedNumber] = useState('')
  const [wardName, setWardName] = useState('General Ward')
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false)

  const fetchCenters = async () => {
    try {
      const response = await healthCenterService.getAll({ limit: 100 })
      const data = response.data || response.results || response || []
      setCenters(data)
      
      // Auto select center
      if (user?.healthCenter) {
        setSelectedCenterId(user.healthCenter._id || user.healthCenter)
      } else if (data.length > 0) {
        setSelectedCenterId(data[0]._id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBedData = async () => {
    if (!selectedCenterId) return
    setIsLoading(true)
    try {
      const params = { healthCenter: selectedCenterId }
      const [statsRes, activeRes, historyRes] = await Promise.all([
        bedService.getStats(params),
        bedService.getActive(params),
        bedService.getHistory(params),
      ])

      setStats(statsRes.data || statsRes)
      setActiveAllocations(activeRes.data || activeRes.results || activeRes || [])
      setHistoryAllocations(historyRes.data || historyRes.results || historyRes || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load bed capacity stats')
    } finally {
      setIsLoading(false)
    }
  }

  // Live search registered patients
  const handleSearchPatients = async (query) => {
    setSearchPatientQuery(query)
    if (query.trim().length < 2) {
      setSearchedPatients([])
      return
    }

    setIsSearchingPatients(true)
    try {
      const params = { search: query, limit: 10 }
      // If staff, scope to their center patients
      if (user?.healthCenter) {
        params.healthCenter = user.healthCenter._id || user.healthCenter
      }
      const response = await patientService.getAll(params)
      const data = response.data || response.results || response || []
      setSearchedPatients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearchingPatients(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [user])

  useEffect(() => {
    if (selectedCenterId) {
      fetchBedData()
      // Reset form on center switch
      setSelectedPatient(null)
      setSearchPatientQuery('')
      setBedNumber('')
    }
  }, [selectedCenterId])

  const handleAllocate = async (e) => {
    e.preventDefault()
    if (!selectedPatient) {
      toast.error('Please search and select a patient first')
      return
    }
    if (!bedNumber.trim()) {
      toast.error('Please enter a bed number')
      return
    }

    setIsSubmittingAllocation(true)
    try {
      const payload = {
        patient: selectedPatient._id,
        healthCenter: selectedCenterId,
        bedNumber: bedNumber.trim(),
        wardName,
      }

      await bedService.allocate(payload)
      toast.success('Patient admitted & bed allocated')
      
      // Reset allocation form states
      setSelectedPatient(null)
      setSearchPatientQuery('')
      setBedNumber('')
      
      // Re-fetch datasets
      fetchBedData()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to allocate bed')
    } finally {
      setIsSubmittingAllocation(false)
    }
  }

  const handleRelease = async (allocationId) => {
    if (!window.confirm('Are you sure you want to release this bed allocation?')) {
      return
    }

    try {
      await bedService.release(allocationId)
      toast.success('Bed released successfully')
      fetchBedData()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to release bed')
    }
  }

  // Pie chart data
  const pieData = [
    { name: 'Occupied', value: stats.occupiedBeds },
    { name: 'Available', value: stats.availableBeds },
  ].filter((d) => d.value > 0)

  // Fallback if empty to draw a complete circle
  const visualPieData = pieData.length > 0 ? pieData : [{ name: 'Empty Capacity', value: 1 }]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Admissions & Bed Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time ward tracking, bed allocation maps, occupancy warnings, and release audits
          </p>
        </div>

        {/* Center Select Dropdown */}
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
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beds */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Beds</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBeds}</span>
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Occupied Beds</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.occupiedBeds}</span>
          </div>
        </div>

        {/* Available Beds */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Available Beds</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.availableBeds}</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Occupancy Rate</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.occupancyRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Allocation & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admit Patient Panel (Left) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-400" />
              Admit Patient (Bed Allocation)
            </h3>

            <form onSubmit={handleAllocate} className="space-y-4">
              {/* Search Patient */}
              <div className="relative">
                <label className="label text-xs">Search Patient Name / ID</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Type name, phone, patientId..."
                    className="input-field text-xs pl-9 py-2"
                    value={searchPatientQuery}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                  />
                  {isSearchingPatients && (
                    <span className="absolute right-3 top-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </span>
                  )}
                </div>

                {/* Patient Search Results */}
                {searchedPatients.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {searchedPatients.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p)
                          setSearchPatientQuery(p.name)
                          setSearchedPatients([])
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white block">{p.name}</span>
                        <span className="text-gray-400 text-[10px]">ID: {p.patientId} | Age: {p.age}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Patient Banner */}
              {selectedPatient && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-blue-700 dark:text-blue-400">Selected Patient:</p>
                  <p className="text-gray-700 dark:text-gray-300">Name: {selectedPatient.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[10px]">ID: {selectedPatient.patientId}</p>
                </div>
              )}

              {/* Ward name */}
              <div>
                <label className="label text-xs" htmlFor="ward">
                  Select Ward
                </label>
                <select
                  id="ward"
                  className="input-field text-xs mt-1"
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Number */}
              <div>
                <label className="label text-xs" htmlFor="bedNum">
                  Bed Designation / Number
                </label>
                <input
                  id="bedNum"
                  type="text"
                  placeholder="e.g. Bed-12, ICU-04"
                  className="input-field text-xs mt-1"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  required
                />
              </div>

              {/* Submit Allocation */}
              <button
                type="submit"
                disabled={isSubmittingAllocation || stats.availableBeds <= 0}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-xs"
              >
                {isSubmittingAllocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  'Allocate Bed'
                )}
              </button>

              {stats.availableBeds <= 0 && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Bed capacity is fully exhausted. Release beds to accept new admissions.</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Charts and Visualizers (Right) */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 text-gray-500 card">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
              <p className="text-sm">Calculating bed stats...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Occupancy Rate */}
              <div className="card p-5 space-y-3 flex flex-col items-center justify-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block text-center self-start">
                  Bed Occupancy Ratio
                </h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visualPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    Occupied: {stats.occupiedBeds}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                    Available: {stats.availableBeds}
                  </span>
                </div>
              </div>

              {/* Ward Occupied Count */}
              <div className="card p-5 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Ward-wise Occupancy
                </h4>
                <div className="h-44 w-full">
                  {stats.wardBreakdown.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                      No active admissions
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.wardBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="wardName" stroke="#9ca3af" fontSize={8} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="occupied" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Occupied Beds" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-6">
        <button
          onClick={() => setActiveTab('current')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'current' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Admitted Patients
          {activeTab === 'current' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all relative ${
            activeTab === 'history' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Admissions History Log
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600" />
          )}
        </button>
      </div>

      {/* Admitted Patient Tables */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <p className="text-sm">Loading records...</p>
        </div>
      ) : activeTab === 'current' ? (
        activeAllocations.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">All beds are free</p>
            <p className="text-sm text-gray-400 mt-1">There are no currently admitted patients at this center.</p>
          </div>
        ) : (
          <div className="card bg-white dark:bg-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-150 dark:border-gray-700">
                    <th className="table-header">Patient</th>
                    <th className="table-header">Ward Location</th>
                    <th className="table-header">Bed Number</th>
                    <th className="table-header">Admission Date</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activeAllocations.map((alloc) => (
                    <tr key={alloc._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10">
                      <td className="table-cell">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {alloc.patient?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            ID: {alloc.patient?.patientId || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell font-medium text-gray-700 dark:text-gray-300">
                        {alloc.wardName}
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400">
                          {alloc.bedNumber}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(alloc.allocatedAt).toLocaleString()}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <button
                          onClick={() => handleRelease(alloc._id)}
                          className="btn-secondary py-1 px-3 text-xs inline-flex items-center gap-1.5 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Release Bed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : historyAllocations.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No historical logs found</p>
        </div>
      ) : (
        <div className="card bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-150 dark:border-gray-700">
                  <th className="table-header">Patient</th>
                  <th className="table-header">Ward Location</th>
                  <th className="table-header">Bed Number</th>
                  <th className="table-header">Admitted</th>
                  <th className="table-header">Released</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {historyAllocations.map((alloc) => (
                  <tr key={alloc._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/10">
                    <td className="table-cell">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {alloc.patient?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          ID: {alloc.patient?.patientId || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600 dark:text-gray-400">{alloc.wardName}</td>
                    <td className="table-cell text-xs font-mono">{alloc.bedNumber}</td>
                    <td className="table-cell text-xs text-gray-500 dark:text-gray-400">
                      {new Date(alloc.allocatedAt).toLocaleString()}
                    </td>
                    <td className="table-cell text-xs text-gray-500 dark:text-gray-400">
                      {alloc.releasedAt ? new Date(alloc.releasedAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
