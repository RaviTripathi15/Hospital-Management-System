'use strict';

/**
 * AI Service — Statistical analysis for health centre management.
 *
 * Algorithms used:
 *   - Simple Moving Average (SMA) for demand forecasting
 *   - Weighted Moving Average (WMA) for consumption rate estimation
 *   - Z-score outlier detection for underperforming centres
 *   - Linear regression trend for stockout prediction
 */

const Inventory = require('../models/Inventory');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const HealthCenter = require('../models/HealthCenter');
const User = require('../models/User');
const { THRESHOLDS } = require('../config/constants');
const logger = require('../config/logger');

// ─── Statistical Helpers ──────────────────────────────────────────────────────

/** Simple Moving Average */
const movingAverage = (values, window) => {
  if (!values || values.length === 0) return 0;
  const w = Math.min(window, values.length);
  const slice = values.slice(-w);
  return slice.reduce((a, b) => a + b, 0) / w;
};

/** Weighted Moving Average — recent values have higher weight */
const weightedMovingAverage = (values, window) => {
  if (!values || values.length === 0) return 0;
  const w = Math.min(window, values.length);
  const slice = values.slice(-w);
  let weightSum = 0;
  let weightedTotal = 0;
  slice.forEach((v, i) => {
    const weight = i + 1; // more recent = higher weight
    weightedTotal += v * weight;
    weightSum += weight;
  });
  return weightedTotal / weightSum;
};

/** Standard deviation of an array */
const stdDev = (values) => {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

/** Z-score for a value in an array */
const zScore = (value, mean, sd) => {
  if (sd === 0) return 0;
  return (value - mean) / sd;
};

/** Simple linear regression — returns { slope, intercept } */
const linearRegression = (y) => {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0 };
  const x = y.map((_, i) => i);
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  const slope =
    x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
    x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
};

/** Forecast value at step t using linear regression params */
const forecastLinear = ({ slope, intercept }, t) => Math.max(0, slope * t + intercept);

// ─── Build daily consumption series for an inventory item ─────────────────────
const buildConsumptionSeries = (restockHistory, lookbackDays = 90) => {
  if (!restockHistory || restockHistory.length === 0) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  // Group subtract operations by date
  const dailyMap = {};
  restockHistory
    .filter((r) => r.operation === 'subtract' && new Date(r.createdAt) >= cutoff)
    .forEach((r) => {
      const day = new Date(r.createdAt).toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + Math.abs(r.quantity);
    });

  // Fill gaps with 0 for consecutive days
  const series = [];
  for (let d = 0; d < lookbackDays; d++) {
    const dt = new Date();
    dt.setDate(dt.getDate() - (lookbackDays - d - 1));
    const key = dt.toISOString().split('T')[0];
    series.push(dailyMap[key] || 0);
  }

  return series;
};

// ─── demandForecast ───────────────────────────────────────────────────────────
/**
 * Forecast daily demand for all active inventory items at a centre.
 * Uses WMA for recent trend + linear regression for seasonal correction.
 *
 * @param {string} centerId
 * @returns {Promise<object>}
 */
const demandForecast = async (centerId) => {
  const items = await Inventory.find({ healthCenter: centerId, isActive: true }).lean();

  const forecasts = items.map((item) => {
    const series = buildConsumptionSeries(item.restockHistory, 90);
    const avgDailyConsumption = weightedMovingAverage(series, THRESHOLDS.MOVING_AVERAGE_WINDOW);

    // Linear regression for trend detection
    const regression = linearRegression(series.length > 0 ? series : [0]);

    // Forecast for next 30 days
    const dailyForecasts = [];
    for (let day = 1; day <= THRESHOLDS.FORECAST_DAYS; day++) {
      const predicted = forecastLinear(regression, series.length + day);
      const smoothed = 0.6 * predicted + 0.4 * avgDailyConsumption;
      dailyForecasts.push(Math.round(smoothed * 10) / 10);
    }

    const totalForecastedDemand = dailyForecasts.reduce((a, b) => a + b, 0);
    const stdDeviation = stdDev(series.length > 1 ? series : [0, 0]);
    const safetyStock = Math.ceil(stdDeviation * 1.645); // 95% service level

    return {
      itemId: item._id,
      itemName: item.itemName,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
      forecastedDemand30Days: Math.round(totalForecastedDemand),
      recommendedReorderQty: Math.max(0, Math.round(totalForecastedDemand + safetyStock - item.currentStock)),
      safetyStock,
      trend: regression.slope > 0.05 ? 'increasing' : regression.slope < -0.05 ? 'decreasing' : 'stable',
      confidence: series.filter((v) => v > 0).length > 14 ? 'high' : series.filter((v) => v > 0).length > 7 ? 'medium' : 'low',
    };
  });

  return {
    centerId,
    generatedAt: new Date().toISOString(),
    forecastDays: THRESHOLDS.FORECAST_DAYS,
    items: forecasts.sort((a, b) => b.recommendedReorderQty - a.recommendedReorderQty),
  };
};

