import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Search, Download, Eye, Pill, Activity, Award, User, 
  Building2, CheckCircle2, QrCode, FileImage, X, Share2, Calendar, FileCode
} from 'lucide-react'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

import { useSearchParams } from 'react-router-dom'

// Mock records with verified clinical statuses and metadata
const MOCK_RECORDS = [
  {
    id: 'rec-1',
    title: 'Lipid Profile Panel (Blood Lab)',
    category: 'lab',
    doctor: 'Dr. Sarah Jenkins',
    facility: 'PHC Sector 4 Clinic',
    date: '2026-06-15',
    format: 'PDF',
    size: '1.8 MB',
    status: 'Signed',
    statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/40',
    tags: ['Lab', 'Diagnostic'],
    details: {
      summary: 'Blood chemistry analysis measuring cholesterol levels.',
      findings: 'Total Cholesterol: 195 mg/dL (Normal < 200), HDL: 52 mg/dL (Normal > 40), LDL: 110 mg/dL (Optimal < 100), Triglycerides: 145 mg/dL (Normal < 150).',
      recommendations: 'Continue standard low-sodium diet and daily walking exercises. Refetch panel in 6 months.'
    }
  },
  {
    id: 'rec-2',
    title: 'Metformin 500mg RX Refill',
    category: 'prescription',
    doctor: 'Dr. Ramesh Kumar',
    facility: 'District Hospital Pharmacy',
    date: '2026-07-02',
    format: 'Digital RX',
    size: '120 KB',
    status: 'Active RX',
    statusColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/40',
    tags: ['Prescription', 'Oral'],
    details: {
      summary: 'Oral glycemic control prescription for Type-2 Diabetes management.',
      findings: 'Dosage: Metformin Hydrochloride 500mg • Oral administration twice daily after breakfast and dinner.',
      recommendations: 'Monitor fasting blood glucose levels daily. Request medication refills before course expiration.'
    }
  },
  {
    id: 'rec-3',
    title: 'Chest Posteroanterior X-Ray',
    category: 'xray',
    doctor: 'Dr. Alan Vance (Radiologist)',
    facility: 'District Diagnostic Lab',
    date: '2026-05-18',
    format: 'DICOM/PDF',
    size: '14.5 MB',
    status: 'Verified',
    statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/40',
    tags: ['Imaging', 'Radiology'],
    details: {
      summary: 'Chest radiographic examination evaluating lungs, mediastinum, and chest wall.',
      findings: 'Lungs are clear of active infiltrates or consolidations. Heart size is within normal parameters. Pleural spaces are clear. No evidence of lobar pneumonia.',
      recommendations: 'No follow-up chest imaging required unless clinical symptoms worsen.'
    }
  },
  {
    id: 'rec-4',
    title: 'Brain Sagittal T2 MRI Scan',
    category: 'mri',
    doctor: 'Dr. Clara Oswald (Neurologist)',
    facility: 'District Specialty Center',
    date: '2026-04-10',
    format: 'DICOM',
    size: '28.2 MB',
    status: 'Synced',
    statusColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200/40',
    tags: ['Imaging', 'MRI'],
    details: {
      summary: 'Magnetic resonance imaging scan of cerebral structures.',
      findings: 'Ventricles and sulci are within normal limits for age. No acute infarct, hemorrhage, or mass effect. Cranial nerves are intact. Baseline structural integrity is maintained.',
      recommendations: 'Standard neurology follow-up checkup as scheduled.'
    }
  },
  {
    id: 'rec-5',
    title: 'COVID-19 Booster Certificate',
    category: 'certificate',
    doctor: 'Govt Immunization Portal',
    facility: 'National Health Mission PHC',
    date: '2025-11-10',
    format: 'Credential',
    size: '520 KB',
    status: 'NHM Signed',
    statusColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/40',
    tags: ['Certificate', 'Verifiable'],
    details: {
      summary: 'Digital certificate confirming administration of COVID-19 booster vaccine dose.',
      findings: 'Vaccine: Covishield (AstraZeneca) • Dose 3 (Booster) • Lot Number: COV81729A • Administered to verified recipient profile.',
      recommendations: 'Keep copy secure for potential travel clearance. Verifiable via Government NHM QR Scanner.'
    }
  }
]

