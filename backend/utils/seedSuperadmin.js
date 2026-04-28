/**
 * Superadmin Seeder
 * Ensures default superadmin and admin users exist in the database
 * Runs automatically on server start
 */

const User = require('../models/User');

/**
 * Create default superadmin and admin if they don't exist
 * Passwords are hashed automatically via User model pre-save hook
 */
const seedSuperadmin = async () => {
  try {
    // Check if any superadmin exists
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });

    if (!existingSuperadmin) {
      // Create default superadmin
      const superadmin = await User.create({
        name: process.env.SUPERADMIN_NAME || 'Super Administrator',
        email: process.env.SUPERADMIN_EMAIL || 'superadmin@company.com',
        password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!',
        company: process.env.SUPERADMIN_COMPANY || 'System',
        role: 'superadmin'
      });

      console.log('✓ Default superadmin created successfully');
      console.log(`  Email: ${superadmin.email}`);
      console.log('  Password: SuperAdmin123!');
      console.log('  ⚠️  Please change the default password after first login!');
    } else {
      console.log('✓ Superadmin already exists');
    }

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      // Create default admin
      const admin = await User.create({
        name: process.env.ADMIN_NAME || 'Admin User',
        email: process.env.ADMIN_EMAIL || 'admin@company.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
        company: process.env.ADMIN_COMPANY || 'System',
        role: 'admin'
      });

      console.log('✓ Default admin created successfully');
      console.log(`  Email: ${admin.email}`);
      console.log('  Password: Admin123!');
      console.log('  ⚠️  Please change the default password after first login!');
    } else {
      console.log('✓ Admin already exists');
    }

  } catch (error) {
    console.error('✗ Error seeding users:', error.message);
    // Don't exit process - allow server to continue
  }
};

module.exports = seedSuperadmin;
