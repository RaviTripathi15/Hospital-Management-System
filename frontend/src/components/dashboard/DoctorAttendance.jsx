import React, { useState } from 'react'
import { UserCheck, UserX, Clock, Search, Calendar } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils/cn'

export default function DoctorAttendance({ attendance = [] }) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('today')

  // Mock data
  const mockAttendance = [
    { id: 1, name: 'Dr. Sharma', department: 'General Medicine', status: 'present', checkIn: '08:45', checkOut: '17:30', patients: 24 },
    { id: 2, name: 'Dr. Patel', department: 'Pediatrics', status: 'present', checkIn: '09:00', checkOut: null, patients: 18 },
    { id: 3, name: 'Dr. Kumar', department: 'Surgery', status: 'late', checkIn: '10:15', checkOut: null, patients: 12 },
    { id: 4, name: 'Dr. Singh', department: 'Orthopedics', status: 'absent', checkIn: null, checkOut: null, patients: 0 },
    { id: 5, name: 'Dr. Verma', department: 'Gynecology', status: 'present', checkIn: '08:30', checkOut: '16:45', patients: 22 },
    { id: 6, name: 'Dr. Gupta', department: 'Cardiology', status: 'present', checkIn: '09:15', checkOut: null, patients: 15 },
  ]

  const displayAttendance = attendance.length > 0 ? attendance : mockAttendance

  const filteredAttendance = displayAttendance.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const presentCount = displayAttendance.filter(d => d.status === 'present').length
  const lateCount = displayAttendance.filter(d => d.status === 'late').length
  const absentCount = displayAttendance.filter(d => d.status === 'absent').length
  const totalDoctors = displayAttendance.length
  const attendanceRate = ((presentCount / totalDoctors) * 100).toFixed(0)

  const getStatusConfig = (status) => {
    switch (status) {
      case 'present':
        return { icon: UserCheck, color: 'bg-green-100 text-green-600', label: 'Present' }
      case 'late':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-600', label: 'Late' }
      case 'absent':
        return { icon: UserX, color: 'bg-red-100 text-red-600', label: 'Absent' }
      default:
        return { icon: UserCheck, color: 'bg-gray-100 text-gray-600', label: 'Unknown' }
    }
  }

  return (
    <Card title={t('dashboard.activeStaff')} className="animate-fade-in">
      {/* Search and Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Present</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lateCount}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Late</p>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Absent</p>
        </div>
        <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{attendanceRate}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Rate</p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredAttendance.map((doctor) => {
          const statusConfig = getStatusConfig(doctor.status)
          const StatusIcon = statusConfig.icon
          return (
            <div
              key={doctor.id}
              className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', statusConfig.color)}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{doctor.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Check In</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.checkIn || '--:--'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Patients</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.patients}</p>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full', statusConfig.color)}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
