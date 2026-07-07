import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import appointmentService from '@/services/appointmentService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  User,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

export default function AppointmentList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin, isStaff } = usePermissions()

  const [appointments, setAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [centers, setCenters] = useState([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')

  // Aggregated Stats
  const [stats, setStats] = useState({
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  })

  const fetchCenters = async () => {
    if (!isSuperAdmin && !isDistrictAdmin) return
    try {
      const response = await healthCenterService.getAll({ limit: 100 })
      const data = response.data || response.results || response || []
      setCenters(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      if (centerFilter) params.healthCenter = centerFilter
      params.limit = 100

      const response = await appointmentService.getAll(params)
      const data = response.data || response.results || response || []
      setAppointments(data)

      // Calculate stats
      let sch = 0, comp = 0, canc = 0
      data.forEach((a) => {
        if (a.status === 'scheduled') sch++
        else if (a.status === 'completed') comp++
        else if (a.status === 'cancelled') canc++
      })

      setStats({
        scheduled: sch,
        completed: comp,
        cancelled: canc,
        total: data.length,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, typeFilter, centerFilter])

  const handleCancel = async (id, e) => {
    e.stopPropagation()
    const reason = window.prompt('Please enter the reason for cancellation:')
    if (reason === null) return // user pressed cancel on prompt
    try {
      await appointmentService.cancel(id, reason || 'Cancelled by staff')
      toast.success('Appointment cancelled')
      fetchAppointments()
    } catch (err) {
      console.error(err)
      toast.error('Failed to cancel appointment')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge color="blue">Scheduled</Badge>
      case 'completed':
        return <Badge color="green">Completed</Badge>
      case 'cancelled':
        return <Badge color="red">Cancelled</Badge>
      case 'in_progress':
        return <Badge color="orange">In Progress</Badge>
      default:
        return <Badge color="gray">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-500" />
            Appointments Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Track and schedule consultations for doctors and outpatient departments.
          </p>
        </div>
        <Link
          to="/appointments/book"
          className="btn btn-primary flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Bookings</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.scheduled}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.completed}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or doctor..."
            className="input pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Consultation Types</option>
            <option value="OPD">General OPD</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Emergency">Emergency</option>
            <option value="Gynaecology">Gynaecology</option>
            <option value="Dental">Dental</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {/* Center Filter (Admins only) */}
        {(isSuperAdmin || isDistrictAdmin) && (
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              className="input pl-9"
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
            >
              <option value="">All Health Centers</option>
              {centers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Appointment Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No appointments found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Try adjusting your search criteria or book a new appointment.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {appointments.map((a) => {
                  const patientName = a.patient?.name || 'Unnamed Patient'
                  const doctorName = a.doctor?.name || 'Any Available Doctor'
                  const formattedDate = a.date ? format(new Date(a.date), 'PP') : '—'

                  return (
                    <tr
                      key={a._id}
                      onClick={() => navigate(`/appointments/${a._id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          #{a.tokenNumber || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-gray-900 dark:text-white">{patientName}</div>
                        {a.patient?.patientId && (
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{a.patient.patientId}</div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {doctorName}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {formattedDate}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {a.timeSlot}
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {a.type}
                        </span>
                      </td>
                      <td>{getStatusBadge(a.status)}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/appointments/${a._id}`)}
                            className="btn btn-secondary px-2.5 py-1 text-xs"
                          >
                            Details
                          </button>
                          {a.status === 'scheduled' && isStaff && (
                            <button
                              onClick={(e) => handleCancel(a._id, e)}
                              className="btn btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
