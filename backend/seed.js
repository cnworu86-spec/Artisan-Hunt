require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');
const Report = require('./src/models/Report');
const Review = require('./src/models/Review');
const Admin = require('./src/models/Admin');
const Category = require('./src/models/Category');
const ActivityLog = require('./src/models/ActivityLog');
const SystemSettings = require('./src/models/SystemSettings');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/service-marketplace';

const firstNames = ['Kwame', 'Ama', 'Kofi', 'Akua', 'Yaw', 'Yaa', 'Kwadwo', 'Abena', 'Kweku', 'Afia', 'John', 'Sarah'];
const lastNames = ['Mensah', 'Osei', 'Appiah', 'Agyei', 'Acheampong', 'Owusu', 'Boateng', 'Frimpong', 'Dankwa', 'Asante', 'Smith', 'Johnson'];
const defaultCategories = [
  { name: 'Plumbing', description: 'Pipe fitting, leak repairs, and drainage maintenance', icon: 'Wrench', displayOrder: 1 },
  { name: 'Carpentry', description: 'Custom furniture, woodwork, door and roof fitting', icon: 'Hammer', displayOrder: 2 },
  { name: 'Hairdressing', description: 'Hair styling, braiding, barbering, and beauty care', icon: 'Scissors', displayOrder: 3 },
  { name: 'Electrical', description: 'Electrical wiring, appliance installation, and repairs', icon: 'Zap', displayOrder: 4 },
  { name: 'Painting', description: 'Interior and exterior wall painting and surface finishing', icon: 'Paintbrush', displayOrder: 5 },
  { name: 'Gardening', description: 'Lawn mowing, landscaping, and tree trimming', icon: 'TreeGreen', displayOrder: 6 },
  { name: 'Masonry', description: 'Bricklaying, tiling, plastering, and foundation work', icon: 'Layers', displayOrder: 7 },
  { name: 'Catering', description: 'Event food preparation, traditional cooking, and baking', icon: 'Utensils', displayOrder: 8 }
];