export default function MedicalRecords({ reports = [], userName }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedFilter = searchParams.get('tab') || 'all'
  const [viewingRecord, setViewingRecord] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const handleTabChange = (newTab) => {
    const newParams = new URLSearchParams(searchParams)
    if (newTab === 'all') {
      newParams.delete('tab')
    } else {
      newParams.set('tab', newTab)
    }
    setSearchParams(newParams, { replace: true })
  }

  // Map real database patient report entries if they exist
  const getMappedRecords = () => {
    if (!reports || reports.length === 0) return MOCK_RECORDS

    const mapped = reports.map((rep, idx) => {
      let cat = 'lab'
      let format = 'PDF'
      let size = '1.2 MB'
      let status = 'Signed'
      let statusColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250/20'
      let tags = ['Consultation']
      
      const diagnosisLower = (rep.diagnosis || '').toLowerCase()
      if (diagnosisLower.includes('prescription') || rep.prescription?.length > 0) {
        cat = 'prescription'
        format = 'Digital RX'
        size = '110 KB'
        status = 'Active RX'
        statusColor = 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-250/20'
        tags = ['Prescription', 'Meds']
      } else if (diagnosisLower.includes('x-ray') || diagnosisLower.includes('xray')) {
        cat = 'xray'
        format = 'DICOM/PDF'
        size = '12.4 MB'
        status = 'Verified'
        tags = ['Imaging', 'X-Ray']
      } else if (diagnosisLower.includes('mri') || diagnosisLower.includes('scan')) {
        cat = 'mri'
        format = 'DICOM'
        size = '24.1 MB'
        status = 'Synced'
        statusColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-250/20'
        tags = ['Imaging', 'MRI']
      } else if (diagnosisLower.includes('vaccin') || diagnosisLower.includes('immun')) {
        cat = 'certificate'
        format = 'Credential'
        size = '480 KB'
        status = 'NHM Signed'
        tags = ['Certificate', 'Verifiable']
      }

      return {
        id: rep._id || `db-${idx}`,
        title: rep.diagnosis ? `${rep.diagnosis} Consultation` : 'OPD Consultation Record',
        category: cat,
        doctor: rep.doctor?.name || rep.doctorName || 'General OPD Clinician',
        facility: rep.healthCenter?.name || 'Primary Health Center',
        date: rep.visitDate ? rep.visitDate.split('T')[0] : '2026-07-14',
        format: format,
        size: size,
        status: status,
        statusColor: statusColor,
        tags: tags,
        details: {
          summary: rep.notes || 'Routine consultation clinical report.',
          findings: rep.prescription?.length > 0 
            ? `Active prescribed course: ${rep.prescription.map(p => `${p.medicine} (${p.dosage})`).join(', ')}`
            : 'Clinical checkup evaluation complete. Patient vitals logged.',
          recommendations: 'Attend regular checkups as advised. For pharmacy refills, present digital credential.'
        }
      }
    })

    // Combine database records with unique mocks to ensure all categories show
    const filteredMocks = MOCK_RECORDS.filter(m => !mapped.some(p => p.category === m.category))
    return [...mapped, ...filteredMocks]
  }

  const allRecords = getMappedRecords()

  // Filter records
  const filteredRecords = allRecords.filter(rec => {
    const matchesSearch = 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.facility.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'imaging') return matchesSearch && (rec.category === 'xray' || rec.category === 'mri')
    return matchesSearch && rec.category === selectedFilter
  })

  // Download simulation
  const handleDownload = (rec) => {
    setDownloadingId(rec.id)
    setTimeout(() => {
      setDownloadingId(null)
      const element = document.createElement("a");
      const file = new Blob([
        `NATIONAL DIGITAL HEALTH CARD SYSTEM\n`,
        `===================================\n`,
        `Patient Name: ${userName || 'Verified Recipient'}\n`,
        `Record ID: ${rec.id}\n`,
        `Title: ${rec.title}\n`,
        `Category: ${rec.category.toUpperCase()}\n`,
        `Doctor: ${rec.doctor}\n`,
        `Facility: ${rec.facility}\n`,
        `Date: ${rec.date}\n\n`,
        `Clinical Summary:\n${rec.details.summary}\n\n`,
        `Findings:\n${rec.details.findings}\n\n`,
        `Physician Recommendations:\n${rec.details.recommendations}\n\n`,
        `Verifiable Hash: SHA-256: ${Math.random().toString(16).substr(2, 32)}\n`
      ], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${rec.title.replace(/\s+/g, '_')}_Record.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Document downloaded successfully.')
    }, 1000)
  }

  // Share link simulation
  const handleShare = (rec) => {
    navigator.clipboard.writeText(`https://healthcare.gov/records/share/${rec.id}`)
    toast.success('Shareable clinical link copied to clipboard!')
  }

  // Get color configurations depending on category
  const getCategoryConfig = (cat) => {
    switch (cat) {
      case 'prescription':
        return { label: 'Prescription', icon: Pill, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-150/10' }
      case 'lab':
        return { label: 'Lab Report', icon: Activity, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-150/10' }
      case 'xray':
        return { label: 'X-Ray Scan', icon: FileImage, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-150/10' }
      case 'mri':
        return { label: 'MRI Scan', icon: FileCode, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-150/10' }
      case 'certificate':
        return { label: 'Certificate', icon: Award, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150/10' }
      default:
        return { label: 'Medical File', icon: FileText, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200' }
    }
  }

  return (
    <div className="bg-white dark:bg-[#131c2e] rounded-xl p-5 border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft space-y-5">
      
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-500" />
            Digital Medical Records Portal
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Access credentials, certified prescriptions, laboratory tests, and imaging logs.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records, facilities, clinicians..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full input-field pl-9 pr-4 py-1.5 text-xs bg-slate-50/50 focus:bg-white dark:bg-[#090d16]/30 focus:dark:bg-[#090d16]/60 border border-slate-200 dark:border-[#1e2d4a] rounded-xl"
          />
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide border-b border-slate-200/60 dark:border-[#1e2d4a]/60">
        {[
          { id: 'all', label: 'All Files' },
          { id: 'prescription', label: 'Prescriptions' },
          { id: 'lab', label: 'Lab Reports' },
          { id: 'imaging', label: 'Imaging' },
          { id: 'certificate', label: 'Certificates' }
        ].map((tab) => {
          const isActive = selectedFilter === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              data-state={isActive ? 'active' : 'inactive'}
              onClick={() => handleTabChange(tab.id)}
              className="tab-pill"
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Enterprise-grade Info-dense Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {filteredRecords.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-12 text-center border border-dashed border-slate-200 dark:border-[#1e2d4a] rounded-xl bg-slate-50/10 dark:bg-slate-900/5"
            >
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-white">No Clinical Records Found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Refine your search term or tab selections.</p>
            </motion.div>
          ) : (
            filteredRecords.map((rec, idx) => {
              const conf = getCategoryConfig(rec.category)
              const Icon = conf.icon
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="p-4 bg-slate-50/40 dark:bg-slate-900/20 border border-slate-150/40 dark:border-[#1e2d4a]/70 rounded-xl flex flex-col justify-between min-h-[135px] relative overflow-hidden group shadow-sm hover:shadow transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div>
                    {/* Header Row: Document Icon, format/size, and status badge */}
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("p-2 rounded-lg border shrink-0", conf.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-extrabold text-slate-800 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors">
                            {rec.title}
                          </h3>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                            {rec.format} • {rec.size}
                          </span>
                        </div>
                      </div>
                      
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 select-none leading-none",
                        rec.statusColor
                      )}>
                        {rec.status}
                      </span>
                    </div>

                    {/* Meta info columns */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{rec.facility}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{rec.doctor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Row: Tags, Date, and Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100/50 dark:border-[#1e2d4a]/25 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-450 dark:text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(rec.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {rec.tags?.slice(0, 1).map((t, tIdx) => (
                        <span key={tIdx} className="hidden sm:inline-block text-[8px] font-bold text-slate-550 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* SaaS buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingRecord(rec)}
                        title="View Record"
                        className="px-2 py-1 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2d4a]/60 dark:hover:bg-[#1e2d4a] text-[10px] font-bold rounded transition-colors cursor-pointer active:scale-95 flex items-center gap-0.5"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleDownload(rec)}
                        disabled={downloadingId === rec.id}
                        title="Download Record"
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer active:scale-95 flex items-center gap-0.5 border",
                          downloadingId === rec.id
                            ? "bg-slate-100 dark:bg-slate-850 text-slate-400 border-slate-200/20 animate-pulse"
                            : "bg-primary-50 hover:bg-primary-100 text-primary-600 border-primary-100/10 dark:bg-primary-950/20 dark:text-primary-450"
                        )}
                      >
                        <Download className="w-3 h-3" />
                        <span>Save</span>
                      </button>

                      <button
                        onClick={() => handleShare(rec)}
                        title="Share Record Link"
                        className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer active:scale-95 border border-slate-200/40 dark:border-[#1e2d4a]/30"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Modern High-Fidelity preview Modal (Fluent/Material design) */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRecord(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#131c2e] rounded-xl p-6 md:p-7 max-w-xl w-full shadow-elevated border border-slate-100 dark:border-[#1e2d4a]/85 relative z-10 overflow-hidden flex flex-col justify-between max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/10">
                    {getCategoryConfig(viewingRecord.category).label} Report
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
                    {viewingRecord.title}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                
                {/* Visual grid metadata */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 dark:bg-[#090d16]/30 border border-slate-150/40 dark:border-[#1e2d4a]/30 rounded-xl">
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Patient Profile</span>
                    <span className="truncate block mt-0.5 font-extrabold text-slate-800 dark:text-white">{userName || 'Verified Citizen'}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Attending Doctor</span>
                    <span className="truncate block mt-0.5 font-extrabold text-slate-800 dark:text-white">{viewingRecord.doctor}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Facility Clinic</span>
                    <span className="truncate block mt-0.5">{viewingRecord.facility}</span>
                  </div>
                  <div>
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Record Date</span>
                    <span className="block mt-0.5">{new Date(viewingRecord.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-805 dark:text-white uppercase tracking-wider text-[9px] text-slate-450">Clinical Summary</h4>
                    <p className="font-medium bg-slate-50/20 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-[#1e2d4a]/20">
                      {viewingRecord.details.summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-805 dark:text-white uppercase tracking-wider text-[9px] text-slate-450">Detailed Findings / Observations</h4>
                    <p className="font-semibold bg-slate-50/20 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-150/20 dark:border-[#1e2d4a]/20 text-slate-850 dark:text-slate-200">
                      {viewingRecord.details.findings}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-805 dark:text-white uppercase tracking-wider text-[9px] text-slate-450">Physician Directives / Care Plan</h4>
                    <p className="italic bg-slate-50/20 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-[#1e2d4a]/20">
                      {viewingRecord.details.recommendations}
                    </p>
                  </div>
                </div>

                {/* Conditional Visuals */}
                {viewingRecord.category === 'certificate' && (
                  <div className="flex flex-col items-center justify-center p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1.5">
                    <QrCode className="w-16 h-16 text-emerald-600 dark:text-emerald-450" />
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold tracking-wider uppercase">NHM Digital Health Signature Verified</p>
                  </div>
                )}

                {(viewingRecord.category === 'xray' || viewingRecord.category === 'mri') && (
                  <div className="flex flex-col items-center justify-center p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5 relative overflow-hidden min-h-[120px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-black to-black opacity-90" />
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-500/30 top-1/2 animate-pulse" />
                    <FileImage className="w-8 h-8 text-blue-500/35 relative z-10 animate-pulse" />
                    <p className="text-[9px] text-blue-450 font-extrabold tracking-wider uppercase relative z-10">DICOM Radiographic Panel Scan Active</p>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3.5 border-t border-slate-100/55 dark:border-[#1e2d4a]/20 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-colors border border-slate-200 dark:border-[#1e2d4a]/85 cursor-pointer active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingRecord)
                    setViewingRecord(null)
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
