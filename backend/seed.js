const mongoose = require('mongoose');
require('dotenv').config();

// Import the schemas you made in step 1
const User = require('./models/User');
const Artist = require('./models/Artist');
const Tour = require('./models/Tour');
const Venue = require('./models/Venue');

const seedDatabase = async () => {
  try {
    // 1. Connect to the database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB for seeding...");

    // 2. Wipe existing data so we start completely clean
    await User.deleteMany({});
    await Artist.deleteMany({});
    await Tour.deleteMany({});
    await Venue.deleteMany({});
    console.log("Cleared old data.");

    // 3. Create Sample Users (with different roles)
    const adminUser = await User.create({
      username: "manager_simra",
      email: "simra@echo.com",
      password: "password123", // Keep it plain for simplicity now
      role: "manager"
    });

    const fanUser = await User.create({
      username: "kpop_fan99",
      email: "fan@gmail.com",
      password: "password123",
      role: "customer"
    });

    // 4. Create Sample Artists (Group vs Soloist)
    const aespa = await Artist.create({
      name: "AESPA",
      type: "group",
      agency: "SM Entertainment",
      members: ["Karina", "Giselle", "Winter", "Ningning"],
      debutYear: 2020,
      description: "Metaverse K-pop girl group."
    });

    const iu = await Artist.create({
      name: "IU",
      type: "soloist",
      agency: "EDAM Entertainment",
      members: [], // Empty because she is a soloist
      debutYear: 2008,
      description: "The Nation's Sweetheart."
    });

    // 5. Create Sample Venues (with Geospatial Coordinates)
    const tokyoDome = await Venue.create({
      name: "Tokyo Dome",
      city: "Tokyo",
      country: "Japan",
      capacity: 55000,
      location: { type: "Point", coordinates: [139.7519, 35.7056] } // [Longitude, Latitude]
    });

    const stadium = await Venue.create({
      name: "Los Angeles Memorial Coliseum",
      city: "Los Angeles",
      country: "USA",
      capacity: 77500,
      location: { type: "Point", coordinates: [-118.2878, 34.0141] }
    });

    // 6. Create a Sample Tour with Embedded Concert Documents
    await Tour.create({
      title: "SYNK: PARALLEL LINE",
      artist: aespa._id, // Linking to AESPA
      year: 2026,
      status: "Upcoming",
      concerts: [
        {
          venue: tokyoDome._id,
          date: new Date("2026-08-15T19:00:00Z"),
          availableTickets: 55000,
          ticketPrice: 150,
          status: "Scheduled",
          setlist: ["Drama", "Supernova", "Black Mamba", "Spicy"],
          assignedStaff: [adminUser._id]
        },
        {
          venue: stadium._id,
          date: new Date("2026-09-02T20:00:00Z"),
          availableTickets: 77500,
          ticketPrice: 180,
          status: "Scheduled",
          setlist: ["Drama", "Supernova", "Next Level"],
          assignedStaff: [adminUser._id]
        }
      ]
    });

    console.log("🌱 Database successfully seeded with K-pop data!");
    process.exit(); // Closes the script terminal window automatically
  } catch (error) {
    console.error("❌ Seeding failed: ", error);
    process.exit(1);
  }
};

seedDatabase();