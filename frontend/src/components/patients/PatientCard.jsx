import React from 'react'
import { Link } from 'react-router-dom'
import { User, Phone, Calendar, Droplets } from 'lucide-react'
import { formatDate, formatAge, getInitials } from '@/utils/formatters'
import Badge from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export default function PatientCard({ patient, onClick }) {
  const name = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unnamed Patient'
  const age = patient.dob ? formatAge(patient.dob) : patient.age
  const contact = patient.phone || patient.contact

  return (
    <div
      className="card p-4 hover:shadow-elevated transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm flex-shrink-0">
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{name}</p>
            <Badge color={patient.gender === 'male' ? 'blue' : patient.gender === 'female' ? 'purple' : 'gray'} size="sm">
              {patient.gender}
            </Badge>
          </div>
          <div className="mt-1.5 space-y-1">
            {contact && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Phone className="w-3 h-3" />
                {contact}
              </div>
            )}
            {age !== undefined && age !== null && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                Age: {age} years
              </div>
            )}
            {patient.bloodGroup && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Droplets className="w-3 h-3" />
                {patient.bloodGroup}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
