import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'

export default function FeedbackOverlay({
  isOpen,
  type = 'success',
  title,
  message,
  onClose,
  duration = 2500,
}) {
  React.useEffect(() => {
    if (isOpen && onClose && duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.2, type: 'spring', duration: 0.6, bounce: 0 },
        opacity: { delay: 0.2, duration: 0.01 }
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-elevated border border-gray-100 dark:border-gray-700/80 text-center relative z-10 overflow-hidden"
          >
            {/* Animated Background Glow */}
            <div className={`absolute -top-12 -left-12 w-24 h-24 rounded-full filter blur-xl opacity-20 ${
              type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            <div className={`absolute -bottom-12 -right-12 w-24 h-24 rounded-full filter blur-xl opacity-20 ${
              type === 'success' ? 'bg-blue-500' : 'bg-orange-500'
            }`} />

            <div className="flex justify-center mb-6">
              {type === 'success' ? (
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                  <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <motion.path
                      d="M20 6L9 17L4 12"
                      variants={draw}
                      initial="hidden"
                      animate="visible"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center border border-red-100 dark:border-red-900/30">
                  <svg className="w-10 h-10 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <motion.path
                      d="M18 6L6 18M6 6l12 12"
                      variants={draw}
                      initial="hidden"
                      animate="visible"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              {message}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
