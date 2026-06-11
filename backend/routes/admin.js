const express = require('express');
const router = express.Router();

const Tour = require('../models/Tour');
const Ticket = require('../models/Ticket');
const Artist = require('../models/Artist');
const Venue = require('../models/Venue');   

// ─────────────────────────────────────────────
// MIDDLEWARE — Role-Based Access Control Gatekeeper
// ─────────────────────────────────────────────
const requireManager = (req, res, next) => {
  const role = req.headers['x-user-role'];

  if (!role) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No role header provided. Please log in.'
    });
  }

  if (role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: `Forbidden: This endpoint requires manager privileges. Received role: '${role}'.`
    });
  }

  next();
};

// Apply the gatekeeper to ALL routes defined in this file
router.use(requireManager);

// ─────────────────────────────────────────────
// GET /api/admin/analytics
// Generates live tour sales breakdowns (Filtering out Refunded tickets)
// ─────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const analyticsData = await Ticket.aggregate([
      // 1. Only aggregate data from confirmed, active tickets
      {
        $match: {
          status: "Confirmed"
        }
      },
      // 2. Group by tour and accumulate tickets sold and total revenue
      {
        $group: {
          _id: '$tour',
          totalTicketsSold: { $sum: 1 },
          totalRevenue: { $sum: '$totalPaid' }
        }
      },
      // 3. Look up corresponding tour details
      {
        $lookup: {
          from: 'tours',
          localField: '_id',
          foreignField: '_id',
          as: 'tourDetails'
        }
      },
      {
        $unwind: {
          path: '$tourDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // 4. Look up artist details via the tour document
      {
        $lookup: {
          from: 'artists',
          localField: 'tourDetails.artist',
          foreignField: '_id',
          as: 'artistDetails'
        }
      },
      {
        $unwind: {
          path: '$artistDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // 5. Structure fields to match frontend component properties cleanly
      {
        $project: {
          _id: 1,
          totalTicketsSold: 1,
          totalRevenue: 1,
          tourTitle: { $ifNull: ['$tourDetails.title', 'Unknown Tour'] },
          tourStatus: { $ifNull: ['$tourDetails.status', 'Upcoming'] },
          artistId: {
            _id: '$artistDetails._id',
            name: '$artistDetails.name'
          },
          concertCount: {
            $cond: {
              if: { $isArray: '$tourDetails.concerts' },
              then: { $size: '$tourDetails.concerts' },
              else: 0
            }
          },
          totalRemainingTickets: {
            $cond: {
              if: { $isArray: '$tourDetails.concerts' },
              then: { $sum: '$tourDetails.concerts.availableTickets' },
              else: 0
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: analyticsData.length,
      data: analyticsData
    });

  } catch (error) {
    console.error('GET /api/admin/analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error generating financial dashboard statistics.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/tickets
// Returns a flat list of all purchased tickets for the manager ledger
// ─────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'username email')
      .populate('tour', 'title status')
      .sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
    console.error('GET /api/admin/tickets error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching master ticket logs.' });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/tickets/:ticketId
// Handles issuing full refunds and updating capacities
// ─────────────────────────────────────────────
router.delete('/tickets/:ticketId', async (req, res) => {
  const mongoose = require('mongoose');
  const session = await mongoose.startSession();

  try {
    let refundedTicket = null;

    await session.withTransaction(async () => {
      const ticket = await Ticket.findById(req.params.ticketId).session(session);

      if (!ticket) {
        throw new Error('TICKET_NOT_FOUND');
      }

      if (ticket.status === 'Refunded') {
        throw new Error('ALREADY_REFUNDED');
      }

      // Restore the ticket slot on the parent concert
      const tour = await Tour.findById(ticket.tour).session(session);

      if (tour) {
        const concert = tour.concerts.find(c => c.concertId.toString() === ticket.concertId.toString());
        if (concert) {
          concert.availableTickets += 1;
          // If it was Sold Out, open it back up
          if (concert.status === 'Sold Out') {
            concert.status = 'Scheduled';
          }
          await tour.save({ session });
        }
      }

      ticket.status = 'Refunded';
      await ticket.save({ session });
      refundedTicket = ticket;
    });

    res.status(200).json({
      success: true,
      message: 'Ticket refunded and seat restored successfully.',
      data: refundedTicket
    });

  } catch (error) {
    console.error('DELETE /api/admin/tickets/:ticketId error:', error.message);

    const errorMap = {
      TICKET_NOT_FOUND:  { status: 404, message: 'Ticket not found.' },
      ALREADY_REFUNDED:  { status: 409, message: 'This ticket has already been refunded.' }
    };

    const mapped = errorMap[error.message];
    if (mapped) {
      return res.status(mapped.status).json({ success: false, message: mapped.message });
    }

    res.status(500).json({ success: false, message: 'Refund routing process failed.' });
  } finally {
    session.endSession();
  }
});

module.exports = router;