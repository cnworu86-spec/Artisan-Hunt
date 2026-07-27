const Report = require('../models/Report');

// @desc    Create new report
// @route   POST /api/reports
// @access  Public
const createReport = async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason, bookingId } = req.body;

    if (!reporterId || !reportedUserId || !reason) {
      return res.status(400).json({ message: 'reporterId, reportedUserId and reason are required' });
    }

    const reportCount = await Report.countDocuments();
    const generatedReportId = `REP-${String(reportCount + 1).padStart(4, '0')}`;

    const report = await Report.create({
      reportId: generatedReportId,
      reporterId,
      reportedUserId,
      bookingId,
      reason
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReport
};
