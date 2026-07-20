import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import reportService from '@/services/reportService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  User,
  AlertTriangle,
  Clock,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isStaff, isDistrictAdmin, isSuperAdmin } = usePermissions()

  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchReportDetails = async () => {
    setIsLoading(true)
    try {
      const response = await reportService.getById(id)
      setReport(response.data || response)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load report details')
      navigate('/reports')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReportDetails()
  }, [id])

  const handleSubmitReport = async () => {
    if (!window.confirm('Are you sure you want to submit this report? It cannot be edited after submission.')) return
    setIsUpdating(true)
    try {
      await reportService.submit(id)
      toast.success('Report submitted successfully')
      fetchReportDetails()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit report')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    const comments = window.prompt('Add any approval comments (optional):')
    if (comments === null) return // cancelled prompt
    setIsUpdating(true)
    try {
      await reportService.approve(id, comments || 'Approved')
      toast.success('Report approved')
      fetchReportDetails()
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve report')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async () => {
    const reason = window.prompt('Specify the reason for rejection (required):')
    if (!reason) {
      if (reason === '') toast.error('Rejection reason is required')
      return // cancelled or empty
    }
    setIsUpdating(true)
    try {
      await reportService.reject(id, reason)
      toast.success('Report rejected')
      fetchReportDetails()
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject report')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!report) return null

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

  const metrics = report.metrics || {}

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {report.reportType} Report
              </h1>
              {getStatusBadge(report.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Health Center: {report.healthCenter?.name || 'Assigned Center'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core metrics overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrics Card */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
              Reported Metrics
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Patients Served</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.patientsServed || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">New Registrations</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.newPatients || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Emergency Cases</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.emergencyCases || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Outward Referrals</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.referralsMade || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Completed Appts</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.appointmentsCompleted || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Cancelled Appts</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.appointmentsCancelled || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Low Stock Alerts</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {metrics.lowStockAlerts || 0}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500">Outbreak Alerts</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {metrics.outbreakAlerts || 0}
                </p>
              </div>
            </div>

            {/* Notes */}
            {report.notes && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Remarks / Notes
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                  "{report.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Rejection notice if rejected */}
          {report.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">
                  Report Rejected
                </h4>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Reason: "{report.rejectionReason || 'No details provided'}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status / metadata & Controls */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Report Metadata
            </h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Period Covered</p>
                  <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5 text-xs">
                    {report.period?.startDate ? format(new Date(report.period.startDate), 'PP') : '—'} to{' '}
                    {report.period?.endDate ? format(new Date(report.period.endDate), 'PP') : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Prepared By</p>
                  <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5">
                    {report.submittedBy?.name || 'Automated Engine'}
                  </p>
                </div>
              </div>

              {report.approvedBy && (
                <div className="flex items-start gap-3 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Reviewed By</p>
                    <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5">
                      {report.approvedBy.name}
                    </p>
                    {report.approvedAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Approved: {format(new Date(report.approvedAt), 'PP')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Action Center
            </h2>

            {/* Submission draft logic */}
            {report.status === 'draft' && isStaff && (
              <button
                onClick={handleSubmitReport}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-2"
                disabled={isUpdating}
              >
                <Send className="w-4 h-4" /> Submit Report
              </button>
            )}

            {/* Approver role checks (Admins only review submitted reports) */}
            {report.status === 'submitted' && (isDistrictAdmin || isSuperAdmin) && (
              <>
                <button
                  onClick={handleApprove}
                  className="w-full btn btn-primary bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 border-none flex items-center justify-center gap-2 py-2"
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4" /> Approve Report
                </button>
                <button
                  onClick={handleReject}
                  className="w-full btn btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-2 py-2"
                  disabled={isUpdating}
                >
                  <XCircle className="w-4 h-4" /> Request Changes
                </button>
              </>
            )}

            {/* Inactive state placeholders */}
            {report.status === 'approved' && (
              <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-3 rounded-lg text-center font-medium">
                This report is approved and locked.
              </div>
            )}
            {report.status === 'rejected' && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-lg text-center font-medium">
                This report was rejected. Staff must recreate or update.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
