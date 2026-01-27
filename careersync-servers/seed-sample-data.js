/**
 * Sample Data Seeding Script
 * 
 * This script populates the database with sample data for testing the dashboard.
 * Run with: node seed-sample-data.js
 * 
 * Make sure your .env file is configured with database credentials.
 */

require('dotenv').config();
const db = require('./src/models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Helper function to get random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to get date for specific month
const getDateForMonth = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(year, monthIndex, randomDay);
};

const seedSampleData = async () => {
  try {
    console.log('🔄 Starting sample data seeding...');

    // Connect to database
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    // Clear existing sample data (optional - comment out if you want to keep existing data)
    // Uncomment the following lines if you want to clear data first:
    /*
    console.log('🗑️  Clearing existing sample data...');
    await db.Certificate.destroy({ where: {} });
    await db.Payment.destroy({ where: {} });
    await db.Booking.destroy({ where: {} });
    await db.ScheduleTimeslot.destroy({ where: {} });
    await db.Session.destroy({ where: {} });
    await db.AccUser.destroy({ where: { types_user: 'student' } });
    await db.Mentor.destroy({ where: {} });
    await db.User.destroy({ where: { role_name: ['mentor', 'acc_user'] } });
    */

    // Check if we already have mentors
    const existingMentors = await db.Mentor.findAll({ limit: 1 });
    if (existingMentors.length > 0) {
      console.log('⚠️  Sample data already exists. Skipping seed.');
      console.log('   To re-seed, uncomment the cleanup section in seed-sample-data.js');
      process.exit(0);
    }

    // 1. Create Users and Mentors (2-3 mentors)
    console.log('👨‍🏫 Creating mentors...');
    const mentors = [];
    const mentorUsers = [];

    for (let i = 0; i < 3; i++) {
      const userId = uuidv4();
      const mentorId = uuidv4();
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create User
      const user = await db.User.create({
        id: userId,
        email: `mentor${i + 1}@example.com`,
        password: hashedPassword,
        role_name: 'mentor',
        status: 'accepted',
        email_verified: true,
        email_verified_at: new Date(),
      });

      // Get a position (or create one if none exists)
      let position = await db.Position.findOne();
      if (!position) {
        // Create a default position if none exists
        const industry = await db.Industry.findOne() || await db.Industry.create({
          id: uuidv4(),
          industry_name: 'Technology',
        });
        position = await db.Position.create({
          id: uuidv4(),
          industry_id: industry.id,
          position_name: 'Software Engineer',
        });
      }

      // Get an industry (or create one)
      let industry = await db.Industry.findOne();
      if (!industry) {
        industry = await db.Industry.create({
          id: uuidv4(),
          industry_name: 'Technology',
        });
      }

      // Create Mentor
      const mentor = await db.Mentor.create({
        id: mentorId,
        user_id: userId,
        first_name: ['John', 'Sarah', 'Michael'][i],
        last_name: ['Smith', 'Johnson', 'Brown'][i],
        gender: ['male', 'female', 'male'][i],
        dob: new Date(1980 + i * 5, 0, 1),
        phone: `+1234567890${i}`,
        job_title: ['Senior Developer', 'Tech Lead', 'Engineering Manager'][i],
        position_id: position.id,
        industry_id: industry.id,
        expertise_areas: 'JavaScript, React, Node.js',
        experience_years: 5 + i * 2,
        company_name: ['Tech Corp', 'Innovate Inc', 'Code Solutions'][i],
        about_mentor: `Experienced ${['developer', 'tech lead', 'manager'][i]} with ${5 + i * 2} years in the industry.`,
        approval_status: 'approved',
        approved_at: new Date(),
      });

      mentors.push(mentor);
      mentorUsers.push({ user, mentor });
    }

    console.log(`✅ Created ${mentors.length} mentors`);

    // 2. Create Users and AccUsers (10-20 students)
    console.log('👨‍🎓 Creating students...');
    const students = [];
    const studentUsers = [];

    for (let i = 0; i < 15; i++) {
      const userId = uuidv4();
      const accUserId = uuidv4();
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create User
      const user = await db.User.create({
        id: userId,
        email: `student${i + 1}@example.com`,
        password: hashedPassword,
        role_name: 'acc_user',
        status: 'accepted',
        email_verified: true,
        email_verified_at: new Date(),
      });

      // Create AccUser
      const accUser = await db.AccUser.create({
        id: accUserId,
        user_id: userId,
        first_name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia'][i],
        last_name: ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Harris', 'Irwin', 'Jones', 'King', 'Lee', 'Martin', 'Nelson', 'Owens'][i],
        phone: `+1987654321${i}`,
        gender: ['female', 'male', 'male', 'female', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female', 'male', 'female'][i],
        dob: new Date(1995 + (i % 10), i % 12, (i % 28) + 1),
        types_user: 'student',
        institution_name: `University ${(i % 5) + 1}`,
        profile_image: 'default-avatar.png',
      });

      students.push(accUser);
      studentUsers.push({ user, accUser });
    }

    console.log(`✅ Created ${students.length} students`);

    // 3. Create Sessions for each mentor
    console.log('📚 Creating sessions...');
    const sessions = [];

    for (const mentor of mentors) {
      const position = await db.Position.findByPk(mentor.position_id);
      if (!position) continue;

      const session = await db.Session.create({
        id: uuidv4(),
        mentor_id: mentor.id,
        position_id: position.id,
        price: 50 + Math.random() * 50, // $50-$100
        location_name: 'Online Meeting',
        location_map_url: 'https://meet.google.com',
        is_available: true,
      });

      sessions.push(session);
    }

    console.log(`✅ Created ${sessions.length} sessions`);

    // 4. Create Bookings spread across the current year (100-200 bookings)
    console.log('📅 Creating bookings...');
    const currentYear = new Date().getFullYear();
    const bookings = [];
    const bookingCount = 150;

    for (let i = 0; i < bookingCount; i++) {
      const mentor = mentors[Math.floor(Math.random() * mentors.length)];
      const student = students[Math.floor(Math.random() * students.length)];
      const session = sessions.find(s => s.mentor_id === mentor.id) || sessions[0];
      const position = await db.Position.findByPk(mentor.position_id);

      // Distribute bookings across months
      const monthIndex = Math.floor(Math.random() * 12);
      const bookingDate = getDateForMonth(currentYear, monthIndex);
      const startDate = new Date(bookingDate);
      startDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);

      // Random status (weighted towards completed)
      const statusRand = Math.random();
      let status = 'pending';
      if (statusRand > 0.7) status = 'completed';
      else if (statusRand > 0.5) status = 'confirmed';
      else if (statusRand > 0.3) status = 'cancelled';

      // Create a schedule timeslot first (required for booking)
      const timeslotId = uuidv4();
      const timeslotData = {
        id: timeslotId,
        mentor_id: mentor.id,
        start_time: startDate,
        end_time: endDate,
        is_booked: status !== 'cancelled',
      };
      
      // Add session_id if the field exists (check model structure)
      try {
        await db.ScheduleTimeslot.create({
          ...timeslotData,
          session_id: session.id,
        });
      } catch (err) {
        // If session_id doesn't exist, create without it
        await db.ScheduleTimeslot.create(timeslotData);
      }

      const totalAmount = parseFloat(session.price);

      const booking = await db.Booking.create({
        id: uuidv4(),
        schedule_timeslot_id: timeslotId,
        mentor_id: mentor.id,
        acc_user_id: student.id,
        position_id: position.id,
        session_id: session.id,
        mentor_name_snapshot: `${mentor.first_name} ${mentor.last_name}`,
        acc_user_name_snapshot: `${student.first_name} ${student.last_name}`,
        position_name_snapshot: position.position_name,
        session_price_snapshot: session.price,
        start_date_snapshot: startDate,
        end_date_snapshot: endDate,
        total_amount: totalAmount,
        status: status,
        created_at: bookingDate,
        updated_at: bookingDate,
      });

      bookings.push(booking);

      // Create payment for completed bookings
      if (status === 'completed') {
        await db.Payment.create({
          id: uuidv4(),
          booking_id: booking.id,
          amount: totalAmount,
          commission: totalAmount * 0.1, // 10% commission
          status: 'paid',
          pay_date: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000), // Next day
        });
      }
    }

    console.log(`✅ Created ${bookings.length} bookings`);

    // 5. Create Certificates (5-10 per mentor)
    console.log('🏆 Creating certificates...');
    let certificateCount = 0;

    for (const mentor of mentors) {
      const mentorBookings = bookings.filter(b => b.mentor_id === mentor.id && b.status === 'completed');
      const certCount = Math.min(8, mentorBookings.length);

      for (let i = 0; i < certCount; i++) {
        const booking = mentorBookings[i];
        if (!booking) continue;

        const position = await db.Position.findByPk(booking.position_id);
        const student = await db.AccUser.findByPk(booking.acc_user_id);

        await db.Certificate.create({
          id: uuidv4(),
          booking_id: booking.id,
          position_id: booking.position_id,
          acc_user_id: booking.acc_user_id,
          mentor_id: mentor.id,
          issued_by: mentor.id,
          issue_date: new Date(booking.created_at.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after booking
          certificate_number: `CERT-${currentYear}-${String(certificateCount + 1).padStart(6, '0')}`,
          created_at: new Date(booking.created_at.getTime() + 7 * 24 * 60 * 60 * 1000),
        });

        certificateCount++;
      }
    }

    console.log(`✅ Created ${certificateCount} certificates`);

    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Mentors: ${mentors.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Bookings: ${bookings.length}`);
    console.log(`   - Certificates: ${certificateCount}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Mentor 1: mentor1@example.com / password123');
    console.log('   Mentor 2: mentor2@example.com / password123');
    console.log('   Mentor 3: mentor3@example.com / password123');
    console.log('\n💡 Note: Use the mentor ID from the database to test the dashboard endpoints.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedSampleData();

