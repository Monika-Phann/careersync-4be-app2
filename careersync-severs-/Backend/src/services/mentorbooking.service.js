// Backend/src/services/mentorbooking.service.js
const { Booking, User, ScheduleTimeslot, Mentor, Invoice, Certificate, Payment, AccUser, Position, sequelize } = require("../models");
const sendEmail = require("../utils/sendEmail");

const COMMISSION_RATE = 0.20; // 20% platform commission

const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CERT-${year}-${random}`;
};

exports.getMyBookings = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view bookings");

  const bookings = await Booking.findAll({
    where: { mentor_id: mentor.id },
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name", "phone", "profile_image", "gender", "dob", "institution_name", "types_user"],
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      },
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslot",
        attributes: ["id", "start_time", "end_time", "is_booked"]
      }
    ],
    order: [["created_at", "DESC"]]
  });

 return bookings;
};

exports.getBookingById = async (bookingId, mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view bookings");

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name", "phone", "profile_image", "gender", "dob", "institution_name", "types_user"],
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      },
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslot",
        attributes: ["id", "start_time", "end_time", "is_booked"]
      }
    ]
  });

  if (!booking || booking.mentor_id !== mentor.id) {
    throw new Error("Booking not found or not authorized");
  }

  return booking;
};

exports.acceptBooking = async (bookingId, mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can accept bookings");

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name"],
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      }
    ]
  });

  if (!booking || booking.mentor_id !== mentor.id) {
    throw new Error("Booking not found or not yours");
  }

  if (booking.status !== "pending") {
    throw new Error("Booking not pending");
  }

  await booking.update({ status: "confirmed" });

  const timeslot = await ScheduleTimeslot.findByPk(booking.schedule_timeslot_id);

  if (timeslot) {
    await timeslot.update({
      is_booked: true,  // ✅ Fixed: Use correct field name (not is_available)
      booking_id: booking.id
    });
  }

  const totalAmount = parseFloat(booking.total_amount);
  const commission = totalAmount * COMMISSION_RATE;
  const mentorEarnings = totalAmount - commission;

  // Check if payment and invoice already exist (created during booking)
  let payment = await Payment.findOne({
    where: { booking_id: booking.id }
  });

  if (!payment) {
    // Create payment if it doesn't exist
    payment = await Payment.create({
      booking_id: booking.id,
      amount: totalAmount,
      status: "pending",
      commission: commission,
      transaction_id: null,
      pay_date: null
    });
  } else {
    // Update existing payment with correct amounts
    await payment.update({
      amount: totalAmount,
      commission: commission
    });
  }

  // Check if invoice already exists
  let invoice = await Invoice.findOne({
    where: { payment_id: payment.id }
  });

  if (invoice) {
    // Update existing invoice with latest booking details
    await invoice.update({
      mentor_id: mentor.id,
      acc_user_id: booking.acc_user_id,
      position_id: booking.position_id,
      total_amount: totalAmount,
      mentor_name_snapshot: booking.mentor_name_snapshot,
      mentor_position_snapshot: booking.position_name_snapshot,
      acc_user_name_snapshot: booking.acc_user_name_snapshot,
      start_date_snapshot: booking.start_date_snapshot,
      end_date_snapshot: booking.end_date_snapshot,
      session_price_snapshot: booking.session_price_snapshot,
      status: "pending"
    });
    console.log('✅ Invoice updated when mentor accepted booking:', invoice.id);
  } else {
    // Create invoice if it doesn't exist
    invoice = await Invoice.create({
      payment_id: payment.id,
      mentor_id: mentor.id,
      acc_user_id: booking.acc_user_id,
      position_id: booking.position_id,
      total_amount: totalAmount,
      mentor_name_snapshot: booking.mentor_name_snapshot,
      mentor_position_snapshot: booking.position_name_snapshot,
      acc_user_name_snapshot: booking.acc_user_name_snapshot,
      start_date_snapshot: booking.start_date_snapshot,
      end_date_snapshot: booking.end_date_snapshot,
      session_price_snapshot: booking.session_price_snapshot,
      payment_method_snapshot: "cash",
      status: "pending"
    });
    console.log('✅ Invoice created when mentor accepted booking:', invoice.id);
  }

  const sessionDate = new Date(booking.start_date_snapshot);
  const menteeEmail = booking.menteeUser.User.email;
  
  // Get student's name (use first name and last name from AccUser if available, otherwise parse from snapshot)
  const studentFirstName = booking.menteeUser?.first_name || 
    (booking.acc_user_name_snapshot ? booking.acc_user_name_snapshot.split(' ')[0] : 'Student');
  const studentLastName = booking.menteeUser?.last_name || 
    (booking.acc_user_name_snapshot ? booking.acc_user_name_snapshot.split(' ').slice(1).join(' ') : '');
  const studentName = studentLastName ? `${studentFirstName} ${studentLastName}` : studentFirstName;
  
  // Format date as DD/MM/YYYY, HH:MM AM/PM
  const formatDate = (date) => {
    if (!date || isNaN(date.getTime())) return 'TBD';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${displayHours}:${minutes} ${ampm}`;
  };
  
  const formattedDate = formatDate(sessionDate);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      <p style="font-size: 16px;">Dear ${studentName},</p>
      
      <p style="font-size: 16px;">
        Thank you for booking a session with CareerSync. Your booking has been successfully confirmed. Please find the details of your invoice below:
      </p>
      
      <div style="margin: 30px 0;">
        <h2 style="color: #4F46E5; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
          Invoice Summary
        </h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>Session Date & Time:</strong> ${formattedDate}
          </p>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>Total Amount Due:</strong> $${totalAmount.toFixed(2)}
          </p>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong>Payment Method:</strong> Cash (to be paid at the session)
          </p>
        </div>
      </div>
      
      <p style="font-size: 16px;">
        Please ensure you bring the exact amount to the session. If you have any questions or need to make changes to your booking, feel free to contact us.
      </p>
      
      <p style="font-size: 16px; margin-top: 30px;">
        Thank you for choosing CareerSync. We look forward to supporting your career journey.
      </p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 16px; margin: 5px 0;"><strong>Best regards,</strong></p>
        <p style="font-size: 16px; margin: 5px 0;"><strong>CareerSync Team</strong></p>
        <p style="font-size: 14px; color: #666; margin: 5px 0;">CareerSync Platform</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: menteeEmail,
    subject: "Your Booking Accepted - CareerSync",
    html
  });

  return { commission, mentorEarnings };
};

