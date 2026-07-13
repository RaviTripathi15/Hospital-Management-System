import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, CheckCircle, XCircle, FileText, Download,
  ExternalLink, MessageSquare, Loader2, ArrowRight, User
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import roleRequestService from '@/services/roleRequestService'
import toast from 'react-hot-toast'

export default function RoleRequestsManager() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending') // 'pending', 'approved', 'rejected' or ''
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  
  // Action feedback states
  const [activeActionId, setActiveActionId] = useState(null) // ID of request being approved/rejected
  const [actionType, setActionType] = useState(null) // 'approve' or 'reject'
  const [feedbackText, setFeedbackText] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  const fetchRequests = async (page = 1) => {
    setIsLoading(true)
    try {
      const res = await roleRequestService.getAllRequests({
        status: statusFilter,
        page,
        limit: pagination.limit
      })
      const data = res.data || res
      setRequests(data.requests || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load role requests.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests(1)
  }, [statusFilter])

  const handleActionClick = (id, type) => {
    setActiveActionId(id)
    setActionType(type)
    setFeedbackText('')
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    if (!activeActionId) return

    setIsActionSubmitting(true)
    try {
      if (actionType === 'approve') {
        await roleRequestService.approveRequest(activeActionId, feedbackText.trim() || 'Approved by administrator.')
        toast.success('Role request approved successfully.')
      } else {
        await roleRequestService.rejectRequest(activeActionId, feedbackText.trim() || 'Rejected by administrator.')
        toast.success('Role request rejected successfully.')
      }
      
      // Reset state
      setActiveActionId(null)
      setActionType(null)
      setFeedbackText('')

      // Reload
      fetchRequests(pagination.page)
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to process request.')
    } finally {
      setIsActionSubmitting(false)
    }
  }

  const getDocUrl = (path) => {
    if (!path) return '#'
    const base = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin)
    return `${base}${path}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Switch Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Review, verify, and approve user access elevation requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-2">
        {[
          { value: 'pending', label: 'Pending Requests' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
          { value: '', label: 'All History' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
              statusFilter === tab.value
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 space-y-3">
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-full text-gray-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-850 dark:text-gray-200">No requests found</p>
              <p className="text-xs text-gray-400 dark:text-gray-550 mt-1">There are no role requests matching this filter</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((request) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* User Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-650 flex items-center justify-center font-bold">
                      {request.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{request.user?.name || 'Unknown User'}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{request.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Switch details */}
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                      {request.user?.role?.replace('_', ' ') || 'citizen'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-450" />
                    <span className="badge bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 uppercase font-bold">
                      {request.requestedRole?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Verification Document Details */}
                {request.requestedRole !== 'citizen' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-l border-gray-100 dark:border-gray-700 pl-6 flex-1 min-w-[280px]">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Employee ID</span>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{request.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Hospital Code</span>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{request.hospitalCode || 'N/A'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Document</span>
                      <div className="mt-0.5">
                        {request.verificationDoc ? (
                          <a
                            href={getDocUrl(request.verificationDoc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View File
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-700 pl-6 justify-end">
                  {request.status === 'pending' ? (
                    <>
                      {activeActionId === request._id ? (
                        <form onSubmit={handleActionSubmit} className="flex flex-col gap-2 min-w-[200px]">
                          <input
                            type="text"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder={`Feedback for ${actionType}...`}
                            className="input text-xs py-1.5 px-3 w-full"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionId(null)
                                setActionType(null)
                              }}
                              className="text-[11px] font-bold text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isActionSubmitting}
                              className={`btn py-1 px-3 text-[11px] font-bold text-white flex items-center gap-1 ${
                                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-650 hover:bg-red-700'
                              }`}
                            >
                              {isActionSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                              Confirm {actionType === 'approve' ? 'Approve' : 'Reject'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActionClick(request._id, 'reject')}
                            className="btn bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 hover:dark:bg-red-950/45 py-2 px-4 text-xs font-bold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleActionClick(request._id, 'approve')}
                            className="btn bg-green-50 hover:bg-green-100 text-green-650 dark:bg-green-950/20 dark:text-green-400 hover:dark:bg-green-950/45 py-2 px-4 text-xs font-bold"
                          >
                            Approve
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      {request.status === 'approved' ? (
                        <div className="flex items-center gap-1.5 text-green-500 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          <span>Approved</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-500 font-semibold">
                          <XCircle className="w-4 h-4" />
                          <span>Rejected</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => fetchRequests(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="btn bg-gray-100 dark:bg-gray-700 text-xs py-2 px-4 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchRequests(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="btn bg-gray-100 dark:bg-gray-700 text-xs py-2 px-4 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