// ─── predictStockouts ─────────────────────────────────────────────────────────
/**
 * Predict which items will run out and when.
 *
 * @param {string} centerId
 * @returns {Promise<object>}
 */
const predictStockouts = async (centerId) => {
  const items = await Inventory.find({ healthCenter: centerId, isActive: true, currentStock: { $gt: 0 } }).lean();

  const predictions = items
    .map((item) => {
      const series = buildConsumptionSeries(item.restockHistory, 30);
      const avgDailyConsumption = weightedMovingAverage(series, 7);

      if (avgDailyConsumption <= 0) {
        return {
          itemId: item._id,
          itemName: item.itemName,
          currentStock: item.currentStock,
          unit: item.unit,
          avgDailyConsumption: 0,
          daysUntilStockout: null,
          predictedStockoutDate: null,
          riskLevel: 'unknown',
          recommendation: 'No recent consumption data. Verify item usage.',
        };
      }

      const daysUntilStockout = Math.floor(item.currentStock / avgDailyConsumption);
      const stockoutDate = new Date();
      stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

      let riskLevel;
      if (daysUntilStockout <= 7) riskLevel = 'critical';
      else if (daysUntilStockout <= 14) riskLevel = 'high';
      else if (daysUntilStockout <= THRESHOLDS.LOW_STOCK_DAYS) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        itemId: item._id,
        itemName: item.itemName,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
        daysUntilStockout,
        predictedStockoutDate: stockoutDate.toISOString().split('T')[0],
        riskLevel,
        recommendation:
          daysUntilStockout <= 14
            ? `Immediate reorder required. Estimated stockout in ${daysUntilStockout} day(s).`
            : `Monitor stock. Reorder within ${Math.max(0, daysUntilStockout - 7)} days.`,
      };
    })
    .filter((p) => p.daysUntilStockout !== null && p.daysUntilStockout <= THRESHOLDS.FORECAST_DAYS)
    .sort((a, b) => (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999));

  const criticalCount = predictions.filter((p) => p.riskLevel === 'critical').length;
  const highCount = predictions.filter((p) => p.riskLevel === 'high').length;

  return {
    centerId,
    generatedAt: new Date().toISOString(),
    summary: { critical: criticalCount, high: highCount, total: predictions.length },
    predictions,
  };
};

// ─── resourceOptimization ─────────────────────────────────────────────────────
/**
 * Analyse resource utilisation and return recommendations.
 *
 * @param {string} centerId
 * @returns {Promise<object>}
 */