exports.rejectBooking = async (bookingId, mentorId, rejection_reason) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can reject bookings");

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id"],
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      },
      { model: ScheduleTimeslot, as: "ScheduleTimeslot" }
    ]
  });

  if (!booking || booking.mentor_id !== mentor.id) {
    throw new Error("Booking not found or not yours");
  }

  if (booking.status === "cancelled" || booking.status === "completed") {
    throw new Error("Cannot reject this booking");
  }

  // ✅ Update booking status to cancelled
  await booking.update({
    status: "cancelled",
    cancelled_by: mentor.id
  });

  // ✅ CRITICAL: Free up the timeslot so other students can book it
  if (booking.ScheduleTimeslot) {
    await booking.ScheduleTimeslot.update({
      is_booked: false,  // ✅ Fixed: Use correct field name (not is_available)
      booking_id: null   // Clear the booking reference
    });
    console.log(`✅ Timeslot ${booking.ScheduleTimeslot.id} freed up after booking rejection`);
  } else {
    console.warn(`⚠️ No ScheduleTimeslot found for booking ${bookingId} - cannot free timeslot`);
  }

  // ✅ Send rejection email to student
  const menteeEmail = booking.menteeUser?.User?.email;
  if (menteeEmail) {
    await sendEmail({
      to: menteeEmail,
      subject: "Booking Rejected",
      html: `<p>Unfortunately, your mentor has rejected the booking.</p>
             ${rejection_reason ? `<p>Reason: ${rejection_reason}</p>` : ''}
             <p>The session time slot is now available for other students to book.</p>`
    });
  }

  return { rejection_reason };
};

