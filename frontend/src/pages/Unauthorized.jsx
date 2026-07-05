import React from 'react'
import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-extrabold text-danger-500 mb-4">403</h1>
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">You do not have the required permissions to view this resource.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  )
}
