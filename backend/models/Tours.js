const ConcertSchema = new mongoose.Schema({
  concertId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true }, // References Venue
  date: { type: Date, required: true },
  availableTickets: { type: Number, required: true }, // Dynamic ticket tracker
  ticketPrice: { type: Number, required: true },
  status: { type: String, enum: ['Scheduled', 'Sold Out', 'Cancelled'], default: 'Scheduled' },
  setlist: [{ type: String }], // Ordered array of songs (Addresses project proposal requirement)
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Internal staff tracking
});

const TourSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "SYNK: PARALLEL LINE"
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true }, // References Artist
  year: { type: Number, required: true },
  status: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed'], default: 'Upcoming' },
  concerts: [ConcertSchema] // Embedded Array of Concert documents
});

module.exports = mongoose.model('Tour', TourSchema);