const regions = ['Kumasi', 'Accra', 'Takoradi', 'Tamale', 'Cape Coast', 'Sunyani'];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Seeding...');

    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      Booking.deleteMany({}),
      Report.deleteMany({}),
      Review.deleteMany({}),
      Admin.deleteMany({}),
      Category.deleteMany({}),
      ActivityLog.deleteMany({}),
      SystemSettings.deleteMany({})
    ]);

    console.log('Cleared existing collections.');

    // 1. Seed Categories
    const createdCategories = await Category.insertMany(defaultCategories);
    console.log(`Seeded ${createdCategories.length} Service Categories.`);

    // 2. Seed System Settings
    await SystemSettings.create({
      chatRetentionDays: 30,
      sessionTimeoutMinutes: 30,
      defaultUserStatus: 'active',
      emailNotifications: true,
      systemAlerts: true
    });
    console.log('Seeded System Settings.');

    // 3. Seed Admins
    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@artisanhunt.com',
      passwordHash: 'AdminPass123!',
      role: 'superadmin'
    });

    const modAdmin = await Admin.create({
      name: 'Moderator Admin',
      email: 'moderator@artisanhunt.com',
      passwordHash: 'ModPass123!',
      role: 'moderator'
    });
    console.log('Seeded Admin accounts.');

    // 4. Seed Providers (10 Providers with various verification & account statuses)
    const providers = [];
    for (let i = 0; i < 10; i++) {
      const isPending = i === 0 || i === 1; // 2 pending verification
      const isRejected = i === 2;
      const isSuspended = i === 8;
      const isBlocked = i === 9;
      const region = 'Kumasi';
      const categoryName = defaultCategories[i % defaultCategories.length].name;

      const provider = new User({
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `provider${i+1}@test.com`,
        roles: ['provider', 'client'],
        phoneNumber: `+23350000000${i}`,
        passwordHash: `ProviderPass${i+1}!`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        profileImage: i % 2 === 0 ? '/images/profile-male.png' : '/images/profile-female.png',
        dateOfBirth: new Date(1990 + i, (i * 2) % 12, 15),
        providerDetails: {
          jobTitle: `${categoryName} Specialist`,
          bio: `Professional certified ${categoryName} technician with 5+ years experience in ${region}.`,
          services: [
            { name: `Basic ${categoryName} Inspection`, priceType: 'Fixed', price: `GH₵ ${40 + i * 5}` },
            { name: `Complete ${categoryName} Repair`, priceType: 'Hourly', price: `GH₵ ${60 + i * 10}` }
          ],
          hourlyRate: 60 + (i * 10),
          isAvailable: true,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        location: {
          region,
          latitude: 5.6037 + (i * 0.02),
          longitude: -0.1870 + (i * 0.02)
        },
        verification: {
          ghanaCardNumberEncrypted: `GHA-72${1000000 + i * 54321}-0`,
          ghanaCardImage: `/images/dummy-ghana-card.jpg`,
          verificationStatus: isPending ? 'pending' : isRejected ? 'rejected' : 'verified',
          verifiedAt: isPending || isRejected ? null : new Date()
        },
        ratings: {
          averageRating: Number((4.0 + (i % 10) * 0.1).toFixed(1)),
          totalReviews: 5 + i * 3
        },
        accountStatus: {
          isSuspended,
          isBlocked,
          suspensionReason: isSuspended ? 'Flagged safety complaint under investigation' : ''
        },
        loginMetadata: {
          lastLogin: new Date(Date.now() - i * 3600000 * 4),
          loginCount: 12 + i
        }
      });

      await provider.save();
      providers.push(provider);
    }
    console.log(`Seeded ${providers.length} Artisan Providers.`);

    // 5. Seed Clients (8 Clients)
    const clients = [];
    for (let i = 0; i < 8; i++) {
      const region = 'Kumasi';
      const client = new User({
        firstName: firstNames[11 - i],
        lastName: lastNames[11 - i],
        email: `client${i+1}@test.com`,
        roles: ['client'],
        phoneNumber: `+23320000000${i}`,
        passwordHash: `ClientPass${i+1}!`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        profileImage: i % 2 === 0 ? '/images/profile-female.png' : '/images/profile-male.png',
        location: {
          region
        },
        loginMetadata: {
          lastLogin: new Date(Date.now() - i * 3600000 * 2),
          loginCount: 5 + i
        }
      });
      await client.save();
      clients.push(client);
    }
    console.log(`Seeded ${clients.length} Clients.`);

    // 6. Seed Bookings (15 Bookings with various statuses)
    const statuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    const seededBookings = [];
    const verifiedProviders = providers.filter(p => p.verification?.verificationStatus === 'verified' && !p.accountStatus?.isSuspended && !p.accountStatus?.isBlocked);

    for (let i = 0; i < 15; i++) {
      const client = clients[i % clients.length];
      const provider = verifiedProviders[i % verifiedProviders.length];
      const status = statuses[i % statuses.length];
      const categoryName = defaultCategories[i % defaultCategories.length].name;

      const booking = await Booking.create({
        bookingId: `BK-${1000 + i}`,
        clientId: client._id,
        providerId: provider._id,
        serviceCategory: categoryName,
        serviceDescription: `Request for ${categoryName} job at client residence in ${client.location.region}.`,
        bookingStatus: status,
        scheduledDate: new Date(Date.now() + (i - 5) * 86400000).toISOString().split('T')[0],
        scheduledTime: '10:00 AM',
        paymentDetails: {
          serviceAmount: 120 + i * 15,
          partsAmount: 30,
          paymentMethod: 'Mobile Money (MTN)'
        },
        locationSnapshot: {
          region: client.location.region
        }
      });
      seededBookings.push(booking);
    }
    console.log(`Seeded ${seededBookings.length} Bookings.`);

    // 7. Seed Reviews (8 Reviews)
    for (let i = 0; i < 8; i++) {
      const booking = seededBookings[i];
      await Review.create({
        bookingId: booking._id,
        reviewerId: booking.clientId,
        reviewedUserId: booking.providerId,
        rating: (i % 5) + 1,
        reviewText: i % 2 === 0 ? 'Punctual, clean work and highly respectful artisan. Recommended!' : 'Good service, came on time and fixed the issue effectively.',
        reviewType: 'client_to_provider'
      });
    }
    console.log('Seeded Platform Reviews.');

    // 8. Seed Reports (4 Incident Reports)
    const reportReasons = [
      'Unprofessional behavior during service appointment',
      'Overcharging far beyond agreed hourly rate',
      'No-show after receiving booking confirmation',
      'Damaged property during repair work'
    ];

    for (let i = 0; i < 4; i++) {
      const status = i === 0 ? 'pending' : i === 1 ? 'under_review' : 'resolved';
      await Report.create({
        reportId: `REP-${500 + i}`,
        reporterId: clients[i]._id,
        reportedUserId: providers[i]._id,
        bookingId: seededBookings[i]._id,
        reason: reportReasons[i],
        description: `Client reported that ${providers[i].firstName} ${providers[i].lastName} exhibited issues during the job execution.`,
        status,
        resolutionNotes: status === 'resolved' ? 'Reviewed evidence and mediated between both parties.' : null,
        resolvedAt: status === 'resolved' ? new Date() : null
      });
    }
    console.log('Seeded Incident Safety Reports.');

    // 9. Seed Activity Logs
    await ActivityLog.create([
      {
        adminId: superAdmin._id,
        adminName: superAdmin.name,
        adminEmail: superAdmin.email,
        action: 'System Database Seeded',
        target: 'System Infrastructure',
        details: 'Initial platform test dataset generated successfully.',
        ipAddress: '127.0.0.1'
      },
      {
        adminId: superAdmin._id,
        adminName: superAdmin.name,
        adminEmail: superAdmin.email,
        action: 'Category Added',
        target: 'Plumbing',
        details: 'Added Plumbing service category to dynamic catalog.',
        ipAddress: '127.0.0.1'
      }
    ]);
    console.log('Seeded Activity Audit Logs.');

    console.log('\n✅ Comprehensive database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
}

seed();