const resourceOptimization = async (centerId) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [center, staffCount, patientCount, appointments] = await Promise.all([
    HealthCenter.findById(centerId).lean(),
    User.countDocuments({ healthCenter: centerId, isActive: true }),
    Patient.countDocuments({ healthCenter: centerId, isActive: true }),
    Appointment.find({
      healthCenter: centerId,
      date: { $gte: thirtyDaysAgo },
    }).lean(),
  ]);

  if (!center) throw new Error('Health centre not found.');

  const recommendations = [];
  const metrics = {};

  // Staff-to-patient ratio
  const staffPatientRatio = patientCount > 0 ? staffCount / patientCount : 0;
  metrics.staffPatientRatio = Math.round(staffPatientRatio * 1000) / 1000;
  metrics.staffCount = staffCount;
  metrics.patientCount = patientCount;

  if (staffPatientRatio < THRESHOLDS.MIN_STAFF_PATIENT_RATIO) {
    recommendations.push({
      area: 'Staffing',
      priority: 'high',
      issue: `Staff-to-patient ratio is ${(staffPatientRatio * 100).toFixed(1)}% (below minimum ${(THRESHOLDS.MIN_STAFF_PATIENT_RATIO * 100)}%).`,
      recommendation: `Consider adding ${Math.ceil(patientCount * THRESHOLDS.MIN_STAFF_PATIENT_RATIO - staffCount)} more staff members.`,
    });
  }

  // Appointment completion rate
  const totalAppts = appointments.length;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const noShowAppts = appointments.filter((a) => a.status === 'no-show').length;
  const completionRate = totalAppts > 0 ? completedAppts / totalAppts : 0;
  const noShowRate = totalAppts > 0 ? noShowAppts / totalAppts : 0;

  metrics.totalAppointments30Days = totalAppts;
  metrics.completionRate = Math.round(completionRate * 100);
  metrics.noShowRate = Math.round(noShowRate * 100);

  if (completionRate < 0.7 && totalAppts > 10) {
    recommendations.push({
      area: 'Appointment Management',
      priority: 'medium',
      issue: `Appointment completion rate is ${Math.round(completionRate * 100)}%.`,
      recommendation: 'Implement SMS/call reminders 24 hours before appointments to reduce no-shows.',
    });
  }

  if (noShowRate > 0.2) {
    recommendations.push({
      area: 'No-Show Reduction',
      priority: 'medium',
      issue: `No-show rate is ${Math.round(noShowRate * 100)}%.`,
      recommendation: 'Introduce a waitlist system to fill cancelled/no-show slots.',
    });
  }

  // Peak hour analysis
  const hourCounts = new Array(24).fill(0);
  appointments.forEach((a) => {
    if (a.date) hourCounts[new Date(a.date).getHours()]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const offPeakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count < (Math.max(...hourCounts) * 0.3) && h.count > 0);

  metrics.peakHour = `${peakHour}:00`;
  metrics.hourlyDistribution = hourCounts;

  if (peakHour >= 10 && peakHour <= 12) {
    recommendations.push({
      area: 'Scheduling Optimization',
      priority: 'low',
      issue: `Peak appointment time is ${peakHour}:00.`,
      recommendation: 'Consider staggering appointment slots and extending morning/evening slots to distribute load.',
    });
  }

  // Bed utilisation (if data available)
  if (center.bedCapacity > 0) {
    // Use admission appointments as a proxy for bed usage
    const inPatientAppts = appointments.filter((a) => a.type !== 'OPD').length;
    const bedUtilisation = Math.min(1, inPatientAppts / (center.bedCapacity * 30));
    metrics.bedUtilisation = Math.round(bedUtilisation * 100);

    if (bedUtilisation < 0.4) {
      recommendations.push({
        area: 'Bed Management',
        priority: 'low',
        issue: `Bed utilisation is ${Math.round(bedUtilisation * 100)}%.`,
        recommendation: 'Review patient admission criteria; consider outreach programs to increase utilisation.',
      });
    }
  }

  return {
    centerId,
    centerName: center.name,
    generatedAt: new Date().toISOString(),
    metrics,
    recommendations: recommendations.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    }),
  };
};

// ─── detectUnderperformingCenters ─────────────────────────────────────────────
/**
 * Use Z-score analysis to identify centres performing below district average.
 *
 * @param {string} districtName - District name.
 * @returns {Promise<object>}
 */
