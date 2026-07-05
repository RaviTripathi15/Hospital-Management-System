import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-extrabold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  )
}
