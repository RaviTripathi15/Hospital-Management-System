import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Users, Pill, Bed, Activity } from 'lucide-react';
import api from '@/services/api';

const PredictionDashboard = () => {
  const [predictions, setPredictions] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    fetchPredictions();
  }, [daysAhead]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, riskRes] = await Promise.all([
        api.get(`/predictions/dashboard?daysAhead=${daysAhead}`),
        api.get('/predictions/risk-assessment'),
      ]);

      setPredictions(dashboardRes.data.data);
      setRiskAssessment(riskRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load predictions');
      console.error('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error loading predictions</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getRiskLabel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-5 h-5 text-red-500" />;
    if (trend < 0) return <TrendingDown className="w-5 h-5 text-green-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Predictions & Forecasting</h1>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDaysAhead(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                daysAhead === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Overall Risk Assessment */}
      {riskAssessment && (
        <div className={`rounded-lg border-2 p-6 ${getRiskColor(riskAssessment.overallRiskScore)}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Overall Risk Assessment</h2>
              <p className="text-sm opacity-90">
                Last assessment: {new Date(riskAssessment.lastAssessment).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{riskAssessment.overallRiskScore}</div>
              <div className="text-sm font-semibold">{riskAssessment.riskLevel} Risk</div>
            </div>
          </div>

          {/* Critical Issues */}
          {riskAssessment.criticalIssues.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Issues
              </h3>
              <div className="space-y-1">
                {riskAssessment.criticalIssues.map((issue, idx) => (
                  <div key={idx} className="text-sm opacity-90">
                    • {issue.type.replace('_', ' ').toUpperCase()}: {issue.count}{' '}
                    <span className="font-semibold">- {issue.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Patient Footfall */}
        {predictions?.predictions.footfall && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Patient Footfall</h3>
              <Activity className="w-6 h-6 text-blue-500" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Current Daily Average</p>
                <p className="text-2xl font-bold text-gray-900">
                  {predictions.predictions.footfall.currentAverageDailyFootfall}
                </p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-600">Predicted Average</p>
                  <p className="text-xl font-bold text-blue-600">
                    {predictions.predictions.footfall.predictedDailyAverage}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Footfall</p>
                  <p className="text-xl font-bold text-gray-900">
                    {predictions.predictions.footfall.predictedTotalFootfall}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {getTrendIcon(predictions.predictions.footfall.trend)}
                <span className="text-gray-600">
                  Trend: {predictions.predictions.footfall.trend > 0 ? '+' : ''}
                  {predictions.predictions.footfall.trend.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="font-semibold text-gray-900">
                    {predictions.predictions.footfall.confidence}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(predictions.predictions.footfall.riskScore)}`}>
                  {getRiskLabel(predictions.predictions.footfall.riskScore)}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-blue-50 rounded p-2 text-xs">
                {predictions.predictions.footfall.suggestedActions.slice(0, 2).map((action, idx) => (
                  <p key={idx} className="text-blue-700 mb-1">• {action}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Doctor Requirement */}
        {predictions?.predictions.doctorRequirement && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Doctor Requirement</h3>
              <Users className="w-6 h-6 text-purple-500" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Doctors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {predictions.predictions.doctorRequirement.currentDoctors}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Required Doctors</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {predictions.predictions.doctorRequirement.requiredDoctors}
                  </p>
                </div>
              </div>

              {predictions.predictions.doctorRequirement.shortage > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-red-700 font-semibold text-sm">
                    Shortage: {predictions.predictions.doctorRequirement.shortage} doctors
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, predictions.predictions.doctorRequirement.utilizationRate)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">
                    {predictions.predictions.doctorRequirement.utilizationRate}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="font-semibold text-gray-900">
                    {predictions.predictions.doctorRequirement.confidence}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(predictions.predictions.doctorRequirement.riskScore)}`}>
                  {getRiskLabel(predictions.predictions.doctorRequirement.riskScore)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bed Requirement */}
        {predictions?.predictions.bedRequirement && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bed Requirement</h3>
              <Bed className="w-6 h-6 text-green-500" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {predictions.predictions.bedRequirement.currentAverageOccupancy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Predicted Occupancy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {predictions.predictions.bedRequirement.predictedOccupancy}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-xs text-gray-600">Required</p>
                  <p className="font-bold text-gray-900">
                    {predictions.predictions.bedRequirement.requiredBeds}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Buffer</p>
                  <p className="font-bold text-orange-600">
                    {predictions.predictions.bedRequirement.bufferBeds}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Need</p>
                  <p className="font-bold text-green-600">
                    {predictions.predictions.bedRequirement.totalBedRequirement}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {getTrendIcon(predictions.predictions.bedRequirement.trend)}
                <span className="text-gray-600">
                  Avg Stay: {predictions.predictions.bedRequirement.averageLengthOfStay} days
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div>
                  <p className="text-xs text-gray-600">Confidence</p>
                  <p className="font-semibold text-gray-900">
                    {predictions.predictions.bedRequirement.confidence}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(predictions.predictions.bedRequirement.riskScore)}`}>
                  {getRiskLabel(predictions.predictions.bedRequirement.riskScore)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stock Out Warnings */}
        {predictions?.predictions.stockOutWarnings && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock-out Alerts</h3>
              <Pill className="w-6 h-6 text-orange-500" />
            </div>

            {predictions.predictions.stockOutWarnings.count === 0 ? (
              <p className="text-green-600 text-center py-4">✓ No stock-out warnings</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  {predictions.predictions.stockOutWarnings.count} item(s) at risk
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {predictions.predictions.stockOutWarnings.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="flex justify-between items-start gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{item.itemName}</p>
                          <p className="text-red-700 text-xs">
                            {item.daysUntilStockOut} days left
                          </p>
                        </div>
                        <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-semibold">
                          {item.riskScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {predictions.predictions.stockOutWarnings.count > 5 && (
                  <p className="text-xs text-gray-600 text-center">
                    +{predictions.predictions.stockOutWarnings.count - 5} more items
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionDashboard;
