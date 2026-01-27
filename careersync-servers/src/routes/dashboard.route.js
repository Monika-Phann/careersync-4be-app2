const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

// Dashboard summary endpoint
router.get('/summary/:mentorId', dashboardController.getDashboardSummary);

// Analytics trends endpoint (12 months) - supports both query param and path param
router.get('/trends/:mentorId', dashboardController.getRevenueBookingsTrend);
router.get('/trend', dashboardController.getRevenueBookingsTrend);
router.get('/weekly', dashboardController.getWeeklyPerformance);

module.exports = router;