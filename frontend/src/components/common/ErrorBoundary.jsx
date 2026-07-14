import React, { Component } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught rendering error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50/40 dark:bg-gray-950 flex items-center justify-center p-6 text-gray-900 dark:text-gray-150">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full border border-gray-150/60 dark:border-gray-800/40 shadow-elevated text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-650" />
            
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Something Went Wrong</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                An unexpected error occurred while rendering this view. Your health data is safe, but we need to reload the workspace.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-gray-50 dark:bg-gray-850/50 rounded-2xl text-[11px] font-mono text-left text-red-600 dark:text-red-400 overflow-x-auto max-h-32 border border-gray-200/45 dark:border-gray-800/20">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                type="button"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-600 to-indigo-650 hover:from-primary-750 hover:to-indigo-750 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md shadow-primary-500/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Portal
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard' }}
                type="button"
                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
