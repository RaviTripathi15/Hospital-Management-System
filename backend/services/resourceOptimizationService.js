'use strict';

const logger = require('../config/logger');
const HealthCenter = require('../models/HealthCenter');
const Inventory = require('../models/Inventory');
const Attendance = require('../models/Attendance');
const BedAllocation = require('../models/BedAllocation');
const Footfall = require('../models/Footfall');
const PredictionService = require('./predictionService');

class ResourceOptimizationService {
  /**
   * Get all resource optimization recommendations
   */
  async getOptimizationRecommendations(daysAhead = 30) {
    try {
      logger.info('Generating resource optimization recommendations', { daysAhead });

      // Get all health centers
      const healthCenters = await HealthCenter.find({ status: 'active' }).lean();
      if (healthCenters.length === 0) {
        return {
          recommendations: [],
          summary: { total: 0, medicine: 0, doctor: 0, bed: 0, staff: 0 },
        };
      }

      // Analyze each center's resources
      const centerAnalysis = await Promise.all(
        healthCenters.map(center => this.analyzeCenterResources(center, daysAhead))
      );

      // Filter centers with valid data
      const validCenters = centerAnalysis.filter(analysis => analysis !== null);

      // Generate recommendations for each resource type
      const [medicineRecs, doctorRecs, bedRecs, staffRecs] = await Promise.all([
        this.generateMedicineTransferRecommendations(validCenters),
        this.generateDoctorTransferRecommendations(validCenters),
        this.generateBedRedistributionRecommendations(validCenters),
        this.generateStaffReallocationRecommendations(validCenters),
      ]);

      // Combine all recommendations
      const allRecommendations = [
        ...medicineRecs,
        ...doctorRecs,
        ...bedRecs,
        ...staffRecs,
      ];

      // Sort by priority (impact score + urgency)
      allRecommendations.sort((a, b) => {
        const scoreA = a.priority.impactScore + (a.priority.urgency === 'critical' ? 50 : 0);
        const scoreB = b.priority.impactScore + (b.priority.urgency === 'critical' ? 50 : 0);
        return scoreB - scoreA;
      });

      const summary = {
        total: allRecommendations.length,
        medicine: medicineRecs.length,
        doctor: doctorRecs.length,
        bed: bedRecs.length,
        staff: staffRecs.length,
        generatedAt: new Date(),
      };

      logger.info('Resource optimization recommendations generated', summary);

      return {
        recommendations: allRecommendations,
        summary,
        centerAnalysis: validCenters,
      };
    } catch (error) {
      logger.error('Error generating optimization recommendations', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze resource availability in a single health center
   */
  async analyzeCenterResources(center, daysAhead) {
    try {
      // Get medicine inventory status
      const medicineStatus = await this.getMedicineInventoryStatus(center._id);

      // Get doctor availability and predicted need
      const doctorStatus = await this.getDoctorResourceStatus(center._id, daysAhead);

      // Get bed status
      const bedStatus = await this.getBedResourceStatus(center._id, daysAhead);

      // Get staff availability
      const staffStatus = await this.getStaffResourceStatus(center._id);

      // Calculate overall shortage/surplus
      const resourceScore = this.calculateResourceScore({
        medicineStatus,
        doctorStatus,
        bedStatus,
        staffStatus,
      });

      return {
        centerId: center._id,
        centerName: center.name,
        centerType: center.type,
        location: {
          district: center.district,
          block: center.block,
        },
        medicine: medicineStatus,
        doctors: doctorStatus,
        beds: bedStatus,
        staff: staffStatus,
        resourceScore,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Error analyzing resources for center ${center._id}`, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get medicine inventory status
   */
  async getMedicineInventoryStatus(centerId) {
    try {
      const inventory = await Inventory.aggregate([
        { $match: { healthCenterId: centerId } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lt: ['$quantity', { $multiply: ['$reorderLevel', 1.5] }] },
                  1,
                  0,
                ],
              },
            },
            criticalStockItems: {
              $sum: {
                $cond: [{ $lt: ['$quantity', '$reorderLevel'] }, 1, 0],
              },
            },
            totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
          },
        },
      ]);

      if (inventory.length === 0) {
        return {
          available: 0,
          excess: 0,
          shortage: 0,
          items: 0,
          lowStockItems: 0,
          criticalStockItems: 0,
          value: 0,
        };
      }

      const inv = inventory[0];
      return {
        available: inv.totalQuantity,
        excess: Math.max(0, inv.totalQuantity - inv.totalItems * 500),
        shortage: inv.criticalStockItems,
        items: inv.totalItems,
        lowStockItems: inv.lowStockItems,
        criticalStockItems: inv.criticalStockItems,
        value: inv.totalValue || 0,
      };
    } catch (error) {
      logger.error('Error getting medicine inventory status', { error: error.message });
      return null;
    }
  }

  /**
   * Get doctor resource status
   */
  async getDoctorResourceStatus(centerId, daysAhead) {
    try {
      // Get current doctors
      const attendance = await Attendance.aggregate([
        {
          $match: {
            healthCenterId: centerId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: '$userId',
            presentDays: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
            },
          },
        },
        { $count: 'totalDoctors' },
      ]);

      const currentDoctors = attendance.length > 0 ? attendance[0].totalDoctors : 0;

      // Get predicted need
      let predictedNeed = 0;
      try {
        const footfall = await Footfall.aggregate([
          { $match: { healthCenterId: centerId } },
          { $limit: 90 },
          { $group: { _id: null, avgDaily: { $avg: '$count' } } },
        ]);

        if (footfall.length > 0) {
          // 15 patients per doctor is standard
          predictedNeed = Math.ceil(footfall[0].avgDaily / 15);
        }
      } catch (err) {
        logger.debug('Could not calculate predicted doctor need', { error: err.message });
      }

      return {
        available: currentDoctors,
        predicted: predictedNeed,
        excess: Math.max(0, currentDoctors - predictedNeed),
        shortage: Math.max(0, predictedNeed - currentDoctors),
        utilizationRate: predictedNeed > 0 ? (currentDoctors / predictedNeed) * 100 : 100,
      };
    } catch (error) {
      logger.error('Error getting doctor resource status', { error: error.message });
      return null;
    }
  }

  /**
   * Get bed resource status
   */
  async getBedResourceStatus(centerId, daysAhead) {
    try {
      // Get current bed status
      const bedStatus = await BedAllocation.aggregate([
        {
          $match: {
            healthCenterId: centerId,
            status: { $in: ['active', 'occupied'] },
          },
        },
        {
          $group: {
            _id: null,
            totalBeds: { $sum: 1 },
            occupiedBeds: {
              $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] },
            },
          },
        },
      ]);

      let total = 0;
      let occupied = 0;

      if (bedStatus.length > 0) {
        total = bedStatus[0].totalBeds;
        occupied = bedStatus[0].occupiedBeds;
      }

      // Estimate predicted need (assume 20% increase as buffer)
      const available = total - occupied;
      const predictedNeed = Math.ceil(occupied * 1.2);
      const shortage = Math.max(0, predictedNeed - total);
      const excess = Math.max(0, available - shortage);

      return {
        total,
        available,
        occupied,
        predicted: predictedNeed,
        excess,
        shortage,
        occupancyRate: total > 0 ? (occupied / total) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error getting bed resource status', { error: error.message });
      return null;
    }
  }

  /**
   * Get staff resource status
   */
  async getStaffResourceStatus(centerId) {
    try {
      // Get total active staff
      const staffCount = await Attendance.distinct('userId', {
        healthCenterId: centerId,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      // Get recent attendance rate
      const attendance = await Attendance.aggregate([
        {
          $match: {
            healthCenterId: centerId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
            },
          },
        },
      ]);

      const attendanceRate =
        attendance.length > 0
          ? Math.round((attendance[0].present / attendance[0].total) * 100)
          : 0;

      return {
        total: staffCount.length,
        attendanceRate,
        available: Math.ceil((staffCount.length * attendanceRate) / 100),
      };
    } catch (error) {
      logger.error('Error getting staff resource status', { error: error.message });
      return null;
    }
  }

  /**
   * Calculate overall resource score for a center
   */
  calculateResourceScore(resourceStatus) {
    let score = 0;
    const weights = {
      medicine: 0.25,
      doctor: 0.3,
      bed: 0.25,
      staff: 0.2,
    };

    // Medicine score: 100 if balanced, lower if shortage/excess
    if (resourceStatus.medicineStatus) {
      const medicineScore =
        100 -
        Math.abs(resourceStatus.medicineStatus.shortage) * 5 -
        (resourceStatus.medicineStatus.criticalStockItems > 0 ? 20 : 0);
      score += medicineScore * weights.medicine;
    }

    // Doctor score: 100 if match, lower if shortage/excess
    if (resourceStatus.doctorStatus) {
      const doctorScore =
        100 -
        Math.abs(resourceStatus.doctorStatus.shortage - resourceStatus.doctorStatus.excess) * 10;
      score += doctorScore * weights.doctor;
    }

    // Bed score: 100 if balanced, lower if shortage
    if (resourceStatus.bedStatus) {
      const bedScore =
        100 -
        Math.max(
          resourceStatus.bedStatus.shortage * 5,
          Math.abs(resourceStatus.bedStatus.excess - resourceStatus.bedStatus.shortage) * 3
        );
      score += bedScore * weights.bed;
    }

    // Staff score: based on attendance rate
    if (resourceStatus.staffStatus) {
      score += Math.max(0, resourceStatus.staffStatus.attendanceRate * weights.staff);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate medicine transfer recommendations
   */
  async generateMedicineTransferRecommendations(centerAnalysis) {
    const recommendations = [];

    // Find centers with medicine excess
    const donorCenters = centerAnalysis.filter(c => c.medicine && c.medicine.excess > 0);
    // Find centers with medicine shortage
    const recipientCenters = centerAnalysis.filter(
      c => c.medicine && c.medicine.shortage > 0 && c.medicine.criticalStockItems > 0
    );

    for (const recipient of recipientCenters) {
      // Find closest donor with similar or higher level center
      const suitableDonors = donorCenters
        .filter(d => d.centerType === recipient.centerType)
        .sort(
          (a, b) =>
            Math.sqrt(
              Math.pow(a.location.district === recipient.location.district ? 0 : 50, 2)
            ) -
            Math.sqrt(
              Math.pow(b.location.district === recipient.location.district ? 0 : 50, 2)
            )
        );

      if (suitableDonors.length > 0) {
        const donor = suitableDonors[0];

        // Calculate transfer quantity (meet 50% of shortage)
        const transferQuantity = Math.ceil(recipient.medicine.shortage * 500 * 0.5);
        const availableToTransfer = Math.min(transferQuantity, donor.medicine.excess);

        if (availableToTransfer > 0) {
          const urgency =
            recipient.medicine.criticalStockItems > 3 ? 'critical' : 'high';

          recommendations.push({
            id: `MEDICINE-${donor.centerId}-${recipient.centerId}`,
            type: 'medicine_transfer',
            from: {
              centerId: donor.centerId,
              centerName: donor.centerName,
              available: availableToTransfer,
            },
            to: {
              centerId: recipient.centerId,
              centerName: recipient.centerName,
              needed: transferQuantity,
            },
            details: {
              transferQuantity: availableToTransfer,
              criticalItems: recipient.medicine.criticalStockItems,
              estimatedValue: availableToTransfer * 50, // Estimate
            },
            priority: {
              urgency,
              impactScore: Math.min(100, recipient.medicine.criticalStockItems * 15),
              rationale: `Transfer ${availableToTransfer} units to prevent stock-out of ${recipient.medicine.criticalStockItems} critical items`,
            },
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate doctor transfer recommendations
   */
  async generateDoctorTransferRecommendations(centerAnalysis) {
    const recommendations = [];

    // Find centers with doctor excess
    const donorCenters = centerAnalysis.filter(
      c => c.doctors && c.doctors.excess >= 2
    );
    // Find centers with doctor shortage
    const recipientCenters = centerAnalysis.filter(
      c => c.doctors && c.doctors.shortage > 0
    );

    for (const recipient of recipientCenters) {
      // Find closest donor
      const suitableDonors = donorCenters.sort((a, b) => {
        const distA =
          a.location.district === recipient.location.district ? 0 : 1;
        const distB =
          b.location.district === recipient.location.district ? 0 : 1;
        return distA - distB;
      });

      if (suitableDonors.length > 0) {
        const donor = suitableDonors[0];

        // Can transfer up to shortage or donor's excess
        const transferCount = Math.min(
          recipient.doctors.shortage,
          donor.doctors.excess
        );

        if (transferCount > 0) {
          const urgency =
            recipient.doctors.shortage > 5 ? 'critical' : 'high';

          recommendations.push({
            id: `DOCTOR-${donor.centerId}-${recipient.centerId}`,
            type: 'doctor_transfer',
            from: {
              centerId: donor.centerId,
              centerName: donor.centerName,
              available: donor.doctors.excess,
            },
            to: {
              centerId: recipient.centerId,
              centerName: recipient.centerName,
              needed: recipient.doctors.shortage,
            },
            details: {
              transferCount,
              utilizationGap: (recipient.doctors.predicted - recipient.doctors.available)
                .toFixed(1),
            },
            priority: {
              urgency,
              impactScore: transferCount * 25,
              rationale: `Transfer ${transferCount} doctor(s) to meet forecasted need of ${recipient.doctors.predicted} patients per doctor`,
            },
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate bed redistribution recommendations
   */
  async generateBedRedistributionRecommendations(centerAnalysis) {
    const recommendations = [];

    // Find centers with bed excess
    const donorCenters = centerAnalysis.filter(
      c => c.beds && c.beds.excess >= 5
    );
    // Find centers with bed shortage
    const recipientCenters = centerAnalysis.filter(
      c => c.beds && c.beds.shortage > 0
    );

    for (const recipient of recipientCenters) {
      const suitableDonors = donorCenters.sort((a, b) => {
        const distA =
          a.location.district === recipient.location.district ? 0 : 1;
        const distB =
          b.location.district === recipient.location.district ? 0 : 1;
        return distA - distB;
      });

      if (suitableDonors.length > 0) {
        const donor = suitableDonors[0];

        // Transfer beds (up to shortage or donor's excess)
        const transferCount = Math.min(
          recipient.beds.shortage,
          donor.beds.excess
        );

        if (transferCount >= 3) {
          const urgency =
            recipient.beds.occupancyRate > 80 ? 'critical' : 'high';

          recommendations.push({
            id: `BED-${donor.centerId}-${recipient.centerId}`,
            type: 'bed_redistribution',
            from: {
              centerId: donor.centerId,
              centerName: donor.centerName,
              available: donor.beds.excess,
              occupancyRate: donor.beds.occupancyRate,
            },
            to: {
              centerId: recipient.centerId,
              centerName: recipient.centerName,
              needed: recipient.beds.shortage,
              occupancyRate: recipient.beds.occupancyRate,
            },
            details: {
              transferCount,
              recipientOccupancyAfter: Math.round(
                ((recipient.beds.occupied + transferCount) / (recipient.beds.total + transferCount)) *
                100
              ),
            },
            priority: {
              urgency,
              impactScore: transferCount * 15,
              rationale: `Redistribute ${transferCount} bed(s) to reduce occupancy from ${recipient.beds.occupancyRate.toFixed(1)}% to optimal levels`,
            },
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate staff reallocation recommendations
   */
  async generateStaffReallocationRecommendations(centerAnalysis) {
    const recommendations = [];

    // Find centers with high attendance rates (excess capacity)
    const donorCenters = centerAnalysis.filter(
      c => c.staff && c.staff.attendanceRate > 90 && c.staff.total > 5
    );
    // Find centers with low attendance rates (shortage)
    const recipientCenters = centerAnalysis.filter(
      c => c.staff && c.staff.attendanceRate < 75
    );

    for (const recipient of recipientCenters) {
      const suitableDonors = donorCenters.sort((a, b) => {
        const distA =
          a.location.district === recipient.location.district ? 0 : 1;
        const distB =
          b.location.district === recipient.location.district ? 0 : 1;
        return distA - distB;
      });

      if (suitableDonors.length > 0) {
        const donor = suitableDonors[0];

        // Suggest reallocation of 1-2 staff members
        const transferCount = Math.min(
          2,
          Math.ceil(donor.staff.total * 0.2)
        );

        if (transferCount > 0) {
          const attendanceGap = 90 - recipient.staff.attendanceRate;

          recommendations.push({
            id: `STAFF-${donor.centerId}-${recipient.centerId}`,
            type: 'staff_reallocation',
            from: {
              centerId: donor.centerId,
              centerName: donor.centerName,
              available: donor.staff.total,
              attendanceRate: donor.staff.attendanceRate,
            },
            to: {
              centerId: recipient.centerId,
              centerName: recipient.centerName,
              total: recipient.staff.total,
              attendanceRate: recipient.staff.attendanceRate,
            },
            details: {
              transferCount,
              projectedAttendanceImprovement: Math.min(
                100,
                recipient.staff.attendanceRate + attendanceGap * 0.3
              ),
            },
            priority: {
              urgency: attendanceGap > 20 ? 'high' : 'medium',
              impactScore: attendanceGap * 1.5,
              rationale: `Reallocate ${transferCount} staff member(s) to improve attendance from ${recipient.staff.attendanceRate}% to ${Math.min(90, recipient.staff.attendanceRate + 15)}%`,
            },
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Get recommendations by type
   */
  async getRecommendationsByType(type, limit = 10) {
    try {
      const allRecs = await this.getOptimizationRecommendations();
      const filtered = allRecs.recommendations.filter(r => r.type === type);

      return {
        type,
        count: filtered.length,
        recommendations: filtered.slice(0, limit),
      };
    } catch (error) {
      logger.error('Error getting recommendations by type', { error: error.message, type });
      throw error;
    }
  }

  /**
   * Get high-priority recommendations only
   */
  async getHighPriorityRecommendations() {
    try {
      const allRecs = await this.getOptimizationRecommendations();
      const highPriority = allRecs.recommendations.filter(
        r =>
          r.priority.urgency === 'critical' ||
          r.priority.impactScore >= 70
      );

      return {
        count: highPriority.length,
        recommendations: highPriority,
      };
    } catch (error) {
      logger.error('Error getting high priority recommendations', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recommendations for specific center
   */
  async getRecommendationsForCenter(centerId) {
    try {
      const allRecs = await this.getOptimizationRecommendations();
      const forCenter = allRecs.recommendations.filter(
        r => r.from.centerId.toString() === centerId || r.to.centerId.toString() === centerId
      );

      // Separate incoming and outgoing
      const outgoing = forCenter.filter(r => r.from.centerId.toString() === centerId);
      const incoming = forCenter.filter(r => r.to.centerId.toString() === centerId);

      return {
        centerId,
        outgoing: {
          count: outgoing.length,
          recommendations: outgoing,
        },
        incoming: {
          count: incoming.length,
          recommendations: incoming,
        },
        total: forCenter.length,
      };
    } catch (error) {
      logger.error('Error getting recommendations for center', { error: error.message, centerId });
      throw error;
    }
  }
}

module.exports = new ResourceOptimizationService();
