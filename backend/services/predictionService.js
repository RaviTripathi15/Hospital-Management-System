'use strict';

const Inventory = require('../models/Inventory');
const Footfall = require('../models/Footfall');
const BedAllocation = require('../models/BedAllocation');
const Attendance = require('../models/Attendance');
const logger = require('../config/logger');

/**
 * Prediction Service - AI-powered forecasting
 * Uses historical data, trends, and statistical analysis
 */

class PredictionService {
  /**
   * Calculate moving average
   */
  static calculateMovingAverage(data, windowSize = 7) {
    if (data.length < windowSize) return data[data.length - 1] || 0;

    let sum = 0;
    for (let i = data.length - windowSize; i < data.length; i++) {
      sum += data[i];
    }
    return sum / windowSize;
  }

  /**
   * Calculate trend (linear regression slope)
   */
  static calculateTrend(data) {
    if (data.length < 2) return 0;

    const n = data.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Calculate confidence percentage (based on data consistency)
   */
  static calculateConfidence(data) {
    if (data.length < 3) return 50;

    const mean = data.reduce((a, b) => a + b) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Lower variation = higher confidence
    const confidence = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 50));
    return Math.round(confidence);
  }

  /**
   * Predict Medicine Demand
   * Uses: consumption trends, seasonal patterns, current stock
   */
  static async predictMedicineDemand(healthCenterId, itemId, daysAhead = 30) {
    try {
      const inventory = await Inventory.findById(itemId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      // Verify item belongs to the given health center
      if (inventory.healthCenter.toString() !== healthCenterId) {
        throw new Error('Inventory item does not belong to the specified health center');
      }

      // Get historical usage data (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const historyData = inventory.restockHistory
        .filter((h) => {
          const hDate = h.createdAt || h._id?.getTimestamp?.() || new Date();
          return hDate >= ninetyDaysAgo && h.operation === 'subtract';
        })
        .sort((a, b) => {
          const aDate = a.createdAt || new Date();
          const bDate = b.createdAt || new Date();
          return aDate - bDate;
        });

      // Group by week and calculate average usage
      const weeklyUsage = {};
      historyData.forEach((record) => {
        const recordDate = record.createdAt || new Date();
        const week = Math.floor(
          (Date.now() - recordDate) / (7 * 24 * 60 * 60 * 1000)
        );
        weeklyUsage[week] = (weeklyUsage[week] || 0) + Math.abs(record.quantity || 0);
      });

      const usageValues = Object.values(weeklyUsage).sort((a, b) => a - b);
      const avgWeeklyUsage = this.calculateMovingAverage(usageValues);
      const trend = this.calculateTrend(usageValues);
      const confidence = this.calculateConfidence(usageValues);

      // Predict future demand
      const predictedDailyUsage = avgWeeklyUsage / 7;
      const predictedDemand = predictedDailyUsage * daysAhead;
      const trendAdjustedDemand = predictedDemand + trend * (daysAhead / 7);

      // Calculate risk score
      const currentStock = inventory.currentStock || 0;
      const daysOfStock = predictedDailyUsage > 0 ? currentStock / predictedDailyUsage : 999;
      let riskScore = 0;

      if (daysOfStock < daysAhead) {
        riskScore = 80; // High risk - may run out
      } else if (daysOfStock < daysAhead * 2) {
        riskScore = 60; // Medium risk
      } else {
        riskScore = 20; // Low risk
      }

      return {
        itemId: itemId.toString(),
        itemName: inventory.itemName,
        currentStock,
        predictedDemand: Math.round(trendAdjustedDemand),
        averageDailyUsage: Math.round(predictedDailyUsage),
        trend: Math.round(trend * 100) / 100,
        daysOfStock: Math.round(daysOfStock * 10) / 10,
        riskScore,
        confidence,
        suggestedActions: this._getMedicineSuggestedActions(
          daysOfStock,
          currentStock,
          predictedDemand
        ),
      };
    } catch (error) {
      logger.error(`Medicine prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict Early Stock-out Warning
   */
  static async predictStockOut(healthCenterId, thresholdDays = 7) {
    try {
      const inventory = await Inventory.find({ healthCenter: healthCenterId });

      const warnings = [];

      for (const item of inventory) {
        const usageData = item.restockHistory
          .filter((h) => h.operation === 'subtract')
          .map((h) => Math.abs(h.quantity || 0))
          .slice(-30);

        if (usageData.length > 0) {
          const avgDailyUsage = usageData.reduce((a, b) => a + b) / usageData.length;
          const daysUntilEmpty = avgDailyUsage > 0 ? (item.currentStock || 0) / avgDailyUsage : 999;

          if (daysUntilEmpty < thresholdDays) {
            warnings.push({
              itemId: item._id,
              itemName: item.itemName,
              currentStock: item.currentStock,
              avgDailyUsage: Math.round(avgDailyUsage * 100) / 100,
              daysUntilStockOut: Math.round(daysUntilEmpty * 10) / 10,
              riskScore: Math.min(100, Math.max(0, 100 - daysUntilEmpty * 15)),
              suggestedAction: `Reorder ${Math.ceil(avgDailyUsage * 14)} units immediately`,
            });
          }
        }
      }

      return warnings.sort((a, b) => a.daysUntilStockOut - b.daysUntilStockOut);
    } catch (error) {
      logger.error(`Stock-out prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict Patient Footfall
   * Uses: historical footfall patterns, trends, seasonal data
   */
  static async predictPatientFootfall(healthCenterId, daysAhead = 30, department = null) {
    try {
      const query = { healthCenter: healthCenterId };
      if (department) query.department = department;

      // Get last 90 days of footfall data
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const footfallData = await Footfall.find({
        ...query,
        timestamp: { $gte: ninetyDaysAgo },
      }).sort({ timestamp: 1 });

      // Group by day
      const dailyPatients = {};
      footfallData.forEach((record) => {
        const date = record.timestamp.toISOString().split('T')[0];
        dailyPatients[date] = (dailyPatients[date] || 0) + (record.patientCount || 0);
      });

      const patientValues = Object.values(dailyPatients);
      if (patientValues.length === 0) {
        return {
          healthCenterId: healthCenterId.toString(),
          department: department || 'All',
          currentAverageDailyFootfall: 0,
          predictedDailyAverage: 0,
          predictedTotalFootfall: 0,
          trend: 0,
          trendDirection: 'stable',
          confidence: 0,
          riskScore: 50,
          suggestedActions: ['Insufficient data for prediction'],
        };
      }

      const avgDailyPatients = this.calculateMovingAverage(patientValues);
      const trend = this.calculateTrend(patientValues);
      const confidence = this.calculateConfidence(patientValues);

      // Predict total footfall
      const predictedTotalFootfall = (avgDailyPatients + trend) * daysAhead;
      const predictedDailyAverage = avgDailyPatients + trend;

      return {
        healthCenterId: healthCenterId.toString(),
        department: department || 'All',
        currentAverageDailyFootfall: Math.round(avgDailyPatients),
        predictedDailyAverage: Math.round(predictedDailyAverage),
        predictedTotalFootfall: Math.round(predictedTotalFootfall),
        trend: Math.round(trend * 100) / 100,
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        riskScore: trend > avgDailyPatients * 0.2 ? 60 : 30,
        confidence,
        suggestedActions: this._getFootfallSuggestedActions(
          predictedDailyAverage,
          avgDailyPatients
        ),
      };
    } catch (error) {
      logger.error(`Footfall prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict Doctor Requirement
   * Uses: footfall patterns, consultation time, historical data
   */
  static async predictDoctorRequirement(healthCenterId, daysAhead = 30, department = null) {
    try {
      // Get predicted footfall
      const footfallPrediction = await this.predictPatientFootfall(
        healthCenterId,
        daysAhead,
        department
      );

      // Get attendance data to estimate patient-to-doctor ratio
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceData = await Attendance.find({
        healthCenter: healthCenterId,
        date: { $gte: thirtyDaysAgo },
      });

      // Count unique doctors from attendance records
      const uniqueDoctorIds = new Set();
      attendanceData.forEach((a) => uniqueDoctorIds.add(a.doctor ? a.doctor.toString() : null));
      uniqueDoctorIds.delete(null);
      
      // Calculate average consultation time (patients per doctor per shift)
      const avgPatientsPerDoctor = 15; // Average patients per doctor per day
      const predictedDailyAverage = footfallPrediction.predictedDailyAverage || 0;
      const requiredDoctors = Math.ceil(predictedDailyAverage / avgPatientsPerDoctor);
      const currentDoctorsCount = uniqueDoctorIds.size;

      return {
        healthCenterId: healthCenterId.toString(),
        department: department || 'All',
        predictedDailyFootfall: predictedDailyAverage,
        currentDoctors: currentDoctorsCount,
        requiredDoctors,
        shortage: Math.max(0, requiredDoctors - currentDoctorsCount),
        utilizationRate:
          currentDoctorsCount > 0
            ? Math.round(
                (predictedDailyAverage / (currentDoctorsCount * avgPatientsPerDoctor)) * 100
              )
            : 0,
        riskScore: requiredDoctors > currentDoctorsCount ? 70 : 30,
        confidence: footfallPrediction.confidence,
        suggestedActions: this._getDoctorSuggestedActions(
          requiredDoctors,
          currentDoctorsCount
        ),
      };
    } catch (error) {
      logger.error(`Doctor requirement prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict Bed Requirement
   * Uses: bed occupancy trends, average stay duration, admitted patients
   */
  static async predictBedRequirement(healthCenterId, daysAhead = 30) {
    try {
      // Get bed allocation history
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const bedAllocations = await BedAllocation.find({
        healthCenter: healthCenterId,
        allocatedAt: { $gte: thirtyDaysAgo },
      });

      // Calculate daily occupancy
      const dailyOccupancy = {};
      bedAllocations.forEach((bed) => {
        const date = bed.allocatedAt.toISOString().split('T')[0];
        dailyOccupancy[date] = (dailyOccupancy[date] || 0) + 1;
      });

      const occupancyValues = Object.values(dailyOccupancy);

      if (occupancyValues.length === 0) {
        return {
          healthCenterId: healthCenterId.toString(),
          currentAverageOccupancy: 0,
          predictedOccupancy: 0,
          averageLengthOfStay: 0,
          requiredBeds: 0,
          bufferBeds: 0,
          totalBedRequirement: 0,
          trend: 0,
          trendDirection: 'stable',
          confidence: 0,
          riskScore: 30,
          suggestedActions: ['Insufficient data for bed requirement prediction'],
        };
      }

      const avgBedOccupancy = this.calculateMovingAverage(occupancyValues);
      const trend = this.calculateTrend(occupancyValues);
      const confidence = this.calculateConfidence(occupancyValues);

      // Calculate average length of stay
      let totalStayDays = 0;
      let stayCount = 0;
      bedAllocations.forEach((bed) => {
        if (bed.releasedAt) {
          const stayDays = (bed.releasedAt - bed.allocatedAt) / (24 * 60 * 60 * 1000);
          totalStayDays += stayDays;
          stayCount += 1;
        }
      });

      const avgStayDays = stayCount > 0 ? totalStayDays / stayCount : 5;

      // Predict required beds
      const predictedOccupancy = avgBedOccupancy + trend;
      const requiredBeds = Math.ceil(predictedOccupancy);
      const bufferBeds = Math.ceil(requiredBeds * 0.2); // 20% buffer
      const totalBedRequirement = requiredBeds + bufferBeds;

      return {
        healthCenterId: healthCenterId.toString(),
        currentAverageOccupancy: Math.round(avgBedOccupancy),
        predictedOccupancy: Math.round(predictedOccupancy),
        averageLengthOfStay: Math.round(avgStayDays * 10) / 10,
        requiredBeds,
        bufferBeds,
        totalBedRequirement,
        trend: Math.round(trend * 100) / 100,
        trendDirection: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        riskScore: trend > avgBedOccupancy * 0.25 ? 70 : 40,
        confidence,
        suggestedActions: this._getBedSuggestedActions(
          totalBedRequirement,
          avgBedOccupancy,
          predictedOccupancy
        ),
      };
    } catch (error) {
      logger.error(`Bed requirement prediction error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get suggested actions for medicine prediction
   */
  static _getMedicineSuggestedActions(daysOfStock, currentStock, predictedDemand) {
    const actions = [];

    if (daysOfStock < 7) {
      actions.push('URGENT: Place emergency order immediately');
      actions.push('Prioritize high-priority medications');
    } else if (daysOfStock < 14) {
      actions.push('Place order within 48 hours');
      actions.push('Monitor stock closely');
    } else if (daysOfStock > 60) {
      actions.push('Current stock is adequate');
      actions.push('Schedule regular order review');
    }

    if (predictedDemand > 1000) {
      actions.push('Consider bulk ordering for cost savings');
    }

    return actions;
  }

  /**
   * Get suggested actions for footfall prediction
   */
  static _getFootfallSuggestedActions(predictedAverage, currentAverage) {
    const actions = [];

    if (predictedAverage > currentAverage * 1.2) {
      actions.push('Increase staffing levels');
      actions.push('Prepare additional resources');
      actions.push('Manage patient queue efficiently');
    } else if (predictedAverage < currentAverage * 0.8) {
      actions.push('Optimize resource allocation');
      actions.push('Schedule maintenance during low-traffic hours');
    }

    if (predictedAverage > 500) {
      actions.push('Consider extended working hours');
    }

    return actions;
  }

  /**
   * Get suggested actions for doctor requirement
   */
  static _getDoctorSuggestedActions(required, current) {
    const actions = [];

    if (required > current) {
      const shortage = required - current;
      actions.push(`Recruit or hire ${shortage} additional doctor(s)`);
      actions.push('Consider temporary staffing solutions');
      actions.push('Optimize doctor schedules');
    } else if (required < current * 0.7) {
      actions.push('Optimize doctor schedule and reduce overtime');
      actions.push('Cross-train staff for other departments');
    }

    if (required > 10) {
      actions.push('Implement shift-based scheduling');
    }

    return actions;
  }

  /**
   * Get suggested actions for bed requirement
   */
  static _getBedSuggestedActions(required, current, predicted) {
    const actions = [];

    if (required > current * 1.2) {
      actions.push(`Add ${Math.ceil(required - current)} beds`);
      actions.push('Consider temporary bed setup');
      actions.push('Plan bed expansion');
    } else if (required < current * 0.6) {
      actions.push('Optimize bed utilization');
      actions.push('Consider bed consolidation');
    }

    if (predicted > current * 1.1) {
      actions.push('Monitor bed occupancy closely');
      actions.push('Prepare for increased admissions');
    }

    return actions;
  }
}

module.exports = PredictionService;