exports.completeBooking = async (bookingId, mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can complete bookings");

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      }
    ]
  });
  
  if (!booking || booking.mentor_id !== mentor.id) {
    throw new Error("Booking not found or not yours");
  }

  if (booking.status !== "confirmed") {
    throw new Error("Only confirmed bookings can be completed");
  }

  // Update booking status
  await booking.update({ status: "completed" });

  // Create certificate
  const certificateNumber = generateCertificateNumber();
  await Certificate.create({
    booking_id: booking.id,
    position_id: booking.position_id,
    acc_user_id: booking.acc_user_id,
    mentor_id: booking.mentor_id,
    issue_date: new Date(),
    certificate_number: certificateNumber,
    issued_by: mentor.id
  });

  const issueDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  const menteeEmail = booking.menteeUser.User.email;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f9; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 40px; text-align: center; }
        .content { padding: 40px; text-align: center; color: #333; }
        .certificate { background: #eef2ff; padding: 30px; border-radius: 12px; margin: 30px 0; }
        .button { display: inline-block; padding: 16px 32px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CAREERSYNC</h1>
          <h2>Certificate of Completion</h2>
        </div>
        <div class="content">
          <h2>Congratulations, ${booking.acc_user_name_snapshot}! 🎉</h2>
          <p>You have successfully completed your mentoring session:</p>
          
          <div class="certificate">
            <h3>${booking.position_name_snapshot}</h3>
            <p>with Mentor <strong>${mentor.first_name} ${mentor.last_name}</strong></p>
            <p>Completed on: <strong>${issueDate}</strong></p>
            <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
          </div>

          <p>This certificate recognizes your dedication to professional growth.</p>
          <p>You can share this achievement on LinkedIn or your resume!</p>
          
          <a href="${process.env.APP_URL}/my-certificates" class="button">View All My Certificates</a>
        </div>
        <div style="background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 14px;">
          <p>&copy; 2025 CareerSync — Connecting students with career mentors</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: menteeEmail,
    subject: `🎉 Your CareerSync Certificate - ${booking.position_name_snapshot}`,
    html
  });

  return { certificateNumber };
};

exports.getPendingBookings = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view pending bookings");

  const bookings = await Booking.findAll({
    where: { mentor_id: mentor.id, status: "pending" },
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name", "phone", "profile_image", "gender", "dob", "institution_name", "types_user"],
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      },
      {
        model: ScheduleTimeslot,
        as: "ScheduleTimeslot",
        attributes: ["id", "start_time", "end_time", "is_booked"]
      }
    ],
    order: [["created_at", "ASC"]]
  });

  return bookings;
};

