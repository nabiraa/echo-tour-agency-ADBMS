const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Tour = require('../models/Tour');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Venue = require('../models/Venue');

// ─────────────────────────────────────────────
// GET /api/tours
// Returns all tours, populating artist name and
// each concert's venue details (name, city, country)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate('artist', 'name type agency members description')
      .populate('concerts.venue', 'name city country capacity location');

    res.status(200).json({ success: true, count: tours.length, data: tours });
  } catch (error) {
    console.error('GET /api/tours error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tours.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/tours/:tourId/concerts/:concertId
// Returns a single concert's details
// Useful for the booking confirmation modal on the frontend
// ─────────────────────────────────────────────
router.get('/:tourId/concerts/:concertId', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId)
      .populate('artist', 'name')
      .populate('concerts.venue', 'name city country');

    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found.' });
    }

    const concert = tour.concerts.id(req.params.concertId);

    if (!concert) {
      return res.status(404).json({ success: false, message: 'Concert not found within this tour.' });
    }

    res.status(200).json({ success: true, data: { tour, concert } });
  } catch (error) {
    console.error('GET single concert error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching concert.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/tours/:tourId/concerts/:concertId/book
// ACID Transaction — Concurrency-Safe Ticket Booking
//
// Request body expected:
// {
//   "userId": "<valid ObjectId>",
//   "seatCategory": "VIP" | "Standing" | "Seated"
// }
//
// This route opens a MongoDB Client Session and runs
// everything inside a single transaction. If any step
// fails (e.g. race condition on last ticket), the entire
// operation is rolled back atomically.
// ─────────────────────────────────────────────
router.post('/:tourId/concerts/:concertId/book', async (req, res) => {
  const { tourId, concertId } = req.params;
  const { userId, seatCategory } = req.body;

  // ── Input validation ──────────────────────
  if (!userId || !seatCategory) {
    return res.status(400).json({
      success: false,
      message: 'userId and seatCategory are required in the request body.'
    });
  }

  if (!['VIP', 'Standing', 'Seated'].includes(seatCategory)) {
    return res.status(400).json({
      success: false,
      message: 'seatCategory must be VIP, Standing, or Seated.'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(tourId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid tourId or userId format.' });
  }

  // ── Begin MongoDB Client Session ──────────
  const session = await mongoose.startSession();

  try {
    let newTicket;

    await session.withTransaction(async () => {

      // STEP 1 — Lock and read the tour document inside the transaction
      // Using session ensures no other transaction can modify this doc
      // simultaneously (MongoDB will retry on write conflict)
      const tour = await Tour.findById(tourId).session(session);

      if (!tour) {
        throw new Error('TOUR_NOT_FOUND');
      }

      // STEP 2 — Locate the specific embedded concert sub-document
    //   const concert = tour.concerts.id(concertId);
      const concert = tour.concerts.find(
          c => c.concertId?.toString() === concertId || c._id?.toString() === concertId
        );

      if (!concert) {
        throw new Error('CONCERT_NOT_FOUND');
      }

      // STEP 3 — The core concurrency check
      // Because this read AND the following write happen inside the same
      // session, MongoDB guarantees no other booking can slip in between
      if (concert.availableTickets <= 0) {
        throw new Error('SOLD_OUT');
      }

      if (concert.status === 'Cancelled') {
        throw new Error('CONCERT_CANCELLED');
      }

      // STEP 4 — Decrement the ticket counter atomically
      concert.availableTickets -= 1;

      // Auto-flip status to Sold Out if this was the last ticket
      if (concert.availableTickets === 0) {
        concert.status = 'Sold Out';
      }

      // STEP 5 — Persist the updated tour document within the session
      await tour.save({ session });

      // STEP 6 — Create the Ticket receipt document, also within the session
      // Both the tour update and ticket creation succeed or both roll back
      const ticketData = {
        user: userId,
        tour: tourId,
        concertId: concert.concertId,
        seatCategory,
        purchaseDate: new Date(),
        status: 'Confirmed',
        totalPaid: concert.ticketPrice
      };

      // Ticket.create() with session requires array syntax
      const createdTickets = await Ticket.create([ticketData], { session });
      newTicket = createdTickets[0];
    });

    // If we reach here, the transaction committed successfully
    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully!',
      data: newTicket
    });

  } catch (error) {
    // session.withTransaction() already called abortTransaction() for us
    console.error('Booking transaction error:', error.message);

    // Map internal throw codes to clean HTTP responses
    const errorMap = {
      TOUR_NOT_FOUND:       { status: 404, message: 'Tour not found.' },
      CONCERT_NOT_FOUND:    { status: 404, message: 'Concert not found within this tour.' },
      SOLD_OUT:             { status: 409, message: 'Sorry, this concert is sold out.' },
      CONCERT_CANCELLED:    { status: 410, message: 'This concert has been cancelled.' }
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    res.status(500).json({ success: false, message: 'Booking failed due to a server error. Please try again.' });

  } finally {
    // Always end the session to free the connection back to the pool
    session.endSession();
  }
});

module.exports = router;