const detectUnderperformingCenters = async (districtName) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const centers = await HealthCenter.find({ district: districtName, isActive: true }).lean();
  if (centers.length === 0) return { district: districtName, centers: [], summary: 'No active centres found.' };

  // Gather per-centre metrics
  const centerMetrics = await Promise.all(
    centers.map(async (c) => {
      const [patients, appts, completedAppts, staffCount] = await Promise.all([
        Patient.countDocuments({ healthCenter: c._id, isActive: true }),
        Appointment.countDocuments({ healthCenter: c._id, date: { $gte: thirtyDaysAgo } }),
        Appointment.countDocuments({ healthCenter: c._id, status: 'completed', date: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ healthCenter: c._id, isActive: true }),
      ]);

      const completionRate = appts > 0 ? completedAppts / appts : 0;
      const avgPatientsPerStaff = staffCount > 0 ? patients / staffCount : 0;

      return {
        centerId: c._id,
        name: c.name,
        type: c.type,
        block: c.block,
        patients,
        appointmentsLast30Days: appts,
        completionRate,
        staffCount,
        avgPatientsPerStaff,
      };
    })
  );

  // Compute statistics for each metric
  const computeZScores = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sd = stdDev(values);
    return values.map((v) => ({ mean, sd, z: zScore(v, mean, sd) }));
  };

  const patientValues = centerMetrics.map((c) => c.patients);
  const apptValues = centerMetrics.map((c) => c.appointmentsLast30Days);
  const completionValues = centerMetrics.map((c) => c.completionRate);

  const patientZScores = computeZScores(patientValues);
  const apptZScores = computeZScores(apptValues);
  const completionZScores = computeZScores(completionValues);

  const UNDERPERFORM_Z = -1.0; // Below 1 SD from mean

  const ranked = centerMetrics.map((c, i) => {
    const compositeZ = (patientZScores[i].z + apptZScores[i].z + completionZScores[i].z) / 3;
    const issues = [];

    if (patientZScores[i].z < UNDERPERFORM_Z) {
      issues.push(`Low patient registration (${c.patients} vs district avg ${Math.round(patientZScores[i].mean)})`);
    }
    if (apptZScores[i].z < UNDERPERFORM_Z) {
      issues.push(`Low appointments (${c.appointmentsLast30Days} in 30 days vs avg ${Math.round(apptZScores[i].mean)})`);
    }
    if (completionZScores[i].z < UNDERPERFORM_Z) {
      issues.push(`Low completion rate (${Math.round(c.completionRate * 100)}% vs avg ${Math.round(completionZScores[i].mean * 100)}%)`);
    }

    return {
      ...c,
      compositeScore: Math.round(compositeZ * 100) / 100,
      zScores: {
        patients: Math.round(patientZScores[i].z * 100) / 100,
        appointments: Math.round(apptZScores[i].z * 100) / 100,
        completionRate: Math.round(completionZScores[i].z * 100) / 100,
      },
      isUnderperforming: compositeZ < UNDERPERFORM_Z,
      issues,
      performanceCategory:
        compositeZ >= 0.5 ? 'excellent' :
        compositeZ >= 0 ? 'good' :
        compositeZ >= -0.5 ? 'average' :
        compositeZ >= -1 ? 'below_average' : 'poor',
    };
  });

  const underperforming = ranked.filter((c) => c.isUnderperforming).sort((a, b) => a.compositeScore - b.compositeScore);
  const districtMeans = {
    avgPatients: Math.round(patientValues.reduce((a, b) => a + b, 0) / patientValues.length),
    avgAppointments30Days: Math.round(apptValues.reduce((a, b) => a + b, 0) / apptValues.length),
    avgCompletionRate: Math.round((completionValues.reduce((a, b) => a + b, 0) / completionValues.length) * 100),
  };

  return {
    district: districtName,
    generatedAt: new Date().toISOString(),
    totalCenters: centers.length,
    underperformingCount: underperforming.length,
    districtAverages: districtMeans,
    underperformingCenters: underperforming,
    allCenters: ranked.sort((a, b) => b.compositeScore - a.compositeScore),
  };
};

// ─── generateInsights ─────────────────────────────────────────────────────────
/**
 * Combine all AI analyses into a prioritised list of actionable insights.
 *
 * @param {string} centerId
 * @returns {Promise<object>}
 */
