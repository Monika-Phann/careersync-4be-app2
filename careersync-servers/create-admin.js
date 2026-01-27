// create-admin.js
require('dotenv').config(); // 👈 THIS IS THE MISSING KEY!

const bcrypt = require('bcrypt');
const { User, Admin, sequelize } = require('./src/models');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connected to Database: ${process.env.DB_NAME}`); // 👈 Verify the DB Name

    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'careersync168@gmail.com' } 
    });

    if (existingAdmin) {
      console.log('❌ Admin already exists!');
      process.exit(0); // Exit successfully, don't crash
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('careersyncANB168', 10);
    
    const user = await User.create({
      email: 'careersync168@gmail.com',
      password: hashedPassword,
      role_name: 'admin',
      email_verified: true,
      status: 'verified'
    });

    // Create admin profile
    const admin = await Admin.create({
      user_id: user.id,
      full_name: 'Super Admin',
      phone: '+1234567890',
      profile_image: 'default-admin.png'
    });

    console.log('✅ Admin created PERMANENTLY in', process.env.DB_NAME);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();