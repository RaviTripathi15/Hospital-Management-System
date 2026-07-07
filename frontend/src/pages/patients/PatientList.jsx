import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import patientService from '@/services/patientService'
import healthCenterService from '@/services/healthCenterService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronRight,
  Loader2,
  Phone,
  Calendar,
  Droplets,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { formatAge } from '@/utils/formatters'

export default function PatientList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin, isStaff } = usePermissions()

  const [patients, setPatients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [centers, setCenters] = useState([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [bloodGroupFilter, setBloodGroupFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')

  // Aggregated Stats
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    other: 0,
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

  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (genderFilter) params.gender = genderFilter
      if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter
      if (centerFilter) params.healthCenter = centerFilter
      params.limit = 100 // Fetch a solid batch for aggregation

      const response = await patientService.getAll(params)
      const data = response.data || response.results || response || []
      setPatients(data)

      // Calculate stats
      let m = 0, f = 0, o = 0
      data.forEach((p) => {
        if (p.gender === 'male') m++
        else if (p.gender === 'female') f++
        else o++
      })

      setStats({
        total: data.length,
        male: m,
        female: f,
        other: o,
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load patients list')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, genderFilter, bloodGroupFilter, centerFilter])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this patient record?')) return
    try {
      await patientService.delete(id)
      toast.success('Patient deleted successfully')
      fetchPatients()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete patient')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-500" />
            Patients Registry
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Browse and manage health records of patients registered across centers.
          </p>
        </div>
        {isStaff && (
          <Link
            to="/patients/add"
            className="btn btn-primary flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Registered</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <span className="text-sm font-semibold">M</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Male Patients</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.male}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <span className="text-sm font-semibold">F</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Female Patients</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.female}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <span className="text-sm font-semibold">O</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Other / Unspecified</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.other}</p>
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
            placeholder="Search by name, ID or phone..."
            className="input pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Gender Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Blood Group Filter */}
        <div className="relative">
          <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            className="input pl-9"
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
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

      {/* Patient List Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No patients found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Try adjusting your search criteria or register a new patient.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age / Gender</th>
                  <th>Contact Info</th>
                  <th>Blood Group</th>
                  <th>Center</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {patients.map((p) => {
                  const patientAge = p.dob ? formatAge(p.dob) : p.age;
                  return (
                    <tr
                      key={p._id}
                      onClick={() => navigate(`/patients/${p._id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {p.patientId}
                      </td>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{patientAge} yrs</span>
                          <Badge
                            color={p.gender === 'male' ? 'blue' : p.gender === 'female' ? 'purple' : 'gray'}
                            size="sm"
                          >
                            {p.gender}
                          </Badge>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {p.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.bloodGroup ? (
                          <Badge color="red" size="sm" className="font-semibold">
                            {p.bloodGroup}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-600 dark:text-gray-400">
                        {p.healthCenter?.name || 'Assigned Center'}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/patients/${p._id}`)}
                            className="p-1.5 text-gray-400 hover:text-primary-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          {isStaff && (
                            <button
                              onClick={(e) => handleDelete(p._id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Delete Patient"
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