const generateInsights = async (centerId) => {
  try {
    const [forecast, stockouts, resources] = await Promise.all([
      demandForecast(centerId),
      predictStockouts(centerId),
      resourceOptimization(centerId),
    ]);

    const insights = [];

    // Critical stockout insights
    stockouts.predictions
      .filter((p) => p.riskLevel === 'critical')
      .slice(0, 5)
      .forEach((p) => {
        insights.push({
          id: `stockout-${p.itemId}`,
          category: 'inventory',
          priority: 'critical',
          title: `Critical: ${p.itemName} will run out in ${p.daysUntilStockout} day(s)`,
          description: p.recommendation,
          action: 'Reorder immediately',
          data: { itemId: p.itemId, daysUntilStockout: p.daysUntilStockout },
        });
      });

    // High demand forecast items
    forecast.items
      .filter((f) => f.recommendedReorderQty > 0 && f.trend === 'increasing')
      .slice(0, 3)
      .forEach((f) => {
        insights.push({
          id: `demand-${f.itemId}`,
          category: 'inventory',
          priority: 'high',
          title: `Increasing demand for ${f.itemName}`,
          description: `Average daily consumption: ${f.avgDailyConsumption} ${f.unit}. Forecasted 30-day demand: ${f.forecastedDemand30Days} ${f.unit}.`,
          action: `Reorder ${f.recommendedReorderQty} ${f.unit}`,
          data: { itemId: f.itemId, reorderQty: f.recommendedReorderQty },
        });
      });

    // Resource optimization insights (high priority)
    resources.recommendations
      .filter((r) => r.priority === 'high')
      .forEach((r) => {
        insights.push({
          id: `resource-${r.area.replace(/\s+/g, '-').toLowerCase()}`,
          category: 'operations',
          priority: 'high',
          title: r.issue,
          description: r.recommendation,
          action: r.recommendation,
          data: { area: r.area },
        });
      });

    // Medium priority operational insights
    resources.recommendations
      .filter((r) => r.priority === 'medium')
      .forEach((r) => {
        insights.push({
          id: `ops-${r.area.replace(/\s+/g, '-').toLowerCase()}`,
          category: 'operations',
          priority: 'medium',
          title: r.issue,
          description: r.recommendation,
          action: r.recommendation,
          data: { area: r.area },
        });
      });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      centerId,
      centerName: resources.centerName,
      generatedAt: new Date().toISOString(),
      summary: {
        critical: insights.filter((i) => i.priority === 'critical').length,
        high: insights.filter((i) => i.priority === 'high').length,
        medium: insights.filter((i) => i.priority === 'medium').length,
        low: insights.filter((i) => i.priority === 'low').length,
        total: insights.length,
      },
      insights,
      metrics: resources.metrics,
    };
  } catch (err) {
    logger.error(`AI insights generation failed for centre ${centerId}: ${err.message}`);
    throw err;
  }
};

/**
 * Chat with AI Health Assistant
 * Supports Gemini API with rule-based fallback.
 *
 * @param {string} message - Current user message.
 * @param {Array} history - Conversational history.
 * @param {object} user - Current user object.
 * @returns {Promise<object>}
 */
