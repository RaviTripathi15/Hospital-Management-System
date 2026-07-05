# AI-Powered Prediction & Forecasting API

## Overview

The Prediction API provides AI-powered forecasting and early warning systems for health center management. It uses historical data, trends analysis, and statistical models to predict demand and requirements.

---

## Features

1. **Medicine Demand Prediction** - Forecast future medicine consumption based on historical trends
2. **Early Stock-out Warning** - Get alerts before inventory runs out
3. **Patient Footfall Prediction** - Predict daily patient volume
4. **Doctor Requirement Prediction** - Forecast staffing needs
5. **Bed Requirement Prediction** - Predict bed occupancy and capacity needs
6. **Risk Assessment** - Comprehensive risk scoring across all metrics

---

## Authentication

All endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### 1. Dashboard Predictions
Get all predictions for dashboard at a glance.

**Endpoint:**
```
GET /api/v1/predictions/dashboard?daysAhead=30
```

**Query Parameters:**
- `daysAhead` (optional, default: 30) - Number of days to predict ahead (1-365)

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-07-05T19:50:00Z",
    "predictions": {
      "footfall": {
        "currentAverageDailyFootfall": 450,
        "predictedDailyAverage": 480,
        "predictedTotalFootfall": 14400,
        "trend": 1.5,
        "trendDirection": "increasing",
        "riskScore": 40,
        "confidence": 85,
        "suggestedActions": [...]
      },
      "doctorRequirement": {
        "requiredDoctors": 32,
        "currentDoctors": 28,
        "shortage": 4,
        "utilizationRate": 85,
        "riskScore": 70,
        "confidence": 80,
        "suggestedActions": [...]
      },
      "bedRequirement": {
        "predictedOccupancy": 145,
        "requiredBeds": 150,
        "totalBedRequirement": 180,
        "averageLengthOfStay": 4.2,
        "riskScore": 50,
        "confidence": 75,
        "suggestedActions": [...]
      },
      "stockOutWarnings": {
        "count": 3,
        "items": [...]
      }
    }
  }
}
```

---

### 2. Medicine Demand Prediction
Predict demand for a specific medicine.

**Endpoint:**
```
GET /api/v1/predictions/medicine-demand/:itemId?daysAhead=30
```

**Parameters:**
- `itemId` (required, path) - MongoDB ID of inventory item
- `daysAhead` (optional, query, default: 30) - Days to predict (1-365)

**Response:**
```json
{
  "success": true,
  "data": {
    "itemId": "507f1f77bcf86cd799439011",
    "itemName": "Paracetamol 500mg",
    "currentStock": 2500,
    "predictedDemand": 1850,
    "averageDailyUsage": 62,
    "trend": -2.5,
    "daysOfStock": 40.3,
    "riskScore": 20,
    "confidence": 88,
    "suggestedActions": [
      "Current stock is adequate",
      "Schedule regular order review"
    ]
  }
}
```

---

### 3. Stock-out Warning
Get early alerts for items that may run out of stock.

**Endpoint:**
```
GET /api/v1/predictions/stock-out-warning?thresholdDays=7
```

**Query Parameters:**
- `thresholdDays` (optional, default: 7) - Alert if stock will end in this many days (1-90)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWarnings": 2,
    "warnings": [
      {
        "itemId": "507f1f77bcf86cd799439012",
        "itemName": "Insulin Vial",
        "currentStock": 150,
        "avgDailyUsage": 45,
        "daysUntilStockOut": 3.3,
        "riskScore": 95,
        "suggestedAction": "Reorder 630 units immediately"
      },
      {
        "itemId": "507f1f77bcf86cd799439013",
        "itemName": "Antibiotics",
        "currentStock": 500,
        "avgDailyUsage": 80,
        "daysUntilStockOut": 6.25,
        "riskScore": 85,
        "suggestedAction": "Reorder 1120 units immediately"
      }
    ],
    "generatedAt": "2026-07-05T19:50:00Z"
  }
}
```

---

### 4. Patient Footfall Prediction
Forecast patient volume and trends.

**Endpoint:**
```
GET /api/v1/predictions/patient-footfall?daysAhead=30&department=General
```

**Query Parameters:**
- `daysAhead` (optional, default: 30) - Days to predict (1-365)
- `department` (optional) - Filter by department name

**Response:**
```json
{
  "success": true,
  "data": {
    "healthCenterId": "507f1f77bcf86cd799439014",
    "department": "General",
    "currentAverageDailyFootfall": 450,
    "predictedDailyAverage": 480,
    "predictedTotalFootfall": 14400,
    "trend": 1.5,
    "trendDirection": "increasing",
    "riskScore": 40,
    "confidence": 85,
    "suggestedActions": [
      "Increase staffing levels",
      "Prepare additional resources",
      "Manage patient queue efficiently"
    ]
  }
}
```

---

### 5. Doctor Requirement Prediction
Forecast required number of doctors.

**Endpoint:**
```
GET /api/v1/predictions/doctor-requirement?daysAhead=30&department=General
```

**Query Parameters:**
- `daysAhead` (optional, default: 30) - Days to predict (1-365)
- `department` (optional) - Filter by department

**Response:**
```json
{
  "success": true,
  "data": {
    "healthCenterId": "507f1f77bcf86cd799439014",
    "department": "General",
    "predictedDailyFootfall": 480,
    "currentDoctors": 28,
    "requiredDoctors": 32,
    "shortage": 4,
    "utilizationRate": 85,
    "riskScore": 70,
    "confidence": 80,
    "suggestedActions": [
      "Recruit or hire 4 additional doctor(s)",
      "Consider temporary staffing solutions",
      "Optimize doctor schedules"
    ]
  }
}
```

