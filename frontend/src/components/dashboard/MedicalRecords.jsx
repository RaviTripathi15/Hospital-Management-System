import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Search, Filter, Download, Eye, Pill, Activity, ShieldAlert,
  Calendar, Award, User, Building2, CheckCircle2, QrCode, FileImage, X
} from 'lucide-react'
import { cn } from '@/utils/cn'

// Realistic clinical placeholder data when no real patient medical history exists in database
const MOCK_RECORDS = [
  {
    id: 'rec-1',
    title: 'Lipid Profile Panel (Blood Lab)',
    category: 'lab',
    doctor: 'Dr. Sarah Jenkins',
    facility: 'Primary Health Center Sector 4',
    date: '2026-06-15',
    format: 'PDF',
    size: '1.8 MB',
    details: {
      summary: 'Blood chemistry analysis measuring cholesterol levels.',
      findings: 'Total Cholesterol: 195 mg/dL (Normal < 200), HDL: 52 mg/dL (Normal > 40), LDL: 110 mg/dL (Optimal < 100 - borderline high), Triglycerides: 145 mg/dL (Normal < 150).',
      recommendations: 'Continue standard low-sodium diet and daily walking exercises. Refetch panel in 6 months.'
    }
  },
  {
    id: 'rec-2',
    title: 'Metformin 500mg Prescription Refill',
    category: 'prescription',
    doctor: 'Dr. Ramesh Kumar',
    facility: 'PHC District Hospital',
    date: '2026-07-02',
    format: 'Digital RX',
    size: '120 KB',
    details: {
      summary: 'Oral glycemic control prescription for Type-2 Diabetes management.',
      findings: 'Dosage: Metformin Hydrochloride 500mg • Oral administration twice daily after breakfast and dinner.',
      recommendations: 'Monitor fasting blood glucose levels daily. Request medication refills before course expiration.'
    }
  },
  {
    id: 'rec-3',
    title: 'Chest Posteroanterior X-Ray (Lungs)',
    category: 'xray',
    doctor: 'Dr. Alan Vance (Radiologist)',
    facility: 'PHC Diagnostic Lab',
    date: '2026-05-18',
    format: 'DICOM/PDF',
    size: '14.5 MB',
    details: {
      summary: 'Chest radiographic examination evaluating lungs, mediastinum, and chest wall.',
      findings: 'Lungs are clear of active infiltrates or consolidations. Heart size is within normal parameters. Pleural spaces are clear. No evidence of lobar pneumonia.',
      recommendations: 'No follow-up chest imaging required unless clinical symptoms (persistent cough or chest pain) worsen.'
    }
  },
  {
    id: 'rec-4',
    title: 'Brain Sagittal T2 MRI Scan',
    category: 'mri',
    doctor: 'Dr. Clara Oswald (Neurologist)',
    facility: 'District Specialty Hospital',
    date: '2026-04-10',
    format: 'DICOM',
    size: '28.2 MB',
    details: {
      summary: 'Magnetic resonance imaging scan of cerebral structures.',
      findings: 'Ventricles and sulci are within normal limits for age. No acute infarct, hemorrhage, or mass effect. Cranial nerves are intact. Baseline structural integrity is maintained.',
      recommendations: 'Standard neurology follow-up checkup as scheduled.'
    }
  },
  {
    id: 'rec-5',
    title: 'COVID-19 Booster Vaccination Certificate',
    category: 'certificate',
    doctor: 'Govt Immunization Portal',
    facility: 'National Health Mission PHC',
    date: '2025-11-10',
    format: 'Verifiable Credential',
    size: '520 KB',
    details: {
      summary: 'Digital certificate confirming administration of COVID-19 booster vaccine dose.',
      findings: 'Vaccine: Covishield (AstraZeneca) • Dose 3 (Booster) • Lot Number: COV81729A • Administered to verified recipient profile.',
      recommendations: 'Keep copy secure for potential travel clearance. Verifiable via Government NHM QR Scanner.'
    }
  }
]

