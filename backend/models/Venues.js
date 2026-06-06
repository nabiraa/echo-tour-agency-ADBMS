const VenueSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Tokyo Dome"
  city: { type: String, required: true },
  country: { type: String, required: true },
  capacity: { type: Number, required: true },
  // Geospatial coordinate structure for advanced queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
});

// Creates the geospatial index needed for your advanced evaluation criteria
VenueSchema.index({ location: "2dsphere" }); 

module.exports = mongoose.model('Venue', VenueSchema);