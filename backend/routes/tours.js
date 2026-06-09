const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Tour = require('../models/Tour');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Artist = require('../models/Artist');
const Venue = require('../models/Venue');

// =============================================================================
// 1. GET ALL TOURS (Read)
// Endpoint: GET /api/tours
// =============================================================================
router.get('/', async (req, res) => {
  try {
    const tours = await Tour.find()
      .populate('artist', 'name type agency members description')
      .populate('concerts.venue', 'name city country capacity location');
    
    // Restored 'count' property to ensure admin dashboard / analytics views don't break!
    res.status(200).json({ success: true, count: tours.length, data: tours });
  } catch (error) {
    console.error('GET /api/tours error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tours.' });
  }
});

// =============================================================================
// 2. GET SINGLE CONCERT
// Endpoint: GET /api/tours/:tourId/concerts/:concertId
// =============================================================================
router.get('/:tourId/concerts/:concertId', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId)
      .populate('artist')
      .populate('concerts.venue');
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found.' });
    }
    const concert = tour.concerts.id(req.params.concertId);
    if (!concert) {
      return res.status(404).json({ success: false, message: 'Concert not found.' });
    }
    res.status(200).json({ success: true, data: { tour, concert } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================================================
// 3. CREATE NEW TOUR (Create)
// Endpoint: POST /api/tours
// =============================================================================
router.post('/', async (req, res) => {
  try {
    const { title, year, artist, status, concerts } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ success: false, message: "Title and Artist ID are required." });
    }

    const newTour = new Tour({
      title,
      year,
      artist,
      status,
      concerts: concerts || []
    });

    const savedTour = await newTour.save();
    res.status(201).json({ success: true, message: "Tour created successfully!", data: savedTour });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================================================
// 4. UPDATE TOUR STATUS (Update)
// Endpoint: PATCH /api/tours/:id
// =============================================================================
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ success: false, message: "Tour not found." });
    }

    res.json({ success: true, message: "Tour updated successfully!", data: updatedTour });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================================================
// 5. DELETE TOUR (Delete)
// Endpoint: DELETE /api/tours/:id
// =============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    
    if (!deletedTour) {
      return res.status(404).json({ success: false, message: "Tour not found." });
    }

    res.json({ success: true, message: "Tour deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================================================
// 6. BOOK A TICKET (ACID Transaction)
// Endpoint: POST /api/tours/:tourId/concerts/:concertId/book
// =============================================================================
router.post('/:tourId/concerts/:concertId/book', async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let newTicket;
    await session.withTransaction(async () => {
      const { tourId, concertId } = req.params;
      const { userId, seatCategory } = req.body;

      const tour = await Tour.findById(tourId).session(session);
      if (!tour) throw new Error('TOUR_NOT_FOUND');

      // const concert = tour.concerts.id(concertId);
      const concert = tour.concerts.find(c => c.concertId.toString() === concertId);
      if (!concert) throw new Error('CONCERT_NOT_FOUND');
      if (concert.availableTickets <= 0) throw new Error('SOLD_OUT');

      // Update Inventory
      concert.availableTickets -= 1;
      if (concert.availableTickets === 0) {
        concert.status = "Sold Out";
      }
      await tour.save({ session });

      // Create Ticket Data
      const ticketData = {
        user: userId || "6a24a2dc7091b2a6ef7d580f",
        tour: tourId,
        concertId: concertId,
        seatCategory: seatCategory || "General Admission",
        status: 'Confirmed',
        totalPaid: concert.ticketPrice
      };

      const createdTickets = await Ticket.create([ticketData], { session });
      newTicket = createdTickets[0];
    });

    res.status(201).json({
      success: true,
      message: 'Ticket booked successfully!',
      data: newTicket
    });

  } catch (error) {
    console.error('Booking transaction error:', error.message);
    const errorMap = {
      TOUR_NOT_FOUND:       { status: 404, message: 'Tour not found.' },
      CONCERT_NOT_FOUND:    { status: 404, message: 'Concert not found within this tour.' },
      SOLD_OUT:             { status: 409, message: 'Sorry, this concert is sold out.' }
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }
    res.status(500).json({ success: false, message: 'Booking failed.' });
  } finally {
    session.endSession();
  }
});

module.exports = router;