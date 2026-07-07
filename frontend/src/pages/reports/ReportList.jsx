import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import reportService from '@/services/reportService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  User,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

export default function ReportList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin, isStaff } = usePermissions()

  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [centers, setCenters] = useState([])

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')

  // Aggregated Stats
  const [stats, setStats] = useState({
    drafts: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
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

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.reportType = typeFilter
      if (centerFilter) params.healthCenter = centerFilter
      params.limit = 100

      const response = await reportService.getAll(params)
      const data = response.data || response.results || response || []
      setReports(data)

      // Calculate stats
      let d = 0, s = 0, a = 0, r = 0
      data.forEach((rep) => {
        if (rep.status === 'draft') d++
        else if (rep.status === 'submitted') s++
        else if (rep.status === 'approved') a++
        else if (rep.status === 'rejected') r++
      })

      setStats({
        drafts: d,
        submitted: s,
        approved: a,
        rejected: r,
        total: data.length,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [statusFilter, typeFilter, centerFilter])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this report draft?')) return
    try {
      await reportService.delete(id)
      toast.success('Report deleted successfully')
      fetchReports()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete report')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <Badge color="gray">Draft</Badge>
      case 'submitted':
        return <Badge color="blue">Submitted</Badge>
      case 'approved':
        return <Badge color="green">Approved</Badge>
      case 'rejected':
        return <Badge color="red">Rejected</Badge>
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
            <FileText className="w-6 h-6 text-primary-500" />
            Operational Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Submit monthly and daily statistics, manage disease outbreak summaries, and request approvals.
          </p>
        </div>
        {isStaff && (
          <Link
            to="/reports/create"
            className="btn btn-primary flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Reports</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Drafts</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.drafts}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.submitted}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Approved</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.approved}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rejected</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Report Types</option>
            <option value="daily">Daily report</option>
            <option value="weekly">Weekly report</option>
            <option value="monthly">Monthly report</option>
            <option value="outbreak">Disease Outbreak</option>
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

      {/* Reports Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No reports found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Try adjusting filters or create a new operational report.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Health Center</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map((rep) => {
                  const startDateStr = rep.period?.startDate ? format(new Date(rep.period.startDate), 'PP') : '—'
                  const endDateStr = rep.period?.endDate ? format(new Date(rep.period.endDate), 'PP') : '—'
                  const submitName = rep.submittedBy?.name || 'Automated'

                  return (
                    <tr
                      key={rep._id}
                      onClick={() => navigate(`/reports/${rep._id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td>
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {rep.reportType} report
                        </span>
                        {rep.isAutoGenerated && (
                          <span className="ml-2 text-[10px] bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                            Auto
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {rep.healthCenter?.name || 'Assigned Center'}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {startDateStr} - {endDateStr}
                        </div>
                      </td>
                      <td>{getStatusBadge(rep.status)}</td>
                      <td>
                        <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {submitName}
                        </div>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/reports/${rep._id}`)}
                            className="btn btn-secondary px-2.5 py-1 text-xs"
                          >
                            View
                          </button>
                          {rep.status === 'draft' && isStaff && (
                            <button
                              onClick={(e) => handleDelete(rep._id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-4 h-4" />
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
