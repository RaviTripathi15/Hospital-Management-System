import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, User, Edit3, Trash2, Heart, Shield, Check, X, Calendar, Activity
} from 'lucide-react'
import { cn } from '@/utils/cn'

export default function FamilyProfiles({ 
  profiles = [], 
  activeProfileId, 
  onSwitchProfile, 
  localProfiles = [], 
  onUpdateLocalProfiles 
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Male')
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [relation, setRelation] = useState('Spouse')
  const [allergies, setAllergies] = useState('')

  // Map and combine real profiles and local profiles
  const allMembers = [
    ...profiles.map(p => ({
      _id: p._id,
      patientId: p.patientId,
      name: p.name,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup || 'Not set',
      allergies: p.allergies || [],
      relation: 'Primary Account Holder',
      isDatabase: true
    })),
    ...localProfiles.map(p => ({
      ...p,
      isDatabase: false
    }))
  ]

  // Start adding a new member
  const handleOpenAdd = () => {
    setName('')
    setAge('')
    setGender('Male')
    setBloodGroup('O+')
    setRelation('Spouse')
    setAllergies('')
    setShowAddModal(true)
  }

  // Start editing a member
  const handleOpenEdit = (member) => {
    setEditingMember(member)
    setName(member.name)
    setAge(member.age.toString())
    setGender(member.gender)
    setBloodGroup(member.bloodGroup)
    setRelation(member.relation)
    setAllergies(Array.isArray(member.allergies) ? member.allergies.join(', ') : member.allergies || '')
  }

  // Handle member creation/update
  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim() || !age) {
      alert('Please fill out all required fields.')
      return
    }

    const allergyList = allergies
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)

    if (editingMember) {
      // Edit mode
      if (editingMember.isDatabase) {
        // Database profile - override properties locally for dashboard preview
        const updatedLocal = localProfiles.map(p => p._id === editingMember._id ? {
          ...p,
          name,
          age: parseInt(age),
          gender,
          bloodGroup,
          relation: editingMember.relation, // preserve original
          allergies: allergyList
        } : p)
        
        // If not already in overrides, add as override
        if (!localProfiles.some(p => p._id === editingMember._id)) {
          updatedLocal.push({
            _id: editingMember._id,
            patientId: editingMember.patientId,
            name,
            age: parseInt(age),
            gender,
            bloodGroup,
            relation: editingMember.relation,
            allergies: allergyList,
            isOverride: true
          })
        }
        onUpdateLocalProfiles(updatedLocal)
      } else {
        // Edit local member
        const updatedLocal = localProfiles.map(p => p._id === editingMember._id ? {
          ...p,
          name,
          age: parseInt(age),
          gender,
          bloodGroup,
          relation,
          allergies: allergyList
        } : p)
        onUpdateLocalProfiles(updatedLocal)
      }
      setEditingMember(null)
    } else {
      // Add local member
      const newMember = {
        _id: `local-${Date.now()}`,
        patientId: `FT-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        age: parseInt(age),
        gender,
        bloodGroup,
        relation,
        allergies: allergyList,
        medicalHistory: []
      }
      onUpdateLocalProfiles([...localProfiles, newMember])
      setShowAddModal(false)
      
      // Auto-switch to newly created member
      onSwitchProfile(newMember._id)
    }
  }

  // Remove member
  const handleRemove = (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to remove this family member profile?')) return

    const updatedLocal = localProfiles.filter(p => p._id !== id)
    onUpdateLocalProfiles(updatedLocal)

    // If active profile was deleted, switch back to primary account
    if (activeProfileId === id && profiles.length > 0) {
      onSwitchProfile(profiles[0]._id)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-955 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Family Profiles Console
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Switch views to check family members health stats, medicine courses, and reports.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-750 hover:to-indigo-750 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {allMembers.map((member) => {
          const isActive = activeProfileId === member._id || (!activeProfileId && member.isDatabase)
          const nameInitials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

          return (
            <motion.div
              key={member._id}
              onClick={() => onSwitchProfile(member._id)}
              whileHover={{ y: -3 }}
              className={cn(
                "p-5 rounded-2xl border flex flex-col justify-between min-h-[170px] relative overflow-hidden cursor-pointer transition-all duration-300 group shadow-sm",
                isActive 
                  ? "bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 dark:from-indigo-950/40 dark:to-indigo-900/10 border-indigo-500/50 dark:border-indigo-500/40 shadow-soft"
                  : "bg-gray-50/40 dark:bg-gray-850/15 border-gray-150/50 dark:border-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700"
              )}
            >
              <div>
                {/* Active Indicator check badge */}
                {isActive && (
                  <span className="absolute top-3 right-3 bg-indigo-500 text-white p-1 rounded-full text-[9px] shadow animate-pulse">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </span>
                )}

                {/* Avatar + Relation */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-inner",
                    isActive ? "bg-indigo-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  )}>
                    {nameInitials || <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-gray-905 dark:text-white truncate">
                      {member.name}
                    </h3>
                    <span className="inline-block text-[8px] font-black uppercase tracking-wider text-gray-450 dark:text-gray-500 mt-0.5">
                      {member.relation}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-gray-550 dark:text-gray-450 font-semibold border-t border-gray-100/60 dark:border-gray-850/40 pt-3">
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 block uppercase">Age & Gender</span>
                    <span className="text-gray-800 dark:text-gray-250 mt-0.5 block">{member.age} yrs • {member.gender}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-gray-400 block uppercase">Blood Group</span>
                    <span className="text-gray-800 dark:text-gray-250 mt-0.5 block">{member.bloodGroup}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3.5 border-t border-gray-100/40 dark:border-gray-850/20 flex justify-end gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEdit(member)
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-400 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {!member.isDatabase && (
                  <button
                    onClick={(e) => handleRemove(member._id, e)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-605 rounded-lg transition-all cursor-pointer"
                    title="Remove profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </motion.div>
          )
        })}
      </div>

      {/* Add / Edit Profile Dialog Modal */}
      <AnimatePresence>
        {(showAddModal || editingMember) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAddModal(false)
                setEditingMember(null)
              }}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-elevated border border-gray-150/60 dark:border-gray-700/60 relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-base font-extrabold text-gray-955 dark:text-white">
                  {editingMember ? `Edit ${editingMember.name}` : 'Add Family Member Profile'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingMember(null)
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-650 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSave} className="space-y-4 text-xs text-gray-650 dark:text-gray-300">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full input-field px-3 py-2 bg-gray-50/50 focus:bg-white dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl"
                  />
                </div>

                {/* Age & Gender row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={120}
                      placeholder="e.g. 28"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full input-field px-3 py-2 bg-gray-50/50 focus:bg-white dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full input-field px-3 py-2 bg-gray-50/50 dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Relationship & Blood Group row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Relationship</label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      disabled={editingMember?.isDatabase}
                      className="w-full input-field px-3 py-2 bg-gray-50/50 dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl text-xs font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full input-field px-3 py-2 bg-gray-50/50 dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                {/* Allergies */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Known Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts (comma separated)"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full input-field px-3 py-2 bg-gray-50/50 focus:bg-white dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-250 dark:border-gray-700 rounded-xl"
                  />
                </div>

                {/* Buttons footer */}
                <div className="pt-4 border-t border-gray-150/60 dark:border-gray-850/40 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingMember(null)
                    }}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors border border-gray-150/40 dark:border-gray-750/30 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-750 hover:to-indigo-750 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