const chatWithAI = async (message, history = [], user = null) => {
  let patientProfile = null;
  let activePrescriptions = [];
  let nearbyCenters = [];

  try {
    if (user) {
      // Find patient profiles associated with this user
      patientProfile = await Patient.findOne({
        $or: [{ userId: user._id }, { email: user.email }]
      }).lean();

      if (patientProfile && patientProfile.medicalHistory) {
        patientProfile.medicalHistory.forEach(visit => {
          if (visit.prescription && Array.isArray(visit.prescription)) {
            activePrescriptions.push(...visit.prescription);
          }
        });
      }

      const userDistrict = user.district || (patientProfile && patientProfile.district);
      if (userDistrict) {
        nearbyCenters = await HealthCenter.find({
          district: new RegExp(userDistrict, 'i'),
          isActive: true
        }).limit(3).lean();
      }
    }

    if (nearbyCenters.length === 0) {
      nearbyCenters = await HealthCenter.find({ isActive: true }).limit(3).lean();
    }
  } catch (dbErr) {
    logger.error(`Error fetching database context for AI chat: ${dbErr.message}`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const axios = require('axios');
      
      let systemInstructionText = `You are a professional AI Health Assistant for a digital healthcare management platform.
Your job is to assist citizens with:
1. Answering health questions.
2. Symptom checking (analyze user symptoms, offer safety instructions, and highlight when they should seek urgent medical care).
3. Providing medicine information (uses, general dosages, and precautions).
4. Recommending nearby Primary Health Centers (PHCs) or Community Health Centers (CHCs).
5. Giving healthy lifestyle tips.

CRITICAL INSTRUCTIONS:
- You are not a replacement for a doctor. Always include a short, standard disclaimer when advising on symptoms or medications.
- Keep your answers concise, clear, reassuring, and highly structured (use bullet points or headers where helpful).
- Answer in the same language or tone as the user.
`;

      if (user) {
        systemInstructionText += `\nCurrentUser Context: Name is "${user.firstName || user.name || 'Citizen'}", role is "${user.role}".`;
      }
      if (patientProfile) {
        systemInstructionText += `\nPatient Vitals: Weight=${patientProfile.weight}kg, Height=${patientProfile.height}cm, Blood Group="${patientProfile.bloodGroup}".`;
      }
      if (activePrescriptions.length > 0) {
        const medsStr = activePrescriptions.map(p => `${p.medicine} (${p.dosage}, ${p.duration})`).join(', ');
        systemInstructionText += `\nPatient's Active Prescriptions: ${medsStr}.`;
      }
      if (nearbyCenters.length > 0) {
        const centersStr = nearbyCenters.map(c => `- ${c.name} (${c.type}) in block "${c.block}", district "${c.district}". Contact: ${c.contactNumber || 'N/A'}`).join('\n');
        systemInstructionText += `\nNearby Health Centers Available:\n${centersStr}`;
      }

      const contents = [];
      
      if (Array.isArray(history)) {
        history.forEach(msg => {
          if (msg.sender && msg.text) {
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }]
            });
          } else if (msg.role && msg.parts) {
            contents.push(msg);
          }
        });
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          }
        },
        { timeout: 10000 }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
        const reply = response.data.candidates[0].content.parts[0].text;
        return {
          reply,
          source: 'gemini',
          timestamp: new Date().toISOString()
        };
      }
    } catch (apiErr) {
      logger.warn(`Gemini API call failed, falling back to rule-based mock: ${apiErr.message}`);
    }
  }

  const cleanMsg = message.toLowerCase();
  let reply = '';

  if (cleanMsg.includes('fever') || cleanMsg.includes('temp') || cleanMsg.includes('chills')) {
    reply = `### 🤒 Symptom Checker: Fever & Temperature
A fever is typically a sign that your body is fighting off an infection (viral or bacterial).

**What to do:**
1. **Stay Hydrated:** Drink plenty of fluids (water, oral rehydration solutions, clear broths).
2. **Rest:** Avoid heavy physical exertion.
3. **Monitor:** Check your temperature every 4-6 hours.
4. **Medication:** Over-the-counter paracetamol can help reduce fever. Follow dosage guidelines carefully.

**⚠️ Warning Signs (Consult a Doctor Immediately):**
- Fever exceeds 103°F (39.4°C) or lasts more than 3 days.
- Accompanied by severe headache, stiff neck, shortness of breath, or confusion.
- In infants under 3 months, any temperature above 100.4°F (38°C) warrants immediate medical care.`;
  }
  else if (cleanMsg.includes('headache') || cleanMsg.includes('migraine')) {
    reply = `### 🧠 Symptom Checker: Headaches
Headaches are very common and can stem from multiple causes, including dehydration, stress, lack of sleep, eye strain, or sinus pressure.

**What to do:**
1. **Hydrate:** Drink a large glass of water, as dehydration is a primary trigger.
2. **Rest:** Relax in a quiet, dark room. Apply a cool compress to your forehead.
3. **Acupressure:** Gently massage your temples or the area between your thumb and index finger.

**⚠️ Warning Signs (Emergency Care Required):**
- A sudden, excruciating headache (often described as the "worst headache of your life").
- Headache accompanied by fever, stiff neck, confusion, seizures, numbness, or difficulty speaking.
- Headache after a recent head injury.`;
  }
  else if (cleanMsg.includes('cough') || cleanMsg.includes('cold') || cleanMsg.includes('flu') || cleanMsg.includes('sore throat')) {
    reply = `### 🤧 Symptom Checker: Cough, Cold, & Throat Discomfort
Most respiratory tract symptoms are viral and resolve on their own within 7-10 days.

**What to do:**
1. **Warm Liquids:** Drink herbal teas, warm water with honey and lemon, or clear soups to soothe the throat.
2. **Steam Inhalation:** Inhale steam from a bowl of hot water or take a warm shower to relieve congestion.
3. **Gargle:** Gargle with warm salt water (1/2 tsp salt in warm water) 3-4 times a day.

**⚠️ Warning Signs (See a Doctor):**
- Difficulty breathing, persistent wheezing, or chest pain.
- Coughing up blood or thick rust-colored mucus.
- Symptoms that worsen significantly after starting to improve, or persist beyond 10-14 days.`;
  }
  else if (cleanMsg.includes('stomach') || cleanMsg.includes('pain') || cleanMsg.includes('nausea') || cleanMsg.includes('diarrhea') || cleanMsg.includes('vomit')) {
    reply = `### 🤢 Symptom Checker: Gastrointestinal Issues
Stomach ache, nausea, vomiting, or diarrhea can be caused by food poisoning, viral gastroenteritis ("stomach flu"), or indigestion.

**What to do:**
1. **Sip Liquids:** Avoid large gulps. Drink small sips of water, dilute juices, or Oral Rehydration Salts (ORS) to prevent dehydration.
2. **B.R.A.T. Diet:** When ready to eat, stick to bland foods: Bananas, Rice, Applesauce, and Toast.
3. **Avoid Triggers:** Stay away from dairy, caffeine, alcohol, fatty foods, and highly seasoned dishes.

**⚠️ Warning Signs (Seek Urgent Care):**
- Severe, localized abdominal pain (especially in the lower right side, which could indicate appendicitis).
- Inability to keep any liquids down for more than 12-24 hours.
- High fever, blood in vomit or stools, or extreme dizziness and dry mouth (severe dehydration).`;
  }
  else if (cleanMsg.includes('paracetamol') || cleanMsg.includes('acetaminophen') || cleanMsg.includes('crocin') || cleanMsg.includes('dolo')) {
    reply = `### 💊 Medicine Information: Paracetamol (Acetaminophen)
Paracetamol is a widely used over-the-counter analgesic (pain reliever) and antipyretic (fever reducer).

- **Common Uses:** Mild to moderate pain relief (headaches, muscle aches, toothaches, colds) and reducing fever.
- **Standard Adult Dosage:** 500 mg to 1000 mg every 4 to 6 hours as needed.
- **Maximum Limit:** **Do not exceed 4,000 mg (4g) within a 24-hour period.**
- **Precautions:** Excess usage can cause severe liver damage. Avoid alcohol and check other cold medications to ensure they do not also contain paracetamol.`;
  }
  else if (cleanMsg.includes('metformin')) {
    reply = `### 💊 Medicine Information: Metformin
Metformin is a first-line oral medication used to manage blood sugar levels in people with Type 2 Diabetes.

- **How it Works:** It improves insulin sensitivity and reduces the amount of glucose produced by the liver.
- **Dosage Guidelines:** Always follow your physician's prescription. It is usually started at 500mg or 850mg once or twice daily, taken **with meals** to reduce stomach side effects.
- **Precautions:** Avoid excessive alcohol intake while taking Metformin to minimize the rare risk of lactic acidosis. Monitor kidney function regularly.`;
  }
  else if (cleanMsg.includes('atorvastatin') || cleanMsg.includes('statin') || cleanMsg.includes('lipitor')) {
    reply = `### 💊 Medicine Information: Atorvastatin
Atorvastatin belongs to a class of drugs known as statins, used to lower cholesterol and reduce the risk of heart disease.

- **Common Uses:** Lowering low-density lipoprotein (LDL) "bad" cholesterol and triglycerides, and raising high-density lipoprotein (HDL) "good" cholesterol.
- **Dosage:** Typically taken once daily, usually in the evening. Dosages range from 10mg to 80mg depending on medical history.
- **Precautions:** Inform your doctor immediately if you experience unexplained muscle pain, tenderness, or weakness. Avoid drinking large quantities of grapefruit juice.`;
  }
  else if (cleanMsg.includes('medicine') || cleanMsg.includes('drug') || cleanMsg.includes('prescription') || cleanMsg.includes('dosage')) {
    if (activePrescriptions.length > 0) {
      const listMeds = activePrescriptions.map((m, i) => `${i + 1}. **${m.medicine}**: Take ${m.dosage} for ${m.duration || 'specified duration'}`).join('\n');
      reply = `### 📋 Your Active Prescriptions
According to your health registry profile:
${listMeds}

*Remember to take your medications as directed by your healthcare provider. If you need a refill, you can request one directly using the 'Request Medication Refills' button on your dashboard.*`;
    } else {
      reply = `### 💊 General Medication Guidelines
I can provide information on common medications like Paracetamol, Metformin, and Atorvastatin.

**Key Safety Rules:**
1. **Follow Prescriptions:** Never alter your dose or stop taking prescribed medication without consulting your doctor.
2. **Read Labels:** Check ingredients, expiry dates, and dosage schedules.
3. **Report Side Effects:** Talk to a clinician if you experience adverse effects.
4. **Keep Registry Updated:** Ensure all prescriptions from health centers are logged into your electronic medical record.`;
    }
  }
  else if (cleanMsg.includes('phc') || cleanMsg.includes('center') || cleanMsg.includes('clinic') || cleanMsg.includes('recommend') || cleanMsg.includes('hospital') || cleanMsg.includes('nearby')) {
    if (nearbyCenters.length > 0) {
      const centerList = nearbyCenters.map((c, i) => {
        return `${i + 1}. **${c.name}** (${c.type})
   - **Location:** Block: ${c.block}, District: ${c.district}
   - **Contact:** ${c.contactNumber || 'No number listed'}
   - **Beds Capacity:** ${c.bedCapacity || 0} beds`;
      }).join('\n\n');
      reply = `### 🏥 Recommended Nearest Health Centers
Based on your current district preference and our active registry, we recommend the following clinics:

${centerList}

*You can view their doctor schedules, bed availability, and book an appointment directly through the "Find Nearby PHC" quick action on your dashboard.*`;
    } else {
      reply = `### 🏥 Health Center Recommendations
I recommend visiting a Primary Health Center (PHC) for general consultations, routine immunizations, and preventative checkups.

To locate one:
1. Click **Find Nearby PHC** on your dashboard.
2. Filter by your district and block to see active centers, doctor availability, and phone numbers.
3. You can book an appointment online to skip the wait queue.`;
    }
  }
  else if (cleanMsg.includes('tip') || cleanMsg.includes('advice') || cleanMsg.includes('health tips') || cleanMsg.includes('lifestyle')) {
    const HEALTH_TIPS = [
      "**Stay hydrated!** Aim for at least 8-10 glasses of water daily to support digestion, circulation, and temperature regulation.",
      "**Get active!** A 30-minute daily walk can drastically improve cardiovascular health, mood, and sleep quality.",
      "**Quality Sleep:** Ensure you get 7-8 hours of uninterrupted sleep each night to allow your body to heal and recover.",
      "**Eat a Rainbow:** Include colorful vegetables in your meals. They are packed with antioxidants, vitamins, and dietary fiber.",
      "**Mindfulness:** Practice deep breathing or meditation for 5 minutes daily to reduce stress levels and blood pressure.",
      "**Screen Time Rest:** Protect your eyes with the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds."
    ];
    const randTip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
    reply = `### 💡 Curated AI Health Tip
Here is a health tip to keep you thriving:

${randTip}

*Small daily habits yield massive health benefits over time. Keep logging your vitals on your dashboard to see your health score rise!*`;
  }
  else if (cleanMsg.includes('symptom') || cleanMsg.includes('check')) {
    reply = `### 🩺 Symptom Checker Guidance
I can help check simple symptoms. Please describe what you are feeling. For example, ask me about:
- **"I have a fever"**
- **"My head is hurting"**
- **"I have a cough and throat irritation"**
- **"My stomach feels upset"**

*Disclaimer: This is for educational guidance. If you feel very unwell, please visit your nearest PHC or call emergency services at 108 immediately.*`;
  }
  else if (cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('hey') || cleanMsg.includes('greet')) {
    const greetingName = user ? (user.firstName || user.name || 'Citizen') : 'Citizen';
    reply = `Hello, **${greetingName}**! I am your AI Health Assistant. 

How can I support your wellness journey today? Feel free to ask me about:
- **Symptoms:** "What should I do for a sore throat?"
- **Medicines:** "Tell me about Metformin."
- **Nearby Clinics:** "Where is the nearest PHC?"
- **Daily Tips:** "Give me some healthy advice."`;
  } else {
    reply = `I've received your query: *"hl"*

I am prepared for full integration with your backend LLM model. Since the API is running in fallback mode, I can provide detailed guidance on:
- **Symptoms** (e.g. fever, headache, cough, stomach pain)
- **Medicines** (e.g. Paracetamol, Metformin, Atorvastatin)
- **Clinic Locations** (Primary and Community Health Centers in your district)
- **Health Tips** (daily wellness advice)

Could you rephrase your question focusing on one of these areas, or ask a specific medical question?`;
  }

  return {
    reply,
    source: 'mock',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  demandForecast,
  predictStockouts,
  resourceOptimization,
  detectUnderperformingCenters,
  generateInsights,
  chatWithAI,
};
