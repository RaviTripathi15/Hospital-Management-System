import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import appointmentService from '@/services/appointmentService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'

export default function AppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isStaff } = usePermissions()

  const [appointment, setAppointment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchAppointmentDetails = async () => {
    setIsLoading(true)
    try {
      const response = await appointmentService.getById(id)
      setAppointment(response.data || response)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load appointment details')
      navigate('/appointments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointmentDetails()
  }, [id])

  const handleUpdateStatus = async (newStatus) => {
    let reason = ''
    if (newStatus === 'cancelled') {
      reason = window.prompt('Please enter the reason for cancellation:')
      if (reason === null) return // cancelled prompt
    }

    setIsUpdating(true)
    try {
      if (newStatus === 'cancelled') {
        await appointmentService.cancel(id, reason || 'Cancelled by staff')
      } else {
        await appointmentService.update(id, { status: newStatus })
      }
      toast.success(`Appointment status updated to ${newStatus}`)
      fetchAppointmentDetails()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
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

  if (!appointment) return null

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/appointments')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Appointment Details
              </h1>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-mono mt-1">
              Token Number: #{appointment.tokenNumber || '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-850 pb-2">
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Patient Name</p>
                <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5">
                  {appointment.patient?.name || 'Unnamed Patient'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Patient ID</p>
                <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5 font-mono text-xs">
                  {appointment.patient?.patientId || '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Age / Gender</p>
                <p className="font-medium text-gray-800 dark:text-gray-300 mt-0.5">
                  {appointment.patient?.age || '—'} years / {appointment.patient?.gender || '—'}
                </p>
              </div>
              {appointment.patient?.phone && (
                <div>
                  <p className="text-gray-400 text-xs">Phone Number</p>
                  <p className="font-medium text-gray-800 dark:text-gray-300 mt-0.5">
                    {appointment.patient.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Symptoms / Notes */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-850 space-y-3">
              <div>
                <p className="text-gray-400 text-xs">Consultation Type</p>
                <p className="font-semibold text-primary-600 dark:text-primary-400 mt-0.5 text-sm">
                  {appointment.type || 'General OPD'}
                </p>
              </div>

              {appointment.symptoms && appointment.symptoms.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Symptoms Reported</p>
                  <div className="flex flex-wrap gap-1.5">
                    {appointment.symptoms.map((s, idx) => (
                      <Badge key={idx} color="gray">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <p className="text-gray-400 text-xs">Special Instructions / Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation reason if cancelled */}
          {appointment.status === 'cancelled' && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">
                  Appointment Cancelled
                </h4>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Reason: "{appointment.cancellationReason || 'No reason provided'}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Time Slot & Doctor / Actions */}
        <div className="space-y-6">
          {/* Scheduling Details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Schedule & Location
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5">
                    {appointment.date ? format(new Date(appointment.date), 'PPPP') : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Time Slot</p>
                  <p className="font-semibold text-gray-950 dark:text-gray-200 mt-0.5">
                    {appointment.timeSlot}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Health Center</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-300 mt-0.5 text-xs">
                    {appointment.healthCenter?.name || 'Assigned Center'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Assigned Professional
            </h2>
            {appointment.doctor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                    Dr
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {appointment.doctor.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">Medical Officer</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-850">
                  {appointment.doctor.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {appointment.doctor.phone}
                    </p>
                  )}
                  {appointment.doctor.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> {appointment.doctor.email}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Any available duty doctor will be assigned at the time of visit.
              </p>
            )}
          </div>

          {/* Actions panel */}
          {isStaff && appointment.status === 'scheduled' && (
            <div className="card p-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Consultation Controls
              </h2>
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-2"
                disabled={isUpdating}
              >
                <Activity className="w-4 h-4" /> Start Consultation
              </button>
              <button
                onClick={() => handleUpdateStatus('completed')}
                className="w-full btn btn-secondary text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-green-50 dark:hover:bg-green-950/20 flex items-center justify-center gap-2 py-2"
                disabled={isUpdating}
              >
                <CheckCircle className="w-4 h-4" /> Complete Appointment
              </button>
              <button
                onClick={() => handleUpdateStatus('cancelled')}
                className="w-full btn btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-2 py-2"
                disabled={isUpdating}
              >
                <XCircle className="w-4 h-4" /> Cancel Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
