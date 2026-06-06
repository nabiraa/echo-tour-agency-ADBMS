const ArtistSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "AESPA" or "IU"
  type: { type: String, enum: ['group', 'soloist'], required: true },
  agency: { type: String, required: true }, // e.g., "SM Entertainment"
  members: [{ type: String }], // Left empty [] for soloists, filled for groups
  debutYear: { type: Number },
  description: { type: String }
});

module.exports = mongoose.model('Artist', ArtistSchema);