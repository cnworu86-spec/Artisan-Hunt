require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/service-marketplace';

const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Michael', 'Sarah', 'David', 'Laura', 'James', 'Emily'];
const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Williams', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez'];
const services = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic', 'Cleaner', 'Gardener', 'Chef', 'Tutor', 'Hairdresser'];
const locations = ['Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi', 'Kumasi'];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove all dummy non-admin users to clean up (preserve admins)
    await User.deleteMany({ roles: { $ne: 'admin' } });
    console.log('Cleared existing non-admin users.');

    // Remove all old bookings
    await Booking.deleteMany({});
    console.log('Cleared old bookings.');

    const generatedCredentials = [];

    // Generate 10 Providers
    for (let i = 0; i < 10; i++) {
      const password = `ProviderPass${i+1}!`;
      const provider = new User({
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `provider${i+1}@test.com`,
        phoneNumber: `+23350000001${i}`,
        passwordHash: password,
        roles: ['client', 'provider'], // Providers are also clients implicitly in this app's architecture
        providerDetails: {
          jobTitle: services[i],
          bio: `Experienced ${services[i]} serving the ${locations[i]} area.`,
          services: [
            { name: `Basic ${services[i]} Consultation`, priceType: 'Fixed', price: `GH₵ ${30 + i * 5}` },
            { name: `Standard ${services[i]} Service`, priceType: 'Hourly', price: `GH₵ ${50 + i * 10}` }
          ],
          hourlyRate: 50 + (i * 10),
          isAvailable: true,
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        location: {
          region: locations[i],
          latitude: 5.6037 + (i * 0.01),
          longitude: -0.1870 + (i * 0.01)
        },
        verification: {
          verificationStatus: 'verified',
          verifiedAt: new Date()
        },
        ratings: {
          averageRating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
          totalReviews: Math.floor(Math.random() * 50) + 1
        }
      });
      await provider.save();
      generatedCredentials.push({ role: 'Provider', email: provider.email, password, name: `${provider.firstName} ${provider.lastName}`, service: services[i] });
    }

    // Generate 10 Clients
    for (let i = 0; i < 10; i++) {
      const password = `ClientPass${i+1}!`;
      const client = new User({
        firstName: firstNames[9 - i],
        lastName: lastNames[9 - i],
        email: `client${i+1}@test.com`,
        phoneNumber: `+23320000001${i}`,
        passwordHash: password,
        roles: ['client'],
        location: {
          region: locations[9 - i]
        }
      });
      await client.save();
      generatedCredentials.push({ role: 'Client', email: client.email, password, name: `${client.firstName} ${client.lastName}` });
    }

    const fs = require('fs');
    const path = require('path');
    let mdOutput = '\n\n## Seeded Test Accounts\n\n### Providers\n';
    generatedCredentials.filter(c => c.role === 'Provider').forEach(c => {
      mdOutput += `- **Name:** ${c.name} | **Service:** ${c.service} | **Email:** ${c.email} | **Password:** ${c.password}\n`;
    });
    
    mdOutput += '\n### Clients\n';
    generatedCredentials.filter(c => c.role === 'Client').forEach(c => {
      mdOutput += `- **Name:** ${c.name} | **Email:** ${c.email} | **Password:** ${c.password}\n`;
    });

    const checksPath = path.join(__dirname, '../checks.md');
    if (fs.existsSync(checksPath)) {
      fs.appendFileSync(checksPath, mdOutput);
      console.log('Appended credentials to checks.md');
    } else {
      console.log('Could not find checks.md to append to.');
    }

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
