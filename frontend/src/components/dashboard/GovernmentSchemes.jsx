import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, Heart, Calendar, Activity, CheckCircle2, ShieldCheck, FileText, X, ChevronRight, UserCheck
} from 'lucide-react'
import { cn } from '@/utils/cn'

const SCHEMES = [
  {
    id: 'scheme-1',
    title: 'Ayushman Bharat (PM-JAY)',
    category: 'Insurance',
    description: 'National health protection scheme providing free cashless hospitalization coverage up to ₹5 Lakhs per family per year for secondary and tertiary care.',
    eligibility: 'Families identified under low-income criteria in the Socio-Economic Caste Census (SECC) database.',
    benefits: [
      'Cashless hospital admission across empaneled public & private hospitals.',
      'Covers up to 3 days of pre-hospitalization and 15 days of post-hospitalization costs.',
      'Covers diagnostics, medications, ICU charges, and over 1,350 medical packages.',
      'No cap on family size or age limits.'
    ],
    documents: ['Aadhaar Card', 'Ration Card / PM-JAY Letter', 'Mobile Number linked to Aadhaar'],
    prefix: 'AB-PMJAY',
    icon: Award,
    color: 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/30'
  },
  {
    id: 'scheme-2',
    title: 'National Immunization Program',
    category: 'Vaccination',
    description: 'Government immunisation program ensuring free-of-cost vaccine administration to shield infants, children, and pregnant mothers from vaccine-preventable diseases.',
    eligibility: 'All infants, children up to 16 years, and pregnant mothers residing in the district.',
    benefits: [
      'Free vaccines covering Polio, BCG, Hepatitis B, Tetanus, Rotavirus, and Measles.',
      'Immunization record tracking with digital certificate generation.',
      'Access to counseling and vaccination schedules at any local PHC/SHC.'
    ],
    documents: ['Child Birth Registration Card', 'Mother ID (Aadhaar)', 'Guardian Mobile Number'],
    prefix: 'NID-VACC',
    icon: ShieldCheck,
    color: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/30'
  },
  {
    id: 'scheme-3',
    title: 'Free Diagnostic Health Camps',
    category: 'Health Camp',
    description: 'Weekly block-level diagnostic medical camps bringing specialist doctors, laboratory testing, and pharmacy supplies directly to rural communities at zero expense.',
    eligibility: 'Open to all local citizens, prioritized for rural blocks and diagnostic card holders.',
    benefits: [
      'Free general physician and pediatric specialist consultations.',
      'On-the-spot blood sugar, pressure, and haemoglobin blood tests.',
      'Dispensation of primary medicines for common ailments at no cost.',
      'Referral linkages to District Specialty Hospitals.'
    ],
    documents: ['Any government-issued Photo ID Card', 'Previous medical reports (if any)'],
    prefix: 'FHC-CAMP',
    icon: Calendar,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100/30'
  },
  {
    id: 'scheme-4',
    title: 'District Blood Donation Drives',
    category: 'Blood Camp',
    description: 'State-facilitated blood donation drives organized at local health centers to secure emergency reserves for regional critical care patients.',
    eligibility: 'Healthy adults aged 18-65 years, weighing above 45 kg, with a hemoglobin level of 12.5 g/dL or above.',
    benefits: [
      'Free baseline health checkup (Blood Grouping, BP, Hb levels, Pulse).',
      'Donor certification and priority blood card valid for immediate family members.',
      'Complimentary refreshments and donor appreciation badge.'
    ],
    documents: ['Donor Registration Card (if previous donor)', 'Aadhaar / Voter Card'],
    prefix: 'BDD-DONOR',
    icon: Heart,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100/30'
  }
]