exports.getMyEarnings = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view earnings");

  // Get all bookings with payments, certificates, and student info for recent payments
  const bookings = await Booking.findAll({
    where: { mentor_id: mentor.id },
    include: [
      {
        model: Payment,
        attributes: ["id", "amount", "commission", "status", "pay_date", "created_at"],
        required: false
      },
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name", "profile_image"],
        required: false
      },
      {
        model: Certificate,
        attributes: ["id", "issue_date"],
        required: false
      }
    ],
    order: [["created_at", "DESC"]]
  });

  // Calculate earnings from completed bookings - return full earnings without commission
  // Total earning: fetch from dashboard total revenue (sum of all completed bookings)
  const completedBookings = bookings.filter(b => b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const platformCommission = totalRevenue * COMMISSION_RATE;
  // Return full earnings (totalRevenue) - this matches dashboard total revenue for completed bookings
  const mentorEarnings = totalRevenue;

  // Get last month's earnings - return full earnings without commission
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthBookings = completedBookings.filter(b => {
    const bookingDate = new Date(b.created_at);
    return bookingDate >= lastMonth;
  });
  const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const lastMonthCommission = lastMonthRevenue * COMMISSION_RATE;
  // Return full earnings (lastMonthRevenue) instead of after commission
  const lastMonthEarnings = lastMonthRevenue;

  // Get today's earnings - only count bookings that:
  // 1. Were completed today (based on certificate issue_date)
  // 2. AND have a certificate (meaning student received a certificate)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayBookings = completedBookings.filter(b => {
    // Only count bookings that have a certificate (student received certificate)
    if (!b.Certificate || !b.Certificate.issue_date) {
      return false;
    }
    
    // Use certificate issue_date (when certificate was issued = completion date)
    const completionDate = new Date(b.Certificate.issue_date);
    completionDate.setHours(0, 0, 0, 0);
    
    // Check if certificate was issued today
    return completionDate >= today && completionDate < tomorrow;
  });
  const todayRevenue = todayBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const todayCommission = todayRevenue * COMMISSION_RATE;
  // Return full earnings (todayRevenue) instead of after commission
  const todayEarnings = todayRevenue;

  // Format recent payments (bookings with payments, ordered by most recent)
  const recentPayments = bookings
    .filter(b => b.Payment) // Only bookings that have payments
    .slice(0, 10) // Limit to 10 most recent
    .map(b => {
      const student = b.menteeUser;
      const payment = b.Payment;
      const bookingDate = new Date(b.start_date_snapshot || b.created_at);
      
      return {
        id: payment.id,
        bookingId: b.id.substring(0, 8).toUpperCase(),
        student: {
          name: student 
            ? `${student.first_name || ''} ${student.last_name || ''}`.trim() 
            : b.acc_user_name_snapshot || 'Student',
          initials: student 
            ? `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase()
            : (b.acc_user_name_snapshot || 'S').substring(0, 2).toUpperCase()
        },
        date: bookingDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: bookingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amount: parseFloat(payment.amount || b.total_amount || 0),
        paymentDate: payment.pay_date || payment.created_at
      };
    });

  // Generate chart data (last 30 days of earnings)
  // Use updated_at (when booking was marked as completed) or start_date_snapshot (session date) for more accurate earnings timeline
  const chartData = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayBookings = completedBookings.filter(b => {
      // Use certificate issue_date (when booking was completed/certificate issued) for most accurate earnings date
      // Fallback to updated_at (when status changed to completed) if certificate doesn't exist
      // Fallback to start_date_snapshot (session date) if neither is available
      // Last resort: use created_at
      let earningsDate;
      if (b.Certificate && b.Certificate.issue_date) {
        earningsDate = new Date(b.Certificate.issue_date);
      } else if (b.updated_at) {
        earningsDate = new Date(b.updated_at);
      } else if (b.start_date_snapshot) {
        earningsDate = new Date(b.start_date_snapshot);
      } else {
        earningsDate = new Date(b.created_at);
      }
      earningsDate.setHours(0, 0, 0, 0);
      return earningsDate >= date && earningsDate < nextDate;
    });
    
    const dayEarnings = dayBookings.reduce((sum, b) => {
      const total = parseFloat(b.total_amount || 0);
      // Return full earnings without commission
      return sum + total;
    }, 0);
    
    chartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      earnings: parseFloat(dayEarnings.toFixed(2))
    });
  }

  return {
    totalSessionsCompleted: completedBookings.length,
    totalRevenue: totalRevenue.toFixed(2),
    platformCommission: platformCommission.toFixed(2),
    mentorEarnings: mentorEarnings.toFixed(2),
    lastMonthEarnings: lastMonthEarnings.toFixed(2),
    todayEarnings: todayEarnings.toFixed(2),
    commissionRate: `${(COMMISSION_RATE * 100).toFixed(0)}%`,
    recentPayments,
    chartData
  };
};

exports.getBookingStats = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view stats");

  const stats = await Booking.findAll({
    where: { mentor_id: mentor.id },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    group: ['status'],
    raw: true
  });

  const statusMap = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0
  };

  let totalBookings = 0;
  stats.forEach(s => {
    const count = parseInt(s.count);
    totalBookings += count;
    if (statusMap.hasOwnProperty(s.status)) {
      statusMap[s.status] = count;
    }
  });

  const earningsResult = await Booking.sum('total_amount', {
    where: { mentor_id: mentor.id, status: ['confirmed', 'completed'] }
  });

  const totalEarnings = earningsResult || 0;
  const platformCommission = totalEarnings * COMMISSION_RATE;
  const mentorNetEarnings = totalEarnings - platformCommission;

  return {
    totalBookings,
    totalEarnings: totalEarnings.toFixed(2),
    platformCommission: platformCommission.toFixed(2),
    mentorNetEarnings: mentorNetEarnings.toFixed(2),
    ...statusMap
  };
};

exports.getMyStudents = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Mentor not found");

  const bookings = await Booking.findAll({
    where: { mentor_id: mentor.id },
    include: [
      {
        model: AccUser,
        as: "menteeUser",
        attributes: ["id", "first_name", "last_name", "profile_image", "phone", "gender", "dob", "institution_name", "types_user"],
        include: [
          { 
            model: User, 
            attributes: ["email"] 
          }
        ]
      }
    ],
    order: [["start_date_snapshot", "DESC"]]
  });

  const studentMap = new Map();
  bookings.forEach(booking => {
    const student = booking.menteeUser;
    if (!student) return;

    if (!studentMap.has(student.id)) {
      studentMap.set(student.id, {
        id: student.id,
        userId: `U${student.id.substring(0,4).toUpperCase()}`,
        name: `${student.first_name} ${student.last_name}`,
        email: student.User.email,
        profileImage: student.profile_image || "/default-avatar.png",
        phone: student.phone,
        lastBookingDate: booking.start_date_snapshot,
        status: booking.status,
        totalBookings: 1
      });
    } else {
      const existing = studentMap.get(student.id);
      existing.totalBookings++;
      if (new Date(booking.start_date_snapshot) > new Date(existing.lastBookingDate)) {
        existing.lastBookingDate = booking.start_date_snapshot;
        existing.status = booking.status;
      }
    }
  });

  const students = Array.from(studentMap.values());

  const stats = {
    totalStudents: students.length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length
  };

  return { stats, students };
};

exports.getMyInvoices = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view invoices");

  // Get invoices with Payment (which has booking_id) and student info
  const invoices = await Invoice.findAll({
    where: { mentor_id: mentor.id },
    include: [
      {
        model: Payment,
        attributes: ["id", "amount", "status", "pay_date", "created_at", "booking_id"],
        required: false
      },
      {
        model: AccUser,
        attributes: ["id", "first_name", "last_name", "profile_image"],
        required: false,
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      }
    ],
    order: [["created_at", "DESC"]]
  });

  return invoices;
};

exports.getMyCertificates = async (mentorId) => {
  const mentor = await Mentor.findOne({ where: { user_id: mentorId } });
  if (!mentor) throw new Error("Only mentors can view certificates");

  const certificates = await Certificate.findAll({
    where: { mentor_id: mentor.id },
    include: [
      {
        model: Booking,
        attributes: ["id", "start_date_snapshot", "end_date_snapshot", "position_name_snapshot", "acc_user_name_snapshot"],
        required: false
      },
      {
        model: Position,
        attributes: ["id", "position_name"],
        required: false
      },
      {
        model: AccUser,
        attributes: ["id", "first_name", "last_name"],
        required: false,
        include: [
          {
            model: User,
            attributes: ["email"]
          }
        ]
      },
      {
        model: Mentor,
        attributes: ["id", "first_name", "last_name"],
        required: false
      }
    ],
    order: [["issue_date", "DESC"]]
  });

  return certificates;
};