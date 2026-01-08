const { Booking, Mentor, Certificate, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get dashboard summary (total bookings, revenue, certifications with growth %)
 * GET /api/dashboard/summary/:mentorId
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get current month data
    const currentMonthBookings = await Booking.count({
      where: {
        mentor_id: mentorId,
        created_at: { [Op.gte]: currentMonthStart }
      }
    });

    const currentMonthRevenue = await Booking.sum('total_amount', {
      where: {
        mentor_id: mentorId,
        created_at: { [Op.gte]: currentMonthStart }
      }
    }) || 0;

    const currentMonthCertifications = await Certificate.count({
      where: {
        mentor_id: mentorId,
        created_at: { [Op.gte]: currentMonthStart }
      }
    });

    // Get previous month data
    const previousMonthBookings = await Booking.count({
      where: {
        mentor_id: mentorId,
        created_at: { 
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd
        }
      }
    });

    const previousMonthRevenue = await Booking.sum('total_amount', {
      where: {
        mentor_id: mentorId,
        created_at: { 
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd
        }
      }
    }) || 0;

    const previousMonthCertifications = await Certificate.count({
      where: {
        mentor_id: mentorId,
        created_at: { 
          [Op.gte]: previousMonthStart,
          [Op.lte]: previousMonthEnd
        }
      }
    });

    // Get total bookings (all time)
    const totalBookings = await Booking.count({
      where: {
        mentor_id: mentorId
      }
    });

    // Get total revenue (all time) - only from completed bookings (matches earnings calculation)
    const totalRevenue = await Booking.sum('total_amount', {
      where: {
        mentor_id: mentorId,
        status: 'completed'
      }
    }) || 0;

    // Get total certifications (all time)
    const totalCertifications = await Certificate.count({
      where: {
        mentor_id: mentorId
      }
    });

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const bookingsGrowth = calculateGrowth(currentMonthBookings, previousMonthBookings);
    const revenueGrowth = calculateGrowth(currentMonthRevenue, previousMonthRevenue);
    const certificationsGrowth = calculateGrowth(currentMonthCertifications, previousMonthCertifications);

    res.json({
      bookings: {
        total: totalBookings,
        growth: parseFloat(bookingsGrowth.toFixed(1))
      },
      revenue: {
        total: parseFloat(totalRevenue.toFixed(2)),
        growth: parseFloat(revenueGrowth.toFixed(1))
      },
      certifications: {
        total: totalCertifications,
        growth: parseFloat(certificationsGrowth.toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

/**
 * Get revenue and bookings trend (last 12 months - entire current year)
 * Supports both query param (?mentorId=xxx) and path param (/trends/:mentorId)
 */
exports.getRevenueBookingsTrend = async (req, res) => {
  try {
    const mentorId = req.params.mentorId || req.query.mentorId;
    
    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    // Get bookings from current year (last 12 months)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const bookings = await Booking.findAll({
      where: {
        mentor_id: mentorId,
        created_at: { [Op.gte]: yearStart }
      },
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'Mon'), 'month'],
        [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM'), 'yearMonth'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
      ],
      group: [
        sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'Mon'),
        sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM')
      ],
      order: [[sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'YYYY-MM'), 'ASC']],
      raw: true
    });

    // Generate all 12 months of the year
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentYear, i, 1);
      months.push(d.toLocaleString('en-US', { month: 'short' }));
    }

    // Map data to months
    const trendData = months.map(month => {
      const foundData = bookings.find(b => b.month === month);
      return {
        month,
        bookings: foundData ? parseInt(foundData.bookings) : 0,
        revenue: foundData ? Math.round(parseFloat(foundData.revenue || 0)) : 0
      };
    });

    res.json(trendData);
  } catch (error) {
    console.error('Error fetching revenue/bookings trend:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
};

/**
 * Get weekly performance (last 7 days)
 */
exports.getWeeklyPerformance = async (req, res) => {
  try {
    const { mentorId } = req.query;
    
    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }

    // Get bookings from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const bookings = await Booking.findAll({
      where: {
        mentor_id: mentorId,
        created_at: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [sequelize.fn('TO_CHAR', sequelize.col('created_at'), 'Dy'), 'dayName'],
        'status'
      ],
      raw: true
    });

    // Aggregate by day and status
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = {
      'Mon': 'Mon',
      'Tue': 'Tue',
      'Wed': 'Wed',
      'Thu': 'Thu',
      'Fri': 'Fri',
      'Sat': 'Sat',
      'Sun': 'Sun'
    };

    const weeklyData = days.map(day => {
      const completed = bookings.filter(b => 
        dayMap[b.dayName] === day && b.status === 'completed'
      ).length;
      
      const cancelled = bookings.filter(b => 
        dayMap[b.dayName] === day && b.status === 'cancelled'
      ).length;

      return { day, completed, cancelled };
    });

    res.json({ weekly: weeklyData });
  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    res.status(500).json({ error: 'Failed to fetch weekly data' });
  }
};