export default function GovernmentSchemes({ userName, onApplyFeedback }) {
  const [learningScheme, setLearningScheme] = useState(null)
  const [applyingScheme, setApplyingScheme] = useState(null)
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [consentCheck, setConsentCheck] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle application submission trigger
  const handleApplySubmit = (e) => {
    e.preventDefault()
    if (aadhaarInput.length !== 12 || isNaN(aadhaarInput)) {
      alert('Please enter a valid 12-digit Aadhaar Number.')
      return
    }
    if (!consentCheck) {
      alert('Please consent to share Aadhaar credentials for verification.')
      return
    }

    setIsSubmitting(true)
    // Simulate digital identity validation and dispatch delay
    setTimeout(() => {
      setIsSubmitting(false)
      const trackId = `${applyingScheme.prefix}-${Math.floor(100000 + Math.random() * 900000)}`
      
      // Close modal
      const schemeTitle = applyingScheme.title
      setApplyingScheme(null)
      setAadhaarInput('')
      setConsentCheck(false)

      // Alert parent feedback banner
      if (onApplyFeedback) {
        onApplyFeedback({
          isOpen: true,
          type: 'success',
          title: 'Application Received',
          message: `Your registration request for "${schemeTitle}" has been logged successfully. Your application tracking number is: ${trackId}. Credentials verification in progress.`
        })
      }
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-150/60 dark:border-gray-700/60 shadow-soft space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-base font-bold text-gray-955 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Government Health Schemes & Campaigns
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Apply online for public health insurance, immunization campaigns, and local health diagnostic programs.
        </p>
      </div>

      {/* Schemes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCHEMES.map((scheme, idx) => {
          const Icon = scheme.icon
          return (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2, scale: 1.004 }}
              className="p-5 bg-gray-50/40 dark:bg-gray-850/15 border border-gray-150/50 dark:border-gray-800/40 rounded-2xl flex flex-col justify-between relative overflow-hidden group shadow-sm hover:shadow transition-all duration-300"
            >
              {/* Card visual glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div>
                {/* Upper Details */}
                <div className="flex justify-between items-start gap-4">
                  <div className={cn("p-2.5 rounded-xl border shrink-0", scheme.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 px-2.5 py-0.5 rounded-full border border-gray-200/20">
                    {scheme.category}
                  </span>
                </div>

                {/* Info Text */}
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                    {scheme.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    {scheme.description}
                  </p>
                </div>

                {/* Eligibility criteria highlight */}
                <div className="mt-4 p-3 bg-gray-100/45 dark:bg-gray-850/30 rounded-xl border border-gray-200/10">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1">Target Eligibility</h4>
                  <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 leading-normal">
                    {scheme.eligibility}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-6 pt-3.5 border-t border-gray-100/50 dark:border-gray-850/40">
                <button
                  onClick={() => setLearningScheme(scheme)}
                  className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors border border-gray-150/45 dark:border-gray-750/30 cursor-pointer active:scale-95 text-center"
                >
                  Learn More
                </button>
                <button
                  onClick={() => setApplyingScheme(scheme)}
                  className="flex-1 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-750 hover:to-indigo-750 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 text-center cursor-pointer"
                >
                  Apply Now
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLearningScheme(null)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-elevated border border-gray-150/60 dark:border-gray-700/60 relative z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border">
                    {learningScheme.category} Scheme
                  </span>
                  <h3 className="text-base font-extrabold text-gray-955 dark:text-white mt-1.5">
                    {learningScheme.title} Coverage Benefits
                  </h3>
                </div>
                <button
                  onClick={() => setLearningScheme(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-650 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detailed description lists */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar text-xs leading-relaxed text-gray-650 dark:text-gray-300">
                <p className="font-medium bg-gray-50/20 dark:bg-gray-850/10 p-3 rounded-xl border border-gray-100 dark:border-gray-800/30">
                  {learningScheme.description}
                </p>

                {/* Benefits checklists */}
                <div className="space-y-2">
                  <h4 className="font-black text-gray-905 dark:text-white uppercase tracking-wider text-[9px] text-gray-450">Key Benefits Covered</h4>
                  <ul className="space-y-1.5">
                    {learningScheme.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Required docs list */}
                <div className="space-y-2">
                  <h4 className="font-black text-gray-905 dark:text-white uppercase tracking-wider text-[9px] text-gray-450">Required Verification Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {learningScheme.documents.map((doc, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-800 dark:text-gray-250 bg-gray-100/60 dark:bg-gray-700/60 px-2.5 py-1 rounded-lg border border-gray-250/20">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-150/60 dark:border-gray-850/40 flex justify-end gap-3 shrink-0 animate-fade-in">
                <button
                  onClick={() => setLearningScheme(null)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors border border-gray-150/40 dark:border-gray-750/30 cursor-pointer active:scale-95"
                >
                  Close Detail
                </button>
                <button
                  onClick={() => {
                    const selected = learningScheme
                    setLearningScheme(null)
                    setApplyingScheme(selected)
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-750 hover:to-indigo-750 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setApplyingScheme(null)}
              className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-elevated border border-gray-150/60 dark:border-gray-700/60 relative z-10 overflow-hidden flex flex-col justify-between max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-indigo-500" />
              
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded border">
                    Registration Portal
                  </span>
                  <h3 className="text-base font-extrabold text-gray-955 dark:text-white mt-1.5">
                    Register for {applyingScheme.title}
                  </h3>
                </div>
                <button
                  onClick={() => setApplyingScheme(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-400 hover:text-gray-650 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleApplySubmit} className="space-y-5 text-xs text-gray-650 dark:text-gray-300">
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start gap-2.5">
                  <UserCheck className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-gray-900 dark:text-white text-xs">Verify Digital Identity</p>
                    <p className="text-[10px] text-gray-505 dark:text-gray-450 leading-normal mt-0.5">
                      Applications require Aadhaar validation to link your medical records to the regional NHM network.
                    </p>
                  </div>
                </div>

                {/* Aadhaar Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aadhaar Number (12 Digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="Enter 12-digit Aadhaar Card Number"
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full input-field px-4 py-2.5 bg-gray-50/50 focus:bg-white dark:bg-gray-850/10 focus:dark:bg-gray-850/30 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm tracking-widest text-center"
                  />
                </div>

                {/* Details validation checklist */}
                <div className="space-y-2 p-3.5 bg-gray-50/30 dark:bg-gray-850/20 border rounded-xl font-semibold space-y-1 text-[10px] text-gray-700 dark:text-gray-300">
                  <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest">Verify Profile Details</p>
                  <div className="flex justify-between border-b border-gray-100/50 dark:border-gray-800/10 py-1 mt-1.5">
                    <span>Applicant Name:</span>
                    <span className="font-extrabold text-gray-950 dark:text-white">{userName || 'Verified Citizen'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Scheme Class:</span>
                    <span className="font-extrabold text-indigo-500 uppercase">{applyingScheme.category} Selection</span>
                  </div>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2 text-[10px] font-semibold text-gray-505 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentCheck}
                    onChange={(e) => setConsentCheck(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 accent-primary-600 rounded shrink-0"
                  />
                  <span>I authorize the National Health Mission to verify my Aadhaar and link this profile to the selected health scheme.</span>
                </label>

                {/* Buttons footer */}
                <div className="pt-4 border-t border-gray-150/60 dark:border-gray-850/40 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setApplyingScheme(null)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors border border-gray-150/40 dark:border-gray-750/30 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || aadhaarInput.length !== 12 || !consentCheck}
                    className={cn(
                      "px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 text-white flex items-center justify-center min-w-[120px] cursor-pointer",
                      isSubmitting || aadhaarInput.length !== 12 || !consentCheck
                        ? "bg-gray-200 dark:bg-gray-750 text-gray-400 border-gray-200/20 cursor-not-allowed"
                        : "bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-750 hover:to-indigo-750"
                    )}
                  >
                    {isSubmitting ? 'Verifying...' : 'Submit Application'}
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
