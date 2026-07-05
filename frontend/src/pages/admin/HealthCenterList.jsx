import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Building,
  Plus,
  Search,
  Filter,
  MapPin,
  Bed,
  Users,
  AlertCircle,
  Edit2,
  Trash2,
  Activity,
  Heart,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CENTER_TYPES, STATUS_COLORS } from '@/utils/constants'

export default function HealthCenterList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin } = usePermissions()

  const [centers, setCenters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Aggregated Stats
  const [stats, setStats] = useState({
    total: 0,
    phcCount: 0,
    chcCount: 0,
    totalBeds: 0,
    availableBeds: 0,
    totalDoctors: 0,
    totalStaff: 0,
    activeCount: 0,
  })

  const fetchCenters = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.operationalStatus = statusFilter
      params.limit = 100 // Fetch a substantial batch for local stats calculation

      const response = await healthCenterService.getAll(params)
      const data = response.data || response.results || response || []
      setCenters(data)

      // Calculate stats locally from the fetched batch
      let phc = 0, chc = 0, beds = 0, availBeds = 0, docs = 0, staff = 0, active = 0
      data.forEach((c) => {
        if (c.type === 'PHC') phc++
        if (c.type === 'CHC') chc++
        beds += c.totalBeds || c.bedCapacity || 0
        availBeds += c.availableBeds || 0
        docs += c.doctorCount || 0
        staff += c.staffCount || 0
        if (c.operationalStatus === 'active') active++
      })

      setStats({
        total: data.length,
        phcCount: phc,
        chcCount: chc,
        totalBeds: beds,
        availableBeds: availBeds,
        totalDoctors: docs,
        totalStaff: staff,
        activeCount: active,
      })
    } catch (err) {
      console.error(err)
      toast.error(t('common.error') || 'Failed to fetch health centers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [searchTerm, typeFilter, statusFilter])

  const handleDelete = async (id) => {
    if (!window.confirm(t('common.confirmDelete') || 'Are you sure you want to deactivate this center?')) {
      return
    }

    try {
      await healthCenterService.delete(id)
      toast.success(t('common.deleteSuccess') || 'Health center deactivated')
      fetchCenters()
    } catch (err) {
      console.error(err)
      toast.error('Failed to deactivate health center')
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'inactive':
        return 'bg-gray-150 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
      case 'under_maintenance':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'closed':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Health Center Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor, edit, and allocate staff to district primary healthcare centers
          </p>
        </div>
        {(isSuperAdmin || isDistrictAdmin) && (
          <Link
            to="/admin/centers/add"
            className="btn-primary inline-flex items-center gap-2 text-sm justify-center self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Health Center
          </Link>
        )}
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facilities Card */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Total Centers</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              PHC: {stats.phcCount} • CHC: {stats.chcCount}
            </span>
          </div>
        </div>

        {/* Beds Occupancy Card */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Bed Utilization</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalBeds - stats.availableBeds} / {stats.totalBeds}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              {stats.totalBeds > 0
                ? `${Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)}% beds occupied`
                : 'No bed capacity'}
            </span>
          </div>
        </div>

        {/* Medical Workforce Card */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Medical Force</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalDoctors + stats.totalStaff}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              Docs: {stats.totalDoctors} • Staff: {stats.totalStaff}
            </span>
          </div>
        </div>

        {/* Active Status Card */}
        <div className="card p-5 bg-white dark:bg-gray-800 relative overflow-hidden flex items-center gap-4">
          <div className="p-3.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Active Status</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeCount} / {stats.total}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
              {stats.total > 0
                ? `${Math.round((stats.activeCount / stats.total) * 100)}% operational`
                : 'No centers configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-4 bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by facility name or block..."
            className="input-field pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-48">
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Center Types</option>
            {CENTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <p className="text-sm">Loading health facilities...</p>
        </div>
      ) : centers.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No facilities found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        /* Visual Facilities Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((c) => (
            <div
              key={c._id}
              className="card bg-white dark:bg-gray-800 p-5 hover:shadow-elevated transition-all flex flex-col justify-between border-t-4 border-t-primary-500"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{c.name}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wider">
                      Reg: {c.registrationNumber || 'N/A'}
                    </p>
                  </div>
                  <span className={`badge border text-[10px] font-bold ${getStatusBadgeColor(c.operationalStatus)}`}>
                    {c.operationalStatus}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>Type: <strong className="text-gray-800 dark:text-gray-200">{c.type}</strong></span>
                  </div>

                  {/* Location info */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="line-clamp-1">{c.block}, {c.district}</span>
                  </div>

                  {/* Beds */}
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4 text-gray-400" />
                    <span>
                      Beds: <strong className="text-gray-800 dark:text-gray-200">{c.availableBeds} / {c.totalBeds} available</strong>
                    </span>
                  </div>

                  {/* Doctors / Staff */}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      Staff: <strong className="text-gray-800 dark:text-gray-200">{c.doctorCount} Doctors, {c.staffCount} Staff</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to={`/admin/centers/${c._id}`}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                >
                  View Profile
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <div className="flex gap-2">
                  {(isSuperAdmin || isDistrictAdmin) && (
                    <button
                      onClick={() => navigate(`/admin/centers/add?edit=${c._id}`)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit Center"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Deactivate Center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
