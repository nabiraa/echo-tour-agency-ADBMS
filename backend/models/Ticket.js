const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Purchaser
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
  concertId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID from the tour's embedded array
  seatCategory: { type: String, enum: ['VIP', 'Standing', 'Seated'], required: true },
  purchaseDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Confirmed', 'Refunded'], default: 'Confirmed' },
  totalPaid: { type: Number, required: true }
});

module.exports = mongoose.model('Ticket', TicketSchema);