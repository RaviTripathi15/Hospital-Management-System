import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import healthCenterService from '@/services/healthCenterService'
import api from '@/services/api'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Building,
  MapPin,
  Phone,
  Mail,
  Bed,
  Users,
  User,
  Plus,
  Trash2,
  Edit,
  Activity,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet marker icons issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function HealthCenterDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { isSuperAdmin, isDistrictAdmin } = usePermissions()

  const [center, setCenter] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Dynamically inject Leaflet CSS style sheet
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  const fetchCenter = async () => {
    setIsLoading(true)
    try {
      const response = await healthCenterService.getById(id)
      setCenter(response.data || response)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load facility profile')
      navigate('/admin/centers')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnassignedUsers = async () => {
    if (!isSuperAdmin && !isDistrictAdmin) return
    try {
      // Fetch users to populate staff allocation dropdown
      const response = await api.get('/users', { params: { limit: 100 } })
      const usersData = response.data?.data || response.data || response || []
      
      // Filter out users who are already in this center's staff
      const staffIds = center?.staff?.map((s) => s._id.toString()) || []
      const filtered = usersData.filter(
        (u) => !staffIds.includes(u._id.toString()) && ['staff', 'doctor', 'nurse'].includes(u.role)
      )
      setAllUsers(filtered)
    } catch (err) {
      console.error('Failed to fetch users', err)
    }
  }

  useEffect(() => {
    fetchCenter()
  }, [id])

  useEffect(() => {
    if (center) {
      fetchUnassignedUsers()
    }
  }, [center])

  const handleAssignStaff = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    
    setIsAssigning(true)
    try {
      await healthCenterService.assignStaff(id, selectedUserId)
      toast.success('Staff assigned successfully')
      setSelectedUserId('')
      fetchCenter()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to assign staff')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveStaff = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this staff member from this center?')) {
      return
    }

    try {
      await healthCenterService.removeStaff(id, userId)
      toast.success('Staff removed successfully')
      fetchCenter()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to remove staff')
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-sm">Loading health facility profile...</p>
      </div>
    )
  }

  if (!center) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Center not found</p>
        <Link to="/admin/centers" className="btn-primary mt-4 inline-flex">Go back to centers</Link>
      </div>
    )
  }

  const hasCoordinates = center.coordinates?.lat && center.coordinates?.lng
  const mapCenter = hasCoordinates ? [center.coordinates.lat, center.coordinates.lng] : [25.61, 85.14] // Fallback to Patna (Bihar) coords if missing

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/centers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {center.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Facility profile and metadata configurations
            </p>
          </div>
        </div>

        {(isSuperAdmin || isDistrictAdmin) && (
          <button
            onClick={() => navigate(`/admin/centers/add?edit=${center._id}`)}
            className="btn-secondary inline-flex items-center gap-2 text-sm justify-center"
          >
            <Edit className="w-4 h-4" />
            Edit Facility
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Details and Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-primary-500" />
                Facility Profile
              </h2>
              <span className={`badge border text-[10px] font-bold ${getStatusBadgeColor(center.operationalStatus)}`}>
                {center.operationalStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Facility Type</span>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{center.type}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">District</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{center.district}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Block</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5">{center.block}</p>
                </div>
                {center.registrationNumber && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Registration Number</span>
                    <p className="text-base font-mono text-gray-900 dark:text-white mt-0.5">{center.registrationNumber}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Address</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5 flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    {center.fullAddress}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Contact Phone</span>
                  <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {center.contactNumber}
                  </p>
                </div>
                {center.email && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">Contact Email</span>
                    <p className="text-base font-medium text-gray-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {center.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Geographical Map Card */}
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b pb-3">
              <MapPin className="w-5 h-5 text-primary-500" />
              Geographical Location Map
            </h3>
            {hasCoordinates ? (
              <div className="h-80 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={mapCenter}>
                    <Popup>
                      <strong className="text-primary-600">{center.name}</strong>
                      <br />
                      {center.type} - {center.block}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-700/20 border border-dashed rounded-xl text-gray-500">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No coordinates set for this center.</p>
                <p className="text-xs text-gray-400 mt-1">Edit the facility to input latitude and longitude.</p>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1 pt-1">
              <span>Latitude: {center.coordinates?.lat || 'N/A'}</span>
              <span>Longitude: {center.coordinates?.lng || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Columns - Beds statistics & Assigned Staff log */}
        <div className="space-y-6">
          {/* Bed capacity stats */}
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2">
              Resource Occupancy
            </h3>

            {/* Beds details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                  <Bed className="w-4 h-4 text-gray-400" />
                  Beds Allocated
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {center.totalBeds - center.availableBeds} / {center.totalBeds}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${center.totalBeds > 0 ? ((center.totalBeds - center.availableBeds) / center.totalBeds) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 block text-right">
                {center.availableBeds} available beds remaining
              </span>
            </div>

            {/* Workforce summary info */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/20 rounded-xl text-center">
                <span className="text-xs text-gray-400 block font-semibold">Doctors</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white block mt-1">{center.doctorCount}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/20 rounded-xl text-center">
                <span className="text-xs text-gray-400 block font-semibold">Staff Count</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white block mt-1">{center.staffCount}</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff allocation */}
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Staff Allocation ({center.staff?.length || 0})
            </h3>

            {/* Add Staff form */}
            {(isSuperAdmin || isDistrictAdmin) && (
              <form onSubmit={handleAssignStaff} className="flex gap-2">
                <select
                  className="input-field py-1.5 text-xs flex-1"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Choose User...</option>
                  {allUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({t(`roles.${u.role}`)})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isAssigning || !selectedUserId}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                >
                  {isAssigning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Assign
                </button>
              </form>
            )}

            {/* Assigned Staff list */}
            {center.staff?.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 dark:bg-gray-700/10 rounded-xl border border-dashed">
                No active staff allocated.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {center.staff?.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">
                          {t(`roles.${member.role}`)}
                        </p>
                      </div>
                    </div>
                    {(isSuperAdmin || isDistrictAdmin) && (
                      <button
                        onClick={() => handleRemoveStaff(member._id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        title="Deallocate Staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