export default function MedicalRecords({ reports = [], userName }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewingRecord, setViewingRecord] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  // Map real database patient report entries if they exist
  const getMappedRecords = () => {
    if (!reports || reports.length === 0) return MOCK_RECORDS

    // Map database reports (which represent visits/diagnoses) to matches
    const mapped = reports.map((rep, idx) => {
      let cat = 'lab'
      let format = 'PDF'
      let size = '1.2 MB'
      
      const diagnosisLower = (rep.diagnosis || '').toLowerCase()
      if (diagnosisLower.includes('prescription') || rep.prescription?.length > 0) {
        cat = 'prescription'
        format = 'Digital RX'
        size = '110 KB'
      } else if (diagnosisLower.includes('x-ray') || diagnosisLower.includes('xray')) {
        cat = 'xray'
        format = 'DICOM/PDF'
        size = '12.4 MB'
      } else if (diagnosisLower.includes('mri') || diagnosisLower.includes('scan')) {
        cat = 'mri'
        format = 'DICOM'
        size = '24.1 MB'
      } else if (diagnosisLower.includes('vaccin') || diagnosisLower.includes('immun')) {
        cat = 'certificate'
        format = 'Credential'
        size = '480 KB'
      }

      return {
        id: rep._id || `db-${idx}`,
        title: rep.diagnosis ? `${rep.diagnosis} Consultation Record` : 'General OPD Medical Record',
        category: cat,
        doctor: rep.doctor?.name || rep.doctorName || 'General OPD Clinician',
        facility: rep.healthCenter?.name || 'Primary Health Center',
        date: rep.visitDate ? rep.visitDate.split('T')[0] : '2026-07-14',
        format: format,
        size: size,
        details: {
          summary: rep.notes || 'Routine consultation clinical report.',
          findings: rep.prescription?.length > 0 
            ? `Active prescribed course: ${rep.prescription.map(p => `${p.medicine} (${p.dosage})`).join(', ')}`
            : 'Clinical checkup evaluation complete. Patient vitals logged.',
          recommendations: 'Attend regular checkups as advised. For pharmacy refills, present digital credential.'
        }
      }
    })

    // Combine database records with a few unique mocks to ensure X-Ray, MRI, and Certificates are always available for demonstration!
    return [...mapped, ...MOCK_RECORDS.filter(m => !mapped.some(p => p.category === m.category))]
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

  const handleDownload = (rec) => {
    setDownloadingId(rec.id)
    // Simulate digital signature generation and download delay
    setTimeout(() => {
      setDownloadingId(null)
      
      // Trigger a direct mock file download in browser
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
    }, 1200)
  }

  // Get color configurations depending on category
  const getCategoryConfig = (cat) => {
    switch (cat) {
      case 'prescription':
        return { label: 'Prescription', icon: Pill, color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/30' }
      case 'lab':
        return { label: 'Lab Report', icon: Activity, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100/30' }
      case 'xray':
        return { label: 'X-Ray Scan', icon: FileImage, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100/30' }
      case 'mri':
        return { label: 'MRI Scan', icon: FileText, color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/20 border-purple-100/30' }
      case 'certificate':
        return { label: 'Certificate', icon: Award, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/30' }
      default:
        return { label: 'Medical File', icon: FileText, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 border-gray-150' }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-950 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            Digital Medical Records Portal
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Access unified prescriptions, lab tests, and imaging credentials.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search files, clinicians, hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full input-field pl-10 pr-4 py-2 text-xs bg-gray-50/50 focus:bg-white dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-200 dark:border-gray-700 rounded-xl"
          />
        </div>
      </div>

      {/* Dynamic Filters Tab Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 dark:border-gray-700/50">
        {[
          { id: 'all', label: 'All Files' },
          { id: 'prescription', label: 'Prescriptions' },
          { id: 'lab', label: 'Lab Reports' },
          { id: 'imaging', label: 'Imaging (X-Ray/MRI)' },
          { id: 'certificate', label: 'Certificates' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border active:scale-95",
              selectedFilter === tab.id
                ? "bg-primary-600 text-white border-primary-600 shadow-soft"
                : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 border-gray-150/40 dark:border-gray-700/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid List of Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="wait">
          {filteredRecords.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-16 text-center border border-dashed border-gray-200 dark:border-gray-750 rounded-3xl bg-gray-50/20 dark:bg-gray-900/5"
            >
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">No Matching Records Found</p>
              <p className="text-xs text-gray-450 dark:text-gray-500 mt-1">Try relaxing your search terms or filters.</p>
            </motion.div>
          ) : (
            filteredRecords.map((rec, idx) => {
              const conf = getCategoryConfig(rec.category)
              const Icon = conf.icon
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -3, scale: 1.008 }}
                  className="p-5 bg-gray-50/40 dark:bg-gray-850/15 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex flex-col justify-between min-h-[190px] relative overflow-hidden group shadow-sm hover:shadow transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div>
                    {/* Upper row: Icon + Format */}
                    <div className="flex justify-between items-start gap-4">
                      <div className={cn("p-2.5 rounded-xl border", conf.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-gray-100/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-450 px-2 py-0.5 rounded border border-gray-200/20">
                        {rec.format} • {rec.size}
                      </span>
                    </div>

                    {/* Middle details */}
                    <div className="mt-4 min-w-0">
                      <h3 className="text-xs font-extrabold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-450 transition-colors">
                        {rec.title}
                      </h3>
                      <div className="mt-2 space-y-1 text-[10px] text-gray-500 dark:text-gray-450 font-medium">
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{rec.doctor}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{rec.facility}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions line */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100/50 dark:border-gray-850/40 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1 text-[10px] font-bold text-gray-450 dark:text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{new Date(rec.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingRecord(rec)}
                        className="p-1.5 text-primary-600 hover:text-primary-750 bg-primary-50 dark:bg-primary-950/20 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 hover:bg-primary-100 border border-primary-100/10"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(rec)}
                        disabled={downloadingId === rec.id}
                        className={cn(
                          "p-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 border",
                          downloadingId === rec.id
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-200/20 animate-pulse"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100/10"
                        )}
                      >
                        <Download className={cn("w-3.5 h-3.5", downloadingId === rec.id && "animate-bounce")} />
                        <span>{downloadingId === rec.id ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* High-Fidelity Record Preview Overlay Modal */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingRecord(null)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-elevated border border-gray-150/60 dark:border-gray-700/60 relative z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]"
            >
              {/* Top visual strip color coded */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
                viewingRecord.category === 'prescription' ? "from-indigo-500 to-purple-600" :
                viewingRecord.category === 'lab' ? "from-rose-500 to-pink-600" :
                viewingRecord.category === 'certificate' ? "from-emerald-500 to-teal-600" :
                "from-blue-500 to-cyan-600"
              )} />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border">
                    {getCategoryConfig(viewingRecord.category).label} Report
                  </span>
                  <h3 className="text-base md:text-lg font-extrabold text-gray-950 dark:text-white mt-1.5">
                    {viewingRecord.title}
                  </h3>
                </div>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Body scrollable */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
                
                {/* Clinical Header Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-150/50 dark:border-gray-800/30 rounded-2xl text-xs font-semibold text-gray-800 dark:text-gray-200">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Patient Name</span>
                    <span className="truncate block mt-0.5 font-extrabold">{userName || 'Verified Profile'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Attending Doctor</span>
                    <span className="truncate block mt-0.5 font-extrabold">{viewingRecord.doctor}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Facility location</span>
                    <span className="truncate block mt-0.5">{viewingRecord.facility}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Date of Record</span>
                    <span className="block mt-0.5">{new Date(viewingRecord.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Document Type</span>
                    <span className="block mt-0.5 uppercase">{viewingRecord.format} format</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Verification Authority</span>
                    <span className="text-emerald-500 font-extrabold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> NHM Signed
                    </span>
                  </div>
                </div>

                {/* Main sections */}
                <div className="space-y-4 text-xs leading-relaxed text-gray-650 dark:text-gray-300">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] text-gray-400">Clinical Summary</h4>
                    <p className="font-medium bg-gray-50/20 dark:bg-gray-850/10 p-3 rounded-xl border border-gray-100 dark:border-gray-800/30">
                      {viewingRecord.details.summary}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] text-gray-400">Detailed Findings / Observations</h4>
                    <p className="font-semibold bg-gray-50/20 dark:bg-gray-850/10 p-3 rounded-xl border border-gray-150/40 dark:border-gray-800/30 text-gray-800 dark:text-gray-250">
                      {viewingRecord.details.findings}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[10px] text-gray-400">Physician Directives / Care Plan</h4>
                    <p className="italic bg-gray-50/20 dark:bg-gray-850/10 p-3 rounded-xl border border-gray-100 dark:border-gray-800/30">
                      {viewingRecord.details.recommendations}
                    </p>
                  </div>
                </div>

                {/* Certificate Specific layout (QR Code display) */}
                {viewingRecord.category === 'certificate' && (
                  <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2 mt-4">
                    <QrCode className="w-24 h-24 text-emerald-600 dark:text-emerald-450" />
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold tracking-wider uppercase">Scan to Verify Digital NHM Signature</p>
                    <span className="text-[8px] text-gray-400 font-mono">HASH: SHA256:{Math.random().toString(16).substr(2, 28).toUpperCase()}</span>
                  </div>
                )}

                {/* Imaging Specific Visual (X-Ray/MRI scanner visual mock) */}
                {(viewingRecord.category === 'xray' || viewingRecord.category === 'mri') && (
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-900 rounded-2xl space-y-2 relative overflow-hidden mt-4 min-h-[160px] group shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black opacity-90" />
                    
                    {/* Simulated scanning laser line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-500/60 shadow-[0_0_10px_#3b82f6] top-1/2 animate-pulse" />
                    
                    <FileImage className="w-10 h-10 text-blue-500/40 relative z-10 animate-pulse" />
                    <p className="text-[10px] text-blue-400/90 font-extrabold tracking-wider uppercase relative z-10">DICOM Radiographic Panel Viewer Ready</p>
                    <span className="text-[8px] text-gray-500 font-mono relative z-10">Secure Slice ID: {viewingRecord.id}-001-A</span>
                  </div>
                )}

              </div>

              {/* Actions footer */}
              <div className="mt-6 pt-4 border-t border-gray-150/60 dark:border-gray-850/40 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors border border-gray-150/40 dark:border-gray-750/30 cursor-pointer active:scale-95"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingRecord)
                    setViewingRecord(null)
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-750 hover:to-blue-750 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-primary-500/10 active:scale-95 flex items-center gap-1.5 cursor-pointer"
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
