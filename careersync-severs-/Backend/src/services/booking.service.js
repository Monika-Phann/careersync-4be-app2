const {
  Booking,
  AccUser,
  Mentor,
  Position,
  Session,
  ScheduleTimeslot,
  Invoice,
  Payment
} = require("../models");

exports.createBooking = async (userId, data) => {
  // 1️⃣ Resolve AccUser
  const accUser = await AccUser.findOne({
    where: { user_id: userId }
  });
  if (!accUser) throw new Error("Account not found");

  // 2️⃣ Fetch timeslot (lock availability)
  const slot = await ScheduleTimeslot.findOne({
    where: {
      id: data.schedule_timeslot_id,
      is_booked: false
    }
  });
  if (!slot) throw new Error("Timeslot unavailable");

  // 3️⃣ Fetch mentor, position, session
  const mentor = await Mentor.findByPk(data.mentor_id);
  const position = await Position.findByPk(data.position_id);
  const session = await Session.findByPk(data.session_id);

  if (!mentor || !position || !session) {
    throw new Error("Invalid booking data");
  }

  // 4️⃣ Create booking WITH SNAPSHOTS
  const booking = await Booking.create({
    schedule_timeslot_id: slot.id,
    mentor_id: mentor.id,
    acc_user_id: accUser.id,
    position_id: position.id,
    session_id: session.id,

    mentor_name_snapshot: `${mentor.first_name} ${mentor.last_name}`,
    acc_user_name_snapshot: `${accUser.first_name} ${accUser.last_name}`,
    position_name_snapshot: position.position_name,  // ✅ Fixed: use position_name instead of name
    session_price_snapshot: session.price,

    start_date_snapshot: slot.start_time,
    end_date_snapshot: slot.end_time,

    total_amount: session.price,
    status: "pending"
  });

  // 5️⃣ Mark timeslot as booked (keep the timeslot for mentor to view and manage)
  // Timeslots are kept so mentors can view old booked slots and delete them if needed
  slot.is_booked = true;
  await slot.save();
  console.log(`✅ Timeslot ${slot.id} marked as booked`);

  // 6️⃣ Create/Update Invoice with booking details
  // Check if invoice already exists for this booking
  const existingPayment = await Payment.findOne({
    where: { booking_id: booking.id }
  });

  let invoice;
  const totalAmount = parseFloat(booking.total_amount || session.price);
  
  if (existingPayment) {
    // Update existing invoice if payment exists
    invoice = await Invoice.findOne({
      where: { payment_id: existingPayment.id }
    });
    
    if (invoice) {
      await invoice.update({
        mentor_id: mentor.id,
        acc_user_id: accUser.id,
        position_id: position.id,
        total_amount: totalAmount,
        mentor_name_snapshot: booking.mentor_name_snapshot,
        mentor_position_snapshot: booking.position_name_snapshot,
        acc_user_name_snapshot: booking.acc_user_name_snapshot,
        start_date_snapshot: booking.start_date_snapshot,
        end_date_snapshot: booking.end_date_snapshot,
        session_price_snapshot: booking.session_price_snapshot,
        status: booking.status === "confirmed" ? "pending" : "pending"
      });
      console.log('✅ Invoice updated with booking details:', invoice.id);
    } else {
      // Create invoice if payment exists but invoice doesn't
      invoice = await Invoice.create({
        payment_id: existingPayment.id,
        mentor_id: mentor.id,
        acc_user_id: accUser.id,
        position_id: position.id,
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
      console.log('✅ Invoice created with booking details:', invoice.id);
    }
  } else {
    // Create payment and invoice for new booking
    const commission = totalAmount * 0.20; // 20% commission
    
    const payment = await Payment.create({
      booking_id: booking.id,
      amount: totalAmount,
      status: "pending",
      commission: commission,
      transaction_id: null,
      pay_date: null
    });

    invoice = await Invoice.create({
      payment_id: payment.id,
      mentor_id: mentor.id,
      acc_user_id: accUser.id,
      position_id: position.id,
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
    console.log('✅ Payment and Invoice created with booking details:', {
      paymentId: payment.id,
      invoiceId: invoice.id,
      totalAmount: totalAmount,
      mentorName: booking.mentor_name_snapshot
    });
  }

  return booking;
};
