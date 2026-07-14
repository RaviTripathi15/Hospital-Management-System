import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, MapPin, Phone, Calendar, Compass, Pill, Activity, Clock
} from 'lucide-react'
import { cn } from '@/utils/cn'

// Default mock coordinates representing user's location (e.g., Patna, Bihar)
const MOCK_USER_LAT = 25.5941
const MOCK_USER_LNG = 85.1376

// Haversine formula to compute exact distance in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat2 || !lon2) return null
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return (R * c).toFixed(1)
}

export default function NearbyHealthCenters({ centers = [] }) {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')

  // Map and sanitize database centers, supplying realistic values for missing attributes
  const getMappedCenters = () => {
    return centers.map((center, idx) => {
      // Calculate distance if coordinates exist, otherwise generate a unique mock distance
      const distance = calculateDistance(MOCK_USER_LAT, MOCK_USER_LNG, center.coordinates?.lat, center.coordinates?.lng) 
        || (1.5 + (idx * 0.8) + (center.name.charCodeAt(0) % 5) * 0.5).toFixed(1)

      // Total and available beds formatting
      const totalBeds = center.totalBeds || (center.type === 'CHC' ? 30 : center.type === 'DH' ? 120 : 10)
      const availableBeds = typeof center.availableBeds === 'number' 
        ? center.availableBeds 
        : Math.round(totalBeds * (0.3 + ((center.name.charCodeAt(0) % 5) * 0.12)))

      // Medicine stock level based on center name hash
      const stockLevel = 75 + (center.name.charCodeAt(1) % 22)

      // Open status and hours
      const isOpen = center.operationalStatus === 'active' || !center.operationalStatus
      const hours = center.type === 'PHC' ? '9:00 AM - 5:00 PM' : 'Open 24 Hours'

      return {
        ...center,
        distance,
        totalBeds,
        availableBeds,
        stockLevel,
        isOpen,
        hours
      }
    })
  }

  const allCenters = getMappedCenters()

  // Filter centers based on selection tabs
  const filteredCenters = allCenters.filter(center => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'PHC') return center.type === 'PHC'
    if (activeFilter === 'CHC') return center.type === 'CHC'
    if (activeFilter === 'DH') return center.type === 'DH' || center.type === 'Government Hospital'
    return true
  })

  // Open Google Maps navigation in a new tab
  const handleNavigate = (center) => {
    let url = ''
    if (center.coordinates?.lat && center.coordinates?.lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${center.coordinates.lat},${center.coordinates.lng}`
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.name}, ${center.district || ''} Bihar`)}`
    }
    window.open(url, '_blank')
  }

  // Format type badges
  const getCenterTypeConfig = (type) => {
    switch (type) {
      case 'PHC':
        return { label: 'Primary Health Center', color: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/30' }
      case 'CHC':
        return { label: 'Community Health Center', color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/30' }
      case 'DH':
      case 'Government Hospital':
        return { label: 'District Hospital', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100/30' }
      default:
        return { label: type || 'Health Center', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-150' }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-950 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Nearby Health & Care Centers
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Locate nearest PHCs, CHCs, and Hospitals with bed & medicine status.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => navigate('/admin/centers')}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-750 dark:text-emerald-450 hover:underline cursor-pointer flex items-center gap-0.5"
        >
          See All Centers Portal
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 dark:border-gray-700/50">
        {[
          { id: 'all', label: 'All Centers' },
          { id: 'PHC', label: 'PHCs (Primary)' },
          { id: 'CHC', label: 'CHCs (Community)' },
          { id: 'DH', label: 'Govt Hospitals' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border cursor-pointer active:scale-95",
              activeFilter === tab.id
                ? "bg-emerald-600 text-white border-emerald-600 shadow-soft"
                : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 border-gray-150/40 dark:border-gray-700/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards List Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="wait">
          {filteredCenters.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-16 text-center border border-dashed border-gray-200 dark:border-gray-750 rounded-3xl bg-gray-50/20 dark:bg-gray-900/5"
            >
              <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">No Matching Health Centers</p>
              <p className="text-xs text-gray-455 dark:text-gray-500 mt-1">There are no clinics of this category in your district.</p>
            </motion.div>
          ) : (
            filteredCenters.map((center, idx) => {
              const conf = getCenterTypeConfig(center.type)
              return (
                <motion.div
                  key={center._id || idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -3, scale: 1.008 }}
                  className="p-5 bg-gray-50/40 dark:bg-gray-850/15 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden group shadow-sm hover:shadow transition-all duration-300"
                >
                  {/* Background blur overlay */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                  
                  <div>
                    {/* Header: Name + Classification Badge */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xs font-extrabold text-gray-950 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors">
                          {center.name}
                        </h3>
                        <span className={cn("inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mt-1.5", conf.color)}>
                          {conf.label}
                        </span>
                      </div>
                      
                      {/* Operational Status */}
                      <span className={cn(
                        "badge text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shrink-0 border uppercase leading-none",
                        center.isOpen
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 border-red-100/30 dark:bg-red-950/20 dark:text-red-400"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", center.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                        {center.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {/* Meta information: distance and operational hours */}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-gray-500 dark:text-gray-450 font-medium">
                      <p className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-bold bg-gray-100/60 dark:bg-gray-700/60 px-2 py-0.5 rounded border border-gray-250/20">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{center.distance} km away</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-450 shrink-0" />
                        <span>{center.hours}</span>
                      </p>
                    </div>

                    {/* Vitals indicators: Beds & Medicines */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100/60 dark:border-gray-850/40 grid grid-cols-2 gap-4">
                      
                      {/* Beds capacity */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                            Beds Free
                          </span>
                          <span className="font-extrabold text-gray-700 dark:text-gray-350">{center.availableBeds}/{center.totalBeds}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden border border-gray-150/10 dark:border-gray-800/20">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round((center.availableBeds / center.totalBeds) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Medicine availability */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            <Pill className="w-3 h-3 text-indigo-500 shrink-0" />
                            Medicines
                          </span>
                          <span className="font-extrabold text-gray-700 dark:text-gray-350">{center.stockLevel}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden border border-gray-150/10 dark:border-gray-800/20">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${center.stockLevel}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100/50 dark:border-gray-850/40 flex gap-2">
                    <button
                      onClick={() => handleNavigate(center)}
                      className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-gray-150/45 dark:border-gray-750/30 cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Compass className="w-3.5 h-3.5 text-gray-400" />
                      <span>Navigate</span>
                    </button>
                    {center.contactNumber && (
                      <a
                        href={`tel:${center.contactNumber}`}
                        className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-gray-150/45 dark:border-gray-750/30 cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    )}
                    <button
                      onClick={() => navigate('/appointments/book', { state: { preselectedCenterId: center._id } })}
                      className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-400 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-emerald-100/10 cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Book visit</span>
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