---

### 6. Bed Requirement Prediction
Forecast bed occupancy and capacity needs.

**Endpoint:**
```
GET /api/v1/predictions/bed-requirement?daysAhead=30
```

**Query Parameters:**
- `daysAhead` (optional, default: 30) - Days to predict (1-365)

**Response:**
```json
{
  "success": true,
  "data": {
    "healthCenterId": "507f1f77bcf86cd799439014",
    "currentAverageOccupancy": 135,
    "predictedOccupancy": 145,
    "averageLengthOfStay": 4.2,
    "requiredBeds": 150,
    "bufferBeds": 30,
    "totalBedRequirement": 180,
    "trend": 2.1,
    "trendDirection": "increasing",
    "riskScore": 50,
    "confidence": 75,
    "suggestedActions": [
      "Monitor bed occupancy closely",
      "Prepare for increased admissions"
    ]
  }
}
```

---

### 7. Batch Medicine Predictions
Get predictions for multiple medicines at once.

**Endpoint:**
```
POST /api/v1/predictions/batch-medicine
```

**Request Body:**
```json
{
  "itemIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "daysAhead": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 3,
    "predictions": [
      { /* medicine 1 prediction */ },
      { /* medicine 2 prediction */ },
      { /* medicine 3 prediction */ }
    ],
    "generatedAt": "2026-07-05T19:50:00Z"
  }
}
```

---

### 8. Risk Assessment
Get overall risk assessment across all metrics.

**Endpoint:**
```
GET /api/v1/predictions/risk-assessment
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallRiskScore": 62,
    "riskLevel": "High",
    "criticalIssues": [
      {
        "type": "stock_out",
        "count": 2,
        "severity": "critical",
        "action": "Review and reorder critical items"
      },
      {
        "type": "doctor_shortage",
        "count": 4,
        "severity": "high",
        "action": "Arrange for additional staff"
      }
    ],
    "lastAssessment": "2026-07-05T19:50:00Z"
  }
}
```

---

## Response Structure

All responses follow this structure:

```json
{
  "success": true/false,
  "data": { /* endpoint-specific data */ },
  "message": "Success or error message"
}
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Validation failed | Check query parameters and body format |
| 401 | Unauthorized | Include valid JWT token |
| 404 | Item not found | Verify itemId exists |
| 500 | Server error | Retry request or contact support |

---

## Key Metrics Explained

### Risk Score
- **0-30**: Low risk - adequate resources
- **30-60**: Moderate risk - monitor closely
- **60-80**: High risk - take preventive action
- **80-100**: Critical - immediate action required

### Confidence
Percentage score indicating prediction accuracy based on:
- Amount of historical data
- Data consistency
- Trend stability
- Higher = more reliable prediction

### Suggested Actions
AI-generated recommendations based on:
- Current vs predicted values
- Trend direction
- Resource constraints
- Industry best practices

---

## Example Use Cases

### 1. Daily Operations Dashboard
```bash
GET /api/v1/predictions/dashboard
```
Shows all key metrics for the day

### 2. Inventory Manager Alert
```bash
GET /api/v1/predictions/stock-out-warning?thresholdDays=7
```
Check daily for items running low

### 3. HR Planning
```bash
GET /api/v1/predictions/doctor-requirement?daysAhead=90
```
Plan recruitment 3 months in advance

### 4. Capacity Planning
```bash
GET /api/v1/predictions/bed-requirement?daysAhead=60
```
Forecast expansion needs 2 months ahead

### 5. Batch Order Management
```bash
POST /api/v1/predictions/batch-medicine
```
Order supplies for all medicines based on predictions

---

## Data Requirements

For accurate predictions, the system needs:

1. **Medicine Demand**: At least 30 days of consumption history
2. **Footfall**: At least 30 days of patient volume data
3. **Doctor Requirement**: Attendance and footfall data for correlation
4. **Bed Requirement**: At least 30 days of bed allocation history

---

## Refresh Recommendations

- **Dashboard**: Refresh daily or as needed
- **Stock Warnings**: Check daily or when placing orders
- **Footfall/Doctor**: Refresh weekly for planning
- **Bed Requirement**: Refresh monthly for capacity planning
- **Risk Assessment**: Review weekly

---

## Integration Examples

### React Component
```javascript
const [predictions, setPredictions] = useState(null);

useEffect(() => {
  fetch('/api/v1/predictions/dashboard?daysAhead=30', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => setPredictions(data.data))
  .catch(err => console.error(err));
}, []);
```

### Scheduling Alerts
```javascript
// Check for critical issues daily
setInterval(() => {
  fetch('/api/v1/predictions/risk-assessment', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    if (data.data.overallRiskScore > 70) {
      sendAlert('Critical issues detected');
    }
  });
}, 24 * 60 * 60 * 1000);
```

---

## Performance Notes

- Dashboard predictions: ~1-2 seconds (aggregates multiple predictions)
- Single predictions: ~500-800ms (depends on data volume)
- Batch predictions: ~100ms per item
- Use dashboard for quick overview, specific endpoints for detailed analysis

---

## Support

For issues or feature requests, contact the development team with:
- Endpoint used
- Query parameters
- Expected vs actual response
- Health center ID
