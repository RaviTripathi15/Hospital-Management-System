import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import patientService from '@/services/patientService'
import { usePermissions } from '@/hooks/usePermissions'
import {
  ArrowLeft,
  Calendar,
  Phone,
  User,
  Activity,
  Plus,
  Heart,
  FileText,
  Clock,
  CheckCircle2,
  Trash2,
  Edit,
  Loader2,
  Droplet
} from 'lucide-react'
import toast from 'react-hot-toast'
import Badge from '@/components/ui/Badge'
import { format } from 'date-fns'
import { formatAge } from '@/utils/formatters'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isStaff } = usePermissions()

  const [patient, setPatient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Visit Note form state
  const [noteForm, setNoteForm] = useState({
    symptoms: '',
    diagnosis: '',
    prescriptionText: '',
    notes: '',
    vitals: {
      bloodPressure: '',
      temperature: '',
      pulse: '',
      weight: '',
      height: '',
      oxygenSaturation: '',
    },
    followUpDate: '',
  })

  const fetchPatientDetails = async () => {
    setIsLoading(true)
    try {
      const response = await patientService.getById(id)
      setPatient(response.data || response)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load patient details')
      navigate('/patients')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatientDetails()
  }, [id])

  const handleVitalChange = (e) => {
    const { name, value } = e.target
    setNoteForm((prev) => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [name]: value,
      },
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNoteForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddVisit = async (e) => {
    e.preventDefault()
    if (!noteForm.diagnosis) return toast.error('Diagnosis is required')

    setIsSavingNote(true)
    try {
      // Process prescriptions from text to schema objects if entered
      const prescription = []
      if (noteForm.prescriptionText) {
        prescription.push({
          medicine: noteForm.prescriptionText,
          dosage: 'As prescribed',
          duration: 'As prescribed',
          notes: '',
        })
      }

      const noteData = {
        symptoms: noteForm.symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        diagnosis: noteForm.diagnosis,
        notes: noteForm.notes,
        prescription,
        vitals: {
          bloodPressure: noteForm.vitals.bloodPressure || undefined,
          temperature: noteForm.vitals.temperature ? Number(noteForm.vitals.temperature) : undefined,
          pulse: noteForm.vitals.pulse ? Number(noteForm.vitals.pulse) : undefined,
          weight: noteForm.vitals.weight ? Number(noteForm.vitals.weight) : undefined,
          height: noteForm.vitals.height ? Number(noteForm.vitals.height) : undefined,
          oxygenSaturation: noteForm.vitals.oxygenSaturation ? Number(noteForm.vitals.oxygenSaturation) : undefined,
        },
        followUpDate: noteForm.followUpDate || undefined,
      }

      await patientService.addVisitNote(id, noteData)
      toast.success('Consultation note added successfully')
      
      // Reset form
      setNoteForm({
        symptoms: '',
        diagnosis: '',
        prescriptionText: '',
        notes: '',
        vitals: {
          bloodPressure: '',
          temperature: '',
          pulse: '',
          weight: '',
          height: '',
          oxygenSaturation: '',
        },
        followUpDate: '',
      })

      // Reload
      fetchPatientDetails()
    } catch (err) {
      console.error(err)
      toast.error('Failed to add visit note')
    } finally {
      setIsSavingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    )
  }

  if (!patient) return null

  const addressString = [
    patient.address?.street,
    patient.address?.village,
    patient.address?.block,
    patient.address?.district,
    patient.address?.state,
    patient.address?.pincode,
  ].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
            <Badge color={patient.gender === 'male' ? 'blue' : patient.gender === 'female' ? 'purple' : 'gray'}>
              {patient.gender}
            </Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-mono mt-1">Patient ID: {patient.patientId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Demographics & Core Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Info Card */}
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Personal Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-medium text-gray-950 dark:text-gray-200">
                    {patient.dob ? `${formatAge(patient.dob)} years` : `${patient.age || '—'} years`}
                  </p>
                </div>
              </div>

              {patient.bloodGroup && (
                <div className="flex items-center gap-3 text-sm">
                  <Droplet className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">{patient.bloodGroup}</p>
                  </div>
                </div>
              )}

              {patient.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Primary Phone</p>
                    <p className="font-medium text-gray-950 dark:text-gray-200">{patient.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                    {addressString || 'No address specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card */}
          {patient.emergencyContact && (
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Emergency Contact</h3>
              <div className="space-y-2">
                <p className="font-semibold text-sm text-gray-900 dark:text-white">
                  {patient.emergencyContact.name || 'Unnamed Contact'}
                </p>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <p>Relationship: {patient.emergencyContact.relation || 'Not specified'}</p>
                  {patient.emergencyContact.phone && (
                    <p className="flex items-center gap-1 mt-1 font-medium">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {patient.emergencyContact.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Registration Metadata */}
          <div className="card p-6 text-xs text-gray-500 dark:text-gray-400 space-y-2">
            <p>Registered center: <span className="font-semibold">{patient.healthCenter?.name || 'Assigned Center'}</span></p>
            {patient.registeredBy && (
              <p>Registered by: <span className="font-semibold">{patient.registeredBy.name || 'Staff User'}</span></p>
            )}
            <p>Created on: <span className="font-semibold">{format(new Date(patient.createdAt), 'PPP')}</span></p>
          </div>
        </div>

        {/* Right Column: Medical History & New Consultation Note */}
        <div className="lg:col-span-2 space-y-6">
          {/* New consultation note form */}
          {isStaff && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-500" />
                Add New Consultation
              </h2>
              <form onSubmit={handleAddVisit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Symptoms (comma separated)</label>
                    <input
                      type="text"
                      name="symptoms"
                      className="input"
                      placeholder="e.g. Fever, Cough, Headache"
                      value={noteForm.symptoms}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="label">Diagnosis *</label>
                    <input
                      type="text"
                      name="diagnosis"
                      className="input"
                      required
                      placeholder="e.g. Viral Influenza"
                      value={noteForm.diagnosis}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Vitals Form Section */}
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vitals</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <label className="label text-[10px]">BP (e.g. 120/80)</label>
                      <input
                        type="text"
                        name="bloodPressure"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.bloodPressure}
                        onChange={handleVitalChange}
                      />
                    </div>
                    <div>
                      <label className="label text-[10px]">Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        name="temperature"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.temperature}
                        onChange={handleVitalChange}
                      />
                    </div>
                    <div>
                      <label className="label text-[10px]">Pulse (bpm)</label>
                      <input
                        type="number"
                        name="pulse"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.pulse}
                        onChange={handleVitalChange}
                      />
                    </div>
                    <div>
                      <label className="label text-[10px]">Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.weight}
                        onChange={handleVitalChange}
                      />
                    </div>
                    <div>
                      <label className="label text-[10px]">Height (cm)</label>
                      <input
                        type="number"
                        name="height"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.height}
                        onChange={handleVitalChange}
                      />
                    </div>
                    <div>
                      <label className="label text-[10px]">SPO2 (%)</label>
                      <input
                        type="number"
                        name="oxygenSaturation"
                        className="input py-1 text-xs"
                        value={noteForm.vitals.oxygenSaturation}
                        onChange={handleVitalChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Prescribed Medicines</label>
                  <input
                    type="text"
                    name="prescriptionText"
                    className="input"
                    placeholder="e.g. Paracetamol 500mg (1-0-1) for 5 days"
                    value={noteForm.prescriptionText}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="label">Clinical Notes</label>
                  <textarea
                    name="notes"
                    rows="2"
                    className="input"
                    placeholder="Doctor advice, lab instructions or referral details..."
                    value={noteForm.notes}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Follow-up Date</label>
                    <input
                      type="date"
                      name="followUpDate"
                      className="input"
                      value={noteForm.followUpDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary flex items-center gap-2"
                    disabled={isSavingNote}
                  >
                    {isSavingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving note...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Save consultation record
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Visit History timeline */}
          <div className="card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Medical History & Consultations
            </h2>

            {!patient.medicalHistory || patient.medicalHistory.length === 0 ? (
              <div className="py-8 text-center text-gray-400 dark:text-gray-500">
                No past consultations recorded for this patient.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                {patient.medicalHistory.map((visit, index) => {
                  const visitDate = visit.visitDate ? format(new Date(visit.visitDate), 'PPP') : 'Unknown Date'
                  return (
                    <div key={visit._id || index} className="flex gap-4 relative pl-8">
                      {/* Timeline dot */}
                      <div className="absolute left-1 top-1.5 w-6.5 h-6.5 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-300 dark:border-primary-700 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0 z-10">
                        <Heart className="w-3.5 h-3.5" />
                      </div>

                      {/* Content block */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-950/40 p-4 rounded-xl border border-gray-100 dark:border-gray-850 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-150 dark:border-gray-800 pb-2">
                          <div>
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                              {visit.appointmentType || 'Outpatient Consult'}
                            </span>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                              {visit.diagnosis || 'Diagnosis Undefined'}
                            </h4>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {visitDate}
                          </span>
                        </div>

                        {/* Symptoms */}
                        {visit.symptoms && visit.symptoms.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400">Symptoms</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {visit.symptoms.map((s, idx) => (
                                <Badge key={idx} color="gray" size="sm">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vitals */}
                        {visit.vitals && Object.values(visit.vitals).some((v) => v !== undefined && v !== null && v !== '') && (
                          <div>
                            <p className="text-xs text-gray-400">Vitals</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                              {visit.vitals.bloodPressure && (
                                <p>BP: <span className="font-semibold">{visit.vitals.bloodPressure}</span> mmHg</p>
                              )}
                              {visit.vitals.temperature && (
                                <p>Temp: <span className="font-semibold">{visit.vitals.temperature}</span> °C</p>
                              )}
                              {visit.vitals.pulse && (
                                <p>Pulse: <span className="font-semibold">{visit.vitals.pulse}</span> bpm</p>
                              )}
                              {visit.vitals.oxygenSaturation && (
                                <p>SPO2: <span className="font-semibold">{visit.vitals.oxygenSaturation}</span> %</p>
                              )}
                              {visit.vitals.weight && (
                                <p>Weight: <span className="font-semibold">{visit.vitals.weight}</span> kg</p>
                              )}
                              {visit.vitals.height && (
                                <p>Height: <span className="font-semibold">{visit.vitals.height}</span> cm</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Prescriptions */}
                        {visit.prescription && visit.prescription.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400">Prescription</p>
                            <ul className="list-disc list-inside mt-1 text-xs text-gray-700 dark:text-gray-300 space-y-1 font-medium bg-primary-50/50 dark:bg-primary-950/20 p-2.5 rounded-lg border border-primary-100/50 dark:border-primary-900/30">
                              {visit.prescription.map((rx, idx) => (
                                <li key={idx}>
                                  {rx.medicine} - <span className="text-gray-500">{rx.dosage}</span> ({rx.duration})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Notes */}
                        {visit.notes && (
                          <div>
                            <p className="text-xs text-gray-400">Advice / Notes</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 italic">
                              "{visit.notes}"
                            </p>
                          </div>
                        )}

                        {/* Follow up date */}
                        {visit.followUpDate && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Follow-up on: {format(new Date(visit.followUpDate), 'PPP')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
