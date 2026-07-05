const { determineAttendanceStatus, buildMonthlySummary } = require('../services/attendanceService');

describe('attendance service helpers', () => {
  it('marks early logins as present and late logins as late', () => {
    expect(determineAttendanceStatus(new Date('2026-07-05T08:30:00'))).toBe('present');
    expect(determineAttendanceStatus(new Date('2026-07-05T09:30:00'))).toBe('late');
  });

  it('builds monthly summary counts from attendance records', () => {
    const records = [
      { status: 'present' },
      { status: 'late' },
      { status: 'present' },
    ];

    const summary = buildMonthlySummary(records);

    expect(summary.presentDays).toBe(2);
    expect(summary.lateDays).toBe(1);
    expect(summary.absentDays).toBe(0);
    expect(summary.attendanceRate).toBe(100);
  });
});
