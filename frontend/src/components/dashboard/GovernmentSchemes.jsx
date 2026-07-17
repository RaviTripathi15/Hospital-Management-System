import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, Heart, Calendar, Activity, CheckCircle2, ShieldCheck, FileText, X, ChevronRight, UserCheck, AlertCircle, Clock
} from 'lucide-react'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const SCHEMES = [
  {
    id: 'scheme-1',
    title: 'Ayushman Bharat (PM-JAY)',
    govBody: 'National Health Authority',
    category: 'Insurance',
    description: 'Provides free cashless hospitalization coverage up to ₹5 Lakhs per family per year for secondary and tertiary care.',
    eligibility: 'Families identified under low-income criteria in the SECC database.',
    deadline: 'Ongoing',
    benefits: [
      'Cashless hospital admission across empaneled public & private hospitals.',
      'Covers up to 3 days of pre-hospitalization and 15 days of post-hospitalization costs.',
      'Covers diagnostics, medications, ICU charges, and over 1,350 medical packages.',
      'No cap on family size or age limits.'
    ],
    documents: ['Aadhaar Card', 'Ration Card', 'Linked Mobile Number'],
    prefix: 'AB-PMJAY',
    icon: Award,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100/50 dark:border-blue-900/30',
    illustration: (
      <svg className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-500/5 dark:text-blue-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
      </svg>
    )
  },
  {
    id: 'scheme-2',
    title: 'National Immunization Program',
    govBody: 'Ministry of Health & Family Welfare',
    category: 'Vaccination',
    description: 'Ensures free vaccine administration to shield infants, children, and pregnant mothers from vaccine-preventable diseases.',
    eligibility: 'All infants, children up to 16 years, and pregnant mothers in the district.',
    deadline: 'Ongoing Campaign',
    benefits: [
      'Free vaccines covering Polio, BCG, Hepatitis B, Tetanus, Rotavirus, and Measles.',
      'Immunization record tracking with digital certificate generation.',
      'Access to counseling and vaccination schedules at any local PHC/SHC.'
    ],
    documents: ['Child Birth Card', 'Guardian Aadhaar', 'Active Mobile Number'],
    prefix: 'NID-VACC',
    icon: ShieldCheck,
    color: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50 dark:border-emerald-900/30',
    illustration: (
      <svg className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-500/5 dark:text-emerald-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    )
  },
  {
    id: 'scheme-3',
    title: 'Free Diagnostic Health Camps',
    govBody: 'District Health Society',
    category: 'Health Camp',
    description: 'Weekly block-level diagnostic medical camps bringing specialist doctors, laboratory testing, and pharmacy supplies directly to rural communities.',
    eligibility: 'Open to all local district citizens. Priority for diagnostic card holders.',
    deadline: 'Every Saturday',
    benefits: [
      'Free general physician and pediatric specialist consultations.',
      'On-the-spot blood sugar, pressure, and haemoglobin blood tests.',
      'Dispensation of primary medicines for common ailments at no cost.',
      'Referral linkages to District Specialty Hospitals.'
    ],
    documents: ['Voter / Aadhaar Card', 'Previous medical logs'],
    prefix: 'FHC-CAMP',
    icon: Calendar,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-100/50 dark:border-rose-900/30',
    illustration: (
      <svg className="absolute -bottom-6 -right-6 w-32 h-32 text-rose-500/5 dark:text-rose-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5H7v2h5v-2z"/>
      </svg>
    )
  },
  {
    id: 'scheme-4',
    title: 'District Blood Donation Drives',
    govBody: 'Red Cross & State Blood Council',
    category: 'Blood Camp',
    description: 'State-facilitated blood donation drives organized at local health centers to secure emergency reserves for regional critical care patients.',
    eligibility: 'Healthy adults aged 18-65 years, weighing above 45 kg with normal pulse.',
    deadline: 'Jul 31, 2026',
    benefits: [
      'Free baseline health checkup (Blood Grouping, BP, Hb levels, Pulse).',
      'Donor certification and priority blood card valid for immediate family members.',
      'Complimentary refreshments and donor appreciation badge.'
    ],
    documents: ['Government Photo ID', 'Donor card (if any)'],
    prefix: 'BDD-DONOR',
    icon: Heart,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100/50 dark:border-amber-900/30',
    illustration: (
      <svg className="absolute -bottom-6 -right-6 w-32 h-32 text-amber-500/5 dark:text-amber-500/10 pointer-events-none group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    )
  }
]

export default function GovernmentSchemes({ userName, onApplyFeedback }) {
  const [learningScheme, setLearningScheme] = useState(null)
  const [applyingScheme, setApplyingScheme] = useState(null)
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [consentCheck, setConsentCheck] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track applied schemes in localStorage
  const [appliedSchemes, setAppliedSchemes] = useState(() => {
    const saved = localStorage.getItem(`applied_schemes_${userName || 'user'}`)
    return saved ? JSON.parse(saved) : {}
  })

  const handleApplySubmit = (e) => {
    e.preventDefault()
    if (aadhaarInput.length !== 12 || isNaN(aadhaarInput)) {
      toast.error('Please enter a valid 12-digit Aadhaar Number.')
      return
    }
    if (!consentCheck) {
      toast.error('You must consent to Aadhaar verification.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      const trackId = `${applyingScheme.prefix}-${Math.floor(100000 + Math.random() * 900000)}`
      const schemeTitle = applyingScheme.title

      // Update state & persist
      const updatedApplied = { ...appliedSchemes, [applyingScheme.id]: { status: 'Under Review', trackId, date: new Date().toLocaleDateString() } }
      setAppliedSchemes(updatedApplied)
      localStorage.setItem(`applied_schemes_${userName || 'user'}`, JSON.stringify(updatedApplied))

      setApplyingScheme(null)
      setAadhaarInput('')
      setConsentCheck(false)

      if (onApplyFeedback) {
        onApplyFeedback({
          isOpen: true,
          type: 'success',
          title: 'Application Dispatched',
          message: `Your registration request for "${schemeTitle}" has been logged. Tracking ID: ${trackId}. Identity verification is in progress.`
        })
      }
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-[#131c2e] rounded-xl p-6 border border-slate-100 dark:border-[#1e2d4a]/85 shadow-soft space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-primary-500" />
          Government Schemes & Health Campaigns
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verify eligibility and apply online for public health insurance plans, clinical campaigns, and diagnostic programs.
        </p>
      </div>

      {/* Schemes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCHEMES.map((scheme, idx) => {
          const Icon = scheme.icon
          const appStatus = appliedSchemes[scheme.id]

          return (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 bg-slate-50/20 dark:bg-slate-900/30 border border-slate-150/40 dark:border-[#1e2d4a]/60 rounded-xl flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow-soft hover:border-primary-500/20 dark:hover:border-[#1e2d4a] transition-all duration-300"
            >
              {/* Dynamic SVGs and Glows */}
              {scheme.illustration}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary-500/10 transition-colors" />

              <div>
                {/* Meta Head: Ministry + Category Badge */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none">
                      {scheme.govBody}
                    </p>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white mt-1.5 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {scheme.title}
                    </h3>
                  </div>
                  
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200/40 dark:border-slate-800 shrink-0 select-none">
                    {scheme.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mt-3 font-medium">
                  {scheme.description}
                </p>

                {/* Grid: Eligibility details & required documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100/50 dark:border-[#1e2d4a]/20">
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Eligibility Criteria</h4>
                    <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                      {scheme.eligibility}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Required Documents</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scheme.documents.map((doc, dIdx) => (
                        <span key={dIdx} className="inline-flex items-center gap-0.5 text-[8.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/10">
                          <FileText className="w-2.5 h-2.5 text-primary-500" />
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status or Deadline Row */}
                <div className="mt-4 flex items-center justify-between text-[10px] bg-slate-100/30 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/50 dark:border-[#1e2d4a]/20">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-450" />
                    <span>Deadline: <strong className="text-slate-700 dark:text-slate-300 font-extrabold">{scheme.deadline}</strong></span>
                  </div>
                  
                  {appStatus ? (
                    <span className="badge py-0.5 px-2 bg-emerald-50 text-emerald-600 border border-emerald-150/40 dark:bg-emerald-950/20 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                      {appStatus.status}
                    </span>
                  ) : (
                    <span className="badge py-0.5 px-2 bg-blue-50 text-blue-600 border border-blue-150/40 dark:bg-blue-950/20 dark:text-blue-400 text-[8px] font-black uppercase tracking-wider">
                      Open
                    </span>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-5 pt-3.5 border-t border-slate-100/50 dark:border-[#1e2d4a]/20">
                <button
                  onClick={() => setLearningScheme(scheme)}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-colors border border-slate-200 dark:border-[#1e2d4a]/85 cursor-pointer active:scale-95 text-center"
                >
                  Learn More
                </button>
                <button
                  onClick={() => setApplyingScheme(scheme)}
                  disabled={!!appStatus}
                  className={cn(
                    "flex-1 py-2 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 text-center cursor-pointer",
                    appStatus 
                      ? "bg-slate-100 dark:bg-slate-850 text-slate-400 border border-slate-200/10 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-700 hover:to-indigo-750 text-white"
                  )}
                >
                  {appStatus ? 'Applied' : 'Apply Online'}
                </button>
              </div>

            </motion.div>
          )
        })}
      </div>

      {/* Learn More Modal Dialog */}
      <AnimatePresence>
        {learningScheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLearningScheme(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#131c2e] rounded-xl p-6 md:p-8 max-w-lg w-full shadow-elevated border border-slate-100 dark:border-[#1e2d4a]/80 relative z-10 overflow-hidden flex flex-col justify-between max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/20">
                    {learningScheme.category} Scheme
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                    {learningScheme.title} Coverage Details
                  </h3>
                </div>
                <button
                  onClick={() => setLearningScheme(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                <p className="font-semibold bg-slate-50/50 dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-100 dark:border-[#1e2d4a]/30">
                  {learningScheme.description}
                </p>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-450 uppercase tracking-widest text-[9px]">Scope of Benefits</h4>
                  <ul className="space-y-2">
                    {learningScheme.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-slate-450 uppercase tracking-widest text-[9px]">Required Identification Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {learningScheme.documents.map((doc, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200/40 dark:border-slate-800/50">
                        <FileText className="w-3.5 h-3.5 text-primary-500" />
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#1e2d4a]/20 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setLearningScheme(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg text-xs uppercase tracking-wider border border-slate-200 dark:border-[#1e2d4a]/85 cursor-pointer active:scale-95"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const selected = learningScheme
                    setLearningScheme(null)
                    setApplyingScheme(selected)
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  Apply Online
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Apply Online Modal Form */}
      <AnimatePresence>
        {applyingScheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApplyingScheme(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#131c2e] rounded-xl p-6 md:p-8 max-w-md w-full shadow-elevated border border-slate-100 dark:border-[#1e2d4a]/80 relative z-10 overflow-hidden flex flex-col justify-between max-h-[85vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/20">
                    Application Portal
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">
                    Register for {applyingScheme.title}
                  </h3>
                </div>
                <button
                  onClick={() => setApplyingScheme(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs text-slate-650 dark:text-slate-300">
                <div className="p-3.5 bg-primary-500/5 border border-primary-500/10 rounded-lg flex items-start gap-2.5">
                  <UserCheck className="w-5 h-5 text-primary-550 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white text-xs">Verify Aadhaar Identity</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                      Applications require Aadhaar authorization to associate records with the National Health Mission network.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aadhaar Card Number (12 Digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="0000 0000 0000"
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full input-field px-4 py-2.5 bg-slate-50/50 focus:bg-white dark:bg-slate-900/50 focus:dark:bg-slate-900 border border-slate-200 dark:border-[#1e2d4a]/80 rounded-lg font-mono text-sm tracking-widest text-center"
                  />
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50/30 dark:bg-slate-900/50 border border-slate-150/40 dark:border-[#1e2d4a]/30 rounded-lg text-[10px] text-slate-700 dark:text-slate-300">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Applicant verification</p>
                  <div className="flex justify-between border-b border-slate-50 dark:border-[#1e2d4a]/10 py-1 font-semibold">
                    <span>Citizen Name:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{userName || 'Citizen Profile'}</span>
                  </div>
                  <div className="flex justify-between py-1 font-semibold">
                    <span>Scheme Class:</span>
                    <span className="font-extrabold text-primary-600 dark:text-primary-450 uppercase">{applyingScheme.category}</span>
                  </div>
                </div>

                <label className="flex items-start gap-2 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentCheck}
                    onChange={(e) => setConsentCheck(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-primary-650 rounded shrink-0 cursor-pointer"
                  />
                  <span>I authorize the health council to verify my identity and link my profile to the registered scheme.</span>
                </label>

                <div className="pt-4 border-t border-slate-100 dark:border-[#1e2d4a]/20 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setApplyingScheme(null)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-extrabold rounded-lg text-xs uppercase tracking-wider border border-slate-200 dark:border-[#1e2d4a]/85 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || aadhaarInput.length !== 12 || !consentCheck}
                    className={cn(
                      "px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 text-white flex items-center justify-center min-w-[120px] cursor-pointer",
                      isSubmitting || aadhaarInput.length !== 12 || !consentCheck
                        ? "bg-slate-100 dark:bg-slate-850 text-slate-450 border border-slate-200/10 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-700 hover:to-indigo-700"
                    )}
                  >
                    {isSubmitting ? 'Verifying...' : 'Submit Request'}
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
