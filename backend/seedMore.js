const mongoose = require('mongoose');
require('dotenv').config();

// Import Models
const User = require('./models/User');
const Artist = require('./models/Artist');
const Venue = require('./models/Venue');
const Tour = require('./models/Tour');
const Ticket = require('./models/Ticket');

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected! Purging existing collections to build the master dataset...');

    // Wipe collections to prevent duplicate key constraint crashes
    await User.deleteMany({});
    await Artist.deleteMany({});
    await Venue.deleteMany({});
    await Tour.deleteMany({});
    await Ticket.deleteMany({});

    // 1️⃣ SEED USERS (With dummy passwords for schema validation)
    console.log('👥 Seeding Users...');
    const users = await User.create([
      { username: 'hanni_fan99', email: 'hanni@echo.com', password: 'password123', role: 'customer' },
      { username: 'felix_stay', email: 'felix@echo.com', password: 'password123', role: 'customer' },
      { username: 'karina_core', email: 'karina@echo.com', password: 'password123', role: 'customer' },
      { username: 'kpop_manager1', email: 'manager1@echo.com', password: 'password123', role: 'manager' },
      { username: 'global_director', email: 'director@echo.com', password: 'password123', role: 'manager' }
    ]);

    const customerIds = users.filter(u => u.role === 'customer').map(u => u._id);
    const managerId = users.find(u => u.role === 'manager')._id;

    // 2️⃣ SEED ARTISTS (Groups + Soloists with matching case-sensitive types and populated members)
    console.log('🎤 Seeding Artists (Groups & Soloists)...');
    const artists = await Artist.create([
      {
        name: 'AESPA',
        type: 'group',
        agency: 'SM Entertainment',
        debutYear: 2020,
        members: ['Karina', 'Giselle', 'Winter', 'Ningning'],
        description: 'Next-generation hyper-pop girl group utilizing innovative virtual avatar concepts.'
      },
      {
        name: 'NewJeans',
        type: 'group',
        agency: 'ADOR',
        debutYear: 2022,
        members: ['Minji', 'Hanni', 'Danielle', 'Haerin', 'Hyein'],
        description: 'A trailblazing global girl group leading the easy-listening Y2K pop resurgence.'
      },
      {
        name: 'Stray Kids',
        type: 'group',
        agency: 'JYP Entertainment',
        debutYear: 2018,
        members: ['Bang Chan', 'Lee Know', 'Changbin', 'Hyunjin', 'Han', 'Felix', 'Seungmin', 'I.N'],
        description: 'Self-producing powerhouse group renowned for intense electronic, high-energy performances.'
      },
      {
        name: 'IU',
        type: 'soloist', // 👈 Solo Artist Type
        agency: 'EDAM Entertainment',
        debutYear: 2008,
        members: [], // Soloists have empty member arrays
        description: 'South Korea\'s premier singer-songwriter and national icon, dominating charts for over a decade.'
      },
      {
        name: 'Taeyeon',
        type: 'soloist', // 👈 Another Solo Artist Type
        agency: 'SM Entertainment',
        debutYear: 2007,
        members: [], 
        description: 'Vocal powerhouse, leader of Girls\' Generation, and highly successful solo ballad/pop star.'
      }
    ]);

    // 3️⃣ SEED VENUES (Global stop data arrays)
    console.log('🏟️ Seeding Venues...');
    const venues = await Venue.create([
      {
        name: 'Tokyo Dome',
        city: 'Tokyo',
        country: 'Japan',
        capacity: 55000,
        location: { type: 'Point', coordinates: [139.7518, 35.7056] }
      },
      {
        name: 'Kyocera Dome',
        city: 'Osaka',
        country: 'Japan',
        capacity: 36000,
        location: { type: 'Point', coordinates: [135.4761, 34.6694] }
      },
      {
        name: 'KSPO Dome',
        city: 'Seoul',
        country: 'South Korea',
        capacity: 15000,
        location: { type: 'Point', coordinates: [127.1274, 37.5193] }
      },
      {
        name: 'The O2 Arena',
        city: 'London',
        country: 'United Kingdom',
        capacity: 20000,
        location: { type: 'Point', coordinates: [-0.0032, 51.5030] }
      }
    ]);

    // 4️⃣ SEED TOURS & CONCERTS (Using hardcoded references to prevent data drift)
    console.log('🗺️ Seeding Combined World Tours...');
    
    const cId1 = new mongoose.Types.ObjectId();
    const cId2 = new mongoose.Types.ObjectId();
    const cId3 = new mongoose.Types.ObjectId();
    const cId4 = new mongoose.Types.ObjectId();
    const cId5 = new mongoose.Types.ObjectId();

    const tours = await Tour.create([
      {
        title: 'SYNK: PARALLEL LINE',
        artist: artists.find(a => a.name === 'AESPA')._id,
        year: 2025,
        status: 'Completed',
        concerts: [
          {
            concertId: cId1,
            venue: venues.find(v => v.name === 'Tokyo Dome')._id,
            date: new Date('2025-08-10T18:00:00Z'),
            availableTickets: 0,
            ticketPrice: 140,
            status: 'Sold Out',
            setlist: ['Drama', 'Black Mamba', 'Supernova', 'Spicy', 'Armageddon'],
            assignedStaff: [managerId]
          }
        ]
      },
      {
        title: 'HEREH World Tour',
        artist: artists.find(a => a.name === 'IU')._id,
        year: 2025,
        status: 'Completed',
        concerts: [
          {
            concertId: cId2,
            venue: venues.find(v => v.name === 'KSPO Dome')._id,
            date: new Date('2025-03-02T19:00:00Z'),
            availableTickets: 0,
            ticketPrice: 130,
            status: 'Sold Out',
            setlist: ['Holssi', 'BBIBBI', 'Blueming', 'Love Wins All', 'Palette'],
            assignedStaff: [managerId]
          }
        ]
      },
      {
        title: 'Bunnies Camp: Global Groove',
        artist: artists.find(a => a.name === 'NewJeans')._id,
        year: 2026,
        status: 'Ongoing',
        concerts: [
          {
            concertId: cId3,
            venue: venues.find(v => v.name === 'KSPO Dome')._id,
            date: new Date('2026-07-15T19:00:00Z'),
            availableTickets: 120, // Low inventory to let fans buy out during validation
            ticketPrice: 150,
            status: 'Scheduled',
            setlist: ['Attention', 'Hype Boy', 'Ditto', 'OMG', 'Super Shy', 'How Sweet'],
            assignedStaff: [managerId]
          }
        ]
      },
      {
        title: 'DOMINATE World Tour',
        artist: artists.find(a => a.name === 'Stray Kids')._id,
        year: 2026,
        status: 'Upcoming',
        concerts: [
          {
            concertId: cId4,
            venue: venues.find(v => v.name === 'Kyocera Dome')._id,
            date: new Date('2026-09-10T18:00:00Z'),
            availableTickets: 36000,
            ticketPrice: 165,
            status: 'Scheduled',
            setlist: ['S-Class', 'MANIAC', 'Gods Menu', 'Thunderous', 'Chk Chk Boom'],
            assignedStaff: [managerId]
          }
        ]
      },
      {
        title: 'The Odd Of Love: Special Edition',
        artist: artists.find(a => a.name === 'Taeyeon')._id,
        year: 2026,
        status: 'Upcoming',
        concerts: [
          {
            concertId: cId5,
            venue: venues.find(v => v.name === 'The O2 Arena')._id,
            date: new Date('2026-11-20T20:00:00Z'),
            availableTickets: 20000,
            ticketPrice: 175,
            status: 'Scheduled',
            setlist: ['INVU', 'Spark', 'Fine', 'What Do I Call You', 'Four Seasons'],
            assignedStaff: [managerId]
          }
        ]
      }
    ]);

    // 5️⃣ SEED TICKETS (Populates rich metrics for the Manager Aggregation pipelines)
    console.log('🎟️ Seeding Financial Tickets...');
    await Ticket.create([
      {
        user: customerIds[0],
        tour: tours.find(t => t.title === 'SYNK: PARALLEL LINE')._id,
        concertId: cId1,
        seatCategory: 'VIP',
        purchaseDate: new Date('2025-06-01T10:00:00Z'),
        status: 'Confirmed',
        totalPaid: 140
      },
      {
        user: customerIds[1],
        tour: tours.find(t => t.title === 'HEREH World Tour')._id,
        concertId: cId2,
        seatCategory: 'Standing',
        purchaseDate: new Date('2025-01-15T12:30:00Z'),
        status: 'Confirmed',
        totalPaid: 130
      },
      {
        user: customerIds[2],
        tour: tours.find(t => t.title === 'Bunnies Camp: Global Groove')._id,
        concertId: cId3,
        seatCategory: 'VIP',
        purchaseDate: new Date('2026-05-12T09:15:00Z'),
        status: 'Confirmed',
        totalPaid: 150
      }
    ]);

    console.log('🏁 Success! Master database compiled with original & new data structures.');
    process.exit(0);
  } catch (error) {
    console.error('🔥 Seeding encountered a critical failure:', error.message);
    process.exit(1);
  }
};

seedDatabase();