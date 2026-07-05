import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock3, AlertTriangle, CheckCircle2, LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { attendanceService } from '@/services/attendanceService'
import toast from 'react-hot-toast'

export default function DoctorAttendance() {
  const { user } = useAuthStore()
  const [record, setRecord] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    healthCenter: user?.healthCenter?._id || user?.healthCenter || '',
    status: 'present',
    loginTime: '',
    logoutTime: '',
    notes: '',
  })

  const loadData = async () => {
    try {
      const [todayResponse, monthlyResponse] = await Promise.all([
        attendanceService.getMyAttendance(),
        attendanceService.getMonthlyReport({ month: new Date().toISOString().slice(0, 7) }),
      ])
      setRecord(todayResponse?.data?.data || null)
      setReport(monthlyResponse?.data?.data || null)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = {
        healthCenter: form.healthCenter || user?.healthCenter?._id || user?.healthCenter,
        status: form.status,
        loginTime: form.loginTime ? new Date(form.loginTime).toISOString() : undefined,
        logoutTime: form.logoutTime ? new Date(form.logoutTime).toISOString() : undefined,
        notes: form.notes,
      }
      await attendanceService.markAttendance(payload)
      toast.success('Attendance recorded successfully')
      await loadData()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save attendance')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => report?.summary || null, [report])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-600">Doctor attendance</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage daily check-in and attendance tracking</h1>
          </div>
          <div className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {user?.name || 'Doctor'} • {user?.healthCenter?.name || 'Center'}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark attendance</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half day</option>
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Health center
              <input
                value={form.healthCenter}
                onChange={(event) => setForm({ ...form, healthCenter: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Center ID"
              />
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Login time
              <input
                type="datetime-local"
                value={form.loginTime}
                onChange={(event) => setForm({ ...form, loginTime: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Logout time
              <input
                type="datetime-local"
                value={form.logoutTime}
                onChange={(event) => setForm({ ...form, logoutTime: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              rows="3"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional note for late entry or leave"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save attendance'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's status</h2>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
              <p className="text-sm text-gray-500">Current status</p>
              <p className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{record?.status || 'Not marked'}</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Login: {record?.loginTime ? new Date(record.loginTime).toLocaleString() : '—'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Logout: {record?.logoutTime ? new Date(record.logoutTime).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly summary</h2>
            </div>
            {summary ? (
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                  <span>Present days</span>
                  <span className="font-semibold">{summary.presentDays}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                  <span>Late entries</span>
                  <span className="font-semibold">{summary.lateDays}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                  <span>Absent days</span>
                  <span className="font-semibold">{summary.absentDays}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                  <span>Attendance rate</span>
                  <span className="font-semibold">{summary.attendanceRate}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No monthly report yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alerts</h2>
        </div>
        {report?.alerts?.length ? (
          <div className="space-y-3">
            {report.alerts.map((alert, index) => (
              <div key={`${alert.date}-${index}`} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <span>{new Date(alert.date).toLocaleDateString()} • {alert.status}</span>
                <span className="font-semibold">{alert.doctor}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No late-entry or absence alerts for this month.</p>
        )}
      </div>
    </div>
  )
}
